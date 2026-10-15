/* Mini-jeu de surf hors connexion : overlay plein écran créé à la demande. window.OceanSurf = {open, close, isOpen}. */
(function(root){
  'use strict';
  const KEY='oceanbuddy_surf',STEP=1/60,MAX_STEPS=5;
  let ov=null,cv=null,render=null,input=null,menuEl=null,resEl=null,probe=null;
  let open=false,mode='menu',running=false,raf=0,last=0,acc=0,t0=0;
  let paused=false,pauseEl=null,qBtn=null,coachEl=null,coachSpans=null,coachStep=-1,coachOn=false,coachT3=0,G=null,demo=null,char='surfeur',best=0,games=0,bestTrick='',bestTrickPts=0,bestCombo=1,btns=null,lastGrabFail=0,keysOn=false,lastFigSeq=0,lastFallSeq=0;
  const inp=root.SurfModel.newInput();
  const keys={l:false,r:false,u:false,d:false,h:false};
  const ATLAS_V='?v=16',KEY2=KEY;

  function load(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');if(o.char==='surfeuse'||o.char==='surfeur')char=o.char;if(o.best>0)best=o.best|0;games=o.games|0;bestTrick=typeof o.bestTrick==='string'?o.bestTrick:'';bestTrickPts=o.bestTrickPts|0;bestCombo=o.bestCombo>1?o.bestCombo|0:1;}catch(_){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({char,best,games,bestTrick,bestTrickPts,bestCombo}));}catch(_){}}
  function stats(){load();return{best,games,bestTrick,bestCombo,bestTrickPts};}
  function haptic(strong){try{const H=root.Capacitor&&root.Capacitor.Plugins&&root.Capacitor.Plugins.Haptics;if(H&&H.impact)H.impact({style:strong?'MEDIUM':'LIGHT'});}catch(_){}}
  function newGame(calm){return root.SurfModel.createGame((Math.random()*4294967296)>>>0,calm?{calm:true}:undefined);}

  const IC={
    move:'M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4',updown:'M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4',jump:'M12 19V6M6 11l6-6 6 6',
    spin:'M20 12a8 8 0 1 1-3-6.2M20 4v5h-5',grab:'M7 12V7a1.6 1.6 0 0 1 3.2 0v4M10.2 11V5.6a1.6 1.6 0 0 1 3.2 0V11M13.4 11V6.8a1.6 1.6 0 0 1 3.2 0V13c0 4-2 6-5 6s-4-1.5-5-4l-1.2-2.6a1.5 1.5 0 0 1 2.6-1.4L7 12',
    cut:'M5 18c6 0 10-4 14-12M14 6h5v5',snap:'M5 8h10l-3-3M19 16H9l3 3',floater:'M3 14c3-4 6-4 9 0s6 4 9 0',alley:'M12 20V8M7 12l5-5 5 5M5 20h14',
    tube:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',combo:'M6 6l12 12M18 6L6 18'};
  /* Guide : une ligne par action ; touches clavier visibles seulement sur ordinateur. Touches réelles du code (onKey). */
  const GUIDE=[
    ['move','Se déplacer','Glisse le doigt vers la gauche ou la droite.','← →'],
    ['updown','Monter, descendre','Glisse vers le haut pour monter vers la lèvre, vers le bas pour redescendre.','↑ ↓'],
    ['jump','Saut','Bouton Saut, ou touche l’écran.','Espace'],
    ['spin','360','Bouton 360, ou touche l’écran deux fois vite.','D'],
    ['grab','Grab','Bouton Grab pendant un saut. Maintenu longtemps : Tail grab.','G'],
    ['cut','Cutback','Petite diagonale rapide du doigt.','C'],
    ['snap','Snap','Change de direction d’un coup, près de la lèvre.',''],
    ['floater','Floater','Reste en haut de la vague, le long de la lèvre.',''],
    ['alley','Alley-oop','Lance un 360 depuis la lèvre.',''],
    ['tube','Tube','Reste appuyé près de la mousse, sous la lèvre : score ×2.','Maj'],
    ['combo','Combo','Enchaîne les figures sans tomber en moins de 2,5 s : ×2, ×3, jusqu’à ×4.','']];
  function guideHTML(){
    return '<ul class="surf-guide">'+GUIDE.map(r=>'<li><span class="surf-gi"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="'+IC[r[0]]+'" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="surf-gt"><b>'+r[1]+'</b><span>'+r[2]+'</span></span>'+(r[3]?'<span class="surf-gk"><kbd>'+r[3]+'</kbd></span>':'')+'</li>').join('')+'</ul>';
  }
  function build(){
    ov=document.createElement('div');ov.className='surf-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Mini-jeu de surf');
    ov.innerHTML=
      '<canvas class="surf-cv" aria-hidden="true"></canvas><i class="surf-probe" aria-hidden="true"></i>'+
      '<button type="button" class="surf-x" data-surf="close" aria-label="Fermer"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>'+
      '<button type="button" class="surf-q" data-surf="help" aria-label="Comment jouer" hidden>?</button>'+
      '<div class="surf-coach" aria-live="polite"><span>Glisse ton doigt pour te déplacer</span><span>Touche Saut pour décoller</span><span>En l’air, touche Grab !</span><span>Approche-toi de la mousse, sous la lèvre, et reste appuyé : tube !</span></div>'+
      '<div class="surf-pause" hidden><div class="surf-card"><small>Pause</small><h2>Comment jouer</h2>'+guideHTML()+'<div class="surf-row"><button type="button" class="surf-btn surf-go" data-surf="resume">Reprendre</button><button type="button" class="surf-btn surf-ghost" data-surf="quit">Quitter</button></div></div></div>'+
      '<div class="surf-btns" hidden>'+
      '<button type="button" data-act="jump"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><b>Saut</b></button>'+
      '<button type="button" data-act="spin"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><b>360</b></button>'+
      '<button type="button" data-act="grab"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 12V7a1.6 1.6 0 0 1 3.2 0v4M10.2 11V5.6a1.6 1.6 0 0 1 3.2 0V11M13.4 11V6.8a1.6 1.6 0 0 1 3.2 0V13c0 4-2 6-5 6s-4-1.5-5-4l-1.2-2.6a1.5 1.5 0 0 1 2.6-1.4L7 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><b>Grab</b></button></div>'+
      '<div class="surf-menu"><div class="surf-card"><small>Hors connexion</small><h2>Surf</h2><p class="surf-sub">Une manche de 75 secondes. Choisis ton personnage.</p>'+
      '<div class="surf-pick" role="radiogroup" aria-label="Personnage">'+
      '<button type="button" role="radio" data-char="surfeur"><i class="surf-av surf-av-m" aria-hidden="true"></i><b>Surfeur</b></button>'+
      '<button type="button" role="radio" data-char="surfeuse"><i class="surf-av surf-av-f" aria-hidden="true"></i><b>Surfeuse</b></button></div>'+
      '<h3 class="surf-gh">Comment jouer</h3>'+guideHTML()+
      '<p class="surf-best" data-surf-best></p>'+
      '<button type="button" class="surf-btn surf-go" data-surf="play">Jouer</button></div></div>'+
      '<div class="surf-res" hidden><div class="surf-card"><small>Fin de la manche</small><h2 data-surf-score></h2><p data-surf-fig></p><p data-surf-record class="surf-rec"></p><p data-surf-count></p><p data-surf-combo></p><p data-surf-bestscore></p>'+
      '<div class="surf-row"><button type="button" class="surf-btn surf-go" data-surf="again">Rejouer</button><button type="button" class="surf-btn surf-ghost" data-surf="quit">Quitter</button></div></div></div>';
    cv=ov.querySelector('canvas');menuEl=ov.querySelector('.surf-menu');resEl=ov.querySelector('.surf-res');probe=ov.querySelector('.surf-probe');
    render=root.SurfRender.create(cv);
    input=root.SurfInput.attach(cv,inp);
    ov.addEventListener('click',onClick);
    btns=ov.querySelector('.surf-btns');pauseEl=ov.querySelector('.surf-pause');qBtn=ov.querySelector('.surf-q');coachEl=ov.querySelector('.surf-coach');coachSpans=coachEl.querySelectorAll('span');
    btns.querySelectorAll('button').forEach(b=>{
      const a=b.dataset.act;
      b.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='play')return;if(a==='jump')inp.tap=true;else if(a==='spin')inp.dbl=true;else inp.grab=true;try{b.setPointerCapture(e.pointerId);}catch(_){}});
      const up=()=>{if(a==='grab')inp.grab=false;};
      b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      b.addEventListener('contextmenu',e=>e.preventDefault());
    });
    ['surfeur','surfeuse'].forEach(n=>{const im=new Image();im.onload=()=>{if(im.naturalWidth>0){ov.classList.add('has-'+n);if(im.naturalWidth>=1000&&im.naturalHeight>=1000)ov.classList.add('g16-'+n);render.warm(im);}};im.src='assets/surf/'+n+'.webp'+ATLAS_V;});
    document.body.appendChild(ov);
  }
  function theme(){
    const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim();
    render.setTheme({main:g('--t-main'),deep:g('--t-deep'),bright:g('--t-bright')});
  }
  function measure(){
    if(!ov)return;
    const w=ov.clientWidth,h=ov.clientHeight,dpr=Math.min(root.devicePixelRatio||1,2);
    render.resize(w,h,dpr,probe.offsetHeight);
  }
  function onClick(e){
    const c=e.target.closest('[data-char]');
    if(c){char=c.dataset.char;save();render.setChar(char);paintPick();return;}
    const b=e.target.closest('[data-surf]');if(!b)return;
    const a=b.dataset.surf;
    if(a==='close'||a==='quit')close();
    else if(a==='play'||a==='again')start();
    else if(a==='help')setPause(true);
    else if(a==='resume')setPause(false);
  }
  function setPause(on){
    if(mode!=='play'||paused===on)return;
    paused=on;pauseEl.hidden=!on;input.reset();inp.grab=false;keys.l=keys.r=keys.u=keys.d=keys.h=false;
    if(on)pauseEl.querySelector('[data-surf=resume]').focus({preventScroll:true});else{acc=0;last=performance.now();}
  }
  function coachTo(n){
    if(n===coachStep)return;coachStep=n;
    coachEl.classList.toggle('on',n>=0&&n<4);
    for(let i=0;i<coachSpans.length;i++)coachSpans[i].classList.toggle('on',i===n);
    if(n===3)coachT3=G.t;
  }
  /* coach des deux premières parties : bulles non bloquantes, qui disparaissent une fois l'action faite */
  function coachTick(){
    if(!coachOn)return;
    let n=coachStep;
    if(n===0&&(Math.abs(inp.mx)>0.3||Math.abs(inp.my)>0.3||G.t>6))n=1;
    if(n===1&&(G.air||G.figCount>0))n=2;
    if(n===2&&(G.grabT>0.05||!G.air))n=3;
    if(n===3&&(G.tube||G.t>coachT3+14))n=4;
    coachTo(n);
  }
  function paintPick(){ov.querySelectorAll('[data-char]').forEach(b=>{const on=b.dataset.char===char;b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false');});}
  function showMenu(){
    mode='menu';paused=false;pauseEl.hidden=true;qBtn.hidden=true;coachTo(-1);coachOn=false;menuEl.hidden=false;resEl.hidden=true;btns.hidden=true;paintPick();
    ov.querySelector('[data-surf-best]').textContent=best?'Meilleur score : '+best:'';
    demo=newGame(true);G=demo;input.reset();
    setTimeout(()=>ov&&open&&mode==='menu'&&ov.querySelector('[data-surf=play]').focus({preventScroll:true}),30);
  }
  function start(){
    mode='play';menuEl.hidden=true;resEl.hidden=true;btns.hidden=false;qBtn.hidden=false;paused=false;pauseEl.hidden=true;inp.grab=false;lastGrabFail=0;G=newGame(false);lastFigSeq=0;lastFallSeq=0;input.reset();acc=0;coachOn=games<2;coachStep=-2;coachT3=0;coachTo(coachOn?0:-1);
    cv.focus&&cv.focus({preventScroll:true});
  }
  function finish(){
    mode='result';input.reset();inp.grab=false;btns.hidden=true;qBtn.hidden=true;coachTo(-1);coachOn=false;
    const sc=Math.floor(G.score),rec=sc>best;if(rec)best=sc;
    games++;if(G.bestFigPts>bestTrickPts){bestTrickPts=G.bestFigPts|0;bestTrick=G.bestFig;}if(G.bestCombo>bestCombo)bestCombo=G.bestCombo;save();
    ov.querySelector('[data-surf-count]').textContent='Figures : '+G.figCount;
    ov.querySelector('[data-surf-combo]').textContent='Meilleure combo : ×'+G.bestCombo;
    try{root.dispatchEvent(new CustomEvent('ocean:surf-stats'));}catch(_){}
    ov.querySelector('[data-surf-score]').textContent='Score : '+sc;
    ov.querySelector('[data-surf-fig]').textContent=G.bestFig?'Meilleure figure : '+G.bestFig:'Meilleure figure : aucune';
    ov.querySelector('[data-surf-record]').textContent=rec&&sc>0?'Nouveau record !':'';
    ov.querySelector('[data-surf-bestscore]').textContent='Meilleur score : '+best;
    resEl.hidden=false;
    setTimeout(()=>ov&&open&&mode==='result'&&ov.querySelector('[data-surf=again]').focus({preventScroll:true}),30);
  }

  function frame(now){
    raf=0;if(!running)return;
    let dt=(now-last)/1000;last=now;if(dt>0.25)dt=0.25;
    acc+=dt;let n=0;
    const M=root.SurfModel;
    if(mode==='play'&&paused){acc=0;}
    else if(mode==='play'){
      input.poll(now);
      if(keysOn){inp.mx=(keys.r?1:0)-(keys.l?1:0);inp.my=(keys.u?1:0)-(keys.d?1:0);inp.hold=keys.h;}
    }
    while(acc>=STEP&&n<MAX_STEPS){
      if(mode==='menu'){if(demo.phase==='over')demo=G=newGame(true);render.snap(demo);M.step(demo,inp,STEP);}
      else if(mode==='play'&&!paused){render.snap(G);M.step(G,inp,STEP);}
      acc-=STEP;n++;
    }
    if(n===MAX_STEPS&&acc>STEP)acc=0;
    if(mode==='play'&&!paused){
      coachTick();
      if(G.figSeq!==lastFigSeq){lastFigSeq=G.figSeq;haptic(false);}
      if(G.fallSeq!==lastFallSeq){lastFallSeq=G.fallSeq;haptic(true);}
      if(G.grabFailSeq!==lastGrabFail){lastGrabFail=G.grabFailSeq;const gb=btns.querySelector('[data-act=grab]');gb.classList.remove('shake');void gb.offsetWidth;gb.classList.add('shake');}
      if(G.phase==='over')finish();
    }
    render.draw(G,dt,now/1000,acc>0?acc/STEP:0);
    raf=requestAnimationFrame(frame);
  }
  function run(){if(running||!open)return;running=true;last=performance.now();acc=0;raf=requestAnimationFrame(frame);}
  function pause(){running=false;if(raf){cancelAnimationFrame(raf);raf=0;}}
  function onVis(){if(document.hidden)pause();else if(open)run();}
  function onKey(e){
    if(!open)return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
    const dn=e.type==='keydown',k=e.key;
    if(mode!=='play'||paused)return;
    if(k==='ArrowLeft'){keys.l=dn;keysOn=true;}else if(k==='ArrowRight'){keys.r=dn;keysOn=true;}
    else if(k==='ArrowUp'){keys.u=dn;keysOn=true;}else if(k==='ArrowDown'){keys.d=dn;keysOn=true;}
    else if(k==='Shift'){keys.h=dn;keysOn=true;}
    else if(k==='g'||k==='G')inp.grab=dn;
    else if(k===' '&&dn&&!e.repeat){inp.tap=true;e.preventDefault();}
    else if((k==='d'||k==='D')&&dn&&!e.repeat)inp.dbl=true;
    else if((k==='c'||k==='C')&&dn&&!e.repeat)inp.cut=true;
    else return;
    e.preventDefault();
  }

  function openGame(o){
    if(open)return;
    load();if(o&&(o.character==='surfeur'||o.character==='surfeuse')){char=o.character;save();}if(!ov)build();
    open=true;ov.classList.add('on');try{ov.classList.toggle('surf-kbd',matchMedia('(hover:hover) and (pointer:fine)').matches);}catch(_){}document.documentElement.classList.add('surf-open');
    theme();render.localize();render.setChar(char);measure();showMenu();
    root.addEventListener('resize',measure);root.addEventListener('orientationchange',measure);
    document.addEventListener('visibilitychange',onVis);document.addEventListener('keydown',onKey,true);document.addEventListener('keyup',onKey,true);
    run();
  }
  function close(){
    if(!open)return;
    open=false;paused=false;pause();input&&input.reset();keysOn=false;keys.l=keys.r=keys.u=keys.d=keys.h=false;
    ov.classList.remove('on');document.documentElement.classList.remove('surf-open');
    root.removeEventListener('resize',measure);root.removeEventListener('orientationchange',measure);
    document.removeEventListener('visibilitychange',onVis);document.removeEventListener('keydown',onKey,true);document.removeEventListener('keyup',onKey,true);
  }
  root.OceanSurf={open:openGame,close,isOpen:()=>open,stats};
})(window);
