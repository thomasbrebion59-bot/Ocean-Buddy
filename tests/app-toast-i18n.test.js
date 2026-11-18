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

/* Explorer : la carte détaillée ne se charge pas, « Carte détaillée indisponible… » ne recouvre jamais « Voir le spot »
   ni « Ajouter à un voyage » : le message se pose juste au-dessus de l’aperçu du spot (position de mise en page). */
test('toast en Explorer : posé au-dessus de l’aperçu du spot, position normale ailleurs', () => {
  const fs = require('node:fs'), path = require('node:path');
  const classes = new Set(), props = {};
  const el = { textContent: '', classList: { add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) }, style: { setProperty: (k, v) => { props[k] = v; } } };
  const stage = { getBoundingClientRect: () => ({ top: 0 }) }, card = { offsetParent: stage, offsetTop: 652 };
  const ctx = i18nContext('fr', { tt: 0, clearTimeout() {}, setTimeout() { return 0; }, innerHeight: 932 });
  ctx.document.getElementById = id => (id === 'toast' ? el : null);
  ctx.document.body = { dataset: { screen: 'spots' } };
  ctx.document.querySelector = s => (s === '#spotMapWrap .omap-card:not([hidden])' ? card : null);
  loadInto(ctx, 'app.js', ['toast']);
  ctx.toast('Carte détaillée indisponible pour le moment.');
  assert.ok(classes.has('show') && classes.has('is-lifted'));
  assert.equal(props['--toast-lift'], '292px', '932 − 652 + 12 : le bas du message 12 px au-dessus de l’aperçu');
  ctx.document.body.dataset.screen = 'home';
  ctx.toast('Ajouté à ton voyage');
  assert.ok(!classes.has('is-lifted'), 'hors Explorer : position habituelle');
  const css = fs.readFileSync(path.join(__dirname, '..', 'ocean-hub.css'), 'utf8');
  assert.match(css, /#toast\.is-lifted\{bottom:var\(--toast-lift,98px\)!important;margin-bottom:0!important;transition-property:opacity,transform\}/);
});
