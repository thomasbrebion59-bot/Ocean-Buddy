/* Édition « Noël au soleil » (décembre 2026) — zone Océanie et Pacifique : 12 nouveaux spots.
   À fusionner dans catalog.json avec le même mécanisme que new-spots-2026-10.cjs :
   node scripts/add-spots.cjs data/new-spots-2026-12-oceanie.cjs data/new-spot-photos-2026-12-oceanie.json catalogue-2026-12
   Faits : pages réellement ouvertes le 2026-11-03 (détail fait par fait dans data/sources/new-spots-2026-12-oceanie.md).
   Coordonnées : OpenStreetMap (Nominatim), Wikipédia ou fiche officielle Tahiti Tourisme (voir ci-dessous).
   Aucun fait sans source ; niveau « variable » quand aucune source ne le donne.
   Textes non relus sur place : editorialStatus « unverified », à vérifier localement.
   Saison cyclonique (Pacifique tropical) et saison des méduses (nord du Queensland) signalées dans les dangers, avec source.

   URL consultées (toutes ouvertes le 2026-11-03) :

   Sources communes (mer en janvier) :
   - https://www.seatemperatu.re/oceania/australia/month/january/ (Sydney 22,8 °C ; Gold Coast 25,8 °C ; Cairns 29,3 °C)
   - https://seatemperature.info/january/new-south-wales-water-temperature.html (Byron Bay : moyenne 25,9 °C en janvier)
   - https://www.climatsetvoyages.com/climat/polynesie-francaise (îles de la Société : mer ~28 °C en décembre, ~29 °C en janvier à Bora Bora ; cyclones de novembre à avril, surtout de décembre à mars ; meilleure période de juin à septembre)
   - https://www.lonelyplanet.fr/destinations/oceanie-pacifique/la-polynesie-francaise/tahiti/quand-partir (Tahiti : saison humide novembre-avril, décembre et janvier parmi les mois les plus pluvieux)
   - https://www.climatsetvoyages.com/climat/nouvelle-caledonie (Nouméa : mer ~27 °C en janvier ; cyclones de novembre à mi-mai, plus probables de fin décembre à début avril)
   - https://www.climatsetvoyages.com/climat/wallis-et-futuna (Wallis : mer 29 °C en décembre et janvier ; pluies 345 et 395 mm ; mêmes dates de cyclones)

   gordonsbay (Gordons Bay — Coogee) :
   - https://en.wikipedia.org/wiki/Gordon's_Bay_(Australia)
   - https://secretsydney.com/gordons-bay-underwater-nature-trail/
   - http://www.abyss.com.au/blog/dive-sites/gordons-bay-sydney-guide (reprend la fiche de Randwick City Council ; la page randwick.nsw.gov.au répond 403, non lue)
   - Coordonnées : Nominatim, way 614292138 « Gordons Bay/Beach Stream » (-33,9148 ; 151,2613) ; nœud OSM « Gordons Bay Underwater Trip Start » (-33,9158 ; 151,2648) à 2,98 km de Bondi, d’où le choix du premier point
   - Photo : https://commons.wikimedia.org/wiki/File:(1)Gordons_Bay_Coogee-1.jpg

   julianrocks (Julian Rocks — Byron Bay) :
   - https://en.wikipedia.org/wiki/Nguthungulli_Julian_Rocks_Nature_Reserve
   - https://www.visitnsw.com/articles/best-snorkelling-in-nsw
   - https://byronbay.com/julian-rocks/
   - https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/julian-rocks-nguthungulli-nature-reserve
   - https://www.visitnsw.com/things-to-do/tours/blue-seafaris/snorkel-byron-bay
   - Coordonnées : Nominatim « Nguthungulli Julian Rocks » (-28,6115 ; 153,6289), Wikipédia -28,6114 ; 153,6289
   - Photo : https://commons.wikimedia.org/wiki/File:Into_The_Light_(Julian_Rocks).jpg

   fourmilebeach (Four Mile Beach — Port Douglas) :
   - https://douglas.qld.gov.au/beaches-foreshores/
   - https://en.wikipedia.org/wiki/Port_Douglas
   - https://archive.newsport.com.au/2020/january/four-mile-beach-closed-after-stinger-found-in-net
   - (beachsafe.org.au : application JavaScript, aucun texte lisible ; non utilisée)
   - Coordonnées : Nominatim « Four Mile Beach » (-16,5071 ; 145,4674)
   - Photo : https://commons.wikimedia.org/wiki/File:Four_Mile_Beach,_Port_Douglas,_Queensland,_2020_03.jpg

   geoffreybay (Geoffrey Bay — Magnetic Island) :
   - https://thisismagneticisland.com.au/snorkel
   - https://thisismagneticisland.com.au/on-the-ocean
   - https://en.wikipedia.org/wiki/Geoffrey_Bay
   - https://en.wikipedia.org/wiki/Magnetic_Island
   - Coordonnées : Nominatim « Geoffrey Bay Snorkel Trail » (-19,1531 ; 146,8678), Wikipédia Geoffrey Bay -19,155 ; 146,865
   - Photo : https://commons.wikimedia.org/wiki/File:Geoffrey_Bay,_Magnetic_Island.JPG

   hamelinbay (Hamelin Bay — Margaret River) :
   - https://www.westernaustralia.com/us/things-to-do/beaches-and-lakes/beaches/margaret-river-region-beaches
   - https://www.westernaustralia.com/au/plan-my-trip/planning-tools/travel-stories/bays-beaches-and-sting-rays-in-the-margaret-river-region
   - https://perthisok.com/best-of-wa/hamelin-bay
   - https://en.wikipedia.org/wiki/Hamelin_Bay,_Western_Australia
   - https://en.wikipedia.org/wiki/Margaret_River,_Western_Australia (été chaud, ensoleillé, brises marines)
   - Coordonnées : Nominatim, accès d’urgence « Hamelin Bay, Hamelin Bay Road » (-34,2199 ; 115,0311), Wikipédia -34,231 ; 115,047
   - Photo : https://commons.wikimedia.org/wiki/File:Hamelin_Bay,_Western_Australia,_February_2021_01.jpg

   surfersparadise (Surfers Paradise — Gold Coast) :
   - https://www.goldcoast.qld.gov.au/Things-to-do/Gold-Coast-beaches/Beach-locations/Surfers-Paradise
   - https://lifesaving.com.au/clubs-and-beaches/surfers-paradise-main-beach
   - Coordonnées : Nominatim « Surfers Paradise Beach » (-27,9973 ; 153,4315)
   - Photo : https://commons.wikimedia.org/wiki/File:Surfers_Paradise,_Gold_Coast,_Australia_(Ank_Kumar)_01.jpg

   maupiti (Lagon de Maupiti — plage de Tereia) :
   - https://www.tahititourisme.com/islands/maupiti/
   - https://www.tahititourisme.com/watching-manta-rays-in-maupiti/
   - https://www.routard.com/guide_voyage_lieu/4455-maupiti.htm
   - Coordonnées : Nominatim « Terei’a » (-16,4488 ; -152,2749)
   - Photo : https://commons.wikimedia.org/wiki/File:Maupiti,_Polyn%C3%A9sie_Fran%C3%A7aise_(30599653413).jpg

   avea (Baie d’Avea — Huahine) :
   - https://tahititourisme.pf/touristic_sheet/plage-de-avea-huahine-en-en-pf-3342815 (fiche officielle, coordonnées -16,807474 ; -150,979460)
   - https://www.snorkeling-report.com/fr/spot/snorkeling-baie-avea-hotel-mahana-huahine/
   - https://www.tahititourisme.com/islands/huahine/
   - Photo : https://commons.wikimedia.org/wiki/File:PICT0042_French_Polyn%C3%A9sia_Huahin%C3%A9_Iti_Island_Av%C3%A9a_Bay_Lagoon_(8228941841).jpg

   mouli (Pont de Mouli — Ouvéa) :
   - https://www.routard.com/fr/guide/oceanie/nouvelle-caledonie/iles-loyaute/ouvea/presqu-ile-de-mouli
   - https://fr.wikipedia.org/wiki/Ouvéa
   - Coordonnées : Nominatim « Plage du Pont de Mouli » (-20,6982 ; 166,4736)
   - Photo : https://commons.wikimedia.org/wiki/File:Pont_de_Mouli_2023.jpg

   kanumera (Baie de Kanuméra — Île des Pins) :
   - https://www.routard.com/fr/guide/oceanie/nouvelle-caledonie/ile-des-pins/anse-de-kanumera
   - https://www.routard.com/fr/guide/oceanie/nouvelle-caledonie/ile-des-pins/baie-de-kuto
   - https://www.snorkeling-report.com/fr/spot/snorkeling-baie-kanumera-ile-des-pins/
   - Coordonnées : Nominatim « Plage de Kanuméra » (-22,6619 ; 167,4446)
   - Photo : https://commons.wikimedia.org/wiki/File:Kanumera_Bay,_Isle_of_Pines,_New_Caledonia,_2007_(1).JPG

   ilotmaitre (Îlot Maître — Nouméa) :
   - https://fr.wikipedia.org/wiki/Îlot_Maître
   - https://www.snorkeling-report.com/fr/spot/snorkeling-ilot-maitre/
   - Coordonnées : Wikipédia fr (-22,3339 ; 166,4069)
   - Photo : aucune correcte sur Commons (seule « Plage est de l’îlot maître, spot de kitesurf » : ciel gris, kites au sol, format portrait) ; fiche livrée sans photo

   nukuhione (Nukuhione — lagon de Wallis) :
   - https://fr.wikipedia.org/wiki/Nukuhione
   - https://www.france.fr/fr/article/iles-de-wallis-et-futuna-que-faire-que-voir/
   - https://www.france.fr/fr/article/voyage-hors-des-circuits-touristiques-les-paradis-preserves-de-wallis-et/
   - https://travel.padi.com/fr/diving-in/wallis-et-futuna/
   - https://www.lnc.nc/article/wallis-et-futuna/des-meduses-envahissent-le-lagon
   - Coordonnées : Wikipédia fr (-13,2739 ; -176,1332)
   - Photo : https://commons.wikimedia.org/wiki/File:WALLIS_-_Nukuhione.jpg */
