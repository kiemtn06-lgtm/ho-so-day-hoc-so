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

  /* ---------- Slide 3: sóng điện từ truyền trong chân không, E ⟂ B ⟂ phương truyền ---------- */
  MP.dangKy("B11", 2, {
    ten: "Sóng điện từ: điện trường E và từ trường B",
    goiY: "Không cần môi trường vật chất: E (đỏ) và B (xanh) vuông góc nhau, cùng vuông góc phương truyền, luôn cùng pha.",
    toc: 0.5,
    tao: function (ui) {
      var n = 3, hE = true, hB = true;      // n: số bước sóng hiển thị (không phải tần số thật)
      ui.truot("Số bước sóng hiển thị", 1.5, 6, 0.5, n, "", function (x) { n = x });
      ui.chon("Hiện điện trường E", hE, function (x) { hE = x });
      ui.chon("Hiện từ trường B", hB, function (x) { hB = x });
      return {
        ve: function (ctx, W, H, t) {
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1530"); g.addColorStop(1, "#16254a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          var x0 = 50, x1 = W - 50, y0 = H * .55, A = Math.min(H * .25, 150), k = TAU * n / (x1 - x0), w = TAU * .5;
          var ph = function (x) { return Math.sin(w * t - k * (x - x0)) };
          ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(226,232,240,.7)"; ctx.beginPath(); ctx.moveTo(x0 - 20, y0); ctx.lineTo(x1 - 30, y0); ctx.stroke();
          V.muiTen(ctx, x1 - 60, y0, x1, y0, "#e2e8f0", 2);
          ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.textAlign = "right"; ctx.fillText("phương truyền (vận tốc c)", x1 + 30, H - 20); ctx.textAlign = "start";
          function cuc(mau, vx, vy) {   // vectơ dao động (vx, vy) tính theo A; E đứng, B xiên (vẽ phối cảnh trục thứ ba)
            ctx.save(); ctx.strokeStyle = mau; ctx.lineWidth = 3; ctx.beginPath();
            for (var x = x0; x <= x1; x += 2) { var u = ph(x), X = x + vx * u * A, Y = y0 + vy * u * A; if (x === x0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) }
            ctx.stroke(); ctx.globalAlpha = .5; ctx.lineWidth = 1.2;
            for (var x2 = x0; x2 <= x1; x2 += 16) { var u2 = ph(x2); ctx.beginPath(); ctx.moveTo(x2, y0); ctx.lineTo(x2 + vx * u2 * A, y0 + vy * u2 * A); ctx.stroke() }
            ctx.restore();
          }
          if (hB) cuc("#38bdf8", .3, -.3);
          if (hE) cuc("#f87171", 0, -1);
          ctx.font = "bold 20px 'Segoe UI',sans-serif";
          if (hE) { ctx.fillStyle = "#fca5a5"; ctx.fillText("Điện trường E", 14, H - 50) }
          if (hB) { ctx.fillStyle = "#7dd3fc"; ctx.fillText("Từ trường B", 14, H - 22) }
          V.hop(ctx, 12, 12, ["Sóng điện từ là *điện từ trường lan truyền* trong không gian", "*E ⟂ B ⟂ phương truyền* (sóng ngang); E và B *cùng pha*",
            "Trong chân không: *c = 3·10⁸ m/s*, và c = λ·f"]);
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
})();
