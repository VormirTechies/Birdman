# End-to-End Tests

This directory contains Playwright E2E tests that verify complete user journeys.

## Test Files

- `homepage.spec.ts` — Homepage, SEO, accessibility
- `booking-flow.spec.ts` — 🔴 CRITICAL: Complete booking journey
- `admin-dashboard.spec.ts` — Admin authentication & session management
- `i18n.spec.ts` — English/Tamil localization
- `silence-policy.spec.ts` — 🔴 CRITICAL: Rules enforcement

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# With visible browser
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

## Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can complete action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /click me/i }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Configuration

See [playwright.config.ts](../playwright.config.ts) for browser and device configurations.

## Debugging

1. Run `npm run test:e2e:debug`
2. Playwright Inspector opens
3. Step through test actions
4. Inspect page state

---

**Test from the visitor's perspective. 🦜**
