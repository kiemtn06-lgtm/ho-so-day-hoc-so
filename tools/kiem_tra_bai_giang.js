/* RÀ TỰ ĐỘNG một bài giảng tương tác rời (chạy trong trình duyệt, trên trang bài giảng).
   Cách dùng: mở bai-giang/k10-B13.html qua máy chủ thử, rồi trong Console gõ:
     var s=document.createElement('script');s.src='/tools/kiem_tra_bai_giang.js';document.body.appendChild(s)
     await HSDH_KT.tatCa()
   Báo: slide tràn khung 1280x720, khối bị cắt, ảnh hỏng, công thức KaTeX lỗi, nhãn vectơ trên hình vẽ đè nhau hoặc ra ngoài hình. */
window.HSDH_KT = (function () {
  var ngu = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function khung() {
    var st = document.getElementById('stage'), out = [], sc = st.getBoundingClientRect().width / 1280;
    for (var i = 0; i < slides.length; i++) {
      go(i); var s = slides[i], iss = [], maxB = 0, r0 = st.getBoundingClientRect();
      s.querySelectorAll('.step').forEach(function (e) { e.classList.add('show'); });
      s.querySelectorAll('*').forEach(function (e) {
        if ((e.closest('svg') && e.tagName !== 'svg') || e.closest('.katex')) return;
        if (e.closest('.xbody') && !e.classList.contains('xbody')) return;
        var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        var b = (r.bottom - r0.top) / sc, rt = (r.right - r0.left) / sc, l = (r.left - r0.left) / sc;
        maxB = Math.max(maxB, b);
        if (rt > 1281 || l < -1) iss.push('NGANG ' + e.tagName + '.' + e.className);
        if ((cs.overflowY === 'hidden') && e.scrollHeight > e.clientHeight + 3 && e !== s) iss.push('CẮT ' + e.tagName + '.' + e.className + ' ' + e.scrollHeight + '>' + e.clientHeight);
      });
      if (maxB > 666) iss.push('TRÀN ĐÁY ' + Math.round(maxB));
      s.querySelectorAll('.katex').forEach(function (kx) {
        if (kx.parentElement.closest('.katex') || kx.closest('.xbody') || !kx.getBoundingClientRect().width) return;
        var p = kx.closest('.panel,.eq,button,td,.zone') || s, a = kx.getBoundingClientRect(), b = p.getBoundingClientRect();
        if (a.right > b.right + 2 || a.left < b.left - 2) iss.push('CÔNG THỨC TRÀN KHỐI: ' + kx.textContent.slice(0, 30));
      });
      s.querySelectorAll('img').forEach(function (im) { if (!im.naturalWidth) iss.push('ẢNH HỎNG ' + (im.dataset.img || '')); });
      var ke = s.querySelectorAll('.katex-error').length; if (ke) iss.push('KATEX LỖI ' + ke);
      if (iss.length) out.push((i + 1) + '. ' + s.dataset.title + ': ' + iss.filter(function (x, k) { return iss.indexOf(x) === k; }).slice(0, 6).join(' | '));
    }
    go(0); return out;
  }
  /* duyệt mọi câu của các slide củng cố (data-qset): xem câu nào tràn khung trước và sau khi chấm */
  async function cauHoi() {
    var out = [];
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i]; if (!s.dataset.qset) continue; go(i);
      var box = s.querySelector('.qbox'), bC = s.querySelector('.qcheck'), bN = s.querySelector('.qnext'), n = 0;
      var rr = box.querySelector('#rr'); if (rr) rr.click();
      while (n++ < 40) {
        var tag = (i + 1) + '. ' + s.dataset.title + ' câu ' + n;
        if (box.scrollHeight > box.clientHeight + 3) out.push(tag + ': ĐỀ TRÀN ' + box.scrollHeight + '>' + box.clientHeight);
        var o = box.querySelector('.opt'); if (o) o.click();
        box.querySelectorAll('.dsrow').forEach(function (r) { r.querySelector('button').click(); });
        var t = box.querySelector('.tin'); if (t) t.value = '1';
        if (bC.style.display !== 'none') bC.click();
        await ngu(30);
        if (box.scrollHeight > box.clientHeight + 3) out.push(tag + ': SAU CHẤM TRÀN ' + box.scrollHeight + '>' + box.clientHeight);
        var fb = s.querySelector('.qfb'), st = document.getElementById('stage'), sc = st.getBoundingClientRect().width / 1280;
        if (fb && (fb.getBoundingClientRect().bottom - st.getBoundingClientRect().top) / sc > 666) out.push(tag + ': LỜI GIẢI TRÀN ĐÁY');
        if (box.querySelector('.katex-error') || (fb && fb.querySelector('.katex-error'))) out.push(tag + ': KATEX LỖI');
        if (bN.style.display === 'none') break;
        var last = /kết quả/i.test(bN.textContent); bN.click(); if (last) break;
      }
      var r2 = box.querySelector('#rr'); if (r2) r2.click();
    }
    go(0); return out;
  }
  async function nhan() {
    if (typeof vlab !== 'function') return ['(bài này không dùng vlab)'];
    var rec = [], goc = window.vlab, out = [];
    window.vlab = function (c) { var r = goc.apply(this, arguments); if (c.__hsdhBox) rec.push(c.__hsdhBox); return r; };
    function check(tag) {
      var iss = [];
      for (var i = 0; i < rec.length; i++) {
        var a = rec[i]; if (a.doi) iss.push('đã dời ' + a.lab); if (a.x < 0 || a.y < 0 || a.x + a.w > a.cw || a.y + a.h > a.ch) iss.push('RA NGOÀI ' + a.lab);
        for (var j = i + 1; j < rec.length; j++) { var b = rec[j], ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 6 && oy > 6) iss.push('ĐÈ ' + a.lab + ' ~ ' + b.lab); }
      }
      if (iss.length) out.push(tag + ': ' + iss.filter(function (x, k) { return iss.indexOf(x) === k; }).join('; '));
    }
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i]; if (!s.querySelector('canvas')) continue; go(i); await ngu(80);
      var h = HOOKS[s.dataset.title]; if (!h) continue;
      var rs = [].slice.call(s.querySelectorAll('input[type=range]')), def = rs.map(function (r) { return r.value; });
      rec.length = 0; h(); check((i + 1) + ' ' + s.dataset.title + ' [mặc định]');
      for (var k = 0; k < rs.length; k++) { var r = rs[k]; [r.min, r.max].forEach(function (v) { r.value = v; rec.length = 0; try { (r.oninput || h)(); } catch (e) { out.push('LỖI ' + e.message); } check((i + 1) + ' [' + r.id + '=' + v + ']'); }); r.value = def[k]; }
      h();
    }
    window.vlab = goc; go(0); return out;
  }
  return { khung: khung, cauHoi: cauHoi, nhan: nhan, tatCa: async function () { return { khung: khung(), cauHoi: await cauHoi(), nhan: await nhan() }; } };
})();
