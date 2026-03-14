import { test, expect } from '@playwright/test';

test.describe.serial('AI Bookmark Features', () => {
  async function createBookmark(page: import('@playwright/test').Page, title: string) {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).toBeVisible();

    await page.locator('#url').fill('https://playwright.dev/docs/intro');
    await page.waitForTimeout(1500);
    await page.locator('#title').clear();
    await page.locator('#title').fill(title);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Add Bookmark' })).not.toBeVisible({
      timeout: 3000,
    });

    const main = page.locator('main');
    await expect(main.getByText(title).first()).toBeVisible({ timeout: 5000 });
  }

  test('detail panel shows Generate Summary button when AI is configured', async ({ page }) => {
    const title = `AI-Config ${Date.now()}`;
    await createBookmark(page, title);

    // Configure AI
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    const providerCombo = main.getByRole('combobox').nth(1);
    await expect(providerCombo).toBeVisible({ timeout: 5000 });
    await providerCombo.click();
    await page.getByRole('option', { name: 'Anthropic (Claude)' }).click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Handle API key — click "Change" if already saved
    const changeButton = main.getByRole('button', { name: 'Change' });
    if (await changeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await changeButton.click();
    }
    await main.getByPlaceholder('Enter your API key').fill('sk-ant-test-placeholder');
    await main
      .locator('div')
      .filter({ hasText: 'API Key' })
      .getByRole('button', { name: 'Save' })
      .click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Verify AI settings are saved
    const aiRes = await page.request.get('/api/settings/ai');
    const aiData = await aiRes.json();
    expect(aiData.hasApiKey).toBe(true);
    expect(aiData.provider).toBe('anthropic');

    // Navigate back to bookmarks
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    const bookmarkMain = page.locator('main');
    await expect(bookmarkMain.getByText(title).first()).toBeVisible({ timeout: 5000 });

    // Open detail panel
    await bookmarkMain.getByText(title).first().click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // "Generate Summary" button should be visible since AI is configured
    // (wait longer for AI settings query to resolve in the detail panel)
    await expect(sheet.getByRole('button', { name: 'Generate Summary' })).toBeVisible({
      timeout: 10000,
    });

    // Clean up: delete bookmark
    await sheet.getByRole('button', { name: 'Delete bookmark' }).click();
    await sheet.getByRole('button', { name: 'Confirm' }).click();
    await expect(bookmarkMain.getByText(title)).not.toBeVisible({ timeout: 5000 });
  });

  test('detail panel hides Generate Summary button when AI is not configured', async ({
    page,
  }) => {
    const title = `AI-NoConfig ${Date.now()}`;
    await createBookmark(page, title);

    // Clear AI settings via API so we test the "no config" state
    await page.request.fetch('/api/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ apiKey: '', provider: null }),
    });

    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main.getByText(title).first()).toBeVisible({ timeout: 5000 });

    // Open detail panel
    await main.getByText(title).first().click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // No AI configured — button should NOT be visible
    await expect(
      sheet.getByRole('button', { name: 'Generate Summary' })
    ).not.toBeVisible();

    // Clean up
    await sheet.getByRole('button', { name: 'Delete bookmark' }).click();
    await sheet.getByRole('button', { name: 'Confirm' }).click();
  });
});
