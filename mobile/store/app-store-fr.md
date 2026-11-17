# Fiche App Store — brouillon de soumission

État : textes préparés le 17 nov. 2026 pour la version 1.5.0 (build 202611171). Rien n’est envoyé à App Store Connect : l’archive signée, l’envoi du build, le questionnaire de confidentialité et la soumission restent à faire (voir `A-FAIRE-THOMAS-1.5.0.md` dans le dossier `comptes` d’Ocean-Buddy-orga-docs). `scripts/asc-release.mjs` lit ce fichier pour la description, les mots-clés et le texte promotionnel en français, `localizations/en.json` et `es.json` pour l’anglais et l’espagnol, et contient lui-même « Nouveautés de cette version » (FR, EN, ES). Garder les trois langues alignées à chaque changement.

- Nom : Ocean Buddy
- Sous-titre : Spots nautiques et voyages
- Langue principale : français
- Catégorie suggérée : Voyages ; secondaire Sports
- Version prévue : 1.5.0 ; build 202611171 (date AAAAMMJJ + rang du jour)
- Bundle ID proposé : io.github.thomasbrebion59bot.oceanbuddy
- SKU proposé : OCEANBUDDY-IOS-001
- Mots-clés : surf,plongée,snorkeling,paddle,kayak,voyage,océan,spots,itinéraire,marée
- Texte promotionnel : Explore plus de 700 spots, découvre les cultures de 118 pays, prépare ton prochain voyage et garde tes favoris et tes notes au même endroit.
- Site : https://oceanbuddy.app/
- Assistance : https://oceanbuddy.app/support.html
- Confidentialité : https://oceanbuddy.app/privacy.html
- Contact public autorisé : oceanbuddy.contact@gmail.com
- Prix : gratuite ; l’application ne contient pas d’achat intégré.
- Disponibilité/pays : tous les territoires proposés par App Store Connect, sous réserve des obligations réglementaires du compte.

## Description

Ton prochain départ commence avec Ocean Buddy.

Explore plus de 700 spots pour le surf, la plongée, le snorkeling, le paddle, le kayak et d’autres activités nautiques. Choisis ton activité, parcours les régions et découvre chaque destination en images (photographies et, à défaut, illustrations signalées), des repères pratiques et une carte par activité. Les informations encore en cours de vérification sont signalées.

PRÉPARE TON VOYAGE
Crée ton itinéraire, ajoute des étapes, organise les dates et garde tes notes au même endroit. Enregistre tes favoris et partage une copie de ton voyage.

PRENDS LE TEMPS DE DÉCOUVRIR
Fais tourner la planète d’Explorer et plonge vers le spot qui t’attire. Ouvre les galeries immersives et retrouve les caractéristiques du lieu : type de pratique, repères de niveau, accès et points d’attention. Active, si tu le souhaites, une ambiance sonore et un relief terrestre léger. Les conditions météo datées complètent ta préparation lorsque tu es connecté.

VOYAGE À TRAVERS LES CULTURES
Chacun des 118 pays a sa page : on y trouve des mots de la langue locale, un plat à goûter, un bon geste à adopter, des traditions de la mer et des fêtes, avec la source de chaque fait. Chaque jour, un mot du jour à deviner : trouve dans quel pays on le dit et gagne son tampon. Ouvrir la page d’un pays te donne aussi son tampon.

UN COMPTE, SI TU VEUX
Le compte est gratuit et facultatif : l’app reste entièrement utilisable sans. Avec ton adresse e-mail (un code t’est envoyé, sans mot de passe), retrouve tes favoris, tes voyages, tes notes et ta progression sur un autre appareil. Tu peux tout exporter ou supprimer ton compte depuis les Réglages. Réservé aux personnes de 15 ans et plus.

FAIS CONNAISSANCE AVEC POULPY
Poulpy t’accompagne dans l’exploration : il répond à tes questions directement dans l’app, à partir des fiches et des guides d’Ocean Buddy, même sans connexion. Ses conseils ne remplacent pas les informations locales.

GARDE TON CARNET AVEC TOI
Le catalogue et les photos embarquées restent consultables sans connexion. Sans compte, tes favoris, voyages et notes restent sur ton appareil. La météo, les tuiles de la carte et le compte nécessitent internet.

