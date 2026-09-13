/* Activity names stay visible on pins, in the legend and in spot previews. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const total=n=>n+' spot'+(n>1?'s':'');
  const colors={surf:'#1754d1',bodyboard:'#3153b5',baignade:'#007aa1',paddle:'#007b75',kayak:'#a24d1c',snorkeling:'#007a92',plongee:'#4149b8',kitesurf:'#a33767',windsurf:'#88532a'};
  let rows=[],toolbar=null,empty=null;
  function candidates(){return SPOTS.filter(s=>COORDS[s.id]&&inWorld(s)&&(currentFilter==='all'||(currentFilter==='new'?s.catalogNew:s.level===currentFilter))&&(!currentSearch||searchable(s.name+' '+s.loc).includes(searchable(currentSearch)))&&(!favOnly||favs.has(s.id)));}
  function controls(){
    if(!toolbar){
      toolbar=document.createElement('div');toolbar.id='mapActivityToolbar';document.getElementById('spotMapWrap').prepend(toolbar);
      toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-map-sport]');if(b)choose(b.dataset.mapSport||null);if(e.target.closest('[data-map-reset]'))reset();});
      toolbar.addEventListener('change',e=>{if(e.target.matches('[data-map-level]')){window.OceanNavigation?.begin();currentFilter=e.target.value;document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f===currentFilter));renderSpots();renderMap(true);toolbar.querySelector('select').focus({preventScroll:true});}});
      empty=document.createElement('div');empty.className='map-empty';empty.hidden=true;document.getElementById('spotMapWrap').append(empty);
      empty.innerHTML='<b>Aucun spot avec ces filtres</b><p>Essaie une autre activité ou élargis ta recherche.</p><button type="button">Réinitialiser les filtres</button>';empty.querySelector('button').onclick=reset;
    }
    const base=candidates(),count=id=>base.filter(s=>!id||spotSports(s).includes(id)).length;
    const scroll=toolbar.querySelector('.map-activities')?.scrollLeft||0;
    toolbar.innerHTML=`<div class="map-heading"><div><small>TA CARTE, TON ACTIVITÉ</small><b>${esc(activeSport?SPORTMAP[activeSport].label:'Toutes les activités')} <span>· ${total(rows.length)}</span></b></div><label>Niveau<select data-map-level aria-label="Filtrer la carte par niveau"><option value="all">Tous les niveaux</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="expert">Expert</option><option value="variable">À préciser</option><option value="new">Nouveaux spots</option></select></label></div><div class="map-activities" role="group" aria-label="Activités sur la carte">${[{id:'',label:'Tout explorer'},...SPORTS].map(s=>`<button type="button" data-map-sport="${s.id}" aria-pressed="${(activeSport||'')===s.id}" style="--activity-color:${colors[s.id]||'#164bd6'}">${PoulpyIcons.html(s.id||'all')}<span>${esc(s.label)}<small>${total(count(s.id))}</small></span></button>`).join('')}</div><div class="map-key"><span>${activeSport?'Chaque repère correspond à cette activité.':'Le nom sur le repère indique une activité ; + indique les autres.'} Les nombres regroupent des spots proches.</span>${currentSearch||favOnly||currentFilter!=='all'?'<button type="button" data-map-reset>Effacer les filtres</button>':''}</div>`;
    toolbar.querySelector('select').value=currentFilter;toolbar.querySelector('.map-activities').scrollLeft=scroll;
    revealActivity();
    empty.hidden=rows.length>0;
  }
  function revealActivity(){
    const bar=toolbar?.querySelector('.map-activities'),selected=bar?.querySelector('[aria-pressed=true]');
    if(!bar?.clientWidth||!selected)return;
    const a=selected.getBoundingClientRect(),b=bar.getBoundingClientRect();if(a.left<b.left)bar.scrollLeft-=b.left-a.left;if(a.right>b.right)bar.scrollLeft+=a.right-b.right;
  }
  function choose(id){window.OceanNavigation?.begin();activeSport=id&&SPORTMAP[id]?id:null;chosenSport=activeSport||'all';renderSportFilters();renderWorlds();renderSpots();renderMap(true);saveState();renderHome();toolbar.querySelector(`[data-map-sport="${id||''}"]`)?.focus({preventScroll:true});}
  function reset(){window.OceanNavigation?.begin();currentFilter='all';currentSearch='';favOnly=false;document.getElementById('spotSearch').value='';document.getElementById('favChip').classList.remove('active');document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));choose(null);}
  function preview(s){
    const el=document.createElement('article');el.className='map-preview';
    const acts=spotSports(s),photo=window.OceanPhotos?.lead(s.id,activeSport)||SPOT_PHOTOS[s.id];
    el.innerHTML=`<img class="map-preview-photo" src="${esc(photo.thumb||photo.src)}" alt="${esc(photo.caption||s.photoContext||s.name)}"><a class="map-photo-credit" href="${esc(photo.source)}" target="_blank" rel="noopener" title="${esc(photo.author+' · '+photo.license)}">Photo : ${esc(photo.author)} ↗</a><div class="map-preview-body"><small>${esc(s.loc)}</small><h3>${esc(s.name)}</h3><p class="map-preview-label">À faire ici</p><div class="map-preview-sports">${acts.map(id=>`<span class="${activeSport===id?'selected':''}">${sportIcon(id)}${esc(SPORTMAP[id].label)}</span>`).join('')}</div><p class="map-preview-level">${levelIcon(s.level)} ${esc(lvlLabel[s.level])}</p><button type="button" class="map-visit">Découvrir le spot <span>→</span></button></div>`;
    el.querySelector('button').onclick=()=>{leafMap.closePopup();window.OceanNavigation?.begin();if(mapFull)setMapFull(false,true);openSpot(s.id);};return el;
  }
  function draw(){
    if(!leafMap||!leafMarkers)return;leafMarkers.clearLayers();
    const zoom=leafMap.getZoom(),points=rows.map(s=>{const c=COORDS[s.id],p=leafMap.project([c.lat,c.lon],zoom);return {s,x:p.x,y:p.y};});
    const groups=OceanMapModel.group(points,zoom<8?112:130,62);
    for(const g of groups){
      const many=g.items.length>1,s=g.items[0].s,acts=spotSports(s),primary=activeSport||acts[0],pos=leafMap.unproject([g.x,g.y],zoom);
      const label=many?'spots':(zoom>=9?s.name.split(' — ')[0]:SPORTMAP[primary].label);
      const allActs=[...new Set(g.items.flatMap(p=>spotSports(p.s)))];
      const sub=many?(activeSport?SPORTMAP[activeSport].label:allActs.length+' activités'):(zoom>=9?SPORTMAP[primary].label:'');
      const html=`<div class="activity-pin ${many?'activity-cluster':''}" style="--activity-color:${colors[primary]||'#164bd6'}">${many?'<strong>'+g.items.length+'</strong>':sportIcon(primary)}<span><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span>${!many&&acts.length>1?`<i>+${acts.length-1}</i>`:''}</div>`;
      const title=many?`${g.items.length} spots · ${allActs.map(id=>SPORTMAP[id].label).join(', ')} · zoomer`:`${s.name} · ${acts.map(id=>SPORTMAP[id].label).join(', ')}`;
      const marker=L.marker(pos,{icon:L.divIcon({className:'activity-pin-wrap',html,iconSize:[126,46],iconAnchor:[63,46]}),title,alt:title,riseOnHover:true}).addTo(leafMarkers);
      if(!many)marker.bindPopup(()=>preview(s),{className:'activity-popup',maxWidth:290,minWidth:250,autoPanPadding:[18,22]}).on('popupopen',e=>{e.popup.options.maxHeight=Math.max(170,leafMap.getSize().y-60);e.popup.update();});
      else marker.on('click',()=>{
        if(zoom<17){leafMap.fitBounds(g.items.map(p=>{const c=COORDS[p.s.id];return [c.lat,c.lon];}),{padding:[60,60],maxZoom:Math.min(17,zoom+3)});return;}
        const list=document.createElement('div');list.className='map-neighbours';list.innerHTML='<b>Les spots de ce secteur</b>';
        g.items.forEach(({s})=>{const b=document.createElement('button');b.textContent=s.name+' · '+spotSports(s).map(id=>SPORTMAP[id].label).join(', ');b.onclick=()=>{leafMap.closePopup();L.popup({className:'activity-popup',maxWidth:290}).setLatLng(pos).setContent(preview(s)).openOn(leafMap);};list.append(b);});L.popup().setLatLng(pos).setContent(list).openOn(leafMap);
      });
    }
  }
  function render(refresh){
    const el=document.getElementById('spotMap');if(!el)return;
    if(typeof L==='undefined'){el.innerHTML='<p class="map-offline">La carte nécessite une connexion. Tu peux continuer à parcourir les spots dans la liste.</p>';return;}
    if(!leafMap){leafMap=L.map(el,{zoomControl:true,attributionControl:true,worldCopyJump:true}).setView([22,0],2);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,minZoom:2,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(leafMap);leafMarkers=L.layerGroup().addTo(leafMap);leafMap.on('zoomend',draw);}
    rows=candidates().filter(s=>!activeSport||spotSports(s).includes(activeSport));leafMap._pts=rows.map(s=>[COORDS[s.id].lat,COORDS[s.id].lon]);controls();draw();
    requestAnimationFrame(()=>{leafMap.invalidateSize();if(refresh&&rows.length)fitMapToSpots();});
  }
  window.OceanMap={render,revealActivity};
})();
