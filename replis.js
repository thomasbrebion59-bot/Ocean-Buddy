/* Rangement de la fiche spot (fiche v2, 18 novembre 2026) et replis simples du profil, du jeu et des défis.
   - Fiche spot : sept onglets (index.html). Chaque onglet montre d’abord sa réponse ; seul le détail long et secondaire
     reste dans des sections repliées, ouvertes d’un toucher. « Le spot » montre la description, l’anecdote, le conseil et
     les repères pratiques directement ; « Comprendre le spot » et « Photos et carte » y sont repliés. Les blocs « dormir »
     et « autour », créés par leurs modules dans « Le spot », sont rangés une fois dans « Préparer » (arrange) : les
     modules les retrouvent par leur id ou leur référence. Le repli lui-même passe par CSS (replis.css, attribut data-open).
     La sécurité n’est JAMAIS repliée : elle a son onglet, sans aucune section fermée.
   - Ailleurs (profil, jeu, défis) : boutons [data-obf] avec aria-controls, la zone liée porte l’attribut hidden.
   Chaque nouveau spot s’ouvre replié ; seul un Retour vers une fiche déjà vue lui rend ses sections ouvertes (mémoire
   de la session, voir « ocean:navigate » plus bas). La fiche s’ouvre après la levée du rideau :
   ce module ne touche ni à l’accueil ni à la barre d’onglets. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const chevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* ---------- Fiche spot, onglet « Le spot » : deux sections repliées ---------- */
  const GROUPS = [
    { id: 'reperes', title: 'Comprendre le spot', sub: 'Vent, houle, marée et niveau expliqués', members: ['#spotImmersion'] },
    { id: 'images', title: 'Photos et carte', sub: 'Photos, vidéos et carte du secteur', members: ['#spotPhotoStrip', '#obVoyageBanner', '#spotVideoPanel', '#spotAreaMap'] }
  ];
  /* Blocs créés dans « Le spot » par field-guide.js et spot-guide.js, rangés dans « Préparer » (une seule fois). */
  const MOVED = { activites: ['#fieldOverview', '#guideAround', '#guideSleep', '#fieldNearbyBlock'] };
  const infos = () => $('#detail .dcat[data-cat="infos"]');
  const ids = { '.field-story': 'fieldStory', '.anec-block': 'dAnecBlock', '.field-reference': 'fieldReference', '.field-tip': 'fieldTip' };

  /* Les têtes de section sont posées une fois, devant le premier membre présent de leur groupe (ordre de lecture),
     sinon à la fin de l’onglet ; l’ordre affiché vient de replis.css. */
  function mount() {
    const tab = infos(); if (!tab) return null;
    arrange();
    for (const g of GROUPS) {
      let head = $(`.obf-head[data-obf-group="${g.id}"]`, tab);
      if (!head) {
        head = document.createElement('button'); head.type = 'button'; head.className = 'obf-head';
        head.dataset.obfGroup = g.id; head.setAttribute('aria-expanded', 'false');
        head.innerHTML = `<span class="obf-tx"><b>${g.title}</b><small>${g.sub}</small></span><span class="obf-chev">${chevron}</span>`;
        const first = g.members.map(s => tab.querySelector(':scope>' + s)).find(Boolean);
        if (first) first.before(head); else tab.append(head);
      }
      /* aria-controls : les membres présents, avec un identifiant posé au besoin (classes sans id). */
      const list = [];
      for (const s of g.members) { const el = tab.querySelector(':scope>' + s); if (!el) continue; if (!el.id && ids[s]) el.id = ids[s]; if (el.id) list.push(el.id); }
      if (list.length) head.setAttribute('aria-controls', list.join(' ')); else head.removeAttribute('aria-controls');
    }
    return tab;
  }
  /* Rangement des blocs déménagés : idempotent, et sans effet tant que leur module ne les a pas créés. */
  function arrange() {
    for (const cat in MOVED) {
      const to = tabOf(cat); if (!to) continue;
      for (const sel of MOVED[cat]) { const el = $('#detail ' + sel); if (el && el.parentNode !== to) to.append(el); }
    }
  }

  function openSet(tab) { return new Set((tab.dataset.open || '').split(/\s+/).filter(Boolean)); }
  function setGroup(id, open) {
    const tab = mount(); if (!tab) return;
    const set = openSet(tab); if (open) set.add(id); else set.delete(id);
    tab.dataset.open = [...set].join(' ');
    const head = $(`.obf-head[data-obf-group="${id}"]`, tab); if (head) head.setAttribute('aria-expanded', String(open));
  }
  function closeAll() {
    const tab = mount(); if (!tab) return;
    tab.dataset.open = '';
    tab.querySelectorAll('.obf-head').forEach(h => h.setAttribute('aria-expanded', 'false'));
  }
  /* Montre un élément de la fiche où qu’il soit rangé (raccourcis « Le mot du coin », « Dès 14 € la nuit », aide du
     vent…) : son onglet s’affiche s’il n’est pas déjà là, et sa section s’ouvre si elle est repliée. */
  function reveal(el) {
    const panel = el && el.closest('#detail .dcat'); if (!panel) return;
    const cat = panel.dataset.cat, top = el.closest('#detail .dcat > *');
    try { if (panel.style.display === 'none' && typeof showDetailCat === 'function') showDetailCat(cat, false); } catch (_) {}
    if (!top) return;
    if (cat === 'infos') { const g = GROUPS.find(x => x.members.some(s => top.matches(s))); if (g) setGroup(g.id, true); return; }
    const g = (TAB_GROUPS[cat] || []).find(x => x.members.some(s => top.matches(s) || el.closest(s))); if (g) setTabGroup(cat, g.id, true);
  }
  document.addEventListener('click', e => {
    const head = e.target.closest('.obf-head[data-obf-group]');
    if (head && head.closest('.dcat')?.dataset.cat === 'infos') { setGroup(head.dataset.obfGroup, head.getAttribute('aria-expanded') !== 'true'); return; }
  });
  /* Phase de capture : la section cible s’ouvre AVANT que le module ne fasse défiler jusqu’à elle. */
  document.addEventListener('click', e => {
    const jump = e.target.closest('[data-guide-jump]');
    if (jump) { reveal(document.getElementById(jump.dataset.guideJump)); return; }
    if (e.target.closest('[data-im-open],#imWeatherHelp')) reveal($('#spotImmersion'));
  }, true);
  /* ---------- Autres onglets de la fiche (demande du 17 novembre) ----------
     Chaque onglet répond d’abord à une question (réponse courte visible), puis le détail se range dans des sections
     repliées, avec les mêmes têtes que « Le spot ». Les modules réécrivent leur contenu à chaque spot (innerHTML) :
     les têtes sont reposées devant le premier membre présent de leur groupe, et un membre replié porte l’attribut
     data-obf-shut (display:none dans replis.css). Rien n’est retiré du DOM ni déplacé.
     JAMAIS repliés : dangers et vigilance, « Courants & dangers à vérifier », « Sécurité & secours », numéro d’urgence,
     espèces « À connaître avant de te mettre à l’eau », avertissements de créneau. */
  const TAB_GROUPS = {
    saisons: [
      /* Fiche v2 : les sources des normales restent visibles sous la section repliée. */
      { id: 'courbes', title: 'L’année en courbes', sub: 'Températures, soleil, pluie, houle et vent', members: ['#dSeasons>.sd-charts', '#dSeasons>.sd-rose', '#dSeasons>.sd-table'] }
    ],
    meteo: [
      { id: 'lire', title: 'Comprendre ces chiffres', sub: 'Le vent, la houle et la marée, expliqués', members: ['#sdCoach', '#imWeatherHelp'] }
    ],
    activites: [
      { id: 'autour', title: 'Dormir et alentours', sub: 'Nuits pas chères, lieux et spots voisins', members: ['#fieldOverview', '#guideAround', '#guideSleep', '#fieldNearbyBlock'] },
      { id: 'depart', title: 'Ton point de départ et tes notes', sub: 'Situer le lieu, ton carnet', members: ['#dGuide>.field-address', '#dGuide>.field-notebook'] },
      { id: 'surplace', title: 'Heure, soleil, monnaie et langue', sub: 'Ce qui change sur place', members: ['#dGo>.sd-facts'] },
      { id: 'adresses', title: 'Écoles, location et zones', sub: 'Trouver un encadrant ou du matériel', members: ['#dZonesBlock', '.field-local'] }
    ],
    faune: [
      { id: 'photos', title: 'Les espèces photographiées ici', sub: 'Photos, observations et sources', members: ['#dWild>.sd-species', '#dWild>.sd-link', '#dWild>.sd-src'] },
      { id: 'typiques', title: 'Les espèces typiques de la zone', sub: 'À observer, flore et fonds', members: ['#bioObserve', '#bioFlore', '#dFaune>.bio-note'] }
    ]
  };
  const tabOf = cat => $(`#detail .dcat[data-cat="${cat}"]`);
  const absent = el => !!el.closest('[hidden]') || el.style.display === 'none';
  function makeHead(g) {
    const head = document.createElement('button'); head.type = 'button'; head.className = 'obf-head';
    head.dataset.obfGroup = g.id; head.setAttribute('aria-expanded', 'false');
    head.innerHTML = `<span class="obf-tx"><b>${g.title}</b><small>${g.sub}</small></span><span class="obf-chev">${chevron}</span>`;
    return head;
  }
  /* Idempotent : ne touche au DOM que si une tête manque ou n’est plus devant son premier membre. */
  function mountTab(cat) {
    const tab = tabOf(cat); if (!tab) return;
    const open = openSet(tab);
    for (const g of TAB_GROUPS[cat]) {
      const els = g.members.flatMap(s => [...tab.querySelectorAll(s)]);
      const shown = els.filter(e => !absent(e));
      let head = tab.querySelector(`.obf-head[data-obf-group="${g.id}"]`);
      const first = shown[0] || els[0];
      if (!head && !first) continue;
      if (!head) head = makeHead(g);
      if (first && first.previousElementSibling !== head) first.before(head);
      const on = open.has(g.id);
      els.forEach((e, i) => {
        if (on) e.removeAttribute('data-obf-shut'); else if (!e.hasAttribute('data-obf-shut')) e.setAttribute('data-obf-shut', '');
        if (!e.id) e.id = `obf-${g.id}-${i}`;
      });
      if (head.getAttribute('aria-expanded') !== String(on)) head.setAttribute('aria-expanded', String(on));
      head.setAttribute('aria-controls', els.map(e => e.id).join(' '));
      head.hidden = !shown.length;
    }
  }
  function setTabGroup(cat, id, open) {
    const tab = tabOf(cat); if (!tab || !TAB_GROUPS[cat]) return;
    const set = openSet(tab); if (open) set.add(id); else set.delete(id);
    tab.dataset.open = [...set].join(' ');
    mountTab(cat);
  }
  function closeTabs() { for (const cat in TAB_GROUPS) { const t = tabOf(cat); if (t) t.dataset.open = ''; mountTab(cat); } }
  document.addEventListener('click', e => {
    const head = e.target.closest('#detail .dcat:not([data-cat="infos"]) .obf-head[data-obf-group]'); if (!head) return;
    const cat = head.closest('.dcat')?.dataset.cat;
    setTabGroup(cat, head.dataset.obfGroup, head.getAttribute('aria-expanded') !== 'true');
  });
  /* Les modules réécrivent leurs blocs à l’arrivée des données : les têtes et les replis sont reposés dans la même tâche,
     avant l’affichage (microtâche), donc sans saut visible. */
  let queued = false;
  const body = $('#detail .detail-body');
  if (body && 'MutationObserver' in window) new MutationObserver(() => {
    if (queued) return; queued = true;
    queueMicrotask(() => { queued = false; for (const cat in TAB_GROUPS) mountTab(cat); });
  }).observe(body, { childList: true, subtree: true });

  /* Nouveau spot : tout replié, sommaire en place. Même spot (retour) : l’état reste celui laissé.
     Retour ou Avancer vers une fiche quittée pour une autre (un voisin de « Dans les environs », puis Retour) : ses
     sections se rouvrent comme on les avait laissées, sinon la page revenait repliée, plus courte, et le défilement
     ne retrouvait pas sa place. Cet écouteur passe avant que go() ne rende le défilement (même tâche). Mémoire de la
     session seulement, pour les dernières fiches. */
  let lastSpot = null;
  const left = new Map(), LEFT_MAX = 12;
  function snapshot() {
    const tabs = {}; for (const cat in TAB_GROUPS) { const o = tabOf(cat)?.dataset.open; if (o) tabs[cat] = o; }
    return { infos: infos()?.dataset.open || '', tabs };
  }
  function reopen(state) {
    for (const id of state.infos.split(/\s+/).filter(Boolean)) if (GROUPS.some(g => g.id === id)) setGroup(id, true);
    for (const cat in state.tabs) { const t = tabOf(cat); if (t && TAB_GROUPS[cat]) { t.dataset.open = state.tabs[cat]; mountTab(cat); } }
  }
  window.addEventListener('ocean:navigate', e => {
    if (e.detail !== 'detail') return;
    let cur = null; try { cur = typeof currentSpot !== 'undefined' ? currentSpot : null; } catch (_) {}
    if (cur === lastSpot && infos()?.querySelector('.obf-head')) { mount(); for (const cat in TAB_GROUPS) mountTab(cat); return; }
    if (lastSpot != null) { left.delete(lastSpot); left.set(lastSpot, snapshot()); if (left.size > LEFT_MAX) left.delete(left.keys().next().value); }
    let back = null; try { back = window.OceanNavigation?.restoreScroll?.() != null ? left.get(cur) : null; } catch (_) {}
    lastSpot = cur; closeAll(); closeTabs();
    if (back) reopen(back);
  });
  /* Fiche déjà ouverte au chargement de ce script : relance du WebView (mise à jour, changement de langue) où
     navigation.js, chargé avant, rouvre la fiche avant que l’écouteur ci-dessus n’existe. Sans cela, l’onglet « Le spot »
     restait sans sommaire, toutes ses sections masquées. Même état qu’une ouverture : tout replié. */
  if (document.body?.dataset.screen === 'detail') {
    try { lastSpot = typeof currentSpot !== 'undefined' ? currentSpot : null; } catch (_) {}
    closeAll(); closeTabs();
  }

  /* ---------- Replis simples : bouton [data-obf] + aria-controls, zone [hidden] ---------- */
  function toggle(btn, force) {
    const zone = document.getElementById(btn.getAttribute('aria-controls') || ''); if (!zone) return;
    const open = force == null ? btn.getAttribute('aria-expanded') !== 'true' : !!force;
    zone.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-obf]'); if (b) toggle(b);
  });

  window.OceanReplis = { mount, setGroup, closeAll, reveal, toggle, GROUPS, TAB_GROUPS, mountTab, setTabGroup };
})();
