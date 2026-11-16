# -*- coding: utf-8 -*-
"""BÀI TẬP THEO BÀI, Vật lí 11 học kì I (Chương I Dao động, Chương II Sóng), từ tập bài tập của giáo viên.

Nguồn: tools/k11_bai_tap/src/B*.txt (tách từ bản Word bằng tach_docx.py, sửa tay được) và hình ở bai-giang/k11-bt/h.
Mỗi câu:  "#q <mã bài> <phần>"  (phần: I nhiều lựa chọn, II đúng sai, III trả lời ngắn, TL tự luận), các dòng nội dung,
"A. ..." là phương án, "a) ..." là ý đúng sai, "=> " là đáp án (A..D | "Đ S Đ S" | đáp số | đáp án tự luận),
"=: " là lời giải / hướng dẫn. Công thức LaTeX trong $...$, chữ đậm **...**, hình [[IMG tên_file bề_rộng_cm]].

Chạy:  python -I -X utf8 tools/k11_bai_tap/dung.py [thư mục chép thêm file Word]
Tạo ra:
  bai-giang/k11-bt/du-lieu.js        dữ liệu cho trang bai-giang/k11-bai-tap.html
  bai-giang/k11-bt/word/*.docx       file Word từng bài và từng chương, bản đề và bản *_Dap_an (công thức là Equation)
  K11/Bài tập theo bài/*.docx        bản chép để dễ tìm
"""
import sys, os, re, glob, json, shutil, importlib.util
from PIL import Image
import docx
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
OUT = os.path.join(REPO, 'bai-giang', 'k11-bt')
TAI_LIEU = os.path.join(REPO, 'K11', 'Bài tập theo bài')

# dùng lại phần dựng Word của khối 10 (công thức LaTeX -> Equation, chữ có định dạng, bảng)
_sp = importlib.util.spec_from_file_location('k10dung', os.path.join(DIR, '..', 'k10_chuong2_mo_rong', 'dung.py'))
k10 = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(k10)
XANH, LA, DO, RONG, p_ = k10.XANH, k10.LA, k10.DO, k10.RONG, k10.p_

CHUONG = {'C1': 'Chương I. Dao động', 'C2': 'Chương II. Sóng'}
BAI = {
    'B1': ('C1', 'Bài 1. Dao động điều hòa'),
    'B2': ('C1', 'Bài 2. Mô tả dao động điều hòa'),
    'B3': ('C1', 'Bài 3. Vận tốc, gia tốc trong dao động điều hòa'),
    'B4': ('C1', 'Bài 4. Bài tập về dao động điều hòa'),
    'B5': ('C1', 'Bài 5. Động năng. Thế năng. Sự chuyển hóa năng lượng trong dao động điều hòa'),
    'B6': ('C1', 'Bài 6. Dao động tắt dần. Dao động cưỡng bức. Hiện tượng cộng hưởng'),
    'B8': ('C2', 'Bài 8. Mô tả sóng'),
    'B9': ('C2', 'Bài 9. Sóng ngang. Sóng dọc. Sự truyền năng lượng của sóng cơ'),
    'B11': ('C2', 'Bài 11. Sóng điện từ'),
    'B12': ('C2', 'Bài 12. Giao thoa sóng'),
    'B13': ('C2', 'Bài 13. Sóng dừng'),
    'B15': ('C2', 'Bài 15. Thực hành: Đo tốc độ truyền âm'),
}
TEN_FILE = {'B1': 'Bai01_Dao_dong_dieu_hoa', 'B2': 'Bai02_Mo_ta_dao_dong_dieu_hoa', 'B3': 'Bai03_Van_toc_gia_toc', 'B4': 'Bai04_Bai_tap_dao_dong_dieu_hoa',
            'B5': 'Bai05_Dong_nang_the_nang', 'B6': 'Bai06_Tat_dan_cuong_buc_cong_huong', 'B8': 'Bai08_Mo_ta_song', 'B9': 'Bai09_Song_ngang_song_doc',
            'B11': 'Bai11_Song_dien_tu', 'B12': 'Bai12_Giao_thoa_song', 'B13': 'Bai13_Song_dung', 'B15': 'Bai15_Thuc_hanh_do_toc_do_truyen_am'}
