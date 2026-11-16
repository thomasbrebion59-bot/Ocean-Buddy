const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../ocean-map-model.js');

const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} ≉ ${b}`);

test('vec and latLon are inverse, longitude 0 faces +z and north is +y',()=>{
  assert.deepEqual(M.vec(0,0).map(x=>Math.round(x*1e9)/1e9),[0,0,1]);
  close(M.vec(90,0)[1],1);
  close(M.vec(0,90)[0],1);
  for(const [lat,lon] of [[43.66,-1.44],[-33.9,151.2],[64.1,-21.9],[-54.8,-68.3],[21.3,-157.8]]){
    const p=M.latLon(M.vec(lat,lon));close(p.lat,lat,1e-9);close(p.lon,lon,1e-9);
  }
});

test('arc measures the central angle, across the date line too',()=>{
  close(M.arc({lat:0,lon:0},{lat:0,lon:90}),Math.PI/2);
  close(M.arc({lat:0,lon:179},{lat:0,lon:-179})*180/Math.PI,2,1e-9);
  close(M.wrapLon(190),-170);close(M.wrapLon(-190),170);close(M.wrapLon(180),-180);
});

test('MapLibre zoom and km per pixel round-trip at any latitude',()=>{
  for(const lat of [0,43.6,-33.9,64]){
    for(const z of [3,5.5,9.25,14]){close(M.mapZoom(M.kmPerPx(z,lat),lat),z,1e-9);}
  }
  /* Zoom 0 : le monde (40 075 km à l’équateur) tient dans 512 px. */
  close(M.kmPerPx(0,0),40075.016686/512,1e-9);
});

test('clusters are nested from fine to coarse and never lose or duplicate a spot',()=>{
  const pts=[];let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<300;i++)pts.push({id:'s'+i,lat:30+rnd()*25,lon:-12+rnd()*30});
  for(let i=0;i<40;i++)pts.push({id:'p'+i,lat:-20+rnd()*10,lon:170+rnd()*20-10});
  const levels=M.clusterLevels(pts);
  assert.equal(levels.length,M.LEVELS.length);
  let prev=null;
  for(const groups of levels){
    const ids=groups.flatMap(g=>g.ids);
    assert.equal(ids.length,pts.length);assert.equal(new Set(ids).size,pts.length);
    for(const g of groups)assert.equal(g.n,g.ids.length);
    /* Chaque groupe d’une échelle fine tient entièrement dans un groupe de l’échelle suivante. */
    if(prev){const owner=new Map();groups.forEach((g,i)=>g.ids.forEach(id=>owner.set(id,i)));for(const g of prev)assert.equal(new Set(g.ids.map(id=>owner.get(id))).size,1);}
    assert.ok(!prev||groups.length<=prev.length);
    prev=groups;
  }
  /* Tout à l’échelle la plus large : les deux régions éloignées restent séparées. */
  const coarse=levels[levels.length-1];
  assert.ok(coarse.length>=2);
  assert.ok(!coarse.some(g=>g.ids.some(id=>id[0]==='s')&&g.ids.some(id=>id[0]==='p')));
});

test('cluster centroids of spots straddling the date line stay near the date line',()=>{
  const pts=[{id:'a',lat:-17,lon:179.5},{id:'b',lat:-17.2,lon:-179.6},{id:'c',lat:-16.9,lon:179.9}];
  const top=M.clusterLevels(pts).at(-1);
  assert.equal(top.length,1);
  assert.ok(Math.abs(Math.abs(top[0].lon)-180)<1,`centroid lon ${top[0].lon}`);
  const c=M.cap(pts);assert.ok(Math.abs(Math.abs(c.lon)-180)<1);assert.ok(c.radius<0.03);
});

test('levelFor picks the nearest scale geometrically',()=>{
  assert.equal(M.levelFor(M.LEVELS[0]),0);
  assert.equal(M.levelFor(M.LEVELS[7]*1.05),7);
  assert.equal(M.levelFor(1e6),M.LEVELS.length-1);
  assert.equal(M.levelFor(1e-6),0);
});

/* ---------- Plongée cinématique : plan de vol (ocean-map-model.js) ---------- */
const WORLD = { lat: 30, lon: -5, kmPerPx: 28.7 };
const OPTS = { side: 430, handHi: 7.44, handLo: 2.86, worldKpp: 28.7 };
const spotPose = (lat, lon) => ({ lat, lon, kmPerPx: M.kmPerPx(10.6, lat) });
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} ≠ ${b}`);

