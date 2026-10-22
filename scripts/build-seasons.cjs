#!/usr/bin/env node
/*
 * Lecture des mois du champ « season » des carnets de destination (data/spot-guides.json) : months(texte).
 * data/seasons.json (accueil : « Où partir ce mois-ci ? », filtre « En saison ») n’est plus cette lecture brute :
 * build-seasons-prudent.cjs la recoupe avec le modèle climatique et les mois à risque sourcés, et l’écrit.
 * Format : { "<id>": [mois 0–11…], … } ; « toute l’année » donne les 12 mois.
 *
 * Lecture (correctifs 2026-10) :
 *  - « X à Y », « X-Y », « de fin X à début Y » = plage (circulaire) ; « et » ne fait PAS une plage
 *    (« juin et septembre » = juin + septembre, pas juin → septembre) ;
 *  - une plage n’empêche plus de lire les mois isolés qui la suivent (« de mai à juin et en septembre ») ;
 *  - saisons : printemps = mars–mai, été = juin–août, automne = sept.–nov., hiver = déc.–fév. ;
 *    « … austral(e) » décale de six mois ; « de l’automne au printemps » = plage de saisons ;
 *  - « toute l’année » = 12 mois s’il est dans l’en-tête (avant « : ») ou en tête de phrase ;
 *    sinon (ex. « De décembre à mars …, mais … toute l’année ») la plage énoncée l’emporte ;
 *  - sans « : », les mois isolés et les saisons ne sont lus que dans la première proposition
 *    (avant « , » « ; » « . »), les plages dans toute la première phrase.
 *
 *   node scripts/build-seasons.cjs      (écrit data/seasons.json, comme build-seasons-prudent.cjs)
 */
const MONTHS=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const NAME=MONTHS.join('|');
const SEASONS={printemps:[2,3,4],ete:[5,6,7],automne:[8,9,10],hiver:[11,0,1]};
const SNAME=Object.keys(SEASONS).join('|');
const shift=(a,k)=>a.map(m=>(m+k)%12);
const MOD='(?:(?:fin|debut|mi)[\\s-]*)?';
function span(a,b,out){for(let i=a;;i=(i+1)%12){out.add(i);if(i===b)break;}}
function months(text){
  const full=norm(String(text));
  const colon=full.indexOf(':');
  const head=colon>=0?full.slice(0,colon):full.split(/\.\s/)[0];
  if(/toute l.annee|toute annee|en toute saison|12 mois/.test(colon>=0?head:head.slice(0,40)))return [...Array(12).keys()];
  const out=new Set();
  let rest=head;
  /* plages de saisons : « de l’automne au printemps », « de l’été austral à l’hiver austral » */
  const sRange=new RegExp(`(${SNAME})(\\s+austral\\w*)?\\s+(?:a|au|jusqu.a)\\s+(?:l.|la |le )?(${SNAME})(\\s+austral\\w*)?`,'g');
  rest=rest.replace(sRange,(_,s1,a1,s2,a2)=>{
    const m1=a1?shift(SEASONS[s1],6):SEASONS[s1],m2=a2?shift(SEASONS[s2],6):SEASONS[s2];
    span(m1[0],m2[2],out);return ' ';
  });
  /* plages de mois : « X à Y », « X-Y » ; « et » n’en fait pas une */
  const range=new RegExp(`(${NAME})\\s*(?:a|au|jusqu.a|–|—|-)\\s*${MOD}(${NAME})`,'g');
  rest=rest.replace(range,(_,x,y)=>{span(MONTHS.indexOf(x),MONTHS.indexOf(y),out);return ' ';});
  /* mois isolés et saisons : dans l’en-tête (avec « : ») ou la première proposition (sans « : ») */
  let one=colon>=0?rest:rest.split(/[,;]/)[0];
  MONTHS.forEach((n,i)=>{if(new RegExp(`\\b${n}\\b`).test(one))out.add(i);});
  one=one.replace(new RegExp(`(${SNAME})\\s+austral\\w*`,'g'),(_,s)=>{shift(SEASONS[s],6).forEach(i=>out.add(i));return ' ';});
  for(const [n,ms] of Object.entries(SEASONS)){if(new RegExp(`\\b${n}\\b`).test(one))ms.forEach(i=>out.add(i));}
  return [...out].sort((a,b)=>a-b);
}
module.exports={months};
if(require.main===module)require('./build-seasons-prudent.cjs').write();
