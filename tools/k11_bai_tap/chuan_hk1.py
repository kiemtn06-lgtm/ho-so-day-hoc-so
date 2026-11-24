# -*- coding: utf-8 -*-
"""hk1/raw.json (tach_11a5.py) + hk1/sua_ct.py  ->  hk1/cau_hk1.json: danh sách câu đã sửa công thức, bỏ câu trùng, chia nhóm.
Chạy:  python -I -X utf8 tools/k11_bai_tap/chuan_hk1.py"""
import os, sys, json, re
DIR = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(DIR, 'hk1'))
from sua_ct import SUA, BO

NHOM = [  # (từ câu, mã, tên nhóm)
    (1, 'DDH', 'Dao động điều hòa'),
    (46, 'TD', 'Dao động tắt dần. Dao động cưỡng bức. Cộng hưởng'),
    (63, 'SC', 'Sóng cơ. Mô tả sóng. Sóng ngang, sóng dọc'),
    (111, 'DT', 'Sóng điện từ'),
    (120, 'GT', 'Giao thoa sóng'),
    (146, 'SD', 'Sóng dừng'),
    (182, 'SA', 'Sóng âm. Đo tốc độ truyền âm'),
]
PRE = 'Mở rộng ôn tập HK I · '
IMG_DAI = re.compile(r'\[\[IMG image10(?:064|111|114|117|120|123|126|129|132|135|138|141)\.png')


def lam_sach(s):
    s = re.sub(r'[-]', '', s)
    s = re.sub(r'\$\s*\$', '', s)
    return s


def main():
    Q = json.load(open(os.path.join(DIR, 'hk1', 'raw.json'), encoding='utf8'))
    out, thay, bo_trung, seen = [], [], [], {}
    for q in Q:
        so = q['so']
        if so in BO:
            continue
        q['than'] = [lam_sach(x) for x in q['than']]
        q['lc'] = {k: lam_sach(v) for k, v in q['lc'].items()}
        if so == 146:   # hình 1 bị dính vào cuối phương án A trong tệp gốc: đưa lên thân câu
            m = re.search(r'\[\[IMG [^\]]+\]\]', q['lc']['A'])
            q['lc']['A'] = q['lc']['A'].replace(m.group(0), '').strip(); q['than'].append(m.group(0))
        mat_ct = '⟦CT⟧' in ' '.join(q['than']) + ' '.join(q['lc'].values())
        s = SUA.get(so)
        if isinstance(s, int): s = SUA[s]
        if s:
            if 'than_sub' in s: q['than'] = [x.replace(*s['than_sub']) for x in q['than']]
            if 'than' in s: q['than'] = s['than']
            if 'lc_sub' in s: q['lc'] = {k: v.replace(*s['lc_sub']) for k, v in q['lc'].items()}
            if 'lc' in s: q['lc'].update(s['lc'])
            thay.append(so)
        txt = ' '.join(q['than']) + ' '.join(q['lc'].values())
        if '⟦CT⟧' in txt:
            sys.exit('Câu %d còn ⟦CT⟧ chưa sửa' % so)
        if len(q['lc']) != 4 or q['da'] not in 'ABCD' or not q['da']:
            sys.exit('Câu %d: thiếu phương án/đáp án' % so)
        key = (' '.join(q['than']), tuple(sorted(q['lc'].values())), q['lc'][q['da']])
        if key in seen:
            bo_trung.append((so, seen[key])); continue
        seen[key] = so
        ma = [n for n in NHOM if n[0] <= so][-1]
        c_w = lambda m: '[[IMG %s %s]]' % (m.group(1), max(float(m.group(2)), 12.0) if float(m.group(2)) < 12 else m.group(2))
        if any('[[IMG' in x for x in q['than']):   # hình dài (dây sóng dừng, 4 hình ngang): phóng rộng cho đọc được nhãn A, B, C...
            q['than'] = [re.sub(r'\[\[IMG (\S+) ([\d.]+)\]\]', c_w, x) if IMG_DAI.search(x) else x for x in q['than']]
        out.append({'so': so, 'nhom': ma[1], 'than': q['than'], 'lc': [q['lc'][k] for k in 'ABCD'], 'da': q['da'], 'go_lai': mat_ct})
    json.dump({'nhom': [(m, PRE + t) for _, m, t in NHOM], 'cau': out}, open(os.path.join(DIR, 'hk1', 'cau_hk1.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('Giữ', len(out), 'câu | gõ lại/sửa', len(thay), '| bỏ trùng', len(bo_trung), '| bỏ vì mất dữ kiện', sorted(BO))
    print('Câu trùng (câu bỏ -> câu giữ):', bo_trung)
    from collections import Counter
    print(Counter(c['nhom'] for c in out))


if __name__ == '__main__':
    main()
