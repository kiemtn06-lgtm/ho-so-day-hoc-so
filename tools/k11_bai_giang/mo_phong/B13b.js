/* Mô phỏng Bài 13b (bản NotebookLM 24/11/2026, 19 slide). Sóng dừng: slide 3 (bản chất: sóng tới + sóng phản xạ), slide 7, 9 (hai đầu cố định), slide 8, 13 (một đầu cố định, một đầu tự do). */
(function () {
  var TAU = Math.PI * 2, V = window.MPve, so = V.so;

  /* tuDo = false: hai đầu cố định, L = kλ/2.  tuDo = true: đầu trái cố định, đầu phải tự do, L = (2n+1)λ/4. */
  function mau(tuDo, L0, v0, q0, ten, goiY) {
    return {
      ten: ten, goiY: goiY, toc: 0.5,
      tao: function (ui) {
        var L = L0, v = v0, q = q0, tpx = false, nb = true;   // q: số bó sóng k (hai đầu cố định) hoặc n (một đầu tự do)
        ui.truot(tuDo ? "n (L = (2n+1)λ/4)" : "k (số bó sóng)", tuDo ? 0 : 1, 8, 1, q, "", function (x) { q = x });
        ui.truot("Chiều dài L", 0.2, 1.2, 0.05, L, "m", function (x) { L = x });
        ui.truot("Tốc độ truyền sóng v", 5, tuDo ? 400 : 40, tuDo ? 5 : 1, v, "m/s", function (x) { v = x });
        ui.chon("Hiện sóng tới và sóng phản xạ", tpx, function (x) { tpx = x });
        ui.chon("Đánh dấu nút, bụng", nb, function (x) { nb = x });
        return {
          ve: function (ctx, W, H, t) {
            ctx.fillStyle = "#0b1530"; ctx.fillRect(0, 0, W, H);
            var lam = tuDo ? 4 * L / (2 * q + 1) : 2 * L / q, f = v / lam, kk = TAU / lam;
            var x0 = 70, x1 = W - 70, s = (x1 - x0) / L, y0 = H * .5, A = Math.min(H * .15, 90), w = TAU * .5;   // phát chậm: 0,5 Hz trên màn hình
            var X = function (x) { return x0 + x * s };
            var nut = tuDo ? q + 1 : q + 1, bung = tuDo ? q + 1 : q;
            // đường bao
            ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(148,163,184,.6)"; ctx.lineWidth = 1.5;
            [1, -1].forEach(function (sg) { ctx.beginPath(); for (var x = 0; x <= L + 1e-9; x += L / 300) { var y = y0 - sg * 2 * A * Math.abs(Math.sin(kk * x)); if (x === 0) ctx.moveTo(X(x), y); else ctx.lineTo(X(x), y) } ctx.stroke() });
            ctx.restore();
            if (tpx) {   // sóng tới (chạy sang trái, vàng) và sóng phản xạ (chạy sang phải, xanh lục), mỗi sóng biên độ A
              [["#fde047", 1], ["#34d399", -1]].forEach(function (o) {
                ctx.save(); ctx.strokeStyle = o[0]; ctx.globalAlpha = .75; ctx.lineWidth = 2; ctx.beginPath();
                for (var x = 0; x <= L + 1e-9; x += L / 300) { var y = y0 - A * (o[1] > 0 ? Math.sin(kk * x + w * t) : Math.sin(kk * x - w * t)); if (x === 0) ctx.moveTo(X(x), y); else ctx.lineTo(X(x), y) }
                ctx.stroke(); ctx.restore();
              });
            }
            // sóng dừng: u = 2A·sin(kx)·cos(ωt)
            ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 4; ctx.beginPath();
            for (var x2 = 0; x2 <= L + 1e-9; x2 += L / 300) { var y2 = y0 - 2 * A * Math.sin(kk * x2) * Math.cos(w * t); if (x2 === 0) ctx.moveTo(X(x2), y2); else ctx.lineTo(X(x2), y2) }
            ctx.stroke();
            // đầu cố định (tường) và đầu còn lại
            ctx.fillStyle = "#94a3b8"; ctx.fillRect(x0 - 12, y0 - 2.4 * A, 12, 4.8 * A);
            if (!tuDo) ctx.fillRect(x1, y0 - 2.4 * A, 12, 4.8 * A);
            else { var yd = y0 - 2 * A * Math.sin(kk * L) * Math.cos(w * t); ctx.beginPath(); ctx.arc(x1, yd, 9, 0, TAU); ctx.fillStyle = "#fbbf24"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke() }
            if (nb) {
              ctx.font = "bold 14px 'Segoe UI',sans-serif"; ctx.textAlign = "center";
              for (var m = 0; m <= 2 * q + 2; m++) {      // vị trí x = m·λ/4: m chẵn là nút, m lẻ là bụng
                var xm = m * lam / 4; if (xm > L + 1e-6) break;
                if (m % 2 === 0) { ctx.beginPath(); ctx.arc(X(xm), y0, 6, 0, TAU); ctx.fillStyle = "#f87171"; ctx.fill(); ctx.fillStyle = "#fecaca"; ctx.fillText("N", X(xm), y0 + 24) }
                else { ctx.fillStyle = "#a7f3d0"; ctx.fillText("B", X(xm), y0 - 2 * A - 12) }
              }
              ctx.textAlign = "start";
            }
            V.kichThuoc(ctx, x0, x1, H - 22, "L = " + so(L, 2) + " m", "#fde047");
            var dong = tuDo ? ["Một đầu cố định, một đầu tự do: *L = (2n + 1)·λ/4*, n = " + q, "Số bụng = số nút = *n + 1 = " + (q + 1) + "*"]
              : ["Hai đầu cố định: *L = k·λ/2*, k = " + q + " (số bó sóng = số bụng)", "Số bụng = *k = " + bung + "*, số nút = *k + 1 = " + nut + "*"];
            V.hop(ctx, 12, 12, dong.concat(["Bước sóng *λ = " + so(lam, 3) + " m* · tần số *f = v/λ = " + so(f, 1) + " Hz*",
              "Khoảng cách hai nút (hai bụng) liền kề *λ/2 = " + so(lam / 2, 3) + " m*"]));
            ctx.fillStyle = "#9fb0cc"; ctx.font = "12px 'Segoe UI',sans-serif"; ctx.textAlign = "right"; ctx.fillText("Chuyển động được phát chậm để dễ quan sát", W - 12, H - 6); ctx.textAlign = "start";
          }
        };
      }
    };
  }
  var cd = mau(false, 0.6, 12, 3, "Sóng dừng trên dây hai đầu cố định",
    "Đổi số bó sóng k, chiều dài L, tốc độ v: λ = 2L/k, f = v/λ. Mặc định là ví dụ L = 0,6 m; v = 12 m/s; 3 bụng → f = 30 Hz.");
  var td = mau(true, 0.5, 340, 1, "Sóng dừng: một đầu cố định, một đầu tự do (cột khí, ống sáo)",
    "Đầu tự do luôn là bụng, đầu cố định luôn là nút. Tăng n để thấy nhiều nút, bụng hơn; λ = 4L/(2n+1).");
  MP.dangKy("B13b", 5, mau(false, 0.6, 12, 3, "Thí nghiệm sóng dừng: sóng tới + sóng phản xạ",
    "Bật hiện sóng tới (vàng) và sóng phản xạ (xanh lục): tổng của chúng là sóng dừng (xanh dương). Nút luôn đứng yên."));
  MP.dangKy("B13b", 6, cd);    // nút và bụng sóng
  MP.dangKy("B13b", 7, cd);    // thực hành nhận diện số nút, số bụng
  MP.dangKy("B13b", 8, cd);    // L = nλ/2
  MP.dangKy("B13b", 9, cd);    // khoảng cách λ/2, λ/4
  MP.dangKy("B13b", 10, td);   // một đầu cố định, một đầu tự do
  MP.dangKy("B13b", 11, cd);   // nhạc cụ dây
  MP.dangKy("B13b", 12, td);   // nhạc cụ khí
  MP.dangKy("B13b", 14, cd);   // luyện tập câu 2
  MP.dangKy("B13b", 15, td);   // luyện tập câu 3
  MP.dangKy("B13b", 16, td);   // đàn K'lông pút
})();
