/* Plongée du globe vers un spot : la chute ne se fige jamais d’un coup quand la carte détaillée se fait attendre,
   elle ne perd aucun temps quand la carte est prête, et le globe n’est pas dessiné deux fois par image. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../ocean-map-model.js');
const { read, fnSource, load } = require('./src-extract.cjs');

test('modèle : frein à l’approche du relais (pleine allure loin, planer au seuil)', () => {
  assert.equal(M.diveBrake(.1, .3), 1);
  assert.equal(M.diveBrake(.22, .3), 1, 'plus de 7 % du vol avant le relais : encore à pleine allure');
  assert.ok(Math.abs(M.diveBrake(.265, .3) - .5) < 1e-9);
  assert.equal(M.diveBrake(.3, .3), 0);
  assert.equal(M.diveBrake(.4, .3), 0, 'jamais négatif');
  let prev = 2;
  for (let t = 0; t <= .31; t += .005) { const b = M.diveBrake(t, .3); assert.ok(b <= prev, 'décroissant'); prev = b; }
});

/* Vol simulé image par image avec la vraie fonction flightStep de ocean-map.js. tilesAt : instant (ms) où la carte
   annonce ses tuiles chargées (Infinity : jamais). Renvoie la vitesse de descente (octaves par seconde) à chaque image. */
function fly({ tilesAt = 0, readyAt = 0, frame = 1000 / 60 } = {}) {
  const sd = 393, from = { lat: 30, lon: -8, kmPerPx: 31.46 }, to = { lat: 43.66, lon: -1.44, kmPerPx: M.kmPerPx(10.6, 43.66) };
  const plan = M.divePlan(from, to, { side: sd, handHi: 3200 / sd, handLo: 3200 / sd / 2.6, worldKpp: 12364 / sd });
  let clock = 0, ended = null, queued = null;
  const poses = [], host = { style: {} }, classes = new Set();
  const map = { jumps: 0, jumpTo() { this.jumps++; }, areTilesLoaded: () => clock >= tilesAt, getPitch: () => 0 };
  const f = { plan, dir: 1, spot: { id: 'x' }, padA: { top: 0, bottom: 0, left: 0, right: 0 }, padB: { top: 0, bottom: 0, left: 0, right: 0 },
    start: 0, t0: 0, last: 0, ready: false, failed: false, swapped: false, held: 0, stage: 0, pose: null, raf: 0, hand: 1, rate: 1, restAt: 0, tOk: 0 };
  f.handPose = plan.to;
  for (let i = 0; i <= 120; i++) { const q = M.diveAt(plan, M.diveProgress(i / 120, 1)); if (q.globe < 1) { f.hand = i / 120; f.handPose = q; break; } }
  const ctx = load('ocean-map.js', ['flightStep'], {
    M, Math, flight: f, map, planet: { lost: false, pose(p) { poses.push({ t: clock, k: Math.log2(p.kmPerPx), globe: p.globe }); } },
    styled: () => true, endFlight(interrupted) { ended = { interrupted, at: clock }; ctx.flight = null; }, toast() {},
    globeHost: () => host, wrap: { classList: { toggle(c, on) { on ? classes.add(c) : classes.delete(c); } } },
    clampLat: lat => Math.max(-70, Math.min(70, lat)),
    lerpPad: a => a, placeSelected() {}, setMode() {}, revealCard() {},
    requestAnimationFrame: fn => { queued = fn; return 1; }
  });
  const track = [];
  for (let i = 0; i < 2000 && !ended; i++) {
    clock += frame; if (clock >= readyAt) f.ready = true;
    ctx.flightStep(clock);
    if (f.pose) track.push({ t: clock, k: Math.log2(f.pose.kmPerPx), globe: f.pose.globe });
  }
  const speed = []; for (let i = 1; i < track.length; i++) speed.push((track[i - 1].k - track[i].k) / (track[i].t - track[i - 1].t) * 1000);
  let jump = 0; for (let i = 1; i < speed.length; i++) jump = Math.max(jump, Math.abs(speed[i] - speed[i - 1]));
  return { plan, f, ended, track, speed, jump, map };
}

