import { screen, waitFor } from '@testing-library/react';
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

  test('shows the shell and user name when logged in', async () => {
    stubFetch(() => Response.json({ user: { id: 'u1', email: 'hr@acme.test', name: 'Hana HR' } }));
    renderApp('/employees');
    expect(await screen.findByText('Hana HR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
