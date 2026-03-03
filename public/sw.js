// Service Worker for handling push notifications and offline support
const CACHE_NAME = 'spaceout-v1';
const STATIC_CACHE = 'spaceout-static-v1';
const urlsToCache = [
  '/',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Cache only available resources, don't fail if some are missing
      cache.addAll(urlsToCache).catch(() => null);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'SpaceOut',
      body: event.data.text(),
    };
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    tag: notificationData.tag || 'spaceout-notification',
    data: notificationData.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'SpaceOut', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window already exists
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if doesn't exist
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Fetch event - Network first with fallback to offline page
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Network first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache if response is not ok
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response
        const responseClone = response.clone();

        // Cache successful responses
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Try cache first on network error
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }

          // Return offline page for document/html requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html').then((response) => {
              if (response) {
                return response;
              }
              // Fallback response if offline.html not cached
              return new Response(
                '<html><body><h1>Offline</h1><p>You are offline. Please check your connection.</p></body></html>',
                {
                  headers: { 'Content-Type': 'text/html' },
                  status: 503,
                  statusText: 'Service Unavailable',
                }
              );
            });
          }

          // For other requests, return a generic offline response
          return new Response('Service unavailable (offline)', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
