import type { StatsRow } from '@acme/shared';
import { describe, expect, test } from 'vitest';
import {
  biggestCountry,
  insightsApiParams,
  insightsToParams,
  parseInsightsState,
  roleOptions,
} from '@/features/insights/model/insights-state';

const parse = (qs: string) => parseInsightsState(new URLSearchParams(qs));

test('biggestCountry picks the country with the most people', () => {
  const row = (country: string, count: number) =>
    ({ group: { country }, count }) as unknown as StatsRow;
  expect(biggestCountry([row('DE', 10), row('IN', 50), row('US', 50)])).toBe('IN');
  expect(biggestCountry([])).toBeUndefined();
  expect(biggestCountry(undefined)).toBeUndefined();
});

describe('insights state', () => {
  test('empty URL asks about any role and level, in no country yet', () => {
    expect(parse('')).toEqual({ country: '', jobTitle: '', level: '' });
  });

  test('round trips and leaves empty values out', () => {
    const state = { country: 'DE', jobTitle: '', level: 'senior' };
    expect(insightsToParams(state).toString()).toBe('country=DE&level=senior');
    expect(parse(insightsToParams(state).toString())).toEqual(state);
  });

  test('API params add the grouping, and omit what a section does not follow', () => {
    const state = { country: 'IN', jobTitle: 'QA Engineer', level: 'mid' };
    expect(insightsApiParams(state, 'country').toString()).toBe(
      'groupBy=country&country=IN&jobTitle=QA+Engineer&level=mid',
    );
    expect(insightsApiParams(state, 'jobTitle', ['jobTitle']).toString()).toBe(
      'groupBy=jobTitle&country=IN&level=mid',
    );
  });
});

test('roleOptions lists each role once, sorted', () => {
  expect(
    roleOptions([{ jobTitles: ['QA Engineer', 'Analyst'] }, { jobTitles: ['Analyst'] }]),
  ).toEqual(['Analyst', 'QA Engineer']);
  expect(roleOptions(undefined)).toEqual([]);
});
