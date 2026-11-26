/* Kiểm thử Tạo đề kiểm tra (nguon/lib/tao_de.js) không cần trình duyệt:
   - mọi công thức trong ngân hàng đổi được sang OMML (Equation của Word), không lỗi
   - rút đủ câu theo mẫu phiếu, các mã đề có cùng bộ câu, đáp án mỗi mã đúng sau khi đảo phương án
   - bài gửi sang Chấm điểm đúng định dạng (parseKey* của cham-diem/index.html đọc lại được)
   - ghi tệp Word mẫu (đề + đáp án) vào thư mục cho ở tham số 1 (nếu có) để mở bằng Word xem.
   Chạy: node tools/kiem_tao_de.js [thư mục ra] */
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
global.window = global; global.self = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { addEventListener: () => {}, getElementById: () => null };
global.atob = global.atob || (s => Buffer.from(s, 'base64').toString('binary'));
window.katex = require(path.join(R, 'nguon/lib/katex.js'));
for (const f of ['k12-2.js', 'k10-3.js', '../config.js']) eval(fs.readFileSync(path.join(R, 'nguon/data', f), 'utf8'));
eval(fs.readFileSync(path.join(R, 'nguon/lib/tao_de.js'), 'utf8'));
TaoDe.init({ cfg: window.HO_SO, data: window.HSDH_DATA, ve: () => {} });
const X = TaoDe._;
let loi = 0; const sai = m => { loi++; console.log('  ✗ ' + m); };

/* 1. công thức */
let nct = 0;
for (const dl in HSDH_DATA) HSDH_DATA[dl].bai.forEach(b => b.cau_hoi.forEach(q => {
  const s = JSON.stringify(q); (s.match(/\$[^$]+\$/g) || []).forEach(t => {
    const tex = JSON.parse('"' + t.slice(1, -1) + '"'); nct++;
    const o = X.omml(tex);
    if (!/^<m:oMath>/.test(o) || o === '<m:oMath></m:oMath>') sai(q.id + ': công thức không đổi được: ' + tex);
  });
}));
console.log('Công thức đổi sang Equation: ' + nct + ' công thức');
const mau = X.omml('\\vec{F}_{1}+1{,}5\\cdot 10^{-3}\\ \\mathrm{m/s^2}\\dfrac{p_1V_1}{T_1}\\sqrt{\\overline{v^2}}');
if (!/<m:acc>.*\u20d7/.test(mau) || !/<m:f>/.test(mau) || !/<m:rad>/.test(mau) || !/<m:bar>/.test(mau) || !/1,5/.test(mau)) sai('OMML mẫu thiếu thành phần: ' + mau.slice(0, 300));
const viet = X.omml('\\dfrac{pV}{T} = \\text{hằng số}');
if (viet.indexOf('hằng số'.normalize('NFC')) < 0 || /[̀-ͯ]/.test(viet)) sai('chữ tiếng Việt trong công thức bị tách dấu: ' + viet);

