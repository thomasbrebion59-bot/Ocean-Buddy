/* Transitions d’activité : quand on choisit une activité, on « entre » dans son élément.
   Direction artistique GPT-6 Astra : 2,8 s en quatre temps —
   1. un cache aux couleurs de l’activité couvre l’écran (on change d’écran dessous) ;
   2. geste : le décor et Poulpy (calques séparés, assets/transitions/{id}.webp et {id}-fg.webp) bougent en parallaxe ;
   3. le titre et le nombre de spots apparaissent ;
   4. une forme propre à l’activité révèle l’app déjà thémée.
   Tout est animé en transform / opacity / clip-path + un canvas léger (12 particules au plus) : 60 i/s visés sur téléphone.
   Un toucher passe directement à la révélation. Mouvement réduit : fondu de 250 ms. */
(() => {
  'use strict';
  /* Position du premier plan dans le cadre 900×1350 (scripts/build-transition-layers.py → layers.json). */
  let LAYERS={};
  fetch('assets/transitions/layers.json').then(r=>r.ok?r.json():{}).then(j=>{LAYERS=j||{};}).catch(()=>{});

  /* in : forme du cache ; out : forme de la révélation ; bg : [x,y,échelle] départ → arrivée (px à 390 de large) ;
     fg : [x,y,rotation,échelle] entrée → repos, fgOut : [x,y] pendant la sortie ; bob : flottaison (px) ;
     fx : détail dessiné ; line : trait sous le titre ; gauge : profondeur affichée. */
  const FX={
    surf:{tint:'#1455d9',veil:'#0d3aa8',in:'rise',out:'curl',bg:[[0,0,1.12],[-10,0,1.06]],fg:[[-110,90,-12,.94],[20,-12,5,1]],fgOut:[150,-80],fx:'foam',line:1},
    bodyboard:{tint:'#fff5df',veil:'#1d6cf0',in:'sweep',out:'down-left',bg:[[0,0,1.1],[12,0,1.08]],fg:[[100,-60,-16,.95],[-25,35,6,1]],fgOut:[-160,140],bounce:1,fx:'chevrons'},
    baignade:{tint:'#38d8d0',veil:'#0e9cc4',in:'disk',out:'shrink',bg:[[0,0,1.09],[0,8,1.04]],fg:[[0,100,-5,.96],[0,0,3,1]],fgOut:[0,20],bob:6,fx:'ripples'},
    paddle:{tint:'#38d8d0',veil:'#0f9e86',in:'rise',out:'wave-down',bg:[[0,0,1.08],[-9,0,1.06]],fg:[[-75,45,-2,.93],[16,-8,3,1.03]],fgOut:[35,-10],fx:'wake',line:1},
    kayak:{tint:'#1455d9',veil:'#4c9a25',in:'sides',out:'slit',bg:[[0,0,1.04],[0,0,1.12]],fg:[[25,125,7,.96],[-12,0,-3,1]],fgOut:[-8,-10],fx:'glints'},
    snorkeling:{tint:'#38d8d0',veil:'#0a9aa2',in:'rise',out:'wave-down',bg:[[0,0,1.08],[0,-12,1.06]],fg:[[95,25,7,.96],[-18,-8,-4,1]],fgOut:[-40,-10],bob:5,fx:'bubbles',caustics:1,gauge:3},
    plongee:{tint:'#08255b',veil:'#08255b',in:'drop',out:'hole',bg:[[0,0,1.1],[0,-24,1.05]],fg:[[30,-75,-8,.95],[0,18,3,1]],fgOut:[0,40],fx:'bubbles',gauge:18,ticks:1},
    kitesurf:{tint:'#ff7564',veil:'#ee5741',in:'diag',out:'diag-out',bg:[[0,0,1.1],[-14,0,1.08]],fg:[[130,-50,20,.9],[-40,-70,-8,1]],fgOut:[220,-160],fx:'kitelines',fgTop:1},
    windsurf:{tint:'#ffe16b',veil:'#7a44d8',in:'sail',out:'diag-out',bg:[[0,0,1.1],[-16,0,1.08]],fg:[[-105,40,-9,.95],[22,-5,2,1]],fgOut:[260,-20],bounce:.6,fx:'wake',segments:1}
  };
  const T={cover:420,gesture:1450,title:2200,end:2800};
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=t=>Math.max(0,Math.min(1,t)),lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,easeOut=t=>1-(1-t)**3,easeIn=t=>t*t*t;
  const back=t=>{const c=1.4;return 1+(c+1)*(t-1)**3+c*(t-1)**2;};
  const cache=new Map();
  function img(src){
    if(!cache.has(src)){const i=new Image();i.decoding='async';i.src=src;cache.set(src,(i.decode?i.decode():new Promise((r,j)=>{i.onload=r;i.onerror=j;})).then(()=>i).catch(()=>null));}
    return cache.get(src);
  }
  const load=id=>Promise.all([img(`assets/transitions/${id}.webp`),img(`assets/transitions/${id}-fg.webp`)]);
  /* Les calques se préparent en tâche de fond, une fois l’app au calme. */
  (window.requestIdleCallback||setTimeout)(()=>Object.keys(FX).forEach((id,i)=>setTimeout(()=>load(id),i*500)),{timeout:6000});

  /* ---------- Formes (polygones en %, pour clip-path) ---------- */
  const N=22;
  const wave=(i,p,a,f)=>Math.sin(i/N*Math.PI*f+p*8)*a;
  const poly=pts=>`polygon(${pts.map(([x,y])=>`${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`;
  /* Cache qui couvre l’écran, p de 0 (rien) à 1 (tout). */
  function coverShape(kind,p,W,H){
    const pts=[];
    if(kind==='rise'||kind==='drop'){
      const y=kind==='rise'?112-p*130:-12+p*130;
      for(let i=0;i<=N;i++)pts.push([i/N*100,y+wave(i,p,3,3)]);
      return kind==='rise'?[[0,112],...pts,[100,112]]:[[0,-12],...pts,[100,-12]];
    }
    if(kind==='sweep'){ // front d’écume de droite à gauche
      const x=112-p*135;for(let i=0;i<=N;i++)pts.push([x+wave(i,p,4,4),i/N*100]);
      return [[112,0],...pts,[112,100]];
    }
    if(kind==='sides'){const x=p*52;return [[0,0],[x,0],[x+4,50],[x,100],[0,100],[0,0],[100,0],[100-x,0],[96-x,50],[100-x,100],[100,100]];}
    if(kind==='diag'){const d=-20+p*190;return [[140,0],[140,100],[140-d,100],[180-d,0]];}
    if(kind==='sail'){const a=ease(p);return [[0,100],[100*a*1.6,100],[0,100-130*a]];}
    return [[0,0],[100,0],[100,100],[0,100]];
  }
  /* Révélation, r de 0 (scène entière) à 1 (app entière). Renvoie une valeur clip-path. */
  function exitClip(kind,r,W,H){
    if(kind==='hole'||kind==='slit'){
      const cx=W/2,cy=H*.46;
      if(kind==='hole'){const R=Math.hypot(W,H)*.62*r;return `path(evenodd,'M0 0H${W}V${H}H0Z M${(cx-R).toFixed(1)} ${cy}a${R.toFixed(1)} ${R.toFixed(1)} 0 1 0 ${(2*R).toFixed(1)} 0a${R.toFixed(1)} ${R.toFixed(1)} 0 1 0 ${(-2*R).toFixed(1)} 0Z')`;}
      const w=W*.62*r+.1,h=Math.min(H*1.2,H*.25+H*r),rr=Math.min(w,h)/2;
      const x=cx-w,y=cy-h/2;return `path(evenodd,'M0 0H${W}V${H}H0Z M${(x+rr).toFixed(1)} ${y.toFixed(1)}H${(x+2*w-rr).toFixed(1)}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${rr.toFixed(1)} ${rr.toFixed(1)}V${(y+h-rr).toFixed(1)}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(-rr).toFixed(1)} ${rr.toFixed(1)}H${(x+rr).toFixed(1)}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(-rr).toFixed(1)} ${(-rr).toFixed(1)}V${(y+rr).toFixed(1)}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${rr.toFixed(1)} ${(-rr).toFixed(1)}Z')`;
    }
    if(kind==='shrink'){const R=Math.hypot(W,H)*.6*(1-r);return `circle(${R.toFixed(1)}px at 50% 72%)`;}
    const pts=[];
    if(kind==='wave-down'){const y=-8+r*118;for(let i=0;i<=N;i++)pts.push([i/N*100,y+wave(i,r,3,3)]);return poly([...pts,[100,110],[0,110]].reverse());}
    if(kind==='curl'){ // lèvre de vague qui se retire vers le haut à droite (on garde x − y > d)
      const d=-115+r*230;for(let i=0;i<=N;i++){const t=i/N,b=Math.sin(t*Math.PI)*14;pts.push([-50+t*200+d+b,-50+t*200-b]);}
      return poly([...pts,[400,150],[400,-50]]);
    }
    if(kind==='down-left'){const d=115-r*230;return poly([[-50+d,-50],[150+d,150],[-50,150],[-50,-50]]);} // on garde x − y < d
    if(kind==='diag-out'){const d=r*190;return poly([[-40+d,0],[140,0],[140,100],[-80+d,100]]);}
    return 'none';
  }

  /* ---------- Détails dessinés (canvas, 12 éléments au plus) ---------- */
  function detail(kind,W,H){
    const R=Math.random,list=[];let last=null;
    for(let i=0;i<12;i++)list.push({t0:R(),x:R(),y:R(),s:R(),v:R()});
    return (ctx,g,now,anchor)=>{
      ctx.clearRect(0,0,W,H);if(!anchor)return;
      const [ax,ay,aw,ah]=anchor;
      if(kind==='bubbles'){
        for(const q of list.slice(0,9)){const side=q.x<.5?q.x*.22:.78+q.x*.22,sp=.5+q.v;const y=H*(1.05-((g*sp+q.t0)%1.15));const x=W*side+Math.sin(now/400+q.t0*9)*6,r=2+q.s*5;
          ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.25,0,7);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fill();}
      }else if(kind==='foam'){
        for(const q of list.slice(0,8)){const k=(g*1.6+q.t0)%1;const x=ax+aw*(.2+q.x*.5)-k*aw*.7,y=ay+ah*(.75+q.y*.2)+k*20*(q.s-.5);
          ctx.beginPath();ctx.arc(x,y,(3+q.s*5)*(1-k),0,7);ctx.fillStyle=`rgba(255,245,223,${.9*(1-k)})`;ctx.fill();}
      }else if(kind==='chevrons'){
        for(let i=0;i<2;i++){const k=(g*1.4+i*.5)%1;const x=ax+aw*(.9+k*.4),y=ay+ah*(.35-k*.3);ctx.save();ctx.translate(x,y);ctx.rotate(-.6);ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(0,0);ctx.lineTo(-10,8);ctx.strokeStyle=`rgba(56,216,208,${1-k})`;ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();ctx.restore();}
      }else if(kind==='ripples'){
        for(let i=0;i<2;i++){const k=clamp((g-.05-i*.18)/.7);if(k<=0||k>=1)continue;ctx.beginPath();ctx.ellipse(ax+aw/2,ay+ah*.82,aw*(.45+k*.6),aw*(.12+k*.14),0,0,7);ctx.strokeStyle=`rgba(255,255,255,${.75*(1-k)})`;ctx.lineWidth=2.5;ctx.stroke();}
      }else if(kind==='wake'){
        const k=clamp(g*1.3),bx=ax+aw*.2,by=ay+ah*.9;ctx.lineCap='round';
        for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx-aw*.45*k,by+s*12*k+10,bx-aw*.95*k,by+s*34*k+16);ctx.strokeStyle=`rgba(255,245,223,${.8*(1-g*.5)})`;ctx.lineWidth=3;ctx.stroke();}
      }else if(kind==='glints'){
        for(const q of list.slice(0,3)){const x=(q.x*W+g*90*(q.v+.5))%W,y=H*(.62+q.y*.3);const a=.35+.35*Math.sin(now/260+q.t0*9);ctx.beginPath();ctx.ellipse(x,y,14+q.s*16,2.5,0,0,7);ctx.fillStyle=`rgba(255,245,223,${a})`;ctx.fill();}
        for(let i=0;i<2;i++){const k=(g*1.2+i*.5)%1;ctx.beginPath();ctx.arc(ax+aw*(i?.95:.05),ay+ah*.8,8+k*22,Math.PI*.1,Math.PI*.9);ctx.strokeStyle=`rgba(255,255,255,${.7*(1-k)})`;ctx.lineWidth=2;ctx.stroke();}
      }else if(kind==='kitelines'){
        const bx=W*.18,by=H*1.02,k1=[ax+aw*.25,ay+ah*.78],k2=[ax+aw*.7,ay+ah*.88];ctx.lineWidth=1.3;ctx.strokeStyle='rgba(8,37,91,.55)';
        for(const [x,y] of [k1,k2]){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+bx)/2+18,(y+by)/2,bx,by);ctx.stroke();}
        for(const q of list.slice(0,3)){const k=(g*1.5+q.t0)%1,y=H*(.25+q.y*.5),x=-80+k*(W+160);if(x>W*.25&&x<W*.75&&y>H*.3&&y<H*.6)continue;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+40,y-6,x+80,y);ctx.strokeStyle=`rgba(255,255,255,${.55*Math.sin(k*Math.PI)})`;ctx.lineWidth=2;ctx.stroke();}
      }
    };
  }

  function count(id){try{return SPOTS.filter(s=>spotSports(s).includes(id)).length;}catch(_){return 0;}}
  let busy=false;

  async function play(id,swap){
    const fx=FX[id];
    if(!fx||busy){swap?.();return;}
    busy=true;
    const sport=(typeof SPORTMAP!=='undefined'&&SPORTMAP[id])||{label:id};
    const n=count(id);
    const el=document.createElement('div');el.className='act-tr';el.dataset.act=id;el.setAttribute('aria-hidden','true');
    el.style.setProperty('--tint',fx.tint);el.style.setProperty('--veil',fx.veil);
    el.innerHTML=`<div class="act-tr-scene"></div>${fx.caustics?'<div class="act-tr-caustics"></div>':''}<img class="act-tr-fg" alt=""><canvas class="act-tr-fx"></canvas><div class="act-tr-veil"></div>
      <div class="act-tr-title"><img class="act-tr-badge" src="assets/poulpy/icons/${id}.jpg" alt=""><b>${sport.label}</b>${fx.line?'<i class="act-tr-line"></i>':''}${n?`<small>${n} spots t’attendent</small>`:''}${fx.gauge?`<span class="act-tr-gauge">${fx.ticks?'<em></em><em></em><em></em>':''}<span>0</span> m</span>`:''}${fx.segments?'<span class="act-tr-seg"><em></em><em></em><em></em></span>':''}</div>`;
    const live=document.getElementById('a11yLive');if(live)live.textContent=`${sport.label} : ${n} spots`;
    const [bgImg,fgImg]=await Promise.race([load(id),new Promise(r=>setTimeout(()=>r([null,null]),reduced()?150:380))]);
    const scene=el.querySelector('.act-tr-scene'),fgEl=el.querySelector('.act-tr-fg'),veil=el.querySelector('.act-tr-veil'),title=el.querySelector('.act-tr-title'),cv=el.querySelector('.act-tr-fx');
    if(bgImg)scene.style.backgroundImage=`url(${bgImg.src})`;
    const box=LAYERS[id];
    if(fgImg&&box)fgEl.src=fgImg.src;else fgEl.remove();

    if(reduced()){
      document.body.append(el);el.classList.add('is-fade');
      await new Promise(r=>requestAnimationFrame(()=>{el.classList.add('is-on');setTimeout(r,250);}));
      try{swap?.();}finally{el.classList.remove('is-on');setTimeout(()=>{el.remove();busy=false;},250);}
      return;
    }

    document.body.append(el);
    const W=innerWidth,H=innerHeight,u=W/390,dpr=Math.min(2,devicePixelRatio||1);
    /* Cadre du décor 900×1350 recouvrant l’écran : le premier plan s’y place comme dans l’illustration. */
    const fs=Math.max(W/900,H/1350),fw=900*fs,fh=1350*fs,fx0=(W-fw)/2,fy0=(H-fh)/2;
    let fgRect=null;
    if(fgEl.isConnected){
      /* Le cadre est rogné sur les côtés en portrait : le premier plan est dimensionné sur l’écran réel,
         jamais coupé, sous le titre (l’aile de kite, elle, reste en haut). */
      const top=fx.fgTop,k=Math.min(W*.82/(box.w*fw),H*(top?.36:.39)/(box.h*fh),1.25),w=box.w*fw*k,h=box.h*fh*k;
      const cx=Math.max(w/2+6,Math.min(W-w/2-6,fx0+(box.x+box.w/2)*fw));
      const y=top?Math.max(H*.05,fy0+box.y*fh):Math.min(H*.95,fy0+(box.y+box.h)*fh)-h;
      fgRect=[cx-w/2,y,w,h];Object.assign(fgEl.style,{left:fgRect[0]+'px',top:fgRect[1]+'px',width:fgRect[2]+'px',height:fgRect[3]+'px'});}
    cv.width=W*dpr;cv.height=H*dpr;const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
    const draw=detail(fx.fx,W,H);
    const gauge=title.querySelector('.act-tr-gauge>span'),ticks=[...title.querySelectorAll('.act-tr-gauge em,.act-tr-seg em')],line=title.querySelector('.act-tr-line');
    let swapped=false,skip=0,buzz=false;
    /* Un toucher : on file directement vers la révélation. */
    el.addEventListener('pointerdown',()=>{if(swapped&&!skip)skip=performance.now();},{once:false});
    const t0=performance.now();
    await new Promise(done=>{
      const step=now=>{
        let ms=now-t0;
        if(skip){const jump=Math.max(0,T.title-(skip-t0));ms+=jump;}
        const t=Math.min(ms,T.end);
        /* 1. Le cache couvre l’écran. */
        if(t<T.cover){el.style.clipPath=poly(coverShape(fx.in,easeOut(t/T.cover),W,H));}
        else if(!swapped){
          el.style.clipPath='none';swapped=true;el.style.pointerEvents='auto';
          try{swap?.();}catch(e){console.error(e);}
          try{navigator.vibrate?.(8);}catch(_){}
        }
        /* Le voile coloré s’efface et dévoile la scène, une fois le changement d’écran fait. */
        veil.style.opacity=(1-easeOut(clamp((t-T.cover-40)/320))).toFixed(3); // l’écran change sous un voile encore opaque
        /* 2. Geste : parallaxe du décor et du premier plan. */
        const g=clamp((t-T.cover*.5)/(T.title-T.cover*.5)),ge=easeOut(g);
        const [b0,b1]=fx.bg;scene.style.transform=`translate3d(${(lerp(b0[0],b1[0],ge)*u).toFixed(2)}px,${(lerp(b0[1],b1[1],ge)*u).toFixed(2)}px,0) scale(${lerp(b0[2],b1[2],ge).toFixed(4)})`;
        const r=clamp((t-T.title)/(T.end-T.title)),re=easeIn(r);
        let anchor=null;
        if(fgRect){
          const [f0,f1]=fx.fg,k=fx.bounce?back(clamp(g*1.25)):easeOut(clamp(g*1.25));
          let x=lerp(f0[0],f1[0],k),y=lerp(f0[1],f1[1],k),rot=lerp(f0[2],f1[2],k),sc=lerp(f0[3],f1[3],k);
          /* Vie continue une fois arrivé : flottaison et léger balancement, pour que la scène ne se fige jamais. */
          const live=clamp(g*2.2-.6);y+=Math.sin(ms/360)*(fx.bob||4)*live;rot+=Math.sin(ms/520+1)*1.6*live;x+=Math.sin(ms/700)*3*live;
          if(fx.bounce)y-=Math.sin(clamp((g-.45)/.3)*Math.PI)*10*fx.bounce;
          x+=fx.fgOut[0]*re;y+=fx.fgOut[1]*re;
          fgEl.style.transform=`translate3d(${(x*u).toFixed(2)}px,${(y*u).toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
          fgEl.style.opacity=clamp(g*5).toFixed(3);
          anchor=[fgRect[0]+x*u,fgRect[1]+y*u,fgRect[2]*sc,fgRect[3]*sc];
        }else anchor=[W*.3,H*.62,W*.4,H*.2];
        draw(ctx,g,ms,anchor);
        /* 3. Titre. */
        const ti=clamp((t-(T.gesture-80))/300),to=clamp((t-T.title-60)/260);
        title.style.opacity=(ti*(1-to)).toFixed(3);
        title.style.transform=`translate3d(-50%,${(16*(1-easeOut(ti))-12*to).toFixed(1)}px,0) scale(${(.94+.06*easeOut(ti)).toFixed(3)})`;
        if(ti>0&&!buzz){buzz=true;try{navigator.vibrate?.(5);}catch(_){}}
        if(line)line.style.transform=`scaleX(${easeOut(clamp((t-T.gesture)/500)).toFixed(3)})`;
        if(gauge)gauge.textContent=Math.round(fx.gauge*easeOut(clamp((t-T.cover)/(T.title-T.cover))));
        ticks.forEach((e,i)=>e.classList.toggle('on',t>T.gesture+120+i*170));
        /* 4. Révélation de l’app. */
        if(t>T.title)el.style.clipPath=exitClip(fx.out,easeOut(r),W,H);
        if(t<T.end)requestAnimationFrame(step);else done();
      };
      requestAnimationFrame(step);
    });
    el.remove();busy=false;
  }
  /* Retour à « toutes les activités » : fondu enchaîné natif (View Transitions) quand le navigateur le permet. */
  function neutral(swap){
    if(reduced()||!document.startViewTransition||busy){swap?.();return;}
    try{document.startViewTransition(()=>swap?.());}catch(_){swap?.();}
  }
  window.OceanTransition={play,neutral,preload:load,FX};
})();
