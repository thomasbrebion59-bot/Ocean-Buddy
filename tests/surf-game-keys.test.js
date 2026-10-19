const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

/* Faux DOM permissif : tout accès renvoie un objet appelable. */
function fake(){
  const f=function(){};
  return new Proxy(f,{
    get(t,k){
      if(k===Symbol.toPrimitive)return()=>'';
      if(k==='then')return undefined;
      if(k==='dataset'||k==='style')return t[k]||(t[k]={});
      if(k==='classList')return {add(){},remove(){},toggle(){},contains(){return false;}};
      if(k==='querySelector'||k==='closest')return()=>fake();
      if(k==='querySelectorAll')return()=>[];
      if(k==='getBoundingClientRect')return()=>({left:0,top:0,width:400,height:800});
      if(k==='length')return 0;
      return t[k]!==undefined?t[k]:fake();
    },
    set(t,k,v){t[k]=v;return true;},
    apply(){return fake();},
    construct(){return fake();}
  });
}

function load(){
  const handlers={};
  const doc=fake();
  doc.addEventListener=(t,fn)=>{(handlers[t]=handlers[t]||[]).push(fn);};
  doc.removeEventListener=()=>{};
  doc.hidden=false;
  const sandbox={
    document:doc,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},
    matchMedia:()=>({matches:false}),__SURF_TEST__:true,getComputedStyle:()=>fake(),Image:function(){return fake();},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    setTimeout:()=>0,clearTimeout(){},CustomEvent:function(){},console,
    addEventListener(){},removeEventListener(){},innerWidth:400,innerHeight:800,devicePixelRatio:1
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  for(const f of ['surf-model.js','surf-game.js']){
    const p=path.join(__dirname,'..',f);
    vm.runInContext(fs.readFileSync(p,'utf8'),sandbox,{filename:f});
  }
  return {S:sandbox,handlers,doc};
}

test('jeu-poulpy-langues-3 : touche relâchée hors partie ne reste pas coincée',()=>{
  const {S,handlers}=load();
  assert.ok(S.OceanSurf,'OceanSurf exposé');
  S.SurfRender={create:()=>fake()};
  S.SurfInput={attach:()=>({reset(){},poll(){},destroy(){}})};
  S.OceanSurf.open();
  const key=(type,k)=>{for(const fn of handlers[type]||[])fn({type,key:k,preventDefault(){},stopPropagation(){},repeat:false});};
  assert.ok(handlers.keydown&&handlers.keyup,'écouteurs clavier posés');
  const hook=S.__surfTest;
  assert.ok(hook,'crochet de test __surfTest');
  hook.start();
  key('keydown','ArrowLeft');
  hook.finish();
  key('keyup','ArrowLeft');
  hook.start();
  hook.frame(16);
  assert.equal(hook.inp.mx,0);
  assert.equal(hook.keys.l,false);
});
