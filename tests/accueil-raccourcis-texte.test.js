const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle de la police (19 nov. 2026) : accueil, tuile « Mis favoritos », « Ninguno por ah… » en espagnol à 390 et
   375 px (106 px de texte dans 101 px). La ligne du dessous passe sur deux lignes au lieu d'être coupée par « … » ;
   la tuile garde ses 56 px (rien ne bouge sur l'accueil). */
test('accueil, raccourcis : la ligne du dessous n’est plus coupée par « … », deux lignes tiennent dans la tuile de 56 px', () => {
  const css = read('organisation.css');
  const small = css.match(/\n\.hf-q-tx small\{[^}]*\}/)[0];
  assert.doesNotMatch(small, /nowrap|ellipsis/);
  assert.match(small, /-webkit-line-clamp:2/);
  const [, sf, sl] = small.match(/font:600 ([\d.]+)px\/([\d.]+) /).map(Number);
  const [, bf, bl] = css.match(/\n\.hf-q-tx b\{font:800 ([\d.]+)px\/([\d.]+) /).map(Number);
  const gap = +css.match(/\n\.hf-q-tx\{display:grid;gap:(\d+)px/)[1];
  assert.match(css, /\n\.hf-q\{[^}]*height:56px;/);
  assert.ok(bf * bl + gap + 2 * sf * sl <= 56, 'deux lignes dans 56 px');
});
