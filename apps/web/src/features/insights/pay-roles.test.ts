import type { StatsRow } from '@acme/shared';
import { expect, test } from 'vitest';
import { groupByRole } from './pay-roles';

const row = (jobTitle: string, level: string, count: number, median: number): StatsRow => ({
  group: { jobTitle, level },
  count,
  min: median - 10,
  p25: median - 5,
  median,
  p75: median + 5,
  max: median + 10,
  avg: median,
  total: median * count,
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
