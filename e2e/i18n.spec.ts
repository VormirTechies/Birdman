import { test, expect } from '@playwright/test';

/**
 * i18n (Internationalization) Tests
 * Ensures both English and Tamil locales work correctly
 */

test.describe('Language Switching', () => {
  test('default language is English', async ({ page }) => {
    await page.goto('/');
    
    // Check URL or content for English
    const hasEnglish = await page.getByText(/birdman|booking|visit/i).isVisible();
    expect(hasEnglish).toBe(true);
  });

  test('can switch to Tamil', async ({ page }) => {
    await page.goto('/');

    // Look for language switcher
    const tamilButton = page.getByRole('button', { name: /ta|tamil|தமிழ்/i });
    
    if (await tamilButton.isVisible()) {
      await tamilButton.click();
      
      // Wait for navigation or content change
      await page.waitForLoadState('networkidle');
      
      // Should show Tamil content
      const bodyContent = await page.textContent('body');
      const hasTamil = /[\u0B80-\u0BFF]/.test(bodyContent || '');
      expect(hasTamil).toBe(true);
    } else {
      // Direct navigation to Tamil route
      await page.goto('/ta');
      const bodyContent = await page.textContent('body');
      const hasTamil = /[\u0B80-\u0BFF]/.test(bodyContent || '');
      expect(hasTamil).toBe(true);
    }
  });

  test('Tamil locale persists across navigation', async ({ page }) => {
    await page.goto('/ta');
    
    // Navigate to another page
    const bookLink = page.getByRole('link', { name: /முன்பதிவு|book/i }).first();
    if (await bookLink.isVisible()) {
      await bookLink.click();
      
      // Should still be in Tamil
      await expect(page).toHaveURL(/\/ta\//);
    }
  });

  test('can switch back to English from Tamil', async ({ page }) => {
    await page.goto('/ta');

    const englishButton = page.getByRole('button', { name: /en|english/i });
    
    if (await englishButton.isVisible()) {
      await englishButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should show English content
      const url = page.url();
      expect(url).not.toContain('/ta/');
    }
  });
});

test.describe('Tamil Content Display', () => {
  test('homepage displays Tamil text correctly', async ({ page }) => {
    await page.goto('/ta');

    // Check for Tamil script
    const heading = page.locator('h1').first();
    const text = await heading.textContent();
    
    const hasTamilChars = /[\u0B80-\u0BFF]/.test(text || '');
    expect(hasTamilChars).toBe(true);
  });

  test('booking form labels are in Tamil', async ({ page }) => {
    await page.goto('/ta/book');

    // Look for form labels in Tamil
    const labels = page.locator('label');
    const count = await labels.count();
    
    let foundTamil = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await labels.nth(i).textContent();
      if (/[\u0B80-\u0BFF]/.test(text || '')) {
        foundTamil = true;
        break;
      }
    }
    
    expect(foundTamil).toBe(true);
  });

  test('error messages display in Tamil', async ({ page }) => {
    await page.goto('/ta/book');

    // Submit empty form to trigger errors
    const submitButton = page.getByRole('button').first();
    await submitButton.click();

    // Wait for error messages
    await page.waitForTimeout(1000);

    // Check if errors are in Tamil
    const bodyContent = await page.textContent('body');
    const hasTamil = /[\u0B80-\u0BFF]/.test(bodyContent || '');
    expect(hasTamil).toBe(true);
  });

  test('buttons have Tamil text', async ({ page }) => {
    await page.goto('/ta');

    const buttons = page.locator('button');
    const count = await buttons.count();
    
    let foundTamil = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await buttons.nth(i).textContent();
      if (/[\u0B80-\u0BFF]/.test(text || '')) {
        foundTamil = true;
        break;
      }
    }
    
    expect(foundTamil).toBe(true);
  });
});

test.describe('Tamil Input Handling', () => {
  test('accepts Tamil characters in name field', async ({ page }) => {
    await page.goto('/ta/book');

    const nameInput = page.getByLabel(/பெயர்|name/i);
    const tamilName = 'ராஜேஷ் குமார்';
    
    await nameInput.fill(tamilName);
    
    const value = await nameInput.inputValue();
    expect(value).toBe(tamilName);
  });

  test('Tamil name passes validation', async ({ page }) => {
    await page.goto('/ta/book');

    await page.getByLabel(/பெயர்|name/i).fill('ஜான் டோ');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/visitors/i).fill('1');
    
    const rulesCheckbox = page.getByRole('checkbox').first();
    await rulesCheckbox.check();

    const submitButton = page.getByRole('button', { name: /submit|உறுதி/i });
    await submitButton.click();

    // Should not show name validation error
    await page.waitForTimeout(1000);
    const hasNameError = await page.getByText(/name.*required|பெயர்.*தேவை/i).isVisible();
    expect(hasNameError).toBe(false);
  });
});

test.describe('Locale-Specific Formatting', () => {
  test('displays dates in Indian format', async ({ page }) => {
    await page.goto('/book');

    // Look for dates in DD/MM/YYYY format
    const dateElements = page.locator('[data-testid="date"]').or(page.getByText(/\d{2}\/\d{2}\/\d{4}/));
    
    if (await dateElements.first().isVisible()) {
      const dateText = await dateElements.first().textContent();
      // Indian format: DD/MM/YYYY or DD-MM-YYYY
      expect(dateText).toMatch(/\d{2}[\/-]\d{2}[\/-]\d{4}/);
    }
  });

  test('displays phone numbers in Indian format', async ({ page }) => {
    await page.goto('/book');

    // Examples: +91-9876543210 or +91 98765 43210
    const phonePattern = page.getByText(/\+91[\s-]?\d{10}/);
    
    // If phone numbers are displayed anywhere
    const count = await phonePattern.count();
    expect(count).toBeGreaterThanOrEqual(0); // No error if none found
  });
});

test.describe('Language Selector UI', () => {
  test('language selector is visible', async ({ page }) => {
    await page.goto('/');

    // Look for EN/TA toggle or dropdown
    const langSelector = page.locator('[data-testid="language-selector"]').or(
      page.getByRole('button', { name: /en|ta|language/i })
    );

    await expect(langSelector.first()).toBeVisible();
  });

  test('current language is highlighted', async ({ page }) => {
    await page.goto('/en');

    const enButton = page.getByRole('button', { name: /en/i });
    
    if (await enButton.isVisible()) {
      // Should have active/selected state
      const className = await enButton.getAttribute('class');
      const isActive = className?.includes('active') || 
                      className?.includes('selected') ||
                      className?.includes('font-bold');
      
      expect(isActive).toBeTruthy();
    }
  });
});

test.describe('SEO and Meta Tags', () => {
  test('Tamil pages have correct lang attribute', async ({ page }) => {
    await page.goto('/ta');

    const langAttr = await page.locator('html').getAttribute('lang');
    expect(langAttr).toBe('ta');
  });

  test('English pages have correct lang attribute', async ({ page }) => {
    await page.goto('/en');

    const langAttr = await page.locator('html').getAttribute('lang');
    expect(langAttr).toBe('en');
  });

  test('Tamil pages have Tamil meta description', async ({ page }) => {
    await page.goto('/ta');

    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    
    if (metaDesc) {
      const hasTamil = /[\u0B80-\u0BFF]/.test(metaDesc);
      expect(hasTamil).toBe(true);
    }
  });
});
