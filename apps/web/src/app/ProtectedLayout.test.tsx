import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';

afterEach(() => vi.unstubAllGlobals());

describe('protected layout', () => {
  test('redirects to /login?next=... on 401', async () => {
    stubFetch(() =>
      Response.json(
        { code: 'UNAUTHENTICATED', message: 'Please log in to continue.' },
        { status: 401 },
      ),
    );
    const router = renderApp('/employees/42?x=1');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/employees/42?x=1')}`);
  });

  test('shows the sidebar with the user and Log out, and the page title in the site header', async () => {
    stubFetch(() => Response.json({ user: { id: 'u1', email: 'hr@acme.test', name: 'Hana HR' } }));
    renderApp('/employees');
    expect(await screen.findByText('Hana HR')).toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).getByRole('heading', { name: 'Employees' }),
    ).toBeInTheDocument();
    const side = screen.getByRole('navigation', { name: 'Main' });
    expect(within(side).getByRole('link', { name: 'Employees' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(side).getByRole('link', { name: 'Insights' })).toHaveAttribute(
      'href',
      '/insights',
    );
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(
      await within(screen.getByRole('banner')).findByRole('button', { name: 'Add employee' }),
    ).toBeInTheDocument();
  });

  test('logging out clears the session and goes to the login page', async () => {
    const fetch = stubFetch((url) =>
      url === '/api/auth/logout'
        ? new Response(null, { status: 204 })
        : Response.json({ user: { id: 'u1', email: 'hr@acme.test', name: 'Hana HR' } }),
    );
    const router = renderApp('/employees');
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(fetch.mock.calls.some(([u]) => u === '/api/auth/logout')).toBe(true);
  });
});
