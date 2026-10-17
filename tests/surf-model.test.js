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
  const g=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=24&&i<34;},{calm:true,y:0.3});
  assert.ok(g.out.includes('Grab'));
  const t=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=22&&i<50;},{calm:true,y:0.3});
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

/* ---------- obstacles, difficulté, nouvelles figures ---------- */
const OBS=M.OBS;
function activeObs(s){let n=0;for(let i=0;i<s.obs.length;i++)if(s.obs[i].on)n++;return n;}
function trace(seed,secs){
  const s=M.createGame(seed),inp=M.newInput(),out=[];let seq=0;
  for(let i=0;i<Math.round(secs*60);i++){M.step(s,inp,M.DT);if(s.obsSeq!==seq){seq=s.obsSeq;const o=s.obs.filter(q=>q.on).sort((a,b)=>b.age-a.age)[0];out.push([+s.t.toFixed(3),o.kind,+o.y.toFixed(4)]);}}
  return out;
}
/* Bot qui lit l'état : reste au milieu de la vague, change de voie ou saute ; ajoute des figures si fancy. */
function bot(opts){
  const o=opts||{};
  return (i,inp,s)=>{
    inp.tap=inp.dbl=inp.cut=false;
    const vrel=M.OBS_DRIFT*s.speed-s.vu;
    let ty=0.45,jump=false,near=null;
    for(const q of s.obs){
      if(!q.on||q.chk||q.u<s.u-0.02||q.u>s.u+0.75)continue;
      if(!near||q.u<near.u)near=q;
    }
    if(near){
      if(near.kind===OBS.CLOSE)jump=true;
      else{
        const blocked=M.obsLanes(near);let best=-1,bd=9;
        for(let l=0;l<3;l++){if(blocked&(1<<l))continue;const d=Math.abs(M.LANE_Y[l]-s.y);if(d<bd){bd=d;best=l;}}
        ty=best<0?0.5:M.LANE_Y[best];
      }
    }
    if(jump&&!s.air){const du=near.u-s.u;if(du>0&&du<=vrel*0.38)inp.tap=true;}
    inp.mx=Math.max(-1,Math.min(1,(0.5-s.u)*5+s.pull/0.5));
    inp.my=Math.max(-1,Math.min(1,(ty-s.y)*5));
    inp.hold=false;
    if(o.fancy&&!near&&!s.air){
      const k=i%(o.per||300);
      if(k===20)inp.tap=true;
      if(k===o.dblAt&&s.y>0.2)inp.dbl=true;
      if(k===o.cutAt)inp.cut=true;
      inp.grab=s.air&&s.airT>0.3;
    }else inp.grab=!!(o.fancy&&s.air&&s.airT>0.3);
  };
}

test('obstacles : même graine = mêmes obstacles aux mêmes instants, autre graine = autre parcours',()=>{
  const a=trace(21,75),b=trace(21,75),c=trace(22,75);
  assert.ok(a.length>5,String(a.length));
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
  assert.ok(a[0][0]>=M.OBS_T0,'aucun obstacle avant '+M.OBS_T0+' s');
  const mine=run(21,40,bot()),twin=run(21,40,bot());
  assert.equal(snap(mine),snap(twin));
});

test('obstacles : télégraphie d’au moins 1,2 s avant l’impact',()=>{
  assert.ok(M.OBS_WARN>=1.2);
  const s=M.createGame(5,{noObstacles:true});const o=M.addObstacle(s,OBS.ROCK,M.OBS_SPAWN_U,0.5,0);
  assert.equal(o.warnT,M.OBS_WARN);
  /* pendant l’avertissement, le rocher est inoffensif même sous le surfeur */
  const g=M.createGame(5,{noObstacles:true,calm:true,y:0.5});M.addObstacle(g,OBS.ROCK,g.u,0.5,0);
  const inp=M.newInput();for(let i=0;i<30;i++)M.step(g,inp,M.DT);
  assert.equal(g.falls,0);
});

test('passage garanti : une voie libre à chaque obstacle et espacement minimal, bot sans chute sur 24 graines',()=>{
  for(let seed=1;seed<=24;seed++){
    const s=M.createGame(seed*7919),inp=M.newInput(),f=bot();let last=null,spawned=0,seq=0;
    for(let i=0;i<4500;i++){
      f(i,inp,s);M.step(s,inp,M.DT);
      assert.ok(activeObs(s)<=M.OBS_MAX);
      for(const o of s.obs){if(!o.on||o.kind===OBS.CLOSE)continue;assert.notEqual(M.obsLanes(o),7);}
      for(const a of s.obs)for(const b of s.obs){if(a!==b&&a.on&&b.on)assert.ok(Math.abs(a.u-b.u)>=M.OBS_GAP-0.02,'espacement seed '+seed);}
      if(s.obsSeq!==seq){seq=s.obsSeq;spawned++;}
    }
    assert.equal(s.falls,0,'chute, graine '+seed+' à '+s.t.toFixed(1)+' s');
    assert.ok(spawned>=10,'assez d’obstacles : '+spawned);
  }
});

