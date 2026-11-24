# -*- coding: utf-8 -*-
"""Tách tệp Word "11A5 - ÔN THI HK I 2025 - Trắc nghiệm" (198 câu, đáp án đánh dấu * trước chữ cái) thành hk1/raw.json.
Công thức MathType -> LaTeX (mtef), hình cắt đúng srcRect, lưu ở hk1/h/.  Chỗ công thức đã mất khi xuất Word (dòng báo lỗi "Mathml can't be rendered")
được thay bằng ⟦CT⟧ để gõ lại tay trong hk1/sua_ct.py.
Chạy:  python -I -X utf8 tools/k11_bai_tap/tach_11a5.py "<tệp .docx>"
"""
import sys, os, re, json
DIR = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, DIR)
import tach_docx as T
T.OUT_H = os.path.join(DIR, 'hk1', 'h')

MARK = re.compile(r'(?<![^\s])(\*?)([A-D])\.(?=\s|$)')
CT = '⟦CT⟧'

def main(path):
    d = T.Doc(path)
    body = d.root.find(T.W + 'body')
    Q = []; cur = None
    for p in body.iter(T.W + 'p'):
        A = d.atoms(p)
        for a in A:
            if a[0] == 'c': a[2] = False; a[3] = False
        f = T.flat(A)
        f = f  # chuỗi phẳng, m/img là một kí tự
        m = re.match(r'\s*Câu (\d+)\.\s', f)
        if m:
            cur = {'so': int(m.group(1)), 'than': [], 'lc': {}, 'da': None}; Q.append(cur)
            A = A[m.end():]; f = f[m.end():]
        if cur is None: continue
        # thay dòng báo lỗi công thức
        txt = f.replace("[Mathml can't be rendered: ReferenceError: XSLTProcessor is not defined]", CT)
        # sau khi thay, chiều dài khác nhau: dựng lại A theo từng kí tự
        B = []; i = 0; k = 0
        while i < len(A):
            if f.startswith("[Mathml can't be rendered: ReferenceError: XSLTProcessor is not defined]", i):
                B.append(['c', CT, False, False, '']); i += len("[Mathml can't be rendered: ReferenceError: XSLTProcessor is not defined]")
            else:
                B.append(A[i]); i += 1
        A = B; f = T.flat(A)
        # tách theo dấu A. B. C. D.
        ms = [x for x in MARK.finditer(f)] if re.match(r'\s*\*?[A-D]\.', f) or cur['lc'] else []
        if re.match(r'\s*\*?[A-D]\.(\s|$)', f):
            pos = [(x.start(), x.end(), x.group(1), x.group(2)) for x in MARK.finditer(f)]
            # chỉ nhận dãy chữ cái tăng dần
            seq = []; nxt = 'A' if not cur['lc'] else chr(ord(max(cur['lc'])) + 1)
            for s, e, star, L in pos:
                if L == nxt: seq.append((s, e, star, L)); nxt = chr(ord(nxt) + 1)
            for j, (s, e, star, L) in enumerate(seq):
                fin = seq[j + 1][0] if j + 1 < len(seq) else len(A)
                seg = A[e:fin]
                txt_o, im = T.render(seg, anh_rieng=False)
                cur['lc'][L] = txt_o
                if star: cur['da'] = L
        else:
            txt_s, im = T.render(A, anh_rieng=True)
            if txt_s: cur['than'].append(txt_s)
            cur['than'] += im
    json.dump(Q, open(os.path.join(DIR, 'hk1', 'raw.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    print(len(Q), 'câu; cảnh báo:', len(T.canh_bao))
    for c in sorted(set(T.canh_bao)): print('  !', c)

if __name__ == '__main__':
    main(sys.argv[1])


def xoa_chu_thich(ten, ti_le=(0.2, 0.8), khoang=8):
    """Hình 2 (sóng dừng trên dây) bị Word cắt dở dòng chú thích 'hình 2: dùng cho các câu…': xóa phần chữ thừa
    ở giữa hình (giữ nguyên dây, giá đỡ hai bên)."""
    from PIL import Image
    import numpy as np
    f = os.path.join(DIR, 'hk1', 'h', ten)
    im = Image.open(f).convert('RGB'); a = np.array(im); g = np.array(im.convert('L')); h, w = g.shape
    x0, x1 = int(ti_le[0] * w), int(ti_le[1] * w)
    dark = (g[:, x0:x1] < 225).sum(axis=1)
    y = 0
    while y < h and dark[y] == 0: y += 1      # bỏ khoảng trắng đầu
    while y < h and dark[y] > 0: y += 1       # nội dung dây
    z = y
    while z < h and dark[z] == 0: z += 1
    if z - y >= 1 and z < h:                  # có chữ thừa sau khoảng trắng
        a[y:, x0:x1] = 255
        Image.fromarray(a).save(f, optimize=True)
        return True
    return False
