const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../activity-transition.js'),'utf8');

/* Horloge contrôlée : vérifie les images réellement attendues, même si la préparation dépasse la scène. */
function transitionEnv({calm=false,hang=false,noAnimate=false}={}){
  let now=0,next=0,frames=0;
  const timers=new Map(),overlays=[],animations=[],events=[],errors=[];
  const timeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;};
  class Element{
    constructor(){this.style={};this.dataset={};this.children={};this.listeners={};}
    setAttribute(){}
    querySelector(s){return this.children[s]??=new Element();}
    addEventListener(type,fn){this.listeners[type]=fn;}
    remove(){const i=overlays.indexOf(this);if(i>=0)overlays.splice(i,1);}
    animate(keyframes,options){
      if(noAnimate)throw Error('Pas de Web Animations');
      let resolve,reject;
      const finished=new Promise((a,b)=>{resolve=a;reject=b;});
      const id=hang?null:timeout(resolve,options.duration+(options.delay||0));
      const a={keyframes,options,finished,cancel(){timers.delete(id);reject(Error('Annulée'));}};
      animations.push(a);return a;
    }
  }
  const context={console:{error:e=>errors.push(e.message)},setTimeout:timeout,clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>timeout(()=>{frames++;fn(now);},16),
    Image:class{constructor(){this.complete=true;}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
    document:{body:{classList:{contains:()=>calm},append:el=>overlays.push(el)},createElement:()=>new Element(),getElementById:()=>null,dispatchEvent:e=>events.push({type:e.type,detail:e.detail,frames})},
    matchMedia:()=>({matches:false}),navigator:{},window:{},SPORTMAP:{surf:{label:'Surf'},paddle:{label:'Paddle'}},SPOTS:[]};
  vm.runInNewContext(source,context);
  const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
  async function tick(ms){
    const end=now+ms;await flush();
    for(;;){const item=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!item)break;
      now=item[1].at;timers.delete(item[0]);item[1].fn();await flush();}
    now=end;await flush();
  }
  return {api:context.window.OceanTransition,overlays,animations,events,errors,tick,get frames(){return frames;},
    touch(){overlays[0].listeners.pointerdown({preventDefault(){},stopPropagation(){}});}};
}

test('la scène attend la préparation asynchrone puis deux images avant de dévoiler l’écran',async()=>{
  const e=transitionEnv();let resolve,covered=false;
  const pending=e.api.play('surf',()=>{covered=e.api.covered;return new Promise(r=>{resolve=r;});});
  await e.tick(1000);assert.equal(covered,true);assert.equal(e.overlays.length,1);
  assert.equal(e.animations.filter(a=>a.keyframes.at(-1).opacity===0).length,0);
  resolve();await e.tick(16);assert.equal(e.overlays.length,1);
  assert.equal(e.animations.filter(a=>a.keyframes.at(-1).opacity===0).length,0);
  await e.tick(16);assert.equal(e.animations.filter(a=>a.keyframes.at(-1).opacity===0).length,1);
  const ready=e.events.find(x=>x.type==='ocean:transition-ready');assert.equal(e.frames-ready.frames,2);
  await e.tick(300);await pending;assert.equal(e.overlays.length,0);assert.equal(e.api.covered,false);
});

for(const at of [0,450,1000])test(`un toucher à ${at} ms attend le rendu sous un voile opaque`,async()=>{
  const e=transitionEnv();let resolve,calls=0;
  const pending=e.api.play('surf',()=>{calls++;return new Promise(r=>{resolve=r;});});
  await e.tick(at);e.touch();await e.tick(1);
  assert.equal(e.overlays.length,1);assert.equal(e.overlays[0].style.opacity,'1');
  assert.equal(e.overlays[0].querySelector('.act-tr-photo').style.transform,'none');
  assert.equal(calls,1);resolve();await e.tick(400);await pending;assert.equal(e.overlays.length,0);assert.equal(calls,1);
});

test('le garde-fou abrège les animations sans retirer la scène avant la fin du rendu',async()=>{
  const e=transitionEnv({hang:true});let resolve;
  const pending=e.api.play('surf',()=>new Promise(r=>{resolve=r;}));
  await e.tick(2000);assert.equal(e.overlays.length,1);resolve();
  await e.tick(400);await pending;assert.equal(e.overlays.length,0);
});

test('la dernière sélection annule les rendus différés de la précédente',async()=>{
  const e=transitionEnv();let obsolete,resolve;const calls=[];
  const first=e.api.play('surf',ctx=>{obsolete=ctx;return new Promise(r=>{resolve=r;});});
  await e.tick(450);
  const second=e.api.play('paddle',ctx=>{assert.equal(ctx.isCurrent(),true);calls.push('paddle');});
  assert.equal(obsolete.isCurrent(),false);resolve();await e.tick(1600);await Promise.all([first,second]);
  assert.deepEqual(calls,['paddle']);assert.equal(e.overlays.length,0);
});

