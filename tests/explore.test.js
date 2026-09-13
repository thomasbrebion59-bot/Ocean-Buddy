const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../ocean-map-model.js'),photos=require('../spot-photos.js');
test('map grouping retains every spot, including exact shared coordinates',()=>{
 const points=[{id:'one',x:0,y:0},{id:'two',x:0,y:0},{id:'near',x:30,y:30},{id:'far',x:500,y:500}];
 const g=M.group(points);assert.deepEqual(g.map(x=>x.items.length),[3,1]);assert.deepEqual(g.flatMap(x=>x.items).map(x=>x.id).sort(),points.map(x=>x.id).sort());assert.equal(points[0].x,0);
});
test('zoom separates nearby spots without losing them',()=>{
 const points=[{id:'a',x:20,y:20},{id:'b',x:50,y:40}];assert.equal(M.group(points).length,1);assert.equal(M.group(points.map(p=>({...p,x:p.x*8,y:p.y*8}))).length,2);assert.deepEqual(M.group([]),[]);
});
test('underwater photographs lead diving and snorkeling, with landscape preserved for other activities',()=>{
 const main={reef:{src:'coast.jpg'}},galleries={reef:[{src:'fish.jpg',view:'underwater'},{src:'reef.jpg',view:'underwater'}]};const p=photos(main,galleries);
 assert.equal(p.lead('reef','plongee').src,'fish.jpg');assert.equal(p.lead('reef','snorkeling').src,'fish.jpg');assert.equal(p.lead('reef','kayak').src,'coast.jpg');assert.equal(p.lead('reef',null).src,'coast.jpg');assert.equal(p.list('reef','plongee').at(-1).src,'coast.jpg');assert.equal(galleries.reef.length,2);
});
test('a spot without underwater photos keeps its own photo; missing and duplicated images are handled',()=>{
 const p=photos({shore:{src:'shore.jpg'}},{shore:[{src:'shore.jpg'},null]});assert.deepEqual(p.list('shore','snorkeling'),[{src:'shore.jpg'}]);assert.deepEqual(p.list('unknown','plongee'),[]);assert.equal(p.lead('unknown'),undefined);
});

test('featured underwater images take priority without changing the source catalogue',()=>{
 const p=photos({a:{src:'old.jpg',view:'underwater'}},{a:[{src:'new.jpg',view:'underwater',featured:true}]});assert.equal(p.lead('a','plongee').src,'new.jpg');assert.equal(p.lead('a','kayak').src,'old.jpg');
});
test('curated underwater photographs include precise captions, local light thumbnails and credits',()=>{
 const fs=require('fs');const main=require('../assets/spots/sources.json'),galleries=require('../assets/spots/gallery-sources.json');const selected=[...Object.values(main),...Object.values(galleries).flat()].filter(p=>p.src.includes('-underwater-'));assert.equal(selected.length,18);for(const p of selected){assert.ok(p.caption&&p.label&&p.author&&p.license,p.src);assert.equal(p.view,'underwater');assert.ok(p.width>=1280,p.src);assert.ok(fs.statSync(p.thumb).size<100000,p.thumb);assert.ok(fs.statSync(p.src).size<1500000,p.src);}
});
