const {test}=require('node:test');
const assert=require('node:assert/strict');
const {wantsHd8k}=require('../ocean-map-model.js');

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
