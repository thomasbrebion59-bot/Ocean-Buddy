'use strict';
/* 23 nov. 2026, accord du fondateur : aucune mention d'IA dans les textes de l'app, mais l'app reste honnête sur les
   45 spots illustrés faute de vraie photo : « Illustration, ce n'est pas une photo du lieu ». Le marqueur interne
   (photo.ai) reste pour la logique. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('aucun texte affiché ne mentionne l’IA (source et traductions)', () => {
  const src = JSON.parse(read('locales/source/fr.json'));
  assert.deepEqual(src.filter(k => /\b(IA|AI)\b/.test(k)), []);
  for (const l of ['en', 'es']) {
    const d = JSON.parse(read(`locales/translations/${l}.json`));
    assert.deepEqual(src.filter(k => typeof d[k] === 'string' && /\b(IA|AI)\b/.test(d[k])), [], l);
  }
  for (const f of ['photo-catalog.js', 'catalog-runtime.js', 'photos.html', 'spot-scenes.js', 'data/catalog.json', 'assets/spots/sources.json'])
    assert.doesNotMatch(read(f).replace(/\/\*[\s\S]*?\*\//g, ''), /Illustration IA|par IA|générée par IA/, f);
});

test('les 45 spots illustrés le disent honnêtement', () => {
  const meta = JSON.parse(read('assets/spots/sources.json'));
  const ai = Object.entries(meta).filter(([, p]) => p.ai);
  assert.equal(ai.length, 45);
  for (const [id, p] of ai) {
    assert.equal(p.label, 'Illustration', id);
    assert.equal(p.caption, 'Illustration, ce n’est pas une photo du lieu', id);
    assert.equal(p.author, 'Illustration Ocean Buddy', id);
  }
  assert.match(read('app.js'), /if\(photo&&\(photo\.ai\|\|photo\.label==='Illustration'\)\)return 'Illustration, ce n’est pas une photo du lieu';/);
});
