/* Spot experience: seven-day local forecast, current reading, safety diagrams,
   activity videos and a true full-screen immersion mode. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let activeSpot = null, activeAct = null, request = 0, modal, slides = [], slide = 0;
  const cache = new Map();
  const api = 'https://api.open-meteo.com/v1/forecast';
  const marineApi = 'https://marine-api.open-meteo.com/v1/marine';
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const day = (iso, i) => i === 0 ? 'Aujourd’hui' : (days[new Date(iso + 'T12:00:00').getDay()] || `J+${i}`);
  const direction = deg => deg == null || Number.isNaN(+deg) ? '—' : ['N','NE','E','SE','S','SO','O','NO'][Math.round(+deg / 45) % 8];
  const photo = s => window.OceanPhotos?.lead(s.id, activeAct)?.src || window.SPOT_PHOTOS?.[s.id]?.src || '';
  const activityLabel = a => (typeof SPORTMAP !== 'undefined' && SPORTMAP[a]?.label)?.replace(/\s*\(.*\)/, '') || 'activité nautique';

  function ensureExperiencePanel() {
    const infos = $('#detail .dcat[data-cat="infos"]');
    if (!infos || $('#spotVideoPanel')) return;
    const section = document.createElement('section');
    section.id = 'spotVideoPanel';
    infos.append(section);
  }

  function videoPanel(s, act) {
    const q = (kind, extra) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.name} ${s.loc} ${activityLabel(act)} ${extra}`)}`;
    const src = photo(s);
    const cards = [
      ['▶', 'Sessions sur le spot', 'Voir des pratiquants sur place', q('session', 'session surf sport'), 'session'],
      ['◎', 'Gestes & sécurité', 'Observer les bons réflexes', q('safety', 'safety technique'), 'safety'],
      ['◉', 'Regards locaux', 'Clubs, écoles et amateurs', q('local', 'local surf school'), 'local']
    ];
    return `<div class="experience-heading"><span><small>VOIR LE LIEU EN ACTION</small><b>Des sessions, pas seulement une photo.</b></span><i>Vidéos publiques à vérifier avant de partir</i></div><div class="experience-videos">${cards.map(c => `<a class="experience-video ${c[4]}" href="${esc(c[3])}" target="_blank" rel="noopener" style="--video-image:url('${esc(src)}')"><span class="video-play">${c[0]}</span><span><small>${esc(c[1])}</small><b>${esc(c[2])}</b><em>Ouvrir les vidéos ↗</em></span></a>`).join('')}</div><p class="experience-source">Les résultats viennent de YouTube et peuvent changer. Vérifie la date, l’auteur et les consignes locales ; une vidéo ne remplace jamais un briefing.</p>`;
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
    const current = live?.current && live.current !== '—' ? live.current : 'En attente de la donnée locale';
    host.innerHTML = `<div class="safety-live-head"><div><small>LECTURE DU SECTEUR</small><b>Courants & dangers à vérifier</b></div><span class="safety-live-pill">${live?.live ? 'actualisé' : 'données locales'}</span></div><div class="safety-diagram">${diagrams[kind]}</div><div class="safety-readings"><span><b>${esc(current)}</b><small>Courant marin · modèle Open-Meteo</small></span><span><b>${esc(s.tide || 'Variable')}</b><small>Marée indiquée au catalogue</small></span><span><b>${indicativeCoefficient(marine)}</b><small>Amplitude locale · pas un coefficient officiel</small></span></div><p class="safety-disclaimer">Les courants Open-Meteo sont une aide de repérage à résolution limitée près des côtes : ils ne remplacent ni le balisage, ni le poste de secours, ni les consignes du spot.</p>`;
  }

  function renderWeek(s, weather, marine) {
    const host = $('#spotWeek'); if (!host) return;
    const d = weather?.daily || {}, m = marine?.daily || {};
    const times = d.time || m.time || [];
    if (!times.length) { host.innerHTML = '<p class="spot-week-empty">Les prévisions détaillées se chargeront dès que le modèle répondra.</p>'; return; }
    const w = key => d[key] || [];
    const waves = m.wave_height_max || [];
    host.innerHTML = `<div class="spot-week-head"><div><small>SEMAINE DU SPOT</small><b>Vent, UV, pluie & état de la mer</b></div><span>7 jours · actualisation automatique</span></div><div class="spot-week-grid">${times.slice(0,7).map((iso,i) => `<article class="week-day ${i===0?'today':''}"><b>${day(iso,i)}</b><strong>${w('temperature_2m_max')[i] != null ? Math.round(w('temperature_2m_max')[i])+'°' : '—'}</strong><span class="week-min">${w('temperature_2m_min')[i] != null ? Math.round(w('temperature_2m_min')[i])+'°' : '—'}</span><dl><div><dt>Vent</dt><dd>${w('wind_speed_10m_max')[i] != null ? Math.round(w('wind_speed_10m_max')[i])+' km/h' : '—'}</dd></div><div><dt>UV</dt><dd>${w('uv_index_max')[i] != null ? Math.round(w('uv_index_max')[i]*10)/10 : '—'}</dd></div><div><dt>Pluie</dt><dd>${w('precipitation_probability_max')[i] != null ? Math.round(w('precipitation_probability_max')[i])+'%' : '—'}</dd></div><div><dt>Houle</dt><dd>${waves[i] != null && !isInland(s) ? (+waves[i]).toFixed(1)+' m' : '—'}</dd></div></dl></article>`).join('')}</div><p class="spot-week-note">UV, vent et pluie : prévision météo. Houle : prévision marine. Les valeurs sont indicatives et se recalculent à chaque ouverture du spot.</p>`;
  }

  function isInland(s) { return typeof window.isInland === 'function' ? window.isInland(s) : s?.waterType === 'lake'; }
  async function loadWeek(s, act) {
    const c = typeof COORDS !== 'undefined' ? COORDS[s.id] : null; if (!c) return;
    const key = `${s.id}:${new Date().toISOString().slice(0,10)}`;
    if (cache.has(key)) { renderWeek(s, cache.get(key).weather, cache.get(key).marine); return; }
    const n = ++request;
    $('#spotWeek').innerHTML = '<div class="spot-week-loading"><i></i><span>Chargement des 7 jours du spot…</span></div>';
    try {
      const weatherUrl = `${api}?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,weather_code&wind_speed_unit=kmh&forecast_days=7&timezone=auto`;
      const marineUrl = `${marineApi}?latitude=${c.lat}&longitude=${c.lon}&daily=wave_height_max&forecast_days=7&timezone=auto`;
      const [weather, marine] = await Promise.all([fetch(weatherUrl).then(r=>r.json()), isInland(s) ? Promise.resolve({}) : fetch(marineUrl).then(r=>r.json())]);
      if (n !== request || activeSpot?.id !== s.id) return;
      cache.set(key, {weather, marine}); renderWeek(s, weather, marine);
    } catch (_) { if (n === request) $('#spotWeek').innerHTML = '<p class="spot-week-empty">Prévisions détaillées indisponibles pour le moment. Réessaie avec une connexion.</p>'; }
  }

  function makeModal() {
    if (modal) return modal;
    modal = document.createElement('dialog'); modal.id = 'immersionMode'; modal.className = 'immersion-mode';
    modal.innerHTML = `<button class="immersion-close" type="button" aria-label="Fermer le mode immersion">×</button><div class="immersion-stage"><div class="immersion-backdrop"></div><div class="immersion-copy"><small id="immersionActivity"></small><h2 id="immersionName"></h2><p>Regarde, écoute et repère le lieu avant ta session.</p></div><div class="immersion-controls"><button data-imm-prev aria-label="Photo précédente">←</button><span id="immersionCounter"></span><button data-imm-next aria-label="Photo suivante">→</button><button data-imm-full>Écran géant ↗</button></div></div>`;
    document.body.append(modal);
    modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.immersion-close')) modal.close(); if (e.target.closest('[data-imm-prev]')) move(-1); if (e.target.closest('[data-imm-next]')) move(1); if (e.target.closest('[data-imm-full]')) modal.requestFullscreen?.(); });
    modal.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); });
    return modal;
  }
  function frame() { const p = slides[slide]; if (!p) return; $('.immersion-backdrop').style.backgroundImage = `url("${p.src}")`; $('#immersionCounter').textContent = `${slide+1} / ${slides.length}`; }
  function move(step) { if (!slides.length) return; slide = (slide + step + slides.length) % slides.length; frame(); }
  function openImmersion(s, act) { activeSpot=s; activeAct=act; slides = window.OceanPhotos?.list(s.id, act) || []; if (!slides.length && photo(s)) slides=[{src:photo(s)}]; slide=0; makeModal(); $('#immersionActivity').textContent=activityLabel(act)+' · mode immersion'; $('#immersionName').textContent=s.name; frame(); modal.showModal(); }

  function update(s, act) { activeSpot=s; activeAct=act; ensureExperiencePanel(); const btn=$('#dImmersionBtn'); if (btn) btn.onclick=()=>openImmersion(s,act); const panel=$('#spotVideoPanel'); if (panel) panel.innerHTML=videoPanel(s,act); drawSafety(s, window.LIVE?.[s.id]); loadWeek(s,act); }
  function refreshConditions(s, live, marine) { if (activeSpot?.id !== s.id) return; drawSafety(s, live, marine); }
  window.OceanExperience = {update, refreshConditions};
})();
  function indicativeCoefficient(marine) {
    const values = marine?.hourly?.sea_level_height_msl?.filter(v => Number.isFinite(+v)).slice(0, 25) || [];
    if (values.length < 6) return '—';
    const range = Math.max(...values) - Math.min(...values);
    return `${Math.round(Math.max(20, Math.min(120, 20 + range * 7)))} · indicatif`;
  }
