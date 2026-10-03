#!/usr/bin/env node
/*
 * Meilleurs mois de chaque spot (data/seasons.json), lus dans le champ « season » des carnets
 * de destination (data/spot-guides.json). Sert à l’accueil : « Où partir ce mois-ci ? ».
 * Format : { "<id>": [mois 0–11…], … } ; « toute l’année » donne les 12 mois.
 *
 *   node scripts/build-seasons.cjs
 */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const guides=JSON.parse(fs.readFileSync(path.join(root,'data/spot-guides.json'),'utf8'));
const MONTHS=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function months(text){
  const s=norm(String(text).split(':')[0]);
  if(/toute l.annee|toute annee|en toute saison|12 mois/.test(s))return [...Array(12).keys()];
  const out=new Set(),name=MONTHS.join('|');
  const range=new RegExp(`(${name})\\s*(?:a|au|jusqu.a|–|-|et)\\s*(?:fin\\s+|debut\\s+|mi-)?(${name})`,'g');
  let m,found=false;
  while((m=range.exec(s))){found=true;const a=MONTHS.indexOf(m[1]),b=MONTHS.indexOf(m[2]);for(let i=a;;i=(i+1)%12){out.add(i);if(i===b)break;}}
  if(!found){
    MONTHS.forEach((n,i)=>{if(new RegExp(`\\b${n}\\b`).test(s))out.add(i);});
    if(/\bete\b|l.ete/.test(s))[5,6,7].forEach(i=>out.add(i));
    if(/hiver austral/.test(s))[5,6,7].forEach(i=>out.add(i));else if(/\bhiver\b/.test(s))[11,0,1].forEach(i=>out.add(i));
    if(/printemps/.test(s))[3,4,5].forEach(i=>out.add(i));
    if(/automne/.test(s))[8,9,10].forEach(i=>out.add(i));
  }
  return [...out].sort((a,b)=>a-b);
}
const out={};let missing=0;
for(const [id,g] of Object.entries(guides.spots||{})){const m=g.season?months(g.season):[];if(m.length)out[id]=m;else missing++;}
fs.writeFileSync(path.join(root,'data/seasons.json'),JSON.stringify(out)+'\n');
console.log(`data/seasons.json : ${Object.keys(out).length} spots${missing?`, ${missing} sans saison lisible`:''}`);
