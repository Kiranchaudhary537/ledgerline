import type { InsightsStatsRow } from '@acme/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** One cache entry per parameter set, shared by every screen that asks for the same stats. */
export const useStatsQuery = (params: URLSearchParams, enabled = true) =>
  useQuery({
    queryKey: ['insights', 'stats', params.toString()],
    queryFn: () => api<InsightsStatsRow[]>(`/api/insights/stats?${params}`),
    enabled,
  });
