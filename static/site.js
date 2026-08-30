document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') { applyDarkMode(); }
        });

        function toggleMenu() {
            document.getElementById('menuBtn').classList.toggle('active');
            document.getElementById('navMenu').classList.toggle('active');
            document.getElementById('menuOverlay').classList.toggle('active');
        }

        function applyDarkMode() {
            const body = document.getElementById('body');
            body.classList.remove('bg-gradient-to-br', 'from-orange-50', 'via-amber-50', 'to-yellow-50', 'pattern');
            body.classList.add('bg-gray-900', 'dark-pattern', 'dark');
            document.getElementById('navbar').classList.replace('glass', 'dark-glass');
            document.getElementById('navSubtitle').classList.replace('text-gray-600', 'text-gray-400');
            document.getElementById('moonIcon').classList.add('hidden');
            document.getElementById('sunIcon').classList.remove('hidden');
            
            const darkModeBtn = document.getElementById('darkModeBtn');
            darkModeBtn.classList.replace('bg-orange-100', 'bg-gray-800');
            darkModeBtn.classList.remove('hover:bg-orange-200');
            darkModeBtn.classList.add('hover:bg-gray-800');
            
            document.getElementById('copyright').classList.replace('text-gray-600', 'text-gray-400');
            const quickNavLinks = document.querySelectorAll('.quick-nav-link');
            quickNavLinks.forEach(link => {
                link.classList.replace('text-gray-700', 'text-gray-300');
                link.classList.replace('hover:text-orange-600', 'hover:text-amber-400');
            });
     
   }

        function applyLightMode() {
            const body = document.getElementById('body');
            body.classList.add('bg-gradient-to-br', 'from-orange-50', 'via-amber-50', 'to-yellow-50', 'pattern');
            body.classList.remove('bg-gray-900', 'dark-pattern', 'dark');
            document.getElementById('navbar').classList.replace('dark-glass', 'glass');
            document.getElementById('navSubtitle').classList.replace('text-gray-400', 'text-gray-600');
            document.getElementById('moonIcon').classList.remove('hidden');
            document.getElementById('sunIcon').classList.add('hidden');
            
            const darkModeBtn = document.getElementById('darkModeBtn');
            darkModeBtn.classList.replace('bg-gray-800', 'bg-orange-100');
            darkModeBtn.classList.add('hover:bg-orange-200');
            darkModeBtn.classList.remove('hover:bg-gray-800');
            
            document.getElementById('copyright').classList.replace('text-gray-400', 'text-gray-600');
            const quickNavLinks = document.querySelectorAll('.quick-nav-link');
            quickNavLinks.forEach(link => {
                link.classList.replace('text-gray-300', 'text-gray-700');
                link.classList.replace('hover:text-amber-400', 'hover:text-orange-600');
            });
       
 }

        function toggleDarkMode() {
            const isDark = document.getElementById('body').classList.contains('dark');
            isDark ? applyLightMode() : applyDarkMode();
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        }

function copyContent() {
            const article = document.getElementById('articleContent');
            if (!article) return;
            // استعادة النص الأصلي مؤقتًا (بدون وصلات المنسِّق) قبل الاستنساخ
            const saved = [];
            article.querySelectorAll('.shatr, .rajaz-shatr').forEach(cell => {
                saved.push({ cell, current: cell.textContent });
                if (cell.dataset.original) cell.textContent = cell.dataset.original;
            });
            const clone = article.cloneNode(true);
            // استعادة العرض الأصلي فورًا
            saved.forEach(({ cell, current }) => { cell.textContent = current; });
            // إزالة العناصر غير المرغوبة
            clone.querySelectorAll('style, script, [hidden], .hidden').forEach(el => el.remove());
            const commentsSection = clone.querySelector('#comments-section');
            if (commentsSection) commentsSection.remove();
            const footer = clone.querySelector('.mt-12');
            if (footer) footer.remove();
            // تحويل أبيات الشعر العمودي إلى نص نظيف (سطر لكل بيت)
            clone.querySelectorAll('.glass-premium-box').forEach(box => {
                const rows = box.querySelectorAll('tr');
                const p = document.createElement('p');
                if (rows.length > 0) {
                    const isRajaz = !!box.querySelector('.rajaz-table');
                    const verses = [];
                    var rajazNum = 0;
                    rows.forEach(row => {
                        // شعر عمودي
                        const parts = [...row.querySelectorAll('.shatr')].map(c => c.textContent.trim()).filter(Boolean);
                        if (parts.length === 2) { verses.push(parts[0] + '\n' + parts[1]); }
                        else if (parts.length === 1) verses.push(parts[0]);
                        else {
                            // رجز داخل glass-premium-box
                            const rajaz = [...row.querySelectorAll('.rajaz-shatr')].map(c => c.textContent.trim()).filter(Boolean);
                            if (rajaz.length > 0) {
                                rajazNum++;
                                const num = String(rajazNum).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
                                rajaz.forEach(v => verses.push(num + '- ' + v));
                            }
                        }
                    });
                    p.textContent = verses.join(isRajaz ? '\n' : '\n\n');
                } else {
                    // صندوق نثر (كمستطيل السؤال): احتفظ بالنص كما هو
                    p.textContent = box.innerText.trim();
                }
                box.replaceWith(p);
            });
            // تحويل أبيات الرجز إلى نص نظيف
            clone.querySelectorAll('.glass-rajaz-box').forEach(box => {
                const lines = [];
                box.querySelectorAll('.rajaz-shatr').forEach(cell => {
                    const text = cell.textContent.trim();
                    if (text) lines.push(text);
                });
                const p = document.createElement('p');
                p.textContent = lines.join('\n');
                box.replaceWith(p);
            });
            // استبدال رموز خط المصحف بالنص القرآني العادي عند النسخ
            clone.querySelectorAll('[data-quran-text]').forEach(el => {
                const plainText = el.getAttribute('data-quran-text') || '';
                el.replaceWith(document.createTextNode(plainText));
            });
            const content = clone.innerText.trim();
            navigator.clipboard.writeText(content).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => { toast.classList.remove('show'); }, 3000);
            }).catch(err => console.warn('فشل النسخ:', err));
        }

