// SEO checks for the generated static pages. Usage: node scripts/check-seo.mjs [--soft]
// Exports checkSeo(root) -> { errors, warnings, stats } (used by tests/seo-site.test.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DEFAULT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PAGE_BYTES = 30 * 1024;

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
};
const metaContent = (html, key, val) => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (attr(m[0], key) === val) return attr(m[0], 'content');
  return null;
};
const linkHref = (html, rel) => {
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) if (attr(m[0], 'rel') === rel) return attr(m[0], 'href');
  return null;
};
const jsonLd = (html, errors, label) => {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.push(JSON.parse(m[1])); } catch (e) { errors.push(`${label}: invalid JSON-LD (${e.message})`); }
  }
  return out;
};
const stripNonContent = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');

function checkLinks(html, file, root, errors) {
  const dir = path.dirname(file);
  const label = path.relative(root, file);
  for (const m of stripNonContent(html).matchAll(/<(a|link|img|script|source)\b[^>]*>/gi)) {
    for (const name of ['href', 'src']) {
      const v = attr(m[0], name);
      if (v == null || v === '') continue;
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(v)) continue;
      if (v.startsWith('//')) continue;
      if (v.startsWith('/')) { errors.push(`${label}: absolute path "${v}" breaks under /Ocean-Buddy/`); continue; }
      if (m[1].toLowerCase() === 'a' && /^\?/.test(v)) continue;
      const clean = v.split('#')[0].split('?')[0];
      if (!clean) continue;
      let target = path.resolve(dir, decodeURIComponent(clean));
      if (path.relative(root, target).startsWith('..')) { errors.push(`${label}: link escapes root "${v}"`); continue; }
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) errors.push(`${label}: broken link "${v}"`);
    }
  }
}

function checkHidden(html, label, errors) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (/display\s*:\s*none|visibility\s*:\s*hidden|text-indent\s*:\s*-\d{3,}|font-size\s*:\s*0(?![.\d])|\bhidden\b(?=[\s>])/i.test(body.replace(/<noscript[\s\S]*?<\/noscript>/gi, (s) => s)))
    errors.push(`${label}: possible hidden text (display:none / hidden / negative indent)`);
}

