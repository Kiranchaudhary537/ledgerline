import { useState } from 'react';
import { Navigate, Outlet, useLocation, useMatch, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLogout, useSession } from '@/features/auth/api/session';
import { loginUrl } from '@/features/auth/model/redirect';
import { useEmployee } from '@/features/employees/shared/api/employee';
import { EmployeeDialogs } from '@/features/employees/forms/EmployeeDialogs';
import { ApiError } from '@/lib/api';
import { breadcrumbs } from './breadcrumbs';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';

function ShellSkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-14 bg-ink" />
      <div className="m-6 h-8 w-48 motion-safe:animate-pulse rounded-md bg-muted" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ProtectedLayout() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout(() => void navigate('/login'));
  const employeeId = useMatch('/employees/:id')?.params.id;
  const employee = useEmployee(employeeId ?? '');
  const [adding, setAdding] = useState(false);

  if (session.isPending) return <ShellSkeleton />;
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
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-card focus:p-2"
      >
        Skip to content
      </a>
      <TopBar
        crumbs={breadcrumbs(location.pathname, employeeId ? employee.data?.fullName : undefined)}
        user={session.data.user}
        onAddEmployee={() => setAdding(true)}
        onLogout={() => logout.mutate()}
        loggingOut={logout.isPending}
      />
      <div className="flex">
        <Sidebar />
        <main id="main" className="mx-auto min-w-0 max-w-[1280px] flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
      <EmployeeDialogs kind={adding ? 'create' : null} onClose={() => setAdding(false)} />
    </>
  );
}
