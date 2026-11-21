import type { EmployeeCreate, ListQuery } from '@acme/shared';
import type { Insertable } from 'kysely';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../testing.ts';
import type { Employees } from '../types.ts';
import { EmployeeRepository } from './employee-repository.ts';

const db = createTestDb();
const employees = new EmployeeRepository(db);
afterAll(() => db.destroy());
beforeEach(() => resetDb(db));

const base: Insertable<Employees> = {
  fullName: 'Priya Sharma',
  email: 'priya.sharma@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 100,
};

const newEmployee: EmployeeCreate = {
  fullName: 'Nina Park',
  email: 'nina.park@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'mid',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2022-01-10',
  salaryMinor: 500,
};

const query = (q: Partial<ListQuery> = {}): ListQuery => ({
  sort: 'name:asc',
  page: 1,
  pageSize: 25,
  ...q,
});

/** Inserts employees (unique emails unless overridden) and returns their ids in order. */
async function seed(rows: Partial<Insertable<Employees>>[]): Promise<number[]> {
  const inserted = await db
    .insertInto('employees')
    .values(rows.map((r, i) => ({ ...base, email: `e${i}@acme.example`, ...r })))
    .returning('id')
    .execute();
  return inserted.map((r) => r.id);
}

async function makeUser(name = 'Hana HR'): Promise<number> {
  const user = await db
    .insertInto('users')
    .values({ email: 'hr@acme.example', name, passwordHash: 'x' })
    .returning('id')
    .executeTakeFirstOrThrow();
  return user.id;
}

const listNames = async (q: Partial<ListQuery>) =>
  (await employees.list(query(q))).data.map((e) => e.fullName);

describe('listEmployees', () => {
  it('sorts by name, hire date and salary in both directions', async () => {
    await seed([
      { fullName: 'B', hireDate: '2020-01-01', salaryMinor: 300 },
      { fullName: 'A', hireDate: '2022-01-01', salaryMinor: 100 },
      { fullName: 'C', hireDate: '2021-01-01', salaryMinor: 200 },
    ]);
    expect(await listNames({ sort: 'name:asc' })).toEqual(['A', 'B', 'C']);
    expect(await listNames({ sort: 'name:desc' })).toEqual(['C', 'B', 'A']);
    expect(await listNames({ sort: 'hireDate:asc' })).toEqual(['B', 'C', 'A']);
    expect(await listNames({ sort: 'hireDate:desc' })).toEqual(['A', 'C', 'B']);
    expect(await listNames({ sort: 'salary:asc' })).toEqual(['A', 'C', 'B']);
    expect(await listNames({ sort: 'salary:desc' })).toEqual(['B', 'C', 'A']);
  });

  it('sorts level by seniority, not alphabetically', async () => {
    await seed([
      { fullName: 'P', level: 'principal' },
      { fullName: 'J', level: 'junior' },
      { fullName: 'L', level: 'lead' },
      { fullName: 'M', level: 'mid' },
    ]);
    expect(await listNames({ sort: 'level:asc' })).toEqual(['J', 'M', 'L', 'P']);
    expect(await listNames({ sort: 'level:desc' })).toEqual(['P', 'L', 'M', 'J']);
  });

  it('breaks ties by id so paging is stable', async () => {
    const ids = await seed([{ fullName: 'Same' }, { fullName: 'Same' }, { fullName: 'Same' }]);
    const ordered = async (q: Partial<ListQuery>) =>
      (await employees.list(query(q))).data.map((e) => e.id);
    expect(await ordered({})).toEqual(ids);
    expect(await ordered({ sort: 'name:desc' })).toEqual(ids);
    expect([
      ...(await ordered({ pageSize: 2 })),
      ...(await ordered({ pageSize: 2, page: 2 })),
    ]).toEqual(ids);
  });

  it('pages and reports the total of all matches', async () => {
    await seed(['A', 'B', 'C', 'D', 'E'].map((fullName) => ({ fullName })));
    const r = await employees.list(query({ pageSize: 2, page: 3 }));
    expect(r.data.map((e) => e.fullName)).toEqual(['E']);
    expect(r.total).toBe(5);
  });

  it('applies filters to rows and total, and hides deleted employees', async () => {
    await seed([
      { fullName: 'In', countryCode: 'IN' },
      { fullName: 'De', countryCode: 'DE' },
      { fullName: 'Gone', countryCode: 'IN', deletedAt: new Date() },
    ]);
    const r = await employees.list(query({ country: ['IN'] }));
    expect(r.data.map((e) => e.fullName)).toEqual(['In']);
    expect(r.total).toBe(1);
    expect(r.data[0]).not.toHaveProperty('deletedAt');
  });
});

describe('getEmployee', () => {
  it('returns an active employee and hides deleted or missing ones', async () => {
    const [id, goneId] = await seed([{}, { deletedAt: new Date() }]);
    const e = await employees.get(id!);
    expect(e?.fullName).toBe('Priya Sharma');
    expect(e).not.toHaveProperty('deletedAt');
    expect(await employees.get(goneId!)).toBeUndefined();
    expect(await employees.get(999_999)).toBeUndefined();
  });
});

