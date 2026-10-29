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

/* ---------- « Lire les conditions » par niveau ---------- */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const flat = r => r.levels.flatMap(l => l.blocks.flatMap(b => [b.h, ...b.lines.map(x => (Array.isArray(x) ? x.join(' ') : x))])).join('\n');
const hossegor = { id: 'hossegor', level: 'expert', wind: 'Offshore E', editorialStatus: 'unverified',
  dangers: [['🌀', 'Courants de baïne très forts, surtout à marée descendante.'], ['⚡', 'Vagues creuses et puissantes qui ferment vite.']],
  zones: [{ n: 'La Gravière', l: 'expert', d: 'tubes puissants et rapides' }, { n: 'La Centrale', l: 'intermediaire', d: 'pics plus ouverts' }, { n: 'La Sud', l: 'debutant', d: 'vagues douces' }] };
const liveNow = { wind: '18 km/h E', swell: '1,8 m', temp: '17°C', tide: 'Descendante' };
const climP90 = { ...clim, wave: { ...clim.wave, p90: twelve(() => 3.5) } };
const coach = (o = {}) => M.coach({ act: 'surf', level: 'debutant', spot: hossegor, live: liveNow, clim: climP90, m: 9, monthName: 'octobre', suit: '3/2', ...o });

test('les textes du moment sont lus en nombres, et ce qui manque reste vide', () => {
  assert.deepEqual(M.parseLive(liveNow), { windKmh: 18, windDir: 90, swellM: 1.8, periodS: null, swellDirDeg: null, tempC: 17, tide: 'Descendante' });
  assert.deepEqual(M.parseLive({ wind: '—', swell: '—', temp: '—', tide: '—' }), { windKmh: null, windDir: null, swellM: null, periodS: null, swellDirDeg: null, tempC: null, tide: null });
  assert.equal(M.parseLive(null).windKmh, null);
  assert.equal(M.parseLive({ wind: '12 km/h NW' }).windDir, 315);
  assert.equal(M.parseLive({ wind: '12 km/h O' }).windDir, 270);
});

test('offshore et onshore ne se déduisent que du sens offshore donné par le catalogue', () => {
  assert.equal(M.windSide(90, 'Offshore E'), 'offshore');
  assert.equal(M.windSide(270, 'Offshore E'), 'onshore');
  assert.equal(M.windSide(0, 'Offshore E'), 'cross');
  assert.equal(M.windSide(90, 'Offshore'), null);
  assert.equal(M.windSide(90, 'Onshore 28 km/h'), null);
  assert.equal(M.windSide(null, 'Offshore E'), null);
});

test('le débutant reçoit houle, période, vent, marée, baïne, mise à l’eau, courant et drapeaux', () => {
  const r = coach(), text = flat({ levels: [r.levels[0]] });
  assert.equal(r.selected, 'debutant');
  for (const w of ['période', 'offshore', 'marée descendante', 'baïne', 'zone surveillée', 'Ne lutte pas', 'parallèle', 'Lève un bras', 'drapeau']) assert.ok(new RegExp(w, 'i').test(text), w);
  assert.match(text, /Eau à 17 °C : prévois une combinaison 3\/2\./);
  assert.match(text, /Zone indiquée pour débuter dans le catalogue : La Sud/);
  assert.match(text, /le carnet signale : Courants de baïne/);
  assert.match(text, /non vérifié/);
  assert.match(r.warn, /classé expert/);
});

test('l’intermédiaire a la fenêtre de session, l’orientation de la houle, la période, le pic et la planche', () => {
  const text = flat({ levels: [coach({ level: 'intermediaire' }).levels[1]] });
  for (const w of ['Choisir ta fenêtre', 'Orientation de la houle', 'Période et puissance', 'priorités au pic', 'Choisir ta planche']) assert.ok(new RegExp(w, 'i').test(text), w);
  assert.match(text, /arrive surtout du nord-ouest/);
  assert.match(text, /La Centrale/);
  assert.ok(!/La Gravière/.test(text), 'un pic expert ne figure pas dans la liste de l’intermédiaire');
  assert.ok(!/Tant que tu apprends/.test(text));
});

