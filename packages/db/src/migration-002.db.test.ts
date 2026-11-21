import { sql } from 'kysely';
import { Migrator } from 'kysely/migration';
import { afterAll, describe, expect, it } from 'vitest';
import { migrations } from './migrate.ts';
import { createTestDb, resetDb } from './testing.ts';

const db = createTestDb();
afterAll(() => db.destroy());

describe('migration 002', () => {
  it('keeps existing employees valid by adding their department and title', async () => {
    await resetDb(db); // countries must exist for the employee row
    const migrator = new Migrator({ db, provider: { getMigrations: async () => migrations } });
    // Roll back to 001, add an employee with a pair that 002 has never heard of, migrate again.
    expect((await migrator.migrateTo('001_initial')).error).toBeUndefined();
    await sql`INSERT INTO employees (full_name, email, department, job_title, level, country_code,
      employment_type, gender, hire_date, salary_minor)
      VALUES ('Old Timer', 'old@acme.example', 'Legal', 'Counsel', 'senior', 'IN',
      'full_time', 'male', '2015-01-01', 1)`.execute(db);

    expect((await migrator.migrateToLatest()).error).toBeUndefined();
    expect(await db.selectFrom('jobTitles').selectAll().execute()).toContainEqual({
      department: 'Legal',
      title: 'Counsel',
    });
    expect(await db.selectFrom('employees').select('fullName').execute()).toEqual([
      { fullName: 'Old Timer' },
    ]);

    // Departments survive resetDb, so remove what this test added.
    await db.deleteFrom('employees').execute();
    await db.deleteFrom('jobTitles').where('department', '=', 'Legal').execute();
    await db.deleteFrom('departments').where('name', '=', 'Legal').execute();
  });
});
