/* Audit (A-03) : une limite 429 au corps non JSON affiche bien le message de limite momentanée. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function storage(){const d=new Map();return {get length(){return d.size},key:i=>[...d.keys()][i]??null,getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
function element(){return {textContent:'',innerHTML:'',disabled:false,hidden:true,value:'',maxLength:0,dataset:{},classList:{contains:()=>false,add(){},remove(){},toggle(){}},listeners:{},setAttribute(){},removeAttribute(){},before(){},after(){},append(){},prepend(){},replaceChildren(){},addEventListener(k,f){this.listeners[k]=f},querySelector:()=>null,querySelectorAll:()=>[],focus(){},remove(){}};}
function assistant(response){
  const elements=new Map(),localStorage=storage(),messages=[];
  localStorage.setItem('oceanbuddy_ai_choice_v1','ai');
  const doc={body:{dataset:{screen:'home'}},querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>element(),addEventListener(){},dispatchEvent(){}};
  const context={document:doc,localStorage,URL,AbortSignal,AbortController,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},setTimeout,clearTimeout,POULPY_CONFIG:{endpoint:'https://api.example.test/poulpy'},chatHistory:[],chatSeeded:false,openChat(){},closeSettings(){},toast(){},currentSpot:null,SPOTS:[],activeSport:'surf',chosenLevel:'intermediaire',addMsg:(...m)=>messages.push(m),esc:s=>s,showTyping(){},hideTyping(){},poulpyReply:()=>({html:'Guide local'}),aiFormat:s=>s,fetch:async(url,options)=>options?.method==='POST'?response():{ok:true,status:200,json:async()=>({enabled:true})}};
  context.window=context;vm.createContext(context);
  vm.runInContext(readFileSync(new URL('../privacy.js',import.meta.url),'utf8'),context);
  vm.runInContext(readFileSync(new URL('../poulpy-assistant.js',import.meta.url),'utf8'),context);
  return {context,messages};
}
const LIMIT=/limite momentanée/;
test('Poulpy client: HTML 429 shows the temporary-limit message',async()=>{
  const a=assistant(()=>({ok:false,status:429,json:async()=>{throw new SyntaxError('Unexpected token <')}}));
  await a.context.chatSend('Quelle marée à Biarritz ?');
  assert.match(a.messages.filter(m=>m[0]==='bot').at(-1)[1],LIMIT);
});
test('Poulpy client: JSON 429 still shows the temporary-limit message, a 502 does not',async()=>{
  const a=assistant(()=>({ok:false,status:429,json:async()=>({error:'rate_limited'})}));
  await a.context.chatSend('Quelle marée ?');
  assert.match(a.messages.filter(m=>m[0]==='bot').at(-1)[1],LIMIT);
  const b=assistant(()=>({ok:false,status:502,json:async()=>{throw new SyntaxError('html')}}));
  await b.context.chatSend('Quelle marée ?');
  assert.doesNotMatch(b.messages.filter(m=>m[0]==='bot').at(-1)[1],LIMIT);
});
