# 🧪 Testing Infrastructure - Installation Guide

## Prerequisites

- Node.js 20+ 
- npm or pnpm or yarn

---

## Step 1: Install Dependencies

Run this single command to install all testing dependencies:

```bash
npm install -D vitest @vitest/ui @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom @playwright/test happy-dom
```

Or copy to your `package.json`:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^5.0.0",
    "@vitest/ui": "^2.0.0",
    "happy-dom": "^15.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.0.0"
  }
}
```

Then run:
```bash
npm install
```

---

## Step 2: Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers for testing.

**For CI only (smaller download):**
```bash
npx playwright install --with-deps chromium
```

---

## Step 3: Verify Installation

### Test Unit Tests
```bash
npm run test

# Should see:
# ✓ __tests__/lib/validations.test.ts (X tests)
# ✓ __tests__/components/Button.test.tsx (X tests)
```

### Test E2E Tests
```bash
npm run test:e2e

# Should see:
# Running X tests using Y workers
# ✓ [chromium] › homepage.spec.ts:X:Y
```

---

## Step 4: View Test UI (Optional)

### Vitest UI
```bash
npm run test:ui
```
Opens browser at `http://localhost:51204/__vitest__/`

### Playwright UI
```bash
npm run test:e2e:ui
```
Opens Playwright Test Runner with interactive mode.

---

## Troubleshooting

### Error: "Cannot find module '@/...'"

**Solution**: Ensure `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "toBeInTheDocument is not a function"

**Solution**: Import jest-dom in `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest';
```

### Error: "Playwright not installed"

**Solution**: Run:
```bash
npx playwright install
```

### Error: "Port 3000 already in use" (E2E tests)

**Solution**: 
1. Stop any running dev server
2. Or change port in `playwright.config.ts`:
```typescript
webServer: {
  url: 'http://localhost:3001',
}
```

### Error: Database connection failed

**Solution**: Set test database URL in `.env.test`:
```env
DATABASE_URL=postgresql://test:test@localhost:5432/birdman_test
```

---

## Quick Commands Reference

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (run once)
npm run test:ci

# Unit tests with UI
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# E2E debug mode
npm run test:e2e:debug

# E2E in browser
npm run test:e2e:headed

# View last E2E report
npm run test:e2e:report
```

---

## File Structure After Installation

```
Birdman/
├── __tests__/              ✅ Created
│   ├── api/
│   ├── components/
│   ├── helpers/
│   └── lib/
├── e2e/                    ✅ Created
│   ├── admin-dashboard.spec.ts
│   ├── booking-flow.spec.ts
│   ├── homepage.spec.ts
│   ├── i18n.spec.ts
│   └── silence-policy.spec.ts
├── coverage/               📊 Generated after test:coverage
├── test-results/           📊 Generated after test:e2e
├── playwright-report/      📊 Generated after test:e2e
├── .github/workflows/
│   └── test.yml            ✅ CI Pipeline
├── vitest.config.ts        ✅ Created
├── vitest.setup.ts         ✅ Created
├── playwright.config.ts    ✅ Created
├── TESTING.md              📖 Full documentation
├── TESTING-QUICKSTART.md   📖 Quick reference
└── package.json            ✅ Updated with scripts
```

---

## Next Steps

1. ✅ Run `npm install` to install dependencies
2. ✅ Run `npx playwright install` for browsers
3. ✅ Run `npm run test` to verify unit tests work
4. ✅ Run `npm run test:e2e` to verify E2E tests work
5. 📖 Read [TESTING.md](./TESTING.md) for writing tests
6. 🚀 Start writing tests for your features!

---

## CI/CD Setup (GitHub Actions)

Tests run automatically on every push via `.github/workflows/test.yml`.

To view results:
1. Go to **Actions** tab on GitHub
2. Click on latest workflow run
3. Download artifacts (test reports, screenshots)

---

## Getting Help

- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev  
- **Testing Library**: https://testing-library.com

---

**Installation complete! The tests are ready. 🦜**
