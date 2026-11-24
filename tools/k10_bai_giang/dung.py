# -*- coding: utf-8 -*-
"""Đưa BÀI GIẢNG khối 10 dạng trình chiếu ảnh (file .pptx mỗi slide là một ảnh, làm bằng NotebookLM) vào hồ sơ.

Chạy:  python -I -X utf8 tools/k10_bai_giang/dung.py
Dùng lại khung của tools/k11_bai_giang (trang trình chiếu, công cụ lớp, mô phỏng); chỉ khác: nguồn là thư mục K10,
mã dữ liệu '10-3', ảnh vào bai-giang/k10-B13/s01.jpg ..., trang bai-giang/k10-B13.html, nút "Luyện tập tương tác"
mở trang bài giảng tương tác cũ bai-giang/k10-B13-tuong-tac.html (câu hỏi củng cố có chấm điểm).
Mô phỏng: tools/k10_bai_giang/mo_phong/<MA>.js (dùng khung tools/k11_bai_giang/mo_phong/khung.js).
File .pptx gốc không bị sửa.
"""
import os, sys, io, json, subprocess, importlib.util

DIR = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(DIR, '..', '..'))
K11 = os.path.join(REPO, 'tools', 'k11_bai_giang')
spec = importlib.util.spec_from_file_location('dung11', os.path.join(K11, 'dung.py'))
d11 = importlib.util.module_from_spec(spec); spec.loader.exec_module(d11)
from PIL import Image

NGUON = os.path.join(REPO, 'K10')
d11.KHOA = '10-3'

