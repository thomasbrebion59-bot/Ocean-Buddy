const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseSpotId}=require('../deep-link.js');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('parseSpotId lit ?spot= et refuse les valeurs douteuses',()=>{
  assert.equal(parseSpotId('?spot=hossegor'),'hossegor');
  assert.equal(parseSpotId('?a=1&spot=la-torche_2'),'la-torche_2');
  assert.equal(parseSpotId(''),null);
  assert.equal(parseSpotId('?spot='),null);
  assert.equal(parseSpotId('?spot=<script>'),null);
  assert.equal(parseSpotId('?spot=../x'),null);
});
test('index.html : balises SEO de l’accueil',()=>{
  assert.match(html,/<link rel="canonical" href="https:\/\/oceanbuddy\.app\/">/);
  assert.match(html,/<meta name="apple-itunes-app" content="app-id=6811870966">/);
  const m=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const ld=JSON.parse(m[1]);
  const types=ld['@graph'].map(x=>x['@type']);
  assert.deepEqual(types,['WebSite','MobileApplication']);
  assert.ok(!/aggregateRating|review/i.test(m[1]));
});
test('index.html : deep-link.js chargé, chemins relatifs',()=>{
  assert.match(html,/<script src="deep-link\.js(\?v=[0-9a-f]+)?"><\/script>/);
  const ns=html.match(/<noscript><main[\s\S]*?<\/noscript>/)[0];
  assert.ok(!/href="\//.test(ns));
  for(const [,id] of ns.matchAll(/href="spot\/([^/]+)\//g))assert.ok(JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','catalog.json'),'utf8')).some(s=>s.id===id),id);
});

test('index.html : liens crawlables (href) et lien visible vers spots/',()=>{
  assert.ok(!/<a onclick=/.test(html));
  assert.match(html,/<a href="spots\/"[^>]*>Parcourir tous les spots/);
});
test('deep-link.js : attend la fin de l’onboarding avant d’ouvrir la fiche',()=>{
  const src=fs.readFileSync(path.join(__dirname,'..','deep-link.js'),'utf8');
  assert.match(src,/onbVisible/);
  assert.match(src,/MutationObserver/);
});
