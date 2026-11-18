const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : le 📞 du bouton « Appeler » (Sécurité & secours, onglet Conditions) restait gris foncé sur le
   fond sombre du bouton (l’emoji garde ses couleurs). Icône en trait, de la couleur du texte (clair) ; libellé traduit. */
test('Sécurité & secours : « Appeler » avec une icône de la couleur du texte, sans emoji', () => {
  const html = read('index.html'), m = html.match(/<a class="sc-btn" id="dCall" href="tel:112">([\s\S]*?)<\/a>/);
  assert.ok(m, 'bouton toujours là, lien tel: gardé');
  assert.doesNotMatch(m[1], /📞/);
  assert.match(m[1], /<svg class="uic"[^>]*stroke="currentColor"[^>]*aria-hidden="true">/);
  assert.match(m[1], /<\/svg>Appeler$/);
  assert.match(read('field-guide.css'), /\.ocean-v2 #detail \.sc-btn\{border-radius:6px;background:var\(--t-main\);color:var\(--t-on-main\)\}/, 'texte clair (B1)');
  assert.equal(JSON.parse(read('locales/translations/en.json'))['Appeler'], 'Call');
  assert.equal(JSON.parse(read('locales/translations/es.json'))['Appeler'], 'Llamar');
});