test('une sélection remplacée avant la montée ne change pas l’activité',async()=>{
  const e=transitionEnv(),calls=[];const a=e.api.play('surf',()=>calls.push('surf'));await e.tick(100);
  const b=e.api.play('paddle',()=>calls.push('paddle'));await e.tick(1600);await Promise.all([a,b]);
  assert.deepEqual(calls,['paddle']);
});

test('le mouvement réduit conserve uniquement des fondus et attend deux images',async()=>{
  const e=transitionEnv({calm:true});let covered=false;
  const pending=e.api.play('surf',()=>{covered=e.api.covered;});await e.tick(1000);await pending;
  assert.equal(covered,true);assert.equal(e.frames,2);
  assert.ok(e.animations.every(a=>a.keyframes.every(f=>Object.keys(f).every(k=>k==='opacity'))));
  assert.equal(e.overlays.length,0);
});

test('sans Web Animations, les styles finaux couvrent le changement et le nettoyage se termine',async()=>{
  const e=transitionEnv({noAnimate:true});let opacity;
  const pending=e.api.play('surf',()=>{opacity=e.overlays[0].style.opacity;});await e.tick(1000);await pending;
  assert.equal(opacity,'1');assert.equal(e.frames,2);assert.equal(e.overlays.length,0);
});

test('annulation et retour à toutes les activités invalident les préparations en attente',async()=>{
  for(const neutral of [false,true]){
    const e=transitionEnv();let ctx,resolve,calls=0;
    const pending=e.api.play('surf',c=>{ctx=c;return new Promise(r=>{resolve=r;});});await e.tick(450);
    if(neutral)e.api.neutral(()=>calls++);else e.api.cancel();
    assert.equal(ctx.isCurrent(),false);assert.equal(e.api.covered,false);assert.equal(e.overlays.length,0);
    resolve();await e.tick(1600);await pending;assert.equal(calls,Number(neutral));
    assert.equal(e.events.filter(x=>x.type==='ocean:transition-ready').length,0);
  }
});

/* Navigation réelle de app.js, isolée avec des éléments DOM minimaux. */
function navigationEnv(){
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const section=app.slice(app.indexOf('function resetScreenLive('),app.indexOf('function countUp('));
  const elements={};let covered=false,timeout=null;const frames=[];
  const make=(id,classes=[])=>{const set=new Set(classes);return {id,style:{},classList:{add:(...c)=>c.forEach(x=>set.add(x)),remove:(...c)=>c.forEach(x=>set.delete(x)),contains:c=>set.has(c)},contains:()=>false,focus(){},get active(){return set.has('active');}};};
  for(const id of ['home','spots','profile'])elements[id]=make(id,id==='home'?['active']:[]);
  const wrap=make('screenWrap');wrap.clientHeight=600;wrap.querySelectorAll=()=>Object.values(elements).filter(x=>x.active);elements.screenWrap=wrap;
  const context={window:{OceanTransition:{get covered(){return covered;}},dispatchEvent(){}},document:{body:{dataset:{},classList:{contains:()=>false}},getElementById:id=>elements[id],querySelector:()=>elements.home,querySelectorAll:()=>[]},CustomEvent:class{},setTimeout:fn=>{timeout=fn;return 1;},clearTimeout:()=>{timeout=null;},requestAnimationFrame:fn=>frames.push(fn),HEADBUB:{},SCREEN_ORDER:{home:0,spots:1,profile:2},vibrate(){},bubbles(){},animateCounts(){},renderProfile(){}};
  vm.runInNewContext(section+';this.navigate=go;',context);
  return {elements,wrap,go:context.navigate,cover:()=>{covered=true;},drain(){while(frames.length)frames.shift()();timeout?.();}};
}

test('sous la scène, go ne laisse que la cible active et neutralise les styles du fondu précédent',()=>{
  const e=navigationEnv();e.go('profile');e.cover();e.elements.spots.style.visibility='hidden';e.go('spots');e.drain();
  assert.deepEqual(Object.values(e.elements).filter(x=>x.active).map(x=>x.id),['spots']);
  assert.equal(e.wrap.classList.contains('transitioning'),false);assert.equal(e.wrap.style.minHeight,'');
  assert.equal(e.elements.spots.classList.contains('sw-done'),true);assert.equal(e.elements.spots.classList.contains('sw-covered'),true);
  assert.equal(e.elements.spots.style.opacity,'');assert.equal(e.elements.spots.style.transition,'');assert.equal(e.elements.spots.style.visibility,'');
});

