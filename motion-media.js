/* Clips muets en boucle (assets/motion) : onboarding + bande d’ambiance de l’accueil.
   Règles : jamais de réécriture de l’accueil (une seule insertion absolue, après la levée du rideau),
   posters seuls si mouvement réduit / économie de données / lecture refusée. */
(() => {
  'use strict';
  const D = 'assets/motion/';
  const body = () => document.body;
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const motionOK = () => !(mq && mq.matches) && !body().classList.contains('reduce-motion') && !(navigator.connection && navigator.connection.saveData);

  function makeVideo(name) {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', ''); v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
    v.preload = 'auto'; v.poster = D + name + '.webp'; v.src = D + name + '.mp4';
    return v;
  }
  /* Lecture refusée (NotAllowed/NotSupported) : on retire la vidéo, on annule la référence du propriétaire (onFail)
     et on garde le poster jusqu’au prochain geste. AbortError (pause/release pendant play()) est ignoré. */
  let blocked = false, retries = 0;
  const play = (v, onFail) => {
    const fail = () => { drop(v); blocked = true; if (onFail) onFail(); };
    try {
      const p = v.play();
      if (p && p.catch) p.catch(e => { if (e && (e.name === 'NotAllowedError' || e.name === 'NotSupportedError')) fail(); });
    } catch (e) { fail(); }
  };
  function retryOnGesture() {
    if (!blocked || retries >= 1) return;
    blocked = false; retries++;
    onbSync(); bandSync();
  }
  ['pointerdown', 'touchend'].forEach(t => addEventListener(t, retryOnGesture, { passive: true, once: false }));
  const pause = v => { try { v.pause(); } catch (e) {} };
  /* Lecture refusée : on garde le poster (le calque fournit déjà la même image). */
  function drop(v) { if (!v) return; pause(v); release(v); v.remove(); }
  function release(v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
  const posterVar = name => `url("${D}${name}.webp")`;

  /* ---------- Onboarding ---------- */
  const onb = document.getElementById('onb');
  let layer = null, onbVideo = null;
  const onbShown = () => !!onb && !onb.classList.contains('hide') && !document.documentElement.classList.contains('ob-onboarded') && onb.style.display !== 'none' && getComputedStyle(onb).display !== 'none';
  const onbStep = () => { const a = onb.querySelector('.onb-step.active'); return a ? +a.dataset.step : 0; };
  function onbRemove() {
    if (onbVideo) { release(onbVideo); onbVideo = null; }
    if (layer) { layer.remove(); layer = null; }
  }
  function onbSync() {
    if (!onb) return;
    if (!onbShown()) { onbRemove(); return; }
    const step = onbStep();
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'mm-layer'; layer.setAttribute('aria-hidden', 'true');
      layer.style.setProperty('--mm-poster', posterVar('c1-manta-soleil'));
      onb.insertBefore(layer, onb.firstChild);
    }
    if (step === 0 && motionOK() && !document.hidden) {
      if (!onbVideo) { onbVideo = makeVideo('c1-manta-soleil'); layer.appendChild(onbVideo); }
      if (onbVideo.paused) { const v = onbVideo; play(v, () => { if (onbVideo === v) onbVideo = null; }); }
    } else if (onbVideo) {
      if (!motionOK()) { release(onbVideo); onbVideo.remove(); onbVideo = null; } else pause(onbVideo);
    }
  }
  /* Rien pendant le démarrage : l’onboarding peut paraître visible un instant avant qu’app.js ne le masque
     (retour d’un utilisateur connu) ; la vidéo ne se charge qu’après la levée du rideau. */
  function onbStart() {
    new MutationObserver(onbSync).observe(onb, { attributes: true, attributeFilter: ['class', 'style'], subtree: true });
    onbSync();
    document.addEventListener('visibilitychange', () => { retries = 0; onbSync(); });
    addEventListener('pageshow', onbSync);
  }
  if (onb) {
    if (window.OceanBoot && OceanBoot.after && !OceanBoot.lifted) OceanBoot.after(onbStart); else onbStart();
  }

  /* ---------- Accueil : bande ambiante ---------- */
  const home = document.getElementById('home');
  let band = null, bandVideo = null, inView = false, io = null;
  function bandSync() {
    if (!band) return;
    const want = motionOK() && inView && !document.hidden && body().dataset.screen === 'home' && window.OceanBoot ? OceanBoot.lifted : false;
    if (want) {
      if (!bandVideo) { bandVideo = makeVideo('c3-rivage'); band.insertBefore(bandVideo, band.firstChild); }
      if (bandVideo.paused) { const v = bandVideo; play(v, () => { if (bandVideo === v) bandVideo = null; }); }
    } else if (bandVideo) {
      if (!motionOK()) { release(bandVideo); bandVideo.remove(); bandVideo = null; } else pause(bandVideo);
    }
  }
  function mountBand() {
    if (!home || band || home.querySelector('.mm-band')) return;
    band = document.createElement('div'); band.className = 'mm-band'; band.setAttribute('aria-hidden', 'true');
    band.style.setProperty('--mm-poster', posterVar('c3-rivage'));
    home.appendChild(band); /* absolu, z-index -1 : hors flux, aucune réorganisation de l’accueil */
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => { inView = es[es.length - 1].isIntersecting; bandSync(); }, { threshold: 0.4 });
      io.observe(band);
    } else inView = true;
    new MutationObserver(bandSync).observe(body(), { attributes: true, attributeFilter: ['data-screen', 'class'] });
    document.addEventListener('visibilitychange', () => { retries = 0; bandSync(); });
    bandSync();
  }
  if (home) {
    /* Monté au repos, bien après la levée du rideau : jamais pendant l’apparition de l’accueil. */
    const go = () => setTimeout(() => (window.requestIdleCallback || (f => setTimeout(f, 0)))(mountBand, { timeout: 2000 }), 1500);
    if (window.OceanBoot && !OceanBoot.lifted) addEventListener('ocean:home-ready', go, { once: true });
    else go();
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { onbSync(); bandSync(); });
})();
