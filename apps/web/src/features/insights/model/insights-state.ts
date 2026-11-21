import type { StatsRow } from '@acme/shared';

/** The question "what do we pay for [jobTitle] [level] in [country]?"; an empty role or level means any. */
export interface InsightsState {
  /** Empty until the URL or the default (biggest country) supplies one. */
  country: string;
  jobTitle: string;
  level: string;
}

export function parseInsightsState(params: URLSearchParams): InsightsState {
  return {
    country: params.get('country') ?? '',
    jobTitle: params.get('jobTitle') ?? '',
    level: params.get('level') ?? '',
  };
}

export function insightsToParams(state: InsightsState) {
  const params = new URLSearchParams();
  for (const key of ['country', 'jobTitle', 'level'] as const) {
    if (state[key]) params.set(key, state[key]);
  }
  return params;
}

/** The country with the most people, used when the URL names none; ties keep the first. */
export function biggestCountry(rows: StatsRow[] | undefined) {
  return rows?.reduce<StatsRow | undefined>((a, r) => (!a || r.count > a.count ? r : a), undefined)
    ?.group.country;
}

/** API params for a grouping; `omit` drops parts of the question a section does not follow. */
export const insightsApiParams = (
  state: InsightsState,
  groupBy: string,
  omit: ('jobTitle' | 'level')[] = [],
) => {
  const params = insightsToParams({ ...state, ...Object.fromEntries(omit.map((k) => [k, ''])) });
  return new URLSearchParams({ groupBy, ...Object.fromEntries(params) });
};

/** Roles from every department, once each, A to Z: the options of the role picker. */
export const roleOptions = (departments: { jobTitles: string[] }[] | undefined) =>
  [...new Set((departments ?? []).flatMap((d) => d.jobTitles))].toSorted((a, b) =>
    a.localeCompare(b),
  );
