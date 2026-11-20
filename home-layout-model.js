/* Organisation de l’accueil : logique pure, sans DOM.
   Le même fichier sert dans l’app (window.HomeLayout, lu par home-feed.js) et dans les tests Node
   (tests/organisation.test.js).

   - ORDER : les blocs visibles du fil, du plus utile au plus accessoire ; FOLDED : les blocs repliés sous « Plus d’idées
     de départ ». home-feed.js reste le seul à ordonner l’accueil ; il suit ces listes une fois, au montage, sous le
     rideau de démarrage.
   - railShown : quelles rangées restent dépliées. Les rangées hors sujet pour le sport choisi (la houle pour un
     plongeur, le vent pour un surfeur) et les collections passent dans « Plus d’idées de départ », replié.
   - quick : les raccourcis « en un geste » du haut de l’accueil (favoris, dernier spot vu, prochain voyage). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HomeLayout = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';
  /* Moins d’informations d’un coup (demande du 16 novembre) : l’accueil montre au plus six sections, sous l’ouverture
     (recherche, favoris, activités, spots de rêve) : pour toi, Noël (en saison), où partir ce mois-ci, les cultures,
     ton espace, puis un seul bouton « Plus d’idées de départ ». */
  const ORDER = [
    'pourtoi',      // Pour toi aujourd’hui
    'noel',         // Calendrier de l’Avent + Noël au soleil (du 15 novembre au 6 janvier)
    'mois',         // Où partir ce mois-ci ?
    'cultures',     // « Tour du monde des cultures » + « Le mot du jour » (cultures-boot.js)
    'espace',       // Ton espace : série, prochain départ, reprendre, favoris (ocean-hub.js)
    'plus'          // Plus d’idées de départ : tout le reste, replié (FOLDED)
  ];
  /* Repliés sous « Plus d’idées de départ », dans cet ordre. Rien n’est retiré : un toucher les déplie.
     La planète et le mini-jeu ont aussi leur onglet (Explorer, Jeu) et Poulpy son bouton flottant. */
  const FOLDED = [
    'plan',         // Choisis ton mois (planificateur, aussi « Quand ? » dans Explorer)
    'planete',      // La planète des spots
    'envies',       // Envies du moment (tuiles vers les collections)
    'immersion',    // Pars en immersion (ocean-home.js)
    'donnees',      // Mer chaude, houle, vent du mois (celles de ton sport d’abord)
    'collections',  // Collections et rangées de données hors sujet pour ton sport
    'nouveautes',   // Et si on partait là ? (nouveaux spots, field-guide.js)
    'jeu',          // Mini-jeu de surf
    'poulpy'        // Une question ? Poulpy sait t’aider.
  ];
  /* Rangées de données : sports concernés (null = tout le monde). */
  const DATA_RAILS = { chaud: null, houle: ['surf', 'bodyboard'], vent: ['kitesurf', 'windsurf'] };
  const isData = id => Object.prototype.hasOwnProperty.call(DATA_RAILS, id);
  /* Une rangée de données reste dépliée si elle concerne le sport choisi (« Tous » : toutes) ; les collections
     (ambiances) sont toujours repliées, les tuiles « Envies du moment » y mènent. */
  function railShown(id, sport) {
    if (!isData(id)) return false;
    const for_ = DATA_RAILS[id];
    if (!for_ || !sport || sport === 'all') return true;
    return for_.includes(sport);
  }
  /* Raccourcis : « Mes favoris » toujours (même à zéro : il mène à un état vide qui explique le cœur), le dernier spot
     ouvert s’il existe encore dans le catalogue, le prochain voyage s’il y en a un (TripModel.nextTrip). */
  function quick({ favs = [], recent = [], known = () => true, next = null } = {}) {
    const favCount = [...favs].filter(id => known(id)).length;
    const last = (recent || []).map(x => (x && typeof x === 'object' ? x.id : x)).find(id => typeof id === 'string' && known(id)) || null;
    const items = [{ kind: 'favs', count: favCount }];
    if (last) items.push({ kind: 'recent', id: last });
    if (next && next.trip && next.trip.id) {
      const w = next.when || {};
      items.push({ kind: 'trip', id: next.trip.id, name: String(next.trip.name || ''), state: w.state || 'undated', days: Number.isFinite(w.days) ? w.days : null });
    }
    return items;
  }
  /* ---------- Accueil v2 (interface v2, 20 novembre 2026) ----------
     Quatre rubriques utiles au lieu de vingt : « Mes spots » et « Bon aujourd’hui » (conditions et verdict, spot-verdict.js),
     puis « En <mois> » et « Cultures » ; le calendrier de l’Avent s’y glisse du 1er au 24 décembre. Deux colonnes sur
     ordinateur, lues l’une après l’autre sur téléphone. ORDER et FOLDED ci-dessus décrivent l’ancien fil, gardé dans le code. */
  const V2 = [['mesSpots', 'bon'], ['avent', 'mois', 'cultures']];
  /* Salut du haut : « Bonjour » le jour, « Bonsoir » le soir. Hors du français, l’après-midi a son propre salut
     (« Good afternoon », « Buenas tardes ») : « Good morning » à 15 h serait faux. */
  function hello(hour, lang) {
    if (hour >= 18 || hour < 5) return 'Bonsoir';
    return hour >= 12 && lang && lang !== 'fr' ? 'Bon après-midi' : 'Bonjour';
  }
  /* « Mes spots » : les favoris, sinon les derniers spots vus ; n lignes au plus. Plus de n favoris : ceux que tu as
     regardés le plus récemment, montrés dans l’ordre où tu les as ajoutés (la liste ne se réordonne pas à chaque visite). */
  function mine({ favs = [], recent = [], known = () => true, n = 3 } = {}) {
    const seen = [...new Set((recent || []).map(x => (x && typeof x === 'object' ? x.id : x)).filter(id => typeof id === 'string' && known(id)))];
    const fav = [...new Set([...(favs || [])].filter(id => typeof id === 'string' && known(id)))];
    if (fav.length) {
      const at = new Map(seen.map((id, i) => [id, i]));
      const keep = new Set(fav.map((id, i) => ({ id, k: at.has(id) ? at.get(id) : 1e6 + i })).sort((a, b) => a.k - b.k).slice(0, n).map(o => o.id));
      return { kind: 'favs', ids: fav.filter(id => keep.has(id)), total: fav.length };
    }
    const ids = seen.slice(0, n);
    return { kind: ids.length ? 'recent' : 'none', ids, total: ids.length };
  }
  /* « Bon aujourd’hui » : parmi les candidats (déjà triés : sport, niveau, saison), n spots, les « bon » d’abord, puis les
     « possible », puis ceux dont on ne sait rien dire (pas de seuil, pas de donnée), et « pas aujourd’hui » en dernier ;
     aujourd’hui avant demain ; un spot par pays tant qu’il y a le choix dans la même classe. cands : [{id, country, e: entrée OceanVerdict}]. */
  const VERDICT_RANK = { bon: 0, possible: 1, non: 3 };
  function good(cands, { n = 3, perCountry = 1 } = {}) {
    const rows = (cands || []).map((c, i) => {
      const e = c && c.e;
      return { c, i, v: e && e.now && Object.prototype.hasOwnProperty.call(VERDICT_RANK, e.verdict) ? VERDICT_RANK[e.verdict] : 2, d: e && e.day === 'tomorrow' ? 1 : 0 };
    }).filter(r => r.c && r.c.id).sort((a, b) => a.v - b.v || a.d - b.d || a.i - b.i);
    /* Un créneau dans le même pays passe avant un spot dont on ne sait rien dire dans un autre. */
    const out = [], per = new Map();
    for (const [max, limit] of [[1, perCountry], [1, Infinity], [3, perCountry], [3, Infinity]]) {
      for (const r of rows) {
        if (out.length >= n) break;
        if (r.v > max || out.includes(r)) continue;
        const k = r.c.country || '';
        if ((per.get(k) || 0) >= limit) continue;
        per.set(k, (per.get(k) || 0) + 1);
        out.push(r);
      }
    }
    return out.sort((a, b) => rows.indexOf(a) - rows.indexOf(b)).map(r => r.c.id);
  }
  /* Le titre « Bon aujourd’hui » ne se dit que si un spot montré a un créneau (bon ou possible). */
  const goodProven = entries => (entries || []).some(e => !!e && !!e.now && (e.verdict === 'bon' || e.verdict === 'possible'));
  return { ORDER, FOLDED, DATA_RAILS, railShown, quick, V2, hello, mine, good, goodProven };
});
