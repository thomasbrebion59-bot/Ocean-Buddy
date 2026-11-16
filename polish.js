/* Ocean Buddy — finitions d'immersion : apparition des cartes au défilement,
   images en fondu, parallaxe du panorama, en-tête réactif, mode hors connexion
   et installation sur l'écran d'accueil. Tout reste désactivé quand la
   personne a demandé moins d'animations. */
(() => {
  'use strict';
  const wrap = document.getElementById('screenWrap');
  if (!wrap) return;
  const calm = () => document.body.classList.contains('reduce-motion') ||
    (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- Cartes qui apparaissent au défilement ---- */
  const CARDS = '.activity-adventure,.field-arrival,.isl,.spot,.block,.field-nearby-card,.trip-idea,.trip-saved-card,.pstat,.chal,.badge,.evt,.community-panel,.sess,.qb';
  /* Sections du fil de l’accueil : seulement celles qui sont sous l’écran au moment du rendu (jamais ce qui est déjà
     visible, donc rien ne bouge à la levée du rideau). Elles apparaissent une seule fois, en arrivant au défilement. */
  const BELOW = '.hf-feed>section';
  const seen = new WeakSet();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('rv-in');
      io.unobserve(el);
      setTimeout(() => el.classList.remove('rv', 'rv-in'), 900);
    });
  }, { root: wrap, rootMargin: '0px 0px -6% 0px', threshold: 0.06 }) : null;

  /* Visibilité de départ lue par un IntersectionObserver, sans getBoundingClientRect : mesurer chaque carte juste
     après un rendu forçait le style et la mise en page de tout le document (jusqu'à 1,4 s par changement
     d'activité sous ralentissement x6, banc creme-logo). Le premier rapport arrive après la peinture : une carte
     hors champ reçoit .rv sans qu'on la voie disparaître, une carte visible re-rendue ne clignote pas. */
  const arriving = new WeakSet();
  const probe = io ? new IntersectionObserver(entries => {
    let stagger = 0;
    entries.forEach(entry => {
      const el = entry.target;
      probe.unobserve(el);
      const entering = arriving.has(el);
      arriving.delete(el);
      if (!el.isConnected || calm()) return;
      const r = entry.boundingClientRect, view = entry.rootBounds;
      if (!r.width) return; /* écran caché : on n'anime pas ce qu'on ne voit pas */
      /* même règle qu'avant : visible dans la hauteur de #screenWrap (une carte d'un rail horizontal compte) */
      const visible = view ? r.top < view.bottom && r.bottom > view.top : entry.isIntersecting;
      /* un contenu re-rendu sous les yeux ne clignote pas ; à l'arrivée sur
         un écran, ce qui est visible apparaît en léger décalé */
      if (visible && !entering) return;
      el.style.setProperty('--rv-delay', (visible ? Math.min(stagger++, 6) * 45 : 0) + 'ms');
      el.classList.add('rv');
      io.observe(el);
    });
  }, { root: wrap, threshold: 0 }) : null;

  function prepare(root, entering) {
    if (!io || calm()) return;
    const list = root.matches?.(CARDS) ? [root] : root.querySelectorAll?.(CARDS) || [];
    list.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      if (entering) arriving.add(el);
      probe.observe(el);
    });
    const below = root.matches?.(BELOW) ? [root] : root.querySelectorAll?.(BELOW) || [];
    below.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      probe.observe(el);
    });
  }

  /* ---- Images en fondu ---- */
  function fade(img) {
    if (img.dataset.fade || img.complete || calm()) return;
    img.dataset.fade = '1';
    img.classList.add('img-wait');
    const done = () => { img.classList.add('img-ready'); img.classList.remove('img-wait'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }
  function images(root) {
    if (root.tagName === 'IMG') fade(root);
    else root.querySelectorAll?.('img').forEach(fade);
  }

  let pending = new Set(), frame = 0;
  const flush = () => { frame = 0; pending.forEach(node => { if (node.isConnected) { images(node); prepare(node); } }); pending = new Set(); };
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) pending.add(node); }));
    if (!frame && pending.size) frame = requestAnimationFrame(flush);
  }).observe(wrap, { childList: true, subtree: true });

  window.addEventListener('ocean:navigate', () => {
    setTimeout(() => { const s = document.querySelector('.screen.active'); if (s) prepare(s, true); }, 60);
  });
  images(wrap);

  /* ---- En-tête réactif et parallaxe du panorama ---- */
  /* Parallaxe du panorama : animation liée au défilement (polish.css) quand le navigateur sait le faire, entièrement
     sur le compositeur. Sinon, repli ci-dessous (une écriture de style par image). */
  let cssParallax = false;
  try { cssParallax = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', '--ob-wrap') && CSS.supports('animation-range', '0px 900px')); } catch (_) {}
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = wrap.scrollTop;
      /* classe écrite seulement quand elle change (avant : à chaque image de défilement) */
      if (document.body.classList.contains('is-scrolled') !== y > 8) document.body.classList.toggle('is-scrolled', y > 8);
      if (cssParallax || document.body.dataset.screen !== 'detail' || calm()) return;
      const photo = document.getElementById('dHeroPhoto');
      if (photo && y < 900) photo.style.translate = '0 ' + Math.round(y * 0.28) + 'px';
    });
  }
  wrap.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('ocean:navigate', () => {
    const photo = document.getElementById('dHeroPhoto');
    if (photo) photo.style.translate = '';
    document.body.classList.remove('is-scrolled');
  });

  /* ---- Connexion ---- */
  const say = msg => { try { toast(msg); } catch (_) {} };
  window.addEventListener('offline', () => { document.body.classList.add('is-offline'); say('Hors connexion : tes spots, voyages et notes restent disponibles.'); });
  window.addEventListener('online', () => { document.body.classList.remove('is-offline'); say('De retour en ligne. Les prévisions se mettent à jour.'); });
  if (navigator.onLine === false) document.body.classList.add('is-offline');

  /* ---- Partager un spot ---- */
  const PUBLIC_URL = 'https://oceanbuddy.app/';
  const hero = document.getElementById('detailHero'), fav = document.getElementById('dFav');
  if (hero && fav) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'hero-share'; btn.setAttribute('aria-label', 'Partager ce spot'); btn.title = 'Partager ce spot';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5"/></svg>';
    fav.after(btn);
    /* aligné à gauche du cœur, quelle que soit la mise en page (mobile, tablette, ordinateur) ;
       quand le cœur du haut est masqué (il vit dans la barre d’actions du bas), le partage prend sa place. */
    const place = () => {
      const cs = getComputedStyle(fav), hidden = cs.display === 'none', size = hidden ? parseFloat(cs.width) : fav.getBoundingClientRect().width;
      if (!size || cs.right === 'auto') return;
      btn.style.top = cs.top; btn.style.right = (hidden ? parseFloat(cs.right) : parseFloat(cs.right) + size + 10) + 'px';
      btn.style.width = btn.style.height = size + 'px';
    };
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(fav);
    window.addEventListener('ocean:navigate', e => { if (e.detail === 'detail') { requestAnimationFrame(place); setTimeout(place, 480); } });
    window.addEventListener('resize', place);
    btn.addEventListener('click', async () => {
      const spot = (window.SPOTS || []).find(x => x.id === window.currentSpot) || (typeof SPOTS !== 'undefined' && SPOTS.find(x => x.id === currentSpot));
      if (!spot) return;
      /* Lien vers la page publique du spot (spot/<id>/, générée par scripts/build-seo.cjs avec son image d’aperçu) :
         toujours l’adresse publique, jamais localhost ni le chargeur de l’app. Spot privé ou absent du catalogue publié :
         ancien lien #spot= (toujours lu à l’ouverture, plus bas). */
      const published = !spot.custom && Array.isArray(window.OCEAN_CATALOG) && window.OCEAN_CATALOG.some(x => x.id === spot.id);
      const pretty = published && window.SpotFitModel ? window.SpotFitModel.shareUrl(PUBLIC_URL, spot.id) : null;
      const base = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin + location.pathname : PUBLIC_URL;
      const url = pretty || base + '#spot=' + encodeURIComponent(spot.id);
      const LV = { debutant: 'débutant', intermediaire: 'intermédiaire', expert: 'expert' };
      const sport = typeof spotSports === 'function' && typeof SPORTMAP !== 'undefined' ? (spotSports(spot).map(id => SPORTMAP[id] && SPORTMAP[id].label.replace(/\s*\(.*\)/, ''))[0] || '') : '';
      const tr = t => { try { return window.OB_I18N && OB_I18N.t ? OB_I18N.t(t) : t; } catch (_) { return t; } };
      const text = [spot.name, LV[spot.level] && tr(LV[spot.level]), sport && tr(sport)].filter(Boolean).join(' · ');
      try {
        if (navigator.share) { await navigator.share({ title: spot.name, text, url }); return; }
        await navigator.clipboard.writeText(text + ' ' + url); say('Lien du spot copié !');
      } catch (err) { if (err?.name !== 'AbortError') say('Partage impossible sur cet appareil.'); }
    });
  }

  /* ---- Lien partagé vers un spot (#spot=…) : on l'ouvre directement ---- */
  const shared = /^#spot=([\w-]+)$/.exec(location.hash);
  if (shared && typeof SPOTS !== 'undefined' && SPOTS.some(x => x.id === shared[1])) {
    const onb = document.getElementById('onb');
    if (onb && !onb.classList.contains('hide')) { onb.classList.add('hide'); onb.style.display = 'none'; }
    setTimeout(() => { try { openSpot(shared[1]); history.replaceState(history.state, '', location.pathname + location.search); } catch (_) {} }, 60);
  }

  /* ---- Raccourcis de l'écran d'accueil (#spots, #trips…) ---- */
  const target = location.hash.slice(1);
  if (['spots', 'trips', 'challenges', 'profile', 'community'].includes(target) && document.getElementById('onb')?.classList.contains('hide')) {
    setTimeout(() => { try { go(target); history.replaceState(history.state, '', location.pathname + location.search); } catch (_) {} }, 50);
  }

  /* ---- Application installable et disponible hors connexion (web uniquement) ---- */
  const native = window.Capacitor?.isNativePlatform?.() || document.documentElement.classList.contains('native-app');
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure && !native) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}); });
  }
})();
