const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../spot-data-model.js');
const root = path.join(__dirname, '..');

const twelve = f => Array.from({ length: 12 }, (_, m) => f(m));
/* Spot fictif de l’hémisphère nord : eau chaude l’été, houle l’hiver, vent au printemps. */
const clim = {
  sea: twelve(m => [14, 13, 14, 15, 17, 20, 23, 24, 22, 19, 16, 15][m]),
  air: {
    tx: twelve(m => [12, 13, 15, 18, 21, 25, 28, 28, 25, 21, 16, 13][m]), tn: twelve(() => 10),
    sun: twelve(m => [3, 4, 5, 7, 8, 10, 11, 10, 8, 6, 4, 3][m]), wet: twelve(m => [14, 12, 11, 10, 8, 5, 3, 4, 7, 10, 13, 14][m]),
    rain: twelve(() => 60), wind: twelve(m => (m >= 2 && m <= 4 ? 26 : 14)), gust: twelve(() => 25), kite: twelve(m => (m >= 2 && m <= 4 ? 70 : 15)), wdir: twelve(() => 6)
  },
  wave: {
    hs: twelve(m => (m <= 2 || m >= 9 ? 2.2 : 0.9)), tp: twelve(m => (m <= 2 || m >= 9 ? 13 : 8)), calm: twelve(m => (m <= 2 || m >= 9 ? 10 : 55)),
    flat: twelve(m => (m <= 2 || m >= 9 ? 2 : 20)), h1: twelve(m => (m <= 2 || m >= 9 ? 15 : 65)), h2: twelve(m => (m <= 2 || m >= 9 ? 55 : 13)), big: twelve(m => (m <= 2 || m >= 9 ? 28 : 2)),
    dir: twelve(() => 7), rose: [5, 0, 0, 0, 0, 5, 30, 60]
  }
};

test('la baignade est meilleure en été qu’en hiver', () => {
  const y = M.year(clim, 'baignade');
  assert.ok(y[7] > y[0]);
  assert.equal(M.level(y[0]), 0, 'eau à 14 °C : peu favorable');
  assert.ok(M.level(y[7]) >= 2);
});

test('le surf expert préfère la houle d’hiver, le débutant les petites vagues d’été', () => {
  const ex = M.year(clim, 'surf', 'expert'), db = M.year(clim, 'surf', 'debutant');
  assert.ok(ex[0] > ex[6]);
  assert.ok(db[6] > db[0]);
});

test('le kitesurf suit les mois ventés', () => {
  const y = M.year(clim, 'kitesurf');
  assert.ok(y[3] > y[7]);
  const b = M.best(y).months;
  assert.ok(b.includes(3) && b.every(m => m >= 2 && m <= 4), JSON.stringify(b));
});

test('sans vagues ni température de l’eau, pas de note inventée', () => {
  const lake = { air: clim.air };
  assert.equal(M.score('surf', M.month(lake, 0)), null);
  assert.ok(M.score('baignade', M.month(lake, 6)) > M.score('baignade', M.month(lake, 0)));
});

