/* Globe de l'accueil : libéré hors accueil, repris au retour, reconstruit après perte de contexte. */
const test = require('node:test'), assert = require('node:assert');
const { read, load } = require('./src-extract.cjs');

function monde(screen = 'home') {
  const calls = [], classes = new Set(['is-live']);
  const crees = [];
  const home = { querySelector: s => s === '[data-hf-globe]' ? { isConnected: true, closest: () => ({ classList: { add: c => classes.add(c), remove: c => classes.delete(c) } }) } : { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } } };
  const g = {
    home, Boot: null, document: { hidden: false }, calls, classes, crees,
    body: () => ({ dataset: { screen: g.screen } }), screen,
    clearTimeout, setTimeout: (f) => { g.timers.push(f); return g.timers.length; }, timers: [], Date,
    window: { IntersectionObserver: function () {}, OceanGlobe: { supported: () => true, create(host, opts) { const api = { opts, active: null, setActive(v) { this.active = v; }, destroy() { calls.push('destroy'); } }; crees.push(api); return Promise.resolve(api); } } }
  };
  const ctx = load('home-feed.js', ['dropPlanet', 'stopPlanet', 'loadPlanet', 'onPlanetLost', 'syncPlanet'], g);
  require('vm').runInContext('var planet=null,planetIO={disconnect(){}},planetBusy=false,planetOn=true,planetLosses=[],planetTimer=0;var homeShown=()=>body().dataset.screen===\'home\';var planetLive=()=>planetOn&&!document.hidden&&homeShown();', ctx);
  ctx.window = g.window; ctx.g = g;
  return ctx;
}
const tick = () => new Promise(r => setImmediate(r));

test('globe libéré hors accueil puis recréé au retour', async () => {
  const c = monde('home'); c.g.screen = 'home';
  const host = c.home.querySelector('[data-hf-globe]');
  c.loadPlanet(host); await tick();
  assert.equal(c.g.crees.length, 1);
  c.g.screen = 'spots'; c.syncPlanet();
  assert.deepEqual(c.g.calls, ['destroy']);
  assert.ok(!c.g.classes.has('is-live'));
  c.g.screen = 'home'; c.syncPlanet(); await tick();
  assert.equal(c.g.crees.length, 2);
});

test('perte de contexte : globe libéré puis reconstruit, abandon après 3 pertes', async () => {
  const c = monde('home'); c.g.screen = 'home';
  const host = c.home.querySelector('[data-hf-globe]');
  c.loadPlanet(host); await tick();
  c.g.crees[0].opts.onContextLost();
  assert.deepEqual(c.g.calls, ['destroy']);
  assert.equal(c.g.timers.length, 1);
  c.g.timers.shift()(); await tick();
  assert.equal(c.g.crees.length, 2);
  for (let i = 0; i < 3; i++) { c.g.crees[c.g.crees.length - 1].opts.onContextLost(); c.g.timers.splice(0).forEach(f => f()); await tick(); }
  assert.ok(c.g.crees.length <= 5);
  const n = c.g.crees.length;
  c.g.crees[n - 1].opts.onContextLost(); assert.equal(c.g.timers.length, 0);
});

test('ocean-map : planetTries remis à zéro après reconstruction réussie', () => {
  const s = read('ocean-map.js');
  assert.match(s, /planetTries=0;\n\s+np\.setPadding/);
});
