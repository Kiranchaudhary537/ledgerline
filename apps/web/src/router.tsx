import { createBrowserRouter, type RouteObject } from 'react-router';
import { ProtectedLayout } from '@/components/protected-layout';
import { LoginPage } from '@/features/auth/login-page';
import { loginUrl } from '@/features/auth/session';
import { EmployeeDetailPage } from '@/features/employees/employee-detail-page';
import { EmployeesPage } from '@/features/employees/employees-page';
import { InsightsPage } from '@/features/insights/insights-page';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <EmployeesPage /> },
      { path: '/employees', element: <EmployeesPage /> },
      { path: '/employees/:id', element: <EmployeeDetailPage /> },
      { path: '/insights', element: <InsightsPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export function goToLogin(r: Pick<typeof router, 'state' | 'navigate'>) {
  if (r.state.location.pathname !== '/login') {
    void r.navigate(loginUrl(r.state.location), { replace: true });
  }
}
