/* Đưa Sổ chủ nhiệm số (Apps Script, thư mục SoChuNhiem/trien_khai — CHỈ có trên máy, không đưa lên kho) vào hồ sơ.
   Chạy: node tools/dung_so_chu_nhiem.js   →  so-chu-nhiem/index.html, so-chu-nhiem/phieu.html
   - Chép đúng giao diện của sổ, chèn <script src="cau_noi.js"> ngay sau <head> đầu tiên (cau_noi.js thay google.script.run
     bằng fetch tới web app; Code.gs phải có doPost).
   - BỎ danh sách học sinh chép sẵn trong giao diện (NAMES, SODO_TO): chỉ dùng khi GVCN khởi tạo sổ trống lần đầu; sổ đã
     khởi tạo thì học sinh lấy từ Google Sheet. Kho là CÔNG KHAI: không được có tên học sinh. Công cụ dừng nếu còn sót tên.
   Sửa giao diện sổ: sửa ở SoChuNhiem/trien_khai (rồi dán lên Apps Script như cũ), sau đó chạy lại lệnh này. */
const fs = require('fs'), path = require('path');
const GOC = path.join(__dirname, '..', 'SoChuNhiem', 'trien_khai'), DICH = path.join(__dirname, '..', 'so-chu-nhiem');
const CHEN = '<script src="cau_noi.js"></script>';
const RE_DS = /const NAMES = (\[[^\]]*\]);/, RE_TO = /const SODO_TO = \{[^}]*\};/;

const goc = fs.readFileSync(path.join(GOC, 'index.html'), 'utf8');
const m = goc.match(RE_DS);
if (!m || !RE_TO.test(goc)) throw new Error('index.html: không thấy NAMES/SODO_TO để bỏ — kiểm tra lại trước khi đưa lên kho');
const TEN_HS = JSON.parse(m[1]);
/* tên đệm + tên (2 chữ cuối) cũng không được còn, ví dụ ở chú thích hay dữ liệu mẫu */
const DO_TIM = TEN_HS.concat(TEN_HS.map(n => n.split(' ').slice(-2).join(' ')).filter(t => t.split(' ').length === 2 && t.length > 6));

fs.mkdirSync(DICH, { recursive: true });
for (const ten of ['index.html', 'phieu.html']) {
  let s = ten === 'index.html' ? goc : fs.readFileSync(path.join(GOC, ten), 'utf8');
  if (/google\.script\.(host|url)/.test(s)) throw new Error(ten + ': dùng google.script.host/url, cau_noi.js chưa hỗ trợ');
  const i = s.indexOf('<head>'); if (i < 0) throw new Error(ten + ': không thấy <head>');
  s = s.slice(0, i + 6) + '\n' + CHEN + s.slice(i + 6);
  if (ten === 'index.html') {
    s = s.replace(RE_DS, () => 'const NAMES = [];   /* đã bỏ khi đưa vào hồ sơ (kho công khai): danh sách lớp nằm ở Google Sheet */')
         .replace(RE_TO, () => 'const SODO_TO = {};');
  }
  /* tên học sinh thật trong chữ ví dụ (ô mẫu dán danh sách, hướng dẫn "VD: A31 — …") → tên giả */
  const GIA = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E', 'Võ Thị G'];
  let k = 0;
  TEN_HS.filter(n => s.includes(n)).forEach(n => { s = s.split(n).join(GIA[k++ % GIA.length]); });
  const sot = DO_TIM.filter(n => s.includes(n));
  if (sot.length) throw new Error(ten + ': còn ' + sot.length + ' tên học sinh, không ghi tệp');
  if (/docs\.google\.com\/spreadsheets\/d\/[\w-]{20,}/.test(s)) throw new Error(ten + ': có địa chỉ Google Sheet, không đưa lên kho công khai');
  fs.writeFileSync(path.join(DICH, ten), s);
  console.log('Đã tạo so-chu-nhiem/' + ten, Math.round(s.length / 1024) + ' KB' + (ten === 'index.html' ? ', đã bỏ danh sách ' + TEN_HS.length + ' học sinh' : ''));
}
