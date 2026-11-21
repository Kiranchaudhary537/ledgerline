import { config, type Distribution, type EmployeeList, type GenderGapRow } from '@acme/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStatsQuery } from '@/lib/stats-query';
import { insightsApiParams, insightsToParams, type InsightsState } from '@/features/insights/model/insights-state';

const get = <T>(path: string, params: URLSearchParams) => api<T>(`${path}?${params}`);

/** Stats for a grouping. `country` is empty for the all-countries overview. */
export const useStats = (state: InsightsState, groupBy: string, enabled = true) =>
  useStatsQuery(insightsApiParams(state, groupBy), enabled);

export const useGenderGap = (state: InsightsState, enabled: boolean) => {
  const params = insightsApiParams(state, 'jobTitle');
  return useQuery({
    queryKey: ['insights', 'gender-gap', params.toString()],
    queryFn: () => get<GenderGapRow[]>('/api/insights/gender-gap', params),
    enabled,
  });
};

export const useDistribution = (state: InsightsState, enabled: boolean) => {
  const params = insightsApiParams(state, '');
  params.delete('groupBy');
  return useQuery({
    queryKey: ['insights', 'distribution', params.toString()],
    queryFn: () => get<Distribution>('/api/insights/distribution', params),
    enabled,
  });
};

export type Side = 'asc' | 'desc';
/** URL parameters for the employee list sorted by compa-ratio from one end, within the page filters. */
export function outlierParams(state: InsightsState, side: Side) {
  const params = insightsToParams(state);
  params.set('sort', `compaRatio:${side}`);
  return params;
}

export const useOutliers = (state: InsightsState, side: Side, enabled: boolean) => {
  const params = outlierParams(state, side);
  params.set('pageSize', String(config.insights.attentionCount));
  return useQuery({
    queryKey: ['employees', 'outliers', params.toString()],
    queryFn: () => api<EmployeeList>(`/api/employees?${params}`),
    enabled,
  });
};
