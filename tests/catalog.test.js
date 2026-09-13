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
test('280 distinct spots, including 112 sourced additions across all seven regions',()=>{
 assert.equal(base.length,168);assert.equal(extra.length,112);assert.equal(all.length,280);
 assert.equal(new Set(all.map(s=>s.id)).size,all.length);
 assert.deepEqual([...new Set(extra.map(s=>s.world))].sort(),['af','as','eu','fr','na','oc','sa']);
 for(const s of extra){
  assert.ok(s.name&&s.loc&&s.desc,s.id);assert.ok(s.sports.length,s.id);
  assert.ok(s.sports.every(x=>sports.has(x)),s.id);
  assert.ok(Number.isFinite(s.coords.lat)&&Math.abs(s.coords.lat)<=90,s.id);
  assert.ok(Number.isFinite(s.coords.lon)&&Math.abs(s.coords.lon)<=180,s.id);
  assert.ok(['coastal-sector','lake-sector'].includes(s.coordinatePrecision),s.id);
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
 const ctx={isInland:()=>false,SPOTS:[{id:'baleal'}],COORDS:{baleal:{lat:39,lon:-9}},dayLabel:()=> 'Auj',fetch:async()=>({json:async()=>({daily})})};
 vm.runInNewContext(functionSource('async function fetchWaves','function showForecastSkeleton')+';this.waves=fetchWaves;',ctx);
 assert.equal((await ctx.waves('baleal',1)).vals[0],0);
 daily.wave_height_max=[null];await assert.rejects(()=>ctx.waves('baleal',1));
 daily.wave_height_max=[];await assert.rejects(()=>ctx.waves('baleal',1));
});
test('freshwater destinations never request marine forecasts',async()=>{
 let calls=0;
 const ctx={SPOTS:[{id:'bourget',waterType:'lake'}],COORDS:{bourget:{lat:45.7,lon:5.9}},fetch:async()=>{calls++;}};
 vm.runInNewContext(functionSource('function isInland','function renderConditions')+functionSource('async function fetchWaves','function showForecastSkeleton')+';this.waves=fetchWaves;',ctx);
 await assert.rejects(()=>ctx.waves('bourget',7));assert.equal(calls,0);
});
test('batch weather keeps marine values aligned when lakes appear between coasts',async()=>{
 const urls=[],spots=[{id:'sea1'},{id:'lake',waterType:'lake'},{id:'sea2'}];
 const ctx={SPOTS:spots,COORDS:{sea1:{lat:1,lon:11},lake:{lat:2,lon:12},sea2:{lat:3,lon:13}},LIVE:{},currentFilter:'all',window:{},renderSpots(){},renderLiveTop(){},renderToday(){},cardinal:()=> 'N',fetch:async url=>{urls.push(new URL(url));return {json:async()=>url.includes('marine-api')?[{current:{wave_height:0}},{current:{wave_height:2}}]:[1,2,3].map(x=>({current:{wind_speed_10m:x}}))};}};
 vm.runInNewContext(functionSource('function isInland','function renderConditions')+functionSource('async function fetchAllConditions','function renderLiveTop')+';this.run=fetchAllConditions;',ctx);
 await ctx.run();assert.equal(urls.find(u=>u.hostname==='marine-api.open-meteo.com').searchParams.get('latitude'),'1,3');assert.equal(ctx.LIVE.sea1.swell,'0.0 m');assert.equal(ctx.LIVE.sea2.swell,'2.0 m');assert.equal(ctx.LIVE.lake.swell,undefined);assert.equal(ctx.LIVE.lake.wind,'2 km/h N');
});
test('gallery images are local, credited and attached to existing destinations',()=>{
 const galleries=JSON.parse(fs.readFileSync(path.join(root,'assets/spots/gallery-sources.json'),'utf8'));
 assert.equal(Object.values(galleries).flat().length,12);assert.equal(extra.filter(s=>s.catalogNew).length,40);
 for(const [id,rows] of Object.entries(galleries)){assert.ok(all.some(s=>s.id===id),id);for(const p of rows){assert.ok(fs.statSync(path.join(root,p.src)).size>1000);assert.ok(p.author&&p.license);assert.equal(new URL(p.source).protocol,'https:');}}
});
test('an unrecognised country does not invent an emergency phone number',()=>{
 const ctx={};vm.runInNewContext(functionSource('function countryEmergency','var SPORT_VERB')+';this.emergency=countryEmergency;',ctx);
 assert.equal(ctx.emergency('Lieu non identifié').call,null);assert.equal(ctx.emergency('Savoie, France').call,'112');
});
