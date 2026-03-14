import { test, expect } from '@playwright/test';

test.describe.serial('AI Settings', () => {
  test('configure AI provider and API key', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main.getByText('AI Configuration')).toBeVisible();

    // Wait for AI settings to load (provider combobox appears)
    const providerCombo = main.getByRole('combobox').nth(1);
    await expect(providerCombo).toBeVisible({ timeout: 5000 });

    // Select provider
    await providerCombo.click();
    await page.getByRole('option', { name: 'Anthropic (Claude)' }).click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Handle API key input — may need to click "Change" if key already saved
    const changeButton = main.getByRole('button', { name: 'Change' });
    const apiKeyInput = main.getByPlaceholder('Enter your API key');
    if (await changeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await changeButton.click();
    }
    await expect(apiKeyInput).toBeVisible({ timeout: 3000 });
    await apiKeyInput.fill('sk-ant-test-key-1234');

    // Click Save next to the API key input
    await main
      .locator('div')
      .filter({ hasText: 'API Key' })
      .getByRole('button', { name: 'Save' })
      .click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Verify key saved state
    await expect(main.getByText('Key saved')).toBeVisible({ timeout: 5000 });

    // Enable auto-tag toggle
    const switches = main.getByRole('switch');
    await switches.first().click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Enable auto-summary toggle
    await switches.nth(1).click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Reload and verify settings persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(main.getByText('Key saved')).toBeVisible({ timeout: 5000 });

    // Change API key
    await main.getByRole('button', { name: 'Change' }).click();
    await expect(main.getByPlaceholder('Enter your API key')).toBeVisible();
    await main.getByPlaceholder('Enter your API key').fill('sk-ant-new-key-5678');
    await main
      .locator('div')
      .filter({ hasText: 'API Key' })
      .getByRole('button', { name: 'Save' })
      .click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );
    await expect(main.getByText('Key saved')).toBeVisible({ timeout: 5000 });
  });

  test('switch between AI providers', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    const providerCombo = main.getByRole('combobox').nth(1);
    await expect(providerCombo).toBeVisible({ timeout: 5000 });

    // Should show Anthropic from previous test (raw value or label)
    await expect(providerCombo).toContainText(/anthropic/i, { timeout: 5000 });

    // Switch to OpenAI
    await providerCombo.click();
    await page.getByRole('option', { name: 'OpenAI' }).click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Switch to Gemini
    await providerCombo.click();
    await page.getByRole('option', { name: 'Google' }).click();
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/ai') && res.status() === 200
    );

    // Verify via API that the provider was persisted
    const apiRes = await page.request.get('/api/settings/ai');
    const settings = await apiRes.json();
    expect(settings.provider).toBe('gemini');

    // Reload and verify the combobox shows the saved provider
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(providerCombo).toContainText(/gemini|google/i, { timeout: 10000 });
  });
});
