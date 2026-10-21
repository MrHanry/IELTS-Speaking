const CACHE_NAME = 'ielts-Speaking-pro-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];
const PROFILE_FILE = 'information.txt';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      // File hồ sơ là tùy chọn: thiếu file cũng không làm hỏng việc cài đặt
      try { await cache.add('./' + PROFILE_FILE); } catch (e) {}
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // File hồ sơ: ưu tiên bản mới nhất từ mạng (để sửa file là thấy ngay), mất mạng thì dùng bản đã lưu
  if (url.origin === self.location.origin && url.pathname.endsWith('/' + PROFILE_FILE)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((response) => {
      return response || fetch(req);
    })
  );
});