window.addEventListener('scroll', function() {
    const headerPoetry = document.getElementById('headerPoetry');
    const quickNavLinks = document.getElementById('quickNavLinks');
    if (window.scrollY > 50) {
        headerPoetry.style.opacity = '0';
        headerPoetry.style.transform = 'translateY(-10px)';
        headerPoetry.style.filter = 'blur(6px)';
        headerPoetry.style.pointerEvents = 'none';
        quickNavLinks.classList.add('nav-visible');
    } else {
        headerPoetry.style.opacity = '1';
        headerPoetry.style.transform = 'translateY(0)';
        headerPoetry.style.filter = 'blur(0px)';
        headerPoetry.style.pointerEvents = 'auto';
        quickNavLinks.classList.remove('nav-visible');
    }
}, { passive: true });

// ── فهرس الصفحات ─────────────────────────────────────────
const SITE_PAGES = [
    { url: '/', title: 'سيف العشيرة', breadcrumb: null },
    { url: '/chanting/', title: 'الإنشاد والحُداء', breadcrumb: null },
    { url: '/writings/', title: 'الكِتابات', breadcrumb: null },
    { url: '/questions/', title: 'الأسئلة', breadcrumb: null },
    { url: '/inshad/', title: 'الإنشاد عند العرب', breadcrumb: 'الكِتابات' },
    { url: '/metrab/', title: 'تفسير بعض قصيدةٍ لأبي المِطراب', breadcrumb: 'الكِتابات' },
    { url: '/taqrizat-abi-fihr/', title: 'جمْعٌ لبعض تقريظات أبي فِهْر', breadcrumb: 'الكِتابات' },
    { url: '/question-1/', title: 'ما الذي حبَّب إليك العربية؟', breadcrumb: 'الأسئلة' },
    { url: '/question-2/', title: 'نصيحةٌ لمن يحبُّ علوم اللغة', breadcrumb: 'الأسئلة' },
    { url: '/nathm/', title: 'نَظْم الشعر وفَهْمُه', breadcrumb: 'الأسئلة' },
    { url: '/mathal/', title: 'الأمثال من الشعر', breadcrumb: 'الأسئلة' },
    { url: '/ibn-duraid/', title: 'مقصورة ابن دُرَيد', breadcrumb: 'الأسئلة' },
    { url: '/takharog/', title: 'بيتٌ للتخرُّج', breadcrumb: 'الأسئلة' },
    { url: '/question-3/', title: 'أشباه ونظائر في النساء', breadcrumb: 'الأسئلة' },
    { url: '/saif-clan/', title: 'أنا سيف العشيرة فاعرفوني', breadcrumb: null },
    { url: '/mufadati/', title: 'عليَّ مُفاضَتي ومعي سِلاحي', breadcrumb: null },
    { url: '/arjuzat-abi-al-aliya/', title: 'شرح أرجوزة أبي العالية', breadcrumb: 'الإنشاد والحُداء' },
    { url: '/marthiya-ziad-al-ajam/', title: 'شرح مرثية زياد الأعجم', breadcrumb: 'الإنشاد والحُداء' },
    { url: '/arjuzat-al-radi/', title: 'شرح أرجوزة الرضي', breadcrumb: 'الإنشاد والحُداء' },
    { url: '/arjuzat-jabbar/', title: 'شرح أرجوزة جبَّار', breadcrumb: 'الإنشاد والحُداء' },

];

// ── تخزين محتوى الصفحات ─────────────────────────────────
const _cc = {};
async function _getText(url) {
    if (_cc[url] !== undefined) return _cc[url];
    try {
        const r = await fetch(url);
        if (!r.ok) { _cc[url] = ''; return ''; }
        const html = await r.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const el = doc.getElementById('articleContent') || doc.querySelector('.content-section');
        if (!el) { _cc[url] = ''; return ''; }
        const clone = el.cloneNode(true);
        clone.querySelectorAll('style, script, svg, button, [data-pagefind-ignore]').forEach(n => n.remove());
        clone.querySelectorAll('[data-quran-text]').forEach(span => {
            span.replaceWith(' ' + (span.getAttribute('data-quran-text') || '') + ' ');
        });
        _cc[url] = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    } catch { _cc[url] = ''; }
    return _cc[url];
}

