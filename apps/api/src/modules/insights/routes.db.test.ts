import { createTestDb, resetDb } from '@acme/db/testing';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.ts';
import { loginCookie } from '../../testing.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

let n = 0;
const emp = (o: Record<string, unknown> = {}) => ({
  fullName: `Person ${++n}`,
  email: `p${n}@acme.example`,
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior' as const,
  countryCode: 'IN',
  employmentType: 'full_time' as const,
  gender: 'female' as const,
  hireDate: '2021-04-12',
  salaryMinor: 100,
  ...o,
});

async function get(url: string, auth = true) {
  const app = buildApp({ db, logger: false });
  const headers = auth ? { cookie: await loginCookie(app, db) } : undefined;
  const res = await app.inject({ method: 'GET', url, headers });
  await app.close();
  return res;
}

const seed = () =>
  db
    .insertInto('employees')
    .values([
      emp({ salaryMinor: 1000 }),
      emp({ salaryMinor: 3000 }),
      emp({ salaryMinor: 2000, gender: 'male' }),
      emp({
        salaryMinor: 500,
        countryCode: 'DE',
        department: 'Sales',
        jobTitle: 'Account Executive',
      }),
    ] as never) // rows are loosely typed; the DB enforces the real constraints
    .execute();

describe('insights api', () => {
  it('stats', async () => {
    await seed();
    const res = await get('/api/insights/stats?country=IN&groupBy=department');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        group: { department: 'Engineering' },
        count: 3,
        min: 1000,
        p25: 1500,
        median: 2000,
        p75: 2500,
        max: 3000,
        avg: 2000,
        total: 6000,
        currency: 'INR',
      },
    ]);
  });

  it('groups by country without a country filter', async () => {
    await seed();
    const res = await get('/api/insights/stats?groupBy=country');
    expect(res.statusCode).toBe(200);
    expect(res.json().map((r: { group: unknown }) => r.group)).toEqual([
      { country: 'DE' },
      { country: 'IN' },
    ]);
  });

  it('requires one country when not grouped by country', async () => {
    const res = await get('/api/insights/stats?groupBy=department');
    expect(res.statusCode).toBe(400);
    expect(res.json().fields.country).toBe('Choose one country');
  });

  it('rejects an invalid groupBy', async () => {
    const res = await get('/api/insights/stats?country=IN&groupBy=nope');
    expect(res.statusCode).toBe(400);
    expect(res.json().fields.groupBy).toBeDefined();
  });

  it('gender gap', async () => {
    await seed();
    const res = await get('/api/insights/gender-gap?country=IN&groupBy=department');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      {
        group: { department: 'Engineering' },
        femaleMedian: 2000,
        maleMedian: 2000,
        femaleCount: 2,
        maleCount: 1,
        gapPct: null,
        currency: 'INR',
      },
    ]);
  });

  it('distribution', async () => {
    await seed();
    const res = await get('/api/insights/distribution?country=IN&buckets=2');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      currency: 'INR',
      buckets: [
        { from: 1000, to: 2000, count: 1 },
        { from: 2000, to: 3000, count: 2 },
      ],
    });
  });

  it('distribution with no employees still returns the country currency', async () => {
    const res = await get('/api/insights/distribution?country=DE');
    expect(res.json()).toEqual({ currency: 'EUR', buckets: [] });
  });

  it('requires login', async () => {
    for (const p of [
      'stats?groupBy=country',
      'gender-gap?groupBy=country',
      'distribution?country=IN',
    ]) {
      expect((await get(`/api/insights/${p}`, false)).statusCode).toBe(401);
    }
  });
});
