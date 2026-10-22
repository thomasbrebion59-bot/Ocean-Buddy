#!/usr/bin/env node
/* Génère le bloc /*EMERGENCY*\/ … /*\/EMERGENCY*\/ d'app.js depuis data/sources/urgences.json.
   Une ligne par pays : nom normalisé (minuscules, sans accents, tirets à la place des espaces)
   -> [numéro du bouton ou null, type de ligne, valeur de la ligne, date de vérification].
   Le bouton n'existe que si call.status === "sourcé" ; chaque ligne affichée doit reposer sur
   le champ sourcé qui la justifie (secours en mer, ambulance) ou sur un conflit noté.
     node scripts/build-emergency.cjs           réécrit app.js
     node scripts/build-emergency.cjs --check   échoue si le bloc d'app.js n'est pas à jour */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const SOURCE=path.join(root,'data/sources/urgences.json'),APP=path.join(root,'app.js');
const DATE=/^\d{4}-\d{2}-\d{2}$/;
/* Vocabulaire fermé des lignes (gabarits de countryEmergency) : mer, mer16, garde, urgences, ambulance, conflit. */
const SEA_KINDS=new Set(['mer','mer16','garde','urgences']);
/* Autres numéros sourcés écrits à côté du bouton (décision 4) : Police, Ambulance, Aussi. */
const EXTRA_KINDS=new Set(['police','ambulance','aussi']);
const digits=x=>String(x).replace(/\D/g,'');

function countryKey(name){
  return String(name).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/\s+/g,'-');
}

/* Refuse une entrée qui donnerait un bouton ou une ligne sans source. */
function check(e){
  const where=e&&e.country||'?';
  const fail=msg=>{throw new Error(`urgences.json, ${where} : ${msg}`);};
  if(typeof e.country!=='string'||!e.country)fail('pays manquant');
  if(!DATE.test(e.checked||''))fail('date « checked » absente ou mal formée');
  const sources=Array.isArray(e.sources)?e.sources:fail('sources manquantes');
  for(const s of sources){
    if(!/^https:\/\//.test(s.url||''))fail('source sans URL https : '+s.url);
    if(!DATE.test(s.consulted||''))fail('source sans date de consultation : '+s.url);
    if(!String(s.quote||'').trim())fail('source sans citation : '+s.url);
  }
  const sourced=f=>{
    const x=e[f];
    if(!x||x.status!=='sourcé')return false;
    if(!Array.isArray(x.sources)||!x.sources.length)fail(f+' « sourcé » sans source');
    for(const i of x.sources)if(!sources[i])fail(f+' renvoie à une source absente ('+i+')');
    return true;
  };
  const call=e.call||fail('champ call absent');
  if(!['sourcé','à vérifier','conflit'].includes(call.status))fail('statut du bouton inconnu : '+call.status);
  if(sourced('call')&&!String(call.number||'').trim())fail('bouton « sourcé » sans numéro');
  const line=e.line;
  if(line!=null){
    if(SEA_KINDS.has(line.kind)){
      if(!sourced('sea'))fail('ligne « '+line.kind+' » sans secours en mer sourcé');
      const n=String(line.n||'');
      if(e.sea.number==null?!(n==='VHF 16'&&e.sea.vhf16===true):!n.endsWith(e.sea.number))fail('ligne mer différente du numéro sourcé');
      if(line.kind==='mer16'&&e.sea.vhf16!==true)fail('VHF 16 annoncée sans source');
    }else if(line.kind==='ambulance'){
      if(!sourced('medical')||line.n!==e.medical.number)fail('ligne ambulance sans numéro médical sourcé');
    }else if(line.kind==='conflit'){
      if(call.status!=='conflit')fail('ligne « conflit » sans conflit noté sur le bouton');
    }else fail('type de ligne inconnu : '+line.kind);
  }
  for(const x of e.extra||[]){
    if(!EXTRA_KINDS.has(x.kind))fail('type de numéro supplémentaire inconnu : '+x.kind);
    if(!String(x.n||'').trim()||!Array.isArray(x.sources)||!x.sources.length)fail('numéro supplémentaire sans source : '+x.kind);
    /* Chaque numéro écrit doit figurer dans la citation d'une source officielle citée. */
    if(!x.sources.some(i=>sources[i]&&digits(sources[i].quote).includes(digits(x.n))))fail('numéro supplémentaire '+x.n+' absent des citations');
  }
  /* Un bouton « sourcé » doit figurer dans la citation d'au moins une de ses sources. */
  if(call.status==='sourcé'&&!call.sources.some(i=>digits(sources[i].quote).includes(digits(call.number))))fail('numéro du bouton '+call.number+' absent des citations de sa source');
  return e;
}

function rows(entries){
  const out={};
  for(const e of entries.map(check)){
    const k=countryKey(e.country);
    if(Object.prototype.hasOwnProperty.call(out,k))throw new Error('Pays en double : '+e.country);
    const line=e.line||null;
    out[k]=[e.call.status==='sourcé'?String(e.call.number):null,line?line.kind:null,line&&line.n!=null?String(line.n):null,e.checked];
    if(e.call.status==='sourcé'&&(e.extra||[]).length)out[k].push(e.extra.map(x=>[x.kind,String(x.n)]));
  }
  return out;
}

function block(entries){
  const table=rows(entries);
  const body=Object.keys(table).sort().map(k=>' '+JSON.stringify(k)+':'+JSON.stringify(table[k])).join(',\n');
  return '/*EMERGENCY*/\n/* Généré par scripts/build-emergency.cjs depuis data/sources/urgences.json : ne pas modifier à la main.\n   nom normalisé -> [bouton, type de ligne, valeur de la ligne, vérifié le, autres numéros] */\nvar EMERGENCY_BY_COUNTRY={\n'+body+'\n};\n/*/EMERGENCY*/';
}

const MARKERS=/\/\*EMERGENCY\*\/[\s\S]*?\/\*\/EMERGENCY\*\//;
function render(app,entries){
  if(!MARKERS.test(app))throw new Error('Marqueurs /*EMERGENCY*/ … /*/EMERGENCY*/ absents d’app.js');
  return app.replace(MARKERS,()=>block(entries));
}

if(require.main===module){
  const entries=JSON.parse(fs.readFileSync(SOURCE,'utf8'));
  const app=fs.readFileSync(APP,'utf8'),next=render(app,entries);
  if(process.argv.includes('--check')){
    if(next!==app){console.error('Bloc EMERGENCY d’app.js périmé : lancer node scripts/build-emergency.cjs');process.exit(1);}
    console.log('Bloc EMERGENCY à jour ('+entries.length+' pays).');
  }else{
    if(next!==app)fs.writeFileSync(APP,next);
    const t=rows(entries),n=Object.values(t);
    console.log(`app.js : ${n.length} pays, ${n.filter(r=>r[0]).length} boutons, ${n.filter(r=>SEA_KINDS.has(r[1])).length} lignes mer, ${n.filter(r=>r[1]==='conflit').length} conflits.`);
  }
}
module.exports={countryKey,check,rows,block,render};
