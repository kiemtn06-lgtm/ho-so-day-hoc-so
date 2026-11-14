# -*- coding: utf-8 -*-
"""Phần MỞ RỘNG CUỐI BÀI, Vật lí 10 Chương II (Bài 8 đến Bài 12), từ bản scan "Quân -Ch2ly.pdf" (tr. 22-58).

Nội dung đã được chép tay từ ảnh scan vào src/p*.txt (mỗi file một hoặc hai trang). Công thức viết bằng LaTeX
trong $...$; hình ghi bằng [[IMG trang x0 y0 x1 y1]] (tọa độ điểm ảnh trên ảnh gốc của trang đó trong PDF).
Cuối mỗi câu: dòng "=> " là đáp án (A..D; "Đ S Đ S" theo a, b, c, d; hoặc đáp số), các dòng "=: " là lời giải.

Chạy:  python -I -X utf8 tools/k10_chuong2_mo_rong/dung.py "<đường dẫn Quân -Ch2ly.pdf>" [thư mục chép thêm file Word]
Tạo ra (trong kho hồ sơ):
  bai-giang/k10-c2-mr/h/*.jpg          hình cắt từ ảnh gốc, giữ nguyên độ phân giải (100%)
  bai-giang/k10-c2-mr/word/*.docx      file Word: cả chương và từng bài, mỗi file có bản đề và bản *_Dap_an
                                       (đáp án, lời giải, bảng đáp án); công thức là Equation của Word (OMML)
  bai-giang/k10-c2-mr/du-lieu.js       dữ liệu cho trang bai-giang/k10-chuong2-mo-rong.html
"""
import sys, os, re, io, glob, json, shutil, copy
import pymupdf
from PIL import Image
from lxml import etree
from latex2mathml.converter import convert as l2m
import docx
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
OUT = os.path.join(REPO, 'bai-giang', 'k10-c2-mr')
TAI_LIEU = os.path.join(REPO, 'K10 chương 2- Động học', 'Mở rộng cuối bài (Bài 8-12)')  # bản Word để ở thư mục chương ngoài cùng hồ sơ
XSL = r'C:\Program Files\Microsoft Office\root\Office16\MML2OMML.XSL'
TRANG_DAU = 22  # trang 1 của PDF là trang 22 của tài liệu in

BAI = {
    'B8': 'Bài 8. Chuyển động biến đổi. Gia tốc',
    'B9': 'Bài 9. Chuyển động thẳng biến đổi đều',
    'B10': 'Bài 10. Sự rơi tự do',
    'B11': 'Bài 11. Thực hành: Đo gia tốc rơi tự do',
    'B12': 'Bài 12. Chuyển động ném',
}
PHAN = {'I': 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn',
        'II': 'PHẦN II. Câu trắc nghiệm đúng sai',
        'III': 'PHẦN III. Câu trắc nghiệm trả lời ngắn'}
IMG_RE = re.compile(r'^\[\[IMG (\d+) (\d+) (\d+) (\d+) (\d+)\]\]$')
IMGS_RE = re.compile(r'^(\[\[IMG [\d ]+\]\]\s*)+$')   # một dòng có một hay nhiều hình (xếp cạnh nhau)
IMG1 = re.compile(r'\[\[IMG [\d ]+\]\]')


# ------------------------------------------------------------------ đọc nguồn
def doc_nguon():
    items, nhom = [], {}
    for f in sorted(glob.glob(os.path.join(DIR, 'src', 'p*.txt'))):
        for raw in open(f, encoding='utf8').read().splitlines():
            ln = raw.rstrip()
            if ln.startswith('#nhom '):
                _, b, ten = ln.split(' ', 2); nhom[b] = ten; continue
            if ln.startswith('#q+'):
                assert items and items[-1]['k'] == 'q', f + ': #q+ không nối được'
                continue
            if ln.startswith('#q '):
                _, b, p, tr = ln.split(); items.append(dict(k='q', bai=b, phan=p, trang=int(tr), nhom=nhom.get(b, ''), dong=[])); continue
            if ln.startswith('#t '):
                _, b, tr = ln.split(); items.append(dict(k='t', bai=b, trang=int(tr), nhom=nhom.get(b, ''), dong=[])); continue
            if not ln.strip():
                continue
            if ln.startswith('=> '):   # đáp án: A..D | "Đ S Đ S" | đáp số
                items[-1]['da'] = ln[3:].strip(); continue
            if ln.startswith('=: '):   # lời giải (có thể nhiều dòng)
                items[-1].setdefault('lg', []).append(ln[3:].strip()); continue
            items[-1]['dong'].append(ln)
    return items


