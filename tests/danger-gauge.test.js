/* Jauge de danger calculée (app.js, dangerGauge) : poids le plus fort parmi les lignes de danger, de 1 à 4,
   mots entiers sans accents ; le champ « danger » du catalogue n'est plus lu ; rien ne dit « sans danger ». */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const byId=Object.fromEntries(catalog.map(s=>[s.id,s]));

const code=src=>src.replace(/\/\*[\s\S]*?\*\//g,'');
function functionSource(start,end){const i=app.indexOf(start);assert.ok(i>=0,start);const j=app.indexOf(end,i);assert.ok(j>i,end);return app.slice(i,j);}
function load(){
 const ctx={window:{}};
 vm.runInNewContext(functionSource('var DANGER_GAUGE','function spotCard')+';this.gauge=dangerGauge;',ctx);
 return ctx;
}
const {gauge,window:win}=load();
const line=(text,emoji='⚠️')=>({dangers:[[emoji,text]]});
const n=text=>gauge(line(text)).n;

test('dangerGauge est exposée sur window, pour le rail « débuter » de l’accueil',()=>{
 assert.equal(typeof win.dangerGauge,'function');
 assert.deepEqual({...win.dangerGauge(byId.tayrona)},{n:4,basis:'catalogue'});
});

test('valeurs attendues : tayrona et havelock à 4, jervisbay, kata, tikehau et hossegor à 3 ou plus',()=>{
 assert.equal(gauge(byId.tayrona).n,4);assert.equal(gauge(byId.havelock).n,4);
 for(const id of ['jervisbay','kata','tikehau','hossegor'])assert.ok(gauge(byId[id]).n>=3,id+' : '+gauge(byId[id]).n);
});

test('aucune ligne : null (« non évalué »), jamais 0',()=>{
 for(const s of [{},{dangers:[]},{dangers:[],carnet:{dangers:[]}},{dangers:[['⚠️','  ']]},null])assert.equal(gauge(s).n,null,JSON.stringify(s));
 assert.equal(gauge({dangers:[]}).basis,'catalogue');
 for(const s of catalog){
  const g=gauge(s),has=(s.dangers||[]).some(d=>String(d[1]||'').trim())||(s.carnet?.dangers||[]).some(d=>String(d[1]||'').trim());
  if(has)assert.ok([1,2,3,4].includes(g.n),s.id+' : '+g.n);else assert.equal(g.n,null,s.id);
 }
});

test('barème : mots entiers, sans accents ni casse',()=>{
 assert.equal(n('Requins signalés.'),4);assert.equal(n('NOYADES chaque été'),4);assert.equal(n('Méduses-boîtes en saison'),4);
 assert.equal(n('Irukandji possibles'),4);assert.equal(n('Baignade interdite au pied de la falaise'),4);
 assert.equal(n('Courants très dangereux'),4);assert.equal(n('Accidents mortels déjà survenus'),4);
 assert.equal(n('BAÏNES à marée descendante'),3);assert.equal(n('Courants forts dans la passe'),3);assert.equal(n('Courant de passe'),3);
 assert.equal(n('Récif tranchant à marée basse'),3);assert.equal(n('Récif à fleur d’eau'),3);assert.equal(n('Secours éloignés'),3);
 assert.equal(n('Spot isolé'),3);assert.equal(n('Typhons possibles'),3);assert.equal(n('Grotte : jamais sans guide'),3);
 assert.equal(n('Shorebreak puissant'),3);assert.equal(n('Piège de marée sous la falaise'),3);
 assert.equal(n('Courant le long de la digue'),2);assert.equal(n('Houle du large'),2);assert.equal(n('Vent fort l’après-midi'),2);
 assert.equal(n('Roches glissantes'),2);assert.equal(n('Chutes de pierres'),2);assert.equal(n('Jet-skis en été'),2);
 assert.equal(n('Méduses certains étés'),2);assert.equal(n('Trafic de bateaux'),2);
 assert.equal(n('Affluence en août'),1);assert.equal(n('Soleil fort'),1);assert.equal(n('Moustiques le soir'),1);
 /* le maximum des lignes l'emporte */
 assert.equal(gauge({dangers:[['☀️','Soleil fort'],['🦈','Requins de récif']]}).n,4);
});

test('« approche » ne compte pas comme « roche », ni « isolement » comme « isolé »',()=>{
 assert.equal(n('Approche par la plage seulement'),1);
 assert.equal(n('Rapprochez-vous du poste de secours'),1);
 assert.equal(n('Rochers à l’entrée'),2);
});

test('le champ « danger » du catalogue n’est plus lu par la jauge ni par la carte',()=>{
 const base=line('Soleil fort');
 assert.equal(gauge({...base,danger:4}).n,gauge({...base,danger:0}).n);
 assert.doesNotMatch(code(functionSource('var DANGER_GAUGE','function spotCard')),/\.danger\b(?!s)/);
 assert.doesNotMatch(code(functionSource('function spotCard(s){','let currentFilter')),/\bs\.danger\b(?!s)/);
});

test('fiche sans danger au catalogue : la jauge lit le carnet et le dit (basis « carnet »)',()=>{
 const s={dangers:[],carnet:{tip:'x',dangers:[['🌀','Les baïnes créent des courants qui t’entraînent vers le large.']],status:'non vérifié'}};
 assert.deepEqual({...gauge(s)},{n:3,basis:'carnet'});
 /* le catalogue l'emporte quand il a ses propres lignes */
 assert.deepEqual({...gauge({...s,dangers:[['☀️','Soleil fort']]})},{n:1,basis:'catalogue'});
});

test('carte de spot : role="img", aria-label et title disent qu’il s’agit d’une estimation',()=>{
 const card=functionSource('function spotCard(s){','let currentFilter');
 assert.match(card,/class="danger-dots" role="img" aria-label="\$\{dangerLabel\}"/);
 assert.match(card,/`Danger estimé : \$\{gauge\.n\} sur 4 · estimation Ocean Buddy`/);
 assert.match(card,/`Danger estimé : \$\{gauge\.n\} sur 4 · estimation Ocean Buddy · carnet non vérifié`/);
 assert.match(card,/'Danger : estimation Ocean Buddy'/);
 assert.match(card,/'Danger non évalué'/);
 assert.doesNotMatch(code(card),/sans danger/i);
});

test('carnet : étiquette « Carnet Ocean Buddy · non vérifié » sur le conseil et les dangers repris',()=>{
 const ctx={};vm.runInNewContext(functionSource('function carnetTag','function openSpot')+';this.tag=carnetTag;',ctx);
 assert.match(ctx.tag('dTipCarnet'),/^<small class="carnet-unverified" id="dTipCarnet"[^>]*>Carnet Ocean Buddy · non vérifié<\/small>$/);
 assert.doesNotMatch(ctx.tag(),/ id=/);
 assert.doesNotMatch(ctx.tag(),/#[0-9a-f]{3,6}\b|rgb\(/i,'couleur codée en dur');
 const open=functionSource('function openSpot','function renderSpotSource');
 assert.match(open,/s\.carnet\.tip/);assert.match(open,/carnetTag\(\)\+carnetDangers\.map\(dangerRow\)/);
});

test('rail « Pour débuter en douceur » : aucun spot débutant à 3 points ou plus',()=>{
 const feed=fs.readFileSync(path.join(root,'home-feed.js'),'utf8');
 const i=feed.indexOf('const COLLECTIONS=['),j=feed.indexOf('];',i);
 assert.ok(i>0&&j>i,'COLLECTIONS introuvable dans home-feed.js');
 const ctx={window:{dangerGauge:gauge},COORDS:{}};
 vm.runInNewContext(`const text=s=>\`\${s.name} \${s.desc||''} \${s.anecdote||''}\`.toLowerCase();const has=(s,...ids)=>(s.sports||[]).some(a=>ids.includes(a));const lat=s=>(COORDS[s.id]||s.coords||{}).lat??0;${feed.slice(i,j+2)};this.COLLECTIONS=COLLECTIONS;`,ctx);
 const debut=ctx.COLLECTIONS.find(c=>c.id==='debut');assert.ok(debut);
 const picked=catalog.filter(s=>debut.test(s));
 assert.ok(picked.length>=3,'rail vide : '+picked.length);
 assert.deepEqual(picked.filter(s=>gauge(s).n>=3).map(s=>s.id),[]);
 for(const id of ['tayrona','havelock','jervisbay'])assert.equal(picked.some(s=>s.id===id),false,id);
});
