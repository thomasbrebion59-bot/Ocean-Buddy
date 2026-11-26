/* Surf trips — a locally saved travel notebook connected to the spot catalogue.
   Interface v2 (20 novembre 2026, maquette orga-docs/interface-v2/maquette-4-voyages.png) : l’écran s’ouvre sur « Mes voyages »,
   une carte légère par voyage (photo de la première étape, nom, dates, étapes, liste « Avant de partir », jours avant le
   départ en grand chiffre), puis « Nouveau voyage » et trois idées en petit. Plus de grande affiche ni de sur-titres en
   capitales. Vie : la barre se remplit à l’arrivée, le nombre de jours monte une fois, les ronds des étapes arrivent l’un
   après l’autre (transform et opacity, rien en mouvement réduit).
   Passe du 23 novembre 2026 : six idées parlantes (trois thèmes appuyés sur les données de l’app, trois destinations) en
   affiches à faire défiler, illustration dédiée sans voyage, cartes et idées qui entrent l’une après l’autre, itinéraire
   des ronds qui se trace, voyage ouvert qui arrive en douceur. */
(() => {
  'use strict';
  const M=TripModel, $=s=>document.querySelector(s), knownIds=()=>SPOTS.map(s=>s.id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(path)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const I={trash:icon('M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7'),plus:icon('M12 5v14M5 12h14'),route:icon('M5 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4m14 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4M5 9v4a4 4 0 0 0 4 4h4m-2-10h4a4 4 0 0 1 4 4v4'),calendar:icon('M5 5h14v16H5zM8 3v4m8-4v4M5 10h14'),bag:icon('M4 8h16v13H4zM8 8V3h8v5'),check:icon('m5 12 4 4 10-10'),close:icon('m6 6 12 12M6 18 18 6'),map:icon('m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16'),pin:icon('M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11zm0-13.300a2.300 2.300 0 1 0 0 4.600 2.300 2.300 0 0 0 0-4.600'),clock:icon('M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17M12 7.500V12l3 2'),list:icon('M9 4h6v3H9zM9 5.500H6.500A1.500 1.500 0 0 0 5 7v12.500A1.500 1.500 0 0 0 6.500 21h11a1.500 1.500 0 0 0 1.500-1.500V7a1.500 1.500 0 0 0-1.500-1.500H15M9 14l2 2 4-4.500')};
  /* Idées : trois thèmes (ceux de la maquette), puis trois destinations. Rien d’inventé : chaque thème s’appuie sur les
     données de l’app, et tests/voyages-v2.test.js le vérifie. « Surf d’hiver » : trois spots de surf, tous en saison de
     novembre à mars (data/seasons.json). « Plongée » et « Eau chaude » : la plus basse et la plus haute des températures de
     mer mensuelles des trois étapes, telles que la fiche les affiche (normales NOAA, assets/data/spot-climate-lite.js).
     months : premier et dernier mois (0 = janvier) ; sea : minimum et maximum, en °C ; sport : la pastille de l’affiche. */
  const ideas=[
    {name:'Surf d’hiver au Maroc',short:'Surf d’hiver',place:'Maroc',destination:'Maroc',sport:'surf',months:[10,2],photo:'mirleft',spots:['anchorpoint','tamraght','mirleft']},
    {name:'Plongée en mer Rouge',short:'Plongée',place:'Mer Rouge',destination:'Égypte',sport:'plongee',sea:[22,29],photo:'dahab',spots:['rasmohammed','dahab','abudabbab']},
    {name:'Eau chaude en Polynésie',short:'Eau chaude',place:'Polynésie',destination:'Polynésie française',sport:'baignade',sea:[26,29],photo:'moorea',spots:['moorea','borabora','maupiti']},
    {name:'La côte basque, au rythme des vagues',short:'Côte basque',place:'France',destination:'France',sport:'surf',photo:'biarritz',spots:['biarritz','anglet','hossegor']},
    {name:'Du soleil et des vagues au Portugal',short:'Côte portugaise',place:'Portugal',destination:'Portugal',sport:'surf',photo:'praia_marinha',spots:['ericeira','supertubos','praia_marinha']},
    {name:'Bali, d’une côte à l’autre',short:'Bali',place:'Indonésie',destination:'Indonésie',sport:'surf',photo:'uluwatu',spots:['uluwatu','padang','keramas']}
  ];
  let trips=[],selected=null,view='itinerary',loadError='',tripMap=null,lastFocus=null,pendingSpot=null;
  try{trips=M.load(localStorage,knownIds())}catch(e){loadError='Ton carnet ne peut pas être chargé. Les données existantes sont conservées. Réessaie après avoir rechargé la page.';}
  const active=()=>trips.filter(t=>!t.archived&&!t.deleted), current=()=>trips.find(t=>t.id===selected&&!t.archived&&!t.deleted);
  const spot=id=>SPOTS.find(s=>s.id===id);
  /* Sport de la liste « Avant de partir » : le sport choisi s’il se pratique sur ce spot, sinon le premier du spot. */
  const sportFor=id=>{const s=id&&spot(id);if(!s||typeof spotSports!=='function')return '';const list=spotSports(s),a=typeof activeSport!=='undefined'?activeSport:null;return list.includes(a)?a:list[0]||'';};
  const nameHtml=n=>window.SpotName?SpotName.html(n):esc(n);
  const photo=id=>spotPhotoUrl(id,1280)||spotIllustration(id);
  const date=v=>v?new Date(v+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Dates à définir';
  /* « du 5 déc. au 12 déc. 2026 » : une phrase entière, traduite d’un bloc (« {0} to {1} »), sans tiret long. */
  const dateShort=v=>new Date(v+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  /* Même mois : « du 5 au 12 déc. 2026 » (le mois n’est écrit qu’une fois). Dans les autres langues, chaque date est écrite en entier
     par la langue choisie (« Dec 5 to Dec 12, 2026 ») : un jour seul, sans mois, y serait faux. */
  const firstDate=t=>{
    if(t.start.slice(0,4)!==t.end.slice(0,4))return date(t.start);
    if((window.OB_I18N?.lang||'fr')==='fr'&&t.start.slice(0,7)===t.end.slice(0,7)&&t.start!==t.end){const d=new Date(t.start+'T12:00:00').getDate();return d===1?'1er':String(d);}
    return dateShort(t.start);
  };
  const range=t=>t.start?(t.end?`du ${firstDate(t)} au ${date(t.end)}`:date(t.start)):(t.end?`Jusqu’au ${date(t.end)}`:'Dates à définir');
  const distanceKm=(a,b)=>{if(!a||!b)return null;const rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad,x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};
  const routeDistance=t=>{let total=0,legs=0,prev=null;t.steps.forEach(s=>{const c=COORDS[s.spotId];if(c&&prev){total+=distanceKm(prev,c);legs++;}prev=c||null;});return legs?total:null;};
  const prettyDistance=n=>n<1?Math.round(n*1000)+' m':n<100?Math.round(n)+' km':Math.round(n/10)*10+' km';
  /* Distances affichées : chaque phrase est un gabarit entier dans son propre élément, avec une classe (.trip-dist).
     Sans classe, le traducteur de page (i18n.js) lit la ligne entière comme une phrase à balises et un gabarit plus court
     s’applique : « 23 km from stop précédente » en anglais. */
  const region=t=>t.steps.length?(SPOT_WORLD[t.steps[0].spotId]||t.steps[0].legacy?.world||'as'):'as';
  /* Sans étape, pas de paysage d'un autre continent : une vue d'océan neutre. */
  const cover=t=>t.steps.length&&spot(t.steps[0].spotId)?photo(t.steps[0].spotId):t.steps.length?WORLD_PHOTOS[region(t)]?.src||'assets/photos/hero.jpg':'assets/photos/hero.jpg';
  function persist(next){
    if(loadError){toast(loadError);return false;}
    try{M.save(localStorage,next);trips=next;renderProfile();return true}catch(e){toast('Enregistrement impossible. Vérifie l’espace disponible ou l’accès au stockage de ton navigateur.');return false;}
  }
  function update(fn,{draw=true}={}){const t=current();if(!t)return false;try{const next=fn(t);if(persist(trips.map(x=>x.id===t.id?next:x))){if(draw)render();return true}}catch(e){toast(e.message)}return false;}
  const badge=t=>{const n=t.steps.length,d=M.duration(t),spots=n>1?`${n} spots`:`${n} spot`;return d?spots+', '+(d>1?`${d} jours`:`${d} jour`):spots;};
  const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const when=t=>{const c=M.countdown(t,todayKey());return c.state==='upcoming'?(c.days===1?'Départ demain':`J-${c.days}`):c.state==='ongoing'?`Jour ${c.days}, en route`:c.state==='past'?'Voyage terminé':'';};
  /* ---------- Interface v2 : carte d’un voyage ---------- */
  const D=v=>new Date(v+'T12:00:00');
  const dayMonth=(v,month='long')=>D(v).toLocaleDateString('fr-FR',{day:'numeric',month});
  /* Dates courtes : « 5 au 7 décembre », « 28 nov. au 3 déc. ». L’année n’apparaît que si le départ n’est pas dans les
     onze mois qui viennent. Hors du français, c’est le format d’intervalle de la langue (Intl) : la chaîne est déjà dans
     la bonne langue, le traducteur de page n’y touche pas (data-no-i18n posé par la carte). */
  function shortRange(t){
    if(!t.start&&!t.end)return '';
    const today=D(todayKey()),ref=D(t.start||t.end),gap=(ref-today)/86400000;
    const year=gap<-1&&ref.getFullYear()!==today.getFullYear()||gap>335?' '+ref.getFullYear():'';
    const one=!t.start||!t.end||t.end===t.start;
    const a=D(t.start||t.end),b=D(t.end||t.start),same=a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
    /* Hors du français : la langue choisie (OB_LOCALE) écrit elle-même la date ou l’intervalle (« Dec 5 – 7 », « 5–7 dic »). */
    if((window.OB_I18N?.lang||'fr')!=='fr'){
      try{const f=new Intl.DateTimeFormat(window.OB_LOCALE||'en',{day:'numeric',month:one||same?'long':'short',...(year?{year:'numeric'}:{})});return one?f.format(a):f.formatRange(a,b);}catch(_){}
    }
    if(one)return dayMonth(t.start||t.end)+year;
    const link=' au ';
    return (same?String(a.getDate()):dayMonth(t.start,'short'))+link+dayMonth(t.end,same?'long':'short')+year;
  }
  /* Le voyage dont les étapes sont dessinées en ronds reliés : le prochain départ s’il a plusieurs étapes, sinon le
     premier voyage qui en a plusieurs (une seule rangée de ronds par écran). */
  function featured(saved){
    const next=M.nextTrip(saved,todayKey())?.trip;
    if(next&&next.steps.length>1)return next.id;
    return saved.find(t=>t.steps.length>1)?.id||null;
  }
  const stepName=s=>{const p=spot(s.spotId);return p?(window.SpotName?SpotName.parts(p.name).main:p.name.split(' — ')[0]):(s.legacy?.name||'Spot indisponible');};
  const round=(s,sizes)=>spot(s.spotId)&&spotPhotoUrl(s.spotId,480)?`<img src="${esc(spotPhotoUrl(s.spotId,480))}"${spotPhotoSrcset(s.spotId)} sizes="${sizes}" alt="" loading="lazy" decoding="async">`:`<span class="tv-ph" aria-hidden="true">${I.pin}</span>`;
  function stepsRow(t){
    const max=4,shown=t.steps.length>max?t.steps.slice(0,max-1):t.steps,more=t.steps.length-shown.length;
    const items=shown.map(s=>`<li class="tv-step">${round(s,'76px')}<b translate="no" data-no-i18n>${esc(stepName(s))}</b></li>`);
    if(more>0)items.push(`<li class="tv-step"><span class="tv-ph tv-more" translate="no">+${more}</span><b>${more>1?`${more} étapes`:`${more} étape`}</b></li>`);
    return `<ol class="tv-steps" aria-label="Étapes">${items.join('<li class="tv-link" aria-hidden="true"></li>')}</ol>`;
  }
  /* Repère d’une idée (« Nov. à mars », « 26 à 29 °C »), écrit ici dans la langue choisie et jamais passé au traducteur de
     page (data-no-i18n) : un gabarit « {0} à {1} » attraperait d’autres phrases. Hors du français, l’intervalle de la langue. */
  function ideaFact(x){
    const fr=(window.OB_I18N?.lang||'fr')==='fr',link=' à ';
    if(x.sea)return fr?x.sea[0]+link+x.sea[1]+' °C':x.sea[0]+'–'+x.sea[1]+' °C';
    if(!x.months)return '';
    const a=new Date(2026,x.months[0],15),b=new Date(x.months[1]<x.months[0]?2027:2026,x.months[1],15);
    let text='';
    try{const f=new Intl.DateTimeFormat(fr?'fr-FR':window.OB_LOCALE||'en',{month:'short'});text=fr?f.format(a)+link+f.format(b):f.formatRange(a,b);}catch(_){return '';}
    return text.charAt(0).toUpperCase()+text.slice(1);
  }
  const sportMark=id=>window.PoulpyIcons?.mono?`<i class="exl-mark" style="--m:url('${esc(PoulpyIcons.mono(id))}')"></i>`:'';
  /* Affiche d’une idée : vraie photo d’une étape, sport en pastille, repère chiffré s’il existe, thème et lieu. */
  function ideaCard(x,i){
    const fact=ideaFact(x);
    return `<button type="button" class="tv-idea" data-action="idea" data-index="${i}"><img src="${esc(spotPhotoUrl(x.photo,480)||photo(x.photo))}"${spotPhotoSrcset(x.photo)} sizes="(max-width:959px) 42vw, 200px" alt="" loading="lazy" decoding="async"><span class="tv-idea-sport" aria-hidden="true">${sportMark(x.sport)}</span>${fact?`<span class="tv-idea-fact" translate="no" data-no-i18n>${esc(fact)}</span>`:''}<span class="tv-idea-tx"><b>${x.short}</b><small>${x.place}</small></span></button>`;
  }
  function tripCard(t,withSteps){
    const c=M.countdown(t,todayKey()),p=M.progress(t),n=t.steps.length,first=t.steps[0],dates=shortRange(t);
    const photoTag=`<img class="tv-photo" src="${esc(cover(t))}"${first&&spot(first.spotId)?spotPhotoSrcset(first.spotId):''} sizes="(max-width:959px) 30vw, 132px" alt="" loading="lazy" decoding="async">`;
    const count=c.state==='upcoming'?`<span class="tv-count"><b class="ui-num" data-tv-num="${c.days}" translate="no">${c.days}</b><span class="ui-unit">${c.days>1?obT('jours'):obT('jour')}</span></span>`
      :c.state==='ongoing'?`<span class="tv-count is-live"><span class="ui-unit">Jour</span><b class="ui-num" data-tv-num="${c.days}" translate="no">${c.days}</b></span>`
      :c.state==='past'?`<span class="tv-count is-done"><span class="ui-unit">Terminé</span></span>`:`<span class="tv-count is-open" aria-hidden="true">${I.calendar}</span>`;
    return `<article class="tv-card" data-action="select" data-id="${esc(t.id)}" data-tv="${esc(t.id)}"><button type="button" class="tv-open">${photoTag}<span class="tv-body"><b class="tv-name">${esc(t.name)}</b>${dates?`<span class="tv-dates" translate="no" data-no-i18n>${esc(dates)}</span>`:'<span class="tv-dates">Dates à définir</span>'}<span class="tv-line">${I.pin}<span>${n>1?`${n} étapes`:n===1?`${n} étape`:'Aucune étape'}</span></span>${p.total?`<span class="tv-line tv-prep" role="img" aria-label="Avant de partir : ${p.done} sur ${p.total}">${I.list}<span class="tv-bar" style="--p:${(p.done/p.total).toFixed(3)};--n:${p.total}"><i></i></span><span class="tv-frac" translate="no" aria-hidden="true">${p.done}/${p.total}</span></span>`:''}</span>${count}</button>${withSteps?stepsRow(t):''}</article>`;
  }
  function render(){
    /* Écran Voyages caché : on ne lit ni n’écrit la position de défilement de #screenWrap (cette lecture juste
       après innerHTML forçait une mise en page complète, 70 à 160 ms au démarrage sous x4-x6). */
    const wrap=$('#screenWrap'),live=$('#trips').classList.contains('active'),scroll=live?wrap.scrollTop:0,focus=document.activeElement?.dataset.focus;
    if(tripMap){tripMap.destroy();tripMap=null;}
    const t=current(),saved=active();
    $('#trips').classList.toggle('has-trip',!!t);$('#trips').classList.toggle('has-saved',saved.length>0);
    /* Voyage ouvert : la rangée des voyages (pour passer de l’un à l’autre) et « Nouveau voyage ». Liste : les cartes suffisent. */
    $('#tripContent').innerHTML=`${t?'':'<h1 class="tv-h1">Voyages</h1>'}${loadError?`<p class="trip-error" role="alert">${loadError}</p>`:''}
      ${t&&saved.length?`<div class="trip-switch"><button data-action="overview">Mes voyages <b>${saved.length}</b></button>${saved.map(x=>`<button class="${x.id===selected?'active':''}" data-action="select" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}<button class="trip-switch-new" data-action="new">${I.plus}<span>Nouveau voyage</span></button></div>`:''}
      ${t?tripDetail(t):overview(saved)}
      <p class="trip-storage">${loadError?'':I.check+' Ton carnet est enregistré sur cet appareil.'} <a href="photos.html" target="_blank" rel="noopener">Crédits photos</a></p>`;
    if(live)wrap.scrollTop=scroll;
    if(focus)document.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});
    if(t&&view==='map')requestAnimationFrame(()=>drawMap(t));
    if(t)window.OceanSpotGuide?.fillTrip(t);
    if(t)arriveTrip();else enliven();
  }
  /* Vie de « Mes voyages », à l’arrivée sur l’écran seulement (pas à chaque nouveau rendu) : les cartes puis les idées
     entrent l’une après l’autre, la barre « Avant de partir » se remplit, l’itinéraire des ronds se trace d’étape en
     étape ; le nombre de jours ne monte qu’une fois par voyage. transform et opacity seulement, aucune boucle. */
  let arriving=true;const counted=new Set();
  const still=()=>document.body.classList.contains('reduce-motion')||!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)||typeof Element.prototype.animate!=='function';
  const rise=(el,delay,dy=14,duration=420)=>el.animate([{opacity:0,transform:`translate3d(0,${dy}px,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration,delay,easing:window.OceanMotion?.easeOut||'cubic-bezier(.22,.8,.3,1)',fill:'backwards'});
  function enliven(){
    const fresh=arriving;arriving=false;
    const cards=[...document.querySelectorAll('#tripContent [data-tv],#tripContent .tv-empty')];
    if(!fresh||still()||document.body.dataset.screen!=='trips')return;
    const ease=window.OceanMotion?.easeOut||'cubic-bezier(.22,.8,.3,1)';
    cards.forEach((card,k)=>{
      rise(card,40+k*60);
      const art=card.querySelector('.tv-empty-art>img');
      if(art)art.animate([{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:900,delay:40,easing:ease,fill:'backwards'});
      const fill=card.querySelector('.tv-bar>i'),p=parseFloat(card.querySelector('.tv-bar')?.style.getPropertyValue('--p'))||0;
      if(fill&&p>0)fill.animate([{transform:'scaleX(0)'},{transform:`scaleX(${p})`}],{duration:700,delay:220+k*90,easing:ease,fill:'backwards'});
      card.querySelectorAll('.tv-steps>li').forEach((li,i)=>li.animate(li.classList.contains('tv-link')?[{opacity:0,transform:'scaleX(0)'},{opacity:1,transform:'scaleX(1)'}]:[{opacity:0,transform:'scale(.82)'},{opacity:1,transform:'scale(1)'}],{duration:340,delay:320+i*70,easing:ease,fill:'backwards'}));
      const num=card.querySelector('[data-tv-num]'),to=num?+num.dataset.tvNum:0;
      if(num&&to>1&&!counted.has(card.dataset.tv)){
        const t0=performance.now()+180+k*90,span=Math.min(900,420+to*6);
        num.textContent='0';
        const step=now=>{if(!num.isConnected)return;const x=Math.min(1,Math.max(0,(now-t0)/span)),e=1-Math.pow(1-x,3);num.textContent=String(Math.round(to*e));if(x<1)requestAnimationFrame(step);};
        requestAnimationFrame(step);
      }
      counted.add(card.dataset.tv);
    });
    const after=40+cards.length*60;
    document.querySelectorAll('#tripContent .tv>.tv-new,#tripContent .tv-ideas-head').forEach((el,i)=>rise(el,after+i*50,10,360));
    document.querySelectorAll('#tripContent .tv-idea').forEach((el,i)=>rise(el,after+90+i*45,12,400));
  }
  /* Voyage ouvert : à l’ouverture seulement (pas à chaque case cochée ou étape déplacée), la bannière puis les premières
     étapes arrivent en douceur. */
  let opening=false; /* posé juste avant le rendu qui reste à l’écran (go('trips') rend déjà une fois l’écran) */
  function arriveTrip(){
    const fresh=opening;opening=false;
    if(!fresh||still()||document.body.dataset.screen!=='trips')return;
    document.querySelectorAll('#tripContent .trip-banner>div>*,#tripContent .trip-banner>.trip-glass').forEach((el,i)=>rise(el,60+i*55,10,380));
    [...document.querySelectorAll('#tripContent .trip-step')].slice(0,4).forEach((el,i)=>rise(el,220+i*70,16,440));
  }
  function storedTrips(title,list,trash=false){
    if(!list.length)return '';
    return `<details class="trip-archives ${trash?'trip-trash':''}"><summary>${title} (${list.length})</summary>${trash?'<p class="trip-trash-note">Les voyages supprimés restent récupérables sur cet appareil.</p>':''}${list.map(t=>`<div class="trip-stored-row"><span class="trip-stored-info"><b>${esc(t.name)}</b><small>${esc(range(t))}, ${badge(t)}${trash&&t.archived?', archivé':''}</small></span><span class="trip-stored-actions"><button data-action="${trash?'recover':'restore'}" data-id="${esc(t.id)}" aria-label="Restaurer ${esc(t.name)}">Restaurer</button>${trash?'':`<button class="trip-delete-action" data-action="delete" data-id="${esc(t.id)}" aria-label="Supprimer ${esc(t.name)}">${I.trash}<span>Supprimer</span></button>`}</span></div>`).join('')}</details>`;
  }
  function overview(saved){
    const archived=trips.filter(t=>t.archived&&!t.deleted),deleted=trips.filter(t=>t.deleted),star=featured(saved);
    /* Sans voyage : une carte qui invite, « Nouveau voyage » en premier. Illustration dédiée (Poulpy devant sa carte
       d’étapes, au style des illustrations de la fiche) ; dessous, des étapes à remplir, dessinées comme celles d’un vrai voyage. */
    const empty=`<div class="tv-empty"><span class="tv-empty-art"><img src="assets/ui/voyage-vide.webp" srcset="assets/ui/voyage-vide-960.webp 960w, assets/ui/voyage-vide.webp 1536w" sizes="(max-width:959px) 92vw, 640px" alt="" width="1536" height="864" decoding="async"></span><ol class="tv-steps" aria-hidden="true"><li class="tv-step"><span class="tv-ph">${I.pin}</span></li><li class="tv-link"></li><li class="tv-step"><span class="tv-ph">${I.pin}</span></li><li class="tv-link"></li><li class="tv-step"><span class="tv-ph">${I.pin}</span></li></ol><p class="ui-title">Pas encore de voyage</p><button type="button" class="ui-btn tv-new" data-action="new">${I.plus}<span>Nouveau voyage</span></button></div>`;
    return `<section class="tv"><div class="ui-head"><h2 class="ui-title">Mes voyages</h2></div>
      ${saved.length?`<div class="tv-list">${saved.map(t=>tripCard(t,t.id===star)).join('')}</div><button type="button" class="ui-btn tv-new" data-action="new">${I.plus}<span>Nouveau voyage</span></button>`:empty}
      <div class="ui-head tv-ideas-head"><h2 class="ui-title">Idées</h2></div>
      <div class="tv-ideas">${ideas.map(ideaCard).join('')}</div>
      ${storedTrips('Voyages archivés',archived)}${storedTrips('Corbeille',deleted,true)}</section>`;
  }
  function tripDetail(t){
    const done=t.checklist.filter(c=>c.done).length;
    /* Bannière : dates courtes (comme sur la carte du voyage), étapes et durée, chacune avec son pictogramme. */
    const n=t.steps.length,days=M.duration(t),dates=shortRange(t);
    const meta=`<p class="tv-meta"><span>${I.calendar}${dates?`<span translate="no" data-no-i18n>${esc(dates)}</span>`:'<span>Dates à définir</span>'}</span><span>${I.pin}<span>${n>1?`${n} étapes`:n===1?`${n} étape`:'Aucune étape'}</span></span>${days?`<span>${I.clock}<span>${days>1?`${days} jours`:`${days} jour`}</span></span>`:''}</p>`;
    const distance=routeDistance(t),hasArchived=t.steps.some(s=>!spot(s.spotId));
    return `<div class="trip-banner" style="--trip-cover:url('${esc(cover(t))}')"><div>${t.destination?`<span class="trip-pill">${esc(t.destination)}</span>`:''}${when(t)?`<span class="trip-when">${when(t)}</span>`:''}<h2>${esc(t.name)}</h2>${meta}</div><button class="trip-glass" data-action="edit">Modifier le voyage</button></div>
      <div class="trip-layout"><div class="trip-main"><div class="trip-toolbar"><div class="trip-view"><button data-action="view" data-view="itinerary" class="${view==='itinerary'?'active':''}">${I.route} Itinéraire</button><button data-action="view" data-view="map" class="${view==='map'?'active':''}">${I.map} Carte</button></div><span class="trip-route-distance">${distance!==null?I.route+(hasArchived?`<span class="trip-dist">${prettyDistance(distance)} entre les étapes connues</span>`:`<span class="trip-dist">${prettyDistance(distance)} entre les spots</span>`):'Ajoute 2 spots consécutifs pour mesurer le trajet'}</span><button class="trip-primary" data-action="add">${I.plus} Ajouter un spot</button></div>
      ${view==='map'?`<div id="tripMap" class="trip-map" aria-label="Carte des étapes"></div><p class="trip-map-note">La ligne relie les étapes consécutives dans l’ordre prévu. Elle ne représente pas un trajet routier.${hasArchived?' Les étapes archivées ne figurent pas sur la carte.':''}</p>`:`<div class="trip-steps">${t.steps.length?t.steps.map((s,i)=>stepCard(t,s,i)).join(''):`<div class="trip-no-steps">${I.route}<button class="trip-primary" data-action="add">Choisir mon premier spot</button></div>`}</div>`}
      <div class="trip-notes-panel"><h3>Le carnet de bord</h3><label for="tripNotes">Idées, bonnes adresses, envies à garder…</label><textarea id="tripNotes" data-field="notes" data-focus="notes" rows="3" maxlength="2000" placeholder="Un coucher de soleil à ne pas manquer, une adresse conseillée…">${esc(t.notes)}</textarea><div class="trip-footer-actions"><button data-action="export">Exporter mon carnet (.json)</button><button data-action="archive" class="trip-muted-button">Archiver ce voyage</button><button data-action="delete" data-id="${esc(t.id)}" class="trip-delete-action">${I.trash} Supprimer ce voyage</button></div></div></div>
      <aside class="trip-preparation"><div class="trip-check-panel"><div class="trip-panel-title">${I.bag}<h3>Prêt à partir ?</h3><span>${done}/${t.checklist.length}</span></div><div class="trip-progress"><i style="width:${t.checklist.length?done/t.checklist.length*100:0}%"></i></div><div class="trip-checklist">${t.checklist.map(c=>`<label class="${c.done?'done':''}"><input type="checkbox" data-check="${esc(c.id)}" data-focus="check-${esc(c.id)}" ${c.done?'checked':''}><span>${esc(c.label)}</span></label>`).join('')}</div><form id="tripCheckForm"><label class="sr-only" for="newCheck">Ajouter une tâche</label><input id="newCheck" maxlength="160" placeholder="Ajouter une tâche…" required><button aria-label="Ajouter la tâche">${I.plus}</button></form></div>
      <div class="trip-lodging-panel" id="tripLodging" hidden></div>
      <div class="trip-logistics"><h3>Les détails qui comptent</h3><label for="tripStay">Hébergement</label><input id="tripStay" data-field="accommodation" data-focus="stay" maxlength="2000" value="${esc(t.accommodation)}" placeholder="Adresse, réservation, contact…"><label for="tripTransport">Transport</label><input id="tripTransport" data-field="transport" data-focus="transport" maxlength="2000" value="${esc(t.transport)}" placeholder="Vol, train, voiture, bateau…"><label for="tripBudget">Budget prévu (€)</label><input id="tripBudget" data-field="budget" data-focus="budget" inputmode="decimal" value="${esc(t.budget)}" placeholder="Ton enveloppe pour le voyage"></div>
      <div class="trip-tip"><img src="assets/poulpy/scenes/travel-v2.webp" alt="" loading="lazy" decoding="async"><p><b>Le conseil de Poulpy</b>Garde de la souplesse dans ton itinéraire. Avant chaque session, ouvre la fiche du spot pour vérifier les conditions et les points de vigilance.</p></div></aside></div>`;
  }
  function stepLogistics(s){
    const stepId=esc(s.id);
    return `<details class="trip-step-logistics" ${s.budget||s.accommodation||s.transport?'open':''}><summary>Budget, hébergement et transport de l’étape <small>privés</small></summary><div class="trip-step-logistics-fields"><label>Budget prévu (€)<input type="text" inputmode="decimal" maxlength="40" data-step-id="${stepId}" data-step-field="budget" data-focus="budget-${stepId}" value="${esc(s.budget||'')}" placeholder="0,00"></label><label>Hébergement<input type="text" maxlength="1000" data-step-id="${stepId}" data-step-field="accommodation" data-focus="accommodation-${stepId}" value="${esc(s.accommodation||'')}" placeholder="Adresse, réservation…"></label><label>Transport<input type="text" maxlength="1000" data-step-id="${stepId}" data-step-field="transport" data-focus="transport-${stepId}" value="${esc(s.transport||'')}" placeholder="Train, voiture, bateau…"></label></div></details>`;
  }
  function stepCard(t,s,i){
    const p=spot(s.spotId);
    if(!p){const name=s.legacy?.name||'Spot indisponible',loc=s.legacy?.loc||'Ancienne étape enregistrée';
      return `<article class="trip-step trip-step-archived"><div class="trip-step-number">${String(i+1).padStart(2,'0')}</div><div class="trip-step-photo" aria-hidden="true">${I.map}</div><div class="trip-step-info"><small>${esc(loc)}, hors du catalogue actuel</small><h3>${esc(name)}</h3><span class="trip-level">Cette étape et tes notes sont conservées.</span><div class="trip-step-fields"><label>Date de l’étape<input type="date" aria-label="Date : ${esc(name)}" data-step-date="${esc(s.id)}" data-focus="date-${esc(s.id)}" value="${esc(s.date)}" ${t.start?`min="${t.start}"`:''} ${t.end?`max="${t.end}"`:''}></label><label>À prévoir<input type="text" aria-label="Notes : ${esc(name)}" maxlength="1000" data-step-notes="${esc(s.id)}" data-focus="step-${esc(s.id)}" value="${esc(s.notes)}"></label></div>${stepLogistics(s)}<button class="trip-primary" data-action="replace" data-id="${esc(s.id)}">Choisir un spot du catalogue pour cette étape</button></div><div class="trip-step-controls"><button data-action="up" data-id="${esc(s.id)}" ${i===0?'disabled':''} aria-label="Monter ${esc(name)}">↑</button><button data-action="down" data-id="${esc(s.id)}" ${i===t.steps.length-1?'disabled':''} aria-label="Descendre ${esc(name)}">↓</button><button data-action="remove" data-id="${esc(s.id)}" aria-label="Retirer ${esc(name)}">${I.close}</button></div></article>`;
    }
    const prev=i>0?spot(t.steps[i-1].spotId):null,leg=prev?distanceKm(COORDS[prev.id],COORDS[p.id]):null;
    return `<article class="trip-step"><div class="trip-step-number">${String(i+1).padStart(2,'0')}</div><div class="trip-step-photo"><img src="${esc(photo(p.id))}" alt="" loading="lazy"><button data-action="spot" data-spot="${p.id}">Voir le spot</button></div><div class="trip-step-info"><small>${esc(p.loc)}${leg!==null?', '+`<span class="trip-dist">${prettyDistance(leg)} depuis l’étape précédente</span>`:''}</small><h3>${esc(p.name.split(' — ')[0])}</h3><span class="trip-level">${levelIcon(p.level)}${esc(lvlLabel[p.level])}, ${spotSports(p).slice(0,3).map(id=>esc(SPORTMAP[id].label)).join(', ')}</span><div class="trip-step-lodging" data-lodging-step="${esc(s.id)}"></div><div class="trip-step-fields"><label>Date de l’étape<input type="date" aria-label="Date : ${esc(p.name)}" data-step-date="${esc(s.id)}" data-focus="date-${esc(s.id)}" value="${esc(s.date)}" ${t.start?`min="${t.start}"`:''} ${t.end?`max="${t.end}"`:''}></label><label>À prévoir<input type="text" aria-label="Notes : ${esc(p.name)}" maxlength="1000" data-step-notes="${esc(s.id)}" data-focus="step-${esc(s.id)}" value="${esc(s.notes)}" placeholder="Session, accès, matériel…"></label></div>${stepLogistics(s)}</div><div class="trip-step-controls"><button data-action="up" data-id="${esc(s.id)}" ${i===0?'disabled':''} aria-label="Monter ${esc(p.name)}">↑</button><button data-action="down" data-id="${esc(s.id)}" ${i===t.steps.length-1?'disabled':''} aria-label="Descendre ${esc(p.name)}">↓</button><button data-action="remove" data-id="${esc(s.id)}" aria-label="Retirer ${esc(p.name)}">${I.close}</button></div></article>`;
  }
  const modal=document.createElement('dialog');modal.id='tripDialog';modal.className='trip-dialog';document.body.append(modal);
  function openDialog(html,initialFocus=null){lastFocus=document.activeElement;modal.innerHTML=`<img class="trip-dialog-poulpy" src="assets/poulpy/scenes/travel-v2.webp" alt="" width="640" height="640" loading="lazy" decoding="async"><button class="trip-dialog-close" data-close aria-label="Fermer">${I.close}</button>${html}`;const heading=modal.querySelector('h2');if(heading){heading.id='tripDialogTitle';modal.setAttribute('aria-labelledby',heading.id);}modal.showModal();modal.querySelector(initialFocus||'input,select,button:not([data-close])')?.focus();}
  function closeDialog(){modal.close();lastFocus?.isConnected&&lastFocus.focus();}
  modal.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target===modal)closeDialog()});
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDialog();}});
  modal.addEventListener('cancel',()=>{lastFocus?.isConnected&&lastFocus.focus()});
  function confirmDelete(id){
    const t=trips.find(t=>t.id===id&&!t.deleted);if(!t)return;
    openDialog(`<h2>Supprimer ce voyage ?</h2><div class="trip-delete-summary"><b>${esc(t.name)}</b><span>${esc(range(t))}, ${badge(t)}</span></div><p>Ce voyage sera retiré de ta liste. Ses étapes, notes et préparatifs resteront récupérables dans la <b>corbeille</b> sur cet appareil.</p><p class="trip-form-error" role="alert"></p><div class="trip-confirm-actions"><button id="tripDeleteCancel" data-close>Annuler</button><button id="tripDeleteConfirm" class="trip-delete-confirm">${I.trash} Supprimer le voyage</button></div>`,'#tripDeleteCancel');
    $('#tripDeleteConfirm').onclick=()=>{
      try{
        const next=M.removeTrip(trips,id);
        if(!persist(next)){modal.querySelector('.trip-form-error').textContent='La suppression n’a pas été enregistrée. Ton voyage est conservé. Réessaie après avoir vérifié le stockage du navigateur.';return;}
        selected=null;view='itinerary';closeDialog();render();
        $('#screenWrap').scrollTop=0;$('#tripContent [data-action="overview"],#tripContent [data-action="new"]')?.focus({preventScroll:true});
        toast('Voyage supprimé. Tu peux le restaurer depuis la corbeille.');
      }catch(error){modal.querySelector('.trip-form-error').textContent=error.message;}
    };
  }
  function editor(existing=null,idea=null,spotId=null){
    /* Une idée propose son nom et sa destination dans la langue de l’app (la valeur d’un champ n’est pas traduite par la page). */
    const said=v=>(v&&typeof obT==='function'?obT(v):v)||'';
    const fields=existing||{name:said(idea?.name),destination:said(idea?.destination)||(spotId?spot(spotId)?.loc:'')||'',start:'',end:''};
    openDialog(`<h2>${existing?'Les détails du voyage':'Nouveau voyage'}</h2><form id="tripEditForm"><label for="tripNameInput">Nom du voyage</label><input id="tripNameInput" name="name" value="${esc(fields.name)}" maxlength="70" placeholder="Mon été sur la côte basque" required><label for="tripDestinationInput">Destination</label><input id="tripDestinationInput" name="destination" value="${esc(fields.destination)}" maxlength="100" placeholder="Une région, un pays, un horizon…"><div class="trip-date-fields"><label>Départ<input name="start" type="date" value="${esc(fields.start)}"></label><label>Retour<input name="end" type="date" value="${esc(fields.end)}"></label></div><p class="trip-form-error" role="alert"></p><button class="trip-primary" type="submit">${existing?'Enregistrer les modifications':'Créer mon voyage'}</button></form>`);
    $('#tripEditForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{
      let next=existing?M.edit(existing,f):M.create(f,spotId?[spotId]:(idea?.spots||[]),{sport:sportFor(spotId||idea?.spots?.[0])});
      window.OceanNavigation?.begin();
      if(persist(existing?trips.map(t=>t.id===existing.id?next:t):[...trips,next])){selected=next.id;view='itinerary';closeDialog();go('trips');opening=!existing;render();$('#screenWrap').scrollTop=0;toast(existing?'Voyage mis à jour':'Ton voyage est créé. À toi de choisir la suite !');}
    }catch(err){modal.querySelector('.trip-form-error').textContent=err.message}};
  }
  function picker(replacingStepId=null){
    openDialog(`<h2>${replacingStepId?'Quel spot du catalogue choisir ?':'Le prochain spot ?'}</h2>${replacingStepId?'<p>La date et les notes de cette étape seront conservées.</p>':''}<label class="sr-only" for="tripSpotSearch">Rechercher dans les spots</label><input id="tripSpotSearch" type="search" placeholder="Nom du spot, pays, région…" autocomplete="off"><div class="trip-picker-filters"><label for="tripRegion">Continent</label><select id="tripRegion"><option value="all">Tous les continents</option>${WORLDS.map(w=>`<option value="${w.id}">${w.lab}</option>`).join('')}</select><label for="tripCountry">Pays</label><select id="tripCountry" disabled><option value="all">Tous les pays</option></select><label class="trip-only-favs"><input id="tripOnlyFavs" type="checkbox"> Mes favoris</label></div><div id="tripSpotResults" class="trip-spot-results"></div>`);
    const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    function refreshCountries(){const r=$('#tripRegion').value,c=$('#tripCountry');if(!c)return;const names=[...new Set(SPOTS.filter(s=>r==='all'||SPOT_WORLD[s.id]===r).map(countryOf))].sort((a,b)=>a.localeCompare(b,'fr'));c.innerHTML='<option value="all">Tous les pays</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');c.disabled=r==='all';}
    function results(){const q=normal($('#tripSpotSearch').value),r=$('#tripRegion').value,c=$('#tripCountry').value,list=SPOTS.filter(s=>normal(s.name+' '+s.loc+' '+countryOf(s)).includes(q)&&(r==='all'||SPOT_WORLD[s.id]===r)&&(c==='all'||countryOf(s)===c)&&(!$('#tripOnlyFavs').checked||favs.has(s.id)));
      $('#tripSpotResults').innerHTML=`<p class="trip-result-count">${list.length>1?`${list.length} spots`:`${list.length} spot`}${list.length>30?', 30 premiers résultats':''}</p>${list.slice(0,30).map(s=>`<button data-pick="${s.id}"><img src="${esc(photo(s.id))}" alt="" loading="lazy"><span><b>${nameHtml(s.name)}</b><small>${esc(s.loc)}, ${esc(lvlLabel[s.level])}</small>${current()?.steps.some(x=>x.spotId===s.id)?'<em>Déjà prévu, tu peux ajouter une autre session</em>':''}</span>${I.plus}</button>`).join('')}${!list.length?'<p>Aucun spot trouvé. Essaie un autre lieu ou enlève un filtre.</p>':''}`;
    }
    $('#tripSpotSearch').oninput=results;$('#tripRegion').onchange=()=>{refreshCountries();results()};$('#tripCountry').onchange=results;$('#tripOnlyFavs').onchange=results;refreshCountries();
    $('#tripSpotResults').onclick=e=>{const b=e.target.closest('[data-pick]');if(!b)return;if(update(t=>replacingStepId?M.replaceStep(t,replacingStepId,b.dataset.pick,knownIds()):M.addStep(t,b.dataset.pick,knownIds()))){closeDialog();toast(replacingStepId?'Étape remplacée, notes conservées':'Spot ajouté à ton itinéraire');}};results();
  }
  function fromSpot(spotId){
    if(!spot(spotId))return;
    pendingSpot=spotId;
    const saved=active();
    if(!saved.length){editor(null,null,spotId);return;}
    openDialog(`<h2>Dans quel voyage ?</h2><p>${nameHtml(spot(spotId).name)}</p><div class="trip-select-list">${saved.map(t=>`<button data-add-to="${esc(t.id)}"><span><b>${esc(t.name)}</b><small>${esc(range(t))}</small></span>${I.plus}</button>`).join('')}</div><button class="trip-primary" id="tripNewFromSpot">Créer un nouveau voyage ${I.plus}</button>`);
    modal.querySelectorAll('[data-add-to]').forEach(b=>b.onclick=()=>{const t=trips.find(t=>t.id===b.dataset.addTo);if(persist(trips.map(x=>x.id===t.id?M.addStep(t,spotId,knownIds()):x))){selected=t.id;closeDialog();toast('Ajouté à « '+t.name+' »');}});
    $('#tripNewFromSpot').onclick=()=>{closeDialog();editor(null,null,spotId)};
  }
  function drawMap(t){
    const host=$('#tripMap');if(!host)return;
    const coords=t.steps.map((s,i)=>({s,i,c:COORDS[s.spotId]})).filter(x=>x.c);
    if(!coords.length){host.innerHTML='<p class="trip-map-empty">Ajoute un spot pour voir ton voyage sur la carte.</p>';return;}
    if(!window.OceanMap?.mini){host.innerHTML='<p class="trip-map-empty">La carte est indisponible. Ton itinéraire reste disponible dans l’onglet voisin.</p>';return;}
    const steps=coords.map(({s,i,c},j)=>{const prev=j>0&&coords[j-1].i===i-1?coords[j-1].c:null,leg=prev?distanceKm(prev,c):null;return {id:s.spotId,i,kicker:`Étape ${i+1}`,leg:leg!==null?prettyDistance(leg):'',lines:[s.date?date(s.date):'Date à définir',...(leg!==null?[`${prettyDistance(leg)} depuis l’étape ${i}`]:[])]};});
    tripMap=window.OceanMap.mini(host,{steps,others:false,cooperative:false,maxZoom:11,zoom:10,label:'Carte des étapes du voyage'});
  }
  $('#tripContent').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='new')editor();
    if(a==='delete')confirmDelete(id);
    if(a==='edit')editor(current());
    if(a==='idea')editor(null,ideas[+b.dataset.index]);
    if(a==='overview'){window.OceanNavigation?.begin();selected=null;render();$('#screenWrap').scrollTop=0;}
    if(a==='select'){window.OceanNavigation?.begin();selected=id;view='itinerary';opening=true;render();$('#screenWrap').scrollTop=0;}
    if(a==='add')picker();
    if(a==='replace')picker(id);
    if(a==='view'){view=b.dataset.view;render()}
    if(a==='spot')openSpot(b.dataset.spot);
    if(a==='up'||a==='down')update(t=>M.moveStep(t,id,a==='up'?-1:1));
    if(a==='remove'){const t=current(),removed=t.steps.find(s=>s.id===id),position=t.steps.findIndex(s=>s.id===id);if(update(t=>({...t,steps:t.steps.filter(s=>s.id!==id)}))){toast('Étape retirée');showUndo(()=>update(t=>{const steps=t.steps.slice();steps.splice(Math.min(position,steps.length),0,removed);return {...t,steps}}));}}
    if(a==='archive'){const t=current();if(persist(trips.map(x=>x.id===t.id?{...x,archived:true}:x))){selected=null;render();toast('Voyage archivé. Retrouve-le dans la rubrique « Voyages archivés ».');}}
    if(a==='restore'){if(persist(trips.map(t=>t.id===id&&!t.deleted?{...t,archived:false}:t))){selected=id;view='itinerary';render();$('#screenWrap').scrollTop=0;toast('Voyage restauré');}}
    if(a==='recover'){
      try{const t=trips.find(t=>t.id===id&&t.deleted);if(!t)return;
        if(persist(M.restoreTrip(trips,id))){selected=t.archived?null:id;view='itinerary';render();
          const archives=$('.trip-archives:not(.trip-trash)');
          if(t.archived&&archives){archives.open=true;archives.querySelector('summary').focus();}else{$('#screenWrap').scrollTop=0;}
          toast(t.archived?'Voyage rétabli dans les archives.':'Voyage restauré avec ses étapes et ses notes.');
        }
      }catch(error){toast(error.message)}
    }
    if(a==='export'&&window.OceanMobile?.native){const t=current();window.OceanMobile.shareJSON(t.name,{application:'Ocean Buddy',version:1,trip:t}).catch(()=>toast('Le partage est indisponible. Ton voyage reste enregistré.'));return;}
    if(a==='export'){const t=current(),blob=new Blob([JSON.stringify({application:'Ocean Buddy',version:1,trip:t},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(t.name.replace(/[^a-zA-Z0-9À-ÿ -]/g,'').slice(0,60)||'surf-trip')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  });
  function showUndo(fn){const b=document.createElement('button');b.className='trip-undo';b.textContent='Annuler le retrait';b.onclick=()=>{fn();b.remove()};$('#tripContent').append(b);setTimeout(()=>b.remove(),12000);}
  // Save text as it is entered, including before a navigation replaces the form.
  $('#tripContent').addEventListener('input',e=>{
    const el=e.target,t=current();if(!t)return;
    if(el.dataset.field){
      if(el.dataset.field==='budget'&&el.value&&!/^\d+(?:[.,]\d{1,2})?$/.test(el.value))return;
      update(t=>M.edit(t,{[el.dataset.field]:el.value}),{draw:false});
    }
    if(el.dataset.stepNotes){const s=t.steps.find(s=>s.id===el.dataset.stepNotes);update(t=>M.editStep(t,s.id,{date:s.date,notes:el.value}),{draw:false});}
    if(el.dataset.stepField){
      if(el.dataset.stepField==='budget'&&el.value&&!/^\d+(?:[.,]\d{1,2})?$/.test(el.value))return;
      update(t=>M.editStep(t,el.dataset.stepId,{[el.dataset.stepField]:el.value}),{draw:false});
    }
  });
  $('#tripContent').addEventListener('change',e=>{const el=e.target,t=current();if(!t)return;
    if(el.dataset.check){const was=M.progress(current()||{checklist:[]});if(update(t=>({...t,checklist:t.checklist.map(c=>c.id===el.dataset.check?{...c,done:el.checked}:c)}))){const now=M.progress(current());if(el.checked)vibrate(12);if(now.total&&now.done===now.total&&was.done<was.total)window.OceanHub?.celebrate('Sac bouclé ! Tout est prêt pour le départ.');}}
    if(el.dataset.field){const key=el.dataset.field;if(!update(t=>M.edit(t,{[key]:el.value}),{draw:false}))el.value=t[key];}
    const id=el.dataset.stepDate||el.dataset.stepNotes;if(id){const s=t.steps.find(s=>s.id===id),fields={date:el.dataset.stepDate?el.value:s.date,notes:el.dataset.stepNotes?el.value:s.notes};if(!update(t=>M.editStep(t,id,fields),{draw:false}))el.value=el.dataset.stepDate?s.date:s.notes;}
    if(el.dataset.stepField){const s=t.steps.find(s=>s.id===el.dataset.stepId),key=el.dataset.stepField;if(!s||!update(t=>M.editStep(t,s.id,{[key]:el.value}),{draw:false}))el.value=s?.[key]||'';}
  });
  $('#tripContent').addEventListener('submit',e=>{if(e.target.id==='tripCheckForm'){e.preventDefault();const label=$('#newCheck').value.trim();if(label)update(t=>({...t,checklist:[...t.checklist,{id:M.uid(),label,done:false}]}));}});
  let lastScreen=document.body.dataset.screen||'home';
  window.addEventListener('ocean:navigate',e=>{const from=lastScreen;lastScreen=e.detail;if(e.detail==='trips'){if(from!=='trips')arriving=true;render();}});
  /* Fiche spot : « Ajouter à un voyage » n’existe plus qu’une fois, dans la barre d’actions du bas (ocean-hub.js). */
  const homeCTA=document.createElement('button');homeCTA.className='home-trip-link';homeCTA.innerHTML=I.route+' Préparer mon voyage';homeCTA.onclick=()=>go('trips');$('.hero-cta').after(homeCTA);
  window.OceanTrips={count:()=>active().length,list:()=>active(),openTrip:id=>{if(!active().some(t=>t.id===id))return;selected=id;view='itinerary';go('trips');opening=true;render();$('#screenWrap').scrollTop=0;},fromSpot,open:()=>go('trips'),route:()=>({selected:current()?.id||null,view}),restoreRoute:r=>{selected=trips.some(t=>t.id===r?.selected&&!t.archived&&!t.deleted)?r.selected:null;view=r?.view==='map'?'map':'itinerary';}};
  /* Démarrage : l’écran Voyages n’est construit qu’à sa première ouverture (ocean:navigate « trips » ci-dessus),
     sauf s’il est déjà l’écran affiché. */
  if($('#trips').classList.contains('active'))render();
  renderProfile();
})();
