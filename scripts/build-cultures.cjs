#!/usr/bin/env node
/* Découverte des cultures : fusionne les fiches sourcées data/cultures-src/*.json en data/cultures.json (référence
   relue, faits seulement), puis écrit les fichiers lus par l’app, un par langue : assets/data/cultures.<fr|en|es>.json
   (fiches sourcées + repères du carnet data/spot-guides*.json : langue, bonjour, plat, bon geste ; noms des pays).
   Enfin, l’empreinte des fichiers chargés à la demande est inscrite dans cultures-boot.js (const V).

   Validation stricte (cultures-model.js, validateEntry) : schéma, longueurs, adresses https://, écriture latine des mots,
   pays connus du catalogue (data/catalog.json), un même champ jamais fourni par deux fichiers. Une erreur arrête tout,
   avec la liste des problèmes.

     node scripts/build-cultures.cjs                     # strict : échoue à la moindre erreur
     node scripts/build-cultures.cjs --ignorer-invalides # retire les blocs invalides (signalés) et continue
     node scripts/build-cultures.cjs --verifier          # valide seulement, n’écrit rien */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const M=require('../cultures-model.js');

const LANGS=['fr','en','es'];
/* Noms des pays absents du dictionnaire de l’interface (locales/translations). */
const NAMES={
  'Cap-Vert':{en:'Cape Verde',es:'Cabo Verde'},
  'Pays-Bas':{en:'Netherlands',es:'Países Bajos'},
  'Royaume-Uni':{en:'United Kingdom',es:'Reino Unido'},
  'Saint-Martin':{en:'Saint Martin',es:'San Martín'},
  'Saint-Vincent-et-les-Grenadines':{en:'Saint Vincent and the Grenadines',es:'San Vicente y las Granadinas'},
  'Sainte-Lucie':{en:'Saint Lucia',es:'Santa Lucía'},
  'Wallis-et-Futuna':{en:'Wallis and Futuna',es:'Wallis y Futuna'}
};
const readJSON=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const FIELDS=['sea','fete','thanks','base'];

/* Lit et valide les fichiers sources. Renvoie {countries, errors, warnings, manques, files}. */
function collect(srcDir,known,{skipInvalid=false}={}){
  const out={},owner={},errors=[],warnings=[],manques=[];
  const files=fs.existsSync(srcDir)?fs.readdirSync(srcDir).filter(f=>f.endsWith('.json')).sort():[];
  for(const file of files){
    let data;
    try{data=readJSON(path.join(srcDir,file));}catch(e){errors.push(`${file} : JSON illisible (${e.message})`);continue;}
    if(!isObj(data)){errors.push(`${file} : objet { "Pays": {…} } attendu`);continue;}
    for(const [name,entry] of Object.entries(data)){
      if(name.startsWith('_'))continue;
      if(name==='manques'){manques.push({file,list:entry});continue;}
      if(!known.has(name)){errors.push(`${file} : pays inconnu du catalogue « ${name} » (écrire le nom exactement comme dans data/catalog.json)`);continue;}
      const errs=M.validateEntry(name,entry);
      if(isObj(entry)&&entry.manques!==undefined)manques.push({file,country:name,list:entry.manques});
      let clean=entry;
      if(errs.length){
        if(!skipInvalid){for(const e of errs)errors.push(`${file} : ${e}`);continue;}
        /* Mode tolérant : chaque bloc fautif est retiré (le reste de la fiche est gardé s’il est valide). */
        clean={};
        for(const k of FIELDS)if(entry&&entry[k]!==undefined){
          const probe={[k]:entry[k],reviewed:entry.reviewed},bad=M.validateEntry(name,probe);
          if(bad.length)for(const e of bad)warnings.push(`${file} : bloc retiré, ${e}`);else clean[k]=entry[k];
        }
        if(!FIELDS.some(k=>clean[k]))continue;
        clean.reviewed=entry.reviewed;
        if(M.validateEntry(name,clean).length){warnings.push(`${file} : ${name} retiré (date de relecture invalide)`);continue;}
      }
      const cur=out[name]||(out[name]={});
      for(const k of FIELDS){
        if(clean[k]===undefined)continue;
        if(cur[k]!==undefined){errors.push(`${file} : ${name} › ${k} déjà fourni par ${owner[name+'.'+k]}`);continue;}
        cur[k]=clean[k];owner[name+'.'+k]=file;
      }
      if(clean.reviewed&&(!cur.reviewed||clean.reviewed>cur.reviewed))cur.reviewed=clean.reviewed;
    }
  }
  return {countries:out,errors,warnings,manques,files};
}

