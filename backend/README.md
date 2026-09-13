# Connexion de Poulpy à une IA

Le serveur est prêt pour Netlify Functions et l’API Responses d’OpenAI. Le site principal reste publié sur GitHub Pages. Aucune clé ne doit être ajoutée au dépôt ou au navigateur.

Hébergement existant repéré : `exquisite-choux-61c0d9.netlify.app`, équipe Ocean Buddy. Au contrôle du 13 septembre 2026, le compte Netlify affichait un forfait Free de 300 crédits mensuels, sans dépassement payant et sans carte bancaire enregistrée. Aucune variable manuelle n’était configurée. L’AI Gateway Netlify peut fournir automatiquement les identifiants et l’URL OpenAI sans compte OpenAI séparé.

Service activé le 13 septembre 2026 sur le projet existant. L’état `enabled:true`, une question générale, une relance et des recommandations de fiches ont été vérifiés sur le serveur réel, puis dans le navigateur. `poulpy-config.js` utilise l’URL de production ci-dessous. Les identifiants restent injectés côté serveur par AI Gateway.

## Configuration et déploiement

1. Autoriser Netlify CLI sur le compte propriétaire, puis utiliser le projet existant. Ne pas créer de projet, souscrire de forfait ou activer de recharge automatique pour cette installation.
2. Laisser AI Gateway injecter `OPENAI_API_KEY` et `OPENAI_BASE_URL` dans les fonctions. Le serveur utilise alors `gpt-4.1-mini`, sauf remplacement explicite par `OPENAI_MODEL`. Les crédits IA partagent le quota Netlify du site ; épuiser ce quota peut interrompre le service jusqu’à son renouvellement. Ne pas exposer les variables injectées dans les journaux ou dans le navigateur.
3. Déployer le dépôt avec Netlify CLI ou un build Git : un simple dépôt des fichiers statiques via Netlify Drop ne déploie pas cette fonction. `netlify.toml` construit le catalogue de 280 destinations et le dossier statique `.netlify/publish`. Le serveur autorise les origines GitHub Pages et du projet Netlify existant.
4. Vérifier que `GET https://exquisite-choux-61c0d9.netlify.app/.netlify/functions/poulpy` répond avec `enabled:true`, puis tester une conversation et ses suivis.
5. Mettre cette URL dans `poulpy-config.js`, versionner les ressources, vérifier le navigateur et publier sur GitHub.

Le client transmet uniquement la question (3 000 caractères maximum), les dix derniers messages limités à 900 caractères chacun, l’activité, le niveau choisi et l’identifiant du spot consulté. Il ne transmet ni géolocalisation personnelle, ni notes privées, ni itinéraires sauvegardés. Le catalogue est chargé côté serveur. Les sources et les repères peuvent être employés par l’assistant ; il ne dispose pas de recherche web en direct. Aucun message n’est enregistré par le serveur applicatif. `store:false` désactive le stockage des réponses pour récupération via l’API ; les politiques du fournisseur s’appliquent toujours.

Le serveur limite chaque requête et réponse, masque les erreurs du fournisseur, autorise seulement les origines configurées dans les navigateurs et configure une limitation Netlify de six appels par minute et par IP/domaine. CORS ne constitue pas une authentification. Vérifier la disponibilité effective de la limitation Netlify et les plafonds du compte avant d’ouvrir le service au public. `POULPY_ENABLED=false` coupe les appels au fournisseur.

Pour utiliser ultérieurement un compte OpenAI API distinct, configurer une clé projet côté serveur, `OPENAI_MODEL` et `POULPY_ENABLED=true`, puis retirer `OPENAI_BASE_URL` du gateway. Cette option possède sa propre facturation et demande une vérification préalable du compte et de ses limites.

Références : [OpenAI — génération de texte](https://developers.openai.com/api/docs/guides/text), [Netlify Functions](https://docs.netlify.com/build/functions/overview/), [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/), [limitation des appels](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).
