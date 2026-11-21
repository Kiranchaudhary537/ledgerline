import type { Employee, MutationResult } from '@acme/db';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../errors.ts';
import { EmployeeService, type EmployeeStore } from './service.ts';

const row: Employee = {
  id: 1,
  employeeCode: 'ACME-00001',
  fullName: 'Priya Sharma',
  email: 'priya@acme.example',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 380_000_000,
  version: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
};

function serviceWith(store: Partial<EmployeeStore>) {
  return new EmployeeService(store as EmployeeStore);
}

const codeOf = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (e: unknown) => (e instanceof AppError ? e.code : e),
  );

describe('EmployeeService', () => {
  it('maps a stale salary change to STALE_VERSION', async () => {
    const service = serviceWith({
      changeSalary: async (): Promise<MutationResult> => ({ status: 'stale' }),
    });
    const input = { newSalaryMinor: 1, reason: 'Promotion', version: 1 };
    expect(await codeOf(service.changeSalary(1, input, 7))).toBe('STALE_VERSION');
  });

  it('maps a stale update to STALE_VERSION and a missing one to NOT_FOUND', async () => {
    const stale = serviceWith({
      update: async (): Promise<MutationResult> => ({ status: 'stale' }),
    });
    const missing = serviceWith({
      update: async (): Promise<MutationResult> => ({ status: 'not_found' }),
    });
    expect(await codeOf(stale.update(1, { version: 1 }))).toBe('STALE_VERSION');
    expect(await codeOf(missing.update(1, { version: 1 }))).toBe('NOT_FOUND');
  });

  it('returns NOT_FOUND for a missing employee, delete and history', async () => {
    const service = serviceWith({
      get: async () => undefined,
      softDelete: async () => false,
    });
    expect(await codeOf(service.get(9))).toBe('NOT_FOUND');
    expect(await codeOf(service.remove(9))).toBe('NOT_FOUND');
    expect(await codeOf(service.salaryHistory(9))).toBe('NOT_FOUND');
  });

  it('adds the currency and ISO timestamps to an employee', async () => {
    const service = serviceWith({ get: async () => row });
    expect(await service.get(1)).toMatchObject({
      currency: 'INR',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });

  it('builds a CSV with a header, major-unit salary and currency', async () => {
    const service = serviceWith({
      export: async function* () {
        yield row;
        yield { ...row, fullName: '=cmd,"x"', countryCode: 'JP', salaryMinor: 9_000_000 };
      },
    });
    let csv = '';
    for await (const chunk of service.exportCsv({}, 'name:asc')) csv += chunk;
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      'Code,Name,Email,Department,Job title,Level,Country,Employment type,Gender,Hire date,Annual salary,Currency',
    );
    expect(lines[1]).toBe(
      'ACME-00001,Priya Sharma,priya@acme.example,Engineering,Software Engineer,senior,IN,full_time,female,2021-04-12,3800000.00,INR',
    );
    expect(lines[2]).toContain('"\'=cmd,""x"""');
    expect(lines[2]).toContain(',9000000,JPY');
    expect(lines[3]).toBe('');
  });
});
