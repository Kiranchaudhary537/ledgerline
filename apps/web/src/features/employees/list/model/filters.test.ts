import { expect, test } from 'vitest';
import { facetOptions, FILTERS } from './filters';
import { MULTI_KEYS } from './list-state';

test('Country, Department and Job title always search; short fixed lists do not', () => {
  const searchable = FILTERS.filter((f) => f.searchable).map((f) => f.key);
  expect(searchable).toEqual(['country', 'department', 'jobTitle']);
});

test('every URL filter has a menu', () => {
  expect(FILTERS.map((f) => f.key).toSorted()).toEqual([...MULTI_KEYS].toSorted());
});

test('facetOptions keeps counts and applies the label function', () => {
  expect(facetOptions([{ value: 'IN', count: 3 }], (v) => `Land ${v}`)).toEqual([
    { value: 'IN', label: 'Land IN', count: 3 },
  ]);
  expect(facetOptions(undefined, String)).toEqual([]);
});
