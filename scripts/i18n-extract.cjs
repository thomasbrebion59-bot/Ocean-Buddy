#!/usr/bin/env node
/*
 * Extrait les textes français affichés par l'application vers locales/source/fr.json.
 * Chaque texte devient une clé ; les expressions des gabarits `${...}` deviennent {0}, {1}…
 * Le fichier sert de source aux dictionnaires de traduction chargés par i18n.js.
 *
 *   node scripts/i18n-extract.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_JS = new Set([
  'i18n.js', 'sw.js', 'photo-catalog.js', 'community-config.js', 'poulpy-config.js',
  'community 2.js',
]);
const HTML_FILES = ['index.html', 'support.html', 'privacy.html', 'community-rules.html', 'photos.html'];

/* ---------- Lexer : chaînes, gabarits, commentaires, expressions régulières ---------- */
function extractLiterals(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  let lastSig = '';           // dernier caractère significatif du code (pour distinguer / division et regex)
  let lastWord = '';
  const REGEX_AFTER = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
  const REGEX_KEYWORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw']);

  function readQuoted(q) {
    let s = '';
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '\n') break;
      s += src[i++];
    }
    i++;
    return s;
  }

  function readTemplate() {
    // Renvoie le texte du gabarit avec {k} pour chaque ${...} ; les chaînes internes sont extraites aussi.
    let s = '';
    let k = 0;
    i++;
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        i += 2;
        const start = i;
        let depth = 1;
        while (i < n && depth > 0) {
          const c = src[i];
          if (c === "'" || c === '"') { out.push(unescape(readQuoted(c))); continue; }
          if (c === '`') { out.push(readTemplate()); continue; }
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) break; }
          i++;
        }
        void start;
        i++; // saute la }
        s += '{' + (k++) + '}';
        continue;
      }
      s += src[i++];
    }
    i++;
    return unescape(s);
  }

  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') { out.push(unescape(readQuoted(c))); lastSig = 'x'; lastWord = ''; continue; }
    if (c === '`') { out.push(readTemplate()); lastSig = 'x'; lastWord = ''; continue; }
    if (c === '/' && (REGEX_AFTER.has(lastSig) || REGEX_KEYWORDS.has(lastWord))) {
      // expression régulière littérale
      i++;
      let inClass = false;
      while (i < n) {
        const d = src[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) break;
        else if (d === '\n') break;
        i++;
      }
      i++;
      while (i < n && /[a-z]/i.test(src[i])) i++;
      lastSig = 'x';
      continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let w = '';
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
      lastWord = w;
      lastSig = 'x';
      continue;
    }
    lastSig = c;
    lastWord = '';
    i++;
  }
  return out;
}

function unescape(s) {
  return s
    .replace(/\\n/g, '\n').replace(/\\t/g, ' ')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\(['"`\\/])/g, '$1');
}

/* ---------- Découpage HTML et filtre « texte humain » ---------- */
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&hellip;': '…', '&mdash;': '—', '&middot;': '·' };
function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp|rsquo|hellip|mdash|middot);/g, m => ENTITIES[m] || m)
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
}

function segments(text) {
  const segs = [];
  // attributs traduisibles
  for (const m of text.matchAll(/\b(?:placeholder|title|aria-label|alt|data-tip)=(["'])(.*?)\1/g)) segs.push(m[2]);
  if (/<[a-z!\/][^>]*>/i.test(text)) {
    for (const part of text.split(/<[^>]*>/)) segs.push(part);
  } else {
    segs.push(text);
  }
  return segs.map(s => decodeEntities(s).replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const LETTERS = /[A-Za-zÀ-ÖØ-öø-ÿŒœ]/g;
function isHumanText(s) {
  if (s.length < 2) return false;
  if ((s.match(LETTERS) || []).length < 2) return false;
  if (/^(https?:|mailto:|data:|\.\.?\/|#[\w-]|assets\/|[\w-]+\.(js|css|png|jpe?g|webp|svg|json|html)\b)/i.test(s)) return false;
  if (/[{};]\s*$/.test(s) && /:/.test(s) && !/\{\d+\}/.test(s)) return false;          // CSS
  if (/^[\w-]+\s*:\s*[^ ]+;/.test(s)) return false;                                      // style inline
  if (/^[.#\[][\w-]/.test(s)) return false;                                               // sélecteurs
  if (/\.(jpe?g|png|webp|tiff?|svg|gif)\b/i.test(s)) return false;                         // noms de fichiers
  if (/^(CC[ -]|Public domain|GFDL|Copyrighted free use)/i.test(s)) return false;            // licences
  if (/^(var|rgba?|hsla?|calc|url|translate|scale|rotate|cubic-bezier)\(/i.test(s)) return false;
  if (/^[\w.$]+\([^)]*\)$/.test(s)) return false;                                         // appels
  if (/^[\w-]+(=|:)[\w-]/.test(s) && !/\s/.test(s)) return false;
  if (/^[a-z0-9_$-]+$/.test(s)) return false;                                            // identifiants en minuscules
  if (/^[A-Z0-9_]+$/.test(s)) return false;                                               // CONSTANTES
  if (/^[\d\s.,:%°+\-/×x]+[a-zA-Z°%]{0,3}$/.test(s)) return false;                        // mesures
  if (/^(M|L|C|Q|A|Z|m|l|c|q|a|z|h|v|H|V)[\d\s.,-]/.test(s) && /\d/.test(s) && !/\s[a-zà-ÿ]{3,}/.test(s)) return false; // chemins SVG
  const hasSpace = /\s/.test(s);
  const hasAccent = /[À-ÖØ-öø-ÿŒœ’]/.test(s);
  const capitalWord = /^[A-ZÀ-Ö][a-zà-ÿ]+[!?.…]?$/.test(s);
  if (!hasSpace && !hasAccent && !capitalWord) return false;
  if (!hasSpace && /[A-Z][a-z]+[A-Z]/.test(s)) return false;                             // camelCase
  return true;
}

/* ---------- Collecte ---------- */
const found = new Map(); // clé -> Set(fichiers)
function add(key, file) {
  if (!isHumanText(key)) return;
  if (!found.has(key)) found.set(key, new Set());
  found.get(key).add(file);
}

const jsFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && !SKIP_JS.has(f));
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const lit of extractLiterals(src)) for (const seg of segments(lit)) add(seg, f);
}
for (const f of HTML_FILES) {
  let html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  if (f === 'photos.html') html = html.replace(/<(table|ul|ol|figure|dl|article)[\s\S]*?<\/\1>/gi, '');
  for (const seg of segments(html)) add(seg, f);
  for (const m of html.matchAll(/<meta[^>]+name="(?:description|apple-mobile-web-app-title)"[^>]+content="([^"]+)"/g)) add(m[1], f);
}

const keys = [...found.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
const outDir = path.join(ROOT, 'locales', 'source');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'fr.json'), JSON.stringify(keys, null, 1) + '\n');
const chars = keys.reduce((a, k) => a + k.length, 0);
const byFile = {};
for (const [, files] of found) for (const f of files) byFile[f] = (byFile[f] || 0) + 1;
console.log(`${keys.length} textes, ${chars} caractères → locales/source/fr.json`);
console.log(Object.entries(byFile).sort((a, b) => b[1] - a[1]).map(([f, c]) => `  ${f}: ${c}`).join('\n'));
