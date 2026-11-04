/* explorer-carte-spots-3 : chaque niveau proposé par la carte doit survivre au Retour (restore de navigation.js).
   Depuis les filtres combinables, restore() normalise la route avec SpotRank.normFilter : chaque option de la carte
   (niveaux du menu, interrupteurs « En saison » et « Nouveaux ») doit rester une partie reconnue. */
const test = require('node:test'), assert = require('node:assert');
const { read } = require('./src-extract.cjs');
const R = require('../spot-rank-model.js');

test('restore() relit chaque option du menu et des interrupteurs de la carte', () => {
  const nav = read('navigation.js'), map = read('ocean-map.js');
  assert.match(nav, /currentFilter=window\.SpotRank\?\.normFilter\?\.\(route\.filter\)/, 'restore() ne normalise plus le filtre');
  const lv = /const levels=\[(.*?)\];/.exec(map);
  assert.ok(lv, 'tableau levels introuvable dans ocean-map.js');
  const levels = [...lv[1].matchAll(/\['([^']+)',/g)].map(m => m[1]);
  assert.ok(levels.length >= 5);
  const tg = /const toggles=\[(.*?)\];/.exec(map);
  assert.ok(tg, 'interrupteurs introuvables dans ocean-map.js');
  const toggles = [...tg[1].matchAll(/\['([^']+)',/g)].map(m => m[1]);
  for (const v of levels.concat(toggles)) assert.equal(R.normFilter(v), v, `option « ${v} » perdue au Retour`);
  /* Combinaison enregistrée avant un Retour : relue telle quelle. */
  assert.equal(R.normFilter('debutant,season,new'), 'debutant,season,new');
});