/* Apostrophes typographiques en français (l'UNESCO devient l’UNESCO). */
const typo=(s,l)=>l==='fr'?String(s).replace(/(\p{L})'(?=\p{L})/gu,'$1’'):String(s);
const src=s=>[s.label,s.url];

/* Fichier de l’app pour une langue : tous les pays du catalogue, repères du carnet + fiches sourcées. */
function runtime(lang,{catalog,guides,names,merged}){
  const byCountry=new Map();
  for(const s of catalog){if(!s.country)continue;const w=byCountry.get(s.country)||{};w[s.world||'eu']=(w[s.world||'eu']||0)+1;byCountry.set(s.country,w);}
  const countries={};
  for(const name of [...byCountry.keys()].sort((a,b)=>a.localeCompare(b,'fr'))){
    const worlds=byCountry.get(name),w=Object.entries(worlds).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
    const g=guides[lang]?.[name]||(lang!=='fr'?guides.en?.[name]:null)||guides.fr?.[name]||null,gfr=guides.fr?.[name]||null;
    const e=merged[name]||{},b=e.base||{};
    const c={name:lang==='fr'?name:(names[lang]?.[name]||NAMES[name]?.[lang]||name),w};
    const T=v=>typo(v,lang);
    let fromBase=false;
    if(g?.lang)c.langs=g.lang;else if(b.lang){c.langs=T(b.lang[lang]);fromBase=true;}
    if(Array.isArray(gfr?.hello)&&gfr.hello[0])c.hello=[gfr.hello[0],(Array.isArray(g?.hello)&&g.hello[1])||gfr.hello[1]||''];
    else if(b.hello){c.hello=[b.hello.word,T(b.hello.gloss[lang])];fromBase=true;}
    if(Array.isArray(g?.food)&&g.food[0])c.food=[g.food[0],g.food[1]||''];else if(b.food){c.food=[T(b.food.name[lang]),T(b.food.text[lang])];fromBase=true;}
    if(g?.respect)c.respect=g.respect;else if(b.respect){c.respect=T(b.respect[lang]);fromBase=true;}
    /* Repères venus d’une fiche sourcée (pays sans carnet) : leur source s’affiche aussi. */
    if(fromBase)c.baseSrc=src(b.source);
    if(e.thanks)c.thanks={word:e.thanks.word,lang:T(e.thanks.lang[lang]),src:src(e.thanks.source)};
    if(e.sea)c.sea={title:T(e.sea.title[lang]),text:T(e.sea.text[lang]),src:src(e.sea.source)};
    if(e.fete)c.fete={title:T(e.fete.title[lang]),when:T(e.fete.when[lang]),text:T(e.fete.text[lang]),src:src(e.fete.source)};
    if(e.reviewed&&(e.sea||e.fete||e.thanks||e.base))c.reviewed=e.reviewed;
    countries[name]=c;
  }
  return {lang,countries};
}

function build(root,{skipInvalid=false,checkOnly=false,log=console.log}={}){
  const catalog=readJSON(path.join(root,'data/catalog.json'));
  const known=new Set(catalog.map(s=>s.country).filter(Boolean));
  const res=collect(path.join(root,'data/cultures-src'),known,{skipInvalid});
  if(res.errors.length){const err=new Error(`Fiches culturelles invalides (${res.errors.length}) :\n  - `+res.errors.join('\n  - ')+'\nCorrige ces fiches dans data/cultures-src/ (ou relance avec --ignorer-invalides pour retirer les blocs fautifs).');err.list=res.errors;throw err;}
  const merged={};for(const name of Object.keys(res.countries).sort((a,b)=>a.localeCompare(b,'fr'))){const e=res.countries[name],o={};for(const k of [...FIELDS,'reviewed'])if(e[k]!==undefined)o[k]=e[k];merged[name]=o;}
  const stats={files:res.files.length,countries:Object.keys(merged).length,sea:0,fete:0,thanks:0,base:0,catalog:known.size};
  for(const e of Object.values(merged))for(const k of FIELDS)if(e[k])stats[k]++;
  if(checkOnly)return {stats,warnings:res.warnings,manques:res.manques,written:[]};
  const guides={fr:readJSON(path.join(root,'data/spot-guides.json')).countries||{}};
  for(const l of ['en','es']){const f=path.join(root,`data/spot-guides.${l}.json`);if(fs.existsSync(f))guides[l]=readJSON(f).countries||{};}
  const names={};
  for(const l of ['en','es']){const f=path.join(root,`locales/translations/${l}.json`);names[l]={};if(fs.existsSync(f)){const d=readJSON(f);for(const c of known)if(typeof d[c]==='string'&&d[c].trim())names[l][c]=d[c];}}
  const written=[];
  const write=(rel,body)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});if(!fs.existsSync(f)||fs.readFileSync(f,'utf8')!==body)fs.writeFileSync(f,body);written.push(rel);return body;};
  const dates=Object.values(merged).map(e=>e.reviewed).filter(Boolean).sort();
  write('data/cultures.json',JSON.stringify({about:'Fiches culturelles sourcées, fusionnées par scripts/build-cultures.cjs depuis data/cultures-src/. Ne pas modifier à la main.',
    reviewed:dates.at(-1)||null,files:res.files,countries:merged},null,1)+'\n');
  const bodies=[];
  for(const l of LANGS){const data=runtime(l,{catalog,guides,names,merged});data.reviewed=dates.at(-1)||null;bodies.push(write(`assets/data/cultures.${l}.json`,JSON.stringify(data)+'\n'));}
  /* Empreinte des fichiers chargés à la demande (cultures-boot.js les demande avec ?v=…). */
  const h=crypto.createHash('sha256');
  for(const f of ['cultures-model.js','cultures.js']){const p=path.join(root,f);if(fs.existsSync(p)){h.update(f);h.update(fs.readFileSync(p));}}
  for(const b of bodies)h.update(b);
  const V=h.digest('hex').slice(0,12),boot=path.join(root,'cultures-boot.js');
  if(fs.existsSync(boot)){const code=fs.readFileSync(boot,'utf8'),next=code.replace(/const V='[^']*';/,`const V='${V}';`);if(next!==code){fs.writeFileSync(boot,next);written.push('cultures-boot.js');}}
  return {stats,warnings:res.warnings,manques:res.manques,written,V};
}

module.exports={collect,runtime,build,NAMES};

if(require.main===module){
  const args=process.argv.slice(2);
  try{
    const r=build(path.resolve(__dirname,'..'),{skipInvalid:args.includes('--ignorer-invalides'),checkOnly:args.includes('--verifier')});
    for(const w of r.warnings)console.warn('Attention : '+w);
    const s=r.stats;
    console.log(`${s.files} fichier(s), ${s.countries} pays sur ${s.catalog} : ${s.sea} traditions de la mer, ${s.fete} fêtes, ${s.thanks} « merci », ${s.base} repères de base.`);
    const missing=r.manques.reduce((n,m)=>n+(Array.isArray(m.list)?m.list.length:1),0);
    if(missing)console.log(`${missing} manque(s) signalé(s) par les documentalistes (champs omis faute de source).`);
    if(r.written.length)console.log('Écrit : '+r.written.join(', ')+(r.V?` · v=${r.V}`:''));
  }catch(e){console.error(e.message);process.exit(1);}
}
