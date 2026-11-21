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

/** Position 0..100 of one money value on a scale. */
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
