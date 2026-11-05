/* Compte et sauvegarde : modèle de synchronisation (lecture/écriture des clés locales, fusion §8). */
const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../account-sync-model.js');

function store(init={}){const m=new Map(Object.entries(init).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get length(){return m.size},key:i=>[...m.keys()][i],map:m};}
const trip=(id,name,extra={})=>({id,name,destination:'',start:'',end:'',notes:'',accommodation:'',transport:'',budget:'',steps:[],checklist:[],...extra});
const sample=()=>store({
  oceanbuddy_v1:{xp:120,favs:['hossegor','nazare'],sessions:[{spot:'Nazaré',date:'3 nov.',act:'surf',ts:1000,id:'nazare'}],level:'debutant',sport:'surf',name:'Léa',eco:[{id:'beach-clean'}],onboarded:true,extra:'gardé'},
  oceanbuddy_trips_v1:{version:1,trips:[trip('t1','Portugal')]},
  oceanbuddy_spot_notebook_v1:{compare:['hossegor'],notes:{hossegor:'Super spot'}},
  oceanbuddy_progress_v1:{days:['2026-11-01'],seen:{a:1},chal:{},badges:['b1'],best:2},
  oceanbuddy_daily:'2026-11-4',
  oceanbuddy_lang:'en',oceanbuddy_streetview_v1:'1'
});

test('collect découpe l’activité en éléments et ignore les réglages d’appareil',()=>{
  const items=M.collect(sample());
  assert.deepEqual(Object.keys(items).sort(),['fav:hossegor','fav:nazare','misc:daily','note:hossegor','profile:me','progress:eco','progress:main','progress:xp','session:1000-nazare','trip:t1']);
  assert.deepEqual(items['profile:me'],{name:'Léa',level:'debutant',sport:'surf',onboarded:true});
  assert.ok(!JSON.stringify(items).includes('streetview'));
  for(const [key,data] of Object.entries(items)){const {kind,id}=M.splitKey(key);assert.ok(M.validItem(kind,id,data),key);}
});

test('apply(collect) ne change rien (aller-retour sans perte, champs inconnus et « comparer » gardés)',()=>{
  const s=sample(),before=new Map(s.map);
  assert.deepEqual(M.apply(s,M.collect(s)),[]);
  for(const [k,v] of before)assert.deepEqual(JSON.parse(JSON.stringify(s.getItem(k))),v,k);
});

test('apply sur un appareil neuf recrée les clés aux formats existants',()=>{
  const items=M.collect(sample()),fresh=store();
  M.apply(fresh,items);
  const main=JSON.parse(fresh.getItem('oceanbuddy_v1'));
  assert.equal(main.onboarded,true);assert.equal(main.xp,120);assert.deepEqual(main.favs.sort(),['hossegor','nazare']);
  assert.equal(JSON.parse(fresh.getItem('oceanbuddy_trips_v1')).trips[0].name,'Portugal');
  assert.deepEqual(JSON.parse(fresh.getItem('oceanbuddy_spot_notebook_v1')),{compare:[],notes:{hossegor:'Super spot'}});
  assert.equal(fresh.getItem('oceanbuddy_daily'),'2026-11-4');
  assert.equal(fresh.getItem('oceanbuddy_lang'),null);
});

test('scan date les changements locaux et oublie un retour à la version commune',()=>{
  const items=M.collect(sample());
  let st=M.scan(items,M.freshState(),100);
  assert.equal(Object.keys(st.pend).length,Object.keys(items).length);
  st=M.acknowledge(st,Object.keys(items).map(k=>({...M.splitKey(k),status:'ok',u:100})));
  assert.deepEqual(st.pend,{});
  const edited={...items,'note:hossegor':{text:'Changé'}};delete edited['fav:nazare'];
  st=M.scan(edited,st,200);
  assert.deepEqual(Object.keys(st.pend).sort(),['fav:nazare','note:hossegor']);
  const again=M.scan(edited,st,300);assert.equal(again.pend['note:hossegor'].u,200,'la date du changement ne bouge pas');
  assert.deepEqual(M.scan(items,st,400).pend,{});
  const m=M.merge(edited,[],st,{now:500});
  assert.deepEqual(m.push.find(p=>p.id==='nazare'),{kind:'fav',id:'nazare',data:{},u:200,deleted:true});
});

function synced(items,u=100){let st=M.scan(items,M.freshState(),u);return M.acknowledge(st,Object.keys(items).map(k=>({...M.splitKey(k),status:'ok',u})));}

test('le plus récent gagne ; un voyage perdant est gardé en copie dans la Corbeille',()=>{
  const items={'trip:t1':trip('t1','Portugal')};let st=synced(items);
  const local={'trip:t1':trip('t1','Portugal (ici)')};st=M.scan(local,st,200);
  const r=M.merge(local,[{kind:'trip',id:'t1',data:trip('t1','Portugal (autre)'),u:300,deleted:false,rev:5}],st,{now:400});
  assert.equal(r.local['trip:t1'].name,'Portugal (autre)');
  const copy=Object.entries(r.local).find(([k])=>k!=='trip:t1');
  assert.ok(copy,'copie créée');assert.equal(copy[1].deleted,true);assert.match(copy[1].name,/copie de l’autre appareil/);
  assert.ok(r.push.some(p=>p.id===copy[1].id));assert.ok(!r.push.some(p=>p.id==='t1'));
  assert.equal(r.state.lastRev,5);
  /* version locale plus récente : gardée et envoyée */
  const r2=M.merge(local,[{kind:'trip',id:'t1',data:trip('t1','Vieux'),u:150,deleted:false,rev:6}],st,{now:400});
  assert.equal(r2.local['trip:t1'].name,'Portugal (ici)');assert.ok(r2.push.some(p=>p.id==='t1'&&p.u===200));
});

