/* Planificateur « Quand ? » : choisir un mois et des envies (eau chaude, soleil, vagues, vent…)
   filtre la planète et la liste avec les normales climatiques de chaque spot (assets/data/spot-climate-lite.js). */
(() => {
  'use strict';
  const M = window.SpotDataModel; if (!M) return;
  const KEY = 'ob.plan.v1';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lang = () => window.OB_LOCALE || 'fr-FR';
  const monthName = (m, style = 'long') => new Intl.DateTimeFormat(lang(), { month: style }).format(new Date(2026, m, 15));
  const svg = d => `<svg class="sd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const P = {
    cal: '<path d="M4 6h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    temp: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"/>',
    dry: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M4 4l16 16"/>',
    hot: '<path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z"/>',
    wave: '<path d="M2 15c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2 2.2-2 2.4-2"/><path d="M6 10c1-3 4-5 7-5 2 0 3.6 1 4.6 2.4"/>',
    big: '<path d="M2 18c3 0 4-9 10-9 3.5 0 5 2 5 4-2-1-4 0-4 2 0 1.7 1.6 3 4 3h5"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
    calm: '<path d="M3 12h18M3 16h18" />'
  };
  const CRIT = [
    ['warm', 'temp', 'Eau chaude', '24 °C et plus'],
    ['mild', 'temp', 'Eau agréable', '20 °C et plus'],
    ['sun', 'sun', 'Plein soleil', '8 h ou plus par jour'],
    ['dry', 'dry', 'Peu de pluie', '7 jours au plus dans le mois'],
    ['hot', 'hot', 'Chaleur', '27 °C l’après-midi'],
    ['calm', 'calm', 'Mer calme', 'houle faible 6 jours sur 10'],
    ['waves', 'wave', 'Belles vagues', 'houle de 1 à 2,5 m au large'],
    ['big', 'big', 'Grosse houle', 'plus de 2,2 m en moyenne'],
    ['wind', 'wind', 'Vent pour le kite', 'un jour sur deux ou plus']
  ];
  let state = read(), lite = null, draft = null;
  function read() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Number.isInteger(s.m) && Array.isArray(s.c)) return s; } catch (e) {} return null; }
  function save() { try { state ? localStorage.setItem(KEY, JSON.stringify(state)) : localStorage.removeItem(KEY); } catch (e) {} }
  function ensure() { return window.OceanSpotData ? OceanSpotData.load('lite').then(d => (lite = d)) : Promise.reject(Error('data')); }
  if (state) ensure().then(apply).catch(() => {});

  const active = () => !!(state && lite && state.c.length);
  function ok(s) { if (!active()) return true; return M.matches(lite[s.id], state.m, state.c); }
  function count(st) { if (!lite || typeof SPOTS === 'undefined') return null; return SPOTS.filter(s => M.matches(lite[s.id], st.m, st.c)).length; }
  function label(st = state) {
    if (!st || !st.c.length) return 'Quand ?';
    return `${monthName(st.m, 'short')} · ${st.c.length === 1 ? CRIT.find(c => c[0] === st.c[0])[2] : st.c.length + ' envies'}`;
  }
  function button() {
    return `<button type="button" class="omap-plan${active() ? ' on' : ''}" data-map-plan aria-haspopup="dialog">${svg(P.cal)}<span>${esc(label())}</span></button>`;
  }
  function apply() {
    try { if (typeof renderSpots === 'function') renderSpots(); window.OceanMap?.render?.(false); } catch (e) {}
    document.querySelectorAll('[data-map-plan]').forEach(b => { b.classList.toggle('on', active()); const sp = b.querySelector('span'); if (sp) sp.textContent = label(); });
    const chip = document.getElementById('sdPlanChip');
    if (chip) { chip.hidden = !active(); chip.innerHTML = active() ? `${svg(P.cal)}${esc(label())} <i aria-hidden="true">✕</i>` : ''; }
  }

  /* ---------- Feuille ---------- */
  let back = null, sheet = null, lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    draft = state ? { m: state.m, c: state.c.slice() } : { m: new Date().getMonth(), c: [] };
    close(true);
    back = document.createElement('div'); back.className = 'sd-sheet-back';
    sheet = document.createElement('div'); sheet.className = 'sd-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'sdPlanTitle');
    document.body.append(back, sheet);
    paint();
    requestAnimationFrame(() => { back.classList.add('in'); sheet.classList.add('in'); sheet.querySelector('#sdPlanTitle')?.focus({ preventScroll: true }); });
    back.addEventListener('click', () => close());
    ensure().then(paintCount).catch(() => { const c = sheet?.querySelector('.sd-count'); if (c) c.textContent = 'Données indisponibles hors connexion.'; });
  }
  function paint() {
    if (!sheet) return;
    sheet.innerHTML = `<div class="sd-sheet-grab" aria-hidden="true"></div>
      <h3 id="sdPlanTitle" tabindex="-1">Quand veux-tu partir ?</h3>
      <p class="sd-sub">Choisis un mois et tes envies : la planète ne garde que les spots où c’est d’habitude le cas.</p>
      <h4>Le mois</h4>
      <div class="sd-months" role="group" aria-label="Mois">${Array.from({ length: 12 }, (_, m) => `<button type="button" data-plan-m="${m}" aria-pressed="${draft.m === m}">${esc(monthName(m, 'short'))}</button>`).join('')}</div>
      <h4>Tes envies</h4>
      <div class="sd-crit" role="group" aria-label="Envies">${CRIT.map(c => `<button type="button" data-plan-c="${c[0]}" aria-pressed="${draft.c.includes(c[0])}">${svg(P[c[1]])}<span><b>${esc(c[2])}</b><small>${esc(c[3])}</small></span></button>`).join('')}</div>
      <p class="sd-plan-note">D’après les normales de plusieurs années (NOAA, NASA, Copernicus) : une tendance, pas une prévision.</p>
      <div class="sd-sheet-foot"><span class="sd-count" aria-live="polite">…</span><button type="button" class="sd-clear" data-plan-clear>Effacer</button><button type="button" class="sd-go-btn" data-plan-go>Voir les spots</button></div>`;
    paintCount();
  }
  function paintCount() {
    const el = sheet?.querySelector('.sd-count'); if (!el) return;
    if (!draft.c.length) { el.innerHTML = `<b>${typeof SPOTS !== 'undefined' ? SPOTS.length : ''}</b>Choisis au moins une envie`; return; }
    const n = count(draft);
    el.innerHTML = n == null ? '…' : `<b>${n}</b>${n === 1 ? 'spot correspond' : 'spots correspondent'}`;
  }
  function close(silent) {
    const b = back, s = sheet; back = sheet = null;
    if (!s) return;
    if (silent) { b?.remove(); s.remove(); return; }
    b.classList.remove('in'); s.classList.remove('in');
    setTimeout(() => { b.remove(); s.remove(); }, 320);
    lastFocus?.focus?.({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-map-plan]')) { e.preventDefault(); open(); return; }
    if (t.closest('#sdPlanChip')) { state = null; save(); apply(); return; }
    if (!sheet || !sheet.contains(t)) return;
    const m = t.closest('[data-plan-m]'), c = t.closest('[data-plan-c]');
    if (m) { draft.m = +m.dataset.planM; sheet.querySelectorAll('[data-plan-m]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.planM === draft.m))); paintCount(); }
    if (c) { const k = c.dataset.planC, i = draft.c.indexOf(k); if (i >= 0) draft.c.splice(i, 1); else draft.c.push(k); c.setAttribute('aria-pressed', String(i < 0)); paintCount(); }
    if (t.closest('[data-plan-clear]')) { draft.c = []; sheet.querySelectorAll('[data-plan-c]').forEach(b => b.setAttribute('aria-pressed', 'false')); paintCount(); }
    if (t.closest('[data-plan-go]')) {
      state = draft.c.length ? { m: draft.m, c: draft.c.slice() } : null; save();
      ensure().then(() => { apply(); if (typeof go === 'function' && document.body.dataset.screen !== 'spots') go('spots'); }).catch(apply);
      close();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) { e.stopPropagation(); close(); } }, true);

  window.OceanPlan = { ok, active, open, button, label, apply, get state() { return state; }, set(st) { state = st && st.c && st.c.length ? st : null; save(); ensure().then(apply).catch(() => {}); } };
})();
