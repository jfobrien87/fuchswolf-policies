const CACHE = "forest-pups-p01-1-release-2";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./solar-sprites.js",
  "./game.js",
  "./manifest.webmanifest",
  "./assets/wolf-poses.png",
  "./assets/fox.png",
  "./assets/solar-system.png",
  "./assets/icon.svg",
  "./assets/icon.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("forest-pups-p01-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
