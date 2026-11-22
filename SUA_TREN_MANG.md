# Nhật kí sửa theo phiếu trên GitHub

Claude trên GitHub (quy trình `.github/workflows/claude-sua.yml`) ghi mỗi lần sửa vào đầu bảng.
Trên máy giáo viên: dòng nào cột cuối là `chưa` thì phải áp bản sửa vào tệp nguồn trên máy trước khi dựng lại trang (xem CLAUDE.md).

| Ngày | Phiếu | Tệp đã sửa | Cũ → mới | Đã áp vào nguồn trên máy |
|---|---|---|---|---|
| 2026-11-22 | #12 | bai-giang/k10-B14.html | Slide 13 (#13) "Quán tính trong đời sống": thay 2 ảnh tĩnh (Hình 14.4 đầu búa, 14.5 giật giấy) bằng mô phỏng SVG động có nút ▶ (đập cán xuống đất; giật mạnh / kéo từ từ) + Đặt lại; thêm hàm `svgRun` ở đầu một thẻ script | chưa |
| 2026-11-22 | #10 | bai-giang/k10-B13.html, tools/k10_bai_giang/mo_phong/B13.js | Slide 16 (@15) "Bài toán dây phơi": khung công thức/đáp án T = P/(2·sin α) mặc định ẩn, thêm nút "Hiện đáp án" / "Ẩn đáp án" cho giáo viên bật (hàm treo thêm tham số anDapAn, chỉ dây phơi dùng) | chưa |
| 2026-11-22 | #8 | bai-giang/k10-B13.html, tools/k10_bai_giang/mo_phong/B13.js | Slide 14 "Luyện tập dạng 2: Đúng/Sai" (ảnh): thêm mô phỏng tương tác chọn Đúng/Sai 4 ý + Kiểm tra + lời giải (đăng kí chỉ số 13 trong trang, 14 trong B13.js theo đánh số cũ có slide Mini-quiz). Ảnh slide giữ nguyên | chưa |
| 2026-11-22 | #7 | bai-giang/k10-B13.html, bai-giang/k10-B13/s08..s19.jpg | Bỏ slide 8/19 "Mini-quiz (củng cố tiết 1)": xóa ảnh s08, đánh số lại s09-s19 → s08-s18, bỏ tên slide, lùi chỉ số mô phỏng từ 8,9,10,11,12,15,16 → 7,8,9,10,11,14,15. Khi dựng lại từ pptx (dung.py) phải bỏ slide 8 và lùi chỉ số trong tools/k10_bai_giang/mo_phong/B13.js, dung.py (slide, xoa ảnh) | chưa |
| 2026-11-20 | #3 | bai-giang/k10-B13-tuong-tac.html (trước là k10-B13.html) | Củng cố 2, câu 3 (Đúng/Sai) ý a, b: F<sub>K</sub>, F<sub>c</sub> → thêm kí hiệu vectơ (→) trên F | đã áp 2026-11-22 (vào `tools/va_bai_giang_roi.js`) |
| 2026-11-18 | #2 | nguon/data/k12-2.js, Ho-so-day-hoc-so.html | Câu B8-TN2: "...các hạt khói chuyển động" → "...các hạt khói chuyển động như thế nào?" | chưa |
