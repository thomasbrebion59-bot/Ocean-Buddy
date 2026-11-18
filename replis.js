/* Moins d’informations d’un coup (demande du 16 novembre) : sections repliables, ouvertes d’un toucher.
   - Fiche spot, onglet « Le spot » : après la photo, le nom, le niveau et « Avant d’y aller », un sommaire court de
     quatre sections repliées (Le lieu, Infos pratiques, Dormir et alentours, Photos et carte). Aucun nœud des autres
     modules n’est déplacé ni retiré : l’ordre et le repli passent par CSS (replis.css, attribut data-open de l’onglet).
     Les autres onglets (Saisons, Conditions, Préparer, Faune) suivent le même principe : voir TAB_GROUPS plus bas.
     Les avertissements de sécurité et les sources restent dans leur section, à un toucher ; le danger, le numéro
     d’urgence et « Sécurité & secours » restent visibles dans « Avant d’y aller ».
   - Ailleurs (profil, jeu, défis) : boutons [data-obf] avec aria-controls, la zone liée porte l’attribut hidden.
   L’état replié n’est pas mémorisé : chaque nouveau spot s’ouvre replié. La fiche s’ouvre après la levée du rideau :
   ce module ne touche ni à l’accueil ni à la barre d’onglets. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const chevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* ---------- Fiche spot : sommaire et quatre sections ---------- */
  const GROUPS = [
    { id: 'lieu', title: 'Le lieu', sub: 'Description, esprit du lieu et anecdotes', members: ['.field-story', '#guideSpirit', '.anec-block', '.field-reference'] },
    { id: 'pratique', title: 'Infos pratiques', sub: 'Marée, règles locales, danger et conseils', members: ['.field-tip', '#fieldVisit', '#fieldMainDanger', '#spotImmersion'] },
    { id: 'autour', title: 'Dormir et alentours', sub: 'Nuits pas chères, lieux et spots voisins', members: ['#fieldOverview', '#guideAround', '#guideSleep', '#fieldNearbyBlock'] },
    { id: 'images', title: 'Photos et carte', sub: 'Photos, vidéos et carte du secteur', members: ['#spotPhotoStrip', '#obVoyageBanner', '#spotVideoPanel', '#spotAreaMap'] }
  ];
  /* Groupe dont le sous-titre fermé montre le début d’un texte de la fiche (voir syncPeek plus bas). */
  const PEEK = { lieu: '#dDesc' };
  const PEEK_HTML = '<span class="obf-peek" aria-hidden="true" data-no-i18n></span>';
  const infos = () => $('#detail .dcat[data-cat="infos"]');
  const ids = { '.field-story': 'fieldStory', '.anec-block': 'dAnecBlock', '.field-reference': 'fieldReference', '.field-tip': 'fieldTip' };

  /* Les têtes de section sont posées une fois, devant le premier membre présent de leur groupe (ordre de lecture),
     sinon à la fin de l’onglet ; l’ordre affiché vient de replis.css. */
  function mount() {
    const tab = infos(); if (!tab) return null;
    if (!$('.obf-label', tab)) {
      const label = document.createElement('h3'); label.className = 'obf-label'; label.textContent = 'Dans cette fiche';
      tab.prepend(label);
    }
    for (const g of GROUPS) {
      let head = $(`.obf-head[data-obf-group="${g.id}"]`, tab);
      if (!head) {
        head = document.createElement('button'); head.type = 'button'; head.className = 'obf-head';
        head.dataset.obfGroup = g.id; head.setAttribute('aria-expanded', 'false');
        head.innerHTML = `<span class="obf-tx"><b>${g.title}</b><small>${g.sub}</small>${PEEK[g.id] ? PEEK_HTML : ''}</span><span class="obf-chev">${chevron}</span>`;
        const first = g.members.map(s => tab.querySelector(':scope>' + s)).find(Boolean);
        if (first) first.before(head); else tab.append(head);
      }
      /* aria-controls : les membres présents, avec un identifiant posé au besoin (classes sans id). */
      const list = [];
      for (const s of g.members) { const el = tab.querySelector(':scope>' + s); if (!el) continue; if (!el.id && ids[s]) el.id = ids[s]; if (el.id) list.push(el.id); }
      if (list.length) head.setAttribute('aria-controls', list.join(' ')); else head.removeAttribute('aria-controls');
    }
    syncPeeks();
    return tab;
  }

  /* ---------- « Le lieu » fermé : le début réel de la description (fiche-apercu) ----------
     Le sous-titre du repli fermé reprend le texte ENTIER de #dDesc tel qu’il est affiché, donc déjà traduit par i18n.js
     (ses clés sont des phrases françaises entières : un morceau de phrase resterait en français en anglais et en espagnol).
     La coupe à deux lignes est faite par replis.css, jamais ici. L’aperçu porte data-no-i18n (texte déjà traduit) et
     aria-hidden : le nom du bouton reste « Le lieu » suivi du libellé court. Sans description, ou repli ouvert, le libellé
     générique est affiché (replis.css, attributs data-peek et aria-expanded). Recopié à chaque nouveau spot et à chaque
     traduction de la description (observateur ci-dessous). */
  function syncPeek(head, src) {
    const peek = head && head.querySelector('.obf-peek'); if (!peek) return;
    const text = src ? String(src.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (peek.textContent !== text) peek.textContent = text;
    if (text) head.setAttribute('data-peek', ''); else head.removeAttribute('data-peek');
  }
  function syncPeeks() {
    const tab = infos(); if (!tab) return;
    for (const id in PEEK) syncPeek($(`.obf-head[data-obf-group="${id}"]`, tab), $(PEEK[id]));
  }
  /* Nouveau spot (textContent remplacé) puis traduction en place par i18n.js (nodeValue) : les deux sont suivis. */
  for (const id in PEEK) {
    const src = $(PEEK[id]);
    if (src && 'MutationObserver' in window) new MutationObserver(syncPeeks).observe(src, { childList: true, characterData: true, subtree: true });
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
  /* Ouvre la section qui contient un élément (raccourcis « Le mot du coin », « Dès 14 € la nuit », aide du vent…). */
  function reveal(el) {
    const tab = infos(); if (!tab || !el) return;
    const top = el.closest('#detail .dcat[data-cat="infos"] > *'); if (!top) return;
    const g = GROUPS.find(x => x.members.some(s => top.matches(s))); if (g) setGroup(g.id, true);
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
      { id: 'courbes', title: 'L’année en courbes', sub: 'Températures, soleil, pluie, houle, vent et sources', members: ['#dSeasons>.sd-charts', '#dSeasons>.sd-rose', '#dSeasons>.sd-table', '#dSeasons>.sd-src'] }
    ],
    meteo: [
      { id: 'heures', title: 'Heure par heure', sub: 'Le détail des prochaines 48 heures', members: ['#spotWeek>.wx-hours'] },
      { id: 'lire', title: 'Lire les conditions', sub: 'Comprendre le vent, la houle et la marée', members: ['#sdCoach', '#imWeatherHelp'] }
    ],
    activites: [
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

  /* Nouveau spot : tout replié, sommaire en place. Même spot (retour) : l’état reste celui laissé. */
  let lastSpot = null;
  window.addEventListener('ocean:navigate', e => {
    if (e.detail !== 'detail') return;
    let cur = null; try { cur = typeof currentSpot !== 'undefined' ? currentSpot : null; } catch (_) {}
    if (cur === lastSpot && infos()?.querySelector('.obf-head')) { mount(); for (const cat in TAB_GROUPS) mountTab(cat); return; }
    lastSpot = cur; closeAll(); closeTabs();
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
