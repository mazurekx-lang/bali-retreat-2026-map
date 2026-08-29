const CACHE_NAME = "bali-retreat-2026-v5";

const FILES_TO_CACHE = [
  "./",
  "./offline.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  // PMTiles musi obsługiwać Range Requests bez ingerencji Service Workera
  if (
    url.pathname.endsWith("/ubud.pmtiles") ||
    event.request.headers.has("range")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {

        return caches.open(CACHE_NAME).then(cache => {

          if (event.request.method === "GET") {
            cache.put(event.request, networkResponse.clone());
          }

          return networkResponse;

        });

      });

    })
  );
});
