// Sinh dữ liệu PHÒNG LÀM BÀI "Ôn tập Vật lí 12 · Chương II. Khí lí tưởng" từ trang Ôn tập trong hồ sơ (on-tap/k12-chuong2.html):
//   - Mở rộng ôn tập (Bài 8–12): khối JSON id="mr" (HTML từng bài, chuyển từ tệp .docx giáo viên cung cấp; đáp án đánh dấu class "ok"
//     ở phần I, II; dòng "Đáp số/Đáp án/ĐA" ở phần III). Công thức là ảnh (img.eq) -> [[img:...]] trong dòng; hình minh hoạ (img.ph) -> hình của câu.
//   - Đề tổng hợp (Ngày 5): ngân hàng câu luyện tập nd.bai[].cau_hoi (Bài 8–13), đề rút theo ma trận nd.ma_tran.de_tong_hop.
// Nội dung giữ nguyên văn, chỉ đổi định dạng. Câu tự luận (tl) đưa vào dạng "chỉ xem" (kèm lời giải mẫu khi đóng câu).
//
// Chạy: node tools/k12_on_tap_phong/tao_phong.js <thư mục kho phòng> [thư mục ảnh đồ thị từ ve_hinh.js] [--ghep]
// Ghi: data/cfg.json, data/key.json, public/img/* (xóa ảnh cũ mr-*, th-* trước khi ghi)
// --ghep: GHÉP vào phòng đã có (phòng Chất khí D:\phong-chuong-2-chat-khi): giữ nguyên bộ câu cũ, nhóm, buổi, ma trận đề ôn của phòng
//         (ma trận cũ chỉ rút trong bộ cũ), thêm các nhóm Mở rộng / Đề tổng hợp phía sau và ma trận thứ hai (cfg.matrices[1]).
//         Chạy lại được: câu MR*, TH-* của lần trước được thay bằng bản mới.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const GHEP = process.argv.includes('--ghep'), ARGS = process.argv.slice(2).filter(x => x !== '--ghep');
const ROOM = ARGS[0], HINH = ARGS[1];
if (!ROOM) { console.error('Thiếu thư mục kho phòng'); process.exit(1); }
const SRC = path.join(__dirname, '..', '..', 'on-tap', 'k12-chuong2.html');
const H = fs.readFileSync(SRC, 'utf8');
function json(id) { const t = '<script type="application/json" id="' + id + '">', i = H.indexOf(t) + t.length; return JSON.parse(H.slice(i, H.indexOf('</script>', i))); }
const ND = json('nd'), MR = json('mr');
const IMG = path.join(ROOM, 'public', 'img');
fs.mkdirSync(IMG, { recursive: true });
for (const f of fs.readdirSync(IMG)) if (/^(mr|th)-/.test(f)) fs.unlinkSync(path.join(IMG, f));
const TEN_BAI = {}; ND.bai.forEach(b => { TEN_BAI[+b.ma.slice(1)] = b.ten; });
const bao = [];

// ---------- ảnh data: -> tệp public/img (tên theo băm nội dung, ảnh trùng dùng chung) ----------
function luuAnh(uri, tien) {
  const m = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/s.exec(uri);
  if (!m) throw new Error('Ảnh không đọc được: ' + uri.slice(0, 40));
  const buf = Buffer.from(m[2], 'base64'), ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const ten = tien + '-' + crypto.createHash('md5').update(buf).digest('hex').slice(0, 10) + '.' + ext;
  const f = path.join(IMG, ten); if (!fs.existsSync(f)) fs.writeFileSync(f, buf);
  return ten;
}

