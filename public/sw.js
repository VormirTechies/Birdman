self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/img/favicon.png', // Fallback to favicon
      badge: '/img/favicon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/admin'
      },
      actions: [
        {
          action: 'explore',
          title: 'View Dashboard',
          icon: '/img/favicon.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/img/favicon.png'
        },
      ]
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Birdman of Chennai', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
