/* Ocean Buddy — interface, navigation et accessibilité. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const paths = {
    home:'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
    spots:'M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0m-1.8 4.7 4.3 4.3',
    challenges:'M8 4h8v4a4 4 0 0 1-8 0V4zM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v5m-4 3h8m-7-3h6',
    trips:'M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6M6 6h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM8 6v14M16 6v14',
    profile:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 8 0 0 1 16 0v3',
    community:'M4 5h16v11H9l-5 4v-4H4zM8 9h8M8 13h5',
    search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 6 6',
    settings:'m12 3 2 3 4-.1.1 4 2.9 2-2.9 2-.1 4-4-.1-2 3-2-3-4 .1-.1-4L3 12l2.9-2 .1-4 4 .1 2-3zm3 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    wave:'M2 9c3 0 3-3 6-3s3 3 6 3 3-3 6-3M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3'
  };
  const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key] || paths.wave}"/></svg>`;
  const labels = {home:'Accueil',spots:'Explorer',challenges:'Défis',community:'Communauté',profile:'Profil',trips:'Voyages',surf:'Jeu',detail:'Le spot'};
  const short = {home:'Accueil',spots:'Spots',challenges:'Défis',community:'Social',profile:'Profil',trips:'Voyages',surf:'Jeu'};
  const nav = $('.nav');
  nav.insertAdjacentHTML('afterbegin', `<a class="sidebar-brand" href="#home" aria-label="Ocean Buddy — Accueil"><img src="assets/brand/manta-petrole-256.png" alt="" width="47" height="47" loading="lazy" decoding="async"><span>OCEAN <b>BUDDY</b><small>L’OCÉAN, À TES CÔTÉS.</small></span></a><div class="sidebar-label">TON TERRAIN DE JEU</div>`);
  $('.sidebar-brand').addEventListener('click', e => {e.preventDefault();go('home')});
  nav.querySelectorAll('button[data-s]').forEach(button => {
    const page = button.dataset.s;
    button.innerHTML = `${icon(page)}<span class="desktop-label">${labels[page]}</span><span class="mobile-label">${short[page]}</span>${page==='challenges'?'<i class="nav-spark"></i>':''}`;
    button.setAttribute('aria-label', labels[page]);
    if(button.classList.contains('active'))button.setAttribute('aria-current','page');
  });
  // Interface v2 : quatre entrées (Accueil, Explorer, Voyages, Profil), dans l’ordre d’index.html. Jeu et Défis s’ouvrent depuis Profil > Jouer.
  nav.insertAdjacentHTML('beforeend', `<div class="sidebar-bottom"><button class="sidebar-poulpy" type="button"><img src="assets/poulpy/scenes/travel-v2.webp" alt="" loading="lazy" decoding="async"><b>Une question ?</b><span>Poulpy est là pour toi.</span><i>Discuter avec Poulpy</i></button><button class="sidebar-settings" type="button">${icon('settings')} Réglages</button><button class="sidebar-user" type="button"><span class="user-initial"></span><span><b class="user-name"></b><small id="sidebarXp"></small></span></button><span class="sidebar-motto">Moins de traces. Plus de souvenirs.</span></div>`);
  $('.sidebar-poulpy').onclick = openChat;
  // Communauté (ordinateur seulement) : rangée en bas du menu, avec les Réglages ; le menu principal garde ses quatre entrées.
  {const c=$('.n-community',nav),s=$('.sidebar-settings',nav);if(c&&s){c.classList.add('sidebar-community');s.before(c);}}
  $('.sidebar-settings').onclick = openSettings;
  $('.sidebar-user').onclick = () => go('profile');
  const chrome = document.createElement('header');chrome.className='app-chrome';
  chrome.innerHTML = `<div class="chrome-title"><span class="chrome-mobile-brand">OCEAN <b>BUDDY</b></span><span class="chrome-breadcrumb">Ton espace <i>/</i> <b id="pageLabel">Accueil</b></span></div><form class="chrome-search" role="search"><label for="globalSearch" class="sr-only">Rechercher un spot</label>${icon('search')}<input id="globalSearch" placeholder="Ton prochain spot…" autocomplete="off"><kbd>↵</kbd></form><button class="chrome-user" aria-label="Ouvrir mon profil"><span class="user-initial"></span><b class="user-name"></b></button>`;
  $('.phone').insertBefore(chrome,$('#screenWrap'));
  $('.chrome-user').onclick = () => go('profile');
  $('.chrome-user').insertAdjacentHTML('beforebegin',`<button class="mobile-search" aria-label="Rechercher un spot">${icon('search')}</button>`);
  /* Recherche de l’accueil (et loupe du haut) : tous les continents, filtres remis à zéro, mais le sport choisi et ses
     couleurs restent (il s’affiche en puce effaçable au-dessus de la liste ; sans résultat dans ce sport, la liste
     propose « Chercher dans toutes les activités »). Avant, le sport était effacé et le thème remis au neutre. */
  function searchEverywhere(query=''){
    window.OceanNavigation?.begin();
    currentFilter='all';favOnly=false;nearMode=false;currentSearch='';
    $('#favChip').classList.remove('active');$('#nearBtn').classList.remove('on');
    if(typeof syncFilterChips==='function')syncFilterChips();
    else document.querySelectorAll('#filters [data-f]').forEach(el=>el.classList.toggle('active',el.dataset.f==='all'));
    renderWorlds();
    go('spots');openWorld('all');setView('list');$('#spotSearch').value=query;searchSpots(query);$('#spotSearch').focus();
  }
  $('.mobile-search').onclick = () => searchEverywhere();
  $('.chrome-user').insertAdjacentHTML('afterend','<button class="mobile-poulpy" aria-label="Discuter avec Poulpy"><img src="assets/poulpy/scenes/travel-v2.webp" alt="" loading="lazy" decoding="async"></button>');
  $('.mobile-poulpy').onclick = openChat;
  $('.chrome-search').onsubmit = event => {
    event.preventDefault();const query=$('#globalSearch').value.trim();
    searchEverywhere(query);
  };
  const identity = () => {
    const name = typeof userName === 'string' ? userName : 'Explorateur';
    document.querySelectorAll('.user-name').forEach(el=>el.textContent=name);
    document.querySelectorAll('.user-initial').forEach(el=>el.textContent=name.slice(0,1).toUpperCase());
    const L=window.OceanProgress?.level(typeof xp==='number'?xp:0);
    $('#sidebarXp').textContent = L?`Niv. ${L.n}, ${L.title}`:`${typeof xp==='number'?xp:0} XP`;
  };
  identity();new MutationObserver(identity).observe($('#xpText'),{childList:true,characterData:true,subtree:true});
  new MutationObserver(identity).observe($('#profName'),{childList:true,characterData:true,subtree:true});
  window.addEventListener('ocean:navigate',event=>{
    const page=event.detail;$('#pageLabel').textContent=labels[page]||'Accueil';
    nav.querySelectorAll('[data-s]').forEach(button=>{
      /* Jeu et Défis : écrans rattachés au Profil, qui reste l’entrée active (tabOf, app.js). */
      const selected=button.dataset.s===(page==='detail'?'spots':typeof tabOf==='function'?tabOf(page):page);
      if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });identity();
  });
  /* Interface v2 : Défis et Profil n’ont plus de grande affiche ni de sur-titre (en-têtes simples d’index.html). */
  const headings = {
    spotsTop:['LE MONDE T’ATTEND','Trouve ton prochain horizon.']
  };
  for(const [id,[eyebrow]] of Object.entries(headings)){
    const header=document.getElementById(id);
    if(header)header.insertAdjacentHTML('afterbegin',`<div class="page-eyebrow">${eyebrow}</div>`);
  }

  const credits=document.createElement('a');credits.className='photo-credits';credits.href='photos.html';credits.target='_blank';credits.rel='noopener';credits.textContent='Photographies & crédits';$('#worldPick').append(credits);
  const photoNote=document.createElement('a');photoNote.className='hero-photo-credit';photoNote.href='photos.html';photoNote.target='_blank';photoNote.rel='noopener';photoNote.textContent='Photo : byronetmedia';$('#homeTop').append(photoNote);
  const homeStats=document.createElement('div');homeStats.className='hero-stats';homeStats.innerHTML='<span><b>'+SPOTS.length+'</b> spots</span><span><b>9</b> activités</span><span><b>1</b> océan à protéger</span>';$('#homeTop').append(homeStats);
  const worldsSync=syncWorldUI;syncWorldUI=function(){worldsSync();document.body.classList.toggle('is-world-picker',!spotWorld);window.OceanPoulpy?.refresh()};syncWorldUI();

  // Give the ecology challenges their own prominent section before the optional circuit.
  const events=$('#cmpEvents');const eventBox=events.parentElement;
  const eventTitle=eventBox.previousElementSibling;
  const drawer=document.createElement('details');drawer.className='events-drawer';
  drawer.innerHTML=`<summary>${icon('challenges')}<span>Le circuit mondial<small>Les épreuves et les prochaines étapes</small></span><b aria-hidden="true">+</b></summary>`;
  eventBox.before(drawer);drawer.append(eventBox);eventTitle.remove();
  const challenges=$('#challenges');challenges.append(drawer);
  const cmp=$('.cmp');challenges.append(cmp);
  $('#homeActivity').setAttribute('aria-label','Changer mon activité');
  $('.onb').setAttribute('aria-label','Bienvenue dans Ocean Buddy');
  const modalIds=['quizModal','settingsModal','ecoInfo','chatSheet'];
  const closeHandlers={quizModal:closeQuiz,settingsModal:closeSettings,ecoInfo:closeEcoLog,chatSheet:closeChat};
  const modalLabels={quizModal:'Le quiz de Poulpy',settingsModal:'Réglages',ecoInfo:'Mes gestes pour l’océan',chatSheet:'Discuter avec Poulpy'};
  let previousFocus=null;
  const focusables=el=>[...el.querySelectorAll('button,input,a[href],select,textarea,[tabindex="0"]')].filter(el=>el.offsetParent!==null&&!el.disabled);
  modalIds.forEach(id=>{
    const el=document.getElementById(id);el.setAttribute('role','dialog');el.setAttribute('aria-label',modalLabels[id]);el.setAttribute('aria-modal','true');el.inert=!el.classList.contains('open');
    new MutationObserver(()=>{
      const open=el.classList.contains('open');el.inert=!open;
      if(open){previousFocus=document.activeElement;requestAnimationFrame(()=>{const items=focusables(el);(id==='chatSheet'?$('#chatInput'):items[0])?.focus()})}
      else if(previousFocus?.isConnected){previousFocus.focus();previousFocus=null}
    }).observe(el,{attributes:true,attributeFilter:['class']});
  });
  function improveControls(root){
    root.querySelectorAll('[onclick]:not(button):not(a):not(input):not(label)').forEach(el=>{
      if(el.matches('.quiz-modal'))return;
      if(!el.hasAttribute('role'))el.setAttribute('role','button');
      if(!el.hasAttribute('tabindex'))el.tabIndex=0;
    });
    root.querySelectorAll('a[onclick]:not([href])').forEach(el=>{el.setAttribute('role','button');el.tabIndex=0});
    root.querySelectorAll('.sport-card,.lvl-card').forEach(el=>el.setAttribute('aria-pressed',el.classList.contains('sel')));
  }
  improveControls(document);
  document.querySelectorAll('.sport-card,.lvl-card').forEach(el=>new MutationObserver(()=>el.setAttribute('aria-pressed',el.classList.contains('sel'))).observe(el,{attributes:true,attributeFilter:['class']}));
  new MutationObserver(records=>{const roots=new Set();for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)roots.add(node.parentElement||node);roots.forEach(improveControls)}).observe($('#screenWrap'),{childList:true,subtree:true});
  new MutationObserver(()=>improveControls($('#onb'))).observe($('#onb'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('keydown',event=>{
    const open=modalIds.map(id=>document.getElementById(id)).filter(el=>el.classList.contains('open')).at(-1);
    if(event.key==='Escape'&&open){closeHandlers[open.id]();return}
    if(event.key==='Tab'&&open){const items=focusables(open),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}return}
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"]:not(button):not(input)')){event.preventDefault();event.target.click()}
  });
  $('#setName').addEventListener('keydown',event=>{if(event.key==='Enter')saveName()});
  // A returning user arrives at the app directly; changing sport remains available.
  // L’accueil et la liste des spots sont déjà rendus par app.js avec le même état : pas de second rendu au démarrage.
  if(typeof returning!=='undefined'&&returning&&onbDone){$('#onb').classList.add('hide');$('#onb').style.display='none';activeSport=chosenSport==='all'?null:chosenSport;renderSportFilters();}
  // Activité enregistrée (couleurs, pastille du haut) posée maintenant, sous le rideau de démarrage, plutôt qu’au « load ».
  window.OceanTheme?.set?.(typeof activeSport!=='undefined'?activeSport:null);
  // Reduced motion applies to both the interface and the marine illustrations.
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.body.classList.add('reduce-motion');
})();
