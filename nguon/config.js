/* CẤU HÌNH HỒ SƠ DẠY HỌC SỐ. Sửa file này rồi chạy: node tools/dong_goi.js
   - Chương có dữ liệu: ghi duLieu (mã file trong nguon/data) và baiGiang (file trình chiếu).
   - Chương chưa có: chỉ ghi tên, sẽ hiện "chưa có dữ liệu".
   Tên chương theo chương trình GDPT 2018, bộ KNTT. [CẦN KIỂM TRA] với SGK thật. */
window.HO_SO = {
  ten: "Hồ sơ dạy học số",
  namHoc: "2026-2027",
  khoiMacDinh: "12",
  /* Hỏi đáp: để trống api thì tra cứu ngay trên dữ liệu bài (không AI).
     Khi có máy chủ AI riêng, điền địa chỉ vào api: trang sẽ gửi {cau_hoi, ngu_canh} và hiện trường tra_loi nhận về. */
  chatbot: { api: "" },
  /* Phòng tương tác trên lớp (học sinh quét QR). Điền địa chỉ Render sau khi đưa máy chủ lên, ví dụ https://phong-tuong-tac.onrender.com */
  tuongTac: "",
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
        { ten: "Bài giảng Bài 12. Chuyển động ném (ném ngang)", trang: "bai-giang/k10-B12.html", ghiChu: "Bài giảng tương tác: bấm vào khung rồi dùng phím → để chuyển slide. Hai video thí nghiệm chỉ có trên máy giáo viên (thư mục bai-giang/Chuyendongnem-media), không đưa lên mạng." } ] },
      /* mỗi bài một file bài giảng: {ma} được thay bằng mã bài (B13, B14, B15). Dữ liệu: node tools/build_du_lieu_roi.js tools/noi_dung_k10_chuong3.json */
      { ten: "Động lực học", duLieu: "10-3", baiGiang: "bai-giang/k10-{ma}.html" },
      { ten: "Năng lượng, công, công suất" }, { ten: "Động lượng" }, { ten: "Chuyển động tròn" }, { ten: "Biến dạng của vật rắn" } ] },
    11: { ten: "Vật lí 11", chuong: [
      { ten: "Dao động" }, { ten: "Sóng" }, { ten: "Điện trường" }, { ten: "Dòng điện, mạch điện" } ] },
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
