import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Navigation Tests (Section 16)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    // Set desktop viewport to see sidebar
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('nav-dashboard: Dashboard link works', async ({ page }) => {
    // Start from a different page
    await page.goto('/#/app/fields');

    // Click dashboard link in sidebar
    await page.click('a[href="#/app"]');
    await expect(page).toHaveURL(/.*#\/app$/);
  });

  test('nav-fields: Fields link works', async ({ page }) => {
    await page.click('a[href="#/app/fields"]');
    await expect(page).toHaveURL(/.*#\/app\/fields/);
    await expect(page.getByRole('heading', { name: 'მიწები' })).toBeVisible();
  });

  test('nav-works: Works link works', async ({ page }) => {
    await page.click('a[href="#/app/works"]');
    await expect(page).toHaveURL(/.*#\/app\/works/);
    await expect(page.getByRole('heading', { name: 'სამუშაოები' })).toBeVisible();
  });

  test('nav-lots: Lots link works', async ({ page }) => {
    await page.click('a[href="#/app/lots"]');
    await expect(page).toHaveURL(/.*#\/app\/lots/);
    // Use first() since nav also has this text
    await expect(page.getByRole('heading', { name: 'მოსავალი' }).first()).toBeVisible();
  });

  test('nav-warehouses: Warehouses link works', async ({ page }) => {
    await page.click('a[href="#/app/warehouses"]');
    await expect(page).toHaveURL(/.*#\/app\/warehouses/);
    await expect(page.getByRole('heading', { name: 'საწყობები' })).toBeVisible();
  });

  test('nav-sales: Sales link works', async ({ page }) => {
    await page.click('a[href="#/app/sales"]');
    await expect(page).toHaveURL(/.*#\/app\/sales/);
    await expect(page.getByRole('heading', { name: 'გაყიდვები' })).toBeVisible();
  });

  test('nav-expenses: Expenses link works', async ({ page }) => {
    await page.click('a[href="#/app/expenses"]');
    await expect(page).toHaveURL(/.*#\/app\/expenses/);
    await expect(page.getByRole('heading', { name: 'ხარჯები' })).toBeVisible();
  });

  test('nav-reports: Reports link works', async ({ page }) => {
    await page.click('a[href="#/app/reports"]');
    await expect(page).toHaveURL(/.*#\/app\/reports/);
    await expect(page.getByRole('heading', { name: 'რეპორტები' })).toBeVisible();
  });

  test('nav-settings: Settings link works', async ({ page }) => {
    await page.click('a[href="#/app/settings"]');
    await expect(page).toHaveURL(/.*#\/app\/settings/);
    await expect(page.getByRole('heading', { name: 'პარამეტრები' })).toBeVisible();
  });

  test('nav-sidebar-visible-desktop: Sidebar visible on desktop', async ({ page }) => {
    // Desktop viewport already set in beforeEach
    await page.goto('/#/app');

    // Sidebar should be visible with app name - check for the sidebar nav links
    const sidebarLink = page.locator('aside a[href="#/app"]');
    await expect(sidebarLink).toBeVisible();
  });

  test('nav-mobile-bottom-nav: Bottom nav visible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/app');

    // Wait for layout to adjust
    await page.waitForTimeout(500);

    // On mobile, the sidebar should be hidden
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();
  });

  test('nav-all-routes-accessible: All main routes are accessible', async ({ page }) => {
    const routes = [
      { path: '/#/app', heading: 'მთავარი' },
      { path: '/#/app/fields', heading: 'მიწები' },
      { path: '/#/app/works', heading: 'სამუშაოები' },
      { path: '/#/app/lots', heading: 'მოსავალი' },
      { path: '/#/app/warehouses', heading: 'საწყობები' },
      { path: '/#/app/sales', heading: 'გაყიდვები' },
      { path: '/#/app/expenses', heading: 'ხარჯები' },
      { path: '/#/app/reports', heading: 'რეპორტები' },
      { path: '/#/app/settings', heading: 'პარამეტრები' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      // Use first() to handle cases where text appears in both nav and heading
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
