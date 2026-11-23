/* TRỢ GIẢNG GIỌNG NÓI trên trang bài giảng, ôn tập: giáo viên nói lệnh, trang tự làm. Robot KHÔNG nói, chỉ trả lời bằng ô chat nhỏ cạnh nút 🎤.
   Hiểu lệnh theo NGHĨA, nói tự nhiên được: "Chuyển", "Chúng ta qua slide tiếp theo", "Tiếp tục nhé", "Kết thúc"...
     - bỏ từ đệm (chúng ta, các em, nhé, nào, bây giờ, trợ giảng ơi...), còn lại tách thành ý: TIẾP, LÙI, SLIDE, SỐ, ĐÁP ÁN, MÔ PHỎNG...
     - câu chỉ gồm các ý của một lệnh thì làm ngay; câu có chữ lạ ("Chuyển ĐỘNG thẳng đều", "ĐÚNG rồi") là lời giảng, bỏ qua.
       So khớp CÓ DẤU: "đúng", "động", "đồng" không phải "đóng"; các cụm Vật lí (chuyển động, tiếp tuyến, tắt dần...) chặn sẵn.
     - câu GẦN giống lệnh (thừa đúng một chữ lạ, ví dụ "Quay lại bài trước") thì robot HỎI trong ô chat: cô bấm/nói "Đúng" hoặc "Không".
       Robot nhớ câu trả lời trên máy này (localStorage tgHoc / tgBo): lần sau nói vậy là làm ngay, hoặc không hỏi nữa.
   Lệnh: Chuyển / Lùi / Slide 5 / Về đầu / Slide cuối · Đáp án (câu 2) / Ẩn đáp án · Mô phỏng; trong mô phỏng: Chạy, Dừng, Đặt lại
         · Gọi tên · Chia 4 nhóm · Đếm ngược 3 phút, Dừng giờ, Tắt đồng hồ · Đóng / Kết thúc · Sửa <yêu cầu> · Tắt micro · Trợ giúp
   - Nút 🎤 chỉ hiện trên máy đã bật nút Sửa (mở trang một lần với ?sua), học sinh không thấy. Bấm 🎤 bắt đầu / dừng nghe; kéo được.
   - Nhận giọng nói bằng Web Speech API của trình duyệt (Chrome, Edge; cần mạng). Nhật kí lệnh (tgNhatKi) chỉ ghi câu giống lệnh, chỉ trên máy này.
   - Không sửa trang nào: chỉ bấm hộ nút và phím có sẵn (→ ← Esc, G, công cụ 👥 Lớp), nên dùng được cho mọi kiểu trang.
   - Gắn vào trang bằng tools/gan_nut_sua.js (cùng nút Sửa). Kiểm tra cách hiểu lệnh: node tools/kiem_tro_giang.js */
