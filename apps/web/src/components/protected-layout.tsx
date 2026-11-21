import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { loginUrl, useSession } from '@/features/auth/session';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn('rounded-md px-3 py-1.5 text-sm hover:bg-muted', isActive && 'bg-muted font-medium');

export function ProtectedLayout() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: () => api('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear();
      void navigate('/login');
    },
  });

  if (session.isPending) {
    return (
      <div className="h-12 border-b border-border" aria-busy="true">
        <div className="m-3 h-6 w-32 motion-safe:animate-pulse rounded-md bg-muted" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  if (session.error instanceof ApiError && session.error.code === 'UNAUTHENTICATED') {
    return <Navigate to={loginUrl(location)} replace />;
  }
  if (session.error) {
    return (
      <div role="alert" className="p-6">
        <p>{session.error.message}</p>
        <Button className="mt-3" onClick={() => void session.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:bg-background focus:p-2"
      >
        Skip to content
      </a>
      <header className="flex items-center gap-6 border-b border-border px-6 py-2">
        <span translate="no" className="font-semibold">
          ACME&nbsp;Pay
        </span>
        <nav aria-label="Main" className="flex gap-1">
          <NavLink to="/employees" className={navClass}>
            Employees
          </NavLink>
          <NavLink to="/insights" className={navClass}>
            Insights
          </NavLink>
        </nav>
        <span className="ml-auto text-sm text-muted-foreground">{session.data.user.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Log out
        </Button>
      </header>
      <main id="main" className="p-6">
        <Outlet />
      </main>
    </>
  );
}
