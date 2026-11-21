import { expect, test } from 'vitest';
import { pageRange } from './pagination';

test('first page, a middle page and a short last page', () => {
  expect(pageRange(1, 100, 25)).toEqual({ first: 1, last: 25, pages: 4 });
  expect(pageRange(2, 100, 25)).toEqual({ first: 26, last: 50, pages: 4 });
  expect(pageRange(3, 51, 25)).toEqual({ first: 51, last: 51, pages: 3 });
});

test('an empty list still has one page', () => {
  expect(pageRange(1, 0, 25).pages).toBe(1);
});
