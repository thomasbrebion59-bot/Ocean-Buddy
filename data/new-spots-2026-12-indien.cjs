/* Spots « Noël au soleil » — océan Indien et Asie. Fiches préparées le 3 novembre 2026 (10 spots retenus sur 12).
   Fusionné dans catalog.json par : node scripts/add-spots.cjs data/new-spots-2026-12-indien.cjs data/new-spot-photos-2026-12-indien.json catalogue-2026-12
   EXCLUS le 3 novembre 2026 : boucancanot et etangsale (La Réunion). L’arrêté préfectoral « requin » en vigueur n’est pas vérifié sur une source officielle
   (voir data/sources/new-spots-2026-12-reunion-requin.md) : ces deux fiches ne sont pas publiées tant qu’il n’est pas lu sur reunion.gouv.fr.
   Coordonnées : OpenStreetMap (Nominatim), sur la plage ou la zone du spot. Faits : sources web ouvertes le 2026-11-03.
   Aucun fait sans source ; niveau « variable » quand aucune source ne le donne. Textes non relus sur place : editorialStatus « unverified ».
   Le détail « fait par fait » est dans data/sources/new-spots-2026-12-indien.md.

   URL consultées, par spot (toutes le 2026-11-03) :

   - flicenflac (Flic en Flac, Maurice)
     https://fr.wikipedia.org/wiki/Flic_en_Flac
     https://en.wikipedia.org/wiki/Flic_en_Flac
     https://www.snorkeling-report.com/?p=21656
     https://en.wikipedia.org/wiki/Climate_of_Mauritius
     https://nominatim.openstreetmap.org (Flic en Flac Public Beach)

   - bellemare (Belle Mare, Maurice)
     https://www.routard.com/fr/guide/afrique/ile-maurice-rodrigues/ile-aux-cerfs-et-flacq/belle-mare-et-palmar
     https://www.snorkeling-report.com/fr/spot/snorkeling-plage-de-belle-mare/
     https://en.wikipedia.org/wiki/Climate_of_Mauritius
     https://nominatim.openstreetmap.org (Belle Mare Public Beach)

   - unawatuna (Unawatuna, Sri Lanka)
     https://www.routard.com/guide_voyage_lieu/11487-unawatuna.htm
     https://www.routard.com/guide_voyage_lieu/4994-galle.htm (saison sèche côte sud-ouest)
     https://en.wikivoyage.org/wiki/Unawatuna
     https://en.wikipedia.org/wiki/Unawatuna
     https://nominatim.openstreetmap.org (Unawatuna, plage)

   - kovalam (Lighthouse Beach, Kovalam, Kerala, Inde)
     https://www.routard.com/fr/guide/asie/inde/kerala/kovalam
     https://www.routard.com/contenu-dossier/cid135241-le-meilleur-du-kerala.html?page=5
     https://en.wikipedia.org/wiki/Kovalam
     https://en.wikivoyage.org/wiki/Kovalam
     https://nominatim.openstreetmap.org (Lighthouse Beach)

   - agonda (Agonda, Goa, Inde)
     https://www.routard.com/fr/guide/asie/inde/goa/agonda
     https://en.wikipedia.org/wiki/Agonda
     https://nominatim.openstreetmap.org (Agonda Beach)

   - kosurin (Mu Ko Surin, Ko Surin Nuea, Thaïlande)
     https://en.wikipedia.org/wiki/Surin_Islands
     https://en.wikivoyage.org/wiki/Mu_Ko_Surin_National_Park
     https://nominatim.openstreetmap.org (หาดไม้งาม, Ao Mai Ngam)

   - payar (Parc marin de Pulau Payar, Langkawi, Malaisie)
     https://www.routard.com/fr/guide/asie/malaisie/cote-de-la-mer-d-andaman/iles-langkawi/parc-marin-de-pulau-payar
     https://www.routard.com/fr/guide/asie/malaisie/cote-de-la-mer-d-andaman/iles-langkawi/langkawi (saison sèche)
     https://en.wikipedia.org/wiki/Payar_Island
     https://nominatim.openstreetmap.org (Pulau Payar)

   - alona (Alona Beach, Panglao, Bohol, Philippines)
     https://en.wikipedia.org/wiki/Alona_Beach
     https://www.routard.com/fr/guide/asie/philippines/visayas/panglao
     https://en.wikipedia.org/wiki/Typhoon_Rai
     https://nominatim.openstreetmap.org (Alona Beach)

   - wadishab (Wadi Shab, Tiwi, Oman)
     https://www.routard.com/fr/guide/moyen-orient/oman/wadi-shab
     https://fr.wikipedia.org/wiki/Wadi_Shab
     https://nominatim.openstreetmap.org (Wadi Shab boating)

   - maafushi (Maafushi, atoll de Malé Sud, Maldives)
     https://www.routard.com/fr/guide/asie/maldives/atoll-de-male-sud
     https://en.wikipedia.org/wiki/Maafushi_(Kaafu_Atoll)
     https://nominatim.openstreetmap.org (Maafushi, Malé Atoll) */
