import type { Insertable } from 'kysely';
import { listQuerySchema } from '@acme/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../testing.ts';
import type { Employees } from '../types.ts';
import { exportEmployees, getEmployee, listEmployees } from './employees.ts';

const db = createTestDb();
afterAll(() => db.destroy());

let n = 0;
const emp = (o: Partial<Insertable<Employees>>): Insertable<Employees> => ({
  fullName: `Person ${++n}`,
  email: `p${n}@acme.example`,
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'mid',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2022-01-01',
  salaryMinor: 100,
  ...o,
});

beforeEach(async () => {
  await resetDb(db);
  await db
    .insertInto('employees')
    .values([
      // Band IN × Software Engineer × mid × full time: 100, 200, 300 (+ a deleted 900) → median 200
      emp({ fullName: 'Low', salaryMinor: 100 }),
      emp({ fullName: 'Mid', salaryMinor: 200 }),
      emp({ fullName: 'High', salaryMinor: 300 }),
      emp({ fullName: 'Gone', salaryMinor: 900, deletedAt: new Date() }),
      // Part time is its own band: alone → ratio 1
      emp({ fullName: 'Part', salaryMinor: 50, employmentType: 'part_time' }),
      // Another country, another currency: DE band 1000, 3000 → median 2000
      emp({ fullName: 'Hans', countryCode: 'DE', salaryMinor: 3000 }),
      emp({ fullName: 'Lena', countryCode: 'DE', salaryMinor: 1000 }),
    ])
    .execute();
});

const list = (q: Record<string, string>) => listEmployees(db, listQuerySchema.parse(q));

describe('compa-ratio (salary ÷ median of country × title × level × employment type)', () => {
  it('is computed per band, ignoring deleted employees', async () => {
    const { data } = await list({});
    const ratio = Object.fromEntries(data.map((e) => [e.fullName, e.compaRatio]));
    expect(ratio).toEqual({ Low: 0.5, Mid: 1, High: 1.5, Part: 1, Hans: 1.5, Lena: 0.5 });
  });

  it('does not change when the list is filtered', async () => {
    const { data } = await list({ q: 'High' });
    expect(data).toEqual([expect.objectContaining({ fullName: 'High', compaRatio: 1.5 })]);
  });

  it('sorts across countries (it has no currency)', async () => {
    const { data } = await list({ sort: 'compaRatio:desc' });
    expect(data.map((e) => e.fullName)).toEqual(['High', 'Hans', 'Mid', 'Part', 'Low', 'Lena']);
  });

  it('is included in detail and export', async () => {
    const { data } = await list({ q: 'Low' });
    expect((await getEmployee(db, data[0]!.id))?.compaRatio).toBe(0.5);
    const rows = await exportEmployees(db, {}, 'compaRatio:asc');
    expect(rows.map((e) => e.compaRatio)).toEqual([0.5, 0.5, 1, 1, 1.5, 1.5]);
  });
});
