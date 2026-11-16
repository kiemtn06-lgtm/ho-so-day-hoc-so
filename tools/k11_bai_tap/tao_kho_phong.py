# -*- coding: utf-8 -*-
"""Tạo KHO PHÒNG LÀM BÀI khối 11 Chương II Sóng từ kho phòng khối 10 (D:\\phong-k10-chuong2-mo-rong, cùng động cơ),
đổi tên cho khối 11 và thêm phần NHẬN ĐÁP ÁN GỬI MUỘN (chấm đúng/sai nhưng không tính điểm, trễ cho phép 5 giây)
như phòng khối 12 Chương 2 Chất khí. Chỉ chạy một lần khi lập kho; dữ liệu câu hỏi sinh bằng tao_phong.py.

Chạy:  python -I -X utf8 tools/k11_bai_tap/tao_kho_phong.py <kho mẫu K10> <kho mới>
"""
import sys, os, shutil

MAU, MOI = sys.argv[1], sys.argv[2]
TEN = 'phong-tuong-tac-k11-chuong-2'


def doc(p):
    return open(os.path.join(MAU, p), encoding='utf8').read().replace('\r\n', '\n')


def ghi(p, s):
    f = os.path.join(MOI, p); os.makedirs(os.path.dirname(f), exist_ok=True)
    open(f, 'w', encoding='utf8', newline='\n').write(s)


def thay(s, cap, ten):
    for a, b in cap:
        n = s.count(a)
        if n != 1:
            sys.exit('%s: đoạn cần thay khớp %d lần (cần 1): %s' % (ten, n, a[:90]))
        s = s.replace(a, b)
    return s


# ------------------------------------------------------------------ server.js
SV = [
    ("// Phòng làm bài Vật lí 10 · Chương II · Mở rộng cuối bài (Bài 8-12):", "// Phòng làm bài Vật lí 11 · Chương II · Sóng (bài tập theo bài):"),
    ("(sinh bởi tools/k10_chuong2_mo_rong/tao_phong.py trong kho Hồ sơ dạy học số)", "(sinh bởi tools/k11_bai_tap/tao_phong.py trong kho Hồ sơ dạy học số)"),
    ("    if (state.mode === 'batch') state.closed = state.released; else state.closed++;",
     "    setClosed(state.mode === 'batch' ? state.released : state.closed + 1);"),
    ("mine: st ? { name: st.name, answers: st.answers } : null });", "mine: st ? { name: st.name, answers: st.answers, late: lateIds(st) } : null });"),
    ("      if (i < 0 || i >= state.released || i < state.closed) return send(res, 409, { error: 'Câu này không còn mở' });",
     "      if (i < 0 || i >= state.released) return send(res, 409, { error: 'Câu này chưa mở' });"),
    ("      st.answers[b.qid] = v; autoCheck(); save();\n      return send(res, 200, { ok: true });",
     "      // câu đã đóng: vẫn nhận; quá thời gian trễ cho phép thì ghi là muộn (không tính điểm)\n"
     "      const now = Date.now(), ca = state.closedAt[b.qid], late = i < state.closed && !(ca && now <= ca + LATE_GRACE_MS);\n"
     "      st.answers[b.qid] = v; st.at = st.at || {}; st.at[b.qid] = now;\n"
     "      if (late) { st.late = st.late || {}; st.late[b.qid] = 1; } else if (st.late) delete st.late[b.qid];\n"
     "      autoCheck(); save();\n      return send(res, 200, { ok: true, late });"),
    ("students[sid] = { name: s.name, answers: s.answers };", "students[sid] = { name: s.name, answers: s.answers, late: lateIds(s) };"),
    ("        else if (a === 'closeNext') { if (state.closed < state.released) state.closed++; }\n        else if (a === 'closeAll') state.closed = state.released;",
     "        else if (a === 'closeNext') { if (state.closed < state.released) setClosed(state.closed + 1); }\n        else if (a === 'closeAll') setClosed(state.released);"),
    ("autoSeq: state.autoSeq, view: state.view, deSo: 0 }; }", "autoSeq: state.autoSeq, view: state.view, deSo: 0, closedAt: {} }; }"),
    ("'Li10-C2-Nhom-' + parseInt(url.searchParams.get('g'), 10) : src === 'open' ? 'Li10-C2-cau-dang-mo' : 'Li10-C2-cau-da-mo'",
     "'Li11-C2-Nhom-' + parseInt(url.searchParams.get('g'), 10) : src === 'open' ? 'Li11-C2-cau-dang-mo' : 'Li11-C2-cau-da-mo'"),
    ("            if (g === true) right++;\n            return a == null ? '(chưa làm)' : ansText(q, a) + (g === true ? ' ✓' : g === false ? ' ✗' : '');",
     "            const muon = !!(s.late && s.late[q.id]);\n            if (g === true && !muon) right++;\n"
     "            return a == null ? '(chưa làm)' : ansText(q, a) + (g === true ? ' ✓' : g === false ? ' ✗' : '') + (muon ? ' (muộn, không tính điểm)' : '');"),
    ('filename="ket-qua-li10-chuong2-mo-rong.csv"', 'filename="ket-qua-li11-chuong2-song.csv"'),
]
SV_THEM = '''// Nhận cả đáp án gửi sau khi câu đã đóng (vẫn chấm đúng/sai) nhưng chỉ TÍNH ĐIỂM bài gửi kịp:
// trước lúc đóng câu (tự đóng khi đủ % quy định hoặc giáo viên đóng) cộng thêm LATE_GRACE_MS cho mạng chậm.
const LATE_GRACE_MS = 5000;
state.closedAt = state.closedAt && typeof state.closedAt === 'object' ? state.closedAt : {};   // mã câu -> thời điểm đóng
function setClosed(n) {
  const now = Date.now();
  for (let i = state.closed; i < n; i++) if (!state.closedAt[state.order[i]]) state.closedAt[state.order[i]] = now;
  state.closed = n;
}
function lateIds(st) { return Object.keys(st.late || {}); }
'''

