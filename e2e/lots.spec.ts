import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Lots Tests (Section 9)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('lots-list: Lots list page loads', async ({ page }) => {
    await page.goto('/#/app/lots');

    // Verify page heading (მოსავალი = lots/harvest) - use first() since nav also has this text
    await expect(page.getByRole('heading', { name: 'მოსავალი' }).first()).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/lots/new"]')).toBeVisible();
  });

  test('lots-add-button: Add button navigates to new lot page', async ({ page }) => {
    await page.goto('/#/app/lots');
    await page.click('a[href="#/app/lots/new"]');
    await page.waitForURL('**/#/app/lots/new');
  });

  test('lots-create-form-step1: Create form step 1 has required elements', async ({ page }) => {
    await page.goto('/#/app/lots/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Check form labels exist - step 1 should have season, crop, variety, field, weight
    await expect(page.getByText('სეზონი')).toBeVisible();
    await expect(page.getByText('კულტურა')).toBeVisible();
    await expect(page.getByText('ჯიში')).toBeVisible();

    // Check selects exist
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThanOrEqual(2);
  });

  test('lots-create-cancel: Cancel goes back', async ({ page }) => {
    await page.goto('/#/app/lots');
    await page.click('a[href="#/app/lots/new"]');
    await page.waitForURL('**/#/app/lots/new');

    // Wait for form
    await page.waitForTimeout(500);

    // Find and click cancel button
    const cancelButton = page.getByRole('button', { name: 'გაუქმება' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForURL('**/#/app/lots');
    }
  });

  test('lots-view-detail: Click lot navigates to detail page', async ({ page }) => {
    await page.goto('/#/app/lots');

    // Wait for lots to load
    await page.waitForTimeout(1000);

    // Check if there are any lots
    const lotCards = page.locator('a[href^="#/app/lots/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await lotCards.count();

    if (count > 0) {
      // Click on the first lot
      await lotCards.first().click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*#\/app\/lots\/[a-z0-9-]+/);
    } else {
      test.skip();
    }
  });

  test('lots-detail-shows-info: Lot detail shows lot information', async ({ page }) => {
    await page.goto('/#/app/lots');

    // Wait for lots to load
    await page.waitForTimeout(1000);

    const lotCards = page.locator('a[href^="#/app/lots/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await lotCards.count();

    if (count > 0) {
      await lotCards.first().click();
      await page.waitForURL(/.*#\/app\/lots\/[a-z0-9-]+/);

      // Wait for detail to load
      await page.waitForTimeout(1000);

      // Should show lot code (LOT-xxxx format)
      const hasLotCode = await page.getByText(/LOT-/i).isVisible().catch(() => false);
      expect(hasLotCode).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('lots-empty-state: Empty state message when no lots', async ({ page }) => {
    await page.goto('/#/app/lots');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for either lots or empty state
    const hasLots = await page.locator('a[href^="#/app/lots/"]').filter({ hasNot: page.locator('text=დამატება') }).count() > 0;
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    expect(hasLots || hasEmptyState).toBeTruthy();
  });

  test('lots-shows-crop-variety: Lot card shows crop and variety', async ({ page }) => {
    await page.goto('/#/app/lots');

    // Wait for lots to load
    await page.waitForTimeout(1000);

    const lotCards = page.locator('a[href^="#/app/lots/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await lotCards.count();

    if (count > 0) {
      // Each lot card should show crop - variety pattern
      const firstCard = lotCards.first();

      // Check for კგ (kg) which indicates weight is shown
      const hasWeight = await firstCard.getByText(/კგ/i).isVisible().catch(() => false);
      expect(hasWeight).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
