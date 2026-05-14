/**
 * Sanctuary High-Fidelity Service Worker 🕊️
 * Handles caching (PWA offline support) + background push alerts.
 */

// ─── Cache Configuration ─────────────────────────────────────────────────────

const CACHE_STATIC = 'birdman-static-v2';
const CACHE_PAGES  = 'birdman-pages-v2';

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

  // Static assets (Next.js chunks, fonts, images) — cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
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

self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'close') return;

  // 🦅 Intelligent Window Routing with Data Refresh
  // If a window is already open at the sanctuary dashboard, focus it and refresh data.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          // Focus the window and trigger data refresh
          client.postMessage({
            type: 'REFRESH_DATA',
            timestamp: Date.now()
          });
          return client.focus();
        }
      }
      // No existing admin window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(notification.data.url);
      }
    })
  );
});
