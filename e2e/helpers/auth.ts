import { expect, Page } from '@playwright/test';
import { getCredentials } from './env';

export async function login(page: Page) {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error('Missing E2E team lead credentials');
  }

  await page.goto('/login');
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /sign in as team lead/i }).click();
  await page.waitForURL('**/dashboard**');
  await expect(page.locator('main')).toBeVisible();
}
