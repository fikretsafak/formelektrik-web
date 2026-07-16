/* ============================================
   FORM ELEKTRIK ADMIN — vanilla JS SPA
   ============================================ */

// Tema: paint öncesi uygula (FOUC önlemi)
(() => {
  const stored = localStorage.getItem('e1-theme');
  document.documentElement.setAttribute('data-theme', stored || 'dark');
})();

function setupTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('e1-theme', next);
  });
}

// ===== i18n (panel arayüzü) =====
const I18N = {
  tr: {
    'navgroup.content': 'İçerik Yönetimi', 'navgroup.library': 'Teknik Kütüphane', 'navgroup.requests': 'Talepler & Randevu', 'navgroup.hr': 'İnsan Kaynakları', 'navgroup.legal': 'Yasal & Uyumluluk', 'navgroup.system': 'Sistem',
    'nav.dashboard': 'Genel Bakış', 'nav.leads': 'İletişim Talepleri', 'nav.posts': 'Blog Yazıları', 'nav.announcements': 'Duyurular',
    'nav.services': 'Hizmetler', 'nav.projects': 'Referans Projeler', 'nav.brands': 'Markalar', 'nav.references': 'Referans Logoları', 'nav.milestones': 'Kilometre Taşları',
    'nav.users': 'Kullanıcılar', 'nav.appointments': 'Randevular', 'nav.apptTopics': 'Randevu Konuları', 'nav.appointment-topics': 'Randevu Konuları', 'nav.careers': 'Kariyer / İlanlar', 'nav.applications': 'Başvurular', 'nav.job-applications': 'Başvurular',
    'nav.kvkk': 'KVKK Aydınlatma Metni', 'nav.kvkk-politikasi': 'Genel KVKK Politikası', 'nav.basvuru-formu': 'Başvuru Formu', 'nav.calisan-adayi': 'Çalışan Adayı Metni', 'nav.imha-politikasi': 'İmha Politikası',
    'nav.library': 'TK Belgeleri', 'nav.libraryUsers': 'TK Başvuruları & Erişim', 'nav.library-users': 'TK Başvuruları & Erişim',
    'nav.cerez': 'Çerez Politikası', 'nav.warranty': 'Garanti Ayarları', 'nav.warranty-logs': 'Garanti Sorguları', 'nav.settings': 'Ayarlar', 'nav.profile': 'Profilim', 'nav.logout': 'Çıkış',
  },
  en: {
    'navgroup.content': 'Content', 'navgroup.library': 'Technical Library', 'navgroup.requests': 'Requests & Appointments', 'navgroup.hr': 'Human Resources', 'navgroup.legal': 'Legal & Compliance', 'navgroup.system': 'System',
    'nav.dashboard': 'Overview', 'nav.leads': 'Contact Requests', 'nav.posts': 'Blog Posts', 'nav.announcements': 'Announcements',
    'nav.services': 'Services', 'nav.projects': 'References', 'nav.brands': 'Brands', 'nav.references': 'Reference Logos', 'nav.milestones': 'Milestones',
    'nav.users': 'Users', 'nav.appointments': 'Appointments', 'nav.apptTopics': 'Appointment Topics', 'nav.appointment-topics': 'Appointment Topics', 'nav.careers': 'Careers / Jobs', 'nav.applications': 'Applications', 'nav.job-applications': 'Applications',
    'nav.kvkk': 'Privacy Notice', 'nav.kvkk-politikasi': 'General PDPL Policy', 'nav.basvuru-formu': 'Application Form', 'nav.calisan-adayi': 'Candidate Notice', 'nav.imha-politikasi': 'Retention & Destruction',
    'nav.library': 'TL Documents', 'nav.libraryUsers': 'TL Applications & Access', 'nav.library-users': 'TL Applications & Access',
    'nav.cerez': 'Cookie Policy', 'nav.warranty': 'Warranty Settings', 'nav.warranty-logs': 'Warranty Queries', 'nav.settings': 'Settings', 'nav.profile': 'My Profile', 'nav.logout': 'Log Out',
  },
};
function currentLang() { return localStorage.getItem('e1-lang') || 'tr'; }
function t(key) { const d = I18N[currentLang()] || I18N.tr; return d[key] || I18N.tr[key] || key; }
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.getAttribute('data-i18n'));
    if (v) el.textContent = v;
  });
}
function setupLangSwitcher() {
  const root = document.documentElement;
  root.setAttribute('lang', currentLang());
  applyI18n();
  const wrap = document.getElementById('langSwitch');
  const current = document.getElementById('langCurrent');
  if (!wrap || !current) return;
  current.addEventListener('click', e => { e.stopPropagation(); wrap.classList.toggle('is-open'); });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) wrap.classList.remove('is-open'); });
  wrap.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('e1-lang', btn.dataset.lang);
      location.reload();
    });
  });
}

const api = (() => {
  function token() { return localStorage.getItem('e1-token') || sessionStorage.getItem('e1-token'); }
  async function req(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const t = token();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(path, { ...opts, headers, credentials: 'include' });
    if (res.status === 401) {
      localStorage.removeItem('e1-token'); localStorage.removeItem('e1-user');
      sessionStorage.removeItem('e1-token'); sessionStorage.removeItem('e1-user');
      location.href = '/login.html'; throw new Error('unauthorized');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
  return {
    get: p => req(p),
    post: (p, body) => req(p, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (p, body) => req(p, { method: 'PUT', body: JSON.stringify(body || {}) }),
    patch: (p, body) => req(p, { method: 'PATCH', body: JSON.stringify(body || {}) }),
    del: p => req(p, { method: 'DELETE' }),
  };
})();

// ===== Label map (i18n-ready) =====
const LABELS = {
  // lead status
  new: 'Yeni', contacted: 'İletişime Geçildi', qualified: 'Nitelikli', won: 'Kazanıldı', lost: 'Kaybedildi',
  // post/service/project/brand status
  draft: '📝 Taslak', published: '✓ Yayında',
  // user role
  admin: 'Yönetici', customer: 'Müşteri',
  // appointment
  pending: '⏳ Bekliyor', confirmed: '✓ Onaylandı', completed: '✓ Tamamlandı', cancelled: '✗ İptal',
};
function label(v) { return LABELS[v] || v; }

// ===== Markdown desteği =====
// İçerik HTML mi? (etiket içeriyorsa HTML kabul et)
function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(s || '');
}

// Hafif Markdown -> HTML çevirici (bağımlılıksız, temel sözdizimi)
function markdownToHtml(md) {
  if (!md) return '';
  if (looksLikeHtml(md)) return md; // zaten HTML

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inUl = false, inOl = false, inCode = false, codeBuf = [];

  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const inline = t => esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) { out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
      else { closeLists(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    const h = line.match(/^(#{1,5})\s+(.*)$/);
    if (h) { closeLists(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }

    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inUl) { closeLists(); out.push('<ul>'); inUl = true; }
      out.push('<li>' + inline(line.replace(/^\s*[-*+]\s+/, '')) + '</li>');
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); out.push('<ol>'); inOl = true; }
      out.push('<li>' + inline(line.replace(/^\s*\d+\.\s+/, '')) + '</li>');
      continue;
    }
    if (/^\s*>\s?/.test(line)) { closeLists(); out.push('<blockquote>' + inline(line.replace(/^\s*>\s?/, '')) + '</blockquote>'); continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { closeLists(); out.push('<hr />'); continue; }
    if (line.trim() === '') { closeLists(); continue; }
    closeLists();
    out.push('<p>' + inline(line) + '</p>');
  }
  closeLists();
  if (inCode) out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
  return out.join('\n');
}

// ===== Rich editor (TinyMCE) helper =====
function mountEditor(selector, initialValue = '') {
  if (typeof tinymce === 'undefined') {
    console.warn('TinyMCE yüklenmedi, fallback textarea kullanılıyor');
    return null;
  }
  // Önce bu seçicide var olan instance varsa temizle
  tinymce.remove(selector);
  return tinymce.init({
    selector,
    license_key: 'gpl',
    base_url: '/public/vendor/tinymce',
    suffix: '.min',
    skin: 'oxide-dark',
    content_css: 'dark',
    height: 560,
    menubar: 'edit insert format table tools',
    menu: {
      edit: { title: 'Düzenle', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
      insert: { title: 'Ekle', items: 'image link media embedIframe codesample inserttable | hr' },
      format: { title: 'Biçim', items: 'bold italic underline strikethrough superscript subscript | formats blockformats fontfamily fontsize align lineheight | forecolor backcolor | removeformat' },
      table: { title: 'Tablo', items: 'inserttable | cell row column | tableprops deletetable' },
      tools: { title: 'Araçlar', items: 'code wordcount fullscreen preview' },
    },
    branding: false,
    promotion: false,
    statusbar: true,
    plugins: 'lists advlist link image table code codesample autolink searchreplace fullscreen media preview wordcount hr nonbreaking visualblocks charmap emoticons',
    toolbar:
      'undo redo | blocks fontfamily fontsize | ' +
      'bold italic underline strikethrough forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media embedIframe table codesample blockquote hr | ' +
      'removeformat charmap emoticons | searchreplace visualblocks code fullscreen preview',
    toolbar_mode: 'sliding',
    font_family_formats:
      'Inter=Inter,system-ui,sans-serif; Space Grotesk=Space Grotesk,sans-serif; ' +
      'Sistem=system-ui,sans-serif; Arial=arial,helvetica,sans-serif; ' +
      'Georgia=georgia,serif; Times=times new roman,serif; Monospace=monospace',
    font_size_formats: '12px 14px 16px 18px 20px 24px 28px 32px 40px',
    block_formats:
      'Paragraf=p; Başlık 1=h1; Başlık 2=h2; Başlık 3=h3; Başlık 4=h4; Başlık 5=h5; Alıntı=blockquote; Kod=pre',
    // iframe + media etiketlerinin kaydederken korunması için
    extended_valid_elements:
      'iframe[src|width|height|name|align|frameborder|allow|allowfullscreen|loading|title|class|style|referrerpolicy],' +
      'video[*],source[*],figure[class],figcaption',
    media_live_embeds: true,
    media_alt_source: false,
    media_poster: false,
    image_caption: true,
    image_advtab: true,
    paste_data_images: true,
    automatic_uploads: true,
    file_picker_types: 'image',
    images_upload_handler: async (blobInfo) => {
      const fd = new FormData();
      fd.append('file', blobInfo.blob(), blobInfo.filename());
      const token = localStorage.getItem('e1-token') || sessionStorage.getItem('e1-token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/uploads', { method: 'POST', headers, body: fd, credentials: 'include' });
      if (!res.ok) throw new Error('Görsel yüklenemedi');
      const data = await res.json();
      return data.url;
    },
    setup: editor => {
      editor.on('init', () => {
        editor.setContent(initialValue || '');
      });
      // iframe / embed ekleme butonu (YouTube, harita, gömülü içerik)
      editor.ui.registry.addButton('embedIframe', {
        icon: 'embed',
        tooltip: 'iframe / Gömülü içerik ekle',
        onAction: () => {
          editor.windowManager.open({
            title: 'iframe / Gömülü İçerik Ekle',
            body: {
              type: 'panel',
              items: [
                { type: 'input', name: 'src', label: 'URL (https://...)' },
                { type: 'input', name: 'width', label: 'Genişlik (örn. 100% veya 640)' },
                { type: 'input', name: 'height', label: 'Yükseklik (px, örn. 400)' },
              ],
            },
            initialData: { src: '', width: '100%', height: '400' },
            buttons: [
              { type: 'cancel', text: 'Vazgeç' },
              { type: 'submit', text: 'Ekle', primary: true },
            ],
            onSubmit: (dialog) => {
              const d = dialog.getData();
              const src = (d.src || '').trim();
              if (src) {
                const w = (d.width || '100%').trim();
                const h = (d.height || '400').trim();
                const html =
                  `<iframe src="${src}" width="${w}" height="${h}" ` +
                  `frameborder="0" allowfullscreen loading="lazy" ` +
                  `style="max-width:100%;border-radius:8px;border:1px solid rgba(255,255,255,0.1)"></iframe>`;
                editor.insertContent(html);
              }
              dialog.close();
            },
          });
        },
      });
    },
    content_style: `
      body { background: #0a0e1a; color: #e8ecf5; font-family: 'Inter', system-ui, sans-serif; padding: 16px; }
      h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; color: #fff; }
      a { color: #00d4ff; }
      img { max-width: 100%; height: auto; border-radius: 6px; }
      blockquote { border-left: 3px solid #00d4ff; padding-left: 14px; color: #a0a8c0; margin: 16px 0; }
      pre { background: #05070d; padding: 14px; border-radius: 6px; overflow-x: auto; }
      code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; }
    `,
  });
}

function destroyEditor(selector) {
  if (typeof tinymce !== 'undefined') {
    tinymce.remove(selector);
  }
}

function getEditorContent(selector) {
  if (typeof tinymce !== 'undefined') {
    const ed = tinymce.get(selector.replace(/^#/, ''));
    if (ed) return ed.getContent();
  }
  const el = document.querySelector(selector);
  return el ? el.value : '';
}

// ===== Utilities =====
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') el.className = attrs[k];
    else if (k === 'html') el.innerHTML = attrs[k];
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null) el.setAttribute(k, attrs[k]);
  }
  children.flat().forEach(c => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function toast(message, type = '') {
  const el = h('div', { class: 'toast ' + (type ? `is-${type}` : '') }, message);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
function confirmDialog(message) {
  return new Promise(resolve => {
    const overlay = h('div', { class: 'modal-overlay' });
    const box = h('div', { class: 'modal-box', style: 'max-width:420px;text-align:center;padding:32px;' });
    box.appendChild(h('h2', {}, 'Emin misiniz?'));
    box.appendChild(h('p', { style: 'color:var(--text-muted);margin-bottom:24px;' }, message));
    const cancel = h('button', { class: 'btn btn-ghost' }, 'Vazgeç');
    const confirm = h('button', { class: 'btn btn-danger' }, 'Sil');
    const actions = h('div', { class: 'modal-actions', style: 'justify-content:center' }, cancel, confirm);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    cancel.onclick = () => { overlay.remove(); resolve(false); };
    confirm.onclick = () => { overlay.remove(); resolve(true); };
  });
}
function openModal(title, content, opts = {}) {
  const overlay = h('div', { class: 'modal-overlay' });
  const box = h('div', { class: 'modal-box' });
  if (opts.width) box.style.maxWidth = opts.width;
  box.appendChild(h('h2', {}, title));
  box.appendChild(content);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

// ===== App bootstrap =====
// Sayfa başlıkları menü çevirileriyle aynı (dile göre)
const PAGE_TITLES = new Proxy({}, {
  get: (_, route) => t('nav.' + String(route)),
});

const routes = {};
let currentRoute = null;

// Yetkilendirme: null = tam yetki (süper admin); array = sadece o bölümler.
// 'dashboard' ve 'profile' her zaman erişilebilir.
let userPermissions = null;
const ALWAYS_ALLOWED = ['dashboard', 'profile'];
function canAccessSection(route) {
  if (userPermissions === null) return true;          // süper admin
  if (ALWAYS_ALLOWED.includes(route)) return true;
  return userPermissions.includes(route);
}

// Menü gruplarını açılıp daralan hale getir; durum localStorage'da saklanır.
function setupCollapsibleNav() {
  const COLLAPSE_KEY = 'fe-admin-nav-collapsed';
  let collapsed = [];
  try { collapsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]'); } catch { collapsed = []; }

  document.querySelectorAll('.nav-group').forEach((group, i) => {
    const title = group.querySelector('.nav-group-title');
    if (!title) return;
    // Grup kimliği: başlığın data-i18n'i (kalıcı, sıradan bağımsız)
    const key = title.querySelector('[data-i18n]')?.getAttribute('data-i18n') || ('group-' + i);

    // Başlıktan sonraki linkleri tek bir kaba sar (yoksa)
    let items = group.querySelector('.nav-group-items');
    if (!items) {
      items = document.createElement('div');
      items.className = 'nav-group-items';
      const links = [...group.querySelectorAll('.side-link')];
      links.forEach(l => items.appendChild(l));
      group.appendChild(items);
    }

    if (collapsed.includes(key)) { group.classList.add('collapsed'); title.setAttribute('aria-expanded', 'false'); }

    title.addEventListener('click', () => {
      const nowCollapsed = group.classList.toggle('collapsed');
      title.setAttribute('aria-expanded', String(!nowCollapsed));
      // Sakla
      try {
        const set = new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]'));
        if (nowCollapsed) set.add(key); else set.delete(key);
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...set]));
      } catch { /* sessiz */ }
    });
  });
}

async function init() {
  // Auth check
  let me;
  try {
    const r = await api.get('/api/auth/me');
    me = r.user;
  } catch { location.href = '/login.html'; return; }
  if (me.role !== 'admin') { location.href = '/account/'; return; }

  // Auth doğrulandı — paneli görünür yap (login flash'ı önlemek için başta gizliydi)
  const shell = document.getElementById('appShell');
  if (shell) shell.style.visibility = '';

  // Global me referansı (şifre değişince banner'ı temizleyebilmek için)
  window.__me = me;

  // permissions: null = tam yetki, array = kısıtlı
  userPermissions = Array.isArray(me.permissions) ? me.permissions : null;

  setupTheme();
  setupLangSwitcher();

  // İzinsiz nav linklerini gizle
  document.querySelectorAll('.side-link').forEach(link => {
    if (!canAccessSection(link.dataset.route)) link.style.display = 'none';
  });
  // Tüm linkleri gizlenen menü gruplarının başlığını da gizle (boş grup kalmasın)
  document.querySelectorAll('.nav-group').forEach(group => {
    const anyVisible = [...group.querySelectorAll('.side-link')].some(l => l.style.display !== 'none');
    if (!anyVisible) group.hidden = true;
  });
  setupCollapsibleNav();

  renderWhoBlock(me);
  document.getElementById('logoutBtn').onclick = async () => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('e1-token');
    localStorage.removeItem('e1-user');
    sessionStorage.removeItem('e1-token');
    sessionStorage.removeItem('e1-user');
    location.href = '/login.html';
  };
  document.getElementById('sidebarToggle').onclick = () => {
    document.getElementById('sidebar').classList.toggle('is-open');
  };

  document.querySelectorAll('.side-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      // Hash'i route'a sıfırla (query param'lı sayfadan, ör. #/posts?edit=1, çıkışta
      // navigate'in location.hash'i fullHash sanıp erken dönmesini engeller).
      const target = '#/' + link.dataset.route;
      if (location.hash === target) {
        navigate(link.dataset.route); // aynı hash → manuel tetikle
      } else {
        location.hash = target;        // hashchange → navigate akışı
      }
    });
  });

  window.addEventListener('hashchange', () => navigate(currentHash()));
  // İlk girişte şifre değiştirmesi zorunlu kullanıcıyı profile yönlendir
  if (me.must_change_password) {
    if (location.hash !== '#/profile') {
      location.hash = '#/profile';
      // hashchange event'i navigate'i tetikleyecek
    } else {
      navigate('profile');
    }
    toast('Devam etmeden önce lütfen şifrenizi değiştirin.', 'error');
  } else {
    navigate(currentHash() || 'dashboard');
  }
}

function currentHash() {
  return location.hash.replace(/^#\//, '').split('?')[0] || '';
}

let navigatingTo = null;
let lastRenderedHash = null;

function navigate(route) {
  if (!route || !routes[route]) route = 'dashboard';

  // Şifre değişimi zorunlu → sadece profil sayfasına erişim
  if (window.__me && window.__me.must_change_password && route !== 'profile') {
    if (location.hash !== '#/profile') location.hash = '#/profile';
    return;
  }

  // Yetki kontrolü: izinsiz bölüme erişim engellenir
  if (!canAccessSection(route)) {
    const page = document.getElementById('page');
    document.querySelectorAll('.side-link').forEach(l => l.classList.remove('is-active'));
    document.getElementById('pageTitle').textContent = '';
    if (page) page.innerHTML = `<div class="empty"><span class="material-symbols-rounded">lock</span><br>Bu sayfaya erişim yetkiniz yok.</div>`;
    return;
  }

  // Tam hash (query param dahil) — ?new=1 / ?edit=5 değişimlerini de yakala
  const fullHash = location.hash || ('#/' + route);

  // Aynı hash'e render zaten devam ediyorsa (async race) ikinci çağrıyı yok say
  if (navigatingTo === fullHash) return;

  // Aynı hash zaten render edilmişse tekrar etme (yalnız sidebar/title güncelle)
  if (lastRenderedHash === fullHash && document.getElementById('page').childElementCount > 0
      && !document.getElementById('page').querySelector('.loader')) {
    document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('is-active', l.dataset.route === route));
    document.getElementById('pageTitle').textContent = PAGE_TITLES[route] || '';
    return;
  }

  currentRoute = route;
  navigatingTo = fullHash;
  lastRenderedHash = fullHash;
  document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('is-active', l.dataset.route === route));
  document.getElementById('pageTitle').textContent = PAGE_TITLES[route] || '';
  const slot = document.getElementById('topbarSlot');
  if (slot) slot.innerHTML = '';
  const page = document.getElementById('page');
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  Promise.resolve(routes[route](page))
    .catch(err => {
      page.innerHTML = `<div class="empty"><span class="material-symbols-rounded">error</span><br>Bir hata oluştu: ${escapeHtml(err.message)}</div>`;
    })
    .finally(() => { if (navigatingTo === fullHash) navigatingTo = null; });
  if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('is-open');
}

// ============================================
// DASHBOARD
// ============================================
routes.dashboard = async (page) => {
  const [leadsRes, postsRes, servicesRes, projectsRes] = await Promise.all([
    api.get('/api/leads?limit=5'),
    api.get('/api/posts/admin/all'),
    api.get('/api/services/admin/all'),
    api.get('/api/projects/admin/all'),
  ]);
  const stats = [
    { icon: 'contact_mail', label: 'Teklif talebi', value: leadsRes.leads.length, color: '#00d4ff' },
    { icon: 'article', label: 'Blog yazısı', value: postsRes.posts.length, color: '#7DBA3F' },
    { icon: 'design_services', label: 'Hizmet', value: (servicesRes.services || []).length, color: '#f4b400' },
    { icon: 'apartment', label: 'Referans proje', value: (projectsRes.projects || []).length, color: '#8B5CF6' },
  ];

  page.innerHTML = '';
  const grid = h('div', { class: 'stat-grid' });
  stats.forEach(s => grid.appendChild(
    h('div', { class: 'stat-card' },
      h('div', { class: 'stat-icon', style: `background:${s.color}20;color:${s.color}` },
        h('span', { class: 'material-symbols-rounded' }, s.icon)
      ),
      h('div', {},
        h('div', { class: 'stat-value' }, String(s.value)),
        h('div', { class: 'stat-label' }, s.label),
      ),
    )
  ));
  page.appendChild(grid);

  // Recent leads
  const recentCard = h('div', { class: 'card' });
  recentCard.appendChild(h('div', { class: 'card-head' }, h('h2', {}, 'Son İletişim Talepleri')));
  if (leadsRes.leads.length === 0) {
    recentCard.appendChild(h('div', { class: 'empty' },
      h('span', { class: 'material-symbols-rounded' }, 'inbox'),
      h('p', {}, 'Henüz talep yok.')));
  } else {
    const table = h('table', { class: 'table' });
    table.innerHTML = `<thead><tr><th>Ad</th><th>E-posta</th><th>Şirket</th><th>Ürünler</th><th>Durum</th><th>Tarih</th></tr></thead>`;
    const tbody = h('tbody');
    leadsRes.leads.slice(0, 5).forEach(l => {
      tbody.innerHTML += `<tr>
        <td>${escapeHtml(l.first_name)} ${escapeHtml(l.last_name)}</td>
        <td>${escapeHtml(l.email)}</td>
        <td>${escapeHtml(l.company || '-')}</td>
        <td>${(l.products || []).join(', ')}</td>
        <td><span class="badge badge-${l.status}">${label(l.status)}</span></td>
        <td>${fmtDate(l.created_at)}</td>
      </tr>`;
    });
    table.appendChild(tbody);
    recentCard.appendChild(table);
  }
  page.appendChild(recentCard);
};

