/* NÚT "SỬA" TRÊN TRANG (hồ sơ, bài giảng, ôn tập): bảng GIAO VIỆC cho Claude ngay trên trang đang xem.
   - Thẻ "Giao việc": chọn loại việc, ghi yêu cầu. Bấm "Gửi" mở trang tạo phiếu (Issue) trên GitHub đã điền sẵn vị trí,
     đoạn đang bôi đen và yêu cầu; phiếu có nhãn "sua". Claude chạy trên GitHub Actions (.github/workflows/claude-sua.yml)
     đọc phiếu, sửa tệp, đẩy lên, trả lời trong phiếu.
   - Thẻ "Phiếu": các phiếu gần đây và trạng thái (chờ / đang làm / Claude hỏi lại / xong / lỗi), đọc lời Claude ngay trên trang,
     nút Trả lời, Hoàn tác, Thử lại. Các nút này tạo PHIẾU TIẾP (thân có "@claude" và dấu <!-- tiep-phieu: N -->):
     quy trình chép kèm nội dung phiếu N cho Claude đọc. Đọc phiếu bằng API công khai của GitHub (không cần khóa,
     giới hạn 60 lần/giờ cho mỗi mạng: chỉ tải khi mở thẻ, tự tải lại mỗi 60 giây khi có phiếu đang làm).
   - Nút chỉ hiện khi đã bật trên máy này: mở trang một lần với ?sua ở cuối địa chỉ (tắt: ?sua=0). Học sinh không thấy nút.
   - Trang không chứa mật khẩu hay khóa nào: phiếu gửi bằng tài khoản GitHub đang đăng nhập trên trình duyệt,
     và chỉ phiếu của chủ kho mới được xử lý (thẻ Phiếu cũng chỉ hiện phiếu của chủ kho).
   - Hồ sơ: dong_goi.js nhúng tệp này vào Ho-so-day-hoc-so.html. Trang bài giảng, ôn tập: tools/gan_nut_sua.js gắn thẻ
     <script src="../nguon/lib/nut_sua.js"> vào cuối trang. */
