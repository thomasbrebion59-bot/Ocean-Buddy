/* Mode Noël (noel-model.js) : période, forçage, titre de saison, rangée « Noël au soleil », calendrier de l’Avent.
   Plus quelques garde-fous sur l’intégration (home-feed.js, index.html, traductions). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../noel-model.js');

const D=(y,m,d)=>new Date(y,m-1,d,12);
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('période : du 15 novembre au 6 janvier inclus',()=>{
  assert.equal(M.inPeriod(D(2026,11,3)),false);
  assert.equal(M.inPeriod(D(2026,11,14)),false);
  assert.equal(M.inPeriod(D(2026,11,15)),true);
  assert.equal(M.inPeriod(new Date(2026,10,15,0,0,0)),true,'minuit le 15 novembre (heure locale)');
  assert.equal(M.inPeriod(new Date(2026,10,14,23,59,59)),false);
  assert.equal(M.inPeriod(D(2026,11,30)),true);
  assert.equal(M.inPeriod(D(2026,12,1)),true);
  assert.equal(M.inPeriod(D(2026,12,24)),true);
  assert.equal(M.inPeriod(D(2026,12,31)),true);
  assert.equal(M.inPeriod(D(2027,1,1)),true);
  assert.equal(M.inPeriod(D(2027,1,6)),true);
  assert.equal(M.inPeriod(D(2027,1,7)),false);
  assert.equal(M.inPeriod(new Date(2027,0,6,23,59,59)),true,'dernière seconde du 6 janvier');
  assert.equal(M.inPeriod(new Date(NaN)),false);
  assert.equal(M.inPeriod(null),false);
});

test('état : automatique pendant la période, réglage mémorisé, activé par défaut',()=>{
  assert.deepEqual(M.state({now:D(2026,11,3)}).on,false);
  assert.equal(M.state({now:D(2026,11,3)}).period,false);
  assert.equal(M.state({now:D(2026,11,14)}).on,false);
  assert.equal(M.state({now:D(2026,11,15)}).on,true);
  assert.equal(M.state({now:D(2026,11,30)}).on,true);
  const dec=M.state({now:D(2026,12,10)});
  assert.equal(dec.on,true);assert.equal(dec.period,true);assert.equal(dec.enabled,true);
  assert.equal(M.state({now:D(2026,12,10),stored:'on'}).on,true);
  const off=M.state({now:D(2026,12,10),stored:'off'});
  assert.equal(off.on,false);assert.equal(off.period,true,'le réglage reste proposé');
  assert.equal(M.state({now:D(2027,1,6)}).on,true);
  assert.equal(M.state({now:D(2027,1,7)}).on,false);
});

test('forçage : ?saison=noel simule la période, ?saison=off la coupe',()=>{
  const f=M.state({now:D(2026,11,3),search:'?saison=noel'});
  assert.equal(f.on,true);assert.equal(f.forced,'noel');
  assert.equal(f.date.getMonth(),11);assert.equal(f.date.getDate(),1,'hors période : 1er décembre');
  const j=M.state({now:D(2026,11,3),search:'?saison=noel&jour=2026-12-12'});
  assert.equal(j.date.getDate(),12);assert.equal(j.date.getMonth(),11);
  assert.equal(M.state({now:D(2026,11,3),search:'?saison=noël&jour=2027-01-02'}).date.getMonth(),0);
  assert.equal(M.state({now:D(2026,11,3),search:'?saison=noel&jour=2026-12-32'}).date.getDate(),1,'jour invalide ignoré');
  assert.equal(M.state({now:D(2026,11,3),search:'?saison=noel&jour=2026-07-14'}).date.getMonth(),11,'jour hors période ignoré');
  assert.equal(M.state({now:D(2026,11,3),search:'?saison=noel&jour=2026-11-20'}).date.getDate(),20,'jour de novembre dans la période');
  assert.equal(M.state({now:D(2026,12,20),search:'?saison=noel'}).date.getDate(),20,'pendant la période : la vraie date');
  assert.equal(M.state({now:D(2026,11,3),search:'?jour=2026-12-12'}).on,false,'jour seul sans effet');
  const o=M.state({now:D(2026,12,10),search:'?saison=off'});
  assert.equal(o.on,false);assert.equal(o.period,false);assert.equal(o.forced,'off');
  assert.equal(M.state({now:D(2026,12,10),search:'?lang=en&saison=OFF'}).on,false);
  assert.equal(M.state({now:D(2026,11,3),search:'?saison=noel',stored:'off'}).on,false,'le réglage coupé reste respecté');
  assert.equal(M.state({now:D(2026,12,10),search:'?saison=autre'}).on,true);
});

test('titre de saison : compte à rebours, Noël, belles fêtes, bonne année',()=>{
  assert.deepEqual(M.greeting(D(2026,11,15)),{kind:'countdown',n:40});
  assert.deepEqual(M.greeting(D(2026,11,30)),{kind:'countdown',n:25});
  assert.equal(M.greeting(D(2026,11,14)),null);
  assert.deepEqual(M.greeting(D(2026,12,1)),{kind:'countdown',n:24});
  assert.deepEqual(M.greeting(D(2026,12,23)),{kind:'countdown',n:2});
  assert.deepEqual(M.greeting(D(2026,12,24)),{kind:'countdown',n:1});
  assert.deepEqual(M.greeting(D(2026,12,25)),{kind:'noel'});
  assert.deepEqual(M.greeting(D(2026,12,26)),{kind:'fetes'});
  assert.deepEqual(M.greeting(D(2026,12,31)),{kind:'fetes'});
  assert.deepEqual(M.greeting(D(2027,1,1)),{kind:'annee'});
  assert.deepEqual(M.greeting(D(2027,1,6)),{kind:'annee'});
  assert.equal(M.greeting(D(2027,1,7)),null);
  assert.equal(M.daysToChristmas(new Date(2026,9,25,23,30)),61,'passage à l’heure d’hiver sans effet');
});

test('mois de la rangée : décembre dès novembre et jusqu’au 25, janvier ensuite',()=>{
  assert.equal(M.railMonth(D(2026,11,15)),11);
  assert.equal(M.railMonth(D(2026,11,30)),11);
  assert.equal(M.railMonth(D(2026,12,1)),11);
  assert.equal(M.railMonth(D(2026,12,25)),11);
  assert.equal(M.railMonth(D(2026,12,26)),0);
  assert.equal(M.railMonth(D(2027,1,4)),0);
});

const SEAS={a:[11,0],b:[11],c:[0,1],d:[10,11],e:[11],f:[11]};
const SEA={a:[26,27],b:[24,23],c:[29,29],d:[23,22],f:[30,30]};
const seaOf=(s,m)=>SEA[s.id]?SEA[s.id][m===11?0:1]:null;
const SPOTS=[{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'},{id:'f'},{id:'g'}];

test('Noël au soleil : bonne saison ET eau ≥ 24 °C, trié par score photo',()=>{
  const dec=M.sunnySpots(SPOTS,{seasons:SEAS,sea:seaOf,scores:{a:60,b:90,f:60},month:11});
  /* d : 23 °C (trop froide) ; e : pas de température ; c, g : hors saison en décembre */
  assert.deepEqual(dec.map(s=>s.id),['b','f','a'],'score 90 d’abord, puis à score égal l’eau la plus chaude');
  const jan=M.sunnySpots(SPOTS,{seasons:SEAS,sea:seaOf,scores:{},month:0});
  assert.deepEqual(jan.map(s=>s.id),['c','a'],'janvier : saisons et températures de janvier');
  assert.deepEqual(M.sunnySpots(SPOTS,{seasons:SEAS,sea:seaOf,month:11,min:25}).map(s=>s.id).sort(),['a','f']);
  assert.deepEqual(M.sunnySpots(SPOTS,{seasons:null,sea:seaOf,month:11}),[]);
  assert.deepEqual(M.sunnySpots(null,{seasons:SEAS,sea:seaOf,month:11}),[]);
  /* Un spot ajouté plus tard au catalogue entre tout seul dans la rangée. */
  const plus=M.sunnySpots([...SPOTS,{id:'nouveau'}],{seasons:{...SEAS,nouveau:[11]},sea:(s,m)=>s.id==='nouveau'?28:seaOf(s,m),scores:{nouveau:99},month:11});
  assert.equal(plus[0].id,'nouveau');
});

