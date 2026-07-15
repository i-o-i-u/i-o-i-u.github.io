// ====================================================
// الإعدادات — عدّل ما تشاء هنا
// ====================================================
const SUPABASE_URL  = 'https://eoccraiykkgefxgnoqvb.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_1xUC_60erYhjnL3u294qVg_UZ7rBXto';
const ADMIN_HASH    = 'e8cde359ae5242c5022ba199a0aebbb351bc154acdd79449ee6e71520861ae20';
const ADMIN_NAME    = 'سيف العشيرة';
const ADMIN_BADGE  = 'صاحب الصفحة';
const ANONYMOUS    = 'مجهول';
const PAGE_SLUG    = window.location.pathname.replace(/\//g,'_').replace(/^_|_$/g,'') || 'home';
const LIKED_KEY    = 'liked_' + PAGE_SLUG;
function getLikedSet() { try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY)||'[]')); } catch(e) { return new Set(); } }

const TXT = {
    loading:       'جارٍ تحميل التعليقات...',
    empty:         'كن أوَّلَ مُعلِّق! <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="0.5" fill="currentColor"/><circle cx="12" cy="10" r="0.5" fill="currentColor"/><circle cx="15" cy="10" r="0.5" fill="currentColor"/></svg>',
    loadError:     'تعذّر تحميل التعليقات.',
    sending:       'جارٍ الإرسال...',
    sent:          '✅ نُشر تعليقك!',
    sendError:     '❌ حدث خطأ، حاول مرة أخرى.',
    replyEmpty:    'كيف يكون الردُّ فارغًا؟ إذا أردتَّه فارغًا فلا تَرُدّ!',
    replyError:    'حدث خطأ أثناء إرسال الرد.',
    hideConfirm:   'إذا أخفيتَ تعليقك، فلن يراهُ إلا صاحب الموقع.',
    hideError:     'حدث خطأ أثناء الإخفاء.',
    deleteConfirm: 'سيُحذَف هذا التعليق، تأكَّدْ أنْ تكون مُخطِئًا!',
    deleteError:   'حدث خطأ أثناء الحذف.',
    saveError:     'حدث خطأ أثناء الحفظ.',
    btnReply:      'رد',
    btnEdit:       'تعديل',
    btnHide:       'إخفاء',
    btnDelete:     'حذف',
    btnSend:       'إرسال التعليق',
    btnSendReply:  'إرسال',
    btnSave:       'حفظ',
    btnCancel:     'إلغاء',
    now:           'الآن',
    minutesAgo:    'منذ {n} دقيقة',
    hoursAgo:      'منذ {n} ساعة',
    daysAgo:       'منذ {n} يوم',
};
// ====================================================

async function _fingerprint() {
    const parts = [
        navigator.userAgent || '',
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.hardwareConcurrency || '',
        navigator.language || '',
    ];
    // AudioContext fingerprint
    try {
        const ac = new OfflineAudioContext(1, 44100, 44100);
        const osc = ac.createOscillator();
        const cmp = ac.createDynamicsCompressor();
        osc.connect(cmp); cmp.connect(ac.destination);
        osc.start(0);
        const buf = await new Promise(r => { ac.oncomplete = e => r(e.renderedBuffer); ac.startRendering(); });
        const d = buf.getChannelData(0);
        let s = 0;
        for (let i = 4500; i < 5000; i++) s += Math.abs(d[i] || 0);
        parts.push(s.toFixed(8));
    } catch(e) {}
    // Canvas fingerprint
    try {
        const cv = document.createElement('canvas');
        const cx = cv.getContext('2d');
        cx.textBaseline = 'top';
        cx.font = '14px Arial';
        cx.fillStyle = '#e67e22';
        cx.fillRect(0, 0, 10, 10);
        cx.fillStyle = '#2c3e50';
        cx.fillText('\u0633\u064a\u0641', 2, 2);
        parts.push(cv.toDataURL().slice(-20));
    } catch(e) {}
    return parts.join('|');
}

