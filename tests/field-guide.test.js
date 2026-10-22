/* Fiche pratique : « L'essentiel avant d'y aller » (lignes sourcées et validateur du catalogue), checklists par milieu,
   repère de niveau par sport, avertissement « Grosse houle » du planificateur, repli du carnet dans le voyage. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=JSON.parse(read('data/catalog.json'));
const spot=id=>{const s=catalog.find(x=>x.id===id);assert.ok(s,id);return s;};
const {validate,validateVisit,validateCarnet}=require('../scripts/build-ai-catalog.cjs');

/* ---------- Valideur du catalogue (en mémoire : rien n'est écrit) ---------- */
const src=(over={})=>({u:'https://example.org/page',l:'Office du tourisme',d:'2026-10-20',...over});
const fiche=(over={})=>({id:'essai',editorialStatus:'unverified',tip:'',dangers:[],...over});
const accepts=(over,why)=>assert.doesNotThrow(()=>validateVisit(fiche(over)),why);
const rejects=(over,pattern,why)=>assert.throws(()=>validateVisit(fiche(over)),pattern,why);

test('valideur : la fiche non vérifiée accepte des lignes qui portent leurs propres sources',()=>{
  accepts({visit:{reviewed:'2026-10-20',access:{t:'Tu arrives par l’aéroport de Sorong.',src:[src()]},parking:{t:'Parking à 200 m.',src:[src(),src({u:'https://example.org/autre'})]}}});
  accepts({visit:{reviewed:'2026-10-20',gear:{t:'Eau autour de 28 °C : lycra ou shorty.',src:[src({u:'internal:climate',l:'Normales NOAA OISST 1991-2020'})]}}});
  accepts({visit:{reviewed:'2026-10-20',tide:{t:'x'.repeat(600),src:[src()]}}},'600 caractères au plus');
});

test('valideur : une ligne sans source datée en https est refusée',()=>{
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[]}}},/needs between 1 and 5 sources/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte'}}},/needs between 1 and 5 sources/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({u:'http://example.org/page'})]}}},/https URL/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({u:'javascript:alert(1)'})]}}},/https URL/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({u:'internal:autre'})]}}},/https URL/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({d:'20/10/2026'})]}}},/consultation date/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({d:'2026-02-30'})]}}},/consultation date/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({l:''})]}}},/needs a label/);
  rejects({visit:{reviewed:'2026-10-20',gear:{t:'Texte',src:[src({u:'internal:climate',l:'Normales maison'})]}}},/must name NOAA/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src({quote:'citation'})]}}},/invalid access source/,'les citations restent dans data/sources');
});

test('valideur : texte, clés et date de la fiche',()=>{
  rejects({visit:{reviewed:'2026-10-20',access:{t:'x'.repeat(601),src:[src()]}}},/invalid access text/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'  ',src:[src()]}}},/invalid access text/);
  rejects({visit:{reviewed:'2026-10-20',access:{t:'Texte',src:[src()],extra:1}}},/invalid access/);
  rejects({visit:{reviewed:'2026-10-20',meteo:{t:'Texte',src:[src()]}}},/invalid practical details/);
  rejects({visit:{reviewed:'2026-10-20'}},/invalid practical details/);
  rejects({visit:{access:{t:'Texte',src:[src()]}}},/review date/);
  rejects({visit:null},/review date/);
});

test('valideur : les chaînes historiques gardent l’ancienne règle (fiche reviewed avec source https)',()=>{
  const reviewed={editorialStatus:'reviewed',reviewed:'2026-09-23',source:{label:'DOC',url:'https://www.doc.govt.nz/cathedral-cove-walk'}};
  accepts({...reviewed,visit:{reviewed:'2026-09-23',access:'Depuis Hahei.'}});
  rejects({visit:{reviewed:'2026-09-23',access:'Depuis Hahei.'}},/linked editorial source/,'fiche non vérifiée');
  rejects({...reviewed,source:{label:'DOC',url:'http://www.doc.govt.nz/'},visit:{reviewed:'2026-09-23',access:'Depuis Hahei.'}},/linked editorial source/);
  rejects({...reviewed,visit:{reviewed:'2026-09-23',access:'x'.repeat(601)}},/invalid access/);
  accepts({...reviewed,visit:{reviewed:'2026-09-23',access:'Depuis Hahei.',parking:{t:'Parking.',src:[src()]}}},'les deux formes cohabitent');
});

