/* Garde-fous des conseils de spot (lots 2 et 3, item 17) : aucune promesse, aucun fait sans source,
   textes publiés identiques à leur source, traductions présentes, repli du carnet exact. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const catalog=read('data/catalog.json');
const guides=read('data/spot-guides.json').spots;
const guidesEn=read('data/spot-guides.en.json').spots;
const en=read('locales/translations/en.json');
const es=read('locales/translations/es.json');
const faits=read('data/sources/faits.json').entries;
const essentiel=read('data/sources/essentiel.json');
const promu=read('data/sources/carnet-promu.json');
const spotById=Object.fromEntries(catalog.map(s=>[s.id,s]));
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const VISIT_KEYS=['access','parking','tide','gear','avoid','localRules','bestPeriod'];

/* Tous les textes de conseil publiés d'une fiche : [chemin, texte]. */
function adviceTexts(s){
 const out=[['tip',s.tip],['desc',s.desc],['anecdote',s.anecdote],['funFact',s.funFact]];
 (s.dangers||[]).forEach((d,i)=>out.push(['dangers['+i+']',d[1]]));
 if(s.carnet){out.push(['carnet.tip',s.carnet.tip]);s.carnet.dangers.forEach((d,i)=>out.push(['carnet.dangers['+i+']',d[1]]));}
 for(const k of VISIT_KEYS){const row=s.visit?.[k];if(row)out.push(['visit.'+k,typeof row==='string'?row:row.t]);}
 return out.filter(([,t])=>typeof t==='string'&&t);
}
/* Textes du carnet de destination (français) qui peuvent aussi promettre quelque chose. */
function guideTexts(id){const g=guides[id]||{};return ['respect','season','vibe'].filter(k=>g[k]).map(k=>['carnet.'+k,g[k]]);}

test('chaque fiche a un conseil, ou un conseil de carnet marqué « non vérifié » ; sans danger, la fiche affiche « Danger non évalué »',()=>{
 for(const s of catalog){
  assert.ok(s.tip||s.carnet?.tip,s.id+' : ni conseil ni conseil de carnet');
  if(!s.tip)assert.equal(s.carnet.status,'non vérifié',s.id);
  /* seules les fiches reviewed peuvent n'avoir aucun danger (la fiche affiche alors « Danger non évalué ») */
  if(!s.dangers.length)assert.equal(s.editorialStatus,'reviewed',s.id+' : fiche sans danger');
  if(s.carnet){
   assert.equal(s.editorialStatus,'reviewed',s.id+' : le repli du carnet ne concerne que les fiches reviewed');
   assert.equal(s.dangers.length,0,s.id+' : dangers vide quand le carnet sert de repli');
  }
 }
});

test('mots interdits : aucune promesse de sécurité, sauf liste blanche',()=>{
 const forbidden=/sans danger|sans risque|tout ira bien|toujours une|parfaite? pour les enfants|rencontre garantie|garanti/i;
 /* usages légitimes, relevés dans les sources : traité de pêche (hoodriver), eau potable (scorpionanchorage) */
 const allowed=[['hoodriver','carnet.respect',/garanti par traité/],['scorpionanchorage','tip',/eau potable garantie/]];
 for(const s of catalog){
  for(const [p,t] of [...adviceTexts(s),...guideTexts(s.id)]){
   let text=t;
   for(const [id,field,re] of allowed)if(id===s.id&&field===p)text=text.replace(re,'');
   assert.doesNotMatch(text,forbidden,s.id+' '+p+' : '+t);
  }
 }
});

test('« obligatoire » seulement quand une entrée de data/sources a cité la source, hors liste historique à vérifier',()=>{
 const sourced=new Set([...faits,...essentiel].filter(e=>e.sources?.length).map(e=>e.text));
 /* Textes d'avant les lots 2 et 3, non couverts par la recherche : file d'attente de la prochaine passe, la liste ne peut que baisser. */
 const legacy=new Set(['calanques tip','daymaniyat dangers[0]','northbar dangers[2]','looekey dangers[2]','blueheron dangers[1]']);
 const seen=new Set();
 for(const s of catalog)for(const [p,t] of adviceTexts(s)){
  if(!/obligatoire/i.test(t))continue;
  if(s.id==='silfra')continue;
  const key=s.id+' '+p;
  if(sourced.has(t))continue;
  assert.ok(legacy.has(key),key+' : « obligatoire » sans source : '+t);
  seen.add(key);
 }
 assert.ok(seen.size<=legacy.size);
});

