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

  /* ---------- Dùng chung: nhãn k, đường cực đại / cực tiểu ---------- */
  function soN(k) { return k < 0 ? "−" + (-k) : String(k === 0 ? 0 : k) }
  /* Cực tiểu, vân tối gọi theo thứ tự "thứ 1, 2, 3…" từ giữa ra mỗi bên (không gọi k = 0).
     Đổi từ k trong công thức (k + 0,5): k ≥ 0 là thứ k + 1, k < 0 là thứ −k. */
  function thuCT(k) { return k < 0 ? -k : k + 1 }
  function nhanO(o, laK) {   // đổi chữ trước ô gõ số: "k =" (cực đại, vân sáng) hay "thứ" (cực tiểu, vân tối, gõ từ 1)
    o.parentNode.firstChild.nodeValue = laK ? "k = " : "thứ "; o.setAttribute("aria-label", laK ? "k =" : "thứ");
    if (!laK && !(+o.value >= 1)) o.value = 1;
  }
  function nhanK(ctx, x, y, t, vien, chu, hop, trai) {   // nhãn hộp tròn tâm (x, y) (trai: x là mép trái); hop: các nhãn đã vẽ, chồng lên thì bỏ
    ctx.save(); ctx.font = "bold 13px 'Segoe UI',sans-serif";
    var w = ctx.measureText(t).width + 12; if (trai) x += w / 2;
    var r = [x - w / 2, y - 10, w, 20];
    if (hop && hop.some(function (h) { return r[0] < h[0] + h[2] + 2 && h[0] < r[0] + r[2] + 2 && r[1] < h[1] + h[3] + 1 && h[1] < r[1] + r[3] + 1 })) { ctx.restore(); return false }
    if (hop) hop.push(r);
    ctx.fillStyle = "rgba(15,23,42,.86)"; ctx.strokeStyle = vien; ctx.lineWidth = 1.5;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r[0], r[1], r[2], r[3], 9); else ctx.rect(r[0], r[1], r[2], r[3]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = chu; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, x, y + 1); ctx.restore(); return true;
  }
  function diToi(st, dt, ten) {   // st[ten] chạy dần tới st.dich (M di chuyển), dt: giây thật
    if (st.dich == null) return false;
    st[ten] += (st.dich - st[ten]) * (1 - Math.exp(-dt * 6));
    if (Math.abs(st.dich - st[ten]) < 1e-3) { st[ten] = st.dich; st.dich = null }
    return true;
  }
  function giayThat(st) { var b = performance.now(), d = st.lan ? Math.min(.1, (b - st.lan) / 1000) : 0; st.lan = b; return d }

  /* Đường cực đại (nét liền) d₂ − d₁ = kλ, cực tiểu (nét đứt) d₂ − d₁ = (k + 0,5)λ, như slide "I.2. Giải thích hiện tượng".
     S₁ bên trái, S₂ bên phải: phía S₁ thì d₂ > d₁ nên k > 0, phía S₂ thì k < 0. Tên đường (cực đại: k; cực tiểu: thứ mấy) ghi ở chỗ đường ra mép dưới (hoặc mép bên);
     cực đại hàng dưới, cực tiểu hàng trên; nhãn chồng nhau thì bỏ đường xa tâm. */
  var MAU_CD = "rgba(254,202,202,.95)", MAU_CT = "rgba(147,222,253,.95)";
  function duongGT(ctx, o) {   // o: cx, cy (px), s (px/cm), d, lam (cm), W, H (vùng vẽ), cd, ct (hiện cực đại / cực tiểu), nhan (ghi k), chon: {cd, k} đường tô nổi
    var c = o.d / 2, N = Math.floor(o.d / o.lam * 2 - 1e-6), ds = [];
    for (var m = -N; m <= N; m++) {
      var cuc = m % 2 === 0, k = cuc ? -m / 2 : (-m - 1) / 2, noi = !!(o.chon && o.chon.cd === cuc && o.chon.k === k);
      if (!(cuc ? o.cd : o.ct) && !noi) continue;
      var a = m * o.lam / 4; ds.push({ m: m, cuc: cuc, k: k, noi: noi, a: a, b: Math.sqrt(Math.max(0, c * c - a * a)) });
    }
    ds.forEach(function (L) {
      ctx.save(); ctx.lineWidth = L.noi ? 3.6 : L.cuc ? 2.2 : 1.8; ctx.strokeStyle = L.noi ? "#fff" : L.cuc ? MAU_CD : MAU_CT; if (!L.cuc) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      if (L.m === 0) { ctx.moveTo(o.cx, 0); ctx.lineTo(o.cx, o.H) }
      else for (var n = 0; n <= 160; n++) {
        var th = -4 + n * .05, px = o.cx + L.a * Math.cosh(th) * o.s, py = o.cy + L.b * Math.sinh(th) * o.s;
        if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
    });
    if (o.nhan === false) return;
    var hop = [], hai = o.cd && o.ct;
    ds.slice().sort(function (p, q) { return (q.noi - p.noi) || Math.abs(p.m) - Math.abs(q.m) }).forEach(function (L) {
      var y = hai && !L.cuc ? o.H - 40 : o.H - 15, x;
      if (L.m === 0) x = o.cx;
      else { if (L.b < 1e-6) return; var Y = (y - o.cy) / o.s; x = o.cx + L.a * Math.sqrt(1 + Y * Y / (L.b * L.b)) * o.s }
      if (x < 26 || x > o.W - 26) {   // đường ra mép bên trước khi tới hàng nhãn
        var X = L.a > 0 ? o.W - 26 : 26, ax = Math.abs(X - o.cx) / o.s, aa = Math.abs(L.a);
        if (ax <= aa) return;
        y = o.cy + L.b * Math.sqrt(ax * ax / (aa * aa) - 1) * o.s; x = X;
        if (y > o.H - 15 || y < 12) return;
      }
      nhanK(ctx, x, y, L.cuc ? "k=" + soN(L.k) : "thứ " + thuCT(L.k), L.noi ? "#fff" : L.cuc ? MAU_CD : MAU_CT, L.noi ? "#fff" : L.cuc ? "#fecaca" : "#bae6fd", hop);
    });
  }

  /* ---------- Slide 3, 4, 6: hai nguồn trên mặt nước ---------- */
  function nuoc(kieu) {   // kieu: "co-ban" (slide 3, 4) | "dieu-kien" (slide 6: thử phá điều kiện kết hợp)
    var dkien = kieu === "dieu-kien";
    return {
      ten: dkien ? "Điều kiện giao thoa: hai nguồn kết hợp" : "Giao thoa sóng mặt nước: hai nguồn kết hợp S₁, S₂",
      goiY: dkien ? "Giữ f₂ = f₁ và Δφ không đổi thì có vân ổn định. Đổi f₂ hoặc bật \"pha nhảy lung tung\" thì hệ vân mất."
        : "Nét liền: cực đại (Δd = kλ). Nét đứt: cực tiểu (Δd = (k + 0,5)λ). Chân đường cực đại ghi k, chân đường cực tiểu ghi thứ 1, 2, 3… Đổi f, v và khoảng cách S₁S₂.",
      tao: function (ui) {
        var f = 4, v = 20, d = 6, cd = true, ct = true, RONG = 24, f2 = 4, dphi = 0, nhay = false, buf = taoBuf();   // cm, Hz
        ui.truot("Tần số f₁", 2, 8, 0.5, f, "Hz", function (x) { f = x; if (!dkien) f2 = x });
        if (!dkien) ui.truot("Tốc độ v", 10, 30, 1, v, "cm/s", function (x) { v = x });
        ui.truot("Khoảng cách S₁S₂", 3, 12, 0.5, d, "cm", function (x) { d = x });
        if (dkien) {
          ui.truot("Tần số f₂", 2, 8, 0.1, f2, "Hz", function (x) { f2 = x });
          ui.truot("Độ lệch pha Δφ", 0, 6.28, 0.1, dphi, "rad", function (x) { dphi = x });
          ui.chon("Pha nhảy lung tung theo thời gian", nhay, function (x) { nhay = x });
        } else {
          ui.chon("Hiện đường cực đại (nét liền)", cd, function (x) { cd = x });
          ui.chon("Hiện đường cực tiểu (nét đứt)", ct, function (x) { ct = x });
        }
        return {
          ve: function (ctx, W, H, t) {
            var s = W / RONG, lam = v / f, k1 = TAU / lam, k2 = TAU * f2 / v, w1 = TAU * f, w2 = TAU * f2, cx = W / 2, cy = H / 2, x1 = cx - d / 2 * s, x2 = cx + d / 2 * s;
            var ph = dphi + (nhay ? 7.3 * Math.sin(Math.floor(t / 0.55) * 12.9898) * 43758.5 % TAU : 0);
            truong(buf, ctx, W, H, { x1: x1, y1: cy, x2: x2, y2: cy, s: s, k1: k1, k2: k2, w1: w1, w2: w2, ph: ph, t: t, mau: mauNuoc });
            var kethop = Math.abs(f2 - f) < 1e-6 && !nhay;
            if (!dkien && (cd || ct)) duongGT(ctx, { cx: cx, cy: cy, s: s, d: d, lam: lam, W: W, H: H, cd: cd, ct: ct });
            nguon(ctx, x1, cy, "S₁", w1, t); nguon(ctx, x2, cy, "S₂", w2, t);
            V.kichThuoc(ctx, x1, x2, Math.min(H - 12, cy + 56), "S₁S₂ = " + so(d) + " cm", "#fde047");
            if (dkien) V.hop(ctx, 12, 12, [kethop ? "*Hai nguồn kết hợp*: cùng phương, cùng tần số, Δφ không đổi" : "*Không kết hợp*: " + (nhay ? "Δφ thay đổi liên tục" : "f₂ ≠ f₁"),
              kethop ? "→ Hệ vân (cực đại, cực tiểu) đứng yên, ổn định" : "→ Vị trí cực đại, cực tiểu cứ xê dịch, không có hệ vân ổn định"]);
            else V.hop(ctx, 12, 12, ["Bước sóng *λ = v/f = " + so(lam, 2) + " cm*", "Hai cực đại liền kề trên S₁S₂ cách nhau *λ/2 = " + so(lam / 2, 2) + " cm*",
              "Cực đại: *d₂ − d₁ = kλ* · Cực tiểu: *d₂ − d₁ = (k + 0,5)λ*", "Cực đại: k > 0 phía S₁, k < 0 phía S₂", "Cực tiểu: thứ 1, 2, 3… tính từ giữa ra mỗi bên"]);
          }
        };
      }
    };
  }
  MP.dangKy("B12", 3, nuoc("co-ban"));
  MP.dangKy("B12", 4, nuoc("co-ban"));
  MP.dangKy("B12", 6, nuoc("dieu-kien"));

  /* ---------- Slide 5: điểm M, d₁, d₂, Δd; gõ số để đưa M tới cực đại bậc k / cực tiểu thứ mấy ---------- */
  MP.dangKy("B12", 5, {
    ten: "Điểm M: d₁, d₂ và hiệu đường đi Δd = d₂ − d₁",
    goiY: "Bấm lên mặt nước (hoặc kéo thanh trượt) để đặt M, hoặc chọn đường rồi gõ số (cực đại: k; cực tiểu: thứ mấy) để M chạy tới (giữ khoảng cách tới S₁S₂).",
    tao: function (ui) {
      var lam = 2, d = 6, RONG = 24, hx, hy, cd = false, ct = false, chon = null, ghi = "", st = { x: 3, y: 7, tx: null, ty: null, lan: 0 };   // cm; tx, ty: chỗ M đang chạy tới
      ui.truot("Bước sóng λ", 1, 4, 0.1, lam, "cm", function (x) { lam = x; if (chon) denDuong(false) });
      hx = ui.truot("M: vị trí ngang", -10, 10, 0.1, st.x, "cm", function (x) { st.x = x; boChon() });
      hy = ui.truot("M: khoảng cách tới S₁S₂", 1, 8, 0.1, st.y, "cm", function (x) { st.y = x; boChon() });
      ui.chon("Hiện đường cực đại", cd, function (x) { cd = x });
      ui.chon("Hiện đường cực tiểu", ct, function (x) { ct = x });
      var oL = ui.ds("Đưa M tới đường", [["cd", "cực đại"], ["ct1", "cực tiểu phía S₁"], ["ct2", "cực tiểu phía S₂"]], "cd", function () { nhanO(oK, oL.value === "cd"); denDuong(true) });
      var oK = ui.so("k =", 1, function () { denDuong(true) });
      function boChon() { chon = null; st.tx = st.ty = null; ghi = "" }
      function capNhat() { hx.value = st.x; hy.value = st.y; hx.hien(); hy.hien() }
      function denDuong(chay) {   // chay: M chạy tới; không chạy (đổi λ): M nhảy theo đường luôn
        var k = Math.round(+String(oK.value).replace(",", ".")); if (!isFinite(k)) return;
        var cuc = oL.value === "cd", ten = cuc ? "cực đại k = " + soN(k) : "cực tiểu thứ " + k + (oL.value === "ct1" ? " phía S₁" : " phía S₂");
        if (!cuc) {
          if (k < 1) { chon = null; st.tx = st.ty = null; ghi = "Cực tiểu đếm từ thứ 1"; return }
          k = oL.value === "ct1" ? k - 1 : -k;   // giá trị k thay vào (k + 0,5)λ
        }
        var dl = (cuc ? k : k + 0.5) * lam, c = d / 2, a = Math.abs(dl) / 2;
        if (Math.abs(dl) >= d - 1e-9) {
          chon = null; st.tx = st.ty = null;
          ghi = "Không có đường " + ten + " vì cần |Δd| < S₁S₂ = " + so(d, 0) + " cm"; return;
        }
        var b = Math.sqrt(c * c - a * a), X = function (y) { return a ? -Math.sign(dl) * a * Math.sqrt(1 + y * y / (b * b)) : 0 }, y = st.y;
        if (Math.abs(X(y)) > 10) y = Math.max(1, Math.min(8, b * Math.sqrt(100 / (a * a) - 1)));
        chon = { cd: cuc, k: k }; ghi = "";
        if (chay) { st.tx = X(y); st.ty = y } else { st.x = X(y); st.y = y; st.tx = st.ty = null; capNhat() }
      }
      var buf = taoBuf();
      return {
        nhap: function (px, py, W, H) {   // bấm để đặt M trong vùng sóng (nửa trái của khung)
          var s = (W * .62) / RONG, cx = W * .31, cy = H * .22; var X = (px - cx) / s, Y = (py - cy) / s;
          if (px < W * .62 && Y > 0.5) { st.x = Math.max(-10, Math.min(10, X)); st.y = Math.max(1, Math.min(8, Y)); hx.value = st.x; hy.value = st.y; hx.oninput(); hy.oninput() }
        },
        ve: function (ctx, W, H, t) {
          var dt = giayThat(st);
          if (st.tx !== null) {   // M chạy tới đường bậc k vừa gõ
            var fk = 1 - Math.exp(-dt * 6); st.x += (st.tx - st.x) * fk; st.y += (st.ty - st.y) * fk;
            if (Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) < 2e-3) { st.x = st.tx; st.y = st.ty; st.tx = st.ty = null }
            capNhat();
          }
          var xm = st.x, ym = st.y;
          var Wf = W * .62, s = Wf / RONG, cx = Wf / 2, cy = H * .22, k = TAU / lam, w = TAU * 1.0;
          var S1 = [cx - d / 2 * s, cy], S2 = [cx + d / 2 * s, cy], M = [cx + xm * s, cy + ym * s];
          ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Wf, H); ctx.clip();
          truong(buf, ctx, Wf, H, { x1: S1[0], y1: S1[1], x2: S2[0], y2: S2[1], s: s, k1: k, k2: k, w1: w, w2: w, ph: 0, t: t, mau: mauNuoc });
          if (cd || ct || chon) duongGT(ctx, { cx: cx, cy: cy, s: s, d: d, lam: lam, W: Wf, H: H, cd: cd, ct: ct, chon: chon });
          ctx.restore();
          var d1 = Math.hypot(xm + d / 2, ym), d2 = Math.hypot(xm - d / 2, ym), dd = d2 - d1, q = dd / lam;
          ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = "#fde047"; ctx.beginPath(); ctx.moveTo(S1[0], S1[1]); ctx.lineTo(M[0], M[1]); ctx.stroke();
          ctx.strokeStyle = "#fb923c"; ctx.beginPath(); ctx.moveTo(S2[0], S2[1]); ctx.lineTo(M[0], M[1]); ctx.stroke(); ctx.restore();
          ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "#fde047"; ctx.fillText("d₁", (S1[0] + M[0]) / 2 - 22, (S1[1] + M[1]) / 2); ctx.fillStyle = "#fb923c"; ctx.fillText("d₂", (S2[0] + M[0]) / 2 + 8, (S2[1] + M[1]) / 2);
          nguon(ctx, S1[0], S1[1], "S₁", w, t); nguon(ctx, S2[0], S2[1], "S₂", w, t);
          ctx.beginPath(); ctx.arc(M[0], M[1], 8, 0, TAU); ctx.fillStyle = "#ef4444"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.fillText("M", M[0] + 12, M[1] + 5);
          // đồ thị dao động do từng sóng gây ra tại M (bên phải)
          var gx = Wf + 18, gw = W - gx - 14, gh = (H - 60) / 3, T = 2, names = [["Sóng từ S₁ tới M", "#fde047", function (tt) { return Math.sin(w * tt - k * d1) }], ["Sóng từ S₂ tới M", "#fb923c", function (tt) { return Math.sin(w * tt - k * d2) }],
            ["Tổng hợp tại M", "#7dd3fc", function (tt) { return Math.sin(w * tt - k * d1) + Math.sin(w * tt - k * d2) }]];
          names.forEach(function (o, n) {
            var y0 = 24 + n * (gh + 8), yc = y0 + gh / 2 + 8; ctx.fillStyle = "#9fb0cc"; ctx.font = "13px 'Segoe UI',sans-serif"; ctx.fillText(o[0], gx, y0 + 4);
            ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, yc); ctx.lineTo(gx + gw, yc); ctx.stroke();
            ctx.strokeStyle = o[1]; ctx.lineWidth = 2.2; ctx.beginPath();
            for (var i = 0; i <= gw; i += 2) { var tt = t - T + T * i / gw, y = yc - o[2](tt) * (gh / 2 - 4) * .5; if (i === 0) ctx.moveTo(gx + i, y); else ctx.lineTo(gx + i, y) } ctx.stroke();
          });
          var gan = Math.abs(q - Math.round(q)) < 0.04, gan2 = Math.abs(q - Math.round(q - .5) - .5) < 0.04;
          var kq = gan ? "CỰC ĐẠI k = " + soN(Math.round(q)) + " (cùng pha, tăng cường)" : gan2 ? "CỰC TIỂU thứ " + thuCT(Math.round(q - .5)) + (q > 0 ? " phía S₁" : " phía S₂") + " (ngược pha, triệt tiêu)" : "chưa phải cực đại hay cực tiểu";
          var dong = ["d₁ = " + so(d1, 2) + " cm · d₂ = " + so(d2, 2) + " cm → *Δd = " + so(dd, 2) + " cm*", "Δd/λ = *" + so(q, 2) + "* → " + kq];
          if (ghi) dong.push("*" + ghi + "*");
          V.hop(ctx, 12, H - (ghi ? 150 : 128), dong, { co: 15 });
        }
      };
    }
  });

  /* ---------- Slide 2, 13: hai loa và micro (âm to, âm nhỏ) ---------- */
  function loa(kieu) {
    return {
      ten: "Hai loa phát cùng một âm: micro nghe chỗ to, chỗ nhỏ",
      goiY: "Kéo micro dọc theo đường thẳng: chỗ Δd = kλ nghe to (L, ghi k), chỗ Δd = (k + 0,5)λ nghe nhỏ (B). Sóng đang được phát chậm lại để dễ nhìn.",
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
            var dY = (yL - yS) / s, dd = function (x) { return Math.hypot(x - d / 2, dY) - Math.hypot(x + d / 2, dY) };   // Δd = d₂ − d₁ (x tính bằng m)
            ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(0, yL); ctx.lineTo(W, yL); ctx.stroke(); ctx.setLineDash([]);
            // nhãn L (âm to), B (âm nhỏ) dọc đường đi của micro; trên mỗi L ghi k (Δd = kλ)
            var dmax = Math.abs(dd(RONG / 2)), M = Math.floor(dmax / lam * 2 - 1e-6), dsK = [];
            for (var m = -M; m <= M; m++) {
              var lo = -RONG / 2, hi = RONG / 2, a = dd(lo) - m * lam / 2, b = dd(hi) - m * lam / 2;
              if (a * b > 0) continue;
              for (var it = 0; it < 30; it++) { var mid = (lo + hi) / 2, c = dd(mid) - m * lam / 2; if (c * a > 0) { lo = mid; a = c } else hi = mid }
              var px = cx + lo * s, to = m % 2 === 0; ctx.beginPath(); ctx.arc(px, yL, 11, 0, TAU); ctx.fillStyle = to ? "#ef4444" : "#38bdf8"; ctx.fill();
              ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(to ? "L" : "B", px, yL + 1);
              if (to) dsK.push([m / 2, px]);
            }
            var hopK = [];
            dsK.sort(function (p, q) { return Math.abs(p[0]) - Math.abs(q[0]) }).forEach(function (o) { nhanK(ctx, o[1], yL - 26, "k=" + soN(o[0]), "#fca5a5", "#fecaca", hopK) });
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

  /* ---------- Y-âng (nhìn ngang): nguồn sáng → khe F → hai khe S₁, S₂ → màn E đặt dọc. i = λD/a ----------
     Màn vẽ đúng tỉ lệ theo mm (vùng ±6 mm); khoảng cách a, D chỉ vẽ phỏng (a, D thật rất khác cỡ nhau) nhưng kéo thì khe, màn dịch theo.
     Vân sáng x = k·i, vân tối x = (k + 0,5)i (x tính từ vân trung tâm, chiều dương lên trên); vân tối thứ n cách vân trung tâm (n − 0,5)i. */
  function rgbLam(l) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1 } else if (l < 490) { g = (l - 440) / 50; b = 1 } else if (l < 510) { g = 1; b = (510 - l) / 20 }
    else if (l < 580) { r = (l - 510) / 70; g = 1 } else if (l < 645) { r = 1; g = (645 - l) / 65 } else r = 1;
    var f = l < 420 ? .3 + .7 * (l - 380) / 40 : l > 700 ? .3 + .7 * (780 - l) / 80 : 1; return [r * f, g * f, b * f];
  }
  function tenMau(l) { return l < 450 ? "tím" : l < 495 ? "lam" : l < 570 ? "lục" : l < 590 ? "vàng" : l < 620 ? "cam" : "đỏ" }
  function rgbCss(c, a) { return "rgba(" + Math.round(255 * c[0]) + "," + Math.round(255 * c[1]) + "," + Math.round(255 * c[2]) + "," + (a == null ? 1 : a) + ")" }
  function doDoc(ctx, x, y1, y2, nhan, mau) {   // mũi tên hai đầu thẳng đứng, nhãn bên trái
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = mau; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.moveTo(x - 6, y1); ctx.lineTo(x + 6, y1); ctx.moveTo(x - 6, y2); ctx.lineTo(x + 6, y2); ctx.stroke();
    var c = y2 > y1 ? 1 : -1;
    [[y1, c], [y2, -c]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(x, p[0]); ctx.lineTo(x - 4, p[0] + 8 * p[1]); ctx.lineTo(x + 4, p[0] + 8 * p[1]); ctx.closePath(); ctx.fill() });
    ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(11,18,32,.9)"; ctx.strokeText(nhan, x - 9, (y1 + y2) / 2); ctx.fillText(nhan, x - 9, (y1 + y2) / 2);
    ctx.restore();
  }
  function yang(p) {   // p: lam (nm), a (mm), D (m), trang (ánh sáng trắng), chuoi (số vân sáng liên tiếp cần đánh dấu)
    return {
      ten: p.trang ? "Giao thoa Y-âng với ánh sáng trắng" : "Giao thoa Y-âng: khoảng vân i = λD/a",
      goiY: p.trang ? "Vân trung tâm màu trắng, hai bên là các dải màu (tím gần vân trung tâm, đỏ xa). Đổi a, D để xem dải màu rộng ra hay hẹp lại."
        : "Kéo a, D và λ (tím → đỏ) để xem khoảng vân i. Chọn vân rồi gõ số (vân sáng: k; vân tối: thứ mấy) để đưa điểm M trên màn tới đó.",
      tao: function (ui) {
        var lam = p.lam, a = p.a, D = p.D, RONG = 12, hienK = true, hienI = true, st = { y: null, dich: null, lan: 0 }, kM = null, ghi = "", oL = null, oK = null;   // λ (nm), a (mm), D (m), vùng màn (mm)
        if (!p.trang) ui.truot("Bước sóng λ (tím → đỏ)", 380, 760, 10, lam, "nm", function (x) { lam = x; theo() });
        ui.truot("Khoảng cách hai khe a", 0.1, 2, 0.05, a, "mm", function (x) { a = x; theo() });
        ui.truot("Khoảng cách hai khe – màn D", 0.5, 3, 0.1, D, "m", function (x) { D = x; theo() });
        ui.chon("Hiện k vân sáng (0; ±1; ±2…)", hienK, function (x) { hienK = x });
        ui.chon("Hiện khoảng vân i", hienI, function (x) { hienI = x });
        if (!p.trang) {
          oL = ui.ds("Điểm M tại", [["s", "vân sáng"], ["tt", "vân tối phía trên"], ["td", "vân tối phía dưới"]], "s", function () { nhanO(oK, oL.value === "s"); datM(true) });
          oK = ui.so("k =", 1, function () { datM(true) });
        }
        function iMM(l) { return (l || (p.trang ? 550 : lam)) * 1e-3 * D / a }
        function datM(chay) {   // chay: M chạy tới; không chạy (đổi λ, a, D): M theo vân luôn
          var k = Math.round(+String(oK.value).replace(",", ".")); if (!isFinite(k)) return;
          var sang = oL.value === "s", tren = oL.value === "tt";
          if (!sang && k < 1) { kM = null; ghi = "Vân tối đếm từ thứ 1"; st.dich = null; st.y = null; return }
          var he = sang ? k : (tren ? 1 : -1) * (k - 0.5), x = he * iMM();   // x = he·i
          var ten = sang ? "sáng k = " + soN(k) : "tối thứ " + k + (tren ? " phía trên" : " phía dưới");
          kM = { ten: ten, he: he, ct: sang ? "k·i" : (tren ? "" : "−") + "(" + k + " − 0,5)i" };
          if (Math.abs(x) > RONG / 2) { ghi = "Vân " + ten + " ở x = " + so(x, 2) + " mm, ngoài vùng màn đang vẽ (±" + RONG / 2 + " mm)"; st.dich = null; st.y = null; return }
          ghi = "";
          if (chay && st.y !== null) st.dich = x; else { st.y = x; st.dich = null }
        }
        function theo() { if (kM) datM(false) }
        if (!p.trang) datM(false);
        return {
          ve: function (ctx, W, H) {
            diToi(st, giayThat(st), "y");
            ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
            var i = iMM(), rgb = rgbLam(p.trang ? 550 : lam), mau = p.trang ? "rgba(255,255,255,1)" : rgbCss(rgb),
              cy = H * .43, yT = H * .05, yB = H * .81, mmPx = (yB - yT) / RONG, rs = 22,
              xN = W * .05, xF = W * .13, xK = W * .23, xM = xK + W * (.1 + .13 * D), aPx = 14 + a * 40, yS1 = cy - aPx / 2, yS2 = cy + aPx / 2;
            var I = function (ymm, l) { var q = Math.cos(Math.PI * ymm / iMM(l)); return q * q };
            // chùm sáng (mờ): nguồn → khe F → hai khe → màn
            ctx.save(); ctx.fillStyle = p.trang ? "rgba(255,255,255,.1)" : rgbCss(rgb, .14);
            ctx.beginPath(); ctx.moveTo(xN, cy); ctx.lineTo(xF, cy - 34); ctx.lineTo(xF, cy + 34); ctx.fill();
            ctx.beginPath(); ctx.moveTo(xF, cy); ctx.lineTo(xK, yS1 - 18); ctx.lineTo(xK, yS2 + 18); ctx.fill();
            ctx.fillStyle = p.trang ? "rgba(255,255,255,.06)" : rgbCss(rgb, .08);
            [yS1, yS2].forEach(function (ys) { ctx.beginPath(); ctx.moveTo(xK, ys); ctx.lineTo(xM, yT); ctx.lineTo(xM, yB); ctx.fill() });
            ctx.restore();
            // nguồn sáng
            var gl = ctx.createRadialGradient(xN, cy, 2, xN, cy, 34); gl.addColorStop(0, mau); gl.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(xN, cy, 34, 0, TAU); ctx.fill();
            ctx.fillStyle = mau; ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xN, cy, 11, 0, TAU); ctx.fill(); ctx.stroke();
            // khe F và màn chắn hai khe (thẳng đứng)
            function tam(x, y0, y1, khe) {   // tấm chắn từ y0 đến y1, có các khe (tâm khe)
              ctx.fillStyle = "#94a3b8"; var a0 = y0;
              khe.concat([y1 + 3]).forEach(function (k) { ctx.fillRect(x - 3, a0, 6, Math.max(0, k - 3 - a0)); a0 = k + 3 });
            }
            tam(xF, cy - 70, cy + 70, [cy]);
            tam(xK, H * .18, H * .68, [yS1, yS2]);
            ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
            ctx.fillText("S₁", xK - 8, yS1); ctx.fillText("S₂", xK - 8, yS2);
            ctx.font = "13px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#cbd5e1";
            ctx.fillText("Nguồn sáng", xN + 8, cy + 40); ctx.fillText("Khe F", xF, cy + 76); ctx.fillText("Hai khe", xK, H * .68 + 6);
            if (aPx > 26) doDoc(ctx, xK + 22, yS1, yS2, "", "#a5b4fc");
            ctx.save(); ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.fillStyle = "#a5b4fc"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("a = " + so(a, 2) + " mm", xK + 30, cy); ctx.restore();
            // màn quan sát E (đúng tỉ lệ theo mm)
            var hs = Math.ceil(yB - yT), img = ctx.createImageData(1, hs), dd = img.data;
            for (var j = 0; j < hs; j++) {
              var ymm = (cy - (yT + j + .5)) / mmPx, c;
              if (p.trang) { var R = 0, G = 0, B = 0; for (var l = 400; l <= 700; l += 10) { var cc = rgbLam(l), e0 = I(ymm, l); R += cc[0] * e0; G += cc[1] * e0; B += cc[2] * e0 } c = [Math.min(1, R / 15 * 1.05), Math.min(1, G / 15 * 1.05), Math.min(1, B / 15 * 1.05)] }
              else { var e = I(ymm); c = [rgb[0] * e, rgb[1] * e, rgb[2] * e] }
              dd[j * 4] = 255 * c[0]; dd[j * 4 + 1] = 255 * c[1]; dd[j * 4 + 2] = 255 * c[2]; dd[j * 4 + 3] = 255;
            }
            var tmp = document.createElement("canvas"); tmp.width = 1; tmp.height = hs; tmp.getContext("2d").putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, xM - rs, yT, 2 * rs, hs); ctx.imageSmoothingEnabled = true;
            ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1; ctx.strokeRect(xM - rs, yT, 2 * rs, hs);
            ctx.font = "bold 13px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#fff"; ctx.fillText("Màn E", xM, yT - 3);
            V.kichThuoc(ctx, xK, xM, H * .12, "D = " + so(D, 1) + " m", "#fde047");
            // đồ thị cường độ sáng bên phải màn
            var xG0 = xM + rs + 64, xG1 = Math.min(W - 14, xG0 + 190);
            if (xG1 - xG0 > 50) {
              ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xG0, yT); ctx.lineTo(xG0, yB); ctx.stroke();
              ctx.fillStyle = "#9fb0cc"; ctx.font = "12px 'Segoe UI',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("Cường độ sáng I", xG0, yT - 3);
              (p.trang ? [[420, "#a78bfa"], [550, "#4ade80"], [680, "#f87171"]] : [[lam, mau]]).forEach(function (o) {
                ctx.strokeStyle = o[1]; ctx.lineWidth = p.trang ? 1.8 : 2.4; ctx.beginPath();
                for (var y = yT; y <= yB; y += 1.5) { var xg = xG0 + I((cy - y) / mmPx, o[0]) * (xG1 - xG0) * .92; if (y === yT) ctx.moveTo(xg, y); else ctx.lineTo(xg, y) } ctx.stroke();
              });
            }
            // k của các vân sáng (bên phải màn)
            if (hienK) {
              var hop = [], K = Math.floor(RONG / 2 / i);
              for (var n = 0; n <= K; n++) [n, -n].forEach(function (k, z) {
                if (z && !n) return;
                var y = cy - k * i * mmPx; if (y < yT + 6 || y > yB - 6) return;
                if (nhanK(ctx, xM + rs + 6, y, "k=" + soN(k), "#e2e8f0", "#fff", hop, true)) { ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xM + rs - 6, y); ctx.lineTo(xM + rs + 6, y); ctx.stroke() }
              });
            }
            // khoảng vân i (bên trái màn), N vân sáng liên tiếp
            if (hienI) {
              if (i * mmPx >= 14) doDoc(ctx, xM - rs - 12, cy, cy - i * mmPx, "i = " + so(i, 3) + " mm", "#fde047");
              else nhanK(ctx, xM - rs - 70, cy, "i = " + so(i, 3) + " mm", "#fde047", "#fde047");
            }
            if (p.chuoi) {
              var yE = cy - (p.chuoi - 1) * i * mmPx;
              if (yE > yT) doDoc(ctx, xM - rs - (hienI ? 150 : 12), cy, yE, p.chuoi + " vân sáng liên tiếp = " + (p.chuoi - 1) + "i = " + so((p.chuoi - 1) * i, 2) + " mm", "#86efac");
              else nhanK(ctx, xM - rs - 170, yT + 14, "Màn chưa đủ " + p.chuoi + " vân sáng: giảm λ, D hoặc tăng a", "#86efac", "#86efac");
            }
            // điểm M trên màn
            if (st.y !== null) {
              var py = cy - st.y * mmPx;
              ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.5;
              [yS1, yS2].forEach(function (ys) { ctx.beginPath(); ctx.moveTo(xK, ys); ctx.lineTo(xM, py); ctx.stroke() }); ctx.restore();
              ctx.beginPath(); ctx.arc(xM, py, 8, 0, TAU); ctx.fillStyle = "#ef4444"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
              ctx.font = "bold 16px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(11,18,32,.9)";
              ctx.strokeText("M", xM, py - 10); ctx.fillStyle = "#fff"; ctx.fillText("M", xM, py - 10);
            }
            var dong = p.trang ? ["Vân trung tâm (k = 0): *mọi màu cùng sáng → trắng*", "Vân bậc 1: tím (λ nhỏ, i nhỏ) gần tâm, đỏ (λ lớn, i lớn) xa tâm", "Nhãn k và i tính cho λ = 550 nm (lục)"]
              : ["*i = λD/a = " + so(lam * 1e-3, 2) + " μm × " + so(D, 1) + " m / " + so(a, 2) + " mm = " + so(i, 3) + " mm*",
                 "λ = " + lam + " nm: ánh sáng " + tenMau(lam) + " · vân thưa ra khi tăng λ, tăng D hoặc giảm a"];
            if (kM && !ghi) dong.push("M: vân " + kM.ten + " → *x = " + kM.ct + " = " + so(kM.he * i, 3) + " mm*");
            if (ghi) dong.push("*" + ghi + "*");
            if (p.chuoi) dong.push("N vân sáng liên tiếp có (N − 1) khoảng vân");
            V.hop(ctx, 12, H - dong.length * 14 * 1.45 - 22, dong, { co: 14 });
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
