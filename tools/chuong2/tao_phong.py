# Sinh dữ liệu phòng làm bài Chương 2 (data/cfg.json, data/key.json, public/img/*) từ file 523 câu,
# theo đúng cách chia buổi của chia_buoi.py. Nội dung chép nguyên văn từ Word (chuyển công thức Word sang dạng $...$).
# Chạy: python -I -X utf8 tao_phong.py <nguồn 523 câu.docx> <thư mục kho phòng>
import sys, os, re, json, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tach_cau import tach, W
from chia_buoi import chia, TEN_BAI, mucdo

M = '{http://schemas.openxmlformats.org/officeDocument/2006/math}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
V = '{urn:schemas-microsoft-com:vml}'
WEB_IMG = ('png', 'jpeg', 'jpg', 'gif')


def tag(e):
    return e.tag.split('}')[1] if '}' in e.tag else e.tag


# ---------- công thức Word (OMML) -> chuỗi $...$ mà trang phòng làm bài hiểu được ----------
def kids(e):
    return ''.join(tex(c) for c in e)


def grp(e, name):
    c = e.find(M + name)
    return kids(c) if c is not None else ''


def br(s):
    return '{' + s + '}'


def tex(e):
    t = tag(e)
    if t == 'r':
        s = ''.join(x.text or '' for x in e.iter(M + 't'))
        s = s.replace('\\', '\\\\').replace('{', '\\{').replace('}', '\\}')
        nor = e.find(M + 'rPr/' + M + 'nor') is not None
        sty = e.find(M + 'rPr/' + M + 'sty')
        plain = nor or (sty is not None and sty.get(M + 'val') == 'p')
        if plain and re.fullmatch(r'[A-Za-zÀ-ỹ]{2,}', s.strip() or '-'):
            return '\\text{' + s + '}'
        return s
    if t == 'f':
        return '\\frac' + br(grp(e, 'num')) + br(grp(e, 'den'))
    if t == 'sSup':
        return br(grp(e, 'e')) + '^' + br(grp(e, 'sup'))
    if t == 'sSub':
        return br(grp(e, 'e')) + '_' + br(grp(e, 'sub'))
    if t == 'sSubSup':
        return br(grp(e, 'e')) + '_' + br(grp(e, 'sub')) + '^' + br(grp(e, 'sup'))
    if t == 'sPre':
        return br('') + '_' + br(grp(e, 'sub')) + '^' + br(grp(e, 'sup')) + br(grp(e, 'e'))
    if t == 'rad':
        deg = grp(e, 'deg')
        return ('{}^' + br(deg) if deg.strip() else '') + '\\sqrt' + br(grp(e, 'e'))
    if t == 'acc':
        pr = e.find(M + 'accPr/' + M + 'chr')
        ch = pr.get(M + 'val') if pr is not None else '̂'
        inner = grp(e, 'e')
        return '\\vec' + br(inner) if ch in ('⃗', '→', '⃑') else inner
    if t == 'bar':
        return grp(e, 'e')
    if t == 'd':
        pr = e.find(M + 'dPr')
        b, en, sep = '(', ')', ','
        if pr is not None:
            if pr.find(M + 'begChr') is not None: b = pr.find(M + 'begChr').get(M + 'val') or ''
            if pr.find(M + 'endChr') is not None: en = pr.find(M + 'endChr').get(M + 'val') or ''
            if pr.find(M + 'sepChr') is not None: sep = pr.find(M + 'sepChr').get(M + 'val') or ''
        esc = lambda c: {'{': '\\{', '}': '\\}'}.get(c, c)
        return esc(b) + sep.join(kids(c) for c in e.findall(M + 'e')) + esc(en)
    if t == 'nary':
        pr = e.find(M + 'naryPr/' + M + 'chr')
        ch = pr.get(M + 'val') if pr is not None else '∫'
        return ch + '_' + br(grp(e, 'sub')) + '^' + br(grp(e, 'sup')) + grp(e, 'e')
    if t == 'func':
        return grp(e, 'fName') + ' ' + grp(e, 'e')
    if t in ('limLow', 'limUpp'):
        return grp(e, 'e') + ('_' if t == 'limLow' else '^') + br(grp(e, 'lim'))
    if t == 'eqArr':
        return ' ; '.join(kids(c) for c in e.findall(M + 'e'))
    if t == 'm':
        return ' ; '.join(' , '.join(kids(c) for c in mr.findall(M + 'e')) for mr in e.findall(M + 'mr'))
    if t.endswith('Pr') or t in ('ctrlPr',):
        return ''
    return kids(e)


