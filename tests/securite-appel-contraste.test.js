const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 (B1) : dans l'onglet Conditions, le bouton « Appeler » du bloc « Sécurité & secours » passait sur le fond
   de la marque (field-guide.css) en gardant le texte sombre des boutons d'appel (base.css, --t-cta-ink) : contraste
   d'environ 1,5 pour 1, illisible. Le seul bouton d'appel du bloc doit porter le texte clair prévu pour ce fond. */
test('sécurité : le bouton « Appeler » de « Sécurité & secours » est lisible (texte clair sur le fond de la marque)', () => {
  const css = read('field-guide.css');
  const rule = css.match(/\.ocean-v2 #detail \.sc-btn\{([^}]*)\}/);
  assert.ok(rule, 'règle du bouton d’appel de la fiche');
  assert.match(rule[1], /background:var\(--t-main\)/);
  assert.match(rule[1], /color:var\(--t-on-main\)/, 'texte clair sur le fond sombre');
});
