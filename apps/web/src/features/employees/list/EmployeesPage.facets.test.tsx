import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { employee, filterOptions, session } from '@/features/employees/shared/fixtures';
import { renderApp, stubFetch } from '@/test/render-app';

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
        facets(
          narrowed
            ? [{ value: 'IN', count: 1 }]
            : [
                { value: 'IN', count: 1234 },
                { value: 'DE', count: 56 },
              ],
        ),
      );
    }
    if (url.startsWith('/api/employees?')) {
      return Response.json({ data: [employee], page: 1, pageSize: 25, total: 1 });
    }
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  });
}

/** The filter menu buttons, not the table's sortable headers of the same name. */
const filterButton = async (name: RegExp) =>
  within(await screen.findByRole('group', { name: 'Filters' })).findByRole('button', { name });

describe('toolbar facets', () => {
  test('menus list only facet values, with country names and counts', async () => {
    stubApi();
    renderApp('/employees?level=senior');
    await userEvent.click(await filterButton(/^Country/));
    const menu = await screen.findByLabelText('Country filter');
    expect(await within(menu).findByRole('option', { name: /India/ })).toBeInTheDocument();
    expect(within(menu).getByText('1')).toBeInTheDocument();
    expect(within(menu).queryByText('Germany')).not.toBeInTheDocument();
  });

  test('selecting a value refetches facets with the new filters', async () => {
    const fetch = stubApi();
    renderApp('/employees');
    await userEvent.click(await filterButton(/^Level/));
    await userEvent.click(await screen.findByRole('option', { name: /Senior/ }));
    await vi.waitFor(() =>
      expect(fetch.mock.calls.map(([u]) => u)).toContain('/api/employees/facets?level=senior'),
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(await filterButton(/^Country/));
    const menu = await screen.findByLabelText('Country filter');
    expect(await within(menu).findByText('1')).toBeInTheDocument();
  });
});

describe('searchable filter menus', () => {
  const openCountry = async () => {
    stubApi();
    const router = renderApp('/employees');
    await userEvent.click(await filterButton(/^Country/));
    const menu = await screen.findByLabelText('Country filter');
    await within(menu).findByRole('option', { name: /India/ });
    return { router, menu };
  };

  test('Country has a search box, focused on open, that filters options case-insensitively', async () => {
    const { menu } = await openCountry();
    const search = within(menu).getByRole('combobox', { name: 'Search Country' });
    expect(search).toHaveFocus();
    expect(within(menu).getAllByRole('option')).toHaveLength(2);

    await userEvent.type(search, 'GERM');
    const options = within(menu).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Germany');
  });

  test('shows "No matches" when nothing fits', async () => {
    const { menu } = await openCountry();
    await userEvent.type(within(menu).getByRole('combobox'), 'zzz');
    expect(within(menu).getByText('No matches')).toBeInTheDocument();
    expect(within(menu).queryByRole('option')).not.toBeInTheDocument();
  });

  test('arrow keys move through the results, Enter toggles, Escape closes', async () => {
    const { router, menu } = await openCountry();
    const search = within(menu).getByRole('combobox');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await vi.waitFor(() => expect(router.state.location.search).toBe('?country=DE'));
    expect(search).toHaveAttribute('aria-activedescendant', expect.stringContaining('-1'));
    expect(within(menu).getByRole('option', { name: /Germany/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() =>
      expect(screen.queryByLabelText('Country filter')).not.toBeInTheDocument(),
    );
  });

  test('Department and Job title search too; Level, Employment type and Gender do not', async () => {
    stubApi();
    renderApp('/employees');
    await userEvent.click(await screen.findByRole('button', { name: /^More filters/ }));
    const expected = {
      Department: true,
      'Job title': true,
      Level: false,
      'Employment type': false,
      Gender: false,
    };
    for (const [name, searchable] of Object.entries(expected)) {
      await userEvent.click(await filterButton(new RegExp(`^${name}`)));
      const menu = await screen.findByLabelText(`${name} filter`);
      expect(!!within(menu).queryByRole('combobox')).toBe(searchable);
      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() =>
        expect(screen.queryByLabelText(`${name} filter`)).not.toBeInTheDocument(),
      );
    }
  });
});
