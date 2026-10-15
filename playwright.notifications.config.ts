import { defineConfig, devices } from '@playwright/test';

// No live URL override/reuse: a separate local build and database protect the user's running app.
export default defineConfig({
  testDir: './e2e', testMatch: 'notifications.spec.ts', workers: 1, fullyParallel: false,
  timeout: 120000, expect: { timeout: 30000 }, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:7101', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 7101', url: 'http://127.0.0.1:7101/admin/login',
    reuseExistingServer: false, timeout: 120000, env: {
      NODE_ENV: 'development', NOTIFICATION_BROWSER_TEST_APP: 'true',
      FIREBASE_USE_LIVE: 'false', NEXT_PUBLIC_FIREBASE_USE_LIVE: 'false', FIRESTORE_DATABASE_ID: 'notifications-browser-test',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:7003', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:7002',
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:7002', NOTIFICATIONS_DELIVERY_MODE: 'mock',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'birdman-7e745', NEXT_PUBLIC_FIREBASE_API_KEY: 'local-browser-test-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'birdman-7e745.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456:web:notification-test', NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456',
    } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