test('valideur : champ carnet {tip, dangers, status, from}',()=>{
  const carnet={tip:'Les baïnes créent des courants : surfe hors des zones de baignade.',dangers:[['🌀','Les baïnes créent des courants.']],status:'non vérifié',from:'spot-guides.respect'};
  const ok=over=>assert.doesNotThrow(()=>validateCarnet(fiche({carnet:{...carnet,...over}})));
  const ko=(over,pattern)=>assert.throws(()=>validateCarnet(fiche({carnet:{...carnet,...over}})),pattern);
  ok({});ok({dangers:[]});ok({tip:''});
  ko({status:'vérifié'},/non vérifié/);ko({status:undefined},/non vérifié/);ko({from:''},/origin/);
  ko({tip:'x'.repeat(601)},/notebook tip/);ko({tip:undefined},/notebook tip/);
  ko({dangers:'Les baïnes'},/notebook dangers/);ko({dangers:[['🌀']]},/notebook danger/);ko({dangers:[['🌀','']]},/notebook danger/);ko({dangers:[['🌀','a','b']]},/notebook danger/);
  ko({tip:'',dangers:[]},/empty notebook fallback/);
  ko({source:'x'},/invalid notebook fallback/);
  assert.throws(()=>validateCarnet(fiche({carnet:null})),/invalid notebook fallback/);
  assert.doesNotThrow(()=>validateCarnet(fiche()),'sans champ carnet');
});

test('valideur : le catalogue actuel passe, et la fiche sans conseil ni danger avec carnet aussi',()=>{
  assert.doesNotThrow(()=>validate(catalog));
  const copy=JSON.parse(JSON.stringify(catalog));
  const macarella=copy.find(s=>s.id==='macarella');
  macarella.carnet={tip:'Ne piétine pas les herbiers de posidonie.',dangers:[],status:'non vérifié',from:'spot-guides.respect'};
  const hossegor=copy.find(s=>s.id==='hossegor');
  hossegor.visit={reviewed:'2026-10-20',access:{t:'Parking du front de mer.',src:[src()]}};
  assert.doesNotThrow(()=>validate(copy));
  hossegor.visit.access.src[0].u='http://example.org';
  assert.throws(()=>validate(copy),/hossegor: access source needs an https URL/);
});

/* ---------- field-guide.js dans un navigateur factice ---------- */
/* Objet « fantôme » : accepte tout accès, tout appel et toute affectation (le script manipule des dizaines de nœuds au chargement). */
function ghost(){return new Proxy(function(){},{get:(_,k)=>k===Symbol.toPrimitive?()=>'':k==='then'?undefined:ghost(),apply:()=>ghost(),set:()=>true});}
const SPORTMAP=Object.fromEntries(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf'].map(id=>[id,{label:id[0].toUpperCase()+id.slice(1)}]));
function loadGuide(extra={},nodes={}){
  const store=new Map(),handlers={},calls=[];
  const ctx={
    SPOTS:[],SPORTMAP,LVLTXT:{debutant:'Débutant',intermediaire:'Intermédiaire',expert:'Expert',variable:'Niveau à évaluer'},COORDS:{},SPOT_WORLD:{},
    isInland:s=>['lake','inland'].includes(s?.waterType),levelIcon:()=>'',sportIcon:()=>'',currentFilter:'all',renderSpots(){},filterSpots(){},setSport(){},openWorld(){},openSpot(){},
    showDetailCat:(...args)=>calls.push(['showDetailCat',...args]),requestAnimationFrame:fn=>fn(),
    localStorage:{getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value))},
    document:{querySelector:selector=>nodes[selector]||ghost(),querySelectorAll:()=>[],createElement:()=>ghost(),body:{classList:{contains:()=>false}},addEventListener:(type,fn)=>{handlers[type]=fn;}},
    ...extra
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(read('field-guide.js'),ctx,{filename:'field-guide.js'});
  return {guide:ctx.window.OceanFieldGuide,store,nodes,handlers,calls,ctx};
}
const loaded=loadGuide(),G=loaded.guide;
/* Les tableaux venus du contexte vm ne sont pas du même royaume : on les recopie avant deepEqual. */
const plain=value=>JSON.parse(JSON.stringify(value));
const texts=(s,act)=>G.checklist(s,act).map(item=>item.copy+' '+item.label).join(' | ');

