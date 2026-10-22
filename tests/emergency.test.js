/* Numéros d'urgence : la table d'app.js est générée depuis data/sources/urgences.json (scripts/build-emergency.cjs),
   chaque bouton repose sur une source citée, et aucun numéro n'est donné quand les sources officielles se contredisent. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const urgences=JSON.parse(fs.readFileSync(path.join(root,'data/sources/urgences.json'),'utf8'));
const build=require('../scripts/build-emergency.cjs');
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const NO_BUTTON=['Maroc','Nicaragua','Liberia','Angola','Sierra Leone','Égypte'];
const DEFAULT_LINE='Repère le numéro des secours locaux avant ta sortie.';
const CONFLICT_LINE='Les sources officielles se contredisent : demande le numéro sur place.';

function functionSource(start,end){const i=app.indexOf(start);assert.ok(i>=0,start);const j=app.indexOf(end,i);assert.ok(j>i,end);return app.slice(i,j);}
function load(){
 const ctx={};
 vm.runInNewContext(functionSource('function countryEmergency','// Phrases entières pour la traduction')+';this.emergency=countryEmergency;this.table=EMERGENCY_BY_COUNTRY;',ctx);
 return ctx;
}
const byCountry=new Map(urgences.map(e=>[e.country,e]));

test('le bloc EMERGENCY d’app.js est exactement celui que produit build-emergency.cjs',()=>{
 assert.match(app,/\/\*EMERGENCY\*\/[\s\S]*?\/\*\/EMERGENCY\*\//);
 assert.equal(build.render(app,urgences),app,'lancer node scripts/build-emergency.cjs');
});

test('chaque pays du catalogue a une entrée sourcée dans urgences.json et dans la table',()=>{
 const {table}=load();
 const countries=[...new Set(catalog.map(s=>s.country))];
 assert.ok(countries.length>=100,String(countries.length));
 for(const c of countries){
  assert.ok(byCountry.has(c),'urgences.json : '+c);
  assert.ok(Object.prototype.hasOwnProperty.call(table,build.countryKey(c)),'table : '+c);
 }
 assert.equal(Object.keys(table).length,urgences.length);
});

test('urgences.json : dates, URL https, citations, et une source pour chaque champ « sourcé »',()=>{
 for(const e of urgences){
  assert.match(e.checked,DATE,e.country);
  assert.ok(e.sources.length,e.country+' : aucune source');
  for(const s of e.sources){
   assert.equal(new URL(s.url).protocol,'https:',e.country);
   assert.match(s.consulted,DATE,e.country);
   assert.ok(String(s.quote).trim(),e.country+' : citation vide');
  }
  for(const f of ['call','general','medical','sea']){
   const x=e[f];assert.ok(x,e.country+' : '+f);
   if(x.status==='sourcé'){
    assert.ok(x.sources.length,e.country+' : '+f+' sourcé sans source');
    for(const i of x.sources)assert.ok(e.sources[i],e.country+' : '+f+' -> '+i);
   }
  }
  assert.doesNotThrow(()=>build.check(e),e.country);
 }
});

test('aucun bouton d’appel sans numéro « sourcé »',()=>{
 const {emergency}=load();
 for(const e of urgences){
  const r=emergency({country:e.country});
  if(e.call.status==='sourcé'){
   assert.equal(r.call,e.call.number,e.country);assert.equal(r.emergency,e.call.number,e.country);
   assert.match(r.checked,DATE,e.country);
  }else{
   assert.equal(r.call,null,e.country);assert.equal(r.emergency,'À confirmer',e.country);
  }
 }
 /* sur tout le catalogue : un bouton n'existe que pour un pays dont le numéro est sourcé */
 for(const s of catalog){const r=emergency(s);if(r.call)assert.equal(byCountry.get(s.country).call.status,'sourcé',s.id);}
 /* le générateur refuse de publier un bouton ou une ligne sans source */
 const fake={country:'Test',checked:'2026-10-20',sources:[],call:{number:'112',status:'à vérifier',sources:[]},general:{number:null,status:'à vérifier',sources:[]},medical:{number:null,status:'à vérifier',sources:[]},sea:{number:null,status:'à vérifier',sources:[]},line:null};
 assert.deepEqual(build.rows([fake]).test,[null,null,null,'2026-10-20']);
 assert.throws(()=>build.check({...fake,call:{number:'112',status:'sourcé',sources:[]}}),/sans source/);
 assert.throws(()=>build.check({...fake,line:{kind:'mer',n:'196'}}),/secours en mer sourcé/);
 assert.throws(()=>build.check({...fake,line:{kind:'conflit',n:null}}),/conflit/);
});