# Trình tự trình chiếu: ('a', chỉ số slide trong pptx tính từ 0, tên) là slide ẢNH; ('t', chỉ số slide trong trang tương tác cũ k10-B13-tuong-tac.html tính từ 0, tên)
# là hoạt động TƯƠNG TÁC của bài giảng cũ, nhúng vào đúng chỗ. Slide pptx số 7 "Mini-quiz" bị bỏ theo phiếu #7 (Củng cố 1 tương tác thay vào chỗ đó).
# Chỉ số mô phỏng trong mo_phong/B13.js = chỉ số slide pptx (không đổi khi chèn thêm hoạt động).
BAI = {
    'B13': dict(file='Bài 13- Tong_hop_va_Phan_tich_Luc_da_sua.pptx', ten='Bài 13. Tổng hợp và phân tích lực. Cân bằng lực',
                tuong_tac='k10-B13-tuong-tac.html', day=[
        ('a', 0, 'Bài 13: Tổng hợp và phân tích lực. Cân bằng lực'),
        ('t', 1, 'Khởi động: chọn ô số, trả lời nhanh'),
        ('a', 1, 'Tình huống thực tế: thay nhiều lực bằng một lực?'),
        ('t', 2, 'Dự đoán: tàu chở hàng đi hướng nào?'),
        ('t', 4, 'Hoạt động 1: Tổng hợp hai lực cùng phương'),
        ('a', 2, 'Thí nghiệm tổng hợp hai lực đồng quy'),
        ('a', 3, 'Thu thập và xử lí số liệu'),
        ('a', 4, 'Quy tắc hình bình hành'),
        ('t', 5, 'Hoạt động 2: Quy tắc hình bình hành, sắp xếp đúng bước'),
        ('a', 5, 'Tính độ lớn hợp lực'),
        ('a', 6, 'Các trường hợp đặc biệt của hợp lực'),
        ('t', 8, 'Vận dụng: Giải mã tàu chở hàng (SGK tr. 57, câu 2)'),
        ('t', 9, 'Củng cố 1: Tổng hợp lực'),
        ('a', 8, 'Khởi động tiết 2: Bí ẩn mặt phẳng nghiêng'),
        ('a', 9, 'Phân tích lực thành hai thành phần vuông góc'),
        ('a', 10, 'Ứng dụng: giải mã mặt phẳng nghiêng'),
        ('t', 14, 'Ví dụ: Vật trên mặt phẳng nghiêng nhẵn'),
        ('t', 15, 'Củng cố 3: Phân tích lực'),
        ('a', 11, 'Điều kiện cân bằng của chất điểm'),
        ('a', 12, 'Vận dụng trạng thái cân bằng'),
        ('t', 11, 'Hoạt động 3: Lực không cân bằng, phân loại tình huống'),
        ('t', 12, 'Củng cố 2: Cân bằng lực'),
        ('a', 13, 'Luyện tập dạng 1: Trắc nghiệm nhiều lựa chọn'),
        ('a', 14, 'Luyện tập dạng 2: Đúng / Sai'),
        ('a', 15, 'Luyện tập dạng 3: Trả lời ngắn từ đồ thị'),
        ('a', 16, 'Vận dụng thực tế: Bài toán dây phơi'),
        ('t', 18, 'Em có thể'),
        ('t', 16, 'Tổng kết: hệ thống kiến thức'),
        ('t', 17, 'Luyện tập: Bài tập tổng hợp'),
        ('t', 19, 'Vận dụng: Bài tập vận dụng'),
        ('a', 17, 'Phụ lục 1: Phiếu học tập số 1'),
        ('a', 18, 'Phụ lục 2: Đáp án chi tiết luyện tập')]),
    # Bài 16 (24/11/2026): pptx NotebookLM "Bản tổng hợp" (19 slide ảnh) + hoạt động tương tác của trang cũ k10-B16-tuong-tac.html (dựng từ
    # OneDrive/.../bai-16-dinh-luat-3-newton.html, chỉ số slide 0..19). Không đưa (đã có bản ảnh tương đương): Tình huống mở đầu, Lực tương tác giữa hai vật,
    # Định luật 3 Newton, Đặc điểm lực và phản lực, Sách trên bàn, Búa đóng đinh, Ô tô trên mặt đường.
    'B16': dict(file='Bài 16 Định luật 3 Newton - Bản tổng hợp.pptx', ten='Bài 16. Định luật 3 Newton',
                tuong_tac='k10-B16-tuong-tac.html', day=[
        ('a', 0, 'Bài 16: Định luật 3 Newton'),
        ('a', 1, 'Hành trình khám phá: sự đối xứng của vũ trụ'),
        ('t', 1, 'Khởi động: chọn ô số, trả lời nhanh'),
        ('a', 2, 'Khởi động: kéo co bằng lực kế'),
        ('a', 3, 'Thí nghiệm khởi động: nghịch lí của chiếc lực kế'),
        ('t', 3, 'Mô phỏng: hai lực kế móc vào nhau'),
        ('a', 4, 'I.1. Lực tương tác giữa hai vật (Hình 16.1)'),
        ('a', 5, 'Lực không tồn tại riêng lẻ'),
        ('t', 5, 'Mô phỏng: hai xe lăn đẩy nhau bằng lò xo'),
        ('a', 6, 'I.2. Giải mã định luật 3 Newton'),
        ('a', 7, 'Hai lực trực đối là gì?'),
        ('t', 7, 'Củng cố 1: Định luật 3 Newton'),
        ('a', 8, 'II. Các đặc điểm của lực và phản lực'),
        ('a', 9, 'Đặc điểm 1, 2: đồng thời, trực đối'),
        ('a', 10, 'Đặc điểm 3, 4: hai vật khác nhau, cùng bản chất'),
        ('a', 11, 'Ma trận chẩn đoán: đừng nhầm lẫn'),
        ('t', 9, 'Hoạt động: cặp lực – phản lực hay hai lực cân bằng?'),
        ('a', 12, 'Nhận diện lực trong thực tế: sách trên bàn, búa đóng đinh'),
        ('a', 13, 'Vận dụng: tại sao ô tô tiến về phía trước?'),
        ('a', 14, 'Góc thắc mắc: vì sao hai lực không khử nhau?'),
        ('t', 13, 'Củng cố 2: Đặc điểm lực và phản lực'),
        ('a', 15, 'Góc vận dụng: quay đầu trên đường đua xanh'),
        ('a', 16, 'Có thể bạn chưa biết: lực đẩy trong chân không'),
        ('t', 14, 'Ứng dụng: lực và phản lực trong đời sống'),
        ('t', 15, 'Củng cố 3: Ứng dụng định luật 3'),
        ('a', 17, 'Tóm lược cốt lõi'),
        ('t', 17, 'Tổng kết: hệ thống kiến thức'),
        ('t', 16, 'Luyện tập: Bài tập tổng hợp'),
        ('t', 18, 'Em có thể'),
        ('t', 19, 'Vận dụng: Bài tập vận dụng'),
        ('a', 18, 'Em đã học (tổng kết) và mã QR bài tập')]),
}

# Chỉnh trên ảnh slide (cách ghi như tools/k11_bai_giang/dung.py). Tọa độ theo ảnh gốc 1376x768.
# B13: ảnh NotebookLM còn số trang thừa trong bánh răng ở góc dưới phải (40, 41, ..., 47, 50: số của bộ slide dài hơn,
#      không khớp bài này) -> xóa số, giữ bánh răng.
SUA_ANH = {
    ('B13', 9): [('xoa', (1326, 728, 1364, 746))],
    ('B13', 10): [('xoa', (1326, 728, 1364, 746))],
    ('B13', 11): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 12): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 13): [('xoa', (1308, 712, 1372, 746))],
    ('B13', 14): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 15): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 16): [('xoa', (1308, 708, 1348, 738))],
    ('B13', 17): [('xoa', (1308, 708, 1348, 738))],
}

