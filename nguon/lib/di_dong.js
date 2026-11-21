/* ỨNG DỤNG DI ĐỘNG (PWA): đăng ký service worker, nút "Bài" mở ngăn menu trên điện thoại,
   nút cài ứng dụng ra màn hình chính. Giao diện co giãn nằm ở style.css (cuối tệp, khối "Ứng dụng di động"). */
(function () {
  if (window.__diDong) return; window.__diDong = 1;
  /* 1. service worker (chỉ chạy khi mở qua https hoặc localhost; mở file:// thì bỏ qua) */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  /* 2. ngăn menu bài học trên màn hình nhỏ */
  var top = document.querySelector('.top'), tree = document.getElementById('tree');
  if (top && tree) {
    var nut = document.createElement('button');
    nut.id = 'nutMenu'; nut.type = 'button'; nut.setAttribute('aria-label', 'Mở danh sách bài'); nut.setAttribute('aria-expanded', 'false');
    nut.innerHTML = '<span aria-hidden="true">☰</span> Bài';
    top.insertBefore(nut, top.firstChild);
    var man = document.createElement('div'); man.id = 'manMenu'; man.hidden = true; document.body.appendChild(man);
    var dong = function (on) { document.body.classList.toggle('menu-open', on); man.hidden = !on; nut.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    nut.addEventListener('click', function () { dong(!document.body.classList.contains('menu-open')); });
    man.addEventListener('click', function () { dong(false); });
    tree.addEventListener('click', function (e) { if (e.target.closest('button')) { dong(false); try { window.scrollTo(0, 0); } catch (x) {} } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dong(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) dong(false); });
  }
  /* 3. nút cài ứng dụng (Android/Chrome/Edge); iPhone: Chia sẻ → Thêm vào MH chính */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    if (matchMedia('(display-mode: standalone)').matches || !top) return;
    var b = document.createElement('button'); b.id = 'nutCai'; b.type = 'button'; b.textContent = '⬇ Cài ứng dụng';
    b.addEventListener('click', function () { b.remove(); e.prompt(); });
    top.appendChild(b);
  });
})();
