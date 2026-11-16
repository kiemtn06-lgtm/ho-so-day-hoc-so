/* Sửa đáp án trong trang Ôn tập / Bài giảng K12 Chương II (dữ liệu "Mở rộng ôn tập" nhúng trong trang, nguồn .docx của giáo viên).
   Dùng chung cho tools/build_on_tap.js và tools/build_bai_giang.js (tự áp khi dựng lại), hoặc chạy riêng trên trang đã dựng:
     node tools/sua_dap_an_on_tap.js on-tap/k12-chuong2.html bai-giang/k12-chuong2.html
   Mỗi mục: [ghi chú, đoạn cũ, đoạn mới]. Đoạn nằm trong khối JSON nên dấu " được viết là \". */
const SUA = [
  ['SBT Vật lí 12 KNTT câu 1.3 (Mở rộng Bài 8, câu 6: hai chất khí trộn lẫn): đáp án (1), (2) và (3) = D, không phải B',
    '<div class=\\"mo ok\\"><b>B.</b><span>(2) và (3).</span></div><div class=\\"mo\\"><b>C.</b><span>(3) và (1).</span></div><div class=\\"mo\\"><b>D.</b><span>cả (1), (2) và (3).</span>',
    '<div class=\\"mo\\"><b>B.</b><span>(2) và (3).</span></div><div class=\\"mo\\"><b>C.</b><span>(3) và (1).</span></div><div class=\\"mo ok\\"><b>D.</b><span>cả (1), (2) và (3).</span>'],
];
function sua(h, ten) {
  for (const [gc, cu, moi] of SUA) {
    const n = h.split(cu).length - 1;
    if (n) { h = h.split(cu).join(moi); console.log('  sửa (' + n + ' chỗ):', gc, ten ? '· ' + ten : ''); }
    else if (!h.includes(moi)) console.log('  KHÔNG thấy đoạn cần sửa:', gc, ten ? '· ' + ten : '');
  }
  return h;
}
module.exports = sua;
if (require.main === module) {
  const fs = require('fs');
  for (const f of process.argv.slice(2)) { const h = fs.readFileSync(f, 'utf8'), h2 = sua(h, f); if (h2 !== h) fs.writeFileSync(f, h2); }
}
