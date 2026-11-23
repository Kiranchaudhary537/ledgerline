import { createBrowserRouter, type RouteObject } from 'react-router';
import { loginUrl } from '@/features/auth/model/redirect';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { EmployeesPage } from '@/features/employees/list/EmployeesPage';
import { ProtectedLayout } from './ProtectedLayout';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <EmployeesPage /> },
      { path: '/employees', element: <EmployeesPage /> },
      // Charts (Recharts) are most of the bundle, so the two chart pages load on first visit.
      {
        path: '/employees/:id',
        lazy: async () => ({
          Component: (await import('@/features/employees/detail/EmployeeDetailPage'))
            .EmployeeDetailPage,
        }),
      },
      {
        path: '/insights',
        lazy: async () => ({
          Component: (await import('@/features/insights/InsightsPage')).InsightsPage,
        }),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

export function goToLogin(r: Pick<typeof router, 'state' | 'navigate'>) {
  if (r.state.location.pathname !== '/login') {
    void r.navigate(loginUrl(r.state.location), { replace: true });
  }
}
