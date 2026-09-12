/* Poulpy: activity companions and a personal, locally saved profile avatar. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const variants = {
    surf: {name:'Le surfeur', caption:'À la poursuite de la prochaine vague.', label:'Poulpy en surf'},
    dive: {name:'Le plongeur', caption:'Le grand bleu, de l’autre côté du miroir.', label:'Poulpy en plongée'},
    paddle: {name:'Le navigateur', caption:'Un coup de pagaie. Mille horizons.', label:'Poulpy en paddle'},
    travel: {name:'L’explorateur', caption:'Une carte, des envies et le large devant toi.', label:'Poulpy l’explorateur'},
    eco: {name:'Le protecteur', caption:'De petits gestes pour un immense océan.', label:'Poulpy protecteur de l’océan'},
    celebrate: {name:'Le complice', caption:'Chaque petit progrès mérite son sourire.', label:'Poulpy qui célèbre tes progrès'}
  };
  const storageKey = 'oceanbuddy_poulpy_style_v1';
  let preferred = 'auto';
  try {const saved=localStorage.getItem(storageKey);if(saved==='auto'||Object.hasOwn(variants,saved))preferred=saved;} catch (_) { /* Session-only preferences remain usable. */ }
  const src = key => `assets/poulpy/scenes/${Object.hasOwn(variants,key)?key:'travel'}.webp`;
  const image = (key,cls='',lazy=true) => `<img class="${cls}" src="${src(key)}" alt="" width="960" height="640" decoding="async" ${lazy?'loading="lazy"':''}>`;
  const sportVariant = sport => ({surf:'surf',bodyboard:'surf',plongee:'dive',snorkeling:'dive',baignade:'dive',paddle:'paddle',kayak:'paddle',windsurf:'surf',kitesurf:'surf'}[sport]||'travel');
  function context(page=document.body.dataset.screen) {
    if(page==='trips'||(page==='spots'&&!spotWorld))return 'travel';
    if(page==='challenges')return 'eco';
    if(page==='profile')return preferred==='auto'?sportVariant(activeSport):preferred;
    if(page==='detail') {const s=SPOTS.find(s=>s.id===currentSpot);if(s)return sportVariant(detailAct(s));}
    return sportVariant(activeSport);
  }
  function setSvg(selector,key) {
    const svg=$(selector);if(!svg)return;
    const target=svg.tagName.toLowerCase()==='svg'?svg:$('svg',svg);
    if(!target)return;
    const current=$('image',target);
    const width=selector==='#octoHi'?210:140;
    target.setAttribute('viewBox',`0 0 ${width} 140`);
    target.setAttribute('preserveAspectRatio','xMidYMid slice');
    if(current?.getAttribute('href')!==src(key)||current.getAttribute('width')!==String(width))target.innerHTML=`<image href="${src(key)}" x="0" y="0" width="${width}" height="140" preserveAspectRatio="xMidYMid slice"/>`;
    target.setAttribute('role','img');target.setAttribute('aria-label',variants[key].label);
  }
  function refresh() {
    const key=context();
    setSvg('#octoHi','travel');
    const welcome=$('#welcomeBubble');if(welcome)welcome.textContent='Carte en main, boussole au cœur. Choisis ton prochain horizon avec moi.';setSvg('#octo',sportVariant(activeSport));
    setSvg('#octoProfile',preferred==='auto'?sportVariant(activeSport):preferred);
    setSvg('#chatOcto',key);setSvg('#dTipOcto',key);
    document.querySelectorAll('.sidebar-poulpy img,.mobile-poulpy img').forEach(el=>{if(el.getAttribute('src')!==src(key))el.src=src(key);});
    document.querySelectorAll('.personal-poulpy').forEach(el=>{el.src=src(preferred==='auto'?sportVariant(activeSport):preferred);});
    const label=$('#poulpyPreference');if(label)label.textContent=preferred==='auto'?'Selon ton activité':variants[preferred].name;
    document.querySelectorAll('[data-poulpy-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.poulpyChoice===preferred)));
  }
  function explore(sport) {
    currentSearch='';$('#spotSearch').value='';favOnly=false;
    $('#favChip')?.classList.remove('active');
    document.querySelectorAll('#filters .chip:not(.fav-chip)').forEach((chip,i)=>chip.classList.toggle('active',i===0));
    currentFilter='all';setSport(sport);chosenSport=sport;
    saveState();renderHome();go('spots');openWorld('all');setView('list');
    refresh();
  }
  function openWorlds(){go('spots');backToWorlds();setView('list');refresh();}
  const activities=[
    {key:'surf',sport:'surf',title:'Prends la vague.',label:'Surf',copy:'Trouve ta prochaine session.'},
    {key:'dive',sport:'plongee',title:'Change de monde.',label:'Plongée',copy:'Explore sous la surface.'},
    {key:'paddle',sport:'paddle',title:'Suis ton rythme.',label:'Paddle',copy:'Échappe-toi au fil de l’eau.'},
    {key:'travel',sport:null,title:'Le monde t’attend.',label:'Exploration',copy:'Pars avec Poulpy l’explorateur.'}
  ];
  const activitiesSection=document.createElement('section');activitiesSection.className='poulpy-activities';activitiesSection.setAttribute('aria-labelledby','activityHeading');
  activitiesSection.innerHTML=`<div class="editorial-heading"><div><span class="section-kicker">SUR L’EAU. SOUS L’EAU. AVEC TOI.</span><h2 id="activityHeading">Quelle aventure aujourd’hui<span> ?</span></h2></div><button class="text-button" type="button" id="allActivities">Les 9 activités <span aria-hidden="true">↗</span></button></div><div class="activity-adventures">${activities.map((a,i)=>`<button type="button" class="activity-adventure adventure-${a.key}" data-adventure="${a.key}" aria-label="${a.sport?'Explorer les spots de '+a.label:'Explorer les continents avec Poulpy'}"><span class="adventure-top"><span>${a.label}</span><span class="adventure-index" aria-hidden="true">0${i+1}</span></span><span class="adventure-art">${image(a.key)}</span><span class="adventure-bottom"><strong>${a.title}</strong><span>${a.copy}</span><i aria-hidden="true">↗</i></span></button>`).join('')}</div>`;
  $('.home-intro').after(activitiesSection);
  $('#allActivities').onclick=openActivityGate;
  activitiesSection.querySelectorAll('[data-adventure]').forEach(button=>button.onclick=()=>{const a=activities.find(a=>a.key===button.dataset.adventure);a.sport?explore(a.sport):openWorlds();});

  // The photographic destination catalogue remains the main exploration surface.
  const worldNote=document.createElement('aside');worldNote.className='poulpy-world-note';
  worldNote.innerHTML=`${image('travel')}<div><span class="section-kicker">POULPY L’EXPLORATEUR</span><p>Une carte. Mille envies.<br><b>Notre prochaine escale commence ici.</b></p></div><span class="world-note-step">01 <i>/</i> DESTINATION</span>`;
  $('#worldGrid').before(worldNote);

  const eco=document.createElement('aside');eco.className='poulpy-eco-banner';
  eco.innerHTML=`${image('eco')}<div><span class="section-kicker">L’OCÉAN NOUS DONNE TANT</span><h2>À nous de lui rendre.</h2><p>Un déchet ramassé, une bonne habitude partagée.<br>Avec Poulpy, chaque geste compte.</p></div><span class="eco-seal" aria-hidden="true">EXPLORE<br>PROGRESSE<br><b>PROTÈGE.</b></span>`;
  $('#chalTop').after(eco);

  // Native dialog supplies focus trapping, Escape and an inert background.
  const dialog=document.createElement('dialog');dialog.className='poulpy-dialog';dialog.id='poulpyDialog';dialog.setAttribute('aria-labelledby','poulpyDialogTitle');
  dialog.innerHTML=`<div class="poulpy-dialog-heading"><div><span class="section-kicker">TOUJOURS LE MÊME COMPLICE</span><h2 id="poulpyDialogTitle">À chacun son Poulpy.</h2><p>Choisis celui qui t’accompagne sur ton profil.</p></div><button type="button" class="poulpy-close" aria-label="Fermer le choix de Poulpy" autofocus>×</button></div><button type="button" class="poulpy-auto" data-poulpy-choice="auto" aria-pressed="false"><span><b>Au rythme de mon activité</b><small>Poulpy change avec le sport que tu explores.</small></span><span class="choice-tick" aria-hidden="true">✓</span></button><div class="poulpy-wardrobe">${Object.entries(variants).map(([key,v])=>`<button class="poulpy-choice choice-${key}" type="button" data-poulpy-choice="${key}" aria-pressed="false"><span class="choice-tick" aria-hidden="true">✓</span>${image(key)}<b>${v.name}</b><span>${v.caption}</span></button>`).join('')}</div><p class="poulpy-save-note" id="poulpySaveNote" role="status">Ton choix est enregistré sur cet appareil.</p>`;
  document.body.append(dialog);let previousFocus=null;
  function openWardrobe(){previousFocus=document.activeElement;refresh();dialog.showModal();}
  $('.poulpy-close',dialog).onclick=()=>dialog.close();
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
  dialog.querySelectorAll('[data-poulpy-choice]').forEach(button=>button.onclick=()=>{
    preferred=button.dataset.poulpyChoice;
    try{localStorage.setItem(storageKey,preferred);$('#poulpySaveNote').textContent=(preferred==='auto'?'Poulpy suit ton activité':variants[preferred].name+' choisi')+' · enregistré sur cet appareil.';}catch(_){$('#poulpySaveNote').textContent='Choix appliqué pour cette session. Le stockage de ton navigateur est indisponible.';}
    refresh();
  });
  const profileCard=document.createElement('button');profileCard.type='button';profileCard.className='poulpy-profile-card';profileCard.onclick=openWardrobe;
  profileCard.innerHTML=`<span class="profile-poulpy-art">${image('travel','personal-poulpy',false)}</span><span><span class="section-kicker">TON COMPAGNON D’AVENTURE</span><strong>Ton Poulpy, ton style.</strong><span id="poulpyPreference"></span></span><span class="profile-customize">Choisir <i aria-hidden="true">↗</i></span>`;
  $('#profTop').after(profileCard);
  document.querySelectorAll('.chrome-user,.sidebar-user').forEach(button=>button.insertAdjacentHTML('afterbegin',image('travel','personal-poulpy',false)));

  // Illustrate the existing onboarding controls without changing their behaviour.
  function decorateOnboarding(){for(const [sport,key] of Object.entries({surf:'surf',plongee:'dive',paddle:'paddle',snorkeling:'dive'})){
    const card=$(`#sportGrid [data-sp="${sport}"]`);if(!card)continue;
    if($('.sport-poulpy',card))continue;
    card.classList.add('has-poulpy');card.insertAdjacentHTML('afterbegin',image(key,'sport-poulpy'));
  }}
  decorateOnboarding();
  setSvg('#logoOcto','travel');setSvg('#logoOcto2','celebrate');

  // A quick activity change can be cancelled without changing the saved preference.
  const gateClose=document.createElement('button');gateClose.type='button';gateClose.className='activity-gate-close';gateClose.textContent='Retour à l’application';gateClose.hidden=true;$('#onb').prepend(gateClose);
  let gateFocus=null,gateVisible=false;
  function focusOnboarding(){requestAnimationFrame(()=>{const step=$('#onb .onb-step.active');($('.sport-card.sel,.lvl-card.sel',step)||$('.sport-card,.lvl-card',step)||$('button',step))?.focus({preventScroll:true});});}
  function syncOnboarding(){
    const visible=!$('#onb').classList.contains('hide')&&$('#onb').style.display!=='none';
    gateClose.hidden=!quickGate;
    for(const el of [$('#screenWrap'),$('.app-chrome'),$('.nav'),$('.skip-link')])el.inert=visible;
    $('#onb').setAttribute('role','dialog');$('#onb').setAttribute('aria-modal',String(visible));$('#onb').inert=!visible;
    if(visible&&!gateVisible){gateFocus=document.activeElement;focusOnboarding();}
    gateVisible=visible;
  }
  function cancelGate(){if(!quickGate)return;quickGate=false;chosenSport=activeSport||'all';$('#onb').classList.add('hide');$('#onb').style.display='none';syncOnboarding();(gateFocus?.isConnected?gateFocus:$('#homeActivity')).focus({preventScroll:true});}
  gateClose.onclick=cancelGate;
  new MutationObserver(syncOnboarding).observe($('#onb'),{attributes:true,attributeFilter:['style','class']});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&quickGate){e.preventDefault();cancelGate();}});
  window.addEventListener('ocean:navigate',refresh);
  window.OceanPoulpy={refresh,src,sportVariant,context,openWorlds,decorateOnboarding,focusOnboarding};
  refresh();syncOnboarding();
})();
