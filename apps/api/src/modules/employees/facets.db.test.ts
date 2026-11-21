import { EmployeeRepository } from '@acme/db';
import { createTestDb, resetDb } from '@acme/db/testing';
import type { EmployeeCreate } from '@acme/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.ts';
import { loginCookie } from '../../testing.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

const base: EmployeeCreate = {
  fullName: 'Priya Sharma',
  email: 'priya@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 380_000_000,
};

describe('GET /api/employees/facets', () => {
  it('returns counts per dimension, narrowed by the other filters', async () => {
    const app = buildApp({ db, logger: false });
    const headers = { cookie: await loginCookie(app, db) };
    const user = await db.selectFrom('users').select('id').executeTakeFirstOrThrow();
    const repo = new EmployeeRepository(db);
    await repo.create({ ...base, email: 'a@x.example' }, user.id);
    await repo.create({ ...base, email: 'b@x.example', countryCode: 'DE', level: 'junior' }, user.id);

    const res = await app.inject({ url: '/api/employees/facets?country=IN', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().country).toEqual([
      { value: 'DE', count: 1 },
      { value: 'IN', count: 1 },
    ]);
    expect(res.json().level).toEqual([{ value: 'senior', count: 1 }]);
    await app.close();
  });

  it('requires a session', async () => {
    const app = buildApp({ db, logger: false });
    expect((await app.inject({ url: '/api/employees/facets' })).statusCode).toBe(401);
    await app.close();
  });
});
