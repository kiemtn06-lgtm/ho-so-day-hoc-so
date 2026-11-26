# -*- coding: utf-8 -*-
"""Sửa LỖI KIẾN THỨC trên ảnh slide NotebookLM của K11 Bài 11, 12 (rà ngày 26/11/2026). dung.py nạp SUA_THEM và chạy sau SUA_ANH.

Mỗi hàm nhận ảnh gốc 1376x768 (đã qua SUA_ANH) và trả về ảnh đã sửa. Chỉ xuất lại vài ảnh, không đụng trang HTML:
    python -I -X utf8 tools/k11_bai_giang/ve_lai.py           (mọi slide có trong SUA_THEM)
    python -I -X utf8 tools/k11_bai_giang/ve_lai.py B12:9     (một slide)
"""
import os, sys, io, math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

F = {'thuong': r'C:\Windows\Fonts\arial.ttf', 'dam': r'C:\Windows\Fonts\arialbd.ttf', 'nghieng': r'C:\Windows\Fonts\ariali.ttf'}
DEN, NAVY = (22, 24, 34), (14, 34, 80)


def phong(kieu, co):
    return ImageFont.truetype(F[kieu], co)


def co_vua(kieu, chu, rong):
    """cỡ chữ (số thực) để dòng chu rộng đúng bằng rong px"""
    return rong / phong(kieu, 100).getlength(chu) * 100


def xoa(im, hop, mau=None):
    x0, y0, x1, y1 = hop
    ImageDraw.Draw(im).rectangle((x0, y0, x1 - 1, y1 - 1), fill=mau or im.getpixel((x0, y0)))


def chu(im, xy, s, co, kieu='thuong', mau=DEN, neo='ls', rong_toi_da=None):
    f = phong(kieu, co)
    if rong_toi_da and f.getlength(s) > rong_toi_da:
        f = phong(kieu, co * rong_toi_da / f.getlength(s))
    ImageDraw.Draw(im).text(xy, s, font=f, fill=mau, anchor=neo)
    return f.getlength(s)


def doan(im, x, y, cac, co, neo='ls', rong_toi_da=None):
    """một dòng gồm nhiều đoạn [(chữ, kiểu, màu)], neo 'ls' (trái) hoặc 'ms' (giữa)"""
    rong = sum(phong(k, co).getlength(s) for s, k, _ in cac)
    if rong_toi_da and rong > rong_toi_da:
        co = co * rong_toi_da / rong; rong = rong_toi_da
    if neo == 'ms': x -= rong / 2
    for s, k, m in cac:
        x += chu(im, (x, y), s, co, k, m)


