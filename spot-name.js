/* Noms de spots composés (« Hossegor — La Gravière ») : un seul utilitaire pour toute l’app.
   - short(name) : la partie avant le tiret (même coupe que l’ancien shortName d’ocean-map.js), texte source ;
   - parts(name) : nom traduit dans la langue choisie, puis coupé en { main, sub } ;
   - html(name)  : affichage en grand sur deux lignes, le nom puis la précision en plus petit, sans le tiret.
   Les données, les identifiants, la recherche et les URL gardent le nom complet : seul l’affichage change.
   Le nom étant déjà traduit en entier ici, l’enveloppe .nm porte data-no-i18n (le traducteur de page ne connaît pas
   les morceaux seuls). Une seule expression dans les gabarits appelants : les clés de traduction ({n}) ne bougent pas. */
(() => {
  'use strict';
  const SEP = ' — ';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const short = name => String(name || '').split(SEP)[0];
  function parts(name) {
    const raw = String(name || '');
    let t = raw; try { if (typeof window.obT === 'function') t = window.obT(raw) || raw; } catch (_) {}
    const i = t.indexOf(SEP);
    return i < 0 ? { main: t, sub: '' } : { main: t.slice(0, i), sub: t.slice(i + SEP.length) };
  }
  function html(name) {
    const p = parts(name);
    return `<span class="nm" translate="no" data-no-i18n><span class="nm-main">${esc(p.main)}</span>${p.sub ? `<span class="nm-sub">${esc(p.sub)}</span>` : ''}</span>`;
  }
  /* Pose le nom sur deux lignes dans un élément (titre de la fiche, aperçu, cartes). */
  function set(el, name) {
    if (!el) return;
    el.innerHTML = html(name);
  }
  window.SpotName = { SEP, short, parts, html, set };
})();
