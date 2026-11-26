/* Mises à jour de l’app mobile : logique pure (sans DOM) de « quand proposer quoi ». Utilisée par app-update.js,
   testée dans tests/app-update-model.test.js.
   - « live » (mise à jour directe déjà téléchargée) : comme avant, vérifiée au lancement puis au retour dans l’app
     quand la dernière vérification date de plus de 30 minutes.
   - « store » (version plus récente sur l’App Store ET coque native trop vieille pour recevoir les mises à jour directes,
     c’est-à-dire sous native_min) : écran entier rappelé à chaque lancement et à chaque retour au premier plan après au
     moins 10 minutes passées ailleurs. « Plus tard » ne le ferme que pour ce moment-là.
     Plus de silence de plusieurs jours : l’ancienne clé oceanbuddy_update_store_snooze est effacée.
   - « reminder » (version plus récente sur l’App Store, mais la coque reçoit encore tout en direct) : simple rappel
     discret et fermable, une seule fois par version de l’App Store (clé oceanbuddy_update_reminder_version).
   Jamais bloquant : chaque écran se ferme, et un échec réseau ne fait que reporter la vérification au retour suivant. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AppUpdateModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const MIN=60*1000;
  const AWAY_MIN=10*MIN;      // absence qui ouvre un nouveau moment : l’écran « store » revient
  const LIVE_EVERY=30*MIN;    // mises à jour directes : au plus une vérification par demi-heure (inchangé)
  const FIRST_CHECK=4000;     // premier contrôle après l’ouverture de l’app
  const LEGACY_SNOOZE='oceanbuddy_update_store_snooze';
  const REMINDER_KEY='oceanbuddy_update_reminder_version';

  /* Numéro de version affichable (1.5.0, 1.5, 2.0.1.3) ; tout autre texte venu du réseau est écarté. */
  function cleanVersion(v){const s=String(v??'').trim();return /^\d{1,4}(?:\.\d{1,4}){0,3}$/.test(s)?s:'';}

  /* État au lancement : l’App Store est à vérifier tout de suite (chaque lancement est un nouveau moment). */
  function initial(){return {storeDue:true,liveAt:null,hiddenAt:null,forced:false};}
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
  /* Réponse de la vérification directe : { kind:'store' } veut dire « coque sous native_min » (écran entier à chaque fois).
     Ce constat est gardé tant qu’une nouvelle réponse ne le contredit pas ; un échec réseau ne le change pas. */
  function liveResult(state,live,ok){return ok===false?state:{...state,forced:!!(live&&live.kind==='store')};}
  /* Réponse de l’App Store : ok = réponse obtenue (plus récente ou non). Échec réseau : on réessaiera au retour suivant. */
  function storeChecked(state,ok){return ok?{...state,storeDue:false}:state;}

  /* Quelle fenêtre montrer ? live : réponse de checkLive ; store : réponse de checkStore (absente si non demandée) ;
     forced : la coque est sous native_min (état gardé) ; seen : dernière version dont le rappel a déjà été montré.
     Coque trop vieille : écran entier. Sinon, version plus récente sur l’App Store : rappel, une fois par version. */
  function decide(live,store,forced,seen){
    if(live&&live.kind==='live')return {kind:'live'};
    if(!store||store.kind!=='store')return null;
    const version=cleanVersion(store.version);
    if(forced||(live&&live.kind==='store'))return {kind:'store',version};
    if(seen!=null&&String(seen)===(version||'?'))return null;
    return {kind:'reminder',version};
  }

  /* Dernière version de l’App Store dont le rappel a été montré (null si aucune ou si le stockage est bloqué). */
  function reminderSeen(storage){try{const v=storage&&storage.getItem(REMINDER_KEY);return v==null?null:String(v);}catch(_){return null;}}
  /* Retient la version du rappel montré (une seule écriture par version). */
  function markReminder(storage,version){try{if(!storage)return false;storage.setItem(REMINDER_KEY,version||'?');return true;}catch(_){return false;}}

  /* Efface l’ancien silence de 3 jours s’il existe encore. Renvoie true si une clé a été effacée. */
  function forgetLegacySnooze(storage){
    try{if(storage&&storage.getItem(LEGACY_SNOOZE)!==null){storage.removeItem(LEGACY_SNOOZE);return true;}}catch(_){}
    return false;
  }

  return {AWAY_MIN,LIVE_EVERY,FIRST_CHECK,LEGACY_SNOOZE,REMINDER_KEY,cleanVersion,initial,hidden,visible,plan,liveChecked,liveResult,storeChecked,decide,reminderSeen,markReminder,forgetLegacySnooze};
});
