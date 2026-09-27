/* Voyage dans le spot : immersion plein écran façon « stories ».
   Scènes : illustrations IA déclarées dans spot-scenes.js, photographies créditées,
   panoramas 360° Wikimedia (spot-panoramas.js) et, à la demande, une balade Google Street View. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduce=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHOTO_MS=9000;
  const PANNELLUM='https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/';
  let root=null,spot=null,scenes=[],index=0,timer=null,started=0,remaining=PHOTO_MS,paused=false,viewer=null,opener=null,soundWasOn=false,particles=null;

  const icon={
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
    mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    walk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4.5" r="1.8"/><path d="m9.5 21 2-6 3 3v3M8 12l2.5-4.5L14 9l2.5 3M11.5 15l1-5.5"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    orbit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9.5" ry="4"/><path d="M12 3.5v17"/><path d="m18.5 7.5 2 .5-.4 2"/></svg>'
  };

  const sportLabel=id=>(typeof SPORTMAP!=='undefined'&&SPORTMAP[id]?.label)||id;
  const levelLabel=l=>({debutant:'Débutant',intermediaire:'Intermédiaire',expert:'Expert'}[l]||'Tous niveaux');
  function steps(s){
    const out=[];
    out.push({kicker:'Arrivée',title:s.name.split(' — ')[0],text:s.desc});
    if(s.tip)out.push({kicker:'Le conseil de Poulpy',title:'Avant d’entrer dans l’eau',text:s.tip});
    (s.dangers||[]).slice(0,2).forEach(d=>out.push({kicker:'À surveiller',title:d[0]+' '+(d[1].split(/[.:]/)[0]||'Sécurité'),text:d[1]}));
    if(s.anecdote)out.push({kicker:'Le saviez-vous ?',title:'Une histoire du spot',text:s.anecdote});
    return out;
  }
  function build(s){
    const act=typeof activeSport!=='undefined'?activeSport:null;
    const photos=(window.OceanPhotos?.list(s.id,act)||[]).slice(0,6);
    const ai=(window.OCEAN_SCENES?.[s.id]||[]).map(x=>({type:'ai',src:x.src,title:x.title,caption:x.caption}));
    const panos=(window.OCEAN_PANORAMAS?.[s.id]||[]).slice(0,4).map(p=>({...p,type:p.mode==='wide'?'wide':'pano'}));
    const text=steps(s);
    const list=[];
    ai.forEach((a,i)=>list.push({...a,step:text[i%text.length]}));
    photos.forEach((p,i)=>list.push({type:'photo',src:p.src,author:p.author,license:p.license,source:p.source,position:p.position,step:text[(ai.length+i)%text.length]}));
    const wides=panos.filter(p=>p.type==='wide'),spheres=panos.filter(p=>p.type==='pano');
    wides.forEach((p,i)=>list.splice(Math.min(list.length,1+i*2),0,{...p,step:{kicker:'Panorama',title:i?'Encore un peu plus loin':'Regarde tout autour',text:'Vue panoramique réelle prise à quelques pas du spot. Laisse la caméra glisser le long du rivage.'}}));
    if(!list.length)list.push({type:'photo',src:null,step:text[0]});
    spheres.forEach(p=>list.push({...p,step:{kicker:'Vue 360°',title:'Tourne la tête',text:'Glisse ou incline ton téléphone pour regarder tout autour de toi. Panorama réel pris près du spot.'}}));
    list.push({type:'walk',step:{kicker:'Balade libre',title:'Promène-toi autour du spot',text:'Google Street View t’emmène dans les rues et chemins les plus proches. Les flèches te font avancer : le point de vue peut être à quelques centaines de mètres de l’eau.'}});
    return list;
  }

  function ensureRoot(){
    if(root)return root;
    root=document.createElement('div');root.className='voyage';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Voyage dans le spot');root.hidden=true;
    root.innerHTML=`<div class="voyage-stage" data-stage></div><canvas class="voyage-spray" aria-hidden="true"></canvas><div class="voyage-shade" aria-hidden="true"></div>
      <div class="voyage-top"><div class="voyage-bars" data-bars></div><div class="voyage-head"><div class="voyage-id"><small data-place></small><b data-name></b></div>
      <button type="button" class="voyage-btn" data-pause aria-label="Mettre en pause">${icon.pause}</button><button type="button" class="voyage-btn" data-sound aria-label="Son de l’océan">${icon.mute}</button><button type="button" class="voyage-btn" data-close aria-label="Fermer le voyage">${icon.close}</button></div></div>
      <button type="button" class="voyage-tap voyage-tap-prev" data-prev aria-label="Scène précédente">${icon.prev}</button><button type="button" class="voyage-tap voyage-tap-next" data-next aria-label="Scène suivante">${icon.next}</button>
      <div class="voyage-card" data-card aria-live="polite"></div>`;
    document.body.append(root);
    root.addEventListener('click',onClick);
    root.addEventListener('pointerdown',e=>{if(e.target.closest('.voyage-stage')&&['photo','ai','wide'].includes(scenes[index]?.type))hold(true);});
    root.addEventListener('pointerup',()=>{if(paused==='hold')hold(false);});
    root.addEventListener('pointercancel',()=>{if(paused==='hold')hold(false);});
    root.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);if(e.key===' '&&!e.target.closest('button')){e.preventDefault();togglePause();}});
    return root;
  }
  function onClick(e){
    const t=e.target.closest('button,a');if(!t)return;
    if(t.matches('[data-close]'))close();
    else if(t.matches('[data-next]'))go(1);
    else if(t.matches('[data-prev]'))go(-1);
    else if(t.matches('[data-pause]'))togglePause();
    else if(t.matches('[data-sound]')){window.OceanSound?.toggle();setTimeout(soundIcon,60);}
    else if(t.matches('[data-jump]'))show(+t.dataset.jump);
    else if(t.matches('[data-walk]'))startWalk();
    else if(t.matches('[data-trip]')){close();window.OceanTrips?.fromSpot?.(spot.id);}
  }
  const soundIcon=()=>{const b=root?.querySelector('[data-sound]');if(b){const on=!!window.OceanSound?.on;b.innerHTML=on?icon.sound:icon.mute;b.setAttribute('aria-pressed',String(on));}};

  function bars(){root.querySelector('[data-bars]').innerHTML=scenes.map((s,i)=>`<i class="${i<index?'done':i===index?'on':''}"><b></b></i>`).join('');}
  function card(sc){
    const st=sc.step||{},credit=sc.type==='photo'&&sc.author?`<a href="${esc(sc.source||'#')}" target="_blank" rel="noopener noreferrer">Photo : ${esc(sc.author)} · ${esc(sc.license||'')}</a>`
      :sc.type==='wide'?`<a href="${esc(sc.page)}" target="_blank" rel="noopener noreferrer">Panorama : ${esc(sc.author||'Wikimedia Commons')} · ${esc(sc.license||'')}</a>`
      :sc.type==='pano'?`<a href="${esc(sc.page)}" target="_blank" rel="noopener noreferrer">360° : ${esc(sc.author||'Wikimedia Commons')} · ${esc(sc.license||'')}</a>`
      :sc.type==='ai'?'<span class="voyage-ai">Scène illustrée par IA · pas une photo du lieu</span>':sc.type==='walk'?'<span>Images © Google Street View</span>':'';
    const chips=[levelLabel(spot.level),...(spot.sports||[]).slice(0,3).map(sportLabel)].map(x=>`<span>${esc(x)}</span>`).join('');
    const live=typeof LIVE!=='undefined'?LIVE[spot.id]:null;const cond=live?.live?`<div class="voyage-live"><span><small>Vent</small><b>${esc(live.wind)}</b></span><span><small>Houle</small><b>${esc(live.swell)}</b></span><span><small>Eau</small><b>${esc(live.temp)}</b></span></div>`:'';
    const walkBtn=sc.type==='walk'&&!sc.started?`<button type="button" class="voyage-cta" data-walk>${icon.walk} Lancer la balade</button>`:'';
    root.querySelector('[data-card]').innerHTML=`<div class="voyage-kicker"><img src="${esc(window.PoulpyIcons?.src?.(spot.sports?.[0])||'assets/design/poulpy.webp')}" alt="" width="34" height="34"><span>${esc(st.kicker||'')}</span><em>${index+1} / ${scenes.length}</em></div>
      <h2>${esc(st.title||spot.name)}</h2><p>${esc(st.text||'')}</p>${cond}<div class="voyage-chips">${chips}</div>
      <div class="voyage-actions">${walkBtn}<button type="button" class="voyage-cta voyage-cta-main" data-trip>${icon.plus} Ajouter à un voyage</button></div><div class="voyage-credit">${credit}</div>`;
  }
  function clearStage(){
    try{viewer?.destroy?.();}catch(_){}viewer=null;
    root.querySelector('[data-stage]').innerHTML='';
  }
  function show(i){
    if(!scenes.length)return;
    index=(i+scenes.length)%scenes.length;const sc=scenes[index];
    clearTimeout(timer);clearStage();
    const stage=root.querySelector('[data-stage]');
    root.dataset.kind=sc.type;
    if(sc.type==='photo'||sc.type==='ai'){
      if(sc.src){
        const img=new Image();img.className='voyage-photo';img.alt='';img.decoding='async';img.src=sc.src;
        if(sc.position)img.style.objectPosition=sc.position;
        const dir=index%2?'kb-b':'kb-a';img.classList.add(dir);
        stage.append(img);
        img.onerror=()=>{img.remove();stage.innerHTML='<div class="voyage-empty"></div>';};
      }else stage.innerHTML='<div class="voyage-empty"></div>';
      remaining=PHOTO_MS;paused=paused===true;schedule(PHOTO_MS);
    }else if(sc.type==='wide'){
      const img=new Image();img.className='voyage-wide';img.alt='';img.decoding='async';img.src=sc.url;stage.append(img);
      img.onerror=()=>{img.remove();stage.innerHTML='<div class="voyage-empty"></div>';};
      remaining=PHOTO_MS*1.6;paused=paused===true;schedule(PHOTO_MS*1.6);
    }else if(sc.type==='pano'){
      stage.innerHTML='<div class="voyage-pano" id="voyagePano"><div class="voyage-loading">Chargement du panorama 360°…</div></div>';
      pannellum().then(p=>{if(scenes[index]!==sc)return;viewer=p.viewer('voyagePano',{type:'equirectangular',panorama:sc.url,autoLoad:true,autoRotate:reduce()?0:-2,showControls:false,compass:false,hfov:100,crossOrigin:'anonymous'});})
        .catch(()=>{stage.innerHTML='<div class="voyage-empty"><b>Le panorama n’a pas pu être chargé.</b></div>';});
      stopBar();
    }else if(sc.type==='walk'){
      sc.started=false;
      const bg=scenes.find(x=>x.type==='photo'&&x.src);
      stage.innerHTML=`<div class="voyage-walk-cover">${bg?`<img class="voyage-photo kb-a" src="${esc(bg.src)}" alt="">`:''}<div class="voyage-walk-badge">${icon.orbit}<b>Balade 360°</b><small>Avance avec les flèches, tourne en glissant</small></div></div>`;
      stopBar();
    }
    bars();card(sc);root.classList.toggle('is-paused',!!paused);
    root.querySelector('[data-pause]').hidden=!(sc.type==='photo'||sc.type==='ai'||sc.type==='wide');
    const nxt=scenes[index+1],preload=nxt&&(nxt.type==='wide'?nxt.url:(nxt.type==='photo'||nxt.type==='ai')?nxt.src:null);if(preload){const pre=new Image();pre.src=preload;}
  }
  function startWalk(){
    const sc=scenes[index];if(sc.type!=='walk')return;sc.started=true;
    const {lat,lon}=spot.coords;
    root.querySelector('[data-stage]').innerHTML=`<iframe class="voyage-walk" title="Balade Street View autour de ${esc(spot.name)}" src="https://www.google.com/maps?layer=c&cbll=${lat},${lon}&cbp=12,0,0,0,0&output=svembed" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    card(sc);root.classList.add('is-walking');
  }
  function stopBar(){const on=root.querySelector('.voyage-bars i.on b');if(on)on.style.animation='none';}
  let total=PHOTO_MS;
  function schedule(duration){
    if(duration)total=duration;
    clearTimeout(timer);
    const b=root.querySelector('.voyage-bars i.on b');if(b){b.style.animationDuration=total+'ms';b.style.animationDelay=-(total-remaining)+'ms';b.style.animationPlayState=paused?'paused':'running';}
    if(paused){root.querySelectorAll('.voyage-photo,.voyage-wide').forEach(i=>i.style.animationPlayState='paused');return;}
    started=performance.now();
    timer=setTimeout(()=>{if(index<scenes.length-1)go(1);},remaining);
  }
  function hold(on){
    if(on){if(paused)return;paused='hold';freeze();}
    else{paused=false;root.querySelectorAll('.voyage-photo,.voyage-wide').forEach(i=>i.style.animationPlayState='running');schedule();}
    root.classList.toggle('is-paused',!!paused);
  }
  function freeze(){clearTimeout(timer);remaining=Math.max(0,remaining-(performance.now()-started));const b=root.querySelector('.voyage-bars i.on b');if(b)b.style.animationPlayState='paused';root.querySelectorAll('.voyage-photo,.voyage-wide').forEach(i=>i.style.animationPlayState='paused');}
  function togglePause(){
    if(paused){paused=false;root.querySelectorAll('.voyage-photo,.voyage-wide').forEach(i=>i.style.animationPlayState='running');schedule();}
    else{paused=true;freeze();}
    root.classList.toggle('is-paused',!!paused);
    const b=root.querySelector('[data-pause]');b.innerHTML=paused?icon.play:icon.pause;b.setAttribute('aria-label',paused?'Reprendre':'Mettre en pause');
  }
  function go(step){root.classList.remove('is-walking');show(index+step);}

  let pannellumPromise=null;
  function pannellum(){
    if(window.pannellum)return Promise.resolve(window.pannellum);
    if(pannellumPromise)return pannellumPromise;
    pannellumPromise=new Promise((resolve,reject)=>{
      const css=document.createElement('link');css.rel='stylesheet';css.href=PANNELLUM+'pannellum.css';document.head.append(css);
      const js=document.createElement('script');js.src=PANNELLUM+'pannellum.js';js.onload=()=>resolve(window.pannellum);js.onerror=()=>{pannellumPromise=null;reject();};document.head.append(js);
    });
    return pannellumPromise;
  }

  /* Embruns : quelques particules lumineuses qui dérivent devant la scène. */
  function spray(on){
    const c=root.querySelector('.voyage-spray');
    if(particles){cancelAnimationFrame(particles.raf);particles=null;}
    if(!on||reduce())return;
    const ctx=c.getContext('2d');const dpr=Math.min(2,devicePixelRatio||1);
    const size=()=>{c.width=innerWidth*dpr;c.height=innerHeight*dpr;};size();
    const dots=Array.from({length:Math.round(Math.min(70,innerWidth/14))},()=>({x:Math.random(),y:Math.random(),r:.6+Math.random()*2.2,v:.00012+Math.random()*.00035,a:.15+Math.random()*.45,w:Math.random()*6}));
    particles={raf:0};
    const tick=t=>{
      if(!particles)return;
      ctx.clearRect(0,0,c.width,c.height);
      for(const d of dots){d.y-=d.v*16;d.x+=Math.sin(t/1800+d.w)*.0003;if(d.y<-.02){d.y=1.02;d.x=Math.random();}
        ctx.beginPath();ctx.fillStyle=`rgba(255,255,255,${d.a*(.6+.4*Math.sin(t/700+d.w))})`;ctx.arc(d.x*c.width,d.y*c.height,d.r*dpr,0,7);ctx.fill();}
      particles.raf=requestAnimationFrame(tick);
    };
    particles.raf=requestAnimationFrame(tick);
  }

  function open(s){
    if(!s)return;
    spot=s;scenes=build(s);index=0;paused=false;opener=document.activeElement;
    ensureRoot();root.hidden=false;document.documentElement.classList.add('voyage-open');
    root.querySelector('[data-place]').textContent=[s.loc,window.worldOf?.(s.world)?.lab].filter(Boolean).join(' · ');
    root.querySelector('[data-name]').textContent=s.name.split(' — ')[0];
    requestAnimationFrame(()=>root.classList.add('is-open'));
    soundWasOn=!!window.OceanSound?.on;
    if(!soundWasOn){try{window.OceanSound?.start?.();}catch(_){}}
    setTimeout(soundIcon,80);
    spray(true);show(0);
    root.querySelector('[data-close]').focus({preventScroll:true});
  }
  function close(){
    if(!root||root.hidden)return;
    clearTimeout(timer);spray(false);clearStage();
    root.classList.remove('is-open','is-walking');document.documentElement.classList.remove('voyage-open');
    setTimeout(()=>{root.hidden=true;},260);
    if(!soundWasOn&&window.OceanSound?.on){try{window.OceanSound.stop();}catch(_){}}
    if(opener?.isConnected)opener.focus({preventScroll:true});
  }
  window.OceanVoyage={open,close,scenes:s=>build(s)};
})();
