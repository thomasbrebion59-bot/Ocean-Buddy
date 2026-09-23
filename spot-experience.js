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
  const day = (iso, i) => i === 0 ? 'Aujourd’hui' : (days[new Date(iso + 'T12:00:00').getDay()] || `J+${i}`);
  const direction = deg => deg == null || Number.isNaN(+deg) ? '—' : ['N','NE','E','SE','S','SO','O','NO'][Math.round(+deg / 45) % 8];
  const photo = s => window.OceanPhotos?.lead(s.id, activeAct);

  function ensureExperiencePanel() {
    const infos = $('#detail .dcat[data-cat="infos"]');
    if (!infos || $('#spotVideoPanel')) return;
    const section = document.createElement('section');
    section.id = 'spotVideoPanel';
    infos.append(section);
  }

  function videoPanel(s, act) {
    const image=photo(s);
    if(!image)return '';
    return `<div class="experience-heading"><span><small>LE SPOT EN IMAGES</small><b>Approche-toi du lieu.</b></span><i>${window.OceanPhotos?.list(s.id,act)?.length||1} photographie(s) du secteur</i></div><button type="button" class="experience-photo-open" data-experience-open><img src="${esc(image.thumb||image.src)}" alt="" loading="lazy"><span><b>Explorer ${esc(s.name)}</b><small>Photos attribuées · ambiance sonore illustrative à activer sur demande</small><strong>Entrer dans le décor ↗</strong></span></button>`;
  }

  function drawSafety(s, live, marine) {
    const host = $('#spotSafetyLive'); if (!host) return;
    const dangerText = (s.dangers || []).map(x => x[1]).join(' ').toLowerCase();
    const kind = /courant|baïne|baine|rip|sortie/.test(dangerText) ? 'rip' : /reef|récif|rocher|roche|falaise/.test(dangerText) ? 'reef' : /vent|kite|voile/.test(dangerText) ? 'wind' : 'shore';
    const diagrams = {
      rip: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un courant de retour"><path class="sand" d="M0 98h420v52H0z"/><path class="sea" d="M0 0h420v98H0z"/><path class="arrow" d="M90 55v50m-9-10 9 10 9-10M210 45v70m-9-10 9 10 9-10M330 55v50m-9-10 9 10 9-10"/><path class="safe" d="M25 22h370"/><text x="18" y="18">ZONE DE RETOUR</text><text x="142" y="140">SORTIR SUR LE CÔTÉ · NE PAS LUTTER</text></svg>`,
      reef: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un récif peu profond"><path class="sea" d="M0 0h420v105H0z"/><path class="sand" d="M0 105h420v45H0z"/><path class="reef" d="M45 105q28-40 55 0 28-55 56 0 32-48 62 0 35-60 70 0 26-38 70 0"/><path class="safe" d="M30 28q70 28 140 0t220 0"/><text x="18" y="18">PROFONDEUR VARIABLE</text><text x="128" y="140">GARDER SES DISTANCES</text></svg>`,
      wind: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’un vent qui pousse au large"><path class="sand" d="M0 0h95v150H0z"/><path class="sea" d="M95 0h325v150H95z"/><path class="arrow" d="M42 75h210m-18-12 18 12-18 12"/><path class="safe" d="M95 18v114"/><text x="14" y="18">RIVE</text><text x="300" y="18">LARGE</text><text x="128" y="140">PLANIFIER LE RETOUR</text></svg>`,
      shore: `<svg viewBox="0 0 420 150" role="img" aria-label="Schéma d’une zone de déferlement"><path class="sand" d="M0 110h420v40H0z"/><path class="sea" d="M0 0h420v110H0z"/><path class="wave" d="M15 78q60-60 120 0t120 0 120 0"/><path class="safe" d="M32 126h356"/><text x="122" y="20">ZONE DE DÉFERLEMENT</text><text x="130" y="145">OBSERVER AVANT D’ENTRER</text></svg>`
    };
    const current = live?.current && live.current !== '—' ? live.current : 'Donnée indisponible';
    const updated=Number.isFinite(live?.fetchedAt)?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(live.fetchedAt)):'heure indisponible';
    host.innerHTML = `<div class="safety-live-head"><div><small>LECTURE DU SECTEUR</small><b>Courants & dangers à vérifier</b></div><span class="safety-live-pill">${live?.live?'Modèle reçu le '+esc(updated):'Modèle indisponible'}</span></div><div class="safety-diagram">${diagrams[kind]}</div><div class="safety-readings"><span><b>${esc(current)}</b><small>Courant marin · modèle Open-Meteo</small></span><span><b>${indicativeRange(marine)}</b><small>Variation sur les 24 premières heures du modèle</small></span></div><p class="safety-disclaimer">Les courants Open-Meteo sont une aide de repérage à résolution limitée près des côtes : ils ne remplacent ni le balisage, ni le poste de secours, ni les consignes du spot. Vérifie la marée du jour auprès d’une source locale.</p>`;
  }

  function indicativeRange(marine) {
    const values=marine?.hourly?.sea_level_height_msl?.filter(value=>Number.isFinite(+value)).slice(0,25)||[];
    if(values.length<6)return '—';
    return `${(Math.max(...values)-Math.min(...values)).toFixed(2)} m · modèle`;
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

  function isInland(s) { return typeof window.isInland === 'function' ? window.isInland(s) : s?.waterType === 'lake'; }
  async function loadWeek(s, act) {
    const c = typeof COORDS !== 'undefined' ? COORDS[s.id] : null;
    if (!c) { $('#spotWeek').innerHTML='<p class="spot-week-empty">Position non vérifiée : aucune prévision affichée pour ce spot.</p>'; return; }
    const key = `${s.id}:${new Date().toISOString().slice(0,10)}`;
    const n = ++request;
    const stored=cache.get(key);
    if(stored&&Date.now()-stored.fetchedAt<60*60*1000){renderWeek(s,stored.weather,stored.marine,stored.fetchedAt);return;}
    $('#spotWeek').innerHTML = '<div class="spot-week-loading"><i></i><span>Chargement des 7 jours du spot…</span></div>';
    try {
      const weatherUrl = `${api}?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,weather_code&wind_speed_unit=kmh&forecast_days=7&timezone=auto`;
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

  function openImmersion(s) { window.OceanGallery?.open(s,0,{immersive:true}); }

  function update(s, act) {
    activeSpot=s;activeAct=act;ensureExperiencePanel();
    const hasPhoto=!!photo(s),btn=$('#dImmersionBtn'),panel=$('#spotVideoPanel');
    if(btn){btn.hidden=!hasPhoto;btn.disabled=!hasPhoto;btn.onclick=hasPhoto?()=>openImmersion(s):null;}
    if(panel){panel.hidden=!hasPhoto;panel.innerHTML=hasPhoto?videoPanel(s,act):'';panel.querySelector('[data-experience-open]')?.addEventListener('click',()=>openImmersion(s));}
    drawSafety(s,window.LIVE?.[s.id]);loadWeek(s,act);
  }
  function refreshConditions(s, live, marine) { if (activeSpot?.id !== s.id) return; drawSafety(s, live, marine); }
  window.OceanExperience = {update, refreshConditions};
})();