def tach_cau(it):
    """Câu hỏi -> {than: [khối], lc: [(nhãn, nội dung)], ds: [(nhãn, nội dung)]}"""
    than, lc, ds = [], [], []
    for ln in it['dong']:
        m = re.match(r'^([A-D])\.\s+(.*)$', ln)
        if m and it['phan'] == 'I':
            lc.append((m.group(1), m.group(2))); continue
        m = re.match(r'^([a-d])\)\s+(.*)$', ln)
        if m and it['phan'] == 'II':
            ds.append((m.group(1), m.group(2))); continue
        than.append(ln)
    return dict(than=than, lc=lc, ds=ds)


def chuan(s):
    return re.sub(r'\s+', ' ', re.sub(r'\[\[IMG[^\]]*\]\]|[*$\\{}]', '', s)).strip().lower()


def to_chuc(items):
    """Xếp theo bài -> nhóm -> (lí thuyết, phần I/II/III). Bỏ câu trùng hệt nhau trong cùng bài."""
    bai, trung = {}, []
    for it in items:
        B = bai.setdefault(it['bai'], {'nhom': []})
        g = next((g for g in B['nhom'] if g['ten'] == it['nhom']), None)
        if not g:
            g = {'ten': it['nhom'], 'lt': [], 'I': [], 'II': [], 'III': []}; B['nhom'].append(g)
        if it['k'] == 't':
            g['lt'].append(it); continue
        c = tach_cau(it); c['trang'] = it['trang']; c['da'] = it.get('da', ''); c['lg'] = it.get('lg', [])
        key = chuan(' '.join(c['than']) + '|' + '|'.join(x[1] for x in c['lc'] + c['ds']))
        seen = B.setdefault('_seen', {})
        if key in seen:
            trung.append((it['bai'], it['phan'], it['trang'], c['than'][0][:70])); continue
        seen[key] = 1
        g[it['phan']].append(c)
    for B in bai.values():
        B.pop('_seen', None)
    return bai, trung


