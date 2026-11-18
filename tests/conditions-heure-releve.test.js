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

test('maintenant : posée sur la ligne du titre (aucune hauteur en plus) et mise à jour à chaque relevé', () => {
  const js = read('spot-before.js'), css = read('fiche.css'), app = read('app.js');
  assert.match(js, /<h3 class="fx-title" id="dNowTitle">Maintenant<\/h3><small class="fx-stamp" data-before-stamp><\/small>/);
  assert.match(js, /if \(st\) st\.textContent = l && l\.live \? stamp\(l\.fetchedAt\) : '';/);
  assert.match(js, /window\.OceanBefore = \{update, live, normal, stamp,/);
  assert.match(css, /#detail \.fx-head\{display:flex;align-items:baseline;justify-content:space-between;/);
  assert.match(css, /#detail \.fx-note,#detail \.fx-stamp\{font:400 var\(--fiche-note\)/, 'corps de la note, piloté par la variable');
  /* Les données reprises du cache de session gardent leur heure réelle. */
  assert.match(app, /meteoTimes\.set\(hit\.d,hit\.t\)/);
  assert.match(app, /LIVE\[s\.id\]=Object\.assign\(LIVE\[s\.id\]\|\|\{\},data,\{live:true,fetchedAt\}\);/);
});
