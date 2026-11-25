/* Kiểm tra cách trợ giảng giọng nói 🎤 (nguon/lib/tro_giang.js) hiểu câu nói, không cần trình duyệt.
   Chạy: node tools/kiem_tro_giang.js
   Mỗi dòng: [câu nói, kết quả mong đợi]. Kết quả: lệnh dạng "tiep", "den 5", "dapAn 2"...; "hỏi tiep" (hỏi lại cô); null (lời giảng, bỏ qua).
   Tra cứu (giai đoạn 4): "tra ct định luật 2 newton" (loại + chủ đề); bảng TRA kiểm tra robot tìm ra mục nào trong dữ liệu hồ sơ.
   Thêm câu vào đây mỗi khi cô báo robot hiểu sai, để lần sửa sau không làm hỏng lại. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'nguon', 'lib', 'tro_giang.js'), 'utf8');

/* ĐỒNG HỒ GIẢ: thời gian chỉ chạy khi gọi chay(ms), để mô phỏng trình duyệt gửi chữ tạm theo từng lúc (phần NGHE ở cuối tệp) */
let bay = 1e6, soHen = 0, HEN = [];
const hen = (f, ms, lap) => { const id = ++soHen; HEN.push({ id, f, luc: bay + Math.max(0, +ms || 0), lap: lap ? Math.max(1, +ms || 0) : 0 }); return id; };
const huy = id => { HEN = HEN.filter(h => h.id !== id); };
function chay(ms) {   // cho thời gian trôi ms, làm các việc hẹn giờ đến hạn
  const het = bay + ms;
  for (;;) {
    HEN.sort((a, b) => a.luc - b.luc || a.id - b.id);
    const h = HEN[0];
    if (!h || h.luc > het) break;
    bay = h.luc;
    if (h.lap) h.luc += h.lap; else HEN.shift();
    h.f();
  }
  bay = het;
}
class NgayGia extends Date { constructor(...a) { super(...(a.length ? a : [bay])); } static now() { return bay; } }

const el = () => ({ setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, dispatchEvent() {},
  querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} }, style: { setProperty() {} }, children: [], offsetWidth: 0, offsetHeight: 0 });
const kho = { hsdh_sua: '1', tgDaXem: '1' }, PHIM = [];
const g = {
  localStorage: { getItem: k => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = String(v); } },
  document: { head: el(), body: Object.assign(el(), { dispatchEvent: e => { if (e.type === 'keydown') PHIM.push(e.key); } }),
    createElement: el, querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, addEventListener() {} },
  innerWidth: 1000, innerHeight: 800, addEventListener() {}, location: { protocol: 'https:', pathname: '/' }, navigator: {},
  KeyboardEvent: class { constructor(type, o) { this.type = type; this.key = o.key; } }
};
let SR_MOI = null;   // phiên nhận giọng giả mới nhất
g.SpeechRecognition = class {
  constructor() { SR_MOI = this; this.chay = false; }
  start() { if (this.chay) throw new Error('InvalidStateError'); this.chay = true; this.soLanBat = (this.soLanBat || 0) + 1; hen(() => this.onstart && this.onstart(), 0); }
  stop() { if (!this.chay) return; this.chay = false; hen(() => this.onend && this.onend(), 0); }
  abort() { this.stop(); }
};
g.window = g;
new Function('window', 'localStorage', 'document', 'location', 'navigator', 'KeyboardEvent', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', src)(
  g, g.localStorage, g.document, g.location, g.navigator, g.KeyboardEvent, (f, ms) => hen(f, ms), huy, (f, ms) => hen(f, ms, true), huy, NgayGia);
const TG = g.TroGiang;

