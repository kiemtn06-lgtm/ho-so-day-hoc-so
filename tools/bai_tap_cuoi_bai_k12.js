/* "Bài tập cuối bài" cho K12 Chương II (Khí lí tưởng), như khối 11.
   Nội dung là phần "Mở rộng ôn tập" Bài 8-12 của trang Ôn tập (dữ liệu #mr, nguồn .docx của giáo viên). KHÔNG chép lại: hai trang cùng đọc MỘT bản dữ liệu
   nên giống 100% (câu, công thức, hình, mô phỏng, đáp án ẩn/hiện).
   - on-tap/k12-chuong2.html#bt-8 .. #bt-12 : chỉ hiện bài tập cuối bài của bài đó (ẩn tiêu đề, thanh tab, nút chọn bài). Khi trang nằm trong khung của hồ sơ, tab "Mở rộng ôn tập" được ẩn.
   - bai-giang/k12-chuong2.html : thêm nút "Bài tập cuối bài (B)" (ở thanh trên và ở nút điều hướng khi toàn màn hình), mở bảng phủ chứa khung bài tập của bài đang giảng.
   Dùng chung cho tools/build_on_tap.js, tools/build_bai_giang.js (tự áp khi dựng lại), hoặc chạy riêng trên trang đã dựng:
     node tools/bai_tap_cuoi_bai_k12.js on-tap/k12-chuong2.html bai-giang/k12-chuong2.html
   Chạy lại không sao (đã có dấu thì bỏ qua). */
const DAU_OT = '<!--bt-k12-ot-->', DAU_BG = '<!--bt-k12-bg-->';

const CSS_OT = `<style id="bt-k12">
body.bt header.top,body.bt nav.tabs,body.bt #p-mr>h2:not(#btH),body.bt #p-mr>.note,body.bt #p-mr [data-a=mrb]{display:none !important}
body.bt #btH{margin:10px 0 6px}
body.emb:not(.bt) [data-tab=mr]{display:none !important}
</style>`;

const JS_OT = `<script>(function(){
  var KEY='onthi:vat-li:12:cuoi-ki-1:v1',framed=false;try{framed=parent!==window}catch(e){framed=true}
  function bt(){return /^#bt-([0-9]+)$/.exec(location.hash)}
  function giu(raw){try{if(raw===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,raw)}catch(e){}}
  var goc;try{goc=localStorage.getItem(KEY)}catch(e){goc=null}
  window.addEventListener('pagehide',function(){if(bt())giu(goc)});
  function go(){
    var m=bt();document.body.classList.toggle('bt',!!m);document.body.classList.toggle('emb',framed);
    if(!m)return;
    var t=document.querySelector('[data-tab=mr]');if(t)t.click();
    setTimeout(function(){
      var p=document.querySelector('[data-a=mrb][data-b="'+m[1]+'"]');if(p)p.click();
      var h=document.getElementById('btH'),pn=document.getElementById('p-mr'),bd=document.getElementById('mrbody');
      if(!h&&pn&&bd){h=document.createElement('h2');h.id='btH';pn.insertBefore(h,pn.firstChild)}
      if(h)h.textContent='Bài tập cuối bài · Bài '+m[1];
      giu(goc);
    },300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(go,0)});else setTimeout(go,0);
  window.addEventListener('hashchange',go);
})();</script>`;

const CSS_BG = `<style id="bt-k12-bg">
.bg-nav [data-bt]{font-size:1rem !important;padding:0 14px !important;border-radius:16px;white-space:nowrap}
#btK{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.7);display:none;padding:2vh 2vw}
#btK iframe{width:100%;height:100%;border:0;border-radius:12px;background:#fff}
#btK .btx{position:absolute;bottom:calc(2vh + 12px);right:calc(2vw + 22px);font:600 16px "Segoe UI",sans-serif;border:0;border-radius:999px;padding:7px 16px;background:#14213d;color:#fff;cursor:pointer;box-shadow:0 2px 10px #0006}
#btK .btm{background:#fff;color:#1d2330;border-radius:12px;padding:28px;font:18px/1.5 "Segoe UI",sans-serif;max-width:560px;margin:14vh auto 0}
</style>`;

