/* Offline knowledge layer: useful answers when Poulpy IA is not connected. */
(() => {
  'use strict';
  const replies = [
    [/(^|\s)(bonjour|salut|coucou|hello|bonsoir)(\s|!|$)/i, 'Salut ! 🐙 Je suis <b>Poulpy IA</b>. Pose-moi une question sur l’océan, un spot, un voyage… ou même un sujet complètement différent.'],
    [/(qui es-tu|tu es qui|vraie ia|intelligence artificielle|que sais-tu faire|tu sais faire quoi)/i, 'Je suis <b>Poulpy IA</b>, le copilote d’Ocean Buddy. Je peux t’aider à comprendre un sujet, choisir un spot, préparer un voyage, lire une météo, progresser dans une activité et rester prudent à l’eau. En mode IA, je peux aussi répondre à beaucoup de questions générales.'],
    [/(voyage|séjour|sejour|itinéraire|itineraire|week.?end|vacances)/i, 'Pour préparer un voyage, donne-moi la destination ou les spots visés, tes dates, ton activité, ton niveau et ton budget indicatif. Je peux ensuite structurer les étapes, le matériel, les conditions à surveiller et une checklist — sans réserver à ta place.'],
    [/(marée|maree|courant|baïne|baine|rip|danger|sécurité|securite)/i, 'À l’eau, les conditions réelles priment toujours : vérifie les horaires de marée, le courant, le vent, les drapeaux et les consignes locales. Une baïne peut t’emporter au large : reste calme, signale-toi, nage parallèlement à la plage pour sortir du flux, puis rejoins la zone surveillée.'],
    [/(météo|meteo|prévision|prevision|vent|uv|houle|vague|conditions)/i, 'Pour lire une session, regarde ensemble la houle (hauteur, direction, période), le vent, la marée, la visibilité, la température et les UV. Une prévision aide à décider, mais ne remplace jamais l’observation sur place ni les consignes des sauveteurs.'],
    [/(matériel|materiel|planche|combinaison|combi|équipement|equipement|paddle|kayak|plongée|plongee)/i, 'Le meilleur matériel dépend de l’activité, de ton niveau, de la température et de l’état de la mer. Pour débuter, privilégie un équipement stable, adapté à ta morphologie, et demande conseil à une école ou un professionnel local.'],
    [/(écologie|ecologie|plastique|déchet|dechet|pollution|faune|animal|tortue|dauphin|corail)/i, 'Pour protéger le spot : garde tes distances avec la faune, ne touche pas les coraux, rapporte tes déchets, évite le plastique à usage unique et respecte les zones protégées. Les petits gestes répétés comptent vraiment.'],
    [/(aide|question|sujet|n’importe|n importe|tout|fonctionne)/i, 'Je peux parler des spots, activités nautiques, météo et sécurité, mais aussi t’aider à apprendre, comparer des options ou organiser un projet. Essaie une question précise, par exemple : « Quel spot choisir pour débuter demain ? »']
  ];
  const normalize = value => String(value || '').trim();
  function reply(question) {
    const text = normalize(question);
    for (const [pattern, html] of replies) if (pattern.test(text)) return {html};
    return null;
  }
  window.PoulpyKnowledge = {
    version: 1,
    capabilities: ['questions générales', 'spots et activités', 'voyage', 'météo et marées', 'sécurité', 'matériel', 'faune et écologie'],
    suggestions: [
      ['Question libre', 'Explique-moi un sujet comme si je débutais.'],
      ['Choisir un spot', 'Aide-moi à choisir un spot selon mon niveau et les conditions.'],
      ['Préparer un voyage', 'Aide-moi à préparer un voyage au bord de l’océan.'],
      ['Sécurité', 'Quels sont les dangers à vérifier avant d’entrer dans l’eau ?'],
      ['Météo & marées', 'Comment lire la météo, la houle, le vent et les marées ?'],
      ['Faune & écologie', 'Comment observer la faune sans déranger le milieu ?']
    ],
    reply
  };
})();
