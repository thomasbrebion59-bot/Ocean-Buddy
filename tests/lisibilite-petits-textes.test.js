/* Lisibilité : aucun texte explicite sous 12 px dans community.css et trips.css.
   Hors commentaires, ni font-size ni raccourci font ne descendent sous le plancher (px, rem et em comptés en base 16).
   Pour clamp(), seul le minimum (premier argument) compte. Les tailles héritées ou en mots-clés ne sont pas vérifiées. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FILES = ['community.css', 'trips.css'];
const MIN_PX = 12;

function strip(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ' '); }
function toPx(token) {
  const m = /^(\d*\.?\d+)(px|rem|em)$/.exec(token.trim());
  if (!m) return null;
  return parseFloat(m[1]) * (m[2] === 'px' ? 1 : 16);
}
/* Taille d'un font-size : longueur simple, ou premier argument d'un clamp()/max()/min(). */
function sizeOfValue(value) {
  const v = value.trim().replace(/!important$/, '').trim();
  const fn = /^(?:clamp|max|min)\(\s*([^,)]+)/.exec(v);
  return toPx(fn ? fn[1] : v);
}
/* Taille d'un raccourci font : premier jeton longueur (un éventuel /interligne est ignoré). */
function sizeOfShorthand(value) {
  const v = value.replace(/var\([^)]*\)/g, ' ').replace(/!important/, ' ');
  const fn = /(?:^|\s)(?:clamp|max|min)\(\s*([^,)]+)/.exec(v);
  if (fn) return toPx(fn[1]);
  for (const tok of v.trim().split(/\s+/)) {
    const size = toPx(tok.split('/')[0]);
    if (size !== null) return size;
  }
  return null;
}
function declarations(css) {
  const out = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = rule.exec(strip(css)))) {
    const selector = m[1].trim().replace(/\s+/g, ' ');
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      const prop = d.slice(0, i).trim().toLowerCase(), value = d.slice(i + 1);
      if (prop === 'font-size') out.push({ selector, prop, value: value.trim(), px: sizeOfValue(value) });
      else if (prop === 'font') out.push({ selector, prop, value: value.trim(), px: sizeOfShorthand(value) });
    }
  }
  return out;
}

for (const file of FILES) {
  test(`${file} : aucune taille de police explicite sous ${MIN_PX}px`, () => {
    const decls = declarations(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    assert.ok(decls.filter(d => d.px !== null).length > 10, 'le lecteur de CSS ne trouve presque aucune taille : test vide');
    const small = decls.filter(d => d.px !== null && d.px < MIN_PX);
    assert.deepEqual(small.map(d => `${d.selector} { ${d.prop}: ${d.value} }`), []);
  });
}

test('le lecteur repère bien les tailles trop petites', () => {
  const bad = declarations('.a{font-size:11px}.b{font:700 10px var(--body)}.c{font:9px/1.5 x}.d{font-size:.7rem}.e{font:800 clamp(10px,5vw,20px)/1 y}.f{font-size:12px}.g{font:600 12px/1.2 z}/* .h{font-size:8px} */');
  assert.deepEqual(bad.filter(d => d.px < MIN_PX).map(d => d.selector), ['.a', '.b', '.c', '.d', '.e']);
  assert.equal(bad.length, 7);
});

/* Cascade : les feuilles chargées après (ocean-blue.css, app-shell.css) réimposent des tailles < 12 px sur ces sélecteurs ;
   trips.css et community.css doivent garder une règle préfixée .ocean-v2 (plus spécifique) qui les remet à 12 px. */
test('surcharges de taille de ocean-blue.css et app-shell.css neutralisées', () => {
  const read = f => strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).replace(/\s+/g, ' ');
  const trips = read('trips.css'), community = read('community.css');
  assert.match(trips, /\.ocean-v2 \.trip-step-info small ?\{ ?font-size:12px ?\}/);
  assert.match(trips, /\.ocean-v2 \.trip-step-photo button ?\{ ?font-size:12px ?\}/);
  assert.match(trips, /\.ocean-v2 \.trip-heading \.page-eyebrow[^{]*\{ ?font-size:12px ?!important/);
  assert.match(community, /\.ocean-v2 \.community-share-step ?\{ ?font-size:12px ?\}/);
});
