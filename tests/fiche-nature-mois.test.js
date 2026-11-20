'use strict';
/* Nature, frise des douze mois (20 nov. 2026) : seulement les relevés mensuels iNaturalist déjà chargés ; toucher un
   mois met en avant les espèces vues ce mois-là ; « À connaître avant de te mettre à l’eau » reste toujours visible. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const data = read('spot-data.js'), css = read('fiche.css');

test('frise : douze mois, au moins deux espèces suivies par mois, sinon rien', () => {
  const fn = data.slice(data.indexOf('function wildMonths'), data.indexOf('function paintWildMonth'));
  assert.match(fn, /const withH = list\.filter\(o => Array\.isArray\(o\.h\) && o\.h\.length === 12 && o\.h\.some\(v => v > 0\)\);/);
  assert.match(fn, /if \(withH\.length < 2\) return '';/);
  assert.match(fn, /Array\.from\(\{ length: 12 \}, \(_, m\) => `<button type="button" class="nx-m/);
  assert.match(fn, /aria-pressed="\$\{m === wildMonth\}"/);
  /* Les barres disent la saison réelle (part des relevés de chaque espèce), jamais un chiffre inventé. */
  assert.match(fn, /const score = m => withH\.reduce\(\(t, o\) => t \+ o\.h\[m\] \/ Math\.max\(1, \.\.\.o\.h\), 0\)/);
});

test('toucher un mois : espèces vues mises en avant, les autres atténuées, nouveau spot = mois en cours', () => {
  const fn = data.slice(data.indexOf('function paintWildMonth'), data.indexOf('/* ---------------- Interactions'));
  assert.match(fn, /li\.classList\.toggle\('is-seen', !!seen && seen\[m\] === '1'\); li\.classList\.toggle\('is-off', !!seen && seen\[m\] !== '1'\);/);
  assert.match(data, /if \(s && s\.id !== wildSpot\) \{ wildSpot = s\.id; wildMonth = new Date\(\)\.getMonth\(\); \}/);
  assert.match(data, /const wm = e\.target\.closest\('#dWild \[data-wild-month\]'\);/);
  assert.match(css, /\.sd-species>\.sd-sp\.is-off\{opacity:\.38\}/);
  /* Les espèces à connaître ne sont jamais atténuées ni repliées. */
  assert.doesNotMatch(css, /bio-warn[^{]*\{[^}]*(display:none|opacity)/);
  for (const l of ['en', 'es']) { const d = JSON.parse(read(`locales/translations/${l}.json`)); for (const k of ['Mois par mois', 'Choisis un mois']) assert.ok(d[k] && d[k] !== k, `${l} : ${k}`); }
});
