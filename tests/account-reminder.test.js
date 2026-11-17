/* Compte : le rappel unique (3e favori / premier voyage) s'appuie sur les écritures de localStorage, sans lecture périodique.
   account-sync.js est chargé tel quel dans un contexte vm (faux DOM, faux stockage, horloge simulée). */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {read}=require('./src-extract.cjs');
const M=require('../account-sync-model.js');

const SRC=read('account-sync.js'),STATE_KEY='oceanbuddy_sync_v1';

const stub=()=>{const e={className:'',innerHTML:'',textContent:'',style:{},children:[],
  classList:{s:new Set(),add(c){this.s.add(c);},remove(c){this.s.delete(c);},contains(c){return this.s.has(c);}},
  setAttribute(){},addEventListener(){},append(...a){e.children.push(...a);},remove(){},querySelector(){return stub();},querySelectorAll(){return [];},focus(){}};return e;};

function env({state={invite:{at:1}},main,trips}={}){
  /* Horloge simulée : toute minuterie est comptée, rien ne tourne vraiment. */
  let now=1e12,id=0;const queue=new Map(),stats={setInterval:0,setTimeout:0,reads:0};
  const clock={
    setTimeout(f,ms=0){stats.setTimeout++;queue.set(++id,{f,at:now+ms});return id;},
    setInterval(f,ms){stats.setInterval++;queue.set(++id,{f,at:now+ms,every:ms});return id;},
    clearTimeout(i){queue.delete(i);},clearInterval(i){queue.delete(i);},
    advance(ms){const end=now+ms;
      for(;;){let next=null;for(const [i,t] of queue)if(t.at<=end&&(!next||t.at<next.t.at))next={i,t};if(!next)break;
        now=Math.max(now,next.t.at);if(next.t.every)next.t.at+=next.t.every;else queue.delete(next.i);next.t.f();}
      now=end;}};
  class Storage{constructor(){this.m=new Map();}
    getItem(k){stats.reads++;return this.m.has(k)?this.m.get(k):null;}
    setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}
    get length(){return this.m.size;}key(i){return [...this.m.keys()][i]??null;}}
  const localStorage=new Storage(),sessionStorage=new Storage();
  const nativeSetItem=Storage.prototype.setItem;
  if(state)localStorage.setItem(STATE_KEY,JSON.stringify({...M.freshState(),...state}));
  if(main)localStorage.setItem(M.KEYS.main,JSON.stringify(main));
  if(trips)localStorage.setItem(M.KEYS.trips,JSON.stringify(trips));
  const dom={overlay:false,toast:false,typing:false,appended:[]};
  const document={hidden:false,documentElement:{lang:'fr'},head:{append(){}},
    get activeElement(){return dom.typing?{tagName:'INPUT'}:null;},
    body:{classList:{contains:()=>false},append(e){dom.appended.push(e);}},
    createElement:()=>stub(),getElementById:()=>null,addEventListener(){},
    querySelector(sel){if(sel==='#toast.show')return dom.toast?stub():null;if(sel.startsWith('.oba,'))return dom.overlay?stub():null;return null;}};
  class FakeDate extends Date{static now(){return now;}}
  const ctx=vm.createContext({console,Storage,localStorage,sessionStorage,document,Date:FakeDate,
    setTimeout:clock.setTimeout,setInterval:clock.setInterval,clearTimeout:clock.clearTimeout,clearInterval:clock.clearInterval,
    requestAnimationFrame:f=>clock.setTimeout(f,16),addEventListener(){},
    location:{search:'',pathname:'/',hash:''},history:{state:null,replaceState(){}}});
  ctx.window=ctx;ctx.OceanAccountModel=M;
  vm.runInContext(SRC,ctx,{filename:'account-sync.js'});
  const set=(key,v)=>localStorage.setItem(key,JSON.stringify(v));
  return {
    clock,stats,dom,localStorage,ctx,nativeSetItem,Storage,
    favs:n=>set(M.KEYS.main,{favs:Array.from({length:n},(_,i)=>'spot'+i)}),
    trips:n=>set(M.KEYS.trips,{version:1,trips:Array.from({length:n},(_,i)=>({id:'t'+i,name:'Voyage '+i,steps:[]}))}),
    snacks:()=>dom.appended.filter(e=>e.className==='oba-snack'),
    st:()=>JSON.parse(localStorage.getItem(STATE_KEY)||'null')||{},
  };
}

test('aucune lecture périodique : ni setInterval ni relecture de l’état tant que rien ne change',()=>{
  const e=env();
  assert.equal(e.stats.setInterval,0,'plus de setInterval toutes les 8 s');
  const reads=e.stats.reads;
  e.clock.advance(10*60*1000);
  assert.equal(e.stats.reads,reads,'10 minutes sans écriture : zéro lecture du stockage');
  assert.equal(e.stats.setInterval,0);
  assert.equal(e.snacks().length,0);
  /* Une écriture sur une autre clé (progression, quiz…) ne déclenche rien non plus. */
  e.localStorage.setItem(M.KEYS.progress,'{}');e.clock.advance(5000);
  assert.equal(e.stats.reads,reads,'seules les clés des favoris et des voyages sont écoutées');
});

test('la fonction du rappel ne contient plus de setInterval',()=>{
  const w=SRC.slice(SRC.indexOf('function watchReminder'),SRC.indexOf('function snack('));
  assert.doesNotMatch(w,/setInterval/);
  assert.match(w,/proto\.setItem=listen/);
});

