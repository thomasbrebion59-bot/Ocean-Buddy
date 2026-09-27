/* Idempotent catalogue additions:
   - gives every spot without one an explicit `country`,
   - moves Hawaii back to North America (it was listed under Oceania),
   - appends the spots of an additions file with their photos, marks them « Nouveau » and clears that flag on older spots.
   Usage: node scripts/add-spots.cjs [additions.cjs] [photos.json] [edition]
   Default: the September 2026 batch (data/new-spots-2026-09.cjs, data/new-spot-photos.json, catalogue-2026-09).
   Second batch: node scripts/add-spots.cjs data/new-spots-2026-09b.cjs data/new-spot-photos-2026-09b.json catalogue-2026-09b
   Entries are either tuples [id, name, loc, country, world, lat, lon, 'sport|sport', level, waterType, desc, tip, dangers]
   or objects with the same keys (sports as an array) plus optional coordinatePrecision, anecdote and fauna.
   Then run node scripts/build-ai-catalog.cjs. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'data/catalog.json');
const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
const [additionsArg='data/new-spots-2026-09.cjs',photosArg='data/new-spot-photos.json',edition='catalogue-2026-09']=process.argv.slice(2);
const KEYS=['id','name','loc','country','world','lat','lon','sports','level','waterType','desc','tip','dangers'];
const additions=require(path.resolve(root,additionsArg)).map(entry=>{
  const spot=Array.isArray(entry)?Object.fromEntries(KEYS.map((key,i)=>[key,entry[i]])):{...entry};
  if(typeof spot.sports==='string')spot.sports=spot.sports.split('|');
  return spot;
});
const photosFile=path.resolve(root,photosArg);
const photos=fs.existsSync(photosFile)?JSON.parse(fs.readFileSync(photosFile,'utf8')):{};

const RULES=[
  ['portugal|madère|açores','Portugal'],['espagne|canaries|gran canaria|grande canarie|minorque|cadix|barbate|asturies|cantabrie|galice|suances|liencres|saint-sébastien|andalousie|costa brava','Espagne'],
  ['écosse|uk|royaume-uni|cornouailles|newquay','Royaume-Uni'],['irlande','Irlande'],['norvège','Norvège'],['islande','Islande'],['italie|sardaigne|sicile','Italie'],['grèce|crète|zakynthos','Grèce'],['croatie|dalmatie','Croatie'],
  ['maroc','Maroc'],['égypte','Égypte'],['sénégal','Sénégal'],['afrique du sud|kwazulu|cap-oriental|le cap','Afrique du Sud'],['namibie','Namibie'],['kenya','Kenya'],['seychelles','Seychelles'],['maurice','Maurice'],['madagascar','Madagascar'],['mozambique','Mozambique'],['tanzanie','Tanzanie'],
  ['hawaï|usa|états-unis|californie','États-Unis'],['mexique|quintana|basse-californie|la paz','Mexique'],['canada','Canada'],['costa rica','Costa Rica'],['brésil','Brésil'],['salvador','Salvador'],['belize','Belize'],['bonaire','Bonaire'],['dominicaine','République dominicaine'],['porto rico','Porto Rico'],
  ['pérou','Pérou'],['chili','Chili'],['équateur|galápagos','Équateur'],['uruguay','Uruguay'],['argentine','Argentine'],['colombie','Colombie'],
  ['indonésie|bali|java|lombok','Indonésie'],['japon|okinawa','Japon'],['philippines','Philippines'],['maldives','Maldives'],['malaisie','Malaisie'],['sri lanka','Sri Lanka'],['thaïlande','Thaïlande'],['vietnam','Vietnam'],
  ['australie','Australie'],['nouvelle-zélande','Nouvelle-Zélande'],['fidji','Fidji'],['tahiti|polynésie','Polynésie française'],['calédonie','Nouvelle-Calédonie']
];
const HAWAII=/hawaï|kauaʻi|oahu|maui/i;
const fresh=new Set(additions.map(a=>a.id));
for(const spot of catalog){
  if(!fresh.has(spot.id)&&spot.catalogNew)spot.catalogNew=false;
  if(HAWAII.test(spot.loc)&&spot.world==='oc')spot.world='na';
  if(spot.country)continue;
  if(spot.world==='fr'){spot.country='France';continue;}
  const text=spot.loc.toLowerCase();
  const rule=RULES.find(([pattern])=>new RegExp(pattern).test(text));
  if(!rule)throw Error('No country for '+spot.id+' ('+spot.loc+')');
  spot.country=rule[1];
}

const PALETTE={fr:['#cfe6f7','#8fc2e6','#2b86c0','#12608f'],eu:['#dcebf5','#a3c6dd','#22759c','#0d4767'],af:['#ffe7c4','#f7b77f','#1cadc2','#0f7b98'],na:['#ffe0cc','#f5a58d','#2f8dc6','#175f8d'],sa:['#ffe8c6','#f3b06f','#2091ba','#0d5f81'],as:['#dff5f1','#a6e0d8','#19bbb0','#0c7b81'],oc:['#d5edf9','#84c8e9','#1599d8','#0a5288']};
const ids=new Set(catalog.map(s=>s.id));
let added=0;
for(const {id,name,loc,country,world,lat,lon,sports,level,waterType,desc,tip,dangers,coordinatePrecision,anecdote,fauna} of additions){
  if(ids.has(id))continue;
  const [sky,sky2,sea,sea2]=PALETTE[world];
  const photo=photos[id]||null;
  catalog.push({
    id,name,loc,country,world,coords:{lat,lon},
    coordinatePrecision:coordinatePrecision||(waterType==='sea'?'coastal-sector':waterType==='lake'?'lake-sector':'inland-sector'),
    sports,level,desc,dangers,tip,
    ...(anecdote?{anecdote}:{}),...(fauna?{fauna}:{}),
    danger:level==='expert'?4:level==='intermediaire'?2:1,
    sky,sky2,sea,sea2,wind:'—',swell:'—',temp:'—',tide:'—',waterType,
    source:{status:'unverified',label:'Fiche Ocean Buddy · septembre 2026 · à vérifier localement',url:null,reviewed:null},
    reviewed:null,editorialStatus:'unverified',edition,catalogNew:true,
    photo
  });
  ids.add(id);added++;
}
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log(catalog.length+' spots ('+added+' added)');
