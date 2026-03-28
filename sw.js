const CACHE_NAME = "smartbed-webble-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "./index.html",
        "./manifest.webmanifest",
        "./src/style.css",
        "./src/smartbed_webble.js",
        "./common/smartbed_init.js",
        "./common/smartbed_ui_common.js",
        "./asset/favicon.ico",
        "./asset/pwa_icon.svg",
      ])
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event && event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Always fetch scripts from network to ensure latest UI logic
  if (req.destination === "script") {
    event.respondWith(fetch(req).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      return cached || Response.error();
    }));
    return;
  }

  // Ignore extension requests which cannot be cached
  if (req.url.startsWith("chrome-extension://")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match("./index.html");
        return cached || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await fetched) || Response.error();
    })()
  );
});
