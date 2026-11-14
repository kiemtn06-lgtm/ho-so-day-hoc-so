/* CÔNG CỤ LÊN LỚP NGAY TRONG TRANG BÀI GIẢNG (khối 10): Gọi tên ngẫu nhiên + chấm phát biểu, Xung phong,
   Bấm giờ, Chia nhóm, Ghi chú nhanh. Giống thanh "Dạy ngay" của hồ sơ nhưng nằm sẵn trong bài giảng,
   nên mở riêng ở tab mới hay trên máy chiếu vẫn dùng được.
   - Danh sách lớp: đọc từ hồ sơ (localStorage "hsdh_v2", chỉ đọc) và danh sách nhập ngay trong bài giảng.
   - Ghi nhận (điểm phát biểu, ghi chú, danh sách lớp mới) đưa vào hàng chờ localStorage "hsdh_bg";
     hồ sơ tự nhận về khi mở hoặc quay lại tab hồ sơ (nguon/app.js, hàm nhanTuBaiGiang).
   - Khi bài giảng đang chạy trong khung "Dạy ngay" của hồ sơ thì ẩn, vì hồ sơ đã có thanh công cụ riêng.
   Dùng: require('./cong_cu_lop.js')(ma, khoaDuLieu) -> { css, js } */
module.exports = function (ma, khoa) {
  const css = `
#hl-nut{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:2147483000;font:600 16px/1 "Segoe UI",system-ui,sans-serif;background:#1d4ed8;color:#fff;border:0;border-radius:12px 0 0 12px;padding:12px 10px;box-shadow:0 2px 10px #0004;cursor:pointer;opacity:.55;transition:opacity .2s}
#hl-nut:hover,#hl-nut:focus-visible,#hl-nut.on{opacity:1}
#hl-gio{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483000;font:700 34px/1 "Segoe UI",system-ui,sans-serif;background:#fff;color:#14213d;border:3px solid #1d4ed8;border-radius:14px;padding:6px 16px;box-shadow:0 2px 12px #0005;cursor:pointer;font-variant-numeric:tabular-nums}
#hl-gio.gan{border-color:#f59e0b;color:#b45309}#hl-gio.het{border-color:#dc2626;color:#fff;background:#dc2626;animation:hlNhay 1s infinite}
@keyframes hlNhay{50%{opacity:.55}}
#hl-pan{position:fixed;top:50%;transform:translateY(-50%);right:64px;z-index:2147483000;width:340px;max-width:calc(100vw - 80px);max-height:calc(100vh - 20px);overflow:auto;background:#fff;color:#14213d;border-radius:14px;box-shadow:0 6px 28px #0006;font:16px/1.4 "Segoe UI",system-ui,sans-serif;padding:12px 14px}
#hl-pan h4{margin:12px 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:#1d4ed8}
#hl-pan h4:first-child{margin-top:0}
#hl-pan .r{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0}
#hl-pan button,.hl-ov button{font:600 15px "Segoe UI",system-ui,sans-serif;border:1px solid #c7d2fe;background:#eef2ff;color:#1e3a8a;border-radius:8px;padding:7px 11px;cursor:pointer;min-height:36px}
#hl-pan button.c,.hl-ov button.c{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
#hl-pan button:disabled{opacity:.45;cursor:default}
#hl-pan select,#hl-pan input,#hl-pan textarea{font:15px "Segoe UI",system-ui,sans-serif;border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;color:#14213d;background:#fff;max-width:100%;box-sizing:border-box}
#hl-pan textarea{width:100%;resize:vertical}
#hl-pan .m{color:#64748b;font-size:14px}
#hl-pan .x{position:absolute;top:8px;right:8px;min-height:0;padding:3px 9px;background:#fff;border-color:#e2e8f0}
#hl-pan ul{margin:4px 0;padding-left:18px;font-size:14px}
.hl-ov{position:fixed;inset:0;z-index:2147483001;background:#0f172acc;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",system-ui,sans-serif}
.hl-the{background:#fff;color:#14213d;border-radius:20px;padding:28px 36px;text-align:center;min-width:min(560px,92vw);max-width:94vw;max-height:92vh;overflow:auto;box-shadow:0 10px 40px #0008}
.hl-lop{color:#64748b;font-size:20px}
.hl-ten{font-size:clamp(40px,8vw,84px);font-weight:800;color:#1d4ed8;margin:10px 0 18px;min-height:1.2em}
.hl-ten.quay{color:#94a3b8}
.hl-ov .r{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.hl-ov .r button{font-size:22px;padding:10px 20px;min-height:52px}
.hl-ov .d1{background:#16a34a;border-color:#16a34a;color:#fff}.hl-ov .d2{background:#65a30d;border-color:#65a30d;color:#fff}.hl-ov .d0{background:#f1f5f9;border-color:#cbd5e1;color:#334155}
.hl-nhom{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;text-align:left;margin-top:12px}
.hl-nhom div{border:2px solid #c7d2fe;border-radius:12px;padding:10px 14px;font-size:20px;background:#f8faff}
.hl-nhom b{display:block;color:#1d4ed8;font-size:22px;margin-bottom:4px}
.hl-tb{font-size:18px;color:#16a34a;min-height:1.4em;margin-top:8px}
@media print{#hl-nut,#hl-gio,#hl-pan,.hl-ov{display:none!important}}
`;
  const js = `(function(){
  var MA=${JSON.stringify(ma)},KHOA=${JSON.stringify(khoa + '.' + ma)};
  try{var fe=window.frameElement;if(fe&&fe.id==='llFrame')return}catch(e){}
  var KB='hsdh_bg',KH='hsdh_v2';
  function doc(k){try{return JSON.parse(localStorage.getItem(k)||'null')||{}}catch(e){return{}}}
  function bg(){var o=doc(KB);o.pv=o.pv||[];o.notes=o.notes||[];o.lopMoi=o.lopMoi||{};o.goi=o.goi||{};return o}
  function ghi(o){try{localStorage.setItem(KB,JSON.stringify(o));return true}catch(e){return false}}
  function sua(f){var o=bg();f(o);return ghi(o)}
  function lops(){var h=doc(KH).lop||{},m=bg().lopMoi,o={},k;for(k in h)o[k]=h[k];for(k in m)o[k]=m[k];return o}
  function homNay(){return new Date().toLocaleDateString('vi-VN')}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function slideSo(){try{return cur+1}catch(e){return ''}}
  function $i(id){return document.getElementById(id)}
  /* âm thanh ngắn (Web Audio) */
  var AC=null;
  function tieng(f,d,v,kieu){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.type=kieu||'sine';o.frequency.value=f;g.gain.setValueAtTime(v||.15,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
  function tach(){tieng(1200,.05,.08,'square')}
  function vui(){tieng(660,.15);setTimeout(function(){tieng(880,.15)},120);setTimeout(function(){tieng(1175,.25)},240)}
  function chuong(){[0,450,900].forEach(function(t){setTimeout(function(){tieng(880,.4,.25);tieng(1320,.4,.12)},t)})}

  var LOP=bg().lastLop||doc(KH).lastLop||'';
  /* nút mở bảng công cụ */
  var nut=document.createElement('button');nut.id='hl-nut';nut.type='button';nut.title='Công cụ lớp: Gọi tên (phím G), Bấm giờ, Chia nhóm, Ghi chú';nut.textContent='👥 Lớp';
  document.body.appendChild(nut);
  var pan=document.createElement('div');pan.id='hl-pan';pan.hidden=true;pan.setAttribute('role','dialog');pan.setAttribute('aria-label','Công cụ lớp');
  document.body.appendChild(pan);
  /* gõ chữ trong bảng công cụ không làm chuyển slide */
  /* phím: Esc đóng khung đang mở (gọi tên, chia nhóm) rồi mới đến bảng; G gọi tên;
     gõ chữ trong bảng hoặc khi đang có khung thì không làm chuyển slide */
  ['keyup','keypress'].forEach(function(t){document.addEventListener(t,function(e){if(document.querySelector('.hl-ov')||(e.target&&e.target.closest&&e.target.closest('#hl-pan')))e.stopPropagation()},true)});
  document.addEventListener('keydown',function(e){
    var mr=document.getElementById('hsdhMRk');if(mr&&mr.style.display==='block')return;
    var trong=e.target&&e.target.closest&&e.target.closest('#hl-pan');
    if(document.querySelector('.hl-ov')){if(e.key==='Escape')dongOv();e.stopPropagation();return}
    if(e.key==='Escape'&&!pan.hidden){moPan(false);e.stopPropagation();return}
    if(trong){e.stopPropagation();return}
    var tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.key==='g'||e.key==='G'){e.preventDefault();e.stopPropagation();goiTen()}
  },true);
  nut.onclick=function(){tach();moPan(pan.hidden)};
  function moPan(m){pan.hidden=!m;nut.classList.toggle('on',m);if(m)ve()}

  function ve(){
    var L=lops(),ten=Object.keys(L).sort(),ds=L[LOP]||[],b=bg(),g=b.goi[LOP],daGoi=(g&&g.ngay===homNay()&&g.ma===MA)?g.ds:[];
    var pvH=b.pv.filter(function(r){return r.lop===LOP&&r.ngay===homNay()&&r.bai===MA});
    var h='<button class="x" data-l="dong" aria-label="Đóng">✕</button><h4>Lớp</h4><div class="r"><select id="hl-lop" aria-label="Chọn lớp"><option value="">(chưa chọn)</option>'+ten.map(function(l){return'<option'+(l===LOP?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select><button data-l="nhap">'+(ten.length?'Thêm / sửa lớp':'Nhập danh sách lớp')+'</button></div>';
    if(LOP)h+='<div class="m">'+ds.length+' học sinh · hôm nay đã gọi '+daGoi.length+' em</div>';
    h+='<div id="hl-nhap" hidden><input id="hl-tl" placeholder="Tên lớp, ví dụ 10A1" value="'+esc(LOP)+'" style="width:100%;margin:6px 0"><textarea id="hl-ds" rows="6" placeholder="Mỗi dòng một học sinh">'+esc(ds.join('\\n'))+'</textarea><div class="r"><button class="c" data-l="luuLop">Lưu lớp</button><span class="m">Chỉ nhập tên, không nhập thông tin khác.</span></div></div>';
    h+='<h4>Gọi tên</h4><div class="r"><button class="c" data-l="goi"'+(ds.length?'':' disabled')+'>🎲 Gọi tên ngẫu nhiên (G)</button></div>';
    h+='<div class="r"><select id="hl-xp" aria-label="Học sinh xung phong"'+(ds.length?'':' disabled')+'><option value="">Em xung phong…</option>'+ds.map(function(n){return'<option>'+esc(n)+'</option>'}).join('')+'</select><button data-l="xp"'+(ds.length?'':' disabled')+'>Chấm</button></div>';
    if(pvH.length)h+='<div class="m">Phát biểu hôm nay ('+pvH.length+'):</div><ul>'+pvH.slice(-6).map(function(r){return'<li>'+esc(r.hs)+': '+(r.diem===1?'+1':r.diem===.5?'+0,5':'0')+' (slide '+r.slide+')</li>'}).join('')+'</ul><div class="r"><button data-l="hoan">Hoàn tác lần chấm cuối</button></div>';
    if(daGoi.length)h+='<div class="r"><button data-l="lamMoi">Cho gọi lại từ đầu</button></div>';
    h+='<h4>Bấm giờ</h4><div class="r">'+[[30,'30 giây'],[60,'1 phút'],[120,'2 phút'],[180,'3 phút'],[300,'5 phút'],[600,'10 phút']].map(function(x){return'<button data-l="gio" data-s="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div><div class="r"><button data-l="dung"'+(GIO.con>0||GIO.tm?'':' disabled')+'>'+(GIO.tm?'Tạm dừng':'Chạy tiếp')+'</button><button data-l="tat"'+(GIO.hien?'':' disabled')+'>Tắt đồng hồ</button></div>';
    h+='<h4>Chia nhóm</h4><div class="r"><label>Số nhóm <select id="hl-sn">'+[2,3,4,5,6,7,8].map(function(n){return'<option'+(n===4?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><button data-l="nhom"'+(ds.length?'':' disabled')+'>Chia nhóm ngẫu nhiên</button></div>';
    h+='<h4>Ghi chú nhanh</h4><textarea id="hl-gc" rows="2" placeholder="Lớp vướng chỗ nào, tiết sau cần làm gì (lưu kèm lớp và slide)"></textarea><div class="r"><button data-l="luuGc">Lưu ghi chú</button><span class="m" id="hl-msg" role="status"></span></div>';
    h+='<p class="m" style="margin:10px 0 0">Điểm phát biểu và ghi chú tự chuyển vào hồ sơ (mục Lớp học, Ghi chú sau tiết) khi mở hồ sơ trên cùng máy, cùng trình duyệt.</p>';
    pan.innerHTML=h;
  }
  function bao(m){var e=$i('hl-msg');if(e){e.textContent=m;setTimeout(function(){if(e)e.textContent=''},3000)}}
  pan.addEventListener('change',function(e){
    if(e.target.id==='hl-lop'){LOP=e.target.value;sua(function(o){o.lastLop=LOP});tach();ve()}
  });
  pan.addEventListener('click',function(e){
    var t=e.target.closest('button');if(!t||t.disabled)return;var l=t.getAttribute('data-l');if(!l)return;tach();
    if(l==='dong')return moPan(false);
    if(l==='nhap'){var n=$i('hl-nhap');n.hidden=!n.hidden;if(!n.hidden)$i('hl-tl').focus();return}
    if(l==='luuLop'){var tl=$i('hl-tl').value.trim(),ds=$i('hl-ds').value.split('\\n').map(function(s){return s.trim()}).filter(Boolean);
      if(!tl||!ds.length){alert('Cần tên lớp và ít nhất một học sinh.');return}
      if(!sua(function(o){o.lopMoi[tl]=ds;o.lastLop=tl})){alert('Trình duyệt không cho lưu (chế độ ẩn danh?).');return}LOP=tl;ve();return}
    if(l==='goi')return goiTen();
    if(l==='xp'){var v=$i('hl-xp').value;if(v)moCham(v,false);return}
    if(l==='hoan'){var bo=null;sua(function(o){for(var i=o.pv.length-1;i>=0;i--){var r=o.pv[i];if(r.lop===LOP&&r.bai===MA&&r.ngay===homNay()){bo=o.pv.splice(i,1)[0];break}}});
      if(!bo)alert('Lần chấm này đã chuyển vào hồ sơ. Xóa ở hồ sơ, mục Lớp học.');ve();return}
    if(l==='lamMoi'){sua(function(o){delete o.goi[LOP]});ve();return}
    if(l==='gio')return batGio(+t.getAttribute('data-s'));
    if(l==='dung'){if(GIO.tm)dungGio();else if(GIO.con>0)chay();ve();return}
    if(l==='tat'){dungGio();GIO.con=0;GIO.hien=false;oGio.hidden=true;ve();return}
    if(l==='nhom')return chiaNhom(+$i('hl-sn').value);
    if(l==='luuGc'){var tx=$i('hl-gc').value.trim();if(!tx){bao('Chưa có nội dung.');return}
      if(sua(function(o){o.notes.push({k:KHOA,lop:LOP,ngay:homNay(),slide:slideSo(),text:tx})})){$i('hl-gc').value='';bao('Đã lưu.')}else bao('Không lưu được.');return}
  });

  /* ---- gọi tên ngẫu nhiên: không lặp lại trong cùng bài, cùng ngày, đến khi gọi hết lớp ---- */
  var OV=null;
  function dongOv(){if(OV){clearTimeout(OV.tq);OV.el.remove();OV=null;if(!pan.hidden)ve()}}
  function goiTen(){
    var ds=lops()[LOP]||[];
    if(!ds.length){moPan(true);var n=$i('hl-nhap');if(n){n.hidden=false;$i('hl-tl').focus()}bao('Chọn lớp hoặc nhập danh sách lớp trước.');return}
    var b=bg(),g=b.goi[LOP];if(!g||g.ngay!==homNay()||g.ma!==MA)g={ngay:homNay(),ma:MA,ds:[]};
    var con=ds.filter(function(n){return g.ds.indexOf(n)<0});if(!con.length){g.ds=[];con=ds.slice()}
    var chon=con[Math.floor(Math.random()*con.length)];g.ds.push(chon);sua(function(o){o.goi[LOP]=g});
    moCham(chon,true,ds);
  }
  function moCham(ten,quay,ds){
    dongOv();
    var el=document.createElement('div');el.className='hl-ov';
    el.innerHTML='<div class="hl-the" role="dialog" aria-label="Gọi tên"><div class="hl-lop">'+esc(LOP)+(quay?' · gọi ngẫu nhiên':' · xung phong')+'</div><div class="hl-ten'+(quay?' quay':'')+'" aria-live="polite"></div>'+
      '<div class="r" id="hl-cham" '+(quay?'hidden':'')+'><button class="d1" data-d="1">+1 Tốt</button><button class="d2" data-d="0.5">+0,5 Được</button><button class="d0" data-d="0">0 Chưa đạt</button></div>'+
      '<div class="r"><button data-k="khac">🎲 Gọi em khác</button><button data-k="bo">Bỏ qua (Esc)</button></div><div class="hl-tb" role="status"></div></div>';
    document.body.appendChild(el);OV={el:el,tq:0};
    var o=el.querySelector('.hl-ten');
    function xong(){o.textContent=ten;o.classList.remove('quay');var c=el.querySelector('#hl-cham');if(c)c.hidden=false;vui();var b1=el.querySelector('.d1');if(b1)b1.focus()}
    if(quay&&ds&&ds.length>1){var k=0,buoc=[50,50,50,60,60,70,80,90,110,130,160,200,250];
      (function lan(){if(!OV||OV.el!==el)return;if(k>=buoc.length)return xong();o.textContent=ds[Math.floor(Math.random()*ds.length)];tach();OV.tq=setTimeout(lan,buoc[k++])})()}
    else xong();
    el.addEventListener('click',function(e){
      if(e.target===el){tach();return dongOv()}
      var t=e.target.closest('button');if(!t)return;
      if(t.hasAttribute('data-d')){var d=+t.getAttribute('data-d');
        sua(function(x){x.pv.push({lop:LOP,hs:ten,ngay:homNay(),bai:MA,slide:slideSo(),diem:d})});
        el.querySelector('.hl-tb').textContent='Đã ghi: '+ten+' '+(d===1?'+1':d===.5?'+0,5':'0');
        el.querySelector('#hl-cham').hidden=true;d>0?vui():tach();setTimeout(function(){if(OV&&OV.el===el)dongOv();if(!pan.hidden)ve()},900);return}
      tach();
      if(t.getAttribute('data-k')==='khac'){if(quay)return goiTen();dongOv();return goiTen()}
      if(t.getAttribute('data-k')==='bo'){dongOv();if(!pan.hidden)ve()}
    });
  }

  /* ---- bấm giờ đếm ngược ---- */
  var GIO={con:0,tm:null,hien:false};
  var oGio=document.createElement('div');oGio.id='hl-gio';oGio.hidden=true;oGio.title='Bấm để tạm dừng hoặc chạy tiếp';oGio.setAttribute('role','timer');document.body.appendChild(oGio);
  oGio.onclick=function(){tach();if(GIO.tm)dungGio();else if(GIO.con>0)chay();else{GIO.hien=false;oGio.hidden=true}if(!pan.hidden)ve()};
  function hienGio(){var s=Math.max(0,GIO.con);oGio.textContent=(GIO.tm?'⏱ ':'⏸ ')+Math.floor(s/60)+':'+('0'+s%60).slice(-2);
    oGio.classList.toggle('gan',s>0&&s<=10);oGio.classList.toggle('het',s===0);if(s===0)oGio.textContent='⏰ Hết giờ'}
  function dungGio(){if(GIO.tm){clearInterval(GIO.tm);GIO.tm=null}hienGio()}
  function chay(){if(GIO.tm)return;GIO.tm=setInterval(function(){GIO.con--;if(GIO.con<=0){GIO.con=0;dungGio();chuong();if(!pan.hidden)ve();return}if(GIO.con<=5)tieng(990,.08,.1);hienGio()},1000);hienGio()}
  function batGio(s){dungGio();GIO.con=s;GIO.hien=true;oGio.hidden=false;chay();ve()}

  /* ---- chia nhóm ngẫu nhiên ---- */
  function chiaNhom(n){
    var ds=(lops()[LOP]||[]).slice();if(!ds.length)return;
    for(var i=ds.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=ds[i];ds[i]=ds[j];ds[j]=t}
    n=Math.min(n,ds.length);var nh=[];for(i=0;i<n;i++)nh.push([]);ds.forEach(function(x,k){nh[k%n].push(x)});
    dongOv();var el=document.createElement('div');el.className='hl-ov';
    el.innerHTML='<div class="hl-the" style="min-width:min(900px,94vw)"><div class="hl-lop">'+esc(LOP)+' · '+n+' nhóm</div><div class="hl-nhom">'+nh.map(function(g,k){return'<div><b>Nhóm '+(k+1)+'</b>'+g.map(esc).join('<br>')+'</div>'}).join('')+'</div><div class="r"><button data-k="lai">🎲 Chia lại</button><button class="c" data-k="bo">Đóng (Esc)</button></div></div>';
    document.body.appendChild(el);OV={el:el,tq:0};vui();
    el.addEventListener('click',function(e){var t=e.target.closest('button');if(e.target===el||(t&&t.getAttribute('data-k')==='bo')){tach();dongOv()}else if(t&&t.getAttribute('data-k')==='lai'){tach();chiaNhom(n)}});
  }
})();`;
  return { css, js };
};
