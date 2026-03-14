import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated user to login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('/bookmarks');
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('login and logout flow', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    // Login
    await page.goto('/login');
    await page.locator('#email').fill('e2e@test.com');
    await page.locator('#password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/bookmarks');
    await expect(page).toHaveURL(/bookmarks/);

    // Open user menu (avatar button) and sign out
    await page.locator('button:has(.size-7.rounded-full)').click();
    await page.getByText('Sign out').click();
    await expect(page).toHaveURL(/login/);

    await context.close();
  });
});
