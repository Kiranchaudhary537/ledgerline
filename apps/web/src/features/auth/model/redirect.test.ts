import { describe, expect, test } from 'vitest';
import { loginUrl, safeNext } from './redirect';

describe('safeNext', () => {
  test.each([
    ['/insights?country=IN', '/insights?country=IN'],
    ['//evil.com', '/employees'],
    ['https://evil.com', '/employees'],
    ['employees', '/employees'],
    [null, '/employees'],
  ])('%j → %s', (input, expected) => expect(safeNext(input)).toBe(expected));
});

test('loginUrl keeps the page the user wanted', () => {
  expect(loginUrl({ pathname: '/employees/42', search: '?x=1' })).toBe(
    `/login?next=${encodeURIComponent('/employees/42?x=1')}`,
  );
});
