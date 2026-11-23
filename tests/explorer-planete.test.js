/* Explorer s'ouvre sur la planète 3D (demande du fondateur, 23 nov. 2026), la liste reste à un toucher, et un retour
   depuis une fiche ou par l'historique garde la vue où l'on était. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'explore-list.js'), 'utf8');

test('Explorer : entrée sur la planète, sauf retour de fiche ou de l’historique', () => {
  assert.match(src, /function globeFirst\(\)/);
  /* Lu sur l’évènement de navigation : dans l’app iPhone, go n’existe pas encore quand ce fichier est chargé. */
  assert.match(src, /window\.addEventListener\('ocean:navigate', e => \{\n\s+const ctx = \{ from, s: e\.detail, restoring: restoring\(\) \}; from = e\.detail;/);
  assert.match(src, /queueMicrotask\(toMap\)/);
  assert.doesNotMatch(src, /wrapAfter\('go'/, 'plus d’enveloppe de go, absente au chargement dans l’app');
  assert.match(src, /ctx\.restoring \|\| ctx\.from === 'spots' \|\| ctx\.from === 'detail'/);
  assert.match(src, /setView\('map'\)/);
  /* Posé après tous les scripts (app-shell.js enveloppe go en dernier) et une seule fois. */
  assert.match(src, /DOMContentLoaded', globeFirst/);
  assert.match(src, /__exlGlobe/);
});

test('Explorer : « Tous les continents » ramène à la planète entière', () => {
  assert.match(src, /wrapAfter\('backToWorlds'[^\n]*toMap\(\)[^\n]*overview/);
  assert.match(src, /wrapBack\(\); window\.addEventListener\('load', wrapBack, \{ once: true \}\); window\.addEventListener\('ocean:navigate', wrapBack, \{ once: true \}\);/);
});
