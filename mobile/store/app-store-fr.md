# Fiche App Store — brouillon de soumission

État : brouillon pour 1.1.0 (2). L’archive est signée et l’IPA exportée localement ; aucun chargement sur App Store Connect n’a été confirmé. Les captures définitives et le parcours communautaire en production restent à vérifier.

- Nom : Ocean Buddy
- Sous-titre : Spots nautiques et voyages
- Langue principale : français
- Catégorie suggérée : Voyages ; secondaire Sports
- Version prévue : 1.1.0 ; build 2
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

Explore 280 spots pour le surf, la plongée, le snorkeling, le paddle, le kayak et d’autres activités nautiques. Choisis ton activité, parcours les régions et découvre chaque destination avec des photographies, des repères pratiques et une carte par activité. Les informations encore en cours de vérification sont signalées.

PRÉPARE TON VOYAGE
Crée ton itinéraire, ajoute des étapes, organise les dates et garde tes notes au même endroit. Enregistre tes favoris et partage une copie de ton voyage.

PRENDS LE TEMPS DE DÉCOUVRIR
Ouvre les galeries immersives et retrouve les caractéristiques du lieu : type de pratique, repères de niveau, accès et points d’attention. Active, si tu le souhaites, une ambiance sonore et un relief terrestre léger. Les conditions météo datées complètent ta préparation lorsque tu es connecté.

PARTAGE AVEC PRÉCAUTION
Lorsque la communauté est disponible, lis les conseils approuvés ou connecte-toi avec ton courriel pour proposer un avis, un spot ou une copie choisie de ton voyage. Les contributions attendent une vérification humaine avant d’être visibles. Tes notes et autres détails privés ne sont partagés que si tu les sélectionnes dans l’aperçu.

FAIS CONNAISSANCE AVEC POULPY
Poulpy t’accompagne dans l’exploration. Utilise le guide intégré, ou active l’IA avec ton accord pour poser tes questions. Ses réponses peuvent contenir des erreurs et ne remplacent pas les informations locales.

GARDE TON CARNET AVEC TOI
Le catalogue et les photos embarquées restent consultables sans connexion. Tes favoris, voyages et notes sont conservés sur ton appareil. La météo, les tuiles de la carte, l’IA et la communauté nécessitent internet.

Ocean Buddy aide à préparer une sortie. Les conditions réelles, les consignes locales et ton encadrement priment toujours. L’app ne réserve pas de prestations et ne remplace ni les qualifications nécessaires, ni un outil de navigation maritime ou de plongée.

## Notes pour l’équipe de vérification

La lecture du catalogue et la création de voyages privés ne nécessitent pas de compte. L’accueil propose de choisir un prénom, un niveau et des activités ; ces informations restent locales. Les anciennes sessions de démonstration ne sont pas préremplies pour une nouvelle installation.

Parcours conseillé : Explorer → choisir une activité → région → spot ; Voyages → créer un voyage → ajouter une étape → exporter. Ouvrir la galerie depuis la fiche, lancer et arrêter le son, puis basculer entre la carte 2D et le relief. Poulpy affiche un choix explicite au premier message. « Utiliser le guide intégré » ne transmet aucun message à l’IA ; « Autoriser Poulpy IA » envoie les messages via Netlify à OpenAI. Le choix se modifie dans Profil → Réglages.

La localisation n’est demandée que pour « Autour de moi ». Sans permission, l’utilisateur peut parcourir le catalogue. L’application comporte du contenu embarqué, une persistance native des préférences et un partage natif de voyage.

Avant l’envoi en revue, activer et vérifier la communauté en production puis fournir un compte de démonstration vérifié pour l’examen des fonctions membres, ainsi qu’un accès propriétaire de démonstration ou une vidéo du parcours de modération si Apple le demande. Aucun compte ni code de connexion réel ne doit être inscrit dans ce dépôt. Tester avis en attente, approbation, signalement, blocage, retrait de publication et suppression de compte. Si le service est momentanément indisponible, l’interface l’indique et le catalogue reste accessible.

## Déclarations à vérifier avant soumission

- Confidentialité : si la communauté est activée, Supabase reçoit l’adresse e-mail et gère la session ; un pseudonyme, l’identifiant de compte, les contributions, signalements et blocages sont liés au compte. Brevo expédie les codes via la configuration SMTP, et Netlify traite les requêtes. Les messages IA sont transmis volontairement à Netlify puis OpenAI pour fournir une réponse. Vérifier les politiques effectives et la rétention des prestataires avant de remplir le questionnaire. Ne pas déclarer globalement « aucune donnée collectée ».
- Position : traitement sur l’appareil pour classer les spots proches ; coordonnées publiques des spots envoyées au fournisseur météo ; zone de carte demandée au fournisseur de tuiles.
- La communauté suit les règles publiées, attend une approbation avant affichage, permet signalement et blocage, et propose une suppression de compte depuis l’application. Vérifier le délai réel de traitement et garder le contact d’assistance visible. Compléter le questionnaire d’âge ; l’app n’est pas présentée comme une application pour enfants.
- Les coordonnées du responsable de la vérification et les informations légales du titulaire doivent être saisies par le titulaire ou confirmées précisément.
- Chiffrement : HTTPS standard du système, sans implémentation cryptographique propriétaire ; vérifier l’exemption correspondant au binaire final.
- Photographies : conserver la page de crédits et les licences ; ne pas présenter des photos d’ambiance comme une observation actuelle du spot.

## Captures à produire depuis le binaire final

Accueil avec Poulpy ; choix activité/région ; fiche immersive de plongée et galerie ; carte 2D puis relief terrestre ; itinéraire et aperçu de partage ; communauté modérée ; conversation après consentement. Vérifier les formats demandés par App Store Connect pour iPhone et iPad. Produire ces captures depuis la version finale et réelle de l’app, sans y montrer une fonction indisponible.
