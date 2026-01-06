import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'elizbar.55@gmail.com',
  password: '10091955',
};

export async function login(page: Page) {
  // App uses hash-based routing: /#/login, /#/app
  await page.goto('/#/login');

  // Wait for the email input to be visible and enabled
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });

  await emailInput.fill(TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to #/app
  await page.waitForURL('**/#/app', { timeout: 30000 });
}

export async function logout(page: Page) {
  // Click logout button (desktop sidebar)
  const logoutButton = page.locator('button:has-text("გამოსვლა")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/#/login', { timeout: 10000 });
  }
}

// Helper to navigate to a hash route
export async function navigateTo(page: Page, path: string) {
  await page.goto(`/#${path}`);
}
