import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function storage(){return new class {data=new Map();get length(){return this.data.size}key(i){return [...this.data.keys()][i]??null}getItem(k){return this.data.get(k)??null}setItem(k,v){this.data.set(String(k),String(v))}removeItem(k){this.data.delete(k)}};}

async function native(seed={},saved={},options={}){
 const localStorage=storage();for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);
 const writes=[];let fail=false,reloads=0;const context={localStorage,Storage:localStorage.constructor,URL,Promise,JSON,Date,setTimeout:options.setTimeout||setTimeout,clearTimeout,location:{reload(){reloads++}},history:{state:null},document:{documentElement:{classList:{add(){}}},querySelector:()=>null,addEventListener(){}},Capacitor:{isNativePlatform:()=>true,...(options.plugins?{isPluginAvailable:name=>options.plugins.includes(name)}:{})},registerPlugin:options.registerPlugin||(()=>{throw Error('registerPlugin inattendu')}),App:{addListener(){}},Browser:{open(){}},Geolocation:{},Share:{},Filesystem:{},Directory:{},Encoding:{},StatusBar:{setStyle:async()=>{}},Style:{Light:'LIGHT'},__OB_BUNDLE__:{seq:100},__OB_UPDATE_BASE__:'https://updates.test/',CapacitorHttp:options.http||{get:async()=>({status:404,data:''})},CapacitorUpdater:options.updater||{notifyAppReady:async()=>({})},Preferences:{get:options.get|| (async()=>({value:JSON.stringify(saved)})),set:async({value})=>{if(fail)throw Error('disk unavailable');writes.push(JSON.parse(value))}}};context.window=context;
 const source=readFileSync(new URL('../mobile/client.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.createContext(context);vm.runInContext(source,context);await context.OceanMobile.boot();return {context,writes,setFailure:v=>fail=v,getReloads:()=>reloads};
}
test('native backup restores only app keys, keeps current data, and persists removals',async()=>{
 const a=await native({oceanbuddy_profile:'new',unrelated:'keep'},{oceanbuddy_profile:'old',oceanbuddy_trips_v1:'saved',outside:'ignore'});
 assert.equal(a.context.localStorage.getItem('oceanbuddy_profile'),'new');assert.equal(a.context.localStorage.getItem('oceanbuddy_trips_v1'),'saved');assert.equal(a.context.localStorage.getItem('outside'),null);
 a.context.localStorage.removeItem('oceanbuddy_profile');a.context.localStorage.removeItem('oceanbuddy_trips_v1');await a.context.OceanMobile.persist();assert.deepEqual(a.writes.at(-1),{});assert.equal(a.context.localStorage.getItem('unrelated'),'keep');
});
test('failed native backup can retry the same data instead of silently skipping it',async()=>{
 const a=await native();a.setFailure(true);a.context.localStorage.setItem('oceanbuddy_profile','retry');await assert.rejects(a.context.OceanMobile.persist());a.setFailure(false);await a.context.OceanMobile.persist();assert.deepEqual(a.writes.at(-1),{oceanbuddy_profile:'retry'});
});
test('a stalled native backup cannot block launch or overwrite unsaved local data',async()=>{
 let finishGet;
 const a=await native({}, {}, {get:()=>new Promise(resolve=>{finishGet=resolve}),setTimeout:callback=>setTimeout(callback,0)});
 a.context.localStorage.setItem('oceanbuddy_profile','new');
 await a.context.OceanMobile.persist();assert.equal(a.writes.length,0);
 finishGet({value:JSON.stringify({oceanbuddy_profile:'old',oceanbuddy_trips_v1:'restored'})});
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(a.context.localStorage.getItem('oceanbuddy_profile'),'new');
 assert.equal(a.context.localStorage.getItem('oceanbuddy_trips_v1'),'restored');
 assert.deepEqual(a.writes.at(-1),{oceanbuddy_profile:'new',oceanbuddy_trips_v1:'restored'});
 assert.equal(a.getReloads(),1);
});

test('live update downloads only for compatible apps, verifies files by hash and installs on background',async()=>{
 const seen=[],calls=[];
 const json={'https://updates.test/latest.json':{seq:200,native_min:'1.2.0',manifest:'manifests/200.json'},'https://updates.test/manifests/200.json':{files:[['index.html','aa'],['app.js','bb']]}};
 const http={get:async({url})=>{const u=url.split(/[?&]t=/)[0];seen.push(u);return json[u]?{status:200,data:json[u]}:{status:404,data:''};}};
 const updater={notifyAppReady:async()=>({}),list:async()=>({bundles:[]}),download:async o=>{calls.push(['download',o]);return {id:'b1',version:o.version,status:'pending'}},next:async o=>calls.push(['next',o.id]),set:async o=>calls.push(['set',o.id])};
 const make=version=>native({},{},{http,updater}).then(n=>{n.context.App.getInfo=async()=>({version});return n;});
 const old=await make('1.1.0');assert.equal((await old.context.OceanMobile.updates.checkLive()).kind,'store');assert.equal(calls.length,0);
 const n=await make('1.2.0');const r=await n.context.OceanMobile.updates.checkLive();
 assert.equal(r.kind,'live');const dl=calls.find(c=>c[0]==='download')[1];
 assert.equal(dl.version,'200');assert.deepEqual(JSON.parse(JSON.stringify(dl.manifest)),[{file_name:'index.html',file_hash:'aa',download_url:'https://updates.test/files/aa'},{file_name:'app.js',file_hash:'bb',download_url:'https://updates.test/files/bb'}]);
 assert.deepEqual(calls.find(c=>c[0]==='next'),['next','b1']);
 await n.context.OceanMobile.updates.applyLive();assert.deepEqual(calls.at(-1),['set','b1']);
 json['https://updates.test/latest.json']={seq:90,native_min:'1.2.0',manifest:'x'};const same=await make('1.2.0');assert.equal(await same.context.OceanMobile.updates.checkLive(),null);
});

/* Compte (1.5.0) : jetons dans le Trousseau (plugin OceanAccount), jamais rendus à la page ni écrits ailleurs. */
function keychain(){const k={store:null,calls:[],getTokens:async()=>{k.calls.push('get');return k.store?{...k.store}:{};},setTokens:async t=>{k.calls.push('set');k.store={...t};},clearTokens:async()=>{k.calls.push('clear');k.store=null;}};return k;}
function accountHttp(routes){const seen=[];return {seen,request:async o=>{seen.push(JSON.parse(JSON.stringify(o)));const f=routes[o.method+' '+o.url.replace('https://oceanbuddy.app/api/v1','')];if(!f)return {status:404,data:{error:'not_found'}};return f(o);}};}
test('apps 1.4.x (sans plugin OceanAccount) : aucune capacité de compte, aucune API exposée',async()=>{
 const a=await native({},{},{plugins:[]});
 assert.equal(a.context.OceanMobile.capabilities.account,false);assert.equal(a.context.OceanMobile.account,undefined);
 const b=await native();assert.equal(b.context.OceanMobile.capabilities.account,false,'ancien pont sans isPluginAvailable');
});
test('compte natif : connexion par code, jetons au Trousseau seulement, Bearer ensuite, aucune trace dans localStorage ni les Préférences',async()=>{
 const kc=keychain(),T={access_token:'eyJ.acces.1',refresh_token:'rt-secret-1',expires_in:3600};
 const http=accountHttp({'POST /auth/otp/request':()=>({status:202,data:{ok:true}}),'POST /auth/otp/verify':()=>({status:200,data:T}),
   'GET /me':o=>o.headers.Authorization==='Bearer eyJ.acces.1'?{status:200,data:{user:{email:'a@example.com'}}}:{status:401,data:{error:'unauthenticated'}},
   'POST /auth/logout':()=>({status:200,data:{ok:true}})});
 const a=await native({oceanbuddy_v1:'{}'},{},{plugins:['OceanAccount'],registerPlugin:n=>{assert.equal(n,'OceanAccount');return kc;},http:{...http,get:async()=>({status:404,data:''})}});
 const M=a.context.OceanMobile;assert.equal(M.capabilities.account,true);
 assert.deepEqual(JSON.parse(JSON.stringify(await M.account.request('/auth/otp/request',{method:'POST',body:{email:'a@example.com'}}))),{ok:true});
 const login=await M.account.request('/auth/otp/verify',{method:'POST',body:{email:'a@example.com',code:'123456'}});
 assert.deepEqual(JSON.parse(JSON.stringify(login)),{ok:true},'la page ne reçoit jamais les jetons');
 assert.deepEqual(kc.store,{access:'eyJ.acces.1',refresh:'rt-secret-1'});
 const verify=http.seen.find(r=>r.url.endsWith('/auth/otp/verify'));
 assert.equal(verify.url,'https://oceanbuddy.app/api/v1/auth/otp/verify');assert.equal(verify.data.client,'native');
 for(const r of http.seen){const h=Object.keys(r.headers).map(x=>x.toLowerCase());for(const bad of ['origin','cookie','x-ob-csrf'])assert.ok(!h.includes(bad),bad);}
 assert.equal(http.seen[0].headers.Authorization,undefined,'pas de Bearer pour demander un code');
 assert.equal((await M.account.request('/me')).user.email,'a@example.com');
 a.context.localStorage.setItem('oceanbuddy_sync_v1','{"linked":true}');await M.persist();
 const dump=JSON.stringify([...a.context.localStorage.data.entries()])+JSON.stringify(a.writes);
 for(const secret of ['eyJ.acces.1','rt-secret-1'])assert.ok(!dump.includes(secret),secret);
 await M.account.request('/auth/logout',{method:'POST',body:{}});assert.equal(kc.store,null);
 await assert.rejects(M.account.request('/sync/../../admin'),e=>e.code==='not_found');
});
test('compte natif : rafraîchissement avec le jeton du Trousseau, oubli si refusé, déconnexion même hors ligne, suppression',async()=>{
 const kc=keychain();kc.store={access:'old-access',refresh:'rt-1'};let refreshOk=true,offline=false;
 const http=accountHttp({'POST /auth/refresh':o=>refreshOk?{status:200,data:{access_token:'new-access',refresh_token:'rt-2',expires_in:3600}}:{status:401,data:{error:'invalid_refresh'}},
   'DELETE /account':o=>({status:200,data:{deleted:true,identity:'done'}}),'GET /me':()=>({status:401,data:{error:'token_expired'}})});
 const req=http.request;http.request=async o=>{if(offline)throw Error('offline');return req(o);};
 const a=await native({oceanbuddy_v1:'{}'},{},{plugins:['OceanAccount'],registerPlugin:()=>kc,http:{...http,get:async()=>({status:404,data:''})}});
 const M=a.context.OceanMobile;
 await assert.rejects(M.account.request('/me'),e=>e.code==='token_expired'&&e.status===401);
 await M.account.request('/auth/refresh',{method:'POST',body:{}});
 const r=http.seen.find(x=>x.url.endsWith('/auth/refresh'));assert.deepEqual(JSON.parse(JSON.stringify(r.data)),{client:'native',refresh_token:'rt-1'});assert.equal(r.headers.Authorization,undefined);
 assert.deepEqual(kc.store,{access:'new-access',refresh:'rt-2'});
 refreshOk=false;await assert.rejects(M.account.request('/auth/refresh',{method:'POST',body:{}}),e=>e.status===401);assert.equal(kc.store,null);
 await assert.rejects(M.account.request('/auth/refresh',{method:'POST',body:{}}),e=>e.code==='unauthenticated','sans jeton : aucun appel réseau');
 kc.store={access:'x',refresh:'y'};const b=await native({oceanbuddy_v1:'{}'},{},{plugins:['OceanAccount'],registerPlugin:()=>kc,http:{...http,get:async()=>({status:404,data:''})}});
 offline=true;await assert.rejects(b.context.OceanMobile.account.request('/auth/logout',{method:'POST',body:{}}),e=>e.code==='network');assert.equal(kc.store,null,'déconnexion locale même sans réseau');
 offline=false;kc.store={access:'x',refresh:'y'};const c=await native({oceanbuddy_v1:'{}'},{},{plugins:['OceanAccount'],registerPlugin:()=>kc,http:{...http,get:async()=>({status:404,data:''})}});
 assert.equal((await c.context.OceanMobile.account.request('/account',{method:'DELETE'})).deleted,true);assert.equal(kc.store,null);
 const del=http.seen.filter(x=>x.url.endsWith('/account')).at(-1);assert.equal(del.headers.Authorization,'Bearer x');
});
