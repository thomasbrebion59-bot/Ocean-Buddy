/* Service worker : la borne du cache d'images ne doit jamais évincer le code de l'app (bug demarrage-navigation-1). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ORIGIN='https://site.example/';

/* Cache conforme à la spec : put retire l'entrée existante puis l'ajoute en fin de file. */
class FakeCache{
  constructor(){this.m=new Map();}
  async match(r){return this.m.get(typeof r==='string'?new URL(r,ORIGIN).href:r.url);}
  async put(r,res){const u=typeof r==='string'?new URL(r,ORIGIN).href:r.url;this.m.delete(u);this.m.set(u,res);}
  async keys(){return [...this.m.keys()].map(url=>({url}));}
  async delete(r){return this.m.delete(typeof r==='string'?new URL(r,ORIGIN).href:r.url);}
  async add(){}
  async addAll(){}
}

function loadWorker(){
  const stores=new Map(),listeners={};
  const net={online:true};
  const response=()=>({ok:true,type:'basic',headers:{get:()=>null},clone(){return this;}});
  const context={
    self:{addEventListener:(type,fn)=>{listeners[type]=fn;},skipWaiting:()=>{},clients:{claim:()=>{}}},
    caches:{
      open:async name=>{if(!stores.has(name))stores.set(name,new FakeCache());return stores.get(name);},
      keys:async()=>[...stores.keys()],
      delete:async name=>stores.delete(name)
    },
    location:{origin:'https://site.example'},
    fetch:async()=>{if(!net.online)throw new TypeError('offline');return response();},
    URL,Promise,console,setTimeout
  };
  vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
  const request=path=>({url:ORIGIN+path,method:'GET',mode:'no-cors',headers:{has:()=>false}});
  async function get(path){
    let answered=null;
    listeners.fetch({request:request(path),respondWith:value=>{answered=value;}});
    assert.ok(answered,'le service worker doit répondre à '+path);
    const result=await answered;
    await new Promise(resolve=>setTimeout(resolve,0));
    return result;
  }
  const cachedUrls=()=>[...stores.values()].flatMap(cache=>[...cache.m.keys()]);
  return {get,net,cachedUrls};
}

const CODE=['app.js?v=1','base.css?v=1','home-feed.js?v=1'];

test('service worker: 620 images en cache n\'évincent ni les JS ni les CSS, l\'app démarre hors connexion',async()=>{
  const {get,net,cachedUrls}=loadWorker();
  for(const path of CODE)await get(path);
  for(let i=0;i<620;i++)await get('assets/spots/thumbs/s'+i+'.webp');
  await new Promise(resolve=>setTimeout(resolve,20));
  const urls=cachedUrls();
  for(const path of CODE)assert.ok(urls.includes(ORIGIN+path),path+' doit rester en cache');
  net.online=false;
  for(const path of CODE){
    const served=await get(path);
    assert.ok(served&&served.ok,path+' doit être servi hors connexion');
  }
});

test('service worker: le cache d\'images reste borné à 600 entrées',async()=>{
  const {get,cachedUrls}=loadWorker();
  for(let i=0;i<620;i++)await get('assets/spots/thumbs/s'+i+'.webp');
  await new Promise(resolve=>setTimeout(resolve,20));
  const images=cachedUrls().filter(url=>url.includes('/assets/spots/'));
  assert.ok(images.length<=600,'images en cache : '+images.length);
  assert.ok(images.includes(ORIGIN+'assets/spots/thumbs/s619.webp'),'la dernière image vue reste en cache');
});

test('service worker: une nouvelle version ?v= remplace l\'ancienne du même fichier',async()=>{
  const {get,cachedUrls}=loadWorker();
  await get('app.js?v=1');
  await get('base.css?v=1');
  await get('app.js?v=2');
  const urls=cachedUrls();
  assert.ok(urls.includes(ORIGIN+'app.js?v=2'));
  assert.ok(!urls.includes(ORIGIN+'app.js?v=1'),'l\'ancienne version de app.js est retirée');
  assert.ok(urls.includes(ORIGIN+'base.css?v=1'),'les autres fichiers ne sont pas touchés');
});
