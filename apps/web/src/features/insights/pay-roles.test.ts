import type { InsightsStatsRow } from '@acme/shared';
import { expect, test } from 'vitest';
import { groupByRole } from './pay-roles';

const row = (jobTitle: string, level: string, count: number, median: number): InsightsStatsRow => ({
  group: { jobTitle, level },
  count,
  min: median - 10,
  p25: median - 5,
  median,
  p75: median + 5,
  max: median + 10,
  avg: median,
  total: median * count,
  avgCompaRatio: 1,
  outOfBandCount: 0,
  compaP25: 0.95,
  compaP75: 1.05,
  currency: 'INR',
});

test('one entry per title, levels in career order, people summed, median range', () => {
  const roles = groupByRole([
    row('Engineer', 'senior', 3, 300),
    row('Analyst', 'mid', 1, 50),
    row('Engineer', 'junior', 2, 100),
  ]);
  expect(roles.map((r) => r.jobTitle)).toEqual(['Engineer', 'Analyst']);
  const [eng] = roles;
  expect(eng!.levels.map((l) => l.group.level)).toEqual(['junior', 'senior']);
  expect(eng).toMatchObject({ count: 5, lowMedian: 100, highMedian: 300 });
});

test('sums people outside band and takes the widest compa-ratio spread across levels', () => {
  const wide = {
    ...row('Engineer', 'senior', 3, 300),
    outOfBandCount: 2,
    compaP25: 0.8,
    compaP75: 1.1,
  };
  const tight = { ...row('Engineer', 'junior', 2, 100), outOfBandCount: 1 };
  const [eng] = groupByRole([wide, tight]);
  expect(eng).toMatchObject({ outOfBand: 3, spread: 0.3, wideSpread: true });
  const [calm] = groupByRole([tight]);
  expect(calm).toMatchObject({ outOfBand: 1, spread: 0.1, wideSpread: false });
});

test('a spread of exactly the review limit is not flagged', () => {
  const edge = { ...row('Engineer', 'mid', 3, 300), compaP25: 0.9, compaP75: 1.1 };
  expect(groupByRole([edge])[0]).toMatchObject({ spread: 0.2, wideSpread: false });
});
