# -*- coding: utf-8 -*-
"""Tách tập BÀI TẬP VẬT LÍ 11 HKI (bản Word của giáo viên, đáp án gạch chân) thành các file nguồn src/B*.txt.

Chạy một lần khi có bản Word mới:
    python -I -X utf8 tools/k11_bai_tap/tach_docx.py "<L11_ BÀI TẬP VẬT LÍ 11 _ HKI 2026_GV.docx>" [--ghi-de]
(file trong thư mục K11 của hồ sơ có đuôi .pdf nhưng thực chất là file Word, dùng được luôn)

Tạo ra:
  tools/k11_bai_tap/src/B01.txt ...   mỗi bài một file, sửa tay được (dòng "=> " là đáp án, "=: " là lời giải / hướng dẫn)
  bai-giang/k11-bt/h/*.png|jpg        hình lấy từ file Word (đã cắt đúng như trong Word)
Sau đó dựng trang và file Word:  python -I -X utf8 tools/k11_bai_tap/dung.py

Cách nhận biết trong bản Word:
  Phần I: phương án có chữ cái GẠCH CHÂN là đáp án.   Phần II: ý có chữ cái gạch chân là Đúng.
  Phần III: bảng "Đáp án:" (mỗi ô một kí tự).          Tự luận: đoạn bắt đầu bằng "ĐS:", "Đáp án:", "Giải thích:".
Công thức Equation (OMML) và MathType được chuyển sang LaTeX. Không ghi đè src đã có nếu thiếu --ghi-de.
"""
import sys, os, re, io, zipfile
from lxml import etree
from PIL import Image

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import mtef  # noqa: E402

REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
OUT_H = os.path.join(REPO, 'bai-giang', 'k11-bt', 'h')
SRC = os.path.join(DIR, 'src')
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
M = '{http://schemas.openxmlformats.org/officeDocument/2006/math}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
BS = chr(92)

# phông Symbol -> Unicode
SYM = {0x20: ' ', 0x44: 'Δ', 0x46: 'Φ', 0x47: 'Γ', 0x4C: 'Λ', 0x50: 'Π', 0x51: 'Θ', 0x53: 'Σ', 0x57: 'Ω', 0x59: 'Ψ',
       0x61: 'α', 0x62: 'β', 0x63: 'χ', 0x64: 'δ', 0x65: 'ε', 0x66: 'φ', 0x67: 'γ', 0x68: 'η', 0x69: 'ι', 0x6A: 'φ',
       0x6B: 'κ', 0x6C: 'λ', 0x6D: 'μ', 0x6E: 'ν', 0x70: 'π', 0x71: 'θ', 0x72: 'ρ', 0x73: 'σ', 0x74: 'τ', 0x75: 'υ',
       0x77: 'ω', 0x78: 'ξ', 0x79: 'ψ', 0x7A: 'ζ', 0xA3: '≤', 0xB3: '≥', 0xB0: '°', 0xB1: '±', 0xB4: '×', 0xB9: '≠',
       0xBB: '≈', 0xAB: '↔', 0xAC: '←', 0xAD: '↑', 0xAE: '→', 0xAF: '↓', 0xDE: '⇒', 0xDB: '⇔', 0xA5: '∞', 0xD7: '⋅',
       0xD6: '√', 0x2D: '−', 0xB5: '∝', 0xA2: '′', 0x5E: '⊥', 0xBC: '…'}
# kí tự -> LaTeX (trong công thức)
GRK = {'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'varepsilon', 'θ': 'theta', 'λ': 'lambda', 'μ': 'mu',
       'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'φ': 'varphi', 'ϕ': 'varphi', 'ω': 'omega', 'η': 'eta', 'ν': 'nu',
       'Δ': 'Delta', 'Φ': 'Phi', 'Ω': 'Omega', 'Σ': 'Sigma', 'Λ': 'Lambda', 'ℓ': 'ell', '×': 'times', '⋅': 'cdot', '·': 'cdot',
       '≈': 'approx', '≤': 'le', '≥': 'ge', '≠': 'ne', '±': 'pm', '∞': 'infty', '→': 'to', '⇒': 'Rightarrow', '∝': 'propto',
       '÷': 'div', '∆': 'Delta', 'µ': 'mu', '⇔': 'Leftrightarrow', '∈': 'in', '≡': 'equiv', '∼': 'sim', '⊥': 'perp'}