// ── معالجة النص العربي ──────────────────────────────────
const _D = '[\\u064B-\\u065F\\u0670]*';
function _hasDiac(s) { return /[\u064B-\u065F\u0670]/.test(s); }
function _escR(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function _escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _normalize(s) {
    return s.replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي');
}
const _AV = { 'ا':'[اأإآٱ]','أ':'[اأإآٱ]','إ':'[اأإآٱ]','آ':'[اأإآٱ]','ه':'[هة]','ة':'[هة]','ي':'[يى]','ى':'[يى]' };

function _buildPat(q, mode) {
    // مطابق مع تشكيل: نص حرفي تام
    if (mode === 'exact' && _hasDiac(q))
        return new RegExp(_escR(q));
    // مطابق بدون تشكيل: يسمح بوجود حركات بين الحروف
    if (mode === 'exact')
        return new RegExp(q.split('').map(c => c === ' ' ? '\\s+' : (_escR(c) + _D)).join(''));
    // تقريبي: يطبّع الحروف (الهمزات، التاء المربوطة، الألف المقصورة)
    return new RegExp(_normalize(q).split('').map(c =>
        c === ' ' ? '\\s+' : ((_AV[c] || _escR(c)) + _D)
    ).join(''));
}

function _allExcerpts(q, text, mode, ctx = 90) {
    let src;
    try { src = _buildPat(q, mode).source; } catch { return []; }
    const gPat = new RegExp(src, 'g');
    const results = [];
    let m;
    while ((m = gPat.exec(text)) !== null) {
        const idx = m.index;
        const s = Math.max(0, idx - ctx);
        const e = Math.min(text.length, idx + m[0].length + ctx);
        let ex = text.slice(s, e).trim();
        if (s > 0) ex = '...' + ex;
        if (e < text.length) ex += '...';
        const safe = _escH(ex);
        const sm   = _escH(m[0]);
        const si   = safe.indexOf(sm);
        results.push(si >= 0
            ? safe.slice(0, si) + '<mark>' + sm + '</mark>' + safe.slice(si + sm.length)
            : safe);
        if (m[0].length === 0) gPat.lastIndex++;
    }
    return results;
}

// ── حالة البحث ───────────────────────────────────────────
let _sMode = 'exact';
let _sTimer = null;
let _prefetched = false;

function _prefetchAll() {
    if (_prefetched) return;
    _prefetched = true;
    SITE_PAGES.forEach(p => _getText(p.url));
}

function setSearchMode(mode) {
    _sMode = mode;
    document.getElementById('searchModeExact').classList.toggle('search-mode-active', mode === 'exact');
    document.getElementById('searchModeApprox').classList.toggle('search-mode-active', mode !== 'exact');
    const q = document.getElementById('searchInput').value;
    if (q.trim()) _doSearch(q);
}

function performSearch(q) {
    if (_sTimer) clearTimeout(_sTimer);
    _sTimer = setTimeout(() => _doSearch(q), 220);
}

async function _doSearch(q) {
    const results = document.getElementById('searchResults');
    if (!q.trim()) { results.innerHTML = SEARCH_HINT; return; }
    if (q.trim().length < 3) {
        results.innerHTML = '<p class="search-hint-text">أدخِل ثلاثةَ أحرف على الأقل للبحث.</p>';
        return;
    }
    results.innerHTML = '<p class="text-center text-gray-400 py-4">جارٍ البحث...</p>';
    const found = [];
    await Promise.all(SITE_PAGES.map(async p => {
        const text = await _getText(p.url);
        if (!text) return;
        const excerpts = _allExcerpts(q, text, _sMode);
        excerpts.forEach(excerpt => found.push({ ...p, excerpt }));
    }));
    if (!found.length) {
        results.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد نتائج</p>';
        return;
    }
    // تتبع رقم التكرار لكل رابط (لتظليل النتيجة الصحيحة عند الضغط)
    const _occMap = {};
    found.forEach(m => {
        if (_occMap[m.url] === undefined) _occMap[m.url] = 0;
        m.occ = _occMap[m.url]++;
    });
    const n = found.length;
    const nAr = String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const nStr = n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : (n >= 3 && n <= 10) ? nAr + ' نتائج' : nAr + ' نتيجة';
    // group by breadcrumb, preserve site order
    const GROUP_ORDER = [null, 'الكِتابات', 'الأسئلة', 'الإنشاد والحُداء'];
    const groups = {};
    GROUP_ORDER.forEach(k => { groups[k] = []; });
    found.forEach(m => {
        const key = GROUP_ORDER.includes(m.breadcrumb) ? m.breadcrumb : null;
        groups[key].push(m);
    });
    let html = '<div class="search-result-count">' + nStr + '</div>';
    GROUP_ORDER.forEach(key => {
        if (!groups[key] || !groups[key].length) return;
        if (key !== null)
            html += '<div class="search-result-group-header">' + _escH(key) + '</div>';
        groups[key].forEach(m => {
            const hlParam = '?hl=' + encodeURIComponent(q) + (m.occ ? '&occ=' + m.occ : '');
            html += '<a href="' + m.url + hlParam + '" class="search-result-item" onclick="closeSearch()">'
                + '<div class="search-result-path"><strong>' + _escH(m.title) + '</strong></div>'
                + '<div class="search-result-excerpt">' + m.excerpt + '</div>'
                + '</a>';
        });
    });
    results.innerHTML = html;
}

function openSearch() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;   // صفحاتٌ بلا نافذة بحث (كصفحة الأداة)
    modal.classList.remove('hidden');
    document.getElementById('searchInput').focus();
    _prefetchAll();
}

const SEARCH_HINT = '<p class="search-hint-text">اكتب ثلاثةَ أحرف فأكثر للبحث. البحثُ المُطابِق يُراعي الهمزات والنقاط والتشكيل إن وُجِد. أما التقريبيُّ فبحثٌ مُقارِبٌ لا يُراعي ذلك. للخروج اضغط زرَّ البحث أو انقر على أي مكان فارغ.</p>';

