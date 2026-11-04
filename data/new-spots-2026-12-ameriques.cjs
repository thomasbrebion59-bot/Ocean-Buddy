/* Spots « Noël au soleil » — zone Caraïbes et Amériques (décembre 2026). 12 fiches, consultées le 2026-11-03.
   Format identique à data/new-spots-2026-10.cjs (fusionné par node scripts/add-spots.cjs data/new-spots-2026-12-ameriques.cjs data/new-spot-photos-2026-12-ameriques.json catalogue-2026-12).
   Coordonnées : OpenStreetMap (Nominatim), recoupées avec Wikipédia quand elle donne un point. Aucun spot à moins de 3 km d’un spot existant.
   Faits : uniquement ce que disent les pages ouvertes ci-dessous. Niveau « variable » : aucune source ne le donne.
   Textes non relus sur place : editorialStatus « unverified », à vérifier localement. Détail fait par fait : data/sources/new-spots-2026-12-ameriques.md.
   URL consultées (toutes le 2026-11-03) :
   - Saison Guadeloupe (paindesucre, caravelle, feuillere, souffleur) :
       https://www.lesilesdeguadeloupe.com/infos-pratiques/quand-partir-en-guadeloupe/
       https://www.lesilesdeguadeloupe.com/infos-pratiques/climat/
       https://www.partir.com/Guadeloupe/quand-partir.html (lu, non utilisé dans les fiches)
       https://fr.wikipedia.org/wiki/Guadeloupe (lu, non utilisé : donne un autre découpage des saisons)
     Sargasses Guadeloupe : https://www.linfodurable.fr/guadeloupe-une-veille-sanitaire-instauree-apres-des-echouements-massifs-de-sargasses-56115 (8 mai 2026)
   - paindesucre : https://www.lesilesdeguadeloupe.com/en/explore/the-beaches-of-guadeloupe/pain-de-sucre-beach-les-saintes/ ,
       https://www.lesilesdeguadeloupe.com/en/natural-heritage/plage-du-pain-de-sucre/ , OSM way 93659822 (https://nominatim.openstreetmap.org)
       photo : https://commons.wikimedia.org/wiki/File:Pain_de_sucre_-_Saintes.jpg
   - caravelle : https://www.lesilesdeguadeloupe.com/decouvrir/les-plages/plage-de-la-caravelle/ , OSM way 54890284
       photo : https://commons.wikimedia.org/wiki/File:Plage_de_la_Caravelle_St-Anne_(6).jpg
   - feuillere : https://www.lesilesdeguadeloupe.com/decouvrir/les-plages/la-feuillere/ , OSM way 487915679
       photo : https://commons.wikimedia.org/wiki/File:Plage_Feuillere.jpg
   - souffleur : https://www.lesilesdeguadeloupe.com/decouvrir/les-plages/plage-du-souffleur/ , OSM way 383291870
       photo : https://commons.wikimedia.org/wiki/File:Port_Louis_beach_(guadeloupe).jpg
   - Saison Martinique (fondsblancs, diamant) : https://www.martinique.org/en/blog/highlights/when-go
     Sargasses Martinique : https://meteofrance.mq/fr/sargasses/bilan-2025-des-echouements-de-sargasses-en-martinique (24/12/2025)
   - fondsblancs : https://www.martinique.org/fr/blog/nature/pour-vous-jai-teste-les-fonds-blancs-en-martinique , OSM way 903851062 (Baignoire de Joséphine)
       photo : https://commons.wikimedia.org/wiki/File:Baignoire_de_Josephine.jpg
   - diamant : https://figaronautisme.meteoconsult.fr/actus-nautisme-loisirs/2025-12-28/32660-la-perle-et-le-diamant-deux-joyaux-pour-plonger-en-martinique ,
       https://fr.wikipedia.org/wiki/Rocher_du_Diamant , OSM way 42727196 (recoupé avec Wikipédia 14,443 / -61,039)
       photo : https://commons.wikimedia.org/wiki/File:Diamond_Rock_aerial.jpg
   - colombier : https://fr.wikipedia.org/wiki/Colombier_(Saint-Barth%C3%A9lemy) , https://www.saintbarth-tourisme.com/discover (saison), OSM node 4901825533
       photo : https://commons.wikimedia.org/wiki/File:Anse_Colombier_anchorage,_St._Barths_-_panoramio.jpg
   - Saison Saint-Martin (tintamarre, creolerock) : https://www.st-martin.org/us/learn-more/geography-and-climate/tropical-sweetness/
   - tintamarre : https://reservenaturelle-saint-martin.com/en/sites-fragiles-decouvrir/tintamare , https://www.st-martin.org/us/activity/tintamarre/ ,
       https://fr.wikipedia.org/wiki/%C3%8Ele_Tintamarre , OSM relation 7577001 (recoupé avec Wikipédia 18,119 / -62,980)
       photo : https://commons.wikimedia.org/wiki/File:Tintamarre_Island.jpg
   - creolerock : https://reservenaturelle-saint-martin.com/en/sites-fragiles-decouvrir/creole-rock , https://fr.wikipedia.org/wiki/Rocher_Cr%C3%A9ole , OSM way 151643402
       photo : https://commons.wikimedia.org/wiki/File:Rocher_Creole.jpg
   - lasgatas : https://www.lonelyplanet.com/points-of-interest/playa-las-gatas/496280 , https://en.wikipedia.org/wiki/Ixtapa-Zihuatanejo ,
       https://weatherspark.com/y/4406/Average-Weather-in-Ixtapa-Zihuatanejo-Mexico-Year-Round (saison, eau) , OSM way 552653132
       photo : https://commons.wikimedia.org/wiki/File:Playa_Las_Gatas_-_panoramio.jpg
   - carneiros : https://pt.wikipedia.org/wiki/Praia_dos_Carneiros , https://www.360meridianos.com/dica/praia-dos-carneiros-pernambuco , OSM way 762113426
       photo : https://commons.wikimedia.org/wiki/File:Praia_dos_Carneiros_o_Para%C3%ADso_Brasileiro.jpg
   - saona : https://en.wikipedia.org/wiki/Saona_Island (point 18,1556 / -68,6994) , https://www.godominicanrepublic.com/destinations/bayahibe ,
       https://www.godominicanrepublic.com/travel/travel-tips
       photo : https://commons.wikimedia.org/wiki/File:2023_-_Saona_Island_-_15.jpg */
