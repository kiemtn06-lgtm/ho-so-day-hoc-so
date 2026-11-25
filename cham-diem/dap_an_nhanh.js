/* NHẬP NHANH ĐÁP ÁN khi soạn bài (trang giáo viên → Sửa bài / Tạo bài mới):
   1) "Đọc từ PDF đề": lấy chữ trong tệp PDF đề có bảng đáp án (PDF xuất từ Word, không phải bản scan), tìm đáp án từng mã đề.
      Hiểu được: bảng theo hàng (Câu 1 2 3… / Đáp án A B C…), viết liền (1.A 2B Câu 3: C), Đ/S theo ý (a) Đ  b) S hoặc 1a Đ),
      chuỗi ĐSĐS, trả lời ngắn (Câu 1: 2,5), bảng nhiều mã đề theo cột (Câu | 101 | 102 …), tách phần theo "PHẦN I/II/III".
   2) "Tô trên phiếu mẫu" / "Chọn ảnh hoặc PDF phiếu đã tô": dùng đúng các mẫu phiếu của trang (A4 9·2·3, 36·8·6, 40·10·10,
      phiếu giấy lớp 10 & 11), đọc chỗ tô làm đáp án của mã đề.
   Kết quả chỉ ĐIỀN vào ô đáp án; giáo viên xem lại rồi bấm "Lưu bài" (kiểm tra đủ số câu như khi gõ tay). */
