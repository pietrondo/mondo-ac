import { test, expect } from '@playwright/test';

test.describe('Start Overlay', () => {
  test('clicking start overlay dismisses it', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const overlay = page.locator('div', { hasText: 'Clicca per iniziare' });
    await expect(overlay).toBeVisible();

    await overlay.click();
    await page.waitForTimeout(500);

    await expect(overlay).not.toBeVisible();
  });

  test('no console errors on start', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const overlay = page.locator('div', { hasText: 'Clicca per iniziare' });
    await overlay.click();
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('pointer lock rejection displays warning', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const overlay = page.locator('div', { hasText: 'Clicca per iniziare' });
    await overlay.click();

    // Trigger pointerlockerror event manually in the browser context
    await page.evaluate(() => {
      const event = new Event('pointerlockerror');
      document.dispatchEvent(event);
    });

    const warning = page.locator('#pointer-lock-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Cattura del mouse fallita');
  });
});