test('supprimer est une modification qui se propage',()=>{
  const items={'fav:a':{},'fav:b':{}};const st=synced(items);
  const r=M.merge(items,[{kind:'fav',id:'a',data:{},u:300,deleted:true,rev:2}],st,{now:400});
  assert.deepEqual(Object.keys(r.local),['fav:b']);assert.deepEqual(r.push,[]);
});

test('les progressions ne reculent jamais (maximum, union, date de badge la plus ancienne)',()=>{
  const local={'progress:main':{days:['2026-11-01','2026-11-03'],seen:{a:1},chal:{x:{n:2,w:'2026-W44'}},badges:['b1'],best:3},'progress:xp':{xp:500},'progress:badge_dates':{b1:'2026-10-01'}};
  const st=synced(local);
  const remote=[{kind:'progress',id:'main',data:{days:['2026-11-02'],seen:{b:1},chal:{x:{n:1,w:'2026-W45'}},badges:['b2'],best:2},u:900,deleted:false,rev:3},
    {kind:'progress',id:'xp',data:{xp:300},u:900,deleted:false,rev:3},{kind:'progress',id:'badge_dates',data:{b1:'2026-10-05',b2:'2026-11-01'},u:900,deleted:false,rev:3}];
  const r=M.merge(local,remote,st,{now:1000});
  assert.deepEqual(r.local['progress:main'].days,['2026-11-01','2026-11-02','2026-11-03']);
  assert.deepEqual(r.local['progress:main'].badges.sort(),['b1','b2']);
  assert.equal(r.local['progress:main'].best,3);assert.deepEqual(r.local['progress:main'].chal.x,{n:2,w:'2026-W45'});
  assert.equal(r.local['progress:xp'].xp,500);
  assert.deepEqual(r.local['progress:badge_dates'],{b1:'2026-10-01',b2:'2026-11-01'});
  assert.ok(r.push.some(p=>p.id==='xp'&&p.data.xp===500),'le maximum repart vers le compte');
});

test('première connexion : le compte gagne les conflits, rien de local n’est perdu',()=>{
  const local={'trip:t1':trip('t1','Ici'),'trip:t2':trip('t2','Seulement ici'),'note:s1':{text:'note locale'},'fav:x':{}};
  const st=M.scan(local,M.freshState(),1000);
  const remote=[{kind:'trip',id:'t1',data:trip('t1','Compte'),u:10,deleted:false,rev:1},{kind:'trip',id:'t3',data:trip('t3','Autre'),u:10,deleted:false,rev:2},
    {kind:'note',id:'s1',data:{text:'note du compte'},u:10,deleted:false,rev:3}];
  const r=M.merge(local,remote,st,{now:1000,first:true});
  assert.equal(r.local['trip:t1'].name,'Compte');assert.equal(r.local['trip:t2'].name,'Seulement ici');assert.equal(r.local['trip:t3'].name,'Autre');
  assert.ok(Object.values(r.local).some(t=>t.name&&t.name.startsWith('Ici')&&t.deleted));
  assert.match(r.local['note:s1'].text,/note du compte[\s\S]*note locale/);
  assert.ok(r.push.some(p=>p.id==='s1'));assert.ok(r.push.some(p=>p.id==='t2'));assert.ok(r.push.some(p=>p.id==='x'));
  assert.equal(r.summary.fromAccount.trips,1);assert.equal(r.summary.keptLocal.trips,1);
});

test('un élément reçu invalide est ignoré, jamais écrit',()=>{
  const r=M.merge({},[{kind:'trip',id:'t9',data:{id:'autre',steps:[]},u:5,deleted:false,rev:1},{kind:'evil',id:'x',data:{},u:5,deleted:false,rev:2}],M.freshState(),{now:10});
  assert.deepEqual(r.local,{});
});

test('checkPushItem applique les mêmes bornes que le serveur',()=>{
  assert.equal(M.checkPushItem({kind:'fav',id:'a',data:{},u:1,deleted:false}),null);
  assert.equal(M.checkPushItem({kind:'fav',id:'a b',data:{},u:1,deleted:false}),'id');
  assert.equal(M.checkPushItem({kind:'progress',id:'main',data:{},u:1,deleted:true}),'kind');
  assert.equal(M.checkPushItem({kind:'note',id:'a',data:{text:'x'.repeat(1801)},u:1,deleted:false}),'data');
  assert.equal(M.checkPushItem({kind:'trip',id:'t',data:{...trip('t','x'),notes:'é'.repeat(20000)},u:1,deleted:false}),'size');
});

test('copie de sécurité et restauration de toutes les clés synchronisées',()=>{
  const s=sample(),snap=M.snapshot(s);
  s.setItem('oceanbuddy_v1','{}');s.removeItem('oceanbuddy_trips_v1');
  M.restoreSnapshot(s,snap);
  assert.equal(JSON.parse(s.getItem('oceanbuddy_trips_v1')).trips[0].id,'t1');
  assert.equal(s.getItem('oceanbuddy_lang'),'en');
});