test('3e favori : le rappel arrive une seule fois, puis l’écoute s’arrête et le stockage est rendu intact',()=>{
  const e=env();
  assert.notEqual(e.Storage.prototype.setItem,e.nativeSetItem,'écoute installée');
  e.favs(1);e.clock.advance(1000);e.favs(2);e.clock.advance(1000);
  assert.equal(e.snacks().length,0,'2 favoris : pas encore');
  e.favs(3);e.clock.advance(1000);
  assert.equal(e.snacks().length,1);
  assert.match(e.snacks()[0].innerHTML,/Garde tes favoris sur tous tes appareils/);
  assert.ok(e.st().remindTrip,'rappel marqué comme fait');
  assert.equal(e.Storage.prototype.setItem,e.nativeSetItem,'l’écoute est retirée dès la décision');
  e.favs(4);e.trips(1);e.clock.advance(30000);
  assert.equal(e.snacks().length,1,'jamais un deuxième rappel');
  assert.equal(e.stats.setInterval,0);
});

test('le rappel suit la même règle qu’avant : 3 favoris ET plus qu’au chargement ; la base baisse si on retire des favoris',()=>{
  const a=env({main:{favs:['a','b','c']}});
  a.favs(3);a.clock.advance(5000);
  assert.equal(a.snacks().length,0,'déjà 3 favoris au chargement : rien');
  const b=env({main:{favs:['a','b']}});
  b.favs(3);b.clock.advance(1000);
  assert.equal(b.snacks().length,1,'2 au chargement, 3e ajouté : rappel');
  const c=env({main:{favs:['a','b','c']}});
  c.favs(1);c.clock.advance(1000);c.favs(3);c.clock.advance(1000);
  assert.equal(c.snacks().length,1,'retirer puis remettre : la base a baissé, le rappel arrive');
});

test('premier voyage : le rappel arrive, avec son texte',()=>{
  const e=env();
  e.trips(1);e.clock.advance(1000);
  assert.equal(e.snacks().length,1);
  assert.match(e.snacks()[0].innerHTML,/Sauvegarde ton voyage avec ton compte/);
  assert.ok(e.st().remindTrip);
  /* Un voyage supprimé ne compte pas. */
  const d=env();
  d.localStorage.setItem(M.KEYS.trips,JSON.stringify({version:1,trips:[{id:'x',deleted:true}]}));d.clock.advance(2000);
  assert.equal(d.snacks().length,0);
});

test('rien avant l’invitation, rien si le compte est lié, rien si le rappel a déjà eu lieu',()=>{
  const noInvite=env({state:{}});
  noInvite.favs(3);noInvite.clock.advance(1000);
  assert.equal(noInvite.snacks().length,0,'invitation pas encore proposée');
  for(const state of [{invite:{at:1},linked:true},{invite:{at:1},remindTrip:5}]){
    const e=env({state});
    assert.equal(e.Storage.prototype.setItem,e.nativeSetItem,'aucune écoute : '+JSON.stringify(state));
    e.favs(3);e.trips(1);e.clock.advance(5000);
    assert.equal(e.snacks().length,0);
  }
});

test('connecté pendant la visite : l’écoute s’arrête à la première écriture suivante, sans rappel',()=>{
  const e=env();
  e.localStorage.setItem(STATE_KEY,JSON.stringify({...e.st(),linked:true}));
  e.favs(3);e.clock.advance(2000);
  assert.equal(e.snacks().length,0);
  assert.equal(e.Storage.prototype.setItem,e.nativeSetItem);
});

test('message à l’écran, fenêtre ouverte ou saisie : le rappel attend le calme, une seule fois, sans chevaucher le message',()=>{
  for(const flag of ['toast','overlay','typing']){
    const e=env();
    e.dom[flag]=true;
    e.favs(3);e.clock.advance(3000);
    assert.equal(e.snacks().length,0,flag+' : pas de rappel tant que ce n’est pas calme');
    assert.equal(e.st().remindTrip,undefined);
    e.dom[flag]=false;e.clock.advance(1600);
    assert.equal(e.snacks().length,1,flag+' : le rappel arrive dès que l’écran est calme');
    e.clock.advance(60000);
    assert.equal(e.snacks().length,1,flag+' : une seule fois');
  }
  /* Cas réel : le message « Ajouté à tes favoris » reste 2,6 s. */
  const e=env();
  e.dom.toast=true;e.clock.setTimeout(()=>{e.dom.toast=false;},2600);
  e.favs(3);e.clock.advance(2500);assert.equal(e.snacks().length,0);
  e.clock.advance(2500);assert.equal(e.snacks().length,1,'moins de 3 s après la fin du message');
});

test('attente d’un écran calme bornée : une fenêtre ouverte très longtemps ne fait pas tourner de minuterie sans fin, un nouveau changement relance',()=>{
  const e=env();
  e.dom.overlay=true;e.favs(3);
  e.clock.advance(2*60*1000);
  const reads=e.stats.reads;
  e.clock.advance(20*60*1000);
  assert.equal(e.stats.reads,reads,'après 40 essais, plus aucune lecture');
  assert.equal(e.snacks().length,0);
  e.dom.overlay=false;e.favs(3);e.clock.advance(1000);
  assert.equal(e.snacks().length,1,'un nouveau changement relance la vérification');
});
