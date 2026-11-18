const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : dans la rangée « Tour du monde des cultures » de l’accueil, à 390 et 375 px, le « » » de « Namaste »
   tombait seul sur la ligne suivante et « Ki manière? » était tronqué : overflow-wrap:anywhere coupait le mot n’importe où et
   la limite de deux lignes ajoutait « … ». Le mot n’est plus jamais coupé : son corps suit sa longueur (data-fit, comme les
   tampons), estimée avec les avances réelles des lettres de la police, guillemets de la langue collés au mot. */
function boot(lang) {
  const ctx = { console, setTimeout, clearTimeout, Promise, Map, Set, Date, Math, JSON, Array, Object, String, Error,
    document: { documentElement: { lang }, addEventListener() {}, readyState: 'complete', body: { append() {} } },
    location: { hash: '', pathname: '/', search: '' }, history: {}, addEventListener() {}, OB_I18N: { lang }, obT: s => s };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(read('cultures-boot.js'), ctx);
  return ctx.OceanCultures;
}
const words = lang => Object.values(JSON.parse(read(`assets/data/cultures.${lang}.json`)).countries)
  .map(v => (v.hello && v.hello[0]) || (v.thanks && v.thanks.word) || '').filter(Boolean);

test('mot des cartes : corps selon la longueur, du plus court au plus long, dans les trois langues', () => {
  for (const lang of ['fr', 'en', 'es']) {
    const C = boot(lang);
    assert.equal(C.wordFit('Hello!'), 0, 'mot court : corps habituel');
    assert.equal(C.wordFit('Annyeonghaseyo'), 5, 'mot le plus long des données : plus petit corps, sans guillemets');
    assert.ok(C.wordFit('Konnichiwa') >= 3);
    assert.ok(C.wordFit('¡Hola! ¿Todo bien?') >= 2, 'deux mots longs : deux lignes au plus');
    const all = words(lang).map(w => C.wordFit(w));
    assert.ok(all.every(f => Number.isInteger(f) && f >= 0 && f <= 5));
    assert.ok(all.filter(f => f === 0).length > all.length * 0.6, 'la plupart des mots gardent leur taille');
  }
  /* Guillemets français avec espaces insécables : plus larges, « Namaste » et « Ki manière? » réduits en français. */
  assert.ok(boot('fr').wordFit('Namaste') >= 1);
  assert.ok(boot('fr').wordFit('Ki manière?') >= 1);
});

test('mot des cartes : jamais de coupe au milieu, jamais de « … », hauteur de carte inchangée', () => {
  const css = read('cultures.css'), org = read('fiches-organisation.css');
  const rule = css.match(/\.cult-card-word\{[^}]*\}/)[0];
  assert.doesNotMatch(rule, /anywhere|line-clamp|ellipsis/, 'ni coupe forcée, ni limite de lignes, ni « … »');
  assert.match(rule, /font:800 calc\(27px \* var\(--wfit,1\)\)\/\.98/);
  assert.match(org, /\.cult-card-word\{font-size:calc\(19px \* var\(--wfit,1\)\)\}/, 'téléphone : même échelle sur 19 px');
  for (const [f, k] of [[1, '.9'], [2, '.8'], [3, '.72'], [4, '.64'], [5, '.6']]) assert.ok(css.includes(`.cult-card-word[data-fit="${f}"]{--wfit:${k}}`));
  assert.match(css, /html \.cult-card-word\[data-fit="5"\]:not\(:empty\)::before,html \.cult-card-word\[data-fit="5"\]:not\(:empty\)::after\{content:none\}/);
  assert.match(css, /\.cult-card\{[^}]*aspect-ratio:3\/4/, 'la carte garde sa hauteur (rapport fixe), le texte est posé en bas');
  /* Posé au premier rendu (cultures-boot.js) et quand le mot arrive (cultures.js, fillHome). */
  assert.match(read('cultures-boot.js'), /data-cult-word="\$\{esc\(c\.country\)\}"\$\{w\?` data-fit="\$\{wordFit\(w\)\}"`:''\}/);
  assert.match(read('cultures.js'), /const fit=String\(api\.wordFit\?api\.wordFit\(w,LG\(\)\):0\);if\(el\.dataset\.fit!==fit\)el\.dataset\.fit=fit;/);
});
