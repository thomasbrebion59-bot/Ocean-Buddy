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
  /* Fiche v2 : le titre « En novembre » dit le mois, le verdict ne le répète plus : la pastille seule, traduite d’un bloc. */
  assert.equal(T('en', '<b>Plongée : top</b>'), '<b>Diving: top</b>', 'gabarit du verdict');
  assert.equal(T('es', '<b>Plongée : top</b>'), '<b>Buceo: lo mejor</b>', 'ponctuation espagnole, sans espace avant les deux-points');
  assert.ok(JSON.parse(read('locales/source/fr.json')).includes('<b>{0} : {1}</b>'), 'gabarit gardé par l’extraction (KEEP_KEYS)');
  assert.equal(T('en', 'eau à 29 °C'), 'water at 29 °C');
  assert.equal(T('es', 'mois pluvieux'), 'mes lluvioso');
  /* Houle du mois : la période à côté de la hauteur (« m (4 s) »), la direction seule en sous-ligne. */
  assert.equal(T('en', 'venue du sud-est'), 'coming from the southeast');
  assert.equal(T('es', 'venue du sud-est'), 'procedente del sureste');
  assert.equal(T('en', 'venue d’ouest'), 'coming from the west');
  /* Courbes : titre et précision séparés (plus de point médian). */
  assert.equal(T('en', 'heures par jour (estimation)'), 'hours per day (estimate)');
  assert.equal(T('es', 'jours de pluie dans le mois'), 'días de lluvia en el mes');
  /* Sources des normales : une phrase par élément, chacune traduite. */
  assert.equal(T('en', 'La houle est celle du large : la plage peut être plus abritée ou plus exposée.'), 'Swell is offshore: the beach may be more sheltered or more exposed.');
  assert.equal(T('es', 'Le soleil est estimé à partir du rayonnement mesuré par satellite.'), 'La luz solar se estima a partir de la radiación medida por satélite.');
  assert.equal(T('en', 'Normales calculées sur plusieurs années pour le secteur du spot :'), 'Averages calculated over several years for the spot area:');
  assert.equal(T('en', 'air, pluie, vent et soleil : NASA POWER, 2010-2024'), 'air, rain, wind and sunshine: NASA POWER, 2010-2024');
  assert.equal(T('es', 'houle : modèle WaveWatch III (NOAA, PacIOOS), 2017-2025'), 'oleaje: modelo WaveWatch III (NOAA, PacIOOS), 2017-2025');
});

test('saisons : chaque raison dans son élément, jours de pluie par Intl, houle sans direction sans séparateur orphelin', () => {
  const js = read('spot-data.js');
  assert.match(js, /return bits\.length \? `<span class="sd-why">\$\{bits\.map\(b => `<span>\$\{esc\(b\)\}<\/span>`\)\.join\(', '\)\}<\/span>` : '';/);
  assert.match(js, /const head = L == null \? '' : `<b>\$\{esc\(sportLabel\(act\)\)\} : \$\{esc\(LEVEL_TXT\[L\]\.toLowerCase\(\)\)\}<\/b>`;/);
  /* Une espace entre la pastille et les raisons : lecture vocale et copier-coller ne les collent plus (« Surf : top houle… »). */
  assert.match(js, /const why = verdictWhy\(act, d\);/);
  assert.match(js, /<span class="sd-vmain">\$\{head\}<\/span>\$\{why \? ' ' \+ why : ''\}<\/p>/);
  assert.match(js, /`m \(\$\{num\(d\.tp\)\} s\)`, M\.DIR_FROM\[d\.dir\] \? `venue \$\{M\.DIR_FROM\[d\.dir\]\}` : ''/);
  assert.match(js, /bars\('wet', a\.wet, \['Pluie', 'jours de pluie dans le mois'\], days, 0, 'b-rain'\);/);
  /* Jours de pluie : nombre et unité d’Intl séparés pour le relevé (« 16 » et « j », « days », « d »). */
  assert.match(js, /formatToParts\(v\)/);
  assert.doesNotMatch(js, /\$\{num\(d\.wet\)\} j`|' j', 0/, 'plus de « j » français en dur');
});
