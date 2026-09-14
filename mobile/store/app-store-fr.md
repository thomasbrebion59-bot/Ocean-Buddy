# Fiche App Store — brouillon de soumission

État : build 1 chargé dans App Store Connect ; captures iPhone préparées pour la soumission.

- Nom : Ocean Buddy
- Sous-titre : Spots nautiques et voyages
- Langue principale : français
- Catégorie suggérée : Voyages ; secondaire Sports
- Version : 1.0.0 ; build 1
- Bundle ID proposé : io.github.thomasbrebion59bot.oceanbuddy
- SKU proposé : OCEANBUDDY-IOS-001
- Mots-clés : surf,plongée,snorkeling,paddle,kayak,voyage,océan,spots,itinéraire,marée
- Site : https://thomasbrebion59-bot.github.io/Ocean-Buddy/
- Assistance : https://thomasbrebion59-bot.github.io/Ocean-Buddy/support.html
- Confidentialité : https://thomasbrebion59-bot.github.io/Ocean-Buddy/privacy.html
- Contact public autorisé : thomas.brebion59@icloud.com
- Prix : gratuite ; l’application actuelle ne contient pas d’achat intégré.
- Disponibilité/pays : tous les territoires proposés par App Store Connect, sous réserve des obligations réglementaires du compte.

## Description

Ton prochain départ commence avec Ocean Buddy.

Explore 280 spots pour le surf, la plongée, le snorkeling, le paddle, le kayak et d’autres activités nautiques. Choisis ton activité, parcours les continents et découvre chaque destination avec des photographies, des repères pratiques et une carte par activité.

PRÉPARE TON VOYAGE
Crée ton itinéraire, ajoute des étapes, organise les dates et garde tes notes au même endroit. Enregistre tes favoris et partage une copie de ton voyage.

PRENDS LE TEMPS DE DÉCOUVRIR
Ouvre les galeries immersives, compare des spots et retrouve les caractéristiques du lieu : type de pratique, repères de niveau, accès et points d’attention. Les données météo disponibles complètent ta préparation lorsque tu es connecté.

FAIS CONNAISSANCE AVEC POULPY
Poulpy t’accompagne dans l’exploration. Utilise le guide intégré, ou active l’IA avec ton accord pour poser tes questions. Ses réponses peuvent contenir des erreurs et ne remplacent pas les informations locales.

GARDE TON CARNET AVEC TOI
Le catalogue et les photos embarquées restent consultables sans connexion. Tes favoris, voyages et notes sont conservés sur ton appareil. La météo, le fond de carte et l’IA nécessitent internet.

Ocean Buddy aide à préparer une sortie. Les conditions réelles, les consignes locales et ton encadrement priment toujours. L’app ne réserve pas de prestations et ne remplace ni les qualifications nécessaires, ni un outil de navigation maritime ou de plongée.

## Notes pour l’équipe de vérification

Aucun compte Ocean Buddy ni identifiant de démonstration n’est requis. L’accueil propose de choisir un prénom, un niveau et des activités ; ces informations restent locales. Les anciennes sessions de démonstration ne sont pas préremplies pour une nouvelle installation.

Parcours conseillé : Explorer → choisir une activité → continent → spot ; Voyages → créer un voyage → ajouter une étape → exporter. Poulpy affiche un choix explicite au premier message. « Utiliser le guide intégré » ne transmet aucun message à l’IA ; « Autoriser Poulpy IA » envoie les messages via Netlify à OpenAI. Le choix se modifie dans Profil → Réglages.

La localisation n’est demandée que pour « Autour de moi ». Sans permission, l’utilisateur peut parcourir le catalogue. L’application comporte du contenu embarqué, une persistance native des préférences et un partage natif de voyage.

## Déclarations à vérifier avant soumission

- Confidentialité : contenu des messages IA transmis volontairement pour fournir une réponse ; pas de compte utilisateur ni de publicité ciblée. Netlify reçoit l’adresse IP pour les traitements techniques et la limitation d’abus. Vérifier la politique effective des prestataires avant de remplir les catégories du questionnaire, y compris les éventuelles données techniques conservées. Ne pas déclarer globalement « aucune donnée collectée ».
- Position : traitement sur l’appareil pour classer les spots proches ; coordonnées publiques des spots envoyées au fournisseur météo ; zone de carte demandée au fournisseur de tuiles.
- Les références à l’IA ne permettent pas d’ignorer le questionnaire d’âge et la modération. L’app vise la préparation d’activités nautiques, et n’est pas présentée comme une application pour enfants.
- Les coordonnées du responsable de la vérification et les informations légales du titulaire doivent être saisies par le titulaire ou confirmées précisément.
- Chiffrement : HTTPS standard du système, sans implémentation cryptographique propriétaire ; vérifier l’exemption correspondant au binaire final.
- Photographies : conserver la page de crédits et les licences ; ne pas présenter des photos d’ambiance comme une observation actuelle du spot.

## Captures à produire depuis le binaire final

Accueil bleu avec Poulpy ; choix activité/continent ; fiche immersive de plongée ; carte filtrée ; itinéraire avec étapes ; conversation après consentement. Vérifier les formats demandés par App Store Connect pour iPhone et iPad. Ne pas utiliser les anciennes maquettes publicitaires comme captures du produit.
