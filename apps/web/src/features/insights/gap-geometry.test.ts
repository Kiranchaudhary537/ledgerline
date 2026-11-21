import type { GenderGapRow } from '@acme/shared';
import { expect, test } from 'vitest';
import { gapLimit, gapPosition, sortByGap } from './gap-geometry';

const row = (jobTitle: string, gapPct: number | null): GenderGapRow => ({
  group: { jobTitle },
  femaleMedian: null,
  maleMedian: null,
  femaleCount: 0,
  maleCount: 0,
  gapPct,
  currency: 'INR',
});

test('sorts by gap, women paid least first, and puts groups without a gap last', () => {
  const sorted = sortByGap([row('B', null), row('A', -2), row('C', 7.5), row('D', 0)]);
  expect(sorted.map((r) => r.group.jobTitle)).toEqual(['C', 'D', 'A', 'B']);
});

test('the axis is symmetric around zero and rounds the largest gap up to a multiple of 5', () => {
  expect(gapLimit([row('A', 7.5), row('B', -2), row('C', null)])).toBe(10);
  expect(gapLimit([row('A', 10)])).toBe(10);
  expect(gapLimit([row('A', null)])).toBe(5);
});

test('zero sits in the middle, the limits at the edges', () => {
  expect(gapPosition(10, 0)).toBe(50);
  expect(gapPosition(10, 10)).toBe(100);
  expect(gapPosition(10, -5)).toBe(25);
  expect(gapPosition(10, 40)).toBe(100);
});