test('slerp : extrémités exactes et plus court chemin à travers la ligne de date', () => {
  const a = { lat: -17.5, lon: -149.8 }, b = { lat: -33.9, lon: 151.3 };
  const s0 = M.slerp(a, b, 0), s1 = M.slerp(a, b, 1), mid = M.slerp(a, b, .5);
  near(s0.lat, a.lat, 1e-6); near(s0.lon, a.lon, 1e-6); near(s1.lat, b.lat, 1e-6); near(s1.lon, b.lon, 1e-6);
  /* Tahiti → Sydney : on passe par le Pacifique (longitude proche de ±180), jamais par l’Afrique. */
  assert.ok(Math.abs(mid.lon) > 150, 'milieu du trajet côté Pacifique : ' + mid.lon);
  /* Le milieu est à égale distance des deux bouts, et le trajet ne s’allonge pas. */
  near(M.arc(a, mid), M.arc(mid, b), 1e-9); near(M.arc(a, mid) + M.arc(mid, b), M.arc(a, b), 1e-9);
});

test('slerp : points confondus ou opposés sans valeur invalide', () => {
  const p = M.slerp({ lat: 10, lon: 20 }, { lat: 10, lon: 20 }, .3);
  near(p.lat, 10, 1e-9); near(p.lon, 20, 1e-9);
  const q = M.slerp({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }, .5);
  assert.ok(Number.isFinite(q.lat) && Number.isFinite(q.lon));
});

test('plan de vol : durée entre 1,6 et 2,4 s, plus longue pour un trajet lointain', () => {
  const far = M.divePlan(WORLD, spotPose(-8.8, 115.1), OPTS), close = M.divePlan({ lat: 43.6, lon: -1.4, kmPerPx: 8 }, spotPose(43.66, -1.44), OPTS);
  for (const p of [far, close]) assert.ok(p.ms >= 1600 && p.ms <= 2400, 'durée ' + p.ms);
  assert.ok(far.ms > close.ms);
});

test('trajectoire : part de la vue du globe, arrive exactement sur le spot', () => {
  const to = spotPose(-8.8, 115.1), plan = M.divePlan(WORLD, to, OPTS);
  const a = M.diveAt(plan, 0), b = M.diveAt(plan, 1);
  near(a.lat, WORLD.lat, 1e-6); near(a.lon, WORLD.lon, 1e-6); near(a.kmPerPx, WORLD.kmPerPx, 1e-9);
  near(b.lat, to.lat, 1e-6); near(b.lon, to.lon, 1e-6); near(b.kmPerPx, to.kmPerPx, 1e-12);
  assert.equal(a.globe, 1); assert.equal(b.globe, 0); near(a.pitch, 0, 1e-9); near(b.pitch, 0, 1e-9);
});

