/* Carte des spots : moteur MapLibre local chargé à l’ouverture, fond de carte calme
   aux couleurs de l’app, regroupements par zoom, filtres et liste de la zone visible. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=window.OceanMapModel;
  const total=n=>n>1?`${n} spots`:`${n} spot`;
  /* Couleurs d’activité : distinctes sur le fond clair, dans la famille cobalt / citron / corail. */
  const COLORS={surf:'#1f55e0',bodyboard:'#4f8df7',baignade:'#0e9fc4',paddle:'#0f9e86',kayak:'#5c9e2c',snorkeling:'#f0a20c',plongee:'#0b2d7a',kitesurf:'#ff6a4d',windsurf:'#9d5be6'};
  const color=id=>COLORS[id]||'#1f55e0';
  /* Grandes régions affichées en vue monde ; la France rejoint l’Europe pour ne pas se chevaucher. */
  const REGIONS=[
    {id:'eu',worlds:['fr','eu'],lab:'Europe',at:[14,50]},
    {id:'af',worlds:['af'],lab:'Afrique',at:[21,3]},
    {id:'na',worlds:['na'],lab:'Amérique du Nord',at:[-94,42]},
    {id:'sa',worlds:['sa'],lab:'Amérique du Sud',at:[-61,-15]},
    {id:'as',worlds:['as'],lab:'Asie',at:[110,18]},
    {id:'oc',worlds:['oc'],lab:'Océanie',at:[148,-26]}
  ];
  const TILES='https://tiles.openfreemap.org/planet',GLYPHS='https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
  let rows=[],built=false,wrap=null,stage=null,panel=null,list=null,card=null,filters=null,empty=null,status=null,tip=null;
  let map=null,engine=null,starting=null,regionMarkers=[],selectedMarker=null,userDot=null,selected=null,worldOn=null,fitKey='',needFit=true,listTimer=0,sheetOpen=false,lastData='';
  let terrainMap=null,terrainOverlay=null,terrainTarget=null,terrainGeneration=0;
  let terrainOpener=null,terrainUnderlying=[];

  function candidates(){const found=typeof exploreSpots==='function'?exploreSpots(currentFilter,{sport:null}):SPOTS.filter(s=>inWorld(s));return found.filter(s=>COORDS[s.id]&&Number.isFinite(COORDS[s.id].lat)&&Number.isFinite(COORDS[s.id].lon));}
  const shortName=s=>String(s.name||'').split(' — ')[0];
  const regionOf=s=>REGIONS.find(r=>r.worlds.includes(s.world||SPOT_WORLD?.[s.id]));
  const primary=s=>activeSport&&spotSports(s).includes(activeSport)?activeSport:spotSports(s)[0];
  const photoOf=s=>(typeof spotPhotoUrl==='function'&&spotPhotoUrl(s.id,480))||(typeof spotIllustration==='function'?spotIllustration(s.id):'assets/poulpy/scenes/travel-v2.webp');
  const levelOf=s=>['debutant','intermediaire','expert'].includes(s.level)?s.level:'variable';
  const regionsMode=()=>spotWorld==='all'&&!spotCountry&&!currentSearch&&!favOnly;
  const mapVisible=()=>$('#mapView')?.style.display!=='none';
  const mobile=()=>matchMedia('(max-width:759px)').matches;

  /* ---------- Chargement paresseux des moteurs ---------- */
  function loadEngine(){
    if(!engine){
      if(!document.querySelector('link[data-terrain-style]')){const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='vendor/maplibre/maplibre-gl.css';sheet.dataset.terrainStyle='';document.head.append(sheet);}
      engine=import(new URL('vendor/maplibre/maplibre-gl.mjs',document.baseURI).href).catch(error=>{engine=null;throw error;});
    }
    return engine;
  }
  /* Leaflet ne sert plus qu’aux petites cartes (fiche, voyage) : il se charge à leur ouverture. */
  let leaflet=null;
  window.OceanLeaflet=()=>{
    if(typeof L!=='undefined')return Promise.resolve(L);
    if(!leaflet){
      const base=window.OceanMobile?.native?'vendor/leaflet/':'https://unpkg.com/leaflet@1.9.4/dist/';
      const css=document.createElement('link');css.rel='stylesheet';css.href=base+'leaflet.css';document.head.append(css);
      leaflet=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=base+'leaflet.js';s.onload=()=>resolve(window.L);s.onerror=()=>{leaflet=null;reject(Error('Leaflet indisponible'));};document.head.append(s);});
    }
    return leaflet;
  };

  /* ---------- Fond de carte : clair, peu de détails, noms dans la langue choisie ---------- */
  function labelName(){
    const lang=String(window.OB_I18N?.lang||'fr');
    const code={nb:'no'}[lang]||lang;
    const latinSafe=/^(fr|en|es|it|pt|de|nl|ca|ro|sv|da|no|fi|pl|cs|sk|sl|hr|hu|tr|id|vi|ru|uk|el|bg|et|lv|lt|ja|ko|zh-Hans|zh-Hant|zh)$/.test(code);
    return latinSafe?['coalesce',['get','name:'+code],['get','name:latin'],['get','name']]:['coalesce',['get','name:latin'],['get','name']];
  }
  function style(){
    const name=labelName(),cls=['get','class'],src='omt';
    const text=(size,extra={})=>Object.assign({'text-field':name,'text-font':['Noto Sans Regular'],'text-size':size,'text-max-width':7},extra);
    return {version:8,glyphs:GLYPHS,sources:{omt:{type:'vector',url:TILES}},layers:[
      {id:'land',type:'background',paint:{'background-color':'#f5f6f0'}},
      {id:'ice',type:'fill',source:src,'source-layer':'landcover',filter:['==',cls,'ice'],paint:{'fill-color':'#fbfcff','fill-opacity':.9}},
      {id:'wood',type:'fill',source:src,'source-layer':'landcover',minzoom:5,filter:['match',cls,['wood','forest'],true,false],paint:{'fill-color':'#e7eedf','fill-opacity':['interpolate',['linear'],['zoom'],5,0,8,.7]}},
      {id:'sand',type:'fill',source:src,'source-layer':'landcover',minzoom:9,filter:['==',cls,'sand'],paint:{'fill-color':'#f6efd8'}},
      {id:'park',type:'fill',source:src,'source-layer':'park',minzoom:8,paint:{'fill-color':'#e4eedc','fill-opacity':.7}},
      {id:'urban',type:'fill',source:src,'source-layer':'landuse',minzoom:9,filter:['match',cls,['residential','suburb','neighbourhood','commercial','industrial'],true,false],paint:{'fill-color':'#eeeee8'}},
      {id:'water',type:'fill',source:src,'source-layer':'water',filter:['!=',['get','brunnel'],'tunnel'],paint:{'fill-color':['interpolate',['linear'],['zoom'],0,'#c3d6fb',6,'#c9dbfc',12,'#cfe0fd']}},
      {id:'river',type:'line',source:src,'source-layer':'waterway',minzoom:7,paint:{'line-color':'#c9dbfc','line-width':['interpolate',['linear'],['zoom'],7,.6,14,2.5]}},
      {id:'building',type:'fill',source:src,'source-layer':'building',minzoom:14,paint:{'fill-color':'#e8e8e1','fill-outline-color':'#dcdcd4'}},
      {id:'road-minor',type:'line',source:src,'source-layer':'transportation',minzoom:10,filter:['match',cls,['secondary','tertiary','minor','service'],true,false],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],10,.5,16,6]}},
      {id:'road-major',type:'line',source:src,'source-layer':'transportation',minzoom:6,filter:['match',cls,['motorway','trunk','primary'],true,false],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['interpolate',['linear'],['zoom'],6,'#e9e7df',10,'#ffffff'],'line-width':['interpolate',['linear'],['zoom'],6,.5,10,1.6,16,9]}},
      {id:'border-region',type:'line',source:src,'source-layer':'boundary',minzoom:4,filter:['all',['match',['get','admin_level'],[3,4],true,false],['!=',['get','maritime'],1]],paint:{'line-color':'#d3d8e4','line-width':.6,'line-dasharray':[3,2]}},
      {id:'border-country',type:'line',source:src,'source-layer':'boundary',filter:['all',['==',['get','admin_level'],2],['!=',['get','maritime'],1]],layout:{'line-join':'round'},paint:{'line-color':'#aab5cd','line-width':['interpolate',['linear'],['zoom'],1,.45,5,.9,10,1.4],'line-dasharray':['case',['==',['get','disputed'],1],['literal',[2,2]],['literal',[1,0]]]}},
      {id:'sea-name',type:'symbol',source:src,'source-layer':'water_name',maxzoom:9,filter:['all',['match',cls,['ocean','sea','gulf','bay'],true,false],['match',['geometry-type'],['Point','MultiPoint'],true,false]],layout:text(['interpolate',['linear'],['zoom'],0,10,3,12,8,13.5],{'text-font':['Noto Sans Italic'],'text-letter-spacing':.14,'text-max-width':6,'text-padding':8}),paint:{'text-color':'#5f82cf','text-halo-color':'rgba(201,219,252,.8)','text-halo-width':1}},
      {id:'country-major',type:'symbol',source:src,'source-layer':'place',minzoom:2,maxzoom:8,filter:['all',['==',cls,'country'],['<=',['get','rank'],2]],layout:text(['interpolate',['linear'],['zoom'],2,10,6,15],{'text-transform':'uppercase','text-letter-spacing':.08,'text-font':['Noto Sans Bold']}),paint:{'text-color':'#51607f','text-halo-color':'#f5f6f0','text-halo-width':1.3}},
      {id:'country',type:'symbol',source:src,'source-layer':'place',minzoom:3.2,maxzoom:8,filter:['all',['==',cls,'country'],['>',['get','rank'],2]],layout:text(['interpolate',['linear'],['zoom'],3,9,7,13],{'text-transform':'uppercase','text-letter-spacing':.06,'text-font':['Noto Sans Bold']}),paint:{'text-color':'#617090','text-halo-color':'#f5f6f0','text-halo-width':1.3}},
      {id:'state',type:'symbol',source:src,'source-layer':'place',minzoom:5.5,maxzoom:8.5,filter:['==',cls,'state'],layout:text(10,{'text-transform':'uppercase','text-letter-spacing':.08}),paint:{'text-color':'#97a2ba','text-halo-color':'#f5f6f0','text-halo-width':1}},
      {id:'city-major',type:'symbol',source:src,'source-layer':'place',minzoom:4.5,maxzoom:7,filter:['all',['==',cls,'city'],['<=',['coalesce',['get','rank'],99],3]],layout:text(['interpolate',['linear'],['zoom'],5,10.5,7,12]),paint:{'text-color':'#34426a','text-halo-color':'#ffffff','text-halo-width':1.4}},
      {id:'city',type:'symbol',source:src,'source-layer':'place',minzoom:7,filter:['==',cls,'city'],layout:text(['interpolate',['linear'],['zoom'],7,11.5,12,14]),paint:{'text-color':'#34426a','text-halo-color':'#ffffff','text-halo-width':1.4}},
      {id:'town',type:'symbol',source:src,'source-layer':'place',minzoom:10,filter:['==',cls,'town'],layout:text(['interpolate',['linear'],['zoom'],10,10,14,12.5]),paint:{'text-color':'#6f7b98','text-halo-color':'#ffffff','text-halo-width':1.3}},
      {id:'village',type:'symbol',source:src,'source-layer':'place',minzoom:12.5,filter:['match',cls,['village','suburb'],true,false],layout:text(10.5),paint:{'text-color':'#66718d','text-halo-color':'#ffffff','text-halo-width':1.2}}
    ]};
  }

  /* Repère en goutte dessiné une fois par activité (net sur écran Retina). */
  function pinImage(fill){
    const r=Math.min(3,Math.max(2,Math.ceil(devicePixelRatio||1))),w=28,h=36,c=document.createElement('canvas');c.width=w*r;c.height=h*r;
    const g=c.getContext('2d');g.scale(r,r);
    const cx=14,cy=12.5,rad=10,tip=32.5,t=Math.asin(rad/(tip-cy)),a1=Math.PI/2+(Math.PI/2-t),a2=Math.PI/2-(Math.PI/2-t)+Math.PI*2;
    g.beginPath();g.moveTo(cx,tip);g.arc(cx,cy,rad,a1,a2);g.closePath();
    g.shadowColor='rgba(11,45,122,.38)';g.shadowBlur=3.5;g.shadowOffsetY=1.2;g.fillStyle=fill;g.fill();
    g.shadowColor='transparent';g.lineWidth=2.2;g.strokeStyle='#ffffff';g.stroke();
    g.beginPath();g.arc(cx,cy,3.7,0,Math.PI*2);g.fillStyle='#ffffff';g.fill();
    return {image:{width:c.width,height:c.height,data:new Uint8Array(g.getImageData(0,0,c.width,c.height).data.buffer)},ratio:r};
  }

  /* ---------- Interface : panneau, filtres, commandes ---------- */
  const ICONS={
    plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
    locate:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7.2"/>',
    world:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 3 4 5.9 4 9s-1.4 6-4 9c-2.6-3-4-5.9-4-9s1.4-6 4-9z"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>',arrow:'<path d="M5 12h13"/><path d="M12.5 6 19 12l-6.5 6"/>',
    trip:'<path d="M12 5v14M5 12h14"/>',relief:'<path d="m3 19 6.5-11 4 6.5 2.5-3.5L21 19z"/>',chevron:'<path d="m6 15 6-6 6 6"/>'
  };
  const icon=(k,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  function build(){
    if(built)return true;
    wrap=$('#spotMapWrap');const host=$('#spotMap');if(!wrap||!host)return false;
    built=true;wrap.classList.add('omap');host.removeAttribute('style');
    wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Carte des spots');
    panel=document.createElement('aside');panel.className='omap-panel';panel.setAttribute('aria-label','Spots dans cette zone');
    panel.innerHTML=`<button type="button" class="omap-sheet-head" aria-expanded="false" aria-controls="omapList"><span class="omap-grip" aria-hidden="true"></span><span class="omap-head-text"><b class="omap-title"></b><small class="omap-sub"></small></span><span class="omap-sheet-toggle"><span class="omap-sheet-label">Voir la liste</span>${icon('chevron','omap-chev')}</span></button><div class="omap-list" id="omapList"></div>`;
    stage=document.createElement('div');stage.className='omap-stage';
    filters=document.createElement('div');filters.className='omap-filters';filters.setAttribute('role','toolbar');filters.setAttribute('aria-label','Filtres de la carte');
    const ctrls=document.createElement('div');ctrls.className='omap-ctrls';
    ctrls.innerHTML=`<div class="omap-zoom"><button type="button" data-omap="in" aria-label="Zoom avant" title="Zoom avant">${icon('plus')}</button><button type="button" data-omap="out" aria-label="Zoom arrière" title="Zoom arrière">${icon('minus')}</button></div><button type="button" data-omap="locate" aria-label="Me localiser" title="Me localiser">${icon('locate')}</button><button type="button" data-omap="world" aria-label="Revenir à la vue du monde" title="Vue du monde">${icon('world')}</button>`;
    const fs=$('#mapFsBtn');if(fs)ctrls.append(fs);
    card=document.createElement('article');card.className='omap-card';card.hidden=true;card.setAttribute('aria-live','polite');
    empty=document.createElement('div');empty.className='omap-empty';empty.hidden=true;
    status=document.createElement('p');status.className='omap-status';status.setAttribute('role','status');status.textContent='Chargement de la carte…';
    host.before(stage);stage.append(host,filters,ctrls,card,empty,status);wrap.prepend(panel);
    list=panel.querySelector('.omap-list');
    $('#mapBar')?.remove();
    panel.querySelector('.omap-sheet-head').addEventListener('click',()=>setSheet(!sheetOpen));
    panel.addEventListener('click',onPanelClick);
    filters.addEventListener('click',e=>{const b=e.target.closest('[data-map-sport]');if(b)choose(b.dataset.mapSport||null);});
    filters.addEventListener('change',e=>{if(!e.target.matches('[data-map-level]'))return;window.OceanNavigation?.begin();currentFilter=e.target.value;document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f===currentFilter));renderSpots();render(false);filters.querySelector('select')?.focus({preventScroll:true});});
    ctrls.addEventListener('click',e=>{const b=e.target.closest('[data-omap]');if(!b||!map)return;const k=b.dataset.omap;if(k==='in')map.zoomIn();if(k==='out')map.zoomOut();if(k==='world')overview(true);if(k==='locate')locate();});
    card.addEventListener('click',onCardClick);
    wrap.addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden&&!terrainOverlay){e.stopPropagation();deselect(true);}});
    addEventListener('resize',()=>{if(!mapVisible())return;syncMode();size();map?.resize();updateMinZoom();});
    return true;
  }
  function syncMode(){
    const head=panel?.querySelector('.omap-sheet-head'),m=mobile();if(!head)return;head.disabled=!m;
    if(m&&filters.parentNode!==stage)stage.prepend(filters);
    if(!m&&filters.parentNode!==panel)panel.prepend(filters);
    if(!m&&sheetOpen)setSheet(false);
  }
  function setSheet(open){
    sheetOpen=!!open&&mobile();wrap?.classList.toggle('sheet-open',sheetOpen);
    const head=panel?.querySelector('.omap-sheet-head');if(!head)return;
    head.setAttribute('aria-expanded',String(sheetOpen));head.querySelector('.omap-sheet-label').textContent=sheetOpen?'Voir la carte':'Voir la liste';
    if(sheetOpen)deselect();
  }
  function renderFilters(){
    const base=candidates(),count=id=>id?base.filter(s=>spotSports(s).includes(id)).length:base.length;
    const scroll=filters.querySelector('.omap-acts')?.scrollLeft||0;
    const levels=[['all','Tous les niveaux'],['debutant','Débutant'],['intermediaire','Intermédiaire'],['expert','Expert'],['variable','Niveau à évaluer'],['new','Nouveaux spots']];
    filters.innerHTML=`<label class="omap-level"><span class="omap-sr">Niveau</span><select data-map-level aria-label="Niveau">${levels.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><div class="omap-acts" role="group" aria-label="Activités">${[{id:'',label:'Tout explorer'},...SPORTS].map(s=>{const n=count(s.id);return `<button type="button" data-map-sport="${s.id}" aria-pressed="${(activeSport||'')===s.id}" ${n||!s.id?'':'disabled'} style="--c:${s.id?color(s.id):'#0b2d7a'}"><i aria-hidden="true"></i><span>${esc(s.label)}</span><small>${n}</small></button>`;}).join('')}</div>`;
    filters.querySelector('select').value=currentFilter;filters.querySelector('.omap-acts').scrollLeft=scroll;
    revealActivity();
  }
  function revealActivity(){
    const bar=filters?.querySelector('.omap-acts'),on=bar?.querySelector('[aria-pressed=true]');
    if(!bar?.clientWidth||!on)return;
    const a=on.getBoundingClientRect(),b=bar.getBoundingClientRect();if(a.left<b.left)bar.scrollLeft-=b.left-a.left+12;if(a.right>b.right)bar.scrollLeft+=a.right-b.right+12;
  }
  function choose(id){
    window.OceanNavigation?.begin();activeSport=id&&SPORTMAP[id]?id:null;chosenSport=activeSport||'all';
    renderSportFilters();renderWorlds();renderSpots();render(false);saveState();renderHome();
    filters.querySelector(`[data-map-sport="${id||''}"]`)?.focus({preventScroll:true});
  }
  function reset(){window.OceanNavigation?.begin();currentFilter='all';currentSearch='';favOnly=false;$('#spotSearch').value='';$('#favChip')?.classList.remove('active');document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));choose(null);}

  /* Hauteur : la carte occupe l’écran restant, sans passer sous la barre d’onglets. */
  function size(){
    if(!wrap||wrap.classList.contains('full'))return;
    const scr=$('#screenWrap');if(!scr)return;
    const s=scr.getBoundingClientRect(),top=wrap.getBoundingClientRect().top-s.top+scr.scrollTop;
    let bottom=innerHeight;const nav=document.querySelector('.nav');if(nav){const r=nav.getBoundingClientRect();if(r.top>innerHeight*.5)bottom=r.top;}
    wrap.classList.toggle('is-narrow',(stage?.clientWidth||innerWidth)<700);
    wrap.style.setProperty('--omap-h',Math.round(Math.max(440,Math.min(bottom-s.top-top-12,1100)))+'px');
  }

  /* ---------- Carte ---------- */
  function webgl(){try{return !!document.createElement('canvas').getContext('webgl2');}catch(_){return false;}}
  function ensureMap(){
    if(map)return Promise.resolve(map);
    if(starting)return starting;
    starting=(async()=>{
      if(!webgl())throw Error('webgl');
      const ml=await loadEngine();
      const m=new ml.Map({container:$('#spotMap'),style:style(),center:[10,22],zoom:1.2,minZoom:0,maxZoom:17,renderWorldCopies:true,attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false,fadeDuration:180,maxTileCacheSize:120,locale:{'Map.Title':'Carte des spots','NavigationControl.ZoomIn':'Zoom avant','NavigationControl.ZoomOut':'Zoom arrière','AttributionControl.ToggleAttribution':'Afficher les sources de la carte'}});
      m.touchZoomRotate.disableRotation();m.keyboard.disableRotation?.();
      m.addControl(new ml.AttributionControl({compact:true}),'bottom-right');
      m.getCanvas().setAttribute('aria-label','Carte interactive des spots. Utilise les flèches pour te déplacer, plus et moins pour zoomer.');
      await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('timeout')),20000);m.once('load',()=>{clearTimeout(t);resolve();});});
      map=m;engineReady(ml);return m;
    })();
    starting.catch(()=>{starting=null;});
    return starting;
  }
  function engineReady(ml){
    for(const id of Object.keys(COLORS)){const p=pinImage(COLORS[id]);map.addImage('ob-pin-'+id,p.image,{pixelRatio:p.ratio});}
    map.addSource('spots',{type:'geojson',data:{type:'FeatureCollection',features:[]},cluster:true,clusterRadius:48,clusterMaxZoom:12,buffer:64});
    map.addSource('spots-all',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    const clusterColor=['literal','#1f55e0'];
    map.addLayer({id:'dots',type:'circle',source:'spots-all',paint:{'circle-radius':['interpolate',['linear'],['zoom'],0,2.6,3,3.8],'circle-color':['get','c'],'circle-stroke-color':'#ffffff','circle-stroke-width':.8,'circle-opacity':.95}});
    map.addLayer({id:'cluster-halo',type:'circle',source:'spots',filter:['has','point_count'],paint:{'circle-radius':['step',['get','point_count'],22,10,26,40,31,120,37],'circle-color':clusterColor,'circle-opacity':.16}});
    map.addLayer({id:'cluster',type:'circle',source:'spots',filter:['has','point_count'],paint:{'circle-radius':['step',['get','point_count'],15,10,18,40,22,120,26],'circle-color':clusterColor,'circle-stroke-color':'#ffffff','circle-stroke-width':2.5}});
    map.addLayer({id:'cluster-count',type:'symbol',source:'spots',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Bold'],'text-size':['step',['get','point_count'],12,40,13.5,120,15],'text-allow-overlap':true,'text-ignore-placement':true},paint:{'text-color':'#ffffff'}});
    map.addLayer({id:'spot-pin',type:'symbol',source:'spots',filter:['!',['has','point_count']],layout:{'icon-image':['concat','ob-pin-',['get','a']],'icon-anchor':'bottom','icon-size':['interpolate',['linear'],['zoom'],2,.78,7,.92,11,1.05],'icon-allow-overlap':true,'icon-ignore-placement':true,'symbol-sort-key':['get','lat']}});
    map.addLayer({id:'spot-label',type:'symbol',source:'spots',minzoom:8,filter:['!',['has','point_count']],layout:{'text-field':['get','n'],'text-font':['Noto Sans Bold'],'text-size':11.5,'text-anchor':'top','text-offset':[0,.35],'text-max-width':9,'text-optional':true,'text-padding':4},paint:{'text-color':'#0b2d7a','text-halo-color':'#ffffff','text-halo-width':1.6}});
    for(const r of REGIONS){
      const el=document.createElement('button');el.type='button';el.className='omap-region';el.dataset.region=r.id;
      el.addEventListener('click',()=>zoomRegion(r.id));
      regionMarkers.push({r,el,marker:new ml.Marker({element:el,anchor:'center'}).setLngLat(r.at)});
    }
    selectedMarker=new ml.Marker({element:Object.assign(document.createElement('div'),{className:'omap-selected'}),anchor:'bottom'});
    userDot=new ml.Marker({element:Object.assign(document.createElement('div'),{className:'omap-user'}),anchor:'center'});
    tip=new ml.Popup({closeButton:false,closeOnClick:false,className:'omap-tip',offset:[0,-30],maxWidth:'240px'});
    map.on('click',onMapClick);
    map.on('mousemove',e=>{const f=pick(e.point);map.getCanvas().style.cursor=f?'pointer':'';if(f&&f.layer.id==='spot-pin'&&matchMedia('(hover:hover)').matches){tip.setLngLat(f.geometry.coordinates).setText(f.properties.n).addTo(map);}else tip.remove();});
    map.on('mouseout',()=>tip.remove());
    map.on('zoom',()=>worldState());
    map.on('moveend',()=>{clearTimeout(listTimer);listTimer=setTimeout(updateList,80);});
    map.on('error',e=>{if(/glyph|font/i.test(String(e?.error?.message||'')))return;});
    status.hidden=true;
    updateMinZoom();
  }
  function pick(point){
    if(!map)return null;const d=mobile()?16:8;
    const found=map.queryRenderedFeatures([[point.x-d,point.y-d],[point.x+d,point.y+d]],{layers:['cluster','spot-pin','dots'].filter(id=>map.getLayer(id))});
    if(!found.length)return null;
    const at=f=>{const p=map.project(f.geometry.coordinates);return Math.hypot(p.x-point.x,(f.layer.id==='spot-pin'?p.y-14:p.y)-point.y);};
    return found.sort((a,b)=>(a.layer.id==='cluster'?-1:0)-(b.layer.id==='cluster'?-1:0)||at(a)-at(b))[0];
  }
  async function onMapClick(e){
    const f=pick(e.point);
    if(!f){deselect();return;}
    if(f.layer.id==='dots'){map.easeTo({center:f.geometry.coordinates,zoom:Math.max(4,map.getZoom()+2),padding:pad()});return;}
    if(f.layer.id==='spot-pin'){select(f.properties.id,{fly:false});return;}
    const src=map.getSource('spots'),id=f.properties.cluster_id,center=f.geometry.coordinates;
    try{
      const zoom=await src.getClusterExpansionZoom(id);
      if(zoom<=12.5||map.getZoom()<12){map.easeTo({center,zoom:Math.min(zoom+.3,16),duration:550,padding:pad()});return;}
      const leaves=await src.getClusterLeaves(id,40,0);showStack(leaves.map(l=>l.properties.id));
    }catch(_){map.easeTo({center,zoom:map.getZoom()+2,padding:pad()});}
  }
  function pad(){
    const m=mobile(),w=stage?.clientWidth||0,top=m?(filters?.offsetHeight||40)+26:30;
    return {top:Math.min(top,120),bottom:m?(card&&!card.hidden?card.offsetHeight+80:80):(card&&!card.hidden?40:30),left:m?24:(card&&!card.hidden&&w>900?440:48),right:m?60:84};
  }
  function updateMinZoom(){
    if(!map)return;const h=map.getContainer().clientHeight||500;
    map.setMinZoom(Math.max(0,Math.log2(h/512)));
  }
  /* Zoom de la vue monde : le monde entier en largeur si l’écran le permet. */
  function overviewZoom(){const c=map.getContainer();return Math.max(map.getMinZoom(),Math.min(1.9,Math.log2((c.clientWidth-(mobile()?0:40))/512)));}
  const worldZoom=()=>overviewZoom()+.9;
  function overview(animate){
    if(!map)return;deselect();
    if(regionsMode()||!rows.length){
      map[animate?'flyTo':'jumpTo']({center:[mobile()?-20:12,mobile()?26:20],zoom:overviewZoom(),padding:{top:0,bottom:0,left:0,right:0},...(animate?{duration:900}:{})});
      return;
    }
    const b=M.bounds(rows.map(s=>COORDS[s.id]));
    if(!b)return;
    const small=Math.abs(b[1][0]-b[0][0])<.02&&Math.abs(b[1][1]-b[0][1])<.02;
    if(small)map[animate?'flyTo':'jumpTo']({center:b[0],zoom:11,padding:pad()});
    else map.fitBounds(b,{padding:pad(),maxZoom:11,animate:!!animate,duration:animate?900:0});
  }
  function zoomRegion(id){
    const r=REGIONS.find(x=>x.id===id);if(!r||!map)return;
    const inside=rows.filter(s=>regionOf(s)?.id===id),b=M.bounds(inside.map(s=>COORDS[s.id]));
    if(!b){map.flyTo({center:r.at,zoom:3.2});return;}
    setSheet(false);
    const cam=map.cameraForBounds(b,{padding:pad(),maxZoom:9})||{center:r.at,zoom:3};
    map.flyTo({...cam,zoom:Math.max(cam.zoom,worldZoom()+.35),duration:1000});
  }
  function worldState(force){
    if(!map||!wrap)return;
    const world=regionsMode()&&map.getZoom()<worldZoom();
    if(!force&&world===worldOn)return;
    const changed=world!==worldOn;worldOn=world;
    wrap.classList.toggle('is-world',world);
    if(changed&&force!==true)updateList();
    for(const layer of ['cluster-halo','cluster','cluster-count','spot-pin','spot-label'])map.setLayoutProperty(layer,'visibility',world?'none':'visible');
    map.setLayoutProperty('dots','visibility',world?'visible':'none');
    for(const m of regionMarkers)m.el.tabIndex=world?0:-1;
  }
  function setData(){
    const feats=rows.map(s=>{const c=COORDS[s.id],a=primary(s)||'surf';return {type:'Feature',geometry:{type:'Point',coordinates:[c.lon,c.lat]},properties:{id:s.id,a,c:color(a),n:shortName(s),lat:-c.lat}};});
    const key=activeSport+'|'+rows.length+'|'+rows.map(s=>s.id).join(',');
    const clusterColor=activeSport?color(activeSport):'#1f55e0';
    map.setPaintProperty('cluster','circle-color',clusterColor);map.setPaintProperty('cluster-halo','circle-color',clusterColor);
    if(key!==lastData){lastData=key;const data={type:'FeatureCollection',features:feats.filter(f=>f.properties.id!==selected)};map.getSource('spots').setData(data);map.getSource('spots-all').setData({type:'FeatureCollection',features:feats});}
    const show=regionsMode();
    for(const m of regionMarkers){
      const n=rows.filter(s=>regionOf(s)?.id===m.r.id).length;
      m.el.innerHTML=`<b>${esc(m.r.lab)}</b><span>${total(n)}</span>`;
      if(show&&n)m.marker.addTo(map);else m.marker.remove();
    }
    worldState(true);
    empty.hidden=rows.length>0;
    if(!rows.length){empty.innerHTML='<b>Aucun spot avec ces filtres</b><p>Essaie une autre activité ou un autre niveau.</p><button type="button">Réinitialiser les filtres</button>';empty.querySelector('button').onclick=reset;}
  }
  /* Le spot choisi sort de la couche groupée pour ne jamais se retrouver dans une grappe. */
  function refreshSelectedData(){
    if(!map)return;lastData='';setData();
  }

  /* ---------- Liste de la zone visible ---------- */
  function updateList(){
    if(!map||!panel)return;
    const title=panel.querySelector('.omap-title'),sub=panel.querySelector('.omap-sub');
    if(regionsMode()&&map.getZoom()<worldZoom()){
      title.textContent=rows.length>1?`${rows.length} spots dans le monde`:`${rows.length} spot dans le monde`;
      sub.textContent='Choisis une région pour commencer.';
      list.innerHTML=`<p class="omap-list-intro">Les régions</p><ul class="omap-regions">${REGIONS.map(r=>{const inside=rows.filter(s=>regionOf(s)?.id===r.id);if(!inside.length)return '';const names=M.top(inside.map(countryOf),3).join(' · ');return `<li><button type="button" data-region="${r.id}"><span><b>${esc(r.lab)}</b><small>${esc(names)}</small></span><em>${total(inside.length)}</em>${icon('arrow')}</button></li>`;}).join('')}</ul>`;
      return;
    }
    const b=map.getBounds(),view={west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()},c=map.getCenter(),center={lon:c.lng,lat:c.lat};
    const inside=rows.filter(s=>M.inView(COORDS[s.id].lon,COORDS[s.id].lat,view)).map(s=>({s,d:M.distance(COORDS[s.id],center)})).sort((a,b)=>a.d-b.d).map(x=>x.s);
    const n=inside.length;
    title.textContent=n>1?`${n} spots dans cette zone`:n===1?'1 spot dans cette zone':'Aucun spot dans cette zone';
    sub.textContent=n?M.top(inside.map(countryOf),3).join(' · '):'Dézoome ou reviens à la vue du monde.';
    const shown=inside.slice(0,40);
    list.innerHTML=n?`<ul class="omap-items">${shown.map(item).join('')}</ul>${n>shown.length?`<p class="omap-more">${n-shown.length>1?`Et ${n-shown.length} autres spots : zoome pour les voir.`:'Et 1 autre spot : zoome pour le voir.'}</p>`:''}`:`<div class="omap-none"><p>Aucun spot dans cette zone avec ces filtres.</p><button type="button" data-omap-all>Voir tous les spots</button></div>`;
  }
  function item(s){
    const acts=spotSports(s),lvl=levelOf(s);
    return `<li><button type="button" class="omap-item${s.id===selected?' is-on':''}" data-spot="${esc(s.id)}"><img src="${esc(photoOf(s))}" alt="" width="56" height="56" loading="lazy" decoding="async"><span class="omap-item-text"><b>${esc(s.name)}</b><small>${esc(countryOf(s))} · ${esc(acts.slice(0,3).map(id=>SPORTMAP[id].label).join(', '))}</small></span><span class="omap-dot" style="--c:${color(primary(s))}" aria-hidden="true"></span><span class="omap-lvl lvl-${lvl}">${esc(lvlLabel[lvl]||'Niveau à évaluer')}</span></button></li>`;
  }
  function onPanelClick(e){
    const r=e.target.closest('[data-region]');if(r){zoomRegion(r.dataset.region);return;}
    const s=e.target.closest('[data-spot]');if(s){setSheet(false);select(s.dataset.spot,{fly:true});return;}
    if(e.target.closest('[data-omap-all]')){reset();setTimeout(()=>overview(true),50);}
  }

  /* ---------- Aperçu du spot ---------- */
  function select(id,{fly=false}={}){
    const s=SPOTS.find(x=>x.id===id),c=s&&COORDS[s.id];if(!s||!c||!map)return;
    selected=id;refreshSelectedData();
    const a=primary(s);
    const el=selectedMarker.getElement();el.style.setProperty('--c',color(a));el.innerHTML='<span></span>';
    selectedMarker.setLngLat([c.lon,c.lat]).addTo(map);
    renderCard(s);
    const p=pad();
    if(fly)map.flyTo({center:[c.lon,c.lat],zoom:Math.max(map.getZoom(),10),padding:p,duration:900});
    else{const pt=map.project([c.lon,c.lat]),w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;if(pt.x<p.left||pt.x>w-p.right||pt.y<p.top+30||pt.y>h-p.bottom)map.easeTo({center:[c.lon,c.lat],padding:p,duration:500});}
    list?.querySelectorAll('.omap-item').forEach(b=>b.classList.toggle('is-on',b.dataset.spot===id));
  }
  function deselect(focusMap){
    if(!selected&&card?.hidden)return;
    selected=null;selectedMarker?.remove();if(card){card.hidden=true;card.innerHTML='';}
    wrap?.classList.remove('has-card');refreshSelectedData();
    list?.querySelectorAll('.omap-item.is-on').forEach(b=>b.classList.remove('is-on'));
    if(focusMap)map?.getCanvas().focus({preventScroll:true});
  }
  function liveLine(s){
    const live=typeof LIVE!=='undefined'&&LIVE[s.id];if(!live?.live)return '';
    const part=(fn,v)=>v&&v!=='—'?`<span>${typeof fn==='function'?fn():''}${esc(v)}</span>`:'';
    const html=part(window.icoWind,live.wind)+part(window.icoSwell,live.swell)+part(window.icoTemp,live.temp);
    return html?`<p class="omap-live" title="Modèle Open-Meteo">${html}</p>`:'';
  }
  function renderCard(s){
    const acts=spotSports(s),lvl=levelOf(s),reg=regionOf(s);
    card.innerHTML=`<button type="button" class="omap-card-close" data-card="close" aria-label="Fermer l’aperçu">${icon('close')}</button><div class="omap-card-top"><img class="omap-card-photo" src="${esc(photoOf(s))}" alt="" width="96" height="96" decoding="async"><div class="omap-card-text"><small>${esc(countryOf(s))}${reg?` · ${esc(reg.lab)}`:''}</small><h3>${esc(s.name)}</h3><p class="omap-card-acts">${acts.slice(0,4).map(id=>`<span style="--c:${color(id)}"${id===activeSport?' class="is-on"':''}><i aria-hidden="true"></i>${esc(SPORTMAP[id].label)}</span>`).join('')}${acts.length>4?`<span class="omap-more-acts">+${acts.length-4}</span>`:''}</p><p class="omap-card-meta"><span class="omap-lvl lvl-${lvl}">${esc(lvlLabel[lvl]||'Niveau à évaluer')}</span></p>${liveLine(s)}</div></div><div class="omap-card-actions"><button type="button" class="omap-go" data-card="open">Voir la fiche ${icon('arrow')}</button><button type="button" class="omap-trip" data-card="trip">${icon('trip')}Ajouter à un voyage</button><button type="button" class="omap-relief" data-card="relief" aria-label="Relief 3D" title="Relief 3D">${icon('relief')}</button></div>`;
    card.dataset.spot=s.id;card.hidden=false;wrap.classList.add('has-card');
    card.querySelector('img').addEventListener('error',e=>{e.target.src=typeof spotIllustration==='function'?spotIllustration(s.id):'assets/poulpy/scenes/travel-v2.webp';},{once:true});
  }
  function showStack(ids){
    const spots=ids.map(id=>SPOTS.find(s=>s.id===id)).filter(Boolean);if(!spots.length)return;
    if(spots.length===1){select(spots[0].id);return;}
    deselect();
    card.innerHTML=`<button type="button" class="omap-card-close" data-card="close" aria-label="Fermer l’aperçu">${icon('close')}</button><h3 class="omap-stack-title">${spots.length} spots au même endroit</h3><ul class="omap-items">${spots.map(item).join('')}</ul>`;
    card.hidden=false;wrap.classList.add('has-card');
  }
  function onCardClick(e){
    const b=e.target.closest('[data-card],[data-spot]');if(!b)return;
    if(b.dataset.spot){select(b.dataset.spot,{fly:true});return;}
    const id=card.dataset.spot,k=b.dataset.card;
    if(k==='close'){deselect(true);return;}
    if(k==='open'){window.OceanNavigation?.begin();if(mapFull)setMapFull(false,true);openSpot(id);return;}
    if(k==='trip'){window.OceanTrips?.fromSpot(id);return;}
    if(k==='relief'){const s=SPOTS.find(x=>x.id===id);if(s)startTerrain(s);}
  }

  /* ---------- Position de l’utilisateur ---------- */
  function locate(){
    const done=()=>showUser(userPos,true);
    if(typeof userPos!=='undefined'&&userPos){done();return;}
    if(typeof requestGeo!=='function')return;
    requestGeo(done,()=>toast('📍 Localisation refusée ou indisponible'));
  }
  function showUser(pos,fly){
    if(!pos)return;
    ensureMap().then(m=>{userDot.setLngLat([pos.lon,pos.lat]).addTo(m);if(fly!==false)m.flyTo({center:[pos.lon,pos.lat],zoom:Math.max(m.getZoom(),7.5),padding:pad(),duration:1000});}).catch(()=>{});
  }

  /* ---------- Rendu principal, appelé par l’application ---------- */
  function render(refresh){
    if(!build())return;
    if(terrainOverlay)closeTerrain('',false);
    rows=candidates().filter(s=>!activeSport||spotSports(s).includes(activeSport));
    const key=JSON.stringify([spotWorld,spotCountry,currentSearch,favOnly]);
    if(key!==fitKey){fitKey=key;needFit=true;}
    if(refresh===true&&!map)needFit=true;
    renderFilters();syncMode();
    if(selected&&!rows.some(s=>s.id===selected))deselect();
    if(!mapVisible())return;
    size();
    const first=!map;
    ensureMap().then(()=>{
      map.resize();updateMinZoom();setData();
      if(needFit){needFit=false;overview(false);}
      if(first&&typeof userPos!=='undefined'&&userPos&&nearMode)showUser(userPos,false);
      updateList();
    }).catch(()=>{
      status.hidden=false;status.classList.add('is-error');
      status.innerHTML='<b>La carte interactive n’a pas pu se charger.</b><span>Tu peux parcourir les spots dans la liste.</span><button type="button">Afficher la liste</button>';
      status.querySelector('button').onclick=()=>setView('list');
    });
  }
  /* Redimensionne ; ne recadre que si la sélection de spots a changé. */
  function fit(){
    if(!map||!mapVisible())return;size();map.resize();updateMinZoom();
    if(needFit){needFit=false;overview(false);}
    revealActivity();
  }

  /* ---------- Relief 3D (vue optionnelle, même moteur) ---------- */
  function closeTerrain(message,restoreFocus=true){
    terrainGeneration++;
    const opener=terrainOpener,hadOverlay=!!terrainOverlay;
    if(terrainMap){terrainMap.remove();terrainMap=null;}
    terrainOverlay?.remove();terrainOverlay=null;terrainTarget=null;
    for(const {element,inert,ariaHidden} of terrainUnderlying){element.inert=inert;if(ariaHidden===null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',ariaHidden);}
    terrainUnderlying=[];terrainOpener=null;
    if(message&&typeof toast==='function')toast(message);
    if(map)requestAnimationFrame(()=>map?.resize());
    if(restoreFocus&&hadOverlay&&opener?.isConnected)opener.focus({preventScroll:true});
  }
  function distance(a,b){
    const dLat=(a.lat-b.lat)*Math.PI/180,dLon=(a.lon-b.lon)*Math.PI/180;
    return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2)));
  }
  function nearestSpot(){
    const c=map?.getCenter(),center=c&&{lat:c.lat,lon:c.lng};
    return center?rows.slice().sort((a,b)=>distance(COORDS[a.id],center)-distance(COORDS[b.id],center))[0]:rows[0];
  }
  async function startTerrain(spot){
    const chosen=spot||nearestSpot(),point=chosen&&COORDS[chosen.id];
    if(!point||!stage)return;
    const opener=document.activeElement;
    closeTerrain('',false);
    const generation=terrainGeneration;
    terrainOpener=opener;terrainTarget=chosen;
    terrainOverlay=document.createElement('section');terrainOverlay.className='terrain-overlay';terrainOverlay.setAttribute('role','region');terrainOverlay.setAttribute('aria-label',`Relief terrestre autour de ${chosen.name}`);terrainOverlay.setAttribute('aria-describedby','terrainExplanation');
    terrainOverlay.innerHTML=`<div class="terrain-canvas"></div><div class="terrain-guide"><span>RELIEF TERRESTRE · ${esc(chosen.name)}</span><p id="terrainExplanation">Vue indicative du terrain côtier. Aucune profondeur marine ni condition de sécurité n’est représentée.</p><button type="button" data-terrain-close aria-describedby="terrainExplanation">Retour à la carte 2D</button></div><p class="terrain-loading" role="status">Préparation du relief 3D…</p>`;
    terrainOverlay.querySelector('[data-terrain-close]').onclick=()=>closeTerrain();
    terrainOverlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeTerrain();}});
    terrainUnderlying=[...wrap.querySelectorAll(':scope>.omap-panel,:scope>.omap-stage>*')].map(element=>({element,inert:element.inert,ariaHidden:element.getAttribute('aria-hidden')}));
    for(const {element} of terrainUnderlying){element.inert=true;element.setAttribute('aria-hidden','true');}
    stage.append(terrainOverlay);
    terrainOverlay.querySelector('[data-terrain-close]').focus({preventScroll:true});
    try{
      if(!webgl())throw Error('WebGL 2 indisponible');
      const maplibre=await loadEngine();
      if(generation!==terrainGeneration)return;
      const tmap=new maplibre.Map({
        container:terrainOverlay.querySelector('.terrain-canvas'),
        style:{version:8,sources:{
          osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'},
          terrain:{type:'raster-dem',url:'https://tiles.mapterhorn.com/tilejson.json',attribution:'Relief : <a href="https://mapterhorn.com/attribution/">Mapterhorn</a>'}
        },layers:[{id:'ocean-base',type:'raster',source:'osm'}],terrain:{source:'terrain',exaggeration:1}},
        center:[point.lon,point.lat],zoom:10.2,pitch:62,bearing:-20,maxPitch:78,maxZoom:17,canvasContextAttributes:{antialias:true}
      });
      terrainMap=tmap;
      tmap.addControl(new maplibre.NavigationControl({visualizePitch:true}),'top-right');
      terrainOverlay.querySelector('.maplibregl-canvas')?.setAttribute('aria-label',`Carte en relief terrestre autour de ${chosen.name}`);
      for(const [selector,label] of [['.maplibregl-ctrl-zoom-in','Zoom avant'],['.maplibregl-ctrl-zoom-out','Zoom arrière'],['.maplibregl-ctrl-compass','Orienter la carte vers le nord']])terrainOverlay.querySelector(selector)?.setAttribute('aria-label',label);
      const timer=setTimeout(()=>{if(generation===terrainGeneration&&terrainOverlay?.querySelector('.terrain-loading'))closeTerrain('Relief indisponible. Carte 2D rétablie.');},18000);
      tmap.once('load',()=>{
        clearTimeout(timer);
        if(generation!==terrainGeneration)return;
        terrainOverlay?.querySelector('.terrain-loading')?.remove();
        const nearby=rows.filter(s=>distance(COORDS[s.id],point)<55).sort((a,b)=>distance(COORDS[a.id],point)-distance(COORDS[b.id],point)).slice(0,20);
        if(!nearby.some(s=>s.id===chosen.id))nearby.unshift(chosen);
        nearby.forEach(s=>{
          const marker=document.createElement('button');marker.type='button';marker.className='terrain-spot-pin';marker.textContent=shortName(s);marker.setAttribute('aria-label',`Ouvrir la fiche de ${s.name}`);
          marker.onclick=()=>{closeTerrain('',false);if(mapFull)setMapFull(false,true);openSpot(s.id);};
          new maplibre.Marker({element:marker,anchor:'bottom'}).setLngLat([COORDS[s.id].lon,COORDS[s.id].lat]).addTo(tmap);
        });
        tmap.resize();
      });
      tmap.on('error',event=>{
        const detail=String(event.error?.message||'');
        if(generation===terrainGeneration&&/mapterhorn|terrain|raster.?dem|tilejson/i.test(detail))closeTerrain('Relief indisponible. Carte 2D rétablie.');
      });
    }catch(_){if(generation===terrainGeneration)closeTerrain('Relief non pris en charge ici. Carte 2D rétablie.');}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&terrainOverlay)closeTerrain('',false);});
  window.addEventListener('pagehide',()=>{if(terrainOverlay)closeTerrain('',false);});
  window.OceanMap={render,fit,revealActivity,startTerrain,closeTerrain,showUser,select,overview:()=>overview(true),region:zoomRegion,count:()=>rows.length,get map(){return map;}};
})();