async function getMyUid() {
    const LS_KEY = '_saif_vid';
    try {
        // إذا حُسب المعرّف من قبل، استخدمه مباشرة (يضمن الثبات حتى لو تغيّرت البصمة لاحقًا)
        const cached = localStorage.getItem(LS_KEY);
        if (cached) return cached;
        // UUID عشوائي
        const arr = new Uint8Array(8);
        crypto.getRandomValues(arr);
        const uuid = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
        // بصمة الجهاز
        const fp = await _fingerprint();
        // دمجهما في معرّف واحد ثابت
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uuid + '|' + fp));
        const uid = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 16);
        localStorage.setItem(LS_KEY, uid);
        return uid;
    } catch(e) {
        // fallback: بصمة الجهاز فقط بلا localStorage
        try {
            const fp = await _fingerprint();
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 16);
        } catch(e2) { return 'anon'; }
    }
}
let MY_UID = '';
let _myLikes = new Set(); // معرّفات التعليقات التي أعجب بها هذا الزائر

let isAdmin = false;
const ADMIN_PW_KEY = '_saif_admin_pw';
function getAdminPw() { return sessionStorage.getItem(ADMIN_PW_KEY) || ''; }

// استدعاء دالة خادومية (RPC) — عمليات الإدارة والتعديل تمرّ كلها من هنا
// فيتحقق الخادوم من كلمة السر أو ملكية التعليق، لا المتصفح
async function sbRpc(fn, args) {
    return sbFetch('rpc/' + fn, { method: 'POST', body: JSON.stringify(args || {}) });
}

async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function initAdmin() {
    const saved = getAdminPw();
    if (saved && await sha256(saved) === ADMIN_HASH) {
        isAdmin = true;
    } else {
        const param = new URLSearchParams(window.location.search).get('admin');
        if (param && await sha256(param) === ADMIN_HASH) {
            isAdmin = true;
            sessionStorage.setItem(ADMIN_PW_KEY, param);
            // نحذف كلمة السر من شريط العنوان دون تحديث الصفحة
            const clean = window.location.pathname + window.location.hash;
            history.replaceState(null, '', clean);
        }
    }
    if (isAdmin) {
        const ni = document.getElementById('authorName');
        if (ni) { ni.value = ADMIN_NAME; ni.readOnly = true; ni.style.opacity = '0.75'; }
    }
    loadComments();
}

function toggleAdminPwVisibility() {
    const input = document.getElementById('adminPwInput');
    const show = document.getElementById('eyeIconShow');
    const hide = document.getElementById('eyeIconHide');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        show.style.display = 'none';
        hide.style.display = '';
    } else {
        input.type = 'password';
        show.style.display = '';
        hide.style.display = 'none';
    }
}

async function submitAdminPw() {
    const input = document.getElementById('adminPwInput');
    const val = (input.value || '').trim();
    if (!val) return;
    const hash = await sha256(val);
    if (hash === ADMIN_HASH) {
        isAdmin = true;
        sessionStorage.setItem(ADMIN_PW_KEY, val);
        document.getElementById('adminLoginWrap').style.display = 'none';
        input.value = '';
        const ni = document.getElementById('authorName');
        if (ni) { ni.value = ADMIN_NAME; ni.readOnly = true; ni.style.opacity = '0.75'; }
        loadComments();
    } else {
        input.style.borderColor = '#ef4444';
        setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
}

(async () => { MY_UID = await getMyUid(); await initAdmin(); })();

async function sbFetch(path, opts = {}) {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
    };
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...opts, headers });
    if (!res.ok && res.status !== 204) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'خطأ');
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}


