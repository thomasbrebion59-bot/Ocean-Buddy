/* Repère « adapté à ton niveau » et bandeau « Avant d’y aller » : calculs purs, sans DOM.
   Le même fichier sert dans l’app (window.SpotFitModel) et dans les tests Node.
   fit() compare deux données déjà présentes dans l’app : le niveau choisi par la personne (Réglages, chosenLevel)
   et, pour le spot, son niveau au catalogue et la jauge de danger calculée (dangerGauge, barème du 20 octobre 2026).
   C’est un repère : il ne dit jamais « sans danger », et il se tait quand une des deux données manque. */
(function (root) {
  'use strict';
  const RANK = {debutant: 0, intermediaire: 1, expert: 2};
  /* Jauge la plus haute « dans les repères » de chaque niveau : 2 sur 4 pour débutant et intermédiaire, 3 pour expert. */
  const GAUGE_OK = {debutant: 2, intermediaire: 2, expert: 3};
  const KINDS = ['fit', 'stretch', 'above'];

  /* Résultat : {kind, level, danger}
     kind : 'fit' (adapté à ton niveau), 'stretch' (exigeant pour ton niveau), 'above' (au-dessus de ton niveau),
            'zones' (niveau du spot non fixé, danger dans tes repères : rien à affirmer),
            'unrated' (danger non évalué : rien à affirmer), 'nolevel' (niveau de la personne inconnu).
     level / danger : true quand cette donnée fait monter le repère (pour l’explication). */
  function fit(spotLevel, gaugeN, userLevel) {
    if (!Object.prototype.hasOwnProperty.call(RANK, userLevel)) return {kind: 'nolevel', level: false, danger: false};
    const u = RANK[userLevel];
    const s = Object.prototype.hasOwnProperty.call(RANK, spotLevel) ? RANK[spotLevel] : null;
    const g = Number.isFinite(gaugeN) && gaugeN >= 1 ? Math.min(4, Math.round(gaugeN)) : null;
    let byLevel = 0, byDanger = 0;
    if (s !== null) byLevel = Math.max(0, Math.min(2, s - u));
    if (g !== null && g > GAUGE_OK[userLevel]) byDanger = userLevel === 'debutant' && g >= 4 ? 2 : 1;
    const step = Math.max(byLevel, byDanger);
    const out = {kind: KINDS[step], level: byLevel > 0 && byLevel === step, danger: byDanger > 0 && byDanger === step};
    if (step > 0) return out;
    if (g === null) return {kind: 'unrated', level: false, danger: false};
    if (s === null) return {kind: 'zones', level: false, danger: false};
    return out;
  }
  /* Seuls ces trois repères s’affichent en pastille (cartes, tête de fiche). */
  const shown = r => !!r && KINDS.indexOf(r.kind) >= 0;

  /* Danger principal : même choix que la carte « Danger principal » de la fiche (field-guide.js) : la première ligne
     du catalogue, sinon la première du carnet (alors non vérifiée). */
  function mainDanger(s) {
    const ok = d => Array.isArray(d) && typeof d[1] === 'string' && d[1].trim() !== '';
    const own = (s && Array.isArray(s.dangers) ? s.dangers : []).filter(ok);
    const carnet = !own.length && s && s.carnet && Array.isArray(s.carnet.dangers) ? s.carnet.dangers.filter(ok) : [];
    const d = own[0] || carnet[0];
    return d ? {text: d[1].trim(), icon: d[0], basis: own.length ? 'catalogue' : 'carnet'} : null;
  }

  /* Meilleur créneau d’aujourd’hui, tel que l’a calculé SpotWeatherModel.bestSlot pour la fiche (aucun nouveau calcul,
     aucun appel réseau) : heures de début et de fin, ou la raison de l’absence. */
  function slotSummary(rule, r) {
    if (!rule || !rule.ok) return {status: 'norule', reason: rule && rule.reason || null};
    if (!r) return {status: 'pending'};
    if (r.status !== 'ok') return {status: r.status};
    const h = iso => { const m = /T(\d\d):/.exec(String(iso || '')); return m ? +m[1] : null; };
    const start = h(r.start), end = h(r.end);
    if (start == null) return {status: 'nodata'};
    return {status: 'ok', start, end: end == null ? start : end, quality: r.quality === 'good' ? 'good' : 'ok'};
  }

  /* Lien partagé : la page publique du spot (spot/<id>/, générée par scripts/build-seo.cjs, avec son og:image). */
  function shareUrl(base, id) {
    const b = String(base || '').replace(/\/?$/, '/');
    if (!/^https:\/\//.test(b) || !/^[\w-]+$/.test(String(id || ''))) return null;
    return b + 'spot/' + encodeURIComponent(String(id)) + '/';
  }

  const api = {RANK, GAUGE_OK, fit, shown, mainDanger, slotSummary, shareUrl};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpotFitModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
