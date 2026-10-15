/* Mini-jeu de surf : logique pure (sans DOM). Vague paramétrique, RNG seedée, état muté en place (aucune allocation par pas). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SurfModel=api})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const DUR=75,DT=1/60,FALL_DUR=1.3;
  /* Repère : u = position le long de la vague, relative au front qui déferle (0). u<0 : mousse (chute). 0..1 : épaule. y : 0 pied de la vague, 1 lèvre. */
  const U_FOAM=0.0,U_FLAT=1.0,U_MAX=1.15,TUBE_U0=0.06,TUBE_U1=0.46,TUBE_Y=0.55,TUBE_MIN_HOLLOW=0.45;
  const POSE={GLIDE:0,TURN:1,CROUCH:2,AIR:3,FALL:4};
  const TAU=Math.PI*2;
  const PTS={passive:40,tube:150,jump:100,air:250,spin:500,cut:200,tube0:200,snap:250,floater:300,grab:200,tail:350,alley:700};
  const CHAIN_WIN=2.5;

  function rand(s){let a=s.rng=(s.rng+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
  function newInput(){return{mx:0,my:0,tap:false,dbl:false,cut:false,hold:false};}

  function createGame(seed,opts){
    const o=opts||{};
    const s={
      seed:seed>>>0,rng:(seed>>>0)^0x9E3779B9,opts:o,calm:!!o.calm,
      t:0,dur:o.duration||DUR,phase:'play',score:0,
      u:0.5,y:0.45,vu:0,smx:0,smy:0,pose:POSE.GLIDE,dir:1,
      air:false,airT:0,airDur:0.75,z:0,zMax:0.4,spin:0,spinning:false,takeoffY:0,
      tube:false,tubeT:0,tubeTotal:0,tubeAnnounced:false,mult:1,
      speed:0.5,hollow:o.hollow!=null?o.hollow:0.6,pull:0,tSpeed:0.5,tHollow:0.6,tPull:0,secT:0,dist:0,
      flatT:0,fallT:0,falls:0,fallSeq:0,cutT:0,turnT:0,surgeT:0,
      figSeq:0,figName:'',figPts:0,figT:99,combo:0,comboT:0,bestFig:'',bestFigPts:0,figCount:0,chain:0,chainT:0,comboMult:1,bestCombo:1,claimT:0,snapT:0,btT:0,snapCd:0,dirS:0,dyS:0,floatT:0,floatDone:false,grabbing:false,grabT:0,grabFailSeq:0,prevGrab:false
    };
    if(o.u!=null)s.u=o.u;if(o.y!=null)s.y=o.y;
    nextSection(s,true);
    return s;
  }
  function nextSection(s,first){
    s.secT=4+rand(s)*3;
    if(s.calm){s.tPull=0;s.tHollow=s.opts.hollow!=null?s.opts.hollow:s.hollow;return;}
    s.tPull=first?0:(rand(s)*0.45-0.1);
    s.tHollow=0.2+rand(s)*0.8;
    if(s.opts.hollow!=null)s.tHollow=s.opts.hollow;
  }
  function award(s,pts){s.score+=pts*s.mult;}
  function fig(s,name,pts){
    s.chain++;s.chainT=CHAIN_WIN;s.comboMult=s.chain>=2?(s.chain<5?s.chain:5):1;
    if(s.comboMult>s.bestCombo)s.bestCombo=s.comboMult;
    const p=pts*s.comboMult;
    award(s,p);s.figSeq++;s.figCount++;s.figName=name;s.figPts=p*s.mult;s.figT=0;s.claimT=0.55;
    if(s.figPts>s.bestFigPts){s.bestFigPts=s.figPts;s.bestFig=name;}
  }
  function fall(s){
    s.phase='fall';s.fallT=0;s.falls++;s.fallSeq++;s.tube=false;s.tubeT=0;s.tubeAnnounced=false;s.mult=1;
    s.air=false;s.z=0;s.spinning=false;s.spin=0;s.chain=0;s.chainT=0;s.comboMult=1;s.grabbing=false;s.grabT=0;s.claimT=0;s.floatT=0;s.pose=POSE.FALL;
  }
  function takeoff(s,spin){
    s.air=true;s.airT=0;s.spinning=spin;s.spin=0;s.takeoffY=s.y;s.grabbing=false;s.grabT=0;s.airDur=spin?0.95:0.75;
    s.zMax=0.28+0.3*s.y+(spin?0.08:0);s.tube=false;s.tubeT=0;s.mult=1;s.pose=POSE.AIR;
  }
  function land(s){
    const spun=s.spinning&&s.airT>=s.airDur*0.9;
    s.air=false;s.z=0;s.pose=POSE.GLIDE;
    if(spun)(s.takeoffY>0.7)?fig(s,'Alley-oop',PTS.alley):fig(s,'360',PTS.spin);
    else if(s.takeoffY>0.7)fig(s,'Air',PTS.air);
    else fig(s,'Saut',PTS.jump);
    if(s.grabT>0.08){if(s.grabT>=0.45)fig(s,'Tail grab',PTS.tail);else fig(s,'Grab',PTS.grab);}
    s.spinning=false;s.spin=0;s.grabbing=false;s.grabT=0;
  }

  function step(s,inp,dt){
    if(s.phase==='over')return s;
    s.t+=dt;s.figT+=dt;
    if(s.t>=s.dur){s.t=s.dur;s.phase='over';s.tube=false;s.mult=1;s.air=false;s.z=0;return s;}
    /* sections de vague (vitesse du front, creux) */
    s.secT-=dt;if(s.secT<=0)nextSection(s,false);
    const k=dt*1.2<1?dt*1.2:1;
    s.pull+=(s.tPull-s.pull)*k;s.hollow+=(s.tHollow-s.hollow)*k;s.speed=0.5+s.pull;
    s.dist+=s.speed*dt;
    if(s.chainT>0){s.chainT-=dt;if(s.chainT<=0){s.chain=0;s.comboMult=1;}}
    if(s.claimT>0)s.claimT-=dt;if(s.snapT>0)s.snapT-=dt;if(s.btT>0)s.btT-=dt;if(s.snapCd>0)s.snapCd-=dt;
    if(s.phase==='fall'){
      s.fallT+=dt;
      inp.tap=inp.dbl=inp.cut=false;s.prevGrab=!!inp.grab;
      if(s.fallT>=FALL_DUR){s.phase='play';s.u=0.55;s.y=0.45;s.pose=POSE.GLIDE;s.flatT=0;s.cutT=0;s.turnT=0;s.surgeT=0;}
      return s;
    }
    /* gestes */
    if(s.cutT>0)s.cutT-=dt;
    if(inp.dbl){
      if(!s.air)takeoff(s,true);else if(!s.spinning&&s.airT<0.45){s.spinning=true;s.airDur=0.95;}
    }else if(inp.tap&&!s.air)takeoff(s,false);
    if(inp.cut&&!s.air&&s.cutT<=0&&s.u>0.2){
      s.cutT=0.8;s.turnT=0.5;s.surgeT=0.5;s.dir=-1;fig(s,'Cutback',PTS.cut);
    }
    inp.tap=inp.dbl=inp.cut=false;
    /* grab : seulement en l'air */
    if(s.air){if(inp.grab){s.grabbing=true;s.grabT+=dt;}else s.grabbing=false;}
    else if(inp.grab&&!s.prevGrab)s.grabFailSeq++;
    s.prevGrab=!!inp.grab;
    /* déplacement */
    let mx=inp.mx;mx=mx>1?1:mx<-1?-1:mx;let my=inp.my;my=my>1?1:my<-1?-1:my;
    const ks=dt*10>1?1:dt*10;s.smx+=(mx-s.smx)*ks;s.smy+=(my-s.smy)*ks;mx=s.smx;my=s.smy;
    const sg=mx>0.35?1:mx<-0.35?-1:0;
    if(sg!==0){if(s.dirS!==0&&sg!==s.dirS&&!s.air&&s.y>0.6&&s.snapCd<=0){fig(s,'Snap',PTS.snap);s.snapT=0.4;s.snapCd=0.8;}s.dirS=sg;}
    const dg=my>0.35?1:my<-0.35?-1:0;
    if(dg!==0){if(s.dyS<0&&dg>0&&!s.air&&s.y<0.5)s.btT=0.45;s.dyS=dg;}
    const crouch=!!inp.hold&&!s.air;
    let vu=0.5*mx+0.25*(0.5-s.y)-s.pull+0.0;
    if(s.calm)vu=0.5*mx+0.25*(0.5-s.y);
    if(s.surgeT>0){const ph=s.surgeT>0.25?-0.45:0.45;vu+=ph;s.surgeT-=dt;}
    if(s.turnT>0){s.turnT-=dt;if(s.turnT<=0)s.dir=1;}
    s.vu=vu;s.u+=vu*dt;
    if(s.u>U_MAX)s.u=U_MAX;
    s.y+=my*1.4*dt+0.15*(0.45-s.y)*dt;
    if(crouch)s.y+=(0.28-s.y)*(dt*6<1?dt*6:1);
    s.y=s.y<0?0:s.y>1?1:s.y;
    /* floater : glisser le long du haut de la vague */
    if(!s.air&&s.y>0.8){s.floatT+=dt;if(s.floatT>=0.6&&!s.floatDone){s.floatDone=true;fig(s,'Floater',PTS.floater);}}
    else if(s.y<0.7){s.floatT=0;s.floatDone=false;}
    /* air */
    if(s.air){
      s.airT+=dt;const p=s.airT/s.airDur;
      s.z=p>=1?0:4*s.zMax*p*(1-p);
      if(s.spinning)s.spin=TAU*(p>1?1:p);
      s.pose=POSE.AIR;
    }
    /* tube */
    const inZone=!s.air&&s.hollow>=TUBE_MIN_HOLLOW&&s.u>=TUBE_U0&&s.u<=TUBE_U1&&s.y<=TUBE_Y;
    if(crouch&&inZone){
      if(!s.tube){s.tube=true;s.tubeT=0;s.tubeAnnounced=false;}
      s.tubeT+=dt;s.tubeTotal+=dt;s.mult=2;s.pose=POSE.CROUCH;
      award(s,PTS.tube*dt);
      if(!s.tubeAnnounced&&s.tubeT>=0.7){s.tubeAnnounced=true;fig(s,'Tube',PTS.tube0);}
    }else{
      if(s.tube){s.tube=false;s.tubeT=0;s.mult=1;}
      if(!s.air)s.pose=s.turnT>0?POSE.TURN:crouch?POSE.CROUCH:POSE.GLIDE;
    }
    if(s.air&&s.airT>=s.airDur)land(s);
    award(s,PTS.passive*dt);
    /* chute hors zone : mousse derrière ou épaule trop plate */
    if(s.u<U_FOAM){fall(s);return s;}
    if(s.u>U_FLAT){s.flatT+=dt;if(s.flatT>1.5)fall(s);}else s.flatT=0;
    return s;
  }
  /* Profil de la vague (0..1) le long de u, utilisé par le rendu. */
  function faceHeight(u){
    if(u<0)return 0.82;
    if(u<0.1)return 0.82+u*1.3;
    if(u<0.6)return 0.95-0.05*(u-0.1)/0.5;
    const k=(u-0.6)/0.55,kk=k>1?1:k;return 0.9-0.78*kk*kk*(3-2*kk);
  }
  return{createGame,step,award,newInput,faceHeight,rand,DUR,DT,FALL_DUR,POSE,TUBE_U0,TUBE_U1,TUBE_Y,TUBE_MIN_HOLLOW,U_FLAT,U_MAX,PTS};
});
