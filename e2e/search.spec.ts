import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  const runId = Date.now();
  const uniqueTitle = `Searchable Memo ${runId}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    // Seed a bookmark with a unique title for searching
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).toBeVisible();
    await page.locator('#url').fill('https://search-test.example.com');
    await page.locator('#title').fill(uniqueTitle);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).not.toBeVisible({
      timeout: 3000,
    });

    await expect(page.locator('main').getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
  });

  test('search returns matching bookmarks and opens detail', async ({ page }) => {
    // Navigate to search page via full page load (avoids HMR issues)
    await page.goto('/search');
    await page.waitForLoadState('load');

    // If there's an application error (HMR), reload
    const hasError = await page
      .getByText('Application error')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (hasError) {
      await page.reload();
      await page.waitForLoadState('load');
    }

    // There are 2 inputs with this placeholder (header + page), use the one in main
    const pageSearchInput = page.locator('main').getByPlaceholder('Search bookmarks...');
    await pageSearchInput.fill('Searchable');

    // Wait for debounce (300ms) + API fetch
    await page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.status() === 200,
      { timeout: 10000 }
    );

    const main = page.locator('main');

    // Result should contain our bookmark
    await expect(main.getByText(uniqueTitle).first()).toBeVisible({ timeout: 5000 });

    // Click on the result to open detail panel
    await main.getByText(uniqueTitle).first().click();

    // Detail panel should show bookmark info
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('search-test.example.com').first()).toBeVisible();

    // Clean up — delete from detail panel
    await sheet.getByRole('button', { name: 'Delete bookmark' }).click();
    await sheet.getByRole('button', { name: 'Confirm' }).click();
  });
});
