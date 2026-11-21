import { LEVELS, type StatsRow } from '@acme/shared';

export interface RoleGroup {
  jobTitle: string;
  count: number;
  levels: StatsRow[];
  lowMedian: number;
  highMedian: number;
}

const rank = (r: StatsRow) => LEVELS.indexOf((r.group.level ?? '') as (typeof LEVELS)[number]);

/** Folds job title x level rows into one group per title, keeping the API order of titles. */
export function groupByRole(rows: StatsRow[]): RoleGroup[] {
  const byTitle = new Map<string, StatsRow[]>();
  for (const r of rows) {
    const title = r.group.jobTitle ?? '';
    byTitle.set(title, [...(byTitle.get(title) ?? []), r]);
  }
  return [...byTitle].map(([jobTitle, group]) => {
    const levels = group.toSorted((a, b) => rank(a) - rank(b));
    const medians = levels.map((l) => l.median);
    return {
      jobTitle,
      count: levels.reduce((n, l) => n + l.count, 0),
      levels,
      lowMedian: Math.min(...medians),
      highMedian: Math.max(...medians),
    };
  });
}
