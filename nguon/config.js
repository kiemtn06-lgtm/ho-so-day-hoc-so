/* CẤU HÌNH HỒ SƠ DẠY HỌC SỐ. Sửa file này rồi chạy: node tools/dong_goi.js
   - Chương có dữ liệu: ghi duLieu (mã file trong nguon/data) và baiGiang (file trình chiếu).
   - Chương chưa có: chỉ ghi tên, sẽ hiện "chưa có dữ liệu".
   Tên chương theo chương trình GDPT 2018, bộ KNTT. [CẦN KIỂM TRA] với SGK thật. */
var MR_GC = "Chép từ tài liệu scan Chương II (tr. 22–58), có tóm tắt lí thuyết (Bài 10–12) và bài tập 3 phần. Công thức hiển thị bằng KaTeX, hình cắt từ bản scan. Có file Word của bài (công thức là Equation), bản đề và bản có đáp án. Bản gốc không có đáp án; đáp án và lời giải được soạn bổ sung (bấm \"Đáp án\" ở mỗi câu), giáo viên cần duyệt lại.";
var BT11_GC = "Lấy từ tập Bài tập Vật lí 11 học kì I (bản giáo viên), xếp theo bài: trắc nghiệm, đúng sai, trả lời ngắn, tự luận. Công thức hiển thị bằng KaTeX, hình lấy từ file Word. Đáp án theo bản giáo viên (bấm \"Đáp án\" ở mỗi câu). Có file Word của bài và của chương (công thức là Equation), bản đề và bản có đáp án.";
var BG11_GC = "Bài giảng trình chiếu (15 slide): bấm vào khung rồi dùng phím ← → để chuyển slide, phím O xem tất cả slide, phím F toàn màn hình. Nút \"Bài tập cuối bài\" mở bài tập của bài kèm đáp án. Mở toàn trang để dùng nút \"Lớp\" (Gọi tên, Bấm giờ, Chia nhóm, Ghi chú).";
window.HO_SO = {
  ten: "Hồ sơ dạy học số",
  namHoc: "2026-2027",
  khoiMacDinh: "12",
  /* Hỏi đáp: để trống api thì tra cứu ngay trên dữ liệu bài (không AI).
     Khi có máy chủ AI riêng, điền địa chỉ vào api: trang sẽ gửi {cau_hoi, ngu_canh} và hiện trường tra_loi nhận về. */
  chatbot: { api: "" },
  /* Phòng tương tác trên lớp (học sinh quét QR). Điền địa chỉ Render sau khi đưa máy chủ lên, ví dụ https://phong-tuong-tac.onrender.com */
  tuongTac: "https://phong-tuong-tac.onrender.com",
  /* Phòng làm bài có máy chủ bổ sung theo chương (ngoài phòng chính của khối ở mục "ph" phía trên) */
  phongPhu: { 10: [{ ten: "Chương II · Động học · Mở rộng cuối bài", moTa: "228 câu: Chương II Bài 8-12 (7 nhóm) và Chương III. Động lực học Bài 13-15 (3 nhóm cuối)", url: "https://phong-k10-chuong2-mo-rong.onrender.com" }],
    11: [{ ten: "Chương II · Sóng", moTa: "92 câu: Bài 8, 9, 11, 12, 13, 15, 6 nhóm theo bài", url: "https://phong-tuong-tac-k11-chuong-2.onrender.com" }],
    12: [{ ten: "Chương 2 · Chất khí", moTa: "708 câu: 26 buổi luyện tập (521 câu), Mở rộng ôn tập Bài 8-12, Đề tổng hợp Bài 8-13", url: "https://phong-chuong-2-chat-khi.onrender.com" }] },
  congCu: [
    { id: "on", ten: "Ôn tập", moTa: "Lịch ôn, thẻ ghi nhớ, đề tổng hợp (trang cho học sinh)", khoi: {} },
    /* Phòng làm bài: mỗi khối một máy chủ trên Render (link cố định). Khối 12 là phòng luyện tập Vật lí nhiệt. */
    { id: "ph", ten: "Phòng làm bài", moTa: "Mở phòng, học sinh làm và nộp bài",
      khoi: { 10: "https://phong-lam-bai-li10.onrender.com", 11: "https://phong-lam-bai-li11.onrender.com", 12: "https://phong-luyen-vat-li-nhiet.onrender.com" } },
    { id: "de", ten: "Soạn đề", moTa: "Soạn đề theo ma trận và đặc tả",
      ghiChu: { 10: "Dùng skill soan-de-vat-li-10 trong Claude Code", 11: "Dùng skill soan-de-vat-li-11 trong Claude Code" }, khoi: {} },
    { id: "mp", ten: "Mô phỏng", moTa: "Mô phỏng tương tác cho từng bài", khoi: {} },
    { id: "cb", ten: "Chatbot", moTa: "Hỏi đáp có trích nguồn SGK", khoi: {} },
    { id: "nb", ten: "NotebookLM", moTa: "Sổ tay đọc SGK (dùng cá nhân)", khoi: {} }
  ],
  khoi: {
    10: { ten: "Vật lí 10", chuong: [
      { ten: "Mở đầu" },
      /* tên chương II, III theo SGK KNTT (Động học, Động lực học) */
      { ten: "Động học", luyenTap: [
        { ten: "Bài giảng Bài 12. Chuyển động ném (ném ngang)", trang: "bai-giang/k10-B12.html", ghiChu: "Bài giảng tương tác: bấm vào khung rồi dùng phím → để chuyển slide. Hai video thí nghiệm chỉ có trên máy giáo viên (thư mục bai-giang/Chuyendongnem-media), không đưa lên mạng. Phần mở rộng cuối bài: nút \"Mở rộng cuối bài\" ở hai slide cuối." },
        /* phần mở rộng cuối bài, xếp theo bài, chép từ tài liệu scan. Dựng lại: python -I -X utf8 tools/k10_chuong2_mo_rong/dung.py "<Quân -Ch2ly.pdf>" */
        { ten: "Mở rộng cuối bài · Bài 8. Gia tốc", trang: "bai-giang/k10-chuong2-mo-rong.html#B8", ghiChu: MR_GC },
        { ten: "Mở rộng cuối bài · Bài 9. Chuyển động thẳng biến đổi đều", trang: "bai-giang/k10-chuong2-mo-rong.html#B9", ghiChu: MR_GC },
        { ten: "Mở rộng cuối bài · Bài 10. Sự rơi tự do", trang: "bai-giang/k10-chuong2-mo-rong.html#B10", ghiChu: MR_GC },
        { ten: "Mở rộng cuối bài · Bài 11. Thực hành đo gia tốc rơi tự do", trang: "bai-giang/k10-chuong2-mo-rong.html#B11", ghiChu: MR_GC },
        { ten: "Mở rộng cuối bài · Bài 12. Chuyển động ném", trang: "bai-giang/k10-chuong2-mo-rong.html#B12", ghiChu: MR_GC } ] },
      /* mỗi bài một file bài giảng: {ma} được thay bằng mã bài (B13, B14, B15). Dữ liệu: node tools/build_du_lieu_roi.js tools/noi_dung_k10_chuong3.json */
      { ten: "Động lực học", duLieu: "10-3", baiGiang: "bai-giang/k10-{ma}.html" },
      { ten: "Năng lượng, công, công suất" }, { ten: "Động lượng" }, { ten: "Chuyển động tròn" }, { ten: "Biến dạng của vật rắn" } ] },
    11: { ten: "Vật lí 11", chuong: [
      /* bài tập theo bài lấy từ tập Bài tập Vật lí 11 HKI (bản giáo viên). Dựng lại: python -I -X utf8 tools/k11_bai_tap/dung.py */
      { ten: "Dao động", luyenTap: [
        { ten: "Bài tập · Bài 1. Dao động điều hòa", trang: "bai-giang/k11-bai-tap.html#B1", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 2. Mô tả dao động điều hòa", trang: "bai-giang/k11-bai-tap.html#B2", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 3. Vận tốc, gia tốc trong dao động điều hòa", trang: "bai-giang/k11-bai-tap.html#B3", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 4. Bài tập về dao động điều hòa", trang: "bai-giang/k11-bai-tap.html#B4", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 5. Động năng. Thế năng. Sự chuyển hóa năng lượng", trang: "bai-giang/k11-bai-tap.html#B5", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 6. Dao động tắt dần. Dao động cưỡng bức. Cộng hưởng", trang: "bai-giang/k11-bai-tap.html#B6", ghiChu: BT11_GC } ] },
      /* bài giảng Bài 8, 9: trình chiếu ảnh từ file .pptx trong thư mục K11. Dựng lại: python -I -X utf8 tools/k11_bai_giang/dung.py */
      { ten: "Sóng", luyenTap: [
        { ten: "Bài giảng Bài 8. Mô tả sóng", trang: "bai-giang/k11-B8.html", ghiChu: BG11_GC },
        { ten: "Bài giảng Bài 9. Sóng ngang. Sóng dọc. Sự truyền năng lượng của sóng cơ", trang: "bai-giang/k11-B9.html", ghiChu: BG11_GC },
        { ten: "Bài tập · Bài 8. Mô tả sóng", trang: "bai-giang/k11-bai-tap.html#B8", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 9. Sóng ngang. Sóng dọc", trang: "bai-giang/k11-bai-tap.html#B9", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 11. Sóng điện từ", trang: "bai-giang/k11-bai-tap.html#B11", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 12. Giao thoa sóng", trang: "bai-giang/k11-bai-tap.html#B12", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 13. Sóng dừng", trang: "bai-giang/k11-bai-tap.html#B13", ghiChu: BT11_GC },
        { ten: "Bài tập · Bài 15. Thực hành: Đo tốc độ truyền âm", trang: "bai-giang/k11-bai-tap.html#B15", ghiChu: BT11_GC } ] },
      { ten: "Điện trường" }, { ten: "Dòng điện, mạch điện" } ] },
    12: { ten: "Vật lí 12", chuong: [
      { ten: "Vật lí nhiệt", luyenTap: [
        { ten: "Luyện đúng sai", trang: "chuong-1-vat-li-nhiet/bai-day-dung-sai-vat-li-nhiet.html", ghiChu: "Bản xem và làm thử ngay trong hồ sơ. Để học sinh làm và giáo viên xem được kết quả cả lớp, dùng mục Làm bài trực tuyến." },
        { ten: "Luyện trả lời ngắn", trang: "chuong-1-vat-li-nhiet/bai-tra-loi-ngan-vat-li-nhiet.html", ghiChu: "Bản xem và làm thử ngay trong hồ sơ. Để học sinh làm và giáo viên xem được kết quả cả lớp, dùng mục Làm bài trực tuyến." } ] },
      { ten: "Khí lí tưởng", duLieu: "12-2", baiGiang: "bai-giang/k12-chuong2.html",
        /* trang Ôn tập nhúng trong hồ sơ: ngày ôn của từng bài, và các bài có phần Mở rộng ôn tập */
        onTap: "on-tap/k12-chuong2.html",
        onTapNgay: { B8: "n1", B9: "n1", B10: "n2", B11: "n2", B12: "n3", B13: "n3" },
        onTapMoRong: ["B8", "B9", "B10", "B11", "B12"] },
      { ten: "Từ trường" },
      { ten: "Vật lí hạt nhân và phóng xạ" } ] }
  }
};