const JS_BG = `<script>(function(){
  var DS={B8:1,B9:1,B10:1,B11:1,B12:1},K=null,sau='';
  function bai(){try{var s=VLGiang.state();return s&&s.b?s.b.ma:'B8'}catch(e){return 'B8'}}
  function dong(){if(K){K.style.display='none'}var b=document.querySelector('[data-bt]');if(b)try{b.focus()}catch(e){}}
  function mo(){
    var ma=bai(),n=ma.slice(1),host=document.fullscreenElement||document.body;
    if(!K){K=document.createElement('div');K.id='btK';var x=document.createElement('button');x.type='button';x.className='btx';x.textContent='Đóng ✕';x.onclick=dong;K.appendChild(x)}
    if(K.parentNode!==host)host.appendChild(K);
    var f=K.querySelector('iframe'),m=K.querySelector('.btm');
    if(f)f.style.display='none';if(m)m.remove();
    if(DS[ma]){
      var u='../on-tap/k12-chuong2.html#bt-'+n;
      if(!f){f=document.createElement('iframe');f.title='Bài tập cuối bài';K.insertBefore(f,K.firstChild)}
      f.style.display='';
      if(sau!==u){f.src=u;sau=u}
    }else{
      m=document.createElement('div');m.className='btm';m.innerHTML='<b>Bài '+n+'</b> chưa có bài tập cuối bài (tệp bài tập gốc chỉ có Bài 8–12).';K.insertBefore(m,K.firstChild);
    }
    K.style.display='block';K.querySelector('.btx').focus();
  }
  document.addEventListener('click',function(e){if(e.target.closest('[data-bt]')){e.preventDefault();mo()}});
  document.addEventListener('keydown',function(e){
    if(K&&K.style.display==='block'){if(e.key==='Escape'){e.stopPropagation();dong()}return}
    if((e.key==='b'||e.key==='B')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&document.getElementById('bgwrap')&&document.getElementById('bgwrap').offsetParent){e.preventDefault();mo()}
  },true);
})();</script>`;

const NUT_TOP = '<button type="button" data-g="fs">Toàn màn hình (F)</button></div></div>';
const NUT_TOP_MOI = '<button type="button" data-bt="1" title="Bài tập của bài này, có đáp án (phím B)">Bài tập cuối bài (B)</button><button type="button" data-g="fs">Toàn màn hình (F)</button></div></div>';
const NUT_NAV = '<button type="button" data-g="next" aria-label="Tiếp">›</button></div><div class="bg-toc" hidden>';
const NUT_NAV_MOI = '<button type="button" data-g="next" aria-label="Tiếp">›</button><button type="button" data-bt="1" aria-label="Bài tập cuối bài" title="Bài tập cuối bài (B)">Bài tập</button></div><div class="bg-toc" hidden>';

function chen(h, dau, css, js) {
  if (h.includes(dau)) return h;
  h = h.replace('</head>', () => dau + css + '</head>');
  const i = h.lastIndexOf('</body>');
  return i < 0 ? h + js : h.slice(0, i) + js + h.slice(i);
}
function doi(h, cu, moi, ten) {
  const n = h.split(cu).length - 1;
  if (n !== 1) { console.log('  KHÔNG áp được nút (' + n + ' chỗ):', ten); return h; }
  return h.replace(cu, () => moi);
}
function vaOnTap(h) { return chen(h, DAU_OT, CSS_OT, JS_OT); }
function vaBaiGiang(h) {
  if (h.includes(DAU_BG)) return h;
  h = doi(h, NUT_TOP, NUT_TOP_MOI, 'thanh trên');
  h = doi(h, NUT_NAV, NUT_NAV_MOI, 'nút điều hướng');
  return chen(h, DAU_BG, CSS_BG, JS_BG);
}
module.exports = { onTap: vaOnTap, baiGiang: vaBaiGiang };

if (require.main === module) {
  const fs = require('fs');
  for (const f of process.argv.slice(2)) {
    const h = fs.readFileSync(f, 'utf8'), h2 = /on-tap/.test(f.replace(/\\/g, '/')) ? vaOnTap(h) : vaBaiGiang(h);
    console.log(h2 !== h ? 'đã áp  ' + f : 'đã có   ' + f);
    if (h2 !== h) fs.writeFileSync(f, h2);
  }
}
