import { test, expect } from '@playwright/test';
import { TEST_USER, login } from './utils/auth';

test.describe('Authentication Tests (Section 4)', () => {

  test('auth-login-valid: Valid user can log in', async ({ page }) => {
    // App uses hash-based routing
    await page.goto('/#/login');

    // Verify login page elements
    await expect(page.locator('h1')).toContainText('მოსავალი');
    await expect(page.locator('h2')).toContainText('შესვლა');

    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to #/app
    await page.waitForURL('**/#/app', { timeout: 30000 });

    // Verify we're on dashboard - check for dashboard heading
    await expect(page.getByRole('heading', { name: 'მთავარი' })).toBeVisible();
  });

  test('auth-login-invalid-password: Invalid password shows error', async ({ page }) => {
    await page.goto('/#/login');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.bg-red-100')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.bg-red-100')).toContainText('ელფოსტა ან პაროლი არასწორია');
  });

  test('auth-login-invalid-email: Non-existent email shows error', async ({ page }) => {
    await page.goto('/#/login');

    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'anypassword123');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.bg-red-100')).toBeVisible({ timeout: 10000 });
  });

  test('auth-logout: User can log out', async ({ page }) => {
    // First login
    await login(page);

    // Find and click logout button (desktop view)
    await page.setViewportSize({ width: 1280, height: 720 });
    const logoutButton = page.locator('button:has-text("გამოსვლა")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify redirect to login
    await page.waitForURL('**/#/login', { timeout: 10000 });
  });

  test('auth-protected-route: Unauthenticated user redirected from protected routes', async ({ page }) => {
    // Clear any existing session by going to a fresh context
    await page.context().clearCookies();

    // Try to access protected route directly (hash-based)
    await page.goto('/#/app/fields');

    // Should redirect to login
    await page.waitForURL('**/#/login', { timeout: 30000 });
  });

  test('auth-session-persistence: Session persists after page reload', async ({ page }) => {
    // Login first
    await login(page);

    // Reload the page
    await page.reload();

    // Should still be on #/app (not redirected to login)
    await expect(page).toHaveURL(/.*#\/app/);
  });
});