function closeSearch() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = SEARCH_HINT;
}

const _searchBtn = document.getElementById('searchButton');
if (_searchBtn) _searchBtn.addEventListener('click', function() {
    const modal = document.getElementById('searchModal');
    modal.classList.contains('hidden') ? openSearch() : closeSearch();
});
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
});

// ── تظليل كلمة البحث والتمرير إليها عند فتح الصفحة ─────
(function() {
    const hl = new URLSearchParams(window.location.search).get('hl');
    const _occStr = new URLSearchParams(window.location.search).get('occ');
    const _targetOcc = _occStr !== null ? parseInt(_occStr, 10) : 0;
    if (!hl) return;
    history.replaceState(null, '', window.location.pathname + window.location.hash);

    function clearHL(content) {
        content.querySelectorAll('mark.search-hl').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
        content.querySelectorAll('[data-quran-text].search-hl').forEach(s => s.classList.remove('search-hl'));
        content.querySelectorAll('tr.search-hl-row').forEach(r => r.classList.remove('search-hl-row'));
    }

    function doHighlight() {
        const content = document.getElementById('articleContent');
        if (!content) return;
        // لا تُعِد التظليل إذا كان موجوداً بالفعل
        if (content.querySelector('mark.search-hl, tr.search-hl-row, [data-quran-text].search-hl')) return;
        let pat;
        try { pat = _buildPat(hl, 'approx'); } catch { return; }

        // أولاً: ابحث في عقد النص العادية (الأبيات وغيرها)
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
            acceptNode: n => n.parentElement.closest('script, style, [data-pagefind-ignore]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        let found = null;
        let _occIdx = 0;
        let node;
        while ((node = walker.nextNode())) {
            const text = node.nodeValue;
            const m = text.match(pat);
            if (!m) continue;
            const shatr = node.parentElement.closest('.shatr, .rajaz-shatr');
            if (shatr) {
                // نضلّل السطر <tr> بدل <mark> داخل الخلية (stretchCell تمسحها)
                const tr = shatr.closest('tr');
                if (tr) {
                    if (_occIdx === _targetOcc) { tr.classList.add('search-hl-row'); found = tr; break; }
                    _occIdx++;
                }
            } else {
                if (_occIdx === _targetOcc) {
                    const mark = document.createElement('mark');
                    mark.className = 'search-hl';
                    mark.textContent = text.slice(m.index, m.index + m[0].length);
                    const after = node.splitText(m.index);
                    after.nodeValue = text.slice(m.index + m[0].length);
                    node.parentNode.insertBefore(mark, after);
                    found = mark; break;
                }
                _occIdx++;
            }
        }

        // ثانياً: إذا لم يُوجد، ابحث في نصوص الآيات القرآنية
        if (!found) {
            content.querySelectorAll('[data-quran-text]').forEach(span => {
                if (found) return;
                const qt = span.getAttribute('data-quran-text') || '';
                if (!qt.match(pat)) return;
                if (_occIdx === _targetOcc) { span.classList.add('search-hl'); found = span; }
                _occIdx++;
            });
        }

        if (found) {
            setTimeout(() => found.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
            document.addEventListener('click', () => {
                clearHL(content);
                window._doPageHighlight = null;
            }, { once: true });
        }
    }

    window._doPageHighlight = doHighlight;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doHighlight);
    } else {
        doHighlight();
    }
})();

const TASHKEEL = /[\u064B-\u065F\u0670]/;
const NO_CONNECT_AFTER = new Set(['ا','أ','إ','آ','ٱ','و','ؤ','ز','ذ','د','ر','ى','ة','ء','ئ']);
const PUNCT = new Set(['،','؛','؟','!','.',',',':','-','–','—','«','»','"','"','(',')','/']);
const FORBIDDEN_WORDS = new Set(['الله','اللهم','بالله','تالله','والله','فالله','لله']);

function tokenize(word) {
  const tokens = [];
  for (let i = 0; i < word.length; i++) {
    if (TASHKEEL.test(word[i])) {
      if (tokens.length) tokens[tokens.length - 1].marks += word[i];
    } else {
      tokens.push({ base: word[i], marks: '' });
    }
  }
  return tokens;
}

function tokensToString(tokens) {
  return tokens.map(t => t.base + t.marks).join('');
}

function canConnectAfter(base) {
  return !NO_CONNECT_AFTER.has(base) && !PUNCT.has(base) && /[\u0600-\u06FF]/.test(base);
}

function getAllInsertPositions(tokens) {
  const positions = [];
  let lastValid = tokens.length - 1;
  while (lastValid > 0 && PUNCT.has(tokens[lastValid].base)) lastValid--;
  for (let i = lastValid - 1; i >= 1; i--) {
    if (PUNCT.has(tokens[i + 1]?.base)) continue;
    const nextBase = tokens[i + 1]?.base;
    if (tokens[i].base === 'ل' && nextBase && 'اأإآٱ'.includes(nextBase)) continue;
    if (nextBase === 'ء') continue;
    if (canConnectAfter(tokens[i].base)) positions.push(i + 1);
  }
  // ترتيب تصاعدي: يبدأ التوزيع من مطلع الكلمة (يمين) فتتوزع الزيادة بالتساوي
  return positions.sort((a, b) => a - b);
}

