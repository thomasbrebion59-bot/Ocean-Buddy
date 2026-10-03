# Ocean Buddy 1.3 — la vraie Terre (octobre 2026)

## La planète

Le globe (`ocean-globe.js`) montre la vraie Terre, à partir d’images de la NASA (domaine public) construites par `scripts/build-globe-earth.py <dossier NASA>` :

- `earth-day-{4k,8k}.webp` : Blue Marble Next Generation (juillet 2004), couleurs réelles. Le téléphone n’utilise que la 4K.
- `earth-normal-4k.webp` : pente du relief (GEBCO, exagérée ×28) et masque de l’eau pour le reflet du soleil.
- `earth-sky-4k.webp` : lumières des villes (Black Marble 2016), nuages (Blue Marble) et glaces.
- `sky-2k.webp` et `stars.bin` : voie lactée et 9 000 étoiles réelles (NASA SVS Deep Star Maps 2020), placées selon l’heure sidérale.

Le shader calcule l’éclairage (terminateur rougi), la diffusion de l’atmosphère (bleu au limbe), le reflet du soleil sur l’océan, l’ombre des nuages et les lumières de la nuit. Deux éclairages : « studio » (soleil en haut à gauche de la caméra, réglage par défaut) et « jour et nuit réels » (position du soleil calculée pour l’instant présent). Les nuages dérivent et la Terre tourne doucement tant qu’on ne l’a pas touchée ; l’animation s’arrête quand le globe est caché ou au repos depuis une minute. Les emblèmes des pays ne sont plus affichés (`opts.emblems` pour les réactiver).

En zoomant, la carte détaillée commence sur la même image satellite (NASA GIBS, Blue Marble) puis passe au style clair en deux niveaux de zoom. Sur écran tactile, la bascule se fait à 1 200 km de large (600 km sur ordinateur, qui charge la 8K).

## La coque d’application (`app-shell.css`, `app-shell.js`)

Conventions iOS 26 : barre d’onglets flottante en verre (Accueil, Explorer, Voyages, Défis, Profil ; Communauté reste dans la barre latérale et le profil), bouton Poulpy rond à côté, en-tête translucide dont le titre apparaît au défilement, grands titres, barre discrète au défilement vers le bas. Textes de 11 px au minimum sur téléphone. L’onglet Explorer ouvre la planète en plein écran (recherche flottante, filtres en verre sombre, continents en photos dans le tiroir, boutons soleil réel, nuages et « Surprends-moi »). La fiche d’un spot affiche sa photo jusqu’en haut de l’écran. La barre d’état de l’app iOS suit le fond (`ocean:statusbar`, `mobile/client.js`).

## Envies de départ

- Accueil (`home-feed.js/css`) : la Terre en ouverture, « Où partir en <mois> ? » (meilleure saison tirée des carnets de destination, `data/seasons.json` construit par `scripts/build-seasons.cjs`), puis des collections (lagons, vagues de légende, plongées, l’été au frais, débuter en douceur, îles lointaines). Seules les vraies photos servent de couverture ; les rails changent chaque jour.
- Filtre « En saison ce mois-ci » sur la carte et dans la liste.
- Trophées (`badges.js/css`, `assets/badges/`) : 13 médailles émaillées (GPT-6 Astra), rareté selon la difficulté, vitrine, fiche 3D, célébration et carte à partager.
- Passeport océan (`passport.js`) : carte du monde des spots visités et des favoris, pays et continents.
- Fenêtre « Nouveautés » une fois après la mise à jour.

# Notes de conception et vérification — Surf trips

## Identité

Cobalt `#2154dc`, bleu de navigation `#174bd3`, sable `#f5f5f0`, corail `#fc7955` et citron vert `#e0ff91`. Grands titres Barlow Condensed, interface DM Sans et Manrope. Les fonds de lecture sont clairs ; le cobalt structure la navigation, les boutons et les profils. Les masques sur les photos de destinations ont été allégés.

L’aquarium, ses modales et ses récompenses de créatures sont retirés du parcours. Les défis, XP, badges et gestes pour l’océan restent accessibles. L’espace Surf trips est relié à l’accueil et à chaque fiche de spot.

## Ocean Blue (27 septembre 2026)

