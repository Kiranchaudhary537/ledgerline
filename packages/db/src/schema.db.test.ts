import type { CountryCode } from '@acme/shared';
import type { Insertable } from 'kysely';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from './testing.ts';
import type { Employees } from './types.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const employee = (overrides: Partial<Insertable<Employees>> = {}): Insertable<Employees> => ({
  fullName: 'Priya Sharma',
  email: 'priya.sharma@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 380_000_000,
  ...overrides,
});

const insert = (values: Insertable<Employees>) =>
  db.insertInto('employees').values(values).returningAll().executeTakeFirstOrThrow();

describe('employees table', () => {
  it('generates the employee code and starts at version 1', async () => {
    const row = await insert(employee());
    expect(row.employeeCode).toBe('ACME-00001');
    expect(row.version).toBe(1);
    expect(row.hireDate).toBe('2021-04-12');
    expect(row.salaryMinor).toBe(380_000_000);
  });

  it('rejects a duplicate email among active employees', async () => {
    await insert(employee());
    await expect(insert(employee())).rejects.toMatchObject({ code: '23505' });
  });

  it('allows reusing the email of a deleted employee (rehire)', async () => {
    const first = await insert(employee());
    await db
      .updateTable('employees')
      .set({ deletedAt: new Date() })
      .where('id', '=', first.id)
      .execute();
    await expect(insert(employee())).resolves.toMatchObject({ employeeCode: 'ACME-00002' });
  });

  it('rejects a salary that is not positive', async () => {
    await expect(insert(employee({ salaryMinor: 0 }))).rejects.toMatchObject({ code: '23514' });
  });

  it('rejects an unknown country', async () => {
    await expect(insert(employee({ countryCode: 'XX' as CountryCode }))).rejects.toMatchObject({
      code: '23503',
    });
  });

  it('rejects a job title that does not belong to the department', async () => {
    await expect(insert(employee({ jobTitle: 'Recruiter' }))).rejects.toMatchObject({
      code: '23503',
      constraint: 'employees_department_job_title_fkey',
    });
  });

  it('sorts levels by seniority, not alphabetically', async () => {
    for (const [i, level] of (
      ['principal', 'junior', 'lead', 'mid', 'senior'] as const
    ).entries()) {
      await insert(employee({ email: `p${i}@acme.example`, level }));
    }
    const rows = await db.selectFrom('employees').select('level').orderBy('level').execute();
    expect(rows.map((r) => r.level)).toEqual(['junior', 'mid', 'senior', 'lead', 'principal']);
  });
});
