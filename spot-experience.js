/* Local conditions and an entry into the single photographic immersion gallery. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let activeSpot = null, activeAct = null, request = 0;
  const cache = new Map();
  const pending = new Map();
  const api = 'https://api.open-meteo.com/v1/forecast';
  const marineApi = 'https://marine-api.open-meteo.com/v1/marine';
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const weekday = d => { try { const w = new Intl.DateTimeFormat(OB_I18N.locale, { weekday: 'short' }).format(d).replace(/\.$/, ''); return w.charAt(0).toUpperCase() + w.slice(1); } catch (e) { return days[d.getDay()]; } };
  const day = (iso, i) => { if (i === 0) return 'Aujourd’hui'; const d = new Date(iso + 'T12:00:00'); return (window.OB_I18N && OB_I18N.lang !== 'fr' ? weekday(d) : days[d.getDay()]) || `J+${i}`; };
  const direction = deg => deg == null || Number.isNaN(+deg) ? '—' : ((window.OB_I18N&&OB_I18N.lang!=='fr')?['N','NE','E','SE','S','SW','W','NW']:['N','NE','E','SE','S','SO','O','NO'])[Math.round(+deg / 45) % 8];
  const photo = s => window.OceanPhotos?.lead(s.id, activeAct);

  function ensureExperiencePanel() {
    const infos = $('#detail .dcat[data-cat="infos"]');
    if (!infos) return;
    if (!$('#spotVideoPanel')) { const section=document.createElement('section');section.id='spotVideoPanel';infos.append(section); }
    if (!$('#spotAreaMap')) {
      const section=document.createElement('section');section.id='spotAreaMap';section.className='spot-area-map';section.setAttribute('aria-labelledby','areaMapTitle');
      section.innerHTML='<div class="area-map-heading"><div><small>LA CARTE DU SECTEUR</small><h3 id="areaMapTitle">Explore le secteur</h3><p class="area-map-copy"></p></div></div><div class="area-map-canvas" data-area-map></div><ul class="area-map-legend"><li><i class="is-focus" aria-hidden="true"></i>Ce spot</li><li><i class="is-spot" aria-hidden="true"></i>Autres spots Ocean Buddy</li><li class="area-map-legend-places" hidden><i class="is-place" aria-hidden="true">1</i>À découvrir autour</li></ul><div class="area-map-footer"><span>Repère approximatif du secteur : il ne marque ni un point de courant ni une mise à l’eau validée.</span><a data-area-map-link target="_blank" rel="noopener noreferrer">Ouvrir dans OpenStreetMap</a></div>';
      infos.append(section);
    }
  }

  function init() {
    ensureExperiencePanel();
    const panel=$('#spotVideoPanel');
    if(panel){panel.innerHTML='<div class="experience-placeholder"><small>LE SPOT EN IMAGES</small><b>Explore les images et les repères du lieu</b><span>Ouvre une fiche de spot pour afficher ses photos, sa carte et les vidéos disponibles.</span></div>';}
  }

  function videoPanel(s, act) {
    const image=photo(s);
    const count=window.OceanPhotos?.list(s.id,act)?.length||0;
    const query=encodeURIComponent([s.name,s.loc,act,'spot'].filter(Boolean).join(' '));
    return `<div class="experience-heading"><span><small>LE SPOT EN IMAGES</small><b>Approche-toi du lieu.</b></span><i>${count?(count>1?`${count} photos locales`:`${count} photo locale`):'Aucune photo locale'}</i></div><button type="button" class="experience-photo-open ${image?'':'no-image'}" data-experience-open>${image?`<img src="${esc(image.thumb||image.src)}" alt="" loading="lazy">`:'<span class="experience-photo-symbol" aria-hidden="true">◎</span>'}<span><b>${image?`Explorer ${esc(s.name)}`:`Découvrir ${esc(s.name)} en images`}</b><small>${image?'Photos créditées · tu peux en chercher d’autres dans la galerie.':'Aucune image locale pour ce lieu. Cherche des photos réutilisables avec leurs crédits.'}</small><strong>${image?'Entrer dans le décor':'Trouver des photos'}</strong></span></button>${window.OceanVoyage?'<button type="button" class="experience-video-search experience-explore-360" data-experience-explore><span aria-hidden="true">360°</span><span><b>Balade-toi sur le spot en 360°</b><small>Parking, plage, point de vue et, quand elles existent, des vues dans l’eau · chargées à la demande</small></span></button>':''}<a class="experience-video-search" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span><span><b>Voir des vidéos du spot</b><small>Ouvre les vidéos proposées sur YouTube · lecture à la demande</small></span></a>`;
  }

  /* Carte du secteur : même moteur que la carte des spots, créée quand elle devient visible. */
  let areaMap=null,areaRequest=0;
  function updateAreaMap(s){
    const panel=$('#spotAreaMap');if(!panel)return;
    const copy=panel.querySelector('.area-map-copy'),link=panel.querySelector('[data-area-map-link]'),host=panel.querySelector('[data-area-map]');
    /* La carte suit les incontournables « À découvrir autour » quand le carnet est affiché. */
    const around=$('#guideAround');if(around&&around.nextElementSibling!==panel&&around.parentNode)around.after(panel);
    const point=typeof COORDS!=='undefined'?COORDS[s.id]:null,lat=Number(point?.lat),lon=Number(point?.lon);
    if(!point||!Number.isFinite(lat)||!Number.isFinite(lon)){panel.hidden=true;return;}
    panel.hidden=false;
    copy.textContent=`${s.name} et les spots voisins. Touche un point pour en savoir plus.`;
    link.href=`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`;
    const legend=panel.querySelector('.area-map-legend-places');legend.hidden=true;
    const focusDot=panel.querySelector('.area-map-legend .is-focus'),first=typeof spotSports==='function'?spotSports(s)[0]:null;if(focusDot&&window.OceanMap?.color)focusDot.style.background=window.OceanMap.color(first);
    const config={focus:s.id,places:[],label:`Carte du secteur autour de ${s.name}`};
    if(!window.OceanMap?.mini){host.innerHTML='<p class="area-map-fallback">La carte interactive est indisponible. Tu peux ouvrir le secteur dans OpenStreetMap.</p>';return;}
    /* La carte du secteur ne doit jamais empêcher la fiche de s’ouvrir. */
    try{if(areaMap)areaMap.update(config);else areaMap=window.OceanMap.mini(host,config);}catch(e){console.warn('area map',e);}
    const request=++areaRequest;
    window.OceanSpotGuide?.around?.(s).then(items=>{
      if(request!==areaRequest||!items?.length)return;
      legend.hidden=false;areaMap.update({places:items.map(x=>({i:x.i,n:x.n,d:x.d,lat:x.lat,lon:x.lon}))});
    }).catch(()=>{});
  }

  /* Choix du schéma : mots entiers, sans accents ni casse (comme poulpy-knowledge.js), jamais une sous-chaîne :
     « approche » ne contient pas « roche », « souvent » ne contient pas « vent ». */
  const plain = v => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘`´]/g, "'");
  const whole = src => new RegExp('(?<![\\p{L}])(?:' + src + ')(?![\\p{L}])', 'u');
  const DIAGRAM_WORDS = [
    ['rip', whole("baines?|rips?|courants?\\s+(?:d'arrachement|de\\s+retour|de\\s+baine)")],
    ['reef', whole('recifs?|reefs?|rochers?|roches?|falaises?')],
    ['wind', whole('vents?|kites?|voiles?')]
  ];
  /* Deux schémas hors plage, choisis avant la cascade ci-dessus.
     passe : plongée en mer (au moins la plongée, avec ou sans snorkeling) dont les dangers citent le mot « courant ».
     riviere : plan d’eau « inland » dont les dangers citent une eau vive, sans grotte ni cavité (cénotes, sources de plongée).
     Ces spots n’ont aucun schéma de plage : un courant de retour serait faux pour eux. L’Eisbach (vague artificielle où la ville interdit de nager),
     Ginnie, Bonito et Silfra n’ont jamais le schéma de rivière : un nageur emporté par le courant n’y décrirait pas le danger réel. */
  const PASSE_WORD = whole('courants?');
  const RIVER_WORD = whole('rapides?|crues?|courants?|siphons?|seuils?|lachers?|barrages?');
  const CAVE_WORD = whole('grottes?|cavernes?|cavites?|galeries?');
  const NO_RIVER = new Set(['eisbach', 'ginnie', 'bonito', 'silfra']);
  /* Un schéma de plage (courant de retour, déferlement) serait faux pour un plan d’eau intérieur ou pour la plongée et le snorkeling seuls :
     ces spots gardent un schéma de récif ou de vent si le texte le cite, sinon aucun schéma (null). */
  function safetyKind(s) {
    const sports = typeof spotSports === 'function' ? spotSports(s) : (Array.isArray(s.sports) ? s.sports : []);
    const noBeach = isInland(s) || (sports.length > 0 && sports.every(id => id === 'plongee' || id === 'snorkeling'));
    const text = plain((s.dangers || []).map(x => x[1]).join(' '));
    if (s.waterType === 'sea' && noBeach && sports.includes('plongee') && PASSE_WORD.test(text)) return 'passe';
    if (s.waterType === 'inland' && !NO_RIVER.has(s.id) && RIVER_WORD.test(text) && !CAVE_WORD.test(text)) return 'riviere';
    const hit = DIAGRAM_WORDS.filter(([kind]) => !noBeach || kind !== 'rip').find(([, re]) => re.test(text));
    return hit ? hit[0] : noBeach ? null : 'shore';
  }

  /* Consignes sous les schémas « passe » et « rivière » : chacune est reprise de data/sources/schemas.json (clé `ref`), qui garde les citations.
     Le navigateur ne retient que le texte, l’éditeur, l’adresse et la date de consultation.
     « pieds en avant » ne s’écrit qu’avec « gilet » (rapides, American Whitewater) ; sans gilet, la consigne est celle de la DLRG. */
  const SRC = {
    dan: {u: 'https://dan.org/alert-diver/article/diving-in-currents/', l: 'Divers Alert Network (DAN)', d: '2026-10-20'},
    danFound: {u: 'https://dan.org/alert-diver/article/prepare-to-get-found/', l: 'Divers Alert Network (DAN)', d: '2026-10-20'},
    padi: {u: 'https://blog.padi.com/drift-diving-tips-why-you-should-try-it-how-to-stay-safe/', l: 'PADI', d: '2026-10-20'},
    dlrg: {u: 'https://www.dlrg.de/informieren/freizeit-im-wasser/selbst-und-fremdrettung/selbstrettung-aus-stroemungen/', l: 'Deutsche Lebens-Rettungs-Gesellschaft (DLRG)', d: '2026-10-20'},
    fire: {u: 'https://www.firescotland.gov.uk/your-safety/water-safety/', l: 'Scottish Fire and Rescue Service', d: '2026-10-20'},
    wss: {u: 'https://www.watersafetyscotland.org.uk/advice-hub/inland-safety/', l: 'Water Safety Scotland', d: '2026-10-20'},
    sports: {u: 'https://www.sports.gouv.fr/se-baigner-en-riviere-ou-en-lac-des-risques-souvent-sous-estimes-10177', l: 'Ministère chargé des Sports (sports.gouv.fr)', d: '2026-10-20'},
    awSwim: {u: 'https://site-media.americanwhitewater.org/Safety-Code-24-pg-44_Swimming-Techniques.pdf', l: 'American Whitewater', d: '2026-10-20'},
    ffck: {u: 'https://www.ffck.org/pratiquer/loisirs/eaux-vives/', l: 'Fédération française de canoë-kayak (FFCK)', d: '2026-10-20'}
  };
  const SAFETY_TIPS = {
    passe: [
      {ref: 'schema.passe.consigne1', t: 'Ne lutte pas contre le courant : économise ton énergie et signale-toi.', src: [SRC.dan, SRC.padi]},
      {ref: 'schema.passe.consigne2', t: 'Reste groupé avec ton guide : un groupe se repère mieux depuis la surface.', src: [SRC.dan, SRC.danFound]},
      {ref: 'schema.passe.consigne3', t: 'En plongée dérivante, emporte une bouée de surface et un signal sonore.', src: [SRC.dan, SRC.padi]},
      {ref: 'schema.passe.consigne4', t: 'Avant d’entrer, demande le briefing : courant, entrée, sortie.', src: [SRC.dan, SRC.padi]}
    ],
    riviere: [
      {ref: 'schema.riviere.consigne_courant_baigneur', t: 'Ne lutte pas : laisse-toi porter et rejoins la rive en biais.', src: [SRC.dlrg]},
      {ref: 'schema.riviere.consigne1_generique', t: 'Porte un gilet ou une aide à la flottabilité.', src: [SRC.fire, SRC.wss]},
      {ref: 'schema.riviere.consigne2a', t: 'Renseigne-toi sur la météo et les courants avant d’y aller.', src: [SRC.sports]},
      {ref: 'schema.riviere.consigne2b', t: 'Évite tout ce qui dépasse dans le courant : piles de pont, rochers, buissons, arbres. Un buisson ou une branche peut devenir un piège quand l’eau va vite.', src: [SRC.dlrg]},
      {ref: 'schema.riviere.consigne3_eau_vive_avec_gilet', t: 'Avec un gilet, dans des rapides peu profonds ou encombrés : sur le dos, pieds en avant vers l’aval. Cherche ensuite un remous pour sortir du courant.', src: [SRC.awSwim]},
      {ref: 'schema.riviere.consigne4', t: 'Débutant : rapproche-toi d’un club ou d’un encadrant pour t’initier à la rivière.', src: [SRC.ffck]}
    ]
  };
  /* « Source : {libellé} · consultée le {date} » (même clé de traduction que la fiche pratique). */
  const cite = x => `<a class="safety-tip-source" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">Source : ${esc(x.l)} · consultée le ${esc(x.d.split('-').reverse().join('/'))}</a>`;
  const safetyTips = kind => SAFETY_TIPS[kind] ? `<ul class="safety-tips">${SAFETY_TIPS[kind].map(tip => `<li>${esc(tip.t)}${tip.src.map(cite).join('')}</li>`).join('')}</ul>` : '';

  function drawSafety(s, live, marine) {
    const host = $('#spotSafetyLive'); if (!host) return;
    const kind = safetyKind(s), inland = isInland(s);
    const diagrams = {
      rip: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un courant de retour"><path class="sand" d="M0 98h420v52H0z"/><path class="sea" d="M0 0h420v98H0z"/><path class="arrow" d="M90 105V55m-9 10 9-10 9 10M210 115V45m-9 10 9-10 9 10M330 105V55m-9 10 9-10 9 10"/><path class="safe" d="M25 22h370"/><text x="18" y="18">COURANT VERS LE LARGE</text><text x="142" y="140">SORTIR SUR LE CÔTÉ · NE PAS LUTTER</text></svg>`,
      reef: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un récif peu profond"><path class="sea" d="M0 0h420v105H0z"/><path class="sand" d="M0 105h420v45H0z"/><path class="reef" d="M45 105q28-40 55 0 28-55 56 0 32-48 62 0 35-60 70 0 26-38 70 0"/><path class="safe" d="M30 28q70 28 140 0t220 0"/><text x="18" y="18">PROFONDEUR VARIABLE</text><text x="128" y="140">GARDER SES DISTANCES</text></svg>`,
      wind: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un vent qui pousse au large"><path class="sand" d="M0 0h95v150H0z"/><path class="sea" d="M95 0h325v150H95z"/><path class="arrow" d="M42 75h210m-18-12 18 12-18 12"/><path class="safe" d="M95 18v114"/><text x="14" y="18">RIVE</text><text x="300" y="18">LARGE</text><text x="128" y="140">PLANIFIER LE RETOUR</text></svg>`,
      shore: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’une zone de déferlement"><path class="sand" d="M0 110h420v40H0z"/><path class="sea" d="M0 0h420v110H0z"/><path class="wave" d="M15 78q60-60 120 0t120 0 120 0"/><path class="safe" d="M32 126h356"/><text x="122" y="20">ZONE DE DÉFERLEMENT</text><text x="130" y="145">OBSERVER AVANT D’ENTRER</text></svg>`,
      passe: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un courant de passe"><path class="sea" d="M0 0h420v150H0z"/><path class="sand" d="M0 150v-30q70-12 140 0t140 6 140-10v34z"/><path class="arrow" d="M30 100h270m-17-11 17 11-17 11"/><path class="reef" d="M140 74h0M170 68h0M200 76h0"/><path class="safe" d="M170 62V36"/><path class="wave" d="M170 30h0"/><text x="18" y="18">SENS DU COURANT</text><text x="186" y="34">BOUÉE EN SURFACE</text><text x="30" y="143">NE LUTTE PAS · RESTE GROUPÉ AVEC TON GUIDE</text></svg>`,
      riviere: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’une rivière à courant"><path class="sand" d="M0 0h420v26H0zM0 124h420v26H0z"/><path class="sea" d="M0 26h420v98H0z"/><path class="arrow" d="M25 50h120m-16-10 16 10-16 10M25 102h120m-16-10 16 10-16 10"/><path class="safe" d="M190 76l72 48"/><path class="wave" d="M190 76h0"/><path class="reef" d="M280 26l30 56m-22-22 14-4m-4 22 16-6"/><text x="18" y="18">SENS DU COURANT</text><text x="316" y="50">ARBRE : ÉVITE</text><text x="18" y="143">NE LUTTE PAS · REJOINS LA RIVE EN BIAIS</text></svg>`
    };
    const current = live?.current && live.current !== '—' ? live.current : 'Donnée indisponible';
    const updated=Number.isFinite(live?.fetchedAt)?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(live.fetchedAt)):'heure indisponible';
    const head = '<div><small>LECTURE DU SECTEUR</small><b>Courants & dangers à vérifier</b></div>';
    const figure = kind ? `<div class="safety-diagram">${diagrams[kind]}</div>${safetyTips(kind)}` : '';
    /* Hors mer : ni courant marin, ni variation sur 24 h, ni marée, ni badge de modèle (mesures marines). Sans schéma, pas de carte vide. */
    if (inland) {
      host.hidden = !kind;
      host.innerHTML = kind ? `<div class="safety-live-head">${head}</div>${figure}<p class="safety-disclaimer">Ce schéma est un repère général : il ne remplace ni le balisage, ni les consignes du lieu.</p>` : '';
      return;
    }
    host.hidden = false;
    host.innerHTML = `<div class="safety-live-head">${head}<span class="safety-live-pill">${live?.live?'Modèle reçu le '+esc(updated):'Modèle indisponible'}</span></div>${figure}<div class="safety-readings"><span><b>${esc(current)}</b><small>Courant marin · modèle Open-Meteo</small></span><span><b>${indicativeRange(marine)}</b><small>Variation sur les 24 premières heures du modèle</small></span></div><p class="safety-disclaimer">Les courants Open-Meteo sont une aide de repérage à résolution limitée près des côtes : ils ne remplacent ni le balisage, ni le poste de secours, ni les consignes du spot. Vérifie la marée du jour auprès d’une source locale.</p>`;
  }

  function indicativeRange(marine) {
    const values=marine?.hourly?.sea_level_height_msl?.filter(value=>Number.isFinite(+value)).slice(0,25)||[];
    if(values.length<6)return '—';
    const range=Math.max(...values)-Math.min(...values);
    return `${window.obNum?obNum(range,2):range.toFixed(2)} m · modèle`;
  }

  function renderWeek(s, weather, marine, fetchedAt) {
    const host = $('#spotWeek'); if (!host) return;
    const d = weather?.daily || {}, m = marine?.daily || {};
    const times = d.time || m.time || [];
    if (!times.length) { host.innerHTML = '<p class="spot-week-empty">Les prévisions détaillées se chargeront dès que le modèle répondra.</p>'; return; }
    const w = key => d[key] || [];
    const waves = m.wave_height_max || [];
    const updated=fetchedAt?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(fetchedAt)):'heure non disponible';
    host.innerHTML = `<div class="spot-week-head"><div><small>SEMAINE DU SPOT</small><b>Vent, UV, pluie & état de la mer</b></div><span>7 jours · relevé ${esc(updated)}</span></div><div class="spot-week-grid">${times.slice(0,7).map((iso,i) => `<article class="week-day ${i===0?'today':''}"><b>${day(iso,i)}</b><strong>${w('temperature_2m_max')[i] != null ? Math.round(w('temperature_2m_max')[i])+'°' : '—'}</strong><span class="week-min">${w('temperature_2m_min')[i] != null ? Math.round(w('temperature_2m_min')[i])+'°' : '—'}</span><dl><div><dt>Vent</dt><dd>${w('wind_speed_10m_max')[i] != null ? Math.round(w('wind_speed_10m_max')[i])+' km/h' : '—'}</dd></div><div><dt>UV</dt><dd>${w('uv_index_max')[i] != null ? Math.round(w('uv_index_max')[i]*10)/10 : '—'}</dd></div><div><dt>Pluie</dt><dd>${w('precipitation_probability_max')[i] != null ? Math.round(w('precipitation_probability_max')[i])+'%' : '—'}</dd></div><div><dt>Houle</dt><dd>${waves[i] != null && !isInland(s) ? (+waves[i]).toFixed(1)+' m' : '—'}</dd></div></dl></article>`).join('')}</div><p class="spot-week-note">UV, vent et pluie : prévision météo. Houle : prévision marine. Ces valeurs de modèle sont indicatives et la lecture a été mise en cache pour une heure.</p>`;
  }

  function isInland(s) { return typeof window.isInland === 'function' ? window.isInland(s) : ['lake', 'inland'].includes(s?.waterType); }
  async function loadWeek(s, act) {
    const c = typeof COORDS !== 'undefined' ? COORDS[s.id] : null;
    if (!c) { $('#spotWeek').innerHTML='<p class="spot-week-empty">Position non vérifiée : aucune prévision affichée pour ce spot.</p>'; return; }
    const key = `${s.id}:${new Date().toISOString().slice(0,10)}`;
    const n = ++request;
    const stored=cache.get(key);
    if(stored&&Date.now()-stored.fetchedAt<60*60*1000){renderWeek(s,stored.weather,stored.marine,stored.fetchedAt);return;}
    $('#spotWeek').innerHTML = '<div class="spot-week-loading"><i></i><span>Chargement des 7 jours du spot…</span></div>';
    try {
      const weatherUrl = `${api}?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,weather_code&wind_speed_unit=kmh&cell_selection=${typeof isInland==='function'&&isInland(s)?'land':'sea'}&forecast_days=7&timezone=auto`;
      const marineUrl = `${marineApi}?latitude=${c.lat}&longitude=${c.lon}&daily=wave_height_max&forecast_days=7&timezone=auto`;
      const getJson=async url=>{const response=await fetch(url);if(!response.ok)throw Error(`Prévision HTTP ${response.status}`);return response.json();};
      if(!pending.has(key))pending.set(key,(async()=>{
        const weather=await getJson(weatherUrl);
        const marine=isInland(s)?{}:await getJson(marineUrl).catch(()=>({}));
        const result={weather,marine,fetchedAt:Date.now()};cache.set(key,result);return result;
      })().finally(()=>pending.delete(key)));
      const {weather,marine,fetchedAt}=await pending.get(key);
      if (n !== request || activeSpot?.id !== s.id) return;
      renderWeek(s, weather, marine, fetchedAt);
    } catch (_) { if (n === request) $('#spotWeek').innerHTML = '<p class="spot-week-empty">Prévisions détaillées indisponibles pour le moment. Réessaie avec une connexion.</p>'; }
  }

  function openImmersion(s) { if(window.OceanVoyage)window.OceanVoyage.open(s);else window.OceanGallery?.open(s,0,{immersive:true}); }

  function update(s, act) {
    activeSpot=s;activeAct=act;ensureExperiencePanel();
    const hasPhoto=!!photo(s),btn=$('#dImmersionBtn'),panel=$('#spotVideoPanel');
    if(btn){btn.hidden=false;btn.disabled=false;btn.onclick=()=>openImmersion(s);}
    if(panel){panel.hidden=false;panel.innerHTML=videoPanel(s,act);panel.querySelector('[data-experience-open]')?.addEventListener('click',()=>openImmersion(s));panel.querySelector('[data-experience-explore]')?.addEventListener('click',()=>window.OceanVoyage?.open(s,{explore:true}));}
    updateAreaMap(s);
    drawSafety(s,window.LIVE?.[s.id]);loadWeek(s,act);
  }
  function refreshConditions(s, live, marine) { if (activeSpot?.id !== s.id) return; drawSafety(s, live, marine); }
  window.OceanExperience = {init, update, refreshConditions};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
