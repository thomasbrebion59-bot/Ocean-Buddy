const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const text=f=>fs.readFileSync(path.join(root,f),'utf8');
const {months}=require('../scripts/build-seasons.cjs');
const P=require('../scripts/build-seasons-prudent.cjs');
const M=require('../spot-data-model.js');

const catalog=read('data/catalog.json'),guides=read('data/spot-guides.json'),climate=read('data/climate.json').spots;
const seasons=read('data/seasons.json'),risks=read('data/sources/season-risks.json');
const ids=new Set(catalog.map(s=>s.id)),raw=P.carnetMonths(guides);
const ISO=/^\d{4}-\d{2}-\d{2}$/;

test('months() lit « X à Y », les saisons et « toute l’année »',()=>{
  /* textes de carnet copiés tels quels : le test ne bouge pas quand un carnet est corrigé */
  /* l’automne au printemps : l’hiver est couvert (décembre, janvier, février) */
  const wimereux=months('De l’automne au printemps : les dépressions amènent un vent d’ouest soutenu et régulier ; l’été, les séances se jouent surtout l’après-midi.');
  for(const m of [11,0,1])assert.ok(wimereux.includes(m),'wimereux mois '+m);
  assert.ok(!wimereux.includes(6),'wimereux : juillet n’est pas lu dans la suite de la phrase');
  /* « mai à juin et en octobre » : les mois isolés après une plage restent lus */
  assert.deepEqual(months('De mai à juin et en octobre : eau chaude, lagon calme et moins de risque de typhon qu’en plein été.'),[4,5,9]);
  /* décembre à mars pour les requins-marteaux, « toute l’année » plus loin dans la phrase : pas 12 mois */
  assert.deepEqual(months('De décembre à mars pour les grands requins-marteaux dans la passe, mais dauphins et requins gris y sont toute l’année.'),[0,1,2,11]);
  /* « et » ne fait pas une plage */
  assert.deepEqual(months('Juin et septembre : bla'),[5,8]);
  assert.deepEqual(months('De novembre à mars : bla'),[0,1,2,10,11]);
  assert.equal(months('Toute l’année : bla').length,12);
});

test('data/seasons.json est exactement la sortie du générateur prudent, sur tout le catalogue',()=>{
  assert.deepEqual(seasons,P.build().out);
});

test('seasons.json : bien formé et toujours inclus dans les mois du carnet',()=>{
  assert.ok(Object.keys(seasons).length>500,'peu de spots : '+Object.keys(seasons).length);
  for(const [id,ms] of Object.entries(seasons)){
    assert.ok(ids.has(id),'spot inconnu '+id);
    assert.ok(ms.length>0,id+' vide');
    assert.ok(ms.every((m,i)=>Number.isInteger(m)&&m>=0&&m<=11&&(i===0||m>ms[i-1])),id+' mois mal formés '+ms);
    for(const m of ms)assert.ok(raw[id]?.includes(m),id+' : le mois '+m+' n’est pas dans le carnet');
  }
});

test('kata n’a aucun mois de mai à octobre ; aucun mois exclu par season-risks.json n’est présent',()=>{
  for(const m of seasons.kata||[])assert.ok(m<4||m>9,'kata en saison au mois '+m);
  for(const [id,r] of Object.entries(risks))
    for(const m of r.exclude)assert.ok(!(seasons[id]||[]).includes(m),id+' : le mois exclu '+m+' est proposé');
  /* whitehaven : mois de précaution compris (octobre à mai) */
  for(const m of [9,10,11,0,1,2,3,4])assert.ok(risks.whitehaven.exclude.includes(m),'whitehaven mois '+m);
});

test('le modèle d’un surfeur ne valide pas la mousson pour des nageurs (activités dans l’eau seules)',()=>{
  const kata=catalog.find(s=>s.id==='kata');
  assert.ok(kata.sports.includes('surf')&&kata.sports.includes('baignade'));
  assert.deepEqual(P.modelMonths(kata,climate.kata),M.best(M.year(climate.kata,'baignade',kata.level)).months);
  /* sans activité dans l’eau : l’union de toutes les activités */
  const surfOnly={sports:['surf','kitesurf'],level:'intermediaire'};
  const union=[...new Set(['surf','kitesurf'].flatMap(a=>M.best(M.year(climate.hossegor,a,'intermediaire')).months))].sort((a,b)=>a-b);
  assert.deepEqual(P.modelMonths(surfOnly,climate.hossegor),union);
  assert.deepEqual(P.modelMonths(kata,null),[]);
});

