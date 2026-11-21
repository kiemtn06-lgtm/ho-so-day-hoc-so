/* Tạo biểu tượng ứng dụng (PNG) cho PWA: node tools/tao_icon.js  → icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
function crc(buf){let c,t=crc.t||(crc.t=Array.from({length:256},(_,n)=>{c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0}));let x=~0;for(const b of buf)x=t[(x^b)&255]^(x>>>8);return(~x)>>>0}
function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])}
function png(w,px){const raw=Buffer.alloc((w*4+1)*w);for(let y=0;y<w;y++){raw[y*(w*4+1)]=0;px.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4)}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(w,4);ih[8]=8;ih[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))])}
/* vẽ nguyên tử: nền xanh, hạt nhân trắng, 3 quỹ đạo elip; kích thước 4x để khử răng cưa */
function ve(size, full, safe){
  const S=size*3, px=Buffer.alloc(size*size*4), r=size/2, ac=[24,95,165], bg2=[11,60,110];
  const rot=[0,Math.PI/3,2*Math.PI/3];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let sa=0,sr=0,sg=0,sb=0;
    for(let j=0;j<3;j++)for(let i=0;i<3;i++){
      const u=(x+(i+.5)/3-r)/r, v=(y+(j+.5)/3-r)/r; // -1..1
      let inside=full; 
      if(!full){const rr=.22, ax=Math.max(Math.abs(u)-(1-rr),0), ay=Math.max(Math.abs(v)-(1-rr),0); inside=Math.hypot(ax,ay)<=rr}
      if(!inside)continue;
      const t=(u+v+2)/4; let c=[ac[0]+(bg2[0]-ac[0])*t,ac[1]+(bg2[1]-ac[1])*t,ac[2]+(bg2[2]-ac[2])*t];
      const k=safe; const p=u/k,q=v/k; let white=0;
      if(Math.hypot(p,q)<.2)white=1;
      for(const a of rot){const c0=Math.cos(a),s0=Math.sin(a),X=p*c0+q*s0,Y=-p*s0+q*c0;const d=Math.abs(Math.hypot(X/.95,Y/.36)-1);if(d<.075)white=1;
        const th=Math.atan2(Y/.36,X/.95);}
      if(Math.hypot(p-.62*Math.cos(0.4),q-.62*Math.sin(0.4)*0)<0)white=1;
      if(white)c=[255,255,255];
      sr+=c[0];sg+=c[1];sb+=c[2];sa++;
    }
    const o=(y*size+x)*4; if(sa){px[o]=sr/sa;px[o+1]=sg/sa;px[o+2]=sb/sa;px[o+3]=Math.round(255*sa/9)}
  }
  return png(size,px);
}
const dir=path.join(__dirname,'..','icons');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'icon-192.png'),ve(192,false,.9));
fs.writeFileSync(path.join(dir,'icon-512.png'),ve(512,false,.9));
fs.writeFileSync(path.join(dir,'maskable-512.png'),ve(512,true,.7));   // vùng an toàn 80% cho biểu tượng cắt tròn
fs.writeFileSync(path.join(dir,'apple-touch-icon.png'),ve(180,true,.8)); // iOS tự bo góc
console.log('Đã tạo icons/');
