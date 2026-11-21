import { salaryChangeSchema, type Employee, type StatsRow } from '@acme/shared';
import { formatPercent } from '@/lib/format';
import {
  bandPosition,
  percentChange,
  POSITION_TEXT,
} from '@/features/employees/shared/model/band-geometry';
import { issueErrors } from './employee-form';
import { AMOUNT_HINT, parseAmount, type Built } from './money-input';

export interface SalaryFormValues {
  /** Major units as typed. */
  newSalary: string;
  reason: string;
}

export const EMPTY_SALARY_VALUES: SalaryFormValues = { newSalary: '', reason: '' };

export const salaryFieldOf = (apiField: string) =>
  apiField === 'newSalaryMinor' ? 'newSalary' : apiField;

export function buildSalaryChangeBody(values: SalaryFormValues, employee: Employee): Built {
  const newSalaryMinor = parseAmount(values.newSalary, employee.countryCode);
  const parsed = salaryChangeSchema.safeParse({
    newSalaryMinor: newSalaryMinor ?? 0,
    reason: values.reason,
    version: employee.version,
  });
  const errors = parsed.success ? {} : issueErrors(parsed.error, salaryFieldOf);
  if (newSalaryMinor === null) errors.newSalary = AMOUNT_HINT;
  return Object.keys(errors).length === 0 && parsed.success
    ? { ok: true, body: parsed.data }
    : { ok: false, errors };
}

/** The proposed salary in minor units, or null while the typed text is not a positive amount. */
export function proposedMinor(input: string, countryCode: string) {
  const minor = parseAmount(input, countryCode);
  return minor !== null && minor > 0 ? minor : null;
}

export const PROPOSAL_PROMPT = 'Type the new salary to see where it lands in the band.';

/** "+8.9% from today, above the middle half of the band". */
export function proposalText(current: number, proposed: number | null, band: StatsRow | undefined) {
  if (proposed === null) return PROPOSAL_PROMPT;
  const change = `${formatPercent(percentChange(current, proposed))} from today`;
  return band ? `${change}, ${POSITION_TEXT[bandPosition(proposed, band)]}` : change;
}