class Ve:
    """vẽ gấp Z lần trên một vùng rồi thu nhỏ cho nét mịn; tọa độ truyền vào là tọa độ ảnh gốc"""
    Z = 4

    def __init__(self, im, hop, nen=None):
        self.im, self.hop = im, hop
        x0, y0, x1, y1 = hop
        goc = Image.new('RGB', (x1 - x0, y1 - y0), nen) if nen else im.crop(hop)
        self.g = goc.resize(((x1 - x0) * self.Z, (y1 - y0) * self.Z), Image.LANCZOS)
        self.d = ImageDraw.Draw(self.g)

    def p(self, x, y):
        return ((x - self.hop[0]) * self.Z, (y - self.hop[1]) * self.Z)

    def duong(self, ds, mau, w=2.0):
        self.d.line([self.p(*q) for q in ds], fill=mau, width=int(w * self.Z), joint='curve')

    def dut(self, a, b, mau, w=1.5, dai=9, ho=6):
        L = math.dist(a, b); s = 0
        while s < L:
            e = min(s + dai, L)
            self.duong([(a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L) for t in (s, e)], mau, w)
            s = e + ho

    def da_giac(self, ds, mau=None, vien=None, w=1.5):
        if mau: self.d.polygon([self.p(*q) for q in ds], fill=mau)
        if vien: self.duong(list(ds) + [ds[0]], vien, w)

    def mui(self, a, b, mau, dai=13, nua=6, vien=None):
        """đầu mũi tên đặt tại b, hướng từ a"""
        L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        goc = (b[0] - ux * dai, b[1] - uy * dai)
        self.da_giac([b, (goc[0] - uy * nua, goc[1] + ux * nua), (goc[0] + uy * nua, goc[1] - ux * nua)], mau, vien)

    def chu(self, xy, s, co, kieu='dam', mau=NAVY, neo='ms'):
        self.d.text(self.p(*xy), s, font=phong(kieu, co * self.Z), fill=mau, anchor=neo)

    def chu_so(self, xy, s, so, co, kieu='dam', mau=NAVY):
        """chữ có chỉ số dưới (phông Arial không có ₁ ₂): căn giữa tại xy"""
        a = phong(kieu, co).getlength(s); b = phong(kieu, co * 0.66).getlength(so)
        x = xy[0] - (a + b) / 2
        self.chu((x, xy[1]), s, co, kieu, mau, 'ls')
        self.chu((x + a, xy[1] + co * 0.18), so, co * 0.66, kieu, mau, 'ls')

    def xong(self):
        x0, y0, x1, y1 = self.hop
        self.im.paste(self.g.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))
        return self.im


def dan_len_tu_giac(im, tam, tu_giac, giu=None):
    """dán ảnh tam (mảng RGB) vào tứ giác tu_giac [TL, TR, BR, BL]; giu: mặt nạ điểm ảnh gốc phải giữ nguyên"""
    h, w = tam.shape[:2]; Z = 2
    M = cv2.getPerspectiveTransform(np.float32([(0, 0), (w, 0), (w, h), (0, h)]), np.float32(tu_giac) * Z)
    co = (im.width * Z, im.height * Z)
    lop = cv2.resize(cv2.warpPerspective(tam, M, co, flags=cv2.INTER_LINEAR), im.size, interpolation=cv2.INTER_AREA)
    a = cv2.resize(cv2.warpPerspective(np.full((h, w), 255, np.uint8), M, co), im.size, interpolation=cv2.INTER_AREA).astype(float)[..., None] / 255
    goc = np.array(im).astype(float)
    ra = np.where(a > 0, lop.astype(float) + goc * (1 - a), goc)
    if giu is not None: ra[giu] = goc[giu]
    im.paste(Image.fromarray(ra.clip(0, 255).astype(np.uint8)))
    return im


# ======================================================================= BÀI 11
def b11_s4(im):
    """vạch 0,45 µm và 0,54 µm đặt sai màu (0,54 µm nằm trên vùng cam) → đặt theo đúng tỉ lệ bước sóng: 0,38 µm ở x = 306, 0,76 µm ở x = 1056"""
    nen = im.getpixel((200, 640))
    for x0, x1 in ((498, 612), (750, 864)):
        xoa(im, (x0, 614, x1, 656), nen)
    for x in (556, 806):       # chân vạch cũ còn dính ở viền dưới dải màu
        im.paste(im.crop((x - 18, 612, x - 10, 614)), (x - 4, 612))
    for lam, s in ((0.45, '0,45 µm'), (0.54, '0,54 µm')):
        x = round(306 + (lam - 0.38) / 0.38 * 750)
        ImageDraw.Draw(im).line((x, 612, x, 622), fill=(25, 30, 45), width=2)
        chu(im, (x, 647), s, 25, mau=(20, 28, 48), neo='ms')
    return im


def b11_s6(im):
    """'Mọi vật có nhiệt độ cao hơn môi trường xung quanh' → mọi vật đều phát tia hồng ngoại; dễ nhận thấy khi nóng hơn môi trường"""
    xoa(im, (500, 346, 874, 492), im.getpixel((500, 500)))
    for i, s in enumerate(('Mọi vật (trên 0 K) đều', 'phát tia hồng ngoại;', 'dễ nhận thấy ở vật nóng', 'hơn môi trường.')):
        chu(im, (688, 376 + i * 36), s, 31, neo='ms', rong_toi_da=366)
    return im


