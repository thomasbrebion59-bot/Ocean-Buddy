Tu es directeur artistique pour Ocean Buddy (app iOS de spots nautiques, cobalt #1F5BFF / bleu nuit #0B1F4D / corail #FF5A44 / citron #D8F24A / sable #F2E8D5).

PROBLÈME : les transitions actuelles quand on change d'activité (surf, paddle, kayak…) sont des peintures gouache sur-rendues avec rayons de lumière, bulles, texture de pinceau, poulpe 3D : ça fait IA, tout le monde le voit. On veut du professionnel : affiche de voyage minimaliste, aplats nets, géométrie, comme une identité de marque d'agence.

TÂCHE : crée en SVG (code) une scène plein écran verticale (viewBox 0 0 390 844) pour chacune des 9 activités : surf, bodyboard, baignade, paddle, kayak, snorkeling, plongee, kitesurf, windsurf.
RÈGLES :
- Aplats uniquement, 4 à 6 formes de couleur par scène, palette resserrée de l'app (bleus + 1 accent chaud propre à l'activité). Ciel/eau en bandes ou courbes nettes. ZÉRO dégradé complexe (un seul dégradé linéaire doux autorisé par scène), ZÉRO filtre/flou, ZÉRO particules, ZÉRO étincelles, ZÉRO texture bruitée.
- Un seul sujet fort par scène, grand, cadré avec beaucoup d'air (une silhouette simple, sans visage, ou juste l'objet : vague, planche, pagaie, kayak, voile, aile, bulles-cercles unis pour la plongée).
- Chaque scène est structurée en 3 groupes <g id="bg">, <g id="mid">, <g id="fg"> pour pouvoir les animer en parallaxe.
- Les 200 px du haut et les 260 px du bas restent calmes (aucun détail) car l'UI s'y superpose.
SORTIE : un .svg par activité dans ./scenes/ (scenes/surf.svg…), plus ./scenes/sheet.html qui les montre côte à côte. Ne produis rien d'autre. Vérifie que chaque SVG est du XML valide.
