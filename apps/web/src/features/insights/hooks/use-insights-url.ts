import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useStats } from '@/features/insights/api/queries';
import {
  biggestCountry,
  insightsToParams,
  parseInsightsState,
  type InsightsState,
} from '@/features/insights/model/insights-state';

/** Filters live in the URL; with no country chosen the one with the most people is used. */
export function useInsightsUrl() {
  const [params, setParams] = useSearchParams();
  const url = useMemo(() => parseInsightsState(params), [params]);

  const overview = useStats({ country: '', jobTitle: '', level: '' }, 'country');

  const state: InsightsState = {
    ...url,
    country: url.country || biggestCountry(overview.data) || '',
  };
  const set = (patch: Partial<InsightsState>) =>
    setParams(insightsToParams({ ...state, ...patch }));

  return { state, set, overview };
}