export function checkSeo(root = ROOT_DEFAULT) {
  const errors = [], warnings = [];
  const stats = { spotPages: 0, indexPages: 0, sitemapUrls: 0 };
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
  const spots = Array.isArray(catalog) ? catalog : catalog.spots;

  // Spot pages
  const titles = new Map(), descs = new Map();
  for (const s of spots) {
    const file = path.join(root, 'spot', String(s.id), 'index.html');
    const label = `spot/${s.id}/index.html`;
    if (!fs.existsSync(file)) { errors.push(`${label}: missing`); continue; }
    stats.spotPages++;
    const html = fs.readFileSync(file, 'utf8');
    const bytes = Buffer.byteLength(html);
    if (bytes > MAX_PAGE_BYTES) errors.push(`${label}: ${bytes} bytes > 30 KB`);
    if (!/^\s*<!doctype html>/i.test(html)) errors.push(`${label}: no doctype`);
    if (!/<html[^>]*\blang=/i.test(html)) errors.push(`${label}: no html lang`);
    if (!/<meta[^>]*name=["']viewport["']/i.test(html)) errors.push(`${label}: no viewport`);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
    const desc = metaContent(html, 'name', 'description');
    if (!title) errors.push(`${label}: no title`); else { (titles.get(title) || titles.set(title, []).get(title)).push(s.id); }
    if (!desc) errors.push(`${label}: no meta description`); else { (descs.get(desc) || descs.set(desc, []).get(desc)).push(s.id); }
    const canon = linkHref(html, 'canonical');
    if (!canon) errors.push(`${label}: no canonical`);
    else {
      if (!/^https:\/\//.test(canon)) errors.push(`${label}: canonical not absolute https`);
      if (!canon.endsWith(`/spot/${s.id}/`)) errors.push(`${label}: canonical "${canon}" does not end with /spot/${s.id}/`);
    }
    if (!metaContent(html, 'property', 'og:title')) errors.push(`${label}: no og:title`);
    if (!metaContent(html, 'property', 'og:description')) errors.push(`${label}: no og:description`);
    if (!metaContent(html, 'name', 'twitter:card')) errors.push(`${label}: no twitter:card`);
    if (!/app-id=6811870966/.test(metaContent(html, 'name', 'apple-itunes-app') || '')) errors.push(`${label}: no apple-itunes-app 6811870966`);
    const h1s = [...html.matchAll(/<h1\b/gi)].length;
    if (h1s !== 1) errors.push(`${label}: ${h1s} h1 (expected 1)`);
    const ld = jsonLd(html, errors, label);
    if (!ld.length) errors.push(`${label}: no JSON-LD`);
    else if (!JSON.stringify(ld).includes('BreadcrumbList')) errors.push(`${label}: no BreadcrumbList`);
    if (/aggregateRating|"reviewRating"|ratingValue|interactionStatistic/.test(html)) errors.push(`${label}: forbidden rating/review markup`);
    if (!html.includes('apps.apple.com/fr/app/ocean-buddy/id6811870966')) errors.push(`${label}: no App Store link`);
    if (!/href="(\.\.\/\.\.\/)\?spot=/.test(html)) warnings.push(`${label}: no relative ../../?spot= deep link`);
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!attr(m[0], 'alt')) errors.push(`${label}: img without alt`);
    checkHidden(html, label, errors);
    checkLinks(html, file, root, errors);
  }
  for (const [t, ids] of titles) if (ids.length > 1) errors.push(`duplicate title on ${ids.length} spots: "${t}" (${ids.slice(0, 3)})`);
  for (const [d, ids] of descs) if (ids.length > 1) warnings.push(`duplicate description on ${ids.length} spots (${ids.slice(0, 3)})`);

  // Index pages spots/**/index.html
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'index.html' ? [path.join(d, e.name)] : []) : [];
  const indexFiles = walk(path.join(root, 'spots'));
  stats.indexPages = indexFiles.length;
  if (!indexFiles.length) errors.push('spots/: no index pages');
  for (const f of indexFiles) {
    const label = path.relative(root, f), html = fs.readFileSync(f, 'utf8');
    if (!/<title>[\s\S]+?<\/title>/i.test(html)) errors.push(`${label}: no title`);
    if (!metaContent(html, 'name', 'description')) errors.push(`${label}: no meta description`);
    if (!linkHref(html, 'canonical')) errors.push(`${label}: no canonical`);
    jsonLd(html, errors, label);
    checkHidden(html, label, errors);
    checkLinks(html, f, root, errors);
  }

  // Sitemap + robots
  const smPath = path.join(root, 'sitemap.xml');
  if (!fs.existsSync(smPath)) errors.push('sitemap.xml: missing');
  else {
    const xml = fs.readFileSync(smPath, 'utf8');
    if (!/^\s*<\?xml[^>]*\?>\s*<urlset\b[^>]*sitemaps\.org\/schemas\/sitemap\/0\.9/.test(xml) || !/<\/urlset>\s*$/.test(xml)) errors.push('sitemap.xml: bad XML envelope');
    const tags = xml.replace(/<\?xml[^>]*\?>/, '').match(/<\/?[A-Za-z][^>]*>/g) || [];
    const stack = [];
    for (const t of tags) { const n = t.replace(/[<\/>]/g, '').split(/\s/)[0]; if (t.startsWith('</')) { if (stack.pop() !== n) { errors.push(`sitemap.xml: mismatched </${n}>`); break; } } else if (!t.endsWith('/>')) stack.push(n); }
    if (stack.length) errors.push('sitemap.xml: unclosed tags');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    stats.sitemapUrls = locs.length;
    if (new Set(locs).size !== locs.length) errors.push('sitemap.xml: duplicate <loc>');
    if (locs.length > 50000) errors.push('sitemap.xml: > 50000 URLs');
    for (const l of locs) if (!/^https:\/\/[^/]+\//.test(l)) errors.push(`sitemap.xml: non-absolute loc ${l}`);
    for (const s of spots) if (!locs.some((l) => l.endsWith(`/spot/${s.id}/`))) { errors.push(`sitemap.xml: missing spot ${s.id}`); break; }
    const missing = spots.filter((s) => !locs.some((l) => l.endsWith(`/spot/${s.id}/`))).length;
    if (missing) errors.push(`sitemap.xml: ${missing} spots missing`);
    if (locs.length < spots.length + indexFiles.length) warnings.push('sitemap.xml: fewer URLs than spots + index pages');
  }
  const rp = path.join(root, 'robots.txt');
  if (!fs.existsSync(rp)) errors.push('robots.txt: missing');
  else {
    const r = fs.readFileSync(rp, 'utf8');
    if (!/^Sitemap:\s*https:\/\/\S+\/sitemap\.xml/mi.test(r)) errors.push('robots.txt: no absolute Sitemap line');
    if (/^Disallow:\s*\/\s*$/mi.test(r)) errors.push('robots.txt: blocks the whole site');
  }
  if (!fs.existsSync(path.join(root, 'seo.css'))) errors.push('seo.css: missing');

  // Home page
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!/<title>[\s\S]+?<\/title>/i.test(home)) errors.push('index.html: no title');
  if (!metaContent(home, 'name', 'description')) errors.push('index.html: no description');
  if (!linkHref(home, 'canonical')) errors.push('index.html: no canonical');
  if (!/app-id=6811870966/.test(metaContent(home, 'name', 'apple-itunes-app') || '')) errors.push('index.html: no apple-itunes-app');
  const hl = jsonLd(home, errors, 'index.html');
  const hs = JSON.stringify(hl);
  if (!hl.length || !hs.includes('WebSite') || !hs.includes('MobileApplication')) errors.push('index.html: JSON-LD WebSite + MobileApplication required');
  if (/aggregateRating|ratingValue|reviewRating/.test(home)) errors.push('index.html: forbidden rating markup');
  if (!fs.existsSync(path.join(root, 'deep-link.js'))) warnings.push('deep-link.js: missing');

  // Netlify bundle contract
  const bs = fs.readFileSync(path.join(root, 'scripts/build-static.cjs'), 'utf8');
  for (const n of ['spot', 'spots', 'sitemap.xml', 'robots.txt']) if (!bs.includes(`'${n}'`)) errors.push(`build-static.cjs does not copy ${n}`);
  return { errors, warnings, stats };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings, stats } = checkSeo(process.argv.find((a) => a.startsWith('--root='))?.slice(7) || ROOT_DEFAULT);
  console.log('stats', JSON.stringify(stats));
  for (const w of warnings.slice(0, 20)) console.log('WARN', w);
  for (const e of errors.slice(0, 50)) console.log('FAIL', e);
  if (errors.length > 50) console.log(`... ${errors.length - 50} more`);
  console.log(errors.length ? `SEO check FAILED (${errors.length} errors)` : 'SEO check OK');
  process.exit(errors.length ? 1 : 0);
}
