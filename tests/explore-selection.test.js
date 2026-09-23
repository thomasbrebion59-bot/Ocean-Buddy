const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const app=fs.readFileSync(new URL('../app.js',`file://${__filename}`),'utf8');
const selection=app.slice(app.indexOf('function exploreSpots('),app.indexOf('/* Photographies de destinations',app.indexOf('function exploreSpots(')));

test('country counts and displayed spots use the same world and activity filters',()=>{
  const spots=[
    {id:'asia-surf',name:'Baie surf',loc:'Sri Lanka',level:'debutant',sports:['surf']},
    {id:'asia-dive',name:'Baie plongée',loc:'Sri Lanka',level:'intermediaire',sports:['plongee']},
    {id:'europe-dive',name:'Autre baie',loc:'Sri Lanka',level:'intermediaire',sports:['plongee']}
  ];
  const ctx={SPOTS:spots,SPOT_WORLD:{'asia-surf':'as','asia-dive':'as','europe-dive':'eu'},spotWorld:'as',spotCountry:null,activeSport:'plongee',currentFilter:'all',currentSearch:'',favOnly:false,favs:new Set(),countryOf:s=>s.loc,spotSports:s=>s.sports,searchable:s=>String(s).toLowerCase().trim()};
  vm.runInNewContext(selection+';this.select=exploreSpots;this.count=countryCount;this.worldCount=worldCount;',ctx);
  assert.deepEqual(Array.from(ctx.select().map(s=>s.id)),['asia-dive']);
  assert.equal(ctx.count('Sri Lanka'),1);
  assert.equal(ctx.worldCount('as'),1);
  ctx.spotCountry='Sri Lanka';ctx.currentSearch='plongée';
  assert.deepEqual(Array.from(ctx.select().map(s=>s.id)),['asia-dive']);
  ctx.favOnly=true;
  assert.equal(ctx.select().length,0);
  ctx.favs.add('asia-dive');
  assert.equal(ctx.select().length,1);
});
