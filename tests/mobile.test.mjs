import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function storage(){return new class {data=new Map();get length(){return this.data.size}key(i){return [...this.data.keys()][i]??null}getItem(k){return this.data.get(k)??null}setItem(k,v){this.data.set(String(k),String(v))}removeItem(k){this.data.delete(k)}};}

async function native(seed={},saved={},options={}){
 const localStorage=storage();for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);
 const writes=[];let fail=false,reloads=0;const context={localStorage,Storage:localStorage.constructor,URL,Promise,JSON,Date,setTimeout:options.setTimeout||setTimeout,clearTimeout,location:{reload(){reloads++}},history:{state:null},document:{documentElement:{classList:{add(){}}},querySelector:()=>null,addEventListener(){}},Capacitor:{isNativePlatform:()=>true},App:{addListener(){}},Browser:{open(){}},Geolocation:{},Share:{},Filesystem:{},Directory:{},Encoding:{},StatusBar:{setStyle:async()=>{}},Style:{Light:'LIGHT'},__OB_BUNDLE__:{seq:100},__OB_UPDATE_BASE__:'https://updates.test/',CapacitorHttp:options.http||{get:async()=>({status:404,data:''})},CapacitorUpdater:options.updater||{notifyAppReady:async()=>({})},Preferences:{get:options.get|| (async()=>({value:JSON.stringify(saved)})),set:async({value})=>{if(fail)throw Error('disk unavailable');writes.push(JSON.parse(value))}}};context.window=context;
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
