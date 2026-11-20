'use strict';
/* Scène illustrée de Conditions (20 nov. 2026) : le jour choisi parmi « Les prochains jours », avec les seules données
   de prévision déjà affichées ; rien d’inventé, rien qui bouge hors écran ni en mouvement réduit. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const exp = read('spot-experience.js'), css = read('fiche.css');
const scene = css.slice(css.indexOf('SCÈNE ILLUSTRÉE DE CONDITIONS'), css.indexOf('Mouvement réduit ===='));

test('scène : trois tailles de vague, période réelle, vent dans son sens seulement quand il est connu', () => {
  assert.match(exp, /const waveSize = h => \(h == null \? 's' : h < 0\.8 \? 's' : h < 2 \? 'm' : 'l'\);/);
  assert.match(exp, /sc\.style\.setProperty\('--sc-period', \(per \? Math\.min\(18, Math\.max\(5, per\)\) : 10\) \+ 's'\);/);
  assert.match(exp, /sc\.dataset\.side = side === 'offshore' \? 'land' : side === 'onshore' \? 'sea' : 'none';/);
  assert.match(exp, /window\.SpotDataModel\?\.windSide\?\.\(deg, s && s\.wind\)/, 'le sens vient du catalogue, jamais deviné');
  for (const k of ['s', 'm', 'l']) assert.match(scene, new RegExp(`\\[data-size="${k}"\\] \\.sc-wave\\{transform:scale\\(`));
  assert.match(scene, /\.is-live\[data-side="land"\] \.sc-wind path\{animation:scWindLand/);
  assert.match(scene, /\.is-live\[data-side="sea"\] \.sc-wind path\{animation:scWindSea/);
  assert.doesNotMatch(scene, /data-side="none"\][^{]*\{[^}]*animation/, 'sans sens connu, les traits ne vont nulle part');
  /* La flèche montre où va le vent (comme l’heure par heure), le texte d’où il vient. */
  assert.match(exp, /transform:rotate\(\$\{\(Math\.round\(\+d\.windDir\) \+ 180\) % 360\}deg\)/);
});

test('scène : toucher un jour la bascule ; les jours sont des boutons ; rien ne bouge hors écran ni en mouvement réduit', () => {
  assert.match(exp, /<button type="button" class="fx-day\$\{i === 0 \? ' is-today' : ''\}" data-scene-day="\$\{i\}" aria-pressed="\$\{i === 0\}">/);
  assert.match(exp, /const b = e\.target\.closest\?\.\('#spotWeek \[data-scene-day\]'\)/);
  assert.match(exp, /try \{ paintScene\(host, daily\[0\], 0, s, inland\); \} catch \(e\) \{\}/, 'la scène ne casse jamais les prévisions');
  assert.match(exp, /new IntersectionObserver\(es => es\.forEach\(e => e\.target\.classList\.toggle\('is-live', e\.isIntersecting\)\)/);
  for (const m of scene.matchAll(/([^{}]+)\{[^}]*animation:sc\w+/g)) assert.match(m[1], /\.is-live/, 'animation seulement à l’écran : ' + m[1].trim());
  assert.match(scene, /@media \(prefers-reduced-motion:reduce\)\{#detail \.fx-scene \*\{animation:none!important;transition:none!important\}\}/);
  assert.match(scene, /body\.reduce-motion #detail \.fx-scene \*\{animation:none!important;transition:none!important\}/);
  /* Les chiffres disent ce qu’ils sont : des maximums du jour (pas le relevé du moment, qui est dans « Maintenant »). */
  for (const k of ['Houle, au plus haut', 'Vent, au plus fort', 'Air, au plus chaud', 'Vent de terre', 'Vent de mer', 'Vent de côté'])
    for (const l of ['en', 'es']) { const d = JSON.parse(read(`locales/translations/${l}.json`)); assert.ok(d[k] && d[k] !== k, `${l} : ${k}`); }
});
