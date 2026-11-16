# -*- coding: utf-8 -*-
"""Gắn MÃ QR, ĐIỂM QUÁ TRÌNH (cộng dồn qua các buổi) và VÒNG TRÒN TIẾN ĐỘ theo từng câu vào một phòng làm bài.

Chạy:  python -I -X utf8 tools/phong_qr_qua_trinh/vao_phong.py D:\\phong-xxx [--thu]
  --thu : chỉ báo chỗ nào vá được / không vá được, không ghi file.
Làm gì:
  - chép qua_trinh.js (máy chủ) cạnh server.js, chép qrcode.js (thư viện mã QR, MIT) vào public/lib/
  - vá server.js và public/index.html ở các điểm neo (mỗi điểm neo phải khớp đúng 1 chỗ)
Chạy lại không sao: phòng đã vá (có dấu [QT]) thì bỏ qua.
"""
import os, re, sys, shutil, subprocess

DIR = os.path.dirname(os.path.abspath(__file__))
doc = lambda p: open(p, encoding='utf8').read()

VA_SERVER = [
    ('nạp module', r"(\nconst BYID = [^\n]*\n)",
     r"\1const QT = require('./qua_trinh')({ CFG, KEY, BYID, grade: (q, a, k) => grade(q, a, k), save: () => save() });   // điểm quá trình, số bài đã gửi theo câu, LAN cho mã QR\n"),
    ('khởi tạo', r"(\nfunction joined\(\))", r"\nQT.ensure(state);\1"),
    ('số bài đã gửi', r"(function publicConfig\(\) \{[\s\S]*?return \{)", r"\1 sent: QT.sent(state),"),
    ('điểm của em', r"(mine: st \? \{ name: st\.name,)", r"\1 qt: QT.mine(state, st),"),
    ('cất điểm khi làm lại', r"(else if \(a === 'reset'\) \{ )(state = \{[^;]*\};)", r"\1const hist = QT.finish(state); \2 QT.ensure(state, hist);"),
    ('đường dẫn giáo viên', r"(if \(!isTeacher\(req\)\) return send\(res, 401, [^\n]*\n)", r"\1      if (await QT.route(req, res, p, state, send, readJson)) return;\n"),
    ('thư viện QR', r"(\n(\s*)if \(req\.method === 'GET' && p === '/healthz'\)[^\n]*\n)",
     r"\1\2// thư viện vẽ mã QR (qrcode-generator, MIT) cho trang giáo viên\n\2if (req.method === 'GET' && p === '/lib/qrcode.js') { const b = fs.readFileSync(path.join(__dirname, 'public', 'lib', 'qrcode.js')); res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=86400', 'Content-Length': b.length }); return res.end(b); }\n"),
]
VA_HTML = [
    ('css', r"(</style>)", None),            # thay bằng nội dung qua_trinh.css
    ('hàm', r"(\nfunction act\(d\)\{)", None),  # chèn qua_trinh_client.js trước act()
    ('nút trong act', r"(\nfunction act\(d\)\{\n\s*var a=d\.act[^\n]*)", r"\1\n  if(qtAct(a,d))return;"),
    ('thẻ điểm học sinh', r"(\n  )(h\+=ringCard\(S\.config\.progress\);\n  if\(!r\)return h\+'<div class=\"card\">Chờ)", r"\1h+=qtStudentCard();\1\2"),
    ('nhắc ghi đúng tên', r"(data-in=\"name\"[^\n]*?autocomplete=\"name\">'\+)", r'''\1'<div class="kv">Ghi đúng họ tên và lớp như các buổi trước để được cộng điểm quá trình.</div>'+'''),
    ('vòng tròn câu (học sinh)', r"(var h='<section class=\"card q\"><div class=\"qh\"><span class=\"qn\">Câu '\+\(i\+1\)\+'</span>')(;)", r"\1+(closed?'':qtRing(qtSentS(id),qtSize()))\2"),
    ('nút QR, điểm quá trình', r"('<button class=\"btn\" data-act=\"csv\">)", r''''<button class="btn" data-act="qr">Mã QR</button><button class="btn" data-act="qt">Điểm quá trình</button>'+\1'''),
    ('thẻ QR, bảng điểm (giáo viên)', r"(\n  )(h\+=ringCard\(S\.config\.progress\);)(?!\n  if\(!r\)return h\+'<div class=\"card\">Chờ)", r"\1h+=qtTeacherCards(r);\1\2"),
    ('vòng tròn câu đang xem (giáo viên)', r"('<div class=\"kv\" style=\"margin:8px 0 12px\">)(<b class=\"num\">'\+A\+'/'\+P\+'</b> đã trả lời)", r"\1'+(fq<k||isV(q)?'':qtRing(A,Math.max(P,qtSize()),false,true))+'\2"),
    ('vòng tròn đầu cột tab (giáo viên)', r"(data-act=\"focus\" data-i=\"'\+i\+'\" title=\"'\+esc\(gname\(qs\[i\]\)\)\+'\">'\+ord\[i\]\+'</button>)", r"\1'+(i>=k&&!isV(qs[i])?qtRing(qtSentT(qs[i].id),qtSize(),false,true):'')+'", 'tuỳ chọn'),
    ('vòng tròn đầu cột (giáo viên)', r"(data-act=\"focus\" data-i=\"'\+i\+'\"[^\n]*?>'\+\(i\+1\)\+'</button>')", r"\1+(i>=k&&!isV(x)?qtRing(qtSentT(x.id),qtSize(),false,true):'')"),
    ('đồng bộ khi hỏi máy chủ', r"(S\.loaded=true;S\.slow=false;)", r"\1if(S.teacher)qtTick();"),
]


