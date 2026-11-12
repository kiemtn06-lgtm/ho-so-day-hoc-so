/* Đưa một trang BÀI GIẢNG TƯƠNG TÁC RỜI (mỗi bài một file .html, sân khấu 1280x720, có sẵn go(), cur, slides)
   vào hồ sơ. File nguồn của giáo viên KHÔNG bị sửa; bản trong hồ sơ chỉ được thêm:
   (1) mở đúng slide theo địa chỉ  bai-giang/k10-B13.html#B13@5  (slide thứ 6, đếm từ 0),
   (2) báo vị trí slide cho hồ sơ (để lần sau dạy tiếp đúng chỗ của từng lớp),
   (3) các chỉnh sửa hiển thị ghi trong tools/va_bai_giang_roi.js (nếu có).
   Chạy: node tools/build_bai_giang_roi.js "<file nguồn .html>" "bai-giang/k10-B13.html" B13 */
const fs = require('fs'), path = require('path');
const [src, dst, ma] = process.argv.slice(2);
if (!src || !dst || !ma) { console.error('Thiếu tham số: <nguồn> <đích> <mã bài, ví dụ B13>'); process.exit(1); }
let h = fs.readFileSync(src, 'utf8');
if (!h.includes('</body>') || !/<head>/.test(h)) { console.error('File nguồn thiếu <head> hoặc </body>'); process.exit(1); }

let va = { css: '', js: '', sua: [] };
try { va = require('./va_bai_giang_roi.js')(ma); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }

/* sửa nguyên văn có kiểm soát: mỗi mục [tìm, thay] phải khớp đúng 1 lần, nếu không thì dừng */
(va.sua || []).forEach(([a, b]) => {
  const n = a instanceof RegExp ? (h.match(new RegExp(a.source, 'g')) || []).length : h.split(a).length - 1;
  if (n !== 1) { console.error(ma + ': vá không khớp (' + n + ' lần): ' + String(a).slice(0, 90)); process.exit(1); }
  h = h.replace(a, () => b);
});

h = h.replace(/<head>/, '<head><script>window.__hsdhHash=location.hash;</script>');
if (va.css) h = h.replace('</head>', '<style id="hsdh-va">' + va.css + '</style></head>');
const JS = `<script>(function(){
  var MA=${JSON.stringify(ma)};
  try{var m=/^#B[0-9]+@([0-9]+)$/.exec(window.__hsdhHash||"");if(m)go(+m[1])}catch(e){}
  setInterval(function(){try{if(parent!==window)parent.postMessage({hsdh:'pos',ma:MA,i:cur,n:slides.length},'*')}catch(e){}},1000);
})();</script>`;
h = h.replace('</body>', JS + (va.js ? '<script>' + va.js + '</script>' : '') + '</body>');
const out = path.join(__dirname, '..', dst);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, h);
console.log('Đã tạo', dst, (h.length / 1048576).toFixed(2) + ' MB', '· vá:', (va.sua || []).length);
