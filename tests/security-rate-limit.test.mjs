import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityHandler,WRITE_LIMITS} from '../netlify/functions/lib/community-handler.mjs';
import * as communityFunction from '../netlify/functions/community.mjs';
import * as poulpyFunction from '../netlify/functions/poulpy.mjs';

const A='00000000-0000-4000-8000-0000000000a1',B='00000000-0000-4000-8000-0000000000b1',OWNER='00000000-0000-4000-8000-0000000000a0';
const env={COMMUNITY_SUPABASE_URL:'https://example.supabase.co',COMMUNITY_SUPABASE_SECRET_KEY:'sb_secret_test',COMMUNITY_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',COMMUNITY_OWNER_ID:OWNER,COMMUNITY_ENABLED:'true'};
const reply=(data,status=200)=>new Response(status===204?null:JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
const post=(token,body)=>new Request('https://site.example/.netlify/functions/community',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(body)});

function backend({reportsLastHour=0}={}){
  const calls=[];
  const fetcher=async(url,options={})=>{
    const parsed=new URL(url),path=parsed.pathname,method=options.method||'GET';
    calls.push({path,method,query:parsed.searchParams});
    if(path==='/auth/v1/user'){const id={'Bearer a':A,'Bearer b':B}[options.headers.authorization];return id?reply({id,email_confirmed_at:'2026-10-01T00:00:00Z'}):reply({},401);}
    if(path==='/rest/v1/community_entries'&&method==='GET')return reply([{id:'00000000-0000-4000-8000-0000000000e1',author_id:B,kind:'post',status:'approved'}]);
    if(path==='/rest/v1/community_reports'&&method==='GET'){
      if(parsed.searchParams.has('entry_id'))return reply([]);
      return reply(Array.from({length:reportsLastHour},(_,i)=>({id:String(i)})));
    }
    if(method==='POST'||method==='DELETE')return reply(null,204);
    return reply([]);
  };
  return {fetcher,calls};
}
const unblock=userId=>({action:'unblock',userId});

test('Netlify edge limits are declared on both functions (per IP, persistent)',()=>{
  assert.deepEqual(communityFunction.config.rateLimit,{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']});
  assert.deepEqual(poulpyFunction.config.rateLimit,{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']});
});

test('community writes are limited per verified account, whatever the IP',async()=>{
  let t=Date.parse('2026-10-17T10:00:00Z');
  const {fetcher}=backend(),handler=createCommunityHandler({env,fetcher,now:()=>t});
  for(let i=0;i<WRITE_LIMITS.perUserPerMinute;i++)
    assert.equal((await handler(post('a',unblock(B)),{ip:'198.51.100.'+i})).status,200,'requête '+i);
  const over=await handler(post('a',unblock(B)),{ip:'203.0.113.9'});
  assert.equal(over.status,429);
  assert.deepEqual(await over.json(),{error:'slow_down'});
  // Another account is not affected, and the window resets after a minute.
  assert.equal((await handler(post('b',unblock(A)),{ip:'203.0.113.9'})).status,200);
  t+=61000;
  assert.equal((await handler(post('a',unblock(B)),{ip:'203.0.113.9'})).status,200);
});

test('community writes are limited per IP before the session is even checked',async()=>{
  const t=Date.parse('2026-10-17T10:00:00Z');
  const {fetcher,calls}=backend(),handler=createCommunityHandler({env,fetcher,now:()=>t});
  for(let i=0;i<WRITE_LIMITS.perIpPerMinute;i++)await handler(post(i%2?'a':'b',unblock(i%2?B:A)),{ip:'192.0.2.1'});
  const before=calls.filter(call=>call.path==='/auth/v1/user').length;
  assert.equal((await handler(post('junk-token',unblock(A)),{ip:'192.0.2.1'})).status,429);
  assert.equal(calls.filter(call=>call.path==='/auth/v1/user').length,before,'Supabase Auth must not be called once the IP is over its limit');
  assert.equal((await handler(post('b',unblock(A)),{ip:'192.0.2.2'})).status,200);
});

test('reports are capped per account and per hour in the database',async()=>{
  const report={action:'report',report:{entryId:'00000000-0000-4000-8000-0000000000e1',reason:'spam'}};
  const under=backend({reportsLastHour:WRITE_LIMITS.reportsPerHour-1});
  assert.equal((await createCommunityHandler({env,fetcher:under.fetcher})(post('a',report))).status,202);
  const count=under.calls.find(call=>call.path==='/rest/v1/community_reports'&&call.query.has('created_at'));
  assert.equal(count.query.get('reporter_id'),'eq.'+A);
  const over=backend({reportsLastHour:WRITE_LIMITS.reportsPerHour});
  const response=await createCommunityHandler({env,fetcher:over.fetcher})(post('a',report));
  assert.equal(response.status,429);
  assert.ok(!over.calls.some(call=>call.path==='/rest/v1/community_reports'&&call.method==='POST'));
});