HAM = ('cos', 'sin', 'tan', 'cot', 'max', 'min', 'log', 'ln', 'lim')
DON_VI = ('Hz', 'kHz', 'MHz', 'GHz', 'cm', 'mm', 'dm', 'km', 'nm', 'rad', 'kg', 'ms', 'dB', 'mJ', 'kJ', 'mA', 'kV', 'mV', 'mW', 'kW', 'eV')
SUP = str.maketrans('0123456789-+−', '⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁻')
SUBU = str.maketrans('0123456789', '₀₁₂₃₄₅₆₇₈₉')
canh_bao = []


def cb(*a):
    canh_bao.append(' '.join(str(x) for x in a))


# ------------------------------------------------------------------ OMML -> LaTeX
def ln(el):
    return el.tag.split('}')[1]


def mtext(s):
    """chữ trong công thức -> LaTeX"""
    s = s.replace('\xa0', ' ')
    out, i = '', 0
    for t in re.findall(r'[A-Za-zÀ-ɏḀ-ỹ]+|\d+(?:[,.]\d+)*|\s+|.', s):
        if re.fullmatch(r'[A-Za-zÀ-ɏḀ-ỹ]+', t):
            if t in HAM:
                out += BS + t + ' '
            elif t in DON_VI or (len(t) > 1 and re.search(r'[À-ỹĐđ]', t)) or len(t) > 3:
                out = out.rstrip() + (BS + ' ' if out.strip() else '') + BS + 'text{' + t + '}'
            else:
                out += t
        elif t[0].isdigit():
            out += t.replace(',', '{,}')
        elif t.isspace():
            out += ' '
        elif t in GRK:
            out += BS + GRK[t] + ' '
        elif t == '−' or t == '–':
            out += '-'
        elif t == '%':
            out += BS + '%'
        elif t == '°':
            out += '^' + BS + 'circ '
        elif t == ',':
            out += ',' + BS + ' '
        elif t in '{}#&_':
            out += BS + t
        else:
            out += t
    return out


def kids(el, skip=('rPr', 'ctrlPr', 'fPr', 'radPr', 'sSubPr', 'sSupPr', 'sSubSupPr', 'dPr', 'funcPr', 'accPr', 'barPr', 'naryPr',
                   'limLowPr', 'limUppPr', 'eqArrPr', 'mPr', 'boxPr', 'groupChrPr', 'borderBoxPr', 'oMathParaPr', 'argPr', 'sPrePr', 'phantPr', 'mcs')):
    return [c for c in el if isinstance(c.tag, str) and ln(c) not in skip]


