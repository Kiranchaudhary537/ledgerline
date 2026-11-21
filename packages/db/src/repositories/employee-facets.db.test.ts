import type { EmployeeCreate } from '@acme/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../testing.ts';
import { EmployeeRepository } from './employee-repository.ts';

const db = createTestDb();
const employees = new EmployeeRepository(db);
afterAll(() => db.destroy());
beforeEach(() => resetDb(db));

const base: EmployeeCreate = {
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

async function userId() {
  const existing = await db.selectFrom('users').select('id').executeTakeFirst();
  if (existing) return existing.id;
  const created = await db
    .insertInto('users')
    .values({ email: 'u@x.example', name: 'U', passwordHash: 'x' })
    .returning('id')
    .executeTakeFirstOrThrow();
  return created.id;
}

const add = async (over: Partial<EmployeeCreate>) =>
  employees.create({ ...base, ...over }, await userId());

async function seed() {
  await add({ email: 'a@x.example', level: 'senior' });
  await add({ email: 'b@x.example', level: 'junior', countryCode: 'DE' });
  await add({
    email: 'c@x.example',
    level: 'junior',
    department: 'Data',
    jobTitle: 'Data Analyst',
  });
}

describe('EmployeeRepository.facets', () => {
  it('counts existing values: count desc then name, levels by seniority', async () => {
    await seed();
    const f = await employees.facets({});
    expect(f.country).toEqual([
      { value: 'IN', count: 2 },
      { value: 'DE', count: 1 },
    ]);
    expect(f.level).toEqual([
      { value: 'junior', count: 2 },
      { value: 'senior', count: 1 },
    ]);
    expect(f.gender).toEqual([{ value: 'female', count: 3 }]);
  });

  it('ignores its own filter but applies the others', async () => {
    await seed();
    const f = await employees.facets({ country: ['IN'], level: ['junior'] });
    expect(f.country).toEqual([
      { value: 'DE', count: 1 },
      { value: 'IN', count: 1 },
    ]);
    expect(f.level).toEqual([
      { value: 'junior', count: 1 },
      { value: 'senior', count: 1 },
    ]);
    expect(f.jobTitle).toEqual([{ value: 'Data Analyst', count: 1 }]);
  });

  it('keeps a selected value with count 0 and drops deleted employees', async () => {
    await seed();
    const row = await db
      .selectFrom('employees')
      .select('id')
      .where('email', '=', 'b@x.example')
      .executeTakeFirstOrThrow();
    await employees.softDelete(row.id);
    const f = await employees.facets({ country: ['DE'] });
    expect(f.country).toEqual([
      { value: 'IN', count: 2 },
      { value: 'DE', count: 0 },
    ]);
  });
});