test('carte prête : aucun ralentissement, le vol dure exactement ce que prévoit le plan', () => {
  const r = fly({ tilesAt: 0 });
  assert.equal(r.ended.interrupted, false);
  assert.ok(r.f.held < 1, 'temps perdu : ' + r.f.held);
  assert.ok(Math.abs(r.ended.at - r.plan.ms) <= 1000 / 60 + 1, `durée ${r.ended.at} pour ${r.plan.ms}`);
  assert.ok(r.jump < .6, 'vitesse continue (saut maximal entre deux images : ' + r.jump.toFixed(2) + ' octaves/s)');
});

test('carte en retard : la chute ralentit puis repart en douceur, sans arrêt net ni saut de vitesse', () => {
  for (const tilesAt of [700, 800, 1100, 1500, Infinity]) {
    const r = fly({ tilesAt });
    assert.equal(r.ended.interrupted, false, 'le vol arrive au bout');
    /* Avant : arrêt instantané depuis ~7 octaves/s, puis redémarrage à pleine vitesse (saut ≈ 7). */
    assert.ok(r.jump < 1.2, `tuiles à ${tilesAt} ms : saut de vitesse ${r.jump.toFixed(2)} octaves/s`);
    assert.ok(r.speed.every(v => v > -1e-6), 'la caméra ne remonte jamais');
    /* Le globe ne s’efface jamais sur une carte pas prête, sauf après l’attente maximale. */
    const firstFade = r.track.find(p => p.globe < 1);
    if (tilesAt <= 800) assert.ok(firstFade.t >= tilesAt, `relais (${Math.round(firstFade.t)} ms) après l’arrivée des tuiles (${tilesAt} ms)`);
    assert.ok(r.f.held <= 700, 'attente bornée : ' + Math.round(r.f.held) + ' ms');
  }
});

test('carte jamais créée : le vol plane au-dessus du relais puis est abandonné (retour au globe), sans boucle infinie', () => {
  const r = fly({ readyAt: Infinity, tilesAt: Infinity });
  assert.equal(r.ended.interrupted, true);
  assert.ok(r.f.held > 5000 && r.ended.at < 9000);
  assert.ok(r.track.every(p => p.globe >= 1), 'le globe reste entier');
  assert.ok(r.jump < 1.2);
});

test('globe : pendant un vol piloté, la boucle du globe ne redessine pas l’image que pose() vient de dessiner', () => {
  const globe = read('ocean-globe.js');
  assert.match(fnSource(globe, 'frame'), /raf=0;if\(!active\)return;\s*\/\*[\s\S]*?\*\/\s*if\(flying\)\{prevAgain=false;return;\}/);
  /* pose() mesure la cadence (définition adaptative) et dessine dans la même tâche. */
  assert.match(globe, /pace\(now,now-lastFrame<100\);/);
});

test('mouvement réduit : pas de vol, fondus simples à l’aller, au retour et pour l’aperçu', () => {
  const src = read('ocean-map.js'), css = read('ocean-map.css');
  assert.match(fnSource(src, 'plunge'), /if\(calm\(\)\)\{jumpToSpot\(s,c\);return true;\}/);
  assert.match(fnSource(src, 'ascend'), /if\(calm\(\)\)\{[^}]*rise\(\);[\s\S]*?classList\.add\('is-jump'\)/);
  assert.match(fnSource(src, 'flyToPose'), /calm\(\)\)return false;/);
  assert.match(css, /\.omap\.is-jump #spotMap,\.omap\.is-jump\.is-planet \.omap-globe\{animation:omap-fade \.34s ease-out!important\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.omap \.omap-card\.is-landing\{animation:omap-fade/);
  /* Le fondu ne déplace rien. */
  assert.match(css, /@keyframes omap-fade\{from\{opacity:0\}to\{opacity:1\}\}/);
});
