# Ocean Buddy sur iOS et Android

Version du projet : 1.3.0 (build 202610071). Identifiant : `io.github.thomasbrebion59bot.oceanbuddy`.

Capacitor embarque le catalogue, les photographies, les polices, Leaflet et le moteur de relief dans l’application. La météo, les tuiles cartographiques et la communauté nécessitent internet ; Poulpy répond hors connexion. La galerie, le son et le relief restent facultatifs. Les données du site et celles de chaque installation mobile sont séparées.

## Construire

```sh
npm ci
npm run sync:mobile
npm run open:ios
```

Node 22+ et Xcode 26+ sont requis. La première version native cible l’iPhone avec iOS 16.4 minimum (dialogues et API JavaScript utilisées par l’interface). Le projet Xcode utilise Swift Package Manager ; CocoaPods n’est pas nécessaire. Les dépendances sont verrouillées dans package-lock.json et le fichier Package.resolved généré par Xcode. Ne jamais copier `.tools`, les identifiants de connexion ou les fichiers `.env` dans une application distribuée.

`mobile/www` et les copies natives `public` sont générées et ignorées par Git. Relancer `npm run sync:mobile` après toute modification du site. Les visuels de lancement et l’icône utilisent le Poulpy corrigé déjà validé dans le projet.

## Mises à jour directes (sans App Store)

Depuis la 1.2.0, l’app reçoit les nouveautés du site sans repasser par Apple (`@capgo/capacitor-updater`, en mode manuel, sans serveur Capgo ni statistiques) :

1. au démarrage et au retour dans l’app (30 min minimum entre deux vérifications), elle lit `app-update/latest.json` sur GitHub Pages par une requête native ;
2. si le contenu est plus récent, elle télécharge seulement les fichiers absents de l’app installée (`app-update/files/<sha256>`, chaque fichier vérifié par son empreinte) et réutilise tout le reste ;
3. une fenêtre Poulpy propose « Mettre à jour maintenant » ; sinon, la nouvelle version s’installe dès que l’app passe en arrière-plan ;
4. si la nouvelle version ne démarre pas (pas d’appel à `notifyAppReady` en 15 s), l’app revient seule à la version précédente.

Publier une mise à jour pour les téléphones, après une modification vérifiée du site :

```sh
node scripts/publish-app-update.cjs   # construit mobile/www, remplit app-update/
git add app-update && git commit && git push origin HEAD:main
```

Seul le contenu web peut passer ainsi (HTML, CSS, JS, images, données). Un nouveau plugin, une autorisation ou un réglage natif exigent une version App Store. Pour chaque build envoyé à Apple, enregistrer d’abord sa référence avec `node scripts/publish-app-update.cjs --baseline <version>` (dans `mobile/ota-baselines/`), puis `npx cap sync` et archiver avec ce même `mobile/www`. Si le build ne change pas la partie native (mêmes plugins, même `capacitor.config.json`), ajouter `--same-shell <version précédente>` : les apps de cette version continuent de recevoir les mises à jour directes (cas de la 1.3.1, même coque que la 1.3.0). Les apps plus anciennes que `--native-min` (par défaut la dernière coque native) reçoivent plutôt une fenêtre « Ouvrir l’App Store » dès que l’App Store propose une version plus récente.

## Garde-fou du démarrage (`npm run check:boot`)

Sur l’iPhone, le chargeur natif injecte les scripts un par un : tout état intermédiaire est visible (onboarding qui clignote, ancien accueil, fil reconstruit, sauts de mise en page). `scripts/check-boot.mjs` rejoue ce démarrage dans Chrome headless (iPhone 390×844, CPU ralenti ×6, Chrome requis ; variable `CHROME` pour un autre chemin) et échoue (code 1) si le contrat de démarrage n’est pas respecté :

- `html.ob-booting` puis `#obBoot` (rideau) et `window.OceanBoot` `{t0, lifted, liftedAt, reason, ready()}` ; événement `ocean:home-ready` ; levée au plus tard 4 s après `t0` ;
- après la levée, pour un utilisateur existant : pas d’onboarding, pas d’ancien accueil (`.home-intro`, « Prends le large », bouton trophée `.nav .center`), barre d’onglets complète, `.hf-feed` jamais reconstruit, aucune écriture de défilement vertical, CLS ≤ 0,02 pendant 6 s, page jamais vide, pas de toast « Bon retour » sous le rideau, aucune erreur JS ; un nouvel utilisateur voit l’onboarding.

