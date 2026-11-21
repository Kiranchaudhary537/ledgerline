import {
  config,
  type EmployeeCreate,
  type EmployeeUpdate,
  type Filters,
  type ListQuery,
  type SortOption,
} from '@acme/shared';
import { type Selectable, sql } from 'kysely';
import type { Db } from '../client.ts';
import type { Employees } from '../types.ts';
import { employeeFilters } from './filters.ts';

const COLUMNS = [
  'id',
  'employeeCode',
  'fullName',
  'email',
  'department',
  'jobTitle',
  'level',
  'countryCode',
  'employmentType',
  'gender',
  'hireDate',
  'salaryMinor',
  'version',
  'createdAt',
  'updatedAt',
] as const;

/** compaRatio = salary ÷ median of the same country × title × level × employment type. */
export type Employee = Omit<Selectable<Employees>, 'deletedAt'> & { compaRatio: number };
export type MutationResult =
  { status: 'ok'; employee: Employee } | { status: 'not_found' } | { status: 'stale' };

export interface SalaryChangeRequest {
  id: number;
  newSalaryMinor: number;
  reason: string;
  version: number;
  changedBy: number;
}

const SORT_COLUMNS = {
  name: 'employees.fullName',
  hireDate: 'employees.hireDate',
  level: 'employees.level', // enum: Postgres sorts by declaration order, which is seniority
  salary: 'employees.salaryMinor',
  compaRatio: 'compaRatio',
} as const;

const QUALIFIED = COLUMNS.map((c) => `employees.${c}` as const);

/**
 * Active employees with their compa-ratio. Band medians are computed over ALL active employees,
 * so a person's ratio does not change when the list is filtered.
 */
function employeesWithCompa(db: Db) {
  return db
    .with('bands', (qb) =>
      qb
        .selectFrom('employees')
        .where('deletedAt', 'is', null)
        .select([
          'countryCode',
          'jobTitle',
          'level',
          'employmentType',
          sql<number>`percentile_cont(0.5) within group (order by salary_minor)`.as('median'),
        ])
        .groupBy(['countryCode', 'jobTitle', 'level', 'employmentType']),
    )
    .selectFrom('employees')
    .innerJoin('bands', (join) =>
      join
        .onRef('bands.countryCode', '=', 'employees.countryCode')
        .onRef('bands.jobTitle', '=', 'employees.jobTitle')
        .onRef('bands.level', '=', 'employees.level')
        .onRef('bands.employmentType', '=', 'employees.employmentType'),
    )
    .select(QUALIFIED)
    .select(
      sql<number>`round((employees.salary_minor / bands.median)::numeric, ${sql.lit(config.compaRatio.decimals)})`.as(
        'compaRatio',
      ),
    );
}

/** Takes the connection explicitly so it also works inside a transaction. */
function findEmployee(db: Db, id: number): Promise<Employee | undefined> {
  return employeesWithCompa(db)
    .where('employees.id', '=', id)
    .where('employees.deletedAt', 'is', null)
    .executeTakeFirst();
}

/** 'name:asc' → [column, direction]. Callers add `id` as the tie-breaker so paging is stable. */
function parseSort(sort: SortOption) {
  const [field, dir] = sort.split(':') as [keyof typeof SORT_COLUMNS, 'asc' | 'desc'];
  return [SORT_COLUMNS[field], dir] as const;
}

