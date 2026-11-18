const test = require('node:test'), assert = require('node:assert/strict');
const { read, i18nContext, loadInto } = require('./src-extract.cjs');
/* Contrôle final 3 : en anglais et en espagnol, le champ « Ton prénom » des Réglages contenait « Explorateur ». Le prénom
   par défaut est montré dans la langue de l’interface ; un prénom saisi n’est jamais traduit ni remplacé. */
function ctx(lang, name, value) {
  const els = { setName: { value: value || '' }, settingsModal: { classList: { add() {} } }, profName: {}, readyTitle: {}, homeHello: {} };
  const c = i18nContext(lang, {});
  c.document.getElementById = id => els[id] || null;
  c.userName = name;
  loadInto(c, 'app.js', ['shownName', 'applyName', 'saveName']);
  c.toast = () => {}; c.saveState = () => {}; c.closeSettings = () => {};
  return { c, els };
}

test('prénom par défaut : « Explorer » en anglais, « Explorador » en espagnol, « Explorateur » en français', () => {
  assert.equal(ctx('en', 'Explorateur').c.shownName(), 'Explorer');
  assert.equal(ctx('es', 'Explorateur').c.shownName(), 'Explorador');
  assert.equal(ctx('fr', 'Explorateur').c.shownName(), 'Explorateur');
  const { c, els } = ctx('en', 'Explorateur'); c.applyName();
  assert.equal(els.profName.textContent, 'Explorer');
  assert.equal(els.readyTitle.textContent, 'C’est parti, Explorer !', 'i18n traduit ensuite le reste de la phrase');
});

test('prénom saisi : jamais traduit ; le défaut enregistré tel quel reste le défaut', () => {
  assert.equal(ctx('en', 'Rider').c.shownName(), 'Rider', 'même un prénom qui est aussi un mot du dictionnaire');
  assert.equal(ctx('es', 'Léa').c.shownName(), 'Léa');
  const kept = ctx('en', 'Explorateur', 'Explorer'); kept.c.saveName();
  assert.equal(kept.c.userName, 'Explorateur', '« Explorer » enregistré sans changement : toujours le défaut');
  const typed = ctx('en', 'Explorateur', 'Maya'); typed.c.saveName();
  assert.equal(typed.c.userName, 'Maya');
  const src = read('app.js');
  assert.match(src, /var i=document\.getElementById\('setName'\);if\(i\)i\.value=shownName\(\);/, 'Réglages');
  assert.match(src, /toast\('Bon retour, '\+shownName\(\)\+' ! L’océan t’attendait\.',2500\);/, 'Bon retour');
});

test('profil : le titre (prénom) n’est jamais passé au dictionnaire, il reçoit le prénom déjà dans la bonne langue', () => {
  assert.match(read('index.html'), /<h1 id="profName" translate="no" data-no-i18n>Explorateur<\/h1>/);
  assert.match(read('app.js'), /var pn=document\.getElementById\('profName'\);if\(pn\)pn\.textContent=nm;/);
});
