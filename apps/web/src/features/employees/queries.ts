import type { Employee, EmployeeList, FilterOptions, SalaryChange } from '@acme/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStatsQuery } from '@/lib/stats-query';
import { listToApiParams, type ListState } from './list-state';

/** Everything under ['employees'] is refreshed together after a write. */
export const employeesKey = ['employees'] as const;
export const employeeKey = (id: string) => ['employees', 'detail', id] as const;

export const fetchEmployee = (id: string) => api<Employee>(`/api/employees/${id}`);

export const useFilterOptions = () =>
  useQuery({
    queryKey: ['meta', 'filters'],
    queryFn: () => api<FilterOptions>('/api/meta/filters'),
    staleTime: Infinity,
  });

export const useEmployeeList = (state: ListState) => {
  const query = listToApiParams(state).toString();
  return useQuery({
    queryKey: ['employees', 'list', query],
    queryFn: () => api<EmployeeList>(`/api/employees?${query}`),
    placeholderData: keepPreviousData,
  });
};

export const useEmployee = (id: string) =>
  useQuery({ queryKey: employeeKey(id), queryFn: () => fetchEmployee(id) });

export const useSalaryHistory = (id: string) =>
  useQuery({
    queryKey: ['employees', 'history', id],
    queryFn: () => api<SalaryChange[]>(`/api/employees/${id}/salary-history`),
  });

/** The pay band of this person's country, title, level and employment type. */
export function useBand(e: Employee | undefined) {
  const params = new URLSearchParams(
    e
      ? {
          country: e.countryCode,
          jobTitle: e.jobTitle,
          level: e.level,
          employmentType: e.employmentType,
          groupBy: 'level',
        }
      : {},
  );
  const stats = useStatsQuery(params, !!e);
  return { ...stats, data: stats.data?.[0] };
}
