const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const all=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const additions=all.filter(s=>s.edition==='catalogue-2026-09');
const additions2=all.filter(s=>s.edition==='catalogue-2026-09b');
const base=all.filter(s=>s.editorialStatus==='unverified'&&!['catalogue-2026-09','catalogue-2026-09b'].includes(s.edition));
const extra=all.filter(s=>s.editorialStatus==='reviewed');
const photos=JSON.parse(fs.readFileSync(path.join(root,'assets/spots/sources.json'),'utf8'));
const legacy=require('../legacy-spots.js');
const sports=new Set(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf']);
test('718 distinct spots: 168 historical, 112 sourced, 152 + 286 September 2026 additions',()=>{
 assert.equal(base.length,168);assert.equal(extra.length,112);assert.equal(additions.length,152);assert.equal(additions2.length,286);assert.equal(all.length,718);
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
test('browser and media views match the canonical catalogue exactly',()=>{
 const runtime={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'catalog-runtime.js'),'utf8'),runtime);
 assert.equal(JSON.stringify(runtime.window.OCEAN_CATALOG),JSON.stringify(all));
 assert.equal(JSON.stringify(photos),JSON.stringify(Object.fromEntries(all.filter(s=>s.photo).map(s=>[s.id,s.photo]))));
});
test('every spot shows the six fixed practical rows without inventing missing facts',()=>{
 const guide=fs.readFileSync(path.join(root,'field-guide.js'),'utf8');
 const start=guide.indexOf('  function visitRows('),end=guide.indexOf('  function mapURL(',start);
 assert.ok(start>0&&end>start);
 assert.match(guide,/<section id="fieldVisit"/);
 assert.match(guide,/\$\('#fieldVisit'\)\.innerHTML=visitGuide\(s\)/);
 const ctx={window:{},external:'↗',esc:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.runInNewContext(guide.slice(start,end)+';this.visitRows=visitRows;this.visitGuide=visitGuide;',ctx);
 const SIX=['Accès','Stationnement','Marée','Matériel','À éviter','Règles locales'];
 for(const s of all){
  const rows=ctx.visitRows(s);
  /* six libellés fixes ; « Meilleure période » s'ajoute seulement quand une ligne historique bestPeriod existe */
  const labels=rows.map(row=>row.label);
  assert.deepEqual([...labels.filter(l=>l!=='Meilleure période')],SIX,s.id);
  assert.equal(labels.includes('Meilleure période'),!!s.visit?.bestPeriod,s.id);
  for(const row of rows)assert.equal(row.verified?row.value!=='À vérifier localement':row.value==='À vérifier localement',true,s.id+': '+row.label);
 }
 /* 7 fiches historiques + le top 50 de l'essentiel sourcé (macarella et balos en commun) + saintecroix (consignes du Parc) */
 const withVisit=all.filter(s=>s.visit);
 assert.ok(withVisit.length>=50&&withVisit.length<=60,String(withVisit.length));
 for(const id of ['kohtao','kohlipe','kealakekua','poipu','macarella','balos','cathedralcove','saintecroix'])assert.ok(all.find(s=>s.id===id).visit,id);
 const sourced=all.find(s=>s.id==='cathedralcove');
 assert.ok(ctx.visitRows(sourced).filter(row=>row.verified).length>=3);
 assert.match(ctx.visitGuide(sourced),/consultée le 23\/09\/2026/);
 assert.match(ctx.visitGuide(sourced),/doc\.govt\.nz\/cathedral-cove-walk/);
 const historical=all.find(s=>s.id==='hossegor');
 assert.equal(ctx.visitRows({...historical,visit:{reviewed:'2026-09-23',access:'Text not sourced'}}).filter(row=>row.verified).length,0);
 /* aucune ligne vérifiée : une seule ligne compacte « À vérifier localement » */
 assert.equal((ctx.visitGuide(historical).match(/À vérifier localement/g)||[]).length,1);
 /* kohtao : la ligne « meilleure période » (office du tourisme, illisible) est retirée ; saintecroix a ses consignes sourcées */
 assert.equal(all.find(s=>s.id==='kohtao').visit.bestPeriod,undefined);
 assert.equal(typeof all.find(s=>s.id==='saintecroix').visit.localRules,'object');
});
test('each published photograph belongs to the destination and has usable attribution',()=>{
 assert.equal(all.length,718);
 assert.equal(Object.keys(photos).length,all.filter(s=>s.photo).length);
 for(const id of ['tamarindo','byronbay']){const p=all.find(s=>s.id===id).photo;assert.equal(p.ai,true,id);assert.equal(p.label,'Illustration IA',id);assert.match(p.caption,/pas une photo du lieu/,id);assert.ok(photos[id],id);}
 for(const s of all.filter(s=>s.photo?.ai))assert.match(s.photo.src,/-ia\.webp$/,s.id);
 /* Couvertures revues en octobre 2026 : photos du lieu même, Wikimedia Commons. */
 assert.match(photos.cumbuco.source,/Praia_do_cumbuco/);
 assert.match(photos.ngor.source,/Ile_Ngor/);
 for(const s of all.filter(s=>s.photo)){const p=photos[s.id];assert.ok(p,s.id);assert.ok(fs.statSync(path.join(root,p.src)).size>1000,s.id);assert.ok(fs.statSync(path.join(root,p.thumb)).size>1000,s.id+' thumbnail');assert.ok(p.author&&p.license&&p.source,s.id);assert.equal(new URL(p.source).protocol,'https:',s.id);}
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
 /* dangers reste vide pour une fiche reviewed : les phrases du carnet vont dans carnet.dangers, marquées « non vérifié » */
 for(const s of extra){for(const k of ['wind','swell','temp','tide'])assert.equal(s[k],'—',s.id+':'+k);assert.equal(s.dangers.length,0,s.id);if(s.carnet)assert.equal(s.carnet.status,'non vérifié',s.id);assert.equal(s.rating,undefined);assert.equal(s.score,undefined);}
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
 assert.equal(Object.values(galleries).flat().length,29);assert.equal(extra.filter(s=>s.catalogNew).length,0);assert.equal(all.filter(s=>s.catalogNew).length,additions2.length);assert.ok(additions2.every(s=>s.catalogNew));
 for(const [id,rows] of Object.entries(galleries)){assert.ok(all.some(s=>s.id===id),id);for(const p of rows){assert.ok(fs.statSync(path.join(root,p.src)).size>1000);assert.ok(p.author&&p.license);assert.equal(new URL(p.source).protocol,'https:');}}
});
test('emergency numbers come from data/sources/urgences.json by exact country name and are never invented',()=>{
 const urgences=JSON.parse(fs.readFileSync(path.join(root,'data/sources/urgences.json'),'utf8'));
 const ctx={};vm.runInNewContext(functionSource('function countryEmergency','// Phrases entières pour la traduction')+';this.emergency=countryEmergency;',ctx);
 const e=c=>ctx.emergency(typeof c==='string'?{country:c}:c);
 /* inconnu ou absent : « À confirmer », pas de bouton d'appel */
 for(const x of ['Lieu non identifié','',undefined,null,{},{loc:'Savoie, France'}])assert.equal(ctx.emergency(x).call,null,JSON.stringify(x));
 assert.equal(e('Lieu non identifié').emergency,'À confirmer');
 /* le champ loc n'est plus lu : ni sous-chaîne, ni région */
 assert.equal(ctx.emergency({loc:'Savoie, France',country:'Oman'}).call,e('Oman').call);
 assert.equal(e('Sud de la France').call,null);assert.equal(e('Hawaï').call,null);
 /* casse et accents indifférents, égalité exacte sinon */
 const us=urgences.find(x=>x.country==='États-Unis');
 assert.equal(e('ÉTATS-UNIS').call,String(us.call.number));assert.equal(e('etats-unis').call,String(us.call.number));
 /* chaque pays du catalogue est dans le fichier de sources ; le bouton n'existe que pour un numéro « sourcé » */
 const byCountry=new Map(urgences.map(x=>[x.country,x]));
 for(const c of new Set(all.map(s=>s.country))){
  const row=byCountry.get(c);assert.ok(row,'urgences.json : '+c);
  const expected=row.call.status==='sourcé'?String(row.call.number):null;
  assert.equal(e(c).call,expected,c);
  assert.equal(e(c).emergency,expected||'À confirmer',c);
 }
 /* pays sans bouton : « À confirmer » et la ligne par défaut ou le conflit, jamais un numéro prêté */
 for(const c of ['Maroc','Égypte','Nicaragua','Liberia','Angola','Sierra Leone'])if(byCountry.has(c)){assert.equal(e(c).call,null,c);assert.equal(e(c).emergency,'À confirmer',c);}
 /* sur tout le catalogue : un spot n'a un numéro que si son pays en a un dans la source */
 for(const s of all)if(e(s).call)assert.equal(byCountry.get(s.country).call.status,'sourcé',s.id);
});
test('isInland reads waterType only: lake and inland are inland, sea is not',()=>{
 const ctx={};vm.runInNewContext(functionSource('function isInland','function renderConditions')+';this.isInland=isInland;',ctx);
 assert.equal(ctx.isInland({waterType:'inland'}),true);assert.equal(ctx.isInland({waterType:'lake'}),true);
 assert.equal(ctx.isInland({waterType:'sea'}),false);assert.equal(ctx.isInland({}),false);assert.equal(ctx.isInland(undefined),false);
 assert.equal(ctx.isInland({id:'annecy',waterType:'sea'}),false,'plus de liste d’identifiants');
 for(const s of all){const inland=['lake','inland'].includes(s.waterType);assert.equal(ctx.isInland(s),inland,s.id);}
 for(const id of ['annecy','verdon','gardalake','hoodriver','silfra','cenote_dosojos','eisbach'])assert.equal(ctx.isInland(all.find(s=>s.id===id)),true,id);
});

test('every spot has a country and sits on the right continent',()=>{
 for(const s of all)assert.ok(typeof s.country==='string'&&s.country,s.id);
 for(const s of all.filter(s=>/hawaï|kauaʻi|oahu|maui/i.test(s.loc)))assert.equal(s.world,'na',s.id);
 for(const s of all.filter(s=>s.country==='États-Unis'))assert.equal(s.world,'na',s.id);
 for(const s of all.filter(s=>s.world==='oc'))assert.notEqual(s.country,'États-Unis',s.id);
 for(const s of [...additions,...additions2]){assert.equal(s.editorialStatus,'unverified',s.id);assert.equal(s.source.url,null,s.id);assert.ok(s.dangers.length&&s.tip,s.id);}
 for(const s of additions2){assert.ok(s.loc.endsWith(s.country),s.id);assert.ok(['coastal-sector','lake-sector','inland-sector'].includes(s.coordinatePrecision),s.id);if(s.photo)assert.match(s.photo.license,/CC BY|CC0|Public domain|PD|Attribution/i,s.id);}
 for(const id of ['todossantos','cabopulmo'])assert.equal(all.find(s=>s.id===id).country,'Mexique',id);
});
test('relecture sécurité : aucun calme promis sans condition, aucun garde-côtes prêté à un numéro général',()=>{
 /* « l’eau est calme », « les lagunes sont calmes » : seulement sous condition (quand, si, lorsque) ou en comparaison (plus calme). */
 for(const s of all){
  const tip=String(s.tip||'');const re=/\b(?:est|sont) calmes?\b/g;let m;
  while((m=re.exec(tip))){assert.match(tip.slice(Math.max(0,m.index-45),m.index),/\b(?:quand|si|lorsque|lorsqu’)\b|lorsqu’/,s.id+' : '+tip);}
 }
 const ctx={};vm.runInNewContext(functionSource('function countryEmergency','var SPORT_VERB')+';this.emergency=countryEmergency;',ctx);
 /* un numéro général n'est jamais présenté comme celui des garde-côtes (911 aux Philippines est le numéro d'urgence national) */
 assert.notEqual(ctx.emergency('Philippines').sea,'Garde-côtes : 911');
 /* chaque texte de spot affiché (conseil, description, dangers) a sa traduction anglaise et espagnole */
 const en=JSON.parse(fs.readFileSync(path.join(root,'locales/translations/en.json'),'utf8'));
 const es=JSON.parse(fs.readFileSync(path.join(root,'locales/translations/es.json'),'utf8'));
 for(const s of all)for(const x of [s.tip,s.desc,...(s.dangers||[]).map(d=>d[1])].filter(Boolean)){assert.ok(en[x],'en '+s.id+' : '+x);assert.ok(es[x],'es '+s.id+' : '+x);}
});
