/* Repère « adapté à ton niveau », danger principal, créneau du bandeau « Avant d’y aller » et lien partagé. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const F = require('../spot-fit-model.js');

const kind = (lv, g, u) => F.fit(lv, g, u).kind;

test('fit : niveau du spot et jauge dans les repères → adapté', () => {
  assert.equal(kind('debutant', 1, 'debutant'), 'fit');
  assert.equal(kind('debutant', 2, 'intermediaire'), 'fit');
  assert.equal(kind('intermediaire', 2, 'expert'), 'fit');
  assert.equal(kind('expert', 3, 'expert'), 'fit');
});

test('fit : un cran au-dessus par le niveau ou par la jauge → exigeant', () => {
  assert.equal(kind('intermediaire', 1, 'debutant'), 'stretch');
  assert.equal(kind('expert', 2, 'intermediaire'), 'stretch');
  assert.equal(kind('debutant', 3, 'debutant'), 'stretch');
  assert.equal(kind('intermediaire', 4, 'intermediaire'), 'stretch');
  assert.equal(kind('expert', 4, 'expert'), 'stretch');
  const r = F.fit('debutant', 3, 'intermediaire');
  assert.deepEqual(r, {kind: 'stretch', level: false, danger: true});
});

test('fit : expert ou jauge 4 pour un débutant → au-dessus', () => {
  assert.equal(kind('expert', 1, 'debutant'), 'above');
  assert.equal(kind('debutant', 4, 'debutant'), 'above');
  assert.deepEqual(F.fit('expert', 4, 'debutant'), {kind: 'above', level: true, danger: true});
});

test('fit : se tait quand une donnée manque (jamais « sans danger »)', () => {
  assert.equal(kind('debutant', 1, null), 'nolevel');
  assert.equal(kind('debutant', 1, 'pro'), 'nolevel');
  assert.equal(kind('debutant', null, 'expert'), 'unrated');
  assert.equal(kind('variable', 2, 'intermediaire'), 'zones');
  /* Ce qui est déjà exigeant reste dit même sans jauge ou sans niveau fixé. */
  assert.equal(kind('expert', null, 'debutant'), 'above');
  assert.equal(kind('variable', 4, 'debutant'), 'above');
  assert.equal(F.shown(F.fit('debutant', null, 'expert')), false);
  assert.equal(F.shown(F.fit('variable', 1, 'expert')), false);
  assert.equal(F.shown(F.fit('debutant', 1, 'debutant')), true);
  assert.equal(F.shown(null), false);
});

test('fit : jauge hors bornes ramenée entre 1 et 4', () => {
  assert.equal(kind('debutant', 9, 'debutant'), 'above');
  assert.equal(kind('debutant', 0, 'debutant'), 'unrated');
  assert.equal(kind('debutant', NaN, 'debutant'), 'unrated');
});

test('mainDanger : catalogue d’abord, carnet ensuite (non vérifié), sinon rien', () => {
  assert.deepEqual(F.mainDanger({dangers: [['🌊', ' Vagues puissantes. '], ['👥', 'Foule']]}), {text: 'Vagues puissantes.', icon: '🌊', basis: 'catalogue'});
  assert.deepEqual(F.mainDanger({dangers: [], carnet: {dangers: [['🪨', 'Rochers']]}}), {text: 'Rochers', icon: '🪨', basis: 'carnet'});
  assert.equal(F.mainDanger({dangers: [['🌊', '  ']]}), null);
  assert.equal(F.mainDanger({}), null);
  assert.equal(F.mainDanger(null), null);
});

test('slotSummary : relit le résultat de bestSlot sans recalcul', () => {
  assert.deepEqual(F.slotSummary({ok: false, reason: 'expert'}, null), {status: 'norule', reason: 'expert'});
  assert.deepEqual(F.slotSummary(null, null), {status: 'norule', reason: null});
  assert.deepEqual(F.slotSummary({ok: true}, null), {status: 'pending'});
  assert.deepEqual(F.slotSummary({ok: true}, {status: 'night'}), {status: 'night'});
  assert.deepEqual(F.slotSummary({ok: true}, {status: 'ok', start: '2026-11-04T09:00', end: '2026-11-04T12:00', quality: 'good'}), {status: 'ok', start: 9, end: 12, quality: 'good'});
  assert.deepEqual(F.slotSummary({ok: true}, {status: 'ok', start: '2026-11-04T15:00', quality: 'fair'}), {status: 'ok', start: 15, end: 15, quality: 'ok'});
  assert.deepEqual(F.slotSummary({ok: true}, {status: 'ok', start: 'x'}), {status: 'nodata'});
});

test('shareUrl : page publique du spot, refuse les adresses douteuses', () => {
  assert.equal(F.shareUrl('https://oceanbuddy.app/', 'hossegor'), 'https://oceanbuddy.app/spot/hossegor/');
  assert.equal(F.shareUrl('https://oceanbuddy.app', 'la_torche-2'), 'https://oceanbuddy.app/spot/la_torche-2/');
  assert.equal(F.shareUrl('http://oceanbuddy.app/', 'hossegor'), null);
  assert.equal(F.shareUrl('https://oceanbuddy.app/', '../x'), null);
  assert.equal(F.shareUrl('https://oceanbuddy.app/', ''), null);
});

test('shareUrl : une page spot/<id>/ existe pour chaque spot du catalogue', () => {
  const root = path.join(__dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
  assert.ok(catalog.length > 700);
  const missing = catalog.filter(s => !F.shareUrl('https://oceanbuddy.app/', s.id) || !fs.existsSync(path.join(root, 'spot', s.id, 'index.html')));
  assert.deepEqual(missing.map(s => s.id), []);
});

test('libellés de la pastille : registre du repère, jamais de garantie', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'spot-before.js'), 'utf8');
  assert.ok(!/sans danger|sécurisé|garanti(?!e\b)/i.test(src.replace(/pas une garantie/g, '')));
  assert.match(src, /un repère, pas une garantie/);
});
