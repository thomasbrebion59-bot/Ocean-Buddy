/* Mini-jeu de surf hors connexion : overlay plein écran créé à la demande. window.OceanSurf = {open, close, isOpen}. */
(function(root){
  'use strict';
  const KEY='oceanbuddy_surf',STEP=1/60,MAX_STEPS=5;
  let ov=null,cv=null,render=null,input=null,menuEl=null,resEl=null,probe=null;
  let open=false,mode='menu',running=false,raf=0,last=0,acc=0,t0=0;
  let G=null,demo=null,char='surfeur',best=0,keysOn=false,lastFigSeq=0,lastFallSeq=0;
  const inp=root.SurfModel.newInput();
  const keys={l:false,r:false,u:false,d:false,h:false};

  function load(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');if(o.char==='surfeuse'||o.char==='surfeur')char=o.char;if(o.best>0)best=o.best|0;}catch(_){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({char,best}));}catch(_){}}
  function haptic(strong){try{const H=root.Capacitor&&root.Capacitor.Plugins&&root.Capacitor.Plugins.Haptics;if(H&&H.impact)H.impact({style:strong?'MEDIUM':'LIGHT'});}catch(_){}}
  function newGame(calm){return root.SurfModel.createGame((Math.random()*4294967296)>>>0,calm?{calm:true}:undefined);}

  function build(){
    ov=document.createElement('div');ov.className='surf-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Mini-jeu de surf');
    ov.innerHTML=
      '<canvas class="surf-cv" aria-hidden="true"></canvas><i class="surf-probe" aria-hidden="true"></i>'+
      '<button type="button" class="surf-x" data-surf="close" aria-label="Fermer"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>'+
      '<div class="surf-menu"><div class="surf-card"><small>Hors connexion</small><h2>Surf</h2><p class="surf-sub">Une manche de 75 secondes. Choisis ton personnage.</p>'+
      '<div class="surf-pick" role="radiogroup" aria-label="Personnage">'+
      '<button type="button" role="radio" data-char="surfeur"><i class="surf-av surf-av-m" aria-hidden="true"></i><b>Surfeur</b></button>'+
      '<button type="button" role="radio" data-char="surfeuse"><i class="surf-av surf-av-f" aria-hidden="true"></i><b>Surfeuse</b></button></div>'+
      '<ul class="surf-how"><li>Glisse pour te déplacer sur la vague.</li><li>Touche pour sauter, deux fois pour un 360.</li><li>Petite diagonale rapide : cutback.</li><li>Reste appuyé près du creux : tube, score doublé.</li></ul>'+
      '<p class="surf-best" data-surf-best></p>'+
      '<button type="button" class="surf-btn surf-go" data-surf="play">Jouer</button></div></div>'+
      '<div class="surf-res" hidden><div class="surf-card"><small>Fin de la manche</small><h2 data-surf-score></h2><p data-surf-fig></p><p data-surf-record class="surf-rec"></p><p data-surf-bestscore></p>'+
      '<div class="surf-row"><button type="button" class="surf-btn surf-go" data-surf="again">Rejouer</button><button type="button" class="surf-btn surf-ghost" data-surf="quit">Quitter</button></div></div></div>';
    cv=ov.querySelector('canvas');menuEl=ov.querySelector('.surf-menu');resEl=ov.querySelector('.surf-res');probe=ov.querySelector('.surf-probe');
    render=root.SurfRender.create(cv);
    input=root.SurfInput.attach(cv,inp);
    ov.addEventListener('click',onClick);
    ['surfeur','surfeuse'].forEach(n=>{const im=new Image();im.onload=()=>{if(im.naturalWidth>0){ov.classList.add('has-'+n);render.warm(im);}};im.src='assets/surf/'+n+'.webp';});
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
  }
  function paintPick(){ov.querySelectorAll('[data-char]').forEach(b=>{const on=b.dataset.char===char;b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false');});}
  function showMenu(){
    mode='menu';menuEl.hidden=false;resEl.hidden=true;paintPick();
    ov.querySelector('[data-surf-best]').textContent=best?'Meilleur score : '+best:'';
    demo=newGame(true);G=demo;input.reset();
    setTimeout(()=>ov&&open&&mode==='menu'&&ov.querySelector('[data-surf=play]').focus({preventScroll:true}),30);
  }
  function start(){
    mode='play';menuEl.hidden=true;resEl.hidden=true;G=newGame(false);lastFigSeq=0;lastFallSeq=0;input.reset();acc=0;
    cv.focus&&cv.focus({preventScroll:true});
  }
  function finish(){
    mode='result';input.reset();
    const sc=Math.floor(G.score),rec=sc>best;if(rec){best=sc;save();}
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
    if(mode==='play'){
      input.poll(now);
      if(keysOn){inp.mx=(keys.r?1:0)-(keys.l?1:0);inp.my=(keys.u?1:0)-(keys.d?1:0);inp.hold=keys.h;}
    }
    while(acc>=STEP&&n<MAX_STEPS){
      if(mode==='menu'){if(demo.phase==='over')demo=G=newGame(true);M.step(demo,inp,STEP);}
      else if(mode==='play')M.step(G,inp,STEP);
      acc-=STEP;n++;
    }
    if(n===MAX_STEPS&&acc>STEP)acc=0;
    if(mode==='play'){
      if(G.figSeq!==lastFigSeq){lastFigSeq=G.figSeq;haptic(false);}
      if(G.fallSeq!==lastFallSeq){lastFallSeq=G.fallSeq;haptic(true);}
      if(G.phase==='over')finish();
    }
    render.draw(G,dt,now/1000);
    raf=requestAnimationFrame(frame);
  }
  function run(){if(running||!open)return;running=true;last=performance.now();acc=0;raf=requestAnimationFrame(frame);}
  function pause(){running=false;if(raf){cancelAnimationFrame(raf);raf=0;}}
  function onVis(){if(document.hidden)pause();else if(open)run();}
  function onKey(e){
    if(!open)return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
    const dn=e.type==='keydown',k=e.key;
    if(mode!=='play')return;
    if(k==='ArrowLeft'){keys.l=dn;keysOn=true;}else if(k==='ArrowRight'){keys.r=dn;keysOn=true;}
    else if(k==='ArrowUp'){keys.u=dn;keysOn=true;}else if(k==='ArrowDown'){keys.d=dn;keysOn=true;}
    else if(k==='Shift'){keys.h=dn;keysOn=true;}
    else if(k===' '&&dn&&!e.repeat){inp.tap=true;e.preventDefault();}
    else if((k==='d'||k==='D')&&dn&&!e.repeat)inp.dbl=true;
    else if((k==='c'||k==='C')&&dn&&!e.repeat)inp.cut=true;
    else return;
    e.preventDefault();
  }

  function openGame(){
    if(open)return;
    load();if(!ov)build();
    open=true;ov.classList.add('on');document.documentElement.classList.add('surf-open');
    theme();render.localize();render.setChar(char);measure();showMenu();
    root.addEventListener('resize',measure);root.addEventListener('orientationchange',measure);
    document.addEventListener('visibilitychange',onVis);document.addEventListener('keydown',onKey,true);document.addEventListener('keyup',onKey,true);
    run();
  }
  function close(){
    if(!open)return;
    open=false;pause();input&&input.reset();keysOn=false;keys.l=keys.r=keys.u=keys.d=keys.h=false;
    ov.classList.remove('on');document.documentElement.classList.remove('surf-open');
    root.removeEventListener('resize',measure);root.removeEventListener('orientationchange',measure);
    document.removeEventListener('visibilitychange',onVis);document.removeEventListener('keydown',onKey,true);document.removeEventListener('keyup',onKey,true);
  }
  root.OceanSurf={open:openGame,close,isOpen:()=>open};
})(window);
