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

test('ponctuation : la ligne d’XP du profil n’a plus de tiret long, traduite en anglais et en espagnol', () => {
  const app = read('app.js');
  assert.match(app, /`\$\{L\.title\} · \$\{xp\} XP, plus que \$\{L\.remain\} XP avant le niveau \$\{L\.next\.n\}`/);
  assert.doesNotMatch(app, /XP — plus que/);
  const k = '{0} · {1} XP, plus que {2} XP avant le niveau {3}';
  assert.ok(JSON.parse(read('locales/source/fr.json')).includes(k), 'clé extraite');
  assert.equal(JSON.parse(read('locales/translations/en.json'))[k], '{0} · {1} XP, only {2} XP to go before level {3}');
  assert.equal(JSON.parse(read('locales/translations/es.json'))[k], '{0} · {1} XP, solo faltan {2} XP para el nivel {3}');
});