test('carte : lignes fixes, forme historique (une chaîne) et forme étendue (texte + sources)',()=>{
  const cove=spot('cathedralcove');
  const rows=G.visitRows(cove);
  assert.deepEqual(plain(rows.map(row=>row.label)),['Accès','Meilleure période','Stationnement','Marée','Matériel','À éviter','Règles locales']);
  assert.deepEqual(plain(rows.filter(row=>row.verified).map(row=>row.key)),['access','bestPeriod','localRules']);
  assert.equal(rows[0].src[0].u,'https://www.doc.govt.nz/cathedral-cove-walk');
  const plainRows=G.visitRows(spot('hossegor'));
  assert.deepEqual(plain(plainRows.map(row=>row.label)),['Accès','Stationnement','Marée','Matériel','À éviter','Règles locales']);
  assert.ok(plainRows.every(row=>!row.verified&&row.value==='À vérifier localement'&&row.src.length===0));
  /* Fiche non vérifiée : la forme historique ne compte pas, la forme étendue oui. */
  const extended={...spot('hossegor'),visit:{reviewed:'2026-10-20',access:'Texte sans source',parking:{t:'Parking à 200 m.',src:[src()]},gear:{t:'Eau autour de 28 °C : lycra ou shorty.',src:[src({u:'internal:climate',l:'Normales NOAA OISST 1991-2020'})]}}};
  const got=G.visitRows(extended);
  assert.deepEqual(plain(got.filter(row=>row.verified).map(row=>row.key)),['parking','gear']);
  assert.equal(got.find(row=>row.key==='access').verified,false);
});

test('carte : une ligne sans source valable n’est jamais vérifiée',()=>{
  const bad=visit=>G.visitRows({...spot('hossegor'),visit:{reviewed:'2026-10-20',...visit}}).filter(row=>row.verified);
  assert.equal(bad({access:{t:'Texte',src:[src({u:'http://example.org'})]}}).length,0);
  assert.equal(bad({access:{t:'Texte',src:[src({d:'hier'})]}}).length,0);
  assert.equal(bad({access:{t:'Texte',src:[src({l:''})]}}).length,0);
  assert.equal(bad({access:{t:'  ',src:[src()]}}).length,0);
  assert.equal(bad({access:{t:'Texte',src:'https://example.org'}}).length,0);
  assert.equal(bad({access:{t:'Texte',src:[src({u:'javascript:alert(1)'})]}}).length,0);
  assert.equal(bad({access:{t:'Texte',src:[src({u:'javascript:alert(1)'}),src()]}}).length,1,'une source valable suffit');
});

test('carte : chaque ligne vérifiée cite ses sources, une ligne absente n’est pas dessinée',()=>{
  const s={...spot('hossegor'),visit:{reviewed:'2026-10-20',
    access:{t:'Tu arrives par <b>l’aéroport</b>.',src:[src()]},
    gear:{t:'Eau autour de 28 °C : lycra ou shorty.',src:[src({u:'internal:climate',l:'Normales NOAA OISST 1991-2020'})]}}};
  const html=G.visitGuide(s);
  assert.match(html,/L’essentiel avant d’y aller/);
  assert.equal((html.match(/<div class="field-visit-row">/g)||[]).length,2);
  assert.match(html,/<dt>Accès<\/dt>/);assert.match(html,/<dt>Matériel<\/dt>/);
  assert.doesNotMatch(html,/<dt>Stationnement<\/dt>|<dt>Marée<\/dt>|<dt>À éviter<\/dt>|<dt>Règles locales<\/dt>/);
  assert.doesNotMatch(html,/À vérifier localement/);
  assert.match(html,/&lt;b&gt;l’aéroport&lt;\/b&gt;/,'le texte est échappé');
  assert.match(html,/<a class="field-visit-source" href="https:\/\/example\.org\/page" target="_blank" rel="noopener noreferrer">Source : Office du tourisme · consultée le 20\/10\/2026<\/a>/);
  assert.match(html,/<span class="field-visit-source" data-src="internal:climate">Source : Normales NOAA OISST 1991-2020 · consultée le 20\/10\/2026<\/span>/);
  assert.equal((html.match(/field-visit-source/g)||[]).length,2,'chaque ligne a sa source');
});

