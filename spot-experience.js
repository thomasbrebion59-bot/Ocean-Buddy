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
    return `<div class="experience-heading"><span><small>LE SPOT EN IMAGES</small><b>Approche-toi du lieu.</b></span><i>${count?(count>1?`${count} photos locales`:`${count} photo locale`):'Aucune photo locale'}</i></div><button type="button" class="experience-photo-open ${image?'':'no-image'}" data-experience-open>${image?`<img src="${esc(image.thumb||image.src)}"${window.OceanPhotos?.sharp?.(image,'400px')||''} alt="" loading="lazy" decoding="async">`:'<span class="experience-photo-symbol" aria-hidden="true">◎</span>'}<span><b>${image?`Les photos de ${esc(s.name)}`:`Découvrir ${esc(s.name)} en images`}</b><small>${image?'Photos créditées. Tu peux en chercher d’autres.':'Aucune photo locale. Cherche des photos libres, avec leurs crédits.'}</small><strong>${image?'Voir les photos':'Trouver des photos'}</strong></span></button><a class="experience-video-search" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span><span><b>Voir des vidéos du spot</b><small>Ouvre les vidéos proposées sur YouTube · lecture à la demande</small></span></a>`;
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

  /* ---------- Météo du spot : meilleur créneau, heure par heure (48 h), 7 jours ----------
     Calculs dans spot-weather-model.js ; ici seulement l’affichage. Rendu après l’ouverture de la fiche, jamais pendant. */
  const later = fn => { try { if (window.requestIdleCallback) return requestIdleCallback(fn, {timeout: 400}); } catch (e) {} return setTimeout(fn, 30); };
  const fmt1 = v => (window.obNum ? obNum(v, 1) : (+v).toFixed(1).replace('.', ','));
  const round = v => (v == null ? '—' : String(Math.round(v)));
  const hourFmt = (() => { let f = null; return h => { if (!window.OB_I18N || /^(fr|es)/.test(OB_I18N.lang || 'fr')) return `${h} h`; try { f = f || new Intl.DateTimeFormat((window.OB_I18N && OB_I18N.locale) || 'fr-FR', {hour: 'numeric', timeZone: 'UTC'}); return f.format(Date.UTC(2000, 0, 1, h)); } catch (e) { return h + ' h'; } }; })();
  const clock = iso => { const m = /T(\d\d):(\d\d)/.exec(String(iso || '')); if (!m) return '—'; try { return new Intl.DateTimeFormat((window.OB_I18N && OB_I18N.locale) || 'fr-FR', {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'}).format(Date.UTC(2000, 0, 1, +m[1], +m[2])); } catch (e) { return m[1] + ':' + m[2]; } };
  const myLevel = () => {
    try { if (typeof chosenLevel !== 'undefined' && chosenLevel) return chosenLevel; } catch (e) {}
    try { const d = JSON.parse(localStorage.getItem('oceanbuddy_v1') || 'null'); return (d && d.level) || null; } catch (e) { return null; }
  };
  const sportName = act => { try { const x = typeof SPORTMAP !== 'undefined' && SPORTMAP[act]; if (x) return String(x.label).replace(/\s*\(.*\)/, ''); } catch (e) {} return act || ''; };
  const levelName = lv => ({debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert'})[lv] || '';
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
  function slotCard(label, r, inland) {
    if (r.status === 'ok') {
      const range = r.count > 1 ? `${hourFmt(+r.start.slice(11, 13))} – ${hourFmt(+r.end.slice(11, 13))}` : hourFmt(+r.start.slice(11, 13));
      const bits = [];
      if (r.wind) bits.push(Math.round(r.wind[0]) === Math.round(r.wind[1]) ? `Vent ${Math.round(r.wind[0])} km/h` : `Vent ${Math.round(r.wind[0])} à ${Math.round(r.wind[1])} km/h`);
      if (r.gust != null) bits.push(`rafales jusqu’à ${Math.round(r.gust)} km/h`);
      if (r.wave && !inland) bits.push(fmt1(r.wave[0]) === fmt1(r.wave[1]) ? `houle ${fmt1(r.wave[0])} m` : `houle ${fmt1(r.wave[0])} à ${fmt1(r.wave[1])} m`);
      const caution = r.offshore && (r.kind !== 'wave' || r.level === 'debutant') ? `<p class="wx-slot-caution">${esc(r.kind === 'wave' ? OFFSHORE_TXT.wave : OFFSHORE_TXT.other)}</p>` : '';
      return `<article class="wx-slot is-${r.quality}"><small>${esc(label)}</small><b>${esc(range)}</b><span class="wx-slot-q">${r.quality === 'good' ? 'Dans tes repères' : 'Possible, sans plus'}</span><p>${bits.map(b => `<span class="wx-bit">${esc(b)}</span>`).join(' · ')}</p>${caution}</article>`;
    }
    const why = r.status === 'night' ? 'Plus d’heure de jour aujourd’hui.' : r.status === 'nodata' ? 'Prévision incomplète pour ce jour.' : 'Aucun créneau dans tes repères ce jour-là.';
    return `<article class="wx-slot is-none"><small>${esc(label)}</small><p>${esc(why)}</p></article>`;
  }
  function slotsBlock(s, act, list, nowIso, dates, inland) {
    const W = window.SpotWeatherModel, level = myLevel();
    const rule = W.rule(act, inland, level);
    const sport = sportName(act), lv = rule.ok && rule.level ? levelName(rule.level) : '';
    const head = `<div class="wx-sub"><h4>Ton meilleur créneau</h4><span>${esc(sport)}${lv ? ` · ${esc(lv)}` : ''}</span></div>`;
    const note = '<p class="wx-note">Repère calculé sur une prévision de modèle, avec les seuils de « Lire les conditions » et en heures de jour seulement. Ce n’est pas une consigne : le poste de secours, le balisage et les drapeaux priment.</p>';
    if (!rule.ok) {
      const why = rule.reason === 'level' ? 'Choisis ton niveau dans Réglages, « Mon sport et mon niveau », pour voir ton meilleur créneau.'
        : rule.reason === 'expert' ? 'Niveau expert : « Lire les conditions » ne fixe pas de seuil. Compare toi-même vent, houle et période heure par heure.'
        : 'Pas de créneau calculé pour ce sport ici : « Lire les conditions » ne donne pas de repère chiffré. Renseigne-toi sur place.';
      /* Sans niveau : la phrase ouvre directement « Mon sport et mon niveau » (spot-before.js, data-open-level). */
      const whyHtml = rule.reason === 'level' ? `<button type="button" class="wx-slot-why wx-level" data-open-level>${esc(why)}</button>` : `<p class="wx-slot-why">${esc(why)}</p>`;
      return {html: `${head}${whyHtml}`, hours: new Set(), rule, today: null};
    }
    const res = dates.map((date, i) => W.bestSlot(list, {act, inland, level, date, nowIso: i === 0 ? nowIso : null, catalogWind: s.wind}));
    const hours = new Set();
    res.forEach(r => { if (r.status === 'ok') list.forEach(x => { if (x.t >= r.start && x.t <= r.end) hours.add(x.t); }); });
    const noLevel = !rule.level ? '<p class="wx-slot-why">Sans niveau choisi dans Réglages, le calcul reste prudent.</p>' : '';
    return {html: `${head}<div class="wx-slots">${res.map((r, i) => slotCard(i === 0 ? 'Aujourd’hui' : 'Demain', r, inland)).join('')}</div>${noLevel}${note}`, hours, rule, today: res[0] || null};
  }
  function hoursTable(list, daily, inland, slotHours) {
    if (!list.length) return '<p class="spot-week-empty">Heure par heure indisponible pour le moment.</p>';
    const sun = new Map(daily.map(d => [d.date, d]));
    const groups = [];
    list.forEach(x => { const g = groups[groups.length - 1]; if (g && g.date === x.date) g.n++; else groups.push({date: x.date, n: 1}); });
    const dayIdx = d => Math.max(0, daily.findIndex(x => x.date === d));
    const cls = x => [x.isDay === false ? 'is-night' : '', slotHours.has(x.t) ? 'is-slot' : '', x.hour === 0 ? 'is-day0' : ''].filter(Boolean).join(' ');
    const cell = (x, body) => `<td${cls(x) ? ` class="${cls(x)}"` : ''}>${body}</td>`;
    const row = (label, unit, f) => `<tr><th scope="row">${label}${unit ? `<small>${unit}</small>` : ''}</th>${list.map(x => cell(x, f(x))).join('')}</tr>`;
    const head = `<tr class="wx-days"><td class="wx-corner"></td>${groups.map(g => { const d = sun.get(g.date); return `<th scope="colgroup" colspan="${g.n}"><span><b>${esc(dayName(g.date, dayIdx(g.date)))}</b>${d && d.sunrise && g.n >= 4 ? `<small>Lever ${esc(clock(d.sunrise))} · coucher ${esc(clock(d.sunset))}</small>` : ''}</span></th>`; }).join('')}</tr>`
      + `<tr class="wx-hrow"><th scope="row">Heure</th>${list.map(x => `<th scope="col"${cls(x) ? ` class="${cls(x)}"` : ''}>${esc(hourFmt(x.hour))}</th>`).join('')}</tr>`;
    const body = row('Ciel', '', x => skyIcon(x.code, x.isDay))
      + row('Air', '°C', x => (x.temp == null ? '—' : `${Math.round(x.temp)}°`))
      + row('Vent', 'km/h', x => (x.wind == null ? '—' : `<span class="wx-v">${windFrom(x.windDir)}${Math.round(x.wind)}</span>`))
      + row('Rafales', 'km/h', x => round(x.gust))
      + (inland ? '' : row('Houle', 'm', x => (x.wave == null ? '—' : `<span class="wx-v">${swellFrom(x.waveDir)}${fmt1(x.wave)}</span>`)) + row('Période', 's', x => round(x.period)))
      + row('Pluie', '%', x => `${x.pop == null ? '—' : Math.round(x.pop)}${x.rain != null && x.rain >= 0.1 ? `<small>${fmt1(x.rain)} mm</small>` : ''}`);
    return `<div class="wx-scroll" tabindex="0" role="region" aria-label="Météo heure par heure"><table class="wx-table">${head}${body}</table></div><p class="wx-legend"><span><i class="is-night" aria-hidden="true"></i>Nuit</span>${slotHours.size ? '<span><i class="is-slot" aria-hidden="true"></i>Ton meilleur créneau</span>' : ''}<span>${inland ? 'Flèche : sens où va le vent' : 'Flèche : sens où vont le vent et la houle'}</span></p>`;
  }
  function weekCards(daily, inland) {
    return `<div class="spot-week-grid">${daily.map((d, i) => `<article class="week-day ${i === 0 ? 'today' : ''}"><div class="wd-top"><b>${esc(dayName(d.date, i))}</b>${skyIcon(d.code, true)}</div><strong>${d.tmax != null ? Math.round(d.tmax) + '°' : '—'}</strong><span class="week-min">${d.tmin != null ? Math.round(d.tmin) + '°' : '—'}</span><dl>`
      + `<div><dt>Vent</dt><dd><span class="wx-v">${windFrom(d.windDir)}${d.wind != null ? Math.round(d.wind) + ' km/h' : '—'}</span></dd></div>`
      + `<div><dt>Rafales</dt><dd>${d.gust != null ? Math.round(d.gust) + ' km/h' : '—'}</dd></div>`
      + (inland ? '' : `<div><dt>Houle</dt><dd>${d.wave != null ? fmt1(d.wave) + ' m' : '—'}</dd></div><div><dt>Période</dt><dd>${d.period != null ? Math.round(d.period) + ' s' : '—'}</dd></div>`)
      + `<div><dt>Pluie</dt><dd>${d.pop != null ? Math.round(d.pop) + ' %' : '—'}</dd></div><div><dt>UV</dt><dd>${d.uv != null ? Math.round(d.uv) : '—'}</dd></div>`
      + `<div><dt>Lever</dt><dd>${esc(clock(d.sunrise))}</dd></div><div><dt>Coucher</dt><dd>${esc(clock(d.sunset))}</dd></div></dl></article>`).join('')}</div>`;
  }

  let shown = null;
  function renderWeek(s, weather, marine, fetchedAt) {
    const host = $('#spotWeek'); if (!host) return;
    const W = window.SpotWeatherModel;
    shown = {s, weather, marine, fetchedAt};
    const inland = isInland(s);
    const daily = W ? W.days(weather, marine, {inland}) : [];
    const toBefore = (rule, today) => { try { window.OceanBefore?.slot(s, rule, today, hourFmt); } catch (e) {} };
    if (!W || !daily.length) { host.innerHTML = '<p class="spot-week-empty">Les prévisions détaillées se chargeront dès que le modèle répondra.</p>'; toBefore(null); return; }
    const off = weather && weather.utc_offset_seconds, nowIso = W.localHourIso(off);
    const all = W.hours(weather, marine, {inland}), next = inland ? W.upcoming(all, nowIso, 48) : W.trimMarine(W.upcoming(all, nowIso, 48));
    const today = nowIso.slice(0, 10), tomorrow = (daily.find(d => d.date > today) || {}).date;
    const slots = slotsBlock(s, activeAct, all, nowIso, [today, tomorrow].filter(Boolean), inland);
    /* Bandeau « Avant d’y aller » : le créneau d’aujourd’hui déjà calculé ici, sans nouvel appel. */
    toBefore(slots.rule, slots.today);
    const updated = fetchedAt ? new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short'}).format(new Date(fetchedAt)) : 'heure non disponible';
    const gap = W.tzGap(off);
    const utc = (() => { const a = Math.abs(+off || 0), h = Math.floor(a / 3600), m = Math.round(a % 3600 / 60); return `UTC${off < 0 ? '−' : '+'}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`; })();
    host.innerHTML = `<div class="spot-week-head"><div><small>MÉTÉO DU SPOT</small><b>Cette semaine</b></div><span><span class="wx-stamp">Relevé ${esc(updated)}</span>${gap ? `<span class="wx-stamp">Heures locales du spot (${esc(utc)})</span>` : ''}</span></div>`
      + `<div class="wx-block">${slots.html}</div>`
      + `<div class="wx-block wx-hours"><div class="wx-sub"><h4>Heure par heure</h4><span>48 h</span></div>${hoursTable(next, daily, inland, slots.hours)}</div>`
      + `<div class="wx-block wx-week"><div class="wx-sub"><h4>Les 7 jours</h4><span>Max du jour</span></div>${weekCards(daily, inland)}</div>`
      + `<p class="spot-week-note"><span class="wx-stamp-note">Valeurs de modèle, indicatives, gardées une heure.</span>${inland ? '' : ' <span class="wx-stamp-note">Près des côtes, la précision des vagues est limitée. Pour la marée, consulte l’annuaire local.</span>'}</p>`
      + '<p class="wx-source"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Prévisions Open-Meteo (CC BY 4.0)</a></p>';
  }

  function isInland(s) { return typeof window.isInland === 'function' ? window.isInland(s) : ['lake', 'inland'].includes(s?.waterType); }
  /* Un appel prévision + un appel marine (heure par heure sur 48 h et 7 jours), gardés une heure et partagés entre ouvertures simultanées.
     Hors connexion ou modèle muet : message simple, la fiche reste utilisable. */
  const HOURLY = 'temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation,precipitation_probability,is_day';
  const DAILY = 'temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,weather_code,sunrise,sunset';
  function loadWeek(s, act) {
    const host = $('#spotWeek');
    const c = typeof COORDS !== 'undefined' ? COORDS[s.id] : null;
    if (!c) { if (host) host.innerHTML = '<p class="spot-week-empty">Position non vérifiée : aucune prévision affichée pour ce spot.</p>'; return; }
    const key = `${s.id}:${new Date().toISOString().slice(0,10)}`;
    const n = ++request;
    const stored = cache.get(key);
    if (stored && Date.now() - stored.fetchedAt < 60*60*1000) { later(() => { if (n === request && activeSpot?.id === s.id) renderWeek(s, stored.weather, stored.marine, stored.fetchedAt); }); return; }
    if (host) host.innerHTML = '<div class="spot-week-loading"><i></i><span>Chargement de la météo du spot…</span></div>';
    const inland = isInland(s);
    const weatherUrl = `${api}?latitude=${c.lat}&longitude=${c.lon}&hourly=${HOURLY}&forecast_hours=48&daily=${DAILY}&wind_speed_unit=kmh&cell_selection=${inland ? 'land' : 'sea'}&forecast_days=7&timezone=auto`;
    const marineUrl = `${marineApi}?latitude=${c.lat}&longitude=${c.lon}&hourly=wave_height,wave_period,wave_direction&past_hours=1&forecast_hours=49&daily=wave_height_max,wave_period_max&forecast_days=7&timezone=auto&cell_selection=sea`;
    const getJson = async url => { const response = await fetch(url); if (!response.ok) throw Error(`Prévision HTTP ${response.status}`); return response.json(); };
    if (!pending.has(key)) pending.set(key, Promise.all([getJson(weatherUrl), inland ? Promise.resolve({}) : getJson(marineUrl).catch(() => ({}))])
      .then(([weather, marine]) => { const result = {weather, marine, fetchedAt: Date.now()}; cache.set(key, result); return result; })
      .finally(() => pending.delete(key)));
    pending.get(key).then(({weather, marine, fetchedAt}) => {
      if (n !== request || activeSpot?.id !== s.id) return;
      later(() => { if (n === request && activeSpot?.id === s.id) renderWeek(s, weather, marine, fetchedAt); });
    }).catch(() => { if (n === request && activeSpot?.id === s.id) { try { window.OceanBefore?.slot(s, null); } catch (e) {} } if (n === request && $('#spotWeek')) $('#spotWeek').innerHTML = '<p class="spot-week-empty">Prévisions détaillées indisponibles pour le moment. Réessaie avec une connexion.</p>'; });
  }
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
  function refreshConditions(s, live, marine) { if (activeSpot?.id !== s.id) return; drawSafety(s, live, marine); }
  window.OceanExperience = {init, update, refreshConditions};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
