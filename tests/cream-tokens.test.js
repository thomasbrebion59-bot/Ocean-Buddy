/* Thème crème : garde-fou des couleurs codées en dur.
   Règle : dans les CSS d'interface, aucune valeur hex, rgb(a)( ou hsl(a)( hors fichiers de jetons (activity-theme.css).
   Ne comptent pas : commentaires, url(...) (SVG en data URI), propriétés mask / -webkit-mask (couleur = alpha),
   et les blocs /* @creme-exception <étiquette> *\/ … /* @creme-exception-end *\/ dont l'étiquette figure dans EXCEPTIONS.
   Migration fichier par fichier : un fichier est vérifié dès qu'il porte le marqueur /* @creme-tokens *\/ (posé par
   le groupe qui l'a migré). Le test « tous les fichiers migrés » reste en todo jusqu'à la fin du chantier. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
/* Fichiers de jetons : activity-theme.css (app) ; information.css (pages légales autonomes qui ne chargent pas
   activity-theme.css : leurs constantes crème sont déclarées dans son propre :root). */
const TOKEN_FILES = new Set(['activity-theme.css', 'information.css']);
/* Exceptions autorisées : étiquette → fichiers où elle peut apparaître, et justification. */
const EXCEPTIONS = {
  'tb-medaille': { files: ['badges.css'], why: 'Médailles et trophées : dégradés métalliques (or, argent, bronze, irisé) = emblèmes, pas interface.' },
  'surf-avatar': { files: ['surf.css'], why: 'Avatars de secours du Jeu (peau, combinaison) : illustration.' },
  'jeu-scene': { files: ['surf-tab.css', 'surf.css'], why: 'Ciel et vagues de la carte du Jeu et fond de la scène : la scène de mer garde ses couleurs.' },
  'voyage-scene': { files: ['spot-voyage.css'], why: 'Cartes et scènes illustrées du voyage dans le spot (.vx-*) : illustration.' },
  'donnees': { files: ['spot-data.css', 'spot-immersion.css'], why: 'Couleurs de données (eau/air, échelles ordinales, schémas) vérifiées daltonisme : pas des couleurs de thème.' },
  'ambiance-masquee': { files: ['base.css'], why: 'Calque .ambiance : masqué par design.css (display:none!important), illustration jamais affichée ; non supprimé faute de preuve d’absence sur tous les écrans.' }
};
const MARK = '/* @creme-tokens */';
const COLOR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b|\brgba?\(|\bhsla?\(/g;

function uiCss() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const linked = [...html.matchAll(/<link rel="stylesheet" href="([^"?]+\.css)/g)].map(m => m[1]);
  return [...new Set(linked)].filter(f => !TOKEN_FILES.has(f) && fs.existsSync(path.join(ROOT, f)));
}
function blank(s) { return s.replace(/[^\n]/g, ' '); }
function masked(src) {
  let t = src.replace(/\/\*\s*@creme-exception\s+[\w-]+\s*\*\/[\s\S]*?\/\*\s*@creme-exception-end\s*\*\//g, blank);
  t = t.replace(/\/\*[\s\S]*?\*\//g, blank);
  t = t.replace(/url\((?:[^()]|\([^()]*\))*\)/g, blank);
  t = t.replace(/(?:-webkit-)?mask(?:-image)?\s*:[^;{}]*/g, blank);
  return t;
}
function offenders(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8'), t = masked(src), out = [];
  for (const m of t.matchAll(COLOR)) {
    /* Sélecteur (#feed, :not(#bad)…) : le prochain séparateur est « { » ; une déclaration finit par « ; » ou « } ». */
    const next = t.slice(m.index).search(/[{;}]/);
    if (next >= 0 && t[m.index + next] === '{') continue;
    out.push(`${file}:${src.slice(0, m.index).split('\n').length} ${m[0]}`);
  }
  for (const m of t.matchAll(/backdrop-filter\s*:\s*([^;}]+)/g)) if (!/^\s*(none|var\(--as-blur\))\s*(!important)?\s*$/.test(m[1])) out.push(`${file}:${src.slice(0, m.index).split('\n').length} backdrop-filter:${m[1].trim()}`);
  return out;
}

test('fichiers migrés (@creme-tokens) : aucune couleur codée en dur ni flou de verre', () => {
  const bad = uiCss().filter(f => fs.readFileSync(path.join(ROOT, f), 'utf8').includes(MARK)).flatMap(offenders);
  assert.deepEqual(bad, []);
});

test('exceptions : étiquettes connues, dans les bons fichiers, blocs fermés', () => {
  const bad = [];
  for (const f of uiCss()) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const opens = [...src.matchAll(/@creme-exception\s+([\w-]+)/g)], ends = (src.match(/@creme-exception-end/g) || []).length;
    if (opens.length !== ends) bad.push(`${f} : ${opens.length} ouverture(s), ${ends} fermeture(s)`);
    for (const m of opens) { const e = EXCEPTIONS[m[1]]; if (!e) bad.push(`${f} : étiquette inconnue ${m[1]}`); else if (!e.files.includes(f)) bad.push(`${f} : ${m[1]} non autorisée ici`); }
  }
  assert.deepEqual(bad, []);
});

test('le fichier de jetons déclare les jetons crème utilisés par les CSS', () => {
  const css = fs.readFileSync(path.join(ROOT, 'activity-theme.css'), 'utf8');
  const root = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).join(';');
  const declared = new Set([...root.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  /* Variables locales non colorées, déclarées dans leur propre fichier (pas des jetons de couleur). */
  const LOCAL_OK = { '--t-icon-rot': 'angle de hue-rotate des pictogrammes par activité (spot-immersion.css)' };
  const used = new Set();
  for (const f of uiCss()) for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/var\((--(?:t|g|a|k)-[\w-]+)/g)) used.add(m[1]);
  const missing = [...used].filter(v => !declared.has(v) && !(v in LOCAL_OK));
  assert.deepEqual(missing, [], 'jetons utilisés mais absents de :root dans activity-theme.css');
});

test('tous les CSS d’interface sont migrés vers les jetons crème', { todo: 'retirer ce todo quand tous les groupes ont posé /* @creme-tokens */' }, () => {
  const left = uiCss().filter(f => !fs.readFileSync(path.join(ROOT, f), 'utf8').includes(MARK));
  assert.deepEqual(left, []);
});