# ------------------------------------------------------------------ hình
class Hinh:
    def __init__(self, pdf):
        self.d = pymupdf.open(pdf); self.cache = {}; self.dung = {}
        os.makedirs(os.path.join(OUT, 'h'), exist_ok=True)

    def trang(self, n):
        if n not in self.cache:
            p = self.d[n - TRANG_DAU]
            x = sorted(p.get_images(full=True), key=lambda t: -t[2] * t[3])[0][0]
            pix = pymupdf.Pixmap(self.d, x)
            if pix.n - pix.alpha >= 4:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            self.cache = {n: Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')}
        return self.cache[n]

    def cat(self, ln):
        p, x0, y0, x1, y1 = map(int, IMG_RE.match(ln).groups())
        ten = 't%d_%d_%d.jpg' % (p, x0, y0)
        f = os.path.join(OUT, 'h', ten)
        if ten not in self.dung:
            im = self.trang(p); W, H = im.size
            box = (max(0, x0), max(0, y0), min(W, x1), min(H, y1))
            im.crop(box).save(f, quality=93, subsampling=0)   # giữ nguyên độ phân giải ảnh gốc
            self.dung[ten] = (box[2] - box[0], box[3] - box[1])
        return f, ten, self.dung[ten]


# ------------------------------------------------------------------ công thức: LaTeX -> MathML -> OMML (Equation của Word)
XSLT = etree.XSLT(etree.parse(XSL))


def sua_latex(s):
    s = s.replace(r'^\circ', '°')
    s = re.sub(r'\(\\sin\s*2\\alpha\)_\{\\max\}', r'{\\left(\\sin 2\\alpha\\right)}_{\\max}', s)
    return s


def omml(latex, khoi=False):
    mml = l2m(sua_latex(latex))
    # 0{,}4 -> một số 0,4 (dấu phẩy thập phân không bị giãn như dấu câu)
    for _ in range(3):
        mml = re.sub(r'<mn>([0-9,]+)</mn>(?:<mrow>)?<mo>&#x0002C;</mo>(?:</mrow>)?<mn>([0-9]+)</mn>', r'<mn>\1,\2</mn>', mml)
    o = XSLT(etree.fromstring(mml)).getroot()
    el = docx.oxml.parse_xml(etree.tostring(o))
    if khoi:
        para = OxmlElement('m:oMathPara'); para.append(el); return para
    return el


# ------------------------------------------------------------------ chữ có định dạng: $..$, ***..***, **..**, *..*
TOK = re.compile(r'(\$[^$]+\$|\*\*\*|\*\*|\*|<br>)')


def chu(par, s, b0=False, i0=False, mau=None, co=None):
    b = i = False; bi = False
    for t in TOK.split(s):
        if not t:
            continue
        if t == '***':
            bi = not bi; continue
        if t == '**':
            b = not b; continue
        if t == '*':
            i = not i; continue
        if t == '<br>':
            par.add_run().add_break(); continue
        if t.startswith('$'):
            par._p.append(omml(t[1:-1])); continue
        r = par.add_run(t)
        r.bold = b0 or b or bi or None
        r.italic = i0 or i or bi or None
        if mau: r.font.color.rgb = mau
        if co: r.font.size = Pt(co)


def do_dai(s):
    """độ dài hiển thị ước lượng (công thức tính khoảng một nửa số kí tự LaTeX)"""
    s = re.sub(r'\$([^$]+)\$', lambda m: 'x' * (int(1.3 * len(re.sub(r'\\(?:text|mathrm|dfrac|frac|sqrt|vec|left|right|quad|max)|[{}_^ ]', '', m.group(1)))) + 1), s)
    return len(s.replace('*', ''))


# ------------------------------------------------------------------ Word
XANH = RGBColor(0x1F, 0x3A, 0x8A)
LA = RGBColor(0x15, 0x6B, 0x2E)
DO = RGBColor(0xB9, 0x1C, 0x1C)
RONG = 17.4  # cm, bề rộng trang trừ lề


def tao_doc():
    d = docx.Document()
    s = d.sections[0]
    s.page_width, s.page_height = Cm(21), Cm(29.7)
    s.left_margin = s.right_margin = Cm(1.8); s.top_margin = Cm(1.5); s.bottom_margin = Cm(1.5)
    st = d.styles['Normal']; st.font.name = 'Times New Roman'; st.font.size = Pt(12)
    st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    st.paragraph_format.space_after = Pt(2); st.paragraph_format.space_before = Pt(0); st.paragraph_format.line_spacing = 1.1
    return d


def p_(d, align=None, indent=None, before=None, after=None, keep=False):
    p = d.add_paragraph()
    if align: p.alignment = align
    if indent is not None: p.paragraph_format.left_indent = Cm(indent)
    if before is not None: p.paragraph_format.space_before = Pt(before)
    if after is not None: p.paragraph_format.space_after = Pt(after)
    if keep: p.paragraph_format.keep_with_next = True
    return p


def anh(d, hinh, ln, co_max=15.0):
    f, ten, (w, h) = hinh.cat(ln)
    cm = min(co_max, w * 17.0 / 2100)          # giữ cỡ in gần như bản gốc (ảnh scan khoảng 2100 điểm ảnh cho 17 cm)
    p = p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=2, after=2)
    p.add_run().add_picture(f, width=Cm(cm))


