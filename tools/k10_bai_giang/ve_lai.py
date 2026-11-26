# -*- coding: utf-8 -*-
"""Sửa LỖI KIẾN THỨC trên ảnh slide NotebookLM của K10 Bài 16, 17 (rà ngày 26/11/2026). dung.py nạp SUA_THEM và chạy sau SUA_ANH.

Mỗi hàm nhận ảnh gốc 1376x768 và trả về ảnh đã sửa. Chỉ xuất lại vài ảnh, không đụng trang HTML:
    python -I -X utf8 tools/k10_bai_giang/ve_lai.py                  (mọi slide có trong SUA_THEM)
    python -I -X utf8 tools/k10_bai_giang/ve_lai.py B16:14           (một slide; số = số ảnh s##.jpg = số slide pptx)
    python -I -X utf8 tools/k10_bai_giang/ve_lai.py --thu <thư mục>  (xuất ra nơi khác để xem thử)
"""
import os, sys, io, math, importlib.util
import numpy as np
import cv2
from PIL import Image, ImageDraw

DIR = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('ve_lai_k11', os.path.join(DIR, '..', 'k11_bai_giang', 've_lai.py'))
V = importlib.util.module_from_spec(_s); _s.loader.exec_module(V)
xoa, chu, Ve, phong, co_vua = V.xoa, V.chu, V.Ve, V.phong, V.co_vua

DEN, TRANG = (18, 20, 26), (255, 255, 255)
DO, CAM, XANH, XDUONG, NAVY = (222, 30, 36), (246, 122, 28), (0, 168, 232), (10, 36, 235), (14, 34, 80)
QR_LINK = 'https://kiemtn06-lgtm.github.io/ho-so-day-hoc-so/bai-giang/k10-B16-tuong-tac.html'


# ----------------------------------------------------------------------- dụng cụ dùng chung
def mui_ten(v, a, b, mau, w=11, dai=30, nua=15, vien=None):
    """mũi tên MỘT đầu từ a đến b"""
    L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
    goc = (b[0] - ux * dai * 0.8, b[1] - uy * dai * 0.8)
    if vien:
        v.duong([a, goc], vien, w + 3)
    v.duong([a, goc], mau, w)
    v.mui(a, b, mau, dai, nua, vien)


def cham(v, c, r, mau):
    v.d.ellipse([*v.p(c[0] - r, c[1] - r), *v.p(c[0] + r, c[1] + r)], fill=mau)


def vecto(im, x, y, ten, so, co, mau, neo='ls', vien=None, duoi=0.66):
    """kí hiệu lực có mũi tên vectơ phía trên và chỉ số dưới; (x, y) là đường chân chữ. Trả về bề rộng."""
    f, g = phong('dam', co), phong('dam', co * duoi)
    a = f.getlength(ten); b = g.getlength(so) if so else 0
    if neo == 'ms': x -= (a + b) / 2
    elif neo == 'rs': x -= a + b
    d = ImageDraw.Draw(im)
    them = dict(stroke_width=3, stroke_fill=vien) if vien else {}
    d.text((x, y), ten, font=f, fill=mau, anchor='ls', **them)
    if so:
        d.text((x + a + 1, y + co * 0.16), so, font=g, fill=mau, anchor='ls', **them)
    top = y + f.getbbox(ten, anchor='ls')[1] - co * 0.24
    v = Ve(im, (int(x) - 6, int(top) - int(co * 0.3), int(x + a) + 12, int(top) + int(co * 0.3)))
    w = max(2.0, co * 0.08)
    if vien:
        mui_ten(v, (x, top), (x + a + 5, top), vien, w + 4, co * 0.34 + 4, co * 0.17 + 3)
    mui_ten(v, (x + 1, top), (x + a + 3, top), mau, w, co * 0.34, co * 0.17)
    v.xong()
    return a + b


def lap(im, hop=None, mat_na=None, no=5, bk=5):
    """lấp (inpaint) các điểm ảnh trong mặt nạ (mảng bool cùng cỡ ảnh) bằng vùng xung quanh"""
    a = np.array(im)
    m = mat_na.astype(np.uint8) * 255
    if no > 1:
        m = cv2.dilate(m, np.ones((no, no), np.uint8))
    im.paste(Image.fromarray(cv2.inpaint(a, m, bk, cv2.INPAINT_TELEA)))
    return im


def lap_huong(im, mat_na, huong, muot=True):
    """lấp từng điểm trong mặt nạ bằng nội suy dọc theo hướng cho trước (dx, dy): giữ được các vệt chạy theo hướng đó"""
    a = np.array(im).astype(float); g = a.copy()
    H, W = mat_na.shape
    L = math.hypot(*huong); ux, uy = huong[0] / L, huong[1] / L
    for y, x in zip(*np.nonzero(mat_na)):
        hai = []
        for d in (1, -1):
            for s in range(1, 400):
                X, Y = int(round(x + d * ux * s)), int(round(y + d * uy * s))
                if not (0 <= X < W and 0 <= Y < H):
                    break
                if not mat_na[Y, X]:
                    X2, Y2 = min(W - 1, max(0, int(round(X + d * ux * 2)))), min(H - 1, max(0, int(round(Y + d * uy * 2))))
                    hai.append(((g[Y, X] + (g[Y2, X2] if not mat_na[Y2, X2] else g[Y, X])) / 2, s))
                    break
        if len(hai) == 2:
            (c1, s1), (c2, s2) = hai
            a[y, x] = (c1 * s2 + c2 * s1) / (s1 + s2)
        elif hai:
            a[y, x] = hai[0][0]
    ra = a.clip(0, 255).astype(np.uint8)
    if muot:
        lam = cv2.medianBlur(ra, 3); ra[mat_na] = lam[mat_na]
    im.paste(Image.fromarray(ra))
    return im


def lap_guong(im, mat_na, gat=3.0):
    """lấp theo cột bằng cách soi gương phần ảnh ngay trên và ngay dưới (giữ vân ảnh chụp, không bị nhòe)"""
    a = np.array(im).astype(float); g = a.copy()
    H = mat_na.shape[0]
    for x in np.nonzero(mat_na.any(0))[0]:
        cot = mat_na[:, x]; y = 0
        while y < H:
            if not cot[y]:
                y += 1; continue
            e = y
            while e < H and cot[e]:
                e += 1
            n = e - y
            for k in range(n):
                tren, duoi = y - 1 - k, e + (n - 1 - k)
                while tren >= 0 and cot[tren]:
                    tren -= 1
                while duoi < H and cot[duoi]:
                    duoi += 1
                w = min(1, max(0, ((k + 0.5) / n - 0.5) * gat + 0.5))
                a[y + k, x] = g[max(0, tren), x] * (1 - w) + g[min(H - 1, duoi), x] * w
            y = e
    ra = a.clip(0, 255).astype(np.uint8)
    lam = cv2.GaussianBlur(ra, (3, 1), 0.8); ra[mat_na] = lam[mat_na]
    im.paste(Image.fromarray(ra))
    return im


