/* Sổ điểm (mục "Sổ điểm" ở cột trái của hồ sơ).
   Dữ liệu (tên, mã học sinh, điểm) lưu trong trình duyệt, trong S.sd của hồ sơ (localStorage "hsdh_v2"),
   nên "Sao lưu dữ liệu" của hồ sơ sao lưu luôn sổ điểm. Không có trong kho GitHub.
   Nếu giáo viên bật đồng bộ (mã GVCN của Sổ chủ nhiệm), sổ còn được gửi lên trang tính _SoDiem của Google Sheet Sổ chủ nhiệm
   để điện thoại và máy tính dùng chung (xem khối DB bên dưới).
   Đọc/ghi Excel bằng SheetJS, tải từ cdnjs lúc cần (lần đầu cần mạng).
   Mẫu Excel: bảng điểm chi tiết của trường (STT, Mã học sinh, Họ và tên [họ đệm | tên], Ngày sinh, TX1-TX5, GK, CK, ĐTB mhk, Nhận xét). */
(function () {
  var A = null;   // { S, save, ve } do app.js đưa vào
  var LIB = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  var TX = ["TX1", "TX2", "TX3", "TX4", "TX5"], DIEM = TX.concat(["GK", "CK"]);
  var V = { hk: 1, dan: false, msg: "" };   // hk: 1, 2 hoặc 0 = cả năm

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function sd() { var S = A.S; if (!S.sd || !Array.isArray(S.sd.lops)) S.sd = { lops: [], chon: "" }; return S.sd; }
  function lop() { var d = sd(); return d.lops.filter(function (l) { return l.id === d.chon; })[0] || d.lops[0] || null; }
  function luu() { A.save(); DB.hen(); }

  /* ---------- đồng bộ qua Google Sheet (web app Sổ chủ nhiệm, Code.gs: soDiemTai / soDiemLuu) ----------
     Mã giáo viên chủ nhiệm chỉ lưu trong trình duyệt (localStorage "hsdh_sd_db"), không có trong kho.
     Gửi cả danh sách lớp (d.lops); "rev" là số phiên bản trên mạng mà máy này đang giữ, "h" là dấu của bản đã đồng bộ:
     bản trên máy khác dấu h nghĩa là có thay đổi chưa gửi (kể cả khi khôi phục từ file sao lưu). */
  var DB = (function () {
    var API = "https://script.google.com/macros/s/AKfycbxhoRJbCEg22IeDkhSJ6XImhifLZyKGZO2s5BK4oDEs6tXZVayoxA0Xzy2-ZXNAHGDA/exec";
    var K = "hsdh_sd_db", m = {}, dang = false, lai = false, t = 0, tt = "", lanCuoi = 0;
    try { m = JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch (e) { m = {}; }
    function ghi() { try { localStorage.setItem(K, JSON.stringify(m)); } catch (e) {} }
    function dau(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return s.length + ":" + h; }
    function banMay() { return JSON.stringify(sd().lops); }
    function doi() { var s = banMay(); return m.h ? dau(s) !== m.h : sd().lops.length > 0; }
    function bao2(s) { tt = s; var e = $("sdDB"); if (e) e.textContent = s; }
    function goi(yc) {
      yc.ma = m.ma;
      return fetch(API, { method: "POST", body: JSON.stringify(yc), redirect: "follow", cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("Máy chủ trả lỗi " + r.status); return r.text(); })
        .then(function (s) { if (/^\s*</.test(s)) throw new Error("Máy chủ chưa có phần sổ điểm: cần dán Code.gs mới và triển khai bản mới."); return JSON.parse(s); });
    }
    function gio() { var d = new Date(); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
    function dangGo() { var a = document.activeElement; return a && a.closest && a.closest("#sd") && a.tagName === "INPUT"; }
    function nhan(r) {
      var v = []; try { v = r.json ? JSON.parse(r.json) : []; } catch (e) { v = []; }
      sd().lops = Array.isArray(v) ? v : []; m.rev = r.rev; m.h = dau(banMay()); ghi(); A.save();
      bao2("Đã lấy bản mới nhất lúc " + gio() + "."); if (document.getElementById("sd")) A.ve();
    }
    function gui(rev) {
      var s = banMay();
      return goi({ viec: "soDiemLuu", rev: rev, json: s }).then(function (r) {
        if (r.ok) { m.rev = r.rev; m.h = dau(s); ghi(); bao2("Đã lưu lên Google Sheet lúc " + gio() + "."); return; }
        if (r.xungDot) { lai = true; return; }
        throw new Error(r.loi || "Không lưu được.");
      });
    }
    function chay() {
      if (!m.ma) return;
      if (dang) { lai = true; return; }
      dang = true; lai = false; lanCuoi = Date.now(); bao2("Đang đồng bộ…");
      goi({ viec: "soDiemTai" }).then(function (r) {
        if (!r.ok) { if (r.saiMa) { m.ma = ""; ghi(); if (document.getElementById("sd")) A.ve(); } throw new Error(r.loi || "Không tải được."); }
        var coDoi = doi(), rev = m.rev || 0;
        if (r.rev === rev) { if (coDoi) return gui(rev); bao2("Đã đồng bộ (" + gio() + ")."); return; }
        if (!coDoi || !sd().lops.length) { if (dangGo()) { lai = true; return; } return nhan(r); }
        if (confirm("Sổ điểm trên Google Sheet vừa được sửa ở máy khác, mà máy này cũng có thay đổi chưa gửi.\n\nOK: lấy bản trên Google Sheet (bỏ thay đổi ở máy này).\nHủy: giữ bản ở máy này và ghi đè lên Google Sheet.")) return nhan(r);
        return gui(r.rev);
      }).catch(function (e) {
        bao2("Chưa đồng bộ được: " + (e && /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "mất mạng, sẽ thử lại." : e.message));
      }).then(function () { dang = false; if (lai) hen(3000); });
    }
    function hen(ms) { if (!m.ma) return; clearTimeout(t); t = setTimeout(chay, ms == null ? 1500 : ms); }
    function bat() {
      var ma = (prompt("Nhập MÃ GIÁO VIÊN CHỦ NHIỆM của Sổ chủ nhiệm số.\nSổ điểm sẽ lưu vào trang tính _SoDiem trong Google Sheet của sổ, mọi máy nhập cùng mã đều thấy chung.") || "").trim().toUpperCase();
      if (!ma) return;
      m = { ma: ma, rev: 0 }; ghi(); bao2("Đang kiểm tra mã…");
      goi({ viec: "soDiemTai" }).then(function (r) {
        if (!r.ok) { m = {}; ghi(); V.msg = "Không bật được đồng bộ: " + (r.loi || "mã không dùng được."); A.ve(); return; }
        V.msg = "Đã bật đồng bộ. Từ giờ sổ điểm tự lưu lên Google Sheet."; A.ve(); chay();
      }).catch(function (e) { m = {}; ghi(); V.msg = "Không bật được đồng bộ: " + e.message; A.ve(); });
    }
    function tat() { if (!confirm("Tắt đồng bộ trên máy này? Sổ điểm vẫn giữ trên máy và trên Google Sheet, chỉ thôi tự gửi/nhận.")) return; m = {}; ghi(); tt = ""; A.ve(); }
    function thanh() {
      if (!m.ma) return '<p class="warn noprint">Sổ điểm đang chỉ lưu trong trình duyệt của máy này: máy khác (điện thoại) sẽ không thấy. <button data-s="dbBat">Bật đồng bộ Google Sheet</button></p>';
      return '<p class="muted noprint">☁ Đồng bộ Google Sheet (Sổ chủ nhiệm): <span id="sdDB" role="status">' + esc(tt || "…") + '</span> <button class="link" data-s="dbNgay">Đồng bộ ngay</button> <button class="link" data-s="dbTat">Tắt đồng bộ</button></p>';
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) hen(300); });
    return { hen: hen, chay: chay, bat: bat, tat: tat, thanh: thanh, moTrang: function () { if (m.ma && Date.now() - lanCuoi > 5000) hen(200); } };
  })();
  function so(v) { return v === "" || v == null ? "" : String(v).replace(".", ","); }
  function lam1(x) { return Math.round(x * 10 + 1e-9) / 10; }
  function hoTen(h) { return ((h.ho || "") + " " + (h.ten || "")).trim(); }
  function bo(s) { return String(s || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim(); }
  function moi() { return "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  /* ĐTB môn học kì theo Thông tư 22: (tổng ĐĐGtx + 2·ĐĐGgk + 3·ĐĐGck) / (số ĐĐGtx + 5), làm tròn 1 chữ số */
  function dtb(h, hk) {
    var d = h["d" + hk] || {}, t = 0, n = 0;
    TX.forEach(function (k) { if (typeof d[k] === "number") { t += d[k]; n++; } });
    if (!n || typeof d.GK !== "number" || typeof d.CK !== "number") return null;
    return lam1((t + 2 * d.GK + 3 * d.CK) / (n + 5));
  }
  function dtbCN(h) { var a = dtb(h, 1), b = dtb(h, 2); return a == null || b == null ? null : lam1((a + 2 * b) / 3); }
  function diemOf(h, hk) { return hk ? dtb(h, hk) : dtbCN(h); }
  var MUC = [["Tốt", 8], ["Khá", 6.5], ["Đạt", 5], ["Chưa đạt", -1]];
  function muc(v) { for (var i = 0; i < MUC.length; i++) if (v >= MUC[i][1]) return MUC[i][0]; return ""; }
  function thongKe(l, hk) {
    var c = { "Tốt": 0, "Khá": 0, "Đạt": 0, "Chưa đạt": 0 }, co = 0;
    l.hs.forEach(function (h) { var v = diemOf(h, hk); if (v != null) { c[muc(v)]++; co++; } });
    return { c: c, co: co, n: l.hs.length };
  }
  function tkHTML(l) {
    var t = thongKe(l, V.hk);
    return '<b>Số học sinh đạt</b> (' + t.co + "/" + t.n + " em đã đủ điểm): " + MUC.map(function (m) {
      var k = m[0], p = t.co ? Math.round(t.c[k] * 100 / t.co) : 0; return k + " <b>" + t.c[k] + "</b> (" + p + "%)";
    }).join(" · ");
  }

  /* ---------- giao diện ---------- */
  function html() {
    var d = sd(), l = lop(), h = '<div id="sd"><div class="head"><h2>Sổ điểm</h2><span class="sp"></span>' +
      [[1, "Học kì 1"], [2, "Học kì 2"], [0, "Cả năm"]].map(function (x) { return '<button class="chip' + (V.hk === x[0] ? " on" : "") + '" data-s="hk" data-v="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>";
    h += DB.thanh(); DB.moTrang();
    h += '<div class="row noprint">' + d.lops.map(function (x) { return '<button class="chip' + (l && x.id === l.id ? " on" : "") + '" data-s="chon" data-v="' + x.id + '">' + esc(x.ten) + " <small>(" + x.hs.length + ")</small></button>"; }).join("") +
      '<button data-s="lopMoi">+ Lớp mới</button><label class="btn">Nhập từ Excel<input type="file" id="sdFile" accept=".xls,.xlsx,.csv" multiple hidden></label></div>';
    h += '<p id="sdMsg" class="muted" role="status">' + esc(V.msg) + "</p>"; V.msg = "";
    if (!l) return h + '<div class="card muted">Chưa có lớp nào. Bấm <b>Nhập từ Excel</b> để lấy danh sách từ bảng điểm của trường (mỗi trang tính là một lớp), hoặc <b>+ Lớp mới</b> rồi dán danh sách tên.</div></div>';
    h += '<div class="row noprint"><b style="font-size:17px">Lớp ' + esc(l.ten) + '</b><span class="muted">' + l.hs.length + ' học sinh</span><span class="sp"></span>' +
      '<button data-s="themHS">+ Học sinh</button><button data-s="dan">Dán danh sách</button><button data-s="sap">Sắp theo tên</button>' +
      '<button data-s="xuat">Xuất Excel</button><button class="link" data-s="goiTen" title="Chép danh sách tên sang mục Lớp học để dùng nút Gọi tên">Dùng cho Gọi tên</button>' +
      '<button class="link" data-s="doiTen">Đổi tên lớp</button><button class="link" data-s="xoaLop">Xóa lớp</button></div>';
    if (V.dan) h += '<div class="card noprint"><b>Dán danh sách vào lớp ' + esc(l.ten) + '</b><div class="muted">Mỗi dòng một học sinh. Gõ họ tên, hoặc chép nguyên các dòng từ Excel (STT, mã, họ đệm, tên, ngày sinh): trang tự nhận cột.</div>' +
      '<textarea id="sdDan" rows="8" style="width:100%;margin-top:6px" placeholder="Nguyễn Văn An&#10;Trần Thị Bình"></textarea><div class="row" style="margin:8px 0 0"><button data-s="danOK">Thêm vào lớp</button><button class="link" data-s="danHuy">Hủy</button></div></div>';
    h += '<div class="sdw"><table class="sdt"><thead>';
    if (V.hk) {
      h += '<tr><th rowspan="2">STT</th><th rowspan="2">Mã học sinh</th><th rowspan="2" colspan="2">Họ và tên</th><th rowspan="2">Ngày sinh</th><th colspan="5">ĐĐGtx</th><th>ĐĐGgk</th><th>ĐĐGck</th><th rowspan="2">ĐTB<br>mhk</th><th rowspan="2">Nhận xét</th><th rowspan="2" class="noprint"></th></tr><tr>' +
        TX.map(function (k) { return "<th>" + k + "</th>"; }).join("") + "<th>GK" + V.hk + "</th><th>CK" + V.hk + "</th></tr>";
    } else h += '<tr><th>STT</th><th>Mã học sinh</th><th colspan="2">Họ và tên</th><th>Ngày sinh</th><th>ĐTB HK1</th><th>ĐTB HK2</th><th>ĐTB cả năm</th><th>Mức</th><th class="noprint"></th></tr>';
    h += "</thead><tbody>";
    l.hs.forEach(function (x, i) { h += dongHTML(x, i); });
    h += "</tbody></table></div>";
    if (!l.hs.length) h += '<p class="muted">Lớp chưa có học sinh: bấm "+ Học sinh" hoặc "Dán danh sách".</p>';
    h += '<p id="sdTK" class="sdtk">' + tkHTML(l) + "</p>";
    h += '<p class="muted">ĐTB môn học kì = (tổng điểm TX + 2 × GK + 3 × CK) / (số bài TX + 5), chỉ tính khi đã có GK, CK và ít nhất một bài TX. Cả năm = (HK1 + 2 × HK2) / 3. Mức: Tốt từ 8,0; Khá từ 6,5; Đạt từ 5,0. Nhập điểm xong bấm Enter để xuống em dưới.</p></div>';
    return h;
  }
  function o(i, k, v, cl, ph) { return '<input class="' + cl + '" data-i="' + i + '" data-k="' + k + '" value="' + esc(v) + '"' + (ph ? ' placeholder="' + ph + '"' : "") + ">"; }
  function dongHTML(x, i) {
    var h = '<tr data-r="' + i + '"><td class="c">' + (i + 1) + "</td><td>" + o(i, "ma", x.ma || "", "ma") + "</td><td>" + o(i, "ho", x.ho || "", "ho", "Họ đệm") + "</td><td>" + o(i, "ten", x.ten || "", "tn", "Tên") + "</td><td>" + o(i, "ns", x.ns || "", "ns") + "</td>";
    if (V.hk) {
      var d = x["d" + V.hk] || {}, v = dtb(x, V.hk);
      DIEM.forEach(function (k) { h += "<td>" + o(i, k, so(d[k]), "dd") + "</td>"; });
      h += '<td class="c dtb">' + (v == null ? "" : so(v.toFixed(1))) + "</td><td>" + o(i, "nx", x["nx" + V.hk] || "", "nx") + "</td>";
    } else {
      var a = dtb(x, 1), b = dtb(x, 2), c = dtbCN(x);
      [a, b, c].forEach(function (v) { h += '<td class="c dtb">' + (v == null ? "" : so(v.toFixed(1))) + "</td>"; });
      h += '<td class="c">' + (c == null ? "" : muc(c)) + "</td>";
    }
    return h + '<td class="noprint"><button class="link xoa" data-s="xoaHS" data-i="' + i + '" title="Xóa học sinh này" aria-label="Xóa học sinh">×</button></td></tr>';
  }
  function ve() { A.ve(); }
  function bao(s) { V.msg = s; var m = $("sdMsg"); if (m) m.textContent = s; }

  /* ---------- tách dòng dán vào: họ tên, hoặc dòng chép từ Excel ---------- */
  function tachDong(s) {
    var c = s.split("\t").map(function (x) { return x.trim(); }).filter(Boolean), h = { ho: "", ten: "", ma: "", ns: "" }, chu = [];
    if (c.length === 1) c = [c[0]];
    c.forEach(function (x, j) {
      if (/^\d{6,}$/.test(x)) h.ma = x;
      else if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(x)) h.ns = x;
      else if (/^\d{1,3}\.?$/.test(x) && j === 0) return;
      else if (/^[\d.,]+$/.test(x)) return;
      else chu.push(x);
    });
    if (!chu.length) return null;
    if (chu.length === 1) { var w = chu[0].replace(/^\d{1,3}[.)]\s*/, "").split(/\s+/); h.ten = w.pop(); h.ho = w.join(" "); }
    else { h.ten = chu.pop(); h.ho = chu.join(" "); }
    return h;
  }

  /* ---------- Excel ---------- */
  function napLib(cb) {
    if (window.XLSX) return cb();
    bao("Đang tải bộ đọc Excel…");
    var s = document.createElement("script"); s.src = LIB;
    s.onload = function () { bao(""); cb(); };
    s.onerror = function () { bao("Không tải được bộ đọc Excel: lần đầu dùng cần có mạng."); };
    document.head.appendChild(s);
  }
  function soO(v) { var t = String(v == null ? "" : v).trim().replace(",", "."); if (t === "") return ""; var n = parseFloat(t); return isNaN(n) || n < 0 || n > 10 || !/^\d+(\.\d+)?$/.test(t) ? null : n; }
  function docTrang(ten, a) {
    var r0 = -1, i, j;
    for (i = 0; i < Math.min(a.length, 30) && r0 < 0; i++) for (j = 0; j < a[i].length; j++) if (bo(a[i][j]) === "họ và tên" || bo(a[i][j]) === "họ tên") { r0 = i; break; }
    if (r0 < 0) return null;
    var hd = a[r0].map(bo), sub = (a[r0 + 1] || []).map(bo), cot = { ma: -1, ten: -1, ns: -1, stt: -1, nx: -1 }, dm = {}, hk = 0;
    hd.forEach(function (x, k) {
      if (x === "stt" || x === "tt") cot.stt = k; else if (x.indexOf("mã") === 0) cot.ma = k; else if (x === "họ và tên" || x === "họ tên") cot.ho = k;
      else if (x.indexOf("ngày sinh") === 0) cot.ns = k; else if (x.indexOf("nhận xét") === 0) cot.nx = k;
    });
    function dk(x, k) { var m = x.toUpperCase().replace(/\s/g, "").match(/^(TX[1-5]|GK[12]?|CK[12]?)$/); if (m) { var t = m[1]; if (/[12]$/.test(t) && t[0] !== "T") { hk = hk || +t.slice(-1); t = t.slice(0, 2); } dm[t] = k; } }
    sub.forEach(dk); hd.forEach(dk);
    var tachTen = cot.ho >= 0 && !hd[cot.ho + 1] && !sub[cot.ho + 1];   // "Họ và tên" gộp 2 cột: họ đệm | tên
    var dau = [], tenLop = "";
    for (i = 0; i < r0; i++) { var t = a[i].filter(function (x) { return String(x).trim(); }).join(" ").trim(); if (t) dau.push(t); var m = t.match(/Lớp\s*[:\-]?\s*([0-9A-Za-zÀ-ỹ.\/_-]+)/); if (m && !tenLop) tenLop = m[1]; }
    var hs = [], bat = r0 + 1;
    if (Object.keys(dm).length && sub.some(function (x) { return /^(tx|gk|ck)/.test(x); })) bat = r0 + 2;
    for (i = bat; i < a.length; i++) {
      var r = a[i], stt = cot.stt >= 0 ? String(r[cot.stt]).trim() : "";
      if (cot.stt >= 0 && !/^\d+$/.test(stt)) { if (hs.length) break; continue; }
      var ho = String(r[cot.ho] || "").trim(), tn = tachTen ? String(r[cot.ho + 1] || "").trim() : "";
      if (!ho && !tn) continue;
      if (!tachTen) { var w = ho.split(/\s+/); tn = w.pop(); ho = w.join(" "); }
      var x = { ma: cot.ma >= 0 ? String(r[cot.ma]).trim() : "", ho: ho, ten: tn, ns: cot.ns >= 0 ? String(r[cot.ns]).trim() : "" }, d = {}, co = false;
      Object.keys(dm).forEach(function (k) { var v = soO(r[dm[k]]); if (typeof v === "number") { d[k] = v; co = true; } });
      if (co) x.d = d;
      if (cot.nx >= 0 && String(r[cot.nx]).trim()) x.nx = String(r[cot.nx]).trim();
      hs.push(x);
    }
    var mTen = ten.match(/(\d{2}[A-Za-z0-9.]*)$/);
    return { ten: tenLop || (mTen ? mTen[1].toUpperCase() : ten), dau: dau, hk: hk, hs: hs };
  }
  function ghep(t, hkMacDinh) {
    var d = sd(), hk = t.hk || hkMacDinh || 1, l = d.lops.filter(function (x) { return bo(x.ten) === bo(t.ten); })[0], them = 0, cu = 0;
    if (!l) { l = { id: moi(), ten: t.ten, dau: t.dau, hs: [] }; d.lops.push(l); }
    else if (t.dau.length) l.dau = t.dau;
    t.hs.forEach(function (x) {
      var h = l.hs.filter(function (y) { return x.ma ? y.ma === x.ma : bo(hoTen(y)) === bo(hoTen(x)); })[0];
      if (!h) { h = { ma: "", ho: "", ten: "", ns: "" }; l.hs.push(h); them++; } else cu++;
      ["ma", "ho", "ten", "ns"].forEach(function (k) { if (x[k]) h[k] = x[k]; });
      if (x.d) { var dd = h["d" + hk] = h["d" + hk] || {}; for (var k in x.d) dd[k] = x.d[k]; }
      if (x.nx) h["nx" + hk] = x.nx;
    });
    return { l: l, them: them, cu: cu };
  }
  function nhapTep(files) {
    napLib(function () {
      var kq = [], con = files.length;
      Array.prototype.forEach.call(files, function (f) {
        var r = new FileReader();
        r.onload = function () {
          try {
            var wb = XLSX.read(new Uint8Array(r.result), { type: "array" });
            wb.SheetNames.forEach(function (n) {
              var t = docTrang(n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: "" }));
              if (t && t.hs.length) { var g = ghep(t, V.hk); kq.push(g.l.ten + " (" + (g.them ? "thêm " + g.them : "") + (g.them && g.cu ? ", " : "") + (g.cu ? "cập nhật " + g.cu : "") + ")"); sd().chon = g.l.id; }
            });
          } catch (e) { kq.push(f.name + ": không đọc được"); }
          if (--con) return;
          luu(); V.msg = kq.length ? "Đã nhập " + kq.length + " lớp: " + kq.join("; ") + "." : "Không thấy bảng nào có cột \"Họ và tên\" trong tệp."; ve();
        };
        r.readAsArrayBuffer(f);
      });
    });
  }
  function xuat() {
    napLib(function () {
      var wb = XLSX.utils.book_new(), d = sd(), dung = {};
      d.lops.forEach(function (l) {
        var hk = V.hk, a = [], mg = [], nC = hk ? 17 : 10;
        var dau = (l.dau && l.dau.length ? l.dau.slice() : ["BẢNG ĐIỂM CHI TIẾT", "Lớp " + l.ten]).map(function (s) { return s.replace(/HỌC KỲ\s*\d/i, hk ? "HỌC KỲ " + hk : "CẢ NĂM"); });
        dau.forEach(function (s, i) { a.push([s]); mg.push({ s: { r: i, c: 0 }, e: { r: i, c: nC - 1 } }); });
        a.push([]); var r = a.length;
        if (hk) {
          a.push(["STT", "Mã học sinh", "Họ và tên", "", "Ngày sinh", "ĐĐGtx", "", "", "", "", "ĐĐGgk", "ĐĐGck", "ĐTB \nmhk", "Nhận xét"]);
          a.push(["", "", "", "", ""].concat(TX, ["GK" + hk, "CK" + hk]));
          [[0, 0], [1, 1], [2, 3], [4, 4], [12, 12], [13, 16]].forEach(function (c) { mg.push({ s: { r: r, c: c[0] }, e: { r: r + 1, c: c[1] } }); });
          mg.push({ s: { r: r, c: 5 }, e: { r: r, c: 9 } });
        } else { a.push(["STT", "Mã học sinh", "Họ và tên", "", "Ngày sinh", "ĐTB HK1", "ĐTB HK2", "ĐTB cả năm", "Mức"]); mg.push({ s: { r: r, c: 2 }, e: { r: r, c: 3 } }); }
        l.hs.forEach(function (x, i) {
          var row = [i + 1, x.ma && /^\d+$/.test(x.ma) ? +x.ma : x.ma || "", x.ho || "", x.ten || "", x.ns || ""], dd = x["d" + hk] || {};
          if (hk) { DIEM.forEach(function (k) { row.push(typeof dd[k] === "number" ? dd[k] : ""); }); var v = dtb(x, hk); row.push(v == null ? "" : v, x["nx" + hk] || ""); }
          else { var c = dtbCN(x); [dtb(x, 1), dtb(x, 2), c].forEach(function (v) { row.push(v == null ? "" : v); }); row.push(c == null ? "" : muc(c)); }
          a.push(row); if (hk) mg.push({ s: { r: a.length - 1, c: 13 }, e: { r: a.length - 1, c: 16 } });
        });
        var t = thongKe(l, hk);
        MUC.forEach(function (m, i) { a.push([i === 0 ? "Số học sinh đạt" : i === 1 ? "Số lượng - Tỉ lệ (%)" : "", "", "", m[0], "", t.c[m[0]], "", "-", (t.co ? Math.round(t.c[m[0]] * 100 / t.co) : 0) + "%"]); });
        var ws = XLSX.utils.aoa_to_sheet(a); ws["!merges"] = mg;
        ws["!cols"] = [{ wch: 5 }, { wch: 13 }, { wch: 20 }, { wch: 8 }, { wch: 11 }].concat(hk ? [5, 5, 5, 5, 5, 6, 6, 6, 8, 8, 8, 8].map(function (w) { return { wch: w }; }) : [{ wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 9 }]);
        var tn = ("vat_li_" + l.ten.toLowerCase()).replace(/[\\\/?*\[\]:]/g, "_").slice(0, 31), k = 2; while (dung[tn]) tn = tn.slice(0, 28) + "_" + k++; dung[tn] = 1;
        XLSX.utils.book_append_sheet(wb, ws, tn);
      });
      XLSX.writeFile(wb, "so_diem_" + (V.hk ? "hk" + V.hk : "ca_nam") + "_" + new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10) + ".xls", { bookType: "xls" });
      bao("Đã xuất " + d.lops.length + " lớp ra tệp Excel (mỗi lớp một trang tính).");
    });
  }

  /* ---------- sự kiện (chỉ trong #sd) ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("#sd [data-s]"); if (!t) return;
    var a = t.getAttribute("data-s"), d = sd(), l = lop();
    if (a === "dbBat") { DB.bat(); return; }
    if (a === "dbTat") { DB.tat(); return; }
    if (a === "dbNgay") { DB.chay(); return; }
    if (a === "hk") { V.hk = +t.getAttribute("data-v"); ve(); }
    else if (a === "chon") { d.chon = t.getAttribute("data-v"); V.dan = false; luu(); ve(); }
    else if (a === "lopMoi") {
      var ten = (prompt("Tên lớp mới (ví dụ 10A5):") || "").trim(); if (!ten) return;
      if (d.lops.some(function (x) { return bo(x.ten) === bo(ten); })) { bao("Đã có lớp " + ten + "."); return; }
      var n = { id: moi(), ten: ten, hs: [] }; d.lops.push(n); d.chon = n.id; V.dan = true; luu(); ve();
    }
    else if (!l) return;
    else if (a === "doiTen") { var tm = (prompt("Đổi tên lớp " + l.ten + " thành:", l.ten) || "").trim(); if (tm && tm !== l.ten) { l.ten = tm; luu(); ve(); } }
    else if (a === "xoaLop") { if (!confirm("Xóa lớp " + l.ten + " cùng toàn bộ " + l.hs.length + " học sinh và điểm?\nNên Xuất Excel trước nếu cần giữ.")) return; d.lops.splice(d.lops.indexOf(l), 1); d.chon = ""; luu(); V.msg = "Đã xóa lớp " + l.ten + "."; ve(); }
    else if (a === "themHS") { l.hs.push({ ma: "", ho: "", ten: "", ns: "" }); luu(); ve(); var q = document.querySelector('#sd input[data-i="' + (l.hs.length - 1) + '"][data-k="ho"]'); if (q) q.focus(); }
    else if (a === "xoaHS") { var i = +t.getAttribute("data-i"), h = l.hs[i]; if (!confirm("Xóa " + (hoTen(h) || "dòng " + (i + 1)) + " khỏi lớp " + l.ten + " (mất luôn điểm của em này)?")) return; l.hs.splice(i, 1); luu(); ve(); }
    else if (a === "sap") { var c = new Intl.Collator("vi"); l.hs.sort(function (x, y) { return c.compare(x.ten || "", y.ten || "") || c.compare(x.ho || "", y.ho || ""); }); luu(); V.msg = "Đã sắp theo tên (A → Z)."; ve(); }
    else if (a === "dan") { V.dan = !V.dan; ve(); var ta = $("sdDan"); if (ta) ta.focus(); }
    else if (a === "danHuy") { V.dan = false; ve(); }
    else if (a === "danOK") {
      var ds = $("sdDan").value.split(/\r?\n/).map(tachDong).filter(Boolean);
      if (!ds.length) { bao("Chưa có tên nào."); return; }
      ds.forEach(function (x) { l.hs.push(x); }); V.dan = false; luu(); V.msg = "Đã thêm " + ds.length + " học sinh vào lớp " + l.ten + "."; ve();
    }
    else if (a === "goiTen") { A.S.lop[l.ten] = l.hs.map(hoTen).filter(Boolean); luu(); bao("Đã chép " + A.S.lop[l.ten].length + " tên sang mục Lớp học (lớp " + l.ten + "), dùng được cho nút Gọi tên."); }
    else if (a === "xuat") xuat();
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#sd")) return;
    if (t.id === "sdFile") { if (t.files.length) nhapTep(t.files); return; }
    var l = lop(), i = t.getAttribute("data-i"), k = t.getAttribute("data-k"); if (!l || i == null || !k) return;
    var h = l.hs[+i]; if (!h) return;
    if (DIEM.indexOf(k) >= 0) {
      var v = soO(t.value), dd = h["d" + V.hk] = h["d" + V.hk] || {};
      if (v === null) { t.classList.add("sai"); bao("Điểm phải là số từ 0 đến 10 (ví dụ 7,5)."); return; }
      t.classList.remove("sai");
      if (v === "") delete dd[k]; else dd[k] = v;
      t.value = so(v);
      var c = t.closest("tr").querySelector(".dtb"), m = dtb(h, V.hk); if (c) c.textContent = m == null ? "" : so(m.toFixed(1));
      var tk = $("sdTK"); if (tk) tk.innerHTML = tkHTML(l);
    } else if (k === "nx") h["nx" + V.hk] = t.value.trim();
    else h[k] = t.value.trim();
    luu();
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target; if (e.key !== "Enter" || !t.closest || !t.closest("#sd table") || t.tagName !== "INPUT") return;
    e.preventDefault();
    var q = document.querySelector('#sd input[data-i="' + (+t.getAttribute("data-i") + (e.shiftKey ? -1 : 1)) + '"][data-k="' + t.getAttribute("data-k") + '"]');
    if (q) { q.focus(); q.select(); } else t.blur();
  });

  window.SoDiem = { init: function (api) { A = api; DB.hen(500); }, html: html, _dtb: dtb, _docTrang: docTrang, _tachDong: tachDong };
})();