Ocean Buddy aide à préparer une sortie. Les conditions réelles, les consignes locales et ton encadrement priment toujours. L’app ne réserve pas de prestations et ne remplace ni les qualifications nécessaires, ni un outil de navigation maritime ou de plongée.

## Nouveautés de la version 1.5.0 (copie ; le texte envoyé est dans `scripts/asc-release.mjs`)

Voyage avant même de partir : découvre les cultures de 118 pays. Chaque pays a sa page, un mot du jour à deviner et des tampons à collectionner. Dans Explorer, la planète plonge vers le spot que tu touches. Les fiches de spots sont plus claires : moins de texte, mieux rangées. Et si tu le souhaites, crée un compte gratuit pour retrouver tes favoris et tes voyages sur un autre appareil.

## Notes pour l’équipe de vérification

À coller dans « Notes » de la version 1.5.0 (FR et EN complets dans `A-FAIRE-THOMAS-1.5.0.md`, section 2).

Le compte est facultatif : l’app est entièrement utilisable sans compte (bouton « Plus tard » au premier lancement). Connexion sans mot de passe par un code à 6 chiffres envoyé par e-mail : saisissez n’importe quelle adresse que vous consultez. Aucune connexion tierce (ni Google ni Facebook), donc Sign in with Apple n’est pas requis (règle 4.8). Suppression du compte dans l’app une fois connecté : onglet Profil, Réglages, section « Mon compte et sauvegarde », bouton « Supprimer mon compte » (règle 5.1.1(v)).

Le catalogue, les fiches culturelles, la planète d’Explorer et la création de voyages privés ne nécessitent pas de compte. L’accueil propose de choisir un prénom, un niveau et des activités ; ces informations restent sur l’appareil tant que la sauvegarde du compte n’est pas activée. Poulpy répond directement dans l’app à partir des données d’Ocean Buddy, sans connexion ; aucun message n’est transmis. La localisation n’est demandée que pour « Autour de moi » ; sans permission, le catalogue reste entièrement consultable. La communauté n’est pas ouverte dans cette version (aucun onglet ne la propose).

Parcours conseillé : Explorer, choisir une activité, une région, un spot ; accueil, rangée des cultures, « Le mot du jour » et page d’un pays ; Voyages, créer un voyage, ajouter une étape, exporter.

## Déclarations à vérifier avant soumission

- Confidentialité (questionnaire détaillé dans `A-FAIRE-THOMAS-1.5.0.md`) : avec la sauvegarde du compte, l’app collecte l’adresse e-mail, le prénom, un identifiant d’utilisateur et d’autres contenus de l’utilisateur (favoris, voyages, notes, sessions, progression), liés à l’identité, sans suivi, pour les fonctionnalités de l’app. Tout le reste est non collecté : position (calculée sur l’appareil), historique, achats, diagnostics, analyse, publicité. Ne pas déclarer globalement « aucune donnée collectée ». `ios/App/App/PrivacyInfo.xcprivacy` doit dire la même chose que le questionnaire.
- Position : traitement sur l’appareil pour classer les spots proches ; coordonnées publiques des spots envoyées au fournisseur météo ; zone de carte demandée au fournisseur de tuiles.
- Compte : réservé aux 15 ans et plus (case à cocher avant la sauvegarde) ; suppression et export depuis l’app ; l’app n’est pas présentée comme une application pour enfants. Compléter le questionnaire d’âge.
- Les coordonnées du responsable de la vérification et les informations légales du titulaire doivent être saisies par le titulaire ou confirmées précisément.
- Chiffrement : HTTPS standard du système et Trousseau iOS pour la session du compte, sans implémentation cryptographique propriétaire (`ITSAppUsesNonExemptEncryption` à faux) ; vérifier l’exemption correspondant au binaire final.
- Photographies : conserver la page de crédits et les licences ; ne pas présenter des photos d’ambiance comme une observation actuelle du spot.

## Captures

Les captures de la 1.4.0 (`mobile/store/screenshots/v4-*`, script `scripts/asc-screenshots.mjs`) restent valables. Les refaire est facultatif pour la 1.5.0 : accueil avec la rangée des cultures, page d’un pays, planète d’Explorer. Ne rien montrer qui ne soit pas actif dans l’app (pas de communauté). Cette version native cible l’iPhone.
