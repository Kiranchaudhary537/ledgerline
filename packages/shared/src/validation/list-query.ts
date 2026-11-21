import { z } from 'zod';
import { COUNTRY_CODES, EMPLOYMENT_TYPES, GENDERS, LEVELS } from '../constants.ts';
import { commaList, enumList, nameSchema, optionalParam, paramWithDefault } from './common.ts';

/** Filters shared by the employee list, CSV export and insights. */
export const filterFields = {
  q: optionalParam(
    z
      .string()
      .trim()
      .min(2, { error: 'Type at least 2 characters' })
      .max(100, { error: 'Search is too long' }),
  ),
  country: optionalParam(enumList(COUNTRY_CODES)),
  department: optionalParam(commaList(nameSchema)),
  jobTitle: optionalParam(commaList(nameSchema)),
  level: optionalParam(enumList(LEVELS)),
  employmentType: optionalParam(enumList(EMPLOYMENT_TYPES)),
  gender: optionalParam(enumList(GENDERS)),
};

export const SORT_OPTIONS = [
  'name:asc',
  'name:desc',
  'hireDate:asc',
  'hireDate:desc',
  'level:asc',
  'level:desc',
  'salary:asc',
  'salary:desc',
  // Currency-free, so allowed across countries.
  'compaRatio:asc',
  'compaRatio:desc',
] as const;

export const filtersSchema = z.object(filterFields);

export const listQuerySchema = z
  .object({
    ...filterFields,
    sort: paramWithDefault(z.enum(SORT_OPTIONS, { error: 'Unknown sort' }), 'name:asc'),
    page: paramWithDefault(z.coerce.number().int().min(1), 1),
    pageSize: paramWithDefault(
      z.coerce.number().int().min(1).max(100, { error: 'Page size is at most 100' }),
      25,
    ),
  })
  .refine((q) => !q.sort.startsWith('salary') || q.country?.length === 1, {
    path: ['sort'],
    error: 'Filter to one country to sort by salary',
  });

export type Filters = z.infer<typeof filtersSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type SortOption = (typeof SORT_OPTIONS)[number];
