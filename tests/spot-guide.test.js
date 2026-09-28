const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const M=require('../spot-guide-model.js');
test('country baseline, local factor and high season give coherent ranges', () => {
  const base=M.estimate({country:'Portugal',loc:'Peniche, Portugal',world:'eu'});
  assert.equal(base.type,'camping');assert.equal(base.basis,'country');
  assert.ok(base.lo<=base.hi&&base.peakLo>=base.lo&&base.peakHi>=base.hi);
  assert.equal(base.alt.type,'hostel');
  const spot=M.estimate({country:'Portugal',loc:'Peniche, Portugal',world:'eu'},{k:'surfcamp',f:1.2,p:[8]});
  assert.equal(spot.type,'surfcamp');assert.equal(spot.basis,'spot');
  assert.ok(spot.lo>=base.lo);assert.deepEqual(spot.peak,[8]);
  assert.deepEqual(M.nightly(spot,8),{lo:spot.peakLo,hi:spot.peakHi,peak:true});
  assert.deepEqual(M.nightly(spot,10),{lo:spot.lo,hi:spot.hi,peak:false});
});
test('expensive regions override their country and unknown countries fall back to the continent', () => {
  const us=M.estimate({country:'États-Unis',loc:'Floride, États-Unis',world:'na'});
  const hawaii=M.estimate({country:'États-Unis',loc:'Oahu, Hawaï',world:'na'});
  assert.equal(hawaii.basis,'region');assert.equal(hawaii.area,'Hawaï');assert.ok(hawaii.hi>us.hi);
  const bora=M.estimate({country:'Polynésie française',loc:'Bora Bora, Polynésie française',world:'oc'});
  const tahiti=M.estimate({country:'Polynésie française',loc:'Tahiti, Polynésie française',world:'oc'});
  assert.ok(bora.lo>tahiti.lo);
  const future=M.estimate({country:'Pays imaginaire',loc:'Quelque part',world:'af'});
  assert.equal(future.basis,'world');assert.ok(future.lo>0);
  assert.equal(M.estimate({country:'États-Unis',loc:'Basse-Californie, Mexique',world:'na'}).basis,'country');
  const nothing=M.estimate({});assert.ok(nothing.lo>0&&nothing.label);
  const maldives=M.estimate({country:'Maldives',loc:'Atoll de Malé, Maldives',world:'as'});
  assert.equal(maldives.type,'guest');assert.equal(maldives.alt,null);
});
test('unavailable or malformed per-spot hints never produce broken prices', () => {
  const e=M.estimate({country:'Maldives',world:'as'},{k:'camping',f:99,p:[13,'x']});
  assert.equal(e.type,'guest');assert.equal(e.factor,1);assert.deepEqual(e.peak,[12,1,2,3,4]);
});
test('every country table is complete and ordered', () => {
  for(const [name,t] of Object.entries(M.COUNTRIES)){
    assert.ok(M.TYPES.includes(t.d),name);
    for(const k of ['c','h','s','g','t'])if(t[k])assert.ok(t[k][0]>0&&t[k][0]<=t[k][1],name+' '+k);
    assert.ok(Array.isArray(t.p)&&t.p.length,name);
    assert.ok(M.estimate({country:name}).lo>0,name);
  }
});
test('month labels, comparison ranks and search links', () => {
  assert.equal(M.monthsLabel([7,8]),'juillet et août');
  assert.equal(M.monthsLabel([12,1,2,3]),'de décembre à mars');
  assert.equal(M.monthsLabel([12,4,8]),'avril, août et décembre');
  assert.equal(M.cheaperThan(10,[5,10,20,30]),50);
  const l=M.searchLinks('Peniche, Portugal',{checkin:'2026-10-10',checkout:'2026-10-12',coords:{lat:39.36,lon:-9.38}});
  assert.match(l.booking,/ss=Peniche%2C%20Portugal.*checkin=2026-10-10&checkout=2026-10-12/);
  assert.match(l.airbnb,/\/s\/Peniche--Portugal\/homes\?adults=1&checkin=2026-10-10/);
  assert.match(l.camping,/@39\.3600,-9\.3800,12z/);
  assert.doesNotMatch(M.searchLinks('X',{checkin:'2026-10-12',checkout:'2026-10-10'}).booking,/checkin/);
  for(const url of Object.values(l))assert.match(url,/^https:\/\//);
});
test('every catalogue country has a lodging baseline and the guide data stays coherent', () => {
  const root=path.join(__dirname,'..');
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
  for(const s of catalog){assert.ok(M.estimate(s).lo>0,s.id);assert.notEqual(M.estimate(s).basis,'world','pays sans barème : '+s.country);}
  const file=path.join(root,'data/spot-guides.json');
  if(!fs.existsSync(file))return;
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const ids=new Set(catalog.map(s=>s.id));
  for(const [id,g] of Object.entries(data.spots)){
    assert.ok(ids.has(id),'spot inconnu '+id);
    if(g.sleep?.k)assert.ok(M.TYPES.includes(g.sleep.k),id);
    for(const p of g.around||[]){
      assert.ok(p.n&&p.d&&Number.isFinite(p.lat)&&Number.isFinite(p.lon),id+' '+p.n);
      assert.ok(p.km<=35,id+' '+p.n+' trop loin');
    }
  }
});
