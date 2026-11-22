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

  /* ---------- Slide 11: lò vi sóng nấu gà (nhìn từ trên xuống) ----------
     Vật lí: magnetron phát vi sóng f = 2,45 GHz (λ ≈ 12,2 cm) qua ống dẫn sóng vào khoang kim loại; sóng phản xạ nhiều lần ở thành lò và chồng lên nhau
     tạo SÓNG ĐỨNG: các điểm nóng (bụng, E mạnh) và điểm lạnh (nút, E ≈ 0) đứng yên, cách nhau λ/2 ≈ 6,1 cm. Đĩa xoay (≈ 5 vòng/phút) mang gà đi qua
     lần lượt các điểm nóng nên gà chín đều; tắt đĩa xoay thì gà chín loang lổ (cũng là cách đo λ, rồi c = λ·f, bằng sô-cô-la).
     Phân tử nước trong kính lúp quay theo điện trường TẠI CHỖ: mạnh ở điểm nóng, gần như đứng yên ở nút.
     Ảnh: ga-song.webp (gà sống, Ibrahim Husain Meraj, CC BY-SA 4.0, Wikimedia Commons); ga-chin.webp là chính ảnh đó chỉnh màu thành gà chín. */
  MP.dangKy("B11", 10, {
    ten: "Lò vi sóng nấu gà: sóng đứng trong lò, đĩa xoay và phân tử nước",
    goiY: "Nhìn từ trên xuống. Vi sóng phản xạ ở thành kim loại tạo sóng đứng: điểm nóng (màu) và điểm lạnh đứng yên. Đĩa xoay đưa gà qua các điểm nóng. Thử tắt đĩa xoay, kéo kính lúp đến điểm nóng / điểm lạnh.",
    toc: 0.5,
    tao: function (ui) {
      var LC = 36.72, M5 = 6;                             // cạnh khoang lò (cm) = 6 nửa bước sóng; tâm đĩa rơi vào nút
      var xong = false, cs = 0.7, zoom = 3, hTruong = true, hDT = true, xoay = true, toan = false, phi = 0, keo = false, vao = 0;
      var lensP = [15.3, 9.18], hit = { lens: null, panel: null, khoang: null };
      var N = 44, heat = new Float32Array(N * N), mask = null, w0 = TAU * 1.2;
      var IMG = {}, nutZ, nutX;
      ["ga-song", "ga-chin"].forEach(function (k) { var im = new Image(); im.src = "k11-B11/" + k + ".webp"; IMG[k] = im });
      ui.truot("Công suất vi sóng", 0.1, 1, 0.05, cs, "", function (x) { cs = x });
      ui.truot("Độ phóng đại phân tử", 1, 6, 0.5, zoom, "×", function (x) { zoom = x });
      nutX = ui.nut("⏸ Tắt đĩa xoay", function () { xoay = !xoay; nutX.textContent = xoay ? "⏸ Tắt đĩa xoay" : "▶ Bật đĩa xoay" });
      ui.chon("Hiện sóng đứng trong lò", hTruong, function (x) { hTruong = x });
      ui.chon("Hiện điện tích δ⁺, δ⁻", hDT, function (x) { hDT = x });
      nutZ = ui.nut("🔍 Phóng to ảnh phân tử", function () { api.doiToan() });
      ui.nut("🗑 Gà mới", function () { heat.fill(0); xong = false });
      ui.nut("▶ Video tham khảo", function () { window.open("https://www.youtube.com/watch?v=kp33ZprO0Ck", "_blank", "noopener") });

      var kx = M5 * Math.PI / LC, kb = 5 * Math.PI / LC;
      /* biên độ điện trường tại (x, y) cm, khoảng −1..1: chồng hai kiểu sóng đứng của khoang (6×6 và 5×5 nửa bước sóng), như lò thật có nhiều kiểu sóng;
         điểm nóng cách nhau xấp xỉ λ/2 */
      function sE(x, y) { return .62 * Math.sin(kx * x) * Math.sin(kx * y) + .42 * Math.sin(kb * x) * Math.sin(kb * y) }
      (function () { var best = 0; for (var x = 9; x <= 27; x += .2) for (var y = 5; y <= 12; y += .2) { var v = Math.abs(sE(x, y)); if (v > best) { best = v; lensP = [x, y] } } })();   // kính lúp đặt sẵn ở một điểm nóng
      var VT = [[0, 0, .0], [1, 0, .17], [.5, .87, .31], [-.5, .87, .46], [-1, 0, .6], [-.5, -.87, .73], [.5, -.87, .89]];

      function nuoc(ctx, x, y, th, s, dt) {   // H₂O: O đỏ, hai H trắng lệch ±52°; mô men lưỡng cực p hướng từ O sang H
        ctx.save(); ctx.translate(x, y); ctx.rotate(-th);
        ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "rgba(15,23,42,.5)"; ctx.lineWidth = Math.max(1, s * .06);
        [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.arc(Math.cos(d * .91) * s * 1.35, Math.sin(d * .91) * s * 1.35, s * .62, 0, TAU); ctx.fill(); ctx.stroke() });
        var g = ctx.createRadialGradient(-s * .3, -s * .3, s * .1, 0, 0, s); g.addColorStop(0, "#fca5a5"); g.addColorStop(1, "#dc2626");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
        if (dt && s > 14) {
          var c = Math.cos(th), sn = -Math.sin(th);
          ctx.save(); ctx.font = "bold " + Math.round(s * .85) + "px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#fca5a5"; ctx.fillText("δ⁻", x - c * s * 1.9, y - sn * s * 1.9);
          ctx.fillStyle = "#bfdbfe"; ctx.fillText("δ⁺", x + c * s * 2.9, y + sn * s * 2.9);
          ctx.restore();
        }
      }
      /* khung phân tử tại vị trí có biên độ trường f (−1..1): E(t) = f·cos ωt, phân tử quay theo E */
      function truongPT(ctx, cx, cy, R, t, f, dt, vien) {
        var E = f * Math.cos(w0 * t);
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
        var g = ctx.createRadialGradient(cx, cy, R * .1, cx, cy, R); g.addColorStop(0, "#14275a"); g.addColorStop(1, "#08122e"); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        ctx.strokeStyle = "rgba(248,113,113," + (.12 + .3 * Math.abs(E)) + ")"; ctx.lineWidth = 1.5; ctx.setLineDash([7, 7]);
        [-.75, -.4, 0, .4, .75].forEach(function (u) { ctx.beginPath(); ctx.moveTo(cx + u * R, cy - R); ctx.lineTo(cx + u * R, cy + R); ctx.stroke() });
        ctx.setLineDash([]);
        if (R > 60) { var ah = R * .3 * E; [-.88, .88].forEach(function (u) { if (Math.abs(ah) > 3) V.muiTen(ctx, cx + u * R * .9, cy + ah * .5, cx + u * R * .9, cy - ah * .5, "#f87171", Math.max(3, R * .02)) }) }
        var s = R * .04 * zoom, amp = (Math.PI / 2) * (.3 + .7 * cs), rung = Math.abs(f) * cs * R * .015;
        VT.forEach(function (m, i) {
          var th = amp * f * Math.cos(w0 * t - m[2] * .8), jx = rung * Math.sin(t * 7.3 + i * 2.1), jy = rung * Math.cos(t * 6.1 + i * 3.7);
          nuoc(ctx, cx + m[0] * R * .62 + jx, cy + m[1] * R * .62 + jy, th, s, dt);
        });
        ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = vien || 3; ctx.strokeStyle = "#cbd5e1"; ctx.stroke();
      }
      function txt(ctx, s, x, y, mau, co, can) { ctx.save(); ctx.font = "bold " + (co || 14) + "px 'Segoe UI',sans-serif"; ctx.textAlign = can || "left"; ctx.textBaseline = "middle"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(8,18,46,.9)"; ctx.strokeText(s, x, y); ctx.fillStyle = mau; ctx.fillText(s, x, y); ctx.restore() }
      function trong(x, y, c) { return !!c && Math.hypot(x - c[0], y - c[1]) <= c[2] }
      function moTa(f) { var a = Math.abs(f); return a > .7 ? "điểm nóng (bụng sóng, E mạnh)" : a < .25 ? "điểm lạnh (gần nút, E ≈ 0)" : "giữa điểm nóng và điểm lạnh" }

      /* mặt nạ hình con gà (N×N) lấy từ kênh alpha của ảnh; mở file trực tiếp (file://) không đọc được thì dùng hình elip */
      function layMask() {
        var im = IMG["ga-song"]; if (!(im.complete && im.naturalWidth)) return null;
        var m = new Float32Array(N * N);
        try {
          var c = document.createElement("canvas"); c.width = c.height = N; var x = c.getContext("2d"); x.drawImage(im, 0, 0, N, N);
          var d = x.getImageData(0, 0, N, N).data; for (var i = 0; i < N * N; i++) m[i] = d[i * 4 + 3] / 255;
        } catch (e) { for (var j = 0; j < N; j++) for (var i2 = 0; i2 < N; i2++) { var u = (i2 + .5) / N - .5, v = (j + .5) / N - .5; m[j * N + i2] = (u * u / .2 + v * v / .2) < 1 ? 1 : 0 } }
        return m;
      }
      var cvHeat = document.createElement("canvas"); cvHeat.width = cvHeat.height = N; var ctxHeat = cvHeat.getContext("2d"), imgHeat = ctxHeat.createImageData(N, N);
      var cvChin = document.createElement("canvas"), ctxChin = cvChin.getContext("2d");
      var FM = 64, cvF = document.createElement("canvas"); cvF.width = cvF.height = FM; var ctxF = cvF.getContext("2d"), imgF = ctxF.createImageData(FM, FM);
      var GA = 20;   // bề rộng con gà (cm)

      function napNhiet(dt) {      // mỗi ô thịt gà (theo toạ độ gắn với gà) nhận nhiệt tỉ lệ với E² trung bình tại vị trí hiện tại của nó
        if (!mask) return;
        var c = Math.cos(phi), s = Math.sin(phi), hcm = GA * 550 / 560, k = cs * dt * .32;
        for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
          var id = j * N + i; if (mask[id] < .3) continue;
          var u = ((i + .5) / N - .5) * GA, v = ((j + .5) / N - .5) * hcm, x = LC / 2 + u * c - v * s, y = LC / 2 + u * s + v * c, e = sE(x, y);
          heat[id] = Math.min(1.8, heat[id] + k * e * e);
        }
        // dẫn nhiệt trong thịt (chậm): mỗi ô san sẻ nhiệt với ô bên cạnh
        var D = Math.min(.2, dt * .8), tmp = heat.slice();
        for (var j2 = 1; j2 < N - 1; j2++) for (var i2 = 1; i2 < N - 1; i2++) { var q = j2 * N + i2; if (mask[q] < .3) continue; var tbc = (tmp[q - 1] + tmp[q + 1] + tmp[q - N] + tmp[q + N]) / 4; heat[q] += D * (tbc - tmp[q]) }
      }
      function veGa(ctx, X0, Y0, sc) {   // con gà quay theo đĩa; phần đã chín lấy từ ảnh chín, ô quá nóng sẫm màu (cháy)
        var iS = IMG["ga-song"], iC = IMG["ga-chin"];
        if (!(iS.complete && iS.naturalWidth)) { txt(ctx, "Đang tải ảnh gà…", X0, Y0, "#e2e8f0", 15, "center"); return }
        var wc = GA * sc, hc = wc * 550 / 560;
        var d = imgHeat.data;
        for (var i = 0; i < N * N; i++) { var h = heat[i], a = Math.min(1, h); a = a * a * (3 - 2 * a); d[i * 4] = 60; d[i * 4 + 1] = 22; d[i * 4 + 2] = 6; d[i * 4 + 3] = Math.round(255 * (mask ? mask[i] : 1) * a) }
        ctxHeat.putImageData(imgHeat, 0, 0);
        var W2 = Math.max(2, Math.round(wc)), H2 = Math.max(2, Math.round(hc));
        if (cvChin.width !== W2 || cvChin.height !== H2) { cvChin.width = W2; cvChin.height = H2 }
        ctxChin.globalCompositeOperation = "source-over"; ctxChin.clearRect(0, 0, W2, H2);
        if (iC.complete && iC.naturalWidth) ctxChin.drawImage(iC, 0, 0, W2, H2);
        ctxChin.globalCompositeOperation = "destination-in"; ctxChin.imageSmoothingEnabled = true; ctxChin.drawImage(cvHeat, 0, 0, W2, H2);
        // vùng cháy: nhiệt vượt ngưỡng chín nhiều → phủ nâu sẫm, chỉ trên phần thịt đã chín (source-atop)
        for (var j = 0; j < N * N; j++) { var b = Math.max(0, Math.min(1, (heat[j] - 1.45) / .35)); d[j * 4] = 40; d[j * 4 + 1] = 14; d[j * 4 + 2] = 4; d[j * 4 + 3] = Math.round(220 * b) }
        ctxHeat.putImageData(imgHeat, 0, 0);
        ctxChin.globalCompositeOperation = "source-atop"; ctxChin.drawImage(cvHeat, 0, 0, W2, H2);
        ctxChin.globalCompositeOperation = "source-over";
        ctx.save(); ctx.translate(X0, Y0); ctx.rotate(phi);
        ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 14; ctx.drawImage(iS, -wc / 2, -hc / 2, wc, hc); ctx.shadowBlur = 0;
        ctx.drawImage(cvChin, -wc / 2, -hc / 2, wc, hc);
        ctx.restore();
      }
      function veTruong(ctx, X, Y, L, t, alpha) {   // sóng đứng E(x,y,t) = E₀·sin(kx)·sin(ky)·cos ωt : đỏ E hướng lên, xanh E hướng xuống, đậm = mạnh
        var d = imgF.data, ct = Math.cos(w0 * t);
        for (var j = 0; j < FM; j++) for (var i = 0; i < FM; i++) {
          var v = sE((i + .5) / FM * LC, (j + .5) / FM * LC) * ct, id = (j * FM + i) * 4;
          if (v >= 0) { d[id] = 248; d[id + 1] = 113; d[id + 2] = 113 } else { d[id] = 96; d[id + 1] = 165; d[id + 2] = 250 }
          d[id + 3] = Math.round(255 * Math.min(1, Math.abs(v)) * alpha);
        }
        ctxF.putImageData(imgF, 0, 0);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(cvF, X, Y, L, L); ctx.restore();
      }
      var api = {
        vao: function () { return vao }, keo: function (b) { keo = b }, dangKeo: function () { return keo },
        chamLens: function (x, y) { return !toan && trong(x, y, hit.lens) },
        chamPanel: function (x, y) { return trong(x, y, hit.panel) },
        doiToan: function () { toan = !toan; nutZ.textContent = toan ? "↩ Thu nhỏ" : "🔍 Phóng to ảnh phân tử" },
        dat: function (x, y) { var k = hit.khoang; if (!k) return; lensP = [Math.max(1, Math.min(LC - 1, (x - k[0]) / k[2])), Math.max(1, Math.min(LC - 1, (y - k[1]) / k[2]))] }
      };
      function gan(cv) {      /* kéo kính lúp; mỗi canvas chỉ gắn một lần, đọc trạng thái của mô phỏng đang chạy */
        cv.__ga = api; if (cv.__gaGan) return; cv.__gaGan = true;
        function toaDo(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
        function song(a) { return a && performance.now() - a.vao() < 400 }
        cv.addEventListener("pointerdown", function (e) { var a = cv.__ga; if (!song(a)) return; var p = toaDo(e); if (a.chamLens(p[0], p[1])) { a.keo(true); a.dat(p[0], p[1]); try { cv.setPointerCapture(e.pointerId) } catch (x) {} e.preventDefault() } });
        cv.addEventListener("pointermove", function (e) { var a = cv.__ga; if (!song(a)) return; var p = toaDo(e); if (a.dangKeo()) a.dat(p[0], p[1]); cv.style.cursor = a.dangKeo() ? "grabbing" : a.chamLens(p[0], p[1]) ? "grab" : "" });
        cv.addEventListener("pointerup", function () { var a = cv.__ga; if (a) a.keo(false) });
        cv.addEventListener("dblclick", function (e) { var a = cv.__ga; if (!song(a)) return; var p = toaDo(e); if (a.chamPanel(p[0], p[1])) a.doiToan() });
      }
      return {
        datLai: function () { heat.fill(0); phi = 0; xong = false },
        ve: function (ctx, W, H, t, dt) {
          vao = performance.now(); gan(ctx.canvas);
          if (!mask) mask = layMask();
          if (xoay) phi += dt * .52;            // ≈ 5 vòng/phút như đĩa xoay thật
          if (!xong) napNhiet(dt);
          // thống kê độ chín
          var tong = 0, n = 0, tong2 = 0, chay = 0;
          if (mask) for (var i = 0; i < N * N; i++) if (mask[i] > .5) { var h = Math.min(1, heat[i]); tong += h; tong2 += h * h; n++; if (heat[i] > 1.45) chay++ }
          var tb = n ? tong / n : 0; if (tb >= .98) xong = true; var lech = n ? Math.sqrt(Math.max(0, tong2 / n - tb * tb)) : 0, T = 25 + Math.round(tb * 50);
          var fL = sE(lensP[0], lensP[1]);
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1530"); g.addColorStop(1, "#16254a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          if (toan) {   // ====== phóng to ảnh phân tử toàn khung ======
            var R = Math.min(W * .46, (H - 124) / 2), pcy2 = H - R - 8;
            hit.lens = null; hit.panel = [W / 2, pcy2, R];
            truongPT(ctx, W / 2, pcy2, R, t, fL, hDT, 5);
            var E = fL * Math.cos(w0 * t);
            txt(ctx, "Ảnh phóng to: phân tử nước (H₂O) tại vị trí kính lúp: " + moTa(fL), 16, 24, "#e2e8f0", 18);
            txt(ctx, "Điện trường tại chỗ: " + (Math.abs(fL) < .1 ? "gần như bằng 0 (nút sóng)" : E > .05 ? "hướng lên ↑" : E < -.05 ? "hướng xuống ↓" : "đang đổi chiều"), 16, 52, E > 0 ? "#fca5a5" : "#93c5fd", 16);
            txt(ctx, "Phân tử phân cực quay theo E, đảo chiều ≈ 2,45·10⁹ lần/s (ở đây phát chậm). Ở điểm nóng quay mạnh, ở nút gần như đứng yên.", 16, 78, "#cbd5e1", 14);
            txt(ctx, "Quay và va chạm với phân tử xung quanh → nội năng tăng. Nhiệt độ trung bình của gà: " + T + " °C", 16, 100, "#fde047", 14);
            txt(ctx, "Bấm đúp vào hình hoặc “Thu nhỏ” để quay lại", W - 16, H - 16, "#94a3b8", 13, "right");
            return;
          }
          var pan = W >= 880, bx = 16, by = 16, bw = pan ? W * .62 : W - 32, bh = H - 32;
          // ====== khoang lò nhìn từ trên xuống ======
          var L = Math.min(bw - 200, bh - 40), qx = bx + bw - L - 12, qy = by + 30, sc = L / LC;
          if (L < 200) { L = Math.min(bw - 24, bh - 40); qx = bx + (bw - L) / 2; sc = L / LC }
          hit.khoang = [qx, qy, sc];
          var P = function (x, y) { return [qx + x * sc, qy + y * sc] };
          ctx.fillStyle = "#0f172a"; ctx.fillRect(qx, qy, L, L);
          ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 7; ctx.strokeRect(qx - 3.5, qy - 3.5, L + 7, L + 7);
          txt(ctx, "Khoang lò: thành kim loại phản xạ vi sóng", qx + L / 2, qy - 16, "#94a3b8", 13, "center");
          // lỗ ống dẫn sóng ở thành phải (vi sóng từ magnetron đi vào)
          var s1 = P(LC, 11), s2 = P(LC, 19.6);
          ctx.fillStyle = "#f59e0b"; ctx.fillRect(s1[0] - 4, s1[1], 9, s2[1] - s1[1]);
          txt(ctx, "Lỗ ống dẫn sóng", s1[0] - 8, s1[1] - 12, "#fbbf24", 12, "right");
          txt(ctx, "(vi sóng từ magnetron)", s1[0] - 8, s1[1] + 4 - 30, "#fbbf24", 11, "right");
          if (hTruong) veTruong(ctx, qx, qy, L, t, .55);
          // đĩa xoay thủy tinh
          var dc = P(LC / 2, LC / 2), rD = 14 * sc;
          ctx.save(); ctx.fillStyle = "rgba(186,230,253,.16)"; ctx.strokeStyle = "rgba(203,213,225,.9)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(dc[0], dc[1], rD, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = "rgba(226,232,240,.35)"; ctx.lineWidth = 2;
          for (var j = 0; j < 12; j++) { var aa = phi + j * Math.PI / 6; ctx.beginPath(); ctx.moveTo(dc[0] + Math.cos(aa) * rD * .93, dc[1] + Math.sin(aa) * rD * .93); ctx.lineTo(dc[0] + Math.cos(aa) * rD, dc[1] + Math.sin(aa) * rD); ctx.stroke() }
          ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(dc[0] + Math.cos(phi) * rD * .96, dc[1] + Math.sin(phi) * rD * .96, 5, 0, TAU); ctx.fill();
          ctx.restore();
          veGa(ctx, dc[0], dc[1], sc);
          if (hTruong) {
            veTruong(ctx, qx, qy, L, t, .22);   // trường vẫn có trong gà
            var a1 = P(LC / M5 / 2, LC - 1.4), a2 = P(LC / M5 * 1.5, LC - 1.4);
            V.kichThuoc(ctx, a1[0], a2[0], a1[1], "≈ λ/2 ≈ 6 cm", "#fde047");
          }
          if (xoay) { ctx.save(); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(dc[0], dc[1], rD + 10, -2.4, -1.3); ctx.stroke(); var ea = -1.3; V.muiTen(ctx, dc[0] + Math.cos(ea - .15) * (rD + 10), dc[1] + Math.sin(ea - .15) * (rD + 10), dc[0] + Math.cos(ea) * (rD + 10), dc[1] + Math.sin(ea) * (rD + 10), "#fde047", 2.5); ctx.restore() }
          // kính lúp kéo được
          var lp = P(lensP[0], lensP[1]), rl = Math.max(24, L * .085);
          hit.lens = [lp[0], lp[1], rl + 8];
          truongPT(ctx, lp[0], lp[1], rl, t, fL, false, 3);
          ctx.save(); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(lp[0], lp[1], rl + 4, 0, TAU); ctx.stroke();
          ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(lp[0] + (rl + 4) * .71, lp[1] + (rl + 4) * .71); ctx.lineTo(lp[0] + (rl + 4) * .71 + 18, lp[1] + (rl + 4) * .71 + 18); ctx.stroke(); ctx.restore();
          txt(ctx, "Kéo kính lúp", lp[0], lp[1] - rl - 14, "#fde047", 12, "center");
          // cột chữ bên trái khoang lò
          var tx = bx + 4, tw = qx - bx - 16;
          if (tw > 150) {
            var dong = [["NHÌN TỪ TRÊN XUỐNG", "#e2e8f0", 14], ["Vi sóng f ≈ 2,45 GHz,", "#cbd5e1", 13], ["λ = c/f ≈ 12,2 cm", "#fde047", 13], ["", "", 6],
              ["Phản xạ ở thành kim loại", "#cbd5e1", 13], ["→ SÓNG ĐỨNG:", "#cbd5e1", 13], ["điểm nóng / điểm lạnh", "#fde047", 13], ["đứng yên, cách nhau ≈ λ/2", "#cbd5e1", 13], ["", "", 6],
              ["■ đỏ: E hướng lên", "#f87171", 13], ["■ xanh: E hướng xuống", "#60a5fa", 13], ["đậm = mạnh, tối = nút", "#94a3b8", 12], ["", "", 6],
              [xoay ? "Đĩa xoay đưa gà đi qua" : "Đĩa xoay ĐANG TẮT:", xoay ? "#cbd5e1" : "#fb923c", 13], [xoay ? "các điểm nóng → chín đều" : "chỗ chín, chỗ sống, chỗ cháy", xoay ? "#86efac" : "#fb923c", 13]];
            var yy = qy + 8; dong.forEach(function (d) { if (d[0]) txt(ctx, d[0], tx, yy, d[1], d[2]); yy += d[2] + 9 });
          }
          // cột phải: trạng thái, ảnh phân tử phóng to, mặt cắt sóng đứng
          var deu = tb > .05 ? Math.max(0, 1 - lech / tb) : 1;
          V.hop(ctx, W - 16, 16, ["Nhiệt độ trung bình: *" + T + " °C*",
            "Độ đều: *" + Math.round(deu * 100) + "%*" + (chay ? "  ·  có chỗ cháy" : ""),
            xong ? "Gà đã chín: lò tự tắt" : tb < .4 ? "Gà còn sống" : "Gà đang chín"], { phai: true, co: 14 });
          if (pan) {
            var px0 = bx + bw + 16, pw = W - px0 - 16, pr = Math.max(55, Math.min(pw / 2 - 4, (H - 330) / 2, 140)), pcx = px0 + pw / 2, pcy = 120 + pr;
            hit.panel = [pcx, pcy, pr];
            truongPT(ctx, pcx, pcy, pr, t, fL, hDT, 4);
            txt(ctx, "Phân tử nước tại kính lúp", pcx, pcy - pr - 26, "#e2e8f0", 14, "center");
            txt(ctx, moTa(fL), pcx, pcy - pr - 10, Math.abs(fL) > .7 ? "#fca5a5" : "#93c5fd", 12, "center");
            txt(ctx, "(bấm đúp để phóng to toàn khung)", pcx, pcy + pr + 12, "#94a3b8", 11, "center");
            // mặt cắt: sóng tới + sóng phản xạ giữa hai thành kim loại → sóng đứng
            var my = pcy + pr + 36, mh = H - my - 16;
            if (mh > 70) {
              var mx0 = px0 + 8, mx1 = px0 + pw - 8, mc = my + mh / 2 + 6, ma = mh * .3, ct = Math.cos(w0 * t);
              txt(ctx, "Mặt cắt: sóng tới + sóng phản xạ → sóng đứng", px0 + pw / 2, my + 4, "#e2e8f0", 12, "center");
              ctx.fillStyle = "#94a3b8"; ctx.fillRect(mx0 - 5, mc - ma - 8, 5, 2 * ma + 16); ctx.fillRect(mx1, mc - ma - 8, 5, 2 * ma + 16);
              var XX = function (x) { return mx0 + (mx1 - mx0) * x / LC };
              ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(148,163,184,.6)"; ctx.lineWidth = 1.2;
              [1, -1].forEach(function (sg) { ctx.beginPath(); for (var x = 0; x <= LC; x += .2) { var y = mc - sg * ma * Math.abs(Math.sin(kx * x)); if (x === 0) ctx.moveTo(XX(x), y); else ctx.lineTo(XX(x), y) } ctx.stroke() });
              ctx.restore();
              ctx.strokeStyle = "#f87171"; ctx.lineWidth = 2.5; ctx.beginPath();
              for (var x2 = 0; x2 <= LC; x2 += .2) { var y2 = mc - ma * Math.sin(kx * x2) * ct; if (x2 === 0) ctx.moveTo(XX(x2), y2); else ctx.lineTo(XX(x2), y2) }
              ctx.stroke();
              ctx.save(); ctx.font = "bold 11px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
              for (var m = 0; m <= 2 * M5; m++) { var xm = XX(m * LC / (2 * M5)); if (m % 2 === 0) { ctx.fillStyle = "#93c5fd"; ctx.beginPath(); ctx.arc(xm, mc, 3, 0, TAU); ctx.fill(); ctx.fillText("N", xm, mc + ma + 10) } else { ctx.fillStyle = "#fde047"; ctx.fillText("B", xm, mc - ma - 10) } }
              ctx.restore();
              txt(ctx, "N: nút (lạnh)  ·  B: bụng (nóng)", px0 + pw / 2, my + mh, "#94a3b8", 11, "center");
            }
          } else hit.panel = null;
          ctx.save(); ctx.font = "11px 'Segoe UI',sans-serif"; ctx.fillStyle = "#64748b"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.fillText("Ảnh gà: Ibrahim Husain Meraj, CC BY-SA 4.0, Wikimedia Commons (phần chín là ảnh chỉnh màu). Mẫu sóng đứng là mô hình đơn giản hóa.", bx + 4, H - 6); ctx.restore();
        }
      };
    }
  });
})();
