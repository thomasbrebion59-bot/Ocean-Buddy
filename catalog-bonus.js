/* Sélection bonus de destinations connues, avec coordonnées côtières vérifiables. */
(() => {
  const rows=[
    ['Peniche — Baleal','Peniche, Portugal',39.374,-9.337,'eu','surf'],['Praia do Guincho','Cascais, Portugal',38.733,-9.473,'eu','kitesurf'],['Foz do Douro','Porto, Portugal',41.147,-8.676,'eu','surf'],['Zavial','Algarve, Portugal',37.06,-8.88,'eu','surf'],
    ['El Cotillo','Fuerteventura, Espagne',28.682,-14.015,'eu','surf'],['Famara','Lanzarote, Espagne',29.118,-13.56,'eu','surf'],['Las Canteras','Grande Canarie, Espagne',28.14,-15.433,'eu','baignade'],['El Médano','Tenerife, Espagne',28.045,-16.536,'eu','windsurf'],
    ['Sidi Ifni','Souss-Massa, Maroc',29.38,-10.17,'af','surf'],['Imsouane — Cathedral','Maroc',30.84,-9.82,'af','surf'],['Dakhla Lagoon','Dakhla, Maroc',23.72,-15.94,'af','kitesurf'],['Le Morne','Maurice',-20.46,57.31,'af','kitesurf'],
    ['Ponta Preta','Sal, Cap-Vert',16.74,-22.97,'af','surf'],['Tofo','Inhambane, Mozambique',-23.85,35.54,'af','plongee'],['Sodwana Bay','KwaZulu-Natal, Afrique du Sud',-27.53,32.68,'af','plongee'],['Tobago Cays','Grenadines',12.63,-61.35,'af','snorkeling'],
    ['Ribeira d’Ilhas','Ericeira, Portugal',39.0,-9.42,'eu','surf'],['Porthcurno','Cornouailles, Royaume-Uni',50.04,-5.66,'eu','baignade'],['Newquay — Fistral','Cornouailles, Royaume-Uni',50.416,-5.1,'eu','surf'],['Hossegor — Les Estagnots','Landes, France',43.69,-1.45,'fr','surf'],
    ['Cala d’Hort','Ibiza, Espagne',38.89,1.21,'eu','snorkeling'],['La Gravière Sud','Landes, France',43.66,-1.44,'fr','bodyboard'],['Mimizan — Courant','Landes, France',44.2,-1.29,'fr','paddle'],['Annecy — Talloires','Haute-Savoie, France',45.84,6.21,'fr','paddle'],
    ['La Jolla Cove','Californie, États-Unis',32.85,-117.27,'na','snorkeling'],['Huntington Beach','Californie, États-Unis',33.66,-118,'na','surf'],['Outer Banks — Avon','Caroline du Nord, États-Unis',35.35,-75.51,'na','kitesurf'],['Tulum — Casa Cenote','Quintana Roo, Mexique',20.3,-87.36,'na','plongee'],
    ['Akumal Bay','Yucatán, Mexique',20.39,-87.31,'na','snorkeling'],['Punta Mita','Nayarit, Mexique',20.77,-105.53,'na','paddle'],['Bocas del Toro','Panama',9.34,-82.24,'na','snorkeling'],['Caye Caulker','Belize',17.74,-88.03,'na','plongee'],
    ['Punta de Lobos','Pichilemu, Chili',-34.4,-72.02,'sa','surf'],['Máncora — Las Pocitas','Pérou',-4.1,-81.07,'sa','surf'],['Montañita — Olón','Équateur',-1.8,-80.75,'sa','surf'],['Ilha Grande','Rio de Janeiro, Brésil',-23.14,-44.17,'sa','kayak'],
    ['Nusa Dua','Bali, Indonésie',-8.8,115.23,'as','snorkeling'],['Amed','Bali, Indonésie',-8.35,115.67,'as','plongee'],['Koh Tao — Shark Bay','Thaïlande',10.07,99.83,'as','snorkeling'],['Nacpan Beach','Palawan, Philippines',11.28,119.4,'as','baignade'],
    ['Ningaloo — Turquoise Bay','Australie',-22.08,113.89,'oc','snorkeling'],['Noosa Main Beach','Queensland, Australie',-26.39,153.09,'oc','surf'],['Sandy Bay','Rarotonga, Îles Cook',-21.25,-159.82,'oc','paddle'],['Muri Lagoon','Rarotonga, Îles Cook',-21.24,-159.77,'oc','kayak']
  ];
  const base={level:'variable',dangers:[],tip:'Vérifie les règles locales et les conditions avant ta sortie.',sky:'#c9dfed',sky2:'#8bbbd7',sea:'#2c789b',sea2:'#17486e',wind:'—',swell:'—',temp:'—',tide:'—',danger:0,catalogNew:true};
  window.OCEAN_BONUS_SPOTS=rows.map((r,i)=>Object.assign({},base,{id:'bonus-'+i,name:r[0],loc:r[1],coords:{lat:r[2],lon:r[3]},world:r[4],sports:[r[5]],desc:'Destination nautique ajoutée au catalogue Ocean Buddy pour préparer une nouvelle étape.'}));
  window.OCEAN_SPOT_EXPANSION=(window.OCEAN_SPOT_EXPANSION||[]).concat(window.OCEAN_BONUS_SPOTS);
})();
