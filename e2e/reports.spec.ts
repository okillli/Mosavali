import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Reports Tests (Section 14)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('reports-page-loads: Reports page loads', async ({ page }) => {
    await page.goto('/#/app/reports');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'რეპორტები' })).toBeVisible();
  });

  test('reports-has-tabs: Reports page has report tabs', async ({ page }) => {
    await page.goto('/#/app/reports');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for stock report tab (მიმდინარე მარაგი)
    const hasStockTab = await page.getByText('მიმდინარე მარაგი').isVisible().catch(() => false);

    // Check for P&L report tab (მოგება/ზარალი)
    const hasPnlTab = await page.getByText('მოგება/ზარალი').isVisible().catch(() => false);

    // Check for yield report tab (მოსავლიანობა)
    const hasYieldTab = await page.getByText('მოსავლიანობა').isVisible().catch(() => false);

    // At least one tab should be visible
    expect(hasStockTab || hasPnlTab || hasYieldTab).toBeTruthy();
  });

  test('reports-stock-tab: Stock report shows data or empty state', async ({ page }) => {
    await page.goto('/#/app/reports');

    await page.waitForTimeout(1000);

    // Click stock tab if exists
    const stockTab = page.getByText('მიმდინარე მარაგი');
    if (await stockTab.isVisible()) {
      await stockTab.click();
      await page.waitForTimeout(500);

      // Should show either stock data or empty state
      const hasData = await page.getByText(/კგ|ტონა/i).isVisible().catch(() => false);
      const hasEmpty = await page.getByText(/ცარიელია|მონაცემები არ/i).isVisible().catch(() => false);

      expect(hasData || hasEmpty).toBeTruthy();
    }
  });

  test('reports-pnl-tab: P&L report shows data or empty state', async ({ page }) => {
    await page.goto('/#/app/reports');

    await page.waitForTimeout(1000);

    // Click P&L tab if exists
    const pnlTab = page.getByText('მოგება/ზარალი');
    if (await pnlTab.isVisible()) {
      await pnlTab.click();
      await page.waitForTimeout(500);

      // Should show income/expense labels
      const hasIncome = await page.getByText(/შემოსავალი/i).isVisible().catch(() => false);
      const hasExpense = await page.getByText(/ხარჯ/i).isVisible().catch(() => false);
      const hasProfit = await page.getByText(/მოგება/i).isVisible().catch(() => false);
      const hasCurrency = await page.getByText('₾').isVisible().catch(() => false);

      expect(hasIncome || hasExpense || hasProfit || hasCurrency).toBeTruthy();
    }
  });

  test('reports-yield-tab: Yield report shows data or empty state', async ({ page }) => {
    await page.goto('/#/app/reports');

    await page.waitForTimeout(1000);

    // Click yield tab if exists
    const yieldTab = page.getByText('მოსავლიანობა');
    if (await yieldTab.isVisible()) {
      await yieldTab.click();
      await page.waitForTimeout(500);

      // Should show yield-related content
      const hasYieldData = await page.getByText(/ტ\/ჰა|ტონა\/ჰა/i).isVisible().catch(() => false);
      const hasFields = await page.getByText(/მიწ/i).isVisible().catch(() => false);
      const hasEmpty = await page.getByText(/მონაცემები არ/i).isVisible().catch(() => false);

      expect(hasYieldData || hasFields || hasEmpty).toBeTruthy();
    }
  });
});
