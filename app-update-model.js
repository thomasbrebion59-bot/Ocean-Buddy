/* Mises à jour de l’app mobile : logique pure (sans DOM) de « quand proposer quoi ». Utilisée par app-update.js,
   testée dans tests/app-update-model.test.js.
   - « live » (mise à jour directe déjà téléchargée) : comme avant, vérifiée au lancement puis au retour dans l’app
     quand la dernière vérification date de plus de 30 minutes.
   - « store » (version plus récente sur l’App Store) : écran entier rappelé à chaque lancement et à chaque retour au
     premier plan après au moins 10 minutes passées ailleurs. « Plus tard » ne le ferme que pour ce moment-là.
     Plus de silence de plusieurs jours : l’ancienne clé oceanbuddy_update_store_snooze est effacée.
   Jamais bloquant : chaque écran se ferme, et un échec réseau ne fait que reporter la vérification au retour suivant. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AppUpdateModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const MIN=60*1000;
  const AWAY_MIN=10*MIN;      // absence qui ouvre un nouveau moment : l’écran « store » revient
  const LIVE_EVERY=30*MIN;    // mises à jour directes : au plus une vérification par demi-heure (inchangé)
  const FIRST_CHECK=4000;     // premier contrôle après l’ouverture de l’app
  const LEGACY_SNOOZE='oceanbuddy_update_store_snooze';

  /* Numéro de version affichable (1.5.0, 1.5, 2.0.1.3) ; tout autre texte venu du réseau est écarté. */
  function cleanVersion(v){const s=String(v??'').trim();return /^\d{1,4}(?:\.\d{1,4}){0,3}$/.test(s)?s:'';}

  /* État au lancement : l’App Store est à vérifier tout de suite (chaque lancement est un nouveau moment). */
  function initial(){return {storeDue:true,liveAt:null,hiddenAt:null};}
  /* L’app passe en arrière-plan. */
  function hidden(state,now){return {...state,hiddenAt:now};}
  /* Retour au premier plan. screen : fenêtre déjà ouverte ou en attente ('live', 'store' ou rien).
     Au moins 10 minutes ailleurs : nouveau moment, l’App Store est de nouveau à vérifier ; si l’écran « store » est
     déjà là (jamais fermé), il compte pour ce nouveau moment. */
  function visible(state,now,screen){
    const away=state.hiddenAt==null?0:Math.max(0,now-state.hiddenAt);
    const storeDue=screen==='store'?false:state.storeDue||away>=AWAY_MIN;
    return {...state,hiddenAt:null,storeDue};
  }
  /* Que vérifier maintenant ? Rien tant qu’une fenêtre est ouverte ou attend son tour. */
  function plan(state,now,screen){
    if(screen)return {live:false,store:false};
    return {live:state.liveAt==null||now-state.liveAt>LIVE_EVERY,store:!!state.storeDue};
  }
  /* Vérification « live » lancée (comme avant, l’heure compte dès le début). */
  function liveChecked(state,now){return {...state,liveAt:now};}
  /* Réponse de l’App Store : ok = réponse obtenue (plus récente ou non). Échec réseau : on réessaiera au retour suivant. */
  function storeChecked(state,ok){return ok?{...state,storeDue:false}:state;}

  /* Quelle fenêtre montrer ? live : réponse de checkLive ; store : réponse de checkStore (absente si non demandée). */
  function decide(live,store){
    if(live&&live.kind==='live')return {kind:'live'};
    if(store&&store.kind==='store')return {kind:'store',version:cleanVersion(store.version)};
    return null;
  }

  /* Efface l’ancien silence de 3 jours s’il existe encore. Renvoie true si une clé a été effacée. */
  function forgetLegacySnooze(storage){
    try{if(storage&&storage.getItem(LEGACY_SNOOZE)!==null){storage.removeItem(LEGACY_SNOOZE);return true;}}catch(_){}
    return false;
  }

  return {AWAY_MIN,LIVE_EVERY,FIRST_CHECK,LEGACY_SNOOZE,cleanVersion,initial,hidden,visible,plan,liveChecked,storeChecked,decide,forgetLegacySnooze};
});
