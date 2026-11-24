// TaniSim service worker. The build stamps VERSION and PRECACHE (scripts/build-pwa.mjs).
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = `tanisim-shell-${VERSION}`;
const RUNTIME = 'tanisim-runtime-v1'; // fonts + diagram library, kept across app updates

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
  // The first install takes over straight away; later updates wait for the user to tap "Reload".
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('tanisim-shell-') && key !== SHELL) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App pages: always answer with the cached shell, so the app opens offline.
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match('./index.html', { cacheName: SHELL }).then((hit) => hit || fetch(req))
    );
    return;
  }

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Same-origin files: precached shell first, then the runtime cache, then the network.
  event.respondWith(
    (async () => {
      const hit = (await caches.match(req, { cacheName: SHELL })) || (await caches.match(req, { cacheName: RUNTIME }));
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && url.pathname.endsWith('/vendor/mermaid.min.js')) {
        (await caches.open(RUNTIME)).put(req, res.clone());
      }
      return res;
    })()
  );
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || refresh;
}
