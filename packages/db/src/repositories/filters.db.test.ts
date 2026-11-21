import type { Filters } from '@acme/shared';
import type { Insertable } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../testing.ts';
import type { Employees } from '../types.ts';
import { employeeFilters } from './filters.ts';

const db = createTestDb();
afterAll(() => db.destroy());

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

beforeAll(async () => {
  await resetDb(db);
  await db
    .insertInto('employees')
    .values([
      base, // ACME-00001
      {
        ...base,
        fullName: 'Hannah Wolf',
        email: 'hannah.wolf@acme.example',
        countryCode: 'DE',
        level: 'mid',
      },
      {
        ...base,
        fullName: 'Arjun 100%_Rao',
        email: 'arjun.rao@acme.example',
        department: 'Sales',
        jobTitle: 'Account Executive',
        gender: 'male',
      },
      { ...base, fullName: 'Deleted Person', email: 'deleted@acme.example', deletedAt: new Date() },
    ])
    .execute();
});

const names = async (filters: Filters) =>
  (
    await db
      .selectFrom('employees')
      .select('fullName')
      .where((eb) => employeeFilters(eb, filters))
      .orderBy('id')
      .execute()
  ).map((r) => r.fullName);

describe('employeeFilters', () => {
  it('returns all active employees and never deleted ones', async () => {
    expect(await names({})).toEqual(['Priya Sharma', 'Hannah Wolf', 'Arjun 100%_Rao']);
  });

  it('searches name, email and employee code, case-insensitively', async () => {
    expect(await names({ q: 'WOLF' })).toEqual(['Hannah Wolf']);
    expect(await names({ q: 'arjun.rao@' })).toEqual(['Arjun 100%_Rao']);
    expect(await names({ q: 'acme-00001' })).toEqual(['Priya Sharma']);
  });

  it('treats % and _ in the search as plain characters', async () => {
    expect(await names({ q: '100%_' })).toEqual(['Arjun 100%_Rao']);
    expect(await names({ q: '%' })).toEqual(['Arjun 100%_Rao']);
  });

  it('ORs values within a filter and ANDs different filters', async () => {
    expect(await names({ country: ['IN', 'DE'] })).toHaveLength(3);
    expect(await names({ country: ['IN', 'DE'], level: ['mid'] })).toEqual(['Hannah Wolf']);
    expect(await names({ department: ['Sales'], gender: ['male'] })).toEqual(['Arjun 100%_Rao']);
    expect(await names({ jobTitle: ['Software Engineer'], employmentType: ['contract'] })).toEqual(
      [],
    );
  });
});