def om(el):
    t = ln(el)
    g = lambda name: om(el.find(M + name)) if el.find(M + name) is not None else ''
    if t == 'r':
        return mtext(''.join(x.text or '' for x in el.iter(M + 't')))
    if t == 'f':
        return BS + 'dfrac{%s}{%s}' % (g('num'), g('den'))
    if t == 'rad':
        d = g('deg').strip()
        return (BS + 'sqrt[%s]{%s}' % (d, g('e'))) if d else BS + 'sqrt{%s}' % g('e')
    if t == 'sSub':
        return '%s_{%s}' % (nhom(g('e')), g('sub'))
    if t == 'sSup':
        return '%s^{%s}' % (nhom(g('e')), g('sup'))
    if t == 'sSubSup':
        return '%s_{%s}^{%s}' % (nhom(g('e')), g('sub'), g('sup'))
    if t == 'd':
        pr = el.find(M + 'dPr'); a, b = '(', ')'
        if pr is not None:
            x = pr.find(M + 'begChr'); a = x.get(M + 'val') if x is not None else a
            x = pr.find(M + 'endChr'); b = x.get(M + 'val') if x is not None else b
        fx = lambda c: {'{': BS + '{', '}': BS + '}', '': '.', None: '.', '‖': BS + '|'}.get(c, c)
        return BS + 'left' + fx(a) + ', '.join(om(e) for e in el.findall(M + 'e')) + BS + 'right' + fx(b)
    if t == 'func':
        return g('fName') + ' ' + g('e')
    if t == 'acc':
        pr = el.find(M + 'accPr'); ch = None
        if pr is not None and pr.find(M + 'chr') is not None:
            ch = pr.find(M + 'chr').get(M + 'val')
        cmd = {'⃗': 'vec', '→': 'overrightarrow', '̅': 'overline', '¯': 'overline', '̂': 'hat', None: 'hat', '̇': 'dot'}.get(ch, 'vec')
        return BS + cmd + '{%s}' % g('e')
    if t == 'bar':
        return BS + 'overline{%s}' % g('e')
    if t == 'nary':
        pr = el.find(M + 'naryPr'); ch = '∫'
        if pr is not None and pr.find(M + 'chr') is not None:
            ch = pr.find(M + 'chr').get(M + 'val')
        return BS + {'∑': 'sum', '∏': 'prod'}.get(ch, 'int') + '_{%s}^{%s}%s' % (g('sub'), g('sup'), g('e'))
    if t in ('limLow', 'limUpp'):
        return '%s%s{%s}' % (g('e'), '_' if t == 'limLow' else '^', g('lim'))
    if t == 'eqArr':
        return BS + 'begin{aligned}' + (BS * 2 + ' ').join(om(e) for e in el.findall(M + 'e')) + BS + 'end{aligned}'
    if t == 'm':
        return BS + 'begin{matrix}' + (BS * 2 + ' ').join(' & '.join(om(e) for e in r.findall(M + 'e')) for r in el.findall(M + 'mr')) + BS + 'end{matrix}'
    if t == 't':
        return ''
    return ''.join(om(c) for c in kids(el))


def nhom(s):
    s = s.strip()
    return s if re.fullmatch(r'[A-Za-z0-9]|\\[A-Za-z]+ ?', s) else '{' + s + '}'


def sach_tex(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r' ([_^}),.])', r'\1', s)
    s = re.sub(r'(?<=[0-9A-Za-z}])\s*(?:\\ )?\s*\\text\{', lambda m: BS + ' ' + BS + 'text{', s)   # 5 Hz: có khoảng cách trước đơn vị
    return s