Retour au bleu cobalt d’origine, préféré à l’abysse vert sombre. `ocean-blue.css`, chargée en dernier, redéfinit les rôles :

- **Bleu marine** `#0b2d7a` : titres, fonds profonds, voile des photos.
- **Cobalt** `#1f55e0` → `#1440b8` : navigation (dégradé), boutons, états actifs des filtres.
- **Citron vert** `#e0ff91` : onglet courant, repères « en direct », bouton principal sur fond bleu.
- **Corail** `#ff7a55` : appel à l’action sur photo.
- **Brume** `#f3f6fd` : fond de lecture légèrement bleuté.

L’accueil suit l’ordre héros → « Pars en immersion » → cockpit (semaine, prochain départ, favoris) → activités. Les couvertures des continents sont toujours les photos choisies à la main, quelle que soit l’activité (auparavant l’Océanie montrait Pipeline, à Hawaï).

## Palette unifiée (septembre 2026, remplacée)

Trois palettes cohabitaient : sarcelle et menthe (navigation), cobalt et citron vert (contenus), pêche (bouton principal). `ocean-hub.css`, chargée en dernier, fixe les rôles :

- **Abysse** `#0a2b3e` : structure (navigation, fonds sombres).
- **Cobalt** `#2154dc` : actions et liens.
- **Corail** `#fc754f` : appel principal sur photo, texte sombre pour le contraste.
- **Citron vert** `#dfff89` : état actif (onglet courant, étiquettes de statut).

Sur téléphone, le bouton d’ambiance sonore quitte la barre du haut (il reste dans Réglages) sauf quand le son joue.

## Poids et chargement

Leaflet n’est plus chargé dans `<head>` : sa feuille de style arrive sans bloquer l’affichage et son script précède les scripts de l’application en fin de page. 216 photographies ont été recompressées sans changer de nom ni de format, à 1600 pixels de large au plus (71,8 Mo → 38,1 Mo). La photo d’accueil passe de 430 à 130 Ko. Le PNG de Capo Mannu est devenu un JPEG de 140 Ko. Les cartes de voyages et les nouveautés utilisent `srcset` pour recevoir la miniature quand elle suffit.

## Photographies

Les 168 photos sont servies depuis `assets/spots/`. Le manifeste `sources.json` conserve les noms de fichiers Wikimedia, liens, auteurs, licences et tailles. Les miniatures sont demandées en largeur 1280 pixels, dans la limite de la résolution originale. La source et la licence de la vague d’accueil restent dans `assets/photos/sources.json`.

Les couvertures représentent la calanque d’En-Vau, Navagio, Anse Source d’Argent, Isla Mujeres, Fernando de Noronha, Raja Ampat et Whitehaven. Le cadrage CSS s’adapte au format des cartes. Les photographies ne subissent aucune transformation générative. Les crédits complets sont générés dans `photos.html`.

## Voyages

Stockage indépendant versionné, validation des dates réelles et des intervalles, rejet d’un budget invalide, sauvegarde des textes à la saisie. Les erreurs de lecture ou de quota sont signalées sans écraser les données. L’archivage est réversible. Le retrait d’une étape propose une annulation pendant douze secondes.

Les idées de voyage n’impliquent aucune réservation ni disponibilité. Aucun voyage n’est créé au chargement. La carte utilise les coordonnées des spots et une ligne d’ordre des étapes, explicitement distinguée d’un trajet routier.

## Vérification

- Neuf tests unitaires du modèle : dates impossibles, années bissextiles, changement d’heure, dates des étapes, budgets, ordre, répétition d’un spot, persistance et erreurs de stockage.
- Parcours réel dans le navigateur : création depuis une idée, notes, transport, budget, checklist, déplacement d’étapes, recherche et ajout, ajout depuis une fiche, retrait et annulation, modification invalide, puis rechargement et récupération des valeurs.
- Affichage vérifié à 320, 390 et 1280 pixels de largeur : destinations, voyages, profil, défis et accueil.
- Préservation des données de profil et de favoris existantes, sans migration destructive.

Le voyage « Exemple · Côte basque » utilisé pour la vérification est archivé dans la prévisualisation locale. Aucun voyage de démonstration n’est livré dans le code. Ces contrôles ont été réalisés localement avant publication.