test('Noël au soleil sur les vraies données : assez de spots pour 24 cases',()=>{
  const w={};new Function('window',read('assets/data/spot-climate-lite.js'))(w);
  const lite=w.OCEAN_CLIMATE_LITE,seasons=JSON.parse(read('data/seasons.json')),scores=JSON.parse(read('data/photo-scores.json'));
  const spots=JSON.parse(read('data/catalog.json'));
  const sea=(s,m)=>lite[s.id]?.[0]?.[m]??null;
  for(const month of [11,0]){
    const list=M.sunnySpots(spots,{seasons,sea,scores,month});
    assert.ok(list.length>=24,`${list.length} spots en ${month}`);
    for(const s of list){assert.ok(seasons[s.id].includes(month));assert.ok(sea(s,month)>=24);}
    for(let i=1;i<list.length;i++)assert.ok((scores[list[i-1].id]??55)>=(scores[list[i].id]??55));
  }
});

test('Avent : 24 cases du 1er au 24 décembre, passées ouvrables, futures fermées, disparaît après le 24',()=>{
  const d=M.adventDays(D(2026,12,12));
  assert.equal(d.length,24);
  assert.deepEqual(d.slice(10,13).map(x=>x.state),['past','today','future']);
  assert.equal(d.filter(x=>x.state==='past').length,11);
  assert.equal(M.adventDays(D(2026,12,1))[0].state,'today');
  assert.equal(M.adventDays(D(2026,12,24))[23].state,'today');
  assert.equal(M.adventDays(D(2026,12,25)),null);
  assert.equal(M.adventDays(D(2027,1,2)),null);
  assert.equal(M.adventDays(D(2026,11,30)),null);
  assert.equal(M.adventDays(D(2026,11,15)),null);
});

