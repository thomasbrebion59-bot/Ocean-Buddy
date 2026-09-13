# Ocean Buddy sur iOS et Android

Version préparée : 1.0.0 (build 1). Identifiant proposé : `io.github.thomasbrebion59bot.oceanbuddy`.

Le site conserve son interface bleue. Capacitor embarque le catalogue, les photographies, les polices et Leaflet dans l’application. La météo, le fond de carte et Poulpy IA nécessitent internet. Les données du site et celles de chaque installation mobile sont séparées.

## Construire

```sh
npm ci
npm run sync:mobile
npm run open:ios
```

Node 22+ et Xcode 26+ sont requis. La version iOS cible iOS 16.4 minimum (dialogues et API JavaScript utilisées par l’interface). Le projet Xcode utilise Swift Package Manager ; CocoaPods n’est pas nécessaire. Les dépendances sont verrouillées dans package-lock.json et le fichier Package.resolved généré par Xcode. Ne jamais copier `.tools`, les identifiants de connexion ou les fichiers `.env` dans une application distribuée.

`mobile/www` et les copies natives `public` sont générées et ignorées par Git. Relancer `npm run sync:mobile` après toute modification du site. Les visuels de lancement et l’icône utilisent le Poulpy corrigé déjà validé dans le projet.

## Fonctions natives

- Localisation sur demande pour les spots proches, sans suivi en arrière-plan ; refuser ne bloque pas le catalogue.
- Copie des données `oceanbuddy_*` dans les préférences natives et restauration au démarrage, sans remplacer les données déjà présentes.
- Export JSON d’un voyage via la feuille de partage du téléphone.
- Ouverture des liens externes dans le navigateur du système et bouton Retour Android.
- Choix explicite entre guide intégré et IA avant tout envoi de message. Les questions et leur contexte passent par Netlify puis OpenAI ; aucun secret fournisseur n’est présent dans le binaire.
- Effacement des données locales dans les réglages, avec confirmation.

## Avant l’envoi à Apple

L’application n’a pas encore été publiée sur un store. La compilation locale ne vaut ni signature de distribution ni validation d’Apple.

1. Activer l’adhésion Apple Developer Program (le compte actuellement connecté est gratuit), puis ajouter ce compte dans Xcode → Settings → Apple Accounts.
2. Sélectionner la bonne équipe dans Signing & Capabilities ; réserver/vérifier l’identifiant dans App Store Connect avant de signer.
3. Vérifier les pages `privacy.html` et `support.html` publiées avec le contact public autorisé par le titulaire : thomas.brebion59@icloud.com.
4. Contrôler les déclarations de confidentialité dans `store/app-store-fr.md`, choisir les pays de distribution et compléter les déclarations de statut du vendeur avec les informations exactes du titulaire.
5. Tester sur un iPhone physique : localisation refusée/autorisée, export, relance, hors connexion, suppression et changements d’orientation ; capturer les écrans définitifs depuis la version signée.
6. Product → Archive pour appareil iOS, puis Distribute App → App Store Connect. Passer par TestFlight avant la soumission publique.

## Android

Le projet natif se trouve dans `android/` : `npm run open:android`. Android Studio, un JDK adapté et le SDK Android 36 sont nécessaires ; ils n’étaient pas installés sur ce Mac au début de cette préparation. Le projet Android n’a pas encore été compilé ni signé. Un compte Google Play Console est aussi nécessaire. Garder la clé de signature hors du dépôt et utiliser Play App Signing.

## Confidentialité et licences

Le manifeste iOS déclare les accès UserDefaults (CA92.1) et FileTimestamp (C617.1) utilisés par Preferences et Filesystem. Il déclare aussi le contenu envoyé volontairement à l’IA, sans suivi publicitaire. Revoir ces déclarations si un fournisseur, un SDK ou un traitement change. La désactivation de la sauvegarde Android par l’app ne contrôle pas tous les mécanismes de transfert gérés par les fabricants.

Les photographies sont créditées dans `photos.html` et les licences de Leaflet et des polices sont copiées dans le bundle. L’app ne fait ni réservation, ni navigation maritime, ni calcul d’ordinateur de plongée.
