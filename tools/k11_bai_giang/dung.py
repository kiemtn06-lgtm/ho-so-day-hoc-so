# -*- coding: utf-8 -*-
"""Đưa BÀI GIẢNG khối 11 dạng trình chiếu ảnh (file .pptx mỗi slide là một ảnh, làm bằng NotebookLM) vào hồ sơ.

Chạy:  python -I -X utf8 tools/k11_bai_giang/dung.py
Đọc các file .pptx ghi trong BAI (thư mục K11 của hồ sơ), tạo ra:
  bai-giang/k11-B8/s01.jpg ...     ảnh từng slide (JPEG, giữ nguyên kích thước 1376x768)
  bai-giang/k11-B8.html            trang trình chiếu: phím ← → , tổng quan slide, toàn màn hình, nút "Bài tập cuối bài"
                                   (mở bai-giang/k11-bai-tap.html#B8), công cụ lớp (Gọi tên, Bấm giờ, Chia nhóm, Ghi chú)
Trang mở đúng slide theo địa chỉ  k11-B8.html#B8@5  và báo vị trí slide cho hồ sơ như bài giảng khối 10.
Mô phỏng: file mo_phong/<MA>.js (dùng khung mo_phong/khung.js) đăng kí mô phỏng cho từng slide; slide có mô phỏng hiện nút "Mô phỏng" (phím M).
File .pptx gốc không bị sửa. Thêm bài mới: thêm một mục vào BAI (tên slide dùng cho trang tổng quan và người dùng trình đọc màn hình).
"""
import os, re, io, json, zipfile, subprocess
from PIL import Image, ImageFilter

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
NGUON = os.path.join(REPO, 'K11')
KHOA = '11-2'   # khóa dữ liệu của chương (ghi chú, điểm phát biểu trong công cụ lớp)

BAI = {
    'B8': dict(file='Bài 8 Mô_Tả_Sóng.pptx', ten='Bài 8. Mô tả sóng', slide=[
        'Bài 8: Mô tả sóng', 'Nghịch lí của sóng biển', 'Thí nghiệm tạo sóng mặt nước', 'Từ mặt cắt thực tế đến đồ thị hình sin',
        'Giải mã bản chất: sóng được tạo ra như thế nào?', 'Sự lệch pha trên phương truyền sóng', 'Giải phẫu đồ thị: 4 đại lượng đặc trưng',
        'Nguyên lí môi trường và công thức cốt lõi', 'Tránh bẫy trắc nghiệm: dao động và sự truyền sóng', 'Thực chiến 1: Bài toán con thuyền',
        'Thực chiến 2: Giải phẫu đồ thị dao động kí', 'Thực chiến 3: Trắc nghiệm tốc độ và chu kì', 'Thực chiến 4: Đọc độ lệch pha', 'Tổng kết: Em đã học những gì?']),
    'B9': dict(file='Bài 9 - Sóng_Ngang_và_Sóng_Dọc.pptx', ten='Bài 9. Sóng ngang. Sóng dọc. Sự truyền năng lượng của sóng cơ', slide=[
        'Bài 9: Sóng ngang và sóng dọc', 'Khởi động: Hai loại chuyển động sóng', 'Hoạt động 1: Khảo sát sóng trên dây', 'Định nghĩa: Sóng ngang',
        'Hoạt động 2: Khảo sát sóng trên lò xo', 'Định nghĩa: Sóng dọc', 'Bảng so sánh hai loại sóng', 'Hoạt động 3: Sự truyền năng lượng của sóng cơ',
        'Sóng mang gì đi xa?', 'Hoạt động 4: Mô hình sóng âm', 'Đặc trưng của âm thanh', 'Ngưỡng nghe của tai người',
        'Câu vận dụng: Tính toán bước sóng', 'Ghi nhớ trọng tâm', 'Trắc nghiệm củng cố nhanh']),
}


# Chỉnh trên ảnh slide khi đưa vào hồ sơ (file .pptx gốc không bị sửa). Tọa độ theo ảnh gốc 1376x768.
#   ('xoa', (x0, y0, x1, y1))            xóa một vùng: tô lại bằng nền, nội suy theo chiều dọc từ mép trên xuống mép dưới
#   ('chep', (x0, y0, x1, y1), (dx, dy)) chép một vùng sang vị trí lệch (dx, dy)
SUA_ANH = {
    ('B9', 8): [('xoa', (150, 290, 370, 336)), ('xoa', (580, 290, 800, 336)), ('xoa', (1010, 290, 1240, 336)),   # hàng nhãn trên bị lỗi chữ ("Thờn gian 3")
                ('chep', (165, 548, 355, 592), (-5, -256)), ('chep', (595, 548, 785, 592), (-5, -256)), ('chep', (1030, 548, 1220, 592), (-7, -256))],
}


