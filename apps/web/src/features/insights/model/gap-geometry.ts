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

/** The number and its direction in words, so colour and position never carry the meaning alone. */
export const gapParts = (pct: number) =>
  pct > 0
    ? { value: `${pct}%`, note: 'women paid less' }
    : pct < 0
      ? { value: `${Math.abs(pct)}%`, note: 'women paid more' }
      : { value: '0%', note: 'no gap' };
