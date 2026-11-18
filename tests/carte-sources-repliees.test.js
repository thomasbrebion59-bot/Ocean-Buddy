const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Cartes MapLibre (Explorer, plongée, petite carte de la fiche) : les sources sont repliées derrière le bouton « i » à
   l’ouverture, jamais retirées. MapLibre ne rend la version compacte qu’à l’arrivée des sources et la déplie à ce moment-là :
   foldAttribution (ocean-map.js) la replie une fois, dès qu’elle devient compacte, puis ne s’en occupe plus. */
function fakeMap() {
  const handlers = {}, attrib = { attrs: new Set(['open']), cls: new Set(['maplibregl-ctrl-attrib']) };
  attrib.classList = { remove: c => attrib.cls.delete(c), add: c => attrib.cls.add(c) };
  attrib.removeAttribute = a => attrib.attrs.delete(a);
  return { attrib, handlers,
    getContainer: () => ({ querySelector: s => (s === '.maplibregl-ctrl-attrib.maplibregl-compact' && attrib.cls.has('maplibregl-compact') ? attrib : null) }),
    on: (e, f) => { (handlers[e] = handlers[e] || []).push(f); }, off: (e, f) => { handlers[e] = (handlers[e] || []).filter(x => x !== f); },
    emit(e) { for (const f of [...(handlers[e] || [])]) f(); } };
}

test('sources de la carte : repliées quand MapLibre les rend compactes (après le style), jamais retirées', () => {
  const ctx = load('ocean-map.js', ['foldAttribution'], {});
  const m = fakeMap();
  ctx.foldAttribution(m);
  assert.ok(m.attrib.attrs.has('open'), 'avant les sources : rien à replier, rien n’est touché');
  /* MapLibre (_updateCompact) : à l’arrivée des sources, version compacte ET dépliée. */
  m.attrib.cls.add('maplibregl-compact'); m.attrib.cls.add('maplibregl-compact-show');
  m.emit('sourcedata');
  assert.ok(!m.attrib.cls.has('maplibregl-compact-show') && !m.attrib.attrs.has('open'), 'repliée');
  assert.ok(m.attrib.cls.has('maplibregl-compact') && m.attrib.cls.has('maplibregl-ctrl-attrib'), 'le contrôle reste : un toucher la déplie');
  assert.deepEqual([m.handlers.styledata, m.handlers.sourcedata, m.handlers.idle].map(l => l.length), [0, 0, 0], 'une seule fois : un déplié par la personne n’est jamais refermé');
  m.attrib.cls.add('maplibregl-compact-show'); m.emit('sourcedata'); m.emit('idle');
  assert.ok(m.attrib.cls.has('maplibregl-compact-show'));
});

test('sources de la carte : la grande carte (Explorer, plongée) et la petite carte de la fiche', () => {
  const src = read('ocean-map.js');
  const adds = src.match(/m\.addControl\(new ml\.AttributionControl\(\{compact:true\}\),'bottom-right'\);foldAttribution\(m\);/g) || [];
  assert.equal(adds.length, 2);
  assert.doesNotMatch(src, /attributionControl:true/, 'pas de seconde attribution non repliée');
});
