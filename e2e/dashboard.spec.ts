import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Dashboard Tests (Section 5)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard-loads: Dashboard loads with all elements', async ({ page }) => {
    // Verify dashboard heading
    await expect(page.getByRole('heading', { name: 'მთავარი' })).toBeVisible();

    // Verify 4 quick action cards exist (hash-based routing: #/app/...)
    await expect(page.locator('a[href="#/app/lots/new"]')).toBeVisible();
    await expect(page.locator('a[href="#/app/sales/new"]')).toBeVisible();
    await expect(page.locator('a[href="#/app/transfer"]')).toBeVisible();
    await expect(page.locator('a[href="#/app/expenses/new"]')).toBeVisible();

    // Verify widget sections exist
    await expect(page.getByText('დაგეგმილი სამუშაოები').first()).toBeVisible();
    await expect(page.getByText('ბოლო მოსავალი')).toBeVisible();
  });

  test('dashboard-quick-action-lots: Quick action navigates to lots/new', async ({ page }) => {
    await page.click('a[href="#/app/lots/new"]');
    await page.waitForURL('**/#/app/lots/new');
  });

  test('dashboard-quick-action-sales: Quick action navigates to sales/new', async ({ page }) => {
    await page.click('a[href="#/app/sales/new"]');
    await page.waitForURL('**/#/app/sales/new');
  });

  test('dashboard-quick-action-transfer: Quick action navigates to transfer', async ({ page }) => {
    await page.click('a[href="#/app/transfer"]');
    await page.waitForURL('**/#/app/transfer');
  });

  test('dashboard-quick-action-expenses: Quick action navigates to expenses/new', async ({ page }) => {
    await page.click('a[href="#/app/expenses/new"]');
    await page.waitForURL('**/#/app/expenses/new');
  });

  test('dashboard-works-section: Works section displays correctly', async ({ page }) => {
    // Check works section heading exists
    await expect(page.getByText('დაგეგმილი სამუშაოები').first()).toBeVisible();

    // Check for either works items or empty message
    const emptyMessage = page.getByText('დაგეგმილი სამუშაოები არ არის.');
    const viewAllLink = page.locator('a[href="#/app/works"]').filter({ hasText: 'ყველას ნახვა' });

    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasViewAll = await viewAllLink.isVisible().catch(() => false);
    expect(hasEmpty || hasViewAll).toBeTruthy();
  });

  test('dashboard-lots-section: Lots section displays correctly', async ({ page }) => {
    // Check lots section heading exists
    await expect(page.getByText('ბოლო მოსავალი')).toBeVisible();

    // Check for either lot items or empty message
    const emptyMessage = page.getByText('მონაცემები არ არის.');
    const viewAllLink = page.locator('a[href="#/app/lots"]').filter({ hasText: 'ყველას ნახვა' });

    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasViewAll = await viewAllLink.isVisible().catch(() => false);
    expect(hasEmpty || hasViewAll).toBeTruthy();
  });

  test('dashboard-view-all-works: View all works link navigates correctly', async ({ page }) => {
    await page.locator('a[href="#/app/works"]').filter({ hasText: 'ყველას ნახვა' }).click();
    await page.waitForURL('**/#/app/works');
  });

  test('dashboard-view-all-lots: View all lots link navigates correctly', async ({ page }) => {
    await page.locator('a[href="#/app/lots"]').filter({ hasText: 'ყველას ნახვა' }).click();
    await page.waitForURL('**/#/app/lots');
  });
});
