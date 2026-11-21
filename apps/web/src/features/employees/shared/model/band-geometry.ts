export interface Band {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export interface BandScale {
  lo: number;
  hi: number;
}

/** One scale that fits every band (and value) with 5% padding, so several bands line up. */
export function bandScale(bands: Band[], values: number[] = []): BandScale {
  const min = Math.min(...bands.map((b) => b.min), ...values);
  const max = Math.max(...bands.map((b) => b.max), ...values);
  const pad = (max - min) * 0.05 || Math.abs(min) * 0.05 || 1;
  return { lo: min - pad, hi: max + pad };
}

export const scalePosition = (scale: BandScale, v: number) =>
  clamp(((v - scale.lo) / (scale.hi - scale.lo || 1)) * 100);

/** Maps money values to 0..100 positions on the band. Without `scale`, it fits this band and `values`. */
export function bandLayout(
  band: Band,
  values: number[],
  scale: BandScale = bandScale([band], values),
) {
  const at = (v: number) => scalePosition(scale, v);
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

/** Which labels (by index, left to right) fit: each must sit at least `minGap` percent after the last one kept. */
export function labelsThatFit(positions: number[], minGap = 20) {
  const kept: number[] = [];
  positions.forEach((pos, i) => {
    const last = kept.at(-1);
    if (last === undefined || pos - (positions[last] ?? 0) >= minGap) kept.push(i);
  });
  return kept;
}
