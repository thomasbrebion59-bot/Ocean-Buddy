const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../trip-model.js');
const ids = ['biarritz', 'anglet', 'hossegor'];
const storage = () => { const data = new Map(); return { getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,v) }; };

test('optional dates and independent checklist entries', () => {
  const a=M.create(), b=M.create();
  assert.equal(M.duration(a),null);
  assert.equal(a.steps.length,0);
  assert.notEqual(a.id,b.id);
  assert.notEqual(a.checklist[0].id,b.checklist[0].id);
});
test('reject impossible dates and reversed range; accept leap day', () => {
  assert.throws(()=>M.create({start:'2026-02-29'}),/valides/);
  assert.throws(()=>M.create({start:'2026-10-17',end:'2026-10-10'}),/retour/);
  assert.equal(M.create({start:'2028-02-29'}).start,'2028-02-29');
});
test('duration counts calendar days across daylight-saving change', () => {
  assert.equal(M.duration(M.create({start:'2026-10-24',end:'2026-10-26'})),3);
  assert.equal(M.duration(M.create({start:'2026-03-28',end:'2026-03-30'})),3);
});
test('steps may repeat a spot but have independent identities and ordering', () => {
  let t=M.create({},['biarritz','anglet']);
  t=M.addStep(t,'biarritz',ids);
  assert.notEqual(t.steps[0].id,t.steps[2].id);
  const before=t.steps.map(s=>s.id);
  t=M.moveStep(t,t.steps[2].id,-1);
  assert.deepEqual(t.steps.map(s=>s.id),[before[0],before[2],before[1]]);
  assert.equal(M.moveStep(t,t.steps[0].id,-1),t);
  assert.throws(()=>M.addStep(t,'inconnu',ids),/catalogue/);
});
test('step dates stay within trip range including after editing the range', () => {
  let t=M.create({start:'2026-10-10',end:'2026-10-17'},['biarritz']);
  assert.throws(()=>M.editStep(t,t.steps[0].id,{date:'2026-10-18'}),/comprise/);
  t=M.editStep(t,t.steps[0].id,{date:'2026-10-15',notes:'Session du matin'});
  assert.throws(()=>M.edit(t,{end:'2026-10-14'}),/comprise/);
  assert.equal(t.steps[0].date,'2026-10-15');
});
test('budget supports French decimals and rejects invalid amounts', () => {
  const t=M.create();
  assert.equal(M.edit(t,{budget:'520,50'}).budget,'520,50');
  for(const budget of ['-1','Infinity','abc','12.345','10000001'])assert.throws(()=>M.edit(t,{budget}),/positif/);
  assert.throws(()=>M.edit(t,{name:'  '}),/nom/);
});
test('reload retains itinerary, accents, notes, dates, checklist and archives', () => {
  const s=storage();
  let t=M.create({name:'Été <Océan> & amis',start:'2026-10-10',end:'2026-10-17'},ids);
  t=M.edit(t,{notes:'Adresse : « La vague »',transport:'Train',budget:'600'});
  t=M.editStep(t,t.steps[0].id,{date:'2026-10-12',notes:'Leash à prévoir'});
  t.checklist[0].done=true;t.archived=true;
  M.save(s,[t]);
  assert.deepEqual(M.load(s,ids),[t]);
});
test('removed bonus places keep dates and notes, while precise duplicates move to catalogue spots', () => {
  const s=storage(),t=M.create({},['biarritz','bonus-0','bonus-1']);
  const withNotes=M.editStep(t,t.steps[2].id,{date:'2026-10-12',notes:'Hébergement réservé'});
  M.save(s,[withNotes]);const loaded=M.load(s,[...ids,'baleal']);
  assert.equal(loaded[0].id,t.id);
  assert.deepEqual(loaded[0].steps.map(x=>x.spotId),['biarritz','baleal','bonus-1']);
  assert.equal(loaded[0].steps[2].legacy.name,'Praia do Guincho');
  assert.equal(loaded[0].steps[2].date,'2026-10-12');
  assert.equal(loaded[0].steps[2].notes,'Hébergement réservé');
  assert.equal(loaded[0].steps[2].id,t.steps[2].id);
  assert.equal(loaded[0].steps[1].legacy,undefined);
});
test('archived stage can be replaced without losing its date, notes, or order',()=>{
  const s=storage(),trip=M.create({},['bonus-1','biarritz']);
  M.save(s,[M.editStep(trip,trip.steps[0].id,{date:'2026-11-02',notes:'Train du matin',budget:'42,50',accommodation:'Chez Léa',transport:'Train'})]);
  const loaded=M.load(s,ids)[0];
  const next=M.replaceStep(loaded,loaded.steps[0].id,'anglet',ids);
  assert.deepEqual(next.steps[0],{id:loaded.steps[0].id,spotId:'anglet',date:'2026-11-02',notes:'Train du matin',budget:'42,50',accommodation:'Chez Léa',transport:'Train'});
  assert.equal(next.steps[1].spotId,'biarritz');
  assert.throws(()=>M.replaceStep(loaded,loaded.steps[0].id,'bonus-1',ids),/catalogue/);
});
test('older notebooks receive private step logistics without losing their notes',()=>{
  const s=storage(),trip=M.create({},['biarritz']);
  const old={...trip,steps:[{id:trip.steps[0].id,spotId:'biarritz',date:'2026-11-03',notes:'Leash'}]};
  M.save(s,[old]);const loaded=M.load(s,ids)[0];
  assert.deepEqual(loaded.steps[0],{...old.steps[0],budget:'',accommodation:'',transport:''});
  const changed=M.editStep(loaded,loaded.steps[0].id,{accommodation:'Chambre au port'});
  assert.equal(changed.steps[0].notes,'Leash');
  assert.equal(changed.steps[0].accommodation,'Chambre au port');
  assert.throws(()=>M.editStep(loaded,loaded.steps[0].id,{budget:'-42'}),/budget/);
});
test('unknown former spots remain visible as placeholders', () => {
  const s=storage(),t=M.create({},['old-spot']);
  M.save(s,[t]);const loaded=M.load(s,ids);
  assert.equal(loaded[0].steps[0].spotId,'old-spot');
  assert.equal(loaded[0].steps[0].legacy.name,'Spot indisponible');
});
test('archived stages break map distance instead of inventing a direct leg', () => {
  const source=fs.readFileSync(path.join(__dirname,'../trips.js'),'utf8');
  const utility=source.slice(source.indexOf('const distanceKm='),source.indexOf('const region='));
  const ctx={COORDS:{a:{lat:0,lon:0},b:{lat:0,lon:1},c:{lat:0,lon:2}}};
  vm.runInNewContext(utility+';this.distance=routeDistance;',ctx);
  assert.equal(ctx.distance({steps:[{spotId:'a'},{spotId:'legacy'},{spotId:'b'}]}),null);
  const known=ctx.distance({steps:[{spotId:'a'},{spotId:'b'},{spotId:'legacy'},{spotId:'c'}]});
  assert.ok(known>100&&known<120);
});
test('corrupt storage remains untouched and quota errors propagate to UI', () => {
  const s=storage();s.setItem(M.KEY,'{unreadable');
  assert.throws(()=>M.load(s,ids));assert.equal(s.getItem(M.KEY),'{unreadable');
  assert.throws(()=>M.save({setItem(){throw Error('quota exceeded')}},[M.create()]),/quota/);
});

