// sw.js
const CACHE_NAME = 'wesnoth-tools-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/scripts/main.js',
  '/scripts/moduleLoader.js',
  '/scripts/event_message_extractor.js',
  '/scripts/story_extractor.js',
  '/styles/dashboard.css',
  '/modules/event_message_extractor.html',
  '/modules/story_extractor.html',
  // other assets
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});