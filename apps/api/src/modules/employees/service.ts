import type { Employee as DbEmployee, EmployeeRepository, MutationResult } from '@acme/db';
import {
  type Employee,
  type EmployeeCreate,
  type EmployeeFacets,
  type EmployeeList,
  type EmployeeUpdate,
  type Filters,
  getCountry,
  type ListQuery,
  type SalaryChange,
  type SalaryChangeInput,
  type SortOption,
} from '@acme/shared';
import { AppError } from '../../errors.ts';
import { csvRow, formatMajor } from './csv.ts';

/** What the service needs from the repository (a class with private fields cannot be faked). */
export type EmployeeStore = Pick<
  EmployeeRepository,
  | 'list'
  | 'facets'
  | 'get'
  | 'create'
  | 'update'
  | 'softDelete'
  | 'changeSalary'
  | 'history'
  | 'export'
>;

const CSV_HEADER = [
  'Code',
  'Name',
  'Email',
  'Department',
  'Job title',
  'Level',
  'Country',
  'Employment type',
  'Gender',
  'Hire date',
  'Annual salary',
  'Currency',
];

const iso = (d: Date | string) => new Date(d).toISOString();

function toEmployee(e: DbEmployee): Employee {
  return {
    ...e,
    currency: getCountry(e.countryCode).currency,
    createdAt: iso(e.createdAt),
    updatedAt: iso(e.updatedAt),
  };
}

function unwrap(result: MutationResult): Employee {
  if (result.status === 'not_found') throw new AppError('NOT_FOUND');
  if (result.status === 'stale') throw new AppError('STALE_VERSION');
  return toEmployee(result.employee);
}

export class EmployeeService {
  private readonly employees: EmployeeStore;

  constructor(employees: EmployeeStore) {
    this.employees = employees;
  }

  async list(query: ListQuery): Promise<EmployeeList> {
    const { data, total } = await this.employees.list(query);
    return { data: data.map(toEmployee), page: query.page, pageSize: query.pageSize, total };
  }

  facets(filters: Filters): Promise<EmployeeFacets> {
    return this.employees.facets(filters);
  }

  async get(id: number): Promise<Employee> {
    const employee = await this.employees.get(id);
    if (!employee) throw new AppError('NOT_FOUND');
    return toEmployee(employee);
  }

  async create(input: EmployeeCreate, changedBy: number): Promise<Employee> {
    return toEmployee(await this.employees.create(input, changedBy));
  }

  async update(id: number, input: EmployeeUpdate): Promise<Employee> {
    return unwrap(await this.employees.update(id, input));
  }

  async remove(id: number): Promise<void> {
    if (!(await this.employees.softDelete(id))) throw new AppError('NOT_FOUND');
  }

  async changeSalary(id: number, input: SalaryChangeInput, changedBy: number): Promise<Employee> {
    return unwrap(await this.employees.changeSalary({ id, ...input, changedBy }));
  }

  async salaryHistory(id: number): Promise<SalaryChange[]> {
    if (!(await this.employees.get(id))) throw new AppError('NOT_FOUND');
    const rows = await this.employees.history(id);
    return rows.map((r) => ({ ...r, changedAt: iso(r.changedAt) }));
  }

  async exportCsv(filters: Filters, sort: SortOption): Promise<string> {
    const rows = await this.employees.export(filters, sort);
    const lines = rows.map((e) =>
      csvRow([
        e.employeeCode,
        e.fullName,
        e.email,
        e.department,
        e.jobTitle,
        e.level,
        e.countryCode,
        e.employmentType,
        e.gender,
        e.hireDate,
        formatMajor(e.salaryMinor, e.countryCode),
        getCountry(e.countryCode).currency,
      ]),
    );
    return csvRow(CSV_HEADER) + lines.join('');
  }
}
