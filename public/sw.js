/**
 * Sanctuary High-Fidelity Service Worker 🕊️
 * Handles caching (PWA offline support) + background push alerts.
 */

// ─── Cache Configuration ─────────────────────────────────────────────────────

// Share the existing PWA worker with Firebase Messaging; never request permission here.
// Register before Firebase's handler; push payloads cannot choose a navigation URL.
self.addEventListener('notificationclick', function(event) {
  event.stopImmediatePropagation();
  event.notification.close();
  if (event.action === 'close') return;
  const payload = event.notification.data && event.notification.data.FCM_MSG;
  const id = payload && payload.data && payload.data.notificationId;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windows) {
    for (const client of windows) {
      const url = new URL(client.url);
      if (url.origin === self.location.origin && (url.pathname === '/admin' || url.pathname.startsWith('/admin/'))) {
        if (typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)) client.postMessage({ type: 'BIRDMAN_NOTIFICATION', notificationId: id });
        return client.focus();
      }
    }
    return self.clients.openWindow('/admin');
  }));
});
try { importScripts('/api/notifications/worker'); } catch (_) { /* PWA remains usable without FCM. */ }
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'BIRDMAN_FCM_STATUS' && event.ports[0]) {
    event.ports[0].postMessage({ ready: self.__birdmanFcmReady === true });
  }
});
const CACHE_STATIC = 'birdman-static-v3';
const CACHE_PAGES  = 'birdman-pages-v3';

// Admin shell pages to pre-cache on install
const PRECACHE_PAGES = [
  '/admin',
  '/admin/bookings',
  '/admin/checklist',
  '/admin/feedback',
  '/admin/gallery',
];

// ─── Install: Pre-cache admin page shells ────────────────────────────────────

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_PAGES).then(function(cache) {
      // Use individual adds so a single missing page won't abort the whole install
      return Promise.allSettled(
        PRECACHE_PAGES.map(function(url) { return cache.add(url); })
      );
    })
  );
});

// ─── Activate: Clean up old cache versions ───────────────────────────────────

self.addEventListener('activate', function(event) {
  const currentCaches = [CACHE_STATIC, CACHE_PAGES];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return !currentCaches.includes(name); })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: Routing strategies ───────────────────────────────────────────────

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes — network only, never cache sensitive data
  if (url.pathname.startsWith('/api/')) return;

  // Next.js chunks must always come from the browser/network cache path.
  // Serving old chunks from Cache Storage can break after deploys because the
  // HTML/RSC payload may reference modules that no longer exist in cached JS.
  if (url.pathname.startsWith('/_next/')) return;

  // Static assets (app images/icons only) — cache first
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Admin pages — network first, fall back to cache for offline support
  if (url.pathname.startsWith('/admin') && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Clone BEFORE the async caches.open() — body is consumed once returned to browser
          if (response.ok) {
            var responseToCache = response.clone();
            caches.open(CACHE_PAGES).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(function() {
          // Offline: serve cached page or closest parent shell
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('/admin');
          });
        })
    );
    return;
  }
});

// ─── Push Notifications ──────────────────────────────────────────────────────

self.addEventListener('push', function(event) {
  // Firebase Messaging owns FCM payloads; avoid a second legacy notification.
  try { if (event.data && event.data.json().from) return; } catch (_) {}
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Alert', body: event.data.text() };
    }

    const options = {
      body: data.body || 'New administrative event detected.',
      icon: '/img/favicon.png', // Premium sanctuary icon
      badge: '/img/favicon.png',
      vibrate: [200, 100, 200, 100, 400], // High-visibility pulse
      tag: data.tag || 'sanctuary-alert',
      renotify: true,
      data: {
        url: data.url || '/admin',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '🦅 Open Dashboard',
          icon: '/img/favicon.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Birdman Sanctuary Alert', 
        options
      ).then(() => {
        // Notify all open admin tabs so they can update the in-app notification badge
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          for (let i = 0; i < clientList.length; i++) {
            clientList[i].postMessage({
              type: 'NEW_NOTIFICATION',
              payload: {
                title: data.title || 'Birdman Sanctuary Alert',
                body: data.body || '',
                visitorName: data.visitorName || '',
                bookingDate: data.bookingDate || '',
                notifType: data.notifType || 'booking',
              }
            });
          }
        });
      })
    );
  }
});
