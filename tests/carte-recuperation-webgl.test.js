/* Retours du 29 oct. : la carte devenait entièrement bleue sur iPhone (contexte WebGL perdu, jamais reconstruit).
   Cause : le test de WebGL 2 créait un nouveau contexte à chaque déplacement de la carte ; au-delà de 16 contextes,
   le navigateur retirait le plus ancien (globe ou carte). Ces tests couvrent le test unique, la reconstruction
   automatique à la même caméra, le bouton « Recharger la carte » et la réduction de la pression mémoire. */
const test = require('node:test'), assert = require('node:assert');
const vm = require('vm');
const { read, fnSource, load } = require('./src-extract.cjs');
const M = require('../ocean-map-model.js');

/* Document factice : compte les contextes WebGL créés et rendus. */
function fakeDocument() {
  const stats = { contexts: 0, released: 0 };
  const document = {
    createElement() {
      return {
        getContext(kind) {
          if (kind !== 'webgl2') return null;
          stats.contexts++;
          return { getExtension: n => n === 'WEBGL_lose_context' ? { loseContext() { stats.released++; } } : null };
        }
      };
    }
  };
  return { document, stats };
}

test('modèle : densité de pixels plafonnée à ×2 sur mobile, ×3 ailleurs', () => {
  assert.equal(M.pixelRatio(3, true), 2);
  assert.equal(M.pixelRatio(3, false), 3);
  assert.equal(M.pixelRatio(1.5, true), 1.5);
  assert.equal(M.pixelRatio(4, false), 3);
  assert.equal(M.pixelRatio(undefined, true), 1);
  assert.equal(M.pixelRatio(0, false), 1);
});

test('modèle : cache de tuiles plus petit sur mobile et pour les petites cartes', () => {
  assert.equal(M.tileCache(true), 64);
  assert.equal(M.tileCache(false), 120);
  assert.equal(M.tileCache(true, true), 40);
  assert.equal(M.tileCache(false, true), 60);
});

test('modèle : reconstruction automatique jusqu’à 3 pertes par minute, puis bouton', () => {
  const now = 100000;
  assert.deepEqual(M.recovery([], now), { recent: [], auto: true });
  assert.equal(M.recovery([now - 1000, now - 500, now], now).auto, true);
  assert.equal(M.recovery([now - 3000, now - 1000, now - 500, now], now).auto, false);
  /* Les pertes de plus d’une minute sont oubliées. */
  const old = M.recovery([now - 90000, now - 70000, now - 61000, now], now);
  assert.deepEqual(old.recent, [now]);
  assert.equal(old.auto, true);
  assert.equal(M.recovery(null, now).auto, true);
});

test('modèle : alerte tuiles seulement si plusieurs échecs sans aucune réussite après', () => {
  const now = 50000;
  assert.equal(M.tilesFailing([now - 300, now - 200, now - 100], 0, now), true);
  assert.equal(M.tilesFailing([now - 300, now - 200, now - 100], now - 150, now), false);
  assert.equal(M.tilesFailing([now - 300, now - 100], 0, now), false);
  assert.equal(M.tilesFailing([now - 9000, now - 8000, now - 7000], 0, now), false);
});

test('globe : le test de WebGL 2 ne crée qu’un seul contexte, rendu aussitôt', () => {
  const src = read('ocean-globe.js');
  const { document, stats } = fakeDocument();
  const ctx = vm.createContext({ document });
  vm.runInContext('let webgl2=null;\n' + fnSource(src, 'supported') + '\nthis.supported=supported;', ctx);
  for (let i = 0; i < 40; i++) assert.equal(ctx.supported(), true);
  assert.equal(stats.contexts, 1);
  assert.equal(stats.released, 1);
});

test('carte : webgl() réutilise le test du globe, ou fait son propre test unique', () => {
  const src = read('ocean-map.js');
  let calls = 0;
  const viaGlobe = vm.createContext({ window: { OceanGlobe: { supported: () => { calls++; return true; } } }, document: fakeDocument().document });
  vm.runInContext('let webgl2=null;\n' + fnSource(src, 'webgl') + '\nthis.webgl=webgl;', viaGlobe);
  assert.equal(viaGlobe.webgl(), true);assert.equal(calls, 1);
  const { document, stats } = fakeDocument();
  const alone = vm.createContext({ window: {}, document });
  vm.runInContext('let webgl2=null;\n' + fnSource(src, 'webgl') + '\nthis.webgl=webgl;', alone);
  for (let i = 0; i < 30; i++) alone.webgl();
  assert.equal(stats.contexts, 1);
  assert.equal(stats.released, 1);
});

