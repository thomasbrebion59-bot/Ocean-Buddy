/* Small, consistent Poulpy illustrations. Labels remain separate and readable. */
(() => {
  'use strict';
  const keys = ['surf','bodyboard','baignade','paddle','kayak','snorkeling','plongee','kitesurf','windsurf','debutant','intermediaire','expert'];
  const src = key => keys.includes(key) ? `assets/poulpy/icons/${key==='paddle'?'paddle-straight':key}.jpg` : 'assets/poulpy/scenes/travel-v2.webp';
  function html(key, kind = '') {
    return `<img class="poulpy-mini ${kind}" src="${src(key)}" alt="" width="80" height="80" decoding="async" loading="lazy">`;
  }
  window.PoulpyIcons = Object.freeze({src, html, keys: Object.freeze(keys)});
})();