def sua_anh(im, viec):
    px = im.load()
    for v in viec:
        x0, y0, x1, y1 = v[1]
        if v[0] == 'xoa':     # tô lại bằng nền: mỗi cột nội suy từ mép trên xuống mép dưới của vùng (bóng mờ phía trên nhạt dần)
            for x in range(x0, x1):
                a, b = px[x, y0 - 1], px[x, y1]
                for y in range(y0, y1):
                    t = ((y - y0 + 1) / (y1 - y0 + 1)) ** 0.6
                    px[x, y] = tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3))
            vung = (x0 - 6, y0, x1 + 6, y1)     # làm mịn theo chiều ngang để không còn sọc dọc
            im.paste(im.crop(vung).filter(ImageFilter.BoxBlur(9)).crop((6, 0, x1 - x0 + 6, y1 - y0)), (x0, y0))
            px = im.load()
        else:
            im.paste(im.crop((x0, y0, x1, y1)), (x0 + v[2][0], y0 + v[2][1]))
    return im


def anh_slide(pptx):
    """-> danh sách ảnh (bytes) theo đúng thứ tự trình chiếu"""
    z = zipfile.ZipFile(pptx)
    rel = lambda p: dict(re.findall(r'Id="([^"]+)"[^>]*?Target="([^"]+)"', z.read(p).decode('utf8'))) | \
        {b: a for a, b in re.findall(r'Target="([^"]+)"[^>]*?Id="([^"]+)"', z.read(p).decode('utf8'))}
    pr = rel('ppt/_rels/presentation.xml.rels')
    out = []
    for rid in re.findall(r'<p:sldId [^>]*r:id="([^"]+)"', z.read('ppt/presentation.xml').decode('utf8')):
        s = pr[rid]                                             # slides/slide3.xml
        x = z.read('ppt/' + s).decode('utf8')
        sr = rel('ppt/slides/_rels/' + os.path.basename(s) + '.rels')
        emb = re.findall(r'r:embed="([^"]+)"', x)
        assert len(emb) == 1, '%s: slide không phải dạng một ảnh (%d ảnh)' % (s, len(emb))
        out.append(z.read(os.path.normpath('ppt/slides/' + sr[emb[0]]).replace(os.sep, '/')))
    return out


def cong_cu_lop(ma):
    js = "const c=require(%s)(%s,%s);process.stdout.write(JSON.stringify(c))" % (
        json.dumps(os.path.join(REPO, 'tools', 'cong_cu_lop.js')), json.dumps(ma), json.dumps(KHOA))
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, check=True, encoding='utf8').stdout)


