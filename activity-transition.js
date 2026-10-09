/* Transition d'activité : la photo de l'activité monte en plein écran, l'écran change dessous,
   le nom de l'activité apparaît en bas à gauche, puis la photo se retire. Environ 1,1 s.
   Un toucher passe directement à la fin. Mouvement réduit : fondu seul. */
(() => {
  'use strict';
  const V = '?v=5';
  const IDS = ['surf', 'bodyboard', 'baignade', 'paddle', 'kayak', 'snorkeling', 'plongee', 'kitesurf', 'windsurf'];
  const FX = Object.fromEntries(IDS.map(id => [id, { photo: `assets/transitions/${id}.webp${V}` }]));
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const reduced = () => document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const decoded = new Map();
  let active = null;
  let currentEl = null;
  let seq = 0;

  /* Les photos se chargent avant le premier toucher, pour que le voile ne montre jamais un trou. */
  function preload() {
    IDS.forEach(id => {
      if (decoded.has(id)) return;
      const im = new Image();
      im.decoding = 'async';
      im.src = FX[id].photo;
      decoded.set(id, im);
    });
  }
  function count(id) {
    try { return SPOTS.filter(s => spotSports(s).includes(id)).length; } catch (_) { return 0; }
  }
  async function play(id, swap) {
    const request = ++seq;
    /* La dernière sélection remplace la précédente, même avant le changement d’écran. */
    active?.finish(false);
    const fx = FX[id];
    if (!fx) { if (request === seq) swap?.(); return; }
    let swapped = false;
    const doSwap = () => { if (swapped || request !== seq) return; swapped = true; try { swap?.(); } catch (e) { console.error(e); } };
    let el = null, timer = null, release;
    const stopped = new Promise(resolve => { release = resolve; });
    const animations = new Set();
    const run = { done: false, finish(apply = true) {
      if (run.done) return;
      run.done = true;
      clearTimeout(timer);
      animations.forEach(a => a.cancel());
      el?.remove();
      if (currentEl === el) currentEl = null;
      if (active === run) active = null;
      release();
      if (apply) doSwap();
    } };
    active = run;
    const pause = ms => Promise.race([wait(ms), stopped]);
    const anim = (target, frames, ms, delay = 0) => {
      if (run.done) return Promise.resolve();
      try {
        const a = target.animate(frames, { duration: ms, delay, easing: EASE, fill: 'forwards' });
        animations.add(a);
        return Promise.race([a.finished.catch(() => {}), stopped]);
      } catch (_) { return Promise.resolve(); }
    };
    /* Une animation interrompue ou suspendue ne doit jamais bloquer les touches. */
    timer = setTimeout(() => run.finish(), 1800);
    try {
      const sport = (typeof SPORTMAP !== 'undefined' && SPORTMAP[id]) || { label: id }, n = count(id);
      el = document.createElement('div');
      currentEl = el;
      el.className = 'act-tr';
      el.dataset.act = id;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `<img class="act-tr-photo" src="${fx.photo}" alt="" decoding="async"><div class="act-tr-shade"></div><div class="act-tr-cap"><span class="act-tr-eyebrow">Activité</span><b class="act-tr-title">${sport.label}</b>${n ? `<small class="act-tr-count">${n} spots</small>` : ''}</div>`;
      const live = document.getElementById('a11yLive');
      if (live) live.textContent = `${sport.label} : ${n} spots`;
      document.body.append(el);
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        run.finish();
      }, { once: true });
      const photo = el.querySelector('.act-tr-photo'), cap = el.querySelector('.act-tr-cap');
      const calm = reduced();

      /* La photo doit être prête ; sinon on attend au plus 350 ms, le fond marine reste affiché. */
      const img = decoded.get(id);
      if (img && !img.complete) await Promise.race([img.decode?.().catch(() => {}) ?? pause(350), pause(350)]);
      if (run.done) return;

      if (calm) {
        photo.style.clipPath = 'inset(0)';
        photo.style.transform = 'none';
        el.querySelector('.act-tr-shade').style.opacity = '1';
        await anim(el, [{ opacity: 0 }, { opacity: 1 }], 160);
        if (run.done) return;
        doSwap();
        if (run.done) return;
        cap.style.opacity = '1';
        await pause(260);
        if (run.done) return;
        await anim(el, [{ opacity: 1 }, { opacity: 0 }], 160);
      } else {
        el.style.opacity = '1';
        /* 1. la photo monte depuis le bas, 2. l’écran change dessous, 3. la légende arrive, 4. la photo se retire. */
        const rise = anim(photo, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], 420);
        anim(photo, [{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], 1100);
        await rise;
        if (run.done) return;
        doSwap();
        if (run.done) return;
        try { navigator.vibrate?.(6); } catch (_) {}
        anim(el.querySelector('.act-tr-shade'), [{ opacity: 0 }, { opacity: 1 }], 260);
        anim(cap, [{ opacity: 0, transform: 'translate3d(0,10px,0)' }, { opacity: 1, transform: 'none' }], 320, 80);
        await pause(520);
        if (run.done) return;
        await anim(el, [{ opacity: 1 }, { opacity: 0 }], 260);
      }
    } catch (e) {
      console.error(e);
    } finally {
      run.finish();
    }
  }
  /* Retour à « toutes les activités » : fondu enchaîné natif (View Transitions) quand le navigateur le permet. */
  function neutral(swap) {
    ++seq;
    const interrupted = !!active;
    active?.finish(false);
    if (interrupted || reduced() || !document.startViewTransition) { swap?.(); return; }
    try { document.startViewTransition(() => swap?.()); } catch (_) { swap?.(); }
  }
  /* Annule le changement en attente et retire immédiatement la scène en cours. */
  function cancel() {
    ++seq;
    currentEl?.remove();
    active?.finish(false);
  }
  window.OceanTransition = { play, neutral, cancel, preload, FX };
  preload();
})();
