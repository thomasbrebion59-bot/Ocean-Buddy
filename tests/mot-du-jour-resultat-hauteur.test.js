const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Contrôle de la police (19 nov. 2026), espagnol à 375 px, mauvaise réponse : « Abre su página para conseguir su sello. »
   passait sur trois lignes, 71 px de contenu dans le bloc de 52 px du résultat (la dernière ligne touchait le bas de la
   carte du mot du jour). Le nom et la phrase tiennent sur deux lignes dans les 52 px ; au-delà, le bloc passe en .is-long
   (tampon seul à gauche, bouton « Descubre… » sur toute la place), comme pour un nom trop long. */
function block({ resH = 52, resBox = 52 } = {}) {
  const cls = new Set(), el = w => ({ scrollWidth: w, clientWidth: 150 });
  const res = { scrollHeight: resH, clientHeight: resBox };
  const go = el(120), name = el(80);
  return { cls, classList: { add: c => cls.add(c), remove: c => cls.delete(c) },
    querySelector: s => (s === '.cult-quiz-go' ? go : s === '.cult-quiz-res>div>b' ? name : s === '.cult-quiz-res' ? res : null) };
}
function fit(blocks) {
  const ctx = load('cultures.js', ['fitDone'], { document: { querySelectorAll: s => (s === '.cult-quiz-done' ? blocks : []) }, requestAnimationFrame: f => f() });
  ctx.fitDone();
}

test('mot du jour, résultat : contenu plus haut que le bloc, bloc en .is-long ; contenu qui tient, rien ne change', () => {
  const tall = block({ resH: 71 }), fits = block({ resH: 52 });
  fit([tall, fits]);
  assert.ok(tall.cls.has('is-long'), 'trois lignes : .is-long');
  assert.ok(!fits.cls.has('is-long'), 'deux lignes : mise en page habituelle');
});

test('mot du jour, résultat (téléphone) : nom de 20 px et phrase sur deux lignes tiennent dans les 52 px du bloc', () => {
  const css = read('fiches-organisation.css');
  const phone = css.slice(css.indexOf('.cult-quiz-res{height:52px;gap:10px}'));
  const gap = +phone.match(/\.cult-quiz-res>div\{gap:(\d+)px\}/)[1];
  const name = +phone.match(/\.cult-quiz-res>div>b\{font-size:(\d+)px\}/)[1];
  const [, fs, lh] = phone.match(/\.cult-quiz-res>div>small\{font-size:(\d+)px;line-height:([\d.]+)\}/).map(Number);
  /* le nom garde l'interligne 1 de cultures.css (font:800 26px/1) */
  assert.match(read('cultures.css'), /\.cult-quiz-res>div>b\{font:800 26px\/1 /);
  assert.ok(name + gap + 2 * fs * lh <= 52, `${name} + ${gap} + 2 × ${fs} × ${lh} > 52`);
});
