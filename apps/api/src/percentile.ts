/** Nearest-rank percentile: the smallest sample with at least p% of samples at or below it. */
export function percentile(samples: readonly number[], p: number): number {
  if (samples.length === 0) throw new Error('percentile of no samples');
  const sorted = samples.toSorted((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)]!;
}
