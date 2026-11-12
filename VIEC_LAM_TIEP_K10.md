# Vật lí 10 trong hồ sơ: đã làm gì, làm tiếp gì

Cập nhật: 12/11/2026. Ghi chú này để lần sau làm tiếp không phải dò lại từ đầu.

## Đã có trong hồ sơ (khối 10)
- **Chương III Động lực học**: Bài 13, 14, 15. Mỗi bài có: bài giảng tương tác ("Dạy ngay", nhớ slide đang dạy theo lớp), hình SGK, khung KHBD, Bài tập (69 câu kèm hình, đáp án, lời giải), Kiểm tra nhanh, Ghi chú.
- **Chương II Động học**: bài giảng Bài 12 Chuyển động ném (ném ngang), nhúng dạng trang rời.
- Nguồn: `OneDrive\Fujitsu\Tài liệu 10\04_Chương III - Động lực học\*.html`. File nguồn không bị sửa.

## Cách dựng lại (khi sửa file nguồn hoặc sửa bản vá)
1. `sh tools/dung_k10.sh` : dựng 4 bài giảng vào `bai-giang/k10-B12..B15.html`.
2. `node tools/build_du_lieu_roi.js tools/noi_dung_k10_chuong3.json` : dựng dữ liệu chương III.
3. `node tools/dong_goi.js` : gộp thành `Ho-so-day-hoc-so.html`.
4. Rà tự động một bài giảng: mở bài qua máy chủ thử, nạp `tools/kiem_tra_bai_giang.js` rồi chạy `await HSDH_KT.tatCa()` (báo slide tràn khung, câu hỏi tràn, ảnh hỏng, công thức lỗi, nhãn vectơ đè nhau).

Các file công cụ:
- `tools/build_bai_giang_roi.js` : chép bài giảng rời vào hồ sơ, thêm mở đúng slide và báo vị trí.
- `tools/va_bai_giang_roi.js` : toàn bộ chỉnh sửa hiển thị so với file nguồn (xem danh sách bên dưới). Nếu file nguồn đổi làm bản vá không khớp, lệnh dựng sẽ dừng và báo.
- `tools/noi_dung_k10_chuong3.json` : kiến thức trọng tâm, công thức, dạng bài, lỗi hay mắc, thẻ ghi nhớ.

## Những chỗ bản trong hồ sơ khác file nguồn (chỉ hiển thị, không đổi câu hỏi và đáp án)
- Cả 3 bài 13, 14, 15: nhãn vectơ trên hình vẽ tự dời để không đè nhau, không ra ngoài hình; nút bình chọn có công thức không còn bị vỡ chữ.
- Bài 13: tách xa hai mũi tên F₁, F₂ (Hoạt động 1); mặt phẳng nghiêng vẽ mũi tên dài hơn, mặc định m = 5 kg (gốc 2 kg); công thức tổng quát nằm một dòng; hình minh hoạ hai lực vuông góc vẽ lại đúng tỉ lệ 6 : 8.
- Bài 14: chữ "tường" đổi màu cho đọc được; chữ "người" đặt phía trên hình người.
- Bài 15 (kéo thùng có ma sát): lời giải thử thách chia hai dòng cho vừa khung; khi thùng đứng yên ghi rõ "ma sát nghỉ bằng F" (gốc chỉ ghi F ≤ F_ms,max).
- Bài 12: đổi "Bài 9" thành "Bài 12" (theo SGK KNTT và tài liệu của tổ); chữ trên hình mô phỏng to hơn; khi không có video thì hiện lời nhắn thay khung đen.

## Cần giáo viên duyệt
- [ ] Đọc lại `tools/noi_dung_k10_chuong3.json` (phần kiến thức, công thức, dạng bài, lỗi hay mắc, thẻ ghi nhớ do Claude soạn từ slide và SGK).
- [ ] Bài 12: có giữ dòng "Chào mừng quý thầy cô về dự giờ – thăm lớp" ở slide đầu không; có đồng ý đổi "Bài 9" thành "Bài 12" không.
- [ ] Bài 15, slide kéo thùng: dòng "Slide gốc ghi 109,9 N; tính lại là 251,2 N" có giữ không.
- [ ] Tên chương II, III trong hồ sơ đã đổi thành "Động học", "Động lực học" (theo SGK KNTT).

## Làm tiếp (xếp theo thứ tự nên làm)
1. **Đẩy lên GitHub**: các thay đổi mới lưu trong máy (commit), chưa đẩy. Hai video (36 MB) không đưa lên, đã ghi trong `.gitignore`.
2. **Bài 16 đến 22** (định luật 3 Newton, trọng lực và lực căng, ma sát, lực cản và lực nâng, moment lực, thực hành): chưa có trang bài giảng tương tác. Khi có file .html cùng kiểu Bài 13–15 thì thêm vào `tools/dung_k10.sh` và `tools/noi_dung_k10_chuong3.json` rồi dựng lại.
3. **Ngân hàng câu hỏi Word** (`4- 2026- 2027\K 10\Tài liệu 10 GV-HK1-2026-2027.docx`, Chương III từ Bài 13 đến Bài 22: có 29 công thức MathType và 73 hình): chưa chuyển. Dùng cho phòng làm bài trực tuyến chương III theo `D:\phong-luyen-vat-li-nhiet\QUY_TRINH_TAO_PHONG_MOI.md` (kho GitHub và Render riêng). Lưu ý hồ sơ hiện chỉ gắn được một địa chỉ phòng cho mỗi khối.
4. **Mức độ câu hỏi** (nhận biết, thông hiểu, vận dụng): câu lấy từ bài giảng chưa có mức độ nên bộ lọc mức độ ở tab Bài tập chưa dùng được cho khối 10.
5. **Trang Ôn tập** chương III (lịch ôn, thẻ ghi nhớ, đề tổng hợp như Lí 12 chương II): chưa có.
6. **Bài 12 ném ngang**: thuộc thế hệ trang cũ (chữ nhỏ hơn, công thức chưa dùng KaTeX, nhãn vận tốc ở slide 11 còn nhỏ). Nên nâng lên cùng khung với Bài 13–15 và đưa câu hỏi vào dữ liệu chương II.
7. Kho mẫu `D:\phong-luyen-vat-li-nhiet` còn 1 commit chưa đẩy (quy trình, công cụ kiểm tra, mẫu Word).