def thay(t, a, b, n=1):
    assert t.count(a) == n, 'Khung trang K11 đã đổi, cập nhật dung.py: ' + a[:70]
    return t.replace(a, b)


TRANG = d11.TRANG.replace('Vật lí 11', 'Vật lí 10').replace('🌊 Mô phỏng', '📐 Mô phỏng')
TRANG = thay(TRANG, 'var MA=__MA__,TEN=__SLIDE__,THU="k11-"+MA+"/",slides=TEN.map(function(t,i){return {ten:t,src:THU+"s"+(i<9?"0":"")+(i+1)+".jpg"}}),cur=0;',
             'var MA=__MA__,TTB=__TT__,DAY=__SLIDE__,THU="k10-"+MA+"/",slides=DAY.map(function(d){return {ten:d.t,src:d.a?THU+"s"+(d.a<10?"0":"")+d.a+".jpg":"",tt:d.tt,mp:d.mp}}),cur=0;')
# nút "Bài tập cuối bài" của K11 không dùng: các hoạt động tương tác đã nằm ngay trong chuỗi slide
TRANG = thay(TRANG, '<button id="bBT" class="c"', '<button id="bBT" class="c" hidden')
TRANG = thay(TRANG, '<img id="anh" alt="">', '<img id="anh" alt=""><iframe id="llFrame" class="ttf" title="Hoạt động tương tác" hidden></iframe>')
TRANG = thay(TRANG, '#btK button{', '.ttf{position:absolute;inset:0;width:100%;height:100%;border:0;background:#0b1220}#san.tt .vung{display:none}'
             '.ttK{aspect-ratio:1376/768;border-radius:6px;background:linear-gradient(135deg,#1e3a8a,#0f172a);display:flex;flex-direction:column;justify-content:center;gap:8px;padding:12px;font-weight:700;color:#e5e7eb}'
             '.ttK b{align-self:flex-start;background:#f59e0b;color:#111827;border-radius:999px;padding:2px 10px;font-size:12px}\n#btK button{')
TRANG = thay(TRANG, 'cur=Math.max(0,Math.min(slides.length-1,i|0));var s=slides[cur];\n    anh.src=s.src;anh.alt="Slide "+(cur+1)+": "+s.ten;',
             'var atras=(i|0)<cur;cur=Math.max(0,Math.min(slides.length-1,i|0));var s=slides[cur];\n    ttHien(s,atras);')
TRANG = thay(TRANG, 'if(slides[cur+1]){(new Image()).src=slides[cur+1].src}', 'if(slides[cur+1]&&slides[cur+1].src){(new Image()).src=slides[cur+1].src}')
TRANG = thay(TRANG, 'MP.co(MA,cur)', 'MP.co(MA,slides[cur].mp)', 2)
TRANG = thay(TRANG, 'MP.mo(MA,cur)', 'MP.mo(MA,slides[cur].mp)', 2)
TRANG = thay(TRANG, 'b.innerHTML=\'<img loading="lazy" width="1376" height="768" alt="" src="\'+s.src+\'"><span>',
             'b.innerHTML=(s.src?\'<img loading="lazy" width="1376" height="768" alt="" src="\'+s.src+\'">\':\'<div class="ttK"><b>Tương tác</b>\'+s.ten+\'</div>\')+\'<span>')
