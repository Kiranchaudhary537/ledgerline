import type { SalaryChange } from '@acme/shared';
import { describe, expect, test } from 'vitest';
import { freshIds, newestFirst, reasonKind, salarySteps, toHistoryRows } from './history';

const change = (
  id: number,
  oldSalaryMinor: number | null,
  newSalaryMinor: number,
  reason: string,
) =>
  ({
    id,
    oldSalaryMinor,
    newSalaryMinor,
    reason,
    changedAt: `2025-0${id}-01T00:00:00.000Z`,
    changedByName: id === 1 ? null : 'Priya',
  }) satisfies SalaryChange;

const rows = toHistoryRows([
  change(1, null, 100, 'Hired'),
  change(2, 100, 110, 'Annual review 2025'),
  change(3, 110, 154, 'Promotion to lead'),
]);

describe('reasonKind', () => {
  test('starting salary wins over the text; known reasons are recognised in any case', () => {
    expect(reasonKind({ oldSalaryMinor: null, reason: 'Promotion' })).toBe('start');
    expect(reasonKind({ oldSalaryMinor: 1, reason: 'PROMOTION to lead' })).toBe('promotion');
    expect(reasonKind({ oldSalaryMinor: 1, reason: 'Annual review' })).toBe('review');
    expect(reasonKind({ oldSalaryMinor: 1, reason: 'Market adjustment' })).toBe('other');
  });
});

describe('toHistoryRows', () => {
  test('computes the change, names imported rows', () => {
    expect(rows[0]).toMatchObject({ change: null, changedBy: 'Imported', reasonKind: 'start' });
    expect(rows[1]).toMatchObject({ change: 0.1, changedBy: 'Priya' });
    expect(rows[2]!.change).toBe(0.4);
  });
});

describe('freshIds', () => {
  test('names only the rows not seen before', () => {
    expect(freshIds(new Set([1, 2]), rows)).toEqual(new Set([3]));
    expect(freshIds(new Set(), rows).size).toBe(3);
  });
});

test('newestFirst does not touch the input', () => {
  expect(newestFirst(rows).map((r) => r.id)).toEqual([3, 2, 1]);
  expect(rows.map((r) => r.id)).toEqual([1, 2, 3]);
});

describe('salarySteps', () => {
  test('ascending by date, then one point at now holding the last salary', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const steps = salarySteps(rows, now);
    expect(steps.map((s) => s.salaryMinor)).toEqual([100, 110, 154, 154]);
    expect(steps.at(-1)?.at).toBe(now);
  });

  test('no history gives no steps; a change after now adds nothing', () => {
    expect(salarySteps([], 5)).toEqual([]);
    expect(salarySteps(rows, 0)).toHaveLength(3);
  });
});