const label=(s)=>'Fiche Ocean Buddy · décembre 2026 · d’après '+s+' · à vérifier localement';
module.exports=[
{"id":"paindesucre","name":"Pain de Sucre — Terre-de-Haut (Les Saintes)","loc":"Terre-de-Haut, Les Saintes, Guadeloupe","country":"Guadeloupe","world":"na","lat":15.8635,"lon":-61.5988,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Petite crique de sable au pied de la colline volcanique du Pain de Sucre, à Terre-de-Haut. Le Comité du tourisme des Îles de Guadeloupe parle d’eaux cristallines et de cocotiers, et range le snorkeling ici parmi les meilleurs des Saintes : poissons tropicaux, coraux et étoiles de mer. On y va à pied en 30 à 45 minutes depuis le bourg, ou en excursion en bateau. Décembre et janvier tombent dans la saison sèche (de décembre à mai), avec une mer à 27 °C.",
 "tip":"Mets des chaussures fermées pour la descente caillouteuse, reste près du bord avec des enfants et observe coraux et poissons sans les toucher.",
 "dangers":[["🛟","Plage non surveillée : sois prudent, surtout avec de jeunes enfants ou si tu t’éloignes du bord."],["🥾","La fin du chemin est une descente caillouteuse : mets des chaussures fermées."],["🪸","Observe coraux et poissons sans les toucher, avec une crème solaire respectueuse des récifs."],["🌿","Des sargasses s’échouent par moments en Guadeloupe : en mai 2026, la préfecture a lancé une veille sanitaire, avec une pré-alerte à Grande-Anse, sur Terre-de-Bas. Renseigne-toi avant de partir."]],
 "photoContext":"Plage du Pain de Sucre, Terre-de-Haut",
 "sourceLabel":label("le Comité du tourisme des Îles de Guadeloupe et L’Info Durable")},
{"id":"caravelle","name":"Plage de la Caravelle — Sainte-Anne","loc":"Sainte-Anne, Grande-Terre, Guadeloupe","country":"Guadeloupe","world":"na","lat":16.2182,"lon":-61.3945,"sports":["windsurf","kitesurf","paddle","snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable blanc à l’entrée de Sainte-Anne, entre Le Gosier et Saint-François. Une barrière de corail la protège : l’eau est calme et peu profonde, et les cocotiers donnent de l’ombre. Le Comité du tourisme des Îles de Guadeloupe y annonce des conditions idéales pour la planche à voile, le kitesurf et le paddle, avec du matériel à louer sur place, et un lagon à explorer au masque et au tuba (poissons-perroquets, poissons-chirurgiens, parfois une tortue). Décembre et janvier tombent dans la saison sèche (de décembre à mai), avec une mer à 27 °C.",
 "tip":"Le matériel de planche à voile, de kitesurf et de paddle se loue sur place : demande conseil avant de partir au large.",
 "dangers":[["🪁","Planche à voile, kitesurf, paddle et jet-ski se pratiquent dans le même lagon : garde tes distances."],["🌿","Des sargasses s’échouent par moments en Guadeloupe : en mai 2026, la préfecture a lancé une veille sanitaire, avec une pré-alerte au lagon de Saint-François, plus à l’est. Renseigne-toi avant de partir."]],
 "photoContext":"Plage de la Caravelle, Sainte-Anne",
 "sourceLabel":label("le Comité du tourisme des Îles de Guadeloupe et L’Info Durable")},
{"id":"feuillere","name":"Plage de la Feuillère — Marie-Galante","loc":"Capesterre, Marie-Galante, Guadeloupe","country":"Guadeloupe","world":"na","lat":15.8884,"lon":-61.223,"sports":["kitesurf","snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable fin et d’eau turquoise à Capesterre, à Marie-Galante. Selon le Comité du tourisme des Îles de Guadeloupe, les alizés constants en font un spot de kitesurf réputé, et les herbiers marins abritent poissons colorés et tortues, à découvrir au masque et au tuba. On y arrive en voiture depuis le bourg, et un parking gratuit borde la plage. Décembre et janvier tombent dans la saison sèche (de décembre à mai), avec une mer à 27 °C.",
 "tip":"Baigne-toi près du rivage, surtout par mer calme, et regarde les herbiers depuis la surface plutôt que de les piétiner.",
 "dangers":[["🛟","Plage non surveillée : reste vigilant, surtout avec des enfants ou des nageurs moins expérimentés."],["🪁","Spot de kitesurf par alizés constants : garde tes distances avec les ailes."],["🌿","Les herbiers marins sont fragiles : ne les piétine pas."],["🌿","Des sargasses s’échouent par moments en Guadeloupe : en mai 2026, la préfecture a lancé une veille sanitaire. Renseigne-toi avant de partir."]],
 "photoContext":"Plage de la Feuillère, Capesterre-de-Marie-Galante",
 "sourceLabel":label("le Comité du tourisme des Îles de Guadeloupe et L’Info Durable")},
{"id":"souffleur","name":"Plage du Souffleur — Port-Louis","loc":"Port-Louis, Grande-Terre, Guadeloupe","country":"Guadeloupe","world":"na","lat":16.4286,"lon":-61.5357,"sports":["surf","snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable doré à Port-Louis, sur la côte nord-ouest de Grande-Terre, bordée de cocotiers et de raisiniers. Selon le Comité du tourisme des Îles de Guadeloupe, l’eau est calme et limpide, avec du snorkeling près des zones rocheuses (poissons tropicaux, oursins, coraux). Après une courte marche, un spot de surf prisé des surfeurs t’attend. Décembre et janvier tombent dans la saison sèche (de décembre à mai), avec une mer à 27 °C.",
 "tip":"Baigne-toi dans les zones fréquentées, surtout par temps agité, et prends une crème solaire respectueuse des récifs.",
 "dangers":[["🛟","La plage n’est pas officiellement surveillée : sois vigilant, surtout hors des zones fréquentées ou par temps agité."],["🪨","Le snorkeling se fait près des zones rocheuses et le spot de surf est à une courte marche : regarde la mer avant d’entrer."],["🌿","Des sargasses s’échouent par moments en Guadeloupe : en mai 2026, la préfecture a lancé une veille sanitaire. Renseigne-toi avant de partir."]],
 "photoContext":"Plage du Souffleur, Port-Louis",
 "sourceLabel":label("le Comité du tourisme des Îles de Guadeloupe et L’Info Durable")},
{"id":"fondsblancs","name":"Baignoire de Joséphine — Le François","loc":"Baie du François, Martinique","country":"Martinique","world":"na","lat":14.6285,"lon":-60.8495,"sports":["baignade","snorkeling"],"level":"variable","waterType":"sea",
 "desc":"Haut-fond de sable blanc dans la baie du François, entre l’îlet Oscar et l’îlet Thierry. Martinique Tourisme en fait le Fond Blanc le plus célèbre de l’île : l’eau est claire, chaude et très peu profonde, et on a pied en pleine mer. On y va en bateau ou en catamaran, pour se baigner ou nager avec masque et tuba. La saison sèche court de décembre à mai environ.",
 "tip":"Prends des chaussures d’eau pour marcher sur les fonds et une crème solaire biodégradable, et suis les consignes des guides.",
 "dangers":[["🚤","On ne rejoint les Fonds Blancs qu’en bateau ou en catamaran."],["🪸","Les Fonds Blancs sont fragiles : suis les consignes des guides pour les préserver."],["☀️","Le soleil tape fort sur l’eau : lunettes, chapeau et crème solaire biodégradable."],["🌿","Les sargasses touchent la façade atlantique de la Martinique : en 2025, les premières arrivées datent de décembre 2024, selon Météo-France Martinique. Regarde son bulletin avant de partir."]],
 "photoContext":"Baignoire de Joséphine, baie du François",
 "sourceLabel":label("Martinique Tourisme et Météo-France Martinique")},
{"id":"diamant","name":"Rocher du Diamant — Le Diamant","loc":"Le Diamant, Martinique","country":"Martinique","world":"na","lat":14.4432,"lon":-61.0391,"sports":["plongee"],"level":"variable","waterType":"sea",
 "desc":"Îlot inhabité de 175 m de haut, à environ 2 km de la côte, face à la commune du Diamant. Selon Figaro Nautisme, c’est l’un des sites de plongée emblématiques de la Martinique : tombants, platier, arche et faille sous-marine, éponges, gorgones, coraux, et des tortues régulièrement. Les plongées se font dans une vingtaine de mètres, mais les parois descendent bien plus bas, jusqu’à 40 m, voire 60 m. La saison sèche court de décembre à mai environ, avec une mer calme côté Caraïbes.",
 "tip":"Renseigne-toi sur le courant avant la sortie et choisis une plongée adaptée à ton brevet.",
 "dangers":[["🌀","Le rocher est soumis aux courants."],["🚫","Débarquement et mouillage interdits en dehors des bouées réservées."],["🧭","Les parois plongent jusqu’à 40 m, voire 60 m selon la face : reste dans les limites de ta certification."]],
 "photoContext":"Rocher du Diamant, Le Diamant",
 "sourceLabel":label("Figaro Nautisme, Wikipédia et Martinique Tourisme")},
{"id":"colombier","name":"Anse de Colombier — Saint-Barthélemy","loc":"Colombier, Saint-Barthélemy","country":"Saint-Barthélemy","world":"na","lat":17.9242,"lon":-62.8709,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Longue plage de sable blanc sous le vent, à l’extrême nord-ouest de Saint-Barth, dans la réserve naturelle marine. C’est la dernière plage de l’île non desservie par une route : on y vient à pied ou en bateau. Wikipédia décrit une baie aux eaux calmes, avec des formations rocheuses et un herbier visité par des tortues vertes, idéale pour le snorkeling. La saison sèche et douce va de décembre à mai, et la mer peut monter à 29 °C, selon Saint-Barth Tourisme.",
 "tip":"Si tu viens à pied, emporte de l’eau, un chapeau et de bonnes chaussures : il n’y a ni installation ni beaucoup d’ombre sur la plage.",
 "dangers":[["🥾","Le sentier facile part de Petite Anse (environ 20 minutes) ; celui qui part du sommet du Colombier n’est pas recommandé aux personnes âgées et aux jeunes enfants."],["⛵","Certains jours, surtout le dimanche, le mouillage est plein de bateaux : fais attention aux embarcations."],["🐢","Plage dans la réserve naturelle marine : respecte les tortues et les herbiers."]],
 "photoContext":"Anse de Colombier, Saint-Barthélemy",
 "sourceLabel":label("Wikipédia et Saint-Barth Tourisme")},
{"id":"tintamarre","name":"Île Tintamarre — Saint-Martin","loc":"Île Tintamarre, Saint-Martin","country":"Saint-Martin","world":"na","lat":18.1189,"lon":-62.9804,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Île inhabitée à environ 3 km au nord-est de Saint-Martin, dans la réserve naturelle nationale. On mouille au sud-ouest, devant la Baie Blanche et sa plage de sable blanc. La réserve décrit un très joli site de snorkeling le long de la pointe nord, à quelques coups de palmes, et l’office de tourisme parle d’une eau claire où l’on croise parfois une tortue. La saison sèche, de décembre à avril, est la plus agréable : soleil presque constant et très peu de pluie.",
 "tip":"En bateau, amarre-toi à l’une des bouées jaunes de la réserve ; si tu mouilles, reste sur le sable.",
 "dangers":[["⚓","Réserve naturelle : 17 bouées jaunes sont installées, et un bateau de moins de 33 pieds peut jeter l’ancre seulement sur un fond de sable."],["🐦","Seul lieu de nidification du noddi brun, une espèce en danger : respecte la tranquillité de la zone."],["🚫","Dans la réserve, prendre de l’argile et mouiller à North Curve Bay sont interdits."],["💨","Île très exposée aux éléments : soleil fort et vents puissants, selon l’office de tourisme."],["🥾","Mets au moins des tongs pour marcher derrière la plage."]],
 "photoContext":"Plage de l’île Tintamarre, Saint-Martin",
 "sourceLabel":label("la Réserve naturelle de Saint-Martin, l’office de tourisme de Saint-Martin et Wikipédia")},
{"id":"creolerock","name":"Rocher Créole — Grand-Case","loc":"Grand-Case, Saint-Martin","country":"Saint-Martin","world":"na","lat":18.1179,"lon":-63.0561,"sports":["plongee","snorkeling"],"level":"variable","waterType":"sea",
 "desc":"Îlot rocheux de Saint-Martin, au large de Grand-Case, entièrement protégé dans la réserve naturelle nationale. La réserve le range parmi les meilleurs sites de plongée du côté français, pour les débutants comme pour les confirmés : l’eau y est peu profonde, idéale pour apprendre à plonger, avec ou sans bouteille. Des fous bruns et des phaétons nichent sur le rocher. La saison sèche, de décembre à avril, est la plus agréable : soleil presque constant et très peu de pluie.",
 "tip":"Amarre-toi sur la bonne bouée : jaune pour les bateaux de plaisance, blanche « diving only » pour les clubs de plongée, blanche « dinghy only » pour les annexes.",
 "dangers":[["⚓","Mouillage sur les bouées de la réserve seulement : prends la bonne pour ne pas abîmer les mouillages."],["🚫","Moteurs interdits à moins de 30 m de la plage ; débarquer sur la plage et escalader le rocher aussi."],["🐦","Fous bruns et phaétons nichent sur le rocher : ne le grimpe pas."]],
 "photoContext":"Rocher Créole, Saint-Martin",
 "sourceLabel":label("la Réserve naturelle de Saint-Martin, Wikipédia et l’office de tourisme de Saint-Martin")},
{"id":"lasgatas","name":"Playa Las Gatas — Zihuatanejo","loc":"Zihuatanejo, Guerrero, Mexique","country":"Mexique","world":"na","lat":17.6209,"lon":-101.5515,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de l’autre côté de la baie de Zihuatanejo, atteinte en bateau depuis le ponton de la ville. Un récif de corail et une barrière de pierre construite par l’homme calment les vagues : Wikipédia en fait la plage de snorkeling la plus populaire de Zihuatanejo, avec des poissons tropicaux le long du brise-lames et beaucoup de coraux. Lonely Planet ajoute que les enfants peuvent s’y baigner. Selon WeatherSpark, la saison des pluies va de début juin à mi-octobre, et l’eau est autour de 29 °C en décembre et de 28 °C en janvier.",
 "tip":"Prends un bateau au ponton de Zihuatanejo : le matériel de snorkeling se loue dans les cabanes de la plage.",
 "dangers":[["🦔","Oursins dans l’eau, signale Lonely Planet."],["🌊","Plage à l’entrée de la baie, ouverte aux brises de l’océan : les vagues y sont plus fortes, mais moins que sur les plages face au large, grâce au récif et à la barrière de pierre."],["🚤","Pas de route goudronnée : on y vient en bateau, ou par un petit sentier rocheux depuis Playa La Ropa."],["👥","Plage encombrée de transats et de restaurants, note Lonely Planet."]],
 "photoContext":"Playa Las Gatas, Zihuatanejo",
 "sourceLabel":label("Lonely Planet, Wikipédia et WeatherSpark")},
{"id":"carneiros","name":"Praia dos Carneiros — Tamandaré","loc":"Tamandaré, Pernambuco, Brésil","country":"Brésil","world":"sa","lat":-8.6967,"lon":-35.0887,"sports":["baignade","snorkeling"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable clair et de hauts cocotiers à Tamandaré, à environ 113 km de Recife. Selon Wikipédia, l’eau y est calme et chaude presque toute l’année : l’embouchure du rio Formoso et une grande barrière de récifs forment des piscines naturelles à marée basse. La petite chapelle São Benedito est considérée comme la carte postale du lieu. Meilleure période de septembre à février, et octobre à décembre sont les mois les plus ensoleillés.",
 "tip":"Vise la marée basse pour les piscines naturelles, emporte masque et tuba, et ne marche pas sur les récifs.",
 "dangers":[["🪸","Ne marche pas sur les récifs : tu abîmes la faune fragile."],["🚶","Par la terre, on passe par une propriété privée avec des restaurants à consommation minimale ; l’autre accès est le bateau, ou environ 7 km de marche sur le sable depuis Tamandaré."],["🌧️","Les jours de pluie, le débit du fleuve augmente et l’eau de l’estuaire change de couleur et de température."]],
 "photoContext":"Praia dos Carneiros, Tamandaré",
 "sourceLabel":label("Wikipédia (portugais) et 360 Meridianos")},
{"id":"saona","name":"Île Saona","loc":"La Altagracia, République dominicaine","country":"République dominicaine","world":"na","lat":18.1556,"lon":-68.6994,"sports":["baignade"],"level":"variable","waterType":"sea",
 "desc":"Île de 110 km² à 2,4 km de la côte sud-est de la République dominicaine, dans le parc national Cotubanamá. Le ministère du Tourisme dominicain la dit connue pour ses plages, ses palmiers et ses piscines naturelles. Selon Wikipédia, elle est entourée de bancs de sable et de récifs coralliens, et les plages les plus ouvertes sont au sud et à l’ouest. Selon le ministère, le temps est plus sec de décembre à avril à Bayahibe, et décembre à début mars sont les mois les plus agréables du pays.",
 "tip":"Passe par une excursion en bateau depuis Bayahibe, le principal point d’accès : les départs ont lieu tous les jours.",
 "dangers":[["🚤","L’île se rejoint en bateau, depuis Bayahibe."],["🐢","Aire protégée et site de ponte des tortues marines le plus important du pays : respecte la faune et les consignes du parc."],["👥","Plus d’un million de visiteurs par an, selon Wikipédia : attends-toi à du monde."]],
 "photoContext":"Île Saona, République dominicaine",
 "sourceLabel":label("Wikipédia et le ministère du Tourisme de la République dominicaine")},
];
