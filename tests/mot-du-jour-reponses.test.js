const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Simulateur iPhone (18 nov.) : avant de répondre, le bouton « Saint-Vincent-et-les-Grenadines » affichait
   « Saint-Vincent- / et-les-… » (deux lignes, coupe n’importe où, « … »), et le bouton vert de la bonne réponse
   « Saint-Vincent-… ». Une réponse se lit en entier : deux lignes, sinon trois, puis un corps plus petit (mesuré par
   fitDone, comme le résultat) ; la coche devient une pastille sur le coin du bouton, hors du texte. */
function choice(needs) {
  // needs : niveau à partir duquel le nom tient (0 = tout de suite) ; au-dessous, le texte dépasse en hauteur.
  const ds = {}, b = { dataset: ds, removeAttribute: a => { if (a === 'data-fit') delete ds.fit; } };
  const sp = { get scrollHeight() { return (+(ds.fit || 0) >= needs) ? 30 : 45; }, clientHeight: 30, scrollWidth: 90, clientWidth: 90 };
  b.querySelector = s => (s === 'span' ? sp : null);
  return b;
}
function fit(choices) {
  const ctx = load('cultures.js', ['fitDone'], {
    document: { querySelectorAll: s => (s === '.cult-choice' ? choices : []) }, requestAnimationFrame: f => f()
  });
  ctx.fitDone();
}

test('réponses du mot du jour : le plus grand corps où le nom tient entier, rien pour un nom court', () => {
  const short = choice(0), two = choice(1), three = choice(2), longest = choice(3);
  fit([short, two, three, longest]);
  assert.equal(short.dataset.fit, undefined, '« Japon » : rien ne change');
  assert.equal(two.dataset.fit, '1', 'trois lignes');
  assert.equal(three.dataset.fit, '2', 'trois lignes, corps 11,5 px');
  assert.equal(longest.dataset.fit, '3');
  /* Remesure (nouveau jour, rotation) : on repart du corps habituel. */
  fit([two]); assert.equal(two.dataset.fit, '1');
});

test('réponses du mot du jour : ni coupe au milieu d’un mot ni « … », pastille hors du texte, hauteur commune', () => {
  const fo = read('fiches-organisation.css');
  const span = fo.match(/\.cult-choice span\{[^}]*\}/)[0];
  assert.doesNotMatch(span, /anywhere/);
  assert.match(span, /overflow-wrap:normal/);
  assert.match(fo, /\.cult-choice\[data-fit="1"\] span\{-webkit-line-clamp:3\}/);
  assert.match(fo, /\.cult-choice\[data-fit="2"\] span\{-webkit-line-clamp:3;font-size:11\.5px\}/);
  assert.match(fo, /\.cult-choice\[data-fit="3"\] span\{-webkit-line-clamp:4;font-size:10\.5px\}/);
  assert.match(fo, /\.cult-choice\{position:relative;justify-content:center;height:52px;/, 'même hauteur pour les trois boutons');
  assert.match(fo, /\.cult-choice\.is-right::after,\.cult-choice\.is-wrong::after\{position:absolute;/, 'coche posée sur le coin, hors du texte');
  const js = read('cultures.js');
  assert.match(js, /const fitChoices=\(\)=>document\.querySelectorAll\('\.cult-choice'\)/);
  assert.match(js, /else if\(body\)fitDone\(\);/, 'jeu posé directement par homeHTML : mesuré aussi');
});
