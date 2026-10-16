/* Palettes d’activité (activity-theme.css) : chaque couple texte/fond réellement utilisé respecte WCAG AA.
   Texte : 4,5:1. Icônes et grands éléments graphiques : 3:1. Le thème par défaut (cobalt) est vérifié aussi.
   Lancer seul avec un tableau : node tests/activity-palette.test.mjs --table */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../activity-theme.css', import.meta.url), 'utf8');
export const IDS = ['surf', 'bodyboard', 'baignade', 'paddle', 'kayak', 'snorkeling', 'plongee', 'kitesurf', 'windsurf'];

function decls(body) {
  const out = {};
  for (const m of body.matchAll(/(--t-[\w-]+)\s*:\s*([^;}]+)/g)) out[m[1]] = m[2].trim();
  return out;
}
export function palettes() {
  /* Le premier bloc :root qui déclare --t-main donne les valeurs par défaut ; chaque activité les surcharge. */
  const root = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).find(b => /--t-main\s*:/.test(b));
  assert.ok(root, 'bloc :root des tokens introuvable');
  const base = decls(root), out = { defaut: base };
  for (const id of IDS) {
    const m = css.match(new RegExp(`html\\[data-act="${id}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(m, `palette absente pour ${id}`);
    out[id] = { ...base, ...decls(m[1]) };
  }
  return out;
}
function rgb(hex) {
  const h = hex.replace('#', '');
  assert.match(h, /^[0-9a-f]{6}$/i, `couleur opaque attendue, reçu ${hex}`);
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = hex => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

/* [libellé, texte, fond, minimum]. Les valeurs « #fff » sont le texte blanc posé dans le CSS
   (barre du haut sur ordinateur : #fff sur dégradé --t-nav-b → --t-nav-c ; boutons pleins sur --t-main ; cartes --t-deep). */
export const PAIRS = [
  ['blanc / main', '#ffffff', '--t-main', 4.5],
  ['blanc / main2', '#ffffff', '--t-main2', 4.5],
  ['blanc / deep', '#ffffff', '--t-deep', 4.5],
  ['blanc / nav-b', '#ffffff', '--t-nav-b', 4.5],
  ['blanc / nav-c', '#ffffff', '--t-nav-c', 4.5],
  ['blanc / nav-a (icônes)', '#ffffff', '--t-nav-a', 3],
  ['acc-ink / acc', '--t-acc-ink', '--t-acc', 4.5],
  ['cta-ink / cta', '--t-cta-ink', '--t-cta', 4.5],
  ['main / page', '--t-main', '--t-page', 4.5],
  ['main / tint', '--t-main', '--t-tint', 4.5],
  ['main2 / blanc', '--t-main2', '#ffffff', 4.5],
  ['main2 / tint', '--t-main2', '--t-tint', 4.5],
  ['deep / page', '--t-deep', '--t-page', 4.5],
  ['deep / tint', '--t-deep', '--t-tint', 4.5],
  ['bright / blanc (icônes)', '--t-bright', '#ffffff', 3]
];
export function table() {
  const p = palettes(), rows = [];
  for (const [id, pal] of Object.entries(p)) {
    const v = k => (k.startsWith('--') ? pal[k] : k);
    for (const [label, fg, bg, min] of PAIRS) rows.push({ id, label, fg: v(fg), bg: v(bg), ratio: ratio(v(fg), v(bg)), min });
  }
  return rows;
}

test('chaque activité et le thème par défaut déclarent les tokens de base en couleurs opaques', () => {
  for (const [id, pal] of Object.entries(palettes()))
    for (const k of ['--t-main', '--t-main2', '--t-deep', '--t-tint', '--t-page', '--t-nav-a', '--t-nav-b', '--t-nav-c', '--t-acc', '--t-acc-ink', '--t-cta', '--t-cta-ink', '--t-bright'])
      assert.match(pal[k] || '', /^#[0-9a-f]{6}$/i, `${id} ${k}`);
});

test('contrastes WCAG AA pour les 9 activités et le défaut', () => {
  const bad = table().filter(r => r.ratio < r.min).map(r => `${r.id} ${r.label} ${r.fg}/${r.bg} = ${r.ratio.toFixed(2)} < ${r.min}`);
  assert.deepEqual(bad, []);
});

test('les palettes restent distinctes (une couleur principale par activité)', () => {
  const mains = Object.values(palettes()).map(p => p['--t-main'].toLowerCase());
  assert.equal(new Set(mains).size, mains.length);
});

if (process.argv.includes('--table')) {
  const rows = table();
  console.log('| activité | couple | texte | fond | ratio | min |\n|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.id} | ${r.label} | ${r.fg} | ${r.bg} | ${r.ratio.toFixed(2)} | ${r.min} |`);
}