test('le changement d’activité sur Explorer déjà actif reste instantané',()=>{
  const e=navigationEnv();e.cover();e.go('spots');e.go('spots');e.drain();
  assert.equal(e.elements.home.active,false);assert.equal(e.elements.spots.active,true);
  assert.equal(e.elements.spots.classList.contains('sw-live'),false);assert.equal(e.elements.spots.style.transform,'');
});

test('la navigation ordinaire conserve le fondu entre onglets',()=>{
  const e=navigationEnv();e.go('profile');assert.equal(e.elements.home.active,true);assert.equal(e.wrap.classList.contains('transitioning'),true);
  e.drain();assert.equal(e.elements.home.active,false);assert.equal(e.elements.profile.active,true);
  assert.equal(e.elements.profile.classList.contains('sw-covered'),false);
});

test('applySport préserve les favoris et répartit le rendu sans changer la remise à zéro des filtres',async()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const section=app.slice(app.indexOf('function applySport('),app.indexOf('/* ====== GÉOLOCALISATION'));
  const calls=[],favs=new Set(['hossegor']);let next,valid=true;
  const input={value:'ancien'},chip={classList:{remove(){}}};
  const context={window:{OceanNavigation:{begin:()=>calls.push('begin')},OceanTheme:{set:id=>calls.push('theme:'+id)}},
    SPORTMAP:{surf:{},paddle:{}},activeSport:'paddle',chosenSport:'paddle',currentFilter:'expert',currentSearch:'ancien',favOnly:true,nearMode:true,favs,
    document:{getElementById:id=>id==='spotSearch'?input:chip,querySelectorAll:()=>[]},
    renderSportFilters:()=>calls.push('filters'),backToWorlds:()=>calls.push('worlds'),saveState:()=>calls.push('save'),go:s=>calls.push('go:'+s),
    renderSpots:()=>calls.push('spots'),renderHome(){},setTimeout:()=>calls.push('home-later')};
  vm.runInNewContext(section+';this.apply=applySport;',context);
  const pending=context.apply('surf',{nextFrame:()=>new Promise(r=>{next=r;}),isCurrent:()=>valid});
  assert.equal(context.activeSport,'surf');assert.equal(context.chosenSport,'surf');
  assert.equal(context.currentFilter,'all');assert.equal(context.currentSearch,'');assert.equal(context.favOnly,false);assert.equal(context.nearMode,false);
  assert.equal(input.value,'');assert.deepEqual([...favs],['hossegor']);
  assert.equal(calls.filter(x=>x==='worlds').length,1);assert.ok(calls.includes('save'));assert.ok(calls.includes('go:spots'));assert.ok(!calls.includes('spots'));
  next();await pending;assert.ok(calls.includes('spots'));
  calls.length=0;
  const cancelled=context.apply('paddle',{nextFrame:()=>new Promise(r=>{next=r;}),isCurrent:()=>valid});
  valid=false;next();await cancelled;assert.ok(!calls.includes('spots'));assert.ok(!calls.includes('home-later'));
  calls.length=0;context.apply(null);assert.equal(context.chosenSport,'all');assert.ok(calls.indexOf('spots')<calls.indexOf('go:spots'));
});

test('applySport en mode stay refait l’accueil sous la scène, sans minuteur différé',async()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const section=app.slice(app.indexOf('function applySport('),app.indexOf('/* ====== GÉOLOCALISATION'));
  const calls=[];let next;
  const input={value:''},chip={classList:{remove(){}}};
  const context={window:{OceanNavigation:{begin(){}},OceanTheme:{set(){}}},SPORTMAP:{surf:{}},activeSport:null,chosenSport:'all',currentFilter:'all',currentSearch:'',favOnly:false,nearMode:false,
    document:{getElementById:()=>({value:'',classList:{remove(){}}}),querySelectorAll:()=>[]},renderSportFilters(){},backToWorlds(){},saveState(){},go:s=>calls.push('go:'+s),
    renderSpots:()=>calls.push('spots'),renderHome:()=>calls.push('home'),setTimeout:()=>calls.push('home-later')};
  vm.runInNewContext(section+';this.apply=applySport;',context);
  const pending=context.apply('surf',{nextFrame:()=>new Promise(r=>{next=r;}),isCurrent:()=>true},true);
  assert.ok(!calls.includes('home'));next();await pending;
  assert.deepEqual(calls,['spots','home']);
  calls.length=0;const p2=context.apply('surf',{nextFrame:()=>new Promise(r=>{next=r;}),isCurrent:()=>true},false);next();await p2;
  assert.ok(calls.includes('home-later'));assert.ok(!calls.includes('home'));
});
