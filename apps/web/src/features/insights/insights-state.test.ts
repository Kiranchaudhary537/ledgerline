import { describe, expect, test } from 'vitest';
import { insightsApiParams, insightsToParams, parseInsightsState } from './insights-state';

const parse = (qs: string) => parseInsightsState(new URLSearchParams(qs));

describe('insights state', () => {
  test('empty URL has no country yet', () => {
    expect(parse('')).toEqual({ country: '', department: [], level: [] });
  });

  test('reads country and csv filters, keeps only the first country', () => {
    expect(parse('country=IN,DE&department=Engineering,Sales&level=mid')).toEqual({
      country: 'IN',
      department: ['Engineering', 'Sales'],
      level: ['mid'],
    });
  });

  test('round trips and leaves empty values out', () => {
    const state = { country: 'DE', department: [], level: ['senior'] };
    expect(insightsToParams(state).toString()).toBe('country=DE&level=senior');
    expect(parse(insightsToParams(state).toString())).toEqual(state);
  });

  test('API params add the grouping', () => {
    const state = { country: 'IN', department: ['Sales'], level: [] };
    expect(insightsApiParams(state, 'jobTitle,level').toString()).toBe(
      'groupBy=jobTitle%2Clevel&country=IN&department=Sales',
    );
  });
});