TRANG = r'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TEN__ · Vật lí 11</title>
<script>window.__hsdhHash=location.hash;</script>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0b1220;color:#e5e7eb;font:16px/1.4 "Segoe UI",Roboto,Arial,sans-serif;overflow:hidden}
#san{position:absolute;inset:0 0 52px 0;display:flex;align-items:center;justify-content:center}
#san img{max-width:100%;max-height:100%;width:auto;height:auto;display:block;background:#fff;box-shadow:0 6px 30px #0008;user-select:none;-webkit-user-drag:none}
.vung{position:absolute;top:0;bottom:0;width:18%;border:0;background:transparent;cursor:pointer;padding:0}
#vTruoc{left:0}#vSau{right:0}
.vung:focus-visible{outline:3px solid #60a5fa;outline-offset:-3px}
#thanh{position:absolute;left:0;right:0;bottom:0;height:52px;display:flex;align-items:center;gap:8px;padding:0 12px;background:#111a2e;border-top:1px solid #24304a}
#thanh button{font:600 15px "Segoe UI",sans-serif;color:#e5e7eb;background:#1c2742;border:1px solid #33415f;border-radius:999px;padding:7px 14px;cursor:pointer;min-height:36px;white-space:nowrap}
#thanh button:hover{border-color:#60a5fa}
#thanh button:focus-visible,#luoi button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
#thanh button.c{background:#b91c1c;border-color:#b91c1c;color:#fff}
#thanh button:disabled{opacity:.4;cursor:default}
#vt{min-width:64px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
#td{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aab4c8}
#thuoc{position:absolute;left:0;bottom:52px;height:4px;background:#3b82f6;transition:width .2s}
#luoi{position:absolute;inset:0 0 52px 0;background:#0b1220;overflow:auto;padding:16px;display:none;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;align-content:start}
#luoi.mo{display:grid}
#luoi button{background:#111a2e;border:2px solid #24304a;border-radius:10px;padding:6px;color:#e5e7eb;font:14px "Segoe UI",sans-serif;cursor:pointer;text-align:left}
#luoi button.on{border-color:#3b82f6}
#luoi img{width:100%;height:auto;display:block;border-radius:6px;background:#fff}
#luoi span{display:block;padding:5px 2px 1px}
#btK{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.7);display:none;padding:2vh 2vw}
#btK iframe{width:100%;height:100%;border:0;border-radius:12px;background:#fff}
#btK button{position:absolute;bottom:calc(2vh + 12px);right:calc(2vw + 22px);font:600 16px "Segoe UI",sans-serif;border:0;border-radius:999px;padding:7px 16px;background:#14213d;color:#fff;cursor:pointer;box-shadow:0 2px 10px #0006}
@media (max-width:720px){#td{display:none}#thanh{gap:5px;padding:0 6px}#thanh button{padding:6px 10px;font-size:14px}}
@media print{#thanh,#thuoc,.vung{display:none}#san{inset:0}}
__CSS__
</style>
</head>
<body>
<div id="san"><img id="anh" alt=""><button class="vung" id="vTruoc" aria-label="Slide trước" title="Slide trước"></button><button class="vung" id="vSau" aria-label="Slide sau" title="Slide sau"></button></div>
<div id="luoi" role="list" aria-label="Tất cả slide"></div>
<div id="thuoc"></div>
<div id="thanh">
  <button id="bTruoc" title="Slide trước (phím ←)">◀</button>
  <span id="vt" aria-live="polite"></span>
  <button id="bSau" title="Slide sau (phím → hoặc phím cách)">▶</button>
  <span id="td"></span>
  <button id="bMP" hidden title="Mô phỏng cho slide này (phím M)">🌊 Mô phỏng</button>
  <button id="bLuoi" title="Xem tất cả slide (phím O)">Tất cả slide</button>
  <button id="bBT" class="c" title="Bài tập của bài này, có đáp án (phím B)">Bài tập cuối bài</button>
  <button id="bToan" title="Toàn màn hình (phím F)">⛶ Toàn màn hình</button>
</div>
<div id="btK"><button type="button">Đóng ✕</button></div>
__MP__<script>
var MA=__MA__,TEN=__SLIDE__,THU="k11-"+MA+"/",slides=TEN.map(function(t,i){return {ten:t,src:THU+"s"+(i<9?"0":"")+(i+1)+".jpg"}}),cur=0;
(function(){
  var $=function(i){return document.getElementById(i)},anh=$("anh"),luoi=$("luoi"),btK=$("btK");
  window.go=function(i){
    cur=Math.max(0,Math.min(slides.length-1,i|0));var s=slides[cur];
    anh.src=s.src;anh.alt="Slide "+(cur+1)+": "+s.ten;
    $("vt").textContent=(cur+1)+" / "+slides.length;$("td").textContent=s.ten;
    $("bTruoc").disabled=cur===0;$("bSau").disabled=cur===slides.length-1;
    $("thuoc").style.width=((cur+1)/slides.length*100)+"%";
    if(slides[cur+1]){(new Image()).src=slides[cur+1].src}
    var mp=window.MP&&MP.co(MA,cur);$("bMP").hidden=!mp;if(window.MP&&MP.dangMo())MP.dong();
    try{history.replaceState(null,"","#"+MA+"@"+cur)}catch(e){}
    dongLuoi();
  };
  function dongLuoi(){luoi.classList.remove("mo");$("bLuoi").textContent="Tất cả slide"}
  function moLuoi(){
    if(luoi.classList.contains("mo")){dongLuoi();return}
    if(!luoi.firstChild)slides.forEach(function(s,i){var b=document.createElement("button");b.setAttribute("role","listitem");b.dataset.i=i;
      b.innerHTML='<img loading="lazy" width="1376" height="768" alt="" src="'+s.src+'"><span><b>'+(i+1)+'.</b> '+s.ten+'</span>';luoi.appendChild(b)});
    [].forEach.call(luoi.children,function(b,i){b.classList.toggle("on",i===cur)});
    luoi.classList.add("mo");$("bLuoi").textContent="Đóng tổng quan";
    var on=luoi.children[cur];if(on){on.focus();on.scrollIntoView({block:"center"})}
  }
  function toan(){var d=document;if(d.fullscreenElement)d.exitFullscreen();else if(d.documentElement.requestFullscreen)d.documentElement.requestFullscreen()}
  function moBT(){if(!btK.querySelector("iframe")){var f=document.createElement("iframe");f.title="Bài tập cuối bài";f.src="k11-bai-tap.html#"+MA;btK.appendChild(f)}btK.style.display="block";btK.querySelector("button").focus()}
  function dongBT(){btK.style.display="none";$("bBT").focus()}
  luoi.addEventListener("click",function(e){var b=e.target.closest("button");if(b)go(+b.dataset.i)});
  $("bTruoc").onclick=$("vTruoc").onclick=function(){go(cur-1)};
  $("bSau").onclick=$("vSau").onclick=function(){go(cur+1)};
  $("bLuoi").onclick=moLuoi;$("bToan").onclick=toan;$("bBT").onclick=moBT;$("bMP").onclick=function(){if(window.MP)MP.mo(MA,cur)};btK.querySelector("button").onclick=dongBT;
  document.addEventListener("keydown",function(e){
    if(btK.style.display==="block"){if(e.key==="Escape")dongBT();return}
    var t=e.target.tagName;if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||e.ctrlKey||e.altKey||e.metaKey)return;
    if(document.querySelector(".hl-ov")||(window.MP&&MP.dangMo()))return;
    var k=e.key;
    if(k==="ArrowRight"||k==="PageDown"||(k===" "&&t!=="BUTTON")){go(cur+1);e.preventDefault()}
    else if(k==="ArrowLeft"||k==="PageUp"){go(cur-1);e.preventDefault()}
    else if(k==="Home")go(0);else if(k==="End")go(slides.length-1);
    else if(k==="f"||k==="F")toan();else if(k==="o"||k==="O")moLuoi();else if(k==="b"||k==="B")moBT();
    else if((k==="m"||k==="M")&&window.MP&&MP.co(MA,cur))MP.mo(MA,cur);
    else if(k==="Escape")dongLuoi();
  });
  var x0=null;
  $("san").addEventListener("touchstart",function(e){x0=e.touches[0].clientX},{passive:true});
  $("san").addEventListener("touchend",function(e){if(x0===null)return;var d=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(d)>50)go(cur+(d<0?1:-1))},{passive:true});
  var m=/^#B[0-9]+@([0-9]+)$/.exec(window.__hsdhHash||"");go(m?+m[1]:0);
  setInterval(function(){try{if(parent!==window)parent.postMessage({hsdh:"pos",ma:MA,i:cur,n:slides.length,q:null},"*")}catch(e){}},1000);
})();
</script>
<script>__JS__</script>
</body>
</html>
'''


def main():
    for ma, B in BAI.items():
        f = os.path.join(NGUON, B['file'])
        if not os.path.exists(f):
            print('Bỏ qua', ma, ': không thấy', f); continue
        anh = anh_slide(f)
        assert len(anh) == len(B['slide']), '%s: %d slide nhưng có %d tên slide' % (ma, len(anh), len(B['slide']))
        thu = os.path.join(REPO, 'bai-giang', 'k11-' + ma); os.makedirs(thu, exist_ok=True)
        tong = 0
        for i, b in enumerate(anh, 1):
            im = Image.open(io.BytesIO(b)).convert('RGB')
            if (ma, i) in SUA_ANH: im = sua_anh(im, SUA_ANH[(ma, i)])
            g = os.path.join(thu, 's%02d.jpg' % i); im.save(g, quality=88, optimize=True); tong += os.path.getsize(g)
        cc = cong_cu_lop(ma)
        mp = os.path.join(DIR, 'mo_phong', ma + '.js')     # mô phỏng gắn vào slide (nếu bài có)
        mp = ''.join('<script>%s</script>\n' % open(g, encoding='utf8').read().replace('</script', '<\\/script')
                     for g in (os.path.join(DIR, 'mo_phong', 'khung.js'), mp)) if os.path.exists(mp) else ''
        h = (TRANG.replace('__TEN__', B['ten']).replace('__MA__', json.dumps(ma)).replace('__SLIDE__', json.dumps(B['slide'], ensure_ascii=False))
             .replace('__MP__', mp).replace('__CSS__', cc['css']).replace('__JS__', cc['js'].replace('</script', '<\\/script')))
        open(os.path.join(REPO, 'bai-giang', 'k11-%s.html' % ma), 'w', encoding='utf8').write(h)
        print(ma, B['ten'], '·', len(anh), 'slide ·', round(tong / 1048576, 2), 'MB ảnh')


if __name__ == '__main__':
    main()
