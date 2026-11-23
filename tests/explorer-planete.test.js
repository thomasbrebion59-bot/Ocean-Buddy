/* Explorer s'ouvre sur la planète 3D (demande du fondateur, 23 nov. 2026), la liste reste à un toucher, et un retour
   depuis une fiche ou par l'historique garde la vue où l'on était. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'explore-list.js'), 'utf8');

test('Explorer : entrée sur la planète, sauf retour de fiche ou de l’historique', () => {
  assert.match(src, /function globeFirst\(\)/);
  assert.match(src, /wrapAfter\('go'/);
  assert.match(src, /ctx\.restoring \|\| ctx\.from === 'spots' \|\| ctx\.from === 'detail'/);
  assert.match(src, /setView\('map'\)/);
  /* Posé après tous les scripts (app-shell.js enveloppe go en dernier) et une seule fois. */
  assert.match(src, /DOMContentLoaded', globeFirst/);
  assert.match(src, /__exlGlobe/);
});

test('Explorer : « Tous les continents » ramène à la planète entière', () => {
  assert.match(src, /wrapAfter\('backToWorlds'[^\n]*toMap\(\)[^\n]*overview/);
});
