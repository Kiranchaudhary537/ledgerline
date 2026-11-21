import { employeeCreateSchema, isTitleInDepartment, LEVELS } from '@acme/shared';
import { describe, expect, it } from 'vitest';
import { generateEmployees, REFERENCE_DATE, salaryBand, type SeedEmployee } from './generate.ts';

const employees = generateEmployees({ seed: 42, count: 10_000 });

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};
const count = (pred: (e: SeedEmployee) => boolean) => employees.filter(pred).length;

describe('generateEmployees', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = generateEmployees({ seed: 7, count: 500 });
    expect(generateEmployees({ seed: 7, count: 500 })).toEqual(a);
    expect(generateEmployees({ seed: 8, count: 500 })).not.toEqual(a);
  });

  it('creates the requested number of employees', () => {
    expect(employees).toHaveLength(10_000);
  });

  it('produces only employees the API itself would accept', () => {
    for (const { history: _, ...e } of employees) {
      expect(employeeCreateSchema.safeParse(e).success, e.email).toBe(true);
    }
  });

  it('gives every employee a unique email built from their name', () => {
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
    for (const e of employees.slice(0, 200)) {
      const [first] = e.fullName
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(' ');
      expect(e.email.startsWith(`${first}.`), `${e.fullName} → ${e.email}`).toBe(true);
    }
  });

  it('keeps job titles inside their department', () => {
    expect(employees.every((e) => isTitleInDepartment(e.jobTitle, e.department))).toBe(true);
  });

  it('keeps every salary inside its band', () => {
    for (const e of employees) {
      const { min, max } = salaryBand(e);
      expect(e.salaryMinor, e.email).toBeGreaterThanOrEqual(min);
      expect(e.salaryMinor, e.email).toBeLessThanOrEqual(max);
    }
  });

  it('pays more for more senior levels', () => {
    const mids = LEVELS.map((level) => {
      const b = salaryBand({ countryCode: 'US', jobTitle: 'Software Engineer', level });
      return (b.min + b.max) / 2;
    });
    expect([...mids].sort((a, b) => a - b)).toEqual(mids);
  });

  it('uses realistic local salaries', () => {
    // Mid Software Engineer, full time
    const us = salaryBand({ countryCode: 'US', jobTitle: 'Software Engineer', level: 'mid' });
    expect(us.min).toBeGreaterThan(100_000_00);
    expect(us.max).toBeLessThan(180_000_00);
    const jp = salaryBand({ countryCode: 'JP', jobTitle: 'Software Engineer', level: 'mid' });
    expect(jp.min).toBeGreaterThan(5_000_000);
    expect(jp.max).toBeLessThan(10_000_000);
  });

  it('has uneven headcount across countries', () => {
    const inCountry = (code: string) => count((e) => e.countryCode === code);
    expect(inCountry('IN')).toBeGreaterThan(inCountry('DE'));
    expect(inCountry('US')).toBeGreaterThan(inCountry('JP') * 3);
  });

  it('builds in a small gender pay gap in Engineering', () => {
    const eng = employees.filter(
      (e) =>
        e.department === 'Engineering' &&
        e.countryCode === 'US' &&
        e.jobTitle === 'Software Engineer' &&
        e.level === 'mid' &&
        e.employmentType === 'full_time',
    );
    const f = median(eng.filter((e) => e.gender === 'female').map((e) => e.salaryMinor));
    const m = median(eng.filter((e) => e.gender === 'male').map((e) => e.salaryMinor));
    const gapPct = ((m - f) / m) * 100;
    expect(gapPct).toBeGreaterThan(1);
    expect(gapPct).toBeLessThan(12);
  });

  it('hires senior people earlier than junior people', () => {
    const avgTenure = (level: string) => {
      const years = employees
        .filter((e) => e.level === level)
        .map((e) => (Date.parse(REFERENCE_DATE) - Date.parse(e.hireDate)) / 3.15e10);
      return years.reduce((a, b) => a + b, 0) / years.length;
    };
    expect(avgTenure('principal')).toBeGreaterThan(avgTenure('mid'));
    expect(avgTenure('mid')).toBeGreaterThan(avgTenure('junior'));
    expect(employees.every((e) => e.hireDate <= REFERENCE_DATE)).toBe(true);
  });

  it('gives every employee a salary history that ends at the current salary', () => {
    for (const e of employees) {
      const [first, ...rest] = e.history;
      expect(first).toMatchObject({ oldSalaryMinor: null, changedAt: e.hireDate });
      expect(e.history.at(-1)!.newSalaryMinor).toBe(e.salaryMinor);
      let previous = first!;
      for (const change of rest) {
        expect(change.oldSalaryMinor).toBe(previous.newSalaryMinor);
        expect(change.newSalaryMinor).toBeGreaterThan(change.oldSalaryMinor!);
        expect(change.changedAt > previous.changedAt).toBe(true);
        previous = change;
      }
    }
  });
});
