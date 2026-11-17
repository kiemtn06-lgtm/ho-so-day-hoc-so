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
    "#nsNut{position:fixed;left:10px;bottom:10px;z-index:2147483000;font:600 13px system-ui,sans-serif;padding:6px 11px;border-radius:18px;border:1px solid #b45309;background:#fff7ed;color:#9a3412;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.18);opacity:.8;user-select:none}" +
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
  nut.addEventListener("click", function () { if (hop) dong(); else mo(); });

  function dong() { if (hop) hop.remove(); hop = null; }
  function mo() {
    var vt = viTri();
    hop = document.createElement("div"); hop.id = "nsHop";
    hop.innerHTML = '<div style="font-weight:700">Gửi yêu cầu sửa</div>' +
      '<b>Vị trí</b><div class="vt"></div>' +
      '<b>Đoạn cần sửa (đoạn đang bôi đen, sửa lại nếu cần)</b><textarea rows="3" data-k="doan"></textarea>' +
      '<b>Cần sửa thế nào?</b><textarea rows="4" data-k="yc" placeholder="Ví dụ: đáp án câu 3 phải là B; viết lại lời giải cho rõ; công thức bị lỗi hiển thị"></textarea>' +
      '<div class="gc">Bấm Gửi sẽ mở GitHub trong thẻ mới, bấm tiếp <i>Create</i> (hoặc <i>Submit new issue</i>) để gửi. Claude sửa xong sẽ trả lời trong phiếu, trang trên mạng tự cập nhật sau vài phút.</div>' +
      '<div class="h"><button type="button" data-k="huy">Hủy</button><button type="button" class="go" data-k="gui">Gửi</button></div>';
    hop.querySelector(".vt").textContent = vt;
    hop.querySelector('[data-k="doan"]').value = cat(chon, 1500);
    document.body.appendChild(hop);
    hop.querySelector('[data-k="yc"]').focus();
    hop.addEventListener("click", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-k");
      if (k === "huy") dong();
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
  function gan() { document.body.appendChild(nut); }
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
})();
