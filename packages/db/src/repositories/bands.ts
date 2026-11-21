import { config } from '@acme/shared';
import { type JoinBuilder, sql } from 'kysely';
import type { Db } from '../client.ts';
import type { DB, Employees } from '../types.ts';

type BandRow = Pick<Employees, 'countryCode' | 'jobTitle' | 'level' | 'employmentType'> & {
  median: number;
};

/**
 * A "band" is country × job title × level × employment type. Its median is taken over ALL active
 * employees, so a person's compa-ratio does not change when a list or a stats query is filtered.
 */
export const withBands = (db: Db) =>
  db.with('bands', (qb) =>
    qb
      .selectFrom('employees')
      .where('deletedAt', 'is', null)
      .select([
        'countryCode',
        'jobTitle',
        'level',
        'employmentType',
        sql<number>`percentile_cont(0.5) within group (order by salary_minor)`.as('median'),
      ])
      .groupBy(['countryCode', 'jobTitle', 'level', 'employmentType']),
  );

type Join = JoinBuilder<DB & { bands: BandRow }, 'employees' | 'bands'>;

/** Join condition from `employees` to its `bands` row. */
export const onBand = (join: Join) =>
  join
    .onRef('bands.countryCode', '=', 'employees.countryCode')
    .onRef('bands.jobTitle', '=', 'employees.jobTitle')
    .onRef('bands.level', '=', 'employees.level')
    .onRef('bands.employmentType', '=', 'employees.employmentType');

/** salary ÷ band median, rounded to the precision people see in the list. */
export const compaRatioSql = sql<number>`round((employees.salary_minor / bands.median)::numeric, ${sql.lit(config.compaRatio.decimals)})`;
