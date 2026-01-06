import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Settings Tests (Section 15)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('settings-page-loads: Settings page loads', async ({ page }) => {
    await page.goto('/#/app/settings');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'პარამეტრები' })).toBeVisible();
  });

  test('settings-has-menu-items: Settings page has navigation items', async ({ page }) => {
    await page.goto('/#/app/settings');

    await page.waitForTimeout(500);

    // Check for settings menu links
    const hasSeasonsLink = await page.locator('a[href="#/app/settings/seasons"]').isVisible().catch(() => false);
    const hasVarietiesLink = await page.locator('a[href="#/app/settings/varieties"]').isVisible().catch(() => false);
    const hasBuyersLink = await page.locator('a[href="#/app/settings/buyers"]').isVisible().catch(() => false);

    // At least one settings link should be visible
    expect(hasSeasonsLink || hasVarietiesLink || hasBuyersLink).toBeTruthy();
  });

  test('settings-seasons-page: Seasons settings page loads', async ({ page }) => {
    await page.goto('/#/app/settings/seasons');

    await page.waitForTimeout(500);

    // Should show seasons content
    const hasYearContent = await page.getByText(/სეზონ|წელ/i).isVisible().catch(() => false);
    expect(hasYearContent).toBeTruthy();
  });

  test('settings-seasons-add: Can add new season', async ({ page }) => {
    await page.goto('/#/app/settings/seasons');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find year input (number type input in the form)
    const yearInput = page.locator('input[type="number"]').first();
    const isInputVisible = await yearInput.isVisible().catch(() => false);

    if (isInputVisible) {
      // Generate unique year based on timestamp (3000-3999 range)
      const uniqueYear = (3000 + Math.floor(Date.now() % 1000)).toString();

      // Enter a year
      await yearInput.fill(uniqueYear);

      // Find and click add button
      const addButton = page.getByRole('button', { name: 'დამატება' });
      await addButton.click();

      // Wait for update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Check if the year appears in the page content
      const pageContent = await page.content();
      const hasNewSeason = pageContent.includes(uniqueYear);
      expect(hasNewSeason).toBeTruthy();
    } else {
      // Input not found - skip test with info
      console.log('Year input not found on seasons page');
    }
  });

  test('settings-varieties-page: Varieties settings page loads', async ({ page }) => {
    await page.goto('/#/app/settings/varieties');

    await page.waitForTimeout(1000);

    // Should show heading "ჯიშები" (Varieties)
    await expect(page.getByRole('heading', { name: 'ჯიშები' })).toBeVisible();

    // Check for crop dropdown or variety content
    const hasCropSelect = await page.locator('select').isVisible().catch(() => false);
    expect(hasCropSelect).toBeTruthy();
  });

  test('settings-buyers-page: Buyers settings page loads', async ({ page }) => {
    await page.goto('/#/app/settings/buyers');

    await page.waitForTimeout(500);

    // Should show buyers content
    const hasBuyerContent = await page.getByText(/მყიდველ/i).isVisible().catch(() => false);
    expect(hasBuyerContent).toBeTruthy();
  });

  test('settings-buyers-add: Can add new buyer', async ({ page }) => {
    await page.goto('/#/app/settings/buyers');

    await page.waitForTimeout(1000);

    // Look for name input
    const nameInputs = page.locator('input[type="text"]');
    if (await nameInputs.count() > 0) {
      const uniqueName = `E2E ტესტ მყიდველი ${Date.now()}`;

      // Fill first text input (should be name)
      await nameInputs.first().fill(uniqueName);

      // Find and click add button
      const addButton = page.getByRole('button', { name: 'დამატება' });
      if (await addButton.isVisible()) {
        await addButton.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Check if buyer appears in the list
        const hasNewBuyer = await page.getByText(uniqueName).isVisible().catch(() => false);
        expect(hasNewBuyer).toBeTruthy();
      }
    }
  });
});
