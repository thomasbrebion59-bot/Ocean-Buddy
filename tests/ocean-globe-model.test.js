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
