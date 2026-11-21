import { config, LEVELS, type InsightsStatsRow } from '@acme/shared';

export interface RoleGroup {
  jobTitle: string;
  count: number;
  levels: InsightsStatsRow[];
  lowMedian: number;
  highMedian: number;
  outOfBand: number;
  /** Widest compa-ratio p75 - p25 among the role's levels. */
  spread: number;
  wideSpread: boolean;
}

/** Rounded so 1.1 - 0.9 compares as 0.2 and not 0.2000000000000002. */
export const compaSpread = (r: InsightsStatsRow) =>
  Math.round((r.compaP75 - r.compaP25) * 100) / 100;
export const isWideSpread = (spread: number) => spread > config.compaRatio.maxReviewSpread;

const rank = (r: InsightsStatsRow) =>
  LEVELS.indexOf((r.group.level ?? '') as (typeof LEVELS)[number]);

/** Folds job title x level rows into one group per title, keeping the API order of titles. */
export function groupByRole(rows: InsightsStatsRow[]): RoleGroup[] {
  const byTitle = new Map<string, InsightsStatsRow[]>();
  for (const r of rows) {
    const title = r.group.jobTitle ?? '';
    byTitle.set(title, [...(byTitle.get(title) ?? []), r]);
  }
  return [...byTitle].map(([jobTitle, group]) => {
    const levels = group.toSorted((a, b) => rank(a) - rank(b));
    const medians = levels.map((l) => l.median);
    const spread = Math.max(...levels.map(compaSpread));
    return {
      jobTitle,
      count: levels.reduce((n, l) => n + l.count, 0),
      levels,
      lowMedian: Math.min(...medians),
      highMedian: Math.max(...medians),
      outOfBand: levels.reduce((n, l) => n + l.outOfBandCount, 0),
      spread,
      wideSpread: isWideSpread(spread),
    };
  });
}
