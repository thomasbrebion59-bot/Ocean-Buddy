/* Spots « Noël au soleil » (décembre 2026) — zone Atlantique chaud, Afrique et Moyen-Orient. 12 fiches.
   Format de data/new-spots-2026-10.cjs ; fusionné par node scripts/add-spots.cjs data/new-spots-2026-12-afrique.cjs data/new-spot-photos-2026-12-afrique.json catalogue-2026-12.
   Faits : pages web ouvertes le 2026-11-03 (détail fait par fait dans data/sources/new-spots-2026-12-afrique.md). Aucun fait sans source ;
   niveau « variable » quand aucune source ne le donne. Coordonnées : OpenStreetMap (Nominatim) ou Wikipédia (voir data/sources/new-spots-2026-12-afrique.md).
   Textes non relus sur place : editorialStatus « unverified », à vérifier localement.
   URL consultées, par spot :
   - snoopyisland (Snoopy Island, Al Aqah, Fujairah) : en.wikipedia.org/wiki/Snoopy_Island ; propertyfinder.ae/blog/snorkeling-in-uae/ ;
     squareyards.ae/blog/snoopy-island-trmart ; khaleejtimes.com/uae/uae-seven-islands-to-visit-this-winter
   - corralejo (Grandes Playas, Corralejo, Fuerteventura) : beachatlas.com/corralejo-beaches-2026-guide ;
     thesurfatlas.com/surfing-in-canary-islands/corralejo-beaches/ ; fr.wikipedia.org/wiki/Parc_naturel_de_Corralejo ;
     climatsetvoyages.com/climat/canaries/fuerteventura ; philandgarth.com/fuerteventura/
   - baiadasgatas (Baía das Gatas, São Vicente, Cap-Vert) : iksurfmag.com/travel-guides/africa/cape-verde/sao-vicente ;
     it.wikivoyage.org/wiki/Baía_das_Gatas ; onlybeaches.com/cape-verde/sao-vicente/baia-das-gatas/… (lu, non retenu)
   - agadir (plage d’Agadir, Maroc) : en.wikipedia.org/wiki/Agadir ; fr.wikipedia.org/wiki/Agadir ;
     lonelyplanet.fr/destinations/afrique/maroc/agadir/que-faire/les-plages-dagadir ;
     fr.le360.ma/societe/alerte-face-a-la-hausse-inquietante-des-cas-de-noyade-sur-la-plage-dagadir_RLC6SNSSQRFXFEF26TNI2D3TLU/ ;
     climatsetvoyages.com/climat/maroc/agadir ; barcelo.com/guia-turismo/fr/maroc/agadir/a-voir-et-a-faire/plages-agadir/
   - artaplage (requins-baleines, golfe de Tadjourah, Djibouti) : lonelyplanet.fr/destinations/afrique/djibouti/que-faire/observation-des-requins-baleines ;
     leap.unep.org/en/countries/dj/national-legislation/decret-ndeg-2023-362prmct-portant-sur-la-protection-et ;
     padi.com/fr/diving-in/djibouti/ ; partirou.com/quand/plonger/djibouti/ ; en.wikipedia.org/wiki/Whale_shark ; en.wikipedia.org/wiki/Gulf_of_Tadjoura
   - bandarkhayran (Bandar Khayran, Mascate, Oman) : lonelyplanet.com/articles/underwater-oasis-where-to-dive-in-oman ;
     lonelyplanet.com/points-of-interest/bandar-khayran/1612041 ; experienceoman.om/things-to-do-categories/water-activities ;
     en.wikipedia.org/wiki/Bandar_Khayran
   - abunuhas (Sha’ab Abu Nuhas, mer Rouge, Égypte) : en.wikipedia.org/wiki/Shaʽb_Abu_Nuħas ;
     divernet.com/scuba-diving/egypts-graveyard-diving-in-the-deep-sea-shipwrecks/ ; en.wikipedia.org/wiki/Hurghada
   - kotu (Kotu Beach, Gambie) : accessgambia.com/information/kotu.html ; accessgambia.com/msite/m-swimming-advice.html ;
     en.wikipedia.org/wiki/Gambia ; climatsetvoyages.com/climat/gambie/banjul
   - capskirring (Cap Skirring, Casamance, Sénégal) : fr.wikipedia.org/wiki/Cap_Skirring ; it.surf-forecast.com/breaks/Cap-Skirring ;
     climatsetvoyages.com/climat/senegal/cap-skirring ; diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/senegal/ (lu, non retenu)
   - papagayo (Playa de Papagayo, Lanzarote) : hellocanaryislands.com/beaches/lanzarote/papagayo-beach ; en.wikipedia.org/wiki/Playa_Blanca ;
     climatsetvoyages.com/climat/canaries/lanzarote
   - samadai (Sha’ab Samadai « Dolphin House », Marsa Alam, Égypte) : snorkeling-report.com/spot/snorkeling-shaab-samadai-dolphin-house/ ;
     en.wikipedia.org/wiki/Marsa_Alam
   - shela (Shela Beach, île de Lamu, Kenya) : lonelyplanet.com/points-of-interest/shela-beach/1460938 ; roughguides.com/articles/best-beaches-in-kenya ;
     beta.nation.co.ke/kenya/counties/lamu/tragedy-at-shella-beach-as-three-members-of-church-party-drown-in-indian-ocean-5002798 ;
     en.wikipedia.org/wiki/Lamu ; climatsetvoyages.com/climat/kenya/lamu
   Coordonnées : OpenStreetMap via nominatim.openstreetmap.org (Snoopy, Bandar Khayran et Abu Nuhas : Wikipédia). */
