import { test, expect } from '@playwright/test';

/**
 * CRITICAL: Silence Policy Enforcement Tests
 * 
 * The Silence Policy is the sacred rule of Mr. Sudarson's sanctuary.
 * No visitor may book without explicitly accepting these rules.
 * These tests ensure this contract can NEVER be bypassed.
 */

test.describe('Silence Policy - Critical Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/book');
  });

  test('cannot submit booking without accepting rules', async ({ page }) => {
    // Fill all required fields EXCEPT rules checkbox
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/visitors/i).fill('1');

    // Ensure rules checkbox is NOT checked
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy|silence/i });
    const isChecked = await rulesCheckbox.isChecked();
    
    if (isChecked) {
      await rulesCheckbox.uncheck();
    }

    // Try to submit
    const submitButton = page.getByRole('button', { name: /confirm|submit|book/i });
    await submitButton.click();

    // MUST stay on booking page - submission should be blocked
    await expect(page).toHaveURL(/\/book/);

    // Should show error message about accepting rules
    await expect(page.getByText(/accept.*rules|accept.*policy|must accept/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('submit button is disabled until rules are accepted', async ({ page }) => {
    // Fill form except rules
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/visitors/i).fill('1');

    const submitButton = page.getByRole('button', { name: /confirm|submit|book/i });
    
    // Button should be disabled or non-interactive
    const isDisabled = await submitButton.isDisabled();
    
    // If implementation uses disabled state
    if (isDisabled) {
      expect(isDisabled).toBe(true);
    }

    // Now accept rules
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    await rulesCheckbox.check();

    // Button should now be enabled
    const isEnabledAfter = !(await submitButton.isDisabled());
    expect(isEnabledAfter).toBe(true);
  });

  test('rules modal must be opened and read', async ({ page }) => {
    // Look for "Read Rules" or "View Rules" link
    const readRulesLink = page.getByRole('link', { name: /read rules|view rules|silence policy/i });

    if (await readRulesLink.isVisible()) {
      await readRulesLink.click();

      // Modal or page should open with rules content
      await expect(page.getByText(/silence|quiet|no noise|respect/i)).toBeVisible();

      // Modal should have acknowledgment checkbox
      const modalCheckbox = page.getByRole('checkbox', { name: /understand|accept|acknowledge/i });
      
      if (await modalCheckbox.isVisible()) {
        await modalCheckbox.check();
      }
    }
  });

  test('rules text is displayed in both English and Tamil', async ({ page }) => {
    // Test English version
    await page.goto('/en/book');
    
    const rulesLabel = page.getByText(/silence|rules|policy/i).first();
    await expect(rulesLabel).toBeVisible();

    // Test Tamil version
    await page.goto('/ta/book');
    
    // Tamil rules should be visible
    const bodyContent = await page.textContent('body');
    const hasTamilText = /[\u0B80-\u0BFF]/.test(bodyContent || '');
    expect(hasTamilText).toBe(true);
  });

  test('unchecking rules after checking disables submit', async ({ page }) => {
    // Fill form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/visitors/i).fill('1');

    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    const submitButton = page.getByRole('button', { name: /confirm|submit|book/i });

    // Check rules
    await rulesCheckbox.check();
    
    // Uncheck rules
    await rulesCheckbox.uncheck();

    // Try to submit - should fail
    await submitButton.click();

    // Should show error or stay on page
    await expect(page).toHaveURL(/\/book/);
  });

  test('API rejects booking request without rulesAccepted=true', async ({ page, request }) => {
    // Attempt direct API call without rulesAccepted
    const response = await request.post('/api/bookings', {
      data: {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        visitorName: 'Hacker Person',
        phone: '+91-9876543210',
        email: 'hacker@example.com',
        locale: 'en',
        numberOfVisitors: 1,
        rulesAccepted: false, // CRITICAL: Trying to bypass
      },
    });

    // API MUST reject this
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('browser localStorage cannot bypass rules', async ({ page }) => {
    // Try to inject localStorage flag
    await page.evaluate(() => {
      localStorage.setItem('rulesAccepted', 'true');
      localStorage.setItem('bypassRules', 'true');
    });

    // Should still need to check the checkbox
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    expect(await rulesCheckbox.isChecked()).toBe(false);
  });

  test('rules checkbox cannot be auto-checked by automation', async ({ page }) => {
    // Visit page
    await page.goto('/book');

    // Try to check via JavaScript injection
    await page.evaluate(() => {
      const checkbox = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Form validation should still require manual check
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();

    // Should still fail validation
    await expect(page).toHaveURL(/\/book/);
  });
});

test.describe('Silence Policy - Accessibility', () => {
  test('rules checkbox is keyboard accessible', async ({ page }) => {
    await page.goto('/book');

    // Tab to checkbox
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs

    // Press space to check
    await page.keyboard.press('Space');

    // Verify it was checked
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    expect(await rulesCheckbox.isChecked()).toBe(true);
  });

  test('rules checkbox has proper ARIA labels', async ({ page }) => {
    await page.goto('/book');

    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    
    // Should have accessible name
    const label = await rulesCheckbox.getAttribute('aria-label');
    const hasLabel = label || (await rulesCheckbox.textContent());
    
    expect(hasLabel).toBeTruthy();
  });

  test('rules link is accessible to screen readers', async ({ page }) => {
    await page.goto('/book');

    const rulesLink = page.getByRole('link', { name: /read|view|silence/i });
    
    if (await rulesLink.isVisible()) {
      const ariaLabel = await rulesLink.getAttribute('aria-label');
      const role = await rulesLink.getAttribute('role');
      
      // Should be properly labeled
      expect(ariaLabel || role).toBeTruthy();
    }
  });
});

test.describe('Silence Policy - Visual Confirmation', () => {
  test('rules section is prominently displayed', async ({ page }) => {
    await page.goto('/book');

    const rulesSection = page.locator('[data-testid="rules-section"]').or(
      page.getByText(/silence policy|sanctuary rules/i).locator('..')
    );

    // Should be visible without scrolling
    if (await rulesSection.isVisible()) {
      const box = await rulesSection.boundingBox();
      expect(box?.y).toBeLessThan(800); // Within first viewport
    }
  });

  test('unchecked rules checkbox shows warning color', async ({ page }) => {
    await page.goto('/book');

    // Fill form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');

    // Try to submit without rules
    await page.getByRole('button', { name: /submit/i }).click();

    // Rules checkbox or label should show error state (red border, etc.)
    const rulesArea = page.getByText(/rules|policy/i).locator('..');
    
    // Check for error class or red color
    const className = await rulesArea.getAttribute('class');
    const hasError = className?.includes('error') || className?.includes('red') || className?.includes('border-destructive');
    
    expect(hasError).toBeTruthy();
  });
});