test('Avent : avant le 1er décembre, la carte « ouvre le 1er décembre » tient sa place',()=>{
  assert.equal(M.adventSoon(D(2026,11,14)),false,'hors période');
  assert.equal(M.adventSoon(D(2026,11,15)),true);
  assert.equal(M.adventSoon(D(2026,11,30)),true);
  assert.equal(M.adventSoon(D(2026,12,1)),false);
  assert.equal(M.adventSoon(D(2026,12,25)),false);
  assert.equal(M.adventSoon(D(2027,1,6)),false);
  assert.ok(feed.includes('Le calendrier de l’Avent ouvre le 1er décembre'));
});

test('Avent : tirage déterministe par date, jamais deux fois le même spot',()=>{
  const ids=Array.from({length:30},(_,i)=>'s'+i);
  const days=Array.from({length:24},(_,i)=>M.adventPick(i+1,2026,ids,{}));
  assert.equal(new Set(days).size,24,'24 spots différents');
  assert.deepEqual(days,Array.from({length:24},(_,i)=>M.adventPick(i+1,2026,[...ids].reverse(),{})),'indépendant de l’ordre reçu');
  assert.notDeepEqual(days,Array.from({length:24},(_,i)=>M.adventPick(i+1,2027,ids,{})),'autre année, autre tirage');
  /* Case déjà ouverte : on retrouve le même spot, même si la liste change. */
  assert.equal(M.adventPick(5,2026,[...ids,'nouveau'],{5:'s3'}),'s3');
  /* Un spot déjà tiré pour un autre jour n’est jamais repris. */
  const want=M.adventPick(6,2026,ids,{});
  const other=M.adventPick(6,2026,ids,{2:want});
  assert.notEqual(other,want);
  /* Spot retiré du catalogue : nouveau tirage. */
  assert.ok(ids.includes(M.adventPick(5,2026,ids,{5:'disparu'})));
  assert.equal(M.adventPick(0,2026,ids,{}),null);
  assert.equal(M.adventPick(25,2026,ids,{}),null);
  assert.equal(M.adventPick(3,2026,[],{}),null);
  /* Moins de spots que de cases : on reboucle sans planter. */
  assert.ok(['x','y'].includes(M.adventPick(3,2026,['x','y'],{1:'x',2:'y'})));
});

