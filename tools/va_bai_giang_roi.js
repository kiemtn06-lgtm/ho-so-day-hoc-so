/* CÁC CHỈNH SỬA HIỂN THỊ cho bài giảng tương tác rời khi đưa vào hồ sơ (file nguồn của giáo viên không bị sửa).
   Trả về {css, js, sua} cho từng mã bài. Mỗi mục trong `sua` là [chuỗi tìm, chuỗi thay] và phải khớp ĐÚNG 1 lần
   trong file nguồn (build sẽ dừng nếu không khớp, để biết ngay khi file nguồn đã đổi).
   Chỉ sửa cách hiển thị (vị trí nhãn, cỡ chữ, hình vẽ minh hoạ, lỗi giao diện). KHÔNG sửa nội dung câu hỏi, đáp án, lời giải. */

/* Dùng chung cho các bài có hàm vlab (nhãn vectơ trên hình vẽ): tự dời nhãn để không đè nhau và không ra ngoài hình. */
const JS_NHAN = `(function(){
  if(typeof vlab!=='function')return;
  var goc=window.vlab,cr=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(){this.canvas.__lb=[];return cr.apply(this,arguments)};
  window.vlab=function(c,lab,col,ax,ay,al){
    var m=/^([A-Za-z])((?:[₀-₃ₓᵧ]|_[a-z]+)?)([\\s\\S]*)$/.exec(lab),sym='',sub='',txt=lab;
    if(m){sym=m[1];sub=m[2]?(SUBM[m[2]]||m[2].slice(1)):'';txt=m[3]}
    c.font='italic bold 28px Segoe UI';var w1=sym?c.measureText(sym).width:0;
    c.font='bold 19px Segoe UI';var w2=sub?c.measureText(sub).width+1:0;
    c.font='bold 26px Segoe UI';var w3=txt?c.measureText(txt).width:0,W=w1+w2+w3;
    var sx=al==='r'?ax:al==='l'?ax-W:ax-W/2,cw=c.canvas.width,ch=c.canvas.height,L=c.canvas.__lb||(c.canvas.__lb=[]);
    var b0={x:sx-5,y:ay-36,w:W+10,h:46};
    function dat(dx,dy){var b={x:b0.x+dx,y:b0.y+dy,w:b0.w,h:b0.h};
      b.x=Math.max(2,Math.min(cw-b.w-2,b.x));b.y=Math.max(2,Math.min(ch-b.h-2,b.y));return b}
    function dung(b){return L.some(function(a){return Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>4&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>4})}
    var thu=[[0,0],[0,-50],[0,50],[b0.w+12,0],[-b0.w-12,0],[0,-100],[0,100],[b0.w+12,-50],[-b0.w-12,-50],[b0.w+12,50],[-b0.w-12,50]],b=dat(0,0),k;
    for(k=0;k<thu.length;k++){var t=dat(thu[k][0],thu[k][1]);if(!dung(t)){b=t;break}}
    L.push(b);c.__hsdhBox={lab:lab,x:b.x,y:b.y,w:b.w,h:b.h,cw:cw,ch:ch,doi:Math.abs(b.x-b0.x)>1||Math.abs(b.y-b0.y)>1};
    return goc(c,lab,col,ax+(b.x-b0.x),ay+(b.y-b0.y),al)};
})();`;

/* nút bình chọn có công thức: luật ".vote span" của trang làm vỡ chữ công thức bên trong nút */
const CSS_CHUNG = `.vote .katex span{min-width:0;margin-left:0;font-weight:inherit;text-align:inherit}
.vote button>span.katex{display:inline;min-width:0;margin-left:0;font-weight:inherit}
`;

