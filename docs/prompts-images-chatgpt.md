# Images à créer avec ChatGPT

Ce document sert à générer, dans ChatGPT, les images qui manquent à Ocean Buddy. Les vraies photographies restent prioritaires : une image IA n’est utilisée que pour un spot **sans** photo libre de droits, ou comme scène du « Voyage dans le spot ». Dans l’application, chaque image IA porte la mention « Illustration IA ».

## Mode d’emploi

1. Ouvre ChatGPT et colle le **prompt de départ** ci-dessous (une seule fois par conversation).
2. Envoie ensuite les demandes une par une (ou par petits groupes de 3 à 4).
3. Télécharge chaque image et enregistre-la **exactement** sous le nom indiqué (par exemple `kona.png`), dans le dossier `Ocean-Buddy-git/ai-images/`.
4. Préviens Claude : il lancera `python3 scripts/add_ai_images.py`, vérifiera chaque image et publiera.

## Prompt de départ (à coller en premier)

```
Tu vas créer une série d’images pour Ocean Buddy, une application de spots nautiques (surf, plongée, kitesurf, snorkeling…). Pour chaque demande, génère UNE image avec ces règles :

STYLE
- Photographie de voyage ultra-réaliste, qualité magazine (type Condé Nast Traveller / National Geographic), lumière naturelle flatteuse (golden hour ou plein soleil selon la demande), couleurs vives mais crédibles, eau translucide.
- Format paysage 3:2 (1536 × 1024), cadrage large qui montre le lieu, horizon droit.
- Aucun texte, aucun logo, aucune signature, aucun filigrane, aucun cadre.
- Personnes : au plus quelques silhouettes lointaines en train de pratiquer l’activité, jamais de visage reconnaissable.

FIDÉLITÉ AU LIEU
- Respecte la géographie réelle du spot : type de côte (sable, galets, falaises, récif), couleur du sable, relief, végétation, climat et saison crédibles. N’invente pas de bâtiments, de jetées ou de montagnes qui n’existent pas.
- Si tu hésites sur un détail, préfère une vue plus large et plus simple plutôt qu’un élément inventé.

Je t’enverrai ensuite : le nom du fichier, le lieu et l’activité. Réponds seulement avec l’image.
```

## Partie 1 — Couvertures des spots sans photo (45 images)

Pour chaque ligne, envoie : `Couverture : <lieu>, activité : <activité>. Nom du fichier : <nom>.png`

1. **tamarindo.png** — Tamarindo, Costa Rica (Costa Rica) · surf, bodyboard
2. **byronbay.png** — Byron Bay, Australie (Australia) · surf, stand-up paddle
3. **saintebarbe.png** — Sainte-Barbe, Plouharnel, Morbihan, France (France) · surf, bodyboard
4. **oleron.png** — Les Huttes, Île d’Oléron, France (France) · surf, bodyboard
5. **pounta.png** — Pounta, Paros, Grèce (Greece) · kitesurfing, windsurfing
6. **gozo.png** — Blue Hole de Gozo, Gozo, Malte (Malta) · scuba diving, snorkeling
7. **lahinch.png** — Lahinch, Comté de Clare, Irlande (Ireland) · surf, bodyboard
8. **sylt.png** — Westerland, Sylt, Allemagne (Germany) · surf, windsurfing
9. **aliwal.png** — Aliwal Shoal, KwaZulu-Natal, Afrique du Sud (South Africa) · scuba diving
10. **bigbay.png** — Big Bay, Bloubergstrand, Afrique du Sud (South Africa) · kitesurfing, surf
11. **pontadoouro.png** — Ponta do Ouro, Maputo, Mozambique (Mozambique) · scuba diving, snorkeling
12. **lavanono.png** — Lavanono, Sud, Madagascar (Madagascar) · surf
13. **tamarinmu.png** — Tamarin, Rivière Noire, Maurice (Mauritius) · surf, stand-up paddle
14. **sunsetbeach.png** — Sunset Beach, Oahu, Hawaï, États-Unis (USA) · surf
15. **kona.png** — Baie de Keauhou (raies manta), Kona, Hawaï, États-Unis (USA) · scuba diving, snorkeling
16. **rinconca.png** — Rincon Point, Californie, États-Unis (USA) · surf
17. **catalina.png** — Casino Point, Île Catalina, Californie, États-Unis (USA) · scuba diving, snorkeling
18. **hatteras.png** — Cape Hatteras, Outer Banks, Caroline du Nord, États-Unis (USA) · surf, kitesurfing
19. **puntamita.png** — Punta de Mita, Nayarit, Mexique (Mexico) · surf, stand-up paddle
20. **scorpionbay.png** — Scorpion Bay, Basse-Californie du Sud, Mexique (Mexico) · surf
21. **laventana.png** — La Ventana, Basse-Californie du Sud, Mexique (Mexico) · kitesurfing, windsurfing
22. **soupbowl.png** — Soup Bowl, Bathsheba, Barbade (Barbados) · surf
23. **elzonte.png** — El Zonte, La Libertad, Salvador (El Salvador) · surf
24. **thunderball.png** — Thunderball Grotto, Exumas, Bahamas (Bahamas) · snorkeling
25. **portodegalinhas.png** — Porto de Galinhas, Pernambouc, Brésil (Brazil) · snorkeling, swimming
26. **bonito.png** — Rio da Prata, Bonito, Brésil (Brazil) · snorkeling
27. **prea.png** — Preá, Ceará, Brésil (Brazil) · kitesurfing
28. **puntahermosa.png** — Punta Hermosa, Lima, Pérou (Peru) · surf
29. **desertpoint.png** — Desert Point, Lombok, Indonésie (Indonesia) · surf
30. **lakeypeak.png** — Lakey Peak, Sumbawa, Indonésie (Indonesia) · surf
31. **krui.png** — Krui, Sumatra, Indonésie (Indonesia) · surf
32. **cokes.png** — Cokes, Thulusdhoo, Maldives (Maldives) · surf
33. **miyazaki.png** — Kisakihama, Miyazaki, Japon (Japan) · surf
34. **ishigaki.png** — Manta Scramble, Ishigaki, Okinawa, Japon (Japan) · scuba diving, snorkeling
35. **jialeshui.png** — Jialeshui, Kenting, Taïwan (Taiwan) · surf
36. **riyuebay.png** — Baie de Riyue, Hainan, Chine (China) · surf
37. **lennox.png** — Lennox Head, Nouvelle-Galles du Sud, Australie (Australia) · surf
38. **jervisbay.png** — Jervis Bay, Nouvelle-Galles du Sud, Australie (Australia) · snorkeling, sea kayaking
39. **lordhowe.png** — Île Lord Howe, Nouvelle-Galles du Sud, Australie (Australia) · snorkeling, scuba diving
40. **coralbay.png** — Coral Bay, Australie-Occidentale (Australia) · snorkeling, scuba diving
41. **rainbowreef.png** — Rainbow Reef, Taveuni, Fidji (Fiji) · scuba diving, snorkeling
42. **poe.png** — Plage de Poé, Nouvelle-Calédonie (New Caledonia) · kitesurfing, snorkeling
43. **coolidge.png** — SS President Coolidge, Espiritu Santo, Vanuatu (Vanuatu) · scuba diving
44. **salani.png** — Salani, Upolu, Samoa (Samoa) · surf
45. **aitutaki.png** — Lagon d’Aitutaki, Îles Cook (Cook Islands) · sea kayaking, snorkeling

