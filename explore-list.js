/* Explorer v2 (interface v2, 20 novembre 2026). Maquette validée : orga-docs/interface-v2/maquette-3-explorer.png.
   Depuis le 23 novembre 2026, Explorer s’ouvre sur la planète 3D (globeFirst, plus bas) ; la liste est à un toucher.
   En haut : « Explorer » et le sélecteur Liste / Carte, la recherche, trois filtres en pastilles (sport, niveau, mois) et un
   bouton rond pour les autres filtres, puis le nombre de résultats. Dessous : des lignes .ui-spot (ui-v2.css), avec la photo,
   le nom, le pays, les points de danger connus, les conditions et le verdict « pour toi ».

   - Aucun état propre : la liste lit les filtres d’app.js (activeSport, currentFilter, currentSearch, favOnly, nearMode,
     spotWorld, OceanPlan) et les change par ses fonctions (filterSpots, searchSpots, openWorld…). La carte lit les mêmes :
     les filtres valent dans les deux modes.
   - Verdict : OceanVerdict (spot-verdict.js), strictement par son contrat : cached() au premier rendu, forSpots() par lots
     pour les seules lignes visibles ou proches (IntersectionObserver), html() pour l’affichage. Jamais un chiffre d’ici.
   - 774 lignes : rendu virtualisé. La liste a tout de suite sa hauteur finale, seules les lignes proches de l’écran existent
     (hauteur de ligne fixe : une ligne sans donnée garde sa place, le contenu arrive en fondu).
   - Tri : bon, puis possible, puis le reste, dans l’ordre du classement. Il ne change qu’au premier affichage d’un résultat
     (une fois, quand toutes les réponses demandées sont là et que l’utilisateur n’a pas touché l’écran) ou sur une action
     de l’utilisateur : jamais sous son doigt.
   - Vie : entrée décalée des lignes au premier affichage (une fois), réarrangement en douceur quand un filtre change,
     conditions en fondu. transform et opacity seulement, aucune boucle, rien en mouvement réduit.
   - Passe du 23 novembre 2026 : pastilles jamais coupées sur un écran étroit (data-fit, mois abrégé au besoin), pastille
     qui change en douceur, nombre de résultats qui défile jusqu’à sa valeur, sélecteur Liste / Carte qui glisse, photos et
     conditions qui arrivent en fondu, pastille du verdict qui se pose, chiffres qui montent quand OceanVerdict sait le
     faire (animate, appel facultatif), lignes hors de l’écran mises de côté pendant qu’on regarde une fiche.
   Chargé avant app.js (qui appelle OceanExploreList.render depuis renderSpots) ; ne lit ses fonctions qu’à l’usage. */

/* ---------- Calculs purs (testés dans Node : tests/explore-list.test.js) ---------- */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ExploreListModel = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';
  /* Rang d’un verdict : bon, possible, puis tout le reste (pas aujourd’hui, pas de calcul, pas encore de réponse). */
  const rank = v => (v === 'bon' ? 0 : v === 'possible' ? 1 : 2);
  /* Tri stable : dans un même rang, l’ordre reçu (le classement d’Explorer) est gardé. */
  function sortByVerdict(ids, verdictOf) {
    return ids.map((id, i) => ({ id, i, k: rank(verdictOf(id)) })).sort((a, b) => a.k - b.k || a.i - b.i).map(o => o.id);
  }
  /* Rendu « sans rien déplacer » (cœur touché depuis une fiche…) : les lignes déjà là gardent leur ordre, les nouvelles suivent. */
  function keepOrder(prev, next) {
    const want = new Set(next), had = new Set(prev);
    return prev.filter(id => want.has(id)).concat(next.filter(id => !had.has(id)));
  }
  const sameOrder = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
  /* Grille : place de la ligne i et hauteur totale de la liste. */
  function grid({ count, cols, rowH, gap, width }) {
    const c = Math.max(1, cols | 0), colW = Math.max(0, (width - (c - 1) * gap) / c), rows = Math.ceil(count / c);
    return { cols: c, colW, rows, height: rows ? rows * rowH + (rows - 1) * gap : 0,
      x: i => (i % c) * (colW + gap), y: i => Math.floor(i / c) * (rowH + gap) };
  }
  /* Lignes à garder dans la page : celles de l’écran et une marge avant et après. top : haut de l’écran mesuré depuis le
     haut de la liste. Rend [premier, dernier] (inclus) ; [0, -1] si la liste est hors de vue ou vide. */
  function range({ top, view, rowH, gap, cols, count, over }) {
    if (!count) return [0, -1];
    const c = Math.max(1, cols | 0), step = rowH + gap;
    const r0 = Math.max(0, Math.floor((top - over) / step)), r1 = Math.floor((top + view + over) / step);
    if (r1 < 0) return [0, -1];
    const first = r0 * c, last = Math.min(count - 1, (r1 + 1) * c - 1);
    return last < first ? [0, -1] : [first, last];
  }
  /* Nombre de colonnes : chaque ligne garde au moins `min` de large ; de une à trois. */
  const columns = (width, min, gap) => Math.max(1, Math.min(3, Math.floor((width + gap) / (min + gap))));
  return { rank, sortByVerdict, keepOrder, sameOrder, grid, range, columns };
});

