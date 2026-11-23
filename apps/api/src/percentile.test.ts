import { describe, expect, it } from 'vitest';
import { percentile } from './percentile.ts';

describe('percentile (nearest rank)', () => {
  const ms = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  it('returns the smallest value that covers p% of samples', () => {
    expect(percentile(ms, 50)).toBe(50);
    expect(percentile(ms, 95)).toBe(100);
    expect(percentile(ms, 10)).toBe(10);
  });

  it('does not need sorted input or change it', () => {
    const shuffled = [70, 10, 100, 40];
    expect(percentile(shuffled, 50)).toBe(40);
    expect(shuffled).toEqual([70, 10, 100, 40]);
  });

  it('rejects an empty sample instead of returning undefined', () => {
    expect(() => percentile([], 95)).toThrow('no samples');
  });
});
