import { expect, test } from 'vitest';
import { TONE_COUNT, toneOf } from './tone';

test('toneOf is stable and inside the palette', () => {
  expect(toneOf('Sandeep Singh')).toBe(toneOf('Sandeep Singh'));
  for (const name of ['A', 'Engineering', 'Sandeep Singh', 'Ünïcode 日本']) {
    const tone = toneOf(name);
    expect(tone).toBeGreaterThanOrEqual(0);
    expect(tone).toBeLessThan(TONE_COUNT);
  }
});
