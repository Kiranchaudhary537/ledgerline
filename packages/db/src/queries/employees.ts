import type { EmployeeCreate, EmployeeUpdate, Filters, ListQuery, SortOption } from '@acme/shared';
import { type Selectable, sql } from 'kysely';
import type { Db } from '../client.ts';
import type { Employees } from '../types.ts';
import { employeeFilters } from './filters.ts';

/** Every column except deletedAt, which callers never need. */
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

export type Employee = Omit<Selectable<Employees>, 'deletedAt'>;
export type MutationResult =
  { status: 'ok'; employee: Employee } | { status: 'not_found' } | { status: 'stale' };

const SORT_COLUMNS = {
  name: 'fullName',
  hireDate: 'hireDate',
  level: 'level', // enum: Postgres sorts by declaration order, which is seniority
  salary: 'salaryMinor',
} as const;

/** 'name:asc' → [column, direction]. Callers add `id` as the tie-breaker so paging is stable. */
function parseSort(sort: SortOption) {
  const [field, dir] = sort.split(':') as [keyof typeof SORT_COLUMNS, 'asc' | 'desc'];
  return [SORT_COLUMNS[field], dir] as const;
}

export async function listEmployees(
  db: Db,
  query: ListQuery,
): Promise<{ data: Employee[]; total: number }> {
  const where = (eb: Parameters<typeof employeeFilters>[0]) => employeeFilters(eb, query);
  const [column, dir] = parseSort(query.sort);
  const [data, count] = await Promise.all([
    db
      .selectFrom('employees')
      .select(COLUMNS)
      .where(where)
      .orderBy(column, dir)
      .orderBy('id')
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
      .execute(),
    db
      .selectFrom('employees')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where(where)
      .executeTakeFirstOrThrow(),
  ]);
  return { data, total: count.total };
}

export function getEmployee(db: Db, id: number): Promise<Employee | undefined> {
  return db
    .selectFrom('employees')
    .select(COLUMNS)
    .where('id', '=', id)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();
}

/** A duplicate active email raises Postgres 23505 (employees_email_active); the API maps it. */
export function createEmployee(
  db: Db,
  input: EmployeeCreate,
  changedBy: number,
): Promise<Employee> {
  return db.transaction().execute(async (trx) => {
    const employee = await trx
      .insertInto('employees')
      .values(input)
      .returning(COLUMNS)
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
    return employee;
  });
}

/** Optimistic lock: only applies when `version` matches. Salary is changed via changeSalary. */
export async function updateEmployee(
  db: Db,
  id: number,
  { version, ...fields }: EmployeeUpdate,
): Promise<MutationResult> {
  const employee = await db
    .updateTable('employees')
    .set({ ...fields, version: sql`version + 1`, updatedAt: sql`now()` })
    .where('id', '=', id)
    .where('version', '=', version)
    .where('deletedAt', 'is', null)
    .returning(COLUMNS)
    .executeTakeFirst();
  if (employee) return { status: 'ok', employee };
  // No row updated: either it does not exist (or is deleted), or the version moved on.
  return (await getEmployee(db, id)) ? { status: 'stale' } : { status: 'not_found' };
}

/** Returns false when there was nothing to delete (missing or already deleted). */
export async function softDeleteEmployee(db: Db, id: number): Promise<boolean> {
  const row = await db
    .updateTable('employees')
    .set({ deletedAt: sql`now()` })
    .where('id', '=', id)
    .where('deletedAt', 'is', null)
    .returning('id')
    .executeTakeFirst();
  return row !== undefined;
}

/** Salary update and its history row commit together or not at all. */
export function changeSalary(
  db: Db,
  input: { id: number; newSalaryMinor: number; reason: string; version: number; changedBy: number },
): Promise<MutationResult> {
  return db.transaction().execute(async (trx): Promise<MutationResult> => {
    const current = await trx
      .selectFrom('employees')
      .select(['version', 'salaryMinor'])
      .where('id', '=', input.id)
      .where('deletedAt', 'is', null)
      .forUpdate()
      .executeTakeFirst();
    if (!current) return { status: 'not_found' };
    if (current.version !== input.version) return { status: 'stale' };

    const employee = await trx
      .updateTable('employees')
      .set({
        salaryMinor: input.newSalaryMinor,
        version: sql`version + 1`,
        updatedAt: sql`now()`,
      })
      .where('id', '=', input.id)
      .returning(COLUMNS)
      .executeTakeFirstOrThrow();
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
    return { status: 'ok', employee };
  });
}

/** Newest first. changedByName is null for imported history. */
export function getSalaryHistory(db: Db, employeeId: number) {
  return db
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

/** All matching rows in order, for CSV. */
export function exportEmployees(db: Db, filters: Filters, sort: SortOption): Promise<Employee[]> {
  // shortcut: loads every row into memory (fine at ~10k); stream with a cursor if it grows to 100k+.
  const [column, dir] = parseSort(sort);
  return db
    .selectFrom('employees')
    .select(COLUMNS)
    .where((eb) => employeeFilters(eb, filters))
    .orderBy(column, dir)
    .orderBy('id')
    .execute();
}
