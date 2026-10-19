/* Ocean Buddy — fonctionnement hors connexion.
   Pages : réseau d'abord (les mises à jour arrivent tout de suite), cache en secours.
   Fichiers versionnés (?v=…), images locales et polices : cache d'abord.
   Le code (JS/CSS) et les images vivent dans deux caches séparés : seul celui des images
   est borné, pour qu'une longue visite d'Explorer n'évince jamais app.js ni base.css.
   Météo, marées, cartes et services en ligne : jamais mis en cache ici. */
const VERSION='ob-2026-10-19-2';
const STATIC=VERSION+'-static', PAGES=VERSION+'-pages', IMAGES=VERSION+'-img';
const CORE=['./','index.html','manifest.webmanifest','assets/app/icon-192.png','assets/app/splash-logo.webp','assets/poulpy/scenes/travel-v2.webp'];
const SURF=['assets/surf/surfeur.webp?v=16','assets/surf/surfeuse.webp?v=16'];
const CACHEABLE_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(PAGES).then(cache=>cache.addAll(CORE)).catch(()=>{}).then(()=>caches.open(IMAGES)).then(cache=>Promise.all(SURF.map(u=>cache.add(u).catch(()=>{})))).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

/* Jamais en cache : une réponse privée ou marquée no-store, ni une requête authentifiée. */
const storable=(request,response)=>!request.headers.has('authorization')&&!/(?:^|,)\s*(?:no-store|private)\b/i.test(response.headers.get('cache-control')||'');
async function trim(name,max){
  const cache=await caches.open(name);const keys=await cache.keys();
  const del=keys.filter(k=>!k.url.includes('/assets/surf/'));
  for(let i=0;i<del.length-max;i++)await cache.delete(del[i]);
}
/* Une nouvelle version ?v= d'un fichier de l'app remplace l'ancienne, ce qui borne le cache du code sans jamais l'évincer. */
async function dropOldVersions(cache,request){
  const url=new URL(request.url);
  if(url.origin!==location.origin||!/(?:^|&)v=/.test(url.search.slice(1)))return;
  for(const key of await cache.keys()){
    const old=new URL(key.url);
    if(old.origin===url.origin&&old.pathname===url.pathname&&old.href!==url.href)await cache.delete(key);
  }
}
async function networkFirst(request){
  const cache=await caches.open(PAGES);
  try{
    const response=await fetch(request);
    if(response.ok&&storable(request,response))cache.put(request,response.clone());
    return response;
  }catch(error){
    return (await cache.match(request,{ignoreSearch:true}))||(await cache.match('index.html'))||Response.error();
  }
}
/* Images locales (cache IMAGES, borné) et moteur de carte (cache STATIC) : réponse immédiate depuis le cache, rafraîchie en arrière-plan. */
async function staleWhileRevalidate(request,name=IMAGES){
  const cache=await caches.open(name);
  const hit=await cache.match(request);
  const update=fetch(request).then(response=>{if(response.ok&&storable(request,response)){cache.put(request,response.clone());if(name===IMAGES)trim(IMAGES,600);}return response;}).catch(()=>hit);
  return hit||update;
}
async function cacheFirst(request){
  const cache=await caches.open(STATIC);
  const hit=await cache.match(request);
  if(hit)return hit;
  const response=await fetch(request);
  if((response.ok&&storable(request,response))||response.type==='opaque'){cache.put(request,response.clone()).then(()=>dropOldVersions(cache,request)).catch(()=>{});}
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('authorization'))return;
  const url=new URL(request.url);
  if(request.mode==='navigate'&&url.origin===location.origin){event.respondWith(networkFirst(request));return;}
  if(url.origin===location.origin){
    /* Moteur de carte local (non versionné) : réponse immédiate, rafraîchie en arrière-plan. */
    if(url.pathname.includes('/vendor/')){event.respondWith(staleWhileRevalidate(request,STATIC));return;}
    if(/\.(?:js|css)$/.test(url.pathname)&&/(?:^|&)v=/.test(url.search.slice(1))){event.respondWith(cacheFirst(request));return;}
    if(/\.(?:js|css|webmanifest|json|html)$/.test(url.pathname)){event.respondWith(networkFirst(request));return;}
    if(/\.(?:webp|png|jpe?g|svg|gif|woff2?)$/.test(url.pathname)){event.respondWith(staleWhileRevalidate(request));return;}
    return;
  }
  if(CACHEABLE_HOSTS.includes(url.hostname))event.respondWith(cacheFirst(request));
});