def bang(d, rows, hinh=None):
    cells = [[c.strip() for c in r.strip().strip('|').split('|')] for r in rows]
    n = max(len(r) for r in cells)
    t = d.add_table(rows=len(cells), cols=n); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    if n == 2:  # cột đầu hẹp khi chữ ngắn (ví dụ "Bước 1")
        l0 = max(do_dai(r[0]) for r in cells if len(r) == 2)
        w0 = Cm(2.4) if l0 <= 10 else Cm(RONG / 2)
        for r in t.rows:
            r.cells[0].width = w0; r.cells[-1].width = Cm(RONG) - w0
    for i, r in enumerate(cells):
        if len(r) < n:  # hàng ít ô hơn: ô cuối kéo dài hết hàng
            t.cell(i, len(r) - 1).merge(t.cell(i, n - 1))
        for j, c in enumerate(r):
            cell = t.cell(i, j); par = cell.paragraphs[0]
            if len(r) == 1 or (i == 0 and n > 2): par.alignment = WD_ALIGN_PARAGRAPH.CENTER
            chu(par, c)
    d.add_paragraph().paragraph_format.space_after = Pt(0)


def khoi_dong(d, hinh, lines, indent=0.0):
    """các dòng nội dung (lí thuyết hoặc thân câu hỏi)"""
    i = 0
    while i < len(lines):
        ln = lines[i]
        if IMG_RE.match(ln):
            anh(d, hinh, ln); i += 1; continue
        if IMGS_RE.match(ln):
            p = p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=2, after=2)
            for k, x in enumerate(IMG1.findall(ln)):
                f, ten, (w, h) = hinh.cat(x)
                if k: p.add_run('  ')
                p.add_run().add_picture(f, width=Cm(w * 17.0 / 2100))
            i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'): j += 1
            bang(d, lines[i:j], hinh); i = j; continue
        if ln.startswith('$$'):
            p = p_(d, WD_ALIGN_PARAGRAPH.CENTER); p._p.append(omml(ln.strip('$'), True)); i += 1; continue
        if ln.startswith('### '):
            chu(p_(d, before=4, keep=True), ln[4:], b0=True, mau=XANH); i += 1; continue
        if ln.startswith('## '):
            chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=6, after=4, keep=True), ln[3:].upper(), b0=True, mau=DO, co=13); i += 1; continue
        if ln.startswith('~ '):
            chu(p_(d, indent=indent + 0.5), ln[2:]); i += 1; continue
        if re.match(r'^[+✓]', ln):
            chu(p_(d, indent=indent + 0.6), ln); i += 1; continue
        chu(p_(d, indent=indent), ln); i += 1


def cot_lc(lc):
    n = max(do_dai(x[1]) for x in lc)
    return 4 if n <= 18 else 2 if n <= 38 else 1


def lua_chon(d, lc):
    cot = cot_lc(lc)
    buoc = (RONG - 0.6) / cot
    for k in range(0, 4, cot):
        p = p_(d, indent=0.6)
        for j in range(1, cot):
            p.paragraph_format.tab_stops.add_tab_stop(Cm(0.6 + j * buoc - 0.6 + 0.0))
        for j, (nh, nd) in enumerate(lc[k:k + cot]):
            if j: p.add_run('\t')
            r = p.add_run(nh + '. '); r.bold = True; r.font.color.rgb = XANH
            chu(p, nd)


def ds_list(c):
    return c['da'].split() if c['ds'] and re.fullmatch(r'([ĐS] ){3}[ĐS]', c['da'] or '') else []


