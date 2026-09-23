import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {validateSubmission,validateTrip,validateReport,RULES_VERSION} from '../netlify/functions/lib/community-core.mjs';
const require=createRequire(import.meta.url),sharing=require('../trip-sharing.js');
const spots=new Set(['biarritz','anglet']);
const id='00000000-0000-4000-8000-000000000001';

test('a public trip contains only individually selected private fields',()=>{
  const privateTrip={id:'local-secret-id',name:'Côte basque',destination:'France',start:'2026-10-01',end:'2026-10-10',budget:'800',accommodation:'Adresse et téléphone privés',transport:'Train',notes:'Code de réservation',checklist:[{label:'Passeport'}],steps:[{id:'step-1',spotId:'biarritz',date:'2026-10-02',notes:'Adresse de rendez-vous',budget:'70',accommodation:'Hôtel secret',transport:'Taxi privé'},{id:'step-2',spotId:'anglet',date:'2026-10-03',notes:'Leash',budget:'40',accommodation:'Camping',transport:'Bus'}]};
  const basic=sharing.buildSnapshot(privateTrip,{},spots);
  assert.deepEqual(basic,{name:'Côte basque',destination:'France',steps:[{spotId:'biarritz'},{spotId:'anglet'}]});
  assert.doesNotMatch(JSON.stringify(basic),/local-secret|réservation|Passeport|rendez-vous|Hôtel secret|Taxi privé|Camping/);
  const selected=sharing.buildSnapshot(privateTrip,{start:true,budget:true,steps:{'step-2':{notes:true,transport:true,budget:true}}},spots);
  assert.deepEqual(selected,{name:'Côte basque',destination:'France',steps:[{spotId:'biarritz'},{spotId:'anglet',notes:'Leash',transport:'Bus',budget:'40'}],start:'2026-10-01',budget:'800'});
  assert.deepEqual(validateTrip(selected,spots),selected);
});

test('removed or private spots cannot be published in a trip',()=>{
  assert.throws(()=>sharing.buildSnapshot({name:'Ancien trip',steps:[{id:'1',spotId:'old-bonus'}]}, {},spots),/catalogue vérifié/);
  assert.throws(()=>validateTrip({name:'Secret',destination:'',steps:[{spotId:'old-bonus'}]},spots),/unknown_spot/);
  assert.throws(()=>validateTrip({name:'Secret',destination:'',steps:[{spotId:'biarritz'}],checklist:['private']},spots),/invalid_trip/);
});

test('every submission must accept the current rules and enter a strict shape',()=>{
  const input={kind:'post',body:'Une belle session avec des conseils utiles.',displayName:'Marine',rulesVersion:RULES_VERSION,acceptRules:true};
  assert.equal(validateSubmission(input,spots).entry.kind,'post');
  assert.throws(()=>validateSubmission({...input,acceptRules:false},spots),/rules_required/);
  assert.throws(()=>validateSubmission({...input,privateNotes:'secret'},spots),/invalid_request/);
  assert.throws(()=>validateSubmission({...input,body:'court'},spots),/invalid_body/);
  assert.throws(()=>validateSubmission({...input,body:'Voir https://a.test https://b.test https://c.test'},spots),/too_many_links/);
});

test('review, reply, proposal and report validation protects public identifiers',()=>{
  const common={body:'Une information concrète sur ce lieu.',displayName:'Marine',rulesVersion:RULES_VERSION,acceptRules:true};
  assert.deepEqual(validateSubmission({...common,kind:'review',spotId:'biarritz',rating:5},spots).entry,{kind:'review',body:common.body,title:null,spot_id:'biarritz',rating:5,parent_id:null,payload:{}});
  assert.throws(()=>validateSubmission({...common,kind:'review',spotId:'anglet',rating:0},spots),/invalid_rating/);
  assert.equal(validateSubmission({...common,kind:'reply',parentId:id},spots).entry.parent_id,id);
  const proposal=validateSubmission({...common,kind:'proposal',title:'Nouvelle crique',payload:{location:'France',lat:48.12345,lon:-4.12345,sport:'surf'}},spots).entry;
  assert.equal(proposal.payload.lat,48.123);
  assert.deepEqual(validateReport({entryId:id,reason:'privacy'}),{entry_id:id,reason:'privacy',details:''});
  assert.throws(()=>validateReport({entryId:'bad',reason:'privacy'}),/invalid_report/);
});
