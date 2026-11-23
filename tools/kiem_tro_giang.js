/* Kiểm tra cách trợ giảng giọng nói 🎤 (nguon/lib/tro_giang.js) hiểu câu nói, không cần trình duyệt.
   Chạy: node tools/kiem_tro_giang.js
   Mỗi dòng: [câu nói, kết quả mong đợi]. Kết quả: lệnh dạng "tiep", "den 5", "dapAn 2"...; "hỏi tiep" (hỏi lại cô); null (lời giảng, bỏ qua).
   Thêm câu vào đây mỗi khi cô báo robot hiểu sai, để lần sửa sau không làm hỏng lại. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'nguon', 'lib', 'tro_giang.js'), 'utf8');

const el = () => ({ setAttribute() {}, addEventListener() {}, appendChild() {}, classList: { add() {}, remove() {}, contains() { return false; } }, style: {} });
const kho = { hsdh_sua: '1' };
const g = {
  localStorage: { getItem: k => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = String(v); } },
  document: { head: el(), body: el(), createElement: el, querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, addEventListener() {} },
  innerWidth: 1000, innerHeight: 800, addEventListener() {}, location: { protocol: 'https:' }
};
g.window = g;
new Function('window', 'localStorage', 'document', 'location', src)(g, g.localStorage, g.document, g.location);
const TG = g.TroGiang;

const CAU = [
  // lệnh, nói kiểu nào cũng được
  ['Chuyển', 'tiep'], ['Tiếp', 'tiep'], ['Tiếp theo', 'tiep'], ['Chúng ta qua slide tiếp theo', 'tiep'], ['Chúng ta tiếp tục', 'tiep tt'],
  ['Bây giờ chúng ta sang phần tiếp theo nhé', 'tiep'], ['Slide sau', 'tiep'], ['Next', 'tiep'], ['Trợ giảng ơi chuyển slide', 'tiep'],
  ['Lùi', 'lui'], ['Quay lại', 'lui'], ['Quay lại slide trước', 'lui'], ['Chuyển lại', 'lui'], ['Slide vừa rồi', 'lui'],
  ['Slide 5', 'den 5'], ['Chuyển đến slide mười hai', 'den 12'], ['Slide hai mươi mốt', 'den 21'], ['Slide sáu', 'den 6'], ['Qua slide số 7', 'den 7'],
  ['Về đầu', 'den 1'], ['Về slide đầu tiên', 'den 1'], ['Slide cuối', 'den cuoi'], ['Chuyển đến slide cuối cùng', 'den cuoi'],
  ['Đáp án', 'dapAn'], ['Hiện đáp án', 'dapAn'], ['Cho cả lớp xem lời giải', 'dapAn'], ['Đáp án câu 2', 'dapAn 2'], ['Xem đáp án câu ba', 'dapAn 3'],
  ['Ẩn đáp án', 'anDapAn'], ['Tắt lời giải đi', 'anDapAn'],
  ['Mô phỏng', 'moPhong'], ['Mở mô phỏng', 'moPhong'], ['Các em xem mô phỏng', 'moPhong'], ['Thí nghiệm ảo', 'moPhong'],
  ['Chạy', 'mp chay'], ['Chạy mô phỏng', 'mp chay'], ['Dừng lại', 'mp dung'], ['Tạm dừng', 'mp dung'], ['Đặt lại', 'mp datLai'], ['Làm lại', 'mp datLai'],
  ['Gọi tên', 'goiTen'], ['Gọi một bạn', 'goiTen'], ['Gọi em nào lên bảng', 'goiTen'], ['Gọi bạn khác', 'goiTen'],
  ['Chia 4 nhóm', 'nhom 4'], ['Chia lớp thành 6 nhóm', 'nhom 6'],
  ['Đếm ngược 3 phút', 'gio 180'], ['Hẹn giờ 30 giây', 'gio 30'], ['Bấm giờ một phút rưỡi', 'gio 90'], ['Đếm ngược 1 phút 30 giây', 'gio 90'],
  ['Dừng giờ', 'gio dung'], ['Tắt đồng hồ', 'gio tat'], ['Đồng hồ chạy tiếp', 'gio chay'],
  ['Đóng', 'dong'], ['Tắt', 'dong'], ['Kết thúc', 'dong'], ['Đóng mô phỏng', 'dong'], ['Thoát ra', 'dong'], ['Đóng bảng lệnh', 'dong'],
  ['Tắt micro', 'tatMic'], ['Ngừng nghe', 'tatMic'],
  ['Trợ giúp', 'giup'], ['Hướng dẫn', 'giup'],
  ['Sửa đáp án câu 3 là B', 'sua đáp án câu 3 là B'],
  // gần giống lệnh: robot hỏi lại
  ['Quay lại bài trước', 'hỏi lui'], ['Chuyển cái khác', 'hỏi tiep'], ['Mở mô phỏng chuyển động', 'hỏi moPhong'], ['Hiện đáp án đúng giúp cô', 'dapAn'],
  // lời giảng: bỏ qua
  ['Chuyển động thẳng đều', null], ['Chuyển động', null], ['Đúng rồi', null], ['Động năng của vật', null], ['Tất cả các em chú ý', null],
  ['Đồng hồ bấm giây', null], ['Đáp án của câu này là B', null], ['Sau đó ta xét lực ma sát', null], ['Tiếp theo là gia tốc', null],
  ['Ta về nhà làm bài', null], ['Sang phần hai', null], ['Năm', null], ['Ba', null], ['Kết quả là 5 mét', null], ['Dao động tắt dần', null],
  ['Các em sửa bài', null], ['Vật đi qua vị trí cân bằng', null], ['Lực tác dụng lên vật', null], ['Vận tốc ban đầu bằng không', null],
  ['Dòng điện chạy qua dây dẫn', null], ['Tiếp tuyến của quỹ đạo', null], ['Mắc nối tiếp hai điện trở', null], ['Đóng khóa K', null],
  ['Thời gian vật rơi', null], ['Lùi xe', null], ['Ai làm xong chưa', null], ['Các em mở sách giáo khoa', null], ['Trước tiên ta xét', null]
];

function ra(cau) {
  const p = TG.phanTich(cau);
  if (!p) return null;
  const f = l => l.filter(x => x !== undefined && x !== '').join(' ');
  if (p.lenh) return f(p.lenh);
  if (p.hoi) return 'hỏi ' + f(p.hoi);
  return null;   // có ý lệnh nhưng không rõ: chỉ ghi nhật kí, không làm
}
let sai = 0;
for (const [c, mong] of CAU) {
  const kq = ra(c);
  if (kq !== mong) { sai++; console.log('SAI  “' + c + '”  →  ' + JSON.stringify(kq) + '   (mong: ' + JSON.stringify(mong) + ')'); }
}
console.log(sai ? '\n' + sai + '/' + CAU.length + ' câu sai' : 'Đúng cả ' + CAU.length + ' câu');
process.exit(sai ? 1 : 0);