async function loadComments() {
    const list = document.getElementById('commentsList');
    try {
        // جلب التعليقات وإعجابات الزائر الحالي وعداد كل تعليق — بالتوازي
        const [data, myLikesData, allLikesData] = await Promise.all([
            // المدير يجلب كل التعليقات (بما فيها المخفية) عبر دالة خادومية بكلمة السر
            // أما الزائر فسياسات RLS لا تُرجع له المخفية أصلًا
            isAdmin
                ? sbRpc('admin_list_comments', { pw: getAdminPw(), slug: PAGE_SLUG })
                : sbFetch(`comments?page_slug=eq.${encodeURIComponent(PAGE_SLUG)}&order=created_at.asc&select=*`),
            isAdmin ? Promise.resolve([]) : sbFetch(`likes?visitor_id=eq.${encodeURIComponent(MY_UID)}&select=comment_id`),
            sbFetch(`likes?select=comment_id`)
        ]);
        // معرّفات التعليقات التي أعجب بها هذا الزائر
        _myLikes = new Set((myLikesData || []).map(r => r.comment_id));
        // عدد الإعجابات لكل تعليق (من جدول likes — المصدر الوحيد للحقيقة)
        const likeCounts = {};
        (allLikesData || []).forEach(r => {
            likeCounts[r.comment_id] = (likeCounts[r.comment_id] || 0) + 1;
        });

        const visible = isAdmin ? data : data.filter(c => !c.is_hidden);
        const top = visible.filter(c => !c.parent_id);
        const allReplies = visible.filter(c => c.parent_id);

        const badge = document.getElementById('commentsCount');
        const publicCount = data.filter(c => !c.parent_id && !c.is_hidden).length;
        if (badge) {
            if (publicCount) { badge.textContent = arabicCount(publicCount, 'تعليقٌ واحد', 'تعليقان', 'تعليقات'); badge.style.display = ''; }
            else { badge.style.display = 'none'; }
        }

        if (top.length === 0) { list.innerHTML = `<div class="empty-comments">${TXT.empty}</div>`; return; }
        list.innerHTML = '';
        top.forEach(c => list.appendChild(buildCard(c, allReplies, 0, likeCounts)));
    } catch(e) {
        list.innerHTML = `<div class="empty-comments">${TXT.loadError}</div>`;
    }
}

