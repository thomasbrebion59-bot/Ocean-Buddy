/* Fiche spot : bandeau « Avant d’y aller » (juste sous le titre) et pastille « adapté à ton niveau » des cartes.
   Le bandeau ne fait AUCUN appel réseau et n’invente aucune donnée : il relit ce que la fiche a déjà chargé ou calculé.
     - niveau et jauge de danger : catalogue + dangerGauge (app.js), comparés au niveau des Réglages (SpotFitModel.fit) ;
     - saison du mois : spot-data.js, quand les normales sont chargées (OceanBefore.season) ;
     - conditions du moment : LIVE[id] rempli par fetchConditions (app.js, OceanBefore.live) ;
     - meilleur créneau : calculé par spot-experience.js pour la météo de la fiche (OceanBefore.slot) ;
     - numéro d’urgence : countryEmergency (app.js), même source que l’onglet Conditions.
   Chaque ligne garde sa place pendant le chargement (pas de saut dans la fiche). La fiche s’ouvre après la levée du rideau :
   ce module ne touche ni à l’accueil ni à la barre d’onglets. */
(() => {
  'use strict';
  const F = window.SpotFitModel;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const LABEL = {fit: 'Adapté à ton niveau', stretch: 'Exigeant pour ton niveau', above: 'Au-dessus de ton niveau'};
  const LEVEL = {debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert'};
  let spot = null, host = null;

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

  function ensure() {
    if (host && host.isConnected) return host;
    const body = $('#detail .detail-body'); if (!body) return null;
    host = document.createElement('section');
    host.id = 'dBefore'; host.className = 'd-before'; host.setAttribute('aria-labelledby', 'dBeforeTitle');
    body.prepend(host);
    host.addEventListener('click', e => { if (e.target.closest('[data-before-safety]')) openSafety(); });
    return host;
  }

  /* « Sécurité & secours » : onglet Conditions, puis directement le bloc des dangers et du numéro d’urgence. */
  function openSafety() {
    if (typeof showDetailCat !== 'function') return;
    showDetailCat('meteo', false);
    const target = $('#detail .dcat[data-cat="securite"]'), wrap = $('#screenWrap'), tabs = $('#dTabs');
    if (!target || !wrap) return;
    requestAnimationFrame(() => {
      const chrome = $('.app-chrome'), top = (chrome ? chrome.getBoundingClientRect().height : 0) + (tabs ? tabs.getBoundingClientRect().height : 0) + 8;
      const y = wrap.scrollTop + target.getBoundingClientRect().top - wrap.getBoundingClientRect().top - top;
      const calm = document.body.classList.contains('reduce-motion') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      wrap.scrollTo({top: Math.max(0, y), behavior: calm ? 'auto' : 'smooth'});
      const h = target.querySelector('h4'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({preventScroll: true}); }
    });
  }

  function dots(n) { let h = ''; for (let i = 0; i < 4; i++) h += `<i class="${n != null && i < n ? 'on' : ''}"></i>`; return `<span class="db-dots" aria-hidden="true">${h}</span>`; }

  function fitBlock(s) {
    const r = fitOf(s), lv = userLevel();
    /* Une seule invitation, d’un toucher : elle ouvre « Mon sport et mon niveau » (la case « Ton créneau » ne la répète pas). */
    if (!r || r.kind === 'nolevel') return '<button type="button" class="db-level" data-open-level>Choisis ton niveau pour savoir si ce spot te correspond</button>';
    if (r.kind === 'unrated') return '<p class="db-note">Danger non évalué ici : renseigne-toi sur place avant d’entrer.</p>';
    if (r.kind === 'zones') return '<p class="db-note">Le niveau change selon la zone : demande sur place laquelle te correspond.</p>';
    return `<p class="db-note">D’après ton niveau (${esc(LEVEL[lv] || '')}) : un repère, pas une garantie.</p>`;
  }

  function dangerLine(s) {
    const g = gaugeOf(s), d = F ? F.mainDanger(s) : null;
    const gauge = g.n == null ? '<b>Danger non évalué</b>' : `${dots(g.n)}<b>${g.n} sur 4</b>`;
    const text = d ? `<span class="db-danger-text">${esc(d.text)}</span>${d.basis === 'carnet' ? '<small class="db-carnet">Carnet Ocean Buddy · non vérifié</small>' : ''}` : '';
    return `<div class="db-row db-danger" data-before="danger"><span class="db-k">Danger</span><span class="db-v"><span class="db-gauge" role="img" aria-label="${g.n == null ? 'Danger non évalué' : `Danger estimé : ${g.n} sur 4 · estimation Ocean Buddy`}">${gauge}</span>${text}</span></div>`;
  }

  function emergency(s) {
    let em = null; try { em = typeof countryEmergency === 'function' ? countryEmergency(s) : null; } catch (e) {}
    const call = em && em.call;
    const callBtn = call ? `<a class="db-btn db-call" href="tel:${esc(call)}">Appeler le ${esc(call)}</a>` : '<span class="db-nocall">Numéro d’urgence à confirmer sur place</span>';
    return `<div class="db-actions">${callBtn}<button type="button" class="db-btn db-safety" data-before-safety>Sécurité & secours</button></div>`;
  }

  function render(s) {
    const el = ensure(); if (!el) return;
    spot = s;
    const r = fitOf(s), pill = F && F.shown(r) ? `<span class="fit-pill fit-${r.kind}">${esc(LABEL[r.kind])}</span>` : '';
    el.innerHTML = `<div class="db-head"><h3 id="dBeforeTitle">Avant d’y aller</h3>${pill}</div>${fitBlock(s)}`
      + `<div class="db-rows">${dangerLine(s)}`
      + '<div class="db-row db-half" data-before="season"><span class="db-k">Saison</span><span class="db-v db-wait">Chargement…</span></div>'
      + '<div class="db-row db-half" data-before="slot"><span class="db-k">Ton créneau</span><span class="db-v db-wait">Chargement…</span></div>'
      + '<div class="db-row" data-before="live"><span class="db-k">Maintenant</span><span class="db-v db-wait">Chargement…</span></div></div>'
      + emergency(s);
    const L = typeof LIVE !== 'undefined' ? LIVE[s.id] : null;
    if (L && L.live) live(s, L);
    if (typeof COORDS !== 'undefined' && !COORDS[s.id]) { setRow('live', '<span class="db-muted">Position non vérifiée : pas de prévision</span>'); setRow('slot', '<span class="db-muted">Indisponible</span>'); }
  }

  function setRow(key, html) {
    if (!host) return;
    const v = host.querySelector(`[data-before="${key}"] .db-v`); if (!v) return;
    v.classList.remove('db-wait'); v.innerHTML = html;
  }
  const same = s => spot && s && spot.id === s.id;

  /* Conditions du moment : les valeurs de LIVE (modèle Open-Meteo), sans nouvel appel. */
  function live(s, l) {
    if (!same(s)) return;
    if (!l || !l.live) { setRow('live', '<span class="db-muted">Prévision indisponible pour le moment</span>'); return; }
    const has = v => v && v !== '—';
    const bits = [];
    if (has(l.wind)) bits.push(`<span>Vent <b>${esc(l.wind)}</b></span>`);
    if (!inland(s) && has(l.swell)) bits.push(`<span>Houle <b>${esc(l.swell)}</b></span>`);
    if (!inland(s) && has(l.temp)) bits.push(`<span>Eau <b>${esc(l.temp)}</b></span>`);
    setRow('live', bits.length ? bits.join('<span class="db-sep" aria-hidden="true"> · </span>') : '<span class="db-muted">Prévision indisponible pour le moment</span>');
  }

  /* Saison du mois : la phrase de l’aperçu « Quand partir ? » (spot-data.js), level de 0 (peu favorable) à 3 (top). */
  function season(s, text, level) {
    if (!same(s)) return;
    setRow('season', text ? `<span class="db-season l${level == null ? 'x' : level}">${esc(text)}</span>` : '<span class="db-muted">Normales indisponibles</span>');
  }

  /* Meilleur créneau d’aujourd’hui, calculé par spot-experience.js (rule = SpotWeatherModel.rule, today = bestSlot du jour). */
  function slot(s, rule, today, hourFmt) {
    if (!same(s)) return;
    if (rule === null) { setRow('slot', '<span class="db-muted">Indisponible pour le moment</span>'); return; }
    const x = F ? F.slotSummary(rule, today) : {status: 'nodata'};
    const fmt = h => (typeof hourFmt === 'function' ? hourFmt(h) : h + ' h');
    if (x.status === 'ok') {
      const range = x.start === x.end ? fmt(x.start) : `${fmt(x.start)} – ${fmt(x.end)}`;
      setRow('slot', `<span>Aujourd’hui <b>${esc(range)}</b></span><span class="db-q is-${x.quality}">${x.quality === 'good' ? 'Dans tes repères' : 'Possible, sans plus'}</span>`);
      return;
    }
    const why = x.status === 'norule'
      ? (x.reason === 'level' ? 'Dépend de ton niveau' : x.reason === 'expert' ? 'À juger toi-même heure par heure' : 'Pas de repère chiffré pour ce sport')
      : x.status === 'night' ? 'Plus d’heure de jour aujourd’hui'
      : x.status === 'none' ? 'Aucun aujourd’hui dans tes repères'
      : 'Prévision incomplète';
    setRow('slot', `<span class="db-muted">${esc(why)}</span>`);
  }

  function update(s) { try { render(s); } catch (e) { console.warn('avant d’y aller', e); } }
  /* Niveau changé dans Réglages : la pastille et l’explication suivent (le créneau est recalculé par spot-experience.js). */
  document.addEventListener('ocean:level', () => { try { if (spot && document.body.dataset.screen === 'detail') { const keep = host && host.querySelectorAll('[data-before] .db-v'); const saved = keep ? [...keep].map(v => [v.parentNode.dataset.before, v.innerHTML, v.classList.contains('db-wait')]) : []; render(spot); saved.forEach(([k, h, wait]) => { if (!wait) setRow(k, h); }); } } catch (e) {} });

  /* Invitation au niveau (bandeau, créneau de l’onglet Conditions) : Réglages ouverts sur « Mon sport et mon niveau ». */
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-open-level]')) return;
    try { if (typeof openSettings === 'function') openSettings('sport'); } catch (err) {}
  });

  window.OceanBefore = {update, live, season, slot, cardPill, openSafety};
})();