TRANG = thay(TRANG, '$("bSau").onclick=$("vSau").onclick=function(){go(cur+1)};', '$("bSau").onclick=$("vSau").onclick=tiep;')
TRANG = thay(TRANG, '{go(cur+1);e.preventDefault()}', '{tiep();e.preventDefault()}')
TT_JS = r"""
  var ttF=document.querySelector("iframe.ttf");   /* id llFrame: trang con tự ẩn công cụ lớp (trang này đã có) */
  function tiep(){if(!ttBuoc())go(cur+1)}
  function ttBuoc(){          /* trang tương tác cũ hiện từng bước (.step): bấm tiếp thì hiện bước kế trước khi sang slide sau */
    if(ttF.hidden||slides[cur].tt<0)return false;
    try{var w=ttF.contentWindow,h=w.eval('[].slice.call(slides[cur].querySelectorAll(".step")).filter(function(e){return !e.classList.contains("show")})[0]||null');if(h){h.classList.add("show");return true}}catch(e){}
    return false;
  }
  function ttNap(){           /* trang con tải xong: ẩn thanh điều khiển riêng, chuyển phím ← → về trang này */
    var w,d;try{w=ttF.contentWindow;d=w.document;if(!w.go)return}catch(e){return}
    if(!d.getElementById("hsdh-tt")){
      var st=d.createElement("style");st.id="hsdh-tt";st.textContent="#bar,#toc{display:none!important}";d.head.appendChild(st);
      w.addEventListener("keydown",function(e){
        var t=e.target&&e.target.tagName,k=e.key,mui=k==="ArrowRight"||k==="ArrowLeft"||k==="PageDown"||k==="PageUp";
        if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT"){if(mui)e.stopImmediatePropagation();return}
        if(k==="ArrowRight"||k==="PageDown"||(k===" "&&t!=="BUTTON")){e.preventDefault();e.stopImmediatePropagation();tiep()}
        else if(k==="ArrowLeft"||k==="PageUp"){e.preventDefault();e.stopImmediatePropagation();go(cur-1)}
        else if(k==="f"||k==="F"||k==="o"||k==="O"){e.preventDefault();e.stopImmediatePropagation();document.dispatchEvent(new KeyboardEvent("keydown",{key:k}))}
      },true);
    }
    ttF.dataset.ok="1";var s=slides[cur];if(s.tt>=0)w.go(s.tt);
  }
  ttF.addEventListener("load",ttNap);
  function ttHien(s,atras){
    var san=$("san");
    if(s.tt<0){ttF.hidden=true;san.classList.remove("tt");anh.style.display="";anh.src=s.src;anh.alt="Slide "+(cur+1)+": "+s.ten;return}
    anh.style.display="none";ttF.hidden=false;san.classList.add("tt");
    if(ttF.dataset.ok){try{ttF.contentWindow.go(s.tt,atras);ttF.focus();return}catch(e){}}
    if(!ttF.getAttribute("src"))ttF.src=TTB+"#"+MA+"@"+s.tt;
    else if(!ttF.dataset.ok)ttF.src=TTB+"?k="+Date.now()+"#"+MA+"@"+s.tt;
  }
"""
TRANG = thay(TRANG, 'btK=$("btK");', 'btK=$("btK");' + TT_JS)


def main():
    chon = sys.argv[1:]      # ví dụ: dung.py B16  chỉ dựng Bài 16 (không đụng Bài 13)
    for ma, B in BAI.items():
        if chon and ma not in chon: continue
        f = os.path.join(NGUON, B['file'])
        if not os.path.exists(f):
            print('Bỏ qua', ma, ': không thấy', f); continue
        anh = d11.anh_slide(f)
        thu = os.path.join(REPO, 'bai-giang', 'k10-' + ma); os.makedirs(thu, exist_ok=True)
        day, tong, n = [], 0, 0
        for loai, i, ten in B['day']:
            if loai == 'a':
                n += 1
                im = Image.open(io.BytesIO(anh[i])).convert('RGB')
                if (ma, i + 1) in SUA_ANH: im = d11.sua_anh(im, SUA_ANH[(ma, i + 1)])
                g = os.path.join(thu, 's%02d.jpg' % n); im.save(g, quality=88, optimize=True); tong += os.path.getsize(g)
                day.append(dict(t=ten, a=n, tt=-1, mp=i))
            else:
                day.append(dict(t=ten, a=0, tt=i, mp=-1))
        for k in range(n + 1, 40):      # xóa ảnh thừa của lần dựng trước
            g = os.path.join(thu, 's%02d.jpg' % k)
            if os.path.exists(g): os.remove(g)
        cc = d11.cong_cu_lop(ma)
        mp = os.path.join(DIR, 'mo_phong', ma + '.js')
        mp = ''.join('<script>%s</script>\n' % open(g, encoding='utf8').read().replace('</script', '<\\/script')
                     for g in (os.path.join(K11, 'mo_phong', 'khung.js'), mp)) if os.path.exists(mp) else ''
        h = (TRANG.replace('__TEN__', B['ten']).replace('__MA__', json.dumps(ma)).replace('__TT__', json.dumps(B['tuong_tac']))
             .replace('__SLIDE__', json.dumps(day, ensure_ascii=False))
             .replace('__MP__', mp).replace('__CSS__', cc['css']).replace('__JS__', cc['js'].replace('</script', '<\\/script')))
        dich = os.path.join(REPO, 'bai-giang', 'k10-%s.html' % ma)
        open(dich, 'w', encoding='utf8').write(h)
        subprocess.run(['node', os.path.join(REPO, 'tools', 'gan_nut_sua.js'), dich], check=True, stdout=subprocess.DEVNULL)   # nút ✎ Sửa
        print(ma, B['ten'], '·', len(day), 'slide,', n, 'ảnh ·', round(tong / 1048576, 2), 'MB ảnh')


if __name__ == '__main__':
    main()
