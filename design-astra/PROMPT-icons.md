Tu es directeur artistique et illustrateur de pictogrammes pour Ocean Buddy, une application iOS de spots nautiques (identité cobalt #1F5BFF / bleu nuit #0B1F4D, accent corail #FF5A44, citron #D8F24A, fond clair #F4F8FF).

PROBLÈME : l'app fait « générée par IA ». Les icônes actuelles (poulpe 3D brillant, éclaboussures, yeux énormes, reflets plastiques) et des détails trop chargés trahissent l'IA. Des amis l'ont dit. Il faut un rendu sobre, professionnel, d'agence : on ne doit PLUS voir que c'est de l'IA.

TÂCHE : dessine en SVG, à la main (code), 12 pictogrammes d'activité : all (tout), surf, bodyboard, baignade, paddle, kayak, snorkeling, plongee, kitesurf, windsurf, plus 3 niveaux : debutant, intermediaire, expert (1, 2, 3 vagues ou 3 barres, à toi de choisir le plus lisible).
RÈGLES :
- viewBox 0 0 48 48, style unique pour tous : formes géométriques pleines et simples, 2 couleurs maximum par icône (bleu nuit #0B1F4D + une teinte de la palette), angles et rayons cohérents, ZÉRO dégradé, ZÉRO ombre, ZÉRO filtre, ZÉRO détail inutile, pas de visage, pas d'étincelle, pas de bulles décoratives.
- Silhouette lisible à 20 px et à 64 px. Chaque sport reconnaissable à son matériel (planche de surf, pagaie droite, kayak double pagaie, masque+tuba, bouteille, aile de kite, voile de windsurf…) avec une figure humaine stylisée très simple (cercle + traits) OU juste l'objet, mais la même logique pour tous.
- Pagaie : manche droit, pale alignée. Aucun objet cassé ou déformé.
- Une variante par icône : « color » (2 couleurs) ; et une version « mono » (une seule couleur currentColor) pour la barre de navigation.
SORTIE : un fichier .svg par icône dans ./icons/ (ex. icons/surf.svg, icons/surf-mono.svg), puis ./icons/sheet.html qui affiche tout en grille à 24, 48 et 96 px sur fond clair. Ne produis rien d'autre. Vérifie que chaque SVG est du XML valide.
