/* Mini-jeu de surf : logique pure (sans DOM). Vague paramétrique, RNG seedée, état muté en place (aucune allocation par pas). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SurfModel=api})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const DUR=75,DT=1/60,FALL_DUR=1.5;
  /* Repère : u = position le long de la vague, relative au front qui déferle (0). u<0 : mousse (chute). 0..1 : épaule. y : 0 pied de la vague, 1 lèvre. */
  const U_FOAM=0.0,U_FLAT=1.0,U_MAX=1.15,TUBE_U0=0.06,TUBE_U1=0.46,TUBE_Y=0.55,TUBE_MIN_HOLLOW=0.45;
  /* Tube : la fenêtre (TUBE_U0 .. TUBE_U1 au départ) se rétrécit jusqu'à TUBE_W1 de large en fin de manche. */
  const TUBE_W0=TUBE_U1-TUBE_U0,TUBE_W1=0.22;
  /* Obstacles : pool fixe de OBS_MAX emplacements. Ils naissent à OBS_SPAWN_U (épaule lointaine), dérivent vers la mousse à OBS_DRIFT×vitesse du front,
     sont visibles mais inoffensifs pendant OBS_WARN secondes (ombre + remous), puis solides. OBS_GAP : distance minimale en u entre deux obstacles
     (≈ durée d'un saut 0,75 s × dérive 0,3 + temps de changer de voie), si bien qu'un obstacle ne bloque jamais seul toutes les voies. */
  const OBS_MAX=8,OBS_T0=10,OBS_WARN=1.3,OBS_DRIFT=0.6,OBS_SPAWN_U=1.1,OBS_GAP=0.34,OBS_OFF_U=-0.12;
  const OBS={ROCK:0,REEF:1,CLOSE:2};
  const OBS_W=[0.035,0.055,0.05],OBS_H=[0.12,0.2,0.6];
  const LANE_Y=[0.17,0.5,0.83];
  const LANE_PAD=0.03,SURF_RX=0.03,SURF_RY=0.05,CLEAR_Z=0.07,CLOSE_D=0.08,GRACE=0.8,DIFF_PULL=0.12,PULL_MAX=0.42;
  const POSE={GLIDE:0,TURN:1,CROUCH:2,AIR:3,FALL:4};
  const TAU=Math.PI*2;
  const PTS={passive:10,tube:60,jump:40,air:100,spin:200,cut:80,tube0:80,snap:100,floater:120,grab:80,tail:150,alley:300,close:25,reverse:200,super:150,layback:120,reentry:150,barrel:250,carve:160};
  const FIGS=['Saut','Air','360','Cutback','Tube','Snap','Floater','Grab','Tail grab','Alley-oop','Reverse','Superman','Layback','Re-entry','Barrel roll','Carve 360'];
  const COMBO_MAX=4;
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
      figSeq:0,figName:'',figPts:0,figT:99,combo:0,comboT:0,bestFig:'',bestFigPts:0,figCount:0,chain:0,chainMask:0,chainT:0,comboMult:1,bestCombo:1,claimT:0,snapT:0,btT:0,snapCd:0,dirS:0,dyS:0,floatT:0,floatDone:false,grabbing:false,grabT:0,grabFailSeq:0,prevGrab:false,
      spinDir:1,barrel:false,superFlag:false,reentry:false,reT:0,layT:0,layDone:false,layback:false,cutAge:9,carveT:0,
      obs:null,obsT:OBS_T0,obsSeq:0,passed:0,closeSeq:0,closeT:9,graceT:0,hitKind:-1,hitU:0,hitY:0,tubeU1:TUBE_U1
    };
    s.obs=new Array(OBS_MAX);
    for(let i=0;i<OBS_MAX;i++)s.obs[i]={on:false,kind:0,u:0,y:0,w:0,h:0,warnT:0,age:0,chk:false,rel:1,seed:0};
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
    if(!first){const d=s.t/s.dur;s.tPull+=DIFF_PULL*(d<1?d:1);if(s.tPull>PULL_MAX)s.tPull=PULL_MAX;}
  }
  /* Largeur de la fenêtre du tube selon la progression d (0..1). */
  function tubeU1(d){d=d<0?0:d>1?1:d;return TUBE_U0+TUBE_W0-(TUBE_W0-TUBE_W1)*d;}
  /* Voies (bas, milieu, haut) bloquées par un obstacle : bit 0..2. La voie « saut » (bit 3) est toujours libre. */
  function obsLanes(o){let m=0;for(let i=0;i<3;i++){const d=LANE_Y[i]-o.y;if((d<0?-d:d)<o.h+SURF_RY+LANE_PAD)m|=1<<i;}return m;}
  function place(o,kind,u,y,seed,warn){
    o.on=true;o.kind=kind;o.u=u;o.y=y;o.w=OBS_W[kind];o.h=OBS_H[kind];o.warnT=warn;o.age=0;o.chk=false;o.rel=1;o.seed=seed;
  }
  /* Place un obstacle dans le premier emplacement libre (aide des tests et du spawn). Retourne l'obstacle ou null. */
  function addObstacle(s,kind,u,y,seed,warn){
    for(let i=0;i<OBS_MAX;i++){const o=s.obs[i];if(!o.on){place(o,kind,u,y,seed||0,warn==null?OBS_WARN:warn);o.rel=u-s.u;s.obsSeq++;return o;}}
    return null;
  }
  /* Génération déterministe (rand(s) seulement) : la densité et le nombre de types montent avec d. */
  function obsSpawn(s,dt){
    s.obsT-=dt;if(s.obsT>0||s.calm||s.opts.noObstacles)return;
    const d=s.t/s.dur<1?s.t/s.dur:1;
    const gap=4.5-3.1*d;s.obsT=gap*(0.75+rand(s)*0.5);
    const n=1+(d>0.2?1:0)+(d>0.45?1:0);
    const kind=Math.min(n-1,Math.floor(rand(s)*n));
    const y=kind===OBS.REEF?0.1:kind===OBS.CLOSE?0.5:0.12+rand(s)*0.76;
    const seed=rand(s);
    /* espacement minimal et passage garanti : pas deux obstacles à moins de OBS_GAP, jamais toutes les voies bloquées */
    let ok=true,mask=0;
    for(let i=0;i<OBS_MAX;i++){const o=s.obs[i];if(o.on&&OBS_SPAWN_U-o.u<OBS_GAP){ok=false;break;}}
    if(ok){tmpO.kind=kind;tmpO.y=y;tmpO.h=OBS_H[kind];mask=obsLanes(tmpO);if(kind!==OBS.CLOSE&&mask===7)ok=false;}
    if(!ok){s.obsT=0.25;return;}
    addObstacle(s,kind,OBS_SPAWN_U,y,seed,OBS_WARN);
  }
  const tmpO={kind:0,y:0,h:0};
  function obsMove(s,dt){
    const dr=OBS_DRIFT*s.speed*dt;
    for(let i=0;i<OBS_MAX;i++){
      const o=s.obs[i];if(!o.on)continue;
      o.u-=dr;o.age+=dt;if(o.warnT>0)o.warnT-=dt;
      if(o.u<OBS_OFF_U)o.on=false;
    }
    obsSpawn(s,dt);
  }
  /* Collision, passage (compteur) et « Frôlé ! » : appelé après le déplacement du surfeur. */
  function obsHit(s){
    const playing=s.phase==='play'&&s.graceT<=0;
    for(let i=0;i<OBS_MAX;i++){
      const o=s.obs[i];if(!o.on||o.warnT>0)continue;
      const du=o.u-s.u,adu=du<0?-du:du,dy=o.y-s.y,ady=dy<0?-dy:dy;
      if(playing&&!o.chk&&adu<o.w+SURF_RX&&ady<o.h+SURF_RY&&s.z<CLEAR_Z){
        o.chk=true;s.hitKind=o.kind;s.hitU=o.u;s.hitY=o.y;fall(s);return;
      }
      if(!o.chk&&o.rel>0&&du<=0){
        o.chk=true;
        if(playing){
          s.passed++;
          const m=s.air?s.z-CLEAR_Z:(o.kind===OBS.CLOSE?9:ady-o.h-SURF_RY);
          if(m>=0&&m<CLOSE_D){award(s,PTS.close*s.comboMult);s.closeSeq++;s.closeT=0;}
        }
      }
      o.rel=du;
    }
  }
  function award(s,pts){s.score+=pts*s.mult;}
  function fig(s,name,pts){
    s.chain++;s.chainT=CHAIN_WIN;s.comboMult=s.chain>=2?(s.chain<COMBO_MAX?s.chain:COMBO_MAX):1;
    if(s.comboMult>s.bestCombo)s.bestCombo=s.comboMult;
    const bit=1<<FIGS.indexOf(name);
    if(s.chain>1&&(s.chainMask&bit))pts*=0.5;
    s.chainMask|=bit;
    const p=pts*s.comboMult;
    award(s,p);s.figSeq++;s.figCount++;s.figName=name;s.figPts=p*s.mult;s.figT=0;s.claimT=0.55;
    if(s.figPts>s.bestFigPts){s.bestFigPts=s.figPts;s.bestFig=name;}
  }
  function fall(s){
    s.phase='fall';s.fallT=0;s.falls++;s.fallSeq++;s.tube=false;s.tubeT=0;s.tubeAnnounced=false;s.mult=1;
    s.air=false;s.z=0;s.spinning=false;s.spin=0;s.chain=0;s.chainMask=0;s.chainT=0;s.comboMult=1;s.grabbing=false;s.grabT=0;s.claimT=0;s.floatT=0;s.layT=0;s.layDone=false;s.layback=false;s.reT=0;s.reentry=false;s.superFlag=false;s.carveT=0;s.pose=POSE.FALL;
  }
  function takeoff(s,spin){
    s.superFlag=false;s.reentry=s.reT>0&&s.y>0.7&&!spin;s.barrel=false;s.spinDir=1;
    if(spin){if(s.smx<-0.35)s.spinDir=-1;else if(s.smy<-0.35)s.barrel=true;}
    s.air=true;s.airT=0;s.spinning=spin;s.spin=0;s.takeoffY=s.y;s.grabbing=false;s.grabT=0;s.airDur=spin?0.95:0.75;
    s.zMax=0.28+0.3*s.y+(spin?0.08:0);s.tube=false;s.tubeT=0;s.mult=1;s.pose=POSE.AIR;
  }
  function land(s){
    const spun=s.spinning&&s.airT>=s.airDur*0.9;
    s.air=false;s.z=0;s.pose=POSE.GLIDE;
    if(spun)(s.takeoffY>0.7)?fig(s,'Alley-oop',PTS.alley):s.barrel?fig(s,'Barrel roll',PTS.barrel):s.spinDir<0?fig(s,'Reverse',PTS.reverse):fig(s,'360',PTS.spin);
    else if(s.takeoffY>0.7)fig(s,'Air',PTS.air);
    else fig(s,'Saut',PTS.jump);
    if(s.grabT>0.08){if(s.superFlag)fig(s,'Superman',PTS.super);else if(s.grabT>=0.45)fig(s,'Tail grab',PTS.tail);else fig(s,'Grab',PTS.grab);}
    if(s.reentry)fig(s,'Re-entry',PTS.reentry);
    s.spinning=false;s.spin=0;s.grabbing=false;s.grabT=0;s.superFlag=false;s.reentry=false;s.barrel=false;s.spinDir=1;
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
    s.tubeU1=tubeU1(s.t/s.dur);
    if(s.graceT>0)s.graceT-=dt;s.closeT+=dt;s.cutAge+=dt;if(s.reT>0)s.reT-=dt;if(s.carveT>0)s.carveT-=dt;
    obsMove(s,dt);
    if(s.chainT>0){s.chainT-=dt;if(s.chainT<=0){s.chain=0;s.chainMask=0;s.comboMult=1;}}
    if(s.claimT>0)s.claimT-=dt;if(s.snapT>0)s.snapT-=dt;if(s.btT>0)s.btT-=dt;if(s.snapCd>0)s.snapCd-=dt;
    if(s.phase==='fall'){
      s.fallT+=dt;obsHit(s);
      inp.tap=inp.dbl=inp.cut=false;s.prevGrab=!!inp.grab;
      if(s.fallT>=FALL_DUR){s.phase='play';s.u=0.55;s.y=0.45;s.graceT=GRACE;s.pose=POSE.GLIDE;s.flatT=0;s.cutT=0;s.turnT=0;s.surgeT=0;}
      return s;
    }
    /* gestes */
    if(s.cutT>0)s.cutT-=dt;
    if(inp.dbl){
      if(!s.air)takeoff(s,true);else if(!s.spinning&&s.airT<0.45){s.spinning=true;s.airDur=0.95;s.spinDir=s.smx<-0.35?-1:1;s.barrel=s.spinDir>0&&s.smy<-0.35;}
    }else if(inp.tap&&!s.air)takeoff(s,false);
    if(inp.cut&&!s.air&&s.cutT<=0&&s.u>0.2){
      const carve=s.cutAge<1.8;s.cutAge=0;
      s.cutT=0.8;s.turnT=0.5;s.surgeT=0.5;s.dir=-1;
      if(carve){s.carveT=0.7;s.cutAge=9;fig(s,'Carve 360',PTS.carve);}else fig(s,'Cutback',PTS.cut);
    }
    inp.tap=inp.dbl=inp.cut=false;
    /* grab : seulement en l'air */
    if(s.air){if(inp.grab){if(!s.grabbing&&s.grabT===0&&s.airT<0.25)s.superFlag=true;s.grabbing=true;s.grabT+=dt;}else s.grabbing=false;}
    else if(inp.grab&&!s.prevGrab&&!(s.y>0.8&&s.floatT>0.3))s.grabFailSeq++;
    s.prevGrab=!!inp.grab;
    /* déplacement */
    let mx=inp.mx;mx=mx>1?1:mx<-1?-1:mx;let my=inp.my;my=my>1?1:my<-1?-1:my;
    const ks=dt*10>1?1:dt*10;s.smx+=(mx-s.smx)*ks;s.smy+=(my-s.smy)*ks;mx=s.smx;my=s.smy;
    const sg=mx>0.35?1:mx<-0.35?-1:0;
    if(sg!==0){if(s.dirS!==0&&sg!==s.dirS&&!s.air&&s.y>0.6&&s.snapCd<=0){fig(s,'Snap',PTS.snap);s.snapT=0.4;s.reT=0.6;s.snapCd=0.8;}s.dirS=sg;}
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
    else if(s.y<0.7){s.floatT=0;s.floatDone=false;s.layT=0;s.layDone=false;}
    if(!s.air&&s.y>0.8&&s.floatT>0.3&&inp.grab){s.layT+=dt;s.layback=true;if(s.layT>=0.3&&!s.layDone){s.layDone=true;fig(s,'Layback',PTS.layback);}}
    else{s.layback=false;if(s.layT>0&&!(s.y>0.8))s.layT=0;}
    /* air */
    if(s.air){
      s.airT+=dt;const p=s.airT/s.airDur;
      s.z=p>=1?0:4*s.zMax*p*(1-p);
      if(s.spinning)s.spin=s.spinDir*TAU*(p>1?1:p);
      s.pose=POSE.AIR;
    }
    /* tube */
    const inZone=!s.air&&s.hollow>=TUBE_MIN_HOLLOW&&s.u>=TUBE_U0&&s.u<=s.tubeU1&&s.y<=TUBE_Y;
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
    obsHit(s);
    if(s.phase==='fall')return s;
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
  return{COMBO_MAX,createGame,step,award,newInput,faceHeight,rand,DUR,DT,FALL_DUR,POSE,TUBE_U0,TUBE_U1,TUBE_Y,TUBE_MIN_HOLLOW,TUBE_W0,TUBE_W1,tubeU1,U_FLAT,U_MAX,PTS,
    OBS_MAX,OBS_WARN,OBS_GAP,OBS_DRIFT,OBS_SPAWN_U,OBS_T0,OBS,LANE_Y,SURF_RX,SURF_RY,CLEAR_Z,CLOSE_D,GRACE,addObstacle,obsLanes};
});