# ---------- đoạn văn Word -> chuỗi định dạng của phòng ----------
def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('$', '＄')


class Doc:
    def __init__(self, path, imgdir):
        self.z = zipfile.ZipFile(path)
        from xml.etree import ElementTree as ET
        self.rels = {}
        for r in ET.fromstring(self.z.read('word/_rels/document.xml.rels')):
            self.rels[r.get('Id')] = r.get('Target')
        self.imgdir = imgdir
        self.saved = set()
        self.skipped = []

    def img(self, rid):
        tgt = self.rels.get(rid)
        if not tgt or not tgt.startswith('media/'):
            return None
        ext = tgt.rsplit('.', 1)[-1].lower()
        if ext not in WEB_IMG:
            self.skipped.append(tgt)
            return None
        name = 'c2_' + os.path.basename(tgt)
        if name not in self.saved:
            os.makedirs(self.imgdir, exist_ok=True)
            open(os.path.join(self.imgdir, name), 'wb').write(self.z.read('word/' + tgt))
            self.saved.add(name)
        return name

    def runs(self, e, out, imgs):
        """Duyệt nội dung một đoạn: chữ (giữ chỉ số trên/dưới), tab, xuống dòng, công thức, hình."""
        for c in e:
            t = tag(c)
            if t == 'r':
                va = c.find(W + 'rPr/' + W + 'vertAlign')
                va = va.get(W + 'val') if va is not None else ''
                for x in c:
                    xt = tag(x)
                    if xt == 't':
                        s = esc(x.text or '')
                        if s and va in ('superscript', 'subscript'):
                            s = ('<sup>%s</sup>' if va == 'superscript' else '<sub>%s</sub>') % s
                        out.append(s)
                    elif xt == 'tab':
                        out.append('\t')
                    elif xt in ('br', 'cr'):
                        out.append('\n')
                    elif xt in ('drawing', 'pict', 'object'):
                        for b in x.iter(A + 'blip'):
                            n = self.img(b.get(R + 'embed'))
                            if n: imgs.append(n)
                        for b in x.iter(V + 'imagedata'):
                            n = self.img(b.get(R + 'id'))
                            if n: imgs.append(n)
                    elif xt == 'sym':
                        out.append('?')
            elif t == 'oMath':
                out.append('$' + tex(c).strip() + '$')
            elif t == 'oMathPara':
                for m in c.iter(M + 'oMath'):
                    out.append('$' + tex(m).strip() + '$')
            elif t in ('hyperlink', 'ins', 'smartTag', 'sdt', 'sdtContent', 'fldSimple', 'customXml'):
                self.runs(c, out, imgs)

    def para(self, p):
        out, imgs = [], []
        ppr = p.find(W + 'pPr')
        self.runs(p, out, imgs)
        return ''.join(out).replace('$$', ''), imgs

    def table(self, t):
        rows, imgs = [], []
        for tr in t.iter(W + 'tr'):
            cells = []
            for tc in tr.findall(W + 'tc'):
                txt = []
                for p in tc.iter(W + 'p'):
                    s, im = self.para(p)
                    txt.append(s.strip())
                    imgs += im
                cells.append(' '.join(x for x in txt if x))
            rows.append(cells)
        return rows, imgs

    def blocks(self, els):
        """Danh sách khối: ('p', text, imgs) hoặc ('t', rows, imgs)."""
        out = []
        for e in els:
            if e.tag == W + 'p':
                s, im = self.para(e)
                out.append(('p', s, im))
            elif e.tag == W + 'tbl':
                rows, im = self.table(e)
                out.append(('t', rows, im))
        return out


def html_table(rows):
    def cell(c, tg):
        return '<%s>%s</%s>' % (tg, c, tg)
    h = '<table class="data">'
    for i, r in enumerate(rows):
        h += '<tr>' + ''.join(cell(c, 'th' if i == 0 else 'td') for c in r) + '</tr>'
    return h + '</table>'


