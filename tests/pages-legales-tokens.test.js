/* Pages légales (privacy, support, community-rules) : thème crème par les vrais jetons.
   information.css porte /* @creme-tokens *\/, n'a aucune couleur codée en dur, n'utilise que des jetons déclarés dans
   un :root d'activity-theme.css ; chaque page charge activity-theme.css avant information.css, sans <style> ni style="". */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['privacy.html', 'support.html', 'community-rules.html'];
const MARK = '/* @creme-tokens */';
const COLOR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b|\brgba?\(|\bhsla?\(/g;
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function blank(s) { return s.replace(/[^\n]/g, ' '); }
function masked(src) {
  let t = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  t = t.replace(/url\((?:[^()]|\([^()]*\))*\)/g, blank);
  t = t.replace(/(?:-webkit-)?mask(?:-image)?\s*:[^;{}]*/g, blank);
  return t;
}

test('information.css : marqueur en première ligne, aucune couleur codée en dur', () => {
  const src = read('information.css');
  assert.equal(src.split('\n')[0].trim(), MARK);
  const t = masked(src), bad = [];
  for (const m of t.matchAll(COLOR)) {
    const next = t.slice(m.index).search(/[{;}]/);
    if (next >= 0 && t[m.index + next] === '{') continue;
    bad.push(`information.css:${src.slice(0, m.index).split('\n').length} ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('information.css : ne déclare aucune constante de couleur (plus de --t-* dans son :root)', () => {
  const css = masked(read('information.css'));
  const decl = [...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]);
  assert.deepEqual(decl, [], 'les jetons viennent d’activity-theme.css');
});

test('information.css : chaque jeton var(--t-…) est déclaré dans un :root d’activity-theme.css', () => {
  const theme = read('activity-theme.css');
  const root = [...theme.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).join(';');
  const declared = new Set([...root.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const used = new Set([...masked(read('information.css')).matchAll(/var\((--[\w-]+)/g)].map(m => m[1]));
  assert.ok(used.size > 0);
  assert.deepEqual([...used].filter(v => !declared.has(v)), []);
});

test('information.css : rend son défilement à la page (activity-theme.css fixe html,body à 100 % sans défilement)', () => {
  const css = masked(read('information.css'));
  assert.match(css, /html,body\{[^}]*height:auto[^}]*overflow:visible/);
});

for (const page of PAGES) {
  test(`${page} : activity-theme.css avant information.css, ni <style> ni style=""`, () => {
    const html = read(page);
    const a = html.indexOf('<link rel="stylesheet" href="activity-theme.css">'), b = html.indexOf('<link rel="stylesheet" href="information.css">');
    assert.ok(a >= 0 && b >= 0, 'les deux feuilles sont liées');
    assert.ok(a < b, 'activity-theme.css avant information.css');
    assert.doesNotMatch(html, /<style[\s>]/i);
    assert.doesNotMatch(html, /\sstyle\s*=/i);
    assert.doesNotMatch(html.replace(/<meta name="theme-color"[^>]*>/, ''), /#[0-9a-fA-F]{3,8}\b/, 'pas de couleur hex hors meta theme-color');
  });
}
