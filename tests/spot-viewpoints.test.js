const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets/voyage/viewpoints.json');
const raw=fs.readFileSync(file,'utf8');
const data=JSON.parse(raw);
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'catalog-runtime.js'),'utf8'),ctx);
const spots=new Map(ctx.window.OCEAN_CATALOG.map(s=>[s.id,s]));
const KINDS=new Set(['parking','centre','plage','vue','jetee','bord','pano','eau','sous']);
const metres=(a,b)=>{const k=Math.cos((a.lat+b.lat)/2*Math.PI/180);return Math.hypot((b.lat-a.lat)*111320,(b.lon-a.lon)*111320*k);};

test('viewpoint list stays small: it is fetched only when a traveller opens the explorer',()=>{
  assert.ok(Buffer.byteLength(raw)<150*1024,`viewpoints.json pèse ${(Buffer.byteLength(raw)/1024).toFixed(1)} Ko`);
  assert.equal(data.v,1);
});

test('every viewpoint belongs to a catalogue spot, stays near it and carries a usable source',()=>{
  for(const [id,entry] of Object.entries(data.s)){
    const s=spots.get(id);assert.ok(s,`spot inconnu : ${id}`);
    assert.ok(Array.isArray(entry.p)&&entry.p.length>0,id);
    const kinds=new Set();
    for(const row of entry.p){
      const [k,lat,lon,head,name,src,...rest]=row;
      assert.ok(KINDS.has(k),`${id} : type ${k}`);
      assert.ok(!kinds.has(k),`${id} : deux vues « ${k} »`);kinds.add(k);
      assert.ok(Number.isFinite(lat)&&Number.isFinite(lon)&&Number.isFinite(head),id);
      assert.equal(typeof name,'string');
      assert.ok(metres(s.coords,{lat,lon})<6000,`${id} : vue ${k} trop loin du spot`);
      if(src==='g')assert.equal(rest.length,0);
      else{
        assert.equal(src,'c',`${id} : source ${src}`);
        const [file,width,author,license]=rest;
        assert.match(file,/^[0-9a-f]\/[0-9a-f]{2}\/[^/]+\.(jpe?g|png)$/i);
        assert.ok(width>=1920,`${id} : panorama trop petit`);
        assert.ok(author&&/^(CC|Public domain)/i.test(license),`${id} : crédit ou licence manquant`);
      }
    }
  }
});
