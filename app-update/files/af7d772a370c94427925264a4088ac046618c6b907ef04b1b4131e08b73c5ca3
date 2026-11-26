/* Fiche spot v2 (18 nov. 2026) : panneau « Maintenant » en tête de l’onglet Conditions, points de danger de l’onglet
   Sécurité, tête de cet onglet (niveau de danger et danger principal) et pastille « adapté à ton niveau » des cartes.
   L’ancien bandeau « Avant d’y aller », posé entre la photo et les onglets, n’est plus affiché (demande du fondateur) :
   ce qu’il disait vit dans les onglets. Le module garde son nom d’interface (OceanBefore) : les autres modules lui
   passent déjà leurs données.
   Il ne fait AUCUN appel réseau et n’invente aucune donnée : il relit ce que la fiche a déjà chargé ou calculé.
     - conditions du moment : LIVE[id] rempli par fetchConditions (app.js, OceanBefore.live) ;
     - écart à la normale du mois : spot-data.js, quand les normales sont chargées (OceanBefore.normal) ;
     - créneau du jour : calculé par spot-experience.js pour la météo de la fiche (OceanBefore.slot) ;
     - niveau et jauge de danger : catalogue + dangerGauge (app.js), comparés au niveau des Réglages (SpotFitModel.fit).
   Chaque relevé garde sa place pendant le chargement (pas de saut dans la fiche). La fiche s’ouvre après la levée du
   rideau : ce module ne touche ni à l’accueil ni à la barre d’onglets de l’app. */
