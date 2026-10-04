importScripts("./runtime-cache.js");
const spec = self.ForestPupsCache;
const CACHE = spec.nameFor(self.registration.scope);
const urls = spec.files.map(
  (path) => new URL(path, self.registration.scope).href,
);
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(urls))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      // Remove only this application's older scope-specific caches. Other Pages apps
      // on the same origin and legacy globally-named caches are deliberately untouched.
      const encodedScope = encodeURIComponent(new URL(self.registration.scope).pathname);
      for (const key of await caches.keys())
        if (
          key.match(/^forest-pups-p\d+-v\d+-(.+)$/)?.[1] === encodedScope &&
          key !== CACHE
        )
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "FOREST_PUPS_STATUS")
    event.ports[0]?.postMessage({
      version: spec.version,
      cache: CACHE,
      scope: self.registration.scope,
    });
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  const clean = new URL(url);
  clean.search = "";
  clean.hash = "";
  if (!urls.includes(clean.href)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(clean.href)) || fetch(event.request);
    })(),
  );
});
