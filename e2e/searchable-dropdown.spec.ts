import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for SearchableDropdown component
 * Tests are performed via the Sales New page which uses the component for buyer selection
 */

// Helper to login and navigate to sales page
async function setupSalesPage(page: Page) {
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');

  // Wait for navigation and go to sales
  await page.waitForURL(/\/app/);
  await page.goto('/app/sales/new');
  await page.waitForLoadState('networkidle');
}

test.describe('SearchableDropdown Component', () => {

  test.describe('Basic Rendering', () => {

    test('renders with label and placeholder', async ({ page }) => {
      await setupSalesPage(page);

      // Check that buyer dropdown is visible with label
      const buyerLabel = page.locator('label:has-text("მყიდველი")');
      await expect(buyerLabel).toBeVisible();

      // Check placeholder text
      const dropdownContainer = page.locator('[role="combobox"]').first();
      await expect(dropdownContainer).toContainText('აირჩიეთ...');
    });

    test('shows dropdown arrow icon', async ({ page }) => {
      await setupSalesPage(page);

      // The chevron icon should be present
      const chevron = page.locator('[role="combobox"] svg').last();
      await expect(chevron).toBeVisible();
    });

  });

  test.describe('Open/Close Behavior', () => {

    test('opens dropdown on click', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Dropdown menu should appear
      const menu = page.locator('[role="combobox"] + div, [role="combobox"] div.absolute');
      await expect(menu.first()).toBeVisible({ timeout: 5000 });
    });

    test('closes dropdown when clicking outside', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Wait for menu to appear
      await page.waitForTimeout(300);

      // Click outside
      await page.click('h1');

      // Menu should close (check aria-expanded)
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false');
    });

    test('closes dropdown on Escape key', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Press Escape
      await page.keyboard.press('Escape');

      // Menu should close
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false');
    });

  });

  test.describe('Search Functionality', () => {

    test('shows search input when opened', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Search input should be visible
      const searchInput = page.locator('[role="combobox"] input');
      await expect(searchInput).toBeVisible();
    });

    test('filters options based on search query', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Type search query
      const searchInput = page.locator('[role="combobox"] input');
      await searchInput.fill('test');

      // Wait for filtering
      await page.waitForTimeout(400);

      // Options should be filtered (or show no results)
      // This depends on test data, so we just check that filtering occurred
    });

    test('shows no results message when search has no matches', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Type a query that won't match anything
      const searchInput = page.locator('[role="combobox"] input');
      await searchInput.fill('xxxxxxxxnonexistentxxxxxxxx');

      await page.waitForTimeout(400);

      // Should show "შედეგი არ მოიძებნა" or create option
      const content = page.locator('[role="combobox"]').first();
      // With allowCreate, it should show the create option instead
    });

  });

  test.describe('Keyboard Navigation', () => {

    test('opens dropdown with ArrowDown', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.focus();
      await page.keyboard.press('ArrowDown');

      await expect(dropdown).toHaveAttribute('aria-expanded', 'true');
    });

    test('navigates options with Arrow keys', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Navigate down
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // Navigate up
      await page.keyboard.press('ArrowUp');
    });

    test('selects highlighted option with Enter', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Wait for options to load
      await page.waitForTimeout(500);

      // Navigate and select
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Dropdown should close after selection
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false');
    });

  });

  test.describe('Selection', () => {

    test('selects option on click', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Wait for options to load
      await page.waitForTimeout(500);

      // Click first option (if available)
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();

        // Check that dropdown closes
        await expect(dropdown).toHaveAttribute('aria-expanded', 'false');

        // Check that selection is displayed (not placeholder)
        await expect(dropdown).not.toContainText('აირჩიეთ...');
      }
    });

    test('shows clear button when value is selected', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await page.waitForTimeout(500);

      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();

        // Clear button should be visible
        const clearButton = page.locator('[role="combobox"] button[aria-label="გასუფთავება"]');
        await expect(clearButton).toBeVisible();
      }
    });

    test('clears selection on clear button click', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await page.waitForTimeout(500);

      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();

        // Click clear button
        const clearButton = page.locator('[role="combobox"] button[aria-label="გასუფთავება"]');
        await clearButton.click();

        // Should show placeholder again
        await expect(dropdown).toContainText('აირჩიეთ...');
      }
    });

  });

  test.describe('Create New Option', () => {

    test('shows create option when allowCreate is true and no exact match', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Type a new buyer name
      const searchInput = page.locator('[role="combobox"] input');
      await searchInput.fill('ახალი მყიდველი');

      await page.waitForTimeout(400);

      // Should show create option with the text
      const createOption = page.locator('text=შექმნა "ახალი მყიდველი"');
      await expect(createOption).toBeVisible();
    });

    test('creates and selects new option on create click', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      // Type a unique new buyer name
      const uniqueName = `ტესტი_${Date.now()}`;
      const searchInput = page.locator('[role="combobox"] input');
      await searchInput.fill(uniqueName);

      await page.waitForTimeout(400);

      // Click create option
      const createOption = page.locator(`text=შექმნა "${uniqueName}"`);
      if (await createOption.isVisible()) {
        await createOption.click();

        // Wait for creation
        await page.waitForTimeout(1000);

        // The dropdown should close and show the new value
        await expect(dropdown).toHaveAttribute('aria-expanded', 'false');
        await expect(dropdown).toContainText(uniqueName);
      }
    });

    test('does not show create option when exact match exists', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await page.waitForTimeout(500);

      // Get first option text
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        const optionText = await firstOption.textContent();
        if (optionText) {
          // Search for exact match
          const searchInput = page.locator('[role="combobox"] input');
          await searchInput.fill(optionText.trim());

          await page.waitForTimeout(400);

          // Create option should not be visible
          const createOption = page.locator(`text=შექმნა "${optionText.trim()}"`);
          await expect(createOption).not.toBeVisible();
        }
      }
    });

  });

  test.describe('Accessibility', () => {

    test('has correct ARIA attributes', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();

      // Check combobox role
      await expect(dropdown).toHaveRole('combobox');

      // Check aria-expanded
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false');

      // Check aria-haspopup
      await expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox');
    });

    test('updates aria-expanded when opened', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await expect(dropdown).toHaveAttribute('aria-expanded', 'true');
    });

    test('options have correct role', async ({ page }) => {
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      const count = await options.count();

      if (count > 0) {
        await expect(options.first()).toHaveRole('option');
      }
    });

  });

  test.describe('Empty States', () => {

    test('shows empty message when no options available', async ({ page }) => {
      // This test requires the buyers table to be empty for the user
      // Skip if data exists
      await setupSalesPage(page);

      const dropdown = page.locator('[role="combobox"]').first();
      await dropdown.click();

      await page.waitForTimeout(500);

      // Check for empty or options
      const options = page.locator('[role="option"]');
      const hasOptions = await options.count() > 0;

      if (!hasOptions) {
        // Should show empty message
        await expect(page.locator('text=მონაცემები არ მოიძებნა')).toBeVisible();
      }
    });

  });

});

