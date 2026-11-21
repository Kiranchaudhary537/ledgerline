import { expect, test } from 'vitest';
import { bucketIndex } from '@/features/insights/model/histogram-geometry';

const buckets = [
  { from: 0, to: 10 },
  { from: 10, to: 20 },
  { from: 20, to: 30 },
];

test('a value falls in the bucket whose [from, to) holds it', () => {
  expect(bucketIndex(buckets, 0)).toBe(0);
  expect(bucketIndex(buckets, 10)).toBe(1);
  expect(bucketIndex(buckets, 19)).toBe(1);
});

test('the max (end of the last bucket) and values beyond it use the last bucket', () => {
  expect(bucketIndex(buckets, 30)).toBe(2);
  expect(bucketIndex(buckets, 99)).toBe(2);
});
