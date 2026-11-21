import { SORT_OPTIONS } from '@acme/shared';
import { describe, expect, test } from 'vitest';
import {
  ariaSort,
  COLUMNS,
  nextSort,
  parseSort,
  SALARY_SORT_HINT,
  sortDisabledHint,
} from './columns';
import { parseListState } from './list-state';

describe('sorting', () => {
  test('every sortable column maps to a sort the API accepts', () => {
    for (const { sortField } of COLUMNS) {
      if (sortField) expect(SORT_OPTIONS).toContain(`${sortField}:asc`);
    }
  });

  test('parseSort and nextSort', () => {
    expect(parseSort('salary:desc')).toEqual({ field: 'salary', dir: 'desc' });
    expect(nextSort('name:asc', 'name')).toBe('name:desc');
    expect(nextSort('name:desc', 'name')).toBe('name:asc');
    expect(nextSort('name:desc', 'level')).toBe('level:asc');
  });

  test('ariaSort only marks the active column', () => {
    expect(ariaSort('name:asc', 'name')).toBe('ascending');
    expect(ariaSort('name:desc', 'name')).toBe('descending');
    expect(ariaSort('name:desc', 'level')).toBeUndefined();
    expect(ariaSort('name:desc', undefined)).toBeUndefined();
  });

  test('salary needs exactly one country', () => {
    const one = parseListState(new URLSearchParams('country=IN'));
    const none = parseListState(new URLSearchParams(''));
    expect(sortDisabledHint(one, 'salary')).toBeUndefined();
    expect(sortDisabledHint(none, 'salary')).toBe(SALARY_SORT_HINT);
    expect(sortDisabledHint(none, 'name')).toBeUndefined();
  });
});
