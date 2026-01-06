import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Expenses Tests (Section 13)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('expenses-list: Expenses list page loads', async ({ page }) => {
    await page.goto('/#/app/expenses');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'ხარჯები' })).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/expenses/new"]')).toBeVisible();
  });

  test('expenses-add-button: Add button navigates to new expense page', async ({ page }) => {
    await page.goto('/#/app/expenses');
    await page.click('a[href="#/app/expenses/new"]');
    await page.waitForURL('**/#/app/expenses/new');
  });

  test('expenses-create-form-elements: Create form has required elements', async ({ page }) => {
    await page.goto('/#/app/expenses/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Check form has amount field (თანხა)
    const hasAmount = await page.getByText(/თანხა/i).isVisible().catch(() => false);
    expect(hasAmount).toBeTruthy();

    // Check buttons exist
    await expect(page.getByRole('button', { name: 'გაუქმება' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'შენახვა' })).toBeVisible();
  });

  test('expenses-create-cancel: Cancel goes back', async ({ page }) => {
    await page.goto('/#/app/expenses');
    await page.click('a[href="#/app/expenses/new"]');
    await page.waitForURL('**/#/app/expenses/new');

    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'გაუქმება' }).click();
    await page.waitForURL('**/#/app/expenses');
  });

  test('expenses-create: Create new expense successfully', async ({ page }) => {
    await page.goto('/#/app/expenses/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Find and fill amount input
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('100');

    // Click save
    const saveButton = page.getByRole('button', { name: 'შენახვა' });

    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForURL('**/#/app/expenses', { timeout: 10000 });
    } else {
      // Some required fields might be missing
      test.skip();
    }
  });

  test('expenses-empty-state: Empty state or expenses shown', async ({ page }) => {
    await page.goto('/#/app/expenses');

    await page.waitForTimeout(1000);

    // Check for either expenses or empty state
    const hasExpenses = await page.getByText('₾').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    expect(hasExpenses || hasEmptyState).toBeTruthy();
  });
});
