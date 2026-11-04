/* Fiche spot : une seule entrée par action (♥, voyage, immersion), bandeau branché sans second appel réseau, partage vers spot/<id>/. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('« Ajouter à un voyage » et ♥ : seulement dans la barre du bas', () => {
  assert.ok(!/trip-add-from-spot/.test(read('trips.js')));
  assert.match(read('ocean-hub.js'), /spot-bar-trip/);
  assert.match(read('spot-before.css'), /#detail #dFav\{display:none!important\}/);
});

test('immersion : une seule entrée (la bannière), photos dans la galerie de l’app', () => {
  const exp = read('spot-experience.js');
  assert.ok(!/data-experience-explore/.test(exp));
  assert.match(exp, /btn\.hidden=true/);
  assert.match(read('ocean-home.js'), /\$\('#spotVideoPanel'\)\|\|\$\('#dTabs'\)/);
  assert.ok(!/google\.com\/search\?tbm=isch/.test(read('app.js')));
});

test('bandeau « Avant d’y aller » : aucun appel réseau, branché sur la météo déjà chargée', () => {
  const src = read('spot-before.js');
  assert.ok(!/fetch\(|open-meteo|XMLHttpRequest/.test(src));
  assert.match(read('app.js'), /OceanBefore\?\.live\(s,o\)/);
  assert.match(read('spot-experience.js'), /OceanBefore\?\.slot\(/);
  assert.match(read('spot-data.js'), /OceanBefore\?\.season\(/);
  const html = read('index.html');
  assert.ok(html.indexOf('spot-fit-model.js') > html.indexOf('src="app.js') && html.indexOf('spot-before.js') > html.indexOf('spot-fit-model.js'));
});

test('partage : page publique du spot, ancien lien #spot= en secours', () => {
  const src = read('polish.js');
  assert.match(src, /SpotFitModel\.shareUrl\(PUBLIC_URL, spot\.id\)/);
  assert.match(src, /'#spot=' \+ encodeURIComponent\(spot\.id\)/);
});

test('barre d’onglets : masquée sur la fiche seulement, ordre inchangé', () => {
  assert.match(read('spot-before.css'), /body\[data-screen=detail\] \.ocean-v2 \.nav/);
  assert.ok(!/\.nav[^{]*\{[^}]*order:/.test(read('spot-before.css')));
});
