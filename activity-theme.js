/* Thème d’activité : pose html[data-act], la couche d’ambiance (particules) et la pastille de la barre du haut.
   OceanTheme.set(id) est appelé par setSport() quand l’écran est couvert par la transition,
   et au démarrage pour retrouver l’activité enregistrée. Particules : 30 au plus, 30 i/s, teintées par --t-bright
   (le blanc disparaît sur le crème), arrêtées onglet caché, mouvement réduit, ou couche invisible : sur téléphone
   (< 960 px), la coque opaque recouvre #actAmb, le canevas ne tourne donc que sur grand écran. */
(() => {
  'use strict';
  /* Couleur de la barre d’état (meta theme-color) : --t-page de chaque palette (activity-theme.css), crème voilé.
     Sans activité : le crème du logo. tests/activity-palette.test.mjs vérifie l’égalité avec les palettes. */
  const COLORS={surf:'#f2f2ec',bodyboard:'#f1f3ec',baignade:'#f1f4e8',paddle:'#f1f4e5',kayak:'#f4f4e0',snorkeling:'#f0f4e7',plongee:'#f0eee5',kitesurf:'#fdefe0',windsurf:'#f8f1eb'};
  /* Mouvement des particules par activité. */
  const KIND={plongee:'bubbles',snorkeling:'bubbles',baignade:'sparkle',surf:'foam',bodyboard:'foam',paddle:'sparkle',kayak:'drift',kitesurf:'wind',windsurf:'wind'};
  const WAVE='<svg viewBox="0 0 1200 150" preserveAspectRatio="none"><path d="M0 70 C100 30 200 30 300 70 S500 110 600 70 S800 30 900 70 S1100 110 1200 70 V150 H0Z"/></svg>';
  let cur='',amb,cv,ctx,list=[],raf=0,W=0,H=0,D=0,last=0,acc=0,ink='255,255,255';
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* La couche d’ambiance n’est visible qu’à partir de 960 px (barre latérale) ; en dessous, aucun calcul d’image. */
  const wide=matchMedia('(min-width:960px)');
  const root=document.documentElement;
  /* Couleur des particules : --t-bright de la palette, lu en rgb (« r,g,b ») ; les alphas restent ceux du dessin. */
  function readInk(){
    const v=getComputedStyle(root).getPropertyValue('--t-bright').trim();let m=v.match(/^#([0-9a-f]{6})$/i),c;
    if(m)c=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));
    else if((m=v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)))c=[m[1],m[2],m[3]].map(n=>Math.round(+n));
    if(c)ink=c.join(',');
  }
  function build(){
    if(amb)return;
    amb=document.createElement('div');amb.id='actAmb';amb.setAttribute('aria-hidden','true');
    amb.innerHTML=`<div class="aa-wash"></div><div class="aa-rays"><i></i><i></i><i></i><i></i></div><div class="aa-waves">${WAVE}${WAVE}</div><canvas class="aa-fx"></canvas>`;
    document.body.prepend(amb);cv=amb.querySelector('canvas');ctx=cv.getContext('2d');
    addEventListener('resize',size);addEventListener('orientationchange',()=>setTimeout(size,250));
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    const onWide=()=>{if(wide.matches){readInk();start();}else stop();};
    if(wide.addEventListener)wide.addEventListener('change',onWide);else if(wide.addListener)wide.addListener(onWide);
  }
  /* Le canevas n’est réalloué que si la fenêtre ou la densité changent : réaffecter width/height à chaque choix
     d’activité coûtait 80 à 350 ms (banc creme-logo, scénario 3). Sinon on l’efface seulement. */
  function size(){
    if(!cv)return;const d=Math.min(2,devicePixelRatio||1),w=innerWidth,h=innerHeight;
    if(w===W&&h===H&&d===D){ctx.clearRect(0,0,W,H);return;}
    W=w;H=h;D=d;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
  }
  function seed(kind){
    const r=Math.random,n=cur==='plongee'?30:({bubbles:20,sparkle:14,foam:16,drift:12,wind:12}[kind]||0);list=[];
    for(let i=0;i<n;i++){const big=cur==='plongee'&&i%7===0;list.push({x:r()*W,y:r()*H,s:big?6+r()*5:1.5+r()*4,v:big?.7+r()*.4:.2+r()*.6,p:r()*7,l:50+r()*130,a:.25+r()*.45});}
  }
  function frame(now){
    /* « Réduire les animations » coché pendant que les particules tournent : on s’arrête et on efface. */
    if(reduced()){stop();ctx.clearRect(0,0,W,H);return;}
    raf=requestAnimationFrame(frame);
    if(now-last<33)return;const dt=Math.min(3,(now-last)/16.7);last=now;acc+=dt;
    const kind=KIND[cur];ctx.clearRect(0,0,W,H);
    for(const q of list){
      if(kind==='bubbles'){q.y-=q.v*dt*1.1;q.x+=Math.sin(acc*.05+q.p)*.35*dt;if(q.y<-10){q.y=H+10;q.x=Math.random()*W;}
        ctx.beginPath();ctx.arc(q.x,q.y,q.s,0,7);ctx.strokeStyle=`rgba(${ink},${q.a+.15})`;ctx.lineWidth=1.1;ctx.stroke();
        ctx.beginPath();ctx.arc(q.x-q.s*.3,q.y-q.s*.3,q.s*.22,0,7);ctx.fillStyle=`rgba(${ink},.85)`;ctx.fill();}
      else if(kind==='wind'){q.x+=(q.v*7+3)*dt;if(q.x>W+20){q.x=-q.l;q.y=Math.random()*H;}
        ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+q.l*.5,q.y-7-Math.sin(acc*.03+q.p)*4,q.x+q.l,q.y);ctx.strokeStyle=`rgba(${ink},${q.a})`;ctx.lineWidth=1.6+q.s*.2;ctx.lineCap='round';ctx.stroke();}
      else if(kind==='foam'){q.x-=(q.v*.9+.2)*dt;q.y+=Math.sin(acc*.04+q.p)*.3*dt;if(q.x<-10){q.x=W+10;q.y=Math.random()*H;}
        ctx.beginPath();ctx.arc(q.x,q.y,q.s*.8,0,7);ctx.fillStyle=`rgba(${ink},${q.a+.1})`;ctx.fill();}
      else if(kind==='drift'){q.x+=Math.sin(acc*.02+q.p)*.5*dt;q.y+=q.v*.5*dt;if(q.y>H+10){q.y=-10;q.x=Math.random()*W;}
        ctx.beginPath();ctx.ellipse(q.x,q.y,q.s*1.6,q.s*.7,acc*.02+q.p,0,7);ctx.fillStyle=`rgba(${ink},${q.a})`;ctx.fill();}
      else{const t=(Math.sin(acc*.04*q.v+q.p)+1)/2;ctx.beginPath();ctx.arc(q.x,q.y,q.s*(.6+t*.7),0,7);ctx.fillStyle=`rgba(${ink},${.15+t*.55})`;ctx.fill();}
    }
  }
  function start(){if(raf||!cur||!wide.matches||reduced()||document.hidden)return;size();if(!list.length)seed(KIND[cur]);last=performance.now();raf=requestAnimationFrame(frame);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function chip(id){
    let c=document.getElementById('actChip');
    if(!c){
      const t=document.querySelector('.app-chrome .chrome-title');if(!t)return;
      c=document.createElement('button');c.id='actChip';c.type='button';c.className='act-chip';
      c.onclick=()=>{try{openActivityGate();}catch(_){}};
      t.after(c);
    }
    if(!id)return;
    const s=(typeof SPORTMAP!=='undefined'?SPORTMAP:{})[id];if(!s)return;
    c.innerHTML=`<img class="act-chip-ic" src="assets/icons/${id}.svg" alt=""><span>${s.label}</span>`;c.setAttribute('aria-label',`Activité : ${s.label}. Changer d’activité`);
  }
  function set(id){
    id=id&&COLORS[id]?id:'';build();
    const meta=document.querySelector('meta[name=theme-color]');
    if(id!==cur){
      cur=id;stop();list=[];
      if(id){root.dataset.act=id;root.style.setProperty('--act-scene',`url("assets/transitions/${id}.webp?v=4")`);}
      else{delete root.dataset.act;root.style.removeProperty('--act-scene');}
      if(meta)meta.content=id?COLORS[id]:'#fef9eb';
      /* La couleur se lit tout de suite (début de la transition de 0,4 s), puis une fois la transition finie. */
      clearTimeout(set.k);if(id&&wide.matches){readInk();set.k=setTimeout(readInk,450);}
      root.classList.add('act-swapped');clearTimeout(set.t);set.t=setTimeout(()=>root.classList.remove('act-swapped'),900);
    }
    chip(id);start();
  }
  /* Aperçu dans le choix d’activité : le fond suit la carte touchée. */
  function preview(id){const o=document.getElementById('onb');if(!o)return;if(id&&COLORS[id]){o.dataset.act=id;o.style.setProperty('--act-scene',`url("assets/transitions/${id}.webp?v=4")`);}else{delete o.dataset.act;}}
  /* L’app native injecte les scripts après « load » : on applique alors l’activité tout de suite. */
  const initial=()=>{try{set(typeof activeSport!=='undefined'?activeSport:null);}catch(_){}};
  if(document.readyState==='complete')setTimeout(initial,0);else addEventListener('load',initial);
  /* Zoom de page bloqué (Safari iOS ignore user-scalable=no) ; les vues qui zooment elles-mêmes sont épargnées. */
  const ZOOMABLE='.omap,.og-canvas,.maplibregl-map,.leaflet-container,.spot-gallery,.voyage,.immersion-mode,[data-zoomable]';
  const own=e=>e.target&&e.target.closest&&e.target.closest(ZOOMABLE);
  ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>{if(!own(e))e.preventDefault();},{passive:false}));
  document.addEventListener('touchmove',e=>{if(e.touches.length>1&&!own(e))e.preventDefault();},{passive:false});
  /* refresh : relit le mouvement réduit (Réglages) ; arrête ou relance les particules. */
  function refresh(){stop();start();}
  window.OceanTheme={set,preview,refresh,get current(){return cur;}};
})();
