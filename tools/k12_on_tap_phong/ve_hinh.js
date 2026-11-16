// Vẽ các đồ thị của trang Ôn tập K12 Chương II (nd.hinh, vẽ bằng VLHinh trong trang) ra ảnh PNG cho phòng làm bài.
// Chạy: node tools/k12_on_tap_phong/ve_hinh.js <thư mục ra>
// Cần Microsoft Edge. Mở on-tap/k12-chuong2.html ở chế độ ẩn, gọi VLHinh.veSpec(do_thi) rồi vẽ SVG lên canvas (gấp 2 lần).
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const OUT = process.argv[2]; if (!OUT) { console.error('Thiếu thư mục ra'); process.exit(1); }
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9351;
const PAGE = 'file:///' + path.join(__dirname, '..', '..', 'on-tap', 'k12-chuong2.html').replace(/\\/g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-'));
  const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, 'about:blank']);
  await sleep(2500);
  try {
    const t = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent(PAGE), { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const cb = {};
    await new Promise(r => ws.onopen = r); ws.onmessage = e => { const m = JSON.parse(e.data); if (cb[m.id]) cb[m.id](m); };
    const ev = async expr => { const i = ++id; ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } })); const r = await new Promise(r => cb[i] = r); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
    await sleep(3000);
    const res = await ev(`(async function(){
      var nd=JSON.parse(document.getElementById('nd').textContent),out={};
      for(const h of nd.hinh){
        var svg=window.VLHinh.veSpec(h.do_thi);
        if(!/xmlns=/.test(svg))svg=svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
        var W=h.do_thi.W||460,H=h.do_thi.H||300,img=new Image();
        await new Promise(function(ok,er){img.onload=ok;img.onerror=er;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
        var c=document.createElement('canvas');c.width=W*2;c.height=H*2;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
        out[h.id]=c.toDataURL('image/png');
      }
      return out;})()`);
    for (const [k, v] of Object.entries(res)) {
      const f = path.join(OUT, 'th-' + k + '.png'); fs.writeFileSync(f, Buffer.from(v.split(',')[1], 'base64'));
      console.log('Đã vẽ', path.basename(f), fs.statSync(f).size, 'byte');
    }
  } catch (e) { console.log('LỖI', e.message); process.exitCode = 1; }
  edge.kill(); setTimeout(() => process.exit(), 300);
})();
