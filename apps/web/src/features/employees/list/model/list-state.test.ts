import { describe, expect, test } from 'vitest';
import { listToParams, parseListState } from '@/features/employees/list/model/list-state';

const parse = (qs: string) => parseListState(new URLSearchParams(qs));

describe('list state', () => {
  test('empty URL gives defaults', () => {
    expect(parse('')).toEqual({
      q: '',
      country: [],
      department: [],
      jobTitle: [],
      level: [],
      employmentType: [],
      gender: [],
      sort: 'name:asc',
      page: 1,
    });
  });

  test('round-trips filters, sort and page', () => {
    const qs = 'q=dee&country=IN,DE&level=mid,senior&gender=female&sort=compaRatio:desc&page=3';
    const state = parse(qs);
    expect(state.country).toEqual(['IN', 'DE']);
    expect(state.page).toBe(3);
    expect(parse(listToParams(state).toString())).toEqual(state);
  });

  test('omits defaults from the URL', () => {
    expect(listToParams(parse('sort=name:asc&page=1')).toString()).toBe('');
  });

  test('can leave the page out (CSV export)', () => {
    const params = listToParams(parse('country=IN&page=4'), { page: false });
    expect(params.toString()).toBe('country=IN');
  });

  test('ignores unknown sort and bad page', () => {
    const state = parse('sort=bogus:asc&page=-2');
    expect(state.sort).toBe('name:asc');
    expect(state.page).toBe(1);
  });

  test('salary sort needs exactly one country', () => {
    expect(parse('sort=salary:desc').sort).toBe('name:asc');
    expect(parse('sort=salary:desc&country=IN,DE').sort).toBe('name:asc');
    expect(parse('sort=salary:desc&country=IN').sort).toBe('salary:desc');
  });
});
