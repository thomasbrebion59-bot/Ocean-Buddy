# Vérification de la version iPhone 1.1.0 (2) — 23 septembre 2026

- Catalogue : 280 identifiants uniques, 278 photographies locales avec crédits et vignettes. Les photos erronées de Tamarindo et The Pass ont été retirées et leur absence est signalée. L’audit ne trouve aucun fichier ni crédit manquant parmi les photos publiées ; 14 originaux panoramiques ont encore un côté inférieur à 600 px.
- Parcours Web contrôlés au format iPhone 390 × 844 et sur ordinateur : exploration, filtres cohérents entre liste et carte, fiche, galerie, création d’un voyage privé et état de la communauté. La galerie et le relief ont aussi été vérifiés au clavier, avec retour du focus et mouvement réduit.
- Tests : `npm test` réussit, 73 sur 73. L’audit des dépendances de production ne signale aucune vulnérabilité. Construction statique Netlify et assemblage de la fonction communautaire réussis.
- Contenu iPhone : `npm run sync:mobile` réussit ; 29 scripts locaux, polices, photographies, Leaflet et moteur MapLibre inclus dans l’application. Le relief 3D demande toujours des tuiles réseau ; le catalogue et le carnet local restent accessibles sans ces services.
- Signature : certificat Apple Distribution et profil « Ocean Buddy App Store » de l’équipe `P4BWG6BLVL` présents ; profil valable jusqu’au 14 septembre 2027. La version finale 1.1.0 (2) a été archivée hors du dossier synchronisé, car les attributs Finder ajoutés dans ce dossier faisaient échouer la signature. L’archive vérifiée est conservée dans `mobile/build/OceanBuddy-1.1.0-final.xcarchive.zip` ; `codesign --verify --deep --strict` a réussi avant compression.
- Export local App Store Connect réussi : `mobile/build/OceanBuddy-1.1.0-final-export/App.ipa` (environ 110 Mo). Son `index.html` correspond exactement au paquet Web mobile final ; les deux photos retirées sont absentes de l’IPA. Ces fichiers sont ignorés par Git et ne sont pas publiés sur GitHub Pages. Aucun chargement à App Store Connect n’a été effectué.

## À terminer avant soumission

- App Store Connect n’était pas connecté dans le navigateur de vérification : l’existence et l’état de la fiche, les déclarations de confidentialité, les informations de revue et les captures ne peuvent pas être confirmés à distance.
- Les captures de `mobile/store/screenshots/` doivent être revues sur iPhone et iPad depuis le binaire final, en ne montrant que les fonctions réellement actives.
- La communauté reste désactivée tant que Supabase, le SMTP Brevo et la fonction Netlify n’ont pas été configurés puis testés de bout en bout avec un compte membre et le compte propriétaire. Les règles, la modération, le signalement, le blocage et la suppression de compte sont implémentés et testés au niveau du code.
- Tester ce binaire sur un iPhone physique : connexion et interruptions, localisation avec consentement, clavier, partage, conservation et suppression des données, retour au premier plan, réseau lent et panne complète. Répéter la revue avec VoiceOver sur l’appareil.
- Revoir les 168 textes historiques marqués non vérifiés, fournir des images du lieu pour les deux fiches sans photo et remplacer les 14 panoramas restants avant d’affirmer que toutes les fiches sont intégralement documentées et en haute définition.

La soumission définitive au Store est une étape distincte. L’archive et l’IPA attestent de la compilation et de l’export local, pas d’une acceptation par Apple.
