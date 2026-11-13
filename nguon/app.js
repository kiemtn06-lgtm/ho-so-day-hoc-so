(function () {
  var CFG = window.HO_SO, DATA = window.HSDH_DATA || {}, KEY = "hsdh_v2";
  var S = { st: {}, notes: {}, links: {}, lop: {}, pos: {}, lastLop: "", prog: {}, gc: {}, khbd: {}, pv: [], cm: [], srv: { url: "", pass: "" } };
  var HOAT = [["ga", "Giáo án"], ["sl", "Slide"], ["bt", "Bài tập"], ["on", "Ôn tập"], ["de", "Đề"]];
  var V = { khoi: CFG.khoiMacDinh, page: "tq", ch: 0, bai: 0, tab: 0, fd: "", fm: "", ans: false, quiz: null, qkey: false, edit: "" };
  var TABS = ["Trình chiếu", "SGK", "KHBD", "Bài tập", "Ôn tập", "Kiểm tra", "Ghi chú sau tiết"];
  var DANG = { tn: "Trắc nghiệm", ds: "Đúng sai", tln: "Trả lời ngắn", tl: "Tự luận" };
  var MUC = { nb: "Nhận biết", th: "Thông hiểu", vd: "Vận dụng", vdc: "Vận dụng cao" };
  var ST = ["Chưa dạy", "Đang dạy", "Đã dạy"];

  function load() { try { var t = localStorage.getItem(KEY); if (t) { var o = JSON.parse(t); for (var k in S) if (o[k] != null) S[k] = o[k]; } } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function km(tex, disp) { try { return window.katex.renderToString(tex, { throwOnError: false, displayMode: !!disp }); } catch (e) { return esc(tex); } }
  function T(s) { return String(s == null ? "" : s).split(/(\$[^$]+\$)/).map(function (p) { return p.length > 2 && p[0] === "$" && p[p.length - 1] === "$" ? km(p.slice(1, -1)) : esc(p); }).join(""); }
  function vn(x) { return String(x).replace(".", ","); }
  function okUrl(u) { return /^(https?:\/\/|file:\/\/\/)\S+$/i.test(u); }
  function today() { return new Date().toLocaleDateString("vi-VN"); }

  function chs() { return CFG.khoi[V.khoi].chuong; }
  function dOf(ch) { return ch && ch.duLieu && DATA[ch.duLieu]; }
  function curCh() { return chs()[V.ch]; }
  /* địa chỉ bài giảng của một bài: ch.baiGiang là một file cho cả chương, hoặc mẫu có {ma} khi mỗi bài một file */
  function bgUrl(ch, b) { return String(ch.baiGiang).replace("{ma}", b.ma) + "#" + b.ma; }
  /* ảnh của câu hỏi (trường anh), lấy từ dữ liệu chương */
  function anhSrc(k) { for (var m in DATA) if (DATA[m].anh && DATA[m].anh[k]) return DATA[m].anh[k]; return ""; }
  function curBai() { var d = dOf(curCh()); return d ? d.bai[V.bai] : null; }
  function bKey(b) { return curCh().duLieu + "." + b.ma; }
  function firstData() { V.ch = 0; V.bai = 0; var c = chs(); for (var i = 0; i < c.length; i++) if (dOf(c[i])) { V.ch = i; return true; } return false; }
  function lopNames() { return Object.keys(S.lop).sort(); }

  /* ---------- cây chương, bài ---------- */
  function renderHead() {
    $("tieuDe").textContent = CFG.ten + " · " + CFG.khoi[V.khoi].ten + " · " + CFG.namHoc;
    $("chonKhoi").innerHTML = Object.keys(CFG.khoi).map(function (k) { return '<button data-a="khoi" data-k="' + k + '" class="' + (k === V.khoi ? "on" : "") + '">Khối ' + k + "</button>"; }).join("");
  }
  function renderTree() {
    var h = '<button data-a="page" data-p="tq" class="' + (V.page === "tq" ? "on" : "") + '">Tổng quan khối ' + V.khoi + "</button>";
    chs().forEach(function (ch, i) {
      var d = dOf(ch), lt = ch.luyenTap || [];
      if (!d && !lt.length) { h += '<div class="ch no">' + (i + 1) + ". " + esc(ch.ten) + " · chưa có dữ liệu</div>"; return; }
      h += '<div class="ch">' + (i + 1) + ". " + esc(ch.ten) + (d ? "" : " · chỉ có bài luyện") + "</div>";
      if (d) d.bai.forEach(function (b, j) {
        var on = V.page === "bai" && V.ch === i && V.bai === j;
        h += '<button data-a="bai" data-ch="' + i + '" data-i="' + j + '" class="' + (on ? "on" : "") + '"><i class="dot s' + (S.st[ch.duLieu + "." + b.ma] || 0) + '"></i>' + esc(b.ten) + "</button>";
      });
      lt.forEach(function (x, j) {
        var on = V.page === "lt" && V.ch === i && V.lt === j;
        h += '<button data-a="lt" data-ch="' + i + '" data-i="' + j + '" class="' + (on ? "on" : "") + '"><i class="ti-dot"></i>' + esc(x.ten) + "</button>";
      });
    });
    h += '<hr><button data-a="page" data-p="ph" class="' + (V.page === "ph" ? "on" : "") + '">Làm bài trực tuyến</button>';
    h += '<button data-a="page" data-p="hd" class="' + (V.page === "hd" ? "on" : "") + '">Hỏi đáp</button>';
    h += '<button data-a="page" data-p="lop" class="' + (V.page === "lop" ? "on" : "") + '">Lớp học</button>';
    h += '<button data-a="page" data-p="cc" class="' + (V.page === "cc" ? "on" : "") + '">Sao lưu dữ liệu</button>';
    $("tree").innerHTML = h;
  }

  /* ---------- câu hỏi ---------- */
  function ansHTML(q) {
    if (q.dang === "tn") return "<b>Đáp án " + esc(q.tn.dap_an) + ".</b> " + T(q.tn.giai_thich || "");
    if (q.dang === "ds") return q.ds.y.map(function (y) { return "<b>" + esc(y.nhan) + ") " + (y.dung ? "Đúng" : "Sai") + ".</b> " + T(String(y.giai_thich || "").replace(/^(Đúng|Sai)\s*[:.]\s*/, "")); }).join("<br>");
    if (q.dang === "tln") return "<b>Đáp số: " + esc(vn(q.tln.dap_so)) + " " + T(q.tln.don_vi || "") + ".</b> " + T(q.tln.cach_giai || "");
    return T(q.tl.loi_giai_mau || "");
  }
  function qHTML(q, n, showAns, tags) {
    var h = '<div class="card">';
    if (tags) h += '<div><span class="tag">' + DANG[q.dang] + '</span>' + (q.muc ? '<span class="tag m">' + (MUC[q.muc] || esc(q.muc)) + "</span>" : "") + (q.nguon ? '<span class="tag m">' + esc(q.nguon) + "</span>" : "") + "</div>";
    h += "<b>Câu " + n + ".</b> " + T(q.dang === "ds" ? (q.ds.dan || q.de) : q.de);
    if ((q.hinh || []).length) h += ' <span class="muted">(có hình ' + esc(q.hinh.join(", ")) + ": xem trong bài giảng)</span>";
    if (q.anh && anhSrc(q.anh)) h += '<div class="qimg"><img loading="lazy" alt="Hình của câu ' + n + '" src="' + anhSrc(q.anh) + '"></div>';
    if (q.dang === "tn") h += '<div class="opts">' + q.tn.phuong_an.map(function (p, k) { return "<div><b>" + "ABCD"[k] + ".</b> " + T(p) + "</div>"; }).join("") + "</div>";
    if (q.dang === "ds") h += '<ol class="ys" type="a">' + q.ds.y.map(function (y) { return "<li>" + T(y.noi_dung) + "</li>"; }).join("") + "</ol>";
    if (showAns) h += '<div class="ans">' + ansHTML(q) + "</div>";
    return h + "</div>";
  }

  /* ---------- các tab của bài ---------- */
  function tabTrinhChieu(b) {
    var ch = curCh(), h = '<div class="grid">';
    [["Kiến thức trọng tâm", b.kien_thuc.length], ["Công thức", b.cong_thuc.length], ["Dạng bài", b.dang_bai.length], ["Câu hỏi", b.cau_hoi.length], ["Thẻ ghi nhớ", b.the.length]].forEach(function (x) { h += '<div class="stat"><span class="muted">' + x[0] + "</span><b>" + x[1] + "</b></div>"; });
    h += "</div><h3>Vị trí đang dạy</h3>";
    var pos = Object.keys(S.pos).filter(function (k) { return k.indexOf(b.ma + "|") === 0; });
    if (!pos.length) h += '<p class="muted">Chưa dạy bài này. Bấm "Dạy ngay" để mở chế độ lên lớp.</p>';
    else h += pos.map(function (k) { var p = S.pos[k], l = k.split("|")[1]; return '<div class="card">' + (l ? "Lớp <b>" + esc(l) + "</b>" : "Chưa chọn lớp") + ": dừng ở slide " + (p.i + 1) + " / " + p.n + "</div>"; }).join("");
    h += '<div class="card">Chế độ lên lớp gồm: trình chiếu chữ lớn, gọi tên ngẫu nhiên, bấm giờ, ghi chú nhanh. Lần sau mở lại sẽ tiếp tục từ slide đang dạy của lớp đã chọn.</div>';
    if (ch.baiGiang) h += '<a class="btn" target="_blank" rel="noopener" href="' + esc(bgUrl(ch, b)) + '">Mở riêng bài giảng ở tab mới</a>';
    return h;
  }
  function tabSGK(b) {
    var d = dOf(curCh()), n = b.ma.slice(1), sg = d.sgk || {}, url = S.links[V.khoi + ".sgk"];
    var ids = Object.keys(sg).filter(function (k) { return new RegExp("^[A-Z]" + n + "-").test(k); });
    var h = '<div class="card"><b>' + esc(d.sach ? "SGK Vật lí " + V.khoi + " – " + d.sach : "Sách giáo khoa") + "</b><div>" + esc(b.ten) + " · trang " + esc(b.trang_sgk || "") + '</div><div class="row noprint" style="margin:8px 0 0">' +
      (url ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(url) + '">Mở SGK</a>' : "") +
      '<button class="link" data-a="link" data-t="sgk">' + (url ? "Đổi liên kết SGK" : "Gắn liên kết tới file hoặc trang SGK") + '</button><span id="ccMsg" class="muted" role="status"></span></div></div>';
    h += "<h3>Hình và bảng trong SGK của bài (" + ids.length + ")</h3>";
    if (!ids.length) return h + '<p class="muted">Chưa có hình SGK cho bài này.</p>';
    h += '<p class="muted noprint">Bấm vào hình để phóng to, tiện chiếu lên lớp.</p><div class="sgk">' + ids.map(function (k) {
      return '<figure><button class="img" data-a="zoom" data-k="' + esc(k) + '" aria-label="Phóng to ' + esc(sg[k].cap) + '"><img loading="lazy" alt="' + esc(sg[k].cap) + '" src="' + sg[k].src + '"></button><figcaption>' + esc(sg[k].cap) + ' <span class="muted">· SGK tr. ' + esc(sg[k].tr) + "</span></figcaption></figure>";
    }).join("") + "</div>";
    return h;
  }
  function viDu(b, t) {
    var m = String(t).match(/B\d+(?:-B\d+)?-[A-Z]+\d+/), q = m && b.cau_hoi.filter(function (x) { return x.id === m[0]; })[0];
    return q ? T(q.dang === "ds" ? (q.ds.dan || q.de) : q.de) : T(t);
  }
  function ed(b, f, def) {
    var v = (S.khbd[bKey(b)] || {})[f];
    return '<div class="ed" contenteditable="true" data-f="' + f + '">' + esc(v != null ? v : def).replace(/\n/g, "<br>") + "</div>";
  }
  function hd(b, f, ten, mt, nd, sp, tc) {
    return '<div class="card"><b>' + ten + "</b><div><b>a) Mục tiêu:</b></div>" + ed(b, f + "a", mt) + "<div><b>b) Nội dung:</b></div>" + nd + ed(b, f + "b", "") +
      "<div><b>c) Sản phẩm:</b></div>" + ed(b, f + "c", sp) + "<div><b>d) Tổ chức thực hiện:</b></div>" + ed(b, f + "d", tc) + "</div>";
  }
  function tabKHBD(b) {
    var d = dOf(curCh()), md = d.moDau && d.moDau[b.ma], n = b.ma.slice(1);
    var hinh = Object.keys(d.sgk || {}).filter(function (k) { return new RegExp("^[A-Z]" + n + "-").test(k); }).map(function (k) { return d.sgk[k].cap.split(".").slice(0, 2).join("."); });
    var buoc = function (a, c, e, g) { return "Bước 1. Chuyển giao nhiệm vụ: " + a + "\nBước 2. Thực hiện nhiệm vụ: " + c + "\nBước 3. Báo cáo, thảo luận: " + e + "\nBước 4. Kết luận, nhận định: " + g; };
    var h = '<div class="row noprint"><button data-a="print">In KHBD</button><span class="muted">Khung theo Công văn 5512. Các ô viền đứt là bản nháp: bấm vào để sửa, nội dung tự lưu trên máy này.</span></div>';
    h += '<div class="card"><div style="text-align:center"><b>KẾ HOẠCH BÀI DẠY</b><br>' + esc(b.ten) + "</div><div>Môn học: Vật lí · Lớp: " + V.khoi + " · SGK tr. " + esc(b.trang_sgk || "") + "</div><div>Thời gian thực hiện:</div>" + ed(b, "tg", "… tiết") + "</div>";
    h += "<h3>I. Mục tiêu</h3><div class=\"card\"><b>1. Về kiến thức</b>" + ed(b, "kt", b.kien_thuc.map(function (k) { var m = k.y.match(/^([^:$]{4,80}):/); return "- " + (m ? m[1] : k.y.replace(/\$([^$]*)\$/g, function (x, s) { return /^[A-Za-z]{1,3}$/.test(s) ? s : "…"; }).split(/[.;]/)[0]) + "."; }).join("\n")) +
      "<b>2. Về năng lực</b>" + ed(b, "nl", "- Năng lực vật lí: nhận thức vật lí (nêu, giải thích được nội dung bài); tìm hiểu thế giới tự nhiên (quan sát thí nghiệm, mô phỏng, xử lí số liệu); vận dụng kiến thức giải bài tập và tình huống thực tế.\n- Năng lực chung: tự chủ và tự học; giao tiếp và hợp tác khi làm việc nhóm; giải quyết vấn đề.") +
      "<b>3. Về phẩm chất</b>" + ed(b, "pc", "- Chăm chỉ: tích cực thực hiện nhiệm vụ học tập.\n- Trung thực: ghi đúng số liệu, kết quả.\n- Trách nhiệm: hoàn thành phần việc trong nhóm.") + "</div>";
    h += '<h3>II. Thiết bị dạy học và học liệu</h3><div class="card">' + ed(b, "tb", "- Máy tính, máy chiếu; bài giảng trình chiếu của bài (có mô phỏng và câu hỏi tương tác).\n- SGK Vật lí " + V.khoi + " (tr. " + (b.trang_sgk || "") + ")" + (hinh.length ? "; " + hinh.join(", ") : "") + ".\n- Phiếu học tập, phiếu bài tập của bài.") + "</div>";
    h += "<h3>III. Tiến trình dạy học</h3>";
    h += hd(b, "h1", "Hoạt động 1. Mở đầu", "Tạo tình huống có vấn đề, xác định nhiệm vụ học tập của bài.", md ? '<div class="auto">Câu hỏi mở đầu' + (md[1] ? " (SGK tr. " + esc(md[1]) + ")" : "") + ": " + T(md[0]) + "</div>" : "", "Câu trả lời, dự đoán ban đầu của học sinh.",
      buoc("GV chiếu câu hỏi mở đầu, yêu cầu HS suy nghĩ và nêu dự đoán.", "HS làm việc cá nhân hoặc theo cặp.", "Gọi 2 đến 3 HS trả lời, HS khác nhận xét.", "GV ghi nhận các ý kiến, chưa kết luận, dẫn vào bài."));
    h += hd(b, "h2", "Hoạt động 2. Hình thành kiến thức mới", "HS chiếm lĩnh các nội dung kiến thức trọng tâm của bài.", '<div class="auto"><ul class="kt">' + b.kien_thuc.map(function (k) { return "<li>" + T(k.y) + "</li>"; }).join("") + "</ul>" + b.cong_thuc.map(function (c) { return '<div class="fm">' + km(c.latex, true) + "</div><div>Điều kiện: " + T(c.dieu_kien) + "</div>"; }).join("") + "</div>", "Nội dung ghi vở, kết quả phiếu học tập, câu trả lời của HS.",
      buoc("GV chiếu slide, thí nghiệm hoặc mô phỏng; giao câu hỏi và phiếu học tập.", "HS quan sát, thảo luận nhóm, ghi kết quả.", "Đại diện nhóm trình bày, các nhóm khác bổ sung.", "GV chốt kiến thức, công thức và điều kiện áp dụng."));
    h += hd(b, "h3", "Hoạt động 3. Luyện tập", "Củng cố kiến thức, rèn kĩ năng giải các dạng bài của bài.", '<div class="auto">' + b.dang_bai.map(function (x, i) { return "<div><b>Dạng " + (i + 1) + ":</b> " + T(x.dang) + ". Cách làm: " + T(x.cach_lam) + "</div>"; }).join("") + "<div>Câu hỏi trắc nghiệm và bài tập: lấy ở tab Bài tập và phần Luyện tập trong bài giảng.</div></div>", "Bài làm, đáp án và lời giải của HS.",
      buoc("GV nêu từng dạng bài, giao câu hỏi luyện tập.", "HS làm cá nhân, trao đổi với bạn bên cạnh.", "HS trình bày lời giải, lớp nhận xét.", "GV chữa bài, nhấn mạnh cách nhận dạng và cách làm."));
    h += hd(b, "h4", "Hoạt động 4. Vận dụng", "Vận dụng kiến thức vào tình huống thực tế; nhận ra và tránh các lỗi hay mắc.", '<div class="auto"><div><b>Lỗi hay mắc cần lưu ý:</b></div><ul class="kt">' + b.loi_hay_mac.map(function (k) { return "<li>" + T(k.y) + "</li>"; }).join("") + "</ul></div>", "Lời giải bài vận dụng; phần tự đánh giá của HS.",
      buoc("GV giao bài vận dụng và nhiệm vụ về nhà.", "HS làm tại lớp hoặc ở nhà.", "HS nộp bài, báo cáo ở tiết sau.", "GV nhận xét, tổng kết bài và dặn dò."));
    h += "<h3>IV. Điều chỉnh, rút kinh nghiệm</h3><div class=\"card\">" + ed(b, "rk", "") + '<div class="muted noprint">Gợi ý: xem tab Ghi chú sau tiết của bài.</div></div>';
    return h + '<h3>Phụ lục. Nội dung chi tiết của bài</h3>' + noiDung(b);
  }
  function noiDung(b) {
    var d = dOf(curCh()), md = d.moDau && d.moDau[b.ma], h = "";
    if (md) h += "<h3>Câu hỏi mở đầu" + (md[1] ? " (SGK tr. " + esc(md[1]) + ")" : "") + '</h3><div class="card">' + T(md[0]) + "</div>";
    h += '<h3>Kiến thức trọng tâm</h3><div class="card"><ul class="kt">' + b.kien_thuc.map(function (k) { return "<li>" + T(k.y) + "</li>"; }).join("") + "</ul></div>";
    if (b.cong_thuc.length) h += "<h3>Công thức</h3>" + b.cong_thuc.map(function (c) { return '<div class="card"><div class="fm">' + km(c.latex, true) + "</div><div><b>Điều kiện:</b> " + T(c.dieu_kien) + "</div><div><b>Ví dụ:</b> " + T(c.vi_du_so) + "</div></div>"; }).join("");
    h += "<h3>Dạng bài</h3>" + b.dang_bai.map(function (x, i) { return '<div class="card"><b>Dạng ' + (i + 1) + ": " + T(x.dang) + "</b><div><b>Nhận biết:</b> " + T(x.nhan_biet) + "</div><div><b>Cách làm:</b> " + T(x.cach_lam) + "</div><div><b>Ví dụ:</b> " + viDu(b, x.vi_du) + "</div></div>"; }).join("");
    h += '<h3>Câu hỏi nhanh</h3><div class="card"><ul class="kt">' + b.the.map(function (t) { return "<li>" + T(t.mat_truoc) + ' <span class="muted">→</span> ' + T(t.mat_sau) + "</li>"; }).join("") + "</ul></div>";
    h += '<h3>Lỗi hay mắc</h3><div class="card"><ul class="kt">' + b.loi_hay_mac.map(function (k) { return "<li>" + T(k.y) + "</li>"; }).join("") + "</ul></div>";
    return h;
  }
  function sel(id, val, opts) { return '<select data-c="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }
  function tabBaiTap(b) {
    var qs = b.cau_hoi.filter(function (q) { return (!V.fd || q.dang === V.fd) && (!V.fm || q.muc === V.fm); });
    var h = '<div class="row noprint">' + sel("fd", V.fd, [["", "Mọi dạng"]].concat(Object.keys(DANG).map(function (k) { return [k, DANG[k]]; }))) +
      sel("fm", V.fm, [["", "Mọi mức độ"]].concat(Object.keys(MUC).map(function (k) { return [k, MUC[k]]; }))) +
      '<label><input type="checkbox" data-c="ans"' + (V.ans ? " checked" : "") + "> Hiện đáp án</label><span class=\"sp\"></span><button data-a=\"print\">In phiếu bài tập</button></div>";
    h += '<p class="muted">' + qs.length + " / " + b.cau_hoi.length + " câu</p>";
    return h + qs.map(function (q, i) { return qHTML(q, i + 1, V.ans, true); }).join("");
  }
  function otList(b) {
    var ch = curCh(), n = b.ma.slice(1), l = [], ng = (ch.onTapNgay || {})[b.ma];
    if (ng) l.push([ng, "Ngày " + ng.slice(1) + " · kiến thức, thẻ, luyện tập"]);
    if ((ch.onTapMoRong || []).indexOf(b.ma) >= 0) l.push(["mr-" + n, "Mở rộng ôn tập Bài " + n]);
    l.push(["n4", "Ngày 4 · luyện cả chương"], ["n5", "Ngày 5 · đề tổng hợp"], ["tq", "Tổng quan ôn tập"]);
    return l;
  }
  function tabOnTap(b) {
    var ch = curCh();
    if (!ch.onTap) return '<p class="muted">Chương này chưa có trang ôn tập.</p>';
    var l = otList(b); if (!l.some(function (x) { return x[0] === V.ot; })) V.ot = l[0][0];
    return '<div class="row noprint">' + l.map(function (x) { return '<button data-a="ot" data-h="' + x[0] + '" class="chip' + (x[0] === V.ot ? " on" : "") + '">' + esc(x[1]) + "</button>"; }).join("") +
      '<span class="sp"></span><a class="btn" target="_blank" rel="noopener" href="' + esc(ch.onTap) + "#" + V.ot + '">Mở toàn trang</a></div>' +
      '<p class="muted noprint">Đây là trang ôn tập của học sinh, nhúng ngay trong hồ sơ. Phần đang khóa cần mã mở lớp hoặc đăng nhập giáo viên ở nút "Điều khiển lớp (GV)" trong trang.</p>' +
      '<iframe class="otf" id="otFrame" title="Ôn tập" src="' + esc(ch.onTap) + "#" + V.ot + '"></iframe>';
  }
  function tabKiemTra(b) {
    var pool = b.cau_hoi.filter(function (q) { return q.dang === "tn" && !(q.hinh || []).length; });
    var h = '<div class="row noprint">' + sel("qn", V.qn || 5, [[5, "5 câu"], [10, "10 câu"], [pool.length, "Tất cả " + pool.length + " câu"]]) +
      '<button data-a="quiz">Tạo đề trắc nghiệm nhanh</button><label><input type="checkbox" data-c="qkey"' + (V.qkey ? " checked" : "") + '> Hiện bảng đáp án</label><span class="sp"></span><button data-a="print">In đề</button></div>';
    if (V.quiz && V.quiz.ma === b.ma) {
      var qs = V.quiz.ids.map(function (id) { return b.cau_hoi.filter(function (q) { return q.id === id; })[0]; });
      h += "<h3>Kiểm tra nhanh · " + esc(b.ten) + "</h3>" + qs.map(function (q, i) { return qHTML(q, i + 1, false, false); }).join("");
      if (V.qkey) h += '<h3>Đáp án</h3><table class="key"><tr>' + qs.map(function (q, i) { return "<td>" + (i + 1) + "</td>"; }).join("") + "</tr><tr>" + qs.map(function (q) { return "<td><b>" + esc(q.tn.dap_an) + "</b></td>"; }).join("") + "</tr></table>";
    } else h += '<p class="muted">Chọn số câu rồi bấm "Tạo đề trắc nghiệm nhanh". Đề lấy ngẫu nhiên từ ' + pool.length + " câu trắc nghiệm không có hình của bài.</p>";
    if (curCh().onTap) h += '<h3 class="noprint">Đề tổng hợp và ôn tập</h3><div class="row noprint"><button data-a="tab" data-i="4" data-ot="n5">Mở đề tổng hợp (Ngày 5) trong hồ sơ</button></div>';
    h += '<h3 class="noprint">Cho học sinh làm trực tuyến</h3><div class="row noprint"><button data-a="page" data-p="ph">' + (phUrl() || ptList().length ? "Mở phòng làm bài khối " + V.khoi : "Cài phòng làm bài khối " + V.khoi) + "</button></div>";
    return h;
  }
  function tabGhiChu(b) {
    var k = bKey(b), notes = S.notes[k] || [];
    var h = '<div class="row">Trạng thái ' + sel("st", S.st[k] || 0, ST.map(function (s, i) { return [i, s]; })) + "</div>";
    h += '<div class="card"><div class="row"><input id="nLop" list="dsLop" placeholder="Lớp (ví dụ 12A6)" value="' + esc(S.lastLop) + '" style="width:170px"><datalist id="dsLop">' + lopNames().map(function (l) { return '<option value="' + esc(l) + '">'; }).join("") + '</datalist><span class="muted">' + today() + '</span></div><textarea id="nText" rows="3" placeholder="Dạy đến đâu, lớp vướng gì, tiết sau cần làm gì"></textarea><div class="row" style="margin:8px 0 0"><button data-a="addNote">Thêm ghi chú</button><span id="nMsg" class="muted" role="status"></span></div></div>';
    if (!notes.length) h += '<p class="muted">Chưa có ghi chú cho bài này.</p>';
    notes.slice().reverse().forEach(function (n, i) {
      var idx = notes.length - 1 - i;
      h += '<div class="card"><div class="row" style="margin-bottom:4px"><b>' + esc(n.lop || "Chưa ghi lớp") + '</b><span class="muted">' + esc(n.ngay) + (n.slide ? " · slide " + esc(n.slide) : "") + '</span><span class="sp"></span><button class="link" data-a="delNote" data-i="' + idx + '">Xóa</button></div>' + esc(n.text).replace(/\n/g, "<br>") + "</div>";
    });
    return h;
  }

  /* ---------- trang phụ ---------- */
  function pageLop() {
    var h = '<div class="head"><h2>Lớp học</h2></div><p class="warn">Danh sách lớp chỉ lưu trong trình duyệt của máy này để dùng cho nút "Gọi tên" khi lên lớp. Chỉ nên nhập tên, không nhập điểm hay thông tin cá nhân khác.</p>';
    lopNames().forEach(function (l) { h += '<div class="card"><div class="row" style="margin:0"><b>' + esc(l) + '</b><span class="muted">' + S.lop[l].length + ' học sinh</span><span class="sp"></span><button class="link" data-a="editLop" data-l="' + esc(l) + '">Sửa</button><button class="link" data-a="delLop" data-l="' + esc(l) + '">Xóa</button></div></div>'; });
    h += pvTongHop();
    h += "<h3>" + (V.edit ? "Sửa lớp " + esc(V.edit) : "Thêm lớp") + '</h3><div class="card"><div class="row"><input id="lTen" placeholder="Tên lớp (ví dụ 12A6)" value="' + esc(V.edit) + '"></div><textarea id="lDs" rows="8" placeholder="Mỗi dòng một học sinh">' + esc(V.edit ? S.lop[V.edit].join("\n") : "") + '</textarea><div class="row" style="margin:8px 0 0"><button data-a="saveLop">Lưu lớp</button><span id="lMsg" class="muted" role="status"></span></div></div>';
    return h;
  }
  function pvTongKet(l) {
    var m = {};
    function g(n) { return m[n] = m[n] || { cm: 0, tl: 0, qn: 0, dg: 0, qk: 0, n: 0, d: 0 }; }
    (S.lop[l] || []).forEach(g);
    S.cm.forEach(function (r) { if (r.lop !== l) return; var o = g(r.hs); o.cm++; o.tl += r.tl || 0; o.qn += r.qn || 0; o.dg += r.dg || 0; o.qk += r.qk || 0; });
    S.pv.forEach(function (r) { if (r.lop !== l) return; var o = g(r.hs); o.n++; o.d += r.diem; });
    return m;
  }
  function pvTongHop() {
    if (!S.pv.length && !S.cm.length) return '<h3>Phát biểu và có mặt trên lớp</h3><p class="muted">Chưa có ghi nhận. Vào chế độ lên lớp: "Gọi tên" rồi chấm điểm, hoặc mở "Phòng QR" cho học sinh vào.</p>';
    var h = '<h3>Phát biểu và có mặt trên lớp</h3>', co = false;
    lopNames().forEach(function (l) {
      var m = pvTongKet(l), ks = Object.keys(m).filter(function (k) { return m[k].cm || m[k].n; }).sort(function (a, b) { return m[b].d - m[a].d; });
      if (!ks.length) return; co = true;
      h += '<div class="card"><b>' + esc(l) + '</b><table class="tbl" style="width:100%;margin-top:6px"><tr><th align="left">Học sinh</th><th>Buổi có mặt</th><th>Câu trả lời</th><th>Câu đúng</th><th>Lần được gọi</th><th>Tổng điểm</th></tr>' + ks.map(function (k) { var o = m[k]; return "<tr><td>" + esc(k) + '</td><td align="center">' + o.cm + '</td><td align="center">' + o.tl + (o.qn ? "/" + o.qn : "") + '</td><td align="center">' + (o.qk ? o.dg + "/" + o.qk : "–") + '</td><td align="center">' + o.n + '</td><td align="center">' + String(o.d).replace(".", ",") + "</td></tr>"; }).join("") + "</table></div>";
    });
    if (!co) h += '<p class="muted">Chưa có ghi nhận.</p>';
    return h + '<div class="row"><button data-a="pvCsv">Xuất chi tiết (CSV)</button><button data-a="pvCsv2">Xuất tổng hợp (CSV)</button><button class="link" data-a="pvUndo">Xóa lần chấm gần nhất</button><button class="link" data-a="pvDel">Xóa toàn bộ ghi nhận</button></div>';
  }
  function progOf() {
    var done = 0, total = chs().length * HOAT.length;
    chs().forEach(function (_, i) { HOAT.forEach(function (a) { if (S.prog[V.khoi + "." + i + "." + a[0]]) done++; }); });
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }
  function pageTQ() {
    var h = '<div class="head"><h2>Tổng quan · ' + esc(CFG.khoi[V.khoi].ten) + "</h2></div><h3>Công cụ</h3>" + toolsHTML();
    var p = progOf();
    h += '<div class="head" style="margin:22px 0 6px"><h3 style="margin:0">Tiến độ theo chương</h3><span class="sp"></span><span class="muted" id="tqPct">' + p.done + " / " + p.total + " mục (" + p.pct + '%)</span></div><div class="bar"><i id="tqBar" style="width:' + p.pct + '%"></i></div>';
    h += '<div class="wrap"><table class="prog"><tr><th>Chương</th>' + HOAT.map(function (a) { return "<th>" + a[1] + "</th>"; }).join("") + "<th>Bài đã dạy</th></tr>";
    chs().forEach(function (ch, i) {
      var d = dOf(ch), day = "";
      if (d) { var n = d.bai.filter(function (b) { return S.st[ch.duLieu + "." + b.ma] === 2; }).length; day = n + " / " + d.bai.length; }
      h += "<tr><td>" + (i + 1) + ". " + (d ? '<button class="link" style="font-size:inherit" data-a="bai" data-ch="' + i + '" data-i="0">' + esc(ch.ten) + "</button>" : esc(ch.ten)) + "</td>" +
        HOAT.map(function (a) { var k = V.khoi + "." + i + "." + a[0]; return '<td><input type="checkbox" data-c="prog" data-k="' + k + '"' + (S.prog[k] ? " checked" : "") + ' aria-label="' + esc(ch.ten + ": " + a[1]) + '"></td>'; }).join("") +
        '<td class="muted">' + (day || (ch.luyenTap && ch.luyenTap.length ? "có " + ch.luyenTap.length + " bài luyện" : "chưa có dữ liệu")) + "</td></tr>";
    });
    h += '</table></div><h3>Ghi chú dạy học của khối</h3><textarea id="gcKhoi" rows="4" placeholder="Ghi chú cho khối này: lớp yếu phần nào, cần bổ sung gì">' + esc(S.gc[V.khoi] || "") + "</textarea>";
    return h;
  }
  function pageCC() {
    return '<div class="head"><h2>Sao lưu dữ liệu</h2></div><p class="muted">Trạng thái bài, tiến độ, ghi chú, danh sách lớp và liên kết được lưu trong trình duyệt của máy này. Sao lưu ra file để giữ bản dự phòng hoặc mang sang máy khác.</p><div class="row"><button data-a="xuat">Sao lưu ra file</button><label class="btn">Khôi phục từ file<input type="file" id="nhap" accept=".json" hidden></label><span id="ccMsg" class="muted" role="status"></span></div>';
  }
  function firstOT() { var c = chs(); for (var i = 0; i < c.length; i++) if (c[i].onTap && dOf(c[i])) { V.ch = i; V.bai = 0; return true; } return false; }
  function toolsHTML() {
    var h = '<div class="grid">', coOT = chs().some(function (c) { return c.onTap && dOf(c); });
    CFG.congCu.forEach(function (t) {
      if (t.id === "ph") { var pu = phUrl() || (ptList().length ? "tinh" : ""); h += '<div class="card"><b>' + esc(t.ten) + '</b> <span class="tag' + (pu ? "" : " m") + '">' + (pu ? "Dùng được" : "Chưa có") + '</span><div class="muted">' + esc(t.moTa) + '</div><div class="row" style="margin:6px 0 0"><button data-a="page" data-p="ph">' + (pu ? "Mở làm bài trực tuyến" : "Cài phòng làm bài") + "</button></div></div>"; return; }
      if (t.id === "cb") {
        var cl = S.links[V.khoi + ".cb"], coDL = chs().some(function (c) { return dOf(c); });
        h += '<div class="card"><b>' + esc(t.ten) + '</b> <span class="tag">' + (coDL ? "Có trong hồ sơ" : cl ? "Dùng được" : "Chưa có") + '</span><div class="muted">Hỏi đáp tra cứu trên dữ liệu bài, hoặc liên kết tới chatbot ngoài (NotebookLM, Gem, ChatGPT...)</div><div class="row" style="margin:6px 0 0">' +
          (coDL ? '<button data-a="page" data-p="hd">Mở hỏi đáp</button>' : "") + (cl ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(cl) + '">Mở chatbot ngoài</a>' : "") +
          '<button class="link" data-a="link" data-t="cb">' + (cl ? "Đổi liên kết chatbot" : "Gắn liên kết chatbot ngoài") + "</button></div></div>"; return;
      }
      if (t.id === "on" && coOT) { h += '<div class="card"><b>' + esc(t.ten) + '</b> <span class="tag">Có trong hồ sơ</span><div class="muted">Lịch ôn, thẻ ghi nhớ, mở rộng ôn tập, đề tổng hợp</div><div class="row" style="margin:6px 0 0"><button data-a="goOT">Mở ôn tập</button></div></div>'; return; }
      var url = S.links[V.khoi + "." + t.id] || (t.khoi || {})[V.khoi], note = t.ghiChu && t.ghiChu[V.khoi];
      h += '<div class="card"><b>' + esc(t.ten) + '</b> <span class="tag' + (url ? "" : " m") + '">' + (url ? "Dùng được" : note ? "Có skill" : "Chưa có") + '</span><div class="muted">' + esc(t.moTa) + (note ? "<br>" + esc(note) : "") + '</div><div class="row" style="margin:6px 0 0">' + (url ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(url) + '">Mở</a>' : "") + '<button class="link" data-a="link" data-t="' + t.id + '">' + (url ? "Đổi liên kết" : "Gắn liên kết") + "</button></div></div>";
    });
    return h + '</div><span id="ccMsg" class="muted" role="status"></span>';
  }

  /* ---------- bài luyện nhúng (trang HTML riêng của từng chương) ---------- */
  function pageLT() {
    var ch = curCh(), lt = (ch && ch.luyenTap) || [], x = lt[V.lt || 0];
    if (!x) return '<p class="muted">Chưa có bài luyện.</p>';
    return '<div class="head"><h2>' + esc(ch.ten) + " · " + esc(x.ten) + '</h2><span class="sp"></span><a class="btn noprint" target="_blank" rel="noopener" href="' + esc(x.trang) + '">Mở toàn trang</a></div>' +
      '<div class="row noprint">' + lt.map(function (y, j) { return '<button data-a="lt" data-ch="' + V.ch + '" data-i="' + j + '" class="chip' + (j === (V.lt || 0) ? " on" : "") + '">' + esc(y.ten) + "</button>"; }).join("") + "</div>" +
      (x.ghiChu ? '<p class="muted noprint">' + esc(x.ghiChu) + "</p>" : "") +
      '<iframe class="otf" title="' + esc(x.ten) + '" src="' + esc(x.trang) + '"></iframe>';
  }

  /* ---------- làm bài trực tuyến: phòng làm bài đặt trên Render, nhúng bảng điều khiển giáo viên ---------- */
  function phUrl() {
    var t = CFG.congCu.filter(function (x) { return x.id === "ph"; })[0] || {};
    return String(S.links[V.khoi + ".ph"] || (t.khoi || {})[V.khoi] || "").replace(/\/+$/, "");
  }
  /* phòng luyện tập tự chấm: trang HTML tĩnh nằm trong hồ sơ, chạy trên GitHub Pages, không cần máy chủ */
  function ptList() { return (CFG.phongTinh || {})[V.khoi] || []; }
  function ptUrl(x) { return String(CFG.congKhai || "").replace(/\/*$/, "/") + x.trang; }
  function ptHTML() {
    var ps = ptList(); if (!ps.length) return "";
    var h = '<h3 style="margin-top:4px">Phòng luyện tập tự chấm</h3><p class="muted">Học sinh mở link, nhập tên và làm bài, trang tự chấm ngay. Chạy trên GitHub Pages nên không cần máy chủ và không phụ thuộc Netlify.</p><div class="grid">';
    ps.forEach(function (x, i) {
      var u = ptUrl(x);
      h += '<div class="card"><b>' + esc(x.ten) + '</b><div class="muted">' + esc(x.moTa || "") + '</div><div class="urlbox">' + esc(u) + '</div><div class="row" style="margin:8px 0 0"><button data-a="lbCopy" data-u="' + esc(u) + '">Sao chép</button><button data-a="lbBig" data-u="' + esc(u) + '">Chiếu cỡ lớn</button><a class="btn" target="_blank" rel="noopener" href="' + esc(u) + '">Mở thử</a></div></div>';
    });
    h += '</div><p class="warn" style="margin-top:10px">Kết quả của mỗi học sinh chỉ lưu trên máy của em đó (chưa gửi về giáo viên), và ô "mật khẩu giáo viên" của trang chỉ kiểm tra ngay trong trình duyệt nên không phải bảo vệ thật. Muốn giáo viên xem kết quả cả lớp ở một nơi thì cần thêm máy chủ như phòng làm bài khối 10, 11.</p>';
    return h;
  }
  function pageLB() {
    var u = phUrl(), h = '<div class="head"><h2>Làm bài trực tuyến · ' + esc(CFG.khoi[V.khoi].ten) + "</h2></div>" + ptHTML();
    if (!u) {
      return h + '<h3>Phòng làm bài có máy chủ</h3><p class="warn">Khối ' + V.khoi + ' chưa có phòng làm bài có máy chủ (xem kết quả cả lớp, mở từng câu). Khi triển khai xong (cùng cách với khối 10, 11), dán địa chỉ phòng vào đây để dùng ngay trong hồ sơ.</p><div class="row"><button class="go" data-a="link" data-t="ph">Gắn liên kết phòng làm bài</button><span id="ccMsg" class="muted" role="status"></span></div><span id="lbMsg" class="muted" role="status"></span>';
    }
    if (ptList().length) h += "<h3>Phòng làm bài có máy chủ</h3>";
    h += '<p class="muted">Một liên kết cố định cho cả khối: không phải tạo phòng mới mỗi lần. Mỗi buổi mới chỉ cần bấm "Làm lại từ đầu" trong bảng điều khiển giáo viên.</p>';
    h += '<div class="grid"><div class="card"><b>Link cho học sinh</b><div class="urlbox">' + esc(u) + '</div><div class="row" style="margin:8px 0 0"><button data-a="lbCopy">Sao chép</button><button data-a="lbBig">Chiếu cỡ lớn</button><a class="btn" target="_blank" rel="noopener" href="' + esc(u) + '">Mở thử</a></div></div>' +
      '<div class="card"><b>Giáo viên</b><div class="urlbox">' + esc(u) + '/teacher</div><div class="row" style="margin:8px 0 0"><button class="go" data-a="lbTeacher">' + (V.lbEmbed !== false ? "Ẩn bảng điều khiển" : "Hiện bảng điều khiển tại đây") + '</button><a class="btn" target="_blank" rel="noopener" href="' + esc(u) + '/teacher">Mở ở tab mới</a></div></div></div>';
    h += '<div class="row" style="margin-top:12px"><button data-a="lbWake">Đánh thức máy chủ</button><button class="link" data-a="link" data-t="ph">Đổi liên kết</button><span id="lbMsg" class="muted" role="status"></span></div>';
    h += '<div class="card"><b>Mỗi buổi làm bài</b><ol class="ys" style="margin-top:6px"><li>Trước giờ học 5 phút: bấm "Đánh thức máy chủ" (gói miễn phí của Render tự ngủ sau khoảng 15 phút).</li><li>Mở bảng điều khiển giáo viên, tự nhập mật khẩu giáo viên vào khung đó.</li><li>Bấm "Làm lại từ đầu" để bắt đầu buổi mới, rồi chiếu link cho học sinh.</li><li>Cuối buổi bấm "Tải kết quả (.csv)" để lưu điểm. Bài làm bị xóa khi máy chủ ngủ hoặc khởi động lại.</li></ol></div>';
    if (V.lbEmbed !== false) h += '<h3>Bảng điều khiển giáo viên</h3><p class="muted">Đây là trang giáo viên của máy chủ phòng làm bài, hiển thị ngay trong hồ sơ. Nhập mật khẩu giáo viên vào khung bên dưới để xem kết quả. Mật khẩu gửi thẳng tới máy chủ đó, hồ sơ không đọc và không lưu. Nếu khung báo lỗi hoặc trống, bấm "Đánh thức máy chủ", đợi khoảng 1 phút rồi bấm "Mở ở tab mới".</p><iframe class="otf" title="Bảng điều khiển giáo viên" src="' + esc(u) + '/teacher"></iframe>';
    return h;
  }

  /* ---------- hỏi đáp: tra cứu trên dữ liệu bài (không dùng AI) ---------- */
  var IDX = null, IDF = {};
  var STOP = {}; "la gi cua va cac nhung mot nao cho toi em hay hoi ve thi ma nhu duoc co khong ra sao vi tai neu voi tu den cung se bi boi nay kia giup xin biet muon can minh ban a o".split(" ").forEach(function (w) { STOP[w] = 1; });
  var LOAI = { kt: "Kiến thức", ct: "Công thức", db: "Dạng bài", loi: "Lỗi hay mắc", the: "Câu hỏi nhanh", ch: "Câu hỏi luyện tập", md: "Câu hỏi mở đầu", hinh: "Hình trong SGK" };
  var Y_DINH = [["ct", /cong thuc|he thuc|bieu thuc|phuong trinh/], ["loi", /\bloi\b|nham|sai lam|hay mac|luu y/], ["db", /dang bai|cach lam|cach giai|phuong phap|nhan biet/], ["ch", /vi du|bai tap|cau hoi|trac nghiem|dung sai|tu luan|luyen tap/], ["hinh", /\bhinh\b|do thi|\bbang\b|so do/], ["kt", /dinh nghia|khai niem|phat bieu|noi dung|la gi|the nao/]];
  function nrm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\\[a-z]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function toks(n) { return n.split(" ").filter(function (w) { return w.length > 1 && !STOP[w]; }); }
  function buildIdx() {
    IDX = []; var df = {};
    chs().forEach(function (ch, ci) {
      var d = dOf(ch); if (!d) return;
      d.bai.forEach(function (b, bi) {
        function add(t, raw, html, extra) {
          var n = nrm((extra || "") + " " + raw), tk = {}; toks(n).forEach(function (w) { tk[w] = 1; });
          IDX.push({ t: t, ci: ci, bi: bi, so: b.ma.slice(1), src: LOAI[t] + " · " + b.ten.split(".")[0] + " · SGK tr. " + (b.trang_sgk || ""), raw: raw, html: html, n: " " + n + " ", tk: tk });
          for (var w in tk) df[w] = (df[w] || 0) + 1;
        }
        var md = d.moDau && d.moDau[b.ma]; if (md) add("md", md[0], T(md[0]), b.ten);
        b.kien_thuc.forEach(function (k) { add("kt", k.y, T(k.y), b.ten); });
        b.cong_thuc.forEach(function (c) { add("ct", c.latex + " " + c.dieu_kien + " " + c.vi_du_so, '<div class="fm">' + km(c.latex, true) + "</div><div><b>Điều kiện:</b> " + T(c.dieu_kien) + "</div><div><b>Ví dụ:</b> " + T(c.vi_du_so) + "</div>", "công thức hệ thức " + b.ten); });
        b.dang_bai.forEach(function (x) { add("db", x.dang + " " + x.nhan_biet + " " + x.cach_lam, "<b>" + T(x.dang) + "</b><div><b>Nhận biết:</b> " + T(x.nhan_biet) + "</div><div><b>Cách làm:</b> " + T(x.cach_lam) + "</div><div><b>Ví dụ:</b> " + viDu(b, x.vi_du) + "</div>", "dạng bài cách làm"); });
        b.loi_hay_mac.forEach(function (k) { add("loi", k.y, T(k.y), "lỗi hay mắc nhầm sai " + b.ten); });
        b.the.forEach(function (t) { add("the", t.mat_truoc + " " + t.mat_sau, "<b>" + T(t.mat_truoc) + "</b><div>" + T(t.mat_sau) + "</div>"); });
        b.cau_hoi.forEach(function (q) {
          var de = q.dang === "ds" ? (q.ds.dan || q.de) : q.de;
          add("ch", de + " " + (q.dang === "tn" ? q.tn.phuong_an.join(" ") + " " + (q.tn.giai_thich || "") : ""), qHTML(q, "", true, true).replace("<b>Câu .</b> ", ""), DANG[q.dang]);
        });
        Object.keys(d.sgk || {}).filter(function (k) { return new RegExp("^[A-Z]" + b.ma.slice(1) + "-").test(k); }).forEach(function (k) {
          var f = d.sgk[k]; add("hinh", f.cap, '<div>' + esc(f.cap) + ' · SGK tr. ' + esc(f.tr) + '</div><img class="hdimg" loading="lazy" alt="' + esc(f.cap) + '" src="' + f.src + '">', "hình đồ thị bảng");
        });
      });
    });
    IDF = {}; for (var w in df) IDF[w] = Math.log(1 + IDX.length / df[w]);
  }
  function timKiem(q) {
    if (!IDX) buildIdx();
    var n = nrm(q), mb = /\bbai (\d+)\b/.exec(n), so = mb ? mb[1] : null;
    var words = toks(n.replace(/\bbai \d+\b/g, " ")), uniq = words.filter(function (w, i) { return words.indexOf(w) === i; });
    var yd = null; Y_DINH.forEach(function (y) { if (!yd && y[1].test(n)) yd = y[0]; });
    /* từ không có trong dữ liệu được tính trọng số cao nhất, để câu hỏi ngoài phạm vi không bị trả lời bừa */
    var la = Math.log(1 + IDX.length), tong = 0; uniq.forEach(function (w) { tong += IDF[w] || la; });
    if (!uniq.length && !so) return { hits: [], yd: yd, so: so };
    var hits = [];
    IDX.forEach(function (e) {
      if (so && e.so !== so) return;
      var s = 0, m = 0; uniq.forEach(function (w) { if (e.tk[w]) { s += IDF[w]; m += IDF[w]; } });
      for (var i = 0; i < words.length - 1; i++) if (e.n.indexOf(" " + words[i] + " " + words[i + 1] + " ") >= 0) s += 1.5;
      if (!uniq.length) s = 1; else if (tong && m / tong < 0.6) return;
      if (s <= 0) return;
      if (yd === e.t) s *= 1.6; else if (e.t === "ch" || e.t === "hinh") s *= 0.6;
      if (e.t === "kt" || e.t === "the") s *= 1.15;
      hits.push({ e: e, s: s });
    });
    hits.sort(function (a, b) { return b.s - a.s; });
    return { hits: hits, yd: yd, so: so };
  }
  function muc(h) {
    var e = h.e;
    return '<div class="hit"><div class="src">' + esc(e.src) + ' <button class="link" data-a="bai" data-ch="' + e.ci + '" data-i="' + e.bi + '">Mở bài</button></div>' + e.html + "</div>";
  }
  function traLoi(q) {
    var r = timKiem(q), hits = r.hits;
    if (!hits.length) return "<div>Chưa tìm thấy nội dung khớp trong dữ liệu của khối " + V.khoi + ". Thử dùng từ khóa của bài, ví dụ: <i>đẳng nhiệt</i>, <i>công thức bài 11</i>, <i>lỗi hay mắc bài 9</i>.</div><div class=\"muted\">Khung này chỉ tra cứu nội dung đã có, không tự giải bài mới.</div>";
    var top = hits[0].s, chinh = hits.filter(function (h, i) { return i < 3 && h.s >= top * 0.75; }), them = hits.slice(chinh.length, chinh.length + 5).filter(function (h) { return h.s >= top * 0.4; });
    var h = "<div>" + (r.so ? "Trong Bài " + esc(r.so) + ", n" : "N") + "ội dung khớp nhất" + (r.yd ? " (" + LOAI[r.yd].toLowerCase() + ")" : "") + ":</div>" + chinh.map(muc).join("");
    if (them.length) h += "<details><summary>Xem thêm " + them.length + " mục liên quan</summary>" + them.map(muc).join("") + "</details>";
    return h;
  }
  function hoi(q) {
    q = String(q || "").trim(); if (!q) { msg("hdMsg", "Nhập câu hỏi trước."); return; }
    V.chat = V.chat || []; V.chat.push({ me: 1, html: esc(q) });
    var api = CFG.chatbot && CFG.chatbot.api, local = traLoi(q);
    if (!api) { V.chat.push({ html: local }); renderWork(); return; }
    var i = V.chat.push({ html: '<span class="muted">Đang hỏi trợ lí AI…</span>' }) - 1; renderWork();
    fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cau_hoi: q, ngu_canh: timKiem(q).hits.slice(0, 8).map(function (h) { return { nguon: h.e.src, noi_dung: h.e.raw }; }) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { V.chat[i].html = j && j.tra_loi ? T(j.tra_loi).replace(/\n/g, "<br>") + "<details><summary>Nguồn trong hồ sơ</summary>" + local + "</details>" : local; })
      .catch(function () { V.chat[i].html = '<div class="muted">Không gọi được trợ lí AI, dùng kết quả tra cứu:</div>' + local; })
      .then(function () { if (V.page === "hd") renderWork(); });
  }
  function pageHD() {
    var co = chs().some(function (c) { return dOf(c); });
    var cl = S.links[V.khoi + ".cb"];
    var h = '<div class="head"><h2>Hỏi đáp · ' + esc(CFG.khoi[V.khoi].ten) + '</h2><span class="sp"></span>' + (cl ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(cl) + '">Mở chatbot ngoài</a>' : "") +
      '<button class="link" data-a="link" data-t="cb">' + (cl ? "Đổi liên kết chatbot ngoài" : "Gắn liên kết chatbot ngoài (NotebookLM, Gem, ChatGPT...)") + '</button></div><span id="ccMsg" class="muted" role="status"></span>';
    if (!co) return h + '<p class="muted">Khối này chưa có dữ liệu bài học để tra cứu. Bạn vẫn có thể gắn liên kết chatbot ngoài ở trên.</p>';
    h += '<p class="muted">Tra cứu trong dữ liệu các bài đã có (kiến thức, công thức, dạng bài, câu hỏi, lỗi hay mắc, hình SGK) và ghi rõ nguồn. Đây là tìm kiếm, chưa phải AI: không tự giải bài mới.</p>';
    h += '<div class="row">' + ["Định luật Boyle phát biểu thế nào?", "Công thức bài 11", "Lỗi hay mắc khi dùng định luật Charles", "Cách làm bài toán bọt khí dưới nước", "Đồ thị đẳng tích có dạng gì?", "Động năng trung bình và nhiệt độ"].map(function (s) { return '<button class="chip" data-a="ask" data-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>";
    h += '<div class="chat" id="hdChat">' + (V.chat || []).map(function (m) { return '<div class="msg' + (m.me ? " me" : "") + '">' + m.html + "</div>"; }).join("") + "</div>";
    h += '<div class="row"><input id="hdQ" placeholder="Nhập câu hỏi về bài học" style="flex:1;min-width:200px" autocomplete="off"><button class="go" data-a="hoi">Hỏi</button>' + ((V.chat || []).length ? '<button data-a="xoaChat">Xóa hội thoại</button>' : "") + '<span id="hdMsg" class="muted" role="status"></span></div>';
    return h;
  }

  function renderWork() {
    var w = $("work"), b = curBai();
    if (V.page === "lop") { w.innerHTML = pageLop(); return; }
    if (V.page === "cc") { w.innerHTML = pageCC(); return; }
    if (V.page === "tq") { w.innerHTML = pageTQ(); return; }
    if (V.page === "lt") { w.innerHTML = pageLT(); return; }
    if (V.page === "ph") { w.innerHTML = pageLB(); return; }
    if (V.page === "hd") { w.innerHTML = pageHD(); var c = $("hdChat"), last = c && c.lastElementChild; if (last) last.scrollIntoView({ block: "nearest" }); var iq = $("hdQ"); if (iq) iq.focus(); return; }
    if (!b) { w.innerHTML = '<div class="head"><h2>' + esc(CFG.khoi[V.khoi].ten) + '</h2></div><p class="muted">Khối này chưa có chương nào có dữ liệu bài học. Hiện mới có Chương 2 (Khí lí tưởng) của Khối 12.</p>'; return; }
    var h = '<div class="head"><h2>' + esc(b.ten) + '</h2><span class="muted">SGK tr. ' + esc(b.trang_sgk || "") + '</span><span class="sp"></span>' + (curCh().baiGiang ? '<button class="go noprint" data-a="day">Dạy ngay</button>' : "") + "</div>";
    h += '<div class="tabs">' + TABS.map(function (t, i) { return '<button data-a="tab" data-i="' + i + '" class="' + (i === V.tab ? "on" : "") + '">' + t + "</button>"; }).join("") + "</div>";
    h += [tabTrinhChieu, tabSGK, tabKHBD, tabBaiTap, tabOnTap, tabKiemTra, tabGhiChu][V.tab](b);
    w.innerHTML = h;
  }
  function render() { renderHead(); renderTree(); renderWork(); }
  function msg(id, m) { var e = $(id); if (e) { e.textContent = m; setTimeout(function () { if (e) e.textContent = ""; }, 3500); } }

  /* ---------- chế độ lên lớp ---------- */
  var LL = { b: null, i: 0, n: 0, called: [], tm: null, left: 0, cur: "", q: null, qk: "null" };
  function fmt(s) { return ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + s % 60).slice(-2); }
  function llOpen(b) {
    var ch = curCh(); LL.b = b; LL.called = []; LL.i = 0; LL.n = 0;
    $("llTen").textContent = b.ten;
    $("llLop").innerHTML = '<option value="">(chưa chọn)</option>' + lopNames().map(function (l) { return '<option' + (l === S.lastLop ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("");
    $("llNguoi").textContent = ""; $("llCham").hidden = true; LL.cur = ""; $("llNote").hidden = true; $("llText").value = "";
    llStop(); LL.left = +$("llPhut").value * 60; $("llGio").textContent = fmt(LL.left); $("llGio").classList.remove("het");
    var p = S.pos[b.ma + "|" + $("llLop").value];
    $("llFrame").src = bgUrl(ch, b) + (p && p.i ? "@" + p.i : "");
    $("lenLop").hidden = false;
    var k = bKey(b); if (!S.st[k]) { S.st[k] = 1; save(); }
    setTimeout(function () { try { $("llFrame").focus(); } catch (e) {} }, 600);
  }
  function llStop() { if (LL.tm) { clearInterval(LL.tm); LL.tm = null; } $("llDem").textContent = "Bấm giờ"; }
  function beep() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); setTimeout(function () { o.stop(); a.close(); }, 700); } catch (e) {} }
  function llClose() {
    if (QR && confirm("Đang có phòng QR. Kết thúc phòng và lưu danh sách có mặt?")) qrEnd(); else if (QR) { clearInterval(QR.tm); QR = null; $("llQrBox").hidden = true; $("llQr").textContent = "Phòng QR"; }
    llStop(); if (document.fullscreenElement) document.exitFullscreen();
    $("llFrame").src = "about:blank"; $("lenLop").hidden = true; LL.b = null; render();
  }
  window.addEventListener("message", function (e) {
    var d = e.data; if (!d || d.hsdh !== "pos" || !LL.b || e.source !== $("llFrame").contentWindow || d.ma !== LL.b.ma) return;
    var qk = JSON.stringify(d.q || null), qch = qk !== LL.qk; LL.qk = qk; LL.q = d.q || null; if (qch && QR) qrDraw();
    if (d.i === LL.i && d.n === LL.n) return;
    LL.i = d.i; LL.n = d.n; S.pos[LL.b.ma + "|" + $("llLop").value] = { i: d.i, n: d.n }; save();
  });

  /* ---------- phòng QR: học sinh quét mã, giơ tay, trả lời nhanh ---------- */
  var QR = null; /* { code, lop, bai, tm, st, svg, big } khi đang có phòng */
  function srvCall(method, path, body) {
    var u = S.srv.url.replace(/\/+$/, "") + path;
    return fetch(u, { method: method, headers: { "Content-Type": "application/json", "x-teacher-pass": S.srv.pass }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Lỗi máy chủ"); return j; }); });
  }
  function qrCtl(o) { return srvCall("POST", "/api/t/ctl?code=" + QR.code, o).then(function (j) { QR.st = j; qrDraw(); }, function (e) { msg("llMsg", e.message); }); }
  function qrJoinUrl() { return S.srv.url.replace(/\/+$/, "") + "/?c=" + QR.code; }
  function qrSvg(text) { try { var q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 1, scalable: true }); } catch (e) { return ""; } }
  function pc(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function qrKeyText(q) { return q.type === "tf" ? q.key.map(function (x, i) { return "abcdef".charAt(i) + ":" + (x ? "Đ" : "S"); }).join("  ") : q.type === "short" ? q.key.v : q.key; }
  /* bảng phần trăm đúng/sai của câu hỏi nhanh đang mở hoặc vừa đóng */
  function qrKq(j) {
    var q = j.q, c = q.count, h = '<div style="margin-top:6px"><b>' + (q.open ? "Đang mở" : "Đã đóng") + "</b>: " + c + "/" + j.total + " em đã trả lời" + (q.label ? " · " + esc(q.label) : "") + "</div>";
    if (q.key && q.dung != null) h += '<div style="font-size:18px;margin:4px 0">Đúng: <b style="color:#3fb950">' + pc(q.dung, c) + "%</b> (" + q.dung + "/" + c + ') · Sai: <b style="color:#ff6b6b">' + pc(c - q.dung, c) + "%</b></div>";
    if (q.type === "mc") {
      ["A", "B", "C", "D"].forEach(function (x) {
        var n = (q.tally || {})[x] || 0, p = pc(n, c), ok = q.key === x, col = q.key ? (ok ? "#3fb950" : "#ff6b6b") : "#4c9aff";
        h += '<div class="qrow"><b>' + x + (ok ? " ✓" : "") + '</b><div class="qbar2"><i style="width:' + p + "%;background:" + col + '"></i></div><span>' + p + "% (" + n + ")</span></div>";
      });
    } else if (q.type === "tf") {
      (q.tally || []).forEach(function (t, i) {
        var pd = pc(t.d, c), k = q.key ? q.key[i] : null;
        h += '<div class="qrow"><b>' + "abcdef".charAt(i) + ')</b><div class="qbar2"><i style="width:' + pd + '%;background:#4c9aff"></i></div><span>Đ ' + pd + "%" + (k === true ? " ✓" : "") + " · S " + (c ? 100 - pd : 0) + "%" + (k === false ? " ✓" : "") + "</span></div>";
      });
    } else if (q.answers) {
      h += "<div>" + Object.keys(q.answers).map(function (n) { var g = q.ok ? q.ok[n] : null; return (g === true ? "✓ " : g === false ? "✗ " : "") + esc(n) + ": " + esc(q.answers[n]); }).join("<br>") + "</div>";
    }
    if (q.key) {
      h += '<div style="margin-top:6px">Đáp án đúng: <b style="color:#ffd166">' + esc(qrKeyText(q)) + (q.type === "short" && LL.q && LL.q.u ? " " + esc(LL.q.u) : "") + "</b></div>";
      if (!q.open && q.e) h += '<div class="qurl" style="text-align:left">' + esc(q.e) + "</div>";
    }
    return h;
  }
  /* khóa đáp án của câu đang chiếu trên slide (nếu có) cho từng kiểu câu hỏi */
  function qrAsk(kind) {
    var lq = LL.q, o = { action: "question", type: kind, label: "Slide " + (LL.n ? LL.i + 1 : "") };
    if (lq) {
      if (kind === "mc" && lq.t === "mc") { o.key = "ABCD".charAt(lq.a); o.e = lq.e; }
      else if (kind === "tf" && lq.t === "ds") { o.key = lq.y.map(function (x) { return !!x; }); o.e = lq.e; }
      else if (kind === "short" && lq.t === "tln") { o.key = { v: String(lq.a), tol: lq.tol || 0 }; o.e = lq.e; }
      if (o.key !== undefined) o.label += " · Câu " + lq.i;
    }
    qrCtl(o);
  }
  function qrDraw() {
    var box = $("llQrBox"); if (!QR) { box.hidden = true; $("llQr").textContent = "Phòng QR"; return; }
    var jj = QR.st; $("llQr").textContent = "Phòng QR" + (jj ? " · " + jj.joined.length + "/" + jj.total + (jj.hands.length ? " · ✋" + jj.hands.length : "") : "");
    var j = QR.st, h = '<div class="qh"><b>Phòng tương tác</b><span style="flex:1"></span><button data-qa="hide">Ẩn</button></div>';
    h += '<div class="qcode">' + QR.code + '</div><div class="qsvg' + (QR.big ? " big" : "") + '" data-qa="zoom" title="Bấm để phóng to / thu nhỏ">' + QR.svg + '</div><div class="qurl">' + esc(qrJoinUrl()) + "</div>";
    if (!j) { box.innerHTML = h + '<p>Đang kết nối...</p>'; box.className = QR.big ? "wide" : ""; box.hidden = !QR.vis; return; }
    var pc = j.total ? Math.round(100 * j.joined.length / j.total) : 0;
    h += '<p style="margin:8px 0 2px">Có mặt: <b>' + j.joined.length + "/" + j.total + '</b></p><div class="qbar"><i style="width:' + pc + '%"></i></div>';
    h += '<p style="margin:8px 0 2px">Giơ tay: <b>' + j.hands.length + "</b></p>";
    j.hands.forEach(function (x) { h += '<div class="qh"><span style="flex:1">' + esc(x.name) + '</span><button data-qa="call" data-n="' + esc(x.name) + '">Gọi</button><button data-qa="drop" data-n="' + esc(x.name) + '">Hạ</button></div>'; });
    var ls = LL.q ? { mc: "trắc nghiệm", ds: "đúng/sai", tln: "trả lời ngắn" }[LL.q.t] : "";
    h += '<p style="margin:10px 0 2px">Câu hỏi nhanh</p><div class="qh"><button data-qa="qauto"' + (LL.q ? "" : " disabled") + ' style="flex:1">' + (LL.q ? "Hỏi câu đang chiếu (" + ls + ", có đáp án)" : "Slide này chưa có câu hỏi sẵn") + '</button></div>';
    h += '<div class="qh"><button data-qa="qmc">A-D</button><button data-qa="qtf">Đúng/Sai</button><button data-qa="qshort">Trả lời ngắn</button><button data-qa="qclose">Đóng câu</button></div>';
    if (j.q) h += qrKq(j);
    h += '<div class="qh" style="margin-top:10px"><button data-qa="end">Kết thúc phòng và lưu có mặt</button></div>';
    box.innerHTML = h; box.className = QR.big ? "wide" : ""; box.hidden = !QR.vis;
  }
  function qrPoll() {
    if (!QR) return;
    srvCall("GET", "/api/t/state?code=" + QR.code).then(function (j) { if (!QR) return; QR.st = j; qrDraw(); }, function (e) { msg("llMsg", e.message); });
  }
  function qrOpen() {
    if (QR) { QR.vis = !QR.vis; qrDraw(); return; }
    var lp = $("llLop").value, ds = S.lop[lp] || [];
    if (!lp || !ds.length) { msg("llMsg", "Chọn lớp có danh sách học sinh trước."); return; }
    if (!S.srv.url) S.srv.url = (window.HO_SO && window.HO_SO.tuongTac) || "";
    if (!S.srv.url) { var u = prompt("Địa chỉ máy chủ phòng tương tác (ví dụ https://phong-tuong-tac.onrender.com hoặc http://192.168.1.5:3000):", ""); if (!u) return; S.srv.url = u.trim(); }
    if (!S.srv.pass) { var pw = prompt("Mật khẩu giáo viên của máy chủ:", ""); if (!pw) return; S.srv.pass = pw; }
    save(); msg("llMsg", "Đang mở phòng... (máy chủ miễn phí có thể mất khoảng 1 phút để thức dậy)");
    srvCall("POST", "/api/t/open", { lop: lp, bai: LL.b ? LL.b.ten : "", roster: ds }).then(function (j) {
      QR = { code: j.code, lop: lp, bai: LL.b ? LL.b.ma : "", st: null, big: false, svg: "", tm: null, vis: true };
      QR.svg = qrSvg(qrJoinUrl()); qrDraw(); qrPoll(); QR.tm = setInterval(qrPoll, 2000);
    }, function (e) { if (/mật khẩu/i.test(e.message)) { S.srv.pass = ""; save(); } msg("llMsg", e.message + " Kiểm tra địa chỉ máy chủ và mật khẩu rồi bấm lại."); });
  }
  function chamDung(r, v) {
    if (r.type === "mc") return v === r.key;
    if (r.type === "tf") return Array.isArray(v) && Array.isArray(r.key) && r.key.length === v.length && r.key.every(function (k, i) { return k === v[i]; });
    var p = parseFloat(String(v).replace(",", ".")), q = parseFloat(String(r.key.v).replace(",", "."));
    return isFinite(p) && isFinite(q) ? Math.abs(p - q) <= (r.key.tol || 0) + 1e-9 : String(v).trim().toLowerCase() === String(r.key.v).trim().toLowerCase();
  }
  function qrEnd() {
    if (!QR) return Promise.resolve();
    var q = QR; QR = null; clearInterval(q.tm); $("llQrBox").hidden = true; $("llQr").textContent = "Phòng QR";
    return srvCall("GET", "/api/t/export?code=" + q.code).then(function (x) {
      var tl = {}, dg = {}, qn = (x.qlog || []).length, qk = 0;
      (x.qlog || []).forEach(function (r) { if (r.key) qk++; Object.keys(r.answers || {}).forEach(function (n) { tl[n] = (tl[n] || 0) + 1; if (r.key && chamDung(r, r.answers[n])) dg[n] = (dg[n] || 0) + 1; }); });
      Object.keys(x.joined || {}).forEach(function (n) { S.cm.push({ lop: q.lop, hs: n, ngay: today(), bai: q.bai, tl: tl[n] || 0, qn: qn, dg: dg[n] || 0, qk: qk }); });
      save(); srvCall("POST", "/api/t/ctl?code=" + q.code, { action: "end" }).catch(function () {});
      msg("llMsg", "Đã lưu có mặt của " + Object.keys(x.joined || {}).length + " em.");
    }, function (e) { msg("llMsg", "Không lưu được có mặt: " + e.message); });
  }
  function qrNote(name) { LL.cur = name; $("llNguoi").textContent = name; $("llCham").hidden = false; }

  /* ---------- sự kiện ---------- */
  document.addEventListener("click", function (e) {
    var qa = e.target.getAttribute && e.target.getAttribute("data-qa"), qd = e.target.closest && e.target.closest("[data-qa]");
    if (!qa && qd) qa = qd.getAttribute("data-qa");
    if (qa && QR) {
      var nm = e.target.getAttribute("data-n");
      if (qa === "hide") { QR.vis = false; qrDraw(); }
      else if (qa === "zoom") { QR.big = !QR.big; qrDraw(); }
      else if (qa === "call") { qrNote(nm); qrCtl({ action: "call", name: nm }); }
      else if (qa === "drop") qrCtl({ action: "dropHand", name: nm });
      else if (qa === "qauto") { if (LL.q) qrAsk({ mc: "mc", ds: "tf", tln: "short" }[LL.q.t]); }
      else if (qa === "qmc" || qa === "qshort" || qa === "qtf") qrAsk(qa === "qmc" ? "mc" : qa === "qtf" ? "tf" : "short");
      else if (qa === "qclose") qrCtl({ action: "closeQ" });
      else if (qa === "end") { if (confirm("Kết thúc phòng và lưu danh sách có mặt?")) qrEnd(); }
      return;
    }
    if (e.target.id === "llQr") return qrOpen();
    var id = e.target.id;
    if (id === "llThoat") return llClose();
    if (id === "llFs") { var el = $("lenLop"); if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); return; }
    if (id === "llGhi") { $("llNote").hidden = !$("llNote").hidden; if (!$("llNote").hidden) $("llText").focus(); return; }
    if (id === "llLuu") {
      var tx = $("llText").value.trim(); if (!tx) { msg("llMsg", "Chưa có nội dung."); return; }
      var kk = bKey(LL.b); (S.notes[kk] = S.notes[kk] || []).push({ lop: $("llLop").value, ngay: today(), slide: LL.n ? LL.i + 1 : "", text: tx });
      save(); $("llText").value = ""; msg("llMsg", "Đã lưu vào ghi chú của bài."); return;
    }
    if (id === "llGoi") {
      var ds = S.lop[$("llLop").value] || [];
      if (!ds.length) { $("llNguoi").textContent = "Chưa có danh sách lớp"; return; }
      if (LL.called.length >= ds.length) LL.called = [];
      var rest = ds.filter(function (n) { return LL.called.indexOf(n) < 0; }), pick = rest[Math.floor(Math.random() * rest.length)];
      LL.called.push(pick); LL.cur = pick; $("llNguoi").textContent = pick; $("llCham").hidden = false; if (QR) qrCtl({ action: "call", name: pick }); return;
    }
    if (id === "llD1" || id === "llD2" || id === "llD0") {
      if (!LL.cur) return;
      var dv = { llD1: 1, llD2: 0.5, llD0: 0 }[id], lp = $("llLop").value;
      S.pv.push({ lop: lp, hs: LL.cur, ngay: today(), bai: LL.b ? LL.b.ma : "", slide: LL.n ? LL.i + 1 : "", diem: dv });
      save(); $("llNguoi").textContent = LL.cur + " (" + (dv === 1 ? "+1" : dv === 0.5 ? "+0,5" : "ghi nhận 0") + ")"; $("llCham").hidden = true; LL.cur = ""; if (QR) qrCtl({ action: "uncall" }); return;
    }
    if (id === "llD") { $("llCham").hidden = true; LL.cur = ""; $("llNguoi").textContent = ""; if (QR) qrCtl({ action: "uncall" }); return; }
    if (id === "llDem") {
      if (LL.tm) { llStop(); return; }
      if (LL.left <= 0) LL.left = +$("llPhut").value * 60;
      $("llGio").classList.remove("het"); $("llDem").textContent = "Dừng";
      LL.tm = setInterval(function () { LL.left--; $("llGio").textContent = fmt(Math.max(0, LL.left)); if (LL.left <= 0) { llStop(); $("llGio").classList.add("het"); beep(); } }, 1000);
      return;
    }
    var t = e.target.closest("[data-a]"); if (!t) return; var a = t.getAttribute("data-a"), b = curBai();
    if (a === "khoi") { V.khoi = t.getAttribute("data-k"); V.page = "tq"; V.tab = 0; IDX = null; V.chat = []; firstData(); render(); }
    else if (a === "bai") { V.page = "bai"; V.ch = +t.getAttribute("data-ch"); V.bai = +t.getAttribute("data-i"); V.quiz = null; render(); window.scrollTo(0, 0); }
    else if (a === "page") { V.page = t.getAttribute("data-p"); V.edit = ""; render(); }
    else if (a === "lt") { V.page = "lt"; V.ch = +t.getAttribute("data-ch"); V.lt = +t.getAttribute("data-i"); render(); window.scrollTo(0, 0); }
    else if (a === "tab") { V.tab = +t.getAttribute("data-i"); if (t.getAttribute("data-ot")) V.ot = t.getAttribute("data-ot"); renderWork(); window.scrollTo(0, 0); }
    else if (a === "goOT") { if (firstOT()) { V.page = "bai"; V.tab = 4; V.ot = ""; render(); window.scrollTo(0, 0); } }
    else if (a === "lbTeacher") { V.lbEmbed = V.lbEmbed === false; renderWork(); }
    else if (a === "lbCopy") {
      var cu = t.getAttribute("data-u") || phUrl(), ok = function () { msg("lbMsg", "Đã sao chép link học sinh."); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cu).then(ok, function () { msg("lbMsg", "Không sao chép được, hãy chọn và chép tay."); });
      else msg("lbMsg", "Trình duyệt không cho sao chép, hãy chọn và chép tay.");
    }
    else if (a === "lbBig") {
      var zz = $("zoom"); zz.innerHTML = '<div class="bigurl">Vào làm bài:<b>' + esc((t.getAttribute("data-u") || phUrl()).replace(/^https?:\/\//, "")) + "</b>Nhập họ tên, không cần tài khoản</div><button data-a=\"unzoom\">Đóng</button>"; zz.hidden = false;
    }
    else if (a === "lbWake") {
      var wu = phUrl(); msg("lbMsg", "Đang đánh thức máy chủ…");
      fetch(wu + "/healthz", { mode: "no-cors", cache: "no-store" }).then(function () { msg("lbMsg", "Đã gửi tín hiệu. Chờ khoảng 1 phút rồi mở bảng điều khiển."); }, function () { msg("lbMsg", "Không gọi được máy chủ. Kiểm tra mạng và liên kết."); });
    }
    else if (a === "hoi") hoi($("hdQ").value);
    else if (a === "ask") hoi(t.getAttribute("data-q"));
    else if (a === "xoaChat") { V.chat = []; renderWork(); }
    else if (a === "day") llOpen(b);
    else if (a === "ot") {
      V.ot = t.getAttribute("data-h");
      document.querySelectorAll('[data-a="ot"]').forEach(function (x) { x.classList.toggle("on", x === t); });
      var fr = $("otFrame"), lk = document.querySelector('#work a.btn[href^="' + curCh().onTap + '"]');
      if (fr) fr.src = curCh().onTap + "#" + V.ot; if (lk) lk.href = curCh().onTap + "#" + V.ot;
    }
    else if (a === "zoom") {
      var f = dOf(curCh()).sgk[t.getAttribute("data-k")], z = $("zoom");
      z.innerHTML = '<figure><img alt="' + esc(f.cap) + '" src="' + f.src + '"><figcaption>' + esc(f.cap) + " · SGK tr. " + esc(f.tr) + '</figcaption></figure><button data-a="unzoom">Đóng</button>';
      z.hidden = false;
    }
    else if (a === "unzoom") { $("zoom").hidden = true; $("zoom").innerHTML = ""; }
    else if (a === "print") window.print();
    else if (a === "quiz") {
      var pool = b.cau_hoi.filter(function (q) { return q.dang === "tn" && !(q.hinh || []).length; }).map(function (q) { return q.id; });
      for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
      V.quiz = { ma: b.ma, ids: pool.slice(0, Math.min(V.qn || 5, pool.length)) }; renderWork();
    }
    else if (a === "addNote") {
      var tx2 = $("nText").value.trim(), lp = $("nLop").value.trim();
      if (!tx2) { msg("nMsg", "Nhập nội dung ghi chú trước."); return; }
      var k2 = bKey(b); (S.notes[k2] = S.notes[k2] || []).push({ lop: lp, ngay: today(), slide: "", text: tx2 }); S.lastLop = lp; save(); renderWork();
    }
    else if (a === "delNote") { if (!confirm("Xóa ghi chú này?")) return; S.notes[bKey(b)].splice(+t.getAttribute("data-i"), 1); save(); renderWork(); }
    else if (a === "saveLop") {
      var ten = $("lTen").value.trim(), ds2 = $("lDs").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (!ten) { msg("lMsg", "Nhập tên lớp."); return; } if (!ds2.length) { msg("lMsg", "Nhập ít nhất một học sinh."); return; }
      if (V.edit && V.edit !== ten) delete S.lop[V.edit];
      S.lop[ten] = ds2; V.edit = ""; save(); renderWork();
    }
    else if (a === "pvCsv") {
      var rows = ["Lớp,Học sinh,Ngày,Bài,Slide,Điểm"].concat(S.pv.map(function (r) { return [r.lop, r.hs, r.ngay, r.bai, r.slide, r.diem].map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(","); }));
      var bl = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }), an2 = document.createElement("a");
      an2.href = URL.createObjectURL(bl); an2.download = "phat-bieu-tren-lop.csv"; an2.click(); setTimeout(function () { URL.revokeObjectURL(an2.href); }, 1000);
    }
    else if (a === "pvCsv2") {
      var r2 = ["Lớp,Học sinh,Buổi có mặt,Câu trả lời,Số câu hỏi,Câu đúng,Số câu có đáp án,Lần được gọi,Tổng điểm"];
      lopNames().forEach(function (l) { var m = pvTongKet(l); Object.keys(m).forEach(function (k) { var o = m[k]; r2.push([l, k, o.cm, o.tl, o.qn, o.dg, o.qk, o.n, o.d].map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(",")); }); });
      var b2 = new Blob(["\uFEFF" + r2.join("\r\n")], { type: "text/csv;charset=utf-8" }), a3 = document.createElement("a");
      a3.href = URL.createObjectURL(b2); a3.download = "chuyen-can-tong-hop.csv"; a3.click(); setTimeout(function () { URL.revokeObjectURL(a3.href); }, 1000);
    }
    else if (a === "pvUndo") { S.pv.pop(); save(); renderWork(); }
    else if (a === "pvDel") { if (!confirm("Xóa toàn bộ ghi nhận phát biểu?")) return; S.pv = []; S.cm = []; save(); renderWork(); }
    else if (a === "editLop") { V.edit = t.getAttribute("data-l"); renderWork(); }
    else if (a === "delLop") { var l = t.getAttribute("data-l"); if (!confirm("Xóa danh sách lớp " + l + "?")) return; delete S.lop[l]; if (V.edit === l) V.edit = ""; save(); renderWork(); }
    else if (a === "link") {
      var tid = t.getAttribute("data-t"), cur = S.links[V.khoi + "." + tid] || (tid === "ph" ? phUrl() : "");
      var u = prompt("Dán địa chỉ (bắt đầu bằng http, https hoặc file:///). Để trống để xóa.", cur); if (u === null) return; u = u.trim();
      if (u && !okUrl(u)) { msg("ccMsg", "Địa chỉ không hợp lệ."); return; }
      if (u) S.links[V.khoi + "." + tid] = u; else delete S.links[V.khoi + "." + tid]; save(); renderWork(); if (V.page === "tq") renderTree();
    }
    else if (a === "xuat") {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }), an = document.createElement("a");
      an.href = URL.createObjectURL(blob); an.download = "ho-so-day-hoc-" + new Date().toISOString().slice(0, 10) + ".json"; an.click(); URL.revokeObjectURL(an.href);
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "llLop") { S.lastLop = t.value; LL.called = []; $("llNguoi").textContent = ""; if (LL.b && LL.n) S.pos[LL.b.ma + "|" + t.value] = { i: LL.i, n: LL.n }; save(); return; }
    if (t.id === "llPhut") { llStop(); LL.left = +t.value * 60; $("llGio").textContent = fmt(LL.left); $("llGio").classList.remove("het"); return; }
    if (t.id === "nhap") {
      var f = t.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var d = JSON.parse(r.result); if (!d || typeof d !== "object") throw 0; for (var k in S) if (d[k] != null) S[k] = d[k]; save(); render(); msg("ccMsg", "Đã khôi phục."); } catch (x) { msg("ccMsg", "File không đúng định dạng."); } };
      r.readAsText(f); return;
    }
    var c = t.getAttribute && t.getAttribute("data-c"); if (!c) return;
    if (c === "prog") {
      var pk = t.getAttribute("data-k"); if (t.checked) S.prog[pk] = 1; else delete S.prog[pk]; save();
      var p = progOf(); $("tqPct").textContent = p.done + " / " + p.total + " mục (" + p.pct + "%)"; $("tqBar").style.width = p.pct + "%"; return;
    }
    if (c === "fd") V.fd = t.value; else if (c === "fm") V.fm = t.value; else if (c === "ans") V.ans = t.checked;
    else if (c === "qn") { V.qn = +t.value; return; } else if (c === "qkey") V.qkey = t.checked;
    else if (c === "st") { S.st[bKey(curBai())] = +t.value; save(); renderTree(); return; }
    renderWork();
  });

  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "hdQ") { e.preventDefault(); hoi(e.target.value); } });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "gcKhoi") { S.gc[V.khoi] = t.value; save(); }
    else if (t.classList && t.classList.contains("ed")) { var k = bKey(curBai()); (S.khbd[k] = S.khbd[k] || {})[t.getAttribute("data-f")] = t.innerText; save(); }
  });

  load(); if (!CFG.khoi[V.khoi]) V.khoi = Object.keys(CFG.khoi)[0]; firstData(); render();
})();
