/* Validate the canonical catalogue, then write browser, photo and server views. */
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const write=(relative,value)=>fs.writeFileSync(path.join(root,relative),value);
const catalog=read('data/catalog.json');
const allowedSports=new Set(['surf','bodyboard','plongee','snorkeling','paddle','kayak','baignade','kitesurf','windsurf']);
const ids=new Set();

if(!Array.isArray(catalog)||catalog.length!==280)throw Error('Canonical catalogue must contain exactly 280 spots');
for(const spot of catalog){
  if(typeof spot.id!=='string'||!/^[a-z0-9_]+$/.test(spot.id)||ids.has(spot.id))throw Error('Invalid or duplicate spot ID: '+spot.id);
  ids.add(spot.id);
  for(const key of ['name','loc','world','level','desc','sky','sky2','sea','sea2'])if(typeof spot[key]!=='string'||!spot[key])throw Error(spot.id+': missing '+key);
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
  if(spot.visit!==undefined){
    if(spot.editorialStatus!=='reviewed'||!/^https:\/\//i.test(spot.source?.url||''))throw Error(spot.id+': practical details need a linked editorial source');
    if(!spot.visit||typeof spot.visit!=='object'||Array.isArray(spot.visit)||!/^\d{4}-\d{2}-\d{2}$/.test(spot.visit.reviewed||''))throw Error(spot.id+': practical details need a review date');
    const fields=['access','bestPeriod','localRules'];
    if(Object.keys(spot.visit).some(key=>key!=='reviewed'&&!fields.includes(key))||!fields.some(key=>spot.visit[key]))throw Error(spot.id+': invalid practical details');
    for(const key of fields)if(spot.visit[key]!==undefined&&(typeof spot.visit[key]!=='string'||!spot.visit[key].trim()||spot.visit[key].length>600))throw Error(spot.id+': invalid '+key);
  }
}

const photos=Object.fromEntries(catalog.filter(s=>s.photo).map(s=>[s.id,s.photo]));
const server=catalog.map(s=>({
  id:s.id,name:s.name,location:s.loc,world:s.world,coords:s.coords,
  coordinatePrecision:s.coordinatePrecision,activities:s.sports,level:s.level,
  description:s.desc,source:s.source?.url||null,sourceLabel:s.source?.label||null,
  reviewed:s.reviewed,editorialStatus:s.editorialStatus,visit:s.visit||null,
  photo:s.photo?{src:s.photo.src,thumb:s.photo.thumb,source:s.photo.source,author:s.photo.author,license:s.photo.license,width:s.photo.width,height:s.photo.height}:null,
  waterType:s.waterType
}));
write('catalog-runtime.js','/* Generated from data/catalog.json. Edit that file, then run node scripts/build-ai-catalog.cjs. */\nwindow.OCEAN_CATALOG = '+JSON.stringify(catalog)+';\n');
write('assets/spots/sources.json',JSON.stringify(photos,null,2)+'\n');
write('netlify/functions/lib/catalog.json',JSON.stringify(server)+'\n');
console.log(catalog.length+' canonical spots validated and published for browser, photos and server');
