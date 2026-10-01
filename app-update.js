/* Mises à jour de l’app mobile : propose la nouvelle version comme dans un jeu.
 * - « live » : le nouveau contenu est déjà téléchargé, il s’installe en un geste ;
 * - « store » : une nouvelle version native est sur l’App Store.
 * Sur le site web, ce fichier ne fait rien. */
(function(){
  const M=window.OceanMobile;
  if(!M||!M.native||!M.updates)return;
  const STORE_SNOOZE='oceanbuddy_update_store_snooze',CHECK_EVERY=30*60*1000;
  let lastCheck=0,open=false,running=false;
  function onboarding(){const o=document.getElementById('onb');if(!o||!o.isConnected)return false;const st=getComputedStyle(o);return st.display!=='none'&&st.visibility!=='hidden'&&o.getClientRects().length>0;}
  function storeSnoozed(version){
    try{const s=JSON.parse(localStorage.getItem(STORE_SNOOZE)||'null');return !!(s&&s.v===version&&Date.now()<s.until);}catch(_){return false;}
  }
  function show(kind,version){
    if(open)return;open=true;
    const live=kind==='live',wrap=document.createElement('div');
    wrap.className='app-update';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-labelledby','appUpdateTitle');
    wrap.innerHTML=`<div class="app-update-card"><img src="assets/poulpy/celebrate.webp" alt="">
      <span class="app-update-kicker">${live?'Mise à jour prête':'Nouvelle version'}</span>
      <h2 id="appUpdateTitle">${live?'Ocean Buddy a fait peau neuve !':'Ocean Buddy évolue !'}</h2>
      <p>${live?'Les nouveautés sont déjà téléchargées : quelques secondes suffisent pour les installer.':'Une nouvelle version est disponible sur l’App Store. Mets-la à jour pour profiter de toutes les nouveautés.'}</p>
      <div class="app-update-actions"><button type="button" class="app-update-go">${live?'Mettre à jour maintenant':'Ouvrir l’App Store'}</button><button type="button" class="app-update-later">Plus tard</button></div></div>`;
    document.body.append(wrap);requestAnimationFrame(()=>wrap.classList.add('show'));
    const go=wrap.querySelector('.app-update-go');
    const close=()=>{wrap.classList.remove('show');setTimeout(()=>wrap.remove(),260);open=false;};
    go.focus();
    go.addEventListener('click',()=>{
      if(live){go.disabled=true;go.textContent='Mise à jour…';M.updates.applyLive().catch(()=>{go.disabled=false;go.textContent='Réessayer';});}
      else{M.updates.openStore();close();}
    });
    wrap.querySelector('.app-update-later').addEventListener('click',()=>{
      if(!live)try{localStorage.setItem(STORE_SNOOZE,JSON.stringify({v:version,until:Date.now()+3*24*3600*1000}));}catch(_){}
      else window.toast?.('👍 La mise à jour s’installera quand tu quitteras l’app');
      close();
    });
  }
  // Le téléchargement se fait tout de suite ; la fenêtre attend la fin de l’accueil.
  function showWhenFree(kind,version){if(onboarding()||document.hidden){setTimeout(()=>showWhenFree(kind,version),5000);return;}show(kind,version);}
  async function check(){
    if(running||open||document.hidden)return;
    running=true;lastCheck=Date.now();
    try{
      const live=await M.updates.checkLive().catch(()=>null);
      if(live&&live.kind==='live')return showWhenFree('live');
      const store=await M.updates.checkStore().catch(()=>null);
      if(store&&!storeSnoozed(store.version))showWhenFree('store',store.version);
    }finally{running=false;}
  }
  setTimeout(check,4000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>CHECK_EVERY)check();});
})();
