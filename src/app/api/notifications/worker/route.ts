import { resolveNotificationConfig } from '@/lib/firebase/notification-config';

export const dynamic = 'force-dynamic';
export function GET() {
  let script = '// FCM is disabled in local development.\n';
  try {
    const config = resolveNotificationConfig();
    if (config.mode === 'fcm' && config.configured) {
      // Only public Firebase web configuration is serialized, never server secrets.
      const web = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      if (web.projectId !== 'birdman-7e745' || Object.values(web).some(value => !value)) throw new Error('Missing Firebase web configuration');
      script = `importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(web).replace(/</g, '\\u003c')});
const seen = new Set();
firebase.messaging().onBackgroundMessage(async function(payload) {
  const id = payload.data && payload.data.notificationId;
  if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id) || seen.has(id)) return;
  if (seen.size >= 200) seen.delete(seen.values().next().value);
  seen.add(id);
  // FCM already displays notification payloads. Do not display a duplicate here.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach(function(client) {
    const url = new URL(client.url);
    if (url.origin === self.location.origin && (url.pathname === '/admin' || url.pathname.startsWith('/admin/')))
      client.postMessage({ type: 'BIRDMAN_NOTIFICATION', notificationId: id });
  });
});
self.__birdmanFcmReady = true;
`;
    }
    return new Response(script, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' } });
  } catch {
    return new Response('// FCM configuration unavailable.', { status: 503, headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' } });
  }
}
