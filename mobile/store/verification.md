# Vérification de la préparation mobile — 13 septembre 2026

- Construction du contenu embarqué : réussie ; 22 scripts locaux, polices et moteur Leaflet inclus ; aucun fichier référencé manquant ni dossier de secrets dans `mobile/www`.
- Tests JavaScript : 52 réussis, 0 échec. Ils couvrent notamment le consentement IA, l’absence d’envoi en mode guide, le contexte transmis, les origines natives autorisées, la restauration et l’effacement de la copie native.
- Dépendances de production : `npm audit --omit=dev` n’a signalé aucune vulnérabilité lors de cette préparation.
- Compilation Xcode Debug pour simulateur : réussie avec SDK iOS 26.5 ; application 1.0.0 (1), cible minimale iOS 16.4.
- Archive Xcode Release pour iPhone/iPad (arm64) : réussie, version 1.0.0 (1). L’archive locale `mobile/build/OceanBuddy-unsigned.xcarchive` est volontairement non signée ; elle ne peut pas être envoyée telle quelle à l’App Store.
- Simulateur iPhone 17 Pro : lancement de l’application, affichage de Poulpy, du premier écran et de Voyages observés. Le premier démarrage du simulateur a été particulièrement lent sur ce Mac. Les accès Preferences et StatusBar ont répondu depuis le code natif.
- Navigateur de test séparé : parcours de première ouverture, choix plongée/niveau, continents, ouverture de Poulpy, consentement et réponse du guide intégré vérifiés. Pages de confidentialité et d’assistance inspectées sur ordinateur et au format téléphone.
- Projet Android créé et configuré, sans compilation : Android Studio et le SDK ne sont pas installés sur ce Mac.

## Ce que ces vérifications ne remplacent pas

Le binaire n’est pas signé pour la distribution et n’a pas été envoyé à App Store Connect. La version finale doit encore être testée sur un iPhone physique, notamment pour la localisation, le partage réel de fichiers, les interruptions, la persistance après fermeture, le clavier et le fonctionnement hors connexion. Les captures App Store doivent être faites depuis ce binaire final.

La publication Apple reste conditionnée à l’activation de l’adhésion Apple Developer Program, puis à la configuration de l’équipe et de la signature de distribution dans Xcode. Google Play nécessite aussi un compte développeur, une compilation signée et ses vérifications propres.
