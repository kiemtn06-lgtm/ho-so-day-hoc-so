# Tách file "tu_de_thi_tong_hop_DA_GOP_523_cau.docx" thành các ĐƠN VỊ CÂU (câu đơn hoặc cụm câu chùm).
# Mỗi đơn vị gồm: các phần tử Word của ĐỀ (stem) và của ĐÁP ÁN + HƯỚNG DẪN + NGUỒN, giữ nguyên XML (hình, công thức).
# Chạy: python -I -X utf8 tach_cau.py <file.docx>   (in thống kê; dùng như module: from tach_cau import tach)
import sys, re, docx
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
CAU = re.compile(r'^\s*Câu\s+(\d+)\.\s*\[([A-Z0-9]+-[A-Z]+-[IVX]+-\d+)(\s*\(\*\))?\]')
CHUM = re.compile(r'^\s*Sử dụng các thông tin sau cho Câu\s+(\d+)\s+và\s+Câu\s+(\d+)')
DAPAN = re.compile(r'^\s*(Đáp án|Đáp số|Hướng dẫn|Nguồn|ĐA\s*:)')
LEVEL = {'Nhận biết': 'NB', 'Thông hiểu': 'TH', 'Vận dụng cao': 'VDC', 'Vận dụng': 'VD'}

def text(e):
    return ''.join(x.text or '' for x in e.iter(W + 't'))

def style(e):
    s = e.find(W + 'pPr/' + W + 'pStyle')
    return s.get(W + 'val') if s is not None else ''

def tach(path):
    d = docx.Document(path)
    ch = list(d.element.body.iterchildren())
    units, cur = [], None
    part = bai = None
    started = False
    for i, e in enumerate(ch):
        t = text(e) if e.tag == W + 'p' else ''
        st = style(e) if e.tag == W + 'p' else ''
        if st == 'Heading1':
            if t.startswith('PHẦN I.'): part, started = 'I', True
            elif t.startswith('PHẦN II.'): part = 'II'
            elif t.startswith('PHẦN III.'): part = 'III'
            elif t.startswith('PHỤ LỤC'): started = False
            cur = None; continue
        if not started: continue
        if st == 'Heading2':
            m = re.match(r'Bài (\d+)\.', t); bai = int(m.group(1)) if m else bai
            cur = None; continue
        if st == 'Heading3':
            cur = None; continue
        m1, m2 = CAU.match(t), CHUM.match(t)
        if m2:
            cur = {'part': part, 'bai': bai, 'chum': True, 'stem': [e], 'ans': [], 'cau': [], 'codes': [], 'idx': i}
            units.append(cur); continue
        if m1:
            if cur is not None and cur['chum'] and len(cur['cau']) < 2 and not cur['ans']:
                pass  # câu thứ 1/2 của cụm chùm
            else:
                cur = {'part': part, 'bai': bai, 'chum': False, 'stem': [], 'ans': [], 'cau': [], 'codes': [], 'idx': i}
                units.append(cur)
            cur['cau'].append(int(m1.group(1))); cur['codes'].append(m1.group(2) + (m1.group(3) or ''))
            cur['stem'].append(e); continue
        if cur is None:
            continue
        if DAPAN.match(t) or (cur['ans'] and not (st == 'CaptionedFigure')):
            cur['ans'].append(e)
        elif cur['ans']:
            cur['ans'].append(e)
        else:
            cur['stem'].append(e)
    return d, units

def mucdo(code):
    return code.split('-')[1]

if __name__ == '__main__':
    d, units = tach(sys.argv[1])
    import collections
    c = collections.Counter((u['part'], u['bai']) for u in units)
    print('đơn vị:', len(units), '| số câu:', sum(len(u['cau']) for u in units), '| chùm:', sum(1 for u in units if u['chum']))
    for k in sorted(c): print(k, c[k])
    lv = collections.Counter((u['part'], mucdo(u['codes'][0])) for u in units if u['codes'])
    print(sorted(lv.items()))
    bad = [u for u in units if not u['codes'] or not u['ans'] or (u['chum'] and len(u['cau']) != 2)]
    print('đơn vị bất thường:', len(bad))
    for u in bad[:8]: print(u['part'], u['bai'], u['chum'], u['cau'], u['codes'], len(u['ans']), text(u['stem'][0])[:80])