# ------------------------------------------------------------------ đọc Word
class Doc:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        self.root = etree.fromstring(self.z.read('word/document.xml'))
        rl = etree.fromstring(self.z.read('word/_rels/document.xml.rels'))
        self.rels = {r.get('Id'): r.get('Target') for r in rl}
        self.mt = {}
        self.hinh = {}

    def mathtype(self, obj):
        ole = [x for x in obj.iter() if ln(x) == 'OLEObject']
        img = [x for x in obj.iter() if ln(x) == 'imagedata']
        ten = self.rels.get(img[0].get(R + 'id'), '?').split('/')[-1] if img else '?'
        SUA = {'image111.wmf': BS + 'dfrac{' + BS + 'lambda_2}{' + BS + 'lambda_1}=' + BS + 'dfrac{v_1}{v_2}',
               'image112.wmf': BS + 'dfrac{' + BS + 'lambda_1}{' + BS + 'lambda_2}=' + BS + 'dfrac{v_1}{v_2}'}
        if ten in SUA:
            return SUA[ten]
        try:
            t = mtef.convert(self.z.read('word/' + self.rels[ole[0].get(R + 'id')]))
        except Exception as e:  # noqa
            cb('MathType không đọc được:', ten, repr(e)); return '?'
        t = t.replace('W_{d}', 'W_{' + BS + 'text{đ}}').replace('W_{t}', 'W_{' + BS + 'text{t}}')
        t = t.replace(BS + 'text{π}', BS + 'pi' + BS + ' ').replace(' ' + BS + 'text{', BS + ' ' + BS + 'text{')
        t = t.replace(BS + ' ' + BS + ' ', BS + ' ')
        if not t.strip() or '⟨' in t:
            cb('MathType cần xem lại:', ten, t)
        return t

    def anh(self, drw):
        """-> [(tên file trong h/, bề rộng cm)]"""
        out = []
        ext = [x for x in drw.iter() if ln(x) == 'extent']
        neo = any(ln(x) == 'anchor' for x in drw)
        cm = int(ext[0].get('cx')) / 360000 if ext else 8
        for pic in [x for x in drw.iter() if ln(x) == 'blipFill']:
            bl = [x for x in pic.iter() if ln(x) == 'blip'][0]
            src = self.rels[bl.get(R + 'embed')]
            sr = [x for x in pic.iter() if ln(x) == 'srcRect']
            crop = tuple(int(sr[0].get(k, 0)) / 100000 for k in 'ltrb') if sr else (0, 0, 0, 0)
            key = (src, crop)
            if key not in self.hinh:
                goc = os.path.basename(src); ten = os.path.splitext(goc)[0]
                im = Image.open(io.BytesIO(self.z.read('word/' + src)))
                if goc.lower().endswith(('.emf', '.wmf')):
                    im.load(dpi=300)
                w, h = im.size
                if any(crop):
                    im = im.crop((round(w * crop[0]), round(h * crop[1]), round(w * (1 - crop[2])), round(h * (1 - crop[3]))))
                    ten += 'c%d' % sum(1 for k in self.hinh if k[0] == src)
                if im.mode in ('RGBA', 'LA', 'P'):
                    im = im.convert('RGBA'); nen = Image.new('RGB', im.size, 'white'); nen.paste(im, mask=im.split()[3]); im = nen
                else:
                    im = im.convert('RGB')
                if im.size[0] > 1600:
                    im = im.resize((1600, round(im.size[1] * 1600 / im.size[0])), Image.LANCZOS)
                os.makedirs(OUT_H, exist_ok=True)
                if goc.lower().endswith(('.jpg', '.jpeg')):
                    ten += '.jpg'; im.save(os.path.join(OUT_H, ten), quality=90)
                else:
                    ten += '.png'; im.save(os.path.join(OUT_H, ten), optimize=True)
                self.hinh[key] = ten
            out.append((self.hinh[key], round(min(cm, 16.5), 1), neo))
        if not out:
            cb('Hình vẽ không có ảnh (shape), bỏ qua')
        return out

    def atoms(self, p):
        """đoạn văn -> danh sách phần tử: ['c', kí tự, đậm, gạch chân, sub|sup|''] | ['m', latex] | ['img', tên, cm]"""
        A = []
        for el in p.iter():
            if el.tag == W + 'r':
                pr = el.find(W + 'rPr'); b = u = False; v = ''
                if pr is not None:
                    x = pr.find(W + 'b'); b = x is not None and x.get(W + 'val') not in ('0', 'false')
                    x = pr.find(W + 'u'); u = x is not None and x.get(W + 'val') != 'none'
                    x = pr.find(W + 'vertAlign'); v = {'subscript': 'sub', 'superscript': 'sup'}.get(x.get(W + 'val'), '') if x is not None else ''
                for c in el:
                    if c.tag == W + 't':
                        for ch in (c.text or ''):
                            o = ord(ch)
                            if 0xF000 <= o <= 0xF0FF:
                                if o - 0xF000 not in SYM: cb('Kí tự Symbol chưa biết:', hex(o))
                                ch = SYM.get(o - 0xF000, '?')
                            A.append(['c', ' ' if ch == '\xa0' else ch, b, u, v])
                    elif c.tag in (W + 'tab', W + 'br', W + 'cr'):
                        A.append(['c', ' ', b, False, ''])
                    elif c.tag == W + 'noBreakHyphen':
                        A.append(['c', '-', b, u, v])
                    elif c.tag == W + 'sym':
                        o = int(c.get(W + 'char'), 16) & 0xFF
                        if o not in SYM: cb('Kí tự Symbol chưa biết:', c.get(W + 'char'))
                        A.append(['c', SYM.get(o, '?'), b, u, v])
                    elif c.tag == W + 'object':
                        t = self.mathtype(c)
                        duoi = ''
                        m = re.search(r'(\{,\}|[.,;])$', t)      # dấu câu cuối công thức đưa ra ngoài
                        if m:
                            t = t[:m.start()]; duoi = m.group(1).strip('{}')
                        if t.strip(): A.append(['m', sach_tex(t), u])
                        for ch in duoi: A.append(['c', ch, False, False, ''])
                    elif c.tag == W + 'drawing':
                        for ten, cm, neo in self.anh(c): A.append(['img', ten, cm, neo])
                    elif c.tag == W + 'pict':
                        cb('Có hình kiểu cũ (w:pict), bỏ qua')
            elif el.tag == M + 'oMath':
                t = sach_tex(om(el))
                m = re.search(r'\s*([.,;])$', t)
                duoi = ''
                if m and not re.search(r'\d[.,]$', t):
                    t = t[:m.start()]; duoi = m.group(1)
                if t.strip(): A.append(['m', t, False])
                for ch in duoi: A.append(['c', ch, False, False, ''])
        return A


