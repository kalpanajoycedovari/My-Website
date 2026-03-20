const CACHE_NAME = "solite-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/login.html",
  "/profile.html",
  "/saved.html",
  "/playlist.html",
  "/cafes.html",
  "/music.html",
  "/stories.html",
  "/images/book.jpg",
  "/images/cafe.jpg",
  "/images/series.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});