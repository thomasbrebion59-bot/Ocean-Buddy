/* Mises à jour de l’app mobile.
 * - « live » : le nouveau contenu est déjà téléchargé, il s’installe en un geste (fenêtre en bas d’écran, inchangée) ;
 * - « store » : la coque native est trop vieille pour recevoir les mises à jour directes (sous native_min) et une version
 *   plus récente est sur l’App Store. Écran entier « Mets à jour Ocean Buddy », rappelé à chaque lancement et à chaque
 *   retour dans l’app après au moins 10 minutes ailleurs ; « Plus tard » ne le ferme que pour ce moment-là ;
 * - « reminder » : une version plus récente est sur l’App Store mais la coque reçoit encore tout en direct. Petite
 *   bannière en bas d’écran, fermable, une seule fois par version de l’App Store.
 *   Jamais bloquant : tout se ferme. Quand proposer quoi : app-update-model.js.
 * Sur le site web, ce fichier ne fait rien. */
(function(){
  const M=window.OceanMobile;
  if(!M||!M.native||!M.updates)return;
  const U=window.AppUpdateModel;
  if(!U)return;
  /* L’ancien silence de 3 jours n’existe plus. */
  const storage=()=>{try{return window.localStorage;}catch(_){return null;}};
  U.forgetLegacySnooze(storage());
  let state=U.initial(),open=null,pending=null,running=false;
  /* Barre d’état : l’écran entier est crème, l’heure et la batterie passent en foncé le temps qu’il est ouvert. */
  let bar='light',ownBar=false;
  window.addEventListener('ocean:statusbar',e=>{if(!ownBar&&e&&e.detail)bar=e.detail;});
  function setBar(v){ownBar=true;try{window.dispatchEvent(new CustomEvent('ocean:statusbar',{detail:v}));}catch(_){}finally{ownBar=false;}}
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};

  function onboarding(){const o=document.getElementById('onb');if(!o||!o.isConnected)return false;const st=getComputedStyle(o);return st.display!=='none'&&st.visibility!=='hidden'&&o.getClientRects().length>0;}

  /* Mise à jour directe prête : fenêtre en bas d’écran (comportement inchangé). */
  function showLive(){
    if(open)return;open='live';
    const wrap=document.createElement('div');
    wrap.className='app-update';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-labelledby','appUpdateTitle');
    wrap.innerHTML=`<div class="app-update-card"><img src="assets/poulpy/celebrate.webp" alt="">
      <span class="app-update-kicker">Mise à jour prête</span>
      <h2 id="appUpdateTitle">Ocean Buddy a fait peau neuve !</h2>
      <p>Les nouveautés sont déjà téléchargées : quelques secondes suffisent pour les installer.</p>
      <div class="app-update-actions"><button type="button" class="app-update-go">Mettre à jour maintenant</button><button type="button" class="app-update-later">Plus tard</button></div></div>`;
    document.body.append(wrap);requestAnimationFrame(()=>wrap.classList.add('show'));
    const go=wrap.querySelector('.app-update-go');
    const close=()=>{wrap.classList.remove('show');setTimeout(()=>wrap.remove(),260);open=null;};
    go.focus();
    go.addEventListener('click',()=>{go.disabled=true;go.textContent='Mise à jour…';M.updates.applyLive().catch(()=>{go.disabled=false;go.textContent='Réessayer';});});
    wrap.querySelector('.app-update-later').addEventListener('click',()=>{window.toast?.('👍 La mise à jour s’installera quand tu quitteras l’app');close();});
  }

  /* Nouvelle version sur l’App Store : écran entier, un seul grand bouton, « Plus tard » discret. */
  function showStore(version){
    if(open)return;open='store';
    const back=document.activeElement;
    const wrap=el('div','app-update');wrap.classList.add('is-store');
    wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
    wrap.setAttribute('aria-labelledby','appUpdateTitle');wrap.setAttribute('aria-describedby',['appUpdateText',version&&'appUpdateVersion'].filter(Boolean).join(' '));
    const page=el('div','app-update-screen'),main=el('div','app-update-main'),logo=el('div','app-update-logo'),img=el('img');
    img.setAttribute('src','assets/brand/manta-petrole-512.png');img.setAttribute('alt','');
    img.setAttribute('width','512');img.setAttribute('height','512');img.setAttribute('decoding','async');
    logo.append(img);
    const title=el('h2','app-update-title','Mets à jour Ocean Buddy');title.id='appUpdateTitle';
    const text=el('p','app-update-text','Une nouvelle version t’attend sur l’App Store.');text.id='appUpdateText';
    const ver=el('p','app-update-version');ver.id='appUpdateVersion';
    if(version)ver.textContent=`Version ${version}`;else ver.hidden=true;
    const cta=el('div','app-update-cta'),go=el('button','app-update-go','Mettre à jour'),later=el('button','app-update-later','Plus tard');
    go.type='button';later.type='button';
    main.append(logo,title,text,ver);cta.append(go,later);page.append(main,cta);wrap.append(page);

    let closed=false;
    /* Piège du focus : Tab et Maj+Tab restent entre les deux boutons ; un focus parti ailleurs revient au bouton. */
    const keep=e=>{if(!closed&&!wrap.contains(e.target))go.focus({preventScroll:true});};
    function close(){
      if(closed)return;closed=true;open=null;
      document.removeEventListener('focusin',keep,true);
      wrap.classList.remove('show');setTimeout(()=>wrap.remove(),260);
      setBar(bar);
      if(back&&back!==document.body&&back.isConnected&&typeof back.focus==='function')try{back.focus({preventScroll:true});}catch(_){}
    }
    wrap.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close();return;}
      if(e.key!=='Tab')return;
      const at=document.activeElement;
      if(e.shiftKey&&(at===go||!wrap.contains(at))){e.preventDefault();later.focus();}
      else if(!e.shiftKey&&(at===later||!wrap.contains(at))){e.preventDefault();go.focus();}
    });
    go.addEventListener('click',()=>{try{M.updates.openStore();}finally{close();}});
    later.addEventListener('click',close);

    document.body.append(wrap);
    document.addEventListener('focusin',keep,true);
    setBar('light');
    go.focus({preventScroll:true});
    requestAnimationFrame(()=>wrap.classList.add('show'));
  }

  /* Rappel discret : bannière non bloquante au-dessus de la barre du bas, sans piège de focus, une fois par version. */
  function showReminder(version){
    if(open)return;open='reminder';
    const wrap=el('div','app-update-reminder');
    wrap.setAttribute('role','status');wrap.setAttribute('aria-live','polite');
    const body=el('div','app-update-reminder-text'),text=el('p','app-update-reminder-title','Une nouvelle version t’attend sur l’App Store.');
    body.append(text);
    if(version)body.append(el('p','app-update-reminder-version',`Version ${version}`));
    const acts=el('div','app-update-reminder-actions'),go=el('button','app-update-reminder-go','Mettre à jour'),later=el('button','app-update-reminder-later','Plus tard');
    go.type='button';later.type='button';acts.append(go,later);wrap.append(body,acts);
    const close=()=>{wrap.classList.remove('show');setTimeout(()=>wrap.remove(),260);open=null;};
    go.addEventListener('click',()=>{try{M.updates.openStore();}finally{close();}});
    later.addEventListener('click',close);
    wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
    document.body.append(wrap);
    requestAnimationFrame(()=>wrap.classList.add('show'));
  }

  // Le téléchargement se fait tout de suite ; la fenêtre attend la fin de l’accueil, la fermeture de « Crée ton compte » (.oba)
  // et celle des feuilles <dialog> (page d’un pays, voyage…), qui passeraient sinon par-dessus elle.
  function showWhenFree(next){
    pending=next.kind;
    if(onboarding()||document.hidden||document.querySelector('.oba,dialog[open]')){setTimeout(()=>showWhenFree(next),5000);return;}
    pending=null;
    if(next.kind==='live')showLive();
    else if(next.kind==='reminder'){if(!next.unsure)U.markReminder(storage(),next.version);showReminder(next.version);}
    else showStore(next.version);
  }
  const screen=()=>open||pending||null;

  async function check(){
    if(running||document.hidden)return;
    const now=Date.now(),todo=U.plan(state,now,screen());
    if(!todo.live&&!todo.store)return;
    running=true;
    try{
      let live=null,store=null,liveFailed=false;
      if(todo.live){
        let liveOk=true;
        state=U.liveChecked(state,now);live=await M.updates.checkLive().catch(()=>{liveOk=false;return null;});
        liveFailed=!liveOk;
        state=U.liveResult(state,live,liveOk);
      }
      if(todo.store&&!(live&&live.kind==='live')){
        let ok=true;
        store=await M.updates.checkStore().catch(()=>{ok=false;return null;});
        state=U.storeChecked(state,ok);
      }
      const next=U.decide(live,store,state.forced,U.reminderSeen(storage()),liveFailed);
      if(next)showWhenFree(next);
    }finally{running=false;}
  }
  setTimeout(check,U.FIRST_CHECK);
  document.addEventListener('visibilitychange',()=>{
    const now=Date.now();
    if(document.hidden){state=U.hidden(state,now);return;}
    state=U.visible(state,now,screen());
    check();
  });
})();
