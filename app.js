/* ================= DATA ================= */
const SPOTS=[
  {id:'hossegor',name:'Hossegor — La Gravière',loc:'Landes, France',level:'expert',sky:'#ffd29a',sky2:'#ff926a',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore E',swell:'1,8 m',temp:'18°C',tide:'Mi-marée',danger:4,
   desc:"Beach break mythique des Landes, réputé pour ses tubes puissants et rapides. Vague de classe mondiale qui accueille le championnat du monde. Réservée aux surfeurs confirmés.",
   dangers:[['🌀',"Courants de baïne très forts, surtout à marée descendante."],['⚡',"Vagues creuses et puissantes qui ferment vite."],['🏖️',"Fonds qui changent vite, attention aux bancs de sable."]],
   tip:"Vérifie bien les baïnes avant d'entrer ! Reste toujours entre les drapeaux et n'y va jamais seul si la houle dépasse 2 m."},
  {id:'lacanau',name:'Lacanau Océan',loc:'Gironde, France',level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Cross-shore',swell:'1,2 m',temp:'19°C',tide:'Marée montante',danger:2,
   desc:"Spot polyvalent très populaire avec de nombreux pics. Idéal pour progresser : vagues régulières, ambiance détendue et écoles de surf à proximité.",
   dangers:[['🌀',"Baïnes présentes, repère les zones de courant."],['👥',"Affluence élevée l'été, attention aux collisions."]],
   tip:"Spot parfait pour passer du niveau débutant à intermédiaire. Surfe le matin pour éviter la foule !"},
  {id:'latorche',name:'La Torche',loc:'Finistère, France',level:'intermediaire',sky:'#d6eef5',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore SE',swell:'1,5 m',temp:'15°C',tide:'Toutes marées',danger:3,
   desc:"Longue plage exposée à la houle de l'Atlantique, fonctionne quasiment toute l'année. Spot de référence en Bretagne pour le surf et le kitesurf.",
   dangers:[['💨',"Vent souvent fort, peut rendre la mer hachée."],['🌊',"Houle puissante quand l'Atlantique se réveille."],['🥶',"Eau froide : combinaison indispensable."]],
   tip:"Mets une bonne combi (4/3 mini) ! La Torche reçoit toute la houle, regarde la taille annoncée avant d'y aller."},
  {id:'biarritz',name:'La Côte des Basques',loc:'Biarritz, France',level:'debutant',sky:'#ffe7b6',sky2:'#ffc46e',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Léger offshore',swell:'0,8 m',temp:'20°C',tide:'Marée basse',danger:1,
   desc:"Le berceau du surf européen ! Vagues douces et déroulantes à marée basse, parfaites pour les débutants et le longboard. Cadre splendide au pied des falaises.",
   dangers:[['🪨',"Quelques rochers à marée basse, repère-les."],['👥',"Très fréquenté, surtout l'été."]],
   tip:"Le spot idéal pour ta première vague 🐙 ! Va-y à marée basse, l'eau est calme et l'ambiance super accueillante."},
  {id:'anglet',name:'Les Cavaliers — Anglet',loc:'Pyrénées-Atlantiques',level:'expert',sky:'#d3c0f5',sky2:'#9b6bd1',sea:'#3a6fb0',sea2:'#1c3d75',
   wind:'Offshore',swell:'2,0 m',temp:'19°C',tide:'Mi-marée',danger:4,
   desc:"Beach break puissant et creux, le spot le plus réputé d'Anglet. Tubes rapides quand la houle rentre, terrain de jeu des surfeurs aguerris.",
   dangers:[['⚡',"Vagues très puissantes, fermetures fréquentes."],['🌀',"Courants latéraux importants."],['🪨',"Digues à proximité, garde tes distances."]],
   tip:"Spot costaud ! N'y va que si tu maîtrises le take-off rapide et le canard dans la mousse épaisse."},
  {id:'quiberon',name:'Port Blanc — Quiberon',loc:'Morbihan, France',level:'debutant',sky:'#c7f0ff',sky2:'#7fd6f0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore N',swell:'0,6 m',temp:'16°C',tide:'Marée montante',danger:1,
   desc:"Petite vague abritée idéale pour apprendre dans une eau souvent calme. Cadre breton magnifique, parfait pour les familles et les premières sessions.",
   dangers:[['🪨',"Quelques rochers sur les bords du spot."],['🥶',"Eau fraîche selon la saison."]],
   tip:"Super spot d'initiation ! Reste au milieu de la plage, loin des rochers, et profite 🐙"},
  {id:'seignosse',name:'Les Bourdaines — Seignosse',loc:'Landes, France',level:'intermediaire',sky:'#ffe0a8',sky2:'#ffb866',sea:'#2a8fb8',sea2:'#11608a',
   wind:'Cross-offshore',swell:'1,4 m',temp:'19°C',tide:'Mi-marée montante',danger:3,
   desc:"Beach break de qualité, l'un des plus consistants des Landes. Pics variés qui conviennent aux intermédiaires cherchant à muscler leur surf.",
   dangers:[['🌀',"Baïnes typiques des Landes."],['🌊',"Peut grossir vite avec la houle."]],
   tip:"Excellent terrain de progression. Repère le sens du courant en regardant la dérive de l'écume avant d'entrer."},
  {id:'capbreton',name:'La Piste — Capbreton',loc:'Landes, France',level:'expert',sky:'#ffc89a',sky2:'#ff8e64',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore E',swell:'1,9 m',temp:'18°C',tide:'Marée basse',danger:4,
   desc:"Spot puissant bordé par la forêt, l'un des beach breaks les plus creux des Landes. Tubes rapides quand la houle entre, très prisé des surfeurs confirmés.",
   dangers:[['⚡',"Vagues creuses et puissantes."],['🌀',"Baïnes et courants forts."],['🏖️',"Bancs de sable changeants."]],
   tip:"Spot sérieux ! Privilégie une houle modérée et repère les courants avant d'entrer."},
  {id:'lafitenia',name:'Lafitenia — St-Jean-de-Luz',loc:'Pays Basque, France',level:'intermediaire',sky:'#bfe7f2',sky2:'#7fc9e2',sea:'#2a93bf',sea2:'#136a96',
   wind:'Offshore S',swell:'1,3 m',temp:'19°C',tide:'Mi-marée',danger:2,
   desc:"Magnifique vague droite dans une baie abritée, l'une des plus belles du Pays Basque. Déroule longuement, idéale pour travailler ses courbes.",
   dangers:[['🪨',"Fond de rochers, attention à marée basse."],['👥',"Spot populaire, souvent chargé."]],
   tip:"Belle droite à rallonge ! Repère le pic principal et respecte les priorités."},
  {id:'guethary',name:'Parlementia — Guéthary',loc:'Pays Basque, France',level:'expert',sky:'#cdbcf2',sky2:'#9b6bd1',sea:'#356bb0',sea2:'#1c3d75',
   wind:'Offshore E',swell:'2,2 m',temp:'18°C',tide:'Toutes marées',danger:4,
   desc:"Spot de grosse houle qui se réveille quand l'Atlantique gronde. Vague de reef pour surfeurs aguerris, réputée pour le gros.",
   dangers:[['🌊',"Grosses vagues, longue rame jusqu'au pic."],['🪨',"Fond rocheux."],['🌀',"Courants importants."]],
   tip:"Réservé aux surfeurs expérimentés et en bonne forme physique. N'y va jamais seul."},
  {id:'sauveterre',name:'Sauveterre — Olonne',loc:'Vendée, France',level:'intermediaire',sky:'#ffe0a8',sky2:'#ffb866',sea:'#2a8fb8',sea2:'#11608a',
   wind:'Cross-offshore',swell:'1,2 m',temp:'18°C',tide:'Mi-marée',danger:3,
   desc:"Long beach break sauvage bordé de dunes et de forêt. Plusieurs pics, bonne consistance et ambiance nature en Vendée.",
   dangers:[['🌀',"Baïnes et courants."],['🏖️',"Plage sauvage, peu surveillée."]],
   tip:"Spot nature superbe. Comme c'est peu surveillé, surfe accompagné."},
  {id:'latranche',name:'La Tranche-sur-Mer',loc:'Vendée, France',level:'debutant',sky:'#c7f0ff',sky2:'#7fd6f0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Léger',swell:'0,7 m',temp:'19°C',tide:'Marée montante',danger:1,
   desc:"Plage familiale aux vagues douces, parfaite pour apprendre. Eau souvent calme et écoles de surf à proximité.",
   dangers:[['👥',"Plage fréquentée l'été."],['🌀',"Quelques courants par endroits."]],
   tip:"Top pour débuter 🐙 ! Reste dans les zones surveillées et profite des petites vagues."},
  {id:'lapalue',name:'La Palue',loc:'Finistère, France',level:'expert',sky:'#cfe0e8',sky2:'#9fbccb',sea:'#2f7a92',sea2:'#134f68',
   wind:'Offshore E',swell:'1,8 m',temp:'15°C',tide:'Mi-marée',danger:4,
   desc:"Plage sauvage et splendide de la presqu'île de Crozon, exposée plein ouest. Vague puissante dans un cadre totalement préservé, sans aucune construction.",
   dangers:[['🌊',"Houle puissante et courants forts."],['🚫',"Aucune surveillance, spot isolé."],['🥶',"Eau froide toute l'année."]],
   tip:"Spot d'engagement : seul le large encaisse. Va-y accompagné et par conditions raisonnables."},
  {id:'penhors',name:'Penhors',loc:'Finistère, France',level:'intermediaire',sky:'#d6eef5',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore SE',swell:'1,4 m',temp:'15°C',tide:'Toutes marées',danger:3,
   desc:"Beach break breton consistant qui fonctionne par de nombreuses conditions, dans la baie d'Audierne. Bon spot pour progresser.",
   dangers:[['💨',"Vent parfois fort."],['🌀',"Courants présents."]],
   tip:"Spot fiable pour enchaîner les sessions. Combinaison épaisse conseillée."},
  {id:'lapalmyre',name:'Pontaillac — Royan',loc:'Charente-Maritime, France',level:'debutant',sky:'#ffe7b6',sky2:'#ffc46e',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Léger',swell:'0,7 m',temp:'19°C',tide:'Marée montante',danger:1,
   desc:"Petite baie abritée près de Royan, vagues douces idéales pour l'apprentissage. Ambiance balnéaire et eau souvent calme.",
   dangers:[['👥',"Plage très fréquentée l'été."],['🪨',"Quelques rochers en bord de baie."]],
   tip:"Parfait pour débuter en douceur 🐙. Reste au centre de la baie."},
  {id:'mimizan',name:'Mimizan Plage',loc:'Landes, France',level:'intermediaire',sky:'#ffe0a8',sky2:'#ffb866',sea:'#2a8fb8',sea2:'#11608a',
   wind:'Cross-shore',swell:'1,3 m',temp:'19°C',tide:'Mi-marée',danger:3,
   desc:"Beach break landais agréable encadré par deux digues, avec des pics réguliers. Bon compromis pour les intermédiaires.",
   dangers:[['🌀',"Baïnes typiques des Landes."],['🏖️',"Bancs de sable changeants."]],
   tip:"Surfe près des zones surveillées et repère les courants le long des digues."},
  {id:'capferret',name:'Cap Ferret — La Pointe',loc:'Gironde, France',level:'expert',sky:'#ffc89a',sky2:'#ff8e64',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore E',swell:'2,0 m',temp:'19°C',tide:'Mi-marée',danger:4,
   desc:"Spot puissant à la pointe du Cap Ferret, à l'entrée du bassin d'Arcachon. Vagues creuses et courants marqués, réservé aux confirmés.",
   dangers:[['🌊',"Vagues puissantes."],['🌀',"Courants très forts près des passes."],['🏖️',"Bancs de sable mouvants."]],
   tip:"Méfie-toi des courants de la passe : reste prudent et évite les gros jours en beach break costaud."},
  {id:'bidart',name:'Pavillon Royal — Bidart',loc:'Pays Basque, France',level:'intermediaire',sky:'#bfe7f2',sky2:'#7fc9e2',sea:'#2a93bf',sea2:'#136a96',
   wind:'Offshore S',swell:'1,4 m',temp:'19°C',tide:'Marée basse',danger:3,
   desc:"Beach break réputé du Pays Basque devant l'embouchure, vague de qualité quand les bancs de sable sont bien placés.",
   dangers:[['🌀',"Courant de la rivière à proximité."],['🪨',"Quelques rochers."]],
   tip:"Surfe à marée basse pour les meilleurs bancs et garde tes distances avec l'embouchure."},
  {id:'nazare',name:"Nazaré — Praia do Norte",loc:"Portugal",level:'expert',sky:'#ffd29a',sky2:'#ff926a',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore',swell:'6,0 m',temp:'17°C',tide:'Toutes marées',danger:4,
   desc:"LE spot de vagues géantes : un canyon sous-marin propulse des murs d'eau pouvant dépasser 20 m, théâtre des records mondiaux de big wave.",
   dangers:[['⚡',"Vagues XXL réservées au tow-in."],['🌀',"Courants extrêmes."]],
   tip:"Spot de très gros : à admirer depuis le phare, le surf y est réservé à l'élite mondiale."},
  {id:'supertubos',name:"Supertubos — Peniche",loc:"Portugal",level:'expert',sky:'#ffc89a',sky2:'#ff8e64',sea:'#356bb0',sea2:'#1c3d75',
   wind:'Offshore',swell:'2,0 m',temp:'17°C',tide:'Mi-marée',danger:4,
   desc:"Le beach break le plus puissant d'Europe, surnommé la « Pipeline européenne » pour ses tubes parfaits et creux.",
   dangers:[['⚡',"Tubes rapides et puissants."],['🏖️',"Fonds peu profonds."]],
   tip:"Réservé aux confirmés du tube : take-off engagé sur un fond de sable peu profond."},
  {id:'ericeira',name:"Coxos — Ericeira",loc:"Portugal",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore E',swell:'1,8 m',temp:'17°C',tide:'Mi-marée',danger:3,
   desc:"Réserve mondiale de surf, Ericeira aligne des droites de classe mondiale comme Coxos sur fond de rochers.",
   dangers:[['🪨',"Fond rocheux."],['🌊',"Houle puissante."]],
   tip:"Belle droite à rallonge ; chausse des bottillons et respecte les locaux."},
  {id:'mundaka',name:"Mundaka",loc:"Espagne (Pays Basque)",level:'expert',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore S',swell:'2,0 m',temp:'16°C',tide:'Marée descendante',danger:4,
   desc:"La gauche la plus célèbre d'Europe : une vague tubulaire parfaite qui se forme à l'embouchure de la ria de Mundaka.",
   dangers:[['🌀',"Courants de la ria."],['👥',"Spot très convoité."]],
   tip:"Marche surtout à marée descendante avec une bonne houle ; niveau confirmé requis."},
  {id:'thurso',name:"Thurso East",loc:"Écosse (UK)",level:'expert',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'2,2 m',temp:'9°C',tide:'Mi-marée',danger:4,
   desc:"Un reef break glacial et parfait tout au nord de l'Écosse : des tubes de droite dans une eau à faire pâlir.",
   dangers:[['🥶',"Eau glaciale, combi épaisse."],['🪨',"Reef peu profond."]],
   tip:"Combi 5/4 + bottes + gants + cagoule obligatoires : c'est froid mais parfait."},
  {id:'bundoran',name:"Bundoran — The Peak",loc:"Irlande",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,6 m',temp:'11°C',tide:'Mi-marée',danger:3,
   desc:"Le spot phare de l'Irlande : un reef qui offre gauche et droite dans une ambiance celtique.",
   dangers:[['🥶',"Eau froide."],['🪨',"Reef."]],
   tip:"Houle régulière de l'Atlantique nord ; combinaison épaisse indispensable."},
  {id:'rodiles',name:"Rodiles",loc:"Asturies, Espagne",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,6 m',temp:'16°C',tide:'Marée descendante',danger:3,
   desc:"L'une des plus belles droites d'Espagne, à l'embouchure d'une ria asturienne bordée de pins.",
   dangers:[['🌀',"Courants de la ria."],['🥶',"Eau fraîche."]],
   tip:"Marche surtout à marée descendante ; cadre superbe entre ria et forêt."},
  {id:'somo',name:"Somo — Santander",loc:"Cantabrie, Espagne",level:'debutant',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Léger',swell:'1,0 m',temp:'17°C',tide:'Toutes marées',danger:1,
   desc:"Grande plage de sable face à Santander, idéale pour apprendre avec ses vagues douces et ses écoles de surf.",
   dangers:[['👥',"Affluence l'été."],['🌀',"Quelques courants."]],
   tip:"Spot parfait pour débuter ; nombreuses écoles et vagues accueillantes."},
  {id:'zarautz',name:"Zarautz",loc:"Pays Basque, Espagne",level:'intermediaire',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Cross-shore',swell:'1,3 m',temp:'17°C',tide:'Mi-marée',danger:2,
   desc:"La plus longue plage du Pays Basque espagnol, beach break régulier et animé.",
   dangers:[['👥',"Très fréquenté."],['🌀',"Baïnes."]],
   tip:"Bon spot de progression ; surfe le matin pour éviter la foule."},
  {id:'pantin',name:"Playa de Pantín",loc:"Galice, Espagne",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,6 m',temp:'16°C',tide:'Mi-marée',danger:3,
   desc:"Spot galicien de référence qui accueille une étape du circuit mondial, beach break puissant et régulier.",
   dangers:[['🌊',"Houle puissante."],['🥶',"Eau fraîche."]],
   tip:"Vagues consistantes de l'Atlantique galicien ; combinaison conseillée."},
  {id:'lasanta',name:"La Santa — Lanzarote",loc:"Canaries, Espagne",level:'expert',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'2,0 m',temp:'21°C',tide:'Mi-marée',danger:4,
   desc:"Vague de reef puissante des Canaries, l'un des spots les plus réputés et lourds d'Espagne.",
   dangers:[['🪨',"Reef volcanique tranchant."],['🌊',"Vague lourde."]],
   tip:"Reef costaud sur fond de lave ; réservé aux surfeurs confirmés, chausse-toi."},
  {id:'anchorpoint',name:"Anchor Point — Taghazout",loc:"Maroc",level:'intermediaire',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'1,8 m',temp:'19°C',tide:'Mi-marée',danger:3,
   desc:"La droite mythique du Maroc : une vague longue qui déroule sur les rochers devant le village de surf de Taghazout.",
   dangers:[['🪨',"Entrée rocheuse."],['☀️',"Soleil intense, hydrate-toi."]],
   tip:"Longue droite idéale pour enchaîner les manœuvres ; repère le passage dans les rochers."},
  {id:'pipeline',name:"Banzai Pipeline — Oahu",loc:"Hawaï (USA)",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'2,5 m',temp:'25°C',tide:'Toutes marées',danger:4,
   desc:"La vague la plus célèbre du monde : un tube parfait mais redoutable qui déferle sur un récif de corail tranchant.",
   dangers:[['⚠️',"Récif de corail dangereux."],['⚡',"Vague très puissante."]],
   tip:"Spot le plus exigeant du monde : à réserver aux experts confirmés du tube."},
  {id:'mavericks',name:"Mavericks",loc:"Californie (USA)",level:'expert',sky:'#ffd29a',sky2:'#ff926a',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore',swell:'5,0 m',temp:'13°C',tide:'Toutes marées',danger:4,
   desc:"Un spot de grosses vagues où des murs d'eau de 15 m déferlent dans une eau froide réputée pour ses requins.",
   dangers:[['🦈',"Eaux froides à requins."],['🌊',"Vagues géantes."]],
   tip:"Big wave extrême : tow-in et gilet de sécurité, réservé à une poignée de pros."},
  {id:'trestles',name:"Lower Trestles",loc:"Californie (USA)",level:'intermediaire',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Cross-shore',swell:'1,4 m',temp:'18°C',tide:'Mi-marée',danger:2,
   desc:"La vague parfaite de la Californie du Sud : des pics réguliers et maniables, terrain d'entraînement des pros.",
   dangers:[['👥',"Très fréquenté."],['🚶',"Longue marche d'accès."]],
   tip:"Vague-école des pros pour le high-performance ; arrive tôt, c'est bondé."},
  {id:'malibu',name:"Malibu — First Point",loc:"Californie (USA)",level:'debutant',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Léger',swell:'1,0 m',temp:'19°C',tide:'Marée montante',danger:1,
   desc:"La vague de longboard la plus iconique du monde : une droite douce et interminable popularisée dès les années 50.",
   dangers:[['👥',"Foule et localisme."],['🪨',"Quelques galets."]],
   tip:"Le paradis du longboard et des débutants confirmés ; déroule à l'infini."},
  {id:'puerto',name:"Zicatela — Puerto Escondido",loc:"Mexique",level:'expert',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'2,5 m',temp:'28°C',tide:'Toutes marées',danger:4,
   desc:"La « Mexican Pipeline » : un beach break surpuissant qui balance des tubes énormes sur le sable.",
   dangers:[['⚡',"Vagues très puissantes."],['🌀',"Courants forts."]],
   tip:"Beach break costaud et lourd ; travaille ton canard avant d'y aller."},
  {id:'santateresa',name:"Santa Teresa",loc:"Costa Rica",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,5 m',temp:'28°C',tide:'Mi-marée',danger:2,
   desc:"Plage tropicale décontractée du Pacifique costaricien, avec des beach breaks réguliers et une ambiance pura vida.",
   dangers:[['🌀',"Courants par endroits."],['☀️',"Soleil intense."]],
   tip:"Spot idéal pour progresser au chaud ; plusieurs pics le long de la plage."},
  {id:'chicama',name:"Chicama",loc:"Pérou",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,5 m',temp:'18°C',tide:'Toutes marées',danger:2,
   desc:"La gauche la plus longue du monde : on peut y surfer une vague sur plus de 2 km sans s'arrêter.",
   dangers:[['🥶',"Eau fraîche (Humboldt)."],['🦵',"Vague épuisante."]],
   tip:"Prends un bateau pour remonter : la rame est interminable sinon !"},
  {id:'puntadelobos',name:"Punta de Lobos — Pichilemu",loc:"Chili",level:'expert',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'2,5 m',temp:'16°C',tide:'Mi-marée',danger:4,
   desc:"Spot emblématique du Chili : une gauche puissante sous des falaises spectaculaires, sanctuaire de surf protégé.",
   dangers:[['🌊',"Houle puissante."],['🪨',"Rochers et falaises."]],
   tip:"Belle gauche de gros ; eau froide et entrée technique par les rochers."},
  {id:'jbay',name:"Jeffreys Bay (J-Bay)",loc:"Afrique du Sud",level:'expert',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'2,0 m',temp:'18°C',tide:'Mi-marée',danger:3,
   desc:"Supertubes à J-Bay : l'une des droites les plus parfaites et rapides de la planète, étape du championnat du monde.",
   dangers:[['🦈',"Présence de requins."],['🌊',"Vague très rapide."]],
   tip:"Droite de rêve mais rapide ; reste vigilant, le coin est connu pour les requins."},
  {id:'bells',name:"Bells Beach",loc:"Australie",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'2,0 m',temp:'17°C',tide:'Mi-marée',danger:3,
   desc:"Temple du surf australien : un point break puissant qui accueille la plus ancienne compétition pro du monde (depuis 1962).",
   dangers:[['🌊',"Houle puissante."],['🪨',"Reef."]],
   tip:"Vague de caractère ; combinaison conseillée, l'eau du détroit de Bass est fraîche."},
  {id:'snapper',name:"Snapper Rocks — Superbank",loc:"Australie",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,5 m',temp:'23°C',tide:'Mi-marée',danger:2,
   desc:"La « Superbank » de la Gold Coast : une droite de sable interminable qui peut relier plusieurs spots d'un seul ride.",
   dangers:[['👥',"Foule record."],['🌀',"Courant fort au take-off."]],
   tip:"Affluence énorme mais vague magique ; place-toi bien et sois patient."},
  {id:'margaret',name:"Margaret River — Main Break",loc:"Australie",level:'expert',sky:'#ffd29a',sky2:'#ff926a',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore',swell:'2,4 m',temp:'19°C',tide:'Mi-marée',danger:4,
   desc:"Vague de reef puissante de l'ouest australien, qui marche par grosse houle dans un cadre sauvage.",
   dangers:[['🌊',"Grosses vagues."],['🦈',"Zone à requins."]],
   tip:"Spot costaud pour grosse houle ; reste sur tes gardes et vise tes jours."},
  {id:'uluwatu',name:"Uluwatu — Bali",loc:"Indonésie",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'2,0 m',temp:'28°C',tide:'Mi-marée',danger:3,
   desc:"La gauche mythique de Bali : des murs et tubes parfaits au pied de falaises couronnées d'un temple hindou.",
   dangers:[['🪨',"Récif tranchant."],['🕳️',"Sortie par la grotte."]],
   tip:"Entrée et sortie par la grotte selon la marée ; récif peu profond, prudence."},
  {id:'padang',name:"Padang Padang — Bali",loc:"Indonésie",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,8 m',temp:'28°C',tide:'Marée haute',danger:4,
   desc:"La « Balinese Pipeline » : un tube de gauche court mais parfait sur un récif très peu profond.",
   dangers:[['⚠️',"Récif très peu profond."],['⚡',"Tube creux."]],
   tip:"Marche surtout à marée haute avec de la houle ; engagement maximal."},
  {id:'cloudbreak',name:"Cloudbreak — Tavarua",loc:"Fidji",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'2,5 m',temp:'28°C',tide:'Mi-marée',danger:4,
   desc:"L'une des plus belles gauches du monde, au large d'un récif fidjien, longue, creuse et puissante.",
   dangers:[['🪨',"Récif au large."],['🚤',"Accès en bateau."]],
   tip:"Spot de récif au large : accès en bateau et niveau expert indispensables."},
  {id:'teahupoo',name:"Teahupo'o",loc:"Tahiti",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'2,0 m',temp:'27°C',tide:'Mi-marée',danger:4,
   desc:"La vague la plus lourde du monde : un tube épais et monstrueux qui déferle sur un récif corallien affleurant.",
   dangers:[['⚠️',"Récif affleurant."],['⚡',"Vague extrêmement lourde."]],
   tip:"L'une des vagues les plus dangereuses au monde ; à voir absolument, à surfer si tu es pro."},
  {id:'floripa',name:"Joaquina — Florianópolis",loc:"Brésil",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Cross-shore',swell:'1,4 m',temp:'23°C',tide:'Mi-marée',danger:2,
   desc:"Le spot phare de l'île de Florianópolis, beach break animé au cœur de la capitale brésilienne du surf.",
   dangers:[['🌀',"Baïnes."],['👥',"Affluence l'été."]],
   tip:"Bon spot de progression dans une ambiance festive ; attention aux courants."},
  {id:'puntaroca',name:"Punta Roca — La Libertad",loc:"Salvador",level:'intermediaire',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'1,6 m',temp:'28°C',tide:'Mi-marée',danger:3,
   desc:"La droite de référence d'Amérique centrale : un point break rapide qui déroule sur les rochers de La Libertad.",
   dangers:[['🪨',"Fond rocheux."],['🌊',"Vague rapide."]],
   tip:"Belle droite de pointe ; entrée par les rochers, chausse-toi bien."},
  {id:'raglan',name:"Raglan — Manu Bay",loc:"Nouvelle-Zélande",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,8 m',temp:'17°C',tide:'Mi-marée',danger:3,
   desc:"L'une des plus longues gauches du monde, point break parfait popularisé par le film « Endless Summer ».",
   dangers:[['🪨',"Fond rocheux."],['🥶',"Eau fraîche."]],
   tip:"Gauche interminable et régulière ; combinaison conseillée."},
  {id:'saquarema',name:"Saquarema",loc:"Brésil",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,6 m',temp:'23°C',tide:'Mi-marée',danger:3,
   desc:"Le « Maracanã du surf » brésilien : un beach break puissant qui accueille une étape du championnat du monde.",
   dangers:[['🌊',"Beach break puissant."],['🌀',"Courants."]],
   tip:"Vague de compétition ; bonne condition physique recommandée."},
  {id:'montanita',name:"Montañita",loc:"Équateur",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,4 m',temp:'25°C',tide:'Mi-marée',danger:2,
   desc:"Village de surf bohème de la côte équatorienne, point break sympa et ambiance festive.",
   dangers:[['🌀',"Courants."],['👥',"Affluence."]],
   tip:"Bon spot de progression au chaud ; ambiance détendue."},
  {id:'lobitos',name:"Lobitos",loc:"Pérou",level:'intermediaire',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'1,6 m',temp:'20°C',tide:'Mi-marée',danger:3,
   desc:"Gauches multiples et tubulaires dans un ancien village pétrolier du nord péruvien.",
   dangers:[['🥶',"Eau fraîche."],['🪨',"Fond par endroits."]],
   tip:"Plusieurs gauches de qualité ; eau plus fraîche que les tropiques."},
  {id:'mardelplata',name:"Mar del Plata",loc:"Argentine",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Cross-shore',swell:'1,2 m',temp:'17°C',tide:'Mi-marée',danger:2,
   desc:"Le principal spot de surf d'Argentine, beach breaks variés le long de la grande station balnéaire.",
   dangers:[['🌀',"Baïnes."],['🥶',"Eau fraîche."]],
   tip:"Spot urbain animé ; plusieurs plages selon le vent."},
  {id:'arica',name:"El Gringo — Arica",loc:"Chili",level:'expert',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'2,2 m',temp:'19°C',tide:'Marée basse',danger:4,
   desc:"Tube de reef puissant dans le désert d'Atacama, l'une des vagues les plus creuses du Chili.",
   dangers:[['🪨',"Reef peu profond."],['⚡',"Tube creux."]],
   tip:"Tube sérieux sur reef ; réservé aux confirmés, à marée basse."},
  {id:'itacare',name:"Itacaré",loc:"Brésil",level:'debutant',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,0 m',temp:'25°C',tide:'Mi-marée',danger:1,
   desc:"Plages tropicales bordées de forêt atlantique à Bahia, vagues douces idéales pour apprendre.",
   dangers:[['👥',"Affluence."],['🌀',"Quelques courants."]],
   tip:"Cadre paradisiaque pour débuter dans une eau chaude."},
  {id:'shonan',name:"Shonan — Kamakura",loc:"Japon",level:'debutant',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Cross-shore',swell:'0,9 m',temp:'19°C',tide:'Mi-marée',danger:1,
   desc:"La plage de surf la plus populaire du Japon, près de Tokyo, avec des vagues douces et une grande communauté.",
   dangers:[['👥',"Très fréquenté."],['🌀',"Vagues parfois molles."]],
   tip:"Spot d'initiation animé près de Tokyo ; le mont Fuji en toile de fond par temps clair."},
  {id:'arugam',name:"Arugam Bay",loc:"Sri Lanka",level:'intermediaire',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,4 m',temp:'28°C',tide:'Mi-marée',danger:2,
   desc:"Le spot phare du Sri Lanka : une droite de pointe qui déroule sur le sable dans une ambiance tropicale décontractée.",
   dangers:[['🌀',"Courants."],['☀️',"Soleil intense."]],
   tip:"Belle droite facile à lire ; parfait pour progresser au chaud."},
  {id:'cloud9',name:"Cloud 9 — Siargao",loc:"Philippines",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'1,8 m',temp:'28°C',tide:'Mi-marée',danger:4,
   desc:"Le tube de droite légendaire des Philippines, sur un récif au bout d'un ponton de bois.",
   dangers:[['⚠️',"Récif peu profond."],['⚡',"Tube puissant."]],
   tip:"Tube parfait mais sur reef ; niveau confirmé requis."},
  {id:'waikiki',name:"Waikiki — Honolulu",loc:"Hawaï (USA)",level:'debutant',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Léger',swell:'0,8 m',temp:'26°C',tide:'Toutes marées',danger:1,
   desc:"Le berceau du surf moderne : de longues vagues douces parfaites pour apprendre, face aux gratte-ciels d'Honolulu.",
   dangers:[['👥',"Très fréquenté."],['🪨',"Récif par endroits."]],
   tip:"LE spot pour apprendre dans une eau chaude ; déroule en douceur."},
  {id:'unstad',name:"Unstad — Lofoten",loc:"Norvège",level:'intermediaire',sky:'#cfe9f2',sky2:'#9fd4e6',sea:'#2f88a8',sea2:'#13567c',
   wind:'Offshore',swell:'1,6 m',temp:'8°C',tide:'Mi-marée',danger:3,
   desc:"Le surf au-dessus du cercle polaire : des vagues entourées de montagnes enneigées dans les îles Lofoten.",
   dangers:[['🥶',"Eau glaciale."],['❄️',"Conditions arctiques."]],
   tip:"Surf arctique d'exception ; combinaison 6/5 + gants + cagoule indispensables."},
  {id:'skeletonbay',name:"Skeleton Bay",loc:"Namibie",level:'expert',sky:'#ffe1a8',sky2:'#ffc46e',sea:'#2a9bc4',sea2:'#0f659f',
   wind:'Offshore',swell:'2,0 m',temp:'16°C',tide:'Mi-marée',danger:4,
   desc:"Le plus long tube de gauche du monde : une vague de sable parfaite dans le désert de la Skeleton Coast.",
   dangers:[['🏜️',"Spot isolé et désertique."],['🌀',"Courant très fort."]],
   tip:"Tube interminable mais rapide et épuisant ; spot reculé, viens préparé."},
  {id:'mentawai',name:"Lance's Right — Mentawai",loc:"Indonésie",level:'expert',sky:'#aee6f4',sky2:'#5cc4e0',sea:'#41c9d8',sea2:'#1f97bd',
   wind:'Offshore',swell:'2,0 m',temp:'28°C',tide:'Mi-marée',danger:4,
   desc:"L'archipel aux vagues parfaites : des tubes de récif de classe mondiale accessibles en bateau (boat trip).",
   dangers:[['🪨',"Récifs tranchants."],['🚤',"Accès en bateau."]],
   tip:"Paradis du surf en boat trip ; récifs peu profonds, expérience requise."},
  {id:'dungeons',name:"Dungeons — Cape Town",loc:"Afrique du Sud",level:'expert',sky:'#ffd29a',sky2:'#ff926a',sea:'#1f6fa8',sea2:'#0b4068',
   wind:'Offshore',swell:'4,0 m',temp:'15°C',tide:'Toutes marées',danger:4,
   desc:"Spot de grosses vagues près de Cape Town, des murs froids qui déferlent sous la Sentinelle.",
   dangers:[['🦈',"Eaux à requins."],['🌊',"Très grosses vagues."]],
   tip:"Big wave froid et sérieux ; tow-in et sécurité, élite uniquement."},
  {"id":"bluehole_belize","name":"Great Blue Hole","loc":"Belize","level":"expert","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,3 m","temp":"27°C","tide":"—","danger":4,"desc":"Gouffre marin circulaire de 124 m de profondeur classé à l'UNESCO. Plongée mythique parmi stalactites et requins, réservée aux confirmés.","dangers":[["🕳️","Profondeur extrême : narcose et paliers obligatoires."],["🦈","Requins de récif en profondeur."]],"tip":"Plongée technique : brevet avancé et centre encadrant indispensables.","sports":["plongee"]},
  {"id":"sipadan","name":"Sipadan","loc":"Bornéo, Malaisie","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,4 m","temp":"28°C","tide":"—","danger":3,"desc":"Île volcanique cernée d'un tombant vertigineux, célèbre pour ses tornades de barracudas et ses tortues vertes.","dangers":[["🌀","Courants forts le long du tombant."],["🐢","Faune protégée : ne rien toucher."]],"tip":"Permis d'accès limité chaque jour : réserve bien à l'avance.","sports":["plongee","snorkeling"]},
  {"id":"rasmohammed","name":"Ras Muhammad","loc":"Charm el-Cheikh, Égypte","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,4 m","temp":"26°C","tide":"—","danger":2,"desc":"Parc national à la pointe du Sinaï : jardins de corail éclatants et murs de poissons en mer Rouge.","dangers":[["🌊","Courant possible aux pointes."],["🪸","Coraux fragiles, garde tes distances."]],"tip":"Shark & Yolanda Reef est le tombant incontournable.","sports":["plongee","snorkeling"]},
  {"id":"thistlegorm","name":"Épave du Thistlegorm","loc":"Mer Rouge, Égypte","level":"expert","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,4 m","temp":"25°C","tide":"—","danger":4,"desc":"Cargo britannique coulé en 1941, l'une des plus belles épaves du monde : motos, camions et wagons figés sous l'eau.","dangers":[["🚢","Pénétration d'épave réservée aux confirmés."],["🌀","Courant et profondeur (~30 m)."]],"tip":"Formation plongée épave (wreck) fortement recommandée.","sports":["plongee"]},
  {"id":"tulamben","name":"USAT Liberty — Tulamben","loc":"Bali, Indonésie","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,3 m","temp":"28°C","tide":"—","danger":1,"desc":"Épave accessible depuis la plage, posée à quelques mètres et couverte de corail : parfaite pour débuter ou faire du snorkeling.","dangers":[["🪨","Entrée sur galets glissants."],["🐠","Forte affluence le matin."]],"tip":"Plonge tôt le matin pour éviter le monde.","sports":["plongee","snorkeling"]},
  {"id":"greatbarrier","name":"Grande Barrière de corail","loc":"Cairns, Australie","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés","swell":"0,6 m","temp":"26°C","tide":"Variable","danger":2,"desc":"Le plus grand récif corallien du monde, visible depuis l'espace. Snorkeling et plongée dans une biodiversité unique.","dangers":[["🪼","Méduses-boîtes en saison (combinaison)."],["☀️","Soleil intense, protège-toi."]],"tip":"En saison méduses, porte une combinaison intégrale (lycra).","sports":["plongee","snorkeling","baignade"]},
  {"id":"silfra","name":"Faille de Silfra","loc":"Þingvellir, Islande","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Froid","swell":"0 m","temp":"3°C","tide":"—","danger":3,"desc":"Plongée entre les plaques tectoniques Amérique–Europe, dans une eau de source à la visibilité de plus de 100 m.","dangers":[["🥶","Eau glaciale : combinaison étanche obligatoire."],["🧊","Encadrement spécialisé requis."]],"tip":"Brevet drysuit nécessaire ; accompagnement obligatoire.","sports":["plongee","snorkeling"]},
  {"id":"cenote_dosojos","name":"Cenote Dos Ojos","loc":"Tulum, Mexique","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0 m","temp":"25°C","tide":"—","danger":2,"desc":"Cénote d'eau douce cristalline relié à un réseau de grottes, idéal pour le snorkeling et la plongée souterraine encadrée.","dangers":[["🕯️","Plongée souterraine = brevet spéléo strict."],["💧","Eau fraîche, prévois une combinaison."]],"tip":"Pour le snorkeling, reste dans la zone éclairée (les 'ojos').","sports":["plongee","snorkeling","baignade"]},
  {"id":"medes","name":"Îles Medes","loc":"Costa Brava, Espagne","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Calme","swell":"0,4 m","temp":"21°C","tide":"—","danger":2,"desc":"Réserve marine protégée au large de l'Estartit : mérous curieux et grottes, référence de la plongée en Méditerranée.","dangers":[["🚤","Trafic de bateaux en surface."],["🪨","Grottes : reste avec un guide."]],"tip":"Réserve protégée : nombre de plongeurs limité, réserve tôt.","sports":["plongee","snorkeling"]},
  {"id":"portcros","name":"Port-Cros","loc":"Var, France","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Calme","swell":"0,3 m","temp":"22°C","tide":"Faible","danger":1,"desc":"Premier parc national marin d'Europe : un sentier sous-marin balisé fait découvrir herbiers et poissons en snorkeling.","dangers":[["🚤","Zones de mouillage réglementées."],["🌿","Herbiers de posidonie protégés."]],"tip":"Suis le sentier sous-marin depuis la plage de la Palud.","sports":["plongee","snorkeling","baignade"]},
  {"id":"calanques","name":"Calanque de Sugiton","loc":"Marseille, France","level":"intermediaire","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Mistral possible","swell":"0,4 m","temp":"21°C","tide":"Faible","danger":2,"desc":"Criques calcaires aux eaux turquoise entre Marseille et Cassis : plongée, snorkeling et kayak dans un parc national.","dangers":[["☀️","Chaleur et longue marche d'accès."],["🚤","Bateaux nombreux l'été."]],"tip":"Réservation d'accès parfois obligatoire l'été à Sugiton.","sports":["plongee","snorkeling","kayak","baignade"]},
  {"id":"richelieu","name":"Richelieu Rock","loc":"Andaman, Thaïlande","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,5 m","temp":"28°C","tide":"—","danger":2,"desc":"Pinacle isolé en mer d'Andaman : explosion de couleurs et requins-baleines de passage, top spot thaïlandais.","dangers":[["🌀","Courants changeants autour du pinacle."],["🛥️","Accès en croisière plongée."]],"tip":"Meilleure saison : février–avril pour les requins-baleines.","sports":["plongee","snorkeling"]},
  {"id":"rajaampat","name":"Raja Ampat","loc":"Papouasie, Indonésie","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Calme","swell":"0,5 m","temp":"29°C","tide":"Variable","danger":2,"desc":"L'épicentre mondial de la biodiversité marine : récifs intacts et nuées de poissons au cœur du Triangle de corail.","dangers":[["🌀","Courants soutenus (plongées dérivantes)."],["🛥️","Site isolé, accès en liveaboard."]],"tip":"Niveau dérivante conseillé ; suis ton guide de près.","sports":["plongee","snorkeling"]},
  {"id":"galapagos","name":"Darwin & Wolf","loc":"Galápagos, Équateur","level":"expert","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Vent","swell":"1,2 m","temp":"23°C","tide":"Variable","danger":4,"desc":"Plongées de légende au milieu des bancs de requins-marteaux, otaries et raies mantas.","dangers":[["🌀","Courants violents et houle."],["🦈","Grande faune pélagique."]],"tip":"Réservé aux plongeurs expérimentés, en croisière.","sports":["plongee"]},
  {"id":"maldives","name":"Atoll d'Ari","loc":"Maldives","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés","swell":"0,5 m","temp":"29°C","tide":"Variable","danger":1,"desc":"Lagons turquoise et tombants : raies mantas, requins-baleines et jardins de corail, du snorkeling à la plongée.","dangers":[["🌀","Courants dans les passes (channels)."],["☀️","Soleil très fort."]],"tip":"Le snorkeling depuis le lagon convient à toute la famille.","sports":["plongee","snorkeling","baignade"]},
  {"id":"hanauma","name":"Hanauma Bay","loc":"Oahu, Hawaï","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés","swell":"0,4 m","temp":"26°C","tide":"Variable","danger":1,"desc":"Baie volcanique en croissant, réserve marine protégée : le spot snorkeling le plus célèbre d'Hawaï.","dangers":[["🪸","Récif fragile : ne marche pas dessus."],["👥","Quota de visiteurs, réserve en ligne."]],"tip":"Arrive tôt : l'accès est limité chaque jour.","sports":["snorkeling","baignade"]},
  {"id":"bonaire","name":"Lac Bay","loc":"Bonaire","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 25 km/h","swell":"0,2 m","temp":"28°C","tide":"Faible","danger":1,"desc":"Lagon plat et peu profond balayé par les alizés : paradis de l'apprentissage du windsurf, et récifs réputés pour la plongée.","dangers":[["💨","Vent constant, attention à la dérive."],["🪸","Coraux protégés tout autour de l'île."]],"tip":"Côté lagon pour débuter, côté océan pour les confirmés.","sports":["windsurf","kitesurf","plongee","snorkeling"]},
  {"id":"tarifa","name":"Tarifa","loc":"Andalousie, Espagne","level":"intermediaire","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Levante 30 km/h","swell":"0,8 m","temp":"19°C","tide":"Variable","danger":2,"desc":"Capitale européenne du kite et du windsurf, entre Atlantique et Méditerranée, balayée par le Levante et le Poniente.","dangers":[["💨","Vent fort et rafaleux (Levante)."],["👥","Plan d'eau très fréquenté."]],"tip":"Débutants : choisis les jours de Poniente, plus régulier.","sports":["kitesurf","windsurf","surf"]},
  {"id":"dakhla","name":"Lagune de Dakhla","loc":"Maroc","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Onshore 28 km/h","swell":"0,2 m","temp":"20°C","tide":"Variable","danger":1,"desc":"Immense lagune plate et peu profonde, vent thermique quasi quotidien : l'un des meilleurs spots d'apprentissage du kite au monde.","dangers":[["💨","Marée qui découvre des bancs de sable."],["🏜️","Site isolé en plein désert."]],"tip":"Plan d'eau plat idéal pour les premières sessions.","sports":["kitesurf","windsurf"]},
  {"id":"cabarete","name":"Cabarete","loc":"Rép. Dominicaine","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Thermique 25 km/h","swell":"1,0 m","temp":"27°C","tide":"Faible","danger":2,"desc":"Baie animée des Caraïbes : vent thermique l'après-midi pour le kite, vagues le matin pour le surf.","dangers":[["🪸","Récif à l'entrée de la baie."],["💨","Vent qui se lève en milieu de journée."]],"tip":"Surf le matin, kite l'après-midi quand le thermique entre.","sports":["kitesurf","windsurf","surf"]},
  {"id":"lemorne","name":"Le Morne","loc":"Maurice","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 25 km/h","swell":"1,2 m","temp":"26°C","tide":"Variable","danger":3,"desc":"Lagon turquoise au pied d'une montagne classée : flat dans le lagon et la célèbre vague 'One Eye' pour les experts.","dangers":[["🪸","Récif coupant (One Eye) pour confirmés."],["🌀","Passe avec courant vers le large."]],"tip":"Reste dans le lagon pour débuter, One Eye = experts.","sports":["kitesurf","windsurf","snorkeling"]},
  {"id":"cumbuco","name":"Cumbuco","loc":"Ceará, Brésil","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 30 km/h","swell":"0,8 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Spot brésilien réputé : vent puissant et régulier, lagunes d'eau douce et longues sessions downwind.","dangers":[["💨","Vent fort soutenu plusieurs heures."],["🏖️","Buggys et baigneurs sur la plage."]],"tip":"Profite des lagunes (Cumbuco, Lagoinha) pour le flat.","sports":["kitesurf","windsurf"]},
  {"id":"essaouira","name":"Essaouira","loc":"Maroc","level":"intermediaire","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Alizés 30 km/h","swell":"1,2 m","temp":"19°C","tide":"Variable","danger":2,"desc":"La 'ville du vent' : baie ventée idéale pour le windsurf et le kite, ambiance médina et longues plages.","dangers":[["💨","Vent fort l'après-midi (alizés)."],["🌊","Clapot formé dans la baie."]],"tip":"Matinées plus calmes pour débuter, vent musclé l'après-midi.","sports":["windsurf","kitesurf","surf"]},
  {"id":"lafranqui","name":"La Franqui","loc":"Leucate, France","level":"intermediaire","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Tramontane 35 km/h","swell":"0,9 m","temp":"18°C","tide":"Faible","danger":2,"desc":"Spot phare du Languedoc balayé par la tramontane, théâtre du Mondial du Vent : kite et windsurf de haut niveau.","dangers":[["💨","Tramontane offshore très puissante."],["🌬️","Vent de terre : risque de dérive au large."]],"tip":"Vent offshore : ne pars jamais seul, reste près du bord.","sports":["kitesurf","windsurf"]},
  {"id":"jericoacoara","name":"Jericoacoara","loc":"Ceará, Brésil","level":"intermediaire","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 32 km/h","swell":"0,8 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Village de dunes classé, vent quasi quotidien et lagunes : l'un des spots de kite les plus célèbres du Brésil.","dangers":[["💨","Vent fort et longues distances."],["🏜️","Accès en 4x4 à travers les dunes."]],"tip":"Idéal pour le downwind ; hydrate-toi, le vent dessèche.","sports":["kitesurf","windsurf"]},
  {"id":"hookipa","name":"Ho'okipa","loc":"Maui, Hawaï","level":"expert","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 30 km/h","swell":"2,5 m","temp":"25°C","tide":"Variable","danger":4,"desc":"Mecque mondiale du windsurf de vagues : alizés puissants et houle solide, pour riders confirmés uniquement.","dangers":[["🪨","Récif peu profond et coupant."],["🌊","Grosses vagues + vent fort."]],"tip":"Spot d'experts ; observe les locaux avant d'aller à l'eau.","sports":["windsurf","surf","kitesurf"]},
  {"id":"pozo","name":"Pozo Izquierdo","loc":"Gran Canaria, Espagne","level":"expert","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés 40 km/h","swell":"1,4 m","temp":"21°C","tide":"Variable","danger":3,"desc":"Spot de coupe du monde de windsurf : parmi les alizés les plus forts d'Europe et des sauts spectaculaires.","dangers":[["💨","Vent très violent (40+ km/h)."],["🪨","Entrée sur rochers."]],"tip":"Réservé aux windsurfeurs confirmés, gréements très réduits.","sports":["windsurf","kitesurf"]},
  {"id":"gardalake","name":"Lac de Garde — Torbole","loc":"Italie","level":"debutant","sky":"#cdeef0","sky2":"#8fd8d2","sea":"#2b8f96","sea2":"#15616a","wind":"Ora & Pelèr 20 km/h","swell":"0 m","temp":"20°C","tide":"—","danger":1,"desc":"Plus grand lac d'Italie, encadré de montagnes : vents thermiques fiables (Pelèr le matin, Ora l'après-midi), parfaits pour windsurf et paddle.","dangers":[["💨","Vent qui force l'après-midi (Ora)."],["🏔️","Eau fraîche en profondeur."]],"tip":"Matin pour apprendre, après-midi pour le vent musclé.","sports":["windsurf","paddle","kayak"]},
  {"id":"hoodriver","name":"Hood River — Columbia Gorge","loc":"Oregon, USA","level":"intermediaire","sky":"#cdeef0","sky2":"#8fd8d2","sea":"#2b8f96","sea2":"#15616a","wind":"Onshore 35 km/h","swell":"0,4 m","temp":"16°C","tide":"—","danger":2,"desc":"Le 'Gorge' : couloir venté le long du fleuve Columbia, capitale américaine du windsurf et du kite en eau plane à clapoteuse.","dangers":[["💨","Vent fort canalisé par la gorge."],["🚢","Trafic fluvial (barges)."]],"tip":"Eau froide : combinaison conseillée même l'été.","sports":["windsurf","kitesurf","paddle"]},
  {"id":"annecy","name":"Lac d'Annecy","loc":"Haute-Savoie, France","level":"debutant","sky":"#cdeef0","sky2":"#8fd8d2","sea":"#2b8f96","sea2":"#15616a","wind":"Brise 12 km/h","swell":"0 m","temp":"22°C","tide":"—","danger":1,"desc":"L'un des lacs les plus purs d'Europe, eau émeraude au pied des Alpes : paddle, kayak et baignade en eau calme.","dangers":[["🚣","Trafic de bateaux l'été."],["🌬️","Brise thermique l'après-midi."]],"tip":"Pars le matin : l'eau est un miroir parfait pour le paddle.","sports":["paddle","kayak","baignade"]},
  {"id":"verdon","name":"Gorges du Verdon","loc":"Lac de Sainte-Croix, France","level":"debutant","sky":"#cdeef0","sky2":"#8fd8d2","sea":"#2b8f96","sea2":"#15616a","wind":"Brise","swell":"0 m","temp":"23°C","tide":"—","danger":1,"desc":"Canyon turquoise spectaculaire : on remonte les gorges en paddle ou en kayak depuis le lac de Sainte-Croix.","dangers":[["☀️","Forte chaleur, peu d'ombre."],["🚣","Affluence l'été, location limitée."]],"tip":"Loue tôt le matin, les embarcations partent vite l'été.","sports":["kayak","paddle","baignade"]},
  {"id":"glenan","name":"Archipel des Glénan","loc":"Finistère, France","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Brise marine","swell":"0,4 m","temp":"18°C","tide":"Variable","danger":2,"desc":"Petit archipel breton aux eaux translucides surnommé 'les Caraïbes bretonnes' : paddle, snorkeling et baignade.","dangers":[["🌊","Courants entre les îlots."],["🚤","Accès en bateau seulement."]],"tip":"Vérifie l'horaire des navettes pour le retour.","sports":["paddle","kayak","snorkeling","baignade"]},
  {"id":"capri","name":"Capri","loc":"Italie","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Brise","swell":"0,4 m","temp":"24°C","tide":"Faible","danger":1,"desc":"Île célèbre du golfe de Naples : eaux bleues, Grotte Bleue et criques à explorer en kayak ou en snorkeling.","dangers":[["🚤","Beaucoup de bateaux l'été."],["🪨","Entrées rocheuses."]],"tip":"Tôt le matin pour la Grotte Bleue, avant la foule.","sports":["kayak","snorkeling","baignade"]},
  {"id":"palombaggia","name":"Palombaggia","loc":"Corse, France","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Brise","swell":"0,4 m","temp":"23°C","tide":"Faible","danger":1,"desc":"Plage de sable blanc et pins parasols aux eaux turquoise, l'une des plus belles de Corse : baignade et snorkeling.","dangers":[["☀️","Soleil intense, ombre rare."],["👥","Très fréquentée en haute saison."]],"tip":"Arrive tôt pour la place et l'eau calme.","sports":["baignade","snorkeling","paddle"]},
  {"id":"praia_marinha","name":"Praia da Marinha","loc":"Algarve, Portugal","level":"debutant","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Brise","swell":"0,6 m","temp":"21°C","tide":"Variable","danger":1,"desc":"Falaises ocre et arches naturelles au-dessus d'une eau cristalline : joyau de l'Algarve pour la baignade et le kayak.","dangers":[["🪨","Accès par un escalier raide."],["🌊","Houle possible près des arches."]],"tip":"Va voir les arches en kayak quand la mer est calme.","sports":["baignade","snorkeling","kayak"]},
  {"id":"navagio","name":"Navagio","loc":"Zakynthos, Grèce","level":"intermediaire","sky":"#bfe9f7","sky2":"#79cdeb","sea":"#1f9fc6","sea2":"#0d6a9e","wind":"Brise","swell":"0,5 m","temp":"23°C","tide":"Faible","danger":2,"desc":"Crique de l'épave, accessible uniquement par bateau, encadrée de falaises blanches et d'une eau bleu électrique.","dangers":[["🪨","Chutes de pierres au pied de la falaise."],["🚤","Accès bateau, mer parfois agitée."]],"tip":"Pars tôt : l'après-midi la crique est bondée.","sports":["baignade","snorkeling","kayak"]},
  {"id":"anse_source","name":"Anse Source d'Argent","loc":"La Digue, Seychelles","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés","swell":"0,3 m","temp":"28°C","tide":"Variable","danger":1,"desc":"Plage iconique aux blocs de granit rose et lagon peu profond protégé par le récif : baignade et snorkeling de carte postale.","dangers":[["🪸","Récif proche : attention aux coraux."],["☀️","Soleil équatorial très fort."]],"tip":"Marée haute pour mieux nager au-dessus du lagon.","sports":["baignade","snorkeling","paddle"]},
  {"id":"whitehaven","name":"Whitehaven Beach","loc":"Whitsundays, Australie","level":"debutant","sky":"#bfeffb","sky2":"#74d4ee","sea":"#15bcd0","sea2":"#0a7d96","wind":"Alizés","swell":"0,4 m","temp":"25°C","tide":"Variable","danger":1,"desc":"Sable de silice d'un blanc pur et eaux tourbillonnantes turquoise au cœur des Whitsundays : baignade et paddle de rêve.","dangers":[["🪼","Méduses en saison (combinaison)."],["🚤","Accès en bateau ou hydravion."]],"tip":"En saison méduses, porte un lycra intégral.","sports":["baignade","snorkeling","paddle"]},
  {"id":"wissant","name":"Wissant","loc":"Pas-de-Calais, France","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 30 km/h","swell":"1,0 m","temp":"16°C","tide":"Variable","danger":3,"desc":"Grande baie ventée entre le cap Gris-Nez et le cap Blanc-Nez : l'un des meilleurs spots de kite et windsurf du nord, avec un peu de vague.","dangers":[["💨","Vent fort et marées de grande amplitude."],["🌊","Forts courants à marée descendante."]],"tip":"Repère l'horaire des marées : le plan d'eau change énormément.","sports":["kitesurf","windsurf","surf","baignade"]},
  {"id":"letouquet","name":"Le Touquet — Paris-Plage","loc":"Pas-de-Calais, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 25 km/h","swell":"0,6 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Immense plage de sable fin, mythique pour le kitesurf et le char à voile : eau peu profonde, idéale pour débuter par vent thermique.","dangers":[["🌊","Marée qui monte vite sur l'estran plat."],["💨","Zone partagée avec chars à voile et baigneurs."]],"tip":"Reste près du bord à marée montante, elle remonte très vite.","sports":["kitesurf","baignade","paddle","bodyboard"]},
  {"id":"hardelot","name":"Hardelot-Plage","loc":"Pas-de-Calais, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 26 km/h","swell":"0,7 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Longue plage entre dunes et forêt, spot familial réputé pour le kite et le windsurf à marée basse.","dangers":[["🌊","Estran très plat, marée rapide."],["💨","Vent souvent onshore soutenu."]],"tip":"Le meilleur plan d'eau se forme autour de la marée basse.","sports":["kitesurf","windsurf","baignade","surf"]},
  {"id":"wimereux","name":"Wimereux","loc":"Pas-de-Calais, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 24 km/h","swell":"0,6 m","temp":"15°C","tide":"Variable","danger":2,"desc":"Petite station balnéaire Belle Époque proche de Boulogne, plage de galets et sable, sympa pour le kite et la baignade surveillée.","dangers":[["🪨","Galets glissants à l'entrée."],["🌊","Courants par fort coefficient."]],"tip":"Baignade surveillée l'été : reste entre les drapeaux.","sports":["kitesurf","baignade","bodyboard"]},
  {"id":"berck","name":"Berck-sur-Mer","loc":"Pas-de-Calais, France","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 28 km/h","swell":"0,7 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Plage immense balayée par le vent, haut lieu du cerf-volant et du kite, avec des phoques en baie d'Authie à proximité.","dangers":[["🌊","Estran plat : marée montante très rapide."],["💨","Vent fréquent et soutenu."]],"tip":"Va observer les phoques de la baie d'Authie (à distance).","sports":["kitesurf","windsurf","baignade"]},
  {"id":"malolesbains","name":"Malo-les-Bains — Dunkerque","loc":"Nord, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 26 km/h","swell":"0,5 m","temp":"16°C","tide":"Variable","danger":2,"desc":"La plage de Dunkerque, large et plate : digue animée, baignade familiale et bon spot de kite par vent de nord-ouest.","dangers":[["🚢","Proximité du port et du trafic maritime."],["🌊","Estran plat, marée rapide."]],"tip":"Évite la zone du chenal portuaire à l'est.","sports":["kitesurf","baignade","paddle"]},
  {"id":"lehavre","name":"Le Havre — Plage","loc":"Seine-Maritime, France","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 28 km/h","swell":"0,8 m","temp":"15°C","tide":"Variable","danger":2,"desc":"Plage de galets en plein cœur de la ville, spot de kite réputé et petites vagues par houle de sud-ouest.","dangers":[["🪨","Galets : chaussons conseillés."],["🚢","Proximité de l'entrée du port."]],"tip":"Galets glissants : protège tes pieds à l'entrée.","sports":["kitesurf","surf","bodyboard"]},
  {"id":"etretat","name":"Étretat","loc":"Seine-Maritime, France","level":"debutant","sky":"#cfeaf0","sky2":"#9bd6dd","sea":"#2a8fa0","sea2":"#14606e","wind":"Brise","swell":"0,5 m","temp":"15°C","tide":"Variable","danger":2,"desc":"Célèbres falaises et arches de craie au-dessus d'une plage de galets : kayak au pied des aiguilles et baignade par mer calme.","dangers":[["🪨","Chutes de pierres au pied des falaises."],["🌊","Courants sous les arches."]],"tip":"Sors en kayak voir l'Aiguille seulement par mer calme.","sports":["kayak","baignade","snorkeling"]},
  {"id":"dieppe","name":"Dieppe","loc":"Seine-Maritime, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 24 km/h","swell":"0,6 m","temp":"15°C","tide":"Variable","danger":2,"desc":"Grande plage de galets dominée par son château, baignade surveillée et spot de kite face aux falaises.","dangers":[["🪨","Galets et entrée d'eau abrupte."],["🚢","Trafic du port à l'est de la plage."]],"tip":"Baignade surveillée l'été ; le kite se pratique à l'ouest.","sports":["baignade","kayak","kitesurf"]},
  {"id":"siouville","name":"Siouville-Hague","loc":"Manche, France","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Offshore SE","swell":"1,3 m","temp":"15°C","tide":"Variable","danger":3,"desc":"LE spot de surf de Normandie, sur la côte ouest du Cotentin : beach break exposé qui capte bien la houle atlantique.","dangers":[["🌀","Courants forts par gros coefficient."],["🌊","Houle qui grossit vite."]],"tip":"Surf plus consistant à mi-marée ; gare aux courants de bord.","sports":["surf","bodyboard","kitesurf"]},
  {"id":"vauville","name":"Vauville","loc":"Manche, France","level":"intermediaire","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Offshore E","swell":"1,2 m","temp":"15°C","tide":"Variable","danger":3,"desc":"Longue baie sauvage du Cotentin face au nez de Jobourg : houle puissante et vent, pour surfeurs et kiteurs aguerris.","dangers":[["🌀","Courants violents (raz Blanchard proche)."],["🌊","Spot exposé, conditions changeantes."]],"tip":"Site exposé : vérifie bien la météo et n'y va pas seul.","sports":["surf","bodyboard","kitesurf"]},
  {"id":"hauteville","name":"Hauteville-sur-Mer","loc":"Manche, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 25 km/h","swell":"0,6 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Grande plage plate de la côte des Havres, paradis du char à voile et du kite à marée basse, baignade familiale.","dangers":[["🌊","Estran immense : marée montante très rapide."],["💨","Vent partagé avec les chars à voile."]],"tip":"À marée basse l'eau est loin : surveille bien le flot.","sports":["kitesurf","baignade","paddle"]},
  {"id":"granville","name":"Granville — Plat Gousset","loc":"Manche, France","level":"debutant","sky":"#cfeaf0","sky2":"#9bd6dd","sea":"#2a8fa0","sea2":"#14606e","wind":"Brise","swell":"0,5 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Cité corsaire face aux îles Chausey : kayak vers l'archipel et baignade, dans l'une des plus grandes marées d'Europe.","dangers":[["🌊","Marnage parmi les plus forts d'Europe."],["🚤","Trafic vers Chausey et Jersey."]],"tip":"Traversée vers Chausey en kayak : uniquement encadrée.","sports":["kayak","baignade","paddle"]},
  {"id":"saintmalo","name":"Saint-Malo — Le Sillon","loc":"Ille-et-Vilaine, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 22 km/h","swell":"0,7 m","temp":"16°C","tide":"Variable","danger":2,"desc":"La grande plage du Sillon face à la cité corsaire : baignade, paddle, kite et petites vagues, sous l'une des plus fortes marées du monde.","dangers":[["🌊","Marnage énorme, courants en bord de digue."],["🪨","Brise-lames et rochers (Grand Bé)."]],"tip":"Va au Grand Bé à pied seulement à marée basse, surveille l'heure.","sports":["baignade","kayak","paddle","kitesurf","surf"]},
  {"id":"saintlunaire","name":"Saint-Lunaire","loc":"Ille-et-Vilaine, France","level":"debutant","sky":"#d3e3ea","sky2":"#a4c3d2","sea":"#2f6f86","sea2":"#173f52","wind":"Onshore 22 km/h","swell":"0,8 m","temp":"16°C","tide":"Variable","danger":2,"desc":"Station balnéaire de la Côte d'Émeraude avec une plage exposée qui prend la houle : bon spot d'initiation au surf.","dangers":[["🪨","Rochers en bord de plage à marée basse."],["🌊","Courants par fort coefficient."]],"tip":"Idéal pour débuter le surf à mi-marée montante.","sports":["surf","baignade","bodyboard","paddle"]},
  {"id":"erquy","name":"Erquy — Cap d'Erquy","loc":"Côtes-d'Armor, France","level":"debutant","sky":"#cfeaf0","sky2":"#9bd6dd","sea":"#2a8fa0","sea2":"#14606e","wind":"Brise","swell":"0,5 m","temp":"16°C","tide":"Variable","danger":1,"desc":"Eaux claires et landes de grès rose du cap d'Erquy : criques sauvages parfaites pour le kayak, le snorkeling et la baignade.","dangers":[["🪨","Rochers et plateaux découvrants."],["🌊","Courants entre les criques."]],"tip":"Explore les criques du cap en kayak par mer calme.","sports":["kayak","snorkeling","baignade","paddle"]},
  {"id":"perros","name":"Perros-Guirec — Trestraou","loc":"Côtes-d'Armor, France","level":"debutant","sky":"#cfeaf0","sky2":"#9bd6dd","sea":"#2a8fa0","sea2":"#14606e","wind":"Brise","swell":"0,5 m","temp":"16°C","tide":"Variable","danger":1,"desc":"Porte de la Côte de Granit Rose : plage de Trestraou et sentier des douaniers vers Ploumanac'h, idéal kayak, paddle et baignade.","dangers":[["🪨","Chaos de rochers roses, attention à marée basse."],["🚤","Navettes vers les Sept-Îles."]],"tip":"En kayak, longe le granit rose jusqu'à Ploumanac'h.","sports":["baignade","kayak","paddle","snorkeling"]},
  {"id":"imsouane","name":"Imsouane — La Cathédrale","loc":"Maroc","level":"debutant","sky":"#ffe8c4","sky2":"#ffbe86","sea":"#1fa8c0","sea2":"#0d6f8c","wind":"Offshore","swell":"1,0 m","temp":"19°C","tide":"Mi-marée","danger":1,"desc":"Une droite qui déroule interminablement au fond d'une baie de pêcheurs. Vague lente et docile : c'est le spot où l'on apprend à tenir une vague longtemps.","dangers":[["👥","Très fréquentée : respecte la priorité et la file d'attente au pic."],["🚤","Port de pêche actif, ne coupe pas la route des barques."]],"tip":"Rame jusqu'au bout de la baie et laisse-toi porter : la vague fait le travail.","sports":["surf","paddle","baignade"]},
  {"id":"safi","name":"Safi — Ras Lafaa","loc":"Maroc","level":"expert","sky":"#ffe8c4","sky2":"#ffbe86","sea":"#1fa8c0","sea2":"#0d6f8c","wind":"Offshore","swell":"2,2 m","temp":"18°C","tide":"Mi-marée","danger":4,"desc":"Une des droites tubulaires les plus rapides d'Afrique, sur un fond de dalle rocheuse. Elle ne marche que quelques jours par an, avec une grosse houle et le bon vent.","dangers":[["🪨","Fond rocheux peu profond, chute risquée."],["⚡","Vague très rapide qui ferme sur la fin."],["🌊","Ne se déclenche que par forte houle : conditions sérieuses."]],"tip":"Regarde longuement depuis la falaise avant d'y aller. Si tu hésites, c'est non.","sports":["surf","bodyboard"]},
  {"id":"sidikaouki","name":"Sidi Kaouki","loc":"Essaouira, Maroc","level":"intermediaire","sky":"#ffe8c4","sky2":"#ffbe86","sea":"#1fa8c0","sea2":"#0d6f8c","wind":"Onshore fort","swell":"1,4 m","temp":"18°C","tide":"Variable","danger":2,"desc":"Longue plage battue par l'alizé, au sud d'Essaouira. Le vent y est presque quotidien l'après-midi : les voiles prennent le relais des planches de surf.","dangers":[["💨","Vent thermique très fort l'après-midi."],["🌀","Courant latéral le long de la plage."]],"tip":"Surfe le matin, navigue l'après-midi : c'est le rythme du spot.","sports":["surf","kitesurf","windsurf","baignade"]},
  {"id":"ngor","name":"Ngor Right","loc":"Dakar, Sénégal","level":"intermediaire","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"1,5 m","temp":"24°C","tide":"Mi-marée","danger":3,"desc":"La droite de récif rendue célèbre par le film The Endless Summer, en face de l'île de Ngor. Elle s'atteint en pirogue depuis la plage.","dangers":[["🪨","Récif peu profond à marée basse."],["🚤","Trafic de pirogues entre l'île et la côte."]],"tip":"Prends la pirogue avec les locaux plutôt que de ramer : le courant du chenal est fort.","sports":["surf","bodyboard","snorkeling"]},
  {"id":"ouakam","name":"Ouakam","loc":"Dakar, Sénégal","level":"expert","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"1,8 m","temp":"24°C","tide":"Marée haute","danger":4,"desc":"Une gauche puissante qui casse sur le récif au pied de la mosquée de la Divinité, dans une baie encaissée de Dakar.","dangers":[["🪨","Récif tranchant, très peu d'eau à marée basse."],["🌀","Courant de sortie dans la baie."],["⚡","Vague creuse dès que la houle monte."]],"tip":"Entre et sors par le côté droit de la baie, là où le courant t'aide.","sports":["surf","bodyboard"]},
  {"id":"elandsbay","name":"Elands Bay","loc":"Afrique du Sud","level":"intermediaire","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Offshore SE","swell":"1,6 m","temp":"14°C","tide":"Mi-marée","danger":3,"desc":"Une longue gauche de pointe sur la côte ouest, dans une eau très froide remontée par le courant de Benguela. Spot de bout du monde, peu de monde à l'eau.","dangers":[["🥶","Eau souvent sous 15°C : combinaison épaisse obligatoire."],["🪨","Rochers à l'entrée du pic."],["🌀","Courant qui pousse le long de la pointe."]],"tip":"Combinaison 4/3 minimum, cagoule utile. Entre par les rochers du haut de la pointe.","sports":["surf","bodyboard"]},
  {"id":"muizenberg","name":"Muizenberg","loc":"Le Cap, Afrique du Sud","level":"debutant","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Variable","swell":"0,9 m","temp":"16°C","tide":"Variable","danger":2,"desc":"La plage-école du Cap, avec ses cabanes de plage colorées et une mousse douce qui déroule longtemps. Tout le monde commence ici.","dangers":[["👥","Très fréquentée le week-end."],["🦈","Baie de False Bay : respecte les consignes de la surveillance requins."],["🥶","Eau fraîche toute l'année."]],"tip":"Regarde le drapeau de la vigie avant d'entrer, et reste dans la zone surveillée.","sports":["surf","bodyboard","baignade","paddle"]},
  {"id":"dahab","name":"Blue Hole — Dahab","loc":"Mer Rouge, Égypte","level":"expert","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,2 m","temp":"25°C","tide":"Sans objet","danger":4,"desc":"Un puits circulaire ouvert dans le récif, bordé de corail intact. Site magnifique en surface — et l'un des plus meurtriers du monde en profondeur, à cause de l'arche.","dangers":[["🕳️","L'arche profonde a fait de nombreuses victimes : elle n'est pas un objectif de loisir."],["⚠️","Profondeur trompeuse, l'eau très claire fait sous-estimer la descente."],["🚫","Ne plonge qu'avec un centre local et dans tes limites de brevet."]],"tip":"Le snorkeling sur le bord du trou est splendide et sans danger : il suffit largement.","sports":["plongee","snorkeling"]},
  {"id":"nosybe","name":"Nosy Tanikely","loc":"Nosy Be, Madagascar","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,3 m","temp":"27°C","tide":"Variable","danger":1,"desc":"Une réserve marine autour d'un îlot : tortues, poissons de récif et coraux à quelques mètres du bord. L'un des meilleurs sites de snorkeling de l'océan Indien.","dangers":[["🚤","Navettes et pirogues autour de l'îlot."],["☀️","Aucune ombre sur la plage, soleil équatorial."]],"tip":"Un lycra plutôt que de la crème : le récif est protégé, et tu bronzes moins bêtement.","sports":["snorkeling","plongee","baignade"]},
  {"id":"watamu","name":"Watamu","loc":"Kenya","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Alizé","swell":"0,4 m","temp":"27°C","tide":"Marée basse","danger":2,"desc":"Un parc marin national protégé depuis les années 1960 : lagon peu profond, patates de corail et tortues qui viennent pondre sur la plage.","dangers":[["🌀","Courants forts dans les passes du récif à marée descendante."],["☀","Soleil équatorial, insolation rapide."],["🚫","Parc marin : ne prélève rien, ne touche pas le corail."]],"tip":"Reste dans le lagon à marée basse : les passes se vident très vite.","sports":["snorkeling","kitesurf","baignade","paddle"]},
  {"id":"keramas","name":"Keramas","loc":"Bali, Indonésie","level":"expert","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"1,7 m","temp":"28°C","tide":"Marée montante","danger":4,"desc":"Droite courte et très creuse sur la côte est de Bali, réputée pour ses sections de manœuvres. Elle marche le matin, quand le vent de terre lisse la houle.","dangers":[["🪨","Fond de récif proche de la surface."],["⚡","Vague qui ferme brutalement sur la fin."],["👥","Pic étroit et très disputé."]],"tip":"Session à l'aube : après 9 h le vent tourne et la vague se hache.","sports":["surf","bodyboard"]},
  {"id":"nias","name":"Lagundri Bay — Nias","loc":"Indonésie","level":"expert","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"2,0 m","temp":"28°C","tide":"Marée haute","danger":4,"desc":"Une droite de récif d'une régularité rare, dans une baie ouverte à la houle de l'océan Indien. Un tube long et lisible, mais sur un platier corallien très peu profond.","dangers":[["🪨","Corail affleurant, blessures fréquentes."],["⚡","Section de bowl très creuse à la fin."],["⚠️","Île isolée, secours médicaux éloignés."]],"tip":"Chaussons de récif et trousse de soin : ici, une coupure de corail s'infecte vite.","sports":["surf"]},
  {"id":"gland","name":"G-Land — Plengkung","loc":"Java, Indonésie","level":"expert","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"2,0 m","temp":"28°C","tide":"Marée montante","danger":4,"desc":"Une gauche interminable qui déroule le long d'un récif, au bord d'un parc national où la jungle descend jusqu'à la plage. On n'y accède que par bateau.","dangers":[["🪨","Récif peu profond sur toute la longueur."],["⚠️","Site isolé dans un parc national, pas de secours immédiats."],["🌊","Sections très rapides par grosse houle."]],"tip":"Repère les trois sections depuis la plage avant de ramer : elles ne se surfent pas pareil.","sports":["surf"]},
  {"id":"komodo","name":"Komodo","loc":"Indonésie","level":"expert","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,4 m","temp":"27°C","tide":"Fort marnage","danger":4,"desc":"Des courants puissants entre les îles y concentrent une vie marine spectaculaire : raies manta, bancs serrés et tombants couverts de coraux mous.","dangers":[["🌀","Courants parmi les plus forts d'Indonésie, y compris descendants."],["🚤","Navigation dense entre les sites."],["⚠️","Plongée en dérive réservée aux plongeurs expérimentés."]],"tip":"Ne plonge qu'avec un guide local : ici, la lecture des courants est un métier.","sports":["plongee","snorkeling"]},
  {"id":"bunaken","name":"Bunaken","loc":"Sulawesi, Indonésie","level":"intermediaire","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,3 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Des murs de corail qui plongent à la verticale dès quelques mètres, dans un parc marin national. Tortues et bancs de fusiliers le long du tombant.","dangers":[["🌀","Courant le long du tombant, variable selon la marée."],["⚠️","Le vide donne le vertige : surveille ton profondimètre."]],"tip":"Longe le tombant en gardant le mur à ta droite : tu ne te perdras pas.","sports":["plongee","snorkeling"]},
  {"id":"similan","name":"Îles Similan","loc":"Thaïlande","level":"intermediaire","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,3 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Des blocs de granit posés sur le sable blanc, des gorgones et une eau très claire. Le parc national ferme une partie de l'année pour laisser le récif souffler.","dangers":[["🚫","Parc national : période de fermeture annuelle, renseigne-toi."],["🌀","Courant modéré entre les blocs."]],"tip":"Vérifie les dates d'ouverture du parc avant de réserver quoi que ce soit.","sports":["plongee","snorkeling","baignade"]},
  {"id":"weligama","name":"Weligama","loc":"Sri Lanka","level":"debutant","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Onshore léger","swell":"0,8 m","temp":"28°C","tide":"Variable","danger":1,"desc":"Une baie sablonneuse peu profonde où la mousse déroule doucement sur des centaines de mètres. Le spot d'apprentissage de la côte sud.","dangers":[["👥","Beaucoup d'écoles de surf au même endroit."],["🏖️","Quelques rochers isolés côté est de la baie."]],"tip":"Reste sur la moitié ouest de la baie : le fond y est propre et régulier.","sports":["surf","bodyboard","baignade","paddle"]},
  {"id":"ichinomiya","name":"Ichinomiya — Chiba","loc":"Japon","level":"intermediaire","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore","swell":"1,2 m","temp":"21°C","tide":"Mi-marée","danger":2,"desc":"La plage de surf de la région de Tokyo, choisie pour les épreuves olympiques de 2021. Beach break régulier, très fréquenté le week-end.","dangers":[["👥","Affluence forte, priorité respectée à la japonaise."],["🌀","Courants de retour entre les bancs."],["⚠️","Saison des typhons en fin d'été : houle et vent brutaux."]],"tip":"Le matin en semaine, tu as la plage presque pour toi.","sports":["surf","bodyboard"]},
  {"id":"kerama","name":"Îles Kerama","loc":"Okinawa, Japon","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Brise","swell":"0,3 m","temp":"26°C","tide":"Variable","danger":1,"desc":"Un archipel de parc national à une heure de Naha, connu pour la transparence de son eau — le « bleu Kerama » — et pour ses tortues vertes qui broutent l'herbier.","dangers":[["🚤","Ferries et bateaux de plongée dans les passes."],["🌀","Courant entre les îlots."],["🚫","Parc national : garde tes distances avec les tortues."]],"tip":"Palme au-dessus de l'herbier sans t'y poser : c'est le garde-manger des tortues.","sports":["snorkeling","plongee","baignade","kayak"]},
  {"id":"rincon","name":"Rincón — Tres Palmas","loc":"Porto Rico","level":"expert","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"2,0 m","temp":"27°C","tide":"Variable","danger":4,"desc":"La grosse droite des Caraïbes, qui ne se réveille qu'avec les houles d'hiver de l'Atlantique nord. Le spot est aussi une réserve marine de corail corne d'élan.","dangers":[["🌊","Ne marche que par grosse houle : puissance élevée."],["🪨","Récif de corail vivant, à ne pas toucher."],["🌀","Courant de sortie le long du récif."]],"tip":"Hors houle, c'est un site de snorkeling remarquable : le corail corne d'élan y est protégé.","sports":["surf","snorkeling"]},
  {"id":"pavones","name":"Pavones","loc":"Costa Rica","level":"intermediaire","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"1,5 m","temp":"28°C","tide":"Marée montante","danger":3,"desc":"Une gauche de galets réputée pour sa longueur : par bonne houle du sud, une seule vague peut durer plus d'une minute.","dangers":[["🪨","Fond de galets roulants à l'entrée."],["🌀","Courant qui pousse vers l'embouchure de la rivière."],["⚠️","Village isolé, accès long par la route."]],"tip":"Marche jusqu'au haut de la pointe et rentre à pied : ramer contre le courant t'épuisera.","sports":["surf"]},
  {"id":"tamarindo","name":"Tamarindo","loc":"Costa Rica","level":"debutant","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Onshore léger","swell":"0,9 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Une baie large et sableuse, chaude toute l'année, avec des vagues d'école au centre et un estuaire bordé de mangrove à une extrémité.","dangers":[["🌀","Fort courant dans l'estuaire, surtout à marée descendante."],["👥","Nombreuses écoles de surf sur le même pic."],["⚠️","Crocodiles signalés dans l'estuaire : on n'y nage pas."]],"tip":"Reste sur la plage principale et évite complètement l'embouchure de la rivière.","sports":["surf","bodyboard","baignade","paddle"]},
  {"id":"sayulita","name":"Sayulita","loc":"Mexique","level":"debutant","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Onshore léger","swell":"0,8 m","temp":"27°C","tide":"Variable","danger":1,"desc":"Un village de la côte Pacifique devenu spot d'apprentissage : vague molle, eau tiède, et des baleines à bosse au large en hiver.","dangers":[["👥","Baie petite et très fréquentée."],["🪨","Quelques rochers côté nord de la baie."]],"tip":"Le pic de gauche, à droite de la baie, est plus calme que le pic central.","sports":["surf","paddle","baignade","snorkeling"]},
  {"id":"todossantos","name":"Todos Santos — Killers","loc":"Basse-Californie, Mexique","level":"expert","sky":"#ffd7c2","sky2":"#f79a86","sea":"#2a86bf","sea2":"#14547f","wind":"Offshore","swell":"3,5 m","temp":"17°C","tide":"Variable","danger":4,"desc":"Un haut-fond au large d'une île déserte, où la houle du Pacifique nord se dresse en murs énormes. Spot de très grosses vagues, accessible seulement en bateau.","dangers":[["🌊","Vagues de grande taille : matériel et expérience spécifiques."],["🚤","Accès uniquement par bateau, à une heure de la côte."],["⚠️","Aucun secours sur place."]],"tip":"Ce n'est pas un spot où l'on se teste. On y va accompagné, ou on regarde.","sports":["surf"]},
  {"id":"islamujeres","name":"Isla Mujeres","loc":"Mexique","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Alizé","swell":"0,4 m","temp":"28°C","tide":"Variable","danger":2,"desc":"Eaux calmes et claires au nord du Yucatán. En été, les requins-baleines se rassemblent au large pour filtrer le plancton — une sortie très encadrée.","dangers":[["🚤","Trafic de bateaux d'excursion dense en saison."],["🚫","Approche des requins-baleines réglementée : suis l'opérateur à la lettre."],["☀","Soleil intense sur le bateau."]],"tip":"Choisis un opérateur qui limite le nombre de nageurs à l'eau : c'est le vrai critère.","sports":["snorkeling","baignade","plongee","paddle"]},
  {"id":"tofino","name":"Tofino — Cox Bay","loc":"Colombie-Britannique, Canada","level":"intermediaire","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Variable","swell":"1,6 m","temp":"11°C","tide":"Mi-marée","danger":3,"desc":"Une plage de sable au pied de la forêt pluviale, ouverte à la houle du Pacifique nord. On y surfe toute l'année, en combinaison épaisse.","dangers":[["🥶","Eau autour de 10°C : combinaison 5/4, cagoule, gants."],["🌀","Courants de retour marqués aux extrémités de la baie."],["🪨","Rochers et troncs flottants après les tempêtes."]],"tip":"Entre par le milieu de la plage : les bords creusent des courants de retour.","sports":["surf","bodyboard","kayak"]},
  {"id":"newsmyrna","name":"New Smyrna Beach","loc":"Floride, USA","level":"debutant","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Onshore léger","swell":"0,8 m","temp":"26°C","tide":"Variable","danger":3,"desc":"Une plage à vagues courtes et fréquentes, très accessible — et le lieu qui concentre le plus de morsures de requins au monde, presque toutes bénignes et liées à l'eau trouble.","dangers":[["🦈","Morsures fréquentes près de l'embouchure : ne surfe pas dans l'eau trouble."],["🌀","Courants dans la passe de Ponce Inlet."],["👥","Plage très fréquentée."]],"tip":"Éloigne-toi de la jetée et de l'embouchure, et évite l'eau trouble et les bancs de poissons.","sports":["surf","bodyboard","baignade"]},
  {"id":"montauk","name":"Montauk — Ditch Plains","loc":"New York, USA","level":"intermediaire","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Offshore NO","swell":"1,2 m","temp":"18°C","tide":"Mi-marée","danger":2,"desc":"La pointe de Long Island, où une houle d'Atlantique nord rencontre un fond de galets. Vague de longboard l'été, plus sérieuse à l'automne quand les tempêtes arrivent.","dangers":[["🪨","Fond de galets et blocs à marée basse."],["👥","Pic très fréquenté le week-end en saison."],["🥶","Eau froide hors été."]],"tip":"L'automne est la meilleure saison : houle plus longue et beaucoup moins de monde.","sports":["surf","bodyboard","paddle"]},
  {"id":"mancora","name":"Máncora","loc":"Pérou","level":"intermediaire","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Offshore","swell":"1,2 m","temp":"24°C","tide":"Variable","danger":2,"desc":"La côte nord du Pérou échappe au courant froid de Humboldt : ici l'eau est tiède et la gauche de pointe déroule longtemps sur le sable.","dangers":[["👥","Pic unique, beaucoup de monde en haute saison."],["🌀","Courant qui longe la pointe vers le sud."]],"tip":"Entre par la plage au sud du pic et laisse le courant te remonter au bon endroit.","sports":["surf","kitesurf","baignade","paddle"]},
  {"id":"huanchaco","name":"Huanchaco","loc":"Pérou","level":"debutant","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Onshore","swell":"1,0 m","temp":"18°C","tide":"Variable","danger":2,"desc":"Un village de pêcheurs où l'on rame encore sur des caballitos de totora, embarcations de roseau utilisées depuis des siècles. Longue gauche douce, idéale pour progresser.","dangers":[["🥶","Courant de Humboldt : eau fraîche toute l'année."],["🚤","Pêcheurs en caballitos et filets près du rivage."],["🌀","Courant longitudinal constant."]],"tip":"Regarde les pêcheurs entrer et sortir : ils connaissent le chenal par cœur.","sports":["surf","bodyboard","paddle"]},
  {"id":"iquique","name":"Iquique — El Colegio","loc":"Chili","level":"expert","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Offshore","swell":"2,0 m","temp":"17°C","tide":"Marée basse","danger":4,"desc":"Une gauche de récif très creuse qui casse en pleine ville, sur un platier peu profond. Le désert d'Atacama descend jusqu'à la plage.","dangers":[["🪨","Récif à fleur d'eau à marée basse."],["⚡","Vague creuse qui ferme vite."],["🥶","Eau froide malgré la latitude."]],"tip":"Ce spot se surfe à marée haute quand on découvre : à marée basse il n'y a plus d'eau.","sports":["surf","bodyboard"]},
  {"id":"praiadorosa","name":"Praia do Rosa","loc":"Santa Catarina, Brésil","level":"intermediaire","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore","swell":"1,3 m","temp":"22°C","tide":"Variable","danger":2,"desc":"Une baie en fer à cheval bordée de collines. De juin à novembre, les baleines franches australes viennent y mettre bas — on les voit depuis la plage.","dangers":[["🌀","Courant au nord de la baie."],["🚫","Zone de reproduction des baleines : distances d'approche réglementées."]],"tip":"En saison, monte sur la colline plutôt que d'aller vers elles : la vue est meilleure et elles restent tranquilles.","sports":["surf","bodyboard","baignade","paddle"]},
  {"id":"noronha","name":"Fernando de Noronha","loc":"Brésil","level":"intermediaire","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Alizé","swell":"1,0 m","temp":"27°C","tide":"Variable","danger":2,"desc":"Un archipel volcanique classé, à 350 km de la côte : eau limpide, tortues, et une baie où des centaines de dauphins à long bec viennent se reposer chaque matin.","dangers":[["🚫","Parc national marin : accès limité, taxe environnementale, zones interdites."],["🌀","Courants forts hors des baies abritées."],["🪨","Rochers volcaniques coupants."]],"tip":"La baie des Dauphins s'observe depuis le belvédère : on n'y entre pas à l'eau, et c'est très bien ainsi.","sports":["snorkeling","plongee","surf","baignade"]},
  {"id":"ilhabela","name":"Ilhabela","loc":"São Paulo, Brésil","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Thermique","swell":"0,4 m","temp":"24°C","tide":"Variable","danger":1,"desc":"Une grande île couverte de forêt atlantique, face au continent. Le canal abrité en fait un terrain de voile et de pagaie réputé, avec des criques accessibles seulement par l'eau.","dangers":[["🚤","Canal très fréquenté par la navigation de plaisance."],["💨","Vent thermique soutenu l'après-midi dans le canal."],["⚠️","Moustiques borrachudos sur les plages boisées."]],"tip":"Pars en kayak le matin : le canal est lisse avant que le vent ne se lève.","sports":["kayak","paddle","baignade","snorkeling","windsurf"]},
  {"id":"puntadeleste","name":"Punta del Este — La Barra","loc":"Uruguay","level":"intermediaire","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore","swell":"1,2 m","temp":"19°C","tide":"Variable","danger":2,"desc":"La plage la plus surfée d'Uruguay, à la limite entre le Río de la Plata et l'Atlantique. L'eau change de couleur selon les vents, du brun fluvial au bleu océanique.","dangers":[["🌀","Courants à l'embouchure de l'arroyo."],["👥","Très fréquentée en janvier et février."]],"tip":"Après plusieurs jours de vent d'est, l'eau redevient claire et la vague se range.","sports":["surf","bodyboard","baignade"]},
  {"id":"ayampe","name":"Ayampe","loc":"Équateur","level":"debutant","sky":"#ffe3b8","sky2":"#ffb07a","sea":"#17b3c9","sea2":"#0b6f92","wind":"Onshore léger","swell":"1,0 m","temp":"24°C","tide":"Variable","danger":2,"desc":"Un village minuscule entre deux collines vertes, avec une plage de sable ouverte et une vague de gauche facile. Les baleines à bosse passent au large de juin à septembre.","dangers":[["🌀","Courant de retour au centre de la plage."],["🪨","Rochers aux deux extrémités."]],"tip":"Prends le pic du milieu : les bords de la plage cachent des rochers à marée basse.","sports":["surf","baignade","paddle"]},
  {"id":"burleigh","name":"Burleigh Heads","loc":"Gold Coast, Australie","level":"expert","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore SO","swell":"1,6 m","temp":"23°C","tide":"Mi-marée","danger":3,"desc":"Une droite de pointe qui s'enroule au pied d'un promontoire boisé, en plein cœur de la Gold Coast. Vague rapide et très disputée.","dangers":[["👥","Un des pics les plus compétitifs d'Australie."],["🪨","Rochers à l'entrée en haut de la pointe."],["🌀","Courant fort qui remonte le long du promontoire."]],"tip":"Entre par les rochers du haut de la pointe et attends ton tour : ici la priorité se respecte.","sports":["surf","bodyboard"]},
  {"id":"byronbay","name":"Byron Bay — The Pass","loc":"Australie","level":"debutant","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore O","swell":"1,0 m","temp":"23°C","tide":"Marée montante","danger":2,"desc":"Une droite longue et douce qui contourne le point le plus à l'est de l'Australie. Vague de longboard par excellence ; dauphins et tortues au line-up.","dangers":[["👥","Extrêmement fréquentée toute l'année."],["🌀","Courant qui pousse vers l'intérieur de la baie."],["🪨","Rochers affleurants près de la pointe."]],"tip":"Marche jusqu'au bout du sentier et entre à la pointe : ramer depuis la plage est long.","sports":["surf","paddle","baignade","snorkeling"]},
  {"id":"manly","name":"Manly Beach","loc":"Sydney, Australie","level":"debutant","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Variable","swell":"1,1 m","temp":"21°C","tide":"Variable","danger":2,"desc":"La plage de surf historique de Sydney, à vingt minutes de ferry du centre. Vagues régulières, sauveteurs présents, et une réserve marine à l'extrémité nord.","dangers":[["👥","Très fréquentée, zones de baignade et de surf séparées."],["🌀","Courants de retour signalés par les drapeaux."],["☀","Soleil très fort, indice UV élevé."]],"tip":"Surfe en dehors des drapeaux rouges et jaunes : ces couloirs sont réservés aux nageurs.","sports":["surf","bodyboard","baignade","paddle","snorkeling"]},
  {"id":"ningaloo","name":"Ningaloo Reef","loc":"Australie","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Alizé","swell":"0,4 m","temp":"25°C","tide":"Variable","danger":2,"desc":"Un récif frangeant de plus de 250 km, accessible depuis la plage : on entre à pied dans le lagon et le corail commence à quelques brasses. Requins-baleines de mars à juillet.","dangers":[["🌀","Courant sortant dans les passes du récif."],["🚫","Site classé : ne pose jamais le pied sur le corail."],["☀","Soleil extrême, aucune ombre."]],"tip":"Entre par les chenaux de sable : marcher sur le platier tue le corail et t'entaille les pieds.","sports":["snorkeling","plongee","baignade","kayak"]},
  {"id":"piha","name":"Piha","loc":"Nouvelle-Zélande","level":"expert","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Offshore E","swell":"1,8 m","temp":"17°C","tide":"Mi-marée","danger":4,"desc":"Une plage de sable noir volcanique au pied d'une forêt, sur la côte ouest d'Auckland. Beauté brute et courants parmi les plus traîtres du pays.","dangers":[["🌀","Courants de retour très puissants, sauvetages fréquents."],["🌊","Houle de Tasman souvent grosse et désordonnée."],["🪨","Rochers du Lion Rock et de la pointe sud."]],"tip":"Ne te baigne jamais hors des drapeaux : c'est la plage la plus secourue de Nouvelle-Zélande.","sports":["surf","bodyboard"]},
  {"id":"shipwreck","name":"Shipwreck Bay — Ahipara","loc":"Nouvelle-Zélande","level":"intermediaire","sky":"#dbe7ef","sky2":"#a3c0d4","sea":"#1c6d95","sea2":"#0a3d5c","wind":"Offshore SE","swell":"1,5 m","temp":"18°C","tide":"Marée montante","danger":3,"desc":"À l'extrémité sud de Ninety Mile Beach, une série de pointes rocheuses enchaîne des gauches qui peuvent se relier sur des centaines de mètres.","dangers":[["🪨","Fond rocheux irrégulier, plateaux découvrants."],["🌀","Courant qui longe les pointes."],["⚠️","Région isolée, peu de monde en cas de problème."]],"tip":"Commence par la pointe la plus au sud : c'est la plus indulgente des trois.","sports":["surf","bodyboard"]},
  {"id":"restaurants","name":"Restaurants — Namotu","loc":"Fidji","level":"expert","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Offshore SE","swell":"1,8 m","temp":"28°C","tide":"Marée haute","danger":4,"desc":"Une gauche courte et parfaitement tubulaire qui casse sur un récif au bord d'une passe, en face de l'île de Namotu. On y accède en bateau.","dangers":[["🪨","Corail très peu profond, surtout à marée basse."],["🌀","Courant fort dans la passe voisine."],["⚠️","Récif isolé : blessures à soigner immédiatement."]],"tip":"Ne surfe qu'à marée haute tant que tu ne connais pas le récif.","sports":["surf"]},
  {"id":"borabora","name":"Bora Bora","loc":"Polynésie française","level":"debutant","sky":"#d9f4f2","sky2":"#9fe3dd","sea":"#19c0b4","sea2":"#0a7f86","wind":"Alizé","swell":"0,3 m","temp":"28°C","tide":"Variable","danger":1,"desc":"Un lagon fermé par une couronne de motus, autour d'un piton volcanique. Eau tiède et peu profonde, raies pastenagues et raies aigles dans les passes.","dangers":[["🚤","Trafic de navettes et d'excursions dans le lagon."],["🌀","Courant sortant dans la passe de Teavanui."],["🚫","Nourrissage des raies déconseillé : il modifie leur comportement."]],"tip":"Fais le tour du lagon en pagaie tôt le matin, avant que les bateaux ne le réveillent.","sports":["snorkeling","plongee","paddle","kayak","baignade"]},
  {"id":"jardimdomar","name":"Jardim do Mar","loc":"Madère, Portugal","level":"expert","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore N","swell":"2,2 m","temp":"20°C","tide":"Mi-marée","danger":4,"desc":"Une droite de galets au pied de falaises vertigineuses, sur la côte sud-ouest de Madère. Vague longue et puissante, qui ne se réveille que par grosse houle d'Atlantique nord.","dangers":[["🪨","Entrée et sortie sur des galets roulants."],["🌊","Puissance élevée dès que la houle dépasse 2 m."],["⚠️","Falaises : chutes de pierres possibles après la pluie."]],"tip":"Repère le point de sortie avant d'entrer : sur les galets, sortir est plus dur qu'entrer.","sports":["surf"]},
  {"id":"santabarbara","name":"Santa Bárbara — Ribeira Grande","loc":"Açores, Portugal","level":"intermediaire","sky":"#cfe6f5","sky2":"#8fc6e6","sea":"#2a86bf","sea2":"#0e4f7d","wind":"Offshore S","swell":"1,5 m","temp":"19°C","tide":"Mi-marée","danger":2,"desc":"Une plage de sable volcanique sur la côte nord de São Miguel, ouverte à toutes les houles de l'Atlantique. Les Açores captent la houle avant l'Europe continentale.","dangers":[["🌀","Courants de retour marqués."],["🌊","Houle qui monte très vite, exposition totale."],["🥶","Eau autour de 18°C, vent frais."]],"tip":"Consulte la houle la veille : ici elle peut doubler de taille en une nuit.","sports":["surf","bodyboard","baignade"]},
  {"id":"capomannu","name":"Capo Mannu","loc":"Sardaigne, Italie","level":"intermediaire","sky":"#e2f0fb","sky2":"#a9d8ef","sea":"#1f97c4","sea2":"#0b5e86","wind":"Mistral","swell":"1,4 m","temp":"20°C","tide":"Sans objet","danger":3,"desc":"La pointe ouest de la Sardaigne, la plus exposée au mistral : quand il souffle plusieurs jours, la Méditerranée y produit une vraie houle et une droite de récif se met en place.","dangers":[["🪨","Récif calcaire coupant, peu profond."],["💨","Mistral violent, mer désordonnée les premiers jours."],["🌀","Courant le long de la pointe."]],"tip":"Attends le deuxième ou le troisième jour de mistral : la mer se range enfin.","sports":["surf","bodyboard","windsurf"]},
  {"id":"isolabella","name":"Isola Bella — Taormine","loc":"Sicile, Italie","level":"debutant","sky":"#e2f0fb","sky2":"#a9d8ef","sea":"#1f97c4","sea2":"#0b5e86","wind":"Brise","swell":"0,3 m","temp":"24°C","tide":"Sans objet","danger":1,"desc":"Un îlot relié à la plage par un cordon de galets, classé en réserve naturelle, au pied de Taormine et face à l'Etna. Fonds rocheux clairs et grottes marines.","dangers":[["🪨","Galets glissants et fonds rocheux."],["🚤","Bateaux d'excursion nombreux en été."],["🚫","Réserve naturelle : accès réglementé à l'îlot."]],"tip":"Longe la côte en kayak vers le nord : les grottes bleues se visitent par mer calme.","sports":["snorkeling","baignade","kayak","paddle"]},
  {"id":"zlatnirat","name":"Zlatni Rat — Bol","loc":"Croatie","level":"intermediaire","sky":"#e2f0fb","sky2":"#a9d8ef","sea":"#1f97c4","sea2":"#0b5e86","wind":"Maestral","swell":"0,4 m","temp":"24°C","tide":"Sans objet","danger":2,"desc":"Une langue de galets qui avance dans l'Adriatique et change de forme avec les courants. Le maestral s'y lève chaque après-midi d'été : c'est le spot de voile de la Dalmatie.","dangers":[["💨","Vent thermique fort et régulier l'après-midi."],["🪨","Galets glissants, chaussons conseillés."],["👥","Plage très fréquentée en août."]],"tip":"Navigue côté est de la pointe le matin, côté ouest quand le maestral s'installe.","sports":["windsurf","kitesurf","baignade","paddle"]},
  {"id":"naxos","name":"Mikri Vigla — Naxos","loc":"Grèce","level":"intermediaire","sky":"#e2f0fb","sky2":"#a9d8ef","sea":"#1f97c4","sea2":"#0b5e86","wind":"Meltem","swell":"0,5 m","temp":"24°C","tide":"Sans objet","danger":2,"desc":"Deux baies séparées par un promontoire : l'une pour le vent, l'autre pour se baigner. Le meltem souffle du nord tout l'été et fait de Naxos un repère de la voile en Égée.","dangers":[["💨","Meltem parfois très fort, jusqu'à plusieurs jours d'affilée."],["🌀","Courant entre les deux baies."],["🪨","Rochers au pied du promontoire."]],"tip":"Baie nord pour naviguer, baie sud pour nager : le promontoire sépare vraiment les deux mondes.","sports":["kitesurf","windsurf","baignade","paddle"]}
];

const SCORES={imsouane:4.4,safi:4.7,sidikaouki:3.9,ngor:4.3,ouakam:4.4,elandsbay:4.2,muizenberg:3.8,dahab:4.5,nosybe:4.4,watamu:4.0,keramas:4.6,nias:4.7,gland:4.6,komodo:4.8,bunaken:4.5,similan:4.4,weligama:3.9,ichinomiya:4.0,kerama:4.5,rincon:4.5,pavones:4.4,tamarindo:3.7,sayulita:3.8,todossantos:4.6,islamujeres:4.2,tofino:4.1,newsmyrna:3.6,montauk:3.9,mancora:4.1,huanchaco:3.8,iquique:4.4,praiadorosa:4.3,noronha:4.8,ilhabela:4.0,puntadeleste:3.9,ayampe:3.8,burleigh:4.5,byronbay:4.3,manly:4.0,ningaloo:4.8,piha:4.2,shipwreck:4.1,restaurants:4.6,borabora:4.7,jardimdomar:4.4,santabarbara:4.1,capomannu:4.0,isolabella:4.2,zlatnirat:4.1,naxos:4.2,hossegor:4.6,lacanau:4.2,latorche:3.8,biarritz:4.0,anglet:4.5,quiberon:3.5,seignosse:4.3,capbreton:4.4,lafitenia:4.1,guethary:4.4,sauveterre:3.9,latranche:3.6,lapalue:4.3,penhors:3.9,lapalmyre:3.4,mimizan:4.0,capferret:4.5,bidart:4.2,nazare:4.8,supertubos:4.6,ericeira:4.4,mundaka:4.6,thurso:4.4,bundoran:4,rodiles:4.3,somo:3.9,zarautz:4,pantin:4.2,lasanta:4.5,anchorpoint:4.3,pipeline:4.9,mavericks:4.7,trestles:4.5,malibu:4.2,puerto:4.6,santateresa:4.2,chicama:4.4,puntadelobos:4.4,jbay:4.7,bells:4.3,snapper:4.5,margaret:4.4,uluwatu:4.7,padang:4.5,cloudbreak:4.8,teahupoo:4.9,floripa:4.1,puntaroca:4.2,raglan:4.4,saquarema:4.3,montanita:4,lobitos:4.3,mardelplata:3.8,arica:4.4,itacare:3.8,shonan:3.7,arugam:4.2,cloud9:4.5,waikiki:4,unstad:4.1,skeletonbay:4.6,mentawai:4.7,dungeons:4.4,bluehole_belize:4.8,sipadan:4.8,rasmohammed:4.7,thistlegorm:4.8,tulamben:4.5,greatbarrier:4.8,silfra:4.7,cenote_dosojos:4.6,medes:4.5,portcros:4.4,calanques:4.5,richelieu:4.6,rajaampat:4.9,galapagos:4.9,maldives:4.7,hanauma:4.5,bonaire:4.5,tarifa:4.6,dakhla:4.6,cabarete:4.4,lemorne:4.6,cumbuco:4.5,essaouira:4.3,lafranqui:4.4,jericoacoara:4.6,hookipa:4.7,pozo:4.5,gardalake:4.3,hoodriver:4.4,annecy:4.4,verdon:4.5,glenan:4.4,capri:4.3,palombaggia:4.5,praia_marinha:4.5,navagio:4.4,anse_source:4.7,whitehaven:4.7,wissant:4.2,letouquet:4,hardelot:3.9,wimereux:3.7,berck:3.9,malolesbains:3.6,lehavre:3.8,etretat:4.3,dieppe:3.7,siouville:4.2,vauville:4,hauteville:3.7,granville:3.8,saintmalo:4.1,saintlunaire:3.9,erquy:4,perros:4.1};
const FORECAST=[{d:'Lun',v:1.0},{d:'Mar',v:1.4},{d:'Mer',v:1.1},{d:'Jeu',v:1.9,best:true},{d:'Ven',v:1.6},{d:'Sam',v:0.9},{d:'Dim',v:1.2}];
const ANEC={
  hossegor:"Hossegor accueille chaque année une étape du championnat du monde de surf (WSL). Son secret : le Gouf de Capbreton, un canyon sous-marin qui concentre la houle et muscle les vagues.",
  lacanau:"Lacanau a accueilli les premiers grands championnats de surf français et vibre chaque été au rythme du Lacanau Pro, l'une des compétitions les plus populaires du pays.",
  latorche:"La Torche est si exposée au vent qu'elle est devenue l'un des spots de kitesurf et de windsurf les plus réputés d'Europe, avec des coupes du monde à son palmarès.",
  biarritz:"C'est sur la Côte des Basques qu'est né le surf en Europe, en 1957 : on la considère comme le berceau du surf du Vieux Continent.",
  anglet:"Anglet aligne onze plages de surf sur quelques kilomètres, séparées par des digues : un vrai terrain de jeu où chaque plage a son ambiance.",
  quiberon:"La presqu'île de Quiberon tient au continent par un isthme parfois large de seulement 22 mètres, que la mer menace lors des grosses tempêtes.",
  seignosse:"Seignosse est bordée par l'une des plus grandes forêts plantées d'Europe, créée au 19e siècle pour fixer les dunes : ici, on surfe au milieu des pins.",
  capbreton:"Au large de Capbreton s'ouvre le Gouf, un canyon sous-marin de plus de 3000 m de profondeur qui démarre à quelques centaines de mètres du bord.",
  lafitenia:"Lafitenia est l'une des plus belles droites du Pays Basque : elle déroule si longuement dans sa baie qu'on la surnomme le petit point break basque.",
  guethary:"Parlementia fut l'un des premiers spots de grosses vagues domptés en France, dès les années 1960, bien avant l'ère moderne du surf de gros.",
  sauveterre:"La plage de Sauveterre est nichée dans une réserve naturelle : on peut y croiser des chevreuils dans la forêt juste avant d'enfiler la combinaison.",
  latranche:"La Tranche-sur-Mer est surnommée la petite Californie vendéenne pour son microclimat ensoleillé et ses champs de fleurs derrière les dunes.",
  lapalue:"La Palue est l'une des rares plages totalement sauvages de Bretagne : aucune construction à l'horizon, et une baignade réputée à vos risques et périls.",
  penhors:"Penhors est célèbre pour son pardon, une procession bretonne séculaire sur la plage : un mélange unique de tradition et de surf.",
  lapalmyre:"Pontaillac, à Royan, est l'un des plus vieux spots de la côte atlantique : on y surfe une vague formée par les rochers, au cœur d'une station Belle Époque.",
  mimizan:"Mimizan abrite l'un des plus anciens phares des Landes ; la ville qui sentait jadis la papeterie sent aujourd'hui l'iode et la wax.",
  capferret:"Au Cap Ferret, on surfe l'océan le matin et on rejoint le Bassin d'Arcachon l'après-midi : une langue de sable parmi les plus mouvantes de France.",
  bidart:"Le spot du Pavillon Royal doit son nom à un ancien casino-hôtel de luxe fréquenté au début du 20e siècle par des têtes couronnées d'Europe."
};
const FUN={
  biarritz:"Le surf est arrivé ici en 1956, pendant le tournage du film « Le soleil se lève aussi » : Peter Viertel, scénariste hollywoodien qui n'avait jamais surfé, reçoit une planche et tente ses premières vagues sur la Côte des Basques. Dès 1957, on ne comptait que quatre surfeurs dans toute la France — et le premier club de surf français naîtra ici en 1959.",
  lacanau:"Le Lacanau Pro (1979) est la plus vieille compétition de surf d'Europe. Pour la toute première édition, le budget a été bouclé… grâce à une tombola et à la vente de sandwichs-merguez sur la plage ! 🌭",
  latorche:"En 1986, La Torche a accueilli une épreuve de la Coupe du monde de windsurf dans des conditions dantesques (40 nœuds de vent). La légende Robby Naish y a brillé — tout en classant quand même le spot comme « vraiment difficile ».",
  lafitenia:"Au large de Saint-Jean-de-Luz, la vague géante de Belharra a été surfée pour la première fois le 22 novembre 2002 par une poignée de surfeurs (dont Peyo Lizarazu). Déferlant à environ 2,5 km du bord et pouvant atteindre 8 à 15 m, elle a placé le Pays Basque sur la carte mondiale des grosses vagues."
};
const MAPPOS={lapalue:{x:48.9,y:12.5},latorche:{x:50.6,y:16.1},penhors:{x:53.3,y:17.9},quiberon:{x:59.4,y:22.9},sauveterre:{x:59.4,y:35.7},latranche:{x:59.7,y:38.6},lapalmyre:{x:60,y:53.6},lacanau:{x:61.4,y:59.3},capferret:{x:60.8,y:63.6},mimizan:{x:61.4,y:69.3},seignosse:{x:61.7,y:76.8},hossegor:{x:61.9,y:78.2},capbreton:{x:62.2,y:79.3},anglet:{x:63.9,y:83.9},biarritz:{x:64.4,y:85.4},bidart:{x:65.3,y:87.1},guethary:{x:65.6,y:88.6},lafitenia:{x:66.4,y:90.7}};
const favs=new Set();
const sessions=[{spot:'Hossegor',date:'5 juin',act:'surf'},{spot:'La Côte des Basques',date:'2 juin',act:'surf'},{spot:'Lacanau Océan',date:'29 mai',act:'baignade'}];
let userName='Thomas';
/* Le compteur de gestes écolo était une décoration : 23, écrit en dur,
   relié à rien. C'est maintenant un carnet, comme celui des sessions —
   on peut le toucher et voir ce qu'on a fait. */
var ecoLog=[
  {t:'Beach Clean Express',l:'Hossegor',d:'5 juin'},
  {t:'Éco-mobilité',l:'Hossegor',d:'5 juin'},
  {t:'Zéro plastique',l:'La Côte des Basques',d:'2 juin'},
  {t:'Tri sélectif',l:'La Côte des Basques',d:'2 juin'},
  {t:'Beach Clean Express',l:'Lacanau Océan',d:'31 mai'},
  {t:'Zéro plastique',l:'Lacanau Océan',d:'29 mai'},
  {t:'Éco-mobilité',l:'Lacanau Océan',d:'29 mai'},
  {t:'Gardien du récif',l:'Lacanau Océan',d:'24 mai'},
  {t:'Tri sélectif',l:'',d:'21 mai'}
];
function ecoAdd(titre,lieu,cle){
  ecoLog.unshift({t:titre,l:lieu||'',k:cle||'',
    d:new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short'})});
  saveState();
  try{renderHomeStats();}catch(e){}
  try{renderProfile();}catch(e){}
}
function ecoHas(cle){
  for(var i=0;i<ecoLog.length;i++){ if(ecoLog[i].k===cle) return true; }
  return false;
}
function showEcoLog(){
  var c=document.getElementById('ecoInfoCard'); if(!c) return;
  var h='<button class="aqi-x" onclick="closeEcoLog()" aria-label="Fermer">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
      + '<div class="eco-hd">'+uic('feuille')+'<div><h4>'+ecoLog.length+' gestes</h4>'
      + '<p>Ton carnet écolo, geste par geste.</p></div></div><div class="eco-l">';
  h+= ecoLog.length ? ecoLog.map(function(g){
        return '<div class="eco-g"><div class="eco-t">'+g.t+'</div>'
             + '<div class="eco-m">'+(g.l?g.l+' · ':'')+g.d+'</div></div>';
      }).join('')
    : '<p class="eco-empty">Aucun geste enregistré pour l\'instant. Les défis écolo et les gestes des fiches spots viennent ici.</p>';
  h+='</div>';
  c.innerHTML=h;
  document.getElementById('ecoInfo').classList.add('open');
}
function closeEcoLog(){
  var o=document.getElementById('ecoInfo'); if(o)o.classList.remove('open');
}
function applyName(){var hh=document.getElementById('homeHello');if(hh)hh.textContent='Salut '+userName;var pn=document.getElementById('profName');if(pn)pn.textContent=userName;var rt=document.getElementById('readyTitle');if(rt)rt.textContent='C’est parti, '+userName+' !';}
const COORDS={
  imsouane:{lat:30.84,lon:-9.82},safi:{lat:32.3,lon:-9.27},sidikaouki:{lat:31.36,lon:-9.8},ngor:{lat:14.76,lon:-17.51},ouakam:{lat:14.72,lon:-17.49},elandsbay:{lat:-32.31,lon:18.33},muizenberg:{lat:-34.11,lon:18.47},dahab:{lat:28.57,lon:34.54},nosybe:{lat:-13.48,lon:48.24},watamu:{lat:-3.36,lon:40.02},keramas:{lat:-8.59,lon:115.35},nias:{lat:0.58,lon:97.75},gland:{lat:-8.72,lon:114.35},komodo:{lat:-8.55,lon:119.48},bunaken:{lat:1.62,lon:124.76},similan:{lat:8.65,lon:97.64},weligama:{lat:5.97,lon:80.43},ichinomiya:{lat:35.37,lon:140.38},kerama:{lat:26.2,lon:127.35},rincon:{lat:18.35,lon:-67.27},pavones:{lat:8.4,lon:-83.13},tamarindo:{lat:10.3,lon:-85.84},sayulita:{lat:20.87,lon:-105.44},todossantos:{lat:31.8,lon:-116.8},islamujeres:{lat:21.23,lon:-86.73},tofino:{lat:49.12,lon:-125.89},newsmyrna:{lat:29.02,lon:-80.9},montauk:{lat:41.04,lon:-71.92},mancora:{lat:-4.1,lon:-81.05},huanchaco:{lat:-8.08,lon:-79.12},iquique:{lat:-20.24,lon:-70.15},praiadorosa:{lat:-28.13,lon:-48.64},noronha:{lat:-3.85,lon:-32.42},ilhabela:{lat:-23.78,lon:-45.35},puntadeleste:{lat:-34.94,lon:-54.9},ayampe:{lat:-1.67,lon:-80.78},burleigh:{lat:-28.09,lon:153.45},byronbay:{lat:-28.64,lon:153.62},manly:{lat:-33.8,lon:151.29},ningaloo:{lat:-22.7,lon:113.67},piha:{lat:-36.95,lon:174.47},shipwreck:{lat:-35.17,lon:173.13},restaurants:{lat:-17.83,lon:177.19},borabora:{lat:-16.5,lon:-151.74},jardimdomar:{lat:32.74,lon:-17.2},santabarbara:{lat:37.83,lon:-25.55},capomannu:{lat:40.05,lon:8.38},isolabella:{lat:37.85,lon:15.3},zlatnirat:{lat:43.26,lon:16.63},naxos:{lat:37.02,lon:25.36},
    hossegor:{lat:43.66,lon:-1.44},lacanau:{lat:45.00,lon:-1.20},latorche:{lat:47.84,lon:-4.36},
  biarritz:{lat:43.48,lon:-1.57},anglet:{lat:43.51,lon:-1.53},quiberon:{lat:47.49,lon:-3.12},
  seignosse:{lat:43.70,lon:-1.43},capbreton:{lat:43.64,lon:-1.45},lafitenia:{lat:43.40,lon:-1.66},
  guethary:{lat:43.42,lon:-1.61},sauveterre:{lat:46.53,lon:-1.80},latranche:{lat:46.34,lon:-1.43},
  lapalue:{lat:48.21,lon:-4.59},penhors:{lat:47.90,lon:-4.40},lapalmyre:{lat:45.62,lon:-1.04},
  mimizan:{lat:44.21,lon:-1.30},capferret:{lat:44.63,lon:-1.25},bidart:{lat:43.44,lon:-1.59}
,nazare:{lat:39.605,lon:-9.085},supertubos:{lat:39.345,lon:-9.366},ericeira:{lat:38.99,lon:-9.42},mundaka:{lat:43.407,lon:-2.699},thurso:{lat:58.595,lon:-3.515},bundoran:{lat:54.476,lon:-8.289}
,rodiles:{lat:43.527,lon:-5.39},somo:{lat:43.44,lon:-3.76},zarautz:{lat:43.285,lon:-2.17},pantin:{lat:43.625,lon:-8.085},lasanta:{lat:29.115,lon:-13.665}
,anchorpoint:{lat:30.544,lon:-9.728},pipeline:{lat:21.665,lon:-158.053},mavericks:{lat:37.495,lon:-122.501},trestles:{lat:33.385,lon:-117.593},malibu:{lat:34.036,lon:-118.679},puerto:{lat:15.834,lon:-97.072},santateresa:{lat:9.643,lon:-85.169},chicama:{lat:-7.696,lon:-79.443},puntadelobos:{lat:-34.418,lon:-72.043},jbay:{lat:-34.049,lon:24.909},bells:{lat:-38.371,lon:144.283},snapper:{lat:-28.162,lon:153.549},margaret:{lat:-33.965,lon:114.992},uluwatu:{lat:-8.815,lon:115.089},padang:{lat:-8.81,lon:115.103},cloudbreak:{lat:-17.85,lon:177.19},teahupoo:{lat:-17.847,lon:-149.267},floripa:{lat:-27.628,lon:-48.451},puntaroca:{lat:13.487,lon:-89.323},raglan:{lat:-37.82,lon:174.79},saquarema:{lat:-22.92,lon:-42.5},montanita:{lat:-1.829,lon:-80.752},lobitos:{lat:-4.452,lon:-81.279},mardelplata:{lat:-38,lon:-57.53},arica:{lat:-18.476,lon:-70.323},itacare:{lat:-14.28,lon:-38.996}
,shonan:{lat:35.31,lon:139.48},arugam:{lat:6.84,lon:81.836},cloud9:{lat:9.81,lon:126.17},waikiki:{lat:21.276,lon:-157.826},unstad:{lat:68.13,lon:13.52},skeletonbay:{lat:-23,lon:14.46},mentawai:{lat:-2.06,lon:99.57},dungeons:{lat:-34.05,lon:18.34},bluehole_belize:{lat:17.316,lon:-87.535},sipadan:{lat:4.115,lon:118.628},rasmohammed:{lat:27.72,lon:34.25},thistlegorm:{lat:27.81,lon:33.92},tulamben:{lat:-8.274,lon:115.592},greatbarrier:{lat:-16,lon:145.85},silfra:{lat:64.255,lon:-21.118},cenote_dosojos:{lat:20.327,lon:-87.39},medes:{lat:42.045,lon:3.225},portcros:{lat:43.005,lon:6.39},calanques:{lat:43.21,lon:5.44},richelieu:{lat:9.36,lon:98.02},rajaampat:{lat:-0.55,lon:130.52},galapagos:{lat:1.68,lon:-91.99},maldives:{lat:3.9,lon:72.83},hanauma:{lat:21.269,lon:-157.694},bonaire:{lat:12.105,lon:-68.235},tarifa:{lat:36.01,lon:-5.61},dakhla:{lat:23.71,lon:-15.93},cabarete:{lat:19.758,lon:-70.42},lemorne:{lat:-20.46,lon:57.31},cumbuco:{lat:-3.62,lon:-38.73},essaouira:{lat:31.51,lon:-9.77},lafranqui:{lat:42.95,lon:3.04},jericoacoara:{lat:-2.793,lon:-40.512},hookipa:{lat:20.934,lon:-156.357},pozo:{lat:27.8,lon:-15.42},gardalake:{lat:45.87,lon:10.87},hoodriver:{lat:45.71,lon:-121.51},annecy:{lat:45.85,lon:6.17},verdon:{lat:43.76,lon:6.22},glenan:{lat:47.72,lon:-3.99},capri:{lat:40.55,lon:14.24},palombaggia:{lat:41.55,lon:9.34},praia_marinha:{lat:37.09,lon:-8.41},navagio:{lat:37.86,lon:20.625},anse_source:{lat:-4.38,lon:55.83},whitehaven:{lat:-20.28,lon:149.04},wissant:{lat:50.885,lon:1.659},letouquet:{lat:50.524,lon:1.583},hardelot:{lat:50.633,lon:1.585},wimereux:{lat:50.766,lon:1.608},berck:{lat:50.404,lon:1.56},malolesbains:{lat:51.055,lon:2.395},lehavre:{lat:49.493,lon:0.095},etretat:{lat:49.707,lon:0.204},dieppe:{lat:49.927,lon:1.078},siouville:{lat:49.564,lon:-1.844},vauville:{lat:49.628,lon:-1.835},hauteville:{lat:48.948,lon:-1.567},granville:{lat:48.838,lon:-1.598},saintmalo:{lat:48.652,lon:-2.018},saintlunaire:{lat:48.632,lon:-2.11},erquy:{lat:48.633,lon:-2.466},perros:{lat:48.82,lon:-3.448}
};
/* ---- persistance (localStorage) ---- */
const STORE_KEY='oceanbuddy_v1';
function saveState(){try{localStorage.setItem(STORE_KEY,JSON.stringify({xp:xp,favs:[...favs],sessions:sessions,level:chosenLevel,sport:chosenSport,name:userName,eco:ecoLog}));}catch(e){}}
function loadState(){try{const d=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(!d)return false;
  if(typeof d.xp==='number')xp=d.xp;
  if(Array.isArray(d.favs))d.favs.forEach(f=>favs.add(f));
  if(Array.isArray(d.sessions)&&d.sessions.length){sessions.length=0;d.sessions.forEach(s=>sessions.push(s));}
  if(d.level)chosenLevel=d.level;
  if(d.sport){chosenSport=d.sport;activeSport=(d.sport!=='all')?d.sport:null;}
  if(d.name)userName=d.name;
  if(Array.isArray(d.eco)){ecoLog.length=0;d.eco.forEach(function(g){ecoLog.push(g);});}
  return true;}catch(e){return false;}}

const ECO=[
  /* chaque défi porte désormais son « pourquoi ça compte » : sans lui, on
     distribue des points, on ne sensibilise personne. */
  {ic:'balai',bg:'#e3f7ee',color:'#2faf72',title:'Beach Clean Express',desc:'Ramasse 5 déchets sur la plage.',xp:50,prog:60,
   why:"Ramassé avant la marée, un déchet ne part pas au large. Fragmenté en microplastiques, il devient irrécupérable."},
  {ic:'bouteille',bg:'#e3f7ee',color:'#2faf72',title:'Zéro plastique',desc:'Viens surfer avec une gourde réutilisable.',xp:30,prog:100,done:true,
   why:"Bouteilles et bouchons comptent parmi les déchets les plus ramassés sur les plages européennes."},
  {ic:'velo',bg:'#e3f7ee',color:'#2faf72',title:'Éco-mobilité',desc:'Rejoins ton spot à vélo ou en covoiturage.',xp:40,prog:0,
   why:"Le trajet est le poste d'une session sur lequel tu as le plus de prise. À trois dans la voiture, il est divisé par trois."},
  {ic:'poisson',bg:'#e3f7ee',color:'#2faf72',title:'Gardien du récif',desc:'Signale une pollution ou un animal en détresse.',xp:60,prog:0,
   why:"Un animal échoué relève d'un réseau spécialisé — en France, le Réseau national échouages. Signaler vaut mieux que le remettre à l'eau."},
  {ic:'recycle',bg:'#e3f7ee',color:'#2faf72',title:'Tri sélectif',desc:'Trie tes déchets après la session.',xp:35,prog:0,
   why:"Posé à côté d'une poubelle pleine, un emballage repart avec le vent. Le trier, c'est d'abord le sortir du sable."}
];
const SURF=[
  {ic:'sunrise',bg:'#fff0ee',color:'#ec5a4b',title:'Dawn Patrol',desc:'Surfe une session au lever du soleil.',xp:45,prog:0},
  {ic:'carte',bg:'#fff0ee',color:'#ec5a4b',title:'Explorateur',desc:'Découvre 3 nouveaux spots ce mois-ci.',xp:80,prog:66},
  {ic:'planche',bg:'#fff0ee',color:'#ec5a4b',title:'Régularité',desc:'Surfe 5 sessions cette semaine.',xp:70,prog:40},
  {ic:'camera',bg:'#fff0ee',color:'#ec5a4b',title:'Photographe',desc:'Partage une photo de ta session.',xp:25,prog:0}
];
const BADGES=[
  {e:'wave',n:'Première vague',locked:false},{e:'balai',n:'Éco-héros',locked:false},
  {e:'carte',n:'Explorateur',locked:false},{e:'sunrise',n:'Dawn Patrol',locked:false},
  {e:'flamme',n:'7 jours',locked:false},{e:'trophee',n:'Compétiteur',locked:true},
  {e:'dauphin',n:'Ami dauphin',locked:true},{e:'couronne',n:'Légende',locked:true}
];

/* ================= POULPY ================= */
var _octoSeq=0;
/* poulpySVG() ne rend que l'INTERIEUR d'une balise svg. Colle tel quel dans
   une balise div — ce que faisaient les avatars du chat et l'en-tete du quiz —
   il ne dessine rien : on ne voyait qu'une pastille blanche vide. */
function octoTag(){
  return '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">'
       + poulpySVG() + '</svg>';
}
function poulpySVG(){
  return '<image href="assets/design/poulpy.webp" x="0" y="0" width="140" height="140" preserveAspectRatio="xMidYMid meet"/>';
}

/* ================= OCEAN SCENE (rich) ================= */
var _sceneSeq=0;
function scene(s,big){
  const W=360,H=big?240:138;
  const hz=big?98:56;
  const cx=big?302:290,cy=big?46:34,r=big?24:18;
  /* un meme spot peut etre rendu deux fois (accueil + liste) : sans compteur,
     la seconde copie pointe sur les degrades de la premiere, qui est sur un
     ecran masque — et Chromium ne peint alors ni ciel ni mer. */
  const u=s.id+(big?'-b':'-s')+'_'+(++_sceneSeq);
  const a=big?1:(H/240);
  const wy=v=>Math.round(v*a);
  return `<svg class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.sky}"/><stop offset="100%" stop-color="${s.sky2}"/></linearGradient>
      <linearGradient id="sea-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.sea}"/><stop offset="100%" stop-color="${s.sea2}"/></linearGradient>
      <radialGradient id="sun-${u}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fffaee"/><stop offset="45%" stop-color="#ffe6ab" stop-opacity=".9"/><stop offset="100%" stop-color="rgba(255,224,154,0)"/></radialGradient>
      <radialGradient id="sund-${u}" cx="50%" cy="42%" r="55%"><stop offset="0%" stop-color="#fffdf5"/><stop offset="100%" stop-color="#ffdf8e"/></radialGradient>
      <linearGradient id="wf-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".25"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky-${u})"/>
    <!-- sun glow + rays + disc -->
    <circle cx="${cx}" cy="${cy}" r="${r*3.1}" fill="url(#sun-${u})"/>
    <g stroke="#fff3cf" stroke-width="2" stroke-linecap="round" opacity=".5">
      <line x1="${cx}" y1="${cy-r-7}" x2="${cx}" y2="${cy-r-15}"/>
      <line x1="${cx+r+7}" y1="${cy}" x2="${cx+r+15}" y2="${cy}"/>
      <line x1="${cx-r-5}" y1="${cy+r+5}" x2="${cx-r-11}" y2="${cy+r+11}"/>
      <line x1="${cx+r+5}" y1="${cy+r+5}" x2="${cx+r+11}" y2="${cy+r+11}"/>
      <line x1="${cx-r-5}" y1="${cy-r-5}" x2="${cx-r-11}" y2="${cy-r-11}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sund-${u})"/>
    <!-- birds -->
    <g stroke="rgba(255,255,255,.8)" stroke-width="1.7" fill="none" stroke-linecap="round">
      <path d="M44 ${wy(44)} q5 -6 9 0 q4 -6 9 0"/><path d="M96 ${wy(32)} q4 -5 7 0 q3 -5 7 0"/>
    </g>
    <!-- clouds (shaded) -->
    <g><ellipse cx="86" cy="${wy(40)}" rx="30" ry="10" fill="#ffffff" opacity=".55"/><ellipse cx="112" cy="${wy(35)}" rx="19" ry="7" fill="#ffffff" opacity=".5"/><ellipse cx="90" cy="${wy(45)}" rx="28" ry="6" fill="${s.sky2}" opacity=".25"/></g>
    <!-- distant cliff -->
    <path d="M0 ${hz} L0 ${hz-wy(34)} Q26 ${hz-wy(48)} 52 ${hz-wy(30)} Q72 ${hz-wy(18)} 96 ${hz} Z" fill="${s.sea2}" opacity=".35"/>
    <!-- sea -->
    <path d="M0 ${hz} H${W} V${H} H0Z" fill="url(#sea-${u})"/>
    <!-- sun glitter -->
    <g fill="#fff" opacity=".3">
      <rect x="${cx-12}" y="${hz+5}" width="24" height="3" rx="1.5"/><rect x="${cx-8}" y="${hz+12}" width="16" height="3" rx="1.5"/>
      <rect x="${cx-15}" y="${hz+20}" width="30" height="3" rx="1.5"/><rect x="${cx-9}" y="${hz+28}" width="18" height="3" rx="1.5"/>
    </g>
    <!-- back swell -->
    <path d="M-20 ${wy(150)} Q90 ${wy(132)} 200 ${wy(150)} T420 ${wy(150)} L420 ${H} L-20 ${H} Z" fill="${s.sea2}" opacity=".55"/>
    <!-- breaking wave: shadow, face, lip foam, curl -->
    <path d="M-20 ${wy(178)} C70 ${wy(122)} 150 ${wy(220)} 250 ${wy(156)} C300 ${wy(134)} 340 ${wy(156)} 380 ${wy(148)} L380 ${H} L-20 ${H} Z" fill="${s.sea2}" opacity=".9"/>
    <path d="M-20 ${wy(192)} C80 ${wy(144)} 160 ${wy(230)} 260 ${wy(170)} C310 ${wy(146)} 350 ${wy(168)} 380 ${wy(160)} L380 ${H} L-20 ${H} Z" fill="${s.sea}"/>
    <path d="M30 ${wy(168)} C70 ${wy(132)} 120 ${wy(150)} 150 ${wy(186)} C120 ${wy(172)} 80 ${wy(168)} 50 ${wy(190)} Z" fill="url(#wf-${u})" opacity=".5"/>
    <path d="M-20 ${wy(178)} C70 ${wy(122)} 150 ${wy(220)} 250 ${wy(156)}" stroke="#ffffff" stroke-width="${big?8:5.5}" fill="none" stroke-linecap="round"/>
    <path d="M-20 ${wy(184)} C70 ${wy(130)} 150 ${wy(224)} 250 ${wy(162)}" stroke="#ffffff" stroke-width="${big?3:2}" fill="none" stroke-linecap="round" opacity=".6"/>
    <!-- foam spray -->
    <g fill="#ffffff"><circle cx="116" cy="${wy(168)}" r="${big?5:3.4}"/><circle cx="138" cy="${wy(182)}" r="${big?4:2.8}" opacity=".9"/><circle cx="96" cy="${wy(186)}" r="${big?3:2.2}" opacity=".85"/><circle cx="162" cy="${wy(192)}" r="${big?4:2.6}" opacity=".9"/><circle cx="80" cy="${wy(160)}" r="${big?3:2}" opacity=".8"/><circle cx="130" cy="${wy(156)}" r="${big?2.5:1.8}" opacity=".75"/></g>
    <!-- surfer with board + splash -->
    <g transform="translate(${big?214:200},${wy(154)})">
      <g fill="#ffffff" opacity=".85"><circle cx="-12" cy="16" r="2"/><circle cx="-16" cy="13" r="1.4"/><circle cx="14" cy="16" r="1.8"/></g>
      <path d="M-15 15 Q0 11 15 15 Q0 19 -15 15 Z" fill="#f4f7fa"/>
      <path d="M-15 15 Q0 12 15 15" stroke="#cfd8de" stroke-width="1" fill="none"/>
      <line x1="1" y1="2" x2="2" y2="14" stroke="#1b4a66" stroke-width="3.4" stroke-linecap="round"/>
      <line x1="1.5" y1="6" x2="-7" y2="2" stroke="#1b4a66" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="1.5" y1="6" x2="10" y2="1" stroke="#1b4a66" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="2" y1="13" x2="-3" y2="16" stroke="#1b4a66" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="2" y1="13" x2="7" y2="16" stroke="#1b4a66" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="1" cy="-2" r="3.4" fill="#7a4a32"/>
    </g>
  </svg>`;
}
/* header sky scene */
function headerSky(id){
  return `<svg class="sky" viewBox="0 0 392 150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="hsk-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#28a0e4"/><stop offset="55%" stop-color="#0e66a4"/><stop offset="100%" stop-color="#073b68"/></linearGradient>
    <radialGradient id="hsun-${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fffaee"/><stop offset="45%" stop-color="#ffd87a" stop-opacity=".85"/><stop offset="100%" stop-color="rgba(255,216,122,0)"/></radialGradient>
    <radialGradient id="hsund-${id}" cx="50%" cy="42%" r="55%"><stop offset="0%" stop-color="#fffdf5"/><stop offset="100%" stop-color="#ffdd86"/></radialGradient></defs>
    <rect width="392" height="150" fill="url(#hsk-${id})"/>
    <circle cx="338" cy="34" r="74" fill="url(#hsun-${id})"/>
    <g stroke="#fff3cf" stroke-width="2.4" stroke-linecap="round" opacity=".45"><line x1="338" y1="2" x2="338" y2="-8"/><line x1="372" y1="34" x2="384" y2="34"/><line x1="362" y1="58" x2="370" y2="66"/><line x1="314" y1="58" x2="306" y2="66"/></g>
    <circle cx="338" cy="34" r="23" fill="url(#hsund-${id})"/>
    <g stroke="rgba(255,255,255,.55)" stroke-width="1.7" fill="none" stroke-linecap="round"><path d="M52 40 q5 -6 9 0 q4 -6 9 0"/><path d="M96 28 q4 -5 7 0 q3 -5 7 0"/></g>
    <g><ellipse cx="120" cy="44" rx="34" ry="11" fill="#ffffff" opacity=".18"/><ellipse cx="150" cy="38" rx="22" ry="8" fill="#ffffff" opacity=".15"/></g>
    <path d="M0 116 Q98 100 196 116 T392 116 V150 H0Z" fill="#ffffff" opacity=".08"/>
    <path d="M0 128 Q88 116 196 128 T392 128 V150 H0Z" fill="#ffffff" opacity=".07"/>
  </svg>`;
}

/* ================= WEATHER ICONS (SVG) ================= */
var _icoSeq=0;
function icoWind(){var _i='_i'+(++_icoSeq);return `<svg viewBox="0 0 24 24"><defs><linearGradient id="gw${_i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5ed0ea"/><stop offset="100%" stop-color="#2b97c9"/></linearGradient></defs><g fill="none" stroke="url(#gw${_i})" stroke-width="2.4" stroke-linecap="round"><path d="M3 9h10a2.6 2.6 0 1 0-2.6-2.6"/><path d="M3 14h14a2.8 2.8 0 1 1-2.8 2.8"/></g></svg>`;}
function icoSwell(){var _i='_i'+(++_icoSeq);return `<svg viewBox="0 0 24 24"><defs><linearGradient id="gs${_i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3fb6d8"/><stop offset="100%" stop-color="#1268aa"/></linearGradient></defs><g fill="none" stroke="url(#gs${_i})" stroke-width="2.4" stroke-linecap="round"><path d="M2 13c2.5 0 2.5-3.2 5-3.2s2.5 3.2 5 3.2 2.5-3.2 5-3.2 2.5 3.2 5 3.2"/><path d="M2 18.5c2.5 0 2.5-3.2 5-3.2s2.5 3.2 5 3.2 2.5-3.2 5-3.2 2.5 3.2 5 3.2"/></g></svg>`;}
function icoTemp(){var _i='_i'+(++_icoSeq);return `<svg viewBox="0 0 24 24"><defs><linearGradient id="gt${_i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff9d6e"/><stop offset="100%" stop-color="#ef5a4b"/></linearGradient></defs><path d="M10 13.4V5a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0z" fill="#fff" stroke="url(#gt${_i})" stroke-width="2.2"/><circle cx="12" cy="16.6" r="2.4" fill="url(#gt${_i})"/><rect x="11.2" y="7" width="1.6" height="7" rx=".8" fill="url(#gt${_i})"/></svg>`;}
function icoTide(){var _i='_i'+(++_icoSeq);return `<svg viewBox="0 0 24 24"><defs><linearGradient id="gd${_i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b89be0"/><stop offset="100%" stop-color="#8a5cc7"/></linearGradient></defs><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" fill="url(#gd${_i})"/><circle cx="9" cy="9.5" r="1" fill="#fff" opacity=".7"/></svg>`;}

/* ================= RENDER ================= */
const lvlLabel={debutant:'🟢 Débutant',intermediaire:'🟡 Intermédiaire',expert:'🔴 Expert'};
/* ====== SPORTS NAUTIQUES ====== */
const SPORTS=[
  {id:'surf',label:'Surf',emoji:'🏄',color:'#1f8fd6',desc:'Glisser sur les vagues'},
  {id:'bodyboard',label:'Bodyboard',emoji:'🌊',color:'#3aa6e0',desc:'Allongé sur la mousse'},
  {id:'baignade',label:'Baignade',emoji:'🏊',color:'#23b5a8',desc:'Nager en sécurité'},
  {id:'paddle',label:'Paddle (SUP)',emoji:'🛶',color:'#2bb673',desc:'Debout sur la planche'},
  {id:'kayak',label:'Kayak',emoji:'🚣',color:'#5cb85c',desc:'Pagayer le long de la côte'},
  {id:'snorkeling',label:'Snorkeling',emoji:'🐠',color:'#f0a830',desc:'Masque & tuba'},
  {id:'plongee',label:'Plongée',emoji:'🤿',color:'#e8773f',desc:'Explorer les fonds'},
  {id:'kitesurf',label:'Kitesurf',emoji:'🪁',color:'#e8503f',desc:'Tracté par une aile'},
  {id:'windsurf',label:'Windsurf',emoji:'⛵',color:'#9b6fd0',desc:'Planche à voile'}
];
const SPORTMAP={};SPORTS.forEach(x=>SPORTMAP[x.id]=x);
/* --- icônes vectorielles maison (remplacent les emojis d'activité) --- */
const SPORT_ICONS={
  surf:'<path d="M5.5 18.5C3 16 6 8.5 11 4.5s9-1.5 7.5 1.5"/><path d="M5.5 18.5c2.5 2.5 9-.5 13-5.5"/><path d="M8 16 16 7.5"/>',
  bodyboard:'<rect x="7" y="3.5" width="10" height="17" rx="5"/><path d="M12 6.5v11"/>',
  baignade:'<circle cx="8.5" cy="6.5" r="2"/><path d="M6 12l4-2 3 2 3-1"/><path d="M3 16.5c1.7-1.6 3.3 1.4 5 0s3.3 1.4 5 0 3.3 1.4 5 0"/><path d="M3 19.5c1.7-1.6 3.3 1.4 5 0s3.3 1.4 5 0 3.3 1.4 5 0"/>',
  paddle:'<ellipse cx="11.5" cy="19" rx="8" ry="1.8"/><path d="M7.5 18 16 5"/><path d="M14 3.5 18 6l-2.2 2.4z"/>',
  kayak:'<path d="M2 14 Q12 11 22 14 Q12 17 2 14Z"/><path d="M12 4.5V19.5"/><path d="M9.5 5h5M9.5 19h5"/>',
  snorkeling:'<rect x="4.5" y="8" width="11" height="7" rx="3"/><path d="M15.5 9.5c2 0 3 1 3 3v6.5"/><circle cx="18.5" cy="19.5" r="1.3"/>',
  plongee:'<path d="M8.5 3.2c-1.4 4-1.4 9 0 13 3 2.2 6 1.6 7.2-1.4 1.2-4 .2-9.4-2-11.4-1.8-1.2-4-1-5.2-.2z"/><path d="M9 7c2 .5 4 .5 6 0"/>',
  kitesurf:'<path d="M3.5 6.5c5.5-3.5 11.5-3.5 17 0-3.5 2.3-13.5 2.3-17 0z"/><path d="M6.5 7 11 18M17.5 7 13 18"/><path d="M9.5 19h5"/>',
  windsurf:'<path d="M12 3.5 17.5 16H10z"/><path d="M12 3.5V20"/><ellipse cx="12" cy="20" rx="7" ry="1.7"/>'
};
function sportIcon(id,color){var c=color||(SPORTMAP[id]&&SPORTMAP[id].color)||'#1175bd';return '<svg class="spico" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(SPORT_ICONS[id]||'')+'</svg>';}
const WINDY=new Set(['latranche','lacanau','capferret','mimizan','quiberon','penhors','somo','zarautz','mardelplata','floripa','raglan','pantin']);
function spotSports(s){
  if(Array.isArray(s.sports)&&s.sports.length)return s.sports.filter(x=>SPORTMAP[x]);
  const t=parseInt(s.temp)||16,lvl=s.level,dg=s.danger||0;
  const out=['surf','bodyboard'];
  if(lvl!=='expert'&&dg<=3){out.push('baignade');out.push('paddle');}
  if(lvl==='debutant'&&dg<=2)out.push('kayak');
  const reef=/(récif|recif|corallien|corail|lagon|reef)/i.test((s.desc||'')+' '+((typeof FAUNA!=='undefined'&&FAUNA[s.id])||''));
  if(t>=21||reef){out.push('snorkeling');if(reef||dg>=3)out.push('plongee');}
  if(WINDY.has(s.id)){out.push('windsurf');out.push('kitesurf');}
  return out.filter((v,i,a)=>a.indexOf(v)===i);
}
function spotCard(s){
  let dots='';for(let i=0;i<4;i++)dots+=`<span class="dot ${i<s.danger?'on':''}"></span>`;
  const L=LIVE[s.id]||{};const wind=L.wind||s.wind,swell=L.swell||s.swell,temp=L.temp||s.temp;
  const sp=spotSports(s).slice(0,6).map(id=>`<span title="${SPORTMAP[id].label}">${sportIcon(id)}</span>`).join('');
  const dist=(nearMode&&userPos)?spotDist(s):null;
  const sc=(SCORES[s.id]||0).toFixed(1);
  const photo=spotPhotoUrl(s.id,480);
  return `<article class="spot" tabindex="0" role="button" aria-label="Découvrir ${s.name}" onclick="openSpot('${s.id}')">
    <div class="spot-banner">${scene(s,false)}
      ${photo?`<img class="spot-photo" src="${photo}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'">`:''}
      <div class="spot-shade"></div>
      <button class="fav" aria-label="${favs.has(s.id)?'Retirer des favoris':'Ajouter aux favoris'}" aria-pressed="${favs.has(s.id)}" onclick="toggleFav('${s.id}',event)">${favs.has(s.id)?FAV_ON:FAV_OFF}</button>
      ${dist!=null?`<span class="dist-tag"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg> ${fmtDist(dist)}</span>`:''}
      <span class="lvl-tag lvl-${s.level}">${lvlLabel[s.level]}</span>
      <span class="score-chip">★ ${sc}</span>
      <div class="glass-name"><h3>${s.name}</h3><div class="gn-loc"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg> ${s.loc}</div></div>
      <span class="spot-go">Voir →</span>
    </div>
    <div class="spot-info">
      <div class="spot-meta"><span>${icoWind()} ${wind}</span><span>${icoSwell()} ${swell}</span><span>${icoTemp()} ${temp}</span>${L.live?'<span class="live-dot" title="Données en direct"></span>':''}</div>
      <div class="spot-sports">${sp}</div>
      <div class="danger-dots" title="Danger">${dots}</div>
    </div>
  </article>`;
}
let currentFilter='all',currentSpot=null,currentSearch='';const LIVE={};let activeSport=null,favOnly=false;
var FAV_ON='<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg>';
var FAV_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg>';
function toggleFavFilter(){favOnly=!favOnly;const c=document.getElementById('favChip');if(c)c.classList.toggle('active',favOnly);renderSpots();renderMap(true);if(favOnly&&!favs.size)toast('Touche le ❤️ d’un spot pour l’ajouter');}
function renderSportFilters(){
  const el=document.getElementById('sportFilters');if(!el)return;
  let h='<div class="chip sp-chip'+(activeSport?'':' active')+'" onclick="setSport(null)">🌊 Tous</div>';
  h+=SPORTS.map(s=>{const a=activeSport===s.id;return `<div class="chip sp-chip${a?' active':''}" ${a?`style="background:linear-gradient(135deg,${s.color},${s.color}cc);border-color:transparent;box-shadow:0 8px 18px ${s.color}55"`:''} data-sp="${s.id}" onclick="setSport('${s.id}')">${sportIcon(s.id,a?'#fff':null)} ${s.label}</div>`;}).join('');
  el.innerHTML=h;
}
function setSport(id){
  activeSport=id;renderSportFilters();renderSpots();renderMap(true);
  const t=document.getElementById('spotsTitle');
  if(t)t.innerHTML=id?`${sportIcon(id)} Spots · ${SPORTMAP[id].label}`:'<span class="th"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg> Spots & activités</span>';
  if(id)toast(`Activité : ${SPORTMAP[id].label}`);
  renderLiveTop();
}
/* ====== GÉOLOCALISATION / AUTOUR DE MOI ====== */
let userPos=null,nearMode=false,userMarker=null;
function distKm(la1,lo1,la2,lo2){const R=6371,r=Math.PI/180;const dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(a));}
function spotDist(s){const c=COORDS[s.id];if(!c||!userPos)return null;return distKm(userPos.lat,userPos.lon,c.lat,c.lon);}
function fmtDist(d){if(d==null)return '';return d<1?Math.round(d*1000)+' m':(d<20?d.toFixed(1):Math.round(d))+' km';}
function requestGeo(ok,fail){
  if(!navigator.geolocation){fail&&fail();return;}
  toast('📍 Localisation en cours…');
  navigator.geolocation.getCurrentPosition(
    p=>{userPos={lat:p.coords.latitude,lon:p.coords.longitude};ok&&ok();},
    e=>{fail&&fail(e);},{enableHighAccuracy:true,timeout:9000,maximumAge:60000});
}
function mapsSearch(q,c){const u='https://www.google.com/maps/search/'+encodeURIComponent(q)+((c&&c.lat)?('/@'+c.lat+','+c.lon+',12z'):'');window.open(u,'_blank');}
function centerOnUser(){
  if(!userPos)return;renderMap(true);if(!leafMap)return;
  if(userMarker){try{leafMap.removeLayer(userMarker);}catch(e){}}
  const ic=L.divIcon({className:'lpin-wrap',html:'<div class="upin"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg></div>',iconSize:[34,34],iconAnchor:[17,30],popupAnchor:[0,-26]});
  userMarker=L.marker([userPos.lat,userPos.lon],{icon:ic}).addTo(leafMap).bindPopup('<b>Toi 📍</b>');
  setTimeout(()=>{try{leafMap.setView([userPos.lat,userPos.lon],8);}catch(e){}},140);
}
function hideOnb(){const o=document.getElementById('onb');o.classList.add('hide');setTimeout(()=>o.style.display='none',560);}
function goNearMe(){
  requestGeo(()=>{
    nearMode=true;chosenSport='all';activeSport=null;quickGate=false;hideOnb();
    renderSportFilters();renderSpots();saveState();renderHome();
    go('spots');setView('map');centerOnUser();
    document.getElementById('octoBubble').innerHTML='Voici tout ce que tu peux faire <b>près de toi</b> 🐙📍';
    toast('Les activités autour de toi 🌊');
  },()=>{
    nearMode=false;quickGate=false;activeSport=(chosenSport&&chosenSport!=='all')?chosenSport:null;hideOnb();
    renderSportFilters();renderSpots();go('spots');
    toast('📍 Localisation indisponible — voici tous les spots');
  });
}
function toggleNear(){
  const b=document.getElementById('nearBtn');
  if(nearMode){nearMode=false;if(b)b.classList.remove('on');renderSpots();renderMap(true);toast('Tri par distance désactivé');return;}
  requestGeo(()=>{nearMode=true;if(b)b.classList.add('on');renderSpots();if(document.getElementById('mapView').style.display!=='none')centerOnUser();toast('Spots triés par distance 📍');},
    ()=>toast('📍 Localisation refusée ou indisponible'));
}
/* La liste rendait les 118 spots d'un coup : 30 000 px de défilement et
   118 images chargées pour en voir trois. On en montre 12, le reste à la
   demande — et tout changement de filtre repart de 12. */
var SPOT_PAGE=12, spotShown=SPOT_PAGE;
function moreSpots(){ spotShown+=SPOT_PAGE; renderSpots(currentFilter,true); }
/* ====== SEPT MONDES ======
   L'écran ouvrait sur 118 fiches à faire défiler : un inventaire, pas un choix.
   On entre par une page de sélection, chaque monde avec sa lumière et sa
   silhouette. La répartition vient du champ `loc` de chaque spot. */
var WORLDS=[{"id":"fr","lab":"France","sub":"Landes · Bretagne · Méditerranée","c":["#c6e2f8","#7ab8e0","#2b86c0","#12608f","#ffffff","#c2d4e1"],"sun":[214,28,17],"art":"<path fill=\"url(#wsh-fr)\" d=\"M40 78V34Q62 25 98 30L112 36L166 46L170 78H150V60Q150 51 139 51Q128 51 128 60V78Z\"/>\n    <path fill=\"#1b4a6b\" opacity=\".20\" d=\"M112 36L166 46L170 78H150V60Q150 51 139 51Z\"/>\n    <path fill=\"url(#wsh-fr)\" d=\"M186 78l8-36 8 36Z\"/>\n    <path fill=\"#1b4a6b\" opacity=\".20\" d=\"M194 42l8 36h-4Z\"/>\n    <path fill=\"url(#wsh-fr)\" d=\"M0 78V60q18-7 34-2v20Z\" opacity=\".8\"/>\n    <path fill=\"url(#wsh-fr)\" d=\"M300 78V68q28-9 60-4v14Z\" opacity=\".75\"/>"},{"id":"eu","lab":"Europe","sub":"Portugal · Espagne · Norvège","c":["#e3ecf3","#a8c4d6","#22759c","#0d4767","#9db6c7","#4d6779"],"sun":[176,24,15],"art":"<g fill=\"url(#wsh-eu)\">\n      <path d=\"M0 78V56q44-16 86-6l24 8v20Z\"/>\n      <path d=\"M250 78V68q36-13 72-8l38 6v12Z\"/>\n    </g>\n    <g fill=\"#f8fbfd\">\n      <path d=\"M50 64l4-28h18l4 28Z\"/>\n      <rect x=\"48\" y=\"31\" width=\"30\" height=\"5\" rx=\"2\"/>\n      <rect x=\"55\" y=\"21\" width=\"16\" height=\"10\"/>\n      <path d=\"M52 21h22l-11-9Z\"/>\n    </g>\n    <circle cx=\"63\" cy=\"26\" r=\"3.6\" fill=\"#ffd35e\"/>\n    <g fill=\"#e05a49\"><rect x=\"55\" y=\"40\" width=\"16\" height=\"5\"/><rect x=\"53\" y=\"52\" width=\"20\" height=\"5\"/></g>"},{"id":"af","lab":"Afrique","sub":"Maroc · Mer Rouge · Maurice","c":["#ffeccb","#ffbe86","#1cadc2","#0f7b98","#f1d29c","#cb9c5e"],"sun":[58,32,19],"art":"<path fill=\"url(#wsh-af)\" d=\"M0 78V62q66-26 138-12 60 12 118-6 52-15 104 4v30Z\"/>\n    <path fill=\"#ffffff\" opacity=\".22\" d=\"M0 78V62q66-26 138-12l-52 28Z\"/>\n    <path stroke=\"#6b5334\" stroke-width=\"4.5\" fill=\"none\" stroke-linecap=\"round\" d=\"M118 74q1-18 11-30\"/>\n    <g fill=\"#3f7a52\">\n      <path d=\"M129 44q-18-3-24 7 13-3 24-3Z\"/>\n      <path d=\"M129 44q17-6 25 4-13-2-25-1Z\"/>\n      <path d=\"M129 44q-10-14-24-13 10 5 24 15Z\"/>\n      <path d=\"M129 44q10-15 25-13-11 5-25 15Z\"/>\n    </g>"},{"id":"na","lab":"Amérique du Nord","sub":"Californie · Mexique · Caraïbes","c":["#ffdcc6","#f79a86","#2f8dc6","#175f8d","#829584","#42574a"],"sun":[212,32,20],"art":"<path fill=\"url(#wsh-na)\" d=\"M0 78V48q34-16 74-8l92 14v24Z\"/>\n    <g fill=\"#2c4b3f\">\n      <path d=\"M28 44l8-18 8 18Z\"/><path d=\"M30 36l6-14 6 14Z\"/>\n      <path d=\"M64 41l9-20 9 20Z\"/><path d=\"M66 32l7-15 7 15Z\"/>\n      <path d=\"M104 45l7-16 7 16Z\"/>\n    </g>\n    <path fill=\"url(#wsh-na)\" opacity=\".6\" d=\"M262 78V68q34-12 66-5l32 6v9Z\"/>"},{"id":"sa","lab":"Amérique du Sud","sub":"Pérou · Brésil · Chili","c":["#ffeac6","#f6b06d","#2091ba","#0d5f81","#c68f68","#83583c"],"sun":[214,30,18],"art":"<path fill=\"url(#wsh-sa)\" d=\"M0 78V52q56-15 108-2 56 14 110 4 60-10 142-16v40Z\"/>\n    <path fill=\"#1b4a6b\" opacity=\".13\" d=\"M0 78V52q56-15 108-2l-64 28Z\"/>\n    <g fill=\"#3d7a4f\">\n      <path d=\"M152 78V36q0-7 6-7t6 7v42Z\"/>\n      <path d=\"M140 78V54q0-9 9-9v33Z\"/>\n      <path d=\"M176 78V48q0-9-9-9v39Z\"/>\n      <path d=\"M206 78V58q0-5 4-5t4 5v20Z\"/>\n      <path d=\"M198 78V66q0-6 6-6v18Z\"/>\n    </g>"},{"id":"as","lab":"Asie","sub":"Indonésie · Maldives · Japon","c":["#e2f6f2","#a8e3dd","#19bbb0","#0c7b81","#b9cdc2","#5e7d72"],"sun":[64,30,16],"art":"<g fill=\"url(#wsh-as)\">\n      <path d=\"M22 78V52q0-12 10-12t10 12v26Z\"/>\n      <path d=\"M62 78V28q0-18 16-18t16 18v50Z\"/>\n      <path d=\"M112 78V46q0-13 11-13t11 13v32Z\"/>\n      <path d=\"M244 78V56q0-11 9-11t9 11v22Z\"/>\n    </g>\n    <g fill=\"#1b4a6b\" opacity=\".16\">\n      <path d=\"M78 10q16 0 16 18v50h-10V28q0-14-6-18Z\"/>\n      <path d=\"M123 33q11 0 11 13v32h-7V46q0-10-4-13Z\"/>\n    </g>\n    <g fill=\"#2f5245\">\n      <path d=\"M62 30q16-13 32 0-16-5-32 0Z\"/>\n      <path d=\"M22 53q10-8 20 0-10-3-20 0Z\"/>\n      <path d=\"M112 47q11-9 22 0-11-3-22 0Z\"/>\n      <path d=\"M244 57q9-7 18 0-9-3-18 0Z\"/>\n    </g>"},{"id":"oc","lab":"Océanie","sub":"Hawaï · Australie · Tahiti","c":["#d5edf9","#84c8e9","#1599d8","#0a5288","#7c92a8","#3a4c63"],"sun":[66,28,15],"art":"<path fill=\"url(#wsh-oc)\" d=\"M92 78l58-44q10-8 20 0l62 44Z\"/>\n    <path fill=\"#ffffff\" opacity=\".20\" d=\"M92 78l58-44q10-8 20 0l-26 44Z\"/>\n    <path fill=\"#16283c\" opacity=\".20\" d=\"M170 34l62 44h-38Z\"/>\n    <path fill=\"#f6fafc\" opacity=\".78\" d=\"M149 35q11-7 22 0-5-7-11-7t-11 7Z\"/>\n    <path fill=\"url(#wsh-oc)\" opacity=\".5\" d=\"M282 78V70q30-10 60-4l18 4v8Z\"/>"}];
var SPOT_WORLD={"imsouane":"af","safi":"af","sidikaouki":"af","ngor":"af","ouakam":"af","elandsbay":"af","muizenberg":"af","dahab":"af","nosybe":"af","watamu":"af","keramas":"as","nias":"as","gland":"as","komodo":"as","bunaken":"as","similan":"as","weligama":"as","ichinomiya":"as","kerama":"as","rincon":"na","pavones":"na","tamarindo":"na","sayulita":"na","todossantos":"na","islamujeres":"na","tofino":"na","newsmyrna":"na","montauk":"na","mancora":"sa","huanchaco":"sa","iquique":"sa","praiadorosa":"sa","noronha":"sa","ilhabela":"sa","puntadeleste":"sa","ayampe":"sa","burleigh":"oc","byronbay":"oc","manly":"oc","ningaloo":"oc","piha":"oc","shipwreck":"oc","restaurants":"oc","borabora":"oc","jardimdomar":"eu","santabarbara":"eu","capomannu":"eu","isolabella":"eu","zlatnirat":"eu","naxos":"eu","hossegor":"fr","lacanau":"fr","latorche":"fr","biarritz":"fr","anglet":"fr","quiberon":"fr","seignosse":"fr","capbreton":"fr","lafitenia":"fr","guethary":"fr","sauveterre":"fr","latranche":"fr","lapalue":"fr","penhors":"fr","lapalmyre":"fr","mimizan":"fr","capferret":"fr","bidart":"fr","lafranqui":"fr","portcros":"fr","calanques":"fr","annecy":"fr","verdon":"fr","glenan":"fr","palombaggia":"fr","wissant":"fr","letouquet":"fr","hardelot":"fr","wimereux":"fr","berck":"fr","malolesbains":"fr","lehavre":"fr","etretat":"fr","dieppe":"fr","siouville":"fr","vauville":"fr","hauteville":"fr","granville":"fr","saintmalo":"fr","saintlunaire":"fr","erquy":"fr","perros":"fr","nazare":"eu","supertubos":"eu","ericeira":"eu","mundaka":"eu","thurso":"eu","bundoran":"eu","rodiles":"eu","somo":"eu","zarautz":"eu","pantin":"eu","lasanta":"eu","unstad":"eu","silfra":"eu","medes":"eu","tarifa":"eu","pozo":"eu","gardalake":"eu","capri":"eu","praia_marinha":"eu","navagio":"eu","anchorpoint":"af","jbay":"af","dungeons":"af","skeletonbay":"af","rasmohammed":"af","thistlegorm":"af","dakhla":"af","essaouira":"af","lemorne":"af","anse_source":"af","mavericks":"na","trestles":"na","malibu":"na","hoodriver":"na","puerto":"na","cenote_dosojos":"na","santateresa":"na","puntaroca":"na","bluehole_belize":"na","bonaire":"na","cabarete":"na","chicama":"sa","lobitos":"sa","puntadelobos":"sa","arica":"sa","floripa":"sa","saquarema":"sa","itacare":"sa","cumbuco":"sa","jericoacoara":"sa","montanita":"sa","galapagos":"sa","mardelplata":"sa","uluwatu":"as","padang":"as","mentawai":"as","tulamben":"as","rajaampat":"as","sipadan":"as","shonan":"as","arugam":"as","cloud9":"as","richelieu":"as","maldives":"as","bells":"oc","snapper":"oc","margaret":"oc","greatbarrier":"oc","whitehaven":"oc","raglan":"oc","cloudbreak":"oc","teahupoo":"oc","pipeline":"oc","waikiki":"oc","hanauma":"oc","hookipa":"oc"};
var spotWorld=null;
function inWorld(s){ return !spotWorld||spotWorld==='all'||SPOT_WORLD[s.id]===spotWorld; }
function worldOf(id){ for(var i=0;i<WORLDS.length;i++) if(WORLDS[i].id===id) return WORLDS[i]; return null; }
function worldCount(id){
  var n=0; for(var i=0;i<SPOTS.length;i++) if(SPOT_WORLD[SPOTS[i].id]===id) n++;
  return n;
}
/* Photographies de destinations réelles, créditées dans photos.html. */
var WORLD_PHOTOS={"fr": {"src": "assets/spots/calanques.jpg", "source": "https://commons.wikimedia.org/wiki/File:Vue_de_la_calanque_d%27En-Vau.jpg", "author": "Bastien Guigue", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "place": "Calanque d’En-Vau, France"}, "eu": {"src": "assets/spots/navagio.jpg", "source": "https://commons.wikimedia.org/wiki/File:Aerial_of_Navagio_Shipwreck_Beach_(46470701841).jpg", "author": "dronepicr", "license": "CC BY 2.0", "licenseUrl": "https://creativecommons.org/licenses/by/2.0", "place": "Navagio, Grèce"}, "af": {"src": "assets/spots/anse_source.jpg", "source": "https://commons.wikimedia.org/wiki/File:Anse_source_dagent_beach_la_digue.jpg", "author": "Svein-Magne Tunli - tunliweb.no", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "place": "Anse Source d’Argent, Seychelles"}, "na": {"src": "assets/spots/islamujeres.jpg", "source": "https://commons.wikimedia.org/wiki/File:Playa_Norte,_Isla_Mujeres_(42695470885).jpg", "author": "dronepicr", "license": "CC BY 2.0", "licenseUrl": "https://creativecommons.org/licenses/by/2.0", "place": "Isla Mujeres, Mexique"}, "sa": {"src": "assets/spots/noronha.jpg", "source": "https://commons.wikimedia.org/wiki/File:Baia_dos_Porcos,_Fernando_de_Noronha.jpg", "author": "Marcia Luppi", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "place": "Fernando de Noronha, Brésil"}, "as": {"src": "assets/spots/rajaampat.jpg", "source": "https://commons.wikimedia.org/wiki/File:Wayag_Island.jpg", "author": "Rolandandika", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "place": "Raja Ampat, Indonésie"}, "oc": {"src": "assets/spots/whitehaven.jpg", "source": "https://commons.wikimedia.org/wiki/File:Whitehaven_Beach_-_Northern_End.jpg", "author": "Hush Neo", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "place": "Whitehaven, Australie"}};
function worldVisited(id){
  /* la progression vient du carnet de sessions, pas d'un score décoratif */
  var seen={}; sessions.forEach(function(s){ seen[s.spot]=1; });
  var n=0;
  for(var i=0;i<SPOTS.length;i++){
    var s=SPOTS[i];
    if(SPOT_WORLD[s.id]!==id) continue;
    if(seen[s.name.split(' \u2014 ')[0]]) n++;
  }
  return n;
}
function renderWorlds(){
  const host=document.getElementById('worldGrid');if(!host)return;
  host.innerHTML=WORLDS.map((w,index)=>{
    const photo=WORLD_PHOTOS[w.id],total=worldCount(w.id);
    return `<button class="isl world-${w.id}" onclick="openWorld('${w.id}')" aria-label="Explorer ${w.lab}, ${total} spots">
      <img class="isl-img" src="${photo.src}" alt="" loading="lazy" decoding="async">
      <span class="world-num" aria-hidden="true">0${index+1}</span>
      <span class="world-count">${total} spots</span>
      <span class="isl-plate"><span class="world-place">${photo.place}</span><b>${w.lab}</b><span class="world-sub">${w.sub}</span><span class="world-open">Explorer <span aria-hidden="true">↗</span></span></span>
    </button>`;
  }).join('');
  const total=document.getElementById('worldTotal');if(total)total.innerHTML='<b>'+SPOTS.length+' spots.</b> Sept portes vers le grand bleu.';
  const allLabel=document.querySelector('.w-all-tx i');if(allLabel)allLabel.textContent='Ouvre la carte et trouve ton prochain terrain de jeu.';
}

function openWorld(id){
  spotWorld=id;
  syncWorldUI();
  renderSpots();
  try{ renderMap(true); }catch(e){}
  var w=document.getElementById('screenWrap'); if(w) w.scrollTop=0;
}
function backToWorlds(){
  spotWorld=null;
  currentSearch=''; favOnly=false;
  var si=document.getElementById('spotSearch'); if(si) si.value='';
  var fc=document.getElementById('favChip'); if(fc) fc.classList.remove('active');
  syncWorldUI();
  var w=document.getElementById('screenWrap'); if(w) w.scrollTop=0;
}
function syncWorldUI(){
  var on=!!spotWorld;
  ['spotTools','sportFilters','wBack'].forEach(function(id){
    var e=document.getElementById(id); if(e) e.style.display=on?'':'none';
  });
  var wp=document.getElementById('worldPick'); if(wp) wp.style.display=on?'none':'';
  var lv=document.getElementById('listView'), mv=document.getElementById('mapView');
  if(!on){ if(lv)lv.style.display='none'; if(mv)mv.style.display='none'; }
  else { setView('list'); }
  var w=on?worldOf(spotWorld):null;
  var top=document.getElementById('spotsTop');
  if(top)top.style.setProperty('--region-photo',`url("${w?WORLD_PHOTOS[w.id].src:'assets/photos/hero.jpg'}")`);
  var ttl=document.getElementById('spotsTitle'), sub=document.getElementById('spotsSub');
  if(ttl) ttl.textContent = w?w.lab : (spotWorld==='all'?'Trouve ton spot.':'Le monde est à toi.');
  if(ttl&&!on)ttl.innerHTML='Le monde<br> <span>est à toi.</span>';
  if(sub) sub.textContent = on
    ? (w? worldCount(w.id)+' spots à explorer' : SPOTS.length+' spots, partout dans le monde')
    : 'Choisis un horizon. Prépare ta session. Vis ton aventure.';
}
function renderSpots(filter=currentFilter,keep){
  currentFilter=filter;const q=currentSearch;
  if(!keep) spotShown=SPOT_PAGE;
  let list=SPOTS.filter(s=>inWorld(s)&&(filter==='all'||s.level===filter)&&(!activeSport||spotSports(s).includes(activeSport))&&(!favOnly||favs.has(s.id))&&(!q||(s.name+' '+s.loc).toLowerCase().includes(q)));
  if(nearMode&&userPos)list=list.slice().sort((a,b)=>(spotDist(a)??9e9)-(spotDist(b)??9e9));
  var _h;
  if(!list.length){
    _h='<div class="nospot">Aucun spot ici.'+((spotWorld&&spotWorld!=='all'&&currentSearch)?'<button onclick="openWorld(\'all\')">Chercher dans tous les spots</button>':'')+'</div>';
  }else{
    var _v=list.slice(0,spotShown);
    _h=_v.map(spotCard).join('');
    if(list.length>spotShown){
      _h+='<button class="more-spots" onclick="moreSpots()">Voir '
        + Math.min(SPOT_PAGE,list.length-spotShown)+' spots de plus'
        + '<span>'+spotShown+' sur '+list.length+'</span></button>';
    }else if(list.length>SPOT_PAGE){
      _h+='<div class="more-end">Les '+list.length+' spots sont affichés.</div>';
    }
  }
  document.getElementById('spotList').innerHTML=_h;
  const home=(nearMode&&userPos)?SPOTS.slice().sort((a,b)=>(spotDist(a)??9e9)-(spotDist(b)??9e9)).slice(0,3):SPOTS.slice(0,3);
  document.getElementById('homeSpots').innerHTML=home.map(spotCard).join('');
}
function filterSpots(el,f){document.querySelectorAll('#filters .chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderSpots(f);}
function searchSpots(q){currentSearch=(q||'').toLowerCase().trim();renderSpots();if(document.getElementById('mapView').style.display!=='none')renderMap(true);}
function toggleFav(id,ev){if(ev)ev.stopPropagation();
  if(favs.has(id))favs.delete(id);else favs.add(id);
  renderSpots();renderMap(true);saveState();
  const df=document.getElementById('dFav');if(df&&currentSpot===id)df.innerHTML=favs.has(id)?FAV_ON:FAV_OFF;df.classList.toggle('on',favs.has(id));
  toast(favs.has(id)?'Ajouté à tes favoris ❤️':'Retiré des favoris');
}
/* ---- map ---- */
function syncViewBtn(v){
  var b=document.getElementById('vtToggle'); if(!b)return;
  var onMap = (v==='map');
  b.innerHTML = onMap ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3.5 6.2v13.3L9 17.3l6 2.2 5.5-2.2V4L15 6.2z"/><path d="M9 4v13.3M15 6.2v13.3"/></svg>';
  b.setAttribute('aria-label', onMap ? 'Afficher la liste' : 'Afficher la carte');
  b.setAttribute('title', onMap ? 'Liste' : 'Carte');
  b.classList.toggle('on', onMap);
}
function setView(v){ syncViewBtn(v);
  if(v!=='map'&&typeof setMapFull==='function')setMapFull(false);
  const list=document.getElementById('listView'),map=document.getElementById('mapView');
  document.getElementById('vtList').classList.toggle('active',v==='list');
  document.getElementById('vtMap').classList.toggle('active',v==='map');
  list.style.display=v==='list'?'':'none';map.style.display=v==='map'?'':'none';
  if(v==='map'){mScale=1;mX=0;mY=0;renderMap(true);
    /* on recadre a CHAQUE ouverture, pas seulement a la premiere :
       sinon on retombe sur la vue calculee quand le conteneur n'avait
       pas encore sa taille. centerOnUser(), appele apres, reste prioritaire. */
    setTimeout(fitMapToSpots,60);}
}
/* ---- zoom / pan controller ---- */
let mScale=1,mX=0,mY=0,mDragged=false,mPrevDist=0;const mPtrs=new Map();
function applyMap(){const c=document.getElementById('mapCanvas');if(!c)return;const W=c.clientWidth||1,H=c.clientHeight||1;
  mScale=Math.max(1,Math.min(4,mScale));
  mX=Math.max(W*(1-mScale),Math.min(0,mX));mY=Math.max(H*(1-mScale),Math.min(0,mY));
  c.style.transform=`translate(${mX}px,${mY}px) scale(${mScale})`;declutterPins();}
function mapZoomAt(f,cx,cy){const ns=Math.max(1,Math.min(4,mScale*f)),k=ns/mScale;mX=cx-(cx-mX)*k;mY=cy-(cy-mY)*k;mScale=ns;applyMap();}
function zoomBtn(d){const el=document.getElementById('spotMap');if(!el)return;const r=el.getBoundingClientRect();mapZoomAt(d>0?1.4:1/1.4,r.width/2,r.height/2);}
function zoomReset(){mScale=1;mX=0;mY=0;applyMap();}
function setupMapZoom(){const el=document.getElementById('spotMap');if(!el||el._zoomSet)return;el._zoomSet=true;
  const pos=e=>{const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  el.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);mapZoomAt(e.deltaY<0?1.12:1/1.12,p.x,p.y);},{passive:false});
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);mPtrs.set(e.pointerId,pos(e));mDragged=false;mPrevDist=0;el.classList.add('grabbing');});
  el.addEventListener('pointermove',e=>{if(!mPtrs.has(e.pointerId))return;const prev=mPtrs.get(e.pointerId),cur=pos(e);mPtrs.set(e.pointerId,cur);
    if(mPtrs.size===1){const dx=cur.x-prev.x,dy=cur.y-prev.y;if(Math.abs(dx)+Math.abs(dy)>3)mDragged=true;mX+=dx;mY+=dy;applyMap();}
    else if(mPtrs.size>=2){const p=[...mPtrs.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);const mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};if(mPrevDist)mapZoomAt(d/mPrevDist,mid.x,mid.y);mPrevDist=d;mDragged=true;}});
  const up=e=>{mPtrs.delete(e.pointerId);if(mPtrs.size<2)mPrevDist=0;if(mPtrs.size===0)el.classList.remove('grabbing');};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  el.addEventListener('click',e=>{if(mDragged){e.stopPropagation();e.preventDefault();mDragged=false;}},true);
}
function pineSVG(){return '<svg width="22" height="38" viewBox="0 0 22 38"><rect x="10" y="16" width="2" height="22" fill="#7a5230"/><g fill="#2f8a4a"><ellipse cx="11" cy="14" rx="10" ry="6.5"/><ellipse cx="11" cy="7.5" rx="6.5" ry="5.5"/></g><ellipse cx="8" cy="12" rx="3" ry="2" fill="#46ad62" opacity=".7"/></svg>';}
function treeSVG(){return '<svg width="20" height="20" viewBox="0 0 20 20"><rect x="9" y="14" width="2" height="6" fill="#6b4a2a"/><path d="M10 1 l8 13 -16 0Z" fill="#3f8f4e"/><path d="M10 5 l5 9 -10 0Z" fill="#347a42"/></svg>';}
function citySVG(){return '<svg width="32" height="20" viewBox="0 0 32 20"><g fill="#e7dccd"><rect x="3" y="12" width="8" height="7"/><rect x="21" y="12" width="8" height="7"/></g><g fill="#bf6f3e"><path d="M2 12 l5 -4 5 4Z"/><path d="M20 12 l5 -4 5 4Z"/></g><rect x="13" y="8" width="6" height="11" fill="#d3d8dc"/><path d="M13 8 l3 -6 3 6Z" fill="#8a8f95"/><rect x="15.4" y="3" width="1.2" height="3" fill="#8a8f95"/><g fill="#8a7e6e"><rect x="5" y="14" width="1.6" height="2.6"/><rect x="8" y="14" width="1.6" height="2.6"/><rect x="23" y="14" width="1.6" height="2.6"/><rect x="26" y="14" width="1.6" height="2.6"/></g></svg>';}
function declutterPins(){const c=document.getElementById('mapCanvas');if(!c)return;const W=c.clientWidth,H=c.clientHeight;
  const pins=[...c.querySelectorAll('.pin')];pins.sort((a,b)=>(+b.dataset.sc)-(+a.dataset.sc));
  const shown=[],min=44;
  pins.forEach(p=>{const sx=mX+(+p.dataset.x/100*W)*mScale,sy=mY+(+p.dataset.y/100*H)*mScale;
    const lbl=p.querySelector('.lbl');
    let ok=true;for(const s of shown){if(Math.hypot(sx-s.x,sy-s.y)<min){ok=false;break;}}
    if(lbl)lbl.style.visibility=ok?'':'hidden';
    if(ok)shown.push({x:sx,y:sy});});}
let leafMap=null,leafMarkers=null;
var mapFull=false;
function mapFullIcon(on){
  return on
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
}
function setMapFull(on,fromPop){
  var wrap=document.getElementById('spotMapWrap'); if(!wrap)return;
  if(on===mapFull)return;
  mapFull=on;
  wrap.classList.toggle('full',on);
  document.body.classList.toggle('mapfull',on);
  var btn=document.getElementById('mapFsBtn');
  if(btn){btn.innerHTML=mapFullIcon(on);
    btn.setAttribute('aria-label',on?'Quitter le plein écran':'Carte en plein écran');
    btn.setAttribute('title',on?'Quitter le plein écran':'Plein écran');}
  var bar=document.getElementById('mapBar');
  if(bar&&on){
    var w=(typeof worldOf==='function')?worldOf(spotWorld):null;
    var nb=(typeof leafMap!=='undefined'&&leafMap&&leafMap._pts)?leafMap._pts.length:0;
    bar.innerHTML='<b>'+(w?w.lab:'Tous les spots')+'</b><span>'+nb+' spot'+(nb>1?'s':'')+'</span>'
                + '<button type="button" onclick="setMapFull(false)">Fermer</button>';
  }
  /* Leaflet cadre sur la taille du conteneur au moment de l'appel : on le
     previent tout de suite, puis une seconde fois APRES la transition, sinon la
     premiere passe tombe pendant l'animation et le zoom reste faux. */
  setTimeout(fitMapToSpots,30);
  setTimeout(fitMapToSpots,340);
  /* le bouton retour du telephone doit fermer le plein ecran, pas quitter l'appli */
  try{
    if(on) history.pushState({mapFull:1},'');
    else if(!fromPop&&history.state&&history.state.mapFull) history.back();
  }catch(e){}
}
function toggleMapFull(){ setMapFull(!mapFull); }
window.addEventListener('popstate',function(){ if(mapFull)setMapFull(false,true); });
window.addEventListener('keydown',function(e){ if(e.key==='Escape'&&mapFull)setMapFull(false); });
function fitMapToSpots(){
  /* invalidateSize() AVANT fitBounds : sinon Leaflet cadre sur une taille de
     conteneur perimee, et le zoom reste faux une fois la taille corrigee.
     maxZoom : un seul point donne des bornes nulles et enverrait au zoom 18. */
  if(!leafMap||!leafMap._pts||!leafMap._pts.length)return;
  try{ leafMap.invalidateSize(); }catch(e){}
  try{
    if(leafMap._pts.length===1) leafMap.setView(leafMap._pts[0],11);
    else leafMap.fitBounds(leafMap._pts,{padding:[34,34],maxZoom:11});
  }catch(e){}
}
function renderMap(refresh){
  const el=document.getElementById('spotMap');if(!el)return;
  if(typeof L==='undefined'){el.innerHTML='<div style="padding:46px 22px;text-align:center;color:#5a7384;font-size:13px;font-weight:600;line-height:1.6">🌊 La carte a besoin d\'une connexion internet.<br>Ouvre l\'appli en ligne pour la voir.</div>';return;}
  if(!leafMap){
    /* une vue explicite des le depart : sans elle, la carte reste dans un
       etat indefini jusqu'au premier fitBounds, et un fitBounds calcule sur
       un conteneur pas encore dimensionne part au zoom maximum. */
    leafMap=L.map(el,{zoomControl:true,attributionControl:true}).setView([22,0],2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,minZoom:2,worldCopyJump:true,attribution:'&copy; OpenStreetMap'}).addTo(leafMap);
    leafMarkers=L.layerGroup().addTo(leafMap);
  }
  if(!leafMap._built||refresh){
    leafMap._built=true;leafMarkers.clearLayers();
    const col={debutant:'#2faf72',intermediaire:'#f5a623',expert:'#e8503f'};
    const pts=[];
    SPOTS.forEach(s=>{const c=COORDS[s.id];if(!c)return;
      if(!inWorld(s))return;
      if(currentFilter!=='all'&&s.level!==currentFilter)return;
      if(currentSearch&&!(s.name+' '+s.loc).toLowerCase().includes(currentSearch))return;
      const ssp=spotSports(s);
      if(activeSport&&!ssp.includes(activeSport))return;
      if(favOnly&&!favs.has(s.id))return;
      pts.push([c.lat,c.lon]);
      const emo=sportIcon(activeSport||ssp[0]||'surf','#fff');
      const icon=L.divIcon({className:'lpin-wrap',html:'<div class="lpin" style="background:'+col[s.level]+'"><span>'+emo+'</span></div>',iconSize:[30,30],iconAnchor:[15,30],popupAnchor:[0,-28]});
      const sh=ssp.map(id=>sportIcon(id)).join(' ');
      L.marker([c.lat,c.lon],{icon,title:s.name,alt:s.name}).addTo(leafMarkers)
        .bindPopup('<div class="lpop"><b>'+s.name.split(' — ')[0]+'</b><em>'+lvlLabel[s.level]+' · '+(SCORES[s.id]||0).toFixed(1)+'/5</em><div class="lpop-sp">'+sh+'</div><button onclick="openSpot(\''+s.id+'\')">Voir la fiche 🏄</button></div>');
    });
    leafMap._pts=pts;
    if(pts.length&&(refresh||!leafMap._fit)){leafMap._fit=true;setTimeout(fitMapToSpots,0);}
  }
  setTimeout(function(){try{leafMap.invalidateSize();}catch(e){}},80);
}
/* photos : paysages variés selon le climat du spot (pas que des surfeurs en gros plan) */
const PHOTO_TAGS={anglet:'coast,cliffs,ocean',biarritz:'beach,coastline,sea'};
const PHOTO_LOCK={anglet:307,biarritz:118};

/* ===== PHOTOS RÉELLES DES SPOTS (Wikimedia Commons) ===== */
const WPHOTO={
imsouane:['Imswinne surfeus so plantche.jpg','Lucyin','CC BY-SA 4.0'],
safi:['The beauty of lalla fatna beach in Safi city morocco the blue water 14.jpg','Fatimaezzahra88','CC BY-SA 4.0'],
sidikaouki:['Beach, Sidi Kaouki, Morocco.jpg','Goldfinchshuffle','CC BY-SA 4.0'],
ngor:['Plage de Ngor.jpg','Tbo47','CC0'],
ouakam:['Hundreds of Senegalese traditional canoes ("pirogues") at Ouakam beach.jpg','Ruth Zurielly Jennings','CC BY-SA 4.0'],
elandsbay:['Mussel Point (Mike Taylor\'s Midden), Elands Bay, South Africa.jpg','Andrew Hall','CC BY-SA 3.0'],
muizenberg:['Surfers at Muizenberg Beach (2).jpg','Husskeyy','CC BY-SA 4.0'],
dahab:['Blue Whole, Dahab.jpg','Petar Milošević','CC BY-SA 4.0'],
nosybe:['La piroga a Tanikely - panoramio.jpg','patano','CC BY-SA 3.0'],
watamu:['Watamu Beach, Kenya 11.jpg','Jenny Kellett','CC BY-SA 4.0'],
keramas:['Pagi di Keramas.jpg','Arthamade','CC BY-SA 4.0'],
nias:['Sorake Beach - panoramio.jpg','hotmahtg','CC BY-SA 3.0'],
gland:['Plengkung Bay Java Indonesia (110396489).jpeg','Ullasa Kodandaramaiah','CC BY-SA 3.0'],
komodo:['Pink Beach 01.jpg','Hotel Kaesong','CC BY-SA 2.0'],
bunaken:['Mangrove Beach, Pulau Bunaken, Sulawesi (15216058132).jpg','Fabio Achilli from Milano, Italy','CC BY 2.0'],
similan:['Similan Island 01 (MK).jpg','Mathias Krumbholz','CC BY-SA 3.0'],
weligama:['Weligama beach (2).jpg','PIERRE ANDRE LECLERCQ','CC BY-SA 4.0'],
ichinomiya:['初日の出Surfing - panoramio.jpg','Mr Montarou','CC BY 3.0'],
kerama:['Tokashiku Beach On Tokashiki Island 2009 (7372).JPG','TomazVajngerl','CC BY-SA 3.0'],
rincon:['Rincon - Beach view.jpg','P. Hughes','CC BY 4.0'],
pavones:['Golfito - Pacific Coast of Costa Rico - panoramio.jpg','David Broad','CC BY 3.0'],
tamarindo:['Parque Marino Las Baulas Playa Grande Costa Rica 2016-10.jpg','Jorge Antonio Leoni de León','CC BY-SA 4.0'],
sayulita:['Beach in Sayulita, Mexico.jpg','Peon In Politics','CC BY-SA 4.0'],
todossantos:['Isla de Todos Santos - from boat.jpg','Alan Islas','CC BY-SA 4.0'],
islamujeres:['Mexican island Isla Mujeres (42882051294).jpg','dronepicr','CC BY 2.0'],
tofino:['Cox Bay Tofino Surfer Decision Time 2475.jpg','ImagePerson','CC BY 4.0'],
newsmyrna:['Surf at New Smyrna Beach Florida.jpg','Lbeaumont','CC BY-SA 4.0'],
montauk:['South Edison Beach - Montauk, New York, USA - October 2, 2023 02.jpg','Giorgio Galeotti','CC BY-SA 4.0'],
mancora:['Máncora Beach.jpg','Melissamarzo','CC BY-SA 4.0'],
huanchaco:['Surfista de Huanchaco.jpg','Yanavictoria','CC BY-SA 4.0'],
iquique:['Playa Cavancha - panoramio.jpg','Jorge Manriquez P.','CC BY-SA 3.0'],
praiadorosa:['Praia do Rosa, Imbutuba, março de 2023 (6).jpg','Fronteira','CC BY-SA 4.0'],
noronha:['Praia do Leão localizada em Fernando de Noronha.jpg','Rosana Antunes','CC0'],
ilhabela:['Fotos da praia grande em ilhabela.jpg','Clonefox19','CC BY-SA 4.0'],
puntadeleste:['Playa Mansa, Punta del Este.JPG','Rosina Peixoto','CC BY-SA 4.0'],
ayampe:['Ayampe ecuador.jpg','Andrawaag','CC0'],
burleigh:['Palm Beach Qld Surf Life Saving Club - Burleigh Heads National Park from Palm Beach Surf Life Saving Club 7th Avenue Palm Beach Queensland - photo John McPherson.jpg','John Robert McPherson','CC BY-SA 4.0'],
byronbay:['Wategos Beach panorama.jpg','BobTanGo','CC BY 4.0'],
manly:['Manly Beach, Sydney, March 2023, 01.jpg','Kgbo','CC BY-SA 4.0'],
ningaloo:['00 0865 Ningaloo Reef, Western Australia.jpg','W. Bulach','CC BY-SA 4.0'],
piha:['Surfers at Piha Beach (7187483494).jpg','Simon_sees from Australia','CC BY 2.0'],
shipwreck:['Shipwreck Bay.JPG','Gadfium','Domaine public'],
restaurants:['Malolo Barrier Reef 3.jpg','Maksym Kozlenko','CC BY-SA 4.0'],
borabora:['DL2A Four Seasons Bora Bora 20.jpg','Didierlefort','CC BY-SA 3.0'],
jardimdomar:['Madeira-Paul do Mar-view to Jardin do Mar-01ASD.jpg','Asurnipal','CC BY-SA 4.0'],
santabarbara:['Praia de Santa Barbara - panoramio.jpg','JCNazza','CC BY 3.0'],
capomannu:['Surfing in Capo Mannu.png','Japs 88','CC BY-SA 3.0'],
isolabella:['Isola Bella, Taormina, Sicily, Italy (4894718318).jpg','Michal Osmenda','CC BY-SA 2.0'],
zlatnirat:['Famous beach on Brac island near the town of Bol (20125195098).jpg','Jeroen Komen','CC BY-SA 2.0'],
naxos:['Naxos Mikri Vigla 2025-06-18 0824 wing surfing kitesurfing.jpg','Tsui','CC BY-SA 4.0'],
hossegor:['Surf at Hossegor.jpg','MarkYourWaves Surf','CC BY-SA 2.0'],
latorche:['Pointe de la Torche, Kitsurf et éoliennes (9600567164).jpg','Jeanne Menjoulet','CC BY 2.0'],
lacanau:['Lacanau-ocean plage 2013(02).JPG','Azotte','CC BY-SA 3.0'],
quiberon:['Quiberon - Plage (1).jpg','Remi Jouan','CC BY-SA 3.0'],
biarritz:['Surfeurs à Biarritz.jpg','Vorlod','CC BY-SA 4.0'],
anglet:['Plage de Marinella.jpg','Christian David','CC BY-SA 4.0'],
seignosse:['Plage des Estagnots.jpg','Seignossetourism','CC BY-SA 4.0'],
capbreton:['Coastal dune of Capbreton protected by herbs.jpg','Tangopaso','Domaine public'],
lafitenia:['Saint-Jean-de-Luz - Colline Sainte-Barbe - Vue sur les plages.jpg','Romainbehar','CC0'],
sauveterre:['Plage de Sauveterre (Olonne-sur-Mer).JPG','Florian Pépellin','CC BY-SA 3.0'],
guethary:['Plage de Parlementia.jpg','Txapisotegi','CC BY-SA 4.0'],
latranche:['Img-5399 - La Tranche-sur-mer - L\'Embarcadère (spot de surf).jpg','Eggvert','CC BY-SA 4.0'],
lapalue:['Pano baie Pen Hir.jpg','Berrucomons','CC BY-SA 3.0'],
lapalmyre:['Plage de Pontaillac.jpg','Patrice78500','CC BY-SA 4.0'],
penhors:['Vagues de penhors.jpg','RLaennec6','CC BY-SA 4.0'],
mimizan:['Mimizan les plages (7).jpg','Pierre-André Leclercq','CC BY-SA 4.0'],
capferret:['Sunrise Cap Ferret Banc du Toulinguet - Arcachon - Océan Atlantique - Picture Image Photography - Sunset - Coucher de soleil - Dune du pilat pyla - Banc d\'arguin water eau vagues waves beach plage sky colors red yellow (14501089751).jpg','Grand Parc Bordeaux','CC BY 2.0'],
bidart:['Plage de Bidart.jpg','Anne-Liam','CC BY-SA 4.0'],
nazare:['Praia do Norte beach - High waves - Nazaré - Portugal (27553300758).jpg','Luis Ascenso','CC BY 2.0'],
supertubos:['Surfer in Supertubos.JPG','Jpjorge','CC BY-SA 3.0'],
ericeira:['Surf - Flickr - Mario Bertocchi.jpg','Mario Bertocchi','CC BY 2.0'],
mundaka:['Ría de Mundaka.jpg','Bambarin77','CC BY-SA 4.0'],
thurso:['Surf in Thurso East.jpg','Wikimedia Commons','CC0'],
bundoran:['Atlantic waves, Tullan Strand - geograph.org.uk - 7116089.jpg','N Chadwick','CC BY-SA 2.0'],
rodiles:['Playa de Rodiles y Ría de Villaviciosa desde el Monte Rodiles en Asturias.jpg','Bermiego','CC BY-SA 4.0'],
somo:['Playa de El Puntal 04.jpg','Luis Fermín Turiel Peredo','CC BY-SA 4.0'],
zarautz:['Zarautzko surf sunset.JPG','ElviraOliver','CC BY-SA 3.0'],
pantin:['Praia de Pantín, Valdoviño 02.jpg','Amador Loureiro','CC BY-SA 2.0'],
anchorpoint:['Sunset on the Taghazout beach.jpg','Darymaister','CC BY-SA 4.0'],
lasanta:['Blick vom Mirador de El Risco de Famara auf den Playa de Famara und die Urbanización Famara, Lanzarote.jpg','GerritR','CC BY-SA 4.0'],
mavericks:['Mavericks Surf Contest 2010.jpg','Jacobovs','CC BY-SA 3.0'],
pipeline:['Surfing At Pipeline (52976752).jpeg','Andreas Winter','CC BY 3.0'],
trestles:['Distant surfer watched from the rocks (Unsplash).jpg','Jeremy Bishop','CC0'],
santateresa:['Fishermen at Sunset, Playa Santa Teresa, Costa Rica.jpg','Christopher Crouzet','CC BY-SA 4.0'],
puerto:['Surf at Sunset - Zicatela Beach - Puerto Escondido - Oaxaca - Mexico (6533419239).jpg','Adam Jones','CC BY-SA 2.0'],
malibu:['Beach Scene at Malibu Lagoon - Greater Los Angeles, CA - USA - 03 (6930664221).jpg','Adam Jones','CC BY-SA 2.0'],
jbay:['JBay-Surfing at supertubes-001.jpg','NJR ZA','CC BY-SA 3.0'],
chicama:['Puerto Chicama, Peru - waves.jpg','Henry Spencer','CC BY 2.0'],
puntadelobos:['Surfer at Punta de Lobos beach, Pichilemu.jpg','Gaspar Abrilot','CC BY-SA 2.0'],
bells:['Bells beach surfers.JPG','Chensiyuan','CC BY-SA 4.0'],
margaret:['2016 Margaret River Australia. Coastal view.jpg','Lasthib','CC BY-SA 4.0'],
snapper:['Rainbow Bay Surf Life Saving Club, Greenmount Beach, Rainbow Bay, Queensland.jpg','Chris Olszewski','CC BY-SA 4.0'],
uluwatu:['Nyangnyangbeach.jpg','Burmesedays','CC BY-SA 4.0'],
cloudbreak:['Malolo Barrier Reef 1.jpg','Maksym Kozlenko','CC BY-SA 4.0'],
padang:['Quiet Water of Padang Beach, Bali.jpg','Christine Anggeline','CC BY-SA 4.0'],
floripa:['Joaquina Surfing Beach, Florianópolis, Santa Catarina (03 janeiro 2004).jpg','Wikimedia Commons','CC BY-SA 2.5'],
teahupoo:['La horde - Surfers riding a wave in Paea, Tahiti.jpg','Brigitte Bourger','CC BY-SA 4.0'],
puntaroca:['PLAYA SAN DIEGO, LA LIBERTAD, EL SALVADOR. - panoramio.jpg','feinteriano','CC BY-SA 3.0'],
montanita:['PlayaDeMontañita.jpg','Andrew Magill','CC BY 2.0'],
saquarema:['Saquarema - Paraíso do Surf - Rio de Janeiro (15122235327).jpg','Marinelson Almeida','CC BY 2.0'],
raglan:['View west towards Manu Bay, Raglan.jpg','Pseudopanax','Domaine public'],
mardelplata:['Surf en Mardel - panoramio.jpg','Marcelo Raidan','CC BY-SA 3.0'],
arica:['Playa Lisera.JPG','Andrea021','CC BY-SA 3.0'],
lobitos:['Henry Espinoza Panta smashing a wave at Lobitos.jpg','Freddy Sinarahua','CC BY-SA 4.0'],
shonan:['Sunny December 2023, Katase Nishihama beach, seen from Enoshima Aquarium.jpg','Syced','CC0'],
arugam:['Arugam Waves (238816201).jpeg','Etienne Boulanger','CC BY 3.0'],
itacare:['Itacaré praia.JPG','LíviaBuhring','CC BY-SA 3.0'],
waikiki:['Waikiki Beach View From Diamond Head (15544503191).jpg','Prayitno','CC BY 2.0'],
cloud9:['Catching the Wave.jpg','Michael Angelo Luna','CC BY-SA 4.0'],
unstad:['Wave Lofoten Island.jpg','Scosse','CC BY 4.0'],
skeletonbay:['Pobřeží koster, Atlantický oceán, Skeleton Coast - Namibia - panoramio.jpg','Pavel Špindler','CC BY 3.0'],
mentawai:['Surfers explore the mentawai islands.jpg','Colm Surf','CC BY 2.0'],
dungeons:['Hout Bay views (33514449038).jpg','Raita Futo','CC BY 2.0'],
bluehole_belize:['Half moon caye im Lighthouse Reef, Belize (21628239563).jpg','dronepicr','CC BY 2.0'],
sipadan:['Barrel Sponge (Xestospongia testudinaria) (8500727224).jpg','Bernard Dupont','CC BY-SA 2.0'],
rasmohammed:['Shark Observatory Bay 2024-08-31.jpg','The Cosmonaut','CC BY-SA 2.5'],
thistlegorm:['Thistlegorm-red-sea-mar-rojo-mer-rouge (3).jpg','Wikicomman','CC BY-SA 4.0'],
tulamben:['Magnificent Sea Anemone, USAT Liberty Wreck, Tulamben, Bali, Indonesia imported from iNaturalist photo 428500231.jpg','Bernard Dupont','CC BY-SA 4.0'],
greatbarrier:['Coral Outcrop Flynn Reef.jpg','Toby Hudson','CC BY-SA 3.0'],
silfra:['SCUBA Silfra.jpg','Thomei08','Domaine public'],
cenote_dosojos:['Diving the Cenotes in Yucatan, Mexico (41791832870).jpg','dronepicr','CC BY 2.0'],
medes:['Violescent sea-whip (Paramuricea clavata), Ferranelles, Medes Islands, Spain.jpg','Jouni Kuisma','CC BY-SA 4.0'],
portcros:['A view of one of the famous beach of Port-Cros island.jpg','Audric B.','CC BY-SA 4.0'],
calanques:['Cap Morgiou-Calanques de Cassis.jpg','Tobi 87','CC BY-SA 3.0'],
richelieu:['African Lionfish, Richelieu Rock, Andaman Sea, Thailand imported from iNaturalist photo 177289494.jpg','jeyre','CC BY 4.0'],
rajaampat:['20170909 Kri island beach.jpg','Lasthib','CC BY-SA 4.0'],
galapagos:['Galápagos sealion- underwater (35566878280).jpg','Derek Keats','CC BY 2.0'],
maldives:['Sunset at Lagoon, Emboodhoo, Male, Maldives.jpg','Alexandre Faux','CC0'],
hanauma:['Hanauma Bay, Oahu, Hawaii, USA2.jpg','Diego Delso','CC BY-SA 3.0'],
bonaire:['Bonaire-sorob-surf.jpg','Balou46','CC BY-SA 4.0'],
tarifa:['Kite surf al final de playa los Lances ,Tarifa.jpg','Juan Vladimir Paraschuk','CC BY-SA 4.0'],
dakhla:['Kitesurf-Dakhla-Morocco (1).JPG','Nomadz','CC BY-SA 3.0'],
cabarete:['Cabarete beach - panoramio.jpg','Maris Teteris','CC BY 3.0'],
lemorne:['Le Morne Beach in Mauritius, a view from the southwest (53698123904).jpg','dronepicr','CC BY 2.0'],
cumbuco:['Kites Surfes na Barra do Cauípe Caucaia-CE.jpg','Leonardo Ibiapina Paz','CC BY-SA 4.0'],
essaouira:['Kite surfing, Essaouira, Morocco.jpg','Goldfinchshuffle','CC BY-SA 4.0'],
lafranqui:['Leucate-La Franqui (Aude), view from the cliffs.jpg','Gerbil','CC BY-SA 3.0'],
jericoacoara:['Wind Surf em Jericoacoara.jpg','Bernardino F. Palheta Dacio','CC BY-SA 4.0'],
hookipa:['Garrett Lisi surfing.jpg','Cjean42','CC BY-SA 3.0'],
pozo:['Windsurfer in Pozo Izquierdo.jpg','Nathalie Cools','CC BY-SA 4.0'],
gardalake:['Gardasee-Surfer.jpg','Otto Domes','CC BY-SA 4.0'],
hoodriver:['Windsurfing at Hood River, Columbia River Gorge National Scenic Area - 88.jpg','USDA Forest Service','Domaine public'],
annecy:['Swans @ Albigny beach @ Lac d\'Annecy (36676306426).jpg','Guilhem Vellut','CC BY 2.0'],
verdon:['Aiguines Gorges du Verdon Vue du Lac de Sainte-Croix 01.jpg','Zairon','CC BY 4.0'],
glenan:['Glénans 025.jpg','Ackles29','CC BY-SA 3.0'],
capri:['Marina Piccola Beach.jpg','Abxbay','CC BY-SA 4.0'],
palombaggia:['Aerial view of the Tyrrhenian Sea at Palombaggia Beach, Corsica, France (52723806786).jpg','dronepicr','CC BY 2.0'],
praia_marinha:['Praia da Marinha-Algarve-Portugal.jpg','Tobi 87','CC BY-SA 3.0'],
navagio:['Navagio Beach aerial Zakynthos Greece (46470564281).jpg','dronepicr','CC BY 2.0'],
anse_source:['Beach Anse Source d\'Argent aerial La Digue Seychelles (39616965691).jpg','dronepicr','CC BY 2.0'],
whitehaven:['Whitehaven Beach - panoramio.jpg','dnatheist','CC BY 3.0'],
wissant:['Wissant, Eté2016 la plage.jpg','Pierre-André Leclercq','CC BY-SA 4.0'],
letouquet:['Le Touquet-Paris-Plage - Panorama2.JPG','Wikimedia Commons','CC BY-SA 3.0'],
hardelot:['Hardelot plage2014.jpg','Bateloupreaut','CC BY-SA 3.0'],
wimereux:['Splashing water wavesin Wimereux 2014 12 25 vague 4722.JPG','Lamiot','CC BY-SA 4.0'],
berck:['Berck-sur-Mer.jpg','Glaurent','CC BY 3.0'],
malolesbains:['Malo-les-Bains plage R01.jpg','Marc Ryckaert','CC BY 3.0'],
lehavre:['Wave on the beach of Le Havre (France).jpg','Philippe Alès','CC BY-SA 3.0'],
etretat:['Étretat, falaise et porte d\'Aval, arche et aiguille, plage, août 2015.jpg','Jbdeparis','CC BY-SA 4.0'],
dieppe:['LA PLAGE DE DIEPPE (6203071130).jpg','Patrick Janicek','CC BY 2.0'],
siouville:['Siouville surf.jpg','Clément Pillot','CC BY-SA 3.0'],
vauville:['Vauville - Panorama depuis le site des Pierres Pouquelées (Vue sur les dunes de Biville).jpg','Xfigpower','CC BY 4.0'],
hauteville:['Hauteville-sur-Mer - Panorama de la plage.jpg','Xfigpower','CC BY-SA 4.0'],
granville:['Vagues sur le Plat Gousset, Granville lors de la tempête Miguel 02.jpg','Agnès Téziste','CC0'],
saintmalo:['View of Saint-Malo Beach 04.jpg','Jsamwrites','CC BY-SA 4.0'],
saintlunaire:['StLunairePlage.JPG','LeCardinal','CC BY 3.0'],
erquy:['Cotes-D\'Armor Erquy Plage - panoramio.jpg','René Boulay','CC BY-SA 3.0'],
perros:['Plage de Trestraou - Perros-Guirec, France - August 16, 2018.jpg','Giorgio Galeotti','CC BY 4.0']};
function spotPhotoUrl(id,w){if(window.SPOT_PHOTOS&&SPOT_PHOTOS[id])return SPOT_PHOTOS[id].src;var p=WPHOTO[id];if(!p)return null;
  return 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(p[0].replace(/ /g,'_'))+'?width='+(w||480);}
function spotPhotoCredit(id){if(window.SPOT_PHOTOS&&SPOT_PHOTOS[id]){var local=SPOT_PHOTOS[id];return local.author+' · '+local.license+' — Wikimedia Commons';}var p=WPHOTO[id];
  return p?(p[1]+' · '+p[2]+' — Wikimedia Commons'):'';}

const SCENIC={
  tropical:['tropical,beach,lagoon','island,beach,palmtrees','turquoise,sea,coast','coralreef,island','lagoon,ocean,tropical','beach,palms,sunset','paradise,beach,sea'],
  temperate:['beach,coastline,ocean','seascape,coast,sea','coast,cliffs,ocean','beach,dunes,sea','ocean,horizon,beach','coastline,sunset,sea','surf,beach,landscape','bay,coast,sea'],
  cold:['rugged,coast,sea','cliffs,ocean,wild','rocky,coastline,sea','wild,beach,coast','sea,cliffs,clouds','coast,storm,waves','fjord,sea,coast']
};
function spotPhotoTags(s){
  if(PHOTO_TAGS[s.id])return PHOTO_TAGS[s.id];
  var sp=spotSports(s)[0];
  var reef=/(récif|recif|reef|corallien|corail|lagon|lagoon)/i.test((s.desc||'')+' '+((typeof FAUNA!=='undefined'&&FAUNA[s.id])||''));
  var t=parseInt(s.temp)||16;
  var bucket=(sp==='snorkeling'||sp==='plongee'||t>=23||reef)?'tropical':(t<15?'cold':'temperate');
  var arr=SCENIC[bucket];
  return arr[spotHash(s.id)%arr.length];
}
function spotHash(id){var n=0;for(var i=0;i<id.length;i++)n=(n*31+id.charCodeAt(i))%100000;return n;}
function spotLock(id){return (PHOTO_LOCK[id]!=null)?PHOTO_LOCK[id]:spotHash(id);}
function countryEmergency(loc){
  loc=loc.toLowerCase();var has=function(k){return loc.indexOf(k)>=0;};
  if(has('hawa')||has('usa')||has('états-unis')||has('etats-unis')||has('californie')||has('oregon')) return {emergency:'911',sea:'US Coast Guard : 911 / VHF 16',call:'911'};
  if(has('australie')) return {emergency:'000',sea:'Secours : 000 (112 depuis un mobile)',call:'000'};
  if(has('nouvelle-zélande')||has('new zealand')) return {emergency:'111',sea:'Garde-côtes : 111',call:'111'};
  if(has('brésil')||has('bresil')) return {emergency:'190',sea:'SAMU : 192 · pompiers 193',call:'190'};
  if(has('mexique')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('pérou')||has('perou')) return {emergency:'105',sea:'Pompiers/sauvetage : 116',call:'105'};
  if(has('chili')) return {emergency:'131',sea:'Sauvetage maritime : 137',call:'131'};
  if(has('argentine')) return {emergency:'911',sea:'Préfecture navale : 106',call:'911'};
  if(has('équateur')||has('equateur')||has('galápagos')||has('galapagos')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('salvador')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('maroc')) return {emergency:'112',sea:'SAMU : 15 · 112 depuis un mobile',call:'112'};
  if(has('afrique du sud')) return {emergency:'112',sea:'NSRI : 112 (mobile) / 10111',call:'112'};
  if(has('namibie')) return {emergency:'112',sea:'Urgences : 112',call:'112'};
  if(has('maldives')) return {emergency:'102',sea:'Garde-côtes : 191',call:'102'};
  if(has('maurice')) return {emergency:'999',sea:'Garde-côtes : 114',call:'999'};
  if(has('fidji')||has('fiji')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('seychelles')) return {emergency:'999',sea:'Urgences : 999',call:'999'};
  if(has('japon')) return {emergency:'118',sea:'Garde-côtes (Japon) : 118 · ambulance 119',call:'118'};
  if(has('sri lanka')) return {emergency:'119',sea:'Garde-côtes : 1909',call:'119'};
  if(has('philippines')) return {emergency:'911',sea:'Garde-côtes : 911',call:'911'};
  if(has('dominicaine')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('bonaire')) return {emergency:'911',sea:'Urgences : 911',call:'911'};
  if(has('indonésie')||has('indonesie')||has('bali')) return {emergency:'112',sea:'Basarnas (secours mer) : 115',call:'112'};
  if(has('thaïlande')||has('thailande')) return {emergency:'191',sea:'Police touristique : 1155',call:'191'};
  if(has('royaume-uni')||has('écosse')||has('ecosse')||has('angleterre')) return {emergency:'999',sea:'HM Coastguard : 999 / VHF 16',call:'999'};
  if(has('irlande')) return {emergency:'112',sea:'Garde-côtes : 112 / VHF 16',call:'112'};
  if(has('france')||has('tahiti')||has('corse')||has('réunion')) return {emergency:'112',sea:'Secours en mer : 196 (ou VHF 16)',call:'112'};
  if(has('portugal')||has('espagne')||has('italie')||has('grèce')||has('grece')||has('islande')||has('norvège')||has('norvege')) return {emergency:'112',sea:'Secours en mer : 112 / VHF 16',call:'112'};
  return {emergency:'112',sea:'112 fonctionne depuis un mobile dans la plupart des pays',call:'112'};
}
var SPORT_VERB={surf:'surfé',bodyboard:'ridé',baignade:'nagé',paddle:'pagayé',kayak:'pagayé',snorkeling:'fait du snorkeling',plongee:'plongé',kitesurf:'kité',windsurf:'navigué'};

/* ================= FAUNE & FLORE ================= */
var BIOZONE={"manche_bzh":{"l":"Manche, mer du Nord & Bretagne","s":"Eaux fraîches à fort marnage, fonds de sable et de roche couverts d'algues.","sp":[["Bar européen","Dicentrarchus labrax","p","","Chasse dans l'écume et les courants de marée : les surfeurs le croisent souvent au lever du jour."],["Lieu jaune","Pollachius pollachius","p","","Poisson de roche curieux, fréquent autour des épaves et des tombants bretons."],["Vieille commune","Labrus bergylta","p","","Grosse labre colorée des champs de laminaires, chacune tient un territoire."],["Phoque veau-marin","Phoca vitulina","m","*","Colonies en baie de Somme et dans les Sept-Îles ; à observer de loin, sans l'approcher."],["Grand dauphin","Tursiops truncatus","m","*","Groupes sédentaires en Normandie et autour des Glénan."],["Araignée de mer","Maja squinado","i","","Migre vers la côte au printemps pour muer ; emblème des casiers bretons."],["Méduse boussole","Chrysaora hysoscella","i","!","Reconnaissable à ses 16 rayons bruns : urticante, on ne la touche pas."],["Laminaire digitée","Laminaria digitata","a","","Forme les forêts sous-marines découvertes aux grandes marées."],["Fucus vésiculeux","Fucus vesiculosus","a","","L'algue à vésicules qui craque sous le pied sur les rochers de l'estran."]]},"atl_iber":{"l":"Golfe de Gascogne & côtes ibériques","s":"Océan ouvert et remontées d'eau froide riches en plancton : beaucoup de vie au large.","sp":[["Bar européen","Dicentrarchus labrax","p","","Suit les bancs de sable et les baïnes, là où la vague brasse la nourriture."],["Sardine","Sardina pilchardus","p","","Les bancs argentés attirent dauphins, thons et oiseaux plongeurs."],["Maigre","Argyrosomus regius","p","","Grand poisson des estuaires landais, capable de grogner avec sa vessie natatoire."],["Dauphin commun","Delphinus delphis","m","*","Le plus fréquent du golfe ; on le voit chasser en groupes serrés."],["Poisson-lune","Mola mola","p","","Vient se chauffer à plat en surface les jours calmes : impressionnant mais inoffensif."],["Vive","Echiichthys vipera","p","!","Enfouie dans le sable, son épine dorsale est très douloureuse : traîne les pieds en entrant."],["Physalie","Physalia physalis","i","!","La « galère portugaise » arrive avec le vent d'ouest : brûlure sévère, ne jamais toucher."],["Oyat","Ammophila arenaria","a","*","L'herbe des dunes qui fixe le sable : marcher dessus détruit la dune."]]},"medit":{"l":"Méditerranée","s":"Mer chaude et claire, pauvre en plancton mais riche en espèces, autour des herbiers.","sp":[["Mérou brun","Epinephelus marginatus","p","*","Sauvé par la protection depuis 1980 ; curieux, il vient souvent voir les plongeurs."],["Saupe","Sarpa salpa","p","","Bancs dorés qui broutent l'herbier de posidonie en plein jour."],["Girelle","Coris julis","p","","Change de sexe et de couleur en grandissant : les mâles sont bleu-orange."],["Rascasse rouge","Scorpaena scrofa","p","!","Immobile et parfaitement camouflée sur la roche : ses épines sont venimeuses."],["Tortue caouanne","Caretta caretta","r","*","Pond de plus en plus souvent sur les plages du nord-ouest méditerranéen."],["Poulpe commun","Octopus vulgaris","i","","Change de couleur et de texture en une seconde ; il bouche son trou avec des coquilles."],["Grande nacre","Pinna nobilis","i","*","Le plus grand coquillage de Méditerranée, décimé depuis 2016 par un parasite."],["Posidonie","Posidonia oceanica","a","*","Ce n'est pas une algue mais une plante à fleurs : ses herbiers abritent 25 % des espèces."]]},"macaro":{"l":"Canaries & Macaronésie","s":"Îles volcaniques en plein Atlantique : eaux tièdes et tombants noirs.","sp":[["Ange de mer","Squatina squatina","p","*","Requin plat en danger critique ailleurs, encore régulier sur les fonds sableux canariens."],["Mérou des Canaries","Mycteroperca fusca","p","","Endémique de Macaronésie, souvent posé à l'entrée des grottes."],["Poisson-perroquet","Sparisoma cretense","p","","Broute la roche et fabrique du sable en la digérant."],["Tortue caouanne","Caretta caretta","r","*","Les juvéniles traversent l'Atlantique et grandissent autour des îles."],["Raie pastenague","Taeniura grabata","p","!","Posée dans le sable ; son dard est défensif, on la contourne sans la survoler."],["Dauphin tacheté","Stenella frontalis","m","*","Groupes joueurs au large, souvent visibles depuis les spots exposés."],["Cystoseire","Gongolaria abies-marina","a","","Petites forêts brunes des zones battues, en fort déclin aux Canaries."]]},"atl_nord":{"l":"Atlantique nord froid","s":"Eau froide et très oxygénée : peu d'espèces, mais des forêts d'algues et de grands animaux.","sp":[["Phoque gris","Halichoerus grypus","m","*","Colonies bruyantes sur les îlots ; curieux, il suit parfois les surfeurs."],["Requin pèlerin","Cetorhinus maximus","p","*","Deuxième plus grand poisson du monde : il filtre le plancton, bouche grande ouverte."],["Macareux moine","Fratercula arctica","o","*","Niche en terrier sur les falaises d'avril à août."],["Lompe","Cyclopterus lumpus","p","","Se colle aux rochers par une ventouse ; le mâle garde les œufs."],["Orque","Orcinus orca","m","*","Populations résidentes en Norvège, qui suivent les bancs de harengs en hiver."],["Laminaire hyperboréenne","Laminaria hyperborea","a","","Bâtit de vraies forêts sous-marines, refuge de milliers de juvéniles."],["Anémone dahlia","Urticina felina","i","","Fixée dans les cuvettes, elle se couvre de graviers pour se camoufler."]]},"redsea":{"l":"Mer Rouge","s":"Mer chaude et très salée, bordée d'un récif corallien presque continu.","sp":[["Poisson-clown à trois bandes","Amphiprion bicinctus","p","","Endémique de mer Rouge, il vit dans une anémone qui ne le pique pas."],["Napoléon","Cheilinus undulatus","p","*","Peut dépasser 2 m ; espèce menacée, protégée en Égypte."],["Poisson-lion","Pterois volitans","p","!","Magnifique et immobile : ses rayons sont venimeux, on garde ses distances."],["Requin-baleine","Rhincodon typus","p","*","Filtreur inoffensif, de passage au printemps."],["Tortue verte","Chelonia mydas","r","*","Broute les herbiers ; ne jamais la toucher ni lui barrer la remontée."],["Murène géante","Gymnothorax javanicus","p","!","Bouche ouverte pour respirer, pas pour menacer — mais elle mord si on l'approche."],["Corail de feu","Millepora dichotoma","c","!","Ce n'est pas un vrai corail : le frôler provoque une brûlure durable."],["Acropore de table","Acropora spp.","c","*","Bâtisseur du récif, très sensible au réchauffement de l'eau."]]},"carib":{"l":"Caraïbes","s":"Eaux tièdes et transparentes : récifs, herbiers et mangroves imbriqués.","sp":[["Poisson-perroquet feu","Sparisoma viride","p","*","Un seul individu produit des centaines de kilos de sable blanc par an."],["Raie pastenague américaine","Hypanus americanus","p","!","Se pose dans le sable des lagons ; on entre en traînant les pieds."],["Tarpon","Megalops atlanticus","p","","Argenté et massif, il remonte respirer à la surface."],["Poisson-lion","Pterois volitans","p","!","Espèce invasive venue du Pacifique, chassée pour protéger le récif."],["Tortue imbriquée","Eretmochelys imbricata","r","*","Broute les éponges du récif ; en danger critique."],["Lambi","Lobatus gigas","i","*","Grand coquillage rose, surexploité et désormais réglementé."],["Corail corne d'élan","Acropora palmata","c","*","Bâtisseur des crêtes récifales, décimé depuis les années 1980."],["Herbier de thalassie","Thalassia testudinum","a","","Nurserie des juvéniles et garde-manger des tortues vertes."]]},"bresil":{"l":"Côtes du Brésil","s":"Longue façade tropicale : plages de sable, récifs bas et mangroves.","sp":[["Mérou géant","Epinephelus itajara","p","*","Peut atteindre 400 kg ; pêche interdite au Brésil depuis 2002."],["Poisson-chirurgien bleu","Acanthurus coeruleus","p","","Porte un scalpel articulé à la base de la queue."],["Tortue olivâtre","Lepidochelys olivacea","r","*","Pond en masse sur les plages du nord-est."],["Dauphin de Guyane","Sotalia guianensis","m","*","Petit dauphin côtier discret, sensible au dérangement."],["Baleine à bosse","Megaptera novaeangliae","m","*","Vient mettre bas d'août à novembre au large d'Abrolhos."],["Crabe violoniste","Leptuca spp.","i","","Le mâle agite une pince démesurée sur la vase des mangroves."],["Palétuvier rouge","Rhizophora mangle","a","*","Ses racines en arceaux servent de nurserie à tout le récif."]]},"pac_trop":{"l":"Pacifique tropical","s":"Îles volcaniques cernées de récifs frangeants, en pleine eau chaude.","sp":[["Tortue verte","Chelonia mydas","r","*","La honu hawaïenne se repose sur le sable : garder 3 m de distance est la règle."],["Poisson-cocher","Zanclus cornutus","p","","Museau long et nageoire en fouet, il picore le corail par deux."],["Baliste Picasso","Rhinecanthus rectangulus","p","","Le humuhumunukunukuāpuaʻa, poisson emblème d'Hawaï."],["Requin à pointes noires","Carcharhinus melanopterus","p","!","Timide et commun dans les lagons ; on sort calmement de l'eau s'il insiste."],["Raie manta","Mobula alfredi","p","*","Filtre le plancton ; ses taches ventrales identifient chaque individu."],["Phoque moine d'Hawaï","Neomonachus schauinslandi","m","*","Moins de 1 500 individus : l'approcher est interdit par la loi."],["Corail corne de cerf","Pocillopora spp.","c","*","Premier bâtisseur des récifs jeunes, très sensible au blanchissement."]]},"indo_pac":{"l":"Triangle de corail","s":"La zone la plus riche du monde : plus de 600 espèces de coraux à elle seule.","sp":[["Poisson-clown","Amphiprion ocellaris","p","","Toujours dans son anémone ; le plus gros du groupe devient femelle."],["Poisson-ange empereur","Pomacanthus imperator","p","","Le juvénile, bleu à spirales blanches, ne ressemble pas à l'adulte."],["Napoléon","Cheilinus undulatus","p","*","Espèce menacée par la pêche pour l'aquarium et la restauration."],["Requin de récif à pointes blanches","Triaenodon obesus","p","!","Se repose sous les patates de corail la journée ; inoffensif si on le laisse."],["Tortue imbriquée","Eretmochelys imbricata","r","*","Bec en bec d'aigle pour extraire les éponges du récif."],["Bénitier géant","Tridacna gigas","i","*","Jusqu'à 200 kg ; sa chair colorée abrite des algues symbiotiques."],["Nudibranche","Nembrotha spp.","i","","Limace de mer fluo : ses couleurs préviennent qu'elle est toxique."],["Acropore branchu","Acropora spp.","c","*","Construit la charpente du récif ; blanchit dès +1 °C prolongé."]]},"oc_indien":{"l":"Océan Indien occidental","s":"Atolls et lagons peu profonds, sur fond de sable corallien blanc.","sp":[["Raie manta océanique","Mobula birostris","p","*","Jusqu'à 7 m d'envergure ; se rassemble sur les stations de nettoyage."],["Requin-baleine","Rhincodon typus","p","*","Filtreur pacifique ; nager devant lui est interdit aux Maldives."],["Poisson-papillon","Chaetodon spp.","p","","Vit en couple fidèle, indicateur de la santé du récif."],["Tortue verte","Chelonia mydas","r","*","Vient brouter les herbiers du lagon à marée haute."],["Murène ruban","Rhinomuraena quaesita","p","","Naît mâle noir, devient bleu puis femelle jaune."],["Poisson-pierre","Synanceia verrucosa","p","!","Le poisson le plus venimeux du monde, invisible sur le fond : ne jamais poser le pied nu."],["Corail cerveau","Platygyra spp.","c","*","Colonies massives dont les sillons évoquent un cerveau."]]},"pac_est":{"l":"Pacifique est tropical","s":"Côtes chaudes bordées de mangroves, balayées par des remontées d'eau riche.","sp":[["Raie mobula","Mobula munkiana","p","*","Saute hors de l'eau en groupes de plusieurs centaines."],["Tortue olivâtre","Lepidochelys olivacea","r","*","Pontes massives (arribadas) sur quelques plages seulement."],["Requin-marteau halicorne","Sphyrna lewini","p","!","Se rassemble en bancs au large ; espèce en danger critique."],["Dauphin tacheté pantropical","Stenella attenuata","m","*","Suit les bancs de thons, souvent en groupes de plusieurs centaines."],["Baleine à bosse","Megaptera novaeangliae","m","*","Deux populations s'y croisent, l'une du nord, l'autre du sud."],["Crocodile américain","Crocodylus acutus","r","!","Présent dans certains estuaires : se renseigner localement avant de se baigner."],["Palétuvier","Rhizophora mangle","a","*","La mangrove filtre l'eau et sert de nurserie au récif voisin."]]},"galapagos":{"l":"Galápagos","s":"Trois courants s'y rencontrent : une faune unique au monde, très protégée.","sp":[["Iguane marin","Amblyrhynchus cristatus","r","*","Le seul lézard au monde qui broute des algues en plongée."],["Otarie des Galápagos","Zalophus wollebaeki","m","*","Joueuse sous l'eau ; les mâles territoriaux se tiennent à distance."],["Manchot des Galápagos","Spheniscus mendiculus","o","*","Le seul manchot vivant au nord de l'équateur."],["Requin-marteau halicorne","Sphyrna lewini","p","!","Bancs de plusieurs centaines à Darwin et Wolf."],["Tortue verte du Pacifique","Chelonia mydas agassizii","r","*","Se nourrit dans les baies peu profondes de l'archipel."],["Poisson-lune à tête de mouton","Mola alexandrini","p","","Remonte des eaux froides pour se faire nettoyer en surface."],["Cormoran aptère","Phalacrocorax harrisi","o","*","A perdu l'usage du vol : il chasse uniquement en plongée."]]},"humboldt":{"l":"Courant de Humboldt","s":"Une des mers les plus productives du globe : eau froide, vie foisonnante.","sp":[["Anchois du Pérou","Engraulis ringens","p","","Le poisson le plus pêché de la planète ; base de toute la chaîne."],["Otarie à crinière","Otaria flavescens","m","*","Colonies bruyantes sur les rochers ; les mâles pèsent 300 kg."],["Manchot de Humboldt","Spheniscus humboldti","o","*","Niche dans le guano des îles ; population en déclin."],["Dauphin obscur","Lagenorhynchus obscurus","m","*","Acrobate, il enchaîne les sauts en groupes serrés."],["Poisson-lune","Mola mola","p","","Attiré par les eaux riches en méduses."],["Chinchorro géant","Macrocystis pyrifera","a","*","Le kelp géant pousse jusqu'à 50 cm par jour et abrite tout l'écosystème."],["Loutre de mer du Chili","Lontra felina","m","*","Le « chungungo », plus petite loutre marine du monde, très menacée."]]},"benguela":{"l":"Afrique australe","s":"Remontées d'eau glacée du Benguela : forêts de kelp et gros prédateurs.","sp":[["Otarie à fourrure du Cap","Arctocephalus pusillus","m","*","Colonies de dizaines de milliers d'individus le long de la côte."],["Grand requin blanc","Carcharodon carcharias","p","!","Présent au large ; se renseigner sur les consignes locales et les shark spotters."],["Baleine franche australe","Eubalaena australis","m","*","Vient mettre bas près du bord de juin à novembre."],["Manchot du Cap","Spheniscus demersus","o","*","En danger : la population a chuté de plus de 95 % en un siècle."],["Dauphin commun à long bec","Delphinus capensis","m","*","Suit la « sardine run », l'une des plus grandes migrations du monde."],["Kelp du Cap","Ecklonia maxima","a","","Ses stipes flottants forment des forêts denses le long des côtes rocheuses."],["Homard du Cap","Jasus lalandii","i","","Vit dans le kelp ; sa pêche est strictement encadrée."]]},"cal_kelp":{"l":"Californie","s":"Eau froide et forêts de kelp géant, parmi les habitats les plus riches du Pacifique.","sp":[["Loutre de mer","Enhydra lutris","m","*","Casse les oursins sur son ventre ; sans elle, le kelp disparaît."],["Otarie de Californie","Zalophus californianus","m","*","Bruyante sur les pontons, très rapide sous l'eau."],["Garibaldi","Hypsypops rubicundus","p","*","Poisson orange vif, emblème marin de Californie et protégé."],["Grand requin blanc","Carcharodon carcharias","p","!","Les juvéniles fréquentent les eaux peu profondes en été."],["Baleine grise","Eschrichtius robustus","m","*","Passe deux fois par an le long de la côte lors de sa migration."],["Kelp géant","Macrocystis pyrifera","a","*","Peut dépasser 30 m et pousser 50 cm par jour."],["Oursin violet","Strongylocentrotus purpuratus","i","","En surnombre, il rase les forêts de kelp et crée des « déserts d'oursins »."]]},"aus_nz":{"l":"Australie & Nouvelle-Zélande","s":"Des récifs tropicaux au nord aux forêts d'algues tempérées au sud.","sp":[["Dragon de mer feuillu","Phycodurus eques","p","*","Endémique du sud australien ; camouflé en algue, c'est le mâle qui porte les œufs."],["Requin-baleine","Rhincodon typus","p","*","Rassemblement de mars à juillet à Ningaloo."],["Dauphin de Nouvelle-Zélande","Cephalorhynchus hectori","m","*","Le plus petit dauphin marin du monde, en danger."],["Requin bouledogue","Carcharhinus leucas","p","!","Remonte dans les estuaires troubles : on évite de s'y baigner à l'aube."],["Cuboméduse","Chironex fleckeri","i","!","Au nord tropical d'octobre à mai : combinaison anti-méduse obligatoire."],["Otarie à fourrure","Arctocephalus forsteri","m","*","Recolonise peu à peu les côtes néo-zélandaises."],["Kelp taureau","Durvillaea antarctica","a","","Lanières coriaces qui encaissent les houles les plus violentes."]]},"japon":{"l":"Japon","s":"Rencontre du courant chaud Kuroshio et du courant froid Oyashio.","sp":[["Sériole du Japon","Seriola quinqueradiata","p","","Prédateur rapide qui longe les caps et les pointes exposées."],["Tortue caouanne","Caretta caretta","r","*","Le Japon accueille les principales pontes du Pacifique nord."],["Dauphin d'Indo-Pacifique","Tursiops aduncus","m","*","Groupes résidents autour des îles du sud."],["Poisson-lune","Mola mola","p","","Le Kuroshio en amène régulièrement près des côtes."],["Crabe-araignée géant","Macrocheira kaempferi","i","","Jusqu'à 3,8 m d'envergure : le plus grand arthropode vivant."],["Wakamé","Undaria pinnatifida","a","","Algue cultivée depuis des siècles, devenue invasive ailleurs dans le monde."]]},"atl_sud":{"l":"Patagonie atlantique","s":"Plateau continental froid et venteux, riche en mammifères marins.","sp":[["Baleine franche australe","Eubalaena australis","m","*","Vient se reproduire dans le golfe Nuevo de juin à décembre."],["Orque","Orcinus orca","m","*","Célèbre pour s'échouer volontairement pour attraper les jeunes otaries."],["Manchot de Magellan","Spheniscus magellanicus","o","*","Colonies de plusieurs centaines de milliers de couples."],["Otarie à crinière","Otaria flavescens","m","*","Présente toute l'année sur les plages de galets."],["Dauphin de Commerson","Cephalorhynchus commersonii","m","*","Noir et blanc, il joue volontiers dans les vagues d'étrave."],["Kelp géant","Macrocystis pyrifera","a","*","Forme des forêts jusqu'au détroit de Magellan."]]},"lac_alpin":{"l":"Lac d'eau douce","s":"Eau douce, froide et claire : rien à voir avec la mer, une faune bien à elle.","sp":[["Omble chevalier","Salvelinus alpinus","p","*","Poisson des lacs profonds et froids, indicateur d'une eau de qualité."],["Perche commune","Perca fluviatilis","p","","Chasse en bandes près des pontons et des herbiers."],["Brochet","Esox lucius","p","","Embusqué dans les roselières, c'est le grand prédateur du lac."],["Corégone","Coregonus lavaretus","p","","La « féra » des lacs alpins, pêchée depuis toujours."],["Écrevisse à pattes blanches","Austropotamobius pallipes","i","*","Espèce protégée, très sensible à la pollution."],["Roseau commun","Phragmites australis","a","*","La roselière filtre l'eau et abrite les nichées : on ne la piétine pas."],["Characée","Chara spp.","a","","Tapis d'herbiers immergés qui signalent une eau pauvre en nutriments."]]},"cenote":{"l":"Cénote (eau douce souterraine)","s":"Puits calcaire alimenté par une rivière souterraine : eau douce, claire et fraîche.","sp":[["Tétra aveugle","Astyanax mexicanus","p","*","La forme cavernicole a perdu les yeux et la pigmentation."],["Poisson-chat des cénotes","Rhamdia guatemalensis","p","","Se repère aux barbillons dans l'obscurité totale."],["Crevette de cénote","Typhlatya spp.","i","*","Translucide et minuscule, endémique du Yucatán."],["Molly du Yucatán","Poecilia velifera","p","","Vit dans la couche d'eau douce, au-dessus de l'eau salée."],["Racines aériennes","Ficus spp.","a","","Descendent parfois de 20 m pour atteindre l'eau."]]},"riviere":{"l":"Fleuve (eau douce)","s":"Eau douce courante, avec des poissons migrateurs qui font l'aller-retour vers l'océan.","sp":[["Saumon quinnat","Oncorhynchus tshawytscha","p","*","Le plus grand saumon du Pacifique ; remonte le fleuve pour se reproduire."],["Esturgeon blanc","Acipenser transmontanus","p","*","Peut vivre plus de 100 ans et dépasser 6 m."],["Truite arc-en-ciel","Oncorhynchus mykiss","p","","La forme migratrice, la steelhead, descend jusqu'à la mer."],["Pygargue à tête blanche","Haliaeetus leucocephalus","o","*","Pêche au-dessus des rapides, surtout en hiver."],["Loutre de rivière","Lontra canadensis","m","","Discrète, elle chasse dans les bras calmes."]]}};
var SPOT_ZONE={"imsouane":"atl_iber","safi":"atl_iber","sidikaouki":"atl_iber","ngor":"macaro","ouakam":"macaro","elandsbay":"benguela","muizenberg":"benguela","dahab":"redsea","nosybe":"oc_indien","watamu":"oc_indien","keramas":"indo_pac","nias":"indo_pac","gland":"indo_pac","komodo":"indo_pac","bunaken":"indo_pac","similan":"indo_pac","weligama":"indo_pac","ichinomiya":"japon","kerama":"japon","rincon":"carib","pavones":"pac_est","tamarindo":"pac_est","sayulita":"pac_est","todossantos":"cal_kelp","islamujeres":"carib","tofino":"cal_kelp","newsmyrna":"carib","montauk":"atl_nord","mancora":"pac_est","huanchaco":"humboldt","iquique":"humboldt","praiadorosa":"bresil","noronha":"bresil","ilhabela":"bresil","puntadeleste":"atl_sud","ayampe":"pac_est","burleigh":"aus_nz","byronbay":"aus_nz","manly":"aus_nz","ningaloo":"aus_nz","piha":"aus_nz","shipwreck":"aus_nz","restaurants":"pac_trop","borabora":"pac_trop","jardimdomar":"macaro","santabarbara":"macaro","capomannu":"medit","isolabella":"medit","zlatnirat":"medit","naxos":"medit","hossegor":"atl_iber","lacanau":"atl_iber","latorche":"manche_bzh","biarritz":"atl_iber","anglet":"atl_iber","quiberon":"manche_bzh","seignosse":"atl_iber","capbreton":"atl_iber","lafitenia":"atl_iber","guethary":"atl_iber","sauveterre":"atl_iber","latranche":"atl_iber","lapalue":"manche_bzh","penhors":"manche_bzh","lapalmyre":"atl_iber","mimizan":"atl_iber","capferret":"atl_iber","bidart":"atl_iber","nazare":"atl_iber","supertubos":"atl_iber","ericeira":"atl_iber","mundaka":"atl_iber","thurso":"atl_nord","bundoran":"atl_nord","rodiles":"atl_iber","somo":"atl_iber","zarautz":"atl_iber","pantin":"atl_iber","lasanta":"macaro","anchorpoint":"atl_iber","pipeline":"pac_trop","mavericks":"cal_kelp","trestles":"cal_kelp","malibu":"cal_kelp","puerto":"pac_est","santateresa":"pac_est","chicama":"humboldt","puntadelobos":"humboldt","jbay":"benguela","bells":"aus_nz","snapper":"aus_nz","margaret":"aus_nz","uluwatu":"indo_pac","padang":"indo_pac","cloudbreak":"pac_trop","teahupoo":"pac_trop","floripa":"bresil","puntaroca":"pac_est","raglan":"aus_nz","saquarema":"bresil","montanita":"pac_est","lobitos":"humboldt","mardelplata":"atl_sud","arica":"humboldt","itacare":"bresil","shonan":"japon","arugam":"indo_pac","cloud9":"indo_pac","waikiki":"pac_trop","unstad":"atl_nord","skeletonbay":"benguela","mentawai":"indo_pac","dungeons":"benguela","bluehole_belize":"carib","sipadan":"indo_pac","rasmohammed":"redsea","thistlegorm":"redsea","tulamben":"indo_pac","greatbarrier":"aus_nz","silfra":"atl_nord","cenote_dosojos":"cenote","medes":"medit","portcros":"medit","calanques":"medit","richelieu":"indo_pac","rajaampat":"indo_pac","galapagos":"galapagos","maldives":"oc_indien","hanauma":"pac_trop","bonaire":"carib","tarifa":"medit","dakhla":"atl_iber","cabarete":"carib","lemorne":"oc_indien","cumbuco":"bresil","essaouira":"atl_iber","lafranqui":"medit","jericoacoara":"bresil","hookipa":"pac_trop","pozo":"macaro","gardalake":"lac_alpin","hoodriver":"riviere","annecy":"lac_alpin","verdon":"lac_alpin","glenan":"manche_bzh","capri":"medit","palombaggia":"medit","praia_marinha":"atl_iber","navagio":"medit","anse_source":"oc_indien","whitehaven":"aus_nz","wissant":"manche_bzh","letouquet":"manche_bzh","hardelot":"manche_bzh","wimereux":"manche_bzh","berck":"manche_bzh","malolesbains":"manche_bzh","lehavre":"manche_bzh","etretat":"manche_bzh","dieppe":"manche_bzh","siouville":"manche_bzh","vauville":"manche_bzh","hauteville":"manche_bzh","granville":"manche_bzh","saintmalo":"manche_bzh","saintlunaire":"manche_bzh","erquy":"manche_bzh","perros":"manche_bzh"};
var BIOCAT={
  p:['bpoisson','#e6f2fb','#1583cb','Poisson'], m:['mammifere','#e3ecf8','#2f5b96','Mammifère'],
  r:['reptile','#e7f6ec','#2b8f57','Reptile'],  i:['invertebre','#f1eafd','#9b6bd1','Invertébré'],
  o:['oiseau','#fdf1d8','#c9902e','Oiseau'],    a:['algue','#eafaf7','#2a9e6d','Flore'],
  c:['corail','#ffe3df','#e8645e','Corail']
};
var BIO_ORDER={m:0,r:1,p:2,i:3,o:4,c:5,a:6};
/* les photos sont embarquees (WebP en data-URI) : elles s'affichent partout,
   y compris hors connexion ; l'icone vectorielle reste dessous en secours */
var BIOPIC={"Acanthurus coeruleus":"assets/original/5e6feed239de98.webp","Acipenser transmontanus":"assets/original/a4ee4614533628.webp","Acropora palmata":"assets/original/41811e50af579d.webp","Acropora spp.":"assets/original/43d71d8ca65287.webp","Amblyrhynchus cristatus":"assets/original/4419b3be685671.webp","Ammophila arenaria":"assets/original/ed292619391a82.webp","Amphiprion bicinctus":"assets/original/0fcb817db0dbd1.webp","Amphiprion ocellaris":"assets/original/d74315d8ee556a.webp","Arctocephalus forsteri":"assets/original/2f384c7dfd5ee7.webp","Arctocephalus pusillus":"assets/original/771698c7154f19.webp","Argyrosomus regius":"assets/original/37805655c42e11.webp","Astyanax mexicanus":"assets/original/f7d89a677d17a8.webp","Austropotamobius pallipes":"assets/original/397c97a558c170.webp","Carcharhinus leucas":"assets/original/0eae18b96ef148.webp","Carcharhinus melanopterus":"assets/original/a64e7d441bbe5f.webp","Carcharodon carcharias":"assets/original/e7c472c7fa0f3d.webp","Caretta caretta":"assets/original/a768fffa041623.webp","Cephalorhynchus commersonii":"assets/original/726e5be269a7e7.webp","Cephalorhynchus hectori":"assets/original/17e1486415bf0e.webp","Cetorhinus maximus":"assets/original/63ec79bbc6c61a.webp","Chaetodon spp.":"assets/original/f3f35bdd804651.webp","Chara spp.":"assets/original/a30209b455f59e.webp","Cheilinus undulatus":"assets/original/df764014ff76e0.webp","Chelonia mydas":"assets/original/8ea4c3cf7cc8bf.webp","Chelonia mydas agassizii":"assets/original/e2b217ca99dbf6.webp","Chironex fleckeri":"assets/original/d022fc373f2792.webp","Chrysaora hysoscella":"assets/original/83088671ad6e8b.webp","Coris julis":"assets/original/8876a059f6aa64.webp","Crocodylus acutus":"assets/original/936835d0b90f7b.webp","Cyclopterus lumpus":"assets/original/a19f418c3c5537.webp","Delphinus capensis":"assets/original/5b832d026c8278.webp","Delphinus delphis":"assets/original/7537567624aac6.webp","Dicentrarchus labrax":"assets/original/c8f8e8f0d9ed6a.webp","Durvillaea antarctica":"assets/original/62d04f96ae1e4a.webp","Echiichthys vipera":"assets/original/2a4b35c644ac2a.webp","Ecklonia maxima":"assets/original/049c27017a2c06.webp","Engraulis ringens":"assets/original/919465e8ea883d.webp","Enhydra lutris":"assets/original/d3ef83e49708a3.webp","Epinephelus itajara":"assets/original/646658f06abbf8.webp","Epinephelus marginatus":"assets/original/bd41867f0d372b.webp","Eretmochelys imbricata":"assets/original/a1fc6280b9232b.webp","Eschrichtius robustus":"assets/original/4c2bcd49c07831.webp","Esox lucius":"assets/original/0bd3dc958aee76.webp","Eubalaena australis":"assets/original/eed26ca9abc732.webp","Ficus spp.":"assets/original/984895d3734584.webp","Fratercula arctica":"assets/original/5b7501f59078e8.webp","Fucus vesiculosus":"assets/original/f0feb7082a83ff.webp","Gongolaria abies-marina":"assets/original/2e483f334a0785.webp","Gymnothorax javanicus":"assets/original/362d3734a12956.webp","Haliaeetus leucocephalus":"assets/original/66eeaa6ad39344.webp","Halichoerus grypus":"assets/original/f812d522311ab8.webp","Hypanus americanus":"assets/original/b40a525eab79a1.webp","Hypsypops rubicundus":"assets/original/bcf58ea9fcc826.webp","Jasus lalandii":"assets/original/8d6d1c64b95f43.webp","Labrus bergylta":"assets/original/45f50a19044d27.webp","Lagenorhynchus obscurus":"assets/original/a28352f73cebe1.webp","Laminaria digitata":"assets/original/036137219f61b1.webp","Laminaria hyperborea":"assets/original/a4c246345e5d5e.webp","Lepidochelys olivacea":"assets/original/e747a844c95477.webp","Leptuca spp.":"assets/original/bb69ac53a014d1.webp","Lobatus gigas":"assets/original/ea33762bbd97a2.webp","Lontra canadensis":"assets/original/02f805f3f1937f.webp","Lontra felina":"assets/original/272f3c2e580000.webp","Macrocheira kaempferi":"assets/original/91a51811a5d4bc.webp","Macrocystis pyrifera":"assets/original/1d0582ebd76e13.webp","Maja squinado":"assets/original/c5e5d313b5ffe7.webp","Megalops atlanticus":"assets/original/a2c45f0dd15014.webp","Megaptera novaeangliae":"assets/original/8a4c90f475f09e.webp","Millepora dichotoma":"assets/original/b5932106cedb37.webp","Mobula alfredi":"assets/original/2f5d59a2bafa8a.webp","Mobula birostris":"assets/original/9ecc5b14a13960.webp","Mobula munkiana":"assets/original/6a1cab89db8b68.webp","Mola alexandrini":"assets/original/53de574b04289d.webp","Mola mola":"assets/original/6c5b1262265921.webp","Mycteroperca fusca":"assets/original/03e6eddd34e75d.webp","Nembrotha spp.":"assets/original/780ecc592c4efa.webp","Neomonachus schauinslandi":"assets/original/07793f0734e973.webp","Octopus vulgaris":"assets/original/89de02324d9a55.webp","Oncorhynchus mykiss":"assets/original/fe733d2a4ded01.webp","Oncorhynchus tshawytscha":"assets/original/5f79e9f9749ead.webp","Orcinus orca":"assets/original/c2ac5cd1e341c6.webp","Otaria flavescens":"assets/original/0e3efdf71966ef.webp","Perca fluviatilis":"assets/original/a9281f688e7854.webp","Phalacrocorax harrisi":"assets/original/b7c458a3c12068.webp","Phoca vitulina":"assets/original/6e0930740169a8.webp","Phragmites australis":"assets/original/bfe8fe5b2fc0a7.webp","Phycodurus eques":"assets/original/36db8a7ce35477.webp","Physalia physalis":"assets/original/4f9ba3722d8e85.webp","Pinna nobilis":"assets/original/f08adebfe5f505.webp","Platygyra spp.":"assets/original/121d872ff7629f.webp","Pocillopora spp.":"assets/original/128cd6d9a680f5.webp","Poecilia velifera":"assets/original/9b3f6e7bc0b04d.webp","Pollachius pollachius":"assets/original/6772191619c33d.webp","Pomacanthus imperator":"assets/original/a899483213c686.webp","Posidonia oceanica":"assets/original/50dac668085b7b.webp","Pterois volitans":"assets/original/5d6b7e765a173b.webp","Rhincodon typus":"assets/original/0a7dd6b36b098d.webp","Rhinecanthus rectangulus":"assets/original/9b25a2a8635dda.webp","Rhinomuraena quaesita":"assets/original/6802ecd30c73d0.webp","Rhizophora mangle":"assets/original/78d2d138b6128a.webp","Salvelinus alpinus":"assets/original/df43e5a894a8c9.webp","Sardina pilchardus":"assets/original/4df259987b2f45.webp","Sarpa salpa":"assets/original/963d30636ce3a2.webp","Scorpaena scrofa":"assets/original/65bc631d86faa0.webp","Seriola quinqueradiata":"assets/original/c9fec44d66e5db.webp","Sotalia guianensis":"assets/original/f2bf8ed90e558b.webp","Sparisoma cretense":"assets/original/793fe77eae2977.webp","Sparisoma viride":"assets/original/39d2259a4e4a29.webp","Spheniscus demersus":"assets/original/7a9d4461c1b5b5.webp","Spheniscus humboldti":"assets/original/23e9d4f4469d93.webp","Spheniscus magellanicus":"assets/original/f47f267855608a.webp","Spheniscus mendiculus":"assets/original/c363a652b583a4.webp","Sphyrna lewini":"assets/original/886b93067fbbf3.webp","Squatina squatina":"assets/original/cf13ab2ef0fa7a.webp","Stenella attenuata":"assets/original/89afcb0a9aa5b1.webp","Stenella frontalis":"assets/original/9c470f715d6dcd.webp","Strongylocentrotus purpuratus":"assets/original/79c099a02345e1.webp","Synanceia verrucosa":"assets/original/f45f91bef4329e.webp","Taeniura grabata":"assets/original/8d9fae2488e16a.webp","Thalassia testudinum":"assets/original/3187ef6f7c5def.webp","Triaenodon obesus":"assets/original/b86dabe2195d2c.webp","Tridacna gigas":"assets/original/94f54ac6ea9547.webp","Tursiops aduncus":"assets/original/8ca096a635e8c2.webp","Tursiops truncatus":"assets/original/7ac795b43c1e73.webp","Typhlatya spp.":"assets/original/95859f45b1e91a.webp","Undaria pinnatifida":"assets/original/cd7f2019550577.webp","Urticina felina":"assets/original/30eff987f3264e.webp","Zalophus californianus":"assets/original/c894c844d421d7.webp","Zalophus wollebaeki":"assets/original/1d396847e02385.webp","Zanclus cornutus":"assets/original/6b33ea9b6468ee.webp"};
function bioPh(sp,extra){
  var cat=BIOCAT[sp[2]]||BIOCAT.p, u=BIOPIC[sp[1]];
  var h='<div class="bio-ph" style="background:'+cat[1]+';color:'+cat[2]+'">';
  h+=uic(cat[0]);
  if(u) h+='<img alt="'+sp[0]+'" src="'+u+'" onerror="this.style.display=\'none\'">';
  h+=bioTag(sp[3]);
  return h+(extra||'')+'</div>';
}
function bioTag(st){
  if(st==='*') return '<span class="bio-badge keep">À préserver</span>';
  if(st==='!') return '<span class="bio-badge warn">Prudence</span>';
  return '';
}
function bioSec(t){ return '<div class="bio-sec"><b>'+t+'</b><i></i></div>'; }
/* ====== PRÉSERVER CE SPOT ======
   L'onglet Faune disait ce qui vit ici sans jamais dire ce qu'on lui fait.
   Un enjeu propre au milieu, puis trois ou quatre gestes faisables le jour même. */
var PRESERVE={"manche_bzh":{"e":"Un estran vivant : ce qui semble vide à marée basse est un garde-manger pour les oiseaux, et les phoques s'y reposent entre deux marées.","g":[["Laisse la laisse de mer","Le cordon d'algues échouées n'est pas un déchet : il abrite des puces de mer et nourrit les oiseaux du rivage."],["Repose les blocs que tu retournes","Sous chaque pierre de l'estran vit une petite communauté fixée. Retournée et laissée à l'envers, elle meurt en quelques heures."],["Garde tes distances avec les phoques","Un phoque à terre n'est pas en détresse, il se repose. S'en approcher le fait fuir à l'eau et l'épuise — reste loin et observe."],["Emporte les cordages et filets","Ce sont les déchets les plus fréquents sur ces côtes, et ceux qui piègent le plus d'oiseaux et de phoques."]]},"atl_iber":{"e":"La dune est ce qui tient la plage. Elle avance, recule, et ne se reconstitue que si sa végétation reste en place.","g":[["Passe par les accès aménagés","L'oyat fixe le sable avec ses racines. Quelques passages répétés hors sentier suffisent à ouvrir une brèche que le vent élargit ensuite tout seul."],["Remporte tes mégots","C'est le déchet le plus ramassé sur les plages françaises, et le filtre met des années à se fragmenter."],["Ne roule pas sur la plage","Les véhicules écrasent la laisse de mer et les nids d'oiseaux qui s'y installent au printemps."],["Signale un animal échoué","Dauphins et tortues s'échouent régulièrement sur cette côte. Le Réseau national échouages intervient — ne le remets pas à l'eau toi-même."]]},"medit":{"e":"L'herbier de posidonie. Cette plante à fleurs marine oxygène l'eau, retient le sable et abrite des centaines d'espèces. Elle pousse d'environ un centimètre par an.","g":[["N'ancre jamais sur l'herbier","Une ancre qui laboure la posidonie ouvre une trouée qui mettra des décennies à se refermer. Mouille sur le sable clair, ou sur une bouée d'amarrage."],["Ne déblaie pas les banquettes","Les feuilles mortes accumulées sur la plage l'hiver ne sont pas des déchets : elles amortissent les tempêtes et limitent l'érosion."],["Ne touche pas la grande nacre","Ce grand coquillage dressé dans le sable est en danger critique depuis l'arrivée d'un parasite. Chaque individu encore vivant compte."],["Regarde sans nourrir","Nourrir les poissons déséquilibre les populations et les rend dépendants — même avec du pain."]]},"macaro":{"e":"Des îles volcaniques entourées d'aires marines protégées, où passent tortues et cétacés toute l'année.","g":[["Vérifie le statut de la zone","Une bonne partie du littoral est en réserve : certaines pratiques y sont réglementées, renseigne-toi avant d'entrer à l'eau."],["Ne poursuis pas les tortues","Se laisser approcher est leur choix. Nager après une tortue l'oblige à remonter respirer plus tôt que prévu."],["Ne prélève rien","Ni coquillage, ni galet de lave, ni algue : sur des îles, chaque prélèvement multiplié par le nombre de visiteurs se voit vite."]]},"atl_nord":{"e":"Des eaux froides très productives, où se concentrent oiseaux marins et grands poissons — et où le plastique dérive depuis très loin.","g":[["Ramasse ce que la mer dépose","Sur ces côtes, une grande part des déchets vient d'ailleurs, portée par les courants. Les ramasser ici, c'est les sortir du cycle."],["Approche les colonies d'oiseaux de loin","Un dérangement en période de nidification peut faire abandonner une couvée entière."],["Rince ton matériel entre deux sites","Combinaisons et planches transportent spores et larves d'une zone à l'autre."]]},"redsea":{"e":"Un récif corallien parmi les plus résistants au réchauffement — mais pas au contact physique ni aux eaux usées.","g":[["Ne pose jamais le pied sur le corail","Un appui casse en une seconde une colonie qui a mis des années à pousser. Palme au-dessus, ne te stabilise pas dessus."],["Choisis une crème solaire minérale","Certains filtres chimiques sont interdits dans plusieurs pays coralliens à cause de leur effet sur le corail. Un lycra couvrant règle la question."],["Ne touche pas, ne nourris pas","Le mucus qui protège les poissons et les coraux s'abîme au contact d'une main."],["Garde tes distances avec les raies et requins","Les approcher les fait quitter les stations de nettoyage dont ils dépendent."]]},"carib":{"e":"Des récifs qui ont déjà perdu une grande part de leurs coraux branchus, et des herbiers de tortue qui les relaient.","g":[["Ne casse pas le corail corne d'élan","Cette espèce est en danger critique : ce qui reste debout est précieux."],["Traverse les herbiers en palmant haut","Les herbiers de Thalassia nourrissent les tortues vertes et fixent le sédiment."],["Ne rapporte pas de conque","Le lambi est surexploité et son commerce est réglementé."],["Crème solaire minérale ou lycra","Le récif est déjà sous pression thermique, on lui épargne le reste."]]},"bresil":{"e":"Des mangroves et des estuaires qui servent de nurserie à presque tout ce qui vit ensuite au large.","g":[["Ne coupe pas à travers la mangrove","Les racines de palétuvier abritent les juvéniles de dizaines d'espèces et protègent la côte des houles de tempête."],["Remporte tout le plastique","Les estuaires concentrent les déchets venus des fleuves avant qu'ils ne partent au large."],["Respecte les zones de ponte","Les plages de ponte des tortues sont balisées en saison — on n'y circule pas la nuit avec une lampe."]]},"pac_trop":{"e":"Des récifs et des lagons peu profonds, très exposés au blanchissement et au moindre contact.","g":[["Ne marche pas sur le récif","Un platier corallien n'est pas un sol : chaque pas casse des colonies vivantes."],["Crème solaire minérale ou lycra","Plusieurs territoires du Pacifique interdisent certains filtres chimiques pour protéger leurs coraux."],["Ne nourris pas les poissons","Le nourrissage change les comportements et déséquilibre le récif."],["Mouille sur le sable","Une ancre dans le corail laisse une cicatrice pour des années."]]},"indo_pac":{"e":"Le Triangle de corail : la plus grande diversité marine de la planète, et aussi l'une des zones les plus touchées par le plastique.","g":[["Ne touche à rien, même du doigt","Un contact suffit à ouvrir une porte aux infections sur un corail."],["Refuse le plastique à usage unique","Dans cette région, une grande part du plastique marin arrive par les fleuves et les côtes proches."],["Contrôle ta flottabilité","La plupart des dégâts en plongée viennent des palmes de plongeurs mal lestés."],["Ne rapporte aucun souvenir vivant","Coraux, coquillages et étoiles de mer valent plus dans l'eau."]]},"oc_indien":{"e":"Des atolls bas, où le récif est à la fois l'écosystème et la digue qui protège l'île.","g":[["Le récif est la protection de l'île","Un récif vivant amortit la houle. Abîmé, c'est l'île elle-même qui s'expose."],["Distance avec les raies manta et requins-baleines","Ne nage pas devant eux et ne les touche pas — c'est interdit dans plusieurs pays de la zone."],["Palme au-dessus des platiers","À marée basse, quelques centimètres suffisent à racler le corail."],["Emporte tes déchets hors de l'atoll","Sur une île sans filière, le déchet reste sur place."]]},"pac_est":{"e":"Des remontées d'eau froide qui nourrissent une faune spectaculaire, concentrée sur quelques sites.","g":[["Observe sans encercler","Sur les sites d'agrégation, un groupe de nageurs qui entoure un animal le coupe de sa route de fuite."],["Choisis des opérateurs qui respectent les distances","La pression touristique se gère surtout par le choix du prestataire."],["Rien ne se ramasse","Coquillages et coraux morts font partie du sédiment qui reconstruit la plage."]]},"galapagos":{"e":"Un laboratoire vivant : la faune n'a pas peur de l'humain, ce qui la rend très facile à déranger.","g":[["Reste à bonne distance, même si l'animal ne fuit pas","L'absence de fuite n'est pas de la tolérance : c'est l'absence de prédateur terrestre dans leur histoire."],["N'introduis rien","Graines, insectes, terre sous les semelles : les espèces introduites sont la première menace de l'archipel."],["Suis les sentiers et les guides","La quasi-totalité de l'archipel est en parc national réglementé."]]},"humboldt":{"e":"L'un des courants les plus poissonneux du monde, dont dépendent des colonies entières d'oiseaux et d'otaries.","g":[["Ne dérange pas les colonies","Otaries et manchots se reposent à terre entre deux sorties en mer ; les faire fuir leur coûte de l'énergie qu'ils vont chercher très loin."],["Ramasse les filins et hameçons","Ce sont les déchets qui blessent le plus la faune de cette côte."],["Ne rapporte pas de coquillages","Ils servent d'abri et se dissolvent en sable."]]},"benguela":{"e":"Des forêts de laminaires et des colonies d'otaries, dans une eau froide très riche.","g":[["Traverse le kelp sans l'arracher","La forêt de laminaires est un habitat entier : elle abrite les juvéniles et amortit la houle."],["Laisse les otaries venir","Elles sont curieuses. C'est à elles de décider de la distance."],["Emporte le plastique fin","Sacs et films sont avalés par les tortues et les oiseaux de la zone."]]},"cal_kelp":{"e":"Des forêts de kelp géant qui ont beaucoup reculé, en partie faute d'étoiles de mer pour réguler les oursins.","g":[["Ne coupe pas les frondes de kelp","Chaque pied de macrocystis peut abriter des dizaines d'espèces."],["Ne déplace pas les oursins","Leur prolifération est déjà un problème ici ; les manipuler ne règle rien."],["Respecte les réserves marines","La côte est jalonnée de zones où tout prélèvement est interdit."]]},"aus_nz":{"e":"Des côtes où cohabitent récifs tempérés, forêts de laminaires et espèces endémiques qu'on ne trouve nulle part ailleurs.","g":[["Rince ton matériel entre deux sites","Les espèces introduites voyagent sur les combinaisons et les coques."],["Ne touche pas les dragons de mer","Ces poissons très lents sont protégés ; un contact peut les blesser."],["Respecte les zones interdites","Beaucoup de côtes sont en aire marine protégée avec des règles précises."]]},"japon":{"e":"Des courants chauds et froids qui se rencontrent, et un littoral très aménagé où chaque zone naturelle compte.","g":[["Ne prélève rien sur l'estran","Les estrans japonais sont très fréquentés : le prélèvement individuel se cumule vite."],["Emporte tes déchets","Les poubelles publiques sont rares : on repart avec ce qu'on a apporté."],["Garde tes distances avec la faune","Y compris avec les animaux habitués à l'humain."]]},"atl_sud":{"e":"Des côtes de Patagonie où se reproduisent baleines, manchots et otaries, sur des sites très localisés.","g":[["Respecte les distances d'approche des baleines","Elles sont réglementées dans la zone, et pour de bonnes raisons : ce sont des sites de reproduction."],["Ne traverse pas les colonies de manchots","Leurs terriers s'effondrent sous un pas."],["Emporte tout","Le vent emporte le moindre emballage vers la mer."]]},"lac_alpin":{"e":"Une eau douce froide et claire, avec des roselières qui filtrent l'eau et abritent les nichées.","g":[["Ne piétine pas la roselière","C'est la nurserie du lac et le filtre naturel de son eau."],["Nettoie et sèche ton matériel","Les espèces invasives d'un lac à l'autre voyagent dans l'eau restée dans une combinaison ou un kayak."],["Ne relâche jamais un animal d'aquarium","C'est l'une des voies d'introduction d'espèces les plus fréquentes en eau douce."]]},"cenote":{"e":"Une eau souterraine reliée à toute la nappe : ce qui entre dans un cénote circule dans le réseau entier.","g":[["Douche-toi avant d'entrer","Crèmes et produits corporels se diffusent dans une eau qui alimente la nappe. Plusieurs cénotes l'imposent."],["Ne touche ni stalactites ni stalagmites","Elles ont mis des milliers d'années à se former et le contact stoppe leur croissance."],["Ne remue pas le sédiment","La visibilité met des jours à revenir et l'écosystème est très pauvre en nutriments."]]},"riviere":{"e":"Un fleuve qui relie la montagne à l'océan, et transporte vers la mer tout ce qu'on y laisse.","g":[["Ce qui part d'ici finit à la mer","Les fleuves sont la principale voie d'arrivée du plastique dans l'océan."],["Nettoie ton matériel entre deux rivières","Les invasives remontent les bassins par le matériel nautique."],["Évite les frayères au printemps","Les zones de graviers peu profondes abritent les pontes."]]}};
function presScroll(){
  /* la pastille du bandeau Faune bascule maintenant sur l'onglet Préserver */
  try{ showDetailCat('preserver'); }catch(e){}
  return false;
}
function presGeste(g,i,z){
  /* le geste n'est plus seulement lu : on peut le cocher, il part dans le
     carnet écolo avec le nom du spot, et il rapporte 15 XP. */
  var k='z:'+z+':'+i, fait=(typeof ecoHas==='function')&&ecoHas(k);
  return '<div class="pres-g"><span class="pres-n">'+(i+1)+'</span>'
       + '<div class="pres-tx"><b>'+g[0]+'</b><p>'+g[1]+'</p>'
       + '<button class="pres-do'+(fait?' done':'')+'" data-k="'+k+'" '
       + 'onclick="presDone(this,\''+k+'\','+i+',\''+z+'\')"'+(fait?' disabled':'')+'>'
       + (fait?'✓ Fait ici':'Je l\'ai fait  ·  +15 XP')+'</button>'
       + '</div></div>';
}
function presDone(btn,k,i,z){
  if(btn.classList.contains('done'))return;
  var p=PRESERVE[z]; if(!p||!p.g[i])return;
  var s=SPOTS.find(function(x){return x.id===currentSpot;});
  btn.classList.add('done'); btn.disabled=true; btn.textContent='✓ Fait ici';
  ecoAdd(p.g[i][0], s?s.name.split(' — ')[0]:'', k);
  addXP(15,'Geste enregistré ! +15 XP');
}
function renderPreserve(s){
  var p=PRESERVE[SPOT_ZONE[s.id]]; if(!p) return '';
  var z=SPOT_ZONE[s.id];
  var h='<div class="pres" id="presBlock">'
   + '<div class="pres-hd">'+uic('feuille')
   + '<div><h6>Préserver ce spot</h6><p>'+p.e+'</p></div></div>'
   + '<div class="pres-l"><div class="pres-lab">Ce que tu peux faire ici, aujourd\'hui</div>'
   + p.g.map(function(g,i){ return presGeste(g,i,z); }).join('')
   + '</div></div>';
  return h;
}
function renderFaune(s){
  var host=document.getElementById('dFaune'); if(!host) return;
  var z=BIOZONE[SPOT_ZONE[s.id]];
  if(!z){ host.innerHTML=''; return; }
  var warn=[], flore=[], faune=[];
  z.sp.forEach(function(sp){
    if(sp[3]==='!') warn.push(sp);
    else if(sp[2]==='a'||sp[2]==='c') flore.push(sp);
    else faune.push(sp);
  });
  function bioRank(c){ var r=BIO_ORDER[c]; return (r===undefined)?9:r; }
  faune.sort(function(a,b){ return bioRank(a[2])-bioRank(b[2]); });

  var h='<div class="bio-head"><h5>'+uic('bpoisson')+' '+z.l+'</h5><p>'+z.s+'</p>'
       +'<span class="bio-chip">'+z.sp.length+' espèces typiques</span><a class="bio-chip act" href="#" onclick="return presScroll()">Préserver ce spot</a></div>';

  if(faune.length){
    var hero=faune.shift();
    h+=bioSec('À observer')
     + '<div class="bio-hero">'
     + bioPh(hero,'<div class="bio-cap"><h6>'+hero[0]+'</h6><div class="bio-sci">'+hero[1]+'</div></div>')
     + '<p class="bio-t">'+hero[4]+'</p></div>';
    if(faune.length) h+=bioGridMore(faune);
  }
  if(flore.length) h+=bioSec('Flore &amp; fonds')+bioGrid(flore,'');
  if(warn.length){
    h+=bioSec('À connaître avant de te mettre à l\'eau')+'<div class="bio-warn">'
     + warn.map(function(sp){
         return '<div class="bio-w">'+bioPh(sp)+'<div class="bio-tx"><div class="bio-n">'+sp[0]+'</div>'
              + '<div class="bio-sci">'+sp[1]+'</div><div class="bio-t">'+sp[4]+'</div></div></div>';
       }).join('')+'</div>';
  }
  h+='<p class="bio-note"><b>Espèces typiques de cette zone, pas une liste garantie sur cette plage.</b> '
   + 'La faune change avec la saison, l\'heure et la météo. Observe sans toucher ni nourrir. '
   + 'Photos : Wikimedia Commons.</p>';
  host.innerHTML=h;
  /* « Préserver » a son propre onglet : Faune ne porte plus que le vivant. */
  var hp=document.getElementById('dPreserve');
  if(hp) hp.innerHTML=renderPreserve(s);
}
/* L'onglet faisait 2,7 écrans de haut. Quatre espèces, le reste à la demande. */
function bioGridMore(list){
  if(list.length<=4) return bioGrid(list,' style="margin-top:10px"');
  var rest=list.slice(4);
  return bioGrid(list.slice(0,4),' style="margin-top:10px"')
    + '<button class="bio-more" onclick="bioMore(this)">Voir les '+rest.length+' autres espèces</button>'
    + '<div style="display:none">'+bioGrid(rest,' style="margin-top:10px"')+'</div>';
}
function bioMore(b){
  var d=b.nextElementSibling; if(d) d.style.display='';
  b.parentNode.removeChild(b);
}
function bioGrid(list,attr){
  var one = list.length===1;
  return '<div class="bio-grid'+(one?' one':'')+'"'+attr+'>'
       + list.map(function(sp){ return bioCard(sp,one); }).join('') + '</div>';
}
function bioCard(sp,wide){
  return '<div class="bio-c'+(wide?' wide':'')+'">'+bioPh(sp)+'<div class="bio-in"><div class="bio-n">'+sp[0]+'</div>'
       + '<div class="bio-sci">'+sp[1]+'</div><div class="bio-t">'+sp[4]+'</div></div></div>';
}
/* ================= ONGLETS DE L'ACCUEIL ================= */
function showHomeCat(cat){
  document.querySelectorAll('#home .hcat').forEach(function(e){
    e.style.display = (e.getAttribute('data-hcat')===cat) ? '' : 'none';
  });
  document.querySelectorAll('#homeTabs .htab').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-hcat')===cat);
  });
  var w=document.getElementById('screenWrap'); if(w) w.scrollTop=0;
}
function showDetailCat(cat){
  /* « Conditions » porte deux panneaux : la météo et la sécurité. Les deux
     répondent à la même question avant d'entrer dans l'eau. */
  document.querySelectorAll('#detail .dcat').forEach(function(d){
    var on=(d.dataset.cat===cat)||(cat==='meteo'&&d.dataset.cat==='securite');
    d.style.display=on?'':'none';
  });
  /* cinq onglets ne tiennent pas dans 390 px : on amène l'onglet actif
     dans le champ de vision au lieu de le laisser hors écran. */
  setTimeout(function(){
    var bar=document.getElementById('dTabs');
    var act=bar&&bar.querySelector('.dtab.active');
    if(bar&&act) bar.scrollTo({left:Math.max(0,act.offsetLeft-14),behavior:'smooth'});
  },0);
  document.querySelectorAll('#dTabs .dtab').forEach(function(b){b.classList.toggle('active',b.dataset.cat===cat);});
  var tabs=document.getElementById('dTabs');
  if(tabs)tabs.scrollIntoView({block:'start',behavior:'smooth'});
}
function worldLab(sid){
  if(typeof SPOT_WORLD==='undefined'||typeof WORLDS==='undefined')return '';
  var w=SPOT_WORLD[sid];
  for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===w)return WORLDS[i].lab;
  return '';
}
function ctaLabel(act){
  return sportIcon(act,'#fff')+" J'ai "+(SPORT_VERB[act]||'pratiqué')+' ici'
       + '<span class="cta-xp">+40 XP</span>';
}
function setHeroPhoto(s){
  /* La photo se pose en fondu PAR-DESSUS le dessin, qui reste en place.
     Si elle n'arrive pas — spot sans photo, reseau coupe, fichier renomme —
     on ne retire jamais le dessin : le haut de la fiche n'est jamais vide. */
  var img=document.getElementById('dHeroPhoto'),
      cred=document.getElementById('dHeroCred'),
      more=document.getElementById('dHeroMore'),
      pu=spotPhotoUrl(s.id,1280);
  if(img){
    img.classList.remove('on');
    if(pu){
      img.onload=function(){img.classList.add('on');};
      img.onerror=function(){img.classList.remove('on');};
      img.src=pu;
    }
  }
  if(cred)cred.textContent=spotPhotoCredit(s.id)
    ||"Illustration Ocean Buddy — photo du lieu à venir";
  if(more)more.onclick=function(){
    window.open('https://www.google.com/search?tbm=isch&q='
      +encodeURIComponent(s.name.split(' — ')[0]+' '+s.loc),'_blank');};
}
/* L'activite choisie ici ne vaut QUE pour la fiche ouverte : changer de sport
   sur un spot ne doit pas reconfigurer le filtre de toute l'app, qui se regle
   depuis l'accueil. */
var detailSport=null;
function detailAct(s){
  var l=spotSports(s);
  if(detailSport&&l.indexOf(detailSport)>=0)return detailSport;
  if(activeSport&&l.indexOf(activeSport)>=0)return activeSport;
  return l[0];
}
function renderDetailSports(s,act){
  var l=spotSports(s),e=document.getElementById('dSports');
  if(!e)return;
  e.className='dsports'+(l.length<2?' solo':'');
  e.innerHTML=l.map(function(id){
    var on=(id===act)?' on':'';
    return l.length<2
      ? '<span class="sp'+on+'">'+sportIcon(id)+' '+SPORTMAP[id].label+'</span>'
      : '<button type="button" class="sp'+on+'" onclick="setDetailSport(\''+id+'\')">'
        + sportIcon(id)+' '+SPORTMAP[id].label+'</button>';
  }).join('');
}
function renderGuideSub(s,act){
  var e=document.getElementById('dGuideSub'); if(!e)return;
  var lab=SPORTMAP[act]?SPORTMAP[act].label.replace(/\s*\(.*\)/,''):'la session';
  e.innerHTML=(spotSports(s).length<2)
    ? 'Repères pour <b>'+lab+'</b> sur ce spot.'
    : 'Repères pour <b>'+lab+'</b> — touche une autre activité pour les changer.';
}
function setDetailSport(id){
  var s=SPOTS.find(function(x){return x.id===currentSpot;}); if(!s)return;
  if(spotSports(s).indexOf(id)<0)return;
  detailSport=id;
  var act=detailAct(s);
  renderDetailSports(s,act);
  renderGuideSub(s,act);
  document.getElementById('dGuide').innerHTML=renderGuide(s,act);
  renderDetailFacts(s,act);
  var lb=document.getElementById('dLogBtn');
  if(lb)lb.innerHTML=ctaLabel(act);
  realForecastDetail(s,act);
}
function renderDetailFacts(s,act){
  /* Trois reperes d'identite, pas de conditions : celles-ci ont leur onglet. */
  var e=document.getElementById('dFacts'); if(!e)return;
  var sc=(typeof SCORES!=='undefined'&&SCORES[s.id])?SCORES[s.id]:null;
  var lvl=(typeof LVLTXT!=='undefined'&&LVLTXT[s.level])||s.level;
  var lab=SPORTMAP[act]?SPORTMAP[act].label.replace(/\s*\(.*\)/,''):'';
  var h='';
  if(sc)h+='<span class="dfact note">'+uic('etoile')+' '+sc.toFixed(1)+'<span class="dfl">/ 5</span></span>';
  h+='<span class="dfact lv-'+s.level+'">'+lvl+'</span>';
  if(lab)h+='<span class="dfact">'+sportIcon(act)+' '+lab+'</span>';
  e.innerHTML=h;
}
function openSpot(id){
  const s=SPOTS.find(x=>x.id===id);
  if(id!==currentSpot)detailSport=null;   /* le choix d'activite ne suit pas d'un spot a l'autre */
  currentSpot=id;
  const act=detailAct(s);
  var _df=document.getElementById('dFav');_df.innerHTML=favs.has(id)?FAV_ON:FAV_OFF;_df.classList.toggle('on',favs.has(id));
  renderMiniForecast(s);realForecastDetail(s,act);
  document.getElementById('dName').textContent=s.name;
  document.getElementById('dLoc').innerHTML=uic('pin')+' '+s.loc;
  var _eb=document.getElementById('dEyebrow');
  if(_eb)_eb.textContent=worldLab(s.id);
  document.getElementById('detailHero').querySelectorAll('svg.scene').forEach(e=>e.remove());
  document.getElementById('detailHero').insertAdjacentHTML('afterbegin',scene(s,true));
  document.getElementById('dDesc').textContent=s.desc;
  renderDetailSports(s,act);
  const sp0=act;
  const spLab=SPORTMAP[sp0]?SPORTMAP[sp0].label.replace(/\s*\(.*\)/,'').toLowerCase():'sports nautiques';
  const cc=COORDS[s.id]||null,near=s.loc.split(',')[0];
  document.getElementById('dShop').onclick=()=>mapsSearch('magasin '+spLab+' '+near,cc);
  document.getElementById('dSchool').onclick=()=>mapsSearch('école '+spLab+' cours '+near,cc);
  setHeroPhoto(s);
  document.getElementById('dLogBtn').innerHTML=ctaLabel(sp0);
  var em=countryEmergency(s.loc);
  document.getElementById('dEmerg').textContent=em.emergency;
  document.getElementById('dSea').textContent=em.sea;
  document.getElementById('dCall').href='tel:'+em.call;
  document.getElementById('dRescue').onclick=function(){mapsSearch('poste de secours plage sauveteurs '+near,cc);};
  document.getElementById('dGuide').innerHTML=renderGuide(s,act);
  renderGuideSub(s,act);
  var z=ZONES[s.id],_zb=document.getElementById('dZonesBlock');
  if(_zb)_zb.style.display=z?'':'none';
  document.getElementById('dZones').innerHTML=z?('<div class="zwrap">'+z.map(function(zz){
    return '<div class="zone zl-'+zz.l+'"><div class="zh"><span class="zn">'+zz.n+'</span>'
         + '<span class="zlvl zl-'+zz.l+'">'+(LVLTXT[zz.l]||'')+'</span></div>'
         + (zz.d?('<div class="zd">'+zz.d+'</div>'):'')+'</div>';
  }).join('')+'</div>'):'';
  document.getElementById('dAnec').textContent=ANEC[s.id]||"Ce spot garde encore quelques secrets… 🐙";
  const fun=FUN[s.id];const fb=document.getElementById('dFunBlock');
  if(fun){fb.style.display='';document.getElementById('dFun').textContent=fun;}else{fb.style.display='none';}
  document.getElementById('dTip').textContent=s.tip;
  var _to=document.getElementById('dTipOcto');
  if(_to&&!_to.innerHTML)_to.innerHTML=octoTag();
  renderDetailFacts(s,act);
  var _tb=document.getElementById('dTideBlock');if(_tb)_tb.style.display='none';
  renderConditions(s,null);fetchConditions(s);
  try{renderFaune(s);}catch(e){}
  document.getElementById('dDangers').innerHTML=s.dangers.map(d=>{var m=DANGER_MAP[d[0]]||['pin','#eef4f7','#7c98a8'];return `<div class="danger-item"><span class="di" style="background:${m[1]};color:${m[2]}">${uic(m[0])}</span><span>${d[1]}</span></div>`;}).join('');
  showDetailCat('infos');
  go('detail');
}
function renderChallenges(){
  const c=ch=>`<div class="chal">
    <div class="chal-ic" style="background:${ch.bg};color:${ch.color}">${uic(ch.ic)}</div>
    <div class="chal-body"><h4>${ch.title}</h4><p>${ch.desc}</p>
      <span class="chal-xp">+${ch.xp} XP</span>
      ${ch.prog>0&&!ch.done?`<div class="progressbar"><i style="width:${ch.prog}%"></i></div>`:''}
    </div>
    <button class="chal-btn ${ch.done?'done':''}" onclick="claimChallenge(this,${ch.xp})">${ch.done?'✓ Fait':'Valider'}</button>
  </div>`;
  const e=(ch,i)=>`<div class="chal eco">
    <div class="chal-ic" style="background:${ch.bg};color:${ch.color}">${uic(ch.ic)}</div>
    <div class="chal-body"><h4>${ch.title}</h4><p>${ch.desc}</p>
      <span class="chal-xp">+${ch.xp} XP</span>
      ${ch.prog>0&&!ch.done?`<div class="progressbar"><i style="width:${ch.prog}%"></i></div>`:''}
    </div>
    <button class="chal-btn ${ch.done?'done':''}" onclick="claimEco(this,${i})">${ch.done?'✓ Fait':'Valider'}</button>
    <div class="chal-why">${uic('feuille')}<span><b>Pourquoi ça compte —</b> ${ch.why}</span></div>
  </div>`;
  document.getElementById('ecoChallenges').innerHTML=ECO.map(e).join('');
  document.getElementById('surfChallenges').innerHTML=SURF.map(c).join('');
  try{chalShow(document.querySelector('#challenges .gsw button.on[data-g="b"]')?'b':'a');}catch(e){}
}
function renderBadges(){document.getElementById('badges').innerHTML=BADGES.map(b=>`<div class="badge ${b.locked?'locked':''}"><div class="e">${b.locked?uic('cadenas'):uic(b.e)}</div><div class="n">${b.n}</div></div>`).join('');}
function pstatTile(svg,bg,color,v,l,on){return '<div class="pstat"'+(on?' onclick="'+on+'" style="cursor:pointer"':'')+'><div class="pstat-ic" style="background:'+bg+';color:'+color+'">'+svg+'</div><div class="pstat-v">'+v+'</div><div class="pstat-l">'+l+'</div></div>';}
function renderProfile(){
  var pct=Math.min(100,Math.round(xp/LVL*100));
  var fill=document.getElementById('profXpFill');if(fill)fill.style.width=pct+'%';
  var xt=document.getElementById('profXpText');if(xt)xt.textContent=xp+' / '+LVL+' XP · plus que '+Math.max(0,LVL-xp)+' avant Niv. 5';
  var rt=document.getElementById('profTrips');if(rt)rt.textContent=window.OceanTrips?OceanTrips.count():0;
  var appB=(typeof BADGES!=='undefined')?BADGES.filter(function(b){return !b.locked;}).length:0;
  var quizB=0;try{quizB=quizLoad().badges.length;}catch(e){}
  var bt=document.getElementById('profBadges');if(bt)bt.textContent=(appB+quizB);
  var spotsSet={};sessions.forEach(function(s){spotsSet[s.spot]=1;});
  var grid=document.getElementById('profStats');
  if(grid)grid.innerHTML=pstatTile(SURF_ICON,'#e3f1fb','#1f9bbf',sessions.length,'Sessions')+pstatTile(PIN_ICON,'#e2f0f8','#2f8fb8',Object.keys(spotsSet).length,'Spots visités')+pstatTile(LEAF_ICON,'#e7f7ef','#2faf72',ecoLog.length,'Gestes écolo','showEcoLog()')+pstatTile(HEART_ICON,'#fdeaf0','#eb5b83',favs.size,'Favoris');
}
function renderQuizBadges(){var el=document.getElementById('quizBadgesProfile');if(!el||typeof QUIZ_CATS==='undefined')return;var d=quizLoad();
  el.innerHTML=QUIZ_CATS.filter(function(c){return c.id!=='tout';}).map(function(c){var got=d.badges.indexOf(c.id)>=0;return '<div class="qb '+(got?'got':'')+'"><div class="qb-e">'+(got?'🏅':c.emoji)+'</div><div class="qb-n">Expert '+c.label+'</div><div class="qb-s">'+(got?'Débloqué ✓':'Sans-faute requis')+'</div></div>';}).join('');}
function renderSessions(){
  const el=document.getElementById('sessions');if(!el)return;
  el.innerHTML=sessions.length?sessions.slice(0,8).map(function(s){var em=(s.act&&typeof SPORTMAP!=='undefined'&&SPORTMAP[s.act])?sportIcon(s.act):sportIcon('surf');return '<div class="sess"><div class="si">'+em+'</div><div class="sn">'+s.spot+'</div><div class="sd">'+s.date+'</div></div>';}).join(''):'<div style="font-size:12.5px;color:#7a93a3;padding:2px 2px 6px">Aucune session encore. Enregistre ta première !</div>';
  renderSessionStats();
}
function renderSessionStats(){
  var el=document.getElementById('sessionStats');if(!el)return;
  var total=sessions.length,spots={},acts={};
  sessions.forEach(function(s){spots[s.spot]=1;if(s.act)acts[s.act]=(acts[s.act]||0)+1;});
  var nspots=Object.keys(spots).length;
  var fav=Object.keys(acts).sort(function(a,b){return acts[b]-acts[a];})[0];
  var favLab=(fav&&typeof SPORTMAP!=='undefined'&&SPORTMAP[fav])?(sportIcon(fav)+' '+SPORTMAP[fav].label):'—';
  el.innerHTML='<div class="ss-item"><b>'+total+'</b><span>sessions</span></div><div class="ss-item"><b>'+nspots+'</b><span>spots</span></div><div class="ss-item"><b class="ss-act">'+favLab+'</b><span>activité préférée</span></div>';
}
/* ===== Réglages / personnalisation ===== */
function openSettings(){var i=document.getElementById('setName');if(i)i.value=userName;var r=document.getElementById('setReduce');if(r)r.checked=document.body.classList.contains('reduce-motion');document.getElementById('settingsModal').classList.add('open');}
function closeSettings(){document.getElementById('settingsModal').classList.remove('open');}
function saveName(){var v=(document.getElementById('setName').value||'').trim();if(!v){toast('Entre un prénom 🐙');return;}userName=v.slice(0,18);applyName();saveState();toast('Prénom enregistré ✅');closeSettings();}
function toggleReduceMotion(on){document.body.classList.toggle('reduce-motion',!!on);try{localStorage.setItem('oceanbuddy_reduce',on?'1':'0');}catch(e){}}
function resetProgress(){if(!window.confirm('Réinitialiser toute ta progression (XP, favoris, sessions, quiz) ?'))return;try{localStorage.removeItem(STORE_KEY);localStorage.removeItem('oceanbuddy_quiz_v1');}catch(e){}location.reload();}

/* ================= HOME DASHBOARD ================= */
function recommendedSpot(){
  const bySport=s=>!activeSport||spotSports(s).includes(activeSport);
  let pool=SPOTS.filter(s=>bySport(s)&&(!chosenLevel||s.level===chosenLevel));
  if(!pool.length)pool=SPOTS.filter(bySport);
  if(!pool.length)pool=SPOTS;
  return pool.slice().sort((a,b)=>SCORES[b.id]-SCORES[a.id])[0];
}
function setTodayPhoto(s){
  /* Meme principe que le hero de la fiche : la photo arrive en fondu PAR-DESSUS
     le dessin, qui n'est jamais retire. */
  var img=document.getElementById('todayPhoto'),
      cr=document.getElementById('todayCredit'),
      pu=(typeof spotPhotoUrl==='function')?spotPhotoUrl(s.id,720):null;
  if(img){
    img.classList.remove('on');
    if(pu){
      img.onload=function(){img.classList.add('on');};
      img.onerror=function(){img.classList.remove('on');};
      img.src=pu;
    }
  }
  if(cr)cr.textContent=(typeof spotPhotoCredit==='function'&&pu)?spotPhotoCredit(s.id):'';
}
function renderToday(){
  const s=recommendedSpot(),sc=SCORES[s.id];
  const full=Math.round(sc);
  const stars='★★★★★'.slice(0,full)+'☆☆☆☆☆'.slice(0,5-full);
  const dateStr=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  const actLab=`${sportIcon(activeSport||'surf')} ${activeSport?SPORTMAP[activeSport].label:'Surf'}`;
  document.getElementById('todayCard').innerHTML=`
    <div class="today-head"><span class="t"><span class="th"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.3"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2 17 7M7 17l-1.8 1.8"/></svg> Le spot du jour</span></span><span class="d">${dateStr}</span></div>
    <div class="today-hero" onclick="openSpot('${s.id}')">
      ${scene(s,false)}
      <img class="th-photo" id="todayPhoto" alt="" decoding="async">
      <div class="th-shade"></div>
      <div class="th-note">${sc.toFixed(1)} ★</div>
      <div class="th-credit" id="todayCredit"></div>
      <div class="th-cap">
        <div class="nm">${s.name.split(' — ')[0]}</div>
        <div class="rc">${actLab} · ${(typeof LVLTXT!=='undefined'&&LVLTXT[s.level])||s.level}</div>
      </div>
      <div class="cond-row">
        <div class="cond">${icoWind()}<div class="cv">${s.wind.split(' ')[0]}</div><div class="cl">Vent</div></div>
        <div class="cond">${icoSwell()}<div class="cv">${s.swell}</div><div class="cl">Houle</div></div>
        <div class="cond">${icoTemp()}<div class="cv">${s.temp}</div><div class="cl">Eau</div></div>
        <div class="cond">${icoTide()}<div class="cv small">${s.tide}</div><div class="cl">Marée</div></div>
      </div>
    </div>
    <div class="today-why" onclick="popPoulpy()">
      <svg class="poulpy-mini" id="octo" viewBox="0 0 140 140"></svg>
      <p id="octoBubble"></p>
    </div>`;
  setTodayPhoto(s);
  /* Poulpy vit maintenant DANS la carte : il explique le choix, la carte le nomme. */
  var _o=document.getElementById('octo');
  if(_o)_o.innerHTML=poulpySVG();
  var _ob=document.getElementById('octoBubble');
  if(_ob){
    {
      var _w=String(s.wind||''), _why=[];
      _why.push(/offshore|terre/i.test(_w) ? '<b>vent de terre</b>' : ('vent ' + _w.toLowerCase()));
      if(s.swell)_why.push('houle de ' + String(s.swell).replace(/ /g,'\u00a0'));
      if(s.temp)_why.push(s.temp + ' dans l\'eau');
      _ob.innerHTML = 'Pourquoi lui : ' + _why.join(', ') + '.';
    }
  }
  window.__obKeep=false;
}
function renderForecast(){
  const max=Math.max(...FORECAST.map(f=>f.v));
  const best=FORECAST.find(f=>f.best);
  document.getElementById('fcBest').innerHTML=`🤙 Meilleur créneau : <b>${best.d} matin</b> · houle ${best.v.toFixed(1)} m`;
  document.getElementById('fcBars').innerHTML=FORECAST.map(f=>{
    const h=Math.round(26+(f.v/max)*74);
    return `<div class="fc-col ${f.best?'best':''}"><div class="fc-val">${f.v.toFixed(1)}</div><div class="fc-bar" style="height:${h}%"></div><div class="fc-day">${f.d}</div></div>`;
  }).join('');
}
function cardinal(deg){if(deg==null||isNaN(deg))return '';return ['N','NE','E','SE','S','SO','O','NO'][Math.round(deg/45)%8];}
function renderConditions(s,live){
  const wind=live&&live.wind?live.wind:s.wind,swell=live&&live.swell?live.swell:s.swell,temp=live&&live.temp?live.temp:s.temp,tide=live&&live.tide?live.tide:s.tide;
  document.getElementById('dWeather').innerHTML=`
    <div class="wc">${icoWind()}<div class="v" style="font-size:12px">${wind}</div><div class="l">Vent</div></div>
    <div class="wc">${icoSwell()}<div class="v">${swell}</div><div class="l">Houle</div></div>
    <div class="wc">${icoTemp()}<div class="v">${temp}</div><div class="l">Eau</div></div>
    <div class="wc">${icoTide()}<div class="v" style="font-size:10.5px;">${tide}</div><div class="l">Marée</div></div>`;
  const head=document.getElementById('dCondHead');
  if(head)head.innerHTML=live?'Conditions du moment <span class="live-badge"><i></i>En direct</span>':'Conditions du moment';
}
function tideFromMarine(mar){
  const hh=(mar&&mar.hourly)||{};const t=hh.time||[],lv=hh.sea_level_height_msl||[];
  if(!t.length||!lv.length)return null;
  /* heures locales au spot : sans tideMs() on cherchait "maintenant" dans le
     fuseau du lecteur et le sens de la maree pouvait etre inverse. */
  const off=tideOffset(mar);
  const now=Date.now();let idx=0,best=Infinity;
  for(let i=0;i<t.length;i++){const d=Math.abs(tideMs(t[i],off)-now);if(d<best){best=d;idx=i;}}
  const cur=lv[idx];if(cur==null)return null;
  let nx=null;for(let i=idx+1;i<lv.length;i++){if(lv[i]!=null){nx=lv[i];break;}}
  let pv=null;for(let i=idx-1;i>=0;i--){if(lv[i]!=null){pv=lv[i];break;}}
  const rising=nx!=null?nx>cur:(pv!=null?cur>pv:true);
  return rising?'Montante ↑':'Descendante ↓';
}
async function fetchConditions(s){
  const c=COORDS[s.id];if(!c)return;
  try{
    const [w,mar]=await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto`).then(r=>r.json()).catch(()=>({})),
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${c.lat}&longitude=${c.lon}&current=wave_height,sea_surface_temperature&hourly=sea_level_height_msl&forecast_days=2&timezone=auto`).then(r=>r.json()).catch(()=>({}))
    ]);
    if(currentSpot!==s.id)return;
    const wc=w.current||{},mc=mar.current||{};
    const ws=wc.wind_speed_10m,wd=wc.wind_direction_10m,wv=mc.wave_height,sst=mc.sea_surface_temperature;
    const tide=tideFromMarine(mar);
    if(ws==null&&wv==null&&sst==null&&!tide)return;
    const o={
      wind:ws!=null?(`${Math.round(ws)} km/h ${cardinal(wd)}`).trim():s.wind,
      swell:wv!=null?`${(+wv).toFixed(1)} m`:s.swell,
      temp:sst!=null?`${Math.round(sst)}°C`:s.temp,
      tide:tide||s.tide,live:true
    };
    LIVE[s.id]=Object.assign(LIVE[s.id]||{},o);
    renderConditions(s,o);
    renderTideChart(mar);
  }catch(e){}
}
var _tideSeq=0;
function tideExtremes(ys,times){
  /* Extremums LOCAUX : l'ancienne version ne marquait que le max et le min
     globaux, donc une seule PM et une seule BM sur 24 h au lieu de deux. */
  var out=[],n=ys.length,w=2,i,j,hi,lo;
  for(i=w;i<n-w;i++){
    hi=true;lo=true;
    for(j=i-w;j<=i+w;j++){ if(j===i)continue;
      if(ys[j]>=ys[i])hi=false; if(ys[j]<=ys[i])lo=false; }
    if(hi||lo){
      if(out.length&&i-out[out.length-1].k<3)continue;
      out.push({k:i,v:ys[i],t:times[i],hi:hi});
    }
  }
  return out;
}
function tideFmt(v){ return (v>=0?'+':'−')+Math.abs(v).toFixed(1).replace('.',',')+' m'; }
/* AFFICHER une heure : on lit la chaine telle quelle. L'API marine est appelee
   avec timezone=auto, donc "2026-09-08T14:00" est deja l'heure murale DU SPOT ;
   la passer par new Date() la relirait dans le fuseau du lecteur. */
function tideHM(iso){
  var m=/T(\d\d):(\d\d)/.exec(iso||'');
  if(m)return (+m[1])+'h'+m[2];
  var d=new Date(iso); if(isNaN(d.getTime()))return '';
  return d.getHours()+'h'+(d.getMinutes()<10?'0':'')+d.getMinutes();
}
function tideH(iso){
  var m=/T(\d\d)/.exec(iso||'');
  return (m?(+m[1]):new Date(iso).getHours())+'h';
}
/* SITUER un instant : la meme chaine, mais convertie en instant reel grace a
   utc_offset_seconds. Sert a trouver le point "maintenant" et a calculer le
   compte a rebours, qui doit rester une duree vraie. */
function tideMs(iso,off){
  if(!iso)return NaN;
  if(/(Z|[+\-]\d\d:?\d\d)$/.test(iso.slice(10)))return new Date(iso).getTime(); /* fuseau explicite */
  var m=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso);
  if(!m)return new Date(iso).getTime();
  return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])-(off||0)*1000;
}
function tideOffset(mar){
  var o=mar&&mar.utc_offset_seconds;
  return (typeof o==='number')?o:-new Date().getTimezoneOffset()*60;
}
function tideUTC(off){
  var s=off<0?'−':'+',a=Math.abs(off),h=Math.floor(a/3600),m=Math.round(a%3600/60);
  return 'UTC'+s+h+(m?(':'+(m<10?'0':'')+m):'');
}
/* « 12 h de retard sur ton heure » : calcule, jamais ecrit en dur.
   Les fuseaux a la demi-heure (Inde, Sri Lanka) ou au quart (Nepal, Chatham)
   existent : "3,5 h" se lit mal, on ecrit "3 h 30". */
function tideGap(sec){
  var a=Math.abs(sec),h=Math.floor(a/3600),m=Math.round(a%3600/60);
  return h+' h'+(m?(' '+(m<10?'0':'')+m):'');
}
function tideTz(mar){
  var o=mar&&mar.utc_offset_seconds; if(typeof o!=='number')return '';
  var d=o-(-new Date().getTimezoneOffset()*60);
  return '<div class="tide-tz">Heures en <b>heure locale du spot</b>'
       + (d===0 ? ' — la même que la tienne.'
                : ' ('+tideUTC(o)+') · '+tideGap(d)
                  +(d>0?' d’avance sur ton heure.':' de retard sur ton heure.'))
       + '</div>';
}
function tideIn(ms){
  var m=Math.max(0,Math.round(ms/60000)),h=Math.floor(m/60);
  return h?('dans '+h+' h '+(m%60<10?'0':'')+(m%60)):('dans '+m+' min');
}
function renderTideChart(mar){
  var block=document.getElementById('dTideBlock'),el=document.getElementById('dTideChart');
  if(!block||!el)return;
  var hh=(mar&&mar.hourly)||{},t=hh.time||[],lv=hh.sea_level_height_msl||[];
  if(!t.length||!lv.length){block.style.display='none';return;}
  var off=tideOffset(mar);
  var now=Date.now(),idx=0,best=1e15,i;
  for(i=0;i<t.length;i++){var dd=Math.abs(tideMs(t[i],off)-now);if(dd<best){best=dd;idx=i;}}
  var start=Math.max(0,idx-2),ys=[],times=[];
  for(i=start;i<Math.min(t.length,start+25);i++){if(lv[i]==null)continue;ys.push(lv[i]);times.push(t[i]);}
  if(ys.length<6){block.style.display='none';return;}

  var n=ys.length,mn=Math.min.apply(null,ys),mx=Math.max.apply(null,ys),rng=(mx-mn)||1;
  var nowK=Math.max(0,Math.min(n-1,idx-start));
  var ext=tideExtremes(ys,times), next=null;
  for(i=0;i<ext.length;i++){ if(ext[i].k>nowK){ next=ext[i]; break; } }
  /* la pente au point courant dit si ça monte ou si ça descend */
  var a=ys[Math.max(0,nowK-1)],b=ys[Math.min(n-1,nowK+1)],slope=b-a;
  var etale=Math.abs(slope)<rng*0.04;
  var state=etale?'Étale':(slope>0?'Marée montante':'Marée descendante');
  var arrow=etale?'↔':(slope>0?'↑':'↓');

  /* --- 1. la réponse en toutes lettres --- */
  var head='<div class="tide-now"><div class="tide-state"><span class="ar">'+arrow+'</span>'+state+'</div></div>';
  head+='<div class="tide-when">';
  head+= next
    ? ((next.hi?'Pleine mer':'Basse mer')+' à <b>'+tideHM(next.t)+'</b> · '
       + tideIn(tideMs(next.t,off)-now))
    : 'Prochaine bascule au-delà de la fenêtre affichée.';
  head+=' <span class="tide-range">marnage '+ (mx-mn).toFixed(1).replace('.',',') +' m</span>';
  head+=tideTz(mar)+'</div>';
  var hd=document.getElementById('dTideHead'); if(hd)hd.innerHTML=head;

  /* --- 2. la courbe --- */
    /* La bande des graduations est SEPAREE du trace : une basse mer tombe pile sur
     la ligne de base, son libelle a donc besoin de sa propre place en dessous,
     sinon il se superpose aux heures (et a la courbe s'il passe au-dessus). */
  var W=340,H=158,padL=10,padR=10,topPad=24,botPad=44;
  function X(k){return padL+k/(n-1)*(W-padL-padR);}
  function Y(v){return topPad+(1-(v-mn)/rng)*(H-topPad-botPad);}
  var base=H-botPad;
  var d='M'+X(0).toFixed(1)+' '+Y(ys[0]).toFixed(1),k;
  for(k=1;k<n;k++)d+=' L'+X(k).toFixed(1)+' '+Y(ys[k]).toFixed(1);
  var area=d+' L'+X(n-1).toFixed(1)+' '+base+' L'+X(0).toFixed(1)+' '+base+' Z';
  var nowX=X(nowK);

  var s='<svg viewBox="0 0 '+W+' '+H+'" class="tidechart" id="tideSvg" '
      + 'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" '
      + 'role="img" aria-label="Niveau de la mer sur 24 heures">';
  s+='<defs><linearGradient id="tideG'+(++_tideSeq)+'" x1="0" y1="0" x2="0" y2="1">'
   + '<stop offset="0" stop-color="#3ab5dd" stop-opacity=".42"/>'
   + '<stop offset="1" stop-color="#3ab5dd" stop-opacity=".04"/></linearGradient></defs>';
  /* filets pleins et discrets : jamais de pointillés pour une grille */
  s+='<line x1="'+padL+'" y1="'+base+'" x2="'+(W-padR)+'" y2="'+base+'" stroke="#dce9f0" stroke-width="1"/>';
  s+='<path d="'+area+'" fill="url(#tideG'+_tideSeq+')"/>';
  s+='<path d="'+d+'" fill="none" stroke="#1583cb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

  /* Un point sur chaque bascule, mais UN SEUL libelle : celui de la prochaine.
     Legender les quatre faisait collisionner les libelles de basse mer avec les
     graduations horaires — et les quatre sont deja listees en toutes lettres
     sous le graphique, avec leur hauteur. */
  for(i=0;i<ext.length;i++){
    var e=ext[i],ex=X(e.k),ey=Y(e.v),isNext=(next&&e.k===next.k);
    s+='<circle cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="'+(isNext?4.5:3.2)+'" '
     + 'fill="'+(isNext?'#0d5f96':'#7fb6da')+'" stroke="#fff" stroke-width="2"/>';
    if(!isNext)continue;
    var lab=(e.hi?'PM ':'BM ')+tideHM(e.t);
    /* pleine mer : au-dessus du point ; basse mer : dans la bande libre sous la
       ligne de base, jamais dans le creux de la courbe */
    var ly=e.hi?(ey-11):(base+15);
    if(e.hi&&ly<12)ly=ey+18;
    var anch='middle',lx=ex;
    if(ex<44){anch='start';lx=padL;} else if(ex>W-44){anch='end';lx=W-padR;}
    s+='<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" font-size="10.5" font-weight="800" '
     + 'fill="#0d5f96" text-anchor="'+anch+'">'+lab+'</text>';
  }
  /* maintenant : trait plein, pas pointillé */
  s+='<line x1="'+nowX.toFixed(1)+'" y1="'+(topPad-6)+'" x2="'+nowX.toFixed(1)+'" y2="'+base+'" stroke="#ff8f7f" stroke-width="1.5"/>';
  s+='<circle cx="'+nowX.toFixed(1)+'" cy="'+Y(ys[nowK]).toFixed(1)+'" r="5" fill="#e8503f" stroke="#fff" stroke-width="2"/>';
  /* graduations horaires, dans leur propre bande */
  for(k=0;k<n;k+=6){
    s+='<text x="'+X(k).toFixed(1)+'" y="'+(H-8)+'" font-size="10" fill="#93a8b5" '
     + 'text-anchor="'+(k===0?'start':(k>=n-6?'end':'middle'))+'">'+tideH(times[k])+'</text>';
  }
  /* curseur de lecture */
  s+='<g id="tideCur" style="display:none"><line id="tideCurL" y1="'+(topPad-6)+'" y2="'+base+'" stroke="#0d5f96" stroke-width="1"/>'
   + '<circle id="tideCurD" r="4.5" fill="#0d5f96" stroke="#fff" stroke-width="2"/></g>';
  s+='<rect id="tideHit" x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent" style="cursor:crosshair"/>';
  s+='</svg>';
  el.innerHTML=s;

  /* --- 3. la liste des marées : l'équivalent texte de la courbe --- */
  var lst=document.getElementById('dTideList');
  if(lst){
    lst.innerHTML=ext.map(function(e){
      return '<span class="tide-ev '+(e.hi?'pm':'bm')+'"><span>'+(e.hi?'PM':'BM')+'</span>'
           + tideHM(e.t)+' · '+tideFmt(e.v)+'</span>';
    }).join('');
  }

  /* --- 4. lecture au doigt --- */
  var svg=document.getElementById('tideSvg'),hit=document.getElementById('tideHit'),
      cur=document.getElementById('tideCur'),curL=document.getElementById('tideCurL'),
      curD=document.getElementById('tideCurD'),read=document.getElementById('dTideRead');
  function scrub(ev){
    if(!svg||!read)return;
    var r=svg.getBoundingClientRect(),px=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left;
    var kk=Math.round((px/r.width*W-padL)/(W-padL-padR)*(n-1));
    kk=Math.max(0,Math.min(n-1,kk));
    cur.style.display='';
    curL.setAttribute('x1',X(kk));curL.setAttribute('x2',X(kk));
    curD.setAttribute('cx',X(kk));curD.setAttribute('cy',Y(ys[kk]));
    read.className='tide-read';
    read.innerHTML='<i></i>'+tideHM(times[kk])+' · '+tideFmt(ys[kk]);
  }
  function unscrub(){
    if(cur)cur.style.display='none';
    if(read){read.className='tide-read off';
      read.textContent='Glisse sur la courbe pour lire une heure.';}
  }
  if(hit){
    hit.addEventListener('pointerdown',function(e){e.preventDefault();scrub(e);});
    hit.addEventListener('pointermove',function(e){if(e.buttons||e.pointerType==='touch')scrub(e);});
    hit.addEventListener('pointerup',unscrub);
    hit.addEventListener('pointerleave',unscrub);
    hit.addEventListener('pointercancel',unscrub);
  }
  block.style.display='';
}
async function fetchAllConditions(){
  const spots=SPOTS.filter(s=>COORDS[s.id]);const chunk=40;
  for(let i=0;i<spots.length;i+=chunk){
    const part=spots.slice(i,i+chunk);
    const lats=part.map(s=>COORDS[s.id].lat).join(','),lons=part.map(s=>COORDS[s.id].lon).join(',');
    try{
      const [w,m]=await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto`).then(r=>r.json()).catch(()=>null),
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height,sea_surface_temperature&timezone=auto`).then(r=>r.json()).catch(()=>null)
      ]);
      const wa=w?(Array.isArray(w)?w:[w]):[],ma=m?(Array.isArray(m)?m:[m]):[];
      part.forEach((s,idx)=>{
        const wc=(wa[idx]||{}).current||{},mc=(ma[idx]||{}).current||{};const o={};
        if(wc.wind_speed_10m!=null){o.wind=(`${Math.round(wc.wind_speed_10m)} km/h ${cardinal(wc.wind_direction_10m)}`).trim();o.windK=Math.round(wc.wind_speed_10m);}
        if(mc.wave_height!=null){o.swell=`${(+mc.wave_height).toFixed(1)} m`;o.waveM=+mc.wave_height;}
        if(mc.sea_surface_temperature!=null)o.temp=`${Math.round(mc.sea_surface_temperature)}°C`;
        if(Object.keys(o).length){o.live=true;LIVE[s.id]=Object.assign(LIVE[s.id]||{},o);}
      });
      renderSpots();renderLiveTop();
    }catch(e){}
  }
}
function liveScore(s){
  var L=LIVE[s.id];if(!L||(L.waveM==null&&L.windK==null))return null;
  var sp=(activeSport&&spotSports(s).includes(activeSport))?activeSport:spotSports(s)[0];
  var wave=L.waveM!=null?L.waveM:1,wind=L.windK!=null?L.windK:12,sc;
  if(sp==='kitesurf'||sp==='windsurf'){sc=100-Math.abs(26-wind)*2.6-Math.max(0,wave-1.6)*9;}
  else if(sp==='baignade'||sp==='snorkeling'||sp==='plongee'||sp==='paddle'||sp==='kayak'){sc=100-wave*24-Math.max(0,wind-12)*2.6;}
  else{var ideal=s.level==='debutant'?0.9:(s.level==='expert'?2.4:1.5);sc=100-Math.abs(wave-ideal)*30-Math.max(0,wind-15)*2.2;}
  return Math.max(0,Math.min(100,Math.round(sc)));
}
function liveLabel(sc){return sc>=75?{t:'Excellent',c:'#2faf72'}:(sc>=55?{t:'Bon',c:'#1f9bbf'}:(sc>=35?{t:'Correct',c:'#f5a623'}:{t:'Calme',c:'#9fb4c0'}));}
/* Repli quand aucune mesure n'est encore arrivee (hors connexion, apercu
   artifact, ou requetes en cours). On montre les valeurs de REFERENCE deja
   embarquees avec chaque spot, et on le dit : les presenter comme des mesures
   du moment serait faux. La pastille porte donc la note de l'appli, pas un
   label "Excellent/Bon" qui, lui, se calcule sur des mesures reelles. */
function liveTopTitle(live){
  var t=document.getElementById('liveTopTitle');
  if(t)t.textContent=live?'Conditions du moment':'Spots les mieux notés';
}
function refTopHTML(){
  var list=SPOTS.filter(function(s){return !activeSport||spotSports(s).includes(activeSport);});
  list=list.map(function(s){
        return {s:s,sc:(typeof SCORES!=='undefined'&&SCORES[s.id])||0};})
      .sort(function(a,b){return b.sc-a.sc;}).slice(0,3);
  if(!list.length)return '<div class="lt-empty">Aucun spot pour cette activité.</div>';
  return list.map(function(o){
    var s=o.s,cond=[s.swell,String(s.wind).split(' ').slice(0,2).join(' '),s.temp]
      .filter(Boolean).join(' · ');
    return '<div class="lt-row" onclick="openSpot(\''+s.id+'\')">'
         + '<div class="lt-info"><b>'+s.name.split(' — ')[0]+'</b><span>'+cond+'</span></div>'
         + '<span class="lt-badge lt-ref">'+o.sc.toFixed(1)+' ★</span></div>';
  }).join('')
  + '<div class="lt-note">Valeurs de référence du spot. Les mesures du moment '
  + 's’affichent dès qu’elles arrivent.</div>';
}
function renderLiveTop(){
  var el=document.getElementById('liveTop');if(!el)return;
  var list=SPOTS.filter(function(s){return (!activeSport||spotSports(s).includes(activeSport))&&liveScore(s)!=null;});
  list=list.map(function(s){return {s:s,sc:liveScore(s)};}).sort(function(a,b){return b.sc-a.sc;}).slice(0,3);
  if(!list.length){ liveTopTitle(false); el.innerHTML=refTopHTML(); return; }
  liveTopTitle(true);
  el.innerHTML=list.map(function(o){var s=o.s,L=LIVE[s.id]||{},lab=liveLabel(o.sc);
    var cond=[(L.swell?L.swell:''),(L.wind?L.wind.split(' ').slice(0,2).join(' '):''),(L.temp||'')].filter(Boolean).join(' · ');
    return '<div class="lt-row" onclick="openSpot(\''+s.id+'\')"><div class="lt-info"><b>'+s.name.split(' — ')[0]+'</b><span>'+cond+'</span></div><span class="lt-badge" style="background:'+lab.c+'">'+lab.t+'</span></div>';}).join('');
}
function dayLabel(iso,i){if(i===0)return 'Auj';const d=new Date(iso);return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()]||'J+'+i;}
function renderForecastBars(barsId,bestId,days,vals,opt){
  opt=opt||{};var unit=opt.unit||'m',dec=unit==='km/h'?0:1;
  var max=Math.max.apply(null,vals)||1;
  var bi=opt.best==='min'?vals.indexOf(Math.min.apply(null,vals)):vals.indexOf(Math.max.apply(null,vals));
  if(bestId)document.getElementById(bestId).innerHTML=(opt.liveOn?'<span class="live-badge"><i></i>'+(opt.badge||'En direct')+'</span>':'🤙 ')+(opt.bestLabel||'Meilleur jour')+' : <b>'+days[bi]+'</b> · '+vals[bi].toFixed(dec)+' '+unit;
  document.getElementById(barsId).innerHTML=vals.map(function(v,i){var h=Math.round(26+(v/max)*74);return '<div class="fc-col '+(i===bi?'best':'')+'"><div class="fc-val">'+v.toFixed(dec)+'</div><div class="fc-bar" style="height:'+h+'%"></div><div class="fc-day">'+days[i]+'</div></div>';}).join('');
}
function renderMiniForecast(s,calm){
  const base=parseFloat(String(s.swell).replace(',','.'))||1.2;
  const days=['Auj','Dem','J+2','J+3','J+4'],mult=[1,0.85,1.15,1.3,0.95];
  renderForecastBars('dForecast','dFcBest',days,mult.map(m=>Math.max(0.4,+(base*m).toFixed(1))),{unit:'m',badge:'Houle estimée',best:calm?'min':'max',bestLabel:calm?'Mer la plus calme':'Meilleur jour'});
}
async function fetchWindDaily(id,n){
  const c=COORDS[id];if(!c)throw 0;
  const url='https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon+'&daily=wind_speed_10m_max&wind_speed_unit=kmh&timezone=auto&forecast_days='+n;
  const r=await fetch(url);const j=await r.json();const t=(j.daily||{}).time,v=(j.daily||{}).wind_speed_10m_max;
  if(!v||!v.length)throw 0;
  return {days:t.slice(0,n).map((iso,i)=>dayLabel(iso,i)),vals:v.slice(0,n).map(x=>Math.max(1,Math.round(+x)))};
}
async function fetchWaves(id,n){
  const c=COORDS[id];if(!c)throw 0;
  const url=`https://marine-api.open-meteo.com/v1/marine?latitude=${c.lat}&longitude=${c.lon}&daily=wave_height_max&timezone=auto&forecast_days=${n}`;
  const r=await fetch(url);const j=await r.json();
  const t=j.daily.time,v=j.daily.wave_height_max;
  if(!v||!v.length)throw 0;
  return {days:t.slice(0,n).map((iso,i)=>dayLabel(iso,i)),vals:v.slice(0,n).map(x=>Math.max(0.1,+(+x).toFixed(1)))};
}
function showForecastSkeleton(barsId,bestId){
  if(bestId)document.getElementById(bestId).innerHTML='<span class="live-badge"><i></i>Houle réelle</span> chargement…';
  const hs=[55,78,62,90,70];
  document.getElementById(barsId).innerHTML=hs.map(h=>`<div class="fc-col"><div class="fc-bar skel" style="height:${h}%"></div><div class="fc-day skel" style="width:20px;height:9px;border-radius:4px">&nbsp;</div></div>`).join('');
}
var CAL_ICO='<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3.2"/><path d="M3 9.5h18M8 3v4M16 3v4"/></svg> ';
async function realForecastDetail(s,act){
  var wind=(act==='kitesurf'||act==='windsurf');
  var calm=(act==='baignade'||act==='snorkeling'||act==='plongee'||act==='paddle'||act==='kayak');
  var head=document.getElementById('dFcHead');
  if(head)head.innerHTML=CAL_ICO+(wind?'Prévisions vent · 5 jours':(calm?'État de la mer · 5 jours':'Prévisions houle · 5 jours'));
  showForecastSkeleton('dForecast','dFcBest');
  try{
    if(wind){var fw=await fetchWindDaily(s.id,5);if(currentSpot!==s.id)return;renderForecastBars('dForecast','dFcBest',fw.days,fw.vals,{unit:'km/h',liveOn:true,badge:'Vent réel',bestLabel:'Le plus venté'});}
    else{var f=await fetchWaves(s.id,5);if(currentSpot!==s.id)return;renderForecastBars('dForecast','dFcBest',f.days,f.vals,{unit:'m',liveOn:true,badge:'Houle réelle',best:calm?'min':'max',bestLabel:calm?'Mer la plus calme':'Meilleur jour'});}
  }catch(e){if(currentSpot===s.id)renderMiniForecast(s,calm);}
}
async function realHomeForecast(){
  showForecastSkeleton('fcBars','fcBest');
  try{const s=recommendedSpot();const f=await fetchWaves(s.id,7);renderForecastBars('fcBars','fcBest',f.days,f.vals,{unit:'m',liveOn:true,badge:'Houle réelle'});}
  catch(e){renderForecast();}
}
function renderProg(){
  const pct=Math.min(100,Math.round(xp/LVL*100));
  const remain=Math.max(0,LVL-xp);
  document.getElementById('progCard').innerHTML=`
    <div class="prog-medal"><div class="lv">4</div><div class="nv">NIVEAU</div></div>
    <div class="prog-left">
      <div class="pl-top"><span class="lvlnum">Niveau 4</span><span class="lvlnext">→ Niv. 5 · Surfeur</span></div>
      <div class="progressbar" style="margin-top:9px"><i style="width:${pct}%"></i></div>
      <div class="pl-sub">Plus que <b>${remain} XP</b> pour le niveau suivant</div>
    </div>
    <a class="prog-next" onclick="go('challenges')"><b>Continue à progresser</b><span>Voir mes défis →</span></a>`;
}
var WAVE_ICON='<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5c2.2 0 2.2-2.4 4.4-2.4S8.6 8.5 10.8 8.5 13 6.1 15.2 6.1 17.4 8.5 19.6 8.5"/><path d="M2 14c2.2 0 2.2-2.4 4.4-2.4S8.6 14 10.8 14 13 11.6 15.2 11.6 17.4 14 19.6 14"/><path d="M2 19.5c2.2 0 2.2-2.4 4.4-2.4S8.6 19.5 10.8 19.5 13 17.1 15.2 17.1 17.4 19.5 19.6 19.5"/></svg>';
function renderActivityBar(){
  const el=document.getElementById('homeActivity');if(!el)return;
  const a=activeSport?SPORTMAP[activeSport]:{emoji:'🌊',label:'Tous les sports'};
  el.innerHTML=`<span class="ab-l"><span class="th"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg> Ton activité</span></span><span class="ab-v">${activeSport?sportIcon(activeSport):WAVE_ICON} ${a.label}</span><span class="ab-c">changer <svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5 12 15l5.5-5.5"/></svg></span>`;
}
function openActivityGate(){
  quickGate=true;chosenSport=activeSport||'all';
  const o=document.getElementById('onb');o.style.display='';o.classList.remove('hide');
  const t=document.getElementById('sportStepTitle');if(t)t.textContent='Quelle activité aujourd\'hui ?';
  renderSportGuide();showStep(1);
  const sel=chosenSport;document.querySelectorAll('#sportGrid .sport-card').forEach(c=>c.classList.toggle('sel',c.dataset.sp===sel));
}
function renderHomeStats(){
  /* une seule source de vérité : le carnet de sessions, comme au profil.
     Avant, l'accueil avait 12 et 7 écrits en dur et le profil disait 3 et 3. */
  var spots={}; sessions.forEach(function(s){ spots[s.spot]=1; });
  var vals={hsSessions:sessions.length, hsSpots:Object.keys(spots).length, hsEco:ecoLog.length};
  Object.keys(vals).forEach(function(id){
    var e=document.getElementById(id); if(!e)return;
    e.setAttribute('data-count', vals[id]);
    if(e.textContent!=='0'&&+e.textContent!==vals[id]) e.textContent=vals[id];
  });
  /* la tuile « Gestes écolo » de l'accueil ouvre le carnet, comme au profil */
  var ec=document.getElementById('hsEco'), p=ec&&ec.parentElement;
  if(p&&!p.getAttribute('data-ecolink')){
    p.setAttribute('data-ecolink','1');
    p.style.cursor='pointer';
    p.addEventListener('click', showEcoLog);
  }
}
function welcomeText(){
  /* Rien d'ecrit en dur : chaque chiffre vient de l'etat de l'app. On ne
     nomme aucun spot ici — c'est le travail de la carte du jour. */
  var nb   = (typeof SPOTS!=='undefined')?SPOTS.length:0,
      ses  = (typeof sessions!=='undefined'&&sessions)?sessions.length:0,
      ges  = (typeof ecoLog!=='undefined'&&ecoLog)?ecoLog.length:0,
      rest = (typeof xp==='number'&&typeof LVL==='number')?Math.max(0,LVL-xp):0;
  var tete = "Moi c'est <b>Poulpy</b>, ton guide océan.";
  /* L'XP restant n'est PLUS repete ici : la barre de l'en-tete, quarante pixels
     plus haut, affiche deja « 320 / 500 XP ». Poulpy garde le carnet — ca, c'est
     a lui — et dit ce que lui seul peut dire. */
  var ctx;
  if(ses || ges){
    var b=[];
    if(ses)b.push(ses + (ses>1?' sessions':' session'));
    if(ges)b.push(ges + (ges>1?' gestes':' geste') + ' pour l’océan');
    ctx = ' ' + b.join(' et ') + ' à ton carnet.';
  } else {
    ctx = ' Je connais les ' + nb + ' spots de l’appli : qui y vit, et comment'
        + ' les protéger.';
  }
  return tete + ctx + '<span class="bub-cta">Pose-moi une question →</span>';
}
function renderWelcome(){
  var o=document.getElementById('octoHi'), b=document.getElementById('welcomeBubble');
  if(o && !o.innerHTML)o.innerHTML=poulpySVG();
  if(!b)return;
  /* le mot de la fin d'onboarding passe devant, une seule fois */
  if(window.__obHello){ b.innerHTML=window.__obHello; window.__obHello=null; return; }
  b.innerHTML=welcomeText();
}
function renderHome(){renderWelcome();renderActivityBar();renderToday();renderForecast();renderProg();renderLiveTop();renderHomeStats();}

/* ================= CREATURES ================= */
function cShoeShark(){return `<svg viewBox="0 0 64 64"><defs><linearGradient id="ssk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9fb4c7"/><stop offset="100%" stop-color="#56707f"/></linearGradient></defs>
<path d="M8 28 q5 -15 27 -14 q15 1 19 9 q-7 0 -12 3 q9 3 12 10 q-11 -4 -20 -2 q-17 2 -26 -6Z" fill="url(#ssk)"/>
<path d="M28 13 q4 -9 8 -8 q-2 7 -4 10Z" fill="#4a6271"/>
<path d="M9 28 q-7 3 -9 9 q9 -1 12 -5Z" fill="#4a6271"/>
<path d="M12 30 q15 -6 30 -1 q-15 5 -30 1Z" fill="#dfe9ef"/>
<circle cx="42" cy="22" r="3.4" fill="#fff" stroke="#10130f" stroke-width="1"/><circle cx="43" cy="23" r="1.6" fill="#10130f"/>
<path d="M35 30 l2.5 2.5 2.5 -2.5 2.5 2.5 2.5 -2.5" stroke="#fff" stroke-width="1.3" fill="none"/>
<g stroke="#4a6271" stroke-width="3" stroke-linecap="round"><path d="M22 38 v6M34 40 v6"/></g>
<g transform="translate(22,48)"><path d="M-7 3 q-1 -5 4 -5 q4 0 6 3 l3 2 q2 1 0 3 l-14 0 q-1 -1 1 -3Z" fill="#fff" stroke="#1273b8" stroke-width="1"/><rect x="-7" y="5" width="15" height="2.4" rx="1" fill="#ff6f5e"/><path d="M-2 -1 q3 2 5 3" stroke="#ff6f5e" stroke-width="1.2" fill="none"/></g>
<g transform="translate(34,50)"><path d="M-7 3 q-1 -5 4 -5 q4 0 6 3 l3 2 q2 1 0 3 l-14 0 q-1 -1 1 -3Z" fill="#fff" stroke="#1273b8" stroke-width="1"/><rect x="-7" y="5" width="15" height="2.4" rx="1" fill="#ff6f5e"/><path d="M-2 -1 q3 2 5 3" stroke="#ff6f5e" stroke-width="1.2" fill="none"/></g></svg>`;}
function cPanpus(){return `<svg viewBox="0 0 64 64"><defs><radialGradient id="pap" cx="42%" cy="30%" r="72%"><stop offset="0%" stop-color="#c39ae8"/><stop offset="100%" stop-color="#7e4cc0"/></radialGradient></defs>
<ellipse cx="28" cy="56" rx="16" ry="3" fill="rgba(0,0,0,.1)"/>
<g fill="#8a59cc"><path d="M14 40 q-7 8 -7 15 q4 4 7 0 q-2 -7 5 -11Z"/><path d="M22 44 q-4 8 -2 13 q4 2 5 -2 q-2 -6 2 -9Z"/><path d="M34 44 q4 8 2 13 q-4 2 -5 -2 q2 -6 -2 -9Z"/></g>
<path d="M28 14 C16 14 11 27 11 36 C11 46 19 50 28 50 C37 50 45 46 45 36 C45 27 40 14 28 14Z" fill="url(#pap)"/>
<circle cx="23" cy="30" r="3" fill="#fff"/><circle cx="33" cy="30" r="3" fill="#fff"/><circle cx="23.5" cy="30.6" r="1.5" fill="#10130f"/><circle cx="33.5" cy="30.6" r="1.5" fill="#10130f"/>
<path d="M24 38 q4 3 8 0" stroke="#5a3a82" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M43 30 q10 -2 13 -8" stroke="#8a59cc" stroke-width="5" fill="none" stroke-linecap="round"/>
<g transform="translate(56,18)"><ellipse cx="0" cy="0" rx="9" ry="4.4" fill="#3a3a3f"/><ellipse cx="0" cy="-1" rx="7" ry="3" fill="#55555c"/><rect x="6" y="-1.4" width="11" height="2.8" rx="1.4" fill="#6e4a2a" transform="rotate(-18 6 0)"/></g></svg>`;}
function cScissorCrab(){return `<svg viewBox="0 0 64 64"><defs><radialGradient id="scc" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff7d5e"/><stop offset="100%" stop-color="#d3402a"/></radialGradient></defs>
<ellipse cx="32" cy="52" rx="16" ry="2.6" fill="rgba(0,0,0,.1)"/>
<g stroke="#c4392b" stroke-width="2.6" stroke-linecap="round"><path d="M18 40 l-7 4M46 40 l7 4M21 45 l-6 3M43 45 l6 3"/></g>
<ellipse cx="32" cy="40" rx="16" ry="11" fill="url(#scc)"/>
<g stroke="#b0b6bd" stroke-width="2" fill="none" stroke-linecap="round"><path d="M16 32 l-10 -6M16 30 l-10 2"/><path d="M48 32 l10 -6M48 30 l10 2"/></g>
<g fill="#ffce54"><circle cx="7" cy="24" r="2.6"/><circle cx="6" cy="31" r="2.6"/><circle cx="57" cy="24" r="2.6"/><circle cx="58" cy="31" r="2.6"/></g>
<circle cx="26" cy="37" r="2.2" fill="#fff"/><circle cx="38" cy="37" r="2.2" fill="#fff"/><circle cx="26.4" cy="37.5" r="1.2" fill="#10130f"/><circle cx="38.4" cy="37.5" r="1.2" fill="#10130f"/>
<path d="M28 44 q4 2 8 0" stroke="#7d2018" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;}
function cBallFish(){return `<svg viewBox="0 0 64 64"><defs><radialGradient id="bf" cx="42%" cy="32%" r="68%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#cfd8de"/></radialGradient></defs>
<ellipse cx="32" cy="55" rx="15" ry="3" fill="rgba(0,0,0,.1)"/>
<path d="M8 32 q-5 -4 -6 0 q1 4 6 4Z" fill="#9fb0bb"/><path d="M56 32 q5 -4 6 0 q-1 4 -6 4Z" fill="#9fb0bb"/>
<circle cx="32" cy="32" r="20" fill="url(#bf)"/>
<g fill="#1b2733"><path d="M32 22 l6 4 -2 7 -8 0 -2 -7Z"/><path d="M18 28 l5 1 1 6 -5 2 -4 -4Z"/><path d="M46 28 l-5 1 -1 6 5 2 4 -4Z"/><path d="M26 42 l6 2 6 -2 -2 -5 -8 0Z"/></g>
<g stroke="#9aa6b0" stroke-width="1" opacity=".5"><path d="M32 12 v6M14 26 l5 3M50 26 l-5 3"/></g>
<circle cx="24" cy="34" r="2" fill="#10130f"/><circle cx="40" cy="34" r="2" fill="#10130f"/>
<path d="M28 40 q4 2 8 0" stroke="#10130f" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></svg>`;}
function cBulbJelly(){return `<svg viewBox="0 0 64 64"><defs><radialGradient id="bj" cx="46%" cy="34%" r="60%"><stop offset="0%" stop-color="#fff6c0"/><stop offset="100%" stop-color="#ffd24a"/></radialGradient></defs>
<circle cx="32" cy="24" r="20" fill="#ffe98a" opacity=".25"/>
<path d="M22 32 q-3 -6 -3 -11 q0 -11 13 -11 q13 0 13 11 q0 5 -3 11Z" fill="url(#bj)"/>
<rect x="25" y="31" width="14" height="4" rx="1" fill="#b8b8be"/><rect x="26" y="35" width="12" height="3" rx="1" fill="#9a9aa0"/><path d="M27 38 q5 3 10 0Z" fill="#86868c"/>
<path d="M25 26 q7 -10 14 0" stroke="#cd9a2a" stroke-width="1" fill="none" opacity=".5"/>
<circle cx="27" cy="22" r="1.8" fill="#a06a08"/><circle cx="37" cy="22" r="1.8" fill="#a06a08"/>
<path d="M28 27 q4 2 8 0" stroke="#a06a08" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<g stroke="#e6b93a" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M28 40 q-2 10 0 18M34 40 q2 10 0 18M24 40 q-3 8 -1 14M40 40 q3 8 1 14"/></g></svg>`;}
function cCarousel(){return `<svg viewBox="0 0 64 64"><defs><linearGradient id="cz" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd062"/><stop offset="100%" stop-color="#e8930f"/></linearGradient></defs>
<rect x="30" y="6" width="4" height="52" rx="2" fill="#ffd24a"/>
<g stroke="#ff6f5e" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M30 10 l4 4M30 18 l4 4M30 26 l4 4M30 34 l4 4M30 42 l4 4M30 50 l4 4"/></g>
<circle cx="32" cy="6" r="3" fill="#ffce54"/>
<path d="M24 16 q12 1 12 13 q0 10 -8 14 q-6 4 -4 10 q2 7 9 6 q-3 5 -10 4 q-9 -2 -9 -12 q0 -8 7 -12 q5 -3 4 -9 q-1 -6 -7 -6 q2 -8 6 -8Z" fill="url(#cz)"/>
<path d="M14 34 q8 -3 14 0 q-1 4 -7 4 q-6 0 -7 -4Z" fill="#ff6f5e"/>
<path d="M10 25 q-6 1 -5 6 q5 -1 7 -4Z" fill="#cf7d0a"/>
<circle cx="18" cy="23" r="1.6" fill="#10130f"/>
<path d="M14 28 q4 2 7 0" stroke="#cf7d0a" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;}
function cLobPhone(){return `<svg viewBox="0 0 64 64"><defs><radialGradient id="lp" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff6a55"/><stop offset="100%" stop-color="#c8301c"/></radialGradient></defs>
<ellipse cx="30" cy="54" rx="16" ry="2.6" fill="rgba(0,0,0,.08)"/>
<path d="M26 18 q8 0 9 8 q1 8 -1 16 q-2 10 -7 16 q-5 -6 -7 -16 q-2 -8 -1 -16 q1 -8 7 -8Z" fill="url(#lp)"/>
<g stroke="#a8311f" stroke-width="1" opacity=".5"><path d="M22 34 h12M22 40 h12M23 46 h10"/></g>
<g stroke="#c8301c" stroke-width="2" stroke-linecap="round"><path d="M22 30 l-6 2M22 36 l-6 3M40 30 l6 2M40 36 l6 3"/></g>
<g stroke="#c8301c" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M28 16 q-3 -8 -8 -10M32 16 q3 -8 8 -10"/></g>
<path d="M44 30 q9 -3 12 2" stroke="#c8301c" stroke-width="3" fill="none" stroke-linecap="round"/>
<g transform="translate(54,26) rotate(30)"><rect x="-9" y="-3" width="18" height="5" rx="2.5" fill="#222"/><circle cx="-9" cy="0" r="3.5" fill="#222"/><circle cx="9" cy="0" r="3.5" fill="#222"/></g>
<circle cx="27" cy="26" r="1.6" fill="#10130f"/><circle cx="35" cy="26" r="1.6" fill="#10130f"/></svg>`;}
function cTankTurtle(){return `<svg viewBox="0 0 64 64"><defs><linearGradient id="tt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6fae5e"/><stop offset="100%" stop-color="#3f7a3a"/></linearGradient></defs>
<rect x="6" y="44" width="44" height="10" rx="5" fill="#444"/>
<g fill="#777"><circle cx="14" cy="49" r="3"/><circle cx="24" cy="49" r="3"/><circle cx="34" cy="49" r="3"/><circle cx="44" cy="49" r="3"/></g>
<path d="M8 44 q24 -28 44 0Z" fill="url(#tt)"/>
<g fill="none" stroke="#2f5e2c" stroke-width="1.2" opacity=".5"><path d="M14 41 q14 -10 28 0"/><path d="M22 32 v10M30 30 v12M38 32 v10"/></g>
<rect x="30" y="14" width="28" height="5" rx="2.5" fill="#3a3a3f" transform="rotate(-14 30 16)"/>
<circle cx="30" cy="20" r="6" fill="#4a4a50"/>
<ellipse cx="52" cy="42" rx="6" ry="5" fill="#6fae5e"/>
<circle cx="54" cy="41" r="1.4" fill="#10130f"/></svg>`;}
function cFenceNarwhal(){return `<svg viewBox="0 0 64 64"><defs><linearGradient id="fnb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9ec3e6"/><stop offset="100%" stop-color="#5a86b8"/></linearGradient></defs>
<ellipse cx="30" cy="52" rx="18" ry="2.6" fill="rgba(0,0,0,.08)"/>
<path d="M8 36 q4 -20 30 -20 q16 0 20 9 q-8 0 -14 3 q10 3 14 11 q-13 -4 -24 -2 q-18 3 -26 -1Z" fill="url(#fnb)"/>
<path d="M30 16 q4 -10 9 -9 q-2 7 -5 12Z" fill="#4f79ab"/>
<path d="M9 36 q-7 3 -9 10 q10 -1 13 -6Z" fill="#4f79ab"/>
<path d="M12 36 q14 -7 30 -1 q-14 6 -30 1Z" fill="#dcecf8"/>
<circle cx="49" cy="25" r="3.4" fill="#c9c9cf"/>
<path d="M51 24 l13 -5" stroke="#d7d7dd" stroke-width="2" stroke-linecap="round"/>
<circle cx="64" cy="19" r="1.4" fill="#8a8a90"/>
<path d="M30 14 q6 -3 11 0 q-1 -4 -6 -4 q-4 0 -5 4Z" fill="#c0392b"/><circle cx="35.5" cy="9.5" r="1.2" fill="#c0392b"/>
<circle cx="42" cy="27" r="1.5" fill="#10130f"/></svg>`;}
function cPlaneWhale(){return `<svg viewBox="0 0 64 64"><defs><linearGradient id="pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6f9cd6"/><stop offset="100%" stop-color="#365f9e"/></linearGradient></defs>
<path d="M22 34 l-14 8 18 -2Z" fill="#2f5690"/><path d="M40 34 l14 8 -18 -2Z" fill="#2f5690"/>
<path d="M8 32 q3 -16 24 -16 q22 0 26 14 q2 6 -2 10 q-11 6 -28 4 q-18 -2 -20 -12Z" fill="url(#pw)"/>
<path d="M10 30 q-7 -8 -10 -8 q1 6 4 11Z" fill="#2f5690"/>
<path d="M10 37 q19 8 40 2 q-3 5 -9 6 q-18 4 -31 -8Z" fill="#cfe2f7"/>
<circle cx="57" cy="30" r="2" fill="#222"/>
<g stroke="#444" stroke-width="2.4" stroke-linecap="round"><path d="M57 22 v16M49 30 h16"/></g>
<g stroke="#aecbef" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M26 16 q-2 -6 0 -9"/><path d="M26 16 q3 -6 5 -8"/></g>
<circle cx="20" cy="30" r="1.6" fill="#10130f"/>
<path d="M15 35 q5 3 10 0" stroke="#2f5690" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;}

const CREATURES=[
  {id:'shoeshark',name:'Squalo Scarpino',sp:'Requin-baskets',xp:0,svg:cShoeShark},
  {id:'panpus',name:'Polpo Padellino',sp:'Poulpe-poêle',xp:100,svg:cPanpus},
  {id:'scissorcrab',name:'Granchio Forbicino',sp:'Crabe-ciseaux',xp:250,svg:cScissorCrab},
  {id:'ballfish',name:'Pesce Pallone',sp:'Globe-ballon',xp:400,svg:cBallFish},
  {id:'bulbjelly',name:'Medusa Lampadina',sp:'Méduse-ampoule',xp:550,svg:cBulbJelly},
  {id:'carousel',name:'Cavalluccio Giostrino',sp:'Hippocampe-manège',xp:700,svg:cCarousel},
  {id:'lobphone',name:'Aragosta Telefonino',sp:'Homard-téléphone',xp:900,svg:cLobPhone},
  {id:'tankturtle',name:'Tartaruga Carrarmato',sp:'Tortue-tank',xp:1200,svg:cTankTurtle},
  {id:'fencenarwhal',name:'Narvalo Spadaccino',sp:'Narval-escrimeur',xp:1500,svg:cFenceNarwhal},
  {id:'planewhale',name:'Balena Aeroplanino',sp:'Baleine-avion',xp:1800,svg:cPlaneWhale}
];



function gswPair(a,b,on,sel){
  [[a,on],[b,!on]].forEach(function(p){
    var el=document.getElementById(p[0]); if(!el) return;
    el.style.display=p[1]?'':'none';
    var s=el.previousElementSibling;
    if(s&&s.classList&&s.classList.contains('sec')) s.style.display='none';
  });
  document.querySelectorAll(sel+' .gsw button').forEach(function(btn){
    btn.classList.toggle('on', btn.getAttribute('data-g')===(on?'a':'b'));
  });
}
/* Les Points Ocean : un score PROPRE a la competition, calcule sur des donnees
   reelles de l'app. Volontairement distinct de l'XP, qui pilote deja le niveau
   ; les voyages restent indépendants de ce score.
   Un geste vaut plus qu'une session : c'est la mission de l'app. */
var CMP_TIERS=[
  {n:'Bronze', k:'bronze', min:0},
  {n:'Argent', k:'argent', min:150},
  {n:'Or',     k:'or',     min:400},
  {n:'Platine',k:'platine',min:800}
];
function cmpPoints(){
  var g=(typeof ecoLog!=='undefined'&&ecoLog)?ecoLog.length:0,
      s=(typeof sessions!=='undefined'&&sessions)?sessions.length:0;
  return {pts:g*15+s*10, gestes:g, sessions:s};
}
function cmpTier(p){
  var cur=CMP_TIERS[0],nxt=null,i;
  for(i=0;i<CMP_TIERS.length;i++){ if(p>=CMP_TIERS[i].min)cur=CMP_TIERS[i]; }
  for(i=0;i<CMP_TIERS.length;i++){ if(CMP_TIERS[i].min>p){nxt=CMP_TIERS[i];break;} }
  return {cur:cur,next:nxt};
}
/* Epreuves reelles. Aucune date, aucune edition, aucun nom de sponsor de
   l'annee : ces noms changent tous les ans. Le lien pointe le site de
   l'organisateur, qui fait foi. `spot` relie au spot de l'appli quand il y est. */
var CMP_EVENTS=[
  {t:'Rip Curl Pro Bells Beach', when:'1–11 avril', org:'World Surf League', loc:'Bells Beach, Victoria, Australie', spot:'bells', url:'https://www.worldsurfleague.com/', d:'La plus ancienne compétition professionnelle de surf encore disputée, et l\'ouverture de la saison.'},
  {t:'Western Australia Margaret River Pro', when:'16–26 avril', org:'World Surf League', loc:'Margaret River, Australie-Occidentale', spot:'margaret', url:'https://www.worldsurfleague.com/', d:'Un gros récif exposé à la houle de l\'océan Indien, réputé pour ses vagues puissantes.'},
  {t:'Bonsoy Gold Coast Pro', when:'2–12 mai', org:'World Surf League', loc:'Gold Coast, Queensland, Australie', spot:'snapper', url:'https://www.worldsurfleague.com/', d:'Les longues droites de sable de la Gold Coast, où la vague peut dérouler sur des centaines de mètres.'},
  {t:'Corona Cero New Zealand Pro', when:'15–25 mai', org:'World Surf League', loc:'Raglan, Nouvelle-Zélande', spot:'raglan', url:'https://www.worldsurfleague.com/', d:'L\'une des plus longues gauches du monde, sur un fond de galets.'},
  {t:'Surf City El Salvador Pro', when:'5–15 juin', org:'World Surf League', loc:'Punta Roca, La Libertad, Salvador', spot:'puntaroca', url:'https://www.worldsurfleague.com/', d:'Une droite de pointe rapide, devenue l\'étape centraméricaine du circuit.'},
  {t:'VIVO Rio Pro', when:'19–27 juin', org:'World Surf League', loc:'Saquarema, Rio de Janeiro, Brésil', spot:'saquarema', url:'https://www.worldsurfleague.com/', d:'Le public brésilien y est le plus dense du circuit ; la vague est un beach break nerveux.'},
  {t:'Outerknown Tahiti Pro', when:'8–18 août', org:'World Surf League', loc:'Teahupo\'o, Tahiti, Polynésie française', spot:'teahupoo', url:'https://www.worldsurfleague.com/', d:'L\'étape la plus redoutée : une vague épaisse qui déferle sur un récif à fleur d\'eau.'},
  {t:'Fiji Pro', when:'25 août – 4 septembre', org:'World Surf League', loc:'Cloudbreak, Tavarua, Fidji', spot:'cloudbreak', url:'https://www.worldsurfleague.com/', d:'Une gauche de récif au large, à plusieurs centaines de mètres de la première île.'},
  {t:'Lexus Trestles Pro', when:'11–20 septembre', org:'World Surf League', loc:'Lower Trestles, Californie, États-Unis', spot:'trestles', url:'https://www.worldsurfleague.com/', d:'Une vague régulière et joueuse, longtemps utilisée pour désigner le champion du monde.'},
  {t:'MEO Rip Curl Pro Portugal', when:'16–25 octobre', org:'World Surf League', loc:'Supertubos, Peniche, Portugal', spot:'supertubos', url:'https://www.worldsurfleague.com/', d:'Le beach break le plus tubulaire d\'Europe, surnommé « le Pipeline européen ».'},
  {t:'Philippines Pro', when:'31 octobre – 10 novembre', org:'World Surf League', loc:'Cloud 9, Siargao, Philippines', spot:'cloud9', url:'https://www.worldsurfleague.com/', d:'Une droite de récif courte et creuse, au-dessus d\'un platier peu profond.'},
  {t:'Lexus Pipe Masters', when:'8–20 décembre', org:'World Surf League', loc:'Banzai Pipeline, Oahu, Hawaï', spot:'pipeline', url:'https://www.worldsurfleague.com/', d:'La finale de la saison, sur le tube le plus photographié du monde.'},
];
function renderCompetition(){
  var body=document.getElementById('cmpBody');
  if(body){
    var p=cmpPoints(),T=cmpTier(p.pts);
    var lo=T.cur.min, hi=T.next?T.next.min:T.cur.min;
    var pct=T.next?Math.max(4,Math.min(100,Math.round((p.pts-lo)/((hi-lo)||1)*100))):100;
    var h='<div class="cmp-score"><div class="cmp-pts">'+p.pts+'<span>points océan</span></div>'
        + '<span class="cmp-tier t-'+T.cur.k+'"><span class="dot"></span>'+T.cur.n+'</span></div>';
    h+='<div class="cmp-bar"><div class="cmp-fill" style="width:'+pct+'%"></div></div>';
    h+='<div class="cmp-next">'+(T.next
        ? ('Encore <b>'+(T.next.min-p.pts)+' points</b> pour passer '+T.next.n+'.')
        : 'Palier maximum atteint. Continue, le compteur ne s\'arrête pas.')+'</div>';
    h+='<div class="cmp-rules">'
      + cmpRule('feuille','Un geste pour l\'océan',15,p.gestes)
      + cmpRule('planche','Une session notée',10,p.sessions)
      + '</div>';
    body.innerHTML=h;
  }
  var ev=document.getElementById('cmpEvents');
  if(ev){
    ev.innerHTML=CMP_EVENTS.map(function(e){
      var sp=e.spot&&typeof SPOTS!=='undefined'&&SPOTS.some(function(x){return x.id===e.spot;});
      return '<div class="evt"><div class="evt-t">'+e.t+'</div>'
        + '<div class="evt-m">'+e.when+' · '+e.loc+'</div>'
        + '<div class="evt-o">'+e.org+'</div>'
        + '<div class="evt-d">'+e.d+'</div>'
        + '<div class="evt-a">'
        + '<a class="off" href="'+e.url+'" target="_blank" rel="noopener noreferrer">'
        + uic('fleche')+' Site officiel</a>'
        + (sp?('<button type="button" onclick="openSpot(\''+e.spot+'\');go(\'detail\')">'+uic('pin')+' Voir le spot</button>'):'')
        + '</div></div>';
    }).join('');
  }
}
function cmpRule(ic,label,pts,n){
  return '<div class="cmp-rule">'+uic(ic)+'<span class="rt">'+label
       + (n?(' <b>×'+n+'</b>'):'')+'</span><span class="rn">+'+pts+' pts</span></div>';
}
function chalShow(g){ gswPair('ecoChallenges','surfChallenges',g==='a','#challenges'); }
/* ================= ONBOARDING ================= */
let onbStep=0,chosenLevel=null,chosenSport=null,quickGate=false;
function renderSportGuide(){
  const g=document.getElementById('sportGrid');if(!g)return;
  let h=SPORTS.map(s=>`<div class="sport-card" data-sp="${s.id}" onclick="pickSport(this,'${s.id}')"><div class="se" style="background:linear-gradient(135deg,${s.color}33,${s.color}1a);box-shadow:inset 0 0 0 2px ${s.color}4d">${sportIcon(s.id)}</div><h4>${s.label}</h4><p>${s.desc}</p></div>`).join('');
  h+=`<div class="sport-card" data-sp="all" onclick="pickSport(this,'all')"><div class="se" style="background:linear-gradient(135deg,#bfe9f733,#bfe9f71a);box-shadow:inset 0 0 0 2px #9fd6ee4d">🌊</div><h4>Tout voir</h4><p>Tous les sports</p></div>`;
  g.innerHTML=h;
}
function pickSport(el,id){document.querySelectorAll('#sportGrid .sport-card').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');chosenSport=id;}
function onbBubbles(){let h='';for(let i=0;i<14;i++){const s=4+Math.random()*16;h+=`<i class="obub" style="left:${Math.random()*100}%;bottom:-30px;width:${s}px;height:${s}px;animation-duration:${5+Math.random()*6}s;animation-delay:${Math.random()*6}s"></i>`;}document.getElementById('onbBubbles').innerHTML=h;}
function showStep(n){document.querySelectorAll('.onb-step').forEach(s=>s.classList.toggle('active',+s.dataset.step===n));onbStep=n;}
function onbNext(){
  if(onbStep===1&&!chosenSport){toast('Choisis une activité 🐙');return;}
  if(quickGate&&onbStep===1){finishOnb();return;}
  if(onbStep===2&&!chosenLevel){toast('Choisis ton niveau 🐙');return;}
  showStep(Math.min(3,onbStep+1));
}
function pickLevel(el){document.querySelectorAll('.lvl-card').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');chosenLevel=el.dataset.lvl;}
function finishOnb(){const o=document.getElementById('onb');o.classList.add('hide');setTimeout(()=>o.style.display='none',560);
  quickGate=false;
  activeSport=(chosenSport&&chosenSport!=='all')?chosenSport:null;
  renderSportFilters();renderSpots();if(leafMap)renderMap(true);
  const st=document.getElementById('spotsTitle');if(st)st.innerHTML=activeSport?`${sportIcon(activeSport)} Spots · ${SPORTMAP[activeSport].label}`:'<span class="th"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg> Spots & activités</span>';
  const spName=activeSport?` pour le ${SPORTMAP[activeSport].label.toLowerCase()}`:'';
  if(chosenLevel){const lab={debutant:'faciles 🟢',intermediaire:'intermédiaires 🟡',expert:'engagés 🔴'}[chosenLevel];
    window.__obHello=`Coucou, c'est <b>Poulpy</b> 🐙 ! Je t'ai préparé une sélection de spots ${lab}${spName}. On explore ?<span class="bub-cta">Une question sur l’océan ? Écris-moi →</span>`;}
  saveState();window.__obKeep=true;renderHome();realHomeForecast();go('home');}

/* ================= XP ================= */
let xp=320;const LVL=500;
function popPoulpy(){['octo','octoHi'].forEach(function(id){var o=document.getElementById(id);if(!o)return;o.classList.remove('pop');void o.offsetWidth;o.classList.add('pop');});}
function addXP(n,msg){
  const before=xp;xp+=n;let pct=Math.min(100,Math.round(xp/LVL*100));
  document.getElementById('xpFill').style.width=pct+'%';
  let remain=Math.max(0,LVL-xp);
  document.getElementById('xpText').textContent=`${xp} / ${LVL} XP`;
  toast(msg||`+${n} XP !`);popPoulpy();
  renderProg();renderProfile();renderCompetition();saveState();
  if(before<LVL&&xp>=LVL){spawnConfetti();vibrate([14,45,14]);}else{vibrate(12);}
  if(xp>=LVL)setTimeout(()=>toast('🎉 Niveau 5 ! Poulpy a un nouveau chapeau !'),2600);
}
function spawnConfetti(){
  const c=document.getElementById('confetti');if(!c)return;
  const cols=['#ff7d6e','#ffce54','#36b5d8','#7fe3d4','#9b6bd1','#3ec98a'];const stars=['✨','⭐','🌟'];let h='';
  for(let i=0;i<38;i++){const l=Math.random()*100,d=1.2+Math.random()*0.9,dl=Math.random()*0.5,rot=Math.random()*360;
    if(i%5===0){h+=`<i class="star" style="left:${l}%;animation-duration:${d}s;animation-delay:${dl}s;transform:rotate(${rot}deg)">${stars[i%stars.length]}</i>`;}
    else{const col=cols[i%cols.length];h+=`<i style="left:${l}%;background:${col};animation-duration:${d}s;animation-delay:${dl}s;transform:rotate(${rot}deg)"></i>`;}}
  c.innerHTML=h;setTimeout(()=>{c.innerHTML='';},2800);
}
function completeDaily(btn){btn.textContent='✓';btn.classList.add('done');btn.style.background='linear-gradient(135deg,#4fd99a,#2faf72)';addXP(50,'Défi du jour validé ! +50 XP');}
function claimEco(btn,i){
  /* valider un défi écolo écrit une ligne dans le carnet : le compteur de
     l'accueil et du profil ne peut plus mentir. */
  if(btn.classList.contains('done'))return;
  var ch=ECO[i]; if(!ch)return;
  btn.textContent='✓ Fait'; btn.classList.add('done');
  ecoAdd(ch.title,'');
  addXP(ch.xp,'Défi validé ! +'+ch.xp+' XP');
}
function claimChallenge(btn,xpv){if(btn.classList.contains('done'))return;btn.textContent='✓ Fait';btn.classList.add('done');addXP(xpv,`Défi validé ! +${xpv} XP`);}
function logSession(){
  const s=SPOTS.find(x=>x.id===currentSpot);
  if(s){var sp0=(activeSport&&spotSports(s).includes(activeSport))?activeSport:spotSports(s)[0];
    sessions.unshift({spot:s.name.split(' — ')[0],date:new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),act:sp0});}
  renderSessions();saveState();addXP(40,'Session enregistrée ! +40 XP 🏄');go('profile');
}

/* ================= UI ================= */
let tt;
function toast(msg){const t=document.getElementById('toast');t.innerHTML='🐙 '+msg;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600);}
const HEADBUB={home:'hb',profile:'pb',spots:'sb',challenges:'cb',trips:'tb'};
function vibrate(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(e){}}
const SCREEN_ORDER={home:0,spots:1,detail:2,challenges:3,profile:4,trips:2};
function resetScreenLive(el){el.classList.remove('sw-live');el.style.top='';el.style.left='';el.style.right='';el.style.transform='';el.style.opacity='';el.style.transition='';}
function updateNavPill(s){
  const pill=document.getElementById('navPill');if(!pill)return;
  const btn=document.querySelector('.nav button[data-s="'+s+'"]:not(.center)');
  if(!btn){pill.style.opacity='0';return;}
  const left=btn.offsetLeft+(btn.offsetWidth-42)/2;
  const colors={home:'rgba(17,117,189,.14)',spots:'rgba(31,155,191,.14)',profile:'rgba(155,107,209,.16)',trips:'rgba(33,84,221,.16)'};
  pill.style.transform='translateX('+left+'px)';
  pill.style.background=colors[s]||'rgba(18,115,184,.12)';
  pill.style.opacity='1';
}
let goTimer=null;
let liveScreenId=(document.querySelector('.screen.active')||{id:'home'}).id;
function go(s){
  if(s!=='spots'&&typeof setMapFull==='function')setMapFull(false);
  const wrap=document.getElementById('screenWrap');
  const target=document.getElementById(s);
  if(!target)return;
  const curId=liveScreenId;
  const cur=(curId&&curId!==s)?document.getElementById(curId):null;
  liveScreenId=s;
  document.body.dataset.screen=s;
  window.dispatchEvent(new CustomEvent("ocean:navigate",{detail:s}));
  if(goTimer){clearTimeout(goTimer);goTimer=null;
    wrap.querySelectorAll('.screen.active').forEach(el=>{if(el!==target&&el!==cur){el.classList.remove('active');resetScreenLive(el);}});
    if(cur)resetScreenLive(cur);
    wrap.style.minHeight='';wrap.classList.remove('transitioning');}
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.s===s));
  updateNavPill(s);
  if(cur)vibrate(8);
  if(HEADBUB[s])bubbles(HEADBUB[s]);
  const reduce=document.body.classList.contains('reduce-motion')||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(!cur||reduce){
    wrap.querySelectorAll('.screen.active').forEach(el=>{if(el!==target){el.classList.remove('active');resetScreenLive(el);}});
    resetScreenLive(target);
    target.classList.add('active');
    wrap.scrollTop=0;
    if(s==='home')animateCounts();
    if(s==='profile')renderProfile();
    return;
  }
  const dirFrom=SCREEN_ORDER.hasOwnProperty(cur.id)?SCREEN_ORDER[cur.id]:0;
  const dirTo=SCREEN_ORDER.hasOwnProperty(s)?SCREEN_ORDER[s]:0;
  const dir=dirTo>=dirFrom?1:-1;
  wrap.style.minHeight=wrap.clientHeight+'px';
  wrap.classList.add('transitioning');
  wrap.scrollTop=0;
  resetScreenLive(target);
  target.classList.add('active');
  target.classList.add('sw-live','sw-done');cur.classList.add('sw-live','sw-done');
  target.style.opacity='0';target.style.transform='translateX('+(dir*24)+'px)';
  void target.offsetWidth;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    target.style.transition='transform .4s cubic-bezier(.22,.9,.3,1.02), opacity .34s ease';
    cur.style.transition='transform .36s cubic-bezier(.4,0,.2,1), opacity .3s ease';
    target.style.transform='translateX(0)';target.style.opacity='1';
    cur.style.transform='translateX('+(-dir*18)+'px)';cur.style.opacity='0';
  }));
  goTimer=setTimeout(()=>{
    goTimer=null;
    cur.classList.remove('active');
    resetScreenLive(cur);resetScreenLive(target);
    wrap.style.minHeight='';wrap.classList.remove('transitioning');
    if(s==='home')animateCounts();
    if(s==='profile')renderProfile();
  },420);
}
function countUp(el){const t=+el.dataset.count;let c=0;const step=Math.max(1,Math.ceil(t/22));
  const id=setInterval(()=>{c+=step;if(c>=t){c=t;clearInterval(id);}el.textContent=c;},30);}
function animateCounts(){document.querySelectorAll('[data-count]').forEach(countUp);}
function bubbles(id){
  const c=document.getElementById(id);if(!c)return;let h='';
  for(let i=0;i<9;i++){const sz=4+Math.random()*10;h+=`<i style="left:${Math.random()*100}%;width:${sz}px;height:${sz}px;animation-duration:${4+Math.random()*4}s;animation-delay:${Math.random()*4}s"></i>`;}
  c.innerHTML=h;
}

/* ================= POULPY ASSISTANT ================= */
const QUICK=[["🏄 Quel spot aujourd'hui ?",'spot'],['🛟 Sécurité','secu'],['🌱 Geste écolo','eco'],['📈 Ma progression','prog']];
const SECU=[
  "Avant d'entrer, observe la mer 5 min : repère les zones où l'eau retourne vers le large, ce sont les <b>baïnes</b>. Évite-les ! 🌀",
  "Reste toujours <b>entre les drapeaux</b> et ne surfe jamais seul quand la houle est grosse.",
  "Pris dans un courant ? <b>Ne lutte pas de face</b> : laisse-toi porter et nage parallèle à la plage pour en sortir.",
  "Au canard, garde ta planche <b>du côté de la vague</b> et protège ta tête à la remontée.",
  "Vérifie les <b>horaires de marée</b> : beaucoup de spots ne marchent qu'à marée basse ou haute. 🌙",
  "Échauffe-toi avant la session et garde toujours un œil sur les autres surfeurs autour de toi."
];
const ECO_T=[
  "Ramasse <b>3 déchets</b> à chaque session : si chaque surfeur le fait, les plages restent propres 🌊",
  "Viens avec une <b>gourde réutilisable</b> plutôt qu'une bouteille en plastique.",
  "Utilise une <b>wax écologique</b> et une crème solaire sans filtres nocifs pour les coraux.",
  "Covoiture ou viens à vélo au spot pour réduire ton empreinte carbone 🚲",
  "Signale les animaux en détresse ou les pollutions que tu croises : tu deviens un vrai gardien de l'océan 🐢"
];
let chatSeeded=false;
function renderQuick(){document.getElementById('chatQuick').innerHTML=QUICK.map(q=>`<div class="qchip" onclick="quick('${q[1]}')">${q[0]}</div>`).join('');}
function openChat(){
  document.getElementById('chatSheet').classList.add('open');
  setChatStatus();
  const fab=document.getElementById('poulpyFab');fab.classList.add('seen');fab.style.display='none';
  if(!chatSeeded){chatSeeded=true;
    addMsg('bot',"Coucou, c'est <b>Poulpy</b> 🐙 ! Demande-moi ce que tu veux sur l'océan : un <b>spot</b> à surfer, de la <b>technique</b> (take-off, canard…), la <b>faune marine</b> (requins, dauphins, méduses…), la <b>météo des vagues</b> (houle, marées, vent), l'<b>écologie</b> ou ta <b>progression</b>. Tu peux aussi me déplacer en glissant cette barre 👆");}
}
function closeChat(){document.getElementById('chatSheet').classList.remove('open');const f=document.getElementById('poulpyFab');f.style.display='';}
function chatDragInit(){
  const sheet=document.getElementById('chatSheet'),head=sheet.querySelector('.chat-head');if(!head||head._drag)return;head._drag=1;
  let on=false,sx,sy,sl,st;
  head.addEventListener('pointerdown',e=>{if(e.target.closest('.chat-close'))return;on=true;head.setPointerCapture(e.pointerId);
    const r=sheet.getBoundingClientRect(),pr=sheet.parentElement.getBoundingClientRect();sl=r.left-pr.left;st=r.top-pr.top;sx=e.clientX;sy=e.clientY;sheet.style.transition='none';});
  head.addEventListener('pointermove',e=>{if(!on)return;const pr=sheet.parentElement.getBoundingClientRect();
    let nl=sl+(e.clientX-sx),nt=st+(e.clientY-sy);
    nl=Math.max(6,Math.min(pr.width-sheet.offsetWidth-6,nl));nt=Math.max(6,Math.min(pr.height-sheet.offsetHeight-6,nt));
    sheet.style.left=nl+'px';sheet.style.top=nt+'px';sheet.style.right='auto';sheet.style.bottom='auto';});
  const end=()=>{on=false;sheet.style.transition='';};
  head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
}
function addMsg(who,html,btn){
  const m=document.createElement('div');m.className='msg '+who;
  m.innerHTML=(who==='bot'?`<div class="msg-av">${octoTag()}</div>`:'')+`<div class="bubble2">${html}${btn?`<button class="msg-btn" onclick="${btn.onclick}">${btn.label}</button>`:''}</div>`;
  const c=document.getElementById('chatMsgs');c.appendChild(m);c.scrollTop=c.scrollHeight;
}
function showTyping(){const c=document.getElementById('chatMsgs');const m=document.createElement('div');m.className='msg bot typing';m.id='typingMsg';m.innerHTML=`<div class="msg-av">${octoTag()}</div><div class="bubble2"><i></i><i></i><i></i></div>`;c.appendChild(m);c.scrollTop=c.scrollHeight;}
function hideTyping(){const t=document.getElementById('typingMsg');if(t)t.remove();}
function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
/* ===== Poulpy IA (backend optionnel) + repli local ===== */
const POULPY_API='/.netlify/functions/poulpy';
let aiState='unknown';            // 'unknown' | 'on' | 'off'
let chatHistory=[];               // {role,content}
function setChatStatus(){const el=document.getElementById('chatStatus');if(!el)return;
  el.innerHTML=aiState==='on'?'<span class="dot-on"></span> IA en ligne':'<span class="dot-on" style="background:#ffd23e;box-shadow:0 0 7px #ffd23e"></span> Mode local';}
function aiSpotsIndex(){return SPOTS.map(function(s){return s.name.split(' — ')[0]+' ('+s.loc+') · '+lvlLabel[s.level].replace(/<[^>]+>/g,'')+' · '+spotSports(s).map(function(id){return SPORTMAP[id].label;}).join('/');}).join('\n');}
function aiContext(){
  var c='Utilisateur : niveau '+(chosenLevel||'non défini')+', activité choisie '+(activeSport?SPORTMAP[activeSport].label:'toutes')+'.';
  if(currentSpot&&document.getElementById('detail').classList.contains('active')){
    var s=SPOTS.find(function(x){return x.id===currentSpot;});
    if(s){c+='\nFiche ouverte : '+s.name+' — '+s.loc+' ('+lvlLabel[s.level].replace(/<[^>]+>/g,'')+'). '+s.desc;
      if(FAUNA[s.id])c+=' Faune : '+FAUNA[s.id];
      if(typeof ZONES!=='undefined'&&ZONES[s.id])c+=' Zones : '+ZONES[s.id].map(function(z){return z.n+' ('+z.d+')';}).join(' ; ')+'.';}
  }
  return c;
}
async function askPoulpyAI(text){
  var res=await fetch(POULPY_API,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({message:text,history:chatHistory.slice(-8),context:aiContext(),spots:aiSpotsIndex()})});
  if(!res.ok)throw new Error('http '+res.status);
  var data=await res.json();
  if(!data.reply)throw new Error('no reply');
  return data.reply;
}
function aiFormat(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
function chatSend(text){text=(text||'').trim();if(!text)return;addMsg('user',esc(text));showTyping();
  if(aiState==='off'){setTimeout(function(){hideTyping();var r=poulpyReply(text);addMsg('bot',r.html,r.btn);chatHistory.push({role:'user',content:text});},600+Math.random()*400);return;}
  askPoulpyAI(text).then(function(reply){
    hideTyping();aiState='on';setChatStatus();
    addMsg('bot',aiFormat(reply));
    chatHistory.push({role:'user',content:text});chatHistory.push({role:'assistant',content:reply});
  }).catch(function(){
    aiState='off';setChatStatus();hideTyping();
    var r=poulpyReply(text);addMsg('bot',r.html,r.btn);chatHistory.push({role:'user',content:text});
  });
}
function chatSendInput(){const i=document.getElementById('chatInput');chatSend(i.value);i.value='';}
function quick(t){const map={spot:"Quel spot tu me conseilles aujourd'hui ?",secu:"Donne-moi un conseil de sécurité",eco:"Un geste écolo à faire ?",prog:"Où en est ma progression ?"};chatSend(map[t]);}
function openFromChat(s){closeChat();go(s);}
function openSpotFromChat(id){closeChat();openSpot(id);}
/* ---- Poulpy : connaissances spots, faune & planches ---- */
const ALIAS={jbay:['j-bay','jeffreys'],teahupoo:['teahupo'],pipeline:['banzai','oahu'],puerto:['escondido','zicatela'],lapalmyre:['royan','pontaillac'],capferret:['ferret'],lafitenia:['jean-de-luz','luz'],guethary:['parlementia'],anchorpoint:['taghazout','anchor'],cloud9:['siargao'],skeletonbay:['skeleton'],dungeons:['cape town','sentinelle'],mavericks:['maverick'],snapper:['superbank'],mardelplata:['mar del'],puntadelobos:['pichilemu'],puntaroca:['libertad'],waikiki:['honolulu'],nazare:['nazaré'],biarritz:['basques'],floripa:['florianopolis'],supertubos:['peniche']};
const FAUNA={pipeline:"récif corallien d'Oahu : tortues vertes (honu) 🐢, poissons-perroquets, raies, dauphins à long bec et requins de récif.",teahupoo:"lagon corallien tahitien : poissons tropicaux multicolores, raies, tortues 🐢 et requins de récif à pointes noires.",uluwatu:"récif balinais : poissons tropicaux, raies, tortues et parfois des requins de récif.",padang:"récif balinais grouillant de poissons coralliens, de raies et de tortues 🐢.",jbay:"côte sud-africaine : dauphins par centaines, otaries du Cap, baleines en saison 🐋… et des requins blancs au large.",dungeons:"eaux froides du Cap : otaries, dauphins, baleines de passage et requins blancs.",nazare:"au-dessus d'un canyon profond : dauphins, thons et faune de pleine mer.",chicama:"courant froid de Humboldt : otaries, pélicans et immenses bancs d'anchois.",mavericks:"Californie froide (le « Triangle rouge ») : otaries, loutres de mer 🦦 et requins blancs.",skeletonbay:"désert côtier namibien : des milliers d'otaries à fourrure et une eau riche en poissons.",cloudbreak:"récif fidjien : poissons tropicaux, raies, tortues et requins de récif.",mentawai:"archipel indonésien : récifs grouillant de poissons, de raies et de tortues.",hossegor:"côte landaise : bars, dorades, dauphins 🐬 et de nombreux oiseaux marins.",biarritz:"Pays Basque : dauphins, bars, et parfois des globicéphales au large."};
const ZONES={
  hossegor:[{n:'La Gravière',l:'expert',d:'tubes puissants et rapides'},{n:'La Centrale / La Nord',l:'intermediaire',d:'pics plus ouverts'},{n:'Les Culs Nus',l:'intermediaire',d:'plage moins dense'}],
  pipeline:[{n:'First Reef',l:'expert',d:'la gauche tubulaire principale'},{n:'Backdoor',l:'expert',d:'la droite qui part du même pic'},{n:'Second Reef',l:'expert',d:'au large par gros swell'}],
  teahupoo:[{n:'Le pic (End of the Road)',l:'expert',d:'gauche surpuissante sur récif peu profond'},{n:'Le channel',l:'intermediaire',d:"zone d'observation, accès bateau"}],
  nazare:[{n:'Praia do Norte',l:'expert',d:'vagues géantes (canyon sous-marin)'},{n:'Praia da Vila',l:'debutant',d:'plage abritée pour débuter'}],
  uluwatu:[{n:'The Peak',l:'expert',d:'pic principal'},{n:'Racetracks',l:'expert',d:'section rapide à marée basse'},{n:'Temples',l:'intermediaire',d:'épaule plus accessible'}],
  mundaka:[{n:'La gauche du río',l:'expert',d:'gauche tubulaire de classe mondiale'}],
  lacanau:[{n:'La Nord',l:'intermediaire',d:'pics variés'},{n:'La Sud / Super Sud',l:'debutant',d:'plus accessible, écoles'}],
  biarritz:[{n:'La Côte des Basques',l:'debutant',d:"spot d'apprentissage, longboard"},{n:'La Grande Plage',l:'intermediaire',d:'beach break central'}],
  latorche:[{n:'La pointe',l:'intermediaire',d:'droites et gauches, vent'},{n:'Pors Carn',l:'debutant',d:'plage abritée'}],
  jbay:[{n:'Supertubes',l:'expert',d:'la section star, longue droite'},{n:'Kitchen Windows',l:'intermediaire',d:'plus accessible'},{n:'Point',l:'intermediaire',d:'épaule longue'}],
  snapper:[{n:'Snapper Rocks',l:'expert',d:'départ de la Superbank'},{n:'Rainbow Bay',l:'intermediaire',d:'section suivante'},{n:'Greenmount',l:'intermediaire',d:'épaule finale'}],
  mavericks:[{n:'The Bowl',l:'expert',d:'pic de grosses vagues (tow/rame)'}],
  supertubos:[{n:'Supertubos',l:'expert',d:'beach break tubulaire'},{n:'Baleal',l:'debutant',d:'baie voisine pour progresser'}],
  anglet:[{n:'Les Cavaliers',l:'intermediaire',d:'beach break réputé'},{n:'La Madrague',l:'debutant',d:'plus abritée'}]
};
function spotGuide(s,act){
  var c=COORDS[s.id]||{lat:45,lon:0},lat=c.lat,ab=Math.abs(lat);
  var reef=/(récif|recif|reef|dalle|rocher|corallien|lagon|point|pointe)/i.test(s.desc||'');
  var saison;
  if(ab<=23)saison="Toute l'année · plus marquée nov. → mars";
  else if(lat>0)saison='Sept. → mars';
  else saison='Avril → sept. · hiver austral';
  var sc=SCORES[s.id]||0,crowd=sc>=4.6?'Souvent du monde':(sc>=4?'Fréquentation moyenne':'Plutôt tranquille');
  var faun;
  if(typeof FAUNA!=='undefined'&&FAUNA[s.id]){var p=FAUNA[s.id].split(':');faun=((p[1]||p[0])||'').trim().replace(/\s*🐢|🐋|🦦|🐬/g,'');if(faun.length>62)faun=faun.slice(0,60)+'…';}
  else{var tt=parseInt(s.temp)||16;faun=tt>=22?'poissons tropicaux, raies, tortues':(tt<15?'phoques, poissons, forêts d’algues':'bars, dauphins, bancs de poissons');}
  if(faun)faun=faun.charAt(0).toUpperCase()+faun.slice(1);
  var rows=[];
  if(act==='kitesurf'||act==='windsurf'){
    rows.push(["Plan d'eau",reef?'Vagues sur récif · avancé':'Plat à clapoteux · accessible']);
    rows.push(['Vent idéal','15–35 km/h, régulier']);
    if(s.wind)rows.push(['Vent dominant',s.wind]);
    rows.push(['Matériel',act==='kitesurf'?'Aile 7–12 m² selon le vent':'Voile 4–6 m² selon le vent']);
    rows.push(['Meilleure période',saison]);
  }else if(act==='plongee'||act==='snorkeling'){
    rows.push(["Température de l'eau",s.temp]);
    rows.push(['Visibilité',reef?'Souvent bonne, eaux claires':'Variable selon la houle']);
    rows.push(['À observer',faun]);
    rows.push(['Profondeur',act==='snorkeling'?'En surface':'Variable selon le site']);
  }else if(act==='baignade'){
    rows.push(["Température de l'eau",s.temp]);
    rows.push(['Type de plage',reef?'Récif et rochers, prudence':'Sable']);
    rows.push(['Surveillance',"Souvent surveillée l'été — suis les drapeaux"]);
    rows.push(['Marée',s.tide]);
  }else if(act==='paddle'||act==='kayak'){
    rows.push(['Conditions idéales','Mer plate, vent faible']);
    rows.push(['Vigilance','Évite le vent de terre, dit offshore']);
    rows.push(["Température de l'eau",s.temp]);
    rows.push(['Marée',s.tide]);
  }else{
    rows.push(['Type de fond',reef?'Reef · fond dur':'Beach break · sable']);
    if(s.wind)rows.push(['Vent dominant',s.wind]);
    rows.push(['Marée',s.tide]);
    rows.push(['Planche conseillée', act==='bodyboard' ? 'Bodyboard + palmes' : {debutant:"Mousse / mini-malibu 7'–8'",intermediaire:"Funboard 6'6\"–7'2\"",expert:"Shortboard 5'8\"–6'2\""}[s.level]]);
    rows.push(['Meilleure période',saison]);
  }
  if(LVLTXT[s.level])rows.push(['Niveau du spot',LVLTXT[s.level]]);
  rows.push(['Affluence',crowd]);
  return rows;
}
var ICON={
fond:'<path d="M3 18c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M3 13c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M3 8c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/>',
wave:'<path d="M2 9c2.2 0 2.2-2.4 4.4-2.4S8.6 9 10.8 9 13 6.6 15.2 6.6 17.4 9 19.6 9"/><path d="M2 14c2.2 0 2.2-2.4 4.4-2.4S8.6 14 10.8 14 13 11.6 15.2 11.6 17.4 14 19.6 14"/><path d="M2 19c2.2 0 2.2-2.4 4.4-2.4S8.6 19 10.8 19 13 16.6 15.2 16.6 17.4 19 19.6 19"/>',
planche:'<path d="M12 2c3.5 3 5 8 5 13a5 5 0 0 1-10 0c0-5 1.5-10 5-13z"/><path d="M12 7v10"/>',
saison:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16"/><path d="M8 3v4M16 3v4"/>',
affluence:'<circle cx="9" cy="8" r="3"/><path d="M4 19c0-3.5 2.2-5.5 5-5.5s5 2 5 5.5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M14.7 19c.2-2.6 1.6-4.2 3.6-4.2 2.3 0 3.9 2 4 4.7"/>',
plan_eau:'<path d="M12 3.5c3.4 4.4 6 8 6 11a6 6 0 1 1-12 0c0-3 2.6-6.6 6-11z"/>',
vent:'<path d="M3 8h9a2.5 2.5 0 1 0-2.3-3.4"/><path d="M3 13h13a2.7 2.7 0 1 1-2.5 3.7"/><path d="M3 18h7"/>',
materiel:'<path d="M8 8V6a4 4 0 0 1 8 0v2"/><rect x="5" y="8" width="14" height="12" rx="3"/><path d="M9 12h6"/>',
temperature:'<path d="M12 3.5a2.3 2.3 0 0 0-2.3 2.3v8.4a4 4 0 1 0 4.6 0V5.8A2.3 2.3 0 0 0 12 3.5z"/><path d="M12 9v5"/>',
visibilite:'<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
observer:'<path d="M3 12c3-4 8-6 12-4 2 1 4 2.5 6 4-2 1.5-4 3-6 4-4 2-9 0-12-4z"/><circle cx="15.5" cy="10.7" r=".9" fill="currentColor"/>',
profondeur:'<path d="M12 3v13"/><path d="M7.5 12 12 16.5 16.5 12"/><path d="M5 20h14"/>',
surveillance:'<path d="M6 3v18"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',
conditions_ok:'<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3 11 15l5-6"/>',
vigilance:'<path d="M12 3.5 2.5 20.5h19z"/><path d="M12 9.5v5M12 17.5h.01"/>',
pin:'<path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',etoile:'<path d="M12 3.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.6 6.8 19.5 8 13.7l-4.4-4 5.9-.7z"/>',fleche:'<path d="M5 12h13"/><path d="M12.5 6 19 12l-6.5 6"/>',feuille:'<path d="M20.2 3.8C10.4 4.4 4.6 9.4 4.6 16.6c0 1.3.2 2.4.6 3.2 7.6.5 13.1-4.6 14.4-11.6.4-2.2.6-3.4.6-4.4z"/><path d="M4.2 20.4C6 15 9.8 11.2 15.4 9"/>',niveau:'<path d="M5.5 20v-4.5M12 20V9.5M18.5 20V4.5"/>',bpoisson:'<ellipse cx="10.5" cy="12" rx="7.5" ry="4.6"/><path d="M18 12 22 8.6v6.8z"/><path d="M14.4 9.4 15.6 12l-1.2 2.6"/><circle cx="6.5" cy="11.2" r=".9" fill="currentColor"/>',mammifere:'<path d="M2.5 13.5 6 10.5v6z"/><path d="M6 13.5c2.6-3.6 7-5.4 11-4.3 2.2.6 3.8 2 4.5 3.6-1.4 2.4-4.6 3.8-8.4 3.6-3-.2-5.6-1.2-7.1-2.9z"/><path d="M12.5 9.2q.6-3 2.4-3.6-.5 1.8 0 3.6"/><circle cx="18.4" cy="12.2" r=".9" fill="currentColor"/>',reptile:'<ellipse cx="11" cy="12.5" rx="6.5" ry="5"/><path d="M17.5 12.5h3.5"/><path d="M6 8.2 4.4 6.4M6 16.8 4.4 18.6M15 8.6l1.4-1.8M15 16.4l1.4 1.8"/><path d="M8 10.5h6M8 14.5h6M11 8v9"/>',invertebre:'<path d="M12 4c4 0 6.5 2.6 6.5 6 0 3.4-2.5 5.4-6.5 5.4S5.5 13.4 5.5 10C5.5 6.6 8 4 12 4z"/><path d="M8 15q-1.5 3 0 5M12 15.4v5M16 15q1.5 3 0 5"/><circle cx="9.6" cy="9.6" r=".9" fill="currentColor"/><circle cx="14.4" cy="9.6" r=".9" fill="currentColor"/>',oiseau:'<path d="M4 14q5-7 11-7 3 0 5 2-3 1-4 3.5-1.6 4-6 4.5-4 .4-6-3z"/><path d="M8 17.5 6.5 21"/><circle cx="16.6" cy="9.4" r=".9" fill="currentColor"/>',algue:'<path d="M9 21q-3-6 0-10 3-4 0-8"/><path d="M15 21q3-5 0-9 -3-4 0-7"/><path d="M12 21q-1.6-7 0-12"/>',corail:'<path d="M12 21V11"/><path d="M12 15q-3-1.4-4-5M12 13q3-1.4 4-5"/><path d="M8 10q-2.6-.6-3-3.4M16 8q2.6-.6 3-3.4"/><path d="M6 21h12"/>',
spirale:'<path d="M12 12c-3 0-3-4 0-4s4 3 4 6-3 6-7 6-7-4-7-8 3-9 9-9"/>',
eclair:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
rocher:'<path d="M3 17c0-2 1.6-3 3-4.6C7.6 10 9 8 12 8s4 2 5.6 4.4c1.4 1.7 3.4 2.7 3.4 4.6 0 1.7-2 3-9 3s-9-1.3-9-3z"/>',
interdit:'<circle cx="12" cy="12" r="8.5"/><path d="M6.5 6.5l11 11"/>',
coeur:'<path d="M12 20.2s-7.5-4.6-9.7-9.2C.6 7.6 2.3 4 5.8 3.4c2-.3 3.8.7 5 2.3l1.2 1.6 1.2-1.6c1.2-1.6 3-2.6 5-2.3 3.5.6 5.2 4.2 3.5 7.6-2.2 4.6-9.7 9.2-9.7 9.2z"/>',
balai:'<path d="M6 8h12l-1 11.2a1.8 1.8 0 0 1-1.8 1.6H8.8A1.8 1.8 0 0 1 7 19.2z"/><path d="M4.5 8h15M9.5 8V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V8"/><path d="M10 12v5M14 12v5"/>',
bouteille:'<path d="M10 2h4v3.2l1.6 2.4c.3.4.4.9.4 1.4V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9c0-.5.1-1 .4-1.4L10 5.2z"/><path d="M9 12h6"/>',
velo:'<circle cx="6" cy="17" r="3.4"/><circle cx="18" cy="17" r="3.4"/><path d="M6 17l4-9h4l3 9M10 8h3M9 12h7"/>',
poisson:'<path d="M3 12c3-4 8-6 12-4 2 1 4 2.5 6 4-2 1.5-4 3-6 4-4 2-9 0-12-4z"/><circle cx="15.5" cy="10.7" r=".9" fill="currentColor"/>',
soleil:'<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/>',
neige:'<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
grotte:'<path d="M3 20c0-6 4-11 9-11s9 5 9 11"/><path d="M3 20h18"/>',
bateau:'<path d="M4 14h16l-2 5.5a2 2 0 0 1-1.9 1.5H7.9A2 2 0 0 1 6 19.5z"/><path d="M12 14V4M12 4l4 3M12 7 8.5 9.3"/>',
marche:'<circle cx="13" cy="4.3" r="1.8"/><path d="M9 21l2-6-2.3-2 .8-4.4L12 7l2 2.3 3 1"/><path d="M9.5 15l-3 2.5"/>',
carte:'<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
sunrise:'<path d="M4 18h16"/><path d="M6 18a6 6 0 0 1 12 0"/><path d="M12 4v3M5 11l1.8 1.2M19 11l-1.8 1.2"/>',
camera:'<rect x="3" y="7" width="18" height="13" rx="3.2"/><circle cx="12" cy="13.5" r="3.4"/><path d="M8 7l1.4-2.4h5L16 7"/>',
recycle:'<path d="M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7"/><path d="M17.6 4v3.3h-3.3M6.4 20v-3.3h3.3"/>',
flamme:'<path d="M12 3.2c1 3-1 4-2.1 5.8-.9 1.5-.8 3.6.6 4.6.5-1 1-1.9 1.9-2.4.4 2 1.9 2.6 1.9 4.6a4.3 4.3 0 0 1-8.6 0c0-2.1 1.6-3.7 3.2-5.3C8 9.4 11 7.2 12 3.2z"/>',
trophee:'<path d="M7 4h10v1.5h2.5a.8.8 0 0 1 .8.9c-.2 2-1.6 3.4-3.6 3.7A5.2 5.2 0 0 1 13 13v2h2.2a.8.8 0 0 1 0 1.6H8.8a.8.8 0 0 1 0-1.6H11v-2a5.2 5.2 0 0 1-3.7-2.9C5.3 9.8 3.9 8.4 3.7 6.4a.8.8 0 0 1 .8-.9H7zM5.6 7c.2.9.8 1.6 1.5 1.9V7zm12.9 0H17v1.9c.7-.3 1.3-1 1.5-1.9z" fill="currentColor"/><rect x="8" y="18.4" width="8" height="2" rx="1" fill="currentColor"/>',
dauphin:'<path d="M3 15c3-6 9-10 15-8-1 1-1 2 0 3 2 .5 3 2 2 4-3 3-8 3-11 1-2 1-4 1-6 0z" fill="currentColor"/><circle cx="16" cy="9" r=".9" fill="#fff"/>',
couronne:'<path d="M4 18h16l-1.4-8-4 3-2.6-5-2.6 5-4-3z" fill="currentColor"/>',
cadenas:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
requin:'<path d="M2.5 15c4-5.5 11-8 17-4.5-1.6.4-2.8 1.4-3.4 2.8 1.7 1.6 4 1.9 6 .9-1.7 2.4-4.6 3.4-7.3 2.5-2.7 2.6-6.7 3.1-10 1.3 2-.6 3.5-2 4.2-3.8-2.2.2-4.4.1-6.5-.2z" fill="currentColor"/><path d="M12.8 9.6c.3-1.6 1.4-2.9 2.9-3.5-.1 1.5.4 2.9 1.4 4-1.5.2-3-.1-4.3-.5z" fill="currentColor"/>',
tortue:'<ellipse cx="10.3" cy="12.5" rx="6.3" ry="4.9" fill="currentColor"/><circle cx="18.2" cy="12.2" r="2" fill="currentColor"/><ellipse cx="7.6" cy="7.6" rx="1.7" ry="1.1" fill="currentColor" transform="rotate(-25 7.6 7.6)"/><ellipse cx="7.6" cy="17.4" rx="1.7" ry="1.1" fill="currentColor" transform="rotate(25 7.6 17.4)"/><ellipse cx="3.2" cy="12.5" rx="1.5" ry=".9" fill="currentColor"/>'
};
function uic(key,cls){return '<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(ICON[key]||ICON.pin)+'</svg>';}
var SURF_ICON='<svg viewBox="0 0 24 24"><path d="M4.6 19.4c-2-2-1.4-7.6 2.4-11.4S16.4 2.6 18.4 4.6 19.4 12.2 15.6 16 6.6 21.4 4.6 19.4z" fill="currentColor"/><path d="M8 16 16 8" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';
var PIN_ICON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.4" fill="#fff"/></svg>';
var LEAF_ICON='<svg viewBox="0 0 24 24"><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" fill="currentColor"/><path d="M9 15c2-3 5-5 8-6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
var HEART_ICON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.2s-7.5-4.6-9.7-9.2C.6 7.6 2.3 4 5.8 3.4c2-.3 3.8.7 5 2.3l1.2 1.6 1.2-1.6c1.2-1.6 3-2.6 5-2.3 3.5.6 5.2 4.2 3.5 7.6-2.2 4.6-9.7 9.2-9.7 9.2z"/></svg>';
var GICON={
  "Type de fond":['fond','#fdf1d8','#c9902e'],
  "Mar\u00e9e":['wave','#e6f2fb','#1583cb'],
  "Planche conseill\u00e9e":['planche','#ffe3df','#e8645e'],
  "Saison":['saison','#eafaf7','#2faf72'],
  "Affluence":['affluence','#f1eafd','#9b6bd1'],
  "Plan d'eau":['plan_eau','#e6f2fb','#1583cb'],
  "Vent id\u00e9al":['vent','#e6f2fb','#1583cb'],
  "Mat\u00e9riel":['materiel','#ffe3df','#e8645e'],
  "Temp\u00e9rature de l'eau":['temperature','#ffe3df','#e8645e'],
  "Visibilit\u00e9":['visibilite','#e6f2fb','#1583cb'],
  "\u00c0 observer":['observer','#eafaf7','#2faf72'],
  "Profondeur":['profondeur','#e6f2fb','#1583cb'],
  "Type de plage":['fond','#fdf1d8','#c9902e'],
  "Surveillance":['surveillance','#ffe3df','#e8645e'],
  "Conditions id\u00e9ales":['conditions_ok','#eafaf7','#2faf72'],
  "Vigilance":['vigilance','#fdf1d8','#c9902e'],
  "Meilleure période":['saison','#eafaf7','#2faf72'],
  "Vent dominant":['vent','#e6f2fb','#1583cb'],
  "Niveau du spot":['niveau','#f1eafd','#9b6bd1']
};
/* Libelles courts pour la grille : en petites capitales dans une demi-colonne,
   « Planche conseillee » passait a la ligne et decalait la valeur. La cle
   longue reste celle de GICON et de spotGuide(). */
var GSHORT={"Type de fond":"Fond","Vent dominant":"Vent","Planche conseillée":"Planche",
  "Meilleure période":"Période","Niveau du spot":"Niveau",
  "Température de l'eau":"Eau","Type de plage":"Plage",
  "Conditions idéales":"Conditions"};
function gline(k,v,wide){
  /* Tuile et non plus ligne : le libelle passe au-dessus de la valeur, donc il
     ne decale plus rien. Une valeur longue prend la largeur entiere plutot que
     de s'empiler sur quatre lignes etroites. */
  var gi=GICON[k]||['pin','#eef4f7','#7c98a8'];
  if(wide===undefined)wide=String(v).length>32;
  /* La famille de couleur de GICON ne teintait qu'un carre de 26 px ; elle
     habille maintenant la tuile entiere, et la pastille passe en aplat. */
  return '<div class="gt'+(wide?' wide':'')+'" style="background:linear-gradient(160deg,#fff 12%,'
       + gi[1]+');border-color:'+gi[1]+'"><div class="gth">'
       + '<span class="gic" style="background:'+gi[2]+'">'+uic(gi[0])+'</span>'
       + '<span class="gk">'+(GSHORT[k]||k)+'</span></div>'
       + '<div class="gv">'+v+'</div></div>';
}
function renderGuide(s,act){
  /* On suit la colonne pour ne jamais laisser une tuile seule en bas de grille. */
  var rows=spotGuide(s,act),w=[],col=0;
  for(var i=0;i<rows.length;i++){
    var wide=String(rows[i][1]||'').length>32;
    w.push(wide); col=wide?0:(col+1)%2;
  }
  if(col===1)w[w.length-1]=true;
  return rows.map(function(r,i){return gline(r[0],r[1],w[i]);}).join('');
}
var LVLTXT={debutant:'Débutant',intermediaire:'Intermédiaire',expert:'Expert'};
var DANGER_MAP={
  '\ud83c\udf00':['spirale','#e6f2fb','#1583cb'],
  '\u26a1':['eclair','#fdf1d8','#c9902e'],
  '\ud83c\udfd6\ufe0f':['fond','#fdf1d8','#c9902e'],
  '\ud83c\udfdc\ufe0f':['fond','#fdf1d8','#c9902e'],
  '\ud83d\udc65':['affluence','#f1eafd','#9b6bd1'],
  '\ud83d\udca8':['vent','#e6f2fb','#1583cb'],
  '\ud83c\udf0a':['wave','#e6f2fb','#1583cb'],
  '\ud83e\udea8':['rocher','#f1ece6','#8a7a63'],
  '\ud83e\udd76':['neige','#e6f2fb','#1583cb'],
  '\u2744\ufe0f':['neige','#e6f2fb','#1583cb'],
  '\ud83d\udeab':['interdit','#ffe3df','#e8645e'],
  '\u2600\ufe0f':['soleil','#fdf1d8','#c9902e'],
  '\u26a0\ufe0f':['vigilance','#fdf1d8','#c9902e'],
  '\ud83d\udd73\ufe0f':['grotte','#f1ece6','#8a7a63'],
  '\ud83d\udea4':['bateau','#e6f2fb','#1583cb'],
  '\ud83d\udeb6':['marche','#eafaf7','#2faf72'],
  '\ud83e\uddb5':['eclair','#fdf1d8','#c9902e'],
  '\ud83e\udd88':['requin','#e6f2fb','#1583cb']
};
function spotTokens(s){const t=[s.id];s.name.split('—')[0].toLowerCase().split(/[^a-zà-ÿ0-9]+/).forEach(function(w){if(w.length>=5)t.push(w);});(ALIAS[s.id]||[]).forEach(function(a){t.push(a);});return t;}
function findSpotInQuery(q){for(const s of SPOTS){const tk=spotTokens(s);for(const k of tk){if(k.length>=4&&q.indexOf(k)>=0)return s;}}return null;}
function bestSpotsByLevel(level){const lab={debutant:'débutant',intermediaire:'intermédiaire',expert:'expert'}[level];const list=SPOTS.filter(function(s){return s.level===level;}).sort(function(a,b){return (SCORES[b.id]||0)-(SCORES[a.id]||0);}).slice(0,5);const items=list.map(function(s){return '• <b>'+s.name.split(' — ')[0]+'</b> <span style="opacity:.65">('+s.loc+')</span> · '+(SCORES[s.id]||0).toFixed(1)+'/5';}).join('<br>');return {html:'🏄 Mes meilleurs spots <b>'+lab+'</b> :<br>'+items,btn:{label:'Ouvrir la carte 🗺️',onclick:"openFromChat('spots')"}};}
function spotFauna(s){const t=parseInt(s.temp)||18;let f;if(FAUNA[s.id])f=FAUNA[s.id];else if(t>=24)f="eaux chaudes : tortues 🐢, poissons tropicaux colorés, raies, dauphins, et parfois des requins de récif.";else if(t>=18)f="eaux tempérées : bancs de poissons (bars, maquereaux), dauphins 🐬, parfois des phoques, et une vie côtière riche.";else f="eaux froides et vivantes : phoques, dauphins, oiseaux marins, bancs de poissons et forêts d'algues (kelp).";return {html:'🐠 La faune à <b>'+s.name.split(' — ')[0]+'</b> ('+s.loc+') : '+f,btn:{label:'Voir le spot 🏄',onclick:"openSpotFromChat('"+s.id+"')"}};}
function spotInfo(s){const hist=ANEC[s.id]||FUN[s.id]||'';return {html:'📍 <b>'+s.name.split(' — ')[0]+'</b> — '+s.loc+'<br>'+lvlLabel[s.level]+' · note '+(SCORES[s.id]||0).toFixed(1)+'/5 · 🌊 '+s.swell+' · 🌡️ '+s.temp+'<br><br>'+s.desc+(hist?'<br><br>💡 '+hist:''),btn:{label:'Voir la fiche 🏄',onclick:"openSpotFromChat('"+s.id+"')"}};}
function boardReco(level){if(level==='expert')return {html:"Pour un niveau <b>expert</b> 🛹 : un <b>shortboard</b> performant (5'8\"–6'2\") pour le surf radical, et un <b>gun</b> pour les grosses vagues. Faible volume, réactivité max."};if(level==='intermediaire')return {html:"En <b>intermédiaire</b> 🛹 : un <b>funboard / évolutive</b> (6'6\"–7'2\") ou un shortboard un peu volumineux — manœuvrabilité tout en gardant de la rame."};if(level==='debutant')return {html:"Pour <b>débuter</b> 🛹 : une <b>planche en mousse</b> ou un <b>mini-malibu (7'–8')</b>, large et volumineuse : ça rame tout seul et ça stabilise."};return {html:"Le bon choix dépend de ton niveau 🛹 :<br>• <b>Débutant</b> : mousse / mini-malibu 7'–8'<br>• <b>Intermédiaire</b> : funboard 6'6\"–7'2\"<br>• <b>Confirmé</b> : shortboard 5'8\"–6'2\"<br>Plus tu progresses, moins tu mets de volume."};}
function smartReply(q){
  const spot=findSpotInQuery(q);
  const lvl=/(débutant|debutant|débuter|debuter|novice)/.test(q)?'debutant':/(intermédiaire|intermediaire|moyen)/.test(q)?'intermediaire':/(expert|confirmé|confirme|avancé|avance)/.test(q)?'expert':null;
  if(/(planche|board|\bshape\b|funboard|shortboard|longboard|mini.?malibu)/.test(q))return boardReco(lvl);
  if(lvl&&/(spot|surf|vague|plage|meilleur|recommand|liste|conseil|aller|pour)/.test(q))return bestSpotsByLevel(lvl);
  if(/(faune|vie marine|animaux|quels animaux|qu'on (voit|croise|peut)|qu'y a.?t.?il|espèce|espece|poissons)/.test(q))return spot?spotFauna(spot):{html:"Ça dépend de l'endroit 🐠 ! Eaux tropicales : tortues, poissons colorés, raies, requins de récif. Eaux tempérées/froides : dauphins, phoques, bancs de poissons, oiseaux marins, forêts de kelp. Demande-moi la faune d'un spot précis (ex. « la faune à Pipeline »)."};
  if(spot)return spotInfo(spot);
  return null;
}
function poulpyReply(q){
  q=q.toLowerCase();
  if(/(surf.?trip|voyage|itinéraire|itineraire|préparer.*séjour|preparer.*sejour)/i.test(q))return {html:'Prépare ton aventure dans <b>Surf trips</b> : choisis tes spots, organise les étapes, ajoute tes dates et ta checklist.',btn:{label:'Préparer mon voyage',onclick:"openFromChat('trips')"}};
  const sr=smartReply(q);if(sr)return sr;
  const spotReco=()=>{const s=recommendedSpot(),sc=SCORES[s.id],best=FORECAST.find(f=>f.best);return {html:`Vu ton niveau, je te conseille <b>${s.name.split(' — ')[0]}</b> 🤙<br>${lvlLabel[s.level]} · 💨 ${s.wind} · 🌊 ${s.swell} · 🌡️ ${s.temp} · note <b>${sc}/5</b>.<br>Meilleur créneau de la semaine : <b>${best.d}</b> !`,btn:{label:'Voir le spot 🏄',onclick:`openSpotFromChat('${s.id}')`}};};
  const prog=()=>({html:`Tu as <b>${xp} XP</b>. Continue à explorer, pratiquer et protéger l’océan pour progresser.`,btn:{label:'Voir mes défis',onclick:"openFromChat('challenges')"}});
  const eco=()=>({html:'🌱 '+pick(ECO_T),btn:{label:'Voir les défis écolo 🌊',onclick:"openFromChat('challenges')"}});
  const KB=[
   [/(merci|thanks|génial|genial|parfait|top\b|cool|super|nickel|excellent)/,()=>({html:pick(["Avec plaisir ! 🌊","Toujours là pour toi 🐙 !","De rien ! Bon surf et prends soin de l'océan 💚"])})],
   [/\b(bonjour|salut|coucou|hello|hey|hi|yo|wesh|bonsoir)\b/,"Coucou ! 🐙 Je suis Poulpy, ton assistant océan. Demande-moi un <b>spot</b>, de la <b>technique de surf</b>, des questions sur la <b>faune marine</b>, la <b>météo des vagues</b> ou l'<b>écologie</b>… vas-y, teste-moi !"],
   [/(qui es.?tu|tu es qui|c'est quoi poulpy|qui est poulpy|présente|presente|ton nom|tu fais quoi|tu sais faire)/,"Je suis <b>Poulpy</b> 🐙, ton poulpe-assistant surf &amp; océan ! Je connais les spots, la technique, la vie marine, la météo des vagues et l'écologie. Pose-moi tout ce que tu veux sur l'océan."],
   [/(poulpe|pieuvre|octopus|tentacule|combien de c(œ|oe)ur|sang bleu)/,"Nous les poulpes, on est des cracks 🐙 : <b>3 cœurs</b>, du <b>sang bleu</b>, 8 bras couverts de ventouses qui goûtent ce qu'elles touchent, et on peut <b>changer de couleur</b> et se faufiler par un trou de la taille de notre bec !"],
   [/(requin|shark)/,"Les requins impressionnent, mais les attaques sont <b>très rares</b> 🦈. La plupart nous ignorent. Évite l'aube/le crépuscule, l'eau trouble et les zones de pêche, et tout ira bien."],
   [/(dauphin|orque|cétac|cetac|marsouin)/,"Croiser des dauphins à l'eau, c'est le plus beau cadeau du surf 🐬 ! Curieux et joueurs. Reste calme, profite, et ne les poursuis pas."],
   [/(baleine|rorqual|cachalot)/,"Les baleines sont les plus grands animaux ayant jamais existé 🐋 : le rorqual bleu dépasse 30 m, et son cœur fait la taille d'une petite voiture !"],
   [/(tortue)/,"Les tortues marines existent depuis plus de 100 millions d'années 🐢. Si tu en croises : garde tes distances et ne les touche pas, elles sont protégées."],
   [/(méduse|meduse|piqûre|piqure|urtic)/,"Piqûre de méduse 🪼 ? Rince à l'<b>eau de mer</b> (jamais à l'eau douce !), retire les filaments avec une carte, et n'urine surtout pas dessus (ça empire). Consulte si ça gonfle ou si la douleur est forte."],
   [/(corail|coraux|récif|recif|reef)/,"Les récifs coralliens abritent <b>25 % de la vie marine</b> sur moins de 1 % de la surface des océans 🪸. Pour les protéger : crème solaire sans oxybenzone, et on ne marche jamais dessus."],
   [/(plancton|oxygène|oxygene|on respire)/,"Surprise : le <b>plancton</b> océanique produit plus de la <b>moitié de l'oxygène</b> qu'on respire 🌍 ! Une respiration sur deux vient de la mer, pas de la forêt."],
   [/(pourquoi.*bleu|bleu.*mer|bleu.*océan|couleur.*(mer|océan|ocean))/,"L'océan est bleu car l'eau <b>absorbe les rouges</b> de la lumière et renvoie le bleu 💙. Plus c'est profond, plus le bleu est intense."],
   [/(pourquoi.*sel|sel.*mer|salée|salee|salinité|salinite|c'est salé)/,"La mer est salée car les rivières arrachent depuis des millions d'années des <b>sels minéraux</b> aux roches et les déversent dans l'océan 🧂."],
   [/(profond|fosse|mariannes|marianne|abysse|abyssal)/,"Le point le plus profond est la <b>fosse des Mariannes</b> (~11 000 m) 🌊 — plus profond que l'Everest n'est haut, dans le noir total et une pression écrasante."],
   [/(plus grand océan|plus grand ocean|combien d'océan|combien d'ocean|pacifique|cinq océans)/,"Il y a <b>5 océans</b>, et le <b>Pacifique</b> est le plus grand : il couvre à lui seul un tiers de la planète 🌏."],
   [/(courant|gulf.?stream)/,"De grands courants comme le <b>Gulf Stream</b> transportent la chaleur autour du globe et règlent le climat 🌡️. À l'eau, méfie-toi surtout des courants locaux et des baïnes."],
   [/(comment.*(vague|houle)|d'où vienn|forme.*(vague|houle)|naissance.*vague|(vague|houle).*se form)/,"Les vagues naissent du <b>vent qui souffle au large</b> 💨. Cette énergie voyage sur des milliers de km sous forme de <b>houle</b>, puis se dresse en vague en arrivant sur les hauts-fonds près de la côte."],
   [/(houle|swell|période|periode|train de vague|les sets|c'est quoi un set)/,"Une bonne houle a une <b>longue période</b> (12-16 s) : vagues espacées, propres et puissantes. Une mer de vent (période courte) donne du clapot. Les vagues arrivent par <b>séries (sets)</b> entre des accalmies."],
   [/(marée|maree)/,"Les marées viennent de l'<b>attraction de la Lune</b> (et du Soleil) 🌙. Pleine/nouvelle lune = grandes marées (vives-eaux), quartiers = petites marées (mortes-eaux). Beaucoup de spots ne marchent qu'à une certaine marée."],
   [/(offshore|onshore|vent de terre|vent de mer|sens du vent|side.?shore)/,"Le vent <b>offshore</b> (de la terre vers la mer) lisse et creuse les vagues : c'est l'idéal 🤙. Le vent <b>onshore</b> (de la mer) hache la surface et abîme les vagues."],
   [/(take.?off|me lever|pop.?up|me redresser|debout.*planche|me mettre debout)/,"Le take-off : rame fort, <b>mains sous les épaules</b>, pousse en amenant le pied arrière puis le pied avant d'un coup, et <b>regarde devant</b> (jamais tes pieds) 🏄."],
   [/(canard|duck.?dive|passer la barre|passer les vagues|franchir|passer dessous)/,"Le <b>canard</b> pour passer sous la vague : enfonce l'avant avec les bras, puis le pont avec le genou/pied, file sous la mousse et ressors derrière. En longboard, fais la <b>tortue</b> (retourne la planche)."],
   [/(bottom turn|virage|manœuvre|manoeuvre|cut.?back|tourner|tourne)/,"Le <b>bottom turn</b> est la base de tout : en bas de la vague, appuie sur tes carres et regarde la section visée pour relancer vers le haut. Toutes les manœuvres partent de là."],
   [/(quelle planche|choisir.*planche|type de planche|funboard|shortboard|longboard|mini.?malibu|volume.*planche)/,"Pour débuter : <b>grand et volumineux</b> (mousse / mini-malibu 7-8'), ça rame et ça stabilise. Plus tu progresses, plus tu réduis vers un shortboard 🛹."],
   [/(combinaison|combi|néoprène|neoprene|épaisseur|j'ai froid|quelle combi)/,"Selon la température de l'eau 🥶 : >22°C shorty/lycra · 17-21°C une 3/2 · 13-17°C une 4/3 + chaussons · <13°C une 5/4 + chaussons/gants/cagoule."],
   [/(wax|paraffine|cirer)/,"La <b>wax</b> t'empêche de glisser : choisis-la selon la temp. de l'eau (tropical/warm/cool/cold), une sous-couche + une couche de surface en quadrillage 🧴."],
   [/(baïne|baine|\brip\b|arrachement|aspiré|aspire|emporté|emporte|courant me)/,"Pris dans une baïne/un rip 🌀 ? <b>Ne lutte pas de face</b> : reste calme, lève le bras pour signaler, et nage <b>parallèlement à la plage</b> pour sortir du courant, puis reviens avec les vagues."],
   [/(priorité|priorite|règle|regle|qui passe|brûler|bruler|étiquette|etiquette|respect)/,"Règle d'or 🤙 : le surfeur <b>le plus proche du pic</b> a la priorité. On ne brûle pas la priorité, on ne lâche jamais sa planche, et on respecte les locaux."],
   [/(prévision|prevision|forecast|lire.*houle|windguru|surfline|magicseaweed|savoir.*condition)/,"Pour lire une prévi 📊 : <b>hauteur + période</b> de houle, <b>direction</b> de la houle, <b>force/direction du vent</b> (offshore = top) et la <b>marée</b>. Le combo gagnant : houle longue + vent offshore léger."],
   [/(débuter|debuter|commencer.*surf|apprendre.*surf|première fois|premiere fois|je débute|comment surfer|faire du surf)/,"Pour débuter 🏄 : un spot de plage à vagues douces (🟢), une grande planche en mousse, et tu commences par te lever dans la <b>mousse</b>. Une école au début pour la sécurité, c'est l'idéal. Et surtout, amuse-toi !"],
   [/(peur|angoiss|stress|j'ose pas|jose pas)/,"C'est normal d'avoir un peu peur 🐙. Commence petit, par conditions calmes et accompagné, reste dans la zone surveillée et progresse à ton rythme. La confiance vient vague après vague."],
   [/(saison|quand surfer|meilleur moment|automne|hiver)/,"En Europe atlantique, l'<b>automne</b> est souvent le top 🍂 : houles régulières, eau encore douce, moins de monde. L'été est plus calme — parfait pour débuter."],
   [/(phoque|otarie|lion de mer)/,"Phoques et otaries sont curieux et joueurs 🦭, inoffensifs en général. Garde tes distances, surtout près des petits, et ne les nourris jamais."],
   [/(manchot|pingouin)/,"Les manchots ne volent pas mais nagent comme des fusées 🐧 — jusqu'à 30 km/h ! On les croise surtout dans les eaux froides de l'hémisphère sud."],
   [/(loutre)/,"Les loutres de mer 🦦 se tiennent par la patte en dormant pour ne pas dériver, et cassent des coquillages sur une pierre posée sur leur ventre. Adorables !"],
   [/(oursin)/,"Sur les fonds rocheux, marche avec des chaussons : les piquants d'oursin 🦔 cassent sous la peau. Si tu te piques, retire ce que tu peux, désinfecte, et consulte si ça s'infecte."],
   [/(poisson.?vive|weever|piqûre.*sable|piqué.*sable)/,"La vive est un petit poisson enfoui dans le sable des plages 🏖️ : sa piqûre est très douloureuse. Le bon réflexe : tremper le pied dans de l'eau <b>chaude</b> (le venin craint la chaleur) et consulter si besoin."],
   [/(\braies?\b|stingray|pastenague)/,"Les raies sont pacifiques 🥷. Pour éviter de marcher dessus dans le sable, fais le « shuffle » (glisse les pieds sans les lever). Leur dard ne sert qu'en défense."],
   [/(hippocampe|cheval de mer)/,"Chez les hippocampes 🐴, c'est le <b>mâle</b> qui porte les bébés et accouche ! Ils nagent debout et s'accrochent aux herbiers avec leur queue."],
   [/(poisson.?pierre|rascasse|poisson.?lion|lionfish)/,"En eaux tropicales, méfie-toi du poisson-pierre et du poisson-lion : très venimeux 🐟. Ne touche rien et regarde où tu poses pieds et mains."],
   [/(blanchissement)/,"Le blanchissement, c'est quand le corail, stressé par une eau trop chaude, expulse ses algues et devient blanc 🪸. S'il dure, le corail meurt — d'où l'urgence climatique pour les récifs."],
   [/(bioluminescen|mer qui brille|eau qui brille)/,"Cette lumière bleue magique dans les vagues la nuit ✨, c'est du <b>plancton bioluminescent</b> qui s'illumine quand l'eau s'agite. Spectacle rare et féérique !"],
   [/(beach.?break|point.?break|reef.?break|type de spot|type de vague|type de fond|fond de sable|fond rocheux)/,"3 grands types de spots 🌊 : <b>beach break</b> (fond de sable, plus sûr, idéal débutant), <b>reef break</b> (fond de récif/roche : vague précise mais coupante), <b>point break</b> (la vague déroule le long d'une pointe, longue et régulière)."],
   [/(banc de sable|sandbar|bancs de sable)/,"Un beach break dépend de ses <b>bancs de sable</b> : ils bougent avec les marées et les tempêtes, ce qui change la qualité des vagues d'une semaine à l'autre."],
   [/(coefficient.*mar|gros coeff|fort coeff)/,"Le <b>coefficient de marée</b> (20 à 120) indique l'amplitude : plus il est haut, plus la mer monte/descend vite et plus les <b>courants</b> sont forts. Au-delà de 90, prudence sur les spots à baïnes."],
   [/(groundswell|windswell|mer de vent|houle de fond)/,"La <b>houle de fond</b> (groundswell) vient de tempêtes lointaines : longue période, vagues propres et puissantes. La <b>mer de vent</b> est générée localement : courte période, clapot désordonné."],
   [/(glassy|mer d'huile|mer lisse|sans vent|conditions parfaites)/,"« Glassy » = pas un souffle de vent, surface lisse comme de l'huile 🪞. Souvent tôt le matin : les vagues sont propres et parfaites."],
   [/(tube|barrel|tonneau|prendre un tube)/,"Le <b>tube</b> (barrel), c'est le Graal 🤙 : quand la vague s'enroule au-dessus de toi et que tu surfes dans le cylindre d'eau. Il faut des vagues creuses et beaucoup d'expérience."],
   [/(el niño|el nino|la niña|la nina)/,"El Niño / La Niña sont des cycles de réchauffement/refroidissement du Pacifique qui modifient vents et houles 🌊 — certaines saisons de surf sont bien meilleures (ou pires) selon le cycle."],
   [/(\brame\b|ramer|comment ramer|bien ramer)/,"Pour bien ramer 🏄 : allonge-toi centré (ni trop avant = tu plantes, ni trop arrière = tu freines), dos cambré, et rame profond avec des bras alternés, mains en cuillère."],
   [/(line.?up|le pic|où se placer|ou se placer|se positionner|où se mettre)/,"Le <b>pic</b>, c'est là où la vague commence à déferler. Place-toi juste à côté (pas dedans), observe les locaux, et n'encombre pas le pic quand tu débutes."],
   [/(regular|goofy|pied avant|pied arrière|quel pied)/,"<b>Regular</b> = pied gauche devant, <b>goofy</b> = pied droit devant 🏄. Astuce : fais-toi pousser par surprise, le pied qui avance pour te rattraper est ton pied arrière."],
   [/(vague de gauche|vague de droite|une gauche|une droite|frontside|backside)/,"Une « droite » déroule vers la droite (vue de la mer), une « gauche » vers la gauche. Tu es <b>frontside</b> quand tu fais face à la vague, <b>backside</b> dos à la vague."],
   [/(pomper|pumping|générer.*vitesse|generer.*vitesse|prendre de la vitesse|aller plus vite)/,"Pour prendre de la vitesse, « pompe » : remonte et redescends sur la face de la vague en fléchissant puis poussant sur les jambes, comme sur une balançoire 🏄."],
   [/(chute|wipeout|tomber|comment tomber)/,"Quand tu chutes 🌊 : protège ta tête avec les bras, tombe à plat (jamais tête la première), reste calme sous l'eau, laisse-toi remonter et protège-toi de ta planche en surface."],
   [/(nose.?riding|hang ten|marcher sur la planche|cross.?step)/,"Le nose-riding (longboard) : on marche jusqu'à l'avant de la planche pour poser les orteils au nose 🛹. Ça demande une vague molle et un bon trim — le grand art du longboard !"],
   [/(aileron|\bfins\b|quel aileron|combien d'aileron|dérives)/,"Les <b>ailerons</b> donnent accroche et stabilité 🛹 : un seul (single) pour le longboard glissé, trois (thruster) pour le shortboard polyvalent, quatre (quad) pour la vitesse."],
   [/(volume.*planche|litres|litrage|combien de litres|flottabilité)/,"Le <b>volume</b> d'une planche (en litres) = sa flottabilité. Plus de litres = ça rame et c'est stable (débutant) ; moins de litres = plus maniable mais exigeant (confirmé)."],
   [/(snorkeling|masque et tuba|masque tuba|palmes.*tuba|\btuba\b)/,"Snorkeling 🐠 : respire calmement par le tuba, vide ton masque en soufflant par le nez s'il s'embue, reste en surface, ne touche jamais le corail, et ne pars jamais seul ni par mer agitée."],
   [/(plongée|plongee|\bscuba\b|bouteille de plong|brevet de plong)/,"Plongée 🤿 : règle d'or, ne retiens <b>jamais</b> ta respiration en remontant, équilibre tes oreilles tôt et souvent, plonge toujours en binôme, et passe un brevet avec un club."],
   [/(apnée|apnee|freediving|en apnée)/,"Apnée 🫁 : <b>jamais seul</b> — toujours avec un binôme qui te surveille en surface. Ne force pas, remonte avant le besoin d'air, et forme-toi (la syncope est le vrai danger)."],
   [/(kitesurf|\bkite\b|kiteboard|aile de kite)/,"Kitesurf 🪁 : commence avec une <b>école</b> (l'aile est puissante). Évite absolument le vent de terre (offshore) seul, vérifie ta fenêtre de vent, et porte casque + gilet."],
   [/(windsurf|planche à voile|planche a voile)/,"Windsurf ⛵ : débute en eau plane avec peu de vent et une grande planche stable. Apprends à remonter la voile et à te placer ; quelques cours accélèrent énormément la progression."],
   [/(\bpaddle\b|\bsup\b|stand.?up|paddleboard)/,"Paddle (SUP) 🛶 : porte le <b>leash</b> (ta planche est ton flotteur de sécurité) et méfie-toi du vent de terre qui peut t'emporter au large. Pagaie avec le tronc, pas seulement les bras."],
   [/(kayak|canoë|canoe)/,"Kayak de mer 🚣 : gilet obligatoire, vérifie météo et courants, reste près de la côte, et préviens quelqu'un de ton itinéraire et de ton heure de retour."],
   [/(bodyboard|boogie)/,"Bodyboard 🌊 : avec des palmes pour ramer, tu attrapes les vagues facilement. Idéal dans les shore breaks creux où le surf est difficile."],
   [/(baignade|se baigner|nager en mer|nager dans la mer|nager en sécurité)/,"Baignade 🏊 : baigne-toi dans les <b>zones surveillées</b> entre les drapeaux, surveille les enfants en permanence, méfie-toi des baïnes, et n'entre pas dans une eau que tu ne « lis » pas."],
   [/(chausson|gant|cagoule|froid aux pieds|froid aux mains)/,"En eau froide 🥶 : chaussons dès ~15°C, gants et cagoule sous ~12°C. Ça change tout sur la durée de session et le plaisir."],
   [/(entretien.*combi|rincer.*combi|laver.*combi|sécher.*combi|nettoyer.*combi)/,"Pour faire durer ta combi : rince-la à l'eau douce après chaque session, sèche-la à l'ombre (jamais au soleil ni au sèche-linge) et range-la sur un cintre large."],
   [/(crème solaire|creme solaire|protection solaire|reef.?safe|quelle crème)/,"Choisis une crème solaire « <b>reef safe</b> » (sans oxybenzone ni octinoxate) 🧴 : elle protège ta peau sans empoisonner les coraux. Et pense au lycra pour les longues sessions."],
   [/(bouchon.*oreille|surfer.?s ear|otite.*surf|protéger.*oreille|exostose)/,"L'eau froide répétée peut causer la « <b>surfer's ear</b> » (l'os de l'oreille se referme) 👂. Porte des <b>bouchons</b> adaptés en eau froide pour protéger tes oreilles sur le long terme."],
   [/(surpêche|surpeche|pêche durable|poisson durable|trop de pêche)/,"La surpêche vide les océans 🐟. Côté assiette : privilégie les espèces durables (labels MSC/ASC), varie les poissons et évite les espèces menacées comme le thon rouge sauvage."],
   [/(filet fantôme|filet fantome|ghost net|filet perdu)/,"Les <b>filets fantômes</b> (filets de pêche perdus) continuent de tuer la faune pendant des années 🪢. Si tu en croises à l'eau, signale-les plutôt que d'essayer de les retirer seul."],
   [/(herbier|posidonie|seagrass)/,"Les herbiers de posidonie sont les « poumons » et nurseries de la Méditerranée 🌿 : ils stockent énormément de carbone. On évite d'y jeter l'ancre et de les piétiner."],
   [/(acidification|océan acide|mer acide)/,"En absorbant le CO₂, l'océan s'<b>acidifie</b>, ce qui fragilise coquilles et coraux 🐚. C'est l'autre face cachée du changement climatique."],
   [/(comment aider|que faire pour.*océan|comment protéger|agir pour.*océan|aider la planète)/,"Pour aider l'océan 💙 : réduis le plastique à usage unique, ramasse ce que tu croises, choisis une crème reef-safe, respecte la faune à distance et participe à des ramassages de plage. Petit + petit = grand !"],
   [/(combien.*océan.*terre|surface des océan|recouvr.*océan|océans? couvrent)/,"Les océans couvrent <b>71 % de la Terre</b> 🌍 et contiennent 97 % de l'eau de la planète. Pourtant on en a exploré moins d'un quart en détail !"],
   [/(explore.*océan|exploré.*océan|fonds marins|connait.*fond|mystère.*océan|inexploré)/,"On a mieux cartographié Mars que nos océans 🛰️ : plus de 80 % des fonds marins restent inexplorés. Les abysses sont la plus grande frontière inconnue de la Terre."],
   [/(plus grande vague|plus grosse vague|record.*vague|vague la plus|plus haute vague)/,"La plus grosse vague jamais surfée l'a été à <b>Nazaré</b> (Portugal), autour de 26 m 🌊 — merci le canyon sous-marin qui amplifie la houle."],
   [/(continent de plastique|7e continent|septième continent|garbage patch|vortex de déchets)/,"Le « continent de plastique » du Pacifique n'est pas une île solide mais une immense <b>soupe</b> de micro-plastiques 🌊, grande comme plusieurs fois la France. D'où l'importance de réduire le plastique."],
   [/(qui a inventé le surf|origine du surf|histoire du surf|né le surf|inventé le surf)/,"Le surf est né en <b>Polynésie</b> et à <b>Hawaï</b> il y a des siècles ('he'e nalu') 🏄. Sport des rois hawaïens, il a failli disparaître avant de renaître au XXᵉ siècle."],
   [/(blague|raconte.*drôle|fais.*rire|une blague|fais moi rire)/,"Quelle est la danse préférée du poulpe ? 🐙 Le <b>break dance</b>… avec 8 bras, forcément ! 🕺 Allez, retourne vite à l'eau 🌊."],
   [/(je t'aime|tu gères|tu assures|t'es le meilleur|trop fort poulpy)/,"Aw, merci 🐙💙 ! Toujours là pour t'aider à explorer l'océan en sécurité. File rider une belle vague pour moi !"],
   [/(crabe|homard|langouste|crustacé)/,"Crabes et homards portent leur squelette à l'extérieur (carapace) 🦀 et muent pour grandir. Un homard peut vivre plus de 50 ans !"],
   [/(étoile de mer|etoile de mer|astérie)/,"L'étoile de mer ⭐ peut <b>régénérer un bras</b> coupé, et certaines reconstituent tout le corps à partir d'un seul bras ! Elle n'a ni cerveau ni sang."],
   [/(physalie|galère portugaise|galere portugaise|caravelle portugaise)/,"La physalie (« galère portugaise ») n'est pas une méduse mais une colonie 🪼. Sa piqûre est très douloureuse : ne la touche jamais, même échouée sur la plage."],
   [/(nudibranche|limace de mer)/,"Les nudibranches (limaces de mer) sont les bijoux du récif 🌈 : des couleurs folles qui préviennent qu'ils sont toxiques. Le rêve des photographes sous-marins."],
   [/(écholocation|echolocation|sonar)/,"Dauphins et baleines à dents « voient » avec le son 🔊 : ils émettent des clics et écoutent l'écho (écholocation) pour chasser et naviguer dans le noir total."],
   [/(poisson volant|exocet)/,"Les poissons volants planent au-dessus de l'eau jusqu'à 50 m pour échapper aux prédateurs 🐟 — leurs nageoires servent d'ailes !"],
   [/(espadon|marlin)/,"L'espadon et le marlin comptent parmi les poissons les plus rapides de l'océan 🗡️ — le marlin peut filer à plus de 100 km/h !"],
   [/(\bthon\b|thons)/,"Le thon est un nageur infatigable au sang chaud 🐟 : il doit nager en permanence pour respirer. Le thon rouge sauvage est surpêché — privilégie des sources durables."],
   [/(calmar|calamar|seiche|encornet)/,"Le calmar géant peut dépasser 12 m 🦑 ! Calmars et seiches sont, comme les poulpes, des céphalopodes ultra-intelligents qui changent de couleur en un éclair."],
   [/(mérou|merou)/,"Le mérou est un gros poisson curieux et placide des récifs 🐟. Très sensible à la pêche, il revient en confiance dans les réserves protégées."],
   [/(barracuda)/,"Le barracuda impressionne avec ses dents 🐟, mais il est surtout curieux et inoffensif. Évite juste de nager avec des objets brillants qui l'attirent."],
   [/(\bkrill\b)/,"Le krill, minuscule crevette des mers froides 🦐, est à la base de toute la chaîne alimentaire : il nourrit baleines, manchots et phoques par milliards."],
   [/(dugong|lamantin|sirène|sirénien)/,"Dugongs et lamantins, les « vaches de mer » 🌊, broutent les herbiers tranquillement. Ce sont eux qui ont inspiré les légendes de sirènes !"],
   [/(albatros|goéland|goeland|mouette|oiseau marin|fou de bassan)/,"Les oiseaux marins comme l'albatros planent des jours sans battre des ailes 🪽 et font le tour du globe. Beaucoup sont menacés par le plastique et la pêche."],
   [/(anguille|congre|murène|murene)/,"Murènes et congres se cachent dans les trous du récif 🐍. Pas agressifs si on ne met pas les doigts dans leur trou — on regarde, on ne touche pas !"],
   [/(vague scélérate|vague scelerate|rogue wave|vague monstre|vague géante isolée)/,"Les <b>vagues scélérates</b> sont des vagues géantes et imprévisibles, nées quand plusieurs houles s'additionnent 🌊. Rares, mais redoutées des marins en haute mer."],
   [/(tsunami)/,"Un <b>tsunami</b> naît surtout d'un séisme sous-marin 🌊. Signe d'alerte : la mer qui se retire d'un coup. Le réflexe : s'éloigner vite de la côte vers les hauteurs."],
   [/(algue toxique|efflorescence|eau rouge)/,"La « marée rouge » est une explosion d'algues parfois toxiques 🔴 qui colore l'eau : baignade et coquillages peuvent devenir dangereux. Évite l'eau quand c'est signalé."],
   [/(upwelling|remontée d'eau|remontee d'eau|pourquoi.*eau.*froide)/,"L'<b>upwelling</b> : le vent pousse l'eau de surface au large, remplacée par de l'eau froide profonde et riche en nutriments 🌊. D'où des eaux froides mais très poissonneuses (Pérou, Afrique du Sud…)."],
   [/(thermocline)/,"La <b>thermocline</b> est la couche où l'eau passe brusquement du chaud (surface) au froid (profondeur) 🌡️. En plongée, on la traverse nettement en descendant !"],
   [/(montée des eaux|montee des eaux|niveau de la mer|montée du niveau)/,"Le niveau de la mer monte (~20 cm depuis 1900, et ça s'accélère) à cause de la fonte des glaces et de la dilatation de l'eau chaude 🌡️ — un enjeu majeur pour les côtes."],
   [/(\bgyre\b|tourbillon océan|tourbillon ocean)/,"Un <b>gyre</b> est un immense tourbillon de courants océaniques 🌀. C'est au centre de ces gyres que s'accumulent les déchets plastiques."],
   [/(coriolis)/,"La <b>force de Coriolis</b>, due à la rotation de la Terre 🌍, fait tourner courants et tempêtes : sens des aiguilles d'une montre au Nord, l'inverse au Sud."],
   [/(sargasse|mer des sargasses)/,"Les <b>sargasses</b> sont des algues brunes flottantes 🟤. En pleine mer elles abritent une vie incroyable ; échouées en masse (Caraïbes), elles posent problème."],
   [/(écume|ecume|mousse de mer)/,"L'écume blanche sur la plage 🫧, c'est de l'eau de mer riche en matières organiques (algues, plancton) fouettée par les vagues — naturelle et le plus souvent inoffensive."],
   [/(floater|top.?turn|\bsnap\b|réenroul|reenroul)/,"Le <b>top turn</b> (snap) : un virage sec en haut de la vague pour repartir vers le bas et projeter de la gerbe 💦. Le <b>floater</b> glisse sur le sommet d'une section qui ferme."],
   [/(aerial|figure aérienne|saut.*vague|décoller.*vague)/,"L'<b>aerial</b> : tu utilises la vague comme tremplin pour décoller et retomber sur la face 🛹. Niveau avancé : vitesse, lecture et… beaucoup de chutes avant d'y arriver !"],
   [/(voyage surf|trip surf|où partir|ou partir|destination surf|partir surfer)/,"Pour un trip surf 🌴 : débutant → Portugal, Maroc, Bali, Canaries (eau douce, écoles) ; confirmé → Indonésie, Mentawai, Fidji. Vérifie la <b>saison de houle</b> avant de réserver !"],
   [/(échauffement|echauffement|étirement|etirement|s'échauffer|avant de surfer)/,"Avant l'eau, échauffe épaules, dos et jambes 🤸 : rotations des bras, fentes, étirements doux. Ça améliore ta rame et réduit le risque de blessure."],
   [/(réparer.*planche|reparer.*planche|\bding\b|trou.*planche|planche cassée)/,"Un « ding » (trou) laisse entrer l'eau et abîme la planche 🛠️. Sèche-la et répare avec un kit résine (type Solarez) avant de retourner à l'eau, sinon le pâton gonfle."],
   [/(transporter.*planche|porter.*planche|sur le toit|voiture.*planche)/,"Porte ta planche sous le bras, ailerons vers l'arrière et côté toi 🏄. En voiture : sur des barres avec sangles, pont vers le bas, nose vers l'arrière."],
   [/(traction pad|pad arrière|\bgrip\b)/,"Le <b>pad</b> (grip arrière) aide ton pied arrière à accrocher pour les manœuvres 🛹. À l'avant, on met de la <b>wax</b> pour ne pas glisser."],
   [/(école de surf|ecole de surf|prendre des cours|choisir.*école|moniteur)/,"Pour débuter, une bonne <b>école</b> (label, petits groupes, matériel adapté) te fait progresser vite et en sécurité 🏄. Demande un moniteur diplômé et un spot abrité."],
   [/(crampe|crampes)/,"Une crampe à l'eau 🦵 ? Reste calme, allonge-toi sur ta planche, étire doucement le muscle et rentre tranquillement. Bien s'hydrater et s'échauffer aide à les éviter."],
   [/(coupure.*corail|coupure.*récif|coupure.*recif|plaie.*corail|coupé.*corail)/,"Les coupures de corail s'infectent vite 🪸 : nettoie bien à l'eau claire, retire les débris, désinfecte et surveille. Consulte si ça rougit ou gonfle."],
   [/(déshydrat|deshydrat|hydrater|boire.*surf)/,"Même dans l'eau on se déshydrate 💧 ! Bois avant et après ta session, surtout par temps chaud ou venté — ça réduit fatigue et crampes."],
   [/(coup de soleil|insolation|protéger du soleil|protection du soleil)/,"Sur l'eau, le soleil tape double (réverbération) ☀️ : crème reef-safe, lycra à manches, casquette et lunettes. Réapplique après chaque longue session."],
   [/(hypothermie|choc thermique|eau glacée|eau glacee)/,"En eau froide 🥶, l'hypothermie guette : combinaison adaptée, sessions plus courtes, et sors dès que tu frissonnes fort. Réchauffe-toi ensuite progressivement."],
   [/(plonger.*tête|eau peu profonde|sauter.*eau|plonger.*sable)/,"Ne plonge JAMAIS tête la première dans une eau dont tu ignores la profondeur 🚫 : les blessures au cou en eau peu profonde sont graves. Entre par les pieds d'abord."],
   [/(planche en mousse|softboard|mousse ou rigide|foam board)/,"Pour débuter, la <b>planche en mousse</b> (softboard) est reine 🟦 : stable, elle pardonne les erreurs et est moins dangereuse pour toi et les autres. Tu passeras au rigide en progressant."],
   [/(poncho|robe de change|se changer.*plage|se changer.*parking)/,"Le <b>poncho</b> (robe de change) te permet de te changer discrètement sur le parking 🧥 et de te réchauffer vite. Un classique du surfeur !"],
   [/(aire marine protégée|aire marine protegee|réserve marine|reserve marine|zone protégée)/,"Les <b>aires marines protégées</b> laissent la vie se régénérer 🐠 : des poissons plus gros et plus nombreux, qui « débordent » ensuite vers les zones voisines. Un outil clé pour l'océan."],
   [/(mangrove)/,"Les <b>mangroves</b> (forêts les pieds dans l'eau) 🌳 sont des nurseries à poissons, protègent les côtes des tempêtes et stockent énormément de carbone. Précieuses et menacées."],
   [/(forêt de kelp|foret de kelp|laminaire|forêt d'algue)/,"Les <b>forêts de kelp</b> (grandes algues) sont des jungles sous-marines 🌿 qui abritent loutres, poissons et invertébrés, et capturent du CO₂. Superbes à explorer en palmes."],
   [/(es.?tu une.*ia|es.?tu une vraie ia|t'es une ia|intelligence artificielle|es.?tu un robot)/,"Bonne question 🐙 ! Pour l'instant je réponds avec une base de connaissances « maison » (pas encore un vrai modèle d'IA), pour rester gratuit et instantané. Mais on peut me brancher sur une vraie IA quand l'app a un serveur 😉."],
   [/(sécur|secur|danger|noyade|risque|leash|seul|accompagn|sauvet)/,()=>({html:'🛟 '+pick(SECU)})],
   [/(écolo|ecolo|déchet|dechet|plastique|planète|planete|environ|propre|pollution|nature|protég|proteg|sauver.*océan)/,eco],
   [/(quel spot|un spot|où surfer|ou surfer|spot.*aujourd|conseille.*spot|recommand|aller surfer|meilleur spot|spot du jour|où aller|ou aller)/,spotReco],
   [/(progres|niveau|\bxp\b|badge|créature|creature|débloqu|debloqu|défi|defi|coach|motiv)/,prog]
  ];
  for(const k of KB){ if(k[0].test(q)) return typeof k[1]==='function'?k[1]():{html:k[1]}; }
  return {html:"Bonne question ! 🐙 Je gère plein de sujets : 🏄 spots &amp; <b>technique de surf</b>, 🌊 <b>vagues / houle / marées</b>, 🐢 <b>faune marine</b>, 🌦️ <b>météo</b>, 🌱 <b>écologie</b>, 📈 ta <b>progression</b>… reformule ta question ou choisis un sujet ci-dessous !"};
}

/* ================= OCEAN AMBIANCE (persistant, en couleurs) ================= */
function ambTurtle(){return '<svg viewBox="0 0 64 42"><ellipse cx="12" cy="14" rx="6" ry="3.4" transform="rotate(-26 12 14)" fill="#4eae5c"/><ellipse cx="12" cy="32" rx="6" ry="3.4" transform="rotate(26 12 32)" fill="#4eae5c"/><ellipse cx="46" cy="34" rx="6" ry="3.4" fill="#4eae5c"/><circle cx="52" cy="20" r="6" fill="#4eae5c"/><ellipse cx="32" cy="22" rx="18" ry="13" fill="#3f9a55"/><path d="M14 18 q18 -11 36 0 q-18 9 -36 0Z" fill="#6cc070"/><g fill="none" stroke="#2f7a44" stroke-width="1.2" opacity=".5"><path d="M22 14 v16M32 12 v18M42 14 v16"/></g><circle cx="54" cy="19" r="1.1" fill="#10130f"/></svg>';}
function ambDolphin(t){return '<g transform="'+t+'"><path d="M2 16 Q14 0 38 4 Q50 2 52 12 Q50 20 40 16 Q16 24 2 16Z" fill="#5d8fc0"/><path d="M24 5 q4 -8 9 -7 q-2 6 -5 9Z" fill="#4a79a8"/><path d="M8 16 q14 -6 30 -1 q-14 5 -30 1Z" fill="#dbe9f7"/><circle cx="45" cy="9" r="1" fill="#10130f"/></g>';}
function ambDolphinPod(){return '<svg viewBox="0 0 124 44">'+ambDolphin('translate(0,8)')+ambDolphin('translate(34,0) scale(.92)')+ambDolphin('translate(66,16) scale(.8)')+'</svg>';}
function ambRay(){return '<svg viewBox="0 0 66 40"><path d="M33 8 C18 8 4 27 8 31 C16 27 22 29 28 33 C30 27 33 26 33 26 C33 26 36 27 38 33 C44 29 50 27 58 31 C62 27 48 8 33 8Z" fill="#5a6b94"/><path d="M33 26 q1 11 -1 15" stroke="#46577f" stroke-width="2.2" fill="none" stroke-linecap="round"/><g stroke="#8a99bd" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M29 11 q-2 -4 -5 -5"/><path d="M37 11 q2 -4 5 -5"/></g><circle cx="27" cy="18" r="1.2" fill="#10130f"/><circle cx="39" cy="18" r="1.2" fill="#10130f"/></svg>';}
function ambWhale(){return '<svg viewBox="0 0 82 46"><path d="M6 24 q4 -16 30 -16 q30 0 38 14 q3 8 -3 12 q-14 8 -36 5 q-26 -3 -29 -15Z" fill="#4f7fc4"/><path d="M72 22 q10 -5 10 3 q0 8 -10 8 q-3 -6 0 -11Z" fill="#3f6cad"/><path d="M8 28 q26 10 56 3 q-4 6 -12 8 q-26 5 -44 -11Z" fill="#cfe2f7"/><g stroke="#aecbef" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M32 8 q-3 -8 0 -11"/><path d="M32 8 q3 -8 6 -10"/></g><circle cx="22" cy="22" r="1.5" fill="#10130f"/></svg>';}
function ambFishSchool(){let g='';[[4,6],[18,2],[16,16],[30,9],[28,23],[42,14]].forEach(p=>g+='<g transform="translate('+p[0]+','+p[1]+')"><path d="M0 5 Q4 0 9 3 Q12 1 12 5 Q12 9 9 7 Q4 10 0 5Z" fill="#ff9a3d"/><circle cx="9" cy="4.4" r=".9" fill="#10130f"/></g>');return '<svg viewBox="0 0 58 36">'+g+'</svg>';}
function ambJelly(){return '<svg viewBox="0 0 30 42"><path d="M3 16 a12 12 0 0 1 24 0 q0 3 -3 4 l-18 0 q-3 -1 -3 -4Z" fill="#d77ab8"/><ellipse cx="11" cy="11" rx="4" ry="5" fill="#fff" opacity=".35"/><g stroke="#c46bb0" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M8 22 q-1 9 1 16M15 22 v18M22 22 q1 9 -1 16"/></g></svg>';}
function ambReef(){return '<svg class="reef" viewBox="0 0 392 176" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
+'<defs><linearGradient id="rfSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8e9bf"/><stop offset="100%" stop-color="#e0c489"/></linearGradient>'
+'<linearGradient id="rfFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2f95bf" stop-opacity=".26"/><stop offset="100%" stop-color="#1a6b98" stop-opacity=".5"/></linearGradient>'
+'<linearGradient id="rfVeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2f9ec7" stop-opacity=".26"/><stop offset="100%" stop-color="#2f9ec7" stop-opacity="0"/></linearGradient></defs>'
+'<path d="M0 104 Q34 74 70 92 Q108 110 146 84 Q188 56 232 84 Q278 112 318 80 Q350 56 392 76 L392 176 L0 176Z" fill="url(#rfFar)"/>'
+'<path d="M0 134 Q60 118 130 130 Q210 144 280 126 Q340 114 392 128 L392 176 L0 176Z" fill="url(#rfSand)"/>'
+'<g stroke="#d9bd83" stroke-width="1.6" fill="none" opacity=".5"><path d="M16 152 q26 -6 52 0M104 162 q30 -6 60 0M226 150 q28 -6 56 0M306 164 q26 -5 52 0"/></g>'
+'<ellipse cx="58" cy="150" rx="34" ry="16" fill="#7f95a5"/><ellipse cx="336" cy="154" rx="38" ry="17" fill="#71879a"/>'
+'<g class="weedA" fill="#2f9e6a"><path d="M26 176 Q15 130 26 96 Q37 64 26 40 Q34 84 34 136 Q34 162 26 176Z"/><path d="M42 176 Q33 138 42 108 Q51 82 42 60 Q49 100 49 144 Q49 164 42 176Z" fill="#3bb17c"/></g>'
+'<g class="weedC" fill="#4fc48d"><path d="M158 176 Q148 136 158 106 Q168 78 158 52 Q165 96 165 140 Q165 164 158 176Z"/></g>'
+'<g class="weedB" fill="#37b377"><path d="M368 176 Q379 132 368 100 Q357 70 368 46 Q360 92 360 140 Q360 164 368 176Z"/></g>'
+'<path d="M60 176 Q54 96 87 86 Q120 96 114 176Z" fill="#ff8fa3"/>'
+'<g stroke="#e2708c" stroke-width="2" fill="none" opacity=".5"><path d="M72 172 q8 -34 2 -66M87 174 q8 -38 0 -74M102 172 q-8 -36 -1 -66"/></g>'
+'<g stroke="#ff8f4e" stroke-width="7" fill="none" stroke-linecap="round"><path d="M136 176 V112"/><path d="M136 130 q-14 -12 -19 -32M136 118 q14 -13 20 -30"/></g>'
+'<g stroke="#ffb07a" stroke-width="3" fill="none" stroke-linecap="round"><path d="M117 98 v-10M156 88 v-10M136 112 v-12"/></g>'
+'<g class="fanS"><g stroke="#b06fd0" stroke-width="4" fill="none" stroke-linecap="round"><path d="M198 176 V78"/><path d="M198 118 q-18 -10 -26 -32M198 118 q18 -10 26 -32M198 96 q-14 -8 -19 -25M198 96 q14 -8 19 -25M198 78 q-10 -6 -13 -18M198 78 q10 -6 13 -18"/></g></g>'
+'<g fill="#ffce54"><path d="M240 176 V80 q0 -9 9 -9 q9 0 9 9 V176Z"/><path d="M256 176 V100 q0 -8 8 -8 q8 0 8 8 V176Z"/><path d="M228 176 V104 q0 -8 8 -8 q8 0 8 8 V176Z"/></g>'
+'<g fill="#eba824" opacity=".6"><ellipse cx="249" cy="80" rx="8" ry="3"/><ellipse cx="264" cy="100" rx="7" ry="2.6"/><ellipse cx="236" cy="104" rx="7" ry="2.6"/></g>'
+'<g fill="#e56ba8"><circle cx="284" cy="112" r="16"/><circle cx="301" cy="128" r="12"/><circle cx="269" cy="130" r="11"/><circle cx="290" cy="137" r="13"/></g>'
+'<g fill="#f492c6" opacity=".65"><circle cx="279" cy="106" r="5"/><circle cx="298" cy="123" r="3.6"/><circle cx="268" cy="126" r="3.4"/></g>'
+'<g class="anemS"><ellipse cx="320" cy="150" rx="17" ry="8" fill="#3fb9ab"/><g stroke="#5fdcc9" stroke-width="3.6" stroke-linecap="round" fill="none"><path d="M320 148 V96M320 148 l-16 -30M320 148 l16 -30M320 148 l-24 -18M320 148 l24 -18M320 148 l-9 -40M320 148 l9 -40"/></g></g>'
+'<g stroke="#ff7d6e" stroke-width="5" fill="none" stroke-linecap="round"><path d="M348 176 V128"/><path d="M348 142 q-9 -9 -12 -22M348 134 q9 -8 12 -19"/></g>'
+'<g class="rfishA"><g transform="translate(66,66) scale(1.3)"><path d="M0 6 Q6 0 14 4 Q18 1 18 6 Q18 11 14 8 Q6 12 0 6Z" fill="#ffd34e"/><circle cx="14" cy="5.4" r="1.1" fill="#123"/></g></g>'
+'<g class="rfishB"><g transform="translate(214,54) scale(1.3)"><path d="M0 5 Q5 0 12 3 Q15 1 15 5 Q15 9 12 7 Q5 10 0 5Z" fill="#ff8a3d"/><path d="M6 1.5 q1.6 3.5 0 7" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="12" cy="4.4" r="1" fill="#123"/></g></g>'
+'<g class="rfishC"><g transform="translate(292,74) scale(1.25)"><path d="M0 5 Q5 0 12 3 Q15 1 15 5 Q15 9 12 7 Q5 10 0 5Z" fill="#5fb8ea"/><circle cx="12" cy="4.4" r="1" fill="#123"/></g></g>'
+'<rect x="0" y="0" width="392" height="104" fill="url(#rfVeil)"/>'
+'</svg>';}
function ambient(){const a=document.getElementById('ambiance');if(!a)return;
  let h='<div class="caustics"></div><div class="ray2" style="left:18%"></div><div class="ray2" style="left:60%;animation-delay:3s"></div>';
  for(let i=0;i<18;i++){const s=(5+Math.random()*14).toFixed(0);h+='<i class="bub" style="left:'+(Math.random()*100).toFixed(1)+'%;width:'+s+'px;height:'+s+'px;animation-duration:'+(9+Math.random()*9).toFixed(1)+'s;animation-delay:'+(Math.random()*12).toFixed(1)+'s"></i>';}
  const sw=[[ambTurtle(),'11',64,'right',42,0,.8],[ambDolphinPod(),'32',106,'left',28,6,.78],[ambRay(),'56',68,'right',48,13,.72],[ambWhale(),'66',118,'left',64,22,.6],[ambFishSchool(),'24',56,'right',22,9,.85],[ambJelly(),'74',30,'bob',20,2,.8]];
  sw.forEach(s=>{h+='<div class="swimmer '+s[3]+'" style="top:'+s[1]+'%;width:'+s[2]+'px;opacity:'+s[6]+';animation-duration:'+s[4]+'s;animation-delay:'+s[5]+'s">'+s[0]+'</div>';});
  h+=ambReef();
  h+='<div class="depth"></div>';
  a.innerHTML=h;}

/* ================= QUIZ DE POULPY ================= */
const QUIZ_CATS=[{id:'tout',label:'Tout',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9c2.2 0 2.2-2.4 4.4-2.4S8.6 9 10.8 9 13 6.6 15.2 6.6 17.4 9 19.6 9"/><path d="M2 14c2.2 0 2.2-2.4 4.4-2.4S8.6 14 10.8 14 13 11.6 15.2 11.6 17.4 14 19.6 14"/><path d="M2 19c2.2 0 2.2-2.4 4.4-2.4S8.6 19 10.8 19 13 16.6 15.2 16.6 17.4 19 19.6 19"/></svg>'},{id:'faune',label:'Faune',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3-4 9.5-4 13 0-3.5 4-10 4-13 0z"/><path d="M16 9c1.8-1.1 3.6-1.1 5 0-1 2-1 4 0 6-1.4 1.1-3.2 1.1-5 0"/><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none"/></svg>'},{id:'secu',label:'Sécurité',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5"/></svg>'},{id:'tech',label:'Technique',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 18.5C3 16 6 8.5 11 4.5s9-1.5 7.5 1.5"/><path d="M5.5 18.5c2.5 2.5 9-.5 13-5.5"/><path d="M8 16 16 7.5"/></svg>'},{id:'ocean',label:'Océan',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 2.6 3 14.4 0 17M12 3.5c-3 2.6-3 14.4 0 17"/></svg>'},{id:'eco',label:'Écologie',emoji:'<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20C5 12 10 8 19 8c0 8-5 12-14 12z"/><path d="M5 20c2-5 5-7 9-8.5"/></svg>'}];
const QUIZ_BANK=[
 {c:'faune',q:'Combien de cœurs a un poulpe ?',a:['1','2','3','8'],k:2,e:'Trois cœurs… et du sang bleu !'},
 {c:'faune',q:'Quel animal peut régénérer un bras coupé ?',a:['Le requin','L’étoile de mer','Le thon','Le manchot'],k:1,e:'Certaines étoiles repoussent même tout le corps depuis un bras.'},
 {c:'faune',q:'La « galère portugaise » (physalie) est…',a:['une méduse','une colonie d’organismes','un poisson','une algue'],k:1,e:'Une colonie flottante — et elle pique très fort.'},
 {c:'faune',q:'Qui produit plus de la moitié de l’oxygène qu’on respire ?',a:['Les arbres','Le plancton océanique','Les coraux','Le krill'],k:1,e:'Une respiration sur deux vient de la mer !'},
 {c:'faune',q:'Le requin-baleine, plus grand poisson du monde, mange surtout…',a:['des phoques','du plancton','des tortues','des dauphins'],k:1,e:'Un géant doux et totalement inoffensif.'},
 {c:'faune',q:'Chez l’hippocampe, qui porte les bébés ?',a:['La femelle','Le mâle','Les deux','Personne'],k:1,e:'C’est le mâle qui accouche !'},
 {c:'faune',q:'Les dauphins « voient » dans le noir grâce à…',a:['leurs yeux','l’écholocation','l’odorat','la chaleur'],k:1,e:'Des clics sonores et leur écho.'},
 {c:'faune',q:'Le krill est…',a:['un gros poisson','une minuscule crevette','une algue','un oiseau'],k:1,e:'La base de la chaîne alimentaire des mers froides.'},
 {c:'faune',q:'Quel animal a inspiré les légendes de sirènes ?',a:['Le dauphin','Le lamantin / dugong','Le phoque','La raie'],k:1,e:'Les « vaches de mer » brouteuses d’herbiers.'},
 {c:'secu',q:'Pris dans une baïne (courant), il faut…',a:['nager droit vers la plage','nager parallèlement à la plage','paniquer','plonger au fond'],k:1,e:'On nage parallèlement pour sortir du courant.'},
 {c:'secu',q:'Quel drapeau signifie « baignade interdite » ?',a:['Vert','Orange','Rouge','Bleu'],k:2,e:'Rouge = interdit ; violet = animaux dangereux.'},
 {c:'secu',q:'Le numéro d’urgence qui marche sur mobile presque partout ?',a:['911','112','15','18'],k:1,e:'Le 112 fonctionne dans la plupart des pays.'},
 {c:'secu',q:'Piqûre de vive (poisson du sable) : on trempe le pied dans…',a:['de la glace','de l’eau chaude','du vinaigre','du sable'],k:1,e:'Le venin de la vive craint la chaleur.'},
 {c:'secu',q:'En surf, le surfeur prioritaire sur la vague est…',a:['le plus loin','le plus proche du pic','le plus rapide','le plus âgé'],k:1,e:'Le plus proche du pic a la priorité.'},
 {c:'secu',q:'Dans une eau dont on ignore la profondeur, on entre…',a:['tête la première','par les pieds','en courant','en sautant'],k:1,e:'Jamais tête la première — risque de blessure au cou.'},
 {c:'secu',q:'La règle d’or de l’apnée :',a:['y aller seul','toujours avec un binôme','retenir le plus longtemps','plonger très profond'],k:1,e:'Jamais seul : la syncope est le vrai danger.'},
 {c:'secu',q:'Signe d’alerte d’un tsunami :',a:['la mer qui se retire d’un coup','un ciel rouge','des oiseaux qui chantent','rien'],k:0,e:'On s’éloigne vite vers les hauteurs.'},
 {c:'secu',q:'Par quel vent les vagues sont-elles les plus propres ?',a:['onshore','offshore','peu importe','très fort'],k:1,e:'Offshore (de la terre) lisse et creuse les vagues.'},
 {c:'tech',q:'Le « take-off », c’est…',a:['tomber','se redresser sur la planche','ramer','attendre'],k:1,e:'Le moment où tu te lèves sur la vague.'},
 {c:'tech',q:'Pour passer sous la vague en shortboard, on fait…',a:['un canard','une tortue','un saut','rien'],k:0,e:'Le canard ; la tortue, c’est en longboard.'},
 {c:'tech',q:'« Regular » signifie…',a:['pied droit devant','pied gauche devant','débutant','expert'],k:1,e:'Goofy = pied droit devant.'},
 {c:'tech',q:'Une planche avec beaucoup de volume (litres) est…',a:['plus maniable','plus stable et facile à ramer','plus rapide','réservée aux experts'],k:1,e:'Idéal pour débuter.'},
 {c:'tech',q:'Le « tube » (barrel), c’est quand…',a:['tu tombes','la vague s’enroule au-dessus de toi','tu rames','la vague ferme'],k:1,e:'Le Graal du surfeur !'},
 {c:'tech',q:'Pour débuter, la meilleure planche est…',a:['un shortboard','une planche en mousse','un gun','une planche fine'],k:1,e:'Stable et qui pardonne les erreurs.'},
 {c:'tech',q:'La wax sert à…',a:['aller plus vite','ne pas glisser sur la planche','mieux flotter','protéger la planche'],k:1,e:'De l’accroche pour les pieds.'},
 {c:'tech',q:'Un « beach break » a un fond de…',a:['récif','sable','rochers','corail'],k:1,e:'Plus sûr, idéal pour débuter.'},
 {c:'tech',q:'Pour prendre de la vitesse sur la vague, on…',a:['freine','pompe (haut/bas)','s’assoit','rame'],k:1,e:'Comme sur une balançoire.'},
 {c:'tech',q:'Combien d’ailerons a un « thruster » ?',a:['1','2','3','4'],k:2,e:'Trois ailerons, le set-up le plus polyvalent.'},
 {c:'ocean',q:'Quelle part de la Terre est couverte par les océans ?',a:['30 %','50 %','71 %','90 %'],k:2,e:'71 % — et 97 % de l’eau de la planète.'},
 {c:'ocean',q:'Où a été surfée la plus grosse vague du monde ?',a:['Hawaï','Nazaré (Portugal)','Tahiti','Australie'],k:1,e:'~26 m, grâce au canyon sous-marin.'},
 {c:'ocean',q:'Le point le plus profond des océans est…',a:['la fosse des Mariannes','le Triangle des Bermudes','le Gulf Stream','la mer Rouge'],k:0,e:'Près de 11 000 m de profondeur.'},
 {c:'ocean',q:'Pourquoi la mer est-elle salée ?',a:['à cause des poissons','les rivières y apportent des sels','c’est le sable','à cause du soleil'],k:1,e:'Des sels arrachés aux roches depuis des millions d’années.'},
 {c:'ocean',q:'L’« upwelling » apporte en surface…',a:['de l’eau chaude','de l’eau froide riche en nutriments','du sable','du plastique'],k:1,e:'D’où des eaux froides mais très poissonneuses.'},
 {c:'ocean',q:'Une « vague scélérate » est…',a:['une petite vague','une vague géante imprévisible','une vague de surf','une marée'],k:1,e:'Plusieurs houles qui s’additionnent.'},
 {c:'ocean',q:'Les marées sont causées surtout par…',a:['le vent','l’attraction de la Lune','les courants','les bateaux'],k:1,e:'La Lune (et le Soleil).'},
 {c:'ocean',q:'Combien y a-t-il d’océans sur Terre ?',a:['3','4','5','7'],k:2,e:'Cinq, le Pacifique étant le plus grand.'},
 {c:'ocean',q:'Une houle de longue période donne des vagues…',a:['désordonnées','propres et puissantes','minuscules','dangereuses'],k:1,e:'12–16 s = vagues espacées et nettes.'},
 {c:'eco',q:'Pour protéger les coraux, on choisit une crème solaire…',a:['waterproof','« reef safe » sans oxybenzone','la moins chère','parfumée'],k:1,e:'Sans oxybenzone ni octinoxate.'},
 {c:'eco',q:'Le « continent de plastique » est…',a:['une île solide','une soupe de micro-plastiques','un mythe','une plage'],k:1,e:'Une immense soupe, pas une île.'},
 {c:'eco',q:'Les herbiers de posidonie servent à…',a:['rien','stocker du carbone et abriter la vie','polluer','faire du sable'],k:1,e:'Les « poumons » de la Méditerranée.'},
 {c:'eco',q:'Le blanchissement du corail est dû surtout à…',a:['la pollution sonore','une eau trop chaude','les poissons','la Lune'],k:1,e:'Le réchauffement stresse le corail.'},
 {c:'eco',q:'Le geste le plus simple pour aider l’océan :',a:['acheter plus','réduire le plastique à usage unique','pêcher plus','ne rien faire'],k:1,e:'Refuser le jetable, et ramasser ce qu’on croise.'},
 {c:'eco',q:'Une aire marine protégée permet…',a:['moins de poissons','plus de poissons qui débordent autour','rien','plus de pêche'],k:1,e:'La vie se régénère et profite aux alentours.'}
,
 {c:'faune',q:'Le plus grand animal ayant jamais existé est…',a:['le requin-baleine','la baleine bleue','le cachalot','le mégalodon'],k:1,e:'Jusqu’à 30 m, cœur gros comme une voiture.'},
 {c:'faune',q:'Le poisson-clown vit en symbiose avec…',a:['le corail','l’anémone','l’éponge','l’algue'],k:1,e:'Protégé par les tentacules urticants de l’anémone.'},
 {c:'faune',q:'Combien de bras a une étoile de mer, en général ?',a:['3','4','5','6'],k:2,e:'Cinq le plus souvent, mais certaines en ont bien plus !'},
 {c:'faune',q:'Le barracuda est surtout attiré par…',a:['les algues','les objets brillants','le bruit','rien'],k:1,e:'Évite donc bijoux et montres brillantes à l’eau.'},
 {c:'faune',q:'Les nudibranches sont des…',a:['poissons','limaces de mer','méduses','crabes'],k:1,e:'De superbes limaces colorées du récif.'},
 {c:'faune',q:'Le krill nourrit principalement…',a:['les requins','les baleines, manchots et phoques','les coraux','les tortues'],k:1,e:'La base de la chaîne alimentaire des mers froides.'},
 {c:'secu',q:'Que signifie un drapeau violet sur la plage ?',a:['eau froide','présence d’animaux dangereux','baignade autorisée','vent fort'],k:1,e:'Méduses ou autres animaux signalés.'},
 {c:'secu',q:'Le numéro des secours en mer en France est…',a:['le 15','le 18','le 196','le 17'],k:2,e:'Le 196 (ou VHF canal 16).'},
 {c:'secu',q:'Si quelqu’un est en difficulté à l’eau, tu…',a:['plonges seul le chercher','alertes les secours et cherches une aide flottante','l’ignores','attends'],k:1,e:'Ne te mets pas en danger : alerte et tends un objet flottant.'},
 {c:'secu',q:'À quoi sert le leash (cordon) en surf ?',a:['aller plus vite','garder ta planche près de toi','mieux flotter','freiner'],k:1,e:'Ta planche reste à portée après une chute.'},
 {c:'secu',q:'Avant de surfer un nouveau spot, on…',a:['fonce à l’eau','observe courants et autres surfeurs','surfe seul','ferme les yeux'],k:1,e:'On lit l’eau et on repère les dangers d’abord.'},
 {c:'tech',q:'« Goofy » signifie…',a:['pied gauche devant','pied droit devant','maladroit','très rapide'],k:1,e:'Regular = pied gauche devant.'},
 {c:'tech',q:'Le « bottom turn » se fait…',a:['en haut de la vague','en bas de la vague','sur le sable','à plat'],k:1,e:'C’est le virage de base, en bas de la vague.'},
 {c:'tech',q:'En longboard, pour passer la barre on fait…',a:['un canard','une tortue','un saut','un plongeon'],k:1,e:'On retourne la planche (la tortue).'},
 {c:'tech',q:'Quelle combinaison pour une eau à 14°C ?',a:['un shorty','une 4/3 + chaussons','un maillot','rien'],k:1,e:'Eau froide = 4/3 et chaussons.'},
 {c:'tech',q:'Le « line-up », c’est…',a:['la plage','la zone où on attend les vagues','le parking','la digue'],k:1,e:'Là où les surfeurs patientent au pic.'},
 {c:'ocean',q:'Le Gulf Stream est…',a:['un poisson','un grand courant chaud','une vague','une marée'],k:1,e:'Il transporte la chaleur et règle le climat.'},
 {c:'ocean',q:'À la pleine lune, les marées sont…',a:['plus faibles','plus fortes (vives-eaux)','inexistantes','identiques'],k:1,e:'Lune + Soleil alignés = grandes marées.'},
 {c:'ocean',q:'Une houle traverse un océan en…',a:['quelques heures','plusieurs jours','un mois','un an'],k:1,e:'L’énergie voyage sur des milliers de km en quelques jours.'},
 {c:'ocean',q:'L’eau de mer gèle vers…',a:['0°C','-2°C','-10°C','4°C'],k:1,e:'Le sel abaisse le point de congélation.'},
 {c:'ocean',q:'La bioluminescence des vagues vient…',a:['de la pollution','du plancton','de la lune','du sel'],k:1,e:'Du plancton qui s’illumine quand l’eau s’agite.'},
 {c:'eco',q:'Les filets de pêche perdus en mer sont appelés…',a:['filets dormants','filets fantômes','filets fous','filets verts'],k:1,e:'Ils continuent de tuer la faune des années durant.'},
 {c:'eco',q:'Pour une consommation responsable, on évite…',a:['les algues','le thon rouge sauvage surpêché','les moules','les sardines'],k:1,e:'On privilégie les espèces durables (labels MSC/ASC).'},
 {c:'eco',q:'L’acidification des océans est due à l’absorption de…',a:['plastique','CO₂','sel','sable'],k:1,e:'Elle fragilise coquilles et coraux.'},
 {c:'eco',q:'Les mangroves servent à…',a:['polluer','protéger les côtes et abriter la vie','faire du sable','rien'],k:1,e:'Nurseries à poissons et boucliers anti-tempêtes.'}
];
let quizQs=[],quizIdx=0,quizScore=0,quizStreak=0,quizCat='tout',quizAnswered=false;
let quizTimed=false,quizDaily=false,quizTimer=null,quizTimeLeft=0;
const QUIZ_KEY='oceanbuddy_quiz_v1';
function quizLoad(){try{var d=JSON.parse(localStorage.getItem(QUIZ_KEY));if(d&&d.best)return d;}catch(e){}return {best:{},badges:[],daily:''};}
function quizSave(d){try{localStorage.setItem(QUIZ_KEY,JSON.stringify(d));}catch(e){}}
function quizToday(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function quizShuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function openQuiz(){document.getElementById('quizModal').classList.add('open');renderQuizPicker();}
function closeQuiz(){clearQuizTimer();document.getElementById('quizModal').classList.remove('open');}
function quizSetTimed(v){quizTimed=v;renderQuizPicker();}
function renderQuizPicker(){
  var d=quizLoad();var done=d.daily===quizToday();
  var h='<div class="quiz-head"><div class="quiz-octo">'+octoTag()+'</div><h3>Le Quiz de Poulpy</h3><p>Choisis un thème et gagne de l’XP 🌊</p></div>';
  h+='<button class="quiz-daily'+(done?' done':'')+'" onclick="quizStartDaily()"><span class="qd-ic"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg></span><span class="qd-tx"><b>Défi du jour</b><span>'+(done?'Déjà relevé aujourd’hui ✓ · rejouable':'Bonus +30 XP au 1ᵉʳ essai !')+'</span></span><span class="qd-go">'+(done?'↻':'▶')+'</span></button>';
  h+='<div class="quiz-mode"><span>Mode</span><button class="qm-btn'+(quizTimed?'':' on')+'" onclick="quizSetTimed(false)">Normal</button><button class="qm-btn'+(quizTimed?' on':'')+'" onclick="quizSetTimed(true)">⏱️ Chrono</button></div>';
  h+='<div class="quiz-cats">'+QUIZ_CATS.map(function(c){var bs=d.best[c.id]||0;var bd=d.badges.indexOf(c.id)>=0;return '<button class="quiz-cat" onclick="quizPick(\''+c.id+'\')"><span class="qc-e">'+c.emoji+'</span><span class="qc-l">'+c.label+(bd?' 🏅':'')+'</span>'+(bs?'<span class="qc-best">★ '+bs+'</span>':'')+'</button>';}).join('')+'</div>';
  if(d.badges.length){h+='<div class="quiz-badges"><b>🏅 Tes badges :</b> '+d.badges.map(function(id){var c=QUIZ_CATS.filter(function(x){return x.id===id;})[0];return c?('Expert '+c.label):'';}).filter(Boolean).join(' · ')+'</div>';}
  document.getElementById('quizBody').innerHTML=h;
}
function quizStartDaily(){quizDaily=true;quizCat='tout';quizQs=quizShuffle(QUIZ_BANK).slice(0,7);quizIdx=0;quizScore=0;quizStreak=0;renderQuizQuestion();}
function quizPick(cat){quizDaily=false;quizCat=cat;var pool=cat==='tout'?QUIZ_BANK:QUIZ_BANK.filter(function(q){return q.c===cat;});quizQs=quizShuffle(pool).slice(0,Math.min(7,pool.length));quizIdx=0;quizScore=0;quizStreak=0;renderQuizQuestion();}
function clearQuizTimer(){if(quizTimer){clearInterval(quizTimer);quizTimer=null;}}
function startQuizTimer(){quizTimeLeft=15;quizTimer=setInterval(function(){quizTimeLeft-=0.1;var b=document.getElementById('quizTimerBar');if(b)b.style.width=Math.max(0,quizTimeLeft/15*100)+'%';if(quizTimeLeft<=0){clearQuizTimer();quizTimeout();}},100);}
function renderQuizQuestion(){
  quizAnswered=false;clearQuizTimer();
  var q=quizQs[quizIdx],n=quizQs.length,pct=Math.round(quizIdx/n*100);
  var h='<div class="quiz-top"><button class="quiz-x2" onclick="renderQuizPicker()">‹ Thèmes</button><div class="quiz-prog"><i style="width:'+pct+'%"></i></div><span class="quiz-count">'+(quizIdx+1)+'/'+n+'</span></div>';
  if(quizDaily)h+='<div class="quiz-tag"><span class="th"><svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg> Défi du jour</span></div>';
  if(quizTimed)h+='<div class="quiz-timer"><i id="quizTimerBar" style="width:100%"></i></div>';
  h+='<div class="quiz-q">'+q.q+'</div>';
  h+='<div class="quiz-answers" id="quizAnswers">'+q.a.map(function(t,i){return '<button class="quiz-a" data-i="'+i+'" onclick="quizAnswer('+i+')">'+t+'</button>';}).join('')+'</div>';
  h+='<div class="quiz-feedback" id="quizFb"></div>';
  document.getElementById('quizBody').innerHTML=h;
  if(quizTimed)startQuizTimer();
}
function quizRevealNext(){return (quizIdx+1<quizQs.length)?'Question suivante ▶':'Voir mon score 🏁';}
function quizAnswer(i){
  if(quizAnswered)return;quizAnswered=true;clearQuizTimer();
  var q=quizQs[quizIdx];var ok=i===q.k;
  document.querySelectorAll('#quizAnswers .quiz-a').forEach(function(b){var bi=+b.dataset.i;b.disabled=true;if(bi===q.k)b.classList.add('correct');else if(bi===i)b.classList.add('wrong');});
  if(ok){quizScore++;quizStreak++;}else{quizStreak=0;}
  document.getElementById('quizFb').innerHTML='<div class="qf-res '+(ok?'good':'bad')+'">'+(ok?('✅ Bravo !'+(quizStreak>=3?' 🔥 série de '+quizStreak+' !':'')):'❌ Raté')+'</div><div class="qf-exp">💡 '+q.e+'</div><button class="quiz-next" onclick="quizNext()">'+quizRevealNext()+'</button>';
}
function quizTimeout(){
  if(quizAnswered)return;quizAnswered=true;var q=quizQs[quizIdx];
  document.querySelectorAll('#quizAnswers .quiz-a').forEach(function(b){b.disabled=true;if(+b.dataset.i===q.k)b.classList.add('correct');});
  quizStreak=0;
  document.getElementById('quizFb').innerHTML='<div class="qf-res bad">⏱️ Temps écoulé !</div><div class="qf-exp">💡 '+q.e+'</div><button class="quiz-next" onclick="quizNext()">'+quizRevealNext()+'</button>';
}
function quizNext(){clearQuizTimer();if(quizIdx+1<quizQs.length){quizIdx++;renderQuizQuestion();}else{renderQuizResult();}}
function renderQuizResult(){
  clearQuizTimer();
  var n=quizQs.length,s=quizScore,pct=s/n,title,emo;
  if(s===n){title='Maître des océans !';emo='🏆';}
  else if(pct>=0.66){title='Beau niveau, futur pro !';emo='🌊';}
  else if(pct>=0.34){title='En progression, continue !';emo='🐠';}
  else{title='Poulpy va t’apprendre, recommence !';emo='🐚';}
  var xp=s*10+(s===n?20:0),extra='';
  if(quizTimed){xp+=s*3;extra+=' · ⏱️ bonus chrono';}
  var d=quizLoad();
  if(quizDaily&&d.daily!==quizToday()){xp+=30;d.daily=quizToday();extra+=' · 🎯 +30 défi du jour';}
  var key=quizDaily?'tout':quizCat;
  if(!d.best[key]||s>d.best[key])d.best[key]=s;
  var newBadge=null,bc=null;
  if(!quizDaily&&quizCat!=='tout'&&s===n&&d.badges.indexOf(quizCat)<0){d.badges.push(quizCat);newBadge=quizCat;bc=QUIZ_CATS.filter(function(x){return x.id===quizCat;})[0];}
  quizSave(d);renderQuizBadges();
  var h='<div class="quiz-result"><div class="qr-emo">'+emo+'</div><h3>'+title+'</h3><div class="qr-score">'+s+' / '+n+'</div><div class="qr-xp">+'+xp+' XP ✨'+extra+'</div>';
  if(newBadge&&bc)h+='<div class="qr-badge">🏅 Nouveau badge : <b>Expert '+bc.label+'</b> !</div>';
  h+='<div class="qr-btns"><button class="quiz-next" onclick="renderQuizPicker()">Rejouer 🔁</button><button class="quiz-close2" onclick="closeQuiz()">Fermer</button></div></div>';
  document.getElementById('quizBody').innerHTML=h;
  if(xp>0)addXP(xp,'Quiz : +'+xp+' XP 🧠');
  if(newBadge&&bc)setTimeout(function(){toast('🏅 Badge débloqué : Expert '+bc.label+' !');},1100);
  if(pct>=0.66&&typeof spawnConfetti==='function')spawnConfetti();
}

/* ================= INIT ================= */
var _oi=document.getElementById('octo');if(_oi)_oi.innerHTML=poulpySVG();/* #octo est rendu par renderToday : il peut ne pas exister ici */
document.getElementById('octoProfile').innerHTML=poulpySVG();
document.getElementById('logoOcto').innerHTML=poulpySVG();
document.getElementById('logoOcto2').innerHTML=poulpySVG();
['homeTop','spotsTop','chalTop','profTop'].forEach(id=>{const el=document.getElementById(id);el.insertAdjacentHTML('afterbegin',headerSky(id));el.insertAdjacentHTML('beforeend','<svg class="hwave" viewBox="0 0 392 30" preserveAspectRatio="none"><path d="M0 14 Q49 2 98 14 T196 14 T294 14 T392 14 V30 H0Z" fill="#eef9f8"/></svg>');});
document.getElementById('fabOcto').innerHTML=poulpySVG();
document.getElementById('chatOcto').innerHTML=poulpySVG();
renderCompetition();
const returning=loadState();
try{
  const storedReduce=localStorage.getItem('oceanbuddy_reduce');
  if(storedReduce==='1')document.body.classList.add('reduce-motion');
  else if(storedReduce===null&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.body.classList.add('reduce-motion');
}catch(e){}
document.body.classList.add('motion-pref-checked');
applyName();
ambient();renderSportGuide();renderSportFilters();renderSpots();try{renderWorlds();syncWorldUI();}catch(e){}renderChallenges();renderBadges();renderQuizBadges();renderSessions();renderHome();renderProfile();renderQuick();chatDragInit();bubbles('hb');bubbles('pb');bubbles('sb');bubbles('cb');onbBubbles();animateCounts();realHomeForecast();fetchAllConditions();
requestAnimationFrame(()=>requestAnimationFrame(()=>updateNavPill('home')));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{const ab=document.querySelector('.nav button.active:not(.center)');updateNavPill(ab?ab.dataset.s:'home');}).catch(()=>{});
window.addEventListener('resize',()=>{const ab=document.querySelector('.nav button.active:not(.center)');if(ab)updateNavPill(ab.dataset.s);});
if(returning&&chosenLevel){
  quickGate=true;chosenSport=chosenSport||'all';
  const t=document.getElementById('sportStepTitle');if(t)t.textContent='Bon retour ! Quelle activité aujourd\'hui ?';
  showStep(1);
  document.querySelectorAll('#sportGrid .sport-card').forEach(c=>c.classList.toggle('sel',c.dataset.sp===chosenSport));
  document.getElementById('octoBubble').innerHTML='Re-coucou 🐙 ! Content de te revoir.';
}