test('aucun autre getContext("webgl2") ne traîne dans la carte et le globe', () => {
  for (const f of ['ocean-map.js', 'ocean-globe.js']) {
    const n = (read(f).match(/getContext\(\s*['"]webgl2?['"]/g) || []).length;
    assert.equal(n, 1, f + ' : un seul test de WebGL, mis en cache');
  }
});

/* ---------- Reconstruction de la carte détaillée et du globe ---------- */
const NAMES = ['note', 'clearNote', 'recovering', 'recoveryFailed', 'reloadAll', 'dropMap', 'onMapLost', 'rebuildMap', 'onPlanetLost', 'rebuildPlanet'];
function classList() { const set = new Set(); return { set, add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)), toggle(c, on) { if (on === undefined) on = !set.has(c); if (on) set.add(c); else set.delete(c); return on; }, contains: c => set.has(c) }; }
function fakeStatus() {
  const el = { hidden: true, classList: classList(), textContent: '', _html: '', button: null };
  Object.defineProperty(el, 'innerHTML', { get() { return el._html; }, set(v) { el._html = v; el.button = /data-omap-reload/.test(v) ? { onclick: null } : null; } });
  el.querySelector = sel => sel === '[data-omap-reload]' ? el.button : null;
  return el;
}
function fakeMap(camera = { lng: -1.44, lat: 43.66, zoom: 9.3 }) {
  return { removed: 0, remove() { this.removed++; }, getCenter: () => ({ lng: camera.lng, lat: camera.lat }), getZoom: () => camera.zoom, resize() {}, style: {} };
}
function setup(over = {}) {
  const timers = [];
  const log = { ensureMap: [], setData: 0, updateList: 0, ensurePlanet: 0 };
  const status = fakeStatus(), wrap = { classList: classList() };
  const host = { replaceChildren() { log.cleared = (log.cleared || 0) + 1; } };
  const ctx = load('ocean-map.js', NAMES, Object.assign({
    M, status, wrap, stage: { querySelector: () => host }, Date: { now: () => ctx.__now },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    SPOTS: [], selected: null, userDot: null, selectedMarker: {}, tip: null, hovered: null, lastData: 'x', planetData: 'x',
    map: null, starting: null, mapLost: false, restoreAt: null, lossTimer: 0, planetTimer: 0, planetView: null,
    mapLosses: [], planetLosses: [], noteKind: '', mode: 'map', planet: null, planetStarting: null, planetFailed: false,
    LOSS_GRACE: 700, useGlobe: () => true,
    ensureMap() { log.ensureMap.push(ctx.restoreAt); const m = fakeMap(); ctx.map = m; ctx.restoreAt = null; return Promise.resolve(m); },
    ensurePlanet() { log.ensurePlanet++; const p = fakePlanet(); ctx.planet = p; return Promise.resolve(p); },
    updateMinZoom() {}, setData() { log.setData++; }, placeSelected() {}, updateList() { log.updateList++; }, worldState() {}, planetPad: () => ({}), render() { log.render = (log.render || 0) + 1; }
  }, over));
  ctx.__now = 1000000;
  const flush = async () => { while (timers.length) { timers.shift().fn(); await new Promise(r => setImmediate(r)); } await new Promise(r => setImmediate(r)); };
  return { ctx, timers, log, status, wrap, flush };
}
function fakePlanet() {
  return { destroyed: 0, active: null, released: null, jumped: null, lost: false, destroy() { this.destroyed++; }, view: () => ({ lat: 44.1, lon: -1.3, widthKm: 2600 }), jumpTo(v) { this.jumped = v; }, setPadding() {}, setSelected() {}, setActive(on, o) { this.active = on; this.released = !!o?.release; } };
}

test('carte perdue à l’écran : état « Reprise », puis nouvelle carte à la même caméra', async () => {
  const { ctx, log, status, wrap, flush } = setup();
  const old = fakeMap({ lng: -1.44, lat: 43.66, zoom: 9.3 });ctx.map = old;
  ctx.onMapLost(old);
  assert.equal(ctx.mapLost, true);
  assert.equal(status.hidden, false);
  assert.match(status.innerHTML, /Reprise de la carte/);
  assert.ok(wrap.classList.contains('is-recovering'), 'le cadre montre un état de reprise, pas un bleu uni');
  await flush();
  assert.equal(old.removed, 1, 'l’ancienne carte est libérée');
  assert.deepEqual(log.ensureMap[0], { center: [-1.44, 43.66], zoom: 9.3 });
  assert.notEqual(ctx.map, old);
  assert.equal(ctx.mapLost, false);
  assert.ok(log.setData >= 1, 'les spots sont remis');
  assert.equal(status.hidden, true);
  assert.ok(!wrap.classList.contains('is-recovering'));
});

test('carte perdue cachée sous le globe : libérée sans message, recréée à la prochaine plongée', async () => {
  const { ctx, log, status, flush } = setup({ mode: 'globe' });
  ctx.planet = fakePlanet();
  const old = fakeMap();ctx.map = old;
  ctx.onMapLost(old);
  await flush();
  assert.equal(old.removed, 1);
  assert.equal(ctx.map, null);
  assert.equal(ctx.restoreAt, null);
  assert.equal(log.ensureMap.length, 0);
  assert.equal(status.hidden, true);
});

test('pertes répétées : bouton « Recharger la carte » qui reconstruit sans recharger la page', async () => {
  const { ctx, log, status, flush } = setup();
  for (let i = 0; i < 3; i++) { const m = fakeMap();ctx.map = m;ctx.mapLosses = ctx.mapLosses;ctx.onMapLost(m);await flush();ctx.__now += 5000; }
  assert.equal(log.ensureMap.length, 3);
  const m = fakeMap();ctx.map = m;ctx.onMapLost(m);
  assert.match(status.innerHTML, /Recharger la carte/);
  assert.ok(status.classList.contains('is-error'));
  assert.equal(m.removed, 1);
  assert.ok(status.button && typeof status.button.onclick === 'function');
  status.button.onclick();
  await flush();
  assert.equal(log.ensureMap.length, 4);
  assert.equal(ctx.mapLosses.length, 0);
  assert.equal(status.hidden, true);
});

test('un événement d’une ancienne carte n’agit pas sur la carte courante', () => {
  const { ctx, status } = setup();
  const current = fakeMap();ctx.map = current;
  ctx.onMapLost(fakeMap());
  assert.equal(ctx.mapLost, false);
  assert.equal(current.removed, 0);
  assert.equal(status.hidden, true);
});

test('globe perdu : détruit, recréé à la même vue, actif seulement en mode globe', async () => {
  const { ctx, log, status, flush } = setup({ mode: 'globe' });
  const old = fakePlanet();ctx.planet = old;
  ctx.onPlanetLost();
  assert.match(status.innerHTML, /Reprise de la carte/);
  await flush();
  assert.equal(old.destroyed, 1);
  assert.equal(log.ensurePlanet, 1);
  assert.notEqual(ctx.planet, old);
  assert.deepEqual(ctx.planet.jumped, { lat: 44.1, lon: -1.3, widthKm: 2600 });
  assert.equal(ctx.planet.active, true);
  assert.equal(status.hidden, true);
  /* En mode carte, le globe recréé reste en pause, tampon de dessin rendu. */
  const s2 = setup({ mode: 'map' });
  s2.ctx.planet = fakePlanet();s2.ctx.onPlanetLost();
  assert.equal(s2.status.hidden, true, 'pas de message quand le globe est caché');
  await s2.flush();
  assert.equal(s2.ctx.planet.active, false);
  assert.equal(s2.ctx.planet.released, true);
  assert.ok(!s2.wrap.classList.contains('is-planet'), 'la carte détaillée reste visible');
});

test('globe impossible à recréer deux fois : repli sur la carte à plat', async () => {
  const { ctx, log, flush } = setup({ mode: 'globe', ensurePlanet() { ctx.planetFailed = true; return Promise.reject(Error('webgl')); } });
  ctx.planet = fakePlanet();ctx.onPlanetLost();
  await flush();
  assert.equal(ctx.mode, 'map');
  assert.equal(log.render, 1);
});

test('les accès au style passent par styled() (MapLibre détruit le style à la perte du contexte)', () => {
  const src = read('ocean-map.js');
  for (const name of ['hover', 'pick', 'onMapClick', 'updateMinZoom']) assert.match(fnSource(src, name), /styled\(\)/, name);
  assert.match(fnSource(src, 'setData'), /styled\(\)&&map\.getSource\('spots'\)/);
  assert.match(src, /const styled=\(\)=>!!map&&!mapLost&&!!map\.style;/);
});

test('pression mémoire : densité plafonnée, cache réduit, globe libéré sous la carte, relief seul animé', () => {
  const src = read('ocean-map.js'), globe = read('ocean-globe.js');
  assert.equal((src.match(/pixelRatio:DPR\(\)/g) || []).length, 3, 'carte, relief et petites cartes');
  assert.match(src, /maxTileCacheSize:M\.tileCache\(coarse\)/);
  assert.match(src, /planet\?\.setActive\(false,\{release:true\}\)/);
  assert.match(fnSource(src, 'startTerrain'), /planet\.setActive\(false\)/);
  assert.match(fnSource(src, 'startTerrain'), /webglcontextlost/);
  assert.match(globe, /dprFull=Math\.min\(devicePixelRatio\|\|1,mobile\?2:3\)/);
  /* La destruction volontaire (forceContextLoss) ne déclenche pas de reconstruction. */
  assert.match(globe, /if\(dead\|\|!handed\|\|lost\)return;/);
  assert.match(globe, /handed=true;\s*return api;/);
});
