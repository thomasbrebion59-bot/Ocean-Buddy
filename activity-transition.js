/* Transitions d’activité : quand on choisit une activité, on « entre » dans son élément
   (sous la mer pour la plongée, dans le tube pour le surf, sous l’aile pour le kitesurf…).
   Fonds illustrés (assets/transitions/, générés avec ChatGPT) + masque et particules animés en code,
   20 particules au plus, une seule couche plein écran : 60 i/s visés sur téléphone.
   play(id, swap) : swap() est appelé quand l’écran est entièrement couvert (on y change d’écran),
   puis la scène s’ouvre sur la destination. Mouvement réduit : simple fondu. */
(() => {
  'use strict';
  /* entry : forme qui couvre l’écran ; fx : particules ; exit : forme qui révèle ; ms : durée totale. */
  const FX={
    surf:{entry:'curl',fx:'drops',n:12,exit:'hole',ms:1300,tint:'#1f55e0'},
    bodyboard:{entry:'curl',fx:'drops',n:16,exit:'wipe-down',ms:1150,tint:'#4f8df7'},
    baignade:{entry:'rise',fx:'rings',n:3,exit:'hole',ms:1100,tint:'#0e9fc4'},
    paddle:{entry:'v',fx:'rings',n:6,exit:'v',ms:1200,tint:'#0f9e86'},
    kayak:{entry:'arc',fx:'drops',n:10,exit:'hole',ms:1200,tint:'#5c9e2c'},
    snorkeling:{entry:'drop',fx:'bubbles',n:8,exit:'rise-out',ms:1300,tint:'#f0a20c'},
    plongee:{entry:'rise',fx:'bubbles',n:18,exit:'rise-out',ms:1450,tint:'#0b2d7a'},
    kitesurf:{entry:'diag',fx:'wind',n:10,exit:'diag',ms:1250,tint:'#ff6a4d'},
    windsurf:{entry:'sail',fx:'wind',n:10,exit:'sail',ms:1200,tint:'#9d5be6'}
  };
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,easeOut=t=>1-(1-t)**3,clamp=t=>Math.max(0,Math.min(1,t));
  const src=id=>`assets/transitions/${id}.webp`;
  const cache=new Map();
  function load(id){
    if(!cache.has(id)){const img=new Image();img.decoding='async';img.src=src(id);cache.set(id,(img.decode?img.decode():new Promise((r,j)=>{img.onload=r;img.onerror=j;})).then(()=>img).catch(()=>null));}
    return cache.get(id);
  }
  /* Les fonds se préparent en tâche de fond, une fois l’app au calme. */
  (window.requestIdleCallback||setTimeout)(()=>Object.keys(FX).forEach((id,i)=>setTimeout(()=>load(id),i*400)),{timeout:6000});

  let busy=false;
  /* Forme couvrante (polygone clip-path, en %) pour un avancement p de 0 à 1. */
  function shape(kind,p,W,H){
    const pts=[],N=18,wv=(i,a,f)=>Math.sin(i/N*Math.PI*f+p*9)*a;
    if(kind==='curl'){ // lèvre de vague qui déferle de droite à gauche
      const x=110-p*140;for(let i=0;i<=N;i++){const y=i/N*100;pts.push([x+wv(i,4,3)-Math.sin(y/100*Math.PI)*14,y]);}
      return [[120,0],...pts,[120,100]];
    }
    if(kind==='rise'||kind==='drop'){ // ligne d’eau qui monte (on passe sous la surface) ou qui descend
      const y=kind==='rise'?110-p*125:-10+p*125;
      for(let i=0;i<=N;i++)pts.push([i/N*100,y+wv(i,2.2,4)]);
      return kind==='rise'?[[0,110],...pts,[100,110]]:[[0,-10],...pts,[100,-10]];
    }
    if(kind==='v'){ // sillage en V depuis le bas
      const t=p*1.35;return [[50,100-t*140],[50+t*120,100+10],[50-t*120,100+10]];
    }
    if(kind==='arc'){ // coup de pagaie : balayage courbe depuis la gauche
      const a=-90+p*200;const r=160;const c=[0,110];const out=[c];for(let i=0;i<=N;i++){const b=(-90+i/N*(a+90))*Math.PI/180;out.push([c[0]+Math.cos(b)*r*(W<H?1.6:1),c[1]+Math.sin(b)*r]);}return out;
    }
    if(kind==='diag'){const d=-10+p*180;return [[-200,0],[d,0],[d-60,100],[-200,100]];} // aile qui balaie en diagonale
    if(kind==='sail'){ // voile qui pivote depuis le bord droit
      const t=ease(p);return [[100,0],[100-t*170,0+t*10],[100-t*120,100],[100,100]];
    }
    return [[0,0],[100,0],[100,100],[0,100]];
  }
  const poly=pts=>`polygon(${pts.map(([x,y])=>`${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`;

  /* ---------- Particules (canvas, 20 au plus) ---------- */
  function particles(kind,n,W,H){
    const r=Math.random,list=[];
    for(let i=0;i<n;i++){
      if(kind==='bubbles')list.push({x:r()*W,y:H*(.7+r()*.5),s:2+r()*4,v:.25+r()*.45,w:r()*6});
      else if(kind==='drops')list.push({x:W*(.2+r()*.8),y:H*(.25+r()*.5),vx:-(1+r()*3.5),vy:-(2+r()*3),s:2+r()*4});
      else if(kind==='wind')list.push({x:-r()*W,y:r()*H,l:60+r()*160,v:6+r()*9,a:.25+r()*.4});
      else list.push({x:W*(.3+r()*.4),y:H*(.35+r()*.35),t0:i*.18});
    }
    return (ctx,t,dt)=>{
      ctx.clearRect(0,0,W,H);
      for(const q of list){
        if(kind==='bubbles'){q.y-=q.v*dt;q.x+=Math.sin((q.y+q.w*40)/40)*.4;ctx.beginPath();ctx.arc(q.x,q.y,q.s,0,7);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.arc(q.x-q.s*.35,q.y-q.s*.35,q.s*.25,0,7);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fill();}
        else if(kind==='drops'){q.x+=q.vx*dt*.35;q.y+=q.vy*dt*.35;q.vy+=.012*dt;ctx.beginPath();ctx.arc(q.x,q.y,q.s,0,7);ctx.fillStyle='rgba(255,252,240,.9)';ctx.fill();}
        else if(kind==='wind'){q.x+=q.v*dt*.5;if(q.x>W)q.x=-q.l;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+q.l*.5,q.y-6,q.x+q.l,q.y);ctx.strokeStyle=`rgba(255,255,255,${q.a})`;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();}
        else{const k=clamp((t-q.t0)/.8);if(k<=0||k>=1)continue;ctx.beginPath();ctx.ellipse(q.x,q.y,20+k*140,(20+k*140)*.35,0,0,7);ctx.strokeStyle=`rgba(255,255,255,${.7*(1-k)})`;ctx.lineWidth=2;ctx.stroke();}
      }
    };
  }

  function count(id){try{return SPOTS.filter(s=>spotSports(s).includes(id)).length;}catch(_){return 0;}}

  async function play(id,swap){
    const fx=FX[id];
    if(!fx||busy){swap?.();return;}
    busy=true;
    const sport=window.SPORTMAP?.[id]||{label:id};
    const el=document.createElement('div');el.className='act-tr';el.setAttribute('aria-hidden','true');el.style.setProperty('--tint',fx.tint);
    const n=count(id);
    el.innerHTML=`<div class="act-tr-scene"></div><canvas class="act-tr-fx"></canvas><div class="act-tr-title"><img src="assets/poulpy/icons/${id}.jpg" alt=""><b>${sport.label}</b>${n?`<small>${n} spots t’attendent</small>`:''}</div>`;
    const live=document.getElementById('a11yLive');if(live)live.textContent=`${sport.label} : ${n} spots`;
    if(reduced()){
      document.body.append(el);el.classList.add('is-fade');
      const img=await Promise.race([load(id),new Promise(r=>setTimeout(r,150))]);if(img)el.querySelector('.act-tr-scene').style.backgroundImage=`url(${src(id)})`;
      await new Promise(r=>requestAnimationFrame(()=>{el.classList.add('is-on');setTimeout(r,180);}));
      try{swap?.();}finally{el.classList.remove('is-on');setTimeout(()=>{el.remove();busy=false;},200);}
      return;
    }
    const img=await Promise.race([load(id),new Promise(r=>setTimeout(r,280))]);
    const scene=el.querySelector('.act-tr-scene'),title=el.querySelector('.act-tr-title'),cv=el.querySelector('.act-tr-fx');
    if(img)scene.style.backgroundImage=`url(${src(id)})`;
    document.body.append(el);
    const W=innerWidth,H=innerHeight,dpr=Math.min(2,devicePixelRatio||1);
    cv.width=W*dpr;cv.height=H*dpr;const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    const draw=particles(fx.fx,fx.n,W,H);
    const tIn=.3,tHold=.62,total=fx.ms;let swapped=false,last=performance.now();const t0=last;
    await new Promise(done=>{
      const step=now=>{
        const t=clamp((now-t0)/total),dt=Math.min(40,now-last)/16.7;last=now;
        /* 1. Entrée : la forme couvre l’écran. */
        if(t<tIn){el.style.clipPath=poly(shape(fx.entry,easeOut(t/tIn),W,H));}
        else if(!swapped){
          el.style.clipPath='none';swapped=true;
          /* Écran couvert : on change d’écran dessous (un seul calcul, pendant que rien ne bouge au-dessus). */
          try{swap?.();}catch(e){console.error(e);}
          last=performance.now();
        }
        /* 2. Geste : parallaxe du fond et titre. */
        const g=clamp((t-tIn*.6)/(tHold-tIn*.6));
        const par=fx.entry==='drop'||fx.entry==='rise'?`translate3d(0,${(-6*ease(g)).toFixed(2)}%,0) scale(1.12)`:fx.entry==='curl'?`scale(${(1.18-.1*ease(g)).toFixed(3)})`:`translate3d(${(-4*ease(g)).toFixed(2)}%,0,0) scale(1.1)`;
        scene.style.transform=par;
        const ti=clamp((t-tIn*.8)/.18),to=clamp((t-tHold-.04)/.14);
        title.style.opacity=(ti*(1-to)).toFixed(3);title.style.transform=`translate3d(-50%,${(14*(1-easeOut(ti))-10*to).toFixed(1)}px,0) scale(${(.94+.06*easeOut(ti)).toFixed(3)})`;
        draw(ctx,t*total/1000,dt);
        /* 3. Révélation de la destination. */
        if(t>tHold){
          const r=easeOut(clamp((t-tHold)/(1-tHold)));
          if(fx.exit==='hole'){const R=Math.hypot(W,H)*r*.62;el.style.webkitMaskImage=el.style.maskImage=`radial-gradient(circle at 50% 46%,transparent ${R.toFixed(1)}px,#000 ${(R+2).toFixed(1)}px)`;}
          else if(fx.exit==='rise-out'){el.style.transform=`translate3d(0,${(-105*r).toFixed(2)}%,0)`;}
          else if(fx.exit==='wipe-down'){el.style.transform=`translate3d(0,${(105*r).toFixed(2)}%,0)`;}
          else el.style.clipPath=poly(shape(fx.exit,1-r,W,H));
        }
        if(t<1)requestAnimationFrame(step);else done();
      };
      requestAnimationFrame(step);
    });
    el.remove();busy=false;
  }
  window.OceanTransition={play,preload:load,FX};
})();