## Partie 2 — Scènes du « Voyage dans le spot » (30 images)

Ces scènes créent l’immersion : on arrive sur le spot, on s’approche de l’eau, puis on est dedans. Pour chaque spot, envoie les trois demandes à la suite pour garder la même lumière et le même décor.

Prompt type à adapter :

```
Scène immersive, vue à hauteur d’yeux, comme si j’y étais — <lieu>.
Scène 1 (<id>-scene-1.png) : j’arrive par le sentier ou la plage et je découvre le spot en entier, la mer au loin.
Scène 2 (<id>-scene-2.png) : je suis au bord de l’eau, les pieds presque dans les vagues, le spot se dévoile de près.
Scène 3 (<id>-scene-3.png) : je suis DANS l’eau (<activité>) : vue depuis la planche ou sous la surface selon l’activité.
Même lumière, même heure et même météo pour les trois images, format paysage 16:9 (1920 × 1080).
```

| Spot | Fichiers | Lieu à décrire | Activité de la scène 3 |
|---|---|---|---|
| teahupoo | teahupoo-scene-1/2/3.png | Teahupo’o, presqu’île de Tahiti, Polynésie française : plage de sable noir, montagnes vertes, vague tubulaire sur le récif | surf, vue depuis le chenal face au tube |
| rajaampat | rajaampat-scene-1/2/3.png | Raja Ampat, Papouasie, Indonésie : îlots karstiques couverts de jungle, lagons turquoise | plongée, jardin de corail et bancs de poissons |
| navagio | navagio-scene-1/2/3.png | Navagio, Zakynthos, Grèce : crique aux falaises blanches, épave sur le sable, eau turquoise | baignade, vue depuis l’eau vers l’épave |
| nazare | nazare-scene-1/2/3.png | Nazaré, Portugal : phare du fort sur la falaise, Praia do Norte, houle géante d’hiver | surf, vue d’un jet-ski de sécurité face à la vague |
| anse_source | anse_source-scene-1/2/3.png | Anse Source d’Argent, La Digue, Seychelles : blocs de granit rose, cocotiers, lagon peu profond | snorkeling, lagon clair entre les rochers |
| uluwatu | uluwatu-scene-1/2/3.png | Uluwatu, Bali, Indonésie : falaises calcaires, escaliers et warungs, grotte d’accès, vagues sur le récif | surf, vue depuis le line-up vers la falaise |
| whitehaven | whitehaven-scene-1/2/3.png | Whitehaven Beach, îles Whitsunday, Australie : sable de silice blanc, tourbillons turquoise de Hill Inlet | baignade et kayak dans l’eau cristalline |
| hanauma | hanauma-scene-1/2/3.png | Hanauma Bay, Oahu, Hawaï : cratère volcanique en croissant, récif peu profond, palmiers | snorkeling au-dessus du récif et des poissons |
| borabora | borabora-scene-1/2/3.png | Bora Bora, Polynésie française : mont Otemanu, lagon turquoise, motu de sable blanc | snorkeling avec raies pastenagues |
| tarifa | tarifa-scene-1/2/3.png | Tarifa, Andalousie, Espagne : plage de Los Lances, dunes, côte marocaine à l’horizon, ciel plein de kites | kitesurf, vue depuis l’eau |