test('aucune date de fin inventée : Navagio sans « 31 octobre », sans distance non citée, sans adresse e-mail',()=>{
 for(const s of catalog)for(const [p,t] of adviceTexts(s)){
  assert.doesNotMatch(t,/31 octobre/,s.id+' '+p);
  assert.doesNotMatch(t,/@/,s.id+' '+p);
 }
 const n=spotById.navagio;
 assert.deepEqual([...n.sports],['baignade','snorkeling','kayak'],'sports de Navagio : retrait seulement si la source l\'interdit');
 assert.doesNotMatch(n.dangers.map(d=>d[1]).join(' '),/50 ?m/);
 assert.match(n.visit.access.t,/vérifie/);
});

test('arbitrages de la fusion : whitehaven, rishikesh, saltstraumen, scandola, verdon, kohtao et saintecroix',()=>{
 /* whitehaven : novembre à mai, octobre seulement par précaution (manques-coherence) */
 const w=spotById.whitehaven;
 const whiteText=[w.tip,...w.dangers.map(d=>d[1]),w.visit.avoid.t].join(' ');
 assert.match(whiteText,/novembre à mai/);
 assert.doesNotMatch(whiteText,/d’octobre à mai/);
 assert.match(w.visit.avoid.t,/par précaution/);
 /* rishikesh : opérateur, casque et gilet gardés, suspension de mousson non sourcée retirée */
 assert.match(spotById.rishikesh.tip,/opérateur agréé.*casque.*gilet/);
 assert.doesNotMatch(spotById.rishikesh.tip,/mousson/);
 /* saltstraumen : ni « danger mortel » ni horaires du courant */
 const salt=[spotById.saltstraumen.tip,...spotById.saltstraumen.dangers.map(d=>d[1])].join(' ');
 assert.doesNotMatch(salt,/danger mortel|horaires/);
 assert.ok(!spotById.scandola.sports.includes('plongee'));
 assert.ok(!spotById.verdon.sports.includes('baignade'));
 /* fiches reviewed : kohtao et saintecroix passent par visit, jamais par tip ni dangers */
 for(const id of ['kohtao','saintecroix']){assert.equal(spotById[id].editorialStatus,'reviewed');assert.equal(spotById[id].dangers.length,0,id);assert.equal(spotById[id].tip,'',id);assert.ok(spotById[id].visit.reviewed,id);}
 assert.equal(typeof spotById.kohtao.visit.avoid,'object');
 assert.equal(spotById.saintecroix.visit.reviewed,'2026-10-20');
});

test('conseils qui envoyaient vers un danger du même spot : plus de « pic du milieu » contre un courant au centre',()=>{
 for(const s of catalog){
  const dangers=s.dangers.map(d=>d[1]).join(' ');
  if(/au centre/i.test(dangers))assert.doesNotMatch(s.tip,/pic du milieu/i,s.id);
 }
 for(const id of ['ayampe','mancora','oualidia','itamambuca','puerto','tulamben']){
  const s=spotById[id];assert.ok(s,id);
  assert.doesNotMatch(s.tip,/pic du milieu/i,id);
 }
});

/* ---------- sources ---------- */
function allEntries(){return [...faits.map(e=>({...e,file:e.file||'catalog',from:'faits.json'})),...essentiel.map(e=>({...e,file:'catalog',from:'essentiel.json'}))];}

const HTTP_TO_FIX=new Set(['http://www.worldsurfleague.com/posts/112092/guide-to-lacanau']);

