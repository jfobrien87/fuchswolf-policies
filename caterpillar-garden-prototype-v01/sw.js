const CACHE = 'caterpillar-garden-v5';
const ROOT = new URL('./', self.location.href).href;
const FILES = ['./', './index.html', './styles.css', './config.js', './levels.js', './game.js', './assets/manifest.json'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const response = await fetch(new URL('./assets/manifest.json', ROOT), { cache: 'reload' });
  if (!response.ok) throw new Error('Asset manifest unavailable');
  const manifest = await response.json();
  const art = Object.values(manifest.shapes).flatMap(Object.values);
  const cache = await caches.open(CACHE);
  await cache.addAll([...FILES, ...art, manifest.caterpillar.image, manifest.caterpillar.metadata].map(path => new URL(path, ROOT).href));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('caterpillar-garden-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(ROOT)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match(new URL('./index.html', ROOT).href);
      throw error;
    }
  })());
});
