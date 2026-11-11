/* Gộp nguon/index.html cùng mọi file CSS, JS nó dùng thành MỘT file: Ho-so-day-hoc-so.html
   Chạy: node tools/dong_goi.js   (sau mỗi lần sửa file trong thư mục nguon) */
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'nguon');
const rd = f => fs.readFileSync(path.join(src, f), 'utf8');
let h = rd('index.html');
h = h.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => '<style>\n' + rd(f) + '\n</style>');
h = h.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => '<script>\n' + rd(f).replace(/<\/script/gi, '<\/script') + '\n</script>');
const out = path.join(__dirname, '..', 'Ho-so-day-hoc-so.html');
fs.writeFileSync(out, h);
console.log('Đã tạo Ho-so-day-hoc-so.html', (h.length / 1024).toFixed(0) + ' KB');
