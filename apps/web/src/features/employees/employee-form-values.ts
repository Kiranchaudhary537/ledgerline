import type { Employee } from '@acme/shared';

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