function buildCard(c, allReplies, depth, likeCounts) {
    const myComment = c.author_uid === MY_UID;
    const isOwner   = c.author_name === ADMIN_NAME;
    const isReply   = depth > 0;
    const hiddenClass = c.is_hidden ? ' comment-hidden' : '';
    const div = document.createElement('div');
    div.className = (isReply ? 'reply-card' : 'comment-card') + hiddenClass;
    div.id = 'comment-' + c.id;

    const initial = (c.author_name || ANONYMOUS)[0];
    const timeStr = relativeTime(c.created_at);
    const badgeHtml  = isOwner ? `<span class="owner-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:0.9"><path d="M5 16L3 6l5.5 4.5L12 3l3.5 7.5L21 6l-2 10H5zm0 2h14v2H5v-2z"/></svg>${ADMIN_BADGE}</span>` : '';
    // نعرض أول ستة أحرف فقط: المعرّف الكامل يثبت ملكية التعليق عند التعديل والحذف فلا يُكشف
    const uidHtml    = !isOwner ? `<span class="comment-uid">#${String(c.author_uid || '').slice(0, 6)}</span>` : '';
    const avClass    = isOwner ? 'comment-avatar admin-av' : 'comment-avatar';
    const hiddenLbl  = c.is_hidden ? `<div class="comment-hidden-label"><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg> مخفي عن الزوار</div>` : '';

    const icoReply  = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>`;
    const icoEdit   = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`;
    const icoHide   = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
    const icoShow   = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    const icoDelete = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;

    // العدد من جدول likes (مصدر الحقيقة) + إعجاب الأدمن إن وُجد
    const likeCount  = (likeCounts ? (likeCounts[c.id] || 0) : 0) + (c.admin_liked ? 1 : 0);
    const userLiked  = isAdmin ? Boolean(c.admin_liked) : _myLikes.has(c.id);
    const toE = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const likeLabel  = likeCount === 0 ? 'إعجاب'
                     : likeCount === 1 ? 'إعْجابٌ واحد'
                     : likeCount === 2 ? 'إعْجابان'
                     : likeCount <= 10 ? toE(likeCount) + ' إعجابات'
                     : toE(likeCount) + ' إعجابًا';
    const icoHeart   = (f) => `<svg width="12" height="12" viewBox="0 0 24 24" fill="${f?'currentColor':'none'}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const adminLikedHtml = c.admin_liked ? `<div class="admin-liked-badge" tabindex="0"><div class="admin-liked-icon"><img src="/icon.svg" alt=""><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><span class="admin-liked-tip">أَعْجَبَ صاحبَ الصفحة</span></div>` : '';

    div.dataset.likes      = likeCount;
    div.dataset.adminLiked = String(Boolean(c.admin_liked));

    const avContent = isOwner
        ? `<img src="/icon.svg" alt="صاحب الموقع">`
        : initial;

    div.innerHTML = `
        <div class="comment-meta">
            <div class="${avClass}">${avContent}</div>
            <span class="comment-author">${escHtml(c.author_name || ANONYMOUS)}</span>
            ${uidHtml}
            ${badgeHtml}
            <span class="comment-time">${timeStr}</span>
        </div>
        ${hiddenLbl}
        <div class="comment-body" id="body-${c.id}" style="white-space:pre-wrap">${escHtml(c.body)}</div>
        ${adminLikedHtml}
        <div class="comment-actions">
            <button class="btn-action btn-like${userLiked?' liked':''}" onclick="likeComment('${c.id}')">${icoHeart(userLiked)} ${likeLabel}</button>
            ${depth < 2 ? `<button class="btn-action btn-reply" onclick="toggleReplyForm('${c.id}')">${icoReply} ${TXT.btnReply}</button>` : ''}
            ${myComment ? `<button class="btn-action btn-edit-c" onclick="toggleEdit('${c.id}',\`${escJs(c.body)}\`)">${icoEdit} ${TXT.btnEdit}</button>` : ''}
            ${(myComment || isAdmin) && !c.is_hidden ? `<button class="btn-action btn-hide" onclick="hideComment('${c.id}')">${icoHide} ${TXT.btnHide}</button>` : ''}
            ${isAdmin && c.is_hidden ? `<button class="btn-action btn-unhide" onclick="unhideComment('${c.id}')">${icoShow} إظهار</button>` : ''}
            ${(myComment || isAdmin) ? `<button class="btn-action btn-delete" onclick="deleteComment('${c.id}')">${icoDelete} ${TXT.btnDelete}</button>` : ''}
        </div>
        <div id="edit-form-${c.id}"></div>
        <div id="reply-form-${c.id}"></div>
    `;

    // الردود المباشرة — يعرضها حتى المستوى الثالث (depth 0 و 1)
    if (depth < 2) {
        const directReplies = allReplies.filter(r => r.parent_id === c.id);
        if (directReplies.length > 0) {
            const rd = document.createElement('div');
            rd.className = 'replies-container';
            directReplies.forEach(r => rd.appendChild(buildCard(r, allReplies, depth + 1, likeCounts)));
            div.appendChild(rd);
        }
    }
    return div;
}

function toggleReplyForm(commentId) {
    const container = document.getElementById('reply-form-' + commentId);
    if (container.innerHTML) { container.innerHTML = ''; return; }
    const defName = isAdmin ? ADMIN_NAME : '';
    const roAttr  = isAdmin ? 'readonly style="opacity:0.75"' : '';
    container.innerHTML = `
        <div class="reply-form-wrap">
            <input type="text" id="rn-${commentId}" placeholder="اسمك (اختياري)" maxlength="50" value="${defName}" ${roAttr}>
            <input type="text" id="rb-${commentId}" placeholder="اكتب ردك..." maxlength="500">
            <button class="btn-send-reply" onclick="submitReply('${commentId}')">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                ${TXT.btnSendReply}
            </button>
        </div>
    `;
    document.getElementById('rb-' + commentId).focus();
}

async function submitReply(commentId) {
    const name = document.getElementById('rn-' + commentId).value.trim();
    const body = document.getElementById('rb-' + commentId).value.trim();
    if (!body) { alert(TXT.replyEmpty); return; }
    if (!isAdmin && name === ADMIN_NAME) { alert('هذا الاسم محجوز لصاحب الموقع.'); return; }
    try {
        if (isAdmin) {
            await sbRpc('admin_add_comment', { pw: getAdminPw(), slug: PAGE_SLUG, uid: MY_UID, body, parent: String(commentId) });
        } else {
            await sbFetch('comments', {
                method: 'POST', headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify({ page_slug: PAGE_SLUG, author_name: name || ANONYMOUS, author_uid: MY_UID, body, parent_id: commentId })
            });
        }
        document.getElementById('reply-form-' + commentId).innerHTML = '';
        await loadComments();
    } catch(e) { alert(TXT.replyError); }
}

function toggleEdit(id, cur) {
    const con = document.getElementById('edit-form-' + id);
    const bod = document.getElementById('body-' + id);
    if (con.innerHTML) { con.innerHTML = ''; bod.style.display = ''; return; }
    bod.style.display = 'none';
    const icoSave   = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
    const icoCancel = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
    con.innerHTML = `
        <div class="edit-wrap">
            <textarea id="et-${id}">${escHtml(cur)}</textarea>
            <div class="edit-actions">
                <button class="btn-cancel" onclick="toggleEdit('${id}','')">${icoCancel} ${TXT.btnCancel}</button>
                <button class="btn-save" onclick="saveEdit('${id}')">${icoSave} ${TXT.btnSave}</button>
            </div>
        </div>
    `;
}

async function saveEdit(id) {
    const v = document.getElementById('et-' + id).value.trim();
    if (!v) return;
    try {
        await sbRpc('visitor_edit_comment', { cid: String(id), uid: MY_UID, new_body: v });
        await loadComments();
    } catch(e) { alert(TXT.saveError); }
}

async function hideComment(id) {
    if (!confirm(TXT.hideConfirm)) return;
    try {
        if (isAdmin) await sbRpc('admin_moderate', { pw: getAdminPw(), cid: String(id), action: 'hide' });
        else         await sbRpc('visitor_hide_comment', { cid: String(id), uid: MY_UID });
        await loadComments();
    } catch(e) { alert(TXT.hideError + ': ' + e.message); }
}

async function unhideComment(id) {
    try {
        await sbRpc('admin_moderate', { pw: getAdminPw(), cid: String(id), action: 'unhide' });
        await loadComments();
    } catch(e) { alert('حدث خطأ أثناء الإظهار.'); }
}

async function deleteComment(id) {
    if (!confirm(TXT.deleteConfirm)) return;
    try {
        if (isAdmin) await sbRpc('admin_moderate', { pw: getAdminPw(), cid: String(id), action: 'delete' });
        else         await sbRpc('visitor_delete_comment', { cid: String(id), uid: MY_UID });
        await loadComments();
    } catch(e) { alert(TXT.deleteError); }
}

async function likeComment(id) {
    const card = document.getElementById('comment-' + id);
    if (!card) return;
    if (isAdmin) {
        try {
            await sbRpc('admin_moderate', { pw: getAdminPw(), cid: String(id), action: 'like_toggle' });
            await loadComments();
        } catch(e) { alert('حدث خطأ.'); }
        return;
    }
    const wasLiked = _myLikes.has(id);
    try {
        if (wasLiked) {
            await sbFetch(`likes?comment_id=eq.${id}&visitor_id=eq.${encodeURIComponent(MY_UID)}`, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
        } else {
            await sbFetch(`likes`, { method: 'POST', headers: { 'Prefer': 'return=minimal,resolution=ignore-duplicates' }, body: JSON.stringify({ comment_id: id, visitor_id: MY_UID }) });
        }
        await loadComments();
    } catch(e) { alert('حدث خطأ.'); }
}

document.getElementById('commentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('authorName').value.trim();
    const body = document.getElementById('commentBody').value.trim();
    const btn  = document.getElementById('submitBtn');
    const lbl  = document.getElementById('submitLabel');
    const msg  = document.getElementById('formMsg');
    if (!body) return;
    if (!isAdmin && name === ADMIN_NAME) {
        msg.textContent = 'هذا الاسم محجوز لصاحب الموقع.';
        msg.className = 'form-msg error';
        setTimeout(() => { msg.className = 'form-msg hidden'; }, 3500);
        return;
    }
    btn.disabled = true; lbl.textContent = TXT.sending;
    msg.className = 'form-msg hidden';
    try {
        if (isAdmin) {
            await sbRpc('admin_add_comment', { pw: getAdminPw(), slug: PAGE_SLUG, uid: MY_UID, body, parent: null });
        } else {
            await sbFetch('comments', {
                method: 'POST', headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify({ page_slug: PAGE_SLUG, author_name: name || ANONYMOUS, author_uid: MY_UID, body })
            });
        }
        document.getElementById('commentBody').value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('submitBtn').classList.add('btn-dim');
        msg.textContent = TXT.sent; msg.className = 'form-msg success';
        setTimeout(() => { msg.className = 'form-msg hidden'; }, 3500);
        await loadComments();
    } catch(e) {
        msg.textContent = TXT.sendError; msg.className = 'form-msg error';
    } finally {
        btn.disabled = false; lbl.textContent = TXT.btnSend;
    }
});

function togglePrivacy(e) {
    e.stopPropagation();
    const popup = document.getElementById('privacyPopup');
    if (!popup) return;
    const opening = !popup.classList.contains('open');
    popup.classList.toggle('open', opening);
    if (opening) {
        const close = function(ev) {
            if (!ev.target.closest('.privacy-wrap')) {
                popup.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}

// Triple-click on comments icon → show admin login form
(function() {
    let _tapCount = 0, _tapTimer = null;
    function onTap() {
        _tapCount++;
        if (_tapTimer) clearTimeout(_tapTimer);
        if (_tapCount >= 3) {
            _tapCount = 0;
            if (!isAdmin) {
                const wrap = document.getElementById('adminLoginWrap');
                if (wrap) {
                    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
                    if (wrap.style.display === 'block') {
                        document.getElementById('adminPwInput').focus();
                    }
                }
            }
        } else {
            _tapTimer = setTimeout(() => { _tapCount = 0; }, 600);
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        const icon = document.getElementById('commentsHeaderIcon');
        if (icon) { icon.addEventListener('click', onTap); icon.style.cursor = 'pointer'; }
        const input = document.getElementById('adminPwInput');
        if (input) { input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitAdminPw(); }); }
    });
})();

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escJs(s)   { return String(s||'').replace(/`/g,'\\`').replace(/\$/g,'\\$'); }
function arabicCount(n, one, two, few, many) {
    // one = نص المفرد (1)، two = نص المثنى (2)، few = جمع القلة (3-10)، many = جمع الكثرة (11+)
    // إذا لم يُمرَّر many فنستخدم one لـ 11+
    if (!many) many = one;
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return `${n} ${few}`;
    return `${n} ${many}`;
}
function relativeTime(iso) {
    const date = new Date(iso);
    const d = Math.floor((Date.now() - date) / 1000);

    const HIJRI_MONTHS = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
    const WEEKDAYS = {Sunday:'الأحد',Monday:'الاثنين',Tuesday:'الثلاثاء',Wednesday:'الأربعاء',Thursday:'الخميس',Friday:'الجمعة',Saturday:'السبت'};

    const toWestern = s => String(s).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660);

    const p = Object.fromEntries(
        new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            weekday:'long', day:'numeric', month:'numeric', year:'numeric',
            hour:'2-digit', minute:'2-digit', hour12:true
        }).formatToParts(date).map(({type,value}) => [type,value])
    );

    const hMonth   = parseInt(toWestern(p.month));
    const hAmPm    = date.getHours() < 12 ? 'صباحًا' : 'مساءًا';
    const fullDate = `${p.year} هـ / ${p.month} (${HIJRI_MONTHS[hMonth-1]}) / ${p.day} (${WEEKDAYS[p.weekday]||p.weekday}) — ${p.hour}:${p.minute} ${hAmPm}`;

