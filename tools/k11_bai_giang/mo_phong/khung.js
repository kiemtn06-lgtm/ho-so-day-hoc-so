/* Khung mô phỏng cho bài giảng khối 11 (trình chiếu ảnh).
   Mỗi bài có file mo_phong/<MA>.js gọi MP.dangKy(ma, chỉ_số_slide_từ_0, {ten, goiY, tao(ui) -> {ve(ctx,W,H,t,dt), datLai?, nhap?}}).
   Trang trình chiếu hiện nút "Mô phỏng" (phím M) ở slide có mô phỏng. */
window.MP = (function () {
  var DS = {}, K, cv, ctx, dk, chay = null, mo = false, tam = false, toc = 1, t = 0, last = 0, nutVe = null, W = 0, H = 0;
  function dangKy(ma, i, def) { DS[ma + "@" + i] = def }
  function co(ma, i) { return !!DS[ma + "@" + i] }
  function dungKhung() {
    if (K) return;
    var st = document.createElement("style");
    st.textContent =
      "#mpK{position:fixed;inset:0;z-index:9998;background:rgba(3,7,18,.82);display:none;padding:1.5vh 1.5vw}" +
      "#mpK.mo{display:flex}" +
      "#mpK .mp-hop{margin:auto;width:100%;height:100%;display:flex;flex-direction:column;background:#0f172a;border:1px solid #2a3a5c;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px #000a}" +
      "#mpK .mp-dau{display:flex;align-items:center;gap:12px;padding:8px 12px 8px 16px;border-bottom:1px solid #24304a}" +
      "#mpK .mp-ten{font-size:17px;color:#f1f5f9}#mpK .mp-gc{flex:1;min-width:0;color:#9fb0cc;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#mpK .mp-than{flex:1;min-height:0;position:relative}#mpK canvas{position:absolute;inset:0;width:100%;height:100%;display:block}" +
      "#mpK .mp-dk{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;padding:10px 16px;border-top:1px solid #24304a;font-size:14px;color:#d6deeb}" +
      "#mpK button,#mpK select{font:600 14px 'Segoe UI',sans-serif;color:#e5e7eb;background:#1c2742;border:1px solid #33415f;border-radius:999px;padding:6px 13px;cursor:pointer;min-height:34px}" +
      "#mpK button:hover{border-color:#60a5fa}#mpK :focus-visible{outline:3px solid #60a5fa;outline-offset:2px}" +
      "#mpK label{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}#mpK input[type=range]{width:130px;accent-color:#38bdf8}" +
      "#mpK input[type=checkbox]{width:17px;height:17px;accent-color:#38bdf8}#mpK output{font-weight:700;color:#7dd3fc;font-variant-numeric:tabular-nums;min-width:3.2em;display:inline-block}" +
      "@media (max-width:720px){#mpK .mp-gc{display:none}#mpK input[type=range]{width:100px}}";
    document.head.appendChild(st);
    K = document.createElement("div"); K.id = "mpK"; K.setAttribute("role", "dialog"); K.setAttribute("aria-modal", "true");
    K.innerHTML = '<div class="mp-hop"><div class="mp-dau"><b class="mp-ten"></b><span class="mp-gc"></span><button type="button" class="mp-dong" title="Đóng (Esc)">Đóng ✕</button></div>' +
      '<div class="mp-than"><canvas></canvas></div><div class="mp-dk"></div></div>';
    document.body.appendChild(K);
    cv = K.querySelector("canvas"); ctx = cv.getContext("2d"); dk = K.querySelector(".mp-dk");
    K.querySelector(".mp-dong").onclick = dong;
    cv.addEventListener("click", function (e) {
      if (!chay || !chay.nhap) return; var r = cv.getBoundingClientRect(); chay.nhap(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    });
    document.addEventListener("keydown", function (e) {
      if (!mo) return;
      var tg = e.target.tagName;
      if (e.key === "Escape") { dong(); e.preventDefault(); e.stopImmediatePropagation() }
      else if (e.key === " " && tg !== "BUTTON" && tg !== "INPUT" && tg !== "SELECT") { datTam(!tam); e.preventDefault(); e.stopImmediatePropagation() }
    });
  }
  var nutTam;
  function datTam(x) { tam = x; nutTam.textContent = tam ? "▶ Chạy tiếp" : "⏸ Tạm dừng" }
  function datLai() { t = 0; if (chay && chay.datLai) chay.datLai() }
  function taoUI() {
    dk.innerHTML = "";
    nutTam = them("button", "⏸ Tạm dừng"); nutTam.type = "button"; nutTam.title = "Tạm dừng / chạy tiếp (phím cách)"; nutTam.onclick = function () { datTam(!tam) };
    var nl = them("button", "↺ Bắt đầu lại"); nl.type = "button"; nl.onclick = datLai;
    var lb = them("label", "Tốc độ phát "), s = document.createElement("select");
    [[0.25, "×0,25 (rất chậm)"], [0.5, "×0,5 (chậm)"], [1, "×1 (thật)"]].forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; s.appendChild(op) });
    s.value = String(toc); s.onchange = function () { toc = +s.value }; lb.appendChild(s);
    return {
      truot: function (nhan, a, b, buoc, gt, dv, fn) {
        var l = them("label", nhan + " "), r = document.createElement("input"), o = document.createElement("output");
        r.type = "range"; r.min = a; r.max = b; r.step = buoc; r.value = gt; r.setAttribute("aria-label", nhan);
        var hien = function () { o.textContent = String(+r.value).replace(".", ",") + (dv ? " " + dv : "") };
        r.oninput = function () { hien(); fn(+r.value) }; hien(); l.appendChild(r); l.appendChild(o); return r;
      },
      chon: function (nhan, gt, fn) {
        var l = them("label", ""), c = document.createElement("input"); c.type = "checkbox"; c.checked = gt;
        c.onchange = function () { fn(c.checked) }; l.appendChild(c); l.appendChild(document.createTextNode(nhan)); return c;
      },
      nut: function (nhan, fn) { var b = them("button", nhan); b.type = "button"; b.onclick = fn; return b },
      datLai: datLai,
      tocDo: function (x) { toc = x; s.value = String(x) }
    };
  }
  function them(tag, txt) { var e = document.createElement(tag); if (txt) e.textContent = txt; dk.appendChild(e); return e }
  function khung(ts) {
    if (!mo) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    var d = tam ? 0 : dt * toc; t += d;
    var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    var cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (W > 20 && H > 20) chay.ve(ctx, W, H, t, d);
    requestAnimationFrame(khung);
  }
  function moMP(ma, i, t0) {
    var def = DS[ma + "@" + i]; if (!def) return;
    dungKhung(); nutVe = document.activeElement;
    K.querySelector(".mp-ten").textContent = def.ten; K.querySelector(".mp-gc").textContent = def.goiY || "";
    K.setAttribute("aria-label", "Mô phỏng: " + def.ten);
    toc = def.toc || 1; var ui = taoUI(); tam = false; t = 0; last = 0;
    chay = def.tao(ui); t = t0 || 0; mo = true; K.classList.add("mo");
    K.querySelector(".mp-dong").focus(); requestAnimationFrame(khung);
  }
  function dong() {
    if (!mo) return; mo = false; K.classList.remove("mo"); chay = null;
    if (nutVe && nutVe.focus) try { nutVe.focus() } catch (e) {}
  }
  return { dangKy: dangKy, co: co, mo: moMP, dong: dong, dangMo: function () { return mo } };
})();