Scénarios : `native-returning`, `native-restore` (rechargement avec `history.state`, comme après une mise à jour), `native-new`, `web-returning`, `native-returning-wide` (430×932). Options : `--scenario <nom>` (répétable), `--throttle <n>`, `--verbose`, `--keep`, `--no-build`, `--www <dossier>`, `--self-test` (vérifie la logique sur deux pages jetables). Rapport, captures et chronologie : `out/boot-check/<scénario>/` (ignoré par Git). La construction écrit toujours dans `mobile/www`.

`node scripts/publish-app-update.cjs` (et `--baseline`) lance ce contrôle sur le build qu’il vient de construire et refuse de publier s’il échoue ; il n’y a pas d’option pour l’ignorer. Il n’est pas dans `npm test` (Chrome requis, ~3 min).

## Fonctions natives

- Localisation sur demande pour les spots proches, sans suivi en arrière-plan ; refuser ne bloque pas le catalogue.
- Copie des données `oceanbuddy_*` dans les préférences natives et restauration au démarrage, sans remplacer les données déjà présentes.
- Export JSON d’un voyage via la feuille de partage du téléphone.
- Ouverture des liens externes dans le navigateur du système et bouton Retour Android.
- Poulpy répond sur l’appareil avec le guide intégré : aucun message n’est envoyé, aucune IA n’est utilisée.
- Effacement des données locales dans les réglages, avec confirmation.
- Lecture publique des contributions approuvées lorsque le service communautaire est disponible. Un courriel vérifié est nécessaire pour publier ; chaque contribution reste en attente de modération. Les anciens messages locaux ne sont jamais transférés automatiquement.
- Création d’une copie distincte d’un voyage pour la communauté, après aperçu et choix explicite de chaque détail privé.

## Avant l’envoi à Apple

L’application n’a pas encore été publiée sur un store. Une archive 1.1.0 (2) antérieure a été signée et exportée localement, mais elle ne contient pas les derniers médias et correctifs ; ne pas l’envoyer à Apple. La reconstruction actuelle est bloquée par le service CoreSimulator de ce Mac ; voir `store/verification.md`. Aucun chargement sur App Store Connect ni test sur iPhone physique n’est confirmé.

1. Vérifier l’adhésion Apple Developer Program, l’équipe et l’état réel de l’application dans App Store Connect avec le compte titulaire.
2. Vérifier dans App Store Connect que l’identifiant de l’archive signée correspond bien à la fiche de l’app.
3. Vérifier les pages `privacy.html` et `support.html` publiées avec le contact public autorisé par le titulaire : oceanbuddy.contact@gmail.com.
4. Configurer puis tester Supabase, Netlify et l’envoi des codes par Brevo ; vérifier la modération humaine, les signalements, le blocage et la suppression de compte avant de rendre la communauté disponible dans l’app publiée.
5. Contrôler les déclarations de confidentialité dans `store/app-store-fr.md`, choisir les pays de distribution et compléter les déclarations de statut du vendeur avec les informations exactes du titulaire.
6. Tester sur un iPhone physique : localisation refusée/autorisée, export, relance, hors connexion, suppression, clavier, lecteur d’écran et interruption du son ; capturer les écrans définitifs depuis la version signée.
7. Envoyer l’IPA vérifiée à App Store Connect lorsque la fiche, la confidentialité, les captures et la communauté seront prêtes. Passer par TestFlight avant la soumission publique.

## Android

Le projet natif se trouve dans `android/` : `npm run open:android`. Android Studio, un JDK adapté et le SDK Android 36 sont nécessaires ; ils n’étaient pas installés sur ce Mac au début de cette préparation. Le projet Android n’a pas encore été compilé ni signé. Un compte Google Play Console est aussi nécessaire. Garder la clé de signature hors du dépôt et utiliser Play App Signing.

## Confidentialité et licences

Le manifeste iOS déclare les accès UserDefaults (CA92.1) et FileTimestamp (C617.1) utilisés par Preferences et Filesystem. Il déclare l’adresse e-mail, l’identifiant de compte et les contributions liées au membre lorsque la communauté est activée. Poulpy ne transmet plus aucun contenu : vérifier à la prochaine version App Store que les déclarations ne citent plus l’IA. Aucun suivi publicitaire n’est implémenté. Vérifier les déclarations App Store Connect contre le comportement du binaire final et les prestataires réellement configurés. La désactivation de la sauvegarde Android par l’app ne contrôle pas tous les mécanismes de transfert gérés par les fabricants.

Les photographies sont créditées dans `photos.html` et les licences de Leaflet et des polices sont copiées dans le bundle. L’app ne fait ni réservation, ni navigation maritime, ni calcul d’ordinateur de plongée.
