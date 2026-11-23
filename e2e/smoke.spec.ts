import { expect, test } from '@playwright/test';
import { E2E_USER } from '../playwright.config.ts';

test('HR logs in, finds an employee and changes their salary', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Email').fill(E2E_USER.email);
  await page.getByLabel('Password').fill(E2E_USER.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  const search = page.getByRole('searchbox', { name: 'Search by name, email or code' });
  await search.fill('sharma');
  await expect(page).toHaveURL(/q=sharma/);
  const first = page.getByRole('link', { name: /sharma/i }).first();
  await expect(first).toBeVisible();
  const name = (await first.textContent())!.trim();
  await first.click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

  const reason = `Market adjustment ${Date.now()}`;
  await page.getByRole('button', { name: 'Change salary' }).click();
  const dialog = page.getByRole('dialog', { name: 'Change salary' });
  await dialog.getByLabel(/New annual salary/).fill('1234567');
  await dialog.getByLabel('Reason').fill(reason);
  await dialog.getByRole('button', { name: 'Change salary' }).click();
  await expect(dialog).toBeHidden();

  const history = page.getByRole('region', { name: 'Salary history' });
  await expect(history.getByRole('listitem').first()).toContainText(reason);
  await expect(history.getByRole('listitem').first()).toContainText(
    // Grouping depends on the employee's country.
    /12,34,567|1,234,567|1\.234\.567|1\s234\s567/,
  );
});
