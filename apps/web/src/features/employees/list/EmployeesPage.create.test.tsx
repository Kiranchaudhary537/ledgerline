import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderApp, stubFetch } from '@/test/render-app';
import { employee, filterOptions, session } from '@/features/employees/shared/fixtures';

afterEach(() => vi.unstubAllGlobals());

const created = { ...employee, id: 9, fullName: 'Asha Rao' };

function stubApi(onCreate: () => Response) {
  return stubFetch((url, init) => {
    if (init?.method === 'POST' && url === '/api/employees') return onCreate();
    if (url === '/api/auth/me') return Response.json(session);
    if (url === '/api/meta/filters') return Response.json(filterOptions);
    if (url === '/api/employees/9') return Response.json(created);
    if (url === '/api/employees/9/salary-history') return Response.json([]);
    if (url.startsWith('/api/insights/stats?')) return Response.json([]);
    if (url.startsWith('/api/employees?')) {
      return Response.json({ data: [], page: 1, pageSize: 25, total: 0 });
    }
    return Response.json({ code: 'ROUTE_NOT_FOUND', message: 'nope' }, { status: 404 });
  });
}

async function fillNewEmployee(user: ReturnType<typeof userEvent.setup>) {
  renderApp('/employees');
  await user.click((await screen.findAllByRole('button', { name: 'Add employee' }))[0]!);
  const dialog = await screen.findByRole('dialog', { name: 'Add employee' });
  const d = within(dialog);
  await user.type(d.getByLabelText('Full name'), 'Asha Rao');
  await user.type(d.getByLabelText('Email'), 'asha.rao@acme.example');
  await user.selectOptions(d.getByLabelText('Department'), 'Engineering');
  await user.selectOptions(d.getByLabelText('Job title'), 'QA Engineer');
  await user.selectOptions(d.getByLabelText('Level'), 'senior');
  await user.selectOptions(d.getByLabelText('Country'), 'IN');
  await user.selectOptions(d.getByLabelText('Employment type'), 'full_time');
  await user.selectOptions(d.getByLabelText('Gender'), 'female');
  await user.type(d.getByLabelText('Hire date'), '2024-01-15');
  await user.type(d.getByLabelText('Annual salary (INR)'), '15,00,000');
  await user.click(d.getByRole('button', { name: 'Add employee' }));
  return dialog;
}

describe('add employee', () => {
  test('posts the form in minor units and opens the new person', async () => {
    const fetch = stubApi(() => Response.json(created, { status: 201 }));
    const user = userEvent.setup();
    const dialog = await fillNewEmployee(user);

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      fullName: 'Asha Rao',
      email: 'asha.rao@acme.example',
      department: 'Engineering',
      jobTitle: 'QA Engineer',
      level: 'senior',
      countryCode: 'IN',
      employmentType: 'full_time',
      gender: 'female',
      hireDate: '2024-01-15',
      salaryMinor: 150000000,
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument();
  });

  test('a duplicate email is shown next to Email and the dialog stays open', async () => {
    stubApi(() =>
      Response.json(
        {
          code: 'EMAIL_TAKEN',
          message: 'This email is already used by another employee.',
          fields: { email: 'This email is already used by another employee.' },
        },
        { status: 409 },
      ),
    );
    const dialog = await fillNewEmployee(userEvent.setup());

    const email = await within(dialog).findByLabelText('Email');
    await waitFor(() => expect(email).toHaveAccessibleDescription(/already used/));
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(dialog).toBeInTheDocument();
  });
});