(() => {
  'use strict';
  const F = window.SpotFitModel;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const LABEL = {fit: 'Adapté à ton niveau', stretch: 'Exigeant pour ton niveau', above: 'Au-dessus de ton niveau'};
  const LEVEL = {debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert'};
  let spot = null, host = null, headHost = null, normals = null;

  const userLevel = () => { try { if (typeof chosenLevel !== 'undefined' && chosenLevel) return chosenLevel; } catch (e) {} return null; };
  const gaugeOf = s => { try { return typeof dangerGauge === 'function' ? dangerGauge(s) : {n: null}; } catch (e) { return {n: null}; } };
  const fitOf = s => F ? F.fit(s && s.level, gaugeOf(s).n, userLevel()) : null;
  const inland = s => { try { return typeof isInland === 'function' ? isInland(s) : false; } catch (e) { return false; } };

  /* Pastille des cartes de spot (spotCard) : rien quand le repère n’a rien à affirmer. Posée sur la photo, en absolu :
     elle ne change pas la hauteur de la carte. */
  function cardPill(s) {
    const r = fitOf(s);
    if (!F || !F.shown(r)) return '';
    return `<span class="fit-pill fit-${r.kind} is-card" title="Repère d’après ton niveau et la jauge de danger">${esc(LABEL[r.kind])}</span>`;
  }

  /* Le panneau « Maintenant » est le premier bloc de l’onglet Conditions ; le sélecteur d’activité (spot-immersion.js,
     affiché seulement quand le spot en a plusieurs) est rangé juste au-dessus, dans le même onglet. */
  function ensure() {
    if (host && host.isConnected) return host;
    const panel = $('#detail .dcat[data-cat="meteo"]'); if (!panel) return null;
    host = document.createElement('section');
    host.id = 'dNow'; host.className = 'fx-now'; host.setAttribute('aria-labelledby', 'dNowTitle');
    panel.prepend(host);
    return host;
  }
  function arrange() {
    const panel = $('#detail .dcat[data-cat="meteo"]'), context = $('#immersionContext');
    if (panel && context && context.parentNode !== panel) panel.prepend(context);
  }
  /* Tête de l’onglet Sécurité : le niveau de danger et le danger principal, en entier, avant tout le reste. */
  function ensureHead() {
    if (headHost && headHost.isConnected) return headHost;
    const panel = $('#detail .dcat[data-cat="securite"]'); if (!panel) return null;
    headHost = document.createElement('section');
    headHost.id = 'dDanger'; headHost.className = 'fx-danger'; headHost.setAttribute('aria-labelledby', 'dDangerTitle');
    panel.prepend(headHost);
    return headHost;
  }

  /* Onglet Sécurité, d’un toucher (alerte de l’onglet Conditions, liste « Avant de partir »). */
  function openSafety() { if (typeof showDetailCat === 'function') showDetailCat('securite'); }

  const dotsInner = n => { let h = ''; for (let i = 0; i < 4; i++) h += `<i class="${n != null && i < n ? 'on' : ''}"></i>`; return h; };
  const dots = n => `<span class="fx-dots" aria-hidden="true">${dotsInner(n)}</span>`;

  /* L’invitation au niveau, d’un toucher : elle ouvre « Mon sport et mon niveau ». Un seul composant et un seul libellé,
     repris tels quels par « Ton meilleur créneau » (onglet Prévisions, spot-experience.js). */
  const levelButton = () => '<button type="button" class="db-level" data-open-level>Choisis ton niveau</button>';

  const ICON = {
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 13.5h15.5a3 3 0 1 1-3 3M3 18h6"/>',
    wave: '<path d="M2 17c2 0 3-1.6 5-1.6S10 17 12 17s3-1.6 5-1.6S20 17 22 17"/><path d="M3 12.4c2.2-4.4 6.6-6.2 10.8-4.8-2 .6-3.1 2.4-2.6 4.8"/>',
    temp: '<path d="M10 13.6V5a2 2 0 1 1 4 0v8.6a4 4 0 1 1-4 0z"/><path d="M12 9.5v6"/>',
    tide: '<path d="M2 8c2 0 3-1.5 5-1.5S10 8 12 8s3-1.5 5-1.5S20 8 22 8M2 13c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5M2 18c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>'
  };
  const icon = k => `<svg class="fx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  /* Un relevé : pictogramme, libellé, grand chiffre et unité, puis une sous-ligne facultative (écart à la normale). */
  function reading(key, label, num, unit, sub) {
    return `<div class="fx-reading" data-reading="${key}">${icon(key)}<span class="fx-label">${label}</span>`
      + `<span class="fx-value">${num}${unit ? `<span class="fx-unit">${unit}</span>` : ''}</span>`
      + `<small class="fx-sub" data-reading-sub="${key}">${sub ? esc(sub) : ''}</small></div>`;
  }
  /* Place réservée pendant le chargement : mêmes cases, même hauteur que les relevés. */
  function waiting(s) {
    const bar = '<span class="fx-num fx-wait" aria-hidden="true"></span>';
    if (inland(s)) return reading('wind', 'Vent', bar, '') + inlandNote();
    return reading('wind', 'Vent', bar, '') + reading('wave', 'Houle', bar, '') + reading('temp', 'Eau', bar, '') + reading('tide', 'Marée', bar, '');
  }
  const inlandNote = () => '<p class="fx-reading-note">Plan d’eau intérieur : ni houle marine, ni marée océanique.</p>';

  /* Ouverture du parcours (20 nov.) : trois chiffres du moment posés sur la photo, sur verre dépoli. Mer : houle, eau,
     danger. Plan d’eau intérieur : vent et danger (ni houle marine, ni température d’eau en direct). Les cases gardent
     leur place pendant le chargement ; les valeurs viennent de LIVE, les mêmes que « Maintenant ». Le danger n’attend pas
     le relevé. data-hx-count : le chiffre compte jusqu’à sa valeur à l’arrivée (app.js). */
  const hxChip = (key, label, value, unit, extra) => `<span class="hx-chip" data-hx="${key}">${key === 'danger' ? '' : icon(key)}<span class="hx-tx"><b class="hx-val">${value}${unit ? `<small>${unit}</small>` : ''}</b><span class="hx-lab">${label}</span></span>${extra || ''}</span>`;
  const hxWait = '<span class="hx-wait" aria-hidden="true"></span>';
  /* Les sports pour lesquels la houle compte (la même liste que la tuile « Houle en novembre » du chapitre Le coin). */
  const WAVE_SPORTS = ['surf', 'bodyboard', 'kitesurf', 'windsurf', 'wingfoil', 'foil'];
  const waveSpot = s => { let l = []; try { l = typeof spotSports === 'function' ? spotSports(s) : (s.sports || []); } catch (e) { l = s.sports || []; } return !l.length || l.some(a => WAVE_SPORTS.includes(a)); };
  function hero(s, l) {
    const el = $('#dHeroNow'); if (!el) return;
    if (!s || s.custom) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    const split = v => { const m = has(v) ? /^\s*([-−]?\d+(?:[.,]\d+)?)\s*(.*)$/.exec(String(v)) : null; return m ? [m[1], m[2]] : null; };
    const num = p => `<span data-hx-count>${esc(p[0])}</span>`;
    const ready = !!(l && l.live), g = gaugeOf(s), chips = [];
    /* « 15 km/h S » : le chiffre et son unité ; la direction passe dans le libellé (« Vent S ») pour que la case tienne sur une ligne. */
    const wind = () => { const w = ready ? split(l.wind) : null, m = w ? /^(km\/h)\s*(.*)$/.exec(w[1]) : null; chips.push(hxChip('wind', m && m[2] ? `<span>Vent</span> <span translate="no" data-no-i18n>${esc(m[2])}</span>` : 'Vent', ready ? (w ? num(w) : '—') : hxWait, w ? esc(m ? m[1] : w[1]) : '')); };
    if (inland(s)) {
      /* Plan d’eau : le vent, puis l’air du moment quand le relevé le donne (ni houle marine, ni eau en direct). */
      wind();
      if (ready && Number.isFinite(l.airC)) chips.push(hxChip('temp', 'Air', num([String(Math.round(l.airC))]), '°C'));
    } else {
      const sw = ready ? split(l.swell) : null, te = ready ? split(l.temp) : null;
      /* Spot sans sport de vague ni de vent (plongée, snorkeling, baignade) : la houle au large n’y dit rien d’utile
         (Tulamben : 0,5 m). Le vent du moment la remplace ; c’est le même relevé que « Maintenant ». */
      if (waveSpot(s)) chips.push(hxChip('wave', 'Houle', ready ? (sw ? num(sw) : '—') : hxWait, sw ? esc(sw[1]) : ''));
      else wind();
      chips.push(hxChip('temp', 'Eau', ready ? (te ? num(te) : '—') : hxWait, te ? esc(te[1]) : ''));
    }
    if (g.n != null) chips.push(`<button type="button" class="hx-chip hx-danger" data-hx="danger" data-fx-tab="securite" aria-label="Danger ${g.n} sur 4, voir la sécurité"><span class="hx-tx"><b class="hx-val"><span data-hx-count>${g.n}</span><small>/4</small></b><span class="hx-lab">Danger</span></span>${dots(g.n)}</button>`);
    el.className = 'hx-now'; el.classList.add('hx-n' + chips.length);
    el.innerHTML = chips.join('');
    try { document.dispatchEvent(new CustomEvent('ocean:hero-now', {detail: {id: s.id, ready}})); } catch (e) {}
  }

  function alertLine(s) {
    const g = gaugeOf(s), d = F ? F.mainDanger(s) : null;
    if (g.n == null || g.n < 3) return '';
    /* Phrase entière, jamais coupée ; elle mène à l’onglet Sécurité. */
    return `<button type="button" class="fx-alert" data-fx-tab="securite"><span class="fx-alert-top">${dots(g.n)}<b>Danger ${g.n} sur 4</b><span class="fx-alert-go">Voir la sécurité</span></span>${d ? `<span class="fx-alert-tx">${esc(d.text)}</span>` : ''}</button>`;
  }

  function render(s) {
    arrange();
    const el = ensure(); if (!el) return;
    spot = s; normals = null;
    el.innerHTML = alertLine(s)
      + '<div class="fx-head"><h3 class="fx-title" id="dNowTitle">Maintenant</h3><small class="fx-stamp" data-before-stamp></small></div>'
      + `<div class="fx-row" data-before="live"><div class="db-v fx-readings db-wait">${waiting(s)}</div></div>`
      + `<div class="fx-slot" data-before="slot">${icon('sun')}<span class="fx-slot-k">Ton créneau</span><span class="db-v db-wait">Chargement…</span></div>`;
    const L = typeof LIVE !== 'undefined' ? LIVE[s.id] : null;
    hero(s, L && L.live ? L : null);
    if (L && L.live) live(s, L);
    if (typeof COORDS !== 'undefined' && !COORDS[s.id]) { setRow('live', '<p class="fx-reading-note">Position non vérifiée : pas de prévision pour ce spot.</p>'); setRow('slot', '<span class="db-muted">Indisponible</span>'); }
    renderHead(s);
    tabDots(s);
  }

  /* Onglet Sécurité : points de danger posés sur l’onglet lui-même, lus aussi par les lecteurs d’écran. */
  function tabDots(s) {
    const tab = $('#dTabs .dtab[data-cat="securite"]'), slot = $('#dTabDanger'); if (!tab || !slot) return;
    const g = gaugeOf(s);
    slot.innerHTML = g.n == null ? '' : dotsInner(g.n);
    slot.hidden = g.n == null;
    if (g.n == null) tab.removeAttribute('aria-label'); else tab.setAttribute('aria-label', `Sécurité, danger ${g.n} sur 4`);
  }

  function renderHead(s) {
    const el = ensureHead(); if (!el) return;
    const g = gaugeOf(s), d = F ? F.mainDanger(s) : null, r = fitOf(s), lv = userLevel();
    const title = g.n == null ? 'Danger non évalué' : `Danger ${g.n} sur 4`;
    const text = d ? `<p class="fx-danger-text">${esc(d.text)}</p>${d.basis === 'carnet' ? '<small class="fx-note">Carnet Ocean Buddy, non vérifié</small>' : ''}`
      : g.n == null ? '<p class="fx-danger-text">Renseigne-toi sur place avant d’entrer dans l’eau.</p>' : '';
    let fit = '';
    if (r && F && F.shown(r)) fit = `<p class="fx-fit"><span class="fit-pill fit-${r.kind}">${esc(LABEL[r.kind])}</span><small class="fx-note">D’après ton niveau (${esc(LEVEL[lv] || '')}) : un repère, pas une garantie.</small></p>`;
    else if (r && r.kind === 'zones') fit = '<p class="fx-note">Le niveau change selon la zone : demande sur place laquelle te correspond.</p>';
    /* Onglet Sécurité : un bouton court (pastille), pas le grand cadre des Conditions. Même action (data-open-level). */
    else if (!r || r.kind === 'nolevel') fit = '<p class="fx-fit"><button type="button" class="db-level sx-level" data-open-level>Choisis ton niveau</button></p>';
    el.innerHTML = `<div class="fx-danger-head"><h3 class="fx-title" id="dDangerTitle">${title}</h3>${g.n == null ? '' : dots(g.n)}</div>${text}${fit}`
      + (g.n == null ? '' : '<small class="fx-note">Points de danger : estimation Ocean Buddy d’après les dangers listés.</small>');
  }

  function setRow(key, html) {
    if (!host) return;
    const v = host.querySelector(`[data-before="${key}"] .db-v`); if (!v) return;
    v.classList.remove('db-wait'); v.innerHTML = html;
  }
  const same = s => spot && s && spot.id === s.id;

  /* Heure du relevé (LIVE[id].fetchedAt) : « Relevé à 14 h 05 », ou la date si ce n’est pas aujourd’hui (« Relevé le 17 nov. »).
     Une fiche déjà vue garde ses dernières valeurs, hors ligne compris : elles ne passent jamais pour celles du moment. */
  function stamp(t, now = Date.now()) {
    if (!Number.isFinite(t)) return '';
    const d = new Date(t);
    if (d.toDateString() !== new Date(now).toDateString()) return `Relevé le ${d.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}`;
    const fr = !window.OB_I18N || /^fr/.test(window.OB_I18N.lang || 'fr');
    return `Relevé à ${fr ? `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}` : d.toLocaleTimeString('fr-FR', {hour: 'numeric', minute: '2-digit'})}`;
  }

  /* Conditions du moment : les valeurs de LIVE (modèle Open-Meteo), sans nouvel appel, en quatre relevés à grands
     chiffres, avec l’heure de leur relevé à côté de « Maintenant ». La hauteur réservée ne change pas. */
  const has = v => v && v !== '—';
  const none = '<span class="fx-num is-none">—</span>';
  const big = v => `<span class="fx-num">${esc(v)}</span>`;
  function live(s, l) {
    if (!same(s)) return;
    hero(s, l);
    const st = host && host.querySelector('[data-before-stamp]');
    if (st) st.textContent = l && l.live ? stamp(l.fetchedAt) : '';
    if (!l || !l.live) { setRow('live', '<p class="fx-reading-note">Prévision indisponible pour le moment</p>'); return; }
    /* « 20 km/h SO » : le chiffre en grand, l’unité et la direction en petit. */
    const w = has(l.wind) ? /^\s*(\d+(?:[.,]\d+)?)\s*(km\/h)\s*(.*)$/.exec(String(l.wind)) : null;
    /* « 3,9 m », « 17 °C » : le nombre (signe et décimale compris), puis l’unité. */
    const split = v => { const m = has(v) ? /^\s*([-−]?\d+(?:[.,]\d+)?)\s*(.*)$/.exec(String(v)) : null; return m ? [m[1], m[2]] : null; };
    const wind = w ? reading('wind', 'Vent', big(w[1]), esc(`${w[2]}${w[3] ? ' ' + w[3] : ''}`)) : reading('wind', 'Vent', has(l.wind) ? big(l.wind) : none, '');
    if (inland(s)) { setRow('live', wind + inlandNote()); return; }
    const sw = split(l.swell), period = Number.isFinite(l.periodS) ? ` (${Math.round(l.periodS)} s)` : '';
    const te = split(l.temp);
    const n = normals && normals.id === s.id ? normals : {};
    setRow('live', wind
      + (sw ? reading('wave', 'Houle', big(sw[0]), esc(sw[1] + period), n.swell) : reading('wave', 'Houle', none, '', ''))
      + (te ? reading('temp', 'Eau', big(te[0]), esc(te[1]), n.sea) : reading('temp', 'Eau', none, '', ''))
      + reading('tide', 'Marée', has(l.tide) ? `<span class="fx-word">${esc(l.tide)}</span>` : none, '', ''));
  }

  /* Écart à la normale du mois (spot-data.js, normales chargées) : une sous-ligne courte sous l’eau et la houle. */
  function normal(s, o) {
    if (!same(s)) return;
    normals = {id: s.id, sea: (o && o.sea) || '', swell: (o && o.swell) || ''};
    if (!host) return;
    const put = (k, t) => { const el = host.querySelector(`[data-reading-sub="${k}"]`); if (el && !el.closest('.db-wait')) el.textContent = t; };
    put('temp', normals.sea); put('wave', normals.swell);
  }

  /* Saison du mois : elle se lit dans l’onglet Saisons (spot-data.js). Gardé pour les appelants, sans affichage ici. */
  function season() {}

  /* Créneau d’aujourd’hui, calculé par spot-experience.js (rule = SpotWeatherModel.rule, today = bestSlot du jour).
     caution : l’avertissement de vent de terre du créneau, repris en entier quand il s’applique (jamais coupé). */
  function slot(s, rule, today, hourFmt, caution, tomorrow) {
    if (!same(s)) return;
    if (rule === null) { setRow('slot', '<span class="db-muted">Indisponible pour le moment</span>'); return; }
    const x = F ? F.slotSummary(rule, today) : {status: 'nodata'};
    const fmt = h => (typeof hourFmt === 'function' ? hourFmt(h) : h + ' h');
    if (x.status === 'ok') {
      const range = x.start === x.end ? fmt(x.start) : `de ${fmt(x.start)} à ${fmt(x.end)}`;
      setRow('slot', `<span>Aujourd’hui <b>${esc(range)}</b></span><span class="db-q is-${x.quality}">${x.quality === 'good' ? 'Dans tes repères' : 'Possible, sans plus'}</span>${caution ? `<p class="fx-caution">${esc(caution)}</p>` : ''}`);
      return;
    }
    if (x.status === 'norule' && x.reason === 'level') { setRow('slot', levelButton()); return; }
    /* Rien aujourd’hui : la même phrase que l’accueil, avec le créneau de demain quand il y en a un (« Pas aujourd’hui. Demain de 15 h à 17 h. »). */
    const y = x.status === 'none' && tomorrow && F ? F.slotSummary(rule, tomorrow) : null;
    const nextText = y && y.status === 'ok' ? (y.start === y.end ? fmt(y.start) : `de ${fmt(y.start)} à ${fmt(y.end)}`) : '';
    const why = nextText ? `Pas aujourd’hui. Demain ${nextText}.` : x.status === 'norule'
      ? (x.reason === 'expert' ? 'À juger toi-même heure par heure' : 'Pas de repère chiffré pour ce sport')
      : x.status === 'night' ? 'Plus d’heure de jour aujourd’hui'
      : x.status === 'none' ? 'Aucun aujourd’hui dans tes repères'
      : 'Prévision incomplète';
    setRow('slot', `<span class="db-muted">${esc(why)}</span>`);
  }

  /* Météo refusée même après la reprise automatique (le service météo répond parfois 503) : la case le dit en un mot, avec
     « Réessayer » (family : 'now' = conditions du moment, app.js ; 'week' = prévision de la semaine, spot-experience.js).
     Les relevés gardent leur hauteur (fiche.css) : aucune hauteur ne change. */
  function retry(s, key, family) {
    if (!same(s)) return;
    setRow(key, `<span class="db-muted">Indisponible</span><button type="button" class="ob-retry" data-weather-retry="${family === 'week' ? 'week' : 'now'}">Réessayer</button>`);
    oneRetry();
  }
  /* Un seul « Réessayer » dans la fiche, même quand les conditions du moment et la semaine échouent toutes les deux : le
     premier bouton reste, les autres sont masqués (chaque case garde « Indisponible »). Un toucher relance tout ce qui a
     échoué (délégations de clic d’app.js et de spot-experience.js). */
  function oneRetry() {
    try { document.querySelectorAll('#detail [data-weather-retry]').forEach((b, i) => { b.hidden = i > 0; }); } catch (e) {}
  }
  /* Toucher « Réessayer » : la case repasse à l’attente (seulement si elle montrait l’échec, jamais sur des données). */
  function wait(s, key) {
    if (!same(s) || !host) return;
    const v = host.querySelector(`[data-before="${key}"] .db-v`);
    if (!v || !v.querySelector('[data-weather-retry]')) return;
    v.classList.add('db-wait');
    if (key === 'live') v.innerHTML = waiting(s); else v.textContent = 'Chargement…';
  }

  function update(s) { try { render(s); } catch (e) { console.warn('maintenant', e); } }
  /* Niveau changé dans Réglages : la tête de Sécurité suit (le créneau est recalculé par spot-experience.js). */
  document.addEventListener('ocean:level', () => { try { if (spot && document.body.dataset.screen === 'detail') renderHead(spot); } catch (e) {} });

  /* Invitation au niveau (onglets Conditions, Prévisions et Sécurité) : Réglages ouverts sur « Mon sport et mon niveau ». */
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-open-level]')) return;
    try { if (typeof openSettings === 'function') openSettings('sport'); } catch (err) {}
  });
  /* Liens entre onglets de la fiche (alerte, « Toutes les prévisions ») : data-fx-tab porte le nom de l’onglet. */
  document.addEventListener('click', e => {
    const go = e.target.closest('#detail [data-fx-tab]'); if (!go) return;
    try { if (typeof showDetailCat === 'function') showDetailCat(go.dataset.fxTab); } catch (err) {}
  });

  window.OceanBefore = {update, live, normal, stamp, season, slot, cardPill, openSafety, levelButton, retry, wait, oneRetry};
})();
