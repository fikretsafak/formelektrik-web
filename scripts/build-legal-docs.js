// Bir kerelik / tekrar çalıştırılabilir dönüştürücü:
// kvkk/*.md (TR) + kvkk/markdown_dosyalar_english/*.md (EN) dosyalarını okuyup
// site içi HTML'e çevirir ve server/data/legal-docs.js'i üretir.
//
// Kullanım:  node scripts/build-legal-docs.js
//
// Not: Ürettiği HTML .legal-wrap stiliyle uyumludur (h2/h3/p/ul/li/table).
// TinyMCE ile sonradan düzenlenebilir; bu script yalnızca başlangıç içeriğini üretir.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KVKK_DIR = path.join(ROOT, 'kvkk');
// TR: tablo formatlı temiz markdown'lar (eski dağınık ```text bloklu sürümlerin yerine)
const TR_DIR = path.join(KVKK_DIR, 'markdown_dosyalar_turkce_tablo');
const EN_DIR = path.join(KVKK_DIR, 'markdown_dosyalar_english');
const OUT = path.join(ROOT, 'server', 'data', 'legal-docs.js');

// slug -> { tr: dosyaAdı (TR_DIR), en: dosyaAdı (EN_DIR), title_tr, title_en }
const DOCS = [
  {
    slug: 'kvkk',
    tr: 'GENEL_AYDINLATMA_METNI_TR_TABLO.md',
    en: 'GENERAL_INFORMATION_NOTICE.md',
    title_tr: 'KVKK Aydınlatma Metni',
    title_en: 'Privacy Notice',
  },
  {
    slug: 'kvkk-politikasi',
    tr: 'GENEL_KVKK_POLITIKASI_TR_TABLO.md',
    en: 'GENERAL_PDPL_POLICY.md',
    title_tr: 'Genel KVKK Politikası',
    title_en: 'General PDPL Policy',
  },
  {
    slug: 'basvuru-formu',
    tr: 'KISISEL_VERI_SAHIBI_BASVURU_FORMU_TR_TABLO.md',
    en: 'DATA_SUBJECT_APPLICATION_FORM.md',
    title_tr: 'Kişisel Veri Sahibi Başvuru Formu',
    title_en: 'Data Subject Application Form',
  },
  {
    slug: 'calisan-adayi',
    tr: 'CALISAN_ADAYI_AYDINLATMA_VE_ACIK_RIZA_METNI_TR_TABLO.md',
    en: 'CANDIDATE_APPLICANT_NOTICE_AND_EXPLICIT_CONSENT.md',
    title_tr: 'Çalışan Adayı Aydınlatma ve Açık Rıza Metni',
    title_en: 'Candidate Applicant Notice and Explicit Consent',
  },
  {
    slug: 'imha-politikasi',
    tr: 'IMHA_POLITIKASI_TR_TABLO.md',
    en: 'PERSONAL_DATA_RETENTION_AND_DESTRUCTION_POLICY.md',
    title_tr: 'Kişisel Veri Saklama ve İmha Politikası',
    title_en: 'Personal Data Retention and Destruction Policy',
  },
];

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Satır içi markdown: **bold**, `code`, [text](url)
function inline(s) {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
    const url = u.replace(/&amp;/g, '&');
    return `<a href="${url}">${t}</a>`;
  });
  return out;
}

