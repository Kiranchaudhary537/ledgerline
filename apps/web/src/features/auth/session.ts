import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export const sessionKey = ['session'] as const;

export const useSession = () =>
  useQuery({
    queryKey: sessionKey,
    queryFn: () => api<{ user: SessionUser }>('/api/auth/me'),
    staleTime: 5 * 60_000,
  });

export function loginUrl(here: { pathname: string; search: string }) {
  return `/login?next=${encodeURIComponent(here.pathname + here.search)}`;
}
