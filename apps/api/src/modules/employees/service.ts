import {
  changeSalary,
  createEmployee,
  type Db,
  type Employee as DbEmployee,
  exportEmployees,
  getEmployee,
  getSalaryHistory,
  listEmployees,
  type MutationResult,
  softDeleteEmployee,
  updateEmployee,
} from '@acme/db';
import {
  type Employee,
  type EmployeeCreate,
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

export async function list(db: Db, query: ListQuery): Promise<EmployeeList> {
  const { data, total } = await listEmployees(db, query);
  return { data: data.map(toEmployee), page: query.page, pageSize: query.pageSize, total };
}

export async function get(db: Db, id: number): Promise<Employee> {
  const employee = await getEmployee(db, id);
  if (!employee) throw new AppError('NOT_FOUND');
  return toEmployee(employee);
}

export async function create(db: Db, input: EmployeeCreate, changedBy: number) {
  return toEmployee(await createEmployee(db, input, changedBy));
}

export async function update(db: Db, id: number, input: EmployeeUpdate): Promise<Employee> {
  return unwrap(await updateEmployee(db, id, input));
}

export async function remove(db: Db, id: number) {
  if (!(await softDeleteEmployee(db, id))) throw new AppError('NOT_FOUND');
}

export async function changeEmployeeSalary(
  db: Db,
  id: number,
  input: SalaryChangeInput,
  changedBy: number,
) {
  return unwrap(await changeSalary(db, { id, ...input, changedBy }));
}

export async function salaryHistory(db: Db, id: number): Promise<SalaryChange[]> {
  if (!(await getEmployee(db, id))) throw new AppError('NOT_FOUND');
  const rows = await getSalaryHistory(db, id);
  return rows.map((r) => ({ ...r, changedAt: iso(r.changedAt) }));
}

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
  'Compa-ratio',
];

export async function exportCsv(db: Db, filters: Filters, sort: SortOption): Promise<string> {
  const rows = await exportEmployees(db, filters, sort);
  return (
    csvRow(CSV_HEADER) +
    rows
      .map((e) =>
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
          e.compaRatio.toFixed(2),
        ]),
      )
      .join('')
  );
}
