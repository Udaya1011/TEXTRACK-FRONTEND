const CACHE_NAME = 'textrack-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy 1: Network-First for HTML/navigation requests (root and index.html)
  // This prevents the dreaded 404 on hashed JS bundles after a redeployment.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy 2: Cache-First for static assets, dynamically caching compiled Vite assets in /assets/
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache static assets dynamically (like CSS, JS compiled by Vite)
            if (url.pathname.includes('/assets/')) {
              const responseCopy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
            }

            return response;
          })
          .catch(() => {
            // Handle offline case gracefully
          });
      })
  );
});
