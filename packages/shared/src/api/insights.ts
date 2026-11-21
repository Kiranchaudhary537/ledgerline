/** `group` is keyed by the requested groupBy names. */
export interface StatsRow {
  group: Record<string, string>;
  count: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  avg: number;
  total: number;
  currency: string;
}

export interface GenderGapRow {
  group: Record<string, string>;
  femaleMedian: number | null;
  maleMedian: number | null;
  femaleCount: number;
  maleCount: number;
  /** null when either gender has fewer than 5 people. */
  gapPct: number | null;
  currency: string;
}

export interface Distribution {
  currency: string;
  buckets: { from: number; to: number; count: number }[];
}
