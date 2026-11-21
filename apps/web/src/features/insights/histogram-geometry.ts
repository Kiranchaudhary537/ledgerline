/** x of a salary along equal-width buckets drawn between `left` and `right`, clamped to that span. */
export function valueX(
  buckets: { from: number; to: number }[],
  value: number,
  left: number,
  right: number,
) {
  const from = buckets[0]!.from;
  const span = buckets[buckets.length - 1]!.to - from || 1;
  const t = Math.min(1, Math.max(0, (value - from) / span));
  return left + t * (right - left);
}
