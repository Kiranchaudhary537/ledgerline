import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';
import { bandRow, employee, filterOptions, session } from '@/features/employees/shared/fixtures';

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

async function openMenu(user: ReturnType<typeof userEvent.setup>, item: string) {
  await user.click(await screen.findByRole('button', { name: 'More actions' }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
}

async function openSalaryDialog() {
  const user = userEvent.setup();
  renderApp('/employees/7');
  await user.click(await screen.findByRole('button', { name: 'Change salary' }));
  return user;
}

describe('employee detail', () => {
  test('header shows the person, role, tenure and status on one page with no tabs', async () => {
    stubApi();
    renderApp('/employees/7');
    expect(await screen.findByRole('heading', { name: 'Sandeep Singh' })).toBeInTheDocument();
    expect(await screen.findByText('Software Engineer, Mid, India')).toBeInTheDocument();
    expect(screen.getByText(/Joined Aug 2022, \d+ years/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();
    expect(screen.getAllByText('ACME-00022').length).toBeGreaterThan(0);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to employees' })).toHaveAttribute(
      'href',
      '/employees',
    );
  });

  test('shows the salary and the pay band with the person placed in it', async () => {
    const fetch = stubApi();
    renderApp('/employees/7');
    expect((await screen.findAllByText('₹17,90,000')).length).toBeGreaterThan(0);
    const band = await screen.findByRole('img', { name: /^Pay band:/ });
    expect(band).toHaveAccessibleName(/middle half ₹16,80,000 to ₹18,37,500, median ₹17,50,000/);
    expect(band).toHaveAccessibleName(/current ₹17,90,000/);
    expect(within(band).getByText('₹15,40,000')).toBeInTheDocument();
    expect(screen.getByText(/is in the upper middle of the band/)).toBeInTheDocument();

    const stats = fetch.mock.calls.map(([u]) => u).find((u) => u.startsWith('/api/insights/stats'));
    expect(Object.fromEntries(new URL(stats!, 'http://x').searchParams)).toEqual({
      country: 'IN',
      jobTitle: 'Software Engineer',
      level: 'mid',
      employmentType: 'full_time',
      groupBy: 'level',
    });
  });

  test('the history timeline lists changes newest first, and the chart has a table behind it', async () => {
    stubApi();
    renderApp('/employees/7');
    const region = await screen.findByRole('region', { name: 'Salary history' });
    const items = await within(region).findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Annual review');
    expect(items[0]).toHaveTextContent('₹16,80,000 to ₹17,90,000');
    expect(items[0]).toHaveTextContent('+6.5%');
    expect(items[0]).toHaveTextContent('Priya');
    expect(items[1]).toHaveTextContent('Starting salary');
    expect(items[1]).toHaveTextContent('Imported');
    expect(await screen.findByRole('img', { name: /salary over time/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /salary over time/i })).toBeInTheDocument();
  });

  test('the profile fields are on the page, with an Edit details button', async () => {
    stubApi();
    const user = userEvent.setup();
    renderApp('/employees/7');
    expect(await screen.findByText('sandeep@acme.test')).toBeInTheDocument();
    expect(screen.getByText('Full time')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    expect(await screen.findByRole('dialog', { name: 'Edit details' })).toBeInTheDocument();
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
      (await screen.findAllByText(/\+8\.9% from today, above the middle half/)).length,
    ).toBeGreaterThan(0);
    expect(
      within(dialog).getByRole('img', { name: /current ₹17,90,000, new ₹19,50,000/ }),
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

  test('edit details: country is read-only and not sent', async () => {
    const fetch = stubApi(() => Response.json(employee));
    const user = userEvent.setup();
    renderApp('/employees/7');
    await openMenu(user, 'Edit details');
    const dialog = await screen.findByRole('dialog', { name: 'Edit details' });
    expect(within(dialog).queryByRole('combobox', { name: 'Country' })).not.toBeInTheDocument();
    expect(within(dialog).getByText('India')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const patch = fetch.mock.calls.find(([, init]) => init?.method === 'PATCH')!;
    const body = JSON.parse(patch[1]!.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty('countryCode');
    expect(body).toMatchObject({ version: 3 });
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
    await openMenu(user, 'Delete');
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
    await openMenu(user, 'Delete');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(router.state.location.pathname).toBe('/employees/7');
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });

  test('pager shows the position in the list the user came from and keeps its filters', async () => {
    stubFetch((url) => {
      if (url === '/api/auth/me') return Response.json(session);
      if (url === '/api/meta/filters') return Response.json(filterOptions);
      if (url === '/api/employees/7') return Response.json(employee);
      if (url === '/api/employees/7/salary-history') return Response.json(history);
      if (url.startsWith('/api/insights/stats?')) return Response.json([bandRow]);
      if (url.startsWith('/api/employees?')) {
        return Response.json({
          data: [{ ...employee, id: 6 }, employee, { ...employee, id: 8 }],
          page: 2,
          pageSize: 25,
          total: 2818,
        });
      }
      return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
    });
    renderApp('/employees/7?country=IN&page=2');
    expect(await screen.findByText('27 of 2,818')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous employee' })).toHaveAttribute(
      'href',
      '/employees/6?country=IN&page=2',
    );
    expect(screen.getByRole('link', { name: 'Next employee' })).toHaveAttribute(
      'href',
      '/employees/8?country=IN&page=2',
    );
    expect(screen.getByRole('link', { name: 'Back to employees' })).toHaveAttribute(
      'href',
      '/employees?country=IN&page=2',
    );
  });
});
