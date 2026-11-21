import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** Optional query param; an empty string counts as absent. */
export function optionalParam<T extends z.ZodType>(schema: T) {
  return z.preprocess(emptyToUndefined, schema.optional());
}

/** Query param with a default; an empty string counts as absent. */
export function paramWithDefault<T extends z.ZodType>(schema: T, value: z.output<T>) {
  return z.preprocess(emptyToUndefined, schema.default(value as never));
}

/** Department or job title: the allowed values live in the database. */
export const nameSchema = z.string().trim().min(1).max(80);

/** Comma-separated query param ("IN,DE") → array of values that each match `item`. */
export function commaList<T extends z.ZodType<unknown, string>>(item: T) {
  return z
    .string()
    .transform((s) => s.split(',').map((v) => v.trim()))
    .pipe(z.array(item).min(1));
}

/** Same, for a fixed set of allowed values. */
export const enumList = <const T extends readonly [string, ...string[]]>(values: T) =>
  commaList(z.enum(values));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email' }));

export const versionSchema = z
  .number({ error: 'Missing version' })
  .int({ error: 'Missing version' })
  .positive({ error: 'Missing version' });

const SALARY_ERROR = 'Enter a salary above 0';
export const salaryMinorSchema = z
  .number({ error: SALARY_ERROR })
  .int({ error: SALARY_ERROR })
  .positive({ error: SALARY_ERROR })
  .max(Number.MAX_SAFE_INTEGER, { error: SALARY_ERROR });
