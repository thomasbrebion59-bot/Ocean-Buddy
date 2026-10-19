const test = require('node:test'), assert = require('node:assert/strict');
const vm = require('node:vm'), { read, load } = require('./src-extract.cjs');
/* jeu-poulpy-langues-9 : « Réduire les animations » arrête les particules en cours. */
function env() {
  const cls = new Set(), cbs = [], calls = { clear: 0, cancel: 0 };
  const g2d = new Proxy({ clearRect() { calls.clear++; } }, { get: (t, k) => k in t ? t[k] : () => {}, set: () => true });
  const canvas = { getContext: () => g2d };
  const amb = { setAttribute() {}, set innerHTML(v) {}, querySelector: () => canvas };
  const style = { getPropertyValue: () => '#ffffff', setProperty() {}, removeProperty() {} };
  const document = { readyState: 'loading', hidden: false, body: { classList: { contains: c => cls.has(c), toggle: (c, f) => f ? cls.add(c) : cls.delete(c), add: c => cls.add(c) }, prepend() {} },
    documentElement: { dataset: {}, style, classList: { add() {}, remove() {} } }, createElement: () => amb, querySelector: () => null, getElementById: () => null, addEventListener() {} };
  const ctx = vm.createContext({ document, window: {}, matchMedia: q => ({ matches: /960/.test(q), addEventListener() {} }), getComputedStyle: () => style,
    addEventListener() {}, innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout() {},
    requestAnimationFrame: f => { cbs.push(f); return cbs.length; }, cancelAnimationFrame() { calls.cancel++; }, SPORTMAP: {}, console });
  ctx.window = ctx;
  vm.runInContext(read('activity-theme.js'), ctx);
  return { ctx, cls, cbs, calls };
}
test('une image de frame() sous reduce-motion efface le canevas et ne replanifie rien', () => {
  const e = env(); e.ctx.OceanTheme.set('surf');
  assert.equal(e.cbs.length, 1, 'particules démarrées');
  e.cls.add('reduce-motion');
  e.cbs[0](100);
  assert.equal(e.cbs.length, 1, 'aucune nouvelle image planifiée');
  assert.ok(e.calls.clear >= 1);
});
test('OceanTheme.refresh redémarre les particules quand on décoche', () => {
  const e = env(); e.ctx.OceanTheme.set('surf'); e.cls.add('reduce-motion'); e.cbs[0](100);
  e.cls.delete('reduce-motion'); e.ctx.OceanTheme.refresh();
  assert.equal(e.cbs.length, 2);
});
test('toggleReduceMotion prévient le thème', () => {
  let n = 0; const c = load('app.js', ['toggleReduceMotion'], { document: { body: { classList: { toggle() {} } } }, localStorage: { setItem() {} }, window: { OceanTheme: { refresh() { n++; } } } });
  c.toggleReduceMotion(true); assert.equal(n, 1);
});
