/* Découverte des cultures : modèle pur (cultures-model.js), amorce (cultures-boot.js : « Découvrir <pays> », choix des
   pays de l’accueil) et garde-fous d’intégration (accueil, fiche spot, chargement à la demande, traductions). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../cultures-model.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const D = (y, m, d) => new Date(y, m - 1, d, 12);
const SRC = { label: 'Page d’essai', url: 'https://example.org/page' };
const I = (fr, en = fr + ' en', es = fr + ' es') => ({ fr, en, es });
const valid = () => ({
  sea: { title: I('Titre court'), text: I('Un texte court.'), source: { ...SRC } },
  fete: { title: I('Une fête'), when: I('mars'), text: I('Un texte court.'), source: { ...SRC } },
  thanks: { word: 'Terima kasih', lang: I('indonésien'), source: { ...SRC } },
  reviewed: '2026-11-16'
});

/* ---------- schéma ---------- */
test('schéma : une fiche complète est valide', () => {
  assert.deepEqual(M.validateEntry('Indonésie', valid()), []);
});
test('schéma : longueurs, https, langues, champs inconnus et date', () => {
  const e = valid();
  e.sea.title.fr = 'x'.repeat(41);
  e.sea.text.en = 'y'.repeat(171);
  e.fete.text.es = 'z'.repeat(151);
  e.fete.source.url = 'http://example.org/page';
  delete e.thanks.lang.es;
  e.sea.extra = 1;
  e.reviewed = '16/11/2026';
  const errs = M.validateEntry('Indonésie', e).join('\n');
  assert.match(errs, /sea\.title\.fr : 41 caractères \(maximum 40\)/);
  assert.match(errs, /sea\.text\.en : 171 caractères \(maximum 170\)/);
  assert.match(errs, /fete\.text\.es : 151 caractères \(maximum 150\)/);
  assert.match(errs, /fete\.source\.url : adresse https/);
  assert.match(errs, /thanks\.lang\.es : texte manquant/);
  assert.match(errs, /champ inconnu « extra »/);
  assert.match(errs, /reviewed : date AAAA-MM-JJ/);
});
test('schéma : mot en écriture latine, sans tiret cadratin ni flèche, sans balise', () => {
  const e = valid();
  e.thanks.word = 'ありがとう';
  e.sea.text.fr = 'Un texte — avec un tiret cadratin.';
  e.fete.text.fr = 'Voir ici → là';
  e.sea.title.en = '<b>gras</b>';
  const errs = M.validateEntry('Japon', e).join('\n');
  assert.match(errs, /écriture latine attendue/);
  assert.match(errs, /sea\.text\.fr : tiret cadratin ou flèche interdits/);
  assert.match(errs, /fete\.text\.fr : tiret cadratin ou flèche interdits/);
  assert.match(errs, /balise HTML interdite/);
  for (const w of ['Arigatō', 'Cảm ơn', 'Fa’afetai', 'Mālō tou ofa', 'Teşekkür ederim', 'Dziękuję', '¡Gracias!']) {
    const ok = valid(); ok.thanks.word = w;
    assert.deepEqual(M.validateEntry('X', ok), [], w);
  }
});
test('schéma : bloc « base » (pays sans carnet) et fiche vide', () => {
  const e = { base: { lang: I('wallisien'), hello: { word: 'Mālō te maʻuli', gloss: I('bonjour') }, food: { name: I('Taro'), text: I('Un plat.') }, respect: I('Un geste.'), source: { ...SRC } }, reviewed: '2026-11-16' };
  assert.deepEqual(M.validateEntry('Wallis-et-Futuna', e), []);
  delete e.base.source;
  assert.match(M.validateEntry('Wallis-et-Futuna', e).join('\n'), /base\.source : source manquante/);
  assert.match(M.validateEntry('Nulle part', { reviewed: '2026-11-16' }).join('\n'), /aucun champ/);
});

/* ---------- tampons ---------- */
test('tampons : lecture tolérante, premier tampon daté une seule fois', () => {
  assert.deepEqual(M.readState('pas du json'), M.emptyState());
  assert.deepEqual(M.readState(null), M.emptyState());
  const bad = M.readState({ stamps: { Japon: '2026-11-16', Maroc: 42, '': '2026-11-16' }, run: -3, best: 'x' });
  assert.deepEqual(bad.stamps, { Japon: '2026-11-16' });
  assert.equal(bad.run, 0);
  let r = M.stamp(M.emptyState(), 'Japon', D(2026, 11, 16));
  assert.equal(r.isNew, true); assert.equal(r.state.stamps.Japon, '2026-11-16');
  r = M.stamp(r.state, 'Japon', D(2026, 11, 20));
  assert.equal(r.isNew, false); assert.equal(r.state.stamps.Japon, '2026-11-16');
  assert.equal(M.count(r.state, ['Japon', 'Maroc']), 1);
  const s = M.readState(M.writeState({ ...r.state, stamps: { ...r.state.stamps, Maroc: '2026-11-18' } }));
  assert.deepEqual(M.recent(s, 5).map(x => x.country), ['Maroc', 'Japon']);
});

