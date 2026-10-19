# Poulpy : réponses sur l’appareil

Depuis le 19 octobre 2026, Poulpy n’est plus connecté à aucune IA ni à aucun service en ligne. Il répond uniquement avec le guide intégré à l’application (`poulpy-knowledge.js` et `poulpyReply` dans `app.js`), sur l’appareil, à partir du contenu d’Ocean Buddy. `poulpy-config.js` ne contient plus d’adresse de service.

Il n’y a plus aucun serveur ni fonction distante (Netlify a été retiré). Les anciennes apps 1.3.x qui appelaient encore la fonction Poulpy retombent sur leur guide intégré.
