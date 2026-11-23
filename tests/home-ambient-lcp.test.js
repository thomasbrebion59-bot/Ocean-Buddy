/* Fond d’ambiance de l’accueil : l’interface v2 (20 novembre 2026) l’a retiré. L’accueil s’ouvre sur le salut, la recherche
   et « Mes spots » ; plus aucune grande photo n’est préchargée ni posée par le script de démarrage. La liste des photos
   (scripts/build-home-ambient.py) et le carrousel « Spot de rêve » restent dans le code, sans être affichés. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const head=html.slice(0,html.indexOf('</head>'));
const bootSource=[...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('OceanBoot'));
const feed=fs.readFileSync(path.join(root,'home-feed.js'),'utf8');
const list=JSON.parse(bootSource.match(/\/\*ambient\*\/(.*?)\/\*\/ambient\*\//)[1].replace(/'/g,'"'));

test('the ambient list matches HERO_IDS and their real photographs (scripts/build-home-ambient.py)',()=>{
  const ids=JSON.parse(feed.match(/const HERO_IDS=(\[[^\]]*\]);/)[1].replace(/'/g,'"'));
  const photos=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')).map(s=>[s.id,s.photo]));
  const want=ids.filter(id=>photos[id]&&!photos[id].ai&&photos[id].src).map(id=>[id,photos[id].src]);
  assert.deepEqual(list,want);
  for(const [,src] of list)assert.ok(fs.existsSync(path.join(root,src)),src);
});

test('interface v2 : #home no longer starts with an ambient layer; the large title keeps its reserved place',()=>{
  const home=html.slice(html.indexOf('id="home"'));
  const first=home.slice(home.indexOf('>')+1).match(/<(?!!--)[^>]+>/)[0];
  assert.equal(first,'<header class="as-large">');
  assert.doesNotMatch(html,/class="hf-ambient"/);
});

test('interface v2 : the boot script preloads no ambient photo and still waits for the « feed » step',()=>{
  const links=[],observers=[],img={attrs:{},getAttribute(k){return this.attrs[k]??null;},set src(v){this.attrs.src=v;}};
  let found=false;
  const el=()=>({classList:{add(){},remove(){},contains(){return false;}},setAttribute(k,v){this[k]=v;}});
  const context={
    document:{documentElement:el(),getElementById:()=>null,createElement:()=>el(),head:{appendChild:l=>links.push(l)},querySelector:q=>q==='#home>.hf-ambient>img'&&found?img:null},
    location:{protocol:'https:'},performance:{now:()=>0},localStorage:{getItem:()=>null},
    setTimeout:()=>1,clearTimeout(){},addEventListener(){},
    MutationObserver:class{constructor(f){this.f=f;observers.push(this);}observe(){}disconnect(){this.off=true;}}
  };
  context.window=context;vm.createContext(context);vm.runInContext(bootSource,context);
  assert.equal(links.length,0,'no preload link');
  assert.equal(observers.length,0,'nothing waits for an ambient image');
  found=true;assert.equal(img.attrs.src,undefined);
  /* Les deux étapes du rideau restent attendues : « shell » (app-shell.js) et « feed » (home-feed.js). */
  assert.deepEqual({...context.OceanBoot.steps},{shell:false,feed:false});
  assert.match(bootSource,/B\.wait\('shell'\);B\.wait\('feed'\);/);
  assert.match(feed,/function ready\(\)\{const g=\+\+gen;Boot\?\.wait\('feed'\);return settle\(\)\.then\(\(\)=>\{if\(g===gen\)Boot\?\.done\('feed'\);\}\);\}/);
});

test('home-feed.js keeps the ambient photo already set by the boot script',()=>{
  assert.match(feed,/let amb=home\.querySelector\('\.hf-ambient'\);/);
  assert.match(feed,/if\(els\[layer\]\.classList\.contains\('on'\)&&els\[layer\]\.src===img\.src\)return;/);
});
