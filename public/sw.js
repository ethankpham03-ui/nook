const CACHE = 'nook-shell-v9';
const OFFLINE_URL = '/';
const APP_SHELL = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/nook-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(OFFLINE_URL, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  const networkResponse = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  });

  event.respondWith(
    caches.match(request).then((cached) => cached || networkResponse),
  );
  event.waitUntil(networkResponse.then(() => undefined).catch(() => undefined));
});
