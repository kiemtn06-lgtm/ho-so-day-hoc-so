# -*- coding: utf-8 -*-
"""Đưa BÀI GIẢNG khối 10 dạng trình chiếu ảnh (file .pptx mỗi slide là một ảnh, làm bằng NotebookLM) vào hồ sơ.

Chạy:  python -I -X utf8 tools/k10_bai_giang/dung.py
Dùng lại khung của tools/k11_bai_giang (trang trình chiếu, công cụ lớp, mô phỏng); chỉ khác: nguồn là thư mục K10,
mã dữ liệu '10-3', ảnh vào bai-giang/k10-B13/s01.jpg ..., trang bai-giang/k10-B13.html, nút "Luyện tập tương tác"
mở trang bài giảng tương tác cũ bai-giang/k10-B13-tuong-tac.html (câu hỏi củng cố có chấm điểm).
Mô phỏng: tools/k10_bai_giang/mo_phong/<MA>.js (dùng khung tools/k11_bai_giang/mo_phong/khung.js).
File .pptx gốc không bị sửa.
"""
import os, sys, io, json, subprocess, importlib.util

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
K11 = os.path.join(REPO, 'tools', 'k11_bai_giang')
spec = importlib.util.spec_from_file_location('dung11', os.path.join(K11, 'dung.py'))
d11 = importlib.util.module_from_spec(spec); spec.loader.exec_module(d11)
from PIL import Image

NGUON = os.path.join(REPO, 'K10')
d11.KHOA = '10-3'

BAI = {
    'B13': dict(file='Bài 13- Tong_hop_va_Phan_tich_Luc_da_sua.pptx', ten='Bài 13. Tổng hợp và phân tích lực. Cân bằng lực',
                tuong_tac='k10-B13-tuong-tac.html#B13@9', slide=[
        'Bài 13: Tổng hợp và phân tích lực. Cân bằng lực',
        'Tình huống thực tế: thay nhiều lực bằng một lực?',
        'Thí nghiệm tổng hợp hai lực đồng quy',
        'Thu thập và xử lí số liệu',
        'Quy tắc hình bình hành',
        'Tính độ lớn hợp lực',
        'Các trường hợp đặc biệt của hợp lực',
        'Mini-quiz (củng cố tiết 1)',
        'Khởi động tiết 2: Bí ẩn mặt phẳng nghiêng',
        'Phân tích lực thành hai thành phần vuông góc',
        'Ứng dụng: giải mã mặt phẳng nghiêng',
        'Điều kiện cân bằng của chất điểm',
        'Vận dụng trạng thái cân bằng',
        'Luyện tập dạng 1: Trắc nghiệm nhiều lựa chọn',
        'Luyện tập dạng 2: Đúng / Sai',
        'Luyện tập dạng 3: Trả lời ngắn từ đồ thị',
        'Vận dụng thực tế: Bài toán dây phơi',
        'Phụ lục 1: Phiếu học tập số 1',
        'Phụ lục 2: Đáp án chi tiết luyện tập']),
}

# Chỉnh trên ảnh slide (cách ghi như tools/k11_bai_giang/dung.py). Tọa độ theo ảnh gốc 1376x768.
# B13: ảnh NotebookLM còn số trang thừa trong bánh răng ở góc dưới phải (40, 41, ..., 47, 50: số của bộ slide dài hơn,
#      không khớp bài này) -> xóa số, giữ bánh răng.
SUA_ANH = {
    ('B13', 9): [('xoa', (1326, 728, 1364, 746))],
    ('B13', 10): [('xoa', (1326, 728, 1364, 746))],
    ('B13', 11): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 12): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 13): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 14): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 15): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 16): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 17): [('xoa', (1308, 708, 1348, 738))],
}

TRANG = (d11.TRANG
         .replace('Vật lí 11', 'Vật lí 10')
         .replace('THU="k11-"+MA+"/"', 'THU="k10-"+MA+"/"')
         .replace('<button id="bBT" class="c" title="Bài tập của bài này, có đáp án (phím B)">Bài tập cuối bài</button>',
                  '<button id="bBT" class="c" title="Câu hỏi củng cố tương tác, có chấm điểm (phím B)">Luyện tập tương tác</button>')
         .replace('f.title="Bài tập cuối bài";f.src="k11-bai-tap.html#"+MA;', 'f.title="Luyện tập tương tác";f.id="llFrame";f.src=TT;')   # id llFrame: trang con tự ẩn công cụ lớp (đã có ở trang này)
         .replace('#btK button{', '#btK iframe{height:calc(100% - 46px)} #btK button{')
         .replace('var MA=__MA__,', 'var MA=__MA__,TT=__TT__,')
         .replace('🌊 Mô phỏng', '📐 Mô phỏng'))
for dau in ('THU="k10-"', 'f.src=TT', 'TT=__TT__', 'Luyện tập tương tác', '#btK iframe{height:calc'):
    assert dau in TRANG, 'Khung trang K11 đã đổi, cập nhật dung.py: thiếu ' + dau


def main():
    for ma, B in BAI.items():
        f = os.path.join(NGUON, B['file'])
        if not os.path.exists(f):
            print('Bỏ qua', ma, ': không thấy', f); continue
        anh = d11.anh_slide(f)
        assert len(anh) == len(B['slide']), '%s: %d slide nhưng có %d tên slide' % (ma, len(anh), len(B['slide']))
        thu = os.path.join(REPO, 'bai-giang', 'k10-' + ma); os.makedirs(thu, exist_ok=True)
        tong = 0
        for i, b in enumerate(anh, 1):
            im = Image.open(io.BytesIO(b)).convert('RGB')
            if (ma, i) in SUA_ANH: im = d11.sua_anh(im, SUA_ANH[(ma, i)])
            g = os.path.join(thu, 's%02d.jpg' % i); im.save(g, quality=88, optimize=True); tong += os.path.getsize(g)
        cc = d11.cong_cu_lop(ma)
        mp = os.path.join(DIR, 'mo_phong', ma + '.js')
        mp = ''.join('<script>%s</script>\n' % open(g, encoding='utf8').read().replace('</script', '<\\/script')
                     for g in (os.path.join(K11, 'mo_phong', 'khung.js'), mp)) if os.path.exists(mp) else ''
        h = (TRANG.replace('__TEN__', B['ten']).replace('__MA__', json.dumps(ma)).replace('__TT__', json.dumps(B['tuong_tac']))
             .replace('__SLIDE__', json.dumps(B['slide'], ensure_ascii=False))
             .replace('__MP__', mp).replace('__CSS__', cc['css']).replace('__JS__', cc['js'].replace('</script', '<\\/script')))
        dich = os.path.join(REPO, 'bai-giang', 'k10-%s.html' % ma)
        open(dich, 'w', encoding='utf8').write(h)
        subprocess.run(['node', os.path.join(REPO, 'tools', 'gan_nut_sua.js'), dich], check=True, stdout=subprocess.DEVNULL)   # nút ✎ Sửa
        print(ma, B['ten'], '·', len(anh), 'slide ·', round(tong / 1048576, 2), 'MB ảnh')


if __name__ == '__main__':
    main()
