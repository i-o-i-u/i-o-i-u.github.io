/* ============================================================
   أداة تنسيق الشِّعر
   تعتمد على محرّك المدّ الموجود في site.js: stretchCell / getCtx
   ============================================================ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const pagesEl = $('tp-pages');
  if (!pagesEl) return;

  const input    = $('tp-input');
  const selMode  = $('tp-mode');
  const selSep   = $('tp-sep');
  const sepCust  = $('tp-sep-custom');
  const sepField = $('tp-sep-field');
  const inTitle  = $('tp-title');
  const inPoet   = $('tp-poet');
  const selAttr  = $('tp-attr');
  const selTheme = $('tp-theme');
  const selPat   = $('tp-pattern');
  const selWidth = $('tp-width');
  const selFam   = $('tp-family');
  const rngFont  = $('tp-font');
  const fontVal  = $('tp-font-val');
  const inputLbl = $('tp-input-label');
  const ckNums   = $('tp-numbers');
  const ckFrame  = $('tp-frame');
  const stage    = document.querySelector('.tp-stage-scroll');
  const holder   = $('tp-holder');
  const countEl  = $('tp-count');
  const toastEl  = $('tp-toast');
  const pngLabel = $('tp-png-label');

  const STORE_KEY = 'tp-state-v2';

  // مقاسات الورقة: ترتفع بقَدْر ما فيها، ولا تتجاوز صفحةَ A4
  const SHEET_W = 794;
  const MIN_H   = 260;
  const MAX_H   = 1123;

  // الخطوط المتاحة
  const FONTS = {
    kitab:        "'Kitab', serif",
    amiri:        "'Amiri', 'Kitab', serif",
    scheherazade: "'Scheherazade New', 'Kitab', serif",
    naskh:        "'Noto Naskh Arabic', 'Kitab', serif",
    kufi:         "'Reem Kufi', 'Kitab', sans-serif"
  };

  function fontStack() { return FONTS[selFam.value] || FONTS.kitab; }
  function fontSpec()  {
    const first = fontStack().split(',')[0].trim();
    return rngFont.value + 'px ' + first;
  }

  /* ---------------- أدوات عامّة ---------------- */

  function toArabicNum(n) {
    return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  // مطابقة صيغة الجمع العربية
  function arCount(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return toArabicNum(n) + ' ' + few;
    return toArabicNum(n) + ' ' + many;
  }

  function stripTatweel(s) { return s.replace(/ـ/g, ''); }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('tp-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('tp-show'), 2600);
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function safeName(base) {
    const t = (inTitle.value || base).trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
    return t || base;
  }

  function outerHeight(el) {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height
      + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  }

  /* ---------------- الزخارف ---------------- */

  // تُبنى الزخرفةُ صورةً متجهيّة مضمَّنة، فتصلح للصفحة وللرسم على canvas معًا
  function patternSVG(kind, color) {
    const g = (size, body) =>
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
      + 'viewBox="0 0 ' + size + ' ' + size + '">'
      + '<g fill="none" stroke="' + color + '" stroke-opacity="0.32" stroke-width="1">'
      + body + '</g></svg>';

    switch (kind) {
      case 'stars':
        return g(64,
          '<path d="M32 6 L39 25 L58 32 L39 39 L32 58 L25 39 L6 32 L25 25 Z"/>'
          + '<rect x="18" y="18" width="28" height="28"/>'
          + '<path d="M0 0 L6 6 M64 0 L58 6 M0 64 L6 58 M64 64 L58 58"/>');
      case 'rhombi':
        return g(44, '<path d="M22 3 L41 22 L22 41 L3 22 Z"/><path d="M22 14 L30 22 L22 30 L14 22 Z"/>');
      case 'circles':
        return g(48,
          '<circle cx="24" cy="24" r="15"/><circle cx="0" cy="24" r="15"/>'
          + '<circle cx="48" cy="24" r="15"/><circle cx="24" cy="0" r="15"/>'
          + '<circle cx="24" cy="48" r="15"/>');
      case 'grid':
        return g(26, '<path d="M0 13 H26 M13 0 V26"/>');
      default:
        return null;
    }
  }

  function patternURI(kind, color) {
    const svg = patternSVG(kind, color);
    return svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : '';
  }

  /* ---------------- الفاصل البصريّ ---------------- */

  const SEP_GLYPHS = { star: '*', rub: '۞', dots: '؞' };

  function separator() {
    const v = selSep.value;
    if (v === 'line') return { kind: 'line', glyph: '' };
    if (v === 'none') return { kind: 'none', glyph: '' };
    if (v === 'custom') return { kind: 'glyph', glyph: (sepCust.value || '*').trim() };
    return { kind: 'glyph', glyph: SEP_GLYPHS[v] || '*' };
  }

  /* ---------------- التحليل ---------------- */

  // كلُّ شَطْرٍ في سطر، والسطرُ الخالي يفصل بين بيتٍ وبيت.
  // في القصيد يُقرَن كلُّ سطرين في بيت، والسطرُ الفَرْدُ يُعرَض ممتدًّا.
  function parse() {
    const rajaz = selMode.value === 'rajaz';
    const out = [];

    input.value.split(/\r?\n\s*\r?\n/).forEach(block => {
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;

      if (rajaz) {
        lines.forEach(l => out.push({ type: 'verse', parts: [l] }));
        return;
      }
      for (let i = 0; i < lines.length; i += 2) {
        if (i + 1 < lines.length) out.push({ type: 'verse', parts: [lines[i], lines[i + 1]] });
        else out.push({ type: 'full', text: lines[i] });
      }
    });

    return out;
  }

  /* ---------------- بناء العناصر ---------------- */

  function createPage() {
    const page = document.createElement('div');
    page.className = 'tp-sheet' + (ckFrame.checked ? ' tp-framed' : '');
    page.dataset.theme = selTheme.value;

    const fs = parseInt(rngFont.value, 10);
    const amudi = selMode.value === 'amudi';
    page.style.setProperty('--tp-font', fontStack());
    page.style.setProperty('--tp-fs', fs + 'px');
    page.style.setProperty('--tp-numw', ckNums.checked ? (fs * 1.9).toFixed(1) + 'px' : '0px');
    page.style.setProperty('--tp-midw', amudi ? (fs * 2.4).toFixed(1) + 'px' : '0px');

    const inner = document.createElement('div');
    inner.className = 'tp-sheet-inner';
    const col = document.createElement('div');
    col.className = 'tp-col';
    inner.appendChild(col);

    page.appendChild(inner);
    page._inner = inner;
    page._col = col;
    return page;
  }

  // خلفيّةُ الورقة: تدرُّجٌ لَوْنيٌّ (إن كان للسِّمة لونان) تعلوه الزخرفة
  function applyBackground(page) {
    const cs = getComputedStyle(page);
    const bg  = cs.getPropertyValue('--tp-bg').trim();
    const bg2 = cs.getPropertyValue('--tp-bg2').trim();
    const line = cs.getPropertyValue('--tp-line').trim() || '#999';
    const kind = selPat.value;

    const layers = [], repeats = [], sizes = [];
    if (kind !== 'none') {
      layers.push('url("' + patternURI(kind, line) + '")');
      repeats.push('repeat');
      sizes.push('auto');
    }
    if (bg2 && bg2 !== bg) {
      layers.push('linear-gradient(135deg, ' + bg + ', ' + bg2 + ')');
      repeats.push('no-repeat');
      sizes.push('100% 100%');
    }
    page.style.backgroundImage  = layers.join(', ');
    page.style.backgroundRepeat = repeats.join(', ');
    page.style.backgroundSize   = sizes.join(', ');
  }

  function buildHead() {
    const title = inTitle.value.trim();
    const poet  = inPoet.value.trim();
    const inHead = selAttr.value === 'head' && poet;
    if (!title && !inHead) return null;

    const head = document.createElement('div');
    head.className = 'tp-head';
    if (title) {
      const h = document.createElement('div');
      h.className = 'tp-doc-title';
      h.textContent = title;
      head.appendChild(h);
    }
    if (inHead) {
      const p = document.createElement('div');
      p.className = 'tp-doc-poet';
      p.textContent = poet;
      head.appendChild(p);
    }
    head.appendChild(document.createElement('hr')).className = 'tp-doc-rule';
    return head;
  }

  function buildAttrib() {
    const poet = inPoet.value.trim();
    const pos  = selAttr.value;
    if (!poet || pos === 'head') return null;
    const d = document.createElement('div');
    d.className = 'tp-attrib';
    d.dataset.pos = pos;
    const s = document.createElement('span');
    s.textContent = poet;
    d.appendChild(s);
    return d;
  }

  function buildPageNum(i, total) {
    const d = document.createElement('div');
    d.className = 'tp-pagenum';
    d.textContent = toArabicNum(i) + ' / ' + toArabicNum(total);
    return d;
  }

  // يبني صفوفَ الجدول مرّةً واحدة، ثم تُوزَّع على الصفحات
  function buildRows(items) {
    const amudi = selMode.value === 'amudi';
    const sep   = separator();
    const cols  = (ckNums.checked ? 1 : 0) + (amudi ? 3 : 1);
    const rows  = [];
    let n = 0;

    items.forEach(item => {
      const tr = document.createElement('tr');

      if (item.type === 'full') {
        const td = document.createElement('td');
        td.className = 'tp-full';
        td.colSpan = cols;
        td.textContent = item.text;
        tr.appendChild(td);
        rows.push(tr);
        return;
      }

      n++;
      if (ckNums.checked) {
        const td = document.createElement('td');
        td.className = 'tp-num';
        // بلا <bdo>: فهو يعكس ترتيبَ المحارف فتصير ١٦ سِتًّا وستّين،
        // والنصُّ العاديُّ في سياقٍ عربيٍّ يضع الشَّرطةَ يسارَ الرقم من نفسه
        td.textContent = toArabicNum(n) + '-';
        tr.appendChild(td);
      }

      const first = document.createElement('td');
      first.className = 'tp-shatr tp-first';
      first.dataset.original = item.parts[0];
      first.textContent = item.parts[0];
      tr.appendChild(first);

      if (amudi) {
        const mid = document.createElement('td');
        mid.className = 'tp-mid';
        if (sep.kind === 'line') {
          const v = document.createElement('span');
          v.className = 'tp-vline';
          mid.appendChild(v);
        } else if (sep.kind === 'glyph') {
          mid.textContent = sep.glyph;
        }
        tr.appendChild(mid);

        const last = document.createElement('td');
        last.className = 'tp-shatr tp-last';
        last.dataset.original = item.parts[1] || '';
        last.textContent = item.parts[1] || '';
        tr.appendChild(last);
      }

      rows.push(tr);
    });

    return { rows, verses: n };
  }

  function newTable() {
    const t = document.createElement('table');
    t.className = 'tp-table';
    t.dataset.mode = selMode.value;
    t.appendChild(document.createElement('tbody'));
    return t;
  }

  function contentWidth(page) {
    const cs = getComputedStyle(page._inner);
    return page._inner.clientWidth
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }

  function contentHeight(page) {
    const cs = getComputedStyle(page._inner);
    return page._inner.clientHeight
      - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  }

  /* ---------------- ضبط عَرْض النصّ ---------------- */

  // في «التلقائيّ» يُقاس أطولُ شطرٍ على حاله، ثم يُترك له فضلٌ يسيرٌ للمدّ،
  // فلا تُشَدُّ الأشطُرُ القصيرة — كأشطر الرجز — شدًّا قبيحًا على عَرْض الورقة
  const AUTO_SLACK = 0.10;   // أقصى تمدُّدٍ للشطر الأطول
  const AUTO_FLOOR = 0.42;   // ولا ينزل العمودُ عن هذا من عَرْض الورقة

  function columnWidth(page, rows, availW) {
    const v = selWidth.value;
    if (v !== 'auto') return availW * (parseInt(v, 10) / 100);

    const sample = page.querySelector('.tp-shatr');
    if (!sample) return availW;

    const cs = getComputedStyle(sample);
    const ctx = getCtx(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`);

    let maxFirst = 0, maxLast = 0;
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('.tp-shatr');
      if (cells[0]) maxFirst = Math.max(maxFirst, ctx.measureText(cells[0].dataset.original).width);
      if (cells[1]) maxLast  = Math.max(maxLast,  ctx.measureText(cells[1].dataset.original).width);
    });
    if (!maxFirst) return availW;

    const numw = parseFloat(page.style.getPropertyValue('--tp-numw')) || 0;
    const midw = parseFloat(page.style.getPropertyValue('--tp-midw')) || 0;
    const need = numw + midw + (maxFirst + maxLast) * (1 + AUTO_SLACK);

    return Math.min(availW, Math.max(availW * AUTO_FLOOR, need));
  }

  /* ---------------- البناء الكامل مع تقسيم الصفحات ---------------- */

  function buildPages() {
    const items = parse();
    pagesEl.innerHTML = '';

    if (!items.length) {
      const page = createPage();
      page.style.height = MIN_H + 'px';
      applyBackground(page);
      const e = document.createElement('div');
      e.className = 'tp-empty';
      e.textContent = 'اكتُبِ القصيدةَ في الحقل، تظهَرْ هنا منسَّقةً.';
      page._col.appendChild(e);
      pagesEl.appendChild(page);
      countEl.textContent = '';
      pngLabel.textContent = 'صورة PNG';
      return;
    }

    // ١) ارتفاع منطقة المحتوى في صفحةٍ ممتلئة
    const probe = createPage();
    probe.style.height = MAX_H + 'px';
    pagesEl.appendChild(probe);
    const AVAIL  = contentHeight(probe);
    const AVAIL_W = contentWidth(probe);
    probe.remove();

    // ٢) قياس الترويسة والصفوف والعَزْو ورقم الصفحة
    const measure = createPage();
    measure.classList.add('tp-measure');
    pagesEl.appendChild(measure);

    const head = buildHead();
    if (head) measure._col.appendChild(head);

    const { rows, verses } = buildRows(items);
    const mTable = newTable();
    rows.forEach(tr => mTable.tBodies[0].appendChild(tr));
    measure._col.appendChild(mTable);

    const attrib = buildAttrib();
    if (attrib) measure._col.appendChild(attrib);

    const mNum = buildPageNum(1, 2);
    measure._col.appendChild(mNum);

    // عَرْضُ العمود يُحسَب أوّلًا، فقد يتغيَّر به ارتفاعُ السطور الممتدّة
    const COLW = Math.round(columnWidth(measure, rows, AVAIL_W));
    measure.style.setProperty('--tp-colw', COLW + 'px');

    const headH   = head ? outerHeight(head) : 0;
    const rowHs   = rows.map(tr => tr.getBoundingClientRect().height);
    const attribH = attrib ? outerHeight(attrib) : 0;
    const numH    = outerHeight(mNum);
    measure.remove();

    // ٣) التقسيم
    const total = rowHs.reduce((a, b) => a + b, 0);
    let groups;
    if (headH + total + attribH <= AVAIL) {
      groups = [{ from: 0, to: rows.length, attrib: true }];
    } else {
      const A = AVAIL - numH;
      groups = [];
      let from = 0, h = headH;
      for (let i = 0; i < rows.length; i++) {
        if (i > from && h + rowHs[i] > A) {
          groups.push({ from, to: i, attrib: false });
          from = i; h = 0;
        }
        h += rowHs[i];
      }
      groups.push({ from, to: rows.length, attrib: true });
      // إن لم يتّسع العَزْوُ في آخر صفحة أُفرِدت له صفحةٌ تالية
      if (attribH && h + attribH > A) {
        groups[groups.length - 1].attrib = false;
        groups.push({ from: rows.length, to: rows.length, attrib: true });
      }
    }

    // ٤) بناء الصفحات النهائية
    const many = groups.length > 1;
    groups.forEach((g, idx) => {
      const page = createPage();
      page.style.setProperty('--tp-colw', COLW + 'px');
      if (idx === 0 && head) page._col.appendChild(head);

      if (g.to > g.from) {
        const t = newTable();
        for (let i = g.from; i < g.to; i++) t.tBodies[0].appendChild(rows[i]);
        page._col.appendChild(t);
      }
      if (g.attrib && attrib) page._col.appendChild(attrib);
      if (many) page._col.appendChild(buildPageNum(idx + 1, groups.length));

      pagesEl.appendChild(page);
      applyBackground(page);

      if (many) {
        page.style.height = MAX_H + 'px';
      } else {
        page.style.height = 'auto';
        const h = page.getBoundingClientRect().height;
        page.style.height = Math.min(MAX_H, Math.max(MIN_H, Math.ceil(h))) + 'px';
      }
    });

    countEl.textContent =
      (selMode.value === 'rajaz'
        ? arCount(verses, 'شطرٌ واحد', 'شطران', 'أشطُر', 'شطرًا')
        : arCount(verses, 'بيتٌ واحد', 'بيتان', 'أبيات', 'بيتًا'))
      + (many ? ' — ' + arCount(groups.length, 'صفحة', 'صفحتان', 'صفحات', 'صفحة') : '');

    pngLabel.textContent = many
      ? arCount(groups.length, 'صورة PNG', 'صورتان PNG', 'صور PNG', 'صورة PNG')
      : 'صورة PNG';
  }

  /* ---------------- المدّ ---------------- */

  function stretchAllSheets() {
    const sample = pagesEl.querySelector('.tp-shatr');
    if (!sample) return;
    const cs = getComputedStyle(sample);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    pagesEl.querySelectorAll('.tp-shatr').forEach(cell => {
      cell.textContent = cell.dataset.original;
      stretchCell(cell, font);
    });
  }

  /* ---------------- تحجيم المعاينة لتناسب الشاشة ---------------- */

  let lastFitW = 0;
  function fitPages() {
    const avail = stage.clientWidth;
    if (!avail) return;            // اللوحةُ غير مرئيّةٍ بعد
    lastFitW = avail;
    const s = Math.min(1, avail / SHEET_W);
    pagesEl.style.transform = s < 1 ? `scale(${s})` : '';
    // الحاوية تأخذ مقاسَ الورق بعد التحجيم، فيصحُّ التمريرُ داخل اللوحة
    holder.style.width  = Math.floor(SHEET_W * s) + 'px';
    holder.style.height = Math.ceil(pagesEl.getBoundingClientRect().height) + 'px';
  }

  /* ---------------- الدورة الكاملة ---------------- */

  let timer = null;
  const fontTried = new Set();
  function render() {
    const prev = pagesEl.style.transform;
    pagesEl.style.transform = '';   // القياسُ يجب أن يكون بلا تحجيم
    buildPages();
    stretchAllSheets();
    pagesEl.style.transform = prev;
    fitPages();
    saveState();

    // الخطُّ الخارجيُّ قد يصل بعد الرسم، فيُعاد الرسمُ متى وصل.
    // لا يُعوَّل على fonts.check فإنّه قد يُصدِّق قبل وصول الملفّ.
    const spec = fontSpec();
    if (document.fonts && !fontTried.has(spec)) {
      fontTried.add(spec);
      document.fonts.load(spec).then(() => render()).catch(() => {});
    }
  }
  function renderSoon() {
    clearTimeout(timer);
    timer = setTimeout(render, 90);
  }

  /* ============================================================
     التصدير: صور PNG (رسمٌ مباشر على canvas من هندسة المعاينة)
     ============================================================ */

  function fontOf(el) {
    const cs = getComputedStyle(el);
    return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  }

  function drawLines(ctx, text, cx, top, maxW, lineH) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const next = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(next).width > maxW) { lines.push(cur); cur = w; }
      else cur = next;
    });
    if (cur) lines.push(cur);
    lines.forEach((ln, i) => ctx.fillText(ln, cx, top + lineH * (i + 0.5)));
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function renderPage(page, scale) {
    const cs = getComputedStyle(page);
    const box = page.getBoundingClientRect();
    const W = Math.round(box.width);
    const H = Math.round(box.height);

    const canvas = document.createElement('canvas');
    canvas.width  = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.direction = 'rtl';
    ctx.textBaseline = 'middle';

    const ink    = cs.getPropertyValue('--tp-ink').trim();
    const muted  = cs.getPropertyValue('--tp-muted').trim();
    const lineC  = cs.getPropertyValue('--tp-line').trim();
    const accent = cs.getPropertyValue('--tp-accent').trim();

    // الخلفية: تدرُّجٌ إن كان للسِّمة لونان، وإلّا لونٌ واحد
    const bg  = cs.getPropertyValue('--tp-bg').trim() || '#fff';
    const bg2 = cs.getPropertyValue('--tp-bg2').trim();
    if (bg2 && bg2 !== bg) {
      const g = ctx.createLinearGradient(0, 0, W, H);   // يوافق 135deg في CSS
      g.addColorStop(0, bg);
      g.addColorStop(1, bg2);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, W, H);

    // الزخرفة
    if (selPat.value !== 'none') {
      const img = new Image();
      img.src = patternURI(selPat.value, lineC);
      try {
        await img.decode();
        const pat = ctx.createPattern(img, 'repeat');
        if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); }
      } catch (e) { /* تُتجاوَز الزخرفةُ إن تعذَّرت */ }
    }

    const rel = el => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height,
               right: r.right - box.left };
    };

    const inner = page._inner || page.querySelector('.tp-sheet-inner');

    // الإطار
    if (page.classList.contains('tp-framed')) {
      const r = rel(inner);
      ctx.strokeStyle = lineC;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
      ctx.strokeRect(r.x - 4.5, r.y - 4.5, r.w + 9, r.h + 9);
    }

    // العنوان
    const titleEl = page.querySelector('.tp-doc-title');
    if (titleEl) {
      const r = rel(titleEl);
      ctx.font = fontOf(titleEl);
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      const lh = parseFloat(getComputedStyle(titleEl).lineHeight) || r.h;
      drawLines(ctx, titleEl.textContent, r.x + r.w / 2, r.y, r.w, lh);
    }

    // العَزْو تحت العنوان
    const poetEl = page.querySelector('.tp-doc-poet');
    if (poetEl) {
      const r = rel(poetEl);
      ctx.font = fontOf(poetEl);
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText(poetEl.textContent, r.x + r.w / 2, r.y + r.h / 2);
    }

    // الفاصل الأفقيّ تحت الترويسة
    const ruleEl = page.querySelector('.tp-doc-rule');
    if (ruleEl) {
      const r = rel(ruleEl);
      ctx.strokeStyle = lineC;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, Math.round(r.y) + .5);
      ctx.lineTo(r.right, Math.round(r.y) + .5);
      ctx.stroke();
    }

    // الأشطر
    page.querySelectorAll('.tp-shatr').forEach(cell => {
      const r = rel(cell);
      const pad = parseFloat(getComputedStyle(cell).paddingRight);
      ctx.font = fontOf(cell);
      ctx.fillStyle = ink;
      ctx.textAlign = 'right';
      ctx.fillText(cell.textContent, r.right - pad, r.y + r.h / 2);
    });

    // الأرقام
    page.querySelectorAll('.tp-num').forEach(cell => {
      const r = rel(cell);
      ctx.font = fontOf(cell);
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText(cell.textContent, r.x + r.w / 2, r.y + r.h / 2);
    });

    // الفاصل البصريّ: خطٌّ رأسيّ أو رمز
    page.querySelectorAll('.tp-vline').forEach(v => {
      const r = rel(v);
      ctx.fillStyle = lineC;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    page.querySelectorAll('.tp-mid').forEach(cell => {
      if (!cell.textContent.trim()) return;
      const r = rel(cell);
      ctx.font = fontOf(cell);
      ctx.fillStyle = lineC;
      ctx.textAlign = 'center';
      ctx.fillText(cell.textContent, r.x + r.w / 2, r.y + r.h / 2);
    });

    // السطور الممتدّة
    page.querySelectorAll('.tp-full').forEach(cell => {
      const r = rel(cell);
      ctx.font = fontOf(cell);
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(cell.textContent, r.x + r.w / 2, r.y + r.h / 2);
    });

    // العَزْو أسفل النصّ
    const attribEl = page.querySelector('.tp-attrib');
    if (attribEl) {
      const span = attribEl.querySelector('span');
      const r = rel(span);
      ctx.font = fontOf(attribEl);
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      if (attribEl.dataset.pos === 'box') {
        ctx.strokeStyle = lineC;
        ctx.lineWidth = 1;
        roundRect(ctx, r.x + .5, r.y + .5, r.w - 1, r.h - 1, r.h / 2);
        ctx.stroke();
      }
      ctx.fillText(span.textContent, r.x + r.w / 2, r.y + r.h / 2);
    }

    // رقم الصفحة
    const numEl = page.querySelector('.tp-pagenum');
    if (numEl) {
      const r = rel(numEl);
      ctx.font = fontOf(numEl);
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText(numEl.textContent, r.x + r.w / 2, r.y + r.h / 2);
    }

    return canvas;
  }

  async function exportPNG() {
    const pages = [...pagesEl.querySelectorAll('.tp-sheet')];
    if (!pages.length || !pagesEl.querySelector('.tp-shatr')) {
      toast('لا توجد أبياتٌ للتصدير.');
      return;
    }

    // نُلغي التحجيمَ البصريَّ حتى تكون الإحداثيّاتُ حقيقيّة
    const prev = pagesEl.style.transform;
    pagesEl.style.transform = '';

    const base = safeName('قصيدة');
    let i = 0;
    for (const page of pages) {
      const canvas = await renderPage(page, 3);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      i++;
      if (blob) {
        download(blob, pages.length > 1 ? base + '-' + toArabicNum(i) + '.png' : base + '.png');
        if (i < pages.length) await new Promise(r => setTimeout(r, 450));
      }
    }

    pagesEl.style.transform = prev;
    toast(pages.length > 1
      ? 'حُفِظت ' + arCount(pages.length, 'صورة', 'صورتان', 'صور', 'صورة') + '.'
      : 'حُفِظت الصورة.');
  }

  /* ---------------- نسخ النصّ ---------------- */

  function exportCopy() {
    const items = parse();
    if (!items.length) { toast('لا يوجد نصٌّ للنسخ.'); return; }
    const out = [];
    if (inTitle.value.trim()) out.push(inTitle.value.trim(), '');
    items.forEach((it, i) => {
      if (i) out.push('');
      if (it.type === 'full') { out.push(stripTatweel(it.text)); return; }
      it.parts.forEach(p => out.push(stripTatweel(p)));
    });
    if (inPoet.value.trim()) out.push('', inPoet.value.trim());
    navigator.clipboard.writeText(out.join('\n'))
      .then(() => toast('نُسِخ النصُّ إلى الحافظة.'))
      .catch(() => toast('تعذَّر النسخ.'));
  }

  /* ---------------- الحفظ والاسترجاع ---------------- */

  const FIELDS = [
    ['tp-input', 'value'], ['tp-mode', 'value'], ['tp-sep', 'value'],
    ['tp-sep-custom', 'value'], ['tp-title', 'value'], ['tp-poet', 'value'],
    ['tp-attr', 'value'], ['tp-theme', 'value'], ['tp-pattern', 'value'],
    ['tp-width', 'value'],
    ['tp-family', 'value'],
    ['tp-font', 'value'], ['tp-numbers', 'checked'], ['tp-frame', 'checked']
  ];

  function saveState() {
    try {
      const s = {};
      FIELDS.forEach(([id, prop]) => { s[id] = $(id)[prop]; });
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch (e) { /* لا يضرّ */ }
  }

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s) return;
      FIELDS.forEach(([id, prop]) => { if (s[id] !== undefined) $(id)[prop] = s[id]; });
    } catch (e) { /* لا يضرّ */ }
  }

  /* ---------------- الربط ---------------- */

  const PLACEHOLDERS = {
    amudi: [
      'ويا جُمْلُ كم مِن ليلةٍ تَحسِبينَني',
      'رَقَدتُّ، ومَأْقِي العَيْنِ بالدَّمْع سافِحُ',
      '',
      'وكم شاقني -والليلُ مُرْخٍ رِواقَهُ-',
      'سَنَا بارِقٍ من نحو أَرْضِكِ لائِحُ'
    ].join('\n'),
    rajaz: [
      'إنْ تَغْفِرِ اللَّهُمَّ تَغْفِرْ جَمَّا',
      'وأَيُّ عَبْدٍ لكَ لا أَلَمَّا'
    ].join('\n')
  };

  function syncControls() {
    sepCust.classList.toggle('tp-hidden', selSep.value !== 'custom');
    sepField.classList.toggle('tp-hidden', selMode.value !== 'amudi');
    fontVal.textContent = toArabicNum(rngFont.value);
    input.placeholder = PLACEHOLDERS[selMode.value] || PLACEHOLDERS.amudi;
    inputLbl.textContent = selMode.value === 'rajaz' ? 'الرَّجَز' : 'القصيدة';
  }

  ['tp-input', 'tp-title', 'tp-poet', 'tp-sep-custom'].forEach(id =>
    $(id).addEventListener('input', renderSoon));
  ['tp-mode', 'tp-sep', 'tp-width', 'tp-attr', 'tp-theme', 'tp-pattern', 'tp-family'].forEach(id =>
    $(id).addEventListener('change', () => { syncControls(); renderSoon(); }));
  ['tp-numbers', 'tp-frame'].forEach(id =>
    $(id).addEventListener('change', renderSoon));
  rngFont.addEventListener('input', () => { syncControls(); renderSoon(); });

  $('tp-png').addEventListener('click', exportPNG);
  $('tp-copy').addEventListener('click', exportCopy);
  $('tp-pdf').addEventListener('click', () => {
    const prev = pagesEl.style.transform;
    pagesEl.style.transform = '';
    window.print();
    setTimeout(() => { pagesEl.style.transform = prev; fitPages(); }, 500);
  });

  window.addEventListener('resize', fitPages);
  if (window.ResizeObserver) {
    // يُعيد التحجيمَ حين يتغيّر عرضُ اللوحة فقط، لا حين يتغيّر ارتفاعُها،
    // ومؤجَّلًا حتى لا يرتدَّ على نفسه إن ظهر شريطُ التمرير أو اختفى
    let fitTimer = null;
    new ResizeObserver(() => {
      if (!stage.clientWidth || Math.abs(stage.clientWidth - lastFitW) <= 1) return;
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitPages, 120);
    }).observe(stage);
  }

  function boot() {
    loadState();
    syncControls();
    render();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { boot(); setTimeout(render, 300); });
  } else {
    setTimeout(boot, 250);
  }
})();
