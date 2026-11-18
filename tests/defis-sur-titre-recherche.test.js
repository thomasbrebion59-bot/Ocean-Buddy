const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : en anglais (« QUIZZES, CHALLENGES AND OCEAN-FRIENDLY ACTIO… ») et en espagnol, le sur-titre des Défis
   passait sous le bouton de recherche rond (40 px, en haut à droite). La marge droite de 96 px des grands titres
   (app-shell.css) est annulée par design.css ; un retrait intérieur, que design.css ne touche pas, laisse la place au bouton. */
test('grands titres : la place du bouton de recherche est gardée à droite (sauf l’accueil)', () => {
  const shell = read('app-shell.css'), design = read('design.css');
  assert.match(design, /\.ocean-v2 \.screen>\*:not\(\.topbar\):not\(\.float-bubbles\):not\(#worldPick\):not\(\.detail-hero\)\{max-width:none;margin-left:0;margin-right:0\}/, 'la marge est bien annulée');
  assert.doesNotMatch(design, /as-large[^{]*\{[^}]*padding/, 'design.css ne touche pas au retrait intérieur des grands titres');
  const m = shell.match(/\.ocean-v2 \.screen:not\(#home\)>\.as-large\{padding-right:(\d+)px\}/);
  assert.ok(m, 'retrait intérieur à droite des grands titres');
  assert.ok(+m[1] >= 44, 'bouton de 40 px plus un peu d’air');
  assert.ok(shell.indexOf(m[0]) > shell.indexOf('.as-large{display:flex;'), 'juste après la règle des grands titres');
});
