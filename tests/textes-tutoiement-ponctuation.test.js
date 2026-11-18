const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : règles du fondateur sur les textes (tutoiement, pas de tiret décoratif). */
test('tutoiement : « Le savais-tu ? » (repli « Le lieu » et récit du spot), traduit en anglais et en espagnol', () => {
  for (const f of ['index.html', 'spot-voyage.js']) {
    assert.doesNotMatch(read(f), /saviez-vous/i, f);
    assert.match(read(f), /Le savais-tu \?/, f);
  }
  assert.equal(JSON.parse(read('locales/translations/en.json'))['Le savais-tu ?'], 'Did you know?');
  assert.equal(JSON.parse(read('locales/translations/es.json'))['Le savais-tu ?'], '¿Sabías que…?');
});
