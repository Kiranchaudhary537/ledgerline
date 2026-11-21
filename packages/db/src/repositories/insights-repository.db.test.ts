import type { DistributionQuery } from '@acme/shared';
import type { Insertable } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../testing.ts';
import type { Employees } from '../types.ts';
import { getDistribution, getGenderGap, getStats } from './insights.ts';

const db = createTestDb();
afterAll(() => db.destroy());

const base: Insertable<Employees> = {
  fullName: 'X',
  email: 'x@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 100,
};
let n = 0;
const emp = (o: Partial<Insertable<Employees>>): Insertable<Employees> => ({
  ...base,
  fullName: `Person ${++n}`,
  email: `p${n}@acme.example`,
  ...o,
});

// IN Engineering (senior): F 1000..5000 (5), M 2000,4000,7000,8000,10000 (5)
// IN Sales (mid): F 1500, M 2500.  IN Support (junior, all female): 100, 101, 101.
// DE Engineering: one male at 7000.  One deleted IN employee at 999999 (must never count).
beforeAll(async () => {
  await resetDb(db);
  await db
    .insertInto('employees')
    .values([
      ...[1000, 2000, 3000, 4000, 5000].map((s) => emp({ salaryMinor: s })),
      ...[2000, 4000, 7000, 8000, 10000].map((s) => emp({ salaryMinor: s, gender: 'male' })),
      emp({ department: 'Sales', jobTitle: 'Account Executive', level: 'mid', salaryMinor: 1500 }),
      emp({
        department: 'Sales',
        jobTitle: 'Account Executive',
        level: 'mid',
        salaryMinor: 2500,
        gender: 'male',
      }),
      ...[100, 101, 101].map((s) =>
        emp({
          department: 'Customer Support',
          jobTitle: 'Support Specialist',
          level: 'junior',
          salaryMinor: s,
        }),
      ),
      emp({ countryCode: 'DE', gender: 'male', salaryMinor: 7000 }),
      emp({ salaryMinor: 999999, deletedAt: new Date() }),
    ])
    .execute();
});

describe('getStats', () => {
  it('computes exact stats per group, rounding to whole minor units', async () => {
    const rows = await getStats(db, { country: ['IN'], groupBy: ['department'] });
    expect(rows).toEqual([
      // 100, 101, 101: avg 100.67 -> 101; p25 pos .5 -> 100.5 -> 101; total 302
      {
        group: { department: 'Customer Support' },
        count: 3,
        min: 100,
        p25: 101,
        median: 101,
        p75: 101,
        max: 101,
        avg: 101,
        total: 302,
        currency: 'INR',
      },
      // sorted: 1000 2000 2000 3000 4000 4000 5000 7000 8000 10000 (n=10)
      // median pos 4.5 -> (4000+4000)/2; p25 pos 2.25 -> 2000+.25*1000; p75 pos 6.75 -> 5000+.75*2000
      // total 46000, avg 4600
      {
        group: { department: 'Engineering' },
        count: 10,
        min: 1000,
        p25: 2250,
        median: 4000,
        p75: 6500,
        max: 10000,
        avg: 4600,
        total: 46000,
        currency: 'INR',
      },
      // 1500, 2500: median 2000, p25 1500+.25*1000, p75 1500+.75*1000
      {
        group: { department: 'Sales' },
        count: 2,
        min: 1500,
        p25: 1750,
        median: 2000,
        p75: 2250,
        max: 2500,
        avg: 2000,
        total: 4000,
        currency: 'INR',
      },
    ]);
  });

  it('groups by two dimensions, ordering levels by seniority', async () => {
    const rows = await getStats(db, { country: ['IN'], groupBy: ['level', 'department'] });
    expect(rows.map((r) => [r.group, r.count])).toEqual([
      [{ level: 'junior', department: 'Customer Support' }, 3],
      [{ level: 'mid', department: 'Sales' }, 2],
      [{ level: 'senior', department: 'Engineering' }, 10],
    ]);
  });

  it('gives each country its own currency', async () => {
    const rows = await getStats(db, { groupBy: ['country'] });
    // IN total 46000 + 4000 + 302 = 50302 over 15 people; deleted excluded
    expect(rows.map((r) => [r.group, r.count, r.total, r.currency])).toEqual([
      [{ country: 'DE' }, 1, 7000, 'EUR'],
      [{ country: 'IN' }, 15, 50302, 'INR'],
    ]);
  });

  it('applies filters', async () => {
    const rows = await getStats(db, {
      country: ['IN'],
      gender: ['female'],
      groupBy: ['department'],
    });
    // Engineering women: 1000..5000 -> median 3000, avg 3000
    expect(rows[1]).toMatchObject({
      group: { department: 'Engineering' },
      count: 5,
      median: 3000,
      avg: 3000,
    });
  });
});

describe('getGenderGap', () => {
  it('computes the gap and nulls it below 5 people per gender', async () => {
    const rows = await getGenderGap(db, { country: ['IN'], groupBy: ['department'] });
    expect(rows).toEqual([
      // no men: maleMedian null
      {
        group: { department: 'Customer Support' },
        femaleMedian: 101,
        maleMedian: null,
        femaleCount: 3,
        maleCount: 0,
        gapPct: null,
        currency: 'INR',
      },
      // F median 3000, M median 7000: (7000-3000)/7000*100 = 57.142... -> 57.1
      {
        group: { department: 'Engineering' },
        femaleMedian: 3000,
        maleMedian: 7000,
        femaleCount: 5,
        maleCount: 5,
        gapPct: 57.1,
        currency: 'INR',
      },
      // 1 woman, 1 man: below 5 -> null gap, medians still returned
      {
        group: { department: 'Sales' },
        femaleMedian: 1500,
        maleMedian: 2500,
        femaleCount: 1,
        maleCount: 1,
        gapPct: null,
        currency: 'INR',
      },
    ]);
  });
});

describe('getDistribution', () => {
  const eng: Pick<DistributionQuery, 'country' | 'department'> = {
    country: ['IN'],
    department: ['Engineering'],
  };

  it('splits min..max into equal buckets', async () => {
    // min 1000, max 10000, 3 buckets of 3000: [1000,4000) [4000,7000) [7000,10000]
    const d = await getDistribution(db, { ...eng, buckets: 3 });
    expect(d).toEqual({
      currency: 'INR',
      buckets: [
        { from: 1000, to: 4000, count: 4 }, // 1000 2000 2000 3000
        { from: 4000, to: 7000, count: 3 }, // 4000 4000 5000
        { from: 7000, to: 10000, count: 3 }, // 7000 8000 10000 (max in last bucket)
      ],
    });
  });

  it('includes empty buckets', async () => {
    // 9 buckets of 1000; nobody earns 6000..6999
    const d = await getDistribution(db, { ...eng, buckets: 9 });
    expect(d.buckets.map((b) => b.count)).toEqual([1, 2, 1, 2, 1, 0, 1, 1, 1]);
    expect(d.buckets[5]).toEqual({ from: 6000, to: 7000, count: 0 });
  });

  it('returns one bucket when all salaries are equal', async () => {
    const d = await getDistribution(db, {
      country: ['IN'],
      department: ['Sales'],
      gender: ['female'],
      buckets: 5,
    });
    expect(d.buckets).toEqual([{ from: 1500, to: 1500, count: 1 }]);
  });

  it('returns no buckets for an empty set', async () => {
    const d = await getDistribution(db, { country: ['IN'], department: ['Finance'], buckets: 5 });
    expect(d.buckets).toEqual([]);
  });
});