test('trajectoire : descente continue, sans à-coup, la planète tourne par le plus court chemin', () => {
  const to = spotPose(-8.8, 115.1), plan = M.divePlan(WORLD, to, OPTS), N = 400;
  let prev = M.diveAt(plan, 0), travelled = 0, maxStep = 0, maxZoomStep = 0;
  for (let i = 1; i <= N; i++) {
    const p = M.diveAt(plan, i / N);
    assert.ok(p.kmPerPx <= prev.kmPerPx + 1e-9, 'la caméra ne remonte jamais (vue de départ déjà large)');
    assert.ok(p.globe <= prev.globe + 1e-9, 'le fondu ne revient pas en arrière');
    assert.ok(M.arc(p, to) <= M.arc(prev, to) + 1e-9, 'on se rapproche toujours du spot');
    assert.ok(p.pitch >= 0 && p.pitch <= plan.pitch + 1e-9);
    const step = M.arc(prev, p); travelled += step; maxStep = Math.max(maxStep, step);
    maxZoomStep = Math.max(maxZoomStep, Math.abs(Math.log2(prev.kmPerPx / p.kmPerPx)));
    prev = p;
  }
  near(travelled, plan.angle, 1e-6, 'longueur parcourue = grand cercle');
  /* À 60 images par seconde (un pas sur 144 pour 2,4 s), moins de 3° de rotation et 0,2 niveau de zoom par image. */
  assert.ok(maxStep * 400 / 144 < 3 * Math.PI / 180, 'rotation par image ' + maxStep);
  assert.ok(maxZoomStep * 400 / 144 < .2, 'zoom par image ' + maxZoomStep);
});

test('trajectoire : la rotation est presque finie quand le globe laisse la place à la carte', () => {
  const to = spotPose(-8.8, 115.1), plan = M.divePlan(WORLD, to, OPTS);
  let hand = null;
  for (let i = 0; i <= 400 && !hand; i++) { const p = M.diveAt(plan, i / 400); if (p.globe < 1) hand = p; }
  assert.ok(hand, 'relais introuvable');
  assert.ok(M.arc(hand, to) < plan.angle * .12, 'reste à tourner au relais : ' + M.arc(hand, to) / plan.angle);
  /* Inclinaison seulement une fois sur la carte. */
  for (let i = 0; i <= 100; i++) { const p = M.diveAt(plan, i / 100); if (p.globe > 0) near(p.pitch, 0, 1e-9, 'pas d’inclinaison tant que le globe est visible'); }
});

test('trajet long vu de près : la caméra prend de la hauteur puis redescend', () => {
  const from = { lat: 44, lon: -3, kmPerPx: 8.2 }, plan = M.divePlan(from, spotPose(-8.8, 115.1), OPTS);
  assert.ok(plan.lift > 0);
  let top = 0; for (let i = 0; i <= 100; i++) top = Math.max(top, M.diveAt(plan, i / 100).kmPerPx);
  assert.ok(top > from.kmPerPx * 1.5 && top <= OPTS.worldKpp * 1.01, 'altitude maximale ' + top);
  /* Spot voisin : aucune prise de hauteur. */
  assert.equal(M.divePlan(from, spotPose(43.66, -1.44), OPTS).lift, 0);
});

test('avancement : la descente va de 0 à 1, la remontée relit le même trajet à l’envers', () => {
  assert.equal(M.diveProgress(0, 1), 0); assert.equal(M.diveProgress(1, 1), 1);
  assert.equal(M.diveProgress(0, -1), 1); assert.equal(M.diveProgress(1, -1), 0);
  let d = 0, r = 1;
  for (let i = 1; i <= 50; i++) { const a = M.diveProgress(i / 50, 1), b = M.diveProgress(i / 50, -1); assert.ok(a > d && b < r); d = a; r = b; }
  /* Hors bornes : valeurs bloquées. */
  assert.equal(M.diveProgress(-1, 1), 0); assert.equal(M.diveProgress(3, 1), 1);
  const plan = M.divePlan(WORLD, spotPose(43.66, -1.44), OPTS);
  const up0 = M.diveAt(plan, M.diveProgress(0, -1)), up1 = M.diveAt(plan, M.diveProgress(1, -1));
  near(up0.kmPerPx, plan.to.kmPerPx, 1e-12); near(up1.kmPerPx, plan.from.kmPerPx, 1e-9); assert.equal(up1.globe, 1);
});
