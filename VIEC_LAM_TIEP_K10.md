# Vật lí 10 trong hồ sơ: đã làm gì, làm tiếp gì

Cập nhật: 12/11/2026. Ghi chú này để lần sau làm tiếp không phải dò lại từ đầu.

## Đã có trong hồ sơ (khối 10)
- **Chương III Động lực học**: Bài 13, 14, 15. Mỗi bài có: bài giảng tương tác ("Dạy ngay", nhớ slide đang dạy theo lớp), hình SGK, khung KHBD, Bài tập (69 câu kèm hình, đáp án, lời giải), Kiểm tra nhanh, Ghi chú.
- **Chương II Động học**: bài giảng Bài 12 Chuyển động ném (ném ngang), nhúng dạng trang rời.
- **Chương II, Mở rộng cuối bài (14/11/2026)**: Bài 8 đến Bài 12, chép từ bản scan `K 10\Quân -Ch2ly.pdf` (tr. 22–58): 185 câu (2 câu trùng đã bỏ), đáp án và lời giải soạn bổ sung cho cả 185 câu, lí thuyết Bài 10–12, 61 hình cắt từ ảnh gốc giữ nguyên độ phân giải. Trang `bai-giang/k10-chuong2-mo-rong.html#B8..#B12` (5 mục "Mở rộng cuối bài" trong cây chương Động học); bài giảng Bài 12 có nút "Mở rộng cuối bài" ở hai slide cuối. File Word (công thức là Equation), mỗi bài có bản đề và bản `*_Dap_an` (đáp án, lời giải, bảng đáp án): `bai-giang/k10-c2-mr/word/` bản để dễ tìm ở thư mục `K10 chương 2- Động học/Mở rộng cuối bài (Bài 8-12)/` (công cụ dựng tự chép), và bản chép ở `OneDrive\...\K 10\Chuong2_Mo_rong_theo_bai\`. Dựng lại: `python -I -X utf8 tools/k10_chuong2_mo_rong/dung.py "<Quân -Ch2ly.pdf>" "<thư mục chép Word>"`; sửa nội dung ở `tools/k10_chuong2_mo_rong/src/p*.txt` (dòng `=> ` là đáp án, `=: ` là lời giải).
  - Cần giáo viên: duyệt đáp án (Claude giải, chưa có người duyệt). Những câu cần xem kĩ: tr. 40 câu "công thức vận tốc chạm đất" không có phương án đúng (cần sửa một phương án thành $v=\sqrt{2gh}$); tr. 39 câu "không đúng về rơi tự do" in phương án D trùng C; tr. 23 câu phương trình chậm dần đều (A và B đều có $v_0$, $a$ trái dấu); tr. 26 câu toa thứ chín (đáp 0,5 phút là thời gian đến hết toa 9); tr. 37 đồ thị trục v ghi cm/s hay m/s; tr. 56–57 câu ném đĩa (số liệu không khớp nhau); các ý Đúng/Sai về gia tốc chậm dần ghi giá trị dương: đề có chọn chiều dương thì chấm Sai, không chọn thì xét độ lớn. Rà lại chỗ phân Bài 8 / Bài 9 (câu về khái niệm gia tốc xếp Bài 8, phần còn lại Bài 9). Bài 8, 9, 10, 11 chưa có bài giảng tương tác trong hồ sơ nên mục mở rộng nằm riêng trong cây chương; khi đưa bài giảng vào thì gắn nút bằng `tools/k10_chuong2_mo_rong/nut_mo_rong.js` như Bài 12.
- **Phòng làm bài Chương II mở rộng cuối bài (14/11/2026)**, theo mẫu phòng khối 12 Chương 2: kho `D:\phong-k10-chuong2-mo-rong` (GitHub: kiemtn06-lgtm/Ch-ng-II-Ph-n-m-r-ng-cu-i-b-i, đã đẩy 14/11/2026; Render đã chạy, kiểm tra từ ngoài đạt). 184 câu (B10-I-12 không có phương án đúng nên chưa đưa vào), 7 nhóm theo bài và dạng, đề ôn ngẫu nhiên 18-4-6, in giấy, xuất Word (công thức Equation). Động cơ thêm: chấm nhận dấu trừ "−", "–"; đáp án thay thế `alt` (B8-III-01, B9-D1-III-08 nhận cả độ lớn); nút "±" cạnh ô trả lời ngắn. Hồ sơ đã gắn link `https://phong-k10-chuong2-mo-rong.onrender.com` (Làm bài trực tuyến khối 10, "Phòng làm bài theo chương"). Tạo lại dữ liệu: `python -I -X utf8 tools/k10_chuong2_mo_rong/tao_phong.py D:\phong-k10-chuong2-mo-rong` rồi `node tools/kiem_tra.js` trong kho phòng.
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