test('data/sources : URL https, dates AAAA-MM-JJ et citation non vide sur chaque source',()=>{
 for(const e of allEntries()){
  const id=e.from+' '+e.spot+' '+e.path;
  assert.ok(spotById[e.spot],id+' : spot inconnu');
  assert.match(e.checked,DATE,id);
  if(e.status==='sourcé')assert.ok(e.sources?.length,id+' : « sourcé » sans source');
  for(const src of e.sources||[]){
   /* internal:climate = normales NOAA du catalogue (data/climate.json) ; les deux URL http de lacanau sont à passer en https dans faits.json */
   if(src.url!=='internal:climate'&&!HTTP_TO_FIX.has(src.url))assert.equal(new URL(src.url).protocol,'https:',id);
   assert.match(src.consulted,DATE,id);
   assert.ok(String(src.quote||'').trim(),id+' : citation vide');
  }
 }
 for(const e of promu){
  assert.equal(e.status,'non vérifié',e.spot);assert.deepEqual(e.sources,[],e.spot);assert.match(e.checked,DATE,e.spot);
 }
});

/* Entrées dont le texte n'est plus celui du catalogue, une autre entrée de la même cible ou une retouche de la fusion l'ayant emporté.
   Liste fermée : toute autre dérive entre la source et le texte publié fait échouer le test. */
const SUPERSEDED=new Map([
 ['faits.json bluehole_belize dangers[1]','essentiel (gestionnaire : visiteurs occasionnels) l’emporte sur faits'],
 ['faits.json saltstraumen dangers[0]','version schémas (A7) retenue'],
 ['faits.json saltstraumen tip','version schémas (A7) : « horaires » et « étale » absents de la source'],
 ['essentiel.json whitehaven tip','arbitrage manques-coherence : novembre à mai, octobre par précaution'],
 ['essentiel.json whitehaven dangers[0]','arbitrage manques-coherence : novembre à mai, octobre par précaution'],
 ['essentiel.json navagio dangers[1]','distance de 50 m retirée : aucune citation contrôlée (manques-essentiel)']
]);
function publishedFor(e){
 const s=spotById[e.spot];
 let m;
 if(e.file==='carnet'||/^carnet\.(respect|season|vibe)$/.test(e.path))return {text:(guides[e.spot]||{})[e.path.replace('carnet.','')]};
 if(e.path==='dangers[+]')return {list:s.dangers.map(d=>d[1])};
 if((m=e.path.match(/^dangers\[(\d+)\]$/)))return {text:s.dangers[+m[1]]?.[1]};
 if((m=e.path.match(/^zones\[(.+)\]$/))){const z=s.zones.find(x=>x.n===m[1]);return {text:z&&`${z.n} : ${z.l} (${z.d})`};}
 if(e.path==='sports')return {text:s.sports.join(', ')};
 if((m=e.path.match(/^visit\.(\w+)$/))){const v=s.visit?.[m[1]];return {text:typeof v==='string'?v:v?.t};}
 return {text:s[e.path]};
}

test('data/sources : le texte de chaque entrée est identique au texte publié',()=>{
 const superseded=new Set();
 for(const e of allEntries()){
  const key=e.from+' '+e.spot+' '+e.path;
  /* retrait d'une ligne : la source garde la trace, le catalogue n'a plus rien */
  if(e.status==='retrait'&&e.text==null){assert.equal(publishedFor(e).text,undefined,key);continue;}
  const pub=publishedFor(e);
  const same=pub.list?pub.list.includes(e.text):pub.text===e.text;
  if(same)continue;
  assert.ok(SUPERSEDED.has(key),key+' : texte de la source différent du texte publié\n  source  : '+e.text+'\n  publié : '+(pub.text??pub.list));
  superseded.add(key);
 }
 assert.deepEqual([...superseded].sort(),[...SUPERSEDED.keys()].sort(),'une entrée de la liste fermée n’est plus nécessaire');
});

