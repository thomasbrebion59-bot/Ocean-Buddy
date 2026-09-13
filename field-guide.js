/* A practical visit sheet: sourced place information, no inferred seasons or equipment sizes. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  const external='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
  const checks={
    surf:[['Lire les conditions','Consulter la houle, le vent et la marée avant de partir.'],['Repérer la session','Identifier le pic, les zones réservées et les sorties depuis la plage.'],['Vérifier son matériel','Contrôler la planche, les ailerons et le leash.']],
    bodyboard:[['Lire les conditions','Consulter la houle, le vent et la marée.'],['Observer depuis le bord','Repérer les courants, les sorties et les autres pratiquants.'],['Vérifier son matériel','Contrôler le bodyboard, le leash et les palmes.']],
    plongee:[['Choisir la sortie','Confirmer le site, la profondeur et le niveau requis avec le centre de plongée.'],['Préparer le briefing','Vérifier le matériel, le binôme et les consignes avec l’encadrant.'],['Organiser le trajet','Confirmer le rendez-vous et les conditions de départ du bateau.']],
    snorkeling:[['Choisir la zone','Demander les conditions locales, les zones autorisées et les points de sortie.'],['Préparer sa sortie','Prévoir un binôme et un moyen de rester visible en surface.'],['Respecter le récif','Observer sans toucher les coraux ni nourrir les animaux.']],
    paddle:[['Dessiner le parcours','Repérer le départ, le retour et les possibilités de sortie sur la côte.'],['Vérifier le vent','Consulter sa direction et son évolution sur toute la sortie.'],['Préparer son équipement','Vérifier la flottabilité et le matériel adapté au milieu avec un professionnel.']],
    kayak:[['Dessiner le parcours','Repérer le départ, le retour et les possibilités de sortie.'],['Lire les conditions','Vérifier le vent, la marée et l’état du plan d’eau.'],['Préparer son équipement','Contrôler l’embarcation, la pagaie et l’aide à la flottabilité.']],
    baignade:[['Choisir la zone','Repérer les zones autorisées et surveillées ainsi que les drapeaux du jour.'],['Lire les consignes locales','Vérifier les informations affichées sur la plage.'],['Prévoir le retour','Repérer un accès et rester attentif à l’évolution de la mer.']],
    kitesurf:[['Choisir le créneau','Vérifier le vent et ses variations avec l’école ou le club local.'],['Repérer la zone','Identifier les aires autorisées de décollage, de navigation et de retour.'],['Contrôler le matériel','Vérifier les lignes et les systèmes de sécurité avant le départ.']],
    windsurf:[['Choisir le créneau','Vérifier le vent et l’état de l’eau sur la durée de la session.'],['Repérer le retour','Identifier une mise à l’eau autorisée et les zones de sortie.'],['Préparer le gréement','Adapter le matériel avec l’école ou le club local.']]
  };
  const icons={pin:'<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',check:'<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M9 3h6v4H9zM8 14l3 3 5-6"/>',water:'<path d="M2 10c3-4 5 4 8 0s5 4 8 0 3 0 4 0M2 17c3-4 5 4 8 0s5 4 8 0 3 0 4 0"/>',level:'<path d="M4 20V14h4v6M10 20V9h4v11M16 20V4h4v16"/>',leaf:'<path d="M5 20C2 6 13 3 21 3c0 10-5 19-16 17Zm0 0L16 9"/>'};
  const icon=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[k]||icons.compass}</svg>`;
  const voyageArt='<svg class="field-voyage-art" viewBox="0 0 250 120" fill="none" aria-hidden="true"><path d="M-10 95c40-36 63 20 100-10s70 19 95-5 55-5 80-18" stroke="#84c8ec" stroke-width="2"/><path d="M-10 111c40-36 63 20 100-10s70 19 95-5 55-5 80-18" stroke="#84c8ec" stroke-width="2"/><path d="M46 75c-35-60 100-74 110-24s65 35 61-27" stroke="#ffb477" stroke-width="2" stroke-dasharray="4 5"/><circle cx="46" cy="75" r="6" fill="#ffb477"/><path d="m216 10 8 21-9-3-7 7z" fill="#fff" stroke="#fff"/></svg>';
  const storageKey='oceanbuddy_visit_checklist_v1';
  let completed={};try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))completed=saved;}catch(_){}
  const preparationKey=(s,act,i)=>s.id+':'+act+':'+i;
  function source(s){return s.source?`<a class="field-source" href="${esc(s.source.url)}" target="_blank" rel="noopener"><span><small>POUR ALLER PLUS LOIN</small><b>${esc(s.source.label)}</b></span>${external}</a>`:'';}
  function mapURL(s){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.name+' '+s.loc);}
  function facts(s,act){
    const values=[['Destination',s.loc],['Activité',SPORTMAP[act]?.label||'À choisir']];
    if(s.level!=='variable')values.push(['Repère de niveau',LVLTXT[s.level]||s.level]);
    return values;
  }
  function render(s,act){
    const items=(checks[act]||checks.surf).map(item=>isInland(s)?item.map(copy=>copy.replace('la marée et l’état du plan d’eau','les conditions du plan d’eau').replace('l’évolution de la mer','l’évolution du plan d’eau')):item);
    const done=items.filter((_,i)=>completed[preparationKey(s,act,i)]).length;
    return `<div class="field-checklist"><div class="field-check-cover"><span class="field-check-emblem">${levelIcon('expert')}</span><span><small>LE DÉPART SE PRÉPARE ICI</small><b>Prêt pour la session ?</b></span></div><div class="field-list-head"><h3>Avant de partir</h3><span id="fieldProgress">${done} / ${items.length}</span></div><div class="field-progress-track" role="progressbar" aria-label="Préparation de la sortie" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="${done}"><i style="width:${done/items.length*100}%"></i></div>${items.map(([label,copy],i)=>`<label class="field-check"><input type="checkbox" data-visit-check="${preparationKey(s,act,i)}" ${completed[preparationKey(s,act,i)]?'checked':''}><span><b>${esc(label)}</b><small>${esc(copy)}</small></span></label>`).join('')}<button class="field-text-button" data-field-action="conditions">Consulter les conditions ${arrow}</button></div>
      <aside class="field-address"><span class="field-address-mark">${sportIcon('all')}</span><span class="field-eyebrow">TON POINT DE DÉPART</span><h3>${esc(s.name.split(' — ')[0])}</h3><dl>${facts(s,act).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${s.level==='variable'?'<p class="field-level-note">Choisis un secteur adapté à ton expérience avec un encadrant local.</p>':'<p class="field-level-note">Le niveau indiqué reste à confronter aux conditions et au secteur choisis.</p>'}<a class="field-map-link" href="${mapURL(s)}" target="_blank" rel="noopener">Situer le lieu ${external}</a>${source(s)}</aside>${window.OceanNotebook?.note(s)||''}`;
  }
  function update(s,act){
    const overview=$('#fieldOverview');if(!overview)return;
    const c=COORDS[s.id];
    $('#fieldCoordinates').textContent=c?Math.abs(c.lat).toFixed(2)+'° '+(c.lat>=0?'N':'S')+' / '+Math.abs(c.lon).toFixed(2)+'° '+(c.lon>=0?'E':'O'):s.loc;
    $('#fieldCoordinates').title='Repère géographique du secteur ; consulte les accès locaux.';
    $('#fieldLocation').textContent=s.loc;
    $('#fieldActivityName').textContent=SPORTMAP[act]?.label||'Ta sortie';
    $('#fieldIntroTitle').textContent=s.name.split(' — ')[0];
    const name=s.name+' '+s.loc;
    const activity=SPORTMAP[act]?.label||'nautique';
    overview.innerHTML=`${voyageArt}<span class="field-eyebrow">UNE ENVIE DE DÉPART ?</span><h3>Fais-en<br>une étape.</h3><p>Garde ce lieu dans ton itinéraire et retrouve-le au moment de partir.</p><button class="field-primary" data-field-action="trip">Ajouter à mon voyage ${arrow}</button><a class="field-map-link" href="${mapURL(s)}" target="_blank" rel="noopener">Situer le lieu sur la carte ${external}</a><div class="field-compare-slot">${window.OceanNotebook?.button(s.id)||''}</div>`;
    const level=s.level==='variable'?'À définir sur place':(LVLTXT[s.level]||'À confirmer');
    $('#fieldAtAGlance').innerHTML=[['activity','Ton activité',SPORTMAP[act]?.label||'À choisir',sportIcon(act)],['water','Le cadre',isInland(s)?'Eau douce':'Mer & océan',sportIcon(isInland(s)?'kayak':'snorkeling')],['level','Repère de niveau',level,levelIcon(s.level)]].map(([key,label,value,art])=>`<button type="button" class="field-fact-card fact-${key}" data-im-open="${{activity:'terrain',water:'eau',level:'niveau'}[key]}"><span class="field-fact-icon">${art}</span><div><small>${label}</small><b>${esc(value)}</b></div></button>`).join('');
    window.OceanNotebook?.sync();
    $('#fieldLocalSource').innerHTML=source(s);
    const photo=OceanPhotos.lead(s.id,act);
    $('#fieldPhotoLink').href=photo?.source||'photos.html';$('#fieldPhotoLink').textContent=photo?(photo.caption?photo.caption+' · ':s.photoContext?s.photoContext+' · ':'')+'Photographie : '+photo.author+' ↗':'Crédits photographiques ↗';
    $('#fieldSchoolLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('école '+activity+' '+name);
    $('#fieldShopLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('location matériel '+activity+' '+name);
    const near=SPOTS.filter(x=>x.id!==s.id&&SPOT_WORLD[x.id]===SPOT_WORLD[s.id]&&spotSports(x).includes(act)&&c&&COORDS[x.id]&&distKm(c.lat,c.lon,COORDS[x.id].lat,COORDS[x.id].lon)<=200).sort((a,b)=>{
      const ca=COORDS[a.id],cb=COORDS[b.id];if(!c||!ca||!cb)return 0;
      return distKm(c.lat,c.lon,ca.lat,ca.lon)-distKm(c.lat,c.lon,cb.lat,cb.lon);
    }).slice(0,3);
    $('#fieldNearby').innerHTML=near.map(x=>`<button class="field-nearby-card" data-field-spot="${x.id}"><img src="${esc(spotPhotoUrl(x.id,480)||WORLD_PHOTOS[SPOT_WORLD[x.id]].src)}" alt="" loading="lazy"><span><small>${esc(x.loc)}</small><b>${esc(x.name.split(' — ')[0])}</b></span>${arrow}</button>`).join('');
    $('#fieldNearbyBlock').hidden=!near.length;
    $('#dDangers').closest('.block').hidden=!s.dangers.length;
  }
  window.OceanFieldGuide={facts,render,update};
  // Keep the existing render targets while replacing the ornamental wrappers.
  const infos=$('#detail .dcat[data-cat="infos"]');infos.classList.add('field-overview');
  const intro=$('#dDesc').closest('.block');intro.className='block field-story';
  intro.querySelector('h4').innerHTML='<span class="field-eyebrow" id="fieldLocation"></span><span id="fieldIntroTitle"></span>';
  intro.insertAdjacentHTML('beforeend','<div id="fieldAtAGlance" class="field-at-a-glance" aria-label="Caractéristiques du spot"></div>');
  intro.insertAdjacentHTML('afterbegin','<div class="field-coordinates" id="fieldCoordinates"></div>');
  infos.querySelectorAll('.block').forEach(b=>{if(b!==intro){b.hidden=true;b.classList.add('field-retired');}});
  infos.insertAdjacentHTML('beforeend','<aside id="fieldOverview" class="field-trip"></aside><div class="field-reference"><div id="fieldLocalSource"></div><a id="fieldPhotoLink" target="_blank" rel="noopener"></a></div><section id="fieldNearbyBlock" class="field-nearby"><div class="field-section-heading"><div><span class="field-eyebrow">PROLONGER L’ESCAPADE</span><h3>Dans les environs</h3></div><span>Même activité · rayon de 200 km</span></div><div id="fieldNearby"></div></section>');
  $('#dZonesBlock').classList.add('field-retired');
  const guide=$('#dGuide').closest('.block');guide.className='block field-preparation';guide.removeAttribute('style');
  guide.querySelector('h4').innerHTML='<span class="field-eyebrow" id="fieldActivityName">TA SESSION</span><span>Préparer ta session.</span>';
  $('#dGuide').className='field-guide-layout';
  $('#dGuideSub').textContent='Choisis ton activité pour préparer ta sortie.';
  guide.querySelector('.g-note').textContent='Ces cases servent à préparer ta sortie. Sur place, les consignes du gestionnaire et de l’encadrant restent prioritaires.';
  const services=$('#dShop').closest('.block');services.className='block field-local';
  services.innerHTML=`<div><span class="field-eyebrow">SUR PLACE</span><h3>Les bonnes adresses,<br>près du spot.</h3><p>Ouvre la carte pour trouver un professionnel et vérifier ses disponibilités.</p></div><div class="field-local-links"><a id="fieldSchoolLink" target="_blank" rel="noopener"><span><b>Écoles & encadrants</b><small>Cours, briefing et sorties accompagnées</small></span>${external}</a><a id="fieldShopLink" target="_blank" rel="noopener"><span><b>Location & matériel</b><small>Préparer et vérifier ton équipement</small></span>${external}</a></div><button id="dShop" hidden></button><button id="dSchool" hidden></button>`;
  const latest=document.createElement('section');latest.className='field-arrivals';latest.setAttribute('aria-labelledby','newPlacesHeading');
  const selection=['serreponcon','elnido','rottnest'].map(id=>SPOTS.find(s=>s.id===id)).filter(Boolean);
  latest.innerHTML=`<div class="field-arrivals-head"><div><span class="field-eyebrow">LE CARNET S’AGRANDIT · ${SPOTS.filter(s=>s.catalogNew).length} NOUVEAUX SPOTS</span><h2 id="newPlacesHeading">Et si on partait là ?</h2></div><button class="field-text-button" data-field-action="new">Voir les nouveautés ${arrow}</button></div><div class="field-arrivals-grid">${selection.map(s=>`<button class="field-arrival" data-field-spot="${s.id}"><span class="field-arrival-image"><img src="${esc(spotPhotoUrl(s.id,720))}" alt="" loading="lazy"><span>${esc(SPORTMAP[s.sports[0]].label)}</span></span><span class="field-arrival-text"><span><small>${esc(s.loc)}</small><b>${esc(s.name.split(' — ')[0])}</b></span>${arrow}</span></button>`).join('')}</div>`;
  $('.poulpy-activities').after(latest);
  const newFilter=document.createElement('button');newFilter.type='button';newFilter.className='chip';newFilter.dataset.f='new';newFilter.textContent='Nouveautés';newFilter.onclick=()=>filterSpots(newFilter,'new');$('#filters [data-f="all"]').after(newFilter);
  $('#filters').insertAdjacentHTML('afterend','<p class="field-result-count" id="spotResultCount" aria-live="polite"></p>');
  renderSpots(currentFilter,true);
  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-field-action]');
    if(action?.dataset.fieldAction==='new'){setSport(null);openWorld('all');filterSpots(newFilter,'new');}
    if(action?.dataset.fieldAction==='trip')OceanTrips.fromSpot(currentSpot);
    if(action?.dataset.fieldAction==='conditions')showDetailCat('meteo');
    const spot=e.target.closest('[data-field-spot]');if(spot)openSpot(spot.dataset.fieldSpot);
  });
  document.addEventListener('change',e=>{
    const key=e.target.dataset.visitCheck;if(!key)return;
    if(e.target.checked)completed[key]=true;else delete completed[key];
    try{localStorage.setItem(storageKey,JSON.stringify(completed));}catch(_){}
    const boxes=[...document.querySelectorAll('[data-visit-check]')],done=boxes.filter(x=>x.checked).length;$('#fieldProgress').textContent=done+' / '+boxes.length;const progress=$('.field-progress-track');progress.setAttribute('aria-valuenow',done);progress.querySelector('i').style.width=done/boxes.length*100+'%';
  });
})();
