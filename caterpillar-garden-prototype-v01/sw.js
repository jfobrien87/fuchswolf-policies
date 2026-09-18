const CACHE = 'caterpillar-garden-v6';
const ROOT = new URL('./', self.location.href).href;
const FILES = ['./', './index.html', './styles.css', './config.js', './levels.js', './audio.js', './game.js', './assets/manifest.json'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const response = await fetch(new URL('./assets/manifest.json', ROOT), { cache: 'reload' });
  if (!response.ok) throw new Error('Asset manifest unavailable');
  const manifest = await response.json();
  const art = Object.values(manifest.shapes).flatMap(Object.values);
  const sounds = [manifest.audio.music, ...Object.values(manifest.audio.sfx)];
  const cache = await caches.open(CACHE);
  await cache.addAll([...FILES, ...art, ...sounds, manifest.caterpillar.image, manifest.caterpillar.metadata].map(path => new URL(path, ROOT).href));
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
    if (cached) {
      const range = event.request.headers.get('range');
      return range ? rangedResponse(cached, range) : cached;
    }
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match(new URL('./index.html', ROOT).href);
      throw error;
    }
  })());
});

// Safari requests byte ranges for media, including its initial bytes=0-1 probe.
// Keep one complete cached file and serve partial responses from it while offline.
async function rangedResponse(response, range) {
  const bytes = await response.arrayBuffer(), length = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${length}` } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), length - 1) : length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) return invalid();
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(end - start + 1));
  headers.delete('Content-Encoding');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}
