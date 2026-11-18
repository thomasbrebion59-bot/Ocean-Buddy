const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./src-extract.cjs');
/* Contrôle final 3 (mineur) : dans « L’essentiel avant d’y aller » d’Hossegor, « Règles locales » citait deux fois de suite
   « Source : Tourisme Landes (office de tourisme) · consultée le 29/10/2026 » (même lien, en double dans les données). */
test('fiche pratique : une source répétée n’est citée qu’une fois', () => {
  global.window = {}; require('../catalog-runtime.js');
  const ctx = load('field-guide.js', ['visitRows'], { window: { OCEAN_SPOT_SOURCES: {} } });
  for (const id of ['hossegor', 'capbreton']) {
    const s = global.window.OCEAN_CATALOG.find(x => x.id === id);
    const rules = ctx.visitRows(s).find(r => r.key === 'localRules');
    assert.ok(rules.verified, id + ' : règles locales sourcées');
    const keys = rules.src.map(x => x.u + '|' + x.d);
    assert.equal(new Set(keys).size, keys.length, id + ' : aucune source en double');
    assert.equal(rules.src.length, 1);
  }
  delete global.window;
});