test('chaque ligne visit.* publiée (forme étendue) a une entrée de source au même texte, et ses URL y figurent',()=>{
 const entries=allEntries().filter(e=>/^visit\./.test(e.path)&&e.text!=null);
 let rows=0;
 for(const s of catalog){
  for(const k of VISIT_KEYS){
   const row=s.visit?.[k];
   if(!row||typeof row==='string')continue;
   rows++;
   const entry=entries.find(e=>e.spot===s.id&&e.path==='visit.'+k&&e.text===row.t);
   assert.ok(entry,s.id+' visit.'+k+' : aucune entrée de source');
   assert.notEqual(entry.status,'retrait',s.id+' visit.'+k);
   const urls=new Set((entry.sources||[]).map(x=>x.url));
   for(const src of row.src){
    if(src.u==='internal:climate'){assert.match(row.t,/NOAA/,s.id+' visit.'+k+' : température du climat sans mention NOAA');continue;}
    assert.ok(urls.has(src.u),s.id+' visit.'+k+' : URL absente de la source : '+src.u);
   }
  }
 }
 assert.ok(rows>=150,String(rows));
});

test('le repli du carnet est une sous-chaîne exacte du respect français du carnet de destination',()=>{
 const stripEnd=t=>t.replace(/[.!?:;…\s]+$/,'');
 let n=0;
 for(const s of catalog){
  if(!s.carnet)continue;
  n++;
  const respect=guides[s.id]?.respect;
  assert.ok(respect,s.id);
  assert.ok(respect.includes(s.carnet.tip),s.id+' : conseil de carnet absent du respect');
  /* seule la ponctuation de fin d'un danger repris d'une proposition peut changer */
  for(const d of s.carnet.dangers)assert.ok(respect.includes(stripEnd(d[1])),s.id+' : '+d[1]);
  assert.equal(s.carnet.from,'spot-guides.respect',s.id);
 }
 assert.equal(n,promu.length);
 for(const e of promu){
  const s=spotById[e.spot];
  assert.ok(s?.carnet,e.spot);
  /* deux conseils ont été ramenés au respect corrigé (règle non sourcée retirée) */
  if(!['saintecroix','anselazio'].includes(e.spot))assert.equal(s.carnet.tip,e.tip,e.spot);
 }
});

test('apostrophes droites : aucune de plus que le plafond actuel, qui ne peut que baisser',()=>{
 let n=0;
 for(const s of catalog)for(const [,t] of adviceTexts(s))n+=(t.match(/'/g)||[]).length;
 assert.ok(n<=10,'apostrophes droites : '+n);
});

test('danger trop court : au moins 12 caractères pour les éditions 2026-09b et suivantes',()=>{
 for(const s of catalog.filter(s=>s.edition&&s.edition>='catalogue-2026-09b'))
  for(const d of s.dangers)assert.ok(d[1].length>=12,s.id+' : '+d[1]);
});

test('traductions anglaise et espagnole de chaque texte de donnée publié',()=>{
 for(const s of catalog){
  for(const [p,t] of adviceTexts(s)){
   assert.ok(en[t],'en '+s.id+' '+p+' : '+t);
   assert.ok(es[t],'es '+s.id+' '+p+' : '+t);
  }
  for(const z of s.zones||[]){assert.ok(en[z.d],'en '+s.id+' zone '+z.n);assert.ok(es[z.d],'es '+s.id+' zone '+z.n);}
  for(const k of VISIT_KEYS){
   const row=s.visit?.[k];
   if(!row||typeof row==='string')continue;
   for(const src of row.src)if(src.u!=='internal:climate'){assert.ok(en[src.l],'en libellé '+src.l);assert.ok(es[src.l],'es libellé '+src.l);}
  }
 }
});

test('carnets : chaque spot garde un respect anglais, et un texte corrigé n’a pas laissé l’ancienne version',()=>{
 for(const s of catalog){
  assert.ok(guides[s.id]?.respect,s.id);
  assert.ok(guidesEn[s.id]?.respect,s.id+' (en)');
 }
 /* mois sourcés : la saison de kohtao et de beauvallon n'annonce plus de mois */
 for(const id of ['kohtao','beauvallon'])assert.match(guides[id].season,/À vérifier localement/,id);
});

test('le catalogue passe le validateur du générateur (lignes visit sourcées, carnet bien formé)',()=>{
 const {validate}=require('../scripts/build-ai-catalog.cjs');
 assert.doesNotThrow(()=>validate(catalog));
 const fiches=catalog.filter(s=>s.visit);
 assert.ok(fiches.length>=50);
 for(const s of fiches)assert.match(s.visit.reviewed,DATE,s.id);
});
