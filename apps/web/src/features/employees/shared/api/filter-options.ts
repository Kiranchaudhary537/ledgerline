import type { FilterOptions } from '@acme/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useFilterOptions = () =>
  useQuery({
    queryKey: ['meta', 'filters'],
    queryFn: () => api<FilterOptions>('/api/meta/filters'),
    staleTime: Infinity,
  });
