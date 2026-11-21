/* Mô phỏng Bài 12. Giao thoa sóng: slide 4 (giao thoa sóng mặt nước), slide 7-8 (giao thoa ánh sáng, khoảng vân). */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so;

  /* ---------- Slide 4: hai nguồn kết hợp trên mặt nước ---------- */
  MP.dangKy("B12", 3, {
    ten: "Giao thoa sóng mặt nước: hai nguồn kết hợp S₁, S₂",
    goiY: "Nét liền đỏ: cực đại (hai sóng cùng pha). Nét đứt xanh: cực tiểu (ngược pha). Đổi f, v và khoảng cách S₁S₂.",
    tao: function (ui) {
      var f = 4, v = 20, d = 6, duong = true, RONG = 24;   // cm
      var buf = document.createElement("canvas"), bc = buf.getContext("2d"), img = null;
      ui.truot("Tần số f", 2, 8, 0.5, f, "Hz", function (x) { f = x });
      ui.truot("Tốc độ v", 10, 30, 1, v, "cm/s", function (x) { v = x });
      ui.truot("Khoảng cách S₁S₂", 3, 12, 0.5, d, "cm", function (x) { d = x });
      ui.chon("Vẽ đường cực đại, cực tiểu", duong, function (x) { duong = x });
      return {
        ve: function (ctx, W, H, t) {
          var s = W / RONG, buoc = 3, bw = Math.ceil(W / buoc), bh = Math.ceil(H / buoc), lam = v / f, k = TAU / lam, w = TAU * f;
          if (buf.width !== bw || buf.height !== bh || !img) { buf.width = bw; buf.height = bh; img = bc.createImageData(bw, bh) }
          var dt = img.data, cx = W / 2, cy = H / 2, x1 = cx - d / 2 * s, x2 = cx + d / 2 * s;
          for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
            var X = i * buoc + 1.5, Y = j * buoc + 1.5, r1 = Math.hypot(X - x1, Y - cy) / s, r2 = Math.hypot(X - x2, Y - cy) / s;
            var u = (Math.sin(w * t - k * r1) / Math.sqrt(1 + r1 / 3) + Math.sin(w * t - k * r2) / Math.sqrt(1 + r2 / 3)) * .5;
            var p = (j * bw + i) * 4, up = Math.max(0, u);
            dt[p] = 24 + 150 * up + 20 * u; dt[p + 1] = 80 + 140 * up + 30 * u; dt[p + 2] = 130 + 110 * up + 40 * u; dt[p + 3] = 255;
          }
          bc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(buf, 0, 0, W, H);
          if (duong) {   // hyperbol d₁ − d₂ = m·λ/2 (m chẵn: cực đại, m lẻ: cực tiểu), S₁ ở x = −d/2, S₂ ở x = +d/2
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
          [[x1, "S₁"], [x2, "S₂"]].forEach(function (o) {
            ctx.beginPath(); ctx.arc(o[0], cy, 7 + 1.5 * Math.sin(w * t), 0, TAU); ctx.fillStyle = "#f8fafc"; ctx.fill(); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "#fff"; ctx.font = "bold 17px 'Segoe UI',sans-serif"; ctx.fillText(o[1], o[0] - 9, cy + 28);
          });
          V.kichThuoc(ctx, x1, x2, Math.min(H - 12, cy + 56), "S₁S₂ = " + so(d) + " cm", "#fde047");
          V.hop(ctx, 12, 12, ["Bước sóng *λ = v/f = " + so(lam, 2) + " cm*", "Hai cực đại liền kề trên S₁S₂ cách nhau *λ/2 = " + so(lam / 2, 2) + " cm*",
            "Cực đại: *d₂ − d₁ = kλ* · Cực tiểu: *d₂ − d₁ = (k + ½)λ*"]);
        }
      };
    }
  });

  /* ---------- Slide 7, 8: thí nghiệm Y-âng, i = λD/a ---------- */
  function rgbLam(l) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1 } else if (l < 490) { g = (l - 440) / 50; b = 1 } else if (l < 510) { g = 1; b = (510 - l) / 20 }
    else if (l < 580) { r = (l - 510) / 70; g = 1 } else if (l < 645) { r = 1; g = (645 - l) / 65 } else r = 1;
    var f = l < 420 ? .3 + .7 * (l - 380) / 40 : l > 700 ? .3 + .7 * (780 - l) / 80 : 1; return [r * f, g * f, b * f];
  }
  var defYang = {
    ten: "Giao thoa Y-âng: khoảng vân i = λD/a",
    goiY: "Đổi bước sóng λ (màu ánh sáng), khoảng cách hai khe a và khoảng cách D đến màn, rồi quan sát khoảng vân i.",
    tao: function (ui) {
      var lam = 600, a = 0.5, D = 1.5, RONG = 12;   // λ (nm), a (mm), D (m), bề rộng màn quan sát (mm)
      ui.truot("Bước sóng λ", 400, 760, 10, lam, "nm", function (x) { lam = x });
      ui.truot("Khoảng cách hai khe a", 0.2, 2, 0.05, a, "mm", function (x) { a = x });
      ui.truot("Khoảng cách D", 0.5, 3, 0.1, D, "m", function (x) { D = x });
      return {
        ve: function (ctx, W, H) {
          ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
          var i = lam * 1e-3 * D / a, mm = W / RONG, yM = H * .07, hM = H * .36, rgb = rgbLam(lam), n = Math.ceil(W);   // i (mm)
          var I = function (x) { var q = Math.cos(Math.PI * ((x - W / 2) / mm) / i); return q * q };
          var img = ctx.createImageData(n, 1), row = img.data;
          for (var x = 0; x < n; x++) { var p = x * 4, e = I(x); row[p] = 255 * rgb[0] * e; row[p + 1] = 255 * rgb[1] * e; row[p + 2] = 255 * rgb[2] * e; row[p + 3] = 255 }
          var tmp = document.createElement("canvas"); tmp.width = n; tmp.height = 1; tmp.getContext("2d").putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, yM, W, hM);
          ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1; ctx.strokeRect(0, yM, W, hM);
          ctx.fillStyle = "#fff"; ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.fillText("Màn quan sát E (rộng " + RONG + " mm)", 10, yM + hM - 8);
          var yG = H * .6, hG = H * .17, mau = "rgb(" + Math.round(255 * rgb[0]) + "," + Math.round(255 * rgb[1]) + "," + Math.round(255 * rgb[2]) + ")";
          ctx.strokeStyle = mau; ctx.lineWidth = 2.5; ctx.beginPath();
          for (var x2 = 0; x2 <= W; x2 += 2) { var y = yG + hG * (1 - I(x2)); if (x2 === 0) ctx.moveTo(x2, y); else ctx.lineTo(x2, y) }
          ctx.stroke(); ctx.fillStyle = "#9fb0cc"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText("Đồ thị cường độ sáng I theo vị trí trên màn", 10, yG - 6);
          var xc = W / 2, xi = xc + i * mm;      // vân sáng trung tâm và vân sáng bậc 1
          if (xi < W - 4) {
            ctx.setLineDash([5, 4]); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 1.5;
            [xc, xi].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q, yM + hM); ctx.lineTo(q, yG + hG + 8); ctx.stroke() }); ctx.setLineDash([]);
            V.kichThuoc(ctx, xc, xi, yM + hM + 26, "i = " + so(i, 3) + " mm", "#fde047");
          } else { ctx.fillStyle = "#fde047"; ctx.font = "bold 15px 'Segoe UI',sans-serif"; ctx.fillText("i = " + so(i, 2) + " mm: vân rộng hơn vùng quan sát", 10, yM + hM + 24) }
          V.hop(ctx, 12, H - 74, ["*i = λD/a = " + so(lam * 1e-3, 2) + " μm × " + so(D, 1) + " m / " + so(a, 2) + " mm = " + so(i, 3) + " mm*",
            "Vân thưa ra khi tăng λ, tăng D hoặc giảm a"], { co: 15 });
        }
      };
    }
  };
  MP.dangKy("B12", 6, defYang);
  MP.dangKy("B12", 7, defYang);
})();
