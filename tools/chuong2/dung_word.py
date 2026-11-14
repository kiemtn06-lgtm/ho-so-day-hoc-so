# Dựng file Word "Bộ ôn theo buổi" từ file 523 câu. Giữ nguyên XML từng câu (chữ, công thức, hình, bảng); chỉ đánh lại số câu.
# Chạy: python -I -X utf8 dung_word.py <nguồn 523 câu.docx> <file ra.docx>
import sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import docx
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from tach_cau import tach, text, W
from chia_buoi import chia, TEN_BAI, CAP, ncau, mucdo

PHAN = {'I': 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn', 'II': 'PHẦN II. Câu trắc nghiệm đúng sai',
        'III': 'PHẦN III. Câu trắc nghiệm trả lời ngắn'}
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'


def sub_text(p, old, new):
    """Thay chuỗi old bằng new trong đoạn p (old có thể nằm xuyên nhiều run)."""
    ts = list(p.iter(W + 't'))
    full = ''.join(t.text or '' for t in ts)
    i = full.find(old)
    if i < 0:
        return False
    j = i + len(old)
    pos = 0
    done = False
    for t in ts:
        s = t.text or ''
        a, b = pos, pos + len(s)
        pos = b
        if b <= i or a >= j:
            continue
        lo, hi = max(i, a) - a, min(j, b) - a
        t.text = s[:lo] + (new if not done else '') + s[hi:]
        done = True
        t.set(XML_SPACE, 'preserve')
    return True


def renumber(unit, n0):
    """Đánh số lại câu của một đơn vị bắt đầu từ n0. Trả về danh sách số mới."""
    old = unit['cau']
    new = list(range(n0, n0 + len(old)))
    for e in unit['stem'] + unit['ans']:
        if e.tag != W + 'p':
            continue
        t0 = text(e)
        for a, b in zip(old, new):
            if re.match(r'\s*Câu\s+%d\.\s*\[' % a, t0):
                sub_text(e, 'Câu %d.' % a, 'Câu %d.' % b)
        if len(old) == 2:
            if t0.lstrip().startswith('Sử dụng các thông tin sau cho'):
                sub_text(e, 'Câu %d và Câu %d' % tuple(old), 'Câu %d và Câu %d' % tuple(new))
            for a, b in zip(old, new):
                if t0.lstrip().startswith('Đáp án câu %d' % a):
                    sub_text(e, 'Đáp án câu %d' % a, 'Đáp án câu %d' % b)
    return new


def clean(e):
    for br in list(e.iter(W + 'br')):
        if br.get(W + 'type') == 'page':
            br.getparent().remove(br)
    for x in list(e.iter(W + 'lastRenderedPageBreak')):
        x.getparent().remove(x)
    return e