# ------------------------------------------------------------------ public/index.html
IX = [
    ("ids.forEach(function(id){var a=S.responses[id].answers||{},s=0,l=0;cols.forEach(function(i){var x=qs[i];if(grade(x,a[x.id],keyFor(x.id))===true){l++;if(i<k)s++;}});sc[id]=s;lv[id]=l;});",
     "ids.forEach(function(id){var a=S.responses[id].answers||{},s=0,l=0;cols.forEach(function(i){var x=qs[i];if(grade(x,a[x.id],keyFor(x.id))===true&&!isLate(S.responses[id],x.id)){l++;if(i<k)s++;}});sc[id]=s;lv[id]=l;});"),
    ("""      if(g===true){t++;colC[j]++;h+='<td class="c-ok" title="Đúng">✓</td>';}
      else if(g===false)h+='<td class="c-bad" title="Sai">✗</td>';""",
     """      var lt=isLate(S.responses[id],x.id);
      if(g===true){if(!lt)t++;colC[j]++;h+='<td class="c-ok'+(lt?' c-late':'')+'" title="'+(lt?'Đúng · gửi muộn, không tính điểm':'Đúng')+'">✓</td>';}
      else if(g===false)h+='<td class="c-bad'+(lt?' c-late':'')+'" title="'+(lt?'Sai · gửi muộn, không tính điểm':'Sai')+'">✗</td>';"""),
    ("● đã gửi (chưa có đáp án). Số trong ô tiêu đề", "● đã gửi (chưa có đáp án). Ô viền gạch: gửi muộn (sau khi câu đã đóng), vẫn chấm đúng/sai nhưng không tính điểm. Số trong ô tiêu đề"),
    ("    if(i<k&&grade(qs[i],mine[id],keyFor(id))===true)right++;}", "    if(i<k&&grade(qs[i],mine[id],keyFor(id))===true&&!isLate(S.mine,id))right++;}"),
    ("  var id=q.id,sent=ans!=null,d=S.draft[id];", "  var id=q.id,sent=ans!=null,d=S.draft[id],late=isLate(S.mine,id);"),
    ("  if(closed){\n", "  if(closed&&sent){\n"),
    ("+(g===true?'Đúng':g===false?'Sai':'Chưa làm')+'</span></div>'+qBody(q)+optsView(q,ans,keyFor(id));",
     "+(g===true?'Đúng':g===false?'Sai':'Chưa làm')+(late?' · gửi muộn':'')+'</span></div>'+qBody(q)+optsView(q,ans,keyFor(id));\n"
     "    if(late)h+='<div class=\"kv\">Em gửi sau khi câu đã đóng: vẫn chấm đúng/sai nhưng không tính điểm.</div>';"),
    ("  h+='<span class=\"tag\">'+(sent?'Đã gửi':'Đang mở')+'</span></div>'+qBody(q);",
     "  h+='<span class=\"tag'+(closed?' off':'')+'\">'+(closed?'Đã đóng · vẫn gửi được':sent?'Đã gửi':'Đang mở')+'</span></div>'+qBody(q);\n"
     "  if(closed)h+='<div class=\"note\">Câu đã đóng. Em vẫn gửi đáp án để biết đúng sai, nhưng bài gửi muộn không tính điểm.</div>';"),
    ("    qs.forEach(function(x,i){if(i<r&&grade(x,a[x.id],keyFor(x.id))===true){l++;if(i<k)s++;}});sc[id]=s;lv[id]=l;});",
     "    qs.forEach(function(x,i){if(i<r&&grade(x,a[x.id],keyFor(x.id))===true&&!isLate(S.responses[id],x.id)){l++;if(i<k)s++;}});sc[id]=s;lv[id]=l;});"),
    ("""      if(g===true){t++;colC[i]++;h+='<td class="c-ok" title="Đúng">✓</td>';}
      else if(g===false){h+='<td class="c-bad" title="Sai">✗</td>';}""",
     """      var lt=isLate(R,x.id);
      if(g===true){if(!lt)t++;colC[i]++;h+='<td class="c-ok'+(lt?' c-late':'')+'" title="'+(lt?'Đúng · gửi muộn, không tính điểm':'Đúng')+'">✓</td>';}
      else if(g===false){h+='<td class="c-bad'+(lt?' c-late':'')+'" title="'+(lt?'Sai · gửi muộn, không tính điểm':'Sai')+'">✗</td>';}"""),
    ("● đã gửi (chưa có đáp án). % đúng mỗi câu tính trên số em đã trả lời. Điểm /10 = số câu đúng ÷ số câu đã mở × 10.",
     "● đã gửi (chưa có đáp án). Ô viền gạch: gửi muộn (sau khi câu đã đóng), vẫn chấm đúng/sai nhưng không tính điểm. % đúng mỗi câu tính trên số em đã trả lời. Điểm /10 = số câu đúng ÷ số câu đã mở × 10."),
    ("body:JSON.stringify({sid:SID,qid:d.q,value:val})}).then(function(){\n      S.mine.answers=S.mine.answers||{};S.mine.answers[d.q]=val;delete S.draft[d.q];",
     "body:JSON.stringify({sid:SID,qid:d.q,value:val})}).then(function(j){\n      S.mine.answers=S.mine.answers||{};S.mine.answers[d.q]=val;"
     "S.mine.late=(S.mine.late||[]).filter(function(x){return x!==d.q});if(j&&j.late)S.mine.late.push(d.q);delete S.draft[d.q];"),
    ("l.download='ket-qua-li10-chuong2-mo-rong.csv';", "l.download='ket-qua-li11-chuong2-song.csv';"),
]


