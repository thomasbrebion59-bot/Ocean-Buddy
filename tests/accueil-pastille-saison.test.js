const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : sur l’accueil, « Pour toi aujourd’hui », la pastille « En saison en novembre » était coupée
   en « En saison en novem… » à 390 et 375 px. Le mois est celui du jour : « En saison », comme dans l’Explorer. */
test('accueil : pastille de saison courte, traduite, sans « … »', () => {
  const js = read('home-feed.js');
  assert.match(js, /if\(why\.inSeason\)out\.push\('<span class="hf-season">En saison<\/span>'\);/);
  assert.doesNotMatch(js, /En saison en \$\{/);
  for (const [l, t] of [['en', 'In season'], ['es', 'En temporada']]) assert.equal(JSON.parse(read(`locales/translations/${l}.json`))['En saison'], t);
});
