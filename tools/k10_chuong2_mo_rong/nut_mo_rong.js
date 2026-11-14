/* Nút "Mở rộng cuối bài" cho bài giảng tương tác rời (dùng trong tools/va_bai_giang_roi.js).
   Hiện ở hai slide cuối; bấm thì mở trang k10-chuong2-mo-rong.html#<mã bài> trong khung phủ, Esc hoặc nút Đóng để quay lại. */
module.exports = function (ma) {
  return `(function(){var MA=${JSON.stringify(ma)};
  var st=document.createElement('style');st.textContent='#hsdhMR{position:fixed;right:14px;top:5px;z-index:9998;font:600 16px Segoe UI,sans-serif;background:#b91c1c;color:#fff;border:0;border-radius:999px;padding:6px 16px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;display:none}#hsdhMRk{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.6);display:none;padding:2vh 2vw}#hsdhMRk iframe{width:100%;height:100%;border:0;border-radius:12px;background:#fff}#hsdhMRk button{position:absolute;bottom:calc(2vh + 12px);right:calc(2vw + 22px);box-shadow:0 2px 10px rgba(0,0,0,.3);font:600 16px Segoe UI,sans-serif;border:0;border-radius:999px;padding:6px 14px;background:#14213d;color:#fff;cursor:pointer}';
  document.head.appendChild(st);
  var b=document.createElement('button');b.id='hsdhMR';b.textContent='Mở rộng cuối bài';b.title='Bài tập mở rộng cuối bài (xếp theo bài)';
  var k=document.createElement('div');k.id='hsdhMRk';k.innerHTML='<button type="button">Đóng ✕</button>';
  document.body.appendChild(b);document.body.appendChild(k);
  function dong(){k.style.display='none'}
  b.onclick=function(e){e.stopPropagation();if(!k.querySelector('iframe')){var f=document.createElement('iframe');f.title='Mở rộng cuối bài';f.src='k10-chuong2-mo-rong.html#'+MA;k.appendChild(f)}k.style.display='block'};
  k.querySelector('button').onclick=function(e){e.stopPropagation();dong()};
  k.addEventListener('keydown',function(e){e.stopPropagation()},true);
  document.addEventListener('keydown',function(e){if(k.style.display==='block'){if(e.key==='Escape')dong();e.stopPropagation()}},true);
  setInterval(function(){try{b.style.display=(typeof cur!=='undefined'&&slides&&cur>=slides.length-2)?'block':'none'}catch(e){}},400);
})();`;
};