(function () {
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var pdfLib = null;
  function loadPdfJs() {
    if (pdfLib) return pdfLib;
    pdfLib = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(window.pdfjsLib); };
      s.onerror = function () { pdfLib = null; no(new Error('Không tải được bộ đọc PDF (kiểm tra mạng).')); };
      document.head.appendChild(s);
    });
    return pdfLib;
  }
  function isPdf(f) { return f && (/pdf/i.test(f.type || '') || /\.pdf$/i.test(f.name || '')); }
  async function openPdf(file) { var L = await loadPdfJs(); return L.getDocument({ data: await file.arrayBuffer() }).promise; }

  /* ---- chữ của PDF → các dòng (gom theo toạ độ y, xếp theo x) ---- */
  async function pdfLines(file) {
    var doc = await openPdf(file), out = [];
    for (var p = 1; p <= doc.numPages; p++) {
      var tc = await (await doc.getPage(p)).getTextContent(), rows = [];
      tc.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        var x = it.transform[4], y = it.transform[5], hgt = Math.abs(it.transform[3]) || 8;
        var r = rows.find(function (r) { return Math.abs(r.y - y) < hgt * 0.45; });
        if (!r) { r = { y: y, it: [] }; rows.push(r); }
        r.it.push({ x: x, w: it.width || 0, s: it.str });
      });
      rows.sort(function (a, b) { return b.y - a.y; });
      rows.forEach(function (r) {
        r.it.sort(function (a, b) { return a.x - b.x; });
        var s = '', end = -1e9;
        r.it.forEach(function (t) { s += (s && t.x - end > 1.5 ? ' ' : '') + t.s; end = t.x + t.w; });
        out.push(s.replace(/\s+/g, ' ').trim());
      });
    }
    return out;
  }

  /* ---- phân tích bảng đáp án (thuần chữ, chạy được cả trong node để kiểm tra) ---- */
  var LET = 'A-Za-zÀ-ỹĐđ';
  function vType(t) {
    if (/^[A-D]$/.test(t)) return 'mc';
    if (/^(Đ|D|S|Đúng|Sai|ĐÚNG|SAI)$/.test(t)) return 'tf1';
    if (/^[ĐDS]{4}$/.test(t)) return 'tf4';
    if (/^-?\d+(?:[.,]\d+)?$/.test(t)) return 'sa';
    return '';
  }
  var tfV = function (t) { return /^S/i.test(t) ? 'S' : 'Đ'; };
  function partOf(line) {
    var m = line.match(/^\s*PH[ẦA]N\s*(III|II|I|3|2|1)\b/i);
    if (!m) return null;
    return { I: 'mc', 1: 'mc', II: 'tf', 2: 'tf', III: 'sa', 3: 'sa' }[m[1].toUpperCase()];
  }
  function newKey() { return { mc: {}, tf: {}, sa: {} }; }
  function putTF(K, q, i, v) { (K.tf[q] = K.tf[q] || ['', '', '', ''])[i] = v; }

  /* bảng nhiều mã đề theo cột: "Câu 101 102 103 104" rồi các hàng "1 A B C D" / "1a Đ S Đ Đ" / "1 ĐSĐS …" / "1 2,5 3 …" */
  function parseColumnTable(lines) {
    var res = null, codes = null, part = null, last = { tf: 0 };
    lines.forEach(function (ln) {
      var p = partOf(ln); if (p) { part = p; }
      var cs = ln.match(/\b\d{3,4}\b/g);
      if (/(câu|mã)/i.test(ln) && cs && cs.length >= 2 && new Set(cs).size === cs.length && !ln.split(/\s+/).some(function (t) { return /^[A-D]$/.test(t); })) {
        codes = cs; res = res || {}; codes.forEach(function (c) { res[c] = res[c] || newKey(); }); return;
      }
      if (!codes) return;
      var tk = ln.replace(/^câu\s*/i, '').split(/\s+/);
      var lab = (tk[0] || '').match(/^(\d{1,2})\s*[.):]?\s*([a-d])?\)?$/);
      if (!lab) return;
      var vals = tk.slice(1);
      if (vals.length !== codes.length) return;
      var types = vals.map(vType);
      if (types.some(function (t) { return !t; })) return;
      var q = +lab[1];
      codes.forEach(function (c, j) {
        var v = vals[j], t = types[j], K = res[c];
        if (t === 'mc' && part !== 'tf' && part !== 'sa') K.mc[q] = v;
        else if (t === 'tf4') K.tf[q] = v.split('').map(tfV);
        else if (t === 'tf1' && lab[2]) putTF(K, q, 'abcd'.indexOf(lab[2]), tfV(v));
        else if (t === 'sa' || (t === 'mc' && part === 'sa')) K.sa[q] = v;
      });
    });
    return res;
  }

  /* một mã đề: tìm đáp án trong các dòng */
  function parseSection(lines) {
    var K = newKey(), part = null, curTF = 0;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i], p = partOf(ln);
      if (p) { part = p; ln = ln.replace(/^\s*PH[ẦA]N\s*\S+\s*[.:]?/i, ''); }
      /* hàng số câu + hàng đáp án ngay dưới */
      var labs = ln.replace(/^\s*(câu|câu hỏi|câu số)\s*/i, '').split(/\s+/);
      if (labs.length >= 2 && labs.every(function (t) { return /^\d{1,2}([a-d])?$/.test(t); }) && i + 1 < lines.length) {
        var vals = lines[i + 1].replace(/^\s*(đáp\s*án|đ\/a|đa|chọn|kết\s*quả|trả\s*lời)\s*[:.]?\s*/i, '').split(/\s+/);
        if (vals.length === labs.length && vals.every(vType)) {
          labs.forEach(function (l, j) {
            var m = l.match(/^(\d+)([a-d])?$/), q = +m[1], v = vals[j], t = vType(v);
            if (t === 'mc' && part !== 'sa') K.mc[q] = v;
            else if (t === 'tf4') K.tf[q] = v.split('').map(tfV);
            else if (t === 'tf1') { if (m[2]) putTF(K, q, 'abcd'.indexOf(m[2]), tfV(v)); }
            else if (t === 'sa' || (t === 'mc' && part === 'sa')) K.sa[q] = v;
          });
          i++; continue;
        }
      }
      var m, re;
      if (part !== 'tf' && part !== 'sa') {
        re = new RegExp('(?:Câu\\s*)?(\\d{1,2})\\s*[.:)\\-–]?\\s*([A-D])(?![' + LET + '])', 'g');
        while ((m = re.exec(ln))) K.mc[+m[1]] = m[2];
      }
      if (part !== 'mc' && part !== 'sa') {
        re = /(?:Câu\s*)?(\d{1,2})\s*[.:)\-–]?\s*([ĐDS]{4})(?![A-Za-zÀ-ỹ])/g;
        while ((m = re.exec(ln))) K.tf[+m[1]] = m[2].split('').map(tfV);
        var mq = ln.match(/^\s*Câu\s*(\d{1,2})/i); if (mq) curTF = +mq[1];
        re = /(?:(\d{1,2})\s*)?([a-d])\s*[).:\-–]?\s*(Đúng|Sai|ĐÚNG|SAI|Đ|S)(?![A-Za-zÀ-ỹ])/g;
        while ((m = re.exec(ln))) { if (m[1]) curTF = +m[1]; if (curTF) putTF(K, curTF, 'abcd'.indexOf(m[2]), tfV(m[3])); }
      }
      if (part === 'sa') {
        re = /(?:Câu\s*)?(\d{1,2})\s*[.:)\-–]\s*(-?\d+(?:[.,]\d+)?)(?![\d])/g;
        var any = false;
        while ((m = re.exec(ln))) { K.sa[+m[1]] = m[2]; any = true; }
        if (!any) { m = ln.match(/^\s*Câu\s*(\d{1,2})\s+(-?\d+(?:[.,]\d+)?)\s*$/i); if (m) K.sa[+m[1]] = m[2]; }
      }
    }
    return K;
  }

  /* toàn bộ: bỏ phần đề phía trước "ĐÁP ÁN"; tách theo mã đề */
  function parseKeyLines(lines) {
    var st = lines.findIndex(function (l) { return /(ĐÁP ÁN|HƯỚNG DẪN CHẤM|DAP AN)/.test(l); });
    if (st > 0) lines = lines.slice(st);
    var col = parseColumnTable(lines);
    if (col && Object.keys(col).some(function (c) { return count(col[c]); })) return col;
    var out = {}, cur = '', buf = [];
    var flush = function () { if (buf.length) { var K = parseSection(buf); if (count(K)) { if (out[cur]) merge(out[cur], K); else out[cur] = K; } } buf = []; };
    lines.forEach(function (ln) {
      var m = ln.match(/mã\s*(?:đề|de)?\s*(?:thi|số)?\s*[:.]?\s*(\d{3,4})\b/i);
      if (m) { flush(); cur = m[1]; ln = ln.replace(m[0], ' '); }
      buf.push(ln);
    });
    flush();
    return out;
  }
  function merge(A, B) { ['mc', 'tf', 'sa'].forEach(function (p) { Object.assign(A[p], B[p]); }); }
  function count(K) { return Object.keys(K.mc).length + Object.keys(K.tf).length + Object.keys(K.sa).length; }
  function nMax(o) { var k = Object.keys(o).map(Number); return k.length ? Math.max.apply(null, k) : 0; }
  /* bộ đáp án → chữ trong ô (cùng dạng giáo viên gõ tay) */
  function toText(K) {
    var r = {};
    var n = nMax(K.mc); if (n) { var s = ''; for (var q = 1; q <= n; q++) s += K.mc[q] || '?'; r.mc = { text: s, n: n }; }
    n = nMax(K.tf); if (n) { var a = []; for (q = 1; q <= n; q++) a.push((K.tf[q] || ['', '', '', '']).map(function (x) { return x || '?'; }).join('')); r.tf = { text: a.join(' '), n: n }; }
    n = nMax(K.sa); if (n) { a = []; for (q = 1; q <= n; q++) a.push(q + ': ' + (K.sa[q] != null ? String(K.sa[q]).replace('.', ',') : '?')); r.sa = { text: a.join('\n'), n: n }; }
    return r;
  }
  /* đáp án đọc từ phiếu tô (mảng theo câu) → chữ trong ô */
  function fromSheet(p, A) {
    if (p === 'mc') return A.map(function (v) { return /^[A-D]$/.test(v) ? v : '?'; }).join('');
    if (p === 'tf') return A.map(function (r) { return (r || []).map(function (x) { return x === 'D' ? 'Đ' : x === 'S' ? 'S' : '?'; }).join(''); }).join(' ');
    return A.map(function (v, i) { return (i + 1) + ': ' + (v && v !== '?' && v !== '*' ? v : '?'); }).join('\n');
  }

  if (typeof module !== 'undefined' && typeof window === 'undefined') { module.exports = { parseKeyLines: parseKeyLines, toText: toText, fromSheet: fromSheet }; return; }

  /* ---- PDF → ảnh trang (để đọc phiếu đã tô được lưu dạng PDF) ---- */
  async function expandFiles(files) {
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!isPdf(f)) { out.push(f); continue; }
      var doc = await openPdf(f);
      for (var p = 1; p <= doc.numPages; p++) out.push({ pdfDoc: doc, page: p, name: f.name + ' — trang ' + p });
    }
    return out;
  }
  async function pdfPageImage(item) {
    var pg = await item.pdfDoc.getPage(item.page), v0 = pg.getViewport({ scale: 1 });
    var k = Math.min(4, 1800 / Math.max(v0.width, v0.height)), v = pg.getViewport({ scale: k });
    var c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height);
    var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: x, viewport: v }).promise;
    var id = x.getImageData(0, 0, c.width, c.height); c.width = c.height = 0; return id;
  }

  /* ---- khung "Nhập nhanh đáp án" trong trang soạn bài ----
     ctx: { ex (bài đang soạn), cur() mã đề đang chọn, render() vẽ lại, setCur(c) } */
  function panel(ctx) {
    var ex = ctx.ex;
    var en = function () { return PARTS.filter(function (p) { return ex.parts[p].enabled && ex.parts[p].n > 0; }); };
    var fits = function (cap) { return en().every(function (p) { return ex.parts[p].n <= cap[p]; }); };
    var opts = [];
    Object.keys(FULL_SHEETS).filter(function (t) { return !FULL_SHEETS[t].hidden && fits(FULL_SHEETS[t].cap); }).forEach(function (t) { opts.push([t, FULL_SHEETS[t].name]); });
    if (fits({ mc: 40, tf: 8, sa: 8 })) opts.push(['sch', 'Phiếu giấy lớp 10 & 11 (trang 1 + trang 2)']);
    var want = (function () { try { return localStorage.getItem('cp_key_sheet'); } catch (e) { return ''; } })();
    var sel = h('select', { style: 'width:auto;max-width:100%' }, opts.map(function (o) { return h('option', { value: o[0], selected: o[0] === want }, o[1]); }));
    var pdfIn = h('input', { type: 'file', accept: 'application/pdf,.pdf', hidden: true, onchange: function (e) { var f = e.target.files[0]; e.target.value = ''; if (f) fromPdf(f); } });
    var imgIn = h('input', { type: 'file', accept: 'image/*,application/pdf,.pdf', multiple: true, hidden: true, onchange: function (e) { var fs = Array.from(e.target.files); e.target.value = ''; if (fs.length) fromImages(fs); } });

    function needParts() { if (!en().length) { toast('Bật ít nhất một phần và ghi số câu trước.', 5000); return false; } if (!opts.length) { toast('Không có mẫu phiếu nào đủ chỗ cho số câu này.', 5000); return false; } return true; }
    function setKey(code, p, text) {
      var c = ex.codes[code] = ex.codes[code] || {};
      c[p] = Object.assign({ keyText: '', solText: '' }, c[p], { keyText: text });
    }
    function keyOpts(queue) {
      return {
        key: true, exam: ex, defCode: ctx.cur(), queueLeft: queue ? queue.length : 0,
        onKey: function (code, res) {
          Object.keys(res).forEach(function (p) { setKey(code, p, fromSheet(p, res[p])); });
          ctx.setCur(code); try { localStorage.setItem('cp_key_sheet', sel.value); } catch (e) { }
          toast('Đã điền đáp án mã đề ' + code + ' (' + Object.keys(res).map(function (p) { return PART_SHORT[p]; }).join(', ') + '). Kiểm tra rồi bấm “Lưu bài”.', 5000);
        },
        onDone: function () { ctx.render(); if (queue && queue.length) setTimeout(queue.shift(), 60); }
      };
    }
    function tplPages() {
      var v = sel.value;
      if (v !== 'sch') return [v];
      var ps = en(), a = [];
      if (ps.some(function (p) { return p !== 'sa'; })) a.push('sch1');
      if (ps.indexOf('sa') >= 0) a.push('sch2');
      return a;
    }
    function fromTemplate() {
      if (!needParts()) return;
      var pages = tplPages(), q = [];
      pages.slice(1).forEach(function (t) { q.push(function () { useTemplate(t, keyOpts(q)); }); });
      useTemplate(pages[0], keyOpts(q));
    }
    async function fromImages(files) {
      if (!needParts()) return;
      var items;
      try { toast('Đang mở tệp…', 20000); items = await expandFiles(files); toast('Đã mở ' + items.length + ' trang/ảnh.', 1500); }
      catch (e) { toast(e.message || 'Không mở được tệp.', 6000); return; }
      var v = sel.value, part = v === 'sch' ? 'sch' : 'full', q = [];
      items.forEach(function (it, i) { if (i) q.push(function () { pick(part, it, Object.assign(keyOpts(q), { sheet: v })); }); });
      pick(part, items[0], Object.assign(keyOpts(q), { sheet: v }));
    }
    async function fromPdf(file) {
      openModal(h('div', { style: 'padding:40px;text-align:center' }, h('span', { class: 'spin' }), h('p', {}, 'Đang đọc bảng đáp án trong PDF…')));
      var lines, res;
      try { lines = await pdfLines(file); res = parseKeyLines(lines); }
      catch (e) { $('#modalBody').replaceChildren(h('div', { class: 'note bad' }, e.message || 'Không đọc được tệp PDF.'), h('button', { onclick: closeModal }, 'Đóng')); return; }
      var codes = Object.keys(res);
      if (!codes.length) {
        $('#modalBody').replaceChildren(h('h2', {}, 'Không thấy bảng đáp án'),
          h('div', { class: 'note warn' }, lines.join('').trim().length < 20
            ? 'Tệp PDF này là ảnh scan (không có chữ), máy không đọc được. Hãy dùng “Tô trên phiếu mẫu” hoặc gõ đáp án.'
            : 'Không nhận ra bảng đáp án trong tệp. Bảng nên có dạng “Câu 1 2 3 … / Đáp án A B C …”, “1.A 2.B …”, “Câu 1: a) Đ b) S …”, “Câu 1: 2,5”, có tiêu đề PHẦN I/II/III và “Mã đề 101” nếu nhiều mã.'),
          h('button', { onclick: closeModal }, 'Đóng'));
        return;
      }
      var cur = ctx.cur();
      var rows = codes.map(function (c) {
        var T = toText(res[c]), code = c || cur;
        return { c: c, code: code, T: T, miss: Object.keys(T).filter(function (p) { return /\?/.test(T[p].text); }) };
      });
      var codeIn = codes.length === 1 && !codes[0] ? h('input', { type: 'text', inputmode: 'numeric', maxlength: 4, value: cur || '', placeholder: '101', style: 'width:90px' }) : null;
      var setN = h('input', { type: 'checkbox', checked: true });
      $('#modalBody').replaceChildren(
        h('h2', {}, 'Đáp án đọc được từ PDF'),
        codeIn ? h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Tệp không ghi mã đề — điền vào mã đề'), codeIn) : null,
        rows.map(function (r) {
          return h('div', { class: 'card', style: 'margin:8px 0' }, h('b', {}, r.c ? 'Mã đề ' + r.c : 'Đáp án'),
            PARTS.filter(function (p) { return r.T[p]; }).map(function (p) {
              return h('div', { class: 'small', style: 'margin-top:4px;white-space:pre-wrap' }, h('b', {}, PART_SHORT[p] + ' (' + r.T[p].n + ' câu): '), p === 'sa' ? r.T[p].text.replace(/\n/g, ' · ') : r.T[p].text);
            }),
            r.miss.length ? h('div', { class: 'note warn' }, 'Dấu ? là câu chưa đọc được — sửa tay trong ô đáp án.') : null);
        }),
        h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:500' }, setN, 'Bật các phần có đáp án và đặt số câu theo PDF'),
        h('div', { class: 'row', style: 'margin-top:10px' },
          h('button', {
            onclick: function () {
              if (codeIn) { var v = codeIn.value.trim(); if (!/^\d{3,4}$/.test(v)) { toast('Nhập mã đề 3–4 chữ số.'); return; } rows[0].code = v; }
              if (rows.some(function (r) { return !/^\d{3,4}$/.test(r.code); })) { toast('Thêm mã đề trước.'); return; }
              rows.forEach(function (r) { Object.keys(r.T).forEach(function (p) { setKey(r.code, p, r.T[p].text); }); });
              if (setN.checked) PARTS.forEach(function (p) {
                var n = Math.max.apply(null, rows.map(function (r) { return r.T[p] ? r.T[p].n : 0; }));
                if (n) { ex.parts[p].enabled = true; ex.parts[p].n = n; }
              });
              ctx.setCur(rows[0].code); closeModal(); ctx.render();
              toast('Đã điền đáp án ' + rows.length + ' mã đề. Kiểm tra rồi bấm “Lưu bài”.', 5000);
            }
          }, 'Điền vào bài'),
          h('button', { class: 'ghost', onclick: closeModal }, 'Huỷ')));
    }

    return h('div', { class: 'card', style: 'margin:8px 0;border-left:5px solid var(--acc)' },
      h('b', {}, 'Nhập nhanh đáp án'),
      h('div', { class: 'small', style: 'margin:4px 0 8px' }, 'Đọc bảng đáp án từ tệp PDF đề (PDF xuất từ Word), hoặc tô đáp án lên phiếu mẫu / chọn ảnh, PDF phiếu đã tô. Mã đề lấy theo tệp hoặc ô mã đề trên phiếu.'),
      h('div', { class: 'row' },
        h('button', { class: 'sm', onclick: function () { pdfIn.click(); } }, 'Đọc từ PDF đề'), pdfIn),
      h('label', {}, 'Mẫu phiếu'), sel,
      h('div', { class: 'row', style: 'margin-top:8px' },
        h('button', { class: 'sm', onclick: fromTemplate }, 'Tô trên phiếu mẫu'),
        h('button', { class: 'ghost sm', onclick: function () { if (needParts()) imgIn.click(); } }, 'Chọn ảnh / PDF phiếu đã tô'), imgIn));
  }

  window.DAN = { panel: panel, isPdf: isPdf, pdfPageImage: pdfPageImage, expandFiles: expandFiles, parseKeyLines: parseKeyLines };
})();
