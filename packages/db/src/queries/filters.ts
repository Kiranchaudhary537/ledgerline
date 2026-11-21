import type { Filters } from '@acme/shared';
import type { Expression, ExpressionBuilder, SqlBool } from 'kysely';
import type { DB } from '../types.ts';

/** Escapes LIKE wildcards so a search for "100%" matches the text "100%". */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * The one WHERE clause for list, export and insights: active employees matching the filters.
 * Different filters are ANDed; values within one filter are ORed.
 */
export function employeeFilters(
  eb: ExpressionBuilder<DB, 'employees'>,
  f: Filters,
): Expression<SqlBool> {
  const conditions: Expression<SqlBool>[] = [eb('employees.deletedAt', 'is', null)];

  if (f.q) {
    const pattern = `%${escapeLike(f.q)}%`;
    conditions.push(
      eb.or([
        eb('employees.fullName', 'ilike', pattern),
        eb('employees.email', 'ilike', pattern),
        eb('employees.employeeCode', 'ilike', pattern),
      ]),
    );
  }
  if (f.country) conditions.push(eb('employees.countryCode', 'in', f.country));
  if (f.department) conditions.push(eb('employees.department', 'in', f.department));
  if (f.jobTitle) conditions.push(eb('employees.jobTitle', 'in', f.jobTitle));
  if (f.level) conditions.push(eb('employees.level', 'in', f.level));
  if (f.employmentType) conditions.push(eb('employees.employmentType', 'in', f.employmentType));
  if (f.gender) conditions.push(eb('employees.gender', 'in', f.gender));

  return eb.and(conditions);
}