test('l’expert a la lecture fine, les coefficients, les bancs, les dangers du spot et ses limites', () => {
  const text = flat({ levels: [coach({ level: 'expert' }).levels[2]] });
  for (const w of ['Lecture fine', 'coefficient', 'bancs', 'Dangers propres au spot', 'Limites et retour au bord']) assert.ok(new RegExp(w, 'i').test(text), w);
  assert.match(text, /Vagues creuses et puissantes/);
  assert.match(text, /La Gravière/);
  assert.match(text, /dépassent 3,5 m en octobre/);
});

test('sans niveau choisi, les trois niveaux sont rendus ; avec un niveau, il est signalé', () => {
  const none = coach({ level: null });
  assert.equal(none.selected, null);
  assert.deepEqual(none.levels.map(l => l.id), ['debutant', 'intermediaire', 'expert']);
  assert.equal(coach({ level: 'n’importe quoi' }).selected, null);
  assert.equal(coach({ level: 'expert' }).selected, 'expert');
  assert.equal(coach({ level: 'expert' }).warn, null);
});

test('sans conditions du moment, seules les leçons générales et les normales restent', () => {
  const r = coach({ live: null, suit: null });
  const text = flat({ levels: [r.levels[0]] });
  assert.ok(!/Vent de /.test(text) && !/Houle de /.test(text) && !/Eau à/.test(text));
  assert.match(text, /En octobre, la période habituelle ici est d’environ 13 s/);
  assert.match(text, /Ce mois-ci ici/);
  assert.match(text, /Repérer une baïne ou un courant/);
  const sans = coach({ live: null, clim: null, suit: null });
  assert.ok(!/période habituelle/.test(flat({ levels: [sans.levels[0]] })));
});

test('le sens du vent n’est jamais inventé quand le catalogue ne le donne pas', () => {
  const r = coach({ spot: { ...hossegor, wind: 'Offshore' } }), text = flat({ levels: [r.levels[0]] });
  assert.match(text, /on ne connaît pas le sens du vent par rapport à la plage/);
  assert.ok(!/Le vent vient de la terre \(offshore\)/.test(text));
});

test('un vent fort et une grosse houle ne sont pas présentés comme faciles pour un débutant', () => {
  const text = flat({ levels: [coach({ live: { wind: '35 km/h O', swell: '3,1 m', temp: '17°C', tide: 'Montante' } }).levels[0]] });
  assert.match(text, /Grosse houle/);
  assert.match(text, /Vent fort/);
  assert.match(text, /Reste à terre/);
});

test('plongée : texte existant ; plan d’eau : pas de houle ni de marée ; kite : vent seul', () => {
  assert.equal(coach({ act: 'plongee' }), null);
  assert.equal(coach({ inland: true }), null);
  const kite = coach({ act: 'kitesurf', level: null, live: { wind: '28 km/h O', swell: '2 m', tide: 'Montante' } });
  assert.equal(kite.kind, 'wind'); assert.equal(kite.levels.length, 1);
  const t = flat(kite);
  assert.match(t, /Vent soutenu/); assert.ok(!/Houle/.test(t));
  const lake = coach({ act: 'paddle', inland: true, live: { wind: '12 km/h N', swell: '—', temp: '—', tide: 'Montante' } });
  assert.equal(lake.kind, 'water'); assert.ok(!/Marée/.test(flat(lake)));
});

test('aucun emoji et aucune formule creuse dans les textes générés', () => {
  for (const args of [{}, { level: 'expert' }, { level: null }, { act: 'kitesurf' }, { act: 'baignade' }, { live: null }]) {
    const t = flat(coach(args));
    assert.ok(!EMOJI.test(t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, m => (hossegor.dangers.some(d => d[0] === m) ? '' : m))), JSON.stringify(args));
    assert.ok(!/n’hésite pas|il est important de|il convient de|dans l’ensemble/i.test(t), JSON.stringify(args));
  }
});

