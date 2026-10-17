import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityHandler} from '../netlify/functions/lib/community-handler.mjs';
import {RULES_VERSION} from '../netlify/functions/lib/community-core.mjs';

// Identity A tries to act on objects that belong to B. The fake below applies PostgREST filters
// for real (eq, in, gte, is), so a missing author/blocker filter in the handler would show up here.
const OWNER='00000000-0000-4000-8000-0000000000a0',A='00000000-0000-4000-8000-0000000000a1',B='00000000-0000-4000-8000-0000000000b1',C='00000000-0000-4000-8000-0000000000c1';
const B_PENDING='00000000-0000-4000-8000-0000000000b2',B_APPROVED='00000000-0000-4000-8000-0000000000b3',A_APPROVED='00000000-0000-4000-8000-0000000000a3',B_REPORT='00000000-0000-4000-8000-0000000000b4';
const TOKENS={'token-owner':OWNER,'token-a':A,'token-b':B};
const env={COMMUNITY_SUPABASE_URL:'https://example.supabase.co',COMMUNITY_SUPABASE_SECRET_KEY:'sb_secret_test',COMMUNITY_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',COMMUNITY_OWNER_ID:OWNER,COMMUNITY_ENABLED:'true'};
const reply=(data,status=200)=>new Response(status===204?null:JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
const base='https://site.example/.netlify/functions/community';
const get=(token,query='')=>new Request(base+query,{headers:token?{authorization:'Bearer '+token}:{}});
const post=(token,body)=>new Request(base,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
let counter=0;
const newId=()=>'00000000-0000-4000-8000-'+String(++counter).padStart(12,'0');

function match(row,key,raw){
  const value=row[key];
  if(raw.startsWith('eq.'))return String(value)===raw.slice(3);
  if(raw.startsWith('in.('))return raw.slice(4,-1).split(',').includes(String(value));
  if(raw.startsWith('gte.'))return String(value)>=raw.slice(4);
  if(raw==='not.is.null')return value!==null&&value!==undefined;
  if(raw==='is.null')return value===null||value===undefined;
  throw Error('filtre non géré '+key+'='+raw);
}
const IGNORED=new Set(['select','order','limit','on_conflict']);
const KEYS={community_profiles:['id'],community_blocks:['blocker_id','blocked_id']};

function fakeSupabase(){
  const db={
    community_profiles:[{id:A,display_name:'Alice',rules_version:RULES_VERSION,banned_at:null},{id:B,display_name:'Bruno',rules_version:RULES_VERSION,banned_at:null},{id:C,display_name:'Chloé',rules_version:RULES_VERSION,banned_at:null}],
    community_entries:[
      {id:B_PENDING,author_id:B,author_name:'Bruno',kind:'post',body:'Brouillon privé de Bruno en attente.',status:'pending',parent_id:null,created_at:'2026-10-01T00:00:00Z'},
      {id:B_APPROVED,author_id:B,author_name:'Bruno',kind:'post',body:'Sortie publique de Bruno sur la côte.',status:'approved',parent_id:null,created_at:'2026-10-01T00:00:00Z',published_at:'2026-10-01T01:00:00Z'},
      {id:A_APPROVED,author_id:A,author_name:'Alice',kind:'post',body:'Sortie publique d’Alice au large.',status:'approved',parent_id:null,created_at:'2026-10-01T00:00:00Z',published_at:'2026-10-01T01:00:00Z'}
    ],
    community_blocks:[{blocker_id:B,blocked_id:C}],
    community_reports:[{id:B_REPORT,reporter_id:B,entry_id:A_APPROVED,reason:'spam',details:'',status:'open',created_at:'2026-10-01T00:00:00Z'}],
    community_moderation_events:[]
  };
  const calls=[];
  const fetcher=async(url,options={})=>{
    const parsed=new URL(url),path=parsed.pathname,method=options.method||'GET';
    calls.push({path,method,query:parsed.search});
    if(path==='/auth/v1/user'){
      const id=TOKENS[(options.headers?.authorization||'').slice(7)];
      return id?reply({id,email:id+'@example.test',email_confirmed_at:'2026-10-01T00:00:00Z'}):reply({msg:'invalid JWT'},401);
    }
    if(path.startsWith('/auth/v1/admin/users/')&&method==='DELETE'){
      const id=path.split('/').pop();
      for(const table of Object.keys(db))db[table]=db[table].filter(row=>![row.id,row.author_id,row.reporter_id,row.blocker_id,row.blocked_id].includes(id));
      return reply({});
    }
    const table=path.replace('/rest/v1/','');
    if(!db[table])return reply({},404);
    const filters=[...parsed.searchParams].filter(([key])=>!IGNORED.has(key));
    const selected=()=>db[table].filter(row=>filters.every(([key,raw])=>match(row,key,raw)));
    if(method==='GET'){const limit=parsed.searchParams.get('limit');return reply(limit==='0'?[]:selected());}
    if(method==='PATCH'){const rows=selected(),patch=JSON.parse(options.body);rows.forEach(row=>Object.assign(row,patch));return reply(rows.map(row=>({id:row.id})));}
    if(method==='DELETE'){const rows=selected();db[table]=db[table].filter(row=>!rows.includes(row));return reply(null,204);}
    if(method==='POST'){
      const body=JSON.parse(options.body),keys=KEYS[table];
      const existing=keys&&db[table].find(row=>keys.every(key=>row[key]===body[key]));
      if(existing){if(!/ignore-duplicates/.test(options.headers?.prefer||''))Object.assign(existing,body);return reply(null,204);}
      const row={id:newId(),created_at:new Date().toISOString(),status:table==='community_reports'?'open':undefined,...body};
      db[table].push(row);return reply([row],201);
    }
    return reply({},405);
  };
  return {db,calls,handler:createCommunityHandler({env,fetcher})};
}
const entry=(db,id)=>db.community_entries.find(row=>row.id===id);

test('A cannot withdraw (hide) an entry written by B, pending or approved',async()=>{
  const {db,handler}=fakeSupabase();
  for(const id of [B_PENDING,B_APPROVED]){
    const response=await handler(post('token-a',{action:'withdraw',entryId:id}));
    assert.equal(response.status,404);
  }
  assert.equal(entry(db,B_PENDING).status,'pending');
  assert.equal(entry(db,B_APPROVED).status,'approved');
  assert.equal((await handler(post('token-a',{action:'withdraw',entryId:A_APPROVED}))).status,200);
  assert.equal(entry(db,A_APPROVED).status,'removed');
});

test('A cannot publish in the name of B: author fields sent by the client are refused or ignored',async()=>{
  const {db,handler}=fakeSupabase();
  const base={kind:'post',body:'Une sortie au lever du jour, mer calme.',displayName:'Alice',rulesVersion:RULES_VERSION,acceptRules:true};
  for(const extra of [{authorId:B},{author_id:B},{userId:B}])
    assert.equal((await handler(post('token-a',{action:'submit',entry:{...base,...extra}}))).status,400);
  const ok=await handler(post('token-a',{action:'submit',authorId:B,userId:B,entry:base}));
  assert.equal(ok.status,202);
  const created=entry(db,(await ok.json()).entry.id);
  assert.equal(created.author_id,A);
  assert.equal(created.status,'pending');
});

test('A cannot rename B: the profile written is always the caller one',async()=>{
  const {db,handler}=fakeSupabase();
  assert.equal((await handler(post('token-a',{action:'update_profile',id:B,userId:B,displayName:'Pirate'}))).status,200);
  assert.equal(db.community_profiles.find(row=>row.id===B).display_name,'Bruno');
  assert.equal(db.community_profiles.find(row=>row.id===A).display_name,'Pirate');
});

test('A does not see the private data of B (own space, pending entries, block list)',async()=>{
  const {handler}=fakeSupabase();
  const me=await (await handler(get('token-a','?view=me&userId='+B+'&author_id=eq.'+B))).json();
  assert.equal(me.user.id,A);
  assert.ok(me.entries.every(row=>row.author_id===A));
  assert.ok(!JSON.stringify(me).includes(B_PENDING));
  assert.deepEqual(me.blocked,[]);
  const feed=await (await handler(get('token-a','?view=feed&status=eq.pending'))).json();
  assert.ok(!JSON.stringify(feed).includes(B_PENDING));
  assert.equal((await handler(get('token-a','?view=thread&parentId='+B_PENDING))).status,404);
  assert.equal((await handler(get(null,'?view=me'))).status,401);
});

test('A cannot report a pending entry of B nor their own entry; reports are signed by A',async()=>{
  const {db,handler}=fakeSupabase();
  assert.equal((await handler(post('token-a',{action:'report',report:{entryId:B_PENDING,reason:'spam'}}))).status,404);
  assert.equal((await handler(post('token-a',{action:'report',report:{entryId:A_APPROVED,reason:'spam'}}))).status,400);
  assert.equal((await handler(post('token-a',{action:'report',report:{entryId:B_APPROVED,reason:'spam',reporterId:B}}))).status,400);
  assert.equal((await handler(post('token-a',{action:'report',reporterId:B,report:{entryId:B_APPROVED,reason:'spam'}}))).status,202);
  const created=db.community_reports.find(row=>row.entry_id===B_APPROVED);
  assert.equal(created.reporter_id,A);
});

test('A cannot change the block list of B',async()=>{
  const {db,handler}=fakeSupabase();
  assert.equal((await handler(post('token-a',{action:'unblock',userId:C,blockerId:B}))).status,200);
  assert.deepEqual(db.community_blocks,[{blocker_id:B,blocked_id:C}]);
  assert.equal((await handler(post('token-a',{action:'block',userId:A}))).status,400);
});

test('A cannot delete the account of B',async()=>{
  const {db,calls,handler}=fakeSupabase();
  assert.equal((await handler(post('token-a',{action:'delete_account',confirm:'SUPPRIMER',userId:B,id:B}))).status,200);
  const deletes=calls.filter(call=>call.path.startsWith('/auth/v1/admin/users/'));
  assert.deepEqual(deletes.map(call=>call.path),['/auth/v1/admin/users/'+A]);
  assert.ok(db.community_profiles.some(row=>row.id===B));
  assert.ok(entry(db,B_PENDING));
});

test('moderator actions are refused to a member, whatever the request says',async()=>{
  const {db,handler}=fakeSupabase();
  assert.equal((await handler(get('token-a','?view=moderation&owner=true'))).status,403);
  const attempts=[
    {action:'moderate',entryId:B_PENDING,decision:'approve',isOwner:true},
    {action:'moderate',entryId:B_APPROVED,decision:'hide'},
    {action:'resolve_report',reportId:B_REPORT},
    {action:'ban_user',userId:B},
    {action:'unban_user',userId:B}
  ];
  for(const body of attempts)assert.equal((await handler(post('token-a',body))).status,403,body.action);
  assert.equal(entry(db,B_PENDING).status,'pending');
  assert.equal(entry(db,B_APPROVED).status,'approved');
  assert.equal(db.community_reports[0].status,'open');
  assert.equal(db.community_profiles.find(row=>row.id===B).banned_at,null);
  // The owner, identified by the verified session, can.
  assert.equal((await handler(post('token-owner',{action:'moderate',entryId:B_PENDING,decision:'approve'}))).status,200);
});

test('identity only comes from a session verified by Supabase Auth, never from a forged token',async()=>{
  const {calls,handler}=fakeSupabase();
  // A hand-made JWT claiming to be B (unsigned) is rejected by the Auth server.
  const forged=['eyJhbGciOiJub25lIn0',Buffer.from(JSON.stringify({sub:B,role:'authenticated'})).toString('base64url'),''].join('.');
  for(const token of [forged,B,'token-B'])
    assert.equal((await handler(post(token,{action:'withdraw',entryId:B_APPROVED}))).status,401);
  assert.equal((await handler(post(null,{action:'withdraw',entryId:B_APPROVED}))).status,401);
  assert.ok(calls.some(call=>call.path==='/auth/v1/user'));
  assert.ok(!calls.some(call=>call.method==='PATCH'));
});