def cau(d, hinh, c, so, phan, da=False):
    than = c['than']
    p = p_(d, before=4, keep=True)
    r = p.add_run('Câu %d. ' % so); r.bold = True; r.font.color.rgb = XANH
    # dòng đầu của thân câu đi liền sau "Câu n."
    rest = than
    if than and not IMGS_RE.match(than[0]) and not than[0].startswith(('|', '~ ', '$$')):
        chu(p, than[0]); rest = than[1:]
    khoi_dong(d, hinh, rest, indent=0.0)
    if c['lc']:
        lua_chon(d, c['lc'])
    if c['ds']:
        t = d.add_table(rows=len(c['ds']) + 1, cols=3); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
        w = [Cm(1.0), Cm(14.4), Cm(1.6)]
        for i, txt in enumerate(['Ý', 'Phát biểu', 'Đ / S']):
            cl = t.cell(0, i); cl.width = w[i]; pr = cl.paragraphs[0]; pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rr = pr.add_run(txt); rr.bold = True
        for i, (nh, nd) in enumerate(c['ds'], 1):
            for j in range(3): t.cell(i, j).width = w[j]
            pa = t.cell(i, 0).paragraphs[0]; pa.alignment = WD_ALIGN_PARAGRAPH.CENTER; ra = pa.add_run(nh + ')'); ra.bold = True
            chu(t.cell(i, 1).paragraphs[0], nd)
            if da and ds_list(c):
                pc = t.cell(i, 2).paragraphs[0]; pc.alignment = WD_ALIGN_PARAGRAPH.CENTER
                rc = pc.add_run(ds_list(c)[i - 1]); rc.bold = True; rc.font.color.rgb = LA
        d.add_paragraph().paragraph_format.space_after = Pt(0)
    if phan == 'III' and not (da and c['da']):
        chu(p_(d, indent=0.6), '*Đáp số:* ……………………………')
    if da and c['da']:
        p = p_(d, indent=0.6, before=2)
        r = p.add_run('Đáp số: ' if phan == 'III' else 'Đáp án: '); r.bold = True; r.font.color.rgb = LA
        if phan == 'II' and ds_list(c):
            chu(p, '   '.join('%s) %s' % (k, v) for k, v in zip('abcd', ds_list(c))), b0=True, mau=LA)
        else:
            chu(p, c['da'], b0=True, mau=LA)
        for k, lg in enumerate(c['lg']):
            p = p_(d, indent=0.6)
            if k == 0:
                r = p.add_run('Lời giải: '); r.italic = True; r.bold = True; r.font.color.rgb = LA
            chu(p, lg)


def tieu_de(d, ten, phu=None):
    chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, after=2), ten.upper(), b0=True, mau=DO, co=15)
    if phu:
        chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, after=8), phu, i0=True, co=11)


def mot_bai(d, hinh, ma, B, da=False):
    tieu_de(d, BAI[ma], 'PHẦN MỞ RỘNG CUỐI BÀI' + (' · CÓ ĐÁP ÁN VÀ LỜI GIẢI' if da else ''))
    if da:
        chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, after=6), GHI_DA, i0=True, co=10.5)
    nhieu = len(B['nhom']) > 1
    for gi, g in enumerate(B['nhom'], 1):
        if nhieu:
            chu(p_(d, before=8, after=4, keep=True), 'DẠNG %d. %s' % (gi, g['ten'].upper()), b0=True, mau=DO, co=13)
        if g['lt']:
            chu(p_(d, before=4, keep=True), 'A. TÓM TẮT LÍ THUYẾT', b0=True, mau=XANH, co=12.5)
            for it in g['lt']:
                khoi_dong(d, hinh, it['dong'])
            chu(p_(d, before=8, keep=True), 'B. BÀI TẬP', b0=True, mau=XANH, co=12.5)
        for ph in ('I', 'II', 'III'):
            if not g[ph]: continue
            chu(p_(d, before=8, after=2, keep=True), PHAN[ph], b0=True)
            for k, c in enumerate(g[ph], 1):
                cau(d, hinh, c, k, ph, da)
    if da:
        bang_dap_an(d, B)


GHI_DA = ('Bản scan gốc không có đáp án; đáp án và lời giải được soạn bổ sung (14/11/2026), giáo viên cần duyệt lại. '
          'Phần II ghi Đ/S theo thứ tự a, b, c, d.')