const CAU = [
  // lệnh, nói kiểu nào cũng được
  ['Chuyển', 'tiep'], ['Tiếp', 'tiep'], ['Tiếp theo', 'tiep'], ['Chúng ta qua slide tiếp theo', 'tiep'], ['Chúng ta tiếp tục', 'tiep tt'],
  ['Bây giờ chúng ta sang phần tiếp theo nhé', 'tiep'], ['Slide sau', 'tiep'], ['Next', 'tiep'], ['Trợ giảng ơi chuyển slide', 'tiep'],
  ['Qua phần tiếp theo', 'tiep'], ['Nội dung tiếp theo', 'tiep'], ['Chúng ta qua phần tiếp theo của bài', 'tiep'], ['Ta chuyển qua nội dung tiếp theo', 'tiep'],
  ['Nội dung kế tiếp', 'tiep'], ['Qua', 'tiep'], ['Quà', 'tiep'], ['Quá', 'tiep'], ['Qua đi', 'tiep'], ['Niu ơi qua', 'tiep'], ['Niu ơi slide 5', 'den 5'],
  ['Niu ơi công thức định luật 2 Newton', 'tra ct định luật 2 newton'], ['Niu sửa đáp án câu 3 là B', 'sua đáp án câu 3 là B'], ['Qua nội dung tiếp nhé các em', 'tiep'],
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
  // tiếng gọi “Niu ơi” (lớp ồn): lệnh ngay sau tiếng gọi, trước/sau có lời giảng, tiếng ồn vẫn làm
  ['Các em chú ý niu ơi chuyển slide', 'tiep'], ['Niu ơi chuyển slide trời ơi nóng quá', 'tiep'], ['Niu ơi đáp án câu 2 là gì', 'dapAn 2'],
  ['Xong phần này rồi robot ơi slide mười hai', 'den 12'], ['Niu ơi quay lại bài trước', 'lui'], ['Níu ơi tiếp theo', 'tiep'],
  ['Như vậy là xong robot ơi công thức định luật Bôi lơ', 'tra ct định luật bôi lơ'], ['Các em im lặng niu ơi sửa câu 3 đáp án B', 'sua câu 3 đáp án B'],
  ['Niu ơi', null], ['Niu ơi các em làm bài đi', null], ['Định luật Niu tơn', null], ['Câu chuyện của Niu tơn', null],
  // tiếng ngập ngừng, chữ hay nghe sai
  ['Ờ chuyển slide', 'tiep'], ['Ừm tiếp theo', 'tiep'], ['Đáp ăn', 'dapAn'], ['Hiện đáp an câu 2', 'dapAn 2'], ['Mô phòng', 'moPhong'],
  ['Sờ lái tiếp theo', 'tiep'], ['Típ theo', 'tiep'], ['Đặc lại', 'mp datLai'], ['Chuyền sang slide sau', 'tiep'],
  ['Tiết sau các em kiểm tra', null], ['Các em ấy làm đúng rồi', null], ['Ờ chuyển động thẳng', null],
  // gần giống lệnh: robot hỏi lại
  ['Quay lại bài trước', 'hỏi lui'], ['Chuyển cái khác', 'hỏi tiep'], ['Mở mô phỏng chuyển động', 'hỏi moPhong'], ['Hiện đáp án đúng giúp cô', 'dapAn'],
  // lời giảng: bỏ qua
  ['Chuyển động thẳng đều', null], ['Chuyển động', null], ['Đúng rồi', null], ['Động năng của vật', null], ['Tất cả các em chú ý', null],
  ['Đồng hồ bấm giây', null], ['Đáp án của câu này là B', null], ['Sau đó ta xét lực ma sát', null], ['Tiếp theo là gia tốc', null],
  ['Ta về nhà làm bài', null], ['Sang phần hai', null], ['Nhanh quá', null], ['Hay quá các em', null], ['Qua thí nghiệm này ta thấy', null], ['Quả bóng rơi', null], ['Phần tiếp theo là lực ma sát', null], ['Nội dung tiếp theo là gì', null], ['Năm', null], ['Ba', null], ['Kết quả là 5 mét', null], ['Dao động tắt dần', null],
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

/* NGHE: mô phỏng trình duyệt gửi chữ tạm và chốt câu theo thời gian (đồng hồ giả, micro lọc ồn giả).
   Mỗi tình huống: [tên, hàm(sr) trả về true nếu robot làm đúng]. PHIM: các phím robot đã bấm (ArrowRight = chuyển slide), "go12" = đến slide 12. */
globalThis.slides = { length: 20 }; globalThis.cur = 0; g.go = n => PHIM.push('go' + (n + 1));
function tam(sr, chu) { const r = [{ transcript: chu }]; r.isFinal = false; sr.onresult({ resultIndex: 0, results: [r] }); }
function chot(sr, chu) { const r = [{ transcript: chu }]; r.isFinal = true; sr.onresult({ resultIndex: 0, results: [r] }); }
function noi(sr, chu) {   // [[ms chờ, chữ], …]: chữ hiện dần trong chữ tạm như khi cô đang nói
  let s = '';
  for (const [ms, w] of chu) { chay(ms); s = (s + ' ' + w).trim(); tam(sr, s); }
  return s;
}
const xong = () => PHIM.join(' ');
const NGHE = [
  ['“Chuyển” nói riêng: làm sau 350 ms, chốt câu không làm lại', sr => { tam(sr, 'Chuyển'); chay(400); const a = xong(); chot(sr, 'Chuyển'); chay(500); return a === 'ArrowRight' && xong() === 'ArrowRight'; }],
  ['Lớp ồn: lời giảng, ngừng 1 giây, “chuyển slide”, trình duyệt mãi không chốt câu', sr => {
    noi(sr, [[0, 'như'], [200, 'vậy'], [200, 'là'], [200, 'xong'], [200, 'phần'], [200, 'một'], [1100, 'chuyển'], [200, 'slide']]); chay(700); return xong() === 'ArrowRight'; }],
  ['Trình duyệt sửa chữ phía trước (một → 1): lệnh ở đoạn sau vẫn làm, chỉ một lần', sr => {
    noi(sr, [[0, 'xong'], [200, 'phần'], [200, 'một'], [1000, 'chuyển'], [200, 'slide']]); chay(250); tam(sr, 'xong phần 1 chuyển slide'); chay(500);
    chot(sr, 'Xong phần 1 chuyển slide'); chay(300); return xong() === 'ArrowRight'; }],
  ['Ngập ngừng giữa câu giảng “… định luật một … tiếp theo … là định luật hai”: không chuyển', sr => {
    const s = noi(sr, [[0, 'ta'], [200, 'đã'], [200, 'học'], [200, 'xong'], [200, 'định'], [200, 'luật'], [200, 'một'], [1000, 'tiếp'], [200, 'theo'], [900, 'là'], [200, 'định'], [200, 'luật'], [200, 'hai']]);
    chay(800); chot(sr, s); chay(300); return xong() === ''; }],
  ['“Niu ơi chuyển slide” giữa tiếng ồn, không ngừng, chữ ồn cứ hiện thêm', sr => {
    const s = noi(sr, [[0, 'các'], [150, 'em'], [150, 'trật'], [150, 'tự'], [150, 'niu'], [150, 'ơi'], [150, 'chuyển'], [150, 'slide'], [150, 'ồn'], [150, 'quá'], [150, 'trời'], [150, 'ơi'], [150, 'nóng']]);
    const a = xong(); chay(400); chot(sr, s); chay(300); return a === 'ArrowRight' && xong() === 'ArrowRight'; }],
  ['“Slide mười … hai”: chờ đủ số rồi mới đến slide 12', sr => { noi(sr, [[0, 'slide'], [200, 'mười'], [500, 'hai']]); chay(800); return xong() === 'go12'; }],
  ['Chỉ có câu chốt (không có chữ tạm), lệnh sau tiếng gọi', sr => { chot(sr, 'Các em trật tự Niu ơi slide 5 nhé'); chay(300); return xong() === 'go5'; }],
  ['Câu chốt dài vì ồn: đoạn sau chỗ ngừng là lệnh thì làm', sr => {
    noi(sr, [[0, 'các'], [200, 'em'], [200, 'làm'], [200, 'bài'], [200, 'đi'], [1200, 'chuyển']]); chay(100);
    chot(sr, 'các em làm bài đi chuyển'); chay(300); return xong() === 'ArrowRight'; }],
  ['Mất mạng: không tắt micro, tự nghe lại sau 1 giây', sr => {
    sr.onerror({ error: 'network' }); sr.chay = false; sr.onend(); chay(500); const a = sr.chay; chay(700); return a === false && sr.chay === true; }],
  ['Trình duyệt đứng im quá 25 giây: mở phiên nghe mới', sr => { chay(31000); return SR_MOI !== sr && SR_MOI.chay === true; }],
  ['Micro lọc ồn: nhận giọng từ luồng micro đã lọc', sr => sr.ray === RAY && RAY.readyState === 'live'],
  ['Micro lọc ồn lỗi: chuyển sang micro thường', sr => {
    sr.onerror({ error: 'audio-capture' }); sr.chay = false; sr.onend(); chay(50); return sr.chay === true && sr.ray === undefined && RAY.readyState === 'ended'; }],
  ['Trình duyệt không nhận luồng lọc ồn (start(track) báo lỗi): về micro thường, không thử mãi', sr => {
    const a = sr.ray === RAY, goc1 = sr.start; sr.chay = false; sr.start = function (tr) { if (tr) throw new TypeError('không nhận track'); goc1.call(this, tr); };
    sr.onend(); chay(1500); sr.start = goc1; return a && sr.chay === true && sr.ray === undefined; }]
];
let RAY = null;
g.navigator.mediaDevices = { getUserMedia: () => { RAY = { readyState: 'live', stop() { this.readyState = 'ended'; } }; return Promise.resolve({ getAudioTracks: () => [RAY], getTracks: () => [RAY] }); } };

(async () => {
  // tải lại trợ giảng với micro lọc ồn giả (Chrome mới có processLocally): bản đã tải ở trên dùng micro thường
  g.SpeechRecognition.prototype.processLocally = false;
  const goc0 = g.SpeechRecognition.prototype.start;
  g.SpeechRecognition.prototype.start = function (tr) { goc0.call(this); this.ray = tr; };
  g.TG_DL = DL;
  const cho = () => new Promise(r => setImmediate(r));
  for (const [ten, f] of NGHE) {   // mỗi tình huống một bản trợ giảng mới (tình huống lỗi micro chuyển hẳn sang micro thường)
    delete g.TroGiang;
    new Function('window', 'localStorage', 'document', 'location', 'navigator', 'KeyboardEvent', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', src)(
      g, g.localStorage, g.document, g.location, g.navigator, g.KeyboardEvent, (f, ms) => hen(f, ms), huy, (f, ms) => hen(f, ms, true), huy, NgayGia);
    const T2 = g.TroGiang;
    T2.bat(); await cho(); chay(20); PHIM.length = 0;
    let ok;
    try { ok = f(SR_MOI); } catch (e) { ok = false; console.log('  lỗi: ' + e.stack); }
    if (!ok) { sai++; console.log('SAI nghe “' + ten + '”  →  phím: ' + JSON.stringify(xong())); }
    T2.tat(); chay(50);
  }
  const tong = CAU.length + TRA.length + NGHE.length;
  console.log(sai ? '\n' + sai + '/' + tong + ' câu sai' : 'Đúng cả ' + tong + ' câu (' + CAU.length + ' lệnh, ' + TRA.length + ' tra cứu, ' + NGHE.length + ' tình huống nghe)');
  process.exit(sai ? 1 : 0);
})();
