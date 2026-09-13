/* Editorial explanations, separate from the spot catalogue and live forecasts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanImmersionModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const activities={
    surf:{title:'Regarder la vague avant de la prendre.',points:[['La vague','La houle annoncée décrit la mer au large. Le fond et la côte transforment les vagues qui arrivent à la plage.'],['Le pic','Observe où les vagues déferlent et où attendent les autres surfeurs. Repère aussi les zones réservées.'],['La sortie','Identifie un retour à terre et vérifie les conditions avec une école ou le poste de secours.']]},
    bodyboard:{title:'Au plus près de la vague.',points:[['Le déferlement','Une même hauteur au large peut produire des vagues très différentes au bord. Observe plusieurs séries.'],['Le fond','Demande si la zone comporte des rochers, un récif ou des variations de profondeur.'],['Le retour','Repère les sorties et vérifie les zones de pratique avec les encadrants locaux.']]},
    kayak:{title:'Une balade qui se prépare aussi au retour.',points:[['Le parcours','Repère le départ, le retour et les sorties possibles. Le point de la carte situe le secteur, pas une mise à l’eau garantie.'],['Le vent','Sa direction et ses variations peuvent changer l’effort nécessaire pour revenir.'],['L’équipement','Vérifie l’embarcation, la pagaie, l’aide à la flottabilité et les consignes du lieu.']]},
    paddle:{title:'Debout, avec le retour en tête.',points:[['Le parcours','Choisis un départ autorisé et repère les possibilités de retour avant de te mettre à l’eau.'],['Le vent','Un plan d’eau lisse peut masquer un vent qui pousse au large. La direction compte autant que la vitesse.'],['L’accompagnement','Pour débuter, une séance encadrée aide à choisir le bon matériel et à comprendre le plan d’eau.']]},
    plongee:{title:'Le monde sous la surface se découvre accompagné.',points:[['La sortie','Le secteur peut contenir plusieurs sites de plongée. Confirme celui de la sortie avec le centre.'],['Le briefing','Profondeur, courant, visibilité et niveau requis se vérifient avec l’encadrant. La météo de surface ne les décrit pas.'],['Le binôme','Prépare le matériel, les échanges et les consignes avec ton binôme et l’encadrement.']]},
    snorkeling:{title:'Voir sous l’eau, garder ses repères en surface.',points:[['La zone','Vérifie les points d’entrée et de sortie, les zones autorisées et les passages de bateaux.'],['La visibilité','Une belle photo ne prédit pas ce que tu verras le jour de la sortie. Demande les conditions locales.'],['Le récif','Observe avec un binôme, reste visible et garde tes distances avec les coraux et les animaux.']]},
    baignade:{title:'Profiter de l’eau, en comprenant le lieu.',points:[['La zone','Repère les zones autorisées et surveillées. Lis les consignes affichées le jour même.'],['Le plan d’eau','Le vent, les vagues et les courants peuvent évoluer. Une photographie ne donne pas les conditions du jour.'],['Les repères','Observe les accès, le balisage et le poste de secours avant d’entrer dans l’eau.']]},
    kitesurf:{title:'Lire l’espace, puis le vent.',points:[['La zone','Vérifie les zones autorisées de décollage, de navigation et d’atterrissage avec l’école locale.'],['Le vent','Sa direction, sa régularité et les rafales comptent. Une vitesse moyenne seule ne suffit pas à choisir une session.'],['Le matériel','Prépare l’aile, les lignes et les systèmes de sécurité avec les conseils d’un professionnel.']]},
    windsurf:{title:'Un gréement, du vent et un retour prévu.',points:[['La mise à l’eau','Confirme les accès autorisés et l’espace disponible pour préparer le gréement.'],['Le vent','Consulte son évolution sur la durée de la sortie, pas seulement sa valeur au départ.'],['Le retour','Choisis le matériel avec le club local et identifie les sorties avant de partir.']]}
  };
  const topics=[['terrain','Ta sortie'],['vent','Le vent'],['houle','Les vagues'],['maree','La marée'],['eau','L’eau'],['niveau','Le niveau']];
  const levels={
    debutant:{title:'Je découvre.',copy:'Tu apprends les gestes et les repères de l’activité. Un encadrant peut t’aider à choisir le secteur, le matériel et le créneau.'},
    intermediaire:{title:'Je consolide mes bases.',copy:'Tu pratiques déjà et tu continues à progresser. Un nouveau lieu demande de vérifier ses particularités, même si tu maîtrises les gestes.'},
    expert:{title:'J’adapte mon expérience au lieu.',copy:'Tu as une pratique solide. Le niveau ne dispense pas d’observer, de demander les consignes locales ou de renoncer si les conditions ne conviennent pas.'}
  };
  const winds={
    offshore:{label:'Vers le large',name:'Vent de terre · offshore',copy:'Il souffle de la terre vers l’eau. Une surface lisse ne signifie pas que le retour sera facile.',note:'En paddle, évite le vent qui pousse au large.',from:[95,130],to:[375,130]},
    onshore:{label:'Vers la rive',name:'Vent de mer · onshore',copy:'Il souffle de l’eau vers la terre. Il peut agiter la surface et modifier les vagues au bord.',note:'Vérifie aussi les rafales, le déferlement et les conditions de sortie.',from:[375,130],to:[95,130]},
    cross:{label:'Le long de la rive',name:'Vent de travers · sideshore',copy:'Il souffle parallèlement à la côte dans cet exemple. Il peut décaler ta trajectoire le long du rivage.',note:'La côte réelle peut changer d’orientation : repère ton trajet sur place.',from:[295,195],to:[295,65]}
  };
  function topicList(inland){return topics.filter(([id])=>!inland||!['houle','maree'].includes(id));}
  function reading(topic,live,inland){
    if(inland&&['houle','maree','eau'].includes(topic))return null;
    const key={vent:'wind',houle:'swell',maree:'tide',eau:'temp'}[topic];
    const value=key&&live?.[key];
    return live?.live&&value&&value!=='—'?value:null;
  }
  function tideGeometry(value){const n=Math.max(0,Math.min(100,Number(value)||0));return {value:n,waterY:192-n*.92,shoreX:(192-n*.92-62)*480/186};}
  function activity(id){return activities[id]||activities.baignade;}
  return Object.freeze({activities,topics,levels,winds,topicList,reading,tideGeometry,activity});
});
