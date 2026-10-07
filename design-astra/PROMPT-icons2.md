Tu es directeur artistique d'Ocean Buddy (app iOS de spots nautiques ; cobalt #1F5BFF, bleu nuit #0B1F4D, corail #FF5A44, citron #D8F24A, crème #F2E8D5). Objectif : plus rien qui fasse « IA ». Rendu d'agence, sobre.

Ton premier lot d'icônes (design-astra/icons/icons/*.svg) est trop faible : les objets seuls (une feuille pour le surf, un rectangle pour le bodyboard) ne se reconnaissent pas à 24 px, ils flottent petits au milieu du carré, rien ne dit « surf » ou « kayak ».

REFAIS-LES. Règles :
- viewBox 0 0 48 48. Chaque icône remplit ~85 % du cadre (marges 3 px), jamais d'objet minuscule.
- Une scène-pictogramme en aplats, façon pictogrammes olympiques : silhouette humaine simple (tête ronde + corps en formes pleines, sans visage) EN ACTION sur/avec son matériel, plus 1 trait d'eau (vague nette) quand pertinent. Surf : surfeur debout sur planche sur la vague. Bodyboard : personne allongée sur la planche sur vague. Baignade : nageur crawl, bras levé. Paddle : personne debout sur planche avec pagaie droite. Kayak : personne assise dans kayak, pagaie double horizontale. Snorkeling : tête+masque+tuba à la surface. Plongée : plongeur horizontal avec bouteille. Kitesurf : rider sur planche + aile en arc au-dessus. Windsurf : planche + voile triangulaire + personne. all : 4 vagues ou grille de 4 formes.
- 2 couleurs max (bleu nuit #0B1F4D pour le personnage/matériel + cobalt #1F5BFF ou corail #FF5A44 pour l'eau/voile/aile). Zéro dégradé, zéro ombre, zéro filtre, zéro étincelle, zéro bulle décorative. Traits arrondis cohérents.
- Doit être immédiatement reconnaissable à 24 px.
- Niveaux debutant / intermediaire / expert : 1, 2, 3 vagues superposées remplies (cobalt) dans un cercle bleu nuit, clair à 24 px.
- Chaque icône en 2 versions : NAME.svg (2 couleurs) et NAME-mono.svg (tout en currentColor, le second ton en opacité .45).
SORTIE : écris les fichiers dans ./icons2/ (directement, pas de sous-dossier), plus icons2/sheet.html (grille, fonds clair ET sombre, tailles 24/48/96). Vérifie le XML. Rien d'autre.
