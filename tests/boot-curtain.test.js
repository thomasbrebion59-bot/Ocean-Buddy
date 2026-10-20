/* Rideau de démarrage (index.html) : contrat OceanBoot, règle « onboarding terminé » et structure statique. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const head=html.slice(0,html.indexOf('</head>'));
const bootSource=[...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('OceanBoot'));

function classList(){const set=new Set();return {set,add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c)};}
function boot({stored=null,capacitor=false,protocol='https:'}={}){
  const timers=[],events=[],listeners={},frames=[];
  const root={classList:classList()};
  const curtain={classList:classList(),parentNode:{removeChild(){curtain.removed=true;}}};
  const context={
    document:{documentElement:root,getElementById:id=>id==='obBoot'&&!curtain.removed?curtain:null},
    location:{protocol},performance:{now:()=>1000+timers.length},
    localStorage:{getItem:k=>k==='oceanbuddy_v1'?stored:null},
    setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length;},clearTimeout:id=>{if(timers[id-1])timers[id-1].cleared=true;},
    requestAnimationFrame:f=>frames.push(f),
    CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},
    dispatchEvent:e=>{events.push(e);(listeners[e.type]||[]).splice(0).forEach(f=>f(e));},
    addEventListener:(type,f)=>{(listeners[type]||(listeners[type]=[])).push(f);}
  };
  if(capacitor)context.Capacitor={};
  context.window=context;vm.createContext(context);vm.runInContext(bootSource,context);
  return {B:context.OceanBoot,root,curtain,timers,events,frames,flushFrames(){while(frames.length)frames.shift()();}};
}

test('inline boot script is the first script of the page, before i18n.js and every stylesheet',()=>{
  assert.ok(bootSource,'inline OceanBoot script');
  const at=s=>head.indexOf(s);
  assert.ok(at('OceanBoot')<at('i18n.js'));
  assert.ok(at('OceanBoot')<at('rel="stylesheet"'));
  assert.ok(at('<meta charset')<at('OceanBoot'),'charset stays first');
});
test('the curtain is the first element of <body> and the home feed owns #home from the static HTML',()=>{
  const body=html.slice(html.indexOf('<body'));
  assert.match(body,/^<body[^>]*>\s*<div id="obBoot"[^>]*><img src="assets\/app\/splash-logo\.webp"/);
  assert.ok(fs.existsSync(path.join(__dirname,'..','assets/app/splash-logo.webp')));
  assert.match(html,/<section class="screen active hf-on" id="home">/);
});
test('OceanBoot exposes the check:boot contract and hides the page while booting',()=>{
  const {B,root,timers}=boot();
  assert.equal(typeof B.t0,'number');assert.equal(B.lifted,false);assert.equal(B.liftedAt,null);assert.equal(B.reason,null);assert.equal(typeof B.ready,'function');
  assert.ok(root.classList.contains('ob-booting'));assert.ok(!root.classList.contains('native-app'));
  assert.deepEqual(timers.map(t=>t.ms),[4000],'hard cap set by the inline script');
});
test('native shell is detected before the first paint',()=>{
  assert.ok(boot({capacitor:true}).root.classList.contains('native-app'));
  assert.ok(boot({protocol:'capacitor:'}).root.classList.contains('native-app'));
});
test('ready() lifts once: flags, class removal, a single ocean:home-ready event, then one fade',()=>{
  const {B,root,curtain,events,flushFrames,timers}=boot();
  B.ready('anything');B.ready('timeout');
  assert.equal(B.lifted,true);assert.equal(B.reason,'ready');assert.equal(typeof B.liftedAt,'number');
  assert.ok(!root.classList.contains('ob-booting'));
  assert.equal(events.length,1);assert.equal(events[0].type,'ocean:home-ready');assert.equal(JSON.stringify(events[0].detail),'{"reason":"ready"}');
  assert.ok(timers[0].cleared,'cap cancelled');
  assert.ok(!curtain.classList.contains('is-out'),'page paints under the opaque curtain first');
  flushFrames();assert.ok(curtain.classList.contains('is-out'));
  timers.at(-1).f();assert.ok(curtain.removed);
});
test('the 4000 ms cap lifts with reason "timeout"',()=>{
  const {B,timers,events}=boot();
  timers[0].f();
  assert.equal(B.reason,'timeout');assert.equal(events[0].detail.reason,'timeout');
});
test('steps: the curtain waits for the shell and the home feed, and a re-armed step waits again',()=>{
  const {B}=boot();
  B.done('feed');assert.equal(B.lifted,false);
  B.wait('feed');B.done('shell');assert.equal(B.lifted,false,'feed re-armed by a remount');
  B.done('feed');assert.equal(B.lifted,true);assert.equal(B.reason,'ready');
});
test('after() runs on lift, or right away once lifted',()=>{
  const {B,timers}=boot();const calls=[];
  B.after(()=>calls.push('early'));assert.deepEqual(calls,[]);
  B.ready();assert.deepEqual(calls,['early']);
  B.after(()=>calls.push('late'));timers.at(-1).f();assert.deepEqual(calls,['early','late']);
});

/* Règle « onboarding terminé » : drapeau explicite, ou migration d’un profil qui a déjà une activité ou un niveau. */
const STATES=[
  [null,false],[{},false],[{xp:20,sport:null,level:null},false],[{onboarded:false},false],
  [{onboarded:true},true],[{level:'debutant'},true],[{sport:'all'},true],[{sport:'surf',level:null},true],
  [{sport:'all',level:null,onboarded:false},true]
];
test('onboarding rule: explicit flag, or existing profile with an activity or a level',()=>{
  const {B}=boot();
  for(const [state,expected] of STATES)assert.equal(B.onboarded(state),expected,JSON.stringify(state));
});
test('the onboarding is hidden from the first paint only for people who finished it',()=>{
  for(const [state,expected] of STATES)assert.equal(boot({stored:JSON.stringify(state)}).root.classList.contains('ob-onboarded'),expected,JSON.stringify(state));
  assert.equal(boot({stored:'{broken'}).root.classList.contains('ob-onboarded'),false);
});
test('app.js applies the same rule, with or without the curtain script',()=>{
  const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
  const fn=app.match(/function isOnboarded\(d\)\{[^\n]*\}/)[0];
  const withBoot=vm.runInNewContext(fn+';isOnboarded',{window:{OceanBoot:boot().B},OceanBoot:boot().B});
  const without=vm.runInNewContext(fn+';isOnboarded',{window:{}});
  for(const [state,expected] of STATES){assert.equal(withBoot(state),expected);assert.equal(without(state),expected);}
  /* Tous les chemins qui quittent l’onboarding posent le drapeau (onboarding complet, choix rapide, « près de moi »),
     ainsi que le choix du sport et du niveau, enregistré dès qu’il est complet (rememberChoice) ou fait dans Réglages. */
  assert.match(app,/function finishOnb\(\)\{[\s\S]*?onbDone=true;saveState\(\);/);
  assert.match(app,/function rememberChoice\(\)\{[^\n]*onbDone=true;saveState\(\);/);
  assert.match(app,/function chooseMySport\(id\)\{[\s\S]*?onbDone=true;/);
  assert.match(app,/function chooseMyLevel\(id\)\{[\s\S]*?onbDone=true;saveState\(\);/);
  assert.equal((app.match(/onbDone=true/g)||[]).length,6);
  assert.match(app,/onboarded:onbDone/);
});
