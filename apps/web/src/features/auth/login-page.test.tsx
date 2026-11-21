import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';

afterEach(() => vi.unstubAllGlobals());

const user = { id: 'u1', email: 'hr@acme.test', name: 'Hana HR' };

async function fill(email: string, password: string) {
  const ui = userEvent.setup();
  await ui.type(screen.getByLabelText('Email'), email);
  await ui.type(screen.getByLabelText('Password'), password);
  await ui.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('login page', () => {
  test('empty submit shows inline field errors', async () => {
    const fetchFn = stubFetch(() => Response.json({}));
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test('shows the INVALID_CREDENTIALS message near the form', async () => {
    stubFetch(() =>
      Response.json(
        { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
        { status: 401 },
      ),
    );
    renderApp('/login');
    await fill('hr@acme.test', 'wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  test('server fields become inline errors', async () => {
    stubFetch(() =>
      Response.json(
        { code: 'VALIDATION_FAILED', message: 'Fix.', fields: { email: 'Server says no' } },
        { status: 400 },
      ),
    );
    renderApp('/login');
    await fill('hr@acme.test', 'pw');
    expect(await screen.findByText('Server says no')).toBeInTheDocument();
  });

  test('on success goes to next', async () => {
    stubFetch(() => Response.json({ user })); // login and /me both answer with the user
    const router = renderApp('/login?next=%2Finsights');
    await fill('hr@acme.test', 'pw');
    await waitFor(() => expect(router.state.location.pathname).toBe('/insights'));
    expect(await screen.findByRole('heading', { name: 'Insights' })).toBeInTheDocument();
  });
});