// ============================================
// LEADS
// ============================================
routes.leads = async (page) => {
  page.innerHTML = '';
  const search = h('input', { type: 'search', placeholder: 'Ara: ad, email, şirket...' });
  const statusSel = h('select', {},
    h('option', { value: '' }, 'Tüm durumlar'),
    ...['new','contacted','qualified','won','lost'].map(s => h('option', { value: s }, label(s)))
  );
  const refresh = h('button', { class: 'btn btn-ghost btn-sm' }, h('span', { class: 'material-symbols-rounded' }, 'refresh'));

  const toolbar = h('div', { class: 'toolbar' }, search, statusSel, h('div', { class: 'spacer' }), refresh);
  page.appendChild(toolbar);

  const card = h('div', { class: 'card' });
  page.appendChild(card);

  async function load() {
    card.innerHTML = '<div class="loader">Yükleniyor...</div>';
    const params = new URLSearchParams();
    if (search.value) params.set('q', search.value);
    if (statusSel.value) params.set('status', statusSel.value);
    const { leads } = await api.get('/api/leads?' + params);
    if (leads.length === 0) {
      card.innerHTML = '<div class="empty"><span class="material-symbols-rounded">inbox</span><p>Henüz talep yok.</p></div>';
      return;
    }
    card.innerHTML = '';
    const table = h('table', { class: 'table' });
    table.innerHTML = `<thead><tr><th>Ad</th><th>E-posta</th><th>Telefon</th><th>Şirket</th><th>Ürünler</th><th>Durum</th><th>Tarih</th><th></th></tr></thead>`;
    const tbody = h('tbody');
    leads.forEach(l => {
      const tr = h('tr');
      tr.innerHTML = `
        <td><b>${escapeHtml(l.first_name)} ${escapeHtml(l.last_name)}</b></td>
        <td><a href="mailto:${escapeHtml(l.email)}">${escapeHtml(l.email)}</a></td>
        <td>${escapeHtml(l.phone || '-')}</td>
        <td>${escapeHtml(l.company || '-')}</td>
        <td>${(l.products || []).join(', ')}</td>
        <td><span class="badge badge-${l.status}">${label(l.status)}</span></td>
        <td>${fmtDate(l.created_at)}</td>
      `;
      const act = h('td');
      const view = h('button', { class: 'btn btn-ghost btn-sm', onClick: () => openLeadDetail(l, load) },
        h('span', { class: 'material-symbols-rounded' }, 'visibility'));
      const del = h('button', { class: 'btn btn-danger btn-sm', onClick: async () => {
        if (await confirmDialog('Bu talep silinsin mi?')) {
          await api.del('/api/leads/' + l.id);
          toast('Silindi', 'success');
          load();
        }
      }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
      act.appendChild(h('div', { class: 'row-actions' }, view, del));
      tr.appendChild(act);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }

  let timer;
  search.oninput = () => { clearTimeout(timer); timer = setTimeout(load, 250); };
  statusSel.onchange = load;
  refresh.onclick = load;
  load();
};

function openLeadDetail(lead, onDone) {
  const content = h('div');
  content.innerHTML = `
    <div class="form-grid">
      <div><span class="field-label">Ad Soyad</span><div>${escapeHtml(lead.first_name)} ${escapeHtml(lead.last_name)}</div></div>
      <div><span class="field-label">E-posta</span><div><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></div></div>
      <div><span class="field-label">Telefon</span><div>${escapeHtml(lead.phone || '-')}</div></div>
      <div><span class="field-label">Şirket</span><div>${escapeHtml(lead.company || '-')}</div></div>
      <div class="full"><span class="field-label">Ürünler</span><div>${(lead.products||[]).join(', ')}</div></div>
      <div class="full"><span class="field-label">Mesaj</span><div style="white-space:pre-wrap">${escapeHtml(lead.message || '-')}</div></div>
      <div><span class="field-label">Tarih</span><div>${fmtDate(lead.created_at)}</div></div>
      <div><span class="field-label">IP</span><div>${escapeHtml(lead.ip || '-')}</div></div>
    </div>
    <hr style="border:0;border-top:1px solid var(--border);margin:20px 0">
    <div class="form-grid">
      <div>
        <span class="field-label">Durum</span>
        <select id="leadStatus">
          ${['new','contacted','qualified','won','lost'].map(s => `<option value="${s}" ${s===lead.status?'selected':''}>${label(s)}</option>`).join('')}
        </select>
      </div>
      <div class="full">
        <span class="field-label">İç notlar</span>
        <textarea id="leadNotes" rows="3">${escapeHtml(lead.notes || '')}</textarea>
      </div>
    </div>
  `;
  const save = h('button', { class: 'btn btn-primary' }, 'Kaydet');
  const close = h('button', { class: 'btn btn-ghost' }, 'Kapat');
  content.appendChild(h('div', { class: 'modal-actions' }, close, save));
  const modal = openModal('Talep Detayı', content);
  close.onclick = () => modal.remove();
  save.onclick = async () => {
    await api.patch('/api/leads/' + lead.id, {
      status: document.getElementById('leadStatus').value,
      notes: document.getElementById('leadNotes').value,
    });
    toast('Güncellendi', 'success');
    modal.remove();
    onDone();
  };
}

// ============================================
// POSTS (inline full-page editor)
// ============================================
routes.posts = (page) => contentPage(page, { kind: 'post', title: 'Blog Yazıları' });

async function contentPage(page, cfg) {
  const apiPath = '/api/posts';
  const listUrl = '/api/posts/admin/all';
  const pluralKey = 'posts';

  const hashParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const editId = hashParams.get('edit');
  const isNew = hashParams.get('new') === '1';

  if (editId || isNew) {
    await renderEditor(page, cfg, apiPath, pluralKey, editId ? Number(editId) : null);
  } else {
    await renderList(page, cfg, apiPath, listUrl, pluralKey);
  }
}

async function renderList(page, cfg, apiPath, listUrl, pluralKey) {
  page.innerHTML = '';
  const newBtn = h('button', { class: 'btn btn-primary btn-sm',
    onClick: () => navigateWithParams(currentRoute, { new: '1' }) },
    h('span', { class: 'material-symbols-rounded' }, 'add'),
    'Yeni Blog Yazısı');

  const headActions = h('div', { style: 'display:flex;gap:8px;align-items:center' });
  {
    const exportBtn = h('button', { class: 'btn btn-ghost btn-sm', title: 'Tüm yazıları JSON olarak indir',
      onClick: async () => {
        try {
          const data = await api.get('/api/posts/admin/export');
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `blog-yedek-${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast(`${data.count} yazı dışa aktarıldı`, 'success');
        } catch (e) { toast('Dışa aktarma başarısız', 'error'); }
      } },
      h('span', { class: 'material-symbols-rounded' }, 'download'), 'Yedek Al');

    const importInput = h('input', { type: 'file', accept: 'application/json', style: 'display:none' });
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const posts = Array.isArray(parsed) ? parsed : parsed.posts;
        if (!Array.isArray(posts)) { toast('Geçersiz yedek dosyası', 'error'); return; }
        const overwrite = await confirmDialog(`${posts.length} yazı bulundu. Aynı slug'a sahip yazılar ÜZERİNE YAZILSIN mı? (Hayır = atla)`);
        const r = await api.post('/api/posts/admin/import', { posts, mode: overwrite ? 'overwrite' : 'skip' });
        toast(`${r.imported} eklendi, ${r.updated} güncellendi, ${r.skipped} atlandı`, 'success');
        renderList(page, cfg, apiPath, listUrl, pluralKey);
      } catch (e) { toast('İçe aktarma başarısız: ' + (e.message || ''), 'error'); }
      importInput.value = '';
    });
    const importBtn = h('button', { class: 'btn btn-ghost btn-sm', title: 'JSON yedekten içe aktar',
      onClick: () => importInput.click() },
      h('span', { class: 'material-symbols-rounded' }, 'upload'), 'İçe Aktar');

    headActions.appendChild(exportBtn);
    headActions.appendChild(importBtn);
    headActions.appendChild(importInput);
  }
  headActions.appendChild(newBtn);

  const cardHead = h('div', { class: 'crud-card-head' },
    h('h3', { class: 'crud-card-title' }, 'Blog Yazıları'),
    headActions);
  const card = h('div', { class: 'card card-flush' }, cardHead);
  const body = h('div', { class: 'crud-card-body' });
  card.appendChild(body);
  page.appendChild(card);
  body.innerHTML = '<div class="loader">Yükleniyor...</div>';

  const data = await api.get(listUrl);
  const items = data[pluralKey] || [];
  if (!items.length) {
    body.innerHTML = `<div class="empty"><span class="material-symbols-rounded">article</span><p>Henüz kayıt yok.</p></div>`;
    return;
  }
  body.innerHTML = '';
  const t = h('table', { class: 'table' });
  t.innerHTML = `<thead><tr><th>Başlık</th><th>Çözüm</th><th>Dil</th><th>Durum</th><th>Güncellendi</th><th></th></tr></thead>`;
  const tbody = h('tbody');
  items.forEach(r => {
    const tr = h('tr', { style: 'cursor:pointer',
      onClick: e => { if (!e.target.closest('.row-actions')) navigateWithParams(currentRoute, { edit: r.id }); } });
    tr.innerHTML = `
      <td><b>${escapeHtml(r.title)}</b><div style="color:var(--text-dim);font-size:11px">${escapeHtml(r.slug)}</div></td>
      <td>${r.service_title ? escapeHtml(r.service_title) : '—'}</td>
      <td>${(r.language || 'tr').toUpperCase()}</td>
      <td><span class="badge badge-${r.status}">${label(r.status)}</span></td>
      <td>${fmtDate(r.updated_at)}</td>
    `;
    const act = h('td');
    const edit = h('button', { class: 'btn btn-ghost btn-sm', title: 'Düzenle',
      onClick: e => { e.stopPropagation(); navigateWithParams(currentRoute, { edit: r.id }); } },
      h('span', { class: 'material-symbols-rounded' }, 'edit'));
    const rowActions = h('div', { class: 'row-actions' }, edit);
    // Çoğalt sadece blog (posts) için
    if (cfg.kind === 'post') {
      const dup = h('button', { class: 'btn btn-ghost btn-sm', title: 'Çoğalt (taslak kopya)',
        onClick: async e => {
          e.stopPropagation();
          try {
            const res = await api.post(`/api/posts/${r.id}/duplicate`, {});
            toast('Kopya oluşturuldu (taslak)', 'success');
            navigateWithParams(currentRoute, { edit: res.id });
          } catch (err) { toast('Çoğaltma başarısız', 'error'); }
        } },
        h('span', { class: 'material-symbols-rounded' }, 'content_copy'));
      rowActions.appendChild(dup);
    }
    const del = h('button', { class: 'btn btn-danger btn-sm', title: 'Sil', onClick: async e => {
      e.stopPropagation();
      if (await confirmDialog('Bu kayıt silinsin mi?')) {
        await api.del(`${apiPath}/${r.id}`);
        toast('Silindi', 'success');
        renderList(page, cfg, apiPath, listUrl, pluralKey);
      }
    }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
    rowActions.appendChild(del);
    act.appendChild(rowActions);
    tr.appendChild(act);
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  body.appendChild(t);
}

async function renderEditor(page, cfg, apiPath, pluralKey, id) {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let record = {};
  if (id) {
    const { posts } = await api.get('/api/posts/admin/all');
    record = (posts || []).find(x => x.id === id) || {};
  }

  page.innerHTML = '';

  const back = h('a', { class: 'btn btn-ghost btn-sm',
    onClick: e => { e.preventDefault(); navigateWithParams(currentRoute, {}); }, href: '#' },
    h('span', { class: 'material-symbols-rounded' }, 'arrow_back'), 'Listeye dön');

  const statusSel = h('select', { id: 'editStatus', class: 'post-toolbar-select' },
    h('option', { value: 'draft', ...(record.status==='draft'?{selected:''}:{}) }, '📝 Taslak'),
    h('option', { value: 'published', ...(record.status==='published'?{selected:''}:{}) }, '✓ Yayında'));

  const langSel = h('select', { id: 'editLang', class: 'post-toolbar-select post-toolbar-lang' },
    ...['tr','en'].map(l => h('option', { value: l, ...((record.language||'tr')===l?{selected:''}:{}) }, l.toUpperCase())));

  const saveBtn = h('button', { class: 'btn btn-primary' },
    h('span', { class: 'material-symbols-rounded' }, 'save'), 'Kaydet');

  const delBtnTop = id ? h('button', { class: 'btn btn-danger', title: 'Sil',
    onClick: async () => {
      if (await confirmDialog('Bu kayıt silinsin mi?')) {
        await api.del(`${apiPath}/${id}`);
        toast('Silindi', 'success');
        navigateWithParams(currentRoute, {});
      }
    } }, h('span', { class: 'material-symbols-rounded' }, 'delete')) : null;

  const head = h('div', { class: 'post-editor-toolbar' },
    back,
    h('div', { class: 'post-toolbar-spacer' }),
    langSel,
    statusSel,
    saveBtn,
    delBtnTop,
  );
  page.appendChild(head);

  // Two-column editor: left (metadata) — right (body)
  const card = h('div', { class: 'card', style: 'padding:0;overflow:hidden' });
  const editorGrid = h('div', { class: 'post-editor-grid' });
  editorGrid.innerHTML = `
    <aside class="post-editor-side">
      <h3 class="post-editor-side-title">Yazı Ayarları</h3>
      <div class="field-block">
        <span class="field-label">Slug (boş = başlıktan üretilir)</span>
        <input id="editSlug" value="${escapeHtml(record.slug||'')}" placeholder="ornek-baslik">
      </div>
      <div class="field-block">
        <span class="field-label">Özet</span>
        <textarea id="editExcerpt" rows="3" placeholder="Kısa özet metni...">${escapeHtml(record.excerpt||'')}</textarea>
      </div>
      <div class="field-block">
        <span class="field-label">Kapak (Ana) Görseli</span>
        <div class="cover-uploader" id="coverUploader">
          <div class="cover-preview${record.cover_image ? '' : ' is-empty'}" id="coverPreview">
            ${record.cover_image
              ? `<img src="${escapeHtml(record.cover_image)}" alt="Kapak görseli">`
              : `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`}
          </div>
          <div class="cover-uploader-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="coverUploadBtn">
              <span class="material-symbols-rounded">upload</span> Görsel Yükle
            </button>
            <button type="button" class="btn btn-ghost btn-sm" id="coverClearBtn" ${record.cover_image ? '' : 'style="display:none"'}>
              <span class="material-symbols-rounded">delete</span> Kaldır
            </button>
          </div>
          <input type="file" id="coverFile" accept="image/*" hidden>
          <input id="editCover" value="${escapeHtml(record.cover_image||'')}" placeholder="veya URL girin: /assets/..." class="cover-url-input">
          <label class="cover-toggle">
            <input type="checkbox" id="editShowCover" ${(record.show_cover === undefined || record.show_cover) ? 'checked' : ''}>
            <span>Kapağı yazıda göster</span>
          </label>
        </div>
      </div>
      ${cfg.kind === 'post' ? `
      <div class="field-block">
        <span class="field-label">Etiketler (virgülle)</span>
        <input id="editTags" value="${escapeHtml(record.tags||'')}" placeholder="ges, otomasyon, ag-og">
      </div>
      <div class="field-block">
        <span class="field-label">İlgili Çözüm</span>
        <select id="editService"><option value="">— Seçiniz —</option></select>
      </div>
      <div class="field-block">
        <span class="field-label">Teknik Kütüphane Belgeleri</span>
        <div id="tkDocPicker" style="display:flex;flex-direction:column;gap:8px">
          <button type="button" class="btn btn-ghost btn-sm" id="tkDocPickBtn" style="justify-content:center"><span class="material-symbols-rounded">library_books</span> Belge Seç</button>
          <div id="tkDocSelected" style="display:flex;flex-direction:column;gap:6px;color:var(--text-dim);font-size:12px">Yükleniyor...</div>
        </div>
      </div>` : ''}
      ${id ? `
      <div class="field-block" style="margin-top:auto;padding-top:18px;border-top:1px solid var(--border);font-size:12px;color:var(--text-dim)">
        <div>Oluşturuldu: ${fmtDate(record.created_at)}</div>
        <div>Güncellendi: ${fmtDate(record.updated_at)}</div>
        ${record.published_at ? `<div>Yayınlandı: ${fmtDate(record.published_at)}</div>` : ''}
      </div>` : ''}
    </aside>
    <main class="post-editor-main">
      <input id="editTitle" class="post-title-input" value="${escapeHtml(record.title||'')}" placeholder="Yazı başlığı..." required>
      <textarea id="editBody" class="post-body-input" placeholder="Markdown formatında içerik yazın...&#10;&#10;## Alt başlık&#10;Metin...&#10;&#10;- Liste maddesi&#10;- Liste maddesi&#10;&#10;**kalın** *italik* \`kod\`" required>${escapeHtml(record.body||'')}</textarea>
      <div class="post-editor-footer">
        <span class="field-label" style="margin:0">Markdown desteklenir</span>
        <span id="charCount" class="field-label" style="margin:0">0 karakter</span>
      </div>
    </main>
  `;
  card.appendChild(editorGrid);
  page.appendChild(card);

  const titleEl = page.querySelector('#editTitle');
  const bodyEl = page.querySelector('#editBody');
  const charCount = page.querySelector('#charCount');

  // === Kaydedilmemiş değişiklik koruması ===
  let dirty = false;
  let leavingViaSave = false;
  let guardsDetached = false;
  const markDirty = () => { dirty = true; };
  page.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
  });
  const beforeUnload = (e) => {
    if (!dirty || leavingViaSave) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  };
  window.addEventListener('beforeunload', beforeUnload);

  // Tüm guard + interval/editör temizliğini TEK yerde topla.
  // Önceki bug: temizlik ayrı bir {once:true} hashchange dinleyicisindeydi; hashGuard
  // stopImmediatePropagation çağırınca o dinleyici çalışmıyor, guard'lar takılı kalıp
  // sonraki editör instance'larında birikiyordu → başka sayfaya geçilemiyordu.
  const detachGuards = () => {
    if (guardsDetached) return;
    guardsDetached = true;
    window.removeEventListener('beforeunload', beforeUnload);
    window.removeEventListener('hashchange', hashGuard, true);
    clearInterval(countInterval);
    clearInterval(watchEditor);
    destroyEditor('#editBody');
  };

  // capture phase — navigate()'ten önce çalışır
  const hashGuard = (e) => {
    // Kirli değilse ya da kaydederek çıkıyorsa: serbest bırak + temizle
    if (!dirty || leavingViaSave) { detachGuards(); return; }
    if (confirm('Kaydetmediniz, emin misiniz? Yaptığınız değişiklikler kaybolacak.')) {
      // Kullanıcı çıkmayı onayladı → guard'ları sök, navigate çalışsın
      detachGuards();
    } else {
      // Kullanıcı kaldı → hash'i geri sar, navigate'i engelle (guard takılı kalır)
      history.replaceState(null, '', lastHash);
      e && e.stopImmediatePropagation && e.stopImmediatePropagation();
      e && e.preventDefault && e.preventDefault();
    }
  };
  let lastHash = location.hash;
  window.addEventListener('hashchange', hashGuard, true);

  // Önceki editör instance'ını temizle, yenisini başlat
  destroyEditor('#editBody');
  mountEditor('#editBody', record.body || '');
  // TinyMCE içeriği değişince dirty işaretle.
  // init sırasında TinyMCE spurious change/ExecCommand fırlatabiliyor; bu yüzden
  // dirty-binding'i init tamamlanıp bir tık sonra (setContent oturduktan sonra) bağla.
  const watchEditor = setInterval(() => {
    if (typeof tinymce !== 'undefined') {
      const ed = tinymce.get('editBody');
      if (ed && ed.initialized) {
        setTimeout(() => { ed.on('input change keyup undo redo ExecCommand', markDirty); }, 50);
        clearInterval(watchEditor);
      }
    }
  }, 200);

  // Karakter sayacı (TinyMCE değişiklikleriyle güncellenir)
  function updateCount() {
    const text = getEditorContent('#editBody').replace(/<[^>]*>/g, '');
    charCount.textContent = `${text.length.toLocaleString('tr-TR')} karakter`;
  }
  const countInterval = setInterval(updateCount, 800);

  // === Kapak (ana) görseli: yükle / önizle / kaldır ===
  const coverInput = page.querySelector('#editCover');
  const coverFile = page.querySelector('#coverFile');
  const coverPreview = page.querySelector('#coverPreview');
  const coverUploadBtn = page.querySelector('#coverUploadBtn');
  const coverClearBtn = page.querySelector('#coverClearBtn');

  function renderCoverPreview(url) {
    if (url) {
      coverPreview.classList.remove('is-empty');
      coverPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="Kapak görseli">`;
      coverClearBtn.style.display = '';
    } else {
      coverPreview.classList.add('is-empty');
      coverPreview.innerHTML = `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`;
      coverClearBtn.style.display = 'none';
    }
  }

  coverUploadBtn.onclick = () => coverFile.click();
  coverClearBtn.onclick = () => { coverInput.value = ''; renderCoverPreview(''); };
  coverInput.addEventListener('input', () => renderCoverPreview(coverInput.value.trim()));

  coverFile.onchange = async () => {
    const file = coverFile.files && coverFile.files[0];
    if (!file) return;
    coverUploadBtn.disabled = true;
    const original = coverUploadBtn.innerHTML;
    coverUploadBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Yükleniyor...';
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('e1-token') || sessionStorage.getItem('e1-token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/uploads', { method: 'POST', headers, body: fd, credentials: 'include' });
      if (!res.ok) throw new Error('Görsel yüklenemedi');
      const data = await res.json();
      coverInput.value = data.url;
      renderCoverPreview(data.url);
      toast('Kapak görseli yüklendi', 'success');
    } catch (e) {
      toast(e.message || 'Yükleme başarısız', 'error');
    } finally {
      coverUploadBtn.disabled = false;
      coverUploadBtn.innerHTML = original;
      coverFile.value = '';
    }
  };

  titleEl.focus();

  // Blog yazısının ilgili çözüm seçimi
  const serviceSel = page.querySelector('#editService');
  if (serviceSel) {
    try {
      const sd = await api.get('/api/services/admin/all');
      (sd.services || []).forEach(s => {
        const o = document.createElement('option');
        o.value = s.id; o.textContent = s.title;
        if (record.service_id == s.id) o.selected = true;
        serviceSel.appendChild(o);
      });
    } catch(e) {}
  }

  // TK belge seçici yükle (popup)
  const tkPicker = page.querySelector('#tkDocPicker');
  let tkLinkedIds = [];
  let tkAllDocs = [];
  function renderTkSelected() {
    const box = page.querySelector('#tkDocSelected');
    if (!box) return;
    const selected = tkAllDocs.filter(d => tkLinkedIds.includes(d.id));
    if (!selected.length) { box.textContent = 'Belge seçilmedi'; return; }
    box.innerHTML = selected.map(d => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:7px 9px">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${escapeHtml(d.title)}</b>${d.brand_name ? ` <small style="color:var(--text-dim)">(${escapeHtml(d.brand_name)})</small>` : ''}</span>
      <button type="button" data-remove-tk="${d.id}" class="btn btn-ghost btn-sm" style="padding:2px 6px">×</button>
    </div>`).join('');
    box.querySelectorAll('[data-remove-tk]').forEach(btn => {
      btn.onclick = () => { tkLinkedIds = tkLinkedIds.filter(x => x !== Number(btn.dataset.removeTk)); renderTkSelected(); markDirty(); };
    });
  }
  function openTkDocPicker() {
    const content = document.createElement('div');
    content.innerHTML = `<input id="tkDocSearch" placeholder="Belge ara..." style="width:100%;margin-bottom:12px">
      <div id="tkDocModalList" style="max-height:420px;overflow:auto;border:1px solid var(--border);border-radius:10px;padding:8px"></div>`;
    const actions = h('div', { style:'display:flex;gap:8px;justify-content:flex-end;margin-top:16px' });
    const cancel = h('button', { class:'btn btn-ghost' }, 'Vazgeç');
    const save = h('button', { class:'btn btn-primary' }, 'Seçimi Kaydet');
    actions.appendChild(cancel); actions.appendChild(save); content.appendChild(actions);
    const modal = openModal('Teknik Kütüphane Belgeleri', content, { width:'720px' });
    const list = content.querySelector('#tkDocModalList');
    const search = content.querySelector('#tkDocSearch');
    let tempIds = [...tkLinkedIds];
    const renderList = () => {
      const q = search.value.trim().toLowerCase();
      const docs = q ? tkAllDocs.filter(d => (d.title||'').toLowerCase().includes(q) || (d.brand_name||'').toLowerCase().includes(q)) : tkAllDocs;
      list.innerHTML = docs.map(d => `<label style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px;border-bottom:1px solid var(--border);cursor:pointer">
        <input type="checkbox" value="${d.id}" ${tempIds.includes(d.id)?'checked':''}>
        <span><b>${escapeHtml(d.title)}</b><br><small style="color:var(--text-dim)">${escapeHtml(d.document_type||'')} ${d.brand_name ? '· '+escapeHtml(d.brand_name) : ''}</small></span>
        <span class="badge badge-published">${(d.language||'tr').toUpperCase()}</span>
      </label>`).join('') || '<p style="padding:12px;color:var(--text-dim)">Belge bulunamadı</p>';
      list.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.onchange = () => { const n = Number(cb.value); tempIds = cb.checked ? [...new Set([...tempIds,n])] : tempIds.filter(x => x !== n); };
      });
    };
    search.oninput = renderList; renderList();
    cancel.onclick = () => modal.remove();
    save.onclick = () => { tkLinkedIds = tempIds; renderTkSelected(); markDirty(); modal.remove(); };
  }
  if (tkPicker) {
    try {
      const [allDocs, linked] = await Promise.all([
        api.get('/api/library/admin/all'),
        id ? api.get(`/api/posts/admin/${id}/library-docs`) : { document_ids: [] }
      ]);
      tkLinkedIds = linked.document_ids || [];
      tkAllDocs = (allDocs.documents || []).filter(d => d.status === 'published');
      renderTkSelected();
      const pickBtn = page.querySelector('#tkDocPickBtn');
      if (pickBtn) pickBtn.onclick = openTkDocPicker;
    } catch { const s = page.querySelector('#tkDocSelected'); if (s) s.textContent = 'Yüklenemedi'; }
  }

  saveBtn.onclick = async () => {
    const body = getEditorContent('#editBody');
    const showCoverEl = page.querySelector('#editShowCover');
    const payload = {
      title: titleEl.value.trim(),
      body,
      slug: page.querySelector('#editSlug').value.trim() || null,
      excerpt: page.querySelector('#editExcerpt').value.trim() || null,
      cover_image: page.querySelector('#editCover').value.trim() || null,
      show_cover: showCoverEl ? (showCoverEl.checked ? 1 : 0) : 1,
      status: statusSel.value,
      language: langSel.value,
    };
    if (cfg.kind === 'post') {
      payload.tags = page.querySelector('#editTags').value.trim() || null;
      payload.service_id = page.querySelector('#editService').value || null;
    }

    if (!payload.title || !payload.body || payload.body === '<p></p>') {
      toast('Başlık ve içerik zorunlu', 'error');
      return;
    }

    // TK belge bağlantıları
    const tkDocIds = tkPicker ? tkLinkedIds : [];

    saveBtn.disabled = true;
    try {
      if (id) {
        await api.put(`${apiPath}/${id}`, payload);
        await api.put(`/api/posts/admin/${id}/library-docs`, { document_ids: tkDocIds });
        dirty = false;
        toast('Kaydedildi', 'success');
      } else {
        const res = await api.post(apiPath, payload);
        if (tkDocIds.length) await api.put(`/api/posts/admin/${res.id}/library-docs`, { document_ids: tkDocIds });
        toast('Oluşturuldu', 'success');
        leavingViaSave = true;
        dirty = false;
        clearInterval(countInterval);
        clearInterval(watchEditor);
        destroyEditor('#editBody');
        detachGuards();
        navigateWithParams(currentRoute, { edit: res.id });
        return;
      }
    } catch (e) {
      toast(e.message === 'slug_exists' ? 'Bu slug zaten kullanılıyor' : e.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  };
}

function navigateWithParams(route, params) {
  const usp = new URLSearchParams(params);
  const qs = usp.toString();
  location.hash = '#/' + route + (qs ? '?' + qs : '');
}

// ============================================
// USERS
// ============================================
routes.users = async (page) => {
  page.innerHTML = '';
  const search = h('input', { type: 'search', placeholder: 'Ara: ad, email, şirket...' });
  const roleSel = h('select', {}, h('option', { value: '' }, 'Tüm roller'),
    h('option', { value: 'admin' }, 'Admin'), h('option', { value: 'customer' }, 'Customer'));
  const newBtn = h('button', { class: 'btn btn-primary btn-sm', onClick: () => openUserForm(null, load) },
    h('span', { class: 'material-symbols-rounded' }, 'add'), 'Yeni Kullanıcı');

  page.appendChild(h('div', { class: 'toolbar' }, search, roleSel, h('div', { class: 'spacer' }), newBtn));
  const card = h('div', { class: 'card' });
  page.appendChild(card);

  async function load() {
    card.innerHTML = '<div class="loader">Yükleniyor...</div>';
    const params = new URLSearchParams();
    if (search.value) params.set('q', search.value);
    if (roleSel.value) params.set('role', roleSel.value);
    const { users } = await api.get('/api/users?' + params);
    if (!users.length) { card.innerHTML = '<div class="empty"><p>Kullanıcı bulunamadı.</p></div>'; return; }
    card.innerHTML = '';
    const t = h('table', { class: 'table' });
    t.innerHTML = `<thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>Şirket</th><th>Aktif</th><th>Tarih</th><th></th></tr></thead>`;
    const tbody = h('tbody');
    users.forEach(u => {
      const tr = h('tr');
      tr.innerHTML = `
        <td><b>${escapeHtml(u.name)}</b></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge">${label(u.role)}</span></td>
        <td>${escapeHtml(u.company || '-')}</td>
        <td>${u.is_active ? '✓' : '—'}</td>
        <td>${fmtDate(u.created_at)}</td>
      `;
      const act = h('td');
      const edit = h('button', { class: 'btn btn-ghost btn-sm', onClick: () => openUserForm(u, load) },
        h('span', { class: 'material-symbols-rounded' }, 'edit'));
      const del = h('button', { class: 'btn btn-danger btn-sm', onClick: async () => {
        if (await confirmDialog(`${u.name} kullanıcısı silinsin mi?`)) {
          try { await api.del('/api/users/' + u.id); toast('Silindi', 'success'); load(); }
          catch (e) { toast(e.message, 'error'); }
        }
      }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
      act.appendChild(h('div', { class: 'row-actions' }, edit, del));
      tr.appendChild(act);
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    card.appendChild(t);
  }

  let timer;
  search.oninput = () => { clearTimeout(timer); timer = setTimeout(load, 250); };
  roleSel.onchange = load;
  load();
};

async function openUserForm(u, onDone) {
  const isEdit = !!u;

  // Admin paneli bölümleri (data-route ile aynı) — yetki seçimi için
  const ADMIN_SECTIONS = [
    { code: 'leads', label: 'İletişim Talepleri' },
    { code: 'posts', label: 'Blog Yazıları' },
    { code: 'announcements', label: 'Duyurular' },
    { code: 'services', label: 'Hizmetler' },
    { code: 'projects', label: 'Referans Projeler' },
    { code: 'brands', label: 'Markalar' },
    { code: 'references', label: 'Referans Logoları' },
    { code: 'milestones', label: 'Kilometre Taşları' },
    { code: 'appointments', label: 'Randevular' },
    { code: 'careers', label: 'Kariyer / İlanlar' },
    { code: 'job-applications', label: 'Başvurular' },
    { code: 'users', label: 'Kullanıcılar' },
    { code: 'kvkk', label: 'KVKK Aydınlatma Metni' },
    { code: 'kvkk-politikasi', label: 'Genel KVKK Politikası' },
    { code: 'basvuru-formu', label: 'Başvuru Formu' },
    { code: 'calisan-adayi', label: 'Çalışan Adayı Metni' },
    { code: 'imha-politikasi', label: 'İmha Politikası' },
    { code: 'cerez', label: 'Çerez Politikası' },
    { code: 'warranty', label: 'Garanti Ayarları' },
    { code: 'warranty-logs', label: 'Garanti Sorguları' },
    { code: 'settings', label: 'Ayarlar' },
    { code: 'library', label: 'TK Belgeleri' },
    { code: 'library-users', label: 'TK Başvuruları & Erişim' },
  ];
  // Mevcut yetkiler: null = tam yetki; array = kısıtlı
  const curPerms = u && Array.isArray(u.permissions) ? u.permissions : null;
  const isFullAccess = curPerms === null;

  const form = h('div', { class: 'form-grid' });
  form.innerHTML = `
    <div><span class="field-label">Ad Soyad *</span><input name="name" value="${escapeHtml(u?.name||'')}" required></div>
    <div><span class="field-label">E-posta *</span><input name="email" type="email" value="${escapeHtml(u?.email||'')}" ${isEdit?'readonly':''} required></div>
    <div><span class="field-label">${isEdit?'Yeni Şifre (değişmesin diye boş bırakın)':'Şifre *'}</span><input name="password" type="password" minlength="8" ${isEdit?'':'required'}></div>
    <div><span class="field-label">Rol</span><select name="role">${['admin','customer'].map(r=>`<option value="${r}" ${(u?.role||'customer')===r?'selected':''}>${label(r)}</option>`).join('')}</select></div>
    <div><span class="field-label">Şirket</span><input name="company" value="${escapeHtml(u?.company||'')}"></div>
    <div><span class="field-label">Telefon</span><input name="phone" value="${escapeHtml(u?.phone||'')}"></div>
    <div class="full">
      <label style="display:flex;gap:8px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer">
        <input type="checkbox" name="must_change_password" value="1" ${(!isEdit || u?.must_change_password) ? 'checked' : ''} style="width:auto">
        <span>İlk girişte şifresini değiştirmek zorunda <small style="color:var(--text-dim);display:block;margin-top:2px">${isEdit ? 'Yeni şifre yazarsanız bu zaten otomatik açılır. Mevcut kullanıcı için manuel zorlamak isterseniz işaretli bırakın.' : 'Önerilen: kullanıcı kendi belirleyene kadar zorla.'}</small></span>
      </label>
    </div>

    <div class="full" id="permsBlock">
      <span class="field-label">Yetkiler (admin rolü için — hangi sayfalara erişebilir?)</span>
      <label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;font-weight:600">
        <input type="checkbox" id="permFullAccess" ${isFullAccess?'checked':''} style="width:auto"> Tam yetki (tüm sayfalar)
      </label>
      <div id="permsGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;${isFullAccess?'opacity:0.4;pointer-events:none':''}">
        ${ADMIN_SECTIONS.map(s => `<label style="display:flex;gap:8px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:8px;cursor:pointer">
          <input type="checkbox" name="perm" value="${s.code}" ${(!isFullAccess && curPerms.includes(s.code))?'checked':''} style="width:auto"> ${escapeHtml(s.label)}
        </label>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin:8px 0 0">Genel Bakış ve Profilim her zaman erişilebilir.</p>
    </div>
    ${isEdit ? `<div class="full"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="is_active" ${u.is_active?'checked':''} style="width:auto"> Aktif</label></div>` : ''}
  `;

  // Rol değişince yetki bölümünü göster/gizle (yalnız admin rolünde anlamlı)
  const roleSelEl = form.querySelector('[name="role"]');
  const permsBlock = form.querySelector('#permsBlock');
  const fullAccessCb = form.querySelector('#permFullAccess');
  const permsGrid = form.querySelector('#permsGrid');
  function syncRoleBlocks() {
    const isAdmin = roleSelEl.value === 'admin';
    permsBlock.style.display = isAdmin ? '' : 'none';
  }
  fullAccessCb.addEventListener('change', () => {
    if (fullAccessCb.checked) { permsGrid.style.opacity = '0.4'; permsGrid.style.pointerEvents = 'none'; }
    else { permsGrid.style.opacity = ''; permsGrid.style.pointerEvents = ''; }
  });
  roleSelEl.addEventListener('change', syncRoleBlocks);
  syncRoleBlocks();

  const save = h('button', { class: 'btn btn-primary' }, isEdit ? 'Kaydet' : 'Oluştur');
  const cancel = h('button', { class: 'btn btn-ghost' }, 'Vazgeç');
  form.appendChild(h('div', { class: 'modal-actions full' }, cancel, save));
  const modal = openModal(isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı', form);
  cancel.onclick = () => modal.remove();
  save.onclick = async () => {
    const fd = new FormData();
    form.querySelectorAll('input, select').forEach(el => {
      if (el.type === 'checkbox') fd.set(el.name, el.checked ? '1' : '');
      else if (el.name) fd.set(el.name, el.value);
    });
    const role = fd.get('role');
    const payload = {
      name: fd.get('name'), email: fd.get('email'), role,
      company: fd.get('company') || null, phone: fd.get('phone') || null,
    };
    if (fd.get('password')) payload.password = fd.get('password');
    if (isEdit) payload.is_active = fd.get('is_active') === '1' ? 1 : 0;
    payload.must_change_password = fd.get('must_change_password') === '1' ? 1 : 0;

    // Yetkiler — sadece admin rolünde gönder. Tam yetki → null; aksi → seçili bölümler
    if (role === 'admin') {
      if (fullAccessCb.checked) {
        payload.permissions = null;
      } else {
        payload.permissions = Array.from(form.querySelectorAll('[name="perm"]:checked')).map(el => el.value);
      }
    } else {
      payload.permissions = null;
    }

    try {
      if (isEdit) {
        await api.put('/api/users/' + u.id, payload);
      } else {
        await api.post('/api/users', payload);
      }
      toast('Kaydedildi', 'success');
      modal.remove();
      onDone();
    } catch (e) {
      toast(e.message === 'email_exists' ? 'Bu e-posta zaten var' : e.message, 'error');
    }
  };
}

// ============================================
// Generic CRUD page factory
// ============================================
function createCrudPage(cfg) {
  return async function(page) {
    page.innerHTML = '';
    const newBtn = h('button', { class: 'btn btn-primary btn-sm', onClick: () => openForm(null) },
      h('span', { class: 'material-symbols-rounded' }, 'add'), cfg.newButtonText);
    const cardHead = h('div', { class: 'crud-card-head' },
      h('h3', { class: 'crud-card-title' }, cfg.title),
      newBtn);
    const card = h('div', { class: 'card card-flush' }, cardHead);
    const body = h('div', { class: 'crud-card-body' + (cfg.bodyClass ? ' ' + cfg.bodyClass : '') });
    card.appendChild(body);
    page.appendChild(card);

    async function load() {
      body.innerHTML = '<div class="loader">Yükleniyor...</div>';
      const data = await api.get(cfg.listUrl);
      const items = data[cfg.pluralKey] || [];
      if (!items.length) { body.innerHTML = '<div class="empty"><p>Henüz kayıt yok.</p></div>'; return; }
      body.innerHTML = '';
      const t = h('table', { class: 'table' });
      t.innerHTML = '<thead><tr>' + cfg.columns.map(c => `<th>${c.label}</th>`).join('') + '<th></th></tr></thead>';
      const tbody = h('tbody');
      items.forEach(r => {
        const tr = h('tr');
        tr.innerHTML = cfg.columns.map(c => `<td>${c.render(r)}</td>`).join('');
        const act = h('td');
        const edit = h('button', { class: 'btn btn-ghost btn-sm', onClick: () => openForm(r) },
          h('span', { class: 'material-symbols-rounded' }, 'edit'));
        const del = h('button', { class: 'btn btn-danger btn-sm', onClick: async () => {
          if (await confirmDialog('Silinsin mi?')) {
            await api.del(cfg.saveUrl(r.id));
            toast('Silindi', 'success');
            load();
          }
        }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
        act.appendChild(h('div', { class: 'row-actions' }, edit, del));
        tr.appendChild(act);
        tbody.appendChild(tr);
      });
      t.appendChild(tbody);
      body.appendChild(t);
    }

    function openForm(r) {
      const isEdit = !!r;
      const formContent = cfg.buildForm(r || {});
      const save = h('button', { class: 'btn btn-primary' }, isEdit ? 'Kaydet' : 'Oluştur');
      const cancel = h('button', { class: 'btn btn-ghost' }, 'Vazgeç');
      formContent.appendChild(h('div', { class: 'modal-actions full' }, cancel, save));

      // INLINE: formu modal yerine kartın içine yerleştir; liste yerine düzenleme görünür.
      // MODAL: klasik popup.
      let modal = null;
      let inlinePanel = null;
      if (cfg.inline) {
        inlinePanel = h('div', { class: 'crud-inline-form' },
          h('div', { class: 'crud-inline-head' },
            h('h3', { class: 'crud-card-title' }, isEdit ? cfg.title + ' — Düzenle' : 'Yeni ' + cfg.title)),
          formContent);
        body.innerHTML = '';
        body.appendChild(inlinePanel);
      } else {
        modal = openModal(isEdit ? cfg.title + ' — Düzenle' : 'Yeni ' + cfg.title, formContent, { width: '900px' });
      }

      // Form mount sonrası ek widget bağlama (ör. kapak görseli yükleyici)
      if (cfg.afterForm) cfg.afterForm(formContent, r || {});

      // Body textarea'sına TinyMCE bağla (varsa)
      const bodyTextarea = formContent.querySelector('textarea[name="body"]');
      let bodyEditorMounted = false;
      if (bodyTextarea && cfg.richBody !== false) {
        bodyTextarea.id = 'crudBody_' + Date.now();
        const initial = bodyTextarea.value;
        bodyTextarea.value = '';
        setTimeout(() => {
          mountEditor('#' + bodyTextarea.id, initial);
          bodyEditorMounted = true;
        }, 50);
      }

      // teardown: editörü ve DOM'u temizle. reload=true ise listeyi yeniden çiz.
      const teardown = (reload) => {
        if (bodyEditorMounted) destroyEditor('#' + bodyTextarea.id);
        if (modal) modal.remove();
        if (reload || inlinePanel) load(); // inline'da her durumda listeye dön
      };
      cancel.onclick = () => teardown(false);
      save.onclick = async () => {
        const payload = {};
        formContent.querySelectorAll('input, select, textarea').forEach(el => {
          if (!el.name) return;
          if (el.type === 'checkbox') payload[el.name] = el.checked ? 1 : 0;
          else if (el.name === 'body' && bodyEditorMounted) {
            payload.body = getEditorContent('#' + bodyTextarea.id);
          } else payload[el.name] = el.value || null;
        });
        const final = cfg.beforeSave ? cfg.beforeSave(payload) : payload;
        try {
          if (isEdit) await api.put(cfg.saveUrl(r.id), final);
          else await api.post(cfg.saveUrl(), final);
          toast('Kaydedildi', 'success');
          teardown(true);
        } catch (e) {
          toast(e.message, 'error');
        }
      };
    }

    load();
  };
}

// ============================================
// Görsel yükleyici (paylaşılan) — createCrudPage formlarında kapak/logo için
// ============================================
// id: hidden text input'un name+id'si (kayıtta payload[id] olarak gider)
function coverUploaderHtml(id, url, label = 'Kapak Görseli') {
  return `
    <div class="full">
      <span class="field-label">${escapeHtml(label)}</span>
      <div class="cover-uploader" data-cover="${id}">
        <div class="cover-preview${url ? '' : ' is-empty'}" data-cover-preview>
          ${url
            ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}">`
            : `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`}
        </div>
        <div class="cover-uploader-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-cover-upload>
            <span class="material-symbols-rounded">upload</span> Görsel Yükle
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-cover-clear ${url ? '' : 'style="display:none"'}>
            <span class="material-symbols-rounded">delete</span> Kaldır
          </button>
        </div>
        <input type="file" data-cover-file accept="image/*" hidden>
        <input name="${id}" id="${id}" value="${escapeHtml(url || '')}" placeholder="veya URL girin: /assets/..." class="cover-url-input">
      </div>
    </div>`;
}

// coverUploaderHtml ile basılan tüm yükleyicileri formContent içinde bağla
function wireCoverUploaders(root) {
  root.querySelectorAll('[data-cover]').forEach(box => {
    const urlInput = box.querySelector('.cover-url-input');
    const file = box.querySelector('[data-cover-file]');
    const preview = box.querySelector('[data-cover-preview]');
    const uploadBtn = box.querySelector('[data-cover-upload]');
    const clearBtn = box.querySelector('[data-cover-clear]');

    function render(u) {
      if (u) {
        preview.classList.remove('is-empty');
        preview.innerHTML = `<img src="${escapeHtml(u)}" alt="Görsel">`;
        clearBtn.style.display = '';
      } else {
        preview.classList.add('is-empty');
        preview.innerHTML = `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`;
        clearBtn.style.display = 'none';
      }
    }
    uploadBtn.onclick = () => file.click();
    clearBtn.onclick = () => { urlInput.value = ''; render(''); };
    urlInput.addEventListener('input', () => render(urlInput.value.trim()));
    file.onchange = async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      uploadBtn.disabled = true;
      const original = uploadBtn.innerHTML;
      uploadBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Yükleniyor...';
      try {
        const url = await uploadFile(f);
        urlInput.value = url;
        render(url);
        toast('Görsel yüklendi', 'success');
      } catch (e) {
        toast(e.message || 'Yükleme başarısız', 'error');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = original;
        file.value = '';
      }
    };
  });
}

// Tek dosya yükle → URL döndür (paylaşılan)
async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const token = localStorage.getItem('e1-token') || sessionStorage.getItem('e1-token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/uploads', { method: 'POST', headers, body: fd, credentials: 'include' });
  if (!res.ok) throw new Error('Görsel yüklenemedi');
  const data = await res.json();
  return data.url;
}

// ============================================
// SERVICES (Hizmetler)
// ============================================
// Hizmet kartı ikonları için seçilebilir Material Symbols listesi (enerji/elektrik temalı)
const SERVICE_ICONS = [
  'bolt','electric_bolt','solar_power','battery_charging_full','ev_station','power',
  'settings_input_component','electric_meter','offline_bolt','energy_savings_leaf','mode_fan',
  'engineering','factory','precision_manufacturing','construction','handyman','build',
  'cable','electrical_services','power_input','outlet','wind_power','water_drop',
  'grid_on','hub','device_hub','lan','router','memory','developer_board','sensors',
  'monitor_heart','speed','dashboard','schema','account_tree','flash_on','charger',
  'thermostat','co2','recycling','eco','public','apartment','foundation','workspace_premium',
];

function normalizeServiceIcon(value) {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 48);
  return cleaned || 'bolt';
}

// Bir form içindeki ikon seçiciyi (metin input + buton + grid menü) bağla
function wireIconPicker(root) {
  root.querySelectorAll('.svc-icon-picker').forEach(picker => {
    const input = picker.querySelector('.svc-icon-input');
    const btnIco = picker.querySelector('.svc-icon-current');
    const trigger = picker.querySelector('.svc-icon-btn');
    const menu = picker.querySelector('.svc-icon-menu');
    if (!input || !trigger || !menu) return;

    const setIcon = (value) => {
      const n = normalizeServiceIcon(value);
      input.value = n;
      if (btnIco) btnIco.textContent = n;
      return n;
    };

    setIcon(input.value);
    input.addEventListener('input', () => {
      const raw = input.value;
      const preview = normalizeServiceIcon(raw);
      if (btnIco) btnIco.textContent = preview;
    });
    input.addEventListener('blur', () => setIcon(input.value));

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.svc-icon-menu').forEach(m => { if (m !== menu) m.hidden = true; });
      menu.hidden = !menu.hidden;
    });
    menu.querySelectorAll('.svc-icon-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        setIcon(opt.dataset.icon);
        menu.hidden = true;
        input.focus();
      });
    });
  });
  // Dışarı tıklayınca kapat (bir kez bağla)
  if (!root.__iconPickerOutside) {
    root.__iconPickerOutside = true;
    document.addEventListener('click', () => root.querySelectorAll('.svc-icon-menu').forEach(m => m.hidden = true));
  }
}

// İkon seçici HTML'i (input name="icon" + canlı önizleme + grid menü)
function iconPickerHtml(current) {
  const ico = normalizeServiceIcon(current);
  return `<div class="svc-icon-picker">
    <div class="svc-icon-field">
      <button type="button" class="svc-icon-btn" title="İkon listesinden seç"><span class="material-symbols-rounded svc-icon-current">${escapeHtml(ico)}</span><span class="svc-icon-caret material-symbols-rounded">expand_more</span></button>
      <input type="text" class="svc-icon-input" name="icon" value="${escapeHtml(ico)}" placeholder="ör. solar_power" autocomplete="off" spellcheck="false">
    </div>
    <small class="svc-icon-help">Material Symbols adı yazın veya listeden seçin.</small>
    <div class="svc-icon-menu" hidden>
      ${SERVICE_ICONS.map(n => `<button type="button" class="svc-icon-opt" data-icon="${n}" title="${n}"><span class="material-symbols-rounded">${n}</span></button>`).join('')}
    </div>
  </div>`;
}

function groupServicesByCode(rows) {
  const map = new Map();
  (rows || []).forEach(r => {
    const key = r.code || r.slug || String(r.id);
    if (!map.has(key)) map.set(key, { key, code: r.code || '', tr: null, en: null, rows: [] });
    const g = map.get(key);
    g.rows.push(r);
    if ((r.language || 'tr') === 'en') g.en = r;
    else g.tr = r;
    if (!g.code && r.code) g.code = r.code;
  });
  return Array.from(map.values()).sort((a, b) => {
    const aa = a.tr || a.en || {};
    const bb = b.tr || b.en || {};
    return (aa.sort_order ?? 0) - (bb.sort_order ?? 0) || String(aa.title || '').localeCompare(String(bb.title || ''), 'tr');
  });
}

routes.services = async (page) => {
  page.innerHTML = '';
  const newBtn = h('button', { class: 'btn btn-primary btn-sm', onClick: () => openServiceEditor({ key: '', code: '', tr: null, en: null, rows: [] }) },
    h('span', { class: 'material-symbols-rounded' }, 'add'), 'Yeni Hizmet');
  const card = h('div', { class: 'card card-flush' },
    h('div', { class: 'crud-card-head' }, h('h3', { class: 'crud-card-title' }, 'Hizmetler'), newBtn),
    h('div', { class: 'crud-card-body', id: 'servicesGroupedBody' }));
  page.appendChild(card);
  const body = card.querySelector('#servicesGroupedBody');

  async function load() {
    body.innerHTML = '<div class="loader">Yükleniyor...</div>';
    const data = await api.get('/api/services/admin/all');
    const groups = groupServicesByCode(data.services || []);
    if (!groups.length) { body.innerHTML = '<div class="empty"><p>Henüz hizmet yok.</p></div>'; return; }
    const table = h('table', { class: 'table' });
    table.innerHTML = '<thead><tr><th>Başlık</th><th>İkon</th><th>Kod</th><th>Diller</th><th>Durum</th><th>Sıra</th><th></th></tr></thead>';
    const tbody = h('tbody');
    groups.forEach(g => {
      const base = g.tr || g.en || {};
      const tr = h('tr');
      tr.innerHTML = `
        <td><b>${escapeHtml(base.title || 'Başlıksız hizmet')}</b><div style="color:var(--text-dim);font-size:11px">${escapeHtml(base.slug || g.key || '')}</div></td>
        <td><span class="service-icon-preview"><span class="material-symbols-rounded">${escapeHtml(normalizeServiceIcon(base.icon))}</span><small>${escapeHtml(normalizeServiceIcon(base.icon))}</small></span></td>
        <td>${escapeHtml(g.code || base.code || '—')}</td>
        <td><span class="badge badge-${g.tr ? 'published' : 'draft'}">TR ${g.tr ? '✓' : 'eksik'}</span> <span class="badge badge-${g.en ? 'published' : 'draft'}">EN ${g.en ? '✓' : 'eksik'}</span></td>
        <td><span class="badge badge-${base.status || 'draft'}">${label(base.status || 'draft')}</span></td>
        <td>${base.sort_order ?? 0}</td>`;
      const act = h('td');
      const edit = h('button', { class: 'btn btn-ghost btn-sm', title: 'Düzenle', onClick: () => openServiceEditor(g) },
        h('span', { class: 'material-symbols-rounded' }, 'edit'));
      const del = h('button', { class: 'btn btn-danger btn-sm', title: 'Sil', onClick: async () => {
        if (!(await confirmDialog('Bu hizmet ve tüm dil versiyonları silinsin mi?'))) return;
        for (const row of [g.tr, g.en].filter(Boolean)) await api.del('/api/services/' + row.id);
        toast('Silindi', 'success');
        load();
      }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
      act.appendChild(h('div', { class: 'row-actions' }, edit, del));
      tr.appendChild(act);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.innerHTML = '';
    body.appendChild(table);
  }

  function langFormHtml(lang, row = {}) {
    const prefix = 'svc_' + lang;
    const langLabel = lang === 'tr' ? 'Türkçe' : 'English';
    return `<div class="svc-lang-panel" data-svc-lang="${lang}" ${lang === 'tr' ? '' : 'hidden'}>
      <div class="form-grid">
        <div class="full"><span class="field-label">${langLabel} Başlık ${lang === 'tr' ? '*' : ''}</span><input id="${prefix}_title" value="${escapeHtml(row.title||'')}" placeholder="${lang === 'tr' ? 'Hizmet başlığı' : 'Service title'}"></div>
        <div><span class="field-label">Slug</span><input id="${prefix}_slug" value="${escapeHtml(row.slug||'')}" placeholder="ornek-hizmet"></div>
        <div><span class="field-label">Kart İkonu</span>${iconPickerHtml(row.icon)}</div>
        <div class="full"><span class="field-label">Özet</span><textarea id="${prefix}_summary" rows="3" placeholder="Kısa özet metni...">${escapeHtml(row.summary||'')}</textarea></div>
        ${coverUploaderHtml(prefix + '_cover_image', row.cover_image, 'Kapak Görseli')}
        <label class="cover-toggle full">
          <input type="checkbox" id="${prefix}_show_cover" ${(row.show_cover === undefined || row.show_cover) ? 'checked' : ''}>
          <span>Kapağı detay sayfasında göster</span>
        </label>
        <div class="full"><span class="field-label">İçerik</span><textarea id="${prefix}_body" rows="10">${escapeHtml(row.body||'')}</textarea></div>
        <div><span class="field-label">Sıra</span><input type="number" id="${prefix}_sort_order" value="${row.sort_order ?? 0}"></div>
        <div><span class="field-label">Durum</span><select id="${prefix}_status">${[['draft','Taslak'],['published','Yayında']].map(([v,l])=>`<option value="${v}" ${(row.status||'draft')===v?'selected':''}>${l}</option>`).join('')}</select></div>
      </div>
    </div>`;
  }

  function openServiceEditor(group) {
    const trRow = group.tr || {};
    const enRow = group.en || {};
    const base = group.tr || group.en || {};
    const stamp = Date.now();
    const wrap = h('div', { class: 'svc-editor-wrap' });
    wrap.innerHTML = `
      <div class="form-grid" style="margin-bottom:14px">
        <div><span class="field-label">Ortak Kod</span><input id="svc_shared_code" value="${escapeHtml(group.code || base.code || base.slug || '')}" placeholder="ör. ag-og"></div>
        <div><span class="field-label">Dil Durumu</span><div style="display:flex;gap:8px;margin-top:9px"><span class="badge badge-${group.tr ? 'published' : 'draft'}">TR ${group.tr ? 'var' : 'eksik'}</span><span class="badge badge-${group.en ? 'published' : 'draft'}">EN ${group.en ? 'var' : 'eksik'}</span></div></div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px">
        <button type="button" class="btn btn-ghost btn-sm svc-lang-tab is-active" data-lang="tr">Türkçe</button>
        <button type="button" class="btn btn-ghost btn-sm svc-lang-tab" data-lang="en">English</button>
      </div>
      ${langFormHtml('tr', trRow).replace('id="svc_tr_body"', `id="svc_tr_body_${stamp}"`)}
      ${langFormHtml('en', enRow).replace('id="svc_en_body"', `id="svc_en_body_${stamp}"`)}
      <div class="modal-actions full"><button class="btn btn-ghost" id="svcCancelBtn">Vazgeç</button><button class="btn btn-primary" id="svcSaveBtn">Kaydet</button></div>`;
    const modal = openModal(base.id ? 'Hizmet Düzenle' : 'Yeni Hizmet', wrap, { width: '980px' });
    wireCoverUploaders(wrap);
    wireIconPicker(wrap);
    const trBodySel = '#svc_tr_body_' + stamp;
    const enBodySel = '#svc_en_body_' + stamp;
    mountEditor(trBodySel, trRow.body || '');
    mountEditor(enBodySel, enRow.body || '');

    const showLang = lang => {
      wrap.querySelectorAll('.svc-lang-tab').forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === lang));
      wrap.querySelectorAll('.svc-lang-panel').forEach(panel => { panel.hidden = panel.dataset.svcLang !== lang; });
    };
    wrap.querySelectorAll('.svc-lang-tab').forEach(btn => btn.onclick = () => showLang(btn.dataset.lang));
    wrap.querySelector('#svcCancelBtn').onclick = () => { destroyEditor(trBodySel); destroyEditor(enBodySel); modal.remove(); };

    const readLang = (lang, existing) => {
      const prefix = '#svc_' + lang;
      const title = wrap.querySelector(prefix + '_title').value.trim();
      if (!title && !existing) return null;
      if (!title && existing) throw new Error((lang === 'tr' ? 'TR' : 'EN') + ' başlık boş bırakılamaz');
      const iconInput = wrap.querySelector(`[data-svc-lang="${lang}"] .svc-icon-input`);
      return {
        title,
        slug: wrap.querySelector(prefix + '_slug').value.trim() || null,
        summary: wrap.querySelector(prefix + '_summary').value.trim() || null,
        icon: normalizeServiceIcon(iconInput ? iconInput.value : ''),
        cover_image: wrap.querySelector(prefix + '_cover_image').value.trim() || null,
        show_cover: wrap.querySelector(prefix + '_show_cover')?.checked ? 1 : 0,
        body: getEditorContent(lang === 'tr' ? trBodySel : enBodySel),
        sort_order: Number(wrap.querySelector(prefix + '_sort_order').value) || 0,
        status: wrap.querySelector(prefix + '_status').value,
        language: lang,
      };
    };

    wrap.querySelector('#svcSaveBtn').onclick = async () => {
      const saveBtn = wrap.querySelector('#svcSaveBtn');
      try {
        const sharedCode = wrap.querySelector('#svc_shared_code').value.trim() || trRow.code || enRow.code || trRow.slug || enRow.slug || '';
        const payloads = [
          { lang: 'tr', row: group.tr, payload: readLang('tr', group.tr) },
          { lang: 'en', row: group.en, payload: readLang('en', group.en) },
        ].filter(x => x.payload);
        if (!payloads.length) { toast('En az bir dilde başlık girin', 'error'); return; }
        saveBtn.disabled = true;
        for (const item of payloads) {
          const p = { ...item.payload, code: sharedCode || item.payload.slug || null };
          if (!p.slug) p.slug = sharedCode || p.title;
          if (item.row && item.row.id) await api.put('/api/services/' + item.row.id, p);
          else await api.post('/api/services', p);
        }
        toast('Kaydedildi', 'success');
        destroyEditor(trBodySel); destroyEditor(enBodySel); modal.remove(); load();
      } catch (e) {
        toast(e.message === 'slug_exists' ? 'Bu slug bu dilde zaten kullanılıyor' : e.message, 'error');
      } finally {
        saveBtn.disabled = false;
      }
    };
  }

  load();
};

// ============================================
// BRANDS (Markalar)
// ============================================
// Markaların ilişkilendirilebileceği hizmetler — Hizmetler sayfasından dinamik yüklenir.
// brands route'u her açıldığında /api/services/admin/all'dan doldurulur.
let BRAND_SERVICE_CODES = [];

async function loadBrandServiceCodes() {
  try {
    const r = await api.get('/api/services/admin/all');
    const seen = new Set();
    const list = [];
    (r.services || []).forEach(s => {
      const code = s.code || s.slug;
      if (!code || seen.has(code)) return;
      seen.add(code);
      list.push({ code, label: s.title || code });
    });
    if (list.length) BRAND_SERVICE_CODES = list;
  } catch { /* hizmet listesi alınamazsa boş kalır */ }
}

const _brandsPage = createCrudPage({
  title: 'Markalar',
  listUrl: '/api/brands/admin/all',
  pluralKey: 'brands',
  newButtonText: 'Yeni Marka',
  richBody: true,
  columns: [
    { label: 'İsim', render: r => `<b>${escapeHtml(r.name)}</b>` },
    { label: 'Tip', render: r => r.type === 'partner' ? 'Çözüm Ortağı' : 'Çatı Marka' },
    { label: 'Hizmetler', render: r => (r.services && r.services.length) ? escapeHtml(r.services.join(', ')) : '—' },
    { label: 'Dil', render: r => (r.language || 'tr').toUpperCase() },
    { label: 'Anasayfa', render: r => r.show_on_homepage ? '✓' : '—' },
    { label: 'Aktif', render: r => r.is_active ? '✓' : '—' },
    { label: 'Sıra', render: r => r.sort_order ?? 0 },
  ],
  buildForm: (r = {}) => {
    const wrap = h('div', { class: 'form-grid' });
    const sel = new Set(r.services || []);
    const svcChecks = BRAND_SERVICE_CODES.length
      ? BRAND_SERVICE_CODES.map(s =>
          `<label style="display:flex;gap:7px;align-items:center;font-size:13px"><input type="checkbox" name="svc_${escapeHtml(s.code)}" ${sel.has(s.code)?'checked':''} style="width:auto"> ${escapeHtml(s.label)}</label>`
        ).join('')
      : '<span style="font-size:13px;color:var(--text-dim)">Önce Hizmetler sayfasından hizmet ekleyin.</span>';
    wrap.innerHTML = `
      <div class="full"><span class="field-label">İsim *</span><input name="name" value="${escapeHtml(r.name||'')}" required></div>
      <div><span class="field-label">Tip</span><select name="type">${[['umbrella','Çatı Marka (ana sayfa)'],['partner','Çözüm Ortağı (hizmet altı)']].map(([v,l])=>`<option value="${v}" ${(r.type||'umbrella')===v?'selected':''}>${l}</option>`).join('')}</select></div>
      <div><span class="field-label">Dış Site Linki</span><input name="url" value="${escapeHtml(r.url||'')}" placeholder="https://..."></div>
      <div><span class="field-label">Ülke</span><input name="country" value="${escapeHtml(r.country||'')}" placeholder="ör. Avustralya"></div>
      <div class="full"><span class="field-label">Kısa Açıklama (kart)</span><textarea name="description" rows="2">${escapeHtml(r.description||'')}</textarea></div>
      <div class="full"><span class="field-label">İlişkili Hizmetler (çözüm ortağı olarak görüneceği hizmetler)</span>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:6px">${svcChecks}</div>
      </div>
      ${coverUploaderHtml('logo_url', r.logo_url, 'Logo')}
      ${coverUploaderHtml('cover_image', r.cover_image, 'Kapak Görseli (detay sayfası)')}
      <div class="full"><span class="field-label">Detay İçeriği (marka sayfası)</span><textarea name="body" rows="10">${escapeHtml(r.body||'')}</textarea></div>
      <div><span class="field-label">Dil</span><select name="language">${['tr','en'].map(l=>`<option value="${l}" ${(r.language||'tr')===l?'selected':''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      <div><span class="field-label">Sıra</span><input type="number" name="sort_order" value="${r.sort_order ?? 0}"></div>
      <div><label style="display:flex;gap:8px;align-items:center;margin-top:24px"><input type="checkbox" name="is_active" ${r.is_active!==0?'checked':''} style="width:auto"> Aktif</label></div>
      <div><label style="display:flex;gap:8px;align-items:center;margin-top:24px"><input type="checkbox" name="show_on_homepage" ${r.show_on_homepage?'checked':''} style="width:auto"> Ana sayfada göster</label></div>
    `;
    return wrap;
  },
  beforeSave: (payload) => {
    // svc_<kod> checkbox'larını service_codes array'ine çevir, payload'dan temizle
    const codes = [];
    BRAND_SERVICE_CODES.forEach(s => {
      const key = 'svc_' + s.code;
      if (payload[key]) codes.push(s.code);
      delete payload[key];
    });
    payload.service_codes = codes;
    return payload;
  },
  afterForm: (root) => wireCoverUploaders(root),
  saveUrl: id => id ? `/api/brands/${id}` : '/api/brands',
});

// Markalar sayfası açılmadan önce hizmet listesini yükle (dinamik checkbox'lar için)
routes.brands = async (page) => {
  await loadBrandServiceCodes();
  return _brandsPage(page);
};

// ============================================
// REFERANS LOGOLARI (Bize Güvenen Kurumlar)
// ============================================
routes.references = createCrudPage({
  title: 'Referans Logoları',
  newButtonText: 'Yeni Logo',
  listUrl: '/api/references/admin/all',
  pluralKey: 'logos',
  bodyClass: 'crud-scroll',   // uzun liste — iç scroll (başlık sabit, liste kayar)
  saveUrl: (id) => id ? `/api/references/${id}` : '/api/references',
  columns: [
    { label: 'Logo', render: r => r.logo_url ? `<img src="${escapeHtml(r.logo_url)}" style="max-height:32px;max-width:120px;object-fit:contain" alt="">` : '—' },
    { label: 'Ad', render: r => escapeHtml(r.name) },
    { label: 'Sıra', render: r => r.sort_order ?? 0 },
    { label: 'Aktif', render: r => r.is_active ? '✓' : '—' },
  ],
  richBody: false,
  buildForm: (r) => {
    const el = document.createElement('div');
    el.className = 'form-grid';
    el.innerHTML = `
      <div class="full"><span class="field-label">Kurum Adı</span><input name="name" value="${escapeHtml(r.name || '')}" required></div>
      ${coverUploaderHtml('logo_url', r.logo_url || '', 'Logo Görseli')}
      <div class="half"><span class="field-label">Web sitesi (opsiyonel)</span><input name="url" value="${escapeHtml(r.url || '')}" placeholder="https://..."></div>
      <div class="half"><span class="field-label">Sıra</span><input name="sort_order" type="number" value="${r.sort_order ?? 0}"></div>
      <div class="half"><label><input type="checkbox" name="is_active" ${r.is_active !== 0 ? 'checked' : ''}> Aktif</label></div>
    `;
    return el;
  },
  afterForm: (form, r) => {
    bindCoverUploader(form);
  },
});

// ============================================
// KİLOMETRE TAŞLARI (milestones) — timeline CRUD
// ============================================
routes.milestones = createCrudPage({
  title: 'Kilometre Taşları',
  newButtonText: 'Yeni Kilometre Taşı',
  listUrl: '/api/milestones/admin/all',
  pluralKey: 'milestones',
  saveUrl: (id) => id ? `/api/milestones/${id}` : '/api/milestones',
  richBody: false,
  columns: [
    { label: 'Yıl', render: r => `<b>${escapeHtml(r.year)}</b>` },
    { label: 'Başlık', render: r => escapeHtml(r.title) },
    { label: 'İkon', render: r => `<span class="material-symbols-rounded" style="font-size:20px">${escapeHtml(r.icon||'flag')}</span>` },
    { label: 'Dil', render: r => (r.language || 'tr').toUpperCase() },
    { label: 'Sıra', render: r => r.sort_order ?? 0 },
    { label: 'Aktif', render: r => r.is_active ? '✓' : '—' },
  ],
  buildForm: (r) => {
    const el = document.createElement('div');
    el.className = 'form-grid';
    el.innerHTML = `
      <div class="half"><span class="field-label">Yıl *</span><input name="year" value="${escapeHtml(r.year||'')}" placeholder="ör. 2025" required></div>
      <div class="half"><span class="field-label">Başlık *</span><input name="title" value="${escapeHtml(r.title||'')}" placeholder="ör. Smilics Temsilciliği" required></div>
      <div class="full"><span class="field-label">Açıklama</span><input name="description" value="${escapeHtml(r.description||'')}" placeholder="Kısa açıklama"></div>
      <div class="half"><span class="field-label">Material Icon</span><input name="icon" value="${escapeHtml(r.icon||'flag')}" placeholder="flag, bolt, handshake..."><small style="color:var(--text-dim)"><a href="https://fonts.google.com/icons" target="_blank" rel="noopener">İkon listesi</a></small></div>
      <div class="half"><span class="field-label">Dil</span><select name="language">${['tr','en'].map(l=>`<option value="${l}" ${(r.language||'tr')===l?'selected':''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      <div class="half"><span class="field-label">Sıra</span><input name="sort_order" type="number" value="${r.sort_order ?? 0}"></div>
      <div class="half"><label style="display:flex;gap:8px;align-items:center;margin-top:24px"><input type="checkbox" name="is_active" ${r.is_active!==0?'checked':''} style="width:auto"> Aktif</label></div>
    `;
    return el;
  },
});

// ============================================
// DUYURULAR (announcements) — blog benzeri CRUD
// ============================================
routes.announcements = createCrudPage({
  title: 'Duyurular',
  listUrl: '/api/announcements/admin/all',
  pluralKey: 'announcements',
  newButtonText: 'Yeni Duyuru',
  richBody: true,
  columns: [
    { label: 'Başlık', render: r => `<b>${escapeHtml(r.title)}</b><br><span style="font-size:11px;color:var(--text-dim)">${escapeHtml(r.slug||'')}</span>` },
    { label: 'Dil', render: r => (r.language || 'tr').toUpperCase() },
    { label: 'Durum', render: r => r.status === 'published' ? '<span class="badge badge-published">Yayında</span>' : '<span class="badge badge-draft">Taslak</span>' },
    { label: 'Popup', render: r => r.is_popup ? '<span class="badge badge-open">Popup</span>' : '—' },
    { label: 'Tarih', render: r => r.published_at ? new Date(r.published_at).toLocaleDateString('tr-TR') : '—' },
  ],
  buildForm: (r = {}) => {
    const wrap = h('div', { class: 'form-grid' });
    wrap.innerHTML = `
      <div class="full"><span class="field-label">Başlık *</span><input name="title" value="${escapeHtml(r.title||'')}" required></div>
      <div><span class="field-label">Slug</span><input name="slug" value="${escapeHtml(r.slug||'')}" placeholder="boş = başlıktan üretilir"></div>
      <div><span class="field-label">Dil</span><select name="language">${['tr','en'].map(l=>`<option value="${l}" ${(r.language||'tr')===l?'selected':''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      <div class="full"><span class="field-label">Özet (kart açıklaması)</span><textarea name="excerpt" rows="2">${escapeHtml(r.excerpt||'')}</textarea></div>
      <div class="full"><span class="field-label">İçerik</span><textarea name="body" rows="10">${escapeHtml(r.body||'')}</textarea></div>
      <div><span class="field-label">Durum</span><select name="status">${[['draft','Taslak'],['published','Yayında']].map(([v,l])=>`<option value="${v}" ${(r.status||'draft')===v?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="full"><label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" name="is_popup" ${r.is_popup?'checked':''} style="width:auto"> Sayfa açılınca popup olarak göster</label></div>
    `;
    return wrap;
  },
  saveUrl: id => id ? `/api/announcements/${id}` : '/api/announcements',
});

// ============================================
// RANDEVU KONULARI — basit CRUD
// ============================================
routes['appointment-topics'] = createCrudPage({
  title: 'Randevu Konuları',
  listUrl: '/api/appointments/admin/topics',
  pluralKey: 'topics',
  newButtonText: 'Yeni Konu',
  richBody: false,
  columns: [
    { label: 'Başlık', render: r => `<b>${escapeHtml(r.title)}</b>` },
    { label: 'Bildirim E-postası', render: r => r.notify_email ? escapeHtml(r.notify_email) : '<span style="color:var(--text-dim)">genel adrese</span>' },
    { label: 'Sıra', render: r => r.sort_order ?? 0 },
    { label: 'Aktif', render: r => r.is_active ? '✓' : '—' },
  ],
  buildForm: (r = {}) => {
    const wrap = h('div', { class: 'form-grid' });
    wrap.innerHTML = `
      <div class="full"><span class="field-label">Başlık *</span><input name="title" value="${escapeHtml(r.title||'')}" placeholder="ör. Recloser Sistemleri" required></div>
      <div class="full"><span class="field-label">Bildirim E-postası <small style="color:var(--text-dim)">bu konuda randevu gelince mail buraya gider — boşsa genel adrese düşer</small></span><input type="email" name="notify_email" value="${escapeHtml(r.notify_email||'')}" placeholder="ör. otomasyon@formelektrik.com"></div>
      <div><span class="field-label">Sıra</span><input type="number" name="sort_order" value="${r.sort_order ?? 0}"></div>
      <div><label style="display:flex;gap:8px;align-items:center;margin-top:24px"><input type="checkbox" name="is_active" ${r.is_active!==0?'checked':''} style="width:auto"> Aktif</label></div>
    `;
    return wrap;
  },
  saveUrl: id => id ? `/api/appointments/admin/topics/${id}` : '/api/appointments/admin/topics',
});

// ============================================
// KARİYER — İş İlanları CRUD
// ============================================
routes.careers = createCrudPage({
  title: 'İş İlanları',
  listUrl: '/api/careers/admin/jobs',
  pluralKey: 'jobs',
  newButtonText: 'Yeni İlan',
  richBody: true,
  inline: true,
  columns: [
    { label: 'Başlık', render: r => `<b>${escapeHtml(r.title)}</b>` },
    { label: 'Departman', render: r => escapeHtml(r.department || '—') },
    { label: 'Konum', render: r => escapeHtml(r.location || '—') },
    { label: 'Tip', render: r => escapeHtml(r.type || '—') },
    { label: 'Aktif', render: r => r.is_active ? '✓' : '—' },
    { label: 'Sıra', render: r => r.sort_order ?? 0 },
  ],
  buildForm: (r = {}) => {
    const wrap = h('div', { class: 'form-grid' });
    wrap.innerHTML = `
      <div class="full"><span class="field-label">İlan Başlığı *</span><input name="title" value="${escapeHtml(r.title||'')}" placeholder="ör. Elektrik Mühendisi" required></div>
      <div><span class="field-label">Departman</span><input name="department" value="${escapeHtml(r.department||'')}" placeholder="ör. Mühendislik"></div>
      <div><span class="field-label">Konum</span><input name="location" value="${escapeHtml(r.location||'')}" placeholder="ör. Ankara"></div>
      <div><span class="field-label">Çalışma Tipi</span><input name="type" value="${escapeHtml(r.type||'')}" placeholder="ör. Tam zamanlı / Staj"></div>
      <div><span class="field-label">Sıra</span><input type="number" name="sort_order" value="${r.sort_order ?? 0}"></div>
      <div class="full"><span class="field-label">Kısa Özet</span><textarea name="summary" rows="2" placeholder="Listede görünen kısa açıklama">${escapeHtml(r.summary||'')}</textarea></div>
      <div class="full"><span class="field-label">Detaylı Açıklama</span><textarea name="body" rows="8">${escapeHtml(r.body||'')}</textarea></div>
      <div><label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" name="is_active" ${r.is_active!==0?'checked':''} style="width:auto"> Aktif (sitede göster)</label></div>
    `;
    return wrap;
  },
  saveUrl: id => id ? `/api/careers/admin/jobs/${id}` : '/api/careers/admin/jobs',
});

// ============================================
// KARİYER — Başvurular listesi
// ============================================
routes['job-applications'] = async (page) => {
  page.innerHTML = '';
  const card = h('div', { class: 'card card-flush' },
    h('div', { class: 'crud-card-head' }, h('h3', { class: 'crud-card-title' }, 'Başvurular')));
  const body = h('div', { class: 'crud-card-body' });
  card.appendChild(body);
  page.appendChild(card);
  body.innerHTML = '<div class="loader">Yükleniyor...</div>';

  const statusLabels = { new: '🆕 Yeni', reviewing: '👀 İnceleniyor', shortlisted: '⭐ Kısa liste', rejected: '✗ Reddedildi', hired: '✓ İşe alındı' };
  async function load() {
    const { applications } = await api.get('/api/careers/admin/applications');
    if (!applications.length) {
      body.innerHTML = '<div class="empty"><span class="material-symbols-rounded">inbox</span><p>Henüz başvuru yok.</p></div>';
      return;
    }
    body.innerHTML = '';
    const t = h('table', { class: 'table' });
    t.innerHTML = '<thead><tr><th>Tarih</th><th>Pozisyon</th><th>Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>CV</th><th>Durum</th><th></th></tr></thead>';
    const tbody = h('tbody');
    applications.forEach(a => {
      const tr = h('tr');
      const date = (a.created_at || '').slice(0, 10);
      const statusSel = ['new','reviewing','shortlisted','rejected','hired']
        .map(s => `<option value="${s}" ${a.status===s?'selected':''}>${statusLabels[s]}</option>`).join('');
      tr.innerHTML = `
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(a.job_title || 'Genel Başvuru')}</td>
        <td><b>${escapeHtml(a.first_name)} ${escapeHtml(a.last_name)}</b>${a.message ? `<div class="app-msg" data-msg="${a.id}" title="Tam mesajı görüntüle" style="color:var(--text-dim);font-size:11px;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer">${escapeHtml(a.message)}</div>` : ''}</td>
        <td><a href="mailto:${escapeHtml(a.email)}">${escapeHtml(a.email)}</a></td>
        <td>${escapeHtml(a.phone || '—')}</td>
        <td>${a.cv_url ? `<a class="btn btn-sm btn-ghost" href="${escapeHtml(a.cv_url)}" target="_blank" rel="noopener"><span class="material-symbols-rounded">download</span> CV</a>` : '—'}</td>
        <td><select class="post-toolbar-select" data-status="${a.id}">${statusSel}</select></td>
        <td class="row-actions"><button class="btn btn-sm btn-ghost" data-del="${a.id}" style="color:var(--danger)"><span class="material-symbols-rounded">delete</span></button></td>`;
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    body.appendChild(t);

    body.querySelectorAll('.app-msg').forEach(el => el.addEventListener('click', () => {
      const a = applications.find(x => String(x.id) === el.dataset.msg);
      if (!a) return;
      const c = h('div', { style: 'white-space:pre-wrap;line-height:1.6;color:var(--text)' }, a.message);
      openModal(`${a.first_name} ${a.last_name} — Mesaj`, c, { width: '560px' });
    }));

    body.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
      try { await api.patch(`/api/careers/admin/applications/${sel.dataset.status}`, { status: sel.value }); toast('Durum güncellendi', 'success'); }
      catch (e) { toast(e.message, 'error'); }
    }));
    body.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
      if (await confirmDialog('Bu başvuru silinsin mi?')) {
        await api.del(`/api/careers/admin/applications/${btn.dataset.del}`);
        toast('Silindi', 'success'); load();
      }
    }));
  }
  load();
};

// ============================================
// PROJECTS (Referans Projeler) — özel editör + galeri
// ============================================
routes.projects = async (page) => {
  const hashParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const editId = hashParams.get('edit');
  const isNew = hashParams.get('new') === '1';
  if (editId || isNew) {
    await renderProjectEditor(page, editId ? Number(editId) : null);
  } else {
    await renderProjectList(page);
  }
};

async function renderProjectList(page) {
  page.innerHTML = '';
  const newBtn = h('button', { class: 'btn btn-primary btn-sm',
    onClick: () => navigateWithParams('projects', { new: '1' }) },
    h('span', { class: 'material-symbols-rounded' }, 'add'), 'Yeni Proje');
  const cardHead = h('div', { class: 'crud-card-head' },
    h('h3', { class: 'crud-card-title' }, 'Referans Projeler'), newBtn);
  const card = h('div', { class: 'card card-flush' }, cardHead);
  const body = h('div', { class: 'crud-card-body' });
  card.appendChild(body);
  page.appendChild(card);
  body.innerHTML = '<div class="loader">Yükleniyor...</div>';

  const { projects } = await api.get('/api/projects/admin/all');
  if (!projects.length) {
    body.innerHTML = `<div class="empty"><span class="material-symbols-rounded">apartment</span><p>Henüz proje yok.</p></div>`;
    return;
  }
  body.innerHTML = '';
  const t = h('table', { class: 'table' });
  t.innerHTML = `<thead><tr><th>Başlık</th><th>Özellikler</th><th>Kategori</th><th>Dil</th><th>Öne Çıkan</th><th>Durum</th><th></th></tr></thead>`;
  const tbody = h('tbody');
  // specs JSON'undan kısa özet (ilk 2 özellik); yoksa eski alanlara düş
  const specsSummary = (r) => {
    let arr = [];
    if (r.specs) { try { arr = JSON.parse(r.specs); } catch { arr = []; } }
    if (!Array.isArray(arr) || !arr.length) {
      arr = [];
      if (r.client) arr.push({ label: 'Müşteri', value: r.client });
      if (r.location) arr.push({ label: 'Konum', value: r.location });
      if (r.year) arr.push({ label: 'Yıl', value: r.year });
    }
    if (!arr.length) return '—';
    const shown = arr.slice(0, 2).map(s => escapeHtml(s.value)).join(', ');
    return shown + (arr.length > 2 ? ` <span style="color:var(--text-dim)">+${arr.length - 2}</span>` : '');
  };
  projects.forEach(r => {
    const tr = h('tr', { style: 'cursor:pointer',
      onClick: e => { if (!e.target.closest('.row-actions')) navigateWithParams('projects', { edit: r.id }); } });
    tr.innerHTML = `
      <td><b>${escapeHtml(r.title)}</b><div style="color:var(--text-dim);font-size:11px">${escapeHtml(r.slug || '')}</div></td>
      <td>${specsSummary(r)}</td>
      <td>${escapeHtml(r.category || '—')}</td>
      <td>${(r.language || 'tr').toUpperCase()}</td>
      <td>${r.is_featured ? '★' : '—'}</td>
      <td><span class="badge badge-${r.status}">${label(r.status)}</span></td>
    `;
    const act = h('td');
    const edit = h('button', { class: 'btn btn-ghost btn-sm', title: 'Düzenle',
      onClick: e => { e.stopPropagation(); navigateWithParams('projects', { edit: r.id }); } },
      h('span', { class: 'material-symbols-rounded' }, 'edit'));
    const del = h('button', { class: 'btn btn-danger btn-sm', title: 'Sil', onClick: async e => {
      e.stopPropagation();
      if (await confirmDialog('Bu proje silinsin mi?')) {
        await api.del(`/api/projects/${r.id}`);
        toast('Silindi', 'success');
        renderProjectList(page);
      }
    }}, h('span', { class: 'material-symbols-rounded' }, 'delete'));
    act.appendChild(h('div', { class: 'row-actions' }, edit, del));
    tr.appendChild(act);
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  body.appendChild(t);
}

async function renderProjectEditor(page, id) {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let record = {};
  let images = [];
  let savedBrandIds = [];
  if (id) {
    const data = await api.get('/api/projects/admin/' + id);
    record = data.project || {};
    images = data.images || [];
    savedBrandIds = data.brand_ids || [];
  }

  page.innerHTML = '';

  const back = h('a', { class: 'btn btn-ghost btn-sm',
    onClick: e => { e.preventDefault(); navigateWithParams('projects', {}); }, href: '#' },
    h('span', { class: 'material-symbols-rounded' }, 'arrow_back'), 'Listeye dön');

  const statusSel = h('select', { id: 'pjStatus', class: 'post-toolbar-select' },
    h('option', { value: 'draft', ...(record.status==='draft'?{selected:''}:{}) }, '📝 Taslak'),
    h('option', { value: 'published', ...(record.status==='published'?{selected:''}:{}) }, '✓ Yayında'));

  const langSel = h('select', { id: 'pjLang', class: 'post-toolbar-select post-toolbar-lang' },
    ...['tr','en'].map(l => h('option', { value: l, ...((record.language||'tr')===l?{selected:''}:{}) }, l.toUpperCase())));

  const saveBtn = h('button', { class: 'btn btn-primary' },
    h('span', { class: 'material-symbols-rounded' }, 'save'), 'Kaydet');

  const delBtnTop = id ? h('button', { class: 'btn btn-danger', title: 'Sil',
    onClick: async () => {
      if (await confirmDialog('Bu proje silinsin mi?')) {
        await api.del(`/api/projects/${id}`);
        toast('Silindi', 'success');
        navigateWithParams('projects', {});
      }
    } }, h('span', { class: 'material-symbols-rounded' }, 'delete')) : null;

  const head = h('div', { class: 'post-editor-toolbar' },
    back, h('div', { class: 'post-toolbar-spacer' }), langSel, statusSel, saveBtn, delBtnTop);
  page.appendChild(head);

  const card = h('div', { class: 'card', style: 'padding:0;overflow:hidden' });
  const editorGrid = h('div', { class: 'post-editor-grid' });
  editorGrid.innerHTML = `
    <aside class="post-editor-side">
      <h3 class="post-editor-side-title">Proje Ayarları</h3>
      <div class="field-block">
        <span class="field-label">Slug (boş = başlıktan üretilir)</span>
        <input id="pjSlug" value="${escapeHtml(record.slug||'')}" placeholder="ornek-proje">
      </div>
      <div class="field-block">
        <span class="field-label">Kategori <small style="color:var(--text-dim)">filtre/etiket için</small></span>
        <input id="pjCategory" value="${escapeHtml(record.category||'')}" placeholder="ör. GES">
      </div>
      <div class="field-block">
        <span class="field-label">Özellikler</span>
        <div id="pjSpecsList" class="spec-list"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="pjSpecAdd" style="align-self:flex-start;margin-top:6px">
          <span class="material-symbols-rounded">add</span> Özellik Ekle
        </button>
      </div>
      <div class="field-block">
        <span class="field-label">Özet</span>
        <textarea id="pjSummary" rows="3" placeholder="Kısa özet metni...">${escapeHtml(record.summary||'')}</textarea>
      </div>
      <div class="field-block">
        <span class="field-label">Kapak Görseli</span>
        <div class="cover-uploader" id="pjCoverUploader">
          <div class="cover-preview${record.cover_image ? '' : ' is-empty'}" id="pjCoverPreview">
            ${record.cover_image
              ? `<img src="${escapeHtml(record.cover_image)}" alt="Kapak görseli">`
              : `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`}
          </div>
          <div class="cover-uploader-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="pjCoverUploadBtn">
              <span class="material-symbols-rounded">upload</span> Görsel Yükle
            </button>
            <button type="button" class="btn btn-ghost btn-sm" id="pjCoverClearBtn" ${record.cover_image ? '' : 'style="display:none"'}>
              <span class="material-symbols-rounded">delete</span> Kaldır
            </button>
          </div>
          <input type="file" id="pjCoverFile" accept="image/*" hidden>
          <input id="pjCover" value="${escapeHtml(record.cover_image||'')}" placeholder="veya URL girin: /assets/..." class="cover-url-input">
        </div>
      </div>
      <label class="cover-toggle">
        <input type="checkbox" id="pjFeatured" ${record.is_featured ? 'checked' : ''}>
        <span>Öne çıkan proje</span>
      </label>
      <div class="field-block">
        <span class="field-label">Sıra</span>
        <input type="number" id="pjSort" value="${record.sort_order ?? 0}">
      </div>
      <div class="field-block">
        <span class="field-label">İlişkili Markalar</span>
        <div id="pjBrandsList" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px"></div>
      </div>
      ${id ? `
      <div class="field-block" style="margin-top:auto;padding-top:18px;border-top:1px solid var(--border);font-size:12px;color:var(--text-dim)">
        <div>Oluşturuldu: ${fmtDate(record.created_at)}</div>
        <div>Güncellendi: ${fmtDate(record.updated_at)}</div>
      </div>` : ''}
    </aside>
    <main class="post-editor-main">
      <input id="pjTitle" class="post-title-input" value="${escapeHtml(record.title||'')}" placeholder="Proje başlığı..." required>
      <textarea id="pjBody" class="post-body-input">${escapeHtml(record.body||'')}</textarea>
      <div class="field-block" style="margin-top:18px" id="pjGallery">
        <span class="field-label">Galeri Görselleri</span>
        <div id="pjGalleryBody"></div>
      </div>
    </main>
  `;
  card.appendChild(editorGrid);
  page.appendChild(card);

  // === Esnek özellikler (ikon + etiket + değer dinamik listesi) ===
  const specsList = page.querySelector('#pjSpecsList');
  // Seçilebilir ikon paleti (Material Symbols)
  const SPEC_ICONS = ['label','business','location_on','calendar_today','bolt','solar_power',
    'battery_charging_full','ev_station','factory','engineering','straighten','schedule',
    'check_circle','groups','public','settings_input_component','electric_meter','foundation',
    'apartment','timer','category','workspace_premium'];
  // Etikete göre akıllı varsayılan ikon (kullanıcı değiştirebilir)
  function guessIcon(label) {
    const k = String(label || '').toLocaleLowerCase('tr');
    if (k.includes('müşteri') || k.includes('musteri') || k.includes('client') || k.includes('işveren')) return 'business';
    if (k.includes('konum') || k.includes('şehir') || k.includes('sehir') || k.includes('saha') || k.includes('location')) return 'location_on';
    if (k.includes('yıl') || k.includes('yil') || k.includes('tarih') || k.includes('year')) return 'calendar_today';
    if (k.includes('kapasite') || k.includes('güç') || k.includes('guc') || k.includes('gerilim') || k.includes('kv') || k.includes('mw')) return 'bolt';
    if (k.includes('süre') || k.includes('sure') || k.includes('zaman')) return 'schedule';
    return 'label';
  }
  function initialSpecs() {
    let arr = [];
    if (record.specs) { try { arr = JSON.parse(record.specs); } catch { arr = []; } }
    if (!Array.isArray(arr) || !arr.length) {
      arr = [];
      if (record.client)   arr.push({ label: 'Müşteri',  value: record.client,   icon: 'business' });
      if (record.location) arr.push({ label: 'Konum',    value: record.location, icon: 'location_on' });
      if (record.year)     arr.push({ label: 'Yıl',      value: record.year,     icon: 'calendar_today' });
      if (record.capacity) arr.push({ label: 'Kapasite', value: record.capacity, icon: 'bolt' });
    }
    return arr;
  }
  function addSpecRow(label = '', value = '', icon = '') {
    const row = h('div', { class: 'spec-row' });
    const ico = icon || guessIcon(label);
    row.innerHTML = `
      <div class="spec-icon-picker">
        <button type="button" class="spec-icon-btn" title="İkon seç"><span class="material-symbols-rounded spec-icon-current">${escapeHtml(ico)}</span></button>
        <input type="hidden" class="spec-icon" value="${escapeHtml(ico)}">
        <div class="spec-icon-menu" hidden>
          ${SPEC_ICONS.map(n => `<button type="button" class="spec-icon-opt" data-icon="${n}" title="${n}"><span class="material-symbols-rounded">${n}</span></button>`).join('')}
        </div>
      </div>
      <input class="spec-label" placeholder="Etiket" value="${escapeHtml(label)}">
      <input class="spec-value" placeholder="Değer" value="${escapeHtml(value)}">
      <button type="button" class="btn btn-ghost btn-sm spec-del" title="Kaldır"><span class="material-symbols-rounded">close</span></button>`;
    const iconInput = row.querySelector('.spec-icon');
    const iconCur = row.querySelector('.spec-icon-current');
    const iconBtn = row.querySelector('.spec-icon-btn');
    const menu = row.querySelector('.spec-icon-menu');
    const labelInput = row.querySelector('.spec-label');
    let userPicked = !!icon;
    iconBtn.onclick = (e) => {
      e.stopPropagation();
      specsList.querySelectorAll('.spec-icon-menu').forEach(m => { if (m !== menu) m.hidden = true; });
      menu.hidden = !menu.hidden;
    };
    menu.querySelectorAll('.spec-icon-opt').forEach(opt => {
      opt.onclick = () => {
        const n = opt.dataset.icon;
        iconInput.value = n; iconCur.textContent = n; userPicked = true; menu.hidden = true;
      };
    });
    // Etiket yazılırken kullanıcı ikon seçmediyse akıllı tahmin uygula
    labelInput.addEventListener('input', () => {
      if (userPicked) return;
      const g = guessIcon(labelInput.value);
      iconInput.value = g; iconCur.textContent = g;
    });
    row.querySelector('.spec-del').onclick = () => row.remove();
    specsList.appendChild(row);
  }
  function readSpecs() {
    return Array.from(specsList.querySelectorAll('.spec-row')).map(r => ({
      label: r.querySelector('.spec-label').value.trim(),
      value: r.querySelector('.spec-value').value.trim(),
      icon: (r.querySelector('.spec-icon').value || 'label').trim(),
    })).filter(x => x.label && x.value);
  }
  initialSpecs().forEach(s => addSpecRow(s.label, s.value, s.icon));
  if (!specsList.children.length) addSpecRow();
  page.querySelector('#pjSpecAdd').onclick = () => addSpecRow();
  // Dışarı tıklayınca ikon menülerini kapat
  document.addEventListener('click', () => specsList.querySelectorAll('.spec-icon-menu').forEach(m => m.hidden = true));

  // === İlişkili markalar (checkbox listesi) ===
  const brandsList = page.querySelector('#pjBrandsList');
  (async () => {
    try {
      const { brands } = await api.get('/api/brands/admin/all');
      if (!brands || !brands.length) { brandsList.innerHTML = '<span style="font-size:12px;color:var(--text-dim)">Henüz marka yok</span>'; return; }
      brands.forEach(b => {
        const lbl = h('label', { style: 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer' });
        const cb = h('input', { type: 'checkbox', value: String(b.id), class: 'pj-brand-cb' });
        if (savedBrandIds.includes(b.id)) cb.checked = true;
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(b.name + (b.type === 'partner' ? ' (Çözüm Ortağı)' : '')));
        brandsList.appendChild(lbl);
      });
    } catch { brandsList.innerHTML = '<span style="font-size:12px;color:var(--text-dim)">Markalar yüklenemedi</span>'; }
  })();
  function readBrandIds() {
    return Array.from(page.querySelectorAll('.pj-brand-cb:checked')).map(cb => Number(cb.value));
  }

  // === Kapak görseli yükle / önizle / kaldır ===
  const coverInput = page.querySelector('#pjCover');
  const coverFile = page.querySelector('#pjCoverFile');
  const coverPreview = page.querySelector('#pjCoverPreview');
  const coverUploadBtn = page.querySelector('#pjCoverUploadBtn');
  const coverClearBtn = page.querySelector('#pjCoverClearBtn');

  function renderCoverPreview(url) {
    if (url) {
      coverPreview.classList.remove('is-empty');
      coverPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="Kapak görseli">`;
      coverClearBtn.style.display = '';
    } else {
      coverPreview.classList.add('is-empty');
      coverPreview.innerHTML = `<span class="material-symbols-rounded">add_photo_alternate</span><span class="cover-hint">Görsel seçilmedi</span>`;
      coverClearBtn.style.display = 'none';
    }
  }
  coverUploadBtn.onclick = () => coverFile.click();
  coverClearBtn.onclick = () => { coverInput.value = ''; renderCoverPreview(''); };
  coverInput.addEventListener('input', () => renderCoverPreview(coverInput.value.trim()));
  coverFile.onchange = async () => {
    const file = coverFile.files && coverFile.files[0];
    if (!file) return;
    coverUploadBtn.disabled = true;
    const original = coverUploadBtn.innerHTML;
    coverUploadBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Yükleniyor...';
    try {
      const url = await uploadFile(file);
      coverInput.value = url;
      renderCoverPreview(url);
      toast('Kapak görseli yüklendi', 'success');
    } catch (e) {
      toast(e.message || 'Yükleme başarısız', 'error');
    } finally {
      coverUploadBtn.disabled = false;
      coverUploadBtn.innerHTML = original;
      coverFile.value = '';
    }
  };

  // === Galeri ===
  const galleryBody = page.querySelector('#pjGalleryBody');
  function renderGallery() {
    galleryBody.innerHTML = '';
    if (!id) {
      galleryBody.appendChild(h('p', { style: 'font-size:12px;color:var(--text-dim)' },
        'Galeri görseli eklemek için önce projeyi kaydedin.'));
      return;
    }
    const grid = h('div', { class: 'project-gallery-grid',
      style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:8px' });
    images.forEach(img => {
      const cell = h('div', { style: 'position:relative;border:1px solid var(--border);border-radius:8px;overflow:hidden;aspect-ratio:4/3' });
      cell.innerHTML = `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption||'')}" style="width:100%;height:100%;object-fit:cover;display:block">`;
      const del = h('button', { class: 'btn btn-danger btn-sm', title: 'Sil',
        style: 'position:absolute;top:4px;right:4px;padding:2px 6px',
        onClick: async () => {
          if (!(await confirmDialog('Bu görsel silinsin mi?'))) return;
          try {
            await api.del(`/api/projects/${id}/images/${img.id}`);
            images = images.filter(x => x.id !== img.id);
            renderGallery();
            toast('Görsel silindi', 'success');
          } catch (e) { toast(e.message || 'Silinemedi', 'error'); }
        } }, h('span', { class: 'material-symbols-rounded', style: 'font-size:16px' }, 'delete'));
      cell.appendChild(del);
      grid.appendChild(cell);
    });
    const addBtn = h('button', { class: 'btn btn-ghost', style: 'aspect-ratio:4/3;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;border:1px dashed var(--border)',
      onClick: () => galleryFile.click() },
      h('span', { class: 'material-symbols-rounded' }, 'add_photo_alternate'),
      h('span', { style: 'font-size:12px' }, 'Görsel Ekle'));
    grid.appendChild(addBtn);
    galleryBody.appendChild(grid);
  }
  const galleryFile = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none' });
  galleryFile.onchange = async () => {
    const files = Array.from(galleryFile.files || []);
    if (!files.length || !id) return;
    let added = 0;
    for (const f of files) {
      try {
        const url = await uploadFile(f);
        const res = await api.post(`/api/projects/${id}/images`, { url, caption: null, sort_order: images.length + added });
        images.push({ id: res.id, url, caption: null, sort_order: images.length + added });
        added++;
      } catch (e) { toast(e.message || 'Görsel eklenemedi', 'error'); }
    }
    if (added) { toast(`${added} görsel eklendi`, 'success'); renderGallery(); }
    galleryFile.value = '';
  };
  page.appendChild(galleryFile);
  renderGallery();

  // TinyMCE
  destroyEditor('#pjBody');
  mountEditor('#pjBody', record.body || '');

  page.querySelector('#pjTitle').focus();

  saveBtn.onclick = async () => {
    const payload = {
      title: page.querySelector('#pjTitle').value.trim(),
      slug: page.querySelector('#pjSlug').value.trim() || null,
      category: page.querySelector('#pjCategory').value.trim() || null,
      specs: readSpecs(),
      summary: page.querySelector('#pjSummary').value.trim() || null,
      body: getEditorContent('#pjBody'),
      cover_image: page.querySelector('#pjCover').value.trim() || null,
      is_featured: page.querySelector('#pjFeatured').checked ? 1 : 0,
      sort_order: Number(page.querySelector('#pjSort').value) || 0,
      status: statusSel.value,
      language: langSel.value,
      brand_ids: readBrandIds(),
    };
    if (!payload.title) { toast('Başlık zorunlu', 'error'); return; }
    saveBtn.disabled = true;
    try {
      if (id) {
        await api.put(`/api/projects/${id}`, payload);
        toast('Kaydedildi', 'success');
      } else {
        const res = await api.post('/api/projects', payload);
        toast('Oluşturuldu — galeri için düzenlemeye geçildi', 'success');
        destroyEditor('#pjBody');
        navigateWithParams('projects', { edit: res.id });
        return;
      }
    } catch (e) {
      toast(e.message === 'slug_exists' ? 'Bu slug zaten kullanılıyor' : e.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  };
}

// ============================================
// APPOINTMENTS — randevu yönetimi + slot oluşturma
// ============================================
function openConfirmDialog() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'appt-confirm-overlay';
    overlay.innerHTML = `
      <div class="appt-confirm-dialog">
        <button class="appt-confirm-close" type="button" aria-label="Kapat">
          <span class="material-symbols-rounded">close</span>
        </button>
        <h3 style="margin:0 0 6px;font-size:18px">Randevuyu Onayla</h3>
        <p style="margin:0 0 18px;font-size:13px;color:var(--text-dim)">Müşteriye onay maili (takvim daveti ekli) gönderilecek.</p>
        <label class="field-block">
          <span class="field-label">Microsoft Teams Toplantı Linki</span>
          <input id="dlgMeetingLink" type="url" placeholder="https://teams.microsoft.com/l/meetup-join/..." autofocus>
          <small style="color:var(--text-dim);font-size:11px;margin-top:4px;display:block">Outlook'tan Teams toplantısı oluşturup linkini buraya yapıştırın</small>
        </label>
        <label class="field-block" style="margin-top:12px">
          <span class="field-label">CC E-posta (opsiyonel)</span>
          <input id="dlgCcEmail" type="email" placeholder="ekipuyesi@formelektrik.com">
        </label>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
          <button type="button" class="btn btn-ghost" id="dlgCancel">Vazgeç</button>
          <button type="button" class="btn btn-primary" id="dlgConfirm">
            <span class="material-symbols-rounded">send</span> Onayla ve Gönder
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector('.appt-confirm-close').onclick = () => close(null);
    overlay.querySelector('#dlgCancel').onclick = () => close(null);
    overlay.querySelector('#dlgConfirm').onclick = () => {
      const meetingLink = overlay.querySelector('#dlgMeetingLink').value.trim();
      const ccEmail = overlay.querySelector('#dlgCcEmail').value.trim();
      close({ meetingLink, ccEmail });
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
  });
}

routes.appointments = async (page) => {
  page.innerHTML = '';

  // Tab bar: Randevular | Slot Yönetimi
  const tabs = h('div', { class: 'appt-tabs' },
    h('button', { class: 'appt-tab is-active', 'data-tab': 'list' }, 'Randevular'),
    h('button', { class: 'appt-tab', 'data-tab': 'slots' }, 'Müsait Slotlar'));
  page.appendChild(tabs);

  const listPanel = h('div', { class: 'appt-panel', id: 'apptListPanel' });
  const slotsPanel = h('div', { class: 'appt-panel', id: 'apptSlotsPanel', style: 'display:none' });
  page.appendChild(listPanel);
  page.appendChild(slotsPanel);

  tabs.querySelectorAll('.appt-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.appt-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      listPanel.style.display = tab.dataset.tab === 'list' ? '' : 'none';
      slotsPanel.style.display = tab.dataset.tab === 'slots' ? '' : 'none';
    });
  });

  // === Randevu Listesi ===
  async function loadAppointments() {
    listPanel.innerHTML = '<div class="loader">Yükleniyor...</div>';
    try {
      const { appointments } = await api.get('/api/appointments?limit=100');
      if (!appointments.length) {
        listPanel.innerHTML = '<div class="empty"><span class="material-symbols-rounded">event_busy</span><p>Henüz randevu yok.</p></div>';
        return;
      }
      const t = h('table', { class: 'table' });
      t.innerHTML = '<thead><tr><th>Tarih</th><th>Saat</th><th>Konu</th><th>Ad Soyad</th><th>E-posta</th><th>Şirket</th><th>Durum</th><th></th></tr></thead>';
      const tbody = h('tbody');
      const statusLabels = { pending: '⏳ Bekliyor', confirmed: '✓ Onaylandı', completed: '✓ Tamamlandı', cancelled: '✗ İptal' };
      const statusColors = { pending: '#f59e0b', confirmed: '#10b981', completed: '#6b7280', cancelled: '#ef4444' };
      const productNames = { grid: 'Grid', solar: 'GES', ems: 'BESS', microgrid: 'Microgrid', ev: 'EV Charge', asset: 'Asset', other: 'Genel' };
      appointments.forEach(a => {
        const tr = h('tr');
        const prodLabel = a.topics ? a.topics : (productNames[(a.product || '').toLowerCase()] || (a.product || '-'));
        tr.innerHTML = `
          <td>${escapeHtml(a.slot_date || '')}</td>
          <td><b>${escapeHtml(a.slot_time || '')}</b></td>
          <td>${escapeHtml(prodLabel)}</td>
          <td>${escapeHtml(a.first_name)} ${escapeHtml(a.last_name)}</td>
          <td>${escapeHtml(a.email)}</td>
          <td>${escapeHtml(a.company || '-')}</td>
          <td><span style="color:${statusColors[a.status] || '#fff'}">${statusLabels[a.status] || a.status}</span></td>
          <td class="row-actions">
            ${a.status === 'pending' ? `<button class="btn btn-sm btn-primary" data-confirm="${a.id}">Onayla</button>` : ''}
            ${a.status !== 'cancelled' && a.status !== 'completed' ? `<button class="btn btn-sm btn-ghost" data-cancel="${a.id}">İptal</button>` : ''}
            <button class="btn btn-sm btn-ghost" data-delete="${a.id}" style="color:var(--danger)">Sil</button>
          </td>`;
        tbody.appendChild(tr);
      });
      t.appendChild(tbody);
      listPanel.innerHTML = '';
      listPanel.appendChild(t);

      listPanel.querySelectorAll('[data-confirm]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const dialog = await openConfirmDialog();
          if (!dialog) return;
          try {
            await api.patch('/api/appointments/' + btn.dataset.confirm, {
              status: 'confirmed',
              meeting_link: dialog.meetingLink,
              cc_email: dialog.ccEmail,
            });
            toast('Randevu onaylandı, mail gönderildi', 'success');
            loadAppointments();
          } catch (e) { toast(e.message, 'error'); }
        });
      });
      listPanel.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await api.patch('/api/appointments/' + btn.dataset.cancel, { status: 'cancelled' });
          toast('Randevu iptal edildi', 'success');
          loadAppointments();
        });
      });
      listPanel.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
          await api.del('/api/appointments/' + btn.dataset.delete);
          toast('Randevu silindi', 'success');
          loadAppointments();
        });
      });
    } catch (e) { listPanel.innerHTML = '<div class="empty"><p>Yüklenemedi.</p></div>'; }
  }
  loadAppointments();

  // === Slot Yönetimi (yeni tasarım) ===
  // Ürün listesi = Randevu Konuları (admin'den yönetilir). "Genel" her zaman ilk sırada.
  // Slot'un `product` alanına konu BAŞLIĞI yazılır (kod değil) — randevu konularıyla birebir.
  const SLOT_BRAND_PALETTE = ['#F39200', '#3B9EE3', '#7DBA3F', '#8B5CF6', '#E63946', '#0EA5E9', '#D946EF', '#F59E0B', '#10B981', '#6366F1'];
  const SLOT_PRODUCTS = [{ code: '', name: 'Genel', brand: '#06b6d4' }];
  try {
    const tp = await api.get('/api/appointments/topics');
    (tp.topics || []).forEach((topic, i) => {
      SLOT_PRODUCTS.push({ code: topic.title, name: topic.title, brand: SLOT_BRAND_PALETTE[i % SLOT_BRAND_PALETTE.length] });
    });
  } catch {}
  const slotProd = code => SLOT_PRODUCTS.find(p => p.code === (code || '')) || SLOT_PRODUCTS[0];

  let weekStart = startOfWeek(new Date());   // gösterilen haftanın Pazartesi'si
  let filterProduct = '__all';               // '__all' | '' (genel) | ürün kodu
  let selectedIds = new Set();               // toplu seçim
  let allSlots = [];                         // ham slot listesi (geniş aralık)

  function startOfWeek(d) {
    const dt = new Date(d);
    const day = (dt.getDay() + 6) % 7; // Pzt=0
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - day);
    return dt;
  }
  function fmtLocalDate(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  slotsPanel.innerHTML = `
    <div class="card" style="margin-bottom:16px;padding:18px 20px">
      <h3 style="margin:0 0 14px;font-size:15px;display:flex;align-items:center;gap:8px"><span class="material-symbols-rounded" style="color:var(--accent)">add_circle</span> Yeni Slotlar Oluştur</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
        <label class="field-block" style="flex:1;min-width:130px"><span class="field-label">Başlangıç</span><input type="date" id="slotDateFrom"></label>
        <label class="field-block" style="flex:1;min-width:130px"><span class="field-label">Bitiş</span><input type="date" id="slotDateTo"></label>
        <label class="field-block" style="flex:1;min-width:90px"><span class="field-label">Saat Başl.</span><input type="time" id="slotTimeFrom" value="09:00"></label>
        <label class="field-block" style="flex:1;min-width:90px"><span class="field-label">Saat Bitiş</span><input type="time" id="slotTimeTo" value="17:00"></label>
        <label class="field-block" style="flex:1;min-width:150px"><span class="field-label">Ürün</span>
          <select id="slotProduct">${SLOT_PRODUCTS.map(p => `<option value="${escapeHtml(p.code)}">${p.code ? escapeHtml(p.name) : 'Genel (tüm ürünler)'}</option>`).join('')}</select>
        </label>
        <button class="btn btn-primary" id="slotCreateBtn" style="height:42px"><span class="material-symbols-rounded">add</span> Oluştur</button>
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--text-dim)">30 dk aralıklarla, hafta içi günlerde oluşturulur. "Genel" slotlar her ürün için seçilebilir.</div>
    </div>

    <div class="slot-stats" id="slotStats"></div>

    <div class="card" style="padding:16px 20px">
      <div class="slot-toolbar">
        <div class="slot-week-nav">
          <button class="btn btn-sm btn-ghost" id="weekPrev"><span class="material-symbols-rounded">chevron_left</span></button>
          <b id="weekLabel" style="min-width:190px;text-align:center"></b>
          <button class="btn btn-sm btn-ghost" id="weekNext"><span class="material-symbols-rounded">chevron_right</span></button>
          <button class="btn btn-sm btn-ghost" id="weekToday">Bugün</button>
        </div>
        <div class="slot-filter" id="slotFilter"></div>
      </div>

      <div class="slot-legend">
        <span class="slot-legend-item"><i class="slot-legend-dot is-free"></i> Müsait (tıkla → seç)</span>
        <span class="slot-legend-item"><i class="slot-legend-dot is-sel"></i> Seçili</span>
        <span class="slot-legend-item"><i class="slot-legend-dot is-booked"></i> Dolu (randevulu)</span>
        <button class="btn btn-sm btn-ghost" id="slotSelectAll" style="margin-left:auto"><span class="material-symbols-rounded">select_all</span> Bu haftadaki müsaitleri seç</button>
      </div>

      <div class="slot-bulkbar" id="slotBulkbar" hidden>
        <span class="material-symbols-rounded" style="color:var(--accent)">check_circle</span>
        <b id="slotBulkCount">0 seçili</b>
        <button class="btn btn-sm btn-ghost" id="slotBulkClear">Seçimi temizle</button>
        <button class="btn btn-sm" id="slotBulkDelete" style="background:var(--danger);color:#fff;margin-left:auto"><span class="material-symbols-rounded">delete</span> Seçilenleri sil</button>
      </div>

      <div id="slotGrid"></div>
    </div>
  `;

  // Ürün filtre çipleri
  const filterEl = slotsPanel.querySelector('#slotFilter');
  filterEl.innerHTML = `<button class="slot-filter-chip is-active" data-fp="__all">Tümü</button>` +
    SLOT_PRODUCTS.map(p => `<button class="slot-filter-chip" data-fp="${escapeHtml(p.code)}" style="--brand:${p.brand}">${escapeHtml(p.name)}</button>`).join('');
  filterEl.querySelectorAll('.slot-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filterProduct = chip.dataset.fp;
      filterEl.querySelectorAll('.slot-filter-chip').forEach(c => c.classList.toggle('is-active', c === chip));
      renderWeek();
    });
  });

  const today = new Date().toISOString().slice(0, 10);
  slotsPanel.querySelector('#slotDateFrom').value = today;
  slotsPanel.querySelector('#slotDateTo').value = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  slotsPanel.querySelector('#slotCreateBtn').addEventListener('click', async () => {
    const dateFrom = slotsPanel.querySelector('#slotDateFrom').value;
    const dateTo = slotsPanel.querySelector('#slotDateTo').value;
    const timeFrom = slotsPanel.querySelector('#slotTimeFrom').value;
    const timeTo = slotsPanel.querySelector('#slotTimeTo').value;
    const product = slotsPanel.querySelector('#slotProduct').value;
    if (!dateFrom || !dateTo || !timeFrom || !timeTo) { toast('Tüm alanları doldurun', 'error'); return; }
    try {
      const r = await api.post('/api/appointments/admin/slots', { dateFrom, dateTo, timeFrom, timeTo, product });
      toast(`${r.created} slot oluşturuldu`, 'success');
      loadSlots();
    } catch (e) { toast(e.message, 'error'); }
  });

  slotsPanel.querySelector('#weekPrev').addEventListener('click', () => { weekStart.setDate(weekStart.getDate() - 7); renderWeek(); });
  slotsPanel.querySelector('#weekNext').addEventListener('click', () => { weekStart.setDate(weekStart.getDate() + 7); renderWeek(); });
  slotsPanel.querySelector('#weekToday').addEventListener('click', () => { weekStart = startOfWeek(new Date()); renderWeek(); });

  // Bu haftadaki (ve filtreye uyan) tüm MÜSAİT slotları seç
  slotsPanel.querySelector('#slotSelectAll').addEventListener('click', () => {
    const days = [];
    for (let i = 0; i < 7; i++) { const d = new Date(weekStart); d.setDate(d.getDate() + i); days.push(fmtLocalDate(d)); }
    const from = days[0], to = days[6];
    const visibleFree = allSlots.filter(s =>
      !s.is_booked && s.slot_date >= from && s.slot_date <= to &&
      (filterProduct === '__all' || (s.product || '') === filterProduct)
    );
    // Hepsi zaten seçiliyse → seçimi kaldır (toggle), değilse hepsini seç
    const allSelected = visibleFree.length > 0 && visibleFree.every(s => selectedIds.has(s.id));
    if (allSelected) visibleFree.forEach(s => selectedIds.delete(s.id));
    else visibleFree.forEach(s => selectedIds.add(s.id));
    renderWeek();
  });

  // Toplu işlem
  slotsPanel.querySelector('#slotBulkClear').addEventListener('click', () => { selectedIds.clear(); renderWeek(); });
  slotsPanel.querySelector('#slotBulkDelete').addEventListener('click', async () => {
    if (!selectedIds.size) return;
    if (!confirm(`${selectedIds.size} slot silinecek. Emin misiniz?`)) return;
    const ids = [...selectedIds];
    let ok = 0;
    for (const id of ids) {
      try { await api.del('/api/appointments/admin/slots/' + id); ok++; } catch {}
    }
    toast(`${ok} slot silindi`, 'success');
    selectedIds.clear();
    loadSlots();
  });

  function renderStats() {
    const total = allSlots.length;
    const booked = allSlots.filter(s => s.is_booked).length;
    const free = total - booked;
    const rate = total ? Math.round((booked / total) * 100) : 0;
    // En yoğun gün (en çok dolu slot)
    const byDay = {};
    allSlots.forEach(s => { if (s.is_booked) byDay[s.slot_date] = (byDay[s.slot_date] || 0) + 1; });
    let busiest = '-';
    const top = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    if (top) busiest = new Date(top[0] + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const stat = (icon, val, lbl, color) => `<div class="slot-stat"><span class="material-symbols-rounded" style="color:${color}">${icon}</span><div><div class="slot-stat-val">${val}</div><div class="slot-stat-lbl">${lbl}</div></div></div>`;
    slotsPanel.querySelector('#slotStats').innerHTML =
      stat('event', total, 'Toplam slot', '#00d4ff') +
      stat('event_available', free, 'Müsait', '#10b981') +
      stat('event_busy', booked, 'Dolu', '#f59e0b') +
      stat('trending_up', '%' + rate, 'Doluluk', '#8B5CF6') +
      stat('local_fire_department', busiest, 'En yoğun gün', '#E63946');
  }

  function renderWeek() {
    const grid = slotsPanel.querySelector('#slotGrid');
    const days = [];
    for (let i = 0; i < 7; i++) { const d = new Date(weekStart); d.setDate(d.getDate() + i); days.push(d); }
    const weekEnd = days[6];
    slotsPanel.querySelector('#weekLabel').textContent =
      `${days[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    // Bu haftanın + filtreye uyan slotları
    const inWeek = allSlots.filter(s => {
      const d = s.slot_date;
      if (d < fmtLocalDate(days[0]) || d > fmtLocalDate(days[6])) return false;
      if (filterProduct === '__all') return true;
      return (s.product || '') === filterProduct;
    });

    // Saat seti (tüm slotlardan benzersiz saatler, sıralı)
    const times = [...new Set(inWeek.map(s => s.slot_time))].sort();
    // (date,time) → slotlar
    const cellMap = {};
    inWeek.forEach(s => { (cellMap[s.slot_date + '|' + s.slot_time] ||= []).push(s); });

    if (!times.length) {
      grid.innerHTML = `<div class="empty" style="padding:40px"><span class="material-symbols-rounded">event_busy</span><p>Bu hafta${filterProduct !== '__all' ? ' (seçili filtrede)' : ''} slot yok.</p></div>`;
      renderBulkbar();
      return;
    }

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    let html = '<div class="slot-week"><table class="slot-week-table"><thead><tr><th class="slot-time-col">Saat</th>';
    days.forEach((d, i) => {
      const isToday = fmtLocalDate(d) === today;
      const weekend = i >= 5;
      html += `<th class="${isToday ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''}"><div class="slot-day-name">${dayNames[i]}</div><div class="slot-day-num">${d.getDate()}</div></th>`;
    });
    html += '</tr></thead><tbody>';
    times.forEach(time => {
      html += `<tr><td class="slot-time-col">${time}</td>`;
      days.forEach((d, i) => {
        const key = fmtLocalDate(d) + '|' + time;
        const cell = cellMap[key] || [];
        const weekend = i >= 5;
        if (!cell.length) { html += `<td class="slot-cell is-empty ${weekend ? 'is-weekend' : ''}"></td>`; return; }
        html += `<td class="slot-cell ${weekend ? 'is-weekend' : ''}">` + cell.map(s => {
          const p = slotProd(s.product);
          const sel = selectedIds.has(s.id) ? 'is-selected' : '';
          const booked = s.is_booked ? 'is-booked' : '';
          const prodLabel = p.code ? p.name : 'Genel';
          const title = `${time} • ${prodLabel} • ${s.is_booked ? 'Dolu (randevulu)' : 'Müsait'}`;
          const icon = s.is_booked
            ? '<span class="material-symbols-rounded slot-pill-ico">lock</span>'
            : `<span class="slot-pill-check material-symbols-rounded">${sel ? 'check_circle' : 'radio_button_unchecked'}</span>`;
          return `<span class="slot-pill ${booked} ${sel}" style="--brand:${p.brand}" data-slot-id="${s.id}" data-booked="${s.is_booked ? 1 : 0}" title="${escapeHtml(title)}">${icon}<span class="slot-pill-label">${escapeHtml(prodLabel)}</span></span>`;
        }).join('') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    grid.innerHTML = html;

    // Boş (müsait) slot pill → seçim toggle; dolu olanlar seçilemez
    grid.querySelectorAll('.slot-pill').forEach(pill => {
      if (pill.dataset.booked === '1') return;
      pill.addEventListener('click', () => {
        const id = Number(pill.dataset.slotId);
        if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
        pill.classList.toggle('is-selected');
        // Tik ikonunu güncelle
        const check = pill.querySelector('.slot-pill-check');
        if (check) check.textContent = pill.classList.contains('is-selected') ? 'check_circle' : 'radio_button_unchecked';
        renderBulkbar();
      });
    });
    renderBulkbar();
  }

  function renderBulkbar() {
    const bar = slotsPanel.querySelector('#slotBulkbar');
    if (!bar) return;
    bar.hidden = selectedIds.size === 0;
    slotsPanel.querySelector('#slotBulkCount').textContent = `${selectedIds.size} seçili`;
  }

  async function loadSlots() {
    const grid = slotsPanel.querySelector('#slotGrid');
    grid.innerHTML = '<div class="loader">Yükleniyor...</div>';
    try {
      const from = new Date().toISOString().slice(0, 10);
      const { slots } = await api.get('/api/appointments/admin/slots?from=' + from);
      allSlots = slots || [];
      selectedIds.clear();
      renderStats();
      renderWeek();
    } catch { grid.innerHTML = '<div class="empty"><p>Yüklenemedi.</p></div>'; }
  }
  loadSlots();
};

// Leaflet kütüphanesini ihtiyaç anında CDN'den yükle (admin paneli internet erişimini kabul eder)
let __leafletLoading = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (__leafletLoading) return __leafletLoading;
  __leafletLoading = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('leaflet_load_failed'));
    document.head.appendChild(script);
  });
  return __leafletLoading;
}

// Ayarlar haritası — tıkla/sürükle ile konum seç + ters geocoding ile adres
async function initMapPicker(page, lat, lng) {
  const mapEl = page.querySelector('#mapPicker');
  if (!mapEl) return;
  try { await loadLeaflet(); } catch { mapEl.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:13px">Harita yüklenemedi (internet bağlantısı gerekiyor).</div>'; return; }

  const latInput = page.querySelector('#mapsLat');
  const lngInput = page.querySelector('#mapsLng');
  const addrBox = page.querySelector('#mapAddrBox');
  const addrInput = page.querySelector('#contactAddress');

  const hasInit = lat && lng && !isNaN(+lat) && !isNaN(+lng);
  const initLat = hasInit ? +lat : 39.9334;   // varsayılan: Ankara
  const initLng = hasInit ? +lng : 32.8597;

  const map = L.map(mapEl).setView([initLat, initLng], hasInit ? 15 : 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap',
  }).addTo(map);
  // Konteyner görünür olunca boyutu düzelt (sekme/kart içinde gecikmeli render)
  setTimeout(() => map.invalidateSize(), 200);

  const marker = L.marker([initLat, initLng], { draggable: true });
  if (hasInit) marker.addTo(map);

  let geoTimer = null;
  const placeMarker = (latlng, doGeocode = true) => {
    marker.setLatLng(latlng).addTo(map);
    latInput.value = latlng.lat.toFixed(6);
    lngInput.value = latlng.lng.toFixed(6);
    if (!doGeocode) return;
    addrBox.textContent = 'Adres alınıyor…';
    clearTimeout(geoTimer);
    geoTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=tr`, { headers: { 'Accept': 'application/json' } }).then(r => r.json());
        if (res && res.display_name) {
          addrBox.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">place</span> ${escapeHtml(res.display_name)} <button type="button" class="btn btn-ghost btn-sm" id="mapUseAddr" style="margin-left:6px">Adres olarak kullan</button>`;
          const useBtn = addrBox.querySelector('#mapUseAddr');
          if (useBtn && addrInput) useBtn.onclick = () => { addrInput.value = res.display_name; toast('Adres güncellendi', 'success'); };
        } else addrBox.textContent = '';
      } catch { addrBox.textContent = ''; }
    }, 400);
  };

  map.on('click', (e) => placeMarker(e.latlng));
  marker.on('dragend', (e) => placeMarker(e.target.getLatLng()));

  const goBtn = page.querySelector('#mapGoBtn');
  if (goBtn) goBtn.onclick = () => {
    const la = parseFloat(latInput.value), lo = parseFloat(lngInput.value);
    if (isNaN(la) || isNaN(lo)) { toast('Geçerli enlem/boylam girin', 'error'); return; }
    map.setView([la, lo], 16);
    placeMarker({ lat: la, lng: lo });
  };
}

// ============================================
// KVKK / PRIVACY NOTICE — ayrı içerik yönetimi
// ============================================
routes.kvkk = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let settings = {};
  try {
    const r = await api.get('/api/settings');
    settings = r.settings || {};
  } catch { page.innerHTML = '<div class="empty"><p>KVKK metinleri yüklenemedi.</p></div>'; return; }

  page.innerHTML = '';
  const card = h('div', { class: 'card', style: 'width:100%' });
  card.innerHTML = `
    <div style="padding:24px 24px 0">
      <h3 style="margin:0 0 4px;font-size:18px">KVKK / Privacy Notice Metinleri</h3>
      <p style="margin:0 0 8px;font-size:13px;color:var(--text-dim)">Formlardaki onay popup'ı ve /kvkk sayfası buradan beslenir.</p>
    </div>
    <div class="settings-form" style="padding:8px 24px 24px">
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkTitleTr">TR Başlık</label>
            <input class="settings-row-input" id="kvkkTitleTr" value="${escapeHtml(settings.kvkk_title_tr || 'KVKK Aydınlatma Metni')}">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkUpdatedTr">TR Son Güncelleme</label>
            <input class="settings-row-input" id="kvkkUpdatedTr" value="${escapeHtml(settings.kvkk_updated_tr || '')}" placeholder="örn. 30.06.2026">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkBodyTr">TR Metin</label>
            <textarea class="settings-row-input" id="kvkkBodyTr" rows="12">${escapeHtml(settings.kvkk_body_tr || '')}</textarea>
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkTitleEn">EN Title</label>
            <input class="settings-row-input" id="kvkkTitleEn" value="${escapeHtml(settings.kvkk_title_en || 'Privacy Notice')}">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkUpdatedEn">EN Last Updated</label>
            <input class="settings-row-input" id="kvkkUpdatedEn" value="${escapeHtml(settings.kvkk_updated_en || '')}" placeholder="e.g. 2026-06-30">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="kvkkBodyEn">EN Text</label>
            <textarea class="settings-row-input" id="kvkkBodyEn" rows="12">${escapeHtml(settings.kvkk_body_en || '')}</textarea>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:22px;border-top:1px solid var(--border);padding-top:18px">
        <button class="btn btn-primary" id="kvkkSaveBtn"><span class="material-symbols-rounded">save</span> Kaydet</button>
        <a class="btn btn-ghost" href="/kvkk" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span> Sayfayı Aç</a>
      </div>
    </div>
  `;
  page.appendChild(card);
  mountEditor('#kvkkBodyTr', settings.kvkk_body_tr || '');
  mountEditor('#kvkkBodyEn', settings.kvkk_body_en || '');
  page.querySelector('#kvkkSaveBtn').addEventListener('click', async () => {
    const payload = {
      kvkk_title_tr: page.querySelector('#kvkkTitleTr').value.trim(),
      kvkk_body_tr: getEditorContent('#kvkkBodyTr'),
      kvkk_updated_tr: page.querySelector('#kvkkUpdatedTr').value.trim(),
      kvkk_title_en: page.querySelector('#kvkkTitleEn').value.trim(),
      kvkk_body_en: getEditorContent('#kvkkBodyEn'),
      kvkk_updated_en: page.querySelector('#kvkkUpdatedEn').value.trim(),
    };
    try {
      await api.put('/api/settings', payload);
      toast('KVKK metinleri kaydedildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });
};

// ============================================
// ÇEREZ POLİTİKASI — ayrı içerik yönetimi (KVKK ile aynı desen)
// ============================================
routes.cerez = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let settings = {};
  try {
    const r = await api.get('/api/settings/cerez');
    settings = r.settings || {};
  } catch { page.innerHTML = '<div class="empty"><p>Çerez Politikası metinleri yüklenemedi.</p></div>'; return; }

  page.innerHTML = '';
  const card = h('div', { class: 'card', style: 'width:100%' });
  card.innerHTML = `
    <div style="padding:24px 24px 0">
      <h3 style="margin:0 0 4px;font-size:18px">Çerez Politikası Metinleri</h3>
      <p style="margin:0 0 8px;font-size:13px;color:var(--text-dim)">/cerez-politikasi sayfası ve çerez bilgilendirmeleri buradan beslenir. "Son Güncelleme" boş bırakılırsa kayıt tarihi otomatik yazılır.</p>
    </div>
    <div class="settings-form" style="padding:8px 24px 24px">
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="cerezTitleTr">TR Başlık</label>
            <input class="settings-row-input" id="cerezTitleTr" value="${escapeHtml(settings.cerez_title_tr || 'Çerez Politikası')}">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="cerezUpdatedTr">TR Son Güncelleme</label>
            <input class="settings-row-input" id="cerezUpdatedTr" value="${escapeHtml(settings.cerez_updated_tr || '')}" placeholder="boş = otomatik tarih">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="cerezBodyTr">TR Metin</label>
            <textarea class="settings-row-input" id="cerezBodyTr" rows="12">${escapeHtml(settings.cerez_body_tr || '')}</textarea>
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="cerezTitleEn">EN Title</label>
            <input class="settings-row-input" id="cerezTitleEn" value="${escapeHtml(settings.cerez_title_en || 'Cookie Policy')}">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="cerezUpdatedEn">EN Last Updated</label>
            <input class="settings-row-input" id="cerezUpdatedEn" value="${escapeHtml(settings.cerez_updated_en || '')}" placeholder="empty = auto date">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="cerezBodyEn">EN Text</label>
            <textarea class="settings-row-input" id="cerezBodyEn" rows="12">${escapeHtml(settings.cerez_body_en || '')}</textarea>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:22px;border-top:1px solid var(--border);padding-top:18px">
        <button class="btn btn-primary" id="cerezSaveBtn"><span class="material-symbols-rounded">save</span> Kaydet</button>
        <a class="btn btn-ghost" href="/cerez-politikasi" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span> Sayfayı Aç</a>
      </div>
    </div>
  `;
  page.appendChild(card);
  mountEditor('#cerezBodyTr', settings.cerez_body_tr || '');
  mountEditor('#cerezBodyEn', settings.cerez_body_en || '');
  page.querySelector('#cerezSaveBtn').addEventListener('click', async () => {
    const payload = {
      cerez_title_tr: page.querySelector('#cerezTitleTr').value.trim(),
      cerez_body_tr: getEditorContent('#cerezBodyTr'),
      cerez_updated_tr: page.querySelector('#cerezUpdatedTr').value.trim(),
      cerez_title_en: page.querySelector('#cerezTitleEn').value.trim(),
      cerez_body_en: getEditorContent('#cerezBodyEn'),
      cerez_updated_en: page.querySelector('#cerezUpdatedEn').value.trim(),
    };
    try {
      await api.put('/api/settings/cerez', payload);
      toast('Çerez Politikası kaydedildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });
};

// ============================================
// KVKK BELGELERİ (kvkk hariç 4 belge) — generic içerik yönetimi
// KVKK / Çerez ile aynı desen; slug bazlı /api/settings/doc/:slug kullanır.
// ============================================
function makeDocRoute(slug, titleTr, titleEn, publicPath) {
  return async (page) => {
    page.innerHTML = '<div class="loader">Yükleniyor...</div>';
    let settings = {};
    try {
      const r = await api.get('/api/settings/doc/' + slug);
      settings = r.settings || {};
    } catch { page.innerHTML = '<div class="empty"><p>Belge metinleri yüklenemedi.</p></div>'; return; }

    const g = (k, d = '') => settings['doc_' + slug + '_' + k] || d;
    page.innerHTML = '';
    const card = h('div', { class: 'card', style: 'width:100%' });
    card.innerHTML = `
      <div style="padding:24px 24px 0">
        <h3 style="margin:0 0 4px;font-size:18px">${escapeHtml(titleTr)}</h3>
        <p style="margin:0 0 8px;font-size:13px;color:var(--text-dim)">Bu belge <code>${escapeHtml(publicPath)}</code> sayfasında ve ilgili form onaylarında gösterilir. "Son Güncelleme" boş bırakılırsa kayıt tarihi otomatik yazılır.</p>
      </div>
      <div class="settings-form" style="padding:8px 24px 24px">
        <div class="settings-cols">
          <div class="settings-col">
            <div class="settings-row">
              <label class="settings-row-label" for="docTitleTr">TR Başlık</label>
              <input class="settings-row-input" id="docTitleTr" value="${escapeHtml(g('title_tr', titleTr))}">
            </div>
            <div class="settings-row">
              <label class="settings-row-label" for="docUpdatedTr">TR Son Güncelleme</label>
              <input class="settings-row-input" id="docUpdatedTr" value="${escapeHtml(g('updated_tr'))}" placeholder="boş = otomatik tarih">
            </div>
            <div class="settings-row">
              <label class="settings-row-label" for="docBodyTr">TR Metin</label>
              <textarea class="settings-row-input" id="docBodyTr" rows="14">${escapeHtml(g('body_tr'))}</textarea>
            </div>
          </div>
          <div class="settings-col">
            <div class="settings-row">
              <label class="settings-row-label" for="docTitleEn">EN Title</label>
              <input class="settings-row-input" id="docTitleEn" value="${escapeHtml(g('title_en', titleEn))}">
            </div>
            <div class="settings-row">
              <label class="settings-row-label" for="docUpdatedEn">EN Last Updated</label>
              <input class="settings-row-input" id="docUpdatedEn" value="${escapeHtml(g('updated_en'))}" placeholder="empty = auto date">
            </div>
            <div class="settings-row">
              <label class="settings-row-label" for="docBodyEn">EN Text</label>
              <textarea class="settings-row-input" id="docBodyEn" rows="14">${escapeHtml(g('body_en'))}</textarea>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:22px;border-top:1px solid var(--border);padding-top:18px">
          <button class="btn btn-primary" id="docSaveBtn"><span class="material-symbols-rounded">save</span> Kaydet</button>
          <a class="btn btn-ghost" href="${publicPath}" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span> Sayfayı Aç</a>
        </div>
      </div>
    `;
    page.appendChild(card);
    mountEditor('#docBodyTr', g('body_tr'));
    mountEditor('#docBodyEn', g('body_en'));
    page.querySelector('#docSaveBtn').addEventListener('click', async () => {
      const payload = {
        ['doc_' + slug + '_title_tr']: page.querySelector('#docTitleTr').value.trim(),
        ['doc_' + slug + '_body_tr']: getEditorContent('#docBodyTr'),
        ['doc_' + slug + '_updated_tr']: page.querySelector('#docUpdatedTr').value.trim(),
        ['doc_' + slug + '_title_en']: page.querySelector('#docTitleEn').value.trim(),
        ['doc_' + slug + '_body_en']: getEditorContent('#docBodyEn'),
        ['doc_' + slug + '_updated_en']: page.querySelector('#docUpdatedEn').value.trim(),
      };
      try {
        await api.put('/api/settings/doc/' + slug, payload);
        toast('Belge kaydedildi', 'success');
      } catch (e) { toast(e.message, 'error'); }
    });
  };
}

routes['kvkk-politikasi'] = makeDocRoute('kvkk-politikasi', 'Genel KVKK Politikası', 'General PDPL Policy', '/belge?slug=kvkk-politikasi');
routes['basvuru-formu'] = makeDocRoute('basvuru-formu', 'Kişisel Veri Sahibi Başvuru Formu', 'Data Subject Application Form', '/belge?slug=basvuru-formu');
routes['calisan-adayi'] = makeDocRoute('calisan-adayi', 'Çalışan Adayı Aydınlatma ve Açık Rıza Metni', 'Candidate Applicant Notice and Explicit Consent', '/belge?slug=calisan-adayi');
routes['imha-politikasi'] = makeDocRoute('imha-politikasi', 'Kişisel Veri Saklama ve İmha Politikası', 'Personal Data Retention and Destruction Policy', '/belge?slug=imha-politikasi');

// ============================================
// GARANTİ SORGULAMA — Navision ERP + reCAPTCHA ayarları
// (Sorgu logları ayrı bölümde: routes['warranty-logs'])
// ============================================
routes.warranty = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let s = {}, sync = {};
  try {
    const r = await api.get('/api/warranty/settings');
    s = r.settings || {};
    sync = r.sync || {};
  } catch { page.innerHTML = '<div class="empty"><p>Garanti ayarları yüklenemedi.</p></div>'; return; }

  const v = (k) => escapeHtml(s[k] || '');
  const syncStatusHtml = (sy) => {
    if (!sy) return '';
    if (sy.lastError) return `<span style="color:#d93025">✗ Son sync hatası: ${escapeHtml(sy.lastError)}</span> (${escapeHtml((sy.lastSync||'').slice(0,19).replace('T',' '))})`;
    if (!sy.lastSync) return 'Henüz senkronizasyon yapılmadı. Liste/Toplu URL ayarlayıp “Şimdi Senkronize Et”e basın.';
    return `✓ Son sync: <b>${escapeHtml(String(sy.lastCount||'0'))}</b> kayıt · ${escapeHtml((sy.lastSync||'').slice(0,19).replace('T',' '))} · önbellekte <b>${escapeHtml(String(sy.cacheCount||0))}</b> kayıt`;
  };
  page.innerHTML = '';
  const card = h('div', { class: 'card', style: 'width:100%' });
  card.innerHTML = `
    <div style="padding:24px 24px 0">
      <h3 style="margin:0 0 4px;font-size:18px">Garanti Sorgulama Ayarları</h3>
      <p style="margin:0 0 8px;font-size:13px;color:var(--text-dim)">Gizli <code>/garanti</code> sayfası buradan beslenir. ERP OData ucundaki <b>tüm kayıtlar</b> her akşam çekilip yerel veritabanına kaydedilir; kullanıcı sorguları ERP'ye değil bu önbelleğe gider. Şifre alanı maskelidir; değiştirmezseniz eski değer korunur.</p>
    </div>
    <div class="settings-form" style="padding:8px 24px 24px">
      <h4 style="margin:14px 0 10px;color:var(--navy);font-size:14px">Navision ERP Bağlantısı</h4>
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="wUrl">ERP OData URL</label>
            <input class="settings-row-input" id="wUrl" value="${v('navision_api_url')}" placeholder="https://erp.../ODataV4/.../APIWarrantyLy">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="wUser">Kullanıcı</label>
            <input class="settings-row-input" id="wUser" value="${v('navision_user')}">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="wPass">Şifre</label>
            <input class="settings-row-input" id="wPass" type="password" value="${v('navision_pass')}" placeholder="••••••••">
          </div>
        </div>
        <div class="settings-col">
          <p style="margin:0 0 10px;font-size:12px;color:var(--text-dim)">Yanıttaki alan yolları (nokta gösterimi, örn. <code>data.invoiceDate</code>). Boş bırakılırsa yaygın alan adları denenir.</p>
          <div class="settings-row"><label class="settings-row-label" for="fInvDate">Fatura Tarihi alanı</label><input class="settings-row-input" id="fInvDate" value="${v('navision_field_invoice_date')}" placeholder="invoiceDate"></div>
          <div class="settings-row"><label class="settings-row-label" for="fInvNo">Fatura No alanı</label><input class="settings-row-input" id="fInvNo" value="${v('navision_field_invoice_no')}" placeholder="invoiceNo"></div>
          <div class="settings-row"><label class="settings-row-label" for="fWStart">Garanti Başlangıç alanı</label><input class="settings-row-input" id="fWStart" value="${v('navision_field_warranty_start')}" placeholder="warrantyStart"></div>
          <div class="settings-row"><label class="settings-row-label" for="fWEnd">Garanti Bitiş alanı</label><input class="settings-row-input" id="fWEnd" value="${v('navision_field_warranty_end')}" placeholder="warrantyEnd"></div>
          <div class="settings-row"><label class="settings-row-label" for="fCust">Müşteri Adı alanı</label><input class="settings-row-input" id="fCust" value="${v('navision_field_customer_name')}" placeholder="customerName"></div>
          <div class="settings-row"><label class="settings-row-label" for="fTax">Vergi No alanı</label><input class="settings-row-input" id="fTax" value="${v('navision_field_tax_no')}" placeholder="taxNo"></div>
        </div>
      </div>

      <h4 style="margin:22px 0 10px;color:var(--navy);font-size:14px;border-top:1px solid var(--border);padding-top:18px">reCAPTCHA v2 (bot koruması)</h4>
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row"><label class="settings-row-label" for="rSite">Site Key</label><input class="settings-row-input" id="rSite" value="${v('recaptcha_site_key')}"></div>
        </div>
        <div class="settings-col">
          <div class="settings-row"><label class="settings-row-label" for="rSecret">Secret Key</label><input class="settings-row-input" id="rSecret" type="password" value="${v('recaptcha_secret')}" placeholder="••••••••"></div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-top:22px;border-top:1px solid var(--border);padding-top:18px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" id="wSaveBtn"><span class="material-symbols-rounded">save</span> Kaydet</button>
        <button class="btn btn-ghost" id="wSyncBtn"><span class="material-symbols-rounded">sync</span> Şimdi Senkronize Et</button>
        <span style="display:inline-flex;gap:8px;align-items:center">
          <input class="settings-row-input" id="wTestSerial" style="width:200px" placeholder="Test seri no">
          <button class="btn btn-ghost" id="wTestBtn"><span class="material-symbols-rounded">bolt</span> Bağlantıyı Test Et</button>
        </span>
        <a class="btn btn-ghost" href="/garanti" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span> Sayfayı Aç</a>
      </div>
      <div id="wSyncStatus" style="margin-top:12px;font-size:13px;color:var(--text-dim)">${syncStatusHtml(sync)}</div>
      <div id="wTestOut" style="margin-top:12px;font-size:13px"></div>
    </div>
  `;
  page.appendChild(card);

  const collect = () => ({
    navision_api_url: page.querySelector('#wUrl').value.trim(),
    navision_user: page.querySelector('#wUser').value.trim(),
    navision_pass: page.querySelector('#wPass').value,
    navision_field_invoice_date: page.querySelector('#fInvDate').value.trim(),
    navision_field_invoice_no: page.querySelector('#fInvNo').value.trim(),
    navision_field_warranty_start: page.querySelector('#fWStart').value.trim(),
    navision_field_warranty_end: page.querySelector('#fWEnd').value.trim(),
    navision_field_customer_name: page.querySelector('#fCust').value.trim(),
    navision_field_tax_no: page.querySelector('#fTax').value.trim(),
    recaptcha_site_key: page.querySelector('#rSite').value.trim(),
    recaptcha_secret: page.querySelector('#rSecret').value,
  });

  page.querySelector('#wSaveBtn').addEventListener('click', async () => {
    try {
      await api.put('/api/warranty/settings', collect());
      toast('Garanti ayarları kaydedildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });

  page.querySelector('#wSyncBtn').addEventListener('click', async () => {
    const btn = page.querySelector('#wSyncBtn');
    const status = page.querySelector('#wSyncStatus');
    btn.disabled = true;
    status.innerHTML = '<span style="color:var(--text-dim)">Senkronize ediliyor…</span>';
    try {
      const r = await api.post('/api/warranty/sync', {});
      toast(`Senkronize edildi: ${r.count} kayıt`, 'success');
      // Güncel durumu yeniden çek
      const fresh = await api.get('/api/warranty/settings');
      status.innerHTML = syncStatusHtml(fresh.sync || {});
    } catch (e) {
      const m = (e && e.message) || '';
      status.innerHTML = '<span style="color:#d93025">✗ ' + escapeHtml(m.includes('no_list_url') ? 'Liste/Toplu URL girilmemiş.' : 'Sync hatası: ' + m) + '</span>';
    } finally { btn.disabled = false; }
  });

  page.querySelector('#wTestBtn').addEventListener('click', async () => {
    const out = page.querySelector('#wTestOut');
    const serialNo = page.querySelector('#wTestSerial').value.trim() || 'TEST';
    out.innerHTML = '<span style="color:var(--text-dim)">Test ediliyor…</span>';
    try {
      const r = await api.post('/api/warranty/test', { serialNo });
      if (r.found) out.innerHTML = '<span style="color:#0f9d58">✓ Bağlantı başarılı, kayıt bulundu.</span><pre style="margin-top:6px;background:var(--bg-soft);padding:10px;border-radius:6px;overflow:auto">' + escapeHtml(JSON.stringify(r.raw, null, 2)) + '</pre>';
      else out.innerHTML = '<span style="color:#f4b400">Bağlantı çalışıyor ama bu seri için kayıt yok.</span>';
    } catch (e) {
      const m = (e && e.message) || '';
      out.innerHTML = '<span style="color:#d93025">✗ ' + escapeHtml(m.includes('not_configured') ? 'Navision API URL girilmemiş.' : 'Bağlantı hatası: ' + m) + '</span>';
    }
  });
};

// ============================================
// GARANTİ SORGU LOGLARI — ayrı bölüm/yetki ('warranty-logs')
// Ayarları göremeyen bir kullanıcı yalnızca logları görebilsin diye ayrıldı.
// ============================================
routes['warranty-logs'] = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let logs = [];
  try {
    const lr = await api.get('/api/warranty/logs?limit=200');
    logs = lr.logs || [];
  } catch { page.innerHTML = '<div class="empty"><p>Sorgu logları yüklenemedi.</p></div>'; return; }

  const fmtResult = (r) => ({
    found: '<span style="color:#0f9d58">Bulundu</span>',
    not_found: '<span style="color:#f4b400">Kayıt yok</span>',
    error: '<span style="color:#d93025">Hata</span>',
    not_configured: '<span style="color:var(--text-dim)">Yapılandırılmadı</span>',
    captcha_failed: '<span style="color:#d93025">Captcha başarısız</span>',
  }[r] || escapeHtml(r || ''));

  page.innerHTML = '';
  const card = h('div', { class: 'card', style: 'width:100%' });
  card.innerHTML = `
    <div style="padding:24px 24px 4px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <div>
        <h3 style="margin:0 0 4px;font-size:18px">Garanti Sorgu Geçmişi</h3>
        <p style="margin:0;font-size:13px;color:var(--text-dim)">Gizli <code>/garanti</code> sayfasından yapılan sorgular (${logs.length} kayıt). Kişisel veri saklanmaz.</p>
      </div>
      <button class="btn btn-ghost" id="wlRefresh"><span class="material-symbols-rounded">refresh</span> Yenile</button>
    </div>
    <div style="padding:12px 24px 24px;overflow-x:auto">
      ${logs.length ? `<table class="admin-table" style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="text-align:left;border-bottom:1px solid var(--border)">
          <th style="padding:9px 8px">Tarih</th><th style="padding:9px 8px">Seri No</th><th style="padding:9px 8px">Sonuç</th><th style="padding:9px 8px">IP</th>
        </tr></thead>
        <tbody>${logs.map(l => `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:9px 8px;white-space:nowrap">${escapeHtml(l.created_at || '')}</td>
          <td style="padding:9px 8px;font-family:monospace">${escapeHtml(l.serial_no || '')}</td>
          <td style="padding:9px 8px">${fmtResult(l.result)}</td>
          <td style="padding:9px 8px;color:var(--text-dim)">${escapeHtml(l.ip || '')}</td>
        </tr>`).join('')}</tbody>
      </table>` : '<p style="color:var(--text-dim);font-size:13px;padding:8px 0">Henüz sorgu yapılmamış.</p>'}
    </div>
  `;
  page.appendChild(card);
  const rb = page.querySelector('#wlRefresh');
  if (rb) rb.addEventListener('click', () => routes['warranty-logs'](page));
};

// ============================================
// SETTINGS — SMTP ve genel ayarlar
// ============================================
routes.settings = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let settings = {};
  try {
    const r = await api.get('/api/settings');
    settings = r.settings || {};
  } catch { page.innerHTML = '<div class="empty"><p>Ayarlar yüklenemedi.</p></div>'; return; }
  page.innerHTML = '';

  const card = h('div', { class: 'card', style: 'width:100%' });
  card.innerHTML = `
    <div style="padding:24px 24px 0">
      <h3 style="margin:0 0 4px;font-size:18px">SMTP / E-posta Ayarları</h3>
      <p style="margin:0 0 8px;font-size:13px;color:var(--text-dim)">Randevu, teklif talebi ve şifre sıfırlama maillerinin gönderimi için SMTP sunucu bilgilerini girin.</p>
    </div>
    <div class="settings-form" style="padding:8px 24px 24px">

      <div class="settings-cols">
        <!-- SOL: SMTP ayarları -->
        <div class="settings-col">
          <div class="settings-section-title">SMTP Sunucu</div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpHost">SMTP Sunucu (Host)</label>
            <input class="settings-row-input" id="smtpHost" value="${escapeHtml(settings.smtp_host || '')}" placeholder="smtp.gmail.com">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpPort">Port</label>
            <input class="settings-row-input" id="smtpPort" value="${escapeHtml(settings.smtp_port || '587')}" placeholder="587">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpSecure">SSL/TLS</label>
            <select class="settings-row-input" id="smtpSecure">
              <option value="false" ${settings.smtp_secure !== 'true' ? 'selected' : ''}>Hayır (STARTTLS)</option>
              <option value="true" ${settings.smtp_secure === 'true' ? 'selected' : ''}>Evet (SSL)</option>
            </select>
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpUser">Kullanıcı Adı</label>
            <input class="settings-row-input" id="smtpUser" value="${escapeHtml(settings.smtp_user || '')}" placeholder="user@domain.com">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpPass">Şifre / App Password</label>
            <input class="settings-row-input" id="smtpPass" type="password" value="${escapeHtml(settings.smtp_pass || '')}" placeholder="••••••••">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="smtpFrom">Gönderici (From)</label>
            <input class="settings-row-input" id="smtpFrom" value="${escapeHtml(settings.smtp_from || '')}" placeholder="Form Elektrik <no-reply@formelektrik.com>">
          </div>
        </div>

        <!-- SAĞ: Bildirim e-postaları -->
        <div class="settings-col">
          <div class="settings-section-title">Bildirim E-postaları</div>
          <div class="settings-row">
            <label class="settings-row-label" for="appointmentNotifyTo">
              Randevu Bildirimi (genel)
              <small>Konuya özel adres tanımlı değilse buraya gider</small>
            </label>
            <input class="settings-row-input" id="appointmentNotifyTo" value="${escapeHtml(settings.appointment_notify_to || '')}" placeholder="admin@formelektrik.com">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="leadNotifyEmail">
              İletişim Talebi Bildirimi
              <small>İletişim formundan gelen teklif talepleri bu adrese düşer</small>
            </label>
            <input class="settings-row-input" id="leadNotifyEmail" value="${escapeHtml(settings.lead_notify_email || '')}" placeholder="info@formelektrik.com">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="careerNotifyEmail">
              Kariyer Başvuru Bildirimi
              <small>Kariyer sayfasından gelen iş başvuruları bu adrese düşer</small>
            </label>
            <input class="settings-row-input" id="careerNotifyEmail" value="${escapeHtml(settings.career_notify_email || '')}" placeholder="ik@formelektrik.com">
          </div>
          <div style="font-size:12px;color:var(--text-dim);background:rgba(0,212,255,0.06);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-top:10px;line-height:1.5">
            Konuya özel randevu bildirimleri <b style="color:var(--text)">Randevu Konuları</b> sayfasından yönetilir. Adresler boşsa .env'deki genel adrese düşer.
          </div>
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:24px">İletişim Bilgileri
        <small>Web sitesinde gösterilen iletişim bilgileri</small>
      </div>
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="contactPhone">Telefon</label>
            <input class="settings-row-input" id="contactPhone" value="${escapeHtml(settings.contact_phone || '')}" placeholder="+90 212 000 00 00">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="contactEmail">E-posta</label>
            <input class="settings-row-input" id="contactEmail" value="${escapeHtml(settings.contact_email || '')}" placeholder="info@formelektrik.com">
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="contactAddress">Adres</label>
            <textarea class="settings-row-input" id="contactAddress" rows="3" placeholder="Açık adres...">${escapeHtml(settings.contact_address || '')}</textarea>
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="contactHours">Çalışma Saatleri</label>
            <input class="settings-row-input" id="contactHours" value="${escapeHtml(settings.contact_hours || '')}" placeholder="Pzt — Cum · 09:00 – 17:00">
          </div>
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:24px">Harita Konumu
        <small>Haritaya tıklayarak ya da pini sürükleyerek konumu işaretleyin</small>
      </div>
      <div class="settings-cols">
        <div class="settings-col" style="grid-column:1/-1">
          <div id="mapPicker" style="height:340px;border-radius:10px;border:1px solid var(--border);overflow:hidden"></div>
          <div style="margin-top:10px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
            <div style="display:flex;flex-direction:column;gap:6px;flex:none">
              <label class="settings-row-label" for="mapsLat">Enlem (lat)</label>
              <input class="settings-row-input" id="mapsLat" style="width:150px" value="${escapeHtml(settings.maps_lat || '')}" placeholder="39.933400">
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;flex:none">
              <label class="settings-row-label" for="mapsLng">Boylam (lng)</label>
              <input class="settings-row-input" id="mapsLng" style="width:150px" value="${escapeHtml(settings.maps_lng || '')}" placeholder="32.859700">
            </div>
            <button type="button" class="btn btn-ghost" id="mapGoBtn" style="height:40px"><span class="material-symbols-rounded">my_location</span> Koordinata Git</button>
          </div>
          <div id="mapAddrBox" style="font-size:12px;color:var(--text-muted);margin-top:8px;min-height:18px"></div>
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:24px">Sosyal Medya Linkleri
        <small>Boş bırakılan ağ sitede gizlenir</small>
      </div>
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="socialLinkedin">LinkedIn</label>
            <input class="settings-row-input" id="socialLinkedin" value="${escapeHtml(settings.social_linkedin || '')}" placeholder="https://linkedin.com/company/...">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="socialInstagram">Instagram</label>
            <input class="settings-row-input" id="socialInstagram" value="${escapeHtml(settings.social_instagram || '')}" placeholder="https://instagram.com/...">
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label" for="socialYoutube">YouTube</label>
            <input class="settings-row-input" id="socialYoutube" value="${escapeHtml(settings.social_youtube || '')}" placeholder="https://youtube.com/channel/...">
          </div>
          <div class="settings-row">
            <label class="settings-row-label" for="socialFacebook">Facebook</label>
            <input class="settings-row-input" id="socialFacebook" value="${escapeHtml(settings.social_facebook || '')}" placeholder="https://facebook.com/...">
          </div>
        </div>
      </div>

      <div class="settings-section-title" style="margin-top:24px">Video Yönetimi
        <span style="font-weight:400;font-size:12px;color:var(--text-soft);margin-left:6px">(boş = /assets/form.mp4)</span>
      </div>
      <div class="settings-cols">
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label">Hero Video (üstteki blob)</label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <input class="settings-row-input" id="heroVideoUrl" value="${escapeHtml(settings.hero_video_url || '')}" placeholder="/assets/form.mp4" style="flex:1;min-width:200px">
              <label class="btn btn-ghost" style="cursor:pointer;flex:none;margin:0;font-size:13px;padding:6px 14px">
                <span class="material-symbols-rounded" style="font-size:18px">upload</span> Yükle
                <input type="file" accept="video/*" id="heroVideoFile" hidden>
              </label>
            </div>
            <div id="heroVideoPreview" style="margin-top:8px;display:none">
              <video style="width:100%;max-height:160px;border-radius:8px;background:#000" controls muted></video>
            </div>
          </div>
        </div>
        <div class="settings-col">
          <div class="settings-row">
            <label class="settings-row-label">Tanıtım Videosu</label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <input class="settings-row-input" id="introVideoUrl" value="${escapeHtml(settings.intro_video_url || '')}" placeholder="/assets/form.mp4" style="flex:1;min-width:200px">
              <label class="btn btn-ghost" style="cursor:pointer;flex:none;margin:0;font-size:13px;padding:6px 14px">
                <span class="material-symbols-rounded" style="font-size:18px">upload</span> Yükle
                <input type="file" accept="video/*" id="introVideoFile" hidden>
              </label>
            </div>
            <div id="introVideoPreview" style="margin-top:8px;display:none">
              <video style="width:100%;max-height:160px;border-radius:8px;background:#000" controls muted></video>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-top:22px;border-top:1px solid var(--border);padding-top:18px">
        <button class="btn btn-primary" id="settingsSaveBtn">
          <span class="material-symbols-rounded">save</span> Kaydet
        </button>
        <button class="btn btn-ghost" id="settingsTestBtn">
          <span class="material-symbols-rounded">send</span> Test Maili Gönder
        </button>
      </div>
      <div class="form-status" id="settingsStatus" aria-live="polite"></div>
    </div>
  `;
  page.appendChild(card);

  // Video upload handler'ları
  function bindVideoUpload(fileInputId, urlInputId, previewId) {
    const fileInput = page.querySelector('#' + fileInputId);
    const urlInput = page.querySelector('#' + urlInputId);
    const previewWrap = page.querySelector('#' + previewId);
    if (!fileInput || !urlInput) return;
    // Mevcut URL varsa preview göster
    if (urlInput.value) {
      previewWrap.style.display = '';
      previewWrap.querySelector('video').src = urlInput.value;
    }
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0]; if (!file) return;
      try {
        toast('Video yükleniyor...', 'info');
        const url = await uploadFile(file);
        urlInput.value = url;
        previewWrap.style.display = '';
        previewWrap.querySelector('video').src = url;
        toast('Video yüklendi', 'success');
      } catch (e) { toast('Video yüklenemedi: ' + e.message, 'error'); }
    });
  }
  bindVideoUpload('heroVideoFile', 'heroVideoUrl', 'heroVideoPreview');
  bindVideoUpload('introVideoFile', 'introVideoUrl', 'introVideoPreview');

  // Leaflet harita seçici — tıkla/sürükle ile konum işaretle
  initMapPicker(page, settings.maps_lat, settings.maps_lng);

  page.querySelector('#settingsSaveBtn').addEventListener('click', async () => {
    const payload = {
      smtp_host: page.querySelector('#smtpHost').value.trim(),
      smtp_port: page.querySelector('#smtpPort').value.trim(),
      smtp_secure: page.querySelector('#smtpSecure').value,
      smtp_user: page.querySelector('#smtpUser').value.trim(),
      smtp_pass: page.querySelector('#smtpPass').value,
      smtp_from: page.querySelector('#smtpFrom').value.trim(),
      appointment_notify_to: page.querySelector('#appointmentNotifyTo').value.trim(),
      lead_notify_email: page.querySelector('#leadNotifyEmail').value.trim(),
      career_notify_email: page.querySelector('#careerNotifyEmail').value.trim(),
      contact_phone: page.querySelector('#contactPhone').value.trim(),
      contact_email: page.querySelector('#contactEmail').value.trim(),
      contact_address: page.querySelector('#contactAddress').value.trim(),
      contact_hours: page.querySelector('#contactHours').value.trim(),
      maps_lat: page.querySelector('#mapsLat').value.trim(),
      maps_lng: page.querySelector('#mapsLng').value.trim(),
      social_linkedin: page.querySelector('#socialLinkedin').value.trim(),
      social_instagram: page.querySelector('#socialInstagram').value.trim(),
      social_youtube: page.querySelector('#socialYoutube').value.trim(),
      social_facebook: page.querySelector('#socialFacebook').value.trim(),
      hero_video_url: page.querySelector('#heroVideoUrl').value.trim(),
      intro_video_url: page.querySelector('#introVideoUrl').value.trim(),
    };
    try {
      await api.put('/api/settings', payload);
      toast('Ayarlar kaydedildi', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });

  page.querySelector('#settingsTestBtn').addEventListener('click', async () => {
    const to = page.querySelector('#appointmentNotifyTo').value.trim() || page.querySelector('#smtpUser').value.trim();
    if (!to) { toast('Bildirim e-postası veya kullanıcı adı gerekli', 'error'); return; }
    const statusEl = page.querySelector('#settingsStatus');
    statusEl.className = 'form-status';
    statusEl.textContent = 'Gönderiliyor...';
    try {
      await api.post('/api/settings/test-mail', { to });
      statusEl.className = 'form-status is-success';
      statusEl.textContent = '✓ Test maili gönderildi: ' + to;
    } catch (e) {
      statusEl.className = 'form-status is-error';
      statusEl.textContent = '✗ Hata: ' + (e.message || 'Gönderim başarısız');
    }
  });
};

// ============================================
// PROFILE — kendi avatar + ad + iletişim
// ============================================
routes.profile = async (page) => {
  page.innerHTML = '<div class="loader">Yükleniyor...</div>';
  let user = {};
  try {
    const r = await api.get('/api/users/me');
    user = r.user || {};
  } catch (e) {
    page.innerHTML = '<div class="empty"><p>Profil yüklenemedi.</p></div>';
    return;
  }
  page.innerHTML = '';

  const initial = escapeHtml((user.name || '?').slice(0, 1).toUpperCase());
  const card = h('div', { class: 'card profile-card' });
  card.innerHTML = `
    ${user.must_change_password ? `
      <div class="must-change-banner" style="margin-bottom:18px;padding:14px 16px;border-radius:10px;border:1px solid color-mix(in srgb, var(--warn, #ffb020) 50%, transparent);background:color-mix(in srgb, var(--warn, #ffb020) 12%, transparent);display:flex;gap:12px;align-items:flex-start">
        <span class="material-symbols-rounded" style="color:var(--warn, #ffb020);font-size:24px;flex-shrink:0">warning</span>
        <div>
          <b style="display:block;margin-bottom:4px">Şifrenizi değiştirmeniz gerekiyor</b>
          <span style="color:var(--text-muted);font-size:13px">Hesabınıza ilk girişiniz. Güvenliğiniz için aşağıdan yeni bir şifre belirleyin.</span>
        </div>
      </div>
    ` : ''}

    <div class="profile-grid">
      <aside class="profile-side">
        <div class="profile-side-avatar" id="profileAvatar">
          ${user.avatar_url
            ? `<img src="${escapeHtml(user.avatar_url)}" alt="Profil">`
            : `<span>${initial}</span>`}
        </div>
        <div class="profile-side-name">${escapeHtml(user.name || '')}</div>
        <div class="profile-side-role">${user.role === 'admin' ? 'Yönetici' : 'Müşteri'}</div>
        <button type="button" class="btn btn-ghost btn-block" id="profileUploadBtn">
          <span class="material-symbols-rounded">upload</span> Fotoğraf Yükle
        </button>
        <button type="button" class="btn btn-ghost btn-block" id="profileClearBtn" ${user.avatar_url ? '' : 'style="display:none"'}>
          <span class="material-symbols-rounded">delete</span> Fotoğrafı Kaldır
        </button>
        <input type="file" id="profileAvatarFile" accept="image/*" hidden>
      </aside>

      <div class="profile-main">
        <section class="profile-section">
          <h3 class="profile-section-title"><span class="material-symbols-rounded">badge</span> Hesap Bilgileri</h3>
          <div class="profile-form">
            <label class="field-block">
              <span class="field-label">Ad Soyad</span>
              <input id="profileName" value="${escapeHtml(user.name || '')}" placeholder="Ad Soyad">
            </label>
            <label class="field-block">
              <span class="field-label">E-posta</span>
              <input value="${escapeHtml(user.email || '')}" disabled style="opacity:0.6">
            </label>
            <label class="field-block">
              <span class="field-label">Telefon</span>
              <input id="profilePhone" value="${escapeHtml(user.phone || '')}" placeholder="+90 ...">
            </label>
            <label class="field-block">
              <span class="field-label">Şirket</span>
              <input id="profileCompany" value="${escapeHtml(user.company || '')}" placeholder="Şirket adı">
            </label>
          </div>
          <div class="profile-form-actions">
            <button type="button" class="btn btn-primary" id="profileSaveBtn">
              <span class="material-symbols-rounded">save</span> Kaydet
            </button>
          </div>
        </section>

        <section class="profile-section">
          <h3 class="profile-section-title"><span class="material-symbols-rounded">lock</span> Şifre Değiştir</h3>
          <div class="profile-form">
            <label class="field-block">
              <span class="field-label">Mevcut Şifre</span>
              <div class="pw-field">
                <input id="curPw" type="password" autocomplete="current-password" placeholder="Mevcut şifreniz">
                <button type="button" class="pw-toggle" data-pw="curPw" aria-label="Şifreyi göster"><span class="material-symbols-rounded">visibility</span></button>
              </div>
            </label>
            <label class="field-block">
              <span class="field-label">Yeni Şifre (en az 8 karakter)</span>
              <div class="pw-field">
                <input id="newPw" type="password" autocomplete="new-password" minlength="8" placeholder="Yeni şifre">
                <button type="button" class="pw-toggle" data-pw="newPw" aria-label="Şifreyi göster"><span class="material-symbols-rounded">visibility</span></button>
              </div>
            </label>
            <label class="field-block">
              <span class="field-label">Yeni Şifre (tekrar)</span>
              <div class="pw-field">
                <input id="newPw2" type="password" autocomplete="new-password" minlength="8" placeholder="Yeni şifre tekrar">
                <button type="button" class="pw-toggle" data-pw="newPw2" aria-label="Şifreyi göster"><span class="material-symbols-rounded">visibility</span></button>
              </div>
            </label>
          </div>
          <div class="profile-form-actions">
            <button type="button" class="btn btn-primary" id="pwBtn">
              <span class="material-symbols-rounded">key</span> Şifreyi Güncelle
            </button>
          </div>
        </section>
      </div>
    </div>
  `;
  page.appendChild(card);

  // Şifre göster/gizle
  card.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.onclick = () => {
      const input = card.querySelector('#' + btn.dataset.pw);
      const icon = btn.querySelector('.material-symbols-rounded');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      icon.textContent = show ? 'visibility_off' : 'visibility';
      btn.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
    };
  });

  const avatarBox = page.querySelector('#profileAvatar');
  const fileInput = page.querySelector('#profileAvatarFile');
  const uploadBtn = page.querySelector('#profileUploadBtn');
  const clearBtn = page.querySelector('#profileClearBtn');
  const saveBtn = page.querySelector('#profileSaveBtn');

  let currentAvatar = user.avatar_url || null;

  function renderAvatar(url, name) {
    avatarBox.innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="Profil">`
      : `<span>${escapeHtml((name || user.name || '?').slice(0, 1).toUpperCase())}</span>`;
    clearBtn.style.display = url ? '' : 'none';
  }

  uploadBtn.onclick = () => fileInput.click();
  clearBtn.onclick = () => { currentAvatar = null; renderAvatar(null); };

  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    uploadBtn.disabled = true;
    const original = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Yükleniyor...';
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('e1-token') || sessionStorage.getItem('e1-token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/uploads', { method: 'POST', headers, body: fd, credentials: 'include' });
      if (!res.ok) throw new Error('Görsel yüklenemedi');
      const data = await res.json();
      currentAvatar = data.url;
      renderAvatar(data.url);
      toast('Fotoğraf yüklendi (Kaydet ile kalıcı hale getirin)', 'success');
    } catch (e) {
      toast(e.message || 'Yükleme başarısız', 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = original;
      fileInput.value = '';
    }
  };

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    try {
      const payload = {
        name: page.querySelector('#profileName').value.trim(),
        phone: page.querySelector('#profilePhone').value.trim(),
        company: page.querySelector('#profileCompany').value.trim(),
        avatar_url: currentAvatar,
      };
      const r = await api.put('/api/users/me', payload);
      if (r && r.user) {
        // Sidebar #who güncelle
        renderWhoBlock(r.user);
      }
      toast('Profil güncellendi', 'success');
    } catch (e) {
      toast(e.message || 'Kaydedilemedi', 'error');
    } finally {
      saveBtn.disabled = false;
    }
  };

  // === Şifre değiştirme ===
  const pwBtn = page.querySelector('#pwBtn');
  const curPwEl = page.querySelector('#curPw');
  const newPwEl = page.querySelector('#newPw');
  const newPw2El = page.querySelector('#newPw2');
  pwBtn.onclick = async () => {
    const currentPassword = curPwEl.value;
    const newPassword = newPwEl.value;
    const newPassword2 = newPw2El.value;
    if (!currentPassword) { toast('Mevcut şifrenizi girin', 'error'); return; }
    if (newPassword.length < 8) { toast('Yeni şifre en az 8 karakter olmalı', 'error'); return; }
    if (newPassword !== newPassword2) { toast('Yeni şifreler eşleşmiyor', 'error'); return; }
    pwBtn.disabled = true;
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      toast('Şifre güncellendi', 'success');
      curPwEl.value = ''; newPwEl.value = ''; newPw2El.value = '';
      // Uyarı banner'ını gizle
      const banner = card.querySelector('.must-change-banner');
      if (banner) banner.remove();
      // Bayrağı global state'e yaz (varsa)
      if (window.__me) window.__me.must_change_password = 0;
    } catch (e) {
      const msg = e.message === 'current_password_wrong' ? 'Mevcut şifre yanlış'
        : e.message === 'same_as_current' ? 'Yeni şifre mevcut şifreden farklı olmalı'
        : e.message === 'password_too_short' ? 'Şifre en az 8 karakter olmalı'
        : e.message;
      toast(msg, 'error');
    } finally {
      pwBtn.disabled = false;
    }
  };
};

// Sidebar kullanıcı bilgisini avatar ile çiz (global helper)
function renderWhoBlock(u) {
  if (!u) return;
  const el = document.getElementById('who');
  if (!el) return;
  const avatar = u.avatar_url
    ? `<img class="who-avatar" src="${escapeHtml(u.avatar_url)}" alt="${escapeHtml(u.name || '')}">`
    : `<span class="who-avatar"><span>${escapeHtml((u.name || '?').slice(0,1).toUpperCase())}</span></span>`;
  el.innerHTML = `
    ${avatar}
    <div class="who-info">
      <b>${escapeHtml(u.name || '')}</b>
      <span>${escapeHtml(u.email || '')}</span>
    </div>
  `;
  el.classList.add('has-avatar');
}

// ============================================
// TEKNİK KÜTÜPHANE BELGELERİ — library CRUD
// ============================================
const DOC_TYPES = [
  ['datasheet','Datasheet'],['manual','Manual'],['certificate','Sertifika'],['catalog','Katalog'],['software','Yazılım']
];

routes.library = createCrudPage({
  title: 'TK Belgeleri',
  newButtonText: 'Yeni Belge',
  listUrl: '/api/library/admin/all',
  pluralKey: 'documents',
  saveUrl: id => id ? `/api/library/${id}` : '/api/library',
  richBody: false,
  columns: [
    { label: 'Başlık', render: r => `<b>${escapeHtml(r.title)}</b><br><small style="color:var(--text-dim)">${escapeHtml(r.brand_name||'—')}</small>` },
    { label: 'Tür', render: r => escapeHtml(r.document_type) },
    { label: 'Dil', render: r => (r.language||'tr').toUpperCase() },
    { label: 'İndirme', render: r => Number(r.download_count || 0).toLocaleString('tr-TR') },
    { label: 'Herkese Açık', render: r => r.is_public ? '✓' : '—' },
    { label: 'Durum', render: r => r.status==='published' ? '<span class="badge badge-published">Yayında</span>' : '<span class="badge badge-draft">Taslak</span>' },
    { label: 'Tarih', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR') : '—' },
  ],
  buildForm: (r = {}) => {
    const el = document.createElement('div');
    el.className = 'form-grid';
    el.innerHTML = `
      <div class="full"><span class="field-label">Başlık *</span><input name="title" value="${escapeHtml(r.title||'')}" required></div>
      <div class="half"><span class="field-label">Slug</span><input name="slug" value="${escapeHtml(r.slug||'')}" placeholder="boş = başlıktan üretilir"></div>
      <div class="half"><span class="field-label">Marka</span><select name="brand_id" id="libBrandSelect"><option value="">— Seçiniz —</option></select></div>
      <div class="half"><span class="field-label">Ürün Adı (opsiyonel)</span><input name="product_name" value="${escapeHtml(r.product_name||'')}" placeholder="ör. RC-10, BESS-500"></div>
      <div class="half"><span class="field-label">Belge Türü</span><select name="document_type">${DOC_TYPES.map(([v,l])=>`<option value="${v}" ${(r.document_type||'datasheet')===v?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="half"><span class="field-label">Dil</span><select name="language">${['tr','en'].map(l=>`<option value="${l}" ${(r.language||'tr')===l?'selected':''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      <div class="full"><span class="field-label">Açıklama</span><textarea name="description" rows="3">${escapeHtml(r.description||'')}</textarea></div>
      <div class="full">
        <span class="field-label">Dosya *</span>
        <div style="display:flex;gap:8px;align-items:center">
          <input name="file_url" id="libFileUrl" value="${escapeHtml(r.file_url||'')}" placeholder="/uploads/..." style="flex:1" required>
          <button type="button" class="btn btn-ghost btn-sm" id="libFileUploadBtn"><span class="material-symbols-rounded">upload_file</span> Yükle</button>
          <input type="file" id="libFileInput" accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,.dwg,.rar,.7z" hidden>
        </div>
        <input type="hidden" name="file_size" id="libFileSize" value="${r.file_size||''}">
      </div>
      <div class="half"><span class="field-label">Durum</span><select name="status">${[['draft','Taslak'],['published','Yayında']].map(([v,l])=>`<option value="${v}" ${(r.status||'draft')===v?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="half">
        <style>
          .lib-switch-input{position:absolute;opacity:0;width:0;height:0}
          .lib-switch{position:relative;width:44px;height:24px;background:var(--border,#3a4256);border-radius:999px;transition:.2s;flex:none}
          .lib-switch:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}
          .lib-switch-input:checked + .lib-switch{background:var(--accent,#2aa9e0)}
          .lib-switch-input:checked + .lib-switch:after{transform:translateX(20px)}
        </style>
        <label style="display:flex;gap:10px;align-items:center;margin-top:24px;cursor:pointer">
          <input type="checkbox" name="is_public" class="lib-switch-input" ${r.is_public?'checked':''}>
          <span class="lib-switch"></span>
          <span>Herkese Açık <small style="color:var(--text-dim)">(giriş gerektirmez)</small></span>
        </label>
      </div>
    `;
    return el;
  },
  afterForm: async (root, r) => {
    // Load brands into select
    try {
      const data = await api.get('/api/brands/admin/all');
      const sel = root.querySelector('#libBrandSelect');
      if (sel && data.brands) {
        data.brands.forEach(b => {
          const o = document.createElement('option');
          o.value = b.id; o.textContent = b.name;
          if (r && r.brand_id == b.id) o.selected = true;
          sel.appendChild(o);
        });
      }
    } catch(e) { console.warn('brands load failed', e); }
    // Wire file upload
    const btn = root.querySelector('#libFileUploadBtn');
    const inp = root.querySelector('#libFileInput');
    const urlInp = root.querySelector('#libFileUrl');
    const sizeInp = root.querySelector('#libFileSize');
    if (btn && inp) {
      btn.onclick = () => inp.click();
      inp.onchange = async () => {
        if (!inp.files.length) return;
        const size = inp.files[0].size;
        btn.disabled = true; btn.textContent = 'Yükleniyor...';
        try {
          const url = await uploadFile(inp.files[0]);
          urlInp.value = url;
          sizeInp.value = size || '';
          toast('Dosya yüklendi');
        } catch(e) { toast(e.message, 'error'); }
        btn.disabled = false; btn.innerHTML = '<span class="material-symbols-rounded">upload_file</span> Yükle';
      };
    }
  },
  beforeSave: (p) => {
    p.is_public = p.is_public ? 1 : 0;
    if (!p.brand_id) p.brand_id = null;
    return p;
  },
});

// ============================================
// TEKNİK KÜTÜPHANE BAŞVURULARI & ERİŞİM YÖNETİMİ
// ============================================
routes['library-users'] = function(container) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      <div style="display:flex;gap:4px;background:var(--bg-soft);border-radius:10px;padding:4px">
        <button class="lu-tab active" data-tab="regs">Başvurular</button>
        <button class="lu-tab" data-tab="access">Kullanıcı Erişimi</button>
      </div>
      <label style="display:flex;align-items:center;gap:12px;font-size:.88rem;cursor:pointer;background:var(--bg-soft);padding:10px 16px;border-radius:10px">
        <input type="checkbox" id="libAutoApprove" class="lu-switch-input">
        <span class="lu-switch"></span>
        <span>Otomatik onay <small style="color:var(--text-dim)">(başvurular anında onaylanıp şifre e-posta ile gönderilir)</small></span>
      </label>
    </div>
    <style>
      .lu-tab { padding:8px 16px; border:none; background:none; border-radius:8px; font-size:.9rem; font-weight:600; cursor:pointer; color:var(--text-dim); font-family:inherit; }
      .lu-tab.active { background:var(--bg-card,#fff); color:var(--accent,#2aa9e0); box-shadow:0 1px 4px rgba(0,0,0,.1); }
      .lu-empty { padding:48px 20px; text-align:center; color:var(--text-dim); }
      .lu-switch-input { position:absolute; opacity:0; width:0; height:0; }
      .lu-switch { position:relative; width:40px; height:22px; background:var(--border,#3a4256); border-radius:999px; transition:.2s; flex:none; }
      .lu-switch::after { content:''; position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; transition:.2s; }
      .lu-switch-input:checked + .lu-switch { background:var(--accent,#2aa9e0); }
      .lu-switch-input:checked + .lu-switch::after { transform:translateX(18px); }
    </style>
    <div class="card" style="padding:0;overflow:hidden">
      <div id="libRegsTab"></div>
      <div id="libAccessTab" hidden></div>
    </div>`;

  // Tab switching
  container.querySelectorAll('.lu-tab').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.lu-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.tab;
      container.querySelector('#libRegsTab').hidden = t !== 'regs';
      container.querySelector('#libAccessTab').hidden = t !== 'access';
    };
  });

  // Otomatik onay toggle
  (async () => {
    const cb = container.querySelector('#libAutoApprove');
    try { const s = await api.get('/api/library/admin/auto-approve'); cb.checked = !!s.enabled; } catch(e) {}
    cb.onchange = async () => {
      try { await api.put('/api/library/admin/auto-approve', { enabled: cb.checked }); toast(cb.checked ? 'Otomatik onay açık' : 'Otomatik onay kapalı', 'success'); }
      catch(e) { toast(e.message, 'error'); cb.checked = !cb.checked; }
    };
  })();

  // === TAB 1: Başvurular ===
  async function loadRegistrations() {
    const tab = container.querySelector('#libRegsTab');
    tab.innerHTML = '<p style="padding:24px;color:var(--text-dim)">Yükleniyor...</p>';
    try {
      const data = await api.get('/api/library/admin/registrations');
      if (!data.registrations || !data.registrations.length) {
        tab.innerHTML = '<div class="lu-empty"><span class="material-symbols-rounded" style="font-size:40px;opacity:.4;display:block;margin-bottom:8px">how_to_reg</span>Henüz başvuru yok.</div>';
        return;
      }
      tab.innerHTML = `<table class="table"><thead><tr>
        <th>Ad Soyad</th><th>E-posta</th><th>Firma</th><th>Telefon</th><th>Durum</th><th>Tarih</th><th></th>
      </tr></thead><tbody>${data.registrations.map(r => `<tr>
        <td><b>${escapeHtml(r.name)} ${escapeHtml(r.surname)}</b></td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.company||'—')}</td>
        <td>${escapeHtml(r.phone||'—')}</td>
        <td>${r.status==='pending'?'<span class="badge badge-draft">Bekliyor</span>':r.status==='approved'?'<span class="badge badge-published">Onaylandı</span>':'<span class="badge" style="background:#c0392b22;color:#e74c3c">Reddedildi</span>'}</td>
        <td>${new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
        <td style="text-align:right;white-space:nowrap">${r.status==='pending'?`<button class="btn btn-sm btn-primary" data-approve="${r.id}">Onayla</button> <button class="btn btn-sm btn-ghost" data-reject="${r.id}">Reddet</button>`:''}</td>
      </tr>`).join('')}</tbody></table>`;

      // Approve handler
      tab.querySelectorAll('[data-approve]').forEach(btn => {
        btn.onclick = async () => {
          const regId = btn.dataset.approve;
          // Fetch brands for access selection
          let brandsHtml = '';
          try {
            const bd = await api.get('/api/brands/admin/all');
            brandsHtml = (bd.brands||[]).map(b => `<label style="display:flex;gap:8px;align-items:center;padding:4px"><input type="checkbox" value="${b.id}" class="brand-cb" style="width:auto"> ${escapeHtml(b.name)}</label>`).join('');
          } catch(e) {}
          const content = document.createElement('div');
          content.innerHTML = `<p style="margin-bottom:12px">Bu başvuruyu onaylayarak kullanıcı hesabı oluşturulacak. Şifre otomatik üretilip kullanıcıya e-posta ile gönderilir.</p>
            <p style="margin-bottom:8px;font-weight:600">Marka erişimi ver:</p>
            <div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px">${brandsHtml || '<p style="color:var(--text-dim)">Marka bulunamadı</p>'}</div>`;
          const actions = h('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' });
          const cancelBtn = h('button', { class: 'btn btn-ghost' }, 'Vazgeç');
          const okBtn = h('button', { class: 'btn btn-primary' }, 'Onayla ve Bilgilendir');
          actions.appendChild(cancelBtn); actions.appendChild(okBtn);
          content.appendChild(actions);
          const modal = openModal('Başvuru Onayla', content, { width: '520px' });
          cancelBtn.onclick = () => modal.remove();
          okBtn.onclick = async () => {
            const brandIds = [...content.querySelectorAll('.brand-cb:checked')].map(cb => +cb.value);
            okBtn.disabled = true; okBtn.textContent = 'Onaylanıyor...';
            try {
              const res = await api.put(`/api/library/admin/registrations/${regId}`, { action: 'approve', brand_ids: brandIds });
              modal.remove();
              if (res.password) {
                const mailNote = res.mail_sent
                  ? h('p', { style: 'margin-top:12px;color:#1a8a4a' }, '✓ Şifre e-posta ile kullanıcıya gönderildi.')
                  : h('p', { style: 'margin-top:12px;color:#c0392b' }, '⚠ E-posta gönderilemedi — şifreyi elle iletin.');
                toast('Onaylandı', 'success');
                openModal('Kullanıcı Oluşturuldu', h('div', {},
                  h('p', {}, `Otomatik şifre: `),
                  h('code', { style: 'font-size:1.2em;background:var(--bg-soft);padding:4px 12px;border-radius:6px' }, res.password),
                  mailNote
                ));
              } else {
                toast('Onaylandı (mevcut kullanıcı)', 'success');
              }
              loadRegistrations();
            } catch(e) { toast(e.message, 'error'); okBtn.disabled = false; okBtn.textContent = 'Onayla ve Bilgilendir'; }
          };
        };
      });
      // Reject handler
      tab.querySelectorAll('[data-reject]').forEach(btn => {
        btn.onclick = async () => {
          if (!await confirmDialog('Bu başvuruyu reddetmek istediğinize emin misiniz?')) return;
          try {
            await api.put(`/api/library/admin/registrations/${btn.dataset.reject}`, { action: 'reject' });
            toast('Reddedildi');
            loadRegistrations();
          } catch(e) { toast(e.message, 'error'); }
        };
      });
    } catch(e) { tab.innerHTML = `<p style="padding:16px;color:#e74c3c">${escapeHtml(e.message)}</p>`; }
  }
  loadRegistrations();

  // === TAB 2: Kullanıcı Erişim Yönetimi ===
  async function initAccessTab() {
    const tab = container.querySelector('#libAccessTab');
    tab.style.padding = '20px';
    tab.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
        <select id="libAccessUserSelect" style="flex:1"><option value="">— Kullanıcı seçin —</option></select>
        <button class="btn btn-primary btn-sm" id="libAccessSaveBtn" disabled>Kaydet</button>
      </div>
      <div id="libAccessBody" style="display:none">
        <h4 style="margin:0 0 8px">Marka Erişimi</h4>
        <div id="libAccessBrands" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:16px"></div>
        <h4 style="margin:0 0 8px">Tekil Belge Erişimi</h4>
        <div id="libAccessDocs" style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px"></div>
      </div>`;

    // Load customers
    try {
      const cd = await api.get('/api/library/admin/customers');
      const sel = tab.querySelector('#libAccessUserSelect');
      (cd.users||[]).forEach(u => {
        const o = document.createElement('option');
        o.value = u.id; o.textContent = `${u.name} (${u.email})`;
        sel.appendChild(o);
      });
    } catch(e) {}

    // Load brands + docs for checkboxes
    let allBrands = [], allDocs = [];
    try {
      const bd = await api.get('/api/brands/admin/all');
      allBrands = bd.brands || [];
    } catch(e) {}
    try {
      const dd = await api.get('/api/library/admin/all');
      allDocs = dd.documents || [];
    } catch(e) {}

    const sel = tab.querySelector('#libAccessUserSelect');
    const saveBtn = tab.querySelector('#libAccessSaveBtn');
    const body = tab.querySelector('#libAccessBody');

    sel.onchange = async () => {
      const uid = sel.value;
      if (!uid) { body.style.display = 'none'; saveBtn.disabled = true; return; }
      body.style.display = '';
      saveBtn.disabled = false;

      // Render brand checkboxes
      tab.querySelector('#libAccessBrands').innerHTML = allBrands.map(b =>
        `<label style="display:flex;gap:6px;align-items:center;padding:4px"><input type="checkbox" class="ab-cb" value="${b.id}" style="width:auto"> ${escapeHtml(b.name)}</label>`
      ).join('');

      // Render doc checkboxes
      tab.querySelector('#libAccessDocs').innerHTML = allDocs.map(d =>
        `<label style="display:flex;gap:6px;align-items:center;padding:3px"><input type="checkbox" class="ad-cb" value="${d.id}" style="width:auto"> ${escapeHtml(d.title)} <small style="color:var(--text-dim)">(${escapeHtml(d.document_type)})</small></label>`
      ).join('') || '<p style="color:var(--text-dim)">Henüz belge yok</p>';

      // Load current access
      try {
        const acc = await api.get(`/api/library/admin/access/${uid}`);
        (acc.brand_ids||[]).forEach(bid => {
          const cb = tab.querySelector(`.ab-cb[value="${bid}"]`);
          if (cb) cb.checked = true;
        });
        (acc.document_ids||[]).forEach(did => {
          const cb = tab.querySelector(`.ad-cb[value="${did}"]`);
          if (cb) cb.checked = true;
        });
      } catch(e) {}
    };

    saveBtn.onclick = async () => {
      const uid = sel.value;
      if (!uid) return;
      const brand_ids = [...tab.querySelectorAll('.ab-cb:checked')].map(cb => +cb.value);
      const document_ids = [...tab.querySelectorAll('.ad-cb:checked')].map(cb => +cb.value);
      try {
        await api.put(`/api/library/admin/access/${uid}`, { brand_ids, document_ids });
        toast('Erişim güncellendi', 'success');
      } catch(e) { toast(e.message, 'error'); }
    };
  }
  initAccessTab();
};

init();