test('prudent() : intersection du carnet et du modèle, moins les mois à risque sourcés',()=>{
  const s=catalog.find(x=>x.id==='turquoisebay'),model=P.modelMonths(s,climate.turquoisebay);
  const carnet=[0,1,2,3,4,5,6,7,8,9,10,11];
  assert.deepEqual(P.prudent(s,carnet,climate.turquoisebay,{}),model);
  assert.deepEqual(P.prudent(s,[],climate.turquoisebay,{}),[]);
  assert.deepEqual(P.prudent(s,carnet,null,{}),[]);
  const out=P.prudent(s,carnet,climate.turquoisebay,{turquoisebay:{status:'sourcé',exclude:model}});
  assert.deepEqual(out,[]);
  /* une entrée qui n’est pas « sourcé » n’exclut rien */
  assert.deepEqual(P.banned({x:{status:'à vérifier',exclude:[1]}},'x'),[]);
  assert.deepEqual(P.banned({x:{status:'sourcé',exclude:[1,2]}},'x'),[1,2]);
  assert.deepEqual(P.banned({},'x'),[]);
});

test('data/sources/season-risks.json : chaque mois exclu a sa source officielle datée',()=>{
  assert.ok(Object.keys(risks).length>=9);
  for(const [id,r] of Object.entries(risks)){
    assert.ok(ids.has(id),'spot inconnu '+id);
    assert.equal(r.spot,id);
    assert.equal(r.status,'sourcé',id);
    assert.match(r.checked,ISO,id);
    assert.ok(typeof r.kind==='string'&&r.kind.length>10,id+' kind');
    assert.ok(Array.isArray(r.exclude)&&r.exclude.length>0,id+' exclude');
    assert.equal(new Set(r.exclude).size,r.exclude.length,id+' doublons');
    assert.ok(r.exclude.every(m=>Number.isInteger(m)&&m>=0&&m<=11),id+' mois');
    assert.ok(r.sources.length>=1,id+' sans source');
    for(const x of r.sources){
      assert.match(x.url,/^https:\/\//,id);
      assert.ok(x.publisher&&x.title&&x.supports,id+' source incomplète');
      assert.match(x.consulted,ISO,id);
      assert.ok(x.quote&&x.quote.length>10,id+' citation vide');
    }
  }
});

test('les spots sans mois commun (carnet et modèle) sont listés pour relecture, sans échec',t=>{
  const none=catalog.filter(s=>raw[s.id]&&!seasons[s.id]).map(s=>s.id);
  t.diagnostic(`${none.length} spots avec une saison de carnet n’ont aucun mois en commun avec le modèle climatique : ${none.join(', ')}`);
  /* ils ne sont ni dans le filtre « En saison » ni dans les rails de l’accueil */
  for(const id of none)assert.equal(seasons[id],undefined,id);
});

/* ---------- Accueil ---------- */
const feed=text('home-feed.js');
function debutRail(win){
  const i=feed.indexOf("{id:'debut'"),j=feed.indexOf("{id:'iles'");
  assert.ok(i>0&&j>i,'collection debut introuvable');
  const has=feed.match(/const has=[^\n]+;/)[0];
  const ctx=vm.createContext({window:win});
  vm.runInContext(`${has}\nthis.rail=(${feed.slice(i,j).trim().replace(/,$/,'')});`,ctx);
  return ctx.rail;
}
test('rail « Pour débuter en douceur » : écarte les jauges à 3 ou 4 points, reste correct sans la jauge',()=>{
  const surf={level:'debutant',sports:['surf']};
  assert.equal(debutRail({}).test(surf),true,'jauge absente');
  assert.equal(debutRail({}).test({level:'intermediaire',sports:['surf']}),false);
  assert.equal(debutRail({}).test({level:'debutant',sports:['kitesurf']}),false);
  const gauge=n=>({dangerGauge:()=>n===undefined?undefined:{n,basis:'catalogue'}});
  assert.equal(debutRail(gauge(4)).test(surf),false);
  assert.equal(debutRail(gauge(3)).test(surf),false);
  assert.equal(debutRail(gauge(2)).test(surf),true);
  assert.equal(debutRail(gauge(1)).test(surf),true);
  assert.equal(debutRail(gauge(0)).test(surf),true);
  assert.equal(debutRail(gauge(null)).test(surf),true,'fiche sans danger listé');
  assert.equal(debutRail(gauge(undefined)).test(surf),true);
});

test('accueil : le rail du mois et le toast parlent d’un repère indicatif, pas de « meilleure saison »',()=>{
  assert.ok(!/meilleure saison pour ces spots/.test(feed));
  assert.ok(feed.includes('Repère indicatif d’après nos carnets et les moyennes climatiques, à confirmer sur place.'));
  assert.ok(feed.includes('spots où nos carnets et les moyennes climatiques s’accordent ce mois-ci'));
  assert.ok(!/spots en saison ce mois-ci`/.test(feed));
  /* un seul fichier de saisons au démarrage : pas de requête de plus */
  assert.deepEqual([...new Set(feed.match(/data\/[\w-]+\.json/g).filter(f=>/season/.test(f)))],['data/seasons.json']);
});

/* ---------- « Le spot » (fiche v2) : plus de tuile « La bonne saison » ---------- */
function spirit(culture,cultures){
  const src=text('spot-guide.js'),i=src.indexOf('function spiritHTML('),j=src.indexOf('/* ---------- À découvrir autour');
  assert.ok(i>0&&j>i,'spiritHTML introuvable');
  const ctx=vm.createContext({culture:()=>culture,spotPhotoUrl:()=>'photo.jpg',country:()=>'France',esc:v=>String(v??''),NT:' translate="no" data-no-i18n',icon:()=>'',svg:(b,c)=>`<svg class="${c}"></svg>`,P:{speech:''},OceanCultures:cultures});
  vm.runInContext(src.slice(i,j)+';this.spiritHTML=spiritHTML;',ctx);
  return ctx.spiritHTML({id:'x'});
}
/* « Le spot, en vie » (20 nov.) : le bloc de tête de l’onglet, rendu par liveHTML avec des données factices. */
function liveBlock(culture,cultures,over={}){
  const src=text('spot-guide.js'),i=src.indexOf('  const ILLU=k=>'),j=src.indexOf('  /* Les chiffres comptent jusqu’à leur valeur');
  assert.ok(i>0&&j>i,'liveHTML introuvable');
  const est={type:'camping',label:'Camping',lo:12,hi:25,peakLo:16,peakHi:30,peak:[7,8],alt:{label:'Auberge de jeunesse',lo:25,hi:40},town:''};
  const ctx=vm.createContext({culture:()=>culture,country:()=>'France',esc:v=>String(v??''),NT:' translate="no" data-no-i18n',svg:()=>'<svg></svg>',P:{},lab:e=>e.label,LG:()=>'fr',
    estimate:()=>('est' in over?over.est:est),allSpots:()=>[{id:'a'},{id:'b'},{id:'c'},{id:'d',custom:true}],coordsOf:()=>({lat:43.66,lon:-1.44}),place:()=>'Hossegor, France',tripDates:()=>null,
    M:{monthName:()=>'novembre',monthsLabel:()=>'juillet et août',euros:r=>r.lo===r.hi?`${r.lo} €`:`${r.lo}–${r.hi} €`,cheaperThan:(v,all)=>Math.round(all.filter(x=>x>v).length/all.length*100),EDITION:'septembre 2026',
      searchQueries:(lang,sport)=>({hotels:'hôtels pas chers',school:('école '+sport).trim(),rental:('location matériel '+sport).trim(),restaurants:'restaurants'}),
      searchLinks:()=>({booking:'https://www.booking.com/searchresults.html?ss=Hossegor',camping:'https://www.google.com/maps/search/camping'})},
    window:{OCEAN_CLIMATE_LITE:'lite' in over?over.lite:{x:[[13,12,12,14,16,19,21,22,21,18,16,14],[],[],[],[],[23,26,23,17,14,12,13,13,15,18,24,25],[]]},OB_LOCALE:'fr-FR',OCEAN_SPOT_EXTRAS:over.extras},
    OceanCultures:cultures,Date,Number,Math,encodeURIComponent,SPORTMAP:{surf:{label:'Surf'}},spotSports:()=>['surf']});
  vm.runInContext(src.slice(i,j)+';this.liveHTML=liveHTML;',ctx);
  return ctx.liveHTML({id:over.id||'x',waterType:over.water||'sea',sports:['surf']});
}
test('« Le spot » : la saison se lit dans l’onglet Saisons ; le mot du coin, le plat et la page du pays sont dans « Ici, on vit comme ça »',()=>{
  const full={season:'De mai à octobre : test',respect:'Sois discret.',food:['Plat','Description'],hello:['Bonjour','pour saluer'],vibe:'Ambiance.',grounded:true};
  const html=spirit(full,{discover:c=>'Découvrir la '+c});
  /* L’esprit du lieu ne garde que le bon geste : ni saison, ni photo, ni ligne de culture en double. */
  assert.doesNotMatch(html,/La bonne saison|De mai à octobre|Repère indicatif|<img|Ambiance|guide-chapter|01|sg-cult|<button /);
  assert.match(html,/<h3 class="fx-title fx-title-s">Le bon geste<\/h3><p class="fx-text" translate="no" data-no-i18n>Sois discret\.<\/p>/);
  /* Ici, on vit comme ça : seulement ce que le carnet contient, et un seul bouton vers la page culture du pays. */
  const live=liveBlock(full,{discover:c=>'Découvrir la '+c});
  assert.match(live,/<h3 class="fx-title">Ici, on vit comme ça<\/h3><p class="fx-text gl-vibe" translate="no" data-no-i18n>Ambiance\.<\/p>/);
  assert.match(live,/<span class="fx-label">Le mot du coin<\/span><b translate="no" data-no-i18n>«&nbsp;Bonjour&nbsp;»<\/b><small translate="no" data-no-i18n>pour saluer<\/small>/);
  assert.match(live,/<span class="fx-label">À goûter<\/span><b translate="no" data-no-i18n>Plat<\/b><small translate="no" data-no-i18n>Description<\/small>/);
  assert.equal((live.match(/data-cult-open=/g)||[]).length,1);
  assert.match(live,/<button type="button" data-cult-open="France" data-cult-from="spot">/);
  assert.match(live,/<b translate="no" data-no-i18n>Découvrir la France<\/b>/);
  assert.doesNotMatch(live.replace(/<[^>]+>/g,' '),/·/,'aucune chaîne reliée par des points médians');
  assert.doesNotMatch(live,/La fête|Festival/i,'aucune fête inventée : le carnet n’en contient pas');
  /* Sans module culture : pas de bouton ; repères généraux du pays : la note le dit. */
  const plain=liveBlock({...full,grounded:false},undefined);
  assert.doesNotMatch(plain,/data-cult-open/);
  assert.match(plain,/Repères culturels généraux du pays\. La fiche détaillée de ce spot arrive bientôt\./);
});
test('« Le spot, en vie » : grands chiffres seulement s’il y a une donnée, échelle de prix calculée, raccourcis qui sont de vrais liens',()=>{
  const c={hello:['Bonjour'],food:['Plat'],grounded:true};
  const html=liveBlock(c,undefined);
  /* Normales du mois en cours (fichier léger) : eau, houle ; prix de la nuit la moins chère. */
  const m=new Date().getMonth(),sea=[13,12,12,14,16,19,21,22,21,18,16,14][m],hs=[23,26,23,17,14,12,13,13,15,18,24,25][m]/10;
  assert.match(html,new RegExp(`data-gl-go="saisons"[^>]*>.*?<span>Eau en</span> <span translate="no" data-no-i18n>novembre</span>.*?data-gl-count="${sea}" data-gl-dec="0"`));
  assert.match(html,new RegExp(`<span>Houle en</span>.*?data-gl-count="${hs}" data-gl-dec="1"`));
  assert.match(html,/data-gl-go="dormir".*?<span class="fx-label">La nuit, dès<\/span>.*?data-gl-count="12"/);
  assert.match(html,/class="gl-tiles gl-n3"/);
  /* Plan d’eau intérieur : pas de houle. Sans normales : seule la tuile du prix. */
  assert.doesNotMatch(liveBlock(c,undefined,{water:'lake'}),/Houle en/);
  const bare=liveBlock(c,undefined,{lite:{}});
  assert.doesNotMatch(bare,/Eau en|Houle en/); assert.match(bare,/class="gl-tiles gl-n1"/);
  /* Budget : sans indice de prix du pays (données pas encore chargées, ou pays sans valeur), ni échelle ni pourcentage ;
     les estimations de la nuit restent, avec leur mention. L’échelle ne compare plus les barèmes Ocean Buddy entre spots. */
  assert.match(html,/<h3 class="fx-title">Budget sur place<\/h3>/);
  assert.doesNotMatch(html,/gl-scale|gl-pin|gl-pli|des spots du guide/);
  assert.match(html,/Camping<\/span><b translate="no" data-no-i18n>12–25 €<\/b>/);
  assert.match(html,/<span>En haute saison<\/span> <small translate="no" data-no-i18n>juillet et août<\/small><\/span><b translate="no" data-no-i18n>16–30 €<\/b>/);
  assert.match(html,/Auberge de jeunesse<\/span><b translate="no" data-no-i18n>25–40 €<\/b>/);
  assert.match(html,/<p class="fx-note gl-src">Estimation indicative Ocean Buddy \(septembre 2026\), les prix varient selon la saison\.<\/p>/);
  /* Aucun prix d’hôtel ni de restaurant : nous n’en avons pas de sourcé. */
  assert.doesNotMatch(html,/Hôtel|H[oô]tel<\/span><b/);
  assert.doesNotMatch(html,/Restaurants?<\/span><b/);
  /* Raccourcis : Booking.com mène à booking.com ; école, location et restaurants cherchent autour du spot. */
  assert.match(html,/<a class="gl-link" href="https:\/\/www\.booking\.com\/searchresults\.html\?ss=Hossegor" target="_blank" rel="noopener">.*?<span translate="no" data-no-i18n>Booking\.com<\/span><\/a>/);
  assert.match(html,/href="https:\/\/www\.google\.com\/maps\/search\/restaurants\/@43\.6600,-1\.4400,13z"[^>]*>.*?<span>Restaurants<\/span>/);
  assert.match(html,/maps\/search\/%C3%A9cole%20Surf\/@43\.6600,-1\.4400,13z/);
  assert.match(html,/maps\/search\/location%20mat%C3%A9riel%20Surf\/@/);
  assert.match(html,/<span>Campings<\/span>/);
  /* Sans estimation : ni tuile de prix ni budget, les raccourcis restent. */
  const none=liveBlock(c,undefined,{est:null});
  assert.doesNotMatch(none,/Budget sur place|La nuit, dès/); assert.match(none,/Booking\.com/);
  /* Motion : une fois par spot, jamais en mouvement réduit ; précisions rangées en pied de fiche. */
  const src=text('spot-guide.js'),css=text('fiche.css');
  assert.match(src,/paintLive\(s,lastLive!==s\.id\);lastLive=s\.id;/);
  assert.match(src,/const still=document\.body\.classList\.contains\('reduce-motion'\)\|\|\(window\.matchMedia&&matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\)/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)\{#detail #guideLive :is\(\.gl-tile,\.gl-card,\.gl-pin\)\{animation:none!important\}/);
  assert.match(css,/body\.reduce-motion #detail #guideLive :is\(\.gl-tile,\.gl-card,\.gl-pin\)\{animation:none!important\}/);
  /* Section « Le spot, en vie » seulement (la scène de Conditions, plus bas, a sa propre règle : boucle douce à l’écran). */
  assert.doesNotMatch(css.slice(css.indexOf('LE SPOT, EN VIE'), css.indexOf('SCÈNE ILLUSTRÉE DE CONDITIONS')), /animation:[^;}]*infinite/);
  /* 20 nov. : les prix sont des barèmes par pays sans source ; leur mention d’estimation reste à côté des prix. */
  assert.match(text('replis.js'),/'#guideLive \.gl-links-src', '#guideLive \.guide-note'/);
  assert.doesNotMatch(text('replis.js'),/'#guideLive \.gl-src'/,'l’estimation des prix n’est jamais rangée dans « Sources et précisions »');
  /* La houle du mois : seulement pour les sports de vague ou de vent (pas sur un spot de plongée ou un lac). */
  assert.match(text('spot-guide.js'),/swellSport=sportsOf\.some\(a=>\['surf','bodyboard','kitesurf','windsurf','wingfoil','foil'\]\.includes\(a\)\);\n\s+if\(n&&n\.hs!=null&&swellSport\)tiles\.push/);
  for(const f of ['eau','houle','cabane','table','panneau','accueil','fete','coutume','marche'])assert.ok(fs.existsSync(path.join(__dirname,'..','assets/fiche',f+'.webp')),f);
});

/* 21 nov. : niveau des prix du pays (Banque mondiale, sourcé) et lieux autour du spot (OpenStreetMap). */
const EXTRAS={osm:{extracted:'2026-11-20',license:"Données © les contributeurs d'OpenStreetMap, sous licence ODbL",source:'https://www.openstreetmap.org/copyright'},
  places:{hossegor:{R:[['Makai',270,'','node/1'],['Le Napoli',276,'pizza;regional','node/2']],E:[['Prévent Surf Cool',1145,'surfing','node/3']],r:3000},teahupoo:{R:[['Snack',5400,'','way/4']],r:8000}},
  prix:{meta:{name:'Banque mondiale, WDI',url:'https://data.worldbank.org/indicator/PA.NUS.PRVT.PLI',license:'CC BY 4.0',consulted:'2026-11-20'},c:{France:[82.8,2025,'FR'],Suisse:[128.2,2025,'CH'],Indonésie:[30.7,2025,'ID'],Portugal:[64.9,2025,'PT']}}};
test('« Sur place » : niveau des prix du pays sourcé, échelle parmi les pays du guide, lieux OpenStreetMap sans note ni prix',()=>{
  const c={hello:['Bonjour'],food:['Plat'],grounded:true};
  const html=liveBlock(c,undefined,{extras:EXTRAS,id:'hossegor'});
  /* France 82,8 : deux pays moins chers sur quatre (50 %), un plus cher (25 %). */
  assert.match(html,/<div class="gl-pli"><b class="fx-num" translate="no" data-no-i18n>83&nbsp;%<\/b><span class="gl-pli-tx"><span>du coût de la vie aux États-Unis<\/span><small><span>France<\/span>, <span>Banque mondiale<\/span> <span translate="no" data-no-i18n>2025<\/span><\/small><\/span><\/div>/);
  assert.match(html,/<i class="gl-pin" style="--p:50%"><\/i>/);
  assert.match(html,/<span>Plus cher que<\/span> <b translate="no" data-no-i18n>50&nbsp;%<\/b> <span>des pays du guide<\/span>/);
  assert.match(html,/<p class="fx-note gl-pli-src">.*href="https:\/\/data\.worldbank\.org\/indicator\/PA\.NUS\.PRVT\.PLI".*licence CC BY 4\.0, consultée le<\/span> <span translate="no" data-no-i18n>20\/11\/2026<\/span>/);
  /* Les estimations de la nuit restent, mention d’estimation visible. */
  assert.match(html,/<p class="fx-note gl-src">Estimation indicative Ocean Buddy/);
  /* Lieux : par catégorie présente, nom hors traduction, étiquette connue, distance « à environ », lien OSM. */
  assert.match(html,/<h3 class="fx-title">Autour du spot<\/h3><p class="fx-note gl-around-sub">Dans un rayon de 3 km<\/p>/);
  assert.match(html,/<h4 class="fx-label gl-around-h">Pour manger<\/h4>/);
  assert.match(html,/<h4 class="fx-label gl-around-h">Écoles et clubs<\/h4>/);
  assert.doesNotMatch(html,/Location et boutiques/,'catégorie vide : rien');
  assert.match(html,/<a class="gl-place" href="https:\/\/www\.openstreetmap\.org\/node\/2" target="_blank" rel="noopener noreferrer">.*?<b translate="no" data-no-i18n>Le Napoli<\/b><small>Pizzas<\/small><small class="gl-place-d">à environ 300 m<\/small>/);
  assert.match(html,/<b translate="no" data-no-i18n>Prévent Surf Cool<\/b><small>Surf<\/small><small class="gl-place-d">à environ 1 km<\/small>/);
  assert.match(html,/Lieux : © les contributeurs d’OpenStreetMap, sous licence ODbL, extraction du<\/span> <span translate="no" data-no-i18n>20\/11\/2026<\/span>/);
  assert.doesNotMatch(html.replace(/<[^>]+>/g,' '),/\b(note|étoiles?|avis|horaires?)\b|\d\s?€.*Makai/i);
  /* Rayon élargi : dit tel quel ; distance en kilomètres avec une décimale. */
  const far=liveBlock(c,undefined,{extras:EXTRAS,id:'teahupoo'});
  assert.match(far,/Dans un rayon de 8 km/); assert.match(far,/à environ 5,5 km/);
  /* Spot sans lieux : pas de bloc ; pays sans indice : ni chiffre ni échelle, et aucune valeur de remplacement. */
  const none=liveBlock(c,undefined,{extras:{...EXTRAS,prix:{...EXTRAS.prix,c:{Suisse:[128.2,2025,'CH']}}},id:'tikehau'});
  assert.doesNotMatch(none,/Autour du spot|gl-pli|gl-scale|des pays du guide/);
  assert.match(none,/Budget sur place/);
  /* Chargement à l’ouverture d’une fiche, jamais au démarrage ; sources rangées dans « Sources et précisions ». */
  const g=text('spot-guide.js');
  assert.match(g,/if\(!window\.OCEAN_SPOT_EXTRAS\)loadExtras\(\)\.then\(\(\)=>\{if\(current===s\.id\)paintLive\(s,false\);\}\);/);
  assert.match(g,/const EXTRAS_URL='assets\/data\/spot-extras\.js\?v=[0-9a-f]{12}';/);
  assert.doesNotMatch(text('index.html'),/spot-extras\.js/,'jamais chargé au démarrage');
  assert.match(text('replis.js'),/'#guideLive \.gl-pli-src', '#guideLive \.gl-osm-src'/);
});

test('build-spot-extras : lieux valides seulement (lien OSM, distance, aucun champ de note ou de prix), pays sans valeur absents',()=>{
  const B=require('../scripts/build-spot-extras.cjs');
  const base={extracted:'2026-11-20',license:"Données © les contributeurs d'OpenStreetMap, sous licence ODbL",source:'https://www.openstreetmap.org/copyright',radiusM:3000};
  const out=B.buildPlaces({...base,spots:{a:{restaurants:[{name:'Ok',lat:1,lon:1,distM:500,osm:'node/9'},{name:'Noté',lat:1,lon:1,distM:200,osm:'node/8',rating:4.5},{name:'Cher',lat:1,lon:1,distM:200,osm:'node/7',price:'€€'},{name:'Sans lien',lat:1,lon:1,distM:100,osm:'http://x'},{name:'Loin',lat:1,lon:1,distM:'3 km',osm:'node/6'}],ecoles:[],locations:[]},vide:{restaurants:[],ecoles:[],locations:[]}}});
  assert.deepEqual(out.spots.a.R,[['Ok',500,'','node/9']]);
  assert.equal(out.spots.a.r,3000);
  assert.ok(!('vide' in out.spots),'spot sans lieu : absent');
  assert.deepEqual(out.dropped.map(x=>x.why),['champ interdit : rating','champ interdit : price','référence OpenStreetMap invalide','distance invalide']);
  assert.throws(()=>B.buildPlaces({...base,license:'',spots:{}}),/ODbL/);
  const pr=B.buildPrices({source:{name:'WDI',url:'https://data.worldbank.org/x',license:'CC BY 4.0',consulted:'2026-11-20'},countries:{FR:{index:82.8,year:2025},XX:{index:'?',year:2025}}},{France:'FR','La Réunion':'RE',Bidon:'XX'});
  assert.deepEqual(pr.countries,{France:[82.8,2025,'FR']});
  assert.deepEqual(pr.dropped.map(x=>x.country),['Bidon']);
  assert.throws(()=>B.buildPrices({source:{url:'http://x',license:'a',consulted:'2026-11-20'},countries:{}},{}),/https/);
  /* Donnée du dépôt : 5 lieux au plus par catégorie, aucun champ interdit, liens OSM valides, indices numériques datés. */
  const d=JSON.parse(text('data/spot-extras.json'));
  for(const [id,p] of Object.entries(d.places))for(const k of ['R','E','L'])if(p[k]){
    assert.ok(p[k].length<=5,id+k);
    for(const x of p[k]){assert.equal(x.length,4);assert.match(x[3],/^(node|way|relation)\/\d+$/);assert.ok(Number.isFinite(x[1]));}
  }
  for(const [n,v] of Object.entries(d.prix.c)){assert.ok(Number.isFinite(v[0])&&v[0]>0,n);assert.ok(Number.isInteger(v[1]),n);}
  for(const n of ['La Réunion','Guadeloupe','Martinique']) assert.ok(!(n in d.prix.c),'pays sans valeur absent : '+n);
  assert.match(d.osm.license,/ODbL/);
});
