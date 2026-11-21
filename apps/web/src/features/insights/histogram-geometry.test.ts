import { expect, test } from 'vitest';
import { valueX } from './histogram-geometry';

const buckets = [
  { from: 100, to: 200, count: 1 },
  { from: 200, to: 300, count: 1 },
];

test('maps a salary onto the bucket span, clamped to the plot', () => {
  expect(valueX(buckets, 100, 40, 560)).toBe(40);
  expect(valueX(buckets, 200, 40, 560)).toBe(300);
  expect(valueX(buckets, 300, 40, 560)).toBe(560);
  expect(valueX(buckets, 999, 40, 560)).toBe(560);
  expect(valueX(buckets, 0, 40, 560)).toBe(40);
});
