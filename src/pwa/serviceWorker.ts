/// <reference lib="webworker" />

const CACHE_NAME = 'matadata-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Cache first for static assets and maps tiles (if they were directly loaded)
  if (STATIC_ASSETS.includes(requestUrl.pathname) || requestUrl.hostname.includes('maps.googleapis')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // Network first for API calls (FAQs, Quiz Data, Mock API)
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(res => res || new Response('', { status: 503 }));
        })
    );
    return;
  }

  // Default: Network First, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(res => res || new Response('', { status: 503 })))
  );
});
