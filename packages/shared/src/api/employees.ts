import type { CountryCode, EmploymentType, Gender, Level } from '../constants.ts';

/** JSON shape of an employee. Money is integer minor units; dates are ISO strings. */
export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  level: Level;
  countryCode: CountryCode;
  currency: string;
  employmentType: EmploymentType;
  gender: Gender;
  /** YYYY-MM-DD */
  hireDate: string;
  salaryMinor: number;
  /** Salary ÷ median of the same country × title × level × employment type (2 decimals). */
  compaRatio: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeList {
  data: Employee[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SalaryChange {
  id: number;
  /** null for the starting salary */
  oldSalaryMinor: number | null;
  newSalaryMinor: number;
  reason: string;
  changedAt: string;
  /** null for imported history */
  changedByName: string | null;
}

export interface FilterOptions {
  countries: { code: CountryCode; name: string; currency: string }[];
  departments: { name: string; jobTitles: string[] }[];
  levels: Level[];
  employmentTypes: EmploymentType[];
  genders: Gender[];
}
