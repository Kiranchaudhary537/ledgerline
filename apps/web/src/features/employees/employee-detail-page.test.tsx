import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';
import { bandRow, employee, filterOptions, session } from './fixtures';

afterEach(() => vi.unstubAllGlobals());

const history = [
  {
    id: 2,
    oldSalaryMinor: 168000000,
    newSalaryMinor: 179000000,
    reason: 'Annual review',
    changedAt: '2025-08-08T10:00:00.000Z',
    changedByName: 'Priya',
  },
  {
    id: 1,
    oldSalaryMinor: null,
    newSalaryMinor: 168000000,
    reason: 'Hired',
    changedAt: '2022-08-08T10:00:00.000Z',
    changedByName: null,
  },
];

function stubApi(onWrite?: (url: string, init?: RequestInit) => Response) {
  return stubFetch((url, init) => {
    if (init?.method && init.method !== 'GET') {
      return onWrite?.(url, init) ?? new Response(null, { status: 204 });
    }
    if (url === '/api/auth/me') return Response.json(session);
    if (url === '/api/meta/filters') return Response.json(filterOptions);
    if (url === '/api/employees/7') return Response.json(employee);
    if (url === '/api/employees/7/salary-history') return Response.json(history);
    if (url.startsWith('/api/insights/stats?')) return Response.json([bandRow]);
    if (url.startsWith('/api/employees?')) {
      return Response.json({ data: [], page: 1, pageSize: 25, total: 0 });
    }
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  });
}

async function openSalaryDialog() {
  const user = userEvent.setup();
  renderApp('/employees/7');
  await user.click(await screen.findByRole('button', { name: 'Change salary' }));
  return user;
}

describe('employee detail', () => {
  test('shows the person, the band and the history', async () => {
    const fetch = stubApi();
    renderApp('/employees/7');
    expect(await screen.findByRole('heading', { name: 'Sandeep Singh' })).toBeInTheDocument();
    expect(screen.getAllByText('₹17,90,000').length).toBeGreaterThan(0);
    expect(await screen.findByRole('img', { name: /Pay band: middle half/ })).toBeInTheDocument();
    expect(await screen.findByText('Starting salary')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();

    const stats = fetch.mock.calls.map(([u]) => u).find((u) => u.startsWith('/api/insights/stats'));
    expect(Object.fromEntries(new URL(stats!, 'http://x').searchParams)).toEqual({
      country: 'IN',
      jobTitle: 'Software Engineer',
      level: 'mid',
      employmentType: 'full_time',
      groupBy: 'level',
    });
  });

  test('change salary: validates, previews the new position, then saves', async () => {
    const fetch = stubApi((url) => {
      expect(url).toBe('/api/employees/7/salary-changes');
      return Response.json(employee);
    });
    const user = await openSalaryDialog();
    const dialog = await screen.findByRole('dialog', { name: 'Change salary' });

    await user.click(screen.getByRole('button', { name: 'Change salary', hidden: false }));
    expect(await screen.findByText('Enter an amount such as 19,50,000')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/New annual salary/), '19,50,000');
    expect(
      await screen.findByText(/\+8\.9% from today, above the middle half/),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Reason'), 'x');
    await user.click(screen.getByRole('button', { name: 'Change salary' }));
    expect(await screen.findByText('Enter a reason (at least 3 characters)')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Reason'));
    await user.type(screen.getByLabelText('Reason'), 'Promotion');
    await user.click(screen.getByRole('button', { name: 'Change salary' }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      newSalaryMinor: 195000000,
      reason: 'Promotion',
      version: 3,
    });
  });

  test('change salary: a 409 shows the conflict banner with Reload', async () => {
    stubApi(() =>
      Response.json(
        { code: 'STALE_VERSION', message: 'Someone else changed this employee. Reload.' },
        { status: 409 },
      ),
    );
    const user = await openSalaryDialog();
    await user.type(await screen.findByLabelText(/New annual salary/), '19,50,000');
    await user.type(screen.getByLabelText('Reason'), 'Promotion');
    await user.click(screen.getByRole('button', { name: 'Change salary' }));

    expect(await screen.findByText('Someone else changed this employee.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('delete asks first, then goes back to the list', async () => {
    const fetch = stubApi();
    const user = userEvent.setup();
    const router = renderApp('/employees/7');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);

    await user.click(await screen.findByRole('button', { name: 'Delete employee' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/employees'));
    expect(fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe(
      '/api/employees/7',
    );
  });

  test('cancelling the delete confirm keeps the employee', async () => {
    const fetch = stubApi();
    const user = userEvent.setup();
    const router = renderApp('/employees/7');
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(router.state.location.pathname).toBe('/employees/7');
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });
});
