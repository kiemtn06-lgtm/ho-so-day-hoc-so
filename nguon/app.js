(function () {
  var CFG = window.HO_SO, DATA = window.HSDH_DATA || {}, KEY = "hsdh_v2";
  var S = { st: {}, notes: {}, links: {}, lop: {}, pos: {}, lastLop: "", prog: {}, gc: {}, khbd: {} };
  var HOAT = [["ga", "Giáo án"], ["sl", "Slide"], ["bt", "Bài tập"], ["on", "Ôn tập"], ["de", "Đề"]];
  var V = { khoi: CFG.khoiMacDinh, page: "tq", ch: 0, bai: 0, tab: 0, fd: "", fm: "", ans: false, quiz: null, qkey: false, edit: "" };
  var TABS = ["Trình chiếu", "SGK", "KHBD", "Bài tập", "Kiểm tra", "Ghi chú sau tiết"];
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
      var d = dOf(ch);
      if (!d) { h += '<div class="ch no">' + (i + 1) + ". " + esc(ch.ten) + " · chưa có dữ liệu</div>"; return; }
      h += '<div class="ch">' + (i + 1) + ". " + esc(ch.ten) + "</div>";
      d.bai.forEach(function (b, j) {
        var on = V.page === "bai" && V.ch === i && V.bai === j;
        h += '<button data-a="bai" data-ch="' + i + '" data-i="' + j + '" class="' + (on ? "on" : "") + '"><i class="dot s' + (S.st[ch.duLieu + "." + b.ma] || 0) + '"></i>' + esc(b.ten) + "</button>";
      });
    });
    h += '<hr><button data-a="page" data-p="lop" class="' + (V.page === "lop" ? "on" : "") + '">Lớp học</button>';
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
    if (tags) h += '<div><span class="tag">' + DANG[q.dang] + '</span><span class="tag m">' + (MUC[q.muc] || esc(q.muc)) + "</span></div>";
    h += "<b>Câu " + n + ".</b> " + T(q.dang === "ds" ? (q.ds.dan || q.de) : q.de);
    if ((q.hinh || []).length) h += ' <span class="muted">(có hình ' + esc(q.hinh.join(", ")) + ": xem trong bài giảng)</span>";
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
    if (ch.baiGiang) h += '<a class="btn" target="_blank" rel="noopener" href="' + esc(ch.baiGiang) + "#" + b.ma + '">Mở riêng bài giảng ở tab mới</a>';
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
  function tabKiemTra(b) {
    var pool = b.cau_hoi.filter(function (q) { return q.dang === "tn" && !(q.hinh || []).length; });
    var h = '<div class="row noprint">' + sel("qn", V.qn || 5, [[5, "5 câu"], [10, "10 câu"], [pool.length, "Tất cả " + pool.length + " câu"]]) +
      '<button data-a="quiz">Tạo đề trắc nghiệm nhanh</button><label><input type="checkbox" data-c="qkey"' + (V.qkey ? " checked" : "") + '> Hiện bảng đáp án</label><span class="sp"></span><button data-a="print">In đề</button></div>';
    if (V.quiz && V.quiz.ma === b.ma) {
      var qs = V.quiz.ids.map(function (id) { return b.cau_hoi.filter(function (q) { return q.id === id; })[0]; });
      h += "<h3>Kiểm tra nhanh · " + esc(b.ten) + "</h3>" + qs.map(function (q, i) { return qHTML(q, i + 1, false, false); }).join("");
      if (V.qkey) h += '<h3>Đáp án</h3><table class="key"><tr>' + qs.map(function (q, i) { return "<td>" + (i + 1) + "</td>"; }).join("") + "</tr><tr>" + qs.map(function (q) { return "<td><b>" + esc(q.tn.dap_an) + "</b></td>"; }).join("") + "</tr></table>";
    } else h += '<p class="muted">Chọn số câu rồi bấm "Tạo đề trắc nghiệm nhanh". Đề lấy ngẫu nhiên từ ' + pool.length + " câu trắc nghiệm không có hình của bài.</p>";
    var links = CFG.congCu.filter(function (t) { return (t.id === "on" || t.id === "ph") && (S.links[V.khoi + "." + t.id] || (t.khoi || {})[V.khoi]); });
    if (links.length) h += '<h3 class="noprint">Cho học sinh làm trực tuyến</h3><div class="row noprint">' + links.map(function (t) { return '<a class="btn" target="_blank" rel="noopener" href="' + esc(S.links[V.khoi + "." + t.id] || t.khoi[V.khoi]) + '">' + esc(t.ten) + "</a>"; }).join("") + "</div>";
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
    h += "<h3>" + (V.edit ? "Sửa lớp " + esc(V.edit) : "Thêm lớp") + '</h3><div class="card"><div class="row"><input id="lTen" placeholder="Tên lớp (ví dụ 12A6)" value="' + esc(V.edit) + '"></div><textarea id="lDs" rows="8" placeholder="Mỗi dòng một học sinh">' + esc(V.edit ? S.lop[V.edit].join("\n") : "") + '</textarea><div class="row" style="margin:8px 0 0"><button data-a="saveLop">Lưu lớp</button><span id="lMsg" class="muted" role="status"></span></div></div>';
    return h;
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
        '<td class="muted">' + (day || "chưa có dữ liệu") + "</td></tr>";
    });
    h += '</table></div><h3>Ghi chú dạy học của khối</h3><textarea id="gcKhoi" rows="4" placeholder="Ghi chú cho khối này: lớp yếu phần nào, cần bổ sung gì">' + esc(S.gc[V.khoi] || "") + "</textarea>";
    return h;
  }
  function pageCC() {
    return '<div class="head"><h2>Sao lưu dữ liệu</h2></div><p class="muted">Trạng thái bài, tiến độ, ghi chú, danh sách lớp và liên kết được lưu trong trình duyệt của máy này. Sao lưu ra file để giữ bản dự phòng hoặc mang sang máy khác.</p><div class="row"><button data-a="xuat">Sao lưu ra file</button><label class="btn">Khôi phục từ file<input type="file" id="nhap" accept=".json" hidden></label><span id="ccMsg" class="muted" role="status"></span></div>';
  }
  function toolsHTML() {
    var h = '<div class="grid">';
    CFG.congCu.forEach(function (t) {
      var url = S.links[V.khoi + "." + t.id] || (t.khoi || {})[V.khoi], note = t.ghiChu && t.ghiChu[V.khoi];
      h += '<div class="card"><b>' + esc(t.ten) + '</b> <span class="tag' + (url ? "" : " m") + '">' + (url ? "Dùng được" : note ? "Có skill" : "Chưa có") + '</span><div class="muted">' + esc(t.moTa) + (note ? "<br>" + esc(note) : "") + '</div><div class="row" style="margin:6px 0 0">' + (url ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(url) + '">Mở</a>' : "") + '<button class="link" data-a="link" data-t="' + t.id + '">' + (url ? "Đổi liên kết" : "Gắn liên kết") + "</button></div></div>";
    });
    return h + '</div><span id="ccMsg" class="muted" role="status"></span>';
  }

  function renderWork() {
    var w = $("work"), b = curBai();
    if (V.page === "lop") { w.innerHTML = pageLop(); return; }
    if (V.page === "cc") { w.innerHTML = pageCC(); return; }
    if (V.page === "tq") { w.innerHTML = pageTQ(); return; }
    if (!b) { w.innerHTML = '<div class="head"><h2>' + esc(CFG.khoi[V.khoi].ten) + '</h2></div><p class="muted">Khối này chưa có chương nào có dữ liệu bài học. Hiện mới có Chương 2 (Khí lí tưởng) của Khối 12.</p>'; return; }
    var h = '<div class="head"><h2>' + esc(b.ten) + '</h2><span class="muted">SGK tr. ' + esc(b.trang_sgk || "") + '</span><span class="sp"></span>' + (curCh().baiGiang ? '<button class="go noprint" data-a="day">Dạy ngay</button>' : "") + "</div>";
    h += '<div class="tabs">' + TABS.map(function (t, i) { return '<button data-a="tab" data-i="' + i + '" class="' + (i === V.tab ? "on" : "") + '">' + t + "</button>"; }).join("") + "</div>";
    h += [tabTrinhChieu, tabSGK, tabKHBD, tabBaiTap, tabKiemTra, tabGhiChu][V.tab](b);
    w.innerHTML = h;
  }
  function render() { renderHead(); renderTree(); renderWork(); }
  function msg(id, m) { var e = $(id); if (e) { e.textContent = m; setTimeout(function () { if (e) e.textContent = ""; }, 3500); } }

  /* ---------- chế độ lên lớp ---------- */
  var LL = { b: null, i: 0, n: 0, called: [], tm: null, left: 0 };
  function fmt(s) { return ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + s % 60).slice(-2); }
  function llOpen(b) {
    var ch = curCh(); LL.b = b; LL.called = []; LL.i = 0; LL.n = 0;
    $("llTen").textContent = b.ten;
    $("llLop").innerHTML = '<option value="">(chưa chọn)</option>' + lopNames().map(function (l) { return '<option' + (l === S.lastLop ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("");
    $("llNguoi").textContent = ""; $("llNote").hidden = true; $("llText").value = "";
    llStop(); LL.left = +$("llPhut").value * 60; $("llGio").textContent = fmt(LL.left); $("llGio").classList.remove("het");
    var p = S.pos[b.ma + "|" + $("llLop").value];
    $("llFrame").src = ch.baiGiang + "#" + b.ma + (p && p.i ? "@" + p.i : "");
    $("lenLop").hidden = false;
    var k = bKey(b); if (!S.st[k]) { S.st[k] = 1; save(); }
    setTimeout(function () { try { $("llFrame").focus(); } catch (e) {} }, 600);
  }
  function llStop() { if (LL.tm) { clearInterval(LL.tm); LL.tm = null; } $("llDem").textContent = "Bấm giờ"; }
  function beep() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); setTimeout(function () { o.stop(); a.close(); }, 700); } catch (e) {} }
  function llClose() {
    llStop(); if (document.fullscreenElement) document.exitFullscreen();
    $("llFrame").src = "about:blank"; $("lenLop").hidden = true; LL.b = null; render();
  }
  window.addEventListener("message", function (e) {
    var d = e.data; if (!d || d.hsdh !== "pos" || !LL.b || e.source !== $("llFrame").contentWindow || d.ma !== LL.b.ma) return;
    if (d.i === LL.i && d.n === LL.n) return;
    LL.i = d.i; LL.n = d.n; S.pos[LL.b.ma + "|" + $("llLop").value] = { i: d.i, n: d.n }; save();
  });

  /* ---------- sự kiện ---------- */
  document.addEventListener("click", function (e) {
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
      LL.called.push(pick); $("llNguoi").textContent = pick; return;
    }
    if (id === "llDem") {
      if (LL.tm) { llStop(); return; }
      if (LL.left <= 0) LL.left = +$("llPhut").value * 60;
      $("llGio").classList.remove("het"); $("llDem").textContent = "Dừng";
      LL.tm = setInterval(function () { LL.left--; $("llGio").textContent = fmt(Math.max(0, LL.left)); if (LL.left <= 0) { llStop(); $("llGio").classList.add("het"); beep(); } }, 1000);
      return;
    }
    var t = e.target.closest("[data-a]"); if (!t) return; var a = t.getAttribute("data-a"), b = curBai();
    if (a === "khoi") { V.khoi = t.getAttribute("data-k"); V.page = "tq"; V.tab = 0; firstData(); render(); }
    else if (a === "bai") { V.page = "bai"; V.ch = +t.getAttribute("data-ch"); V.bai = +t.getAttribute("data-i"); V.quiz = null; render(); window.scrollTo(0, 0); }
    else if (a === "page") { V.page = t.getAttribute("data-p"); V.edit = ""; render(); }
    else if (a === "tab") { V.tab = +t.getAttribute("data-i"); renderWork(); }
    else if (a === "day") llOpen(b);
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
    else if (a === "editLop") { V.edit = t.getAttribute("data-l"); renderWork(); }
    else if (a === "delLop") { var l = t.getAttribute("data-l"); if (!confirm("Xóa danh sách lớp " + l + "?")) return; delete S.lop[l]; if (V.edit === l) V.edit = ""; save(); renderWork(); }
    else if (a === "link") {
      var tid = t.getAttribute("data-t"), cur = S.links[V.khoi + "." + tid] || "";
      var u = prompt("Dán địa chỉ (bắt đầu bằng http, https hoặc file:///). Để trống để xóa.", cur); if (u === null) return; u = u.trim();
      if (u && !okUrl(u)) { msg("ccMsg", "Địa chỉ không hợp lệ."); return; }
      if (u) S.links[V.khoi + "." + tid] = u; else delete S.links[V.khoi + "." + tid]; save(); renderWork();
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

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "gcKhoi") { S.gc[V.khoi] = t.value; save(); }
    else if (t.classList && t.classList.contains("ed")) { var k = bKey(curBai()); (S.khbd[k] = S.khbd[k] || {})[t.getAttribute("data-f")] = t.innerText; save(); }
  });

  load(); if (!CFG.khoi[V.khoi]) V.khoi = Object.keys(CFG.khoi)[0]; firstData(); render();
})();
