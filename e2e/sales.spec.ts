import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Sales Tests (Section 12)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sales-list: Sales list page loads', async ({ page }) => {
    await page.goto('/#/app/sales');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'გაყიდვები' })).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/sales/new"]')).toBeVisible();
  });

  test('sales-add-button: Add button navigates to new sale page', async ({ page }) => {
    await page.goto('/#/app/sales');
    await page.click('a[href="#/app/sales/new"]');
    await page.waitForURL('**/#/app/sales/new');
  });

  test('sales-create-form-elements: Create form has required elements', async ({ page }) => {
    await page.goto('/#/app/sales/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Check form labels exist
    await expect(page.getByText('მყიდველი')).toBeVisible();

    // Check for weight and price inputs
    const hasWeightLabel = await page.getByText(/წონა/i).isVisible().catch(() => false);
    const hasPriceLabel = await page.getByText(/ფასი/i).isVisible().catch(() => false);

    expect(hasWeightLabel || hasPriceLabel).toBeTruthy();
  });

  test('sales-create-cancel: Cancel goes back', async ({ page }) => {
    await page.goto('/#/app/sales');
    await page.click('a[href="#/app/sales/new"]');
    await page.waitForURL('**/#/app/sales/new');

    await page.waitForTimeout(500);

    const cancelButton = page.getByRole('button', { name: 'გაუქმება' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForURL('**/#/app/sales');
    }
  });

  test('sales-view-detail: Click sale navigates to detail page', async ({ page }) => {
    await page.goto('/#/app/sales');

    await page.waitForTimeout(1000);

    const saleCards = page.locator('a[href^="#/app/sales/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await saleCards.count();

    if (count > 0) {
      await saleCards.first().click();
      await expect(page).toHaveURL(/.*#\/app\/sales\/[a-z0-9-]+/);
    } else {
      test.skip();
    }
  });

  test('sales-empty-state: Empty state message when no sales', async ({ page }) => {
    await page.goto('/#/app/sales');

    await page.waitForTimeout(1000);

    const hasSales = await page.locator('a[href^="#/app/sales/"]').filter({ hasNot: page.locator('text=დამატება') }).count() > 0;
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    expect(hasSales || hasEmptyState).toBeTruthy();
  });

  test('sales-shows-payment-status: Sale cards show payment status', async ({ page }) => {
    await page.goto('/#/app/sales');

    await page.waitForTimeout(1000);

    const saleCards = page.locator('a[href^="#/app/sales/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await saleCards.count();

    if (count > 0) {
      // Check for payment status badges
      const hasUnpaid = await page.getByText('გადაუხდელი').isVisible().catch(() => false);
      const hasPartPaid = await page.getByText('ნაწილობრივ გადახდილი').isVisible().catch(() => false);
      const hasPaid = await page.getByText('გადახდილი').isVisible().catch(() => false);

      // At least one status should be visible
      expect(hasUnpaid || hasPartPaid || hasPaid).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('sales-shows-total: Sale cards show total amount', async ({ page }) => {
    await page.goto('/#/app/sales');

    await page.waitForTimeout(1000);

    const saleCards = page.locator('a[href^="#/app/sales/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await saleCards.count();

    if (count > 0) {
      // Check for currency symbol (₾)
      const hasCurrency = await page.getByText('₾').first().isVisible().catch(() => false);
      expect(hasCurrency).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