test('le conseil ne fabrique ni niveau de risque ni taille de matériel', () => {
  const t = flat(coach({ level: null }));
  assert.ok(!/niveau de risque|risque (faible|élevé|modéré)|\b\d['’]?\d?\s?(pieds|ft|litres?)\b/i.test(t));
});

test('coach : le conseil « eau fraîche » n’apparaît pas en eau chaude (baignade)', () => {
  const M = require('../spot-data-model.js');
  const mk = temp => M.coach({ act: 'baignade', inland: false, level: null, spot: {}, live: { wind: '5 km/h N', temp: temp + '°C' }, clim: null, m: 0, monthName: 'janvier' });
  const txt = r => JSON.stringify(r.levels[0].blocks);
  assert.ok(!/épuise/.test(txt(mk(28))));
  assert.ok(/épuise/.test(txt(mk(15))));
});

test('période et direction du jour : lues du live, jamais devinées', () => {
  const p = M.parseLive({ ...liveNow, period: '11,2 s', periodS: 11.2, swellDir: 'O', swellDirDeg: 275 });
  assert.equal(p.periodS, 11.2);
  assert.equal(p.swellDirDeg, 275);
  assert.equal(M.parseLive({ ...liveNow, period: '9 s' }).periodS, 9);
  assert.equal(M.parseLive({ ...liveNow, period: '—', periodS: null }).periodS, null);
});

test('coach : la période du jour remplace la normale du mois, qui reste le repli annoncé', () => {
  const jour = flat({ levels: [coach({ live: { ...liveNow, period: '14 s', periodS: 14 } }).levels[0]] });
  assert.ok(/environ 14 s aujourd’hui \(valeur du modèle/.test(jour));
  assert.ok(!/période habituelle/.test(jour));
  assert.ok(/Longue/.test(jour));
  const repli = flat({ levels: [coach().levels[0]] });
  assert.ok(/période habituelle ici/.test(repli) && /pas la valeur du jour/.test(repli));
  const sansClim = flat({ levels: [coach({ clim: null, live: { ...liveNow, period: '7 s', periodS: 7 } }).levels[0]] });
  assert.ok(/environ 7 s aujourd’hui/.test(sansClim));
});

test('coach expert : la direction du jour passe avant la direction moyenne', () => {
  const r = coach({ level: 'intermediaire', live: { ...liveNow, swellDirDeg: 275 } });
  const t = flat({ levels: [r.levels[1]] });
  assert.ok(/Aujourd’hui, la houle arrive d’ouest/.test(t));
});

test('coach débutant : les blocs de sécurité citent leurs sources (https, datées) et les seuils maison sont annoncés indicatifs', () => {
  const blocks = coach().levels[0].blocks, by = h => blocks.find(b => b.h === h);
  for (const h of ['Si tu es emporté', 'Zones surveillées et drapeaux', 'Repérer une baïne ou un courant']) {
    const b = by(h); assert.ok(b && b.src && b.src.length, h);
    for (const s of b.src) { assert.match(s.u, /^https:\/\//); assert.match(s.d, /^\d{4}-\d{2}-\d{2}$/); assert.ok(s.l, h); }
  }
  const text = flat({ levels: [coach().levels[0]] });
  assert.doesNotMatch(text, /orange/i);
  assert.match(text, /jaune/);
  assert.match(text, /repères indicatifs/);
  const inter = coach({ level: 'intermediaire' }).levels[1].blocks;
  assert.ok(inter.find(b => b.h === 'Les priorités au pic').src.length);
  assert.match(flat({ levels: [{ blocks: inter }] }), /repères indicatifs, sans valeur officielle/);
});
