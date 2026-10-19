/* explorer-carte-spots-3 : chaque niveau proposé par la carte doit survivre au Retour (restore de navigation.js). */
const test = require('node:test'), assert = require('node:assert');
const { read } = require('./src-extract.cjs');

test('la liste blanche de restore() couvre tous les niveaux du sélecteur de la carte', () => {
  const nav = read('navigation.js'), map = read('ocean-map.js');
  const white = /currentFilter=\[([^\]]*)\]\.includes\(route\.filter\)/.exec(nav);
  assert.ok(white, 'liste blanche introuvable dans navigation.js');
  const allowed = [...white[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const lv = /const levels=\[(.*?)\];/.exec(map);
  assert.ok(lv, 'tableau levels introuvable dans ocean-map.js');
  const levels = [...lv[1].matchAll(/\['([^']+)',/g)].map(m => m[1]);
  assert.ok(levels.length >= 5);
  for (const v of levels) assert.ok(allowed.includes(v), `niveau « ${v} » perdu au Retour`);
});