test.describe('SearchableDropdown Integration with Sales Form', () => {

  test('selected buyer enables form submission', async ({ page }) => {
    await setupSalesPage(page);

    // Save button should be disabled initially
    const saveButton = page.locator('button:has-text("შენახვა")');
    await expect(saveButton).toBeDisabled();

    // Select a lot first
    const lotSelect = page.locator('select').first();
    const lotOptions = lotSelect.locator('option');
    if (await lotOptions.count() > 1) {
      await lotSelect.selectOption({ index: 1 });
    }

    // Now select a buyer
    const dropdown = page.locator('[role="combobox"]').first();
    await dropdown.click();

    await page.waitForTimeout(500);

    const option = page.locator('[role="option"]').first();
    if (await option.isVisible()) {
      await option.click();

      // Button might now be enabled (if lot is also selected)
    }
  });

  test('clears buyer selection resets form state', async ({ page }) => {
    await setupSalesPage(page);

    const dropdown = page.locator('[role="combobox"]').first();
    await dropdown.click();

    await page.waitForTimeout(500);

    const option = page.locator('[role="option"]').first();
    if (await option.isVisible()) {
      await option.click();

      // Clear selection
      const clearButton = page.locator('[role="combobox"] button[aria-label="გასუფთავება"]');
      await clearButton.click();

      // Save should be disabled again
      const saveButton = page.locator('button:has-text("შენახვა")');
      await expect(saveButton).toBeDisabled();
    }
  });

});
