/* Compare actual destination information and keep a private note for each place. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),M=SpotNotebookModel,knownIds=()=>SPOTS.map(s=>s.id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=M.load(localStorage,knownIds()),opener=null;
  const symbol='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="7" height="14" rx="2"/><rect x="14" y="3" width="7" height="17" rx="2"/></svg>';
  const dialog=document.createElement('dialog');dialog.id='spotCompareDialog';dialog.className='spot-compare-dialog';dialog.setAttribute('aria-labelledby','compareTitle');document.body.append(dialog);
  const tray=document.createElement('aside');tray.className='compare-tray';tray.setAttribute('aria-label','Sélection de spots à comparer');document.body.append(tray);
  function button(id){const selected=state.compare.includes(id);return `<button type="button" class="spot-compare-button${selected?' selected':''}" data-compare-toggle="${esc(id)}" aria-pressed="${selected}" aria-label="${selected?'Retirer du comparateur':'Comparer'} : ${esc(SPOTS.find(s=>s.id===id)?.name)}">${symbol}<span>${selected?'Sélectionné':'Comparer'}</span></button>`;}
  function sync(){
    document.querySelectorAll('[data-compare-toggle]').forEach(b=>{const s=SPOTS.find(x=>x.id===b.dataset.compareToggle),on=state.compare.includes(s?.id);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',(on?'Retirer du comparateur':'Comparer')+' : '+s?.name);b.querySelector('span').textContent=on?'Sélectionné':'Comparer';});
    tray.hidden=!state.compare.length;document.body.classList.toggle('has-compare-tray',!!state.compare.length);
    tray.innerHTML=`<span class="compare-tray-label">${symbol}<b>${state.compare.length} / 3 <span>spots</span></b></span><span class="compare-thumbs">${state.compare.map(id=>`<img src="${esc(spotPhotoUrl(id,100))}" alt="${esc(SPOTS.find(s=>s.id===id).name)}">`).join('')}</span><button class="compare-open" data-compare-open>Comparer${state.compare.length<2?' +':''}</button><button class="compare-clear" data-compare-clear aria-label="Vider le comparateur">×</button>`;
  }
  function persist(next){try{M.save(localStorage,next);state=next;return true;}catch(_){toast('Enregistrement impossible : le stockage du navigateur est plein ou désactivé.');return false;}}
  function toggle(id){try{if(persist(M.toggle(state,id,knownIds())))sync();}catch(e){toast(e.message);}}
  function renderDialog(){
    const spots=state.compare.map(id=>SPOTS.find(s=>s.id===id));
    const rows=[['Activités',s=>spotSports(s).map(a=>`<span class="compare-sport">${sportIcon(a)}${esc(SPORTMAP[a].label)}</span>`).join('')],['Cadre',s=>isInland(s)?'Eau douce':'Mer & océan'],['Niveau',s=>levelIcon(s.level)+(s.level==='variable'?'À définir avec l’encadrant local':esc(LVLTXT[s.level]||'À confirmer'))],['Vent',s=>esc(LIVE[s.id]?.wind||'Donnée indisponible')],['Houle',s=>isInland(s)?'Non proposée en eau douce':esc(LIVE[s.id]?.swell||'Donnée indisponible')],['Repères',s=>esc(s.desc)],['Carnet personnel',s=>state.notes[s.id]?esc(state.notes[s.id]):'Aucune note pour le moment.'],['Préparer le départ',s=>`<button class="compare-visit" data-compare-visit="${s.id}">Ouvrir la fiche ↗</button><button class="compare-trip" data-compare-trip="${s.id}">Ajouter au voyage +</button>`]];
    dialog.innerHTML=`<header><div><span class="field-eyebrow">TON PROCHAIN DÉPART</span><h2 id="compareTitle">Quel spot te tente ?</h2><p>Jusqu’à trois lieux, côte à côte. Le choix reste le tien.</p></div><button class="compare-close" data-compare-close aria-label="Fermer le comparateur" autofocus>×</button></header>${spots.length?`<p class="compare-scroll-hint">Fais glisser le tableau pour voir les autres spots <span aria-hidden="true">↔</span></p><div class="compare-table-wrap" tabindex="0" role="region" aria-label="Comparaison des spots, défilement horizontal"><table><caption>Prévisions Open-Meteo lorsqu’elles sont disponibles. Le niveau reste à vérifier sur place.</caption><thead><tr><th scope="col">Tes repères</th>${spots.map(s=>`<th scope="col"><img src="${esc(spotPhotoUrl(s.id,480))}" alt=""><small>${esc(s.loc)}</small><b>${esc(s.name)}</b><button class="compare-remove" data-compare-remove="${s.id}" aria-label="Retirer ${esc(s.name)}">Retirer</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${spots.map(s=>`<td>${fn(s)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="compare-empty">Ta sélection est vide. Ajoute des lieux avec le bouton « Comparer » sur les fiches ou les cartes de spots.</p>'}${spots.length===1?'<p class="compare-help">Ajoute un deuxième spot depuis le catalogue pour les comparer.</p>':''}`;
  }
  function open(){opener=document.activeElement;renderDialog();if(!dialog.open)dialog.showModal();}
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function note(s){return `<section class="field-notebook"><div class="notebook-heading"><span class="notebook-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 4h13v17H5zM3 8h4M3 13h4M3 18h4M10 8h5M10 12h5"/></svg></span><div><span class="field-eyebrow">TON CARNET</span><h3>À garder en tête</h3></div></div><label for="spotPersonalNote">Tes idées, un contact, un point de rendez-vous…</label><textarea id="spotPersonalNote" data-note-spot="${s.id}" maxlength="${M.NOTE_LIMIT}" rows="4" placeholder="Un accès à repérer, une adresse à essayer…">${esc(state.notes[s.id]||'')}</textarea><div class="notebook-footer"><span id="spotNoteStatus" role="status">Enregistré uniquement dans ce navigateur.</span><span id="spotNoteCount">${(state.notes[s.id]||'').length} / ${M.NOTE_LIMIT}</span></div></section>`;}
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-compare-toggle]');if(t){e.stopPropagation();toggle(t.dataset.compareToggle);return;}
    if(e.target.closest('[data-compare-open]'))open();
    if(e.target.closest('[data-compare-clear]')&&persist({...state,compare:[]}))sync();
    if(e.target.closest('[data-compare-close]'))dialog.close();
    const remove=e.target.closest('[data-compare-remove]');if(remove){toggle(remove.dataset.compareRemove);renderDialog();dialog.querySelector('[data-compare-close]').focus();}
    const visit=e.target.closest('[data-compare-visit]');if(visit){dialog.close();openSpot(visit.dataset.compareVisit);}
    const trip=e.target.closest('[data-compare-trip]');if(trip){dialog.close();OceanTrips.fromSpot(trip.dataset.compareTrip);}
  },true);
  document.addEventListener('input',e=>{if(!e.target.matches('[data-note-spot]'))return;const value=e.target.value;const ok=persist(M.note(state,e.target.dataset.noteSpot,value,knownIds()));$('#spotNoteStatus').textContent=ok?'Note enregistrée dans ce navigateur.':'Note non enregistrée : stockage indisponible.';$('#spotNoteCount').textContent=value.length+' / '+M.NOTE_LIMIT;});
  window.OceanNotebook={button,note,sync,open};
  sync();renderSpots(currentFilter,true);
})();
