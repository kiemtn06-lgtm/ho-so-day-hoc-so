# -*- coding: utf-8 -*-
"""GHÉP "Mở rộng ôn tập HK I" (tệp Word 11A5 - ÔN THI HK I 2025, đã tách bằng tach_11a5.py + chuan_hk1.py) vào phòng làm bài K11
(kho D:\\phong-tuong-tac-k11-chuong-2) mà KHÔNG tạo phòng mới và KHÔNG dựng lại 6 nhóm Bài 8-15 cũ (phòng đã có chỉnh tay).
Thêm nhóm 7.. (câu set 'hk1'), phần Word (word_parts.json + hình trong nguon-goc/*.docx), hình (public/img), đáp án (key.json).
Chạy lại được nhiều lần (xóa phần HK1 cũ rồi thêm lại).
    python -I -X utf8 tools/k11_bai_tap/tao_phong_hk1.py <thư mục kho phòng>
"""
import sys, os, re, json, io, zipfile, shutil
DIR = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, DIR)
import tao_phong as TP
dung = TP.dung
dung.OUT = os.path.join(DIR, 'hk1')          # dung.hinh() lấy hình ở hk1/h
SET, TOPIC0, TIEN_TO = 'hk1', 101, 'Mở rộng ôn tập HK I'


def main(repo):
    D = json.load(open(os.path.join(DIR, 'hk1', 'cau_hk1.json'), encoding='utf8'))
    sys.path.insert(0, os.path.join(DIR, 'hk1'))
    from sua_ct import SUA
    ghi_chu = {}
    for k, v in SUA.items():
        v = SUA[v] if isinstance(v, int) else v
        if v.get('ghi_chu'):
            ghi_chu[k] = v['ghi_chu']
    cfg = json.load(open(os.path.join(repo, 'data', 'cfg.json'), encoding='utf8'))
    key = json.load(open(os.path.join(repo, 'data', 'key.json'), encoding='utf8'))
    wp = json.load(open(os.path.join(repo, 'data', 'word_parts.json'), encoding='utf8'))
    # --- xóa phần HK1 cũ (chạy lại)
    cfg['questions'] = [q for q in cfg['questions'] if q.get('set') != SET]
    for g in [g for g in cfg['groups'] if int(g) > 6]:
        del cfg['groups'][g]
    for i in [i for i in key['answers'] if i.startswith('HK1-')]:
        for k in ('answers', 'explain', 'note'):
            key.get(k, {}).pop(i, None)
    for i in [i for i in wp['items'] if i.startswith('HK1-')]:
        del wp['items'][i]

    d2 = dung.k10.tao_doc()
    groups, idx = {}, {}
    g_so = max(int(g) for g in cfg['groups'])
    for k, (ma, ten) in enumerate(D['nhom']):
        g_so += 1; groups[ma] = g_so; cfg['groups'][str(g_so)] = ten; idx[ma] = k
    n_ma, parts, imgs_used = {}, {}, set()
    for c in D['cau']:
        ma = c['nhom']; n_ma[ma] = n_ma.get(ma, 0) + 1
        qid = 'HK1-%s-%02d' % (ma, n_ma[ma])
        text, imgs, html = TP.than_cau(c['than'])
        q = {'id': qid, 'group': groups[ma], 'set': SET, 'topic': TOPIC0 + idx[ma], 'type': 'mc', 'text': text,
             'options': [TP.chu(x) or '(xem hình)' for x in c['lc']]}
        if imgs:
            q['fig'] = {'img': imgs, 'alt': 'Hình của câu ' + qid}; imgs_used.update(imgs)
            rong = [float(m.group(2)) for m in dung.IMG1.finditer(' '.join(c['than']))]
            if any(w >= 12 for w in rong):     # hình dài (dây sóng dừng): hiện rộng để đọc nhãn A, B, C...
                q['fig']['w'] = [560 if w >= 12 else 0 for w in rong]
        cfg['questions'].append(q)
        key['answers'][qid] = c['da']
        key.setdefault('explain', {})[qid] = ''
        nt = 'Nguồn: tệp 11A5 - ÔN THI HK I 2025, câu %d.' % c['so']
        if c['so'] in ghi_chu:
            nt += ' ' + ghi_chu[c['so']]
        if c.get('go_lai'):
            nt += ' Công thức của câu này bị mất trong tệp Word, đã gõ lại theo nội dung và đáp án đánh dấu: cô kiểm tra lại.'
        key.setdefault('note', {})[qid] = nt
        cc = {'than': c['than'], 'lc': list(zip('ABCD', c['lc'])), 'ds': [], 'da': c['da'], 'lg': [], 'phan': 'I'}
        n0 = len(TP.body_kids(d2)); dung.cau(d2, cc, 0, 'I', False); stem = TP.body_kids(d2)[n0:]
        if not TP.dat_so(stem):
            sys.exit('Không đặt được số câu ' + qid)
        n0 = len(TP.body_kids(d2)); TP.ghi_dap_an(d2, cc, 'I'); ans = TP.body_kids(d2)[n0:]
        parts[qid] = {'stem': TP.ser(stem), 'ans': TP.ser(ans)}
    # sessions: end = số câu tính đến hết nhóm (theo thứ tự nhóm)
    cfg['questions'].sort(key=lambda q: q['group'])
    cnt = {}
    for q in cfg['questions']:
        cnt[q['group']] = cnt.get(q['group'], 0) + 1
    run, ss = 0, []
    for g in sorted(int(x) for x in cfg['groups']):
        run += cnt.get(g, 0); ss.append({'name': cfg['groups'][str(g)], 'end': run})
    cfg['sessions'] = ss
    for r in cfg['matrix']['rules']:     # đề ôn trộn cũ chỉ rút trong bộ 6 nhóm Bài 8-15
        r['set'] = 'g'
    cfg['title'] = 'Luyện tập Vật lí 11 · Chương II. Sóng · ' + TIEN_TO

    # --- hình của phần Word: thêm vào tệp khung nguon-goc/*.docx, đổi rId trong các đoạn
    buf = io.BytesIO(); d2.save(buf); z2 = zipfile.ZipFile(io.BytesIO(buf.getvalue()))
    rl2 = {m.group(1): m.group(2) for m in re.finditer(r'<Relationship [^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"', z2.read('word/_rels/document.xml.rels').decode('utf8'))}
    src = os.path.join(repo, wp['src'])
    zs = zipfile.ZipFile(src); files = {n: zs.read(n) for n in zs.namelist()}; zs.close()
    rels = files['word/_rels/document.xml.rels'].decode('utf8')
    rels = re.sub(r'<Relationship [^>]*Id="rId9\d{3}"[^>]*/>', '', rels)          # bỏ quan hệ HK1 cũ
    for n in [n for n in files if n.startswith('word/media/hk1_')]:
        del files[n]
    mapa, add, k = {}, '', 9000

    def rep(m):
        nonlocal k, add
        old = m.group(2)
        if old not in mapa:
            tgt = rl2[old]; k += 1; mapa[old] = 'rId%d' % k
            files['word/media/hk1_' + os.path.basename(tgt)] = z2.read('word/' + tgt)
            add += '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/hk1_%s"/>' % (k, os.path.basename(tgt))
        return m.group(1) + mapa[old] + '"'
    for pt in parts.values():
        for fld in ('stem', 'ans'):
            pt[fld] = re.sub(r'(r:embed=")(rId\d+)"', rep, pt[fld])
    files['word/_rels/document.xml.rels'] = rels.replace('</Relationships>', add + '</Relationships>').encode('utf8')
    ct = files['[Content_Types].xml'].decode('utf8')
    for ext, mime in (('png', 'image/png'), ('jpg', 'image/jpeg'), ('jpeg', 'image/jpeg')):
        if 'Extension="%s"' % ext not in ct:
            ct = ct.replace('<Override', '<Default Extension="%s" ContentType="%s"/><Override' % (ext, mime), 1)
    files['[Content_Types].xml'] = ct.encode('utf8')
    with zipfile.ZipFile(src, 'w', zipfile.ZIP_DEFLATED) as zo:
        for n, b in files.items():
            zo.writestr(n, b)
    wp['items'].update(parts)

    imgdir = os.path.join(repo, 'public', 'img')
    for n in imgs_used:
        shutil.copy2(os.path.join(DIR, 'hk1', 'h', n), os.path.join(imgdir, n))
    for n, o in (('cfg', cfg), ('key', key), ('word_parts', wp)):
        json.dump(o, open(os.path.join(repo, 'data', n + '.json'), 'w', encoding='utf8'), ensure_ascii=False)
    print('Đã ghép', len(D['cau']), 'câu, nhóm', sorted(groups.values()), '| hình', len(imgs_used), '| tổng câu phòng:', len(cfg['questions']))


if __name__ == '__main__':
    main(sys.argv[1])
