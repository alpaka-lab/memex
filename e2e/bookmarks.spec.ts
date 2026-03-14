import { test, expect } from '@playwright/test';

test.describe('Bookmark CRUD', () => {
  const uniqueTitle = `E2E Test ${Date.now()}`;

  test('add bookmark via quick add, star, archive, delete', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    // Open quick add modal (Cmd+K)
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).toBeVisible();

    // Fill bookmark form
    await page.locator('#url').fill('https://playwright.dev');
    await page.waitForTimeout(1500);
    await page.locator('#title').clear();
    await page.locator('#title').fill(uniqueTitle);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).not.toBeVisible({ timeout: 3000 });

    // Verify bookmark appears on page (in main content area)
    const main = page.locator('main');
    await expect(main.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });

    // Click the bookmark to open detail panel
    await main.getByText(uniqueTitle).click();

    // Star from detail panel (sheet)
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Star' }).click();
    await expect(sheet.getByRole('button', { name: 'Starred' })).toBeVisible();

    // Close detail panel
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();

    // Navigate to Starred page and verify
    await page.getByRole('link', { name: 'Starred' }).click();
    await page.waitForLoadState('networkidle');
    await expect(main.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });

    // Open detail and archive
    await main.getByText(uniqueTitle).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Archive', exact: true }).click();

    // Close detail
    await page.keyboard.press('Escape');

    // Navigate to Archive and verify
    await page.getByRole('link', { name: 'Archive' }).click();
    await page.waitForLoadState('networkidle');
    await expect(main.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });

    // Open detail and delete
    await main.getByText(uniqueTitle).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Delete bookmark' }).click();
    await sheet.getByRole('button', { name: 'Confirm' }).click();

    // Verify bookmark is gone
    await expect(main.getByText(uniqueTitle)).not.toBeVisible({ timeout: 5000 });
  });
});
