const test = require('node:test'), assert = require('node:assert/strict');
const { i18nContext, loadInto } = require('./src-extract.cjs');
/* jeu-poulpy-langues-6 : le toast « Défi validé ! +N XP » est traduit (le préfixe 🐙 ne doit pas bloquer le gabarit). */
function toastText(lang, msg) {
  const el = { textContent: '', classList: { add() {}, remove() {} } };
  const ctx = i18nContext(lang, { tt: 0, clearTimeout() {} });
  ctx.document.getElementById = id => id === 'toast' ? el : null;
  loadInto(ctx, 'app.js', ['toast']);
  ctx.toast(msg);
  return el.textContent;
}
test('toast « Défi validé » en anglais et en espagnol', () => {
  assert.equal(toastText('en', 'Défi validé ! +45 XP'), '🐙 Challenge complete! +45 XP');
  assert.equal(toastText('es', 'Défi validé ! +45 XP'), '🐙 ¡Reto completado! +45 XP');
});
test('toast en français inchangé', () => {
  assert.equal(toastText('fr', 'Défi validé ! +45 XP'), '🐙 Défi validé ! +45 XP');
});