def lap_manh(im, mat_na, co=9, ban_kinh=70):
    """lấp vùng mặt nạ bằng các mảng nhỏ chép từ vùng ảnh nguyên vẹn xung quanh (giữ được vân ảnh, không bị nhòe)"""
    a = np.array(im).astype(np.float32)
    H, W = mat_na.shape
    can = mat_na.copy()
    h = co // 2
    tin = (~can).astype(np.float32)
    goc_nguon = ~cv2.dilate(mat_na.astype(np.uint8), np.ones((co, co), np.uint8)).astype(bool)   # tâm mảng nguồn không chạm vùng xóa
    k3 = np.ones((3, 3), np.uint8)
    while can.any():
        bien = can & cv2.dilate((~can).astype(np.uint8), k3).astype(bool)
        uu = cv2.blur(tin, (co, co))
        xam = cv2.cvtColor(a.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
        gx, gy = cv2.Sobel(xam, cv2.CV_32F, 1, 0), cv2.Sobel(xam, cv2.CV_32F, 0, 1)
        manh_canh = cv2.boxFilter(np.where(can, 0, np.hypot(gx, gy)), -1, (co, co))
        diem = np.where(bien, uu * (0.35 + manh_canh / (manh_canh.max() + 1e-6)), -1)
        y, x = divmod(int(diem.argmax()), W)
        y, x = min(H - h - 1, max(h, y)), min(W - h - 1, max(h, x))
        dich = a[y - h:y + h + 1, x - h:x + h + 1]
        biet = (~can[y - h:y + h + 1, x - h:x + h + 1]).astype(np.float32)
        y0, y1, x0, x1 = max(0, y - ban_kinh), min(H, y + ban_kinh + 1), max(0, x - ban_kinh), min(W, x + ban_kinh + 1)
        vung = a[y0:y1, x0:x1]
        kq = cv2.matchTemplate(vung, dich, cv2.TM_SQDIFF, mask=np.dstack([biet] * 3))
        kq = np.nan_to_num(kq, nan=1e18, posinf=1e18)
        hop_le = goc_nguon[y0 + h:y1 - h, x0 + h:x1 - h]
        yy, xx = np.mgrid[0:kq.shape[0], 0:kq.shape[1]]
        xa = np.hypot(yy + y0 + h - y, xx + x0 + h - x)
        kq = np.where(hop_le, kq * (1 + xa / (ban_kinh * 3)) + xa, 1e19)
        j, i = divmod(int(kq.argmin()), kq.shape[1])
        nguon = vung[j:j + co, i:i + co]
        thieu = can[y - h:y + h + 1, x - h:x + h + 1].copy()
        dich[thieu] = nguon[thieu]
        tin[y - h:y + h + 1, x - h:x + h + 1][thieu] = uu[y, x] * 0.98
        can[y - h:y + h + 1, x - h:x + h + 1] = False
    ra = a.clip(0, 255).astype(np.uint8)
    muot = cv2.GaussianBlur(ra, (3, 3), 0.6)
    ra[mat_na] = muot[mat_na]
    im.paste(Image.fromarray(ra))
    return im


def no_mn(m, k):
    return cv2.dilate(m.astype(np.uint8), np.ones((k, k), np.uint8)).astype(bool)


def to_mat_phang(im, vung, mau_sach, nhieu=2.2, hat=1):
    """tô vùng (mặt nạ) bằng màu nền biến thiên bậc hai khớp theo các điểm ảnh sạch (mặt nạ mau_sach), thêm hạt nhỏ"""
    a = np.array(im).astype(float)
    ys, xs = np.nonzero(mau_sach)
    cot = lambda x, y: np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], 1)
    X = cot(xs / 1000.0, ys / 1000.0)
    vy, vx = np.nonzero(vung)
    Xv = cot(vx / 1000.0, vy / 1000.0)
    r = np.random.RandomState(hat)
    hs = cv2.GaussianBlur(r.normal(0, 1, vung.shape).astype(np.float32), (3, 3), 0.7)
    hs /= hs.std()
    for k in range(3):
        c = np.linalg.lstsq(X, a[ys, xs, k], rcond=None)[0]
        a[vy, vx, k] = Xv @ c + hs[vy, vx] * nhieu
    mem = np.clip(cv2.GaussianBlur(vung.astype(np.float32), (7, 7), 2) * 1.5, 0, 1)[..., None]
    goc = np.array(im).astype(float)
    rong = cv2.dilate(vung.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~vung
    ry, rx = np.nonzero(rong)
    Xr = cot(rx / 1000.0, ry / 1000.0)
    for k in range(3):
        c = np.linalg.lstsq(X, goc[ys, xs, k], rcond=None)[0]
        a[ry, rx, k] = Xr @ c + hs[ry, rx] * nhieu
    im.paste(Image.fromarray((goc * (1 - mem) + a * mem).clip(0, 255).astype(np.uint8)))
    return im


def mn_net(im, cac_net, cac_da_giac=()):
    """mặt nạ: các đoạn thẳng dày [(a, b, độ dày)] và đa giác"""
    m = np.zeros((im.height, im.width), np.uint8)
    for a, b, w in cac_net:
        cv2.line(m, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 1, int(w))
    for dg in cac_da_giac:
        cv2.fillPoly(m, [np.array(dg, np.int32)], 1)
    return m.astype(bool)


def mn_mau(im, hop, dk):
    """mặt nạ theo màu trong vùng hop; dk(h, s, v) -> mảng bool (hệ HSV của OpenCV)"""
    hsv = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2HSV).astype(int)
    m = np.zeros(hsv.shape[:2], bool)
    x0, y0, x1, y1 = hop
    s = hsv[y0:y1, x0:x1]
    m[y0:y1, x0:x1] = dk(s[..., 0], s[..., 1], s[..., 2])
    return m


def nen_ngang(im, hop):
    """tô lại vùng nền chuyển màu nhẹ: mỗi hàng nội suy giữa mép trái và mép phải"""
    a = np.array(im).astype(float)
    x0, y0, x1, y1 = hop
    t = np.linspace(0, 1, x1 - x0)[None, :, None]
    a[y0:y1, x0:x1] = a[y0:y1, x0 - 3:x0].mean(1)[:, None, :] * (1 - t) + a[y0:y1, x1:x1 + 3].mean(1)[:, None, :] * t
    im.paste(Image.fromarray(a.clip(0, 255).astype(np.uint8)))


def cac_dong(im, x, y, dong, co, cach, kieu='thuong', mau=DEN, neo='ls', rong=None):
    for i, s in enumerate(dong):
        chu(im, (x, y + i * cach), s, co, kieu, mau, neo, rong)


