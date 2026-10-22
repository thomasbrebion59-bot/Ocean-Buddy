/* Fond d’ambiance de l’accueil (élément LCP) : photo du jour posée par le script de démarrage, même rotation que home-feed.js. */
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

test('#home starts with the static ambient layer, first image shown without src',()=>{
  const home=html.slice(html.indexOf('id="home"'));
  const first=home.slice(home.indexOf('>')+1).match(/<(?!!--)[^>]+>/)[0];
  assert.equal(first,'<div class="hf-ambient" aria-hidden="true">');
  assert.match(home,/^[^]*?<div class="hf-ambient" aria-hidden="true"><img alt="" class="on" fetchpriority="high"><img alt=""><\/div>/);
});

test('the boot script preloads today’s photo and sets it on the static ambient image',()=>{
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
  const url=list[new Date().getDate()%list.length][1];
  assert.equal(links.length,1);
  assert.deepEqual([links[0].rel,links[0].as,links[0].href,links[0].fetchpriority],['preload','image',url,'high']);
  observers[0].f();assert.equal(img.attrs.src,undefined,'waits for the parser');
  found=true;observers[0].f();
  assert.equal(img.attrs.src,url);assert.ok(observers[0].off);
});

test('home-feed.js keeps the ambient photo already set by the boot script',()=>{
  assert.match(feed,/let amb=home\.querySelector\('\.hf-ambient'\);/);
  assert.match(feed,/if\(els\[layer\]\.classList\.contains\('on'\)&&els\[layer\]\.src===img\.src\)return;/);
});
