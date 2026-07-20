const CACHE_PREFIX = "bedroom-room-planner-";
const CACHE_NAME = "bedroom-room-planner-v2-04";
const ASSET_VERSION = "2.04";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=2.04",
  "./assets/css/app.css?v=2.04",
  "./assets/js/vendor/three.min.js?v=2.04",
  "./assets/js/vendor/OrbitControls.js?v=2.04",
  "./assets/js/model-data.js?v=2.04",
  "./assets/js/app.js?v=2.04",
  "./assets/js/pwa.js?v=2.04",
  "./assets/icons/icon-192.png?v=2.04",
  "./assets/icons/icon-512.png?v=2.04"
];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  for (const url of APP_SHELL) {
    const request = new Request(url, { cache: "reload" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Unable to cache ${url}: HTTP ${response.status}`);
    await cache.put(url, response);
  }
}

self.addEventListener("install", event => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestURL = new URL(event.request.url);
  if (requestURL.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(new Request(event.request, { cache: "no-store" }));
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: false });
    if (cached) return cached;

    const response = await fetch(event.request);
    if (response.ok && requestURL.searchParams.get("v") === ASSET_VERSION) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  })());
});
