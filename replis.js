/* Moins d’informations d’un coup (demande du 16 novembre) : sections repliables, ouvertes d’un toucher.
   - Fiche spot, onglet « Le spot » : après la photo, le nom, le niveau et « Avant d’y aller », un sommaire court de
     quatre sections repliées (Le lieu, Infos pratiques, Dormir et alentours, Photos et carte). Aucun nœud des autres
     modules n’est déplacé ni retiré : l’ordre et le repli passent par CSS (replis.css, attribut data-open de l’onglet).
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
    { id: 'images', title: 'Photos et carte', sub: 'Photos, vidéos et carte du secteur', members: ['#obVoyageBanner', '#spotVideoPanel', '#spotAreaMap'] }
  ];
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
    if (head) { setGroup(head.dataset.obfGroup, head.getAttribute('aria-expanded') !== 'true'); return; }
  });
  /* Phase de capture : la section cible s’ouvre AVANT que le module ne fasse défiler jusqu’à elle. */
  document.addEventListener('click', e => {
    const jump = e.target.closest('[data-guide-jump]');
    if (jump) { reveal(document.getElementById(jump.dataset.guideJump)); return; }
    if (e.target.closest('[data-im-open],#imWeatherHelp')) reveal($('#spotImmersion'));
  }, true);
  /* Nouveau spot : tout replié, sommaire en place. Même spot (retour) : l’état reste celui laissé. */
  let lastSpot = null;
  window.addEventListener('ocean:navigate', e => {
    if (e.detail !== 'detail') return;
    let cur = null; try { cur = typeof currentSpot !== 'undefined' ? currentSpot : null; } catch (_) {}
    if (cur === lastSpot && infos()?.querySelector('.obf-head')) { mount(); return; }
    lastSpot = cur; closeAll();
  });

  /* ---------- Replis simples : bouton [data-obf] + aria-controls, zone [hidden] ---------- */
  function toggle(btn, force) {
    const zone = document.getElementById(btn.getAttribute('aria-controls') || ''); if (!zone) return;
    const open = force == null ? btn.getAttribute('aria-expanded') !== 'true' : !!force;
    zone.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-obf]'); if (b) toggle(b);
  });

  window.OceanReplis = { mount, setGroup, closeAll, reveal, toggle, GROUPS };
})();
