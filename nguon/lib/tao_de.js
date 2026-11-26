/* Tạo đề kiểm tra từ ngân hàng câu hỏi của hồ sơ (nguon/data), theo số câu của các mẫu phiếu Chấm điểm tự động.
   Một đề gốc → nhiều mã đề (đảo câu, đảo phương án) → tải Word (đề, đáp án) và gửi đáp án sang Chấm điểm tự động
   (web app Apps Script ở cham-diem/config.js, việc adminSave như trang cham-diem tự lưu bài, cần mật khẩu giáo viên).
   Word: Times New Roman 11,5; công thức là Equation (LaTeX → MathML của KaTeX → OMML); hình lấy nguyên ảnh trong ngân hàng.
   Kiểm thử: node tools/kiem_tao_de.js */
(function () {
  "use strict";
  var A = null; /* { cfg, data, ve } do app.js truyền vào */
  var KEY = "hsdh_td";

  /* ---------- mẫu phiếu (đúng các phiếu trong cham-diem/mau) ---------- */
  var MAU = [
    { id: "923", ten: "Phiếu A4 9 · 2 · 3 (đề thường xuyên)", n: [9, 2, 3] },
    { id: "3686", ten: "Phiếu A4 36 · 8 · 6", n: [36, 8, 6] },
    { id: "401010", ten: "Phiếu A4 40 · 10 · 10", n: [40, 10, 10] },
    { id: "truong", ten: "Phiếu giấy của trường lớp 10 & 11 (40 · 8 · 8, 2 trang)", n: [40, 8, 8] }
  ];
  var DANG = ["tn", "ds", "tln"], TEN_PHAN = { tn: "PHẦN I", ds: "PHẦN II", tln: "PHẦN III" };
  var LOI_PHAN = {
    tn: "Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu {n}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.",
    ds: "Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu {n}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.",
    tln: "Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời từ câu 1 đến câu {n}."
  };

  /* ---------- kết quả dò đáp án ngân hàng (26/11/2026): mọi đáp án đã tính lại, khớp; các câu dưới đây cần cô xem ---------- */
  var LOAI = { /* không rút tự động */
    "10-3:B14-TN10": "chỉ có 2 phương án A, B: không hợp phiếu 4 phương án",
    "10-3:B17-DS2": "ý c) (góc 30°) phải nhìn hình mà ngân hàng không có hình",
    "10-3:B17-TN2": "câu chọn hình nhưng ngân hàng không có hình",
    "10-3:B17-TN8": "câu chọn hình nhưng ngân hàng không có hình"
  };
  var PHAN_VAN = {
    "10-3:B13-TN1": "phương án có chú thích gợi ý \"(cộng vectơ)\", \"(luôn đúng)\": nên xóa chú thích khi in",
    "10-3:B15-TN3": "phương án có chú thích \"(m là vectơ)\", \"(vế trái vô hướng)\": nên xóa chú thích khi in",
    "10-3:B13-DS2": "ý d) \"Nếu vật đứng yên thì hai lực là hai lực cân bằng\" (Đúng): hiểu là vật đứng yên lâu dài; nếu chỉ đứng yên tức thời thì chưa chắc",
    "10-3:B17-TLN5": "Hình 17.6 ghi sẵn T₁ = T₁' = T₂ = T₂' nên gần như lộ đáp án",
    "10-3:B15-TLN2": "dùng số liệu của câu trước (B15-TLN1): luôn in liền sau câu đó"
  };
  var DI_KEM = { "10-3:B15-TLN2": "B15-TLN1" }; /* câu con → câu mẹ phải in ngay trước */

  /* ---------- tiện ích ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function km(tex) { try { return window.katex.renderToString(tex, { throwOnError: false }); } catch (e) { return esc(tex); } }
  function T(s) { return String(s == null ? "" : s).split(/(\$[^$]+\$)/).map(function (p) { return p.length > 2 && p[0] === "$" && p[p.length - 1] === "$" ? km(p.slice(1, -1)) : esc(p); }).join(""); }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function tron(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function so(x) { return String(x).replace(".", ","); }
  function boDau(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }

  /* ---------- ngân hàng ---------- */
  function nguon() { /* [{ dl, ten, bai:[{ma,ten}] }] mọi chương có dữ liệu của mọi khối */
    var out = [], cfg = A.cfg;
    Object.keys(cfg.khoi).forEach(function (k) {
      cfg.khoi[k].chuong.forEach(function (ch, i) {
        var d = ch.duLieu && A.data[ch.duLieu]; if (!d) return;
        out.push({ dl: ch.duLieu, ten: "Khối " + k + " · Chương " + (i + 1) + ". " + ch.ten, bai: d.bai.map(function (b) { return { ma: b.ma, ten: b.ten }; }) });
      });
    });
    return out;
  }
  function cau(k) { /* k = "10-3:B13-TN1" */
    var p = k.indexOf(":"), d = A.data[k.slice(0, p)], id = k.slice(p + 1);
    if (!d) return null;
    for (var i = 0; i < d.bai.length; i++) for (var j = 0; j < d.bai[i].cau_hoi.length; j++) if (d.bai[i].cau_hoi[j].id === id) return d.bai[i].cau_hoi[j];
    return null;
  }
  function anhCua(q) { if (!q || !q.anh) return ""; for (var m in A.data) if (A.data[m].anh && A.data[m].anh[q.anh]) return A.data[m].anh[q.anh]; return ""; }
  function dapSo(q) { return so(q.tln.dap_so); }
  /* câu có in được lên phiếu không */
  function hopLe(dl, q) {
    var k = dl + ":" + q.id;
    if (DANG.indexOf(q.dang) < 0) return "tự luận";
    if (LOAI[k]) return LOAI[k];
    if (/hình|đồ thị/i.test(q.de + " " + (q.ds ? q.ds.dan : "")) && !anhCua(q) && !/\(SGK tr\. \d+, Hình/i.test(q.de)) return "nói tới hình nhưng ngân hàng không có hình";
    if ((q.hinh || []).length && !anhCua(q)) return "thiếu hình " + q.hinh.join(", ");
    if (q.dang === "tn" && (!q.tn || q.tn.phuong_an.length !== 4 || "ABCD".indexOf(q.tn.dap_an) < 0)) return "không đủ 4 phương án";
    if (q.dang === "ds" && (!q.ds || q.ds.y.length !== 4)) return "không đủ 4 ý";
    if (q.dang === "tln" && dapSo(q).length > 4) return "đáp số dài quá 4 ô của phiếu";
    return "";
  }
  /* các nhóm câu rút được, theo bài: [{ bai, dang, ks:[k...] }] (câu kèm câu mẹ thành một nhóm 2 câu) */
  function nhomCau(chon) {
    var out = [];
    nguon().forEach(function (c) {
      var d = A.data[c.dl];
      d.bai.forEach(function (b) {
        if (!chon[c.dl + ":" + b.ma]) return;
        var me = {};
        Object.keys(DI_KEM).forEach(function (k) { if (k.indexOf(c.dl + ":") === 0) me[c.dl + ":" + DI_KEM[k]] = k; });
        b.cau_hoi.forEach(function (q) {
          var k = c.dl + ":" + q.id;
          if (hopLe(c.dl, q) || me[k]) return;
          if (DI_KEM[k]) { var km_ = c.dl + ":" + DI_KEM[k], qm = cau(km_); if (!qm || hopLe(c.dl, qm)) return; out.push({ bai: c.dl + ":" + b.ma, dang: q.dang, ks: [km_, k] }); return; }
          out.push({ bai: c.dl + ":" + b.ma, dang: q.dang, ks: [k] });
        });
      });
    });
    return out;
  }
  function demCo(chon) { var n = { tn: 0, ds: 0, tln: 0 }; nhomCau(chon).forEach(function (g) { n[g.dang] += g.ks.length; }); return n; }

  /* rút câu: chia đều cho các bài đã chọn (lần lượt từng bài), mỗi bài xáo ngẫu nhiên */
  function rut(dang, can, chon, r, bo) {
    var theoBai = {}, thuTu = [];
    nhomCau(chon).forEach(function (g) { if (g.dang !== dang || g.ks.some(function (k) { return bo[k]; })) return; if (!theoBai[g.bai]) { theoBai[g.bai] = []; thuTu.push(g.bai); } theoBai[g.bai].push(g); });
    thuTu.forEach(function (b) { theoBai[b] = tron(theoBai[b], r); });
    var lay = [], n = 0, conLai = true;
    while (n < can && conLai) {
      conLai = false;
      for (var i = 0; i < thuTu.length && n < can; i++) {
        var ds = theoBai[thuTu[i]]; if (!ds.length) continue; conLai = true;
        var j = 0; while (j < ds.length && n + ds[j].ks.length > can) j++;
        if (j === ds.length) { ds.length = 0; continue; }
        var g = ds.splice(j, 1)[0]; lay.push(g); n += g.ks.length;
      }
    }
    /* giữ thứ tự theo bài trong đề gốc */
    lay.sort(function (a, b) { return thuTu.indexOf(a.bai) - thuTu.indexOf(b.bai); });
    return lay.map(function (g) { return g.ks; });
  }

  /* phương án có nhắc tới phương án khác thì không đảo */
  function daoPA(q) { return !q.tn.phuong_an.some(function (p) { return /(^|\s)(cả|tất cả|không có)\b|phương án|đáp án|\b[A-D]\s*(và|,|hoặc)\s*[A-D]\b|^\s*[A-D]\s*$/i.test(p); }); }

  /* các mã đề: đảo thứ tự nhóm câu trong mỗi phần, đảo phương án trắc nghiệm */
  function lamMa(de) {
    var ma = {}, goc = +de.maDau || 101;
    for (var m = 0; m < de.soMa; m++) {
      var r = rng(de.hat * 131 + m * 7919 + 17), code = String(goc + m), x = {};
      DANG.forEach(function (d) {
        var nh = de.cau[d] || [], giu = m === 0 && de.giuMa1, th = giu ? nh.slice() : tron(nh, r), ds = [];
        th.forEach(function (ks) { ks.forEach(function (k) { ds.push({ k: k }); }); });
        if (d === "tn") {
          /* đáp án đúng rải đều A, B, C, D: mỗi câu đảo được nhận một chữ đích từ dãy ABCD lặp lại đã xáo */
          var dao = ds.filter(function (it) { return de.daoPA && !giu && daoPA(cau(it.k)); }), dich = [];
          for (var i = 0; i < dao.length; i++) dich.push(i % 4);
          dich = tron(dich, r);
          ds.forEach(function (it) {
            var q = cau(it.k), j = dao.indexOf(it);
            if (j < 0) { it.pa = [0, 1, 2, 3]; return; }
            var dung = "ABCD".indexOf(q.tn.dap_an), khac = tron([0, 1, 2, 3].filter(function (v) { return v !== dung; }), r), pa = [];
            for (var p = 0; p < 4; p++) pa.push(p === dich[j] ? dung : khac.shift());
            it.pa = pa;
          });
        }
        x[d] = ds;
      });
      ma[code] = x;
    }
    return ma;
  }
  function dapAnMa(x) { /* { tn:"ABCD..", ds:[["D","S",..]], tln:["2,5",..] } */
    return {
      tn: x.tn.map(function (it) { var q = cau(it.k); return "ABCD"[it.pa.indexOf("ABCD".indexOf(q.tn.dap_an))]; }),
      ds: x.ds.map(function (it) { return cau(it.k).ds.y.map(function (y) { return y.dung ? "D" : "S"; }); }),
      tln: x.tln.map(function (it) { return dapSo(cau(it.k)); })
    };
  }

  /* ---------- trạng thái ---------- */
  var S = { ten: "", mau: "923", n: { tn: 9, ds: 2, tln: 3 }, chon: {}, soMa: 4, maDau: 101, daoPA: true, giuMa1: false, de: null };
  try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); if (o) for (var kk in S) if (o[kk] != null) S[kk] = o[kk]; } catch (e) {}
  function luu() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var thongBao = "";

  function taoDe() {
    var hat = Math.floor(Math.random() * 1e9), r = rng(hat), cauDe = {}, bo = {}, thieu = [];
    var co = demCo(S.chon);
    DANG.forEach(function (d) {
      cauDe[d] = rut(d, S.n[d], S.chon, r, bo);
      var n = cauDe[d].reduce(function (t, ks) { return t + ks.length; }, 0);
      if (n < S.n[d]) thieu.push(TEN_PHAN[d] + ": cần " + S.n[d] + " câu, ngân hàng của các bài đã chọn chỉ có " + co[d]);
    });
    S.de = { ten: S.ten, hat: hat, cau: cauDe, soMa: S.soMa, maDau: S.maDau, daoPA: S.daoPA, giuMa1: S.giuMa1, luc: new Date().toLocaleString("vi-VN") };
    luu();
    thongBao = thieu.length ? "Chưa đủ câu: " + thieu.join("; ") + ". Cô chọn thêm bài hoặc giảm số câu." : "Đã tạo đề. Cô xem lại từng câu bên dưới, bấm \"Đổi câu\" nếu muốn thay.";
  }
  function doiCau(d, i) {
    var de = S.de, cu = de.cau[d][i], dung = {};
    DANG.forEach(function (x) { de.cau[x].forEach(function (ks) { ks.forEach(function (k) { dung[k] = 1; }); }); });
    var bai = cu[0].replace(/-[A-Z]+\d+$/, ""), cung = [], khac = [];
    nhomCau(S.chon).forEach(function (g) {
      if (g.dang !== d || g.ks.length !== cu.length || g.ks.some(function (k) { return dung[k]; })) return;
      (g.ks[0].replace(/-[A-Z]+\d+$/, "") === bai ? cung : khac).push(g.ks);
    });
    var ds = cung.length ? cung : khac;
    if (!ds.length) { thongBao = "Không còn câu nào khác cùng dạng để đổi."; return; }
    de.cau[d][i] = ds[Math.floor(Math.random() * ds.length)]; luu();
    thongBao = "Đã đổi câu.";
  }

  /* ---------- giao diện ---------- */
  function html() {
    var ng = nguon(), co = demCo(S.chon);
    var h = '<div class="head"><h2>Tạo đề kiểm tra</h2></div>' +
      '<p class="muted noprint">Rút câu từ ngân hàng của hồ sơ theo số câu của mẫu phiếu, trộn nhiều mã đề, tải Word (đề và đáp án) để in, gửi đáp án sang <b>Chấm điểm tự động</b> để học sinh tô phiếu rồi chụp chấm. Câu tự luận và câu thiếu hình không được rút.</p>';
    h += '<div class="card"><div class="tdLuoi">' +
      '<label>Tên bài kiểm tra<input id="tdTen" value="' + esc(S.ten) + '" placeholder="VD: KT thường xuyên Chương 3 - 10A5"></label>' +
      '<label>Mẫu phiếu<select id="tdMau">' + MAU.map(function (m) { return '<option value="' + m.id + '"' + (m.id === S.mau ? " selected" : "") + ">" + esc(m.ten) + "</option>"; }).join("") + "</select></label>" +
      DANG.map(function (d, i) { var cap = mau().n[i]; return '<label>' + TEN_PHAN[d] + " (" + ["Nhiều lựa chọn", "Đúng/Sai", "Trả lời ngắn"][i] + ')<span class="tdSo"><input type="number" min="0" max="' + cap + '" data-tdn="' + d + '" value="' + S.n[d] + '"> / ' + cap + ' câu · ngân hàng có <b' + (co[d] < S.n[d] ? ' class="tdThieu"' : "") + ">" + co[d] + "</b></span></label>"; }).join("") +
      '<label>Số mã đề<input id="tdSoMa" type="number" min="1" max="24" value="' + S.soMa + '"></label>' +
      '<label>Mã đề đầu tiên<input id="tdMaDau" type="number" min="100" max="9990" value="' + S.maDau + '"></label>' +
      "</div>" +
      '<label class="tdChk"><input type="checkbox" id="tdDaoPA"' + (S.daoPA ? " checked" : "") + "> Đảo thứ tự phương án A, B, C, D (câu có phương án nhắc tới phương án khác thì giữ nguyên)</label>" +
      '<label class="tdChk"><input type="checkbox" id="tdGiu"' + (S.giuMa1 ? " checked" : "") + "> Mã đề đầu giữ đúng thứ tự đề gốc</label></div>";
    h += '<div class="card"><b>Lấy câu từ các bài</b> <span class="muted">(chia đều câu cho các bài đã chọn)</span>';
    ng.forEach(function (c) {
      var tat = c.bai.every(function (b) { return S.chon[c.dl + ":" + b.ma]; });
      h += '<div class="tdCh"><label class="tdChk"><input type="checkbox" data-tdch="' + c.dl + '"' + (tat ? " checked" : "") + "> <b>" + esc(c.ten) + "</b></label><div class=\"tdBai\">" +
        c.bai.map(function (b) { var k = c.dl + ":" + b.ma; return '<label class="tdChk"><input type="checkbox" data-tdbai="' + k + '"' + (S.chon[k] ? " checked" : "") + "> " + esc(b.ten) + "</label>"; }).join("") + "</div></div>";
    });
    h += '<div class="muted">Hồ sơ mới có ngân hàng của các chương trên. Chương khác cần nạp câu hỏi vào hồ sơ trước.</div></div>';
    h += '<div class="row"><button class="go" data-td="tao">' + (S.de ? "Tạo lại đề (rút câu mới)" : "Tạo đề") + '</button><span id="tdMsg" class="muted" role="status">' + esc(thongBao) + "</span></div>";
    if (S.de) h += xemDe();
    return h;
  }
  function mau() { for (var i = 0; i < MAU.length; i++) if (MAU[i].id === S.mau) return MAU[i]; return MAU[0]; }
  function xemDe() {
    var de = S.de, ma = lamMa(de), codes = Object.keys(ma), pv = [];
    var h = '<div class="card"><div class="row" style="margin:0 0 6px"><b>' + esc(de.ten || "(chưa đặt tên)") + "</b><span class=\"muted\">tạo lúc " + esc(de.luc) + " · " + codes.length + " mã đề: " + codes.join(", ") + "</span></div>" +
      '<div class="row" style="margin:0"><button class="go" data-td="word">⬇ Tải đề Word</button><button data-td="wordDA">⬇ Tải đáp án Word</button><button data-td="gui">Gửi đáp án sang Chấm điểm tự động</button><span id="tdMsg2" class="muted" role="status"></span></div></div>';
    DANG.forEach(function (d) {
      var ks = []; de.cau[d].forEach(function (g) { ks = ks.concat(g); });
      if (!ks.length) return;
      h += "<h3>" + TEN_PHAN[d] + " · " + ks.length + " câu (đề gốc)</h3>";
      var n = 0;
      de.cau[d].forEach(function (g, gi) {
        g.forEach(function (k, j) {
          n++; var q = cau(k), dl = k.split(":")[0], note = PHAN_VAN[k];
          if (note) pv.push({ k: k, n: n, d: d, note: note });
          h += '<div class="card tdCau' + (note ? " tdPV" : "") + '"><div class="row" style="margin:0 0 4px"><b>Câu ' + n + ".</b><span class=\"tag m\">" + esc(q.id) + "</span>" + (dl === "12-2" ? '<span class="tag m">Khối 12</span>' : "") + (note ? '<span class="tag tdTagPV">⚠ cần xem lại</span>' : "") + '<span class="sp"></span>' + (j === 0 ? '<button class="link noprint" data-td="doi" data-d="' + d + '" data-i="' + gi + '">Đổi câu</button>' : "") + "</div>";
          h += T(q.dang === "ds" ? (q.ds.dan || q.de) : q.de);
          var u = anhCua(q); if (u) h += '<div class="qimg"><img alt="Hình câu ' + n + '" src="' + u + '"></div>';
          if (d === "tn") h += '<div class="opts">' + q.tn.phuong_an.map(function (p, i) { var dung = "ABCD"[i] === q.tn.dap_an; return '<div' + (dung ? ' class="tdDung"' : "") + "><b>" + "ABCD"[i] + ".</b> " + T(p) + "</div>"; }).join("") + "</div>";
          if (d === "ds") h += '<ol class="ys" type="a">' + q.ds.y.map(function (y) { return "<li>" + T(y.noi_dung) + ' <b class="' + (y.dung ? "tdD" : "tdS") + '">' + (y.dung ? "Đúng" : "Sai") + "</b></li>"; }).join("") + "</ol>";
          if (d === "tln") h += '<div class="tdDung">Đáp số: <b>' + esc(dapSo(q)) + "</b> " + esc(q.tln.don_vi || "") + "</div>";
          var gt = d === "tn" ? q.tn.giai_thich : d === "tln" ? q.tln.cach_giai : "";
          if (gt) h += '<div class="muted">' + T(gt) + "</div>";
          if (note) h += '<div class="warn">⚠ ' + esc(note) + "</div>";
          h += "</div>";
        });
      });
    });
    var bang = '<h3>Đáp án các mã đề</h3><div class="tdBang"><table><tr><th>Mã</th><th>Phần I</th><th>Phần II</th><th>Phần III</th></tr>' + codes.map(function (c) {
      var a = dapAnMa(ma[c]);
      return "<tr><td><b>" + c + "</b></td><td>" + a.tn.join("") + "</td><td>" + a.ds.map(function (x) { return x.join("").replace(/D/g, "Đ"); }).join(" ") + "</td><td>" + a.tln.join("; ") + "</td></tr>";
    }).join("") + "</table></div>";
    var hpv = '<div class="card"><b>Câu em phân vân, cô xem lại giúp:</b> ' + (pv.length ? "<ul>" + pv.map(function (x) { return "<li>" + TEN_PHAN[x.d] + " câu " + x.n + " (" + esc(x.k.split(":")[1]) + "): " + esc(x.note) + "</li>"; }).join("") + "</ul>" : '<span class="muted">không có câu nào trong đề này.</span>') +
      '<div class="muted">Đáp án của mọi câu trong ngân hàng đã được dò lại (tính lại các câu tính toán, đối chiếu hình), đều khớp.</div></div>';
    return hpv + h + bang;
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#tdGoc")) return;
    if (t.id === "tdMau") { S.mau = t.value; var m = mau(); DANG.forEach(function (d, i) { S.n[d] = m.n[i]; }); }
    else if (t.getAttribute("data-tdn")) { var d = t.getAttribute("data-tdn"), cap = mau().n[DANG.indexOf(d)]; S.n[d] = Math.max(0, Math.min(cap, parseInt(t.value, 10) || 0)); }
    else if (t.id === "tdSoMa") S.soMa = Math.max(1, Math.min(24, parseInt(t.value, 10) || 1));
    else if (t.id === "tdMaDau") S.maDau = Math.max(100, Math.min(9990, parseInt(t.value, 10) || 101));
    else if (t.id === "tdDaoPA") S.daoPA = t.checked;
    else if (t.id === "tdGiu") S.giuMa1 = t.checked;
    else if (t.getAttribute("data-tdch")) { var dl = t.getAttribute("data-tdch"); nguon().forEach(function (c) { if (c.dl === dl) c.bai.forEach(function (b) { if (t.checked) S.chon[dl + ":" + b.ma] = 1; else delete S.chon[dl + ":" + b.ma]; }); }); }
    else if (t.getAttribute("data-tdbai")) { var kb = t.getAttribute("data-tdbai"); if (t.checked) S.chon[kb] = 1; else delete S.chon[kb]; }
    else return;
    if (S.de && (t.id === "tdSoMa" || t.id === "tdMaDau" || t.id === "tdDaoPA" || t.id === "tdGiu")) { S.de.soMa = S.soMa; S.de.maDau = S.maDau; S.de.daoPA = S.daoPA; S.de.giuMa1 = S.giuMa1; }
    luu(); A.ve();
  });
  document.addEventListener("input", function (e) { if (e.target.id === "tdTen") { S.ten = e.target.value; if (S.de) S.de.ten = S.ten; luu(); } });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-td]"); if (!t) return;
    var a = t.getAttribute("data-td");
    if (a === "tao") { if (!Object.keys(S.chon).length) { thongBao = "Cô chọn ít nhất một bài để lấy câu."; A.ve(); return; } if (S.de && !confirm("Tạo lại sẽ rút bộ câu mới, bỏ đề đang có. Tiếp tục?")) return; taoDe(); A.ve(); }
    else if (a === "doi") { doiCau(t.getAttribute("data-d"), +t.getAttribute("data-i")); A.ve(); }
    else if (a === "word") taiWord(false);
    else if (a === "wordDA") taiWord(true);
    else if (a === "gui") guiCham();
  });
  function bao(s) { var e = $("tdMsg2"); if (e) e.textContent = s; }

  /* ---------- Word ---------- */
  function tenTep(s) { return boDau(s || "De-kiem-tra").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "De-kiem-tra"; }
  function taiWord(laDA) {
    if (!S.de) return;
    try {
      var b = laDA ? docxDapAn(S.de) : docxDe(S.de);
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([b], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
      a.download = tenTep(S.de.ten) + (laDA ? "-DAP-AN" : "") + ".docx"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      bao(laDA ? "Đã tải đáp án." : "Đã tải đề: mỗi mã đề bắt đầu ở trang mới.");
    } catch (x) { bao("Không tạo được tệp Word: " + x.message); }
  }

  /* --- Word: đoạn văn, chữ, công thức --- */
  var SZ = 23; /* 11,5 pt */
  function xe(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function run(s, o) {
    o = o || {}; if (s === "") return "";
    var pr = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' + (o.b ? "<w:b/>" : "") + (o.i ? "<w:i/>" : "") + (o.u ? '<w:u w:val="single"/>' : "") + '<w:sz w:val="' + (o.sz || SZ) + '"/><w:szCs w:val="' + (o.sz || SZ) + '"/></w:rPr>';
    return String(s).split("\n").map(function (p, i) { return (i ? "<w:r>" + pr + "<w:br/></w:r>" : "") + (p ? "<w:r>" + pr + '<w:t xml:space="preserve">' + xe(p) + "</w:t></w:r>" : ""); }).join("");
  }
  function chu(s, o) { /* chữ có $...$ */
    return String(s == null ? "" : s).split(/(\$[^$]+\$)/).map(function (p) { return p.length > 2 && p[0] === "$" && p[p.length - 1] === "$" ? omml(p.slice(1, -1)) : run(p, o); }).join("");
  }
  function para(noi, o) {
    o = o || {};
    var pr = "<w:pPr>" + (o.keep ? "<w:keepNext/>" : "") + (o.tabs ? "<w:tabs>" + o.tabs.map(function (x) { return '<w:tab w:val="left" w:pos="' + x + '"/>'; }).join("") + "</w:tabs>" : "") +
      '<w:spacing w:before="' + (o.tr || 0) + '" w:after="' + (o.sau || 0) + '" w:line="264" w:lineRule="auto"/>' + (o.thut ? '<w:ind w:left="' + o.thut + '"/>' : "") + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : "") + (o.ngat ? "<w:pageBreakBefore/>" : "") + "</w:pPr>";
    return "<w:p>" + pr + noi + "</w:p>";
  }
  var TAB = "<w:r><w:tab/></w:r>";

  /* --- LaTeX → OMML: KaTeX dựng MathML, đổi từng thẻ sang OMML --- */
  function xmlParse(s) { /* bộ đọc XML nhỏ cho MathML của KaTeX: trả về {t, a, c:[...]} hoặc chuỗi */
    var i = 0, root = { t: "#", a: {}, c: [] }, st = [root];
    function ent(x) { return x.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, function (m, g) { g = g.toLowerCase(); return g[0] === "#" ? String.fromCodePoint(g[1] === "x" ? parseInt(g.slice(2), 16) : +g.slice(1)) : { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[g]; }); }
    while (i < s.length) {
      var lt = s.indexOf("<", i);
      if (lt < 0) lt = s.length;
      if (lt > i) { var tx = ent(s.slice(i, lt)); if (tx) st[st.length - 1].c.push(tx); }
      if (lt >= s.length) break;
      var gt = s.indexOf(">", lt), tag = s.slice(lt + 1, gt); i = gt + 1;
      if (tag[0] === "/") { st.pop(); continue; }
      if (tag[0] === "!" || tag[0] === "?") continue;
      var tu = tag[tag.length - 1] === "/"; if (tu) tag = tag.slice(0, -1);
      var m = tag.match(/^([\w:-]+)/), el = { t: m[1], a: {}, c: [] }, re = /([\w:-]+)="([^"]*)"/g, x;
      while ((x = re.exec(tag))) el.a[x[1]] = ent(x[2]);
      st[st.length - 1].c.push(el); if (!tu) st.push(el);
    }
    return root;
  }
  function chuCua(n) { return (typeof n === "string" ? n : n.c.map(chuCua).join("")).normalize("NFC"); }
  function mrPr(sty) { return "<m:rPr>" + (sty ? '<m:sty m:val="' + sty + '"/>' : "") + "</m:rPr>"; }
  var WR = '<w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:sz w:val="' + SZ + '"/><w:szCs w:val="' + SZ + '"/></w:rPr>';
  function mr(s, sty) { return s ? "<m:r>" + mrPr(sty) + WR + '<m:t xml:space="preserve">' + xe(s) + "</m:t></m:r>" : ""; }
  /* chữ thường trong công thức (\text{hằng số}): chữ Times New Roman đứng, không phải chữ toán */
  function mrChu(s) { return s ? '<m:r><m:rPr><m:nor/></m:rPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="' + SZ + '"/><w:szCs w:val="' + SZ + '"/></w:rPr><m:t xml:space="preserve">' + xe(s) + "</m:t></m:r>" : ""; }
  /* gộp số thập phân 1{,}5: <mn>1</mn><mrow><mo>,</mo></mrow><mn>5</mn> → <mn>1,5</mn> */
  function gopSo(c) {
    var out = [];
    for (var i = 0; i < c.length; i++) {
      var x = c[i], p = out[out.length - 1], y = c[i + 1];
      var phay = x && typeof x !== "string" && ((x.t === "mo" && chuCua(x) === ",") || (x.t === "mrow" && x.c.length === 1 && x.c[0].t === "mo" && chuCua(x.c[0]) === ","));
      if (phay && p && p.t === "mn" && y && y.t === "mn") { p.c = [chuCua(p) + "," + chuCua(y)]; i++; continue; }
      out.push(x);
    }
    return out;
  }
  function con(n) { return gopSo(n.c.filter(function (x) { return typeof x !== "string" || x.trim(); })); }
  function om(n) {
    if (typeof n === "string") return mr(n, "p");
    var c = con(n), f = function (k) { return "<m:e>" + (c[k] ? om(c[k]) : "") + "</m:e>"; }, g = function (tag, k) { return "<m:" + tag + ">" + (c[k] ? om(c[k]) : "") + "</m:" + tag + ">"; };
    switch (n.t) {
      case "math": case "semantics": case "mrow": case "mstyle": case "mpadded": case "menclose": case "#": return c.map(om).join("");
      case "annotation": case "mphantom": return "";
      case "mi": { var s = chuCua(n), v = n.a.mathvariant; return mr(s, v === "bold" ? "b" : v === "bold-italic" ? "bi" : v === "normal" || s.length > 1 ? "p" : ""); }
      case "mn": return mr(chuCua(n), "p");
      case "mo": return mr(chuCua(n), "p");
      case "mtext": { if (/^ZZQ\d+$/.test(chuCua(n))) return mrChu(CHU_VIET[+chuCua(n).slice(3)]); var tx = chuCua(n).replace(/ /g, " "); return /[^\x00-\x7f]/.test(tx.replace(/\s/g, "")) ? mrChu(tx) : mr(tx, "p"); }
      case "ms": return mr(chuCua(n), "p");
      case "mspace": { var w = parseFloat(n.a.width || "0"); return w > 0.2 ? mr(" ", "p") : ""; }
      case "mfrac": return "<m:f>" + (n.a.linethickness === "0px" ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : "") + g("num", 0) + g("den", 1) + "</m:f>";
      case "msqrt": return '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>' + c.map(om).join("") + "</m:e></m:rad>";
      case "mroot": return "<m:rad>" + g("deg", 1) + f(0) + "</m:rad>";
      case "msub": return "<m:sSub>" + f(0) + g("sub", 1) + "</m:sSub>";
      case "msup": return "<m:sSup>" + f(0) + g("sup", 1) + "</m:sSup>";
      case "msubsup": return "<m:sSubSup>" + f(0) + g("sub", 1) + g("sup", 2) + "</m:sSubSup>";
      case "mover": {
        var dau = c[1] ? chuCua(c[1]) : "";
        if (/^[⃗→]$/.test(dau)) return '<m:acc><m:accPr><m:chr m:val="⃗"/></m:accPr>' + f(0) + "</m:acc>";
        if (/^[‾¯_]$/.test(dau)) return '<m:bar><m:barPr><m:pos m:val="top"/></m:barPr>' + f(0) + "</m:bar>";
        var ACC = { "^": "̂", "ˆ": "̂", "~": "̃", "˜": "̃", "˙": "̇", ".": "̇" };
        if (ACC[dau]) return '<m:acc><m:accPr><m:chr m:val="' + ACC[dau] + '"/></m:accPr>' + f(0) + "</m:acc>";
        return "<m:limUpp>" + f(0) + g("lim", 1) + "</m:limUpp>";
      }
      case "munder": return "<m:limLow>" + f(0) + g("lim", 1) + "</m:limLow>";
      case "munderover": return "<m:limUpp><m:e><m:limLow>" + f(0) + g("lim", 1) + "</m:limLow></m:e>" + g("lim", 2) + "</m:limUpp>";
      case "mtable": return "<m:m>" + c.map(function (tr) { return "<m:mr>" + con(tr).map(function (td) { return "<m:e>" + om(td) + "</m:e>"; }).join("") + "</m:mr>"; }).join("") + "</m:m>";
      case "mtd": case "mtr": return c.map(om).join("");
      default: return c.map(om).join("");
    }
  }
  /* chữ tiếng Việt trong \text{...}, \mathrm{...}: KaTeX tách dấu thành chữ + dấu ghép, nên thay bằng mã ZZQn rồi trả lại nguyên chữ */
  var CHU_VIET = [];
  function omml(tex) {
    var mml;
    CHU_VIET = [];
    tex = String(tex).replace(/\\(text|mathrm)\{([^{}]*[^\x00-\x7f][^{}]*)\}/g, function (m, l, s) { CHU_VIET.push(s.normalize("NFC")); return "\\text{ZZQ" + (CHU_VIET.length - 1) + "}"; });
    try { mml = window.katex.renderToString(tex.replace(/\^\\circ/g, "^{\\circ}"), { output: "mathml", throwOnError: true, strict: false }); }
    catch (e) { return run(tex); }
    var goc = xmlParse(mml.replace(/^<span[^>]*>|<\/span>$/g, "")), math = null;
    (function tim(n) { if (math || typeof n === "string") return; if (n.t === "math") { math = n; return; } n.c.forEach(tim); })(goc);
    return "<m:oMath>" + (math ? om(math) : "") + "</m:oMath>";
  }

  /* --- ảnh --- */
  function b64(u) { var m = String(u).match(/^data:image\/(png|jpe?g);base64,(.*)$/); if (!m) return null; var s = atob(m[2]), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return { ext: m[1] === "png" ? "png" : "jpeg", b: b }; }
  function coAnh(b) { /* [rộng, cao] theo điểm ảnh */
    if (b[0] === 0x89 && b[1] === 0x50) return [(b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0];
    var i = 2; while (i < b.length) { if (b[i] !== 0xFF) { i++; continue; } var mk = b[i + 1], L = b[i + 2] << 8 | b[i + 3]; if (mk >= 0xC0 && mk <= 0xCF && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) return [b[i + 7] << 8 | b[i + 8], b[i + 5] << 8 | b[i + 6]]; i += 2 + L; }
    return [400, 300];
  }
  function Doc() { this.anh = []; this.id = 1; }
  /* hình: giữ nguyên cả ảnh (không cắt), cỡ thật ở 96 dpi, chỉ thu nhỏ khi rộng quá 10 cm hoặc cao quá 6 cm */
  Doc.prototype.hinh = function (u) {
    var x = b64(u); if (!x) return "";
    var wh = coAnh(x.b), EMU = 9525, cx = wh[0] * EMU, cy = wh[1] * EMU, maxX = 10 * 360000, maxY = 6 * 360000, k = Math.min(1, maxX / cx, maxY / cy);
    cx = Math.round(cx * k); cy = Math.round(cy * k);
    var n = this.anh.length + 1, rid = "rIdA" + n, id = this.id++;
    this.anh.push({ ten: "media/hinh" + n + "." + (x.ext === "png" ? "png" : "jpeg"), b: x.b, rid: rid });
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + id + '" name="Hinh ' + n + '"/>' +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:nvPicPr><pic:cNvPr id="' + id + '" name="hinh' + n + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  };
  Doc.prototype.zip = function (body) {
    var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + "><w:body>" + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="1134" w:header="425" w:footer="425" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="' + SZ + '"/><w:szCs w:val="' + SZ + '"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="108" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
    var settings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:mathPr><m:mathFont m:val="Cambria Math"/><m:dispDef/><m:defJc m:val="left"/></m:mathPr><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
      this.anh.map(function (x) { return '<Relationship Id="' + x.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + x.ten + '"/>'; }).join("") + "</Relationships>";
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>';
    var root = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    var f = [["[Content_Types].xml", ct], ["_rels/.rels", root], ["word/document.xml", doc], ["word/styles.xml", styles], ["word/settings.xml", settings], ["word/_rels/document.xml.rels", rels]];
    this.anh.forEach(function (x) { f.push(["word/" + x.ten, x.b]); });
    return zip(f);
  };
  /* tệp zip không nén (đủ cho docx) */
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function zip(files) {
    var parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, v >>> 8 & 255]; }
    function u32(v) { return [v & 255, v >>> 8 & 255, v >>> 16 & 255, v >>> 24 & 255]; }
    files.forEach(function (f) {
      var name = utf8(f[0]), data = typeof f[1] === "string" ? utf8(f[1]) : f[1], crc = crc32(data);
      var h = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(h), name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
      off += h.length + name.length + data.length;
    });
    var cs = central.reduce(function (t, x) { return t + x.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cs), u32(off), u16(0)));
    var all = parts.concat(central, [end]), n = all.reduce(function (t, x) { return t + x.length; }, 0), out = new Uint8Array(n), p = 0;
    all.forEach(function (x) { out.set(x, p); p += x.length; });
    return out;
  }

  /* --- đề --- */
  function dai(s) { return String(s).replace(/\$([^$]+)\$/g, function (m, t) { return t.replace(/\\[a-zA-Z]+|[{}_^]/g, ""); }).length; }
  function phuongAn(q, pa) { /* 4 phương án: cùng dòng nếu ngắn, 2 dòng nếu vừa, mỗi dòng một phương án nếu dài */
    var ds = pa.map(function (i) { return q.tn.phuong_an[i]; }), m = Math.max.apply(null, ds.map(dai)), W = 9921, nh = function (i) { return run("ABCD"[i] + ". ", { b: true }) + chu(ds[i]); };
    if (m <= 20) return para(TAB + nh(0) + TAB + nh(1) + TAB + nh(2) + TAB + nh(3), { tabs: [284, 284 + W / 4, 284 + W / 2, 284 + 3 * W / 4] });
    if (m <= 44) return para(TAB + nh(0) + TAB + nh(1), { tabs: [284, 284 + W / 2], keep: true }) + para(TAB + nh(2) + TAB + nh(3), { tabs: [284, 284 + W / 2] });
    return ds.map(function (x, i) { return para(nh(i), { thut: 284, keep: i < 3 }); }).join("");
  }
  /* đề in không ghi nguồn "(SGK tr. 66)", "(SGK tr. 58, Hình 13.7)" ở đầu câu */
  function boNguon(s) { return String(s).replace(/^\s*\(SGK[^)]*\)\s*/, ""); }
  function docxDe(de) {
    var D = new Doc(), ma = lamMa(de), body = "", dau = true;
    Object.keys(ma).forEach(function (code) {
      var x = ma[code];
      body += para(run("Trường: ……………………………", { b: true }) + TAB + run("Lớp: ………", { b: true }) + TAB + run("Môn Vật lí. KT …………………", { b: true }), { tabs: [4300, 6200], ngat: !dau });
      body += para(run("Họ và tên: ……………………………………………………………", {}) + TAB + run("Mã đề " + code, { b: true }), { tabs: [8000], sau: 120, tr: 60 });
      dau = false;
      DANG.forEach(function (d) {
        var ds = x[d]; if (!ds.length) return;
        body += para(run(TEN_PHAN[d] + ". ", { b: true }) + run(LOI_PHAN[d].replace("{n}", ds.length)), { tr: 120, sau: 40, keep: true, jc: "both" });
        ds.forEach(function (it, i) {
          var q = cau(it.k), u = anhCua(q), de0 = boNguon(d === "ds" ? (q.ds.dan || q.de) : q.de);
          body += para(run("Câu " + (i + 1) + ". ", { b: true }) + chu(de0), { tr: 40, keep: true, jc: "both" });
          if (u) body += para(D.hinh(u), { jc: "center", keep: true });
          if (d === "tn") body += phuongAn(q, it.pa);
          if (d === "ds") body += q.ds.y.map(function (y, j) { return para(run("abcd"[j] + ") ", { b: true }) + chu(y.noi_dung), { thut: 284, keep: j < 3, jc: "both" }); }).join("");
        });
      });
      body += para(run("------------ HẾT ------------", { b: true }), { jc: "center", tr: 160 });
    });
    return D.zip(body);
  }
  function oBang(s, w, b) { return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr>' + para(run(s, { b: b }), { jc: "center" }) + "</w:tc>"; }
  function bangW(rows, ws) {
    return '<w:tbl><w:tblPr><w:tblBorders>' + ["top", "left", "bottom", "right", "insideH", "insideV"].map(function (k) { return "<w:" + k + ' w:val="single" w:sz="4" w:space="0" w:color="000000"/>'; }).join("") + "</w:tblBorders><w:tblLayout w:type=\"fixed\"/></w:tblPr><w:tblGrid>" + ws.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join("") + "</w:tblGrid>" +
      rows.map(function (r, i) { return "<w:tr>" + r.map(function (c, j) { return oBang(c, ws[j], i === 0 || j === 0); }).join("") + "</w:tr>"; }).join("") + "</w:tbl>";
  }
  function docxDapAn(de) {
    var D = new Doc(), ma = lamMa(de), body = "", codes = Object.keys(ma);
    body += para(run("ĐÁP ÁN " + (de.ten || "BÀI KIỂM TRA").toUpperCase(), { b: true, sz: 26 }), { jc: "center", sau: 120 });
    codes.forEach(function (code) {
      var a = dapAnMa(ma[code]);
      body += para(run("Mã đề " + code, { b: true }), { tr: 160, sau: 60, keep: true });
      if (a.tn.length) { body += para(run("Phần I", { b: true }), { keep: true }); for (var s = 0; s < a.tn.length; s += 10) { var c1 = a.tn.slice(s, s + 10); body += bangW([["Câu"].concat(c1.map(function (x, i) { return String(s + i + 1); })), ["Đáp án"].concat(c1)], [1100].concat(c1.map(function () { return 800; }))); } }
      if (a.ds.length) { body += para(run("Phần II", { b: true }), { tr: 80, keep: true }); body += bangW([["Câu", "a)", "b)", "c)", "d)"]].concat(a.ds.map(function (x, i) { return [String(i + 1)].concat(x.map(function (v) { return v === "D" ? "Đúng" : "Sai"; })); })), [1100, 1100, 1100, 1100, 1100]); }
      if (a.tln.length) { body += para(run("Phần III", { b: true }), { tr: 80, keep: true }); body += bangW([["Câu"].concat(a.tln.map(function (x, i) { return String(i + 1); })), ["Đáp số"].concat(a.tln)], [1100].concat(a.tln.map(function () { return 900; }))); }
    });
    /* lời giải theo đề gốc (mã đầu) và nguồn câu */
    var x0 = ma[codes[0]];
    body += para(run("Lời giải (theo thứ tự câu của mã đề " + codes[0] + ")", { b: true }), { tr: 240, sau: 60, ngat: true });
    DANG.forEach(function (d) {
      if (!x0[d].length) return;
      body += para(run(TEN_PHAN[d], { b: true }), { tr: 80 });
      x0[d].forEach(function (it, i) {
        var q = cau(it.k), a = dapAnMa(x0), dap = d === "tn" ? a.tn[i] : d === "ds" ? a.ds[i].map(function (v, j) { return "abcd"[j] + ") " + (v === "D" ? "Đ" : "S"); }).join("; ") : a.tln[i] + " " + (q.tln.don_vi || "");
        body += para(run("Câu " + (i + 1) + " (" + q.id + "): ", { b: true }) + run(dap, { b: true }) + run(" "), { tr: 40, jc: "both" });
        var gt = d === "tn" ? q.tn.giai_thich : d === "tln" ? q.tln.cach_giai : "";
        if (gt) body += para(chu(gt), { thut: 284, jc: "both" });
        if (d === "ds") q.ds.y.forEach(function (y, j) { if (y.giai_thich) body += para(run("abcd"[j] + ") ") + chu(y.giai_thich), { thut: 284, jc: "both" }); });
        if (PHAN_VAN[it.k]) body += para(run("⚠ Cần cô xem lại: " + PHAN_VAN[it.k], { i: true }), { thut: 284 });
      });
    });
    return D.zip(body);
  }

  /* ---------- gửi sang Chấm điểm tự động ---------- */
  var API = "";
  function layApi() {
    if (API) return Promise.resolve(API);
    if (window.CP_API) return Promise.resolve(API = window.CP_API);
    return new Promise(function (ok, loi) {
      var s = document.createElement("script"); s.src = (A.cfg.chamDiem && A.cfg.chamDiem.trang ? A.cfg.chamDiem.trang.replace(/[^/]*$/, "") : "cham-diem/") + "config.js?" + Date.now();
      s.onload = function () { if (window.CP_API) ok(API = window.CP_API); else loi(new Error("Chưa có địa chỉ web app Chấm điểm (cham-diem/config.js).")); };
      s.onerror = function () { loi(new Error("Không đọc được cham-diem/config.js.")); };
      document.head.appendChild(s);
    });
  }
  function goi(p) {
    return layApi().then(function (u) { return fetch(u, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(p) }); })
      .then(function (r) { if (!r.ok) throw new Error("Máy chủ trả lỗi " + r.status); return r.text(); })
      .then(function (t) { try { return JSON.parse(t); } catch (e) { throw new Error("Máy chủ Chấm điểm đang bận, cô thử lại sau ít giây."); } });
  }
  function baiCham(de) { /* đúng dạng bài mà cham-diem/index.html lưu (adminSave) */
    var ma = lamMa(de), codes = {}, n = { tn: de.cau.tn, ds: de.cau.ds, tln: de.cau.tln };
    var dem = function (d) { return n[d].reduce(function (t, ks) { return t + ks.length; }, 0); };
    var nmc = dem("tn"), ntf = dem("ds"), nsa = dem("tln");
    Object.keys(ma).forEach(function (code) {
      var a = dapAnMa(ma[code]), x = ma[code], c = {}, loi = function (ds, f) { var s = [], sol = {}; ds.forEach(function (it, i) { var t = f(cau(it.k)); if (t) { s.push("Câu " + (i + 1) + ": " + t); sol[String(i + 1)] = t; } }); return { text: s.join("\n"), sol: sol }; };
      if (nmc) { var l1 = loi(x.tn, function (q) { return q.tn.giai_thich || ""; }); c.mc = { keyText: a.tn.join(""), solText: l1.text, key: a.tn, sol: l1.sol }; }
      if (ntf) { var l2 = loi(x.ds, function (q) { return q.ds.y.map(function (y, j) { return y.giai_thich ? "abcd"[j] + ") " + y.giai_thich : ""; }).filter(Boolean).join(" "); }); c.tf = { keyText: a.ds.map(function (k) { return k.join("").replace(/D/g, "Đ"); }).join(" "), solText: l2.text, key: a.ds, sol: l2.sol }; }
      if (nsa) { var l3 = loi(x.tln, function (q) { return q.tln.cach_giai || ""; }); c.sa = { keyText: a.tln.join("\n"), solText: l3.text, key: a.tln.map(function (v) { return [v]; }), sol: l3.sol }; }
      codes[code] = c;
    });
    var id = tenTep(de.ten).toLowerCase().slice(0, 30).replace(/-+$/, "") || "de";
    return {
      id: id, title: de.ten || "Bài kiểm tra", active: false, maxAttempts: 1, showSolutions: true, normalize: true,
      parts: { mc: { enabled: nmc > 0, n: nmc || 12, pt: 0.25 }, tf: { enabled: ntf > 0, n: ntf || 4, scale: [0, 0.1, 0.25, 0.5, 1] }, sa: { enabled: nsa > 0, n: nsa || 6, pt: 0.25 } },
      codes: codes
    };
  }
  function guiCham() {
    if (!S.de) return;
    if (!S.de.ten || !S.de.ten.trim()) { bao("Cô đặt tên bài kiểm tra trước khi gửi."); var e = $("tdTen"); if (e) e.focus(); return; }
    var pass = prompt("Mật khẩu giáo viên của Chấm điểm tự động:"); if (!pass) return;
    var ex = baiCham(S.de);
    bao("Đang gửi…");
    goi({ action: "adminList", pass: pass }).then(function (r) {
      if (!r.ok) throw new Error(r.error || "Không vào được Chấm điểm.");
      var co = {}; (r.exams || []).forEach(function (x) { co[x.id] = 1; });
      var goc = ex.id, i = 2; while (co[ex.id]) ex.id = goc.slice(0, 26) + "-" + i++;
      return goi({ action: "adminSave", pass: pass, exam: ex });
    }).then(function (r) {
      if (!r.ok) throw new Error(r.error || "Không lưu được.");
      bao("Đã gửi sang Chấm điểm tự động: bài \"" + ex.title + "\" (mã bài " + ex.id + "), " + Object.keys(ex.codes).length + " mã đề. Bài đang ĐÓNG: cô vào Chấm điểm bấm mở khi cho học sinh làm.");
    }).catch(function (x) { bao("Chưa gửi được: " + x.message); });
  }

  window.TaoDe = {
    init: function (api) { A = api; },
    html: function () { return '<div id="tdGoc">' + html() + "</div>"; },
    /* cho tools/kiem_tao_de.js */
    _: { omml: omml, docxDe: docxDe, docxDapAn: docxDapAn, lamMa: lamMa, dapAnMa: dapAnMa, nhomCau: nhomCau, demCo: demCo, rut: rut, rng: rng, baiCham: baiCham, hopLe: hopLe, cau: cau, S: S, taoDe: taoDe }
  };
})();
