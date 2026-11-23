# -*- coding: utf-8 -*-
"""Đưa BÀI GIẢNG khối 12 dạng trình chiếu ảnh (file .pptx mỗi slide là một ảnh, làm bằng NotebookLM) vào hồ sơ.

Chạy:  python -I -X utf8 tools/k12_bai_giang/dung.py
Dùng lại khung của tools/k11_bai_giang (trang trình chiếu, công cụ lớp). Khác K11: nguồn là thư mục K12/chương 2- Chất khí,
mã dữ liệu '12-2', ảnh vào bai-giang/k12-B11/s01.jpg ..., trang bai-giang/k12-B11.html, nút "Bài tập cuối bài" mở
on-tap/k12-chuong2.html#bt-11 (bài tập có sẵn của hồ sơ, không đổi); mỗi bài trong BAI.
File .pptx gốc không bị sửa. Chỉ lấy các slide là MỘT ẢNH (slide có chữ thật như slide QR cuối file pptx bị bỏ qua,
vì trang web đã có nút "Bài tập cuối bài").
"""
import os, io, json, subprocess, importlib.util
from PIL import Image, ImageDraw
from pptx import Presentation

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
spec = importlib.util.spec_from_file_location('dung11', os.path.join(REPO, 'tools', 'k11_bai_giang', 'dung.py'))
d11 = importlib.util.module_from_spec(spec); spec.loader.exec_module(d11)

NGUON = os.path.join(REPO, 'K12', 'chương 2- Chất khí')
d11.KHOA = '12-2'

BAI = {
    'B11': dict(file='VL12_Bai11_Phuong_trinh_trang_thai_khi_li_tuong.pptx', ten='Bài 11. Phương trình trạng thái của khí lí tưởng', slide=[
        'Bài 11: Phương trình trạng thái của khí lí tưởng', 'Khởi động: quan sát thực tế', 'Vấn đề đặt ra: ba thông số cùng thay đổi',
        'Ôn tập: định luật Boyle và Charles', 'Thiết lập phương trình: trạng thái (1) → (1′)', 'Thiết lập phương trình: trạng thái (1′) → (2)',
        'Từ phương trình trạng thái suy ra các định luật', 'Ví dụ 1: ba thông số cùng đổi', 'Phương trình Clapeyron', 'Hằng số khí và đơn vị chuẩn (SI)',
        'Ví dụ 2: dùng phương trình Clapeyron', 'Lỗi hay mắc khi làm bài tập', 'Vận dụng thực tế', 'Tổng kết bài học']),
    'B12': dict(file='VL12_Bai12_Ap_suat_khi_theo_mo_hinh_dong_hoc_phan_tu_v2.pptx', ten='Bài 12. Áp suất khí theo mô hình động học phân tử', slide=[
        'Bài 12: Áp suất khí theo mô hình động học phân tử', 'Mục tiêu bài học', 'Khởi động: áp suất khí phụ thuộc vào đâu?',
        'Thiết lập mô hình khảo sát', 'Một phân tử va chạm đàn hồi với thành bình', 'Lực và áp suất do một phân tử gây ra',
        'N phân tử và hệ thức (12.1)', 'Hệ thức (12.2): áp suất và động năng', 'Hằng số Boltzmann',
        'Hệ thức (12.3): động năng và nhiệt độ', 'Nhiệm vụ Năng lực số', 'Nhiệm vụ Năng lực AI',
        'Luyện tập: trả lời khởi động và hệ quả', 'Vận dụng: định luật Boyle và quá trình đẳng tích', 'Tổng kết và dặn dò']),
}

# Chỉnh trên ảnh slide (toạ độ theo ảnh 1376x768). ('trang', (x0, y0, x1, y1)) tô trắng một vùng.
# B11 slide 5: NotebookLM để lại một khung xám trống bên phải (hình bị thiếu) nên tô trắng, giữ nguyên dấu "Gemini Notebook" ở góc.
SUA_ANH = {
    ('B11', 5): [('trang', (905, 125, 1376, 748))],
}


def sua(im, viec):
    for v in viec:
        if v[0] == 'trang':
            ImageDraw.Draw(im).rectangle(v[1], fill=(255, 255, 255))
    return im


TRANG = d11.TRANG.replace('Vật lí 11', 'Vật lí 12').replace('🌊 Mô phỏng', '📐 Mô phỏng')
for a, b in [('THU="k11-"+MA+"/"', 'THU="k12-"+MA+"/"'),
             ('f.src="k11-bai-tap.html#"+MA', 'f.src="../on-tap/k12-chuong2.html#bt-"+MA.slice(1)')]:
    assert TRANG.count(a) == 1, 'Khung trang K11 đã đổi, cập nhật dung.py: ' + a
    TRANG = TRANG.replace(a, b)


def anh_slide(pptx):
    out = []
    for s in Presentation(pptx).slides:
        pics = [sh for sh in s.shapes if sh.shape_type == 13]
        if len(s.shapes) == 1 and len(pics) == 1:
            out.append(pics[0].image.blob)
    return out


def main():
    for ma, B in BAI.items():
        f = os.path.join(NGUON, B['file'])
        if not os.path.exists(f):
            print('Bỏ qua', ma, ': không thấy', f); continue
        anh = anh_slide(f)
        assert len(anh) == len(B['slide']), '%s: %d slide ảnh nhưng có %d tên slide' % (ma, len(anh), len(B['slide']))
        thu = os.path.join(REPO, 'bai-giang', 'k12-' + ma); os.makedirs(thu, exist_ok=True)
        tong = 0
        for i, b in enumerate(anh, 1):
            im = Image.open(io.BytesIO(b)).convert('RGB').resize((1376, 768), Image.LANCZOS)
            if (ma, i) in SUA_ANH: im = sua(im, SUA_ANH[(ma, i)])
            g = os.path.join(thu, 's%02d.jpg' % i); im.save(g, quality=88, optimize=True); tong += os.path.getsize(g)
        for k in range(len(anh) + 1, 40):      # xoá ảnh thừa của lần dựng trước
            g = os.path.join(thu, 's%02d.jpg' % k)
            if os.path.exists(g): os.remove(g)
        cc = d11.cong_cu_lop(ma)
        h = (TRANG.replace('__TEN__', B['ten']).replace('__MA__', json.dumps(ma)).replace('__SLIDE__', json.dumps(B['slide'], ensure_ascii=False))
             .replace('__MP__', '').replace('__CSS__', cc['css']).replace('__JS__', cc['js'].replace('</script', '<\\/script')))
        dich = os.path.join(REPO, 'bai-giang', 'k12-%s.html' % ma)
        open(dich, 'w', encoding='utf8').write(h)
        subprocess.run(['node', os.path.join(REPO, 'tools', 'gan_nut_sua.js'), dich], check=True, stdout=subprocess.DEVNULL)   # nút ✎ Sửa
        print(ma, B['ten'], '·', len(anh), 'slide ·', round(tong / 1048576, 2), 'MB ảnh')


if __name__ == '__main__':
    main()
