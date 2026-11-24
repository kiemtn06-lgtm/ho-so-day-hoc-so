# Phòng làm bài K11 · "Mở rộng ôn tập HK I" (ghép ngày 24/11/2026)

Nguồn: tệp `_11A5_-_ON_THI_HK_I_2025_-_Trac_nghiem_...docx` (198 câu trắc nghiệm, đáp án đánh dấu `*`).
Ghép vào phòng Vật lí 11 hiện có (không tạo phòng mới): thêm 7 nhóm 7–13 tên "Mở rộng ôn tập HK I · …", **181 câu**, 17 hình. Đề ôn trộn ngẫu nhiên cũ vẫn chỉ bốc trong 6 nhóm Bài 8–15 cũ.

| Nhóm | Nội dung | Số câu |
|---|---|---|
| 7 | Dao động điều hòa | 34 |
| 8 | Dao động tắt dần. Dao động cưỡng bức. Cộng hưởng | 17 |
| 9 | Sóng cơ. Mô tả sóng. Sóng ngang, sóng dọc | 43 |
| 10 | Sóng điện từ | 9 |
| 11 | Giao thoa sóng | 25 |
| 12 | Sóng dừng | 36 |
| 13 | Sóng âm. Đo tốc độ truyền âm | 17 |

## Cô cần xem
1. **Công thức bị mất trong tệp Word, em đã gõ lại** (tệp chỉ còn dòng báo lỗi "Mathml can't be rendered"). Đáp án giữ đúng dấu `*` của tệp; phương án nhiễu em tự đặt. 26 câu (mã trong phòng, số câu trong tệp): HK1-DDH-04 (4), DDH-08 (10), DDH-15 (19), DDH-22 (33), DDH-27 (38), DDH-28 (39), SC-17 (79), SC-20 (82), GT-05 (124), GT-06 (125), GT-09 (128), GT-13 (132), GT-14 (133), GT-21 (140), GT-22 (141), GT-23 (142), SD-07 (152), SD-08 (153), SD-09 (154), SD-10 (155), SD-16 (161), SD-17 (162), SD-19 (164), SA-08 (189), SA-14 (195), SA-15 (196). Trang giáo viên hiện ghi chú "đã gõ lại" ở các câu này.
2. **Bỏ 2 câu vì mất cả dữ kiện của đề**: câu 83 (phương trình nguồn u_O, vị trí M, 4 phương án) và câu 144 (phương trình sóng tại A, 4 phương án biên độ tổng hợp). Cô gửi bản Word gốc có công thức thì em bổ sung.
3. **Bỏ 15 câu trùng nguyên văn** (câu bỏ → câu giữ): 7→6, 9→8, 11→10, 13→12, 20→18, 22→21, 23→19, 28→24, 29→25, 30→26, 31→27, 92→70, 96→79, 97→80, 105→86.
4. **Chỗ tệp gốc có vẻ sai, em giữ nguyên đáp án**:
   - Câu 16: hỏi "Đại lượng φ₀ được gọi là", đáp án đánh dấu là "pha của dao động" (φ₀ là *pha ban đầu*; pha dao động là ωt + φ₀).
5. **Chỗ em sửa lỗi dựng/chính tả của tệp**: câu 35 ("sớm [công thức] với vận tốc" → "sớm pha π/2 so với vận tốc"); câu 90 (hai phương án đều là "C.", đổi phương án cuối thành D); câu 64 (lặp "phần tử phần tử"); câu 146 (hình 1 dính vào phương án A, đưa lên đề); câu 198 (dòng "HẾT" dính vào đề).
6. **Hình**: 17 hình cắt đúng như trong Word; 11 hình sóng dừng (hình 2) bị Word cắt dở dòng chú thích nên em xóa phần chữ thừa, giữ nguyên dây và giá đỡ; hiện rộng hơn để đọc được nhãn A, B, C, D, E, F.
7. Một số câu chưa có lời giải (tệp không có); phòng chỉ hiện đáp án đúng.

## Tạo lại (khi sửa)
`python -I -X utf8 tools/k11_bai_tap/tach_11a5.py "<tệp .docx>"` → sửa công thức trong `tools/k11_bai_tap/hk1/sua_ct.py` → `python -I -X utf8 tools/k11_bai_tap/chuan_hk1.py` → `python -I -X utf8 tools/k11_bai_tap/tao_phong_hk1.py D:\phong-tuong-tac-k11-chuong-2` → `node tools/kiem_tra.js` trong kho phòng. (Không chạy `tao_phong.py` lên kho phòng này nữa: nó dựng lại 6 nhóm cũ và làm mất 2 câu Bài 9 thêm tay.)
