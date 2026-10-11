/* Transition d'activité : la photo de l'activité monte en plein écran, l'écran change dessous,
   le nom de l'activité apparaît en bas à gauche, puis la photo se retire. Environ 1,1 s.
   Un toucher abrège la scène sans dévoiler un écran encore en préparation. Mouvement réduit : fondu seul. */
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
    active?.finish();
    const fx = FX[id];
    if (!fx) { if (request === seq) swap?.(); return; }
    let swapped = false, skip = false, revealing = false, shorten;
    const skipped = new Promise(resolve => { shorten = resolve; });
    let el = null, timer = null, release;
    const stopped = new Promise(resolve => { release = resolve; });
    const animations = new Set();
    const run = { done: false, covered: false, finish() {
      if (run.done) return;
      run.done = true;
      clearTimeout(timer);
      animations.forEach(a => a.cancel());
      el?.remove();
      if (currentEl === el) currentEl = null;
      if (active === run) active = null;
      release();
      document.dispatchEvent(new CustomEvent('ocean:transition', { detail: false }));
    } };
    active = run;
    document.dispatchEvent(new CustomEvent('ocean:transition', { detail: true }));
    const pause = ms => Promise.race([wait(ms), skipped, stopped]);
    const nextFrame = () => Promise.race([new Promise(resolve => requestAnimationFrame(resolve)), stopped]);
    const isCurrent = () => !run.done && request === seq;
    const doSwap = async () => {
      if (swapped || !isCurrent()) return;
      swapped = true;
      run.covered = true;
      /* Le changement peut répartir ses rendus sur plusieurs images, toujours sous le voile opaque. */
      try { await Promise.race([Promise.resolve(swap?.({ nextFrame, isCurrent })), stopped]); }
      catch (e) { console.error(e); }
    };
    const skipScene = () => {
      if (run.done || skip) return;
      skip = true;
      animations.forEach(a => a.cancel());
      /* Un toucher (ou le garde-fou) couvre d’abord l’ancien écran ; le rendu reste attendu. */
      if (el && !revealing) {
        el.style.opacity = '1';
        el.querySelector('.act-tr-photo').style.transform = 'none';
        el.querySelector('.act-tr-cap').style.opacity = '1';
        el.querySelector('.act-tr-shade').style.opacity = '1';
      }
      shorten();
    };
    const anim = (target, frames, ms, delay = 0) => {
      if (run.done) return Promise.resolve();
      try {
        const a = target.animate(frames, { duration: ms, delay, easing: EASE, fill: 'forwards' });
        animations.add(a);
        /* Une animation suspendue termine aussi par le garde-fou, y compris le fondu abrégé. */
        return Promise.race([a.finished.catch(() => {}), stopped, wait(ms + delay + 100)]).then(() => {
          if (!run.done && !skip) Object.assign(target.style, frames[frames.length - 1]);
        });
      } catch (_) {
        Object.assign(target.style, frames[frames.length - 1]);
        return Promise.resolve();
      }
    };
    /* Une animation interrompue ou suspendue ne doit jamais bloquer les touches. */
    timer = setTimeout(skipScene, 1800);
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
        skipScene();
      }, { once: true });
      const photo = el.querySelector('.act-tr-photo'), cap = el.querySelector('.act-tr-cap');
      const calm = reduced();

      /* La photo doit être prête ; sinon on attend au plus 350 ms, le fond marine reste affiché. */
      const img = decoded.get(id);
      if (img && !img.complete) await Promise.race([img.decode?.().catch(() => {}) ?? pause(350), pause(350)]);
      if (run.done) return;

      if (calm) {
        photo.style.transform = 'none';
        el.querySelector('.act-tr-shade').style.opacity = '1';
        if (!skip) await anim(el, [{ opacity: 0 }, { opacity: 1 }], 160);
      } else {
        el.style.opacity = '1';
        /* La photo monte sans repeindre le calque à chaque image. */
        if (!skip) await anim(photo, [{ transform: 'translate3d(0,100%,0) scale(1.06)' }, { transform: 'translate3d(0,0,0) scale(1)' }], 420);
      }
      if (!isCurrent()) return;
      /* La légende et le temps de lecture accompagnent la préparation, sans rallonger la scène. */
      const dwell = pause(calm ? 260 : 520);
      if (calm || skip) cap.style.opacity = '1';
      else {
        try { navigator.vibrate?.(6); } catch (_) {}
        anim(el.querySelector('.act-tr-shade'), [{ opacity: 0 }, { opacity: 1 }], 260);
        anim(cap, [{ opacity: 0, transform: 'translate3d(0,10px,0)' }, { opacity: 1, transform: 'none' }], 320, 80);
      }
      await doSwap();
      if (!isCurrent()) return;
      /* Le globe reprend sous la photo : son canevas doit être peint avant le fondu de sortie. */
      document.dispatchEvent(new CustomEvent('ocean:transition-ready'));
      await nextFrame();
      await nextFrame();
      await dwell;
      if (!isCurrent()) return;
      revealing = true;
      await anim(el, [{ opacity: 1 }, { opacity: 0 }], skip ? 120 : calm ? 160 : 260);
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
    active?.finish();
    if (interrupted || reduced() || !document.startViewTransition) { swap?.(); return; }
    try { document.startViewTransition(() => swap?.()); } catch (_) { swap?.(); }
  }
  /* Annule le changement en attente et retire immédiatement la scène en cours. */
  function cancel() {
    ++seq;
    currentEl?.remove();
    active?.finish();
  }
  window.OceanTransition = { play, neutral, cancel, preload, FX, get covered() { return !!active?.covered; } };
  preload();
})();
