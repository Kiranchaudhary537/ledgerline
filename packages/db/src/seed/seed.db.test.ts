import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { verifyPassword } from '../password.ts';
import { createTestDb, resetDb } from '../testing.ts';
import { generateEmployees } from './generate.ts';
import { seedDatabase } from './seed.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const options = { adminEmail: 'hr@acme.example', adminPassword: 'a-long-password', count: 50 };

const countRows = async (table: 'employees' | 'salaryChanges' | 'users') =>
  (
    await db
      .selectFrom(table)
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .executeTakeFirstOrThrow()
  ).n;

describe('seedDatabase', () => {
  it('inserts employees with their full salary history', async () => {
    await seedDatabase(db, options);
    const expected = generateEmployees({ seed: 42, count: 50 });
    expect(await countRows('employees')).toBe(50);
    expect(await countRows('salaryChanges')).toBe(
      expected.reduce((n, e) => n + e.history.length, 0),
    );

    const latest = await db
      .selectFrom('employees as e')
      .innerJoin('salaryChanges as s', 's.employeeId', 'e.id')
      .select(['e.salaryMinor', 's.newSalaryMinor'])
      .where('e.id', '=', 1)
      .orderBy('s.changedAt', 'desc')
      .executeTakeFirstOrThrow();
    expect(latest.newSalaryMinor).toBe(latest.salaryMinor);
  });

  it('creates an HR user who can log in with the given password', async () => {
    await seedDatabase(db, options);
    const user = await db.selectFrom('users').selectAll().executeTakeFirstOrThrow();
    expect(user.email).toBe('hr@acme.example');
    expect(await verifyPassword('a-long-password', user.passwordHash)).toBe(true);
  });

  it('can be run again: replaces data instead of adding to it', async () => {
    await seedDatabase(db, options);
    await seedDatabase(db, options);
    expect(await countRows('employees')).toBe(50);
    expect(await countRows('users')).toBe(1);
  });
});
