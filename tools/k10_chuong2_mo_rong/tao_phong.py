# -*- coding: utf-8 -*-
"""Sinh dữ liệu PHÒNG LÀM BÀI trực tuyến cho phần Mở rộng cuối bài, Vật lí 10 Chương II (Bài 8-12),
cùng động cơ với phòng khối 12 Chương 2 (D:\\phong-chuong-2-chat-khi).

Nguồn: src/p*.txt (đọc bằng dung.py, cùng cách tách câu, bỏ câu trùng). Hình lấy từ bai-giang/k10-c2-mr/h
(chạy dung.py trước). Nội dung chép nguyên văn, chỉ đổi định dạng.

Chạy:  python -I -X utf8 tools/k10_chuong2_mo_rong/tao_phong.py <thư mục kho phòng>
Tạo ra trong kho phòng:
  data/cfg.json          câu hỏi, nhóm (theo bài và dạng), tab, ma trận đề ôn 18 TN - 4 ĐS - 6 TLN
  data/key.json          đáp án, lời giải
  data/word_parts.json   đoạn Word của từng câu (công thức là Equation) để máy chủ ghép file .docx khi bấm "Xuất Word"
  nguon-goc/K10_C2_Mo_rong_tong_hop.docx   file Word khung (chứa hình) mà word_parts.json tham chiếu
  public/img/*.jpg       hình của câu
"""
import sys, os, re, json, shutil, collections
from PIL import Image
from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dung  # noqa: E402

TITLE = 'Luyện tập Vật lí 10 · Chương II. Động học · Mở rộng cuối bài'
WORD_SRC = 'nguon-goc/K10_C2_Mo_rong_tong_hop.docx'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
# câu không đưa vào phòng (không chấm được): bản gốc không có phương án đúng
BO = {'Không có'}


class HinhCo:
    """Thay dung.Hinh: dùng hình đã cắt sẵn ở bai-giang/k10-c2-mr/h, không cần file PDF."""
    def __init__(self):
        self.dung = {}

    def cat(self, ln):
        p, x0, y0, x1, y1 = map(int, dung.IMG_RE.match(ln).groups())
        ten = 't%d_%d_%d.jpg' % (p, x0, y0)
        f = os.path.join(dung.OUT, 'h', ten)
        if not os.path.exists(f):
            sys.exit('Thiếu hình %s: chạy dung.py trước' % f)
        if ten not in self.dung:
            self.dung[ten] = Image.open(f).size
        return f, ten, self.dung[ten]


# ------------------------------------------------------------------ chữ: định dạng của phòng ($...$ giữ nguyên, <b>, <i>, xuống dòng)
def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def chu(s):
    out, b, i, bi = [], False, False, False
    for t in dung.TOK.split(s):
        if not t:
            continue
        if t == '***':
            bi = not bi; out.append('<b><i>' if bi else '</i></b>'); continue
        if t == '**':
            b = not b; out.append('<b>' if b else '</b>'); continue
        if t == '*':
            i = not i; out.append('<i>' if i else '</i>'); continue
        if t == '<br>':
            out.append('\n'); continue
        if t.startswith('$'):
            out.append(t); continue
        out.append(esc(t))
    return ''.join(out)


def bang_html(rows):
    cells = [[c.strip() for c in r.strip().strip('|').split('|')] for r in rows]
    n = max(len(r) for r in cells)
    h = '<table class="data">'
    for r in cells:
        h += '<tr>' + ''.join('<td%s>%s</td>' % (' colspan="%d"' % (n - len(r) + 1) if k == len(r) - 1 and len(r) < n else '', chu(c))
                              for k, c in enumerate(r)) + '</tr>'
    return h + '</table>'


def than_cau(hinh, lines):
    """Thân câu -> (văn bản, [hình], html bảng)."""
    txt, imgs, html, i = [], [], [], 0
    while i < len(lines):
        ln = lines[i]
        if dung.IMGS_RE.match(ln):
            for x in dung.IMG1.findall(ln):
                imgs.append(hinh.cat(x)[1])
            i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'):
                j += 1
            html.append(bang_html(lines[i:j])); i = j; continue
        if ln.startswith('$$'):
            txt.append('$\\displaystyle ' + ln.strip('$') + '$')
        elif ln.startswith(('### ', '## ')):
            txt.append('<b>' + chu(ln.split(' ', 1)[1]) + '</b>')
        elif ln.startswith('~ '):
            txt.append(chu(ln[2:]))
        else:
            txt.append(chu(ln))
        i += 1
    return '\n'.join(txt), imgs, ''.join(html)


