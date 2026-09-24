/* Ambiance sonore de l'océan, entièrement synthétisée dans le navigateur :
   aucun fichier audio à télécharger. Houle grave, déferlement et écume se
   succèdent à un rythme irrégulier, comme sur une plage. Désactivée par
   défaut ; le choix est mémorisé sur l'appareil. */
(() => {
  'use strict';
  const KEY = 'oceanbuddy_sound_v1';
  let ctx = null, master = null, swell = null, foam = null, timer = 0, on = false;

  const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; } };
  const write = v => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (_) {} };

  function noise(seconds, brown) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.2; }
        else data[i] = white;
      }
    }
    return buffer;
  }
  function layer(buffer, type, freq, q) {
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const gain = ctx.createGain(); gain.gain.value = 0.0001;
    src.connect(filter).connect(gain).connect(master);
    src.start(0, Math.random() * 3);
    return { gain, filter };
  }
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    swell = layer(noise(6, true), 'lowpass', 520, 0.6);
    foam = layer(noise(4, false), 'bandpass', 2400, 0.7);
    return true;
  }
  /* Une vague : la houle monte, déferle, puis l'écume se retire. */
  function wave() {
    if (!on || !ctx) return;
    const t = ctx.currentTime, rise = 2.2 + Math.random() * 1.8, fall = 3.5 + Math.random() * 2.5;
    const peak = 0.55 + Math.random() * 0.35;
    const g = swell.gain.gain, f = foam.gain.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(g.value, 0.12), t);
    g.linearRampToValueAtTime(peak, t + rise);
    g.exponentialRampToValueAtTime(0.14, t + rise + fall);
    swell.filter.frequency.setValueAtTime(380, t);
    swell.filter.frequency.linearRampToValueAtTime(760, t + rise);
    swell.filter.frequency.linearRampToValueAtTime(420, t + rise + fall);
    f.cancelScheduledValues(t); f.setValueAtTime(Math.max(f.value, 0.0001), t);
    f.linearRampToValueAtTime(0.012, t + rise * 0.8);
    f.linearRampToValueAtTime(0.06 * peak, t + rise + 0.35);
    f.exponentialRampToValueAtTime(0.004, t + rise + fall + 1.2);
    timer = setTimeout(wave, (rise + fall - 0.6 + Math.random() * 2) * 1000);
  }
  function start() {
    if (!ctx && !build()) { try { toast('Le son n’est pas disponible sur cet appareil.'); } catch (_) {} return false; }
    ctx.resume?.();
    on = true;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.55, t + 1.8);
    clearTimeout(timer); wave();
    sync(); return true;
  }
  function stop() {
    on = false; clearTimeout(timer);
    if (ctx) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 0.8); setTimeout(() => { if (!on) ctx.suspend?.(); }, 900); }
    sync();
  }
  function toggle() {
    const next = !on;
    write(next);
    if (next) { if (start()) try { toast('Ambiance océan activée 🌊'); } catch (_) {} }
    else stop();
  }

  /* Bouton dans la barre du haut */
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4h3.5L11 18V6L6.5 10z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.8 7a7.5 7.5 0 0 1 0 10"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4h3.5L11 18V6L6.5 10z"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'chrome-sound';
  button.addEventListener('click', toggle);
  const chrome = document.querySelector('.app-chrome');
  const anchor = chrome?.querySelector('.mobile-search');
  if (chrome) chrome.insertBefore(button, anchor || chrome.lastChild);
  function sync() {
    button.innerHTML = on ? ICON_ON : ICON_OFF;
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Couper l’ambiance océan' : 'Activer l’ambiance océan');
    button.title = button.getAttribute('aria-label');
    button.classList.toggle('on', on);
    const box = document.getElementById('setSound'); if (box) box.checked = on;
  }

  /* Réglage dans le panneau « Réglages » */
  const reduce = document.querySelector('#settingsModal .set-toggle');
  if (reduce) {
    const label = document.createElement('label'); label.className = 'set-toggle';
    label.innerHTML = '<span>Ambiance sonore de l’océan</span><input type="checkbox" id="setSound">';
    reduce.after(label);
    label.querySelector('input').addEventListener('change', e => { if (e.target.checked !== on) toggle(); });
  }

  /* On ne joue pas en arrière-plan. */
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { clearTimeout(timer); ctx.suspend?.(); }
    else if (on) { ctx.resume?.(); clearTimeout(timer); wave(); }
  });

  /* Les navigateurs exigent un geste avant de produire du son : si
     l'ambiance était active, elle reprend au premier toucher. */
  if (read()) {
    on = false; sync();
    const resume = e => {
      if (button.contains(e.target)) return; /* le bouton gère lui-même son clic */
      window.removeEventListener('pointerdown', resume, true);
      if (read() && !on) start();
    };
    window.addEventListener('pointerdown', resume, true);
  } else sync();

  window.OceanSound = { toggle, start, stop, get on() { return on; } };
})();
