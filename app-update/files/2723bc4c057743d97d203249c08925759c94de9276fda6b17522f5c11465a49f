/* Trophées Ocean Buddy : vitrine de médailles, fiche détaillée inclinable,
   carte « story » à partager et célébration au déblocage.
   Chargé en dernier : remplace renderBadges(), renderQuizBadges() et checkBadges()
   d'app.js. Les conditions d'obtention restent celles de progression.js et du quiz ;
   rien n'est inventé (aucune statistique sur les autres joueurs). */
(function(){
  'use strict';
  if(window.OceanBadges&&window.OceanBadges.ready)return; /* déjà chargé */
  var DATES_KEY='oceanbuddy_badge_dates';
  var IMG='assets/badges/';
  var TIERS={
    common:{label:'Commun',rank:1},
    rare:{label:'Rare',rank:2},
    epic:{label:'Épique',rank:3},
    legendary:{label:'Légendaire',rank:4}
  };
  var TIER_ORDER=['common','rare','epic','legendary'];
  /* Rareté et phrase de réussite de chaque trophée. */
  var META={
    first:{tier:'common',done:'Ta première session est notée dans ton carnet.'},
    eco:{tier:'rare',done:'Cinq gestes pour l’océan : il te dit merci.'},
    explorer:{tier:'rare',done:'Dix fiches de spots explorées.'},
    dawn:{tier:'epic',done:'Défi Dawn Patrol réussi : debout avant le soleil !'},
    streak7:{tier:'epic',done:'Sept jours d’affilée avec Ocean Buddy.'},
    quiz:{tier:'epic',done:'Un thème du quiz maîtrisé sans aucune faute.'},
    dolphin:{tier:'epic',done:'Dix défis réussis : les dauphins t’adoptent.'},
    legend:{tier:'legendary',done:'Niveau 10 atteint : tu es une légende du large.'},
    'quiz-faune':{tier:'epic',done:'Sans-faute au quiz Faune.'},
    'quiz-secu':{tier:'epic',done:'Sans-faute au quiz Sécurité.'},
    'quiz-tech':{tier:'epic',done:'Sans-faute au quiz Technique.'},
    'quiz-ocean':{tier:'epic',done:'Sans-faute au quiz Océan.'},
    'quiz-eco':{tier:'epic',done:'Sans-faute au quiz Écologie.'}
  };
  /* Repli si progression.js ou le quiz ne sont pas chargés. */
  var APP_FALLBACK=[
    {id:'first',n:'Première vague',how:'Enregistre ta première session.'},
    {id:'eco',n:'Éco-héros',how:'Note 5 gestes pour l’océan.'},
    {id:'explorer',n:'Explorateur',how:'Découvre 10 fiches de spots.'},
    {id:'dawn',n:'Dawn Patrol',how:'Réussis le défi Dawn Patrol.'},
    {id:'streak7',n:'7 jours',how:'Reviens 7 jours d’affilée.'},
    {id:'quiz',n:'Compétiteur',how:'Deviens expert d’un thème du quiz.'},
    {id:'dolphin',n:'Ami dauphin',how:'Réussis 10 défis.'},
    {id:'legend',n:'Légende',how:'Atteins le niveau 10.'}
  ];
  var QUIZ_FALLBACK=[{id:'faune',label:'Faune'},{id:'secu',label:'Sécurité'},{id:'tech',label:'Technique'},{id:'ocean',label:'Océan'},{id:'eco',label:'Écologie'}];

  var ICON={
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/></svg>'
  };

  /* ---------- Utilitaires ---------- */
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function T(s){try{return window.obT?window.obT(s):s;}catch(e){return s;}}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function reduced(){
    return document.body.classList.contains('reduce-motion')||!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function buzz(p){try{if(typeof vibrate==='function')vibrate(p);else if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
  function say(m){try{if(typeof toast==='function')toast(m);}catch(e){}}
  function loadDates(){try{var d=JSON.parse(localStorage.getItem(DATES_KEY)||'{}');return d&&typeof d==='object'?d:{};}catch(e){return {};}}
  function saveDates(d){try{localStorage.setItem(DATES_KEY,JSON.stringify(d));}catch(e){}}
  function fmtDate(ts){
    if(!ts)return '';
    var lang=(document.documentElement.getAttribute('lang')||'fr');
    try{return new Date(ts).toLocaleDateString(lang,{day:'numeric',month:'long',year:'numeric'});}
    catch(e){return new Date(ts).toLocaleDateString('fr-FR');}
  }
  function ctx(){
    try{if(typeof progCtx==='function')return progCtx();}catch(e){}
    return {xp:0,sessions:[],eco:0,quiz:0,favs:0};
  }
  function quizData(){
    try{if(typeof quizLoad==='function')return quizLoad();}catch(e){}
    return {best:{},badges:[]};
  }
  function quizCats(){
    try{if(typeof QUIZ_CATS!=='undefined')return QUIZ_CATS.filter(function(c){return c.id!=='tout';});}catch(e){}
    return QUIZ_FALLBACK;
  }
  function quizSize(cat){
    try{if(typeof QUIZ_BANK!=='undefined'){var n=QUIZ_BANK.filter(function(q){return q.c===cat;}).length;if(n)return Math.min(7,n);}}catch(e){}
    return 7;
  }
  /* Nombre total de défis réussis (même calcul que progression.js, en lecture seule). */
  function chalTotal(){
    try{var d=JSON.parse(localStorage.getItem('oceanbuddy_progress_v1')||'{}'),n=0;
      Object.keys(d.chal||{}).forEach(function(k){n+=+(d.chal[k]&&d.chal[k].n)||0;});return n;}catch(e){return 0;}
  }
  function progressOf(id,c){
    var P=window.OceanProgress;
    try{
      if(id==='eco')return {cur:c.eco||0,max:5};
      if(id==='explorer'&&P)return {cur:P.seenCount(false),max:10};
      if(id==='streak7'&&P)return {cur:P.best(),max:7};
      if(id==='dolphin')return {cur:chalTotal(),max:10};
      if(id==='legend'){var L=P?P.level(c.xp):{n:1};return {cur:L.n,max:10,pre:'Niv. '};}
      if(id.indexOf('quiz-')===0){var cat=id.slice(5),best=+(quizData().best||{})[cat]||0;if(best)return {cur:best,max:quizSize(cat),pre:'Record '};}
    }catch(e){}
    return null;
  }

  /* ---------- Liste des trophées ---------- */
  function list(){
    var c=ctx(),dates=loadDates(),out=[];
    var app=null;
    try{if(window.OceanProgress)app=OceanProgress.badges(c);}catch(e){}
    (app||APP_FALLBACK.map(function(b){return {id:b.id,n:b.n,how:b.how,locked:true};})).forEach(function(b){
      var m=META[b.id]||{tier:'rare',done:''};
      out.push({id:b.id,name:b.n,how:b.how,done:m.done,tier:m.tier,tierLabel:TIERS[m.tier].label,group:'app',groupLabel:'Exploit',
        unlocked:!b.locked,date:dates[b.id]||null,img:IMG+b.id+'.webp',hd:IMG+b.id+'-hd.webp',progress:b.locked?progressOf(b.id,c):null});
    });
    var got=quizData().badges||[];
    quizCats().forEach(function(q){
      var id='quiz-'+q.id,m=META[id]||{tier:'epic',done:''},on=got.indexOf(q.id)>=0;
      out.push({id:id,name:'Expert '+q.label,how:'Fais un sans-faute au quiz « '+q.label+' ».',done:m.done,tier:m.tier,tierLabel:TIERS[m.tier].label,
        group:'quiz',groupLabel:'Expert du quiz',unlocked:on,date:dates[id]||null,img:IMG+id+'.webp',hd:IMG+id+'-hd.webp',progress:on?null:progressOf(id,c)});
    });
    return out;
  }
  function find(id){var L=list();for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
  /* Date d'obtention : posée la première fois qu'un trophée est vu débloqué. */
  function syncDates(){
    var d=loadDates(),ch=false,now=Date.now();
    list().forEach(function(b){if(b.unlocked&&!d[b.id]){d[b.id]=now;ch=true;}});
    if(ch)saveDates(d);
  }
  function quizUnlocked(){return (quizData().badges||[]).map(function(x){return 'quiz-'+x;});}

  /* ---------- Vitrine ---------- */
  function ring(n,total){
    var r=36,C=2*Math.PI*r,p=total?n/total:0;
    return '<div class="tb-ring" aria-hidden="true"><svg viewBox="0 0 84 84"><defs><linearGradient id="tbRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd7ff"/><stop offset="1" stop-color="#e0ff91"/></linearGradient></defs>'
      +'<circle class="tb-ring-bg" cx="42" cy="42" r="'+r+'" fill="none" stroke-width="7"/>'
      +'<circle class="tb-ring-fg" cx="42" cy="42" r="'+r+'" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-p)).toFixed(1)+'"/></svg>'
      +'<div class="tb-ring-txt"><b>'+n+'</b><small>'+`sur ${total}`+'</small></div></div>';
  }
  function bar(p){
    if(!p||p.max<=1)return '';
    var cur=Math.min(p.cur,p.max),pct=Math.round(cur/p.max*100);
    return '<div class="tb-bar"><i style="--p:'+pct+'%"></i><b>'+(p.pre||'')+cur+' / '+p.max+'</b></div>';
  }
  function tile(b,i){
    var t='tb-t-'+b.tier;
    var label=b.name+(b.unlocked?' — trophée '+b.tierLabel+' obtenu':' — verrouillé. '+b.how);
    return '<button type="button" class="tb-medal '+t+' '+(b.unlocked?'is-earned':'is-locked')+'" data-tb="'+esc(b.id)+'" aria-label="'+esc(label)+'">'
      +'<span class="tb-stage" style="--tb-src:url(&quot;'+esc(b.img)+'&quot;)"><img class="tb-img" src="'+esc(b.img)+'" alt="" width="512" height="512" loading="lazy" decoding="async" draggable="false">'
      +(b.unlocked?'<span class="tb-glint" style="--tb-delay:'+(i*0.9%7).toFixed(1)+'s"></span>':'<span class="tb-lock">'+ICON.lock+'</span>')+'</span>'
      +'<span class="tb-name">'+esc(b.name)+'</span>'
      +(b.unlocked?'<span class="tb-tier">'+esc(b.tierLabel)+'</span>':(bar(b.progress)||'<span class="tb-how">'+esc(b.how)+'</span>'))
      +'</button>';
  }
  function nextGoal(L){
    var best=null,score=-1;
    L.forEach(function(b){if(b.unlocked)return;var p=b.progress,s=p&&p.max>1?Math.min(p.cur,p.max)/p.max:0;
      s-=TIERS[b.tier].rank*0.001;if(s>score){score=s;best=b;}});
    return best;
  }
  function renderShelf(){
    var el=document.getElementById('badges');if(!el)return;
    syncDates();
    var L=list(),got=L.filter(function(b){return b.unlocked;}).length;
    el.classList.add('tb-host');
    hideQuizBlock();
    var tiers=TIER_ORDER.map(function(t){
      var all=L.filter(function(b){return b.tier===t;});if(!all.length)return '';
      var n=all.filter(function(b){return b.unlocked;}).length;
      return '<span class="tb-tier-pill tb-t-'+t+'"><i></i><b>'+n+'<small> / '+all.length+'</small></b><span>'+TIERS[t].label+'</span></span>';
    }).join('');
    var g=nextGoal(L),next;
    if(!g)next='Collection complète. Chapeau, légende du large !';
    else if(g.progress&&g.progress.max>1)next='Prochain : <b>'+esc(g.name)+'</b> <span class="tb-nw">· '+(g.progress.pre||'')+Math.min(g.progress.cur,g.progress.max)+' / '+g.progress.max+'</span>';
    else next='Prochain : <b>'+esc(g.name)+'</b> · '+esc(g.how);
    var groups=[['app','Exploits'],['quiz','Experts du quiz']].map(function(gr){
      var items=L.filter(function(b){return b.group===gr[0];});
      var n=items.filter(function(b){return b.unlocked;}).length;
      return '<section class="tb-group" aria-label="'+gr[1]+'"><div class="tb-group-h"><h3>'+gr[1]+'</h3><span>'+n+' / '+items.length+'</span></div>'
        +'<div class="tb-grid">'+items.map(tile).join('')+'</div></section>';
    }).join('');
    el.innerHTML='<div class="tb-shelf">'
      +'<div class="tb-head">'+ring(got,L.length)
      +'<div><p class="tb-eyebrow">Ma vitrine</p><p class="tb-title">'+`${got} / ${L.length} trophées`+'</p><p class="tb-next">'+next+'</p></div>'
      +'<div class="tb-tiers">'+tiers+'</div></div>'
      +groups+'</div>';
    if(!el.dataset.tbBound){
      el.dataset.tbBound='1';
      el.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-tb]');if(b){e.preventDefault();open(b.getAttribute('data-tb'),b);}});
    }
  }
  function hideQuizBlock(){
    var q=document.getElementById('quizBadgesProfile');if(!q)return;
    q.classList.add('tb-hidden');q.setAttribute('aria-hidden','true');
    var p=q.previousElementSibling;if(p&&p.classList.contains('sub-lab'))p.classList.add('tb-hidden');
  }

  /* ---------- Médaille 3D (fiche et célébration) ---------- */
  function medalHTML(b,opts){
    opts=opts||{};
    var src=esc(b.hd||b.img),edges='';
    if(opts.edges)for(var k=6;k>=1;k--)edges+='<img class="tb-edge" src="'+src+'" alt="" draggable="false" style="transform:translateZ('+(-k*1.6).toFixed(1)+'px)">';
    return edges+'<div class="tb-face'+(b.unlocked?'':' tb-locked-face')+'" style="--tb-src:url(&quot;'+src+'&quot;)">'
      +'<img src="'+src+'" alt="" draggable="false" decoding="async">'
      +(b.unlocked?'<span class="tb-lyr tb-iri"></span><span class="tb-lyr tb-streak"></span><span class="tb-lyr tb-spec"></span>'+(opts.sweep?'<span class="tb-lyr tb-sweep"></span>':''):'<span class="tb-lyr tb-spec"></span>')
      +'</div>';
  }
  /* Inclinaison : pointeur / doigt, gyroscope s'il est déjà autorisé, sinon léger balancement. */
  function tiltController(stage,tilt){
    var st={x:0,y:0,tx:0,ty:0,drag:false,hover:false,gyro:null,raf:0,last:0,alive:true};
    var calm=reduced();
    function pos(e){var r=stage.getBoundingClientRect();st.tx=clamp((e.clientX-r.left)/r.width*2-1,-1.1,1.1);st.ty=clamp((e.clientY-r.top)/r.height*2-1,-1.1,1.1);st.last=performance.now();}
    function down(e){st.drag=true;try{stage.setPointerCapture(e.pointerId);}catch(_){ }pos(e);}
    function move(e){if(st.drag||e.pointerType==='mouse'){st.hover=true;pos(e);}}
    function up(){st.drag=false;st.hover=false;st.last=performance.now();}
    function ori(e){if(e.gamma==null||e.beta==null)return;st.gyro={x:clamp(e.gamma/25,-1,1),y:clamp((e.beta-45)/25,-1,1),t:performance.now()};}
    stage.addEventListener('pointerdown',down);
    stage.addEventListener('pointermove',move);
    stage.addEventListener('pointerup',up);
    stage.addEventListener('pointercancel',up);
    stage.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')up();});
    /* Pas de demande d'autorisation : on n'écoute que si le navigateur fournit déjà les données. */
    window.addEventListener('deviceorientation',ori);
    function frame(t){
      if(!st.alive)return;
      var tx=0,ty=0,now=performance.now();
      if(st.drag||st.hover){tx=st.tx;ty=st.ty;}
      else if(st.gyro&&now-st.gyro.t<500){tx=st.gyro.x;ty=st.gyro.y;}
      else if(!calm&&now-st.last>900){tx=Math.sin(t/1400)*0.42;ty=Math.cos(t/1900)*0.22;}
      var k=st.drag?0.32:0.08;
      st.x+=(tx-st.x)*k;st.y+=(ty-st.y)*k;
      var s=tilt.style;
      s.setProperty('--ry',(st.x*26).toFixed(2)+'deg');
      s.setProperty('--rx',(-st.y*22).toFixed(2)+'deg');
      s.setProperty('--mx',(50+st.x*42).toFixed(1)+'%');
      s.setProperty('--my',(36+st.y*42).toFixed(1)+'%');
      s.setProperty('--sx',(50+st.x*70).toFixed(1)+'%');
      s.setProperty('--hx',(50+st.x*60).toFixed(1)+'%');
      s.setProperty('--hy',(50+st.y*60).toFixed(1)+'%');
      st.raf=requestAnimationFrame(frame);
    }
    st.raf=requestAnimationFrame(frame);
    return {stop:function(){st.alive=false;cancelAnimationFrame(st.raf);window.removeEventListener('deviceorientation',ori);}};
  }

  /* ---------- Piège à focus ---------- */
  function focusables(root){
    return [].slice.call(root.querySelectorAll('button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')).filter(function(x){return x.offsetParent!==null||x===document.activeElement;});
  }
  function trap(e,root){
    if(e.key!=='Tab')return;
    var f=focusables(root);if(!f.length)return;
    var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===a||!root.contains(document.activeElement))){e.preventDefault();z.focus();}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
  }

  /* ---------- Fiche détaillée ---------- */
  var sheet=null;
  function sheetBody(b){
    var status;
    if(b.unlocked){
      status='<div class="tb-got">'+ICON.check+'<span>'+(b.date?'Obtenu le '+esc(fmtDate(b.date)):'Trophée obtenu')+'</span></div>';
    }else{
      var p=b.progress;
      status=p&&p.max>1?'<div class="tb-status">'+bar(p)+'</div>':'<div class="tb-got" style="color:rgba(255,255,255,.75)"><span class="tb-lock" style="position:static;width:24px;height:24px">'+ICON.lock+'</span><span>Pas encore débloqué</span></div>';
    }
    return '<div class="tb-info">'
      +'<span class="tb-chip tb-t-'+b.tier+'"><i></i>'+esc(b.tierLabel)+'</span>'
      +'<h2 id="tbSheetTitle">'+esc(b.name)+'</h2>'
      +'<p class="tb-fam">'+esc(b.groupLabel)+' · Ocean Buddy</p>'
      +'<div class="tb-card"><h3>'+(b.unlocked?'Ton exploit':'Comment l’obtenir')+'</h3><p id="tbSheetDesc">'+esc(b.unlocked&&b.done?b.done:b.how)+'</p>'
      +(b.unlocked&&b.done?'<p style="margin-top:6px;font-size:12.5px;color:rgba(220,232,255,.66)">'+esc(b.how)+'</p>':'')
      +status+'</div>'
      +'<div class="tb-actions">'
      +(b.unlocked?'<button type="button" class="tb-btn tb-btn-main" data-tb-act="share">'+ICON.share+'<span>Partager</span></button>':'')
      +'<button type="button" class="tb-btn tb-btn-ghost" data-tb-act="close">Fermer</button></div></div>';
  }
  function fillSheet(b){
    var s=sheet;s.id=b.id;
    s.panel.className='tb-sheet tb-t-'+b.tier;
    s.tilt.innerHTML=medalHTML(b,{edges:true});
    s.stage.setAttribute('aria-label','Médaille '+b.name+(b.unlocked?'':' (verrouillée)')+'. Fais-la pivoter du doigt.');
    s.body.innerHTML=sheetBody(b);
    if(b.unlocked)setTimeout(function(){if(sheet&&sheet.id===b.id)cardBlob(b.id).catch(function(){});},450);
    /* Fiche sans défilement : tout le panneau peut être glissé vers le bas. */
    requestAnimationFrame(function(){if(sheet===s)s.panel.style.touchAction=s.panel.scrollHeight>s.panel.clientHeight+2?'':'none';});
    var L=list(),i=L.map(function(x){return x.id;}).indexOf(b.id);
    s.prev.dataset.to=L[(i-1+L.length)%L.length].id;
    s.next.dataset.to=L[(i+1)%L.length].id;
    s.prev.setAttribute('aria-label','Trophée précédent : '+L[(i-1+L.length)%L.length].name);
    s.next.setAttribute('aria-label','Trophée suivant : '+L[(i+1)%L.length].name);
  }
  function open(id,opener){
    var b=find(id);if(!b)return false;
    if(sheet){fillSheet(b);return true;}
    var wrap=document.createElement('div');
    wrap.className='tb-sheet-wrap'+(reduced()?' tb-rm':'');
    wrap.innerHTML='<div class="tb-scrim" data-tb-act="close"></div>'
      +'<section class="tb-sheet" role="dialog" aria-modal="true" aria-labelledby="tbSheetTitle" aria-describedby="tbSheetDesc" tabindex="-1">'
      +'<div class="tb-grab" aria-hidden="true"></div>'
      +'<button type="button" class="tb-x" data-tb-act="close" aria-label="Fermer">'+ICON.close+'</button>'
      +'<div class="tb-hero"><div class="tb-stage3d" role="img"><div class="tb-tilt"></div><div class="tb-floor" aria-hidden="true"></div></div>'
      +'<button type="button" class="tb-nav tb-prev" data-tb-act="nav">'+ICON.prev+'</button>'
      +'<button type="button" class="tb-nav tb-next" data-tb-act="nav">'+ICON.next+'</button></div>'
      +'<p class="tb-tip" aria-hidden="true">Fais pivoter la médaille</p>'
      +'<div class="tb-body"></div></section>';
    document.body.appendChild(wrap);
    sheet={wrap:wrap,panel:wrap.querySelector('.tb-sheet'),stage:wrap.querySelector('.tb-stage3d'),tilt:wrap.querySelector('.tb-tilt'),
      body:wrap.querySelector('.tb-body'),prev:wrap.querySelector('.tb-prev'),next:wrap.querySelector('.tb-next'),
      opener:opener||document.activeElement,id:id};
    fillSheet(b);
    sheet.ctl=tiltController(sheet.stage,sheet.tilt);
    wrap.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('[data-tb-act]');if(!a)return;
      var act=a.getAttribute('data-tb-act');
      if(act==='close')closeSheet();
      else if(act==='nav'){var to=find(a.dataset.to);if(to){fillSheet(to);buzz(6);}}
      else if(act==='share')share(sheet.id,a);
    });
    wrap.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();closeSheet();}
      else if(e.key==='ArrowLeft'){sheet.prev.click();}
      else if(e.key==='ArrowRight'){sheet.next.click();}
      else trap(e,sheet.panel);
    });
    dragToClose(sheet);
    requestAnimationFrame(function(){requestAnimationFrame(function(){wrap.classList.add('tb-on');});});
    setTimeout(function(){try{wrap.querySelector('.tb-x').focus({preventScroll:true});}catch(e){}},60);
    buzz(8);
    return true;
  }
  function closeSheet(){
    if(!sheet)return;
    var s=sheet;sheet=null;
    s.ctl&&s.ctl.stop();
    s.wrap.classList.remove('tb-on');
    s.panel.style.transform='';
    setTimeout(function(){s.wrap.remove();},reduced()?260:460);
    try{if(s.opener&&document.contains(s.opener))s.opener.focus({preventScroll:true});
      else{var t=document.querySelector('[data-tb="'+s.id+'"]');if(t)t.focus({preventScroll:true});}}catch(e){}
  }
  /* Glisser la fiche vers le bas pour la fermer (mobile). */
  function dragToClose(s){
    var y0=null,dy=0;
    s.panel.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'||s.panel.scrollTop>0)return;
      if(e.target.closest('.tb-stage3d,button'))return;
      y0=e.clientY;dy=0;s.panel.style.transition='none';
    });
    s.panel.addEventListener('pointermove',function(e){if(y0==null)return;dy=Math.max(0,e.clientY-y0);s.panel.style.transform='translateY('+dy+'px)';});
    function end(){if(y0==null)return;y0=null;s.panel.style.transition='';if(dy>110)closeSheet();else s.panel.style.transform='';}
    s.panel.addEventListener('pointerup',end);s.panel.addEventListener('pointercancel',end);
  }

  /* ---------- Carte « story » 1080 × 1920 ---------- */
  function loadImg(src){return new Promise(function(res,rej){var i=new Image();i.decoding='async';i.onload=function(){res(i);};i.onerror=rej;i.src=src;});}
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function spaced(c,px){try{c.letterSpacing=px+'px';}catch(e){}}
  function wrapLines(c,text,maxW){
    var words=String(text).split(/\s+/),lines=[],cur='';
    words.forEach(function(w){var t=cur?cur+' '+w:w;if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});
    if(cur)lines.push(cur);return lines;
  }
  var TIER_PAINT={
    common:['#f6c296','#a8622f','#3d1d05','rgba(240,160,100,.55)'],
    rare:['#eef4ff','#8ea6cc','#13284f','rgba(170,205,255,.55)'],
    epic:['#ffe08a','#d0901a','#3b2500','rgba(255,196,64,.6)'],
    legendary:[null,null,'#2a0f45','rgba(196,150,255,.7)']
  };
  function card(id){
    var b=find(id);if(!b)return Promise.reject(new Error('trophée inconnu'));
    var W=1080,H=1920;
    var fonts=document.fonts&&document.fonts.load?Promise.all([
      document.fonts.load('800 150px "Barlow Condensed"'),document.fonts.load('700 36px "DM Sans"'),document.fonts.load('500 36px "DM Sans"')
    ]).catch(function(){}):Promise.resolve();
    return Promise.all([loadImg(b.hd).catch(function(){return loadImg(b.img);}),fonts]).then(function(r){
      var img=r[0],cv=document.createElement('canvas');cv.width=W;cv.height=H;
      var c=cv.getContext('2d'),tp=TIER_PAINT[b.tier];
      /* Fond océan */
      var g=c.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#05164a');g.addColorStop(.42,'#0f3596');g.addColorStop(.78,'#1f55e0');g.addColorStop(1,'#1aa6d6');
      c.fillStyle=g;c.fillRect(0,0,W,H);
      var glow=c.createRadialGradient(W/2,760,40,W/2,760,640);
      glow.addColorStop(0,tp[3]);glow.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=glow;c.fillRect(0,0,W,H);
      /* Rayons */
      c.save();c.translate(W/2,760);
      for(var k=0;k<24;k++){c.rotate(Math.PI*2/24);var rg=c.createLinearGradient(0,0,0,-900);rg.addColorStop(0,'rgba(255,255,255,.10)');rg.addColorStop(1,'rgba(255,255,255,0)');
        c.fillStyle=rg;c.beginPath();c.moveTo(0,0);c.lineTo(-38,-900);c.lineTo(38,-900);c.closePath();c.fill();}
      c.restore();
      /* Étincelles (positions fixes) */
      var seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
      for(var s=0;s<70;s++){var x=rnd()*W,y=rnd()*1300,rad=rnd()*2.6+0.6;c.fillStyle='rgba(255,255,255,'+(0.25+rnd()*0.5).toFixed(2)+')';c.beginPath();c.arc(x,y,rad,0,7);c.fill();}
      /* Vagues */
      [[1640,'rgba(255,255,255,.07)',38],[1720,'rgba(255,255,255,.09)',30],[1800,'rgba(224,255,145,.12)',24]].forEach(function(w,j){
        c.fillStyle=w[1];c.beginPath();c.moveTo(0,H);
        for(var x=0;x<=W;x+=20)c.lineTo(x,w[0]+Math.sin(x/150+j*1.7)*w[2]);
        c.lineTo(W,H);c.closePath();c.fill();
      });
      /* Logotype */
      c.textAlign='left';c.textBaseline='alphabetic';
      c.font='800 64px "Barlow Condensed", Impact, sans-serif';spaced(c,4);
      var w1=c.measureText('OCEAN ').width,w2=c.measureText('BUDDY').width,x0=(W-w1-w2)/2;
      c.fillStyle='#ffffff';c.fillText('OCEAN ',x0,170);c.fillStyle='#e0ff91';c.fillText('BUDDY',x0+w1,170);
      c.textAlign='center';
      c.font='700 32px "DM Sans", system-ui, sans-serif';spaced(c,9);c.fillStyle='#e0ff91';
      c.fillText(T('TROPHÉE DÉBLOQUÉ'),W/2,262);
      /* Médaille */
      c.save();c.shadowColor='rgba(0,6,30,.55)';c.shadowBlur=70;c.shadowOffsetY=34;
      c.drawImage(img,W/2-380,380,760,760);c.restore();
      /* Nom */
      c.fillStyle='#ffffff';spaced(c,2);
      var name=T(b.name).toUpperCase(),fs=170;
      do{c.font='800 '+fs+'px "Barlow Condensed", Impact, sans-serif';fs-=6;}while(c.measureText(name).width>960&&fs>70);
      c.fillText(name,W/2,1300);
      /* Rareté */
      c.font='800 34px "DM Sans", system-ui, sans-serif';spaced(c,8);
      var lab=T(b.tierLabel).toUpperCase(),lw=c.measureText(lab).width+84,lx=(W-lw)/2,ly=1352;
      var pg=c.createLinearGradient(lx,0,lx+lw,0);
      if(b.tier==='legendary'){pg.addColorStop(0,'#ffb2e0');pg.addColorStop(.35,'#9eeaff');pg.addColorStop(.65,'#d2b2ff');pg.addColorStop(1,'#ffe39a');}
      else{pg.addColorStop(0,tp[0]);pg.addColorStop(1,tp[1]);}
      c.fillStyle=pg;rr(c,lx,ly,lw,72,36);c.fill();
      c.fillStyle=tp[2];c.fillText(lab,W/2+4,ly+49);
      /* Date et exploit */
      spaced(c,0);
      c.font='600 38px "DM Sans", system-ui, sans-serif';c.fillStyle='rgba(255,255,255,.92)';
      c.fillText(b.date?T('Obtenu le')+' '+fmtDate(b.date):T('Trophée obtenu'),W/2,1510);
      c.font='500 34px "DM Sans", system-ui, sans-serif';c.fillStyle='rgba(225,236,255,.78)';
      wrapLines(c,T(b.done||b.how),860).slice(0,2).forEach(function(l,j){c.fillText(l,W/2,1572+j*46);});
      c.font='700 28px "DM Sans", system-ui, sans-serif';spaced(c,6);c.fillStyle='rgba(255,255,255,.75)';
      c.fillText(T('EXPLORE. PROGRESSE. PROTÈGE.'),W/2,1850);
      spaced(c,0);
      return cv;
    });
  }
  function toBlob(cv){return new Promise(function(res){if(cv.toBlob)cv.toBlob(res,'image/png');else res(null);});}
  /* La carte est préparée dès l'ouverture de la fiche : au toucher de « Partager »,
     navigator.share part tout de suite (iOS exige un geste récent). */
  var cards={};
  function cardBlob(id){
    var b=find(id),key=id+'|'+(b&&b.date||'');
    if(!cards[key])cards[key]=card(id).then(toBlob).catch(function(e){delete cards[key];throw e;});
    return cards[key];
  }
  function download(blob,name){
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},4000);
    say('Image du trophée enregistrée');
  }
  function blobToB64(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1]);};r.onerror=rej;r.readAsDataURL(blob);});}
  function share(id,btn){
    var b=find(id);if(!b||!b.unlocked)return Promise.resolve(false);
    if(btn)btn.disabled=true;
    var name='ocean-buddy-trophee-'+id+'.png',text='Nouveau trophée Ocean Buddy : '+b.name+' 🏅';
    return cardBlob(id).then(function(blob){
      if(!blob)throw new Error('canvas');
      var Cap=window.Capacitor,P=Cap&&Cap.Plugins;
      /* App iOS/Android : fichier temporaire + feuille de partage native. */
      if(Cap&&Cap.isNativePlatform&&Cap.isNativePlatform()&&P&&P.Share&&P.Filesystem){
        return blobToB64(blob).then(function(data){return P.Filesystem.writeFile({path:name,data:data,directory:'CACHE'});})
          .then(function(f){return P.Share.share({title:'Ocean Buddy',text:text,files:[f.uri],dialogTitle:'Partager mon trophée'});})
          .then(function(){return true;});
      }
      var file=null;try{file=new File([blob],name,{type:'image/png'});}catch(e){}
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
        return navigator.share({files:[file],title:'Ocean Buddy',text:text}).then(function(){return true;},function(e){
          if(e&&e.name==='AbortError')return false;download(blob,name);return true;});
      }
      download(blob,name);return true;
    }).catch(function(e){if(!(e&&e.name==='AbortError'))say('Partage impossible pour le moment');return false;})
      .then(function(r){if(btn)btn.disabled=false;return r;});
  }

  /* ---------- Célébration ---------- */
  var queue=[],showing=null,timer=0,batch={i:0,n:0},prevFocus=null,ready={};
  function enqueue(id){if(!find(id))return;if(queue.indexOf(id)<0&&(!showing||showing.id!==id))queue.push(id);}
  function schedule(ms){if(showing)return;clearTimeout(timer);timer=setTimeout(nextCele,ms||0);}
  function sparks(){
    var cols=['#e0ff91','#ffffff','#8fd7ff','#ffd667','#ff9a7a'],h='';
    for(var i=0;i<30;i++){
      var a=(i/30)*Math.PI*2+Math.random()*0.35,d=150+Math.random()*150,s=8+Math.random()*16;
      h+='<i class="'+(i%3===0?'tb-dot':'')+'" style="--x:'+(Math.cos(a)*d).toFixed(0)+'px;--y:'+(Math.sin(a)*d).toFixed(0)+'px;--s:'+s.toFixed(0)+'px;--c:'+cols[i%cols.length]+';--d:'+(1.2+Math.random()*0.9).toFixed(2)+'s;--dl:'+(0.62+Math.random()*0.25).toFixed(2)+'s"></i>';
    }
    return h;
  }
  function nextCele(){
    if(showing)return;
    var id=queue.shift();
    if(!id){batch={i:0,n:0};document.body.classList.remove('tb-celebrating');
      if(prevFocus){try{prevFocus.focus({preventScroll:true});}catch(e){}prevFocus=null;}return;}
    var b=find(id);if(!b){nextCele();return;}
    if(!ready[id]){
      /* Image HD préchargée pour que la médaille arrive nette dès la première image. */
      var pend={id:id,el:null,pending:true};showing=pend;
      var go=function(){if(showing!==pend)return;showing=null;ready[id]=1;queue.unshift(id);nextCele();};
      loadImg(b.hd).then(go,go);setTimeout(go,1500);return;
    }
    if(!batch.n){prevFocus=document.activeElement;batch.i=0;}
    batch.i++;batch.n=batch.i+queue.length;
    if(sheet)closeSheet();
    var rm=reduced(),el=document.createElement('div');
    el.className='tb-cele tb-t-'+b.tier+(rm?' tb-rm':'');
    el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','tbCeleTitle');el.setAttribute('aria-describedby','tbCeleDone');
    var more=queue.length>0;
    el.innerHTML='<div class="tb-cele-fx" aria-hidden="true"><div class="tb-cele-bg"></div><div class="tb-rays"></div></div>'
      +'<div class="tb-cele-stage" aria-hidden="true"><div class="tb-halo"></div><div class="tb-wave"></div><div class="tb-wave w2"></div>'
      +'<div class="tb-cmedal">'+medalHTML(b,{sweep:true})+'</div><div class="tb-sparks">'+(rm?'':sparks())+'</div></div>'
      +'<div class="tb-cele-txt">'
      +'<p class="tb-cele-eyebrow">'+(batch.n>1?'Nouveau trophée · '+batch.i+' / '+batch.n:'Nouveau trophée')+'</p>'
      +'<h2 id="tbCeleTitle">'+esc(b.name)+'</h2>'
      +'<div><span class="tb-chip tb-t-'+b.tier+'"><i></i>'+esc(b.tierLabel)+'</span></div>'
      +'<p class="tb-cele-done" id="tbCeleDone">'+esc(b.done||b.how)+'</p></div>'
      +'<div class="tb-cele-actions">'
      +'<button type="button" class="tb-btn tb-btn-main" data-tb-c="see">Voir mes trophées</button>'
      +'<button type="button" class="tb-btn tb-btn-ghost" data-tb-c="next">'+(more?'Suivant':'Continuer')+'</button></div>';
    document.body.appendChild(el);
    document.body.classList.add('tb-celebrating');
    showing={id:id,el:el};
    el.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('[data-tb-c]');if(!a)return;
      if(a.getAttribute('data-tb-c')==='see')seeShelf();else endCele(true);
    });
    el.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();endCele(true);}else trap(e,el);});
    requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('tb-on');});});
    setTimeout(function(){buzz([12,40,26]);},rm?0:760);
    setTimeout(function(){try{el.querySelector('[data-tb-c="next"]').focus({preventScroll:true});}catch(e){}},rm?80:1500);
  }
  function endCele(goOn){
    if(!showing)return;
    var el=showing.el;showing=null;
    el.style.transition='opacity .32s ease';el.style.opacity='0';
    setTimeout(function(){el.remove();},340);
    if(goOn&&queue.length)setTimeout(nextCele,360);
    else{queue.length=0;setTimeout(nextCele,0);}
  }
  function seeShelf(){
    var all=[showing&&showing.id].concat(queue).filter(Boolean);
    queue.length=0;endCele(false);
    try{var qm=document.getElementById('quizModal');if(qm&&qm.classList.contains('open')&&typeof closeQuiz==='function')closeQuiz();}catch(e){}
    try{if(typeof go==='function'&&document.body.dataset.screen!=='profile')go('profile');}catch(e){}
    setTimeout(function(){
      var host=document.getElementById('badges');if(!host)return;
      var tiles=all.map(function(id){return host.querySelector('[data-tb="'+id+'"]');}).filter(Boolean);
      var target=tiles[0]||host;
      try{target.scrollIntoView({block:tiles.length?'center':'start',behavior:reduced()?'auto':'smooth'});}catch(e){target.scrollIntoView();}
      tiles.forEach(function(t){t.classList.add('tb-new');setTimeout(function(){t.classList.remove('tb-new');},4600);});
    },reduced()?120:520);
  }
  function celebrate(id){if(!find(id))return false;enqueue(id);schedule(0);return true;}
  /* Échap fonctionne même si le focus n'est pas encore dans la fenêtre. */
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    if(showing&&showing.el&&!showing.el.contains(document.activeElement)){e.preventDefault();endCele(true);}
    else if(!showing&&sheet&&!sheet.wrap.contains(document.activeElement)){e.preventDefault();closeSheet();}
  });

  /* ---------- Remplacement des fonctions d'app.js ---------- */
  var knownQuiz=quizUnlocked(),booted=false;
  window.renderBadges=renderShelf;
  window.renderQuizBadges=function(){
    var cur=quizUnlocked(),fresh=cur.filter(function(id){return knownQuiz.indexOf(id)<0;});
    knownQuiz=cur;
    var q=document.getElementById('quizBadgesProfile');if(q)q.innerHTML='';
    renderShelf();
    if(booted&&fresh.length){
      fresh.forEach(enqueue);
      /* « Compétiteur » se débloque avec le premier thème réussi. */
      try{window.checkBadges();}catch(e){}
      schedule(1300);
    }
  };
  window.checkBadges=function(){
    if(!window.OceanProgress)return;
    var got=[];try{got=OceanProgress.newBadges(ctx());}catch(e){}
    if(!got.length)return;
    syncDates();
    try{renderShelf();if(typeof renderProfile==='function')renderProfile();}catch(e){}
    got.forEach(function(b){enqueue(b.id);});
    schedule(1100);
  };

  window.OceanBadges={
    open:open,
    close:closeSheet,
    celebrate:celebrate,
    list:list,
    card:card,
    share:share,
    render:renderShelf,
    ready:true
  };

  function boot(){
    syncDates();
    try{renderShelf();}catch(e){}
    booted=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
