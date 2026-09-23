const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Trips=require('../trip-model.js');
const Notebook=require('../spot-notebook-model.js');

test('a saved private spot remains usable in trips and personal notes after a restart',()=>{
  const saved=new Map();
  const storage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
  const privateSpot={id:'custom-crique-test-1',name:'Crique de test',loc:'Brest, France',world:'fr',sports:['surf'],coords:{lat:48.36,lon:-4.49},desc:'Repère personnel'};
  storage.setItem('oceanbuddy_custom_spots_v1',JSON.stringify([privateSpot]));
  const trip=Trips.create({name:'Bretagne'},[privateSpot.id]);
  Trips.save(storage,[trip]);
  Notebook.save(storage,{compare:[privateSpot.id],notes:{[privateSpot.id]:'Accès à confirmer'}});

  const context={localStorage:storage,SPOTS:[{id:'official'}],COORDS:{},SPOT_WORLD:{},SPORTS:[{id:'surf'}],WORLDS:[{id:'fr'}]};
  context.window=context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../private-spots.js'),'utf8'),context);
  const ids=context.SPOTS.map(spot=>spot.id);
  assert.deepEqual(ids,['official',privateSpot.id]);
  assert.equal(Trips.load(storage,ids)[0].steps[0].legacy,undefined);
  assert.equal(Notebook.load(storage,ids).notes[privateSpot.id],'Accès à confirmer');
  assert.deepEqual(Notebook.load(storage,ids).compare,[privateSpot.id]);

  const another={...privateSpot,id:'custom-crique-test-2',name:'Autre crique'};
  storage.setItem('oceanbuddy_custom_spots_v1',JSON.stringify([privateSpot,another]));
  context.OceanPrivateSpots.register();
  const currentIds=context.SPOTS.map(spot=>spot.id);
  assert.equal(Trips.addStep(trip,another.id,currentIds).steps.at(-1).spotId,another.id);
  assert.deepEqual(Notebook.toggle(Notebook.load(storage,currentIds),another.id,currentIds).compare,[privateSpot.id,another.id]);
  assert.equal(context.SPOTS.filter(spot=>spot.id===privateSpot.id).length,1);
});