/* ---------- mot du jour ---------- */
const WORLD = {
  'Indonésie': { langs: 'Indonésien, langues régionales', hello: ['Selamat pagi', ''], thanks: { word: 'Terima kasih', lang: 'indonésien' } },
  'Malaisie': { langs: 'Malais, anglais', hello: ['Selamat datang', ''], thanks: { word: 'Terima kasih', lang: 'malais' } },
  'Japon': { langs: 'Japonais', hello: ['Konnichiwa', ''], thanks: { word: 'Arigatō', lang: 'japonais' } },
  'Espagne': { langs: 'Espagnol', hello: ['¡Hola!', ''], thanks: { word: 'Gracias', lang: 'espagnol' } },
  'Mexique': { langs: 'Espagnol', hello: ['¡Hola! ¿Qué onda?', ''], thanks: { word: 'Gracias', lang: 'espagnol' } },
  'États-Unis': { langs: 'Anglais, espagnol', hello: ['Hey!', ''], thanks: { word: 'Thank you', lang: 'anglais' } },
  'Fidji': { langs: 'Fidjien, anglais', hello: ['Bula!', ''], thanks: { word: 'Vinaka', lang: 'fidjien' } },
  'Grèce': { langs: 'Grec', hello: ['Yiá sou', ''], thanks: { word: 'Efcharistó', lang: 'grec' } },
  'Chypre': { langs: 'Grec, turc', hello: ['Yiá sas', ''], thanks: { word: 'Efcharistó', lang: 'grec' } },
  'Maroc': { langs: 'Arabe dialectal (darija), amazigh, français', hello: ['Salam', ''], thanks: { word: 'Choukran', lang: 'arabe marocain' } },
  'Djibouti': {}
};
test('mot du jour : jamais un mot trop facile, un seul pays par mot', () => {
  const items = M.quizItems(WORLD);
  const words = items.map(i => M.norm(i.word));
  for (const easy of ['hey', 'gracias', 'thank you', 'hola']) assert.ok(!words.includes(easy), easy);
  assert.equal(words.filter(w => w === 'terima kasih').length, 1);
  assert.equal(words.filter(w => w === 'efcharisto').length, 1);
});
test('mot du jour : stable dans la journée, trois choix sans ambiguïté', () => {
  const a = M.quiz(WORLD, new Date(2026, 10, 16, 8)), b = M.quiz(WORLD, new Date(2026, 10, 16, 23));
  assert.deepEqual(a, b);
  for (let d = 0; d < 60; d++) {
    const q = M.quiz(WORLD, D(2026, 11, 1 + d));
    assert.ok(q, 'question du jour ' + d);
    assert.equal(q.choices.length, 3);
    assert.equal(new Set(q.choices).size, 3);
    assert.ok(q.choices.includes(q.country));
    assert.ok(!q.choices.includes('Djibouti'), 'pays sans langue connue jamais proposé');
    const others = q.choices.filter(c => c !== q.country);
    for (const o of others) {
      const ws = [WORLD[o].hello?.[0], WORLD[o].thanks?.word].map(M.norm);
      assert.ok(!ws.includes(M.norm(q.word)), `${o} dit aussi « ${q.word} »`);
    }
    if (M.norm(q.word) === 'terima kasih') assert.ok(!q.choices.includes('Malaisie') || q.country === 'Malaisie');
    if (q.country === 'Mexique' || q.country === 'Espagne') assert.ok(!others.includes('Espagne') && !others.includes('Mexique') && !others.includes('États-Unis'));
  }
});
test('mot du jour : une réponse par jour, tampon et série de bonnes réponses', () => {
  const day1 = D(2026, 11, 16), day2 = D(2026, 11, 17), day4 = D(2026, 11, 19);
  const q1 = M.quiz(WORLD, day1);
  let r = M.answer(M.emptyState(), q1, q1.country, day1);
  assert.equal(r.ok, true); assert.equal(r.isNew, true); assert.equal(r.state.run, 1);
  assert.equal(r.state.stamps[q1.country], '2026-11-16');
  const again = M.answer(r.state, q1, q1.choices.find(c => c !== q1.country), day1);
  assert.equal(again.already, true); assert.equal(again.ok, true, 'la première réponse du jour compte');
  const q2 = M.quiz(WORLD, day2);
  r = M.answer(r.state, q2, q2.country, day2);
  assert.equal(r.state.run, 2); assert.equal(M.streak(r.state, day2), 2);
  assert.equal(M.streak(r.state, day4), 0, 'série rompue après un jour sans réponse');
  const q4 = M.quiz(WORLD, day4);
  const wrong = M.answer(r.state, q4, q4.choices.find(c => c !== q4.country), day4);
  assert.equal(wrong.ok, false); assert.equal(wrong.state.run, 0); assert.equal(wrong.isNew, false);
  assert.equal(M.answered(wrong.state, day4).ok, false);
  assert.equal(M.answered(wrong.state, day2), null);
});

