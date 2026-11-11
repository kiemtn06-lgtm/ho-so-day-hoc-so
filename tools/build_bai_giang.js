/* Dựng bản "DẠY HỌC" của một chương từ file ôn tập gốc của giáo viên.
   Cách dùng:  node tools/build_bai_giang.js "<file nguồn .html>" "<file đích .html>"
   Việc làm: (1) chỉ giữ phần Bài giảng, (2) tăng cỡ chữ theo cỡ PowerPoint trên sân khấu 1280x720,
             (3) tự co chữ từng slide cho vừa khung, (4) mở thẳng phần Bài giảng.
   File nguồn không bị sửa. CHỈ DÙNG TRÊN MÁY GIÁO VIÊN: bản này mở sẵn chế độ giáo viên, không đưa lên mạng cho học sinh. */
const fs = require('fs');
const [src, dst, tieuDe] = process.argv.slice(2);
if (!src || !dst) { console.error('Thiếu tham số: <nguồn> <đích> [tiêu đề]'); process.exit(1); }
let h = fs.readFileSync(src, 'utf8');

const TITLE = tieuDe || 'Bài giảng Vật lí 12 · Chương II · Khí lí tưởng';

/* 1. mở chế độ giáo viên trước khi mã trang chạy */
const HEAD = '<script>try{sessionStorage.setItem("vl12gv","1")}catch(e){}</script>';
h = h.replace(/<head>/, '<head>' + HEAD);
h = h.replace(/<title>[^<]*<\/title>/, '<title>' + TITLE + '</title>');

/* 2. CSS dạy học: chữ lớn theo cỡ PowerPoint (1 pt = 1,33 px trên sân khấu 1280 px) */
const Z = 'var(--z,1)';
const px = n => `calc(${n}px*${Z})`;
const CSS = `
header.top,nav.tabs,footer,.bg-foot,.tools{display:none !important}
body{background:#0d1b2a}
main{max-width:min(100%,calc((100vh - 64px)*16/9)) !important;padding:6px !important;margin:0 auto}
.bg-top{margin:4px 0 !important}
.bg-top button,.bg-top .pills button{font-size:16px}
.bg-s{--z:1}
.bg-s h2{font-size:${px(52)};margin-bottom:${px(18)}}
.bg-s h2 small{font-size:${px(28)}}
.bg-cover h1{font-size:72px;max-width:740px;margin:16px 0 30px;line-height:1.12}
.bg-cover{width:740px}
.bg-cover .k{font-size:30px;margin-top:40px}
.bg-cover .bg-q{font-size:34px;line-height:1.35}
.bg-hint{font-size:24px}
.bg-side{width:480px}
.bg-fig figcaption{font-size:20px}
.bg-list{font-size:${px(38)}}
.bg-list li{margin-bottom:${px(22)}}
.bg-formula{font-size:${px(64)};padding:${px(30)}}
.bg-note{font-size:${px(34)};line-height:1.35}
.bg-s .bg-note.exq,.bg-s .bg-note.exs{font-size:${px(31)}}
.bg-note.exs{font-size:${px(30)}}
.bg-s:has(.exq) h2{font-size:${px(42)}}
.bg-s:has(.exq) .bg-note{font-size:${px(31)}}
.bg-ex .r{flex:0 0 320px}
.bg-tb{font-size:${px(34)}}
.bg-blank{font-size:${px(32)}}
.bg-mcq .stem{font-size:${px(38)};margin-bottom:${px(22)}}
.bg-mcq .o{font-size:${px(33)}}
.bg-mcq .fb{font-size:${px(34)}}
.bg-mcq .ex{font-size:${px(29)}}
.bg-pl .r{font-size:${px(31)}}
.bg-pl select{font-size:${px(27)}}
.bg-pl i{font-size:${px(25)}}
.bg-tiles .t b{font-size:84px}
.bg-tiles .t span{font-size:32px}
.bg-qp{font-size:${px(31)}}
.bg-qp .kq{font-size:${px(28)}}
.kt-t{font-size:${px(36)}}
.kt-p{font-size:${px(33)}}
.kt-sub{font-size:${px(31)}}
.kt-sub b{font-size:26px;width:40px;height:40px}
.kt-n{width:66px;height:66px;font-size:36px}
.bg-main.w .kt-p{font-size:${px(30)}}
.bg-main.w .kt-sub{font-size:${px(28)}}
.bg-main.w .kt-t{font-size:${px(32)}}
.bg-s:has(.bg-sim){padding-top:26px;padding-bottom:62px}
.bg-s:has(.bg-sim) h2{font-size:42px;margin-bottom:10px}
.bg-sim .info{font-size:24px;margin-top:4px;padding:4px 14px}
.bg-note.sim{padding:4px 14px;margin-top:4px}
.bg-note.sim{font-size:22px}
.bg-nav{bottom:8px}
.bg-nav button{min-height:44px;font-size:1.6rem}
.bg-cnt{font-size:1.1rem}
.bg-toc{font-size:20px}
.bg-toc em{font-size:13px}
`;
h = h.replace('</head>', '<style id="giang-day">' + CSS + '</style></head>');