/* 2. tạo đề */
function thu(ten, chon, n, soMa) {
  const S = X.S; S.ten = ten; S.chon = chon; S.n = n; S.soMa = soMa; S.maDau = 101; S.daoPA = true; S.de = null;
  X.taoDe();
  const de = S.de, ma = X.lamMa(de), codes = Object.keys(ma);
  const tong = d => de.cau[d].reduce((t, ks) => t + ks.length, 0);
  console.log(ten + ': ' + ['tn', 'ds', 'tln'].map(d => d + ' ' + tong(d) + '/' + n[d]).join(', ') + ', ' + codes.length + ' mã');
  ['tn', 'ds', 'tln'].forEach(d => { if (tong(d) !== n[d]) sai(ten + ': ' + d + ' rút ' + tong(d) + ' câu, cần ' + n[d]); });
  const tat = []; ['tn', 'ds', 'tln'].forEach(d => de.cau[d].forEach(ks => tat.push(...ks)));
  if (new Set(tat).size !== tat.length) sai(ten + ': có câu bị lặp');
  tat.forEach(k => { const dl = k.split(':')[0], q = X.cau(k); const l = X.hopLe(dl, q); if (l) sai(k + ' không hợp lệ mà vẫn rút: ' + l); });
  codes.forEach(c => {
    const x = ma[c], a = X.dapAnMa(x);
    ['tn', 'ds', 'tln'].forEach(d => { const ks = x[d].map(i => i.k).sort().join(); if (ks !== tat.filter(k => X.cau(k).dang === d).sort().join()) sai(c + ': bộ câu ' + d + ' khác đề gốc'); });
    x.tn.forEach((it, i) => { const q = X.cau(it.k); if (q.tn.phuong_an[it.pa['ABCD'.indexOf(a.tn[i])]] !== q.tn.phuong_an['ABCD'.indexOf(q.tn.dap_an)]) sai(c + ' câu ' + (i + 1) + ': đáp án sau khi đảo không khớp'); });
    /* đáp án rải đều: mỗi chữ không quá ceil(n/4) + số câu không đảo được */
    const dem = {}, coDinh = x.tn.filter(it => it.pa.join() === '0,1,2,3').length; a.tn.forEach(c => dem[c] = (dem[c] || 0) + 1);
    Object.keys(dem).forEach(c => { if (dem[c] > Math.ceil(x.tn.length / 4) + coDinh) sai(c + ': đáp án ' + c + ' xuất hiện ' + dem[c] + '/' + x.tn.length + ' lần'); });
    /* câu kèm câu mẹ phải đứng ngay sau */
    x.tln.forEach((it, i) => { if (it.k === '10-3:B15-TLN2' && (!x.tln[i - 1] || x.tln[i - 1].k !== '10-3:B15-TLN1')) sai(c + ': B15-TLN2 không đứng sau B15-TLN1'); });
  });
  /* bài gửi Chấm điểm: đọc lại bằng parseKey* của cham-diem */
  const h = fs.readFileSync(path.join(R, 'cham-diem/index.html'), 'utf8');
  const src = ['parseKeyMC', 'parseKeyTF', 'parseKeySA'].map(f => h.slice(h.indexOf('function ' + f + '('), h.indexOf('\n}\n', h.indexOf('function ' + f + '(')) + 2)).join('\n');
  const P = new Function(src + '; return {mc:parseKeyMC, tf:parseKeyTF, sa:parseKeySA};')();
  const ex = X.baiCham(de);
  Object.keys(ex.codes).forEach(c => ['mc', 'tf', 'sa'].forEach(p => {
    if (!ex.parts[p].enabled) return; const e = ex.codes[c][p], r = P[p](e.keyText, ex.parts[p].n);
    if (r.error) sai(c + ' ' + p + ': ' + r.error); else if (JSON.stringify(r.key) !== JSON.stringify(e.key)) sai(c + ' ' + p + ': key khác keyText');
  }));
  return de;
}
const k10 = {}; HSDH_DATA['10-3'].bai.forEach(b => k10['10-3:' + b.ma] = 1);
const k12 = {}; HSDH_DATA['12-2'].bai.forEach(b => k12['12-2:' + b.ma] = 1);
const de1 = thu('KT thường xuyên K10 Chương 3', k10, { tn: 9, ds: 2, tln: 3 }, 4);
const de2 = thu('KT K10 Chương 3 mẫu 36-8-6', k10, { tn: 36, ds: 8, tln: 6 }, 2);
const de3 = thu('KT K12 Chương 2', k12, { tn: 18, ds: 4, tln: 6 }, 2);
/* thiếu câu thì báo, không treo */
X.S.chon = k12; X.S.n = { tn: 40, ds: 10, tln: 10 }; X.taoDe();

/* 3. Word */
const out = process.argv[2];
if (out) {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'de-k10-923.docx'), X.docxDe(de1));
  fs.writeFileSync(path.join(out, 'dap-an-k10-923.docx'), X.docxDapAn(de1));
  fs.writeFileSync(path.join(out, 'de-k10-3686.docx'), X.docxDe(de2));
  fs.writeFileSync(path.join(out, 'de-k12.docx'), X.docxDe(de3));
  console.log('Đã ghi tệp Word mẫu vào ' + out);
} else { X.docxDe(de1); X.docxDapAn(de1); }
if (Buffer.from(X.docxDe(de2)).toString('utf8').indexOf('(SGK tr') >= 0) sai('đề in còn ghi nguồn (SGK tr...)');
console.log(loi ? '\nCÓ ' + loi + ' LỖI' : '\nĐúng hết.');
process.exit(loi ? 1 : 0);
