export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', minorUnit: 2 },
  { code: 'IN', name: 'India', currency: 'INR', locale: 'en-IN', minorUnit: 2 },
  { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de-DE', minorUnit: 2 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', minorUnit: 2 },
  { code: 'JP', name: 'Japan', currency: 'JPY', locale: 'ja-JP', minorUnit: 0 },
  { code: 'BR', name: 'Brazil', currency: 'BRL', locale: 'pt-BR', minorUnit: 2 },
  { code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA', minorUnit: 2 },
  { code: 'AU', name: 'Australia', currency: 'AUD', locale: 'en-AU', minorUnit: 2 },
] as const;

export type Country = (typeof COUNTRIES)[number];
export type CountryCode = Country['code'];
export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

export function getCountry(code: CountryCode): Country {
  // Safe: CountryCode only allows codes from COUNTRIES.
  return COUNTRIES.find((c) => c.code === code)!;
}

export const DEPARTMENTS = {
  Engineering: ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Engineering Manager'],
  Product: ['Product Manager', 'Product Designer'],
  Data: ['Data Analyst', 'Data Scientist'],
  Sales: ['Account Executive', 'Sales Development Representative'],
  Marketing: ['Marketing Manager', 'Content Specialist'],
  'Customer Support': ['Support Specialist', 'Support Team Lead'],
  Finance: ['Accountant', 'Financial Analyst'],
  People: ['HR Business Partner', 'Recruiter'],
} as const;

export type Department = keyof typeof DEPARTMENTS;
export type JobTitle = (typeof DEPARTMENTS)[Department][number];
export const DEPARTMENT_NAMES = Object.keys(DEPARTMENTS) as [Department, ...Department[]];
export const JOB_TITLES = Object.values(DEPARTMENTS).flat() as [JobTitle, ...JobTitle[]];

export function isTitleInDepartment(jobTitle: JobTitle, department: Department): boolean {
  return (DEPARTMENTS[department] as readonly string[]).includes(jobTitle);
}

/** Ordered from most junior to most senior. */
export const LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;
export type Level = (typeof LEVELS)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const GENDERS = ['female', 'male'] as const;
export type Gender = (typeof GENDERS)[number];