/* ---------- recherche et prochaine escale ---------- */
test('recherche : le pays nommé (sans accents, en anglais ou en espagnol), sinon rien', () => {
  const labels = { 'Maroc': ['Morocco', 'Marruecos'], 'Mexique': ['Mexico', 'México'], 'Malte': ['Malta', 'Malta'], 'Japon': ['Japan', 'Japón'], 'États-Unis': ['United States', 'Estados Unidos'] };
  assert.equal(M.matchCountry('maroc', labels), 'Maroc');
  assert.equal(M.matchCountry('MARRUECOS', labels), 'Maroc');
  assert.equal(M.matchCountry('etats unis', labels), 'États-Unis');
  assert.equal(M.matchCountry('japo', labels), 'Japon');
  assert.equal(M.matchCountry('ma', labels), null);
  assert.equal(M.matchCountry('hossegor', labels), null);
});
test('prochaine escale : un pays pas encore tamponné, jamais le pays affiché', () => {
  const names = ['Japon', 'Maroc', 'Fidji', 'Grèce'];
  const s = { stamps: { Maroc: '2026-11-10', Fidji: '2026-11-11' } };
  for (let d = 1; d < 20; d++) {
    const n = M.nextCountry(names, s, 'Japon', D(2026, 11, d));
    assert.equal(n, 'Grèce');
  }
  assert.ok(['Maroc', 'Fidji', 'Grèce'].includes(M.nextCountry(names, { stamps: Object.fromEntries(names.map(n => [n, '2026-11-01'])) }, 'Japon', D(2026, 11, 3))));
});

