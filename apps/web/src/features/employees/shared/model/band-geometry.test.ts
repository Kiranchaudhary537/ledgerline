import { describe, expect, test } from 'vitest';
import { bandPosition, percentChange, railLayout, railPosition, railScale } from '@/features/employees/shared/model/band-geometry';

const band = { min: 100, p25: 140, median: 150, p75: 170, max: 200 };

describe('railLayout', () => {
  test('orders the band marks left to right inside 0 to 100', () => {
    const l = railLayout(band, [150]);
    expect(l.p25).toBeGreaterThan(0);
    expect(l.p25).toBeLessThan(l.median);
    expect(l.median).toBeLessThan(l.p75);
    expect(l.p75).toBeLessThan(100);
  });

  test('default scale is the band min to max with 5% padding, so the middle half fills the rail', () => {
    const l = railLayout(band, [150]);
    expect(l.p25).toBeCloseTo(((140 - 95) / 110) * 100);
    expect(l.p75 - l.p25).toBeGreaterThan(25);
  });

  test('widens the scale so values outside the band still fit', () => {
    const [low, high] = railLayout(band, [10, 900]).values;
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeLessThan(railLayout(band, [150]).p25);
  });

  test('a one-person band does not produce NaN', () => {
    const flat = { min: 50, p25: 50, median: 50, p75: 50, max: 50 };
    const l = railLayout(flat, [50]);
    expect([l.p25, l.median, l.p75, ...l.values].every(Number.isFinite)).toBe(true);
    expect(railLayout({ min: 0, p25: 0, median: 0, p75: 0, max: 0 }, [0]).p25).toBeLessThan(100);
  });
});

test('railPosition maps a value on a shared scale and clamps', () => {
  const scale = railScale([band]);
  expect(railPosition(scale, 150)).toBeCloseTo(railLayout(band, []).median);
  expect(railPosition(scale, 5000)).toBe(100);
});

describe('bandPosition', () => {
  test.each([
    [120, 'below'],
    [145, 'lower'],
    [150, 'upper'],
    [170, 'upper'],
    [171, 'above'],
  ])('%i is %s', (value, expected) => expect(bandPosition(value, band)).toBe(expected));
});

test('percentChange is a fraction rounded to 0.1%', () => {
  expect(percentChange(1_000_000, 1_094_000)).toBe(0.094);
  expect(percentChange(200, 100)).toBe(-0.5);
});