## Góp ý của giáo viên ngày 12/11/2026 (LÀM Ở PHIÊN SAU, ưu tiên cao nhất)
Mục tiêu: bài giảng tương tác ở mức xuất sắc nhất. Sửa trong `tools/va_bai_giang_roi.js` (không sửa file nguồn), áp dụng cho Bài 12, 13, 14, 15.
1. **Bố cục các câu chọn chưa phù hợp.** Ví dụ Bài 13, slide "Mặt phẳng nghiêng": ô chọn thả xuống bị cắt chữ ("kéo vật trượt xuống dọc mặt…"), hai nút P sinα / P cosα rớt xuống dòng riêng, lệch hàng. Cần rà TẤT CẢ các slide có `select[data-o]`, `.msel`, thẻ kéo thả, điền khuyết, chỗ trống "?" ở cả 4 bài và sửa bố cục cho gọn, thẳng hàng, không cắt chữ (ví dụ mỗi dòng một cụm "nhãn + ô chọn", ô chọn đủ rộng hoặc dùng nút thay cho ô thả xuống khi lựa chọn ngắn). Kiểm tra lại bằng `HSDH_KT` và xem bằng mắt từng slide.
2. **Âm thanh cho mọi tương tác.** Mỗi lần bấm (Kiểm tra, chọn đáp án, chọn ô, thả thẻ, Đúng/Sai, Hiện đáp án, Thêm điểm, Thả xe, kéo thanh trượt, bấm ô số...) nên có tiếng: đúng thì tiếng vui, sai thì tiếng nhẹ, bấm thường thì tiếng "tách" ngắn. Trang nguồn đã có `sfx(ok)` và `tick()` (Web Audio) nhưng chỉ dùng ở một số chỗ (câu củng cố, ô số): cần phủ rộng, nhớ `checkSel`/`showSel`, kéo thả, điền khuyết, mô phỏng. Làm bằng một lớp chung trong bản vá, thêm nút bật/tắt tiếng ở thanh dưới.
3. **Đọc to sai chữ "khác 0".** Nút 🔊 (hàm `speakQ`) đọc "khác 0" nghe không ra chữ "không" (đọc số "0" hoặc nuốt chữ). Cần chuẩn hóa văn bản trước khi đọc: "≠ 0", "khác 0" → "khác không"; "= 0" → "bằng không"; "0" đứng riêng → "không"; rà luôn các ký hiệu khác (°, m/s², N, F₁, √, ², cos, sin, vectơ) để đọc đúng tiếng Việt. Thêm bộ kiểm tra: chạy hàm chuẩn hóa trên mọi câu ở ô số khởi động (`QZ`) và mọi câu hỏi, in ra các chỗ còn nghi ngờ để xem.

4. **Không gõ được dấu trừ khi đáp án âm (ví dụ "-2"), rà cả khối 10, 11, 12.** Nguyên nhân: ô trả lời ngắn đặt `inputmode="decimal"`, trên điện thoại (nhất là iPhone) bàn phím số này không có phím "-". Khắc phục được. Cách làm: đổi ô đáp án sang `inputmode="text"` (bàn phím đầy đủ, có dấu trừ) HOẶC giữ bàn phím số và thêm nút "±" cạnh ô để đổi dấu (nên làm cả hai: nút "±" và chấp nhận các kiểu dấu trừ "-", "−", "–" khi chấm). Kiểm tra hàm chấm vẫn nhận "-2", "−2", "-2,0", "-2.0". Các chỗ đã tìm thấy `inputmode="decimal"` ở ô đáp án:
   - Phòng làm bài: `D:\phong-lam-bai-10\public\index.html`, `D:\phong-lam-bai-11\GKI_Li11_phong_lam_bai\public\index.html`, `D:\phong-luyen-vat-li-nhiet\public\index.html` (khối 12), và bản mẫu trong `D:\GKI_Li11_goi_chuyen_phong\mau_phong_lam_bai` (cần xem). Lưu ý: đẩy mã phòng lên GitHub làm Render khởi động lại và XÓA bài làm đang có, không đẩy khi học sinh đang làm; hỏi giáo viên trước khi đẩy.
   - Hồ sơ: `on-tap/k12-chuong2.html`, `bai-giang/k12-chuong2.html`, `chuong-1-vat-li-nhiet/bai-tra-loi-ngan-vat-li-nhiet.html`, `bai-giang/k10-B12..B15.html` (sửa qua bản vá hoặc công cụ dựng, không sửa file nguồn).

## Làm tiếp (xếp theo thứ tự nên làm)
1. **Đẩy lên GitHub**: các thay đổi mới lưu trong máy (commit), chưa đẩy. Hai video (36 MB) không đưa lên, đã ghi trong `.gitignore`.
2. **Bài 16 đến 22** (định luật 3 Newton, trọng lực và lực căng, ma sát, lực cản và lực nâng, moment lực, thực hành): chưa có trang bài giảng tương tác. Khi có file .html cùng kiểu Bài 13–15 thì thêm vào `tools/dung_k10.sh` và `tools/noi_dung_k10_chuong3.json` rồi dựng lại.
3. **Ngân hàng câu hỏi Word** (`4- 2026- 2027\K 10\Tài liệu 10 GV-HK1-2026-2027.docx`, Chương III từ Bài 13 đến Bài 22: có 29 công thức MathType và 73 hình): chưa chuyển. Dùng cho phòng làm bài trực tuyến chương III theo `D:\phong-luyen-vat-li-nhiet\QUY_TRINH_TAO_PHONG_MOI.md` (kho GitHub và Render riêng). Lưu ý hồ sơ hiện chỉ gắn được một địa chỉ phòng cho mỗi khối.
4. **Mức độ câu hỏi** (nhận biết, thông hiểu, vận dụng): câu lấy từ bài giảng chưa có mức độ nên bộ lọc mức độ ở tab Bài tập chưa dùng được cho khối 10.
5. **Trang Ôn tập** chương III (lịch ôn, thẻ ghi nhớ, đề tổng hợp như Lí 12 chương II): chưa có.
6. **Bài 12 ném ngang**: thuộc thế hệ trang cũ (chữ nhỏ hơn, công thức chưa dùng KaTeX, nhãn vận tốc ở slide 11 còn nhỏ). Nên nâng lên cùng khung với Bài 13–15 và đưa câu hỏi vào dữ liệu chương II.
7. Kho mẫu `D:\phong-luyen-vat-li-nhiet` còn 1 commit chưa đẩy (quy trình, công cụ kiểm tra, mẫu Word).
