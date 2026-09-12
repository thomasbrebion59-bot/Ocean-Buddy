# Notes de conception et vérification

## Identité

Palette : bleu profond `#092f3c`, lagon `#087e83`, écume `#f4f6f3`, sable `#faf4e8`, orange `#ee773c`. Typographies : Manrope et DM Sans, chargées via Google Fonts.

Les panneaux respirent davantage, les photos structurent la découverte et les couleurs des actions restent cohérentes. Sur téléphone, Poulpy est accessible dans l’en-tête pour ne pas couvrir les contenus. Sur ordinateur, il est accessible depuis la navigation latérale.

## Images

Le panorama `hero.webp` a été généré avec ImageGen à partir de l’ambiance publicitaire de `Designer-38.png` fourni par le propriétaire de l’application. Il s’agit d’une illustration d’ambiance, sans prétention à représenter un spot précis. Son original est `hero-source.png`.

`poulpy.webp`, `wave.webp` et `protect.webp` proviennent des visuels générés pendant la réalisation de la publicité Ocean Buddy dans cette même collaboration, inspirés des designs fournis. Poulpy reprend la mascotte orange, la casquette, le sac et la boussole.

Les 137 images sous `assets/original` sont identiques, octet pour octet, aux images WebP embarquées dans la version GitHub initiale. Les photos identifiées par spot restent celles de l’application et gardent leurs crédits Wikimedia Commons.

## Vérifications réalisées

- Syntaxe JavaScript : `node --check app.js` et `node --check design.js`.
- Concordance SHA-256 des 137 images extraites avec les images de la version source.
- Existence des 140 références de visuels locaux ; identifiants HTML sans doublon.
- Navigation dans le navigateur : accueil, destinations, recherche, favoris, fiche Lacanau, conditions, défis, quiz, aquarium, fiche Poisson-clown, profil, réglages et Poulpy.
- Recherche « Lacanau » sur téléphone et depuis la recherche globale ordinateur : résultat correct. Ajout aux favoris puis présence au profil.
- Carte : la recherche « Lacanau » donne un seul marqueur identifié ; ouverture de sa fenêtre avec le bouton d’accès à la fiche.
- Prévisions et courbe de marée : données du service chargées et affichées, indications de provenance conservées.
- Quiz Faune : réponse, correction et bouton de question suivante affichés.
- Réglages : enregistrement du prénom, retour au profil ; discussion Poulpy avec une réponse du guide intégré.
- Fermeture des fenêtres avec Échap, mise au point du clavier, libellés des boutons et états sélectionnés.
- Reprise de session après rechargement sans onboarding répétitif.
- Inspection visuelle à 320, 390, 1280 et 1440 pixels de largeur. Corrections des superpositions mobiles, du rail de navigation et des espacements du bandeau Défis.
- Aucune erreur JavaScript signalée par le navigateur lors des parcours contrôlés.

Ces contrôles couvrent les parcours indiqués. Ils ne remplacent pas un audit exhaustif d’accessibilité ni un essai sur chaque modèle de téléphone. Aucun déploiement sur le site public n’a été effectué.

## Prompt du panorama

Use case: ads-marketing. Asset type: wide cinematic hero photograph for the Ocean Buddy ocean exploration app redesign. Create one panoramic 16:9 high end editorial travel photograph, drone above a beautiful lush tropical coastal headland, emerald textured island rising in the right third, sweeping pristine ivory sand beach bottom right, brilliantly clear turquoise lagoon transitioning to deep navy open ocean left. Tiny natural waves, subtle sun rays through golden late-afternoon clouds, atmospheric distant coastal mountains. A small distant surfer or paddleboarder near the lagoon emphasizes scale without dominating. Premium real adventure magazine aesthetic, detailed realistic geology and palm trees, vibrant but tasteful teal blues and dark evergreen, warm sand accents. Reserve left third as deep dark open water for readable white interface title layered later. Horizon in upper third. Reference posters provided for Ocean Buddy visual mood only; avoid all their phones, copy and mascots in this background. No words, no logo, no UI, no border, no collage, no artificial map pins, no fantasy floating islands. Single beautiful photographic scene.
