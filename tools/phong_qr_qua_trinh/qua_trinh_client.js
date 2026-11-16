/* ---------- [QT] mã QR cho học sinh, điểm quá trình (cộng dồn qua các buổi), vòng tròn tiến độ gửi bài theo từng câu ----------
   Chép từ tools/phong_qr_qua_trinh (hồ sơ dạy học số). Máy chủ: qua_trinh.js. */
function qtSize(){var s=cfgSet();return s.classSize||s.joined||Object.keys(S.responses||{}).length||0;}
/* vòng tròn nhỏ: n/tot em đã gửi đáp án (sm: chỉ vòng tròn, dùng ở đầu cột bảng kết quả) */
function qtRing(n,tot,big,sm){
  n=n||0;tot=Math.max(tot||0,n);var R=15,C=2*Math.PI*R,f=tot?n/tot:0,full=tot>0&&n>=tot;
  return '<span class="mr'+(full?' full':'')+(sm?' sm':'')+'" title="'+n+'/'+tot+' em đã gửi đáp án"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="mr-bg" cx="20" cy="20" r="'+R+'"/>'+
    '<circle class="mr-fg" cx="20" cy="20" r="'+R+'" transform="rotate(-90 20 20)" style="stroke-dasharray:'+C.toFixed(1)+';stroke-dashoffset:'+(C*(1-f)).toFixed(1)+'"/></svg>'+
    (sm?'':'<span class="num">'+n+'/'+tot+'</span>'+(big?'<span>em đã gửi</span>':''))+'</span>';
}
function qtSentS(id){var s=(S.config&&S.config.sent)||{};return s[id]||0;}
function qtSentT(id){var n=0;for(var k in S.responses){var a=S.responses[k].answers||{};if(a[id]!=null)n++;}return n;}
function qtF(v){return (Math.round(v*10)/10).toFixed(1).replace('.',',');}
function qtD(d){try{return new Date(d).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});}catch(e){return '';}}

/* trang học sinh: điểm buổi này, các buổi trước và điểm trung bình quá trình */
function qtStudentCard(){
  var q=S.mine&&S.mine.qt;if(!q)return '';
  var past=q.past||[],cur=q.cur||{r:0,g:0},list=past.map(function(x){return x.r*10/x.g;});
  if(cur.g)list.push(cur.r*10/cur.g);
  var avg=list.length?list.reduce(function(a,b){return a+b;},0)/list.length:null;
  var h='<div class="card qt"><div class="row" style="justify-content:space-between;align-items:center"><div><b>Điểm quá trình</b><div class="kv">'+
    (list.length?'Trung bình '+list.length+' buổi'+(cur.g?', tính cả buổi này':''):'Chưa có điểm. Điểm hiện khi giáo viên đóng câu đầu tiên.')+'</div></div>'+
    '<span class="qt-avg">'+(avg==null?'—':qtF(avg))+'<small>/10</small></span></div>';
  if(list.length){
    var rows=past.map(function(x){return '<tr><td>'+qtD(x.d)+'</td><td>'+esc(x.t)+'</td><td class="num">'+x.r+'/'+x.g+'</td><td class="num"><b>'+qtF(x.r*10/x.g)+'</b></td></tr>';});
    if(cur.g)rows.push('<tr class="cur"><td>Hôm nay</td><td>Buổi này (đang làm)</td><td class="num">'+cur.r+'/'+cur.g+'</td><td class="num"><b>'+qtF(cur.r*10/cur.g)+'</b></td></tr>');
    var many=rows.length>4&&!S.qtAll;
    h+='<table class="qt-t"><thead><tr><th>Ngày</th><th>Buổi</th><th>Đúng</th><th>Điểm</th></tr></thead><tbody>'+(many?rows.slice(-4):rows).join('')+'</tbody></table>'+
      (rows.length>4?'<button class="btn" data-act="qtAll" style="margin-top:8px;padding:4px 12px;font-size:13px">'+(S.qtAll?'Thu gọn':'Xem cả '+rows.length+' buổi')+'</button>':'')+
      '<div class="kv" style="margin-top:6px">Điểm mỗi buổi = số câu đúng gửi kịp / số câu đã chấm × 10. Câu gửi muộn không tính.</div>';
  }
  return h+'</div>';
}

