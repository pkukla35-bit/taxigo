// Minimal service worker — required so Chrome treats TAXIGO as installable PWA.
const CACHE = 'taxigo-v1';
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
