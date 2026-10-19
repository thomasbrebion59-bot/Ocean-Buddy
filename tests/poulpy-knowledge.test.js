const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../poulpy-knowledge.js');
const K=window.PoulpyKnowledge;
const html=q=>{const r=K.reply(q);return r&&r.html;};

test('jeu-poulpy-langues-2 : les puces proposées ne renvoient pas la mauvaise réponse',()=>{
  const choose=K.suggestions.find(s=>s[0]==='Choisir un spot')[1];
  assert.equal(K.reply(choose),null);
  const meteo=html(K.suggestions.find(s=>s[0]==='Météo & marées')[1]);
  assert.match(meteo,/houle/);
  assert.doesNotMatch(meteo,/baïne/);
  assert.match(html(K.suggestions.find(s=>s[0]==='Sécurité')[1]),/baïne/);
});

test('jeu-poulpy-langues-2 : les sous-chaînes ne déclenchent plus de réponse',()=>{
  assert.equal(K.reply('Je prépare un trip à Bali'),null);
  assert.equal(K.reply('Comment ouvrir un compte ?'),null);
  assert.match(html('Il y a du vent ?'),/houle/);
  assert.match(html('Quelles sont les prévisions ?'),/houle/);
  assert.match(html('Il y a un danger ?'),/baïne/);
});
