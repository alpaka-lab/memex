import { test, expect } from '@playwright/test';

test.describe('Bulk Actions', () => {
  test.setTimeout(60000);

  const runId = Date.now();
  const titles = [`Bulk A ${runId}`, `Bulk B ${runId}`];

  test.beforeEach(async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    // Seed 2 bookmarks via quick add
    for (const title of titles) {
      await page.keyboard.press('Meta+k');
      await expect(page.getByRole('heading', { name: 'Add Bookmark' })).toBeVisible();
      await page.locator('#url').fill(
        `https://${title.replace(/\s/g, '-').toLowerCase()}.example.com`
      );
      await page.locator('#title').fill(title);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('heading', { name: 'Add Bookmark' })).not.toBeVisible({
        timeout: 3000,
      });
    }

    const main = page.locator('main');
    await expect(main.getByText(titles[0])).toBeVisible({ timeout: 5000 });
    await expect(main.getByText(titles[1])).toBeVisible({ timeout: 5000 });
  });

  test('select multiple bookmarks and bulk archive then delete', async ({ page }) => {
    const main = page.locator('main');

    // Select first bookmark checkbox
    const card0 = main.locator('.rounded-xl.border.bg-card').filter({ hasText: titles[0] });
    await card0.hover();
    await card0.locator('button').first().click();
    await expect(page.getByText('1 selected')).toBeVisible();

    // Select second bookmark checkbox — use dispatchEvent to avoid sticky bar overlap
    const card1 = main.locator('.rounded-xl.border.bg-card').filter({ hasText: titles[1] });
    await card1.locator('button').first().dispatchEvent('click');
    await expect(page.getByText('2 selected')).toBeVisible();

    // Click Archive and wait for the API response
    const archivePromise = page.waitForResponse(
      (res) => res.url().includes('/api/bookmarks/bulk') && res.status() === 200
    );
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await archivePromise;

    // Wait for toast confirmation
    await expect(page.getByText(/archived/)).toBeVisible({ timeout: 5000 });

    // Navigate to Archive and verify they're there
    await page.getByRole('link', { name: 'Archive' }).click();
    await page.waitForLoadState('networkidle');
    await expect(main.getByText(titles[0])).toBeVisible({ timeout: 5000 });
    await expect(main.getByText(titles[1])).toBeVisible({ timeout: 5000 });

    // Select both for deletion
    const archCard0 = main.locator('.rounded-xl.border.bg-card').filter({ hasText: titles[0] });
    const archCard1 = main.locator('.rounded-xl.border.bg-card').filter({ hasText: titles[1] });
    await archCard0.hover();
    await archCard0.locator('button').first().click();
    await expect(page.getByText('1 selected')).toBeVisible();
    await archCard1.locator('button').first().dispatchEvent('click');
    await expect(page.getByText('2 selected')).toBeVisible();

    // Delete with confirmation and wait for API response
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    const deletePromise = page.waitForResponse(
      (res) => res.url().includes('/api/bookmarks/bulk') && res.status() === 200
    );
    await page.getByRole('button', { name: /Confirm/ }).click();
    await deletePromise;

    // Wait for toast success
    await expect(page.getByText(/deleted/)).toBeVisible({ timeout: 5000 });

    // Should be gone from archive page
    await expect(main.getByText(titles[0])).not.toBeVisible({ timeout: 10000 });
    await expect(main.getByText(titles[1])).not.toBeVisible({ timeout: 10000 });
  });
});