def bang_dap_an(d, B):
    chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=10, after=4, keep=True), 'BẢNG ĐÁP ÁN', b0=True, mau=DO, co=13)
    nhieu = len(B['nhom']) > 1
    for gi, g in enumerate(B['nhom'], 1):
        for ph in ('I', 'II', 'III'):
            if not g[ph]: continue
            ten = ('Dạng %d · ' % gi if nhieu else '') + {'I': 'Phần I', 'II': 'Phần II', 'III': 'Phần III'}[ph]
            chu(p_(d, before=4, keep=True), ten, b0=True, mau=XANH)
            cot = {'I': 10, 'II': 5, 'III': 5}[ph]
            o = ['%d. %s' % (k, ''.join(ds_list(c)) if ph == 'II' else (c['da'] or '?')) for k, c in enumerate(g[ph], 1)]
            t = d.add_table(rows=(len(o) + cot - 1) // cot, cols=cot); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for k, x in enumerate(o):
                pr = t.cell(k // cot, k % cot).paragraphs[0]; pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
                chu(pr, x, co=11)
    d.add_paragraph().paragraph_format.space_after = Pt(0)


def dem(B):
    return {ph: sum(len(g[ph]) for g in B['nhom']) for ph in ('I', 'II', 'III')}


# ------------------------------------------------------------------ dữ liệu cho trang HTML
def html_chu(s):
    s = s.replace('&', '&amp;').replace('<br>', '\x00').replace('<', '&lt;').replace('>', '&gt;').replace('\x00', '<br>')
    out, b, i, bi = [], False, False, False
    for t in TOK.split(s):
        if not t: continue
        if t == '***': bi = not bi; out.append('<b><i>' if bi else '</i></b>'); continue
        if t == '**': b = not b; out.append('<b>' if b else '</b>'); continue
        if t == '*': i = not i; out.append('<i>' if i else '</i>'); continue
        if t == '<br>': out.append('<br>'); continue
        if t.startswith('$'):
            out.append('<span class="m">%s</span>' % t[1:-1].replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&', '&amp;').replace('<', '&lt;')); continue
        out.append(t)
    return ''.join(out)


def html_khoi(hinh, lines):
    h, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if IMGS_RE.match(ln):
            fig = ''
            for x in IMG1.findall(ln):
                f, ten, (w, hh) = hinh.cat(x)
                fig += '<img src="k10-c2-mr/h/%s" width="%d" height="%d" style="width:%.2fcm" alt="Hình minh hoạ" loading="lazy">' % (ten, w, hh, min(15.0, w * 17.0 / 2100))
            h.append('<figure>%s</figure>' % fig); i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'): j += 1
            rows = [[c.strip() for c in r.strip().strip('|').split('|')] for r in lines[i:j]]
            n = max(len(r) for r in rows)
            t = '<div class="tw"><table>'
            for r in rows:
                t += '<tr>' + ''.join('<td%s>%s</td>' % (' colspan="%d"' % (n - len(r) + 1) if k == len(r) - 1 and len(r) < n else '', html_chu(c)) for k, c in enumerate(r)) + '</tr>'
            h.append(t + '</table></div>'); i = j; continue
        if ln.startswith('$$'):
            h.append('<div class="mb">%s</div>' % ln.strip('$').replace('&', '&amp;').replace('<', '&lt;')); i += 1; continue
        if ln.startswith('### '):
            h.append('<h4>%s</h4>' % html_chu(ln[4:])); i += 1; continue
        if ln.startswith('## '):
            h.append('<h3 class="lt-h">%s</h3>' % html_chu(ln[3:])); i += 1; continue
        if ln.startswith('~ '):
            h.append('<p class="sub">%s</p>' % html_chu(ln[2:])); i += 1; continue
        if re.match(r'^[+✓]', ln):
            h.append('<p class="sub">%s</p>' % html_chu(ln)); i += 1; continue
        h.append('<p>%s</p>' % html_chu(ln)); i += 1
    return ''.join(h)


def du_lieu(hinh, bai):
    out = {}
    for ma in BAI:
        B = bai.get(ma)
        if not B: continue
        nhom = []
        for g in B['nhom']:
            ng = {'ten': g['ten'], 'lt': ''.join(html_khoi(hinh, it['dong']) for it in g['lt'])}
            for ph in ('I', 'II', 'III'):
                ng[ph] = [{'than': html_khoi(hinh, c['than']), 'lc': [[a, html_chu(b)] for a, b in c['lc']],
                           'ds': [[a, html_chu(b)] for a, b in c['ds']], 'tr': c['trang'],
                           'col': cot_lc(c['lc']) if c['lc'] else 0,
                           'da': c['da'], 'lg': [html_chu(x) for x in c['lg']]}
                          for c in g[ph]]
            nhom.append(ng)
        out[ma] = {'ten': BAI[ma], 'nhom': nhom, 'dem': dem(B), 'word': 'k10-c2-mr/word/%s.docx' % ten_file(ma),
                   'wordDa': 'k10-c2-mr/word/%s_Dap_an.docx' % ten_file(ma)}
    return out


def ten_file(ma):
    return {'B8': 'Bai08_Gia_toc', 'B9': 'Bai09_CD_thang_bien_doi_deu', 'B10': 'Bai10_Su_roi_tu_do',
            'B11': 'Bai11_Thuc_hanh_do_g', 'B12': 'Bai12_Chuyen_dong_nem'}[ma] + '_Mo_rong'


# ------------------------------------------------------------------ chạy
def main():
    pdf = sys.argv[1]
    them = sys.argv[2] if len(sys.argv) > 2 else None
    items = doc_nguon()
    bai, trung = to_chuc(items)
    hinh = Hinh(pdf)
    os.makedirs(os.path.join(OUT, 'word'), exist_ok=True)

    # cả chương
    d = tao_doc()
    tieu_de(d, 'Vật lí 10 · Chương II. Động học', 'Phần mở rộng cuối bài, xếp theo bài (Bài 8 đến Bài 12)')
    first = True
    for ma in BAI:
        if ma not in bai: continue
        if not first: d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        first = False
        mot_bai(d, hinh, ma, bai[ma])
    files = [('Chuong2_Mo_rong_cuoi_bai_Bai8-12', d)]
    d = tao_doc()
    tieu_de(d, 'Vật lí 10 · Chương II. Động học', 'Phần mở rộng cuối bài, xếp theo bài (Bài 8 đến Bài 12) · có đáp án và lời giải')
    for k, ma in enumerate([m for m in BAI if m in bai]):
        if k: d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        mot_bai(d, hinh, ma, bai[ma], da=True)
    files.append(('Chuong2_Mo_rong_cuoi_bai_Bai8-12_Dap_an', d))
    for ma in BAI:
        if ma not in bai: continue
        dd = tao_doc(); mot_bai(dd, hinh, ma, bai[ma]); files.append((ten_file(ma), dd))
        dd = tao_doc(); mot_bai(dd, hinh, ma, bai[ma], da=True); files.append((ten_file(ma) + '_Dap_an', dd))
    for ten, dd in files:
        f = os.path.join(OUT, 'word', ten + '.docx'); dd.save(f)
        os.makedirs(TAI_LIEU, exist_ok=True); shutil.copy(f, os.path.join(TAI_LIEU, ten + '.docx'))
        if them:
            os.makedirs(them, exist_ok=True); shutil.copy(f, os.path.join(them, ten + '.docx'))

    data = du_lieu(hinh, bai)
    with open(os.path.join(OUT, 'du-lieu.js'), 'w', encoding='utf8') as fo:
        fo.write('/* Tạo bởi tools/k10_chuong2_mo_rong/dung.py — không sửa tay */\nwindow.MR=' + json.dumps(data, ensure_ascii=False) + ';\n')
    # dọn hình không còn dùng
    for f in glob.glob(os.path.join(OUT, 'h', '*.jpg')):
        if os.path.basename(f) not in hinh.dung: os.remove(f)

    for ma in BAI:
        if ma in bai:
            print(ma, dem(bai[ma]), [g['ten'] or '-' for g in bai[ma]['nhom']])
    thieu = [(ma, ph, c['trang']) for ma in bai for g in bai[ma]['nhom'] for ph in ('I', 'II', 'III') for c in g[ph] if not c['da']]
    print('hình:', len(hinh.dung), '· câu trùng đã bỏ:', len(trung), '· câu chưa có đáp án:', len(thieu), thieu[:5])
    for t in trung: print('   trùng:', t)


if __name__ == '__main__':
    main()
