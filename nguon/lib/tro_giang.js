/* TRỢ GIẢNG GIỌNG NÓI trên trang bài giảng, ôn tập: giáo viên nói lệnh, trang tự làm. Robot KHÔNG nói, chỉ trả lời bằng ô chat nhỏ cạnh nút 🎤.
   Hiểu lệnh theo NGHĨA, nói tự nhiên được: "Chuyển", "Chúng ta qua slide tiếp theo", "Tiếp tục nhé", "Kết thúc"...
     - bỏ từ đệm (chúng ta, các em, nhé, nào, bây giờ, trợ giảng ơi...), còn lại tách thành ý: TIẾP, LÙI, SLIDE, SỐ, ĐÁP ÁN, MÔ PHỎNG...
     - câu chỉ gồm các ý của một lệnh thì làm ngay; câu có chữ lạ ("Chuyển ĐỘNG thẳng đều", "ĐÚNG rồi") là lời giảng, bỏ qua.
       So khớp CÓ DẤU: "đúng", "động", "đồng" không phải "đóng"; các cụm Vật lí (chuyển động, tiếp tuyến, tắt dần...) chặn sẵn.
     - câu GẦN giống lệnh (thừa đúng một chữ lạ, ví dụ "Quay lại bài trước") thì robot HỎI trong ô chat: cô bấm/nói "Đúng" hoặc "Không".
       Robot nhớ câu trả lời trên máy này (localStorage tgHoc / tgBo): lần sau nói vậy là làm ngay, hoặc không hỏi nữa.
   Lệnh: Chuyển / Lùi / Slide 5 / Về đầu / Slide cuối · Đáp án (câu 2) / Ẩn đáp án · Mô phỏng; trong mô phỏng: Chạy, Dừng, Đặt lại
         · Gọi tên · Chia 4 nhóm · Đếm ngược 3 phút, Dừng giờ, Tắt đồng hồ · Đóng / Kết thúc · Sửa <yêu cầu> · Tắt micro · Trợ giúp
         · TRA CỨU (giai đoạn 4, không AI): “Công thức định luật 2 Newton”, “Nhắc lại bài 13”, “Dạng bài đẳng áp”, “Lỗi hay mắc”, “Câu hỏi nhanh” → “Đáp án”, “Câu khác”.
           Trả lời ở ô chat; nút ⤢ Mở lớn (hoặc nói “Phóng to”) mở khung lớn để chiếu. Tra bài đang giảng (theo tên trang) → chương → cả hồ sơ.
           Dữ liệu: nguon/lib/tro_giang_du_lieu.js, TỰ TẠO từ nguon/data bằng tools/tao_tra_cuu.js (dong_goi.js tự gọi); chỉ tải khi cô hỏi lần đầu.
   - Nút 🎤 chỉ hiện trên máy đã bật nút Sửa (mở trang một lần với ?sua), học sinh không thấy. Bấm 🎤 bắt đầu / dừng nghe; kéo được.
   - Nhận giọng nói bằng Web Speech API của trình duyệt (Chrome, Edge; cần mạng). Nhật kí lệnh (tgNhatKi) chỉ ghi câu giống lệnh, chỉ trên máy này.
   - LỚP ỒN (xem mục "micro" và "tách đoạn" phía dưới):
       · Chrome 139+ nhận giọng từ luồng micro đã LỌC ỒN, KHỬ TIẾNG VỌNG loa, tự chỉnh độ nhạy (getUserMedia → start(track)); vạch vàng dưới nút 🎤 là độ to
         micro nghe được. Trình duyệt cũ hoặc cô chọn "Micro thường" (tgLoc = 0) thì dùng micro của trình duyệt như trước.
       · Lớp ồn, trình duyệt không nhận ra cô đã ngừng nói nên lệnh dính vào lời giảng thành câu dài: robot ghi lúc từng chữ hiện ra,
         đoạn sau chỗ ngừng (≥ NGUNG ms) được xét như câu riêng ("… xong phần một | chuyển slide").
       · Tiếng gọi “Niu ơi” (không bắt buộc): lệnh ngay sau tiếng gọi được làm dù trước, sau có lời giảng, tiếng ồn ("… chú ý Niu ơi chuyển slide, ồn ào …").
       · Các từ trình duyệt hay nghe sai ("đáp ăn", "mô phòng", "típ theo"…) và tiếng ngập ngừng ("ờ", "ừm") đã có trong từ điển.
       · Mất mạng thì tự nghe lại (chờ lâu dần); trình duyệt im quá 25 giây thì khởi động lại phiên nghe.
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
  var CUA_TOI = "#tgNut,#tgChat,#tgHop,#tgGio,#tgLon,#nsNut,#nsHop,#hl-nut";
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
    _: "trợ giảng|trợ lý|trợ lí|robot|rô bốt|rô bô|niu|ơi|em ơi|bạn ơi|chúng ta|chúng mình|bọn mình|mình|ta|các em|các bạn|cả lớp|lớp mình|lớp|cô|thầy|" +
       "bây giờ|giờ thì|giờ|rồi|sẽ|hãy|cùng|cùng nhau|nhé|nhá|nha|nhen|nào|đi|ạ|à|nhỉ|luôn|giúp cô|cho cô|giúp mình|cho mình|giúp tôi|cho tôi|tôi|" +
       "ok|okay|oke|ô kê|được rồi|vậy|vậy thì|thì|nhanh|ngay|với|cái|này|đó|kia|của|để|thôi|làm ơn|xin|vui lòng|nữa|thành|ra|cho|tiếp đây|của bài|của bài học|trong bài|bài học|của bài này|" +
       "ờ|ờm|ừm|ơ|hừm|um|uhm|ấy|đấy|ha|níu|nìu",   // tiếng ngập ngừng; "níu", "nìu": trình duyệt nghe sai "Niu"
    NOI: "chuyển động|chuyển hóa|chuyển hoá|chuyển đổi|chuyển dời|chuyển thể|dịch chuyển|di chuyển|động năng|tiếp tuyến|tiếp xúc|tiếp điểm|nối tiếp|" +
       "trực tiếp|gián tiếp|tắt dần|gọi là|được gọi|mở rộng|đóng góp|đóng vai|đóng mạch|đóng khóa|đóng khoá|đóng công tắc|mở công tắc|ngắt mạch|" +
       "đi qua|đi sang|truyền qua|xuyên qua|sang trái|sang phải|qua trái|qua phải|phía trước|phía sau|đằng trước|đằng sau|trước tiên|trước đó|trước khi|" +
       "sau đó|sau khi|ban đầu|lúc đầu|điểm đầu|điểm cuối|vị trí đầu|hai đầu|một đầu|đầu dây|đầu mút|chú ý|về nhà|bài về nhà|giờ học|số liệu|số đo|" +
       "sai số|lần đo|thời gian|đồng hồ bấm giây|đồng hồ đo|lùi xe|xe lùi|kết quả đo|quay đều|quay tròn|bật đèn|tắt đèn",
    /* sau mỗi dòng: các cách trình duyệt hay NGHE SAI (lớp ồn, nói nhanh); câu vẫn phải chỉ gồm chữ của lệnh mới làm */
    TIEP: "tiếp|tiếp theo|tiếp tục|kế|kế tiếp|kế tiếp theo|next|sau|chuyển tiếp|tiếp nữa|sau nữa|" + "típ|típ theo|tiệp theo|tiết theo|néc|nếch",
    CHUYEN: "chuyển|sang|qua|chuyển sang|chuyển qua|lật|lật sang|lật qua|lướt|lướt qua|" + "chuyền|chuyễn|chuyền sang|chuyền qua",
    DEN: "đến|tới|về|đi đến|đi tới|nhảy|nhảy đến|nhảy tới|nhảy sang|nhảy về",
    LUI: "lùi|lui|quay lại|trở lại|quay về|trở về|lùi lại|back|trước|lúc nãy|vừa rồi|vừa nãy|ban nãy",
    LAI: "lại",
    SLIDE: "slide|slides|slai|xlai|sờ lai|sờ lai đờ|trang|trang chiếu|trang trình chiếu|màn hình|bản chiếu|" + "sờ lái|sờ lay|slay|slice",
    PHAN: "bước|phần|mục|ý|câu|câu hỏi|nội dung|hình",
    THU: "thứ|số",
    DAU: "đầu|đầu tiên|mở đầu",
    CUOI: "cuối|cuối cùng",
    DAPAN: "đáp án|lời giải|kết quả|đáp số|giải đáp|cách giải|bài giải|đáp án đúng|" + "đáp ăn|đáp an|đắp án|đạp án|đáp áng|đáp ám|đáp ánh",
    HIEN: "hiện|hiện ra|xem|mở|mở ra|cho xem|coi|hiển thị|bật|bật lên|chiếu|công bố|show|nhìn",
    AN: "ẩn|giấu|che|ẩn đi|giấu đi|cất",
    TAT: "tắt",
    DONG: "đóng|đóng lại|thoát|thoát ra|kết thúc|dẹp",
    OBJ: "cửa sổ|khung|bảng|phiếu|hộp|thẻ",
    MP: "mô phỏng|thí nghiệm ảo|thí nghiệm|mô hình|thí nghiệm mô phỏng|" + "mô phòng|mô phong|mô phổng|mô phõng",
    CHAY: "chạy|bắt đầu|thả|phát|play|chạy thử|cho chạy|chạy tiếp",
    DUNG: "dừng|tạm dừng|ngừng|dừng lại|pause|tạm ngừng",
    DATLAI: "đặt lại|làm lại|reset|bắt đầu lại|chạy lại|chơi lại|khởi động lại|" + "đặc lại|đặt lai",
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
  var RE_SUA = /^\s*((trợ giảng|trợ lý|trợ lí|robot|niu|níu)(\s*ơi)?[\s,]*)?(cần sửa|ghi sửa|phiếu sửa|sửa)(?=\s|:|,|$)\s*[:,]?\s*/i;
  /* TRA CỨU (giai đoạn 4): câu MỞ ĐẦU bằng từ khóa tra cứu → ["tra", loại, chủ đề]. Loại: ct công thức, kt kiến thức, db dạng bài, loi lỗi hay mắc, hn câu hỏi nhanh.
     Chỉ nhận câu ngắn; câu có "là", "bằng", "thì"... là lời giảng ("Công thức này là F bằng m a"), bỏ qua. "Các em nhắc lại…" là cô giao cho học sinh, bỏ qua. */
  var RE_GOI_TRA = /^((trợ giảng|trợ lý|trợ lí|robot|rô bốt|niu)( ơi)? )?((cô|chúng ta|mình|ta|bây giờ|giờ|cả lớp|lớp mình|cùng|hãy|cho cô|cho cả lớp|cho lớp|giúp cô) )*((xem|mở|hiện|tra|tìm|đọc|cho xem) )?((lại|các|những|toàn bộ|tất cả) )?/;
  var TRA = [
    ["hnk", /^(câu hỏi khác|câu khác|một câu hỏi khác|một câu khác|hỏi câu khác|câu hỏi nhanh khác|câu hỏi tiếp|câu tiếp)( nữa| đi| nào)*$/],   // cùng chủ đề câu vừa hỏi
    ["hn", /^(câu hỏi nhanh|hỏi nhanh|kiểm tra nhanh|câu hỏi ôn tập|câu hỏi ôn|thẻ ôn tập|thẻ ôn|thẻ nhớ|một câu hỏi|đố vui)( .*)?$/],
    ["ct", /^(công thức|biểu thức|hệ thức)( .*)?$/],
    ["db", /^(dạng bài tập|dạng bài|dạng toán|cách làm dạng|cách giải dạng|cách làm bài|phương pháp giải)( .*)?$/],
    ["loi", /^(lỗi hay mắc|lỗi thường gặp|lỗi hay gặp|lỗi thường mắc|lỗi sai|lỗi|sai lầm hay gặp|sai lầm thường gặp|sai lầm|học sinh hay sai|chỗ hay sai)( .*)?$/],
    ["kt", /^(nhắc lại|ôn lại|tóm tắt|kiến thức trọng tâm|kiến thức|tra cứu|nội dung chính|ghi nhớ)( .*)?$/]
  ];
  var RE_LON = /^((trợ giảng|robot)( ơi)? )?(phóng to|phóng lớn|mở lớn|mở to|xem lớn|mở khung lớn|khung lớn|toàn màn hình)( ra| lên| khung| cho cô)*$/;
  function phanTra(s) {   // s đã chuẩn hóa (chữ thường, có dấu)
    if (RE_LON.test(s)) return ["moLon"];
    var r = s.replace(RE_GOI_TRA, "");
    for (var i = 0; i < TRA.length; i++) {
      var m = TRA[i][1].exec(r);
      if (!m) continue;
      if (TRA[i][0] === "hnk") return ["tra", "hnk", ""];
      var chu = (" " + (m[2] || "") + " ").replace(/ (là gì|là như thế nào|như thế nào|thế nào|ra sao|đi|nhé|nha|nào|với|giúp cô|cho cô|ạ)(?= )/g, " ").replace(/\s+/g, " ").trim(), cu;
      do { cu = chu; chu = chu.replace(/^(về|của|cho|lại|kiến thức|bài học|trong|ở|khi|các|những|chính|trọng tâm)( |$)/, "").trim(); } while (chu !== cu);
      var w = (" " + chu + " ").replace(/ (cân bằng|thăng bằng|bằng nhau)(?= )/g, " ");
      if (/ (là|bằng|thì|ta có|được tính|có dạng|cho biết|nên|vì|lần nữa|câu hỏi|đề bài|các em|các bạn|em|rất|lắm|quá|không|chưa|sao) /.test(w)) return null;   // lời giảng
      if (chu.split(" ").length > (TRA[i][0] === "hn" ? 5 : 9)) return null;
      return ["tra", TRA[i][0], chu];
    }
    return null;
  }
  /* trả về { lenh } (làm ngay), { hoi, khoa } (gần giống lệnh: hỏi lại), { khoa } (có ý lệnh nhưng không rõ), hoặc null (lời giảng) */
  var QUA_NGHE_SAI = { "quà": 1, "quả": 1, "quá": 1, "quạ": 1, "wa": 1, "goa": 1, "qua à": 1, "qua ạ": 1 };   // chỉ khi cả câu chỉ có tiếng đó
  /* TIẾNG GỌI “Niu ơi” (không bắt buộc, dùng khi lớp ồn): lấy phần sau tiếng gọi CUỐI CÙNG trong câu, lệnh ở đầu phần đó được làm,
     chữ thừa phía sau (tiếng ồn, lời giảng tiếp) bỏ qua. "Niu tơn" không có "ơi" nên không phải tiếng gọi. */
  var RE_GOI = /(?:^|[\s,.!?;:])(?:niu|níu|nìu|new|nhiu|miu|robot|rô bốt|trợ giảng|trợ lý|trợ lí)[\s,]*ơi(?=$|[\s,.!?;:])[\s,.!?;:]*/gi;
  function sauGoi(goc) {
    var m, cuoi = -1; RE_GOI.lastIndex = 0;
    while ((m = RE_GOI.exec(goc))) cuoi = RE_GOI.lastIndex;
    return cuoi < 0 ? null : goc.slice(cuoi);
  }
  function phanTich(cau) {
    var goc = String(cau || "").normalize("NFC").trim(), p = phanTich1(goc);
    if (p && p.lenh) return p;
    var r = sauGoi(goc);
    if (r === null || !r.trim()) return p;
    var q = phanTich1(r);
    if (q && q.lenh) { q.goi = true; return q; }
    var w = chuan(r).split(" ");   // lệnh ở đầu, chữ thừa phía sau: thử từ dài đến ngắn
    for (var n = Math.min(w.length - 1, 8); n >= 1; n--) {
      var d = phanTich1(w.slice(0, n).join(" "));
      if (d && d.lenh && d.lenh[0] !== "sua") { d.goi = true; return d; }
    }
    return p || q;
  }
  function phanTich1(goc) {
    var s = chuan(goc);
    if (!s) return null;
    if (RE_SUA.test(goc)) return { lenh: ["sua", goc.replace(RE_SUA, "")], khoa: "sửa" };
    var tr = phanTra(s);
    if (tr) return { lenh: tr, khoa: "" };
    var m = tach(s);
    if (!m.length) return null;
    var khoa = m.map(function (x) { return x.w; }).join(" ");
    if (HOC[khoa]) return { lenh: HOC[khoa], khoa: khoa, hoc: true };
    if (QUA_NGHE_SAI[s]) return { lenh: ["tiep", ""], khoa: khoa };   // cô nói một tiếng "Qua", trình duyệt hay nghe ra "Quà", "Quá"…
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
      dong: "đóng khung đang mở", moLon: "mở khung lớn", tra: "tra " + ({ ct: "công thức", kt: "kiến thức", db: "dạng bài", loi: "lỗi hay mắc", hn: "câu hỏi nhanh", hnk: "câu hỏi khác" }[a] || "") + (l[2] ? " “" + l[2] + "”" : ""), nhom: "chia " + a + " nhóm", tatMic: "tắt micro", giup: "xem bảng lệnh", sua: "mở phiếu Sửa",
      gio: a === "tat" ? "tắt đồng hồ" : a === "dung" ? "tạm dừng đồng hồ" : a === "chay" ? "chạy tiếp đồng hồ" : "đếm ngược " + dongHo(a),
      mp: { chay: "bấm Chạy", dung: "bấm Dừng", datLai: "bấm Đặt lại" }[a] }[l[0]] || l[0];
  }
  function dongHo(s) { s = +s || 0; return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }

  /* ---------- TRA CỨU trong dữ liệu hồ sơ (window.TG_DL, tạo bằng tools/tao_tra_cuu.js). Thứ tự: bài đang giảng → chương → cả hồ sơ ---------- */
  var BIET_DANH = [   // cách nhận giọng nói hay viết tên riêng → tên trong sách
    [/niu ?tơn|niu tơn|niutơn|nui tơn|newtons/g, "newton"], [/bôi ?lơ|boi ?lơ|bôi lờ|bôilơ|boil\b|bôi lơ/g, "boyle"],
    [/sác ?lơ|sạc ?lơ|sắc ?lơ|saclơ|charle\b/g, "charles"], [/cla ?pê ?rôn|clapêrôn|claperon|cla pe rôn/g, "clapeyron"],
    [/ken ?vin|kenvin/g, "kelvin"], [/bơ ?rao|bờ ?rao|brao/g, "brown"], [/xen ?xi ?út|celsius|độ xê/g, "celsius"], [/pi ?ta ?go|pitago/g, "pythagore"]
  ];
  var DUNG_TRA = " của về là gì như thế nào ra sao cho tính các những một và với trong này đó ở khi thì được có cô em hôm nay dùng ta chúng ";
  function tuTra(s) {   // chữ → các từ để so (bỏ LaTeX, bỏ từ đệm, bỏ dấu)
    s = String(s || "").replace(/\\(text|mathrm)\{([^}]*)\}/g, " $2 ").replace(/\\[a-zA-Z]+/g, " ").replace(/[{}^_$\\|=+*/<>]/g, " ");
    return chuan(s).split(" ").filter(function (w) { return w && DUNG_TRA.indexOf(" " + w + " ") < 0; }).map(bo).filter(Boolean);
  }
  function chuDeTra(chu) {   // "định luật hai niu tơn bài 15 lớp 10" → { q: "định luật 2 newton", bai: 15, lop: 10, nay: false }
    var s = " " + chuan(chu) + " ", kq = { bai: null, lop: null, nay: false };
    BIET_DANH.forEach(function (x) { s = s.replace(x[0], x[1]); });
    s = s.replace(/ (luật|bài|lớp|khối|chương) ((?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|mươi|mốt|lăm|tư)(?: (?:một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mốt|lăm|tư))?)(?= )/g,
      function (a, k, so) { var v = giaTri(so.split(" ")); return v == null ? a : " " + k + " " + v; });
    s = s.replace(/ bài (này|hôm nay|đang học|đang giảng|học hôm nay)(?= )/g, function () { kq.nay = true; return " "; });
    s = s.replace(/ (lớp|khối) (\d+)(?= )/g, function (a, k, n) { kq.lop = +n; return " "; });
    s = s.replace(/ bài (?:số )?(\d+)(?= )/g, function (a, n) { kq.bai = +n; return " "; });
    s = s.replace(/ (bài|chương) (?= )/g, " ");
    kq.q = s.replace(/\s+/g, " ").trim();
    return kq;
  }
  function bangChu(m, loai) {   // các chữ của một mục: [chữ mạnh (tên), chữ thường]
    if (loai === "ct") return [m.t, m.dk + " " + m.l];
    if (loai === "db") return [m.t, m.nb + " " + m.cl];
    if (loai === "hn") return ["", m.de + " " + (m.pa || []).join(" ")];
    if (loai === "the") return [m[0], m[1]];
    return ["", m];
  }
  function cacMuc(b, loai) {   // các mục một loại trong một bài; câu hỏi nhanh = thẻ ôn + trắc nghiệm + trả lời ngắn
    if (loai === "hn") return (b.the || []).map(function (x) { return { kieu: "the", m: x }; }).concat((b.hn || []).map(function (x) { return { kieu: x.pa ? "tn" : "tln", m: x }; }));
    return (b[loai] || []).map(function (x) { return { kieu: loai, m: x }; });
  }
  function timBai(DL, so, lop) {   // "bài 9": ưu tiên lớp đang dạy
    var ds = [];
    DL.chuong.forEach(function (c) { c.bai.forEach(function (b) { if (b.ma === "B" + so) ds.push({ c: c, b: b }); }); });
    return ds.filter(function (x) { return x.c.lop === lop; })[0] || ds[0] || null;
  }
  /* tim(DL, loại, chủ đề, ngữ cảnh {lop, c, b}) → { loai, muc:[{kieu, m, c, b, d}], pv: "bai"|"tim", c, b } hoặc { loi: "…" } */
  function tim(DL, loai, chu, nc) {
    nc = nc || {};
    var cd = chuDeTra(chu || ""), lop = cd.lop || nc.lop || null, tq = tuTra(cd.q), cb = null;
    if (cd.bai) { cb = timBai(DL, cd.bai, lop); if (!cb) return { loi: "Hồ sơ chưa có dữ liệu Bài " + cd.bai + (lop ? " lớp " + lop : "") }; }
    else if (!tq.length && nc.b) cb = { c: nc.c, b: nc.b };
    var TEN = { ct: "công thức", kt: "kiến thức", db: "dạng bài", loi: "lỗi hay mắc", hn: "câu hỏi nhanh" };
    if (!tq.length) {   // không nói chủ đề: lấy cả bài
      if (!cb && loai === "hn" && nc.c) {   // câu hỏi nhanh của cả chương
        var tat = []; nc.c.bai.forEach(function (b) { cacMuc(b, "hn").forEach(function (x) { x.c = nc.c; x.b = b; tat.push(x); }); });
        return tat.length ? { loai: loai, muc: tat, pv: "bai", c: nc.c } : { loi: "Chương này chưa có câu hỏi nhanh" };
      }
      if (!cb) return { loi: nc.c ? "Cô nói rõ bài, ví dụ “" + (TEN[loai] === "kiến thức" ? "Nhắc lại" : TEN[loai].charAt(0).toUpperCase() + TEN[loai].slice(1)) + " bài " + String(nc.c.bai[0].ma).slice(1) + "”"
        : "Hồ sơ chưa có dữ liệu bài này. Cô nói rõ, ví dụ “" + { ct: "Công thức định luật Boyle", kt: "Nhắc lại định luật 1 Newton", db: "Dạng bài đẳng áp", loi: "Lỗi hay mắc bài 10", hn: "Câu hỏi nhanh bài 9" }[loai] + "”" };
      var ds = cacMuc(cb.b, loai); ds.forEach(function (x) { x.c = cb.c; x.b = cb.b; });
      return ds.length ? { loai: loai, muc: ds, pv: "bai", c: cb.c, b: cb.b } : { loi: cb.b.ten + " chưa có " + TEN[loai] + " trong hồ sơ" };
    }
    var cau = bo(cd.q), kq = [];
    DL.chuong.forEach(function (c) {
      c.bai.forEach(function (b) {
        if (cb && b !== cb.b) return;
        var tb = tuTra(String(b.ten).replace(/^Bài \d+\.\s*/, ""));
        cacMuc(b, loai).forEach(function (x, i) {
          var bc = bangChu(x.m, x.kieu === "tn" || x.kieu === "tln" ? "hn" : x.kieu), tm = tuTra(bc[0]), tt = tuTra(bc[1]), d = 0, trung = 0, thay = 0;
          tq.forEach(function (w) {
            if (tm.indexOf(w) >= 0) { d += 2; trung++; thay++; } else if (tt.indexOf(w) >= 0) { d += 1.3; trung++; thay++; } else if (tb.indexOf(w) >= 0) { d += 1; thay++; }
          });
          if (!trung && thay < tq.length) return;
          if (thay / tq.length < .7) return;   // "định luật Ôm": chữ "ôm" không có ở đâu cả, không lấy các định luật khác
          d = d / (2 * tq.length);
          if (cau.length > 4) d += bo(bc[0]).indexOf(cau) >= 0 ? .4 : bo(bc[1]).indexOf(cau) >= 0 ? .25 : 0;   // trùng cả cụm: ở tên mục chắc hơn ở lời giải thích
          if (nc.b === b) d += .15; else if (nc.c === c) d += .08; else if (lop && c.lop === lop) d += .04;
          d -= i * .002;   // cùng điểm: mục đứng trước (thường là ý chính) lên trước
          if (d >= .45) kq.push({ kieu: x.kieu, m: x.m, c: c, b: b, d: d });
        });
      });
    });
    kq.sort(function (a, b) { return b.d - a.d; });
    if (!kq.length) return { loi: "Hồ sơ chưa có " + TEN[loai] + " về “" + (chu || "").trim() + "”", it: tq.length <= 3 };
    kq = kq.filter(function (x) { return x.d >= kq[0].d * .6; });   // "liên quan" phải gần bằng mục tốt nhất
    return { loai: loai, muc: kq.slice(0, 6), pv: "tim", c: kq[0].c, b: kq[0].b };
  }

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
      if (!n && traCoDA()) { if (TC.da) return "!Đáp án câu hỏi nhanh đang hiện rồi"; traDA(true); return "Hiện đáp án câu hỏi nhanh"; }
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
      if (traCoDA() && TC.da) { traDA(false); return "Ẩn đáp án câu hỏi nhanh"; }
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
      if (TC.lon) { dongLon(); return "Đóng khung lớn"; }
      if (TC.the && TC.the.parentNode) { boTra(); return "Đóng ô tra cứu"; }
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
    tra: function (loai, chu) {
      if (loai === "hnk") { loai = "hn"; chu = TC.tq && TC.tq[0] === "hn" ? TC.tq[1] : ""; }   // "Câu khác": giữ chủ đề câu vừa hỏi
      traCuu(loai, chu);
    },   // tải dữ liệu xong mới trả lời (ô chat)
    moLon: function () { if (!TC.kq) return "!Chưa tra gì để mở lớn. Cô nói ví dụ “Công thức định luật 2 Newton”"; moLon(); return "Mở khung lớn"; },
    tatMic: function () { setTimeout(tat, 0); return "Tắt micro"; },
    giup: function () { moHop(); return "Bảng lệnh"; }
  };

  /* ---------- giao diện ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#tgNut{position:fixed;left:10px;bottom:64px;z-index:2147483000;font:600 14px system-ui,sans-serif;padding:7px 12px;border-radius:20px;border:1px solid #1d4ed8;background:#eff6ff;color:#1e3a8a;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2);opacity:.8;user-select:none;touch-action:none;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#tgNut:hover{opacity:1}#tgNut.on{background:#dc2626;border-color:#dc2626;color:#fff;opacity:1;animation:tgTho 1.6s infinite}" +
    "@keyframes tgTho{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}" +
    "#tgNut.on.muc{background-image:linear-gradient(#facc15,#facc15);background-repeat:no-repeat;background-position:left bottom;background-size:calc(var(--tgMuc,0) * 100%) 4px}" +
    "#tgChat{position:fixed;z-index:2147483002;width:min(420px,calc(100vw - 20px));display:flex;flex-direction:column;gap:6px;font:14px/1.4 system-ui,sans-serif;pointer-events:none}" +
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
    "#tgChat .m.tra{max-height:min(60vh,420px);overflow:auto;border-color:#93c5fd;border-width:2px}#tgChat .tgDau,#tgLon .tgDau{font-size:12px;color:#1d4ed8;font-weight:600;margin-bottom:3px}" +
    ".tgTen{font-weight:700;color:#14213d}.tgGc{color:#4b5563;font-size:.92em}.tgCT{text-align:center;margin:4px 0;overflow-x:auto;overflow-y:hidden}.tgVd{margin-top:4px}.tgPA{margin:4px 0;padding-left:0;list-style:none}" +
    ".tgDA{display:none;margin-top:6px;padding:6px 9px;border-radius:8px;background:#ecfdf5;color:#14532d}.da .tgDA{display:block}.tgThem{font-size:12px;color:#6b7280;margin-top:3px}" +
    "#tgLon{position:fixed;inset:3vh 3vw;z-index:2147483003;background:#fff;color:#111827;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.45);overflow:auto;padding:0 34px 26px;font:26px/1.5 system-ui,sans-serif;box-sizing:border-box}" +
    "#tgLon .dau{position:sticky;top:0;background:#fff;display:flex;gap:10px;align-items:center;padding:14px 0 10px;border-bottom:2px solid #dbeafe;margin-bottom:12px;z-index:1}" +
    "#tgLon .dau b{flex:1;font-size:22px;color:#1e3a8a}#tgLon .dau button{font:600 18px system-ui,sans-serif;padding:8px 16px;border-radius:8px;border:1px solid #d1d5db;background:#f3f4f6;color:#111;cursor:pointer}" +
    "#tgLon .dau button.c{background:#1d4ed8;border-color:#1d4ed8;color:#fff}#tgLon .muc{padding:12px 0;border-bottom:1px solid #e5e7eb}#tgLon .muc:last-child{border-bottom:0}" +
    "#tgLon .tgDau{font-size:16px}#tgLon .tgCT{font-size:1.25em;margin:10px 0}#tgLon h4{margin:18px 0 0;font-size:18px;color:#6b7280}" +
    "@media (max-width:700px){#tgLon{inset:0;border-radius:0;padding:0 16px 16px;font-size:19px}#tgLon .dau b{font-size:17px}#tgLon .dau button{font-size:15px;padding:6px 10px}}" +
    "@media print{#tgNut,#tgChat,#tgHop,#tgGio,#tgLon{display:none!important}}";
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

  /* ---------- TRA CỨU: tải dữ liệu, ô tra cứu trong chat, khung lớn ---------- */
  var GOC = (function () {   // thư mục chứa tro_giang.js: dữ liệu tra cứu, KaTeX nằm cùng chỗ
    var s = document.currentScript && document.currentScript.src;
    if (!s) { var e = document.querySelector('script[src*="tro_giang.js"]'); s = e && e.src; }
    return s ? s.replace(/tro_giang\.js.*$/, "") : "../nguon/lib/";
  })();
  var NAP = null;
  function napJS(u, cb) { var s = document.createElement("script"); s.src = u; s.onload = function () { cb(true); }; s.onerror = function () { cb(false); }; document.head.appendChild(s); }
  function napDL(cb) {   // tải dữ liệu tra cứu và KaTeX (nếu trang chưa có) một lần, khi cô hỏi lần đầu
    if (window.TG_DL && window.katex) return cb(true);
    if (NAP) { NAP.push(cb); return; }
    NAP = [cb]; var con = 0;
    function xong() { if (--con) return; var ds = NAP; NAP = null; ds.forEach(function (f) { f(!!window.TG_DL); }); }
    if (!window.TG_DL) con++;
    if (!window.katex) con++;
    if (!window.TG_DL) napJS(GOC + "tro_giang_du_lieu.js", xong);
    if (!window.katex) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = GOC + "katex.css"; document.head.appendChild(l);
      napJS(GOC + "katex.js", xong);
    }
  }
  function ngCanh(DL) {   // bài đang giảng, theo tên trang: k10-B13.html → lớp 10 Bài 13; k12-chuong2.html → chương 12-2 (bài đoán theo slide đang hiện)
    var p = decodeURIComponent(location.pathname || ""), m, lop = null, so = null, cm = null, c = null, b = null;
    if ((m = /k(\d+)-B(\d+)/i.exec(p))) { lop = +m[1]; so = +m[2]; }
    else if ((m = /k(\d+)-chuong(\d+)/i.exec(p))) { lop = +m[1]; cm = m[1] + "-" + m[2]; }
    DL.chuong.forEach(function (x) {
      if (so && x.lop === lop) x.bai.forEach(function (y) { if (y.ma === "B" + so) { c = x; b = y; } });
      if (cm && x.ma === cm) c = x;
    });
    if (c && !b) {   // slide đang hiện, rồi slide đầu của bộ slide đó (bài giảng K12 dựng slide theo từng bài, slide đầu ghi "Bài 8 · …")
      var el = document.querySelector(".bg-s.on,.slide.on,.slide.active,section.on"), ts = [];
      if (el) { ts.push(el.textContent); if (el.parentElement && el.parentElement.firstElementChild) ts.push(el.parentElement.firstElementChild.textContent); }
      ts.push(document.title);
      for (var i = 0; i < ts.length && !b; i++) {
        var so_ = {}, mm, re = /Bài\s*(\d+)/g, t = String(ts[i] || "").slice(0, 400);
        while ((mm = re.exec(t))) so_[mm[1]] = 1;
        var k = Object.keys(so_);
        if (k.length === 1) c.bai.forEach(function (y) { if (y.ma === "B" + k[0]) b = y; });   // nhắc nhiều bài (mục lục) thì không đoán
      }
    }
    return { lop: lop, c: c, b: b };
  }
  var TC = { kq: null, chon: null, the: null, lon: null, da: false, tq: null, daHoi: [], cau: "" };
  var TEN_TRA = { ct: "📐 Công thức", kt: "📘 Kiến thức", db: "🧩 Dạng bài", loi: "⚠ Lỗi hay mắc", hn: "❓ Câu hỏi nhanh" };
  function tex(l, lon) {
    try { if (window.katex) return katex.renderToString(String(l), { throwOnError: false, displayMode: !!lon }); } catch (e) {}
    return "<code>" + esc(l) + "</code>";
  }
  function toan(s) {   // chữ có công thức $…$
    var h = "", i = 0, re = /\$([^$]+)\$/g, m; s = String(s || "");
    while ((m = re.exec(s))) { h += esc(s.slice(i, m.index)) + tex(m[1]); i = re.lastIndex; }
    return h + esc(s.slice(i));
  }
  function nhanBai(x) { return x.b ? x.b.ten.replace(/\.\s.*$/, "") + " · lớp " + x.c.lop : ""; }
  function veLuaChon(pa) { return '<ul class="tgPA">' + pa.map(function (p, i) { return "<li><b>" + "ABCDEFGH".charAt(i) + ".</b> " + toan(p) + "</li>"; }).join("") + "</ul>"; }
  function veMuc(x, lon) {
    var m = x.m, h = "";
    if (x.kieu === "ct") {
      h = (m.t ? '<div class="tgTen">' + esc(m.t) + "</div>" : "") + '<div class="tgCT">' + tex(m.l, true) + "</div>" + (m.dk ? '<div class="tgGc">' + toan(m.dk) + "</div>" : "");
      if (lon && m.vd) h += '<div class="tgVd"><b>Ví dụ:</b> ' + toan(m.vd) + "</div>";
    } else if (x.kieu === "kt") h = toan(m);
    else if (x.kieu === "loi") h = "⚠ " + toan(m);
    else if (x.kieu === "db") {
      h = '<div class="tgTen">' + toan(m.t) + "</div><div><b>Nhận biết:</b> " + toan(m.nb) + "</div><div><b>Cách làm:</b> " + toan(m.cl) + "</div>";
      if (lon && m.vd) h += '<div class="tgVd"><b>Ví dụ:</b> ' + toan(m.vd.de) + (m.vd.pa ? veLuaChon(m.vd.pa) : "") +
        (m.vd.gi ? '<div class="tgDA"><b>Lời giải:</b> ' + toan(m.vd.gi) + "</div>" : "") + "</div>";
    } else if (x.kieu === "the") h = '<div class="tgTen">' + toan(m[0]) + '</div><div class="tgDA">' + toan(m[1]) + "</div>";
    else if (x.kieu === "tn") h = "<div>" + toan(m.de) + "</div>" + veLuaChon(m.pa) + '<div class="tgDA"><b>Đáp án ' + esc(m.da) + ".</b> " + toan(m.gt) + "</div>";
    else if (x.kieu === "tln") h = "<div>" + toan(m.de) + '</div><div class="tgDA"><b>Đáp số: ' + esc(m.ds) + ".</b> " + toan(m.gt) + "</div>";
    return h;
  }
  function coDA(x) { return x && (x.kieu === "the" || x.kieu === "tn" || x.kieu === "tln" || (x.kieu === "db" && x.m.vd && x.m.vd.gi)); }
  function traCoDA() { return !!(TC.kq && TC.kq.loai === "hn" && ((TC.the && TC.the.parentNode) || TC.lon)); }
  function traDA(hien) {
    TC.da = hien;
    [TC.the, TC.lon].forEach(function (e) { if (e) e.classList.toggle("da", hien); });
    [].forEach.call(document.querySelectorAll("#tgChat .tra [data-t=da],#tgLon [data-t=da]"), function (b) { b.textContent = hien ? "Ẩn đáp án" : "Đáp án"; });
  }
  function nutTra(lon) {
    var h = "";
    if (!lon) h += '<button type="button" class="c" data-t="lon">⤢ Mở lớn</button>';
    if (TC.kq.loai === "hn" || (lon && TC.kq.muc.some(coDA))) h += '<button type="button" data-t="da">' + (TC.da ? "Ẩn đáp án" : "Đáp án") + "</button>";
    if (TC.kq.loai === "hn") h += '<button type="button" data-t="khac">↻ Câu khác</button>';
    return h + '<button type="button" data-t="dong">✕' + (lon ? " Đóng" : "") + "</button>";
  }
  function bamTra(e) {
    var b = e.target.closest("button[data-t]"); if (!b) return;
    var t = b.getAttribute("data-t");
    if (t === "lon") moLon();
    else if (t === "da") traDA(!TC.da);
    else if (t === "khac") { TC.cau = "↻ Câu khác"; traCuu("hn", TC.tq ? TC.tq[1] : ""); }
    else if (t === "dong") { if (b.closest("#tgLon")) dongLon(); else boTra(); }
  }
  function boTra() { if (TC.the) { clearTimeout(TC.the._tq); boTin(TC.the); } TC.the = null; }
  function hienTra() {   // ô tra cứu trong chat: mục chính + nút Mở lớn
    var kq = TC.kq, x = TC.chon;
    boTra();
    if (!chat) { chat = document.createElement("div"); chat.id = "tgChat"; chat.setAttribute("role", "status"); document.body.appendChild(chat); }
    var t = document.createElement("div"); t.className = "m tra";
    var con = kq.loai === "hn" ? 0 : kq.muc.length - 1, ten = { ct: "công thức", kt: "ý", db: "dạng", loi: "lỗi" }[kq.loai];
    t.innerHTML = '<div class="tgDau">' + TEN_TRA[kq.loai] + (x.b ? " · " + esc(nhanBai(x)) : "") + "</div>" + veMuc(x, false) +
      (con > 0 ? '<div class="tgThem">+ ' + con + " " + ten + (kq.pv === "tim" ? " liên quan" : " nữa của bài") + ": bấm ⤢ Mở lớn</div>" : "") +
      '<div class="r">' + nutTra(false) + "</div>";
    t.addEventListener("click", bamTra);
    t.addEventListener("mouseenter", function () { clearTimeout(t._tq); });
    t._tq = setTimeout(function () { if (TC.the === t && !TC.lon) boTra(); }, 45000);   // tự ẩn sau 45 giây (đưa chuột vào thì giữ)
    chat.appendChild(t); TC.the = t;
    while (chat.children.length > 3) chat.removeChild(chat.firstChild);
    datChat();
  }
  function moLon() {   // khung lớn trên màn chiếu: mục chính (và các mục khác của bài / liên quan)
    var kq = TC.kq; if (!kq) return;
    dongLon();
    var l = document.createElement("div"); l.id = "tgLon"; l.setAttribute("role", "dialog");
    var ds = kq.loai === "hn" ? [TC.chon] : kq.muc,
      tieu = TEN_TRA[kq.loai] + (kq.pv === "bai" && kq.b ? " · " + kq.b.ten : kq.pv === "bai" && kq.c ? " · Chương " + kq.c.ten : "");
    l.innerHTML = '<div class="dau"><b>' + esc(tieu) + "</b>" + nutTra(true) + "</div>" +
      ds.map(function (x, i) {
        return (kq.pv === "tim" && i === 1 ? "<h4>Liên quan</h4>" : "") + '<div class="muc">' +
          (kq.pv === "tim" || kq.loai === "hn" ? '<div class="tgDau">' + esc(nhanBai(x)) + "</div>" : "") + veMuc(x, true) + "</div>";
      }).join("");
    if (TC.da) l.classList.add("da");
    l.addEventListener("click", bamTra);
    document.body.appendChild(l); TC.lon = l;
  }
  function dongLon() { if (TC.lon) TC.lon.remove(); TC.lon = null; }
  document.addEventListener("keydown", function (e) { if (TC.lon && e.key === "Escape" && e.isTrusted) { dongLon(); e.stopPropagation(); e.preventDefault(); } }, true);
  function traCuu(loai, chu) {
    var cau = TC.cau || chu || ""; TC.cau = "";
    napDL(function (ok) {
      if (!ok) { nhan("Không tải được dữ liệu tra cứu", "Kiểm tra mạng rồi nói lại", "loi"); ghiNK(cau, "✗ không tải được dữ liệu"); return; }
      var kq = tim(window.TG_DL, loai, chu, ngCanh(window.TG_DL));
      if (kq.loi) {
        if (kq.it === false) { ghiNK(cau, "bỏ qua: " + kq.loi); return; }   // câu dài không khớp gì: có lẽ là lời giảng
        nhan(kq.loi, "“" + cau + "”", "loi"); ghiNK(cau, "✗ " + kq.loi); return;
      }
      var chon = kq.muc[0];
      if (loai === "hn") {   // chọn ngẫu nhiên, tránh câu vừa hỏi
        var con = kq.muc.filter(function (x) { return TC.daHoi.indexOf(x.m) < 0; });
        if (!con.length) { TC.daHoi = []; con = kq.muc; }
        chon = con[Math.floor(Math.random() * con.length)];
        TC.daHoi.push(chon.m); if (TC.daHoi.length > 30) TC.daHoi.shift();
      }
      TC.kq = kq; TC.chon = chon; TC.da = false; TC.tq = [loai, chu];
      hienTra();
      if (TC.lon) moLon();   // khung lớn đang mở thì thay nội dung luôn
      ghiNK(cau, "✓ " + TEN_TRA[loai].replace(/^\S+ /, "") + (chon.b ? " · " + nhanBai(chon) : ""));
    });
  }

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
       ["Tra cứu", "“Công thức định luật 2 Newton”, “Nhắc lại bài 13”, “Dạng bài đẳng áp”, “Lỗi hay mắc”, “Câu hỏi nhanh” rồi “Đáp án”: trả lời ở ô chat, bấm ⤢ Mở lớn (hoặc nói “Phóng to”) để chiếu cho lớp. Tra bài đang giảng trước, rồi cả chương, cả hồ sơ"],
       ["Sửa …", "“Sửa đáp án câu 3 là B”: mở phiếu ✎ Sửa đã điền sẵn, cô đọc lại rồi bấm Gửi"],
       ["Tắt micro", "“Tắt micro”, “Ngừng nghe”"], ["Trợ giúp", "hiện bảng này"],
       ["Lớp ồn", "Gọi “Niu ơi” trước lệnh: “Niu ơi chuyển slide”. Có tiếng gọi, robot làm lệnh ngay sau đó dù trước, sau có lời giảng hay tiếng ồn. Không gọi vẫn dùng được như thường; ngừng một chút trước lệnh thì robot dễ nhận hơn"]]
        .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</table>" +
      (nk.length ? "<h4>Câu robot nghe gần đây</h4><div class='gc'>Câu nào robot hiểu sai hoặc chưa làm, cô chọn lệnh đúng để dạy robot.</div><table>" +
        nk.map(function (x, i) {
          return "<tr><td>" + esc(x.g) + "</td><td>“" + esc(x.c) + "”<br><span class='gc'>" + esc(x.k) + "</span></td><td>" +
            (x.khoa && x.khoa !== "sửa" ? '<select data-khoa="' + esc(x.khoa) + '">' + chon + "</select>" : "") + "</td></tr>";
        }).join("") + "</table><button type='button' data-x='nk'>Xóa nhật kí</button>" : "") +
      (daDay.length ? "<h4>Câu cô đã dạy robot</h4><table>" + daDay.map(function (k) {
          return "<tr><td>“" + esc(k) + "”</td><td>" + esc(tenLenh(HOC[k])) + "</td><td><button type='button' data-quen='" + esc(k) + "'>Quên</button></td></tr>";
        }).join("") + "</table>" : "") +
      '<h4>Tốc độ phản hồi</h4><select data-x="cham"><option value="0"' + (cham ? "" : " selected") + '>⚡ Nhanh: làm ngay khi nghe ra lệnh</option><option value="1"' + (cham ? " selected" : "") + '>Chắc chắn: chờ cô nói hết câu (chậm hơn 1-2 giây)</option></select>' +
      '<div class="gc">Nếu robot hay làm nhầm khi cô ngập ngừng giữa câu (ví dụ “Tiếp theo… là gia tốc”), chọn Chắc chắn.</div>' +
      '<h4>Micro</h4><select data-x="loc"><option value="1"' + (loc ? " selected" : "") + '>🔇 Lọc ồn, khử tiếng vọng loa (nên dùng)</option><option value="0"' + (loc ? "" : " selected") + '>Micro thường của trình duyệt</option></select>' +
      '<div class="gc">' + (!coLuong ? "Trình duyệt này chưa lọc ồn cho nhận giọng nói được (cần Chrome hoặc Edge bản mới), robot dùng micro thường."
        : ray ? "Đang lọc ồn. Vạch vàng dưới nút 🎤 là độ to micro nghe được: cô nói mà vạch không nhích thì kiểm tra micro."
        : "Bật 🎤 thì robot nghe qua micro lọc ồn, vạch vàng dưới nút 🎤 là độ to micro nghe được.") + " Nếu robot nghe kém hơn khi lọc ồn, chọn Micro thường.</div>" +
      '<div class="gc" style="margin-top:8px">Cần Chrome hoặc Edge và có mạng. Giọng nói được trình duyệt chuyển thành chữ, robot không nói, chỉ trả lời trong ô chat. Nhật kí chỉ lưu câu giống lệnh, trên máy này. Không đọc tên, điểm học sinh vào micro.</div>';
    hop.querySelector(".dong").onclick = dongHop;
    hop.addEventListener("change", function (e) {
      var sc = e.target.closest("select[data-x=cham]");
      if (sc) { cham = sc.value === "1"; ghiLS("tgCham", cham ? 1 : 0); huyTam(); nhan(cham ? "Robot chờ cô nói hết câu" : "⚡ Robot làm ngay khi nghe ra lệnh", "", "ok"); return; }
      var sl = e.target.closest("select[data-x=loc]");
      if (sl) {
        loc = sl.value === "1"; ghiLS("tgLoc", loc ? 1 : 0);
        if (dangNghe) { dongMic(); ngheLai(); }
        nhan(loc ? (coLuong ? "🔇 Robot nghe qua micro lọc ồn" : "Trình duyệt này chưa lọc ồn được, robot vẫn dùng micro thường") : "Robot nghe qua micro thường", "", "ok"); return;
      }
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
    try { kq = VIEC[l[0]](l[1], l[2]); } catch (e) { kq = "!Lỗi khi làm lệnh: " + e.message; }
    if (typeof kq !== "string") return;
    if (kq.charAt(0) === "!") { nhan(kq.slice(1), "“" + cau + "”", "loi"); ghiNK(cau, "✗ " + kq.slice(1), khoa); }
    else { nhan("✓ " + kq + (ghiChu ? " (" + ghiChu + ")" : ""), "", "ok"); ghiNK(cau, "✓ " + kq, khoa); }
  }
  function lam(cau, p) {
    if (choLenh) { var f = choLenh; choLenh = null; f(cau); return; }
    if (hoi) {   // đang hỏi lại: nghe “Đúng” / “Không”
      var s = boGoi(cau);
      if (RE_CO.test(s)) { traLoi(true); return; }
      if (RE_KHONG.test(s)) { traLoi(false); return; }
    }
    p = p || phanTich(cau);
    if (!p) return;   // lời giảng: im lặng
    if (p.lenh) { dongHoi(); TC.cau = cau; chayLenh(p.lenh, cau, "", p.lenh[0] === "sua" || p.lenh[0] === "tra" ? "" : p.khoa); return; }
    if (p.hoi) { if (!hoi && Date.now() - lanHoi > 4000) moiHoi(p, cau); ghiNK(cau, "hỏi: " + tenLenh(p.hoi) + "?", p.khoa); return; }
    ghiNK(cau, "chưa hiểu", p.khoa);
  }
  /* PHẢN HỒI NHANH: trình duyệt gửi chữ nghe được ngay khi cô đang nói (kết quả tạm). Chữ tạm đã là một lệnh rõ (Chuyển, Lùi, Đáp án, Đóng…)
     và đứng yên một chút (cô ngừng nói) thì làm luôn, không chờ trình duyệt chốt câu (chậm 1-2 giây). Lệnh tra cứu, Sửa, câu cần hỏi lại vẫn chờ chốt câu.
     Câu đã làm theo chữ tạm thì khi chốt không làm lại. Bảng Trợ giúp có chỗ chọn "Chắc chắn" (chờ chốt câu như cũ): localStorage tgCham = 1.
     TÁCH ĐOẠN (lớp ồn): trình duyệt không nhận ra chỗ cô ngừng nên chữ tạm cứ dài ra, lệnh dính sau lời giảng ("… xong phần một chuyển slide").
     Robot ghi lúc từng chữ hiện ra: hai chữ cách nhau ≥ NGUNG ms là chỗ cô ngừng, đoạn sau chỗ ngừng cuối được xét như một câu.
     Đoạn đứng sau lời giảng phải là lệnh "chắc" (Tiếp/Lùi phải có chữ slide, chuyển, lùi…: "… tiếp theo … là gia tốc" không tính) và đứng yên lâu hơn (CHO_DOAN).
     Khi chốt câu, nếu cả câu không phải lệnh thì cũng xét đoạn sau chỗ ngừng cuối (cả khi chọn "Chắc chắn"). */
  var NHANH_OK = { tiep: 1, lui: 1, den: 1, dapAn: 1, anDapAn: 1, dong: 1, mp: 1, moPhong: 1, goiTen: 1, nhom: 1, gio: 1, moLon: 1, tatMic: 1, giup: 1 };
  var CHO_TAM = 350, CHO_TAM_SO = 650, CHO_DOAN = 600, NGUNG = 800;   // ms: chữ tạm đứng yên; lệnh có số; đoạn sau lời giảng; chỗ ngừng giữa hai chữ
  var RE_MANH = /(^| )(slide|slides|slai|xlai|sờ lai|sờ lái|trang chiếu|màn hình|chuyển|chuyền|lật|lùi|lui|next|back)( |$)/;
  var cham = docLS("tgCham", 0) === 1, phien = 0, tam = null, DOAN = {};   // DOAN: khóa kết quả → { ws: chữ, tg: lúc hiện, den: số chữ đã làm lệnh, lam }
  function huyTam() { if (tam) { clearTimeout(tam.tm); tam = null; } }
  function boGoi(t) { return chuan(t).replace(/^(trợ giảng|trợ lý|robot|niu|níu)( ơi)?\s*/, "").replace(/^(cô|cô nói)\s+/, ""); }
  function manh(p) { return (p.lenh[0] !== "tiep" && p.lenh[0] !== "lui") || !!p.goi || RE_MANH.test(p.khoa || ""); }
  function lenhNhanh(t, giua) {   // chữ tạm → { p, cho } nếu làm ngay được; giua: đoạn đứng sau lời giảng
    if (cham || choLenh || !t) return null;
    if (hoi) { var s = boGoi(t); return RE_CO.test(s) || RE_KHONG.test(s) ? { cho: CHO_TAM } : null; }
    var p = phanTich(t), k = p && p.khoa || "";
    if (!p || !p.lenh || !NHANH_OK[p.lenh[0]] || (giua && !manh(p))) return null;
    // "Sang phần…", "Qua mục…" chưa có chữ Tiếp: chờ chốt câu, vì có thể là "Sang phần hai" (lời giảng)
    if (p.lenh[0] === "tiep" && /(^| )(phần|mục|nội dung|bước|câu|ý|hình)( |$)/.test(k) && !/(tiếp|kế|sau|next)/.test(k)) return null;
    // "Chuyển đến slide…", "Đáp án câu…": cô sắp nói số, chờ chốt câu
    if (p.lenh[0] === "tiep" && /(^| )(đến|tới|về|nhảy|số|thứ)( |$)/.test(k)) return null;
    if (p.lenh[0] === "dapAn" && !p.lenh[1] && /(^| )(câu|câu hỏi|bài|ý|phần|số|thứ)$/.test(k)) return null;
    // một tiếng "Qua"/"Sang" và lệnh có số chờ lâu hơn: có thể là đầu câu giảng "Qua thí nghiệm này…", hoặc "slide mười" … "mười hai"
    var lau = typeof p.lenh[1] === "number" || p.lenh[0] === "den" || /^(qua|sang|quà|quả|quá)$/.test(k);
    return { p: p, cho: (lau ? CHO_TAM_SO : CHO_TAM) + (giua ? CHO_DOAN - CHO_TAM : 0) };
  }
  function nghe(t) {   // hiện chữ đang nghe trên nút 🎤 để cô biết robot đã nghe
    if (!dangNghe) return;
    nut.textContent = t ? "🎤 " + (t.length > 26 ? "…" + t.slice(-25) : t) : "🎤 Đang nghe";
  }
  function ghiDoan(k, t) {   // ghi lúc từng chữ của chữ tạm hiện ra (theo vị trí; trình duyệt sửa chữ cũ thì giữ lúc cũ)
    var d = DOAN[k] || (DOAN[k] = { ws: [], tg: [], den: 0, lam: false }), ws = chuan(t).split(" ").filter(Boolean), bay = Date.now();
    d.tg = ws.map(function (w, j) { return j < d.tg.length ? d.tg[j] : bay; });
    d.ws = ws; if (d.den > ws.length) d.den = ws.length;
    return d;
  }
  function dauDoan(d) {   // chữ đầu đoạn cuối: sau chỗ ngừng cuối cùng, không lùi vào phần đã làm lệnh (d.den)
    for (var j = d.ws.length - 1; j > d.den; j--) if (d.tg[j] - d.tg[j - 1] >= NGUNG) return j;
    return d.den;
  }
  function chuTam(k, t) {
    nghe(t);
    var d = ghiDoan(k, t), n = null, id = "0", s;
    if (!d.den) n = lenhNhanh(t, false);   // cả câu (có tiếng gọi “Niu ơi” thì lấy phần sau tiếng gọi)
    if (!n && (s = dauDoan(d)) > 0) {   // đoạn sau chỗ ngừng
      var td = d.ws.slice(s).join(" ");
      n = lenhNhanh(td, true);
      if (n) { id = String(s); t = td; }
    }
    if (!n) { huyTam(); return; }
    // cùng lệnh thì không chờ lại: trình duyệt chỉ sửa chữ phía trước; sau tiếng gọi “Niu ơi” chữ ồn hiện thêm phía sau cũng không tính
    var khop = n.p && n.p.goi ? "gọi " + JSON.stringify(n.p.lenh) : t;
    if (tam && tam.k === k && tam.id === id && tam.khop === khop) return;
    huyTam();
    tam = { k: k, id: id, khop: khop, tm: setTimeout(function () { tam = null; d.den = Math.max(d.den, d.ws.length); d.lam = true; lam(t, n.p); }, n.cho) };
  }
  function doanChot(d, cau) {   // đoạn sau chỗ ngừng cuối của câu đã chốt (chỗ ngừng ghi được ở chữ tạm), chỉ khi đoạn đó vừa nói
    var s = dauDoan(d);
    if (s <= 0 || Date.now() - d.tg[s] > 6000) return "";
    var ws = chuan(cau).split(" ").filter(Boolean);
    return (Math.abs(ws.length - d.ws.length) <= 1 ? ws : d.ws).slice(s).join(" ");
  }
  function chot(k, kq) {   // trình duyệt chốt câu
    var d = DOAN[k]; delete DOAN[k];
    if (tam && tam.k === k) huyTam();
    nghe("");
    if (d && d.lam) return;   // đã làm theo chữ tạm
    var cau = kq[0].transcript.trim(), p = null;
    if (!choLenh && !hoi) {   // chọn cách nghe hợp lệnh nhất trong các phương án của trình duyệt
      var ds = [];
      for (var j = 0; j < kq.length; j++) { var c = kq[j].transcript.trim(); if (c) ds.push({ c: c, p: phanTich(c) }); }
      var tot = ds.filter(function (x) { return x.p && x.p.lenh; })[0] || ds.filter(function (x) { return x.p && x.p.hoi; })[0] || ds[0];
      if (tot) { cau = tot.c; p = tot.p; }
    }
    var td = d && !choLenh && !(p && (p.lenh || p.hoi)) ? doanChot(d, cau) : "";
    if (td && hoi) { var b = boGoi(td); if (RE_CO.test(b) || RE_KHONG.test(b)) { cau = td; p = null; } }
    else if (td) { var pd = phanTich(td); if (pd && pd.lenh && manh(pd)) { cau = td; p = pd; } }
    if (cau) lam(cau, p);
  }

  /* ---------- micro LỌC ỒN: Chrome 139+ (có processLocally) nhận giọng từ luồng micro do trang mở (start(track)), nên bật được
     lọc ồn, khử tiếng vọng loa (video, chuông trên trang), tự chỉnh độ nhạy. Trình duyệt cũ: start(track) bỏ qua track, dùng micro thường. ---------- */
  var NAV = window.navigator || {};
  var coLuong = !!(SR && NAV.mediaDevices && NAV.mediaDevices.getUserMedia && SR.prototype && ("processLocally" in SR.prototype || typeof SR.available === "function"));
  var loc = docLS("tgLoc", 1) !== 0, luong = null, ray = null, choMic = null, doTo = null;
  function moMic(cb) {   // cb(track đã lọc ồn) hoặc cb(null): dùng micro thường của trình duyệt
    if (!coLuong || !loc) return cb(null);
    if (ray && ray.readyState === "live") return cb(ray);
    if (choMic) { choMic.push(cb); return; }
    dongMic(); choMic = [cb];
    function xong(tr) { var ds = choMic; choMic = null; ds.forEach(function (f) { f(tr); }); }
    NAV.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }).then(function (s) {
      if (!dangNghe) { s.getTracks().forEach(function (t) { t.stop(); }); return xong(null); }
      luong = s; ray = s.getAudioTracks()[0] || null; doMuc(s); xong(ray);
    }, function () { xong(null); });
  }
  function dongMic() {
    if (doTo) { clearInterval(doTo.tm); try { doTo.A.close(); } catch (e) {} doTo = null; }
    nut.classList.remove("muc");
    if (luong) luong.getTracks().forEach(function (t) { t.stop(); });
    luong = ray = null;
  }
  function doMuc(s) {   // vạch vàng dưới nút 🎤: độ to micro nghe được (cô nói mà vạch không nhích là micro không bắt được tiếng)
    try {
      var A = new (window.AudioContext || window.webkitAudioContext)(), an = A.createAnalyser(), buf;
      an.fftSize = 1024; A.createMediaStreamSource(s).connect(an); buf = new Float32Array(an.fftSize);
      doTo = { A: A, tm: setInterval(function () {
        an.getFloatTimeDomainData(buf);
        for (var i = 0, t = 0; i < buf.length; i++) t += buf[i] * buf[i];
        var db = 10 * Math.log10(t / buf.length + 1e-10);   // im lặng khoảng −90 dB, nói to gần 0 dB
        nut.style.setProperty("--tgMuc", Math.max(0, Math.min(1, (db + 65) / 50)).toFixed(2));
      }, 120) };
      nut.classList.add("muc");
    } catch (e) {}
  }

  /* ---------- phiên nghe: tự nghe lại khi trình duyệt dừng, mất mạng (chờ 1, 2, 4… giây), hoặc đứng im quá 25 giây ---------- */
  var dangChay = false, lanSK = 0, doiLai = 0, canh = null, hongTr = 0;
  function taoMic() {
    var r = new SR();
    r.lang = "vi-VN"; r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
    function cu() { return r !== mic; }   // phiên cũ đã bị thay
    r.onstart = function () { if (cu()) return; dangChay = true; hongTr = 0; lanSK = Date.now(); phien++; DOAN = {}; huyTam(); };
    r.onaudiostart = r.onsoundstart = r.onspeechstart = function () { if (!cu()) lanSK = Date.now(); };
    r.onresult = function (e) {
      if (cu()) return;
      lanSK = Date.now(); doiLai = 0;
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var k = phien + ":" + i;
        if (!e.results[i].isFinal) chuTam(k, e.results[i][0].transcript.trim());
        else chot(k, e.results[i]);
      }
    };
    r.onerror = function (e) {
      if (cu()) return;
      lanSK = Date.now();
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "network") {   // mất mạng: báo một lần, nghe lại sau 1, 2, 4… giây (tối đa 10)
        if (!doiLai) thongBao("Mất mạng: robot sẽ tự nghe lại khi có mạng", "Nhận giọng nói cần có mạng", true);
        doiLai = Math.min(doiLai ? doiLai * 2 : 1000, 10000); return;
      }
      if (e.error === "audio-capture" && ray) {   // luồng micro lọc ồn không dùng được trên máy này: về micro thường
        coLuong = false; dongMic(); thongBao("Robot chuyển sang micro thường", "Micro lọc ồn không chạy trên máy này", true); return;
      }
      var lydo = { "not-allowed": "Trình duyệt chưa cho dùng micro: bấm biểu tượng ổ khóa trên thanh địa chỉ, cho phép Micro",
        "service-not-allowed": "Trình duyệt chưa cho dùng micro", "audio-capture": "Không thấy micro trên máy này" }[e.error] || ("Lỗi micro: " + e.error);
      thongBao(lydo, "", true);
      tat();
    };
    r.onend = function () { if (cu()) return; dangChay = false; lanSK = Date.now(); if (dangNghe) setTimeout(khoiDong, doiLai); };
    return r;
  }
  function khoiDong() {   // bắt đầu (lại) một phiên nghe
    if (!dangNghe || dangChay) return;
    moMic(function (tr) {
      if (!dangNghe || dangChay) return;
      try { if (tr) mic.start(tr); else mic.start(); }
      catch (e) {
        if (tr && e && e.name !== "InvalidStateError" && ++hongTr >= 2) { coLuong = false; dongMic(); }   // trình duyệt không nhận luồng lọc ồn: về micro thường
        setTimeout(function () { if (dangNghe && !dangChay) khoiDong(); }, 400);
      }
    });
  }
  function ngheLai() {   // bỏ phiên đang có (đứng im, đổi micro), mở phiên mới
    var cuMic = mic; mic = taoMic(); dangChay = false;
    try { if (cuMic) cuMic.abort(); } catch (e) {}
    khoiDong();
  }
  function trongCanh() { if (dangNghe && Date.now() - lanSK > 25000) { lanSK = Date.now(); ngheLai(); } }
  function batDau() {   // bật nghe: nút 🎤, đọc chính tả cho phiếu Sửa
    mic = mic || taoMic(); dangNghe = true; doiLai = 0; lanSK = Date.now();
    khoiDong();
    nut.classList.add("on"); nut.textContent = "🎤 Đang nghe";
    if (!canh) canh = setInterval(trongCanh, 5000);
  }
  function bat() {
    if (!SR) { thongBao("Trình duyệt này không nghe được giọng nói", "Mở trang bằng Chrome hoặc Edge", true); return; }
    if (location.protocol === "file:") thongBao("Mở trang trên mạng (github.io) để dùng micro", "Trang mở từ tệp trên máy có thể không nghe được", true);
    batDau();
    setTimeout(function () { if (dangNghe) napDL(function () {}); }, 2500);   // tải sẵn dữ liệu tra cứu để lần hỏi đầu trả lời ngay
    var daXem = false; try { daXem = localStorage.getItem("tgDaXem") === "1"; localStorage.setItem("tgDaXem", "1"); } catch (e) {}
    if (!daXem) moHop(); else nhan("🎤 Robot đang nghe lệnh", "Cô cứ giảng bình thường, robot chỉ làm khi nghe lệnh. Lớp ồn: gọi “Niu ơi” trước lệnh", "ok");
  }
  function tat() {
    dangNghe = false; dangChay = false; choLenh = null; dongHoi(); huyTam();
    if (canh) { clearInterval(canh); canh = null; }
    try { mic && mic.stop(); } catch (e) {}
    dongMic();
    nut.classList.remove("on"); nut.textContent = "🎤";
    nhan("Đã tắt micro", "", "ok");
  }

  /* API: hieu/phanTich để kiểm tra (tools/kiem_tro_giang.js); docMotCau cho nút Sửa: đọc chính tả một câu (bật micro nếu đang tắt) */
  window.TroGiang = {
    hieu: hieu,
    phanTich: phanTich,
    tim: tim,
    lam: lam,
    bat: function () { if (!dangNghe) bat(); },
    tat: function () { if (dangNghe) tat(); },
    docMotCau: function (cb) {
      if (!SR) { thongBao("Trình duyệt này không nghe được giọng nói", "Mở trang bằng Chrome hoặc Edge", true); return false; }
      var tuTat = !dangNghe;
      choLenh = function (cau) { cb(cau); if (tuTat) tat(); };
      if (!dangNghe) batDau();
      nhan("🎤 Cô nói nội dung cần sửa…", "", "", false);
      return true;
    }
  };

  function gan() { document.body.appendChild(nut); if (vt0) dat(vt0.x, vt0.y); }
  if (document.body) gan(); else document.addEventListener("DOMContentLoaded", gan);
  window.addEventListener("resize", datChat);
})();