/* ---------- amorce : « Découvrir <pays> » et pays de l’accueil ---------- */
function boot(lang = 'fr', dict = {}) {
  const ctx = { console, setTimeout, clearTimeout, Promise, Map, Set, Date, Math, JSON, Array, Object, String, Error,
    document: { documentElement: { lang }, addEventListener() {}, readyState: 'complete', body: { append() {} } },
    location: { hash: '', pathname: '/', search: '' }, history: {}, addEventListener() {}, requestIdleCallback: undefined,
    OB_I18N: { lang }, obT: s => dict[s] || s };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('cultures-boot.js'), ctx);
  return ctx.OceanCultures;
}
test('« Découvrir <pays> » : le bon article en français, en anglais et en espagnol', () => {
  const fr = boot('fr');
  assert.equal(fr.discover('Indonésie'), 'Découvrir l’Indonésie');
  assert.equal(fr.discover('Japon'), 'Découvrir le Japon');
  assert.equal(fr.discover('France'), 'Découvrir la France');
  assert.equal(fr.discover('Philippines'), 'Découvrir les Philippines');
  assert.equal(fr.discover('Îles Cook'), 'Découvrir les Îles Cook');
  assert.equal(fr.discover('Costa Rica'), 'Découvrir le Costa Rica');
  assert.equal(fr.discover('Madagascar'), 'Découvrir Madagascar');
  assert.equal(fr.discover('La Réunion'), 'Découvrir La Réunion');
  const en = boot('en', { 'États-Unis': 'United States', 'Japon': 'Japan' });
  assert.equal(en.discover('États-Unis'), 'Discover the United States');
  assert.equal(en.discover('Japon'), 'Discover Japan');
  assert.equal(boot('es').discover('Pays-Bas', 'es', 'Países Bajos'), 'Descubre los Países Bajos');
  assert.equal(boot('es').discover('Japon', 'es', 'Japón'), 'Descubre Japón');
});
test('accueil : un pays par carte, photo réelle, jamais la France en français, stable dans la journée', () => {
  const C = boot('fr');
  const spots = [];
  const countries = ['France', 'Japon', 'Maroc', 'Fidji', 'Grèce', 'Pérou', 'Islande', 'Brésil', 'Inde', 'Kenya'];
  countries.forEach((c, i) => { for (let k = 0; k < 3; k++) spots.push({ id: c + k, country: c, world: ['eu', 'as', 'af', 'oc', 'eu', 'sa', 'eu', 'sa', 'as', 'af'][i] }); });
  spots.push({ id: 'sansphoto', country: 'Chili', world: 'sa' });
  const photo = s => s.id === 'sansphoto' ? null : { src: s.id + '.jpg', thumb: s.id + '-t.jpg', w: s.id.endsWith('1') ? 1600 : 800 };
  const picks = C.homePicks({ spots, photo, score: () => 50, day: D(2026, 11, 16), lg: 'fr' });
  assert.equal(picks.length, 8);
  assert.equal(new Set(picks.map(p => p.country)).size, 8);
  assert.ok(!picks.some(p => p.country === 'France'));
  assert.ok(!picks.some(p => p.country === 'Chili'), 'pays sans photo réelle écarté');
  assert.ok(picks.every(p => p.s.id.endsWith('1')), 'la photo en haute définition passe devant');
  assert.deepEqual(C.homePicks({ spots, photo, score: () => 50, day: new Date(2026, 10, 16, 22), lg: 'fr' }).map(p => p.country), picks.map(p => p.country));
  assert.ok(C.homePicks({ spots, photo, score: () => 50, day: D(2026, 11, 16), lg: 'en' }).length === 8);
  const html = C.homeHTML({ spots, photo, score: () => 50, day: D(2026, 11, 16), lang: 'fr' });
  assert.match(html, /data-cult-home/);
  assert.equal((html.match(/data-cult-word=/g) || []).length, 8);
  assert.match(html, /data-cult-quiz-body/);
  assert.equal(C.homeHTML({ spots: spots.slice(0, 6), photo, lang: 'fr' }), '', 'moins de 4 pays : pas de rangée');
});

/* ---------- intégration ---------- */
test('intégration : un seul point d’accroche dans home-feed.js, chargement à la demande, fiche spot', () => {
  const hf = read('home-feed.js');
  assert.equal((hf.match(/culturesSection\(\)/g) || []).length, 2, 'la fonction et un seul appel');
  assert.match(hf, /OceanCultures\?\.homeHTML/);
  const html = read('index.html');
  assert.match(html, /<script src="cultures-boot\.js[^"]*"><\/script>/);
  assert.ok(html.indexOf('<script src="cultures-boot.js') < html.indexOf('<script src="home-feed.js'), 'amorce chargée avant home-feed.js');
  assert.ok(!/<script src="cultures\.js/.test(html) && !/<script src="cultures-model\.js/.test(html), 'vue et modèle chargés à la demande');
  assert.match(html, /<link rel="stylesheet" href="cultures\.css/);
  const bootSrc = read('cultures-boot.js');
  assert.match(bootSrc, /OceanBoot\.after/);
  assert.match(bootSrc, /const V='[0-9a-f]{12}';/);
  for (const f of ['scripts/build-static.cjs', 'scripts/build-mobile.cjs']) assert.match(read(f), /'cultures-model\.js','cultures\.js'/, f);
  assert.match(read('spot-guide.js'), /data-cult-open="\$\{esc\(ctry\)\}" data-cult-from="spot"/);
  for (const l of ['fr', 'en', 'es']) assert.ok(fs.existsSync(path.join(root, `assets/data/cultures.${l}.json`)), l);
});
test('traductions : textes de la découverte des cultures en anglais et en espagnol', () => {
  const en = JSON.parse(read('locales/translations/en.json')), es = JSON.parse(read('locales/translations/es.json'));
  for (const k of ['Tour du monde des cultures', 'Le mot du jour', 'Mes tampons', 'Cultures découvertes', 'Prochaine escale', 'Pour saluer', 'Pour dire merci', 'La mer et ses traditions', 'Une fête à vivre', 'Dans quel pays dit-on ce mot pour saluer ?', 'Nouveau tampon : {0} ({1}/{2})']) {
    assert.ok(en[k] && en[k] !== k, 'en : ' + k);
    assert.ok(es[k] && es[k] !== k, 'es : ' + k);
  }
});
