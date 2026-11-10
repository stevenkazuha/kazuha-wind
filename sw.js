/* 风语 · Service Worker
   策略：
   - 页面与样式脚本：预缓存 + 网络优先（保证更新可见），断网回落到缓存
   - 图片 / 音频：缓存优先（省流量、可离线）
   - 不缓存 POST（TTS 代理）与跨域请求
*/

const VERSION = "kazuha-v5";
const SHELL = `shell-${VERSION}`;
const MEDIA = `media-${VERSION}`;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./chat.html",
  "./story.html",
  "./journey.html",
  "./gallery.html",
  "./login.html",
  "./install.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/home.css",
  "./css/chat.css",
  "./css/story.css",
  "./css/journey.css",
  "./css/gallery.css",
  "./css/login.css",
  "./css/install.css",
  "./js/common.js",
  "./js/voice.js",
  "./js/voice-lines.js",
  "./js/voice-tts.js",
  "./js/chat.js",
  "./js/story.js",
  "./js/story-script.js",
  "./js/journey.js",
  "./js/gallery.js",
  "./js/login.js",
  "./js/install.js",
  "./assets/img/app/icon-192.png",
  "./assets/img/app/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL).then(cache => cache.addAll(SHELL_FILES)).catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== SHELL && key !== MEDIA).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" || req.destination === "document";
  const isMedia = /\.(jpg|jpeg|png|webp|gif|svg|mp3|wav|woff2?)$/i.test(url.pathname);

  if (isPage) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(cache => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  if (isMedia) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(MEDIA).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // 其它静态资源（css/js）：网络优先，失败回落缓存
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(SHELL).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