test('collision : un rocher sur la trajectoire d’un surfeur immobile fait tomber et remet le combo à zéro',()=>{
  const s=M.createGame(9,{calm:true,y:0.5,u:0.5}),inp=M.newInput();
  s.chain=2;s.comboMult=2;s.chainT=2;
  M.addObstacle(s,OBS.ROCK,0.62,0.5,0,0);
  for(let i=0;i<180&&s.phase==='play';i++)M.step(s,inp,M.DT);
  assert.equal(s.phase,'fall');assert.equal(s.falls,1);assert.equal(s.comboMult,1);assert.equal(s.chain,0);assert.equal(s.hitKind,OBS.ROCK);
  assert.equal(M.FALL_DUR,1.5);
});

test('un saut au-dessus du rocher ne fait pas tomber, un récif ne se saute qu’en l’air',()=>{
  const air=run(9,0.3,()=>{},{calm:true,y:0.5,u:0.5});void air;
  const go=(kind,y,jump)=>{
    const s=M.createGame(9,{calm:true,y,u:0.5}),inp=M.newInput();
    M.addObstacle(s,kind,0.6,y,0,0);
    for(let i=0;i<120;i++){
      if(jump&&!s.air&&s.obs[0].u-s.u<0.11&&s.obs[0].u-s.u>0)inp.tap=true;
      M.step(s,inp,M.DT);inp.tap=false;
    }
    return s;
  };
  assert.equal(go(OBS.ROCK,0.5,true).falls,0);
  assert.equal(go(OBS.ROCK,0.5,false).falls,1);
  assert.equal(go(OBS.REEF,0.1,true).falls,0);
  assert.equal(go(OBS.REEF,0.1,false).falls,1);
  assert.equal(go(OBS.CLOSE,0.5,true).falls,0);
  assert.equal(go(OBS.CLOSE,0.5,false).falls,1);
  /* récif : un surfeur haut passe sans sauter */
  const s=M.createGame(9,{calm:true,y:0.8,u:0.5}),inp=M.newInput();M.addObstacle(s,OBS.REEF,0.6,0.1,0,0);
  for(let i=0;i<120;i++)M.step(s,inp,M.DT);
  assert.equal(s.falls,0);
});

test('Frôlé ! : à moins de 0,08 sans collision, +PTS.close une seule fois',()=>{
  const pass=gapY=>{
    const s=M.createGame(9,{calm:true,y:0.5,u:0.5}),inp=M.newInput();
    s.y=0.5;M.addObstacle(s,OBS.ROCK,0.7,0.5+gapY,0,0);
    const sc0=s.score;let scoreStep=0;
    for(let i=0;i<150;i++){s.y=0.5;s.obs[0].y=0.5+gapY;const b=s.score;M.step(s,inp,M.DT);if(s.closeSeq>0&&!scoreStep)scoreStep=s.score-b;}
    return {s,scoreStep,sc0};
  };
  const tight=0.12+M.SURF_RY+0.03; /* marge de 0,03 au-delà de la boîte de collision */
  const r=pass(tight);
  assert.equal(r.s.falls,0);assert.equal(r.s.closeSeq,1);
  assert.ok(Math.abs(r.scoreStep-(M.PTS.close+M.PTS.passive*M.DT))<1e-6,String(r.scoreStep));
  assert.equal(M.PTS.close,25);
  const wide=pass(0.5);assert.equal(wide.s.closeSeq,0);assert.equal(wide.s.falls,0);
});

test('le tube se rétrécit au fil de la manche',()=>{
  assert.ok(M.tubeU1(1)-M.TUBE_U0<M.tubeU1(0)-M.TUBE_U0);
  assert.ok(Math.abs((M.tubeU1(0)-M.TUBE_U0)-0.40)<1e-9);assert.ok(Math.abs((M.tubeU1(1)-M.TUBE_U0)-0.22)<1e-9);
  /* un point à u=0.35 est dans le tube au début, plus à la fin */
  const at=t=>{const s=M.createGame(2,{calm:true,hollow:1,u:0.35,y:0.2,duration:75}),inp=M.newInput();inp.hold=true;s.t=t;s.vu=0;
    s.u=0.35;M.step(s,inp,M.DT);return s.tube;};
  assert.equal(at(0.1),true);assert.equal(at(74),false);
});

test('pool : jamais plus de OBS_MAX obstacles actifs, aucune allocation',()=>{
  const s=M.createGame(3,{calm:true}),n=s.obs.length;
  for(let i=0;i<20;i++)M.addObstacle(s,OBS.ROCK,1,0.5,0);
  assert.equal(activeObs(s),M.OBS_MAX);assert.equal(M.addObstacle(s,OBS.ROCK,1,0.5,0),null);assert.equal(s.obs.length,n);
  const t=run(31,75,()=>{},{});assert.ok(t.obs.length===M.OBS_MAX);
});

