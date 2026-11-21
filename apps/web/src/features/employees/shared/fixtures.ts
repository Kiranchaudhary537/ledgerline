import type { Employee, FilterOptions, StatsRow } from '@acme/shared';

export const filterOptions: FilterOptions = {
  countries: [
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
  ],
  departments: [{ name: 'Engineering', jobTitles: ['Software Engineer', 'QA Engineer'] }],
  levels: ['junior', 'mid', 'senior'],
  employmentTypes: ['full_time', 'part_time', 'contract'],
  genders: ['female', 'male'],
};

export const employee = {
  id: 7,
  employeeCode: 'ACME-00022',
  fullName: 'Sandeep Singh',
  email: 'sandeep@acme.test',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'mid',
  countryCode: 'IN',
  currency: 'INR',
  employmentType: 'full_time',
  gender: 'male',
  hireDate: '2022-08-08',
  salaryMinor: 179000000,
  version: 3,
  createdAt: '2022-08-08T00:00:00.000Z',
  updatedAt: '2025-08-08T00:00:00.000Z',
} as Employee;

export const bandRow: StatsRow = {
  group: { level: 'mid' },
  count: 120,
  min: 154000000,
  p25: 168000000,
  median: 175000000,
  p75: 183750000,
  max: 199000000,
  avg: 175000000,
  total: 0,
  currency: 'INR',
};

export const session = { user: { id: 1, email: 'hr@acme.test', name: 'Hana HR' } };