function getCtx(font) {
  const c = getCtx._canvas || (getCtx._canvas = document.createElement('canvas'));
  const ctx = c.getContext('2d');
  ctx.font = font;
  return ctx;
}

// تبني الكلمة من نقاط الإدراج وعدد الوصلات لكل موضع
function buildWordFromSlots(tokens, slots) {
  // slots: Map من موضع => عدد وصلات
  // نبني من اليمين إلى اليسار (ترتيب tokens)
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);
    const count = slots.get(i + 1) || 0;
    for (let k = 0; k < count; k++) result.push({ base: 'ـ', marks: '' });
  }
  return result;
}

// توزّع n وصلة على positions بشكل دوري (round-robin) فتكون موزّعة بالتساوي
function distributeEvenly(positions, n) {
  const slots = new Map();
  if (!positions.length || n <= 0) return slots;
  for (let k = 0; k < n; k++) {
    const pos = positions[k % positions.length];
    slots.set(pos, (slots.get(pos) || 0) + 1);
  }
  return slots;
}

// النواة الخالصة: تأخذ نصّ الشطر وعرضًا متاحًا وسياق قياس، وتُرجع النصّ ممدودًا
function stretchArabicLine(text, available, ctx) {
  const originalWords = String(text).trim().split(/\s+/).filter(Boolean);
  if (!originalWords.length) return '';
  const plain = originalWords.join(' ');

  // نجمع الكلمات القابلة للمدّ مع مواضعها
  const wordData = originalWords.map(w => {
    const orig = w.replace(/[ً-ٰٟ]/g, '');
    const forbidden = [...FORBIDDEN_WORDS].some(fw => orig.includes(fw));
    const tokens = tokenize(w);
    const positions = forbidden ? [] : getAllInsertPositions(tokens);
    return { tokens, positions, forbidden, baseWidth: ctx.measureText(tokensToString(tokens)).width };
  });

  // العرض الحالي بدون أي وصلات
  const tatweelWidth = ctx.measureText('ـ').width;
  // خطٌّ لا وصلةَ فيه (أو لم يُحمَّل بعد) يعطي عرضًا صفرًا،
  // فتصير القسمةُ عليه لانهائيةً ويتجمَّد التوزيع؛ فيُترك الشطرُ على حاله
  if (!(tatweelWidth > 0.01)) return plain;
  const spaceWidth = ctx.measureText(' ').width;
  const baseTotal = wordData.reduce((s, w) => s + w.baseWidth, 0)
    + spaceWidth * Math.max(0, wordData.length - 1);

  // هامش أمان 2% لتجنب فيضان النص بسبب فوارق قياس الخطوط
  const totalGap = (available - baseTotal) * 0.98;
  if (totalGap <= 0.5) return plain;

  // إجمالي المواضع الصالحة في الشطر كله
  const totalSlots = wordData.reduce((s, w) => s + w.positions.length, 0);
  if (totalSlots === 0) return plain;

  // عدد الوصلات الإجمالي المطلوب
  const totalTatweels = Math.floor(totalGap / tatweelWidth);
  if (totalTatweels <= 0) return plain;

  // توزيع بطريقة "أكبر باقٍ" لضمان أن مجموع الوصلات الموزَّعة = totalTatweels بالضبط
  const exactShares = wordData.map(w => totalTatweels * w.positions.length / totalSlots);
  const floors = exactShares.map(v => Math.floor(v));
  let remainder = totalTatweels - floors.reduce((a, b) => a + b, 0);
  const order = exactShares
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floors[order[k].i]++;

  return wordData.map((w, idx) => {
    if (!w.positions.length) return tokensToString(w.tokens);
    const slots = distributeEvenly(w.positions, floors[idx]);
    return tokensToString(buildWordFromSlots(w.tokens, slots));
  }).join(' ');
}

function stretchCell(cell, font) {
  const available = cell.clientWidth
    - parseFloat(getComputedStyle(cell).paddingLeft)
    - parseFloat(getComputedStyle(cell).paddingRight);
  // إذا كانت الخلية غير مرئية بعد (الجوال يؤخر الرسم) نتجاهلها
  if (available <= 10) return;
  if (!cell.dataset.original) cell.dataset.original = cell.textContent.trim();
  cell.textContent = stretchArabicLine(cell.dataset.original, available, getCtx(font));
}

function stretchAll() {
  document.querySelectorAll('.poetry-table').forEach(table => {
    table.querySelectorAll('.shatr').forEach(cell => {
      if (cell.dataset.original) cell.textContent = cell.dataset.original;
    });
    const sample = table.querySelector('.shatr');
    if (!sample) return;
    const cs = getComputedStyle(sample);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    table.querySelectorAll('.shatr').forEach(cell => stretchCell(cell, font));
  });
  document.querySelectorAll('.rajaz-table').forEach(table => {
    table.querySelectorAll('.rajaz-shatr').forEach(cell => {
      if (cell.dataset.original) cell.textContent = cell.dataset.original;
    });
    const sample = table.querySelector('.rajaz-shatr');
    if (!sample) return;
    const cs = getComputedStyle(sample);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
    table.querySelectorAll('.rajaz-shatr').forEach(cell => stretchCell(cell, font));
  });
}

