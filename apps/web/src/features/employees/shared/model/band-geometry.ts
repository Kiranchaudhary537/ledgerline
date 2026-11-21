export interface Band {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export interface RailScale {
  lo: number;
  hi: number;
}

/** One scale that fits every band (and value) with 5% padding, so several rails line up. */
export function railScale(bands: Band[], values: number[] = []): RailScale {
  const min = Math.min(...bands.map((b) => b.min), ...values);
  const max = Math.max(...bands.map((b) => b.max), ...values);
  const pad = (max - min) * 0.05 || Math.abs(min) * 0.05 || 1;
  return { lo: min - pad, hi: max + pad };
}

export const railPosition = (scale: RailScale, v: number) =>
  clamp(((v - scale.lo) / (scale.hi - scale.lo || 1)) * 100);

/** Maps money values to 0..100 positions on the rail. Without `scale`, it fits this band and `values`. */
export function railLayout(
  band: Band,
  values: number[],
  scale: RailScale = railScale([band], values),
) {
  const at = (v: number) => railPosition(scale, v);
  return {
    p25: at(band.p25),
    median: at(band.median),
    p75: at(band.p75),
    values: values.map(at),
  };
}

export const BAND_MARKS = ['min', 'p25', 'median', 'p75', 'max'] as const;
export type BandMark = (typeof BAND_MARKS)[number];

/** Step on the cobalt ramp (0 light to 4 dark) of each band mark, shared by every band display. */
export const MARK_STEP: Record<BandMark, number> = { min: 0, p25: 1, median: 2, p75: 3, max: 4 };

/**
 * The band as four consecutive segments (min→p25, p25→median, median→p75, p75→max), each as a share
 * of the full range, plus the 0..100 position of `value` when given. Equal widths when the band is flat.
 */
export function bandSegments(band: Band, value?: number) {
  const span = band.max - band.min;
  const marks = BAND_MARKS.map((m) => band[m]);
  const segments = BAND_MARKS.slice(0, -1).map((from, i) => ({
    from,
    pct: span > 0 ? ((marks[i + 1]! - marks[i]!) / span) * 100 : 100 / (BAND_MARKS.length - 1),
  }));
  const marker =
    value === undefined
      ? undefined
      : span > 0
        ? Math.min(100, Math.max(0, ((value - band.min) / span) * 100))
        : 50;
  return { segments, marker };
}

export type BandPosition = 'below' | 'lower' | 'upper' | 'above';

export function bandPosition(value: number, band: Band): BandPosition {
  if (value < band.p25) return 'below';
  if (value > band.p75) return 'above';
  return value >= band.median ? 'upper' : 'lower';
}

export const POSITION_TEXT: Record<BandPosition, string> = {
  below: 'below the middle half of the band',
  lower: 'in the lower middle of the band',
  upper: 'in the upper middle of the band',
  above: 'above the middle half of the band',
};

/** Fraction, e.g. 0.094 for +9.4%. Display only; money itself stays in integer minor units. */
export function percentChange(oldMinor: number, newMinor: number) {
  return Math.round(((newMinor - oldMinor) / oldMinor) * 1000) / 1000;
}
