import { createBrowserRouter, type RouteObject } from 'react-router';
import { loginUrl } from '@/features/auth/model/redirect';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EmployeeDetailPage } from '@/features/employees/detail/EmployeeDetailPage';
import { EmployeesPage } from '@/features/employees/list/EmployeesPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { ProtectedLayout } from './ProtectedLayout';

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
