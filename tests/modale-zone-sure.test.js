/* Fenêtres du gabarit quiz-modal / aqi (Réglages, quiz, carnet écolo) sur téléphone : dans l’app (viewport-fit=cover),
   la zone sûre du haut fait ~60 px (Dynamic Island). Essai WKWebView du 18 nov. (iPhone Air, iOS 27) : la carte des
   Réglages commençait à 14 px, titre sous l’îlot, bouton Fermer sur l’icône de batterie. La marge et la hauteur
   maximale tiennent désormais compte des zones sûres (0 sur le site et dans Chrome : rendu inchangé). */
const test = require('node:test'), assert = require('node:assert');
const { read } = require('./src-extract.cjs');

const css = read('design.css');

/* Bloc @media(max-width:639px) de design.css (règles téléphone). */
function phoneBlock() {
  const at = css.indexOf('@media(max-width:639px){');
  assert.ok(at >= 0, 'bloc téléphone introuvable');
  let d = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') d++;
    else if (css[i] === '}' && --d === 0) return css.slice(at, i + 1);
  }
  throw new Error('bloc non fermé');
}
const rule = (block, sel) => {
  const i = block.indexOf(sel + '{');
  assert.ok(i >= 0, 'règle introuvable : ' + sel);
  return block.slice(i, block.indexOf('}', i) + 1);
};

test('téléphone : le voile des fenêtres garde la zone sûre en haut et en bas', () => {
  const r = rule(phoneBlock(), '.ocean-v2 .quiz-modal,.ocean-v2 .aqi');
  assert.match(r, /padding:max\(13px,env\(safe-area-inset-top,0px\)\) 13px max\(13px,env\(safe-area-inset-bottom,0px\)\)/);
});

test('téléphone : la carte ne dépasse jamais la hauteur hors zones sûres', () => {
  const r = rule(phoneBlock(), '.ocean-v2 .quiz-card,.ocean-v2 .aqi-card');
  assert.match(r, /max-height:calc\(100dvh - max\(13px,env\(safe-area-inset-top,0px\)\) - max\(13px,env\(safe-area-inset-bottom,0px\)\)\)/);
  assert.doesNotMatch(r, /max-height:calc\(100dvh - 28px\)/);
});
