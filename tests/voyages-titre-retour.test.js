const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle final 3 : voyage ouvert, le bouton Retour rond (navigation.js, 40 px posés à 12 px du bord) recouvrait le début
   du sur-titre « TES ENVIES, TES ITINÉRAIRES » et du titre « Voyages ». Le grand titre se décale quand body.has-app-back. */
test('voyages : le grand titre laisse la place au bouton Retour quand un voyage est ouvert', () => {
  const nav = read('navigation.js');
  assert.match(nav, /scr==="trips"&&!window\.OceanTrips\?\.route\?\.\(\)\?\.selected/, 'la liste est un écran racine, un voyage ouvert ne l’est pas');
  assert.match(nav, /classList\.toggle\('has-app-back',hasBack\)/);
  const m = read('trips.css').match(/body\.has-app-back #trips>\.as-large\{padding-left:(\d+)px\}/);
  assert.ok(m, 'règle de décalage du grand titre');
  /* Bouton : 12 px de bord + 40 px ; le titre part de la gouttière de 16 px : il faut au moins 52 - 16 + 4 px d’air. */
  assert.ok(+m[1] >= 40, 'décalage suffisant pour dégager le bouton');
});
