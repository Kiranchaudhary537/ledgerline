import type { StatsRow } from '@acme/shared';

export interface InsightsState {
  /** Empty until the URL or the default (biggest country) supplies one. */
  country: string;
  department: string[];
  level: string[];
}

const csv = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

export function parseInsightsState(params: URLSearchParams): InsightsState {
  return {
    country: csv(params.get('country'))[0] ?? '',
    department: csv(params.get('department')),
    level: csv(params.get('level')),
  };
}

export function insightsToParams(state: InsightsState) {
  const params = new URLSearchParams();
  if (state.country) params.set('country', state.country);
  if (state.department.length) params.set('department', state.department.join(','));
  if (state.level.length) params.set('level', state.level.join(','));
  return params;
}

/** The country with the most people, used when the URL names none; ties keep the first. */
export function biggestCountry(rows: StatsRow[] | undefined) {
  return rows?.reduce<StatsRow | undefined>((a, r) => (!a || r.count > a.count ? r : a), undefined)
    ?.group.country;
}

export const insightsApiParams = (state: InsightsState, groupBy: string) =>
  new URLSearchParams({ groupBy, ...Object.fromEntries(insightsToParams(state)) });
