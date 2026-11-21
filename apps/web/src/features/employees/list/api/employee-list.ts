import type { EmployeeFacets, EmployeeList } from '@acme/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  listToApiParams,
  listToFacetParams,
  type ListState,
} from '@/features/employees/list/model/list-state';

export const useEmployeeList = (state: ListState, enabled = true) => {
  const query = listToApiParams(state).toString();
  return useQuery({
    queryKey: ['employees', 'list', query],
    queryFn: () => api<EmployeeList>(`/api/employees?${query}`),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export const useFacets = (state: ListState) => {
  const query = listToFacetParams(state).toString();
  return useQuery({
    queryKey: ['employees', 'facets', query],
    queryFn: () => api<EmployeeFacets>(`/api/employees/facets?${query}`),
    placeholderData: keepPreviousData,
  });
};
