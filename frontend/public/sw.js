const CACHE = "opentip-v3";
const SHELL = ["/tip", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/Opentip.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") || e.request.url.includes("/platform/")) return;
  // `/tip` is in the app shell, and that document contains the server-rendered
  // session. Cache-first would replay a signed-out snapshot on every full
  // load of the tip home. Navigations go to the network, and the shell is
  // only a fallback when the network is unavailable.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});

// Same logic as frontend/lib/notification-url.ts. This classic worker
// cannot load that module, so keep the two copies in sync.
function sameOriginNotificationUrl(raw, origin) {
  let base;
  try {
    base = new URL(origin);
  } catch {
    return "/tip";
  }
  const fallback = new URL("/tip", base).href;
  try {
    const input = typeof raw === "string" && raw.trim() ? raw : "/tip";
    const url = new URL(input, base);
    if (url.origin !== base.origin) return fallback;
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.href;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "Opentip";
  const body = data.body || "You have a new notification";
  const icon = "/icons/icon-192.png";
  const badge = "/icons/icon-192.png";
  const tag = data.tag || "opentip-notification";
  const url = sameOriginNotificationUrl(data.url, self.location.origin);

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url },
      requireInteraction: false,
      renotify: true,
      silent: false,
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = sameOriginNotificationUrl(e.notification.data?.url, self.location.origin);
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url === url && "focus" in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
