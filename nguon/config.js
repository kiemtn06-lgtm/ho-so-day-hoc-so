/* CẤU HÌNH HỒ SƠ DẠY HỌC SỐ. Sửa file này rồi chạy: node tools/dong_goi.js
   - Chương có dữ liệu: ghi duLieu (mã file trong nguon/data) và baiGiang (file trình chiếu).
   - Chương chưa có: chỉ ghi tên, sẽ hiện "chưa có dữ liệu".
   Tên chương theo chương trình GDPT 2018, bộ KNTT. [CẦN KIỂM TRA] với SGK thật. */
window.HO_SO = {
  ten: "Hồ sơ dạy học số",
  namHoc: "2026-2027",
  khoiMacDinh: "12",
  congCu: [
    { id: "on", ten: "Ôn tập", moTa: "Lịch ôn, thẻ ghi nhớ, đề tổng hợp (trang cho học sinh)",
      khoi: { 12: "https://k12-chatkhi-alfajores-8ed3b2.netlify.app" } },
    { id: "ph", ten: "Phòng làm bài", moTa: "Mở phòng, học sinh làm và nộp bài",
      khoi: { 11: "https://phong-lam-bai-li11.onrender.com" } },
    { id: "de", ten: "Soạn đề", moTa: "Soạn đề theo ma trận và đặc tả",
      ghiChu: { 10: "Dùng skill soan-de-vat-li-10 trong Claude Code", 11: "Dùng skill soan-de-vat-li-11 trong Claude Code" }, khoi: {} },
    { id: "mp", ten: "Mô phỏng", moTa: "Mô phỏng tương tác cho từng bài", khoi: {} },
    { id: "cb", ten: "Chatbot", moTa: "Hỏi đáp có trích nguồn SGK", khoi: {} },
    { id: "nb", ten: "NotebookLM", moTa: "Sổ tay đọc SGK (dùng cá nhân)", khoi: {} }
  ],
  khoi: {
    10: { ten: "Vật lí 10", chuong: [
      { ten: "Mở đầu" }, { ten: "Mô tả chuyển động" }, { ten: "Ba định luật Newton và một số lực" },
      { ten: "Năng lượng, công, công suất" }, { ten: "Động lượng" }, { ten: "Chuyển động tròn" }, { ten: "Biến dạng của vật rắn" } ] },
    11: { ten: "Vật lí 11", chuong: [
      { ten: "Dao động" }, { ten: "Sóng" }, { ten: "Điện trường" }, { ten: "Dòng điện, mạch điện" } ] },
    12: { ten: "Vật lí 12", chuong: [
      { ten: "Vật lí nhiệt" },
      { ten: "Khí lí tưởng", duLieu: "12-2", baiGiang: "bai-giang/k12-chuong2.html" },
      { ten: "Từ trường" },
      { ten: "Vật lí hạt nhân và phóng xạ" } ] }
  }
};
