/* TRỢ GIẢNG GIỌNG NÓI trên trang bài giảng, ôn tập: giáo viên nói lệnh, trang tự làm.
   Lệnh (nói ngắn, tách riêng một câu):
     Chuyển / Tiếp / Sang      → slide tiếp (hoặc hiện bước tiếp theo của slide)
     Lùi / Quay lại            → slide trước
     Chuyển slide 5 / Slide 5  → đến slide số 5; "Về đầu", "Slide cuối"
     Đáp án / Hiện đáp án      → bấm nút Hiện/Xem đáp án (lời giải) đang thấy trên màn hình; "Ẩn đáp án" để ẩn
     Gọi tên                   → gọi tên ngẫu nhiên (công cụ 👥 Lớp của bài giảng, hoặc nút Gọi tên của Hồ sơ)
     Mô phỏng                  → mở mô phỏng của slide đang chiếu
     Đóng / Tắt                → đóng khung đang mở (mô phỏng, gọi tên, bảng công cụ, phiếu Sửa…)
     Sửa <yêu cầu>             → mở phiếu ✎ Sửa, điền sẵn yêu cầu vừa nói; cô đọc lại rồi tự bấm Gửi
     Trợ giúp                  → hiện bảng lệnh
   - Nút 🎤 chỉ hiện trên máy đã bật nút Sửa (mở trang một lần với ?sua), học sinh không thấy.
     Bấm 🎤 để bắt đầu nghe liên tục, bấm lần nữa để tắt. Nút kéo được, vị trí được nhớ.
   - Nhận giọng nói bằng Web Speech API của trình duyệt (Chrome, Edge; cần mạng, âm thanh được gửi tới máy chủ của trình duyệt
     để chuyển thành chữ). Không lưu, không gửi đi nơi nào khác. Không đọc tên, điểm học sinh vào micro.
   - Không sửa trang nào: chỉ bấm hộ các nút và phím có sẵn (→ ← Esc, G, M), nên dùng được cho mọi kiểu trang.
   - Gắn vào trang bằng tools/gan_nut_sua.js (cùng nút Sửa). Trong khung con (trang tương tác của K10 Bài 13) thì không hiện. */
