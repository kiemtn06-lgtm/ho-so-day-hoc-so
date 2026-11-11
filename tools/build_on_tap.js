/* Đưa trang Ôn tập gốc của giáo viên vào hồ sơ để nhúng tại chỗ (không sửa nội dung, vẫn giữ khóa mã lớp).
   Chỉ thêm: mở đúng tab theo địa chỉ, ví dụ  on-tap/k12-chuong2.html#n1  hoặc  #mr-9  (Mở rộng ôn tập Bài 9).
   Chạy: node tools/build_on_tap.js "<file nguồn .html>" "on-tap/k12-chuong2.html" */
const fs = require('fs'), path = require('path');
const [src, dst] = process.argv.slice(2);
if (!src || !dst) { console.error('Thiếu tham số: <nguồn> <đích>'); process.exit(1); }
let h = fs.readFileSync(src, 'utf8');
const JS = `<script>(function(){
  function go(){
    var m=/^#(tq|bg|n[1-5]|mr)(?:-([0-9]+))?$/.exec(location.hash); if(!m)return;
    var t=document.querySelector('[data-tab='+m[1]+']'); if(t)t.click();
    if(m[2])setTimeout(function(){var p=document.querySelector('[data-a=mrb][data-b="'+m[2]+'"]');if(p)p.click()},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(go,0)});else setTimeout(go,0);
  window.addEventListener('hashchange',go);
})();</script>`;
if (!h.includes('</body>')) { console.error('File nguồn không có </body>'); process.exit(1); }
h = h.replace('</body>', JS + '</body>');
const out = path.join(__dirname, '..', dst);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, h);
console.log('Đã tạo', dst, (h.length / 1048576).toFixed(1) + ' MB');
