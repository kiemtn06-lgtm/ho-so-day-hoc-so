/* Mô phỏng sống động "Hành khách ngồi trên ô tô" (Bài 14, Hoạt động 3).
   Tăng tốc / phanh gấp: nhìn NGANG, xe chạy thật (vạch đường trượt, khói phanh, thân người nghiêng theo quán tính).
   Rẽ trái: nhìn TỪ TRÊN XUỐNG, người trượt sang phải, có vạch "hướng đi cũ". Dựa theo hình tổng kết trong K10/Bài 14. */
module.exports = String.raw`(function(){
  if(typeof K==='undefined'||typeof HOOKS==='undefined')return;
  if(!document.querySelector('#ck'))return;
  var S={mode:0,t:0,v:0,road:0,wheel:0,lean:0,pitch:0,sy:0,head:0,smoke:[],run:false,last:0};
  function belt(){return $('#kbelt').checked}
  function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
  function sideCar(x,cx,gy){
    x.save();x.translate(cx,gy-38);x.rotate(S.pitch);
    x.fillStyle='#2563eb';x.strokeStyle='#1e3a8a';x.lineWidth=3;
    x.beginPath();x.moveTo(-190,0);x.lineTo(-190,-44);x.quadraticCurveTo(-186,-62,-160,-64);x.lineTo(-110,-66);x.lineTo(-70,-118);
    x.lineTo(40,-118);x.lineTo(92,-70);x.lineTo(160,-62);x.quadraticCurveTo(192,-56,194,-26);x.lineTo(194,0);x.closePath();x.fill();x.stroke();
    x.fillStyle='#bfdbfe';x.beginPath();x.moveTo(-96,-70);x.lineTo(-60,-110);x.lineTo(-8,-110);x.lineTo(-8,-70);x.closePath();x.fill();x.stroke();
    x.beginPath();x.moveTo(2,-70);x.lineTo(2,-110);x.lineTo(36,-110);x.lineTo(78,-70);x.closePath();x.fill();x.stroke();
    x.fillStyle='#fde68a';x.beginPath();x.ellipse(184,-34,10,7,0,0,7);x.fill();
    x.fillStyle='#ef4444';x.fillRect(-192,-40,6,16);
    x.fillStyle='#1e293b';rr(x,-62,-72,22,70,5);x.fill();rr(x,-62,-12,92,14,4);x.fill();
    var hx=-18,hy=-18,a=S.lean,L=64;
    var sx=hx+Math.sin(a)*L,sy=hy-Math.cos(a)*L;
    x.lineCap='round';x.strokeStyle='#f59e0b';x.lineWidth=15;
    x.beginPath();x.moveTo(hx,hy);x.lineTo(hx+52,hy);x.lineTo(hx+66,hy+40);x.stroke();
    x.beginPath();x.moveTo(hx,hy);x.lineTo(sx,sy);x.stroke();
    x.lineWidth=9;x.beginPath();x.moveTo(sx,sy+8);x.lineTo(sx+Math.cos(a)*30+8,sy+30+Math.sin(a)*14);x.stroke();
    x.fillStyle='#fcd9a8';x.strokeStyle='#92400e';x.lineWidth=2;x.beginPath();x.arc(sx+Math.sin(a)*20,sy-Math.cos(a)*20,17,0,7);x.fill();x.stroke();
    x.fillStyle='#111';x.beginPath();x.arc(sx+Math.sin(a)*20+7,sy-Math.cos(a)*20-2,2.5,0,7);x.fill();
    if(belt()){x.strokeStyle='#16a34a';x.lineWidth=6;x.beginPath();x.moveTo(sx-6,sy-2);x.lineTo(hx+18,hy+2);x.stroke()}
    x.restore();
    [[-112,0],[112,0]].forEach(function(w){var wx=cx+w[0],wy=gy-24;x.fillStyle='#1f2937';x.beginPath();x.arc(wx,wy,27,0,7);x.fill();
      x.fillStyle='#cbd5e1';x.beginPath();x.arc(wx,wy,14,0,7);x.fill();x.strokeStyle='#64748b';x.lineWidth=3;
      for(var k=0;k<3;k++){var q=S.wheel+k*Math.PI/3;x.beginPath();x.moveTo(wx-Math.cos(q)*14,wy-Math.sin(q)*14);x.lineTo(wx+Math.cos(q)*14,wy+Math.sin(q)*14);x.stroke()}});
  }
  function drawSide(x,W,H){
    var gy=H-62,cx=W/2;
    x.fillStyle='#e0f2fe';x.fillRect(0,0,W,gy);x.fillStyle='#bfe3fb';
    [[120,70,60],[560,50,80],[790,95,50]].forEach(function(c){var px=((c[0]-S.road*0.15)%(W+160)+W+160)%(W+160)-80;x.beginPath();x.ellipse(px,c[1],c[2],16,0,0,7);x.fill()});
    x.fillStyle='#475569';x.fillRect(0,gy,W,H-gy);x.fillStyle='#fff';
    for(var i=-1;i<12;i++){var lx=((i*90-S.road)%990+990)%990-90;x.fillRect(lx,gy+34,50,6)}
    x.fillStyle='#94a3b8';x.fillRect(0,gy-3,W,6);
    var sp=Math.abs(S.v);if(sp>60){x.strokeStyle='rgba(30,64,175,'+Math.min(.55,sp/600)+')';x.lineWidth=4;x.lineCap='round';
      for(var j=0;j<6;j++){var yy=gy-30-j*20,ln=40+sp*.25,ph=((S.road*1.4+j*77)%260);x.beginPath();x.moveTo(cx-215-ph,yy);x.lineTo(cx-215-ph-ln,yy);x.stroke()}}
    S.smoke.forEach(function(s){x.fillStyle='rgba(100,116,139,'+(s.a*.55)+')';x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill()});
    sideCar(x,cx,gy);
    if(S.mode==1&&S.t<2.0)arrow(x,cx-60,gy-215,cx+90,gy-215,'#dc2626','a của xe',5);
    if(S.mode==2&&S.t>1.0&&S.t<2.6)arrow(x,cx+60,gy-215,cx-90,gy-215,'#dc2626','a của xe',5);
  }
  function drawTop(x,W,H){
    var cx=W/2,cy=H/2+10,h=S.head;
    x.fillStyle='#bbf7d0';x.fillRect(0,0,W,H);x.fillStyle='#64748b';x.fillRect(0,cy-125,W,250);
    x.fillStyle='#fff';for(var i=-1;i<12;i++){var lx=((i*90-S.road)%990+990)%990-90;x.fillRect(lx,cy-3,50,6)}
    x.strokeStyle='#f59e0b';x.lineWidth=4;x.setLineDash([10,9]);x.beginPath();x.moveTo(cx,cy);x.lineTo(W-30,cy);x.stroke();x.setLineDash([]);
    x.fillStyle='#b45309';x.font='bold 22px Segoe UI';x.fillText('hướng đi cũ',W-190,cy-30);x.fillText('(quán tính)',W-190,cy-8);
    x.save();x.translate(cx,cy);x.rotate(h);
    x.fillStyle='#2563eb';x.strokeStyle='#1e3a8a';x.lineWidth=3;rr(x,-190,-80,380,160,34);x.fill();x.stroke();
    x.fillStyle='#bfdbfe';x.fillRect(100,-66,44,132);x.fillRect(-150,-66,26,132);
    x.fillStyle='#fde68a';x.fillRect(186,-62,8,24);x.fillRect(186,38,8,24);
    [[-120,-86],[120,-86],[-120,86],[120,86]].forEach(function(w){x.fillStyle='#1f2937';x.fillRect(w[0]-30,w[1]-9,60,18)});
    var px=-20,py=S.sy;x.fillStyle='#f59e0b';x.beginPath();x.ellipse(px,py,16,34,0,0,7);x.fill();x.strokeStyle='#92400e';x.stroke();
    x.fillStyle='#fcd9a8';x.beginPath();x.arc(px+4,py,15,0,7);x.fill();x.stroke();
    if(belt()){x.strokeStyle='#16a34a';x.lineWidth=6;x.beginPath();x.moveTo(px-18,py-30);x.lineTo(px+18,py+30);x.stroke()}
    x.restore();
    if(S.mode==3&&S.t<3.2)arrow(x,cx-150,cy-100,cx-150,cy-180,'#dc2626','a (vào tâm cong)',5);
  }
  function draw(){
    var c=$('#ck'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);
    if(S.mode==3)drawTop(x,W,H);else drawSide(x,W,H);
    var T={0:'Chọn một tình huống ở dưới – xe đang đỗ',1:'Xe tăng tốc → người ngả về phía SAU (quán tính)',2:'Xe phanh → người chúi về phía TRƯỚC (quán tính)',3:'Xe rẽ trái → người nghiêng sang bên PHẢI (nhìn từ trên xuống)'}[S.mode];
    if(S.mode==1&&S.t>2.0)T='Xe chạy đều → hợp lực = 0, người ngồi thẳng trở lại';
    if(S.mode==2&&S.t<1.0)T='Xe chạy đều → người ngồi thẳng';
    if(S.mode==2&&S.t>2.6)T='Xe đã dừng → người trở lại tư thế ngồi';
    if(belt()&&((S.mode==1&&S.t<2)||(S.mode==2&&S.t>1&&S.t<2.6)||(S.mode==3&&S.t<3.2)))T='Có dây an toàn: lực của dây giữ người gắn với ghế';
    x.fillStyle='#14213d';x.font='bold 26px Segoe UI';x.fillText(T,20,32);
  }
  function step(dt){
    var m=S.mode,b=belt(),k=b?.12:1,tl=0,tp=0,tv=S.v;S.t+=dt;
    if(m==1){if(S.t<2.0){tv=Math.min(900,S.v+450*dt);tl=-0.62;tp=-0.03}else if(S.t>=4.5){tv=Math.max(0,S.v-200*dt)}}
    else if(m==2){if(S.t<1.0){tv=700}else if(S.t<2.6){tv=Math.max(0,S.v-440*dt);tl=0.7;tp=0.035}else{tv=0}}
    else if(m==3){tv=S.t<4.5?400:0;var tt=S.t<3.2;S.head+=((tt?-0.38:0)-S.head)*Math.min(1,dt*2.2);
      var ty=(tt&&!b)?62:0;S.sy+=(ty-S.sy)*Math.min(1,dt*3.2)}
    S.v=tv;S.lean+=(tl*k-S.lean)*Math.min(1,dt*7);S.pitch+=(tp-S.pitch)*Math.min(1,dt*6);
    if(m!=3){S.sy*=.9;S.head*=.9}
    S.road+=S.v*dt;S.wheel+=S.v*dt/27;
    if(m==2&&S.t>1.0&&S.t<2.6&&S.v>20){var gy=$('#ck').height-62;for(var i=0;i<2;i++)S.smoke.push({x:$('#ck').width/2-112+(Math.random()*20-10),y:gy-10-Math.random()*10,r:6,a:.9,vx:-60-Math.random()*60,vy:-20-Math.random()*20})}
    S.smoke.forEach(function(s){s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=18*dt;s.a-=dt*.8});S.smoke=S.smoke.filter(function(s){return s.a>0});
  }
  function busy(){var m=S.mode;return (m==1&&S.t<5)||(m==2&&S.t<4.5)||(m==3&&S.t<4.5)||Math.abs(S.v)>1||Math.abs(S.lean)>.01||S.smoke.length>0}
  function loop(ts){var dt=Math.min(.05,(ts-S.last)/1000||.016);S.last=ts;step(dt);draw();if(busy())requestAnimationFrame(loop);else S.run=false}
  function go(){if(!S.run){S.run=true;S.last=performance.now();requestAnimationFrame(loop)}}
  window.car=function(m){S.mode=m;S.t=0;S.v=(m==2?700:m==3?400:0);S.sy=0;S.head=0;go()};
  $('#kbelt').onchange=function(){go();draw()};
  HOOKS['Quán tính trên xe']=function(){S.mode=0;S.t=0;S.v=0;S.lean=0;S.pitch=0;S.sy=0;S.head=0;S.smoke=[];S.run=false;draw()};
  var h2=document.querySelector('#ck').closest('.slide').querySelector('h2');if(h2)h2.lastChild.textContent=' Hành khách ngồi trên ô tô';
  draw();
})();`;
