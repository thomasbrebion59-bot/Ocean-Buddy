/* The Poulpy function never reaches an outside service: it steers apps not yet updated towards their built-in guide. */
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createPoulpyHandler} from '../netlify/functions/lib/poulpy-core.mjs';
const origin='https://thomasbrebion59-bot.github.io';
const req=(method='POST',o=origin,body={message:'Un spot à Biarritz ?'})=>new Request('https://example.test/poulpy',{method,headers:{...(o?{origin:o}:{}),'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
const handler=()=>createPoulpyHandler({env:{OPENAI_API_KEY:'sk-test-placeholder-only',POULPY_ENABLED:'true'}});

test('status says the online service is off, whatever the old variables say',async()=>{
  const r=await handler()(req('GET'));assert.equal(r.status,200);assert.deepEqual(await r.json(),{enabled:false,service:'Poulpy',version:2});
  assert.equal(r.headers.get('access-control-allow-origin'),origin);
});
test('questions get a non-OK answer that old apps turn into their built-in guide button, with no outside call',async()=>{
  const realFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('no network');};
  try{
    const r=await handler()(req());assert.equal(r.status,503);const text=await r.text();
    assert.deepEqual(JSON.parse(text),{error:'not_configured'});assert.ok(!text.includes('sk-test'));
    assert.equal(r.headers.get('access-control-allow-origin'),origin);
    assert.equal((await handler()(req('POST',null))).status,503);
  }finally{globalThis.fetch=realFetch;}
  assert.equal(calls,0);
});
test('native Apple and Android origins keep CORS while other origins are refused',async()=>{
  for(const o of ['capacitor://oceanbuddy.localhost','https://oceanbuddy.localhost']){const r=await handler()(req('OPTIONS',o));assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),o);}
  for(const o of ['capacitor://localhost','https://other.localhost','https://oceanbuddy.localhost.attacker.test'])assert.equal((await handler()(req('GET',o))).status,403);
  assert.equal((await handler()(req('PUT'))).status,405);
});
test('the function code holds no model provider, key or outside address',()=>{
  for(const name of ['lib/poulpy-core.mjs','poulpy.mjs']){const code=readFileSync(new URL('../netlify/functions/'+name,import.meta.url),'utf8');assert.doesNotMatch(code,/openai|OPENAI_|api\.|fetch\(|responses|model/i,name);}
});
