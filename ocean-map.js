/* Activity names stay visible on pins, in the legend and in spot previews. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const total=n=>n+' spot'+(n>1?'s':'');
  const colors={surf:'#1754d1',bodyboard:'#3153b5',baignade:'#007aa1',paddle:'#007b75',kayak:'#a24d1c',snorkeling:'#007a92',plongee:'#4149b8',kitesurf:'#a33767',windsurf:'#88532a'};
  let rows=[],toolbar=null,empty=null;
  let terrainMap=null,terrainOverlay=null,terrainTarget=null,terrainGeneration=0,terrainEngine=null;
  let terrainOpener=null,terrainUnderlying=[],terrainHostTabIndex=null;
  function candidates(options={}){const found=typeof exploreSpots==='function'?exploreSpots(currentFilter,options):SPOTS.filter(s=>inWorld(s)&&(currentFilter==='all'||(currentFilter==='new'?s.catalogNew:s.level===currentFilter))&&(!currentSearch||searchable(s.name+' '+s.loc).includes(searchable(currentSearch)))&&(!favOnly||favs.has(s.id)));return found.filter(s=>COORDS[s.id]);}
  function controls(){
    if(!toolbar){
      toolbar=document.createElement('div');toolbar.id='mapActivityToolbar';document.getElementById('spotMapWrap').prepend(toolbar);
      toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-map-sport]');if(b)choose(b.dataset.mapSport||null);if(e.target.closest('[data-map-reset]'))reset();if(e.target.closest('[data-map-terrain]'))startTerrain();});
      toolbar.addEventListener('change',e=>{if(e.target.matches('[data-map-level]')){window.OceanNavigation?.begin();currentFilter=e.target.value;document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f===currentFilter));renderSpots();renderMap(true);toolbar.querySelector('select').focus({preventScroll:true});}});
      empty=document.createElement('div');empty.className='map-empty';empty.hidden=true;document.getElementById('spotMapWrap').append(empty);
      empty.innerHTML='<b>Aucun spot avec ces filtres</b><p>Essaie une autre activité ou élargis ta recherche.</p><button type="button">Réinitialiser les filtres</button>';empty.querySelector('button').onclick=reset;
    }
    const base=candidates({sport:null}),count=id=>base.filter(s=>!id||spotSports(s).includes(id)).length;
    const scroll=toolbar.querySelector('.map-activities')?.scrollLeft||0;
    toolbar.innerHTML=`<div class="map-heading"><div><small>ATLAS DES SPOTS</small><b>${esc(activeSport?SPORTMAP[activeSport].label:'Toutes les activités')} <span>· ${total(rows.length)}</span></b></div><label>Niveau<select data-map-level aria-label="Filtrer la carte par niveau"><option value="all">Tous les niveaux</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="expert">Expert</option><option value="variable">À préciser</option><option value="new">Nouveaux spots</option></select></label></div><div class="map-activities" role="group" aria-label="Activités sur la carte">${[{id:'',label:'Tout explorer'},...SPORTS].map(s=>`<button type="button" data-map-sport="${s.id}" aria-pressed="${(activeSport||'')===s.id}" style="--activity-color:${colors[s.id]||'#164bd6'}">${PoulpyIcons.html(s.id||'all')}<span>${esc(s.label)}<small>${total(count(s.id))}</small></span></button>`).join('')}</div><div class="map-key"><span>${activeSport?'Chaque repère correspond à cette activité.':'Le nom sur le repère indique une activité ; + indique les autres.'} Les nombres regroupent des spots proches.</span><button type="button" data-map-terrain ${rows.length?'':'disabled'}>Relief terrestre 3D ↗</button>${currentSearch||favOnly||currentFilter!=='all'?'<button type="button" data-map-reset>Effacer les filtres</button>':''}</div>`;
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
  function closeTerrain(message,restoreFocus=true){
    terrainGeneration++;
    const opener=terrainOpener,hadOverlay=!!terrainOverlay,host=document.getElementById('spotMap');
    if(terrainMap){terrainMap.remove();terrainMap=null;}
    terrainOverlay?.remove();terrainOverlay=null;terrainTarget=null;
    for(const {element,inert,ariaHidden} of terrainUnderlying){element.inert=inert;if(ariaHidden===null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',ariaHidden);}
    terrainUnderlying=[];
    if(host&&hadOverlay){if(terrainHostTabIndex===null)host.removeAttribute('tabindex');else host.setAttribute('tabindex',terrainHostTabIndex);}
    terrainHostTabIndex=null;terrainOpener=null;
    if(message&&typeof toast==='function')toast(message);
    if(leafMap)requestAnimationFrame(()=>leafMap.invalidateSize());
    if(restoreFocus&&hadOverlay&&opener?.isConnected)opener.focus({preventScroll:true});
  }
  function distance(a,b){
    const dLat=(a.lat-b.lat)*Math.PI/180,dLon=(a.lon-b.lon)*Math.PI/180;
    return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2)));
  }
  function nearestSpot(){
    const center=leafMap?.getCenter();
    return center?rows.slice().sort((a,b)=>distance(COORDS[a.id],center)-distance(COORDS[b.id],center))[0]:rows[0];
  }
  async function loadTerrainEngine(){
    if(!terrainEngine){
      if(!document.querySelector('link[data-terrain-style]')){const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='vendor/maplibre/maplibre-gl.css';stylesheet.dataset.terrainStyle='';document.head.append(stylesheet);}
      terrainEngine=import(new URL('vendor/maplibre/maplibre-gl.mjs',document.baseURI).href).catch(error=>{terrainEngine=null;throw error;});
    }
    return terrainEngine;
  }
  async function startTerrain(spot){
    const selected=spot||nearestSpot(),point=selected&&COORDS[selected.id];
    if(!point)return;
    const opener=document.activeElement;
    closeTerrain('',false);
    const generation=terrainGeneration,host=document.getElementById('spotMap');
    terrainOpener=opener;
    terrainTarget=selected;
    terrainOverlay=document.createElement('section');terrainOverlay.className='terrain-overlay';terrainOverlay.setAttribute('role','region');terrainOverlay.setAttribute('aria-label',`Relief terrestre autour de ${selected.name}`);terrainOverlay.setAttribute('aria-describedby','terrainExplanation');
    terrainOverlay.innerHTML=`<div class="terrain-canvas"></div><div class="terrain-guide"><span>RELIEF TERRESTRE · ${esc(selected.name)}</span><p id="terrainExplanation">Vue indicative du terrain côtier. Aucune profondeur marine ni condition de sécurité n’est représentée.</p><button type="button" data-terrain-close aria-describedby="terrainExplanation">Retour à la carte 2D</button></div><p class="terrain-loading" role="status">Préparation du relief 3D…</p>`;
    terrainOverlay.querySelector('[data-terrain-close]').onclick=()=>closeTerrain();
    terrainOverlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeTerrain();}});
    host.append(terrainOverlay);
    terrainOverlay.querySelector('[data-terrain-close]').focus({preventScroll:true});
    terrainHostTabIndex=host.getAttribute('tabindex');host.tabIndex=-1;
    terrainUnderlying=[...host.children].filter(element=>element!==terrainOverlay).map(element=>({element,inert:element.inert,ariaHidden:element.getAttribute('aria-hidden')}));
    for(const {element} of terrainUnderlying){element.inert=true;element.setAttribute('aria-hidden','true');}
    try{
      const canvas=document.createElement('canvas');
      if(!canvas.getContext('webgl2'))throw Error('WebGL 2 indisponible');
      const maplibre=await loadTerrainEngine();
      if(generation!==terrainGeneration)return;
      const map=new maplibre.Map({
        container:terrainOverlay.querySelector('.terrain-canvas'),
        style:{version:8,sources:{
          osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'},
          terrain:{type:'raster-dem',url:'https://tiles.mapterhorn.com/tilejson.json',attribution:'Relief : <a href="https://mapterhorn.com/attribution/">Mapterhorn</a>'}
        },layers:[{id:'ocean-base',type:'raster',source:'osm'}],terrain:{source:'terrain',exaggeration:1}},
        center:[point.lon,point.lat],zoom:10.2,pitch:62,bearing:-20,maxPitch:78,maxZoom:17,canvasContextAttributes:{antialias:true}
      });
      terrainMap=map;
      map.addControl(new maplibre.NavigationControl({visualizePitch:true}),'top-right');
      const canvasElement=terrainOverlay.querySelector('.maplibregl-canvas');
      canvasElement?.setAttribute('aria-label',`Carte en relief terrestre autour de ${selected.name}`);
      for(const [selector,label] of [['.maplibregl-ctrl-zoom-in','Zoom avant'],['.maplibregl-ctrl-zoom-out','Zoom arrière'],['.maplibregl-ctrl-compass','Orienter la carte vers le nord']])terrainOverlay.querySelector(selector)?.setAttribute('aria-label',label);
      const timer=setTimeout(()=>{if(generation===terrainGeneration&&terrainOverlay?.querySelector('.terrain-loading'))closeTerrain('Relief indisponible. Carte 2D rétablie.');},18000);
      map.once('load',()=>{
        clearTimeout(timer);
        if(generation!==terrainGeneration)return;
        terrainOverlay?.querySelector('.terrain-loading')?.remove();
        const nearby=rows.filter(s=>distance(COORDS[s.id],point)<55).sort((a,b)=>distance(COORDS[a.id],point)-distance(COORDS[b.id],point)).slice(0,20);
        if(!nearby.some(s=>s.id===selected.id))nearby.unshift(selected);
        nearby.forEach(s=>{
          const marker=document.createElement('button');marker.type='button';marker.className='terrain-spot-pin';marker.textContent=s.name.split(' — ')[0];marker.setAttribute('aria-label',`Ouvrir la fiche de ${s.name}`);
          marker.onclick=()=>{closeTerrain('',false);if(mapFull)setMapFull(false,true);openSpot(s.id);};
          new maplibre.Marker({element:marker,anchor:'bottom'}).setLngLat([COORDS[s.id].lon,COORDS[s.id].lat]).addTo(map);
        });
        map.resize();
      });
      map.on('error',event=>{
        const detail=String(event.error?.message||'');
        if(generation===terrainGeneration&&/mapterhorn|terrain|raster.?dem|tilejson/i.test(detail))closeTerrain('Relief indisponible. Carte 2D rétablie.');
      });
    }catch(_){if(generation===terrainGeneration)closeTerrain('Relief non pris en charge ici. Carte 2D rétablie.');}
  }
  function preview(s){
    const el=document.createElement('article');el.className='map-preview';
    const acts=spotSports(s),photo=window.OceanPhotos?.lead(s.id,activeSport)||window.SPOT_PHOTOS?.[s.id];
    const image=photo?.src?`<img class="map-preview-photo" src="${esc(photo.thumb||photo.src)}" alt="${esc(photo.caption||s.photoContext||s.name)}">`:'<div class="map-preview-photo map-preview-no-photo" role="img" aria-label="Photographie du lieu non disponible">Photographie à venir</div>';
    const credit=photo?.source&&/^https:\/\//i.test(photo.source)?`<a class="map-photo-credit" href="${esc(photo.source)}" target="_blank" rel="noopener noreferrer" title="${esc((photo.author||'Auteur non indiqué')+' · '+(photo.license||''))}">Photo : ${esc(photo.author||'Auteur non indiqué')} ↗</a>`:'';
    el.innerHTML=`${image}${credit}<div class="map-preview-body"><small>${esc(s.loc)}</small><h3>${esc(s.name)}</h3><p class="map-preview-label">À faire ici</p><div class="map-preview-sports">${acts.map(id=>`<span class="${activeSport===id?'selected':''}">${sportIcon(id)}${esc(SPORTMAP[id].label)}</span>`).join('')}</div><p class="map-preview-level">${levelIcon(s.level)} ${esc(lvlLabel[s.level]||'À préciser')}</p><div class="map-preview-actions"><button type="button" class="map-visit">Découvrir le spot <span>→</span></button><button type="button" class="map-relief" data-map-relief>Relief 3D</button></div></div>`;
    el.querySelector('.map-visit').onclick=()=>{leafMap.closePopup();window.OceanNavigation?.begin();if(mapFull)setMapFull(false,true);openSpot(s.id);};
    el.querySelector('[data-map-relief]').onclick=()=>startTerrain(s);
    el.querySelector('img')?.addEventListener('error',event=>{event.target.replaceWith(Object.assign(document.createElement('div'),{className:'map-preview-photo map-preview-no-photo',textContent:'Photographie indisponible'}));});
    return el;
  }
  function draw(){
    if(!leafMap||!leafMarkers)return;leafMarkers.clearLayers();
    const zoom=leafMap.getZoom(),points=rows.map(s=>{const c=COORDS[s.id],p=leafMap.project([c.lat,c.lon],zoom);return {s,x:p.x,y:p.y};});
    /* Des grappes plus compactes gardent la carte lisible : les repères se
       séparent plus tôt au zoom et chaque clic permet d'ouvrir le secteur. */
    const groups=OceanMapModel.group(points,zoom<5?78:zoom<8?92:112,zoom<5?46:54);
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
    if(terrainOverlay)closeTerrain('',false);
    if(typeof L==='undefined'){el.innerHTML='<p class="map-offline">La carte nécessite une connexion. Tu peux continuer à parcourir les spots dans la liste.</p>';return;}
    if(!leafMap){leafMap=L.map(el,{zoomControl:true,attributionControl:true,worldCopyJump:true,scrollWheelZoom:true,dragging:true,touchZoom:true,doubleClickZoom:true,boxZoom:true,keyboard:true,inertia:true,zoomSnap:.25,zoomDelta:.5}).setView([22,0],2);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,minZoom:2,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(leafMap);leafMarkers=L.layerGroup().addTo(leafMap);leafMap.on('zoomend moveend',draw);}
    rows=candidates().filter(s=>!activeSport||spotSports(s).includes(activeSport));leafMap._pts=rows.map(s=>[COORDS[s.id].lat,COORDS[s.id].lon]);controls();draw();
    requestAnimationFrame(()=>{leafMap.invalidateSize();if(refresh&&rows.length)fitMapToSpots();});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&terrainOverlay)closeTerrain('',false);});
  window.addEventListener('pagehide',()=>{if(terrainOverlay)closeTerrain('',false);});
  window.OceanMap={render,revealActivity,startTerrain,closeTerrain};
})();
