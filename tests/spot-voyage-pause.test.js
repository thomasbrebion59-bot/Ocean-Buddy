const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

/* Faux élément : querySelector renvoie toujours le même objet par sélecteur. */
function el(){
  const kids={},attrs={},listeners={};
  const o={
    hidden:false,innerHTML:'',className:'',dataset:{},style:{},attrs,listeners,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    querySelector(s){return kids[s]||(kids[s]=el());},
    querySelectorAll(){return[];},
    setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},
    addEventListener(t,fn){listeners[t]=fn;},
    getContext(){return {clearRect(){},beginPath(){},arc(){},fill(){}};},append(){},remove(){},focus(){},closest(){return null;},
    get isConnected(){return false;}
  };
  return o;
}

test('explorer-carte-spots-8 : le bouton pause est remis à jour à la réouverture',()=>{
  const body=el(),de=el();
  const sandbox={
    document:{body,documentElement:de,createElement:()=>el(),activeElement:null,addEventListener(){},getElementById:()=>null},
    matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    setTimeout:()=>0,clearTimeout(){},performance:{now:()=>0},console,
    Image:function(){return el();},innerWidth:400,innerHeight:800,devicePixelRatio:1,
    localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},removeEventListener(){}
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','spot-voyage.js'),'utf8'),sandbox,{filename:'spot-voyage.js'});
  const V=sandbox.OceanVoyage;
  let rootEl=null;body.append=r=>{rootEl=r;};
  V.open({name:'Spot A',loc:'Lieu'});
  const btn=rootEl.querySelector('[data-pause]');
  const space=()=>rootEl.listeners.keydown({key:' ',target:{closest:()=>null},preventDefault(){}});
  space();
  assert.equal(btn.attrs['aria-label'],'Reprendre');
  V.close();
  V.open({name:'Spot B',loc:'Lieu'});
  assert.equal(btn.attrs['aria-label'],'Mettre en pause');
  assert.match(btn.innerHTML,/./);
  space();
  assert.equal(btn.attrs['aria-label'],'Reprendre');
});
