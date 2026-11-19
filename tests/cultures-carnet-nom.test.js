const test = require('node:test'), assert = require('node:assert/strict');
const { read, load } = require('./src-extract.cjs');
/* Contrôle de la police (19 nov. 2026) : dans le carnet des tampons, les noms longs étaient coupés par « … »
   (« SAINT VINCENT AND THE GRENADINES », « TURKS AND CAICOS IS… », « ISLAS VÍRGENES DE LOS ESTADOS UNIDOS »,
   « EMIRATOS ÁRABES UNIDOS »). Le nom se lit en entier : corps réduit sur une ligne, sinon deux lignes. */

/* Nom factice : largeur naturelle à 17 px, proportionnelle au corps ; sur deux lignes, seul le mot le plus long compte. */
function nameEl(w17, longestWord17, clientWidth) {
  const el = { dataset: {}, clientWidth, removeAttribute(k) { if (k === 'data-fit') delete this.dataset.fit; } };
  Object.defineProperty(el, 'scrollWidth', { get() {
    const f = +(el.dataset.fit || 0), size = { 0: 17, 1: 15, 2: 13.5, 3: 15, 4: 13.5 }[f];
    const w = (f >= 3 ? longestWord17 : w17) * size / 17;
    return Math.max(clientWidth, Math.round(w));
  } });
  return el;
}
function run(els) {
  const ctx = load('cultures.js', ['fitIndex'], { document: { querySelectorAll: () => els, fonts: null }, requestAnimationFrame: f => f(), setTimeout });
  ctx.fitIndex();
  return els.map(e => e.dataset.fit || '0');
}

test('carnet : nom court inchangé, nom moyen en corps réduit sur une ligne, nom très long sur deux lignes', () => {
  const [short, mid, midLong, long] = run([
    nameEl(80, 80, 145),     /* « JAPON » */
    nameEl(164, 120, 145),   /* « ÎLES TURQUES-ET-CAÏQUES » : 15 px suffit */
    nameEl(180, 110, 145),   /* nom de 180 px en 17 px : 13,5 px suffit */
    nameEl(259, 110, 145)    /* « ISLAS VÍRGENES DE LOS ESTADOS UNIDOS » : deux lignes */
  ]);
  assert.equal(short, '0');
  assert.equal(mid, '1');
  assert.equal(midLong, '2');
  assert.equal(long, '3');
});

test('carnet : mesuré à l’ouverture et au changement de taille ; CSS sans « … » quand le nom passe sur deux lignes', () => {
  const js = read('cultures.js'), css = read('cultures.css');
  assert.match(js, /show\(indexHTML\(\)\);fitIndex\(\);/);
  assert.match(js, /addEventListener\('resize',\(\)=>\{if\(document\.querySelector\('dialog\.cult-sheet\[open\] \.cult-ix'\)\)fitIndex\(\);\}\)/);
  assert.ok(css.includes('.cult-ix>span:not(.cult-stamp)>b[data-fit="1"]{font-size:15px}'));
  assert.ok(css.includes('.cult-ix>span:not(.cult-stamp)>b[data-fit="2"]{font-size:13.5px}'));
  const two = css.match(/\.cult-ix>span:not\(\.cult-stamp\)>b:is\(\[data-fit="3"\],\[data-fit="4"\]\)\{[^}]*\}/);
  assert.ok(two, 'règle des deux lignes');
  assert.match(two[0], /white-space:normal;text-overflow:clip;overflow-wrap:normal;word-break:normal;hyphens:none/);
});
