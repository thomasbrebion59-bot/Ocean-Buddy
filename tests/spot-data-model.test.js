const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../spot-data-model.js');

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