(function () {
  if (window.TroGiang) return;
  try { if (localStorage.getItem("hsdh_sua") !== "1") return; } catch (e) { return; }
  try {
    var fe = window.frameElement;
    if (fe && (fe.classList.contains("ttf") || (window.parent && window.parent.TroGiang))) return;
  } catch (e) {}
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ---------- tiện ích ---------- */
  function bo(s) {   // bỏ dấu, chữ thường, bỏ dấu câu (để so chữ trên nút)
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
      .replace(/[.,!?;:"“”'()…-]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function chuan(s) {   // GIỮ dấu: chữ thường, bỏ dấu câu, tách số khỏi chữ
    return String(s || "").normalize("NFC").toLowerCase().replace(/[.,!?;:"“”'()…–—-]+/g, " ")
      .replace(/(\d+)/g, " $1 ").replace(/\s+/g, " ").trim();
  }
  function docLS(k, md) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? md : v; } catch (e) { return md; } }
  function ghiLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
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
  var CUA_TOI = "#tgNut,#tgChat,#tgHop,#tgGio,#nsNut,#nsHop,#hl-nut";
  function cacNut(mau, goc, coDau) {   // mọi nút đang hiện có chữ khớp mẫu, xếp theo mẫu (mẫu trước ưu tiên)
    var ds = goc ? [goc] : cacTrang(), ung = [], kq = [];
    ds.forEach(function (d) {
      [].forEach.call(d.querySelectorAll("button,summary,[role=button],a,.btn,[onclick]"), function (b) {
        if (b.closest(CUA_TOI) || !hien(b)) return;
        var t = b.textContent || b.value || b.getAttribute("aria-label") || "";
        ung.push({ el: b, t: coDau ? chuan(t) : bo(t) });
      });
    });
    for (var i = 0; i < mau.length; i++)
      for (var j = 0; j < ung.length; j++) if (ung[j].t.length < 40 && mau[i].test(ung[j].t) && kq.indexOf(ung[j].el) < 0) kq.push(ung[j].el);
    return kq;
  }
  function timNut(mau, goc, coDau) { return cacNut(mau, goc, coDau)[0] || null; }
  function oTrong(mo) {   // ô đáp án dạng [data-g=blank] đang hiện: mo=false lấy ô chưa mở, true lấy ô đã mở
    var kq = [];
    cacTrang().forEach(function (d) { [].forEach.call(d.querySelectorAll('[data-g="blank"]'), function (x) { if (hien(x) && x.classList.contains("open") === mo) kq.push(x); }); });
    return kq;
  }
  function thuocCau(el, n) {   // phần tử nằm trong khối "Câu n" (khối cha gần nhất bắt đầu bằng "Câu k" / "Bài k")
    for (var p = el.parentElement, i = 0; p && i < 10; p = p.parentElement, i++) {
      var m = /^(cau|bai)\s*(\d+)\b/.exec(bo(String(p.textContent || "").slice(0, 40)));
      if (m) return +m[2] === n;
    }
    return false;
  }
  function mpMo() { try { return !!(window.MP && MP.dangMo && MP.dangMo()); } catch (e) { return false; } }
  function hopMP() { var k = document.getElementById("mpK"); return mpMo() && k ? k : null; }

  /* ---------- từ điển ý: cụm từ (có dấu) → ý. "_" là từ đệm, "NOI" là cụm từ của lời giảng (tính như chữ lạ) ---------- */
  var Y = {
    _: "trợ giảng|trợ lý|trợ lí|robot|rô bốt|rô bô|ơi|em ơi|bạn ơi|chúng ta|chúng mình|bọn mình|mình|ta|các em|các bạn|cả lớp|lớp mình|lớp|cô|thầy|" +
       "bây giờ|giờ thì|giờ|rồi|sẽ|hãy|cùng|cùng nhau|nhé|nhá|nha|nhen|nào|đi|ạ|à|nhỉ|luôn|giúp cô|cho cô|giúp mình|cho mình|giúp tôi|cho tôi|tôi|" +
       "ok|okay|oke|ô kê|được rồi|vậy|vậy thì|thì|nhanh|ngay|với|cái|này|đó|kia|của|để|thôi|làm ơn|xin|vui lòng|nữa|thành|ra|cho|tiếp đây",
    NOI: "chuyển động|chuyển hóa|chuyển hoá|chuyển đổi|chuyển dời|chuyển thể|dịch chuyển|di chuyển|động năng|tiếp tuyến|tiếp xúc|tiếp điểm|nối tiếp|" +
       "trực tiếp|gián tiếp|tắt dần|gọi là|được gọi|mở rộng|đóng góp|đóng vai|đóng mạch|đóng khóa|đóng khoá|đóng công tắc|mở công tắc|ngắt mạch|" +
       "đi qua|đi sang|truyền qua|xuyên qua|sang trái|sang phải|qua trái|qua phải|phía trước|phía sau|đằng trước|đằng sau|trước tiên|trước đó|trước khi|" +
       "sau đó|sau khi|ban đầu|lúc đầu|điểm đầu|điểm cuối|vị trí đầu|hai đầu|một đầu|đầu dây|đầu mút|chú ý|về nhà|bài về nhà|giờ học|số liệu|số đo|" +
       "sai số|lần đo|thời gian|đồng hồ bấm giây|đồng hồ đo|lùi xe|xe lùi|kết quả đo|quay đều|quay tròn|bật đèn|tắt đèn",
    TIEP: "tiếp|tiếp theo|tiếp tục|kế|kế tiếp|kế tiếp theo|next|sau|chuyển tiếp|tiếp nữa|sau nữa",
    CHUYEN: "chuyển|sang|qua|chuyển sang|chuyển qua|lật|lật sang|lật qua|lướt|lướt qua",
    DEN: "đến|tới|về|đi đến|đi tới|nhảy|nhảy đến|nhảy tới|nhảy sang|nhảy về",
    LUI: "lùi|lui|quay lại|trở lại|quay về|trở về|lùi lại|back|trước|lúc nãy|vừa rồi|vừa nãy|ban nãy",
    LAI: "lại",
    SLIDE: "slide|slides|slai|xlai|sờ lai|sờ lai đờ|trang|trang chiếu|trang trình chiếu|màn hình|bản chiếu",
    PHAN: "bước|phần|mục|ý|câu|câu hỏi|nội dung|hình",
    THU: "thứ|số",
    DAU: "đầu|đầu tiên|mở đầu",
    CUOI: "cuối|cuối cùng",
    DAPAN: "đáp án|lời giải|kết quả|đáp số|giải đáp|cách giải|bài giải|đáp án đúng",
    HIEN: "hiện|hiện ra|xem|mở|mở ra|cho xem|coi|hiển thị|bật|bật lên|chiếu|công bố|show|nhìn",
    AN: "ẩn|giấu|che|ẩn đi|giấu đi|cất",
    TAT: "tắt",
    DONG: "đóng|đóng lại|thoát|thoát ra|kết thúc|dẹp",
    OBJ: "cửa sổ|khung|bảng|phiếu|hộp|thẻ",
    MP: "mô phỏng|thí nghiệm ảo|thí nghiệm|mô hình|thí nghiệm mô phỏng",
    CHAY: "chạy|bắt đầu|thả|phát|play|chạy thử|cho chạy|chạy tiếp",
    DUNG: "dừng|tạm dừng|ngừng|dừng lại|pause|tạm ngừng",
    DATLAI: "đặt lại|làm lại|reset|bắt đầu lại|chạy lại|chơi lại|khởi động lại",
    GOI: "gọi|gọi tên|gọi ngẫu nhiên|bốc thăm|quay số|chọn ngẫu nhiên",
    TEN: "tên|bạn|học sinh|em|ngẫu nhiên|ai|người|một bạn|bạn nào|em nào|một em|bạn khác|em khác|người khác",
    LEN: "lên bảng|lên|trả lời|phát biểu|bất kì|bất kỳ",
    NHOM: "nhóm|chia nhóm|chia|chia lớp",
    GIO: "đếm ngược|hẹn giờ|bấm giờ|đặt giờ|tính giờ|đồng hồ|đếm giờ",
    "GIO+DUNG": "dừng giờ|tạm dừng giờ|dừng đồng hồ",
    "GIO+TAT": "tắt giờ",
    PHUT: "phút", GIAY: "giây", RUOI: "rưỡi",
    MIC: "micro|mic|míc|mi crô|mi cờ rô|mai cờ rô|nghe|nghe lệnh|thu âm",
    GIUP: "trợ giúp|giúp|giúp đỡ|hướng dẫn|lệnh|các lệnh|danh sách lệnh|bảng lệnh",
    ALL: "tất cả|toàn bộ|hết|hết luôn"
  };
  var TU = {}, DAI = 1;
  Object.keys(Y).forEach(function (k) {
    Y[k].split("|").forEach(function (c) { TU[c] = k === "_" || k === "NOI" ? k : k.split("+"); DAI = Math.max(DAI, c.split(" ").length); });
  });
  var SO = { "không": 0, "một": 1, "mốt": 1, "hai": 2, "ba": 3, "bốn": 4, "tư": 4, "năm": 5, "lăm": 5, "nhăm": 5, "sáu": 6, "bảy": 7, "bẩy": 7,
    "tám": 8, "chín": 9, "mười": "M", "mươi": "X", "linh": "L", "lẻ": "L" };
  function giaTri(ws) {   // ["hai","mươi","mốt"] → 21; ["12"] → 12
    if (ws.length === 1 && /^\d+$/.test(ws[0])) return +ws[0];
    var so = null, chuc = null;
    for (var i = 0; i < ws.length; i++) {
      var v = SO[ws[i]];
      if (v === "M") chuc = 1; else if (v === "X") { chuc = so === null ? 1 : so; so = null; } else if (v === "L") continue;
      else if (typeof v === "number") { if (so !== null && chuc === null) break; so = v; } else return null;
    }
    return chuc !== null ? chuc * 10 + (so || 0) : so;
  }
  function tach(s) {   // câu đã chuẩn hóa → các mảnh {w, y:[ý]} | {w, so} | {w, la:true} (chữ lạ); bỏ từ đệm
    var w = s.split(" "), kq = [], i = 0;
    while (i < w.length) {
      var gap = null;
      for (var n = Math.min(DAI, w.length - i); n >= 1 && !gap; n--) { var c = w.slice(i, i + n).join(" "); if (TU[c]) gap = { w: c, n: n, y: TU[c] }; }
      if (gap) { i += gap.n; if (gap.y === "_") continue; kq.push(gap.y === "NOI" ? { w: gap.w, la: true } : { w: gap.w, y: gap.y }); continue; }
      if (/^\d+$/.test(w[i]) || w[i] in SO) {   // gom các chữ số liền nhau: "hai mươi mốt"
        var ws = [];
        while (i < w.length && (/^\d+$/.test(w[i]) || w[i] in SO) && !(ws.length && /^\d+$/.test(w[i]))) ws.push(w[i++]);
        var v = giaTri(ws);
        kq.push(v === null ? { w: ws.join(" "), la: true } : { w: ws.join(" "), so: v });
        continue;
      }
      kq.push({ w: w[i++], la: true });
    }
    return kq;
  }
  function giay(m) {   // "3 phút", "1 phút rưỡi", "1 phút 30 giây", "45 giây" → số giây
    var s = 0, co = false;
    for (var i = 0; i < m.length; i++) {
      if (m[i].so === undefined) continue;
      var sau = m[i + 1] && m[i + 1].y ? m[i + 1].y[0] : "";
      if (sau === "PHUT") { s += m[i].so * 60; co = true; if (m[i + 2] && m[i + 2].y && m[i + 2].y[0] === "RUOI") s += 30; }
      else if (sau === "GIAY") { s += m[i].so; co = true; }
    }
    return co ? s : 0;
  }

  /* ---------- luật: tập ý C → lệnh [việc, tham số] hoặc null ---------- */
  function luat(C, so, m) {
    function co() { for (var i = 0; i < arguments.length; i++) if (C[arguments[i]]) return true; return false; }
    function chi(ds) { for (var k in C) if (ds.indexOf(k) < 0) return false; return true; }   // C chỉ gồm các ý trong ds
    if (C.GIUP && !co("DONG", "TAT") && chi(["GIUP", "HIEN"])) return ["giup"];
    if (C.MIC) return co("TAT", "DUNG", "DONG") && chi(["MIC", "TAT", "DUNG", "DONG", "LAI"]) ? ["tatMic"] : null;
    if (C.GIO) {
      if (!chi(["GIO", "PHUT", "GIAY", "RUOI", "DUNG", "TIEP", "CHAY", "TAT", "DONG", "AN", "HIEN", "LAI", "DATLAI"].concat(so !== null ? ["SO"] : []))) return null;
      if (co("TAT", "DONG", "AN")) return ["gio", "tat"];
      if (C.DUNG) return ["gio", "dung"];
      var s = giay(m); if (s) return ["gio", s];
      if (co("TIEP", "CHAY")) return ["gio", "chay"];
      return ["gio", 0];
    }
    if (C.NHOM) return chi(["NHOM", "SO"]) ? ["nhom", so] : null;
    if (C.DAPAN) {
      if (co("AN", "TAT", "DONG")) return chi(["DAPAN", "AN", "TAT", "DONG", "ALL", "PHAN", "LAI"]) ? ["anDapAn"] : null;
      if (!chi(["DAPAN", "HIEN", "ALL", "PHAN", "SLIDE", "SO", "THU"])) return null;
      if (so !== null) return C.PHAN ? ["dapAn", so] : null;
      return ["dapAn"];
    }
    if (co("DONG", "TAT")) return chi(["DONG", "TAT", "OBJ", "MP", "GIUP", "LAI", "AN"]) ? ["dong"] : null;
    if (co("CHAY", "DUNG", "DATLAI")) return chi(["CHAY", "DUNG", "DATLAI", "MP", "LAI", "TIEP", "HIEN"]) ? ["mp", C.DATLAI ? "datLai" : C.DUNG ? "dung" : "chay"] : null;
    if (C.MP) return chi(["MP", "HIEN", "LAI", "OBJ"]) ? ["moPhong"] : null;
    if (C.GOI) return chi(["GOI", "TEN", "LEN", "SO"]) ? ["goiTen"] : null;
    if ((so !== null || C.DAU || C.CUOI) && co("SLIDE", "DEN", "CHUYEN", "THU") && !co("LUI", "TIEP"))
      return chi(["SO", "DAU", "CUOI", "SLIDE", "DEN", "CHUYEN", "THU", "HIEN"]) ? ["den", C.CUOI ? "cuoi" : C.DAU ? 1 : so] : null;
    if (C.LUI || (C.CHUYEN && C.LAI)) return chi(["LUI", "CHUYEN", "LAI", "SLIDE", "PHAN", "DEN", "HIEN"]) ? ["lui"] : null;
    if (co("TIEP", "CHUYEN")) return chi(["TIEP", "CHUYEN", "SLIDE", "PHAN", "DEN", "HIEN"])
      ? ["tiep", m.some(function (x) { return x.w === "tiếp tục"; }) ? "tt" : ""] : null;
    return null;
  }

  /* ---------- hiểu câu nói ---------- */
  var HOC = docLS("tgHoc", {}), BO = docLS("tgBo", {});   // câu cô đã dạy: khóa → lệnh; câu cô bảo "không phải lệnh"
  var RE_SUA = /^\s*((trợ giảng|trợ lý|trợ lí|robot)(\s*ơi)?[\s,]*)?(cần sửa|ghi sửa|phiếu sửa|sửa)(?=\s|:|,|$)\s*[:,]?\s*/i;
  /* trả về { lenh } (làm ngay), { hoi, khoa } (gần giống lệnh: hỏi lại), { khoa } (có ý lệnh nhưng không rõ), hoặc null (lời giảng) */
  function phanTich(cau) {
    var goc = String(cau || "").normalize("NFC").trim(), s = chuan(goc);
    if (!s) return null;
    if (RE_SUA.test(goc)) return { lenh: ["sua", goc.replace(RE_SUA, "")], khoa: "sửa" };
    var m = tach(s);
    if (!m.length) return null;
    var khoa = m.map(function (x) { return x.w; }).join(" ");
    if (HOC[khoa]) return { lenh: HOC[khoa], khoa: khoa, hoc: true };
    if (BO[khoa]) return null;
    var C = {}, la = 0, so = null, coY = false;
    m.forEach(function (x) {
      if (x.la) la++;
      else if (x.so !== undefined) { C.SO = 1; if (so === null) so = x.so; }
      else x.y.forEach(function (y) { C[y] = 1; coY = true; });
    });
    if (!coY) return null;
    var l = luat(C, so, m);
    if (l && la === 0) return { lenh: l, khoa: khoa };
    if (l && la === 1 && m.length <= 6 && l[1] !== 0 && l[1] !== null) return { hoi: l, khoa: khoa };   // lệnh thiếu số (đếm ngược, chia nhóm) thì không hỏi
    return la <= 1 && m.length <= 6 ? { khoa: khoa } : null;
  }
  function hieu(cau) { var p = phanTich(cau); return p && p.lenh ? p.lenh : null; }
  function tenLenh(l) {
    var a = l[1];
    return { tiep: "chuyển slide tiếp", lui: "lùi về slide trước", den: a === "cuoi" ? "đến slide cuối" : "đến slide " + a,
      dapAn: a ? "hiện đáp án câu " + a : "hiện đáp án", anDapAn: "ẩn đáp án", goiTen: "gọi tên ngẫu nhiên", moPhong: "mở mô phỏng",
      dong: "đóng khung đang mở", nhom: "chia " + a + " nhóm", tatMic: "tắt micro", giup: "xem bảng lệnh", sua: "mở phiếu Sửa",
      gio: a === "tat" ? "tắt đồng hồ" : a === "dung" ? "tạm dừng đồng hồ" : a === "chay" ? "chạy tiếp đồng hồ" : "đếm ngược " + dongHo(a),
      mp: { chay: "bấm Chạy", dung: "bấm Dừng", datLai: "bấm Đặt lại" }[a] }[l[0]] || l[0];
  }
  function dongHo(s) { s = +s || 0; return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }

  /* ---------- đồng hồ đếm ngược ---------- */
  var GIO = { con: 0, tm: null, el: null };
  function veGio() {
    var s = Math.max(0, GIO.con);
    GIO.el.textContent = s ? (GIO.tm ? "⏱ " : "⏸ ") + dongHo(s) : "⏰ Hết giờ";
    GIO.el.className = s === 0 ? "het" : s <= 10 ? "gan" : "";
  }
  function chuong() {
    try {
      var A = new (window.AudioContext || window.webkitAudioContext)();
      [0, .45, .9].forEach(function (t) {
        var o = A.createOscillator(), g = A.createGain(); o.frequency.value = 880;
        g.gain.setValueAtTime(.25, A.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, A.currentTime + t + .4);
        o.connect(g); g.connect(A.destination); o.start(A.currentTime + t); o.stop(A.currentTime + t + .4);
      });
    } catch (e) {}
  }
  function chayGio() {
    if (GIO.tm) return;
    GIO.tm = setInterval(function () { GIO.con--; if (GIO.con <= 0) { GIO.con = 0; dungGio(); chuong(); return; } veGio(); }, 1000);
    veGio();
  }
  function dungGio() { if (GIO.tm) { clearInterval(GIO.tm); GIO.tm = null; } if (GIO.el) veGio(); }
  function tatGio() { dungGio(); GIO.con = 0; if (GIO.el) GIO.el.hidden = true; }
  function batGio(s) {
    dungGio();
    if (!GIO.el) {
      GIO.el = document.createElement("div"); GIO.el.id = "tgGio"; GIO.el.setAttribute("role", "timer"); GIO.el.setAttribute("data-im", "1");
      GIO.el.title = "Bấm: tạm dừng / chạy tiếp. Hết giờ thì bấm để ẩn";
      GIO.el.onclick = function () { if (GIO.tm) dungGio(); else if (GIO.con > 0) chayGio(); else tatGio(); };
      document.body.appendChild(GIO.el);
    }
    GIO.con = s; GIO.el.hidden = false; chayGio();
  }
  function gioDangHien() { return !!(GIO.el && !GIO.el.hidden); }

  /* ---------- các việc ---------- */
  var MAU_CHAY = [/^(▶|⏵)?\s*(chạy tiếp|tiếp tục)\b/, /^(▶|⏵)?\s*(chạy|thả|bắt đầu|phát|bắn)\b/],
    MAU = {
      chay: MAU_CHAY,
      dung: [/^(⏸|■)?\s*(tạm dừng|dừng|ngừng)\b/, /^⏸$/],
      datLai: [/^(↺|⟲|↻|⟳)?\s*(đặt lại|làm lại|bắt đầu lại|chơi lại|chạy lại|reset)\b/, /^(↺|⟲)$/]
    },
    MAU_DA = [/^(👁 )?(hien|xem|mo) (tat ca )?(dap an|loi giai|ket qua)/, /^(dap an|loi giai)$/],
    MAU_KT = [/^(✓ )?kiem tra( dap an| ket qua)?$/];
  function veSlide() { if (mpMo()) MP.dong(); if (document.querySelector(".hl-ov")) phim("Escape"); }
  var VIEC = {
    tiep: function (a) {
      if (a === "tt" && mpMo()) {   // "Tiếp tục" khi mô phỏng đang dừng: cho chạy tiếp, không chuyển slide
        var b = timNut([MAU_CHAY[0]], hopMP(), true);
        if (b) { b.click(); return "Chạy tiếp mô phỏng"; }
      }
      veSlide(); phim("ArrowRight"); return "Slide tiếp";
    },
    lui: function () { veSlide(); phim("ArrowLeft"); return "Slide trước"; },
    den: function (n) {
      var go_ = window.go, tong = null, c = null;
      try { tong = slides.length; c = cur; } catch (e) {}
      var toc = document.querySelectorAll('.bg-toc [data-g="goto"]'), bw = document.getElementById("bgwrap");   // bài giảng K12 (ôn tập chương)
      if ((typeof go_ !== "function" || typeof c !== "number" || !tong) && toc.length && bw && bw.offsetParent) {
        if (n === "cuoi") n = toc.length; if (n < 1 || n > toc.length) return "!Bài này có " + toc.length + " slide";
        toc[n - 1].click(); var tc = document.querySelector(".bg-toc"); if (tc) tc.hidden = true;
        return "Slide " + n + " / " + toc.length;
      }
      if (typeof go_ !== "function" || typeof c !== "number" || !tong) return "!Trang này không chuyển theo số slide được, cô nói “Chuyển” hoặc “Lùi”";
      if (n === "cuoi") n = tong; if (n < 1 || n > tong) return "!Bài này chỉ có " + tong + " slide";
      veSlide(); go_(n - 1); return "Slide " + n + " / " + tong;
    },
    dapAn: function (n) {
      var goc = hopMP() || undefined;   // mô phỏng đang mở: chỉ tìm trong khung mô phỏng
      if (n) {   // "Đáp án câu 2": chỉ mở đáp án của câu đó
        var ds = cacNut(MAU_DA, goc).concat(oTrong(false), cacNut(MAU_KT, goc)).filter(function (x) { return thuocCau(x, n); });
        if (!ds.length) return "!Không thấy nút đáp án của câu " + n + " trên màn hình";
        ds[0].click(); return "Hiện đáp án câu " + n;
      }
      var b = timNut(MAU_DA, goc);
      if (!b) {
        if (timNut([/^(👁 )?an (tat ca )?(dap an|loi giai)/], goc)) return "!Đáp án đang hiện rồi";
        var o = oTrong(false);   // ô “?” bấm vào mới hiện đáp án (bài giảng K12)
        if (o.length) { o.forEach(function (x) { x.click(); }); return "Hiện " + o.length + " ô đáp án"; }
        var kt = timNut(MAU_KT, goc);   // câu trắc nghiệm, Đúng/Sai: bấm Kiểm tra để hiện đúng sai và lời giải
        if (kt) { kt.click(); return "Bấm “Kiểm tra”"; }
        var buoc = cacTrang().some(function (d) { return d.querySelector(".slide.on .step:not(.show),.bg-s.on .bg-step:not(.vis)"); });
        return "!Màn hình này không có nút Đáp án" + (buoc ? ". Cô nói “Chuyển” để hiện bước tiếp" : "");
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
    nhom: function (n) {   // dùng công cụ 👥 Lớp của bài giảng
      var hn = document.getElementById("hl-nut");
      if (!hn) return "!Trang này chưa có công cụ Chia nhóm";
      if (!n || n < 2 || n > 8) return "!Chia được từ 2 đến 8 nhóm, ví dụ “Chia 4 nhóm”";
      if (document.querySelector(".hl-ov")) phim("Escape");
      var pan = document.getElementById("hl-pan");
      if (!pan || pan.hidden) hn.click();
      var s = document.getElementById("hl-sn"), b = document.querySelector('#hl-pan [data-l="nhom"]');
      if (!s || !b || b.disabled) return "!Cô chọn lớp trong 👥 Lớp trước";
      s.value = String(n); b.click();
      var x = document.querySelector('#hl-pan [data-l="dong"]'); if (x) x.click();
      return "Chia " + n + " nhóm";
    },
    gio: function (a) {
      if (a === "tat") { if (!gioDangHien()) return "!Không có đồng hồ nào đang hiện"; tatGio(); return "Tắt đồng hồ"; }
      if (a === "dung") { if (!GIO.tm) return "!Không có đồng hồ nào đang chạy"; dungGio(); return "Tạm dừng đồng hồ"; }
      if (a === "chay") { if (GIO.con <= 0) return "!Chưa có đồng hồ. Cô nói ví dụ “Đếm ngược 3 phút”"; chayGio(); return "Chạy tiếp đồng hồ"; }
      if (!a) return "!Cô nói kèm thời gian, ví dụ “Đếm ngược 3 phút” hoặc “Hẹn giờ 30 giây”";
      if (a > 3600) return "!Đếm ngược tối đa 60 phút";
      batGio(a); return "Đếm ngược " + dongHo(a);
    },
    moPhong: function () {
      var b = document.getElementById("bMP");
      if (mpMo()) return "!Mô phỏng đang mở";
      if (b && !b.hidden && hien(b)) { b.click(); return "Mở mô phỏng"; }
      b = timNut([/^(▶ )?(mo|chay|xem) mo phong/, /^mo phong/]);
      if (b) { b.click(); return "Mở mô phỏng"; }
      return "!Slide này không có mô phỏng";
    },
    mp: function (k) {   // Chạy / Dừng / Đặt lại trong mô phỏng (hoặc hoạt động đang hiện trên slide)
      var goc = hopMP() || undefined, b = timNut(MAU[k], goc, true);
      if (!b && k === "chay" && !mpMo()) { var bm = document.getElementById("bMP"); if (bm && !bm.hidden && hien(bm)) { bm.click(); return "Mở mô phỏng"; } }
      if (!b && k === "dung" && GIO.tm) { dungGio(); return "Tạm dừng đồng hồ"; }
      if (!b && k === "chay" && GIO.con > 0 && !GIO.tm) { chayGio(); return "Chạy tiếp đồng hồ"; }
      if (!b && k === "chay" && timNut(MAU.dung, goc, true)) return "Mô phỏng đang chạy rồi";   // nút bật/tắt: đang hiện ⏸ nghĩa là đang chạy
      if (!b && k === "dung" && timNut(MAU_CHAY, goc, true)) return "Mô phỏng đang dừng rồi";
      if (!b) return "!Không thấy nút " + { chay: "Chạy", dung: "Dừng", datLai: "Đặt lại" }[k] + " trên màn hình";
      var ten = String(b.textContent).trim().slice(0, 24);
      b.click(); return "Bấm “" + ten + "”";
    },
    dong: function () {
      if (hop) { dongHop(); return "Đóng bảng lệnh"; }
      try { if (window.HSDH_SUA && HSDH_SUA.dangMo()) { HSDH_SUA.dong(); return "Đóng phiếu Sửa"; } } catch (e) {}
      if (mpMo()) { MP.dong(); return "Đóng mô phỏng"; }
      if (gioDangHien() && !GIO.tm) { tatGio(); return "Tắt đồng hồ"; }
      var b = timNut([/^(dong|✕|×|x)$/, /^dong /]);
      if (document.querySelector(".hl-ov") || !b) { phim("Escape"); return "Đóng"; }
      b.click(); return "Đóng";
    },
    sua: function (yc) {
      if (!window.HSDH_SUA) return "!Chưa bật nút ✎ Sửa trên trang này";
      HSDH_SUA.mo(yc); return "Mở phiếu Sửa: cô đọc lại rồi bấm Gửi";
    },
    tatMic: function () { setTimeout(tat, 0); return "Tắt micro"; },
    giup: function () { moHop(); return "Bảng lệnh"; }
  };

  /* ---------- giao diện ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#tgNut{position:fixed;left:10px;bottom:64px;z-index:2147483000;font:600 14px system-ui,sans-serif;padding:7px 12px;border-radius:20px;border:1px solid #1d4ed8;background:#eff6ff;color:#1e3a8a;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2);opacity:.8;user-select:none;touch-action:none}" +
    "#tgNut:hover{opacity:1}#tgNut.on{background:#dc2626;border-color:#dc2626;color:#fff;opacity:1;animation:tgTho 1.6s infinite}" +
    "@keyframes tgTho{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}" +
    "#tgChat{position:fixed;z-index:2147483002;width:min(340px,calc(100vw - 20px));display:flex;flex-direction:column;gap:6px;font:14px/1.4 system-ui,sans-serif;pointer-events:none}" +
    "#tgChat .m{background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:12px 12px 12px 3px;padding:7px 11px;box-shadow:0 3px 12px rgba(0,0,0,.2);transition:opacity .4s;pointer-events:auto}" +
    "#tgChat .m.ok{background:#ecfdf5;border-color:#86efac;color:#14532d;padding:4px 10px;font-weight:600;font-size:13px;align-self:flex-start}" +
    "#tgChat .m.loi{background:#fff7ed;border-color:#fdba74;color:#7c2d12}#tgChat .m.hoi{border:2px solid #1d4ed8}" +
    "#tgChat .n{display:block;font-size:12px;color:#6b7280}#tgChat .r{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}" +
    "#tgChat button,#tgHop button,#tgHop select{font:600 13px system-ui,sans-serif;padding:5px 12px;border-radius:6px;border:1px solid #d1d5db;background:#f3f4f6;color:#111;cursor:pointer}" +
    "#tgChat button.c{background:#1d4ed8;border-color:#1d4ed8;color:#fff}" +
    "#tgHop{position:fixed;left:10px;bottom:110px;z-index:2147483001;width:min(440px,calc(100vw - 20px));max-height:calc(100vh - 130px);overflow:auto;font:14px/1.45 system-ui,sans-serif;background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:12px 14px;box-sizing:border-box}" +
    "#tgHop table{border-collapse:collapse;width:100%;margin:6px 0}#tgHop td{padding:4px 6px;border-top:1px solid #e5e7eb;vertical-align:top}#tgHop td:first-child{font-weight:700;color:#1e3a8a;white-space:nowrap}" +
    "#tgHop h4{margin:12px 0 4px;font-size:14px}#tgHop .gc{font-size:12px;color:#6b7280}#tgHop .dong{float:right}#tgHop select{padding:2px 4px;font-weight:400;max-width:150px}" +
    "#tgGio{position:fixed;top:10px;right:14px;z-index:2147483000;font:700 34px/1 system-ui,sans-serif;background:#fff;color:#14213d;border:3px solid #1d4ed8;border-radius:14px;padding:6px 16px;box-shadow:0 2px 12px #0005;cursor:pointer;font-variant-numeric:tabular-nums}" +
    "#tgGio[hidden]{display:none}#tgGio.gan{border-color:#f59e0b;color:#b45309}#tgGio.het{border-color:#dc2626;color:#fff;background:#dc2626;animation:tgNhay 1s infinite}@keyframes tgNhay{50%{opacity:.55}}" +
    "@media print{#tgNut,#tgChat,#tgHop,#tgGio{display:none!important}}";
  document.head.appendChild(css);

  /* ô chat cạnh nút 🎤: báo đã làm (xanh, ngắn), báo lỗi (cam), hỏi lại (viền xanh, có nút) */
  var chat = null;
  function datChat() {
    if (!chat) return;
    var r = nut.getBoundingClientRect(), w = chat.offsetWidth, h = chat.offsetHeight;
    chat.style.left = Math.max(10, Math.min(r.left, window.innerWidth - w - 10)) + "px";
    chat.style.top = (r.top - h - 8 >= 0 ? r.top - h - 8 : r.bottom + 8) + "px";
  }
  function nhan(noiDung, phu, kieu, giu) {   // thêm một tin vào ô chat; trả về phần tử tin
    if (!chat) { chat = document.createElement("div"); chat.id = "tgChat"; chat.setAttribute("role", "status"); document.body.appendChild(chat); }
    var t = document.createElement("div"); t.className = "m " + (kieu || "");
    var a = document.createElement("span"); a.textContent = noiDung; t.appendChild(a);
    if (phu) { var b = document.createElement("span"); b.className = "n"; b.textContent = phu; t.appendChild(b); }
    chat.appendChild(t);
    while (chat.children.length > 3) chat.removeChild(chat.firstChild);
    datChat();
    if (!giu) setTimeout(function () { boTin(t); }, kieu === "ok" ? 1800 : 4500);
    return t;
  }
  function boTin(t) { if (!t || !t.parentNode) return; t.style.opacity = "0"; setTimeout(function () { if (t.parentNode) t.remove(); datChat(); }, 400); }
  function thongBao(chinh, phu, loi) { nhan(chinh, phu, loi ? "loi" : ""); }

  /* hỏi lại khi câu nói gần giống lệnh */
  var hoi = null, lanHoi = 0;
  function moiHoi(p, cau) {
    dongHoi();
    var t = nhan("🤖 Cô vừa nói “" + cau + "”. Cô muốn " + tenLenh(p.hoi) + "?", "Nói “Đúng” hoặc “Không”. Robot sẽ nhớ cách nói này.", "hoi", true);
    var r = document.createElement("div"); r.className = "r";
    r.innerHTML = '<button type="button" class="c" data-k="co">✓ Đúng</button><button type="button" data-k="khong">✕ Không</button>';
    t.appendChild(r); datChat();
    r.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) traLoi(b.getAttribute("data-k") === "co"); });
    hoi = { p: p, cau: cau, el: t, tq: setTimeout(function () { dongHoi(); }, 9000) };
    lanHoi = Date.now();
  }
  function dongHoi() { if (!hoi) return; clearTimeout(hoi.tq); boTin(hoi.el); hoi = null; }
  function traLoi(dong) {
    if (!hoi) return; var h = hoi; dongHoi();
    if (dong) { HOC[h.p.khoa] = h.p.hoi; delete BO[h.p.khoa]; ghiLS("tgHoc", HOC); ghiLS("tgBo", BO); chayLenh(h.p.hoi, h.cau, "đã nhớ", h.p.khoa); }
    else { BO[h.p.khoa] = 1; ghiLS("tgBo", BO); ghiNK(h.cau, "không phải lệnh", h.p.khoa); nhan("Dạ, robot sẽ không hỏi câu này nữa", "", "ok"); }
  }
  var RE_CO = /^(có|đúng|ừ|ừm|phải|được|đồng ý|chuẩn|vâng|dạ|ok|ô kê|oke)( rồi| đó| đúng rồi| làm đi| đi| luôn)?$/,
    RE_KHONG = /^(không|sai|nhầm|thôi|bỏ qua|không phải|không cần|hủy|huỷ|không đúng)( rồi| đâu| đi)?$/;

  /* nhật kí lệnh: chỉ câu giống lệnh, lưu trên máy này, tối đa 40 dòng */
  function ghiNK(cau, kq, khoa) {
    var nk = docLS("tgNhatKi", []), d = new Date();
    nk.push({ g: d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2), c: String(cau).slice(0, 80), k: kq, khoa: khoa || "" });
    ghiLS("tgNhatKi", nk.slice(-40));
  }

  var hop = null;
  var LENH_DAY = [["tiep", "Chuyển slide tiếp"], ["lui", "Lùi slide"], ["dapAn", "Hiện đáp án"], ["anDapAn", "Ẩn đáp án"], ["moPhong", "Mở mô phỏng"],
    ["mp:chay", "Chạy mô phỏng"], ["mp:dung", "Dừng mô phỏng"], ["mp:datLai", "Đặt lại mô phỏng"], ["goiTen", "Gọi tên"], ["dong", "Đóng"],
    ["gio:dung", "Dừng đồng hồ"], ["gio:tat", "Tắt đồng hồ"], ["tatMic", "Tắt micro"], ["giup", "Trợ giúp"], ["-", "Không phải lệnh"]];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dongHop() { if (hop) hop.remove(); hop = null; }
  function moHop() {
    dongHop();
    hop = document.createElement("div"); hop.id = "tgHop";
    var nk = docLS("tgNhatKi", []).slice(-12).reverse(), daDay = Object.keys(HOC);
    var chon = '<option value="">Dạy robot…</option>' + LENH_DAY.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + "</option>"; }).join("");
    hop.innerHTML = '<button type="button" class="dong">Đóng</button><div style="font-weight:700;font-size:15px">🎤 Lệnh giọng nói</div>' +
      '<div class="gc">Bấm 🎤 để bắt đầu nghe, bấm lần nữa để tắt. Cô nói tự nhiên được, ví dụ “Chúng ta qua slide tiếp theo”. Câu có chữ khác (lời giảng) robot bỏ qua; câu gần giống lệnh thì robot hỏi lại trong ô chat.</div><table>' +
      [["Chuyển", "“Tiếp”, “Tiếp tục nhé”, “Chúng ta qua slide tiếp theo”"], ["Lùi", "“Quay lại”, “Lùi về slide trước”"],
       ["Đến slide", "“Slide 5”, “Chuyển đến slide mười hai”, “Về đầu”, “Slide cuối”"],
       ["Đáp án", "“Đáp án”, “Cho cả lớp xem lời giải”, “Đáp án câu 2”, “Ẩn đáp án”"],
       ["Mô phỏng", "“Mở mô phỏng”; khi đang mở: “Chạy”, “Dừng”, “Đặt lại”, “Tiếp tục”"],
       ["Gọi tên", "“Gọi tên”, “Gọi một bạn lên bảng”; “Chia 4 nhóm”"],
       ["Đếm ngược", "“Đếm ngược 3 phút”, “Hẹn giờ 1 phút rưỡi”, “Dừng giờ”, “Tắt đồng hồ”"],
       ["Đóng", "“Đóng”, “Tắt”, “Kết thúc”: đóng mô phỏng, khung gọi tên, phiếu…"],
       ["Sửa …", "“Sửa đáp án câu 3 là B”: mở phiếu ✎ Sửa đã điền sẵn, cô đọc lại rồi bấm Gửi"],
       ["Tắt micro", "“Tắt micro”, “Ngừng nghe”"], ["Trợ giúp", "hiện bảng này"]]
        .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</table>" +
      (nk.length ? "<h4>Câu robot nghe gần đây</h4><div class='gc'>Câu nào robot hiểu sai hoặc chưa làm, cô chọn lệnh đúng để dạy robot.</div><table>" +
        nk.map(function (x, i) {
          return "<tr><td>" + esc(x.g) + "</td><td>“" + esc(x.c) + "”<br><span class='gc'>" + esc(x.k) + "</span></td><td>" +
            (x.khoa && x.khoa !== "sửa" ? '<select data-khoa="' + esc(x.khoa) + '">' + chon + "</select>" : "") + "</td></tr>";
        }).join("") + "</table><button type='button' data-x='nk'>Xóa nhật kí</button>" : "") +
      (daDay.length ? "<h4>Câu cô đã dạy robot</h4><table>" + daDay.map(function (k) {
          return "<tr><td>“" + esc(k) + "”</td><td>" + esc(tenLenh(HOC[k])) + "</td><td><button type='button' data-quen='" + esc(k) + "'>Quên</button></td></tr>";
        }).join("") + "</table>" : "") +
      '<div class="gc" style="margin-top:8px">Cần Chrome hoặc Edge và có mạng. Giọng nói được trình duyệt chuyển thành chữ, robot không nói, chỉ trả lời trong ô chat. Nhật kí chỉ lưu câu giống lệnh, trên máy này. Không đọc tên, điểm học sinh vào micro.</div>';
    hop.querySelector(".dong").onclick = dongHop;
    hop.addEventListener("change", function (e) {
      var s = e.target.closest("select[data-khoa]"); if (!s || !s.value) return;
      var k = s.getAttribute("data-khoa"), v = s.value.split(":");
      if (v[0] === "-") { BO[k] = 1; delete HOC[k]; } else { HOC[k] = v[1] ? [v[0], v[1]] : [v[0]]; delete BO[k]; }
      ghiLS("tgHoc", HOC); ghiLS("tgBo", BO); moHop();
    });
    hop.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.getAttribute("data-x") === "nk") { ghiLS("tgNhatKi", []); moHop(); }
      var q = b.getAttribute("data-quen"); if (q) { delete HOC[q]; ghiLS("tgHoc", HOC); moHop(); }
    });
    document.body.appendChild(hop);
  }

  var nut = document.createElement("button");
  nut.id = "tgNut"; nut.type = "button"; nut.textContent = "🎤"; nut.setAttribute("data-im", "1");
  nut.title = "Trợ giảng giọng nói: bấm để bắt đầu / dừng nghe lệnh (Chuyển, Đáp án, Gọi tên, Mô phỏng, Đếm ngược, Đóng, Sửa…)";
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
    keo = true; vt0 = dat(bd.x + e.clientX - bd.px, bd.y + e.clientY - bd.py); datChat();
  });
  nut.addEventListener("pointerup", function () { if (keo && vt0) { try { localStorage.setItem("tgViTri", JSON.stringify(vt0)); } catch (e) {} } bd = null; });
  nut.addEventListener("pointercancel", function () { bd = null; });
  nut.addEventListener("click", function () {
    if (keo) { keo = false; return; }
    if (dangNghe) tat(); else bat();
  });

  /* ---------- nghe ---------- */
  var mic = null, dangNghe = false, choLenh = null;   // choLenh: hàm nhận câu nói một lần (đọc chính tả vào phiếu Sửa)
  function chayLenh(l, cau, ghiChu, khoa) {
    var kq;
    try { kq = VIEC[l[0]](l[1]); } catch (e) { kq = "!Lỗi khi làm lệnh: " + e.message; }
    if (typeof kq !== "string") return;
    if (kq.charAt(0) === "!") { nhan(kq.slice(1), "“" + cau + "”", "loi"); ghiNK(cau, "✗ " + kq.slice(1), khoa); }
    else { nhan("✓ " + kq + (ghiChu ? " (" + ghiChu + ")" : ""), "", "ok"); ghiNK(cau, "✓ " + kq, khoa); }
  }
  function lam(cau, p) {
    if (choLenh) { var f = choLenh; choLenh = null; f(cau); return; }
    if (hoi) {   // đang hỏi lại: nghe “Đúng” / “Không”
      var s = chuan(cau).replace(/^(trợ giảng|trợ lý|robot)( ơi)?\s*/, "").replace(/^(cô|cô nói)\s+/, "");
      if (RE_CO.test(s)) { traLoi(true); return; }
      if (RE_KHONG.test(s)) { traLoi(false); return; }
    }
    p = p || phanTich(cau);
    if (!p) return;   // lời giảng: im lặng
    if (p.lenh) { dongHoi(); chayLenh(p.lenh, cau, "", p.lenh[0] === "sua" ? "" : p.khoa); return; }
    if (p.hoi) { if (!hoi && Date.now() - lanHoi > 4000) moiHoi(p, cau); ghiNK(cau, "hỏi: " + tenLenh(p.hoi) + "?", p.khoa); return; }
    ghiNK(cau, "chưa hiểu", p.khoa);
  }
  function taoMic() {
    var r = new SR();
    r.lang = "vi-VN"; r.continuous = true; r.interimResults = false; r.maxAlternatives = 3;
    r.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        var kq = e.results[i], cau = kq[0].transcript.trim(), p = null;
        if (!choLenh && !hoi) {   // chọn cách nghe hợp lệnh nhất trong các phương án của trình duyệt
          var ds = [];
          for (var j = 0; j < kq.length; j++) { var c = kq[j].transcript.trim(); if (c) ds.push({ c: c, p: phanTich(c) }); }
          var tot = ds.filter(function (x) { return x.p && x.p.lenh; })[0] || ds.filter(function (x) { return x.p && x.p.hoi; })[0] || ds[0];
          if (tot) { cau = tot.c; p = tot.p; }
        }
        if (cau) lam(cau, p);
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
    mic = mic || taoMic(); dangNghe = true;
    try { mic.start(); } catch (e) {}
    nut.classList.add("on"); nut.textContent = "🎤 Đang nghe";
    var daXem = false; try { daXem = localStorage.getItem("tgDaXem") === "1"; localStorage.setItem("tgDaXem", "1"); } catch (e) {}
    if (!daXem) moHop(); else nhan("🎤 Robot đang nghe lệnh", "Cô cứ giảng bình thường, robot chỉ làm khi nghe lệnh", "ok");
  }
  function tat() {
    dangNghe = false; choLenh = null; dongHoi();
    try { mic && mic.stop(); } catch (e) {}
    nut.classList.remove("on"); nut.textContent = "🎤";
    nhan("Đã tắt micro", "", "ok");
  }

  /* API: hieu/phanTich để kiểm tra (tools/kiem_tro_giang.js); docMotCau cho nút Sửa: đọc chính tả một câu (bật micro nếu đang tắt) */
  window.TroGiang = {
    hieu: hieu,
    phanTich: phanTich,
    lam: lam,
    docMotCau: function (cb) {
      if (!SR) { thongBao("Trình duyệt này không nghe được giọng nói", "Mở trang bằng Chrome hoặc Edge", true); return false; }
      var tuTat = !dangNghe;
      choLenh = function (cau) { cb(cau); if (tuTat) tat(); };
      if (!dangNghe) { mic = mic || taoMic(); dangNghe = true; try { mic.start(); } catch (e) {} nut.classList.add("on"); nut.textContent = "🎤 Đang nghe"; }
      nhan("🎤 Cô nói nội dung cần sửa…", "", "", false);
      return true;
    }
  };

  function gan() { document.body.appendChild(nut); if (vt0) dat(vt0.x, vt0.y); }
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
  window.addEventListener("resize", datChat);
})();
