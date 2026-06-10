// WatchWorthy service worker — makes the app installable and offline-capable.
//
// Strategy (resilient to Vite's hashed asset filenames):
//   • navigations  → network-first, fall back to the cached app shell offline.
//   • same-origin GET (JS/CSS/images/etc.) → stale-while-revalidate: serve from
//     cache instantly if present, and refresh the cache in the background.
// Cross-origin requests (TMDB posters, the Claude/GitHub API) are left to the
// network and never cached, so live agent calls always hit the real endpoint.

const CACHE = 'watchworthy-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // App-shell navigations: network-first, offline fallback to cached index.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }

  if (!sameOrigin) return; // let posters / API calls go straight to the network

  // Static same-origin assets: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
