/* Ocean Buddy 1.3 — coque d’application.
   Barre d’onglets flottante (Accueil, Explorer, Voyages, Défis, Profil) et bouton Poulpy,
   grands titres, barre qui se fait discrète au défilement, Explorer en plein écran sur la vraie
   Terre (recherche flottante, continents en photos, soleil réel, nuages) et fenêtre « Nouveautés ».
   Chargé en dernier : il s’appuie sur les fonctions globales de app.js sans les réécrire. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const body=document.body,wrap=$('#screenWrap'),nav=$('.nav');
  if(!wrap||!nav)return;
  const phone=()=>matchMedia('(max-width:959px)').matches;
  const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(_){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- Onglets : icônes au trait, pleines quand l’onglet est actif ---------- */
  const svg=(d,fill)=>`<svg class="${fill?'on':'off'}" viewBox="0 0 24 24" fill="${fill?'currentColor':'none'}" stroke="currentColor" stroke-width="${fill?0:1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const TABS={
    home:{label:'Accueil',off:'<path d="M3.5 10.6 12 3.6l8.5 7v9.1a1.3 1.3 0 0 1-1.3 1.3h-4.4v-6.2H9.2V21H4.8a1.3 1.3 0 0 1-1.3-1.3z"/>',on:'<path d="M11.2 2.9a1.3 1.3 0 0 1 1.6 0l8.3 6.8c.3.3.5.7.5 1.1v8.9a2.3 2.3 0 0 1-2.3 2.3h-4.1v-6.6a.8.8 0 0 0-.8-.8H9.6a.8.8 0 0 0-.8.8V22H4.7a2.3 2.3 0 0 1-2.3-2.3v-8.9c0-.4.2-.8.5-1.1z"/>'},
    spots:{label:'Explorer',off:'<circle cx="12" cy="12" r="9"/><path d="M3.3 9.5h17.4M3.3 14.5h17.4"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',on:'<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm3.4 13.2H8.6c.5 2 1.6 3.9 3.4 5.4 1.8-1.5 2.9-3.4 3.4-5.4zm-8.7 0H3.8a8.5 8.5 0 0 0 5.4 5.5 12.2 12.2 0 0 1-2.5-5.5zm13.5 0h-2.9a12.2 12.2 0 0 1-2.5 5.5 8.5 8.5 0 0 0 5.4-5.5zM8.4 10.3a14 14 0 0 0 0 3.4h7.2a14 14 0 0 0 0-3.4zm-1.5 0H3.4a8.6 8.6 0 0 0 0 3.4h3.5a16 16 0 0 1 0-3.4zm13.7 0h-3.5a16 16 0 0 1 0 3.4h3.5a8.6 8.6 0 0 0 0-3.4zM9.2 3.3a8.5 8.5 0 0 0-5.4 5.5h2.9c.4-2 1.3-3.9 2.5-5.5zm2.8.1c-1.8 1.5-2.9 3.4-3.4 5.4h6.8c-.5-2-1.6-3.9-3.4-5.4zm2.8-.1c1.2 1.6 2.1 3.5 2.5 5.5h2.9a8.5 8.5 0 0 0-5.4-5.5z"/>'},
    trips:{label:'Voyages',off:'<path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"/><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6v14M16 6v14"/>',on:'<path d="M10.8 2.2h2.4a2.6 2.6 0 0 1 2.6 2.6v.4H18a3.8 3.8 0 0 1 3.8 3.8v8.2A3.8 3.8 0 0 1 18 21h-.6V5.2H16v15.8H8V5.2H6.6V21H6a3.8 3.8 0 0 1-3.8-3.8V9A3.8 3.8 0 0 1 6 5.2h2.2v-.4a2.6 2.6 0 0 1 2.6-2.6zm0 1.6a1 1 0 0 0-1 1v.4h4.4v-.4a1 1 0 0 0-1-1z"/>'},
    challenges:{label:'Défis',off:'<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 5.5H4.6c0 3 1.4 4.6 3.6 5M16 5.5h3.4c0 3-1.4 4.6-3.6 5"/><path d="M12 13.5V17M8.5 20.5h7M10 17h4l.6 3.5H9.4z"/>',on:'<path d="M7.2 3.2h9.6c.4 0 .8.4.8.8v.7h2a.8.8 0 0 1 .8.8c0 3.3-1.7 5.3-4.3 5.8a5 5 0 0 1-3.3 2.9v2.6h1.9l.6 3.5h1a.8.8 0 0 1 0 1.6H7.7a.8.8 0 0 1 0-1.6h1l.6-3.5h1.9v-2.6A5 5 0 0 1 7.9 11C5.3 10.4 3.6 8.5 3.6 5.5a.8.8 0 0 1 .8-.8h2V4c0-.4.4-.8.8-.8zM5.3 6.3c.3 1.7 1.2 2.7 2.4 3.2a5 5 0 0 1-.1-1.1V6.3zm13.4 0h-2.3v2.1c0 .4 0 .8-.1 1.1 1.2-.5 2.1-1.5 2.4-3.2z"/>'},
    profile:{label:'Profil',off:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',on:'<circle cx="12" cy="7.8" r="4.6"/><path d="M12 13.6c4.3 0 7.6 2.6 8.4 6.6a1.3 1.3 0 0 1-1.3 1.6H4.9a1.3 1.3 0 0 1-1.3-1.6c.8-4 4.1-6.6 8.4-6.6z"/>'}
  };
  for(const b of $$('button[data-s]',nav)){
    const t=TABS[b.dataset.s];if(!t)continue;
    const desk=b.querySelector('.desktop-label')?.outerHTML||'';
    const deskIcon=b.querySelector(':scope>svg')?.outerHTML||'';
    b.innerHTML=`${deskIcon}<span class="tab-ic">${svg(t.off,false)}${svg(t.on,true)}</span>${desk}<span class="tab-label">${t.label}</span>`;
    b.setAttribute('aria-label',t.label==='Explorer'?'Explorer la planète':t.label);
  }
  /* Ordre des onglets : Accueil, Explorer, Voyages, Défis, Profil (Communauté est dans le profil). */
  ['home','spots','trips','challenges','profile','community'].forEach(id=>{const b=$(`button[data-s="${id}"]`,nav);if(b)nav.append(b);});
  nav.querySelector('.sidebar-bottom')&&nav.append(nav.querySelector('.sidebar-bottom'));
  const poulpy=document.createElement('button');
  poulpy.type='button';poulpy.className='tab-poulpy';poulpy.setAttribute('aria-label','Discuter avec Poulpy, ton guide IA');
  poulpy.innerHTML='<img src="assets/poulpy/scenes/travel-v2.webp" alt="" width="50" height="50" decoding="async"><i aria-hidden="true"></i>';
  poulpy.onclick=()=>{if(typeof openChat==='function')openChat();};
  nav.after(poulpy);
  /* ---------- Grands titres ---------- */
  const today=()=>new Intl.DateTimeFormat(document.documentElement.lang||'fr',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  function greet(){
    const h=new Date().getHours(),name=typeof userName==='string'&&userName&&userName!=='Explorateur'?userName:'';
    const hello=h<5?'Bonne nuit':h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';
    return name?`${hello}, ${name}`:hello;
  }
  const LARGE={
    home:()=>({title:greet(),sub:today()}),
    trips:()=>({title:'Voyages',sub:'Tes envies, tes itinéraires'}),
    challenges:()=>({title:'Défis',sub:'Quiz, défis et gestes pour l’océan'}),
    profile:()=>({title:'Profil',sub:'Ton passeport et tes trophées'}),
    community:()=>({title:'Communauté',sub:'Les explorateurs racontent'})
  };
  function largeTitles(){
    for(const [id,make] of Object.entries(LARGE)){
      const sec=document.getElementById(id);if(!sec)continue;
      let head=sec.querySelector(':scope>.as-large');
      if(!head){head=document.createElement('header');head.className='as-large';sec.prepend(head);}
      const {title,sub}=make();
      head.innerHTML=`<div><p>${esc(sub)}</p><h1>${esc(title)}</h1></div>`;
    }
  }
  largeTitles();

  /* ---------- Défilement : barre discrète en descendant, visible en remontant ---------- */
  let lastY=0,acc=0;
  wrap.addEventListener('scroll',()=>{
    const y=wrap.scrollTop,d=y-lastY;lastY=y;
    acc=Math.sign(d)===Math.sign(acc)?acc+d:d;
    if(y<40||acc<-24)body.classList.remove('tabs-tucked');else if(acc>36)body.classList.add('tabs-tucked');
  },{passive:true});

  /* ---------- Explorer : la planète en plein écran ---------- */
  const mapShown=()=>$('#mapView')?.style.display!=='none';
  function immersive(){
    const on=phone()&&body.dataset.screen==='spots'&&typeof spotWorld!=='undefined'&&!!spotWorld&&mapShown();
    if(on!==body.classList.contains('explore-immersive')){
      /* En quittant la planète, l’écran Explorer s’efface sans repasser par sa mise en page classique. */
      if(!on&&body.dataset.screen!=='spots'){const sp=$('#spots');if(sp){sp.style.visibility='hidden';setTimeout(()=>{sp.style.visibility='';},470);}}
      body.classList.toggle('explore-immersive',on);
      if(on){wrap.scrollTop=0;body.classList.remove('tabs-tucked','is-scrolled');}
      requestAnimationFrame(()=>{window.OceanMap?.globe?.resize?.();window.OceanMap?.map?.resize?.();dispatchEvent(new Event('resize'));});
    }
    syncSearch();
  }
  /* Entrer dans Explorer sur téléphone ouvre directement la Terre (au lieu de la liste des continents). */
  function toGlobe(){
    if(typeof openWorld!=='function')return;
    if(spotWorld!=='all'||spotCountry)openWorld('all');
    setView('map');
  }
  const wrapFn=(name,after,before)=>{const f=window[name];if(typeof f!=='function')return;window[name]=function(...a){if(before&&before(...a)===false)return;const r=f.apply(this,a);try{after?.(...a);}catch(e){console.warn(e);}return r;};};
  wrapFn('go',s=>{if(s==='spots'&&!spotWorld)toGlobe();immersive();largeTitles();});
  wrapFn('setView',()=>immersive());
  wrapFn('syncWorldUI',()=>immersive());
  /* « Tous les continents » ramène à la planète entière. */
  wrapFn('backToWorlds',()=>{if(body.dataset.screen==='spots'){toGlobe();setTimeout(()=>window.OceanMap?.overview?.(),60);}});
  window.addEventListener('ocean:navigate',()=>requestAnimationFrame(immersive));
  matchMedia('(max-width:959px)').addEventListener?.('change',immersive);

  /* Recherche flottante, reliée à la recherche des spots. */
  let exTop=null;
  function buildTop(){
    const stage=$('#spotMapWrap .omap-stage');if(!stage||exTop)return;
    exTop=document.createElement('div');exTop.className='ex-top';
    exTop.innerHTML=`<label class="ex-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="omap-sr">Rechercher un spot, un pays</span><input type="search" enterkeyhint="search" autocomplete="off" placeholder="Spot, pays, île…"><button type="button" data-ex="clear" aria-label="Effacer la recherche" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button><button type="button" data-ex="list" aria-label="Voir les spots en liste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg></button></label>`;
    stage.append(exTop);
    const input=$('input',exTop),clear=$('[data-ex=clear]',exTop);
    let t=0;
    input.addEventListener('input',()=>{clear.hidden=!input.value;clearTimeout(t);t=setTimeout(()=>{const s=$('#spotSearch');if(s)s.value=input.value;if(typeof searchSpots==='function')searchSpots(input.value);},180);});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur();}});
    clear.onclick=()=>{input.value='';clear.hidden=true;const s=$('#spotSearch');if(s)s.value='';if(typeof searchSpots==='function')searchSpots('');input.focus();};
    $('[data-ex=list]',exTop).onclick=()=>{setView('list');};
  }
  function syncSearch(){
    buildTop();if(!exTop)return;
    const input=$('input',exTop),q=typeof currentSearch==='string'?currentSearch:'';
    if(document.activeElement!==input){input.value=q;$('[data-ex=clear]',exTop).hidden=!q;}
  }

  /* Continents en photos dans le tiroir de la carte (vue du monde). */
  const REGION_PHOTO={eu:'eu',af:'af',na:'na',sa:'sa',as:'as',oc:'oc'};
  function regionsStrip(){
    const panel=$('#spotMapWrap .omap-panel');if(!panel)return;
    const list=$('.omap-list',panel),regions=list&&$$('.omap-regions [data-region]',list);
    let strip=$('.ex-regions',panel);
    if(!regions?.length){strip?.remove();return;}
    const sig=regions.map(r=>r.dataset.region+':'+(r.querySelector('em')?.textContent||'')).join('|');
    if(strip?.dataset.sig===sig)return;
    if(!strip){strip=document.createElement('div');strip.className='ex-regions';strip.setAttribute('role','list');list.before(strip);}
    strip.dataset.sig=sig;
    strip.innerHTML=regions.map(r=>{
      const id=r.dataset.region,photo=typeof WORLD_PHOTOS!=='undefined'&&(WORLD_PHOTOS[REGION_PHOTO[id]]||WORLD_PHOTOS.fr);
      return `<button type="button" role="listitem" data-region="${esc(id)}"><img src="${esc(photo?.src||'')}" alt="" loading="lazy" decoding="async"><b>${esc(r.querySelector('b')?.textContent||'')}</b><small>${esc(r.querySelector('em')?.textContent||'')}</small></button>`;
    }).join('');
  }

  /* Soleil réel et nuages : deux réglages du globe, mémorisés. */
  const GLOBE_KEY='oceanbuddy_globe';
  function globeButtons(){
    const ctrls=$('#spotMapWrap .omap-ctrls');if(!ctrls||$('[data-ex-sun]',ctrls))return;
    const prefs=store.get(GLOBE_KEY,{});
    const sun=document.createElement('button');sun.type='button';sun.dataset.exSun='';
    sun.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
    const cloud=document.createElement('button');cloud.type='button';cloud.dataset.exClouds='';
    cloud.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18.5h10.2a4 4 0 0 0 .6-8 5.6 5.6 0 0 0-10.7-1.4A4.7 4.7 0 0 0 7 18.5z"/></svg>';
    const paint=()=>{
      const p=store.get(GLOBE_KEY,{}),live=p.light==='live',on=p.clouds===true;
      sun.setAttribute('aria-pressed',String(live));sun.setAttribute('aria-label',live?'Jour et nuit en temps réel (activé)':'Afficher le jour et la nuit en temps réel');sun.title=live?'Jour et nuit réels':'Soleil réel';
      cloud.setAttribute('aria-pressed',String(on));cloud.setAttribute('aria-label',on?'Masquer les nuages':'Afficher les nuages');cloud.title=on?'Nuages affichés':'Nuages masqués';
      cloud.classList.toggle('is-off',!on);
    };
    sun.onclick=()=>{const p=store.get(GLOBE_KEY,{});p.light=p.light==='live'?'studio':'live';store.set(GLOBE_KEY,p);window.OceanMap?.globe?.setLighting?.(p.light);paint();
      if(typeof toast==='function')toast(p.light==='live'?'Jour et nuit en temps réel : la Terre telle qu’elle est maintenant.':'Lumière douce : toute la face visible est éclairée.');};
    cloud.onclick=()=>{const p=store.get(GLOBE_KEY,{});p.clouds=p.clouds!==true;store.set(GLOBE_KEY,p);window.OceanMap?.globe?.setClouds?.(p.clouds);paint();};
    /* Surprends-moi : la Terre tourne et t’emmène vers un spot au hasard (en saison de préférence). */
    const dice=document.createElement('button');dice.type='button';dice.dataset.exDice='';
    dice.setAttribute('aria-label','Surprends-moi : un spot au hasard');dice.title='Surprends-moi : un spot au hasard';
    dice.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/></svg>';
    dice.onclick=surprise;
    ctrls.append(sun,cloud,dice);paint();
    void prefs;
  }
  const recent=[];
  function surprise(){
    const g=window.OceanMap?.globe;if(!g||typeof exploreSpots!=='function')return;
    let pool=exploreSpots(currentFilter).filter(s=>COORDS[s.id]&&!recent.includes(s.id));
    const month=new Date().getMonth(),inS=pool.filter(s=>window.OCEAN_SEASONS?.[s.id]?.includes(month));
    if(inS.length>=12)pool=inS;
    if(!pool.length)return;
    const s=pool[Math.floor(Math.random()*pool.length)],c=COORDS[s.id];
    recent.push(s.id);if(recent.length>12)recent.shift();
    if(typeof vibrate==='function')vibrate([8,30,8]);
    const fly=()=>window.OceanMap.globe.flyTo({lat:c.lat,lon:c.lon,widthKm:2600},{duration:2600,done:()=>window.OceanMap.select(s.id)});
    if($('#spotMapWrap')?.classList.contains('is-map')){window.OceanMap.overview();setTimeout(fly,450);}else fly();
    if(typeof toast==='function')toast(`Cap sur ${String(s.name).split(' — ')[0]} !`);
  }
  const mapWrap=$('#spotMapWrap');
  if(mapWrap)new MutationObserver(()=>{buildTop();regionsStrip();globeButtons();}).observe(mapWrap,{childList:true,subtree:true});

  /* ---------- Nouveautés de la version 1.3 (une seule fois) ---------- */
  const NEWS_KEY='oceanbuddy_news_seen';
  /* Nouvelle installation : pas de « nouveautés » (tout est nouveau), seulement pour qui avait déjà l’app. */
  try{if(typeof returning!=='undefined'&&!returning&&store.get(NEWS_KEY,'')!=='1.3')store.set(NEWS_KEY,'1.3');}catch(_){}
  function news(force){
    if(!force&&store.get(NEWS_KEY,'')==='1.3')return;
    if(!$('#onb')?.classList.contains('hide')&&!force)return;
    store.set(NEWS_KEY,'1.3');
    const d=document.createElement('div');d.className='as-news';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Nouveautés d’Ocean Buddy');
    d.innerHTML=`<div class="as-news-card">
      <div class="as-news-hero"><img src="assets/spots/borabora.jpg" alt="" decoding="async"><span>Nouvelle version</span></div>
      <h2>Les plus beaux spots du monde, dans ta poche.</h2>
      <ul>
        <li><b>Une vraie carte du monde</b><span>La planète en images satellite de la NASA, nette jusqu’au zoom, avec tous les continents bien visibles.</span></li>
        <li><b>Une app repensée</b><span>Nouvelle barre d’onglets, Explorer en plein écran, textes plus lisibles.</span></li>
        <li><b>Des envies de départ</b><span>Collections, idées de voyage et spots à découvrir dès l’accueil.</span></li>
        <li><b>De vrais trophées</b><span>Des médailles à collectionner et à partager.</span></li>
      </ul>
      <button type="button" class="as-news-go">Explorer la planète</button>
      <button type="button" class="as-news-later">Plus tard</button>
    </div>`;
    document.body.append(d);requestAnimationFrame(()=>d.classList.add('open'));
    const close=()=>{d.classList.remove('open');setTimeout(()=>d.remove(),300);};
    $('.as-news-later',d).onclick=close;
    $('.as-news-go',d).onclick=()=>{close();go('spots');};
    d.addEventListener('click',e=>{if(e.target===d)close();});
    d.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    setTimeout(()=>$('.as-news-go',d)?.focus(),60);
  }
  /* Barre d’état de l’app iOS : textes clairs sur fond sombre (Terre, photo du spot, première ouverture). */
  let bar='';
  function statusbar(){
    const onb=$('#onb'),onbOn=onb&&!onb.classList.contains('hide')&&onb.style.display!=='none';
    const dark=onbOn||body.classList.contains('explore-immersive')||(body.dataset.screen==='detail'&&!body.classList.contains('is-scrolled'));
    const next=dark?'dark':'light';if(next===bar)return;bar=next;
    window.dispatchEvent(new CustomEvent('ocean:statusbar',{detail:next}));
  }
  new MutationObserver(statusbar).observe(body,{attributes:true,attributeFilter:['class','data-screen']});
  const onbEl=$('#onb');if(onbEl)new MutationObserver(statusbar).observe(onbEl,{attributes:true,attributeFilter:['class','style']});
  /* ---------- Retour (navigateur, Android) : il ferme d’abord la fenêtre ouverte au premier plan ---------- */
  const visible=el=>!!el&&el.isConnected&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  function closeTopOverlay(){
    const newsEl=$('.as-news');if(newsEl){newsEl.querySelector('.as-news-later')?.click();return true;}
    const cele=$('.tb-cele');if(visible(cele)){(cele.querySelector('[data-tb-c=next]')||cele.querySelector('button:last-of-type'))?.click();return true;}
    const sheet=$('.tb-sheet-wrap');if(visible(sheet)){window.OceanBadges?.close?.();return true;}
    const dlg=[...document.querySelectorAll('dialog[open]')].pop();if(dlg){dlg.close();return true;}
    if($('#chatSheet.open')&&typeof closeChat==='function'){closeChat();return true;}
    if($('#quizModal.open')&&typeof closeQuiz==='function'){closeQuiz();return true;}
    if($('#settingsModal.open')&&typeof closeSettings==='function'){closeSettings();return true;}
    if($('#ecoInfo.open')&&typeof closeEcoLog==='function'){closeEcoLog();return true;}
    if(document.documentElement.classList.contains('voyage-open')&&window.OceanVoyage){window.OceanVoyage.close();return true;}
    if(typeof quickGate!=='undefined'&&quickGate){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return true;}
    if(typeof mapFull!=='undefined'&&mapFull&&typeof setMapFull==='function'){setMapFull(false,true);return true;}
    const card=$('#spotMapWrap .omap-card');if(body.dataset.screen==='spots'&&visible(card)&&!card.hidden){card.querySelector('.omap-card-close')?.click();return true;}
    const mw=$('#spotMapWrap.sheet-open');if(body.dataset.screen==='spots'&&mw){mw.querySelector('.omap-sheet-head')?.click();return true;}
    return false;
  }
  /* Le retour du navigateur a déjà reculé dans l’historique : on referme la fenêtre puis on revient en avant,
     sans que la page sous la fenêtre change. */
  let skipPop=false;
  window.addEventListener('popstate',e=>{
    if(skipPop){skipPop=false;e.stopImmediatePropagation();return;}
    if(closeTopOverlay()){e.stopImmediatePropagation();skipPop=true;history.go(1);}
  },true);

  /* ---------- Confirmation dans l’app (au lieu de la fenêtre système « oceanbuddy.localhost ») ---------- */
  function confirmDialog(message,{ok='Confirmer',cancel='Annuler',danger=false}={}){
    return new Promise(resolve=>{
      const d=document.createElement('div');d.className='as-confirm';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');
      d.innerHTML=`<div class="as-confirm-card"><p>${esc(message)}</p><div><button type="button" data-v="0">${esc(cancel)}</button><button type="button" data-v="1" class="${danger?'is-danger':''}">${esc(ok)}</button></div></div>`;
      const prev=document.activeElement;document.body.append(d);requestAnimationFrame(()=>d.classList.add('open'));
      const done=v=>{d.classList.remove('open');setTimeout(()=>d.remove(),220);prev?.focus?.({preventScroll:true});resolve(v);};
      d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)done(b.dataset.v==='1');else if(e.target===d)done(false);});
      d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();done(false);}});
      setTimeout(()=>d.querySelector('[data-v="0"]')?.focus(),40);
    });
  }
  window.OceanConfirm=confirmDialog;

  /* ---------- Chaque onglet garde sa position de défilement ; toucher l’onglet actif remonte en haut ---------- */
  const tabScroll={};
  nav.addEventListener('click',e=>{
    const b=e.target.closest('button[data-s]');if(!b)return;
    const from=body.dataset.screen,to=b.dataset.s;
    if(from===to){wrap.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;}
    if(from&&from!=='detail')tabScroll[from]=wrap.scrollTop;
    const y=tabScroll[to];
    pendingScroll=y>0&&to!=='spots'?{to,y}:null;
    if(pendingScroll)setTimeout(applyScroll,0);
  },true);
  /* La transition d’écran remet le défilement à zéro à la fin : on rétablit la position juste après. */
  let pendingScroll=null;
  function applyScroll(){
    if(!pendingScroll||wrap.classList.contains('transitioning'))return;
    const {to,y}=pendingScroll;pendingScroll=null;
    if(body.dataset.screen===to)requestAnimationFrame(()=>{wrap.scrollTop=y;});
  }
  new MutationObserver(applyScroll).observe(wrap,{attributes:true,attributeFilter:['class']});

  window.OceanShell={news:()=>news(true),immersive,largeTitles,statusbar:()=>{bar='';statusbar();},closeTopOverlay,confirm:confirmDialog};
  statusbar();

  /* Démarrage. */
  immersive();
  if(body.dataset.screen==='spots'&&!spotWorld)toGlobe();
  setTimeout(()=>news(false),1600);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)largeTitles();});
})();