const SVG_B13_VUONG = '<svg viewBox="0 0 360 215" width="100%" style="max-height:330px"><defs><marker id="mtB" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9z" fill="#1d4ed8"/></marker><marker id="mtC" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9z" fill="#f59e0b"/></marker></defs>' +
  '<rect x="125" y="22" width="120" height="160" fill="#eaf1ff" stroke="#1d4ed8" stroke-dasharray="6 5"/>' +
  '<path d="M125 167h15v15" fill="none" stroke="#14213d" stroke-width="1.5"/>' +
  '<line x1="125" y1="182" x2="243" y2="182" stroke="#1d4ed8" stroke-width="4" marker-end="url(#mtB)"/>' +
  '<line x1="125" y1="182" x2="125" y2="24" stroke="#1d4ed8" stroke-width="4" marker-end="url(#mtB)"/>' +
  '<line x1="125" y1="182" x2="243" y2="25" stroke="#f59e0b" stroke-width="5" marker-end="url(#mtC)"/>' +
  '<text x="185" y="208" font-size="21" text-anchor="middle">F₁ = 6 N</text>' +
  '<text x="115" y="108" font-size="21" text-anchor="end">F₂ = 8 N</text>' +
  '<text x="254" y="46" font-size="21" font-weight="700" fill="#b45309">F = 10 N</text>' +
  '<text x="146" y="160" font-size="17">90°</text></svg>';


/* Đáp án thảo luận / gợi ý: ẩn sẵn, giáo viên bấm "Hiện đáp án" sau khi học sinh đã thảo luận */
const JS_AN_DAP_AN = `(function(){
  var bo=/Nhấn|Giáo viên bấm|Nhập số|Số đo|CHÀO|CHƯƠNG|Slide gốc/;
  document.querySelectorAll('.hint').forEach(function(h){
    if(h.className.trim()!=='hint'||h.id||bo.test(h.textContent)||!h.closest('.panel,.step'))return;
    h.style.display='none';
    var b=document.createElement('button');b.type='button';b.className='btn ghost hsdh-dapan';b.textContent='👁 Hiện đáp án';
    b.onclick=function(e){e.stopPropagation();h.style.display=h.tagName==='DIV'?'block':'inline';b.remove()};
    b.onmousedown=b.onkeydown=function(e){e.stopPropagation()};
    h.parentNode.insertBefore(b,h);
  });
})();`;
const CSS_DAP_AN = `.hsdh-dapan{font-size:20px!important;padding:4px 14px!important;margin:6px 0 0 8px;display:inline-block;cursor:pointer}
`;


/* Bài 14: thêm 3 slide hình tham khảo (cắt từ bản trình chiếu K10/Bài 14, nén JPEG) */
function slideAnh(tag, ten, tep, alt) {
  const b = require('fs').readFileSync(require('path').join(__dirname, 'k10_anh_b14', tep)).toString('base64');
  return '<section class="slide" data-title="' + ten + '"><h2><span class="tag">' + tag + '</span> ' + ten + '</h2>' +
    '<div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0"><img alt="' + alt + '" src="data:image/jpeg;base64,' + b +
    '" style="max-height:100%;max-width:100%;border-radius:14px;box-shadow:0 6px 24px #0008"></div></section>\n\n';
}


/* Thay ảnh SGK (data-img) bằng ảnh cắt từ bản trình chiếu K10 (chỉ phần hình, bỏ chữ đáp án); chèn thêm ảnh vào chỗ trống */
function anhB64(t) { return 'data:image/jpeg;base64,' + require('fs').readFileSync(require('path').join(__dirname, 'k10_anh_b14', t + '.jpg')).toString('base64'); }
function thayAnh(key, tep, chuthich, maxh) {
  return [new RegExp('<img class="sgk" data-img="' + key + '"[^>]*>(<div class="src">[^<]*</div>)?'),
    '<img class="sgk" alt="' + chuthich + '" style="margin:auto;max-height:' + (maxh || 320) + 'px;width:auto;border-radius:10px" src="' + anhB64(tep) + '"><div class="src">' + chuthich + '</div>'];
}
function themTruoc(neo, tep, maxh, step) {
  return [neo, '<div class="' + (step ? 'step ' : '') + 'panel" style="text-align:center;padding:6px"><img alt="" style="max-height:' + (maxh || 260) + 'px;max-width:100%;width:auto;border-radius:10px" src="' + anhB64(tep) + '"></div>' + neo];
}