/* ---- giáo viên: mã QR ---- */
function qtLib(cb){
  if(window.qrcode)return cb();
  var s=document.createElement('script');s.src='/lib/qrcode.js';s.onload=function(){cb();};s.onerror=function(){S.qrErr='Không tải được thư viện mã QR';render();};document.head.appendChild(s);
}
function qtUrls(cb){
  if(S.qrUrls)return cb(S.qrUrls);
  var h=location.hostname;
  if(h==='localhost'||h==='127.0.0.1'||h==='::1'||h==='[::1]'){
    api('/api/t/lan').then(function(j){S.qrUrls=(j.ips||[]).map(function(ip){return 'http://'+ip+':'+(j.port||location.port)+'/';});
      if(!S.qrUrls.length)S.qrUrls=[location.origin+'/'];cb(S.qrUrls);}).catch(function(){S.qrUrls=[location.origin+'/'];cb(S.qrUrls);});
  }else{S.qrUrls=[location.origin+'/'];cb(S.qrUrls);}
}
function qtSvg(u){var q=qrcode(0,'M');q.addData(u);q.make();return q.createSvgTag({cellSize:4,margin:2,scalable:true,alt:'Mã QR vào phòng làm bài'});}
function qtPrep(){
  if(S.qrBusy||S.qrSvg)return;S.qrBusy=true;
  qtLib(function(){qtUrls(function(us){S.qrI=S.qrI||0;S.qrSvg=qtSvg(us[S.qrI]||us[0]);S.qrBusy=false;render();if(S.qrWantBig)qtBig();});});
}
function qtQrCard(){
  if(!S.qrSvg){qtPrep();return '<div class="card"><h2>Mã QR cho học sinh</h2><div class="kv">'+(S.qrErr?esc(S.qrErr):'Đang tạo mã…')+'</div></div>';}
  var us=S.qrUrls||[],u=us[S.qrI||0]||'';
  return '<div class="card"><div class="qrc"><button class="qrimg" data-act="qrBig" title="Phóng to để chiếu">'+S.qrSvg+'</button><div style="flex:1;min-width:200px">'+
    '<h2 style="margin-top:0">Học sinh quét mã để vào phòng</h2><div class="qrurl">'+esc(u)+'</div>'+
    (us.length>1?'<div class="row" style="margin-top:8px"><span class="kv">Máy có nhiều mạng, chọn mạng học sinh đang dùng:</span>'+us.map(function(x,i){return '<button class="btn'+(i===(S.qrI||0)?' primary':'')+'" data-act="qrNet" data-i="'+i+'" style="padding:4px 10px;font-size:13px">'+esc(x.replace(/^http:\/\//,'').replace(/\/$/,''))+'</button>';}).join('')+'</div>':'')+
    '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="qrBig">Phóng to để chiếu</button>'+(S.showQR?'<button class="btn" data-act="qr">Ẩn mã QR</button>':'')+'</div>'+
    '<div class="kv" style="margin-top:6px">Mở camera điện thoại hoặc Zalo, quét mã. Học sinh ghi đúng họ tên và lớp như các buổi trước để được cộng điểm quá trình.</div></div></div></div>';
}
function qtBig(){
  S.qrWantBig=false;if(!S.qrSvg){S.qrWantBig=true;qtPrep();return;}
  var o=document.getElementById('qrBig');if(o)o.remove();
  o=document.createElement('div');o.id='qrBig';o.setAttribute('role','dialog');o.setAttribute('aria-label','Mã QR vào phòng làm bài');
  o.innerHTML='<div class="qrimg">'+S.qrSvg+'</div><div class="qrurl">'+esc((S.qrUrls||[])[S.qrI||0]||'')+'</div><button class="btn">Đóng (Esc)</button>';
  function close(){o.remove();document.removeEventListener('keydown',k);}
  function k(e){if(e.key==='Escape')close();}
  o.addEventListener('click',close);document.addEventListener('keydown',k);document.body.appendChild(o);o.querySelector('button').focus();
}

/* ---- giáo viên: điểm quá trình, lưu ở trình duyệt này và trên máy chủ (máy chủ ngủ thì trang này tự nạp lại) ---- */
function qtKey(){return 'qtHist:'+((S.config&&S.config.title)||location.host);}
function qtEmpty(){return {sess:{},sc:{},del:[]};}
function qtLoad(){try{var h=JSON.parse(localStorage.getItem(qtKey())||'null');return h&&h.sess?h:qtEmpty();}catch(e){return qtEmpty();}}
function qtStore(h){try{localStorage.setItem(qtKey(),JSON.stringify(h));}catch(e){}}
function qtName(a,b){var d=function(s){return (String(s||'').normalize('NFD').match(/[̀-ͯ]|[đĐ]/g)||[]).length;};return !a?b:!b?a:d(b)>=d(a)?b:a;}
function qtMerge(a,b){
  a=a||qtEmpty();b=b||qtEmpty();var o=qtEmpty(),del={},i;
  (a.del||[]).concat(b.del||[]).forEach(function(x){del[x]=1;});o.del=Object.keys(del);
  [a,b].forEach(function(h){for(var id in h.sess||{}){if(del[id])continue;var s=h.sess[id],c=o.sess[id];
    o.sess[id]=c?{d:c.d||s.d,t:(s.g>=c.g?s.t||c.t:c.t||s.t),g:Math.max(c.g||0,s.g||0)}:{d:s.d,t:s.t,g:s.g||0};}});
  [a,b].forEach(function(h){for(var k in h.sc||{}){var r=h.sc[k],c=o.sc[k]||(o.sc[k]={n:r.n,v:{}});c.n=qtName(c.n,r.n);
    for(var id in r.v||{})if(o.sess[id])c.v[id]=Math.max(c.v[id]||0,r.v[id]||0);}});
  for(i in o.sc)if(!Object.keys(o.sc[i].v).length)delete o.sc[i];
  return o;
}
function qtBehind(m,s){/* máy chủ thiếu gì so với bản ở trình duyệt? */
  s=s||qtEmpty();var id,k;
  for(id in m.sess)if(!s.sess[id]||(s.sess[id].g||0)<(m.sess[id].g||0))return true;
  for(var i=0;i<m.del.length;i++)if((s.del||[]).indexOf(m.del[i])<0)return true;
  for(k in m.sc)for(id in m.sc[k].v){var sv=s.sc[k]&&s.sc[k].v[id];if(sv==null||sv<m.sc[k].v[id])return true;}
  return false;
}
var qtN=0,qtBusyS=false;
function qtTick(){if(!S.config||!PASS||qtBusyS)return;if(qtN++%5)return;qtSync();}
function qtSync(){
  qtBusyS=true;
  return api('/api/t/hist').then(function(j){
    var m=qtMerge(qtLoad(),j.hist);qtStore(m);S.qtH=m;S.qtCur=j.cur;
    if(qtBehind(m,j.hist))return api('/api/t/hist',{method:'POST',body:JSON.stringify({hist:m})}).then(function(k){S.qtH=qtMerge(m,k.hist);qtStore(S.qtH);S.qtCur=k.cur;});
  }).then(function(){qtBusyS=false;if(S.showQT)render();},function(){qtBusyS=false;});
}
function qtCols(h){return Object.keys(h.sess).sort(function(a,b){return h.sess[a].d-h.sess[b].d;});}
function qtRows(h){return Object.keys(h.sc).sort(function(a,b){return String(h.sc[a].n).localeCompare(String(h.sc[b].n),'vi');});}
function qtAvg(h,k,cols){var t=0,n=0;cols.forEach(function(id){var x=h.sc[k].v[id],g=h.sess[id].g;if(x!=null&&g){t+=x*10/g;n++;}});return n?t/n:null;}
function qtTeacherCard(){
  var h=S.qtH;if(!h){qtSync();return '<div class="card"><h2>Điểm quá trình</h2><div class="kv">Đang tải…</div></div>';}
  var cols=qtCols(h),rows=qtRows(h);
  var t='<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Điểm quá trình · '+cols.length+' buổi · '+rows.length+' học sinh</h2>'+
    '<div class="row"><button class="btn" data-act="qtCsv"'+(cols.length?'':' disabled')+'>Tải bảng điểm (.csv)</button><button class="btn" data-act="qtJson">Sao lưu (.json)</button><button class="btn" data-act="qtLoadF">Nạp tệp sao lưu</button>'+
    (S.qtConfirm?'<button class="btn danger" data-act="qtClear2">Xác nhận xóa hết điểm quá trình</button><button class="btn" data-act="qtClear0">Hủy</button>':'<button class="btn danger" data-act="qtClear"'+(cols.length?'':' disabled')+'>Xóa hết</button>')+
    '<button class="btn" data-act="qt">Đóng</button></div></div>'+
    '<div class="kv" style="margin:8px 0">Mỗi buổi tính từ lúc bắt đầu tới khi bấm “Làm lại từ đầu”. Điểm buổi = câu đúng gửi kịp / câu đã chấm × 10; trung bình chỉ tính các buổi em có mặt. '+
    'Bảng được lưu ở trình duyệt này và trên máy chủ; khi máy chủ ngủ (mất dữ liệu), trang giáo viên tự nạp lại. Đổi máy hoặc trình duyệt thì dùng “Sao lưu” rồi “Nạp tệp sao lưu”.</div>';
  if(!cols.length)return t+'<div class="kv">Chưa có buổi nào. Điểm buổi đang làm được ghi khi giáo viên đóng câu đầu tiên.</div></div>';
  t+='<div class="scroll"><table class="m qtt"><thead><tr><th>Học sinh</th>'+cols.map(function(id){var s=h.sess[id],cur=id===S.qtCur;
    var tt=String(s.t||'');if(tt.length>22)tt=tt.slice(0,21)+'…';
    return '<th title="'+esc(s.t)+' · '+s.g+' câu đã chấm">'+qtD(s.d)+'<br><small>'+esc(tt)+'</small>'+(cur?'<br><small>đang làm</small>':'<br><button data-act="qtDel" data-id="'+esc(id)+'" title="Xóa buổi này" style="font-size:12px;color:var(--bad)">✕ xóa</button>')+'</th>';}).join('')+'<th>TB</th></tr></thead><tbody>';
  rows.forEach(function(k){var r=h.sc[k],a=qtAvg(h,k,cols);
    t+='<tr><td>'+esc(r.n)+'</td>'+cols.map(function(id){var x=r.v[id],g=h.sess[id].g;return '<td class="num">'+(x==null||!g?'<span class="kv">—</span>':qtF(x*10/g))+'</td>';}).join('')+'<td class="num"><b>'+(a==null?'—':qtF(a))+'</b></td></tr>';});
  return t+'</tbody></table></div></div>';
}
function qtDown(name,text,type){
  var b=new Blob([text],{type:type}),u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download=name;
  document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u);},1500);
}
function qtPost(body){return api('/api/t/hist',{method:'POST',body:JSON.stringify(body)}).then(function(k){S.qtH=qtMerge(S.qtH,k.hist);qtStore(S.qtH);S.qtCur=k.cur;render();}).catch(fail);}
function qtTeacherCards(r){
  var h='';
  if(S.showQR||!r)h+=qtQrCard();
  if(S.showQT)h+=qtTeacherCard();
  return h;
}
function qtAct(a,d){
  if(a==='qtAll'){S.qtAll=!S.qtAll;render();return true;}
  if(a==='qr'){S.showQR=!S.showQR;render();return true;}
  if(a==='qrBig'){qtBig();return true;}
  if(a==='qrNet'){S.qrI=+d.i;S.qrSvg=qtSvg(S.qrUrls[S.qrI]);render();return true;}
  if(a==='qt'){S.showQT=!S.showQT;if(S.showQT)qtSync();render();return true;}
  if(a==='qtCsv'){
    var h=S.qtH||qtEmpty(),cols=qtCols(h),c=function(s){s=String(s==null?'':s);return /[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    var L2=[['Học sinh'].concat(cols.map(function(id){return qtD(h.sess[id].d)+' '+h.sess[id].t;}),['Số buổi','Trung bình']).map(c).join(',')];
    qtRows(h).forEach(function(k){var r=h.sc[k],n=0;cols.forEach(function(id){if(r.v[id]!=null)n++;});var av=qtAvg(h,k,cols);
      L2.push([r.n].concat(cols.map(function(id){var x=r.v[id];return x==null?'':qtF(x*10/h.sess[id].g);}),[n,av==null?'':qtF(av)]).map(c).join(','));});
    qtDown('diem-qua-trinh.csv','﻿'+L2.join('\r\n'),'text/csv;charset=utf-8');return true;
  }
  if(a==='qtJson'){qtDown('diem-qua-trinh-sao-luu.json',JSON.stringify(S.qtH||qtLoad()),'application/json');return true;}
  if(a==='qtLoadF'){
    var f=document.createElement('input');f.type='file';f.accept='.json,application/json';
    f.onchange=function(){var x=f.files&&f.files[0];if(!x)return;var rd=new FileReader();
      rd.onload=function(){try{var j=JSON.parse(rd.result);if(!j||!j.sess)throw 0;S.qtH=qtMerge(S.qtH||qtLoad(),j);qtStore(S.qtH);qtPost({hist:S.qtH});}catch(e){S.err='Tệp sao lưu không hợp lệ';render();}};rd.readAsText(x);};
    f.click();return true;
  }
  if(a==='qtDel'){
    var s=S.qtH&&S.qtH.sess[d.id];if(!s||!confirm('Xóa điểm buổi '+qtD(s.d)+' ('+s.t+')?'))return true;
    S.qtH.del.push(d.id);S.qtH=qtMerge(S.qtH,null);qtStore(S.qtH);qtPost({del:d.id});return true;
  }
  if(a==='qtClear'){S.qtConfirm=true;render();return true;}
  if(a==='qtClear0'){S.qtConfirm=false;render();return true;}
  if(a==='qtClear2'){S.qtConfirm=false;var h2=S.qtH||qtEmpty();h2.del=h2.del.concat(Object.keys(h2.sess));S.qtH=qtMerge(h2,null);qtStore(S.qtH);qtPost({clear:true});return true;}
  return false;
}
/* ---------- [/QT] ---------- */
