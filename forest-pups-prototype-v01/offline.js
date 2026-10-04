import "./runtime-cache.js";
const spec = self.ForestPupsCache,
  base = new URL("./", import.meta.url);
export const CACHE_VERSION = spec.version;
export async function offlineStatus() {
  const result = {
    version: spec.version,
    cache: spec.nameFor(base.href),
    registered: false,
    controlled: false,
    ready: false,
    missing: [],
    note: "",
  };
  try {
    if (!("serviceWorker" in navigator) || !("caches" in self)) {
      result.note = "Offline caching unavailable in this browser/context.";
      return result;
    }
    const registration = await navigator.serviceWorker.getRegistration(
      base.href,
    );
    result.registered = !!registration;
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      const worker = await new Promise((resolve) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => {
          channel.port1.close();
          resolve(null);
        }, 1500);
        channel.port1.onmessage = (e) => {
          clearTimeout(timer);
          channel.port1.close();
          resolve(e.data);
        };
        controller.postMessage({ type: "FOREST_PUPS_STATUS" }, [channel.port2]);
      });
      result.controlled = worker?.cache === result.cache;
      result.workerVersion = worker?.version || "unknown";
    }
    if (await caches.has(result.cache)) {
      const cache = await caches.open(result.cache);
      for (const file of spec.files)
        if (!(await cache.match(new URL(file, base).href))?.ok)
          result.missing.push(file);
    } else result.missing = [...spec.files];
    result.ready = result.controlled && result.missing.length === 0;
    result.note = result.ready
      ? "Ready for an offline reload here. Verify Home Screen launch in airplane mode before travel."
      : result.missing.length
        ? "Keep this page open online until all files are cached, then recheck."
        : "Files cached. Reload once to activate this version.";
  } catch (error) {
    result.note = "Storage/cache check unavailable: " + error.message;
  }
  return result;
}
