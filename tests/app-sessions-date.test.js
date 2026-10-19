const test = require('node:test'), assert = require('node:assert/strict');
const { i18nContext, loadInto } = require('./src-extract.cjs');
/* jeu-poulpy-langues-4 : la date du carnet suit la langue active, pas celle du jour de l'enregistrement. */
function render(lang, sessions) {
  const el = { innerHTML: '' };
  const ctx = i18nContext(lang, { sessions, esc: s => String(s), sportIcon: () => '', renderSessionStats() {}, SPORTMAP: undefined, go() {} });
  ctx.document.getElementById = id => id === 'sessions' ? el : null;
  loadInto(ctx, 'app.js', ['renderSessions']);
  ctx.renderSessions();
  return el.innerHTML;
}
const ts = Date.UTC(2026, 9, 19, 12);
test('session notée en français, carnet en anglais : « Oct 19 »', () => {
  const h = render('en', [{ spot: 'X', date: '19 oct.', ts }]);
  assert.match(h, /Oct 19/); assert.doesNotMatch(h, /19 oct\./);
});
test('session notée en anglais, carnet en français : « 19 oct. »', () => {
  const h = render('fr', [{ spot: 'X', date: 'Oct 19', ts }]);
  assert.match(h, /19 oct\./); assert.doesNotMatch(h, /Oct 19/);
});
test('ancienne entrée sans ts : la date enregistrée est affichée telle quelle', () => {
  assert.match(render('fr', [{ spot: 'X', date: '3 sept.' }]), /3 sept\./);
});