function initStretch() {
  function run() {
    stretchAll();
    // محاولات متكررة للجوال الذي يؤخر رسم العناصر
    setTimeout(stretchAll, 300);
    setTimeout(stretchAll, 1500);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    setTimeout(run, 300);
  }
  // ResizeObserver: يُعيد الحساب عند تغيير حجم أي جدول (موثوق على الجوال)
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(_debStretch);
    document.querySelectorAll('.glass-premium-box, .glass-rajaz-box').forEach(el => ro.observe(el));
    // نراقب أيضًا الجداول التي ستُضاف لاحقًا
    const mo = new MutationObserver(() => {
      document.querySelectorAll('.glass-premium-box, .glass-rajaz-box').forEach(el => {
        if (!el._roObserved) { ro.observe(el); el._roObserved = true; }
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  // IntersectionObserver: يُشغّل التنسيق حين تدخل مربعات الشعر نطاق الرؤية
  // يحلّ مشكلة الأبيات التي تكون أسفل الصفحة عند التحميل فتُتجاهل أولاً
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) stretchAll();
    }, { threshold: 0.05 });
    document.querySelectorAll('.glass-premium-box, .glass-rajaz-box').forEach(el => io.observe(el));
  }
}

function addVerseNumbers() {
  function toAr(n) { return String(n).split('').reverse().join('').replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }
  function addNums(selector) {
    document.querySelectorAll(selector).forEach(function(table) {
      var rows = table.querySelectorAll('tr');
      if (rows.length < 2) return;
      table.classList.add('numbered');
      rows.forEach(function(row, i) {
        var n = i + 1;
        row.id = 'verse-' + n;
        var td = document.createElement('td');
        td.className = 'verse-num';
        var inner = '<bdo dir="rtl">' + toAr(n) + '-</bdo>';
        var expEl = document.getElementById('exp-' + n);
        if (expEl) {
          var a = document.createElement('a');
          a.href = '#exp-' + n;
          a.innerHTML = inner;
          a.style.cssText = 'text-decoration:none;color:inherit;display:block;';
          td.appendChild(a);
        } else {
          td.innerHTML = inner;
        }
        row.insertBefore(td, row.firstChild);
      });
    });
  }
  addNums('.poetry-table');
  addNums('.rajaz-table');
}

function addCopyVerseButtons() {
  const copyIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  document.querySelectorAll('.glass-premium-box').forEach(function(box) {
    var table = box.querySelector('.poetry-table.numbered, .rajaz-table.numbered');
    if (!table) return;
    var btn = document.createElement('button');
    btn.className = 'copy-verses-btn';
    btn.setAttribute('aria-label', 'نسخ الأبيات');
    btn.innerHTML = copyIcon;
    btn.onclick = function() {
      var isRajaz = table.classList.contains('rajaz-table');
      var verses = [];
      table.querySelectorAll('tr').forEach(function(row) {
        var shatrs = Array.from(row.querySelectorAll('.shatr')).map(function(c) {
          return (c.dataset.original || c.textContent).trim();
        }).filter(Boolean);
        if (shatrs.length === 2) verses.push(shatrs[0] + '\n' + shatrs[1]);
        else if (shatrs.length === 1) verses.push(shatrs[0]);
        else {
          Array.from(row.querySelectorAll('.rajaz-shatr')).forEach(function(c) {
            var t = (c.dataset.original || c.textContent).trim();
            if (t) verses.push(t);
          });
        }
      });
      navigator.clipboard.writeText(verses.join(isRajaz ? '\n' : '\n\n')).then(function() {
        btn.classList.add('cv-copied');
        setTimeout(function() { btn.classList.remove('cv-copied'); }, 2000);
      }).catch(function() {});
    };
    btn.innerHTML = copyIcon + '<span>نسخ الأبيات</span>';
    var wrap = document.createElement('div');
    wrap.className = 'copy-verses-wrap';
    wrap.appendChild(btn);
    box.parentNode.insertBefore(wrap, box);
  });
}

// منع انعزال أقواس الآيات في سطر وحده
// أقواس QCF المشفَّرة: U+F8E0 = ﴿  و U+F8E1 = ﴾  (وليست U+FD3E/U+FD3F القياسية)
function fixQuranOrphans() {
  var nbsp = '\u00A0';
  document.querySelectorAll('[data-quran-text]').forEach(function(span) {
    var txt = span.textContent;
    // أزل المسافات الزائدة في النهاية أولاً حتى لا تُضلِّل البحث عن آخر مسافة
    var trimmed = txt.replace(/\s+$/, '');
    var trailing = txt.slice(trimmed.length);
    // الصق القوس الختامي QCF (U+F8E1) بما قبله لمنع انفراده في سطر
    trimmed = trimmed.replace(/ \uF8E1/g, nbsp + '\uF8E1');
    // الصق القوس الافتتاحي QCF (U+F8E0) بما بعده لمنع انفراده في سطر
    trimmed = trimmed.replace(/\uF8E0 /g, '\uF8E0' + nbsp);
    // احتياط: الصق الكلمة الأولى بالثانية (بعد معالجة القوس الافتتاحي)
    var firstSpace = trimmed.indexOf(' ');
    if (firstSpace > 0) {
      trimmed = trimmed.slice(0, firstSpace) + nbsp + trimmed.slice(firstSpace + 1);
    }
    span.textContent = trimmed + trailing;
  });
}

var _debStretch = (function() { var t; return function() { clearTimeout(t); t = setTimeout(stretchAll, 120); }; })();
window.addEventListener('resize', _debStretch);