test('Maroc, Nicaragua, Liberia, Angola, Sierra Leone et Égypte : pas de bouton, sources contradictoires signalées',()=>{
 const {emergency}=load();
 for(const c of NO_BUTTON){
  const r=emergency(c);
  assert.equal(r.call,null,c);assert.equal(r.emergency,'À confirmer',c);
  assert.equal(r.sea,CONFLICT_LINE,c);
  assert.equal(byCountry.get(c).call.status,'conflit',c);
 }
 /* le 112 n'est pas remis au Maroc */
 assert.doesNotMatch(JSON.stringify(load().table.maroc),/112/);
});

test('le champ « loc » n’est jamais lu : égalité exacte sur « country », casse et accents indifférents',()=>{
 const {emergency}=load();
 assert.doesNotMatch(functionSource('function countryEmergency','/*EMERGENCY*/'),/\.loc\b/);
 for(const x of ['Lieu non identifié','',undefined,null,{},{loc:'Landes, France'},'Sud de la France','Hawaï','Colombie-Britannique'])assert.equal(emergency(x).call,null,JSON.stringify(x));
 assert.equal(emergency({loc:'Landes, France',country:'Oman'}).call,'9999');
 assert.equal(emergency('ÉTATS-UNIS').call,'911');assert.equal(emergency('etats-unis').call,'911');
 assert.equal(emergency('Îles Vierges des États-Unis').call,'911');assert.equal(emergency('  afrique du sud ').call,'112');
 assert.equal(emergency('Lieu non identifié').sea,DEFAULT_LINE);assert.equal(emergency('Lieu non identifié').checked,null);
});

test('la ligne sous le numéro suit un vocabulaire fermé, et seulement sur un champ sourcé',()=>{
 const {emergency}=load();
 const allowed=[/^Secours en mer : .+ \(ou VHF 16\)$/,/^Secours en mer : .+$/,/^Garde-côtes : .+$/,/^Urgences : .+$/,/^Ambulance : .+$/];
 for(const e of urgences){
  const r=emergency(e.country);
  if(!e.line){assert.equal(r.sea,DEFAULT_LINE,e.country);continue;}
  if(e.line.kind==='conflit'){assert.equal(r.sea,CONFLICT_LINE,e.country);continue;}
  assert.ok(allowed.some(re=>re.test(r.sea)),e.country+' : '+r.sea);
  assert.ok(r.sea.includes(e.line.n),e.country);
  if(e.line.kind==='ambulance')assert.equal(e.medical.status,'sourcé',e.country);
  else assert.equal(e.sea.status,'sourcé',e.country);
  if(/VHF 16/.test(r.sea))assert.equal(e.sea.vhf16,true,e.country);
 }
});

test('fiches de la planche : Canada, Papouasie, Maurice, Maroc, Nicaragua, Japon, Thaïlande, France',()=>{
 const {emergency}=load();
 const spot=id=>{const s=catalog.find(x=>x.id===id);assert.ok(s,id);return emergency(s);};
 assert.equal(spot('lawrencetown').call,'911');assert.equal(spot('lawrencetown').sea,'Garde-côtes : VHF 16');
 assert.equal(spot('kavieng').call,'111');assert.equal(spot('kavieng').sea,DEFAULT_LINE);
 assert.equal(spot('lemorne').call,'999');assert.equal(spot('lemorne').sea,'Garde-côtes : 177');
 assert.equal(spot('taghazout').call,null);assert.equal(spot('popoyo').call,null);
 assert.equal(spot('miyazaki').call,'119');assert.equal(spot('miyazaki').sea,'Garde-côtes : 118');
 assert.equal(spot('kohtao').call,'1669');
 assert.equal(spot('hossegor').call,'112');assert.equal(spot('hossegor').sea,'Secours en mer : 196 (ou VHF 16)');
 assert.match(spot('hossegor').checked,DATE);
});

test('la fiche affiche la date de vérification sous le numéro',()=>{
 const open=functionSource('function openSpot','function renderSpotSource');
 assert.match(open,/Numéro vérifié le \$\{em\.checked\.split\('-'\)\.reverse\(\)\.join\('\/'\)\}/);
 assert.match(open,/callButton\.hidden=!em\.call/);
});
