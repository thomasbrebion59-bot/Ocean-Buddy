/* Ocean Data : les vraies données de chaque spot.
   - Onglet « Saisons » : calendrier des activités, mois par mois, et normales (eau, air, soleil, pluie, houle, vent)
   - Aperçu « Quand partir ? » dans l’onglet Le spot et repère « eau » dans l’en-tête
   - « Y aller » (onglet Préparer) : aéroports, heure locale, soleil, monnaie, langue
   - « Observé ici » (onglet Faune) : espèces photographiées et validées autour du spot (iNaturalist), richesse marine (OBIS)
   Données chargées à la demande : assets/data/spot-climate.js, spot-access.js, spot-wildlife.js. */
(() => {
  'use strict';
  const M = window.SpotDataModel; if (!M) return;
  const URL = {
    climate: 'assets/data/spot-climate.js?v=4996f5fabfda',
    lite: 'assets/data/spot-climate-lite.js?v=8a748ff9592b',
    access: 'assets/data/spot-access.js?v=dd26c73b04f8',
    wild: 'assets/data/spot-wildlife.js?v=df818ae9b89a'
  };
  const GLOBAL = { climate: 'OCEAN_CLIMATE', lite: 'OCEAN_CLIMATE_LITE', access: 'OCEAN_ACCESS', wild: 'OCEAN_WILDLIFE' };
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lang = () => window.OB_LOCALE || 'fr-FR';
  const isFr = () => !(window.OB_I18N && OB_I18N.lang && OB_I18N.lang !== 'fr');
  const NT = ' translate="no" data-no-i18n';
  const num = (v, d = 0) => v == null ? '–' : new Intl.NumberFormat(lang(), { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
  const monthName = (m, style = 'long') => new Intl.DateTimeFormat(lang(), { month: style }).format(new Date(2026, m, 15));
  const monthLetter = m => monthName(m, 'narrow');
  const sportLabel = id => (typeof SPORTMAP !== 'undefined' && SPORTMAP[id] ? SPORTMAP[id].label.replace(/\s*\(.*\)/, '') : id);
  const icon = (d, cls = '') => `<svg class="sd-ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    temp: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    wave: '<path d="M2 15c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2 2.2-2 2.4-2"/><path d="M2 19c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2"/><path d="M6 10c1-3 4-5 7-5 2 0 3.6 1 4.6 2.4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"/>',
    rain: '<path d="M7 16a4.5 4.5 0 1 1 1.3-8.8A5.5 5.5 0 0 1 19 9.5a3.5 3.5 0 0 1-1 6.5H7z"/><path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
    plane: '<path d="M10.5 13.5 3 11l1.4-1.4 7.4.9 4.7-4.7a1.8 1.8 0 0 1 2.6 2.6l-4.7 4.7.9 7.4L14 21.9l-2.5-7.5-3.3 3.3.4 2.6-1.1 1.1-1.6-3.3-3.3-1.6 1.1-1.1 2.6.4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.1-1.6M12 6v2M12 16v2"/>',
    talk: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cal: '<path d="M4 6h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    fish: '<ellipse cx="10.5" cy="12" rx="7.5" ry="4.6"/><path d="M18 12 22 8.6v6.8z"/><circle cx="6.5" cy="11.2" r=".9" fill="currentColor"/>',
    ext: '<path d="M7 17 17 7M8 7h9v9"/>',
    table: '<path d="M3 5h18v14H3zM3 10h18M3 15h18M9 5v14"/>'
  };

  /* ---------------- Chargement ---------------- */
  const loading = {};
  function load(key) {
    if (window[GLOBAL[key]]) return Promise.resolve(window[GLOBAL[key]]);
    if (!loading[key]) loading[key] = new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = URL[key]; s.async = true;
      s.onload = () => window[GLOBAL[key]] ? resolve(window[GLOBAL[key]]) : reject(Error(key));
      s.onerror = () => { s.remove(); loading[key] = null; reject(Error(key)); };
      document.head.append(s);
    });
    return loading[key];
  }

  let cur = null, selMonth = new Date().getMonth(), selAct = null;
  const curAct = s => {
    const l = typeof spotSports === 'function' ? spotSports(s) : (s.sports || []);
    if (typeof detailAct === 'function') { const a = detailAct(s); if (l.includes(a)) return a; }
    return l[0];
  };

  /* ---------------- Onglet Saisons ---------------- */
  const LEVEL_TXT = ['Peu favorable', 'Possible', 'Bon', 'Top'];
  function rangeText(ranges) {
    if (!ranges.length) return '';
    if (ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] === 11) return 'toute l’année';
    return ranges.map(([a, b]) => a === b ? monthName(a) : `${monthName(a)} → ${monthName(b)}`).join(' · ');
  }
  function calendar(s, c) {
    const acts = (typeof spotSports === 'function' ? spotSports(s) : s.sports).filter(a => M.year(c, a, s.level).some(v => v != null));
    if (!acts.length) return '';
    const head = Array.from({ length: 12 }, (_, m) => `<span class="sd-cal-m${m === new Date().getMonth() ? ' now' : ''}" aria-hidden="true">${esc(monthLetter(m))}</span>`).join('');
    const rows = acts.map(a => {
      const y = M.year(c, a, s.level), b = M.best(y);
      const cells = y.map((v, m) => {
        const L = M.level(v);
        return `<button type="button" class="sd-cell l${L ?? 'x'}${m === selMonth && a === (selAct || curAct(s)) ? ' sel' : ''}" data-sd-month="${m}" data-sd-act="${a}" aria-label="${esc(monthName(m))} : ${esc(L == null ? 'donnée indisponible' : LEVEL_TXT[L])}">${L === 3 ? '<i aria-hidden="true">✓</i>' : ''}</button>`;
      }).join('');
      return `<div class="sd-cal-row"><div class="sd-cal-act">${typeof sportIcon === 'function' ? sportIcon(a) : ''}<span><b>${esc(sportLabel(a))}</b><small>${b.ranges.length ? esc(rangeText(b.ranges)) : 'Pas de période nette'}</small></span></div><div class="sd-cal-cells">${cells}</div></div>`;
    }).join('');
    return `<div class="sd-cal" role="group" aria-label="Calendrier des activités">
      <div class="sd-cal-row sd-cal-head"><div class="sd-cal-act"></div><div class="sd-cal-cells">${head}</div></div>${rows}
      <div class="sd-legend" aria-hidden="true"><span><i class="l0"></i>Peu favorable</span><span><i class="l1"></i>Possible</span><span><i class="l2"></i>Bon</span><span><i class="l3"></i>Top</span></div>
    </div>`;
  }

  function monthCard(s, c) {
    const d = M.month(c, selMonth), act = selAct || curAct(s), sc = M.score(act, d, s.level), L = M.level(sc);
    const tiles = [];
    if (d.sea != null) tiles.push(['temp', 'Eau', `${num(d.sea)} °C`, 'moyenne de surface', 'sea']);
    if (d.tx != null) tiles.push(['sun', 'Air', `${num(d.tx)}° / ${num(d.tn)}°`, 'max / min du jour', 'air']);
    if (d.sun != null) tiles.push(['sun', 'Soleil', `≈ ${num(d.sun)} h`, 'par jour, estimé', 'sunh']);
    if (d.wet != null) tiles.push(['rain', 'Pluie', `${num(d.wet)} j`, `${num(d.rain)} mm dans le mois`, 'rain']);
    if (d.waves) tiles.push(['wave', 'Houle au large', `${num(d.hs, 1)} m`, `${num(d.tp)} s · ${M.DIR_FROM[d.dir] ? 'venue ' + M.DIR_FROM[d.dir] : ''}`, 'wave']);
    if (d.wind != null) tiles.push(['wind', 'Vent', `${num(d.wind)} km/h`, d.kite != null ? `${num(d.kite)} % de jours ≥ 25 km/h` : '', 'wind']);
    const verdict = L == null ? '' : `<p class="sd-verdict l${L}"><b>${esc(sportLabel(act))} : ${esc(LEVEL_TXT[L].toLowerCase())}</b> en ${esc(monthName(selMonth))}${verdictWhy(act, d)}</p>`;
    return `<div class="sd-month" aria-live="polite">
      <div class="sd-month-head"><h4>En ${esc(monthName(selMonth))}</h4>${monthPicker()}</div>
      ${verdict}
      <div class="sd-tiles">${tiles.map(t => `<div class="sd-tile k-${t[4]}">${icon(I[t[0]])}<small>${esc(t[1])}</small><b>${esc(t[2])}</b><span>${esc(t[3])}</span></div>`).join('')}</div>
    </div>`;
  }
  function verdictWhy(act, d) {
    const bits = [];
    if (['baignade', 'snorkeling', 'plongee'].includes(act) && d.sea != null) bits.push(`eau à ${num(d.sea)} °C`);
    if (['surf', 'bodyboard'].includes(act) && d.waves) bits.push(`houle moyenne de ${num(d.hs, 1)} m au large`);
    if (['kitesurf', 'windsurf', 'wingfoil'].includes(act) && d.kite != null) bits.push(`vent soutenu ${num(d.kite)} % des jours`);
    if (['paddle', 'kayak'].includes(act) && d.wind != null) bits.push(`vent moyen de ${num(d.wind)} km/h`);
    if (d.sun != null && d.sun >= 8) bits.push('beaucoup de soleil');
    if (d.wet != null && d.wet >= 15) bits.push('mois pluvieux');
    return bits.length ? ' · ' + esc(bits.join(', ')) : '';
  }
  function monthPicker() {
    return `<div class="sd-mpick" role="group" aria-label="Choisir le mois"><button type="button" data-sd-step="-1" aria-label="Mois précédent">‹</button><button type="button" data-sd-step="1" aria-label="Mois suivant">›</button></div>`;
  }

  /* Petits graphiques empilés, un par mesure, sur le même axe des mois (jamais deux échelles sur un graphique). */
  function charts(c) {
    const W = Math.max(280, Math.min(640, ($('#dSeasons')?.clientWidth || 340) - 8));
    const padL = 34, padR = 10, plotW = W - padL - padR, col = plotW / 12, x = m => padL + col * (m + .5);
    const panels = [];
    const a = c.air || {};
    const band = (h) => `<rect class="sd-sel" x="${padL + col * selMonth}" y="0" width="${col}" height="${h}" rx="6"/>`;
    const hits = (h) => Array.from({ length: 12 }, (_, m) => `<rect class="sd-hit" data-sd-month="${m}" x="${padL + col * m}" y="0" width="${col}" height="${h}"><title>${esc(monthName(m))}</title></rect>`).join('');
    const ticks = (lo, hi, y, fmt) => [lo, hi].map(v => `<text class="sd-tick" x="${padL - 6}" y="${y(v) + 3.5}" text-anchor="end">${esc(fmt(v))}</text><line class="sd-grid" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/>`).join('');
    // 1. Températures : eau (ligne) et air (bande min-max), même unité
    if (c.sea || a.tx) {
      const H = 120, top = 14, bot = H - 10;
      const vals = [...(c.sea || []), ...(a.tx || []), ...(a.tn || [])].filter(v => v != null);
      let lo = Math.floor(Math.min(...vals) / 5) * 5, hi = Math.ceil(Math.max(...vals) / 5) * 5; if (hi - lo < 10) hi = lo + 10;
      const y = v => bot - (v - lo) / (hi - lo) * (bot - top);
      let g = band(H) + ticks(lo, hi, y, v => v + '°');
      if (a.tx && a.tn) {
        const up = a.tx.map((v, m) => `${x(m)},${y(v)}`), dn = a.tn.map((v, m) => `${x(m)},${y(v)}`).reverse();
        g += `<polygon class="sd-airband" points="${up.concat(dn).join(' ')}"/><polyline class="sd-airline" points="${up.join(' ')}"/>`;
      }
      if (c.sea) {
        g += `<polyline class="sd-sealine" points="${c.sea.map((v, m) => `${x(m)},${y(v)}`).join(' ')}"/>`;
        g += `<circle class="sd-seadot" cx="${x(selMonth)}" cy="${y(c.sea[selMonth])}" r="4.5"/>`;
      }
      if (a.tx) g += `<circle class="sd-airdot" cx="${x(selMonth)}" cy="${y(a.tx[selMonth])}" r="4.5"/>`;
      const legend = `<span class="sd-key"><i class="k-sea"></i>Eau</span>${a.tx ? '<span class="sd-key"><i class="k-air"></i>Air (min → max)</span>' : ''}`;
      panels.push({ title: 'Températures', legend, H, g: g + hits(H) });
    }
    const bars = (key, arr, title, unit, d = 0, cls, extra = '') => {
      if (!arr || !arr.some(v => v != null)) return;
      const H = 78, top = 16, bot = H - 6, max = Math.max(...arr.filter(v => v != null), 0.0001) * 1.08;
      const bw = Math.min(18, col * .58);
      const y = v => bot - v / max * (bot - top);
      let g = band(H) + `<line class="sd-base" x1="${padL}" x2="${W - padR}" y1="${bot}" y2="${bot}"/>`;
      arr.forEach((v, m) => {
        if (v == null) return;
        const yy = y(v), h = Math.max(1.5, bot - yy), r = Math.min(4, h / 2);
        g += `<path class="sd-bar ${cls}${m === selMonth ? ' on' : ''}" d="M${x(m) - bw / 2},${bot}V${yy + r}q0,-${r} ${r},-${r}h${bw - 2 * r}q${r},0 ${r},${r}V${bot}z"/>`;
      });
      const v = arr[selMonth];
      if (v != null) g += `<text class="sd-val" x="${x(selMonth)}" y="${y(v) - 5}" text-anchor="middle">${esc(num(v, d) + unit)}</text>`;
      panels.push({ title, H, g: g + extra + hits(H) });
    };
    bars('sun', a.sun, 'Soleil · heures par jour (estimation)', ' h', 0, 'b-sun');
    bars('wet', a.wet, 'Pluie · jours de pluie dans le mois', ' j', 0, 'b-rain');
    if (c.wave) bars('hs', c.wave.hs, 'Houle au large · hauteur moyenne', ' m', 1, 'b-wave');
    bars('wind', a.wind, 'Vent · vitesse moyenne', ' km/h', 0, 'b-wind');
    const axis = `<svg class="sd-axis" viewBox="0 0 ${W} 18" width="100%" aria-hidden="true">${Array.from({ length: 12 }, (_, m) => `<text x="${x(m)}" y="13" text-anchor="middle" class="${m === selMonth ? 'on' : ''}">${esc(monthLetter(m))}</text>`).join('')}</svg>`;
    return `<div class="sd-charts">${panels.map(p => `<figure class="sd-panel"><figcaption><b>${esc(p.title)}</b>${p.legend ? `<span class="sd-keys">${p.legend}</span>` : ''}</figcaption><svg viewBox="0 0 ${W} ${p.H}" width="100%" role="img" aria-label="${esc(p.title)}, de janvier à décembre">${p.g}</svg></figure>`).join('')}${axis}</div>`;
  }

  function rose(c) {
    const w = c.wave; if (!w || !w.rose) return '';
    const R = 46, cx = 60, cy = 60, max = Math.max(...w.rose, 1);
    const petals = w.rose.map((v, i) => {
      if (!v) return '';
      const r = 10 + (R - 10) * v / max, a0 = (i * 45 - 19) * Math.PI / 180, a1 = (i * 45 + 19) * Math.PI / 180;
      const p = (ang, rr) => `${cx + Math.sin(ang) * rr},${cy - Math.cos(ang) * rr}`;
      return `<path class="sd-petal" d="M${p(a0, 8)} L${p(a0, r)} A${r} ${r} 0 0 1 ${p(a1, r)} L${p(a1, 8)} A8 8 0 0 0 ${p(a0, 8)}Z"><title>${esc(M.DIR_FROM[i])} : ${v} %</title></path>`;
    }).join('');
    const main = w.rose.indexOf(max);
    const lbl = ['N', 'E', 'S', 'O'].map((t, i) => `<text x="${cx + Math.sin(i * Math.PI / 2) * (R + 9)}" y="${cy - Math.cos(i * Math.PI / 2) * (R + 9) + 4}" text-anchor="middle"${NT}>${t}</text>`).join('');
    return `<div class="sd-rose"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Rose des houles : la plupart viennent ${esc(M.DIR_FROM[main])}"><circle class="sd-rose-ring" cx="60" cy="60" r="${R}"/><circle class="sd-rose-ring" cx="60" cy="60" r="${R / 2}"/>${petals}${lbl}</svg>
      <div><small>D’où vient la houle</small><b>Surtout ${esc(M.DIR_FROM[main])}</b><span>${max} % des relevés au large sur l’année, période moyenne ${num(avg(w.tp), 0)} s.</span></div></div>`;
  }
  const avg = a => { const v = (a || []).filter(x => x != null); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : null; };

  function table(c) {
    const a = c.air || {}, w = c.wave;
    const rows = [
      ['Eau (°C)', c.sea, 1], ['Air max (°C)', a.tx, 0], ['Air min (°C)', a.tn, 0], ['Soleil (h/j)', a.sun, 0], ['Jours de pluie', a.wet, 0], ['Pluie (mm)', a.rain, 0],
      ['Vent (km/h)', a.wind, 0], ['Jours ventés (%)', a.kite, 0], ['Houle (m)', w && w.hs, 1], ['Houle forte, 1 jour sur 10 (m)', w && w.p90, 1], ['Période (s)', w && w.tp, 0]
    ].filter(r => r[1] && r[1].some(v => v != null));
    return `<details class="sd-table"><summary>${icon(I.table)}Voir le tableau des normales</summary><div class="sd-table-scroll"><table><thead><tr><th scope="col"></th>${Array.from({ length: 12 }, (_, m) => `<th scope="col">${esc(monthName(m, 'short'))}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r[1].map(v => `<td>${esc(num(v, r[2]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }

  function sources(c) {
    const a = c.air, w = c.wave, parts = [];
    if (c.sea) parts.push('température de l’eau : NOAA OISST, moyennes 1991-2020');
    if (a) parts.push(`air, pluie, vent et soleil : NASA POWER, ${a.yrs[0]}-${a.yrs[1]}`);
    if (w) parts.push(w.src === 'era5' ? `houle : ERA5 (Copernicus) via Open-Meteo, ${w.yrs[0]}-${w.yrs[1]}` : `houle : modèle WaveWatch III (NOAA, PacIOOS), ${w.yrs[0]}-${w.yrs[1]}`);
    return `<p class="sd-src">Normales calculées sur plusieurs années pour le secteur du spot : ${esc(parts.join(' ; '))}. Le soleil est estimé à partir du rayonnement mesuré par satellite. La houle est celle du large : la plage peut être plus abritée ou plus exposée. Ce sont des tendances, pas une prévision : regarde l’onglet Conditions avant d’y aller.</p>`;
  }

  function renderSeasons(s, c) {
    const host = $('#dSeasons'); if (!host) return;
    if (!c) { host.innerHTML = '<p class="sd-empty">Les normales climatiques de ce spot ne sont pas encore disponibles.</p>'; return; }
    const acts = typeof spotSports === 'function' ? spotSports(s) : s.sports;
    if (!selAct || !acts.includes(selAct)) selAct = curAct(s);
    host.innerHTML = `<header class="sd-head"><p class="sd-kicker">${icon(I.cal)}Quand partir ?</p><h3>L’année à ${esc(String(s.name).split(' — ')[0])}</h3><p>Mois par mois, ce que la mer et le ciel font d’habitude ici.</p></header>
      ${calendar(s, c)}${monthCard(s, c)}${charts(c)}${rose(c)}${table(c)}${sources(c)}`;
  }

  /* Aperçu dans « Le spot » et repère dans l’en-tête */
  function renderTeaser(s, c) {
    let host = $('#dSeasonTeaser');
    const infos = $('#detail .dcat[data-cat="infos"]');
    if (!host && infos) { host = document.createElement('section'); host.id = 'dSeasonTeaser'; host.className = 'sd-teaser'; infos.prepend(host); }
    if (!host) return;
    if (!c) { host.hidden = true; return; }
    const act = curAct(s), y = M.year(c, act, s.level), b = M.best(y), now = new Date().getMonth();
    if (!y.some(v => v != null)) { host.hidden = true; return; }
    host.hidden = false;
    const sea = c.sea ? `<span class="sd-chip">${icon(I.temp)}Eau ${num(Math.min(...c.sea))}–${num(Math.max(...c.sea))} °C</span>` : '';
    const lnow = M.level(y[now]);
    host.innerHTML = `<button type="button" class="sd-teaser-btn" data-sd-open aria-label="Voir les saisons du spot">
      <span class="sd-teaser-tx"><small>${icon(I.cal)}Quand partir ? · ${esc(sportLabel(act))}</small><b>${b.ranges.length ? esc(cap(rangeText(b.ranges))) : 'Selon les conditions du jour'}</b>
      <span class="sd-teaser-strip" aria-hidden="true">${y.map((v, m) => `<i class="l${M.level(v) ?? 'x'}${m === now ? ' now' : ''}"></i>`).join('')}</span>
      <span class="sd-teaser-meta">${lnow != null ? `<span class="sd-chip l${lnow}">En ${esc(monthName(now))} : ${esc(LEVEL_TXT[lnow].toLowerCase())}</span>` : ''}${sea}</span></span>
      <span class="sd-teaser-go">${icon(I.arrow)}</span></button>`;
    // Repère dans l’en-tête de la fiche
    const facts = $('#dFacts');
    if (facts && c.sea) {
      facts.querySelector('.dfact-sea')?.remove();
      facts.insertAdjacentHTML('beforeend', `<span class="dfact dfact-sea">${icon(I.temp)}Eau ≈ ${num(c.sea[now])} °C en ${esc(monthName(now))}</span>`);
    }
  }
  const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;

  /* ---------------- Y aller ---------------- */
  function tzOffsetMin(tz, date) {
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(date);
      const g = t => +p.find(x => x.type === t).value;
      return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - date.getTime()) / 6e4;
    } catch (e) { return null; }
  }
  function hm(utcHours, offMin) {
    if (utcHours == null) return '–';
    let t = Math.round(utcHours * 60 + (offMin || 0)); t = ((t % 1440) + 1440) % 1440;
    const d = new Date(Date.UTC(2026, 0, 1, Math.floor(t / 60), t % 60));
    return new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(d);
  }
  function renderGo(s, acc) {
    let host = $('#dGo');
    const prep = $('#detail .dcat[data-cat="activites"]');
    if (!host && prep) { host = document.createElement('section'); host.id = 'dGo'; host.className = 'sd-go'; prep.prepend(host); }
    if (!host) return;
    const a = acc && acc.spots[s.id];
    if (!a) { host.hidden = true; return; }
    host.hidden = false;
    const now = new Date(), off = a.tz ? tzOffsetMin(a.tz, now) : null, mine = -now.getTimezoneOffset();
    const local = a.tz ? new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit', weekday: 'short', timeZone: a.tz }).format(now) : null;
    const diff = off == null ? null : Math.round((off - mine) / 30) / 2;
    const diffTxt = diff == null ? '' : diff === 0 ? 'même heure que toi' : `${diff > 0 ? '+' : '−'}${num(Math.abs(diff), Math.abs(diff) % 1 ? 1 : 0)} h par rapport à toi`;
    const c = (typeof COORDS !== 'undefined' && COORDS[s.id]) || s.coords;
    const st = c ? M.sunTimes(now, c.lat, c.lon) : null;
    const ci = acc.countries[a.cc] || {};
    let cur = '', lng = '';
    try { cur = (ci.cur || []).map(k => `${new Intl.DisplayNames([lang()], { type: 'currency' }).of(k)} (${k})`).join(' · '); } catch (e) { cur = (ci.cur || []).join(' · '); }
    try { lng = (ci.lang || []).map(k => new Intl.DisplayNames([lang()], { type: 'language' }).of(k)).join(' · '); } catch (e) { lng = ''; }
    const ap = (a.ap || []).slice(0, 3).map((p, i) => `<li class="${i === 0 ? 'first' : ''}"><span class="sd-iata"${NT}>${esc(p[0])}</span><span class="sd-ap"><b${NT}>${esc(p[1])}</b><small${NT}>${esc(p[2] || '')}</small></span><span class="sd-km">${num(p[3])} km${p[4] ? '<em>international</em>' : ''}</span></li>`).join('');
    const flights = a.ap && a.ap[0] ? `<a class="sd-link" href="https://www.google.com/travel/flights?q=${encodeURIComponent('Flights to ' + a.ap[0][0])}" target="_blank" rel="noopener noreferrer">${icon(I.plane)}Chercher un vol vers ${esc(a.ap[0][0])}${icon(I.ext, 'sm')}</a>` : '';
    host.innerHTML = `<header class="sd-head small"><p class="sd-kicker">${icon(I.plane)}Y aller</p><h3>Le voyage jusqu’au spot</h3></header>
      ${ap ? `<ul class="sd-airports" aria-label="Aéroports les plus proches">${ap}</ul>${flights}` : ''}
      <div class="sd-facts">
        ${local ? `<div>${icon(I.clock)}<small>Heure locale</small><b>${esc(local)}</b><span>${esc(diffTxt)}</span></div>` : ''}
        ${st ? `<div>${icon(I.sun)}<small>Soleil aujourd’hui</small><b>${esc(hm(st.rise, off))} → ${esc(hm(st.set, off))}</b><span>${num((st.set - st.rise), 1)} h de jour</span></div>` : ''}
        ${cur ? `<div>${icon(I.coin)}<small>Monnaie</small><b>${esc(cur)}</b></div>` : ''}
        ${lng ? `<div>${icon(I.talk)}<small>Langue</small><b>${esc(lng)}</b>${ci.tel ? `<span${NT}>${esc(ci.tel)}</span>` : ''}</div>` : ''}
      </div>
      <p class="sd-src">Distances à vol d’oiseau depuis le secteur du spot. Aéroports avec vols réguliers : OurAirports (domaine public). Vérifie les liaisons et les formalités d’entrée avant de réserver.</p>`;
  }

  /* ---------------- Observé ici (faune) ---------------- */
  const IUCN = { CR: 'En danger critique', EN: 'En danger', VU: 'Vulnérable', NT: 'Quasi menacée' };
  function spName(t) {
    if (isFr()) return t.fr || t.en || t.sci;
    const l = window.OB_I18N && OB_I18N.lang;
    return (t.n && t.n[l]) || t.en || t.sci;
  }
  function renderWild(s, W) {
    let host = $('#dWild');
    const tab = $('#detail .dcat[data-cat="faune"]');
    if (!host && tab) { host = document.createElement('section'); host.id = 'dWild'; host.className = 'sd-wild'; tab.prepend(host); }
    if (!host) return;
    const w = W && W.spots[s.id];
    if (!w || !w.sp || w.sp.length < 3) { host.hidden = true; return; }
    host.hidden = false;
    const T = W.taxa;
    const list = w.sp.map(r => ({ t: T[r[0]], id: r[0], c: r[1], h: r[2] })).filter(o => o.t);
    const shown = list.filter(o => o.t.p).slice(0, 12);
    const flags = list.filter(o => o.h && o.h.some(v => v > 0)).slice(0, 3);
    const c = (typeof COORDS !== 'undefined' && COORDS[s.id]) || s.coords;
    const more = `https://www.inaturalist.org/observations?lat=${c.lat}&lng=${c.lon}&radius=${w.r}&quality_grade=research&subview=grid`;
    const card = o => {
      const st = IUCN[o.t.i];
      return `<li class="sd-sp"><figure><img src="${esc(o.t.p[0])}" alt="${esc(spName(o.t))}" loading="lazy" decoding="async" referrerpolicy="no-referrer">${st ? `<span class="sd-iucn i-${o.t.i}">${esc(st)}</span>` : ''}</figure>
        <div><b${isFr() ? '' : NT}>${esc(spName(o.t))}</b><i${NT}>${esc(o.t.s)}</i><small>${num(o.c)} observation${o.c > 1 ? 's' : ''}</small></div>
        <span class="sd-credit"${NT}>${esc(o.t.p[1] || '')}</span></li>`;
    };
    const flagRow = o => {
      const max = Math.max(...o.h, 1), b = M.best(o.h.map(v => v / max)), peak = o.h.indexOf(max);
      const months = o.h.map(v => v / max >= .5 ? 1 : 0), rng = M.ranges(months.map((v, m) => v ? m : -1).filter(m => m >= 0));
      void b;
      return `<li class="sd-flag"><span class="sd-flag-name"><b${isFr() ? '' : NT}>${esc(spName(o.t))}</b><small>surtout ${esc(rangeText(rng) || monthName(peak))}</small></span>
        <span class="sd-spark" role="img" aria-label="Observations par mois, pic en ${esc(monthName(peak))}">${o.h.map((v, m) => `<i style="height:${Math.max(6, Math.round(100 * v / max))}%" class="${m === peak ? 'pk' : ''}"></i>`).join('')}</span></li>`;
    };
    host.innerHTML = `<header class="sd-head small"><p class="sd-kicker">${icon(I.eye)}Observé ici</p><h3>La vraie faune du coin</h3><p>Des espèces photographiées et identifiées par des plongeurs, nageurs et naturalistes autour du spot.</p></header>
      <div class="sd-stats"><div><b>${num(w.n)}</b><small>espèces aquatiques observées à moins de ${num(w.r)} km</small></div>${w.o ? `<div><b>${num(w.o)}</b><small>espèces marines recensées par les scientifiques (OBIS)</small></div>` : ''}</div>
      ${flags.length ? `<div class="sd-flags"><h5>Quand les voir ?</h5><ul>${flags.map(flagRow).join('')}</ul></div>` : ''}
      <ul class="sd-species">${shown.map(card).join('')}</ul>
      <a class="sd-link" href="${esc(more)}" target="_blank" rel="noopener noreferrer">${icon(I.fish)}Toutes les observations sur iNaturalist${icon(I.ext, 'sm')}</a>
      <p class="sd-src">Observations « niveau recherche » d’iNaturalist (identifications confirmées par la communauté) et Ocean Biodiversity Information System. Ce qu’on y a vu, pas une promesse de rencontre : la faune bouge avec la saison et la météo. Photos sous licence libre, crédits sur chaque image.</p>`;
  }

  /* ---------------- Interactions ---------------- */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-sd-month]');
    if (m && $('#dSeasons')?.contains(m)) { selMonth = +m.dataset.sdMonth; if (m.dataset.sdAct) selAct = m.dataset.sdAct; refresh(); return; }
    const st = e.target.closest('[data-sd-step]');
    if (st) { selMonth = (selMonth + (+st.dataset.sdStep) + 12) % 12; refresh(); return; }
    if (e.target.closest('[data-sd-open]')) { typeof showDetailCat === 'function' && showDetailCat('saisons'); }
  });
  /* Sur ordinateur, survoler une colonne choisit le mois. */
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const m = e.target.closest?.('.sd-hit');
    if (m && +m.dataset.sdMonth !== selMonth) { selMonth = +m.dataset.sdMonth; refresh(true); }
  });
  function refresh(keepFocus) {
    if (!cur || !window.OCEAN_CLIMATE) return;
    const c = OCEAN_CLIMATE.spots[cur.id];
    const host = $('#dSeasons'); if (!host || !c) return;
    const open = host.querySelector('.sd-table')?.open;
    host.querySelector('.sd-month')?.replaceWith(htmlNode(monthCard(cur, c)));
    host.querySelector('.sd-charts')?.replaceWith(htmlNode(charts(c)));
    host.querySelectorAll('.sd-cell').forEach(b => b.classList.toggle('sel', +b.dataset.sdMonth === selMonth && b.dataset.sdAct === (selAct || curAct(cur))));
    if (open) host.querySelector('.sd-table').open = true;
    void keepFocus;
  }
  const htmlNode = h => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => refresh(true), 200); });

  function update(s) {
    cur = s; selMonth = new Date().getMonth(); selAct = null;
    ['#dSeasonTeaser', '#dGo', '#dWild'].forEach(k => { const e = $(k); if (e) e.hidden = true; });
    const host = $('#dSeasons'); if (host) host.innerHTML = '<p class="sd-empty">Chargement des normales…</p>';
    load('climate').then(C => { if (cur !== s) return; const c = C.spots[s.id]; renderSeasons(s, c); renderTeaser(s, c); if (lastLive && lastLive.s === s) live(s, lastLive.l); })
      .catch(() => { if (host) host.innerHTML = '<p class="sd-empty">Normales indisponibles hors connexion.</p>'; });
    load('access').then(A => { if (cur === s) renderGo(s, A); }).catch(() => {});
    load('wild').then(W => { if (cur === s) renderWild(s, W); }).catch(() => {});
  }
  /* Conditions du moment comparées à la normale du mois (onglet Conditions). */
  let lastLive = null;
  function live(s, l) {
    lastLive = { s, l };
    const C = window.OCEAN_CLIMATE;
    let host = $('#sdVsNormal');
    const w = $('#dWeather');
    if (!host && w) { host = document.createElement('div'); host.id = 'sdVsNormal'; host.className = 'sd-vs'; w.after(host); }
    if (!host) return;
    const c = C && C.spots[s.id], m = new Date().getMonth();
    const parse = v => { const x = parseFloat(String(v || '').replace(',', '.')); return Number.isFinite(x) ? x : null; };
    const t = parse(l && l.temp), h = parse(l && l.swell), rows = [];
    if (c && c.sea && t != null) {
      const d = Math.round((t - c.sea[m]) * 10) / 10;
      rows.push([I.temp, `Eau ${num(t, 0)} °C`, Math.abs(d) < 1 ? `proche de la normale de ${monthName(m)} (${num(c.sea[m])} °C)` : `${d > 0 ? '+' : '−'}${num(Math.abs(d), 0)} °C par rapport à la normale de ${monthName(m)} (${num(c.sea[m])} °C)`, d >= 1 ? 'up' : d <= -1 ? 'down' : '']);
    }
    if (c && c.wave && h != null) {
      const n = c.wave.hs[m], r = n ? h / n : 1;
      rows.push([I.wave, `Houle ${num(h, 1)} m`, r > 1.35 ? `plus forte que d’habitude en ${monthName(m)} (moyenne ${num(n, 1)} m)` : r < 0.65 ? `plus calme que d’habitude en ${monthName(m)} (moyenne ${num(n, 1)} m)` : `dans la moyenne de ${monthName(m)} (${num(n, 1)} m)`, r > 1.35 ? 'up' : r < 0.65 ? 'down' : '']);
    }
    host.hidden = !rows.length;
    host.innerHTML = rows.length ? `<p class="sd-vs-title">Aujourd’hui, comparé à la normale</p>${rows.map(r => `<div class="sd-vs-row ${r[3]}">${icon(r[0])}<span><b>${esc(r[1])}</b><small>${esc(r[2])}</small></span></div>`).join('')}` : '';
  }

  /* Changement d’activité sur la fiche : le calendrier suit. */
  function sport() { if (!cur || !window.OCEAN_CLIMATE) return; selAct = null; const c = OCEAN_CLIMATE.spots[cur.id]; renderSeasons(cur, c); renderTeaser(cur, c); }

  window.OceanSpotData = { load, update, sport, live, monthName, rangeText };
})();
