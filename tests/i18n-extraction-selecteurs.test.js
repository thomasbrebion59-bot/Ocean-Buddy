'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

/* Un sélecteur CSS qui commence par une balise (« dialog.cult-sheet[open] .cult-ix », cultures.js) était pris pour une
   phrase à traduire : une entrée sans traduction possible, qui faisait passer les dictionnaires sous 100 %. */
test('extraction : aucun sélecteur CSS parmi les textes à traduire', () => {
  const src = JSON.parse(read('locales/source/fr.json'));
  assert.ok(!src.includes('dialog.cult-sheet[open] .cult-ix'));
  const token = /^(?:[>+~]|(?:[a-z*][\w-]*)?(?:[.#][\w-]+|\[[\w-]+(?:[~|^$*]?=[^\]]*)?\]|::?[\w-]+(?:\([^)]*\))?)*,?)$/;
  const selectors = src.filter(s => /[.#\[][a-z]/.test(s) && !/[A-ZÀ-ÖØ-öø-ÿŒœ’]/.test(s) && s.split(/\s+/).every(t => token.test(t)));
  assert.deepEqual(selectors, []);
  assert.match(read('scripts/i18n-extract.cjs'), /s\.split\(\/\\s\+\/\)\.every\(t => SELECTOR_TOKEN\.test\(t\)\)\) return false;/);
});

test('dictionnaires : chaque texte de la source a sa traduction en anglais et en espagnol', () => {
  const src = JSON.parse(read('locales/source/fr.json'));
  for (const lang of ['en', 'es']) {
    const dict = JSON.parse(read(`locales/translations/${lang}.json`));
    const missing = src.filter(k => !(typeof dict[k] === 'string' && dict[k].trim()));
    assert.deepEqual(missing, [], lang);
  }
});