# ======================================================================= BÀI 16
def b16_s4(im):
    """ô trái: hai lực kế rời nhau, một cái không treo gì mà chỉ 5 N → vẽ hai lực kế móc vào nhau, kéo theo phương thẳng đứng
    (ghép từ nửa trái hình ở ô giữa và bản đối xứng của nó rồi quay 90°)"""
    nua = im.crop((522, 435, 689, 484))
    r, c = nua.width, nua.height
    ghep = Image.new('RGB', (2 * r - 3, c), TRANG)
    ghep.paste(nua, (0, 0)); ghep.paste(nua.transpose(Image.FLIP_LEFT_RIGHT), (r - 3, 0))
    dung_ = ghep.rotate(-90, expand=True)
    dung_ = dung_.resize((round(dung_.width * 250 / dung_.height), 250), Image.LANCZOS)
    xoa(im, (92, 322, 458, 580), TRANG)
    x = 236
    im.paste(dung_, (x, 325))
    for y in (400, 520):
        chu(im, (x + dung_.width + 18, y), '5N', 29, 'dam', DEN)
    return im


def _nam_cham(v, tam, goc, trai, phai):
    """một thanh nghiêng (góc goc độ so với phương đứng), nửa trên màu trai, nửa dưới màu phai"""
    u = (math.sin(math.radians(goc)), math.cos(math.radians(goc)))
    n = (u[1] * 17, -u[0] * 17)
    P = lambda t, s: (tam[0] + u[0] * t + n[0] * s, tam[1] + u[1] * t + n[1] * s)
    for t0, t1, mau in ((-63, 0, trai), (0, 63, phai)):
        v.da_giac([P(t0, -1), P(t0, 1), P(t1, 1), P(t1, -1)], mau)
    canh = (7, -6)
    Q = lambda p: (p[0] + canh[0], p[1] + canh[1])
    v.da_giac([P(-63, 1), Q(P(-63, 1)), Q(P(63, 1)), P(63, 1)], tuple(int(c * 0.72) for c in phai), (45, 48, 55), 1.3)
    v.da_giac([P(-63, -1), Q(P(-63, -1)), Q(P(-63, 1)), P(-63, 1)], tuple(min(255, int(c * 1.15)) for c in trai), (45, 48, 55), 1.3)
    v.da_giac([P(-63, -1), P(-63, 1), P(63, 1), P(63, -1)], None, (45, 48, 55), 1.5)
    return P(-63, 0)


def b16_s5(im):
    """hai lực nam châm – sắt vẽ mũi tên HAI đầu → mỗi vật một mũi tên một đầu, hướng về phía vật kia"""
    nen_ngang(im, (640, 134, 1322, 497))
    v = Ve(im, (640, 134, 1322, 497))
    v.da_giac([(772, 142), (1178, 142), (1178, 161), (772, 161)], (214, 218, 224))
    v.duong([(772, 161), (1178, 161)], (45, 48, 55), 2)
    C1, C2 = (882, 398), (1068, 398)
    for pivot, tam, goc, mau in (((806, 174), C1, 19, ((82, 86, 94), (212, 216, 222))), ((1144, 174), C2, -19, ((150, 156, 166), (178, 184, 193)))):
        u = (math.sin(math.radians(goc)), math.cos(math.radians(goc)))
        dau = (tam[0] - u[0] * 63, tam[1] - u[1] * 63)
        v.duong([pivot, dau], (40, 42, 48), 1.8)
        cham(v, pivot, 10, (110, 115, 125)); cham(v, pivot, 7, (196, 200, 208))
        _nam_cham(v, tam, goc, *mau)
    for tam, huong, mau in ((C1, 1, (232, 12, 20)), (C2, -1, (12, 16, 214))):
        mui_ten(v, tam, (tam[0] + huong * 74, tam[1]), mau, 9, 26, 13)
        cham(v, tam, 6.5, mau)
    v.xong()
    vecto(im, 846, 378, 'F', 'sắt→nam châm', 36, (196, 8, 16), 'rs', duoi=0.74)
    vecto(im, 1106, 378, 'F', 'nam châm→sắt', 36, (10, 14, 184), duoi=0.74)
    return im


def b16_s6(im):
    """chữ rác 'tò lò xo' → 'lò xo'"""
    xoa(im, (282, 480, 668, 546), im.getpixel((672, 546)))
    cac_dong(im, 287, 504, ('Đốt hoặc cắt đứt sợi dây giữ', 'lò xo giữa hai xe.'), co_vua('thuong', 'Đốt hoặc cắt đứt sợi dây giữ', 358), 34)
    return im


def b16_s8(im):
    """định nghĩa hai lực trực đối không gồm 'đặt lên hai vật khác nhau' (khớp slide 19) → tách thành lưu ý riêng cho cặp lực – phản lực"""
    xoa(im, (790, 531, 1345, 652), TRANG)
    ImageDraw.Draw(im).rounded_rectangle((800, 538, 1338, 646), radius=14, fill=(255, 244, 120))
    chu(im, (1069, 580), 'Lưu ý: cặp lực – phản lực còn đặt', 31, 'thuong', DEN, 'ms', 512)
    V.doan(im, 1069, 624, [('lên ', 'thuong', DEN), ('HAI VẬT', 'dam', DEN), (' khác nhau.', 'thuong', DEN)], 31, 'ms')
    return im


