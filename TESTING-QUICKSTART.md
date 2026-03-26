# Testing Quick Start Guide

## Installation

```bash
# Install dependencies (includes test packages)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Watch Mode (Development)
```bash
npm run test
```
Tests run automatically when files change.

### Run Once (CI Mode)
```bash
npm run test:ci
```

### Coverage Report
```bash
npm run test:coverage
```
Opens HTML report: `coverage/index.html`

### E2E Tests
```bash
# Headless (default)
npm run test:e2e

# With UI (interactive)
npm run test:e2e:ui

# Headed (see browser)
npm run test:e2e:headed

# Debug a test
npm run test:e2e:debug
```

## Project Structure

```
Birdman/
├── __tests__/              # Unit & component tests
│   ├── api/                # API route tests
│   ├── components/         # Component tests
│   ├── helpers/            # Test utilities
│   └── lib/                # Business logic tests
├── e2e/                    # End-to-end tests
│   ├── homepage.spec.ts
│   ├── booking-flow.spec.ts
│   └── admin-dashboard.spec.ts
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
└── vitest.setup.ts         # Test setup & mocks
```

## Writing Your First Test

### Unit Test
```typescript
// __tests__/lib/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected output');
  });
});
```

### Component Test
```typescript
// __tests__/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test
```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('user can do something', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Debugging Tests

### Vitest UI
```bash
npm run test:ui
```
Opens browser with interactive test UI.

### Playwright Debug
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### VS Code Debugging

Add to `.vscode/launch.json`:
```json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Vitest Current File",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test", "--", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

## CI Pipeline

Tests run automatically on GitHub Actions:
- **Unit tests** on every push
- **E2E tests** on every pull request
- **Coverage reports** uploaded to Codecov

See: `.github/workflows/test.yml`

## Next Steps

1. ✅ Install dependencies
2. ✅ Run `npm run test` to verify setup
3. ✅ Run `npm run test:e2e` for E2E tests
4. 📖 Read [TESTING.md](./TESTING.md) for full documentation
5. 🚀 Start writing tests for your features!

## Getting Help

- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev
- **Testing Library**: https://testing-library.com

---

**Remember**: Every test is a visitor's expectation. Test with empathy. 🦜
