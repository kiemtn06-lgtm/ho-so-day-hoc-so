/* Mô phỏng Bài 13 (khối 10). Tổng hợp và phân tích lực. Cân bằng lực.
   Gắn vào slide của bản pptx "Bài 13- Tong_hop_va_Phan_tich_Luc_da_sua.pptx" (chỉ số slide đếm từ 0):
     2, 3  Thí nghiệm ba lực kế, thu thập số liệu     4, 5, 6  Quy tắc hình bình hành, độ lớn hợp lực, trường hợp đặc biệt
     8, 10 Mặt phẳng nghiêng                          9        Phân tích lực
     11    Điều kiện cân bằng (ba lực)                12, 16   Vật treo hai dây, bài toán dây phơi
     15    Đồ thị độ lớn hợp lực theo góc (tìm F1, F2)                                                       */
(function () {
  var V = window.MPve, so = V.so, R = Math.PI / 180, TAU = Math.PI * 2;
  var XANH = "#60a5fa", DO = "#f87171", VANG = "#fde047", LUC = "#34d399", TIM = "#c4b5fd", XAM = "#94a3b8", CAM = "#fb923c";
  var FONT = "'Segoe UI',Roboto,Arial,sans-serif";

  function nen(ctx, W, H) {
    ctx.fillStyle = "#0b1530"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,.08)"; ctx.lineWidth = 1; ctx.beginPath();
    for (var x = 0; x < W; x += 30) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H) }
    for (var y = 0; y < H; y += 30) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5) }
    ctx.stroke();
  }
  function chu(ctx, s, x, y, mau, co, can) {
    ctx.save(); ctx.font = "bold " + (co || 15) + "px " + FONT; ctx.textAlign = can || "left"; ctx.textBaseline = "middle";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(11,21,48,.92)"; ctx.strokeText(s, x, y); ctx.fillStyle = mau; ctx.fillText(s, x, y); ctx.restore();
  }
  /* nhãn vectơ: chữ có mũi tên trên đầu, tâm (x, y) */
  function vt(ctx, ch, sub, x, y, mau, co) {
    co = co || 21; sub = sub ? sub.replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3') : sub; ctx.save(); ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.font = "bold " + co + "px " + FONT; var w = ctx.measureText(ch).width;
    var cs = Math.round(co * .62); ctx.font = "bold " + cs + "px " + FONT; var ws = sub ? ctx.measureText(sub).width : 0;
    var x0 = x - (w + ws) / 2;
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(11,21,48,.92)"; ctx.fillStyle = mau;
    ctx.font = "bold " + co + "px " + FONT; ctx.strokeText(ch, x0, y); ctx.fillText(ch, x0, y);
    if (sub) { ctx.font = "bold " + cs + "px " + FONT; ctx.strokeText(sub, x0 + w, y + co * .28); ctx.fillText(sub, x0 + w, y + co * .28) }
    var ya = y - co * .64; ctx.lineWidth = 1.8; ctx.strokeStyle = mau; ctx.beginPath(); ctx.moveTo(x0 + 1, ya); ctx.lineTo(x0 + w - 1, ya); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + w + 1, ya); ctx.lineTo(x0 + w - 5, ya - 3.5); ctx.lineTo(x0 + w - 5, ya + 3.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /* mũi tên lực từ (ox, oy), vectơ (vx, vy) hệ toán (y hướng lên), tỉ lệ s px/N */
  function luc(ctx, ox, oy, vx, vy, s, mau, w) { V.muiTen(ctx, ox, oy, ox + vx * s, oy - vy * s, mau, w || 4) }
  function dashSeg(ctx, x1, y1, x2, y2, mau) {
    ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = mau || "rgba(226,232,240,.7)"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function cung(ctx, ox, oy, r, a1, a2, mau) {      // cung góc từ a1 đến a2 (độ, hệ toán), ngược chiều kim đồng hồ
    ctx.save(); ctx.strokeStyle = mau; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ox, oy, r, -a1 * R, -a2 * R, true); ctx.stroke(); ctx.restore();
  }
  function Fhl(F1, F2, a) { return Math.sqrt(Math.max(0, F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(a * R))) }

  /* đồ thị F theo α (0..180°); (a) là góc hiện tại, muc: {ymax, diem:[[α,F],...]} */
  function dothi(ctx, x, y, w, h, F1, F2, a, muc) {
    muc = muc || {};
    var ymax = muc.ymax || Math.max(4, Math.ceil((F1 + F2 + 1) / 2) * 2), bd = ymax > 16 ? 4 : 2;
    var X = function (al) { return x + 46 + (w - 62) * al / 180 }, Y = function (f) { return y + h - 40 - (h - 74) * f / ymax };
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,.78)"; ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,.2)"; ctx.beginPath();
    for (var f = 0; f <= ymax; f += bd) { ctx.moveTo(X(0), Y(f)); ctx.lineTo(X(180), Y(f)) }
    [0, 45, 90, 135, 180].forEach(function (al) { ctx.moveTo(X(al), Y(0)); ctx.lineTo(X(al), Y(ymax)) });
    ctx.stroke();
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(ymax)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(180), Y(0)); ctx.stroke();
    ctx.fillStyle = "#cbd5e1"; ctx.font = "13px " + FONT; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (f = 0; f <= ymax; f += bd) ctx.fillText(String(f), X(0) - 6, Y(f));
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    [0, 45, 90, 135, 180].forEach(function (al) { ctx.fillText(String(al), X(al), Y(0) + 6) });
    ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 14px " + FONT; ctx.textAlign = "center"; ctx.fillText("Góc α (độ)", X(90), Y(0) + 24);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("F (N)", x + 10, y + 16);
    ctx.strokeStyle = VANG; ctx.lineWidth = 3.5; ctx.beginPath();
    for (var al = 0; al <= 180; al += 2) { var px = X(al), py = Y(Fhl(F1, F2, al)); if (al === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py) }
    ctx.stroke();
    (muc.diem || []).forEach(function (p) {
      ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 8, 0, TAU); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = p[2] ? LUC : "#fff"; ctx.stroke();
    });
    if (a != null) {
      var fa = Fhl(F1, F2, a); dashSeg(ctx, X(a), Y(0), X(a), Y(fa), "rgba(248,113,113,.8)"); dashSeg(ctx, X(0), Y(fa), X(a), Y(fa), "rgba(248,113,113,.8)");
      ctx.beginPath(); ctx.arc(X(a), Y(fa), 6, 0, TAU); ctx.fillStyle = DO; ctx.fill();
    }
    ctx.restore();
  }

  /* ============ 1. Tổng hợp hai lực: quy tắc hình bình hành, độ lớn, trường hợp đặc biệt ============ */
  function tongHop(goiY, ten, a0) {
    return {
      ten: ten, goiY: goiY,
      tao: function (ui) {
        var F1 = 6, F2 = 8, a = a0, hbh = true, tam = false, dt = true;
        var r1 = ui.truot("F₁", 1, 12, 1, F1, "N", function (x) { F1 = x });
        var r2 = ui.truot("F₂", 1, 12, 1, F2, "N", function (x) { F2 = x });
        var ra = ui.truot("Góc α giữa hai lực", 0, 180, 1, a, "°", function (x) { a = x });
        function dat(v) { ra.value = v; ra.oninput() }
        ui.nut("α = 0°", function () { dat(0) }); ui.nut("α = 90°", function () { dat(90) }); ui.nut("α = 180°", function () { dat(180) });
        ui.nut("F₁ = F₂", function () { r2.value = F1; r2.oninput() });
        ui.chon("Hình bình hành", hbh, function (x) { hbh = x });
        ui.chon("Quy tắc tam giác", tam, function (x) { tam = x });
        ui.chon("Đồ thị F theo α", dt, function (x) { dt = x });
        return {
          ve: function (ctx, W, H) {
            nen(ctx, W, H);
            var pw = dt && W >= 880 ? Math.min(430, W * .36) : 0, S = Math.min((W - pw - 130) / 24, (H - 200) / 12, 30), c = Math.cos(a * R), sn = Math.sin(a * R);
            var ox = 60 + Math.max(0, -F2 * c) * S, oy = H - 70;
            var x1 = F1, y1 = 0, x2 = F2 * c, y2 = F2 * sn, xf = x1 + x2, yf = y1 + y2, F = Math.hypot(xf, yf);
            var P = function (vx, vy) { return [ox + vx * S, oy - vy * S] };
            var pe = P(xf, yf), p1 = P(x1, y1), p2 = P(x2, y2);
            if (hbh) {
              ctx.save(); ctx.fillStyle = "rgba(96,165,250,.10)"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(pe[0], pe[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath(); ctx.fill(); ctx.restore();
              dashSeg(ctx, p1[0], p1[1], pe[0], pe[1]); dashSeg(ctx, p2[0], p2[1], pe[0], pe[1]);
            }
            if (tam) { var q = P(x1 + x2, y1 + y2); luc(ctx, p1[0], p1[1], x2, y2, S, "rgba(147,197,253,.55)", 3); void q }
            luc(ctx, ox, oy, x1, y1, S, XANH, 5); luc(ctx, ox, oy, x2, y2, S, XANH, 5); luc(ctx, ox, oy, xf, yf, S, DO, 6);
            ctx.beginPath(); ctx.arc(ox, oy, 6, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
            cung(ctx, ox, oy, 38, 0, a, VANG); chu(ctx, "α", ox + 50 * Math.cos(a * R / 2) + 2, oy - 50 * Math.sin(a * R / 2), VANG, 19, "center");
            vt(ctx, "F", "₁", p1[0] + 4, p1[1] + 26, XANH);
            var l2 = Math.hypot(x2, y2) || 1; vt(ctx, "F", "₂", p2[0] + (x2 / l2) * 24 - 4, p2[1] - (y2 / l2) * 24 - 10 * (y2 / l2), XANH);
            var lf = Math.hypot(xf, yf) || 1; vt(ctx, "F", "", pe[0] + (xf / lf) * 24 + 8, pe[1] - (yf / lf) * 24 - 8, DO);
            var lo = Math.abs(F1 - F2), hi = F1 + F2, dang = a === 0 ? "α = 0°: cùng hướng, F = F₁ + F₂ là *lớn nhất*" : a === 180 ? "α = 180°: ngược hướng, F = |F₁ − F₂| là *nhỏ nhất*"
              : a === 90 ? "α = 90°: F = √(F₁² + F₂²) (định lí Py-ta-go)" : (F1 === F2 ? "F₁ = F₂: vectơ F nằm trên *đường phân giác* của góc α" : "Tăng α thì F giảm, α từ 0° đến 180°");
            V.hop(ctx, 12, 12, ["F² = F₁² + F₂² + 2F₁F₂·cos α",
              "F² = " + F1 + "² + " + F2 + "² + 2·" + F1 + "·" + F2 + "·cos " + a + "° = " + so(F * F, 1) + "  →  *F = " + so(F, 2) + " N*",
              "Góc giữa F và F₁: *" + so(Math.atan2(yf, xf) / R, 1) + "°*",
              "Giới hạn: |F₁ − F₂| = " + lo + "  ≤ F ≤  F₁ + F₂ = " + hi, dang], { co: 15 });
            if (pw) dothi(ctx, W - pw - 12, 12, pw, Math.min(H * .62, pw * .85), F1, F2, a);
          }
        };
      }
    };
  }

  /* ============ 2. Thí nghiệm ba lực kế (vòng O đứng yên) và bảng số liệu; hoặc chỉ cân bằng ba lực ============ */
  function thiNghiem(ten, goiY, coBang) {
    return {
      ten: ten, goiY: goiY,
      tao: function (ui) {
        var F1 = 6, F2 = 8, a = 90, hbh = true, saiSo = true, dong = [], mo = false;
        ui.truot("F₁", 1, 12, 1, F1, "N", function (x) { F1 = x });
        ui.truot("F₂", 1, 12, 1, F2, "N", function (x) { F2 = x });
        ui.truot("Góc α giữa F₁ và F₂", 10, 180, 1, a, "°", function (x) { a = x });
        ui.chon(coBang ? "Hình bình hành" : "Đa giác lực (nối đuôi)", hbh, function (x) { hbh = x });
        if (coBang) {
          ui.chon("Có sai số đọc lực kế (±0,1 N)", saiSo, function (x) { saiSo = x });
          ui.nut("➕ Ghi số liệu", function () {
            if (dong.length >= 6) dong.shift();
            var F = Fhl(F1, F2, a), e = saiSo ? (Math.round(Math.random() * 2) - 1) / 10 : 0;
            dong.push({ n: (dong.length ? dong[dong.length - 1].n : 0) + 1, f1: F1, f2: F2, a: a, f3: Math.round((F + e) * 10) / 10, ft: F });
          });
          ui.nut("🗑 Xóa bảng", function () { dong = [] });
        }
        return {
          datLai: function () { dong = [] },
          ve: function (ctx, W, H) {
            nen(ctx, W, H);
            var pw = coBang && W >= 880 ? Math.min(500, W * .42) : 0, cx = (W - pw) / 2 + 6, cy = H * .5 - 10;
            var S = Math.min((W - pw - 120) / 2 / 14.5, (H - 150) / 2 / 14.5), c = Math.cos(a * R), sn = Math.sin(a * R);
            var xf = F1 + F2 * c, yf = F2 * sn, F = Math.hypot(xf, yf), d1 = Math.atan2(yf, xf) / R;     // d1: góc giữa F và F1
            // đặt F hướng lên (90°): F1 lệch trái, F2 lệch phải; F3 = −F hướng xuống
            var t1 = 90 + d1, t2 = 90 + d1 - a, t3 = 270;
            var v = [[F1, t1, "₁", XANH], [F2, t2, "₂", LUC], [F, t3, "₃", CAM]];
            // bảng từ
            ctx.save(); ctx.fillStyle = "rgba(30,41,59,.55)"; ctx.strokeStyle = "rgba(148,163,184,.45)"; ctx.lineWidth = 3;
            ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(14, 90, W - pw - 28, H - 104, 14); else ctx.rect(14, 90, W - pw - 28, H - 104); ctx.fill(); ctx.stroke(); ctx.restore();
            if (hbh) {
              if (coBang) {    // hình bình hành của F1, F2 và hợp lực F (nét đứt đỏ, ngược chiều F3)
                var q1 = [cx + F1 * S * Math.cos(t1 * R), cy - F1 * S * Math.sin(t1 * R)], q2 = [cx + F2 * S * Math.cos(t2 * R), cy - F2 * S * Math.sin(t2 * R)];
                var qf = [q1[0] + q2[0] - cx, q1[1] + q2[1] - cy];
                dashSeg(ctx, q1[0], q1[1], qf[0], qf[1]); dashSeg(ctx, q2[0], q2[1], qf[0], qf[1]);
                luc(ctx, cx, cy, 0, F, S, "rgba(248,113,113,.9)", 3);
              } else {         // đa giác lực: F1 nối đuôi F2 nối đuôi F3, khép kín (tịnh tiến sang bên phải để dễ nhìn)
                var S2 = S * .8, bx = W * .74, by = H * .72, v1 = [F1 * Math.cos(t1 * R), F1 * Math.sin(t1 * R)], v2 = [F2 * Math.cos(t2 * R), F2 * Math.sin(t2 * R)];
                luc(ctx, bx, by, v1[0], v1[1], S2, XANH, 4);
                luc(ctx, bx + v1[0] * S2, by - v1[1] * S2, v2[0], v2[1], S2, LUC, 4);
                luc(ctx, bx + (v1[0] + v2[0]) * S2, by - (v1[1] + v2[1]) * S2, 0, -F, S2, CAM, 4);
                chu(ctx, "Đa giác lực khép kín", bx, by + 30, TIM, 15, "center");
              }
            }
            v.forEach(function (o) {
              var ex = cx + o[0] * S * Math.cos(o[1] * R), ey = cy - o[0] * S * Math.sin(o[1] * R);
              luc(ctx, cx, cy, o[0] * Math.cos(o[1] * R), o[0] * Math.sin(o[1] * R), S, o[3], 5);
              // lực kế: ống nhỏ ở đầu mũi tên
              ctx.save(); ctx.translate(ex, ey); ctx.rotate(-o[1] * R); ctx.fillStyle = "#e2e8f0"; ctx.strokeStyle = o[3]; ctx.lineWidth = 2;
              ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(2, -9, 34, 18, 4); else ctx.rect(2, -9, 34, 18); ctx.fill(); ctx.stroke(); ctx.restore();
              var ux = Math.cos(o[1] * R), uy = -Math.sin(o[1] * R);
              vt(ctx, "F", o[2], ex + ux * 66, ey + uy * 52, o[3], 21);
              chu(ctx, so(o[0], 1) + " N", ex + ux * 66, ey + uy * 52 + 24, "#e2e8f0", 14, "center");
            });
            ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#475569"; ctx.stroke();
            chu(ctx, "O", cx + 16, cy + 18, "#fff", 16);
            V.hop(ctx, 12, 12, [coBang ? "Vòng O đứng yên: *F₃ cân bằng với hợp lực của F₁ và F₂*" : "Ba lực cân bằng: *F₁ + F₂ + F₃ = 0*  →  F₃ = −(F₁ + F₂)",
              "F₃ = " + so(F, 2) + " N  (độ lớn hợp lực của F₁, F₂ theo hình bình hành)"], { co: 15 });
            if (coBang && pw) {
              var tx = W - pw - 8, ty = 12, tw = pw, cw = [48, 66, 66, 62, 96, 96]; var tot = cw.reduce(function (s, x) { return s + x }, 0), k = tw / tot, hr = 36;
              ctx.save(); ctx.fillStyle = "rgba(15,23,42,.82)"; ctx.strokeStyle = "rgba(148,163,184,.4)"; ctx.lineWidth = 1;
              ctx.fillRect(tx, ty, tw, hr + 7 * hr * .9); ctx.strokeRect(tx, ty, tw, hr + 7 * hr * .9);
              var head = ["Lần", "F₁ (N)", "F₂ (N)", "α (°)", "F₃ đo (N)", "F tính (N)"], xx = tx;
              ctx.fillStyle = "#1e3a8a"; ctx.fillRect(tx, ty, tw, hr);
              head.forEach(function (h2, i) { chu(ctx, h2, xx + cw[i] * k / 2, ty + hr / 2, "#fff", 13, "center"); xx += cw[i] * k });
              for (var r = 0; r < 6; r++) {
                var yy = ty + hr + r * hr * .9, rw = dong[r]; xx = tx;
                ctx.strokeStyle = "rgba(148,163,184,.3)"; ctx.beginPath(); ctx.moveTo(tx, yy); ctx.lineTo(tx + tw, yy); ctx.stroke();
                if (rw) [rw.n, so(rw.f1, 1), so(rw.f2, 1), rw.a, so(rw.f3, 1), so(rw.ft, 2)].forEach(function (s, i) { chu(ctx, String(s), xx + cw[i] * k / 2, yy + hr * .45, i === 4 ? CAM : "#e2e8f0", 14, "center"); xx += cw[i] * k });
              }
              ctx.restore();
              var ghi = dong.length ? "So sánh cột F₃ đo với cột F tính: giống nhau (sai lệch rất nhỏ) → hợp lực thay thế đúng hai lực." : "Chỉnh F₁, F₂, α rồi bấm “Ghi số liệu” (ghi ít nhất 3 lần đo khác nhau).";
              ctx.font = "13px " + FONT; ctx.fillStyle = "#9fb0cc"; ctx.textAlign = "left"; ctx.textBaseline = "top";
              var yb = ty + hr + 7 * hr * .9 + 8, cur = "", li = 0;
              ghi.split(" ").forEach(function (w2) {
                var th2 = cur ? cur + " " + w2 : w2;
                if (ctx.measureText(th2).width > tw && cur) { ctx.fillText(cur, tx, yb + li * 18); li++; cur = w2 } else cur = th2;
              });
              if (cur) ctx.fillText(cur, tx, yb + li * 18);
            }
          }
        };
      }
    };
  }

  /* ============ 3. Phân tích lực thành hai thành phần vuông góc (có thể xoay hệ trục) ============ */
  var phanTich = {
    ten: "Phân tích một lực thành hai thành phần vuông góc",
    goiY: "Đổi độ lớn F, hướng của F và xoay hệ trục Ox, Oy: F = Fx + Fy luôn đúng, Fx = F·cosα, Fy = F·sinα (α là góc giữa F và Ox).",
    tao: function (ui) {
      var F = 12, th = 40, ph = 0, chieu = true;
      ui.truot("Độ lớn F", 2, 20, 1, F, "N", function (x) { F = x });
      ui.truot("Hướng của F so với phương ngang", 5, 85, 1, th, "°", function (x) { th = x });
      ui.truot("Xoay hệ trục Ox, Oy", 0, 60, 1, ph, "°", function (x) { ph = x });
      ui.chon("Hiện hình chữ nhật phân tích", chieu, function (x) { chieu = x });
      return {
        ve: function (ctx, W, H) {
          nen(ctx, W, H);
          var S = Math.min(W * .5, H * .66) / 20, ox = W * .32, oy = H * .72, al = th - ph, c = Math.cos(al * R), sn = Math.sin(al * R);
          var Fx = F * c, Fy = F * sn;
          var ux = [Math.cos(ph * R), Math.sin(ph * R)], uy = [-Math.sin(ph * R), Math.cos(ph * R)];     // hai trục (hệ toán)
          var T = function (a, b) { return [ox + (a * ux[0] + b * uy[0]) * S, oy - (a * ux[1] + b * uy[1]) * S] };
          ctx.save(); ctx.strokeStyle = "rgba(203,213,225,.75)"; ctx.lineWidth = 1.8; ctx.setLineDash([2, 0]);
          var a1 = T(-3, 0), a2 = T(22, 0), b1 = T(0, -3), b2 = T(0, 18); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); ctx.restore();
          chu(ctx, "Ox", a2[0] + 6, a2[1] + 2, "#e2e8f0", 17); chu(ctx, "Oy", b2[0] + 4, b2[1] - 10, "#e2e8f0", 17);
          var pf = T(Fx, Fy), px = T(Fx, 0), py = T(0, Fy);
          if (chieu) { dashSeg(ctx, px[0], px[1], pf[0], pf[1]); dashSeg(ctx, py[0], py[1], pf[0], pf[1]) }
          var s2 = S;
          V.muiTen(ctx, ox, oy, px[0], px[1], XANH, 5); V.muiTen(ctx, ox, oy, py[0], py[1], LUC, 5); V.muiTen(ctx, ox, oy, pf[0], pf[1], DO, 6); void s2;
          ctx.beginPath(); ctx.arc(ox, oy, 6, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
          cung(ctx, ox, oy, 44, ph, th, VANG); var am = (ph + th) / 2; chu(ctx, "α", ox + 62 * Math.cos(am * R), oy - 62 * Math.sin(am * R), VANG, 19, "center");
          vt(ctx, "F", "", pf[0] + 22, pf[1] - 16, DO); vt(ctx, "F", "x", px[0] + 4, px[1] + (Math.abs(Fx) > .1 ? 26 : 26) + 4 * ux[1], XANH); vt(ctx, "F", "y", py[0] - 34, py[1] + 2, LUC);
          V.hop(ctx, 12, 12, ["Chiếu lên Ox:  *Fx = F·cos α* = " + F + "·cos " + so(al, 0) + "° = " + so(Fx, 2) + " N",
            "Chiếu lên Oy:  *Fy = F·sin α* = " + F + "·sin " + so(al, 0) + "° = " + so(Fy, 2) + " N",
            "Kiểm tra: Fx² + Fy² = " + so(Fx * Fx + Fy * Fy, 1) + " = F² = " + F * F,
            ph ? "Đổi trục thì Fx, Fy đổi, nhưng F = Fx + Fy vẫn đúng. Thường chọn trục để tính cho gọn." : "Thử xoay hệ trục: hai thành phần thay đổi, tổng vẫn bằng F."], { co: 15 });
        }
      };
    }
  };

  /* ============ 4. Mặt phẳng nghiêng ============ */
  function nghieng(ten, goiY) {
    return {
      ten: ten, goiY: goiY,
      tao: function (ui) {
        var m = 5, a = 30, hn = true, g = 10;
        ui.truot("Khối lượng m", 1, 10, 1, m, "kg", function (x) { m = x });
        ui.truot("Góc nghiêng α", 0, 75, 1, a, "°", function (x) { a = x });
        ui.chon("Hiện hình chữ nhật phân tích", hn, function (x) { hn = x });
        return {
          ve: function (ctx, W, H) {
            nen(ctx, W, H);
            var c = Math.cos(a * R), sn = Math.sin(a * R), Pn = m * g, S = .0042 * H * 1.15;
            var Ls = Math.min(W * .58 / Math.max(c, .3), H * .6 / Math.max(sn, .35), W * .6), x0 = W * .1, yg = H * .86;
            var A = [x0, yg], Cc = [x0 + Ls * c, yg], B = [x0 + Ls * c, yg - Ls * sn];
            ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Cc[0], Cc[1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0] - 30, yg); ctx.lineTo(Cc[0] + 30, yg); ctx.stroke();
            ctx.strokeStyle = "#cbd5e1"; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
            cung(ctx, A[0], A[1], 52, 0, a, VANG); chu(ctx, "α", A[0] + 72 * Math.cos(a * R / 2) + 2, A[1] - 72 * Math.sin(a * R / 2), VANG, 19, "center");
            var u = [c, -sn], nn = [-sn, -c], hb = 44, p0 = [A[0] + u[0] * Ls * .6, A[1] + u[1] * Ls * .6], G = [p0[0] + nn[0] * hb / 2, p0[1] + nn[1] * hb / 2];
            ctx.save(); ctx.translate(G[0], G[1]); ctx.rotate(-a * R); ctx.fillStyle = "#fbbf24"; ctx.strokeStyle = "#92400e"; ctx.lineWidth = 2; ctx.fillRect(-28, -22, 56, 44); ctx.strokeRect(-28, -22, 56, 44); ctx.restore();
            ctx.beginPath(); ctx.arc(G[0], G[1], 4, 0, TAU); ctx.fillStyle = "#111827"; ctx.fill();
            var P = Pn * S, Px = Pn * sn * S, Py = Pn * c * S;
            var eP = [G[0], G[1] + P], eX = [G[0] - u[0] * Px, G[1] - u[1] * Px], eY = [G[0] - nn[0] * Py, G[1] - nn[1] * Py], eN = [G[0] + nn[0] * Py, G[1] + nn[1] * Py];
            if (hn) { dashSeg(ctx, eX[0], eX[1], eP[0], eP[1]); dashSeg(ctx, eY[0], eY[1], eP[0], eP[1]) }
            V.muiTen(ctx, G[0], G[1], eN[0], eN[1], LUC, 4);
            V.muiTen(ctx, G[0], G[1], eY[0], eY[1], XANH, 5); V.muiTen(ctx, G[0], G[1], eX[0], eX[1], CAM, 5); V.muiTen(ctx, G[0], G[1], eP[0], eP[1], DO, 6);
            vt(ctx, "P", "", eP[0] + 26, eP[1] - 4, DO); vt(ctx, "P", "x", eX[0] - 18 - 12 * c, eX[1] + 20, CAM); vt(ctx, "P", "y", eY[0] + 26 * sn + 22, eY[1] + 22 * c + 4, XANH);
            vt(ctx, "N", "", eN[0] + nn[0] * 26 - 4, eN[1] + nn[1] * 26, LUC);
            V.hop(ctx, W - 12, 12, ["Trọng lực: *P = m·g* = " + m + "·10 = " + Pn + " N  (g ≈ 10 m/s²)",
              "Thành phần kéo vật trượt: *Pₓ = P·sin α* = " + so(Pn * sn, 1) + " N",
              "Thành phần ép vuông góc mặt dốc: *P_y = P·cos α* = " + so(Pn * c, 1) + " N",
              "Phản lực N cân bằng với P_y: *N = P_y* = " + so(Pn * c, 1) + " N",
              a === 0 ? "α = 0°: Pₓ = 0, vật nằm ngang không có thành phần kéo trượt" : "α càng lớn: Pₓ càng *tăng*, P_y càng *giảm*"], { co: 15, phai: true });
          }
        };
      }
    };
  }

  /* ============ 5. Vật treo bằng hai dây / dây phơi: 2T·sin α = P ============ */
  function treo(ten, goiY, P0, a0) {
    return {
      ten: ten, goiY: goiY,
      tao: function (ui) {
        var P = P0, a = a0, Tmax = 100;
        ui.truot("Trọng lượng vật treo P", 5, 80, 5, P, "N", function (x) { P = x });
        ui.truot("Góc α (mỗi dây với phương ngang)", 2, 60, 1, a, "°", function (x) { a = x });
        ui.truot("Dây chịu được tối đa", 30, 200, 10, Tmax, "N", function (x) { Tmax = x });
        return {
          ve: function (ctx, W, H) {
            nen(ctx, W, H);
            var sn = Math.sin(a * R), T = P / (2 * sn), dut = T > Tmax;
            var yt = H * .33, half = Math.min(W * .33, H * .42 / Math.max(Math.tan(a * R), .05)), xm = W * .5, yv = yt + half * Math.tan(a * R);
            ctx.fillStyle = "#475569"; [xm - half, xm + half].forEach(function (x) { ctx.fillRect(x - 7, yt - 18, 14, H - yt + 8) });
            ctx.strokeStyle = dut ? DO : "#e2e8f0"; ctx.lineWidth = dut ? 3 : 4; ctx.setLineDash(dut ? [10, 8] : []); ctx.beginPath(); ctx.moveTo(xm - half, yt); ctx.lineTo(xm, yv); ctx.lineTo(xm + half, yt); ctx.stroke(); ctx.setLineDash([]);
            var wy = yv + 34 + P * .7; ctx.fillStyle = "#fbbf24"; ctx.strokeStyle = "#92400e"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(xm, yv); ctx.lineTo(xm, yv + 22); ctx.strokeStyle = "#e2e8f0"; ctx.stroke(); ctx.fillStyle = "#fbbf24"; ctx.strokeStyle = "#92400e";
            ctx.fillRect(xm - 26, yv + 22, 52, 22 + P * .5); ctx.strokeRect(xm - 26, yv + 22, 52, 22 + P * .5); void wy;
            ctx.beginPath(); ctx.arc(xm, yv, 6, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
            ctx.save(); ctx.strokeStyle = VANG; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(xm - half, yt, 46, 0, a * R); ctx.stroke(); ctx.restore();
            chu(ctx, "α", xm - half + 64, yt + 14 + 6 * sn, VANG, 18, "center");
            dashSeg(ctx, xm - half, yt, xm, yt, "rgba(226,232,240,.45)");
            var lp = Math.min(P * 1.4, H * .24), lt = Math.min(T * 1.4, Math.min(W * .26, H * .3)), cap = T * 1.4 > lt + .5;
            V.muiTen(ctx, xm, yv, xm, yv + lp, DO, 5); vt(ctx, "P", "", xm + 30, yv + lp * .7, DO);
            V.muiTen(ctx, xm, yv, xm - lt * Math.cos(a * R), yv - lt * sn, dut ? DO : XANH, 5); V.muiTen(ctx, xm, yv, xm + lt * Math.cos(a * R), yv - lt * sn, dut ? DO : XANH, 5);
            vt(ctx, "T", "₁", xm - lt * Math.cos(a * R) - 10, yv - lt * sn - 26, XANH); vt(ctx, "T", "₂", xm + lt * Math.cos(a * R) + 10, yv - lt * sn - 26, XANH);
            if (dut) { ctx.save(); ctx.font = "bold 34px " + FONT; ctx.textAlign = "center"; ctx.fillStyle = DO; ctx.fillText("⚠ DÂY ĐỨT!  T > " + Tmax + " N", xm, H - 26); ctx.restore() }
            V.hop(ctx, 12, 12, ["Cân bằng: T₁ + T₂ + P = 0  →  theo phương thẳng đứng: *2T·sin α = P*",
              "T = P / (2·sin α) = " + P + " / (2·sin " + a + "°) = *" + so(T, 1) + " N*" + (cap ? "  (mũi tên T vẽ rút gọn)" : ""),
              a <= 5 ? "α rất nhỏ: sin α ≈ 0 → T rất lớn, dây căng ngang dễ *đứt*" : "Dây càng căng ngang (α nhỏ) thì lực căng T càng *lớn*",
              dut ? "T = " + so(T, 0) + " N vượt sức chịu " + Tmax + " N: dây đứt" : "T = " + so(T, 1) + " N ≤ " + Tmax + " N: dây còn an toàn"], { co: 15 });
          }
        };
      }
    };
  }

  /* ============ 6. Đồ thị F theo α: tìm F1, F2 ============ */
  var tim = {
    ten: "Đồ thị độ lớn hợp lực theo góc α: tìm F₁ và F₂",
    goiY: "Chỉnh F₁, F₂ sao cho đường cong đi qua ba chấm (0°; 14 N), (90°; 10 N), (180°; 2 N). Gợi ý: F(0°) = F₁ + F₂ và F(180°) = |F₁ − F₂|.",
    tao: function (ui) {
      var F1 = 10, F2 = 5;
      ui.truot("F₁", 1, 15, 1, F1, "N", function (x) { F1 = x });
      ui.truot("F₂", 1, 15, 1, F2, "N", function (x) { F2 = x });
      return {
        ve: function (ctx, W, H) {
          nen(ctx, W, H);
          var tg = [[0, 14], [90, 10], [180, 2]], ok = tg.map(function (p) { return Math.abs(Fhl(F1, F2, p[0]) - p[1]) < .05 });
          var w = Math.min(W - 40, 820), h = Math.min(H - 150, w * .6), x = (W - w) / 2;
          dothi(ctx, x, 120, w, h, F1, F2, null, { ymax: 16, diem: tg.map(function (p, i) { return [p[0], p[1], ok[i]] }) });
          var het = ok[0] && ok[1] && ok[2];
          V.hop(ctx, 12, 12, ["F(0°) = F₁ + F₂ = " + (F1 + F2) + " N   " + (ok[0] ? "✓" : "(cần 14)"),
            "F(90°) = √(F₁² + F₂²) = " + so(Fhl(F1, F2, 90), 2) + " N   " + (ok[1] ? "✓" : "(cần 10)"),
            "F(180°) = |F₁ − F₂| = " + Math.abs(F1 - F2) + " N   " + (ok[2] ? "✓" : "(cần 2)"),
            het ? "*Đúng rồi:* F₁ = " + Math.max(F1, F2) + " N, F₂ = " + Math.min(F1, F2) + " N" : "Chưa khớp: tăng/giảm F₁, F₂ cho đến khi cả ba chấm sáng xanh"], { co: 15, nhan: het ? "#86efac" : "#fde047" });
        }
      };
    }
  };

  /* ============ 7. Luyện tập dạng 2: Đúng / Sai (F₁ = 6 N, F₂ = 8 N) ============ */
  function dungSai(chiSo) {
    return {
      ten: "Luyện tập dạng 2: Đúng / Sai",
      goiY: "Chọn Đúng hoặc Sai cho từng phát biểu; bấm “Kiểm tra” để xem đáp án và lời giải.",
      tao: function (ui) {
        var CAU = [
          ["1. Hợp lực của chúng có thể đạt giá trị F = 15 N.", false, "Sai: F lớn nhất là 6 + 8 = 14 N."],
          ["2. Nếu hợp lực F = 10 N, góc giữa hai lực là 90°.", true, "Đúng: 6² + 8² = 10² (định lí Py-ta-go) nên α = 90°."],
          ["3. Nếu hợp lực F = 2 N, hai lực đang tác dụng cùng chiều nhau.", false, "Sai: 2 N = 8 − 6 là giá trị nhỏ nhất, hai lực ngược chiều (α = 180°)."],
          ["4. Nếu góc α tăng dần từ 0° đến 180°, độ lớn hợp lực sẽ giảm dần.", true, "Đúng: α tăng thì cos α giảm nên F giảm từ 14 N xuống 2 N."]
        ], chon = [null, null, null, null], kt = false, vung = [];
        ui.nut("Kiểm tra", function () { kt = true });
        ui.nut("Làm lại", function () { chon = [null, null, null, null]; kt = false });
        return {
          datLai: function () { chon = [null, null, null, null]; kt = false },
          nhap: function (x, y) {
            vung.forEach(function (v) { if (x >= v[0] && x <= v[0] + v[2] && y >= v[1] && y <= v[1] + v[3]) { if (!kt) chon[v[4]] = v[5] } });
          },
          ve: function (ctx, W, H) {
            nen(ctx, W, H); vung = [];
            var w = Math.min(W - 40, 960), x0 = (W - w) / 2, co = Math.max(14, Math.min(20, w / 48)), rh = Math.min(96, (H - 120) / 4);
            chu(ctx, "Cho hai lực đồng quy F₁ = 6 N và F₂ = 8 N. Xem xét các phát biểu sau:", W / 2, 30, VANG, co + 2, "center");
            var dung = 0;
            CAU.forEach(function (c, i) {
              var y = 60 + i * rh, c1 = chon[i];
              ctx.fillStyle = "rgba(15,23,42,.8)"; ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.rect(x0, y, w, rh - 8); ctx.fill(); ctx.stroke();
              chu(ctx, c[0], x0 + 12, y + (kt ? 20 : (rh - 8) / 2), "#e2e8f0", co);
              var bw = 84, bh = 34, by = y + (rh - 8) / 2 - bh / 2;
              [[true, "Đúng"], [false, "Sai"]].forEach(function (o, j) {
                var bx = x0 + w - 2 * bw - 22 + j * (bw + 8), sel = c1 === o[0], tot = kt && c[1] === o[0];
                ctx.fillStyle = kt ? (tot ? "#166534" : (sel ? "#991b1b" : "#1c2742")) : (sel ? "#1d4ed8" : "#1c2742");
                ctx.strokeStyle = sel ? "#fff" : "#33415f"; ctx.lineWidth = sel ? 2.5 : 1;
                ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 17); else ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
                chu(ctx, o[1], bx + bw / 2, by + bh / 2, "#fff", 15, "center"); vung.push([bx, by, bw, bh, i, o[0]]);
              });
              if (kt) {
                var ok = c1 === c[1]; if (ok) dung++;
                chu(ctx, (ok ? "✓ " : (c1 === null ? "(chưa chọn) " : "✗ ")) + c[2], x0 + 12, y + (rh - 8) - 20, ok ? "#86efac" : "#fca5a5", Math.max(13, co - 2));
              }
            });
            var xong = chon.every(function (v) { return v !== null });
            chu(ctx, kt ? "Đúng " + dung + " / 4 ý" : (xong ? "Đã chọn đủ 4 ý, bấm “Kiểm tra”" : "Đã chọn " + chon.filter(function (v) { return v !== null }).length + " / 4 ý"),
              W / 2, 60 + 4 * rh + 14, kt ? (dung === 4 ? "#86efac" : VANG) : XAM, co + 2, "center");
          }
        };
      }
    };
  }

  MP.dangKy("B13", 2, thiNghiem("Thí nghiệm tổng hợp hai lực đồng quy (ba lực kế)", "Vòng O đứng yên khi F₃ cân bằng với hợp lực của F₁ và F₂. Ghi số liệu nhiều lần, so sánh F₃ đo với F tính theo hình bình hành.", true));
  MP.dangKy("B13", 3, thiNghiem("Thu thập và xử lí số liệu", "Bấm “Ghi số liệu” nhiều lần với F₁, F₂, α khác nhau; so sánh cột F₃ đo với cột F tính. Giữ lực kế song song mặt bảng để tránh sai số.", true));
  MP.dangKy("B13", 4, tongHop("Kéo thanh trượt F₁, F₂, α: hợp lực là đường chéo của hình bình hành tạo bởi hai lực.", "Quy tắc hình bình hành", 60));
  MP.dangKy("B13", 5, tongHop("Độ lớn F phụ thuộc F₁, F₂ và góc α: F² = F₁² + F₂² + 2F₁F₂cosα, luôn nằm giữa |F₁ − F₂| và F₁ + F₂.", "Độ lớn hợp lực", 90));
  MP.dangKy("B13", 6, tongHop("Bấm các nút α = 0°, 90°, 180°, F₁ = F₂ để kiểm tra bốn trường hợp đặc biệt.", "Các trường hợp đặc biệt của hợp lực", 0));
  MP.dangKy("B13", 8, nghieng("Vì sao vật trượt xuống mặt phẳng nghiêng?", "Tăng góc α: thành phần Pₓ = P·sinα kéo vật trượt tăng dần; α = 0° thì Pₓ = 0."));
  MP.dangKy("B13", 9, phanTich);
  MP.dangKy("B13", 10, nghieng("Giải mã mặt phẳng nghiêng", "Pₓ = P·sinα (kéo trượt), P_y = P·cosα (ép lên mặt dốc), N = P_y. Đổi m và α để thấy các thành phần thay đổi."));
  MP.dangKy("B13", 11, thiNghiem("Điều kiện cân bằng: ba lực có hợp lực bằng 0", "F₁ + F₂ + F₃ = 0: đa giác lực khép kín. Đổi F₁, F₂, α; F₃ tự điều chỉnh để chất điểm cân bằng.", false));
  MP.dangKy("B13", 12, treo("Vật treo bằng hai dây", "T₁ + T₂ + P = 0 → 2T·sinα = P. Giảm α thì lực căng T tăng.", 20, 40));
  MP.dangKy("B13", 14, dungSai());
  MP.dangKy("B13", 15, tim);
  MP.dangKy("B13", 16, treo("Bài toán dây phơi", "Dây phơi căng ngang (α nhỏ) → T rất lớn → dễ đứt. Thử giảm α đến khi dây đứt, rồi tăng lại.", 30, 20));
})();
