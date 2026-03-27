# Testing Documentation

**Birdman of Chennai - QA Testing Infrastructure**

This document provides comprehensive guidance for testing the Birdman of Chennai booking application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Birdman of Chennai application uses a multi-layered testing strategy:

1. **Unit Tests** — Individual functions, utilities, validations
2. **Component Tests** — React components in isolation
3. **Integration Tests** — API routes and database interactions
4. **E2E Tests** — Complete user journeys (booking flow, admin dashboard)

**Testing Philosophy**: Test behavior, not implementation. Every test represents a visitor's expectation.

---

## Testing Stack

| Tool | Purpose | Documentation |
|---|---|---|
| **Vitest** | Unit & integration tests | [vitest.dev](https://vitest.dev) |
| **React Testing Library** | Component testing | [testing-library.com](https://testing-library.com) |
| **Playwright** | E2E browser testing | [playwright.dev](https://playwright.dev) |
| **@testing-library/jest-dom** | DOM matchers | [testing-library.com/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/) |
| **@testing-library/user-event** | User interactions | [testing-library.com/user-event](https://testing-library.com/docs/user-event/intro) |

---

## Getting Started

### Installation

```bash
# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

Create a `.env.test` file for test environment variables:

```env
DATABASE_URL=postgresql://test:test@localhost:5432/birdman_test
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
```

---

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:ci

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run specific test file
npm run test __tests__/lib/validations.test.ts

# Run tests matching pattern
npm run test:e2e booking-flow

# Run single E2E test by name
npm run test:e2e -g "complete booking from homepage"
```

---

## Writing Tests

### Unit Test Example

**File**: `__tests__/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it('should format date in Indian format', () => {
    const date = new Date('2026-04-01');
    expect(formatDate(date)).toBe('01/04/2026');
  });

  it('should handle invalid dates', () => {
    expect(() => formatDate(null)).toThrow();
  });
});
```

### Component Test Example

**File**: `__tests__/components/BookingForm.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/components/BookingForm';

describe('BookingForm', () => {
  it('submits booking when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<BookingForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/phone/i), '+91-9876543210');
    await user.click(screen.getByRole('checkbox', { name: /rules/i }));

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        visitorName: 'John Doe',
        phone: '+91-9876543210',
        rulesAccepted: true,
      })
    );
  });
});
```

### E2E Test Example

**File**: `e2e/critical-path.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('visitor can book a session', async ({ page }) => {
  // Navigate
  await page.goto('/');
  await page.getByRole('link', { name: /book now/i }).click();

  // Fill form
  await page.getByLabel(/name/i).fill('Rajesh Kumar');
  await page.getByLabel(/phone/i).fill('+91-9876543210');
  await page.getByLabel(/visitors/i).fill('2');
  await page.getByRole('checkbox', { name: /rules/i }).check();

  // Submit
  await page.getByRole('button', { name: /confirm/i }).click();

  // Verify
  await expect(page).toHaveURL(/confirmation/);
  await expect(page.getByText(/success/i)).toBeVisible();
});
```

---

## Test Coverage

### Coverage Goals

- **Overall**: 80%+
- **Critical paths** (booking, validation): 95%+
- **UI components**: 75%+
- **Utilities**: 90%+

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/index.html` in a browser.

### Critical Paths (Must be 100% covered)

1. ✅ Booking creation flow
2. ✅ Capacity enforcement
3. ✅ Double-booking prevention
4. ✅ Silence Policy acknowledgment
5. ✅ Admin session toggle
6. ✅ Form validation (phone, email, visitor count)

---

## CI/CD Integration

Tests run automatically on GitHub Actions for every push and pull request.

### Workflow: `.github/workflows/test.yml`

Jobs:
- **unit-tests** — Vitest tests + coverage
- **e2e-tests** — Playwright tests (Chrome only in CI)
- **lint** — ESLint
- **type-check** — TypeScript compilation

### Viewing CI Results

1. Go to **Actions** tab on GitHub
2. Click on the workflow run
3. Download artifacts:
   - `playwright-report` — HTML test report
   - `playwright-results` — Screenshots/videos of failures

---

## Test Organization

```
Birdman/
├── __tests__/                  # Unit & component tests
│   ├── lib/
│   │   ├── validations.test.ts
│   │   └── utils.test.ts
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── Card.test.tsx
│   └── api/
│       └── bookings.test.ts
├── e2e/                        # End-to-end tests
│   ├── homepage.spec.ts
│   ├── booking-flow.spec.ts
│   └── admin-dashboard.spec.ts
├── vitest.config.ts            # Vitest configuration
├── vitest.setup.ts             # Test setup & mocks
└── playwright.config.ts        # Playwright configuration
```

---

## Troubleshooting

### Vitest Issues

**Problem**: `Cannot find module '@/...'`

**Solution**: Check `vitest.config.ts` has correct path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Problem**: Tests fail with React errors

**Solution**: Ensure `@vitejs/plugin-react` is installed and configured.

### Playwright Issues

**Problem**: Browsers not installed

**Solution**: Run `npx playwright install`

**Problem**: Tests timeout

**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 30000, // 30 seconds
}
```

**Problem**: Test fails in CI but passes locally

**Solution**: Check `CI=true` environment. May need to adjust retries or use `--workers=1`.

### Component Test Issues

**Problem**: `toBeInTheDocument` is not a function

**Solution**: Import jest-dom matchers in `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

**Problem**: User events not working

**Solution**: Use `userEvent.setup()` before each test:

```typescript
const user = userEvent.setup();
await user.click(element);
```

---

## Best Practices

### DO ✅

- Test user-facing behavior, not implementation
- Use semantic queries (`getByRole`, `getByLabelText`)
- Write descriptive test names: "should [expected] when [condition]"
- Test both English and Tamil locales
- Mock external services (Twilio, email)
- Clean up after each test

### DON'T ❌

- Test internal state or props directly
- Use `getByTestId` unless absolutely necessary
- Write tests that depend on other tests
- Skip edge cases (full slots, invalid data)
- Use arbitrary timeouts — use `waitFor` instead
- Test CSS or styling — test functionality

---

## Continuous Improvement

As the application evolves, tests should be:

1. **Added** for new features
2. **Updated** when behavior changes
3. **Removed** if no longer relevant
4. **Refactored** to improve clarity

**Every bug fix should include a test** that would have caught the bug.

---

## Getting Help

- **Vitest Docs**: https://vitest.dev
- **Testing Library**: https://testing-library.com
- **Playwright Docs**: https://playwright.dev
- **Team Contact**: Parrot-Tester (QA Engineer)

---

**Remember**: Every test is a visitor's expectation. When tests pass, visitors are happy. 🦜
