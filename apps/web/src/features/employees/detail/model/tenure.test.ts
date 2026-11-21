import { expect, test } from 'vitest';
import { tenureText } from './tenure';

const now = new Date('2026-11-21T00:00:00Z');

test.each([
  ['2015-10-05', 'Joined Oct 2015, 11 years'],
  ['2025-11-22', 'Joined Nov 2025, 11 months'],
  ['2025-11-21', 'Joined Nov 2025, 1 year'],
  ['2026-09-30', 'Joined Sep 2026, 1 month'],
  ['2026-11-10', 'Joined Nov 2026, less than a month'],
])('%s', (hired, expected) => expect(tenureText(hired, now)).toBe(expected));
