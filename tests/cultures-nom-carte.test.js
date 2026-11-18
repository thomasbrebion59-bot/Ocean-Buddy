const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('./src-extract.cjs');
/* Contrôle sur simulateur (18 nov.) : sous le mot de la carte, le nom du pays était coupé par « … » (« MOZAMBIQ… »).
   Un nom de pays n’est jamais coupé : corps et interlettrage réduits, ou plusieurs lignes pour les noms très longs, coupées
   aux espaces et après les traits d’union. Choisi selon la longueur (avances réelles de DM Sans 750 en capitales). */
function boot(lang) {
  const ctx = { console, setTimeout, clearTimeout, Promise, Map, Set, Date, Math, JSON, Array, Object, String, Error,
    document: { documentElement: { lang }, addEventListener() {}, readyState: 'complete', body: { append() {} } },
    location: { hash: '', pathname: '/', search: '' }, history: {}, addEventListener() {}, OB_I18N: { lang }, obT: s => s };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(read('cultures-boot.js'), ctx);
  return ctx.OceanCultures;
}

test('nom du pays : une ligne si un corps à peine réduit suffit, sinon plusieurs lignes, jamais « … »', () => {
  const C = boot('fr');
  assert.equal(C.nameFit('Inde'), 0);
  assert.equal(C.nameFit('Maurice'), 0);
  assert.ok(C.nameFit('Mozambique') >= 1, '« MOZAMBIQUE » sur une ligne, corps réduit');
  for (const n of ['Saint-Vincent-et-les-Grenadines', 'Papouasie-Nouvelle-Guinée', 'Îles Vierges des États-Unis', 'Trinité-et-Tobago', 'République dominicaine'])
    assert.ok([0, 1, 2, 3].includes(C.nameFit(n)), n);
  for (const lang of ['fr', 'en', 'es']) {
    const B = boot(lang), names = Object.entries(JSON.parse(read(`assets/data/cultures.${lang}.json`)).countries).map(([c, v]) => v.name || c);
    const fits = names.map(n => B.nameFit(n));
    assert.ok(fits.every(f => [0, 1, 2, 3].includes(f)));
    assert.ok(fits.filter(f => f === 0).length > names.length * 0.6, lang + ' : la plupart des noms gardent leur taille');
  }
});

test('nom du pays : retour à la ligne permis, ni coupe au milieu d’un mot, ni « … », posé au rendu et au remplissage', () => {
  const css = read('cultures.css'), rule = css.match(/\n\.cult-card-name\{[^}]*\}/)[0];
  assert.doesNotMatch(rule, /nowrap|ellipsis|overflow:hidden|anywhere/);
  assert.match(rule, /white-space:normal;overflow-wrap:normal/);
  assert.ok(css.includes('.cult-card-name[data-fit="1"]{font-size:11px;letter-spacing:.4px}'));
  assert.ok(css.includes('.cult-card-name[data-fit="2"]{font-size:10.5px;letter-spacing:.2px}'));
  assert.ok(css.includes('.cult-card-name[data-fit="3"]{font-size:10px;letter-spacing:0}'));
  assert.match(read('cultures-boot.js'), /<span class="cult-card-name" data-fit="\$\{nameFit\(c\.country\)\}">/);
  assert.match(read('cultures.js'), /if\(nm\)\{const nf=String\(api\.nameFit\?api\.nameFit\(nm\.textContent\):0\);if\(nm\.dataset\.fit!==nf\)nm\.dataset\.fit=nf;\}/);
});
