import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { cleanupExpiredNotifications } from '../src/lib/firebase/notification-cleanup';

async function main() {
  if (process.env.FIREBASE_USE_LIVE === 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('This cleanup command is emulator-only');
  }
  const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:7003';
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) throw new Error('Emulator must be loopback-only');
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Only --apply is supported');
  process.env.FIRESTORE_EMULATOR_HOST = host;
  const app = initializeApp({ projectId: 'birdman-7e745' }, 'notification-cleanup');
  const db = getFirestore(app);
  const apply = process.argv.includes('--apply');
  console.log(`Notification cleanup: ${apply ? 'DELETE EXPIRED' : 'DRY RUN'}; emulator ${host}; database (default)`);
  try {
    // At most 100 per collection per invocation. Repeat if more remain.
    console.log(await cleanupExpiredNotifications(db, 100, undefined, apply));
    if (apply) console.log('Expired local notification records were permanently removed; recovery requires an earlier emulator export.');
  } finally { await deleteApp(app); }
}
main().catch(() => {
  console.error('Notification cleanup failed. Check emulator availability and command arguments.');
  process.exitCode = 1;
});
