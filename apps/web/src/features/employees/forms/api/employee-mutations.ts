import type { Employee } from '@acme/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { employeeKey, employeesKey, fetchEmployee } from '@/features/employees/shared/api/employee';

const refreshEverything = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: employeesKey });
  await queryClient.invalidateQueries({ queryKey: ['insights'] });
};

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: unknown) => api<Employee>('/api/employees', { method: 'POST', body }),
    onSuccess: async (saved) => {
      await refreshEverything(queryClient);
      toast.success('Employee added');
      void navigate(`/employees/${saved.id}`);
    },
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api<Employee>(`/api/employees/${id}`, { method: 'PATCH', body }),
    onSuccess: async () => {
      await refreshEverything(queryClient);
      toast.success('Details saved');
    },
  });
}

export function useChangeSalary(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      api<Employee>(`/api/employees/${id}/salary-changes`, { method: 'POST', body }),
    onSuccess: async () => {
      await refreshEverything(queryClient);
      toast.success('Salary changed');
    },
  });
}

export function useDeleteEmployee(id: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      // Leave the page first, so nothing on it refetches the deleted employee.
      await navigate('/employees');
      queryClient.removeQueries({
        queryKey: employeesKey,
        predicate: (q) => q.queryKey[1] !== 'list',
      });
      void queryClient.invalidateQueries({ queryKey: employeesKey });
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Employee deleted');
    },
  });
}

/** Re-reads the employee after a STALE_VERSION conflict, bypassing the cache. */
export function useReloadEmployee() {
  const queryClient = useQueryClient();
  return (id: number) =>
    queryClient.fetchQuery({
      queryKey: employeeKey(String(id)),
      queryFn: () => fetchEmployee(String(id)),
      staleTime: 0,
    });
}
