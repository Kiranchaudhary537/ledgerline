import { employeeCreateSchema, employeeUpdateSchema, type Employee } from '@acme/shared';
import type { ZodError } from 'zod';
import { AMOUNT_HINT, parseAmount, type Built } from './money-input';

/** Single source of the form's fields: the type and the list of names both come from it. */
export const EMPTY_VALUES = {
  fullName: '',
  email: '',
  department: '',
  jobTitle: '',
  level: '',
  countryCode: '',
  employmentType: '',
  gender: '',
  hireDate: '',
  /** Major units as typed, create only. */
  salary: '',
};

export type FormValues = typeof EMPTY_VALUES;

const NAMES: readonly string[] = Object.keys(EMPTY_VALUES);

export const isFormField = (name: string): name is keyof FormValues => NAMES.includes(name);

/** The API calls it salaryMinor; the form field holds the typed amount. */
export const formFieldOf = (apiField: string) => (apiField === 'salaryMinor' ? 'salary' : apiField);

export const valuesOf = (e: Employee): FormValues => ({
  ...EMPTY_VALUES,
  fullName: e.fullName,
  email: e.email,
  department: e.department,
  jobTitle: e.jobTitle,
  level: e.level,
  countryCode: e.countryCode,
  employmentType: e.employmentType,
  gender: e.gender,
  hireDate: e.hireDate,
});

export function issueErrors(error: ZodError, rename: (field: string) => string = (f) => f) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[rename(String(issue.path[0]))] ??= issue.message;
  return errors;
}

/** Form values → request body, validated with the shared schema. Country is never sent on update. */
export function buildEmployeeBody(
  mode: 'create' | 'edit',
  values: FormValues,
  version: number,
): Built {
  const { salary, countryCode, ...fields } = values;
  if (mode === 'edit') {
    const parsed = employeeUpdateSchema.safeParse({ ...fields, version });
    return parsed.success
      ? { ok: true, body: parsed.data }
      : { ok: false, errors: issueErrors(parsed.error) };
  }
  const salaryMinor = parseAmount(salary, countryCode);
  const parsed = employeeCreateSchema.safeParse({
    ...fields,
    countryCode,
    salaryMinor: salaryMinor ?? 0,
  });
  const errors = parsed.success ? {} : issueErrors(parsed.error, formFieldOf);
  if (salaryMinor === null) errors.salary = AMOUNT_HINT;
  return Object.keys(errors).length === 0 && parsed.success
    ? { ok: true, body: parsed.data }
    : { ok: false, errors };
}
