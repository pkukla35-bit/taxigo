// Minimal service worker — required so Chrome treats TAXIGO as installable PWA.
const CACHE = 'taxigo-v2';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // network-first, fall back to cache for offline
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        try {
          if (event.request.method === 'GET' && res && res.status === 200 && new URL(event.request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
        } catch (e) {}
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Web Push handler
self.addEventListener('push', (event) => {
  let data = { title: 'TAXIGO', body: 'Nowe powiadomienie' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (e) { /* noop */ }
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'taxigo',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(data.title || 'TAXIGO', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) { try { client.navigate(url); } catch (e) {} return client.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

