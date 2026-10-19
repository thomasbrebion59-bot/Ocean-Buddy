# Poulpy : réponses sur l’appareil

Depuis le 19 octobre 2026, Poulpy n’est plus connecté à aucune IA ni à aucun service en ligne. Il répond uniquement avec le guide intégré à l’application (`poulpy-knowledge.js` et `poulpyReply` dans `app.js`), sur l’appareil, à partir du contenu d’Ocean Buddy. `poulpy-config.js` ne contient plus d’adresse de service.

La fonction Netlify `netlify/functions/poulpy.mjs` reste en place uniquement pour les apps 1.3.x qui n’ont pas encore reçu le nouveau code par OTA. Elle ne contacte aucun service extérieur :

- `GET` répond `{"enabled":false}` : l’ancienne app reste sur son guide intégré ;
- `POST` répond `503 {"error":"not_configured"}` : l’ancienne app affiche son bouton « Consulter le guide intégré », qui répond sur l’appareil ;
- les en-têtes CORS des origines GitHub Pages, Netlify et Capacitor (`capacitor://oceanbuddy.localhost`, `https://oceanbuddy.localhost`) sont conservés pour que ces réponses restent lisibles ; `POULPY_ALLOWED_ORIGINS` peut toujours remplacer cette liste.

Variables Netlify devenues inutiles, à supprimer : `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `POULPY_ENABLED`, `POULPY_WEB_SEARCH` (et désactiver Netlify AI Gateway pour ce site s’il l’injecte automatiquement).

Quand plus aucune app 1.3.x antérieure à cette mise à jour n’est en service, la fonction peut être supprimée.
