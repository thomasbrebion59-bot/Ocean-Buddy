const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','progression.js'),'utf8');
function load(saved=new Map(),now='2026-09-24T10:00:00'){
  const RealDate=Date,fixed=new RealDate(now).getTime();
  class FakeDate extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}}
  const localStorage={getItem:k=>saved.has(k)?saved.get(k):null,setItem:(k,v)=>saved.set(k,String(v))};
  const window={};
  vm.runInNewContext(source,{window,localStorage,Date:FakeDate,JSON,Math,Object,Array});
  return {P:window.OceanProgress,saved};
}

test('levels grow from Moussaillon to Légende du large',()=>{
  const {P}=load();
  assert.equal(P.level(0).n,1);
  assert.equal(P.level(0).title,'Moussaillon');
  assert.equal(P.level(99).remain,1);
  assert.equal(P.level(100).n,2);
  const top=P.level(99999);
  assert.equal(top.n,10);assert.equal(top.max,true);assert.equal(top.pct,100);
});

test('a new person has no badge and a one-day streak',()=>{
  const {P}=load();
  assert.equal(P.streak(),1);
  const b=P.badges({xp:0,sessions:[],eco:0,quiz:0,favs:0});
  assert.equal(b.length,8);
  assert.ok(b.every(x=>x.locked));
});

test('consecutive visits build a streak that survives a reload',()=>{
  const saved=new Map();
  load(saved,'2026-09-21T09:00:00');load(saved,'2026-09-22T09:00:00');
  const {P}=load(saved,'2026-09-23T20:00:00');
  assert.equal(P.streak(),3);
  const gap=load(saved,'2026-09-25T09:00:00').P;
  assert.equal(gap.streak(),1);
  assert.equal(gap.best(),3);
});

test('a challenge can be completed once per week, then again the next week',()=>{
  const saved=new Map();
  const {P}=load(saved,'2026-09-24T10:00:00');
  assert.equal(P.completeChal('beach-clean'),true);
  assert.equal(P.completeChal('beach-clean'),false);
  assert.equal(load(saved,'2026-09-27T22:00:00').P.chalDone('beach-clean'),true);
  const nextWeek=load(saved,'2026-09-28T08:00:00').P;
  assert.equal(nextWeek.chalDone('beach-clean'),false);
  assert.equal(nextWeek.completeChal('beach-clean'),true);
});

test('measurable challenges follow real activity',()=>{
  const {P}=load();
  assert.equal(P.goal('explorateur',{sessions:[]}).cur,0);
  ['a','b','c','a'].forEach(P.seeSpot);
  assert.equal(P.goal('explorateur',{sessions:[]}).cur,3);
  const now=new Date('2026-09-24T10:00:00').getTime();
  const sessions=[{ts:now},{ts:now-86400000},{ts:now-10*86400000},{date:'12 sept.'}];
  assert.equal(P.goal('regularite',{sessions}).cur,2);
  assert.equal(P.goal('photographe',{sessions}),null);
});

test('badges unlock once and are announced only the first time',()=>{
  const saved=new Map();
  const {P}=load(saved);
  const ctx={xp:0,sessions:[{ts:1}],eco:5,quiz:0,favs:0};
  const first=Array.from(P.newBadges(ctx),b=>b.id).sort();
  assert.deepEqual(first,['eco','first']);
  assert.equal(P.newBadges(ctx).length,0);
  assert.equal(load(saved).P.newBadges(ctx).length,0);
});

test('corrupt saved progress falls back to a clean state',()=>{
  const saved=new Map([['oceanbuddy_progress_v1','{not json']]);
  const {P}=load(saved);
  assert.equal(P.streak(),1);
  assert.equal(P.seenCount(false),0);
});