def b16_s12(im):
    """dấu ✗ ở 'hai lực cân bằng' và ✓ ở 'lực – phản lực' dễ làm học sinh tưởng một bên sai → bỏ hai dấu, canh chữ vào giữa ô"""
    for x0, x1, tren, duoi in ((300, 786, 508, 600), (808, 1306, 508, 570)):
        mau = im.getpixel((x0, 700))
        khoi = im.crop((x0, tren, x1, duoi))
        xoa(im, (x0, 505, x1, 710), mau)
        im.paste(khoi, (x0, tren + (606 - (tren + duoi) // 2)))
    return im


def b16_s13(im):
    """búa – đinh: ba mũi tên đặt sai vật → đúng hai lực trực đối (một lên đinh, một lên búa).
    Sách: thêm trọng lực P (cân bằng với N); lực sách ép lên bàn đặt tại mặt bàn; xóa chữ rác trên bìa."""
    # chữ vàng méo trên bìa sách
    bia = np.zeros((im.height, im.width), np.uint8)
    cv2.fillPoly(bia, [np.array([(290, 232), (382, 218), (470, 226), (486, 262), (440, 282), (300, 266)], np.int32)], 1)
    bia = bia.astype(bool)
    bia[:, 330:357] = False                                     # chừa thân mũi tên N
    sach = mn_mau(im, (200, 228, 530, 310), lambda h, s, v: ((h < 7) | (h > 165)) & (s > 110) & (v > 45) & (v < 135))
    sach[:, 328:359] = False
    to_mat_phang(im, bia, sach & ~bia, nhieu=3.0)
    # nhãn F_sách cũ
    chon = mn_mau(im, (372, 458, 496, 540), lambda h, s, v: ((h >= 6) & (h <= 24) & (s > 170) & (v > 190)) | (v < 70))
    chu_f = no_mn(chon, 7)
    chu_f[:, :376] = False
    lap_huong(im, chu_f, (1, 0.22))
    # mũi tên giữa đổi từ cam sang đỏ: đó là trọng lực P đặt lên sách
    a = np.array(im); hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
    chon = mn_mau(im, (312, 346, 374, 564), lambda h, s, v: (h >= 5) & (h <= 24) & (s > 175) & (v > 200))
    hsv[..., 0][chon] = 0; hsv[..., 2][chon] = (hsv[..., 2][chon] * 0.90).astype(np.uint8)
    im.paste(Image.fromarray(cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)))
    vecto(im, 312, 525, 'P', '', 40, (214, 20, 24), 'rs', vien=TRANG)
    # lực sách ép lên bàn: đặt tại chỗ sách tiếp xúc mặt bàn
    v = Ve(im, (420, 396, 492, 584))
    mui_ten(v, (452, 420), (452, 560), CAM, 11, 30, 15, vien=DEN)
    cham(v, (452, 420), 7, DEN); cham(v, (452, 420), 5, CAM)
    v.xong()
    w = vecto(im, 474, 520, 'F', 'sách', 40, CAM, vien=DEN)
    chu(im, (478, 566), '(đặt lên bàn)', 21, 'dam', TRANG)
    # búa và đinh: xóa ba mũi tên cũ
    net = [((979, 229), (955, 340), 17), ((972, 362), (999, 268), 18), ((936, 512), (962, 420), 17)]
    dg = [[(929, 306), (990, 323), (949, 372)], [(972, 254), (1017, 204), (1031, 270)], [(931, 413), (975, 366), (988, 428)]]
    mau = mn_mau(im, (925, 200, 1035, 516), lambda h, s, v: ((h >= 86) & (h <= 112) & (s > 160) & (v > 140)) | ((h >= 5) & (h <= 24) & (s > 190) & (v > 210)))
    vung = cv2.dilate(mn_net(im, net, dg).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    vien = mn_mau(im, (925, 200, 1035, 516), lambda h, s, v: v < 60) & cv2.dilate(mau.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    lap(im, mat_na=(mau | vien) & vung, no=5, bk=5)
    # vẽ lại cây đinh (mũi tên cũ đã che mất thân đinh)
    v = Ve(im, (900, 360, 985, 520))
    v.da_giac([(944, 379), (955, 381), (927, 505), (920, 509), (918, 500)], (150, 158, 168), (30, 30, 34), 1.5)
    v.duong([(947, 384), (922, 498)], (214, 220, 228), 2.4)
    v.d.ellipse([*v.p(934, 369), *v.p(967, 385)], fill=(176, 184, 194), outline=(30, 30, 34), width=int(1.8 * v.Z))
    v.xong()
    v = Ve(im, (880, 220, 1030, 520))
    mui_ten(v, (962, 362), (989, 244), (22, 170, 226), 12, 32, 16, vien=DEN)   # đinh tác dụng lên búa
    mui_ten(v, (951, 380), (924, 498), CAM, 12, 32, 16, vien=DEN)              # búa tác dụng lên đinh
    for c, m in (((962, 362), (22, 170, 226)), ((951, 380), CAM)):
        cham(v, c, 7.5, DEN); cham(v, c, 5.5, m)
    v.xong()
    vecto(im, 722, 262, 'F', 'đinh→búa', 40, (0, 120, 180))
    chu(im, (724, 304), '(đặt lên búa)', 24, 'thuong', DEN)
    vecto(im, 722, 424, 'F', 'búa→đinh', 40, (205, 90, 0), vien=TRANG)
    ImageDraw.Draw(im).text((724, 466), '(đặt lên đinh)', font=phong('thuong', 24), fill=DEN, anchor='ls', stroke_width=3, stroke_fill=TRANG)
    return im


def b16_s14(im):
    """ô tô: hai mũi tên vẽ NGƯỢC. Đầu xe hướng sang trái (đèn đỏ là đuôi xe, ở bên phải):
    lực đường đẩy bánh xe hướng về đầu xe (trái), lực bánh xe đẩy đường hướng về sau (phải); hai lực dài bằng nhau"""
    net = [((384, 562), (556, 606), 22), ((553, 605), (880, 699), 22)]
    dg = [[(374, 558), (426, 548), (418, 592)], [(836, 668), (894, 702), (834, 706)]]
    vung = cv2.dilate(mn_net(im, net, dg).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    mau = mn_mau(im, (360, 530, 910, 720), lambda h, s, v: s > 70)
    chu_cu = mn_mau(im, (286, 586, 524, 654), lambda h, s, v: (s > 40) & ((h < 12) | (h > 168) | ((h > 100) & (h < 135))))
    chu_cu |= mn_mau(im, (784, 602, 1020, 672), lambda h, s, v: (s > 40) & (h > 100) & (h < 135))
    no_ = lambda m, k: cv2.dilate(m.astype(np.uint8), np.ones((k, k), np.uint8)).astype(bool)
    cu = mn_net(im, [((384, 562), (556, 606), 28), ((553, 605), (884, 701), 34)], [[(370, 554), (432, 542), (424, 598)], [(826, 658), (902, 704), (826, 716)]])
    for x0, y0, x1, y1 in ((288, 586, 524, 656), (780, 598, 1024, 674)):
        cu[y0:y1, x0:x1] |= (chu_cu | mn_mau(im, (x0, y0, x1, y1), lambda h, s, v: v > 213))[y0:y1, x0:x1] & no_mn(chu_cu, 17)[y0:y1, x0:x1]
    lap_manh(im, no_mn(cu, 5), co=11, ban_kinh=110)
    v = Ve(im, (340, 330, 800, 760))
    v.d.ellipse([*v.p(378, 354), *v.p(776, 752)], outline=(66, 112, 160), width=3 * v.Z)
    mui_ten(v, (556, 605), (362, 552), (0, 16, 238), 12, 36, 17)     # đường đẩy bánh: về phía trước
    mui_ten(v, (556, 605), (750, 658), (238, 10, 16), 12, 36, 17)    # bánh đẩy đường: về phía sau
    cham(v, (556, 605), 8, DEN)
    v.xong()
    vecto(im, 250, 640, 'F', 'đường→bánh', 42, (0, 16, 214), vien=TRANG)
    vecto(im, 742, 716, 'F', 'bánh→đường', 42, (214, 6, 12), vien=TRANG)
    v = Ve(im, (44, 196, 262, 292))
    v.da_giac([(52, 204), (252, 204), (252, 284), (52, 284)], (255, 255, 255), (60, 66, 80), 1.5)
    v.chu((152, 235), 'Chiều xe chạy', 25, 'dam', DEN)
    mui_ten(v, (222, 262), (82, 262), DEN, 6, 22, 10)
    v.xong()
    return im


def b16_s15(im):
    """'chỉ chịu tác dụng' sai (ô tô còn chịu nhiều lực khác), lặp 'Lực Lực', 'vô cùng nhỏ (bằng 0)' → 'coi như bằng 0'"""
    nen = im.getpixel((1338, 300))
    a = im.getpixel((940, 392))
    xoa(im, (934, 308, 1342, 476), nen if sum(abs(nen[k] - a[k]) for k in range(3)) < 20 else a)
    cac_dong(im, 948, 342, ('Xét riêng cặp tương tác này:', 'ô tô nhận lực do đường đẩy tới', '→ Ô tô tăng tốc được', '(vì khối lượng ô tô nhỏ).'), 28, 40, rong=388)
    xoa(im, (742, 586, 927, 648), im.getpixel((925, 584)))
    cac_dong(im, 835, 608, ('Nhận lực do', 'lốp xe đẩy lùi lại'), 24, 29, neo='ms', rong=180)
    xoa(im, (952, 664, 1345, 714), im.getpixel((1340, 700)))
    chu(im, (958, 700), 'vô cùng nhỏ (coi như bằng 0).', 28, rong_toi_da=384)
    return im


def b16_s16(im):
    """lực đạp F vẽ nghiêng còn phản lực F' nằm ngang → hai lực cùng giá, dài bằng nhau, đặt tại chỗ chân chạm vách"""
    net = [((158, 389), (404, 389), 28), ((516, 389), (642, 389), 28), ((170, 463), (232, 442), 40), ((226, 449), (402, 414), 38)]
    dg = [[(618, 344), (722, 389), (618, 436)], [(150, 466), (226, 414), (252, 500)]]
    vung = cv2.dilate(mn_net(im, net, dg).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    mau = mn_mau(im, (140, 340, 725, 512), lambda h, s, v: ((h >= 85) & (h <= 106) & (s > 105) & (v > 175)) | ((h >= 6) & (h <= 26) & (s > 170) & (v > 190)))
    mau = cv2.dilate(mau.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    nho = mn_mau(im, (660, 360, 728, 420), lambda h, s, v: (h >= 80) & (h <= 106) & (s > 60) & (v > 170))
    chu_cu = mn_mau(im, (506, 424, 706, 466), lambda h, s, v: (h >= 82) & (h <= 106) & (s > 100) & (v > 170))
    chu_cu |= mn_mau(im, (144, 504, 326, 546), lambda h, s, v: (h >= 6) & (h <= 28) & (s > 140) & (v > 160))
    tat = (vung & mau) | nho | cv2.dilate(chu_cu.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    lap_guong(im, cv2.dilate(tat.astype(np.uint8), np.ones((7, 3), np.uint8)).astype(bool))
    v = Ve(im, (10, 440, 380, 508))
    C = (190, 472)
    mui_ten(v, C, (28, 472), CAM, 18, 44, 24, vien=(90, 40, 0))
    mui_ten(v, C, (352, 472), (14, 190, 240), 18, 44, 24, vien=(0, 60, 90))
    cham(v, C, 10, DEN); cham(v, C, 7, TRANG)
    v.xong()
    d = ImageDraw.Draw(im)
    for xy, s, m in (((24, 534), 'F (Lực đạp)', (255, 150, 50)), ((214, 534), "F′ (Phản lực)", (80, 215, 255))):
        d.text(xy, s, font=phong('dam', 28), fill=m, anchor='ls', stroke_width=2, stroke_fill=(10, 25, 40))
    return im


def b16_s17(im):
    """nhãn F' lặp hai lần → bỏ nhãn phía dưới (chép mảng trời sao thấp hơn đè lên, viền mờ dần)"""
    m = mn_mau(im, (1100, 242, 1334, 308), lambda h, s, v: (h >= 78) & (h <= 112) & (s > 45) & (v > 80))
    return lap_manh(im, no_mn(m, 7), co=9, ban_kinh=90)


def b16_s18(im):
    """sơ đồ 1: nhãn F_AB đặt trên vật A (sai: lực đặt lên A là F_BA) và mũi tên hai đầu thừa; sơ đồ 2: hệ thức thiếu dấu trừ"""
    nen = im.getpixel((286, 238))
    xoa(im, (300, 228, 372, 264), nen); xoa(im, (390, 226, 466, 264), nen)
    xoa(im, (353, 267, 399, 290), nen)
    sang = (226, 232, 244)
    vecto(im, 334, 261, 'F', 'BA', 25, sang, 'ms')
    vecto(im, 424, 261, 'F', 'AB', 25, sang, 'ms')
    xoa(im, (990, 274, 1210, 316), im.getpixel((975, 296)))
    d = ImageDraw.Draw(im)
    x, y, co = 1034, 308, 31
    x += vecto(im, x, y, 'F', 'AB', co, sang) + 8
    d.text((x, y), '= −', font=phong('dam', co), fill=sang, anchor='ls')
    x += phong('dam', co).getlength('= −') + 6
    vecto(im, x, y, 'F', 'BA', co, sang)
    return im


def b16_s19(im):
    """hệ thức thiếu mũi tên vectơ; mã QR trang trí không quét được → mã QR thật dẫn tới bài tập tương tác của bài trong hồ sơ"""
    nen = im.getpixel((100, 305))
    xoa(im, (160, 273, 600, 334), nen)
    mau = (10, 12, 18)
    d = ImageDraw.Draw(im)
    co = 34
    rong = phong('dam', co).getlength('F') * 2 + phong('dam', co * 0.66).getlength('ABBA') + phong('dam', co).getlength(' = − ') + 6
    x = 364 - rong / 2
    x += vecto(im, x, 322, 'F', 'AB', co, mau) + 4
    d.text((x, 322), ' = − ', font=phong('dam', co), fill=mau, anchor='ls')
    x += phong('dam', co).getlength(' = − ') + 2
    vecto(im, x, 322, 'F', 'BA', co, mau)
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=2)
    q.add_data(QR_LINK); q.make(fit=True)
    ma = q.make_image(fill_color='black', back_color='white').convert('RGB')
    k = 164 // ma.width
    ma = ma.resize((ma.width * k, ma.width * k), Image.NEAREST)
    xoa(im, (716, 568, 884, 738), im.getpixel((700, 700)))
    im.paste(ma, (800 - ma.width // 2, 652 - ma.height // 2))
    return im


# ======================================================================= BÀI 17
def b17_s6(im):
    """thang lực kế ngược (số 0 ở dưới) và có cột số vô nghĩa → vạch 0 ở trên, một thang 0–5 N, kim chỉ 2 N; thêm nhãn F cho lực đỡ"""
    v = Ve(im, (1012, 204, 1064, 358))
    v.da_giac([(1014, 205), (1062, 205), (1062, 357), (1014, 357)], (236, 239, 241), (176, 182, 188), 1)
    y_ = lambda n: 226 + n * 24.5
    for i in range(26):
        y = y_(i / 5)
        v.duong([(1040, y), (1058 if i % 5 == 0 else 1050, y)], (50, 54, 60), 1.3 if i % 5 == 0 else 0.7)
    for n in range(6):
        v.chu((1022, y_(n) + 4), str(n), 11.5, 'dam', (30, 32, 38))
    v.chu((1051, 217), 'N', 11, 'dam', (30, 32, 38))
    kim = y_(2)
    zig = [(1034, 208)] + [(1034 + (5 if i % 2 else -5), 208 + (kim - 208) * i / 12) for i in range(1, 12)] + [(1034, kim)]
    v.duong(zig, (110, 116, 128), 1.0)
    v.duong([(1034, kim), (1034, 356)], (96, 100, 110), 1.6)
    v.duong([(1028, kim), (1060, kim)], DO, 2.4)
    v.xong()
    vecto(im, 1071, 470, 'F', '', 40, (40, 46, 60), vien=TRANG)
    return im


def b17_s7(im):
    """'F⃗ = 1 N', 'P⃗ = 1 N' (vectơ không bằng một con số) → bỏ mũi tên vectơ trên hai chữ ở phép ghi độ lớn"""
    for hop in ((1058, 258, 1108, 279), (1056, 512, 1104, 533)):
        m = mn_mau(im, hop, lambda h, s, v: (v < 175) | (s > 90))
        lap(im, mat_na=m, no=5, bk=4)
    return im


def b17_s8(im):
    """lặp chữ 'tại từng / từng nơi'"""
    noi = im.crop((1028, 642, 1148, 692))
    mau = im.getpixel((840, 668))
    xoa(im, (852, 642, 1172, 704), mau)
    im.paste(noi, (948, 642))
    return im


def b17_s9(im):
    """trọng lực tại địa điểm A không hướng về tâm Trái Đất → vẽ lại hai mũi tên cùng hướng vào tâm (tâm quả cầu ở khoảng (618; 790))"""
    net = [((570, 436), (424, 614), 46), ((952, 584), (820, 682), 46)]
    mau = mn_mau(im, (390, 424, 975, 712), lambda h, s, v: ((h < 12) | (h > 160)) & (s > 14))
    cu = cv2.dilate((mn_net(im, net) & mau).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    quang = np.zeros((im.height, im.width), np.uint8)
    for cx, cy in ((586, 432), (972, 580)):
        cv2.ellipse(quang, (cx, cy), (26, 17), 0, 0, 360, 1, -1)
    cu |= quang.astype(bool) & mn_mau(im, (540, 405, 1010, 605), lambda h, s, v: ((h < 12) | (h > 160)) & (s > 9) & ((s < 150) | (v > 235)))
    lap_manh(im, cu, co=11, ban_kinh=90)
    tam = (618, 790)
    v = Ve(im, (440, 400, 1000, 760))
    for chan in ((576, 427), (960, 579)):
        L = math.dist(chan, tam); u = ((tam[0] - chan[0]) / L, (tam[1] - chan[1]) / L)
        cuoi = (chan[0] + u[0] * 190, chan[1] + u[1] * 190)
        mui_ten(v, chan, cuoi, (214, 30, 38), 9, 34, 15, vien=(255, 214, 214))
        v.dut(cuoi, (chan[0] + u[0] * (L - 52), chan[1] + u[1] * (L - 52)), (190, 70, 74), 1.8, 10, 7)
    v.xong()
    vecto(im, 546, 560, 'P', '', 36, (190, 20, 28), 'rs', vien=TRANG)
    vecto(im, 846, 618, 'P', '', 36, (190, 20, 28), 'rs', vien=TRANG)
    ImageDraw.Draw(im).text((660, 724), 'Cả hai đều hướng về tâm Trái Đất', font=phong('dam', 26), fill=(150, 20, 28), anchor='ms', stroke_width=4, stroke_fill=TRANG)
    return im


def _ra_mep(q, goc, qua):
    d = qua - goc; xa = []
    for a, b in zip(q, np.roll(q, -1, axis=0)):
        M = np.array([d, a - b]).T
        if abs(np.linalg.det(M)) > 1e-9:
            t, s = np.linalg.solve(M, a - goc)
            if t > 0 and 0 <= s <= 1: xa.append(t)
    return goc + d * max(xa)


def b17_s10(im):
    """tấm bìa treo bằng HAI dây, các nét vạch không khớp cách làm → vẽ lại: treo bằng MỘT dây, lần lượt tại A rồi tại B"""
    bia = np.array(im.crop((940, 330, 1100, 470)))         # lấy vân bìa của ảnh gốc để tô tấm bìa mới
    mau_bia = tuple(int(c) for c in np.median(bia.reshape(-1, 3), axis=0))
    xoa(im, (574, 96, 1328, 721), TRANG)
    for x0, y0, x1, y1, cau in ((160, 172, 552, 296, ('Treo tấm bìa bằng một', 'sợi dây tại điểm A,', 'rồi treo lại tại điểm B.')),
                                (160, 338, 552, 456, ('Mỗi lần, dùng dây dọi vẽ', 'đường thẳng đứng đi', 'qua điểm treo.'))):
        xoa(im, (x0 - 4, y0, 546, y1), TRANG)
        cac_dong(im, x0 + 2, y0 + (40 if y0 < 300 else 30), cau, 31, 40, rong=382)
    q = np.array([(0, 0), (3.2, -0.2), (3.6, -1.6), (2.0, -2.6), (0.2, -2.0), (-0.4, -0.9)], float)
    x_, y_ = q[:, 0], q[:, 1]; x1_, y1_ = np.roll(x_, -1), np.roll(y_, -1); c_ = x_ * y1_ - x1_ * y_
    G = np.array([((x_ + x1_) * c_).sum(), ((y_ + y1_) * c_).sum()]) / (3 * c_.sum())
    A, B = np.array([3.15, -1.45]), np.array([0.35, -1.72])
    A2, B2 = _ra_mep(q, A, G), _ra_mep(q, B, G)
    S, Y0 = 82, 252
    v = Ve(im, (576, 100, 1326, 718))
    for lan, (treo, X) in enumerate(((A, 762), (B, 1140)), 1):
        goc = math.pi / 2 - math.atan2(G[1] - treo[1], G[0] - treo[0])        # quay cho G nằm ngay dưới điểm treo (trục y hướng xuống)
        R = np.array([[math.cos(goc), -math.sin(goc)], [math.sin(goc), math.cos(goc)]])
        T = lambda z: tuple(np.array([X, Y0]) + R @ (np.asarray(z) - treo) * S)
        v.da_giac([T(z) for z in q], mau_bia, (120, 92, 60), 2)
        v.duong([(X, 176), (X, Y0)], (122, 96, 62), 3.5)
        cham(v, (X, 174), 11, (120, 126, 136)); cham(v, (X, 174), 6, (206, 210, 216))
        v.dut((X, Y0), (X, 628), (222, 26, 34), 2.6, 11, 6)
        v.da_giac([(X - 11, 628), (X + 11, 628), (X, 656)], (88, 96, 108), DEN, 1.2)
        v.chu((X + 20, 646), 'dây dọi', 20, 'thuong', DEN, 'ls')
        v.chu((X, 134), 'Lần %d: treo tại %s' % (lan, 'A' if lan == 1 else 'B'), 26, 'dam', DEN)
        if lan == 2:
            v.duong([T(A), T(A2)], (22, 88, 190), 3)
            for z, ten in ((A, 'A'), (A2, 'A′')):
                c = np.array(T(z)); g = np.array(T(G)); u = (c - g) / np.linalg.norm(c - g)
                cham(v, tuple(c), 6, (22, 88, 190)); v.chu(tuple(c + u * 24 + np.array([0, 9])), ten, 27, 'dam', (22, 88, 190))
            g = T(G); cham(v, g, 11, TRANG); cham(v, g, 8, (222, 26, 34))
            v.chu((g[0] + 20, g[1] + 8), 'G: trọng tâm', 26, 'dam', DEN, 'ls')
        ten, z2, ten2 = ('A', A2, 'A′') if lan == 1 else ('B', B2, 'B′')
        cham(v, (X, Y0), 7, (222, 26, 34)); v.chu((X + 18, Y0 + 6), ten, 27, 'dam', (180, 12, 20), 'ls')
        c2 = T(z2); cham(v, c2, 6, (222, 26, 34)); v.chu((c2[0] - 24, c2[1] + 8), ten2, 27, 'dam', (180, 12, 20))
    v.chu((952, 700), 'Giao điểm của AA′ và BB′ là trọng tâm G', 25, 'dam', DEN)
    v.xong()
    return im


def b17_s11(im):
    """kết luận về trọng tâm thiếu điều kiện 'đồng chất'"""
    mau = im.getpixel((30, 610))
    xoa(im, (0, 600, 1376, 742), mau)
    xoa(im, (0, 742, 1266, 760), mau)
    cac_dong(im, 688, 664, ('KẾT LUẬN: Trọng tâm của vật phẳng, mỏng, đồng chất, có dạng', 'hình học đối xứng nằm ở tâm đối xứng của vật.'), 42, 60, 'dam', TRANG, 'ms', 1300)
    return im


def b17_s13(im):
    """lực căng tác dụng lên thùng phải đặt tại chỗ dây buộc vào thùng → kéo gốc mũi tên về nút buộc"""
    v = Ve(im, (850, 540, 1060, 650))
    v.duong([(868, 627.5), (1043, 563)], (1, 40, 252), 15.5)
    cham(v, (868, 628), 11, TRANG); cham(v, (868, 628), 8, (1, 40, 252))
    return v.xong()


def b17_s14(im):
    """ròng rọc: mũi tên lực căng vẽ NGƯỢC (lực căng hướng từ vật vào phía dây); thiếu điều kiện bỏ qua ma sát"""
    cap = [((935, 377), (952, 323)), ((933, 392), (918, 448)), ((1102, 372), (1073, 325)), ((1115, 386), (1145, 432))]
    vung = mn_net(im, [(a, b, 26) for a, b in cap])
    mau = mn_mau(im, (895, 305, 1170, 465), lambda h, s, v: (h >= 108) & (h <= 132) & (s > 120) & (v > 90))
    lap(im, mat_na=cv2.dilate((vung & mau).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool), no=5, bk=5)
    v = Ve(im, (895, 305, 1170, 465))
    for tail, head in (((953, 325), (938, 377)),     # tác dụng lên ròng rọc: từ ròng rọc vào dây
                       ((917, 448), (932, 394)),     # tác dụng lên vật: từ vật vào dây
                       ((1073, 325), (1101, 371)),   # tác dụng lên ròng rọc
                       ((1145, 433), (1116, 388))):  # tác dụng lên tay: từ tay vào dây
        mui_ten(v, tail, head, (8, 46, 232), 6.5, 24, 11)
        cham(v, tail, 5, (8, 46, 232))
    v.xong()
    nen_ngang(im, (736, 555, 1300, 596))
    chu(im, (1013, 584), 'Bỏ qua khối lượng dây, ròng rọc và ma sát:', 26, 'thuong', DEN, 'ms', 530)
    return im


def b17_s15(im):
    """đèn cân bằng thì T = P nên hai mũi tên phải dài bằng nhau; đề thiếu câu b, c và giới hạn 5,5 N (slide sau giải các câu đó)"""
    dau = im.crop((984, 640, 1037, 710))
    than = im.crop((984, 628, 1037, 640))
    them = 22
    for y in range(640, 640 + them, 12):
        im.paste(than.crop((0, 0, 53, min(12, 640 + them - y))), (984, y))
    im.paste(dau, (984, 640 + them))
    cac_dong(im, 57, 428, ('b) Tính độ lớn lực căng của dây', '(lấy g = 9,8 m/s²).'), 33, 43, 'dam', (14, 14, 18), rong=590)
    cac_dong(im, 57, 534, ('c) Dây chịu được lực căng tối đa', '5,5 N. Dây có bị đứt không?'), 33, 43, 'dam', (14, 14, 18), rong=590)
    return im


def b17_s17(im):
    """hai nhánh dây vẽ nghiêng gần như nhau dù ghi 14° và 20° → vẽ lại đúng góc (trần hạ thấp, tay khỉ giữ nguyên chỗ)"""
    goc_anh = im.copy()
    H = (398, 318)
    x0, y0, x1, y1 = 46, 128, 702, 347
    xoa(im, (x0, y0, x1, y1), (244, 248, 251))
    d = ImageDraw.Draw(im)
    for k in range(-1, 20):
        x = 70 + 41 * k
        if x0 <= x < x1: d.line((x, y0, x, y1 - 1), fill=(212, 217, 220), width=1)
    for y in (162, 207, 251, 295, 339):
        d.line((x0, y, x1 - 1, y), fill=(212, 217, 220), width=1)
    cao = 76
    trai = (H[0] - cao / math.tan(math.radians(14)), H[1] - cao)
    phai = (H[0] + cao / math.tan(math.radians(20)), H[1] - cao)
    v = Ve(im, (x0, y0, x1, y1))
    for x in range(int(trai[0]) - 24, int(phai[0]) + 30, 11):
        v.duong([(x, H[1] - cao), (x + 18, H[1] - cao - 18)], (150, 158, 166), 1.0)
    v.duong([(trai[0] - 26, H[1] - cao), (phai[0] + 46, H[1] - cao)], (90, 98, 108), 2.2)
    for k in range(0, 600, 20):
        a = 66 + k
        v.duong([(a, H[1]), (min(a + 11, 668), H[1])], (45, 48, 56), 1.8)
    for dau, T, dau_x in ((trai, 186, -1), (phai, 192, 1)):
        L = math.dist(H, dau); u = ((dau[0] - H[0]) / L, (dau[1] - H[1]) / L)
        v.duong([H, dau], (132, 138, 146), 4)
        mui_ten(v, H, (H[0] + u[0] * T, H[1] + u[1] * T), (22, 98, 232), 8, 27, 12)
    for goc, r, huong in ((14, 138, -1), (20, 122, 1)):
        box = [*v.p(H[0] - r, H[1] - r), *v.p(H[0] + r, H[1] + r)]
        v.d.arc(box, 180 if huong < 0 else 360 - goc, 180 + goc if huong < 0 else 360, fill=DEN, width=int(1.8 * v.Z))
    v.xong()
    chu(im, (H[0] - 146, H[1] - 8), '14°', 27, 'thuong', DEN, 'rs')
    chu(im, (H[0] + 132, H[1] - 11), '20°', 27, 'thuong', DEN, 'ls')
    for x, y, so in ((290, 270, '1'), (486, 262, '2')):
        vecto(im, x, y, 'T', so, 31, (18, 92, 224), 'ms', duoi=0.8)
    # đặt lại bàn tay và cẳng tay khỉ lên trên dây mới
    tay = Image.new('L', im.size, 0)
    ImageDraw.Draw(tay).polygon([(386, 304), (399, 301), (412, 307), (413, 322), (408, 332), (410, 347), (386, 347), (388, 332), (383, 321)], fill=255)
    im.paste(goc_anh, (0, 0), tay)
    return im


def b17_s18(im):
    """'khi tốc độ giảm' chưa đúng (quỹ đạo hạ thấp thì vệ tinh không chậm đi) → bỏ ý này"""
    m = mn_mau(im, (90, 546, 712, 664), lambda h, s, v: v < 128)
    lap(im, mat_na=m, no=7, bk=6)
    cac_dong(im, 101, 580, ('Quỹ đạo của vệ tinh vì thế hạ thấp dần,', 'cho đến khi nó đi sâu vào khí quyển', 'và rơi xuống Trái Đất.'), 29, 38, mau=(12, 14, 20), rong=590)
    return im


def b17_s19(im):
    """trọng lượng là đại lượng vô hướng (bỏ mũi tên trên P); hình cân chỉ 0,00 dù đang đặt vật → vẽ lực kế đo trọng lượng; lặp 'Trọng'"""
    xoa(im, (826, 164, 862, 181), im.getpixel((872, 168)))
    xoa(im, (516, 232, 862, 488), im.getpixel((516, 232)))
    X = 686
    v = Ve(im, (X - 90, 232, X + 90, 488))
    v.d.ellipse([*v.p(X - 13, 236), *v.p(X + 13, 262)], outline=(90, 96, 106), width=3 * v.Z)
    v.da_giac([(X - 34, 262), (X + 34, 262), (X + 34, 404), (X - 34, 404)], (238, 242, 246), (80, 88, 100), 2)
    y_ = lambda n: 284 + n * 21
    for i in range(26):
        y = y_(i / 5)
        v.duong([(X + 6, y), (X + (26 if i % 5 == 0 else 17), y)], (50, 56, 66), 1.4 if i % 5 == 0 else 0.7)
    for n in range(6):
        v.chu((X - 18, y_(n) + 5), str(n), 15, 'dam', DEN)
    v.chu((X + 18, 278), 'N', 14, 'dam', DEN)
    kim = y_(2)
    v.duong([(X, 264)] + [(X + (7 if i % 2 else -7), 264 + (kim - 264) * i / 10) for i in range(1, 10)] + [(X, kim)], (112, 118, 130), 1.3)
    v.duong([(X, kim), (X, 428)], (82, 88, 98), 2.4)
    v.duong([(X - 14, kim), (X + 30, kim)], DO, 3.2)
    v.d.arc([*v.p(X - 9, 418), *v.p(X + 9, 440)], -90, 180, fill=(82, 88, 98), width=int(2.6 * v.Z))
    v.da_giac([(X - 30, 440), (X + 30, 440), (X + 37, 484), (X - 37, 484)], (112, 117, 126), (55, 60, 68), 2)
    v.xong()
    nen_ngang(im, (498, 620, 898, 701))
    cac_dong(im, 524, 638, ('lượng = độ lớn của', 'trọng lực.'), co_vua('thuong', '- Khi đứng yên: Trọng', 316), 40)
    return im


SUA_THEM = {('B16', 4): b16_s4, ('B16', 5): b16_s5, ('B16', 6): b16_s6, ('B16', 8): b16_s8, ('B16', 12): b16_s12, ('B16', 13): b16_s13,
            ('B16', 14): b16_s14, ('B16', 15): b16_s15, ('B16', 16): b16_s16, ('B16', 17): b16_s17, ('B16', 18): b16_s18, ('B16', 19): b16_s19,
            ('B17', 6): b17_s6, ('B17', 7): b17_s7, ('B17', 8): b17_s8, ('B17', 9): b17_s9, ('B17', 10): b17_s10, ('B17', 11): b17_s11,
            ('B17', 13): b17_s13, ('B17', 14): b17_s14, ('B17', 15): b17_s15, ('B17', 17): b17_s17, ('B17', 18): b17_s18, ('B17', 19): b17_s19}


def main():
    """xuất lại riêng các ảnh slide có sửa (không dựng lại trang HTML); tham số --thu <thư mục>: xuất ra nơi khác để xem thử"""
    _d = importlib.util.spec_from_file_location('dung10', os.path.join(DIR, 'dung.py'))
    dung = importlib.util.module_from_spec(_d); _d.loader.exec_module(dung)
    ds = sys.argv[1:]
    thu = None
    if '--thu' in ds:
        i = ds.index('--thu'); thu = ds[i + 1]; del ds[i:i + 2]
    nho = {}
    for ma, i in sorted(SUA_THEM):
        if ds and ma not in ds and '%s:%d' % (ma, i) not in ds: continue
        if ma not in nho: nho[ma] = dung.d11.anh_slide(os.path.join(dung.NGUON, dung.BAI[ma]['file']))
        # số ảnh trên trang (s##.jpg) tính theo thứ tự các slide ẢNH trong BAI[ma]['day']
        so_anh = [c[1] for c in dung.BAI[ma]['day'] if c[0] == 'a'].index(i - 1) + 1
        im = Image.open(io.BytesIO(nho[ma][i - 1])).convert('RGB')
        if (ma, i) in dung.SUA_ANH: im = dung.d11.sua_anh(im, dung.SUA_ANH[(ma, i)])
        im = SUA_THEM[(ma, i)](im)
        os.makedirs(thu, exist_ok=True) if thu else None
        dich = os.path.join(thu, '%s_s%02d.jpg' % (ma, so_anh)) if thu else os.path.join(dung.REPO, 'bai-giang', 'k10-' + ma, 's%02d.jpg' % so_anh)
        im.save(dich, quality=88, optimize=True)
        print(dich)


if __name__ == '__main__':
    main()
