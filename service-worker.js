const CACHE_NAME = 'solite-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/login.html',
  '/profile.html',
  '/saved.html',
  '/cafes.html',
  '/music.html',
  '/stories.html',
  '/notifications.html',
  '/messages.html',
  '/post.html',
  '/landing.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});