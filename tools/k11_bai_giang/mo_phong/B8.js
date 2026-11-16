/* Mô phỏng Bài 8. Mô tả sóng: slide 1 (gợn sóng tròn), slide 2 (nghịch lí sóng biển), slide 3 (thí nghiệm tạo sóng mặt nước). */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so;
  function mod(a, b) { return ((a % b) + b) % b }
  function tron(ctx, x, y, r, mau, vien) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = mau; ctx.fill(); if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = 1.5; ctx.stroke() } }

  /* ---------- Slide 1: gợn sóng tròn lan ra từ một điểm trên mặt nước (nhìn từ trên xuống) ---------- */
  MP.dangKy("B8", 0, {
    ten: "Gợn sóng tròn trên mặt nước",
    goiY: "Bấm vào mặt nước để đặt nguồn sóng ở chỗ khác. Đổi f, v rồi xem bước sóng thay đổi thế nào.",
    tao: function (ui) {
      var f = 3, v = 15, dinh = true, nguon = [0.42, 0.5], RONG = 60;   // RONG: bề rộng vùng nhìn (cm)
      var buf = document.createElement("canvas"), bc = buf.getContext("2d"), img = null;
      ui.truot("Tần số f", 1, 8, 0.5, f, "Hz", function (x) { f = x });
      ui.truot("Tốc độ truyền v", 5, 30, 1, v, "cm/s", function (x) { v = x });
      ui.chon("Đánh dấu đỉnh sóng và bước sóng λ", dinh, function (x) { dinh = x });
      return {
        nhap: function (x, y, W, H) { nguon = [x / W, y / H]; ui.datLai() },
        ve: function (ctx, W, H, t) {
          var s = W / RONG, buoc = 3, bw = Math.ceil(W / buoc), bh = Math.ceil(H / buoc);
          if (buf.width !== bw || buf.height !== bh || !img) { buf.width = bw; buf.height = bh; img = bc.createImageData(bw, bh) }
          var d = img.data, ox = nguon[0] * W, oy = nguon[1] * H, lam = v / f, R = v * t, k = TAU / lam, w = TAU * f;
          for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
            var dx = (i * buoc + 1.5 - ox) / s, dy = (j * buoc + 1.5 - oy) / s, r = Math.sqrt(dx * dx + dy * dy), u = 0, g = 0;
            if (r < R) {
              var a = 1 / Math.sqrt(1 + r / 4), mep = Math.min(1, (R - r) / (lam * .35)), ph = w * t - k * r;
              u = a * mep * Math.sin(ph); g = a * mep * Math.cos(ph);       // g ~ độ dốc: tạo ánh sáng phản chiếu
            }
            var sang = Math.max(0, g) * .35, p = (j * bw + i) * 4;
            if (u > 0) { d[p] = 22 + 120 * u + 90 * sang; d[p + 1] = 78 + 130 * u + 90 * sang; d[p + 2] = 128 + 110 * u + 80 * sang }
            else { d[p] = 22 + 14 * u + 90 * sang; d[p + 1] = 78 + 45 * u + 90 * sang; d[p + 2] = 128 + 60 * u + 80 * sang }
            d[p + 3] = 255;
          }
          bc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(buf, 0, 0, W, H);
          // các vòng đỉnh sóng: wt - kr = π/2 + 2πn  =>  r = v·t - λ/4 - nλ
          if (dinh && R > lam * .25) {
            ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5;
            var r0 = mod(R - lam / 4, lam);
            for (var r1 = r0; r1 < R; r1 += lam) { if (r1 * s < 2) continue; ctx.beginPath(); ctx.arc(ox, oy, r1 * s, 0, TAU); ctx.stroke() }
            ctx.restore();
            if (r0 + lam < R) V.kichThuoc(ctx, ox + r0 * s, ox + (r0 + lam) * s, oy, "λ = " + so(lam) + " cm", "#fde047");
          }
          // nguồn sóng
          tron(ctx, ox, oy, 6 + 2 * Math.sin(w * t), "#f8fafc", "#0f172a");
          ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.fillText("O", ox + 10, oy - 10);
          V.hop(ctx, 12, 12, [
            "Nguồn O dao động với *f = " + so(f) + " Hz*",
            "Tốc độ truyền sóng *v = " + so(v, 0) + " cm/s*",
            "Bước sóng *λ = v / f = " + so(lam) + " cm*",
            "t = " + so(t, 2) + " s · sóng đã lan xa R = v·t = " + so(Math.min(R, 999), 1) + " cm"
          ]);
          // thước tỉ lệ
          ctx.save(); ctx.strokeStyle = ctx.fillStyle = "#e2e8f0"; ctx.lineWidth = 2; var y = H - 20;
          ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(16 + 10 * s, y); ctx.moveTo(16, y - 5); ctx.lineTo(16, y + 5); ctx.moveTo(16 + 10 * s, y - 5); ctx.lineTo(16 + 10 * s, y + 5); ctx.stroke();
          ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText("10 cm", 20, y - 8); ctx.restore();
        }
      };
    }
  });

  /* ---------- Slide 2: sóng biển truyền đi xa nhưng chiếc phao chỉ nhấp nhô tại chỗ (nhìn ngang) ---------- */
  MP.dangKy("B8", 1, {
    ten: "Nghịch lí của sóng biển: cái gì đang di chuyển?",
    goiY: "Theo dõi ngọn sóng được đánh dấu và chiếc phao. Ngọn sóng chạy xa, còn phao chỉ lên xuống tại chỗ.",
    tao: function (ui) {
      var A = 1.5, T = 4, lam = 40, danh = true, phanTu = true, RONG = 100, quang = 0, xc = null, vet = [];
      ui.truot("Biên độ A", 0.5, 3, 0.25, A, "m", function (x) { A = x });
      ui.truot("Chu kì T", 2, 8, 0.5, T, "s", function (x) { T = x });
      ui.truot("Bước sóng λ", 20, 60, 5, lam, "m", function (x) { lam = x });
      ui.chon("Đánh dấu một ngọn sóng", danh, function (x) { danh = x });
      ui.chon("Hiện các phần tử nước", phanTu, function (x) { phanTu = x });
      return {
        datLai: function () { quang = 0; xc = null; vet = [] },
        ve: function (ctx, W, H, t, dt) {
          var v = lam / T, k = TAU / lam, w = TAU / T, s = W / RONG, y0 = H * .5, ky = Math.min(H * .075, 40);
          var u = function (x) { return A * Math.sin(w * t - k * x) }, Y = function (x) { return y0 - ky * u(x) };
          quang += v * dt;
          // trời và biển
          var g = ctx.createLinearGradient(0, 0, 0, y0); g.addColorStop(0, "#7cc3f2"); g.addColorStop(1, "#d8eefb");
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          var gb = ctx.createLinearGradient(0, y0 - 3 * ky, 0, H); gb.addColorStop(0, "#1f78b4"); gb.addColorStop(1, "#06243f");
          ctx.beginPath(); ctx.moveTo(0, H);
          for (var px = 0; px <= W + 4; px += 4) ctx.lineTo(px, Y(px / s));
          ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = gb; ctx.fill();
          ctx.beginPath(); for (px = 0; px <= W + 4; px += 4) ctx[px ? "lineTo" : "moveTo"](px, Y(px / s));
          ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 2.5; ctx.stroke();
          // mực nước yên lặng
          ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); ctx.restore();
          // phần tử nước: chỉ dao động theo phương thẳng đứng
          if (phanTu) for (var xp = 5; xp < RONG; xp += 5) { var yy = Y(xp); tron(ctx, xp * s, yy + 9, 4, "#bae6fd", "#0c4a6e") }
          // ngọn sóng được đánh dấu: x = v·t - λ/4 - nλ, chọn n để bám liên tục
          var goc = v * t - lam / 4;
          if (xc === null) xc = mod(goc, lam) + lam * .0;
          var n = Math.round((goc - xc) / lam); xc = goc - n * lam;
          while (xc > RONG + lam * .25) xc -= lam * Math.max(1, Math.ceil(RONG / lam));
          if (danh && xc > -lam * .25) {
            var cx = xc * s, cy = Y(xc) - 14;
            ctx.save(); ctx.fillStyle = "#facc15"; ctx.strokeStyle = "#713f12"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 10, cy - 18); ctx.lineTo(cx + 10, cy - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#0f172a"; ctx.fillText("ngọn sóng", cx, cy - 24);
            ctx.restore();
            V.muiTen(ctx, cx + 22, cy - 9, cx + 70, cy - 9, "#f97316", 4);
          }
          // phao ở vị trí cố định
          var xb = RONG * .62, bx = xb * s, by = Y(xb), doc = Math.atan2(Y(xb + .5) - Y(xb - .5), s);
          ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(254,226,226,.9)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bx, y0 - ky * A - 70); ctx.lineTo(bx, y0 + ky * A + 30); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.translate(bx, by); ctx.rotate(doc * .6);
          ctx.fillStyle = "#dc2626"; ctx.strokeStyle = "#450a0a"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-22, 6); ctx.lineTo(-16, -30); ctx.lineTo(16, -30); ctx.lineTo(22, 6); ctx.quadraticCurveTo(0, 18, -22, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#f8fafc"; ctx.fillRect(-18, -18, 36, 8);
          ctx.fillStyle = "#334155"; ctx.fillRect(-2, -52, 4, 22); tron(ctx, 0, -55, 5, "#fde047", "#713f12");
          ctx.restore();
          ctx.save(); ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#7f1d1d";
          ctx.fillText("phao", bx, y0 - ky * A - 78); ctx.restore();
          V.muiTen(ctx, bx + 34, by - 14, bx + 34, by - 14 - 26 * Math.cos(w * t - k * xb), "#fecaca", 3);
          // đồ thị li độ của phao theo thời gian (10 s gần nhất)
          vet.push([t, u(xb)]); while (vet.length && vet[0][0] < t - 10) vet.shift();
          var gw = Math.min(320, W * .32), gh = 90, gx = W - gw - 14, gy = H - gh - 14;
          ctx.save(); ctx.fillStyle = "rgba(15,23,42,.8)"; ctx.fillRect(gx, gy, gw, gh); ctx.strokeStyle = "rgba(148,163,184,.4)"; ctx.strokeRect(gx, gy, gw, gh);
          ctx.strokeStyle = "rgba(148,163,184,.4)"; ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2 + 6); ctx.lineTo(gx + gw, gy + gh / 2 + 6); ctx.stroke();
          ctx.strokeStyle = "#fca5a5"; ctx.lineWidth = 2; ctx.beginPath();
          vet.forEach(function (p, i) { var X = gx + gw - (t - p[0]) / 10 * gw, Yg = gy + gh / 2 + 6 - p[1] / 3 * (gh / 2 - 12); ctx[i ? "lineTo" : "moveTo"](X, Yg) }); ctx.stroke();
          ctx.fillStyle = "#e2e8f0"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText("Li độ của phao theo thời gian (10 s gần nhất)", gx + 8, gy + 16);
          ctx.restore();
          V.hop(ctx, 12, 12, [
            "Tốc độ truyền sóng v = λ / T = *" + so(v) + " m/s*",
            "Ngọn sóng đã đi được: *" + so(quang, 0) + " m*",
            "Phao dịch chuyển theo phương ngang: *0 m*",
            "→ Thứ truyền đi là *trạng thái dao động (năng lượng)*, không phải nước."
          ], { nen: "rgba(15,23,42,.85)" });
        }
      };
    }
  });

  /* ---------- Slide 3: thí nghiệm tạo sóng mặt nước trong bể (nhìn ngang) ---------- */
  MP.dangKy("B8", 2, {
    ten: "Thí nghiệm tạo sóng mặt nước",
    goiY: "Vật tạo sóng O bắt đầu dao động lúc t = 0. Xem sóng truyền tới miếng xốp C. C chỉ dao động lên xuống, không chạy theo sóng.",
    toc: 0.5,
    tao: function (ui) {
      var f = 1.5, v = 12, xC = 30, A = 1, DAI = 60, TRAI = 5, phanTu = false;    // cm, Hz, cm/s; bể từ -TRAI đến DAI, nguồn O ở x = 0
      ui.truot("Tần số f", 0.5, 4, 0.5, f, "Hz", function (x) { f = x });
      ui.truot("Tốc độ truyền v", 6, 24, 1, v, "cm/s", function (x) { v = x });
      ui.truot("Vị trí miếng xốp C", 8, 56, 1, xC, "cm", function (x) { xC = x });
      ui.chon("Hiện các phần tử nước", phanTu, function (x) { phanTu = x });
      return {
        ve: function (ctx, W, H, t) {
          var w = TAU * f, lam = v / f;
          var L = Math.min(90, W * .06), R = W - 40, s = (R - L) / (DAI + TRAI);    // mép trái, mép phải bể; px/cm
          var y0 = H * .52, ky = Math.min(H * .07, 34), day = Math.min(H - 70, y0 + H * .26), sau = 26;
          var u = function (x) { x = Math.abs(x); return x <= v * t ? A * Math.sin(w * (t - x / v)) : 0 }, X = function (x) { return L + (x + TRAI) * s }, Y = function (x) { return y0 - ky * u(x) };
          ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
          // bể kính: mặt sau (lệch lên phải) và mặt trước
          var tren = y0 - ky * 2.6;
          ctx.save(); ctx.strokeStyle = "rgba(148,163,184,.5)"; ctx.lineWidth = 1.5;
          ctx.strokeRect(L + sau, tren - sau, R - L, day - tren);
          [[L, tren], [R, tren], [L, day], [R, day]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + sau, p[1] - sau); ctx.stroke() });
          ctx.restore();
          // nước
          var gb = ctx.createLinearGradient(0, y0 - ky, 0, day); gb.addColorStop(0, "rgba(56,189,248,.75)"); gb.addColorStop(1, "rgba(3,105,161,.85)");
          ctx.beginPath(); ctx.moveTo(L, day);
          for (var x = -TRAI; x <= DAI + .01; x += .25) ctx.lineTo(X(x), Y(x));
          ctx.lineTo(R, day); ctx.closePath(); ctx.fillStyle = gb; ctx.fill();
          ctx.beginPath(); for (x = -TRAI; x <= DAI + .01; x += .25) ctx[x > -TRAI ? "lineTo" : "moveTo"](X(x), Y(x));
          ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.save(); ctx.strokeStyle = "rgba(226,232,240,.8)"; ctx.lineWidth = 2; ctx.strokeRect(L, tren, R - L, day - tren); ctx.restore();
          ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.beginPath(); ctx.moveTo(L, y0); ctx.lineTo(R, y0); ctx.stroke(); ctx.restore();
          // thước dưới đáy bể
          ctx.save(); ctx.strokeStyle = ctx.fillStyle = "#94a3b8"; ctx.font = "12px 'Segoe UI',sans-serif"; ctx.textAlign = "center";
          for (x = 0; x <= DAI; x += 5) { ctx.beginPath(); ctx.moveTo(X(x), day + 4); ctx.lineTo(X(x), day + (x % 10 ? 9 : 14)); ctx.stroke(); if (x % 10 === 0) ctx.fillText(x + " cm", X(x), day + 27) }
          ctx.restore();
          // vật tạo sóng: bánh xe D quay đều, chốt lệch tâm kéo thanh O lên xuống (u_O = A·sin ωt)
          var cxD = X(0), Rw = ky * A, cyD = tren - sau - 22 - Rw - 8, gocD = w * t, uO = u(0);
          ctx.save(); ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cxD, cyD, Rw + 8, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cxD, cyD); ctx.lineTo(cxD + Rw * Math.cos(gocD), cyD - Rw * Math.sin(gocD)); ctx.stroke();
          tron(ctx, cxD + Rw * Math.cos(gocD), cyD - Rw * Math.sin(gocD), 4, "#f97316");
          var dinhThanh = cyD - ky * uO;           // thanh O gắn với độ cao của chốt
          ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cxD - 18, dinhThanh); ctx.lineTo(cxD + Rw + 18, dinhThanh); ctx.stroke();
          ctx.fillStyle = "#e2e8f0"; ctx.fillRect(cxD - 3, dinhThanh, 6, Y(0) - dinhThanh + 10);
          tron(ctx, cxD, Y(0) + 10, 6, "#e2e8f0", "#475569");
          ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.fillStyle = "#f8fafc"; ctx.fillText("D", cxD - Rw - 30, cyD + 5); ctx.fillText("O", cxD - 24, Y(0) + 4);
          ctx.restore();
          // mặt đầu sóng đang lan
          var dau = v * t;
          if (dau < DAI) {
            ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(dau), tren - 6); ctx.lineTo(X(dau), day); ctx.stroke(); ctx.restore();
            V.muiTen(ctx, X(dau) + 4, tren - 16, X(dau) + 56, tren - 16, "#f97316", 5);
          }
          // phần tử nước
          if (phanTu) for (x = 2; x < DAI; x += 2) tron(ctx, X(x), Y(x) + 8, 3.2, "#e0f2fe", "#075985");
          // miếng xốp C
          var cX = X(xC), cY = Y(xC), toi = v * t >= xC, vc = toi ? A * w * Math.cos(w * (t - xC / v)) : 0;
          ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = "rgba(253,224,71,.8)"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cX, tren - 40); ctx.lineTo(cX, day); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.fillStyle = "#fef3c7"; ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1.5;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cX - 13, cY - 10, 26, 14, 4); else ctx.rect(cX - 13, cY - 10, 26, 14); ctx.fill(); ctx.stroke();
          ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.fillStyle = "#fde047"; ctx.fillText("C", cX + 18, cY - 14); ctx.restore();
          if (toi && Math.abs(vc) > .05 * A * w) V.muiTen(ctx, cX - 26, cY - 3, cX - 26, cY - 3 - 34 * vc / (A * w), "#facc15", 4);
          var tC = xC / v;
          V.hop(ctx, W - 12, 12, [
            "t = *" + so(t, 2) + " s*  ·  f = " + so(f) + " Hz, v = " + so(v, 0) + " cm/s, λ = v/f = *" + so(lam) + " cm*",
            dau < DAI ? "Sóng đã truyền tới x = v·t = *" + so(dau) + " cm*" : "Sóng đã lan khắp mặt nước trong bể",
            "Sóng tới C sau t = x_C / v = *" + so(tC, 2) + " s*",
            toi ? "C: *dao động lên xuống* quanh vị trí cân bằng, không trôi theo sóng" : "C: *đứng yên*, sóng chưa tới"
          ], { co: 14, phai: true });
        }
      };
    }
  });
})();
