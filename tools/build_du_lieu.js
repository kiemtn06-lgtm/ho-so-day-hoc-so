/* Lấy dữ liệu bài học (kiến thức, công thức, dạng bài, câu hỏi) và bộ hiển thị công thức KaTeX
   từ file ôn tập gốc của giáo viên, ghi vào nguon/data và nguon/lib.
   Chạy: node tools/build_du_lieu.js "<file nguồn .html>" <mã chương, ví dụ 12-2> "<tên chương>" */
const fs = require('fs'), path = require('path');
const [src, ma, ten] = process.argv.slice(2);
if (!src || !ma) { console.error('Thiếu tham số: <nguồn> <mã chương> [tên chương]'); process.exit(1); }
const root = path.join(__dirname, '..', 'nguon');
const t = fs.readFileSync(src, 'utf8');

const nd = JSON.parse(/<script type="application\/json" id="nd">([\s\S]*?)<\/script>/.exec(t)[1]);
let moDau = {};
const md = /var MO_DAU = (\{[\s\S]*?\});/.exec(t);
if (md) moDau = Function('return ' + md[1])();
const out = { ten: ten || nd.meta.pham_vi, sach: nd.meta.bo_sach, moDau, bai: nd.bai };
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'k' + ma + '.js'),
  'window.HSDH_DATA=window.HSDH_DATA||{};window.HSDH_DATA[' + JSON.stringify(ma) + ']=' + JSON.stringify(out) + ';\n');
console.log('Dữ liệu:', nd.bai.map(b => b.ma + ' (' + b.cau_hoi.length + ' câu)').join(', '));

/* KaTeX: mã và CSS (kèm phông) đã nhúng sẵn trong file nguồn */
const scripts = [...t.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const kx = scripts.find(s => s.includes('renderToString') && s.includes('katex') && s.length > 100000);
if (!kx) { console.error('Không tìm thấy KaTeX trong file nguồn'); process.exit(1); }
fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
fs.writeFileSync(path.join(root, 'lib', 'katex.js'), kx);
const css = [...t.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const keep = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => {
  const sel = m[1].trim();
  return (sel.startsWith('@font-face') && m[2].includes('KaTeX')) || sel.includes('.katex');
}).map(m => m[1].trim() + '{' + m[2] + '}');
fs.writeFileSync(path.join(root, 'lib', 'katex.css'), keep.join('\n'));
console.log('KaTeX:', (kx.length / 1024).toFixed(0) + ' KB mã,', keep.length, 'luật CSS');
