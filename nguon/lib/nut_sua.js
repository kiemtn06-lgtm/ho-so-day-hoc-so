/* NÚT "SỬA" TRÊN TRANG (hồ sơ, bài giảng, ôn tập): giáo viên ghi yêu cầu sửa ngay trên trang đang xem.
   Bấm "Gửi" sẽ mở trang tạo phiếu (Issue) trên GitHub, điền sẵn vị trí, đoạn đang bôi đen và yêu cầu; phiếu có nhãn "sua".
   Claude chạy trên GitHub Actions (.github/workflows/claude-sua.yml) đọc phiếu, sửa tệp, đẩy lên, trả lời và đóng phiếu.
   - Nút chỉ hiện khi đã bật trên máy này: mở trang một lần với ?sua ở cuối địa chỉ (tắt: ?sua=0). Học sinh không thấy nút.
   - Trang không chứa mật khẩu hay khóa nào: phiếu gửi bằng tài khoản GitHub đang đăng nhập trên trình duyệt,
     và chỉ phiếu của chủ kho mới được xử lý.
   - Hồ sơ: dong_goi.js nhúng tệp này vào Ho-so-day-hoc-so.html. Trang bài giảng, ôn tập: tools/gan_nut_sua.js gắn thẻ
     <script src="../nguon/lib/nut_sua.js"> vào cuối trang. */
