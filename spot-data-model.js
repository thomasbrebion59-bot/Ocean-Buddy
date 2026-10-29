/* Ocean Data : calculs purs sur les normales climatiques d’un spot (data/climate.json).
   Aucune dépendance au DOM : le même fichier sert dans l’app et dans les tests Node.
   Les notes mensuelles sont des repères tirés de moyennes de plusieurs années, jamais une prévision. */
(function (root) {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  /* 0 sous a, 1 au-dessus de b, linéaire entre les deux (a > b inverse le sens). */
  const ramp = (x, a, b) => (x == null || !Number.isFinite(x)) ? null : clamp((x - a) / (b - a));
  const has = v => v != null && Number.isFinite(v);
  /* Moyenne pondérée qui ignore les composantes absentes (lac sans température de l’eau, spot sans vagues). */
  function blend(parts) {
    let s = 0, w = 0;
    for (const [v, k] of parts) if (has(v)) { s += v * k; w += k; }
    return w ? s / w : null;
  }

  /* Valeurs du mois m (0-11) d’une fiche climat. */
  function month(c, m) {
    if (!c) return null;
    const a = c.air || {}, w = c.wave || null, g = k => (a[k] ? a[k][m] : null), v = k => (w && w[k] ? w[k][m] : null);
    return {
      m, sea: c.sea ? c.sea[m] : null, tx: g('tx'), tn: g('tn'), rain: g('rain'), wet: g('wet'), sun: g('sun'), day: g('day'),
      wind: g('wind'), gust: g('gust'), kite: g('kite'), wdir: g('wdir'), rh: g('rh'),
      hs: v('hs'), p90: v('p90'), tp: v('tp'), dir: v('dir'), calm: v('calm'), flat: v('flat'), h1: v('h1'), h2: v('h2'), big: v('big'),
      waves: !!w
    };
  }

  const WATER_ACTS = ['baignade', 'snorkeling', 'plongee'];
  /* Note de 0 à 1 d’une activité pour un mois. level = niveau indiqué du spot (vagues). */
  function score(act, d, level) {
    if (!d) return null;
    const warm = (a, b) => ramp(d.sea, a, b);
    const air = has(d.tx) ? clamp(ramp(d.tx, 16, 26) * (1 - ramp(d.tx, 34, 41))) : null;
    const sunny = ramp(d.sun, 3.5, 9);
    const dry = has(d.wet) ? 1 - ramp(d.wet, 6, 21) : null;
    const calm = has(d.calm) ? d.calm / 100 : null;
    const still = has(d.wind) ? 1 - ramp(d.wind, 12, 30) : null;
    let s;
    switch (act) {
      case 'baignade':
        s = has(d.sea)
          ? blend([[warm(17, 25), .47], [air, .2], [sunny, .16], [dry, .12], [calm, .05]])
          : blend([[ramp(d.tx, 20, 29), .55], [sunny, .25], [dry, .2]]);
        if (has(d.sea) && d.sea < 18) s = Math.min(s, .3);
        break;
      case 'snorkeling':
        s = blend([[warm(18, 26), .45], [calm, .15], [sunny, .17], [dry, .12], [air, .11]]);
        if (has(d.sea) && d.sea < 17) s = Math.min(s, .3);
        break;
      case 'plongee':
        s = blend([[warm(13, 26), .35], [calm, .25], [dry, .17], [sunny, .11], [still, .12]]);
        break;
      case 'surf': case 'bodyboard': {
        let fit = null;
        if (d.waves && has(d.h1)) {
          const h1 = d.h1 / 100, h2 = d.h2 / 100, big = d.big / 100;
          fit = level === 'debutant' ? h1 + .35 * h2
            : level === 'expert' ? .25 * h1 + .85 * h2 + big
            : .55 * h1 + h2 + .3 * big;
          fit = clamp(fit * 1.15);
        }
        s = blend([[fit, .62], [ramp(d.tp, 7, 12), .14], [warm(13, 22), .09], [has(d.wind) ? 1 - ramp(d.wind, 24, 40) : null, .09], [dry, .06]]);
        if (fit == null) s = null;
        break;
      }
      case 'kitesurf': case 'windsurf': case 'wingfoil':
        s = blend([[ramp(d.kite, 15, 65), .65], [warm(14, 24), .15], [sunny, .1], [has(d.big) ? 1 - d.big / 100 : null, .1]]);
        if (has(d.gust) && d.gust > 48) s *= .85;
        break;
      case 'paddle': case 'kayak':
        s = blend([[still, .3], [calm, .25], [air, .2], [sunny, .15], [dry, .1]]);
        break;
      default:
        s = blend([[air, .4], [sunny, .3], [dry, .3]]);
    }
    return s == null ? null : Math.round(clamp(s) * 100) / 100;
  }
  const LEVELS = [.38, .55, .72];
  /* 0 = peu favorable, 1 = possible, 2 = bon, 3 = top */
  const level = s => s == null ? null : s >= LEVELS[2] ? 3 : s >= LEVELS[1] ? 2 : s >= LEVELS[0] ? 1 : 0;

  /* Les 12 notes d’une activité. */
  function year(c, act, lvl) {
    const out = [];
    for (let m = 0; m < 12; m++) out.push(score(act, month(c, m), lvl));
    return out;
  }
  /* Meilleurs mois : ceux à moins de 0,08 de la meilleure note (et au moins « possible »), groupés en plages. */
  function best(scores) {
    const ok = scores.filter(has);
    if (!ok.length) return { months: [], ranges: [], top: null };
    const top = Math.max(...ok);
    const months = scores.map((s, m) => (has(s) && s >= top - .08 && s >= LEVELS[0]) ? m : -1).filter(m => m >= 0);
    return { months, ranges: ranges(months), top };
  }
  /* [0,1,2,10,11] → [[10,2]] (plage circulaire novembre → mars) */
  function ranges(months) {
    if (!months.length) return [];
    if (months.length === 12) return [[0, 11]];
    const set = new Set(months), out = [];
    let start = months.find(m => !set.has((m + 11) % 12));
    if (start === undefined) return [[0, 11]];
    const seen = new Set();
    for (let k = 0; k < 12; k++) {
      const m = (start + k) % 12;
      if (!set.has(m) || seen.has(m)) continue;
      let e = m; seen.add(m);
      while (set.has((e + 1) % 12) && !seen.has((e + 1) % 12)) { e = (e + 1) % 12; seen.add(e); }
      out.push([m, e]);
    }
    return out;
  }

  /* Planificateur par mois : la vue légère [eau, air max, soleil, jours de pluie, % ventés, houle×10, % calme]. */
  const CRITERIA = {
    warm: r => has(r[0]) && r[0] >= 24,
    mild: r => has(r[0]) && r[0] >= 20,
    sun: r => has(r[2]) && r[2] >= 8,
    dry: r => has(r[3]) && r[3] <= 7,
    waves: r => has(r[5]) && r[5] >= 10 && r[5] <= 25,
    big: r => has(r[5]) && r[5] > 22,
    wind: r => has(r[4]) && r[4] >= 50,
    calm: r => has(r[6]) && r[6] >= 60,
    hot: r => has(r[1]) && r[1] >= 27
  };
  function lite(rec, m) {
    if (!rec) return null;
    return rec.map(v => (Array.isArray(v) ? v[m] : null));
  }
  function matches(rec, m, crit) {
    const r = lite(rec, m);
    if (!r) return false;
    return (crit || []).every(k => CRITERIA[k] ? CRITERIA[k](r) : true);
  }

  /* Lever et coucher du soleil (algorithme NOAA simplifié), en heures UTC décimales ; null si jour/nuit polaire. */
  function sunTimes(date, lat, lon) {
    const rad = Math.PI / 180;
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const doy = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 864e5);
    const g = 2 * Math.PI / 365 * (doy - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec))) - Math.tan(lat * rad) * Math.tan(dec);
    if (cosH > 1 || cosH < -1) return null;
    const ha = Math.acos(cosH) / rad;
    const noon = 720 - 4 * lon - eq;
    return { rise: (noon - 4 * ha) / 60, set: (noon + 4 * ha) / 60, noon: noon / 60 };
  }

  /* Combinaison selon la température moyenne de l’eau. Seuils de la réponse « combinaison » de Poulpy (app.js), aucun autre :
     plus de 22 °C shorty/lycra · de 17 à 21 °C une 3/2 · de 13 à 17 °C une 4/3 avec chaussons · moins de 13 °C une 5/4 avec chaussons, gants et cagoule.
     Ses plages se chevauchent à 17 °C et laissent un trou au-dessus de 21 °C jusqu’à 22 °C : à ces bornes on rend les deux repères voisins,
     du plus fin au plus épais, au lieu d’inventer un seuil. Vide si la température manque. */
  const SUIT_ACTS = ['surf', 'bodyboard', 'kitesurf', 'windsurf', 'wingfoil'];
  function wetsuit(t) {
    if (!has(t)) return [];
    const v = Math.round(t * 10) / 10;
    if (v > 22) return ['lycra'];
    if (v > 21) return ['lycra', '3/2'];
    if (v > 17) return ['3/2'];
    if (v === 17) return ['3/2', '4/3'];
    return v >= 13 ? ['4/3'] : ['5/4'];
  }

  /* Observations iNaturalist : sous ce nombre, « surtout en juillet » repose sur trop peu de relevés pour être présenté sans réserve. */
  const FEW_OBS = 8;
  const fewObs = c => has(c) && c < FEW_OBS;
  /* Les crédits photo arrivent déjà encodés (« Jan Ebr &amp; Ivana Ebrová ») : on décode une fois avant d’échapper pour l’affichage. */
  const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
  function decodeEntities(str) {
    return String(str == null ? '' : str).replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]{2,6}));/gi, (m, d, h, n) => {
      if (d != null || h != null) {
        const cp = d != null ? parseInt(d, 10) : parseInt(h, 16);
        return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
      }
      const hit = ENTITY[n.toLowerCase()];
      return hit === undefined ? m : hit;
    });
  }
  /* « La vraie faune du coin » vient d’observations côtières : on ne la montre que pour un spot en mer, pas pour un lac, une rivière ou un cénote. */
  const marineSpot = s => !!s && s.waterType === 'sea';
  /* Le carnet donne une saison, mais data/seasons.json (mois où carnet et moyennes climatiques s’accordent) n’a aucun mois pour ce spot.
     seasons absent (pas encore chargé) : on ne dit rien. */
  function seasonsDisagree(seasons, id, carnetSeason) {
    if (!seasons || typeof seasons !== 'object' || !carnetSeason) return false;
    const m = seasons[id];
    return !(Array.isArray(m) && m.length);
  }

  /* Secteur (0 = nord … 7 = nord-ouest) en angle et en mots. */
  const SECTOR_DEG = s => s * 45;
  const DIR_FROM = ['du nord', 'du nord-est', 'd’est', 'du sud-est', 'du sud', 'du sud-ouest', 'd’ouest', 'du nord-ouest'];

  /* ---------- « Ta session, expliquée » : lecture des conditions par niveau ----------
     Pur et sans DOM. Les repères pédagogiques sont des règles générales de lecture de la mer ; les chiffres viennent soit du modèle
     Open-Meteo (conditions du moment), soit des normales mensuelles (période, direction de la houle), soit du catalogue (zones, dangers).
     Aucun niveau de risque n’est calculé : on explique ce que le chiffre veut dire et ce qu’il faut regarder sur place. */
  const WAVE_SPORTS = ['surf', 'bodyboard'];
  const WIND_SPORTS = ['kitesurf', 'windsurf', 'wingfoil'];
  const WATER_SPORTS = ['baignade', 'snorkeling', 'paddle', 'kayak'];
  const COACH_LEVELS = ['debutant', 'intermediaire', 'expert'];
  const COACH_TITLE = { debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert' };
  /* Nature du conseil : « wave » (surf, bodyboard), « wind » (kite, windsurf), « water » (baignade, paddle…), null (plongée : on garde l’existant). */
  function coachKind(act, inland) {
    if (WAVE_SPORTS.includes(act)) return inland ? null : 'wave';
    if (WIND_SPORTS.includes(act)) return 'wind';
    if (WATER_SPORTS.includes(act)) return 'water';
    return null;
  }
  const BEARING = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SO: 225, SW: 225, O: 270, W: 270, NO: 315, NW: 315 };
  const bearing = c => { const k = String(c == null ? '' : c).trim().toUpperCase(); return Object.prototype.hasOwnProperty.call(BEARING, k) ? BEARING[k] : null; };
  const num1 = v => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : null; };
  /* Textes du moment (« 12 km/h NO », « 1,8 m », « 17°C », « Montante ») → nombres. Tout ce qui manque reste null. */
  function parseLive(l) {
    const out = { windKmh: null, windDir: null, swellM: null, periodS: null, swellDirDeg: null, tempC: null, tide: null };
    if (!l) return out;
    const w = /([\d.,]+)\s*km\/h\s*([A-Za-z]{0,2})/.exec(String(l.wind || ''));
    if (w) { out.windKmh = num1(w[1]); out.windDir = bearing(w[2]); }
    out.swellM = num1(l.swell);
    /* Période et direction du jour : nombres du modèle, jamais devinés ; ‘—’ ou absent reste null. */
    out.periodS = Number.isFinite(l.periodS) ? l.periodS : num1(l.period);
    out.swellDirDeg = Number.isFinite(l.swellDirDeg) ? l.swellDirDeg : null;
    out.tempC = num1(l.temp);
    const t = String(l.tide || '').trim();
    out.tide = t === 'Montante' || t === 'Descendante' ? t : null;
    return out;
  }
  /* Vent offshore / onshore : seulement quand le catalogue donne le sens offshore du spot (« Offshore E »). Sinon null, jamais deviné. */
  function windSide(windDir, catalogWind) {
    const m = /^(?:L[ée]ger\s+)?offshore\s+(N|NE|E|SE|S|SO|SW|O|W|NO|NW)\b/i.exec(String(catalogWind || '').trim());
    if (!m || windDir == null) return null;
    const off = bearing(m[1]);
    let d = Math.abs(windDir - off) % 360; if (d > 180) d = 360 - d;
    return d <= 45 ? 'offshore' : d >= 135 ? 'onshore' : 'cross';
  }
  const windBand = k => (k == null ? null : k < 10 ? 'faible' : k < 20 ? 'modere' : k < 30 ? 'soutenu' : 'fort');
  const swellBand = h => (h == null ? null : h < 0.6 ? 'petite' : h < 1.2 ? 'modeste' : h < 2 ? 'moyenne' : 'grosse');
  const periodBand = t => (t == null ? null : t <= 8 ? 'courte' : t < 12 ? 'moyenne' : 'longue');

  const defFmt = (n, d = 0) => Number(n).toFixed(d).replace('.', ',');
  const cleanDanger = s => (s.dangers || []).map(d => d && d[1]).filter(Boolean);
  const ZONE_RANK = { debutant: 0, intermediaire: 1, expert: 2 };
  const unverified = s => !!s && s.editorialStatus !== 'reviewed';

  /* Lignes « aujourd’hui ici » : une phrase par donnée disponible, formulée selon le niveau. */
  function wavesToday(level, c) {
    const { h, w, side, tide, suit, tp, tpBand, p90, mon, fmt, tpToday } = c, out = [];
    const sb = swellBand(h), wb = windBand(w);
    if (h != null) {
      if (level === 'debutant') {
        out.push([`Houle de ${fmt(h, 1)} m au large selon le modèle.`, sb === 'petite' ? 'Petite houle : les vagues seront petites et douces, c’est le bon moment pour apprendre.' : sb === 'modeste' ? 'Houle modeste : assez petite pour apprendre, mais elle pousse déjà. Reste dans la mousse, près du bord.' : sb === 'moyenne' ? 'Houle moyenne : en cassant sur le banc, les vagues peuvent dépasser ta taille. Demande conseil au poste ou à l’école avant d’entrer.' : 'Grosse houle : les vagues sont puissantes et les courants plus forts. Pour débuter, regarde depuis la plage ou prends un cours encadré.']);
      } else if (level === 'intermediaire') {
        out.push([`Houle de ${fmt(h, 1)} m au large.`, sb === 'petite' ? 'Petite houle : vagues molles, prends plus de volume et vise les pics les plus ouverts.' : sb === 'modeste' ? 'Houle modeste : jouable sur la plupart des pics, le vent et la marée feront la différence.' : sb === 'moyenne' ? 'Houle moyenne : les vagues ont de la force, choisis un pic où tu peux ramer sans te faire rattraper par les séries.' : 'Grosse houle : seuls les pics bien protégés restent jouables. Observe dix minutes avant de décider.']);
      } else {
        out.push(`Houle modèle : ${fmt(h, 1)} m au large. La hauteur seule ne dit rien : croise-la avec la période et la direction avant de juger le pic.`);
      }
    }
    if (tp != null) {
      const typ = tpToday ? `Période de la houle : environ ${fmt(tp, 0)} s aujourd’hui (valeur du modèle, au large).` : `En ${mon}, la période habituelle ici est d’environ ${fmt(tp, 0)} s (moyenne de plusieurs années, pas la valeur du jour).`;
      if (level === 'debutant') out.push([typ, tpBand === 'courte' ? 'Courte : des vagues brouillonnes qui se suivent vite, mais peu puissantes.' : tpBand === 'moyenne' ? 'Moyenne : des vagues plutôt régulières.' : 'Longue : des vagues plus puissantes et plus espacées, même à hauteur égale.']);
      else if (level === 'intermediaire') out.push([typ, tpBand === 'courte' ? 'Mer du vent : vagues courtes et peu de puissance, la planche doit aider.' : tpBand === 'moyenne' ? 'Houle correcte : de la puissance sans surprise, séries assez régulières.' : 'Houle de fond : beaucoup de puissance et des séries espacées. Prévois plus de rame et plus de temps pour sortir.']);
      else out.push([typ, tpBand === 'longue' ? 'Période longue : la houle ressent le fond plus tôt, les vagues cassent plus au large et plus fort. Compte les séries avant de ramer.' : tpBand === 'moyenne' ? 'Période moyenne : les bancs décident presque tout.' : 'Période courte : la mer du vent domine, le vent local pèse plus que la houle.']);
      if (level === 'expert' && p90 != null) out.push(`Les 10 % de jours les plus forts dépassent ${fmt(p90, 1)} m en ${mon} (moyenne de plusieurs années).`);
    }
    if (w != null) {
      const force = wb === 'faible' ? 'Vent faible : la surface reste lisse.' : wb === 'modere' ? 'Vent modéré : la surface commence à se plisser.' : wb === 'soutenu' ? 'Vent soutenu : la mer devient hachée et fatigante.' : 'Vent fort : la mer est chaotique et on dérive vite.';
      if (level === 'debutant') {
        out.push([`Vent de ${fmt(w, 0)} km/h.`, force]);
        if (wb === 'fort') out.push('Reste à terre aujourd’hui.');
        if (w >= 10 && side === 'offshore') out.push('Le vent vient de la terre (offshore) : il lisse les vagues, mais il te pousse vers le large. Reste près du bord et ne lâche pas ta planche.');
        else if (w >= 10 && side === 'onshore') out.push('Le vent vient du large (onshore) : il écrase les vagues et les rend désordonnées. Ça fatigue plus vite.');
        else if (w >= 10 && side === 'cross') out.push('Le vent arrive de côté : il te déporte le long de la plage. Repère-toi sur un point fixe à terre.');
        else if (w >= 10) out.push('Pour ce spot, on ne connaît pas le sens du vent par rapport à la plage. Regarde les drapeaux et les rides sur l’eau.');
      } else if (level === 'intermediaire') {
        out.push([`Vent de ${fmt(w, 0)} km/h.`, w < 10 ? 'Presque nul : surface lisse, c’est une bonne fenêtre.' : side === 'offshore' ? (w < 25 ? 'Offshore modéré : il tient les vagues et les creuse. Bonne fenêtre.' : 'Offshore fort : il retient trop les vagues et complique la rame. Cherche un abri.') : side === 'onshore' ? (w < 15 ? 'Onshore léger : surface un peu froissée, encore jouable.' : 'Onshore marqué : vagues écrasées et désordonnées. Attends que ça tourne ou change de spot.') : side === 'cross' ? 'Vent de côté : la surface se dégrade et tu dérives. Regarde de quel côté du pic ça tient.' : (w < 20 ? 'Modéré : le sens par rapport à la plage n’est pas connu pour ce spot, regarde la surface.' : 'Soutenu : le sens par rapport à la plage n’est pas connu pour ce spot, regarde si la surface tient.')]);
      } else {
        out.push([`Vent de ${fmt(w, 0)} km/h.`].concat(side === 'offshore' ? ['Offshore d’après l’orientation du catalogue.'] : side === 'onshore' ? ['Onshore d’après l’orientation du catalogue.'] : side === 'cross' ? ['De travers d’après l’orientation du catalogue.'] : []).concat(['Compare avec la brise thermique de l’après-midi : une session de matin ne vaut pas celle de 16 h.']));
      }
    }
    if (w != null && level !== 'expert') out.push('Les seuils de vent (10, 20, 30 km/h) sont des repères indicatifs, pas des limites officielles.');
    if (tide) {
      if (level === 'debutant') out.push(tide === 'Descendante' ? 'Marée descendante : l’eau qui repart se concentre dans les chenaux, les baïnes et les courants de retour sont souvent plus forts. Sois plus prudent.' : 'Marée montante : l’eau avance vers la plage, les courants de retour sont en général moins marqués. Reste vigilant malgré tout.');
      else if (level === 'intermediaire') out.push(tide === 'Descendante' ? 'Marée descendante : les bancs se découvrent et les vagues ferment plus vite. Regarde la courbe de marée plus bas pour caler ton heure.' : 'Marée montante : les vagues gagnent en rondeur à mesure que l’eau monte. Regarde la courbe de marée plus bas pour caler ton heure.');
      else out.push([tide === 'Descendante' ? 'Marée descendante.' : 'Marée montante.', 'Le coefficient du jour n’est pas calculé ici : prends-le dans l’annuaire de marées local. Un coefficient élevé veut dire plus de courant et des bancs qui changent vite.']);
    }
    if (suit && level !== 'expert') out.push(`Eau à ${fmt(c.t, 0)} °C : prévois une combinaison ${suit}.`);
    return out;
  }

  /* Sources des repères de sécurité (consultées le 29/10/2026) : le navigateur ne garde que l’adresse, le libellé et la date, comme SRC dans spot-experience.js.
     Les seuils de période (8 / 9–11 / 12 s) et de vent (10 / 20 / 30 km/h) sont des repères maison : ils sont annoncés comme indicatifs, sans source. */
  const SRC = {
    sports: { u: 'https://www.service-public.gouv.fr/particuliers/actualites/A15715?lang=fr', l: 'Service-Public.fr (drapeaux de baignade)', d: '2026-10-29' },
    ffs: { u: 'https://www.surfingfrance.com/actualites/federation/prevention-surf-2022-les-10-regles-d-or-d-une-pratique-sereine-du-surf.html', l: 'Fédération française de surf', d: '2026-10-29' },
    met: { u: 'https://weather.metoffice.gov.uk/warnings-and-advice/seasonal-advice/travel/out-and-about/understanding-rip-currents', l: 'Met Office (courants de retour)', d: '2026-10-29' }
  };

  function wavesStatic(level, s, c) {
    const blocks = [], zones = Array.isArray(s && s.zones) ? s.zones : [];
    const danger = cleanDanger(s || {});
    const tag = unverified(s) ? ' (texte du carnet Ocean Buddy, non vérifié)' : '';
    if (level === 'debutant') {
      const hit = danger.filter(d => /ba[ïi]ne|courant|rip|arrachement/i.test(d));
      const calm = zones.filter(z => z && z.l === 'debutant' && z.n);
      blocks.push({ h: 'Lire la mer avant d’entrer', lines: [
        'La hauteur dit la taille des vagues. La période, en secondes entre deux vagues, dit leur force : plus elle est longue, plus la vague pousse, même à hauteur égale.',
        'Cette hauteur est une valeur de modèle au large. Sur la plage, la vague peut être plus petite ou plus grosse selon les fonds et la marée.',
        'Offshore : le vent souffle de la terre vers la mer. Onshore : de la mer vers la terre. Regarde un drapeau, une fumée ou les rides sur l’eau.',
        'Le plus simple pour débuter : peu de vent, une houle de moins d’un mètre, une période courte ou moyenne. Ce sont des repères indicatifs, pas des seuils officiels.'
      ] });
      blocks.push({ h: 'Repérer une baïne ou un courant', lines: [
        'Cherche une bande où les vagues ne cassent pas, entre deux zones où ça déferle. C’est souvent un chenal où l’eau repart vers le large.',
        'Autres signes : une eau plus sombre ou trouble, de la mousse ou des débris qui s’éloignent du bord, des rides différentes autour.',
        'Sur la côte atlantique française, une baïne est une cuvette entre deux bancs de sable. Elle se remplit à marée montante et se vide vers le large par un chenal.'
      ].concat(hit.slice(0, 2).map(d => `Pour ce spot, le carnet signale : ${d}${tag}`)), src: [SRC.sports, SRC.ffs] });
      blocks.push({ h: 'Où te mettre à l’eau', lines: [
        'Entre dans une zone surveillée, près du poste de secours, et demande au sauveteur où l’eau est la plus sûre aujourd’hui.',
        'Choisis un endroit où les vagues cassent de la même façon sur toute la ligne, pas dans le chenal calme.',
        'Tant que tu apprends, reste là où tu as pied. Ne va jamais seul à l’eau.'
      ].concat(calm.slice(0, 2).map(z => `Zone indiquée pour débuter dans le catalogue : ${z.n}${z.d ? ` (${z.d})` : ''}.`)), src: [SRC.sports] });
      blocks.push({ h: 'Si tu es emporté', lines: [
        'Reste calme et ne lutte pas contre le courant : nager contre lui t’épuiserait.',
        'Garde ta planche ou ton bodyboard, ça flotte. Ne tente pas de rejoindre la plage à la nage sans elle.',
        'Lève un bras et appelle pour être vu.',
        'Si tu as pied, marche plutôt que de nager. Sinon, nage en parallèle de la plage jusqu’à être sorti du courant, puis rejoins le bord.'
      ], src: [SRC.met, SRC.ffs] });
      blocks.push({ h: 'Zones surveillées et drapeaux', lines: [
        'Le surf et le bodyboard sont souvent cantonnés à une zone séparée des baigneurs, marquée par des drapeaux. Lis le panneau au poste.',
        'Le surf se pratique dans une zone repérée par un drapeau à damier noir et blanc ; la zone de baignade surveillée est marquée par des drapeaux rayés jaune et rouge. Reste hors de la zone de baignade.',
        'En France, le drapeau vert dit que la baignade est surveillée sans danger apparent, le jaune qu’elle est surveillée avec un danger limité ou marqué, le rouge qu’elle est interdite. Les règles changent selon le pays et le lieu.',
        'Si le drapeau est jaune ou rouge, demande au poste ce qui est permis pour ta pratique.'
      ], src: [SRC.sports, SRC.ffs] });
    } else if (level === 'intermediaire') {
      const own = zones.filter(z => z && z.n && ZONE_RANK[z.l] != null && ZONE_RANK[z.l] <= 1);
      blocks.push({ h: 'Choisir ta fenêtre', lines: [
        'Croise marée et vent : note l’heure où le vent est le plus faible, souvent tôt le matin, et la marée où le banc travaille le mieux.',
        'Le vent monte souvent l’après-midi. Une bonne fenêtre peut se fermer en une heure.',
        'Regarde la courbe de marée de l’onglet : elle te donne les heures de pleine et de basse mer.'
      ] });
      if (c.dirTxt) blocks.push({ h: 'Orientation de la houle', lines: [
        c.dirToday ? `Aujourd’hui, la houle arrive ${c.dirTxt} (valeur du modèle, au large).` : `En ${c.mon}, la houle arrive surtout ${c.dirTxt} (moyenne de plusieurs années).`,
        'Compare avec l’orientation de la plage : face à la houle, elle arrive de plein fouet ; à l’abri d’un cap ou d’une digue, elle est réduite.'
      ] });
      blocks.push({ h: 'Période et puissance', lines: [
        '8 s ou moins : mer du vent, vagues courtes et peu puissantes.',
        'De 9 à 11 s : houle correcte, de la puissance sans surprise.',
        '12 s et plus : houle de fond, vagues plus puissantes, séries espacées. Prévois plus de rame.',
        'Ces seuils sont des repères indicatifs, sans valeur officielle : le fond et la marée changent la vague.'
      ] });
      blocks.push({ h: 'Les priorités au pic', lines: [
        'Une vague, un surfeur : la priorité va à celui qui est le plus à l’intérieur du déferlement, côté creux.',
        'Ne pars jamais sur une vague s’il y a quelqu’un devant toi, en particulier quelqu’un déjà debout.',
        'Pour ramer au large, contourne la zone de déferlement, par le côté du pic.',
        'Annonce-toi à voix haute. Si tu tombes, garde ta planche près de toi.',
        'Même prioritaire, évite tout danger, et surfe toujours avec un leash en bon état.'
      ], src: [SRC.ffs] });
      blocks.push({ h: 'Choisir ta planche', lines: [
        'Vagues petites ou molles : plus de volume et plus de longueur pour accrocher les vagues tôt.',
        'Vagues creuses et puissantes : une planche plus fine et un peu plus longue aide à ramer tôt et à tenir la ligne.',
        'En cas de doute, demande au shop du coin : il connaît les bancs du moment.'
      ] });
      if (own.length) blocks.push({ h: 'Les pics du catalogue pour toi', lines: own.slice(0, 3).map(z => `${z.n}${z.d ? ` : ${z.d}` : ''}${z.l === 'debutant' ? ' (adapté aux débutants)' : ' (niveau intermédiaire)'}.`) });
    } else {
      blocks.push({ h: 'Lecture fine', lines: [
        'Période longue : la houle ressent le fond plus tôt, elle casse plus au large et plus fort. Compte les séries pour repérer les accalmies.',
        'La direction ne se lit pas qu’en secteur : un écart de 20° peut faire passer un banc de bon à fermé. Compare avec l’exposition réelle du pic.',
        'Le vent change la lecture : un offshore retient la vague, un onshore la fait casser plus tôt.'
      ] });
      blocks.push({ h: 'Marée et bancs', lines: [
        'Un coefficient élevé veut dire plus d’amplitude, donc plus de courant et des bancs qui bougent. Prends-le dans l’annuaire de marées local.',
        'Après chaque coup de mer, les bancs de sable se déplacent. Regarde la plage à marée basse pour repérer les chenaux avant de ramer.'
      ] });
      if (danger.length) blocks.push({ h: 'Dangers propres au spot', lines: danger.slice(0, 3).map(d => `${d}${tag}`) });
      const peak = zones.filter(z => z && z.l === 'expert' && z.n);
      if (peak.length) blocks.push({ h: 'Pics exigeants du catalogue', lines: peak.slice(0, 2).map(z => `${z.n}${z.d ? ` : ${z.d}` : ''}.`) });
      blocks.push({ h: 'Limites et retour au bord', lines: [
        'Fixe tes limites avant d’entrer : taille de vague, durée, heure de retour.',
        'La fatigue arrive vite, surtout en eau froide. Rentre avant d’en avoir besoin.',
        'Quand la marée tourne, les courants et les bancs changent. Prévois de sortir avant le renversement.',
        'Ne surfe pas seul quand ça devient gros.'
      ] });
    }
    return blocks;
  }

  /* Vent seul (kite, windsurf) et plan d’eau (baignade, paddle, kayak, snorkeling) : un seul bloc, sans découpage par niveau. */
  function windOnly(kind, level, c) {
    const { w, side, fmt, tide } = c, lines = [];
    const wb = windBand(w);
    if (w != null) {
      if (kind === 'wind') {
        lines.push([`Vent de ${fmt(w, 0)} km/h.`, wb === 'faible' ? 'Trop faible pour tracter une aile ou une voile.' : wb === 'modere' ? 'Vent modéré : suffisant pour les grandes voiles et les grandes ailes, sans excès.' : wb === 'soutenu' ? 'Vent soutenu : choisis une voile ou une aile plus petite.' : 'Vent fort : seuls les pratiquants expérimentés sortent, avec du matériel adapté.']);
      } else {
        lines.push([`Vent de ${fmt(w, 0)} km/h.`, wb === 'faible' ? 'Vent faible : la surface reste lisse.' : wb === 'modere' ? 'Vent modéré : un peu de clapot, surtout au large.' : wb === 'soutenu' ? 'Vent soutenu : le clapot grossit et fatigue vite.' : 'Vent fort : mer hachée, reste à terre.']);
      }
      if (w >= 10 && side === 'offshore') lines.push('Le vent vient de la terre : il te pousse vers le large et la mer paraît calme près du bord. Reste près du bord et préviens quelqu’un.');
      else if (w >= 10 && side === 'onshore') lines.push('Le vent vient du large : il te ramène vers la plage, mais le clapot se lève vite.');
      else if (w >= 10 && side == null) lines.push('Le sens du vent par rapport à la plage n’est pas connu pour ce spot. Regarde les drapeaux et les rides sur l’eau avant de partir.');
    }
    if (c.t != null && c.suit) lines.push(`Eau à ${fmt(c.t, 0)} °C : prévois une combinaison ${c.suit}.`);
    if (kind === 'water' && c.t != null && c.t < 20 && !c.suit) lines.push(`Eau à ${fmt(c.t, 0)} °C : l’eau fraîche épuise plus vite qu’on ne le croit. Sors dès que tu as froid.`);
    if (tide) lines.push(tide === 'Descendante' ? 'Marée descendante : l’eau qui repart crée des courants vers le large, surtout dans les chenaux.' : 'Marée montante : l’eau avance vers la plage, les courants sont en général moins marqués.');
    lines.push(level === 'debutant' ? 'Entre dans une zone surveillée et demande conseil au poste de secours ou à l’école.' : level === 'expert' ? 'Prévois ton retour avant de partir et ne sors pas seul.' : 'Repère où tu pourras sortir de l’eau si le vent tombe ou tourne, et préviens un proche.');
    if (w != null) lines.push('Les seuils de vent (10, 20, 30 km/h) sont des repères indicatifs, pas des limites officielles.');
    return [{ h: 'Lire les conditions du jour', lines }];
  }

  /* ctx : { act, inland, level, spot, live, clim (fiche climat du spot), m (mois 0-11), monthName, fmt, suit }
     Renvoie null quand le sport garde son texte actuel (plongée) ou qu’il n’y a rien d’utile à dire. */
  function coach(ctx) {
    const kind = coachKind(ctx.act, !!ctx.inland);
    if (!kind) return null;
    const lv = parseLive(ctx.live), s = ctx.spot || {}, fmt = ctx.fmt || defFmt;
    const w = ctx.clim && ctx.clim.wave ? ctx.clim.wave : null, m = ctx.m;
    const tpNormal = w && w.tp && has(w.tp[m]) ? w.tp[m] : null;
    /* La période du jour passe avant la normale du mois, qui reste le repli (et reste annoncée comme telle). */
    const tpToday = lv.periodS != null && lv.periodS > 0 && lv.periodS < 30;
    const tp = tpToday ? lv.periodS : tpNormal;
    const p90 = w && w.p90 && has(w.p90[m]) ? w.p90[m] : null;
    const di = w && w.dir && has(w.dir[m]) ? w.dir[m] : null;
    const dirLive = lv.swellDirDeg != null && lv.swellDirDeg >= 0 && lv.swellDirDeg <= 360 ? Math.round(lv.swellDirDeg / 45) % 8 : null;
    const c = {
      h: lv.swellM, w: lv.windKmh, t: lv.tempC, tide: ctx.inland ? null : lv.tide, side: windSide(lv.windDir, s.wind), suit: ctx.suit || null,
      tp, tpToday, tpBand: periodBand(tp), p90, dirToday: dirLive != null, dirTxt: dirLive != null ? DIR_FROM[dirLive] : di == null ? null : DIR_FROM[di], mon: ctx.monthName || '', fmt
    };
    const sel = COACH_LEVELS.includes(ctx.level) ? ctx.level : null;
    if (kind !== 'wave') return { kind, selected: sel, levels: [{ id: 'all', title: 'Lire les conditions du jour', blocks: windOnly(kind, sel, c) }] };
    const levels = COACH_LEVELS.map(id => {
      const blocks = [];
      const today = wavesToday(id, c);
      if (today.length) blocks.push({ h: lv.windKmh != null || lv.swellM != null || lv.periodS != null || lv.tempC != null || lv.tide ? 'Aujourd’hui ici' : 'Ce mois-ci ici', lines: today });
      return { id, title: COACH_TITLE[id], blocks: blocks.concat(wavesStatic(id, s, c)) };
    });
    const warn = sel === 'debutant' && s.level === 'expert' ? 'Ce spot est classé expert dans le catalogue. Pour débuter, regarde depuis la plage ou choisis un spot plus doux.' : null;
    return { kind, selected: sel, warn, levels };
  }

  const coachApi = { coach, coachKind, parseLive, windSide, windBand, swellBand, periodBand, COACH_LEVELS };

  const api = Object.assign({},coachApi,{ clamp, ramp, blend, month, score, level, year, best, ranges, LEVELS, CRITERIA, lite, matches, sunTimes, SECTOR_DEG, DIR_FROM, WATER_ACTS, SUIT_ACTS, wetsuit, FEW_OBS, fewObs, decodeEntities, marineSpot, seasonsDisagree });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpotDataModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
