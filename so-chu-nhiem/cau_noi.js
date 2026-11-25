/* CẦU NỐI SỔ CHỦ NHIỆM ↔ APPS SCRIPT. Trang sổ (index.html, phieu.html) viết để chạy trong Apps Script và gọi máy chủ bằng
   google.script.run.withSuccessHandler(..).withFailureHandler(..).goi(yeuCau). Khi sổ nằm trong hồ sơ (GitHub Pages),
   tệp này tạo một google.script.run giả: gửi yêu cầu bằng fetch POST tới web app, hàm doPost(e) trong Code.gs gọi lại goi().
   - Dữ liệu vẫn nằm trong Google Sheet, mã truy cập và phân quyền vẫn do Code.gs kiểm tra. Trang này không chứa dữ liệu hay mã nào.
   - Gửi dạng text/plain (không có tiêu đề riêng) để trình duyệt không hỏi trước (preflight): Apps Script không trả lời được bước đó.
   - "duongDan" (nút Nhập phiếu từ ảnh) trả địa chỉ trang phiếu nằm cạnh trang này, không hỏi máy chủ.
   Đổi địa chỉ web app: sửa API dưới đây (dựng lại bằng node tools/dung_so_chu_nhiem.js không ghi đè tệp này). */
(function () {
  var API = "https://script.google.com/macros/s/AKfycbxhoRJbCEg22IeDkhSJ6XImhifLZyKGZO2s5BK4oDEs6tXZVayoxA0Xzy2-ZXNAHGDA/exec";
  if (window.google && google.script && google.script.run) return;   // đang chạy thật trong Apps Script
  function goi(yc, ok, loi) {
    ok = ok || function () {}; loi = loi || function () {};
    if (yc && yc.viec === "duongDan") {
      var u = new URL("phieu.html", location.href).href;
      return setTimeout(function () { ok(JSON.stringify({ ok: true, url: u })); }, 0);
    }
    fetch(API, { method: "POST", body: JSON.stringify(yc || {}), redirect: "follow", cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("Máy chủ sổ trả lỗi " + r.status); return r.text(); })
      .then(function (s) {
        if (/^\s*</.test(s)) throw new Error("Máy chủ sổ chưa nhận yêu cầu từ hồ sơ: cần thêm hàm doPost vào Code.gs và triển khai bản mới (New version).");
        ok(s);
      })
      .catch(function (e) {
        loi({ message: e && /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "Mất kết nối tới máy chủ sổ (kiểm tra mạng; web app phải để quyền truy cập Anyone)." : (e && e.message) || "Mất kết nối" });
      });
  }
  function R(ok, loi) {
    return { withSuccessHandler: function (f) { return R(f, loi); }, withFailureHandler: function (f) { return R(ok, f); },
             goi: function (yc) { goi(yc, ok, loi); } };
  }
  window.google = window.google || {};
  google.script = { run: R(null, null) };
})();
