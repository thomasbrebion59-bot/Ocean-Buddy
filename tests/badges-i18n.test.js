const test = require('node:test'), assert = require('node:assert/strict');
const { i18nContext, read } = require('./src-extract.cjs');
const badges = read('badges.js');
const T = l => i18nContext(l, {}).obT;
/* jeu-poulpy-langues-7 : fiche « Expert » du quiz, guillemets et thème cohérents. */
test('badges.js : la consigne du trophée Expert est un gabarit complet', () => {
  assert.ok(badges.includes('`Fais un sans-faute au quiz « ${q.label} ».`'));
});
test('consigne Expert : thème traduit, guillemets cohérents', () => {
  const en = T('en')('Fais un sans-faute au quiz « Faune ».'), es = T('es')('Fais un sans-faute au quiz « Faune ».');
  assert.equal(en, 'Get every question right in the “Wildlife” quiz.');
  assert.equal(es, 'Consigue un pleno en el quiz «Fauna».');
  assert.doesNotMatch(en, /[«»]/);
});
/* jeu-poulpy-langues-8 : aria-label des trophées entièrement traduits. */
test('badges.js : aria-label construits par gabarits complets', () => {
  assert.ok(badges.includes('`${b.name} — trophée ${b.tierLabel} obtenu`'));
  assert.ok(badges.includes('`${b.name} — verrouillé. ${b.how}`'));
  assert.ok(badges.includes('`Médaille ${b.name} (verrouillée). Fais-la pivoter du doigt.`'));
  assert.ok(badges.includes('`Médaille ${b.name}. Fais-la pivoter du doigt.`'));
});
test('aria-label : aucun mot français ne reste en en/es', () => {
  for (const l of ['en', 'es']) {
    const t = T(l);
    for (const s of ['Première vague — trophée Commun obtenu', 'Expert Faune — trophée Épique obtenu', 'Médaille Première vague (verrouillée). Fais-la pivoter du doigt.',
      'Médaille Première vague. Fais-la pivoter du doigt.', 'Première vague — verrouillé. Fais un sans-faute au quiz « Faune ».']) {
      assert.doesNotMatch(t(s), /troph[ée]e |Commun|Épique|obtenu|verrouill|Médaille|pivoter|sans-faute/, l + ' : ' + t(s));
    }
  }
  assert.equal(T('en')('Expert Faune — trophée Épique obtenu'), 'Expert Wildlife — Epic trophy earned');
});
