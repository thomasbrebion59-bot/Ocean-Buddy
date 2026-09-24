/* Moderated public community. Legacy local posts and reviews remain private. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cfg=window.OCEAN_COMMUNITY_CONFIG||{};
  const publicKey=cfg.publishableKey||cfg.anonKey||'';
  const configured=/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(cfg.supabaseUrl||'')&&!!publicKey&&/^https:\/\//.test(cfg.endpoint||'');
  const KEY='ob_community_session_v1',NAME='ob_community_name_v1',RULES='2026-09-23';
  // A native WebView keeps the sign-in only for its current session until a Keychain bridge exists.
  let sessionStore;try{sessionStore=window.OceanMobile?.native?sessionStorage:localStorage}catch(_){sessionStore={getItem:()=>null,setItem:()=>{},removeItem:()=>{}}}
  if(window.OceanMobile?.native)try{localStorage.removeItem(KEY)}catch(_){}
  const state={status:'checking',error:'',session:null,me:null,feed:[],mine:[],blocked:[],moderation:null,reviews:new Map(),reviewPending:new Set(),reviewErrors:new Set(),currentSpot:null};
  const toast=message=>window.toast?.(message);
  const spotName=id=>SPOTS.find(s=>s.id===id)?.name?.split(' — ')[0]||'Spot du catalogue';
  const stamp=value=>value?new Date(value).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'';
  const readArray=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}};
  try{const saved=JSON.parse(sessionStore.getItem(KEY)||'null');if(saved&&saved.access_token&&saved.refresh_token)state.session=saved}catch(_){}
  function session(value){state.session=value;try{value?sessionStore.setItem(KEY,JSON.stringify(value)):sessionStore.removeItem(KEY)}catch(_){}}
  function clearAccount(){session(null);state.me=null;state.mine=[];state.blocked=[];state.moderation=null;try{localStorage.removeItem(NAME)}catch(_){}}
  const registerPrivateSpots=()=>window.OceanPrivateSpots?.register();
  async function auth(path,body,token){
    const response=await fetch(cfg.supabaseUrl+'/auth/v1/'+path,{method:'POST',headers:{apikey:publicKey,...(token?{authorization:'Bearer '+token}:{}),'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error_description||'auth_failed');return result;
  }
  async function token(){
    const value=state.session;if(!value)return null;
    if(value.expires_at>Date.now()/1000+60)return value.access_token;
    try{const next=await auth('token?grant_type=refresh_token',{refresh_token:value.refresh_token});session({...next,expires_at:Math.floor(Date.now()/1000)+(next.expires_in||3600)});return next.access_token}
    catch(_){clearAccount();return null}
  }
  async function api(view='',body){
    const access=await token(),url=cfg.endpoint+(view?'?view='+view:'');
    const response=await fetch(url,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(access?{authorization:'Bearer '+access}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
    const result=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401){clearAccount();if(access&&!body&&(view==='feed'||view.startsWith('spot&')||view.startsWith('thread&')))return api(view)}throw Error(result.error||'service_unavailable')}return result;
  }
  const errorText=e=>({sign_in_required:'Connecte-toi pour participer.',session_expired:'Ta session a expiré. Reconnecte-toi.',rules_required:'Accepte les règles avant de continuer.',slow_down:'Attends un peu avant un nouvel envoi.',unknown_spot:'Ce spot n’est plus dans le catalogue vérifié.',service_unavailable:'Service momentanément indisponible.',account_restricted:'Ce compte ne peut plus publier.',not_configured:'La communauté attend sa mise en service.'})[e?.message]||'Action impossible pour le moment.';
  async function checkService(){
    if(!configured){state.status='setup';render();return}
    try{const response=await fetch(cfg.endpoint+'?view=status',{signal:AbortSignal.timeout(10000)}),data=await response.json();if(!response.ok||!data.enabled)throw Error('not_configured');state.status='ready';state.reviewErrors.clear();await refresh()}
    catch(error){state.status='unavailable';state.error=errorText(error);render()}
  }
  async function refresh(){
    if(state.status!=='ready')return;
    try{
      state.feed=(await api('feed')).entries||[];
      if(state.session){const result=await api('me');state.me=result.user;state.mine=result.entries||[];state.blocked=result.blocked||[];state.moderation=state.me.isOwner?await api('moderation'):null}
      else{state.me=null;state.mine=[];state.blocked=[];state.moderation=null}
      state.error='';render();if(state.currentSpot)mountSpot(state.currentSpot);
    }catch(error){if(['service_unavailable','not_configured'].includes(error?.message))state.status='unavailable';state.error=errorText(error);render();if(state.currentSpot)mountSpot(state.currentSpot)}
  }
  const rules=()=>`<label class="community-consent"><input type="checkbox" name="rules" required> J’accepte les <a href="community-rules.html" target="_blank" rel="noopener">règles de la communauté</a>. Mon texte sera vérifié avant publication.</label>`;
  function tripHtml(t){
    if(!t)return'';
    const detail=['start','end','budget','accommodation','transport','notes'].filter(k=>t[k]).map(k=>`<p><b>${{start:'Départ',end:'Retour',budget:'Budget',accommodation:'Hébergement',transport:'Transport',notes:'Notes'}[k]} :</b> ${esc(t[k])}</p>`).join('');
    const stepDetails=s=>[['notes','Note'],['budget','Budget'],['accommodation','Hébergement'],['transport','Transport']].filter(([key])=>s[key]).map(([key,label])=>`<small>${label} : ${esc(s[key])}</small>`).join('');
    return `<div class="community-trip-summary"><b>${esc(t.name)}</b><span>${esc(t.destination)}</span><ol>${(t.steps||[]).map(s=>`<li>${esc(spotName(s.spotId))}${s.date?' · '+esc(s.date):''}${stepDetails(s)}</li>`).join('')}</ol>${detail}</div>`;
  }
  function card(e,mode='public'){
    const status={pending:'En attente',rejected:'Refusé',removed:'Retiré'}[e.status]||'';
    const lat=Number(e.payload?.lat),lon=Number(e.payload?.lon),mapLink=e.kind==='proposal'&&Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lon)&&lon>=-180&&lon<=180?`<a href="https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${lon}#map=12/${lat}/${lon}" target="_blank" rel="noopener">Voir le secteur approximatif ↗</a>`:'';
    return `<article class="community-post"><div class="post-avatar" aria-hidden="true">${esc((e.author||'E').slice(0,1).toUpperCase())}</div><div class="community-post-body"><div class="community-post-meta"><b>${esc(e.author||'Explorateur')}</b><small>${esc(stamp(e.published_at||e.created_at))}</small><span class="post-tag">${{post:'Récit',review:'Avis',proposal:'Spot proposé',trip:'Voyage',reply:'Réponse'}[e.kind]||'Contribution'}</span>${mode==='mine'&&status?'<span class="community-status">'+status+'</span>':''}</div>${e.title?'<h3>'+esc(e.title)+'</h3>':''}<p>${esc(e.body)}</p>${e.kind==='review'?`<span class="community-static-stars">${'★'.repeat(e.rating||0)}${'☆'.repeat(5-(e.rating||0))}</span> · ${esc(spotName(e.spot_id))}`:''}${e.kind==='trip'?tripHtml(e.payload):''}${e.kind==='proposal'?'<p class="community-note">Position indicative non vérifiée · '+esc(e.payload?.location)+'</p>'+mapLink:''}<div class="community-post-actions">${mode==='public'&&e.kind!=='review'&&e.kind!=='reply'?`<button data-thread="${esc(e.id)}">Lire les réponses</button>`:''}${mode==='public'&&e.author_id!==state.me?.id?(state.me?`<button data-report="${esc(e.id)}">Signaler</button><button data-block="${esc(e.author_id)}">Masquer cet auteur</button>`:`<a class="community-report-link" href="mailto:thomas.brebion59@icloud.com?subject=Signalement%20Ocean%20Buddy&amp;body=Contribution%20${encodeURIComponent(e.id)}">Signaler par e-mail</a>`):''}${mode==='mine'&&['pending','approved'].includes(e.status)?`<button data-withdraw="${esc(e.id)}">Retirer</button>`:''}${mode==='mod'?`<button data-moderate="approve" data-entry="${esc(e.id)}">Valider</button><button data-moderate="reject" data-entry="${esc(e.id)}">Refuser</button><button data-ban="${esc(e.author_id)}">Restreindre ce compte</button>`:''}</div></div></article>`;
  }
  function currentTrip(){try{const id=window.OceanTrips?.route()?.selected,data=JSON.parse(localStorage.getItem(TripModel.KEY)||'{}');return id&&Array.isArray(data.trips)?data.trips.find(t=>t.id===id&&!t.deleted):null}catch(_){return null}}
  function legacy(){
    const posts=readArray('oceanbuddy_community_v1'),reviews=readArray('oceanbuddy_feedback_v1'),spots=readArray('oceanbuddy_custom_spots_v1'),counts=[posts.length,reviews.length,spots.length];
    if(!counts.some(Boolean))return'';
    return `<section class="community-panel"><span class="community-kicker">SUR CET APPAREIL</span><h2>Tes anciens contenus</h2><p class="community-muted">${counts[0]} messages, ${counts[1]} avis et ${counts[2]} spots personnels. Ils restent privés et ne sont jamais envoyés automatiquement.</p><details class="community-private-archive"><summary>Lire mes anciens contenus privés</summary>${posts.filter(x=>typeof x?.text==='string').slice().reverse().map(x=>`<p><b>Message</b> ${esc(x.text)}</p>`).join('')}${reviews.filter(x=>typeof x?.text==='string').slice().reverse().map(x=>`<p><b>Avis ${esc(spotName(x.id))}</b> ${esc(x.text)}</p>`).join('')}${spots.filter(x=>typeof x?.name==='string').slice().reverse().map(x=>`<p><b>Spot personnel</b> ${esc(x.name)}</p>`).join('')}</details></section>`;
  }
  function account(){
    if(!state.me)return `<section class="community-panel"><span class="community-kicker">PARTICIPER</span><h2>Un code par e-mail</h2><p class="community-muted">La lecture est ouverte à tous. Connecte-toi avec une adresse vérifiée pour proposer un texte.</p><form id="communityEmailForm" class="post-form"><label>Adresse e-mail<input name="email" type="email" autocomplete="email" required></label><button class="community-primary">Recevoir un code</button></form><form id="communityCodeForm" class="post-form" hidden><label>Code à 6 chiffres<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button class="community-primary">Me connecter</button></form><p class="community-note">Ton e-mail n’apparaît jamais publiquement.</p></section>`;
    return `<section class="community-panel"><span class="community-kicker">TON COMPTE</span><h2>${esc(state.me.displayName)}</h2><p class="community-muted">${esc(state.me.email)}</p><label class="community-name">Nom public<input id="communityDisplayName" maxlength="30" value="${esc(localStorage.getItem(NAME)||state.me.displayName)}"></label><div class="community-account-actions"><button data-signout>Se déconnecter</button><button data-delete>Supprimer mon compte</button></div>${state.blocked.length?`<details class="community-private-archive"><summary>Auteurs masqués (${state.blocked.length})</summary>${state.blocked.map(p=>`<p>${esc(p.display_name)} <button data-unblock="${esc(p.id)}">Réafficher</button></p>`).join('')}</details>`:''}<p class="community-note">La suppression retire tes contenus publics. Tes voyages privés restent sur cet appareil.</p></section>`;
  }
  function moderation(){
    if(state.status!=='ready'||!state.me?.isOwner)return'';
    const data=state.moderation||{pending:[],reports:[],restricted:[]};
    return `<section class="community-panel community-moderation"><span class="community-kicker">MODÉRATION</span><h2>À vérifier</h2><p class="community-muted">${data.pending.length} contributions · ${data.reports.length} signalements</p>${data.pending.map(e=>card(e,'mod')).join('')||'<p class="community-empty">Aucune contribution en attente.</p>'}${data.reports.map(r=>`<article class="community-report"><b>Signalement · ${esc(r.reason)}</b><p>${esc(r.details||'Aucun détail ajouté.')}</p>${r.entry?card(r.entry,'report'):'<small>Contribution indisponible</small>'}<div><button data-hide="${esc(r.entry_id)}">Masquer la contribution</button>${r.entry?.author_id?`<button data-ban="${esc(r.entry.author_id)}">Restreindre cet auteur</button>`:''}<button data-resolve="${esc(r.id)}">Marquer traité</button></div></article>`).join('')}${data.restricted?.length?`<h3>Comptes restreints</h3>${data.restricted.map(p=>`<p>${esc(p.display_name)} <button data-unban="${esc(p.id)}">Rétablir</button></p>`).join('')}`:''}</section>`;
  }
  function render(){
    const host=$('#communityContent');if(!host)return;
    const online=state.status==='ready',trip=currentTrip();
    const feed=online?(state.feed.map(e=>card(e)).join('')||'<p class="community-empty">Le fil est encore calme.</p>'):(state.status==='setup'?`<div class="community-service-state is-soon" role="status"><img src="assets/poulpy/scenes/travel-v2.webp" alt="" width="72" height="72" loading="lazy"><div><b>Le fil ouvre très bientôt</b><p>Poulpy prépare le quai pour accueillir les récits des explorateurs. En attendant, prépare tes surf trips : tu pourras les partager dès l’ouverture.</p><button type="button" onclick="go('trips')">Préparer un surf trip&nbsp;→</button></div></div>`:`<div class="community-service-state" role="status"><b>${state.status==='checking'?'Connexion en cours':'Communauté momentanément indisponible'}</b><p>${esc(state.error||'Le service ne répond pas pour le moment. Tes voyages restent privés.')}</p>${state.status==='checking'?'':'<button data-retry>Réessayer</button>'}</div>`);
    host.innerHTML=`<div class="community-hero"><span class="community-kicker">OCEAN BUDDY · ENSEMBLE</span><h1>Le large se vit<br><b>ensemble.</b></h1><p>Récits, conseils et voyages partagés. Chaque texte est vérifié avant publication.</p></div><div class="community-grid"><div><section class="community-panel"><span class="community-kicker">LE FIL DU LARGE</span><h2>Les explorateurs racontent</h2><div class="community-feed">${feed}</div></section>${online&&state.me?`<section class="community-panel"><span class="community-kicker">TON RÉCIT</span><h2>Partager une expérience</h2><form id="communityPostForm" class="post-form"><textarea name="body" maxlength="1200" minlength="10" required placeholder="Un conseil, une rencontre, une journée sur l’eau…"></textarea>${rules()}<button class="community-primary">Envoyer pour validation</button></form></section>`:''}${online&&state.mine.length?`<section class="community-panel"><span class="community-kicker">TES CONTRIBUTIONS</span><h2>Suivre mes envois</h2>${state.mine.map(e=>card(e,'mine')).join('')}</section>`:''}${moderation()}</div><aside class="community-side">${online?account():''}<section class="community-panel"><span class="community-kicker">CARNET DE VOYAGE</span><h2>Partager un itinéraire</h2><p class="community-muted">${trip?esc(trip.name)+' · '+trip.steps.length+' étapes':'Ouvre un voyage dans Surf trips pour choisir les détails à partager.'}</p>${online&&state.me&&trip?'<button class="community-primary" data-share>Choisir les champs publics</button>':'<p class="community-note">Dates, budget, hébergements, transports et notes restent privés par défaut.</p>'}</section><section class="community-panel"><span class="community-kicker">CARTE PARTICIPATIVE</span><h2>Proposer un spot</h2><p class="community-muted">Une proposition approuvée reste identifiée comme communautaire jusqu’à sa vérification éditoriale.</p>${online&&state.me?'<button class="community-primary" data-propose>Proposer un spot au public</button>':''}<button class="community-private-button" data-private-spot>Ajouter un spot à ma carte privée</button><p class="community-note">Ton spot privé reste sur cet appareil, même sans connexion.</p></section>${legacy()}<section class="community-panel community-links"><a href="community-rules.html">Règles de la communauté</a><a href="privacy.html">Confidentialité</a><a href="support.html">Assistance</a></section></aside></div>`;
  }
  function mountSpot(id){
    state.currentSpot=id;const host=$('#detail .detail-body');if(!host||!id)return;
    let box=$('#spotFeedback');if(!box){box=document.createElement('section');box.id='spotFeedback';box.className='community-feedback';host.append(box)}
    if(!SPOTS.some(s=>s.id===id&&!s.custom&&!s.archived)){box.innerHTML='<h3>Spot personnel</h3><p class="community-muted">Cette fiche privée ne reçoit pas d’avis publics.</p>';return}
    if(state.status!=='ready'){box.innerHTML=state.status==='setup'?'<h3>Avis de la communauté</h3><p class="community-muted">Les avis des explorateurs arrivent bientôt sur chaque spot.</p>':'<h3>Avis communautaires indisponibles</h3><p class="community-muted">Le service communautaire ne répond pas pour le moment.</p>';return}
    if(!state.reviews.has(id)){
      if(state.reviewErrors.has(id)){box.innerHTML=`<h3>Avis communautaires indisponibles</h3><p class="community-muted">Impossible de charger les avis pour ce spot.</p><button class="community-private-button" data-retry-review="${esc(id)}">Réessayer</button>`;return}
      box.innerHTML='<h3>Avis de la communauté</h3><p class="community-muted" role="status">Chargement des avis…</p>';
      if(!state.reviewPending.has(id)){
        state.reviewPending.add(id);
        api('spot&spotId='+encodeURIComponent(id)).then(data=>{state.reviews.set(id,data.entries||[]);state.reviewErrors.delete(id)}).catch(()=>state.reviewErrors.add(id)).finally(()=>{state.reviewPending.delete(id);if(state.currentSpot===id)mountSpot(id)});
      }
      return;
    }
    const list=state.reviews.get(id)||[],avg=list.length?(list.reduce((n,e)=>n+e.rating,0)/list.length).toFixed(1):'—';
    box.innerHTML=`<div class="community-section-head"><span class="community-kicker">AVIS DE LA COMMUNAUTÉ</span><h3>Ils ont vécu ce spot</h3><span class="feedback-average">${avg} ★ · ${list.length} avis</span></div>${state.status==='ready'?`${list.map(e=>card(e)).join('')||'<p class="community-muted">Pas encore d’avis public.</p>'}${state.me?`<form class="feedback-form" data-review="${esc(id)}"><fieldset class="community-rating"><legend>Ta note</legend>${[1,2,3,4,5].map(n=>`<label><input type="radio" name="rating" value="${n}" required><span>${n} ★</span></label>`).join('')}</fieldset><textarea name="body" maxlength="1200" minlength="10" required placeholder="Conditions vécues, accès, ambiance…"></textarea>${rules()}<button class="community-primary">Envoyer mon avis pour validation</button></form>`:'<p class="community-muted">Connecte-toi dans Communauté pour proposer un avis.</p>'}`:'<p class="community-muted">Les avis sont momentanément indisponibles.</p>'}`;
  }
  function dialog(html){const d=document.createElement('dialog');d.className='community-dialog';d.innerHTML=`<button class="dialog-x" data-close aria-label="Fermer">×</button>${html}`;document.body.append(d);d.showModal();d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close()});return d}
  function propose(){
    const options=(typeof SPORTS==='undefined'?[]:SPORTS).map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
    dialog(`<span class="community-kicker">CARTE PARTICIPATIVE</span><h2>Proposer un spot</h2><p>Indique une position approximative. Cette proposition sera examinée avant d’être visible.</p><form id="communityProposalForm" class="post-form"><label>Nom<input name="title" maxlength="80" minlength="3" required></label><label>Pays ou région<input name="location" maxlength="100" required></label><div class="custom-coords"><label>Latitude approximative<input name="lat" type="number" step="any" min="-90" max="90" required></label><label>Longitude approximative<input name="lon" type="number" step="any" min="-180" max="180" required></label></div><label>Activité<select name="sport">${options}</select></label><label>Description<textarea name="body" maxlength="1200" minlength="10" required></textarea></label>${rules()}<button class="community-primary">Envoyer pour validation</button></form>`);
  }
  function privateSpotDialog(){
    const sports=(typeof SPORTS==='undefined'?[]:SPORTS).map(s=>`<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
    const worlds=(typeof WORLDS==='undefined'?[]:WORLDS).map(w=>`<option value="${esc(w.id)}">${esc(w.lab||w.label||w.id)}</option>`).join('');
    dialog(`<span class="community-kicker">CARTE PERSONNELLE</span><h2>Un spot à garder pour toi</h2><p>Cette fiche reste uniquement sur cet appareil. Ses coordonnées sont indicatives.</p><form id="communityPrivateSpotForm" class="post-form"><label>Nom<input name="name" maxlength="80" required></label><label>Pays ou région<input name="loc" maxlength="100" required></label><label>Continent<select name="world">${worlds}</select></label><div class="custom-coords"><label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" required></label><label>Longitude<input name="lon" type="number" step="any" min="-180" max="180" required></label></div><label>Activité<select name="sport">${sports}</select></label><label>Description personnelle<textarea name="desc" maxlength="400"></textarea></label><button class="community-primary">Enregistrer sur cet appareil</button></form>`);
  }
  function share(){
    const trip=currentTrip();if(!trip)return toast('Ouvre d’abord un voyage.');
    const fields=[['start','Départ'],['end','Retour'],['budget','Budget'],['accommodation','Hébergement'],['transport','Transport'],['notes','Notes générales']];
    const stepFields=(step,i)=>`<fieldset><legend>Étape ${i+1} · ${esc(spotName(step.spotId))}</legend>${[['date','Date'],['notes','Note'],['budget','Budget'],['accommodation','Hébergement'],['transport','Transport']].filter(([key])=>step[key]).map(([key,label])=>`<label><input type="checkbox" name="step-${key}-${esc(step.id)}"> ${label} : ${esc(String(step[key]).slice(0,90))}</label>`).join('')}</fieldset>`;
    const d=dialog(`<span class="community-kicker">VOYAGE PUBLIC</span><h2>Choisir les détails</h2><p>Seuls le titre, la destination et les spots sont inclus au départ. Tous les autres champs restent privés.</p><form id="communityTripForm" class="post-form"><label>Message pour la communauté<textarea name="body" maxlength="2000" minlength="10" required placeholder="Quel conseil aimerais-tu recevoir ou partager ?"></textarea></label><div class="community-share-fields">${fields.filter(([key])=>trip[key]).map(([key,label])=>`<label><input type="checkbox" name="${key}"> ${label} : ${esc(String(trip[key]).slice(0,90))}</label>`).join('')}${trip.steps.map(stepFields).join('')}</div>${rules()}<button class="community-primary">Voir l’aperçu public</button></form><div id="communityTripPreview" hidden></div>`);
    d.querySelector('#communityTripForm').onsubmit=e=>{
      e.preventDefault();const form=e.target,data=new FormData(form),choices={steps:{}};
      for(const [key] of fields)choices[key]=data.has(key);
      for(const step of trip.steps)choices.steps[step.id]=Object.fromEntries(['date','notes','budget','accommodation','transport'].map(key=>[key,data.has('step-'+key+'-'+step.id)]));
      try{
        const known=SPOTS.filter(s=>!s.custom&&!s.archived).map(s=>s.id),snapshot=OceanTripSharing.buildSnapshot(trip,choices,known),body=String(data.get('body')||'').trim();
        if(body.length<10)throw Error('Écris au moins 10 caractères.');
        const preview=d.querySelector('#communityTripPreview');preview.hidden=false;preview.innerHTML=`<h3>Aperçu public après validation</h3><p>${esc(body)}</p>${tripHtml(snapshot)}<p class="community-note">Cette copie reste indépendante de ton carnet privé. Tu pourras la retirer.</p><button class="community-primary" id="communityTripConfirm">Envoyer pour validation</button>`;
        form.hidden=true;preview.querySelector('#communityTripConfirm').onclick=()=>submit({kind:'trip',body,payload:snapshot},d);
      }catch(error){toast(error.message)}
    };
  }
  async function thread(id){
    const d=dialog('<span class="community-kicker">LA CONVERSATION</span><h2>Conseils et réponses</h2><div id="communityReplies">Chargement…</div>');
    try{const data=await api('thread&parentId='+encodeURIComponent(id));d.querySelector('#communityReplies').innerHTML=(data.entries||[]).map(e=>card(e)).join('')||'<p class="community-muted">Pas encore de réponse validée.</p>';
      if(state.me)d.querySelector('#communityReplies').insertAdjacentHTML('beforeend',`<form id="communityReplyForm" data-parent="${esc(id)}" class="post-form"><textarea name="body" maxlength="1200" minlength="10" required placeholder="Ton conseil ou ta question…"></textarea>${rules()}<button class="community-primary">Envoyer ma réponse pour validation</button></form>`);
    }catch(error){d.querySelector('#communityReplies').textContent=errorText(error)}
  }
  function report(id){dialog(`<span class="community-kicker">PROTÉGER LA COMMUNAUTÉ</span><h2>Signaler un contenu</h2><form id="communityReportForm" data-entry="${esc(id)}" class="post-form"><label>Motif<select name="reason"><option value="abuse">Harcèlement</option><option value="danger">Conseil dangereux</option><option value="spam">Spam</option><option value="privacy">Donnée personnelle</option><option value="other">Autre</option></select></label><label>Précision facultative<textarea name="details" maxlength="500"></textarea></label><button class="community-primary">Envoyer le signalement</button></form>`)}
  function deleteAccount(){dialog(`<span class="community-kicker">TON COMPTE</span><h2>Supprimer mon compte</h2><p>Tous tes contenus publics seront retirés. Tes voyages privés enregistrés sur cet appareil restent ici.</p><form id="communityDeleteForm" class="post-form"><label>Écris SUPPRIMER pour confirmer<input name="confirm" autocomplete="off" required></label><button class="community-primary">Supprimer définitivement mon compte</button></form>`)}
  async function submit(entry,d){
    if(!state.me)return toast('Connecte-toi pour participer.');
    try{const displayName=String($('#communityDisplayName')?.value||localStorage.getItem(NAME)||state.me.displayName||'Explorateur').trim();await api('',{action:'submit',entry:{...entry,displayName,rulesVersion:RULES,acceptRules:true}});d?.open&&d.close();toast('Contribution envoyée. Elle attend la validation.');await refresh()}
    catch(error){toast(errorText(error))}
  }
  document.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-retry')){state.status='checking';render();checkService();return}
    if(b.dataset.retryReview){state.reviewErrors.delete(b.dataset.retryReview);mountSpot(b.dataset.retryReview);return}
    if(b.hasAttribute('data-propose'))return propose();
    if(b.hasAttribute('data-private-spot'))return privateSpotDialog();
    if(b.hasAttribute('data-share'))return share();
    if(b.dataset.thread)return thread(b.dataset.thread);
    if(b.dataset.report)return report(b.dataset.report);
    if(b.hasAttribute('data-delete'))return deleteAccount();
    if(b.hasAttribute('data-signout')){const access=await token();if(access)auth('logout',{},access).catch(()=>{});clearAccount();render();if(state.currentSpot)mountSpot(state.currentSpot);return}
    try{
      if(b.dataset.withdraw){await api('',{action:'withdraw',entryId:b.dataset.withdraw});toast('Contribution retirée.');await refresh()}
      if(b.dataset.block){await api('',{action:'block',userId:b.dataset.block});toast('Cet auteur est masqué.');await refresh()}
      if(b.dataset.unblock){await api('',{action:'unblock',userId:b.dataset.unblock});toast('Cet auteur est à nouveau visible.');await refresh()}
      if(b.dataset.moderate){const result=await api('',{action:'moderate',decision:b.dataset.moderate,entryId:b.dataset.entry});state.reviews.clear();toast(result.auditLogged?'Décision enregistrée.':'Décision enregistrée ; journal de modération à vérifier.');await refresh()}
      if(b.dataset.hide){const result=await api('',{action:'moderate',decision:'hide',entryId:b.dataset.hide});state.reviews.clear();toast(result.auditLogged?'Contribution masquée.':'Contribution masquée ; journal de modération à vérifier.');await refresh()}
      if(b.dataset.resolve){await api('',{action:'resolve_report',reportId:b.dataset.resolve});toast('Signalement traité.');await refresh()}
      if(b.dataset.ban&&confirm('Restreindre ce compte et masquer ses contributions publiques ?')){await api('',{action:'ban_user',userId:b.dataset.ban});toast('Compte restreint.');await refresh()}
      if(b.dataset.unban){await api('',{action:'unban_user',userId:b.dataset.unban});toast('Compte rétabli.');await refresh()}
    }catch(error){toast(errorText(error))}
  });
  document.addEventListener('change',async event=>{if(event.target.id==='communityDisplayName'){const name=event.target.value.trim();if(name.length<2||name.length>30)return toast('Choisis un nom de 2 à 30 caractères.');try{await api('',{action:'update_profile',displayName:name});localStorage.setItem(NAME,name);state.me.displayName=name;await refresh();toast('Nom public mis à jour.')}catch(error){toast(errorText(error))}}});
  let pendingEmail='';
  document.addEventListener('submit',async event=>{
    const form=event.target,id=form.id;
    if(!id?.startsWith('community')&&!form.hasAttribute('data-review'))return;
    if(id==='communityTripForm')return;
    event.preventDefault();
    if(id==='communityEmailForm'){
      pendingEmail=String(new FormData(form).get('email')||'').trim().toLowerCase();
      try{await auth('otp',{email:pendingEmail,create_user:true});const code=$('#communityCodeForm');code.hidden=false;code.querySelector('input').focus();toast('Un code a été envoyé si cette adresse peut recevoir nos e-mails.')}
      catch(_){toast('Envoi impossible. Vérifie ton adresse et réessaie.')}return;
    }
    if(id==='communityCodeForm'){
      try{const result=await auth('verify',{email:pendingEmail,token:String(new FormData(form).get('code')||''),type:'email'});if(!result.access_token||!result.refresh_token)throw Error('invalid_session');session({...result,expires_at:Math.floor(Date.now()/1000)+(result.expires_in||3600)});await refresh();toast('Tu es connecté.')}
      catch(_){toast('Code invalide ou expiré. Demande un nouveau code.')}return;
    }
    const data=new FormData(form);
    if(id==='communityPostForm')return submit({kind:'post',body:String(data.get('body')||'').trim()});
    if(form.dataset.review)return submit({kind:'review',body:String(data.get('body')||'').trim(),spotId:form.dataset.review,rating:Number(data.get('rating'))});
    if(id==='communityProposalForm')return submit({kind:'proposal',title:String(data.get('title')||'').trim(),body:String(data.get('body')||'').trim(),payload:{location:String(data.get('location')||'').trim(),lat:Number(data.get('lat')),lon:Number(data.get('lon')),sport:String(data.get('sport')||'').trim()}},form.closest('dialog'));
    if(id==='communityPrivateSpotForm'){
      const name=String(data.get('name')||'').trim(),loc=String(data.get('loc')||'').trim(),lat=Number(data.get('lat')),lon=Number(data.get('lon')),sport=String(data.get('sport')||''),world=String(data.get('world')||''),desc=String(data.get('desc')||'').trim();
      if(!name||name.length>80||!loc||loc.length>100||desc.length>400||!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lon)||lon<-180||lon>180||!(typeof SPORTS!=='undefined'&&SPORTS.some(s=>s.id===sport))||!(typeof WORLDS!=='undefined'&&WORLDS.some(w=>w.id===world)))return toast('Vérifie les informations du spot.');
      const slug=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45)||'spot';
      const item={id:'custom-'+slug+'-'+Date.now().toString(36),name,loc,world,coords:{lat,lon},sports:[sport],desc};
      try{localStorage.setItem('oceanbuddy_custom_spots_v1',JSON.stringify([...readArray('oceanbuddy_custom_spots_v1'),item]));registerPrivateSpots();form.closest('dialog')?.close();render();if(typeof renderSpots==='function')renderSpots();if(typeof renderMap==='function')renderMap(true);toast('Spot ajouté à ta carte privée.')}catch(_){toast('Enregistrement local indisponible.')}return;
    }
    if(id==='communityReplyForm')return submit({kind:'reply',body:String(data.get('body')||'').trim(),parentId:form.dataset.parent},form.closest('dialog'));
    if(id==='communityReportForm'){
      try{await api('',{action:'report',report:{entryId:form.dataset.entry,reason:data.get('reason'),details:String(data.get('details')||'').trim()}});form.closest('dialog')?.close();toast('Signalement transmis à la modération.')}
      catch(error){toast(errorText(error))}return;
    }
    if(id==='communityDeleteForm'){
      try{await api('',{action:'delete_account',confirm:String(data.get('confirm')||'')});clearAccount();form.closest('dialog')?.close();toast('Compte supprimé.');await refresh()}
      catch(error){toast(errorText(error))}
    }
  });
  window.OceanCommunity={render,mountSpot,refresh,checkService};
  window.addEventListener('ocean:navigate',event=>{if(event.detail==='community'){render();state.status==='ready'?refresh():checkService()}});
  render();checkService();
})();
