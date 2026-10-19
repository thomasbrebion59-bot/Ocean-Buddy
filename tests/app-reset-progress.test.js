const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./src-extract.cjs');
/* jeu-poulpy-langues-5 : la réinitialisation efface aussi les dates de trophées et le défi du jour. */
test('resetProgress supprime dates de trophées et défi du jour', async () => {
  const store = new Map(Object.entries({ ob_state: '{}', oceanbuddy_quiz_v1: '1', oceanbuddy_progress_v1: '1',
    oceanbuddy_badge_dates: '{"first":1}', oceanbuddy_daily: '2026-10-19', oceanbuddy_reduce: '1' }));
  let reloaded = false;
  const ctx = load('app.js', ['resetProgress'], { STORE_KEY: 'ob_state', window: { OceanConfirm: async () => true }, OceanConfirm: async () => true,
    localStorage: { removeItem: k => store.delete(k), getItem: k => store.get(k) ?? null }, location: { reload() { reloaded = true; } } });
  await ctx.resetProgress();
  assert.ok(reloaded);
  for (const k of ['ob_state', 'oceanbuddy_quiz_v1', 'oceanbuddy_progress_v1', 'oceanbuddy_badge_dates', 'oceanbuddy_daily']) assert.equal(store.has(k), false, k);
  assert.ok(store.has('oceanbuddy_reduce'), 'les préférences restent');
});
