import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function storage(){return new class {data=new Map();get length(){return this.data.size}key(i){return [...this.data.keys()][i]??null}getItem(k){return this.data.get(k)??null}setItem(k,v){this.data.set(String(k),String(v))}removeItem(k){this.data.delete(k)}};}
function element(){return {textContent:'',innerHTML:'',disabled:false,hidden:true,value:'',maxLength:0,dataset:{},classList:{contains:()=>false,add(){}},listeners:{},setAttribute(){},before(){},after(){},append(){},replaceChildren(){},focus(){},addEventListener(k,f){this.listeners[k]=f},querySelector(){return element()}};}
function assistant(mode=null){
 const elements=new Map(),created=[],events={},localStorage=storage(),calls=[];let resolveChoice;
 if(mode)localStorage.setItem('oceanbuddy_ai_choice_v1',mode);
 const doc={body:{dataset:{screen:'home'}},querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>{const e=element();created.push(e);return e},addEventListener:(k,f)=>events[k]=f,dispatchEvent:e=>events[e.type]?.(e)};
 const messages=[];const context={document:doc,localStorage,URL,AbortSignal,AbortController,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},setTimeout,clearTimeout,POULPY_CONFIG:{endpoint:'https://api.example.test/poulpy'},chatHistory:[],chatSeeded:false,openChat(){},closeSettings(){},toast(){},currentSpot:null,SPOTS:[],activeSport:'surf',chosenLevel:'intermediaire',addMsg:(...m)=>messages.push(m),esc:s=>s,showTyping(){},hideTyping(){},poulpyReply:()=>({html:'Guide local'}),aiFormat:s=>s,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({enabled:true,reply:'Réponse IA',spots:[]})}}};context.window=context;vm.createContext(context);
 vm.runInContext(readFileSync(new URL('../privacy.js',import.meta.url),'utf8'),context);
 vm.runInContext(readFileSync(new URL('../poulpy-assistant.js',import.meta.url),'utf8'),context);
 const panel=created.find(e=>e.className==='ai-consent');
 return {context,calls,messages,elements,choose:choice=>panel.listeners.click({target:{closest:()=>({dataset:{aiChoice:choice}})}})};
}
test('Poulpy sends nothing before a choice or after the local guide is selected',async()=>{
 const a=assistant();a.context.openChat();const reply=a.context.chatSend('Comment choisir un spot ?');await Promise.resolve();assert.equal(a.calls.length,0);assert.equal(a.messages.some(m=>m[0]==='user'),false);
 a.choose('local');await reply;assert.equal(a.calls.length,0);assert.equal(a.context.OceanPrivacy.getMode(),'local');assert.ok(a.messages.some(m=>m[1]==='Guide local'));
 await a.context.chatSend('Et pour le surf ?');assert.equal(a.calls.length,0);
});
test('AI opt-in unlocks only the intended question and bounded context, and duplicate sends wait',async()=>{
 const a=assistant();const reply=a.context.chatSend('Une idée de voyage ?');await a.context.chatSend('doublon');assert.equal(a.calls.length,0);a.choose('ai');await reply;
 const posts=a.calls.filter(c=>c.options?.method==='POST');assert.equal(posts.length,1);const body=JSON.parse(posts[0].options.body);assert.equal(body.message,'Une idée de voyage ?');assert.deepEqual(Object.keys(body).sort(),['activity','conditions','history','level','message','spotId']);assert.equal(body.conditions,null);assert.equal(a.context.OceanPrivacy.getMode(),'ai');
});
test('saved local choice survives relaunch without any AI request',async()=>{const a=assistant('local');a.context.openChat();await a.context.chatSend('Bonjour');assert.equal(a.calls.length,0)});

async function native(seed={},saved={}){
 const localStorage=storage();for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);
 const writes=[];let fail=false;const context={localStorage,Storage:localStorage.constructor,URL,Promise,JSON,Date,history:{state:null},document:{documentElement:{classList:{add(){}}},querySelector:()=>null,addEventListener(){}},Capacitor:{isNativePlatform:()=>true},App:{addListener(){}},Browser:{open(){}},Geolocation:{},Share:{},Filesystem:{},Directory:{},Encoding:{},StatusBar:{setStyle:async()=>{}},Style:{Light:'LIGHT'},Preferences:{get:async()=>({value:JSON.stringify(saved)}),set:async({value})=>{if(fail)throw Error('disk unavailable');writes.push(JSON.parse(value))}}};context.window=context;
 const source=readFileSync(new URL('../mobile/client.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.createContext(context);vm.runInContext(source,context);await context.OceanMobile.boot();return {context,writes,setFailure:v=>fail=v};
}
test('native backup restores only app keys, keeps current data, and persists removals',async()=>{
 const a=await native({oceanbuddy_profile:'new',unrelated:'keep'},{oceanbuddy_profile:'old',oceanbuddy_trips_v1:'saved',outside:'ignore'});
 assert.equal(a.context.localStorage.getItem('oceanbuddy_profile'),'new');assert.equal(a.context.localStorage.getItem('oceanbuddy_trips_v1'),'saved');assert.equal(a.context.localStorage.getItem('outside'),null);
 a.context.localStorage.removeItem('oceanbuddy_profile');a.context.localStorage.removeItem('oceanbuddy_trips_v1');await a.context.OceanMobile.persist();assert.deepEqual(a.writes.at(-1),{});assert.equal(a.context.localStorage.getItem('unrelated'),'keep');
});
test('failed native backup can retry the same data instead of silently skipping it',async()=>{
 const a=await native();a.setFailure(true);a.context.localStorage.setItem('oceanbuddy_profile','retry');await assert.rejects(a.context.OceanMobile.persist());a.setFailure(false);await a.context.OceanMobile.persist();assert.deepEqual(a.writes.at(-1),{oceanbuddy_profile:'retry'});
});
