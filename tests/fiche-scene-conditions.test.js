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
  /* Pas de flèche de boussole dans la scène (ce n’est pas une carte) : la direction est écrite, le sens est montré. */
  assert.match(exp, /const arrow = '';/);
  assert.doesNotMatch(exp.slice(exp.indexOf('function paintScene'), exp.indexOf('let sceneIO')), /class="sc-arrow"/);
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

test('scène : aujourd’hui montre le relevé du moment (comme « Maintenant »), les autres jours le maximum', () => {
  const app = read('app.js');
  assert.match(app, /waveM:wv!=null\?\+wv:null,windK:ws!=null\?\+ws:null,windDeg:wd!=null\?\+wd:null,airC:wc\.temperature_2m!=null\?\+wc\.temperature_2m:null/);
  assert.match(exp, /const now = i === 0 \? nowOf\(s, inland\) : null;\n\s+if \(now\) d = Object\.assign\(\{\}, d, now\);/);
  assert.match(exp, /<span class="sc-day">\$\{esc\(now \? 'Maintenant' : dayName\(d\.date, i\)\)\}<\/span>/);
  assert.match(exp, /\$\{now \? 'Houle' : 'Houle, au plus haut'\}/);
  /* Sans relevé du moment (hors ligne, modèle en retard), aujourd’hui garde le maximum et le dit. */
  assert.match(exp, /if \(!l \|\| !l\.live \|\| l\.windK == null\) return null;/);
  /* Le relevé qui arrive après les prévisions repeint la scène, sauf si un autre jour est choisi. */
  assert.match(exp, /if \(shown && shown\.s\.id === s\.id && \(!on \|\| on\.dataset\.sceneDay === '0'\)\)/);
});

test('scène : une vraie vague (lèvre, tube, écume), eau et sable aux couleurs d’illustration, ciel du thème', () => {
  const art = exp.slice(exp.indexOf('function sceneArt()'), exp.indexOf('function sceneHTML('));
  for (const k of ['sc-face', 'sc-tube', 'sc-lip', 'sc-foam', 'sc-white', 'sc-sand', 'sc-wash', 'sc-wind']) assert.ok(art.includes(`class="${k}"`), k);
  assert.match(art, /<linearGradient id="scFace"/);
  assert.match(css, /#detail \.fx-scene \.sc-sky\{fill:color-mix\(in srgb,var\(--t-tint\) 70%,var\(--t-card\)\)\}/, 'le ciel suit le thème : chiffres lisibles');
  assert.doesNotMatch(css, /\.sc-(far|sand|wash|swell|curl)\{[^}]*fill/, 'aucune règle ne recouvre les couleurs de l’illustration');
});
