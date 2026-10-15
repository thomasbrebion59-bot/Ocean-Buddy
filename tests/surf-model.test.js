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

function figs(seed,secs,fn,opts){const s=M.createGame(seed,opts),inp=M.newInput(),out=[];let seq=0;const n=Math.round(secs*60);for(let i=0;i<n;i++){fn&&fn(i,inp,s);M.step(s,inp,M.DT);if(s.figSeq!==seq){seq=s.figSeq;out.push(s.figName);}}return {out,s};}

test('chaque geste donne sa figure',()=>{
  const names=(fn,secs=2,o)=>figs(3,secs,(i,inp)=>{if(i===5)fn(inp);},Object.assign({calm:true,y:0.3},o)).out;
  assert.ok(names(i=>{i.tap=true;}).includes('Saut'));
  assert.ok(names(i=>{i.dbl=true;}).includes('360'));
  assert.ok(names(i=>{i.cut=true;},0.5).includes('Cutback'));
  assert.ok(figs(3,2,(i,inp)=>{inp.hold=true;},{calm:true,hollow:1,u:0.2,y:0.2}).out.includes('Tube'));
  assert.ok(names(i=>{i.tap=true;},2,{y:0.9}).includes('Air'));
});

test('un double appui juste après le saut transforme le saut en 360',()=>{
  const r=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;if(i===15)inp.dbl=true;},{calm:true,y:0.3});
  assert.ok(r.out.includes('360'));
});

test('alley-oop : 360 lancé depuis la lèvre',()=>{
  const r=figs(3,2,(i,inp)=>{if(i===5)inp.dbl=true;},{calm:true,y:0.9});
  assert.ok(r.out.includes('Alley-oop'));
});

test('grab et tail grab en l’air, petit tremblement au sol',()=>{
  const g=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=10&&i<20;},{calm:true,y:0.3});
  assert.ok(g.out.includes('Grab'));
  const t=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=10&&i<42;},{calm:true,y:0.3});
  assert.ok(t.out.includes('Tail grab'));
  const f=figs(3,1,(i,inp)=>{inp.grab=i>=10&&i<20;},{calm:true,y:0.3});
  assert.equal(f.out.includes('Grab'),false);assert.ok(f.s.grabFailSeq>=1);
});

test('snap près de la lèvre sur changement de direction',()=>{
  const r=figs(3,1.5,(i,inp)=>{inp.mx=i<30?1:-1;},{calm:true,y:0.78});
  assert.ok(r.out.includes('Snap'));
  const low=figs(3,1.5,(i,inp)=>{inp.mx=i<30?1:-1;},{calm:true,y:0.3});
  assert.equal(low.out.includes('Snap'),false);
});

test('floater : glisser en haut de la vague',()=>{
  const r=figs(3,1.2,(i,inp)=>{},{calm:true,y:0.9});
  assert.ok(r.out.includes('Floater'));
});

test('combo : figures enchaînées multiplient, la chute remet à zéro',()=>{
  const s=run(3,2.2,(i,inp)=>{if(i===5||i===55)inp.tap=true;},{calm:true,y:0.3});
  assert.equal(s.comboMult,2);assert.ok(s.bestCombo>=2);
  const slow=run(3,6,(i,inp)=>{if(i===5||i===250)inp.tap=true;},{calm:true,y:0.3});
  assert.equal(slow.bestCombo,1);
  const f=run(3,3.6,(i,inp)=>{if(i===5||i===55)inp.tap=true;if(i>=100)inp.mx=-1;},{calm:true,y:0.3});
  assert.equal(f.phase,'fall');assert.equal(f.comboMult,1);assert.equal(f.chain,0);assert.ok(f.bestCombo>=2);
});

test('combo plafonné à ×4 et figure répétée = moitié des points',()=>{
  const taps=[5,55,105,155,205,255];
  const r=run(3,5.6,(i,inp)=>{if(taps.includes(i))inp.tap=true;},{calm:true,y:0.3});
  assert.equal(M.COMBO_MAX,4);assert.equal(r.bestCombo,4);assert.ok(r.comboMult<=4);
  /* deux sauts : le second vaut la moitié de 40 points, multipliée par ×2 */
  const g=M.createGame(3,{calm:true,y:0.3}),inp=M.newInput(),pts=[];let seq=0;
  for(let i=0;i<150;i++){if(i===5||i===55)inp.tap=true;M.step(g,inp,M.DT);if(g.figSeq!==seq){seq=g.figSeq;pts.push(g.figPts);}}
  assert.equal(pts[0],40);assert.equal(pts[1],40);
});

test('une bonne partie automatique reste dans une fourchette raisonnable',()=>{
  const s=run(11,75.5,(i,inp)=>{const k=i%240;if(k===10||k===70)inp.tap=true;if(k===130)inp.dbl=true;if(k===200)inp.cut=true;inp.hold=k>140&&k<180;},{calm:true,y:0.4});
  assert.ok(s.score>500&&s.score<15000,String(s.score));
});
