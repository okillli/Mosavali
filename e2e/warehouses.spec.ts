import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { cleanupE2EWarehouses, logCleanupResults } from './utils/cleanup';

test.describe('Warehouses Tests (Section 8)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Clean up E2E test warehouses after all tests
  test.afterAll(async () => {
    const results = await cleanupE2EWarehouses();
    logCleanupResults(results);
  });

  test('warehouses-list: Warehouses list page loads', async ({ page }) => {
    await page.goto('/#/app/warehouses');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'საწყობები' })).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/warehouses/new"]')).toBeVisible();
  });

  test('warehouses-add-button: Add button navigates to new warehouse page', async ({ page }) => {
    await page.goto('/#/app/warehouses');
    await page.click('a[href="#/app/warehouses/new"]');
    await page.waitForURL('**/#/app/warehouses/new');
  });

  test('warehouses-create: Create new warehouse successfully', async ({ page }) => {
    const uniqueName = `E2E ტესტ საწყობი ${Date.now()}`;

    await page.goto('/#/app/warehouses/new');

    // Wait for form to load
    await page.waitForTimeout(500);

    // Fill the warehouse name
    await page.locator('input').first().fill(uniqueName);

    // Click save
    await page.getByRole('button', { name: 'შენახვა' }).click();

    // Wait for redirect to warehouses list
    await page.waitForURL('**/#/app/warehouses', { timeout: 10000 });

    // Verify the new warehouse appears in the list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
  });

  test('warehouses-create-cancel: Cancel button goes back', async ({ page }) => {
    await page.goto('/#/app/warehouses');
    await page.click('a[href="#/app/warehouses/new"]');
    await page.waitForURL('**/#/app/warehouses/new');

    // Click cancel
    await page.getByRole('button', { name: 'გაუქმება' }).click();

    // Should go back
    await page.waitForURL('**/#/app/warehouses');
  });

  test('warehouses-view-detail: Click warehouse navigates to detail page', async ({ page }) => {
    await page.goto('/#/app/warehouses');

    // Wait for warehouses to load
    await page.waitForTimeout(1000);

    // Check if there are any warehouses
    const warehouseCards = page.locator('a[href^="#/app/warehouses/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await warehouseCards.count();

    if (count > 0) {
      // Click on the first warehouse
      await warehouseCards.first().click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*#\/app\/warehouses\/[a-z0-9-]+/);
    } else {
      test.skip();
    }
  });

  test('warehouses-empty-state: Empty state message when no warehouses', async ({ page }) => {
    await page.goto('/#/app/warehouses');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for either warehouses or empty state
    const hasWarehouses = await page.locator('a[href^="#/app/warehouses/"]').filter({ hasNot: page.locator('text=დამატება') }).count() > 0;
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    expect(hasWarehouses || hasEmptyState).toBeTruthy();
  });

  test('warehouses-detail-shows-bins: Warehouse detail shows bins section', async ({ page }) => {
    await page.goto('/#/app/warehouses');

    // Wait for warehouses to load
    await page.waitForTimeout(1000);

    const warehouseCards = page.locator('a[href^="#/app/warehouses/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await warehouseCards.count();

    if (count > 0) {
      await warehouseCards.first().click();
      await page.waitForURL(/.*#\/app\/warehouses\/[a-z0-9-]+/);

      // Should show bins section or default bin
      await page.waitForTimeout(1000);

      // Check for bin-related content (სექცია means bin/section)
      const hasBinContent = await page.getByText(/სექცია/i).isVisible().catch(() => false);
      const hasEmptyBins = await page.getByText(/მონაცემები არ/i).isVisible().catch(() => false);

      expect(hasBinContent || hasEmptyBins).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
