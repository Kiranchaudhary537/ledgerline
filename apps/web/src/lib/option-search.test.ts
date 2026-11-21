import { describe, expect, test } from 'vitest';
import { filterByLabel, moveActive } from './option-search';

const options = [{ label: 'India' }, { label: 'Germany' }, { label: 'Indonesia' }];

test('filterByLabel ignores case and surrounding spaces; blank keeps all', () => {
  expect(filterByLabel(options, ' IND ').map((o) => o.label)).toEqual(['India', 'Indonesia']);
  expect(filterByLabel(options, '  ')).toBe(options);
  expect(filterByLabel(options, 'zzz')).toEqual([]);
});

describe('moveActive', () => {
  test.each([
    [0, 'ArrowDown', 3, 1],
    [2, 'ArrowDown', 3, 2],
    [1, 'ArrowUp', 3, 0],
    [0, 'ArrowUp', 3, 0],
    [1, 'Home', 3, 0],
    [0, 'End', 3, 2],
    [5, 'x', 3, 2],
    [0, 'ArrowDown', 0, -1],
  ])('from %i, %s on %i rows → %i', (current, key, length, expected) =>
    expect(moveActive(current, key, length)).toBe(expected),
  );
});
