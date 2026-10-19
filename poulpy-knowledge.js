/* Built-in knowledge layer: Poulpy's answers come from Ocean Buddy's own content, on the device. */
(() => {
  'use strict';
  const replies = [
    /* Salutations, activités et faune : le guide de app.js (poulpyReply) répond plus précisément. */
    [/(qui es-tu|tu es qui|vraie ia|intelligence artificielle|que sais-tu faire|tu sais faire quoi)/i, 'Je suis <b>Poulpy</b>, le guide d’Ocean Buddy. Je réponds à partir des fiches de l’application : choisir un spot, préparer un voyage, lire une météo, progresser dans une activité, découvrir la faune et rester prudent à l’eau.'],
    [/(voyage|séjour|sejour|itinéraire|itineraire|week.?end|vacances)/i, 'Pour préparer un voyage, réunis la destination ou les spots visés, tes dates, ton activité, ton niveau et ton budget indicatif. Dans <b>Mes voyages</b>, organise ensuite les étapes, le matériel, les conditions à surveiller et ta checklist. Ocean Buddy ne réserve rien à ta place.'],
    [/(marée|maree|courant|baïne|baine|rip|danger|sécurité|securite)/i, 'À l’eau, les conditions réelles priment toujours : vérifie les horaires de marée, le courant, le vent, les drapeaux et les consignes locales. Une baïne peut t’emporter au large : reste calme, signale-toi, nage parallèlement à la plage pour sortir du flux, puis rejoins la zone surveillée.'],
    [/(météo|meteo|prévision|prevision|vent|uv|houle|vague|conditions)/i, 'Pour lire une session, regarde ensemble la houle (hauteur, direction, période), le vent, la marée, la visibilité, la température et les UV. Une prévision aide à décider, mais ne remplace jamais l’observation sur place ni les consignes des sauveteurs.'],
    [/(matériel|materiel|planche|combinaison|combi|équipement|equipement)/i, 'Le meilleur matériel dépend de l’activité, de ton niveau, de la température et de l’état de la mer. Pour débuter, privilégie un équipement stable, adapté à ta morphologie, et demande conseil à une école ou un professionnel local.'],
    [/(écologie|ecologie|plastique|déchet|dechet|pollution)/i, 'Pour protéger le spot : garde tes distances avec la faune, ne touche pas les coraux, rapporte tes déchets, évite le plastique à usage unique et respecte les zones protégées. Les petits gestes répétés comptent vraiment.'],
    [/(aide|question|sujet|n’importe|n importe|tout|fonctionne)/i, 'Je peux parler des spots, des activités nautiques, de la météo, des marées, de la sécurité, du matériel et de la faune. Essaie une question précise, par exemple : « Quel spot choisir pour débuter demain ? »']
  ];
  const normalize = value => String(value || '').trim();
  function reply(question) {
    const text = normalize(question);
    for (const [pattern, html] of replies) if (pattern.test(text)) return {html};
    return null;
  }
  window.PoulpyKnowledge = {
    version: 1,
    capabilities: ['spots et activités', 'voyage', 'météo et marées', 'sécurité', 'matériel', 'faune et écologie'],
    suggestions: [
      ['Choisir un spot', 'Aide-moi à choisir un spot selon mon niveau et les conditions.'],
      ['Préparer un voyage', 'Aide-moi à préparer un voyage au bord de l’océan.'],
      ['Sécurité', 'Quels sont les dangers à vérifier avant d’entrer dans l’eau ?'],
      ['Météo & marées', 'Comment lire la météo, la houle, le vent et les marées ?'],
      ['Faune & écologie', 'Comment observer la faune sans déranger le milieu ?']
    ],
    reply
  };
})();