def main():
    if os.path.exists(MOI) and os.listdir(MOI):
        sys.exit('Thư mục %s đã có nội dung, không ghi đè.' % MOI)
    os.makedirs(MOI, exist_ok=True)
    for f in ('wordx.js', '.gitignore', 'chay-tren-may.bat', 'QUY_TRINH_TAO_PHONG_MOI.md', os.path.join('tools', 'kiem_tra.js')):
        os.makedirs(os.path.dirname(os.path.join(MOI, f)) or MOI, exist_ok=True)
        shutil.copy2(os.path.join(MAU, f), os.path.join(MOI, f))
    shutil.copytree(os.path.join(MAU, 'public', 'lib'), os.path.join(MOI, 'public', 'lib'))

    s = thay(doc('server.js'), SV, 'server.js')
    moc = "function num(x) {"       # chèn khối đóng câu ngay sau phần khởi tạo state: tìm chỗ dùng state.closed đầu tiên trong hàm
    k = s.index('\nfunction ', s.index('state.students'))   # hàm đầu tiên sau khi state đã nạp xong
    s = s[:k + 1] + SV_THEM + s[k + 1:]
    assert moc in s
    ghi('server.js', s)

    h = thay(doc(os.path.join('public', 'index.html')), IX, 'index.html')
    a = "function num(x){"
    assert h.count(a) == 1
    h = h.replace(a, "function isLate(R,id){return !!(R&&R.late&&R.late.indexOf(id)>=0);}   /* gửi sau khi câu đã đóng: chấm đúng/sai nhưng không tính điểm */\n" + a)
    a = "</style>"
    k = h.index(a)
    h = h[:k] + "td.c-late{outline:2px dashed currentColor;outline-offset:-5px;opacity:.7}\n" + h[k:]
    ghi(os.path.join('public', 'index.html'), h)

    ghi('package.json', doc('package.json').replace('phong-k10-chuong2-mo-rong', TEN))
    ghi('render.yaml', doc('render.yaml').replace('phong-k10-chuong2-mo-rong', TEN))
    print('Đã tạo kho', MOI, '· còn lại: sinh dữ liệu bằng tao_phong.py, sửa HUONG_DAN.md')


if __name__ == '__main__':
    main()