TEN_CHUONG = {'C1': 'Chuong1_Dao_dong_Bai_tap_theo_bai', 'C2': 'Chuong2_Song_Bai_tap_theo_bai'}
PHAN = {'I': 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn', 'II': 'PHẦN II. Câu trắc nghiệm đúng sai',
        'III': 'PHẦN III. Câu trắc nghiệm trả lời ngắn', 'TL': 'PHẦN IV. Tự luận'}
CAC_PHAN = ('I', 'II', 'III', 'TL')
IMG_LINE = re.compile(r'^(\[\[IMG [^\]]+\]\]\s*)+$')
IMG1 = re.compile(r'\[\[IMG (\S+) ([\d.]+)\]\]')
IMG_TOK = re.compile(r'(\[\[IMG [^\]]+\]\])')
loi = []


# ------------------------------------------------------------------ đọc nguồn
def doc_nguon():
    bai = {}
    for f in sorted(glob.glob(os.path.join(DIR, 'src', 'B*.txt'))):
        q = None
        for raw in open(f, encoding='utf8').read().splitlines():
            ln = raw.rstrip()
            if ln.startswith('#ten ') or not ln.strip():
                continue
            if ln.startswith('#q '):
                _, b, p = ln.split()
                assert b in BAI and p in CAC_PHAN, f + ': ' + ln
                q = dict(than=[], lc=[], ds=[], da='', lg=[], phan=p)
                bai.setdefault(b, {k: [] for k in CAC_PHAN})[p].append(q); continue
            if ln.startswith('#'):
                continue
            assert q is not None, f + ': nội dung nằm trước #q'
            if ln.startswith('=> '):
                q['da'] = ln[3:].strip(); continue
            if ln.startswith('=: '):
                q['lg'].append(ln[3:].strip()); continue
            m = re.match(r'^([A-D])\.(?:\s+(.*))?$', ln)
            if m and q['phan'] == 'I':
                q['lc'].append((m.group(1), m.group(2) or '')); continue
            m = re.match(r'^([a-h])\)\s+(.*)$', ln)
            if m and q['phan'] == 'II':
                q['ds'].append((m.group(1), m.group(2))); continue
            q['than'].append(ln)
    return bai


def hinh(ten):
    f = os.path.join(OUT, 'h', ten)
    if not os.path.exists(f):
        sys.exit('Thiếu hình %s: chạy tach_docx.py trước' % f)
    return f


def ds_list(c):
    return c['da'].split() if c['ds'] and re.fullmatch(r'[ĐS]( [ĐS])*', c['da'] or '') and len(c['da'].split()) == len(c['ds']) else []


def dem(B):
    return {ph: len(B[ph]) for ph in CAC_PHAN}


# ------------------------------------------------------------------ Word
def chu(par, s, **kw):
    """chữ có định dạng, công thức và hình nằm trong dòng"""
    for t in IMG_TOK.split(s):
        if not t:
            continue
        m = IMG1.fullmatch(t)
        if m:
            par.add_run().add_picture(hinh(m.group(1)), width=Cm(min(float(m.group(2)), 7.5)))
            continue
        try:
            k10.chu(par, t, **kw)
        except Exception as e:  # công thức không chuyển được: ghi dạng chữ
            loi.append('Công thức lỗi: %s (%r)' % (t[:80], e))
            par.add_run(t.replace('$', ''))


def do_dai(s):
    return 99 if '[[IMG' in s else k10.do_dai(s)


def cot_lc(lc):
    n = max(do_dai(x[1]) for x in lc)
    if any('[[IMG' in x[1] for x in lc):
        return 2
    return 4 if n <= 18 else 2 if n <= 38 else 1


def lua_chon(d, lc):
    cot = cot_lc(lc)
    buoc = (RONG - 0.6) / cot
    for k in range(0, len(lc), cot):
        p = p_(d, indent=0.6)
        for j in range(1, cot):
            p.paragraph_format.tab_stops.add_tab_stop(Cm(j * buoc))
        for j, (nh, nd) in enumerate(lc[k:k + cot]):
            if j: p.add_run('\t')
            r = p.add_run(nh + '. '); r.bold = True; r.font.color.rgb = XANH
            chu(p, nd)


