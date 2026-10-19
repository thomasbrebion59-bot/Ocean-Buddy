const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./src-extract.cjs');
/* jeu-poulpy-langues-1 : body.onb-open masque .app-back ; il doit tomber à la fermeture du choix d'activité. */
function env() {
  const cls = s => ({ add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle(c, f) { f ? s.add(c) : s.delete(c); } });
  const bodyS = new Set(), onbS = new Set(['hide']), onb = { classList: cls(onbS), style: { display: 'none' } };
  const body = { classList: cls(bodyS) };
  const doc = { body, getElementById: id => id === 'onb' ? onb : null, querySelectorAll: () => [] };
  const g = { document: doc, setTimeout: () => 0, quickGate: false, chosenSport: 'all', activeSport: null, onbDone: false, onbWatch: false,
    renderSportGuide() {}, showStep() {}, saveState() {}, setSport() {}, realHomeForecast() {}, window: {} };
  const ctx = load('app.js', ['openActivityGate', 'finishOnb', 'syncOnbOpen'].filter(Boolean), g);
  return { ctx, body: bodyS, onb, onbS };
}
test('finishOnb retire onb-open (le bouton Retour réapparaît)', () => {
  const e = env(); e.ctx.openActivityGate();
  assert.ok(e.body.has('onb-open'));
  e.ctx.finishOnb();
  assert.equal(e.body.has('onb-open'), false);
});
test('fermer le choix sans finishOnb (cancelGate) : syncOnbOpen retire onb-open', () => {
  const e = env(); e.ctx.openActivityGate();
  e.onbS.add('hide'); e.onb.style.display = 'none';
  e.ctx.syncOnbOpen();
  assert.equal(e.body.has('onb-open'), false);
});
test('syncOnbOpen garde onb-open tant que le choix est ouvert', () => {
  const e = env(); e.ctx.openActivityGate();
  e.ctx.syncOnbOpen();
  assert.ok(e.body.has('onb-open'));
});
