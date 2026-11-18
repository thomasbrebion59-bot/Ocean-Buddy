const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Mot du jour, après la réponse : « Découvrir <pays> » et le nom du pays ne sont jamais coupés par « … ». Mesurés une fois
   posés (cultures.js, fitDone) : ce qui déborde fait passer le bloc en .is-long (tampon seul à gauche, bouton sur deux
   lignes centrées, hauteurs inchangées). Faux éléments : largeur du contenu (scrollWidth) et de la boîte (clientWidth). */
function block(goW, nameW, box = 150) {
  const cls = new Set();
  const el = w => ({ scrollWidth: w, clientWidth: box });
  const go = el(goW), name = nameW == null ? null : el(nameW);
  return { cls, classList: { add: c => cls.add(c), remove: c => cls.delete(c) },
    querySelector: s => (s === '.cult-quiz-go' ? go : s === '.cult-quiz-res>div>b' ? name : null) };
}
function fit(blocks) {
  const ctx = load('cultures.js', ['fitDone'], {
    document: { querySelectorAll: s => (s === '.cult-quiz-done' ? blocks : []) },
    requestAnimationFrame: f => f()
  });
  ctx.fitDone();
}

test('mot du jour : bouton ou nom qui déborde, bloc en .is-long ; tout tient, rien ne change', () => {
  const longBtn = block(260, 90), longName = block(140, 190), short = block(120, 80), wrong = block(300, null);
  fit([longBtn, longName, short, wrong]);
  assert.ok(longBtn.cls.has('is-long'), '« Découvrir Saint-Vincent-et-les-Grenadines » trop large');
  assert.ok(longName.cls.has('is-long'), 'nom trop large à côté du tampon');
  assert.ok(!short.cls.has('is-long'), 'nom court : mise en page habituelle');
  assert.ok(wrong.cls.has('is-long'), 'mauvaise réponse sans nom affiché : le bouton seul décide');
  /* Remesure (nouveau jour, retour du réseau, rotation) : la classe est retirée avant de mesurer, puis remise si besoin. */
  short.cls.add('is-long'); fit([short]);
  assert.ok(!short.cls.has('is-long'));
});

test('mot du jour : la mesure est faite à chaque pose du résultat (réponse, accueil, nouveau jour, rotation)', () => {
  const src = read('cultures.js');
  assert.match(src, /box\?\.replaceWith\(t\.children\[0\]\);choices\.replaceWith\(t\.children\[0\]\);[^\n]*\n\s*fitDone\(\);/, 'après la réponse');
  assert.match(src, /if\(t\.firstElementChild\)\{body\.replaceWith\(t\.firstElementChild\);fitDone\(\);\}/, 'accueil (fillHome)');
  assert.match(src, /if\(r\.already\)\{[^\n]*fitDone\(\);return;\}/, 'réponse déjà donnée');
  assert.match(src, /body\.replaceWith\(t\.firstElementChild\);fitDone\(\);syncMeta\(/, 'nouveau jour');
  assert.match(src, /addEventListener\('resize',\(\)=>\{if\(document\.querySelector\('\.cult-quiz-go'\)\)fitDone\(\);\}\)/, 'rotation');
});

test('mot du jour : .is-long, deux lignes centrées sans « … », tampon seul à gauche, hauteurs inchangées', () => {
  const css = read('cultures.css'), fo = read('fiches-organisation.css');
  assert.match(css, /\.cult-quiz-done\.is-long \.cult-quiz-go\{white-space:normal;text-overflow:clip;text-align:center;overflow-wrap:normal;font-size:13\.5px;line-height:1\.15\}/);
  assert.match(css, /\.cult-quiz-done\.is-long \.cult-quiz-res>div\{display:none\}/, 'le nom s’efface au lieu d’être coupé (il est dans le tampon et le bouton)');
  assert.match(fo, /\.cult-quiz-done\.is-long\{grid-template-columns:auto minmax\(0,1fr\)\}/);
  assert.match(fo, /\.cult-quiz-done\.is-long \.cult-quiz-go\{max-width:none;padding:0 14px\}/);
  for (const [file, src] of [['cultures.css', css], ['fiches-organisation.css', fo]])
    for (const [, body] of src.matchAll(/\.is-long[^{]*\{([^}]*)\}/g))
      assert.doesNotMatch(body, /(^|;)\s*(min-|max-)?height:/, file + ' : .is-long ne touche à aucune hauteur');
});