def build(src, dst):
    d, units = tach(src)
    bs = chia(units)
    out = []

    def para(txt='', style=None, bold=False, size=None, color=None, pbb=False, italic=False):
        p = d.add_paragraph(style=style)
        if txt:
            r = p.add_run(txt)
            r.bold = bold or None
            r.italic = italic or None
            if size:
                r.font.size = Pt(size)
            if color:
                r.font.color.rgb = RGBColor.from_string(color)
        if pbb:
            p.paragraph_format.page_break_before = True
        out.append(p._p)
        return p

    tot = sum(ncau(u) for x in bs for p in CAP for u in x[p])
    para('CHƯƠNG 2. KHÍ LÍ TƯỞNG – BỘ ÔN THEO BUỔI (ĐỦ 523 CÂU)', bold=True, size=16)
    para('%d buổi, dùng hết %d câu của file "CHUONG2_KHI_LI_TUONG_tu_de_thi_tong_hop_DA_GOP_523_cau": mỗi bài chia thành nhiều buổi (Bài 8 → Bài 12). '
         'Mỗi buổi theo cấu trúc đề, tối đa: Phần I – 18 câu trắc nghiệm, Phần II – 4 câu đúng/sai, Phần III – 6 câu trả lời ngắn (câu chùm 2 câu luôn nằm cùng một buổi). '
         'Trong mỗi phần, câu được sắp từ dễ đến khó (NB → TH → VD → VDC) và các buổi của cùng một bài có mức độ tương đương nhau. '
         'Câu được giữ nguyên văn, hình và công thức; chỉ đánh lại số câu theo từng buổi. Mã trong ngoặc vuông cạnh số câu là mã tra cứu trong file 523 câu.' % (len(bs), tot))
    para('Mục lục', style='Heading 1')
    p = d.add_paragraph()
    out.append(p._p)
    for typ, txt in (('begin', None), ('instr', ' TOC \\o "1-2" \\h \\z \\u '), ('separate', None),
                     ('text', 'Nhấn chuột phải vào đây, chọn "Update Field" để cập nhật mục lục.'), ('end', None)):
        r = OxmlElement('w:r')
        if typ in ('begin', 'separate', 'end'):
            f = OxmlElement('w:fldChar')
            f.set(qn('w:fldCharType'), typ)
            r.append(f)
        elif typ == 'instr':
            f = OxmlElement('w:instrText')
            f.set(XML_SPACE, 'preserve')
            f.text = txt
            r.append(f)
        else:
            t = OxmlElement('w:t')
            t.text = txt
            r.append(t)
        p._p.append(r)
    para('Tổng quan các buổi', style='Heading 1', pbb=True)
    tb = d.add_table(rows=1, cols=7)
    try:
        tb.style = 'Table Grid'
    except Exception:
        pass
    hdr = ['Buổi', 'Bài', 'Trắc nghiệm', 'Đúng/sai', 'Trả lời ngắn', 'Tổng số câu', 'Mức độ có trong buổi']
    for c, h in zip(tb.rows[0].cells, hdr):
        c.text = h
        for r in c.paragraphs[0].runs:
            r.bold = True
    for x in bs:
        n = {p: sum(ncau(u) for u in x[p]) for p in CAP}
        lv = sorted({mucdo(u['codes'][0]) for p in CAP for u in x[p]}, key=lambda k: ['NB', 'TH', 'VD', 'VDC'].index(k))
        row = tb.add_row().cells
        for c, v in zip(row, [str(x['so']), 'Bài %d' % x['bai'], str(n['I']), str(n['II']), str(n['III']), str(sum(n.values())), ', '.join(lv)]):
            c.text = v
    out.append(tb._tbl)
    para('Tổng: %d buổi, %d câu (Phần I: %d, Phần II: %d, Phần III: %d).' % ((len(bs), tot) + tuple(sum(ncau(u) for x in bs for u in x[p]) for p in CAP)), italic=True)
    para('Ghi chú về nguồn', style='Heading 2')
    for s in ['• Phần II gồm cả câu đúng/sai không tính toán (mức Thông hiểu) và câu đúng/sai có tính toán (mức Vận dụng); các câu có tính toán đứng cuối Phần II của buổi.',
              '• Cả chương: nguồn không có câu Dạng IV (tự luận).',
              '• Cụm câu chùm (dùng chung dữ kiện) ở Phần III luôn đi cùng nhau trong một buổi, nên số câu mỗi buổi có thể chênh nhau 1 câu.',
              '• Các Phụ lục của file 523 câu (câu trùng, mức độ tự xếp, công thức cần kiểm tra, hình chưa gán…) không đưa vào bộ này; xem lại trong file 523 câu.']:
        para(s)
    for x in bs:
        para('Buổi %d – Bài %d. %s' % (x['so'], x['bai'], TEN_BAI[x['bai']]), style='Heading 1', pbb=True)
        ans_items = []
        for p in ('I', 'II', 'III'):
            if not x[p]:
                continue
            para(PHAN[p], style='Heading 2')
            n = 1
            for u in x[p]:
                new = renumber(u, n)
                n += len(new)
                for e in u['stem']:
                    out.append(clean(e))
                ans_items.append((p, u, new))
        para('Đáp án và hướng dẫn – Buổi %d' % x['so'], style='Heading 2')
        cur = None
        for p, u, new in ans_items:
            if p != cur:
                para(PHAN[p].split('.')[0], bold=True)
                cur = p
            codes = ', '.join(c.replace(' (*)', '') for c in u['codes'])
            para('Câu %s [%s]' % (' – '.join(str(k) for k in new) if len(new) > 1 else new[0], codes), bold=True, color='555555')
            for e in u['ans']:
                out.append(clean(e))
    body = d.element.body
    sect = body.find(W + 'sectPr')
    for c in list(body):
        body.remove(c)
    for e in out:
        body.append(e)
    if sect is not None:
        body.append(sect)
    d.save(dst)
    return bs


if __name__ == '__main__':
    bs = build(sys.argv[1], sys.argv[2])
    print('đã ghi', sys.argv[2], '|', len(bs), 'buổi')
