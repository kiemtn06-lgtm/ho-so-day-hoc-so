/* Kiểm tra cách trợ giảng giọng nói 🎤 (nguon/lib/tro_giang.js) hiểu câu nói, không cần trình duyệt.
   Chạy: node tools/kiem_tro_giang.js
   Mỗi dòng: [câu nói, kết quả mong đợi]. Kết quả: lệnh dạng "tiep", "den 5", "dapAn 2"...; "hỏi tiep" (hỏi lại cô); null (lời giảng, bỏ qua).
   Tra cứu (giai đoạn 4): "tra ct định luật 2 newton" (loại + chủ đề); bảng TRA kiểm tra robot tìm ra mục nào trong dữ liệu hồ sơ.
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
  ['Thời gian vật rơi', null], ['Lùi xe', null], ['Ai làm xong chưa', null], ['Các em mở sách giáo khoa', null], ['Trước tiên ta xét', null],
  // tra cứu trong hồ sơ (giai đoạn 4): "tra <loại> <chủ đề>"
  ['Công thức định luật 2 Newton', 'tra ct định luật 2 newton'], ['Trợ giảng ơi công thức định luật Bôi lơ', 'tra ct định luật bôi lơ'],
  ['Cho cô xem công thức bài 9', 'tra ct bài 9'], ['Công thức', 'tra ct'], ['Công thức cân bằng lực', 'tra ct cân bằng lực'],
  ['Nhắc lại kiến thức', 'tra kt'], ['Nhắc lại bài 14', 'tra kt bài 14'], ['Chúng ta nhắc lại định luật 1 Newton', 'tra kt định luật 1 newton'],
  ['Nội dung chính bài 8', 'tra kt bài 8'], ['Dạng bài đẳng áp', 'tra db đẳng áp'], ['Các dạng bài', 'tra db'],
  ['Lỗi hay mắc', 'tra loi'], ['Lỗi thường gặp định luật Charles', 'tra loi định luật charles'],
  ['Câu hỏi nhanh', 'tra hn'], ['Câu hỏi nhanh bài 11', 'tra hn bài 11'], ['Câu khác', 'tra hnk'], ['Câu hỏi khác nữa', 'tra hnk'],
  ['Phóng to', 'moLon'], ['Mở lớn', 'moLon'],
  // lời giảng có từ tra cứu: bỏ qua
  ['Công thức này là F bằng m a', null], ['Các em nhắc lại định luật 1 Newton', null], ['Kiến thức hôm nay rất quan trọng các em ạ', null],
  ['Lỗi sai của bạn là đổi đơn vị', null], ['Câu khác thì sao các em', null], ['Công thức tính gia tốc là a bằng F chia m', null]
];

/* TRA: [câu nói, trang đang mở ("10-B13", "12-chuong2"; "" là trang chưa có dữ liệu), mục đứng đầu mong đợi]
   Mục: mã bài + đầu tên/nội dung của mục ("B15 Định luật 2 Newton"), hoặc "✗" khi robot phải báo "hồ sơ chưa có".
   Dữ liệu: nguon/lib/tro_giang_du_lieu.js (node tools/tao_tra_cuu.js). */
const TRA = [
  ['Công thức định luật 2 Newton', '', 'B15 Định luật 2 Newton'], ['Công thức định luật hai niu tơn', '', 'B15 Định luật 2 Newton'],
  ['Công thức định luật Bôi lơ', '', 'B9 Định luật Boyle'], ['Công thức định luật Sác lơ', '', 'B10 Định luật Charles'],
  ['Công thức phương trình Cla pê rôn', '', 'B11 Phương trình Clapeyron'], ['Công thức đổi độ C sang ken vin', '', 'B10 Đổi nhiệt độ Celsius'],
  ['Công thức', '10-B15', 'B15 Định luật 2 Newton'], ['Công thức', '', '✗'], ['Công thức bài 9', '', 'B9 Định luật Boyle'],
  ['Công thức hợp lực hai lực vuông góc', '10-B13', 'B13 Độ lớn hợp lực'], ['Công thức cân bằng lực', '', 'B14 Định luật 1 Newton'],
  ['Công thức gia tốc', '10-B15', 'B15 Gia tốc từ quãng đường'], ['Công thức động năng trung bình phân tử', '', 'B12 Động năng tịnh tiến'],
  ['Công thức định luật Ôm', '', '✗'],
  ['Nhắc lại kiến thức', '10-B13', 'B13 Tổng hợp lực'], ['Nhắc lại bài 14', '', 'B14 Lực và chuyển động'], ['Nhắc lại định luật 1 Newton', '', 'B14 Định luật 1 Newton'],
  ['Kiến thức quán tính', '', 'B14 Quán tính'], ['Tóm tắt bài 12 lớp 12', '', 'B12 Mật độ phân tử'],
  ['Nhắc lại bài 13', '12-chuong2', 'B13 '], ['Nhắc lại bài 13', '10-B15', 'B13 Tổng hợp lực'],
  ['Dạng bài đẳng áp', '', 'B10 Tính thể tích hoặc nhiệt độ'], ['Dạng bài', '10-B14', 'B14 Nhận biết nội dung định luật 1'],
  ['Lỗi hay mắc', '10-B15', 'B15 Quên đổi khối lượng'], ['Lỗi hay mắc bài 10', '', 'B10 Dùng nhiệt độ Celsius'],
  ['Câu hỏi nhanh', '10-B13', 'B13'], ['Câu hỏi nhanh', '', '✗'], ['Câu hỏi nhanh bài 11', '', 'B11']
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
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'nguon', 'lib', 'tro_giang_du_lieu.js'), 'utf8'))(g);
const DL = g.TG_DL;
function ngCanh(t) {   // giống ngCanh trong tro_giang.js, theo tên trang
  const m = /^(\d+)-B(\d+)$/.exec(t), n = /^(\d+)-chuong(\d+)$/.exec(t); let c = null, b = null;
  if (m) DL.chuong.forEach(x => { if (x.lop === +m[1]) x.bai.forEach(y => { if (y.ma === 'B' + m[2]) { c = x; b = y; } }); });
  if (n) c = DL.chuong.find(x => x.ma === n[1] + '-' + n[2]) || null;
  return m || n ? { lop: +(m || n)[1], c, b } : {};
}
const tenMuc = x => x.b.ma + ' ' + String(x.kieu === 'ct' || x.kieu === 'db' ? x.m.t : x.kieu === 'the' ? x.m[0] : x.m.de || x.m);
for (const [c, trang, mong] of TRA) {
  const p = TG.phanTich(c), l = p && p.lenh;
  let kq;
  if (!l || l[0] !== 'tra') kq = 'không hiểu là tra cứu';
  else { const k = TG.tim(DL, l[1], l[2], ngCanh(trang)); kq = k.loi ? '✗' : tenMuc(k.muc[0]); }
  if (!(mong === '✗' ? kq === '✗' : kq.startsWith(mong))) { sai++; console.log('SAI tra “' + c + '” (' + (trang || 'trang chưa có dữ liệu') + ')  →  ' + kq.slice(0, 70) + '   (mong: ' + mong + ')'); }
}
const tong = CAU.length + TRA.length;
console.log(sai ? '\n' + sai + '/' + tong + ' câu sai' : 'Đúng cả ' + tong + ' câu (' + CAU.length + ' lệnh, ' + TRA.length + ' tra cứu)');
process.exit(sai ? 1 : 0);