test('les plages de mois franchissent la fin d’année', () => {
  assert.deepEqual(M.ranges([0, 1, 2, 10, 11]), [[10, 2]]);
  assert.deepEqual(M.ranges([5]), [[5, 5]]);
  assert.deepEqual(M.ranges([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), [[0, 11]]);
  assert.deepEqual(M.ranges([1, 2, 6, 7]), [[1, 2], [6, 7]]);
  assert.deepEqual(M.ranges([]), []);
});

test('le planificateur filtre sur la vue légère', () => {
  const lite = [twelve(m => clim.sea[m]), twelve(m => clim.air.tx[m]), twelve(m => clim.air.sun[m]), twelve(m => clim.air.wet[m]), clim.air.kite, twelve(m => clim.wave.hs[m] * 10), clim.wave.calm];
  assert.equal(M.matches(lite, 7, ['warm', 'sun']), true);
  assert.equal(M.matches(lite, 0, ['warm']), false);
  assert.equal(M.matches(lite, 3, ['wind']), true);
  assert.equal(M.matches(lite, 0, ['waves']), true);
  assert.equal(M.matches(null, 0, ['warm']), false);
});

test('lever et coucher du soleil plausibles à Biarritz en juin', () => {
  const t = M.sunTimes(new Date(Date.UTC(2026, 5, 21)), 43.48, -1.56);
  assert.ok(t.rise > 4 && t.rise < 4.6, `lever ${t.rise}`);
  assert.ok(t.set > 19.8 && t.set < 20.4, `coucher ${t.set}`);
  assert.equal(M.sunTimes(new Date(Date.UTC(2026, 5, 21)), 80, 0), null, 'jour polaire');
});

test('le catalogue climatique couvre les spots et reste cohérent', () => {
  const data = require('../data/climate.json');
  const cat = require('../data/catalog.json');
  const ids = Object.keys(data.spots);
  assert.ok(ids.length >= cat.length * 0.95);
  for (const id of ids) {
    const c = data.spots[id];
    if (c.sea) { assert.equal(c.sea.length, 12); c.sea.forEach(v => assert.ok(v > -3 && v < 34, `${id} eau ${v}`)); }
    if (c.air) { c.air.tx.forEach((v, m) => assert.ok(v >= c.air.tn[m] - 0.01, `${id} tx < tn`)); }
    if (c.wave) c.wave.hs.forEach(v => assert.ok(v >= 0 && v < 8, `${id} houle ${v}`));
  }
});

/* ---- Combinaison par mois : seulement les seuils de la réponse « combinaison » de Poulpy ---- */
test('la combinaison suit les seuils de Poulpy et donne deux repères aux bornes ambiguës', () => {
  const k = t => M.wetsuit(t).join(' | ');
  assert.equal(k(12), '5/4', 'moins de 13 °C');
  assert.equal(k(12.9), '5/4');
  assert.equal(k(13), '4/3', '13 °C ouvre la plage 13-17');
  assert.equal(k(16.9), '4/3');
  assert.equal(k(17), '3/2 | 4/3', '17 °C appartient aux plages 17-21 et 13-17 : les deux repères');
  assert.equal(k(17.1), '3/2');
  assert.equal(k(21), '3/2', '21 °C ferme la plage 17-21');
  assert.equal(k(21.1), 'lycra | 3/2', 'trou entre 21 et 22 °C : les deux repères voisins');
  assert.equal(k(22), 'lycra | 3/2', 'Poulpy dit « plus de 22 °C » : 22 °C reste dans le trou');
  assert.equal(k(22.1), 'lycra');
  assert.equal(k(23), 'lycra');
  assert.equal(k(30), 'lycra');
  assert.equal(k(-1), '5/4');
});

test('sans température valide, aucune combinaison n’est inventée', () => {
  for (const t of [null, undefined, NaN, Infinity, '17', '']) assert.deepEqual(M.wetsuit(t), [], String(t));
});

test('la combinaison ne devient jamais plus épaisse quand l’eau se réchauffe, et ne dépasse jamais deux repères', () => {
  const rank = { lycra: 0, '3/2': 1, '4/3': 2, '5/4': 3 };
  let prevMax = Infinity, prevMin = Infinity;
  for (let t = 0; t <= 32; t = Math.round((t + 0.1) * 10) / 10) {
    const r = M.wetsuit(t);
    assert.ok(r.length >= 1 && r.length <= 2, `${t} °C : ${r}`);
    const ranks = r.map(x => rank[x]);
    assert.ok(ranks.every(x => x !== undefined), `${t} °C : repère inconnu ${r}`);
    assert.deepEqual(r.slice().sort((a, b) => rank[a] - rank[b]), r, 'du plus fin au plus épais');
    const hi = Math.max(...ranks), lo = Math.min(...ranks);
    assert.ok(hi <= prevMax && lo <= prevMin, `${t} °C devient plus épais`);
    prevMax = hi; prevMin = lo;
  }
});

test('tous les relevés d’eau du catalogue climatique reçoivent un repère', () => {
  const data = require('../data/climate.json');
  for (const [id, c] of Object.entries(data.spots)) for (const v of c.sea || []) assert.ok(M.wetsuit(v).length >= 1, `${id} ${v}`);
});

test('les seuils de la combinaison sont ceux de la réponse de Poulpy dans app.js', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, />22°C shorty\/lycra · 17-21°C une 3\/2 · 13-17°C une 4\/3 \+ chaussons · <13°C une 5\/4 \+ chaussons\/gants\/cagoule/,
    'la réponse de Poulpy a changé : revoir SpotDataModel.wetsuit');
});

