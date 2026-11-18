/* Gắn nút "✎ Sửa" (nguon/lib/nut_sua.js) vào các trang bài giảng, ôn tập đã dựng.
   Chạy: node tools/gan_nut_sua.js            (mọi trang .html trong bai-giang/ và on-tap/)
         node tools/gan_nut_sua.js <tệp.html>  (chỉ các tệp nêu)
   Chạy lại không sao: trang đã có nút thì bỏ qua. Các công cụ dựng trang (build_*.js) tự gọi sau khi ghi;
   công cụ Python (tools/k11_bai_giang/dung.py, tools/k10_chuong2_mo_rong/dung.py ...) thì chạy lệnh này sau khi dựng. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DAU = '<!--nut-sua-->', DAU2 = '<!--am-thanh-->';

function gan(f) {
  let h = fs.readFileSync(f, 'utf8'), doi = false;
  for (const [dau, tep] of [[DAU, 'nut_sua.js'], [DAU2, 'am_thanh.js']]) {   // nút ✎ Sửa và âm thanh thao tác
    if (h.includes(dau)) continue;
    const rel = path.relative(path.dirname(f), path.join(ROOT, 'nguon', 'lib', tep)).split(path.sep).join('/');
    const the = dau + '<script src="' + rel + '" defer></script>\n';
    const i = h.lastIndexOf('</body>');
    h = i < 0 ? h + '\n' + the : h.slice(0, i) + the + h.slice(i); doi = true;
  }
  if (doi) fs.writeFileSync(f, h);
  return doi;
}
module.exports = { tep: gan };

if (require.main === module) {
  let ds = process.argv.slice(2);
  if (!ds.length) for (const d of ['bai-giang', 'on-tap']) {
    const thu = path.join(ROOT, d);
    if (fs.existsSync(thu)) for (const t of fs.readdirSync(thu)) if (t.endsWith('.html')) ds.push(path.join(thu, t));
  }
  for (const f of ds) console.log((gan(path.resolve(f)) ? 'đã gắn  ' : 'đã có   ') + path.relative(ROOT, path.resolve(f)));
}
