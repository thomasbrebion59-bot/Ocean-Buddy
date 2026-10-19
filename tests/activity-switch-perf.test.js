const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), { read } = require('./src-extract.cjs');
/* Fluidité du changement d'activité (creme-logo, point chaud n° 1) : canevas réalloué seulement si la taille change,
   couleurs posées sans fondu sous la scène opaque, cartes mesurées sans getBoundingClientRect. */

function themeEnv({ wide = true, covered = false } = {}) {
  const htmlCls = new Set(), cbs = [], dims = { w: 0, h: 0, sets: 0, clear: 0 };
  const g2d = new Proxy({ clearRect() { dims.clear++; } }, { get: (t, k) => k in t ? t[k] : () => {}, set: () => true });
  const canvas = { getContext: () => g2d, set width(v) { dims.w = v; dims.sets++; }, get width() { return dims.w; }, set height(v) { dims.h = v; dims.sets++; }, get height() { return dims.h; } };
  const amb = { setAttribute() {}, set innerHTML(v) {}, querySelector: () => canvas };
  const style = { getPropertyValue: () => '#2f7cf0', setProperty() {}, removeProperty() {} };
  const document = { readyState: 'loading', hidden: false, body: { classList: { contains: () => false }, prepend() {} },
    documentElement: { dataset: {}, style, classList: { add: c => htmlCls.add(c), remove: c => htmlCls.delete(c), contains: c => htmlCls.has(c) } },
    createElement: () => amb, querySelector: () => null, getElementById: () => null, addEventListener() {} };
  const ctx = vm.createContext({ document, window: {}, matchMedia: q => ({ matches: wide && /960/.test(q), addEventListener() {} }), getComputedStyle: () => style,
    addEventListener() {}, innerWidth: 1200, innerHeight: 800, devicePixelRatio: 2, performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout() {},
    requestAnimationFrame: f => { cbs.push(f); return cbs.length; }, cancelAnimationFrame() {}, SPORTMAP: {}, console });
  ctx.window = ctx;
  ctx.OceanTransition = { get covered() { return covered; } };
  vm.runInContext(read('activity-theme.js'), ctx);
  return { ctx, htmlCls, cbs, dims };
}

test('le canevas des particules n’est réalloué qu’au premier choix, pas à chaque activité', () => {
  const e = themeEnv();
  e.ctx.OceanTheme.set('surf');
  assert.equal(e.dims.sets, 2, 'width + height posés une fois');
  assert.equal(e.dims.w, 2400);
  e.ctx.OceanTheme.set('kayak');
  e.ctx.OceanTheme.set('plongee');
  assert.equal(e.dims.sets, 2, 'pas de nouvelle allocation à taille égale');
  assert.ok(e.dims.clear >= 2, 'le canevas est effacé à la place');
  e.ctx.innerWidth = 1000;
  e.ctx.OceanTheme.set('surf');
  assert.equal(e.dims.w, 2000, 'nouvelle taille prise en compte');
});

test('sur téléphone (< 960 px), le canevas ne tourne pas et n’est jamais dimensionné', () => {
  const e = themeEnv({ wide: false });
  e.ctx.OceanTheme.set('surf');
  e.ctx.OceanTheme.set('kayak');
  assert.equal(e.dims.sets, 0);
  assert.equal(e.cbs.length, 0, 'aucune image de particules planifiée');
});

test('sous la scène opaque, les couleurs se posent sans fondu puis le fondu revient', () => {
  const e = themeEnv({ wide: false, covered: true });
  e.ctx.OceanTheme.set('surf');
  assert.ok(e.htmlCls.has('act-instant'), 'fondu suspendu pendant l’échange couvert');
  e.cbs.shift()(16);
  assert.ok(e.htmlCls.has('act-instant'), 'encore suspendu le temps que le style soit calculé');
  e.cbs.shift()(32);
  assert.ok(!e.htmlCls.has('act-instant'), 'fondu de 0,4 s rétabli ensuite');
});

test('changement visible (sans scène) : le fondu de 0,4 s est conservé', () => {
  const e = themeEnv({ wide: false, covered: false });
  e.ctx.OceanTheme.set('surf');
  assert.ok(!e.htmlCls.has('act-instant'));
});