def flat(A):
    return ''.join(a[1] if a[0] == 'c' else ('￼' if a[0] == 'm' else '�') for a in A)


def render(A, anh_rieng=True):
    """-> (chuỗi có định dạng **đậm**, $công thức$; danh sách dòng [[IMG ...]])"""
    res, imgs, i = '', [], 0
    while i < len(A):
        a = A[i]
        if a[0] == 'm':
            if res.endswith('$') and not res.endswith('$$'): res += ' '
            res += '$' + a[1] + '$'; i += 1; continue
        if a[0] == 'img':
            tok = '[[IMG %s %s]]' % (a[1], a[2])
            if anh_rieng: imgs.append(tok)
            else: res += tok
            i += 1; continue
        j = i
        while j < len(A) and A[j][0] == 'c' and A[j][2] == a[2] and A[j][4] == a[4]: j += 1
        s = ''.join(x[1] for x in A[i:j]).replace('*', '∗').replace('$', '')
        if res.endswith('$') and s[:1].isalnum(): res += ' '
        i = j
        if a[4] == 'sub':
            c = s.strip(); tail = ' ' if s.endswith(' ') else ''
            if not c: res += s; continue
            sub = c if re.fullmatch(r'[0-9A-Za-z]|\d+', c) else (BS + c if c in ('max', 'min') else BS + 'text{' + c + '}')
            if res and (res[-1].isalpha()) and not res.endswith('**'):
                L = res[-1]; res = res[:-1] + '$' + (BS + GRK[L] if L in GRK else L) + '_{' + sub + '}$' + tail
            elif res.endswith('$'):
                res = res[:-1] + '_{' + sub + '}$' + tail
            elif c.isdigit():
                res += c.translate(SUBU) + tail
            else:
                res += '$_{' + sub + '}$' + tail
            continue
        if a[4] == 'sup':
            c = s.strip(); tail = ' ' if s.endswith(' ') else ''
            if not c: res += s; continue
            if c in ('o', '0', 'O') and res[-1:].isdigit():
                res += '°' + tail
            elif re.fullmatch(r'[0-9+\-−]+', c):
                if res.endswith('$'): res = res[:-1] + '^{' + c.replace('−', '-') + '}$' + tail
                else: res += c.translate(SUP) + tail
            else:
                res += '$^{' + (c if re.fullmatch(r'[A-Za-z0-9]', c) else BS + 'text{' + c + '}') + '}$' + tail
            continue
        if a[2] and re.search(r'[A-Za-zÀ-ỹ0-9]', s):
            m = re.match(r'^(\s*)(.*?)(\s*)$', s, re.S)
            res += m.group(1) + '**' + m.group(2) + '**' + m.group(3)
        else:
            res += s
    res = res.replace('****', '')
    res = re.sub(r'\s+', ' ', res).strip()
    res = re.sub(r'\s+([,;.?])(?=\s|$)', r'\1', res)
    return res, imgs


def bo_dam(s):
    return s.replace('**', '')


