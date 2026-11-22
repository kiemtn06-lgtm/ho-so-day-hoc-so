/* Mô phỏng Bài 11. Sóng điện từ: slide 3 (sóng điện từ: E, B), slide 4, 12, 13 (thang sóng điện từ: λ = c/f). */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so, C = 3e8;
  var DAI = [   // [λ nhỏ hơn (m), tên, màu]  sắp theo λ tăng dần
    [1e-10, "Tia gamma (γ)", "#a78bfa"], [1e-8, "Tia Rơn-ghen (tia X)", "#60a5fa"], [3.8e-7, "Tia tử ngoại (UV)", "#818cf8"],
    [7.6e-7, "Ánh sáng nhìn thấy", "#fde047"], [1e-3, "Tia hồng ngoại (IR)", "#f87171"], [1, "Sóng vi ba", "#fb923c"], [1e9, "Sóng vô tuyến", "#f59e0b"]];
  function dai(lam) { for (var i = 0; i < DAI.length; i++) if (lam < DAI[i][0]) return DAI[i]; return DAI[DAI.length - 1] }
  function chuLam(l) {
    if (l >= 1e3) return so(l / 1e3, 1) + " km"; if (l >= 1) return so(l, 1) + " m"; if (l >= 1e-3) return so(l * 1e3, 1) + " mm";
    if (l >= 1e-6) return so(l * 1e6, 2) + " μm"; if (l >= 1e-9) return so(l * 1e9, 2) + " nm"; return so(l * 1e12, 2) + " pm";
  }
  function chuF(f) {
    if (f >= 1e18) return so(f / 1e18, 2) + "·10¹⁸ Hz"; if (f >= 1e15) return so(f / 1e15, 2) + "·10¹⁵ Hz"; if (f >= 1e12) return so(f / 1e12, 2) + " THz";
    if (f >= 1e9) return so(f / 1e9, 2) + " GHz"; if (f >= 1e6) return so(f / 1e6, 2) + " MHz"; if (f >= 1e3) return so(f / 1e3, 2) + " kHz"; return so(f, 0) + " Hz";
  }
  function mauLam(l) {   // màu ánh sáng nhìn thấy theo bước sóng l (nm)
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1 } else if (l < 490) { g = (l - 440) / 50; b = 1 } else if (l < 510) { g = 1; b = (510 - l) / 20 }
    else if (l < 580) { r = (l - 510) / 70; g = 1 } else if (l < 645) { r = 1; g = (645 - l) / 65 } else r = 1;
    return "rgb(" + Math.round(r * 255) + "," + Math.round(g * 255) + "," + Math.round(b * 255) + ")";
  }
  var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

  /* ---------- Slide 3: sóng điện từ truyền trong chân không, E ⟂ B ⟂ phương truyền (vẽ phối cảnh 3 chiều) ---------- */
  MP.dangKy("B11", 2, {
    ten: "Sóng điện từ: điện trường E và từ trường B",
    goiY: "E (đỏ, mặt phẳng thẳng đứng) và B (xanh, mặt phẳng nằm ngang) vuông góc nhau và cùng vuông góc phương truyền; luôn cùng pha. Kéo “Góc nhìn” để xoay, kéo “Điểm khảo sát” để đọc E, B.",
    toc: 0.5,
    tao: function (ui) {
      var n = 3, phi = 38, pos = .5, hE = true, hB = true, hMat = true, hVec = true, hDT = true;
      ui.truot("Số bước sóng hiển thị", 1.5, 6, 0.5, n, "", function (x) { n = x });
      ui.truot("Góc nhìn", 15, 70, 1, phi, "°", function (x) { phi = x });
      ui.truot("Điểm khảo sát", 0.05, 0.95, 0.01, pos, "", function (x) { pos = x });
      ui.chon("Điện trường E", hE, function (x) { hE = x });
      ui.chon("Từ trường B", hB, function (x) { hB = x });
      ui.chon("Mặt phẳng dao động", hMat, function (x) { hMat = x });
      ui.chon("Vectơ tại từng điểm", hVec, function (x) { hVec = x });
      ui.chon("Đồ thị tại điểm khảo sát", hDT, function (x) { hDT = x });
      var RE = "#f87171", XB = "#38bdf8";
      function nhan(ctx, s, x, y, mau, co, can) {
        ctx.save(); ctx.font = "bold " + (co || 18) + "px 'Segoe UI',sans-serif"; ctx.textAlign = can || "left"; ctx.textBaseline = "middle";
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(11,21,48,.9)"; ctx.strokeText(s, x, y); ctx.fillStyle = mau; ctx.fillText(s, x, y); ctx.restore();
      }
      return {
        ve: function (ctx, W, H, t) {
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1530"); g.addColorStop(1, "#16254a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          var x0 = 70, x1 = W - 70, y0 = H * .56, A = Math.min(H * .21, 140), k = TAU * n / (x1 - x0), w = TAU * .5, c = Math.cos(phi * Math.PI / 180), s = Math.sin(phi * Math.PI / 180);
          var ph = function (x, tt) { return Math.sin(w * tt - k * (x - x0)) };
          var PE = function (x, u) { return [x, y0 - u * A] };                       // điểm của E (trục thẳng đứng)
          var PB = function (x, u) { return [x - u * A * c, y0 + u * A * s] };      // điểm của B (trục z hướng ra phía người xem, chiếu xiên)
          // mặt phẳng dao động
          if (hMat) {
            [[hE, PE, "rgba(248,113,113,.10)", "rgba(248,113,113,.35)"], [hB, PB, "rgba(56,189,248,.10)", "rgba(56,189,248,.35)"]].forEach(function (m) {
              if (!m[0]) return; var a = m[1](x0, 1), b = m[1](x1, 1), d = m[1](x1, -1), e = m[1](x0, -1);
              ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
              ctx.fillStyle = m[2]; ctx.fill(); ctx.setLineDash([6, 6]); ctx.strokeStyle = m[3]; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
            });
          }
          // trục truyền
          ctx.lineWidth = 2; ctx.strokeStyle = "rgba(226,232,240,.8)"; ctx.beginPath(); ctx.moveTo(x0 - 20, y0); ctx.lineTo(x1 - 10, y0); ctx.stroke();
          V.muiTen(ctx, x1 - 40, y0, x1 + 10, y0, "#e2e8f0", 3);
          nhan(ctx, "phương truyền, vận tốc v (v = c)", x1 + 24, H - 24, "#e2e8f0", 16, "right");
          function truong(f, mau, hien) {
            if (!hien) return;
            ctx.save(); ctx.strokeStyle = mau; ctx.lineWidth = 3.2; ctx.beginPath();
            for (var x = x0; x <= x1; x += 2) { var p = f(x, ph(x, t)); if (x === x0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]) }
            ctx.stroke(); ctx.restore();
            if (!hVec) return;
            for (var x2 = x0 + 8; x2 <= x1 - 4; x2 += 15) {
              var u = ph(x2, t), p2 = f(x2, u); if (Math.abs(u) * A < 7) continue;
              ctx.save(); ctx.globalAlpha = .75; V.muiTen(ctx, x2, y0, p2[0], p2[1], mau, 1.7); ctx.restore();
            }
          }
          truong(PB, XB, hB); truong(PE, RE, hE);
          // điểm khảo sát
          var xp = x0 + pos * (x1 - x0), up = ph(xp, t), pe = PE(xp, up), pb = PB(xp, up);
          ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(253,224,71,.7)"; ctx.lineWidth = 1.5;
          var q1 = PE(xp, 1.25), q2 = PE(xp, -1.25); ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); ctx.restore();
          if (hE && Math.abs(up) > .06) { V.muiTen(ctx, xp, y0, pe[0], pe[1], "#fecaca", 5); nhan(ctx, "E", pe[0] + 18, pe[1] + (up > 0 ? -8 : 8), "#fecaca", 22) }
          if (hB && Math.abs(up) > .06) { V.muiTen(ctx, xp, y0, pb[0], pb[1], "#bae6fd", 5); nhan(ctx, "B", pb[0] - 20, pb[1] + (up > 0 ? 8 : -8), "#bae6fd", 22) }
          V.muiTen(ctx, xp, y0, xp + 60, y0, "#fde047", 5); nhan(ctx, "v", xp + 70, y0 + 4, "#fde047", 22);
          ctx.beginPath(); ctx.arc(xp, y0, 6, 0, TAU); ctx.fillStyle = "#fde047"; ctx.fill();
          // chú thích
          nhan(ctx, "● Điện trường E: dao động trong mặt phẳng thẳng đứng", 16, H - 52, "#fca5a5", 18);
          nhan(ctx, "● Từ trường B: dao động trong mặt phẳng nằm ngang", 16, H - 24, "#7dd3fc", 18);
          V.hop(ctx, 12, 12, ["Sóng điện từ là *điện từ trường lan truyền* trong không gian, không cần môi trường",
            "*E ⟂ B ⟂ v* (sóng ngang); E → B → v theo quy tắc bàn tay phải",
            "E và B *cùng pha*: cùng lúc cực đại, cùng lúc bằng 0 (E₀/B₀ = c = *3·10⁸ m/s*)",
            "Tại điểm khảo sát: *E = " + so(up, 2) + "·E₀*,  *B = " + so(up, 2) + "·B₀*"], { co: 15 });
          if (hDT && W >= 900) {   // đồ thị E(t), B(t) tại điểm khảo sát
            var gw = Math.min(330, W * .27), gh = 150, gx = W - gw - 14, gy = 14, T = TAU / w, ym = gy + gh / 2 + 8;
            ctx.save(); ctx.fillStyle = "rgba(15,23,42,.82)"; ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.lineWidth = 1;
            ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, 8); else ctx.rect(gx, gy, gw, gh); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = "rgba(148,163,184,.5)"; ctx.beginPath(); ctx.moveTo(gx + 8, ym); ctx.lineTo(gx + gw - 8, ym); ctx.stroke();
            [[RE, 3.2, []], [XB, 2, [7, 5]]].forEach(function (o, i) {
              if (i === 0 && !hE || i === 1 && !hB) return;
              ctx.strokeStyle = o[0]; ctx.lineWidth = o[1]; ctx.setLineDash(o[2]); ctx.beginPath();
              for (var j = 0; j <= 120; j++) { var tau = -2 * T + 2 * T * j / 120, X = gx + 10 + (gw - 20) * j / 120, Y = ym - Math.sin(w * (t + tau) - k * (xp - x0)) * (gh / 2 - 28); if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) }
              ctx.stroke();
            });
            ctx.setLineDash([]); ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(gx + gw - 10, ym - up * (gh / 2 - 28), 5, 0, TAU); ctx.fill();
            ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Tại điểm khảo sát theo thời gian: E và B trùng nhau", gx + 8, gy + 17);
            ctx.restore();
          }
        }
      };
    }
  });

  /* ---------- Slide 4, 12, 13: thang sóng điện từ, λ = c/f ---------- */
  var defThang = {
    ten: "Thang sóng điện từ: λ = c/f",
    goiY: "Kéo tần số: bước sóng λ = c/f giảm khi f tăng và bức xạ chuyển sang loại khác. Bấm nút để thử các số liệu ở phần luyện tập.",
    toc: 0.5,
    tao: function (ui) {
      var lg = 8, r = ui.truot("lg f (f = 10^x Hz)", 3, 21, 0.05, lg, "", function (x) { lg = x });
      function chon(ten, giaTri, theoLam) {
        ui.nut(ten, function () { lg = theoLam ? Math.log10(C / giaTri) : Math.log10(giaTri); r.value = lg.toFixed(2); r.oninput() });
      }
      chon("f = 200 kHz", 2e5); chon("f = 100 MHz", 1e8); chon("f = 5·10¹⁴ Hz", 5e14); chon("f = 10¹⁸ Hz", 1e18);
      chon("λ = 1 km", 1e3, 1); chon("λ = 3 cm", .03, 1); chon("λ = 5 μm", 5e-6, 1); chon("λ = 500 nm", 5e-7, 1); chon("λ = 50 nm", 5e-8, 1); chon("λ = 10⁻¹² m", 1e-12, 1);
      return {
        ve: function (ctx, W, H, t) {
          ctx.fillStyle = "#0b1530"; ctx.fillRect(0, 0, W, H);
          var f = Math.pow(10, lg), lam = C / f, d = dai(lam), x0 = 40, x1 = W - 40, yB = H * .66, hB = 34;
          var vx = function (l) { return x0 + (l - 3) / 18 * (x1 - x0) };   // lg f từ 3 đến 21
          [[3, 8.5, "Sóng vô tuyến", "#f59e0b"], [8.5, 11.5, "Vi ba", "#fb923c"], [11.5, 14.58, "Hồng ngoại", "#f87171"],
            [14.9, 16.5, "Tử ngoại", "#818cf8"], [16.5, 19.5, "Tia X", "#60a5fa"], [19.5, 21, "Tia γ", "#a78bfa"]].forEach(function (o) {
            var a = vx(o[0]), b = vx(o[1]); ctx.fillStyle = o[3]; ctx.fillRect(a, yB, b - a, hB);
            ctx.fillStyle = "#0f172a"; ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; if (b - a > 50) ctx.fillText(o[2], (a + b) / 2, yB + 21);
          });
          var gr = ctx.createLinearGradient(vx(14.58), 0, vx(14.9), 0); gr.addColorStop(0, "#ef4444"); gr.addColorStop(.35, "#facc15"); gr.addColorStop(.65, "#22c55e"); gr.addColorStop(1, "#8b5cf6");
          ctx.fillStyle = gr; ctx.fillRect(vx(14.58), yB, vx(14.9) - vx(14.58), hB);
          ctx.textAlign = "center"; ctx.fillStyle = "#9fb0cc"; ctx.font = "12px 'Segoe UI',sans-serif";
          for (var l = 3; l <= 21; l += 3) ctx.fillText("10" + String(l).replace(/\d/g, function (c) { return SUP[c] }) + " Hz", vx(l), yB + hB + 18);
          ctx.fillText("Tần số tăng · bước sóng giảm · năng lượng tăng  →", (x0 + x1) / 2, yB + hB + 38);
          var mx = vx(lg); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(mx, yB - 3); ctx.lineTo(mx - 9, yB - 19); ctx.lineTo(mx + 9, yB - 19); ctx.closePath(); ctx.fill();
          // sóng minh họa: số chu kì tăng dần theo vị trí trên thang (không theo tỉ lệ thật)
          var chuKi = 2 + (lg - 3) / 18 * 22, yW = H * .4, A = Math.min(H * .1, 50), mau = d[1] === "Ánh sáng nhìn thấy" ? mauLam(lam * 1e9) : d[2];
          ctx.save(); ctx.strokeStyle = mau; ctx.lineWidth = 3.5; ctx.beginPath();
          for (var x = x0; x <= x1; x += 2) { var y = yW - A * Math.sin(TAU * chuKi * (x - x0) / (x1 - x0) - TAU * .8 * t); if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
          ctx.stroke(); ctx.restore();
          ctx.textAlign = "start";
          V.hop(ctx, 12, 12, ["Tần số *f = " + chuF(f) + "*", "Bước sóng *λ = c/f = " + chuLam(lam) + "*", "Loại bức xạ: *" + d[1] + "*"], { co: 17 });
          V.hop(ctx, W - 12, 12, ["Hình sóng chỉ để minh họa:", "f càng lớn, sóng càng dày"], { phai: true, co: 13 });
        }
      };
    }
  };
  MP.dangKy("B11", 3, defThang);
  MP.dangKy("B11", 11, defThang);
  MP.dangKy("B11", 12, defThang);

  /* ---------- Slide 11: lò vi sóng nấu gà — phân tử nước phân cực dao động theo điện trường của vi sóng ---------- */
  MP.dangKy("B11", 10, {
    ten: "Lò vi sóng nấu gà: phân tử nước dao động làm chín thức ăn",
    goiY: "Vi sóng (f ≈ 2,45 GHz) tạo điện trường đổi chiều; các phân tử nước phân cực trong gà quay theo, va chạm nhau nên nóng lên. Kéo “Công suất” để đổi tốc độ chín.",
    toc: 0.5,
    tao: function (ui) {
      var cs = 0.6, hSong = true, nhiet = 0, M = [], tPre = 0;
      ui.truot("Công suất vi sóng", 0.1, 1, 0.05, cs, "", function (x) { cs = x });
      ui.chon("Hiện sóng vi ba", hSong, function (x) { hSong = x });
      for (var i = 0; i < 26; i++) {   // vị trí phân tử nước trong thân gà (toạ độ chuẩn hóa trong elip), pha dao động ngẫu nhiên
        var a = i * 2.399963, r = Math.sqrt((i + .5) / 26) * .85;
        M.push([Math.cos(a) * r, Math.sin(a) * r * .8, (i * 0.7371) % 1]);
      }
      function mauGa(q) {   // q từ 0 (sống, hồng nhạt) đến 1 (chín vàng nâu)
        var c0 = [246, 190, 180], c1 = [214, 140, 60];
        return "rgb(" + Math.round(c0[0] + (c1[0] - c0[0]) * q) + "," + Math.round(c0[1] + (c1[1] - c0[1]) * q) + "," + Math.round(c0[2] + (c1[2] - c0[2]) * q) + ")";
      }
      function nuoc(ctx, x, y, goc, s) {   // phân tử H2O: O đỏ ở giữa, hai H trắng lệch ±52° (cực dương về phía H)
        ctx.save(); ctx.translate(x, y); ctx.rotate(goc);
        ctx.fillStyle = "#f8fafc"; [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.arc(Math.cos(d * .9) * s * 1.1, Math.sin(d * .9) * s * 1.1, s * .55, 0, TAU); ctx.fill() });
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
        ctx.restore();
      }
      return {
        datLai: function () { nhiet = 0 },
        ve: function (ctx, W, H, t, dt) {
          nhiet = Math.min(1, nhiet + dt * cs * .03 * 1.0);
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1530"); g.addColorStop(1, "#16254a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          // buồng lò
          var bx = 20, by = 20, bw = Math.min(W - 40, W * .74), bh = H - 40;
          ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 4;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 12); else ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
          nhanChu(ctx, "Buồng lò vi sóng", bx + 14, by + bh - 14, "#94a3b8", 15);
          // nguồn magnetron
          ctx.fillStyle = "#475569"; ctx.fillRect(bx + 4, by + bh * .3, 22, bh * .4); nhanChu(ctx, "Nguồn vi sóng", bx + 34, by + bh * .3 - 10, "#cbd5e1", 14);
          var cx = bx + bw * .56, cy = by + bh * .52, rx = Math.min(bw * .3, 250), ry = Math.min(bh * .3, 150);
          // sóng vi ba: dao động theo phương thẳng đứng (điện trường E), truyền sang phải
          var w = TAU * 1.2, k = TAU / 150, E = Math.sin(w * t);
          if (hSong) {
            ctx.save(); ctx.strokeStyle = "rgba(251,146,60," + (.35 + cs * .5) + ")"; ctx.lineWidth = 2.5;
            [-.55, 0, .55].forEach(function (f) {
              var y0 = cy + f * ry * 1.4; ctx.beginPath();
              for (var x = bx + 30; x <= bx + bw - 12; x += 3) { var y = y0 - 14 * cs * Math.sin(w * t - k * (x - bx)); if (x === bx + 30) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
              ctx.stroke();
            });
            ctx.restore();
          }
          // thân gà (elip) + đùi gà
          var q = nhiet;
          ctx.fillStyle = mauGa(q); ctx.strokeStyle = "#7c4a1d"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx + rx * .9, cy - ry * .75, rx * .22, ry * .3, -.6, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx - rx * .95, cy + ry * .6, rx * .2, ry * .28, .7, 0, TAU); ctx.fill(); ctx.stroke();
          // hơi nóng
          if (q > .25) { ctx.save(); ctx.strokeStyle = "rgba(226,232,240," + (.15 + q * .35) + ")"; ctx.lineWidth = 3; ctx.lineCap = "round";
            [-.5, 0, .5].forEach(function (f, j) { var x = cx + f * rx; ctx.beginPath(); for (var u = 0; u <= 30; u++) { var yy = cy - ry - 8 - u * 1.4 - ((t * 20 + j * 14) % 20); ctx.lineTo(x + Math.sin(u * .35 + t * 3 + j) * 6, yy) } ctx.stroke() });
            ctx.restore() }
          // phân tử nước: quay qua lại theo điện trường E, biên độ tăng theo công suất
          var s = Math.max(5, Math.min(rx, ry) * .075);
          M.forEach(function (m) {
            var goc = (Math.PI / 2) * E * (.5 + .5 * cs) * (1 + .15 * Math.sin(m[2] * 20)) + m[2] * .3 - Math.PI / 2;
            var rung = nhiet * 4 * cs;
            nuoc(ctx, cx + m[0] * rx + (Math.random() - .5) * rung, cy + m[1] * ry + (Math.random() - .5) * rung, goc, s);
          });
          // thông tin
          var T = 25 + Math.round(nhiet * 75);
          V.hop(ctx, 12 + bx, 12 + by, ["Vi sóng có *f ≈ 2,45 GHz*: điện trường đổi chiều ≈ *2,45·10⁹ lần/s*",
            "Phân tử nước (H₂O) *phân cực* nên quay theo điện trường",
            "Quay, va chạm với phân tử xung quanh → *nội năng tăng, thức ăn nóng lên và chín*"], { co: 14 });
          V.hop(ctx, W - 12, 12, ["Nhiệt độ gà: *" + T + " °C*", nhiet < .4 ? "Trạng thái: còn sống" : nhiet < .95 ? "Trạng thái: đang chín" : "Trạng thái: đã chín"], { phai: true, co: 15 });
          // chú thích điện trường
          var ex = W - 90, ey = H * .6;
          ctx.save(); ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.fillStyle = "#cbd5e1"; ctx.textAlign = "center"; ctx.fillText("Điện trường E", ex, ey - 62);
          V.muiTen(ctx, ex, ey, ex, ey - E * 45, "#f87171", 5); ctx.restore();
          ctx.save(); ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillStyle = "#e2e8f0"; ctx.textAlign = "center";
          nuoc(ctx, ex - 12, ey + 60, 0, 6); ctx.fillText("● O  ○ H", ex + 8, ey + 85); ctx.restore();
        }
      };
      function nhanChu(ctx, s, x, y, mau, co) { ctx.save(); ctx.font = "bold " + co + "px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = mau; ctx.fillText(s, x, y); ctx.restore() }
    }
  });
})();
