/* Audit de sécurité (phase 2) : le service worker ne garde ni réponse privée ni requête authentifiée. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadWorker(networkResponse){
  const listeners={},stored=[];
  const cache={match:async()=>undefined,put:async request=>{stored.push(typeof request==='string'?request:request.url);},keys:async()=>[],delete:async()=>true,addAll:async()=>{}};
  const context={
    self:{addEventListener:(type,fn)=>{listeners[type]=fn;},skipWaiting:()=>{},clients:{claim:()=>{}}},
    caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},
    location:{origin:'https://site.example'},
    fetch:async()=>networkResponse(),
    URL,Response,Request,Headers,Promise,Response
  };
  vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
  async function dispatch(request){
    let answered=null;
    listeners.fetch({request,respondWith:value=>{answered=value;}});
    if(answered)await answered;
    await new Promise(resolve=>setTimeout(resolve,0));
    return {answered:!!answered,stored};
  }
  return dispatch;
}

test('service worker: a no-store or private same-origin answer is not cached',async()=>{
  for(const header of ['no-store','private, max-age=60']){
    const dispatch=loadWorker(()=>new Response('{}',{status:200,headers:{'cache-control':header}}));
    const result=await dispatch(new Request('https://site.example/data/me.json'));
    assert.equal(result.answered,true);
    assert.deepEqual(result.stored,[]);
  }
});

test('service worker: an ordinary public file is still cached for offline use',async()=>{
  const dispatch=loadWorker(()=>new Response('{}',{status:200,headers:{'cache-control':'max-age=60'}}));
  const result=await dispatch(new Request('https://site.example/data/seasons.json'));
  assert.deepEqual(result.stored,['https://site.example/data/seasons.json']);
});

test('service worker: an authenticated request bypasses the worker entirely',async()=>{
  const dispatch=loadWorker(()=>new Response('{}',{status:200}));
  const result=await dispatch(new Request('https://site.example/data/seasons.json',{headers:{authorization:'Bearer x'}}));
  assert.equal(result.answered,false);
  assert.deepEqual(result.stored,[]);
});
