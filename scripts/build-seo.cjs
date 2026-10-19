#!/usr/bin/env node
// Génère les pages statiques SEO : spot/<id>/, spots/<monde>/, spots/<monde>/<pays>/, sitemap.xml, robots.txt.
// Sans dépendance, idempotent (aucune date, ordre stable). SITE_BASE surcharge l'URL publique.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.SITE_BASE || 'https://ocean-buddy.pages.dev/').replace(/\/?$/, '/');
const APP_ID = '6811870966';
const STORE_URL = 'https://apps.apple.com/fr/app/ocean-buddy/id' + APP_ID;

const WORLDS = { fr: 'France', eu: 'Europe', as: 'Asie', oc: 'Océanie', af: 'Afrique', na: 'Amérique du Nord', sa: 'Amérique du Sud' };
const WORLD_ORDER = ['fr', 'eu', 'af', 'as', 'oc', 'na', 'sa'];
const LEVELS = { debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert', variable: 'Variable selon les conditions' };
const SPORTS = { surf: 'surf', snorkeling: 'snorkeling', baignade: 'baignade', plongee: 'plongée', kayak: 'kayak', kitesurf: 'kitesurf', windsurf: 'windsurf', paddle: 'paddle', bodyboard: 'bodyboard' };

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'autre';
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
function clip(s, n) {
  s = clean(s);
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  if (stop > n * 0.55) return cut.slice(0, stop + 1);
  return cut.replace(/\s+\S*$/, '') + '…';
}
function sportList(spot) {
  return (spot.sports || []).map((x) => SPORTS[x] || x);
}
function joinFr(list) {
  if (list.length < 2) return list.join('');
  return list.slice(0, -1).join(', ') + ' et ' + list[list.length - 1];
}
function country(spot) {
  const parts = clean(spot.loc).split(',').map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Autre';
}
function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
}
function rmrf(rel) { fs.rmSync(path.join(ROOT, rel), { recursive: true, force: true }); }

function layout({ title, description, canonical, root, ogImage, ogType, jsonld, body }) {
  const ld = jsonld.map((o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="apple-itunes-app" content="app-id=${APP_ID}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:site_name" content="Ocean Buddy">
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${esc(ogImage)}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" type="image/webp" href="${root}assets/poulpy/scenes/travel-v2.webp">
<link rel="apple-touch-icon" href="${root}assets/app/apple-touch-icon.png">
<link rel="stylesheet" href="${root}seo.css">
${ld}
</head>
<body>
<header class="seo-top"><a class="seo-brand" href="${root}">Ocean Buddy</a><nav aria-label="Navigation principale"><a href="${root}spots/">Tous les spots</a><a href="${esc(STORE_URL)}">App Store</a></nav></header>
<main class="seo-main">
${body}
</main>
<footer class="seo-foot"><p>Ocean Buddy, le guide des spots de mer : surf, plongée, snorkeling, baignade. <a href="${root}">Ouvrir l'application</a> · <a href="${root}privacy.html">Confidentialité</a></p></footer>
</body>
</html>
`;
}

function crumbsHtml(items) {
  return '<nav class="seo-crumbs" aria-label="Fil d\'Ariane"><ol>' + items.map((c, i) => i === items.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${c.href}">${esc(c.name)}</a></li>`).join('') + '</ol></nav>';
}
function crumbsLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) };
}
const badge = `<a class="seo-badge" href="${STORE_URL}" rel="noopener">Télécharger sur l'App Store</a>`;

