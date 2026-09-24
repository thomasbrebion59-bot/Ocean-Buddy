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

  function prepare(root, entering) {
    if (!io || calm()) return;
    const list = root.matches?.(CARDS) ? [root] : root.querySelectorAll?.(CARDS) || [];
    let stagger = 0;
    const view = wrap.getBoundingClientRect();
    list.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      const r = el.getBoundingClientRect();
      if (!r.width) return; /* écran caché : on n'anime pas ce qu'on ne voit pas */
      const visible = r.top < view.bottom && r.bottom > view.top;
      /* un contenu re-rendu sous les yeux ne clignote pas ; à l'arrivée sur
         un écran, ce qui est visible apparaît en léger décalé */
      if (visible && !entering) return;
      el.style.setProperty('--rv-delay', (visible ? Math.min(stagger++, 6) * 45 : 0) + 'ms');
      el.classList.add('rv');
      io.observe(el);
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
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = wrap.scrollTop;
      document.body.classList.toggle('is-scrolled', y > 8);
      if (calm() || document.body.dataset.screen !== 'detail') return;
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
  const PUBLIC_URL = 'https://thomasbrebion59-bot.github.io/Ocean-Buddy/';
  const hero = document.getElementById('detailHero'), fav = document.getElementById('dFav');
  if (hero && fav) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'hero-share'; btn.setAttribute('aria-label', 'Partager ce spot'); btn.title = 'Partager ce spot';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5"/></svg>';
    fav.after(btn);
    /* aligné à gauche du cœur, quelle que soit la mise en page (mobile, tablette, ordinateur) */
    const place = () => {
      const cs = getComputedStyle(fav), size = fav.getBoundingClientRect().width;
      if (!size || cs.right === 'auto') return;
      btn.style.top = cs.top; btn.style.right = (parseFloat(cs.right) + size + 10) + 'px';
      btn.style.width = btn.style.height = size + 'px';
    };
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(fav);
    window.addEventListener('ocean:navigate', e => { if (e.detail === 'detail') { requestAnimationFrame(place); setTimeout(place, 480); } });
    window.addEventListener('resize', place);
    btn.addEventListener('click', async () => {
      const spot = (window.SPOTS || []).find(x => x.id === window.currentSpot) || (typeof SPOTS !== 'undefined' && SPOTS.find(x => x.id === currentSpot));
      if (!spot) return;
      const base = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin + location.pathname : PUBLIC_URL;
      const url = base + '#spot=' + encodeURIComponent(spot.id);
      const text = spot.name + ' — à découvrir sur Ocean Buddy 🌊';
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
  const native = window.Capacitor?.isNativePlatform?.();
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure && !native) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}); });
  }
})();
