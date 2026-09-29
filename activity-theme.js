/* Thème d’activité : pose html[data-act], la couche d’ambiance (particules) et la pastille de la barre du haut.
   OceanTheme.set(id) est appelé par setSport() quand l’écran est couvert par la transition,
   et au démarrage pour retrouver l’activité enregistrée. Particules : 22 au plus, 30 i/s,
   arrêtées onglet caché ou mouvement réduit. */
(() => {
  'use strict';
  const COLORS={surf:'#1d6cf0',bodyboard:'#2a8cf0',baignade:'#0e9cc4',paddle:'#0f9e86',kayak:'#4c9a25',snorkeling:'#0a9aa2',plongee:'#082d63',kitesurf:'#ee5741',windsurf:'#7a44d8'};
  /* Mouvement des particules par activité. */
  const KIND={plongee:'bubbles',snorkeling:'bubbles',baignade:'sparkle',surf:'foam',bodyboard:'foam',paddle:'sparkle',kayak:'drift',kitesurf:'wind',windsurf:'wind'};
  const WAVE='<svg viewBox="0 0 1200 150" preserveAspectRatio="none"><path d="M0 70 C100 30 200 30 300 70 S500 110 600 70 S800 30 900 70 S1100 110 1200 70 V150 H0Z"/></svg>';
  let cur='',amb,cv,ctx,list=[],raf=0,W=0,H=0,last=0,acc=0;
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=document.documentElement;
  function build(){
    if(amb)return;
    amb=document.createElement('div');amb.id='actAmb';amb.setAttribute('aria-hidden','true');
    amb.innerHTML=`<div class="aa-wash"></div><div class="aa-rays"><i></i><i></i><i></i><i></i></div><div class="aa-waves">${WAVE}${WAVE}</div><canvas class="aa-fx"></canvas>`;
    document.body.prepend(amb);cv=amb.querySelector('canvas');ctx=cv.getContext('2d');
    addEventListener('resize',size);addEventListener('orientationchange',()=>setTimeout(size,250));
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  }
  function size(){if(!cv)return;const d=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);}
  function seed(kind){
    const r=Math.random,n={bubbles:20,sparkle:14,foam:16,drift:12,wind:12}[kind]||0;list=[];
    for(let i=0;i<n;i++)list.push({x:r()*W,y:r()*H,s:1.5+r()*4,v:.2+r()*.6,p:r()*7,l:50+r()*130,a:.25+r()*.45});
  }
  function frame(now){
    raf=requestAnimationFrame(frame);
    if(now-last<33)return;const dt=Math.min(3,(now-last)/16.7);last=now;acc+=dt;
    const kind=KIND[cur];ctx.clearRect(0,0,W,H);
    for(const q of list){
      if(kind==='bubbles'){q.y-=q.v*dt*1.1;q.x+=Math.sin(acc*.05+q.p)*.35*dt;if(q.y<-10){q.y=H+10;q.x=Math.random()*W;}
        ctx.beginPath();ctx.arc(q.x,q.y,q.s,0,7);ctx.strokeStyle=`rgba(255,255,255,${q.a+.15})`;ctx.lineWidth=1.1;ctx.stroke();
        ctx.beginPath();ctx.arc(q.x-q.s*.3,q.y-q.s*.3,q.s*.22,0,7);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fill();}
      else if(kind==='wind'){q.x+=(q.v*7+3)*dt;if(q.x>W+20){q.x=-q.l;q.y=Math.random()*H;}
        ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+q.l*.5,q.y-7-Math.sin(acc*.03+q.p)*4,q.x+q.l,q.y);ctx.strokeStyle=`rgba(255,255,255,${q.a})`;ctx.lineWidth=1.6+q.s*.2;ctx.lineCap='round';ctx.stroke();}
      else if(kind==='foam'){q.x-=(q.v*.9+.2)*dt;q.y+=Math.sin(acc*.04+q.p)*.3*dt;if(q.x<-10){q.x=W+10;q.y=Math.random()*H;}
        ctx.beginPath();ctx.arc(q.x,q.y,q.s*.8,0,7);ctx.fillStyle=`rgba(255,255,255,${q.a+.1})`;ctx.fill();}
      else if(kind==='drift'){q.x+=Math.sin(acc*.02+q.p)*.5*dt;q.y+=q.v*.5*dt;if(q.y>H+10){q.y=-10;q.x=Math.random()*W;}
        ctx.beginPath();ctx.ellipse(q.x,q.y,q.s*1.6,q.s*.7,acc*.02+q.p,0,7);ctx.fillStyle=`rgba(255,255,255,${q.a})`;ctx.fill();}
      else{const t=(Math.sin(acc*.04*q.v+q.p)+1)/2;ctx.beginPath();ctx.arc(q.x,q.y,q.s*(.6+t*.7),0,7);ctx.fillStyle=`rgba(255,255,255,${.15+t*.55})`;ctx.fill();}
    }
  }
  function start(){if(raf||!cur||reduced()||document.hidden)return;size();if(!list.length)seed(KIND[cur]);last=performance.now();raf=requestAnimationFrame(frame);}
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
    c.innerHTML=`<img src="assets/poulpy/icons/${id}.jpg" alt=""><span>${s.label}</span>`;c.setAttribute('aria-label',`Activité : ${s.label}. Changer d’activité`);
    c.style.animation='none';void c.offsetWidth;c.style.animation='';
  }
  function set(id){
    id=id&&COLORS[id]?id:'';build();
    const meta=document.querySelector('meta[name=theme-color]');
    if(id!==cur){
      cur=id;stop();list=[];
      if(id){root.dataset.act=id;root.style.setProperty('--act-scene',`url("assets/transitions/${id}.webp")`);}
      else{delete root.dataset.act;root.style.removeProperty('--act-scene');}
      if(meta)meta.content=id?COLORS[id]:'#1a4fd6';
      root.classList.add('act-swapped');clearTimeout(set.t);set.t=setTimeout(()=>root.classList.remove('act-swapped'),900);
    }
    chip(id);start();
  }
  /* Aperçu dans le choix d’activité : le fond suit la carte touchée. */
  function preview(id){const o=document.getElementById('onb');if(!o)return;if(id&&COLORS[id]){o.dataset.act=id;o.style.setProperty('--act-scene',`url("assets/transitions/${id}.webp")`);}else{delete o.dataset.act;}}
  addEventListener('load',()=>{try{set(typeof activeSport!=='undefined'?activeSport:null);}catch(_){}});
  /* Zoom de page bloqué (Safari iOS ignore user-scalable=no) ; les vues qui zooment elles-mêmes sont épargnées. */
  const ZOOMABLE='.omap,.og-canvas,.maplibregl-map,.leaflet-container,.spot-gallery,.voyage,.immersion-mode,[data-zoomable]';
  const own=e=>e.target&&e.target.closest&&e.target.closest(ZOOMABLE);
  ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>{if(!own(e))e.preventDefault();},{passive:false}));
  document.addEventListener('touchmove',e=>{if(e.touches.length>1&&!own(e))e.preventDefault();},{passive:false});
  window.OceanTheme={set,preview,get current(){return cur;}};
})();
