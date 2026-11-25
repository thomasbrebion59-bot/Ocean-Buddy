'use strict';
/* 25 nov. 2026 : sur ordinateur, la fiche laissait une grande place vide à droite des Conditions (scène limitée à 640 px)
   et le nom du jour se coupait au milieu du mot (« Aujo urd’h ui »). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'fiche.css'), 'utf8');

test('Conditions sur ordinateur : la scène à gauche, la colonne de droite remplie', () => {
  const block = css.slice(css.indexOf('@media(min-width:1280px){\n  .ocean-v2 #detail .dcat[data-cat="meteo"]'));
  assert.ok(block.length > 0);
  assert.match(block, /display:grid;grid-template-columns:minmax\(0,640px\) minmax\(300px,1fr\)/);
  assert.match(block, /#spotWeek>:is\(\.fx-scene-wrap,\.spot-week-loading\)\{grid-column:1;grid-row:span 3\}/);
  assert.match(block, /:is\(#dNow>\.fx-row,#dNow>\.fx-slot,#spotWeek>\.fx-next\)\{grid-column:2\}/);
  /* Seulement avec une scène ou sa place réservée : si la prévision échoue, la colonne unique revient. */
  assert.match(block, /:has\(#spotWeek>:is\(\.fx-scene-wrap,\.spot-week-loading:not\(\.is-failed\)\)\)\{display:grid/);
});

test('les jours ne se coupent plus au milieu du mot sur ordinateur', () => {
  assert.match(css, /#detail \.fx-next>\.fx-days>\.fx-day>b\{grid-column:1 \/ -1;overflow-wrap:normal\}/);
});