const label=(s)=>'Fiche Ocean Buddy · décembre 2026 · d’après '+s+' · à vérifier localement';
module.exports=[
{"id":"gordonsbay","name":"Gordons Bay — Coogee","loc":"Coogee, Sydney, Nouvelle-Galles du Sud, Australie","country":"Australie","world":"oc","lat":-33.9148,"lon":151.2613,"sports":["snorkeling","plongee","baignade"],"level":"variable","waterType":"sea",
 "desc":"Petite baie de Sydney entre Clovelly et Coogee, encadrée de deux falaises, que l’on ne rejoint qu’à pied par le sentier côtier. Un parcours sous-marin de 600 m, à faire seul en snorkeling ou en plongée, la traverse : des bidons remplis de béton reliés par des chaînes et des plaques sur la vie marine le jalonnent. À Sydney, la mer est à 22,8 °C en moyenne en janvier (seatemperatu.re).",
 "tip":"Viens par un jour clair et ensoleillé, regarde plusieurs séries de vagues avant d’entrer et prévois de marcher : il n’y a pas de parking au bord de l’eau, seulement aux plages de Coogee et de Clovelly. Les week-ends chauds, la baie est plus fréquentée.",
 "dangers":[["🛟","Baie non surveillée : ni sauveteurs ni maîtres-nageurs sur place."],["🪨","Entrée par les rochers : algues et roche glissent, et le ressac peut rendre la sortie difficile."],["🪼","Physalies (bluebottles) et requins sont rares, mais des panneaux les signalent."],["🚫","Réserve aquatique de Bronte–Coogee : pêche sous-marine interdite, et le blue groper est protégé."]],
 "fauna":"blue gropers (protégés), seiches, labres et raies.",
 "sourceLabel":label("Wikipédia (Gordon’s Bay), Secret Sydney, Abyss et seatemperatu.re")},
{"id":"julianrocks","name":"Julian Rocks (Nguthungulli) — Byron Bay","loc":"Byron Bay, Nouvelle-Galles du Sud, Australie","country":"Australie","world":"oc","lat":-28.6115,"lon":153.6289,"sports":["snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Deux petits îlots rocheux à 2,5 km de Byron Bay, dans la réserve de Nguthungulli et le parc marin du cap Byron. On les rejoint par une courte traversée en bateau. Selon Visit NSW, c’est le point le plus au sud pour de nombreuses espèces d’eau chaude : tortues caouannes, requins-léopards, raies manta. Les requins gris nourrice, d’eau plus fraîche, y passent aussi. Selon Visit NSW, la fin de l’été donne l’eau la plus chaude et la meilleure visibilité ; à Byron Bay, la mer est à 25,9 °C en moyenne en janvier (seatemperature.info).",
 "tip":"Les requins-léopards se voient surtout de décembre à mai aux Needles, selon byronbay.com. Renseigne-toi auprès d’un opérateur de Byron Bay pour la traversée, et ne touche ni ne prélève rien : la réserve est protégée.",
 "dangers":[["🚤","Accès en bateau : les rochers sont à 2,5 km de la côte."],["🚫","Collecter ou détruire des animaux est interdit, et la pêche sous-marine aussi. Toute pêche est bannie à moins de 500 m des rochers."],["🦈","Habitat important du requin gris nourrice : garde tes distances avec la faune."],["ℹ️","Les rochers ont une grande importance pour le peuple Arakwal : les aînés demandent qu’ils soient protégés de tout mauvais usage."]],
 "fauna":"tortues, raies manta, requins-léopards, requins gris nourrice, wobbegongs et nudibranches.",
 "sourceLabel":label("Wikipédia (réserve Nguthungulli Julian Rocks), Visit NSW, byronbay.com, NSW Government et seatemperature.info")},
{"id":"fourmilebeach","name":"Four Mile Beach — Port Douglas","loc":"Port Douglas, Queensland, Australie","country":"Australie","world":"oc","lat":-16.5071,"lon":145.4674,"sports":["baignade"],"level":"variable","waterType":"sea",
 "desc":"Longue plage de sable doré bordée de palmiers, à Port Douglas, dans le nord du Queensland. Une zone de baignade protégée par un filet anti-méduses est installée dans l’eau pendant la saison des méduses, et des sauveteurs patrouillent à certaines heures (Douglas Shire Council). Dans la région de Cairns, la mer est à 29,3 °C en moyenne en janvier (seatemperatu.re).",
 "tip":"Baigne-toi seulement dans le filet, entre les drapeaux rouge et jaune, et demande conseil aux sauveteurs. Pendant la saison des méduses, mets une combinaison intégrale (néoprène ou lycra) et entre dans l’eau doucement.",
 "dangers":[["🪼","Saison des méduses (stingers) en général de novembre à mai : décembre et janvier en font partie. Le filet protège bien contre la méduse-boîte, mais pas à 100 %."],["🚩","La plage peut fermer quand des méduses sont présentes : en janvier 2020, une méduse Irukandji trouvée dans le filet a fait fermer la plage 24 heures."],["🛟","Les sauveteurs ne patrouillent qu’à certaines heures : renseigne-toi avant d’entrer dans l’eau."]],
 "sourceLabel":label("Douglas Shire Council, Wikipédia (Port Douglas), Newsport et seatemperatu.re")},
{"id":"geoffreybay","name":"Geoffrey Bay — Magnetic Island","loc":"Magnetic Island, Queensland, Australie","country":"Australie","world":"oc","lat":-19.1531,"lon":146.8678,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Baie à grande plage de sable sur Magnetic Island, à 8 km de Townsville, devant Arcadia. L’épave du voilier Moltke repose dans la baie. Un parcours de snorkeling part de Marine Parade, à environ 400 m du rivage, avec quatre bouées numérotées : on y voit des bénitiers géants et, par temps clair, l’épave. Le site de tourisme de l’île décrit un environnement idéal pour nager toute l’année.",
 "tip":"Mets une combinaison anti-méduses de novembre à avril. L’eau se trouble pendant et après les vents de sud-est, et les marées très hautes ou très basses autour des nouvelles et pleines lunes sont à éviter.",
 "dangers":[["🪼","Saison des méduses de novembre à avril : porte une combinaison anti-méduses (stinger suit)."],["🪸","Ne te tiens pas debout sur le corail et ne t’accroche pas aux bouées du parcours."],["⚠️","Le snorkeling peut être fatigant même par eau calme : prudence si tu débutes ou si tu as un souci de santé."]],
 "fauna":"bénitiers géants.",
 "sourceLabel":label("This Is Magnetic Island et Wikipédia (Geoffrey Bay, Magnetic Island)")},
{"id":"hamelinbay","name":"Hamelin Bay — Margaret River","loc":"Margaret River, Australie-Occidentale, Australie","country":"Australie","world":"oc","lat":-34.2199,"lon":115.0311,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Grande baie de sable ouverte, entre le cap Leeuwin et le cap Naturaliste, à une demi-heure de route de Margaret River. Elle est célèbre pour ses raies, qui mesurent jusqu’à deux mètres de large et nagent autour des baigneurs. On y nage et on y fait du snorkeling ; plusieurs épaves reposent au large. Dans la région, l’été est chaud, souvent ensoleillé, avec des brises marines (Wikipédia, Margaret River).",
 "tip":"Laisse les raies venir à toi, sans les poursuivre ni les toucher. Va-y tôt le matin, avant la foule, la marée et le vent.",
 "dangers":[["🐟","Raies sauvages : ne les harcèle pas et ne les touche pas."],["🪨","Récifs et rochers dans la baie, très exposée au mauvais temps : elle est connue pour ses naufrages."],["🔥","Interdictions totales de feu fréquentes au camping : reste sur les sentiers balisés, car les falaises de calcaire peuvent être dangereuses."]],
 "fauna":"raies sauvages, parfois jusqu’à 2 m d’envergure, qui nagent près du bord.",
 "sourceLabel":label("Tourism Western Australia, Perth Is OK et Wikipédia (Hamelin Bay, Margaret River)")},
{"id":"surfersparadise","name":"Surfers Paradise — Gold Coast","loc":"Gold Coast, Queensland, Australie","country":"Australie","world":"oc","lat":-27.9973,"lon":153.4315,"sports":["surf","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage d’environ 2 km, la plus connue du Queensland selon Surf Life Saving Australia, devant la station de Surfers Paradise, sur la Gold Coast. Trois tours de surveillance (34, 35 et 36), sur l’Esplanade, sont tenues par des lifeguards de 8 h à 17 h, tous les jours de l’année (Ville de Gold Coast). Sur la Gold Coast, la mer est à 25,8 °C en moyenne en janvier (seatemperatu.re).",
 "tip":"Baigne-toi entre les drapeaux rouge et jaune, devant une des tours. Si tu surfes, observe la mer avant d’entrer : en cas de doute, ne rame pas.",
 "dangers":[["🌀","Plage dominée par les courants d’arrachement : ils sont présents dès que les vagues déferlent, et de profonds chenaux peuvent partir du rivage."],["🛟","Un poste peut fermer quand les conditions sont dangereuses ou pour des travaux : vérifie que la plage est surveillée avant d’entrer."],["👥","Selon Surf Life Saving Australia, c’est l’une des plages les plus aménagées et les plus utilisées d’Australie."]],
 "sourceLabel":label("la Ville de Gold Coast, Surf Life Saving Australia et seatemperatu.re")},
{"id":"maupiti","name":"Lagon de Maupiti — plage de Tereia","loc":"Maupiti, Polynésie française","country":"Polynésie française","world":"oc","lat":-16.4488,"lon":-152.2749,"sports":["snorkeling","plongee","baignade","kayak"],"level":"variable","waterType":"sea",
 "desc":"Île à 40 km de Bora Bora, avec l’un des plus beaux lagons de Polynésie selon Tahiti Tourisme. Tereia est « l’unique plage de l’île principale », de sable blanc et d’eau peu profonde (Routard). À marée basse, on peut rejoindre à pied le motu Auira depuis Tereia. Le lagon abrite une station de nettoyage des raies manta. À Bora Bora, à 40 km, la mer est à 28 °C en décembre et à 29 °C en janvier (Climats et Voyages).",
 "tip":"Près des raies manta, l’apnée est interdite : ne les touche pas, regarde-les à distance et laisse-les venir à toi. Le club de plongée de l’île organise des sorties en plongée ou en snorkeling.",
 "dangers":[["🌪️","Les cyclones se forment de novembre à avril, surtout de décembre à mars, et les averses sont parfois abondantes en décembre et janvier, parmi les mois les plus pluvieux."],["⏳","La traversée à pied vers le motu Auira n’est possible qu’à marée basse : regarde la marée avant de partir."],["🐟","Les raies manta sont fragiles et sensibles au dérangement : pas de contact."]],
 "fauna":"raies manta et requins à pointes noires.",
 "sourceLabel":label("Tahiti Tourisme, Routard, Climats et Voyages et Lonely Planet")},
{"id":"avea","name":"Baie d’Avea — Huahine","loc":"Huahine, Polynésie française","country":"Polynésie française","world":"oc","lat":-16.8075,"lon":-150.9795,"sports":["snorkeling","baignade"],"level":"debutant","waterType":"sea",
 "desc":"Longue plage du sud de Huahine, dans le district de Parea. Tahiti Tourisme l’appelle « la plage de la forêt » : elle s’étend sur plusieurs kilomètres et convient à la baignade et à la détente. Snorkeling Report classe le spot débutant : petits récifs avec jardins d’anémones et poissons-clowns, entre 1 et 6 m de profondeur, et un banc de sable que des raies traversent parfois. On entre dans l’eau par la plage publique, un peu au sud de l’hôtel Le Mahana. Dans les îles de la Société, la mer est à 28 à 29 °C en décembre et en janvier (Climats et Voyages : Papeete et Bora Bora).",
 "tip":"Gare-toi au bord de la plage, entre par la plage publique et regarde la mer avant d’y aller : la note débutant ne vaut que par mer calme, sans vent fort, houle, forte marée ni pluie.",
 "dangers":[["🌪️","Les cyclones se forment de novembre à avril, surtout de décembre à mars, et décembre et janvier comptent parmi les mois les plus pluvieux."],["⚠️","Vérifie la réglementation locale (espèces protégées, zones interdites) : visibilité et état du récif peuvent changer."],["🚗","La plage est à environ 30 minutes en voiture de Fare (45 minutes en scooter) : prévois ton transport."]],
 "fauna":"poissons-clowns dans les anémones et raies qui traversent parfois le banc de sable.",
 "sourceLabel":label("Tahiti Tourisme (plage d’Avea), Snorkeling Report (baie d’Avea), Climats et Voyages et Lonely Planet")},
{"id":"mouli","name":"Pont de Mouli — Ouvéa","loc":"Ouvéa, Nouvelle-Calédonie","country":"Nouvelle-Calédonie","world":"oc","lat":-20.6982,"lon":166.4736,"sports":["baignade","snorkeling"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable blanc d’environ six kilomètres, prolongement de celle de Fayaoué, dans le lagon d’Ouvéa, inscrit au patrimoine mondial de l’UNESCO en 2008. Le lagon y est calme et peu profond, et l’accès à la plage est libre et gratuit. Au bout de la route, le pont de Mouli (180 m, inauguré en décembre 2023) permet de voir tortues, raies et poissons, attirés par le courant, sans se mouiller.",
 "tip":"Explore les eaux claires près du pont, ou observe depuis le pont. Pour les falaises de Lékiny et les sorties en bateau, il est nécessaire de faire appel à un guide local.",
 "dangers":[["🚫","Baignade interdite dans la baie de Lékiny, réserve coutumière."],["ℹ️","Mouli est un district coutumier : respecte les usages locaux, dont le salut traditionnel en entrant dans la tribu."],["🌀","Un courant passe sous le pont, c’est ce qui attire la faune : renseigne-toi sur place avant de nager près du pont."],["🌪️","Les cyclones se forment de novembre à mi-mai, plus probables de fin décembre à début avril."]],
 "fauna":"tortues, raies et poissons près du pont.",
 "sourceLabel":label("Routard (presqu’île de Mouli), Wikipédia (Ouvéa) et Climats et Voyages")},
{"id":"kanumera","name":"Baie de Kanuméra — Île des Pins","loc":"Île des Pins, Nouvelle-Calédonie","country":"Nouvelle-Calédonie","world":"oc","lat":-22.6619,"lon":167.4446,"sports":["snorkeling","baignade","kayak"],"level":"debutant","waterType":"sea",
 "desc":"Petite baie de sable blanc et fin, au sud de l’Île des Pins, voisine de la baie de Kuto et bordée de pins colonnaires et de cocotiers. Un rocher de corail, relié à la plage par un banc de sable, la coupe en deux : il est sacré. Le récif descend à 3–5 m, avec poissons-clowns, poissons-papillons et parfois une tortue ou une raie. Snorkeling Report classe le spot débutant, avec une entrée facile depuis la plage. À Nouméa, la mer est à environ 27 °C en janvier (Climats et Voyages).",
 "tip":"Entre dans l’eau juste à gauche du rocher, en le regardant depuis la plage. Il est interdit de palmer sur une bande d’une dizaine de mètres le long du rocher : nage sans palmes dans cette zone.",
 "dangers":[["🚫","Rocher sacré (tabou) : ne monte pas dessus, par respect pour les coutumes locales."],["🏖️","Pas de surveillance ni de toilettes publiques sur place."],["⚠️","La note débutant ne vaut que par bon temps : pas par mer agitée, grand vent, houle, fortes marées ou pluie."],["🌪️","Les cyclones se forment de novembre à mi-mai, plus probables de fin décembre à début avril."]],
 "fauna":"poissons-clowns, poissons-papillons, et parfois une tortue marine ou une raie.",
 "sourceLabel":label("Routard (anse de Kanuméra et baie de Kuto), Snorkeling Report et Climats et Voyages")},
{"id":"ilotmaitre","name":"Îlot Maître — Nouméa","loc":"Nouméa, Nouvelle-Calédonie","country":"Nouvelle-Calédonie","world":"oc","lat":-22.3339,"lon":166.4069,"sports":["snorkeling","kitesurf","windsurf"],"level":"variable","waterType":"sea",
 "desc":"Îlot de 700 m sur 150 m dans le lagon de Nouméa, au cœur d’une réserve marine de 200 hectares, entouré d’un récif de corail. Des bateaux-taxis font la navette depuis l’Anse Vata. Près du ponton, les herbiers peu profonds (1 à 2 m) attirent des tortues vertes ; Snorkeling Report juge le spot accessible aux débutants par temps calme. Sur la côte est, le lagon exposé aux alizés sert au kitesurf, à la planche à voile et au wing foil. À Nouméa, la mer est à environ 27 °C en janvier (Climats et Voyages).",
 "tip":"Pour le snorkeling, choisis les herbiers et le récif près du ponton. Évite la zone plate à l’est, face à l’hôtel, quand il y a du vent : les kitesurfeurs s’y retrouvent.",
 "dangers":[["⛴️","Le récif devant le ponton est sur le passage des bateaux qui accostent : signale-toi."],["🪁","La côte est, exposée aux alizés, est fréquentée par les kitesurfeurs quand il y a du vent."],["🐢","Réserve marine : tortues vertes, et parfois requins de récif à pointes blanches et raies. Garde tes distances."],["🌪️","Les cyclones se forment de novembre à mi-mai, plus probables de fin décembre à début avril."]],
 "fauna":"tortues vertes, parfois requins de récif à pointes blanches et raies.",
 "photoContext":"Îlot Maître, lagon de Nouméa",
 "sourceLabel":label("Wikipédia (îlot Maître), Snorkeling Report et Climats et Voyages")},
{"id":"nukuhione","name":"Nukuhione — lagon de Wallis","loc":"Wallis, Wallis-et-Futuna","country":"Wallis-et-Futuna","world":"oc","lat":-13.2739,"lon":-176.1332,"sports":["plongee","baignade"],"level":"variable","waterType":"sea",
 "desc":"Îlot du lagon de Wallis, dans le district de Hahake, qui appartient au village de Liku. France.fr le cite, avec Nukuhifala, parmi les deux îlots où l’on plonge : très peu de gros prédateurs, mais des récifs coralliens magnifiques, et des plages désertes. Selon Wikipédia, le « trou du diable », un tombant du récif, est au nord de l’îlot et le « trou de la tortue », un autre tombant, au sud. À Wallis, la mer est à 29 °C en décembre et en janvier (Climats et Voyages).",
 "tip":"Plonge avec un professionnel local : les services de plongée de l’île sont limités, il est conseillé de réserver à l’avance.",
 "dangers":[["🌪️","Cyclones de novembre à mi-mai, plus probables de fin décembre à début avril. Wallis est très pluvieuse : environ 345 mm en décembre et 395 mm en janvier."],["🪼","Des méduses bleues ont déjà envahi le lagon de Wallis ; celles échouées ont causé des brûlures au contact."],["🚤","Les plongées se font surtout en bateau, dans le lagon ou près des récifs."],["ℹ️","L’îlot appartient au village de Liku : renseigne-toi avant d’y accoster."]],
 "sourceLabel":label("France.fr, Wikipédia (Nukuhione), PADI, Les Nouvelles Calédoniennes et Climats et Voyages")},
];
