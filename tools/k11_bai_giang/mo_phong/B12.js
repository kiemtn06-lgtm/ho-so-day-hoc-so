/* Mô phỏng Bài 12. Giao thoa sóng (bản "hc", 15 slide). Chỉ số slide tính từ 0:
   2  hai loa và micro (âm to – âm nhỏ)        3, 4  giao thoa sóng mặt nước, hệ đường hypebol
   5  điểm M, d₁, d₂, hiệu đường đi Δd          6  điều kiện: hai nguồn kết hợp
   7, 8, 9  thí nghiệm Y-âng, khoảng vân i = λD/a   11  ví dụ 2 (12 vân sáng liên tiếp)
   12  luyện tập Câu 3 (λ = 0,7 μm, a = 1 mm, D = 2 m)   13  ánh sáng trắng */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so;

  /* ---------- Trường sóng của hai nguồn, vẽ từng khối điểm ảnh ---------- */
  function truong(buf, ctx, W, Hf, o) {   // o: x1,y1,x2,y2 (px), s (px/đơn vị), k1,k2,w1,w2,ph, t, mau(u) -> [r,g,b]
    var buoc = 3, bw = Math.ceil(W / buoc), bh = Math.ceil(Hf / buoc), bc = buf.c;
    if (buf.cv.width !== bw || buf.cv.height !== bh || !buf.img) { buf.cv.width = bw; buf.cv.height = bh; buf.img = bc.createImageData(bw, bh) }
    var dt = buf.img.data;
    for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
      var X = i * buoc + 1.5, Y = j * buoc + 1.5, r1 = Math.hypot(X - o.x1, Y - o.y1) / o.s, r2 = Math.hypot(X - o.x2, Y - o.y2) / o.s;
      var u = (Math.sin(o.w1 * o.t - o.k1 * r1) / Math.sqrt(1 + r1 / 3) + Math.sin(o.w2 * o.t - o.k2 * r2 + o.ph) / Math.sqrt(1 + r2 / 3)) * .5;
      var c = o.mau(u), p = (j * bw + i) * 4; dt[p] = c[0]; dt[p + 1] = c[1]; dt[p + 2] = c[2]; dt[p + 3] = 255;
    }
    bc.putImageData(buf.img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(buf.cv, 0, 0, W, Hf);
  }
  function taoBuf() { var cv = document.createElement("canvas"); return { cv: cv, c: cv.getContext("2d"), img: null } }
  function mauNuoc(u) { var up = Math.max(0, u); return [24 + 150 * up + 20 * u, 80 + 140 * up + 30 * u, 130 + 110 * up + 40 * u] }
  function nguon(ctx, x, y, nhan, w, t) {
    ctx.beginPath(); ctx.arc(x, y, 7 + 1.5 * Math.sin(w * t), 0, TAU); ctx.fillStyle = "#f8fafc"; ctx.fill(); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "bold 17px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(nhan, x - 9, y + 28);
  }

  /* ---------- Slide 3, 4, 6: hai nguồn trên mặt nước ---------- */
  function nuoc(kieu) {   // kieu: "co-ban" (slide 3, 4) | "dieu-kien" (slide 6: thử phá điều kiện kết hợp)
    var dkien = kieu === "dieu-kien";
    return {
      ten: dkien ? "Điều kiện giao thoa: hai nguồn kết hợp" : "Giao thoa sóng mặt nước: hai nguồn kết hợp S₁, S₂",
      goiY: dkien ? "Giữ f₂ = f₁ và Δφ không đổi thì có vân ổn định. Đổi f₂ hoặc bật \"pha nhảy lung tung\" thì hệ vân mất."
        : "Nét liền: cực đại (hai sóng cùng pha). Nét đứt: cực tiểu (ngược pha). Đổi f, v và khoảng cách S₁S₂.",
      tao: function (ui) {
        var f = 4, v = 20, d = 6, duong = true, RONG = 24, f2 = 4, dphi = 0, nhay = false, buf = taoBuf();   // cm, Hz
        ui.truot("Tần số f₁", 2, 8, 0.5, f, "Hz", function (x) { f = x; if (!dkien) f2 = x });
        if (!dkien) ui.truot("Tốc độ v", 10, 30, 1, v, "cm/s", function (x) { v = x });
        ui.truot("Khoảng cách S₁S₂", 3, 12, 0.5, d, "cm", function (x) { d = x });
        if (dkien) {
          ui.truot("Tần số f₂", 2, 8, 0.1, f2, "Hz", function (x) { f2 = x });
          ui.truot("Độ lệch pha Δφ", 0, 6.28, 0.1, dphi, "rad", function (x) { dphi = x });
          ui.chon("Pha nhảy lung tung theo thời gian", nhay, function (x) { nhay = x });
        } else ui.chon("Vẽ đường cực đại, cực tiểu", duong, function (x) { duong = x });
        return {
          ve: function (ctx, W, H, t) {
            var s = W / RONG, lam = v / f, k1 = TAU / lam, k2 = TAU * f2 / v, w1 = TAU * f, w2 = TAU * f2, cx = W / 2, cy = H / 2, x1 = cx - d / 2 * s, x2 = cx + d / 2 * s;
            var ph = dphi + (nhay ? 7.3 * Math.sin(Math.floor(t / 0.55) * 12.9898) * 43758.5 % TAU : 0);
            truong(buf, ctx, W, H, { x1: x1, y1: cy, x2: x2, y2: cy, s: s, k1: k1, k2: k2, w1: w1, w2: w2, ph: ph, t: t, mau: mauNuoc });
            var kethop = Math.abs(f2 - f) < 1e-6 && !nhay;
            if (!dkien && duong) {   // hypebol d₂ − d₁ = m·λ/2 (m chẵn: cực đại, m lẻ: cực tiểu)
              var c = d / 2, N = Math.floor(d / lam * 2 - 1e-6);
              for (var m = -N; m <= N; m++) {
                var dl = m * lam / 2, a = dl / 2, cuc = m % 2 === 0, b = Math.sqrt(Math.max(0, c * c - a * a));
                ctx.save(); ctx.lineWidth = cuc ? 2.2 : 1.8; ctx.strokeStyle = cuc ? "rgba(254,202,202,.95)" : "rgba(147,222,253,.95)"; if (!cuc) ctx.setLineDash([7, 5]);
                ctx.beginPath();
                if (m === 0) { ctx.moveTo(cx, 0); ctx.lineTo(cx, H) }
                else for (var th = -3; th <= 3.001; th += .06) {
                  var px = cx + a * Math.cosh(th) * s, py = cy + b * Math.sinh(th) * s;
                  if (th === -3) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke(); ctx.restore();
              }
            }
            nguon(ctx, x1, cy, "S₁", w1, t); nguon(ctx, x2, cy, "S₂", w2, t);
            V.kichThuoc(ctx, x1, x2, Math.min(H - 12, cy + 56), "S₁S₂ = " + so(d) + " cm", "#fde047");
            if (dkien) V.hop(ctx, 12, 12, [kethop ? "*Hai nguồn kết hợp*: cùng phương, cùng tần số, Δφ không đổi" : "*Không kết hợp*: " + (nhay ? "Δφ thay đổi liên tục" : "f₂ ≠ f₁"),
              kethop ? "→ Hệ vân (cực đại, cực tiểu) đứng yên, ổn định" : "→ Vị trí cực đại, cực tiểu cứ xê dịch, không có hệ vân ổn định"]);
            else V.hop(ctx, 12, 12, ["Bước sóng *λ = v/f = " + so(lam, 2) + " cm*", "Hai cực đại liền kề trên S₁S₂ cách nhau *λ/2 = " + so(lam / 2, 2) + " cm*",
              "Cực đại: *d₂ − d₁ = kλ* · Cực tiểu: *d₂ − d₁ = (k + 0,5)λ*"]);
          }
        };
      }
    };
  }
  MP.dangKy("B12", 3, nuoc("co-ban"));
  MP.dangKy("B12", 4, nuoc("co-ban"));
  MP.dangKy("B12", 6, nuoc("dieu-kien"));

  /* ---------- Slide 5: điểm M, d₁, d₂, Δd ---------- */
  MP.dangKy("B12", 5, {
    ten: "Điểm M: d₁, d₂ và hiệu đường đi Δd = d₂ − d₁",
    goiY: "Bấm lên mặt nước (hoặc kéo thanh trượt) để đặt điểm M. Xem hai sóng tới M cộng với nhau thế nào.",
    tao: function (ui) {
      var lam = 2, d = 6, xm = 3, ym = 7, RONG = 24, hx, hy;   // cm
      ui.truot("Bước sóng λ", 1, 4, 0.1, lam, "cm", function (x) { lam = x });
      hx = ui.truot("M: vị trí ngang", -10, 10, 0.1, xm, "cm", function (x) { xm = x });
      hy = ui.truot("M: khoảng cách tới S₁S₂", 1, 8, 0.1, ym < 8 ? ym : 7, "cm", function (x) { ym = x });
      var buf = taoBuf();
      return {
        nhap: function (px, py, W, H) {   // bấm để đặt M trong vùng sóng (nửa trái của khung)
          var s = (W * .62) / RONG, cx = W * .31, cy = H * .22; var X = (px - cx) / s, Y = (py - cy) / s;
          if (px < W * .62 && Y > 0.5) { xm = Math.max(-10, Math.min(10, X)); ym = Math.max(1, Math.min(8, Y)); hx.value = xm; hy.value = ym; hx.oninput(); hy.oninput() }
        },
        ve: function (ctx, W, H, t) {
          var Wf = W * .62, s = Wf / RONG, cx = Wf / 2, cy = H * .22, k = TAU / lam, w = TAU * 1.0;
          var S1 = [cx - d / 2 * s, cy], S2 = [cx + d / 2 * s, cy], M = [cx + xm * s, cy + ym * s];
          ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Wf, H); ctx.clip();
          truong(buf, ctx, Wf, H, { x1: S1[0], y1: S1[1], x2: S2[0], y2: S2[1], s: s, k1: k, k2: k, w1: w, w2: w, ph: 0, t: t, mau: mauNuoc }); ctx.restore();
          var d1 = Math.hypot(xm + d / 2, ym), d2 = Math.hypot(xm - d / 2, ym), dd = d2 - d1, q = dd / lam;
          ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = "#fde047"; ctx.beginPath(); ctx.moveTo(S1[0], S1[1]); ctx.lineTo(M[0], M[1]); ctx.stroke();
          ctx.strokeStyle = "#fb923c"; ctx.beginPath(); ctx.moveTo(S2[0], S2[1]); ctx.lineTo(M[0], M[1]); ctx.stroke(); ctx.restore();
          ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "#fde047"; ctx.fillText("d₁", (S1[0] + M[0]) / 2 - 22, (S1[1] + M[1]) / 2); ctx.fillStyle = "#fb923c"; ctx.fillText("d₂", (S2[0] + M[0]) / 2 + 8, (S2[1] + M[1]) / 2);
          nguon(ctx, S1[0], S1[1], "S₁", w, t); nguon(ctx, S2[0], S2[1], "S₂", w, t);
          ctx.beginPath(); ctx.arc(M[0], M[1], 8, 0, TAU); ctx.fillStyle = "#ef4444"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.fillText("M", M[0] + 12, M[1] + 5);
          // đồ thị dao động do từng sóng gây ra tại M (bên phải)
          var gx = Wf + 18, gw = W - gx - 14, gh = (H - 60) / 3, T = 2, names = [["Sóng từ S₁ tới M", "#fde047", function (tt) { return Math.sin(w * tt - k * d1) }], ["Sóng từ S₂ tới M", "#fb923c", function (tt) { return Math.sin(w * tt - k * d2) }],
            ["Tổng hợp tại M", "#7dd3fc", function (tt) { return Math.sin(w * tt - k * d1) + Math.sin(w * tt - k * d2) }]];
          names.forEach(function (o, n) {
            var y0 = 24 + n * (gh + 8), yc = y0 + gh / 2 + 8; ctx.fillStyle = "#9fb0cc"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText(o[0], gx, y0 + 4);
            ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, yc); ctx.lineTo(gx + gw, yc); ctx.stroke();
            ctx.strokeStyle = o[1]; ctx.lineWidth = 2.2; ctx.beginPath();
            for (var i = 0; i <= gw; i += 2) { var tt = t - T + T * i / gw, y = yc - o[2](tt) * (gh / 2 - 4) * .5; if (i === 0) ctx.moveTo(gx + i, y); else ctx.lineTo(gx + i, y) } ctx.stroke();
          });
          var gan = Math.abs(q - Math.round(q)) < 0.04, gan2 = Math.abs(Math.abs(q - Math.floor(q)) - 0.5) < 0.04, kq = gan ? "CỰC ĐẠI (cùng pha, tăng cường)" : gan2 ? "CỰC TIỂU (ngược pha, triệt tiêu)" : "chưa phải cực đại hay cực tiểu";
          V.hop(ctx, 12, H - 100, ["d₁ = " + so(d1, 2) + " cm · d₂ = " + so(d2, 2) + " cm → *Δd = " + so(dd, 2) + " cm*", "Δd/λ = *" + so(q, 2) + "* → " + kq], { co: 15 });
        }
      };
    }
  });

  /* ---------- Slide 2, 13: hai loa và micro (âm to, âm nhỏ) ---------- */
  function loa(kieu) {
    return {
      ten: "Hai loa phát cùng một âm: micro nghe chỗ to, chỗ nhỏ",
      goiY: "Kéo micro dọc theo đường thẳng: chỗ Δd = kλ nghe to (L), chỗ Δd = (k + 0,5)λ nghe nhỏ (B). Sóng đang được phát chậm lại để dễ nhìn.",
      tao: function (ui) {
        var f = 500, v = 340, d = 2, xm = 0, RONG = 8, buf = taoBuf();   // Hz, m/s, m
        ui.truot("Tần số âm f", 200, 1000, 10, f, "Hz", function (x) { f = x });
        ui.truot("Khoảng cách hai loa", 1, 3, 0.1, d, "m", function (x) { d = x });
        var hm = ui.truot("Vị trí micro", -4, 4, 0.05, xm, "m", function (x) { xm = x });
        return {
          nhap: function (px, py, W, H) { var s = W / RONG; xm = Math.max(-4, Math.min(4, (px - W / 2) / s)); hm.value = xm; hm.oninput() },
          ve: function (ctx, W, H, t) {
            var s = W / RONG, lam = v / f, k = TAU / lam, w = TAU * .7, Hf = H * .6, cx = W / 2, yS = Hf * .1, yL = Hf * .82;
            ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
            var x1 = cx - d / 2 * s, x2 = cx + d / 2 * s;
            truong(buf, ctx, W, Hf, { x1: x1, y1: yS, x2: x2, y2: yS, s: s, k1: k, k2: k, w1: w, w2: w, ph: 0, t: t,
              mau: function (u) { var a = Math.abs(u); return [28 + 60 * a + (u > 0 ? 120 * u : 0), 24 + 55 * a, 60 + 150 * (u < 0 ? -u : 0) + 40 * a] } });
            var dY = (yL - yS) / s, dd = function (x) { return Math.hypot(x - d / 2, dY) - Math.hypot(x + d / 2, dY) };   // Δd = r₂ − r₁ (x tính bằng m)
            ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(0, yL); ctx.lineTo(W, yL); ctx.stroke(); ctx.setLineDash([]);
            // nhãn L (âm to), B (âm nhỏ) dọc đường đi của micro
            var dmax = Math.abs(dd(RONG / 2)), M = Math.floor(dmax / lam * 2 - 1e-6);
            for (var m = -M; m <= M; m++) {
              var lo = -RONG / 2, hi = RONG / 2, a = dd(lo) - m * lam / 2, b = dd(hi) - m * lam / 2;
              if (a * b > 0) continue;
              for (var it = 0; it < 30; it++) { var mid = (lo + hi) / 2, c = dd(mid) - m * lam / 2; if (c * a > 0) { lo = mid; a = c } else hi = mid }
              var px = cx + lo * s, to = m % 2 === 0; ctx.beginPath(); ctx.arc(px, yL, 11, 0, TAU); ctx.fillStyle = to ? "#ef4444" : "#38bdf8"; ctx.fill();
              ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(to ? "L" : "B", px, yL + 1);
            }
            [[x1, "Loa 1"], [x2, "Loa 2"]].forEach(function (o) {
              ctx.fillStyle = "#334155"; ctx.fillRect(o[0] - 12, yS - 14, 24, 28); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; ctx.strokeRect(o[0] - 12, yS - 14, 24, 28);
              ctx.beginPath(); ctx.arc(o[0], yS, 7 + 1.5 * Math.sin(w * t), 0, TAU); ctx.stroke();
              ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(o[1], o[0], yS + 34);
            });
            var xp = cx + xm * s; ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(xp, yL, 8, 0, TAU); ctx.fill(); ctx.fillRect(xp - 2, yL + 6, 4, 14);
            ctx.fillStyle = "#fde047"; ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.fillText("micro", xp, yL + 34);
            // đồ thị biên độ âm theo vị trí micro
            var g0 = Hf + 26, g1 = H - 22, amp = function (x) { var r1 = Math.hypot(x + d / 2, dY), r2 = Math.hypot(x - d / 2, dY), re = Math.cos(k * r1) / Math.sqrt(r1) + Math.cos(k * r2) / Math.sqrt(r2), im = Math.sin(k * r1) / Math.sqrt(r1) + Math.sin(k * r2) / Math.sqrt(r2); return Math.hypot(re, im) / (2 / Math.sqrt((r1 + r2) / 2)) };
            ctx.fillStyle = "#9fb0cc"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.fillText("Biên độ âm micro thu được, theo vị trí micro", 10, g0 - 8);
            ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, g1); ctx.lineTo(W, g1); ctx.stroke();
            ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.4; ctx.beginPath();
            for (var i = 0; i <= W; i += 2) { var y = g1 - Math.min(1.05, amp((i - cx) / s)) * (g1 - g0) * .92; if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y) } ctx.stroke();
            var am = amp(xm); ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(xp, g1 - Math.min(1.05, am) * (g1 - g0) * .92, 6, 0, TAU); ctx.fill();
            var q = dd(xm) / lam, text = am > .85 ? "ÂM TO (L): cùng pha, tăng cường" : am < .2 ? "ÂM NHỎ (B): ngược pha, triệt tiêu" : "âm vừa phải";
            V.hop(ctx, 12, 12, ["λ = v/f = " + so(v, 0) + "/" + so(f, 0) + " = *" + so(lam, 2) + " m*", "Micro: Δd = " + so(dd(xm), 2) + " m = *" + so(q, 2) + " λ* → " + text], { co: 14 });
          }
        };
      }
    };
  }
  MP.dangKy("B12", 2, loa());

  /* ---------- Y-âng: i = λD/a ---------- */
  function rgbLam(l) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1 } else if (l < 490) { g = (l - 440) / 50; b = 1 } else if (l < 510) { g = 1; b = (510 - l) / 20 }
    else if (l < 580) { r = (l - 510) / 70; g = 1 } else if (l < 645) { r = 1; g = (645 - l) / 65 } else r = 1;
    var f = l < 420 ? .3 + .7 * (l - 380) / 40 : l > 700 ? .3 + .7 * (780 - l) / 80 : 1; return [r * f, g * f, b * f];
  }
  function yang(p) {   // p: lam (nm), a (mm), D (m), trang (ánh sáng trắng), chuoi (số vân sáng liên tiếp cần đánh dấu)
    return {
      ten: p.trang ? "Giao thoa Y-âng với ánh sáng trắng" : "Giao thoa Y-âng: khoảng vân i = λD/a",
      goiY: p.trang ? "Vân trung tâm màu trắng, hai bên là các dải màu cầu vồng (tím gần vân trung tâm nhất, đỏ xa nhất). Đổi a, D để xem dải màu rộng ra hay hẹp lại."
        : "Đổi bước sóng λ (màu ánh sáng), khoảng cách hai khe a và khoảng cách D đến màn, rồi quan sát khoảng vân i.",
      tao: function (ui) {
        var lam = p.lam, a = p.a, D = p.D, RONG = 12;   // λ (nm), a (mm), D (m), bề rộng màn quan sát (mm)
        if (!p.trang) ui.truot("Bước sóng λ", 400, 760, 10, lam, "nm", function (x) { lam = x });
        ui.truot("Khoảng cách hai khe a", 0.1, 2, 0.05, a, "mm", function (x) { a = x });
        ui.truot("Khoảng cách D", 0.5, 3, 0.1, D, "m", function (x) { D = x });
        return {
          ve: function (ctx, W, H) {
            ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
            var mm = W / RONG, yM = H * .07, hM = H * .36, n = Math.ceil(W), x, p4;
            var img = ctx.createImageData(n, 1), row = img.data, rgb = rgbLam(lam), i = lam * 1e-3 * D / a;   // i (mm)
            var I = function (xx, l) { var q = Math.cos(Math.PI * ((xx - W / 2) / mm) / (l * 1e-3 * D / a)); return q * q };
            for (x = 0; x < n; x++) {
              p4 = x * 4;
              if (p.trang) {
                var R = 0, G = 0, B = 0, c;
                for (var l = 400; l <= 700; l += 10) { c = rgbLam(l); var e0 = I(x, l); R += c[0] * e0; G += c[1] * e0; B += c[2] * e0 }
                R /= 15; G /= 15; B /= 15; row[p4] = 255 * Math.min(1, R * 1.05); row[p4 + 1] = 255 * Math.min(1, G * 1.05); row[p4 + 2] = 255 * Math.min(1, B * 1.05);
              } else { var e = I(x, lam); row[p4] = 255 * rgb[0] * e; row[p4 + 1] = 255 * rgb[1] * e; row[p4 + 2] = 255 * rgb[2] * e }
              row[p4 + 3] = 255;
            }
            var tmp = document.createElement("canvas"); tmp.width = n; tmp.height = 1; tmp.getContext("2d").putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, yM, W, hM);
            ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1; ctx.strokeRect(0, yM, W, hM);
            ctx.fillStyle = "#fff"; ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Màn quan sát E (rộng " + RONG + " mm)", 10, yM + hM - 8);
            var yG = H * .6, hG = H * .17, mau = "rgb(" + Math.round(255 * rgb[0]) + "," + Math.round(255 * rgb[1]) + "," + Math.round(255 * rgb[2]) + ")";
            ctx.fillStyle = "#9fb0cc"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText(p.trang ? "Cường độ sáng theo vị trí: mỗi màu một đồ thị (tím hẹp, đỏ rộng)" : "Đồ thị cường độ sáng I theo vị trí trên màn", 10, yG - 6);
            if (p.trang) [[420, "#a78bfa"], [550, "#4ade80"], [680, "#f87171"]].forEach(function (o) {
              ctx.strokeStyle = o[1]; ctx.lineWidth = 2; ctx.beginPath();
              for (var x2 = 0; x2 <= W; x2 += 2) { var y = yG + hG * (1 - I(x2, o[0])); if (x2 === 0) ctx.moveTo(x2, y); else ctx.lineTo(x2, y) } ctx.stroke();
            });
            else {
              ctx.strokeStyle = mau; ctx.lineWidth = 2.5; ctx.beginPath();
              for (var x3 = 0; x3 <= W; x3 += 2) { var y3 = yG + hG * (1 - I(x3, lam)); if (x3 === 0) ctx.moveTo(x3, y3); else ctx.lineTo(x3, y3) } ctx.stroke();
              var xc = W / 2, xi = xc + i * mm;      // vân sáng trung tâm và vân sáng bậc 1
              if (p.chuoi) {
                var xe = xc + (p.chuoi - 1) * i * mm;
                if (xe < W - 4) {
                  ctx.setLineDash([5, 4]); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 1.5;
                  [xc, xe].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q, yM + hM); ctx.lineTo(q, yG + hG + 8); ctx.stroke() }); ctx.setLineDash([]);
                  V.kichThuoc(ctx, xc, xe, yM + hM + 26, p.chuoi + " vân sáng liên tiếp = " + (p.chuoi - 1) + "i = " + so((p.chuoi - 1) * i, 2) + " mm", "#fde047");
                } else { ctx.fillStyle = "#fde047"; ctx.font = "bold 15px 'Segoe UI',sans-serif"; ctx.fillText("Vùng quan sát chưa đủ " + p.chuoi + " vân sáng: giảm λ, D hoặc tăng a", 10, yM + hM + 24) }
              } else if (xi < W - 4) {
                ctx.setLineDash([5, 4]); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 1.5;
                [xc, xi].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q, yM + hM); ctx.lineTo(q, yG + hG + 8); ctx.stroke() }); ctx.setLineDash([]);
                V.kichThuoc(ctx, xc, xi, yM + hM + 26, "i = " + so(i, 3) + " mm", "#fde047");
              } else { ctx.fillStyle = "#fde047"; ctx.font = "bold 15px 'Segoe UI',sans-serif"; ctx.fillText("i = " + so(i, 2) + " mm: vân rộng hơn vùng quan sát", 10, yM + hM + 24) }
            }
            if (p.trang) V.hop(ctx, 12, H - 74, ["Vân trung tâm: *mọi màu cùng cực đại → trắng*", "Vân bậc 1: tím (λ nhỏ, i nhỏ) nằm gần tâm, đỏ (λ lớn, i lớn) nằm xa tâm"], { co: 15 });
            else V.hop(ctx, 12, H - 74, ["*i = λD/a = " + so(lam * 1e-3, 3) + " μm × " + so(D, 1) + " m / " + so(a, 2) + " mm = " + so(i, 3) + " mm*",
              "Vân thưa ra khi tăng λ, tăng D hoặc giảm a" + (p.chuoi ? " · N vân sáng liên tiếp có (N − 1) khoảng vân" : "")], { co: 15 });
          }
        };
      }
    };
  }
  var YANG = { lam: 600, a: 0.5, D: 1.5 };
  MP.dangKy("B12", 7, yang(YANG));
  MP.dangKy("B12", 8, yang(YANG));
  MP.dangKy("B12", 9, yang(YANG));
  MP.dangKy("B12", 11, yang({ lam: 590, a: 1.5, D: 1.2, chuoi: 12 }));   // ví dụ 2 (slide đã sửa a = 1,5 mm): i ≈ 0,47 mm, 12 vân sáng liên tiếp chiếm 5,2 mm
  MP.dangKy("B12", 12, yang({ lam: 700, a: 1, D: 2 }));                    // luyện tập Câu 3: i = 1,4 mm
  MP.dangKy("B12", 13, yang({ lam: 550, a: 0.5, D: 1.5, trang: true }));
})();
