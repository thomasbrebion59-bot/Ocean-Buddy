/* Ocean Buddy — fonctionnement hors connexion.
   Pages : réseau d'abord (les mises à jour arrivent tout de suite), cache en secours.
   Fichiers versionnés (?v=…), images locales et polices : cache d'abord.
   Météo, marées, cartes et services en ligne : jamais mis en cache ici. */
const VERSION='ob-2026-09-24';
const STATIC=VERSION+'-static', PAGES=VERSION+'-pages';
const CORE=['./','index.html','manifest.webmanifest','assets/app/icon-192.png','assets/poulpy/scenes/travel-v2.webp'];
const CACHEABLE_HOSTS=['fonts.googleapis.com','fonts.gstatic.com','unpkg.com'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(PAGES).then(cache=>cache.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

async function trim(name,max){
  const cache=await caches.open(name);const keys=await cache.keys();
  for(let i=0;i<keys.length-max;i++)await cache.delete(keys[i]);
}
async function networkFirst(request){
  const cache=await caches.open(PAGES);
  try{
    const response=await fetch(request);
    if(response.ok)cache.put(request,response.clone());
    return response;
  }catch(error){
    return (await cache.match(request,{ignoreSearch:true}))||(await cache.match('index.html'))||Response.error();
  }
}
/* Images locales : réponse immédiate depuis le cache, rafraîchie en arrière-plan. */
async function staleWhileRevalidate(request){
  const cache=await caches.open(STATIC);
  const hit=await cache.match(request);
  const update=fetch(request).then(response=>{if(response.ok){cache.put(request,response.clone());trim(STATIC,600);}return response;}).catch(()=>hit);
  return hit||update;
}
async function cacheFirst(request){
  const cache=await caches.open(STATIC);
  const hit=await cache.match(request);
  if(hit)return hit;
  const response=await fetch(request);
  if(response.ok||response.type==='opaque'){cache.put(request,response.clone());trim(STATIC,600);}
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(request.mode==='navigate'&&url.origin===location.origin){event.respondWith(networkFirst(request));return;}
  if(url.origin===location.origin){
    if(/\.(?:js|css)$/.test(url.pathname)&&/(?:^|&)v=/.test(url.search.slice(1))){event.respondWith(cacheFirst(request));return;}
    if(/\.(?:js|css|webmanifest|json|html)$/.test(url.pathname)){event.respondWith(networkFirst(request));return;}
    if(/\.(?:webp|png|jpe?g|svg|gif|woff2?)$/.test(url.pathname)){event.respondWith(staleWhileRevalidate(request));return;}
    return;
  }
  if(CACHEABLE_HOSTS.includes(url.hostname))event.respondWith(cacheFirst(request));
});
