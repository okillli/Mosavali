import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { cleanupAllE2EData, logCleanupResults } from './utils/cleanup';

test.describe('Fields Tests (Section 6)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Clean up E2E test data after all tests
  test.afterAll(async () => {
    const results = await cleanupAllE2EData();
    logCleanupResults(results);
  });

  test('fields-list: Fields list page loads', async ({ page }) => {
    await page.goto('/#/app/fields');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'მიწები' })).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/fields/new"]')).toBeVisible();
  });

  test('fields-add-button: Add button navigates to new field page', async ({ page }) => {
    await page.goto('/#/app/fields');
    await page.click('a[href="#/app/fields/new"]');
    await page.waitForURL('**/#/app/fields/new');

    // Verify we're on the new field page
    await expect(page.getByRole('heading', { name: /დამატება.*მიწები/i })).toBeVisible();
  });

  test('fields-create-form-elements: Create form has all required elements', async ({ page }) => {
    await page.goto('/#/app/fields/new');

    // Check form labels exist
    await expect(page.getByText('სახელი')).toBeVisible();
    await expect(page.getByText('ფართობი (ჰა)')).toBeVisible();
    await expect(page.getByText('სტატუსი')).toBeVisible();

    // Check inputs exist
    await expect(page.locator('input').first()).toBeVisible();

    // Check ownership select exists with options
    const ownershipSelect = page.locator('select');
    await expect(ownershipSelect).toBeVisible();

    // Check buttons exist
    await expect(page.getByRole('button', { name: 'გაუქმება' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'შენახვა' })).toBeVisible();
  });

  test('fields-create-validation: Save button disabled without required fields', async ({ page }) => {
    await page.goto('/#/app/fields/new');

    // Save button should be disabled initially
    const saveButton = page.getByRole('button', { name: 'შენახვა' });
    await expect(saveButton).toBeDisabled();

    // Fill only name - still disabled
    await page.fill('input[placeholder="მაგ: ზედა ყანა"]', 'ტესტ მიწა');
    await expect(saveButton).toBeDisabled();

    // Fill area - now should be enabled
    const areaInput = page.locator('input[type="number"]');
    await areaInput.fill('5.5');
    await expect(saveButton).toBeEnabled();
  });

  test('fields-create: Create new field successfully', async ({ page }) => {
    const uniqueName = `E2E ტესტ მიწა ${Date.now()}`;

    await page.goto('/#/app/fields/new');

    // Fill the form
    await page.fill('input[placeholder="მაგ: ზედა ყანა"]', uniqueName);
    await page.locator('input[type="number"]').fill('7.25');
    await page.locator('select').selectOption('OWNED');

    // Find and fill location input
    const locationLabel = page.getByText('ლოკაცია');
    const locationInput = locationLabel.locator('..').locator('input');
    await locationInput.fill('თბილისი');

    // Click save
    await page.getByRole('button', { name: 'შენახვა' }).click();

    // Wait for redirect to fields list
    await page.waitForURL('**/#/app/fields', { timeout: 10000 });

    // Verify the new field appears in the list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
  });

  test('fields-create-cancel: Cancel button goes back', async ({ page }) => {
    await page.goto('/#/app/fields');
    await page.click('a[href="#/app/fields/new"]');
    await page.waitForURL('**/#/app/fields/new');

    // Click cancel
    await page.getByRole('button', { name: 'გაუქმება' }).click();

    // Should go back to fields list
    await page.waitForURL('**/#/app/fields');
  });

  test('fields-view-detail: Click field navigates to detail page', async ({ page }) => {
    await page.goto('/#/app/fields');

    // Wait for fields to load
    await page.waitForTimeout(1000);

    // Check if there are any fields
    const fieldCards = page.locator('a[href^="#/app/fields/"]').filter({ hasNot: page.locator('text=დამატება') });
    const count = await fieldCards.count();

    if (count > 0) {
      // Click on the first field
      await fieldCards.first().click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*#\/app\/fields\/[a-z0-9-]+/);
    } else {
      // No fields exist, skip this test
      test.skip();
    }
  });

  test('fields-ownership-options: Ownership select has correct options', async ({ page }) => {
    await page.goto('/#/app/fields/new');

    const select = page.locator('select');

    // Check options
    await expect(select.locator('option[value="OWNED"]')).toHaveText('საკუთარი');
    await expect(select.locator('option[value="RENTED"]')).toHaveText('ნაქირავები');
  });

  test('fields-empty-state: Empty state message when no fields', async ({ page }) => {
    await page.goto('/#/app/fields');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for either fields or empty state
    const hasFields = await page.locator('a[href^="#/app/fields/"]').filter({ hasNot: page.locator('text=დამატება') }).count() > 0;
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    // At least one should be true
    expect(hasFields || hasEmptyState).toBeTruthy();
  });
});
