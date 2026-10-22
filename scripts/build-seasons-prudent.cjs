#!/usr/bin/env node
/*
 * Mois « en saison » PRUDENTS de chaque spot (data/seasons.json), pour le filtre « En saison »
 * et le rail « Où partir en <mois> ? » de l’accueil. Le fichier garde le format { "<id>": [mois 0–11…], … }.
 *
 *   mois prudents = mois du carnet (champ « season » de data/spot-guides.json, lu par build-seasons.cjs)
 *                 ∩ « meilleurs mois » du modèle climatique (spot-data-model.js, data/climate.json)
 *                 − mois à risque sourcés (data/sources/season-risks.json, saisi à la main avec sa source).
 *
 * Règle du modèle : SpotDataModel.best(year(climat, activité, niveau)) = mois à moins de 0,08 de la
 * meilleure note et au moins « possible ». Si le spot propose une activité dans l’eau (baignade,
 * snorkeling, plongée), seules ces activités comptent (le modèle d’un surfeur ne doit pas valider la
 * mousson pour des nageurs) ; sinon on prend l’union de toutes les activités du spot.
 * Un spot sans mois commun n’apparaît pas dans le filtre ni dans les rails. C’est un repère indicatif,
 * jamais une prévision : les mois bruts du carnet ne sont écrits nulle part, la tuile « La bonne saison »
 * lit le texte du carnet.
 *
 *   node scripts/build-seasons-prudent.cjs      (ou, de façon équivalente : node scripts/build-seasons.cjs)
 */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const M=require(path.join(root,'spot-data-model.js'));
const {months}=require('./build-seasons.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));

/* Mois lus dans le texte du carnet de chaque spot : { id: [mois…] }, sans les spots sans saison lisible. */
function carnetMonths(guides){
  const out={};
  for(const [id,g] of Object.entries(guides.spots||{})){const m=g.season?months(g.season):[];if(m.length)out[id]=m;}
  return out;
}
/* Meilleurs mois du modèle climatique pour les activités du spot (voir la règle plus haut). */
function modelMonths(spot,climate){
  if(!climate)return [];
  const sports=spot.sports||[];
  const inWater=sports.filter(a=>M.WATER_ACTS.includes(a));
  const basis=inWater.length?inWater:sports;
  return [...new Set(basis.flatMap(a=>M.best(M.year(climate,a,spot.level)).months))].sort((a,b)=>a-b);
}
/* Mois exclus pour un spot : ceux d’une entrée sourcée de data/sources/season-risks.json. */
function banned(risks,id){
  const r=risks&&risks[id];
  return r&&r.status==='sourcé'&&Array.isArray(r.exclude)?r.exclude:[];
}
function prudent(spot,carnet,climate,risks){
  const model=modelMonths(spot,climate),out=banned(risks,spot.id);
  return (carnet||[]).filter(m=>model.includes(m)&&!out.includes(m)).sort((a,b)=>a-b);
}
/* Tout data/seasons.json en mémoire : { id: [mois prudents] }. */
function build(){
  const catalog=read('data/catalog.json'),carnet=carnetMonths(read('data/spot-guides.json')),climate=read('data/climate.json').spots;
  const risksFile=path.join(root,'data/sources/season-risks.json');
  const risks=fs.existsSync(risksFile)?read('data/sources/season-risks.json'):{};
  const out={};let none=0;
  for(const s of catalog){const m=prudent(s,carnet[s.id],climate[s.id],risks);if(m.length)out[s.id]=m;else none++;}
  return {out,none};
}
function write(){
  const {out,none}=build();
  fs.writeFileSync(path.join(root,'data/seasons.json'),JSON.stringify(out)+'\n');
  console.log(`data/seasons.json : ${Object.keys(out).length} spots gardent au moins un mois, ${none} n’en gardent aucun`);
}
module.exports={carnetMonths,modelMonths,banned,prudent,build,write};
if(require.main===module)write();