def khoi(d, lines, indent=0.0):
    i = 0
    while i < len(lines):
        ln = lines[i]
        if IMG_LINE.match(ln):
            p = p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=2, after=2)
            for k, m in enumerate(IMG1.finditer(ln)):
                if k: p.add_run('  ')
                p.add_run().add_picture(hinh(m.group(1)), width=Cm(min(float(m.group(2)), RONG - 1)))
            i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'): j += 1
            k10.bang(d, lines[i:j]); i = j; continue
        chu(p_(d, indent=indent), ln); i += 1


def cau(d, c, so, phan, da=False):
    than = c['than']
    p = p_(d, before=4, keep=True)
    r = p.add_run('Câu %d. ' % so); r.bold = True; r.font.color.rgb = XANH
    rest = than
    if than and not IMG_LINE.match(than[0]) and not than[0].startswith('|'):
        chu(p, than[0]); rest = than[1:]
    khoi(d, rest)
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
    if da and (c['da'] or c['lg']):
        if c['da']:
            p = p_(d, indent=0.6, before=2)
            r = p.add_run('Đáp số: ' if phan == 'III' else 'Đáp án: '); r.bold = True; r.font.color.rgb = LA
            if phan == 'II' and ds_list(c):
                chu(p, '   '.join('%s) %s' % (k, v) for k, v in zip('abcdefgh', ds_list(c))), b0=True, mau=LA)
            elif phan == 'TL':
                chu(p, c['da'], mau=LA)
            else:
                chu(p, c['da'], b0=True, mau=LA)
        if c['lg']:
            p = p_(d, indent=0.6)
            r = p.add_run('Hướng dẫn: ' if phan == 'TL' else 'Lời giải: '); r.italic = True; r.bold = True; r.font.color.rgb = LA
            lg = c['lg']
            if not IMG_LINE.match(lg[0]) and not lg[0].startswith('|'):
                chu(p, lg[0]); lg = lg[1:]
            khoi(d, lg, indent=0.6)


def tieu_de(d, ten, phu=None):
    chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, after=2), ten.upper(), b0=True, mau=DO, co=15)
    if phu:
        chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, after=8), phu, i0=True, co=11)


def mot_bai(d, ma, B, da=False):
    tieu_de(d, BAI[ma][1], 'BÀI TẬP THEO BÀI · VẬT LÍ 11' + (' · CÓ ĐÁP ÁN' if da else ''))
    for ph in CAC_PHAN:
        if not B[ph]: continue
        chu(p_(d, before=8, after=2, keep=True), PHAN[ph], b0=True)
        for k, c in enumerate(B[ph], 1):
            cau(d, c, k, ph, da)
    if da:
        bang_dap_an(d, B)


