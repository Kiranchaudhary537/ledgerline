import type {
  CountryCode,
  Department,
  EmploymentType,
  Gender,
  JobTitle,
  Level,
} from '@acme/shared';
import type { ColumnType, Generated, GeneratedAlways } from 'kysely';

/** Table types in camelCase (CamelCasePlugin maps to snake_case columns). */
export interface Database {
  countries: CountriesTable;
  users: UsersTable;
  sessions: SessionsTable;
  employees: EmployeesTable;
  salaryChanges: SalaryChangesTable;
}

type CreatedAt = Generated<Date>;
/** 'YYYY-MM-DD' strings in and out. */
type DateOnly = ColumnType<string, string, string>;

export interface CountriesTable {
  code: CountryCode;
  name: string;
  currency: string;
  locale: string;
  minorUnit: number;
}

export interface UsersTable {
  id: GeneratedAlways<number>;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: CreatedAt;
}

export interface SessionsTable {
  id: string;
  userId: number;
  expiresAt: Date;
  createdAt: CreatedAt;
}

export interface EmployeesTable {
  id: GeneratedAlways<number>;
  employeeCode: GeneratedAlways<string>;
  fullName: string;
  email: string;
  department: Department;
  jobTitle: JobTitle;
  level: Level;
  countryCode: CountryCode;
  employmentType: EmploymentType;
  gender: Gender;
  hireDate: DateOnly;
  salaryMinor: number;
  version: Generated<number>;
  createdAt: CreatedAt;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface SalaryChangesTable {
  id: GeneratedAlways<number>;
  employeeId: number;
  oldSalaryMinor: number | null;
  newSalaryMinor: number;
  reason: string;
  changedBy: number | null;
  changedAt: Generated<Date>;
}
