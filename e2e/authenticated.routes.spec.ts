import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { getCredentials } from './helpers/env';
import { expectPageReady } from './helpers/page';

const credentials = getCredentials();

const routes = [
  { name: 'dashboard home', path: '/dashboard' },
  { name: 'overview', path: '/dashboard/overview' },
  { name: 'announcements', path: '/dashboard/announcements' },
  { name: 'tasks', path: '/dashboard/tasks' },
  { name: 'team', path: '/dashboard/team' },
  { name: 'users', path: '/dashboard/users' },
  { name: 'kpis', path: '/dashboard/kpis' },
  { name: 'individual kpis', path: '/dashboard/individual-kpis' },
  { name: 'daily reports', path: '/dashboard/daily-reports' },
  { name: 'reports', path: '/dashboard/reports' },
  { name: 'report history', path: '/dashboard/reports/history' },
  { name: 'peer feedback', path: '/dashboard/peer-feedback' },
  { name: 'peer feedback status', path: '/dashboard/peer-feedback-status' },
  { name: 'analytics (dashboard)', path: '/dashboard/analytics' },
  { name: 'insights', path: '/dashboard/insights' },
  { name: 'analytics', path: '/analytics' },
  { name: 'support', path: '/support' },
  { name: 'settings', path: '/settings' },
];

test.describe('team lead feature pages', () => {
  test.skip(!credentials, 'Missing E2E team lead credentials');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const route of routes) {
    test(`${route.name} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expectPageReady(page);
      await expect(page.locator('main')).toContainText(/\S+/);
    });
  }
});
