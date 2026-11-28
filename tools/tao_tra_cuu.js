/* Tạo dữ liệu tra cứu cho trợ giảng giọng nói 🎤 (giai đoạn 4): nguon/lib/tro_giang_du_lieu.js
   Lấy từ dữ liệu hồ sơ nguon/data/*.js: kiến thức, công thức, dạng bài, lỗi hay mắc, thẻ ôn, câu hỏi nhanh (trắc nghiệm, trả lời ngắn không có hình).
   Bỏ hết ảnh nên tệp nhẹ; robot chỉ tải tệp này khi cô hỏi lần đầu ("Công thức định luật 2 Newton", "Nhắc lại bài 9"...).
   Chạy: node tools/tao_tra_cuu.js   (dong_goi.js tự gọi, nên sửa nguon/data rồi đóng gói là đủ)
   TEN_CT: tên gọi của công thức để cô gọi bằng lời (dữ liệu hồ sơ chỉ có biểu thức). Công thức mới chưa có tên vẫn tra được theo tên bài, điều kiện. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), THU = path.join(ROOT, 'nguon', 'data'), RA = path.join(ROOT, 'nguon', 'lib', 'tro_giang_du_lieu.js');

const TEN_CT = {
  '\\vec{F} = \\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 + \\dots': 'Hợp lực (tổng hợp lực)',
  'F^2 = F_1^2 + F_2^2 + 2F_1F_2\\cos\\alpha': 'Độ lớn hợp lực của hai lực đồng quy hợp góc alpha (hai lực vuông góc: F² = F₁² + F₂²)',
  'F = 2F_1\\cos\\dfrac{\\alpha}{2}': 'Hợp lực của hai lực đồng quy bằng nhau',
  'F_x = F\\cos\\theta,\\quad F_y = F\\sin\\theta': 'Phân tích lực thành hai thành phần vuông góc',
  'P_x = P\\sin\\alpha,\\quad P_y = P\\cos\\alpha': 'Phân tích trọng lực trên mặt phẳng nghiêng',
  '\\vec{F}_{hl} = \\vec{0}\\ \\Rightarrow\\ \\vec{a} = \\vec{0}\\quad(\\vec{v}\\ \\text{không đổi})': 'Định luật 1 Newton (vật cân bằng: hợp lực bằng 0)',
  '\\vec{a} = \\dfrac{\\vec{F}}{m}\\ \\Leftrightarrow\\ \\vec{F} = m\\vec{a}': 'Định luật 2 Newton',
  '1\\ \\mathrm{N} = 1\\ \\mathrm{kg \\cdot m/s^2}': 'Đơn vị newton',
  'a = \\dfrac{2s}{t^2}': 'Gia tốc từ quãng đường và thời gian (bắt đầu từ nghỉ)',
  'F - F_{ms} = ma,\\quad F_{ms} = \\mu mg': 'Định luật 2 Newton có lực ma sát trên mặt ngang',
  '\\overline{v} = \\dfrac{v_1 + v_2 + \\dots + v_n}{n}': 'Tốc độ trung bình của các phân tử',
  'p_1V_1 = p_2V_2': 'Định luật Boyle (đẳng nhiệt)',
  'p = p_0 + \\rho g h': 'Áp suất ở độ sâu h trong chất lỏng',
  '\\dfrac{V_1}{T_1} = \\dfrac{V_2}{T_2}': 'Định luật Charles (đẳng áp)',
  'T = t + 273': 'Đổi nhiệt độ Celsius sang kelvin',
  '\\dfrac{p_1V_1}{T_1} = \\dfrac{p_2V_2}{T_2}': 'Phương trình trạng thái khí lí tưởng',
  'pV = nRT': 'Phương trình Clapeyron',
  '\\dfrac{p_1}{T_1} = \\dfrac{p_2}{T_2}': 'Quá trình đẳng tích',
  'p = \\dfrac{1}{3}\\mu m\\overline{v^2}': 'Áp suất khí theo mô hình động học phân tử',
  '\\overline{E_d} = \\dfrac{3}{2}kT': 'Động năng tịnh tiến trung bình của phân tử',
  'p = \\dfrac{2}{3}\\mu\\overline{E_d}': 'Áp suất khí theo động năng trung bình',
  '\\sqrt{\\overline{v^2}} = \\sqrt{\\dfrac{3kT}{m}}': 'Căn bậc hai của trung bình bình phương tốc độ'
};

function tao() {
  const win = {};
  for (const t of fs.readdirSync(THU).filter(t => t.endsWith('.js')).sort())
    new Function('window', fs.readFileSync(path.join(THU, t), 'utf8'))(win);
  const D = win.HSDH_DATA || {}, chuong = [], thieuTen = [];
  const mot = s => String(s == null ? '' : s).trim();
  for (const ma of Object.keys(D).sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b))) {
    const c = D[ma], bai = [];
    for (const b of c.bai || []) {
      const cau = {}; (b.cau_hoi || []).forEach(q => { cau[q.id] = q; });
      const coHinh = q => (q.hinh && q.hinh.length) || q.anh;
      const loiGiai = q => q.tn ? 'Đáp án ' + q.tn.dap_an + (q.tn.giai_thich ? '. ' + q.tn.giai_thich : '')
        : q.tln ? 'Đáp số: ' + q.tln.dap_so + (q.tln.don_vi ? ' ' + q.tln.don_vi : '') + (q.tln.cach_giai ? '. ' + q.tln.cach_giai : '')
        : q.tl ? mot(q.tl.loi_giai_mau)
        : q.ds ? q.ds.y.map(y => y.nhan + ') ' + (y.dung ? 'Đúng' : 'Sai') + (y.giai_thich ? ': ' + y.giai_thich : '')).join('; ') : '';
      const deCau = q => q.ds ? mot(q.ds.dan) + ' ' + q.ds.y.map(y => y.nhan + ') ' + y.noi_dung).join(' ') : mot(q.de);
      bai.push({
        ma: b.ma, ten: mot(b.ten),
        kt: (b.kien_thuc || []).map(x => mot(x.y)),
        ct: (b.cong_thuc || []).map(x => {
          if (!TEN_CT[x.latex]) thieuTen.push(ma + ' ' + b.ma + ': ' + x.latex);
          return { t: TEN_CT[x.latex] || '', l: x.latex, dk: mot(x.dieu_kien), vd: mot(x.vi_du_so) };
        }),
        db: (b.dang_bai || []).map(x => {
          const id = (String(x.vi_du || '').match(/B\d+-(?:W-)?(?:TLN|TN|TL|DS)\d+/g) || []).find(i => cau[i] && !coHinh(cau[i]));
          return { t: mot(x.dang), nb: mot(x.nhan_biet), cl: mot(x.cach_lam),
            vd: id ? { de: deCau(cau[id]), pa: cau[id].tn ? cau[id].tn.phuong_an : null, gi: loiGiai(cau[id]) } : /B\d+-(?:W-)?[A-Z]+\d+|^SGK|^Mục|^Hình/.test(x.vi_du || '') ? null : { de: mot(x.vi_du) } };
        }),
        loi: (b.loi_hay_mac || []).map(x => mot(x.y)),
        the: (b.the || []).map(x => [mot(x.mat_truoc), mot(x.mat_sau)]),
        hn: (b.cau_hoi || []).filter(q => (q.tn || q.tln) && !coHinh(q)).map(q => q.tn
          ? { de: mot(q.de), pa: q.tn.phuong_an, da: q.tn.dap_an, gt: mot(q.tn.giai_thich) }
          : { de: mot(q.de), ds: q.tln.dap_so + (q.tln.don_vi ? ' ' + q.tln.don_vi : ''), gt: mot(q.tln.cach_giai) })
      });
    }
    chuong.push({ ma, lop: +ma.split('-')[0], ten: mot(c.ten), bai });
  }
  const s = '/* Dữ liệu tra cứu của trợ giảng 🎤, TỰ TẠO bằng node tools/tao_tra_cuu.js từ nguon/data. Không sửa tay. */\n' +
    'window.TG_DL=' + JSON.stringify({ chuong }) + ';\n';
  fs.writeFileSync(RA, s);
  return { kb: (Buffer.byteLength(s) / 1024).toFixed(0), chuong: chuong.length, thieuTen };
}
module.exports = tao;

if (require.main === module) {
  const k = tao();
  console.log('Đã tạo nguon/lib/tro_giang_du_lieu.js', k.kb + ' KB,', k.chuong + ' chương');
  if (k.thieuTen.length) console.log('Công thức chưa có tên gọi (thêm vào TEN_CT nếu muốn gọi bằng tên):\n  ' + k.thieuTen.join('\n  '));
}
