/* ============================================
   BLOG INDEX (Medium-style filtering + listing)
   ============================================ */
(() => {
  const lang = localStorage.getItem('fe-lang') || document.documentElement.getAttribute('lang') || 'tr';
  const listEl = document.getElementById('blogList');
  const emptyEl = document.getElementById('blogEmpty');
  const searchEl = document.getElementById('blogSearch');
  const authorEl = document.getElementById('blogAuthor');
  const tagSelectEl = document.getElementById('blogTagMenu');
  const tagButton = document.getElementById('blogTagButton');
  const tagSelectWrap = document.getElementById('blogTagSelect');
  const activeTagWrap = document.getElementById('blogActiveTag');
  const activeTagLabel = document.getElementById('blogActiveTagLabel');
  const activeTagClear = document.getElementById('blogActiveTagClear');
  const featuredWrap = document.getElementById('blogFeaturedWrap');
  const featuredEl = document.getElementById('blogFeatured');

  function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function fmtDate(d) {
    if (!d) return '';
    try {
      const map = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };
      return new Date(d).toLocaleDateString(map[lang] || 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }
  function readingTime(charLen) {
    const minutes = Math.max(1, Math.round((charLen || 0) / 1000));
    const labels = {
      tr: minutes + ' dk okuma',
      en: minutes + ' min read',
      de: minutes + ' Min. Lesezeit',
    };
    return labels[lang] || labels.tr;
  }
  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function debounce(fn, ms = 250) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  let activeTags = [];
  let allPosts = [];

  function buildQuery() {
    const params = new URLSearchParams({ language: lang, limit: '60' });
    const q = (searchEl.value || '').trim();
    if (q) params.set('q', q);
    if (authorEl.value) params.set('author', authorEl.value);
    activeTags.forEach(tag => params.append('tag', tag));
    return params.toString();
  }

  function renderList() {
    listEl.innerHTML = '';
    featuredWrap.hidden = true;
    if (!allPosts.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    const posts = allPosts.slice();
    // İlk yazı featured (kapak görseli varsa, ve hiçbir filtre aktif değilse)
    const filterActive = (searchEl.value || authorEl.value || activeTags.length);
    const featuredCandidate = posts[0];
    if (!filterActive && featuredCandidate && featuredCandidate.cover_image) {
      renderFeatured(featuredCandidate);
      posts.shift();
    }

    posts.forEach(p => listEl.appendChild(rowCard(p)));
  }

  function renderFeatured(p) {
    featuredWrap.hidden = false;
    featuredEl.href = '/post?slug=' + encodeURIComponent(p.slug);
    const cover = p.cover_image
      ? `<div class="blog-featured-cover"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove();"></div>`
      : `<div class="blog-featured-cover no-img"><span class="material-symbols-rounded">article</span></div>`;
    const author = p.author_name ? esc(p.author_name) : 'Form Elektrik';
    featuredEl.innerHTML = `
      ${cover}
      <div class="blog-featured-body">
        <span class="blog-featured-eyebrow">${({tr:'Öne Çıkan',en:'Featured',de:'Hervorgehoben'})[lang] || 'Öne Çıkan'}</span>
        <h2 class="blog-featured-title">${esc(p.title)}</h2>
        <p class="blog-featured-excerpt">${esc(p.excerpt || '')}</p>
        <div class="blog-row-author">
          ${p.author_avatar
            ? `<span class="blog-row-author-avatar has-img"><img src="${esc(p.author_avatar)}" alt="${author}" loading="lazy" onerror="this.parentElement.classList.remove('has-img');this.parentElement.textContent='${esc(initials(author))}'"></span>`
            : `<span class="blog-row-author-avatar">${esc(initials(author))}</span>`}
          <span class="blog-row-author-name">${author}</span>
          <span class="dot"></span>
          <span>${fmtDate(p.published_at)}</span>
          <span class="dot"></span>
          <span>${readingTime(p.body_length)}</span>
        </div>
      </div>
    `;
  }

  function rowCard(p) {
    const a = document.createElement('a');
    a.className = 'post-card';
    a.href = '/post?slug=' + encodeURIComponent(p.slug);
    const author = p.author_name ? esc(p.author_name) : 'Form Elektrik';
    const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
    const cover = p.cover_image
      ? `<div class="post-thumb"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove();"></div>`
      : `<div class="post-thumb no-img"><span class="material-symbols-rounded">article</span></div>`;
    a.innerHTML = `
      ${cover}
      <div class="post-body">
        ${tags.length ? `<div class="post-tags">${tags.map(t => `<span class="post-tag">#${esc(t)}</span>`).join('')}</div>` : ''}
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt || '')}</p>
        <div class="post-card-foot">
          ${p.author_avatar
            ? `<img class="post-author-pic" src="${esc(p.author_avatar)}" alt="${author}" loading="lazy" onerror="this.style.display='none'">`
            : `<span class="post-author-pic post-author-pic--letter">${esc(initials(author))}</span>`}
          <span class="post-author-inline">${author}</span>
          <span class="dot"></span>
          <span>${fmtDate(p.published_at)}</span>
          <span class="dot"></span>
          <span>${readingTime(p.body_length)}</span>
        </div>
      </div>
    `;
    return a;
  }

  function collectTags(posts) {
    const counts = new Map();
    posts.forEach(p => {
      (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }

  function renderTagOptions(posts) {
    const top = collectTags(posts);
    tagSelectEl.innerHTML = top.map(([tag, count]) => `
      <label class="blog-tag-option">
        <input type="checkbox" value="${esc(tag)}" ${activeTags.includes(tag) ? 'checked' : ''}>
        <span>#${esc(tag)}</span>
        <em>${count}</em>
      </label>`).join('');
    tagSelectEl.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        activeTags = Array.from(tagSelectEl.querySelectorAll('input:checked')).map(i => i.value);
        updateActiveTagChip();
        load();
      });
    });
  }
  function updateActiveTagChip() {
    const label = tagButton && tagButton.querySelector('span:first-child');
    const allTagsLabel = ({tr:'Tüm Etiketler',en:'All Tags',de:'Alle Tags'})[lang] || 'Tüm Etiketler';
    if (label) label.textContent = activeTags.length ? activeTags.length + ' etiket seçildi' : allTagsLabel;
    if (activeTags.length) {
      activeTagWrap.hidden = false;
      activeTagLabel.textContent = activeTags.map(t => '#' + t).join(' ');
    } else {
      activeTagWrap.hidden = true;
    }
  }

  async function loadAuthors() {
    try {
      const r = await fetch('/api/posts/authors?language=' + lang);
      if (!r.ok) return;
      const { authors } = await r.json();
      (authors || []).forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.name} (${a.post_count})`;
        authorEl.appendChild(opt);
      });
    } catch { /* sessiz */ }
  }

  async function load() {
    try {
      const r = await fetch('/api/posts?' + buildQuery());
      const { posts } = r.ok ? await r.json() : { posts: [] };
      allPosts = posts || [];
      // Etiket seçenekleri sadece hiçbir filtre yokken yeniden hesaplansın (full set)
      if (!searchEl.value && !authorEl.value && !activeTags.length) {
        renderTagOptions(allPosts);
      }
      updateActiveTagChip();
      renderList();
    } catch {
      allPosts = [];
      renderList();
    }
  }

  searchEl.addEventListener('input', debounce(load, 300));
  authorEl.addEventListener('change', load);
  tagButton.addEventListener('click', () => tagSelectWrap.classList.toggle('open'));
  document.addEventListener('click', e => { if (!tagSelectWrap.contains(e.target)) tagSelectWrap.classList.remove('open'); });
  activeTagClear.addEventListener('click', () => { activeTags = []; renderTagOptions(allPosts); updateActiveTagChip(); load(); });

  // Tema değiştirici script.js'te global olarak bağlanıyor (çift binding tema'yı
  // iptal ediyordu) — burada tekrar bağlama.

  loadAuthors();
  load();
})();