// ---------- HTML (Mở rộng) -> định dạng chữ của phòng: <b> <i> <sub> <sup>, xuống dòng, $...$, [[img:...]] ----------
function chu(html, figs) {
  let s = html;
  s = s.replace(/<img\b[^>]*>/g, t => {
    const src = (/src="([^"]+)"/.exec(t) || [])[1] || '';
    if (/class="eq"/.test(t)) return '[[img:' + luuAnh(src, 'mr') + ']]';
    figs.img.push(luuAnh(src, 'mr')); return '';
  });
  s = s.replace(/<table[\s\S]*?<\/table>/g, t => {
    if (!/<t[dh]\b[^>]*>[\s\S]*?\S[\s\S]*?<\/t[dh]>/.test(t)) return '';          // bảng rỗng (chỉ để dàn trang)
    figs.html.push(bang(t)); return '';
  });
  s = s.replace(/<span class="math inline">([\s\S]*?)<\/span>/g, '$1');
  s = s.replace(/<(\/?)strong>/g, '<$1b>').replace(/<(\/?)em>/g, '<$1i>');
  s = s.replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|blockquote|div|h4|li)>/g, '\n');
  s = s.replace(/<(?!\/?(?:b|i|sub|sup)>)[^>]+>/g, '');                              // bỏ mọi thẻ khác, giữ chữ
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/^\s+|\s+$/g, '');
}
function bang(t) {      // giữ bảng, bỏ thuộc tính trình bày; ảnh trong ô thành /img/...
  return '<table class="data">' + t.replace(/<img\b[^>]*>/g, x => '<img src="/img/' + luuAnh((/src="([^"]+)"/.exec(x) || [])[1], 'mr') + '" alt="">')
    .replace(/<\/?(table|colgroup|col|thead|tbody)\b[^>]*>/g, '').replace(/<(tr|td|th)\b[^>]*>/g, '<$1>')
    .replace(/<span class="math inline">([\s\S]*?)<\/span>/g, '$1').replace(/<(\/?)strong>/g, '<$1b>').replace(/<(\/?)em>/g, '<$1i>')
    .replace(/<(?!\/?(?:tr|td|th|b|i|sub|sup|br|img)\b)[^>]+>/g, '').replace(/\n+/g, '') + '</table>';
}
function soNgan(txt) {   // "Đáp án: 0,92 atm." / "ĐA: 160 phút." / "Đáp số: 6" -> {v, tol}
  const m = /(?:Đáp số|Đáp án|ĐA)\s*:?\s*([−–-]?\s*\d[\d.]*(?:,\d+)?)/.exec(txt);
  if (!m) return null;
  let v = m[1].replace(/\s/g, '').replace(/[−–]/g, '-').replace(/\.+$/, '');     // "10." (dấu chấm cuối câu) -> 10
  if (/^\-?\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');                     // 1.000 -> 1000
  const dp = v.includes(',') ? v.split(',')[1].length : 0;
  return { v, tol: dp ? +(0.49 * Math.pow(10, -dp)).toFixed(dp + 2) : 0 };
}

const questions = [], answers = {}, explain = {}, groups = {}, sessions = [];
let g = 0, CU = null, KCU = null;
const LA_MOI = id => /^(MR\d|TH-)/.test(id);
if (GHEP) {      // giữ bộ câu cũ của phòng (bỏ phần đã ghép lần trước)
  CU = JSON.parse(fs.readFileSync(path.join(ROOM, 'data', 'cfg.json'), 'utf8'));
  KCU = JSON.parse(fs.readFileSync(path.join(ROOM, 'data', 'key.json'), 'utf8'));
  const goc = CU.questions.filter(q => !LA_MOI(q.id)), gs = new Set(goc.map(q => String(q.group)));
  goc.forEach(q => questions.push(q));
  for (const k of Object.keys(CU.groups)) if (gs.has(k)) groups[k] = CU.groups[k];
  (CU.sessions || []).filter(s => s.end <= goc.length).forEach(s => sessions.push(s));
  g = Math.max(...goc.map(q => +q.group));
  for (const k of ['answers', 'explain', 'note']) for (const [id, v] of Object.entries(KCU[k] || {})) if (!LA_MOI(id)) (k === 'answers' ? answers : k === 'explain' ? explain : (KCU._note = KCU._note || {}))[id] = v;
}
function nhom(ten) { g++; groups[String(g)] = ten; return g; }
function xongNhom(ten) { sessions.push({ name: ten, end: questions.length }); }

// ---------- 1. Mở rộng ôn tập ----------
for (const b of Object.keys(MR).sort((a, b) => a - b)) {
  const ten = 'Mở rộng · ' + (TEN_BAI[b] || 'Bài ' + b), gi = nhom(ten), dem = { mc: 0, tf: 0, short: 0, view: 0 };
  for (const blk of MR[b].split(/(?=<div class="mq" )/).slice(1)) {
    const k = /data-k="(\w+)"/.exec(blk)[1], so = (/Câu (\d+)\./.exec(blk) || [])[1];
    const iO = blk.search(/<div class="mq-[od]">|<p class="dapan">/), than = blk.slice(blk.indexOf('<p class="mq-s">'), iO < 0 ? undefined : iO)
      .replace(/<b class="mq-n">[\s\S]*?<\/b>\s*/, '');
    const figs = { img: [], html: [] };
    const q = { id: '', group: gi, set: 'mr', topic: +b, type: '', text: chu(than, figs) };
    let key = null;
    if (k === 'tn') {
      q.type = 'mc';
      const os = [...blk.matchAll(/<div class="mo( ok)?"><b>([A-D])\.<\/b><span>([\s\S]*?)<\/span><\/div>(?=<div class="mo|<\/div>)/g)];
      if (os.length !== 4) throw new Error('Bài ' + b + ' câu ' + so + ': đọc được ' + os.length + ' phương án');
      q.options = os.map(o => chu(o[3], figs).replace(/^\.\s*/, '') || '(xem hình)');   // ". Hình 2." -> "Hình 2."
      key = (os.find(o => o[1]) || [])[2];
    } else if (k === 'ds') {
      q.type = 'tf';
      const ys = [...blk.matchAll(/<div class="md( ok)?"><b>([a-d])\)<\/b><span>([\s\S]*?)<\/span><\/div>(?=<div class="md|<\/div>)/g)];
      if (ys.length !== 4) throw new Error('Bài ' + b + ' câu ' + so + ': đọc được ' + ys.length + ' ý');
      q.options = ys.map(y => chu(y[3], figs));
      key = ys.map(y => !!y[1]);
    } else {
      const da = (/<p class="dapan">([\s\S]*?)<\/p>/.exec(blk) || [])[1] || '';
      key = soNgan(da.replace(/<[^>]+>/g, ''));
      if (key) q.type = 'short';
      else { q.type = 'view'; explain._tmp = '<b>Đáp án:</b> ' + chu(da, figs); bao.push('Mở rộng Bài ' + b + ' câu ' + so + ': đáp án không phải số, để dạng chỉ xem'); }
    }
    dem[q.type]++;
    q.id = 'MR' + b + '-' + { mc: 'I', tf: 'II', short: 'III', view: 'TL' }[q.type] + '-' + String(dem[q.type]).padStart(2, '0');
    if (figs.img.length || figs.html.length) {
      q.fig = {}; if (figs.img.length) { q.fig.img = figs.img; q.fig.alt = 'Hình của câu ' + so; } if (figs.html.length) q.fig.html = figs.html.join('');
    }
    if (key == null && q.type !== 'view') throw new Error('Bài ' + b + ' câu ' + so + ': không có đáp án');
    questions.push(q);
    if (q.type !== 'view') answers[q.id] = key;
    if (explain._tmp) { explain[q.id] = explain._tmp; delete explain._tmp; }
  }
  xongNhom(ten);
}

// ---------- 2. Đề tổng hợp: ngân hàng câu luyện tập Bài 8–13 ----------
const hinhCau = {};
if (HINH) for (const f of fs.readdirSync(HINH)) { const m = /^th-(.+)\.png$/.exec(f); if (m) hinhCau[m[1]] = f; }
function soVN(x) { return String(x).replace('.', ','); }
for (const B of ND.bai) {
  const t = +B.ma.slice(1), ten = 'Đề tổng hợp · ' + B.ten, gi = nhom(ten);
  for (const c of B.cau_hoi) {
    const q = { id: 'TH-' + c.id, group: gi, set: 'th', topic: t, level: c.muc, text: c.de }, figs = [];
    for (const h of c.hinh || []) {
      if (!hinhCau[h]) throw new Error('Thiếu ảnh đồ thị ' + h + ' (chạy ve_hinh.js rồi truyền thư mục ảnh)');
      const ten2 = 'th-' + h + '.png'; fs.copyFileSync(path.join(HINH, hinhCau[h]), path.join(IMG, ten2)); figs.push(ten2);
    }
    if (figs.length) q.fig = { img: figs, alt: 'Đồ thị của câu', w: figs.map(() => 460) };
    if (c.dang === 'tn') {
      q.type = 'mc'; q.options = c.tn.phuong_an; answers[q.id] = c.tn.dap_an; explain[q.id] = c.tn.giai_thich || '';
    } else if (c.dang === 'ds') {
      q.type = 'tf'; q.text = c.ds.dan || c.de; q.options = c.ds.y.map(y => y.noi_dung); answers[q.id] = c.ds.y.map(y => !!y.dung);
      explain[q.id] = c.ds.y.map(y => y.nhan + ') ' + (y.giai_thich || (y.dung ? 'Đúng' : 'Sai'))).join('\n');
    } else if (c.dang === 'tln') {
      q.type = 'short'; answers[q.id] = { v: soVN(c.tln.dap_so), tol: +c.tln.dung_sai || 0 };
      explain[q.id] = (c.tln.cach_giai || '') + (c.tln.don_vi ? '\n<b>Đáp số:</b> ' + soVN(c.tln.dap_so) + ' ' + c.tln.don_vi : '');
    } else if (c.dang === 'tl') {
      q.type = 'view';
      explain[q.id] = '<b>Lời giải mẫu:</b> ' + (c.tl.loi_giai_mau || '') + ((c.tl.thang_diem || []).length ? '\n<b>Thang điểm:</b>\n' + c.tl.thang_diem.map(x => '• ' + x.y + ' (' + soVN(x.diem) + ' đ)').join('\n') : '');
    } else throw new Error('Dạng lạ ' + c.dang + ' ở ' + c.id);
    questions.push(q);
  }
  xongNhom(ten);
}

// ---------- ma trận đề tổng hợp (Ngày 5): 18 TN theo bài, 4 ĐS, 6 TLN theo bài; rút trong ngân hàng "th", hết câu thì bù từ Mở rộng ("mr") cùng bài ----------
const D = ND.ma_tran.de_tong_hop, rules = [];
for (const [b, n] of Object.entries(D.I)) rules.push({ type: 'mc', n, topic: +b.slice(1), set: 'th', bu: 'mr' });
rules.push({ type: 'tf', n: D.II.length, set: 'th', bu: 'mr' });
const tln = {}; D.III.forEach(b => { tln[b] = (tln[b] || 0) + 1; });
for (const [b, n] of Object.entries(tln)) rules.push({ type: 'short', n, topic: +b.slice(1), set: 'th', bu: 'mr' });
const matrix = { name: 'Đề tổng hợp (Ngày 5) · 18 TN – 4 ĐS – 6 TLN', rules };

let cfg;
if (GHEP) {
  // ma trận cũ của phòng: chỉ rút trong bộ câu cũ (set của bộ cũ), để đề ôn trộn như trước
  const setCu = (CU.questions.find(q => !LA_MOI(q.id)) || {}).set || 'g';
  const cu = JSON.parse(JSON.stringify((CU.matrices && CU.matrices[0]) || CU.matrix));
  cu.rules.forEach(r => { r.set = setCu; delete r.bu; });
  cfg = Object.assign({}, CU, { groups, sessions, questions, matrix: cu, matrices: [cu, matrix] });
} else {
  cfg = {
    title: 'Ôn tập Vật lí 12 · Chương II. Khí lí tưởng', released: 0, closed: 0,
    tabs: [{ id: 'mc', ten: 'Trắc nghiệm', types: ['mc'] }, { id: 'tf', ten: 'Đúng sai', types: ['tf'] }, { id: 'short', ten: 'Trả lời ngắn', types: ['short'] }],
    groups, sessions, questions, matrix
  };
}
fs.writeFileSync(path.join(ROOM, 'data', 'cfg.json'), JSON.stringify(cfg));
fs.writeFileSync(path.join(ROOM, 'data', 'key.json'), JSON.stringify(Object.assign({}, KCU || {}, { answers, explain, note: (KCU && KCU._note) || {} }, { _note: undefined })));
const dem = {}; questions.forEach(q => { const k = q.set + ' ' + q.type; dem[k] = (dem[k] || 0) + 1; });
console.log('Đã ghi', questions.length, 'câu ·', JSON.stringify(dem), '·', Object.keys(groups).length, 'nhóm ·', fs.readdirSync(IMG).filter(f => /^(mr|th)-/.test(f)).length, 'ảnh');
if (bao.length) console.log(bao.join('\n'));
