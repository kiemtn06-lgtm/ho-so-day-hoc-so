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

module.exports = function (ma) {
  const va = { css: CSS_CHUNG, js: '', sua: [] };
  if (ma === 'B13' || ma === 'B14' || ma === 'B15') va.js = JS_NHAN;
  if (ma === 'B13') va.sua = [
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
    [/<svg viewBox="0 0 330 200" width="100%"><rect x="40" y="30"[\s\S]*?<\/svg>/, SVG_B13_VUONG]
  ];
  if (ma === 'B14') va.sua = [
    /* chữ "tường" màu trắng trên nền sáng không đọc được; chữ "người" đè lên hình người */
    ["x.fillStyle='#fff';x.font='26px Segoe UI';x.fillText('tường',WALL-6,XG-60);", "x.fillStyle='#7c2d12';x.font='bold 24px Segoe UI';x.fillText('tường',WALL-22,XG-62);"],
    ["x.fillText('người',px-18,py+5);", "x.fillText('người',px-36,py-30);"]
  ];
  if (ma === 'B15') va.sua = [
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
