const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/catalog-expansion.json'),'utf8'));
const base=vm.runInNewContext(app.slice(app.indexOf('const SPOTS='),app.indexOf('const SCORES='))+';SPOTS');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'catalog-expansion.js'),'utf8'),sandbox);
const extra=sandbox.window.OCEAN_SPOT_EXPANSION;
const all=[...base,...extra];
const photos=JSON.parse(fs.readFileSync(path.join(root,'assets/spots/sources.json'),'utf8'));
const sports=new Set(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf']);
test('240 distinct spots, including 72 new sourced destinations across all seven regions',()=>{
 assert.equal(base.length,168);assert.equal(extra.length,72);assert.equal(all.length,240);
 assert.equal(new Set(all.map(s=>s.id)).size,all.length);
 assert.deepEqual([...new Set(extra.map(s=>s.world))].sort(),['af','as','eu','fr','na','oc','sa']);
 for(const s of extra){
  assert.ok(s.name&&s.loc&&s.desc,s.id);assert.ok(s.sports.length,s.id);
  assert.ok(s.sports.every(x=>sports.has(x)),s.id);
  assert.ok(Number.isFinite(s.coords.lat)&&Math.abs(s.coords.lat)<=90,s.id);
  assert.ok(Number.isFinite(s.coords.lon)&&Math.abs(s.coords.lon)<=180,s.id);
  assert.equal(s.coordinatePrecision,'coastal-sector',s.id);
  assert.equal(new URL(s.source.url).protocol,'https:',s.id);assert.ok(s.source.label,s.id);
  assert.equal(s.reviewed,data.reviewed,s.id);
 }
});
test('published catalogue stays in sync with the reviewed editable data',()=>{
 for(const row of data.spots){const s=extra.find(x=>x.id===row.id);assert.ok(s,row.id);
  for(const [k,v] of Object.entries(row)){if(k==='photoQuery'||k==='sourceKey')continue;assert.equal(JSON.stringify(s[k]),JSON.stringify(v),row.id+':'+k);}
  assert.equal(JSON.stringify(s.source),JSON.stringify(data.sources[row.sourceKey]));
 }
});
test('every destination has a local photograph and usable attribution',()=>{
 for(const s of all){const p=photos[s.id];assert.ok(p,s.id);assert.ok(fs.statSync(path.join(root,p.src)).size>1000,s.id);assert.ok(p.author&&p.license&&p.source,s.id);assert.equal(new URL(p.source).protocol,'https:',s.id);}
 for(const s of extra){assert.match(photos[s.id].license,/CC BY|CC0|Public domain/,s.id);assert.ok(photos[s.id].width>=600,s.id);}
});
test('new places never fabricate weather, reviews or hazard detail',()=>{
 for(const s of extra){for(const k of ['wind','swell','temp','tide'])assert.equal(s[k],'—',s.id+':'+k);assert.equal(s.dangers.length,0,s.id);assert.equal(s.rating,undefined);assert.equal(s.score,undefined);}
});
function functionSource(start,end){return app.slice(app.indexOf(start),app.indexOf(end,app.indexOf(start)));}
test('search matches accents consistently',()=>{
 const ctx={};vm.runInNewContext(functionSource('function searchable','function searchSpots')+';this.normalize=searchable;',ctx);
 assert.equal(ctx.normalize(' Reñaca '),'renaca');assert.equal(ctx.normalize('São Torpes'),'sao torpes');
});
test('marine forecasts preserve zero values and reject missing values',async()=>{
 let daily={time:['2026-09-13'],wave_height_max:[0]};
 const ctx={COORDS:{baleal:{lat:39,lon:-9}},dayLabel:()=> 'Auj',fetch:async()=>({json:async()=>({daily})})};
 vm.runInNewContext(functionSource('async function fetchWaves','function showForecastSkeleton')+';this.waves=fetchWaves;',ctx);
 assert.equal((await ctx.waves('baleal',1)).vals[0],0);
 daily.wave_height_max=[null];await assert.rejects(()=>ctx.waves('baleal',1));
 daily.wave_height_max=[];await assert.rejects(()=>ctx.waves('baleal',1));
});
