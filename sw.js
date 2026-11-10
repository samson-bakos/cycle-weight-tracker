// Offline support for the Home Screen app.
// Network-first: when online, always load the latest version (bypassing the HTTP
// cache), and keep a copy; when offline (or the network is very slow), use the copy.
// Data is NOT stored here (it lives in the page's localStorage); this only caches the app.
const CACHE = 'cycle-weight-v3';
const TIMEOUT_MS = 4000;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html']).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fromNet = fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, TIMEOUT_MS, null));
    try {
      const res = await Promise.race([fromNet, timeout]);
      if (res) return res;
    } catch (_) { /* offline */ }
    const cached = await cache.match(req, { ignoreSearch: true });
    return cached || fromNet;
  })());
});