HEAD = re.compile(r'^\s*Câu\s+\d+\.\s*\[[^\]]*\]\s*')
OPT_MC = re.compile(r'(?:^|\n|\t)\s*([A-D])\.\s*')
OPT_TF = re.compile(r'^\s*([a-d])\)\s*')
NUM = re.compile(r'-?\d[\d  ]*(?:[.,]\d+)?')


def split_mc(text):
    """Tách đoạn chứa các phương án A–D (có thể nằm chung dòng, cách nhau bằng tab)."""
    ms = list(OPT_MC.finditer(text))
    seq = [m for m in ms]
    want = 'ABCD'
    pick, k = [], 0
    for m in seq:
        if k < 4 and m.group(1) == want[k]:
            pick.append(m); k += 1
    if k != 4:
        return None, None
    stem = text[:pick[0].start()]
    opts = [text[pick[i].end():(pick[i + 1].start() if i < 3 else len(text))].strip() for i in range(4)]
    return stem, opts


def build(src, repo):
    doc = Doc(src, os.path.join(repo, 'public', 'img'))
    d, units = tach(src)
    bs = chia(units)
    questions, answers, explain, note, groups, sessions = [], {}, {}, {}, {}, []
    problems = []
    for x in bs:
        g = x['so']
        groups[str(g)] = 'Buổi %d · Bài %d. %s' % (g, x['bai'], TEN_BAI[x['bai']])
        for part in ('I', 'II', 'III'):
            for u in x[part]:
                stem_b = doc.blocks(u['stem'])
                ans_b = doc.blocks(u['ans'])
                shared = ''
                if u['chum']:
                    shared = re.sub(r'^\s*Sử dụng các thông tin sau cho Câu\s+\d+\s+và\s+Câu\s+\d+\s*:\s*', '', stem_b[0][1]).strip()
                    shared_imgs = stem_b[0][2]
                    stem_b = stem_b[1:]
                # cắt khối theo từng câu (câu chùm có 2 câu)
                per = []
                for b in stem_b:
                    if b[0] == 'p' and HEAD.match(b[1]):
                        per.append([b])
                    elif per:
                        per[-1].append(b)
                    else:
                        per.append([b])
                # lời giải theo từng câu
                ans_per = {c: [] for c in u['cau']}
                srcnote = []
                curc = u['cau'][0]
                # câu chùm không ghi "Đáp án câu N": mỗi đoạn "Hướng dẫn:" mở lời giải của câu kế tiếp
                marked = any(b[0] == 'p' and re.match(r'\s*Đáp án câu\s+\d+', b[1]) for b in ans_b)
                hd = -1
                for b in ans_b:
                    if u['chum'] and not marked and b[0] == 'p' and re.match(r'\s*Hướng dẫn\s*:', b[1]):
                        hd = min(hd + 1, len(u['cau']) - 1)
                        curc = u['cau'][hd]
                    if b[0] != 'p':
                        ans_per[curc].append(html_table(b[1]))
                        continue
                    m = re.match(r'\s*Đáp án câu\s+(\d+)', b[1])
                    if m and int(m.group(1)) in ans_per:
                        curc = int(m.group(1))
                    if b[1].strip().startswith('Nguồn:'):
                        srcnote.append(b[1].strip())
                        continue
                    if b[1].strip():
                        ans_per[curc].append(b[1].strip())
                    for im in b[2]:
                        ans_per[curc].append('[[img:%s]]' % im)
                for ci, (cau, code) in enumerate(zip(u['cau'], u['codes'])):
                    qid = code.split(' ')[0]
                    blocks = per[ci] if ci < len(per) else []
                    lines, figs, html = [], [], []
                    if shared:
                        lines.append('<i>Dữ kiện chung (câu chùm):</i> ' + shared)
                        figs += shared_imgs
                    for b in blocks:
                        if b[0] == 'p':
                            lines.append(HEAD.sub('', b[1]) if b is blocks[0] else b[1])
                        else:
                            html.append(html_table(b[1]))
                        figs += b[2]
                    full = '\n'.join(l for l in lines if l.strip() != '' or False)
                    q = {'id': qid, 'group': g, 'set': 'g', 'topic': x['bai'], 'level': mucdo(code)}
                    ex = '\n'.join(ans_per.get(cau, []))
                    key = None
                    if part == 'I':
                        q['type'] = 'mc'
                        stem, opts = split_mc(full)
                        if opts is None:
                            problems.append((qid, 'không tách được 4 phương án A–D')); stem, opts = full, ['', '', '', '']
                        q['text'] = stem.strip()
                        q['options'] = opts
                        m = re.search(r'(?:Đáp án|ĐA)\s*:?\s*([A-D])\b', ex)
                        key = m.group(1) if m else None
                    elif part == 'II':
                        q['type'] = 'tf'
                        stem_l, opts = [], []
                        for l in full.split('\n'):
                            m = OPT_TF.match(l)
                            if m and len(opts) < 4 and m.group(1) == 'abcd'[len(opts)]:
                                opts.append(l[m.end():].strip())
                            elif opts:
                                opts[-1] += '\n' + l
                            else:
                                stem_l.append(l)
                        if not opts:   # các ý a–d nằm trong bảng "Phát biểu | Đ | S"
                            for b in blocks:
                                if b[0] != 't':
                                    continue
                                rows = [rw for rw in b[1] if rw and OPT_TF.match(rw[0])]
                                if len(rows) == 4:
                                    opts = [OPT_TF.sub('', rw[0]).strip() for rw in rows]
                                    html.remove(html_table(b[1]))
                                    break
                        if len(opts) != 4:
                            problems.append((qid, 'không tách được 4 ý a–d (được %d)' % len(opts)))
                        q['text'] = '\n'.join(stem_l).strip()
                        q['options'] = opts
                        m = re.search(r'a\)\s*(Đ|S)\w*\s*[;,.]?\s*b\)\s*(Đ|S)\w*\s*[;,.]?\s*c\)\s*(Đ|S)\w*\s*[;,.]?\s*d\)\s*(Đ|S)', ex)
                        key = [v == 'Đ' for v in m.groups()] if m else None
                    else:
                        q['type'] = 'short'
                        q['text'] = full.strip()
                        m = (re.search(r'Đáp án(?: câu\s+\d+)?\s*:\s*([^\n]*)', ex) or re.search(r'Đáp số\s*:?\s*([^\n]*)', ex)
                             or re.search(r'ĐA\s*:\s*([^\n]*)', ex))
                        if m:
                            n = NUM.search(m.group(1))
                            if n:
                                key = {'v': re.sub(r'\s', '', n.group(0)), 'tol': 0}
                    if key is None:
                        problems.append((qid, 'không đọc được đáp án'))
                        if 'nguồn không có đáp án' in ex:
                            srcnote = ['Nguồn không có đáp án: câu này chỉ ghi nhận bài làm, không chấm.'] + srcnote
                    fig = {}
                    if figs:
                        fig['img'] = figs
                        fig['alt'] = 'Hình của câu ' + qid
                    if html:
                        fig['html'] = ''.join(html)
                    if fig:
                        q['fig'] = fig
                    questions.append(q)
                    if key is not None:
                        answers[qid] = key
                    explain[qid] = ex or '(Nguồn không có lời giải.)'
                    if srcnote:
                        note[qid] = ' '.join(srcnote)
        sessions.append({'name': groups[str(g)], 'end': len(questions)})
    cfg = {'title': 'Luyện tập Vật lí 12 · Chương 2. Khí lí tưởng', 'released': 0, 'closed': 0,
           'groups': groups, 'sessions': sessions, 'questions': questions}
    os.makedirs(os.path.join(repo, 'data'), exist_ok=True)
    json.dump(cfg, open(os.path.join(repo, 'data', 'cfg.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump({'answers': answers, 'explain': explain, 'note': note},
              open(os.path.join(repo, 'data', 'key.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    import collections
    print('Số câu:', len(questions), dict(collections.Counter(q['type'] for q in questions)), '| nhóm/buổi:', len(groups),
          '| hình:', len(doc.saved), '| hình bỏ qua (không hiển thị được trên web):', sorted(set(doc.skipped)))
    print('Câu cần xem lại:', len(problems))
    for p in problems:
        print('  ', p)


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
