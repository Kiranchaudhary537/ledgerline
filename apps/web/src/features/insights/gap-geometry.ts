import type { GenderGapRow } from '@acme/shared';

/** Axis step in percentage points: the plot always spans a multiple of this on each side of zero. */
const STEP = 5;

/** Largest gap first (women paid least); groups without a gap go last. */
export const sortByGap = (rows: GenderGapRow[]) =>
  rows.toSorted((a, b) => (b.gapPct ?? -Infinity) - (a.gapPct ?? -Infinity));

/** Half-width of the axis in percentage points, so zero is always the centre. */
export const gapLimit = (rows: GenderGapRow[]) => {
  const largest = Math.max(0, ...rows.map((r) => Math.abs(r.gapPct ?? 0)));
  return Math.max(STEP, Math.ceil(largest / STEP) * STEP);
};

/** 0..100 along the track; zero at 50. */
export const gapPosition = (limit: number, pct: number) =>
  Math.min(100, Math.max(0, 50 + (pct / limit) * 50));
