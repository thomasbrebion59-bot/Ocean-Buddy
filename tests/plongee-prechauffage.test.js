/* fluidite-plongee-carte : la carte détaillée se prépare cachée sous le globe, au repos, jamais pendant un geste. */
const test = require('node:test'), assert = require('node:assert');
const { read } = require('./src-extract.cjs');
const src = read('ocean-map.js');

/* Extrait le bloc du préchauffage (watchGestures, scheduleWarm, warm) et l’exécute dans un faux environnement. */
function harness(over = {}) {
  const block = /\n  let warmTimer=0[\s\S]*?\n  function setMode\(/.exec(src);
  assert.ok(block, 'bloc du préchauffage introuvable');
  const code = block[0].replace(/\n  function setMode\($/, '');
  let now = 0, seq = 0, timers = [], idles = [];
  const listeners = {};
  const view = { lat: 43.5, lon: -1.5, widthKm: 9000 };
  const env = {
    map: null, starting: null, planetFailed: false, mode: 'globe', diving: false, globeFrozen: false, terrainOverlay: null,
    warmAt: null, DIVE_KM: 3200, created: 0, dataSet: 0,
    planet: { view: () => ({ ...view }) },
    stage: { clientWidth: 390, clientHeight: 844 },
    document: { hidden: false },
    performance: { now: () => now },
    mapVisible: () => true,
    side: () => 320,
    setData() { env.dataSet++; },
    ensureMap() { env.created++; env.seen = env.warmAt; env.starting = Promise.resolve({}); return env.starting; },
    setTimeout(fn, ms) { const id = ++seq; timers.push({ id, at: now + ms, fn }); return id; },
    clearTimeout(id) { timers = timers.filter(t => t.id !== id); },
    requestIdleCallback(fn) { const id = ++seq; idles.push({ id, fn }); return id; },
    cancelIdleCallback(id) { idles = idles.filter(t => t.id !== id); },
    ...over
  };
  env.window = env;
  const api = new Function('env', `with(env){${code}\nreturn {watchGestures,scheduleWarm,warm};}`)(env);
  const host = { addEventListener(type, fn) { listeners[type] = fn; } };
  api.watchGestures(host);
  /* Avance le temps : minuteries puis rappels de repos, dans l’ordre. */
  const advance = ms => {
    const end = now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const t = timers[0];
      if (idles.length) { const i = idles.shift(); i.fn(); continue; }
      if (!t || t.at > end) break;
      timers.shift(); now = t.at; t.fn();
    }
    now = end;
  };
  return { env, api, view, advance, fire: type => listeners[type]?.() };
}

test('le préchauffage crée la carte quand le globe est visible et immobile, à l’échelle de la plongée', async () => {
  const h = harness();
  h.api.scheduleWarm(0);
  h.advance(5000);
  assert.equal(h.env.created, 1, 'carte non préparée au repos');
  assert.deepEqual(h.env.seen, { lat: 43.5, lon: -1.5, kmPerPx: 3200 / 320 }, 'vue de départ = centre du globe, échelle de la plongée');
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.env.dataSet, 1, 'spots posés sur la carte préparée');
});

test('jamais pendant un geste : doigt posé, puis 1 s de calme exigée après le relâchement', () => {
  const h = harness();
  h.fire('pointerdown');
  h.api.scheduleWarm(0);
  h.advance(8000);
  assert.equal(h.env.created, 0, 'préparée pendant un doigt posé');
  h.fire('pointerup');
  h.advance(600);
  assert.equal(h.env.created, 0, 'préparée moins d’une seconde après le geste');
  h.advance(3000);
  assert.equal(h.env.created, 1);
});

test('jamais pendant que le globe bouge (vol, inertie) : il faut deux relevés identiques', () => {
  const h = harness();
  h.api.scheduleWarm(0);
  for (let i = 0; i < 80; i++) { h.view.lon += 0.5; h.advance(100); }
  assert.equal(h.env.created, 0, 'préparée pendant que la vue change');
  h.advance(3000);
  assert.equal(h.env.created, 1);
});

test('la rotation d’ambiance de la vue du monde (longitude seule, lente) n’empêche pas le préchauffage', () => {
  const h = harness();
  h.api.scheduleWarm(0);
  for (let i = 0; i < 60 && !h.env.created; i++) { h.view.lon += 0.16; h.advance(100); }
  assert.equal(h.env.created, 1, 'jamais préparée pendant la rotation d’ambiance');
  const k = harness();
  k.api.scheduleWarm(0);
  for (let i = 0; i < 60; i++) { k.view.lon += 0.16; k.view.lat += 0.05; k.advance(100); }
  assert.equal(k.env.created, 0, 'la latitude bouge : le globe n’est pas au repos');
});

test('rien hors du globe : carte affichée, plongée, scène d’activité, relief, onglet caché', () => {
  for (const over of [{ mode: 'map' }, { diving: true }, { globeFrozen: true }, { terrainOverlay: {} }, { document: { hidden: true } }, { mapVisible: () => false }, { stage: { clientWidth: 0, clientHeight: 0 } }]) {
    const h = harness(over);
    h.api.scheduleWarm(0);
    h.advance(20000);
    assert.equal(h.env.created, 0, 'préparée avec ' + JSON.stringify(Object.keys(over)));
  }
});

test('carte déjà créée ou en cours : aucun second départ', () => {
  const h = harness({ starting: Promise.resolve({}) });
  h.api.scheduleWarm(0); h.advance(10000);
  assert.equal(h.env.created, 0);
});

test('ensureMap part de la vue préchauffée, puis l’oublie', () => {
  const m = /function ensureMap\(\)\{(.*?)\n  function engineReady/s.exec(src);
  assert.ok(m);
  assert.match(m[1], /v=warmAt\|\|\(dive&&planet\?planet\.view\(\):null\);warmAt=null;/);
  assert.match(src, /loadEngine\(\)\.then\(\(\)=>scheduleWarm\(0\)\)/, 'préchauffage lancé après le chargement du moteur');
});
