/* Lấy dữ liệu một CHƯƠNG từ các trang bài giảng tương tác rời (mỗi bài một file .html) để hồ sơ có các tab
   SGK, Kế hoạch bài dạy, Bài tập, Kiểm tra. Ghi vào nguon/data/k<mã chương>.js.
   - Câu hỏi, đáp án, lời giải: chuyển bằng chương trình từ QSETS/EXORDER của trang bài giảng (không gõ lại).
   - Hình SGK và hình của câu hỏi: lấy từ IMG nhúng sẵn trong trang.
   - Kiến thức trọng tâm, công thức, dạng bài, lỗi hay mắc, thẻ ghi nhớ: đọc từ file nội dung .json (soạn riêng).
   Chạy: node tools/build_du_lieu_roi.js tools/noi_dung_k10_chuong3.json */
const fs = require('fs'), path = require('path'), vm = require('vm');
const cfgFile = process.argv[2];
if (!cfgFile) { console.error('Thiếu tham số: <file nội dung .json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const root = path.join(__dirname, '..', 'nguon');

/* chạy phần khai báo của trang (không có trình duyệt): mọi thứ thuộc DOM được thay bằng một vật giả vô hại */
function docTrang(file) {
  const t = fs.readFileSync(file, 'utf8');
  const scripts = [...t.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const js = scripts.find(s => s.includes('const QSETS=') && s.includes('EXORDER'));
  if (!js) throw new Error('Không thấy QSETS/EXORDER trong ' + file);
  const cut = js.indexOf('/* ===== INIT ===== */');
  if (cut < 0) throw new Error('Không thấy mốc INIT trong ' + file);
  const gia = new Proxy(function () {}, {
    get: (o, k) => k === Symbol.iterator ? function* () {} : k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : gia,
    set: () => true, apply: () => gia, construct: () => gia, defineProperty: () => true, getOwnPropertyDescriptor: () => undefined, has: () => true
  });
  const ctx = { document: { querySelector: () => gia, querySelectorAll: () => [], createElement: () => gia }, katex: { renderToString: s => s },
    addEventListener() {}, Element: { prototype: {} }, CanvasRenderingContext2D: { prototype: {} }, location: { hash: '' }, history: gia,
    innerWidth: 1280, innerHeight: 720, scrollTo() {}, requestAnimationFrame() {}, performance: { now: () => 0 }, setInterval() {}, clearInterval() {}, setTimeout() {}, console };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(js.slice(0, cut) + '\n;globalThis.__OUT={QSETS:QSETS,EXORDER:EXORDER,IMG:IMG};', ctx);
  return { html: t, QSETS: ctx.__OUT.QSETS, EXORDER: ctx.__OUT.EXORDER, IMG: ctx.__OUT.IMG };
}

/* chữ có thẻ HTML của trang bài giảng -> chữ thường kèm công thức $...$ (cách hồ sơ hiển thị) */
function toT(s) {
  s = String(s == null ? '' : s).replace(/\$\$([^$]+)\$\$/g, (m, a) => '$' + a + '$').replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/g, ' ');
  const sub = b => /^[\x20-\x7E]*$/.test(b) ? b : '\\text{' + b + '}';
  s = s.replace(/<span class=['"]v['"]>([^<]*)<\/span>(?:<sub>([^<]*)<\/sub>)?/g, (m, a, b) => '$\\vec{' + a + '}' + (b ? '_{' + sub(b) + '}' : '') + '$');
  s = s.replace(/([A-Za-zμα])<sub>([^<]*)<\/sub>/g, (m, a, b) => '$' + (a === 'μ' ? '\\mu' : a === 'α' ? '\\alpha' : a) + '_{' + sub(b) + '}$');
  s = s.replace(/(\d+)<sup>([^<]*)<\/sup>/g, (m, a, b) => '$' + a + '^{' + b + '}$');
  s = s.replace(/<sup>([^<]*)<\/sup>/g, (m, a) => '$^{' + a + '}$').replace(/<sub>([^<]*)<\/sub>/g, (m, a) => '$_{' + sub(a) + '}$');
  s = s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return s.replace(/\s+/g, ' ').trim();
}

const KH = { mc: 'TN', ds: 'DS', tln: 'TLN', tl: 'TL' }, DG = { mc: 'tn', ds: 'ds', tln: 'tln', tl: 'tl' };
const out = { ten: cfg.ten, sach: cfg.sach, moDau: {}, bai: [], sgk: {}, anh: {} };
cfg.bai.forEach(b => {
  const p = docTrang(b.nguon), dem = {}, soBai = b.ma.slice(1);
  const cau = p.EXORDER.map(([set, i, tag]) => {
    const q = p.QSETS[set][i]; if (!q) throw new Error(b.ma + ': thiếu câu ' + set + '[' + i + ']');
    dem[q.t] = (dem[q.t] || 0) + 1;
    const c = { id: b.ma + '-' + KH[q.t] + dem[q.t], dang: DG[q.t], muc: '', nguon: tag, de: toT(q.q), hinh: [], dau: '', sinh: null };
    if (q.img) { if (!p.IMG[q.img]) throw new Error(b.ma + ': thiếu ảnh ' + q.img); c.anh = b.ma + '/' + q.img; out.anh[c.anh] = p.IMG[q.img]; }
    if (q.t === 'mc') c.tn = { phuong_an: q.o.map(toT), dap_an: 'ABCD'[q.a], giai_thich: toT(q.e) };
    if (q.t === 'ds') c.ds = { dan: c.de, y: q.y.map((y, k) => ({ nhan: 'abcd'[k], noi_dung: toT(y[0]), dung: !!y[1], giai_thich: toT(y[2] || '') })) };
    if (q.t === 'tln') c.tln = { dap_so: q.a, don_vi: toT(q.u || ''), dung_sai: q.tol || 0.01, cach_giai: toT(q.e) };
    if (q.t === 'tl') c.tl = { loi_giai_mau: toT(q.sol) };
    return c;
  });
  /* hình SGK dùng trong bài giảng: <img class="sgk" data-img="s13_2" alt="Hình 13.2"> ... <div class="src">SGK tr. 57 ...</div> */
  const seen = {};
  [...p.html.matchAll(/<img class="sgk" data-img="(s\d+_(\w+))" alt="([^"]*)"[^>]*>(?:\s*<div class="src">([^<]*)<\/div>)?/g)].forEach(m => {
    const k = 'H' + soBai + '-' + m[2]; if (seen[k] || !p.IMG[m[1]]) return; seen[k] = 1;
    const tr = /tr\.\s*(\d+)/.exec(m[4] || ''); out.sgk[k] = { cap: m[3], tr: tr ? +tr[1] : '', src: p.IMG[m[1]] };
  });
  if (b.moDau) out.moDau[b.ma] = b.moDau;
  out.bai.push({ ma: b.ma, ten: b.ten, trang_sgk: b.trang_sgk, kien_thuc: b.kien_thuc || [], cong_thuc: b.cong_thuc || [], dang_bai: b.dang_bai || [],
    loi_hay_mac: b.loi_hay_mac || [], hinh: [], the: b.the || [], cau_hoi: cau });
  console.log(b.ma + ':', cau.length, 'câu (' + Object.keys(dem).map(k => KH[k] + ' ' + dem[k]).join(', ') + '),', Object.keys(seen).length, 'hình SGK');
  if (process.argv[3] === '--liet-ke') cau.forEach(c => console.log('  ' + c.id + (c.anh ? ' [ảnh]' : '') + ': ' + c.de.slice(0, 90)));
});
/* kiểm tra: ví dụ của dạng bài trỏ tới mã câu có thật */
const ids = new Set(out.bai.flatMap(b => b.cau_hoi.map(c => c.id)));
out.bai.forEach(b => b.dang_bai.forEach(d => { const m = String(d.vi_du || '').match(/B\d+-[A-Z]+\d+/); if (m && !ids.has(m[0])) { console.error('Dạng bài trỏ tới câu không có: ' + m[0]); process.exit(1); } }));
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
const f = path.join(root, 'data', 'k' + cfg.ma + '.js');
fs.writeFileSync(f, 'window.HSDH_DATA=window.HSDH_DATA||{};window.HSDH_DATA[' + JSON.stringify(cfg.ma) + ']=' + JSON.stringify(out) + ';\n');
console.log('Đã ghi', path.relative(path.join(__dirname, '..'), f), (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
