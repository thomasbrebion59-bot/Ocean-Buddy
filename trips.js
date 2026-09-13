/* Surf trips — a locally saved travel notebook connected to the spot catalogue. */
(() => {
  'use strict';
  const M=TripModel, $=s=>document.querySelector(s), ids=SPOTS.map(s=>s.id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(path)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const I={trash:icon('M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7'),plus:icon('M12 5v14M5 12h14'),route:icon('M5 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4m14 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4M5 9v4a4 4 0 0 0 4 4h4m-2-10h4a4 4 0 0 1 4 4v4'),calendar:icon('M5 5h14v16H5zM8 3v4m8-4v4M5 10h14'),bag:icon('M4 8h16v13H4zM8 8V3h8v5'),check:icon('m5 12 4 4 10-10'),arrow:icon('M5 12h14m-6-6 6 6-6 6'),close:icon('m6 6 12 12M6 18 18 6'),map:icon('m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16')};
  const ideas=[
    {name:'La côte basque, au rythme des vagues',short:'Côte basque',destination:'France',tag:'UN ROAD TRIP À DEUX PAS',photo:'biarritz',spots:['biarritz','anglet','hossegor']},
    {name:'Du soleil et des vagues au Portugal',short:'Portugal',destination:'Portugal',tag:'L’ATLANTIQUE EN GRAND',photo:'praia_marinha',spots:['ericeira','supertubos','praia_marinha']},
    {name:'Bali, d’une côte à l’autre',short:'Bali',destination:'Indonésie',tag:'UNE ÎLE, MILLE HORIZONS',photo:'uluwatu',spots:['uluwatu','padang','keramas']}
  ];
  let trips=[],selected=null,view='itinerary',loadError='',tripMap=null,lastFocus=null,pendingSpot=null;
  try{trips=M.load(localStorage,ids)}catch(e){loadError='Ton carnet ne peut pas être chargé. Les données existantes sont conservées. Réessaie après avoir rechargé la page.';}
  const active=()=>trips.filter(t=>!t.archived&&!t.deleted), current=()=>trips.find(t=>t.id===selected&&!t.archived&&!t.deleted);
  const spot=id=>SPOTS.find(s=>s.id===id);
  const photo=id=>spotPhotoUrl(id,1280)||'assets/photos/hero.jpg';
  const date=v=>v?new Date(v+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'Dates à définir';
  const range=t=>t.start?(date(t.start)+(t.end?' — '+date(t.end):'')):(t.end?'Jusqu’au '+date(t.end):'Dates à définir');
  const region=t=>t.steps.length?SPOT_WORLD[t.steps[0].spotId]:'as';
  const cover=t=>t.steps.length?photo(t.steps[0].spotId):WORLD_PHOTOS[region(t)||'as'].src;
  function persist(next){
    if(loadError){toast(loadError);return false;}
    try{M.save(localStorage,next);trips=next;renderProfile();return true}catch(e){toast('Enregistrement impossible. Vérifie l’espace disponible ou l’accès au stockage de ton navigateur.');return false;}
  }
  function update(fn,{draw=true}={}){const t=current();if(!t)return false;try{const next=fn(t);if(persist(trips.map(x=>x.id===t.id?next:x))){if(draw)render();return true}}catch(e){toast(e.message)}return false;}
  const badge=t=>`${t.steps.length} spot${t.steps.length>1?'s':''}${M.duration(t)?' · '+M.duration(t)+' jour'+(M.duration(t)>1?'s':''):''}`;
  function render(){
    const wrap=$('#screenWrap'),scroll=wrap.scrollTop,focus=document.activeElement?.dataset.focus;
    if(tripMap){tripMap.remove();tripMap=null;}
    const t=current(),saved=active();
    $('#trips').classList.toggle('has-trip',!!t);
    $('#tripContent').innerHTML=`<div class="trip-heading"><div><div class="page-eyebrow">LE VOYAGE COMMENCE AVANT LE DÉPART</div><h1>Les bons spots.<br><span>Dans le bon ordre.</span></h1><p>Rassemble tes envies. Dessine ton itinéraire. Prépare le grand départ.</p></div><button class="trip-primary" data-action="new">${I.plus} Nouveau voyage</button></div>${loadError?`<p class="trip-error" role="alert">${loadError}</p>`:''}
      ${saved.length?`<div class="trip-switch"><button class="${t?'':'active'}" data-action="overview">Mes voyages <b>${saved.length}</b></button>${saved.map(x=>`<button class="${x.id===selected?'active':''}" data-action="select" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>`:''}
      ${t?tripDetail(t):overview(saved)}
      <p class="trip-storage">${loadError?'':I.check+' Ton carnet est enregistré sur cet appareil.'} <a href="photos.html" target="_blank" rel="noopener">Crédits photos</a></p>`;
    wrap.scrollTop=scroll;
    if(focus)document.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});
    if(t&&view==='map')requestAnimationFrame(()=>drawMap(t));
  }
  function storedTrips(title,list,trash=false){
    if(!list.length)return '';
    return `<details class="trip-archives ${trash?'trip-trash':''}"><summary>${title} (${list.length})</summary>${trash?'<p class="trip-trash-note">Les voyages supprimés restent récupérables sur cet appareil.</p>':''}${list.map(t=>`<div class="trip-stored-row"><span class="trip-stored-info"><b>${esc(t.name)}</b><small>${esc(range(t))} · ${badge(t)}${trash&&t.archived?' · Archivé':''}</small></span><span class="trip-stored-actions"><button data-action="${trash?'recover':'restore'}" data-id="${esc(t.id)}" aria-label="Restaurer ${esc(t.name)}">Restaurer</button>${trash?'':`<button class="trip-delete-action" data-action="delete" data-id="${esc(t.id)}" aria-label="Supprimer ${esc(t.name)}">${I.trash}<span>Supprimer</span></button>`}</span></div>`).join('')}</details>`;
  }
  function overview(saved){
    const archived=trips.filter(t=>t.archived&&!t.deleted),deleted=trips.filter(t=>t.deleted);
    return `${saved.length?`<div class="trip-saved-grid">${saved.map(t=>`<article class="trip-saved-card"><button class="trip-saved" data-action="select" data-id="${esc(t.id)}"><img src="${esc(cover(t))}" alt="" loading="lazy"><span class="trip-saved-body"><small>${esc(t.destination||'Ton prochain horizon')}</small><b>${esc(t.name)}</b><span>${esc(range(t))}</span><em>${badge(t)} ${I.arrow}</em></span></button><div class="trip-card-actions"><button class="trip-delete-action" data-action="delete" data-id="${esc(t.id)}" aria-label="Supprimer ${esc(t.name)}">${I.trash} Supprimer</button></div></article>`).join('')}</div>`:`<div class="trip-welcome"><img src="${esc(WORLD_PHOTOS.as.src)}" alt="Paysage des îles Raja Ampat"><div><span class="trip-pill">LE CARNET DE TES ENVIES</span><h2>Ton prochain<br>grand départ.</h2><p>Repère tes spots, choisis tes étapes<br>et prépare ton sac.</p><button class="trip-primary" data-action="new">${trips.length?'Créer un nouveau trip':'Créer mon premier trip'} ${I.arrow}</button></div><figure class="trip-poulpy-postcard"><img src="assets/poulpy/scenes/travel-v2.webp" alt="Poulpy l’explorateur avec sa carte et sa boussole" width="960" height="640"><figcaption>Prochaine escale : tes envies.</figcaption></figure><span class="trip-stamp">LE LARGE<br>NOUS ATTEND.</span></div>`}
      ${storedTrips('Voyages archivés',archived)}${storedTrips('Corbeille',deleted,true)}
      <div class="trip-section-title"><div><span class="page-eyebrow">UNE ÉTINCELLE POUR COMMENCER</span><h2>Trois idées. Ton aventure.</h2></div><span>Des itinéraires à personnaliser</span></div>
      <div class="trip-ideas">${ideas.map((x,i)=>`<article class="trip-idea"><img src="${esc(photo(x.photo))}" alt="${esc(x.short)}" loading="lazy"><div><small>${x.tag}</small><h3>${x.short}</h3><p>${x.spots.map(id=>esc(spot(id).name.split(' — ')[0])).join(' → ')}</p><button data-action="idea" data-index="${i}">Personnaliser ces 3 étapes ${I.arrow}</button></div></article>`).join('')}</div>
      `;
  }
  function tripDetail(t){
    const done=t.checklist.filter(c=>c.done).length;
    return `<div class="trip-banner" style="--trip-cover:url('${esc(cover(t))}')"><div><span class="trip-pill">${esc(t.destination||'MON PROCHAIN VOYAGE')}</span><h2>${esc(t.name)}</h2><p>${I.calendar} ${esc(range(t))} <span>·</span> ${badge(t)}</p></div><button class="trip-glass" data-action="edit">Modifier le voyage</button></div>
      <div class="trip-layout"><div class="trip-main"><div class="trip-toolbar"><div class="trip-view"><button data-action="view" data-view="itinerary" class="${view==='itinerary'?'active':''}">${I.route} Itinéraire</button><button data-action="view" data-view="map" class="${view==='map'?'active':''}">${I.map} Carte</button></div><button class="trip-primary" data-action="add">${I.plus} Ajouter un spot</button></div>
      ${view==='map'?`<div id="tripMap" class="trip-map" aria-label="Carte des étapes"></div><p class="trip-map-note">La ligne relie les étapes dans l’ordre prévu. Elle ne représente pas un trajet routier.</p>`:`<div class="trip-steps">${t.steps.length?t.steps.map((s,i)=>stepCard(t,s,i)).join(''):`<div class="trip-no-steps">${I.route}<h3>Le premier spot donne le ton.</h3><p>Pioche dans les ${SPOTS.length} spots du catalogue pour commencer ton itinéraire.</p><button class="trip-primary" data-action="add">Choisir mon premier spot ${I.arrow}</button></div>`}</div>`}
      <div class="trip-notes-panel"><h3>Le carnet de bord</h3><label for="tripNotes">Idées, bonnes adresses, envies à garder…</label><textarea id="tripNotes" data-field="notes" data-focus="notes" rows="3" maxlength="2000" placeholder="Un coucher de soleil à ne pas manquer, une adresse conseillée…">${esc(t.notes)}</textarea><div class="trip-footer-actions"><button data-action="export">Exporter mon carnet (.json)</button><button data-action="archive" class="trip-muted-button">Archiver ce voyage</button><button data-action="delete" data-id="${esc(t.id)}" class="trip-delete-action">${I.trash} Supprimer ce voyage</button></div></div></div>
      <aside class="trip-preparation"><div class="trip-check-panel"><div class="trip-panel-title">${I.bag}<h3>Prêt à partir ?</h3><span>${done}/${t.checklist.length}</span></div><div class="trip-progress"><i style="width:${t.checklist.length?done/t.checklist.length*100:0}%"></i></div><div class="trip-checklist">${t.checklist.map(c=>`<label class="${c.done?'done':''}"><input type="checkbox" data-check="${esc(c.id)}" data-focus="check-${esc(c.id)}" ${c.done?'checked':''}><span>${esc(c.label)}</span></label>`).join('')}</div><form id="tripCheckForm"><label class="sr-only" for="newCheck">Ajouter une tâche</label><input id="newCheck" maxlength="160" placeholder="Ajouter une tâche…" required><button aria-label="Ajouter la tâche">${I.plus}</button></form></div>
      <div class="trip-logistics"><h3>Les détails qui comptent</h3><label for="tripStay">Hébergement</label><input id="tripStay" data-field="accommodation" data-focus="stay" maxlength="2000" value="${esc(t.accommodation)}" placeholder="Adresse, réservation, contact…"><label for="tripTransport">Transport</label><input id="tripTransport" data-field="transport" data-focus="transport" maxlength="2000" value="${esc(t.transport)}" placeholder="Vol, train, voiture, bateau…"><label for="tripBudget">Budget prévu (€)</label><input id="tripBudget" data-field="budget" data-focus="budget" inputmode="decimal" value="${esc(t.budget)}" placeholder="Ton enveloppe pour le voyage"></div>
      <div class="trip-tip"><img src="assets/poulpy/scenes/travel-v2.webp" alt=""><p><b>Le conseil de Poulpy</b>Garde de la souplesse dans ton itinéraire. Avant chaque session, ouvre la fiche du spot pour vérifier les conditions et les points de vigilance.</p></div></aside></div>`;
  }
  function stepCard(t,s,i){
    const p=spot(s.spotId);if(!p)return'';
    return `<article class="trip-step"><div class="trip-step-number">${String(i+1).padStart(2,'0')}</div><div class="trip-step-photo"><img src="${esc(photo(p.id))}" alt="" loading="lazy"><button data-action="spot" data-spot="${p.id}">Voir le spot ↗</button></div><div class="trip-step-info"><small>${esc(p.loc)}</small><h3>${esc(p.name.split(' — ')[0])}</h3><span class="trip-level">${levelIcon(p.level)}${esc(lvlLabel[p.level])} · ${spotSports(p).slice(0,3).map(id=>esc(SPORTMAP[id].label)).join(' · ')}</span><div class="trip-step-fields"><label>Date de l’étape<input type="date" aria-label="Date : ${esc(p.name)}" data-step-date="${esc(s.id)}" data-focus="date-${esc(s.id)}" value="${esc(s.date)}" ${t.start?`min="${t.start}"`:''} ${t.end?`max="${t.end}"`:''}></label><label>À prévoir<input type="text" aria-label="Notes : ${esc(p.name)}" maxlength="1000" data-step-notes="${esc(s.id)}" data-focus="step-${esc(s.id)}" value="${esc(s.notes)}" placeholder="Session, accès, matériel…"></label></div></div><div class="trip-step-controls"><button data-action="up" data-id="${esc(s.id)}" ${i===0?'disabled':''} aria-label="Monter ${esc(p.name)}">↑</button><button data-action="down" data-id="${esc(s.id)}" ${i===t.steps.length-1?'disabled':''} aria-label="Descendre ${esc(p.name)}">↓</button><button data-action="remove" data-id="${esc(s.id)}" aria-label="Retirer ${esc(p.name)}">${I.close}</button></div></article>`;
  }
  const modal=document.createElement('dialog');modal.id='tripDialog';modal.className='trip-dialog';document.body.append(modal);
  function openDialog(html,initialFocus=null){lastFocus=document.activeElement;modal.innerHTML=`<img class="trip-dialog-poulpy" src="assets/poulpy/scenes/travel-v2.webp" alt="" width="640" height="640"><button class="trip-dialog-close" data-close aria-label="Fermer">${I.close}</button>${html}`;const heading=modal.querySelector('h2');if(heading){heading.id='tripDialogTitle';modal.setAttribute('aria-labelledby',heading.id);}modal.showModal();modal.querySelector(initialFocus||'input,select,button:not([data-close])')?.focus();}
  function closeDialog(){modal.close();lastFocus?.isConnected&&lastFocus.focus();}
  modal.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target===modal)closeDialog()});
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDialog();}});
  modal.addEventListener('cancel',()=>{lastFocus?.isConnected&&lastFocus.focus()});
  function confirmDelete(id){
    const t=trips.find(t=>t.id===id&&!t.deleted);if(!t)return;
    openDialog(`<span class="page-eyebrow">TON CARNET DE VOYAGES</span><h2>Supprimer ce voyage ?</h2><div class="trip-delete-summary"><b>${esc(t.name)}</b><span>${esc(range(t))} · ${badge(t)}</span></div><p>Ce voyage sera retiré de ta liste. Ses étapes, notes et préparatifs resteront récupérables dans la <b>corbeille</b> sur cet appareil.</p><p class="trip-form-error" role="alert"></p><div class="trip-confirm-actions"><button id="tripDeleteCancel" data-close>Annuler</button><button id="tripDeleteConfirm" class="trip-delete-confirm">${I.trash} Supprimer le voyage</button></div>`,'#tripDeleteCancel');
    $('#tripDeleteConfirm').onclick=()=>{
      try{
        const next=M.removeTrip(trips,id);
        if(!persist(next)){modal.querySelector('.trip-form-error').textContent='La suppression n’a pas été enregistrée. Ton voyage est conservé. Réessaie après avoir vérifié le stockage du navigateur.';return;}
        selected=null;view='itinerary';closeDialog();render();
        $('#screenWrap').scrollTop=0;$('#tripContent [data-action="overview"],#tripContent [data-action="new"]')?.focus({preventScroll:true});
        toast('Voyage supprimé. Tu peux le restaurer depuis la corbeille.');
      }catch(error){modal.querySelector('.trip-form-error').textContent=error.message;}
    };
  }
  function editor(existing=null,idea=null,spotId=null){
    const fields=existing||{name:idea?.name||'',destination:idea?.destination||(spotId?spot(spotId)?.loc:'')||'',start:'',end:''};
    openDialog(`<span class="page-eyebrow">${existing?'TON PROJET PREND FORME':'ON PART OÙ ?'}</span><h2>${existing?'Les détails du voyage':'Un nouveau départ.'}</h2><p>Les dates peuvent attendre. Commence par une envie.</p><form id="tripEditForm"><label for="tripNameInput">Nom du voyage</label><input id="tripNameInput" name="name" value="${esc(fields.name)}" maxlength="70" placeholder="Mon été sur la côte basque" required><label for="tripDestinationInput">Destination</label><input id="tripDestinationInput" name="destination" value="${esc(fields.destination)}" maxlength="100" placeholder="Une région, un pays, un horizon…"><div class="trip-date-fields"><label>Départ<input name="start" type="date" value="${esc(fields.start)}"></label><label>Retour<input name="end" type="date" value="${esc(fields.end)}"></label></div><p class="trip-form-error" role="alert"></p><button class="trip-primary" type="submit">${existing?'Enregistrer les modifications':'Créer mon voyage'} ${I.arrow}</button></form>`);
    $('#tripEditForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{
      let next=existing?M.edit(existing,f):M.create(f,spotId?[spotId]:(idea?.spots||[]));
      window.OceanNavigation?.begin();
      if(persist(existing?trips.map(t=>t.id===existing.id?next:t):[...trips,next])){selected=next.id;view='itinerary';closeDialog();go('trips');render();$('#screenWrap').scrollTop=0;toast(existing?'Voyage mis à jour':'Ton voyage est créé. À toi de choisir la suite !');}
    }catch(err){modal.querySelector('.trip-form-error').textContent=err.message}};
  }
  function picker(){
    openDialog(`<span class="page-eyebrow">UNE NOUVELLE ÉTAPE</span><h2>Le prochain spot ?</h2><label class="sr-only" for="tripSpotSearch">Rechercher dans les spots</label><input id="tripSpotSearch" type="search" placeholder="Nom du spot, pays, région…" autocomplete="off"><div class="trip-picker-filters"><label for="tripRegion">Région</label><select id="tripRegion"><option value="all">Toutes les destinations</option>${WORLDS.map(w=>`<option value="${w.id}">${w.lab}</option>`).join('')}</select><label class="trip-only-favs"><input id="tripOnlyFavs" type="checkbox"> Mes favoris</label></div><div id="tripSpotResults" class="trip-spot-results"></div>`);
    const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    function results(){const q=normal($('#tripSpotSearch').value),r=$('#tripRegion').value,list=SPOTS.filter(s=>normal(s.name+' '+s.loc).includes(q)&&(r==='all'||SPOT_WORLD[s.id]===r)&&(!$('#tripOnlyFavs').checked||favs.has(s.id)));
      $('#tripSpotResults').innerHTML=`<p class="trip-result-count">${list.length} spot${list.length>1?'s':''}${list.length>30?' · 30 premiers résultats':''}</p>${list.slice(0,30).map(s=>`<button data-pick="${s.id}"><img src="${esc(photo(s.id))}" alt="" loading="lazy"><span><b>${esc(s.name)}</b><small>${esc(s.loc)} · ${esc(lvlLabel[s.level])}</small>${current()?.steps.some(x=>x.spotId===s.id)?'<em>Déjà prévu · ajouter une autre session</em>':''}</span>${I.plus}</button>`).join('')}${!list.length?'<p>Aucun spot trouvé. Essaie un autre lieu ou enlève un filtre.</p>':''}`;
    }
    $('#tripSpotSearch').oninput=results;$('#tripRegion').onchange=results;$('#tripOnlyFavs').onchange=results;
    $('#tripSpotResults').onclick=e=>{const b=e.target.closest('[data-pick]');if(!b)return;if(update(t=>M.addStep(t,b.dataset.pick,ids))){closeDialog();toast('Spot ajouté à ton itinéraire');}};results();
  }
  function fromSpot(spotId){
    if(!spot(spotId))return;
    pendingSpot=spotId;
    const saved=active();
    if(!saved.length){editor(null,null,spotId);return;}
    openDialog(`<span class="page-eyebrow">GARDE CE SPOT POUR PLUS TARD</span><h2>Dans quel voyage ?</h2><p>${esc(spot(spotId).name)}</p><div class="trip-select-list">${saved.map(t=>`<button data-add-to="${esc(t.id)}"><span><b>${esc(t.name)}</b><small>${esc(range(t))}</small></span>${I.plus}</button>`).join('')}</div><button class="trip-primary" id="tripNewFromSpot">Créer un nouveau voyage ${I.plus}</button>`);
    modal.querySelectorAll('[data-add-to]').forEach(b=>b.onclick=()=>{const t=trips.find(t=>t.id===b.dataset.addTo);if(persist(trips.map(x=>x.id===t.id?M.addStep(t,spotId,ids):x))){selected=t.id;closeDialog();toast('Ajouté à « '+t.name+' »');}});
    $('#tripNewFromSpot').onclick=()=>{closeDialog();editor(null,null,spotId)};
  }
  function drawMap(t){
    const host=$('#tripMap');if(!host)return;
    if(typeof L==='undefined'){host.innerHTML='<p>La carte nécessite une connexion. Ton itinéraire reste disponible dans l’onglet voisin.</p>';return;}
    const coords=t.steps.map((s,i)=>({s,i,c:COORDS[s.spotId]})).filter(x=>x.c);
    if(!coords.length){host.innerHTML='<p>Ajoute un spot pour voir ton voyage sur la carte.</p>';return;}
    tripMap=L.map(host,{scrollWheelZoom:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:18}).addTo(tripMap);
    const points=coords.map(({s,i,c})=>{const p=[c.lat,c.lon];L.marker(p,{icon:L.divIcon({className:'trip-map-pin',html:String(i+1),iconSize:[32,32]})}).addTo(tripMap).bindPopup(`<b>${esc(spot(s.spotId).name)}</b><br>${s.date?esc(date(s.date)):'Date à définir'}`);return p;});
    if(points.length>1){L.polyline(points,{color:'#2154dc',weight:3,dashArray:'7 8'}).addTo(tripMap);tripMap.fitBounds(points,{padding:[40,40],maxZoom:11})}else tripMap.setView(points[0],11);
  }
  $('#tripContent').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='new')editor();
    if(a==='delete')confirmDelete(id);
    if(a==='edit')editor(current());
    if(a==='idea')editor(null,ideas[+b.dataset.index]);
    if(a==='overview'){window.OceanNavigation?.begin();selected=null;render();$('#screenWrap').scrollTop=0;}
    if(a==='select'){window.OceanNavigation?.begin();selected=id;view='itinerary';render();$('#screenWrap').scrollTop=0;}
    if(a==='add')picker();
    if(a==='view'){view=b.dataset.view;render()}
    if(a==='spot')openSpot(b.dataset.spot);
    if(a==='up'||a==='down')update(t=>M.moveStep(t,id,a==='up'?-1:1));
    if(a==='remove'){const t=current(),removed=t.steps.find(s=>s.id===id),position=t.steps.findIndex(s=>s.id===id);if(update(t=>({...t,steps:t.steps.filter(s=>s.id!==id)}))){toast('Étape retirée');showUndo(()=>update(t=>{const steps=t.steps.slice();steps.splice(Math.min(position,steps.length),0,removed);return {...t,steps}}));}}
    if(a==='archive'){const t=current();if(persist(trips.map(x=>x.id===t.id?{...x,archived:true}:x))){selected=null;render();toast('Voyage archivé. Retrouve-le dans la rubrique « Voyages archivés ».');}}
    if(a==='restore'){if(persist(trips.map(t=>t.id===id&&!t.deleted?{...t,archived:false}:t))){selected=id;view='itinerary';render();$('#screenWrap').scrollTop=0;toast('Voyage restauré');}}
    if(a==='recover'){
      try{const t=trips.find(t=>t.id===id&&t.deleted);if(!t)return;
        if(persist(M.restoreTrip(trips,id))){selected=t.archived?null:id;view='itinerary';render();
          const archives=$('.trip-archives:not(.trip-trash)');
          if(t.archived&&archives){archives.open=true;archives.querySelector('summary').focus();}else{$('#screenWrap').scrollTop=0;}
          toast(t.archived?'Voyage rétabli dans les archives.':'Voyage restauré avec ses étapes et ses notes.');
        }
      }catch(error){toast(error.message)}
    }
    if(a==='export'){const t=current(),blob=new Blob([JSON.stringify({application:'Ocean Buddy',version:1,trip:t},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(t.name.replace(/[^a-zA-Z0-9À-ÿ -]/g,'').slice(0,60)||'surf-trip')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  });
  function showUndo(fn){const b=document.createElement('button');b.className='trip-undo';b.textContent='Annuler le retrait';b.onclick=()=>{fn();b.remove()};$('#tripContent').append(b);setTimeout(()=>b.remove(),12000);}
  // Save text as it is entered, including before a navigation replaces the form.
  $('#tripContent').addEventListener('input',e=>{
    const el=e.target,t=current();if(!t)return;
    if(el.dataset.field){
      if(el.dataset.field==='budget'&&el.value&&!/^\d+(?:[.,]\d{1,2})?$/.test(el.value))return;
      update(t=>M.edit(t,{[el.dataset.field]:el.value}),{draw:false});
    }
    if(el.dataset.stepNotes){const s=t.steps.find(s=>s.id===el.dataset.stepNotes);update(t=>M.editStep(t,s.id,{date:s.date,notes:el.value}),{draw:false});}
  });
  $('#tripContent').addEventListener('change',e=>{const el=e.target,t=current();if(!t)return;
    if(el.dataset.check)update(t=>({...t,checklist:t.checklist.map(c=>c.id===el.dataset.check?{...c,done:el.checked}:c)}));
    if(el.dataset.field){const key=el.dataset.field;if(!update(t=>M.edit(t,{[key]:el.value}),{draw:false}))el.value=t[key];}
    const id=el.dataset.stepDate||el.dataset.stepNotes;if(id){const s=t.steps.find(s=>s.id===id),fields={date:el.dataset.stepDate?el.value:s.date,notes:el.dataset.stepNotes?el.value:s.notes};if(!update(t=>M.editStep(t,id,fields),{draw:false}))el.value=el.dataset.stepDate?s.date:s.notes;}
  });
  $('#tripContent').addEventListener('submit',e=>{if(e.target.id==='tripCheckForm'){e.preventDefault();const label=$('#newCheck').value.trim();if(label)update(t=>({...t,checklist:[...t.checklist,{id:M.uid(),label,done:false}]}));}});
  window.addEventListener('ocean:navigate',e=>{if(e.detail==='trips')render()});
  const detailCTA=document.createElement('button');detailCTA.className='trip-add-from-spot';detailCTA.innerHTML=I.plus+' Ajouter à un voyage';detailCTA.onclick=()=>fromSpot(currentSpot);$('#dTabs').before(detailCTA);
  const homeCTA=document.createElement('button');homeCTA.className='home-trip-link';homeCTA.innerHTML=I.route+' Préparer mon surf trip '+I.arrow;homeCTA.onclick=()=>go('trips');$('.hero-cta').after(homeCTA);
  window.OceanTrips={count:()=>active().length,fromSpot,open:()=>go('trips'),route:()=>({selected:current()?.id||null,view}),restoreRoute:r=>{selected=trips.some(t=>t.id===r?.selected&&!t.archived&&!t.deleted)?r.selected:null;view=r?.view==='map'?'map':'itinerary';}};
  render();renderProfile();
})();
