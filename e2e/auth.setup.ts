import { test as setup, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e@test.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'E2E Test User';

setup('register and authenticate', async ({ page }) => {
  // Try to register a test user
  await page.goto('/register');

  // If already logged in, middleware redirects to /bookmarks
  if (page.url().includes('/bookmarks')) {
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
    return;
  }

  await page.locator('#name').fill(TEST_NAME);
  await page.locator('#email').fill(TEST_EMAIL);
  await page.locator('#password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Wait for either: redirect to /bookmarks OR error message appears
  await Promise.race([
    expect(page).toHaveURL(/bookmarks/, { timeout: 10000 }),
    page.locator('.bg-destructive\\/10').waitFor({ timeout: 10000 }),
  ]);

  // If error appeared (user already exists), login instead
  if (!page.url().includes('/bookmarks')) {
    await page.goto('/login');
    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/bookmarks/, { timeout: 10000 });
  }

  await expect(page).toHaveURL(/bookmarks/);
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
