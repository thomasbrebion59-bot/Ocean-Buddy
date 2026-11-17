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
  return { ORDER, FOLDED, DATA_RAILS, railShown, quick };
});
