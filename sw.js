/* Service worker của ứng dụng Hồ sơ dạy học số.
   - Ưu tiên mạng (để bản sửa mới đẩy lên GitHub hiện ngay), mất mạng thì dùng bản đã lưu.
   - Trang nào đã mở một lần thì mở lại được khi không có mạng (hồ sơ, bài giảng, ôn tập).
   - Không đụng tới phòng làm bài trực tuyến (tên miền khác) và mọi yêu cầu không phải GET.
   Khi đổi logic ở đây, tăng số phiên bản VER. */
var VER = 'hsdh-v1', SHELL = ['./Ho-so-day-hoc-so.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VER).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.headers.has('range')) return; // video/âm thanh phát theo đoạn: để trình duyệt tự xử lí
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(VER).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) {
      return m || (r.mode === 'navigate' ? caches.match('./Ho-so-day-hoc-so.html') : Response.error());
    });
  }));
});
