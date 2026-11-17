/* Compte et sauvegarde (compte gratuit, facultatif) : interface et synchronisation.
   Chargé par privacy.js APRÈS la levée du rideau, seulement si le drapeau du compte est actif (désactivé par défaut).
   Règles de démarrage (AGENTS.md) : rien n'est écrit sur l'accueil ni dans la barre d'onglets ; tout ce qui apparaît est
   une feuille ou une bulle en position fixe (aucun décalage), ou une section des Réglages (fenêtre fermée au chargement).
   Le navigateur ne parle qu'à /api/v1 (même domaine, cookies HttpOnly) : aucun jeton ni clé n'est lisible ici.
   App iPhone (1.5.0 et plus, capacité « account ») : les requêtes passent par OceanMobile.account.request (mobile/client.js,
   CapacitorHttp + Trousseau iOS) ; ce fichier ne voit jamais les jetons non plus.
   Les données reçues sont écrites dans localStorage puis l'app est RECHARGÉE à un moment sûr (jamais de modification à chaud). */
(()=>{
  'use strict';
  const M=window.OceanAccountModel;if(!M||window.OceanAccount)return;
  const API='/api/v1',STATE_KEY='oceanbuddy_sync_v1',BACKUP_KEY='oceanbuddy_sync_backup_v1',AFTER_KEY='ob_account_after';
  const CONSENT_VERSION='2026-11',BACKUP_DAYS=30;
  const loadedAt=Date.now();let userActive=false,me=null,mode=null;
  const MOB=window.OceanMobile,NATIVE=!!(MOB&&MOB.native&&MOB.capabilities&&MOB.capabilities.account===true&&MOB.account&&typeof MOB.account.request==='function');
  ['pointerdown','keydown'].forEach(t=>addEventListener(t,()=>{userActive=true;},{capture:true,passive:true}));

  /* ---------- état local (aucun jeton, aucune adresse e-mail) ---------- */
  function load(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||'null');if(s&&typeof s==='object')return {...M.freshState(),...s};}catch(_){}return M.freshState();}
  function save(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(_){}}
  function patch(p){const s={...load(),...p};save(s);return s;}

  /* ---------- appels à l'API ---------- */
  const MESSAGES={invalid_email:'Vérifie ton adresse e-mail.',invalid_code:'Ce code ne fonctionne pas. Vérifie-le ou demande un nouveau code.',
    rate_limited:'Trop d’essais. Réessaie dans quelques minutes.',email_budget:'Trop de codes envoyés aujourd’hui. Réessaie demain.',
    network:'Pas de connexion. Réessaie quand tu es en ligne.',account_full:'Ton compte est plein : supprime d’anciens voyages ou notes.',
    reauth_required:'Pour supprimer ton compte, confirme d’abord ton adresse avec un nouveau code.'};
  const message=e=>MESSAGES[e&&e.code]||'Le service de compte ne répond pas. Réessaie plus tard.';
  let refreshing=null;
  async function raw(path,{method='GET',body}={}){
    if(NATIVE)return MOB.account.request(path,{method,body});
    let r;try{r=await fetch(API+path,{method,credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','x-ob-csrf':'1'},body:body===undefined?undefined:JSON.stringify(body)});}
    catch(_){const e=Error('network');e.code='network';throw e;}
    const data=await r.json().catch(()=>null);
    if(!r.ok){const e=Error((data&&data.error)||'http_'+r.status);e.code=data&&data.error;e.status=r.status;throw e;}
    return data;
  }
  async function api(path,opts={}){
    try{return await raw(path,opts);}
    catch(e){
      if(e.status!==401||path.startsWith('/auth/'))throw e;
      /* Délier seulement si la session est refusée (401) ; une coupure réseau ou un 429/503 garde la connexion. */
      refreshing??=raw('/auth/refresh',{method:'POST',body:{}}).then(()=>true,x=>x&&x.status===401?false:null).finally(()=>setTimeout(()=>{refreshing=null;},0));
      const ok=await refreshing;
      if(ok===false){patch({linked:false});renderSettings();throw e;}
      if(!ok)throw e;
      return raw(path,opts);
    }
  }

  /* ---------- synchronisation ---------- */
  /* Fenêtres déjà ouvertes : l'invitation attend (mise à jour de l'app, trophée et feuilles <dialog> compris, comme la page
     d'un pays ouverte par un lien #culture= : jamais deux feuilles à la fois). */
  const overlayOpen=()=>!!document.querySelector('.oba,.as-confirm,.quiz-modal.open,.aqi.open,.app-update,.tb-cele,dialog[open]')||document.body.classList.contains('onb-open');
  const typing=()=>{const a=document.activeElement;return !!a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.isContentEditable);};
  /* Moment sûr pour recharger : app en arrière-plan, ou tout début de visite sans geste, sans fenêtre ouverte, sans saisie. */
  function safeNow(mode){if(mode==='now')return true;if(mode==='never')return false;
    return document.hidden||(!userActive&&Date.now()-loadedAt<20000&&!overlayOpen()&&!typing());}
  function memory(){const m=new Map();for(const k of Object.values(M.KEYS)){const v=localStorage.getItem(k);if(v!=null)m.set(k,v);}
    return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
  let syncing=null;
  function sync(opts={}){syncing??=run(opts).finally(()=>{syncing=null;});return syncing;}
  async function run({first=false,apply='auto'}={}){
    const now=Date.now();let st=load();
    const local=M.collect(localStorage);
    const base=first?{...M.freshState()}:{v:1,lastRev:st.lastRev,shadow:st.shadow,pend:st.pend};
    const scanned=M.scan(local,base,now);
    if(!first)patch({pend:scanned.pend});
    let since=first?0:(scanned.lastRev||0);const remote=[];
    for(let i=0;i<40;i++){const r=await api('/sync/pull',{method:'POST',body:{since}});remote.push(...r.items);
      if(r.items.length)since=Math.max(since,...r.items.map(x=>x.rev));if(!r.more)break;}
    const m=M.merge(local,remote,scanned,{now,first});
    const changes=M.apply(memory(),m.local);
    if(changes.length&&!safeNow(apply)){patch({waiting:true});return {waiting:true,summary:m.summary};}
    let ns=m.state;
    for(let i=0;i<m.push.length;i+=M.LIMITS.itemsPerPush){const r=await api('/sync/push',{method:'POST',body:{items:m.push.slice(i,i+M.LIMITS.itemsPerPush)}});ns=M.acknowledge(ns,r.results);}
    st=patch({lastRev:ns.lastRev,shadow:ns.shadow,pend:ns.pend,lastSync:Date.now(),waiting:false});
    if(changes.length){
      M.apply(localStorage,m.local);
      try{sessionStorage.setItem(AFTER_KEY,JSON.stringify({first,summary:m.summary}));}catch(_){}
      try{await window.OceanMobile?.persist?.();}catch(_){}
      location.reload();
    }
    renderSettings();
    return {summary:m.summary,changed:changes.length};
  }

  /* ---------- feuille « Crée ton compte » ---------- */
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let sheet=null,flow={email:'',then:null};
  function closeSheet(){if(!sheet)return;const s=sheet;sheet=null;followKeyboard(false);s.classList.remove('open');setTimeout(()=>s.remove(),220);}
  /* Clavier de l'iPhone : la feuille suit la zone visible (visualViewport) pour que le champ et les boutons restent au-dessus. */
  let unfollow=null;
  function followKeyboard(on){
    const vv=window.visualViewport;
    if(!on||!vv){if(unfollow){unfollow();unfollow=null;}return;}
    if(unfollow)return;
    const fit=()=>{if(!sheet)return;sheet.style.top=Math.max(0,vv.offsetTop)+'px';sheet.style.height=vv.height+'px';};
    vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit);fit();
    unfollow=()=>{vv.removeEventListener('resize',fit);vv.removeEventListener('scroll',fit);};
  }
  function openSheet(step,opts={}){
    flow={...flow,...opts};
    if(!sheet){
      sheet=document.createElement('div');sheet.className='oba';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','obaTitle');
      sheet.innerHTML='<div class="oba-card"><button type="button" class="oba-x" aria-label="Fermer">✕</button><div class="oba-body"></div></div>';
      sheet.addEventListener('click',e=>{if(e.target===sheet||e.target.closest('.oba-x'))closeSheet();});
      sheet.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeSheet();}});
      document.body.append(sheet);followKeyboard(true);requestAnimationFrame(()=>sheet&&sheet.classList.add('open'));
    }
    STEPS[step]();
    if(mode===null)raw('/health').then(h=>{mode=h.mode;const hint=sheet&&sheet.querySelector('.oba-dev');if(hint&&mode==='essai-local')hint.hidden=false;}).catch(()=>{});
  }
  /* focus:false : rien n'est sélectionné d'office (première ouverture : pas de clavier qui surgit, « Plus tard » reste visible). */
  function body(html,{focus=true}={}){const b=sheet.querySelector('.oba-body');b.innerHTML=html;
    const f=focus?b.querySelector('input,button.oba-main'):sheet.querySelector('.oba-card');if(!focus)f.setAttribute('tabindex','-1');
    setTimeout(()=>f?.focus({preventScroll:true}),60);return b;}
  function busy(b,on){b.querySelectorAll('button,input').forEach(x=>{x.disabled=on;});}
  function error(b,e){const p=b.querySelector('.oba-err');if(p){p.textContent=message(e);p.hidden=false;}}
  const emailField=()=>`<label class="oba-lab" for="obaEmail">Adresse e-mail</label>
        <input id="obaEmail" class="oba-input" type="email" inputmode="email" autocomplete="email" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" maxlength="254" translate="no" value="${esc(flow.email)}">
        <p class="oba-err" role="alert" hidden></p>`;
  function emailForm(b){
    const input=b.querySelector('#obaEmail');
    const go=async()=>{flow.email=input.value.trim();if(!flow.email){error(b,{code:'invalid_email'});input.focus();return;}busy(b,true);
      try{await raw('/auth/otp/request',{method:'POST',body:{email:flow.email}});STEPS.code();}catch(e){busy(b,false);error(b,e);}};
    b.querySelector('.oba-main').onclick=go;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};
  }
  const STEPS={
    /* Première ouverture (après le choix de l'activité) : un seul écran, adresse e-mail comprise, et « Plus tard » bien visible. */
    invite(){
      const b=body(`<div class="oba-hero" aria-hidden="true">☁️</div><h2 id="obaTitle">Crée ton compte</h2>
        <p class="oba-lead">Retrouve tes favoris, tes voyages et ton passeport sur tous tes appareils.</p>
        ${emailField()}
        <button type="button" class="oba-main">Recevoir mon code</button><button type="button" class="oba-later">Plus tard</button>
        <p class="oba-small">Gratuit et sans mot de passe : un code arrive par e-mail. Déjà un compte ? Mets la même adresse.</p>
        <p class="oba-small">L’app reste utilisable sans compte. Réservé aux 15 ans et plus. <a href="privacy.html" target="_blank" rel="noopener">Confidentialité</a></p>`,{focus:false});
      emailForm(b);b.querySelector('.oba-later').onclick=closeSheet;
    },
    email(){
      const b=body(`<h2 id="obaTitle">Ton adresse e-mail</h2><p class="oba-lead">On t’envoie un code à 6 chiffres. Pas de mot de passe.</p>
        ${emailField()}
        <button type="button" class="oba-main">Recevoir mon code</button>
        <p class="oba-small">Réservé aux 15 ans et plus. <a href="privacy.html" target="_blank" rel="noopener">Confidentialité</a></p>`);
      emailForm(b);
    },
    code(){
      const b=body(`<h2 id="obaTitle">Entre ton code</h2><p class="oba-lead">Code envoyé à <b translate="no">${esc(flow.email)}</b>. Regarde aussi dans les indésirables.</p>
        <label class="oba-lab" for="obaCode">Code à 6 chiffres</label>
        <input id="obaCode" class="oba-input oba-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" enterkeyhint="done" translate="no">
        <p class="oba-dev" hidden>Essai local : le code est 123456.</p>
        <p class="oba-err" role="alert" hidden></p>
        <button type="button" class="oba-main">Valider</button>
        <div class="oba-links"><button type="button" class="oba-link" data-a="again">Renvoyer le code</button><button type="button" class="oba-link" data-a="change">Changer d’adresse</button></div>`);
      if(mode==='essai-local')b.querySelector('.oba-dev').hidden=false;
      const input=b.querySelector('#obaCode');
      const go=async()=>{const code=input.value.replace(/\D/g,'');if(code.length!==6){error(b,{code:'invalid_code'});return;}busy(b,true);
        try{await raw('/auth/otp/verify',{method:'POST',body:{email:flow.email,code}});patch({linked:true});await afterLogin();}catch(e){busy(b,false);error(b,e);}};
      b.querySelector('.oba-main').onclick=go;input.oninput=()=>{if(input.value.replace(/\D/g,'').length===6)go();};
      b.querySelector('[data-a="again"]').onclick=async()=>{try{await raw('/auth/otp/request',{method:'POST',body:{email:flow.email}});window.toast?.('Nouveau code envoyé 📬');}catch(e){error(b,e);}};
      b.querySelector('[data-a="change"]').onclick=()=>STEPS.email();
    },
    consent(){
      const b=body(`<h2 id="obaTitle">Sauvegarder ton activité</h2>
        <p class="oba-lead">Sauvegarder mes voyages, favoris, notes, sessions et progression sur mon compte.</p>
        <ul class="oba-points"><li>Gardé sur des serveurs en Europe (Cloudflare) ; ton identité est vérifiée par Supabase (Europe).</li>
        <li>Seulement pour retrouver tes données ; jamais vendu, jamais de publicité.</li><li>Tant que ton compte existe. Tu peux tout exporter ou tout supprimer depuis les Réglages.</li></ul>
        <label class="oba-check"><input type="checkbox" id="obaAge"> <span>J’ai 15 ans ou plus</span></label>
        <p class="oba-err" role="alert" hidden></p>
        <button type="button" class="oba-main">Activer la sauvegarde</button><button type="button" class="oba-later">Pas maintenant</button>`);
      b.querySelector('.oba-later').onclick=()=>{closeSheet();renderSettings();};
      b.querySelector('.oba-main').onclick=async()=>{if(!b.querySelector('#obaAge').checked){const p=b.querySelector('.oba-err');p.textContent='Coche la case pour continuer.';p.hidden=false;return;}
        busy(b,true);try{await api('/consent',{method:'POST',body:{version:CONSENT_VERSION}});await firstSync();}catch(e){busy(b,false);error(b,e);}};
    },
    syncing(){body(`<h2 id="obaTitle">Sauvegarde en cours…</h2><p class="oba-lead">On rassemble les données de cet appareil et de ton compte. Rien n’est supprimé.</p><div class="oba-spin" aria-hidden="true"></div>`);},
    done(){
      const s=flow.summary||{fromAccount:{trips:0},keptLocal:{trips:0},copies:0};
      const b=body(`<div class="oba-hero" aria-hidden="true">✅</div><h2 id="obaTitle">C’est sauvegardé</h2>
        <ul class="oba-points oba-sum">${s.fromAccount.trips?`<li><b>${s.fromAccount.trips}</b> <span>voyage(s) retrouvé(s) sur ton compte</span></li>`:''}
        ${s.keptLocal.trips?`<li><b>${s.keptLocal.trips}</b> <span>voyage(s) de cet appareil conservé(s)</span></li>`:''}
        ${s.copies?`<li><b>${s.copies}</b> <span>copie(s) gardée(s) dans la Corbeille des voyages</span></li>`:''}
        <li>Tes voyages, sessions et badges sont maintenant sur ton compte.</li></ul>
        <button type="button" class="oba-main">Continuer</button>`);
      b.querySelector('.oba-main').onclick=closeSheet;
    },
  };
  async function afterLogin(){
    try{me=await api('/me');}catch(e){me=null;}
    if(flow.then){const f=flow.then;flow.then=null;closeSheet();return f();}
    if(me&&me.consent){await firstSync();return;}
    STEPS.consent();
  }
  /* Première synchronisation de cet appareil : copie de sécurité, fusion (le compte gagne les conflits, rien de local n'est perdu). */
  async function firstSync(){
    try{localStorage.setItem(BACKUP_KEY,JSON.stringify({at:Date.now(),raw:M.snapshot(localStorage)}));}catch(_){}
    if(sheet)STEPS.syncing();
    try{const r=await sync({first:true,apply:'now'});flow.summary=r.summary;schedule();if(sheet)STEPS.done();}
    catch(e){if(sheet){STEPS.consent();error(sheet.querySelector('.oba-body'),e);}}
    renderSettings();
  }

  /* ---------- Réglages → Mon compte et sauvegarde ---------- */
  let section=null;
  const ago=t=>{if(!t)return 'jamais';const m=Math.round((Date.now()-t)/60000);return m<1?'à l’instant':m<60?`il y a ${m} min`:new Date(t).toLocaleString(document.documentElement.lang||'fr',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});};
  function mountSettings(){
    const card=document.querySelector('#settingsModal .set-card'),title=card&&card.querySelector('.set-title');if(!card||!title)return;
    section=document.createElement('section');section.className='oba-set';section.id='obaSettings';section.setAttribute('aria-labelledby','obaSetTitle');
    title.after(section);renderSettings();
    new MutationObserver(()=>{if(document.getElementById('settingsModal').classList.contains('open')&&load().linked)api('/me').then(r=>{me=r;renderSettings();}).catch(()=>renderSettings());})
      .observe(document.getElementById('settingsModal'),{attributes:true,attributeFilter:['class']});
  }
  function renderSettings(){
    if(!section)return;const st=load(),backup=readBackup();
    let html='<div class="set-lab" id="obaSetTitle" role="heading" aria-level="3">Mon compte et sauvegarde</div>';
    if(!st.linked){
      html+='<p class="oba-set-text">Garde tes voyages, tes sessions et tes badges, même si tu changes d’appareil.</p><button type="button" class="oba-set-main" data-a="login">Créer mon compte ou me connecter</button>';
    }else{
      html+=`<p class="oba-set-text"><span>Connecté</span>${me&&me.user&&me.user.email?` <b translate="no">${esc(me.user.email)}</b>`:''}</p>`;
      if(me&&!me.consent)html+='<p class="oba-set-text">La sauvegarde n’est pas activée.</p><button type="button" class="oba-set-main" data-a="consent">Activer la sauvegarde</button>';
      else html+=`<p class="oba-set-text">Dernière sauvegarde : <span>${esc(ago(st.lastSync))}</span></p><button type="button" class="oba-set-main" data-a="sync">Synchroniser maintenant</button>`;
      html+='<div class="oba-set-row"><button type="button" class="oba-set-btn" data-a="export">Exporter mes données</button><button type="button" class="oba-set-btn" data-a="logout">Se déconnecter</button></div>';
      if(me&&me.consent)html+='<button type="button" class="oba-set-btn oba-wide" data-a="stop">Arrêter la sauvegarde et effacer mes données du serveur</button>';
      html+='<button type="button" class="oba-set-btn oba-danger oba-wide" data-a="delete">Supprimer mon compte</button>';
    }
    if(backup)html+=`<button type="button" class="oba-set-btn oba-wide" data-a="restore">Restaurer la copie d’avant la connexion (${esc(new Date(backup.at).toLocaleDateString(document.documentElement.lang||'fr'))})</button>`;
    section.innerHTML=html;
    section.onclick=e=>{const a=e.target.closest('[data-a]');if(a)ACTIONS[a.dataset.a]?.(a);};
  }
  function readBackup(){try{const b=JSON.parse(localStorage.getItem(BACKUP_KEY)||'null');if(!b||!b.at)return null;
    if(Date.now()-b.at>BACKUP_DAYS*864e5){localStorage.removeItem(BACKUP_KEY);return null;}return b;}catch(_){return null;}}
  const confirmBox=(q,o)=>window.OceanConfirm?OceanConfirm(q,o):Promise.resolve(confirm(q));
  const ACTIONS={
    login(){openSheet('email');},
    consent(){openSheet('consent');},
    async sync(btn){btn.disabled=true;try{await sync({apply:'now'});window.toast?.('Sauvegarde à jour ✅');}catch(e){window.toast?.(message(e));}finally{btn.disabled=false;}},
    async export(btn){btn.disabled=true;try{
      const data=await api('/account/export');
      if(NATIVE&&typeof MOB.shareJSON==='function'){await MOB.shareJSON('ocean-buddy-export',data);return;}
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ocean-buddy-export.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    }catch(e){window.toast?.(message(e));}finally{btn.disabled=false;}},
    async logout(){if(!(await confirmBox('Te déconnecter ? Tes données restent sur cet appareil et sur ton compte.',{ok:'Se déconnecter'})))return;
      try{await raw('/auth/logout',{method:'POST',body:{}});}catch(_){}
      save({...M.freshState(),invite:load().invite,linked:false});me=null;renderSettings();window.toast?.('Déconnecté. L’app reste utilisable sans compte.');},
    async stop(){if(!(await confirmBox('Arrêter la sauvegarde ? Les données gardées sur le serveur seront effacées. Celles de cet appareil restent.',{ok:'Arrêter et effacer',danger:true})))return;
      try{await api('/consent',{method:'DELETE'});save({...load(),lastRev:0,shadow:{},pend:{},lastSync:null});me=await api('/me').catch(()=>me);renderSettings();window.toast?.('Sauvegarde arrêtée, données du serveur effacées.');}catch(e){window.toast?.(message(e));}},
    async delete(){
      if(!(await confirmBox('Supprimer ton compte et toutes les données sauvegardées ? C’est définitif. Les données de cet appareil restent.',{ok:'Supprimer mon compte',danger:true})))return;
      const run=async()=>{
        try{await api('/account',{method:'DELETE'});}
        catch(e){if(e.code==='reauth_required'){window.toast?.(message(e));flow.email=me&&me.user&&me.user.email||'';openSheet(flow.email?'code':'email',{then:run});
          if(flow.email)raw('/auth/otp/request',{method:'POST',body:{email:flow.email}}).catch(()=>{});return;}
          window.toast?.(message(e));return;}
        save({...M.freshState(),invite:load().invite,linked:false});me=null;renderSettings();
        const wipe=await confirmBox('Ton compte est supprimé. Effacer aussi les données de cet appareil ?',{ok:'Effacer aussi',cancel:'Garder sur cet appareil',danger:true});
        if(wipe){const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('oceanbuddy_'))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));
          try{await window.OceanMobile?.persist?.();}catch(_){}location.reload();}
        else window.toast?.('Compte supprimé. Tes données restent sur cet appareil.');
      };
      await run();
    },
    async restore(){const b=readBackup();if(!b)return;
      if(!(await confirmBox('Remettre cet appareil comme avant ta connexion ? Si tu es connecté, cette version sera ensuite envoyée sur ton compte.',{ok:'Restaurer'})))return;
      M.restoreSnapshot(localStorage,b.raw);try{await window.OceanMobile?.persist?.();}catch(_){}location.reload();},
  };

  /* ---------- arrivée : proposition unique, jamais insistante (règle Apple 5.1.1 : « Plus tard » toujours possible) ---------- */
  function maybeInvite(){
    const st=load();if(st.linked||st.invite)return;
    const onb=document.getElementById('onb'),onbOpen=()=>!!onb&&onb.style.display!=='none'&&!onb.classList.contains('hide');
    let tries=0;
    const show=()=>{if(load().invite||load().linked)return;if(overlayOpen()||typing()){if(tries++<5)setTimeout(show,4000);return;}
      patch({invite:{at:Date.now()}});openSheet('invite');};
    if(onbOpen()){const mo=new MutationObserver(()=>{if(!onbOpen()){mo.disconnect();setTimeout(show,900);}});mo.observe(onb,{attributes:true,attributeFilter:['class','style']});}
    else setTimeout(show,1200);
  }
  /* Un seul rappel, discret, jamais en boucle : au 3e favori ou au premier voyage, seulement si l'invitation a déjà été
     proposée et refusée. (Le champ « remindTrip » garde son nom : il marque le rappel déjà fait, même ancien.) */
  function watchReminder(){
    const count=(key,pick)=>{try{const d=JSON.parse(localStorage.getItem(key)||'null');return pick(d);}catch(_){return 0;}};
    const favs=()=>count(M.KEYS.main,d=>d&&Array.isArray(d.favs)?d.favs.length:0);
    const trips=()=>count(M.KEYS.trips,d=>d&&Array.isArray(d.trips)?d.trips.filter(x=>x&&!x.deleted).length:0);
    if(load().remindTrip)return;
    const start={favs:favs(),trips:trips()};
    const timer=setInterval(()=>{const st=load();if(st.linked||st.remindTrip){clearInterval(timer);return;}
      if(!st.invite||overlayOpen()||typing()||document.querySelector('#toast.show'))return;
      const f=favs(),t=trips(),why=f>=3&&f>start.favs?'fav':t>start.trips?'trip':null;
      if(!why){start.favs=Math.min(start.favs,f);start.trips=Math.min(start.trips,t);return;}
      clearInterval(timer);patch({remindTrip:Date.now()});snack(why);},8000);
  }
  function snack(why){
    const s=document.createElement('div');s.className='oba-snack';s.setAttribute('role','status');
    s.innerHTML=(why==='fav'?'<span>Garde tes favoris sur tous tes appareils.</span>':'<span>Sauvegarde ton voyage avec ton compte.</span>')+'<button type="button" class="oba-snack-go">Créer mon compte</button><button type="button" class="oba-snack-x" aria-label="Fermer">✕</button>';
    const close=()=>{s.classList.remove('open');setTimeout(()=>s.remove(),220);};
    s.querySelector('.oba-snack-go').onclick=()=>{close();openSheet('email');};s.querySelector('.oba-snack-x').onclick=close;
    document.body.append(s);requestAnimationFrame(()=>s.classList.add('open'));setTimeout(close,9000);
  }

  /* ---------- planification (seulement si connecté) ---------- */
  let scheduled=false;
  function schedule(){
    if(scheduled)return;scheduled=true;let debounce=0;
    const quiet=()=>sync({apply:'auto'}).catch(e=>{if(e.code==='consent_required')renderSettings();});
    setTimeout(quiet,3000);
    setInterval(()=>{if(!load().linked)return;const local=M.collect(localStorage),st=load(),s=M.scan(local,{v:1,lastRev:st.lastRev,shadow:st.shadow,pend:st.pend},Date.now());
      if(Object.keys(s.pend).length){patch({pend:s.pend});clearTimeout(debounce);debounce=setTimeout(quiet,20000);}},30000);
    document.addEventListener('visibilitychange',()=>{if(!load().linked)return;
      if(document.hidden||Date.now()-(load().lastSync||0)>5*60000||load().waiting)quiet();});
  }

  /* ---------- styles (fenêtres fixes : aucun décalage de l'accueil) ---------- */
  const css=document.createElement('style');css.id='obaCss';css.textContent=`
.oba{position:fixed;left:0;right:0;top:0;height:100%;box-sizing:border-box;z-index:300;display:flex;align-items:flex-end;justify-content:center;padding:16px;padding-bottom:max(16px,env(safe-area-inset-bottom));background:color-mix(in srgb,var(--t-deep,#0b2a4a) 55%,transparent);opacity:0;transition:opacity .2s ease}
.oba.open{opacity:1}@media(min-width:700px){.oba{align-items:center}}
.oba-card{position:relative;width:min(440px,100%);max-height:100%;box-sizing:border-box;overflow:auto;outline:none;background:var(--t-page,#fff);color:var(--ink,#0b2a4a);border:1px solid var(--t-line,#dde);border-radius:22px;padding:26px 22px 20px;box-shadow:0 30px 90px rgba(0,0,0,.25);transform:translateY(16px);transition:transform .22s ease}
.oba.open .oba-card{transform:none}
.oba-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border:0;border-radius:12px;background:var(--t-tint,#eef);color:var(--t-ink2,#456);font-size:14px;cursor:pointer}
.oba h2{font-family:var(--display,inherit);font-size:24px;line-height:1.15;margin:4px 48px 8px 0;color:var(--t-deep,#0b2a4a)}
.oba-hero{font-size:34px;line-height:1;margin-bottom:6px}
.oba-lead{margin:0 0 12px;font-size:15px;line-height:1.45;color:var(--t-ink2,#456)}
.oba-points{margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.5;color:var(--t-ink2,#456)}.oba-points li{margin:3px 0}
.oba-lab{display:block;font-size:13px;font-weight:700;margin:6px 0 6px;color:var(--t-ink2,#456)}
.oba-input{width:100%;box-sizing:border-box;min-height:48px;font:inherit;font-size:17px;border:1.5px solid var(--t-line,#ccd);border-radius:12px;padding:10px 14px;background:var(--t-card,#fff);color:inherit}
.oba-code{letter-spacing:.4em;font-size:22px;text-align:center}
.oba-main,.oba-set-main{display:block;width:100%;min-height:48px;margin-top:14px;border:0;border-radius:14px;background:var(--t-main2,#0b4f8a);color:var(--t-on-main,#fff);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.oba-later{display:block;width:100%;min-height:48px;margin-top:10px;border:1.5px solid var(--t-line,#ccd);border-radius:14px;background:none;color:var(--t-deep,#0b2a4a);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.oba-main:disabled,.oba-set-btn:disabled,.oba-set-main:disabled{opacity:.55}
.oba-small{font-size:12px;line-height:1.45;color:var(--t-ink2,#456);margin:10px 0 0;text-align:center}.oba-small+.oba-small{margin-top:4px}.oba-small a{color:var(--t-main,#0b4f8a)}
.oba-err{margin:10px 0 0;font-size:13px;font-weight:700;color:var(--t-danger,#b3261e)}
.oba-dev{margin:8px 0 0;font-size:12px;padding:8px 10px;border-radius:10px;background:var(--t-tint,#eef);color:var(--t-ink2,#456)}
.oba-links{display:flex;justify-content:space-between;gap:8px;margin-top:6px}.oba-link{min-height:44px;border:0;background:none;color:var(--t-main,#0b4f8a);font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.oba-check{display:flex;align-items:center;gap:10px;min-height:44px;font-size:14px;font-weight:700}.oba-check input{width:22px;height:22px}
.oba-spin{width:34px;height:34px;margin:18px auto;border-radius:50%;border:3px solid var(--t-tint,#eef);border-top-color:var(--t-main2,#0b4f8a);animation:obaSpin 1s linear infinite}
@keyframes obaSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.oba,.oba-card{transition:none}.oba-spin{animation-duration:3s}}
.oba-set{margin:0 0 18px;padding:14px;border:1px solid var(--t-line,#dde);border-radius:14px;background:var(--t-tint,#f4f6fb)}
.oba-set-text{margin:4px 0;font-size:13px;line-height:1.4;color:var(--t-ink2,#456);overflow-wrap:anywhere}
.oba-set-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.oba-set-btn{min-height:44px;border:1px solid var(--t-line,#dde);border-radius:12px;background:var(--t-page,#fff);color:var(--t-ink2,#456);font:inherit;font-size:12px;font-weight:700;cursor:pointer;padding:8px}
.oba-wide{display:block;width:100%;margin-top:8px}.oba-danger{color:var(--t-danger,#b3261e)}
.oba-snack{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));z-index:290;display:flex;align-items:center;gap:8px;width:max-content;max-width:calc(100% - 32px);box-sizing:border-box;padding:8px 8px 8px 16px;border-radius:16px;background:var(--t-deep,#0b2a4a);color:var(--t-tint,#fff);font-size:13px;box-shadow:0 12px 40px rgba(0,0,0,.25);transform:translate(-50%,20px);opacity:0;transition:transform .2s ease,opacity .2s ease}
.oba-snack.open{transform:translate(-50%,0);opacity:1}
.oba-snack-go{min-height:44px;border:0;border-radius:12px;background:var(--t-tint,#fff);color:var(--t-deep,#0b2a4a);font:inherit;font-weight:800;padding:0 12px;cursor:pointer}
.oba-snack-x{min-width:44px;min-height:44px;border:0;background:none;color:inherit;cursor:pointer}`;
  document.head.append(css);

  /* ---------- démarrage du module ---------- */
  mountSettings();
  let after=null;try{after=JSON.parse(sessionStorage.getItem(AFTER_KEY)||'null');sessionStorage.removeItem(AFTER_KEY);}catch(_){}
  if(after&&after.first){flow.summary=after.summary;openSheet('done');}
  else if(after)window.toast?.('Tes données sont à jour ✅');
  /* Retour d'un lien magique : le Worker a posé les cookies, on vérifie et on enchaîne sur le consentement. */
  if(/[?&]compte=connecte\b/.test(location.search)){
    try{history.replaceState(history.state,'',location.pathname+location.hash);}catch(_){}
    api('/me').then(r=>{me=r;patch({linked:true});if(!r.consent)openSheet('consent');else firstSync();}).catch(()=>{});
  }
  if(load().linked){schedule();api('/me').then(r=>{me=r;renderSettings();}).catch(()=>{});}
  else{maybeInvite();watchReminder();}

  /* forget : déconnexion de cet appareil (cookies ou Trousseau), appelée avant « Effacer toutes mes données sur cet appareil ». */
  const forget=async()=>{try{await raw('/auth/logout',{method:'POST',body:{}});}catch(_){}save({...M.freshState(),invite:load().invite,linked:false});me=null;};
  window.OceanAccount={open:()=>openSheet(load().linked?'consent':'invite'),sync:()=>sync({apply:'now'}),state:load,forget};
})();
