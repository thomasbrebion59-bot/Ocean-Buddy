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
  const direction = deg => deg == null || Number.isNaN(+deg) ? '—' : ((window.OB_I18N&&/^en/.test(OB_I18N.lang||''))?['N','NE','E','SE','S','SW','W','NW']:['N','NE','E','SE','S','SO','O','NO'])[Math.round(+deg / 45) % 8];
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
    return `<div class="experience-heading"><span><small>LE SPOT EN IMAGES</small><b>Photos du spot</b></span><i>${count?(count>1?`${count} photos locales`:`${count} photo locale`):'Aucune photo locale'}</i></div><button type="button" class="experience-photo-open ${image?'':'no-image'}" data-experience-open>${image?`<img src="${esc(image.thumb||image.src)}"${window.OceanPhotos?.sharp?.(image,'400px')||''} alt="" loading="lazy" decoding="async">`:'<span class="experience-photo-symbol" aria-hidden="true">◎</span>'}<span><b>${image?`Les photos de ${esc(s.name)}`:`Découvrir ${esc(s.name)} en images`}</b><small>${image?'Photos créditées. Tu peux en chercher d’autres.':'Aucune photo locale. Cherche des photos libres, avec leurs crédits.'}</small><strong>${image?'Voir les photos':'Trouver des photos'}</strong></span></button><a class="experience-video-search" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span><span><b>Voir des vidéos du spot</b><small>Ouvre les vidéos proposées sur YouTube, lues seulement si tu les lances.</small></span></a>`;
  }

  /* Carte du secteur : même moteur que la carte des spots, créée quand elle devient visible. */
  let areaMap=null,areaRequest=0;
  function updateAreaMap(s){
    const panel=$('#spotAreaMap');if(!panel)return;
    const copy=panel.querySelector('.area-map-copy'),link=panel.querySelector('[data-area-map-link]'),host=panel.querySelector('[data-area-map]');
    /* Fiche v2 : la carte du secteur reste dans « Le spot » (repli « Photos et carte », ordre posé par replis.css). Elle
       suivait « À découvrir autour », que replis.js range dans Préparer : dès la deuxième fiche ouverte, elle s’y
       retrouvait en grand sous le carnet. */
    const infos=$('#detail .dcat[data-cat="infos"]');if(infos&&panel.parentNode!==infos)infos.append(panel);
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
  /* « Source : {libellé}, consultée le {date} » (même clé de traduction que la fiche pratique). */
  const cite = x => `<a class="safety-tip-source" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">Source : ${esc(x.l)}, consultée le ${esc(x.d.split('-').reverse().join('/'))}</a>`;
  const safetyTips = kind => SAFETY_TIPS[kind] ? `<ul class="safety-tips">${SAFETY_TIPS[kind].map(tip => `<li>${esc(tip.t)}${tip.src.map(cite).join('')}</li>`).join('')}</ul>` : '';

  function drawSafety(s, live, marine) {
    const host = $('#spotSafetyLive'); if (!host) return;
    const kind = safetyKind(s), inland = isInland(s);
    const diagrams = {
      rip: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un courant de retour"><path class="sand" d="M0 98h420v52H0z"/><path class="sea" d="M0 0h420v98H0z"/><path class="arrow" d="M90 105V55m-9 10 9-10 9 10M210 115V45m-9 10 9-10 9 10M330 105V55m-9 10 9-10 9 10"/><path class="safe" d="M25 22h370"/><text x="18" y="18">Courant vers le large</text><text x="142" y="140">Sortir sur le côté, ne pas lutter</text></svg>`,
      reef: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un récif peu profond"><path class="sea" d="M0 0h420v105H0z"/><path class="sand" d="M0 105h420v45H0z"/><path class="reef" d="M45 105q28-40 55 0 28-55 56 0 32-48 62 0 35-60 70 0 26-38 70 0"/><path class="safe" d="M30 28q70 28 140 0t220 0"/><text x="18" y="18">Profondeur variable</text><text x="128" y="140">Garder ses distances</text></svg>`,
      wind: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un vent qui pousse au large"><path class="sand" d="M0 0h95v150H0z"/><path class="sea" d="M95 0h325v150H95z"/><path class="arrow" d="M42 75h210m-18-12 18 12-18 12"/><path class="safe" d="M95 18v114"/><text x="14" y="18">Rive</text><text x="300" y="18">Large</text><text x="128" y="140">Planifier le retour</text></svg>`,
      shore: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’une zone de déferlement"><path class="sand" d="M0 110h420v40H0z"/><path class="sea" d="M0 0h420v110H0z"/><path class="wave" d="M15 78q60-60 120 0t120 0 120 0"/><path class="safe" d="M32 126h356"/><text x="122" y="20">Zone de déferlement</text><text x="130" y="145">Observer avant d’entrer</text></svg>`,
      passe: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un courant de passe"><path class="sea" d="M0 0h420v150H0z"/><path class="sand" d="M0 150v-30q70-12 140 0t140 6 140-10v34z"/><path class="arrow" d="M30 100h270m-17-11 17 11-17 11"/><path class="reef" d="M140 74h0M170 68h0M200 76h0"/><path class="safe" d="M170 62V36"/><path class="wave" d="M170 30h0"/><text x="18" y="18">Sens du courant</text><text x="186" y="34">Bouée en surface</text><text x="30" y="143">Ne lutte pas, reste groupé avec ton guide</text></svg>`,
      riviere: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’une rivière à courant"><path class="sand" d="M0 0h420v26H0zM0 124h420v26H0z"/><path class="sea" d="M0 26h420v98H0z"/><path class="arrow" d="M25 50h120m-16-10 16 10-16 10M25 102h120m-16-10 16 10-16 10"/><path class="safe" d="M190 76l72 48"/><path class="wave" d="M190 76h0"/><path class="reef" d="M280 26l30 56m-22-22 14-4m-4 22 16-6"/><text x="18" y="18">Sens du courant</text><text x="316" y="50">Arbre : évite</text><text x="18" y="143">Ne lutte pas, rejoins la rive en biais</text></svg>`
    };
    const current = live?.current && live.current !== '—' ? live.current : 'Donnée indisponible';
    const updated=Number.isFinite(live?.fetchedAt)?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(live.fetchedAt)):'heure indisponible';
    /* Fiche v2 : un titre en casse de phrase, sans sur-titre en capitales ; l’heure du modèle passe en note dessous. */
    const head = '<h3 class="fx-title fx-title-s" id="spotSafetyLiveTitle">Courants & dangers à vérifier</h3>';
    const figure = kind ? `<div class="safety-diagram">${diagrams[kind]}</div>${safetyTips(kind)}` : '';
    /* Hors mer : ni courant marin, ni variation sur 24 h, ni marée, ni badge de modèle (mesures marines). Sans schéma, pas de carte vide. */
    if (inland) {
      host.hidden = !kind;
      host.innerHTML = kind ? `<div class="safety-live-head">${head}</div>${figure}<p class="safety-disclaimer">Ce schéma est un repère général : il ne remplace ni le balisage, ni les consignes du lieu.</p>` : '';
      return;
    }
    host.hidden = false;
    host.innerHTML = `<div class="safety-live-head">${head}<span class="safety-live-pill">${live?.live?'Modèle reçu le '+esc(updated):'Modèle indisponible'}</span></div>${figure}<div class="safety-readings"><span><b>${esc(current)}</b><small>Courant marin, modèle Open-⁠Meteo</small></span><span><b>${indicativeRange(marine)}</b><small>Variation sur les 24 premières heures du modèle</small></span></div><p class="safety-disclaimer">Les courants Open-Meteo sont une aide de repérage à résolution limitée près des côtes : ils ne remplacent ni le balisage, ni le poste de secours, ni les consignes du spot. Vérifie la marée du jour auprès d’une source locale.</p>`;
  }

  function indicativeRange(marine) {
    const values=marine?.hourly?.sea_level_height_msl?.filter(value=>Number.isFinite(+value)).slice(0,25)||[];
    if(values.length<6)return '—';
    const range=Math.max(...values)-Math.min(...values);
    return `${window.obNum?obNum(range,2):range.toFixed(2)} m`;
  }

  /* ---------- Météo du spot : meilleur créneau, heure par heure (48 h), 7 jours ----------
     Calculs dans spot-weather-model.js ; ici seulement l’affichage. Rendu après l’ouverture de la fiche, jamais pendant. */
  const later = fn => { try { if (window.requestIdleCallback) return requestIdleCallback(fn, {timeout: 400}); } catch (e) {} return setTimeout(fn, 30); };
  const fmt1 = v => (window.obNum ? obNum(v, 1) : (+v).toFixed(1).replace('.', ','));
  const round = v => (v == null ? '—' : String(Math.round(v)));
  const hourFmt = (() => { let f = null; return h => { if (!window.OB_I18N || /^(fr|es)/.test(OB_I18N.lang || 'fr')) return `${h} h`; try { f = f || new Intl.DateTimeFormat((window.OB_I18N && OB_I18N.locale) || 'fr-FR', {hour: 'numeric', timeZone: 'UTC'}); return f.format(Date.UTC(2000, 0, 1, h)); } catch (e) { return h + ' h'; } }; })();
  /* Lever et coucher du soleil, écrits comme les autres heures de l’onglet : « 7 h 37 » en français et en espagnol. */
  const clock = iso => { const m = /T(\d\d):(\d\d)/.exec(String(iso || '')); if (!m) return '—'; if (!window.OB_I18N || /^(fr|es)/.test(OB_I18N.lang || 'fr')) return `${+m[1]} h ${m[2]}`; try { return new Intl.DateTimeFormat((window.OB_I18N && OB_I18N.locale) || 'fr-FR', {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'}).format(Date.UTC(2000, 0, 1, +m[1], +m[2])); } catch (e) { return m[1] + ':' + m[2]; } };
  const myLevel = () => {
    try { if (typeof chosenLevel !== 'undefined' && chosenLevel) return chosenLevel; } catch (e) {}
    try { const d = JSON.parse(localStorage.getItem('oceanbuddy_v1') || 'null'); return (d && d.level) || null; } catch (e) { return null; }
  };
  /* Flèche de direction : une donnée (d’où vient le vent ou la houle), pas une décoration. */
  const arrow = (deg, label) => { const W = window.SpotWeatherModel, r = W && W.toward(deg); if (r == null) return ''; return `<i class="wx-dir" role="img" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 12 12" aria-hidden="true" style="transform:rotate(${Math.round(r)}deg)"><path d="M6 10.5V2M2.6 5.2 6 1.6l3.4 3.6"/></svg></i>`; };
  const windFrom = deg => arrow(deg, `Vent de ${direction(deg)}`);
  const swellFrom = deg => arrow(deg, `Houle de ${direction(deg)}`);
  const SKY_LABEL = {clear: 'Ciel dégagé', night: 'Nuit claire', partly: 'Peu nuageux', partlyNight: 'Peu nuageux', cloudy: 'Nuageux', fog: 'Brouillard', drizzle: 'Bruine', rain: 'Pluie', snow: 'Neige', storm: 'Orage'};
  const CLOUD = '<path d="M7.5 19h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 19z"/>';
  const SKY_SVG = {
    clear: '<circle class="wx-sun" cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    night: '<path d="M19.5 14.6A7.6 7.6 0 1 1 9.4 4.5a6 6 0 0 0 10.1 10.1z"/>',
    partly: '<circle class="wx-sun" cx="8.6" cy="8.4" r="3.2"/><path d="M8.6 2.6v1.4M3 8.4h1.4M4.6 4.4l1 1M12.6 4.4l-1 1"/><path class="wx-fill" d="M9.3 20h8.4a3.2 3.2 0 0 0 .3-6.4 4.5 4.5 0 0 0-8.6-1A3.7 3.7 0 0 0 9.3 20z"/>',
    partlyNight: '<path d="M12.4 9.6A4.4 4.4 0 0 1 6.6 3.8a4.4 4.4 0 1 0 5.8 5.8z"/><path class="wx-fill" d="M9.3 20h8.4a3.2 3.2 0 0 0 .3-6.4 4.5 4.5 0 0 0-8.6-1A3.7 3.7 0 0 0 9.3 20z"/>',
    cloudy: CLOUD,
    fog: '<path d="M7.5 13h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 13z"/><path d="M5 16.5h14M7.5 20h9"/>',
    drizzle: '<path d="M7.5 15h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 15z"/><path d="M8.5 18.5v.1M12 19.5v.1M15.5 18.5v.1"/>',
    rain: '<path d="M7.5 15h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 15z"/><path d="M8.5 17.5l-1 3M12.5 17.5l-1 3M16.5 17.5l-1 3"/>',
    snow: '<path d="M7.5 15h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 15z"/><path d="M8 18.5h.1M12 20h.1M16 18.5h.1M10 21.5h.1M14 21.5h.1"/>',
    storm: '<path d="M7.5 15h9.6a3.6 3.6 0 0 0 .3-7.2 5.1 5.1 0 0 0-9.8-1.1A4.2 4.2 0 0 0 7.5 15z"/><path d="M12.6 15.5 10.4 19h3l-2 3.5"/>'
  };
  const skyIcon = (code, isDay) => { const W = window.SpotWeatherModel; let k = W && W.sky(code); if (!k) return '<span class="wx-sky">—</span>'; if (isDay === false && k === 'clear') k = 'night'; else if (isDay === false && k === 'partly') k = 'partlyNight'; return `<span class="wx-sky" role="img" aria-label="${esc(SKY_LABEL[k])}" title="${esc(SKY_LABEL[k])}"><svg viewBox="0 0 24 24" aria-hidden="true">${SKY_SVG[k]}</svg></span>`; };
  const dayName = (iso, i) => (i === 1 ? 'Demain' : day(iso, i));

  /* Phrases reprises telles quelles de « Lire les conditions » (spot-data-model.js) quand le vent vient de la terre. */
  const OFFSHORE_TXT = {
    wave: 'Le vent vient de la terre (offshore) : il lisse les vagues, mais il te pousse vers le large. Reste près du bord et ne lâche pas ta planche.',
    other: 'Le vent vient de la terre : il te pousse vers le large et la mer paraît calme près du bord. Reste près du bord et préviens quelqu’un.'
  };
  /* Avertissement de vent de terre d’un créneau (texte entier), ou '' : repris par la carte du créneau (onglet Prévisions)
     et par la ligne « Ton créneau » de l’onglet Conditions (spot-before.js). */
  const cautionOf = r => (r && r.status === 'ok' && r.offshore && (r.kind !== 'wave' || r.level === 'debutant') ? (r.kind === 'wave' ? OFFSHORE_TXT.wave : OFFSHORE_TXT.other) : '');
  /* Fiche v2, onglet Prévisions : le créneau (calculé pour aujourd’hui et demain, les seules journées couvertes heure par
     heure) ne fait plus deux cartes. Le meilleur des deux met sa ligne des 7 jours en avant (jaune soleil), avec ses heures,
     sa qualité et, s’il y a lieu, l’avertissement de vent de terre en entier. Les autres cas tiennent en une note. */
  const slotRange = r => (r.count > 1 ? `de ${hourFmt(+r.start.slice(11, 13))} à ${hourFmt(+r.end.slice(11, 13))}` : hourFmt(+r.start.slice(11, 13)));
  function slotsBlock(s, act, list, nowIso, dates, inland) {
    const W = window.SpotWeatherModel, level = myLevel();
    const rule = W.rule(act, inland, level);
    const note = 'Repère calculé sur une prévision de modèle, avec les seuils de « Lire les conditions » et en heures de jour seulement. Ce n’est pas une consigne : le poste de secours, le balisage et les drapeaux priment.';
    if (!rule.ok) {
      /* Sans niveau : le même bouton court que dans les onglets Conditions et Sécurité (spot-before.js,
         OceanBefore.levelButton), qui ouvre « Mon sport et mon niveau » d’un toucher ; « Ton meilleur jour » dit pourquoi. */
      if (rule.reason === 'level') return {top: window.OceanBefore?.levelButton ? `<p class="fx-level-line"><span class="fx-label">Ton meilleur jour</span>${window.OceanBefore.levelButton()}</p>` : '', best: null, hours: new Set(), rule, today: null, note: '', res: []};
      const why = rule.reason === 'expert' ? 'Niveau expert : « Lire les conditions » ne fixe pas de seuil. Compare toi-même vent, houle et période heure par heure.'
        : 'Pas de créneau calculé pour ce sport ici : « Lire les conditions » ne donne pas de repère chiffré. Renseigne-toi sur place.';
      return {top: `<p class="fx-note fx7-why">${esc(why)}</p>`, best: null, hours: new Set(), rule, today: null, note: '', res: []};
    }
    const res = dates.map((date, i) => ({date, r: W.bestSlot(list, {act, inland, level, date, nowIso: i === 0 ? nowIso : null, catalogWind: s.wind})}));
    const hours = new Set();
    res.forEach(({r}) => { if (r.status === 'ok') list.forEach(x => { if (x.t >= r.start && x.t <= r.end) hours.add(x.t); }); });
    /* Le meilleur : « dans tes repères » avant « possible, sans plus », puis le plus tôt. */
    const ok = res.filter(x => x.r.status === 'ok');
    const best = ok.find(x => x.r.quality === 'good') || ok[0] || null;
    const why = best ? '' : res.some(x => x.r.status === 'nodata') ? 'Prévision incomplète : pas de créneau calculé pour le moment.' : 'Aucun créneau dans tes repères aujourd’hui ni demain.';
    const noLevel = !rule.level ? '<p class="fx-note fx7-why">Sans niveau choisi dans Réglages, le calcul reste prudent.</p>' : '';
    /* Le rappel du calcul suit la ligne « Ton meilleur jour » ; sans meilleur jour, il reste en pied (foot), sous l’heure
       du relevé, pour garder le haut de l’onglet léger. */
    return {top: (why ? `<p class="fx-note fx7-why">${esc(why)}</p>` : '') + noLevel, best, hours, rule, today: res[0] ? res[0].r : null, note, res, foot: best ? '' : note};
  }
  /* Ligne du meilleur jour : le créneau, sa qualité, l’avertissement entier (jamais replié, jamais coupé), puis le rappel
     que le poste de secours, le balisage et les drapeaux priment, juste dessous. L’autre jour calculé (aujourd’hui ou
     demain), s’il a aussi un créneau, garde sa propre ligne sous son jour, avec son avertissement entier s’il en a un :
     ses heures sont surlignées dans « Heure par heure », son vent de terre ne doit jamais disparaître. */
  const SUN_IC = '<svg class="fx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>';
  const quality = r => (r.quality === 'good' ? 'Dans tes repères' : 'Possible, sans plus');
  function bestLine(r, note) {
    const warn = cautionOf(r);
    return `<div class="fx7-best">${SUN_IC}<span class="fx7-best-tx"><span>Ton meilleur jour</span> <b>${esc(slotRange(r))}</b></span><span class="fx7-q">${quality(r)}</span>${warn ? `<p class="fx7-caution">${esc(warn)}</p>` : ''}${note ? `<p class="fx7-calc">${esc(note)}</p>` : ''}</div>`;
  }
  function altLine(r) {
    const warn = cautionOf(r);
    return `<div class="fx7-best fx7-alt"><span aria-hidden="true"></span><span class="fx7-best-tx"><span>Autre créneau</span> <b>${esc(slotRange(r))}</b></span><span class="fx7-q">${quality(r)}</span>${warn ? `<p class="fx7-caution">${esc(warn)}</p>` : ''}</div>`;
  }
  function hoursTable(list, daily, inland, slotHours, utc) {
    if (!list.length) return '<p class="spot-week-empty">Heure par heure indisponible pour le moment.</p>';
    const groups = [];
    list.forEach(x => { const g = groups[groups.length - 1]; if (g && g.date === x.date) g.n++; else groups.push({date: x.date, n: 1}); });
    const dayIdx = d => Math.max(0, daily.findIndex(x => x.date === d));
    const cls = x => [x.isDay === false ? 'is-night' : '', slotHours.has(x.t) ? 'is-slot' : '', x.hour === 0 ? 'is-day0' : ''].filter(Boolean).join(' ');
    const cell = (x, body) => `<td${cls(x) ? ` class="${cls(x)}"` : ''}>${body}</td>`;
    const row = (label, unit, f) => `<tr><th scope="row">${label}${unit ? `<small>${unit}</small>` : ''}</th>${list.map(x => cell(x, f(x))).join('')}</tr>`;
    /* Le lever et le coucher du soleil se lisent dans le détail du jour (7 jours) : la tête ne garde que le nom du jour. */
    const head = `<tr class="wx-days"><td class="wx-corner"></td>${groups.map(g => `<th scope="colgroup" colspan="${g.n}"><span><b>${esc(dayName(g.date, dayIdx(g.date)))}</b></span></th>`).join('')}</tr>`
      + `<tr class="wx-hrow"><th scope="row">Heure</th>${list.map(x => `<th scope="col"${cls(x) ? ` class="${cls(x)}"` : ''}>${esc(hourFmt(x.hour))}</th>`).join('')}</tr>`;
    const body = row('Ciel', '', x => skyIcon(x.code, x.isDay))
      + row('Air', '°C', x => (x.temp == null ? '—' : `${Math.round(x.temp)}°`))
      + row('Vent', 'km/h', x => (x.wind == null ? '—' : `<span class="wx-v">${windFrom(x.windDir)}${Math.round(x.wind)}</span>`))
      + row('Rafales', 'km/h', x => round(x.gust))
      + (inland ? '' : row('Houle', 'm', x => (x.wave == null ? '—' : `<span class="wx-v">${swellFrom(x.waveDir)}${fmt1(x.wave)}</span>`)) + row('Période', 's', x => round(x.period)))
      + row('Pluie', '%', x => `${x.pop == null ? '—' : Math.round(x.pop)}${x.rain != null && x.rain >= 0.1 ? `<small>${fmt1(x.rain)} mm</small>` : ''}`);
    /* Les heures surlignées sont celles de chaque créneau calculé : « Tes créneaux » quand aujourd’hui et demain en ont un. */
    const slotDays = new Set([...slotHours].map(t => t.slice(0, 10))).size;
    return `<div class="wx-scroll" tabindex="0" role="region" aria-label="Météo heure par heure"><table class="wx-table">${head}${body}</table></div><p class="wx-legend"><span><i class="is-night" aria-hidden="true"></i>Nuit</span>${slotHours.size ? `<span><i class="is-slot" aria-hidden="true"></i>${slotDays > 1 ? 'Tes créneaux' : 'Ton meilleur créneau'}</span>` : ''}<span>${inland ? 'Flèche : sens où va le vent' : 'Flèche : sens où vont le vent et la houle'}</span>${utc ? `<span>Heures locales du spot (${esc(utc)})</span>` : ''}</p>`;
  }
  /* Les 7 jours : une ligne par jour, colonnes alignées et chiffres tabulaires (jour, ciel, air, houle, période, vent avec
     sa direction). Sur un plan d’eau, ni houle ni période : les deux colonnes disparaissent (classe is-inland). Toucher
     la ligne ouvre le détail secondaire du jour (rafales, pluie, UV, lever et coucher du soleil). */
  function weekRows(daily, inland, slots) {
    const best = slots.best, alt = new Map((slots.res || []).filter(x => x.r.status === 'ok' && x !== best).map(x => [x.date, x.r]));
    const v = (x, f) => (x == null ? '—' : f(x));
    const head = `<div class="fx7-head" aria-hidden="true"><span></span><span></span><span>Air</span>${inland ? '' : '<span>Houle</span><span>Période</span>'}<span>Vent</span></div>`;
    const rows = daily.map((d, i) => {
      const id = `fx7Day${i}`, top = best && best.date === d.date;
      const more = [['Rafales', v(d.gust, g => Math.round(g) + ' km/h')], ['Pluie', v(d.pop, p => Math.round(p) + ' %')], ['UV', v(d.uv, u => String(Math.round(u)))], ['Lever', clock(d.sunrise)], ['Coucher', clock(d.sunset)]];
      const wind = d.wind == null ? '—' : `${Math.round(d.wind)} km/h<small>${esc(direction(d.windDir))}</small>`;
      return `<li class="fx7-row${top ? ' is-best' : ''}"><button type="button" class="fx7-btn" aria-expanded="false" aria-controls="${id}">`
        + `<span class="fx7-day">${esc(dayName(d.date, i))}</span>${skyIcon(d.code, true)}<span class="fx7-c">${v(d.tmax, t => Math.round(t) + '°')}</span>`
        + (inland ? '' : `<span class="fx7-c fx7-wave">${v(d.wave, w => fmt1(w) + ' m')}</span><span class="fx7-c">${v(d.period, p => Math.round(p) + ' s')}</span>`)
        + `<span class="fx7-c fx7-wind">${wind}</span></button>`
        + (top ? bestLine(best.r, slots.note) : alt.has(d.date) ? altLine(alt.get(d.date)) : '')
        + `<dl class="fx7-more" id="${id}" hidden>${more.map(([k, x]) => `<div><dt>${k}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl></li>`;
    }).join('');
    return `<div class="fx7${inland ? ' is-inland' : ''}">${head}<ol class="fx7-list">${rows}</ol></div>`;
  }
  /* Un toucher sur un jour ouvre ou ferme son détail (un seul ouvert à la fois). */
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('#spotWeek .fx7-btn'); if (!btn) return;
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.closest('.fx7-list')?.querySelectorAll('.fx7-btn[aria-expanded="true"]').forEach(o => { if (o !== btn) { o.setAttribute('aria-expanded', 'false'); const p = document.getElementById(o.getAttribute('aria-controls')); if (p) p.hidden = true; } });
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const panel = document.getElementById(btn.getAttribute('aria-controls')); if (panel) panel.hidden = !open;
  });

  /* Une carte légère par jour (onglet Conditions) : la houle et le vent, ou l’air et le vent sur un plan d’eau. */
  const DAY_IC = {
    wave: '<path d="M2 17c2 0 3-1.6 5-1.6S10 17 12 17s3-1.6 5-1.6S20 17 22 17"/><path d="M3 12.4c2.2-4.4 6.6-6.2 10.8-4.8-2 .6-3.1 2.4-2.6 4.8"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 13.5h15.5a3 3 0 1 1-3 3M3 18h6"/>',
    air: '<path d="M10 13.6V5a2 2 0 1 1 4 0v8.6a4 4 0 1 1-4 0z"/><path d="M12 9.5v6"/>'
  };
  const dayIc = k => `<svg class="fx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DAY_IC[k]}</svg>`;
  /* Les trois prochains jours : chacun bascule la scène illustrée au-dessus (sceneHTML, paintScene). Chaque carte montre
     le maximum du jour (c’est écrit juste au-dessus des cartes). Aujourd’hui, ce maximum n’est jamais plus bas que le
     relevé du moment (todayMax) : la scène peut dire « 2,4 m maintenant, jusqu’à 3,5 m aujourd’hui » sans se contredire. */
  function nextDay(d, i, inland) {
    const first = inland ? `<span class="fx-day-row">${dayIc('air')}<span data-day-v="air">${d.tmax != null ? Math.round(d.tmax) + '°' : '—'}</span></span>`
      : `<span class="fx-day-row">${dayIc('wave')}<span data-day-v="wave">${d.wave != null ? fmt1(d.wave) + ' m' : '—'}</span></span>`;
    return `<button type="button" class="fx-day${i === 0 ? ' is-today' : ''}" data-scene-day="${i}" aria-pressed="${i === 0}"><b>${esc(dayName(d.date, i))}</b>${first}<span class="fx-day-row">${dayIc('wind')}<span data-day-v="wind">${d.wind != null ? Math.round(d.wind) + ' km/h' : '—'}</span></span></button>`;
  }
  const hi = (a, b) => (a == null ? b : b == null ? a : Math.max(+a, +b));
  /* Maximum d’aujourd’hui : celui de la prévision, relevé au niveau du relevé du moment s’il le dépasse. */
  const todayMax = (d, now) => (now ? Object.assign({}, d, {wave: hi(d.wave, now.wave), wind: hi(d.wind, now.wind), tmax: hi(d.tmax, now.tmax)}) : d);
  function paintToday(host, d, now, inland) {
    const card = host && host.querySelector('[data-scene-day="0"]'); if (!card || !d) return;
    const m = todayMax(d, now), put = (k, t) => { const el = card.querySelector(`[data-day-v="${k}"]`); if (el && el.textContent !== t) el.textContent = t; };
    if (inland) put('air', m.tmax != null ? Math.round(m.tmax) + '°' : '—'); else put('wave', m.wave != null ? fmt1(m.wave) + ' m' : '—');
    put('wind', m.wind != null ? Math.round(m.wind) + ' km/h' : '—');
  }

  /* ---------- Scène illustrée de Conditions (20 nov., reprise le 23 nov.) ----------
     Une vague vue de côté, le sable à gauche, la mer à droite, et les chiffres du jour choisi posés sur le ciel. Données :
     uniquement les prévisions du jour déjà affichées (W.days : houle et période maximales, vent maximal, direction
     dominante) et, pour aujourd’hui, le relevé du moment. La vague, tournée vers la plage, a trois tailles (petite,
     moyenne, grosse) et grandit avec la houle ; une mer presque plate (moins de 0,4 m) est dessinée plate. Les lignes de
     houle avancent d’une longueur d’onde par période réelle, la vague et son écume respirent au même rythme. Les traits
     de vent vont de la terre vers la mer (vent de terre) ou l’inverse (vent de mer) seulement quand le catalogue donne
     le sens offshore du spot (SpotDataModel.windSide) ; sinon ils ne vont dans aucun sens. Rien ne bouge hors écran
     (IntersectionObserver) ni en mouvement réduit (fiche.css). */
  const waveSize = h => (h == null ? 's' : h < 0.4 ? 'xs' : h < 0.8 ? 's' : h < 2 ? 'm' : 'l');
  /* Échelle de la vague dans sa taille : 0,4 m = 0,44 ; 2 m = 0,76 ; 3,2 m et plus = 1. */
  const waveScale = h => (h == null ? 0.5 : Math.min(1, Math.max(0.42, 0.36 + 0.2 * h)));
  const windSideOf = (deg, s) => { try { return window.SpotDataModel?.windSide?.(deg, s && s.wind) || null; } catch (e) { return null; } };
  const SIDE_LABEL = { offshore: 'Vent de terre', onshore: 'Vent de mer', cross: 'Vent de côté' };
  /* Le dessin : des calques empilés dans un cadre au format fixe (400 × 290), tous vectoriels (nets à toute densité
     d’écran). Chaque calque qui bouge est un élément à part, déplacé par transform ou opacity seulement : le navigateur
     le compose sans redessiner la scène. L’eau et le sable ont leurs couleurs d’illustration (la même mer quel que soit
     le sport choisi), le ciel suit le thème pour que les chiffres posés dessus restent lisibles. */
  function sceneArt() {
    const tile = x => `<path d="M${x + 10} 187 q18 -3 36 0" stroke-width="1.4"/><path d="M${x + 84} 199 q28 -4 56 0" stroke-width="2"/><path d="M${x + 16} 215 q40 -5 80 0" stroke-width="2.6"/>`;
    const tiles = [0, 160, 320, 480].map(tile).join('');
    return `<div class="sc-stage" aria-hidden="true">
      <svg class="sc-layer sc-back" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false">
        <defs>
          <linearGradient id="scSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c8198"/><stop offset=".45" stop-color="#3a9cab"/><stop offset="1" stop-color="#74c6bf"/></linearGradient>
          <linearGradient id="scFace" x1=".15" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#a9e2d9"/><stop offset=".3" stop-color="#46adae"/><stop offset=".7" stop-color="#1d778b"/><stop offset="1" stop-color="#0f5068"/></linearGradient>
          <linearGradient id="scTube" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#0b3d54"/><stop offset="1" stop-color="#1b6f84"/></linearGradient>
          <linearGradient id="scSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e0ad"/><stop offset="1" stop-color="#e7bd77"/></linearGradient>
          <linearGradient id="scHaze" x1="0" y1="0" x2="0" y2="1"><stop class="sc-haze-0" offset="0"/><stop class="sc-haze-1" offset="1"/></linearGradient>
          <radialGradient id="scGlow"><stop class="sc-glow-0" offset="0"/><stop class="sc-glow-1" offset="1"/></radialGradient>
          <linearGradient id="scShallow" x1="0" y1="1" x2=".7" y2="0"><stop offset="0" stop-color="#bfeadf" stop-opacity=".9"/><stop offset="1" stop-color="#8fd6cd" stop-opacity="0"/></linearGradient>
        </defs>
        <rect class="sc-sky" x="-40" y="-40" width="480" height="218"/>
        <rect x="-40" y="96" width="480" height="82" fill="url(#scHaze)"/>
        <circle cx="104" cy="170" r="46" fill="url(#scGlow)"/>
        <circle class="sc-sun" cx="104" cy="171" r="16"/>
        <rect class="sc-far" x="-40" y="176" width="480" height="120" fill="url(#scSea)"/>
        <path d="M-40 176.6 H440" stroke="#d8f1ec" stroke-width="1.2" opacity=".55"/>
        <path d="M-40 236 C40 214 150 226 230 296 H-40Z" fill="url(#scShallow)"/>
        <g class="sc-glint" fill="none" stroke="#ffe9bd" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path d="M93 183 H115"/><path d="M86 190 H108"/><path d="M100 197 H124"/><path d="M90 205 H104"/><path d="M96 213 H128"/></g>
      </svg>
      <svg class="sc-layer sc-swell" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false"><g class="sc-lines" fill="none" stroke="#d9f2ee" stroke-linecap="round" opacity=".62">${tiles}</g></svg>
      <svg class="sc-layer sc-front" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false">
        <path class="sc-sand" d="M-40 232 C40 224 104 236 146 254 C174 266 198 281 214 296 H-40Z" fill="url(#scSand)"/>
        <path class="sc-wet" d="M66 234 C106 239 142 251 172 267 C190 277 204 287 212 296 H190 C176 284 152 268 124 256 C102 246 80 239 66 234Z" fill="#c9995a" opacity=".42"/>
        <g fill="#d8a968" opacity=".7"><circle cx="34" cy="252" r="1.6"/><circle cx="62" cy="266" r="1.3"/><circle cx="22" cy="276" r="1.5"/><circle cx="92" cy="278" r="1.4"/><circle cx="118" cy="284" r="1.2"/><circle cx="48" cy="284" r="1.3"/></g>
      </svg>
      <div class="sc-wave">
        <svg class="sc-layer sc-wave-move" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false">
          <path class="sc-face" d="M440 296 V206 C404 190 366 170 326 164 C290 159 256 166 236 184 C225 194 220 208 226 220 C232 206 248 198 264 202 C284 208 294 232 288 256 C284 272 276 286 268 296 Z" fill="url(#scFace)"/>
          <g fill="none" stroke="#c6efe6" stroke-linecap="round"><path d="M306 292 C322 254 332 216 324 180" stroke-width="3" opacity=".24"/><path d="M340 292 C358 258 368 226 362 196" stroke-width="2.6" opacity=".17"/><path d="M376 292 C392 266 400 244 398 222" stroke-width="2.2" opacity=".12"/></g>
          <path class="sc-tube" d="M229 218 C237 205 253 200 267 205 C285 212 290 236 284 256 C281 270 275 284 268 296 H244 C254 276 258 254 252 240 C247 229 238 221 229 218 Z" fill="url(#scTube)"/>
          <path d="M322 171 C292 166 262 172 244 189" fill="none" stroke="#0e4c63" stroke-width="3" stroke-linecap="round" opacity=".32"/>
          <path class="sc-lip" d="M440 205 C404 189 366 169 326 163 C290 158 256 165 235 184" fill="none" stroke="#f5fcfa" stroke-width="3.4" stroke-linecap="round"/>
          <path class="sc-curtain" d="M235 184 C224 194 219 208 225 221" fill="none" stroke="#e9f7f5" stroke-width="6" stroke-linecap="round" opacity=".94"/>
          <g class="sc-spray" fill="#fbfefd"><circle cx="241" cy="176" r="3"/><circle cx="252" cy="168" r="2.2"/><circle cx="264" cy="161" r="1.8"/><circle cx="278" cy="156" r="2.4"/><circle cx="294" cy="152" r="1.6"/><circle cx="308" cy="154" r="2"/><circle cx="286" cy="147" r="1.2"/><circle cx="270" cy="151" r="1.3"/></g>
        </svg>
        <svg class="sc-layer sc-foam" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false">
          <path class="sc-white" d="M150 296 C160 274 180 260 200 256 C206 241 218 233 230 237 C244 233 256 243 256 257 C266 263 271 278 268 296 Z" fill="#f6fcfb"/>
          <path d="M172 296 C182 280 197 270 213 270 C229 268 245 277 252 296 Z" fill="#cdeae5" opacity=".85"/>
          <g fill="#fbfefd"><circle cx="196" cy="251" r="7.5"/><circle cx="212" cy="239" r="8.5"/><circle cx="227" cy="229" r="7.5"/><circle cx="241" cy="241" r="7"/><circle cx="184" cy="263" r="6.5"/><circle cx="170" cy="276" r="5.5"/><circle cx="224" cy="217" r="4.2"/><circle cx="213" cy="224" r="3"/><circle cx="158" cy="286" r="4.2"/></g>
          <g fill="#fbfefd" opacity=".9"><circle cx="176" cy="245" r="2"/><circle cx="188" cy="234" r="1.6"/><circle cx="164" cy="259" r="1.8"/><circle cx="200" cy="226" r="2"/><circle cx="150" cy="272" r="1.4"/></g>
        </svg>
      </div>
      <svg class="sc-layer sc-wash" viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" focusable="false"><path d="M88 235 C130 243 167 260 201 289 C170 266 132 249 88 235Z M90 236 C130 244 166 261 200 288" fill="#fbfefd" stroke="#fbfefd" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M112 247 C138 254 160 266 180 281" fill="none" stroke="#fbfefd" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>
      <span class="sc-wind"><i></i><i></i><i></i><i></i></span>
    </div>`;
  }
  function sceneHTML(daily, inland) {
    if (!daily.length) return '';
    return `<div class="fx-scene" data-scene data-inland="${inland ? 1 : 0}">${sceneArt()}<div class="sc-now" aria-live="polite"></div></div>`;
  }
  /* Aujourd’hui : le relevé du moment (le même que « Maintenant », LIVE d’app.js) quand il est là, pour ne pas montrer
     deux chiffres différents pour la même chose ; les autres jours, le maximum du jour. */
  function nowOf(s, inland) {
    let l = null; try { l = typeof LIVE !== 'undefined' && s ? LIVE[s.id] : null; } catch (e) {}
    if (!l || !l.live || l.windK == null) return null;
    if (inland ? l.airC == null : l.waveM == null) return null;
    return {wave: l.waveM, period: l.periodS, wind: l.windK, windDir: l.windDeg, tmax: l.airC};
  }
  function paintScene(host, d, i, s, inland) {
    const sc = host && host.querySelector('[data-scene]'); if (!sc || !d) return;
    const now = i === 0 ? nowOf(s, inland) : null;
    /* Le maximum d’aujourd’hui (carte « Aujourd’hui ») : dit sous le relevé du moment quand il est plus haut. */
    const top = i === 0 ? todayMax(d, now) : null;
    if (i === 0) paintToday(host, d, now, inland);
    if (now) d = Object.assign({}, d, now);
    const h = inland ? null : d.wave, per = Number.isFinite(+d.period) && +d.period > 0 ? +d.period : null;
    sc.dataset.size = inland ? 'flat' : waveSize(h);
    sc.style.setProperty('--sc-k', waveScale(h).toFixed(2));
    sc.style.setProperty('--sc-period', (per ? Math.min(18, Math.max(5, per)) : 10) + 's');
    const w = d.wind != null ? Math.round(d.wind) : null;
    sc.style.setProperty('--sc-wind', (w == null ? 4 : Math.max(1.4, 5.5 - w / 9)).toFixed(2) + 's');
    const side = windSideOf(d.windDir, s);
    sc.dataset.side = side === 'offshore' ? 'land' : side === 'onshore' ? 'sea' : 'none';
    /* Pas de flèche de boussole dans la scène : elle n’est pas une carte (la plage est à gauche quel que soit le spot),
       une flèche « vers l’est » y contredisait les traits de vent. La direction reste écrite (« O »), le sens terre ou mer
       est dit en toutes lettres et montré par les traits. */
    const arrow = '';
    const upTo = (shown, max, unit) => (now && max != null && shown !== max ? `<span class="sc-sub sc-max">${esc(`jusqu’à ${max} ${unit} aujourd’hui`)}</span>` : '');
    const airNow = d.tmax != null ? String(Math.round(d.tmax)) : '—', waveNow = h != null ? fmt1(h) : '—';
    const first = inland
      ? `<div class="sc-read"><span class="sc-lab">${now ? 'Air' : 'Air, au plus chaud'}</span><span class="sc-val"><b class="fx-num">${airNow}</b><span class="fx-unit">°C</span></span>${upTo(airNow, top && top.tmax != null ? String(Math.round(top.tmax)) : null, '°C')}</div>`
      : `<div class="sc-read"><span class="sc-lab">${now ? 'Houle' : 'Houle, au plus haut'}</span><span class="sc-val"><b class="fx-num">${waveNow}</b><span class="fx-unit">m</span></span>${per ? `<span class="sc-sub">${esc(`une vague toutes les ${Math.round(per)} s`)}</span>` : ''}${upTo(waveNow, top && top.wave != null ? fmt1(top.wave) : null, 'm')}</div>`;
    const wind = `<div class="sc-read sc-read-wind"><span class="sc-lab">${now ? 'Vent' : 'Vent, au plus fort'}</span><span class="sc-val"><b class="fx-num">${w != null ? w : '—'}</b><span class="fx-unit">km/h</span>${arrow}<span class="fx-unit">${esc(direction(d.windDir))}</span></span>${side ? `<span class="sc-sub">${esc(SIDE_LABEL[side])}</span>` : ''}${upTo(w != null ? String(w) : '—', top && top.wind != null ? String(Math.round(top.wind)) : null, 'km/h')}</div>`;
    sc.dataset.now = now ? '1' : '0';
    sc.querySelector('.sc-now').innerHTML = `<span class="sc-day">${esc(now ? 'Maintenant' : dayName(d.date, i))}</span>${first}${wind}`;
    host.querySelectorAll('[data-scene-day]').forEach(b => { const on = +b.dataset.sceneDay === i; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-on', on); });
    watchScene(sc);
  }
  let sceneIO = null;
  function watchScene(sc) {
    if (!('IntersectionObserver' in window)) { sc.classList.add('is-live'); return; }
    if (!sceneIO) sceneIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting)), { threshold: 0.05 });
    if (sc.dataset.watched) return; sc.dataset.watched = '1'; sceneIO.observe(sc);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest?.('#spotWeek [data-scene-day]'); if (!b || !shown) return;
    const inland = isInland(shown.s), W = window.SpotWeatherModel, daily = W ? W.days(shown.weather, shown.marine, {inland}) : [];
    const i = +b.dataset.sceneDay; if (daily[i]) paintScene($('#spotWeek'), daily[i], i, shown.s, inland);
  });

  let shown = null;
  function renderWeek(s, weather, marine, fetchedAt) {
    const host = $('#spotWeek'); if (!host) return;
    const W = window.SpotWeatherModel;
    shown = {s, weather, marine, fetchedAt};
    const inland = isInland(s);
    const daily = W ? W.days(weather, marine, {inland}) : [];
    const toBefore = (rule, today) => { try { window.OceanBefore?.slot(s, rule, today, hourFmt, cautionOf(today)); } catch (e) {} };
    if (!W || !daily.length) { host.innerHTML = '<p class="spot-week-empty">Les prévisions détaillées se chargeront dès que le modèle répondra.</p>'; toBefore(null); return; }
    const off = weather && weather.utc_offset_seconds, nowIso = W.localHourIso(off);
    const all = W.hours(weather, marine, {inland}), next = inland ? W.upcoming(all, nowIso, 48) : W.trimMarine(W.upcoming(all, nowIso, 48));
    const today = nowIso.slice(0, 10), tomorrow = (daily.find(d => d.date > today) || {}).date;
    const slots = slotsBlock(s, activeAct, all, nowIso, [today, tomorrow].filter(Boolean), inland);
    /* Ligne « Ton créneau » de l’onglet Conditions : le créneau d’aujourd’hui déjà calculé ici, sans nouvel appel. */
    toBefore(slots.rule, slots.today);
    /* Heure du relevé : la même phrase que « Maintenant » (« Relevé à 16 h 33 », ou la date si ce n’est pas aujourd’hui). */
    const updated = (fetchedAt && window.OceanBefore?.stamp?.(fetchedAt)) || (fetchedAt ? `Relevé ${new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short'}).format(new Date(fetchedAt))}` : 'Relevé : heure non disponible');
    const gap = W.tzGap(off);
    const utc = (() => { const a = Math.abs(+off || 0), h = Math.floor(a / 3600), m = Math.round(a % 3600 / 60); return `UTC${off < 0 ? '−' : '+'}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`; })();
    /* Fiche v2 : le même bloc sert deux onglets (data-fx-view, lu par fiche.css). « Conditions » montre les trois
       prochains jours et un lien ; « Prévisions » montre les 7 jours (meilleur créneau mis en avant) et l’heure par heure,
       puis l’heure du relevé et les sources en note. */
    host.innerHTML = `<div class="fx-scene-wrap" data-fx-view="now">${sceneHTML(daily, inland)}</div><div class="fx-next" data-fx-view="now"><h3 class="fx-title fx-title-s">Les prochains jours</h3><p class="fx-note fx-days-note">Le maximum de chaque jour. Touche un jour pour le voir.</p><div class="fx-days">${daily.slice(0, 3).map((d, i) => nextDay(d, i, inland)).join('')}</div><button type="button" class="fx-more" data-fx-tab="previsions">Toutes les prévisions</button></div>`
      + `<div class="wx-block wx-week" data-fx-view="forecast"><h3 class="fx-title">Les 7 jours</h3>${slots.top}${weekRows(daily, inland, slots)}<p class="fx-note fx7-hint">Touche un jour pour voir les rafales, la pluie, l’UV et le soleil.</p></div>`
      + `<div class="wx-block wx-hours" data-fx-view="forecast"><h3 class="fx-title">Heure par heure</h3>${hoursTable(next, daily, inland, slots.hours, gap ? utc : '')}</div>`
      + `<p class="fx-note fx7-stamp" data-fx-view="forecast">${esc(updated)}</p>`
      + (slots.foot ? `<p class="fx-note fx7-stamp" data-fx-view="forecast">${esc(slots.foot)}</p>` : '')
      + `<p class="spot-week-note"><span class="wx-stamp-note">Valeurs de modèle, indicatives, gardées une heure.</span>${inland ? '' : ' <span class="wx-stamp-note">Près des côtes, la précision des vagues est limitée. Pour la marée, consulte l’annuaire local.</span>'}</p>`
      + '<p class="wx-source"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Prévisions Open-Meteo (CC BY 4.0)</a></p>';
    try { paintScene(host, daily[0], 0, s, inland); } catch (e) {}
  }

  function isInland(s) { return typeof window.isInland === 'function' ? window.isInland(s) : ['lake', 'inland'].includes(s?.waterType); }
  /* Un appel prévision + un appel marine (heure par heure sur 48 h et 7 jours), gardés une heure et partagés entre ouvertures simultanées.
     Open-meteo répond parfois 503 : la prévision refusée (statut d’erreur, réseau coupé) est redemandée UNE fois, quelques
     secondes plus tard (SpotWeatherModel.retrier), et « Chargement… » reste affiché entre-temps ; ce qui est déjà reçu est gardé.
     Si rien n’arrive : « Prévision indisponible pour le moment » et « Réessayer » dans le même cadre que le chargement (même
     hauteur), « Indisponible » et « Réessayer » dans la case « Ton créneau ». Un toucher = un essai, jamais deux à la fois.
     La houle reste facultative (sans elle, la semaine s’affiche sans vagues, comme avant). La fiche reste utilisable. */
  const WEEK_LOADING = '<div class="spot-week-loading"><i></i><span>Chargement de la météo du spot…</span></div>';
  const WEEK_FAILED = '<div class="spot-week-loading is-failed"><span>Prévision indisponible pour le moment</span><button type="button" class="ob-retry" data-weather-retry="week">Réessayer</button></div>';
  let weekTry = null;
  const HOURLY = 'temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation,precipitation_probability,is_day';
  const DAILY = 'temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,weather_code,sunrise,sunset';
  function loadWeek(s, act) {
    const host = $('#spotWeek');
    const c = typeof COORDS !== 'undefined' ? COORDS[s.id] : null;
    if (weekTry) weekTry.stop();
    weekTry = null;
    if (!c) { if (host) host.innerHTML = '<p class="spot-week-empty">Position non vérifiée : aucune prévision affichée pour ce spot.</p>'; return; }
    const key = `${s.id}:${new Date().toISOString().slice(0,10)}`;
    const n = ++request;
    const stored = cache.get(key);
    if (stored && Date.now() - stored.fetchedAt < 60*60*1000) { later(() => { if (n === request && activeSpot?.id === s.id) renderWeek(s, stored.weather, stored.marine, stored.fetchedAt); }); return; }
    if (host) host.innerHTML = WEEK_LOADING;
    const inland = isInland(s);
    const weatherUrl = `${api}?latitude=${c.lat}&longitude=${c.lon}&hourly=${HOURLY}&forecast_hours=48&daily=${DAILY}&wind_speed_unit=kmh&cell_selection=${inland ? 'land' : 'sea'}&forecast_days=7&timezone=auto`;
    const marineUrl = `${marineApi}?latitude=${c.lat}&longitude=${c.lon}&hourly=wave_height,wave_period,wave_direction&past_hours=1&forecast_hours=49&daily=wave_height_max,wave_period_max&forecast_days=7&timezone=auto&cell_selection=sea`;
    const getJson = async url => { const response = await fetch(url); if (!response.ok) throw Error(`Prévision HTTP ${response.status}`); return response.json(); };
    const got = {};
    const part = (k, url) => got[k] ? Promise.resolve(got[k]) : getJson(url).then(d => (got[k] = d));
    const attempt = () => {
      if (!pending.has(key)) pending.set(key, Promise.all([part('w', weatherUrl), inland ? Promise.resolve({}) : part('m', marineUrl).catch(() => ({}))])
        .then(([weather, marine]) => { const result = {weather, marine, fetchedAt: Date.now()}; cache.set(key, result); return result; })
        .finally(() => pending.delete(key)));
      return pending.get(key);
    };
    const mine = () => n === request && activeSpot?.id === s.id;
    const failed = () => { try { window.OceanBefore?.slot(s, null); } catch (e) {} const h = $('#spotWeek'); if (h) h.innerHTML = '<p class="spot-week-empty">Prévision indisponible pour le moment</p>'; };
    const W = window.SpotWeatherModel;
    if (!W || !W.retrier) { attempt().then(r => { if (mine()) later(() => { if (mine()) renderWeek(s, r.weather, r.marine, r.fetchedAt); }); }, () => { if (mine()) failed(); }); return; }
    const tryer = weekTry = W.retrier(attempt, (state, r) => {
      if (weekTry !== tryer || !mine()) return;
      const h = $('#spotWeek');
      if (state === 'ok') later(() => { if (mine()) renderWeek(s, r.weather, r.marine, r.fetchedAt); });
      else if (state === 'busy') { if (h && h.querySelector('[data-weather-retry]')) h.innerHTML = WEEK_LOADING; try { window.OceanBefore?.wait(s, 'slot'); } catch (e) {} }
      else if (state === 'failed') { if (h) h.innerHTML = WEEK_FAILED; try { window.OceanBefore?.retry(s, 'slot', 'week'); } catch (e) {} }
    });
    tryer.start();
  }
  document.addEventListener('click', e => { if (e.target.closest?.('[data-weather-retry="week"]') && weekTry) weekTry.again(); });
  /* Niveau changé dans Réglages : le créneau suit, sans nouvel appel. */
  document.addEventListener('ocean:level', () => { try { if (shown && activeSpot?.id === shown.s.id) renderWeek(shown.s, shown.weather, shown.marine, shown.fetchedAt); } catch (e) {} });

  function openImmersion(s) { if(window.OceanVoyage)window.OceanVoyage.open(s);else window.OceanGallery?.open(s,0,{immersive:true}); }

  function update(s, act) {
    activeSpot=s;activeAct=act;ensureExperiencePanel();
    const hasPhoto=!!photo(s),btn=$('#dImmersionBtn'),panel=$('#spotVideoPanel');
    /* Une seule entrée vers l’immersion : la bannière « Vis … » (ocean-home.js), posée juste avant ce panneau.
       Le bouton « Mode immersion » du haut reste masqué ; ici, la photo ouvre la galerie de l’app. */
    if(btn){btn.hidden=true;btn.onclick=null;}
    if(panel){panel.hidden=false;panel.innerHTML=videoPanel(s,act);panel.querySelector('[data-experience-open]')?.addEventListener('click',()=>{if(window.OceanGallery)window.OceanGallery.open(s,0);else openImmersion(s);});}
    updateAreaMap(s);
    drawSafety(s,window.LIVE?.[s.id]);loadWeek(s,act);
  }
  function refreshConditions(s, live, marine) {
    if (activeSpot?.id !== s.id) return; drawSafety(s, live, marine);
    /* Le relevé du moment arrive : la scène d’aujourd’hui passe sur « Maintenant » (sauf si un autre jour est choisi). */
    try {
      const host = $('#spotWeek'), on = host && host.querySelector('[data-scene-day][aria-pressed="true"]');
      if (shown && shown.s.id === s.id) {
        const inland = isInland(s), W = window.SpotWeatherModel, daily = W ? W.days(shown.weather, shown.marine, {inland}) : [];
        /* La carte « Aujourd’hui » suit toujours le relevé ; la scène seulement si elle montre aujourd’hui. */
        if (daily[0] && (!on || on.dataset.sceneDay === '0')) paintScene(host, daily[0], 0, s, inland);
        else if (daily[0]) paintToday(host, daily[0], nowOf(s, inland), inland);
      }
    } catch (e) {}
  }
  window.OceanExperience = {init, update, refreshConditions};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