# ------------------------------------------------------------------ máy trạng thái
class Tach:
    def __init__(self, doc):
        self.d = doc; self.items = []; self.bai = None; self.phan = None; self.q = None; self.cho = []; self.ten = {}
        self.giu = []   # hình trôi nổi nằm ở đoạn riêng: chờ xem đoạn kế tiếp có mở câu mới không

    def moi(self):
        self.q = dict(bai=self.bai, phan=self.phan, than=[], lc=[], ul=[], ds=[], da='', lg=[], tl=False)
        self.items.append(self.q)

    def dong(self):
        q = self.q
        if q is None: return True
        return (q['phan'] == 'I' and len(q['lc']) >= 4) or (q['phan'] == 'II' and len(q['ds']) >= 4) or (q['phan'] == 'III' and q['da']) or q['tl']

    def them_anh(self, imgs):
        if not imgs: return
        if self.q is None or self.dong(): self.cho += imgs
        else: self.q['than'] += imgs

    def doan(self, p):
        A = self.d.atoms(p)
        F = flat(A)
        T = F.replace('￼', '').replace('�', '').strip()
        co_anh = [a for a in A if a[0] == 'img']
        if not T and '￼' not in F:
            if co_anh:
                if all(a[3] for a in co_anh): self.giu += render(A)[1]          # trôi nổi: thường thuộc câu ngay sau
                elif self.q is not None: self.q['lg' if self.q['tl'] else 'than'] += render(A)[1]   # nằm trong dòng: thuộc câu đang đọc
                else: self.cho += render(A)[1]
            return
        if self.giu:
            if re.match(r'^[\s�]*(Câu\s*\d+|Bài\s+\d+|Chương\s+\d+|(I|II|III|IV)\.\s)', F): self.cho += self.giu
            else: self.them_anh(self.giu)
            self.giu = []
        dam0 = next((a[2] for a in A if a[0] == 'c' and not a[1].isspace()), False)
        m = re.match(r'^Chương\s+(\d+)', T)
        if m and dam0:
            self.q = None; self.phan = None; self.cho += render(A)[1]; return
        m = re.match(r'^Bài\s+(\d+)\s*[.:]\s*(.*)$', T)
        if m and dam0:
            self.bai = 'B%s' % m.group(1); self.ten[self.bai] = m.group(2).strip(); self.q = None; self.phan = None
            self.cho += render(A)[1]; return
        m = re.match(r'^(I|II|III|IV|V)\.\s*(TRẮC NGHIỆM|TỰ LUẬN)(.*)$', T)
        if m and dam0:
            s = T.upper()
            self.phan = 'TL' if 'TỰ LUẬN' in s else 'II' if 'ĐÚNG' in s else 'III' if 'NGẮN' in s else 'I'
            self.q = None; self.cho += render(A)[1]; return
        if self.phan is None:
            if self.bai and dam0 and T.upper() == T:   # dòng thứ hai của tên bài
                self.ten[self.bai] = (self.ten[self.bai] + ' ' + T).strip(); return
            cb('Đoạn ngoài phần (bỏ qua):', self.bai, T[:80]); return
        m = re.match(r'^[\s�]*Câu\s*(\d+)\s*[.:]?\s*', F)
        if m and dam0:
            self.moi(); q = self.q
            self.cho += render([x for x in A[:m.end()] if x[0] == 'img'])[1]
            A = A[m.end():]
            if q['phan'] == 'I':
                self.phan_I(A, dau=True)
            else:
                s, imgs = render(A)
                if s: q['than'].append(s)
                q['than'] += self.cho + imgs; self.cho = []
            return
        q = self.q
        if q is None:
            cb('Đoạn trước câu đầu tiên (bỏ qua):', self.bai, self.phan, T[:80]); self.cho += render(A)[1]; return
        if q['phan'] == 'I':
            self.phan_I(A)
        elif q['phan'] == 'II':
            m = re.match(r'^\s*([a-d])\s*\)\s*', F)
            if m and (A[m.start(1)][2] or A[m.start(1)][3]):
                dung = A[m.start(1)][3]
                s, _ = render(A[m.end():], anh_rieng=False)
                q['ds'].append(['abcdefgh'[len(q['ds'])], s, dung])
            elif q['ds']:
                s, imgs = render(A)
                if T: cb('Đoạn nối vào ý đúng sai:', q['bai'], 'II', s[:70]); q['ds'][-1][1] += ' ' + s
                self.them_anh(imgs)
            else:
                s, imgs = render(A)
                if s: q['than'].append(s)
                q['than'] += imgs
        elif q['phan'] == 'III':
            m = re.match(r'^\s*(Đáp án|Đáp số|ĐS)\s*[:.]?\s*', F)
            if m and dam0:
                s, _ = render(A[m.end():]); q['da'] = bo_dam(s) or q['da']; return
            s, imgs = render(A)
            if q['da']:
                if s: q['lg'].append(s)
                self.cho += imgs
            else:
                if s: q['than'].append(s)
                q['than'] += imgs
        else:  # tự luận
            m = re.match(r'^\s*(ĐS|ĐA|Đ/S|Đáp án|Đáp số|Giải thích|Hướng dẫn giải|Hướng dẫn|Lời giải|Giải|HD)\s*[:.]?\s*', F)
            if not q['tl'] and m and dam0:
                q['tl'] = True
                if m.group(1) in ('ĐS', 'ĐA', 'Đ/S', 'Đáp án', 'Đáp số'):
                    s, imgs = render(A[m.end():]); s = bo_dam(s)
                    if s: q['da'] = s
                else:
                    s, imgs = render(A); q['lg'].append(s)
                q['lg'] += imgs; return
            s, imgs = render(A)
            if q['tl']:
                if s:
                    if not q['da'] and not q['lg']: q['da'] = bo_dam(s)
                    else: q['lg'].append(s)
                self.cho += imgs
            else:
                if s: q['than'].append(s)
                q['than'] += imgs

    def phan_I(self, A, dau=False):
        q = self.q; F = flat(A)
        moc = []
        da_co = set(x[0] for x in q['lc'])
        for m in re.finditer(r'(?:^|(?<=[\s￼�.]))([A-D])\s*[.:]', F):
            k = m.start(1)
            if not (A[k][2] or A[k][3]): continue
            if m.group(1) not in da_co:        # phương án có thể xếp theo cột (A, C rồi B, D)
                moc.append(m); da_co.add(m.group(1))
        if not moc:
            s, imgs = render(A)
            if q['lc'] and not dau:
                if s: cb('Đoạn nối vào phương án:', q['bai'], 'I', s[:70]); q['lc'][-1][1] += ' ' + s
                self.them_anh(imgs)
            else:
                if s: q['than'].append(s)
                if dau: q['than'] += self.cho; self.cho = []
                q['than'] += imgs
            return
        s, imgs = render(A[:moc[0].start()])
        if s:
            if q['lc']: q['lc'][-1][1] += ' ' + s
            else: q['than'].append(s)
        if dau: q['than'] += self.cho; self.cho = []
        q['than'] += imgs
        for i, m in enumerate(moc):
            hi = moc[i + 1].start() if i + 1 < len(moc) else len(A)
            s, _ = render(A[m.end():hi], anh_rieng=False)
            L = m.group(1)
            if A[m.start(1)][3]: q['ul'].append(L)      # chỉ tính khi chính chữ cái được gạch chân
            q['lc'].append([L, bo_dam(s) if s.startswith('**') and s.endswith('**') and s.count('**') == 2 else s])

    def bang(self, tbl):
        rows = []
        for tr in tbl.iter(W + 'tr'):
            rows.append([' '.join(render(self.d.atoms(p), anh_rieng=False)[0] for p in tc.iter(W + 'p')).strip() for tc in tr.findall(W + 'tc')])
        q = self.q
        dau = bo_dam(rows[0][0]) if rows and rows[0] else ''
        if q is not None and re.match(r'^(Đáp án|Đáp số|ĐS)', dau):
            da = ''.join(bo_dam(c).replace(' ', '') for c in rows[0][1:])
            rest = re.sub(r'^(Đáp án|Đáp số|ĐS)\s*[:.]?\s*', '', dau)
            q['da'] = (rest + da).strip()
            if q['phan'] == 'TL': q['tl'] = True
            return
        if q is None:
            cb('Bảng ngoài câu hỏi (bỏ qua):', self.bai, rows[:1]); return
        dong = ['| ' + ' | '.join(c or ' ' for c in r) + ' |' for r in rows]
        (q['lg'] if q['tl'] or (q['phan'] == 'III' and q['da']) else q['than']).extend(dong)

    def chay(self):
        for el in self.d.root.find(W + 'body'):
            if el.tag == W + 'p': self.doan(el)
            elif el.tag == W + 'tbl': self.bang(el)
        if self.cho: cb('Còn hình chưa gắn vào câu nào:', self.cho)


