/* Spots ajoutés le 29 octobre 2026 (retours utilisateurs : Capbreton, Seignosse, Saint-Gilles-Croix-de-Vie et voisins vendéens).
   Fusionnés dans catalog.json par :
   node scripts/add-spots.cjs data/new-spots-2026-10.cjs data/new-spot-photos-2026-10.json catalogue-2026-10
   Coordonnées : OpenStreetMap (Nominatim, plage nommée). Faits : offices de tourisme et sites de plages consultés le 2026-10-29
   (voir sourceLabel de chaque fiche). Aucun fait sans source ; niveau « variable » quand aucune source ne le donne.
   Textes non relus sur place : editorialStatus « unverified », à vérifier localement.
   Sources consultées :
   - Capbreton : tourismelandes.com (Plage de l'Estacade, Plage du Prévent, Plage Centrale), belambra.fr/guides (Santocha), guide-des-landes.com (Santocha)
   - Seignosse : tourismelandes.com/loisir/plage-des-bourdaines, lonelyplanet.fr/destinations/france/les-landes/seignosse, belambra.fr/guides/destinations/seignosse/plages, surf-report.com (Les Bourdaines)
   - Saint-Gilles-Croix-de-Vie : payssaintgilles-tourisme.fr (Grande Plage, Plage de la Sauzaie), atlantic-loire-valley.com
   - Sion-sur-l'Océan : fr/en.wikipedia.org (Sion-sur-l'Océan), plages.tv (Grande plage de Sion), surf-forecast.com/breaks/Sion
   - La Sauzaie : plages.tv (Plage de la Sauzaie, surf), payssaintgilles-tourisme.fr */
