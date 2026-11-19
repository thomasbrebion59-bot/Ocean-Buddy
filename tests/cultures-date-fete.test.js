const test = require('node:test'), assert = require('node:assert/strict');
const { read } = require('./src-extract.cjs');
/* Contrôle de la police (19 nov. 2026) : page d'un pays, pastille de la date de la fête, « September » coupé en
   « Septembe / r » (colonne de 78 px, overflow-wrap:anywhere). Aucun mot n'est coupé en son milieu : la colonne
   s'élargit juste du nécessaire pour le mot le plus long (« généralement », « Wednesday », « septiembre »). */
test('date de la fête : jamais de coupe au milieu d’un mot, colonne de 78 px au moins, élargie au besoin', () => {
  const css = read('cultures.css');
  const b = css.match(/\n\.cult-when b\{[^}]*\}/)[0];
  assert.doesNotMatch(b, /anywhere|break-all|break-word/);
  assert.match(b, /overflow-wrap:normal;word-break:normal;hyphens:none/);
  assert.match(css, /\n\.cult-fete\{grid-template-columns:fit-content\(78px\) 1fr\}/);
  /* 66 px de texte + 2 × 6 px de marge = 78 px au moins ; pas de min-width sur la pastille (elle bloquerait l'élargissement). */
  assert.match(b, /\{min-width:66px;/);
  assert.doesNotMatch(css.match(/\n\.cult-when\{[^}]*\}/)[0], /min-width/);
});

test('date de la fête : les mots des trois langues tiennent dans la colonne élargie (au plus 120 px)', () => {
  /* Avances de Figtree 800 (millièmes de corps), lettres des dates ; un mot = segment sans espace ni coupure après « - », « – », « / ». */
  const longest = {};
  for (const lang of ['fr', 'en', 'es']) {
    const c = JSON.parse(read(`assets/data/cultures.${lang}.json`)).countries;
    for (const v of Object.values(c)) {
      const when = v.fete && v.fete.when; if (!when) continue;
      for (const w of when.split(/(?<=[-–/])|\s+/).filter(Boolean)) if (!longest[lang] || w.length > longest[lang].length) longest[lang] = w;
    }
  }
  /* 13 px × 0,65 em par lettre au plus (Figtree 800 bas de casse : 0,55 en moyenne) + 12 px de marge intérieure. */
  for (const [lang, w] of Object.entries(longest)) assert.ok(w.length * 13 * 0.65 + 12 <= 120, `${lang} : « ${w} »`);
});
