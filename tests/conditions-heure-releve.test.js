const test = require('node:test'), assert = require('node:assert/strict');
const { read, i18nContext, loadInto } = require('./src-extract.cjs');
/* Contrôle final 3 : une fiche déjà vue, ouverte hors ligne, montrait dans « Maintenant » les dernières valeurs (vent, houle,
   eau) comme si c’étaient celles du moment. Elles restent affichées, avec l’heure de leur relevé à côté (« Relevé à 14 h 05 »),
   ou la date si ce n’est pas aujourd’hui. Même texte en tête de l’onglet Conditions. */
const at = new Date(2026, 10, 18, 14, 5).getTime(), sameDay = new Date(2026, 10, 18, 22, 40).getTime(), nextDay = new Date(2026, 10, 19, 9, 0).getTime();
function stampIn(lang, t, now) {
  const ctx = i18nContext(lang, {});
  loadInto(ctx, 'spot-before.js', ['stamp']);
  const fr = ctx.stamp(t, now);
  return { fr, shown: ctx.obT(fr) };
}

test('maintenant : l’heure du relevé en français, la date si ce n’est pas aujourd’hui', () => {
  assert.equal(stampIn('fr', at, sameDay).shown, 'Relevé à 14 h 05');
  assert.match(stampIn('fr', at, nextDay).shown, /^Relevé le 18 nov\.?$/);
  assert.equal(stampIn('fr', NaN, sameDay).shown, '', 'sans heure connue, rien n’est inventé');
});

test('maintenant : l’heure du relevé traduite en anglais et en espagnol', () => {
  assert.match(stampIn('en', at, sameDay).shown, /^Measured at 2:05\sPM$/);
  assert.match(stampIn('en', at, nextDay).shown, /^Measured on Nov 18$/);
  assert.equal(stampIn('es', at, sameDay).shown, 'Medido a las 14:05');
  assert.match(stampIn('es', at, nextDay).shown, /^Medido el 18 nov\.?$/);
});

test('maintenant : posée sur la ligne du libellé (aucune hauteur en plus) et mise à jour à chaque relevé', () => {
  const js = read('spot-before.js'), css = read('spot-before.css'), app = read('app.js');
  assert.match(js, /<span class="db-k">Maintenant<small class="db-stamp" data-before-stamp><\/small><\/span>/);
  assert.match(js, /if \(st\) st\.textContent = l && l\.live \? stamp\(l\.fetchedAt\) : '';/);
  assert.match(js, /window\.OceanBefore = \{update, live, stamp,/);
  assert.match(css, /#detail \.db-row\[data-before="live"\] \.db-k\{display:flex;align-items:baseline;/);
  assert.match(css, /#detail \.db-stamp\{font:600 12px\/1\.3 var\(--body\);[^}]*white-space:nowrap\}/, 'même corps et même interligne que le libellé, sur une ligne');
  /* Onglet Conditions : même texte ; les données reprises du cache de session gardent leur heure réelle. */
  assert.match(app, /const stamp=live\?\.fetchedAt\?\(window\.OceanBefore\?\.stamp\?\.\(live\.fetchedAt\)\|\|''\):'';/);
  assert.match(app, /meteoTimes\.set\(hit\.d,hit\.t\)/);
  assert.match(app, /LIVE\[s\.id\]=Object\.assign\(LIVE\[s\.id\]\|\|\{\},data,\{live:true,fetchedAt\}\);/);
});