test('deletion removes only the selected trip from the active list and survives reload',()=>{
  const saved=storage();
  let target=M.create({name:'Voyage à retirer'},['biarritz','anglet']);
  target=M.edit(target,{notes:'Adresse à garder',transport:'Train',budget:'450'});
  target=M.editStep(target,target.steps[0].id,{date:'2026-10-12',notes:'Départ du matin'});
  target.checklist[0].done=true;
  const other=M.create({name:'À conserver'},['hossegor']);
  const before=[target,other],next=M.removeTrip(before,target.id);
  assert.equal(before[0].deleted,false,'does not mutate existing data before saving');
  assert.equal(next[1],other,'leaves the other trip unchanged');
  assert.deepEqual(next.filter(t=>!t.archived&&!t.deleted),[other]);
  M.save(saved,next);
  const reloaded=M.load(saved,ids);
  assert.equal(reloaded[0].deleted,true);
  assert.deepEqual(M.restoreTrip(reloaded,target.id),before,'restores every field, step and checklist item');
});

test('an archived trip returns to the archives when restored from the bin',()=>{
  const archived={...M.create({name:'Voyage passé'},['anglet']),archived:true};
  const removed=M.removeTrip([archived],archived.id);
  assert.equal(removed.filter(t=>t.archived&&!t.deleted).length,0);
  assert.equal(removed[0].archived,true);
  assert.deepEqual(M.restoreTrip(removed,archived.id),[archived]);
  assert.throws(()=>M.removeTrip(removed,archived.id),/corbeille/);
  assert.throws(()=>M.removeTrip([archived],'unknown'),/introuvable/);
  assert.throws(()=>M.restoreTrip([archived],archived.id),/corbeille/);
});

test('existing notebooks without a deletion flag keep their trips after migration',()=>{
  const saved=storage(),legacy=M.create({name:'Ancien carnet'},ids);
  delete legacy.deleted;
  M.save(saved,[legacy]);
  assert.deepEqual(M.load(saved,ids),[{...legacy,deleted:false}]);
});

test('failed deletion persistence leaves the saved trip intact',()=>{
  const saved=storage(),trip=M.create({name:'Important'},ids);
  M.save(saved,[trip]);
  const failing={getItem:saved.getItem,setItem(){throw Error('storage unavailable')}};
  assert.throws(()=>M.save(failing,M.removeTrip([trip],trip.id)),/unavailable/);
  assert.deepEqual(M.load(saved,ids),[trip]);
  assert.equal(trip.deleted,false);
});