test('carte : mêmes sources partout (anciennes fiches) → une seule mention ; aucune ligne → une ligne compacte',()=>{
  const html=G.visitGuide(spot('cathedralcove'));
  assert.equal((html.match(/<a class="field-visit-source"/g)||[]).length,1);
  assert.match(html,/consultée le 23\/09\/2026/);assert.match(html,/doc\.govt\.nz\/cathedral-cove-walk/);
  const empty=G.visitGuide(spot('hossegor'));
  assert.equal((empty.match(/À vérifier localement/g)||[]).length,1);
  assert.doesNotMatch(empty,/<dl>|<dt>/);
  assert.match(empty,/Les accès, conditions et règles peuvent changer/);
});

/* ---------- Checklists par milieu ---------- */
const ORIGINAL={
  surf:['Lire les conditions','Repérer la session','Vérifier son matériel'],bodyboard:['Lire les conditions','Observer depuis le bord','Vérifier son matériel'],
  plongee:['Choisir la sortie','Préparer le briefing','Organiser le trajet'],snorkeling:['Choisir la zone','Préparer sa sortie','Respecter le récif'],
  paddle:['Dessiner le parcours','Vérifier le vent','Préparer son équipement'],kayak:['Dessiner le parcours','Lire les conditions','Préparer son équipement'],
  baignade:['Choisir la zone','Lire les consignes locales','Prévoir le retour'],kitesurf:['Choisir le créneau','Repérer la zone','Contrôler le matériel'],
  windsurf:['Choisir le créneau','Repérer le retour','Préparer le gréement']
};

