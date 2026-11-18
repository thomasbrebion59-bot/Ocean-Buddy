const test = require('node:test'), assert = require('node:assert/strict');
const { read, i18nContext } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : libellé d’accessibilité du bouton Retour à moitié en français (« Volver hacia l’accueil »,
   « Retour vers les spots »). Il est construit dans navigation.js ('Retour vers '+destination), qu’on ne touche pas : un
   gabarit « Retour vers {0} » gardé par l’extraction le traduit d’un bloc, destination comprise. */
const T = (l, s) => i18nContext(l, {}).obT(s);
test('bouton Retour : libellé entier en anglais et en espagnol', () => {
  assert.equal(T('es', 'Retour vers l’accueil'), 'Volver hacia el inicio');
  assert.equal(T('en', 'Retour vers l’accueil'), 'Back to home');
  assert.equal(T('en', 'Retour vers les spots'), 'Back to spots');
  assert.equal(T('es', 'Retour vers ton profil'), 'Volver hacia tu perfil');
  assert.equal(T('en', 'Retour vers Indonésie'), 'Back to Indonesia');
  assert.equal(T('fr', 'Retour vers l’accueil'), 'Retour vers l’accueil');
  assert.match(read('navigation.js'), /const backLabel='Retour vers '\+\(entry\.from\|\|'l’accueil'\);/, 'navigation.js inchangé');
  assert.match(read('scripts/i18n-extract.cjs'), /'Retour vers \{0\}',/);
});