module.exports = function (ma) {
  const va = { css: CSS_CHUNG, js: '', sua: [] };
  if (ma === 'B13' || ma === 'B14' || ma === 'B15' || ma === 'B16' || ma === 'B17') { va.js = JS_NHAN + JS_AN_DAP_AN; va.css += CSS_DAP_AN; }
  if (ma === 'B14') va.js += require('./va_k10_b14_xe.js');
  if (ma === 'B13') va.sua = [
    thayAnh('s13_tau', 'b13-tau-keo', 'Hai tàu kéo một tàu chở hàng', 300),
    thayAnh('s13_1', 'b13-thuc-te-mo-hinh', 'Thực tế = mô hình vật lí: hai lực thay bằng một hợp lực', 230),
    thayAnh('s13_5', 'b13-sach-can-bang', 'Quyển sách nằm yên: N và P cân bằng', 200),
    /* Hoạt động 1: tách xa hai mũi tên F1, F2 để nhãn không đè nhau */
    ["arrow(x,cx+bw/2,cy-18,cx+bw/2+a*k,cy-18,", "arrow(x,cx+bw/2,cy-27,cx+bw/2+a*k,cy-27,"],
    ["arrow(x,cx+bw/2,cy+18,cx+bw/2+b*k,cy+18,", "arrow(x,cx+bw/2,cy+27,cx+bw/2+b*k,cy+27,"],
    ["arrow(x,cx-bw/2,cy+18,cx-bw/2-b*k,cy+18,", "arrow(x,cx-bw/2,cy+27,cx-bw/2-b*k,cy+27,"],
    /* Mặt phẳng nghiêng: mũi tên dài hơn, nhãn P đặt dưới ngọn, mặc định m = 5 kg để nhìn rõ */
    ["bx=70,by=H-70,L=600,k=1.5;", "bx=70,by=H-70,L=600,k=2.2;"],
    ["arrow(x,px,py,px,py+k*P,'#dc2626','P = '+P+' N',4,{a:'l'});", "arrow(x,px,py,px,py+k*P,'#dc2626','P = '+P+' N',4,{p:[px,Math.min(py+k*P+40,H-10),'c']});"],
    ['<b id="e2l">2</b> kg <input id="e2" type="range" min="1" max="10" value="2"', '<b id="e2l">5</b> kg <input id="e2" type="range" min="1" max="10" value="5"'],
    /* Công thức tổng quát nằm trên một dòng; hình minh hoạ vuông góc vẽ đúng tỉ lệ 6 : 8 và nhãn không đè nét */
    ['<div class="eq math big">F² = F₁² + F₂² + 2F₁F₂cosα</div>', '<div class="eq math big" style="font-size:32px;white-space:nowrap">F² = F₁² + F₂² + 2F₁F₂cosα</div>'],
    [/<svg viewBox="0 0 330 200" width="100%"><rect x="40" y="30"[\s\S]*?<\/svg>/, SVG_B13_VUONG],
    /* Củng cố 2, câu 3 (Đúng/Sai) ý a, b: thêm kí hiệu vectơ cho F_K, F_c (phiếu #3, 20/11/2026) */
    ["['Khi tủ lạnh chưa chuyển động thì F<sub>K</sub> và F<sub>c</sub> là hai lực cân bằng.',1]", "[`Khi tủ lạnh chưa chuyển động thì ${v('F')}<sub>K</sub> và ${v('F')}<sub>c</sub> là hai lực cân bằng.`,1]"],
    ["['Khi tủ lạnh bắt đầu chuyển động nhanh dần thì F<sub>K</sub> và F<sub>c</sub> là hai lực không cân bằng.',1]", "[`Khi tủ lạnh bắt đầu chuyển động nhanh dần thì ${v('F')}<sub>K</sub> và ${v('F')}<sub>c</sub> là hai lực không cân bằng.`,1]"]
  ];
  if (ma === 'B14') va.sua = [
    thayAnh('s14_3', 'b14-xe-va-vat', 'Xe lăn xuống dốc va vào tường – vật nhỏ trên xe', 190),
    themTruoc('<div class="step panel" style="background:#e0f2fe"><b>Hãy nghĩ quán tính', 'b14-khoi-luong-quan-tinh', 250, true),
    /* thêm slide lời giải Voyager (sau Củng cố 1); thay ảnh minh hoạ ở slide Ứng dụng quán tính và An toàn giao thông bằng hình trong bản trình chiếu K10/Bài 14 */
    ['<section class="slide" data-title="Quán tính là gì">', slideAnh('Lời giải', 'Lời giải cho bí ẩn Voyager', 'loi-giai-voyager.jpg', 'Lời giải cho bí ẩn Voyager') + '<section class="slide" data-title="Quán tính là gì">'],
    ['<img class="sgk" data-img="s14_4" alt="Hình 14.4" style="max-height:200px;width:auto;margin:auto"><div class="src">SGK tr. 62 – Hình 14.4</div>',
     '<img class="sgk" alt="Mẹo tra đầu búa" style="max-height:210px;width:auto;margin:auto;border-radius:10px" src="'+'data:image/jpeg;base64,'+require('fs').readFileSync(require('path').join(__dirname,'k10_anh_b14','bua.jpg')).toString('base64')+'"><div class="src">Mẹo tra đầu búa (SGK tr. 62 – Hình 14.4)</div>'],
    ['<img class="sgk" data-img="s14_5" alt="Hình 14.5" style="max-height:200px;width:auto;margin:auto"><div class="src">SGK tr. 62 – Hình 14.5</div>',
     '<img class="sgk" alt="Giật giấy dưới cốc nước" style="max-height:210px;width:auto;margin:auto;border-radius:10px" src="'+'data:image/jpeg;base64,'+require('fs').readFileSync(require('path').join(__dirname,'k10_anh_b14','giay.jpg')).toString('base64')+'"><div class="src">Giật giấy dưới cốc nước (SGK tr. 62 – Hình 14.5)</div>'],
    ['<div class="step panel" style="font-size:24px;background:#fee2e2;color:#7f1d1d"><b>Chạy nước rút 100 m:</b> vì sao vận động viên không dừng ngay ở vạch đích? → cơ thể có <b>quán tính</b>; hãm đột ngột có thể gây chấn thương.</div>',
     '<div class="step panel" style="font-size:22px;background:#fee2e2;color:#7f1d1d;display:flex;gap:14px;align-items:center"><img alt="Vận động viên về đích" style="height:150px;width:auto;border-radius:10px;flex:none" src="'+'data:image/jpeg;base64,'+require('fs').readFileSync(require('path').join(__dirname,'k10_anh_b14','van-dong-vien.jpg')).toString('base64')+'"><div><b>Chạy nước rút 100 m:</b> vì sao vận động viên không dừng ngay ở vạch đích mà phải chạy chậm dần thêm một đoạn?<div class="hint" style="color:#7f1d1d;font-size:20px;margin-top:6px"><b>1.</b> Đang có vận tốc rất lớn (chuyển động thẳng). <b>2.</b> Cơ bắp không thể tạo ngay ngoại lực đủ lớn để triệt tiêu vận tốc. <b>3.</b> Quán tính buộc cơ thể tiếp tục lao về phía trước; hãm phanh đột ngột dễ gây chấn thương cơ, xương khớp.</div></div></div>'],
    /* chữ "tường" màu trắng trên nền sáng không đọc được; chữ "người" đè lên hình người */
    ["x.fillStyle='#fff';x.font='26px Segoe UI';x.fillText('tường',WALL-6,XG-60);", "x.fillStyle='#7c2d12';x.font='bold 24px Segoe UI';x.fillText('tường',WALL-22,XG-62);"],
    ["x.fillText('người',px-18,py+5);", "x.fillText('người',px-36,py-30);"]
  ];
  if (ma === 'B15') va.sua = [
    thayAnh('s15_lab', 'b15-bo-tri-thi-nghiem', 'Bố trí thí nghiệm: máng đệm khí, xe trượt, cổng quang điện, quả nặng', 260),
    themTruoc('<div class="step panel math" style="font-size:24px"><b>Lời giải</b>', 'b15-cu-da-phat', 240, false),
    themTruoc('<div class="step panel" style="font-size:24px"><b>Điền khuyết:</b>', 'b15-dinh-luat-2', 170, false),
    /* lời giải thử thách dài quá khung: chia thành các dòng thẳng hàng */
    ["<div class=\"step panel\" style=\"padding:10px 14px\">$$F-F_{ms}=ma\\ \\Rightarrow\\ F=m(a+\\mu g)=80\\,(0{,}2+0{,}3\\cdot9{,}8)=\\mathbf{251{,}2}\\,\\mathrm{N}$$",
      "<div class=\"step panel\" style=\"padding:4px 12px;font-size:19px\">$$\\begin{aligned}F-F_{ms}&=ma\\ \\Rightarrow\\ F=m(a+\\mu g)\\\\F&=80\\,(0{,}2+0{,}3\\cdot9{,}8)=\\mathbf{251{,}2}\\,\\mathrm{N}\\end{aligned}$$"],
    /* khi thùng đứng yên, lực ma sát (nghỉ) bằng lực kéo chứ không bằng μN: ghi rõ để không hiểu sai */
    ["'$F\\\\le F_{ms,max}$: thùng đứng yên ($a=0$)'", "'$F\\\\le\\\\mu N$: thùng đứng yên ($a=0$), ma sát nghỉ bằng $F='+F+'\\\\,\\\\mathrm{N}$'"]
  ];
  if (ma === 'B12') {
    va.sua = [
      /* theo SGK KNTT và tài liệu của tổ, Chuyển động ném là Bài 12 (trang gốc ghi Bài 9) */
      ["<title>Bài 9 – Chuyển động ném ngang</title>", "<title>Bài 12 – Chuyển động ném ngang</title>"],
      ["Bài 9: CHUYỂN ĐỘNG NÉM</h1>", "Bài 12: CHUYỂN ĐỘNG NÉM</h1>"],
      /* chữ trên hình mô phỏng quá nhỏ khi chiếu */
      ["x1.font='15px Segoe UI';x1.fillText('bi vàng: ném ngang',X(t)+14,Y(t)-8);x1.fillText('bi đỏ: rơi tự do',OX+24,Y(t)+22);", "x1.font='bold 23px Segoe UI';x1.fillText('bi vàng: ném ngang',X(t)+16,Y(t)-6);x1.fillText('bi đỏ: rơi tự do',OX+26,Y(t)+30);"],
      ["x2.font='13px Segoe UI';x2.fillText('Mục tiêu',tx-26,gy-18);", "x2.font='bold 22px Segoe UI';x2.fillStyle='#b91c1c';x2.fillText('Mục tiêu',tx-44,gy-20);"],
      ["x3.font='18px Segoe UI';x3.fillText(`v = ${v.toFixed(1)} m/s   α = ${ang.toFixed(0)}°`,W-300,40);", "x3.font='bold 23px Segoe UI';x3.fillText(`v = ${v.toFixed(1).replace('.',',')} m/s   α = ${ang.toFixed(0)}°`,W-330,38);"],
      ["x3.fillText(`vx = ${vx} m/s (không đổi)   vy = ${vy.toFixed(1)} m/s`,W-420,66);", "x3.fillText(`vₓ = ${vx} m/s (không đổi)   vᵧ = ${vy.toFixed(1).replace('.',',')} m/s`,W-520,70);"],
      ["c.font='bold 16px Segoe UI';c.fillText(lab,(x+x2)/2+6,(y+y2)/2-6);", "c.font='bold 23px Segoe UI';c.fillText(lab,(x+x2)/2+8,(y+y2)/2-8);"]
    ];
    /* video thí nghiệm không đưa lên mạng (nặng): nếu không có file thì hiện lời nhắn thay cho khung đen */
    va.css += `.hsdh-novid{background:#fff;color:#14213d;border-radius:14px;padding:22px 26px;font-size:24px;line-height:1.45}.hsdh-novid b{color:#1d4ed8}`;
    va.js = `(function(){document.querySelectorAll('video').forEach(function(v){
      function thay(){if(!v.parentNode)return;var d=document.createElement('div');d.className='hsdh-novid';
        d.innerHTML='<b>Video thí nghiệm</b> không kèm theo bản trên mạng vì dung lượng lớn.<br>Trên máy giáo viên: chép thư mục <b>Chuyendongnem-media</b> (có '+v.getAttribute('src').split('/').pop()+') vào cạnh file bài giảng này để xem.';
        v.parentNode.replaceChild(d,v)}
      v.addEventListener('error',thay);if(v.error)thay()})})();`;
    /* nút "Mở rộng cuối bài" ở hai slide cuối (trang bai-giang/k10-chuong2-mo-rong.html#B12) */
    va.js += '\n' + require('./k10_chuong2_mo_rong/nut_mo_rong.js')('B12');
  }
  /* công cụ lên lớp ngay trong bài giảng: Gọi tên, Xung phong, Bấm giờ, Chia nhóm, Ghi chú (tools/cong_cu_lop.js) */
  const cc = require('./cong_cu_lop.js')(ma, ma === 'B12' ? '10-2' : '10-3');
  va.css += cc.css; va.js += '\n' + cc.js;
  return va;
};
