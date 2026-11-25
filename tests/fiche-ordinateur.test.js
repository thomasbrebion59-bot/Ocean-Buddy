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

test('de 960 à 1279 px : la scène et les jours prennent toute la largeur du chapitre', () => {
  const block = css.slice(css.indexOf('@media(min-width:960px) and (max-width:1279px){'));
  assert.match(block, /#spotWeek>\.fx-scene-wrap,#detail \.dcat\[data-cat="meteo"\] #dNow>\.fx-head\{max-width:none\}/);
  assert.match(block, /#spotWeek>\.fx-next>\.fx-days\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
});

test('Le coin sur ordinateur : tuiles en colonnes égales, illustration entière (jamais rognée)', () => {
  assert.match(css, /@media\(min-width:960px\)\{[\s\S]{0,400}#detail \.gl-tiles\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.match(css, /#detail \.gl-tile \.gl-illu\{position:static;[^}]*max-height:none;aspect-ratio:1;object-fit:contain;/);
  assert.doesNotMatch(css, /gl-tiles\{grid-template-columns:repeat\(3,minmax\(0,220px\)\)\}/);
});