(function () {
  if (window.TroGiang) return;
  try { if (localStorage.getItem("hsdh_sua") !== "1") return; } catch (e) { return; }
  try {
    var fe = window.frameElement;
    if (fe && (fe.classList.contains("ttf") || (window.parent && window.parent.TroGiang))) return;
  } catch (e) {}
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------- tiện ích ---------- */
  function bo(s) {   // bỏ dấu, chữ thường, bỏ dấu câu
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
      .replace(/[.,!?;:"“”'()…-]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function soChu(s) {   // "5", "mười hai", "hai mươi mốt" → số; không có thì null
    var m = /\d+/.exec(s); if (m) return +m[0];
    var D = { khong: 0, mot: 1, mo: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9 };
    var w = s.split(" "), i, so = null, chuc = null;
    for (i = 0; i < w.length; i++) {
      var t = w[i];
      if (t === "muoi") { chuc = (so === null ? 1 : so); so = null; continue; }
      if (t === "linh" || t === "le") continue;
      if (t in D) { if (so !== null && chuc === null) break; so = D[t]; }
      else if (so !== null || chuc !== null) break;
    }
    if (chuc !== null) return chuc * 10 + (so || 0);
    return so;
  }
  function hien(el) {   // phần tử đang thấy trên màn hình
    if (!el || !el.getClientRects || !el.getClientRects().length) return false;
    var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    var cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.visibility !== "hidden" && +cs.opacity !== 0 && !el.disabled;
  }
  function phim(k, d) {   // giả lập bấm phím trên trang
    d = d || document;
    var t = d.body || d.documentElement;
    t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    t.dispatchEvent(new KeyboardEvent("keyup", { key: k, bubbles: true, cancelable: true }));
  }
  function cacTrang() {   // trang này + khung con cùng nguồn đang hiện (trang tương tác nhúng trong bài giảng)
    var ds = [document];
    [].forEach.call(document.querySelectorAll("iframe"), function (f) {
      try { if (hien(f) && f.contentDocument && f.contentDocument.body) ds.push(f.contentDocument); } catch (e) {}
    });
    return ds;
  }
  var CUA_TOI = "#tgNut,#tgBao,#tgHop,#nsNut,#nsHop,#hl-nut";
  function timNut(mau, goc) {   // nút đang hiện có chữ khớp mẫu (mẫu thử lần lượt, mẫu trước ưu tiên)
    var ds = goc ? [goc] : cacTrang(), ung = [];
    ds.forEach(function (d) {
      [].forEach.call(d.querySelectorAll("button,summary,[role=button],a,.btn,[onclick]"), function (b) {
        if (b.closest(CUA_TOI) || !hien(b)) return;
        ung.push({ el: b, t: bo(b.textContent || b.value || b.getAttribute("aria-label") || "") });
      });
    });
    for (var i = 0; i < mau.length; i++)
      for (var j = 0; j < ung.length; j++) if (ung[j].t.length < 40 && mau[i].test(ung[j].t)) return ung[j].el;
    return null;
  }
  function oTrong(mo) {   // ô đáp án dạng [data-g=blank] đang hiện trên màn hình: mo=false lấy ô chưa mở, true lấy ô đã mở
    var kq = [];
    cacTrang().forEach(function (d) { [].forEach.call(d.querySelectorAll('[data-g="blank"]'), function (x) { if (hien(x) && x.classList.contains("open") === mo) kq.push(x); }); });
    return kq;
  }
  function mpMo() { try { return !!(window.MP && MP.dangMo && MP.dangMo()); } catch (e) { return false; } }
  function hopMP() { var k = document.getElementById("mpK"); return mpMo() && k ? k : null; }

  /* ---------- các việc ---------- */
  var VIEC = {
    tiep: function () {
      if (mpMo()) MP.dong();
      if (document.querySelector(".hl-ov")) phim("Escape");
      phim("ArrowRight"); return "Slide tiếp";
    },
    lui: function () {
      if (mpMo()) MP.dong();
      if (document.querySelector(".hl-ov")) phim("Escape");
      phim("ArrowLeft"); return "Slide trước";
    },
    den: function (n) {
      var go_ = window.go, tong = null, c = null;
      try { tong = slides.length; c = cur; } catch (e) {}
      var toc = document.querySelectorAll('.bg-toc [data-g="goto"]'), bw = document.getElementById("bgwrap");   // bài giảng K12 (ôn tập chương)
      if ((typeof go_ !== "function" || typeof c !== "number" || !tong) && toc.length && bw && bw.offsetParent) {
        if (n === "cuoi") n = toc.length; if (n < 1 || n > toc.length) return "!Bài này có " + toc.length + " slide";
        toc[n - 1].click(); var tc = document.querySelector(".bg-toc"); if (tc) tc.hidden = true;
        return "Slide " + n + " / " + toc.length;
      }
      if (typeof go_ !== "function" || typeof c !== "number" || !tong) return "!Trang này không chuyển theo số slide được, nói “Chuyển” hoặc “Lùi”";
      if (n === "cuoi") n = tong; if (n < 1 || n > tong) return "!Chỉ có " + tong + " slide";
      if (mpMo()) MP.dong();
      if (document.querySelector(".hl-ov")) phim("Escape");
      go_(n - 1); return "Slide " + n + " / " + tong;
    },
    dapAn: function () {
      var goc = hopMP() || undefined;   // mô phỏng đang mở: chỉ tìm trong khung mô phỏng
      var b = timNut([/^(👁 )?(hien|xem|mo) (tat ca )?(dap an|loi giai|ket qua)/, /^(dap an|loi giai)$/], goc);
      if (!b) {
        if (timNut([/^(👁 )?an (tat ca )?(dap an|loi giai)/], goc)) return "!Đáp án đang hiện rồi";
        var o = oTrong(false);   // ô “?” bấm vào mới hiện đáp án (bài giảng K12)
        if (o.length) { o.forEach(function (x) { x.click(); }); return "Hiện " + o.length + " ô đáp án"; }
        var kt = timNut([/^(✓ )?kiem tra( dap an| ket qua)?$/], goc);   // câu trắc nghiệm, Đúng/Sai: bấm Kiểm tra để hiện đúng sai và lời giải
        if (kt) { kt.click(); return "Bấm “Kiểm tra”"; }
        var buoc = cacTrang().some(function (d) { return d.querySelector(".slide.on .step:not(.show),.bg-s.on .bg-step:not(.vis)"); });
        return "!Màn hình này không có nút Đáp án" + (buoc ? ": nói “Chuyển” để hiện bước tiếp" : "");
      }
      b.click(); return "Hiện đáp án";
    },
    anDapAn: function () {
      var b = timNut([/^(👁 )?an (tat ca )?(dap an|loi giai|ket qua)/], hopMP() || undefined);
      var o = oTrong(true);
      if (!b && o.length) { o.forEach(function (x) { x.click(); }); return "Ẩn " + o.length + " ô đáp án"; }
      if (!b) return "!Không thấy nút Ẩn đáp án";
      b.click(); return "Ẩn đáp án";
    },
    goiTen: function () {
      if (document.getElementById("hl-nut")) {
        var ov = document.querySelector(".hl-ov");
        if (ov) phim("Escape");
        setTimeout(function () { phim("g"); }, ov ? 80 : 0);
        return "Gọi tên";
      }
      try { var g = window.parent !== window && window.parent.document.getElementById("llGoi"); if (g) { g.click(); return "Gọi tên"; } } catch (e) {}
      return "!Trang này chưa có công cụ Gọi tên";
    },
    moPhong: function () {
      var b = document.getElementById("bMP");
      if (mpMo()) return "!Mô phỏng đang mở";
      if (b && !b.hidden && hien(b)) { b.click(); return "Mở mô phỏng"; }
      b = timNut([/^(▶ )?(mo|chay|xem) mo phong/, /^mo phong/]);
      if (b) { b.click(); return "Mở mô phỏng"; }
      return "!Slide này không có mô phỏng";
    },
    dong: function () {
      if (hop) { dongHop(); return "Đóng bảng lệnh"; }
      try { if (window.HSDH_SUA && HSDH_SUA.dangMo()) { HSDH_SUA.dong(); return "Đóng phiếu Sửa"; } } catch (e) {}
      if (mpMo()) { MP.dong(); return "Đóng mô phỏng"; }
      var b = timNut([/^(dong|✕|×|x)$/, /^dong /]);
      if (document.querySelector(".hl-ov") || !b) { phim("Escape"); return "Đóng"; }
      b.click(); return "Đóng";
    },
    sua: function (yc) {
      if (!window.HSDH_SUA) return "!Chưa bật nút ✎ Sửa trên trang này";
      HSDH_SUA.mo(yc); return "Mở phiếu Sửa: cô đọc lại rồi bấm Gửi";
    },
    giup: function () { moHop(); return "Bảng lệnh"; }
  };

  /* ---------- hiểu lệnh: trả về [việc, tham số] hoặc null ---------- */
  function hieu(cau) {
    var goc = String(cau || "").trim(), n = bo(goc), m;
    if (!n) return null;
    n = n.replace(/^(tro giang|tro ly|robot|ro bot|oi|nao|em oi)\s+/, "").replace(/\s+(di|nao|nhe|lai nao|giup co|cho co)$/, "");
    if ((m = /^(sua|can sua|ghi sua|phieu sua)(\s+(.*))?$/.exec(n))) {
      var bo1 = goc.replace(/^\s*(trợ giảng|trợ lý|robot)?[\s,]*(cần sửa|ghi sửa|phiếu sửa|sửa)\s*[:,]?\s*/i, "");
      return ["sua", bo1 === goc ? (m[3] || "") : bo1];
    }
    var ngan = n.split(" ").length <= 7;
    if (!ngan) return null;
    if (/^(tro giup|giup do|giup|huong dan|danh sach lenh|cac lenh|lenh)$/.test(n)) return ["giup"];
    if (/\b(an|giau|tat) (tat ca )?(dap an|loi giai|ket qua)\b/.test(n)) return ["anDapAn"];
    if (/^(dong|tat|thoat|dung)\b/.test(n)) return ["dong"];
    if (/\b(dap an|loi giai)\b/.test(n)) return ["dapAn"];
    if (/\bgoi (ten|ban|mot ban|hoc sinh|ngau nhien|em)\b/.test(n) || n === "goi") return ["goiTen"];
    if (/\b(mo phong|thi nghiem ao)\b/.test(n)) return ["moPhong"];
    if (/(^|\s)sau$/.test(goc.toLowerCase().replace(/[.,!?]+$/, ""))) return ["tiep"];   // "slide sau" (không dấu) là slide tiếp, khác "slide sáu"
    var coChuyen = /\b(chuyen|sang|den|toi|ve|slide|slai|xlai|trang|so)\b/.test(n);
    if (coChuyen && /\b(cuoi|cuoi cung)\b/.test(n)) return ["den", "cuoi"];
    if (coChuyen && /\b(dau|dau tien)\b/.test(n)) return ["den", 1];
    var so = soChu(n.replace(/^.*?\b(slide|slai|xlai|trang|so|chuyen den|chuyen toi|chuyen sang|chuyen|den|toi|sang)\b\s*/, ""));
    if (coChuyen && so !== null && so > 0) return ["den", so];
    if (/\b(lui|quay lai|tro lai|truoc|back|chuyen lai|lui lai)\b/.test(n)) return ["lui"];
    if (/^(chuyen|tiep|sang|qua|next|tiep theo|tiep tuc|chuyen tiep|sang trang|slide tiep|slide sau|sau)\b/.test(n)) return ["tiep"];
    return null;
  }

  /* ---------- giao diện ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#tgNut{position:fixed;left:10px;bottom:64px;z-index:2147483000;font:600 14px system-ui,sans-serif;padding:7px 12px;border-radius:20px;border:1px solid #1d4ed8;background:#eff6ff;color:#1e3a8a;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2);opacity:.8;user-select:none;touch-action:none}" +
    "#tgNut:hover{opacity:1}#tgNut.on{background:#dc2626;border-color:#dc2626;color:#fff;opacity:1;animation:tgTho 1.6s infinite}" +
    "@keyframes tgTho{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}" +
    "#tgBao{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483002;max-width:calc(100vw - 30px);font:600 17px/1.35 system-ui,sans-serif;background:#111827;color:#fff;padding:9px 16px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.35);pointer-events:none;transition:opacity .3s;text-align:center}" +
    "#tgBao .n{display:block;font-weight:400;font-size:14px;color:#cbd5e1}#tgBao.loi{background:#7c2d12}" +
    "#tgHop{position:fixed;left:10px;bottom:110px;z-index:2147483001;width:min(400px,calc(100vw - 20px));max-height:calc(100vh - 130px);overflow:auto;font:14px/1.45 system-ui,sans-serif;background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:12px 14px;box-sizing:border-box}" +
    "#tgHop table{border-collapse:collapse;width:100%;margin:6px 0}#tgHop td{padding:4px 6px;border-top:1px solid #e5e7eb;vertical-align:top}#tgHop td:first-child{font-weight:700;color:#1e3a8a;white-space:nowrap}" +
    "#tgHop .gc{font-size:12px;color:#6b7280}#tgHop button{font:600 13px system-ui,sans-serif;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#f3f4f6;color:#111;cursor:pointer;float:right}" +
    "@media print{#tgNut,#tgBao,#tgHop{display:none!important}}";
  document.head.appendChild(css);

  var bao = null, tBao = null;
  function thongBao(chinh, phu, loi) {
    if (!bao) { bao = document.createElement("div"); bao.id = "tgBao"; bao.setAttribute("role", "status"); document.body.appendChild(bao); }
    bao.className = loi ? "loi" : ""; bao.innerHTML = ""; bao.style.opacity = "1";
    var a = document.createElement("span"); a.textContent = chinh; bao.appendChild(a);
    if (phu) { var b = document.createElement("span"); b.className = "n"; b.textContent = phu; bao.appendChild(b); }
    clearTimeout(tBao); tBao = setTimeout(function () { bao.style.opacity = "0"; }, loi ? 4000 : 2500);
  }

  var hop = null;
  function dongHop() { if (hop) hop.remove(); hop = null; }
  function moHop() {
    dongHop();
    hop = document.createElement("div"); hop.id = "tgHop";
    hop.innerHTML = '<button type="button">Đóng</button><div style="font-weight:700;font-size:15px">🎤 Lệnh giọng nói</div>' +
      '<div class="gc">Bấm 🎤 một lần để bắt đầu nghe, bấm lần nữa để tắt. Nói ngắn, tách riêng từng lệnh.</div><table>' +
      [["Chuyển", "slide tiếp (hoặc bước tiếp). Cũng được: “Tiếp”, “Sang”"], ["Lùi", "slide trước. Cũng được: “Quay lại”"],
       ["Chuyển slide 5", "đến slide số 5; “Về đầu”, “Slide cuối”"], ["Đáp án", "hiện đáp án / lời giải đang thấy; “Ẩn đáp án” để ẩn"],
       ["Gọi tên", "gọi tên ngẫu nhiên một học sinh"], ["Mô phỏng", "mở mô phỏng của slide"], ["Đóng", "đóng mô phỏng, khung gọi tên, phiếu…"],
       ["Sửa …", "ví dụ “Sửa đáp án câu 3 là B”: mở phiếu ✎ Sửa đã điền sẵn, cô đọc lại rồi bấm Gửi"], ["Trợ giúp", "hiện bảng này"]]
        .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") +
      '</table><div class="gc">Cần Chrome hoặc Edge và có mạng. Giọng nói được trình duyệt chuyển thành chữ, không lưu lại. Không đọc tên, điểm học sinh vào micro.</div>';
    hop.querySelector("button").onclick = dongHop;
    document.body.appendChild(hop);
  }

  var nut = document.createElement("button");
  nut.id = "tgNut"; nut.type = "button"; nut.textContent = "🎤"; nut.setAttribute("data-im", "1");
  nut.title = "Trợ giảng giọng nói: bấm để bắt đầu / dừng nghe lệnh (Chuyển, Đáp án, Gọi tên, Mô phỏng, Đóng, Sửa…)";
  /* kéo được, nhớ vị trí (như nút Sửa) */
  var vt0 = null, keo = false, bd = null;
  try { vt0 = JSON.parse(localStorage.getItem("tgViTri") || "null"); } catch (e) {}
  function dat(x, y) {
    x = Math.max(0, Math.min(x, window.innerWidth - nut.offsetWidth)); y = Math.max(0, Math.min(y, window.innerHeight - nut.offsetHeight));
    nut.style.left = x + "px"; nut.style.top = y + "px"; nut.style.bottom = "auto"; return { x: x, y: y };
  }
  nut.addEventListener("mousedown", function (e) { e.preventDefault(); });
  nut.addEventListener("pointerdown", function (e) { var r = nut.getBoundingClientRect(); bd = { px: e.clientX, py: e.clientY, x: r.left, y: r.top }; keo = false; try { nut.setPointerCapture(e.pointerId); } catch (x) {} });
  nut.addEventListener("pointermove", function (e) {
    if (!bd) return;
    if (!keo && Math.abs(e.clientX - bd.px) + Math.abs(e.clientY - bd.py) < 6) return;
    keo = true; vt0 = dat(bd.x + e.clientX - bd.px, bd.y + e.clientY - bd.py);
  });
  nut.addEventListener("pointerup", function () { if (keo && vt0) { try { localStorage.setItem("tgViTri", JSON.stringify(vt0)); } catch (e) {} } bd = null; });
  nut.addEventListener("pointercancel", function () { bd = null; });
  nut.addEventListener("click", function () {
    if (keo) { keo = false; return; }
    if (dangNghe) tat(); else bat();
  });

  /* ---------- nghe ---------- */
  var nhan = null, dangNghe = false, choLenh = null;   // choLenh: hàm nhận câu nói một lần (đọc chính tả vào phiếu Sửa)
  function lam(cau) {
    if (choLenh) { var f = choLenh; choLenh = null; f(cau); return; }
    var l = hieu(cau);
    if (!l) { if (cau.split(/\s+/).length <= 4) thongBao("Chưa hiểu lệnh", "“" + cau + "” · nói “Trợ giúp” để xem lệnh", true); return; }
    var kq;
    try { kq = VIEC[l[0]](l[1]); } catch (e) { kq = "!Lỗi khi làm lệnh: " + e.message; }
    if (typeof kq === "string" && kq.charAt(0) === "!") thongBao(kq.slice(1), "“" + cau + "”", true);
    else thongBao("✓ " + kq, "“" + cau + "”");
  }
  function taoNhan() {
    var r = new SR();
    r.lang = "vi-VN"; r.continuous = true; r.interimResults = false; r.maxAlternatives = 3;
    r.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        var kq = e.results[i], cau = kq[0].transcript.trim();
        if (!choLenh && !hieu(cau)) for (var j = 1; j < kq.length; j++) if (hieu(kq[j].transcript)) { cau = kq[j].transcript.trim(); break; }
        if (cau) lam(cau);
      }
    };
    r.onerror = function (e) {
      if (e.error === "no-speech" || e.error === "aborted") return;
      var lydo = { "not-allowed": "Trình duyệt chưa cho dùng micro: bấm biểu tượng ổ khóa trên thanh địa chỉ, cho phép Micro",
        "service-not-allowed": "Trình duyệt chưa cho dùng micro", "audio-capture": "Không thấy micro trên máy này",
        "network": "Mất mạng: nhận giọng nói cần có mạng" }[e.error] || ("Lỗi micro: " + e.error);
      thongBao(lydo, "", true);
      if (e.error !== "network") tat();
    };
    r.onend = function () { if (dangNghe) { try { r.start(); } catch (x) { setTimeout(function () { if (dangNghe) try { r.start(); } catch (y) {} }, 400); } } };
    return r;
  }
  function bat() {
    if (!SR) { thongBao("Trình duyệt này không nghe được giọng nói", "Mở trang bằng Chrome hoặc Edge", true); return; }
    if (location.protocol === "file:") thongBao("Mở trang trên mạng (github.io) để dùng micro", "Trang mở từ tệp trên máy có thể không nghe được", true);
    nhan = nhan || taoNhan(); dangNghe = true;
    try { nhan.start(); } catch (e) {}
    nut.classList.add("on"); nut.textContent = "🎤 Đang nghe";
    var daXem = false; try { daXem = localStorage.getItem("tgDaXem") === "1"; localStorage.setItem("tgDaXem", "1"); } catch (e) {}
    if (!daXem) moHop(); else thongBao("🎤 Đang nghe lệnh", "Chuyển · Lùi · Đáp án · Gọi tên · Mô phỏng · Đóng · Sửa …");
  }
  function tat() {
    dangNghe = false; choLenh = null;
    try { nhan && nhan.stop(); } catch (e) {}
    nut.classList.remove("on"); nut.textContent = "🎤";
    thongBao("Đã tắt micro");
  }

  /* API cho nút Sửa: đọc chính tả một câu (bật micro nếu đang tắt) */
  window.TroGiang = {
    hieu: hieu,
    lam: lam,
    docMotCau: function (cb) {
      if (!SR) { thongBao("Trình duyệt này không nghe được giọng nói", "Mở trang bằng Chrome hoặc Edge", true); return false; }
      var tuTat = !dangNghe;
      choLenh = function (cau) { cb(cau); if (tuTat) tat(); };
      if (!dangNghe) { nhan = nhan || taoNhan(); dangNghe = true; try { nhan.start(); } catch (e) {} nut.classList.add("on"); nut.textContent = "🎤 Đang nghe"; }
      thongBao("🎤 Cô nói nội dung cần sửa…");
      return true;
    }
  };

  function gan() { document.body.appendChild(nut); if (vt0) dat(vt0.x, vt0.y); }
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
})();
