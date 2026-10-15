const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../surf-model.js');

function run(seed,secs,fn,opts){const s=M.createGame(seed,opts),inp=M.newInput();const n=Math.round(secs*60);for(let i=0;i<n;i++){fn&&fn(i,inp,s);M.step(s,inp,M.DT);}return s;}
const snap=s=>JSON.stringify({u:s.u,y:s.y,score:s.score,falls:s.falls,fig:s.figSeq,t:s.t,h:s.hollow});

test('la partie est déterministe pour une graine donnée',()=>{
  const ctl=(i,inp)=>{inp.mx=Math.sin(i/37)*0.5+0.3;inp.my=Math.cos(i/53)*0.4;inp.hold=i%400>300;if(i%250===0)inp.tap=true;};
  assert.equal(snap(run(42,30,ctl)),snap(run(42,30,ctl)));
  assert.notEqual(snap(run(42,30,ctl)),snap(run(43,30,ctl)));
});

test('rester dans la mousse provoque une chute, puis on repart',()=>{
  const s=run(1,2,(i,inp)=>{inp.mx=-1;});
  assert.equal(s.phase,'fall');assert.equal(s.falls,1);assert.equal(s.mult,1);
  const r=run(1,4,(i,inp)=>{inp.mx=i<120?-1:0.3;},{calm:true});
  assert.equal(r.phase,'play');
});

test('trop loin devant sur l’épaule plate fait aussi tomber',()=>{
  const s=run(2,6,(i,inp)=>{inp.mx=1;inp.my=0;},{calm:true});
  assert.ok(s.falls>=1);
});

test('le tube double le score',()=>{
  const base=run(5,1.2,(i,inp)=>{},{calm:true,hollow:1,u:0.2,y:0.2});
  const tube=run(5,1.2,(i,inp)=>{inp.hold=true;},{calm:true,hollow:1,u:0.2,y:0.2});
  assert.ok(tube.tubeTotal>1);
  assert.equal(M.PTS.passive>0,true);
  const g=M.createGame(1,{calm:true});g.mult=2;M.award(g,100);assert.equal(g.score,200);
  const noTube=M.createGame(1,{calm:true,hollow:0.1,u:0.2,y:0.2});const inp=M.newInput();inp.hold=true;
  for(let i=0;i<60;i++)M.step(noTube,inp,M.DT);
  assert.equal(noTube.tube,false);
  assert.ok(tube.score>base.score*1.5);
});

test('la manche se termine à 75 s',()=>{
  const s=run(7,74.9,(i,inp)=>{},{calm:true});assert.equal(s.phase,'play');
  const e=run(7,75.5,(i,inp)=>{},{calm:true});assert.equal(e.phase,'over');
  const score=e.score;M.step(e,M.newInput(),M.DT);assert.equal(e.score,score);assert.equal(e.t,75);
});

test('chaque geste donne sa figure',()=>{
  const names=(fn,secs=2)=>run(3,secs,(i,inp)=>{if(i===5)fn(inp);},{calm:true,y:0.3}).figName;
  assert.equal(names(i=>{i.tap=true;}),'Saut');
  assert.equal(names(i=>{i.dbl=true;}),'360');
  assert.equal(names(i=>{i.cut=true;},0.5),'Cutback');
  const t=run(3,2,(i,inp)=>{inp.hold=true;},{calm:true,hollow:1,u:0.2,y:0.2});
  assert.equal(t.figName,'Tube');
  const a=run(3,2,(i,inp)=>{if(i===5)inp.tap=true;},{calm:true,y:0.9});
  assert.equal(a.figName,'Air');
});

test('un double appui juste après le saut transforme le saut en 360',()=>{
  const s=run(3,2,(i,inp)=>{if(i===5)inp.tap=true;if(i===15)inp.dbl=true;},{calm:true});
  assert.equal(s.figName,'360');
});