def dap_an_ngan(da):
    """'−3,3 (độ lớn 3,3)' -> {'v': '-3,3', 'tol': 0.049, 'alt': ['3,3']}"""
    m = re.match(r'^\s*([−–-]?\s*\d[\d ]*(?:,\d+)?)', da)
    if not m:
        return None
    v = re.sub(r'\s', '', m.group(1)).replace('−', '-').replace('–', '-')
    dp = len(v.split(',')[1]) if ',' in v else 0
    k = {'v': v, 'tol': round(0.49 * 10 ** -dp, dp + 2) if dp else 0}
    alt = re.search(r'\(độ lớn\s+([\d,]+)\)', da)
    if alt:
        k['alt'] = [alt.group(1)]
    return k


# ------------------------------------------------------------------ Word: đoạn của từng câu
def body_kids(d):
    return [e for e in d.element.body if e.tag != W + 'sectPr']


def dat_so(els):
    for t in els[0].iter(W + 't'):
        if t.text and t.text.startswith('Câu 0. '):
            t.text = t.text.replace('Câu 0. ', 'Câu ⟦N⟧. ', 1)
            return True
    return False


def ghi_dap_an(d, c, phan):
    """Phần đáp án, lời giải của một câu (như dung.cau với da=True, không in lại đề)."""
    p = dung.p_(d, before=2)
    r = p.add_run('Đáp số: ' if phan == 'III' else 'Đáp án: '); r.bold = True; r.font.color.rgb = dung.LA
    if phan == 'II' and dung.ds_list(c):
        dung.chu(p, '   '.join('%s) %s' % (k, v) for k, v in zip('abcd', dung.ds_list(c))), b0=True, mau=dung.LA)
    else:
        dung.chu(p, c['da'], b0=True, mau=dung.LA)
    for k, lg in enumerate(c['lg']):
        p = dung.p_(d, indent=0.6)
        if k == 0:
            r = p.add_run('Lời giải: '); r.italic = True; r.bold = True; r.font.color.rgb = dung.LA
        dung.chu(p, lg)


def ser(els):
    return ''.join(etree.tostring(e, encoding='unicode') for e in els)


