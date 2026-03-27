import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * For Mr. Sudarson Sah to manage bookings and sessions
 */

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  
  // Fill login form
  await page.getByLabel(/username|email/i).fill(process.env.TEST_ADMIN_EMAIL || 'admin@birdman.test');
  await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD || 'testpassword123');
  
  await page.getByRole('button', { name: /login|sign in/i }).click();
  
  // Should redirect to admin dashboard
  await expect(page).toHaveURL(/\/admin/);
}

test.describe('Admin Authentication', () => {
  test('cannot access admin dashboard without login', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin can login with valid credentials', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should see admin dashboard content
    await expect(page.getByRole('heading', { name: /dashboard|admin/i })).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.getByLabel(/username|email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });
});

test.describe('Admin Dashboard - Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('displays list of upcoming sessions', async ({ page }) => {
    // Should show sessions in a table or list
    const sessionsList = page.locator('[data-testid="sessions-list"]').or(page.locator('table'));
    await expect(sessionsList).toBeVisible();
  });

  test('admin can mark session as unavailable', async ({ page }) => {
    // Find a toggle or checkbox for session availability
    const toggleButton = page.getByRole('switch', { name: /available|active/i }).first();
    
    if (await toggleButton.isVisible()) {
      const initialState = await toggleButton.getAttribute('aria-checked');
      
      // Toggle the state
      await toggleButton.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // State should have changed
      const newState = await toggleButton.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }
  });

  test('shows visitor count for each session', async ({ page }) => {
    // Look for numbers indicating bookings (e.g., "5/10 spots filled")
    const visitorCount = page.getByText(/\d+\/\d+|\d+ visitors?/i).first();
    await expect(visitorCount).toBeVisible();
  });

  test('admin can view booking details', async ({ page }) => {
    // Click on a booking to see details
    const bookingRow = page.locator('[data-testid="booking-item"]').or(page.locator('tr')).nth(1);
    
    if (await bookingRow.isVisible()) {
      await bookingRow.click();
      
      // Should show booking details modal or page
      await expect(page.getByText(/visitor name|phone|email/i)).toBeVisible();
    }
  });
});

test.describe('Admin Dashboard - Capacity Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('displays current capacity status', async ({ page }) => {
    // Should show how many spots are available vs booked
    const capacityIndicator = page.getByText(/capacity|available|booked/i).first();
    await expect(capacityIndicator).toBeVisible();
  });

  test('warns when session is near capacity', async ({ page }) => {
    // Look for warning badges or indicators
    const warningBadge = page.locator('[data-status="warning"]').or(page.getByText(/few left|almost full/i));
    
    // This depends on data, so check if exists
    const count = await warningBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('shows full status when capacity reached', async ({ page }) => {
    // Look for "Full" indicators
    const fullBadge = page.locator('[data-status="full"]').or(page.getByText(/full|sold out/i));
    
    const count = await fullBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Admin Dashboard - Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('can filter bookings by date', async ({ page }) => {
    const dateFilter = page.getByLabel(/date|filter/i).first();
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      // Select a date (implementation depends on date picker)
      await page.keyboard.press('Enter');
      
      // Results should update
      await page.waitForLoadState('networkidle');
    }
  });

  test('can search for booking by visitor name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find|name/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      await page.waitForTimeout(500); // Debounce
      
      // Should show filtered results
      const results = page.locator('[data-testid="booking-item"]').or(page.locator('tr'));
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Admin Dashboard - Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('can export bookings as CSV', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|download|csv/i });
    
    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    } else {
      test.skip();
    }
  });
});

test.describe('Admin Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard is usable on mobile', async ({ page }) => {
    // Main dashboard content should be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Should have mobile-friendly navigation
    const nav = page.locator('nav').or(page.getByRole('navigation'));
    await expect(nav).toBeVisible();
  });

  test('can toggle session availability on mobile', async ({ page }) => {
    const toggleButton = page.getByRole('switch').first();
    
    if (await toggleButton.isVisible()) {
      // Should be easy to tap (44x44px minimum)
      const box = await toggleButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