test('Avent : cases ouvertes mémorisées par année, valeurs abîmées ignorées',()=>{
  const raw=M.writeOpened({3:'a',4:'b'},2026);
  assert.deepEqual(M.readOpened(raw,2026),{3:'a',4:'b'});
  assert.deepEqual(M.readOpened(raw,2027),{},'autre année');
  assert.deepEqual(M.readOpened('{pas du json',2026),{});
  assert.deepEqual(M.readOpened(null,2026),{});
  assert.deepEqual(M.readOpened(JSON.stringify({y:2026,days:{0:'a',30:'b',5:7,6:'ok'}}),2026),{6:'ok'});
});

/* ---------- Intégration ---------- */
const feed=read('home-feed.js'),html=read('index.html'),css=read('home-feed.css');

test('index.html charge noel-model.js avant home-feed.js et propose le réglage « Ambiance de Noël » (caché hors période)',()=>{
  const a=html.indexOf('src="noel-model.js'),b=html.indexOf('src="home-feed.js');
  assert.ok(a>0&&b>a);
  assert.match(html,/<label class="set-toggle" id="setNoelRow" hidden><span>Ambiance de Noël<\/span><input type="checkbox" id="setNoel"><\/label>/);
});

test('home-feed.js : rien n’est créé hors mode Noël, pause onglet caché et mouvement réduit, stockage protégé',()=>{
  assert.match(feed,/window\.NoelModel/);
  assert.match(feed,/noel\.on/);
  assert.match(feed,/prefers-reduced-motion/);
  assert.match(feed,/document\.hidden/);
  /* chaque accès au stockage est dans un try */
  for(const m of feed.matchAll(/localStorage\.(get|set)Item/g)){
    const before=feed.slice(Math.max(0,m.index-40),m.index);
    assert.match(before,/try\{/,'localStorage hors try : '+before);
  }
  /* la normale citée comme dans le reste de l’app */
  assert.ok(feed.includes('normales NOAA'));
  /* pas d’émoji décoratif dans les textes de Noël */
  const noelPart=feed.slice(feed.indexOf('/* ---------- Mode Noël'),feed.indexOf('/* ---------- Fin du mode Noël'));
  assert.ok(noelPart.length>500,'bloc Noël introuvable');
  assert.doesNotMatch(noelPart,/\p{Extended_Pictographic}/u);
  assert.doesNotMatch(noelPart,/[→↗➜➤]/);
});

test('touches de Noël sur toute l’interface : seulement sous html.ob-noel (coupées avec le réglage)',()=>{
  const n=read('noel.css');
  assert.ok(html.includes('href="noel.css'),'noel.css lié');
  assert.match(feed,/classList\.toggle\('ob-noel',!!noel\.on\)/);
  const rules=n.replace(/\/\*[\s\S]*?\*\//g,'').split('}').map(r=>r.split('{')[0].trim()).filter(r=>r&&!r.startsWith(':root'));
  assert.ok(rules.length>=6);
  for(const sel of rules)for(const part of sel.split(','))assert.match(part.trim(),/^html\.ob-noel /,'règle hors mode Noël : '+part);
});

test('CSS de Noël : jetons uniquement, animations coupées en mouvement réduit',()=>{
  assert.match(css,/\.hf-noel-top/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)\{[^}]*\.hf-noel/);
  assert.match(css,/\.reduce-motion \.hf-noel/);
});

test('traductions EN et ES présentes pour chaque texte de Noël',()=>{
  const en=JSON.parse(read('locales/translations/en.json')),es=JSON.parse(read('locales/translations/es.json'));
  const keys=['Le calendrier de l’Avent ouvre le 1er décembre','Une case par jour du 1er au 24 décembre : un spot au soleil à découvrir.','Eau en décembre','Eau en janvier','Eau à 24 °C ou plus en décembre (normales NOAA, valeur indicative) et bonne saison selon nos carnets.','Eau à 24 °C ou plus en janvier (normales NOAA, valeur indicative) et bonne saison selon nos carnets.','Noël au soleil','Joyeux Noël','Belles fêtes','Bonne année','Plus que {0} jours avant Noël','Plus qu’un jour avant Noël','Calendrier de l’Avent','Ambiance de Noël'];
  const src=JSON.parse(read('locales/source/fr.json'));
  for(const k of keys){
    assert.ok(src.includes(k),'clé absente de fr.json : '+k);
    assert.ok(en[k]&&en[k]!==k,'EN : '+k);
    assert.ok(es[k]&&es[k]!==k,'ES : '+k);
  }
});
