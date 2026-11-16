/* Mô phỏng Bài 9. Sóng ngang, sóng dọc: slide 2 (sóng trên dây và trên lò xo), slide 10 (mô hình sóng âm nén - dãn). */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so;
  function tron(ctx, x, y, r, mau, vien) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = mau; ctx.fill(); if (vien) { ctx.strokeStyle = vien; ctx.lineWidth = 1.5; ctx.stroke() } }
  function chu(ctx, txt, x, y, mau, co, canh) { ctx.save(); ctx.font = "bold " + (co || 15) + "px 'Segoe UI',sans-serif"; ctx.fillStyle = mau; ctx.textAlign = canh || "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y); ctx.restore() }
  function ngauNhien(h) { return function () { h |= 0; h = h + 0x6D2B79F5 | 0; var t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function tay(ctx, x, y, mau) {      // nắm tay đơn giản
    ctx.save(); ctx.fillStyle = mau || "#f2c6a0"; ctx.strokeStyle = "#7c4a2d"; ctx.lineWidth = 1.5;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 34, y - 15, 30, 30, 9); else ctx.rect(x - 34, y - 15, 30, 30); ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 70, y - 9, 38, 18); ctx.strokeRect(x - 70, y - 9, 38, 18); ctx.restore();
  }

  /* ---------- Slide 2: hai loại chuyển động sóng (dây và lò xo) ---------- */
  MP.dangKy("B9", 1, {
    ten: "Hai loại chuyển động sóng: sóng trên dây và sóng trên lò xo",
    goiY: "Nhìn phần tử được tô đỏ ở mỗi bên: nó dao động theo phương nào so với phương truyền sóng?",
    toc: 0.5,
    tao: function (ui) {
      var f = 1, v = 40, DAI = 100, ketLuan = false, phanTu = true;     // cm, cm/s
      ui.truot("Tần số f", 0.5, 2, 0.25, f, "Hz", function (x) { f = x });
      ui.chon("Hiện các phần tử dây", phanTu, function (x) { phanTu = x });
      ui.chon("Hiện kết luận", ketLuan, function (x) { ketLuan = x });
      return {
        ve: function (ctx, W, H, t) {
          var w = TAU * f, lam = v / f, L = 110, R = W - 50, s = (R - L) / DAI, dau = Math.min(v * t, DAI + 1);
          var pha = function (x) { return x <= v * t ? Math.sin(w * (t - x / v)) : 0 }, vt = function (x) { return x <= v * t ? Math.cos(w * (t - x / v)) : 0 };
          var X = function (x) { return L + x * s };
          ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
          var h2 = H / 2;
          ctx.strokeStyle = "#24304a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h2); ctx.lineTo(W, h2); ctx.stroke();
          var xd = 50;                          // phần tử được đánh dấu ở x = 50 cm
          // ---- nửa trên: sợi dây ----
          var y1 = h2 * .56, ky = Math.min(h2 * .26, 70);
          chu(ctx, "Rung đầu sợi dây lên – xuống", 16, 22, "#e2e8f0", 16);
          ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.beginPath(); ctx.moveTo(L, y1); ctx.lineTo(R, y1); ctx.stroke(); ctx.restore();
          ctx.beginPath(); for (var x = 0; x <= DAI + .01; x += .5) ctx[x ? "lineTo" : "moveTo"](X(x), y1 - ky * pha(x));
          ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3.5; ctx.stroke();
          if (phanTu) for (x = 4; x < DAI; x += 4) if (x !== xd) tron(ctx, X(x), y1 - ky * pha(x), 3.5, "#bae6fd", "#0c4a6e");
          tay(ctx, X(0) + 4, y1 - ky * pha(0));
          ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(248,113,113,.7)"; ctx.beginPath(); ctx.moveTo(X(xd), y1 - ky - 12); ctx.lineTo(X(xd), y1 + ky + 12); ctx.stroke(); ctx.restore();
          var yd = y1 - ky * pha(xd); tron(ctx, X(xd), yd, 8, "#ef4444", "#fff");
          if (Math.abs(vt(xd)) > .08) V.muiTen(ctx, X(xd) + 18, yd, X(xd) + 18, yd - 38 * vt(xd), "#fca5a5", 3.5);
          if (dau > 2) V.muiTen(ctx, X(Math.max(0, dau - 22)), y1 - ky - 26, X(Math.min(dau, DAI)), y1 - ky - 26, "#f97316", 4);
          chu(ctx, "phương truyền sóng", X(Math.max(0, Math.min(dau, DAI) - 11)), y1 - ky - 42, "#fdba74", 13, "center");
          // ---- nửa dưới: lò xo ----
          var y2 = h2 + h2 * .56, cao = Math.min(h2 * .22, 46), Al = Math.min(3, .12 * lam), buoc = 2;
          chu(ctx, "Đẩy – kéo đầu lò xo dọc theo trục", 16, h2 + 22, "#e2e8f0", 16);
          ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(L - 20, y2); ctx.lineTo(R + 20, y2); ctx.stroke(); ctx.setLineDash([]);
          for (x = 0; x <= DAI; x += buoc) {
            var xs = X(x + Al * pha(x)), dd = x === xd;
            ctx.beginPath(); ctx.ellipse(xs, y2, 4, cao, 0, 0, TAU);
            ctx.strokeStyle = dd ? "#ef4444" : "#4ade80"; ctx.lineWidth = dd ? 4 : 2.2; ctx.stroke();
          }
          var xh = X(Al * pha(0)); tay(ctx, xh - 2, y2, "#f2c6a0");
          ctx.save(); ctx.strokeStyle = "rgba(248,113,113,.8)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(X(xd - Al), y2 + cao + 14); ctx.lineTo(X(xd + Al), y2 + cao + 14); ctx.stroke(); ctx.restore();
          var xr = X(xd + Al * pha(xd)); tron(ctx, xr, y2 + cao + 14, 6, "#ef4444", "#fff");
          if (Math.abs(vt(xd)) > .08) V.muiTen(ctx, xr, y2 - cao - 14, xr + 40 * vt(xd), y2 - cao - 14, "#fca5a5", 3.5);
          if (dau > 2) V.muiTen(ctx, X(Math.max(0, dau - 22)), y2 + cao + 38, X(Math.min(dau, DAI)), y2 + cao + 38, "#f97316", 4);
          if (ketLuan) {
            V.hop(ctx, W - 14, 10, ["*Sóng ngang*: phần tử dao động *vuông góc* với phương truyền sóng"], { phai: true, co: 15 });
            V.hop(ctx, W - 14, h2 + 10, ["*Sóng dọc*: phần tử dao động *trùng* với phương truyền sóng"], { phai: true, co: 15 });
          }
          chu(ctx, "t = " + so(t, 2) + " s · f = " + so(f, 2) + " Hz · v = " + v + " cm/s · λ = " + so(lam) + " cm", 16, H - 16, "#94a3b8", 13);
        }
      };
    }
  });

  /* ---------- Slide 10: mô hình sóng âm (nén - dãn) từ âm thoa tới tai ---------- */
  MP.dangKy("B9", 9, {
    ten: "Mô hình sóng âm: các lớp không khí nén – dãn xen kẽ",
    goiY: "Các chấm đỏ là vài phân tử khí: mỗi phân tử chỉ dao động qua lại quanh chỗ của nó, dọc theo phương truyền âm.",
    tao: function (ui) {
      var f = 400, vAm = 340, DAI = 3, CHAM = 400, bien = 0.7, nenDan = true, doThi = false, danh = true;   // m, m/s; thời gian chậm 400 lần
      var hat = [], khoa = "";
      ui.truot("Tần số âm f", 200, 800, 50, f, "Hz", function (x) { f = x });
      ui.truot("Độ to (biên độ)", 0.2, 1, 0.1, bien, "", function (x) { bien = x });
      ui.chon("Ghi Nén / Dãn", nenDan, function (x) { nenDan = x });
      ui.chon("Đánh dấu vài phân tử", danh, function (x) { danh = x });
      ui.chon("Đồ thị áp suất", doThi, function (x) { doThi = x });
      return {
        ve: function (ctx, W, H, t) {
          var tr = t / CHAM, w = TAU * f, lam = vAm / f;               // tr: thời gian thực
          var L = 150, R = W - 150, s = (R - L) / DAI, top = H * .2, bot = H * .78, mid = (top + bot) / 2;
          var A = Math.min(.14 * lam * s, 60) * bien;                   // biên độ hiển thị (px), đã phóng to
          var dich = function (x) { return x <= vAm * tr ? A * Math.sin(w * (tr - x / vAm)) : 0 };
          var k2 = W + "x" + H;
          if (k2 !== khoa) {                                             // rải phân tử khí (cố định theo kích thước)
            khoa = k2; hat = []; var r = ngauNhien(7), n = Math.round((R - L) * (bot - top) * .0042);
            for (var i = 0; i < n; i++) hat.push([r() * DAI, top + r() * (bot - top), 0]);
            for (i = 0; i < 7; i++) hat.push([DAI * (i + .5) / 7, mid + (i % 2 ? 18 : -18), 1]);
          }
          ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, W, H);
          // đồ thị áp suất
          if (doThi) {
            ctx.save(); ctx.beginPath(); var aa = (bot - top) * .32 * bien;
            for (var px = L; px <= R; px += 3) { var x = (px - L) / s, p = x <= vAm * tr ? Math.cos(w * (tr - x / vAm)) : 0; ctx[px > L ? "lineTo" : "moveTo"](px, mid - aa * p) }
            ctx.strokeStyle = "rgba(34,197,94,.75)"; ctx.lineWidth = 6; ctx.stroke();
            ctx.setLineDash([5, 6]); ctx.strokeStyle = "rgba(34,197,94,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, mid); ctx.lineTo(R, mid); ctx.stroke(); ctx.restore();
            chu(ctx, "áp suất: cao hơn bình thường ở chỗ nén, thấp hơn ở chỗ dãn", L, bot + 22, "#15803d", 13);
          }
          // phân tử khí
          ctx.fillStyle = "#334155";
          hat.forEach(function (h) { if (!h[2]) { ctx.beginPath(); ctx.arc(L + h[0] * s + dich(h[0]), h[1], 2.3, 0, TAU); ctx.fill() } });
          if (danh) hat.forEach(function (h) {
            if (!h[2]) return; var x0 = L + h[0] * s;
            ctx.strokeStyle = "rgba(239,68,68,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - A, h[1]); ctx.lineTo(x0 + A, h[1]); ctx.stroke();
            ctx.fillStyle = "#64748b"; ctx.fillRect(x0 - 1, h[1] - 7, 2, 14);
            tron(ctx, x0 + dich(h[0]), h[1], 5.5, "#ef4444", "#fff");
          });
          // nhãn Nén / Dãn: chỗ nén ứng với w(t - x/v) = 2πn  =>  x = v·t - nλ
          if (nenDan) {
            var dau = vAm * tr;
            for (var n = 0; n < 200; n++) {
              var xn = dau - n * lam, xd = xn - lam / 2;
              if (xn < -lam) break;
              if (xn >= 0 && xn <= DAI && xn < dau - lam * .05) { chu(ctx, "Nén", L + xn * s, top - 22, "#ea580c", 15, "center"); V.kichThuoc(ctx, L + xn * s - 26, L + xn * s + 26, top - 6, "", "#f59e0b") }
              if (xd >= 0 && xd <= DAI) { chu(ctx, "Dãn", L + xd * s, top - 22, "#16a34a", 15, "center") }
            }
            var x1 = dau - Math.ceil((dau - DAI) / lam) * lam;   // một chỗ nén trong vùng nhìn, để vẽ λ
            if (dau > lam * 1.2) { while (x1 > DAI) x1 -= lam; if (x1 - lam >= 0) V.kichThuoc(ctx, L + (x1 - lam) * s, L + x1 * s, bot + (doThi ? 46 : 22), "λ = " + so(lam, 2) + " m", "#7c3aed", true) }
          }
          // âm thoa
          var ax = L - 40;   // âm thoa đứng yên; chỉ có các vạch rung nhấp nháy hai bên để báo đang phát âm
          if (tr > 0) {
            ctx.save(); ctx.strokeStyle = "rgba(14,165,233," + (.25 + .6 * Math.abs(Math.sin(w * tr))) + ")"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
            [-34, -29, 31, 36].forEach(function (dx) { ctx.beginPath(); ctx.moveTo(ax + dx, mid - 100); ctx.lineTo(ax + dx, mid - 30); ctx.stroke() });
            ctx.restore();
          }
          ctx.save(); ctx.fillStyle = "#94a3b8"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.5;
          [[-22, 0], [8, 0]].forEach(function (p) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(ax + p[0], mid - 110, 14, 140, 7); else ctx.rect(ax + p[0], mid - 110, 14, 140); ctx.fill(); ctx.stroke() });
          ctx.fillRect(ax - 22, mid + 22, 44, 14); ctx.fillRect(ax - 5, mid + 34, 10, 70); ctx.restore();
          chu(ctx, "âm thoa", ax, mid + 122, "#334155", 14, "center");
          // tai và màng nhĩ
          var ex = R + 45, um = dich(DAI);
          ctx.save(); ctx.strokeStyle = "#a16207"; ctx.fillStyle = "#fde7d0"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(ex - 10, mid - 90); ctx.bezierCurveTo(ex + 80, mid - 120, ex + 90, mid + 20, ex + 20, mid + 50); ctx.bezierCurveTo(ex, mid + 70, ex + 10, mid + 100, ex - 15, mid + 95); ctx.lineTo(ex - 10, mid - 90); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 30 + um * .8, mid - 26); ctx.quadraticCurveTo(ex - 22 + um * 1.6, mid, ex - 30 + um * .8, mid + 26); ctx.stroke();
          ctx.restore();
          chu(ctx, "màng nhĩ", ex - 26, mid + 122, "#991b1b", 14, "center");
          var tToi = DAI / vAm;
          V.hop(ctx, 12, 10, [
            "f = *" + f + " Hz* · v (không khí) ≈ " + vAm + " m/s · λ = v/f = *" + so(lam, 2) + " m*",
            "Từ âm thoa tới tai " + DAI + " m: âm tới sau *" + so(tToi * 1000, 1) + " ms*" + (tr >= tToi ? " · màng nhĩ đang dao động" : " · âm chưa tới tai"),
            "Thời gian chậm đi " + CHAM + " lần (khi phát ×1), biên độ được phóng to để dễ thấy"
          ], { co: 13, nen: "rgba(15,23,42,.88)" });
        }
      };
    }
  });
})();