(function () {
  if (window.__nutSua) return; window.__nutSua = 1;
  var KHO = "kiemtn06-lgtm/ho-so-day-hoc-so", KEY = "hsdh_sua";
  function get() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function set(on) { try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch (e) {} }
  var m = /[?&]sua(=([^&#]*))?/.exec(location.search);
  if (m) set(m[2] !== "0");
  if (!get()) return;

  /* nhớ đoạn bôi đen gần nhất: bấm nút có thể làm mất vùng chọn */
  var chon = "";
  document.addEventListener("selectionchange", function () {
    var s = String(window.getSelection ? window.getSelection() : "").trim();
    if (s && !(hop && hop.contains(document.activeElement))) chon = s;
  });

  function viTri() {
    var p = [];
    try { if (typeof window.HSDH_VITRI === "function") p.push(window.HSDH_VITRI()); } catch (e) {}
    if (!p.length) {
      var tep = decodeURIComponent(location.pathname.split("/").slice(-2).join("/"));
      p.push(tep + (location.hash ? " " + decodeURIComponent(location.hash) : ""));
      try { if (typeof cur === "number") p.push("slide " + (cur + 1) + (typeof slides !== "undefined" && slides.length ? "/" + slides.length : "")); } catch (e) {}
      if (document.title) p.push(document.title);
    }
    return p.join(" · ");
  }
  function cat(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + " …" : s; }

  var css = document.createElement("style");
  css.textContent =
    "#nsNut{position:fixed;right:10px;top:50%;touch-action:none;z-index:2147483000;font:600 13px system-ui,sans-serif;padding:6px 11px;border-radius:18px;border:1px solid #b45309;background:#fff7ed;color:#9a3412;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.18);opacity:.8;user-select:none}" +
    "#nsNut:hover{opacity:1}" +
    "#nsHop{position:fixed;left:10px;bottom:52px;z-index:2147483001;width:min(420px,calc(100vw - 20px));max-height:calc(100vh - 70px);overflow:auto;font:14px/1.45 system-ui,sans-serif;background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:12px;box-sizing:border-box}" +
    "#nsHop b{display:block;margin:6px 0 3px;font-size:13px}#nsHop .vt{font-size:12px;color:#4b5563;word-break:break-word}" +
    "#nsHop textarea{width:100%;box-sizing:border-box;font:14px system-ui,sans-serif;border:1px solid #d1d5db;border-radius:6px;padding:6px;background:#fff;color:#111}" +
    "#nsHop .h{display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap}" +
    "#nsHop button{font:600 13px system-ui,sans-serif;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#f3f4f6;color:#111;cursor:pointer}" +
    "#nsHop button.go{background:#b45309;border-color:#b45309;color:#fff}#nsHop .gc{font-size:12px;color:#6b7280;margin-top:6px}" +
    "@media print{#nsNut,#nsHop{display:none!important}}";
  document.head.appendChild(css);

  var nut = document.createElement("button"), hop = null;
  nut.id = "nsNut"; nut.type = "button"; nut.textContent = "✎ Sửa"; nut.title = "Gửi yêu cầu sửa chỗ đang xem (bôi đen đoạn cần sửa trước khi bấm)";
  nut.addEventListener("mousedown", function (e) { e.preventDefault(); });
  /* Nút kéo được (giữ chuột/ngón tay rồi kéo), vị trí được nhớ: tránh che nút điều khiển của trang (ví dụ nút lùi slide) */
  var vt0 = null, keo = false, bd = null;
  try { vt0 = JSON.parse(localStorage.getItem("nsViTri") || "null"); } catch (e) {}
  function dat(x, y) {
    x = Math.max(0, Math.min(x, window.innerWidth - nut.offsetWidth)); y = Math.max(0, Math.min(y, window.innerHeight - nut.offsetHeight));
    nut.style.left = x + "px"; nut.style.top = y + "px"; nut.style.right = "auto"; nut.style.bottom = "auto"; return { x: x, y: y };
  }
  nut.addEventListener("pointerdown", function (e) { var r = nut.getBoundingClientRect(); bd = { px: e.clientX, py: e.clientY, x: r.left, y: r.top }; keo = false; try { nut.setPointerCapture(e.pointerId); } catch (x) {} });
  nut.addEventListener("pointermove", function (e) {
    if (!bd) return;
    if (!keo && Math.abs(e.clientX - bd.px) + Math.abs(e.clientY - bd.py) < 6) return;
    keo = true; vt0 = dat(bd.x + e.clientX - bd.px, bd.y + e.clientY - bd.py);
  });
  nut.addEventListener("pointerup", function () { if (keo && vt0) { try { localStorage.setItem("nsViTri", JSON.stringify(vt0)); } catch (e) {} } bd = null; });
  nut.addEventListener("pointercancel", function () { bd = null; });
  nut.addEventListener("click", function () { if (keo) { keo = false; return; } if (hop) dong(); else mo(); });

  function dong() { if (hop) hop.remove(); hop = null; }
  function mo(ycSan) {
    dong(); var vt = viTri();
    hop = document.createElement("div"); hop.id = "nsHop";
    hop.innerHTML = '<div style="font-weight:700">Gửi yêu cầu sửa</div>' +
      '<b>Vị trí</b><div class="vt"></div>' +
      '<b>Đoạn cần sửa (đoạn đang bôi đen, sửa lại nếu cần)</b><textarea rows="3" data-k="doan"></textarea>' +
      '<b>Cần sửa thế nào? <button type="button" data-k="noi" title="Nói yêu cầu sửa, trang tự ghi thành chữ" style="float:right;padding:2px 9px" hidden>🎤 Nói</button></b><textarea rows="4" data-k="yc" placeholder="Ví dụ: đáp án câu 3 phải là B; viết lại lời giải cho rõ; công thức bị lỗi hiển thị"></textarea>' +
      '<div class="gc">Bấm Gửi sẽ mở GitHub trong thẻ mới, bấm tiếp <i>Create</i> (hoặc <i>Submit new issue</i>) để gửi. Claude sửa xong sẽ trả lời trong phiếu, trang trên mạng tự cập nhật sau vài phút.</div>' +
      '<div class="h"><button type="button" data-k="huy">Hủy</button><button type="button" class="go" data-k="gui">Gửi</button></div>';
    hop.querySelector(".vt").textContent = vt;
    hop.querySelector('[data-k="doan"]').value = cat(chon, 1500);
    if (ycSan) hop.querySelector('[data-k="yc"]').value = ycSan;
    if (window.TroGiang) hop.querySelector('[data-k="noi"]').hidden = false;   // đọc chính tả (nguon/lib/tro_giang.js)
    document.body.appendChild(hop);
    (function () {   // đặt hộp gần nút, không tràn khỏi màn hình
      var r = nut.getBoundingClientRect(), w = Math.min(420, window.innerWidth - 20);
      hop.style.width = w + "px"; hop.style.left = Math.max(10, Math.min(r.left, window.innerWidth - w - 10)) + "px";
      if (r.top > window.innerHeight / 2) { hop.style.bottom = (window.innerHeight - r.top + 8) + "px"; hop.style.top = "auto"; hop.style.maxHeight = (r.top - 20) + "px"; }
      else { hop.style.top = (r.bottom + 8) + "px"; hop.style.bottom = "auto"; hop.style.maxHeight = (window.innerHeight - r.bottom - 20) + "px"; }
    })();
    hop.querySelector('[data-k="yc"]').focus();
    hop.addEventListener("click", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-k");
      if (k === "huy") dong();
      else if (k === "noi") {
        var o = hop.querySelector('[data-k="yc"]');
        window.TroGiang.docMotCau(function (cau) { if (!hop) return; o.value = (o.value.trim() ? o.value.trim() + " " : "") + cau; o.focus(); });
      }
      else if (k === "gui") {
        var yc = hop.querySelector('[data-k="yc"]').value.trim(), doan = hop.querySelector('[data-k="doan"]').value.trim();
        if (!yc) { hop.querySelector('[data-k="yc"]').focus(); return; }
        var than = "**Vị trí:** " + vt + "\n\n**Trang:** " + location.href.replace(/[?&]sua(=[^&#]*)?/, "") + "\n\n" +
          (doan ? "**Đoạn cần sửa:**\n\n" + doan.split("\n").map(function (l) { return "> " + l; }).join("\n") + "\n\n" : "") +
          "**Yêu cầu sửa:**\n\n" + yc + "\n\n<!-- phieu-sua: gui tu nut Sua tren trang -->";
        var u = "https://github.com/" + KHO + "/issues/new?labels=sua&title=" + encodeURIComponent("Sửa: " + cat(yc.replace(/\s+/g, " "), 70)) + "&body=" + encodeURIComponent(than);
        window.open(u, "_blank", "noopener"); dong(); chon = "";
      }
    });
  }
  function gan() {
    document.body.appendChild(nut); if (vt0) dat(vt0.x, vt0.y);
    /* Trang bài giảng nằm trong khung của Hồ sơ (Dạy ngay): chỉ giữ một nút. Nút của trang bài giảng biết đang ở slide nào nên được giữ,
       nút của trang chứa nó tạm ẩn và hiện lại khi đóng bài giảng. */
    try {
      if (window.parent && window.parent !== window) {
        var cha = window.parent.document.getElementById("nsNut");
        if (cha) { cha.style.display = "none"; window.addEventListener("pagehide", function () { cha.style.display = ""; }); }
      }
    } catch (e) {}
  }
  /* cho trợ giảng giọng nói (nguon/lib/tro_giang.js): lệnh “Sửa …” mở phiếu đã điền sẵn, lệnh “Đóng” đóng phiếu */
  window.HSDH_SUA = { mo: function (yc) { mo(yc || ""); }, dong: dong, dangMo: function () { return !!hop; } };
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
})();
