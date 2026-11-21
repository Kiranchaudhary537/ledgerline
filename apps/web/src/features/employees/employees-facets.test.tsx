import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';
import { employee, filterOptions, session } from './fixtures';

afterEach(() => vi.unstubAllGlobals());

const facets = (country: { value: string; count: number }[]) => ({
  country,
  department: [{ value: 'Engineering', count: 9 }],
  jobTitle: [],
  level: [{ value: 'senior', count: 3 }],
  employmentType: [],
  gender: [],
});

function stubApi() {
  return stubFetch((url) => {
    if (url === '/api/auth/me') return Response.json(session);
    if (url === '/api/meta/filters') return Response.json(filterOptions);
    if (url.startsWith('/api/employees/facets')) {
      const narrowed = url.includes('level=senior');
      return Response.json(
        facets(narrowed ? [{ value: 'IN', count: 1 }] : [{ value: 'IN', count: 1234 }]),
      );
    }
    if (url.startsWith('/api/employees?')) {
      return Response.json({ data: [employee], page: 1, pageSize: 25, total: 1 });
    }
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  });
}

describe('toolbar facets', () => {
  test('menus list only facet values, with country names and counts', async () => {
    stubApi();
    renderApp('/employees');
    await userEvent.click(await screen.findByRole('button', { name: /^Country/ }));
    const menu = await screen.findByLabelText('Country filter');
    const option = await within(menu).findByRole('checkbox', { name: /India/ });
    expect(option).toBeInTheDocument();
    expect(within(menu).getByText('1,234')).toBeInTheDocument();
    expect(within(menu).queryByText('Germany')).not.toBeInTheDocument();
  });

  test('selecting a value refetches facets with the new filters', async () => {
    const fetch = stubApi();
    renderApp('/employees');
    await userEvent.click(await screen.findByRole('button', { name: /^Level/ }));
    await userEvent.click(await screen.findByRole('checkbox', { name: /Senior/ }));
    await vi.waitFor(() =>
      expect(fetch.mock.calls.map(([u]) => u)).toContain('/api/employees/facets?level=senior'),
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: /^Country/ }));
    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});