export class EmployeeRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async list(query: ListQuery): Promise<{ data: Employee[]; total: number }> {
    const where = (eb: Parameters<typeof employeeFilters>[0]) => employeeFilters(eb, query);
    const [column, dir] = parseSort(query.sort);
    const [data, count] = await Promise.all([
      employeesWithCompa(this.db)
        .where(where)
        .orderBy(column, dir)
        .orderBy('employees.id')
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .execute(),
      this.db
        .selectFrom('employees')
        .select((eb) => eb.fn.countAll<number>().as('total'))
        .where(where)
        .executeTakeFirstOrThrow(),
    ]);
    return { data, total: count.total };
  }

  get(id: number): Promise<Employee | undefined> {
    return findEmployee(this.db, id);
  }

  /** A duplicate active email raises Postgres 23505 (employees_email_active); the API maps it. */
  create(input: EmployeeCreate, changedBy: number): Promise<Employee> {
    return this.db.transaction().execute(async (trx) => {
      const employee = await trx
        .insertInto('employees')
        .values(input)
        .returning(['id', 'salaryMinor'])
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('salaryChanges')
        .values({
          employeeId: employee.id,
          oldSalaryMinor: null,
          newSalaryMinor: employee.salaryMinor,
          reason: 'Starting salary',
          changedBy,
        })
        .execute();
      // Re-read: the compa-ratio depends on the whole band.
      return (await findEmployee(trx, employee.id))!;
    });
  }

  /** Optimistic lock: only applies when `version` matches. Salary changes go through changeSalary. */
  async update(id: number, { version, ...fields }: EmployeeUpdate): Promise<MutationResult> {
    const updated = await this.db
      .updateTable('employees')
      .set({ ...fields, version: sql`version + 1`, updatedAt: sql`now()` })
      .where('id', '=', id)
      .where('version', '=', version)
      .where('deletedAt', 'is', null)
      .returning('id')
      .executeTakeFirst();
    if (updated) return { status: 'ok', employee: (await findEmployee(this.db, id))! };
    // No row updated: it is missing or deleted, or the version moved on.
    return (await findEmployee(this.db, id)) ? { status: 'stale' } : { status: 'not_found' };
  }

  /** Returns false when there was nothing to delete (missing or already deleted). */
  async softDelete(id: number): Promise<boolean> {
    const row = await this.db
      .updateTable('employees')
      .set({ deletedAt: sql`now()` })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returning('id')
      .executeTakeFirst();
    return row !== undefined;
  }

  /** Salary update and its history row commit together or not at all. */
  changeSalary(input: SalaryChangeRequest): Promise<MutationResult> {
    return this.db.transaction().execute(async (trx): Promise<MutationResult> => {
      const current = await trx
        .selectFrom('employees')
        .select(['version', 'salaryMinor'])
        .where('id', '=', input.id)
        .where('deletedAt', 'is', null)
        .forUpdate()
        .executeTakeFirst();
      if (!current) return { status: 'not_found' };
      if (current.version !== input.version) return { status: 'stale' };

      await trx
        .updateTable('employees')
        .set({
          salaryMinor: input.newSalaryMinor,
          version: sql`version + 1`,
          updatedAt: sql`now()`,
        })
        .where('id', '=', input.id)
        .execute();
      await trx
        .insertInto('salaryChanges')
        .values({
          employeeId: input.id,
          oldSalaryMinor: current.salaryMinor,
          newSalaryMinor: input.newSalaryMinor,
          reason: input.reason,
          changedBy: input.changedBy,
        })
        .execute();
      return { status: 'ok', employee: (await findEmployee(trx, input.id))! };
    });
  }

  /** Newest first. changedByName is null for imported history. */
  history(employeeId: number) {
    return this.db
      .selectFrom('salaryChanges as sc')
      .leftJoin('users as u', 'u.id', 'sc.changedBy')
      .select([
        'sc.id',
        'sc.oldSalaryMinor',
        'sc.newSalaryMinor',
        'sc.reason',
        'sc.changedAt',
        'u.name as changedByName',
      ])
      .where('sc.employeeId', '=', employeeId)
      .orderBy('sc.changedAt', 'desc')
      .orderBy('sc.id', 'desc')
      .execute();
  }

  export(filters: Filters, sort: SortOption): Promise<Employee[]> {
    // shortcut: loads every row into memory (fine at ~10k); stream with a cursor if it grows to 100k+.
    const [column, dir] = parseSort(sort);
    return employeesWithCompa(this.db)
      .where((eb) => employeeFilters(eb, filters))
      .orderBy(column, dir)
      .orderBy('employees.id')
      .execute();
  }
}
