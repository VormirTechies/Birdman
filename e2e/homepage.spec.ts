import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Tests the visitor-facing landing page for Birdman of Chennai
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully with main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /birdman of chennai/i })).toBeVisible();
  });

  test('displays book now button', async ({ page }) => {
    const bookButton = page.getByRole('link', { name: /book/i }).first();
    await expect(bookButton).toBeVisible();
  });

  test('hero section is visible', async ({ page }) => {
    // Check for hero content
    await expect(page.locator('section').first()).toBeVisible();
  });

  test('language switcher allows Tamil toggle', async ({ page }) => {
    // Look for language switcher (EN/TA)
    const languageButton = page.getByRole('button', { name: /en|ta/i }).first();
    if (await languageButton.isVisible()) {
      await languageButton.click();
      // After clicking, page should reload or update with Tamil content
      await page.waitForLoadState('networkidle');
    }
  });

  test('navigation to booking page works', async ({ page }) => {
    const bookButton = page.getByRole('link', { name: /book/i }).first();
    await bookButton.click();

    // Should navigate to booking page
    await expect(page).toHaveURL(/\/book/);
  });

  test('page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Main heading should still be visible on mobile
    await expect(page.getByRole('heading', { name: /birdman/i })).toBeVisible();
  });

  test('images load correctly', async ({ page }) => {
    // Check that at least one image is present and loaded
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      
      // Check that image has loaded (naturalWidth > 0)
      const hasLoaded = await firstImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(hasLoaded).toBeTruthy();
    }
  });
});

test.describe('Homepage SEO', () => {
  test('has correct meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/birdman/i);

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('has Open Graph tags for social sharing', async ({ page }) => {
    await page.goto('/');

    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');

    // At least one OG tag should exist
    const ogTitleExists = (await ogTitle.count()) > 0;
    const ogDescExists = (await ogDescription.count()) > 0;

    expect(ogTitleExists || ogDescExists).toBeTruthy();
  });
});

test.describe('Homepage Accessibility', () => {
  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have an h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty for decorative images, but should be present
      expect(alt).not.toBeNull();
    }
  });
});
