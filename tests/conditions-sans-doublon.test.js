'use strict';
/* 23 nov. 2026, accord du fondateur : le chapitre Conditions ne montre plus deux fois la houle et le vent (le bloc
   « Maintenant » et la scène illustrée). Ordre approuvé : alerte de danger, heure du relevé, scène, tuiles Eau et Marée,
   ton créneau, les prochains jours. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const css = read('fiche.css');
const sec = css.slice(css.indexOf('CONDITIONS SANS DOUBLON'), css.indexOf('Mouvement réduit', css.indexOf('CONDITIONS SANS DOUBLON')));
const order = sel => { const m = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{order:(\\d+)\\}').exec(sec); assert.ok(m, sel); return +m[1]; };

test('ordre : alerte, relevé, scène, tuiles, créneau, jours, puis le détail', () => {
  const seq = [
    '#dNow>.fx-alert', '#dNow>.fx-head', '#spotWeek>:is(.fx-scene-wrap,.spot-week-loading,.spot-week-empty)',
    '#dNow>.fx-row', '#dNow>.fx-slot', '#spotWeek>.fx-next', '#spotWeek>:is(.wx-block,.fx7-stamp)',
    '#spotWeek>:is(.spot-week-note,.wx-source)'
  ].map(order);
  assert.deepEqual(seq, [...seq].sort((a, b) => a - b));
  assert.equal(order('#dNow>.fx-alert'), 1, 'le danger reste en tête du chapitre');
  assert.match(sec, /#detail \.dcat\[data-cat="meteo"\]>#dNow,#detail \.dcat\[data-cat="meteo"\]>#spotWeek\{display:contents\}/);
});

test('vent et houle une seule fois : dans la scène ; sans scène (prévision en échec), les relevés reviennent', () => {
  assert.match(sec, /:not\(:has\(\.spot-week-empty,\.spot-week-loading\.is-failed\)\) \.fx-readings>:is\(\[data-reading="wind"\],\[data-reading="wave"\]\)\{display:none\}/);
  /* Eau et Marée ne sont jamais masquées. */
  assert.doesNotMatch(sec, /\[data-reading="(temp|tide)"\][^{]*\{[^}]*display:none/);
  /* L'alerte de danger n'est jamais masquée. */
  assert.doesNotMatch(sec, /fx-alert[^{]*\{[^}]*(display:none|visibility:hidden)/);
  /* Pendant le chargement, la place de la scène est réservée (pas de saut). */
  assert.match(sec, /\.spot-week-loading:not\(\.is-failed\)\{aspect-ratio:400 \/ 290;/);
  /* La scène reste dans #spotWeek, où paintScene la cherche. */
  const exp = read('spot-experience.js');
  assert.match(exp, /const sc = host && host\.querySelector\('\[data-scene\]'\)/);
});
