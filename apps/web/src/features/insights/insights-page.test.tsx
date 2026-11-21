import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { filterOptions, session } from '@/features/employees/fixtures';
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
  return stubFetch((url) => {
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
  });
}

describe('insights page', () => {
  test('defaults to the biggest country and shows the summary line', async () => {
    const fetch = stubApi();
    renderApp('/insights');
    expect(await screen.findByText('50 people')).toBeInTheDocument();
    const urls = fetch.mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('groupBy=jobTitle%2Clevel&country=IN'))).toBe(true);
  });

  test('renders the pay by role table with a rail per row', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Pay by role' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('Software Engineer')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('₹2,36,000')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('img')).toHaveAccessibleName(/median ₹2,36,000/);
  });

  test('a row opens the employees list with its filters', async () => {
    stubApi();
    const router = renderApp('/insights?country=IN');
    await userEvent.click(await screen.findByRole('link', { name: /Software Engineer/ }));
    expect(router.state.location.pathname).toBe('/employees');
    expect(router.state.location.search).toBe(
      '?country=IN&jobTitle=Software+Engineer&level=senior',
    );
  });

  test('gender gap shows direction in text and Not enough data for null', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Gender gap by role' });
    expect(within(table).getByText(/8\.3%/)).toBeInTheDocument();
    expect(within(table).getByText(/women paid less/)).toBeInTheDocument();
    expect(within(table).getByText('Not enough data')).toBeInTheDocument();
  });

  test('shows an empty state when nobody matches', async () => {
    stubFetch((url) => {
      const u = new URL(url, 'http://x');
      if (u.pathname === '/api/auth/me') return Response.json(session);
      if (u.pathname === '/api/meta/filters') return Response.json(filterOptions);
      if (u.pathname === '/api/insights/distribution')
        return Response.json({ currency: null, buckets: [] });
      return Response.json([]);
    });
    renderApp('/insights?country=IN&level=junior');
    expect(await screen.findByText('No people match these filters')).toBeInTheDocument();
  });
});