/* ---------- L’écran ---------- */
(() => {
  'use strict';
  if (typeof document === 'undefined') return;
  const M = window.ExploreListModel;
  const $ = (s, r = document) => r.querySelector(s);
  const wrap = $('#screenWrap'), screen = $('#spots'), host = $('#spotList'), listView = $('#listView');
  if (!wrap || !screen || !host || !listView) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const body = document.body;
  const reduced = () => body.classList.contains('reduce-motion') || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const calm = () => !canAnimate || reduced() || document.documentElement.classList.contains('ob-booting');
  const EASE = () => window.OceanMotion?.easeOut || 'cubic-bezier(.22,.8,.3,1)';
  const V = () => window.OceanVerdict || null;

  /* Pictogrammes au trait (mêmes dessins que la fiche et le planificateur « Quand ? »). */
  const ic = (d, cls = '') => `<svg class="ui-ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    wave: '<path d="M2 15c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2 2.2-2 2.4-2"/><path d="M6 10c1-3 4-5 7-5 2 0 3.6 1 4.6 2.4"/>',
    level: '<path d="M6 20v-5M12 20V10M18 20V4"/>',
    cal: '<path d="M4 6h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    more: '<path d="M4 8h8M18 8h2M4 16h2M12 16h8"/><circle cx="15" cy="8" r="2.4"/><circle cx="9" cy="16" r="2.4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"/>',
    spark: '<path d="M12 3.5 14 10l6.500 2-6.500 2-2 6.500-2-6.500-6.500-2 6.500-2z"/>',
    heart: '<path d="M12 20.4S3.8 14.900 3.8 9.400A4.600 4.600 0 0 1 12 6.600a4.600 4.600 0 0 1 8.200 2.800c0 5.500-8.200 11-8.200 11z"/>',
    pin: '<path d="M12 21s-6.500-6-6.500-11A6.500 6.500 0 0 1 18.500 10c0 5-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.600 3 4 5.900 4 9s-1.400 6-4 9c-2.600-3-4-5.900-4-9s1.400-6 4-9z"/>'
  };
  /* Silhouette du sport (masque teinté par la couleur du texte), comme dans la barre d’onglets. */
  const sportMark = id => `<i class="exl-mark" style="--m:url('${esc(window.PoulpyIcons ? PoulpyIcons.mono(id || 'all') : '')}')" aria-hidden="true"></i>`;

  /* ---------- État d’app.js, lu à l’usage ---------- */
  const A = {
    sport: () => (typeof activeSport !== 'undefined' && activeSport) || null,
    filter: () => (typeof currentFilter !== 'undefined' && currentFilter) || 'all',
    search: () => (typeof currentSearch === 'string' ? currentSearch : ''),
    fav: () => typeof favOnly !== 'undefined' && !!favOnly,
    near: () => typeof nearMode !== 'undefined' && !!nearMode && typeof userPos !== 'undefined' && !!userPos,
    world: () => (typeof spotWorld !== 'undefined' ? spotWorld : null),
    country: () => (typeof spotCountry !== 'undefined' ? spotCountry : null),
    plan: () => (window.OceanPlan?.active?.() ? window.OceanPlan.state : null),
    parts: () => (window.SpotRank ? SpotRank.parseFilter(A.filter()) : { levels: [], season: false, fresh: false }),
    mapShown: () => $('#mapView')?.style.display !== 'none'
  };
  const LEVELS = ['debutant', 'intermediaire', 'expert', 'variable'];
  const levelName = l => (typeof lvlLabel !== 'undefined' && lvlLabel[l]) || l;
  const monthName = m => { const t = new Intl.DateTimeFormat(window.OB_LOCALE || 'fr-FR', { month: 'long' }).format(new Date(2026, m, 15)); return t.charAt(0).toUpperCase() + t.slice(1); };
  const monthShort = m => { const t = new Intl.DateTimeFormat(window.OB_LOCALE || 'fr-FR', { month: 'short' }).format(new Date(2026, m, 15)); return t.charAt(0).toUpperCase() + t.slice(1); };
  const scopeName = () => { const c = A.country(), w = A.world(); if (c) return c; if (w && w !== 'all' && typeof worldOf === 'function') return worldOf(w)?.lab || ''; return ''; };
  /* Autres filtres actifs (bouton rond) : saison, nouveautés, favoris, près de moi, région. */
  const extraCount = () => { const p = A.parts(); return (p.season ? 1 : 0) + (p.fresh ? 1 : 0) + (A.fav() ? 1 : 0) + (A.near() ? 1 : 0) + (scopeName() ? 1 : 0); };

  /* ---------- En-tête ---------- */
  let head = null, input = null, pills = null, count = null, countShown = null, seg = null, list = null, empty = null, tick = null, searchTimer = 0;
  function build() {
    if (head) return;
    head = document.createElement('header'); head.className = 'exl-head';
    head.innerHTML = `<div class="exl-bar"><h1 class="exl-title">Explorer</h1><div class="exl-seg" role="group" aria-label="Affichage des spots"><button type="button" data-exl-view="list" aria-pressed="true">Liste</button><button type="button" data-exl-view="map" aria-pressed="false">Carte</button></div></div>
      <label class="exl-search">${ic(I.search)}<span class="exl-sr">Rechercher un spot, un pays</span><input type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Spot, pays, île"><button type="button" data-exl="clear" aria-label="Effacer la recherche" hidden>${ic(I.close)}</button></label>
      <div class="exl-pills" role="group" aria-label="Filtres"></div>
      <div class="exl-meta"><p class="exl-count"><span class="exl-count-n" translate="no" data-no-i18n aria-hidden="true"></span><span class="exl-sr" translate="no" data-no-i18n aria-live="polite"></span></p><span class="exl-legend" role="img" aria-label="Points de danger : estimation Ocean Buddy d’après les dangers listés" title="Points de danger : estimation Ocean Buddy d’après les dangers listés"><i class="ui-dots" aria-hidden="true"><i class="on"></i><i class="on"></i><i></i><i></i></i><span>Danger estimé</span></span></div>`;
    screen.prepend(head);
    input = $('input', head); pills = $('.exl-pills', head); count = $('.exl-count .exl-sr', head); countShown = $('.exl-count-n', head); seg = $('.exl-seg', head);
    host.textContent = ''; host.classList.add('exl-host');
    empty = document.createElement('div'); empty.className = 'exl-empty'; empty.hidden = true;
    list = document.createElement('div'); list.className = 'exl-list'; list.setAttribute('role', 'list');
    host.append(empty, list);

    const clear = $('[data-exl=clear]', head);
    const send = v => { const s = $('#spotSearch'); if (s) s.value = v; if (typeof searchSpots === 'function') searchSpots(v); };
    input.addEventListener('input', () => { clear.hidden = !input.value; clearTimeout(searchTimer); searchTimer = setTimeout(() => send(input.value), 180); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); send(input.value); input.blur(); } });
    clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; clearTimeout(searchTimer); send(''); input.focus(); });
    seg.addEventListener('click', e => { const b = e.target.closest('[data-exl-view]'); if (b && typeof window.setView === 'function') window.setView(b.dataset.exlView); });
    pills.addEventListener('click', e => {
      const b = e.target.closest('[data-exl]'); if (!b) return;
      if (b.dataset.exl === 'scope') { if (typeof openWorld === 'function') openWorld('all'); return; }
      openSheet(b.dataset.exl, b);
    });
    /* Une ligne touchée ouvre la fiche (openSpot est enveloppée par motion.js : la photo de la ligne vole vers la fiche). */
    list.addEventListener('click', e => { const row = e.target.closest('.exl-row[data-spot-id]'); if (row && typeof window.openSpot === 'function') window.openSpot(row.dataset.spotId); });
    list.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('.exl-row[data-spot-id]'); if (!row || e.target !== row) return;
      e.preventDefault(); if (typeof window.openSpot === 'function') window.openSpot(row.dataset.spotId);
    });
    empty.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-exl=favs-off]')) { if (typeof toggleFavFilter === 'function') toggleFavFilter(); }
      else if (t.closest('[data-exl=reset]')) resetAll();
      else if (t.closest('[data-exl=everywhere]')) resetAll({ keepSearch: true, sport: true });
      else if (t.closest('[data-exl=clear-q]')) { input.value = ''; clear.hidden = true; send(''); }
      else if (t.closest('[data-exl=archived]') && typeof go === 'function') go('profile');
    });
  }
  function paintHead(n) {
    const sp = A.sport(), p = A.parts(), plan = A.plan(), scope = scopeName(), extra = extraCount();
    const lv = p.levels.length === 1 ? levelName(p.levels[0]) : p.levels.length ? `${p.levels.length} niveaux` : 'Niveau';
    const sportLabel = sp && typeof SPORTMAP !== 'undefined' && SPORTMAP[sp] ? SPORTMAP[sp].label : 'Sport';
    /* Les libellés sont écrits dans la langue de l’app dès l’insertion (obT), pas après coup par le traducteur de page :
       les pastilles sont mesurées aussitôt (fitPills), et une traduction plus longue ou plus courte fausserait la mesure. */
    const said = t => esc(typeof obT === 'function' ? obT(t) : t), own = ' translate="no" data-no-i18n';
    /* Pastille du mois : aucun <span> dedans. spot-plan.js (apply) réécrit le premier <span> de tout bouton [data-map-plan]
       avec son propre libellé (« nov. · Belles vagues ») ; le mois long et le mois court sont donc des <bdi>. */
    pills.innerHTML = `<div class="exl-scroll">${scope ? `<button type="button" class="exl-pill is-on" data-exl="scope" aria-label="Retirer le filtre ${esc(scope)}">${ic(I.globe)}<b${own}>${said(scope)}</b>${ic(I.close, 'exl-x')}</button>` : ''}<button type="button" class="exl-pill${sp ? ' is-on' : ''}" data-exl="sport" aria-haspopup="dialog">${sp ? sportMark(sp) : ic(I.wave)}<b${own}>${said(sportLabel)}</b></button><button type="button" class="exl-pill${p.levels.length ? ' is-on' : ''}" data-exl="level" aria-haspopup="dialog">${ic(I.level, 'exl-bars')}<b${own}>${said(lv)}</b></button><button type="button" class="exl-pill${plan ? ' is-on' : ''}" data-map-plan aria-haspopup="dialog">${ic(I.cal)}${plan ? `<b translate="no" data-no-i18n><bdi class="exl-long">${esc(monthName(plan.m))}</bdi><bdi class="exl-short">${esc(monthShort(plan.m))}</bdi></b>` : `<b${own}>${said('Quand ?')}</b>`}</button></div><button type="button" class="exl-more${extra ? ' is-on' : ''}" data-exl="more" aria-haspopup="dialog" aria-label="Autres filtres">${ic(I.more)}${extra ? `<i translate="no">${extra}</i>` : ''}</button>`;
    fitPills(); popPills();
    paintCount(n);
    const q = A.search();
    if (document.activeElement !== input && input.value.trim().toLowerCase() !== q) { input.value = q; $('[data-exl=clear]', head).hidden = !q; }
    paintSeg();
  }
  function paintSeg() {
    if (!seg) return;
    const map = A.mapShown() && !!A.world();
    seg.dataset.view = map ? 'map' : 'list';
    seg.querySelectorAll('[data-exl-view]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.exlView === 'map') === map)));
  }

  /* Écran et liste affichés, sans rien mesurer (aucune lecture de mise en page). */
  const onScreen = () => body.dataset.screen === 'spots' && listView.style.display !== 'none';
  /* Pastilles sur un écran étroit : jamais coupées au bord. data-fit sur la rangée : 0 = taille normale ; 1 = compactes ;
     2 = mois abrégé (« Nov. ») ; 3 = sans les pictogrammes du niveau et du mois ; s = trop de pastilles (une région en
     plus…) : la rangée garde sa forme la plus courte et défile, fondue au bord. La mesure n’a lieu qu’une fois par jeu de libellés et par largeur d’écran
     (résultat gardé), et seulement quand la liste est à l’écran ; sinon elle attend le retour sur l’écran (sync). */
  const fits = new Map(); let fitDue = false;
  function fitPills() {
    const row = pills && pills.firstElementChild; if (!row) return;
    const base = innerWidth < 400 ? 1 : 0, key = innerWidth + '|' + row.textContent, known = fits.get(key);
    if (known != null) { pills.dataset.fit = known; fitDue = false; return; }
    if (!onScreen() || !row.clientWidth) { pills.dataset.fit = String(base); fitDue = true; return; }
    let fit = 's';
    for (let f = base; f <= 3; f++) { pills.dataset.fit = String(f); if (row.scrollWidth <= row.clientWidth + 1) { fit = String(f); break; } }
    pills.dataset.fit = fit; fits.set(key, fit); fitDue = false;
  }
  /* Une pastille dont le libellé ou l’état vient de changer se pose en douceur (jamais au premier affichage). */
  let pillSig = null;
  function popPills() {
    const all = [...pills.querySelectorAll('.exl-pill,.exl-more')], sig = {};
    const keyOf = b => b.dataset.exl || 'plan';
    all.forEach(b => { sig[keyOf(b)] = b.className + '|' + b.textContent; });
    const prev = pillSig; pillSig = sig;
    if (!prev || calm() || !onScreen()) return;
    all.forEach(b => { if (prev[keyOf(b)] !== sig[keyOf(b)]) b.animate([{ opacity: .35, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 280, easing: EASE() }); });
  }
  /* Nombre de résultats : il défile de l’ancienne valeur à la nouvelle (une fois, 420 ms). Le texte lu par les lecteurs
     d’écran (.exl-sr, aria-live) ne reçoit que la valeur finale. Une seule traduction par changement : pendant qu’il
     défile, le nombre prend la place du « 7 » de « 7 spots », traduit une fois pour toutes. */
  const countLabel = v => { const t = v === 1 ? `${v} spot` : `${v} spots`; return typeof obT === 'function' ? obT(t) : t; };
  let countNow = null, countFrame = 0, countMany = null;
  function paintCount(n, start) {
    const from = start != null ? start : countNow; countNow = n;
    cancelAnimationFrame(countFrame);
    const last = countLabel(n);
    count.textContent = last;
    if (from == null || from === n || calm() || !onScreen()) { countShown.textContent = last; return; }
    if (!countMany) countMany = countLabel(7);
    const t0 = performance.now(), span = 420;
    const step = now => {
      const x = Math.min(1, (now - t0) / span), e = 1 - Math.pow(1 - x, 3);
      countShown.textContent = x >= 1 ? last : countMany.replace('7', String(Math.round(from + (n - from) * e)));
      if (x < 1) countFrame = requestAnimationFrame(step);
    };
    countFrame = requestAnimationFrame(step);
  }

  /* ---------- Feuilles : sport, niveau, autres filtres ---------- */
  let sheet = null;
  const SHEET_TITLE = { sport: 'Sport', level: 'Niveau', more: 'Filtres' };
  function pool(opts) { return typeof exploreSpots === 'function' ? exploreSpots(opts && 'filter' in opts ? opts.filter : A.filter(), opts || {}) : []; }
  function sheetBody(kind) {
    const total = S.base.length;
    const foot = `<div class="sd-sheet-foot exl-foot"><span class="sd-count"><b translate="no">${total}</b>${total === 1 ? 'spot' : 'spots'}</span><button type="button" class="sd-go-btn" data-exl-close>Voir les spots</button></div>`;
    if (kind === 'sport') {
      const base = pool({ sport: null }), sp = A.sport(), n = id => (id ? base.filter(s => spotSports(s).includes(id)).length : base.length);
      const opt = (id, label) => { const c = n(id); return `<button type="button" class="exl-opt" data-exl-sport="${esc(id)}" aria-pressed="${(sp || '') === id}"${c || !id ? '' : ' disabled'}>${sportMark(id)}<b>${esc(label)}</b><small translate="no">${c}</small></button>`; };
      return `<div class="exl-opts" role="group" aria-label="Sport">${opt('', 'Tous les sports')}${(typeof SPORTS !== 'undefined' ? SPORTS : []).map(s => opt(s.id, s.label)).join('')}</div>`;
    }
    if (kind === 'level') {
      const p = A.parts(), R = window.SpotRank;
      const n = l => (R ? pool({ filter: R.formatFilter({ ...p, levels: l ? [l] : [] }) }).length : 0);
      return `<div class="exl-opts" role="group" aria-label="Niveau"><button type="button" class="exl-opt" data-exl-level="" aria-pressed="${!p.levels.length}">${ic(I.level, 'exl-bars')}<b>Tous les niveaux</b><small translate="no">${n('')}</small></button>${LEVELS.map(l => `<button type="button" class="exl-opt" data-exl-level="${l}" aria-pressed="${p.levels.includes(l)}">${ic(I.level, 'exl-bars')}<b>${esc(levelName(l))}</b><small translate="no">${n(l)}</small></button>`).join('')}</div>${foot}`;
    }
    const p = A.parts(), w = A.world() || 'all';
    const tog = (key, on, icon, label) => `<button type="button" class="exl-opt" data-exl-toggle="${key}" aria-pressed="${on}">${ic(icon)}<b>${label}</b></button>`;
    const worlds = [['all', 'Monde']].concat((typeof WORLDS !== 'undefined' ? WORLDS : []).map(x => [x.id, x.lab]));
    return `<div class="exl-opts" role="group" aria-label="Filtres">${tog('season', p.season, I.sun, 'En saison')}${tog('new', p.fresh, I.spark, 'Nouveautés')}${tog('fav', A.fav(), I.heart, 'Favoris')}${tog('near', A.near(), I.pin, 'Près de moi')}</div>
      <h4 class="exl-sub">Région</h4><div class="exl-chips" role="group" aria-label="Région">${worlds.map(([id, lab]) => `<button type="button" data-exl-world="${esc(id)}" aria-pressed="${id === w}">${esc(lab)}</button>`).join('')}</div>${foot}`;
  }
  function paintSheet() {
    if (!sheet) return;
    const y = sheet.el.scrollTop;
    sheet.el.innerHTML = `<div class="sd-sheet-grab" aria-hidden="true"></div><h3 id="exlSheetTitle" tabindex="-1">${SHEET_TITLE[sheet.kind]}</h3>${sheetBody(sheet.kind)}`;
    sheet.el.scrollTop = y;
    if (sheet.focus) { const f = sheet.el.querySelector(sheet.focus); sheet.focus = null; if (f) f.focus({ preventScroll: true }); }
  }
  function openSheet(kind, from) {
    if (!SHEET_TITLE[kind]) return;
    closeSheet(true);
    const back = document.createElement('div'); back.className = 'sd-sheet-back';
    const el = document.createElement('div'); el.className = 'sd-sheet'; el.classList.add('exl-sheet'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'exlSheetTitle');
    sheet = { kind, back, el, from: from || document.activeElement, focus: null };
    document.body.append(back, el); paintSheet();
    requestAnimationFrame(() => { back.classList.add('in'); el.classList.add('in'); $('#exlSheetTitle', el)?.focus({ preventScroll: true }); });
    /* Les choix arrivent l’un après l’autre pendant que la feuille monte (une fois, à l’ouverture). */
    if (!calm()) [...el.querySelectorAll('.exl-opt,.exl-chips button')].slice(0, 16).forEach((o, i) => o.animate([{ opacity: 0, transform: 'translate3d(0,10px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }], { duration: 300, delay: 90 + i * 22, easing: EASE(), fill: 'backwards' }));
    back.addEventListener('click', () => closeSheet());
    el.addEventListener('click', onSheetClick);
  }
  function closeSheet(silent) {
    const s = sheet; sheet = null; if (!s) return;
    if (silent) { s.back.remove(); s.el.remove(); return; }
    s.back.classList.remove('in'); s.el.classList.remove('in');
    setTimeout(() => { s.back.remove(); s.el.remove(); }, 320);
    /* Le bouton d’origine a pu être redessiné : on rend le focus à la pastille du même nom. */
    (pills?.querySelector(`[data-exl="${s.kind}"]`) || s.from)?.focus?.({ preventScroll: true });
  }
  function applyFilter(f) {
    window.OceanNavigation?.begin();
    currentFilter = f;
    if (typeof syncFilterChips === 'function') syncFilterChips();
    renderSpots(f);
    if (A.mapShown() && typeof renderMap === 'function') renderMap(true);
  }
  /* Même effet que le choix d’un sport sur la carte (ocean-map.js) : un seul état, toutes les vues suivent. */
  function chooseSport(id) {
    window.OceanNavigation?.begin();
    activeSport = id && typeof SPORTMAP !== 'undefined' && SPORTMAP[id] ? id : null; chosenSport = activeSport || 'all';
    renderSportFilters(); renderSpots();
    if (typeof renderMap === 'function') renderMap(false);
    if (typeof saveState === 'function') saveState();
    if (typeof renderHome === 'function') renderHome();
  }
  function onSheetClick(e) {
    const t = e.target, R = window.SpotRank;
    if (t.closest('[data-exl-close]')) { closeSheet(); return; }
    const sp = t.closest('[data-exl-sport]');
    if (sp) { closeSheet(); chooseSport(sp.dataset.exlSport || null); return; }
    const lv = t.closest('[data-exl-level]');
    if (lv && R) {
      const l = lv.dataset.exlLevel; sheet.focus = `[data-exl-level="${l}"]`;
      applyFilter(l ? R.toggleFilter(A.filter(), l) : R.formatFilter({ ...A.parts(), levels: [] })); return;
    }
    const tg = t.closest('[data-exl-toggle]');
    if (tg) {
      const k = tg.dataset.exlToggle; sheet.focus = `[data-exl-toggle="${k}"]`;
      if (k === 'fav' && typeof toggleFavFilter === 'function') toggleFavFilter();
      else if (k === 'near' && typeof toggleNear === 'function') toggleNear();
      else if (R) applyFilter(R.toggleFilter(A.filter(), k));
      return;
    }
    const w = t.closest('[data-exl-world]');
    if (w && typeof openWorld === 'function') { sheet.focus = `[data-exl-world="${w.dataset.exlWorld}"]`; openWorld(w.dataset.exlWorld); }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) { e.stopPropagation(); closeSheet(); } }, true);
  /* Liste vide. « Effacer les filtres » : recherche, favoris, distance, niveau, saison, mois et région (le sport reste).
     « Chercher dans tous les spots » (keepSearch, sport) : la recherche reste, tout le reste tombe, le sport aussi. */
  function resetAll(opts) {
    const o = opts || {};
    window.OceanNavigation?.begin();
    currentFilter = 'all'; favOnly = false; nearMode = false;
    if (!o.keepSearch) {
      currentSearch = '';
      const s = $('#spotSearch'); if (s) s.value = '';
      if (input) { input.value = ''; $('[data-exl=clear]', head).hidden = true; }
    }
    $('#favChip')?.classList.remove('active'); $('#nearBtn')?.classList.remove('on');
    if (typeof syncFilterChips === 'function') syncFilterChips();
    if (o.sport && A.sport()) { activeSport = null; chosenSport = 'all'; renderSportFilters(); if (typeof saveState === 'function') saveState(); if (typeof renderHome === 'function') renderHome(); }
    if (window.OceanPlan?.active?.()) window.OceanPlan.set(null);
    if (A.world() !== 'all' || A.country()) { openWorld('all'); return; }
    renderSpots(); if (typeof renderMap === 'function') renderMap(true);
  }

  /* ---------- La liste ---------- */
  const S = { base: [], order: [], index: new Map(), spots: new Map(), mounted: new Map(), grid: null, rowH: 132, gap: 10, cols: 1,
    width: 0,
    pending: null, entered: false, touched: false, placedY: 0, settle: false, vkey: null,
    viewTop: 0, viewH: 0, parked: false };
  const gauges = new Map(), countries = new Map();
  const gaugeOf = s => { let g = gauges.get(s.id); if (!g) { g = typeof dangerGauge === 'function' ? dangerGauge(s) : { n: null, basis: 'catalogue' }; gauges.set(s.id, g); } return g; };
  const countryName = s => { let c = countries.get(s.id); if (c === undefined) { c = typeof countryOf === 'function' ? countryOf(s) : ''; countries.set(s.id, c); } return c; };
  const visible = () => body.dataset.screen === 'spots' && listView.style.display !== 'none' && host.clientWidth > 0;

  function dotsHTML(n, basis) {
    if (n == null) return '';
    const k = Math.max(0, Math.min(4, Math.round(n)));
    const label = basis === 'carnet' ? `Danger estimé : ${k} sur 4 · estimation Ocean Buddy · carnet non vérifié` : `Danger estimé : ${k} sur 4 · estimation Ocean Buddy`;
    let d = ''; for (let i = 0; i < 4; i++) d += `<i${i < k ? ' class="on"' : ''}></i>`;
    return `<i class="ui-dots" role="img" data-n="${k}" aria-label="${label}" title="Danger : estimation Ocean Buddy">${d}</i>`;
  }
  function rowHTML(s) {
    const nm = window.SpotName ? SpotName.parts(s.name) : { main: String(s.name || '').split(' — ')[0], sub: '' };
    const g = gaugeOf(s), photo = typeof spotPhotoUrl === 'function' ? spotPhotoUrl(s.id, 480) : null;
    const dist = A.near() && typeof spotDist === 'function' ? spotDist(s) : null, above = aboveLevel(s);
    const sport = (A.sport() && spotSports(s).includes(A.sport()) ? A.sport() : spotSports(s)[0]) || 'all';
    /* La photo vit dans un cadre (.ui-ph, comme les lignes de l’accueil) : motion.js l’emprunte le temps du vol vers la
       fiche, le cadre garde sa place et le texte de la ligne ne change pas de colonne. */
    const media = photo ? `<span class="ui-ph exl-frame"><img src="${esc(photo)}"${typeof spotPhotoSrcset === 'function' ? spotPhotoSrcset(s.id) : ''} sizes="(min-width:960px) 150px, 36vw" alt="" loading="lazy" decoding="async" draggable="false"></span>` : `<span class="ui-ph exl-ph" aria-hidden="true">${sportMark(sport)}</span>`;
    return `<div class="ui-spot exl-row" role="button" tabindex="0" data-spot-id="${esc(s.id)}" aria-label="Découvrir ${esc(s.name)}">${media}<div><p class="ui-spot-name"><span translate="no" data-no-i18n>${esc(nm.main)}</span>${dotsHTML(g.n, g.basis)}</p><p class="ui-spot-sub">${nm.sub && !above ? `<span class="exl-part" translate="no" data-no-i18n>${esc(nm.sub)}</span>` : ''}<span class="exl-country">${esc(countryName(s))}</span>${dist != null ? `<span class="exl-dist" translate="no">${esc(fmtDist(dist))}</span>` : ''}${above ? '<span class="exl-warn">Au-dessus de ton niveau</span>' : ''}</p><div class="exl-live" data-state="wait"></div></div></div>`;
  }
  /* Spot à ne pas proposer à ton niveau (spot-rank-model.js : deux crans au-dessus, ou danger fort pour un débutant) :
     la ligne le dit, comme les anciennes lignes. Sans niveau enregistré, pas de repère. */
  const myLevel = () => (typeof chosenLevel !== 'undefined' && chosenLevel) || '';
  const aboveLevel = s => !!(myLevel() && window.SpotRank && SpotRank.levelTier(s.level, myLevel(), gaugeOf(s).n) === 0);
  const at = (x, y) => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  /* Ce qui change le contenu d’une ligne sans changer le spot : la photo du sport choisi, la distance, le sport du verdict. */
  const sigOf = s => [typeof spotPhotoUrl === 'function' ? spotPhotoUrl(s.id, 480) || '' : '', A.near() && typeof spotDist === 'function' ? Math.round((spotDist(s) || 0) * 10) : '', S.vkey || '', myLevel()].join('|');
  function fill(it, s) {
    if (it.row) io?.unobserve(it.row);
    it.el.innerHTML = rowHTML(s); it.sig = sigOf(s);
    it.row = it.el.firstElementChild; it.live = it.el.querySelector('.exl-live');
    const img = it.row.querySelector('img');
    /* Première entrée dans la liste : une photo pas encore chargée arrive en fondu (opacity, ui-listes.css). Ensuite
       (défilement, filtres), plus de fondu : en défilant vite, des dizaines de fondus à la fois coûtaient des images. */
    if (img && !S.entered && !img.complete && !calm()) { img.classList.add('is-wait'); img.addEventListener('load', () => img.classList.remove('is-wait'), { once: true }); }
    /* Photo introuvable : le cadre devient le fond neutre des spots sans photo, avec la silhouette du sport. */
    if (img) img.addEventListener('error', () => { const frame = img.parentNode; if (!img.isConnected || !frame) return; frame.classList.add('exl-ph'); frame.setAttribute('aria-hidden', 'true'); frame.innerHTML = sportMark((A.sport() && spotSports(s).includes(A.sport()) ? A.sport() : spotSports(s)[0]) || 'all'); }, { once: true });
    /* Premier rendu sans attente : ce que le cache du verdict connaît déjà est posé tout de suite, sans fondu. */
    const known = knownEntry(it.id); if (known) paint(it, known, false);
    io?.observe(it.row);
  }
  function mount(id, i) {
    const s = S.spots.get(id); if (!s) return null;
    const el = document.createElement('div'); el.className = 'exl-item'; el.setAttribute('role', 'listitem');
    const it = { id, el, row: null, live: null, sig: '', x: S.grid.x(i), y: S.grid.y(i) };
    el.style.transform = at(it.x, it.y);
    list.append(el); S.mounted.set(id, it);
    fill(it, s);
    return it;
  }
  function unmount(it) { io?.unobserve(it.row); S.mounted.delete(it.id); it.el.remove(); }
  function measure() {
    const cs = getComputedStyle(list);
    S.rowH = parseFloat(cs.getPropertyValue('--exl-row')) || 132; S.gap = parseFloat(cs.getPropertyValue('--exl-gap')) || 10;
    S.width = list.clientWidth;
    /* Autant de colonnes que la largeur le permet (--exl-min par ligne), trois au plus ; une seule sur téléphone. */
    const cols = M.columns(S.width, parseFloat(cs.getPropertyValue('--exl-min')) || 400, S.gap);
    if (cols !== S.cols) { S.cols = cols; list.style.setProperty('--exl-cols', String(cols)); }
    S.grid = M.grid({ count: S.order.length, cols: S.cols, rowH: S.rowH, gap: S.gap, width: S.width });
  }
  function currentRange() {
    const lr = list.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), view = wrap.clientHeight || innerHeight;
    S.viewTop = wr.top - lr.top; S.viewH = view;
    return M.range({ top: S.viewTop, view, rowH: S.rowH, gap: S.gap, cols: S.cols, count: S.order.length, over: view });
  }
  /* Pose un ordre. animate : les lignes qui restent glissent à leur nouvelle place, les nouvelles arrivent en fondu, les
     autres s’effacent (changement de filtre, tri après les réponses). Sinon tout est posé d’un coup. */
  function place(order, { animate = false } = {}) {
    if (S.parked) unpark();
    const from = new Map(); S.mounted.forEach((it, id) => from.set(id, { x: it.x, y: it.y }));
    S.order = order; S.index = new Map(order.map((id, i) => [id, i]));
    measure(); list.style.height = S.grid.height + 'px';
    empty.hidden = order.length > 0; if (!order.length) paintEmpty();
    const [a, b] = currentRange(), keep = new Set(), move = animate && !calm();
    let fresh = 0;
    for (let i = a; i <= b; i++) {
      const id = order[i]; keep.add(id);
      let it = S.mounted.get(id);
      const x = S.grid.x(i), y = S.grid.y(i);
      if (it) {
        const f = from.get(id), s = S.spots.get(id); it.x = x; it.y = y; it.el.style.transform = at(x, y);
        if (s && it.sig !== sigOf(s)) fill(it, s);
        if (move && f && (Math.abs(f.x - x) > .5 || Math.abs(f.y - y) > .5)) it.el.animate([{ transform: at(f.x, f.y) }, { transform: at(x, y) }], { duration: 360, easing: EASE() });
      } else {
        it = mount(id, i);
        if (it && move) it.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: Math.min(fresh++, 8) * 24, easing: 'ease-out', fill: 'backwards' });
      }
    }
    [...S.mounted.values()].forEach(it => {
      if (keep.has(it.id)) return;
      if (!move) { unmount(it); return; }
      io?.unobserve(it.row); S.mounted.delete(it.id); it.el.style.pointerEvents = 'none';
      const done = () => it.el.remove();
      try { it.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished.then(done, done); } catch (_) { done(); }
      setTimeout(done, 400);
    });
    S.touched = false; S.placedY = wrap.scrollTop;
  }
  /* Défilement : seules les lignes proches de l’écran existent. Rien n’est animé ici. */
  let lastRange = '';
  function update() {
    if (!S.grid || !visible()) return;
    const [a, b] = currentRange(), key = a + ':' + b;
    if (key === lastRange) return; lastRange = key;
    if (S.parked) unpark();
    const keep = new Set();
    for (let i = a; i <= b; i++) { const id = S.order[i]; keep.add(id); if (!S.mounted.has(id)) mount(id, i); }
    [...S.mounted.values()].forEach(it => { if (!keep.has(it.id)) unmount(it); });
  }
  /* Entrée des lignes au premier affichage de la liste, une seule fois : glissé court, décalé de 35 ms. */
  function enter() {
    if (S.entered) return; S.entered = true;
    if (calm()) return;
    paintCount(S.order.length, 0);
    const top = wrap.getBoundingClientRect().top, bottom = top + (wrap.clientHeight || innerHeight);
    [...S.mounted.values()].sort((p, q) => p.y - q.y || p.x - q.x).filter(it => { const r = it.el.getBoundingClientRect(); return r.bottom > top && r.top < bottom; })
      .forEach((it, k) => it.row.animate([{ opacity: 0, transform: 'translate3d(0,16px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }], { duration: 420, delay: 60 + k * 35, easing: EASE(), fill: 'backwards' }));
  }
  function paintEmpty() {
    const q = A.search(), fav = A.fav(), none = fav && typeof favs !== 'undefined' && !favs.size;
    const title = q ? `Aucun spot ne correspond à « ${esc(q)} ».` : fav ? (none ? 'Pas encore de favori.' : 'Aucun de tes favoris ici.') : 'Aucun spot ici.';
    const filtered = !!(q || fav || A.near() || A.filter() !== 'all' || A.plan() || scopeName());
    /* Favoris sortis du catalogue : ils restent dans le profil (legacy-spots.js). */
    const archived = fav && typeof favs !== 'undefined' && [...favs].some(id => window.OceanLegacySpots?.archive(id) && !window.OceanLegacySpots?.canonicalId(id));
    /* Une recherche sans résultat : la garder et chercher partout (les autres filtres et le sport tombent), ou l’effacer.
       Favoris vides : revenir à tous les spots. Sinon, effacer les filtres d’un toucher. */
    const others = !!(fav || A.near() || A.filter() !== 'all' || A.plan() || scopeName() || A.sport());
    const action = q ? (others ? '<button type="button" class="ui-btn is-soft" data-exl="everywhere">Chercher dans tous les spots</button>' : '') + '<button type="button" class="ui-link" data-exl="clear-q">Effacer la recherche</button>'
      : none ? '<button type="button" class="ui-btn is-soft" data-exl="favs-off">Voir tous les spots</button>' : filtered ? '<button type="button" class="ui-btn is-soft" data-exl="reset">Effacer les filtres</button>' : '';
    empty.innerHTML = `<img src="assets/poulpy/scenes/travel-v2.webp" alt="" width="96" height="96" loading="lazy" decoding="async"><p class="ui-text">${title}</p>${action}${archived ? '<button type="button" class="ui-link" data-exl="archived">Voir mes favoris archivés</button>' : ''}`;
    if (!calm() && onScreen()) empty.firstElementChild.animate([{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 360, easing: EASE() });
  }

  /* ---------- Verdict : seulement les lignes visibles ou proches, par lots ---------- */
  const FRESH = 10 * 60 * 1000, BATCH = 12;
  const entries = new Map(), queue = new Set();
  let inflight = 0, flushTimer = 0, scrolledAt = 0, io = null;
  const vOpts = () => { const sp = A.sport(); return sp ? { sport: sp } : undefined; };
  function knownEntry(id) {
    let e = null; try { e = V()?.cached?.(id, vOpts()) || null; } catch (_) {}
    if (e) return e;
    const mine = entries.get(id);
    return mine && Date.now() - mine.at < FRESH ? mine.entry : null;
  }
  const verdictOf = id => knownEntry(id)?.verdict || null;
  function paint(it, entry, fade) {
    let html = ''; try { html = V()?.html?.(entry) || ''; } catch (_) {}
    it.live.innerHTML = html; it.live.dataset.state = html ? 'ready' : 'none';
    /* Le danger du contrat complète la jauge locale : jamais caché s’il est connu. */
    if (entry && entry.danger != null) {
      const cur = it.row.querySelector('.ui-dots');
      if (!cur || +cur.dataset.n !== Math.round(entry.danger)) { const t = document.createElement('template'); t.innerHTML = dotsHTML(entry.danger, 'catalogue'); if (cur) cur.replaceWith(t.content); else it.row.querySelector('.ui-spot-name')?.append(t.content); }
    }
    /* Arrivée des conditions (jamais au premier rendu depuis le cache, jamais en mouvement réduit) : la ligne de chiffres
       en fondu et la pastille du verdict qui se pose (classe ui-arrive, ui-listes.css). Si OceanVerdict sait faire monter
       ses chiffres (animate : ajouté par l’accueil, hors du contrat de base), on le lui demande ; sinon rien ne manque.
       Seulement pour une ligne à l’écran, et jamais pendant un défilement : les lignes montées en avance et celles qui
       arrivent sous le doigt sont posées telles quelles (aucun calque, aucun décompte à chaque image). */
    const seen = it.y + S.rowH > S.viewTop && it.y < S.viewTop + S.viewH, still = performance.now() - scrolledAt > 300;
    const arrive = !!(fade && html && seen && still && !calm());
    it.live.classList.toggle('ui-arrive', arrive);
    if (arrive) { try { V()?.animate?.(it.live); } catch (_) {} }
    /* Une animation CSS rejoue quand son élément réapparaît (retour d’une fiche) : la classe ne reste que le temps de jouer. */
    if (arrive) { const live = it.live; setTimeout(() => live.classList.remove('ui-arrive'), 900); }
  }
  function ask(id) {
    const mine = entries.get(id);
    if (mine && Date.now() - mine.at < FRESH) return;
    queue.add(id);
    if (!flushTimer) flushTimer = setTimeout(flush, 140);
  }
  function flush() {
    flushTimer = 0;
    /* Pendant un défilement, les demandes attendent la fin du geste : leurs réponses ne tombent pas au milieu. */
    if (performance.now() - scrolledAt < 200) { flushTimer = setTimeout(flush, 200); return; }
    const api = V(); if (!api || typeof api.forSpots !== 'function') { queue.clear(); return; }
    const ids = [...queue].filter(id => S.mounted.has(id)).slice(0, BATCH);
    ids.forEach(id => queue.delete(id));
    [...queue].forEach(id => { if (!S.mounted.has(id)) queue.delete(id); });
    if (!ids.length) { if (!inflight) settled(); return; }
    const key = S.vkey; inflight++;
    let p; try { p = Promise.resolve(api.forSpots(ids, vOpts())); } catch (err) { p = Promise.reject(err); }
    p.then(map => {
      if (key !== S.vkey) return;
      const now = Date.now();
      ids.forEach(id => {
        const entry = map && typeof map.get === 'function' ? map.get(id) : null, it = S.mounted.get(id);
        /* Pas d’entrée pour ce spot : la ligne cesse d’attendre et garde sa place. */
        if (!entry) { if (it && it.live.dataset.state === 'wait') it.live.dataset.state = 'none'; return; }
        entries.set(id, { entry, at: now });
        if (it) paint(it, entry, true);
      });
    }, () => {
      /* Pas de réponse (hors connexion…) : la ligne garde sa place et dit qu’elle n’a pas de donnée, par le contrat. */
      if (key !== S.vkey) return;
      ids.forEach(id => { const it = S.mounted.get(id); if (it && it.live.dataset.state === 'wait') paint(it, { now: null, verdict: null, slot: null, day: 'today', danger: null, at: 0 }, false); });
    }).then(() => {
      inflight--;
      if (queue.size) { if (!flushTimer) flushTimer = setTimeout(flush, 60); } else if (!inflight) settled();
    });
    if (queue.size && inflight < 2 && !flushTimer) flushTimer = setTimeout(flush, 60);
  }
  /* Toutes les réponses demandées sont là. Si ce résultat vient d’être affiché et que l’utilisateur n’a rien touché, la
     liste se trie une fois (bon, possible, le reste). Sinon l’ordre reste : le tri attendra sa prochaine action. */
  function settled() {
    if (!S.settle || !visible()) return;
    if (S.touched || Math.abs(wrap.scrollTop - S.placedY) > 4) { S.settle = false; return; }
    S.settle = false;
    const next = M.sortByVerdict(S.base, verdictOf);
    if (!M.sameOrder(next, S.order)) { lastRange = ''; place(next, { animate: true }); }
  }
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(list => { list.forEach(e => { if (e.isIntersecting && e.target.dataset.spotId) ask(e.target.dataset.spotId); }); }, { root: wrap, rootMargin: '60% 0px' });
  }

  /* ---------- Écran quitté : les lignes hors de l’écran sont mises de côté ---------- */
  /* Au retour d’une fiche, go() (app.js) pose la position de défilement retrouvée, ce qui force la mise en page de tout
     l’écran d’un coup. Les lignes montées en avance (un écran avant, un écran après) n’ont pas à en faire partie : en
     quittant l’écran, elles passent en content-visibility:hidden (classe is-parked). Elles reviennent une fois la
     transition du retour passée (420 ms), ou tout de suite si l’utilisateur touche l’écran, si la fenêtre des lignes
     change ou si la liste est reposée : jamais une ligne vide sous le doigt, et leur mise en page ne s’ajoute plus à
     celle de go(). Rien n’est mesuré ici : la position de l’écran dans la liste est celle du dernier défilement. */
  function park() {
    if (S.parked || !S.grid || !S.mounted.size || !S.viewH) return;
    const a = S.viewTop - S.rowH * .5, b = S.viewTop + S.viewH + S.rowH * .5;
    S.mounted.forEach(it => { if (it.y + S.rowH < a || it.y > b) it.el.classList.add('is-parked'); });
    S.parked = true;
  }
  let parkTimer = 0;
  function unpark() {
    clearTimeout(parkTimer);
    if (!S.parked) return; S.parked = false;
    S.mounted.forEach(it => it.el.classList.remove('is-parked'));
  }

  /* ---------- Rendu (appelé par renderSpots d’app.js) ---------- */
  function render(spots, opts) {
    build();
    const keep = !!(opts && opts.keep), ids = [];
    S.spots = new Map();
    (spots || []).forEach(s => { S.spots.set(s.id, s); ids.push(s.id); });
    const vkey = A.sport() || '';
    if (vkey !== S.vkey) { S.vkey = vkey; entries.clear(); queue.clear(); }
    /* Un rendu « sans rien déplacer » ne fait pas oublier un rendu complet encore en attente (liste cachée). */
    S.base = ids; S.pending = { keep: keep && !(S.pending && !S.pending.keep) };
    paintHead(ids.length);
    /* Prévient ceux qui suivent la liste (bandeau culture de cultures.js) : un enfant direct change à chaque rendu. */
    const t = document.createElement('i'); t.hidden = true; if (tick) tick.replaceWith(t); else host.prepend(t); tick = t;
    paintSheet();
    if (visible()) apply();
  }
  function apply() {
    const p = S.pending; if (!p) return; S.pending = null;
    const first = !S.entered;
    let next, animate = false;
    if (p.keep && S.order.length) {
      next = M.keepOrder(S.order, S.base);
      if (M.sameOrder(next, S.order) && S.grid) return;
    } else { next = M.sortByVerdict(S.base, verdictOf); animate = !first && S.mounted.size > 0; S.settle = true; }
    lastRange = '';
    place(next, { animate });
    if (first) enter();
  }
  /* La liste redevient visible (onglet Explorer, retour de la carte) : rendu en attente, puis fenêtre à jour. */
  function sync() {
    if (!head) return;
    paintSeg();
    if (!visible()) return;
    if (fitDue) fitPills();
    if (S.pending) apply(); else if (S.grid) { if (Math.abs(list.clientWidth - S.width) > 1) relayout(); else update(); }
  }
  function relayout() {
    if (!S.grid || !visible()) return;
    fitPills();
    measure(); list.style.height = S.grid.height + 'px'; lastRange = '';
    S.mounted.forEach(it => { const i = S.index.get(it.id); if (i == null) return; it.x = S.grid.x(i); it.y = S.grid.y(i); it.el.style.transform = at(it.x, it.y); });
    update();
  }

  let frame = 0;
  wrap.addEventListener('scroll', () => {
    if (body.dataset.screen !== 'spots') return;
    scrolledAt = performance.now();
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
  }, { passive: true });
  const touch = () => { S.touched = true; if (S.parked) unpark(); };
  wrap.addEventListener('pointerdown', touch, { passive: true, capture: true });
  wrap.addEventListener('wheel', touch, { passive: true });
  wrap.addEventListener('keydown', touch, true);
  let resizeFrame = 0;
  addEventListener('resize', () => { if (!resizeFrame) resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; relayout(); }); });
  /* Retour sur l’écran : sync deux images plus tard (rendu en attente, fenêtre à jour) ; les lignes mises de côté
     reviennent après la transition (420 ms), hors de l’image du retour elle-même. */
  window.addEventListener('ocean:navigate', e => {
    if (e.detail !== 'spots') { clearTimeout(parkTimer); if (head) park(); return; }
    requestAnimationFrame(() => requestAnimationFrame(sync));
    clearTimeout(parkTimer); parkTimer = setTimeout(unpark, 420);
  });
  /* Filet : dès que la liste a une largeur (écran affiché après une transition, rotation, colonne latérale), elle se met à jour. */
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (head && visible()) sync(); }).observe(host);

  /* Explorer s’ouvre sur la planète 3D (demande du fondateur, 23 nov. 2026 : « dans explorer, il faut que on tombe
     directement sur la planète en 3D »). La liste reste à un toucher (sélecteur Liste / Carte, bouton « Liste » de la carte).
     - Entrer dans Explorer depuis un autre écran (onglet, lien) ouvre la planète. Un retour depuis une fiche, ou un Retour
       ou Avancer de l’historique (navigation.js restaure alors la vue enregistrée), garde la vue où l’on était : la liste
       ouverte avant la fiche revient à sa place.
     - Les liens qui veulent la liste (favoris, recherche de l’accueil) appellent setView('list') juste après go('spots') :
       ils gardent la main, puisque ce choix passe avant le leur.
     - « Tous les continents » ramène à la planète entière.
     app-shell.js (chargé en dernier) enveloppe déjà go et backToWorlds ; ces enveloppes-ci sont posées une fois tous les
     scripts lus (DOMContentLoaded), donc par-dessus, sans toucher à app-shell.js. */
  function globeFirst() {
    const wrapAfter = (name, before, after) => {
      const f = window[name]; if (typeof f !== 'function' || f.__exlGlobe) return;
      const w = function (...a) { const ctx = before ? before(...a) : null; const r = f.apply(this, a); try { after(ctx, ...a); } catch (e) { console.warn(e); } return r; };
      w.__exlGlobe = true; window[name] = w;
    };
    const restoring = () => window.OceanNavigation?.restoreScroll?.() != null;
    const toMap = () => { if (typeof setView === 'function' && typeof spotWorld !== 'undefined' && spotWorld) setView('map'); };
    /* Entrée dans Explorer : lue sur l’évènement « ocean:navigate », émis par go() lui-même, et non en enveloppant go.
       Dans l’app iPhone, les scripts sont chargés un à un après DOMContentLoaded : ce fichier passe avant app.js, go
       n’existait pas encore et l’enveloppe n’était jamais posée (Explorer s’ouvrait sur la liste ; simulateur, 23 nov.).
       La vue part après la fin de go et de ses enveloppes (microtâche), comme le faisait l’enveloppe. */
    let from = body.dataset.screen || 'home';
    window.addEventListener('ocean:navigate', e => {
      const ctx = { from, s: e.detail, restoring: restoring() }; from = e.detail;
      if (ctx.s !== 'spots' || ctx.restoring || ctx.from === 'spots' || ctx.from === 'detail') return;
      queueMicrotask(toMap);
    });
    /* backToWorlds n’existe qu’une fois app.js chargé : enveloppé dès qu’il existe (au plus tard à la première navigation). */
    const wrapBack = () => wrapAfter('backToWorlds', null, () => { if (body.dataset.screen === 'spots') { toMap(); setTimeout(() => window.OceanMap?.overview?.(), 60); } });
    wrapBack(); window.addEventListener('load', wrapBack, { once: true }); window.addEventListener('ocean:navigate', wrapBack, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', globeFirst, { once: true }); else globeFirst();

  window.OceanExploreList = { render, sync, view: () => requestAnimationFrame(sync), sheetOpen: () => !!sheet, closeSheet: () => closeSheet(),
    get count() { return S.order.length; }, get mounted() { return S.mounted.size; } };
})();
