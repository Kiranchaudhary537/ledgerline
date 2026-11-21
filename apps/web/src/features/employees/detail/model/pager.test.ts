import { describe, expect, test } from 'vitest';
import { locate } from './pager';

const base = { page: 2, pageSize: 3, total: 8, ids: [4, 5, 6] };

describe('locate', () => {
  test('position counts from the start of the whole list', () => {
    expect(locate({ ...base, id: 5 })).toEqual({
      position: 5,
      total: 8,
      prev: { id: 4, page: 2 },
      next: { id: 6, page: 2 },
    });
  });

  test('at a page edge the neighbour comes from the adjacent page', () => {
    expect(locate({ ...base, id: 4, before: 3 })?.prev).toEqual({ id: 3, page: 1 });
    expect(locate({ ...base, id: 6, after: 7 })?.next).toEqual({ id: 7, page: 3 });
  });

  test('no neighbour at the ends of the list or while the adjacent page is unknown', () => {
    expect(locate({ ...base, page: 1, ids: [1, 2, 3], id: 1 })?.prev).toBeNull();
    expect(locate({ ...base, id: 6 })?.next).toBeNull();
  });

  test('null when the employee is not on this page', () => {
    expect(locate({ ...base, id: 99 })).toBeNull();
  });
});
