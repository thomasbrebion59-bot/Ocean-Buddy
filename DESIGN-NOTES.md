# Notes de conception et vérification

## Identité actuelle

Bleu nuit `#071f2c`, fond de navigation `#041822`, turquoise `#1cd3be`, orange `#ff7847` et blanc écume. Barlow Condensed pour les grands titres, Manrope et DM Sans pour les éléments de lecture et de navigation.

L’accueil affiche une vraie vague, un titre expressif « Prends le large », une action orange et Poulpy sur un panneau orange. Les destinations utilisent une grille de grandes photographies. Le fond bleu nuit unifie les écrans secondaires ; les fenêtres de lecture et de quiz gardent des fonds clairs. Les préférences de réduction des animations sont respectées.

## Photographies

`assets/photos/sources.json` conserve les sources, licences et métadonnées Wikimedia. `photos.html` fournit les crédits et liens de licence à l’utilisateur. Les images sont redimensionnées à la source ; seuls le cadrage CSS et un voile de contraste sont appliqués dans l’interface.

| Carte | Lieu | Auteur | Licence |
|---|---|---|---|
| France | Palombaggia, Corse, vue verticale | dronepicr | CC BY 2.0 |
| Europe | Praia da Marinha, Algarve | Tobi 87 | CC BY-SA 3.0 |
| Afrique | Anse Source d’Argent, La Digue | dronepicr | CC BY 2.0 |
| Amérique du Nord | Isla Mujeres, Mexique | dronepicr | CC BY 2.0 |
| Amérique du Sud | Praia do Leão, Fernando de Noronha | Rosana Antunes | CC0 |
| Asie | Île de Kri, Raja Ampat | Lasthib | CC BY-SA 4.0 |
| Océanie | Whitehaven Beach, Whitsundays | dnatheist | CC BY 3.0 |
| Accueil | Vague et surfeur | byronetmedia | Licence Unsplash |

Les photographies de chaque fiche de spot restent celles de l’application initiale, avec leurs propres crédits. Les paysages artificiels de la précédente interface ne sont plus utilisés dans les cartes de destinations. Le panorama ImageGen de la première refonte et les visuels `wave.webp` et `protect.webp` restent archivés sous `assets/design/` ; `adventure.css` remplace leurs usages de fond. Poulpy et l’aquarium conservent leur identité illustrée.

## Vérifications de cette version

- Syntaxe JavaScript contrôlée avec Node pour `app.js` et `design.js`.
- Références de fichiers locaux et identifiants HTML vérifiés.
- Sept photographies de destinations chargées ; aucune image manquante dans la grille.
- Affichage des destinations contrôlé à 320, 390 et 1280 pixels de largeur ; accueil et écrans secondaires inspectés sur mobile et ordinateur.
- Parcours Asie → Uluwatu → Conditions : fiche, prévisions et marée affichées. Contraste corrigé sur les dangers et le fuseau horaire.
- Le bandeau d’une région reprend sa photographie : vérification du bandeau Asie.
- Recherche globale « Lacanau » : un résultat, puis un marqueur sur la carte ; fenêtre et bouton de fiche lisibles.
- Navigation dans Défis, fenêtre du quiz, aquarium et profil ; fermeture du quiz et retour à l’application.
- Aucune erreur JavaScript observée pendant les parcours contrôlés.

La première refonte avait également été vérifiée sur les favoris, les réponses du quiz, les réglages, Poulpy, la sélection d’activité et la reprise de session. Ces parcours ne constituent pas un audit exhaustif sur tous les appareils. Aucun déploiement public n’a été effectué.
