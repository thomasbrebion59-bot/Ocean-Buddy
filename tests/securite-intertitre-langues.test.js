const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : l'intertitre « SÉCURITÉ » de l'onglet Conditions est un contenu CSS (::before), qu'i18n.js ne voit pas :
   il restait en français en anglais et en espagnol. Le CSS porte la traduction, la même que celle des dictionnaires. */
test('sécurité : l’intertitre de l’onglet Conditions est traduit en anglais et en espagnol', () => {
  const css = read('base.css');
  assert.match(css, /\.dcat\[data-cat="securite"\]::before\{content:"Sécurité";/);
  const tr = l => JSON.parse(read(`locales/translations/${l}.json`))['Sécurité'];
  assert.equal(tr('en'), 'Safety'); assert.equal(tr('es'), 'Seguridad');
  assert.match(css, /html\[lang="en"\] \.dcat\[data-cat="securite"\]::before\{content:"Safety"\}/);
  assert.match(css, /html\[lang="es"\] \.dcat\[data-cat="securite"\]::before\{content:"Seguridad"\}/);
});
