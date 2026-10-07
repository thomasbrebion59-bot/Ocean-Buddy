/* Pictogrammes d'activité et de niveau (SVG plats, assets/icons). Les libellés restent séparés et lisibles. */
(() => {
  'use strict';
  const keys = ['surf','bodyboard','baignade','paddle','kayak','snorkeling','plongee','kitesurf','windsurf','debutant','intermediaire','expert'];
  const src = key => keys.includes(key) ? `assets/icons/${key}.svg` : 'assets/icons/all.svg';
  function html(key, kind = '') {
    return `<img class="poulpy-mini ob-ico ${kind}" src="${src(key)}" alt="" width="48" height="48" decoding="async">`;
  }
  window.PoulpyIcons = Object.freeze({src, html, keys: Object.freeze(keys)});
})();
