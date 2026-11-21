/** Index of the equal-width bucket holding `value`; clamped, so a value outside the range uses the end bucket. */
export function bucketIndex(buckets: { from: number; to: number }[], value: number) {
  const i = buckets.findIndex((b) => value < b.to);
  return i === -1 ? buckets.length - 1 : i;
}
