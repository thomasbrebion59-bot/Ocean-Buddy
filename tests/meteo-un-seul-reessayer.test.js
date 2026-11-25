'use strict';
/* 25 nov. 2026 : quand la météo échoue, la fiche montrait jusqu’à quatre « Réessayer » dans le chapitre Conditions
   (Maintenant, Ton créneau, tête des conditions, semaine). Il n’en reste qu’un, et ce toucher relance tout ce qui a échoué. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('oneRetry : le premier bouton reste visible, les autres sont masqués', () => {
  const buttons = [{ hidden: true }, { hidden: false }, { hidden: false }, { hidden: false }];
  let asked = '';
  const ctx = { console, document: { querySelector: () => null, querySelectorAll: s => { asked = s; return buttons; }, addEventListener() {}, body: { dataset: {} } } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('spot-before.js'), ctx);
  ctx.OceanBefore.oneRetry();
  assert.equal(asked, '#detail [data-weather-retry]');
  assert.deepEqual(buttons.map(b => b.hidden), [false, true, true, true]);
});

test('chaque échec passe par oneRetry, et un bouton masqué ne prend pas de place', () => {
  assert.match(read('spot-before.js'), /data-weather-retry="\$\{family === 'week' \? 'week' : 'now'\}">Réessayer<\/button>`\);\n    oneRetry\(\);/);
  assert.match(read('app.js'), /data-weather-retry="now">Réessayer<\/button>';\n  try\{window\.OceanBefore\?\.oneRetry\?\.\(\);\}catch\(e\)\{\}/);
  assert.match(read('spot-experience.js'), /h\.innerHTML = WEEK_FAILED; try \{ window\.OceanBefore\?\.retry\(s, 'slot', 'week'\);/);
  assert.match(read('spot-before.css'), /\.ob-retry\[hidden\]\{display:none\}/);
});

test('un toucher sur le bouton restant relance chaque famille qui a échoué, et seulement elle', () => {
  assert.match(read('app.js'), /nowFailed=state==='failed';/);
  assert.match(read('app.js'), /closest\?\.\('\[data-weather-retry\]'\)&&nowTry&&nowFailed\)nowTry\.again\(\)/);
  assert.match(read('spot-experience.js'), /weekFailed = state === 'failed';/);
  assert.match(read('spot-experience.js'), /closest\?\.\('\[data-weather-retry\]'\) && weekTry && weekFailed\) weekTry\.again\(\)/);
});
