import { spawnSync } from 'node:child_process';
import path from 'node:path';

async function main() {
  // No dotenv/production credentials are loaded. Real FCM is forbidden by the test adapters.
  for (const port of [7002, 7003]) {
    try {
      await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(5000) });
    } catch { throw new Error(`Local emulator port ${port} is unavailable. Run npm run emulators:start first.`); }
  }
  const result = spawnSync(process.execPath, [path.resolve('node_modules/vitest/vitest.mjs'), 'run', '--testTimeout=20000', '--maxWorkers=2',
    'src/lib/firebase/notification', 'src/lib/firebase/booking-notifications',
    'src/app/api/admin/notifications', 'src/app/api/notifications/worker', 'src/app/api/cron/notification-delivery',
    'src/components/providers/NotificationProvider.test.tsx', 'src/components/admin/NotificationDeviceControl.test.tsx',
    '__tests__/api/admin-auth.test.ts', '__tests__/pages/login.test.tsx'], {
    stdio: 'inherit', env: { ...process.env, RUN_NOTIFICATION_EMULATOR_TESTS: 'true',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:7003', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:7002',
      FIREBASE_USE_LIVE: 'false', NOTIFICATIONS_DELIVERY_MODE: 'mock' },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Notification tests failed.'); process.exitCode = 1; });
