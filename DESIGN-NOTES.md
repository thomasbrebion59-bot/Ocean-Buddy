# Notes de conception et vérification — Surf trips

## Identité

Cobalt `#2154dc`, bleu de navigation `#174bd3`, sable `#f5f5f0`, corail `#fc7955` et citron vert `#e0ff91`. Grands titres Barlow Condensed, interface DM Sans et Manrope. Les fonds de lecture sont clairs ; le cobalt structure la navigation, les boutons et les profils. Les masques sur les photos de destinations ont été allégés.

L’aquarium, ses modales et ses récompenses de créatures sont retirés du parcours. Les défis, XP, badges et gestes pour l’océan restent accessibles. L’espace Surf trips est relié à l’accueil et à chaque fiche de spot.

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

Le voyage « Exemple · Côte basque » utilisé pour la vérification est archivé dans la prévisualisation locale. Aucun voyage de démonstration n’est livré dans le code. Aucun déploiement public n’a été effectué.
