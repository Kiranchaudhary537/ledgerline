import type { Employee } from '@acme/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Everything under ['employees'] is refreshed together after a write. */
export const employeesKey = ['employees'] as const;
export const employeeKey = (id: string) => ['employees', 'detail', id] as const;

export const fetchEmployee = (id: string) => api<Employee>(`/api/employees/${id}`);

/** An empty id means "not on an employee page": nothing is fetched. */
export const useEmployee = (id: string) =>
  useQuery({ queryKey: employeeKey(id), queryFn: () => fetchEmployee(id), enabled: id !== '' });
