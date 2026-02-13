import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { getCredentials } from './helpers/env';
import { expectPageReady } from './helpers/page';

const credentials = getCredentials();

test.describe('team lead feature actions', () => {
  test.skip(!credentials, 'Missing E2E team lead credentials');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('announcement create modal opens and closes', async ({ page }) => {
    await page.goto('/dashboard/announcements');
    await expectPageReady(page);
    const createButton = page.getByRole('button', {
      name: /create announcement/i,
    });
    await expect(createButton).toBeVisible();
    await createButton.click();
    await expect(
      page.getByRole('heading', { name: /new announcement/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(
      page.getByRole('heading', { name: /new announcement/i })
    ).toHaveCount(0);
  });

  test('kpi create modal opens and closes', async ({ page }) => {
    await page.goto('/dashboard/kpis');
    await expectPageReady(page);
    const addButton = page.getByRole('button', { name: /add kpi/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(
      page.getByRole('heading', { name: /add new kpi/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(
      page.getByRole('heading', { name: /add new kpi/i })
    ).toHaveCount(0);
  });
});