def b11_s7(im):
    """400 nm = 0,40 µm (không phải 0,38 µm); nhiệt độ càng cao thì PHỔ tử ngoại càng kéo dài về phía bước sóng ngắn"""
    xoa(im, (150, 399, 362, 446), im.getpixel((100, 420)))
    chu(im, (254, 434), '(0,40 µm)', 40, neo='ms')
    xoa(im, (497, 344, 878, 474), im.getpixel((500, 520)))
    for y, s in ((375, '2000 °C. Nhiệt độ càng'), (417, 'cao, phổ tử ngoại càng'), (459, 'kéo về bước sóng ngắn.')):
        chu(im, (688, y), s, 32, neo='ms', rong_toi_da=372)
    return im


def b11_s9(im):
    """chính tả: 'Chuẩn đoán' → 'Chẩn đoán'"""
    xoa(im, (1046, 283, 1290, 322), im.getpixel((1285, 280)))
    chu(im, (1050, 313), 'Chẩn đoán (chụp', co_vua('thuong', 'Chuẩn đoán (chụp', 224))
    return im


def b11_s11(im):
    """hàng Tia X bỏ trống cột năng lượng; 'Năng lượng đâm xuyên' → 'Năng lượng và khả năng đâm xuyên'"""
    chu(im, (1099, 500), 'Năng lượng cao', 27, mau=(14, 20, 40), neo='ms')
    xoa(im, (124, 601, 1252, 637), (255, 255, 255))
    chu(im, (688, 628), 'Bước sóng (λ) giảm dần ↔ Tần số (f) tăng dần ↔ Năng lượng, khả năng đâm xuyên tăng dần.', 27, 'dam', (5, 8, 18), 'ms', 1112)
    return im


# ======================================================================= BÀI 12
def b12_s3(im):
    """hình hai loa: hàng nhãn L/B trên và dưới ngược nhau, vị trí giữa hai loa lại là chỗ âm nhỏ.
    Hai loa cùng pha → chính giữa phải là âm TO. Vẽ lại: to ở 688 và 688 ± 106, nhỏ ở 688 ± 53 và 688 ± 159; một hàng nhãn duy nhất."""
    goc = im.copy()
    micro = goc.crop((676, 368, 701, 415))
    xoa(im, (486, 363, 890, 414), (255, 255, 255))
    for x in (527, 633, 742, 846):
        xoa(im, (x - 10, 341, x + 10, 363), (255, 255, 255))
    for x in (515, 564, 613, 663, 712, 762, 811, 860):
        xoa(im, (x - 10, 456, x + 10, 474), (255, 255, 255))
    v = Ve(im, (486, 361, 890, 415))
    ds = []
    for i in range(0, 1561):
        x = 492 + i * 0.25
        A = 1.1 + sum(21 * math.exp(-((x - c) / 17) ** 2) for c in (582, 688, 794))
        ds.append((x, 386 - A * math.sin(2 * math.pi * (x - 688) / 8.4 + math.pi / 2)))
    v.duong(ds, (32, 38, 56), 1.3); v.xong()
    a = np.array(micro.convert('L'))
    mn = (a < 232).astype(np.uint8)
    mn[:, :2] = 0; mn[:, -2:] = 0
    mn = cv2.morphologyEx(np.pad(mn, 4), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))[4:-4, 4:-4]
    im.paste(micro, (676, 368), Image.fromarray(mn * 255))
    for x, s in ((529, 'B'), (582, 'L'), (635, 'B'), (688, 'L'), (741, 'B'), (794, 'L'), (847, 'B')):
        chu(im, (x, 470), s, 18, 'dam', NAVY, 'ms')
    return im


