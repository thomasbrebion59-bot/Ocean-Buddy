/* explorer-carte-spots-2, -4, -7 */
const test = require('node:test'), assert = require('node:assert');
const { read } = require('./src-extract.cjs');
const src = read('ocean-map.js');

test('explorer-carte-spots-2 : reset() désactive le plan « Quand ? » et vide la recherche flottante', () => {
  const m = /function reset\(\)\{(.*?)\n/.exec(src);
  assert.ok(m, 'reset introuvable');
  assert.match(m[1], /OceanPlan\??\.(?:active\??\.\(\)\)?)?[^;]*set\(null\)/, 'plan non réinitialisé');
  assert.match(m[1], /\.ex-top input/, 'champ flottant non vidé');
  assert.ok(m[1].indexOf('OceanPlan') < m[1].indexOf('choose(null)'), 'plan à vider avant choose(null)');
});

test('explorer-carte-spots-4 : ensureMap supprime la carte à moitié créée après un échec', () => {
  const m = /function ensureMap\(\)\{(.*?)\n  function engineReady/s.exec(src);
  assert.ok(m);
  assert.match(m[1], /let m=null;[\s\S]*starting=\(async/, 'm doit être déclaré hors de l’IIFE');
  assert.match(m[1], /starting\.catch\(\(\)=>\{[^}]*m\?\.remove\(\)/, 'remove() absent du catch');
  assert.doesNotMatch(m[1], /const m=new ml\.Map/);
});

test('explorer-carte-spots-7 : marges immersives bornées en paysage téléphone', () => {
  const cap = /function capV\([^\n]*\n/.exec(src), pad = /function pad\(\)\{\n[^\n]*\n/.exec(src), pp = /function planetPad\(\)\{[^\n]*\n/.exec(src);
  assert.ok(cap && pad && pp);
  const mk = (h, cardH) => new Function('stage', 'innerHeight', 'innerWidth', 'card', 'safeTop', 'immersive', 'mobile', 'filters',
    `${cap[0]}${pad[0]}return {}};${pp[0]}return {pad,planetPad}`)({ clientHeight: h, clientWidth: 844 }, h, 844, cardH ? { hidden: false, offsetHeight: cardH } : null, () => 0, () => true, () => true, null);
  const e = mk(390, 160), p = e.pad(), q = e.planetPad();
  assert.ok(390 - q.top - q.bottom >= 0.4 * 390, 'zone libre du globe trop petite');
  assert.ok(p.top + p.bottom < 390 * 0.6);
  const portrait = mk(844, 0).planetPad();
  assert.deepStrictEqual([portrait.top, portrait.bottom], [110, 200]);
});
