import { z } from 'zod';
import { config } from '../config.ts';
import { COUNTRY_CODES, EMPLOYMENT_TYPES, GENDERS, LEVELS } from '../constants.ts';
import { emailSchema, salaryMinorSchema, versionSchema } from './common.ts';

const employeeFields = {
  fullName: z
    .string()
    .trim()
    .min(1, { error: 'Enter a name' })
    .max(config.text.fullNameMaxLength, { error: 'Name is too long' }),
  email: emailSchema,
  department: z
    .string({ error: 'Choose a department' })
    .trim()
    .min(1, { error: 'Choose a department' })
    .max(config.text.nameMaxLength),
  jobTitle: z
    .string({ error: 'Choose a job title' })
    .trim()
    .min(1, { error: 'Choose a job title' })
    .max(config.text.nameMaxLength),
  level: z.enum(LEVELS, { error: 'Choose a level' }),
  countryCode: z.enum(COUNTRY_CODES, { error: 'Choose a country' }),
  employmentType: z.enum(EMPLOYMENT_TYPES, { error: 'Choose an employment type' }),
  gender: z.enum(GENDERS, { error: 'Choose a gender' }),
  hireDate: z.iso.date({ error: 'Enter a date as YYYY-MM-DD' }),
};

const { countryCode: _locked, ...editableFields } = employeeFields;

export const employeeCreateSchema = z.object({ ...employeeFields, salaryMinor: salaryMinorSchema });

/** Edits everything except salary (own endpoint) and country (see below). */
export const employeeUpdateSchema = z
  .object(editableFields)
  .partial()
  .extend({
    version: versionSchema,
    // Salary stays in the old currency's minor units, so a country edit would corrupt it.
    countryCode: z
      .undefined({ error: "Country can't be changed; add a new record for a relocation" })
      .optional(),
  });

export type EmployeeCreate = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