const label=(s)=>'Fiche Ocean Buddy · octobre 2026 · d’après '+s+' · à vérifier localement';
module.exports=[
{"id":"santocha","name":"Santocha — Capbreton","loc":"Landes, France","country":"France","world":"fr","lat":43.6458,"lon":-1.4457,"sports":["surf"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable au sud de Capbreton, orientée plein ouest. Plusieurs pics s’y forment, à gauche comme à droite.",
 "tip":"Regarde la mer un moment avant d’entrer, repère les courants et mets-toi à l’eau dans la zone surveillée quand le poste est ouvert.",
 "dangers":[["🌀","Les baïnes et leurs courants existent sur cette côte landaise : repère-les depuis la plage."],["🌊","Plage ouverte plein ouest : quand la houle grossit, l’océan arrive de face."],["🛟","Poste de secours partagé avec la plage du Prévent, surtout actif en été."]],
 "sourceLabel":label("Tourisme Landes, Belambra et Guide des Landes")},
{"id":"estacade","name":"L’Estacade — Capbreton","loc":"Landes, France","country":"France","world":"fr","lat":43.6544,"lon":-1.4457,"sports":["baignade","paddle"],"level":"variable","waterType":"sea",
 "desc":"La plus petite plage de Capbreton, sur la rive sud du port, contre la jetée. Plutôt familiale que surf : les enfants, les pêcheurs à marée basse et les paddles y trouvent leur place.",
 "tip":"Reste côté plage, loin de la jetée et du chenal du port, surtout en paddle, et surveille les bateaux.",
 "dangers":[["⛴️","Plage contre la jetée du port : des bateaux passent dans le chenal tout près."],["🛟","Surveillance de la plage en été seulement : renseigne-toi avant de te baigner hors saison."]],
 "sourceLabel":label("Tourisme Landes (Plage de l’Estacade)")},
{"id":"estagnots","name":"Les Estagnots — Seignosse","loc":"Landes, France","country":"France","world":"fr","lat":43.6873,"lon":-1.4407,"sports":["surf"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable de Seignosse, au sud des Bourdaines. Selon Lonely Planet, c’est la plage la plus prisée des surfeurs de la commune. Un poste de secours surveille la baignade en été.",
 "tip":"Repère les baïnes depuis la plage, entre dans l’eau dans la zone surveillée en été et garde le poste en vue.",
 "dangers":[["🌀","Baïnes et courants parfois forts sur les plages de Seignosse, signale Surf-Report."],["👥","Plage très prisée des surfeurs : le pic peut être chargé en saison."],["🛟","Surveillance en été seulement : regarde où sont les drapeaux avant d’entrer."]],
 "sourceLabel":label("Lonely Planet, Belambra, Tourisme Landes et Surf-Report")},
{"id":"penon","name":"Le Penon — Seignosse","loc":"Landes, France","country":"France","world":"fr","lat":43.7094,"lon":-1.4366,"sports":["surf"],"level":"variable","waterType":"sea",
 "desc":"Plage du Penon, à Seignosse, au nord des Bourdaines. Un poste de secours y fonctionne en haute saison.",
 "tip":"Repère les baïnes depuis la plage et mets-toi à l’eau près du poste de secours quand il est ouvert.",
 "dangers":[["🌀","Baïnes et courants parfois forts sur les plages de Seignosse, signale Surf-Report."],["🛟","Poste de secours en haute saison seulement : hors saison, ne surfe pas seul."]],
 "photoContext":"Plage du Penon, Seignosse",
 "sourceLabel":label("Belambra, Tourisme Landes et Surf-Report")},
{"id":"saintgilles","name":"Grande Plage — Saint-Gilles-Croix-de-Vie","loc":"Vendée, France","country":"France","world":"fr","lat":46.6841,"lon":-1.9337,"sports":["surf","bodyboard","kitesurf"],"level":"variable","waterType":"sea",
 "desc":"Grande plage de sable au cœur de Saint-Gilles-Croix-de-Vie, près du remblai et du centre-ville. L’office de tourisme la dit idéale pour les sports de glisse : surf, kitesurf, bodyboard. Une école de surf y propose cours et location, et la plage porte le label Handiplage.",
 "tip":"Entre dans l’eau dans la zone surveillée, drapeau en vue, et demande conseil à l’école de surf ou aux secouristes avant de surfer.",
 "dangers":[["👥","Plage très fréquentée en haute saison, surtout près du remblai."],["🛟","Surveillance limitée à l’été : le reste de l’année, renseigne-toi avant d’entrer dans l’eau."],["🪁","Surf, kitesurf et bodyboard se partagent la plage : garde tes distances."]],
 "sourceLabel":label("l’Office de tourisme Pays de Saint-Gilles et Atlantic Loire Valley")},
{"id":"sion","name":"Grande Plage de Sion — Sion-sur-l’Océan","loc":"Vendée, France","country":"France","world":"fr","lat":46.715,"lon":-1.9795,"sports":["surf","kitesurf","baignade"],"level":"variable","waterType":"sea",
 "desc":"Grande plage de sable de Sion-sur-l’Océan, station de Saint-Hilaire-de-Riez. Elle est surveillée en saison et compte une zone de kitesurf et un centre nautique. Selon Surf-Forecast, le surf y marche surtout en automne et en hiver ; l’été, la mer est souvent plate.",
 "tip":"Hors saison, entre accompagné et regarde les fonds à marée basse avant de surfer.",
 "dangers":[["🪁","Zone de kitesurf sur la plage : garde tes distances avec les ailes et les lignes."],["🛟","Surveillance en saison seulement : hors saison, personne ne surveille la baignade."],["🪨","Surf-Forecast décrit un fond de roche : repère les fonds à marée basse."]],
 "sourceLabel":label("plages.tv, Wikipédia et Surf-Forecast")},
{"id":"sauzaie","name":"La Sauzaie — Brétignolles-sur-Mer","loc":"Vendée, France","country":"France","world":"fr","lat":46.6455,"lon":-1.9013,"sports":["surf"],"level":"expert","waterType":"sea",
 "desc":"Reef de la côte vendéenne, au nord de la Corniche, à Brétignolles-sur-Mer. Selon plages.tv, une houle moyenne d’ouest avec un vent d’est donne le meilleur pic, à gauche et à droite, avec des sections creuses. Le Vendée Surf Pro s’y déroule.",
 "tip":"Observe la mise à l’eau depuis la plage, entre seulement si tu sais gérer un reef et des rochers, et ne surfe pas seul.",
 "dangers":[["🪨","Mise à l’eau parmi les rochers, tout près des vagues."],["⚡","Vagues creuses sur un reef : réservé aux surfeurs confirmés."],["🛟","Plage surveillée en juillet et août seulement."]],
 "sourceLabel":label("plages.tv et l’Office de tourisme Pays de Saint-Gilles")},
];