let relative = '';
    const mins  = Math.floor(d/60);
    const hours = Math.floor(d/3600);
    const dys   = Math.floor(d/86400);
    if (d < 60)          relative = 'الآن';
    else if (d < 3600)   relative = 'منذ ' + arabicCount(mins,  'دقيقة واحدة',  'دقيقتين',  'دقائق',  'دقيقة');
    else if (d < 86400)  relative = 'منذ ' + arabicCount(hours, 'ساعة واحدة',   'ساعتين',   'ساعات',  'ساعة');
    else if (d < 604800) relative = 'منذ ' + arabicCount(dys,  'يوم واحد',     'يومين',    'أيام',   'يوم');

    return relative ? `${fullDate} &nbsp;·&nbsp; ${relative}` : fullDate;
}

// ===== Floating buttons scroll logic =====
(function() {
    const actions = document.getElementById('floatingActions');
    if (!actions) return;
    const THRESHOLD = 200;
    function onScroll() {
        if (window.scrollY > THRESHOLD) {
            actions.style.display = 'flex';
            requestAnimationFrame(() => actions.classList.add('visible'));
        } else {
            actions.classList.remove('visible');
            setTimeout(() => { if (window.scrollY <= THRESHOLD) actions.style.display = 'none'; }, 350);
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
})();

function copyContent() {
  const article = document.getElementById('articleContent');
  if (!article) return;

  const text = article.innerText
    .replace(/ـ/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'نُسِخ النص!';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }).catch(err => console.warn('فشل النسخ:', err));
}
function shareContent() {
    const title = (document.querySelector('h2 .gradient-text') || document.querySelector('h2.gradient-text')).innerText;
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title, url }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const toast = document.getElementById('toast');
            if (toast) { toast.textContent = 'نُسِخ الرابط!'; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),3000); }
        }).catch(err => console.warn('فشل النسخ:', err));
    }
}
