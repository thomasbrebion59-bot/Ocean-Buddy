'use strict';
/* Le cœur d'une fiche répond au toucher sans attendre le rendu de la liste et de la carte (24 nov. 2026). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
test('toggleFav : le cœur d’abord, la liste et la carte à l’image suivante', () => {
  const fn = app.slice(app.indexOf('function toggleFav(id,ev)'), app.indexOf('/* ---- map ---- */'));
  assert.ok(fn.indexOf("df.classList.toggle('on',favs.has(id))") < fn.indexOf('renderSpots(currentFilter,true)'), 'le cœur avant le rendu');
  assert.match(fn, /if\(df&&currentSpot===id\)\{df\.innerHTML=favs\.has\(id\)\?FAV_ON:FAV_OFF;df\.classList\.toggle\('on',favs\.has\(id\)\);\}/, 'aucune erreur sans cœur de fiche');
  assert.match(fn, /requestAnimationFrame\(\(\)=>setTimeout\(redraw,0\)\)/);
  assert.match(fn, /saveState\(\);/);
});