function main() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
  const spots = catalog.slice().sort((a, b) => a.id.localeCompare(b.id));
  rmrf('spot'); rmrf('spots');

  const tree = {}; // world -> country -> [spots]
  for (const s of spots) {
    const w = WORLDS[s.world] ? s.world : 'eu';
    const c = country(s);
    ((tree[w] = tree[w] || {})[c] = tree[w][c] || []).push(s);
  }
  const urls = [BASE];
  const spotUrl = (s) => `${BASE}spot/${s.id}/`;

  for (const s of spots) {
    const w = WORLDS[s.world] ? s.world : 'eu';
    const c = country(s);
    const sports = sportList(s);
    const level = LEVELS[s.level];
    const root = '../../';
    const url = spotUrl(s);
    const name = clean(s.name);
    const title = clip(`${name} : spot de ${joinFr(sports) || 'mer'}, ${clean(s.loc)} | Ocean Buddy`, 90);
    const metaDesc = clip((level ? `Niveau ${level.toLowerCase()}. ` : '') + clean(s.desc), 158);
    const img = s.photo && s.photo.src && fs.existsSync(path.join(ROOT, s.photo.src)) ? s.photo : null;
    const imgAbs = img ? BASE + img.src.split('/').map(encodeURIComponent).join('/') : null;
    const imgRel = img ? root + img.src.split('/').map(encodeURIComponent).join('/') : null;
    const crumbs = [
      { name: 'Ocean Buddy', href: root, url: BASE },
      { name: 'Spots', href: root + 'spots/', url: BASE + 'spots/' },
      { name: WORLDS[w], href: `${root}spots/${w}/`, url: `${BASE}spots/${w}/` },
      { name: c, href: `${root}spots/${w}/${slug(c)}/`, url: `${BASE}spots/${w}/${slug(c)}/` },
      { name, href: '', url },
    ];
    const place = { '@context': 'https://schema.org', '@type': 'TouristAttraction', name, description: clean(s.desc), url, inLanguage: 'fr' };
    if (imgAbs) place.image = imgAbs;
    if (s.coords && isFinite(s.coords.lat) && isFinite(s.coords.lon)) place.geo = { '@type': 'GeoCoordinates', latitude: s.coords.lat, longitude: s.coords.lon };
    if (s.loc) place.address = { '@type': 'PostalAddress', addressRegion: clean(s.loc), addressCountry: c };
    if (sports.length) place.touristType = sports;

    const dl = (s.dangers || []).filter((d) => d && d[1]);
    const rows = [];
    if (s.loc) rows.push(['Lieu', clean(s.loc)]);
    if (level) rows.push(['Niveau', level]);
    if (sports.length) rows.push(['Activités', sports.join(', ')]);
    if (s.waterType) rows.push(['Type d\'eau', s.waterType === 'sea' ? 'Mer / océan' : clean(s.waterType)]);
    if (s.coords && isFinite(s.coords.lat)) {
      const approx = s.coordinatePrecision && !/exact|precise/.test(s.coordinatePrecision) ? ' (position approximative du secteur)' : '';
      rows.push(['Coordonnées', `${s.coords.lat.toFixed(2)}, ${s.coords.lon.toFixed(2)}${approx}`]);
    }
    const others = tree[w][c].filter((o) => o.id !== s.id);
    const idx = tree[w][c].findIndex((o) => o.id === s.id);
    const near = []; for (let k = 1; near.length < 6 && k <= tree[w][c].length; k++) { const o = tree[w][c][(idx + k) % tree[w][c].length]; if (o.id !== s.id && !near.includes(o)) near.push(o); }
    const src = s.source || {};
    const body = [
      crumbsHtml(crumbs),
      `<article class="seo-spot">`,
      `<h1>${esc(name)}</h1>`,
      `<p class="seo-sub">${esc(clean(s.loc))}${sports.length ? ' · ' + esc(sports.join(', ')) : ''}</p>`,
      img ? `<figure class="seo-photo"><img src="${imgRel}" alt="${esc(name + ', ' + clean(s.loc))}" loading="eager" decoding="async"><figcaption>${esc([img.author && 'Photo : ' + clean(img.author), img.license].filter(Boolean).join(' · '))}${img.source ? ` · <a href="${esc(img.source)}" rel="noopener nofollow">source</a>` : ''}</figcaption></figure>` : '',
      `<p class="seo-lead">${esc(clean(s.desc))}</p>`,
      `<dl class="seo-facts">${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>`,
      dl.length ? `<section><h2>Dangers à connaître</h2><ul class="seo-list">${dl.map((d) => `<li>${esc(clean(d[1]))}</li>`).join('')}</ul></section>` : '',
      s.tip ? `<section><h2>Le conseil d'Ocean Buddy</h2><p>${esc(clean(s.tip))}</p></section>` : '',
      `<p class="seo-cta"><a class="seo-open" href="${root}?spot=${encodeURIComponent(s.id)}">Ouvrir dans Ocean Buddy</a> ${badge}</p>`,
      src.label ? `<p class="seo-note">Source : ${src.url ? `<a href="${esc(src.url)}" rel="noopener nofollow">${esc(clean(src.label))}</a>` : esc(clean(src.label))}.</p>` : '',
      near.length ? `<section><h2>Autres spots : ${esc(c)}</h2><ul class="seo-links">${near.map((o) => `<li><a href="${root}spot/${o.id}/">${esc(clean(o.name))}</a></li>`).join('')}</ul></section>` : '',
      `</article>`,
    ].filter(Boolean).join('\n');
    write(`spot/${s.id}/index.html`, layout({ title, description: metaDesc, canonical: url, root, ogImage: imgAbs, ogType: 'article', jsonld: [place, crumbsLd(crumbs)], body }));
    urls.push(url);
    void others;
  }

  // Index racine des spots
  const worlds = WORLD_ORDER.filter((w) => tree[w]);
  const listing = (items, root) => `<ul class="seo-links">${items.map((o) => `<li><a href="${root}spot/${o.id}/">${esc(clean(o.name))}</a> <span>${esc(clean(o.loc))}</span></li>`).join('')}</ul>`;
  {
    const root = '../';
    const crumbs = [{ name: 'Ocean Buddy', href: root, url: BASE }, { name: 'Spots', href: '', url: BASE + 'spots/' }];
    const body = crumbsHtml(crumbs) + `\n<h1>Spots de surf, plongée et baignade dans le monde</h1>\n<p class="seo-lead">${spots.length} spots de mer décrits par Ocean Buddy, classés par région : niveau, dangers, conseils et activités.</p>\n<ul class="seo-links">${worlds.map((w) => `<li><a href="${w}/">${esc(WORLDS[w])}</a> <span>${Object.values(tree[w]).reduce((n, a) => n + a.length, 0)} spots</span></li>`).join('')}</ul>\n<p class="seo-cta"><a class="seo-open" href="${root}">Ouvrir Ocean Buddy</a> ${badge}</p>`;
    write('spots/index.html', layout({ title: 'Tous les spots de surf, plongée et baignade | Ocean Buddy', description: `${spots.length} spots de mer dans le monde : niveau, dangers, conseils et activités (surf, plongée, snorkeling, baignade).`, canonical: BASE + 'spots/', root, jsonld: [crumbsLd(crumbs)], body }));
    urls.push(BASE + 'spots/');
  }
  for (const w of worlds) {
    const root = '../../';
    const countries = Object.keys(tree[w]).sort((a, b) => a.localeCompare(b, 'fr'));
    const total = Object.values(tree[w]).reduce((n, a) => n + a.length, 0);
    const crumbs = [{ name: 'Ocean Buddy', href: root, url: BASE }, { name: 'Spots', href: '../', url: BASE + 'spots/' }, { name: WORLDS[w], href: '', url: `${BASE}spots/${w}/` }];
    const body = crumbsHtml(crumbs) + `\n<h1>Spots de mer : ${esc(WORLDS[w])}</h1>\n<p class="seo-lead">${total} spots répartis dans ${countries.length} pays ou territoires.</p>\n<ul class="seo-links">${countries.map((c) => `<li><a href="${slug(c)}/">${esc(c)}</a> <span>${tree[w][c].length} spot${tree[w][c].length > 1 ? 's' : ''}</span></li>`).join('')}</ul>\n<p class="seo-cta">${badge}</p>`;
    write(`spots/${w}/index.html`, layout({ title: `Spots de surf, plongée et baignade : ${WORLDS[w]} | Ocean Buddy`, description: `${total} spots de mer en ${WORLDS[w]} : niveau, dangers, conseils et activités, dans ${countries.length} pays ou territoires.`, canonical: `${BASE}spots/${w}/`, root, jsonld: [crumbsLd(crumbs)], body }));
    urls.push(`${BASE}spots/${w}/`);
    const used = new Set();
    for (const c of countries) {
      let cs = slug(c); while (used.has(cs)) cs += '-2'; used.add(cs);
      const list = tree[w][c];
      const r3 = '../../../';
      const cr = [{ name: 'Ocean Buddy', href: r3, url: BASE }, { name: 'Spots', href: '../../', url: BASE + 'spots/' }, { name: WORLDS[w], href: '../', url: `${BASE}spots/${w}/` }, { name: c, href: '', url: `${BASE}spots/${w}/${cs}/` }];
      const lb = `<ul class="seo-links">${list.map((o) => `<li><a href="${r3}spot/${o.id}/">${esc(clean(o.name))}</a> <span>${esc(LEVELS[o.level] || '')}${sportList(o).length ? ' · ' + esc(sportList(o).join(', ')) : ''}</span></li>`).join('')}</ul>`;
      const body2 = crumbsHtml(cr) + `\n<h1>Spots de mer : ${esc(c)}</h1>\n<p class="seo-lead">${list.length} spot${list.length > 1 ? 's' : ''} décrit${list.length > 1 ? 's' : ''} par Ocean Buddy (${esc(WORLDS[w])}).</p>\n${lb}\n<p class="seo-cta">${badge}</p>`;
      write(`spots/${w}/${cs}/index.html`, layout({ title: `Spots de surf, plongée et baignade : ${c} | Ocean Buddy`, description: clip(`${list.length} spot${list.length > 1 ? 's' : ''} de mer : ${c}. ${list.slice(0, 4).map((o) => clean(o.name)).join(', ')}${list.length > 4 ? '…' : ''}`, 158), canonical: `${BASE}spots/${w}/${cs}/`, root: r3, jsonld: [crumbsLd(cr)], body: body2 }));
      urls.push(`${BASE}spots/${w}/${cs}/`);
    }
  }
  void listing;

  const sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n') + '\n</urlset>\n';
  write('sitemap.xml', sm);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);
  console.log(`build-seo: ${spots.length} spots, ${urls.length} URLs, base ${BASE}`);
}
main();
