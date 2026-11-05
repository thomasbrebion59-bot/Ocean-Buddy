/* Carrousel « Spot de rêve » de l’accueil : il suit le sport choisi (repli sur la sélection générale si trop peu de spots). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const feed=fs.readFileSync(path.join(root,'home-feed.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const part=(re)=>{const m=feed.match(re);assert.ok(m,String(re));return m[0];};
const src=[
  part(/const HERO_IDS=\[[^\]]*\];/),
  part(/const has=\([^\n]*\n/),
  part(/function daily\(list,salt\)\{[\s\S]*?\n  \}\n/),
  part(/const HERO_MIN=\d+;\n  function heroSpots\(\)\{[\s\S]*?\n  \}\n/)
].join('\n');
function heroFor(sport,spots=catalog){
  const ctx={SPOTS:spots,photo:s=>s.photo&&!s.photo.ai&&s.photo.src?{src:s.photo.src,w:s.photo.width||0}:null,curSport:()=>sport};
  vm.createContext(ctx);vm.runInContext(src+';this.out=heroSpots();',ctx);
  return ctx.out;
}

test('« Tous » garde la sélection générale du jour',()=>{
  const ids=heroFor('all').map(s=>s.id),gen=JSON.parse(feed.match(/const HERO_IDS=(\[[^\]]*\]);/)[1].replace(/'/g,'"'));
  assert.equal(ids.length,8);
  assert.ok(ids.every(id=>gen.includes(id)));
});

test('un sport choisi ne montre que des spots de ce sport, avec photo réelle',()=>{
  for(const sp of ['surf','plongee','kitesurf','paddle','snorkeling']){
    const out=heroFor(sp);
    assert.ok(out.length>=4&&out.length<=8,sp);
    for(const s of out){assert.ok(s.sports.includes(sp),`${sp}: ${s.id}`);assert.ok(s.photo&&!s.photo.ai&&s.photo.src);}
    assert.equal(new Set(out.map(s=>s.id)).size,out.length);
  }
  assert.ok(!heroFor('surf').some(s=>s.id==='whitehaven'),'plus de Whitehaven pour le surf');
});

test('moins de HERO_MIN spots pour le sport : repli sur la sélection générale',()=>{
  const few=catalog.filter(s=>!(s.sports||[]).includes('surf')).concat(catalog.filter(s=>(s.sports||[]).includes('surf')).slice(0,2));
  assert.equal(heroFor('surf',few).map(s=>s.id).join(),heroFor('all',few).map(s=>s.id).join());
});

test('choix fait à la construction, sans donnée asynchrone, et reconstruit sur changement de sport sous le rideau',()=>{
  const body=feed.match(/function heroSpots\(\)\{[\s\S]*?\n  \}\n/)[0];
  assert.doesNotMatch(body,/seasons|scores|vib\(|bright\(/);
  assert.match(feed,/mountHero\(\);syncHero\(\);syncNoel\(\);/);
  assert.match(feed,/if\(curSport\(\)!==builtSport\)\{mount\(\)/);
});

test('le script de démarrage ne précharge pas la photo générale quand un sport est enregistré',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/sv\.sport!=='all'\)A=\[\]/);
});
