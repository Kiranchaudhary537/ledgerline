import { createBrowserRouter, type RouteObject } from 'react-router';
import { ProtectedLayout } from '@/components/protected-layout';
import { LoginPage } from '@/features/auth/login-page';
import { loginUrl } from '@/features/auth/session';
import { EmployeeDetailPage, EmployeesPage, InsightsPage } from '@/pages';

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

/** Send the user to login and bring them back here afterwards. */
export function goToLogin(r: Pick<typeof router, 'state' | 'navigate'>) {
  if (r.state.location.pathname !== '/login') {
    void r.navigate(loginUrl(r.state.location), { replace: true });
  }
}
