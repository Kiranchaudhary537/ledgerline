import { expect, test } from 'vitest';
import { breadcrumbs } from './breadcrumbs';

test('list, detail and insights trails', () => {
  expect(breadcrumbs('/employees')).toEqual([{ label: 'Employees' }]);
  expect(breadcrumbs('/')).toEqual([{ label: 'Employees' }]);
  expect(breadcrumbs('/insights')).toEqual([{ label: 'Insights' }]);
  expect(breadcrumbs('/employees/7', 'Sandeep Singh')).toEqual([
    { label: 'Employees', to: '/employees' },
    { label: 'Sandeep Singh' },
  ]);
});

test('the detail trail has a placeholder until the name loads', () => {
  expect(breadcrumbs('/employees/7')[1]).toEqual({ label: '…' });
});
