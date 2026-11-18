const test = require('node:test'), assert = require('node:assert/strict');
const { read, i18nContext } = require('./src-extract.cjs');
/* Contrôle final 3 : onglet Saisons en anglais et en espagnol, des phrases assemblées restaient en partie en français :
   « eau à 29 °C, mois pluvieux », « 4 s · venue from the southeast », « 21 j », « Buceo : lo mejor » (espace française).
   Chaque morceau est un gabarit traduisible ({0}, {1}… comme i18n.js les gère), les jours passent par Intl. */
const T = (lang, s) => i18nContext(lang, {}).obT(s);

/* Avant tout contexte i18n (qui enveloppe Intl pour la langue choisie) : unité « jour » d’Intl dans les trois langues. */
test('saisons : jours de pluie par Intl, « 21 j » en français, « 21 days » en anglais, « 21 d » en espagnol', () => {
  const days = (l, v) => new Intl.NumberFormat(l, { style: 'unit', unit: 'day', unitDisplay: 'short', maximumFractionDigits: 0 }).format(v);
  assert.match(days('fr', 21), /^21\sj$/, 'français inchangé');
  assert.match(days('en', 21), /^21\sdays$/);
  assert.match(days('es', 21), /^21\sd$/);
});

test('saisons : verdict, raisons et houle traduits en anglais et en espagnol', () => {
  assert.equal(T('en', '<b>Plongée : top</b> en novembre'), '<b>Diving: top</b> in novembre', 'gabarit du verdict (le mois vient déjà d’Intl)');
  assert.equal(T('es', '<b>Plongée : top</b> en noviembre'), '<b>Buceo: lo mejor</b> en noviembre', 'ponctuation espagnole, sans espace avant les deux-points');
  assert.equal(T('en', 'eau à 29 °C'), 'water at 29 °C');
  assert.equal(T('es', 'mois pluvieux'), 'mes lluvioso');
  assert.equal(T('en', '4 s · venue du sud-est'), '4 s · coming from the southeast');
  assert.equal(T('es', '4 s · venue du sud-est'), '4 s · procedente del sureste');
  assert.equal(T('en', '9 s · venue d’ouest'), '9 s · coming from the west');
});

test('saisons : chaque raison dans son élément, jours de pluie par Intl, houle sans direction sans séparateur orphelin', () => {
  const js = read('spot-data.js');
  assert.match(js, /return bits\.length \? ' · ' \+ bits\.map\(b => `<span>\$\{esc\(b\)\}<\/span>`\)\.join\(', '\) : '';/);
  assert.match(js, /const head = L == null \? '' : `<b>\$\{esc\(sportLabel\(act\)\)\} : \$\{esc\(LEVEL_TXT\[L\]\.toLowerCase\(\)\)\}<\/b> en \$\{esc\(monthName\(selMonth\)\)\}`;/);
  assert.match(js, /<span class="sd-vmain">\$\{head\}<\/span>\$\{verdictWhy\(act, d\)\}/);
  assert.match(js, /M\.DIR_FROM\[d\.dir\] \? `\$\{num\(d\.tp\)\} s · venue \$\{M\.DIR_FROM\[d\.dir\]\}` : `\$\{num\(d\.tp\)\} s`/);
  assert.match(js, /bars\('wet', a\.wet, 'Pluie · jours de pluie dans le mois', days, 0, 'b-rain'\);/);
  assert.doesNotMatch(js, /\$\{num\(d\.wet\)\} j`|' j', 0/, 'plus de « j » français en dur');
});
