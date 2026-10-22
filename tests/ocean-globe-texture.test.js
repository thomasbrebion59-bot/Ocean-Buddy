const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {wantsHd8k,textureStrips}=require('../ocean-map-model.js');

const base={hd:undefined,native:false,mobile:false,maxTex:8192,saveData:false};

test('8K : ordinateur dès 8192 px, pas en dessous',()=>{
  assert.equal(wantsHd8k(base),true);
  assert.equal(wantsHd8k({...base,maxTex:4096}),false);
});
test('8K : mobile seulement avec une texture maximale de 16384 px',()=>{
  assert.equal(wantsHd8k({...base,mobile:true,maxTex:8192}),false);
  assert.equal(wantsHd8k({...base,mobile:true,maxTex:16384}),true);
});
test('8K : jamais dans l’app native, en économie de données, ni pour le petit globe',()=>{
  assert.equal(wantsHd8k({...base,native:true,maxTex:16384}),false);
  assert.equal(wantsHd8k({...base,saveData:true,maxTex:16384}),false);
  assert.equal(wantsHd8k({...base,hd:false,maxTex:16384}),false);
});

/* Texture sans à-coup : bandes envoyées au GPU une à une (ocean-globe.js, streamTexture). */
const covers=(strips,height)=>{let y=0;for(const s of strips){assert.equal(s.y,y,'bandes contiguës');assert.ok(s.h>0);y+=s.h;}assert.equal(y,height,'toute la hauteur');};
test('bandes : 8K en 128 bandes de 32 lignes (1 Mo chacune)',()=>{
  const s=textureStrips(8192,4096);
  assert.equal(s.length,128);assert.ok(s.every(b=>b.h===32&&b.h*8192*4<=1048576));covers(s,4096);
});
test('bandes : 4K en 32 bandes de 64 lignes',()=>{
  const s=textureStrips(4096,2048);
  assert.equal(s.length,32);covers(s,2048);
});
test('bandes : hauteur non divisible, petite image et budget minuscule',()=>{
  covers(textureStrips(8192,4100),4100);
  assert.deepEqual(textureStrips(64,32),[{y:0,h:32}]);
  const tiny=textureStrips(100,3,1);assert.equal(tiny.length,3);covers(tiny,3);
});

const src=fs.readFileSync(path.join(__dirname,'..','ocean-globe.js'),'utf8');
test('globe : la 8K et les 4K passent par le chargement sans à-coup',()=>{
  assert.match(src,/smoothTexture\(asset\('assets\/globe\/earth-day-8k\.webp'\),true,8\)/);
  assert.match(src,/smoothTexture\(asset\('assets\/globe\/earth-day-4k\.webp'\),true,\d+\)/);
  assert.match(src,/smoothTexture\(asset\('assets\/globe\/earth-normal-4k\.webp'\),false,\d+\)/);
  assert.doesNotMatch(src,/loadTexture\(asset\('assets\/globe\/earth-day-8k/,'plus d’envoi de la 8K d’un seul bloc');
});
test('globe : décodage hors fil principal, orientation et mipmaps identiques à l’ancien chargement',()=>{
  assert.match(src,/createImageBitmap\(await res\.blob\(\)\)/,'décodage sans option : aucune transformation de l’image entière sur le fil principal');
  assert.match(src,/createImageBitmap\(bmp,0,s\.y,W,s\.h,\{imageOrientation:'flipY'\}\)/,'bandes retournées (UNPACK_FLIP_Y ignoré pour une ImageBitmap)');
  assert.match(src,/at\.y=H-s\.y-s\.h/,'bandes placées en miroir, comme flipY');
  assert.match(src,/tex\.source\.dataReady=false/,'mémoire GPU réservée sans données');
  assert.match(src,/renderer\.copyTextureToTexture\(src,tex,null,at\)/,'envoi par bandes');
  assert.match(src,/tex\.generateMipmaps=i===strips\.length/,'mipmaps calculées une seule fois, après la dernière bande');
  assert.match(src,/function texParams\(tex,srgb\)/,'mêmes filtres pour les deux chemins');
});
test('globe : shaders compilés pendant le chargement des textures, avant la première image',()=>{
  assert.match(src,/renderer\.compileAsync\(s,c\)/);
  assert.match(src,/smoothTexture\(asset\('assets\/globe\/earth-normal-4k\.webp'\),false,\d+\),\s*shadersReady\s*\]\)/,'la Terre n’apparaît qu’une fois shaders et textures prêts');
});
test('moteur three : copyTextureToTexture et dataReady présents dans le paquet réduit',()=>{
  const three=fs.readFileSync(path.join(__dirname,'..','vendor','three','three.globe.min.js'),'utf8');
  assert.ok(three.includes('copyTextureToTexture'));assert.ok(three.includes('dataReady'));
});

test('le chargement par bandes est coupé sur WebKit (Terre en lamelles décalées sur iPhone)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'ocean-globe.js'), 'utf8');
  const fn = src.slice(src.indexOf('function bitmapsFlip'), src.indexOf('Tranche de travail'));
  assert.match(fn, /iP\(hone\|ad\|od\)/);
  assert.match(fn, /Apple Computer, Inc\./);
  assert.ok(fn.indexOf('iP(hone') < fn.indexOf("createElement('canvas')"));
});