function toEasternInContent() {
    const content = document.getElementById('articleContent');
    const fnSection = document.querySelector('.footnotes-section');
    const privacyPopup = document.getElementById('privacyPopup');
    const roots = [content, fnSection, privacyPopup].filter(Boolean);
    if (!roots.length) return;
    roots.forEach(function(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n) {
        return n.parentElement.closest('script,style,code,pre') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const s = node.nodeValue;
      const c = s.replace(/[0-9]/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
      if (c !== s) node.nodeValue = c;
    }
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { addVerseNumbers(); addCopyVerseButtons(); initStretch(); fixQuranOrphans(); toEasternInContent(); });
} else {
  addVerseNumbers(); addCopyVerseButtons(); initStretch(); fixQuranOrphans(); toEasternInContent();
}

// تمرير سلس لروابط الأبيات والشرح
document.addEventListener('click', function(e) {
  if (e.defaultPrevented) return; // تجاهل ما عولج بالفعل
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const nav = document.getElementById('navbar');
  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const gap = 12; // مسافة صغيرة تحت الـ navbar
  window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - navH - gap, behavior: 'smooth' });
  if (history.pushState) history.pushState(null, '', '#' + id);
});

/* ===== التلميحات في الجوال ===== */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tooltip-word').forEach(function(el) {
    el.addEventListener('touchstart', function(e) {
      e.preventDefault();
      document.querySelectorAll('.tooltip-word.active').forEach(function(other) {
        if (other !== el) other.classList.remove('active');
      });
      el.classList.toggle('active');
    }, { passive: false });
  });
  document.addEventListener('touchstart', function(e) {
    if (!e.target.closest('.tooltip-word')) {
      document.querySelectorAll('.tooltip-word.active').forEach(function(el) {
        el.classList.remove('active');
      });
    }
  });

  /* ===== توليد النجوم ===== */
  const container = document.getElementById('starsContainer');
  if (container) {
    const count = 90;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 2 + 1;
      star.style.cssText = [
        'width:' + size + 'px',
        'height:' + size + 'px',
        'top:' + Math.random() * 100 + '%',
        'left:' + Math.random() * 100 + '%',
        '--dur:' + (Math.random() * 3 + 2) + 's',
        '--delay:-' + (Math.random() * 4) + 's'
      ].join(';');
      container.appendChild(star);
    }
  }

  /* ===== تحريكات الدخول (AOS بسيط) ===== */
  if (window.IntersectionObserver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const aosSel = [
      '.glass-premium-box', '.glass-rajaz-box',
      '.writing-card', '.question-card',
      '.box-question', '.box-confirmed', '.box-warning',
      '.box-error', '.box-info', '.box-quote', '.box-rule'
    ].join(',');

    const aosObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-visible');
          aosObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(aosSel).forEach(function(el, i) {
      // تأخير خفيف متتالٍ لا يتجاوز 200ms حتى يبدو الدخول طبيعياً
      el.style.transitionDelay = Math.min(i * 60, 200) + 'ms';
      aosObserver.observe(el);
    });
  } else {
    // دعم محدود أو تفضيل إلغاء الحركة — نُظهر كل العناصر فوراً
    document.querySelectorAll(
      '.glass-premium-box,.glass-rajaz-box,.writing-card,.question-card,.box-question,.box-confirmed,.box-warning,.box-error,.box-info,.box-quote,.box-rule'
    ).forEach(function(el) { el.classList.add('aos-visible'); });
  }
});

/* ===== نظام الهوامش ===== */
(function() {
  function toAr(n) {
    return String(n).replace(/\d/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
  }

  var backSVG = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>';

  function buildFootnotes() {
    const refs = document.querySelectorAll('.fn-ref[data-footnote]');
    if (!refs.length) return;
    const article = document.getElementById('articleContent');
    if (!article) return;

    // تحويل كل إحالة: تغليف الرقم بـ <a> ليعمل مع نظام الـ Popup الجديد
    refs.forEach(function(ref, i) {
      var n = i + 1;
      ref.id = 'fnref-' + n;
      ref.innerHTML = '';
      var a = document.createElement('a');
      a.href = '#fn-' + n;
      a.textContent = toAr(n);
      (function(num) {
        a.addEventListener('click', function(e) {
          e.preventDefault();
          goToFnItem(num);
        });
      })(n);
      ref.appendChild(a);
    });

    // بناء قسم الهوامش أسفل المقالة بالكلاسات المتوافقة مع الـ Popup
    var section = document.createElement('div');
    section.className = 'footnotes-section';

    var title = document.createElement('div');
    title.className = 'footnotes-title';
    title.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>الإحالات والهوامش';
    section.appendChild(title);

    var list = document.createElement('ul');
    list.className = 'fn-list';
    section.appendChild(list);

    refs.forEach(function(ref, i) {
      var n = i + 1;
      var item = document.createElement('li');
      item.className = 'fn-item';
      item.id = 'fn-' + n;

      // مجموعة الرقم + زر العودة جنبًا إلى جنب
      var numGroup = document.createElement('div');
      numGroup.className = 'fn-num-group';

      var badge = document.createElement('span');
      badge.className = 'fn-num-badge';
      badge.textContent = toAr(n);
      badge.setAttribute('role', 'link');
      badge.setAttribute('tabindex', '0');
      (function(num) {
        badge.addEventListener('click', function() { goToFnRef(num); });
        badge.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToFnRef(num); }
        });
      })(n);

      var back = document.createElement('a');
      back.className = 'fn-back';
      back.href = '#fnref-' + n;
      back.setAttribute('data-tooltip', 'عُد إلى موضعه من النص');
      back.setAttribute('aria-label', 'عُد إلى موضعه من النص');
      back.innerHTML = backSVG;
      back.addEventListener('click', function(e) {
        e.preventDefault();
        goToFnRef(n);
      });

      numGroup.appendChild(badge);
      numGroup.appendChild(back);

      var txt = document.createElement('span');
      txt.className = 'fn-text';
      txt.textContent = ref.dataset.footnote;

      item.appendChild(numGroup);
      item.appendChild(txt);
      list.appendChild(item);
    });

    article.appendChild(section);
    toEasternInContent();
  }

  function goToFnRef(n) {
    var sup = document.getElementById('fnref-' + n);
    if (!sup) return;

    var link = sup.querySelector('a');
    var target = link || sup;

    // إزالة أي تظليل سابق
    document.querySelectorAll('.fn-ref-hl').forEach(function(el) {
      el.classList.remove('fn-ref-hl');
    });

    var offset = 200;
    window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - offset, behavior: 'smooth' });

    if (link) {
      // إعادة تشغيل الأنيميشن
      link.classList.remove('fn-ref-hl');
      void link.offsetWidth;
      link.classList.add('fn-ref-hl');
      setTimeout(function() { link.classList.remove('fn-ref-hl'); }, 2100);
    }
  }

  function goToFnItem(n) {
    var item = document.getElementById('fn-' + n);
    if (!item) return;

    document.querySelectorAll('.fn-item-hl').forEach(function(el) {
      el.classList.remove('fn-item-hl');
    });

    var offset = 200;
    window.scrollTo({ top: window.scrollY + item.getBoundingClientRect().top - offset, behavior: 'smooth' });

    item.classList.remove('fn-item-hl');
    void item.offsetWidth;
    item.classList.add('fn-item-hl');
    setTimeout(function() { item.classList.remove('fn-item-hl'); }, 2300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFootnotes);
  } else {
    buildFootnotes();
  }
})();

