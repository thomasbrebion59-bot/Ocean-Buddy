/* Tampons des cultures (carnet « Mes tampons », profil, mot du jour, page du pays) : le nom du pays tient en entier
   dans le cercle, jamais de « … ». Cause du « PORTUG… » : les règles des textes de la carte qui contient le tampon
   (.cult-ix b, .cult-ix>span, .cult-quiz-res b/small) s’appliquaient aussi au <b> et au <small> du tampon
   (nowrap + ellipsis, marges intérieures, date en 12 px). Vérifié à l’écran pour les 118 pays en FR, EN et ES. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const css = read('cultures.css'), page = read('fiches-organisation.css'), js = read('cultures.js');

test('tampon : les textes de la carte qui le contient ne s’appliquent plus à son nom ni à sa date', () => {
  for (const [src, bad] of [[css, /(^|\})\s*\.cult-ix b\{/], [css, /(^|\})\s*\.cult-ix>span\{/], [css, /\.cult-quiz-res b\{/], [css, /\.cult-quiz-res small\{/], [page, /\.cult-quiz-res b\{/], [page, /\.cult-quiz-res small\{/], [page, /\.cult-quiz-res \.cult-stamp b\{/]])
    assert.doesNotMatch(src, bad, String(bad));
  assert.match(css, /\.cult-ix>span:not\(\.cult-stamp\)\{display:grid;gap:3px;padding:8px 10px 0;min-width:0\}/);
  assert.match(css, /\.cult-ix>span:not\(\.cult-stamp\)>b\{[^}]*text-overflow:ellipsis\}/, 'le libellé sous la photo garde son style');
  assert.match(css, /\.cult-quiz-res>div>b\{/);
  assert.match(page, /\.cult-quiz-res>div>b\{font-size:20px\}/);
});

test('tampon : retour à la ligne entre les mots, taille selon la longueur, jamais de limite de lignes ni de « … »', () => {
  const rule = css.match(/\.cult-stamp b\{([^}]*)\}/)[1];
  assert.match(rule, /white-space:normal/);
  assert.match(rule, /font:900 calc\(var\(--sf\) \* var\(--fit,1\)\)\/1 var\(--as-condensed\)/);
  assert.doesNotMatch(rule, /line-clamp|ellipsis|overflow:hidden|nowrap/);
  assert.doesNotMatch(css + page, /\.cult-stamp(\[[^\]]*\]|\.[\w-]+)*\s*>?\s*b\{[^}]*(text-overflow:ellipsis|-webkit-line-clamp)/);
  /* Taille de base selon l’endroit : carnet 58 px, profil et mot du jour (ordinateur) 66 px, mot du jour (téléphone) 48 px, page du pays 104 px. */
  assert.match(css, /\.cult-stamp\{--sf:11px;/);
  assert.match(css, /\.cult-stamp\.is-big\{--sf:15px;width:104px;height:104px\}/);
  assert.match(css, /\.cult-ix \.cult-stamp\{--sf:9px;/);
  assert.match(page, /\.cult-quiz-res \.cult-stamp\{--sf:7\.6px\}/);
  for (const n of [1, 2, 3]) assert.match(css, new RegExp(`\\.cult-stamp\\[data-fit="${n}"\\]\\{--fit:`));
});

test('tampon : niveau de taille selon le nom (longueur totale, mot le plus long), pour les pays les plus longs en FR, EN et ES', () => {
  const src = js.match(/const stampFit=(n=>\{[^;]*;[^;]*;\});/);
  assert.ok(src, 'stampFit dans cultures.js');
  const fit = eval(src[1]);
  assert.match(js, /data-fit="\$\{stampFit\(String\(local\(c\)\)\)\}"/, 'posé sur chaque tampon, avec le nom affiché (langue de l’interface)');
  assert.equal(fit('Cuba'), 0);
  assert.equal(fit('Portugal'), 1);
  assert.equal(fit('Philippines'), 2);
  for (const lg of ['fr', 'en', 'es']) {
    const names = Object.values(JSON.parse(read(`assets/data/cultures.${lg}.json`)).countries).map(c => c.name);
    assert.equal(names.length, 118);
    for (const n of names) {
      const t = n.length, w = Math.max(...n.split(/[\s-]+/).map(x => x.length));
      if (t > 24 || w > 11) assert.equal(fit(n), 3, `${lg} ${n}`);
      else if (t > 15 || w > 9) assert.ok(fit(n) >= 2, `${lg} ${n}`);
    }
  }
  assert.equal(fit('Islas Vírgenes de los Estados Unidos'), 3);
  assert.equal(fit('Saint-Vincent-et-les-Grenadines'), 3);
});
