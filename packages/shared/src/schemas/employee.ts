import { z } from 'zod';
import {
  COUNTRY_CODES,
  DEPARTMENT_NAMES,
  EMPLOYMENT_TYPES,
  GENDERS,
  isTitleInDepartment,
  JOB_TITLES,
  LEVELS,
} from '../constants.ts';
import { emailSchema, salaryMinorSchema, versionSchema } from './common.ts';

const TITLE_NOT_IN_DEPARTMENT = 'Choose a job title in this department';

const employeeFields = {
  fullName: z
    .string()
    .trim()
    .min(1, { error: 'Enter a name' })
    .max(120, { error: 'Name is too long' }),
  email: emailSchema,
  department: z.enum(DEPARTMENT_NAMES, { error: 'Choose a department' }),
  jobTitle: z.enum(JOB_TITLES, { error: 'Choose a job title' }),
  level: z.enum(LEVELS, { error: 'Choose a level' }),
  countryCode: z.enum(COUNTRY_CODES, { error: 'Choose a country' }),
  employmentType: z.enum(EMPLOYMENT_TYPES, { error: 'Choose an employment type' }),
  gender: z.enum(GENDERS, { error: 'Choose a gender' }),
  hireDate: z.iso.date({ error: 'Enter a date as YYYY-MM-DD' }),
};

export const employeeCreateSchema = z
  .object({ ...employeeFields, salaryMinor: salaryMinorSchema })
  .refine((e) => isTitleInDepartment(e.jobTitle, e.department), {
    path: ['jobTitle'],
    error: TITLE_NOT_IN_DEPARTMENT,
  });

/** Edits everything except salary (salary changes have their own endpoint). */
export const employeeUpdateSchema = z
  .object(employeeFields)
  .partial()
  .extend({ version: versionSchema })
  // When only one of the two is sent, the service checks it against the stored value.
  .refine((e) => !e.jobTitle || !e.department || isTitleInDepartment(e.jobTitle, e.department), {
    path: ['jobTitle'],
    error: TITLE_NOT_IN_DEPARTMENT,
  });

export type EmployeeCreate = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
