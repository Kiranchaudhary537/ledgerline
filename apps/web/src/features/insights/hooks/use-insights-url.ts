import type { InsightsStatsRow } from '@acme/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { insightsToParams, parseInsightsState, type InsightsState } from '@/features/insights/model/insights-state';
import { useStats } from '@/features/insights/api/queries';

/** Filters live in the URL; with no country chosen the one with the most people is used. */
export function useInsightsUrl() {
  const [params, setParams] = useSearchParams();
  const url = useMemo(() => parseInsightsState(params), [params]);

  const overview = useStats({ country: '', department: [], level: [] }, 'country');
  const biggest = overview.data?.reduce<InsightsStatsRow | undefined>(
    (a, r) => (!a || r.count > a.count ? r : a),
    undefined,
  )?.group.country;

  const state: InsightsState = { ...url, country: url.country || biggest || '' };
  const set = (patch: Partial<InsightsState>) =>
    setParams(insightsToParams({ ...state, ...patch }));

  return { state, set, overview };
}
