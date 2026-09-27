/* Génère assets/data/spot-guides.js (chargé à la demande) depuis data/spot-guides.json,
   puis met à jour l’URL versionnée dans spot-guide.js. Lancer ensuite scripts/version-assets.py. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'data/spot-guides.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const known=new Set(catalog.map(s=>s.id));
const KINDS=new Set(['nature','plage','village','ville','marche','musee','patrimoine','panorama','rando','ile','lac']);
const TYPES=new Set(['camping','hostel','surfcamp','guest','hotel']);
const round=n=>Math.round(n*1e4)/1e4;
const spots={};let places=0;
for(const [id,g] of Object.entries(source.spots)){
  if(!known.has(id))console.warn('Spot absent du catalogue (conservé pour plus tard) :',id);
  const out={};
  if(g.country)out.c=g.country;
  if(g.vibe)out.v=g.vibe;
  if(g.lang)out.l=g.lang;
  if(Array.isArray(g.hello)&&g.hello.length===2)out.h=g.hello;
  if(Array.isArray(g.food)&&g.food.length===2)out.f=g.food;
  if(g.respect)out.r=g.respect;
  if(g.season)out.s=g.season;
  const around=(g.around||[]).filter(p=>p&&p.n&&p.d&&KINDS.has(p.k)&&Number.isFinite(p.lat)&&Number.isFinite(p.lon));
  if(around.length){
    const langs=new Set(around.map(p=>String(p.wiki||'').split(':')[0]).filter(Boolean));
    const lang=langs.size===1?[...langs][0]:'en';
    if(lang!=='en')out.w=lang;
    out.a=around.map(p=>{const title=String(p.wiki||'').replace(/^[a-z]{2}:/,'');// 1 = même titre que le nom affiché (apostrophe droite), pour alléger le fichier.
    return title?[p.n,p.d,p.k,round(p.lat),round(p.lon),title===p.n.replace(/’/g,"'")?1:title]:[p.n,p.d,p.k,round(p.lat),round(p.lon)];});
    places+=around.length;
  }
  if(g.sleep&&TYPES.has(g.sleep.k)){
    const z={k:g.sleep.k};
    if(TYPES.has(g.sleep.k2))z.k2=g.sleep.k2;
    if(Number.isFinite(g.sleep.f)&&g.sleep.f!==1)z.f=g.sleep.f;
    if(Array.isArray(g.sleep.p)&&g.sleep.p.length)z.p=g.sleep.p;
    if(g.sleep.town)z.town=g.sleep.town;
    if(g.sleep.lbl)z.lbl=g.sleep.lbl;
    out.z=z;
  }
  spots[id]=out;
}
const countries={};
for(const [name,c] of Object.entries(source.countries||{}))countries[name]={lang:c.lang,hello:c.hello,food:c.food,respect:c.respect};
const body=`/* Généré depuis data/spot-guides.json par scripts/build-spot-guides.cjs. Ne pas modifier à la main. */\nwindow.OCEAN_SPOT_GUIDES=${JSON.stringify({edition:source.edition,countries,spots})};\n`;
const outFile=path.join(root,'assets/data/spot-guides.js');
fs.mkdirSync(path.dirname(outFile),{recursive:true});
fs.writeFileSync(outFile,body);
const hash=crypto.createHash('sha256').update(body).digest('hex').slice(0,12);
const loader=path.join(root,'spot-guide.js');
const code=fs.readFileSync(loader,'utf8');
const next=code.replace(/assets\/data\/spot-guides\.js\?v=[0-9a-f]+/,'assets/data/spot-guides.js?v='+hash);
if(next!==code)fs.writeFileSync(loader,next);
console.log(`${Object.keys(spots).length} carnets, ${places} lieux, ${Object.keys(countries).length} pays · ${(Buffer.byteLength(body)/1024).toFixed(0)} Ko · v=${hash}`);