test('nouvelle figure : Reverse (360 avec glisse à gauche)',()=>{
  const r=figs(3,2,(i,inp)=>{inp.mx=i<8?-0.9:0;if(i===5)inp.dbl=true;},{calm:true,y:0.3,u:0.7});
  assert.ok(r.out.includes('Reverse'),r.out.join());
  assert.equal(r.s.bestFig,'Reverse');assert.equal(r.s.figName,'Reverse');
  assert.ok(r.s.score>=M.PTS.spin);
  const plain=figs(3,2,(i,inp)=>{if(i===5)inp.dbl=true;},{calm:true,y:0.3});
  assert.equal(plain.out.includes('Reverse'),false);
});

test('nouvelle figure : Superman (Grab dans les 0,25 s après le décollage)',()=>{
  const r=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=8&&i<30;},{calm:true,y:0.3});
  assert.ok(r.out.includes('Superman'),r.out.join());assert.equal(r.out.includes('Grab'),false);assert.equal(r.out.includes('Tail grab'),false);
  assert.equal(r.s.bestFig,'Superman');assert.equal(r.s.bestFigPts,M.PTS.super*2);
  const late=figs(3,2,(i,inp)=>{if(i===5)inp.tap=true;inp.grab=i>=24&&i<34;},{calm:true,y:0.3});
  assert.equal(late.out.includes('Superman'),false);assert.ok(late.out.includes('Grab'));
});

test('nouvelle figure : Layback (Grab maintenu pendant un floater)',()=>{
  const r=figs(3,2,(i,inp)=>{inp.grab=i>=40;},{calm:true,y:0.9});
  assert.ok(r.out.includes('Layback'),r.out.join());
  assert.equal(r.out.filter(n=>n==='Layback').length,1);
  const pts=[];const g=M.createGame(3,{calm:true,y:0.9}),inp=M.newInput();let seq=0;
  for(let i=0;i<120;i++){inp.grab=i>=40;M.step(g,inp,M.DT);if(g.figSeq!==seq){seq=g.figSeq;pts.push([g.figName,g.figPts]);}}
  const lb=pts.find(p=>p[0]==='Layback');assert.ok(lb);assert.equal(lb[1],M.PTS.layback*g.bestCombo);
  const none=figs(3,2,(i,inp)=>{},{calm:true,y:0.9});assert.equal(none.out.includes('Layback'),false);
});

test('nouvelle figure : Re-entry (snap puis décollage dans les 0,6 s)',()=>{
  const r=figs(3,3,(i,inp,s)=>{inp.mx=i<30?1:-1;if(s.snapT>0.2&&!s.air&&s.reT>0.2)inp.tap=true;},{calm:true,y:0.78});
  assert.ok(r.out.includes('Snap'));assert.ok(r.out.includes('Re-entry'),r.out.join());
  assert.equal(r.out.filter(n=>n==='Re-entry').length,1);
  const late=figs(3,3,(i,inp,s)=>{inp.mx=i<30?1:-1;if(i===30+60)inp.tap=true;},{calm:true,y:0.78});
  assert.equal(late.out.includes('Re-entry'),false);
});

test('figure en plus : Barrel roll (360 avec glisse vers le bas)',()=>{
  const r=figs(3,2,(i,inp)=>{inp.my=i<8?-0.9:0;if(i===5)inp.dbl=true;},{calm:true,y:0.5});
  assert.ok(r.out.includes('Barrel roll'),r.out.join());
  assert.equal(figs(3,2,(i,inp)=>{if(i===5)inp.dbl=true;},{calm:true,y:0.5}).out.includes('Barrel roll'),false);
});

test('figure en plus : Carve 360 (deux cutbacks enchaînés)',()=>{
  const r=figs(3,3,(i,inp)=>{if(i===5||i===60)inp.cut=true;},{calm:true,y:0.4,u:0.5});
  assert.ok(r.out.includes('Cutback'));assert.ok(r.out.includes('Carve 360'),r.out.join());
  const slow=figs(3,5,(i,inp)=>{if(i===5||i===200)inp.cut=true;},{calm:true,y:0.4,u:0.5});
  assert.equal(slow.out.includes('Carve 360'),false);
});

test('équilibrage : joueur passif < 1 500 points, bon joueur (évite et enchaîne toutes les 9 s) entre 3 000 et 8 000',()=>{
  let passive=0;for(let seed=1;seed<=10;seed++){const s=run(seed*101,75.5,()=>{});passive=Math.max(passive,s.score);}
  assert.ok(passive<1500,'passif max '+passive);
  const good=[];for(let seed=1;seed<=10;seed++){const s=run(seed*101,75.5,bot({fancy:true,per:540,dblAt:230,cutAt:400}));good.push(Math.round(s.score));assert.equal(s.falls,0);}
  const mean=good.reduce((a,b)=>a+b,0)/good.length;
  assert.ok(mean>=3000&&mean<=8000&&Math.min(...good)>=3000,'bon joueur '+mean+' '+good.join(','));
});
