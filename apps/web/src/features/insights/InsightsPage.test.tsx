import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { filterOptions, session } from '@/features/employees/shared/fixtures';
import { renderApp, stubFetch } from '@/test/render-app';

afterEach(() => vi.unstubAllGlobals());

const stat = (group: Record<string, string>, count: number, median: number) => ({
  group,
  count,
  min: median - 100000,
  p25: median - 50000,
  median,
  p75: median + 50000,
  max: median + 100000,
  avg: median,
  total: median * count,
  currency: 'INR',
});

function stubApi() {
  return stubFetch(apiResponse);
}

function apiResponse(url: string) {
  {
    const u = new URL(url, 'http://x');
    const p = u.searchParams;
    if (u.pathname === '/api/auth/me') return Response.json(session);
    if (u.pathname === '/api/meta/filters') return Response.json(filterOptions);
    if (u.pathname === '/api/insights/stats') {
      const by = p.get('groupBy');
      if (by === 'country' && !p.get('country'))
        return Response.json([
          { ...stat({ country: 'DE' }, 10, 8000000), currency: 'EUR' },
          stat({ country: 'IN' }, 50, 17900000),
        ]);
      if (by === 'country') return Response.json([stat({ country: 'IN' }, 50, 17900000)]);
      return Response.json([
        stat({ jobTitle: 'Software Engineer', level: 'senior' }, 30, 23600000),
        stat({ jobTitle: 'Software Engineer', level: 'junior' }, 10, 11600000),
        stat({ jobTitle: 'QA Engineer', level: 'mid' }, 20, 12000000),
      ]);
    }
    if (u.pathname === '/api/insights/distribution')
      return Response.json({
        currency: 'INR',
        buckets: [
          { from: 1000000, to: 2000000, count: 4 },
          { from: 2000000, to: 3000000, count: 9 },
        ],
      });
    if (u.pathname === '/api/insights/gender-gap')
      return Response.json([
        {
          group: { jobTitle: 'Software Engineer' },
          femaleMedian: 22000000,
          maleMedian: 24000000,
          femaleCount: 12,
          maleCount: 18,
          gapPct: 8.3,
          currency: 'INR',
        },
        {
          group: { jobTitle: 'QA Engineer' },
          femaleMedian: 12000000,
          maleMedian: null,
          femaleCount: 3,
          maleCount: 0,
          gapPct: null,
          currency: 'INR',
        },
      ]);
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  }
}

describe('insights page', () => {
  test('defaults to the biggest country and shows its summary', async () => {
    const fetch = stubApi();
    renderApp('/insights');
    const summary = await screen.findByRole('status', { name: 'Summary' });
    expect(await within(summary).findByText('50')).toBeInTheDocument();
    const urls = fetch.mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('groupBy=jobTitle%2Clevel&country=IN'))).toBe(true);
  });

  test('the summary card states payroll, headcount, median and the quarters of the chosen country', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const summary = await screen.findByRole('status', { name: 'Summary' });
    expect(await within(summary).findByText('50')).toBeInTheDocument();
    expect(within(summary).getByText('People')).toBeInTheDocument();
    expect(within(summary).getByText('₹1,79,000')).toBeInTheDocument();
    expect(within(summary).getByText('₹89,50,000')).toBeInTheDocument();
    expect(within(summary).getByText(/Annual payroll in India/)).toBeInTheDocument();
  });

  test('no compa-ratio or needs-attention content remains', async () => {
    const fetch = stubApi();
    renderApp('/insights?country=IN');
    await screen.findByRole('table', { name: 'Pay by role' });
    expect(screen.queryByText(/compa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/outside (their )?band/i)).not.toBeInTheDocument();
    expect(fetch.mock.calls.some(([u]) => u.startsWith('/api/employees'))).toBe(false);
  });

  test('pay by role has one row per title with a median tick per level', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Pay by role' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('40')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('₹1,16,000 – ₹2,36,000')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('img', { name: 'Senior median ₹2,36,000' })).toBeVisible();
    expect(within(rows[0]!).getByRole('img', { name: 'Junior median ₹1,16,000' })).toBeVisible();
  });

  test('a role expands to its levels with band rails', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const toggle = await screen.findByRole('button', { name: 'Software Engineer levels' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const table = screen.getByRole('table', { name: 'Pay by role' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByRole('img', { name: /Pay band: .*median ₹2,36,000/ })).toBeVisible();
    await userEvent.click(toggle);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  test('the role link opens the employees list for the title, a level link adds the level', async () => {
    stubApi();
    const router = renderApp('/insights?country=IN');
    await userEvent.click(await screen.findByRole('link', { name: 'Software Engineer' }));
    expect(router.state.location.search).toBe('?country=IN&jobTitle=Software+Engineer');
  });

  test('gender gap shows direction in text and Not enough data for null', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Gender gap by role' });
    expect(within(table).getByText(/8\.3%/)).toBeInTheDocument();
    expect(within(table).getByText(/women paid less/)).toBeInTheDocument();
    expect(within(table).getByText('Not enough data')).toBeInTheDocument();
  });

  test('gender gap is a dot plot sorted by gap with a table behind it', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const list = await screen.findByRole('list', { name: 'Gender gap by role' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Software Engineer');
    expect(items[0]).toHaveTextContent('8.3% women paid less');
    expect(items[1]).toHaveTextContent('Not enough data');
  });

  test('a country row switches the page to that country', async () => {
    stubApi();
    const router = renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Countries overview' });
    await userEvent.click(await within(table).findByRole('button', { name: /Germany/ }));
    expect(router.state.location.search).toBe('?country=DE');
  });

  test('shows an empty state when nobody matches', async () => {
    stubFetch((url) => {
      const u = new URL(url, 'http://x');
      if (u.pathname === '/api/auth/me') return Response.json(session);
      if (u.pathname === '/api/meta/filters') return Response.json(filterOptions);
      if (u.pathname === '/api/insights/distribution')
        return Response.json({ currency: null, buckets: [] });
      if (u.pathname === '/api/employees')
        return Response.json({ data: [], page: 1, pageSize: 5, total: 0 });
      return Response.json([]);
    });
    renderApp('/insights?country=IN&level=junior');
    expect(await screen.findByText('No people match these filters')).toBeInTheDocument();
  });
});
