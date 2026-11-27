/* Local data control: erase everything Ocean Buddy keeps on this device. */
(() => {
  'use strict';
  const erase=document.createElement('button');erase.type='button';erase.className='set-reset';erase.textContent='Effacer toutes mes données sur cet appareil';
  erase.onclick=async()=>{
    const q='Effacer définitivement ton profil, tes favoris, tes voyages (y compris la corbeille), tes notes, tes sessions et tes préférences sur cet appareil ? Cela te déconnecte de ton compte sur cet appareil, sans le supprimer. Exporte tes voyages avant de continuer.';
    if(!(await (window.OceanConfirm?OceanConfirm(q,{ok:'Tout effacer',danger:true}):Promise.resolve(confirm(q)))))return;
    /* Compte : déconnexion de cet appareil d'abord (cookies du site, ou jetons du Trousseau dans l'app iPhone). */
    try{if(window.OceanAccount?.forget)await OceanAccount.forget();else if(window.OceanMobile?.account)await OceanMobile.account.request('/auth/logout',{method:'POST',body:{}});}catch(_){}
    const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('oceanbuddy_')||['ob_community_session_v1','ob_community_name_v1','ob_conditions_v1'].includes(key))keys.push(key);}keys.forEach(key=>localStorage.removeItem(key));
    try{sessionStorage.removeItem('ob_community_session_v1')}catch(_){}
    try{await window.OceanMobile?.persist();location.reload();}catch(_){toast('La copie native n’a pas pu être effacée. Réessaie avant de fermer l’application.');}
  };
  /* Rubrique « Mes données » des Réglages, sous « Réinitialiser ma progression ». */
  const reset=document.querySelector('#settingsModal .set-reset');
  if(reset)reset.after(erase);else document.querySelector('.set-about').before(erase);
})();

/* Compte et sauvegarde (compte gratuit, facultatif). Site : seulement sur https://oceanbuddy.app (drapeau ci-dessous).
   Essai local : http://localhost…/?compte=essai (scripts/compte-essai.mjs). App iPhone : seulement avec la capacité
   « account », c'est-à-dire avec le plugin natif OceanAccount (Trousseau, version 1.5.0) ; les apps 1.4.x ne le montrent pas.
   Le code du compte se charge APRÈS la levée du rideau (OceanBoot.after) et n'écrit jamais sur l'accueil. */
(() => {
  'use strict';
  const ACCOUNT={enabled:true,hosts:['oceanbuddy.app']};
  const ACCOUNT_V='72124e75485d';
  function accountEnabled(cfg,loc,storage,mobile){
    if(mobile&&mobile.native)return !!(cfg.enabled&&mobile.capabilities&&mobile.capabilities.account===true);
    if(loc.protocol==='capacitor:')return false;
    if(loc.protocol==='http:'&&(loc.hostname==='localhost'||loc.hostname==='127.0.0.1')){
      try{if(/(?:^|[?&])compte=essai(?:&|$)/.test(loc.search))storage.setItem('ob_account_dev','1');return storage.getItem('ob_account_dev')==='1';}catch(_){return false;}
    }
    return !!cfg.enabled&&loc.protocol==='https:'&&cfg.hosts.includes(loc.hostname);
  }
  window.OceanAccountGate={enabled:accountEnabled};
  if(typeof location==='undefined'||!accountEnabled(ACCOUNT,location,window.localStorage,window.OceanMobile))return;
  const load=()=>{const add=(src,next)=>{const s=document.createElement('script');s.src=src+(ACCOUNT_V?'?v='+ACCOUNT_V:'');s.async=false;if(next)s.onload=next;document.body.append(s);};
    add('account-sync-model.js',()=>add('account-sync.js'));};
  const later=()=>setTimeout(()=>{(window.requestIdleCallback||setTimeout)(load,{timeout:3000});},1500);
  if(window.OceanBoot&&OceanBoot.after)OceanBoot.after(later);else addEventListener('ocean:home-ready',later,{once:true});
})();