/* 3. mở thẳng Bài giảng và tự co chữ cho vừa từng slide */
const JS = `<script>(function(){
  function stage(){return document.getElementById('bgstage')}
  function bottomOf(sec){
    var r0=sec.getBoundingClientRect(), sc=r0.height/720||1, b=0;
    sec.querySelectorAll('*').forEach(function(e){
      if(e.closest('.bg-side,.bg-hint,.bg-qp,.bg-img,.bg-vid')||e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return;
      var r=e.getBoundingClientRect(); if(!r.height)return;
      b=Math.max(b,(r.bottom-r0.top)/sc);
    });
    return b;
  }
  function fitSec(sec){
    if(!sec||sec.dataset.fz)return;
    if(sec.querySelector('.bg-img,.bg-vid,.bg-sim,.bg-cover')){sec.dataset.fz='1';return}
    var z=1,lim=720-64;sec.style.setProperty('--z','1');
    for(var i=0;i<14&&bottomOf(sec)>lim&&z>.64;i++){z-=.04;sec.style.setProperty('--z',z.toFixed(2))}
    sec.dataset.fz=z.toFixed(2);
  }
  function watch(){
    var s=stage(); if(!s)return setTimeout(watch,200);
    new MutationObserver(function(){fitSec(s.querySelector('.bg-s.on'))}).observe(s,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
    fitSec(s.querySelector('.bg-s.on'));
  }
  function start(){
    var m=/^#(B[0-9]+)(?:@([0-9]+))?$/.exec(location.hash);
    try{if(m&&window.VLGiang){VLGiang.load(m[1]);if(m[2])VLGiang.goto(+m[2],0)}}catch(e){}
    setInterval(function(){try{var st=VLGiang.state();if(st&&parent!==window)parent.postMessage({hsdh:'pos',ma:st.b.ma,i:st.i,n:st.S.length},'*')}catch(e){}},1000);
  }
  function open(){var t=document.querySelector('[data-tab=bg]');if(t)t.click();watch();setTimeout(start,200);[60,400,1200].forEach(function(ms){setTimeout(function(){window.dispatchEvent(new Event('resize'))},ms)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(open,0)});else setTimeout(open,0);
  window.addEventListener('resize',function(){var s=stage();if(s)s.querySelectorAll('.bg-s').forEach(function(x){delete x.dataset.fz;x.style.removeProperty('--z')});fitSec(s&&s.querySelector('.bg-s.on'))});
})();</script>`;
h = h.replace('</body>', JS + '</body>');

fs.mkdirSync(require('path').dirname(dst), { recursive: true });
fs.writeFileSync(dst, h);
console.log('Đã tạo', dst, (h.length / 1048576).toFixed(1) + ' MB');
