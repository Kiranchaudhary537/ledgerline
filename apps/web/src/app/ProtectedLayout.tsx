import { useState } from 'react';
import { Navigate, Outlet, useLocation, useMatch, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WakingHint } from '@/components/ui/states';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLogout, useSession } from '@/features/auth/api/session';
import { loginUrl } from '@/features/auth/model/redirect';
import { useEmployee } from '@/features/employees/shared/api/employee';
import { ApiError } from '@/lib/api';
import { breadcrumbs } from './breadcrumbs';
import { AppSidebar } from './components/AppSidebar';
import { PageActionsSlot } from './components/PageActions';
import { SiteHeader } from './components/SiteHeader';

function ShellSkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-14 border-b" />
      <Skeleton className="m-6 h-8 w-48" />
      <div className="px-6">
        <WakingHint pending />
      </div>
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
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

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
    <TooltipProvider delayDuration={300}>
      <SidebarProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-card focus:p-2"
        >
          Skip to content
        </a>
        <AppSidebar
          user={session.data.user}
          onLogout={() => logout.mutate()}
          loggingOut={logout.isPending}
        />
        <SidebarInset id="main" className="min-w-0">
          <SiteHeader
            crumbs={breadcrumbs(
              location.pathname,
              employeeId ? employee.data?.fullName : undefined,
            )}
            actionsRef={setActionsSlot}
          />
          <PageActionsSlot value={actionsSlot}>
            <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
              <Outlet />
            </div>
          </PageActionsSlot>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
