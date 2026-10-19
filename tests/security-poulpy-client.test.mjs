/* Poulpy answers on the device: the chat never calls the network and never mentions an AI service. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function element(){return {textContent:'',innerHTML:'',disabled:false,hidden:true,value:'',maxLength:0,dataset:{},className:'',classList:{contains:()=>false,add(){},remove(){},toggle(){}},listeners:{},setAttribute(){},removeAttribute(){},before(){},after(){},append(){},prepend(){},replaceChildren(){},addEventListener(k,f){this.listeners[k]=f},querySelector:()=>null,querySelectorAll:()=>[],focus(){},remove(){}};}
function assistant(){
  const elements=new Map(),created=[],messages=[],network=[];
  const doc={body:{dataset:{screen:'home'}},querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>{const e=element();created.push(e);return e},addEventListener(){},dispatchEvent(){}};
  const blockedNetwork=name=>(...args)=>{network.push([name,...args]);throw Error('network call');};
  const context={document:doc,URL,setTimeout,clearTimeout,fetch:blockedNetwork('fetch'),XMLHttpRequest:blockedNetwork('xhr'),navigator:{sendBeacon:blockedNetwork('beacon')},chatSeeded:false,openChat(){},toast(){},currentSpot:null,SPOTS:[],addMsg:(...m)=>messages.push(m),esc:s=>s,poulpyReply:q=>({html:'Guide : '+q,btn:{label:'Voir le spot',onclick:'openSpotFromChat(\'bourget\')'}})};
  context.window=context;vm.createContext(context);
  for(const name of ['poulpy-config.js','poulpy-knowledge.js','poulpy-assistant.js'])vm.runInContext(read(name),context);
  return {context,messages,network,created};
}

test('every question is answered by the built-in guide without any network call',()=>{
  const a=assistant();a.context.openChat();
  a.context.chatSend('Quel spot pour débuter à Biarritz ?');
  a.context.chatSend('Comment observer les dauphins ?');
  assert.deepEqual(a.network,[]);
  const bot=a.messages.filter(m=>m[0]==='bot');
  assert.equal(a.messages.filter(m=>m[0]==='user').length,2);
  assert.ok(bot.some(m=>m[1]==='Guide : Quel spot pour débuter à Biarritz ?'&&m[2]?.label==='Voir le spot'),'les boutons de fiche du guide restent');
  assert.equal(bot.length,3);
});

test('no consent card, no service address and no AI wording in the chat code',()=>{
  const a=assistant();
  assert.ok(!a.created.some(e=>e.className==='ai-consent'));
  assert.equal(a.context.POULPY_CONFIG.endpoint,'');
  for(const name of ['poulpy-assistant.js','poulpy-config.js','poulpy-knowledge.js','privacy.js']){
    const code=read(name);
    assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|netlify\.app|openai/i,name);
    assert.doesNotMatch(code.replace(/\/\(qui es-tu[^/]*\//,''),/Poulpy IA|\bIA\b|intelligence artificielle/,name);
  }
});

test('the AI choice is gone from the settings and only the local erase remains',()=>{
  const added=[];const doc={querySelector:()=>({before:e=>added.push(e)}),createElement:()=>element()};
  vm.runInNewContext(read('privacy.js'),{document:doc,window:{},localStorage:{length:0},toast(){}});
  assert.deepEqual(added.map(e=>e.textContent),['Effacer toutes mes données sur cet appareil']);
});