def va(txt, ds, ten_file, bao):
    for muc in ds:
        ten, mau, thay = muc[:3]
        n = len(re.findall(mau, txt))
        if n != 1:
            bao.append('  [%s] %s · %s: điểm neo khớp %d chỗ' % ('bỏ qua' if len(muc) > 3 and n == 0 else 'THIẾU', ten_file, ten, n)); continue
        if thay is None:
            if ten == 'css': txt = re.sub(mau, lambda m: doc(os.path.join(DIR, 'qua_trinh.css')) + m.group(1), txt, count=1)
            else: txt = re.sub(mau, lambda m: '\n' + doc(os.path.join(DIR, 'qua_trinh_client.js')).rstrip('\n') + m.group(1), txt, count=1)
        else:
            txt = re.sub(mau, thay, txt, count=1)
        bao.append('  [ok] %s · %s' % (ten_file, ten))
    return txt


def main():
    if len(sys.argv) < 2: print(__doc__); return
    phong, thu = sys.argv[1], '--thu' in sys.argv
    srv = [os.path.join(r, 'server.js') for r, d, f in os.walk(phong) if 'server.js' in f and 'node_modules' not in r and '.git' not in r]
    if len(srv) > 1:   # có bản chép thừa (thư mục con): lấy server.js cạnh render.yaml, nằm nông nhất (bản Render đang chạy)
        co = [x for x in srv if os.path.exists(os.path.join(os.path.dirname(x), 'render.yaml'))] or srv
        srv = sorted(co, key=lambda x: x.count(os.sep) + x.count('/'))[:1]
        print('Có nhiều server.js, dùng:', srv[0])
    if len(srv) != 1: print('Không xác định được server.js:', srv); return
    goc = os.path.dirname(srv[0]); html = os.path.join(goc, 'public', 'index.html')
    s, h = doc(srv[0]), doc(html)
    if "require('./qua_trinh')" in s and '[QT]' in h:
        # đã vá: chỉ cập nhật phần mã dùng chung (khối CSS, khối hàm giao diện, qua_trinh.js, qrcode.js)
        css, js = doc(os.path.join(DIR, 'qua_trinh.css')), doc(os.path.join(DIR, 'qua_trinh_client.js')).rstrip('\n')
        h2 = re.sub(r'/\* \[QT\][^\n]*\n[\s\S]*?(?=</style>)', lambda m: css, h, count=1)
        h2 = re.sub(r'/\* ---------- \[QT\][\s\S]*?\[/QT\] ---------- \*/', lambda m: js, h2, count=1)
        if thu: print(phong, ': đã vá, cập nhật sẽ đổi', 'có' if h2 != h else 'không', 'nội dung'); return
        open(html, 'w', encoding='utf8', newline='').write(h2)
        shutil.copy(os.path.join(DIR, 'qua_trinh.js'), os.path.join(goc, 'qua_trinh.js'))
        shutil.copy(os.path.join(DIR, 'qrcode.js'), os.path.join(goc, 'public', 'lib', 'qrcode.js'))
        print(phong, ': đã vá, đã cập nhật mã dùng chung'); return
    bao = []
    s2 = va(s, VA_SERVER, 'server.js', bao)
    h2 = va(h, VA_HTML, 'index.html', bao)
    print(phong); print('\n'.join(bao))
    if thu: return
    if any('[THIẾU]' in b for b in bao): print('=> CHƯA GHI: còn điểm neo chưa khớp, cần vá tay'); return
    open(srv[0], 'w', encoding='utf8', newline='').write(s2)
    open(html, 'w', encoding='utf8', newline='').write(h2)
    shutil.copy(os.path.join(DIR, 'qua_trinh.js'), os.path.join(goc, 'qua_trinh.js'))
    os.makedirs(os.path.join(goc, 'public', 'lib'), exist_ok=True)
    shutil.copy(os.path.join(DIR, 'qrcode.js'), os.path.join(goc, 'public', 'lib', 'qrcode.js'))
    r = subprocess.run(['node', '--check', srv[0]], capture_output=True, text=True)
    print('=> ĐÃ GHI.', 'server.js cú pháp đúng' if r.returncode == 0 else 'LỖI CÚ PHÁP server.js:\n' + r.stderr)


if __name__ == '__main__':
    main()