// Markdown tablosunu HTML <table>'a çevir. rows: ["| a | b |", "|---|---|", ...]
function renderTable(rows) {
  const cells = (line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((c) => c.trim());
  const header = cells(rows[0]);
  const bodyRows = rows.slice(2); // rows[1] = ayraç
  let html = '<div class="table-scroll"><table>\n<thead><tr>';
  header.forEach((h) => (html += `<th>${inline(h)}</th>`));
  html += '</tr></thead>\n<tbody>\n';
  bodyRows.forEach((r) => {
    if (!r.trim()) return;
    html += '<tr>';
    cells(r).forEach((c) => (html += `<td>${inline(c) || '&nbsp;'}</td>`));
    html += '</tr>\n';
  });
  html += '</tbody></table></div>';
  return html;
}

function mdToHtml(md) {
  // İlk H1 başlığı ve "> Kaynak/Source" blockquote'larını at (sayfa kendi H1'ini basıyor).
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let ulBuf = [];
  let preBuf = null; // ```text bloğu
  let tblBuf = []; // markdown tablo satırları

  const flushUl = () => {
    if (ulBuf.length) {
      out.push('<ul>');
      ulBuf.forEach((li) => out.push(`<li>${inline(li)}</li>`));
      out.push('</ul>');
      ulBuf = [];
    }
  };
  const flushTbl = () => {
    if (tblBuf.length) {
      out.push(renderTable(tblBuf));
      tblBuf = [];
    }
  };

  let firstH1Seen = false;

  for (i = 0; i < lines.length; i++) {
    let line = lines[i];

    // ``` kod bloğu (TR'de ```text = layout korunmuş tablo/form)
    if (/^```/.test(line)) {
      flushUl();
      flushTbl();
      if (preBuf === null) {
        preBuf = [];
      } else {
        out.push(`<pre class="legal-pre">${esc(preBuf.join('\n')).trimEnd()}</pre>`);
        preBuf = null;
      }
      continue;
    }
    if (preBuf !== null) {
      preBuf.push(line);
      continue;
    }

    // markdown tablo satırı
    if (/^\s*\|/.test(line)) {
      flushUl();
      tblBuf.push(line);
      continue;
    } else if (tblBuf.length) {
      flushTbl();
    }

    // blockquote (kaynak notu) — atla
    if (/^\s*>/.test(line)) {
      continue;
    }

    // başlık
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      flushUl();
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      if (level === 1) {
        firstH1Seen = true;
        continue; // sayfa H1'i ayrı basıyor
      }
      // h2/h3 -> h2/h3, derinler h3
      const tag = level === 2 ? 'h2' : 'h3';
      out.push(`<${tag}>${inline(text)}</${tag}>`);
      continue;
    }

    // liste
    const liMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (liMatch) {
      ulBuf.push(liMatch[1].trim());
      continue;
    }

    // boş satır
    if (!line.trim()) {
      flushUl();
      continue;
    }

    // devam eden liste öğesi (girinti) — önceki li'ye ekle
    if (ulBuf.length && /^\s+\S/.test(line)) {
      ulBuf[ulBuf.length - 1] += ' ' + line.trim();
      continue;
    }

    // normal paragraf
    flushUl();
    out.push(`<p>${inline(line.trim())}</p>`);
  }

  flushUl();
  flushTbl();
  if (preBuf !== null) out.push(`<pre class="legal-pre">${esc(preBuf.join('\n')).trimEnd()}</pre>`);

  return out.join('\n');
}

function readMd(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) {
    console.warn('!! bulunamadı:', p);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

const result = {};
for (const d of DOCS) {
  const trHtml = mdToHtml(readMd(TR_DIR, d.tr));
  const enHtml = mdToHtml(readMd(EN_DIR, d.en));
  result[d.slug] = {
    tr: { title: d.title_tr, updated: '', body: trHtml },
    en: { title: d.title_en, updated: '', body: enHtml },
  };
  console.log(`✓ ${d.slug}: TR ${trHtml.length}b, EN ${enHtml.length}b`);
}

const banner =
  '// OTOMATİK ÜRETİLDİ — scripts/build-legal-docs.js\n' +
  '// Kaynak: kvkk/markdown_dosyalar_turkce_tablo/*.md (TR) + kvkk/markdown_dosyalar_english/*.md (EN)\n' +
  '// Elle düzenlemeyin; içerik admin panelinden (settings) düzenlenir.\n' +
  '// Buradaki değerler yalnızca DB boşken kullanılan başlangıç (default) içeriğidir.\n\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, banner + 'module.exports = ' + JSON.stringify(result, null, 2) + ';\n', 'utf8');
console.log('→ yazıldı:', OUT);