# ------------------------------------------------------------------ chạy
def main():
    repo = sys.argv[1]
    bai, trung = dung.to_chuc(dung.doc_nguon())
    hinh = HinhCo()
    d = dung.tao_doc()
    questions, answers, explain, groups, sessions, parts, bo = [], {}, {}, {}, [], {}, []
    g_so = 0
    for ma in dung.BAI:
        B = bai.get(ma)
        if not B:
            continue
        nhieu = len(B['nhom']) > 1
        for gi, g in enumerate(B['nhom'], 1):
            g_so += 1
            groups[str(g_so)] = dung.BAI[ma] + (' · Dạng %d. %s' % (gi, g['ten']) if nhieu else '')
            for ph in ('I', 'II', 'III'):
                for k, c in enumerate(g[ph], 1):
                    qid = '%s-%s%s-%02d' % (ma, 'D%d-' % gi if nhieu else '', ph, k)
                    if c['da'] in BO:
                        bo.append((qid, c['trang'], c['than'][0][:80])); continue
                    text, imgs, html = than_cau(hinh, c['than'])
                    q = {'id': qid, 'group': g_so, 'set': 'g', 'topic': int(ma[1:]),
                         'type': {'I': 'mc', 'II': 'tf', 'III': 'short'}[ph], 'text': text}
                    if ph == 'I':
                        q['options'] = [chu(x[1]) for x in c['lc']]
                        key = c['da'] if c['da'] in ('A', 'B', 'C', 'D') else None
                    elif ph == 'II':
                        q['options'] = [chu(x[1]) for x in c['ds']]
                        key = [v == 'Đ' for v in dung.ds_list(c)] or None
                    else:
                        key = dap_an_ngan(c['da'])
                    if key is None:
                        sys.exit('Không đọc được đáp án câu %s: %r' % (qid, c['da']))
                    fig = {}
                    if imgs:
                        fig['img'] = imgs; fig['alt'] = 'Hình của câu ' + qid
                    if html:
                        fig['html'] = html
                    if fig:
                        q['fig'] = fig
                    questions.append(q)
                    answers[qid] = key
                    explain[qid] = ('<b><i>Hướng dẫn giải:</i></b> ' + '\n'.join(chu(x) for x in c['lg'])) if c['lg'] else ''
                    # đoạn Word: đề (bỏ dòng "Đáp số: ……" vì máy chủ tự thêm) và đáp án
                    n0 = len(body_kids(d)); dung.cau(d, hinh, c, 0, ph, False); stem = body_kids(d)[n0:]
                    if ph == 'III':
                        last = stem[-1]
                        assert 'Đáp số' in ''.join(t.text or '' for t in last.iter(W + 't')), qid
                        last.getparent().remove(last); stem = stem[:-1]
                    if not dat_so(stem):
                        sys.exit('Không đặt được chỗ đánh số câu %s' % qid)
                    n0 = len(body_kids(d)); ghi_dap_an(d, c, ph); ans = body_kids(d)[n0:]
                    parts[qid] = {'stem': ser(stem), 'ans': ser(ans)}
            sessions.append({'name': groups[str(g_so)], 'end': len(questions)})

    cfg = {'title': TITLE, 'released': 0, 'closed': 0,
           'tabs': [{'id': 'mc', 'ten': 'Trắc nghiệm', 'types': ['mc']}, {'id': 'tf', 'ten': 'Đúng sai', 'types': ['tf']},
                    {'id': 'short', 'ten': 'Trả lời ngắn', 'types': ['short']}],
           'groups': groups, 'sessions': sessions, 'questions': questions,
           'matrix': {'name': 'Đề ôn ngẫu nhiên toàn chương',
                      'rules': [{'type': 'mc', 'n': 18}, {'type': 'tf', 'n': 4}, {'type': 'short', 'n': 6}]}}
    for sub in ('data', 'nguon-goc', os.path.join('public', 'img')):
        os.makedirs(os.path.join(repo, sub), exist_ok=True)
    json.dump(cfg, open(os.path.join(repo, 'data', 'cfg.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump({'answers': answers, 'explain': explain, 'note': {}},
              open(os.path.join(repo, 'data', 'key.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    # hình
    imgdir = os.path.join(repo, 'public', 'img')
    can = {n for q in questions for n in q.get('fig', {}).get('img', [])}
    for f in os.listdir(imgdir):
        if f not in can:
            os.remove(os.path.join(imgdir, f))
    for n in can:
        shutil.copy2(os.path.join(dung.OUT, 'h', n), os.path.join(imgdir, n))
    # Word khung + đoạn từng câu
    src = os.path.join(repo, WORD_SRC)
    d.save(src)
    import zipfile
    doc = zipfile.ZipFile(src).read('word/document.xml').decode('utf-8')
    head = doc[:doc.index('<w:body>') + len('<w:body>')]
    tail = doc[doc.rindex('<w:sectPr'):]
    json.dump({'src': WORD_SRC, 'head': head, 'tail': tail, 'items': parts},
              open(os.path.join(repo, 'data', 'word_parts.json'), 'w', encoding='utf-8'), ensure_ascii=False)

    print('Số câu:', len(questions), dict(collections.Counter(q['type'] for q in questions)), '| nhóm:', len(groups),
          '| hình:', len(can), '| câu trùng đã bỏ (dung.py):', len(trung))
    for k, v in groups.items():
        print('  nhóm %s: %s (%d câu)' % (k, v, sum(1 for q in questions if q['group'] == int(k))))
    for b in bo:
        print('  KHÔNG đưa vào phòng (bản gốc không có phương án đúng):', b)
    print('Đáp án trả lời ngắn có đáp án thay thế:', [(q, a) for q, a in answers.items() if isinstance(a, dict) and a.get('alt')])


if __name__ == '__main__':
    main()
