# 🧪 Testing Infrastructure - Installation Checklist

**Complete this checklist to set up testing for Birdman of Chennai**

---

## ☐ Step 1: Install Dependencies (5 minutes)

```bash
npm install -D vitest @vitest/ui @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom @playwright/test happy-dom
```

**Verify**: Check `package.json` devDependencies section.

---

## ☐ Step 2: Install Playwright Browsers (3 minutes)

```bash
npx playwright install
```

**Verify**: Should download Chromium, Firefox, and WebKit.

---

## ☐ Step 3: Verify Unit Tests Work (1 minute)

```bash
npm run test
```

**Expected Output**:
```
✓ __tests__/lib/validations.test.ts (X tests)
✓ __tests__/lib/utils.test.ts (X tests)
✓ __tests__/components/Button.test.tsx (X tests)
```

**✅ Pass**: Tests run successfully  
**❌ Fail**: See [Troubleshooting](#troubleshooting) below

---

## ☐ Step 4: Verify E2E Tests Work (2 minutes)

```bash
npm run test:e2e
```

**Expected Output**:
```
Running X tests using Y workers
✓ [chromium] › homepage.spec.ts:X:Y
✓ [chromium] › booking-flow.spec.ts:X:Y
```

**✅ Pass**: Tests run (may have failures if pages not built yet)  
**❌ Fail**: See [Troubleshooting](#troubleshooting) below

---

## ☐ Step 5: View Test UI (Optional - 2 minutes)

### Vitest UI
```bash
npm run test:ui
```

Opens browser at `http://localhost:51204/__vitest__/`

### Playwright UI
```bash
npm run test:e2e:ui
```

Opens Playwright Test Runner.

---

## ☐ Step 6: Generate Coverage Report (1 minute)

```bash
npm run test:coverage
```

**Expected**: Creates `coverage/` directory with HTML report.

**View**: Open `coverage/index.html` in browser.

---

## ☐ Step 7: Install VS Code Extensions (Optional - 2 minutes)

Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run:

```
Extensions: Show Recommended Extensions
```

Install:
- ✅ Vitest Explorer
- ✅ Playwright Test for VS Code

---

## ☐ Step 8: Test GitHub Actions (Optional)

Push to GitHub and check Actions tab.

**Expected**: CI workflow runs all tests automatically.

---

## ☐ Step 9: Read Documentation (10 minutes)

- [ ] Read [TESTING-QUICKSTART.md](./TESTING-QUICKSTART.md) — Quick commands
- [ ] Skim [TESTING.md](./TESTING.md) — Full guide
- [ ] Check [TESTING-SUMMARY.md](./TESTING-SUMMARY.md) — Complete overview

---

## Troubleshooting

### ❌ Error: Cannot find module '@/...'

**Fix**: Check `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ❌ Error: toBeInTheDocument is not a function

**Fix**: Already configured in `vitest.setup.ts`. If error persists:
```typescript
import '@testing-library/jest-dom/vitest';
```

### ❌ Error: Playwright browsers not installed

**Fix**: Run:
```bash
npx playwright install
```

### ❌ Error: Port 3000 already in use

**Fix**: Stop dev server before running E2E tests, or change port in `playwright.config.ts`.

### ❌ Error: Tests are timing out

**Fix**: Increase timeout in `vitest.config.ts` or `playwright.config.ts`:
```typescript
test: {
  timeout: 30000 // 30 seconds
}
```

---

## Verification Commands

```bash
# Check Vitest is installed
npx vitest --version

# Check Playwright is installed
npx playwright --version

# Check test files exist
ls __tests__/**/*.test.ts
ls e2e/*.spec.ts

# Check scripts are in package.json
npm run | grep test
```

---

## Success Criteria

✅ All dependencies installed  
✅ Playwright browsers downloaded  
✅ Unit tests run successfully  
✅ E2E tests execute (may skip if pages not built)  
✅ Coverage report generates  
✅ Test UI modes work  
✅ VS Code extensions installed  
✅ Documentation read  

---

## Next Steps After Installation

1. ✅ Write your first test (see [TESTING-QUICKSTART.md](./TESTING-QUICKSTART.md))
2. ✅ Add tests for new features before implementation (TDD)
3. ✅ Run tests before committing code
4. ✅ Check CI pipeline passes on GitHub
5. ✅ Review coverage reports regularly

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run test` | Run unit tests (watch mode) |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Open Playwright UI |
| `npm run test:e2e:debug` | Debug E2E tests |

---

## Getting Help

- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev
- **Testing Library**: https://testing-library.com
- **Documentation**: See TESTING.md

---

**Installation complete? Start testing! 🦜**

---

*Checklist by Parrot-Tester — QA Engineer for Birdman of Chennai*
