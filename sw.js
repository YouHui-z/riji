/* 日迹 · service worker */
const VER = "riji-v6";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/Jiayou.ttf",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/favicon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VER).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 字体等跨域资源：缓存优先，缓存不到就网络取并留存
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(VER).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // 同源：先给缓存，后台更新
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VER).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