def b12_s4(im):
    """màn hứng chỉ có vòng tròn đồng tâm của MỘT nguồn → vẽ lại ảnh sóng của HAI nguồn kết hợp (có các đường cực tiểu đứng yên)"""
    w, h = 416, 332
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    lam, d = 25.0, 75.0          # S1S2 = 3 bước sóng → 6 đường cực tiểu
    u = np.zeros_like(xx)
    for sx in (w / 2 - d / 2, w / 2 + d / 2):
        r = np.hypot(xx - sx, yy - h / 2)
        u += np.cos(2 * math.pi * r / lam) / np.sqrt(1 + r / (3 * lam))
    u /= np.abs(u).max()
    env = np.exp(-(np.hypot((xx - w / 2) / (0.47 * w), (yy - h / 2) / (0.50 * h))) ** 4)
    g = 78 + env * (np.tanh(2.0 * u) * 105 + 42)
    tam = np.dstack([g.clip(30, 250)] * 3).astype(np.uint8)
    a = np.array(im)
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
    muiten = ((hsv[:, :, 0] >= 85) & (hsv[:, :, 0] <= 104) & (hsv[:, :, 1] >= 110) & (hsv[:, :, 2] >= 110))
    muiten = cv2.dilate(muiten.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(bool)
    return dan_len_tu_giac(im, tam, [(785, 496), (991, 569), (991, 732), (785, 660)], giu=muiten)


def b12_s5(im):
    """cực đại/cực tiểu trên mặt nước KHÔNG tương ứng gợn sáng/gợn tối (đường đứng yên có độ sáng đều, không phải tối)"""
    for x0, y0, x1, y1, base in ((809, 552, 1215, 586, 576), (945, 599, 1320, 634, 623)):
        xoa(im, (x0, y0, x1, y1), im.getpixel((1340, 566)))
        chu(im, (x0 - 1, base), '.', 28)
    return im


def b12_s6(im):
    """thiếu điều kiện hai nguồn CÙNG PHA cho công thức cực đại, cực tiểu; 'cộng hưởng' dùng sai"""
    chu(im, (860, 423), 'Xét hai nguồn cùng pha.', 31, 'dam', (150, 40, 20), rong_toi_da=420)
    xoa(im, (60, 710, 1300, 741), (255, 255, 255))
    chu(im, (69, 732), 'Ghi chú cho giáo viên: Giải thích ý nghĩa của chữ k (bậc giao thoa). Nhắc lại: đồng pha tăng cường biên độ, ngược pha triệt tiêu biên độ.', 19, rong_toi_da=1212)
    return im


def b12_s8(im):
    """thí nghiệm Y-âng chứng tỏ ánh sáng có tính chất sóng (không phải 'không chỉ là hạt'); 'Chuyển ú ý' → 'Chuyển ý'"""
    nen = im.getpixel((90, 129))
    xoa(im, (92, 110, 1280, 150), nen)
    doan(im, 688, 139, [('Mục đích: ', 'dam', (14, 22, 44)), ('Chứng minh ánh sáng có tính chất sóng.', 'thuong', (14, 22, 44))], 32, 'ms')
    nen = im.getpixel((62, 705))
    xoa(im, (62, 702, 1090, 728), nen)
    doan(im, 67, 723, [('Ghi chú cho giáo viên: ', 'nghieng', DEN), ('Chuyển ý: “Nếu ánh sáng cũng là một dạng sóng, nó phải giao thoa được! Nhà bác học', 'thuong', DEN)], 20, rong_toi_da=996)
    return im


def b12_s9(im):
    """hình vẽ màn chắn P chỉ có MỘT khe, tia xuất phát từ mép tấm và từ giữa không trung; vân ghi 'nằm ngang'. Vẽ lại cả hình, sửa chữ."""
    xoa(im, (36, 136, 700, 662), (255, 255, 255))
    DO, XAM, DENV = (214, 22, 22), (203, 204, 207), (25, 25, 30)
    v = Ve(im, (36, 136, 700, 662))
    # màn E (hình bình hành) và nền đen của hệ vân
    E = [(396, 162), (568, 256), (568, 396), (396, 302)]
    v.da_giac(E, (240, 240, 242), DENV, 1.6)
    trong = [(405, 199), (560, 284), (560, 362), (405, 277)]
    # màn chắn P, nghiêng cùng chiều với màn E
    P = [(165, 378), (272, 437), (272, 568), (165, 509)]
    v.da_giac(P, XAM, DENV, 1.6)
    doc = lambda x: (x - 165) * 59 / 107        # độ dốc của cạnh trên
    khe = []
    for x in (198, 232):
        k = [(x, 405 + doc(x)), (x + 6, 405 + doc(x + 6)), (x + 6, 477 + doc(x + 6)), (x, 477 + doc(x))]
        khe.append((x + 3, 441 + doc(x + 3)))
        v.da_giac(k, (255, 255, 255), DENV, 1.2)
    # laze → hai khe
    la = (142, 536)
    for k in khe:
        v.duong([la, k], DO, 2.2); v.mui(la, (la[0] + (k[0] - la[0]) * 0.72, la[1] + (k[1] - la[1]) * 0.72), DO, 12, 5)
    v.da_giac([(60, 551), (126, 516), (147, 529), (81, 565)], (178, 180, 186), DENV)
    v.da_giac([(81, 565), (147, 529), (147, 553), (81, 589)], (120, 123, 130), DENV)
    v.da_giac([(60, 551), (81, 565), (81, 589), (60, 575)], (146, 149, 156), DENV)
    v.xong()
    # hệ vân: các vạch DỌC, song song với hai khe
    def van(w, h, n):
        x = np.linspace(-1, 1, w)
        I = np.cos(np.pi * x * n) ** 2 * np.exp(-(x / 0.68) ** 2)
        t = np.zeros((h, w, 3), np.uint8)
        t[..., 0] = (8 + 240 * I).astype(np.uint8); t[..., 1] = (22 * I).astype(np.uint8); t[..., 2] = (16 * I).astype(np.uint8)
        return t
    dan_len_tu_giac(im, van(620, 300, 7), trong)
    v = Ve(im, (36, 136, 700, 662))
    # từ MỖI khe có sóng đi tới cùng các điểm trên màn
    dich = [(452, 257), (513, 290)]
    for k, mau in zip(khe, ((235, 60, 50), (52, 168, 205))):
        for q in dich:
            v.duong([k, q], mau, 1.7)
            v.mui(k, (k[0] + (q[0] - k[0]) * 0.55, k[1] + (q[1] - k[1]) * 0.55), mau, 12, 5)
    for k in khe:
        v.d.ellipse([*v.p(k[0] - 2, k[1] - 2), *v.p(k[0] + 2, k[1] + 2)], fill=DENV)
    # nhãn F₁, F₂ có đường chỉ vào đúng từng khe
    v.duong([(190, 372), (201, 405 + doc(201))], DENV, 1.0)
    v.duong([(291, 504), (236, 478 + doc(235))], DENV, 1.0)
    v.chu_so((187, 368), 'F', '1', 25, 'thuong', DENV)
    v.chu_so((305, 511), 'F', '2', 25, 'thuong', DENV)
    v.chu((196, 560), 'P', 25, 'thuong', DENV)
    v.chu((588, 330), 'E', 25, 'thuong', DENV)
    v.chu((108, 612), 'Laze', 22, 'thuong', DENV)
    # ô phóng to
    v.duong([(462, 262), (468, 428)], (94, 190, 220), 1.3)
    v.duong([(503, 285), (676, 428)], (94, 190, 220), 1.3)
    v.xong()
    im.paste(Image.fromarray(van(204, 82, 2.5)), (470, 430))
    v = Ve(im, (36, 136, 700, 662))
    v.da_giac([(469, 429), (674, 429), (674, 512), (469, 512)], None, (94, 190, 220), 1.6)
    v.duong([(572, 524), (572, 492)], (94, 190, 220), 2); v.mui((572, 524), (572, 484), (94, 190, 220), 11, 5)
    v.chu((572, 542), 'Vân sáng', 21, 'thuong', DENV)
    v.chu((572, 567), 'chính giữa', 21, 'thuong', DENV)
    v.xong()
    # chữ bên phải
    xoa(im, (718, 234, 1360, 273), (255, 255, 255))
    chu(im, (727, 261), '(đen) song song, xen kẽ đều đặn nhau.', 28, 'dam', (8, 10, 18), rong_toi_da=575)
    xoa(im, (742, 439, 1312, 476), (255, 255, 255))
    chu(im, (747, 466), '(Giống chỗ nước dao động mạnh nhất).', 27, rong_toi_da=558)
    return im


def b12_s10(im):
    """sơ đồ sai: hai điểm cùng tên O, có 'tia sáng' đi ra từ chỗ chắn sáng giữa hai khe, đoạn vuông góc tại H dựng sai. Vẽ lại sơ đồ."""
    xoa(im, (30, 122, 628, 640), (255, 255, 255))
    CY = (34, 226, 248)
    v = Ve(im, (30, 122, 628, 640))
    f1, f2, x0, xm = 298, 439, 147, 532
    O, A, I = (xm, 368.5), (xm, 207), (x0, 368.5)
    for y0, y1 in ((172, f1 - 13), (f1 + 13, f2 - 13), (f2 + 13, 569)):
        v.da_giac([(x0 - 14, y0), (x0, y0), (x0, y1), (x0 - 14, y1)], CY, NAVY)
    v.da_giac([(xm, 168), (xm + 14, 168), (xm + 14, 569), (xm, 569)], CY, NAVY)
    v.dut(I, O, (96, 108, 130))
    for y in (f1, f2):
        S = (x0 - 4, y)
        v.duong([S, A], NAVY, 2.4)
        v.mui(S, (S[0] + (A[0] - S[0]) * 0.58, y + (A[1] - y) * 0.58), CY, 18, 9, NAVY)
        v.d.ellipse([*v.p(x0 - 8, y - 4), *v.p(x0, y + 4)], fill=NAVY)
    v.duong([(xm - 16, O[1]), (xm - 16, O[1] - 16), (xm, O[1] - 16)], NAVY, 1.6)
    for q in (I, O, A):
        v.d.ellipse([*v.p(q[0] - 4, q[1] - 4), *v.p(q[0] + 4, q[1] + 4)], fill=NAVY)
    v.chu_so((296, 247), 'd', '1', 30)
    v.chu_so((362, 343), 'd', '2', 30)
    v.chu((x0 + 22, 396), 'I', 30)
    v.chu((xm - 22, 405), 'O', 32)
    v.chu((xm - 14, 190), 'A', 32)
    v.chu((xm + 7, 155), 'E', 32)
    v.chu_so((72, f1 - 4), 'F', '1', 34)
    v.chu_so((72, f2 + 22), 'F', '2', 34)
    for a, b in (((108, f1), (108, f2)), ((572, A[1]), (572, O[1]))):
        v.duong([a, b], NAVY, 2); v.mui(a, b, NAVY, 11, 5); v.mui(b, a, NAVY, 11, 5)
    v.chu((84, 380), 'a', 32)
    v.chu((596, 298), 'x', 32)
    a, b = (x0, 524), (xm, 524)
    v.duong([a, b], NAVY, 2); v.mui(a, b, NAVY, 13, 6); v.mui(b, a, NAVY, 13, 6)
    v.chu(((x0 + xm) / 2, 564), 'D', 34)
    return v.xong()


def b12_s12(im):
    """nhãn dưới thiếu chữ i: '(11)' → '(11i)' — chép nhãn trên (đúng) xuống"""
    nhan = im.crop((466, 243, 912, 281))
    xoa(im, (466, 388, 912, 426), (255, 255, 255))
    im.paste(nhan, (466, 388))
    return im


def b12_s13(im):
    """đáp án câu 2 thiếu điều kiện 'cùng phương' (slide 7 nêu đủ ba điều kiện)"""
    nen = im.getpixel((842, 345))
    xoa(im, (840, 343, 1302, 431), nen)
    for i, s in enumerate(('Hai nguồn kết hợp (cùng phương,', 'cùng tần số, độ lệch pha', 'không đổi theo thời gian).')):
        chu(im, (846, 369 + i * 28), s, 26, mau=(4, 20, 34), rong_toi_da=450)
    return im


def b12_s14(im):
    """'cộng hưởng biên độ' dùng sai (cộng hưởng là hiện tượng khác); lặp từ 'cho học học sinh'"""
    xoa(im, (104, 401, 470, 443), (255, 255, 255))
    chu(im, (107, 432), 'tăng cường lẫn nhau).', 33, mau=(18, 20, 28), rong_toi_da=362)
    xoa(im, (134, 672, 900, 709), (255, 255, 255))
    chu(im, (138, 697), 'sinh khi giải thích được hiện tượng đời thường.', co_vua('thuong', 'học sinh khi giải thích được hiện tượng đời thường.', 663))
    return im


def b12_s15(im):
    """sóng nước: cực đại, cực tiểu không phải 'Sáng/Lồi', 'Tối/Phẳng'; thêm điều kiện hai nguồn cùng pha"""
    nen = im.getpixel((46, 480))
    for y, base, s in ((477, 503, '- Cực đại (dao động mạnh):'), (543, 570, '- Cực tiểu (đứng yên):')):
        xoa(im, (50, y, 353, y + 36), nen)
        chu(im, (53, base), s, 24, rong_toi_da=284)
    chu(im, (197, 646), 'Hai nguồn kết hợp cùng pha', 21, 'nghieng', (140, 36, 18), 'ms')
    return im


SUA_THEM = {('B11', 4): b11_s4, ('B11', 6): b11_s6, ('B11', 7): b11_s7, ('B11', 9): b11_s9, ('B11', 11): b11_s11,
            ('B12', 3): b12_s3, ('B12', 4): b12_s4, ('B12', 5): b12_s5, ('B12', 6): b12_s6, ('B12', 8): b12_s8, ('B12', 9): b12_s9,
            ('B12', 10): b12_s10, ('B12', 12): b12_s12, ('B12', 13): b12_s13, ('B12', 14): b12_s14, ('B12', 15): b12_s15}


def main():
    """xuất lại riêng các ảnh slide có sửa (không dựng lại trang HTML); tham số --thu <thư mục>: xuất ra nơi khác để xem thử"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import dung
    ds = sys.argv[1:]
    thu = None
    if '--thu' in ds:
        i = ds.index('--thu'); thu = ds[i + 1]; del ds[i:i + 2]
    nho = {}
    for ma, i in sorted(SUA_THEM):
        if ds and '%s:%d' % (ma, i) not in ds: continue
        if ma not in nho: nho[ma] = dung.anh_slide(os.path.join(dung.NGUON, dung.BAI[ma]['file']))
        im = dung.anh_da_sua(ma, i, nho[ma][i - 1])
        dich = os.path.join(thu, '%s_s%02d.jpg' % (ma, i)) if thu else os.path.join(dung.REPO, 'bai-giang', 'k11-' + ma, 's%02d.jpg' % i)
        im.save(dich, quality=88, optimize=True)
        print(dich)


if __name__ == '__main__':
    main()
