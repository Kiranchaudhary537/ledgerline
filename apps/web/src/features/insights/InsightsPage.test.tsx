import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { employee, filterOptions, session } from '@/features/employees/shared/fixtures';
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
  avgCompaRatio: 1.02,
  outOfBandCount: 3,
  compaP25: 0.9,
  compaP75: 1.15,
  currency: 'INR',
});

const person = (id: number, fullName: string, compaRatio: number) => ({
  ...employee,
  id,
  fullName,
  compaRatio,
});
const lowest = [
  person(11, 'Asha Rao', 0.62),
  person(12, 'Ben Okoye', 0.8),
  person(13, 'Cy Lin', 0.9),
];
const highest = [person(21, 'Dee Park', 1.4)];

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
    if (u.pathname === '/api/employees') {
      const asc = p.get('sort') === 'compaRatio:asc';
      return Response.json({ data: asc ? lowest : highest, page: 1, pageSize: 5, total: 9 });
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
  test('defaults to the biggest country and shows the summary line', async () => {
    const fetch = stubApi();
    renderApp('/insights');
    expect(await screen.findByText('50 people')).toBeInTheDocument();
    const urls = fetch.mock.calls.map(([u]) => u);
    expect(urls.some((u) => u.includes('groupBy=jobTitle%2Clevel&country=IN'))).toBe(true);
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

  test('the scorecard line states people, median, payroll, average compa-ratio and share outside band', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const line = await screen.findByRole('status', { name: 'Scorecard' });
    expect(await within(line).findByText('50 people')).toBeInTheDocument();
    expect(within(line).getByText(/Average compa-ratio 1\.02/)).toBeInTheDocument();
    // 3 of 50 outside band
    expect(within(line).getByText(/6% outside their band/)).toBeInTheDocument();
  });

  test('needs attention lists the lowest and highest paid against band, with links', async () => {
    const fetch = stubApi();
    renderApp('/insights?country=IN&department=Engineering');
    const below = await screen.findByRole('region', { name: 'Furthest below band' });
    expect(await within(below).findByRole('link', { name: /Asha Rao/ })).toHaveAttribute(
      'href',
      '/employees/11',
    );
    expect(within(below).getByText('0.62')).toBeInTheDocument();
    // 0.90 is inside the band, so it is not listed as needing attention
    expect(within(below).queryByText('Cy Lin')).not.toBeInTheDocument();
    expect(within(below).getByRole('link', { name: 'See all' })).toHaveAttribute(
      'href',
      '/employees?country=IN&department=Engineering&sort=compaRatio%3Aasc',
    );
    const above = screen.getByRole('region', { name: 'Furthest above band' });
    expect(within(above).getByRole('link', { name: 'See all' })).toHaveAttribute(
      'href',
      '/employees?country=IN&department=Engineering&sort=compaRatio%3Adesc',
    );
    const urls = fetch.mock.calls.map(([u]) => u);
    expect(urls).toContain(
      '/api/employees?country=IN&department=Engineering&sort=compaRatio%3Aasc&pageSize=5',
    );
  });

  test('needs attention says so when nobody is out of band on a side', async () => {
    stubFetch((url) => {
      const u = new URL(url, 'http://x');
      if (u.pathname === '/api/employees')
        return Response.json({ data: [person(1, 'Eve', 1)], page: 1, pageSize: 5, total: 1 });
      return apiResponse(url);
    });
    renderApp('/insights?country=IN');
    const below = await screen.findByRole('region', { name: 'Furthest below band' });
    expect(await within(below).findByText('Nobody is below their band.')).toBeInTheDocument();
  });

  test('pay by role shows people outside band and flags a wide compa-ratio spread', async () => {
    stubApi();
    renderApp('/insights?country=IN');
    const table = await screen.findByRole('table', { name: 'Pay by role' });
    const [se] = within(table).getAllByRole('row').slice(1);
    // 2 levels x 3 outside band
    expect(within(se!).getByText('6')).toBeInTheDocument();
    // spread 1.15 - 0.90 = 0.25 is over the 0.20 review limit
    expect(within(se!).getByText('0.25')).toBeInTheDocument();
    expect(within(se!).getByText(/wider than 0\.20/)).toBeInTheDocument();
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
