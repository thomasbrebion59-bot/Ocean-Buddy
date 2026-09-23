# Ocean Buddy sur iOS et Android

Version du projet : 1.1.0 (build 2). Identifiant : `io.github.thomasbrebion59bot.oceanbuddy`.

Capacitor embarque le catalogue, les photographies, les polices, Leaflet et le moteur de relief dans l’application. La météo, les tuiles cartographiques, Poulpy IA et la communauté nécessitent internet. La galerie, le son et le relief restent facultatifs. Les données du site et celles de chaque installation mobile sont séparées.

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
- Lecture publique des contributions approuvées lorsque le service communautaire est disponible. Un courriel vérifié est nécessaire pour publier ; chaque contribution reste en attente de modération. Les anciens messages locaux ne sont jamais transférés automatiquement.
- Création d’une copie distincte d’un voyage pour la communauté, après aperçu et choix explicite de chaque détail privé.

## Avant l’envoi à Apple

L’application n’a pas encore été publiée sur un store. L’archive 1.1.0 (2) a été signée avec le profil App Store présent sur ce Mac, puis exportée localement en IPA ; voir `store/verification.md`. Aucun chargement sur App Store Connect ni test sur iPhone physique n’est confirmé.

1. Vérifier l’adhésion Apple Developer Program, l’équipe et l’état réel de l’application dans App Store Connect avec le compte titulaire.
2. Vérifier dans App Store Connect que l’identifiant de l’archive signée correspond bien à la fiche de l’app.
3. Vérifier les pages `privacy.html` et `support.html` publiées avec le contact public autorisé par le titulaire : thomas.brebion59@icloud.com.
4. Configurer puis tester Supabase, Netlify et l’envoi des codes par Brevo ; vérifier la modération humaine, les signalements, le blocage et la suppression de compte avant de rendre la communauté disponible dans l’app publiée.
5. Contrôler les déclarations de confidentialité dans `store/app-store-fr.md`, choisir les pays de distribution et compléter les déclarations de statut du vendeur avec les informations exactes du titulaire.
6. Tester sur un iPhone physique : localisation refusée/autorisée, export, relance, hors connexion, suppression, clavier, lecteur d’écran et interruption du son ; capturer les écrans définitifs depuis la version signée.
7. Envoyer l’IPA vérifiée à App Store Connect lorsque la fiche, la confidentialité, les captures et la communauté seront prêtes. Passer par TestFlight avant la soumission publique.

## Android

Le projet natif se trouve dans `android/` : `npm run open:android`. Android Studio, un JDK adapté et le SDK Android 36 sont nécessaires ; ils n’étaient pas installés sur ce Mac au début de cette préparation. Le projet Android n’a pas encore été compilé ni signé. Un compte Google Play Console est aussi nécessaire. Garder la clé de signature hors du dépôt et utiliser Play App Signing.

## Confidentialité et licences

Le manifeste iOS déclare les accès UserDefaults (CA92.1) et FileTimestamp (C617.1) utilisés par Preferences et Filesystem. Il déclare l’adresse e-mail, l’identifiant de compte et les contributions liées au membre lorsque la communauté est activée, ainsi que le contenu envoyé volontairement à l’IA. Aucun suivi publicitaire n’est implémenté. Vérifier les déclarations App Store Connect contre le comportement du binaire final et les prestataires réellement configurés. La désactivation de la sauvegarde Android par l’app ne contrôle pas tous les mécanismes de transfert gérés par les fabricants.

Les photographies sont créditées dans `photos.html` et les licences de Leaflet et des polices sont copiées dans le bundle. L’app ne fait ni réservation, ni navigation maritime, ni calcul d’ordinateur de plongée.