describe('createEmployee', () => {
  it('inserts the employee and its starting-salary history row', async () => {
    const userId = await makeUser('HR');
    const e = await employees.create(newEmployee, userId);
    expect(e).toMatchObject({ fullName: 'Nina Park', version: 1, salaryMinor: 500 });
    expect(e).not.toHaveProperty('deletedAt');
    expect(await employees.history(e.id)).toMatchObject([
      {
        oldSalaryMinor: null,
        newSalaryMinor: 500,
        reason: 'Starting salary',
        changedByName: 'HR',
      },
    ]);
  });

  it('rejects a duplicate active email with 23505 and saves nothing', async () => {
    const userId = await makeUser();
    await employees.create(newEmployee, userId);
    await expect(employees.create(newEmployee, userId)).rejects.toMatchObject({
      code: '23505',
      constraint: 'employees_email_active',
    });
    expect((await employees.list(query())).total).toBe(1);
  });
});

describe('updateEmployee', () => {
  it('updates fields and bumps the version', async () => {
    const [id] = await seed([{}]);
    const r = await employees.update(id!, { fullName: 'New Name', version: 1 });
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.employee).toMatchObject({ fullName: 'New Name', version: 2 });
      expect(r.employee).not.toHaveProperty('deletedAt');
    }
  });

  it('returns stale for an old version and changes nothing', async () => {
    const [id] = await seed([{}]);
    await employees.update(id!, { fullName: 'One', version: 1 });
    expect(await employees.update(id!, { fullName: 'Two', version: 1 })).toEqual({
      status: 'stale',
    });
    expect((await employees.get(id!))?.fullName).toBe('One');
  });

  it('returns not_found for missing and deleted employees', async () => {
    const [id] = await seed([{ deletedAt: new Date() }]);
    expect(await employees.update(id!, { version: 1 })).toEqual({ status: 'not_found' });
    expect(await employees.update(999_999, { version: 1 })).toEqual({ status: 'not_found' });
  });
});

describe('softDeleteEmployee', () => {
  it('hides the employee and reports whether a row was deleted', async () => {
    const [id] = await seed([{}]);
    expect(await employees.softDelete(id!)).toBe(true);
    expect(await employees.get(id!)).toBeUndefined();
    expect(await employees.softDelete(id!)).toBe(false);
  });
});

describe('changeSalary', () => {
  it('updates salary, bumps version and writes history with old and new', async () => {
    const [id] = await seed([{ salaryMinor: 100 }]);
    const changedBy = await makeUser();
    const r = await employees.changeSalary({
      id: id!,
      newSalaryMinor: 150,
      reason: 'Promotion',
      version: 1,
      changedBy,
    });
    expect(r.status).toBe('ok');
    if (r.status === 'ok') expect(r.employee).toMatchObject({ salaryMinor: 150, version: 2 });
    expect(await employees.history(id!)).toMatchObject([
      { oldSalaryMinor: 100, newSalaryMinor: 150, reason: 'Promotion', changedByName: 'Hana HR' },
    ]);
  });

  it('saves nothing for a stale version, and reports not_found for missing/deleted', async () => {
    const [id, goneId] = await seed([{}, { deletedAt: new Date() }]);
    const changedBy = await makeUser();
    const input = { newSalaryMinor: 150, reason: 'Raise', version: 2, changedBy };
    expect(await employees.changeSalary({ id: id!, ...input })).toEqual({ status: 'stale' });
    expect(await employees.changeSalary({ id: goneId!, ...input, version: 1 })).toEqual({
      status: 'not_found',
    });
    expect(await employees.changeSalary({ id: 999_999, ...input })).toEqual({
      status: 'not_found',
    });
    expect((await employees.get(id!))?.salaryMinor).toBe(100);
    expect(await employees.history(id!)).toHaveLength(0);
  });

  it('leaves the salary unchanged when the history insert fails', async () => {
    const [id] = await seed([{ salaryMinor: 100 }]);
    await expect(
      employees.changeSalary({
        id: id!,
        newSalaryMinor: 150,
        reason: 'Raise',
        version: 1,
        changedBy: 999_999, // no such user: FK error on the history insert
      }),
    ).rejects.toMatchObject({ code: '23503' });
    expect(await employees.get(id!)).toMatchObject({ salaryMinor: 100, version: 1 });
  });
});

describe('getSalaryHistory', () => {
  it('returns newest first, with a null name for imported history', async () => {
    const [id] = await seed([{}]);
    await db
      .insertInto('salaryChanges')
      .values([
        { employeeId: id!, newSalaryMinor: 1, reason: 'old', changedAt: new Date('2020-01-01') },
        { employeeId: id!, newSalaryMinor: 2, reason: 'new', changedAt: new Date('2021-01-01') },
      ])
      .execute();
    const h = await employees.history(id!);
    expect(h.map((x) => x.reason)).toEqual(['new', 'old']);
    expect(h[0]?.changedByName).toBeNull();
  });
});

describe('exportEmployees', () => {
  it('returns every matching row in the requested order', async () => {
    await seed([
      { fullName: 'B', countryCode: 'IN', salaryMinor: 1 },
      { fullName: 'A', countryCode: 'IN', salaryMinor: 2 },
      { fullName: 'X', countryCode: 'DE' },
      { fullName: 'Gone', countryCode: 'IN', deletedAt: new Date() },
    ]);
    const rows = await employees.export({ country: ['IN'] }, 'salary:desc');
    expect(rows.map((e) => e.fullName)).toEqual(['A', 'B']);
  });
});
