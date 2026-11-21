import type { SalaryChange } from '@acme/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useSalaryHistory = (id: string) =>
  useQuery({
    queryKey: ['employees', 'history', id],
    queryFn: () => api<SalaryChange[]>(`/api/employees/${id}/salary-history`),
  });
