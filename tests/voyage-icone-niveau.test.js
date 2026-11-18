const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : dans l’étape d’un voyage, l’icône de niveau (levelIcon, PoulpyIcons.html) était un rond beige vide de
   126 px. img.ob-ico prend une marge intérieure de 18 %, calculée sur la largeur du conteneur (.trip-level, ~350 px) :
   63 px de chaque côté, contenu à 0 px. La marge est en px pour l’étape : l’icône reste à 30 px et se voit. */
test('voyage : l’icône de niveau de l’étape garde 30 px et une marge en px', () => {
  const css = read('spot-immersion.css');
  assert.match(css, /\.ocean-v2 img\.ob-ico\{padding:18%;/, 'la règle générale en % existe (cause du rond vide)');
  assert.match(css, /\.ocean-v2 \.trip-level \.poulpy-mini\{width:30px;height:30px;/);
  const m = css.match(/\.ocean-v2 \.trip-level img\.ob-ico:not\(\.spico\)\{padding:(\d+)px[;}]/);
  assert.ok(m, 'marge en px pour l’icône de l’étape');
  assert.ok(+m[1] > 0 && 2 * +m[1] < 30, 'il reste de la place pour le dessin dans 30 px');
  assert.ok(css.indexOf(m[0]) > css.indexOf('.ocean-v2 img.ob-ico{padding:18%') || /:not\(\.spico\)/.test(m[0]), 'plus spécifique que la règle générale');
  const trips = read('trips.js');
  assert.match(trips, /<span class="trip-level">\$\{levelIcon\(p\.level\)\}/, 'l’étape utilise la vraie icône de niveau');
  assert.match(read('poulpy-icons.js'), /class="poulpy-mini ob-ico \$\{kind\}"/);
});

/* Même cause dans la liste d’Explorer : les trois filtres de niveau montraient un rond beige vide (icône de 37 px, marge de
   18,7 px de chaque côté, calculée sur la largeur du bouton). */
test('Explorer, filtres de niveau : l’icône a une marge en px et se voit', () => {
  const css = read('spot-immersion.css'), html = read('index.html');
  const m = css.match(/\.ocean-v2 #filters \.chip img\.ob-ico:not\(\.spico\)\{padding:(\d+)px\}/);
  assert.ok(m, 'marge en px pour les icônes des filtres');
  assert.ok(+m[1] > 0 && 2 * +m[1] < 37 * .5, 'le dessin garde plus de la moitié de l’icône');
  for (const lv of ['debutant', 'intermediaire', 'expert']) assert.match(html, new RegExp('data-f="' + lv + '"[^>]*><img class="poulpy-mini ob-ico level-poulpy"'), 'filtre ' + lv);
});
