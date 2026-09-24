/* Session navigation: real back/forward, with the previous catalogue and scroll. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), wrap=$('#screenWrap');
  const marker='oceanbuddy-navigation-v1';
  let pending=null,restoring=false,applying=false,restoreTarget=null,scrollFrame=0;
  const backButton=document.createElement('button');
  backButton.type='button';backButton.id='appBack';backButton.className='app-back';
  backButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg><span>Retour</span>';
  $('.app-chrome').prepend(backButton);
  const mobileTitle=document.createElement('span');mobileTitle.className='app-page-title';$('.chrome-title').append(mobileTitle);
  const screens=['home','spots','detail','trips','challenges','community','profile'];
  function capture(){
    const focus=document.activeElement?.closest('[data-spot-id],#worldGrid button,[id]');
    let focusSelector=null;
    if(focus&&wrap.contains(focus)){
      if(focus.dataset.spotId)focusSelector='[data-spot-id="'+CSS.escape(focus.dataset.spotId)+'"]';
      else if(focus.matches('#worldGrid button'))focusSelector='#worldGrid .'+[...focus.classList].find(c=>c.startsWith('world-'));
      else if(focus.id)focusSelector='#'+CSS.escape(focus.id);
    }
    return {screen:document.body.dataset.screen||'home',world:spotWorld,country:spotCountry,sport:activeSport,filter:currentFilter,search:currentSearch,favorites:favOnly,near:nearMode,shown:spotShown,view:$('#mapView').style.display==='none'?'list':'map',mapFull,spot:currentSpot,detailSport,detailTab:$('#dTabs .dtab.active')?.dataset.cat||'infos',homeTab:$('#homeTabs .htab.active')?.dataset.hcat||'jour',trip:window.OceanTrips.route(),scroll:wrap.scrollTop,focusSelector};
  }
  function routeKey(r){return JSON.stringify([r.screen,!!r.mapFull,r.screen==='spots'?[r.world,r.country,r.sport]:r.screen==='detail'?r.spot:r.screen==='trips'?r.trip?.selected:null]);}
  function label(r){
    if(r.screen==='spots')return r.country|| (r.world?(worldOf(r.world)?.lab||'les spots'):'les continents');
    if(r.screen==='detail')return SPOTS.find(s=>s.id===r.spot)?.name||'la fiche du spot';
    if(r.screen==='trips'&&r.trip?.selected)return 'ton voyage';
    return {home:'l’accueil',profile:'ton profil',challenges:'les défis',community:'la communauté',trips:'tes voyages'}[r.screen]||'l’accueil';
  }
  function valid(entry){return entry?.owner===marker&&screens.includes(entry.route?.screen)&&Number.isInteger(entry.index)&&entry.index>=0;}
  let entry=valid(history.state)?history.state:{owner:marker,index:0,from:null,route:capture()};
  function write(){history.replaceState(entry,'');}
  function update(){
    /* Les écrans racines ont la barre d'onglets : un « Retour » y ressemblait à un bug. */
    const scr=document.body.dataset.screen||'home';
    const isRoot=['home','challenges','community','profile'].includes(scr)||(scr==='spots'&&!spotWorld)||(scr==="trips"&&!window.OceanTrips?.route?.()?.selected);
    const hasBack=entry.index>0&&!isRoot;
    backButton.hidden=!hasBack;document.body.classList.toggle('has-app-back',hasBack);
    const backLabel='Retour vers '+(entry.from||'l’accueil');backButton.setAttribute('aria-label',backLabel);backButton.title=backLabel;
    $('#detail .back-btn').setAttribute('aria-label',backLabel);
    mobileTitle.textContent={home:'Accueil',spots:'Explorer',detail:'Le spot',trips:'Voyages',challenges:'Défis',community:'Communauté',profile:'Profil'}[document.body.dataset.screen];
    const world=worldOf(spotWorld),sportName=activeSport?SPORTMAP[activeSport].label:'Toutes les activités';
    $('#exploreSportLabel').textContent=sportName;
    $('#exploreActivity').setAttribute('aria-label','Changer d’activité : '+sportName);
    $('#exploreWorldLabel').textContent=spotCountry||world?.lab||(spotWorld?'Le monde entier':'Les continents');
    $('#exploreDestination').setAttribute('aria-current',!spotWorld?'step':'false');
    $('.path-final').classList.toggle('current',!!spotWorld);
    if(spotWorld)$('.path-final').setAttribute('aria-current','step');else $('.path-final').removeAttribute('aria-current');
    if(document.body.dataset.screen==='spots'){
      $('#spotsSub').textContent=spotWorld?(world?worldCount(world.id):SPOTS.filter(s=>!activeSport||spotSports(s).includes(activeSport)).length)+' spots'+(activeSport?' · '+sportName:'')+' à explorer':(activeSport?sportName+' : choisis ton continent, puis ton spot.':'Choisis ton continent, puis ton spot.');
    }
  }
  function begin(){
    if(applying)return;
    if(restoring){restoring=false;restoreTarget=null;}
    if(pending)return;
    pending=capture();
    queueMicrotask(()=>{
      if(!pending)return;const from=pending;pending=null;
      const next=capture();
      if(routeKey(from)!==routeKey(next)){
        entry={...entry,route:from};write();
        entry={owner:marker,index:entry.index+1,from:label(from),route:next};history.pushState(entry,'');
      }else {entry={...entry,route:next};write();}
      update();
    });
  }
  function remember(){
    if(pending||restoring||scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(!pending&&!restoring){entry={...entry,route:capture()};write();}});
  }
  function settled(){
    if(!restoring||!restoreTarget)return;
    const target=restoreTarget;
    requestAnimationFrame(()=>{
      if(restoreTarget!==target)return;
      wrap.scrollTop=target.scroll||0;
      let focus=null;try{focus=target.focusSelector&&$(target.focusSelector);}catch(_){}
      (focus&&focus.getClientRects().length?focus:wrap).focus({preventScroll:true});
      restoreTarget=null;restoring=false;entry={...entry,route:capture()};write();update();
    });
  }
  function restore(route){
    restoring=true;applying=true;restoreTarget=route;
    window.OceanExperience?.init();
    activeSport=SPORTMAP[route.sport]?route.sport:null;
    spotWorld=route.world==='all'||worldOf(route.world)?route.world:null;
    spotCountry=typeof route.country==='string'&&route.country?route.country:null;
    currentFilter=['all','new','debutant','intermediaire','expert'].includes(route.filter)?route.filter:'all';
    currentSearch=typeof route.search==='string'?route.search:'';favOnly=!!route.favorites;nearMode=!!route.near&&!!userPos;
    spotShown=Math.max(SPOT_PAGE,Number(route.shown)||SPOT_PAGE);
    $('#spotSearch').value=currentSearch;$('#favChip').classList.toggle('active',favOnly);$('#nearBtn').classList.toggle('on',nearMode);
    document.querySelectorAll('#filters [data-f]').forEach(el=>el.classList.toggle('active',el.dataset.f===currentFilter));
    renderSportFilters();if(spotCountry&&spotWorld&&spotWorld!=='all')renderCountries();else renderWorlds();syncWorldUI();renderSpots(currentFilter,true);
    if(spotWorld)setView(route.view==='map'?'map':'list');
    setMapFull(!!route.mapFull&&route.screen==='spots'&&route.view==='map',true);
    showHomeCat(['jour','explorer','progres'].includes(route.homeTab)?route.homeTab:'jour');renderHome();
    window.OceanTrips.restoreRoute(route.trip);
    if(route.screen==='detail'&&SPOTS.some(s=>s.id===route.spot)){
      openSpot(route.spot);
      if(route.detailSport)setDetailSport(route.detailSport);
      document.querySelectorAll('#detail .dcat').forEach(el=>{el.style.display=el.dataset.cat===route.detailTab||(route.detailTab==='meteo'&&el.dataset.cat==='securite')?'':'none';});
      document.querySelectorAll('#dTabs .dtab').forEach(el=>el.classList.toggle('active',el.dataset.cat===route.detailTab));
    }else { if(route.screen==='community')window.OceanCommunity?.render(); go(route.screen==='detail'?'home':route.screen); }
    applying=false;update();
  }
  function back(){
    if(restoring)return;
    if(entry.index>0){entry={...entry,route:capture()};write();history.back();}
    else go('home');
  }
  backButton.onclick=back;
  window.addEventListener('popstate',event=>{
    if(!valid(event.state))return;
    if(scrollFrame){cancelAnimationFrame(scrollFrame);scrollFrame=0;}
    pending=null;entry=event.state;restore(entry.route);
  });
  wrap.addEventListener('scroll',remember,{passive:true});
  wrap.addEventListener('click',remember);
  wrap.addEventListener('input',remember);wrap.addEventListener('change',remember);
  window.addEventListener('pagehide',()=>{if(!restoring){entry={...entry,route:capture()};write();}});
  window.OceanNavigation={begin,settled,back};
  history.scrollRestoration='manual';
  if(valid(history.state)&&$('#onb').classList.contains('hide'))restore(entry.route);else {write();update();}
})();
