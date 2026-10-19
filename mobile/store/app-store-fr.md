# Fiche App Store — brouillon de soumission

État : brouillon pour 1.1.0 (2). L’archive et l’IPA signées conservées localement précèdent les dernières modifications et doivent être reconstruites avant tout envoi ; aucun chargement sur App Store Connect n’a été confirmé. Les captures définitives et le parcours communautaire en production restent à vérifier.

- Nom : Ocean Buddy
- Sous-titre : Spots nautiques et voyages
- Langue principale : français
- Catégorie suggérée : Voyages ; secondaire Sports
- Version prévue : 1.1.0 ; build 2
- Bundle ID proposé : io.github.thomasbrebion59bot.oceanbuddy
- SKU proposé : OCEANBUDDY-IOS-001
- Mots-clés : surf,plongée,snorkeling,paddle,kayak,voyage,océan,spots,itinéraire,marée
- Site : https://oceanbuddy.app/
- Assistance : https://oceanbuddy.app/support.html
- Confidentialité : https://oceanbuddy.app/privacy.html
- Contact public autorisé : oceanbuddy.contact@gmail.com
- Prix : gratuite ; l’application actuelle ne contient pas d’achat intégré.
- Disponibilité/pays : tous les territoires proposés par App Store Connect, sous réserve des obligations réglementaires du compte.

## Description

Ton prochain départ commence avec Ocean Buddy.

Explore plus de 700 spots pour le surf, la plongée, le snorkeling, le paddle, le kayak et d’autres activités nautiques. Choisis ton activité, parcours les régions et découvre chaque destination en images (photographies et, à défaut, illustrations signalées), des repères pratiques et une carte par activité. Les informations encore en cours de vérification sont signalées.

PRÉPARE TON VOYAGE
Crée ton itinéraire, ajoute des étapes, organise les dates et garde tes notes au même endroit. Enregistre tes favoris et partage une copie de ton voyage.

PRENDS LE TEMPS DE DÉCOUVRIR
Ouvre les galeries immersives et retrouve les caractéristiques du lieu : type de pratique, repères de niveau, accès et points d’attention. Active, si tu le souhaites, une ambiance sonore et un relief terrestre léger. Les conditions météo datées complètent ta préparation lorsque tu es connecté.

PARTAGE AVEC PRÉCAUTION
Lorsque la communauté est disponible, lis les conseils approuvés ou connecte-toi avec ton courriel pour proposer un avis, un spot ou une copie choisie de ton voyage. Les contributions attendent une vérification humaine avant d’être visibles. Tes notes et autres détails privés ne sont partagés que si tu les sélectionnes dans l’aperçu.

FAIS CONNAISSANCE AVEC POULPY
Poulpy t’accompagne dans l’exploration : il répond à tes questions directement dans l’app, à partir des fiches et des guides d’Ocean Buddy, même sans connexion. Ses conseils ne remplacent pas les informations locales.

GARDE TON CARNET AVEC TOI
Le catalogue et les photos embarquées restent consultables sans connexion. Tes favoris, voyages et notes sont conservés sur ton appareil. La météo, les tuiles de la carte et la communauté nécessitent internet.

Ocean Buddy aide à préparer une sortie. Les conditions réelles, les consignes locales et ton encadrement priment toujours. L’app ne réserve pas de prestations et ne remplace ni les qualifications nécessaires, ni un outil de navigation maritime ou de plongée.

## Notes pour l’équipe de vérification

La lecture du catalogue et la création de voyages privés ne nécessitent pas de compte. L’accueil propose de choisir un prénom, un niveau et des activités ; ces informations restent locales. Les anciennes sessions de démonstration ne sont pas préremplies pour une nouvelle installation.

Parcours conseillé : Explorer → choisir une activité → région → spot ; Voyages → créer un voyage → ajouter une étape → exporter. Ouvrir la galerie depuis la fiche, lancer et arrêter le son, puis basculer entre la carte 2D et le relief. Poulpy répond directement dans l’app à partir des données d’Ocean Buddy, sans connexion et sans service d’IA ; aucun message n’est transmis.

La localisation n’est demandée que pour « Autour de moi ». Sans permission, l’utilisateur peut parcourir le catalogue. L’application comporte du contenu embarqué, une persistance native des préférences et un partage natif de voyage.

Avant l’envoi en revue, activer et vérifier la communauté en production puis fournir un compte de démonstration vérifié pour l’examen des fonctions membres, ainsi qu’un accès propriétaire de démonstration ou une vidéo du parcours de modération si Apple le demande. Aucun compte ni code de connexion réel ne doit être inscrit dans ce dépôt. Tester avis en attente, approbation, signalement, blocage, retrait de publication et suppression de compte. Si le service est momentanément indisponible, l’interface l’indique et le catalogue reste accessible.

## Déclarations à vérifier avant soumission

- Confidentialité : si la communauté est activée, Supabase reçoit l’adresse e-mail et gère la session ; un pseudonyme, l’identifiant de compte, les contributions, signalements et blocages sont liés au compte. Brevo expédie les codes via la configuration SMTP, et Netlify traite les requêtes. Poulpy répond sur l’appareil : aucune question n’est envoyée à un service d’IA. Vérifier les politiques effectives et la rétention des prestataires avant de remplir le questionnaire. Ne pas déclarer globalement « aucune donnée collectée ».
- Position : traitement sur l’appareil pour classer les spots proches ; coordonnées publiques des spots envoyées au fournisseur météo ; zone de carte demandée au fournisseur de tuiles.
- La communauté suit les règles publiées, attend une approbation avant affichage, permet signalement et blocage, et propose une suppression de compte depuis l’application. Vérifier le délai réel de traitement et garder le contact d’assistance visible. Compléter le questionnaire d’âge ; l’app n’est pas présentée comme une application pour enfants.
- Les coordonnées du responsable de la vérification et les informations légales du titulaire doivent être saisies par le titulaire ou confirmées précisément.
- Chiffrement : HTTPS standard du système, sans implémentation cryptographique propriétaire ; vérifier l’exemption correspondant au binaire final.
- Photographies : conserver la page de crédits et les licences ; ne pas présenter des photos d’ambiance comme une observation actuelle du spot.

## Captures à produire depuis le binaire final

Accueil avec Poulpy ; choix activité/région ; fiche immersive de plongée et galerie ; carte 2D puis relief terrestre ; itinéraire et aperçu de partage ; communauté modérée ; conversation avec Poulpy. Cette version native cible l’iPhone ; vérifier les formats iPhone demandés par App Store Connect. Produire ces captures depuis la version finale et réelle de l’app, sans y montrer une fonction indisponible.
