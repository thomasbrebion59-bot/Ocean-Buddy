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

/* ---------- Tuile « La bonne saison » ---------- */
function spirit(culture){
  const src=text('spot-guide.js'),i=src.indexOf('function spiritHTML('),j=src.indexOf('/* ---------- À découvrir autour');
  assert.ok(i>0&&j>i,'spiritHTML introuvable');
  const ctx=vm.createContext({culture:()=>culture,spotPhotoUrl:()=>'',country:()=>'France',esc:v=>String(v??''),NT:' translate="no" data-no-i18n',icon:()=>''});
  vm.runInContext(src.slice(i,j)+';this.spiritHTML=spiritHTML;',ctx);
  return ctx.spiritHTML({id:'x'});
}
test('« La bonne saison » : la mention indicative est sous le texte, hors du bloc translate="no"',()=>{
  const html=spirit({season:'De mai à octobre : test',respect:'Sois discret.',food:['Plat','Description'],grounded:true});
  const note='<span class="guide-note">Repère indicatif, à confirmer localement.</span>';
  assert.equal(html.split(note).length-1,1,'une seule mention');
  assert.match(html,/La bonne saison<\/small><p translate="no" data-no-i18n>De mai à octobre : test<\/p><span class="guide-note">Repère indicatif, à confirmer localement\.<\/span><\/article>/);
  /* pas de saison, pas de mention ; les autres tuiles n’en ont pas */
  const sans=spirit({respect:'Sois discret.',food:['Plat','Description'],grounded:true});
  assert.ok(!sans.includes('Repère indicatif'));
});
