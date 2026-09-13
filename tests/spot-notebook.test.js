const {test}=require('node:test');const assert=require('node:assert/strict');const M=require('../spot-notebook-model');
const ids=['a','b','c','d'];
test('restores only real unique spots, limits comparison to three, tolerates malformed storage',()=>{
 assert.deepEqual(M.clean({compare:['a','missing','a','b','c','d'],notes:{a:'quai',missing:'obsolete',b:42}},ids),{compare:['a','b','c'],notes:{a:'quai'}});
 assert.deepEqual(M.load({getItem(){throw Error('denied')}},ids),{compare:[],notes:{}});
 assert.deepEqual(M.load({getItem(){return '{broken'}},ids),{compare:[],notes:{}});
});
test('rejects a fourth spot without mutating the saved selection and allows removal',()=>{
 const initial={compare:['a','b','c'],notes:{a:'contact'}};
 assert.throws(()=>M.toggle(initial,'d',ids),/trois/);assert.equal(initial.compare.length,3);
 const next=M.toggle(initial,'b',ids);assert.deepEqual(next.compare,['a','c']);assert.equal(next.notes.a,'contact');assert.equal(initial.compare.length,3);
 assert.throws(()=>M.toggle(initial,'unknown',ids),/introuvable/);
});
test('notes remain independent from comparison, preserve text and enforce size limit',()=>{
 let state=M.note({compare:['a'],notes:{}},'b','Rendez-vous <quai> & café',ids);assert.equal(state.notes.b,'Rendez-vous <quai> & café');assert.deepEqual(state.compare,['a']);
 state=M.note(state,'c','x'.repeat(3000),ids);assert.equal(state.notes.c.length,1800);
 state=M.note(state,'b',' ',ids);assert.equal(state.notes.b,undefined);assert.equal(state.notes.c.length,1800);
});
test('storage failure is reported instead of silently claiming a successful save',()=>{
 assert.throws(()=>M.save({setItem(){throw Error('quota')}},{compare:['a'],notes:{}}),/quota/);
});
