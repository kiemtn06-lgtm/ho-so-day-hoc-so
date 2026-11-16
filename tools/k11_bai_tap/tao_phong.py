# -*- coding: utf-8 -*-
"""Sinh dữ liệu PHÒNG LÀM BÀI trực tuyến Vật lí 11 · Chương II. Sóng (bài tập theo bài: Bài 8, 9, 11, 12, 13, 15),
cùng động cơ với phòng khối 10 Chương II và phòng khối 12 Chương 2.

Nguồn: tools/k11_bai_tap/src/B*.txt (đọc bằng dung.py) và hình ở bai-giang/k11-bt/h (chạy tach_docx.py, dung.py trước).
Chỉ đưa vào phòng các câu chấm tự động được: phần I (nhiều lựa chọn), II (đúng sai), III (trả lời ngắn). Tự luận không đưa vào.

Chạy:  python -I -X utf8 tools/k11_bai_tap/tao_phong.py <thư mục kho phòng>
Tạo ra trong kho phòng:
  data/cfg.json          câu hỏi, nhóm (mỗi bài một nhóm), tab, ma trận đề ôn 18 TN - 4 ĐS - 6 TLN
  data/key.json          đáp án
  data/word_parts.json   đoạn Word của từng câu (công thức là Equation) để máy chủ ghép file .docx khi bấm "Xuất Word"
  nguon-goc/K11_C2_Song_tong_hop.docx   file Word khung (chứa hình) mà word_parts.json tham chiếu
  public/img/*           hình của câu
"""
import sys, os, re, json, shutil, collections, zipfile
from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dung  # noqa: E402

CHUONG = 'C2'
TITLE = 'Luyện tập Vật lí 11 · Chương II. Sóng'
WORD_SRC = 'nguon-goc/K11_C2_Song_tong_hop.docx'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
TOK = dung.k10.TOK


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def chu(s):
    """định dạng của phòng: $...$ giữ nguyên, <b>, <i>, xuống dòng"""
    assert '[[IMG' not in s, 'Phòng chưa hiện được hình nằm trong dòng: ' + s[:80]
    out, b, i, bi = [], False, False, False
    for t in TOK.split(s):
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


def than_cau(lines):
    """Thân câu -> (văn bản, [hình], html bảng)."""
    txt, imgs, html, i = [], [], [], 0
    while i < len(lines):
        ln = lines[i]
        if dung.IMG_LINE.match(ln):
            imgs += [m.group(1) for m in dung.IMG1.finditer(ln)]; i += 1; continue
        if ln.startswith('|'):
            j = i
            while j < len(lines) and lines[j].startswith('|'):
                j += 1
            rows = [[c.strip() for c in r.strip().strip('|').split('|')] for r in lines[i:j]]
            html.append('<table class="data">' + ''.join('<tr>' + ''.join('<td>%s</td>' % chu(c) for c in r) + '</tr>' for r in rows) + '</table>')
            i = j; continue
        txt.append(chu(ln)); i += 1
    return '\n'.join(txt), imgs, ''.join(html)


def dap_an_ngan(da):
    """'-9,9' -> {'v': '-9,9', 'tol': 0.049}: đáp án lẻ nhận sai lệch dưới nửa đơn vị chữ số cuối"""
    m = re.fullmatch(r'\s*([−–-]?\s*\d[\d ]*(?:,\d+)?)\s*', da)
    if not m:
        return None
    v = re.sub(r'\s', '', m.group(1)).replace('−', '-').replace('–', '-')
    dp = len(v.split(',')[1]) if ',' in v else 0
    return {'v': v, 'tol': round(0.49 * 10 ** -dp, dp + 2) if dp else 0}


def body_kids(d):
    return [e for e in d.element.body if e.tag != W + 'sectPr']


def dat_so(els):
    for t in els[0].iter(W + 't'):
        if t.text and t.text.startswith('Câu 0. '):
            t.text = t.text.replace('Câu 0. ', 'Câu ⟦N⟧. ', 1)
            return True
    return False


def ghi_dap_an(d, c, phan):
    p = dung.p_(d, before=2)
    r = p.add_run('Đáp số: ' if phan == 'III' else 'Đáp án: '); r.bold = True; r.font.color.rgb = dung.LA
    if phan == 'II':
        dung.chu(p, '   '.join('%s) %s' % (k, v) for k, v in zip('abcd', dung.ds_list(c))), b0=True, mau=dung.LA)
    else:
        dung.chu(p, c['da'], b0=True, mau=dung.LA)


def ser(els):
    return ''.join(etree.tostring(e, encoding='unicode') for e in els)


def main():
    repo = sys.argv[1]
    bai = dung.doc_nguon()
    d = dung.k10.tao_doc()
    questions, answers, explain, groups, sessions, parts = [], {}, {}, {}, [], {}
    g_so = 0
    for ma in dung.BAI:
        B = bai.get(ma)
        if not B or dung.BAI[ma][0] != CHUONG:
            continue
        g_so += 1
        groups[str(g_so)] = dung.BAI[ma][1]
        for ph in ('I', 'II', 'III'):
            for k, c in enumerate(B[ph], 1):
                qid = '%s-%s-%02d' % (ma, ph, k)
                text, imgs, html = than_cau(c['than'])
                q = {'id': qid, 'group': g_so, 'set': 'g', 'topic': int(ma[1:]),
                     'type': {'I': 'mc', 'II': 'tf', 'III': 'short'}[ph], 'text': text}
                if ph == 'I':
                    q['options'] = [chu(x[1]) or '(xem hình)' for x in c['lc']]
                    key = c['da'] if c['da'] in ('A', 'B', 'C', 'D') and len(c['lc']) == 4 else None
                elif ph == 'II':
                    q['options'] = [chu(x[1]) for x in c['ds']]
                    key = [v == 'Đ' for v in dung.ds_list(c)] if len(c['ds']) == 4 and dung.ds_list(c) else None
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
                explain[qid] = ('<b><i>Hướng dẫn giải:</i></b> ' + '\n'.join(chu(x) for x in c['lg'] if not x.startswith(('[[IMG', '|')))) if c['lg'] else ''
                n0 = len(body_kids(d)); dung.cau(d, c, 0, ph, False); stem = body_kids(d)[n0:]
                if ph == 'III':     # bỏ dòng "Đáp số: ……" vì máy chủ tự thêm
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
    imgdir = os.path.join(repo, 'public', 'img')
    can = {n for q in questions for n in q.get('fig', {}).get('img', [])}
    for f in os.listdir(imgdir):
        if f not in can:
            os.remove(os.path.join(imgdir, f))
    for n in can:
        shutil.copy2(os.path.join(dung.OUT, 'h', n), os.path.join(imgdir, n))
    src = os.path.join(repo, WORD_SRC)
    d.save(src)
    doc = zipfile.ZipFile(src).read('word/document.xml').decode('utf-8')
    head = doc[:doc.index('<w:body>') + len('<w:body>')]
    tail = doc[doc.rindex('<w:sectPr'):]
    json.dump({'src': WORD_SRC, 'head': head, 'tail': tail, 'items': parts},
              open(os.path.join(repo, 'data', 'word_parts.json'), 'w', encoding='utf-8'), ensure_ascii=False)

    print('Số câu:', len(questions), dict(collections.Counter(q['type'] for q in questions)), '| nhóm:', len(groups), '| hình:', len(can))
    for k, v in groups.items():
        print('  nhóm %s: %s (%d câu)' % (k, v, sum(1 for q in questions if q['group'] == int(k))))


if __name__ == '__main__':
    main()
