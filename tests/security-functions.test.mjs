/* Audit de sécurité (phase 2) : en-têtes défensifs et absence de clé serveur dans les réponses des fonctions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunityHandler} from '../netlify/functions/lib/community-handler.mjs';
import {createPoulpyHandler} from '../netlify/functions/lib/poulpy-core.mjs';

const SERVICE='server-secret-value-123',ANON='public-anon-value',OPENAI='test-openai-secret-456';
const communityEnv={COMMUNITY_SUPABASE_URL:'https://example.supabase.co',COMMUNITY_SUPABASE_SERVICE_ROLE_KEY:SERVICE,COMMUNITY_SUPABASE_ANON_KEY:ANON,COMMUNITY_OWNER_ID:'00000000-0000-4000-8000-000000000001',COMMUNITY_ENABLED:'true'};
const origin='https://thomasbrebion59-bot.github.io';
const leaksSecret=text=>[SERVICE,ANON,OPENAI].some(secret=>text.includes(secret));

function assertDefensive(response){
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.match(response.headers.get('content-security-policy')||'',/default-src 'none'/);
  assert.equal(response.headers.get('cache-control'),'no-store');
}

test('community: defensive headers on success, refusal and error answers',async()=>{
  const failing=createCommunityHandler({env:communityEnv,fetcher:async()=>{throw Error('network down '+SERVICE)}});
  const cases=[
    await failing(new Request('https://site.example/.netlify/functions/community?view=status',{headers:{origin}})),
    await failing(new Request('https://site.example/.netlify/functions/community',{headers:{origin:'https://evil.example'}})),
    await failing(new Request('https://site.example/.netlify/functions/community',{method:'PUT',headers:{origin}})),
    await failing(new Request('https://site.example/.netlify/functions/community?view=feed',{headers:{origin}}))
  ];
  for(const response of cases){assertDefensive(response);assert.equal(leaksSecret(await response.text()),false);}
  assert.equal(cases[1].status,403);
  assert.equal(cases[1].headers.get('access-control-allow-origin'),null);
});

test('community: provider errors never echo the service key or the provider body',async()=>{
  const handler=createCommunityHandler({env:communityEnv,fetcher:async(url,options={})=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'00000000-0000-4000-8000-000000000002',email:'m@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});
    return new Response(JSON.stringify({message:'permission denied, key='+SERVICE}),{status:500});
  }});
  const response=await handler(new Request('https://site.example/.netlify/functions/community?view=me',{headers:{origin,authorization:'Bearer member'}}));
  const text=await response.text();
  assert.equal(response.status,503);
  assert.equal(leaksSecret(text),false);
  assert.deepEqual(JSON.parse(text),{error:'service_unavailable'});
});

test('poulpy: provider failure and status answers never expose the OpenAI key',async()=>{
  const env={OPENAI_API_KEY:OPENAI,OPENAI_MODEL:'test-model',POULPY_ENABLED:'true'};
  const handler=createPoulpyHandler({env,fetcher:async()=>{throw Error('boom '+OPENAI)}});
  const status=await handler(new Request('https://site.example/.netlify/functions/poulpy',{headers:{origin}}));
  assertDefensive(status);assert.equal(leaksSecret(await status.text()),false);
  const failed=await handler(new Request('https://site.example/.netlify/functions/poulpy',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({message:'Quelle marée à Biarritz ?'})}),{ip:'203.0.113.9'});
  assert.equal(failed.status,502);
  assertDefensive(failed);
  assert.equal(leaksSecret(await failed.text()),false);
});
