import { z } from 'zod';
import { enumList, paramWithDefault } from './common.ts';
import { filterFields } from './list-query.ts';

export const DIMENSIONS = [
  'country',
  'department',
  'jobTitle',
  'level',
  'gender',
  'employmentType',
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

function groupBy<const T extends readonly [string, ...string[]]>(dimensions: T) {
  return enumList(dimensions)
    .pipe(z.array(z.string()).max(2, { error: 'Group by at most 2 fields' }))
    .refine((dims) => new Set(dims).size === dims.length, { error: 'Group by each field once' });
}

/** Money is only comparable within one currency, so one country unless grouped by country. */
const ONE_COUNTRY = {
  path: ['country'],
  error: 'Choose one country',
};
const hasOneCountry = (q: { groupBy?: string[]; country?: string[] | undefined }) =>
  q.groupBy?.includes('country') === true || q.country?.length === 1;

export const statsQuerySchema = z
  .object({ ...filterFields, groupBy: groupBy(DIMENSIONS) })
  .refine(hasOneCountry, ONE_COUNTRY);

export const genderGapQuerySchema = z
  .object({
    ...filterFields,
    groupBy: groupBy(DIMENSIONS.filter((d) => d !== 'gender') as [Dimension, ...Dimension[]]),
  })
  .refine(hasOneCountry, ONE_COUNTRY);

export const distributionQuerySchema = z
  .object({
    ...filterFields,
    buckets: paramWithDefault(
      z.coerce.number().int().min(1).max(50, { error: 'At most 50 buckets' }),
      20,
    ),
  })
  .refine(hasOneCountry, ONE_COUNTRY);

export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type GenderGapQuery = z.infer<typeof genderGapQuerySchema>;
export type DistributionQuery = z.infer<typeof distributionQuerySchema>;
