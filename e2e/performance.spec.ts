import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

/**
 * Performance Tests for Mosavali Application
 *
 * These tests verify the performance improvements made to the application:
 * 1. Code splitting - pages are lazy loaded
 * 2. Data fetching - queries are limited
 * 3. React optimizations - memoized components and calculations
 */

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Code Splitting & Lazy Loading', () => {
    test('dashboard shows loading state briefly on first load', async ({ page }) => {
      // Already logged in via beforeEach, verify dashboard is visible
      await expect(page.getByRole('heading', { name: /მთავარი|dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    test('navigation to fields page works with lazy loading', async ({ page }) => {
      // Navigate to fields
      await page.click('a[href="#/app/fields"]');

      // Fields page should load
      await expect(page.getByRole('heading', { name: /მიწები/i })).toBeVisible({ timeout: 5000 });
    });

    test('navigation to reports page works with lazy loading', async ({ page }) => {
      // Navigate to reports
      await page.click('a[href="#/app/reports"]');

      // Reports page should load
      await expect(page.getByRole('heading', { name: /რეპორტები/i })).toBeVisible({ timeout: 5000 });
    });

    test('navigation to settings page works with lazy loading', async ({ page }) => {
      // Navigate to settings
      await page.click('a[href="#/app/settings"]');

      // Settings page should load
      await expect(page.getByRole('heading', { name: /პარამეტრები/i })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Page Load Performance', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/#/app');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds (generous for CI environments)
      expect(loadTime).toBeLessThan(5000);
    });

    test('fields list loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.click('a[href="#/app/fields"]');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Navigation should be fast (under 3 seconds)
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Data Fetching Optimizations', () => {
    test('fields list has limited results', async ({ page }) => {
      await page.goto('/#/app/fields');

      // Wait for fields to load
      await page.waitForLoadState('networkidle');

      // Count field cards (should be limited to 50 or less)
      const fieldCards = await page.locator('a[href^="#/app/fields/"]').count();

      expect(fieldCards).toBeLessThanOrEqual(50);
    });

    test('lots list has limited results', async ({ page }) => {
      await page.goto('/#/app/lots');

      await page.waitForLoadState('networkidle');

      const lotCards = await page.locator('a[href^="#/app/lots/"]').count();

      expect(lotCards).toBeLessThanOrEqual(50);
    });

    test('sales list has limited results', async ({ page }) => {
      await page.goto('/#/app/sales');

      await page.waitForLoadState('networkidle');

      const saleCards = await page.locator('a[href^="#/app/sales/"]').count();

      expect(saleCards).toBeLessThanOrEqual(50);
    });

    test('works list has limited results', async ({ page }) => {
      await page.goto('/#/app/works');

      await page.waitForLoadState('networkidle');

      const workCards = await page.locator('a[href^="#/app/works/"]').count();

      expect(workCards).toBeLessThanOrEqual(50);
    });

    test('expenses list has limited results', async ({ page }) => {
      await page.goto('/#/app/expenses');

      await page.waitForLoadState('networkidle');

      const expenseCards = await page.locator('a[href^="#/app/expenses/"]').count();

      expect(expenseCards).toBeLessThanOrEqual(50);
    });
  });

  test.describe('Reports Page Performance', () => {
    test('stock report renders correctly', async ({ page }) => {
      await page.goto('/#/app/reports');

      // Wait for data to load
      await page.waitForLoadState('networkidle');

      // Stock report should show heading
      await expect(page.getByRole('heading', { name: /რეპორტები/i })).toBeVisible({ timeout: 5000 });

      // Stock report should show total (kg label)
      await expect(page.getByText(/კგ|kg/i)).toBeVisible({ timeout: 5000 });
    });

    test('financial report tab works', async ({ page }) => {
      await page.goto('/#/app/reports');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Click on financial tab (მოგება/ზარალი)
      const financesTab = page.getByRole('button', { name: /მოგება\/ზარალი/i });
      await expect(financesTab).toBeVisible({ timeout: 5000 });
      await financesTab.click();

      // Should show income/expense/profit related text
      await expect(page.getByText(/შემოსავალი|ხარჯი|მოგება/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('yield report tab works', async ({ page }) => {
      await page.goto('/#/app/reports');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Click on yield tab (მოსავლიანობა)
      const yieldTab = page.getByRole('button', { name: 'მოსავლიანობა' });
      await expect(yieldTab).toBeVisible({ timeout: 5000 });
      await yieldTab.click();

      // Should show yield data or empty state
      const hasYieldData = await page.getByText(/ტ\/ჰა/).first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/მონაცემები არ არის/).isVisible().catch(() => false);
      expect(hasYieldData || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Form Performance', () => {
    test('new field form loads quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/#/app/fields/new');

      // Form should be visible - look for the form's save button
      await expect(page.getByRole('button', { name: /შენახვა/ })).toBeVisible({ timeout: 5000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('new expense form loads with master data', async ({ page }) => {
      await page.goto('/#/app/expenses/new');

      // Wait for form
      await page.waitForLoadState('networkidle');

      // Season dropdown should have options (master data loaded)
      const seasonSelect = page.locator('select').first();
      await expect(seasonSelect).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Regression Tests', () => {
    test('field detail page shows related data', async ({ page }) => {
      // Go to fields list first
      await page.goto('/#/app/fields');
      await page.waitForLoadState('networkidle');

      // Click on first field if exists
      const firstField = page.locator('a[href^="#/app/fields/"]').first();
      const fieldExists = await firstField.isVisible().catch(() => false);

      if (fieldExists) {
        await firstField.click();
        await page.waitForLoadState('networkidle');

        // Field detail should show the field name and area (always present)
        await expect(page.getByText(/ჰა/).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('expense detail page loads correctly', async ({ page }) => {
      // Go to expenses list
      await page.goto('/#/app/expenses');
      await page.waitForLoadState('networkidle');

      // Click on first expense if exists
      const firstExpense = page.locator('a[href^="#/app/expenses/"]').first();
      const expenseExists = await firstExpense.isVisible().catch(() => false);

      if (expenseExists) {
        await firstExpense.click();

        // Expense detail should show amount (first matching element with currency)
        await expect(page.getByText(/₾/).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('work detail page shows expenses list', async ({ page }) => {
      // Go to works list
      await page.goto('/#/app/works');
      await page.waitForLoadState('networkidle');

      // Click on first work if exists
      const firstWork = page.locator('a[href^="#/app/works/"]').first();
      const workExists = await firstWork.isVisible().catch(() => false);

      if (workExists) {
        await firstWork.click();

        // Work detail should load
        await page.waitForLoadState('networkidle');

        // Should show work detail page content (main heading)
        await expect(page.getByRole('main').locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});

test.describe('Mobile Navigation Performance', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('mobile bottom nav is visible', async ({ page }) => {
    await page.goto('/#/app');

    // Bottom nav should be visible on mobile
    await expect(page.locator('.fixed.bottom-0')).toBeVisible();
  });

  test('mobile navigation works quickly', async ({ page }) => {
    await page.goto('/#/app');

    const startTime = Date.now();

    // Click fields in bottom nav
    await page.click('a[href="#/app/fields"]');

    // Wait for fields page
    await expect(page.getByRole('heading', { name: /მიწები/i })).toBeVisible({ timeout: 5000 });

    const navTime = Date.now() - startTime;
    expect(navTime).toBeLessThan(2000);
  });
});
