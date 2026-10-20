/* Pictogrammes Ocean Buddy (direction « Rivages découpés » : aplats pétrole et soleil, assets/pictos).
   Registre unique : sports et niveaux (PoulpyIcons.src/html), silhouettes mono pour les masques CSS
   (PoulpyIcons.mono), et pictos d'interface rendus dans un <svg> (PoulpyIcons.svg) pour garder les
   tailles CSS existantes des anciens tracés. Les libellés restent séparés et lisibles. */
(() => {
  'use strict';
  const BASE = 'assets/pictos/';
  const sports = ['surf','bodyboard','baignade','paddle','kayak','snorkeling','plongee','kitesurf','windsurf'];
  const levels = ['debutant','intermediaire','expert'];
  const keys = [...sports, ...levels];
  /* Pictos d'interface : clé -> famille/fichier. Les clés absentes n'ont pas de dessin (flèches, commandes). */
  const PICTOS = 'affluence algue balai bateau bouteille cadenas camera carte coeur conditions_ok corail couronne dauphin eclair etoile feuille flamme fond grotte interdit invertebre mammifere marche materiel neige observer oiseau pin plan_eau planche poisson profondeur recycle reptile requin rocher saison soleil spirale sunrise surveillance temperature tortue trophee velo vent vigilance visibilite wave'.split(' ');
  const GUIDE = 'bed book calendar camping check compass food guest hostel hotel ile lac marche musee nature panorama patrimoine plage rando respect speech surfcamp village ville water'.split(' ');
  const FICHE = ['infos','saisons','meteo','activites','faune','preserver'];
  const ALIAS = {
    bpoisson: 'pictos/poisson', niveau: 'niveaux/intermediaire', level: 'niveaux/intermediaire',
    map: 'pictos/carte', season: 'pictos/saison', leaf: 'pictos/feuille', heart: 'pictos/coeur', lock: 'pictos/cadenas'
  };
  const path = name => {
    if (!name) return '';
    if (ALIAS[name]) return ALIAS[name];
    if (sports.includes(name) || name === 'all') return 'sports/' + name;
    if (levels.includes(name)) return 'niveaux/' + name;
    if (PICTOS.includes(name)) return 'pictos/' + name;
    if (name.startsWith('g-') && GUIDE.includes(name.slice(2))) return 'guide/' + name;
    if (name.startsWith('ft-') && FICHE.includes(name.slice(3))) return 'onglets-fiche/' + name;
    if (name.startsWith('tab-')) return 'onglets-app/' + name;
    return '';
  };
  const file = name => { const p = path(name); return p ? `${BASE}${p}.webp` : ''; };
  const has = name => !!path(name);
  const src = key => file(keys.includes(key) ? key : 'all');
  const mono = key => `${BASE}${key && key.startsWith('tab-') ? 'onglets-app/' + key : 'sports/' + (sports.includes(key) ? key : 'all')}-mono.webp`;
  function html(key, kind = '') {
    return `<img class="poulpy-mini ob-ico ${kind}" src="${src(key)}" alt="" width="48" height="48" decoding="async">`;
  }
  /* Picto dans un <svg> 24 x 24 : les règles CSS des anciens tracés (taille, alignement) restent valables. */
  function svg(name, cls = '') {
    const f = file(name);
    if (!f) return '';
    return `<svg class="oi${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><image href="${f}" x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }
  window.PoulpyIcons = Object.freeze({src, html, mono, file, has, svg, keys: Object.freeze(keys)});
})();
