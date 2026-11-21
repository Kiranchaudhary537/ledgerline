import type { GenderGapRow } from '@acme/shared';
import { expect, test } from 'vitest';
import { gapLimit, gapParts, sortByGap } from '@/features/insights/model/gap-geometry';

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

test('the gap is worded with its direction', () => {
  expect(gapParts(8.3)).toEqual({ value: '8.3%', note: 'women paid less' });
  expect(gapParts(-2)).toEqual({ value: '2%', note: 'women paid more' });
  expect(gapParts(0)).toEqual({ value: '0%', note: 'no gap' });
});
