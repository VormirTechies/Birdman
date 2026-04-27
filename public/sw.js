/**
 * Sanctuary High-Fidelity Service Worker 🕊️
 * Handles background push alerts and interactive notifications.
 */

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
      )
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
