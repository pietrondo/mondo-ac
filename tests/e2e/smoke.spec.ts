import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('page loads and canvas is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });

  test('missing WebGL context displays the fallback overlay', async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return null;
        }
        return originalGetContext.apply(this, [type, ...args]);
      } as any;
      Object.defineProperty(window, 'WebGLRenderingContext', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    await page.goto('/');
    const overlay = page.locator('#error-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('WebGL non è supportato');
  });

  test('unhandled runtime exception triggers the error overlay', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Test unhandled runtime exception');
      }, 100);
    });

    const overlay = page.locator('#error-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('Test unhandled runtime exception');
  });
});
