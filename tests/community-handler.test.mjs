import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityHandler} from '../netlify/functions/lib/community-handler.mjs';
import {RULES_VERSION} from '../netlify/functions/lib/community-core.mjs';

const owner='00000000-0000-4000-8000-000000000001',member='00000000-0000-4000-8000-000000000002',entryId='00000000-0000-4000-8000-000000000003';
const env={COMMUNITY_SUPABASE_URL:'https://example.supabase.co',COMMUNITY_SUPABASE_SERVICE_ROLE_KEY:'server-only',COMMUNITY_SUPABASE_ANON_KEY:'public-anon',COMMUNITY_OWNER_ID:owner,COMMUNITY_ENABLED:'true'};
const request=(method='GET',body,token,url='https://site.example/.netlify/functions/community')=>new Request(url,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
const reply=(data,status=200)=>new Response(status===204?null:JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

function fakeBackend({failAudit=false}={}){
  const entries=[],profiles=new Map(),calls=[];
  const fetcher=async(url,options={})=>{
    const parsed=new URL(url),path=parsed.pathname,method=options.method||'GET',q=parsed.searchParams;
    calls.push({path,method,query:q.toString(),headers:options.headers||{}});
    if(path==='/auth/v1/user'){
      const id=options.headers.authorization==='Bearer owner'?owner:options.headers.authorization==='Bearer member'?member:null;
      return id?reply({id,email:'member@example.test',email_confirmed_at:'2026-09-23T00:00:00Z'}):reply({},401);
    }
    if(path==='/auth/v1/admin/users/'+member&&method==='DELETE'){entries.length=0;profiles.delete(member);return reply({});}
    if(path==='/rest/v1/community_profiles'){
      if(method==='POST'){const body=JSON.parse(options.body);profiles.set(body.id,{id:body.id,display_name:body.display_name,rules_version:body.rules_version});return reply(null,204);}
      if(method==='PATCH'){const id=q.get('id')?.slice(3),profile=profiles.get(id);if(!profile)return reply([]);Object.assign(profile,JSON.parse(options.body));return reply([{id}]);}
      if(q.has('id')&&q.get('id').startsWith('eq.'))return reply([profiles.get(q.get('id').slice(3))].filter(Boolean));
      if(q.has('id')&&q.get('id').startsWith('in.'))return reply([...profiles.values()]);
      if(q.has('banned_at'))return reply([...profiles.values()].filter(item=>item.banned_at));
      return reply([]);
    }
    if(path==='/rest/v1/community_entries'){
      if(method==='POST'){const body=JSON.parse(options.body),row={id:entryId,created_at:'2026-09-23T00:00:00Z',published_at:null,...body};entries.push(row);return reply([row],201);}
      if(method==='PATCH'){
        const target=entries.find(row=>row.id===q.get('id')?.slice(3)&&row.status===q.get('status')?.slice(3));
        if(!target)return reply([]);
        Object.assign(target,JSON.parse(options.body));return reply([{id:target.id}]);
      }
      if(method==='GET'){
        let rows=entries.slice();
        if(q.get('status'))rows=rows.filter(row=>row.status===q.get('status').slice(3));
        if(q.get('author_id'))rows=rows.filter(row=>row.author_id===q.get('author_id').slice(3));
        if(q.get('kind')==='in.(post,trip,proposal)')rows=rows.filter(row=>['post','trip','proposal'].includes(row.kind));
        if(q.get('limit')==='0')rows=[];
        return reply(rows);
      }
    }
    if(path==='/rest/v1/community_blocks'||path==='/rest/v1/community_reports')return reply([]);
    if(path==='/rest/v1/community_moderation_events'&&method==='POST')return failAudit?reply({},503):reply(null,204);
    return reply({},404);
  };
  return {fetcher,entries,profiles,calls};
}

test('service fails closed without external configuration',async()=>{
  const handler=createCommunityHandler({env:{},fetcher:()=>{throw Error('should not call')}});
  assert.deepEqual(await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=status'))).json(),{enabled:false,reason:'setup_required'});
  assert.equal((await handler(request('POST',{action:'submit'},'member'))).status,503);
});

test('new text remains pending until the owner approves it; audit failure does not undo approval',async()=>{
  const backend=fakeBackend({failAudit:true}),handler=createCommunityHandler({env,fetcher:backend.fetcher,now:()=>Date.parse('2026-09-23T00:00:00Z')});
  const submission={action:'submit',entry:{kind:'post',body:'Une belle sortie avec des conseils de terrain.',displayName:'Marine',rulesVersion:RULES_VERSION,acceptRules:true}};
  const sent=await handler(request('POST',submission,'member'));
  assert.equal(sent.status,202);assert.deepEqual(await sent.json(),{entry:{id:entryId,status:'pending'}});
  const pending=await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=feed'))).json();
  assert.deepEqual(pending.entries,[]);
  const blocked=await handler(request('POST',{action:'moderate',entryId,decision:'approve'},'member'));
  assert.equal(blocked.status,403);
  const approved=await handler(request('POST',{action:'moderate',entryId,decision:'approve'},'owner'));
  assert.deepEqual(await approved.json(),{status:'approved',auditLogged:false});
  const publicFeed=await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=feed'))).json();
  assert.equal(publicFeed.entries.length,1);assert.equal(publicFeed.entries[0].author,'Marine');
  assert.equal(publicFeed.entries[0].status,'approved');
  assert.ok(backend.calls.some(call=>call.path==='/rest/v1/community_entries'&&call.query.includes('status=eq.approved')));
});

test('account deletion uses the authenticated user ID only',async()=>{
  const backend=fakeBackend(),handler=createCommunityHandler({env,fetcher:backend.fetcher});
  assert.equal((await handler(request('POST',{action:'delete_account',confirm:'NO'},'member'))).status,400);
  const deleted=await handler(request('POST',{action:'delete_account',confirm:'SUPPRIMER',userId:owner},'member'));
  assert.equal(deleted.status,200);assert.deepEqual(await deleted.json(),{deleted:true});
  assert.ok(backend.calls.some(call=>call.path==='/auth/v1/admin/users/'+member&&call.method==='DELETE'));
  assert.ok(!backend.calls.some(call=>call.path==='/auth/v1/admin/users/'+owner));
});

test('owner restriction hides already approved content and prevents new submissions',async()=>{
  const backend=fakeBackend(),handler=createCommunityHandler({env,fetcher:backend.fetcher});
  const submission={action:'submit',entry:{kind:'post',body:'Une belle sortie avec des conseils de terrain.',displayName:'Marine',rulesVersion:RULES_VERSION,acceptRules:true}};
  assert.equal((await handler(request('POST',submission,'member'))).status,202);
  assert.equal((await handler(request('POST',{action:'moderate',entryId,decision:'approve'},'owner'))).status,200);
  assert.equal((await handler(request('POST',{action:'ban_user',userId:member},'member'))).status,403);
  assert.deepEqual(await (await handler(request('POST',{action:'ban_user',userId:member},'owner'))).json(),{restricted:true});
  assert.deepEqual((await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=feed'))).json()).entries,[]);
  assert.equal((await handler(request('POST',submission,'member'))).status,403);
  assert.deepEqual(await (await handler(request('POST',{action:'unban_user',userId:member},'owner'))).json(),{restricted:false});
  assert.equal((await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=feed'))).json()).entries.length,1);
});

test('a verified member can edit the public name without accepting posting rules',async()=>{
  const backend=fakeBackend(),handler=createCommunityHandler({env,fetcher:backend.fetcher});
  assert.equal((await handler(request('POST',{action:'update_profile',displayName:'M'},'member'))).status,400);
  assert.deepEqual(await (await handler(request('POST',{action:'update_profile',displayName:'Océane'},'member'))).json(),{displayName:'Océane'});
  assert.equal(backend.profiles.get(member).display_name,'Océane');
  assert.equal(backend.profiles.get(member).rules_version,'');
});

test('changing a profile name cannot alter previously approved author text',async()=>{
  const backend=fakeBackend(),handler=createCommunityHandler({env,fetcher:backend.fetcher});
  const submission={action:'submit',entry:{kind:'post',body:'Une belle sortie avec des conseils de terrain.',displayName:'Marine',rulesVersion:RULES_VERSION,acceptRules:true}};
  await handler(request('POST',submission,'member'));
  await handler(request('POST',{action:'moderate',entryId,decision:'approve'},'owner'));
  await handler(request('POST',{action:'update_profile',displayName:'Autre nom'},'member'));
  const feed=await (await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=feed'))).json();
  assert.equal(feed.entries[0].author,'Marine');
});

test('new Supabase API keys stay in apikey, never Bearer',async()=>{
  const backend=fakeBackend();
  const modern={...env,COMMUNITY_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',COMMUNITY_SUPABASE_SECRET_KEY:'sb_secret_test'};
  const handler=createCommunityHandler({env:modern,fetcher:backend.fetcher});
  assert.equal((await handler(request('GET',null,null,'https://site.example/.netlify/functions/community?view=status'))).status,200);
  assert.equal((await handler(request('POST',{action:'delete_account',confirm:'SUPPRIMER'},'member'))).status,200);
  for(const call of backend.calls.filter(item=>item.path.startsWith('/rest/v1/')||item.path.startsWith('/auth/v1/admin/'))){
    assert.equal(call.headers.apikey,'sb_secret_test');assert.equal(call.headers.authorization,undefined);
  }
  const userCheck=backend.calls.find(item=>item.path==='/auth/v1/user');
  assert.equal(userCheck.headers.apikey,'sb_publishable_test');assert.equal(userCheck.headers.authorization,'Bearer member');
});

test('cross-origin access is limited to the web site and the native app',async()=>{
  const handler=createCommunityHandler({env,fetcher:fakeBackend().fetcher});
  const good=new Request('https://site.example/.netlify/functions/community',{method:'OPTIONS',headers:{origin:'capacitor://oceanbuddy.localhost'}});
  const allowed=await handler(good);assert.equal(allowed.status,204);assert.equal(allowed.headers.get('access-control-allow-origin'),'capacitor://oceanbuddy.localhost');
  const bad=new Request('https://site.example/.netlify/functions/community?view=feed',{headers:{origin:'https://attacker.example'}});
  assert.equal((await handler(bad)).status,403);
});
