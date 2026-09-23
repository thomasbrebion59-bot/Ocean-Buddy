# Vérification de la version iPhone 1.1.0 (2) — 23 septembre 2026

- Catalogue : 280 identifiants uniques, photographies locales avec crédits et vignettes. L’audit ne trouve aucun fichier ou crédit manquant ; 16 originaux panoramiques ont encore un côté inférieur à 600 px et demandent une meilleure photo du même lieu avant de prétendre à une galerie haute définition partout.
- Parcours Web contrôlés au format iPhone 390 × 844 et sur ordinateur : exploration, filtres cohérents entre liste et carte, fiche, galerie, création d’un voyage privé et état de la communauté. La galerie et le relief ont aussi été vérifiés au clavier, avec retour du focus et mouvement réduit.
- Tests : `npm test` réussit, 72 sur 72. L’audit des dépendances de production ne signale aucune vulnérabilité. Construction statique Netlify et assemblage de la fonction communautaire réussis.
- Contenu iPhone : `npm run sync:mobile` réussit ; 28 scripts locaux, polices, photographies, Leaflet et moteur MapLibre inclus dans l’application. Le relief 3D demande toujours des tuiles réseau ; le catalogue et le carnet local restent accessibles sans ces services.
- Signature : certificat Apple Distribution et profil « Ocean Buddy App Store » de l’équipe `P4BWG6BLVL` présents ; profil valable jusqu’au 14 septembre 2027. La signature automatique cherchait un profil de développement lié à un appareil et a échoué. Une archive Release arm64 a ensuite été créée avec la signature manuelle de distribution : `mobile/build/OceanBuddy-1.1.0.xcarchive`, version 1.1.0 (2). `codesign --verify --deep --strict` confirme que l’application est valide sur ce Mac.
- Export local App Store Connect réussi : `mobile/build/OceanBuddy-1.1.0-export/App.ipa` (environ 111 Mo). Ces fichiers sont ignorés par Git et ne sont pas publiés sur GitHub Pages. Aucun chargement à App Store Connect n’a été effectué.

## À terminer avant soumission

- App Store Connect n’était pas connecté dans le navigateur de vérification : l’existence et l’état de la fiche, les déclarations de confidentialité, les informations de revue et les captures ne peuvent pas être confirmés à distance.
- Les captures conservées dans `mobile/store/screenshots/` datent d’une version précédente. Les refaire depuis le binaire final sur iPhone et iPad, en ne montrant que les fonctions réellement actives.
- La communauté reste désactivée tant que Supabase, le SMTP Brevo et la fonction Netlify n’ont pas été configurés puis testés de bout en bout avec un compte membre et le compte propriétaire. Les règles, la modération, le signalement, le blocage et la suppression de compte sont implémentés et testés au niveau du code.
- Tester ce binaire sur un iPhone physique : connexion et interruptions, localisation avec consentement, clavier, partage, conservation et suppression des données, retour au premier plan, réseau lent et panne complète. Répéter la revue avec VoiceOver sur l’appareil.
- Revoir les 168 textes historiques marqués non vérifiés et les 16 photos panoramiques avant d’affirmer que toutes les fiches sont intégralement documentées et en haute définition.

La soumission définitive au Store est une étape distincte. L’archive et l’IPA attestent de la compilation et de l’export local, pas d’une acceptation par Apple.
