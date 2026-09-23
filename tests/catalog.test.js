const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const all=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const base=all.filter(s=>s.editorialStatus==='unverified');
const extra=all.filter(s=>s.editorialStatus==='reviewed');
const photos=JSON.parse(fs.readFileSync(path.join(root,'assets/spots/sources.json'),'utf8'));
const legacy=require('../legacy-spots.js');
const sports=new Set(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf']);
test('280 distinct spots, including 112 sourced additions across all seven regions',()=>{
 assert.equal(base.length,168);assert.equal(extra.length,112);assert.equal(all.length,280);
 assert.equal(new Set(all.map(s=>s.id)).size,all.length);
 for(const s of all){assert.ok(s.sports.length,s.id);assert.ok(s.sports.every(x=>sports.has(x)),s.id);}
 assert.deepEqual([...base.find(s=>s.id==='uluwatu').sports],['surf']);
 assert.deepEqual([...base.find(s=>s.id==='padang').sports],['surf']);
 assert.equal(base.find(s=>s.id==='uluwatu').source.status,'unverified');
 assert.deepEqual([...new Set(extra.map(s=>s.world))].sort(),['af','as','eu','fr','na','oc','sa']);
 for(const s of extra){
  assert.ok(s.name&&s.loc&&s.desc,s.id);assert.ok(s.sports.length,s.id);
  assert.ok(s.sports.every(x=>sports.has(x)),s.id);
  assert.ok(Number.isFinite(s.coords.lat)&&Math.abs(s.coords.lat)<=90,s.id);
  assert.ok(Number.isFinite(s.coords.lon)&&Math.abs(s.coords.lon)<=180,s.id);
  assert.ok(['coastal-sector','lake-sector'].includes(s.coordinatePrecision),s.id);
  assert.equal(new URL(s.source.url).protocol,'https:',s.id);assert.ok(s.source.label,s.id);
  assert.match(s.reviewed,/^\d{4}-\d{2}-\d{2}$/,s.id);
 }
});
test('browser, media and server views match the canonical catalogue exactly',()=>{
 const runtime={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'catalog-runtime.js'),'utf8'),runtime);
 const server=JSON.parse(fs.readFileSync(path.join(root,'netlify/functions/lib/catalog.json'),'utf8'));
 assert.equal(JSON.stringify(runtime.window.OCEAN_CATALOG),JSON.stringify(all));
 assert.equal(server.length,280);
 assert.equal(JSON.stringify(photos),JSON.stringify(Object.fromEntries(all.map(s=>[s.id,s.photo]))));
 for(const s of all){
  const row=server.find(x=>x.id===s.id);assert.ok(row,s.id);
  assert.equal(JSON.stringify(row.activities),JSON.stringify(s.sports),s.id);
  assert.equal(row.location,s.loc,s.id);
  assert.equal(row.description,s.desc,s.id);
  assert.equal(JSON.stringify(row.coords),JSON.stringify(s.coords),s.id);
  assert.equal(row.world,s.world,s.id);
  assert.equal(row.source,s.source?.url||null,s.id);
  assert.equal(row.photo.src,photos[s.id].src,s.id);
  assert.equal(row.photo.thumb,photos[s.id].thumb,s.id);
  assert.equal(row.editorialStatus,s.editorialStatus,s.id);
  assert.equal(JSON.stringify(row.visit),JSON.stringify(s.visit||null),s.id);
 }
});
test('every spot shows access, best period and local rules without inventing missing facts',()=>{
 const guide=fs.readFileSync(path.join(root,'field-guide.js'),'utf8');
 const start=guide.indexOf('  function visitRows('),end=guide.indexOf('  function mapURL(',start);
 assert.ok(start>0&&end>start);
 assert.match(guide,/<section id="fieldVisit"/);
 assert.match(guide,/\$\('#fieldVisit'\)\.innerHTML=visitGuide\(s\)/);
 const ctx={window:{},external:'↗',esc:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.runInNewContext(guide.slice(start,end)+';this.visitRows=visitRows;this.visitGuide=visitGuide;',ctx);
 for(const s of all){
  const rows=ctx.visitRows(s);
  assert.deepEqual([...rows.map(row=>row.label)],['Accès','Meilleure période','Règles locales'],s.id);
  for(const row of rows)assert.equal(row.verified?row.value!=='À vérifier localement':row.value==='À vérifier localement',true,s.id+': '+row.label);
 }
 assert.equal(all.filter(s=>s.visit).length,7);
 const sourced=all.find(s=>s.id==='cathedralcove');
 assert.ok(ctx.visitRows(sourced).every(row=>row.verified));
 assert.match(ctx.visitGuide(sourced),/consultée le 23\/09\/2026/);
 assert.match(ctx.visitGuide(sourced),/doc\.govt\.nz\/cathedral-cove-walk/);
 const historical=all.find(s=>s.id==='hossegor');
 assert.equal(ctx.visitRows({...historical,visit:{reviewed:'2026-09-23',access:'Text not sourced'}}).filter(row=>row.verified).length,0);
 assert.equal((ctx.visitGuide(historical).match(/À vérifier localement/g)||[]).length,3);
});
test('every destination has a local photograph and usable attribution',()=>{
 for(const s of all){const p=photos[s.id];assert.ok(p,s.id);assert.ok(fs.statSync(path.join(root,p.src)).size>1000,s.id);assert.ok(fs.statSync(path.join(root,p.thumb)).size>1000,s.id+' thumbnail');assert.ok(p.author&&p.license&&p.source,s.id);assert.equal(new URL(p.source).protocol,'https:',s.id);}
 for(const s of extra){assert.match(photos[s.id].license,/CC BY|CC0|Public domain/,s.id);assert.ok(photos[s.id].width>=600,s.id);}
 assert.match(photos.bluehole_belize.source,/Belize_Blue_Hole\.jpg/);
 assert.match(photos.labaule.source,/La_Baule/);
});
test('removed bonus entries remain available only as private migration records',()=>{
 assert.equal(legacy.ids.length,44);
 assert.equal(legacy.canonicalId('bonus-0'),'baleal');
 assert.equal(legacy.archive('bonus-1').name,'Praia do Guincho');
 assert.doesNotMatch(fs.readFileSync(path.join(root,'index.html'),'utf8'),/src="catalog-bonus\.js/);
});
test('saved bonus favourites keep 33 archived labels and move 11 exact matches to canonical spots',()=>{
 const favourites=new Set();
 const ctx={STORE_KEY:'oceanbuddy_v1',localStorage:{getItem:()=>JSON.stringify({favs:legacy.ids})},window:{OceanLegacySpots:legacy},favs:favourites,sessions:[],ecoLog:[],xp:0,chosenLevel:null,chosenSport:null,activeSport:null,userName:'Explorateur'};
 vm.runInNewContext(functionSource('function loadState','const ECO=')+';this.load=loadState;',ctx);
 assert.equal(ctx.load(),true);
 assert.equal([...favourites].filter(id=>id.startsWith('bonus-')).length,33);
 assert.equal([...favourites].filter(id=>all.some(s=>s.id===id)).length,11);
 assert.ok(favourites.has('baleal'));
 assert.ok(favourites.has('bonus-1'));
});
test('new places never fabricate weather, reviews or hazard detail',()=>{
 for(const s of extra){for(const k of ['wind','swell','temp','tide'])assert.equal(s[k],'—',s.id+':'+k);assert.equal(s.dangers.length,0,s.id);assert.equal(s.rating,undefined);assert.equal(s.score,undefined);}
});
function functionSource(start,end){return app.slice(app.indexOf(start),app.indexOf(end,app.indexOf(start)));}
test('forecast bar heights preserve ratios and zero, with the calmest day highlighted',()=>{
 const elements={bars:{},best:{}};
 const ctx={document:{getElementById:id=>elements[id]}};
 vm.runInNewContext(functionSource('function renderForecastBars','function renderMiniForecast')+';this.render=renderForecastBars;',ctx);
 ctx.render('bars','best',['Auj','Lun','Mar'],[0,7,14],{unit:'km/h',best:'min',bestLabel:'Vent le plus faible'});
 assert.deepEqual([...elements.bars.innerHTML.matchAll(/height:(\d+)%/g)].map(m=>Number(m[1])),[0,50,100]);
 assert.match(elements.bars.innerHTML,/^<div class="fc-col best">/);
 assert.match(elements.best.innerHTML,/Vent le plus faible : <b>Auj<\/b> · 0 km\/h/);
});
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
test('visible weather keeps marine values aligned when lakes appear between coasts',async()=>{
 const urls=[],spots=[{id:'sea1'},{id:'lake',waterType:'lake'},{id:'sea2'}];
 const ctx={SPOTS:spots,COORDS:{sea1:{lat:1,lon:11},lake:{lat:2,lon:12},sea2:{lat:3,lon:13}},LIVE:{},window:{},document:{querySelectorAll:()=>[]},spotCardMeta(){},renderLiveTop(){},renderToday(){},cardinal:()=> 'N',fetch:async url=>{urls.push(new URL(url));return {ok:true,json:async()=>url.includes('marine-api')?[{current:{wave_height:0}},{current:{wave_height:2}}]:[1,2,3].map(x=>({current:{wind_speed_10m:x}}))};}};
 vm.runInNewContext(functionSource('function isInland','function renderConditions')+functionSource('async function fetchPreviewConditions','function renderLiveTop')+';this.run=fetchPreviewConditions;',ctx);
 await ctx.run(spots);assert.equal(urls.find(u=>u.hostname==='marine-api.open-meteo.com').searchParams.get('latitude'),'1,3');assert.equal(ctx.LIVE.sea1.swell,'0.0 m');assert.equal(ctx.LIVE.sea2.swell,'2.0 m');assert.equal(ctx.LIVE.lake.swell,undefined);assert.equal(ctx.LIVE.lake.wind,'2 km/h N');
});
test('gallery images are local, credited and attached to existing destinations',()=>{
 const galleries=JSON.parse(fs.readFileSync(path.join(root,'assets/spots/gallery-sources.json'),'utf8'));
 assert.equal(Object.values(galleries).flat().length,29);assert.equal(extra.filter(s=>s.catalogNew).length,40);
 for(const [id,rows] of Object.entries(galleries)){assert.ok(all.some(s=>s.id===id),id);for(const p of rows){assert.ok(fs.statSync(path.join(root,p.src)).size>1000);assert.ok(p.author&&p.license);assert.equal(new URL(p.source).protocol,'https:');}}
});
test('an unrecognised country does not invent an emergency phone number',()=>{
 const ctx={};vm.runInNewContext(functionSource('function countryEmergency','var SPORT_VERB')+';this.emergency=countryEmergency;',ctx);
 assert.equal(ctx.emergency('Lieu non identifié').call,null);assert.equal(ctx.emergency('Savoie, France').call,'112');
});
