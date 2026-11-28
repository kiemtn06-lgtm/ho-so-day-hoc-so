/* Đưa câu hỏi trong tài liệu "Vật lí 10 HK I" (tools/cau_word_k10_c3.json) lên ĐẦU mục Bài tập của từng bài trong nguon/data/k10-3.js.
   Câu có sẵn (bài thêm, mở rộng) giữ nguyên, xếp sau. Chạy lại nhiều lần không bị trùng. build_du_lieu_roi.js tự gọi.
   Chạy: node tools/gop_cau_word.js   rồi   node tools/dong_goi.js */
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', 'nguon', 'data', 'k10-3.js');
const them = JSON.parse(fs.readFileSync(path.join(__dirname, 'cau_word_k10_c3.json'), 'utf8'));
const s = fs.readFileSync(f, 'utf8'), dau = 'window.HSDH_DATA["10-3"]=', i = s.indexOf(dau) + dau.length;
const d = JSON.parse(s.slice(i).trim().replace(/;$/, ''));
d.bai.forEach(b => {
  const cu = b.cau_hoi.filter(q => !q.w), moi = them.bai[b.ma] || [];
  b.cau_hoi = moi.concat(cu);
  console.log(b.ma + ':', moi.length, 'câu tài liệu HK I +', cu.length, 'câu thêm');
});
Object.keys(d.anh).forEach(k => { if (k.startsWith('HK1/')) delete d.anh[k]; });
Object.assign(d.anh, them.anh);
fs.writeFileSync(f, s.slice(0, i) + JSON.stringify(d) + ';\n');