/* ===== نظام الهوامش — Popup ===== */
(function () {
  'use strict';
  var popup = null;
  var activeLink = null;

  function getOrCreatePopup() {
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'fn-popup';
      popup.setAttribute('role', 'tooltip');
      document.body.appendChild(popup);
    }
    return popup;
  }

  function showPopup(link) {
    var targetId = (link.getAttribute('href') || '').replace(/^#/, '');
    var fnItem = document.getElementById(targetId);
    if (!fnItem) return;

    var numBadge = fnItem.querySelector('.fn-num-badge');
    var fnText   = fnItem.querySelector('.fn-text');
    if (!fnText) return;

    var p = getOrCreatePopup();

    var numHTML = numBadge
      ? '<span class="fn-popup-num">' + numBadge.textContent.trim() + '</span>'
      : '';
    p.innerHTML = numHTML + fnText.innerHTML;

    /* أزل كلاسات السهم القديمة */
    p.classList.remove('fn-arrow-down', 'fn-arrow-up', 'fn-popup-visible');

    /* اجعله مرئيًا مؤقتًا لقياس أبعاده */
    p.style.visibility = 'hidden';
    p.style.display = 'block';
    p.classList.add('fn-popup-visible');

    var pw  = p.offsetWidth;
    var ph  = p.offsetHeight;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var rect = link.getBoundingClientRect();

    /* موضع أفقي: مركزة على الرابط مع تقييد بالحواف */
    var left = rect.left + rect.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, vw - pw - 8));

    /* موضع رأسي: فوق الرابط إن كان هناك مساحة، وإلا تحته */
    var topAbove = rect.top - ph - 12;
    var topBelow = rect.bottom + 12;
    var top, arrowDir;
    if (topAbove >= 8) {
      top = topAbove; arrowDir = 'fn-arrow-down';
    } else {
      top = topBelow; arrowDir = 'fn-arrow-up';
    }

    p.style.left = left + 'px';
    p.style.top  = top  + 'px';
    p.style.visibility = '';
    p.classList.add(arrowDir);

    activeLink = link;
  }

  function hidePopup() {
    if (popup) popup.classList.remove('fn-popup-visible');
    activeLink = null;
  }

  var hideTimer = null;

  function scheduleHide() {
    hideTimer = setTimeout(hidePopup, 120);
  }
  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  document.addEventListener('mouseover', function (e) {
    var ref = e.target.closest('.fn-ref');
    if (ref) {
      cancelHide();
      var link = ref.querySelector('a');
      if (link) showPopup(link);
      return;
    }
    if (e.target.closest('#fn-popup')) { cancelHide(); return; }
  });

  document.addEventListener('mouseout', function (e) {
    var ref = e.target.closest('.fn-ref');
    if (ref && !ref.contains(e.relatedTarget)) { scheduleHide(); return; }
    var p = e.target.closest('#fn-popup');
    if (p && !p.contains(e.relatedTarget)) { scheduleHide(); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePopup();
  });
})();

function shareInshad(url) {
    var t = document.getElementById('toast');
    function _show() {
        if (t) {
            t.textContent = 'نُسِخ الرابط!';
            t.classList.add('show');
            setTimeout(function(){ t.classList.remove('show'); }, 3000);
        }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(_show).catch(_show);
    } else {
        try {
            var ta = document.createElement('textarea');
            ta.value = url;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        } catch(e) {}
        _show();
    }
}
