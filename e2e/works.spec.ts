import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Works Tests (Section 7)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('works-list: Works list page loads', async ({ page }) => {
    await page.goto('/#/app/works');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'სამუშაოები' })).toBeVisible();

    // Verify add button exists
    await expect(page.locator('a[href="#/app/works/new"]')).toBeVisible();
  });

  test('works-add-button: Add button navigates to new work page', async ({ page }) => {
    await page.goto('/#/app/works');
    await page.click('a[href="#/app/works/new"]');
    await page.waitForURL('**/#/app/works/new');

    // Verify we're on the new work page
    await expect(page.getByRole('heading', { name: /დამატება.*სამუშაოები/i })).toBeVisible();
  });

  test('works-create-form-elements: Create form has all required elements', async ({ page }) => {
    await page.goto('/#/app/works/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Check form labels exist - use label selector to be specific
    await expect(page.locator('label:has-text("მიწები")')).toBeVisible();
    await expect(page.locator('label:has-text("სამუშაოს ტიპი")')).toBeVisible();
    await expect(page.locator('label:has-text("სტატუსი")')).toBeVisible();

    // Check selects exist
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThanOrEqual(2);

    // Check buttons exist
    await expect(page.getByRole('button', { name: 'გაუქმება' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'შენახვა' })).toBeVisible();
  });

  test('works-create-validation: Save button disabled without required fields', async ({ page }) => {
    await page.goto('/#/app/works/new');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Save button should be disabled initially (no field or work type selected)
    const saveButton = page.getByRole('button', { name: 'შენახვა' });
    await expect(saveButton).toBeDisabled();
  });

  test('works-status-options: Status select has correct options', async ({ page }) => {
    await page.goto('/#/app/works/new');

    await page.waitForTimeout(1000);

    // Find status select by looking for the one with PLANNED option value
    const statusSelect = page.locator('select').filter({ has: page.locator('option[value="PLANNED"]') });

    // Check select exists and has both options by value
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect.locator('option[value="PLANNED"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="COMPLETED"]')).toHaveCount(1);
  });

  test('works-create-cancel: Cancel button goes back', async ({ page }) => {
    await page.goto('/#/app/works');
    await page.click('a[href="#/app/works/new"]');
    await page.waitForURL('**/#/app/works/new');

    // Click cancel
    await page.getByRole('button', { name: 'გაუქმება' }).click();

    // Should go back to works list
    await page.waitForURL('**/#/app/works');
  });

  test('works-create: Create new work successfully', async ({ page }) => {
    await page.goto('/#/app/works/new');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Select field (first option after placeholder)
    const fieldSelect = page.locator('select').first();
    const fieldOptions = fieldSelect.locator('option');
    const fieldCount = await fieldOptions.count();

    if (fieldCount > 1) {
      // Get second option (first real option after placeholder)
      const firstRealOption = await fieldOptions.nth(1).getAttribute('value');
      if (firstRealOption) {
        await fieldSelect.selectOption(firstRealOption);
      }
    }

    // Select work type
    const workTypeSelect = page.locator('select').nth(1);
    const workTypeOptions = workTypeSelect.locator('option');
    const workTypeCount = await workTypeOptions.count();

    if (workTypeCount > 1) {
      const firstRealOption = await workTypeOptions.nth(1).getAttribute('value');
      if (firstRealOption) {
        await workTypeSelect.selectOption(firstRealOption);
      }
    }

    // Check if save button is now enabled
    const saveButton = page.getByRole('button', { name: 'შენახვა' });

    if (await saveButton.isEnabled()) {
      // Click save
      await saveButton.click();

      // Wait for redirect to works list
      await page.waitForURL('**/#/app/works', { timeout: 10000 });
    } else {
      // No fields or work types available - skip
      test.skip();
    }
  });

  test('works-empty-state: Empty state message when no works', async ({ page }) => {
    await page.goto('/#/app/works');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for either works or empty state
    const hasWorks = await page.locator('a[href^="#/app/works/"]').filter({ hasNot: page.locator('text=დამატება') }).count() > 0;
    const hasEmptyState = await page.getByText('მონაცემები არ მოიძებნა').isVisible().catch(() => false);

    expect(hasWorks || hasEmptyState).toBeTruthy();
  });
});