def bang_dap_an(d, B):
    if not (B['I'] or B['II'] or B['III']): return
    chu(p_(d, WD_ALIGN_PARAGRAPH.CENTER, before=10, after=4, keep=True), 'BẢNG ĐÁP ÁN', b0=True, mau=DO, co=13)
    for ph in ('I', 'II', 'III'):
        if not B[ph]: continue
        chu(p_(d, before=4, keep=True), {'I': 'Phần I', 'II': 'Phần II', 'III': 'Phần III'}[ph], b0=True, mau=XANH)
        cot = {'I': 10, 'II': 5, 'III': 5}[ph]
        o = ['%d. %s' % (k, ''.join(ds_list(c)) if ph == 'II' else (c['da'] or '?')) for k, c in enumerate(B[ph], 1)]
        t = d.add_table(rows=(len(o) + cot - 1) // cot, cols=cot); t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for k, x in enumerate(o):
            pr = t.cell(k // cot, k % cot).paragraphs[0]; pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            chu(pr, x, co=11)
    d.add_paragraph().paragraph_format.space_after = Pt(0)


# ------------------------------------------------------------------ dữ liệu cho trang HTML
def html_chu(s):
    h = k10.html_chu(s)
    return IMG1.sub(lambda m: img_html(m, 7.5), h)


def img_html(m, toi_da=16.5):
    w, h = Image.open(hinh(m.group(1))).size
    return '<img src="k11-bt/h/%s" width="%d" height="%d" style="width:%.1fcm" alt="Hình minh hoạ" loading="lazy">' % (m.group(1), w, h, min(float(m.group(2)), toi_da))


def html_khoi(lines):
    h, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if IMG_LINE.match(ln):
            h.append('<figure>%s</figure>' % ''.join(img_html(m) for m in IMG1.finditer(ln))); i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'): j += 1
            rows = [[c.strip() for c in r.strip().strip('|').split('|')] for r in lines[i:j]]
            h.append('<div class="tw"><table>' + ''.join('<tr>' + ''.join('<td>%s</td>' % html_chu(c) for c in r) + '</tr>' for r in rows) + '</table></div>')
            i = j; continue
        h.append('<p>%s</p>' % html_chu(ln)); i += 1
    return ''.join(h)


def du_lieu(bai):
    out = {}
    for ma in BAI:
        B = bai.get(ma)
        if not B: continue
        o = {'ten': BAI[ma][1], 'ch': CHUONG[BAI[ma][0]], 'dem': dem(B),
             'word': 'k11-bt/word/%s.docx' % TEN_FILE[ma], 'wordDa': 'k11-bt/word/%s_Dap_an.docx' % TEN_FILE[ma],
             'wordCh': 'k11-bt/word/%s.docx' % TEN_CHUONG[BAI[ma][0]], 'wordChDa': 'k11-bt/word/%s_Dap_an.docx' % TEN_CHUONG[BAI[ma][0]]}
        for ph in CAC_PHAN:
            o[ph] = [{'than': html_khoi(c['than']), 'lc': [[a, html_chu(b)] for a, b in c['lc']],
                      'ds': [[a, html_chu(b)] for a, b in c['ds']], 'col': cot_lc(c['lc']) if c['lc'] else 0,
                      'da': html_chu(c['da']) if ph == 'TL' else c['da'], 'lg': html_khoi(c['lg'])} for c in B[ph]]
        out[ma] = o
    return out


# ------------------------------------------------------------------ chạy
def main():
    them = sys.argv[1] if len(sys.argv) > 1 else None
    bai = doc_nguon()
    os.makedirs(os.path.join(OUT, 'word'), exist_ok=True)
    files = []
    for ch in CHUONG:
        ds = [m for m in BAI if BAI[m][0] == ch and m in bai]
        for da in (False, True):
            d = k10.tao_doc()
            tieu_de(d, 'Vật lí 11 · ' + CHUONG[ch], 'Bài tập theo bài' + (' · có đáp án' if da else ''))
            for k, ma in enumerate(ds):
                if k: d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
                mot_bai(d, ma, bai[ma], da)
            files.append((TEN_CHUONG[ch] + ('_Dap_an' if da else ''), d))
    for ma in BAI:
        if ma not in bai: continue
        for da in (False, True):
            d = k10.tao_doc(); mot_bai(d, ma, bai[ma], da); files.append((TEN_FILE[ma] + ('_Dap_an' if da else ''), d))
    for ten, d in files:
        f = os.path.join(OUT, 'word', ten + '.docx'); d.save(f)
        for thu_muc in (TAI_LIEU, them):
            if thu_muc:
                os.makedirs(thu_muc, exist_ok=True); shutil.copy(f, os.path.join(thu_muc, ten + '.docx'))
    with open(os.path.join(OUT, 'du-lieu.js'), 'w', encoding='utf8') as fo:
        fo.write('/* Tạo bởi tools/k11_bai_tap/dung.py — không sửa tay */\nwindow.BT11=' + json.dumps(du_lieu(bai), ensure_ascii=False) + ';\n')

    tong = {k: 0 for k in CAC_PHAN}
    for ma in BAI:
        if ma in bai:
            dm = dem(bai[ma]); print(ma, dm)
            for k in dm: tong[k] += dm[k]
    thieu = [(ma, ph, k) for ma in bai for ph in ('I', 'II', 'III') for k, c in enumerate(bai[ma][ph], 1)
             if not c['da'] or c['da'] == '?' or (ph == 'II' and not ds_list(c)) or (ph == 'I' and len(c['lc']) != 4)]
    print('Tổng:', tong, sum(tong.values()), 'câu · file Word:', len(files), '· câu cần xem (thiếu đáp án / phương án):', thieu)
    for x in sorted(set(loi)): print('  !', x)


if __name__ == '__main__':
    main()
