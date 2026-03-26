import { test, expect } from '@playwright/test';

/**
 * Complete Booking Flow E2E Tests
 * CRITICAL PATH: This is what users come to do — book a visit
 */

test.describe('Booking Flow - Happy Path', () => {
  test('complete booking from homepage to confirmation', async ({ page }) => {
    // Step 1: Start on homepage
    await page.goto('/');

    // Step 2: Click book button
    const bookButton = page.getByRole('link', { name: /book/i }).first();
    await bookButton.click();
    await expect(page).toHaveURL(/\/book/);

    // Step 3: Select available session
    // Look for available time slots
    const sessionButton = page.getByRole('button', { name: /available|select/i }).first();
    await sessionButton.click();

    // Step 4: Fill booking form
    await page.getByLabel(/name/i).fill('Rajesh Kumar');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/email/i).fill('rajesh@example.com');
    
    // Number of visitors
    const visitorInput = page.getByLabel(/visitors|guests/i);
    await visitorInput.fill('2');

    // Step 5: Accept Silence Policy (CRITICAL)
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy|accept/i });
    await rulesCheckbox.check();

    // Step 6: Submit booking
    const submitButton = page.getByRole('button', { name: /confirm|submit|book now/i });
    await submitButton.click();

    // Step 7: Should see confirmation
    await expect(page).toHaveURL(/\/book\/confirmation|\/booking\/success/);
    await expect(page.getByText(/confirmed|success|booked/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('booking form shows in Tamil locale', async ({ page }) => {
    await page.goto('/ta/book');

    // Should show Tamil labels (looking for Tamil characters)
    const content = await page.textContent('body');
    // Tamil Unicode range check
    const hasTamil = /[\u0B80-\u0BFF]/.test(content || '');
    expect(hasTamil).toBeTruthy();
  });
});

test.describe('Booking Flow - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/book');
  });

  test('shows validation errors for empty form', async ({ page }) => {
    // Try to submit without filling anything
    const submitButton = page.getByRole('button', { name: /confirm|submit|book/i });
    await submitButton.click();

    // Should show error messages
    await expect(page.getByText(/required|必須/i).first()).toBeVisible();
  });

  test('validates phone number format', async ({ page }) => {
    await page.getByLabel(/phone/i).fill('123'); // Invalid
    await page.getByLabel(/phone/i).blur();

    // Should show validation error
    await expect(page.getByText(/phone|invalid/i)).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/email/i).blur();

    // Should show validation error
    await expect(page.getByText(/email|invalid/i)).toBeVisible();
  });

  test('prevents booking without accepting rules', async ({ page }) => {
    // Fill valid data
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');
    await page.getByLabel(/visitors/i).fill('1');

    // DO NOT check the rules checkbox
    const rulesCheckbox = page.getByRole('checkbox', { name: /rules|policy/i });
    await expect(rulesCheckbox).not.toBeChecked();

    // Try to submit
    const submitButton = page.getByRole('button', { name: /confirm|submit/i });
    await submitButton.click();

    // Should NOT navigate away - stay on booking page
    await expect(page).toHaveURL(/\/book/);

    // Should show error about accepting rules
    await expect(page.getByText(/accept|rules|policy/i)).toBeVisible();
  });

  test('enforces visitor limits (1-10)', async ({ page }) => {
    const visitorInput = page.getByLabel(/visitors|guests/i);

    // Try 0 visitors
    await visitorInput.fill('0');
    await visitorInput.blur();
    await expect(page.getByText(/at least 1|minimum/i)).toBeVisible();

    // Try 11 visitors
    await visitorInput.fill('11');
    await visitorInput.blur();
    await expect(page.getByText(/maximum 10|at most/i)).toBeVisible();
  });
});

test.describe('Booking Flow - Capacity Management', () => {
  test('shows full status when session is at capacity', async ({ page }) => {
    await page.goto('/book');

    // Look for any "Full" indicators
    const fullIndicator = page.getByText(/full|sold out|not available/i).first();
    
    if (await fullIndicator.isVisible()) {
      // If slot is full, should not be selectable
      const parentButton = fullIndicator.locator('..').locator('button').first();
      await expect(parentButton).toBeDisabled();
    }
  });

  test('cannot double-book a session', async ({ page }) => {
    // This would require database seeding to test properly
    // Placeholder for integration with backend
    test.skip();
  });
});

test.describe('Booking Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('booking form is usable on mobile', async ({ page }) => {
    await page.goto('/book');

    // Form should be visible and scrollable
    await expect(page.getByLabel(/name/i)).toBeVisible();

    // Fill form on mobile
    await page.getByLabel(/name/i).fill('Mobile User');
    await page.getByLabel(/phone/i).fill('+91-9876543210');

    // Keyboard should not cover form fields
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toBeInViewport();
  });
});

test.describe('Booking Flow - Admin Closure', () => {
  test('respects admin-set unavailable dates', async ({ page }) => {
    await page.goto('/book');

    // If Mr. Sudarson has marked dates unavailable, they should show as closed
    const closedIndicator = page.getByText(/closed|unavailable|admin/i).first();
    
    if (await closedIndicator.isVisible()) {
      // Closed dates should not be bookable
      const parentButton = closedIndicator.locator('..').locator('button').first();
      await expect(parentButton).toBeDisabled();
    }
  });
});
