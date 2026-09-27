/* Voyage dans le spot : immersion plein écran façon « stories ».
   Scènes : illustrations IA déclarées dans spot-scenes.js, photographies créditées,
   panoramas Wikimedia (spot-panoramas.js), puis « Explorer le spot » : plusieurs points de vue 360°
   (parking, plage, belvédère, jetée, dans l'eau, sous l'eau). Leur liste (assets/voyage/viewpoints.json,
   générée par scripts/build-spot-viewpoints.mjs) et les vues elles-mêmes ne se chargent qu'à l'ouverture. */
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
    car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16.5V12l2-5h10l2 5v4.5M5 16.5h14M5 16.5V19M19 16.5V19M4 12h16"/><circle cx="8" cy="14.2" r=".6"/><circle cx="16" cy="14.2" r=".6"/></svg>',
    beach:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20c3-1.5 6-1.5 9 0s6 1.5 9 0M13 17 9 5M4.5 8.5C6 4.5 12 3 16 6.5z"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    pier:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16M7 9v8M12 9v8M17 9v8M3 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/></svg>',
    wave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 15c2.2 0 2.8-2 4.8-2s2.6 2 4.7 2 2.6-2 4.7-2 2.6 2 4.8 2M2.5 19.5c2.2 0 2.8-2 4.8-2s2.6 2 4.7 2 2.6-2 4.7-2 2.6 2 4.8 2M8 10.5C8 7 10.5 4.5 14.5 4.5c-1.5 1.3-2 3-1.4 4.6"/></svg>',
    dive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5h13a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1.5l-1.5-2h-2l-1.5 2H7.5a3 3 0 0 1-3-3v-1z"/><path d="M18.5 11.5h2V5"/><circle cx="7" cy="20" r="1"/><circle cx="11" cy="19" r=".7"/></svg>',
    gyro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M3.5 8.5a10 10 0 0 0 0 7M20.5 8.5a10 10 0 0 1 0 7M11 18h2"/></svg>',
    fold:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
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
    list.push({type:'explore',spheres,step:{kicker:'Explorer le spot',title:'Balade-toi sur le spot',text:''}});
    return list;
  }

  function ensureRoot(){
    if(root)return root;
    root=document.createElement('div');root.className='voyage';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Voyage dans le spot');root.hidden=true;
    root.innerHTML=`<div class="voyage-stage" data-stage></div><canvas class="voyage-spray" aria-hidden="true"></canvas><div class="voyage-shade" aria-hidden="true"></div>
      <div class="voyage-top"><div class="voyage-bars" data-bars></div><div class="voyage-head"><div class="voyage-id"><small data-place></small><b data-name></b></div>
      <button type="button" class="voyage-btn voyage-btn-360" data-explore aria-label="Explorer le spot en 360°">${icon.orbit}<span aria-hidden="true">360°</span></button><button type="button" class="voyage-btn" data-pause aria-label="Mettre en pause">${icon.pause}</button><button type="button" class="voyage-btn" data-sound aria-label="Son de l’océan">${icon.mute}</button><button type="button" class="voyage-btn" data-close aria-label="Fermer le voyage">${icon.close}</button></div></div>
      <button type="button" class="voyage-tap voyage-tap-prev" data-prev aria-label="Scène précédente">${icon.prev}</button><button type="button" class="voyage-tap voyage-tap-next" data-next aria-label="Scène suivante">${icon.next}</button>
      <div class="vx-map" data-vx-map aria-hidden="true"></div><div class="voyage-card" data-card aria-live="polite"></div>`;
    document.body.append(root);
    root.addEventListener('click',onClick);
    root.addEventListener('pointerdown',e=>{if(e.target.closest('.voyage-stage')&&['photo','ai','wide'].includes(scenes[index]?.type))hold(true);});
    root.addEventListener('pointerup',()=>{if(paused==='hold')hold(false);});
    root.addEventListener('pointercancel',()=>{if(paused==='hold')hold(false);});
    root.addEventListener('keydown',e=>{if(e.key==='Escape')close();const ahead=document.documentElement.dir==='rtl'?-1:1;const k=e.key==='ArrowRight'?ahead:e.key==='ArrowLeft'?-ahead:0;
      if(k&&e.target.closest('.pnlm-container'))return;
      if(k&&scenes[index]?.type==='explore'){const sc=scenes[index];if(sc.views?.length&&sc.cur+k>=0&&sc.cur+k<sc.views.length)goView(sc.cur+k);else if(k<0)go(-1);}
      else if(k)go(k);if(e.key===' '&&!e.target.closest('button')){e.preventDefault();togglePause();}});
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
    else if(t.matches('[data-explore]'))explore();
    else if(t.matches('[data-vx]'))goView(+t.dataset.vx);
    else if(t.matches('[data-vx-consent]')){streetView(true);goView(scenes[index].cur);}
    else if(t.matches('[data-vx-revoke]')){streetView(false);goView(scenes[index].cur);}
    else if(t.matches('[data-vx-retry]'))goView(scenes[index].cur);
    else if(t.matches('[data-vx-min]')){const m=root.classList.toggle('vx-min');t.setAttribute('aria-expanded',String(!m));t.setAttribute('aria-label',m?'Afficher les infos':'Masquer les infos');}
    else if(t.matches('[data-vx-gyro]'))gyro(t);
    else if(t.matches('[data-trip]')){close();window.OceanTrips?.fromSpot?.(spot.id);}
  }
  const soundIcon=()=>{const b=root?.querySelector('[data-sound]');if(b){const on=!!window.OceanSound?.on;b.innerHTML=on?icon.sound:icon.mute;b.setAttribute('aria-pressed',String(on));}};

  function bars(){root.querySelector('[data-bars]').innerHTML=scenes.map((s,i)=>`<i class="${i<index?'done':i===index?'on':''}"><b></b></i>`).join('');}
  function card(sc){
    const st=sc.step||{},credit=sc.type==='photo'&&sc.author?`<a href="${esc(sc.source||'#')}" target="_blank" rel="noopener noreferrer">Photo : ${esc(sc.author)} · ${esc(sc.license||'')}</a>`
      :sc.type==='wide'?`<a href="${esc(sc.page)}" target="_blank" rel="noopener noreferrer">Panorama : ${esc(sc.author||'Wikimedia Commons')} · ${esc(sc.license||'')}</a>`
      :sc.type==='pano'?`<a href="${esc(sc.page)}" target="_blank" rel="noopener noreferrer">360° : ${esc(sc.author||'Wikimedia Commons')} · ${esc(sc.license||'')}</a>`
      :sc.type==='ai'?'<span class="voyage-ai">Scène illustrée par IA · pas une photo du lieu</span>':'';
    if(sc.type==='explore')return dock(sc);
    const chips=[levelLabel(spot.level),...(spot.sports||[]).slice(0,3).map(sportLabel)].map(x=>`<span>${esc(x)}</span>`).join('');
    const live=typeof LIVE!=='undefined'?LIVE[spot.id]:null;const cond=live?.live?`<div class="voyage-live"><span><small>Vent</small><b>${esc(live.wind)}</b></span><span><small>Houle</small><b>${esc(live.swell)}</b></span><span><small>Eau</small><b>${esc(live.temp)}</b></span></div>`:'';
    root.querySelector('[data-card]').innerHTML=`<div class="voyage-kicker"><img src="${esc(window.PoulpyIcons?.src?.(spot.sports?.[0])||'assets/design/poulpy.webp')}" alt="" width="34" height="34"><span>${esc(st.kicker||'')}</span><em>${index+1} / ${scenes.length}</em></div>
      <h2>${esc(st.title||spot.name)}</h2><p>${esc(st.text||'')}</p>${cond}<div class="voyage-chips">${chips}</div>
      <div class="voyage-actions"><button type="button" class="voyage-cta" data-explore>${icon.orbit} Explorer en 360°</button><button type="button" class="voyage-cta voyage-cta-main" data-trip>${icon.plus} Ajouter à un voyage</button></div><div class="voyage-credit">${credit}</div>`;
  }
  function clearStage(){
    try{viewer?.destroy?.();}catch(_){}viewer=null;
    root.classList.remove('vx-min','vx-google');
    root.querySelector('[data-stage]').innerHTML='';root.querySelector('[data-vx-map]').innerHTML='';
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
    }else if(sc.type==='explore'){
      stage.innerHTML='<div class="vx-layers" data-layers></div>';stopBar();
      sc.views=null;
      loadViews().then(data=>{if(scenes[index]!==sc)return;Object.assign(sc,viewpoints(spot,data,sc.spheres));sc.cur=-1;goView(Math.min(sc.start||0,Math.max(0,sc.views.length-1)));});
    }
    bars();card(sc);root.classList.toggle('is-paused',!!paused);
    root.querySelector('[data-pause]').hidden=!(sc.type==='photo'||sc.type==='ai'||sc.type==='wide');root.querySelector('[data-explore]').hidden=sc.type==='explore';
    const nxt=scenes[index+1],preload=nxt&&(nxt.type==='wide'?nxt.url:(nxt.type==='photo'||nxt.type==='ai')?nxt.src:null);if(preload){const pre=new Image();pre.src=preload;}
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
  function go(step){show(index+step);}
  function explore(start){const i=scenes.findIndex(x=>x.type==='explore');if(i<0)return;scenes[i].start=start||0;show(i);}

  /* ---------- Explorer le spot : plusieurs points de vue 360° ---------- */
  const VIEWS_URL='assets/voyage/viewpoints.json',SV_KEY='oceanbuddy_streetview_v1';
  let viewsPromise=null,svOk=null;
  const KIND={
    parking:{icon:'car',go:'En route vers le parking…',label:'Le parking',text:'Là où tu te gares avant de rejoindre l’eau. Repère l’accès et le chemin jusqu’au spot.'},
    centre:{icon:'walk',go:'En route vers les abords du spot…',label:'Autour du spot',text:'Les rues et chemins les plus proches du spot. Avance avec les flèches pour t’approcher de l’eau.'},
    plage:{icon:'beach',go:'En route vers la plage…',label:'La plage',text:'Les pieds dans le sable, face au spot. Regarde d’où viennent les vagues et où les gens entrent dans l’eau.'},
    vue:{icon:'eye',go:'En route vers le point de vue…',label:'Le point de vue',text:'Le meilleur endroit pour observer le spot d’en haut avant d’y aller.'},
    jetee:{icon:'pier',go:'En route vers la jetée…',label:'Sur la jetée',text:'Au-dessus de l’eau, au bout de la jetée : idéal pour voir le plan d’eau de près.'},
    bord:{icon:'beach',go:'En route vers le bord de l’eau…',label:'Au bord de l’eau',text:'Au ras de l’eau, là où l’on entre et sort : regarde les vagues et les rochers de près.'},
    pano:{icon:'orbit',go:'En route vers le panorama…',label:'Panorama 360°',text:'Un panorama réel pris près du spot. Glisse pour regarder tout autour de toi.'},
    eau:{icon:'wave',go:'Tu entres dans l’eau…',label:'Dans l’eau',text:'Une vue prise sur l’eau, là où l’on nage, surfe ou navigue.'},
    sous:{icon:'dive',go:'Tu plonges sous la surface…',label:'Sous l’eau',text:'Une vue prise sous la surface : fonds, récif et vie marine.'}
  };
  const ORDER=['parking','centre','plage','vue','jetee','bord','pano','eau','sous'];
  function loadViews(){
    if(!viewsPromise)viewsPromise=fetch(VIEWS_URL).then(r=>r.ok?r.json():Promise.reject()).catch(()=>{viewsPromise=null;return null;});
    return viewsPromise;
  }
  function viewpoints(s,data,spheres){
    const d=data?.s?.[s.id],views=[];
    for(const r of d?.p||[]){
      const [k,lat,lon,head,name,src,a,b,c,e]=r;if(!KIND[k])continue;
      views.push(src==='g'?{k,lat,lon,head,name,src:'google'}:{k,lat,lon,head,name,src:'commons',path:a,w:b,author:c,license:e,page:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(String(a).split('/').pop().replace(/ /g,'_'))});
    }
    for(const p of spheres||[])views.push({k:'pano',src:'sphere',url:p.url,page:p.page,author:p.author,license:p.license,name:''});
    if(!data&&s.coords)views.push({k:'centre',src:'google-ll',lat:s.coords.lat,lon:s.coords.lon,head:0,name:''});
    const water=views.some(v=>v.k==='eau'||v.k==='sous'),ai=(window.OCEAN_SCENES?.[s.id]||[])[2];
    if(!water&&ai)views.push({k:'eau',src:'ai',img:ai.src,name:''});
    views.sort((x,y)=>ORDER.indexOf(x.k)-ORDER.indexOf(y.k));
    const o=d?.o?{lat:d.o[0],lon:d.o[1]}:s.coords?{lat:s.coords.lat,lon:s.coords.lon}:null;
    return {views,origin:o,sea:d?.w??null};
  }
  function streetView(v){
    if(typeof v==='boolean'){svOk=v;try{v?localStorage.setItem(SV_KEY,'1'):localStorage.removeItem(SV_KEY);}catch(_){}}
    if(svOk===null){try{svOk=localStorage.getItem(SV_KEY)==='1';}catch(_){svOk=false;}}
    return svOk;
  }
  const rad=x=>x*Math.PI/180;
  function metres(a,b){const k=Math.cos(rad((a.lat+b.lat)/2));return Math.hypot((b.lat-a.lat)*111320,(b.lon-a.lon)*111320*k);}
  function azimut(a,b){const k=Math.cos(rad((a.lat+b.lat)/2));return (Math.atan2((b.lon-a.lon)*k,b.lat-a.lat)*180/Math.PI+360)%360;}
  function away(v,o){
    if(!o||v.lat==null)return '';const m=metres(o,v);
    if(m<60)return 'Au cœur du spot';
    return m<1000?`À ${Math.round(m/10)*10} m du spot`:`À ${(m/1000).toFixed(1).replace('.',',')} km du spot`;
  }
  function commonsUrl(v){
    const big=(innerWidth*(devicePixelRatio||1)>=900)&&!navigator.connection?.saveData&&!/2g|3g/.test(navigator.connection?.effectiveType||'');
    const w=big&&v.w>=3840?3840:v.w>=1920?1920:0,file=encodeURIComponent(v.path.split('/').pop().replace(/ /g,'_')),dir=v.path.split('/').slice(0,2).join('/');
    return w?`https://upload.wikimedia.org/wikipedia/commons/thumb/${dir}/${file}/${w}px-${file}`:`https://upload.wikimedia.org/wikipedia/commons/${dir}/${file}`;
  }
  function svUrl(v){
    return `https://www.google.com/maps?layer=c&cbll=${v.lat},${v.lon}&cbp=12,${v.head||0},0,0,0&output=svembed`;
  }
  function coverImg(){const p=scenes.find(x=>(x.type==='photo'||x.type==='ai')&&x.src);return p?`<img class="voyage-photo" src="${esc(p.src)}" alt="">`:'';}
  function goView(i){
    const sc=scenes[index];if(!sc||sc.type!=='explore'||!sc.views)return;
    const layers=root.querySelector('[data-layers]');if(!layers)return;
    if(!sc.views.length){sc.cur=0;layers.innerHTML=`<div class="vx-layer vx-note">${coverImg()}<div class="vx-panel">${icon.orbit}<b>Pas encore de vue 360° vérifiée ici.</b><span>Aucune vue Street View ni panorama libre n’a été trouvé près de ce spot. Tu peux regarder le secteur sur la carte.</span><a class="voyage-cta" href="https://www.google.com/maps/@${spot.coords?.lat},${spot.coords?.lon},15z" target="_blank" rel="noopener noreferrer">${icon.pin} Ouvrir la carte</a></div></div>`;dock(sc);return;}
    const v=sc.views[i],prev=sc.views[sc.cur];if(!v)return;sc.cur=i;
    const oldViewer=viewer;viewer=null;
    const olds=[...layers.children];
    const layer=document.createElement('div');layer.className='vx-layer is-entering';
    layers.querySelector('.vx-move')?.remove();
    const move=prev&&prev!==v&&!reduce()?Object.assign(document.createElement('div'),{className:'vx-move',textContent:KIND[v.k].go}):null;
    layers.append(layer);if(move)layers.append(move);
    let done=false;
    const ready=()=>{if(done)return;done=true;move?.classList.add('is-done');setTimeout(()=>move?.remove(),400);requestAnimationFrame(()=>layer.classList.remove('is-entering'));
      olds.forEach(o=>{o.classList.add('is-leaving');setTimeout(()=>o.remove(),reduce()?0:650);});
      if(oldViewer)setTimeout(()=>{try{oldViewer.destroy();}catch(_){}},reduce()?0:650);};
    const fail=msg=>{if(sc.views[sc.cur]!==v)return;layer.innerHTML=`${coverImg()}<div class="vx-panel"><b>${msg}</b><button type="button" class="voyage-cta" data-vx-retry>Réessayer</button></div>`;layer.classList.add('vx-note');ready();};
    const google=v.src==='google'||v.src==='google-ll';
    root.classList.toggle('vx-google',google&&streetView()&&navigator.onLine!==false);
    if((google||v.src==='commons'||v.src==='sphere')&&navigator.onLine===false){fail('Tu es hors ligne. Les vues 360° se chargent depuis Internet : reconnecte-toi pour te balader sur le spot.');}
    else if(google&&!streetView()){
      layer.classList.add('vx-note');
      layer.innerHTML=`${coverImg()}<div class="vx-panel">${icon.orbit}<b>Cette vue vient de Google Street View.</b><span>En l’ouvrant, Google reçoit la position de la vue et les informations techniques de ta connexion. Ton choix est gardé sur cet appareil.</span><button type="button" class="voyage-cta voyage-cta-main" data-vx-consent>Afficher les vues Google</button><a href="privacy.html" target="_blank" rel="noopener">Confidentialité</a></div>`;
      ready();
    }else if(google){
      const f=document.createElement('iframe');f.className='voyage-walk';f.title=`Vue Street View : ${KIND[v.k].label}`;f.referrerPolicy='no-referrer-when-downgrade';f.setAttribute('allow','accelerometer; gyroscope; fullscreen');
      f.onload=()=>setTimeout(ready,450);f.src=svUrl(v);layer.append(f);setTimeout(ready,5000);
    }else if(v.src==='commons'||v.src==='sphere'){
      const id='vxPano'+Date.now();layer.innerHTML=`<div class="voyage-pano" id="${id}"></div><div class="voyage-loading">Chargement du panorama 360°…</div>`;
      pannellum().then(p=>{
        if(scenes[index]!==sc||sc.views[sc.cur]!==v)return;
        const vw=p.viewer(id,{type:'equirectangular',panorama:v.src==='sphere'?v.url:commonsUrl(v),autoLoad:true,autoRotate:reduce()?0:-1.5,autoRotateInactivityDelay:6000,showControls:false,compass:false,hfov:innerWidth<700?85:100,minHfov:40,crossOrigin:'anonymous'});
        viewer=vw;
        vw.on('load',()=>{layer.querySelector('.voyage-loading')?.remove();ready();});
        vw.on('error',()=>fail('Ce panorama n’a pas pu être chargé.'));
      }).catch(()=>fail('Ce panorama n’a pas pu être chargé.'));
      setTimeout(ready,1200);
    }else{
      const img=new Image();img.className='voyage-photo kb-a';img.alt='';img.decoding='async';img.onload=ready;img.onerror=ready;img.src=v.img;layer.append(img);
    }
    dock(sc);drawMap(sc);
  }
  function credit(v){
    if(v.src==='google'||v.src==='google-ll')return streetView()?'<span>Images © Google Street View</span> <button type="button" class="vx-link" data-vx-revoke>Ne plus charger Google</button>':'<span>Vue fournie par Google Street View</span>';
    if(v.src==='ai')return '<span class="voyage-ai">Illustration IA · pas une photo du lieu</span>';
    return `<a href="${esc(v.page)}" target="_blank" rel="noopener noreferrer">360° : ${esc(v.author||'Wikimedia Commons')} · ${esc(v.license||'')}</a>`;
  }
  function dock(sc){
    const c=root.querySelector('[data-card]');
    const views=sc.views;
    if(!views){c.innerHTML=`<div class="voyage-kicker"><span>Explorer le spot</span></div><h2>Balade-toi sur le spot</h2><p class="vx-text">Chargement des points de vue…</p>`;return;}
    const v=views[sc.cur];
    const sous=views.findIndex(x=>x.k==='sous'),water=sous>=0?sous:views.findIndex(x=>x.k==='eau');
    const toWater=water>=0&&v&&v.k!=='eau'&&v.k!=='sous'?`<button type="button" class="voyage-cta voyage-cta-main" data-vx="${water}">${sous>=0?icon.dive+' Plonger sous l’eau':icon.wave+' Aller dans l’eau'}</button>`:'';
    const gy=v&&(v.src==='commons'||v.src==='sphere')&&matchMedia('(pointer:coarse)').matches&&'DeviceOrientationEvent' in window?`<button type="button" class="voyage-cta" data-vx-gyro aria-pressed="false">${icon.gyro} Bouge ton téléphone</button>`:'';
    const noWater=water<0&&views.length?`<p class="vx-missing">${icon.wave}<span>Pas encore de vue réelle dans l’eau pour ce spot.</span></p>`:'';
    const strip=views.map((x,i)=>`<button type="button" class="vx-chip${i===sc.cur?' is-on':''}" data-vx="${i}"${i===sc.cur?' aria-current="true"':''}>${icon[KIND[x.k].icon]}<span>${esc(KIND[x.k].label)}</span></button>`).join('');
    const kind=v?KIND[v.k]:null,place=v?[v.name,away(v,sc.origin)].filter(Boolean).join(' · '):'';
    const min=root.classList.contains('vx-min'),focused=c.contains(document.activeElement)?document.activeElement:null;
    c.innerHTML=`<div class="voyage-kicker"><img src="${esc(window.PoulpyIcons?.src?.(spot.sports?.[0])||'assets/design/poulpy.webp')}" alt="" width="34" height="34"><span>Explorer le spot</span><em>${views.length?`${sc.cur+1} / ${views.length}`:''}</em><button type="button" class="vx-fold" data-vx-min aria-expanded="${!min}" aria-label="${min?'Afficher les infos':'Masquer les infos'}">${icon.fold}</button></div>
      ${kind?`<h2>${esc(kind.label)}</h2>${place?`<p class="vx-place">${icon.pin}<span>${esc(place)}</span></p>`:''}<p class="vx-text">${esc(v.src==='ai'?'Aucune vue réelle n’existe encore dans l’eau ici. Cette illustration IA te donne une idée de l’ambiance, ce n’est pas une photo du lieu.':kind.text)}</p>`:'<h2>Balade-toi sur le spot</h2>'}
      ${views.length>1?`<div class="vx-strip" role="group" aria-label="Points de vue">${strip}</div>`:''}${noWater}
      ${toWater||gy?`<div class="voyage-actions">${toWater}${gy}</div>`:''}<div class="voyage-credit">${v?credit(v):''}</div>`;
    const on=c.querySelector('.vx-chip.is-on'),strp=c.querySelector('.vx-strip');
    if(on&&strp)strp.scrollLeft=on.offsetLeft-(strp.clientWidth-on.offsetWidth)/2;
    if(focused)(focused.matches('[data-vx-min]')?c.querySelector('[data-vx-min]'):on||c.querySelector('[data-vx-min]'))?.focus({preventScroll:true});
  }
  function drawMap(sc){
    const host=root.querySelector('[data-vx-map]'),o=sc.origin,pts=sc.views.filter(v=>v.lat!=null);
    if(!o||!pts.length){host.innerHTML='';return;}
    const far=Math.max(150,...pts.map(v=>metres(o,v)));
    const xy=v=>{const d=Math.sqrt(metres(o,v)/far)*36,a=rad(azimut(o,v));return [50+Math.sin(a)*d,50-Math.cos(a)*d];};
    const sea=sc.sea!=null?`<g transform="rotate(${sc.sea} 50 50)"><rect x="-10" y="-10" width="120" height="58" fill="url(#vxSea)"/><path d="M4 45q5-3 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0 10 0" class="vx-foam"/></g>`:'';
    host.innerHTML=`<svg viewBox="0 0 100 100"><defs><clipPath id="vxClip"><circle cx="50" cy="50" r="47"/></clipPath><linearGradient id="vxSea" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f7bf0"/><stop offset="1" stop-color="#0b2d7a"/></linearGradient></defs>
      <g clip-path="url(#vxClip)"><circle cx="50" cy="50" r="47" class="vx-land"/>${sea}<g class="vx-cone" data-cone></g></g><circle cx="50" cy="50" r="47" class="vx-ring"/>
      ${sc.views.map((v,i)=>{if(v.lat==null)return '';const [x,y]=xy(v);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i===sc.cur?5.5:3.4}" class="vx-dot${i===sc.cur?' is-on':''}${v.k==='eau'||v.k==='sous'?' is-water':''}"/>`;}).join('')}
      <text x="50" y="12" class="vx-n">N</text></svg>`;
    const v=sc.views[sc.cur];
    if(v?.lat!=null){[host.dataset.x,host.dataset.y]=xy(v);cone(v.src==='google'||v.src==='google-ll'?v.head:null);}
  }
  function cone(h){
    const g=root.querySelector('[data-cone]'),host=root.querySelector('[data-vx-map]');if(!g)return;
    if(h==null||isNaN(h)){g.innerHTML='';return;}
    const x=+host.dataset.x,y=+host.dataset.y;
    g.innerHTML=`<path d="M${x} ${y}L${x-10} ${y-26}A28 28 0 0 1 ${x+10} ${y-26}Z" transform="rotate(${Math.round(h)} ${x} ${y})"/>`;
  }
  async function gyro(btn){
    if(!viewer)return;
    const on=btn.getAttribute('aria-pressed')!=='true';
    try{
      if(on){if(typeof DeviceOrientationEvent?.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')return;viewer.startOrientation();}
      else viewer.stopOrientation();
      btn.setAttribute('aria-pressed',String(on));
    }catch(_){btn.hidden=true;}
  }

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

  function open(s,opts){
    if(!s)return;
    spot=s;scenes=build(s);index=0;paused=false;opener=document.activeElement;
    ensureRoot();root.hidden=false;document.documentElement.classList.add('voyage-open');
    const worldLab=window.worldOf?.(s.world)?.lab;
    root.querySelector('[data-place]').textContent=[s.loc,worldLab&&!String(s.loc||'').toLowerCase().includes(String(worldLab).toLowerCase())?worldLab:''].filter(Boolean).join(' · ');
    root.querySelector('[data-name]').textContent=s.name.split(' — ')[0];
    requestAnimationFrame(()=>root.classList.add('is-open'));
    soundWasOn=!!window.OceanSound?.on;
    if(!soundWasOn){try{window.OceanSound?.start?.();}catch(_){}}
    setTimeout(soundIcon,80);
    spray(true);if(opts?.explore)explore();else show(0);
    root.querySelector('[data-close]').focus({preventScroll:true});
  }
  function close(){
    if(!root||root.hidden)return;
    clearTimeout(timer);spray(false);clearStage();
    root.classList.remove('is-open','vx-google','vx-min');document.documentElement.classList.remove('voyage-open');
    setTimeout(()=>{root.hidden=true;},260);
    if(!soundWasOn&&window.OceanSound?.on){try{window.OceanSound.stop();}catch(_){}}
    if(opener?.isConnected)opener.focus({preventScroll:true});
  }
  window.OceanVoyage={open,close,scenes:s=>build(s)};
})();
