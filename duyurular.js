/* ============================================
   DUYURULAR — liste sayfası (blog.js'in sade hâli)
   ============================================ */
(() => {
  const lang = localStorage.getItem('fe-lang') || document.documentElement.getAttribute('lang') || 'tr';
  const listEl = document.getElementById('annList');
  const emptyEl = document.getElementById('annEmpty');
  const searchEl = document.getElementById('annSearch');
  const featuredWrap = document.getElementById('annFeaturedWrap');
  const featuredEl = document.getElementById('annFeatured');

  // Sayfa metinleri (TR/EN)
  const T = {
    tr: { eyebrow: 'Haberler', title: 'Duyurular', lead: 'Güncel haberler, etkinlikler ve şirketimizden gelişmeler.', search: 'Duyurularda ara…', empty: 'Henüz yayınlanmış bir duyuru yok.', featured: 'Öne Çıkan' },
    en: { eyebrow: 'News', title: 'Announcements', lead: 'Latest news, events and updates from our company.', search: 'Search announcements…', empty: 'No published announcements yet.', featured: 'Featured' },
  }[lang] || null;
  if (T) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('annEyebrow', T.eyebrow); set('annTitle', T.title); set('annLead', T.lead); set('annEmptyText', T.empty);
    if (searchEl) searchEl.placeholder = T.search;
    document.title = T.title + ' — Form Elektrik';
  }

  function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function fmtDate(d) {
    if (!d) return '';
    try {
      const map = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };
      return new Date(d).toLocaleDateString(map[lang] || 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }
  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  let allItems = [];
  const featuredLabel = (T && T.featured) || 'Öne Çıkan';

  function buildQuery() {
    const params = new URLSearchParams({ language: lang, limit: '60' });
    const q = (searchEl && searchEl.value || '').trim();
    if (q) params.set('q', q);
    return params.toString();
  }

  function renderList() {
    listEl.innerHTML = '';
    featuredWrap.hidden = true;
    if (!allItems.length) { emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    const items = allItems.slice();
    const filterActive = searchEl && searchEl.value;
    if (!filterActive && items[0] && items[0].cover_image) {
      renderFeatured(items[0]);
      items.shift();
    }
    items.forEach(a => listEl.appendChild(rowCard(a)));
  }

  function renderFeatured(p) {
    featuredWrap.hidden = false;
    featuredEl.href = '/duyuru?slug=' + encodeURIComponent(p.slug);
    const cover = p.cover_image
      ? `<div class="blog-featured-cover"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove();"></div>`
      : `<div class="blog-featured-cover no-img"><span class="material-symbols-rounded">campaign</span></div>`;
    const author = p.author_name ? esc(p.author_name) : 'Form Elektrik';
    featuredEl.innerHTML = `
      ${cover}
      <div class="blog-featured-body">
        <span class="blog-featured-eyebrow">${esc(featuredLabel)}</span>
        <h2 class="blog-featured-title">${esc(p.title)}</h2>
        <p class="blog-featured-excerpt">${esc(p.excerpt || '')}</p>
        <div class="blog-row-author">
          <span class="blog-row-author-avatar">${esc(initials(author))}</span>
          <span class="blog-row-author-name">${author}</span>
          <span class="dot"></span>
          <span>${fmtDate(p.published_at)}</span>
        </div>
      </div>
    `;
  }

  function rowCard(p) {
    const a = document.createElement('a');
    a.className = 'post-card';
    a.href = '/duyuru?slug=' + encodeURIComponent(p.slug);
    const author = p.author_name ? esc(p.author_name) : 'Form Elektrik';
    const cover = p.cover_image
      ? `<div class="post-thumb"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove();"></div>`
      : `<div class="post-thumb no-img"><span class="material-symbols-rounded">campaign</span></div>`;
    a.innerHTML = `
      ${cover}
      <div class="post-body">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt || '')}</p>
        <div class="post-card-foot">
          <span class="post-author-pic post-author-pic--letter">${esc(initials(author))}</span>
          <span class="post-author-inline">${author}</span>
          <span class="dot"></span>
          <span>${fmtDate(p.published_at)}</span>
        </div>
      </div>
    `;
    return a;
  }

  async function load() {
    try {
      const r = await fetch('/api/announcements?' + buildQuery());
      const { announcements } = r.ok ? await r.json() : { announcements: [] };
      allItems = announcements || [];
      renderList();
    } catch {
      allItems = [];
      renderList();
    }
  }

  if (searchEl) searchEl.addEventListener('input', debounce(load, 300));
  load();
})();
