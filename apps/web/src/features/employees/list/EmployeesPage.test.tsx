import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';
import { employee, filterOptions, session } from '@/features/employees/shared/fixtures';

afterEach(() => vi.unstubAllGlobals());

function stubApi() {
  return stubFetch((url) => {
    if (url === '/api/auth/me') return Response.json(session);
    if (url === '/api/meta/filters') return Response.json(filterOptions);
    if (url.startsWith('/api/employees?')) {
      return Response.json({
        data: [employee, { ...employee, id: 8, fullName: 'Low Payer' }],
        page: 1,
        pageSize: 25,
        total: 2812,
      });
    }
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  });
}

const listCalls = (fetch: ReturnType<typeof stubApi>) =>
  fetch.mock.calls.map(([url]) => url).filter((u) => u.startsWith('/api/employees?'));

describe('employees page', () => {
  test('asks the API for the URL filters and renders the rows', async () => {
    const fetch = stubApi();
    renderApp('/employees?country=IN&level=mid,senior&sort=hireDate:desc&page=2');

    const link = await screen.findByRole('link', { name: 'Sandeep Singh' });
    expect(link).toHaveAttribute(
      'href',
      '/employees/7?country=IN&level=mid%2Csenior&sort=hireDate%3Adesc&page=2',
    );
    expect(screen.getAllByText('₹17,90,000')).toHaveLength(2);
    expect(screen.getByText('2,812 employees')).toBeInTheDocument();

    const params = new URL(listCalls(fetch)[0]!, 'http://x').searchParams;
    expect(Object.fromEntries(params)).toEqual({
      country: 'IN',
      level: 'mid,senior',
      sort: 'hireDate:desc',
      page: '2',
      pageSize: '25',
    });
  });

  test('export link carries the same filters and sort but no page', async () => {
    stubApi();
    renderApp('/employees?country=IN&sort=salary:asc&page=3');
    const link = await screen.findByRole('link', { name: 'Export CSV' });
    expect(link).toHaveAttribute('href', '/api/employees/export.csv?country=IN&sort=salary%3Aasc');
  });

  test('rows show department and level as pills, and a menu with the four actions', async () => {
    stubApi();
    renderApp('/employees');
    const row = (await screen.findByRole('link', { name: 'Low Payer' })).closest('tr')!;
    expect(within(row).getByText('Engineering')).toBeInTheDocument();
    expect(within(row).getByText('Mid')).toBeInTheDocument();
    await userEvent.click(within(row).getByRole('button', { name: 'Actions for Low Payer' }));
    for (const name of ['View', 'Edit', 'Change salary', 'Delete']) {
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    }
  });

  test('the row menu opens the salary dialog for that person', async () => {
    stubApi();
    renderApp('/employees');
    const row = (await screen.findByRole('link', { name: 'Low Payer' })).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Actions for Low Payer' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Change salary' }));
    expect(await screen.findByRole('dialog', { name: 'Change salary' })).toHaveTextContent(
      'Low Payer earns',
    );
  });

  test('salary sort is disabled without exactly one country', async () => {
    stubApi();
    renderApp('/employees');
    const salary = await screen.findByRole('button', { name: /^Salary/ });
    expect(salary).toHaveAttribute('aria-disabled', 'true');
    expect(salary).toHaveAttribute('title', 'Filter to one country to sort by salary');
    expect(screen.getByRole('button', { name: /^Name/ })).not.toHaveAttribute('aria-disabled');
  });

  test('salary sort works with one country and updates the URL', async () => {
    stubApi();
    const router = renderApp('/employees?country=IN');
    const salary = await screen.findByRole('button', { name: /^Salary/ });
    expect(salary).not.toHaveAttribute('aria-disabled');
    salary.click();
    await vi.waitFor(() =>
      expect(router.state.location.search).toBe('?country=IN&sort=salary%3Aasc'),
    );
  });

  test('Next and Previous page through the list via the URL, keeping filters', async () => {
    const fetch = stubApi();
    const user = userEvent.setup();
    const router = renderApp('/employees?country=IN');
    const pages = await screen.findByRole('navigation', { name: 'Pages' });
    expect(within(pages).getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(within(pages).getByText('1 to 25 of 2,812')).toBeInTheDocument();

    await user.click(within(pages).getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(router.state.location.search).toBe('?country=IN&page=2'));
    await vi.waitFor(() => expect(listCalls(fetch).at(-1)).toMatch(/country=IN.*page=2/));

    await user.click(within(pages).getByRole('button', { name: 'Previous' }));
    await vi.waitFor(() => expect(router.state.location.search).toBe('?country=IN'));
  });

  test('shows an empty state with a way out', async () => {
    stubFetch((url) => {
      if (url === '/api/auth/me') return Response.json(session);
      if (url === '/api/meta/filters') return Response.json(filterOptions);
      return Response.json({ data: [], page: 1, pageSize: 25, total: 0 });
    });
    renderApp('/employees?q=zzz');
    expect(await screen.findByText('No employees match these filters')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0);
  });
});
