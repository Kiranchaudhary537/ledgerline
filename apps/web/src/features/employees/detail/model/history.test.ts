import type { SalaryChange } from '@acme/shared';
import { describe, expect, test } from 'vitest';
import { reasonKind, sortHistoryRows, toHistoryRows } from './history';

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

describe('sortHistoryRows', () => {
  test('sorts by each key in both directions without touching the input', () => {
    expect(sortHistoryRows(rows, 'date', 'desc').map((r) => r.id)).toEqual([3, 2, 1]);
    expect(sortHistoryRows(rows, 'to', 'asc').map((r) => r.id)).toEqual([1, 2, 3]);
    expect(sortHistoryRows(rows, 'change', 'desc').map((r) => r.id)).toEqual([3, 2, 1]);
    expect(sortHistoryRows(rows, 'by', 'asc').map((r) => r.id)).toEqual([1, 2, 3]);
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3]);
  });
});
