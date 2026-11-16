# Vật lí 11 trong hồ sơ: đã làm gì, làm tiếp gì

Cập nhật: 16/11/2026. Ghi chú này để lần sau làm tiếp không phải dò lại từ đầu.

## Nguồn (thư mục `K11/` của hồ sơ, không đưa lên GitHub)
- `Bài 8 Mô_Tả_Sóng.pptx`, `Bài 9 - Sóng_Ngang_và_Sóng_Dọc.pptx`: mỗi file 15 slide, mỗi slide là một ảnh (làm bằng NotebookLM).
- `L11_ BÀI TẬP VẬT LÍ 11 _ HKI 2026_GV.pdf`: tên đuôi .pdf nhưng thực chất là file Word (bản giáo viên, đáp án gạch chân). Bản giống hệt: `OneDrive\Fujitsu\4- 2026- 2027\K11\L11_ BÀI TẬP VẬT LÍ 11 _ HKI 2026_GV -In.docx`.

## Đã có trong hồ sơ (khối 11)
- **Bài tập theo bài, học kì I**: 211 câu (130 trắc nghiệm, 22 đúng sai, 42 trả lời ngắn, 17 tự luận), 61 hình, 12 bài: Chương I Bài 1–6, Chương II Bài 8, 9, 11, 12, 13, 15 (tập bài tập không có Bài 7, 10, 14). Trang `bai-giang/k11-bai-tap.html#B1..#B15`, gắn trong cây chương Dao động (6 mục) và Sóng (6 mục). Mỗi câu có nút "Đáp án"; đáp án lấy theo bản giáo viên. File Word (công thức là Equation): từng bài và từng chương, bản đề và bản `*_Dap_an`, ở `bai-giang/k11-bt/word/` và bản chép ở `K11/Bài tập theo bài/`.
- **Phòng làm bài Chương II Sóng (16/11/2026)**: kho `D:\phong-tuong-tac-k11-chuong-2` (GitHub: kiemtn06-lgtm/Phong-tuong-tac-k11-chuong-2, đã đẩy 16/11/2026). 90 câu (58 TN, 11 ĐS, 21 TLN) của Bài 8, 9, 11, 12, 13, 15, 6 nhóm theo bài, đề ôn ngẫu nhiên 18-4-6, in giấy, xuất Word. Đã có phần nhận đáp án gửi muộn (trễ cho phép 5 giây, muộn thì không tính điểm) và nút "±". Đã chạy thử cục bộ: gửi kịp, gửi 2 giây sau khi đóng (tính điểm), gửi 6 giây sau (ghi muộn). Hồ sơ đã gắn link `https://phong-tuong-tac-k11-chuong-2.onrender.com` (Làm bài trực tuyến khối 11). CHƯA tạo dịch vụ Render (giáo viên làm: New, Blueprint, chọn kho, nhập TEACHER_PASS). Tạo lại dữ liệu: `python -I -X utf8 tools/k11_bai_tap/tao_phong.py D:\phong-tuong-tac-k11-chuong-2` rồi `node tools/kiem_tra.js` trong kho phòng. Kho được lập bằng `tools/k11_bai_tap/tao_kho_phong.py` từ kho phòng K10.
- **Bài giảng Bài 8, Bài 9** (chương Sóng): `bai-giang/k11-B8.html`, `bai-giang/k11-B9.html`. Trình chiếu ảnh: phím ← →, phím O xem tất cả slide, phím F toàn màn hình, nút "Bài tập cuối bài" (phím B) mở bài tập của bài, nút "👥 Lớp" (Gọi tên, Bấm giờ, Chia nhóm, Ghi chú) như bài giảng khối 10. Mở đúng slide theo địa chỉ `k11-B8.html#B8@5`.

## Cách dựng lại
1. Khi có bản Word bài tập mới: `python -I -X utf8 tools/k11_bai_tap/tach_docx.py "<file Word>" --ghi-de` : tách lại `tools/k11_bai_tap/src/B*.txt` và hình `bai-giang/k11-bt/h/`. Lệnh này GHI ĐÈ mọi chỗ đã sửa tay trong `src`.
2. Sửa nội dung: sửa thẳng `tools/k11_bai_tap/src/B*.txt` (dòng `=> ` là đáp án, `=: ` là lời giải/hướng dẫn, `[[IMG tên bề_rộng_cm]]` là hình), rồi `python -I -X utf8 tools/k11_bai_tap/dung.py` : dựng `du-lieu.js` và 28 file Word.
3. Bài giảng: `python -I -X utf8 tools/k11_bai_giang/dung.py` (thêm bài mới: thêm một mục vào `BAI` trong file đó và một dòng trong `nguon/config.js`).
4. `node tools/dong_goi.js` : gộp thành `Ho-so-day-hoc-so.html`.

Công cụ: `tools/k11_bai_tap/mtef.py` chuyển công thức MathType sang LaTeX; phần dựng Word dùng lại `tools/k10_chuong2_mo_rong/dung.py`.

## Cần giáo viên duyệt
- [ ] 6 câu phần I mà bản Word gạch chân từ hai phương án trở lên, đáp án đã xác định lại theo kiến thức (danh sách `SUA_DA` trong `tach_docx.py`): Bài 3 câu 2 (C), câu 3 (C), câu 4 (B), câu 8 (C); Bài 5 câu 10 (C); Bài 11 câu 2 (B).
- [x] Bài 3 phần I câu 4: phương án D trong bản Word trùng A; đã sửa D thành $a=\omega^2A\sin(\omega t+arphi)$ trong `src/B03.txt` (đáp án vẫn là B).
- [ ] Hai hình trôi nổi trong Word được chuyển sang câu kế tiếp vì câu trước không nhắc tới hình: Bài 13 phần I (hình bộ thí nghiệm sóng dừng, câu "dây PQ hình"), Bài 15 phần I câu 2 (hình bộ thí nghiệm đo tốc độ truyền âm). Nên lướt lại vị trí hình ở các bài.
- [x] Bài giảng Bài 8 slide 1: đã xóa ô chữ mẫu "Giáo viên: Thầy Nguyễn Văn A, Lớp: 11A1". Bài 9 slide 8: hàng nhãn trên bị lỗi chữ ("Thờu gian", "Thờn gian") đã thay bằng chữ "Thời gian 1/2/3" chép từ hàng nhãn dưới. Sửa trên ảnh khi dựng (`SUA_ANH` trong `tools/k11_bai_giang/dung.py`), file .pptx gốc không đổi.
- Bài 8 slide 11 (sự trễ pha theo không gian): kiến thức đúng (λ/4 trễ π/2, λ/2 trễ π); đường sóng vẽ nền chỉ để trang trí, không đúng tỉ lệ (O đến M trên hình khoảng 1,5 bước sóng).

## Làm tiếp
1. **Tạo dịch vụ Render** cho phòng Chương II Sóng (xem `HUONG_DAN.md` trong kho phòng). Phòng cho Chương I Dao động (104 câu chấm tự động được) chưa làm: cần kho GitHub mới, chạy `tao_phong.py` với `CHUONG = 'C1'`.
2. Bài giảng các bài còn lại của Chương I, II (trong `OneDrive\Fujitsu\Tài liệu 11` có BÀI 1–7 dạng .pptx).
3. Dữ liệu bài (kiến thức trọng tâm, KHBD, kiểm tra nhanh) cho chương Dao động, Sóng như Chương III khối 10: chưa có, nên hai chương mới hiện ở dạng danh sách trang.
4. Đã commit và đẩy GitHub (16/11/2026).
