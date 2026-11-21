import { config, type DistributionQuery, type GenderGapQuery, type StatsQuery } from '@acme/shared';
import { type Expression, sql } from 'kysely';
import type { Db } from '../client.ts';
import { employeeFilters } from './filters.ts';

const COLUMN = {
  country: 'employees.countryCode',
  department: 'employees.department',
  jobTitle: 'employees.jobTitle',
  level: 'employees.level',
  gender: 'employees.gender',
  employmentType: 'employees.employmentType',
} as const;
type Dimension = keyof typeof COLUMN;

const salary = sql.ref('employees.salaryMinor');
/** round() on numeric (not double) so halves round up, then back to a whole minor unit. */
const whole = (x: Expression<unknown>) => sql<number>`round((${x})::numeric)::bigint`;
const pct = (p: number) => whole(sql`percentile_cont(${p}) within group (order by ${salary})`);
const genderMedian = (g: 'female' | 'male') =>
  whole(
    sql`percentile_cont(0.5) within group (order by ${salary}) filter (where ${sql.ref('employees.gender')} = ${g})`,
  );
const genderCount = (g: 'female' | 'male') =>
  sql<number>`count(*) filter (where ${sql.ref('employees.gender')} = ${g})`;

function groupedBase(db: Db, q: StatsQuery | GenderGapQuery) {
  const cols = (q.groupBy as Dimension[]).map((d) => COLUMN[d]);
  // Currency is determined by country, so grouping by it never splits a group.
  // Level is an enum, so ordering by it sorts by seniority.
  return db
    .selectFrom('employees')
    .innerJoin('countries', 'countries.code', 'employees.countryCode')
    .where((eb) => employeeFilters(eb, q))
    .select((eb) => [
      ...cols.map((c, i) => eb.ref(c).as(`g${i}`)),
      'countries.currency as currency',
    ])
    .groupBy([...cols, 'countries.currency'])
    .$call((qb) => cols.reduce((acc, c) => acc.orderBy(c), qb));
}

const toGroup = (dims: string[], row: Record<string, unknown>) =>
  Object.fromEntries(dims.map((d, i) => [d, row[`g${i}`]])) as Record<string, string>;

const minGroup = config.insights.genderGapMinGroupSize;

export class InsightsRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async stats(q: StatsQuery) {
    const rows = await groupedBase(this.db, q)
      .select([
        sql<number>`count(*)`.as('count'),
        sql<number>`min(${salary})`.as('min'),
        pct(0.25).as('p25'),
        pct(0.5).as('median'),
        pct(0.75).as('p75'),
        sql<number>`max(${salary})`.as('max'),
        whole(sql`avg(${salary})`).as('avg'),
        sql<number>`sum(${salary})`.as('total'),
      ])
      .execute();
    return rows.map(({ currency, count, min, p25, median, p75, max, avg, total, ...g }) => ({
      group: toGroup(q.groupBy, g),
      count,
      min,
      p25,
      median,
      p75,
      max,
      avg,
      total,
      currency,
    }));
  }

  /** Medians are returned whenever that gender has anyone; only gapPct is null below the minimum group size. */
  async genderGap(q: GenderGapQuery) {
    const rows = await groupedBase(this.db, q)
      .select([
        genderMedian('female').as('femaleMedian'),
        genderMedian('male').as('maleMedian'),
        genderCount('female').as('femaleCount'),
        genderCount('male').as('maleCount'),
      ])
      .execute();
    return rows.map(({ currency, femaleMedian, maleMedian, femaleCount, maleCount, ...g }) => ({
      group: toGroup(q.groupBy, g),
      femaleMedian: femaleMedian as number | null,
      maleMedian: maleMedian as number | null,
      femaleCount,
      maleCount,
      gapPct:
        femaleCount >= minGroup && maleCount >= minGroup
          ? Math.round(((maleMedian - femaleMedian) / maleMedian) * 1000) / 10
          : null,
      currency,
    }));
  }

  /** Equal-width buckets from min to max: [from, to) each, except the last which includes max. */
  async distribution(q: DistributionQuery) {
    const filtered = this.db
      .selectFrom('employees')
      .innerJoin('countries', 'countries.code', 'employees.countryCode')
      .where((eb) => employeeFilters(eb, q));
    const range = await filtered
      .select([
        sql<number | null>`min(${salary})`.as('min'),
        sql<number>`max(${salary})`.as('max'),
        sql<string>`min(countries.currency)`.as('currency'),
      ])
      .executeTakeFirstOrThrow();
    if (range.min == null) return { currency: null as string | null, buckets: [] };

    const { min, max } = range;
    const n = max === min ? 1 : q.buckets;
    const bounds = Array.from({ length: n + 1 }, (_, i) =>
      i === n ? max : Math.round(min + ((max - min) * i) / n),
    );
    // width_bucket(x, thresholds) = how many inner boundaries are <= x, i.e. the 0-based bucket.
    const inner = bounds.slice(1, -1);
    const counts = await filtered
      .select([
        sql<number>`width_bucket(${salary}, ARRAY[${sql.join(inner)}]::bigint[])`.as('bucket'),
        sql<number>`count(*)`.as('count'),
      ])
      .groupBy('bucket')
      .execute();
    const byBucket = new Map(counts.map((c) => [c.bucket, c.count]));
    return {
      currency: range.currency as string | null,
      buckets: bounds.slice(0, -1).map((from, i) => ({
        from,
        to: bounds[i + 1] as number,
        count: byBucket.get(i) ?? 0,
      })),
    };
  }
}
