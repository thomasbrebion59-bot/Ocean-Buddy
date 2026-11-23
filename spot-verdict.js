/* Verdict « pour toi » de plusieurs spots à la fois (interface v2, 19 novembre 2026).
   Sert l'accueil (Mes spots, Bon aujourd'hui) et la liste d'Explorer : conditions du moment et pastille de couleur
   (bon pour toi, possible, pas aujourd'hui) avec les heures, sans ouvrir chaque fiche.

   CONTRAT (ne pas changer sans prévenir les autres écrans) :
     OceanVerdict.forSpots(ids, opts?) -> Promise<Map<id, entrée>>
       ids  : identifiants de spots (ceux de openSpot).
       opts : { sport, level } ; par défaut le sport et le niveau enregistrés de l'utilisateur.
     OceanVerdict.cached(id, opts?) -> entrée | null    lecture immédiate du cache, pour un premier rendu sans attente.
     OceanVerdict.html(entrée) -> chaîne HTML           .ui-cond et .ui-verdict prêts à poser (ui-v2.css).

     entrée = {
       now:     { windKmh, windDir, swellM, swellS, waterC } | null   valeurs du moment ; null si indisponible ;
       verdict: 'bon' | 'possible' | 'non' | null                     null : pas de calcul pour ce sport ou ce niveau ;
       slot:    '10 h à 13 h' | null                                   heures du créneau, déjà écrites pour l'affichage ;
       day:     'today' | 'tomorrow'                                   le soir, le créneau de demain ;
       danger:  0 à 4 | null                                           niveau de danger du spot, jamais caché s'il est connu ;
       at:      horodatage de la mesure (ms)
     }

   Source des calculs : SpotWeatherModel.bestSlot (spot-weather-model.js) et SpotFitModel.slotSummary (spot-fit-model.js),
   les mêmes que « Ton créneau » de la fiche. Données : Open-Meteo, demande groupée pour plusieurs spots, cache de 30 min et
   pause après un refus, comme le reste de l'app. Aucun chiffre inventé : sans donnée, now est null et la ligne le dit.

   ÉTAT : bouchon. forSpots rend des entrées vides ; l'agent de l'accueil écrit le vrai calcul ici. */
(() => {
  'use strict';
  const empty = () => ({ now: null, verdict: null, slot: null, day: 'today', danger: null, at: 0 });
  const api = window.OceanVerdict = window.OceanVerdict || {};
  api.forSpots = (ids) => Promise.resolve(new Map((ids || []).map(id => [id, empty()])));
  api.cached = () => null;
  api.html = () => '';
})();
