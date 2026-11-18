/* Âm thanh cho mọi thao tác bấm trên các trang của hồ sơ (bài giảng, ôn tập, bài tập, trang chính).
   Một tệp dùng chung, tự gắn vào trang (xem tools/gan_nut_sua.js). Không cần sửa từng nút.
   - bấm nút, liên kết, thẻ, ô chọn, danh sách chọn...: tiếng "tách" nhẹ
   - nút mở/hiện (Hiện đáp án, Mở...): hai nốt đi lên; nút ẩn/đóng (Ẩn đáp án, Đóng...): hai nốt đi xuống
   - chuyển slide/bài bằng phím mũi tên, PageUp/PageDown, O, F: tiếng "tách"
   - bấm vào phương án làm hiện kết quả đúng/sai: thêm tiếng đúng (chuông) hoặc sai (trầm)
   Nút loa nhỏ ở góc trên bên phải để tắt/bật tiếng (nhớ lựa chọn). Đặt data-im="1" lên phần tử nếu muốn nó im lặng. */
(function () {
  if (window.__amThanh) return; window.__amThanh = 1;
  var KHOA = "amThanhTat", tat = false, AC = null;
  try { tat = localStorage.getItem(KHOA) === "1"; } catch (e) {}

  function ngu() {
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; }
    return AC;
  }
  function nghe(tanSo, dai, to, kieu, tre) {
    var a = ngu(); if (!a || tat) return;
    var t0 = a.currentTime + (tre || 0), o = a.createOscillator(), g = a.createGain();
    o.type = kieu || "sine"; o.frequency.setValueAtTime(tanSo, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(to || 0.12, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dai);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dai + 0.02);
  }
  var tiengCu = {
    tach: function () { nghe(720, 0.05, 0.10, "triangle"); },
    mo: function () { nghe(520, 0.09, 0.10, "sine"); nghe(780, 0.12, 0.10, "sine", 0.07); },
    dong: function () { nghe(700, 0.09, 0.09, "sine"); nghe(470, 0.12, 0.09, "sine", 0.07); },
    dung: function () { nghe(660, 0.10, 0.12, "sine"); nghe(880, 0.10, 0.12, "sine", 0.09); nghe(1320, 0.22, 0.10, "sine", 0.18); },
    sai: function () { nghe(240, 0.16, 0.12, "sawtooth"); nghe(190, 0.22, 0.12, "sawtooth", 0.13); }
  };
  function phat(k) { try { (tiengCu[k] || tiengCu.tach)(); } catch (e) {} }
  window.addEventListener("storage", function (e) { if (e.key === KHOA) { tat = e.newValue === "1"; capNhat(); } });
  window.amThanh = { phat: phat, tat: function (b) { tat = !!b; try { localStorage.setItem(KHOA, tat ? "1" : "0"); } catch (e) {} capNhat(); } };

  var CHON = 'button, a[href], summary, select, [role="button"], [role="tab"], [role="option"], [role="menuitem"], input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], label, [onclick], [data-act], [data-a], .btn, .opt, .chip, .tab';
  var MO = /(^|\s)(hiện|hiển thị|mở|xem|bật|bắt đầu|tiếp|show|open)(\s|$|:)/i, DONG = /(^|\s)(ẩn|đóng|tắt|hủy|huỷ|dừng|kết thúc|hide|close)(\s|$|:)/i;
  var DUNG = /(^|[-_ ])(correct|right|dung|ok|good|pass|is-ok)([-_ ]|$)/i, SAI = /(^|[-_ ])(wrong|sai|bad|incorrect|fail|is-bad)([-_ ]|$)/i;
  function chu(el) { return ((el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.value || "") + "").replace(/\s+/g, " ").trim().slice(0, 40); }
  function quanTam(el) { // phần tử có thể bấm gần nhất, bỏ qua phần tử bị vô hiệu hoặc đặt im lặng
    var e = el && el.closest ? el.closest(CHON) : null;
    if (!e || e.id === "amNut") return null;
    if (e.disabled || e.getAttribute("aria-disabled") === "true" || e.closest("[data-im]")) return null;
    if (e.tagName === "LABEL" && !e.querySelector("input,select")) return null;   // nhãn trơn không phải thao tác
    return e;
  }

  var theoDoi = null, ketQua = null;
  function bat(goc) {   // sau khi bấm, nếu trong vùng đó xuất hiện lớp đúng/sai thì phát thêm tiếng kết quả
    ketQua = null; if (theoDoi) theoDoi.disconnect();
    var vung = goc.closest("section, article, .card, .q, .cau, li, form, [class*=quiz], [class*=cau]") || goc.parentNode;
    try {
      theoDoi = new MutationObserver(function (ds) {
        for (var i = 0; i < ds.length && !ketQua; i++) {
          var m = ds[i], c = m.target && m.target.className; if (typeof c !== "string") continue;
          var cu = m.oldValue || "";
          if (c === cu) continue;
          if (SAI.test(c) && !SAI.test(cu)) ketQua = "sai"; else if (DUNG.test(c) && !DUNG.test(cu)) ketQua = "dung";
        }
      });
      theoDoi.observe(vung, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
      setTimeout(function () { if (theoDoi) theoDoi.disconnect(); theoDoi = null; if (ketQua) phat(ketQua); }, 220);
    } catch (e) {}
  }

  document.addEventListener("click", function (ev) {
    if (!ev.isTrusted) return;
    var e = quanTam(ev.target); if (!e) return;
    var t = chu(e), k = "tach";
    if (/^(BUTTON|A|SUMMARY)$/.test(e.tagName) || e.getAttribute("role") === "button") { if (DONG.test(t)) k = "dong"; else if (MO.test(t)) k = "mo"; }
    phat(k); bat(e);
  }, true);
  document.addEventListener("change", function (ev) { if (ev.isTrusted && ev.target && ev.target.tagName === "SELECT" && !ev.target.closest("[data-im]")) phat("tach"); }, true);
  document.addEventListener("keydown", function (ev) {
    if (!ev.isTrusted || ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
    var t = ev.target && ev.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(t) || (ev.target && ev.target.isContentEditable)) return;
    if (/^(ArrowLeft|ArrowRight|PageUp|PageDown|Home|End)$/.test(ev.key) || /^[ofOF]$/.test(ev.key)) phat("tach");
  }, true);

  /* nút loa: tắt/bật tiếng */
  var nut = null;
  function capNhat() { if (nut) { nut.textContent = tat ? "🔇" : "🔊"; nut.title = tat ? "Đang tắt tiếng thao tác (bấm để bật)" : "Tắt tiếng thao tác"; } }
  function gan() {
    if (window.top !== window.self) return;   // trang nằm trong khung: dùng nút loa của trang chứa nó (cùng lựa chọn qua localStorage)
    var css = document.createElement("style");
    css.textContent = "#amNut{position:fixed;right:8px;top:8px;z-index:2147482990;width:30px;height:30px;padding:0;border-radius:50%;border:1px solid #cbd5e1;background:rgba(255,255,255,.85);color:#334155;font:15px/1 system-ui,sans-serif;cursor:pointer;opacity:.55;box-shadow:0 1px 4px rgba(0,0,0,.15)}#amNut:hover{opacity:1}@media print{#amNut{display:none!important}}";
    document.head.appendChild(css);
    nut = document.createElement("button"); nut.id = "amNut"; nut.type = "button"; nut.setAttribute("data-im", "1");
    nut.addEventListener("click", function () { window.amThanh.tat(!tat); if (!tat) phat("mo"); });
    document.body.appendChild(nut); capNhat();
  }
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
})();
