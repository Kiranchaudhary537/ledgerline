import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { fieldErrors } from '../errors.ts';
import { loginSchema } from './auth.ts';
import { employeeCreateSchema, employeeUpdateSchema } from './employee.ts';
import { distributionQuerySchema, genderGapQuerySchema, statsQuerySchema } from './insights.ts';
import { listQuerySchema } from './list-query.ts';
import { salaryChangeSchema } from './salary-change.ts';

/** Parses and returns field errors ({} when valid). */
function errorsOf(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

const validEmployee = {
  fullName: '  Priya Sharma ',
  email: ' Priya.Sharma@ACME.example ',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  level: 'senior',
  countryCode: 'IN',
  employmentType: 'full_time',
  gender: 'female',
  hireDate: '2021-04-12',
  salaryMinor: 380_000_000,
};

describe('employeeCreateSchema', () => {
  it('accepts a valid employee and normalises name and email', () => {
    const parsed = employeeCreateSchema.parse(validEmployee);
    expect(parsed.fullName).toBe('Priya Sharma');
    expect(parsed.email).toBe('priya.sharma@acme.example');
  });

  it('rejects a job title from another department', () => {
    expect(errorsOf(employeeCreateSchema, { ...validEmployee, jobTitle: 'Recruiter' })).toEqual({
      jobTitle: 'Choose a job title in this department',
    });
  });

  it('rejects salaries that are not positive whole minor units', () => {
    for (const salaryMinor of [0, -1, 10.5]) {
      expect(errorsOf(employeeCreateSchema, { ...validEmployee, salaryMinor })).toEqual({
        salaryMinor: 'Enter a salary above 0',
      });
    }
  });

  it('reports every invalid field at once', () => {
    const errors = errorsOf(employeeCreateSchema, {
      ...validEmployee,
      fullName: ' ',
      email: 'not-an-email',
      countryCode: 'XX',
      hireDate: '12/04/2021',
    });
    expect(Object.keys(errors).sort()).toEqual(['countryCode', 'email', 'fullName', 'hireDate']);
  });
});

describe('employeeUpdateSchema', () => {
  it('accepts a partial edit with a version', () => {
    expect(employeeUpdateSchema.parse({ level: 'lead', version: 3 })).toEqual({
      level: 'lead',
      version: 3,
    });
  });

  it('requires a version', () => {
    expect(errorsOf(employeeUpdateSchema, { level: 'lead' })).toHaveProperty('version');
  });

  it('does not allow changing salary (it has its own endpoint)', () => {
    expect(employeeUpdateSchema.parse({ version: 1, salaryMinor: 5 })).not.toHaveProperty(
      'salaryMinor',
    );
  });
});

describe('salaryChangeSchema', () => {
  it('requires a meaningful reason', () => {
    expect(
      errorsOf(salaryChangeSchema, { newSalaryMinor: 100, reason: '  ok ', version: 1 }),
    ).toEqual({ reason: 'Enter a reason (at least 3 characters)' });
  });

  it('accepts a valid change and trims the reason', () => {
    expect(
      salaryChangeSchema.parse({ newSalaryMinor: 100, reason: ' Promotion ', version: 1 }).reason,
    ).toBe('Promotion');
  });
});

describe('loginSchema', () => {
  it('normalises the email', () => {
    expect(loginSchema.parse({ email: ' HR@Acme.example ', password: 'x' }).email).toBe(
      'hr@acme.example',
    );
  });
});

describe('listQuerySchema (query strings)', () => {
  it('applies defaults', () => {
    expect(listQuerySchema.parse({})).toEqual({ sort: 'name:asc', page: 1, pageSize: 25 });
  });

  it('parses comma-separated multi values and numbers', () => {
    expect(listQuerySchema.parse({ country: 'IN,DE', level: 'senior', page: '3' })).toMatchObject({
      country: ['IN', 'DE'],
      level: ['senior'],
      page: 3,
    });
  });

  it('treats empty params as absent', () => {
    expect(listQuerySchema.parse({ q: '', country: '' })).toEqual(listQuerySchema.parse({}));
  });

  it('rejects unknown values and limits', () => {
    expect(errorsOf(listQuerySchema, { country: 'IN,XX' })).toHaveProperty('country');
    expect(errorsOf(listQuerySchema, { pageSize: '101' })).toHaveProperty('pageSize');
    expect(errorsOf(listQuerySchema, { sort: 'password:asc' })).toHaveProperty('sort');
    expect(errorsOf(listQuerySchema, { q: 'a' })).toHaveProperty('q');
  });

  it('allows salary sort only within exactly one country', () => {
    expect(errorsOf(listQuerySchema, { sort: 'salary:desc' })).toEqual({
      sort: 'Filter to one country to sort by salary',
    });
    expect(errorsOf(listQuerySchema, { sort: 'salary:desc', country: 'IN,DE' })).toHaveProperty(
      'sort',
    );
    expect(errorsOf(listQuerySchema, { sort: 'salary:desc', country: 'IN' })).toEqual({});
  });

  it('allows compa-ratio sort across countries', () => {
    expect(errorsOf(listQuerySchema, { sort: 'compaRatio:desc' })).toEqual({});
  });
});

describe('insights queries', () => {
  it('requires one country unless grouped by country', () => {
    expect(errorsOf(statsQuerySchema, { groupBy: 'jobTitle' })).toEqual({
      country: 'Choose one country',
    });
    expect(errorsOf(statsQuerySchema, { groupBy: 'jobTitle,level', country: 'IN' })).toEqual({});
    expect(errorsOf(statsQuerySchema, { groupBy: 'country' })).toEqual({});
  });

  it('limits groupBy to 1–2 distinct known dimensions', () => {
    expect(errorsOf(statsQuerySchema, { groupBy: '', country: 'IN' })).toHaveProperty('groupBy');
    expect(
      errorsOf(statsQuerySchema, { groupBy: 'jobTitle,level,gender', country: 'IN' }),
    ).toHaveProperty('groupBy');
    expect(errorsOf(statsQuerySchema, { groupBy: 'level,level', country: 'IN' })).toHaveProperty(
      'groupBy',
    );
    expect(errorsOf(statsQuerySchema, { groupBy: 'salary', country: 'IN' })).toHaveProperty(
      'groupBy',
    );
  });

  it('does not allow grouping the gender gap by gender', () => {
    expect(errorsOf(genderGapQuerySchema, { groupBy: 'gender', country: 'IN' })).toHaveProperty(
      'groupBy',
    );
  });

  it('distribution needs one country and caps buckets', () => {
    expect(distributionQuerySchema.parse({ country: 'IN' }).buckets).toBe(20);
    expect(errorsOf(distributionQuerySchema, { country: 'IN', buckets: '51' })).toHaveProperty(
      'buckets',
    );
    expect(errorsOf(distributionQuerySchema, {})).toEqual({ country: 'Choose one country' });
  });
});
