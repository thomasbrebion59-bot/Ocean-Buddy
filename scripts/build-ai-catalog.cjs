/* Validate the canonical catalogue, then write browser and photo views. */
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const write=(relative,value)=>fs.writeFileSync(path.join(root,relative),value);
const allowedSports=new Set(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf']);
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const HTTPS=/^https:\/\//i;
const isDate=value=>typeof value==='string'&&DATE.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().startsWith(value);
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

/* « L'essentiel avant d'y aller » : une ligne vaut soit une chaîne historique (fiche reviewed, source du catalogue),
   soit {t, src:[{u, l, d}]} avec ses propres sources, sur n'importe quelle fiche. Le navigateur ne reçoit que l'URL,
   le libellé et la date : les citations restent dans data/sources/. */
const VISIT_ROWS=['access','parking','tide','gear','avoid','localRules','bestPeriod'];
const ROW_MAX=600;
function validateVisit(spot){
  const visit=spot.visit;
  if(visit===undefined)return;
  const fail=message=>{throw Error(spot.id+': '+message);};
  if(!isObject(visit)||!isDate(visit.reviewed))fail('practical details need a review date');
  const keys=Object.keys(visit).filter(key=>key!=='reviewed');
  if(keys.some(key=>!VISIT_ROWS.includes(key))||!keys.some(key=>visit[key]))fail('invalid practical details');
  for(const key of keys){
    const row=visit[key];
    if(typeof row==='string'){
      /* Chaîne historique : elle s'appuie sur la source éditoriale de la fiche, qui doit donc exister. */
      if(spot.editorialStatus!=='reviewed'||!HTTPS.test(spot.source?.url||''))fail('practical details need a linked editorial source');
      if(!row.trim()||row.length>ROW_MAX)fail('invalid '+key);
      continue;
    }
    if(!isObject(row)||Object.keys(row).some(name=>!['t','src'].includes(name)))fail('invalid '+key);
    if(typeof row.t!=='string'||!row.t.trim()||row.t.length>ROW_MAX)fail('invalid '+key+' text');
    if(!Array.isArray(row.src)||!row.src.length||row.src.length>5)fail(key+' needs between 1 and 5 sources');
    for(const src of row.src){
      if(!isObject(src)||Object.keys(src).some(name=>!['u','l','d'].includes(name)))fail('invalid '+key+' source');
      const internal=src.u==='internal:climate';
      if(!internal){
        let url=null;
        try{url=new URL(src.u);}catch(_){}
        if(url?.protocol!=='https:')fail(key+' source needs an https URL');
      }
      if(typeof src.l!=='string'||!src.l.trim()||src.l.length>200)fail(key+' source needs a label');
      if(internal&&!/NOAA/.test(src.l))fail(key+' climate source must name NOAA');
      if(!isDate(src.d))fail(key+' source needs a consultation date');
    }
  }
}

/* Repli d'une fiche sans conseil ni danger : phrases du carnet, jamais présentées comme vérifiées. */
const CARNET_KEYS=['tip','dangers','status','from'];
function validateCarnet(spot){
  const carnet=spot.carnet;
  if(carnet===undefined)return;
  const fail=message=>{throw Error(spot.id+': '+message);};
  if(!isObject(carnet)||Object.keys(carnet).some(key=>!CARNET_KEYS.includes(key)))fail('invalid notebook fallback');
  if(carnet.status!=='non vérifié')fail('notebook fallback must be marked "non vérifié"');
  if(typeof carnet.from!=='string'||!carnet.from.trim())fail('notebook fallback needs its origin');
  if(typeof carnet.tip!=='string'||carnet.tip.length>ROW_MAX)fail('invalid notebook tip');
  if(!Array.isArray(carnet.dangers))fail('invalid notebook dangers');
  for(const danger of carnet.dangers){
    if(!Array.isArray(danger)||danger.length!==2||danger.some(part=>typeof part!=='string'||!part.trim())||danger[1].length>ROW_MAX)fail('invalid notebook danger');
  }
  if(!carnet.tip.trim()&&!carnet.dangers.length)fail('empty notebook fallback');
}

function validate(catalog){
  const ids=new Set();
  if(!Array.isArray(catalog)||catalog.length<280)throw Error('Canonical catalogue must contain at least 280 spots');
  for(const spot of catalog){
    if(typeof spot.id!=='string'||!/^[a-z0-9_]+$/.test(spot.id)||ids.has(spot.id))throw Error('Invalid or duplicate spot ID: '+spot.id);
    ids.add(spot.id);
    for(const key of ['name','loc','country','world','level','desc','sky','sky2','sea','sea2'])if(typeof spot[key]!=='string'||!spot[key])throw Error(spot.id+': missing '+key);
    if(!['fr','eu','af','as','na','sa','oc'].includes(spot.world))throw Error(spot.id+': unknown world');
    if(!Number.isFinite(spot.coords?.lat)||Math.abs(spot.coords.lat)>90||!Number.isFinite(spot.coords?.lon)||Math.abs(spot.coords.lon)>180)throw Error(spot.id+': invalid coordinates');
    if(!Array.isArray(spot.sports)||!spot.sports.length||spot.sports.some(s=>!allowedSports.has(s)))throw Error(spot.id+': invalid activities');
    if(!Array.isArray(spot.dangers)||typeof spot.tip!=='string')throw Error(spot.id+': incomplete guide');
    if(spot.photo){
      if(!spot.photo.src||!spot.photo.thumb||!spot.photo.source||!spot.photo.author||!spot.photo.license)throw Error(spot.id+': incomplete photograph');
      for(const media of [spot.photo.src,spot.photo.thumb])if(!fs.existsSync(path.join(root,media)))throw Error(spot.id+': missing '+media);
    }
    if(spot.editorialStatus==='reviewed'){
      if(!spot.reviewed||!spot.source?.url||!spot.source?.label)throw Error(spot.id+': reviewed without source/date');
    }else if(spot.editorialStatus!=='unverified'||spot.source?.url||spot.reviewed)throw Error(spot.id+': unverified entry has a source/date');
    validateVisit(spot);
    validateCarnet(spot);
  }
}

function main(){
  const catalog=read('data/catalog.json');
  validate(catalog);
  const photos=Object.fromEntries(catalog.filter(s=>s.photo).map(s=>[s.id,s.photo]));
  write('catalog-runtime.js','/* Generated from data/catalog.json. Edit that file, then run node scripts/build-ai-catalog.cjs. */\nwindow.OCEAN_CATALOG = '+JSON.stringify(catalog)+';\n');
  write('assets/spots/sources.json',JSON.stringify(photos,null,2)+'\n');
  console.log(catalog.length+' canonical spots validated and published for browser and photos');
}

if(require.main===module)main();
module.exports={validate,validateVisit,validateCarnet,VISIT_ROWS};