# Câu phần I mà bản Word gạch chân hai phương án trở lên: đáp án xác định lại theo kiến thức (giáo viên duyệt)
SUA_DA = {('B3', 'I', 2): 'C', ('B3', 'I', 3): 'C', ('B3', 'I', 4): 'B', ('B3', 'I', 8): 'C', ('B5', 'I', 10): 'C', ('B11', 'I', 2): 'B'}


def ghi(t):
    bai = {}
    for q in t.items:
        bai.setdefault(q['bai'], []).append(q)
    os.makedirs(SRC, exist_ok=True)
    noi = lambda q: re.search(r'hình|đồ thị|sơ đồ|ảnh', ' '.join(x for x in q['than'] if not x.startswith('[[IMG')).lower())
    noi2 = lambda q: re.search('(?<!mô )hình(?! sin| thành| thức| dạng| ảnh)|đồ thị', ' '.join(x for x in q['than'] if not x.startswith('[[IMG')).lower())
    for qs in bai.values():
        for q, q2 in zip(qs, qs[1:]):
            h1 = [x for x in q['than'] if x.startswith('[[IMG')]
            if h1 and not noi(q) and noi2(q2) and not any(x.startswith('[[IMG') for x in q2['than']) and q['phan'] == q2['phan']:
                q['than'] = [x for x in q['than'] if not x.startswith('[[IMG')]; q2['than'] += h1
                cb('Chuyển hình sang câu kế tiếp (câu trước không nhắc tới hình):', q['bai'], q['phan'], h1)
    for b, qs in bai.items():
        L = ['#ten %s %s' % (b, t.ten.get(b, '')), '']
        dem = {}
        for q in qs:
            dem[q['phan']] = dem.get(q['phan'], 0) + 1; so = dem[q['phan']]
            L.append('#q %s %s' % (b, q['phan']))
            L += q['than'] or ['(thiếu đề)']
            if not q['than'] or not any(not x.startswith('[[IMG') for x in q['than']): cb('Câu không có lời dẫn:', b, q['phan'], so)
            if q['phan'] == 'I':
                q['lc'].sort(key=lambda x: x[0])
                if (b, 'I', so) in SUA_DA:
                    cb('Đáp án lấy theo SUA_DA (bản Word gạch chân %s):' % q['ul'], b, 'câu', so, '->', SUA_DA[(b, 'I', so)]); q['ul'] = [SUA_DA[(b, 'I', so)]]
                L += [('%s. %s' % (a, c)) if c.strip('. ') else a + '.' for a, c in q['lc']]
                if len(q['lc']) != 4: cb('Phần I không đủ 4 phương án:', b, 'câu', so, [a for a, _ in q['lc']])
                if len(q['ul']) != 1: cb('Phần I: số phương án gạch chân khác 1:', b, 'câu', so, q['ul'])
                L.append('=> ' + (q['ul'][0] if len(q['ul']) == 1 else '?'))
            elif q['phan'] == 'II':
                L += ['%s) %s' % (a, c) for a, c, _ in q['ds']]
                if len(q['ds']) != 4: cb('Phần II không đủ 4 ý:', b, 'câu', so, len(q['ds']))
                L.append('=> ' + ' '.join('Đ' if d else 'S' for _, _, d in q['ds']))
            else:
                if q['da']: L.append('=> ' + q['da'])
                elif q['phan'] == 'III': cb('Phần III chưa có đáp án:', b, 'câu', so)
            L += ['=: ' + x for x in q['lg']]
            L.append('')
        f = os.path.join(SRC, 'B%02d.txt' % int(b[1:]))
        open(f, 'w', encoding='utf8').write('\n'.join(L))
        print(b, t.ten.get(b, ''), dem)


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a:
        print(__doc__); sys.exit(1)
    if os.path.isdir(SRC) and os.listdir(SRC) and '--ghi-de' not in sys.argv:
        print('Thư mục src đã có nội dung (có thể đã sửa tay). Thêm --ghi-de nếu muốn tách lại từ đầu.'); sys.exit(1)
    t = Tach(Doc(a[0])); t.chay(); ghi(t)
    print('Hình:', len(t.d.hinh), '· câu:', len(t.items), '· cảnh báo:', len(canh_bao))
    for c in canh_bao: print('  !', c)


if __name__ == '__main__':
    main()
