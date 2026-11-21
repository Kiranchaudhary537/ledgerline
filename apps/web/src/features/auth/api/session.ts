import { config, type LoginInput } from '@acme/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

export const sessionKey = ['session'] as const;

export const useSession = () =>
  useQuery({
    queryKey: sessionKey,
    queryFn: () => api<{ user: SessionUser }>('/api/auth/me'),
    staleTime: config.ui.sessionStaleMs,
  });

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginInput) =>
      api<{ user: SessionUser }>('/api/auth/login', { method: 'POST', body }),
    onSuccess: (data) => queryClient.setQueryData(sessionKey, data),
  });
}

/** Clears every cached answer, whether or not the server call worked: the user is leaving. */
export function useLogout(onDone: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear();
      onDone();
    },
  });
}