const label=(s)=>'Fiche Ocean Buddy · décembre 2026 · d’après '+s+' · à vérifier localement';
module.exports=[
{"id":"flicenflac","name":"Flic en Flac — plage publique","loc":"Rivière Noire, Maurice","country":"Maurice","world":"af","lat":-20.2811,"lon":57.3646,"sports":["baignade","snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Plage publique de sable blanc sur la côte ouest de Maurice, avec un lagon protégé par les récifs de corail (Wikipédia). Snorkeling Report décrit un lagon d’environ 300 mètres de large, avec des massifs de corail à quelques dizaines de mètres du bord, des poissons-papillons, des idoles des Maures et parfois de petites murènes. Wikipédia ajoute que le site est réputé pour la plongée, avec ses grottes et ses épaves.",
 "tip":"Pour le snorkeling, rejoins le côté nord de la plage publique et reste loin des zones les moins profondes près de la barrière : tu pourrais te blesser et abîmer le corail.",
 "dangers":[["🪸","Près de la barrière, l’eau devient peu profonde : tu peux te blesser et casser les coraux (Snorkeling Report)."],["🌪️","Des cyclones passent parfois entre janvier et mars. Ils perturbent la météo environ trois jours, avec de fortes pluies (Wikipédia)."],["👥","Plage publique fréquentée toute l’année par des familles du coin et des touristes (Wikipédia)."]],
 "photoContext":"Plage de Flic en Flac",
 "sourceLabel":label("Wikipédia et Snorkeling Report")},
{"id":"bellemare","name":"Belle Mare — plage publique","loc":"Flacq, Maurice","country":"Maurice","world":"af","lat":-20.1911,"lon":57.7752,"sports":["baignade","snorkeling"],"level":"variable","waterType":"sea",
 "desc":"Plage publique de la côte est de Maurice, longue de plusieurs kilomètres et protégée par une barrière de corail. Le Routard décrit un lagon calme et cristallin, ombragé par des filaos. Snorkeling Report la dit sauvage et relativement peu fréquentée : une partie de la plage est publique, l’autre occupée par des hôtels.",
 "tip":"Pour voir le récif, qui commence à environ 500 m de la plage, monte à bord d’un bateau : des guides et des pêcheurs proposent la sortie sur place (Snorkeling Report).",
 "dangers":[["🚤","Beaucoup de bateaux et de jet-skis circulent dans le lagon : palmer depuis le bord n’est pas conseillé (Snorkeling Report)."],["🌪️","Des cyclones passent parfois entre janvier et mars. Ils perturbent la météo environ trois jours, avec de fortes pluies (Wikipédia)."]],
 "photoContext":"Plage de Belle Mare",
 "sourceLabel":label("le Routard, Snorkeling Report et Wikipédia")},
{"id":"unawatuna","name":"Unawatuna","loc":"Province du Sud, Sri Lanka","country":"Sri Lanka","world":"as","lat":6.0082,"lon":80.2444,"sports":["baignade","snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Baie de près d’un kilomètre, à environ 5 km au sud-est de Galle (Wikipédia). Selon le Routard, la plage principale est protégée par un récif et on peut s’y baigner une grande partie de l’année. À 3 km, Jungle Beach est une petite crique entourée de forêt : Wikivoyage la cite comme le meilleur endroit du coin pour le snorkeling. Le Routard mentionne aussi la plongée sur les récifs et sur l’épave du SS Rangoon.",
 "tip":"Pour le snorkeling, va à Jungle Beach, en bateau, en tuk-tuk ou à pied : la baie y est abritée des vagues et des courants d’Unawatuna (Wikivoyage).",
 "dangers":[["🌀","Comme sur une grande partie de la côte sud, de forts courants peuvent être présents : renseigne-toi sur les conditions avant d’entrer dans l’eau (Routard)."],["🐢","À Dalawella, plage voisine, ne touche pas les tortues et garde une distance respectueuse (Routard)."],["👥","De décembre à avril, c’est la haute saison touristique : la plage est plus fréquentée (Routard)."]],
 "photoContext":"Plage d’Unawatuna",
 "sourceLabel":label("le Routard, Wikivoyage et Wikipédia")},
{"id":"kovalam","name":"Lighthouse Beach — Kovalam","loc":"Kerala, Inde","country":"Inde","world":"as","lat":8.3853,"lon":76.979,"sports":["baignade","surf","bodyboard"],"level":"variable","waterType":"sea",
 "desc":"La plus grande et la plus animée des trois plages de Kovalam, au sud, près du phare de Vizhinjam. Le Routard note que des écoles proposent des initiations au surf et au bodyboard, et que les baies aux eaux calmes se prêtent à la baignade. Selon Wikivoyage, les eaux peu profondes et les petites vagues attirent beaucoup de voyageurs occidentaux.",
 "tip":"Le surf et le bodyboard dépendent beaucoup de l’état de la mer et de la saison : demande aux écoles locales avant de te lancer. Pour plus de calme, le Routard préfère Eve’s Beach et Ashok Beach.",
 "dangers":[["🌀","Les courants peuvent être dangereux à Kovalam (Routard)."],["👥","Lighthouse Beach est la plage la plus populaire de Kovalam : prévois du monde (Routard)."],["🌧️","La mousson, de juin à septembre, limite certaines activités nautiques : la période idéale va de septembre à mars (Routard)."]],
 "photoContext":"Lighthouse Beach, Kovalam",
 "sourceLabel":label("le Routard, Wikipédia et Wikivoyage")},
{"id":"agonda","name":"Plage d’Agonda","loc":"Goa, Inde","country":"Inde","world":"as","lat":15.0423,"lon":73.9865,"sports":["baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage publique d’environ 3 km dans le sud de Goa, au cœur du village d’Agonda. Le Routard la dit plus calme que sa voisine Palolem. Une colline au sud domine la plage et, au nord, Cola Beach garde un lagon. Des sorties en bateau permettent de voir des dauphins au large.",
 "tip":"Reste en dehors des zones aménagées pour protéger les nids de tortues olivâtres, qui pondent surtout d’octobre à avril (Routard).",
 "dangers":[["🌀","La plage est idéale pour se baigner, mais reste prudent face aux courants marins (Routard)."],["🐢","Les tortues olivâtres sont protégées : des zones sont aménagées pour protéger leurs nids (Routard)."]],
 "photoContext":"Plage d’Agonda, Goa",
 "sourceLabel":label("le Routard et Wikipédia")},
{"id":"kosurin","name":"Mu Ko Surin — Ko Surin Nuea","loc":"Phang Nga, Thaïlande","country":"Thaïlande","world":"as","lat":9.4349,"lon":97.8605,"sports":["snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Archipel de granit de la mer d’Andaman, à 55 km de la côte thaïlandaise, protégé par le parc national de Mu Ko Surin. Wikivoyage parle de plages de carte postale et d’un excellent snorkeling, l’activité principale des visiteurs, devant la plongée. Selon Wikipédia, le parc compte plus de 260 espèces de poissons de récif et 68 espèces de coraux. Le camping de Mai Ngam est sur Ko Surin Nuea.",
 "tip":"Les îles se rejoignent en bateau rapide depuis Khao Lak ou Khura Buri, ou en croisière de plusieurs jours. Tu paies le droit d’entrée du parc au centre d’accueil de Khura Buri ou au quartier général, sur Ko Surin Nuea (Wikipédia).",
 "dangers":[["⛈️","Le parc n’ouvre qu’en saison sèche, en général du 15 octobre au 15 mai (Wikipédia), et peut fermer plus tôt selon la météo. Wikivoyage donne le 16 novembre : vérifie avant de partir."],["🚤","Les sites de plongée ne se rejoignent qu’en bateau, et la plongée est interdite dans certaines zones du parc (Wikipédia)."],["🚫","Presque toutes les terres sont interdites aux visiteurs, sauf le village moken et le camping (Wikipédia)."]],
 "photoContext":"Plage de Mai Ngam, Ko Surin Nuea",
 "sourceLabel":label("Wikipédia et Wikivoyage")},
{"id":"payar","name":"Parc marin de Pulau Payar — Langkawi","loc":"Kedah, Malaisie","country":"Malaisie","world":"as","lat":6.0626,"lon":100.0401,"sports":["snorkeling","plongee"],"level":"variable","waterType":"sea",
 "desc":"Parc marin autour de l’île de Payar, à 35 km au sud de Langkawi, accessible uniquement par la mer. Wikipédia décrit des eaux abritées, idéales pour le snorkeling, la plongée et la baignade, et un site de plongée, le « Coral Garden », couvert de coraux mous multicolores. Selon le Routard, on croise souvent de jeunes requins à pointe noire près des pontons, dans les eaux peu profondes.",
 "tip":"Passe par un opérateur agréé : le parc n’autorise que ceux qui sont enregistrés. Les bateaux partent de Kuah et la traversée dure environ une heure (Routard).",
 "dangers":[["🚫","Le parc est fermé aux visiteurs les mardis et mercredis, et chaque année de début mars à fin mai (Routard)."],["👥","Le nombre de visiteurs est limité chaque semaine : renseigne-toi auprès des opérateurs agréés (Routard)."],["🪸","Les coraux ont blanchi en 2010 et 2016 : des zones touchées ont été fermées pour les laisser se refaire (Wikipédia, Routard)."]],
 "photoContext":"Pulau Payar, Langkawi",
 "sourceLabel":label("le Routard et Wikipédia")},
{"id":"alona","name":"Alona Beach — Panglao","loc":"Bohol, Philippines","country":"Philippines","world":"as","lat":9.5484,"lon":123.7734,"sports":["snorkeling","plongee","baignade"],"level":"variable","waterType":"sea",
 "desc":"Plage de sable blanc d’environ un kilomètre, au sud-ouest de l’île de Panglao, entre des falaises rocheuses (Wikipédia). Le Routard en fait le cœur touristique de l’île, avec des restaurants et des centres de plongée. Wikipédia la place près d’un récif de corail, réputé pour le snorkeling et surtout la plongée : tortues, bancs de poissons et corail noir.",
 "tip":"Tu peux explorer les fonds depuis la plage. Napaling Reef, sur Panglao, est connu pour son banc de sardines, même avec un simple équipement de snorkeling (Routard).",
 "dangers":[["🌀","Le courant sous l’eau peut être assez fort par moments et rendre l’eau trouble (Wikipédia)."],["🌪️","Décembre peut amener un typhon : Rai (Odette) a frappé les Philippines en décembre 2021, avec le plus de morts à Bohol (Wikipédia)."],["🪸","L’accès à la réserve marine est limité chaque jour (Wikipédia)."]],
 "photoContext":"Alona Beach, Panglao",
 "sourceLabel":label("Wikipédia et le Routard")},
{"id":"wadishab","name":"Wadi Shab — Tiwi","loc":"Tiwi, Oman","country":"Oman","world":"as","lat":22.8397,"lon":59.2467,"sports":["baignade"],"level":"variable","waterType":"inland",
 "desc":"Canyon du Hajar oriental qui débouche dans le golfe d’Oman, à environ une heure de Mascate. Selon le Routard, des piscines d’eau naturelles forment un canyon au milieu des rochers, avec des palmiers au bord de l’eau. Une grotte se cache derrière une cascade, accessible seulement à la nage. Wikipédia précise qu’on peut franchir l’embouchure du wadi par la route ou en barque.",
 "tip":"Mets des chaussures de marche solides et des sandales aquatiques, et pars tôt le matin pour éviter la chaleur de midi (Routard).",
 "dangers":[["🌧️","Évite d’y aller après de fortes pluies : le risque d’inondation peut être élevé (Routard)."],["🥾","Il faut marcher 45 minutes à 1 heure, sur des sentiers rocheux et des zones humides, avant d’atteindre les piscines (Routard)."],["🕳️","La grotte derrière la cascade n’est accessible qu’en nageant (Routard)."]],
 "photoContext":"Wadi Shab, Oman",
 "sourceLabel":label("le Routard et Wikipédia")},
{"id":"maafushi","name":"Maafushi — atoll de Malé Sud","loc":"Atoll de Malé Sud, Maldives","country":"Maldives","world":"as","lat":3.9412,"lon":73.49,"sports":["snorkeling","baignade"],"level":"variable","waterType":"sea",
 "desc":"Île habitée de l’atoll de Malé Sud, à environ 26 km au sud de Malé (Wikipédia). Le Routard la décrit comme la plus grande et la plus développée des îles habitées de l’atoll, avec des hébergements, des restaurants, des boutiques et des plages aménagées pour les visiteurs. Sur l’atoll, les récifs sont souvent accessibles depuis la plage des îles locales.",
 "tip":"Pour les plus beaux jardins de corail, prends une excursion en bateau. Une sortie populaire mène à un banc de sable (Routard).",
 "dangers":[["🌀","Dans les passes de l’atoll, les courants sont parfois forts (Routard)."]],
 "photoContext":"Plage de Maafushi",
 "sourceLabel":label("le Routard et Wikipédia")},
];