(function () {
  if (window.__nutSua) return; window.__nutSua = 1;
  var CHU = "kiemtn06-lgtm", KHO = CHU + "/ho-so-day-hoc-so", KEY = "hsdh_sua";
  var API = "https://api.github.com/repos/" + KHO, WEB = "https://github.com/" + KHO;
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* markdown tối thiểu cho lời Claude: liên kết, chữ đậm, nghiêng, mã, xuống dòng */
  function md(s) {
    return esc(String(s || "").replace(/<!--[\s\S]*?-->/g, "").trim())
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,)]|$)/g, "$1<i>$2</i>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
  }
  function luc(t) {
    var d = (Date.now() - new Date(t).getTime()) / 60000;
    if (d < 1) return "vừa xong"; if (d < 60) return Math.round(d) + " phút trước";
    if (d < 1440) return Math.round(d / 60) + " giờ trước"; return Math.round(d / 1440) + " ngày trước";
  }

  var css = document.createElement("style");
  css.textContent =
    "#nsNut{position:fixed;right:10px;top:50%;touch-action:none;z-index:2147483000;font:600 13px system-ui,sans-serif;padding:6px 11px;border-radius:18px;border:1px solid #b45309;background:#fff7ed;color:#9a3412;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.18);opacity:.8;user-select:none}" +
    "#nsNut:hover{opacity:1}#nsNut i{font-style:normal;display:inline-block;min-width:16px;margin-left:5px;padding:0 4px;border-radius:9px;background:#b45309;color:#fff;font-size:11px;line-height:16px}" +
    "#nsHop{position:fixed;left:10px;bottom:52px;z-index:2147483001;width:min(440px,calc(100vw - 20px));max-height:calc(100vh - 70px);overflow:auto;overflow-x:hidden;font:14px/1.45 system-ui,sans-serif;background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:12px;box-sizing:border-box}" +
    "#nsHop b{display:block;margin:6px 0 3px;font-size:13px}#nsHop .vt{font-size:12px;color:#4b5563;word-break:break-word}" +
    "#nsHop textarea,#nsHop select{width:100%;box-sizing:border-box;font:14px system-ui,sans-serif;border:1px solid #d1d5db;border-radius:6px;padding:6px;background:#fff;color:#111}" +
    "#nsHop .h{display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap}" +
    "#nsHop button{font:600 13px system-ui,sans-serif;padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#f3f4f6;color:#111;cursor:pointer}" +
    "#nsHop button.go{background:#b45309;border-color:#b45309;color:#fff}#nsHop .gc{font-size:12px;color:#6b7280;margin-top:6px}" +
    "#nsHop .the{display:flex;gap:4px;margin:-2px 0 8px;border-bottom:1px solid #e5e7eb}" +
    "#nsHop .the button{border:0;border-bottom:2px solid transparent;border-radius:0;background:none;padding:5px 10px;color:#6b7280}" +
    "#nsHop .the button.on{border-bottom-color:#b45309;color:#9a3412}" +
    "#nsHop .ph{border:1px solid #e5e7eb;border-radius:8px;margin:6px 0;padding:7px 9px}#nsHop .ph.hoi{border-color:#f59e0b;background:#fffbeb}" +
    "#nsHop .ph .t{cursor:pointer;display:flex;gap:6px;align-items:baseline}#nsHop .ph .t span{flex:1;font-weight:600;font-size:13px}" +
    "#nsHop .ph small{color:#6b7280;font-size:11px;white-space:nowrap}" +
    "#nsHop .tt{font-size:11px;font-weight:700;padding:1px 7px;border-radius:9px;white-space:nowrap}" +
    "#nsHop .tt.cho,#nsHop .tt.tiep,#nsHop .tt.dong{background:#e5e7eb;color:#374151}#nsHop .tt.lam{background:#dbeafe;color:#1e40af}#nsHop .tt.hoi{background:#fde68a;color:#92400e}" +
    "#nsHop .tt.xong{background:#d1fae5;color:#065f46}#nsHop .tt.loi{background:#fee2e2;color:#991b1b}" +
    "#nsHop .bl{font-size:13px;margin-top:6px;padding:6px 8px;border-radius:6px;background:#f9fafb;overflow-wrap:anywhere}#nsHop .bl.gv{background:#fff7ed}" +
    "#nsHop .bl .ai{font-size:11px;color:#6b7280;display:block}#nsHop .bl code{font-size:12px;background:#eef2f7;padding:0 3px;border-radius:3px}" +
    "#nsHop .ph .h button{padding:4px 10px;font-size:12px}" +
    "@media print{#nsNut,#nsHop{display:none!important}}";
  document.head.appendChild(css);

  var nut = document.createElement("button"), hop = null;
  nut.id = "nsNut"; nut.type = "button"; nut.textContent = "✎ Sửa"; nut.title = "Giao việc cho Claude (bôi đen đoạn cần sửa trước khi bấm) và xem các phiếu đã gửi";
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

  /* ---------- đọc phiếu từ GitHub ---------- */
  var DS = null, loiTai = "", dangTai = false, hen = null, moRong = {}, bl = {}, dangBL = {}, guiLuc = 0;
  try { var c0 = JSON.parse(sessionStorage.getItem("nsPhieu") || "null"); if (c0 && Date.now() - c0.luc < 120000) DS = c0.ds; } catch (e) {}
  try { guiLuc = +localStorage.getItem("nsGuiLuc") || 0; } catch (e) {}

  /* trạng thái theo lời nhắn gần nhất của quy trình (github-actions[bot]) */
  function trangThai(ph, cmts) {
    var bot = null;
    for (var i = cmts.length - 1; i >= 0; i--) if (cmts[i].user && cmts[i].user.type === "Bot") { bot = cmts[i]; break; }
    var gvSau = bot && cmts.some(function (c) { return c.user.type !== "Bot" && c.created_at > bot.created_at && /@claude/i.test(c.body); });
    var k = !bot ? (ph.state === "closed" ? "xong" : "cho") : gvSau ? "cho" : ({ "⏳": "lam", "❓": "hoi", "✅": "xong", "⚠": "loi", "↪": "tiep" })[bot.body.trim().charAt(0)] || (ph.state === "closed" ? "xong" : "cho");
    if (k === "hoi" && ph.state === "closed") k = "dong";   // cô đã đóng phiếu, không chờ trả lời nữa
    var ten = { tiep: "Đã gửi tiếp", dong: "Đã đóng", cho: "Chờ Claude", lam: "Đang làm…", hoi: "Claude hỏi lại", xong: "Xong", loi: "Chưa xong" }[k];
    return { k: k, ten: ten, bot: bot };
  }
  function lay(url) {
    return fetch(API + url, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }).then(function (r) {
      if (r.status === 403 || r.status === 429) throw new Error("GitHub tạm giới hạn số lần đọc (60 lần/giờ cho mỗi mạng). Thử lại sau ít phút, hoặc mở trang phiếu trên GitHub.");
      if (!r.ok) throw new Error("GitHub trả lỗi " + r.status);
      return r.json();
    });
  }
  function tai() {
    if (dangTai) return; dangTai = true; loiTai = ""; ve();
    Promise.all([lay("/issues?labels=sua&state=all&sort=created&direction=desc&per_page=12"),
                 lay("/issues/comments?sort=updated&direction=desc&per_page=100")]).then(function (kq) {
      var cm = {};
      kq[1].forEach(function (c) { var n = +c.issue_url.split("/").pop(); (cm[n] = cm[n] || []).push(c); });
      DS = kq[0].filter(function (p) { return p.user && p.user.login === CHU && !p.pull_request; }).map(function (p) {
        var cs = (cm[p.number] || []).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
        if (bl[p.number] && bl[p.number].length >= p.comments) cs = bl[p.number];   // đã tải đủ bình luận khi mở rộng
        var yc = /\*\*Yêu cầu sửa:\*\*\s*([\s\S]*?)(?:<!--|$)/.exec(p.body || "");
        return { so: p.number, tieuDe: p.title.replace(/^Sửa:\s*/, ""), state: p.state, luc: p.created_at, capNhat: p.updated_at,
                 soBL: p.comments, cmts: cs, yc: yc ? yc[1].trim() : (p.body || "").replace(/<!--[\s\S]*?-->/g, "").trim(), url: p.html_url };
      });
      try { sessionStorage.setItem("nsPhieu", JSON.stringify({ luc: Date.now(), ds: DS })); } catch (e) {}
    }).catch(function (e) { loiTai = e.message || String(e); }).then(function () {
      dangTai = false; huy(); ve(); demNut();
      var conLam = DS && DS.some(function (p) { var k = trangThai(p, p.cmts).k; return k === "lam" || (k === "cho" && p.state === "open"); });
      if (hop && the === "phieu" && !loiTai && (conLam || Date.now() - guiLuc < 600000)) hen = setTimeout(tai, 60000);
    });
  }
  function huy() { if (hen) clearTimeout(hen); hen = null; }
  function taiBL(so) {   // phiếu có hơn những bình luận gần đây: tải đủ khi mở rộng
    if (dangBL[so]) return; dangBL[so] = 1;
    lay("/issues/" + so + "/comments?per_page=100").then(function (cs) {
      bl[so] = cs; DS.forEach(function (p) { if (p.so === so) p.cmts = cs; }); ve();
    }).catch(function () {});
  }
  function demNut() {   // số phiếu Claude đang hỏi lại hiện trên nút
    var n = DS ? DS.filter(function (p) { return trangThai(p, p.cmts).k === "hoi"; }).length : 0;
    nut.innerHTML = "✎ Sửa" + (n ? "<i title=\"Claude đang hỏi lại " + n + " phiếu\">" + n + "</i>" : "");
  }

  /* ---------- gửi phiếu ---------- */
  function guiPhieu(tieuDe, than) {
    window.open(WEB + "/issues/new?labels=sua&title=" + encodeURIComponent(cat(tieuDe.replace(/\s+/g, " "), 80)) + "&body=" + encodeURIComponent(than), "_blank", "noopener");
    guiLuc = Date.now(); try { localStorage.setItem("nsGuiLuc", String(guiLuc)); } catch (e) {}
  }
  /* phiếu tiếp: trả lời / hoàn tác / thử lại phiếu N. Quy trình thấy dấu tiep-phieu thì chép kèm phiếu N cho Claude đọc */
  function guiTiep(p, loai, loi) {
    var tieuDe = { tl: "Trả lời phiếu #", ht: "Hoàn tác phiếu #", tl2: "Thử lại phiếu #", st: "Sửa thêm phiếu #" }[loai] + p.so + ": " + (loai === "ht" ? p.tieuDe : loi || p.tieuDe);
    var than = "@claude " + (loai === "ht" ? "hoàn tác phiếu #" + p.so + " (đưa các tệp về như trước commit của phiếu đó, dựng lại nếu cần)."
      : loai === "tl2" ? "làm lại phiếu #" + p.so + " (lần trước chưa xong)." + (loi ? "\n\n" + loi : "")
      : loai === "st" ? "sửa thêm cho phiếu #" + p.so + ":\n\n" + loi
      : "trả lời câu hỏi của Claude ở phiếu #" + p.so + ":\n\n" + loi) +
      "\n\n**Phiếu gốc:** " + p.url + "\n\n<!-- tiep-phieu: " + p.so + " -->";
    guiPhieu(tieuDe, than);
  }

  /* ---------- bảng ---------- */
  var the = "giao", nhap = { loai: "sua", doan: "", yc: "" };
  var LOAI = [["sua", "Sửa nội dung (chữ, đáp án, lời giải, công thức)", "Sửa"],
              ["them", "Thêm câu hỏi / bài tập", "Thêm câu hỏi"],
              ["mp", "Thêm hoặc sửa mô phỏng, hình động", "Mô phỏng"],
              ["hien", "Sửa hiển thị (vị trí, màu, cỡ chữ, nút bấm)", "Hiển thị"],
              ["khac", "Việc khác", "Việc"]];
  var GOI_Y = { sua: "Ví dụ: đáp án câu 3 phải là B; viết lại lời giải cho rõ; công thức bị lỗi hiển thị",
                them: "Ví dụ: thêm 3 câu trắc nghiệm vận dụng về lực ma sát, có lời giải",
                mp: "Ví dụ: thêm mô phỏng kéo thả để HS chỉnh góc α và thấy lực căng thay đổi",
                hien: "Ví dụ: chữ slide này nhỏ quá, phóng to; nút Kiểm tra bị che",
                khac: "Ghi rõ việc cần làm" };

  function dong() { huy(); if (hop) { luuNhap(); hop.remove(); } hop = null; }
  function luuNhap() {
    if (!hop || the !== "giao") return;
    var q = function (k) { var o = hop.querySelector('[data-k="' + k + '"]'); return o ? o.value : ""; };
    nhap = { loai: q("loai") || nhap.loai, doan: q("doan"), yc: q("yc") };
  }
  function mo(ycSan, theMo) {
    dong();
    if (ycSan) { nhap.yc = ycSan; theMo = "giao"; }
    if (theMo) the = theMo;
    if (chon && the === "giao") nhap.doan = cat(chon, 1500);
    hop = document.createElement("div"); hop.id = "nsHop";
    document.body.appendChild(hop);
    hop.addEventListener("click", bam);
    hop.addEventListener("change", function (e) { if (e.target.getAttribute("data-k") === "loai") { luuNhap(); ve(); } });
    ve(); datCho();
    if (the === "phieu") tai(); else { var o = hop.querySelector('[data-k="yc"]'); if (o) o.focus(); }
  }
  function datCho() {   // đặt hộp gần nút, không tràn khỏi màn hình
    var r = nut.getBoundingClientRect(), w = Math.min(440, window.innerWidth - 20);
    hop.style.width = w + "px"; hop.style.left = Math.max(10, Math.min(r.left, window.innerWidth - w - 10)) + "px";
    if (r.top > window.innerHeight / 2) { hop.style.bottom = (window.innerHeight - r.top + 8) + "px"; hop.style.top = "auto"; hop.style.maxHeight = (r.top - 20) + "px"; }
    else { hop.style.top = (r.bottom + 8) + "px"; hop.style.bottom = "auto"; hop.style.maxHeight = (window.innerHeight - r.bottom - 20) + "px"; }
  }
  function ve() {
    if (!hop) return;
    var o0 = hop.querySelector('[data-k="loi"]'); if (o0) nhapTL = o0.value;
    var hoi = DS ? DS.filter(function (p) { return trangThai(p, p.cmts).k === "hoi"; }).length : 0;
    var h = '<div class="the"><button type="button" data-k="the-giao" class="' + (the === "giao" ? "on" : "") + '">Giao việc</button>' +
      '<button type="button" data-k="the-phieu" class="' + (the === "phieu" ? "on" : "") + '">Phiếu đã gửi' + (hoi ? " (" + hoi + " hỏi lại)" : "") + "</button></div>";
    if (the === "giao") {
      h += "<b>Loại việc</b><select data-k=\"loai\">" + LOAI.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === nhap.loai ? " selected" : "") + ">" + l[1] + "</option>"; }).join("") + "</select>" +
        '<b>Vị trí</b><div class="vt">' + esc(viTri()) + "</div>" +
        "<b>Đoạn liên quan (đoạn đang bôi đen, sửa lại nếu cần)</b><textarea rows=\"3\" data-k=\"doan\">" + esc(nhap.doan) + "</textarea>" +
        '<b>Cần làm gì? <button type="button" data-k="noi" title="Nói yêu cầu, trang tự ghi thành chữ" style="float:right;padding:2px 9px"' + (window.TroGiang ? "" : " hidden") + '>🎤 Nói</button></b>' +
        '<textarea rows="4" data-k="yc" placeholder="' + esc(GOI_Y[nhap.loai] || "") + '">' + esc(nhap.yc) + "</textarea>" +
        '<div class="gc">Bấm Gửi sẽ mở GitHub trong thẻ mới, bấm tiếp <i>Create</i> để gửi. Theo dõi kết quả ở thẻ <b style="display:inline">Phiếu đã gửi</b>; trang trên mạng tự cập nhật vài phút sau khi Claude xong.</div>' +
        '<div class="h"><button type="button" data-k="huy">Đóng</button><button type="button" class="go" data-k="gui">Gửi</button></div>';
    } else {
      h += '<div class="h" style="margin:0 0 4px;justify-content:space-between;align-items:center"><span class="gc" style="margin:0">' +
        (dangTai ? "Đang tải…" : loiTai ? '<span style="color:#b91c1c">' + esc(loiTai) + "</span>" : DS ? "Bấm vào phiếu để xem lời Claude" : "") +
        '</span><span><button type="button" data-k="tai">↻ Tải lại</button> <a href="' + WEB + '/issues?q=label%3Asua" target="_blank" rel="noopener" style="font-size:12px">Tất cả trên GitHub</a></span></div>';
      if (DS && !DS.length) h += '<div class="gc">Chưa có phiếu nào.</div>';
      (DS || []).forEach(function (p) {
        var tt = trangThai(p, p.cmts), mr = moRong[p.so] || (tt.k === "hoi" && moRong[p.so] !== false);
        h += '<div class="ph' + (tt.k === "hoi" ? " hoi" : "") + '"><div class="t" data-k="mr" data-so="' + p.so + '"><span>#' + p.so + " " + esc(p.tieuDe) + '</span><em class="tt ' + tt.k + '">' + tt.ten + "</em></div>" +
          "<small>gửi " + luc(p.luc) + (p.capNhat !== p.luc ? " · cập nhật " + luc(p.capNhat) : "") + "</small>";
        if (mr) {
          h += '<div class="bl gv"><span class="ai">Cô yêu cầu</span>' + md(cat(p.yc, 600)) + "</div>";
          if (p.cmts.length < p.soBL && !bl[p.so]) { taiBL(p.so); h += '<div class="gc">Đang tải đủ các trao đổi…</div>'; }
          p.cmts.forEach(function (c) {
            var laBot = c.user.type === "Bot";
            h += '<div class="bl' + (laBot ? "" : " gv") + '"><span class="ai">' + (laBot ? "Claude" : "Cô") + " · " + luc(c.created_at) + "</span>" + md(c.body) + "</div>";
          });
          h += '<div class="h">';
          if (tt.k === "hoi") h += '<button type="button" class="go" data-k="tl" data-so="' + p.so + '">Trả lời Claude</button>';
          if (tt.k === "dong") h += '<button type="button" data-k="tl" data-so="' + p.so + '">Trả lời Claude</button>';
          if (tt.k === "loi") h += '<button type="button" class="go" data-k="tl2" data-so="' + p.so + '">Thử lại</button>';
          if (tt.k === "xong") h += '<button type="button" data-k="ht" data-so="' + p.so + '">Hoàn tác</button><button type="button" data-k="st" data-so="' + p.so + '">Sửa thêm</button><button type="button" class="go" data-k="nap">Tải lại trang</button>';
          h += '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" style="font-size:12px;align-self:center">Mở trên GitHub</a></div>';
          if (dangTraLoi === p.so) h += '<textarea rows="3" data-k="loi" placeholder="' + (kieuTL === "st" ? "Cần sửa thêm gì?" : kieuTL === "tl2" ? "Ghi chú thêm (không bắt buộc)" : "Câu trả lời cho Claude") + '">' + esc(nhapTL) + '</textarea>' +
            '<div class="h"><button type="button" data-k="tl-huy">Thôi</button><button type="button" class="go" data-k="tl-gui" data-so="' + p.so + '">Gửi trả lời</button></div>';
        }
        h += "</div>";
      });
      h += '<div class="gc">Trả lời, Hoàn tác, Sửa thêm đều mở một phiếu tiếp đã điền sẵn (có @claude), cô chỉ cần bấm <i>Create</i>.</div>';
    }
    var cuon = hop.scrollTop; hop.innerHTML = h; hop.scrollTop = cuon;
  }
  var dangTraLoi = 0, kieuTL = "", nhapTL = "";
  function timPhieu(so) { so = +so; return (DS || []).filter(function (p) { return p.so === so; })[0]; }
  function bam(e) {
    var o = e.target.closest ? e.target.closest("[data-k]") : e.target; if (!o) return;
    var k = o.getAttribute("data-k"), so = o.getAttribute("data-so");
    if (k === "huy") dong();
    else if (k === "the-giao" || k === "the-phieu") { luuNhap(); the = k.slice(4); huy(); ve(); if (the === "phieu") tai(); }
    else if (k === "tai") { huy(); tai(); }
    else if (k === "nap") location.reload();
    else if (k === "mr") { var p0 = timPhieu(so), tt0 = trangThai(p0, p0.cmts); moRong[so] = !(moRong[so] || (tt0.k === "hoi" && moRong[so] !== false)); ve(); }
    else if (k === "noi") {
      var ta = hop.querySelector('[data-k="yc"]');
      window.TroGiang.docMotCau(function (cau) { if (!hop || !ta.isConnected) return; ta.value = (ta.value.trim() ? ta.value.trim() + " " : "") + cau; ta.focus(); });
    }
    else if (k === "gui") {
      luuNhap();
      var yc = nhap.yc.trim(), doan = nhap.doan.trim(), loai = LOAI.filter(function (l) { return l[0] === nhap.loai; })[0] || LOAI[0];
      if (!yc) { hop.querySelector('[data-k="yc"]').focus(); return; }
      var vt = viTri();
      var than = "**Loại việc:** " + loai[1] + "\n\n**Vị trí:** " + vt + "\n\n**Trang:** " + location.href.replace(/[?&]sua(=[^&#]*)?/, "") + "\n\n" +
        (doan ? "**Đoạn cần sửa:**\n\n" + doan.split("\n").map(function (l) { return "> " + l; }).join("\n") + "\n\n" : "") +
        "**Yêu cầu sửa:**\n\n" + yc + "\n\n<!-- phieu-sua: gui tu nut Sua tren trang -->";
      guiPhieu((loai[0] === "sua" ? "Sửa: " : loai[2] + ": ") + yc, than);
      nhap = { loai: "sua", doan: "", yc: "" }; chon = "";
      the = "phieu"; ve(); setTimeout(tai, 20000);   // phiếu thường xuất hiện sau khi cô bấm Create
      hop.querySelector(".gc").innerHTML = "Đã mở GitHub. Bấm <i>Create</i> ở thẻ đó, phiếu sẽ hiện ở đây sau ít giây.";
    }
    else if (k === "ht") {
      var p1 = timPhieu(so);
      if (confirm("Hoàn tác phiếu #" + so + " (" + p1.tieuDe + ")?\nClaude sẽ đưa các tệp về như trước khi sửa.")) guiTiep(p1, "ht");
    }
    else if (k === "tl" || k === "tl2" || k === "st") { dangTraLoi = +so; kieuTL = k; nhapTL = ""; ve(); var t = hop.querySelector('[data-k="loi"]'); if (t) t.focus(); }
    else if (k === "tl-huy") { dangTraLoi = 0; nhapTL = ""; ve(); }
    else if (k === "tl-gui") {
      var loi = (hop.querySelector('[data-k="loi"]') || {}).value || "";
      if (!loi.trim() && kieuTL !== "tl2") { hop.querySelector('[data-k="loi"]').focus(); return; }
      guiTiep(timPhieu(so), kieuTL, loi.trim()); dangTraLoi = 0; nhapTL = ""; ve(); setTimeout(tai, 20000);
    }
  }

  function gan() {
    document.body.appendChild(nut); if (vt0) dat(vt0.x, vt0.y);
    if (DS) demNut();
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
  window.HSDH_SUA = { mo: function (yc) { mo(yc || "", "giao"); }, dong: dong, dangMo: function () { return !!hop; }, phieu: function () { mo("", "phieu"); } };
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
})();
