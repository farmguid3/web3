const CACHE_NAME = 'farmguide-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/js/app.js',
  '/js/auth.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Fetch Assets
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});