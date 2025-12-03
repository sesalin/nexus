self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("nexdomos-shell-v1").then((cache) => {
      return cache.addAll(["/app", "/manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/app")) {
    event.respondWith(
      caches.match(event.request).then((resp) => resp || fetch(event.request))
    );
  }
});
