/* Fluidité (chantier creme-logo, point chaud n°4) : le défilement n'appelle plus history.replaceState à chaque image
   (WebKit limite ces appels puis lève SecurityError), et un Retour ne reconstruit que ce qui a changé (point chaud n°3). */
const test = require('node:test'), assert = require('node:assert');
const vm = require('vm');
const { read } = require('./src-extract.cjs');

function el(id) {
  const listeners = {};
  const classes = new Set();
  const node = {
    id, dataset: {}, style: {}, hidden: false, value: '', textContent: '', innerHTML: '', scrollTop: 0,
    classList: { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)), toggle: (c, on) => { const v = on === undefined ? !classes.has(c) : !!on; v ? classes.add(c) : classes.delete(c); return v; }, contains: c => classes.has(c) },
    setAttribute() {}, removeAttribute() {}, prepend() {}, append() {}, focus() {}, contains: () => false, getClientRects: () => [],
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, fire: (t, e = {}) => (listeners[t] || []).forEach(f => f(e)),
    closest: () => null
  };
  return node;
}

function load() {
  const nodes = {};
  const get = s => (nodes[s] ||= el(s));
  get('#onb').classList.add('hide');
  const timers = []; let now = 0, rafs = [];
  const calls = { replace: 0, push: 0, renderSpots: 0, renderHome: 0, go: [] };
  const win = { listeners: {}, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }, OceanTrips: { route: () => ({ selected: null, view: 'itinerary' }), restoreRoute() {} } };
  const history = {
    state: null,
    replaceState(s) { calls.replace++; this.state = s; },
    pushState(s) { calls.push++; this.state = s; },
    back() {}
  };
  const document = {
    body: el('body'), activeElement: null,
    querySelector: get, querySelectorAll: () => [],
    createElement: () => el('new')
  };
  document.body.dataset.screen = 'home';
  const ctx = vm.createContext({
    window: win, document, history, CSS: { escape: s => s }, console,
    requestAnimationFrame: f => { rafs.push(f); return rafs.length; }, cancelAnimationFrame: () => {},
    queueMicrotask: f => Promise.resolve().then(f),
    setTimeout: (f, ms) => { const t = { f, at: now + (ms || 0), on: true }; timers.push(t); return timers.length; },
    clearTimeout: id => { if (id && timers[id - 1]) timers[id - 1].on = false; },
    spotWorld: null, spotCountry: null, activeSport: null, currentFilter: 'all', currentSearch: '', favOnly: false, nearMode: false, userPos: null,
    spotShown: 24, SPOT_PAGE: 24, mapFull: false, currentSpot: null, detailSport: null, SPORTMAP: { surf: { label: 'Surf' } }, SPOTS: [],
    worldOf: () => null, countryCount: () => 0, worldCount: () => 0, spotSports: () => [],
    renderSportFilters() {}, renderCountries() {}, renderWorlds() {}, syncWorldUI() {}, renderSpots() { calls.renderSpots++; },
    setView() {}, setMapFull() {}, showHomeCat() {}, renderHome() { calls.renderHome++; }, openSpot() {}, setDetailSport() {},
    go(s) { calls.go.push(s); document.body.dataset.screen = s; }
  });
  win.history = history;
  vm.runInContext(read('navigation.js'), ctx);
  const wrap = get('#screenWrap');
  const advance = ms => {
    const end = now + ms;
    for (;;) {
      const due = timers.filter(t => t.on && t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      now = due.at; due.on = false; due.f();
    }
    now = end;
    const r = rafs; rafs = []; r.forEach(f => f(now));
  };
  return { ctx, win, wrap, calls, advance, history };
}

test('un long défilement n’écrit l’historique qu’une fois, à la fin du geste', () => {
  const { wrap, calls, advance, history } = load();
  const before = calls.replace;
  for (let i = 1; i <= 300; i++) { wrap.scrollTop = i * 6; wrap.fire('scroll'); advance(16); } /* ~5 s à 60 i/s */
  assert.ok(calls.replace - before <= 1, `replaceState appelé ${calls.replace - before} fois pendant le défilement`);
  advance(400);
  assert.strictEqual(calls.replace - before, 1, 'la position doit être enregistrée une fois après le geste');
  assert.strictEqual(history.state.route.scroll, 1800);
});

test('scrollend enregistre tout de suite la position', () => {
  const { wrap, calls, advance, history } = load();
  const before = calls.replace;
  wrap.scrollTop = 420; wrap.fire('scroll'); advance(16);
  wrap.fire('scrollend'); advance(0);
  assert.strictEqual(calls.replace - before, 1);
  assert.strictEqual(history.state.route.scroll, 420);
  advance(500);
  assert.strictEqual(calls.replace - before, 1, 'pas de seconde écriture après scrollend');
});

test('Retour vers un écran dont l’Explorer et l’accueil n’ont pas changé : rien n’est reconstruit', () => {
  const { win, ctx, calls } = load();
  const route = { screen: 'home', world: null, country: null, sport: null, filter: 'all', search: '', favorites: false, near: false, shown: 24, view: 'list', mapFull: false, homeTab: 'jour', trip: null, scroll: 0 };
  win.listeners.popstate.forEach(f => f({ state: { owner: 'oceanbuddy-navigation-v1', index: 0, from: null, route } }));
  assert.strictEqual(calls.renderSpots, 0, 'Explorer reconstruit sans raison');
  assert.strictEqual(calls.renderHome, 0, 'accueil reconstruit sans raison');
  assert.deepStrictEqual(calls.go, ['home']);
  /* L'activité change avec le Retour : Explorer et accueil sont refaits. */
  win.listeners.popstate.forEach(f => f({ state: { owner: 'oceanbuddy-navigation-v1', index: 0, from: null, route: { ...route, sport: 'surf' } } }));
  assert.strictEqual(ctx.activeSport, 'surf');
  assert.strictEqual(calls.renderSpots, 1);
  assert.strictEqual(calls.renderHome, 1);
});