const label=(s)=>'Fiche Ocean Buddy · décembre 2026 · d’après '+s+' · à vérifier localement';
module.exports=[
{"id":"snoopyisland","name":"Snoopy Island — Al Aqah","loc":"Fujairah, Émirats arabes unis","country":"Émirats arabes unis","world":"as","lat":25.4922,"lon":56.3642,"sports":["snorkeling","plongee","kayak"],"level":"debutant","waterType":"sea",
 "desc":"Petit îlot rocheux au large d’Al Aqah, sur la côte nord de Fujairah, dans le golfe d’Oman. Sa forme évoque Snoopy allongé sur le dos. Il se trouve à environ 200 m de la plage, selon Square Yards, et on y fait du snorkeling, de la plongée et du kayak autour du récif. Property Finder y cite tortues, murènes, raies, poulpes et poissons-clowns, et dit les petits fonds entre la plage et l’île très appréciés des familles.",
 "tip":"Marche jusqu’à l’île à marée basse, ou nage un peu à marée haute. Ne fais pas le tour de l’île, pour protéger le récif, et mets des chaussures contre les roches coupantes.",
 "dangers":[["🪨","Roches tranchantes sur l’île : Square Yards conseille de porter des chaussures."],["🚫","Il est interdit de faire le tour de l’île, pour ne pas abîmer le récif (Square Yards)."],["🛥️","Square Yards signale des quads sur la plage et des jet-skis dans l’eau le matin ; c’est plus calme en semaine."]],
 "photoContext":"Snoopy Island depuis la plage d’Al Aqah, Fujairah",
 "sourceLabel":label("Wikipédia, Property Finder et Square Yards")},
{"id":"corralejo","name":"Grandes Playas — Corralejo","loc":"Fuerteventura, Canaries, Espagne","country":"Espagne","world":"eu","lat":28.7152,"lon":-13.8393,"sports":["surf","kitesurf","windsurf","baignade"],"level":"variable","waterType":"sea",
 "desc":"Succession de plages de sable blanc au pied de la plus grande zone de dunes des Canaries, dans le parc naturel de Corralejo, au sud de la ville, avec vue sur Lobos et Lanzarote. Selon The Surf Atlas, Flag Beach est le repaire des windsurfeurs, où le vent s’engouffre entre Fuerteventura et Lobos, et Playa del Moro donne de bons beach breaks quand une grosse houle de nord-ouest arrive. Beach Atlas note que la houle d’automne et d’hiver plaît aux surfeurs expérimentés.",
 "tip":"Choisis ta plage selon le vent et la houle du jour, et regarde les drapeaux et la surveillance sur place : Beach Atlas rappelle qu’ils varient d’une plage à l’autre. En décembre et janvier, l’eau est fraîche : environ 20 °C puis 19 °C d’après Climats et Voyages.",
 "dangers":[["🌊","La houle d’automne et d’hiver peut rendre la baignade déconseillée (Beach Atlas) : regarde les drapeaux avant d’entrer."],["🌀","Courants possibles à Playa del Moro, avertit The Surf Atlas."],["🪁","Flag Beach est très ventée : le vent hache les vagues et la plage se partage avec windsurfeurs et kitesurfeurs (The Surf Atlas)."]],
 "photoContext":"Flag Beach (Kite Beach), Grandes Playas de Corralejo",
 "sourceLabel":label("Beach Atlas, The Surf Atlas, Wikipédia et Climats et Voyages")},
{"id":"baiadasgatas","name":"Baía das Gatas — São Vicente","loc":"São Vicente, Cap-Vert","country":"Cap-Vert","world":"af","lat":16.9031,"lon":-24.9072,"sports":["kitesurf","baignade"],"level":"variable","waterType":"sea",
 "desc":"Baie de São Vicente, à 15 km à l’est de Mindelo, que Wikivoyage décrit comme une immense piscine naturelle. Selon IKSurfmag, c’est le seul plan d’eau plat permanent du Cap-Vert, avec de l’eau à hauteur de genou à la taille ; il est minuscule : deux kites suffisent à le remplir. Le festival de musique de la Baía das Gatas a lieu chaque année début août, à la pleine lune.",
 "tip":"Pour le kite, prévois peu de place sur l’eau. Si tu vas voir les vagues à l’ouest de la baie, prends une veste coupe-vent et de bonnes chaussures de marche.",
 "dangers":[["🪨","À l’ouest de la baie, on marche sur des pierres irrégulières et souvent instables (Wikivoyage)."],["🌊","Dans les piscines naturelles de l’ouest, la mer se brise en gerbes qui peuvent dépasser 5 m (Wikivoyage) : garde tes distances."],["💨","Les alizés soufflent régulièrement à plus de 25 nœuds à São Vicente (IKSurfmag) : choisis ton matériel en conséquence."]],
 "photoContext":"Vue aérienne de la baie et du village de Baía das Gatas, São Vicente",
 "sourceLabel":label("IKSurfmag et Wikivoyage")},
{"id":"agadir","name":"Plage d’Agadir","loc":"Agadir, Maroc","country":"Maroc","world":"af","lat":30.3976,"lon":-9.6001,"sports":["baignade","paddle"],"level":"variable","waterType":"sea",
 "desc":"Longue baie de sable fin au pied de la corniche d’Agadir : plus de 10 km selon Lonely Planet, qui la dit protégée des vents. On s’y baigne, on joue au beach-volley, on fait du jet-ski et du paddle. Wikipédia en fait une destination de soleil d’hiver : en janvier, il fait 20,5 °C à midi en moyenne. La mer reste fraîche, environ 18,5 °C en décembre et 17,5 °C en janvier (Climats et Voyages).",
 "tip":"Baigne-toi quand les maîtres-nageurs sont là, respecte les drapeaux et les panneaux, et ne nage pas la nuit.",
 "dangers":[["🌀","Après de fortes pluies, des trous et des courants dangereux sont apparus entre l’hôtel Amadil et l’hôtel Robinson, vers l’oued El Houar (Le360, 2025)."],["🛟","Les plages sont surveillées, mais les sauveteurs manquent (Le360). Un plongeur cité par l’article dit qu’ils travaillent de 8 h à 20 h, et un couple a dû être sauvé vers 21 h."],["🏴","Des drapeaux noirs et des panneaux marquent les zones interdites à la baignade (Le360) : respecte-les."]],
 "photoContext":"Plage d’Agadir et la colline de la Kasbah",
 "sourceLabel":label("Wikipédia, Lonely Planet, Le360 et Climats et Voyages")},
{"id":"artaplage","name":"Arta Plage — requins-baleines","loc":"Golfe de Tadjourah, Djibouti","country":"Djibouti","world":"af","lat":11.5849,"lon":42.8272,"sports":["snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Plage de la baie d’Arta, dans le golfe de Tadjourah. Selon Lonely Planet, des groupes de requins-baleines traversent le golfe chaque année de novembre à janvier ; le guide cite la baie de Ghoubbet. Un décret de 2023 protège les zones d’attraction de l’aire marine protégée d’Arta Plage et fixe la saison touristique du 15 octobre au 15 mars, avec possibilité de l’ajuster.",
 "tip":"Passe par un opérateur déclaré : pendant la saison, l’Agence nationale du tourisme et les garde-côtes contrôlent l’accès aux zones d’observation. Vérifie les dates de saison avant de partir.",
 "dangers":[["🧭","L’accès aux zones d’observation des requins-baleines est contrôlé pendant la saison (décret 2023-362, résumé sur LEAP/PNUE)."],["💨","Des vents d’hiver peuvent encore perturber les sorties en mer en décembre et janvier (Partirou)."],["🚤","Wikipédia cite un rapport de 2006 : 65 % des requins-baleines de la baie d’Arta étaient blessés, dans un contexte de cicatrices d’hélice répandues. Reste loin des bateaux en mouvement."]],
 "sourceLabel":label("Lonely Planet, LEAP (PNUE), PADI, Partirou et Wikipédia")},
{"id":"bandarkhayran","name":"Bandar Khayran","loc":"Mascate, Oman","country":"Oman","world":"as","lat":23.5014,"lon":58.7325,"sports":["snorkeling","plongee","kayak"],"level":"variable","waterType":"sea",
 "desc":"Série de baies abritées de sable blanc et de criques désertes, à 25 km au sud-est de Mascate, accessibles surtout en bateau. Lonely Planet décrit un récif de corail peu profond, de 15 m de profondeur moyenne, bon pour tous les plongeurs, avec de grosses murènes dans les trous du corail. La lagune bordée de mangrove est aussi un lieu de snorkeling réputé ; au coucher du soleil, des sorties en kayak passent dans le plancton lumineux.",
 "tip":"Pars en bateau depuis Bandar Jissah ou Bandar Al Rowdha, avec un opérateur. Prévois une combinaison : l’eau d’Oman va de 19 à 28 °C selon Lonely Planet.",
 "dangers":[["🚤","Les criques s’atteignent surtout en bateau (Lonely Planet) : réserve ta sortie et le retour avant de partir."],["🥶","La visibilité va de 5 à 30 m et l’eau de 19 à 28 °C selon les sites d’Oman (Lonely Planet) : adapte ta combinaison à la saison."]],
 "photoContext":"Baies de Bandar Khayran vues du ciel",
 "sourceLabel":label("Lonely Planet, Experience Oman et Wikipédia")},
{"id":"abunuhas","name":"Sha’ab Abu Nuhas — épaves","loc":"Mer Rouge, Égypte","country":"Égypte","world":"af","lat":27.567,"lon":33.917,"sports":["plongee"],"level":"variable","waterType":"sea",
 "desc":"Récif triangulaire du nord de la mer Rouge, au nord-ouest de l’île de Shadwan, au large d’Hurghada. Il avance dans la route des cargos vers le canal de Suez et a piégé au moins sept navires. Divernet cite quatre épaves à plonger : le Giannis D (1983), le Carnatic (1869), le Chrisoula K, aussi appelé Marcus (1981), et le Kimon M (1978). On y va en bateau, à la journée ou en safari.",
 "tip":"Réserve avec un centre de plongée d’Hurghada. N’entre dans une épave qu’avec la formation adaptée, et prends trois lampes pour la salle des machines du Chrisoula K, comme le conseille Divernet. À Hurghada, la mer est à 23 °C en décembre et 22 °C en janvier (Wikipédia).",
 "dangers":[["🕳️","Salle des machines du Chrisoula K : l’entrée est étroite et l’intérieur est extrêmement sombre (Divernet)."],["⬇️","Les épaves reposent de 12 à 32 m : le Carnatic à 26 m, le Chrisoula K entre 26 et 28 m, le Kimon M entre 30 et 32 m (Divernet)."],["🚢","Le récif avance dans la route des cargos vers le canal de Suez (Wikipédia) : rejoins-le avec un bateau de plongée, pas seul."]],
 "photoContext":"Épave du Carnatic, Sha’ab Abu Nuhas",
 "sourceLabel":label("Divernet et Wikipédia")},
{"id":"kotu","name":"Kotu Beach","loc":"Kombo Saint Mary, Gambie","country":"Gambie","world":"af","lat":13.4651,"lon":-16.7042,"sports":["baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage bordée de cocotiers dans la station balnéaire de Kotu, à 17 km de Banjul. Access Gambia décrit un sable de bonne qualité mais une eau sableuse, avec de petites lagunes bien plus calmes près de l’hôtel Palm Beach. L’Atlantique y va du calme plat au clapot. Des maîtres-nageurs surveillent depuis leur poste et hissent des drapeaux selon les conditions.",
 "tip":"Regarde les drapeaux des maîtres-nageurs avant d’entrer : rouge, tu ne te baignes pas ; jaune, tu restes près du bord ; vert, c’est permis (Access Gambia). Ne nage pas seul.",
 "dangers":[["📉","Le fond reste peu profond jusqu’à environ 25 m du bord, puis tombe brutalement (Access Gambia)."],["🌀","Courants de fond parfois puissants et grosses vagues : demande conseil avant de te baigner (Access Gambia)."],["🪼","Des physalies passent parfois et des raies pastenagues plus rarement : mets des sandales contre les oursins (Access Gambia)."]],
 "photoContext":"Plage de Kotu, Gambie",
 "sourceLabel":label("Access Gambia, Wikipédia et Climats et Voyages")},
{"id":"capskirring","name":"Cap Skirring","loc":"Casamance, Sénégal","country":"Sénégal","world":"af","lat":12.3815,"lon":-16.7445,"sports":["baignade","surf"],"level":"variable","waterType":"sea",
 "desc":"Station balnéaire du sud de la Casamance, près de la Guinée-Bissau. Wikipédia y voit les traces d’un ancien système volcanique : ses rochers freinent les courants de l’Atlantique et ont façonné les anses des plages. Selon Surf-Forecast, c’est un beach break et un reef assez exposés, aux vagues irrégulières, à gauche comme à droite, avec très peu de monde même quand ça marche.",
 "tip":"Pour surfer, vise une houle d’ouest avec un vent d’est-nord-est (Surf-Forecast). En décembre et janvier, la mer est à 26 °C puis 23 °C en moyenne et il ne pleut pas (Climats et Voyages).",
 "dangers":[["🌬️","Aucun abri contre les vents de travers sur cette côte exposée (Surf-Forecast)."],["🪨","Des reefs cassent au large, à gauche et à droite (Surf-Forecast) : ne surfe pas là sans connaître le fond."]],
 "photoContext":"Plage de Cap Skirring",
 "sourceLabel":label("Wikipédia, Surf-Forecast et Climats et Voyages")},
{"id":"papagayo","name":"Playa de Papagayo — Playa Blanca","loc":"Lanzarote, Canaries, Espagne","country":"Espagne","world":"eu","lat":28.8424,"lon":-13.7881,"sports":["baignade","snorkeling"],"level":"debutant","waterType":"sea",
 "desc":"Crique de sable blanc de 120 m, dans le monument naturel de Los Ajaches, au sud de Lanzarote. Selon Hello Canary Islands, l’eau claire et vert émeraude reste immobile toute la journée comme dans une piscine, et la crique est bien abritée du vent. Le site vante le snorkeling et les baignades d’enfants. Il y a un petit bar sur la colline et un parking ; l’accès en voiture n’est pas gratuit.",
 "tip":"Il n’y a pas de poste de secours : reste près du bord et ne nage pas seul. En décembre et janvier, l’eau est fraîche : environ 20 °C puis 19 °C d’après Climats et Voyages.",
 "dangers":[["🛟","Plage sans surveillance, signale Hello Canary Islands (« sin vigilancia »)."],["🥶","L’eau est fraîche en hiver : 20 °C en décembre, 19 °C en janvier (Climats et Voyages)."],["🚗","La piste d’accès est cahoteuse (Wikipédia) : roule doucement."]],
 "photoContext":"Playa de Papagayo, Playa Blanca, Lanzarote",
 "sourceLabel":label("Hello Canary Islands, Wikipédia et Climats et Voyages")},
{"id":"samadai","name":"Sha’ab Samadai — Dolphin House","loc":"Marsa Alam, Égypte","country":"Égypte","world":"af","lat":24.9789,"lon":34.9942,"sports":["snorkeling","plongee"],"level":"intermediaire","waterType":"sea",
 "desc":"Récif en fer à cheval à une quinzaine de kilomètres au sud-est de Marsa Alam, parc national depuis 2004 selon Snorkeling Report. Un groupe de dauphins à long bec (spinner) s’y est installé : on les voit presque chaque jour. Les sorties partent de Marsa Alam et comptent en général deux arrêts de snorkeling : la zone des dauphins, puis les pinacles de corail voisins.",
 "tip":"Réserve une sortie à la journée : l’accès est réglementé. Mets le gilet flottant obligatoire et ne cherche jamais à toucher ni à poursuivre les dauphins.",
 "dangers":[["🐬","La zone A, au nord, est interdite à toute activité : les dauphins s’y reposent (Snorkeling Report)."],["🦺","Gilet flottant obligatoire dans l’eau : il empêche aussi de plonger en apnée (Snorkeling Report)."],["⬇️","Dans la zone des dauphins, le fond peut descendre à 25 m ; Snorkeling Report demande un niveau intermédiaire."]],
 "photoContext":"Récif Sha’ab Samadai, Marsa Alam",
 "sourceLabel":label("Snorkeling Report et Wikipédia")},
{"id":"shela","name":"Shela Beach — Lamu","loc":"Île de Lamu, Kenya","country":"Kenya","world":"af","lat":-2.2936,"lon":40.9155,"sports":["baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable blanc de 12 km sur l’île de Lamu, au Kenya, bordée de hautes dunes selon Rough Guides. Lonely Planet la dit assez vaste pour qu’on y trouve un coin isolé en marchant un peu. Le village de Shela, derrière la plage, a une mosquée du vendredi de 1829 et son minaret de 18 m. En décembre et janvier, la mer est à 28 °C et 27,5 °C en moyenne (Climats et Voyages).",
 "tip":"Avant de nager, demande conseil sur place : Lonely Planet signale de forts courants, surtout près de l’hôtel The Fort.",
 "dangers":[["🌀","Forts courants d’arrachement par endroits, surtout autour de l’hôtel The Fort (Lonely Planet)."],["🕳️","Le chenal de Shela (Mlango wa Shella) est l’un des « chenaux tueurs » de Lamu, aux courants violents et aux fortes vagues (Daily Nation)."],["⚠️","Daily Nation rapporte des noyades à Shela, dont celles de trois membres d’un groupe d’église en sortie."]],
 "photoContext":"Plage de Shela, île de Lamu",
 "sourceLabel":label("Lonely Planet, Rough Guides, Daily Nation et Climats et Voyages")},
];
