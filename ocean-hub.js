/* Cockpit d’accueil : ce qui fait revenir — le prochain départ, les spots à
   reprendre, les favoris et la série de la semaine. Tout est calculé à partir
   de l’activité réelle sur cet appareil ; rien n’est affiché pour une
   personne qui n’a encore rien fait, à part la semaine en cours. */
(() => {
  'use strict';
  const KEY='oceanbuddy_recent_v1',MAX=12;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const I={
    arrow:icon('M5 12h14m-6-6 6 6-6 6'),
    flame:icon('M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.2 2.3-5.2 3.6-7.4.5 1.7 1.3 2.8 2.4 3.4.2-2.9 1.6-5.4 3.9-7.4-.2 2.9.7 4.8 2.2 6.6 1.3 1.6 2 3.1 2 4.8 0 3.5-3.4 6.1-7.6 6.1z'),
    heart:icon('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'),
    clock:icon('M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'),
    plane:icon('M3 14l7-2 4-8 2 1-2 7 6 2 1 3-8-1-3 5-2-1 1-5-5 1z'),
    plus:icon('M12 5v14M5 12h14')
  };

  function readRecent(){try{const d=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(d)?d.filter(x=>x&&typeof x.id==='string'):[];}catch(e){return [];}}
  let recent=readRecent();
  function visit(id){
    if(!id)return;
    recent=[{id,ts:Date.now()},...recent.filter(x=>x.id!==id)].slice(0,MAX);
    try{localStorage.setItem(KEY,JSON.stringify(recent));}catch(e){}
  }

  const spot=id=>SPOTS.find(s=>s.id===id);
  const photo=id=>(typeof spotPhotoUrl==='function'&&spotPhotoUrl(id,480))||'assets/photos/hero.jpg';
  const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const hour=()=>new Date().getHours();
  const hello=()=>hour()<5?'Bonne nuit':hour()<12?'Bonjour':hour()<18?'Bel après-midi':'Bonsoir';

  function card(id){
    const s=spot(id);if(!s)return '';
    return `<button class="hub-spot" type="button" data-spot="${esc(id)}"><img src="${esc(photo(id))}" alt="" loading="lazy" decoding="async"><span><b translate="no">${esc(s.name.split(' — ')[0])}</b><small translate="no">${esc(s.loc)}</small></span>${favs.has(id)?`<i class="hub-fav" aria-label="Favori">${I.heart}</i>`:''}</button>`;
  }
  function rail(title,ids,kind){
    const cards=ids.map(card).filter(Boolean);
    if(!cards.length)return '';
    return `<section class="hub-rail" aria-label="${esc(title)}"><div class="hub-rail-head"><h3>${kind==='fav'?I.heart:I.clock}<span>${title}</span></h3>${kind==='fav'?`<button type="button" class="hub-link" data-hub="favs">Tout voir ${I.arrow}</button>`:''}</div><div class="hub-track">${cards.join('')}</div></section>`;
  }

  function tripCard(){
    const list=window.OceanTrips?.list?.()||[];
    const next=TripModel.nextTrip(list,todayKey());
    if(!next){
      return `<button class="hub-trip hub-trip-empty" type="button" data-hub="new-trip"><span class="hub-trip-ic">${I.plane}</span><span><small>TON PROCHAIN DÉPART</small><b>Dessine ton prochain surf trip</b><em>Choisis tes spots, l’ordre, le sac. Poulpy s’occupe du reste.</em></span>${I.arrow}</button>`;
    }
    const t=next.trip,w=next.when,p=TripModel.progress(t);
    const first=t.steps.find(x=>spot(x.spotId));
    const cover=first?photo(first.spotId):((typeof WORLD_PHOTOS!=='undefined'&&WORLD_PHOTOS.as?.src)||'assets/photos/hero.jpg');
    const big=w.state==='upcoming'?`<span class="hub-count"><b>${w.days}</b><small>${w.days>1?'jours avant le départ':'jour avant le départ'}</small></span>`
      :w.state==='ongoing'?`<span class="hub-count"><b>J${w.days}</b><small>tu es en voyage</small></span>`
      :`<span class="hub-count hub-count-soft"><small>Ajoute des dates pour lancer le compte à rebours</small></span>`;
    const stepsTxt=!t.steps.length?'Aucune étape':t.steps.length>1?`${t.steps.length} étapes`:'1 étape';
    const nextAction=!t.steps.length?'Ajoute ta première étape':p.total&&p.done<p.total?'Continuer la préparation':'Revoir mon voyage';
    return `<button class="hub-trip" type="button" data-trip="${esc(t.id)}" style="--hub-cover:url('${esc(cover)}')">
      <span class="hub-trip-top"><small>${w.state==='ongoing'?'EN VOYAGE':'PROCHAIN DÉPART'}</small>${big}</span>
      <span class="hub-trip-body"><b translate="no">${esc(t.name)}</b><em><span>${stepsTxt}</span>${t.destination?`<span translate="no"> · ${esc(t.destination)}</span>`:''}</em>
      ${p.total?`<span class="hub-prep" style="--p:${p.pct}%"><i></i></span><small class="hub-prep-label">Préparation ${p.done}/${p.total}</small>`:''}
      <span class="hub-cta">${nextAction} ${I.arrow}</span></span></button>`;
  }

  function weekStrip(){
    const P=window.OceanProgress;if(!P)return '';
    const days=P.week(),streak=P.streak();
    let labels=['L','M','M','J','V','S','D'];
    try{const f=new Intl.DateTimeFormat(document.documentElement.lang||undefined,{weekday:'narrow'});labels=days.map(d=>f.format(new Date(d.k+'T12:00:00')));}catch(e){}
    const msg=streak>=2?`${streak} jours d’affilée. Reviens demain pour garder ta série.`:'Reviens demain pour lancer ta série.';
    return `<div class="hub-week" aria-label="Ta semaine"><span class="hub-flame${streak>=2?' on':''}">${I.flame}<b>${streak}</b></span><div class="hub-days">${days.map((d,i)=>`<i class="${d.on?'on':''}${d.today?' today':''}${d.future?' future':''}" translate="no">${labels[i]}</i>`).join('')}</div><p>${msg}</p></div>`;
  }

  function levelRing(){
    const P=window.OceanProgress;if(!P||typeof xp!=='number')return '';
    const L=P.level(xp);
    return `<button class="hub-level" type="button" data-hub="profile" style="--p:${L.pct}" aria-label="Niveau ${L.n}, ${esc(L.title)}"><span>${L.n}</span></button>`;
  }

  function render(){
    const host=$('#oceanHub');if(!host)return;
    const recentIds=recent.map(x=>x.id).filter(id=>spot(id)).slice(0,8);
    const favIds=[...favs].filter(id=>spot(id)&&!recentIds.slice(0,3).includes(id)).slice(0,8);
    const returning=recentIds.length||favs.size||(window.OceanTrips?.count?.()||0);
    const name=typeof userName==='string'&&userName&&userName!=='Explorateur'?userName:'';
    const date=new Date().toLocaleDateString(document.documentElement.lang||'fr-FR',{weekday:'long',day:'numeric',month:'long'});
    host.classList.toggle('is-new',!returning);
    host.innerHTML=`<div class="hub-greet"><div><small>${esc(date)}</small><h2><span>${hello()}</span>${name?`<span translate="no">, ${esc(name)}</span>`:''}<span class="hub-dot">.</span></h2></div>${levelRing()}</div>
      ${weekStrip()}
      ${returning?tripCard():''}
      ${rail('Reprendre là où tu t’es arrêté',recentIds,'recent')}
      ${rail('Tes favoris',favIds,'fav')}`;
  }

  function mount(){
    const home=$('#home');if(!home||$('#oceanHub'))return;
    const hub=document.createElement('section');hub.id='oceanHub';hub.className='ocean-hub';hub.setAttribute('aria-label','Ton espace');
    const intro=home.querySelector('.home-intro');if(intro)intro.after(hub);else home.prepend(hub);
    hub.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.spot)openSpot(b.dataset.spot);
      else if(b.dataset.trip)window.OceanTrips?.openTrip(b.dataset.trip);
      else if(b.dataset.hub==='new-trip')go('trips');
      else if(b.dataset.hub==='profile')go('profile');
      else if(b.dataset.hub==='favs'){go('spots');try{openWorld('all');setView('list');if(!favOnly)toggleFavFilter();}catch(err){}}
    });
    render();
  }

  /* Petite fête quand un objectif est atteint ; rien ne bouge si les animations sont réduites. */
  function celebrate(message){
    if(message&&typeof toast==='function')toast(message);
    try{vibrate([18,40,18]);}catch(e){}
    const calm=document.body.classList.contains('reduce-motion')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(calm)return;
    const layer=document.createElement('div');layer.className='hub-confetti';layer.setAttribute('aria-hidden','true');
    const colors=['#dfff89','#fc754f','#2154dc','#ffffff','#7fd3ff'];
    for(let i=0;i<36;i++){const s=document.createElement('i');s.style.cssText=`--x:${(Math.random()*2-1)*46}vw;--y:${-(35+Math.random()*45)}vh;--r:${Math.random()*720-360}deg;--d:${.9+Math.random()*.7}s;background:${colors[i%colors.length]};left:${46+Math.random()*8}%`;layer.appendChild(s);}
    document.body.appendChild(layer);setTimeout(()=>layer.remove(),1900);
  }

  /* Fiche spot : une barre d’action qui apparaît une fois le grand visuel dépassé. */
  function mountSpotBar(){
    const detail=$('#detail'),hero=$('#detailHero'),wrap=$('#screenWrap');if(!detail||!hero||!wrap)return;
    const bar=document.createElement('div');bar.className='spot-bar';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Actions du spot');
    bar.innerHTML=`<span class="spot-bar-name" translate="no"></span><button type="button" class="spot-bar-fav" aria-label="Ajouter aux favoris">${I.heart}</button><button type="button" class="spot-bar-trip">${I.plus}<span>Ajouter à un voyage</span></button>`;
    detail.appendChild(bar);
    const sync=()=>{const on=favs.has(currentSpot);bar.querySelector('.spot-bar-fav').classList.toggle('on',on);bar.querySelector('.spot-bar-fav').setAttribute('aria-pressed',String(on));const s=spot(currentSpot);bar.querySelector('.spot-bar-name').textContent=s?s.name.split(' — ')[0]:'';};
    bar.querySelector('.spot-bar-fav').onclick=e=>{toggleFav(currentSpot,e);sync();};
    bar.querySelector('.spot-bar-trip').onclick=()=>window.OceanTrips?.fromSpot(currentSpot);
    let ticking=false;
    const check=()=>{ticking=false;const visible=document.body.dataset.screen==='detail'&&hero.getBoundingClientRect().bottom<80;if(visible&&!bar.classList.contains('show'))sync();bar.classList.toggle('show',visible);};
    wrap.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(check);}},{passive:true});
    window.addEventListener('ocean:navigate',()=>{bar.classList.remove('show');});
    document.getElementById('dFav')?.addEventListener('click',()=>setTimeout(sync,0));
  }

  window.addEventListener('ocean:navigate',e=>{if(e.detail==='home')render();});
  window.OceanHub={visit,render,celebrate,recent:()=>recent.slice()};
  mount();mountSpotBar();
})();