/* Hàm vẽ dùng chung */
window.MPve = {
  hop: function (ctx, x, y, dong, o) {      // khung chữ nhiều dòng, góc trên trái tại (x, y)
    o = o || {}; ctx.save(); ctx.font = (o.co || 15) + "px 'Segoe UI',Roboto,Arial,sans-serif";
    var lh = (o.co || 15) * 1.45, w = 0; dong.forEach(function (d) { w = Math.max(w, ctx.measureText(d.replace(/\*/g, "")).width) });
    var h = lh * dong.length + 14; if (o.phai) x -= w + 20;
    ctx.fillStyle = o.nen || "rgba(15,23,42,.82)"; ctx.strokeStyle = "rgba(148,163,184,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w + 20, h, 8); else ctx.rect(x, y, w + 20, h); ctx.fill(); ctx.stroke();
    ctx.textBaseline = "middle";
    dong.forEach(function (d, i) {   // *chữ* : tô màu nhấn
      var cx = x + 10, cy = y + 7 + lh * (i + .5), ph = d.split("*");
      ph.forEach(function (p, j) { ctx.fillStyle = j % 2 ? (o.nhan || "#fde047") : (o.chu || "#e2e8f0"); ctx.fillText(p, cx, cy); cx += ctx.measureText(p).width });
    });
    ctx.restore(); return h;
  },
  muiTen: function (ctx, x1, y1, x2, y2, mau, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1), m = Math.min(14, L * .5) + (w || 3);
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = mau; ctx.lineWidth = w || 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * m * .6, y2 - Math.sin(a) * m * .6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - m * Math.cos(a - .45), y2 - m * Math.sin(a - .45)); ctx.lineTo(x2 - m * Math.cos(a + .45), y2 - m * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  kichThuoc: function (ctx, x1, x2, y, nhan, mau, nenSang) {   // mũi tên hai đầu nằm ngang có nhãn
    ctx.save(); ctx.strokeStyle = ctx.fillStyle = mau; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.moveTo(x1, y - 7); ctx.lineTo(x1, y + 7); ctx.moveTo(x2, y - 7); ctx.lineTo(x2, y + 7); ctx.stroke();
    [[x1, 1], [x2, -1]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], y); ctx.lineTo(p[0] + 9 * p[1], y - 5); ctx.lineTo(p[0] + 9 * p[1], y + 5); ctx.closePath(); ctx.fill() });
    ctx.font = "bold 15px 'Segoe UI',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    if (!nenSang) { ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.strokeText(nhan, (x1 + x2) / 2, y - 6) } ctx.fillText(nhan, (x1 + x2) / 2, y - 6);
    ctx.restore();
  },
  so: function (x, n) { return (+x).toFixed(n == null ? 1 : n).replace(".", ",") }
};
