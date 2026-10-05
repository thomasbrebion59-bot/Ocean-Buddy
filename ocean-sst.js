/* Planète « température de l’eau » : un bouton du globe colore les océans avec les normales mensuelles
   (NOAA OISST 1991-2020) ; une réglette choisit le mois, la lecture fait défiler l’année. */
(() => {
  'use strict';
  const KEY = 'ob.sst.v1';
  const lang = () => window.OB_LOCALE || 'fr-FR';
  const monthName = (m, style = 'long') => new Intl.DateTimeFormat(lang(), { month: style }).format(new Date(2026, m, 15));
  let on = false, month = new Date().getMonth(), btn = null, panel = null, play = 0;
  try { const p = JSON.parse(localStorage.getItem(KEY) || 'null'); if (p) { on = !!p.on; } } catch (e) {}
  const globe = () => window.OceanMap?.globe;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on })); } catch (e) {} };
  const STOPS = [[-2, '#24306e'], [8, '#2a5fc4'], [15, '#1ea4c8'], [20, '#4fcf9f'], [24, '#e9d64a'], [27, '#f39a3d'], [30, '#d8463a'], [32, '#a3243a']];
  const grad = () => `linear-gradient(90deg,${STOPS.map(([t, c]) => `${c} ${((t + 2) / 34 * 100).toFixed(1)}%`).join(',')})`;

  function mount(ctrls) {
    if (!ctrls || ctrls.querySelector('[data-ex-sst]')) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.dataset.exSst = '';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/><path d="M17.5 5.5h3M17.5 9h2"/></svg>';
    btn.onclick = () => set(!on, true);
    ctrls.prepend(btn);
    paintBtn();
    if (on) { const t = setInterval(() => { if (globe()?.setSst) { clearInterval(t); set(true); } }, 500); setTimeout(() => clearInterval(t), 20000); }
  }
  function paintBtn() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Masquer la température de l’eau' : 'Afficher la température de l’eau sur la planète');
    btn.title = on ? 'Température de l’eau affichée' : 'Température de l’eau';
    btn.classList.toggle('is-on', on);
  }
  function set(v, user) {
    on = !!v; save(); paintBtn();
    const g = globe();
    if (window.OceanPlan?.active?.() && window.OceanPlan.state) month = window.OceanPlan.state.m;
    g?.setSst?.(on, month);
    if (on) showPanel(); else hidePanel();
    if (user && on && typeof toast === 'function') toast('Les océans prennent la couleur de leur température moyenne.');
  }
  function showPanel() {
    const wrap = document.getElementById('spotMapWrap'); if (!wrap) return;
    if (!panel) {
      panel = document.createElement('div'); panel.className = 'sst-panel'; panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Température de l’eau par mois');
      wrap.append(panel);
      panel.addEventListener('click', e => {
        const s = e.target.closest('[data-sst-step]'); if (s) { stop(); setMonth(month + (+s.dataset.sstStep)); }
        if (e.target.closest('[data-sst-play]')) play ? stop() : start();
        const m = e.target.closest('[data-sst-m]'); if (m) { stop(); setMonth(+m.dataset.sstM); }
      });
    }
    panel.hidden = false;
    paint();
  }
  function hidePanel() { stop(); if (panel) panel.hidden = true; }
  function setMonth(m) { month = ((m % 12) + 12) % 12; globe()?.setSstMonth?.(month); paint(); }
  function start() { play = setInterval(() => setMonth(month + 1), 1400); paint(); }
  function stop() { clearInterval(play); play = 0; if (panel) paint(); }
  function paint() {
    if (!panel) return;
    panel.innerHTML = `<div class="sst-top"><span class="sst-k">Eau en</span>
      <button type="button" class="sst-step" data-sst-step="-1" aria-label="Mois précédent">‹</button><b>${monthName(month)}</b><button type="button" class="sst-step" data-sst-step="1" aria-label="Mois suivant">›</button>
      <button type="button" class="sst-play" data-sst-play aria-pressed="${!!play}" aria-label="${play ? 'Arrêter le défilement' : 'Faire défiler l’année'}">${play ? '❚❚' : '▶'}</button></div>
      <div class="sst-scale" style="background:${grad()}" aria-hidden="true"></div>
      <div class="sst-ticks" aria-hidden="true">${[[0, '0°'], [10, '10°'], [20, '20°'], [24, '24°'], [30, '30 °C']].map(([t, l]) => `<span style="left:${((t + 2) / 34 * 100).toFixed(1)}%"${t === 24 ? ' class="hot"' : ''}>${l}</span>`).join('')}</div>
      <div class="sst-months">${Array.from({ length: 12 }, (_, m) => `<button type="button" data-sst-m="${m}" aria-pressed="${m === month}" aria-label="${monthName(m)}">${monthName(m, 'narrow')}</button>`).join('')}</div>
      <p class="sst-src">Normales NOAA OISST 1991-2020 · trait blanc : 24 °C</p>`;
  }
  /* Quitter l’explorateur : la lecture s’arrête. */
  window.addEventListener('ocean:navigate', e => { if (e.detail !== 'spots') stop(); });
  window.OceanSst = { mount, set, setMonth, get on() { return on; } };
})();