test('checklist : les trois premières cases gardent leur rang, les nouvelles vont à la fin (clés id:act:i)',()=>{
  const sea=spot('hossegor');
  for(const [act,labels] of Object.entries(ORIGINAL)){
    const items=G.checklist(sea,act);
    assert.deepEqual(plain(items.slice(0,2).map(item=>item.label)),labels.slice(0,2),act);
    if(act!=='snorkeling')assert.equal(items[2].label,labels[2],act);
    assert.equal(items[3].label,'Prévenir un proche',act);
    assert.equal(items[4].label,'Repérer le numéro d’urgence',act);
    assert.equal(items[4].action,'emergency',act);
  }
  /* Rendu : la case n° 3 garde la clé id:act:2, les nouvelles ont les rangs 3 et 4. */
  const html=G.render(sea,'surf');
  assert.deepEqual([...html.matchAll(/data-visit-check="([^"]+)"/g)].map(m=>m[1]),['hossegor:surf:0','hossegor:surf:1','hossegor:surf:2','hossegor:surf:3','hossegor:surf:4']);
  assert.match(html,/<span id="fieldProgress">0 \/ 5<\/span>/);
});

test('checklist : une case cochée avant la mise à jour reste cochée sur le même sens',()=>{
  const old=loadGuide({localStorage:{getItem:()=>JSON.stringify({'hossegor:surf:2':true}),setItem(){}}});
  const html=old.guide.render(spot('hossegor'),'surf');
  assert.match(html,/data-visit-check="hossegor:surf:2" checked/);
  assert.match(html,/<span id="fieldProgress">1 \/ 5<\/span>/);
  assert.doesNotMatch(html,/data-visit-check="hossegor:surf:[013-9]" checked/);
});

test('checklist : eau douce, rivière ou plan d’eau, jamais de marée, de houle, de côte ni de bateau',()=>{
  const sea=/marée|houle|\bmer\b|côte|plage|bateau|coraux|récif/i;
  const inland=catalog.filter(s=>['lake','inland'].includes(s.waterType));
  assert.ok(inland.length>=40);
  for(const s of inland)for(const act of s.sports){
    const text=texts(s,act).replace('Respecter le récif','');
    assert.doesNotMatch(text,sea,s.id+' '+act+' : '+text);
  }
  const eisbach=texts(spot('eisbach'),'surf');
  assert.match(eisbach,/niveau de l’eau, le courant et la météo/);
  assert.equal(G.medium(spot('eisbach')).water,'riviere');
  assert.equal(G.medium(spot('bourget')).water,'lac');
  assert.match(texts(spot('bourget'),'baignade'),/plan d’eau/);
  assert.equal(G.medium(spot('hossegor')).water,'mer');
});

test('checklist snorkeling : corail, herbier ou fonds selon les textes déjà publiés',()=>{
  const snork=s=>G.checklist(s,'snorkeling')[2];
  assert.match(snork(spot('tulamben')).copy,/coraux/);assert.equal(snork(spot('tulamben')).label,'Respecter le récif');
  /* macarella : le carnet dit « herbiers de posidonie » ; sans carnet publié, le geste reste générique (jamais « coraux »). */
  /* Le carnet de macarella est désormais promu dans le catalogue (herbiers de posidonie) : on le retire pour tester le geste générique. */
  assert.equal(snork(spot('macarella')).label,'Respecter les herbiers');
  const macarella={...spot('macarella'),carnet:undefined};
  assert.doesNotMatch(snork(macarella).copy,/coraux/);
  assert.equal(snork(macarella).label,'Respecter les fonds');
  const respect=JSON.parse(read('data/spot-guides.json')).spots.macarella.respect;
  assert.match(respect,/herbiers de posidonie/);
  const withNotebook={...macarella,carnet:{tip:respect,dangers:[],status:'non vérifié',from:'spot-guides.respect'}};
  assert.equal(G.medium(withNotebook).bed,'herbier');
  assert.equal(snork(withNotebook).label,'Respecter les herbiers');
  assert.match(snork(withNotebook).copy,/piétiner les herbiers/);
  assert.doesNotMatch(texts(withNotebook,'snorkeling'),/coraux|récif/i);
  /* Récif et herbier à la fois, ou eau douce : geste générique. */
  assert.equal(G.medium({...macarella,desc:'Un récif et un herbier.',waterType:'sea'}).bed,'fonds');
  assert.equal(snork(spot('cenote_dosojos')).label,'Respecter les fonds');
  /* « approche » ne vaut pas « roche », « algue » ne vaut pas « galgue » : mots entiers. */
  assert.equal(G.medium({...macarella,desc:'Un galgue et des recifsx.',waterType:'sea'}).bed,'fonds');
});

test('checklist kayak, paddle et rivière : gilet cité par sourceRef vers data/sources/schemas.json',()=>{
  for(const [id,act] of [['pontdarc','kayak'],['bourget','paddle'],['hossegor','kayak'],['eisbach','surf']]){
    const items=G.checklist(spot(id),act);
    const vest=items.find(item=>item.sourceRef);
    assert.ok(vest,id+' '+act);
    assert.equal(items.indexOf(vest),5,'à la fin, après les cases communes');
    assert.equal(vest.copy,'Porte un gilet ou une aide à la flottabilité marquée CE.');
    assert.equal(vest.sourceRef,'data/sources/schemas.json#schema.riviere.consigne1');
    assert.equal(vest.src.length,3);
    for(const x of vest.src){assert.match(x.u,/^https:\/\//);assert.match(x.d,/^\d{4}-\d{2}-\d{2}$/);assert.ok(x.l);}
  }
  const html=G.render(spot('pontdarc'),'kayak');
  assert.match(html,/ffck\.org\/nos-sites\/reglementation\/prevention\//);
  assert.match(html,/firescotland\.gov\.uk/);assert.match(html,/watersafetyscotland\.org\.uk/);
  assert.equal((html.match(/Source : /g)||[]).length,3);
  assert.match(html,/data-visit-check="pontdarc:kayak:5"/);
  /* Ni baigneur en rivière (consigne DLRG sans gilet), ni surf en mer. */
  assert.equal(G.checklist(spot('pontdarc'),'baignade').some(item=>item.sourceRef),false);
  assert.equal(G.checklist(spot('hossegor'),'surf').some(item=>item.sourceRef),false);
  /* Le fichier de sources (écrit par le groupe des schémas) cite bien ces trois URL, quand il est présent. */
  const file=path.join(root,'data/sources/schemas.json');
  if(fs.existsSync(file)){
    const raw=fs.readFileSync(file,'utf8');
    assert.match(raw,/schema\.riviere\.consigne1/);
    for(const x of G.checklist(spot('pontdarc'),'kayak')[5].src)assert.ok(raw.includes(x.u),x.u);
  }
});

test('checklist : la case « numéro d’urgence » mène à #dEmerg (onglet Conditions)',()=>{
  const html=G.render(spot('hossegor'),'surf');
  assert.match(html,/<button type="button" class="field-check-go" data-field-action="emergency">Voir le numéro d’urgence<\/button>/);
  assert.equal((html.match(/data-field-action="emergency"/g)||[]).length,1);
  const scrolls=[],view=loadGuide({},{'#dEmerg':{scrollIntoView:opts=>scrolls.push(opts)}});
  view.handlers.click({target:{closest:selector=>selector==='[data-field-action]'?{dataset:{fieldAction:'emergency'}}:null}});
  assert.deepEqual(plain(view.calls),[['showDetailCat','meteo',false]]);
  assert.deepEqual(plain(scrolls),[{block:'center',behavior:'smooth'}]);
});

test('checklist : cocher une case l’enregistre sous id:activité:rang',()=>{
  const view=loadGuide();
  view.handlers.change({target:{dataset:{visitCheck:'hossegor:surf:3'},checked:true}});
  assert.deepEqual(JSON.parse(view.store.get('oceanbuddy_visit_checklist_v1')),{'hossegor:surf:3':true});
  view.handlers.change({target:{dataset:{visitCheck:'hossegor:surf:3'},checked:false}});
  assert.deepEqual(JSON.parse(view.store.get('oceanbuddy_visit_checklist_v1')),{});
});

/* ---------- Repère de niveau par sport ---------- */
test('niveau : « débutant » devient « Accessible aux débutants encadrés » en plongée, kite et planche',()=>{
  const level=(s,act)=>G.facts(s,act).find(([k])=>k==='Repère de niveau')?.[1];
  const dakhla=spot('dakhla');
  assert.equal(dakhla.level,'debutant');
  assert.equal(level(dakhla,'kitesurf'),'Accessible aux débutants encadrés');
  assert.equal(level(dakhla,'windsurf'),'Accessible aux débutants encadrés');
  assert.equal(level(spot('tulamben'),'plongee'),'Accessible aux débutants encadrés');
  assert.equal(spot('tulamben').level,'debutant');
  assert.equal(level(spot('tulamben'),'snorkeling'),'Débutant','le snorkeling garde « Débutant »');
  assert.equal(level({...dakhla,level:'intermediaire'},'kitesurf'),'Intermédiaire');
  assert.equal(level({...dakhla,level:'debutant'},'surf'),'Débutant','surf et baignade ne changent pas');
  assert.equal(level({...dakhla,level:'debutant'},'baignade'),'Débutant');
  assert.equal(G.facts({...dakhla,level:'variable'},'kitesurf').some(([k])=>k==='Repère de niveau'),false);
});

test('niveau : plongée en caverne (cenote_dosojos, grancenote) à confirmer avec un centre, niveau du catalogue inchangé',()=>{
  for(const id of ['cenote_dosojos','grancenote']){
    const s=spot(id);
    assert.equal(s.level,'debutant','le catalogue n’est pas modifié');
    assert.equal(G.levelNote(s,'plongee'),'Niveau à confirmer avec un centre local');
    assert.equal(G.facts(s,'plongee').find(([k])=>k==='Repère de niveau')[1],'Niveau à confirmer avec un centre local');
    assert.equal(G.levelNote(s,'snorkeling'),'');
    assert.equal(G.facts(s,'snorkeling').find(([k])=>k==='Repère de niveau')[1],'Débutant');
  }
  assert.equal(G.levelNote(spot('tulamben'),'plongee'),'Accessible aux débutants encadrés');
  const html=G.render(spot('cenote_dosojos'),'plongee');
  assert.match(html,/<dt>Repère de niveau<\/dt><dd>Niveau à confirmer avec un centre local<\/dd>/);
});

test('légende de la jauge : une ligne sous le compteur, visible avec les points de la liste',()=>{
  const inserted=[];
  loadGuide({},{'#spotResultCount':{insertAdjacentHTML:(where,html)=>inserted.push([where,html])}});
  assert.equal(inserted.length,1);
  assert.equal(inserted[0][0],'afterend');
  assert.match(inserted[0][1],/id="spotDangerLegend"[^>]*>Points de danger : estimation Ocean Buddy d’après les dangers listés<\/p>/);
  const css=read('field-guide.css').replace(/\/\*[\s\S]*?\*\//g,'');
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  assert.ok(!rules.some(m=>/\.field-danger-legend/.test(m[1])&&/display:none/.test(m[2])),'la légende n’est plus masquée');
  const show=rules.find(m=>/\.ocean-v2 \.spot \.danger-dots(,|$)/.test(m[1].trim())&&/display:flex/.test(m[2]));
  assert.ok(show,'les points sont rendus visibles dans la liste (l’emporte sur design.css)');
});

test('onglet Le spot : colonne flex, ordre Quand partir, conseil, essentiel, danger principal, description',()=>{
  const css=read('field-guide.css').replace(/\/\*[\s\S]*?\*\//g,'');
  const order=sel=>{const m=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(r=>r[1].trim().endsWith('>'+sel)&&/order:\d+/.test(r[2]));return m&&+m[2].match(/order:(\d+)/)[1];};
  const seq=['#dSeasonTeaser','.field-tip','.field-visit','.field-main-danger','.field-story'].map(order);
  assert.ok(seq.every(Number.isInteger),'chaque bloc a un order : '+seq);
  assert.deepEqual([...seq].sort((a,b)=>a-b),seq,'ordre croissant');
  assert.equal(new Set(seq).size,seq.length);
  assert.match(css,/\.dcat\[data-cat="infos"\]\.field-overview:not\(\[style\*="none"\]\)\{display:flex;flex-direction:column/);
});

/* ---------- Planificateur : « Grosse houle » ---------- */
function el(){
  const kids={},attrs={},listeners={};
  return {hidden:false,innerHTML:'',className:'',dataset:{},style:{},attrs,listeners,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    querySelector(s){return kids[s]||(kids[s]=el());},querySelectorAll(){return [];},contains(){return true;},
    setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},addEventListener(t,fn){listeners[t]=fn;},
    getContext(){return {clearRect(){},beginPath(){},arc(){},fill(){}};},append(){},remove(){},focus(){},closest(){return null;},get isConnected(){return false;}};
}
function loadPlan(){
  const handlers={},made=[];
  const body=el();
  body.append=(...nodes)=>made.push(...nodes);
  const ctx={
    document:{body,activeElement:null,createElement:()=>el(),addEventListener:(type,fn)=>{handlers[type]=fn;},getElementById:()=>null},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},requestAnimationFrame:fn=>fn(),setTimeout:()=>0,Intl,Date,console,
    SpotDataModel:require('../spot-data-model.js')
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(read('spot-plan.js'),ctx,{filename:'spot-plan.js'});
  return {plan:ctx.window.OceanPlan,handlers,made};
}

test('planificateur : « Grosse houle » affiche un avertissement fixe, à hauteur réservée',()=>{
  const {plan,handlers,made}=loadPlan();
  plan.open();
  const sheet=made[1];
  const html=sheet.innerHTML;
  assert.match(html,/<p class="sd-plan-warn" id="sdBigWarn" data-plan-warn role="note" aria-hidden="true">Grosse houle : pour pratiquants confirmés\. Vérifie ton niveau et les conditions sur place\.<\/p>/);
  assert.match(html,/data-plan-c="big"[^>]*aria-describedby="sdBigWarn"/);
  assert.ok(html.indexOf('data-plan-warn')>html.indexOf('data-plan-c="big"')&&html.indexOf('data-plan-warn')<html.indexOf('sd-sheet-foot'),'sous les envies');
  const warn=sheet.querySelector('[data-plan-warn]');
  const click=(selector,extra={})=>handlers.click({target:{closest:s=>s===selector?{dataset:{planC:'big'},setAttribute(){},...extra}:null}});
  click('[data-plan-c]');
  assert.equal(warn.attrs['aria-hidden'],'false');
  click('[data-plan-c]');
  assert.equal(warn.attrs['aria-hidden'],'true');
  click('[data-plan-c]');
  assert.equal(warn.attrs['aria-hidden'],'false');
  click('[data-plan-clear]');
  assert.equal(warn.attrs['aria-hidden'],'true');
  assert.match(read('spot-plan.js'),/window\.OceanPlan = \{[^\n]*\bisOpen\b/,'le Retour garde isOpen et close');
});

test('planificateur : l’avertissement garde sa hauteur (visibility), sans couleur codée en dur ni texte sous 12 px',()=>{
  const css=read('field-guide.css').replace(/\/\*[\s\S]*?\*\//g,'');
  const rule=css.match(/\.sd-plan-warn\{([^}]*)\}/)[1];
  assert.doesNotMatch(rule,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  assert.match(css,/\.sd-plan-warn\[aria-hidden="true"\]\{visibility:hidden\}/);
  assert.doesNotMatch(css,/\.sd-plan-warn\[aria-hidden="true"\]\{[^}]*display:none/);
  const size=rule.match(/font:\d+ (\d+(?:\.\d+)?)px/)[1];
  assert.ok(Number(size)>=12);
});

test('field-guide.css : les règles ajoutées gardent les jetons --t-* et les tailles lisibles',()=>{
  const css=read('field-guide.css').replace(/\/\*[\s\S]*?\*\//g,'');
  const added=['.field-danger-legend','.field-visit-cites .field-visit-source','.field-check-go','.sd-plan-warn'];
  for(const selector of added){
    const rule=css.split('}').find(block=>block.trim().startsWith(selector+'{')||block.includes('\n'+selector+'{'));
    assert.ok(rule,selector);
    assert.doesNotMatch(rule,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,selector);
    const px=[...rule.matchAll(/(?:font-size:|font:\d+ )(\d+(?:\.\d+)?)px/g)].map(m=>Number(m[1]));
    for(const value of px)assert.ok(value>=(selector.includes('field-visit-source')?11:12),selector+' '+value);
  }
});

/* ---------- Voyage : repli du carnet ---------- */
function loadVoyage(){
  const scenes=[1,2,3,4].map(i=>({src:`s${i}.webp`,title:`Scène ${i}`,caption:''}));
  const sandbox={
    document:{body:el(),documentElement:el(),createElement:()=>el(),activeElement:null,addEventListener(){},getElementById:()=>null},
    matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},performance:{now:()=>0},console,
    Image:function(){return el();},innerWidth:400,innerHeight:800,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},removeEventListener(){},
    OCEAN_SCENES:{x:scenes},fetch:()=>Promise.reject(new Error('hors ligne'))
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('spot-voyage.js'),sandbox,{filename:'spot-voyage.js'});
  let rootEl=null;
  sandbox.document.body.append=r=>{rootEl=r;};
  return {open:s=>{sandbox.OceanVoyage.open(s);},cards(count){
    const out=[];
    for(let i=0;i<count;i++){out.push(rootEl.querySelector('[data-card]').innerHTML);rootEl.listeners.keydown({key:'ArrowRight',target:{closest:()=>null},preventDefault(){}});}
    return out;
  }};
}
const base={id:'x',name:'Spot',loc:'Lieu',desc:'Description du lieu.',sports:['surf']};
const notebook={tip:'Les baïnes créent des courants qui t’entraînent vers le large.',dangers:[['🌀','Les baïnes créent des courants qui t’entraînent vers le large.']],status:'non vérifié',from:'spot-guides.respect'};

test('voyage : sans conseil ni danger, le carnet remplace, étiqueté « non vérifié »',()=>{
  const v=loadVoyage();
  v.open({...base,tip:'',dangers:[],carnet:notebook});
  const [arrival,tip,danger]=v.cards(3);
  assert.match(arrival,/<span>Arrivée<\/span>/);
  assert.match(tip,/<span>Carnet Ocean Buddy · non vérifié<\/span>/);
  assert.match(tip,/<h2>Le conseil du carnet<\/h2>/);
  assert.match(tip,/<p>Les baïnes créent des courants qui t’entraînent vers le large\.<\/p>/);
  assert.doesNotMatch(tip,/Le conseil de Poulpy|<span>Poulpy<\/span>/,'le carnet n’est jamais présenté comme le conseil de Poulpy');
  assert.match(danger,/<span>Carnet Ocean Buddy · non vérifié<\/span>/);
  assert.match(danger,/<h2>🌀 Les baïnes créent des courants qui t’entraînent vers le large<\/h2>/);
});

test('voyage : le conseil et les dangers du catalogue passent avant le carnet, qui sans « non vérifié » est ignoré',()=>{
  const v=loadVoyage();
  v.open({...base,tip:'Loge chez l’habitant.',dangers:[['⚠️','Courants forts.']],carnet:notebook});
  const [,tip,danger]=v.cards(3);
  assert.match(tip,/<span>Poulpy<\/span>/);assert.match(tip,/<h2>Le conseil de Poulpy<\/h2>/);assert.match(tip,/<p>Loge chez l’habitant\.<\/p>/);
  assert.doesNotMatch(tip,/baïnes/);
  assert.match(danger,/<span>À surveiller<\/span>/);assert.match(danger,/Courants forts\./);
  const w=loadVoyage();
  w.open({...base,tip:'',dangers:[],carnet:{...notebook,status:'vérifié'}});
  const cards=w.cards(3);
  assert.ok(cards.every(card=>!/baïnes|Carnet Ocean Buddy/.test(card)));
  const x=loadVoyage();
  x.open({...base,tip:'',dangers:[['⚠️','Courants forts.']],carnet:notebook});
  const [,first,second]=x.cards(3);
  assert.match(first,/<span>Carnet Ocean Buddy · non vérifié<\/span>/,'le conseil vient du carnet');
  assert.match(second,/<span>À surveiller<\/span>/,'les dangers du catalogue restent « À surveiller »');
  assert.match(second,/Courants forts\./);
});