test('activity-theme.css : act-instant coupe la transition, la transition de 0,4 s reste sur html', () => {
  const css = read('activity-theme.css');
  assert.match(css, /html\.act-instant\{transition:none\}/);
  assert.match(css, /html\{transition:--t-main \.4s ease/);
});

/* polish.js : apparition des cartes, sans mesure synchrone. */
function polishEnv() {
  const observers = [];
  class IO { constructor(cb, opts) { this.cb = cb; this.opts = opts; this.targets = new Set(); observers.push(this); }
    observe(el) { this.targets.add(el); } unobserve(el) { this.targets.delete(el); } }
  let gbcr = 0, mo = null;
  const mk = (name) => { const cls = new Set(['spot']); const props = {};
    return { name, isConnected: true, nodeType: 1, matches: () => true, querySelectorAll: () => [], tagName: 'DIV',
      classList: { add: (...c) => c.forEach(x => cls.add(x)), remove: (...c) => c.forEach(x => cls.delete(x)), has: c => cls.has(c) },
      style: { setProperty: (k, v) => { props[k] = v; } }, props, getBoundingClientRect() { gbcr++; return { top: 0, bottom: 0, width: 0 }; } }; };
  const wrap = { addEventListener() {}, querySelectorAll: () => [], getBoundingClientRect() { gbcr++; return { top: 0, bottom: 800 }; } };
  const document = { getElementById: id => id === 'screenWrap' ? wrap : null, body: { classList: { contains: () => false, toggle() {}, remove() {}, add() {} }, dataset: {} },
    documentElement: { classList: { contains: () => false } }, querySelector: () => null, createElement: () => ({}) };
  const raf = [];
  const ctx = vm.createContext({ document, window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, matchMedia: () => ({ matches: false }),
    IntersectionObserver: IO, MutationObserver: class { constructor(cb) { mo = cb; } observe() {} }, requestAnimationFrame: f => raf.push(f), setTimeout: () => 0,
    navigator: { onLine: true }, location: { hash: '', protocol: 'http:', hostname: 'x' }, console });
  ctx.window.IntersectionObserver = IO;
  vm.runInContext(read('polish.js'), ctx);
  const [reveal, probe] = observers;
  return { reveal, probe, mk, add: nodes => { mo([{ addedNodes: nodes }]); raf.splice(0).forEach(f => f()); }, gbcr: () => gbcr };
}
const entry = (el, top, width = 300) => ({ target: el, boundingClientRect: { top, bottom: top + 200, width }, rootBounds: { top: 0, bottom: 800 }, isIntersecting: width > 0 && top < 800 });

test('polish.js : une carte rendue ne déclenche aucun getBoundingClientRect', () => {
  const e = polishEnv();
  const a = e.mk('a'), b = e.mk('b'), c = e.mk('c');
  e.add([a, b, c]);
  assert.equal(e.gbcr(), 0, 'aucune mesure synchrone');
  assert.equal(e.probe.targets.size, 3, 'visibilité confiée à l’observateur');
  e.probe.cb([entry(a, 100), entry(b, 1200), entry(c, 0, 0)]);
  assert.equal(e.probe.targets.size, 0, 'sonde retirée après le premier rapport');
  assert.ok(!a.classList.has('rv'), 'carte visible re-rendue : pas de clignotement');
  assert.ok(b.classList.has('rv'), 'carte hors champ : prête à apparaître');
  assert.equal(b.props['--rv-delay'], '0ms');
  assert.ok(e.reveal.targets.has(b) && !e.reveal.targets.has(a));
  assert.ok(!c.classList.has('rv'), 'écran caché : pas d’animation');
});

test('polish.js : une carte déjà vue n’est pas re-sondée', () => {
  const e = polishEnv();
  const a = e.mk('a');
  e.add([a]); e.probe.cb([entry(a, 100)]);
  e.add([a]);
  assert.equal(e.probe.targets.size, 0);
});

test('« Réduire les animations » coché depuis les Réglages : particules arrêtées ET effacées', () => {
  const e = themeEnv();
  let reduce = false;
  e.ctx.document.body.classList.contains = c => c === 'reduce-motion' && reduce;
  e.ctx.OceanTheme.set('surf');
  const planned = e.cbs.length, cleared = e.dims.clear;
  reduce = true;
  e.ctx.OceanTheme.refresh();
  assert.equal(e.cbs.length, planned, 'aucune image planifiée après refresh');
  assert.ok(e.dims.clear > cleared, 'la dernière image n’est pas laissée figée');
  reduce = false;
  e.ctx.OceanTheme.refresh();
  assert.equal(e.cbs.length, planned + 1, 'décoché : les particules reprennent');
});
