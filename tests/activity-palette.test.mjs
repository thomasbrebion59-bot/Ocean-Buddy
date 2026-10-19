/* Palettes d’activité sur base crème (activity-theme.css) : chaque couple texte/fond réellement utilisé respecte WCAG AA.
   Texte : 4,5:1. Icônes, bordures de champ, focus et grands éléments graphiques : 3:1. Le thème par défaut
   (marque : crème, pétrole, soleil) est vérifié aussi. Les couples recopient ceux du script de contraste du chantier
   creme-logo (54 couples par palette, 10 palettes).
   Lancer seul avec un tableau : node tests/activity-palette.test.mjs --table */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../activity-theme.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../activity-theme.js', import.meta.url), 'utf8');
export const IDS = ['surf', 'bodyboard', 'baignade', 'paddle', 'kayak', 'snorkeling', 'plongee', 'kitesurf', 'windsurf'];
const CREAM = '#fef9eb';

function decls(body) {
  const out = {};
  for (const m of body.matchAll(/(--t-[\w-]+)\s*:\s*([^;}]+)/g)) out[m[1]] = m[2].trim().toLowerCase();
  return out;
}
/* Bloc :root des jetons : le premier qui déclare --t-main (constantes de marque + palette par défaut). */
function rootDecls() {
  const root = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).find(b => /--t-main\s*:/.test(b));
  assert.ok(root, 'bloc :root des jetons introuvable');
  return decls(root);
}
/* Bloc propre d’une activité : html[data-act="id"] (et, pour l’aperçu de l’onboarding, #onb[data-act="id"]). */
function ownDecls(id) {
  const m = css.match(new RegExp(`html\\[data-act="${id}"\\](?:\\s*,\\s*#onb\\[data-act="${id}"\\])?\\s*\\{([^}]*)\\}`));
  assert.ok(m, `palette absente pour ${id}`);
  return decls(m[1]);
}
/* Résolution : la palette de l’activité, puis les constantes et le défaut de :root. */
export function palettes() {
  const base = rootDecls(), out = { defaut: base };
  for (const id of IDS) out[id] = { ...base, ...ownDecls(id) };
  return out;
}
function rgb255(hex) {
  const h = hex.replace('#', '');
  assert.match(h, /^[0-9a-f]{6}$/i, `couleur opaque attendue, reçu ${hex}`);
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = hex => { const [r, g, b] = rgb255(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/* color-mix(in srgb, a p%, b), par canal (non arrondi). */
const mix = (a, b, p) => { const x = rgb255(a), y = rgb255(b); return x.map((v, i) => v * p / 100 + y[i] * (1 - p / 100)); };

/* [libellé, texte, fond, minimum]. Les noms --t-* sont lus dans la palette (puis :root), sinon valeur littérale. */
export const PAIRS = [
  // Texte courant et secondaire sur les fonds crème
  ['encre / page', '--t-ink', '--t-page', 4.5], ['encre / barre', '--t-ink', '--t-bar', 4.5], ['encre / carte', '--t-ink', '--t-card', 4.5],
  ['encre / teinte', '--t-ink', '--t-tint', 4.5], ['encre / pastille active', '--t-ink', '--t-pill', 4.5],
  ['encre2 / page', '--t-ink2', '--t-page', 4.5], ['encre2 / barre', '--t-ink2', '--t-bar', 4.5], ['encre2 / carte', '--t-ink2', '--t-card', 4.5], ['encre2 / teinte', '--t-ink2', '--t-tint', 4.5],
  // Texte coloré (liens, titres, onglet actif)
  ['main / page', '--t-main', '--t-page', 4.5], ['main / barre', '--t-main', '--t-bar', 4.5], ['main / carte', '--t-main', '--t-card', 4.5],
  ['main / teinte', '--t-main', '--t-tint', 4.5], ['main / pastille active (onglet)', '--t-main', '--t-pill', 4.5],
  ['main2 / page', '--t-main2', '--t-page', 4.5], ['main2 / carte', '--t-main2', '--t-card', 4.5], ['main2 / teinte', '--t-main2', '--t-tint', 4.5], ['main2 / blanc', '--t-main2', '#ffffff', 4.5],
  ['deep / page', '--t-deep', '--t-page', 4.5], ['deep / teinte', '--t-deep', '--t-tint', 4.5], ['deep / carte', '--t-deep', '--t-card', 4.5],
  ['deep2 / page', '--t-deep2', '--t-page', 4.5], ['deep2 / teinte', '--t-deep2', '--t-tint', 4.5],
  // Texte crème ou blanc sur surfaces pleines
  ['on-main / main', '--t-on-main', '--t-main', 4.5], ['on-main / main2', '--t-on-main', '--t-main2', 4.5], ['on-main / deep', '--t-on-main', '--t-deep', 4.5],
  ['on-main / deep-b', '--t-on-main', '--t-deep-b', 4.5], ['on-main / nav-b', '--t-on-main', '--t-nav-b', 4.5], ['on-main / nav-c', '--t-on-main', '--t-nav-c', 4.5],
  ['blanc / main', '#ffffff', '--t-main', 4.5], ['blanc / main2', '#ffffff', '--t-main2', 4.5], ['blanc / deep', '#ffffff', '--t-deep', 4.5],
  ['blanc / nav-b', '#ffffff', '--t-nav-b', 4.5], ['blanc / nav-c', '#ffffff', '--t-nav-c', 4.5], ['blanc / nav-a (grand texte, icônes)', '#ffffff', '--t-nav-a', 3],
  // Accents
  ['acc-ink / acc', '--t-acc-ink', '--t-acc', 4.5], ['cta-ink / cta', '--t-cta-ink', '--t-cta', 4.5], ['acc / deep (accent sur carte sombre)', '--t-acc', '--t-deep', 4.5],
  ['pétrole / soleil (bouton soleil)', '--t-petrol', '--t-sun', 4.5],
  // Éléments graphiques, bordures de champ, focus (3:1)
  ['bright / page (icônes)', '--t-bright', '--t-page', 3], ['bright / carte (icônes)', '--t-bright', '--t-card', 3], ['bright / blanc (icônes)', '--t-bright', '#ffffff', 3],
  ['edge / carte (bord de champ)', '--t-edge', '--t-card', 3], ['edge / page (bord de champ)', '--t-edge', '--t-page', 3],
  ['main / page (anneau de focus, bord actif 2 px)', '--t-main', '--t-page', 3], ['main / barre (indicateur onglet 2 px)', '--t-main', '--t-bar', 3],
  ['filet / barre (informatif)', '--t-line', '--t-bar', 1.0],
  // Sémantiques constants
  ['danger / carte', '--t-danger', '--t-card', 4.5], ['blanc / danger', '#ffffff', '--t-danger', 4.5], ['ok / carte', '--t-ok', '--t-card', 4.5], ['blanc / ok', '#ffffff', '--t-ok', 4.5],
  ['warn / carte', '--t-warn', '--t-card', 4.5], ['warn / page', '--t-warn', '--t-page', 4.5], ['on-alert / alert (pastille)', '--t-on-alert', '--t-alert', 4.5]
];
export function table() {
  const rows = [];
  for (const [id, pal] of Object.entries(palettes())) {
    const v = k => (k.startsWith('--') ? pal[k] : k);
    for (const [label, fg, bg, min] of PAIRS) rows.push({ id, label, fg: v(fg), bg: v(bg), ratio: ratio(v(fg), v(bg)), min });
  }
  return rows;
}

const PALETTE_TOKENS = ['--t-main', '--t-main2', '--t-deep', '--t-deep2', '--t-tint', '--t-line', '--t-page', '--t-bright', '--t-deep-b',
  '--t-nav-a', '--t-nav-b', '--t-nav-c', '--t-acc', '--t-acc-ink', '--t-cta', '--t-cta-ink', '--t-bar', '--t-pill', '--t-edge', '--t-veil'];
const CONSTANTS = ['--t-cream', '--t-petrol', '--t-sun', '--t-ink', '--t-ink2', '--t-card', '--t-on-main', '--t-shadow', '--t-scrim',
  '--t-alert', '--t-on-alert', '--t-danger', '--t-ok', '--t-warn'];

test('chaque activité et le thème par défaut déclarent les jetons de base en couleurs opaques', () => {
  for (const [id, pal] of Object.entries(palettes()))
    for (const k of PALETTE_TOKENS) assert.match(pal[k] || '', /^#[0-9a-f]{6}$/i, `${id} ${k}`);
});

test(':root déclare les constantes crème en couleurs opaques', () => {
  const root = rootDecls();
  for (const k of CONSTANTS) assert.match(root[k] || '', /^#[0-9a-f]{6}$/i, `:root ${k}`);
  assert.equal(root['--t-cream'], CREAM);
  assert.equal(root['--t-petrol'], '#074459');
  assert.equal(root['--t-sun'], '#fdbb53');
});

test('sans activité : palette de marque (crème, pétrole, soleil)', () => {
  const d = palettes().defaut;
  assert.equal(d['--t-page'], CREAM);
  assert.equal(d['--t-main'], '#074459');
  assert.equal(d['--t-acc'], '#fdbb53');
  assert.equal(d['--t-acc-ink'], '#074459');
});

test('contrastes WCAG AA pour les 9 activités et le défaut', () => {
  const rows = table();
  assert.equal(rows.length, PAIRS.length * 10);
  const bad = rows.filter(r => r.ratio < r.min).map(r => `${r.id} ${r.label} ${r.fg}/${r.bg} = ${r.ratio.toFixed(2)} < ${r.min}`);
  assert.deepEqual(bad, []);
});

test('chaque palette d’activité déclare son --t-cta-ink', () => {
  for (const id of IDS) assert.ok(ownDecls(id)['--t-cta-ink'], `${id} sans --t-cta-ink`);
});

test('le fond de page est le crème voilé de 4 à 10 % par la couleur de l’activité', () => {
  for (const id of IDS) {
    const p = palettes()[id], page = rgb255(p['--t-page']);
    const lo = mix(p['--t-veil'], CREAM, 4), hi = mix(p['--t-veil'], CREAM, 10);
    page.forEach((c, i) => {
      const a = Math.min(lo[i], hi[i]) - 1, b = Math.max(lo[i], hi[i]) + 1;
      assert.ok(c >= a && c <= b, `${id} --t-page ${p['--t-page']} canal ${i} = ${c} hors [${a.toFixed(1)}, ${b.toFixed(1)}]`);
    });
    assert.notEqual(p['--t-page'], CREAM, `${id} : le fond doit être teinté`);
  }
  const pct = css.match(/:root\s*\{[^}]*--t-veil-pct\s*:\s*([\d.]+)%/);
  assert.ok(pct, '--t-veil-pct absent de :root');
  assert.ok(+pct[1] >= 4 && +pct[1] <= 10, `--t-veil-pct = ${pct[1]} % hors de 4 à 10 %`);
});

test('bloc @supports : --t-page recalculé par color-mix à partir de --t-veil et --t-veil-pct', () => {
  assert.match(css, /@supports\s*\(\s*color\s*:\s*color-mix\(in srgb,\s*red 50%,\s*blue\)\s*\)\s*\{\s*html\[data-act\]\s*,\s*#onb\[data-act\]\s*\{\s*--t-page\s*:\s*color-mix\(in srgb,\s*var\(--t-veil\)\s+var\(--t-veil-pct\)\s*,\s*var\(--t-cream\)\s*\)/);
});

test('@property : initial-value = valeur par défaut de :root, et chaque jeton animé est en transition 0,4 s', () => {
  const root = rootDecls();
  const props = [...css.matchAll(/@property\s+(--t-[\w-]+)\s*\{([^}]*)\}/g)];
  assert.ok(props.length >= 14, `${props.length} @property seulement`);
  const trans = (css.match(/(?:^|\n)html\s*\{\s*transition\s*:([^}]*)\}/) || [])[1] || '';
  for (const [, name, body] of props) {
    const iv = (body.match(/initial-value\s*:\s*([^;}]+)/) || [])[1];
    assert.ok(/syntax\s*:\s*'<color>'/.test(body), `${name} : syntax <color> attendue`);
    assert.equal((iv || '').trim().toLowerCase(), root[name], `${name} : initial-value ≠ :root`);
    assert.match(trans, new RegExp(`${name}\\s+\\.4s\\s+ease`), `${name} absent de la transition de html`);
  }
  for (const k of ['--t-bar', '--t-pill', '--t-veil', '--t-edge']) assert.ok(props.some(p => p[1] === k), `@property ${k} manquant`);
});

test('activity-theme.js : couleur de barre d’état = --t-page de chaque palette', () => {
  const body = (js.match(/const COLORS\s*=\s*\{([^}]*)\}/) || [])[1];
  assert.ok(body, 'table COLORS introuvable');
  const colors = Object.fromEntries([...body.matchAll(/(\w+)\s*:\s*'(#[0-9a-f]{6})'/gi)].map(m => [m[1], m[2].toLowerCase()]));
  const p = palettes();
  assert.deepEqual(Object.keys(colors).sort(), [...IDS].sort());
  for (const id of IDS) assert.equal(colors[id], p[id]['--t-page'], `barre d’état ${id}`);
  const def = (js.match(/COLORS\[id\]\s*:\s*'(#[0-9a-f]{6})'/i) || [])[1];
  assert.equal((def || '').toLowerCase(), p.defaut['--t-page'], 'barre d’état sans activité');
});

test('index.html : theme-color = crème par défaut', { todo: 'chantier logo : passer <meta name="theme-color"> à #fef9eb, puis retirer ce todo' }, () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tc = (html.match(/<meta name="theme-color" content="([^"]*)">/i) || [])[1];
  assert.equal((tc || '').toLowerCase(), CREAM, 'theme-color d’index.html');
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
