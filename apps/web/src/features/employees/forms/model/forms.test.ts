import { describe, expect, test } from 'vitest';
import { bandRow, employee } from '@/features/employees/shared/fixtures';
import { buildEmployeeBody, EMPTY_VALUES, formFieldOf, valuesOf } from './employee-form';
import { AMOUNT_HINT } from './money-input';
import {
  buildSalaryChangeBody,
  proposalText,
  proposedMinor,
  PROPOSAL_PROMPT,
} from './salary-change';

describe('employee form', () => {
  test('edit sends the values and the version, never the country', () => {
    const result = buildEmployeeBody('edit', valuesOf(employee), 3);
    expect(result.ok && result.body).toMatchObject({ fullName: 'Sandeep Singh', version: 3 });
    expect(result.ok && result.body).not.toHaveProperty('countryCode');
  });

  test('create parses the typed salary into minor units', () => {
    const values = { ...valuesOf(employee), salary: '19,50,000' };
    const result = buildEmployeeBody('create', values, 0);
    expect(result.ok && result.body).toMatchObject({ countryCode: 'IN', salaryMinor: 195000000 });
  });

  test('an unreadable salary is reported next to the schema errors for the other fields', () => {
    const result = buildEmployeeBody('create', { ...EMPTY_VALUES, salary: 'abc' }, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.salary).toBe(AMOUNT_HINT);
      expect(result.errors.fullName).toBeTruthy();
    }
  });

  test('API field names map to form fields', () => {
    expect(formFieldOf('salaryMinor')).toBe('salary');
    expect(formFieldOf('email')).toBe('email');
  });
});

describe('salary change', () => {
  test('builds the body with the employee version', () => {
    const result = buildSalaryChangeBody({ newSalary: '19,50,000', reason: 'Promotion' }, employee);
    expect(result).toEqual({
      ok: true,
      body: { newSalaryMinor: 195000000, reason: 'Promotion', version: 3 },
    });
  });

  test('reports a bad amount and a short reason together', () => {
    const result = buildSalaryChangeBody({ newSalary: 'x', reason: 'x' }, employee);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).toSorted()).toEqual(['newSalary', 'reason']);
  });

  test('proposal text: prompt, change only, change with band position', () => {
    expect(proposedMinor('', 'IN')).toBeNull();
    expect(proposedMinor('19,50,000', 'IN')).toBe(195000000);
    expect(proposalText(employee.salaryMinor, null, bandRow)).toBe(PROPOSAL_PROMPT);
    expect(proposalText(employee.salaryMinor, 195000000, undefined)).toBe('+8.9% from today');
    expect(proposalText(employee.salaryMinor, 195000000, bandRow)).toBe(
      '+8.9% from today, above the middle half of the band',
    );
  });
});