test('la combinaison ne concerne que les sports de glisse, pas la plongée ni la baignade', () => {
  assert.deepEqual(M.SUIT_ACTS, ['surf', 'bodyboard', 'kitesurf', 'windsurf', 'wingfoil']);
  for (const a of M.WATER_ACTS) assert.ok(!M.SUIT_ACTS.includes(a), a);
});

/* ---- Faune : décodage, peu d’observations, spots en mer ---- */
test('les entités des crédits sont décodées une seule fois', () => {
  assert.equal(M.decodeEntities('(c) Jan Ebr &amp; Ivana Ebrová (CC BY)'), '(c) Jan Ebr & Ivana Ebrová (CC BY)');
  assert.equal(M.decodeEntities('&lt;b&gt; &quot;x&quot; &#39;y&#39; &#x41;&#66;'), '<b> "x" \'y\' AB');
  assert.equal(M.decodeEntities('&amp;amp;'), '&amp;', 'un seul passage : pas de double décodage');
  assert.equal(M.decodeEntities('R&D & Co &inconnu; &#0; &#9999999;'), 'R&D & Co &inconnu; &#0; &#9999999;');
  assert.equal(M.decodeEntities(null), '');
  assert.equal(M.decodeEntities(undefined), '');
  assert.equal(M.decodeEntities(42), '42');
});

test('les jeux de données de faune n’ont plus qu’un niveau d’encodage', () => {
  const ctx = vm.createContext({}); ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/data/spot-wildlife.js'), 'utf8'), ctx);
  const taxa = ctx.OCEAN_WILDLIFE.taxa;
  for (const t of Object.values(taxa)) {
    for (const txt of [t.p && t.p[1], t.fr, t.en, t.s]) {
      if (!txt) continue;
      assert.ok(!/&amp;amp;/.test(txt), txt);
      assert.ok(!/&(?:[a-z]+|#\d+);/i.test(M.decodeEntities(txt)), `entité restante : ${txt}`);
    }
  }
});

test('« peu d’observations » commence sous 8 relevés', () => {
  assert.equal(M.FEW_OBS, 8);
  assert.equal(M.fewObs(7), true);
  assert.equal(M.fewObs(8), false);
  assert.equal(M.fewObs(46), false);
  assert.equal(M.fewObs(null), false);
  assert.equal(M.fewObs(undefined), false);
});

test('la faune iNaturalist ne s’affiche que pour un spot en mer', () => {
  assert.equal(M.marineSpot({ waterType: 'sea' }), true);
  for (const w of ['lake', 'inland', undefined, null, '']) assert.equal(M.marineSpot({ waterType: w }), false, String(w));
  assert.equal(M.marineSpot(null), false);
  const cat = require('../data/catalog.json');
  const ids = new Set(cat.filter(s => s.waterType !== 'sea').map(s => s.id));
  for (const id of ['silfra', 'cenote_dosojos', 'jellyfishlake', 'maubuisson', 'bacalar']) assert.ok(ids.has(id), id);
});

/* ---- Saisons : désaccord entre le carnet et les moyennes climatiques ---- */
test('le désaccord carnet / moyennes ne se déclare que si le carnet a une saison et que seasons.json n’a aucun mois', () => {
  assert.equal(M.seasonsDisagree({ a: [1, 2] }, 'b', true), true, 'id absent');
  assert.equal(M.seasonsDisagree({ a: [1, 2], b: [] }, 'b', true), true, 'liste vide');
  assert.equal(M.seasonsDisagree({ a: [1, 2] }, 'a', true), false, 'mois en commun');
  assert.equal(M.seasonsDisagree({ a: [1, 2] }, 'b', false), false, 'pas de saison au carnet');
  assert.equal(M.seasonsDisagree(undefined, 'b', true), false, 'seasons.json pas encore chargé : on ne dit rien');
  assert.equal(M.seasonsDisagree(null, 'b', true), false);
});

test('chaque fiche du catalogue a une saison de carnet (hypothèse du message de désaccord)', () => {
  const cat = require('../data/catalog.json');
  const guides = require('../data/spot-guides.json').spots;
  const sans = cat.filter(s => !(guides[s.id] && guides[s.id].season)).map(s => s.id);
  assert.deepEqual(sans, []);
});
