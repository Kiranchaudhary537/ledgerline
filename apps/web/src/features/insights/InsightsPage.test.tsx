import { screen, waitFor, within } from '@testing-library/react';
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
  test('defaults to the biggest country and answers the question for any role and level', async () => {
    const fetch = stubApi();
    renderApp('/insights');
    const answer = await screen.findByRole('status', { name: 'Answer' });
    expect(await within(answer).findByText('₹1,79,000')).toBeInTheDocument();
    expect(within(answer).getByText(/median, 50 people/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('IN');
    const urls = fetch.mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('groupBy=jobTitle%2Clevel&country=IN'))).toBe(true);
  });

  test('the answer is a pay band with the middle half in words', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const answer = await screen.findByRole('status', { name: 'Answer' });
    expect(
      await within(answer).findByRole('img', { name: /middle half ₹1,78,500 to ₹1,79,500/ }),
    ).toBeInTheDocument();
    expect(within(answer).getByText(/Middle half ₹1,78,500 to ₹1,79,500/)).toBeInTheDocument();
  });

  test('picking a role and level asks the API for exactly that and puts it in the URL', async () => {
    const fetch = stubApi();
    const router = renderApp('/insights?country=IN');
    await screen.findByRole('status', { name: 'Answer' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'QA Engineer');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Level' }), 'senior');
    expect(router.state.location.search).toBe('?country=IN&jobTitle=QA+Engineer&level=senior');
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([u]) =>
            u.includes('groupBy=country') &&
            u.includes('jobTitle=QA+Engineer') &&
            u.includes('level=senior'),
        ),
      ).toBe(true),
    );
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

  test('gender gap is a chart sorted by gap, with the roles it cannot plot named', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const chart = await screen.findByRole('img', { name: /^Gender gap by role:/ });
    expect(chart).toHaveAccessibleName(/Software Engineer 8\.3% women paid less/);
    expect(screen.getByText(/Not enough data: QA Engineer/)).toBeInTheDocument();
  });

  test('a country row switches the page to that country', async () => {
    stubApi();
    const router = renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Countries overview' });
    await userEvent.click(await within(table).findByRole('button', { name: /Germany/ }));
    expect(router.state.location.search).toBe('?country=DE');
  });

  test('shows empty states when nobody matches', async () => {
    stubFetch((url) => {
      const u = new URL(url, 'http://x');
      if (u.pathname === '/api/auth/me') return Response.json(session);
      if (u.pathname === '/api/meta/filters') return Response.json(filterOptions);
      if (u.pathname === '/api/insights/distribution')
        return Response.json({ currency: null, buckets: [] });
      return Response.json([]);
    });
    renderApp('/insights?country=IN&level=junior');
    expect(
      await screen.findByText('Nobody holds this role at this level here'),
    ).toBeInTheDocument();
    expect(await screen.findByText('No one is paid in this country yet')).toBeInTheDocument();
    expect(await screen.findByText('No salaries to chart')).toBeInTheDocument();
  });
});
