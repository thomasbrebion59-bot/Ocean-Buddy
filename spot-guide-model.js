/* Estimations d'hébergement Ocean Buddy : pures, testables, sans réseau.
   Les prix sont des fourchettes indicatives en euros, pour une personne et une nuit,
   relevées en septembre 2026. Ils servent à comparer des spots, jamais à réserver. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpotGuideModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const EDITION='septembre 2026';
  const TYPES=['camping','hostel','surfcamp','guest','hotel'];
  const PEAK_FACTOR=1.35;
  /* c = camping (emplacement pour une tente, une personne), h = lit en dortoir,
     s = surf camp en dortoir (sans cours), g = chambre simple chez l’habitant ou en pension,
     t = chambre dans un hôtel ou motel économique. Basse et moyenne saison.
     d = option la moins chère généralement disponible près des spots, p = mois de haute saison. */
  const C={
    'France':{c:[12,24],h:[25,40],s:[35,55],g:[55,85],t:[55,80],d:'camping',p:[7,8]},
    'Portugal':{c:[9,18],h:[18,32],s:[25,45],g:[35,60],t:[45,70],d:'camping',p:[7,8]},
    'Espagne':{c:[12,24],h:[20,35],s:[30,48],g:[40,65],t:[50,80],d:'camping',p:[7,8]},
    'Royaume-Uni':{c:[15,28],h:[25,40],s:[35,55],g:[60,95],t:[60,90],d:'camping',p:[7,8]},
    'Irlande':{c:[15,25],h:[25,40],s:[35,55],g:[55,85],t:[70,110],d:'camping',p:[7,8]},
    'Italie':{c:[14,28],h:[25,40],g:[55,85],t:[60,90],d:'camping',p:[7,8]},
    'Grèce':{c:[10,20],h:[18,30],g:[35,60],t:[45,75],d:'camping',p:[7,8]},
    'Croatie':{c:[15,30],h:[18,32],g:[35,60],t:[55,90],d:'camping',p:[7,8]},
    'Malte':{h:[18,32],g:[45,70],t:[55,90],d:'hostel',p:[7,8]},
    'Norvège':{c:[20,35],h:[35,55],g:[80,120],t:[90,140],d:'camping',p:[6,7,8]},
    'Islande':{c:[15,25],h:[35,55],g:[90,140],t:[110,170],d:'camping',p:[6,7,8]},
    'Danemark':{c:[15,28],h:[30,50],g:[70,110],t:[90,130],d:'camping',p:[7]},
    'Allemagne':{c:[12,24],h:[25,40],g:[55,85],t:[60,90],d:'camping',p:[7,8]},
    'Pays-Bas':{c:[15,28],h:[30,50],g:[70,110],t:[80,120],d:'camping',p:[7,8]},
    'Maroc':{c:[5,12],h:[10,20],s:[18,35],g:[20,40],t:[25,45],d:'hostel',p:[7,8,12]},
    'Tunisie':{h:[10,20],g:[20,40],t:[25,45],d:'guest',p:[7,8]},
    'Égypte':{c:[8,15],h:[8,15],g:[15,30],t:[25,45],d:'hostel',p:[12,1,4]},
    'Sénégal':{h:[12,22],s:[20,35],g:[15,30],t:[30,50],d:'guest',p:[12,1,2]},
    'Cap-Vert':{h:[15,25],g:[25,45],t:[40,70],d:'hostel',p:[12,1,2,3]},
    'Ghana':{h:[10,20],g:[15,30],t:[30,50],d:'hostel',p:[12]},
    'Liberia':{s:[25,50],g:[30,55],t:[50,90],d:'surfcamp',p:[12,1]},
    'Angola':{g:[40,70],t:[60,100],d:'guest',p:[12,1]},
    'Namibie':{c:[10,20],h:[15,25],g:[35,60],t:[45,75],d:'camping',p:[7,8,12]},
    'Afrique du Sud':{c:[8,16],h:[14,25],s:[18,30],g:[35,60],t:[40,70],d:'hostel',p:[12,1]},
    'Mozambique':{c:[8,15],h:[12,22],g:[30,55],t:[40,70],d:'hostel',p:[12,1,7]},
    'Tanzanie':{h:[12,22],g:[25,45],t:[35,60],d:'hostel',p:[7,8,12]},
    'Kenya':{c:[8,15],h:[12,22],g:[25,45],t:[35,60],d:'hostel',p:[7,8,12]},
    'Madagascar':{g:[12,25],t:[20,40],d:'guest',p:[7,8,12]},
    'Maurice':{h:[20,35],g:[30,55],t:[45,80],d:'guest',p:[12,1]},
    'Seychelles':{g:[60,110],t:[100,160],d:'guest',p:[12,4,8]},
    'La Réunion':{c:[10,18],h:[20,35],g:[50,80],t:[60,95],d:'hostel',p:[7,8,12]},
    'États-Unis':{c:[20,45],h:[35,60],s:[45,70],g:[70,120],t:[80,130],d:'camping',p:[6,7,8]},
    'Canada':{c:[20,40],h:[30,50],g:[80,120],t:[90,140],d:'camping',p:[7,8]},
    'Mexique':{c:[6,15],h:[12,25],s:[20,35],g:[25,50],t:[30,55],d:'hostel',p:[12,1,2,3]},
    'Belize':{h:[15,30],g:[40,70],t:[60,95],d:'hostel',p:[12,1,2,3]},
    'Honduras':{h:[10,20],g:[25,45],t:[40,70],d:'hostel',p:[12,3,4,7]},
    'Salvador':{h:[10,20],s:[18,30],g:[25,45],t:[30,50],d:'hostel',p:[12,1,4]},
    'Nicaragua':{h:[10,18],s:[18,30],g:[20,40],t:[30,50],d:'hostel',p:[12,1,2,3]},
    'Costa Rica':{c:[8,15],h:[15,28],s:[25,40],g:[35,60],t:[45,75],d:'hostel',p:[12,1,2,3]},
    'Panama':{h:[12,22],g:[30,55],t:[40,70],d:'hostel',p:[12,1,2,3]},
    'Porto Rico':{h:[30,50],g:[60,95],t:[80,120],d:'hostel',p:[12,1,2,3]},
    'République dominicaine':{h:[12,25],g:[30,55],t:[40,70],d:'hostel',p:[12,1,2,3]},
    'Bahamas':{g:[90,140],t:[120,190],d:'guest',p:[12,1,2,3]},
    'Îles Caïmans':{g:[110,170],t:[150,230],d:'guest',p:[12,1,2,3]},
    'Barbade':{h:[30,50],g:[55,90],t:[80,130],d:'hostel',p:[12,1,2,3]},
    'Aruba':{h:[35,55],g:[70,110],t:[100,160],d:'guest',p:[12,1,2,3]},
    'Curaçao':{h:[30,45],g:[55,85],t:[70,110],d:'hostel',p:[12,1,2,3]},
    'Bonaire':{g:[45,75],t:[80,120],d:'guest',p:[12,1,2,3]},
    'Guadeloupe':{c:[12,20],g:[45,75],t:[70,110],d:'guest',p:[12,1,2,3,4]},
    'Martinique':{c:[12,20],g:[45,75],t:[70,110],d:'guest',p:[12,1,2,3,4]},
    'Venezuela':{g:[15,35],t:[30,55],d:'guest',p:[12,1,8]},
    'Colombie':{h:[8,16],g:[20,35],t:[25,45],d:'hostel',p:[12,1,6,7]},
    'Équateur':{c:[5,10],h:[8,15],g:[18,35],t:[25,45],d:'hostel',p:[7,8,12]},
    'Pérou':{c:[5,10],h:[9,18],s:[15,28],g:[18,35],t:[25,45],d:'hostel',p:[1,2]},
    'Chili':{c:[8,15],h:[14,25],g:[30,50],t:[40,65],d:'hostel',p:[1,2]},
    'Brésil':{c:[8,15],h:[10,20],g:[25,45],t:[30,55],d:'hostel',p:[12,1,2]},
    'Uruguay':{c:[8,15],h:[15,28],g:[35,60],t:[45,70],d:'hostel',p:[1,2]},
    'Argentine':{c:[5,12],h:[10,20],g:[25,45],t:[30,50],d:'hostel',p:[1,2]},
    'Australie':{c:[15,30],h:[25,45],s:[35,55],g:[70,110],t:[80,120],d:'hostel',p:[12,1]},
    'Nouvelle-Zélande':{c:[12,25],h:[22,38],g:[60,95],t:[70,110],d:'camping',p:[12,1,2]},
    'Fidji':{h:[18,35],s:[35,60],g:[35,70],t:[60,110],d:'hostel',p:[6,7,8,12]},
    'Polynésie française':{c:[15,25],h:[30,45],g:[70,130],t:[120,200],d:'hostel',p:[7,8]},
    'Nouvelle-Calédonie':{c:[10,20],h:[30,45],g:[50,85],t:[90,140],d:'camping',p:[12,1]},
    'Vanuatu':{g:[30,55],t:[70,110],d:'guest',p:[7,8,12]},
    'Samoa':{g:[30,55],t:[70,110],d:'guest',p:[7,8,12]},
    'Tonga':{g:[35,60],t:[60,100],d:'guest',p:[7,8,12]},
    'Îles Cook':{h:[25,40],g:[60,100],t:[90,140],d:'hostel',p:[7,8,12]},
    'Palaos':{g:[60,100],t:[90,150],d:'guest',p:[12,1,2,3]},
    'Papouasie-Nouvelle-Guinée':{s:[60,110],g:[60,110],t:[100,160],d:'surfcamp',p:[12,1,2,3]},
    'Indonésie':{h:[6,14],s:[15,30],g:[12,30],t:[20,40],d:'guest',p:[7,8,12]},
    'Philippines':{h:[8,16],s:[15,28],g:[15,30],t:[25,45],d:'hostel',p:[12,1,2,3,4]},
    'Malaisie':{h:[8,15],g:[18,35],t:[25,45],d:'hostel',p:[7,8]},
    'Thaïlande':{h:[7,15],g:[15,30],t:[20,40],d:'hostel',p:[12,1,2]},
    'Vietnam':{h:[5,12],g:[12,25],t:[18,35],d:'hostel',p:[6,7,8]},
    'Sri Lanka':{h:[7,15],s:[15,28],g:[15,30],t:[25,45],d:'hostel',p:[12,1,2,3]},
    'Inde':{h:[6,12],g:[12,25],t:[18,35],d:'hostel',p:[12,1]},
    'Maldives':{g:[45,90],t:[60,110],d:'guest',p:[12,1,2,3,4]},
    'Japon':{c:[8,18],h:[20,35],g:[45,75],t:[50,80],d:'hostel',p:[7,8]},
    'Taïwan':{h:[15,25],g:[35,60],t:[40,70],d:'hostel',p:[7,8]},
    'Chine':{h:[10,18],g:[25,45],t:[30,55],d:'hostel',p:[7,8,10]},
    'Oman':{c:[15,30],g:[40,70],t:[45,80],d:'guest',p:[12,1,2]},
    'Jordanie':{h:[15,25],g:[30,50],t:[40,70],d:'hostel',p:[3,4,10,11]}
  };
  /* Régions nettement plus chères ou moins chères que la moyenne de leur pays. */
  const REGIONS=[
    {country:'États-Unis',re:/hawa|oahu|maui|kaua.?i|kona/i,name:'Hawaï',v:{c:[20,40],h:[45,75],g:[130,200],t:[150,250],d:'hostel',p:[12,1,2,7]}},
    {country:'États-Unis',re:/(?<!basse-)californ|san francisco|santa cruz|san diego|los angeles|malibu|huntington|santa barbara|la jolla|san clemente|big sur|half moon bay/i,name:'Californie',v:{c:[25,50],h:[40,70],g:[90,150],t:[90,150],d:'camping',p:[6,7,8]}},
    {country:'France',re:/c[oô]te d.azur|alpes-maritimes|\bvar\b|nice|cannes|saint-tropez|monaco/i,name:'Côte d’Azur',v:{c:[18,35],h:[30,50],g:[75,120],t:[75,110],d:'camping',p:[7,8]}},
    {country:'France',re:/corse/i,name:'Corse',v:{c:[14,28],g:[65,100],t:[70,110],d:'camping',p:[7,8]}},
    {country:'Polynésie française',re:/bora/i,name:'Bora Bora',v:{c:[20,35],g:[110,200],t:[200,350],d:'guest',p:[7,8]}},
    {country:'Espagne',re:/bal[ée]ares|majorque|minorque|ibiza|formentera/i,name:'Baléares',v:{c:[16,30],h:[30,55],g:[70,110],t:[75,120],d:'hostel',p:[7,8]}},
    {country:'Italie',re:/sardaigne|capri|amalfi|portofino/i,name:'Côtes huppées d’Italie',v:{c:[18,35],h:[35,55],g:[75,120],t:[85,130],d:'camping',p:[7,8]}},
    {country:'Canada',re:/tofino|ucluelet/i,name:'Tofino',v:{c:[30,55],h:[45,70],g:[110,170],t:[130,200],d:'camping',p:[7,8]}},
    {country:'Australie',re:/byron/i,name:'Byron Bay',v:{c:[25,45],h:[35,60],g:[90,140],t:[100,160],d:'hostel',p:[12,1]}},
    {country:'Indonésie',re:/mentawai/i,name:'Mentawai',v:{s:[60,120],g:[45,90],d:'surfcamp',p:[5,6,7,8,9]}}
  ];
  const WORLD={
    fr:C['France'],
    eu:{c:[12,24],h:[22,38],g:[45,75],t:[55,85],d:'hostel',p:[7,8]},
    af:{c:[6,14],h:[10,20],g:[20,40],t:[30,55],d:'guest',p:[12,7,8]},
    na:{c:[20,40],h:[30,55],g:[60,100],t:[75,120],d:'hostel',p:[12,1,2,7,8]},
    sa:{c:[6,14],h:[10,20],g:[22,40],t:[30,55],d:'hostel',p:[12,1,2]},
    oc:{c:[14,28],h:[25,42],g:[55,95],t:[80,130],d:'hostel',p:[12,1,7]},
    as:{h:[7,16],g:[14,30],t:[22,42],d:'guest',p:[7,8,12]}
  };
  const KEY={camping:'c',hostel:'h',surfcamp:'s',guest:'g',hotel:'t'};
  const LABELS={camping:'Camping',hostel:'Auberge de jeunesse',surfcamp:'Surf camp',guest:'Maison d’hôtes',hotel:'Hôtel économique'};
  const DETAILS={
    camping:'Un emplacement pour ta tente, sanitaires partagés.',
    hostel:'Un lit en dortoir, souvent avec une cuisine partagée.',
    surfcamp:'Un lit en dortoir chez des surfeurs, location de planche souvent possible.',
    guest:'Une chambre simple chez l’habitant ou dans une petite pension.',
    hotel:'Une chambre simple dans un hôtel ou un motel sans chichis.'
  };
  const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const round=v=>v<20?Math.round(v):Math.round(v/5)*5;
  const clean=r=>Array.isArray(r)&&r.length===2&&r.every(n=>Number.isFinite(n)&&n>0)&&r[0]<=r[1]?r:null;

  /* Table de référence d’un lieu : région reconnue, puis pays, puis continent. */
  function baseline(country,loc,world){
    const region=REGIONS.find(r=>r.country===country&&r.re.test(String(loc||'')));
    const base=C[country];
    if(region)return {table:{...(base||{}),...region.v},basis:'region',area:region.name};
    if(base)return {table:base,basis:'country',area:country};
    return {table:WORLD[world]||WORLD.eu,basis:'world',area:null};
  }
  function rangeFor(table,type){
    const direct=clean(table[KEY[type]]);if(direct)return direct;
    if(type==='surfcamp'&&clean(table.h))return table.h.map(v=>v*1.3);
    return null;
  }
  function cheapestType(table){
    let best=null;
    for(const type of TYPES){const r=rangeFor(table,type);if(r&&(!best||r[0]+r[1]<best.r[0]+best.r[1]))best={type,r};}
    return best?.type||'guest';
  }
  function scaled(r,f){return [round(r[0]*f),Math.max(round(r[0]*f),round(r[1]*f))];}
  const validMonths=p=>Array.isArray(p)&&p.length&&p.every(m=>Number.isInteger(m)&&m>=1&&m<=12)?[...new Set(p)]:null;

  /* spot = {country, loc, world}, guide = entrée facultative de data/spot-guides.json :
     {k: type principal, k2: alternative sans tente, f: facteur local, p: mois de haute saison, town, lbl}. */
  function estimate(spot,guide){
    const {table,basis,area}=baseline(spot?.country,spot?.loc,spot?.world);
    const g=guide&&typeof guide==='object'?guide:{};
    const factor=Number.isFinite(g.f)&&g.f>0.3&&g.f<5?g.f:1;
    let type=TYPES.includes(g.k)&&rangeFor(table,g.k)?g.k:(TYPES.includes(table.d)&&rangeFor(table,table.d)?table.d:cheapestType(table));
    const base=rangeFor(table,type);
    let alt=null;
    const altType=TYPES.includes(g.k2)&&g.k2!==type&&rangeFor(table,g.k2)?g.k2:(type==='camping'?(['hostel','surfcamp','guest','hotel'].find(t=>rangeFor(table,t))):null);
    if(altType){const r=rangeFor(table,altType);alt={type:altType,label:LABELS[altType],lo:scaled(r,factor)[0],hi:scaled(r,factor)[1]};}
    const peak=validMonths(g.p)||validMonths(table.p)||[];
    const low=scaled(base,factor),high=scaled(base,factor*PEAK_FACTOR);
    return {type,label:typeof g.lbl==='string'&&g.lbl.trim()?g.lbl.trim().slice(0,40):LABELS[type],detail:DETAILS[type],
      lo:low[0],hi:low[1],peakLo:high[0],peakHi:high[1],peak,alt,basis:guide&&g.k?'spot':basis,area,factor,
      town:typeof g.town==='string'?g.town.trim().slice(0,60):''};
  }
  /* Fourchette applicable à un mois donné (1-12) ou à la basse saison si le mois est inconnu. */
  function nightly(est,month){
    if(!est)return null;
    const isPeak=Number.isInteger(month)&&est.peak.includes(month);
    return {lo:isPeak?est.peakLo:est.lo,hi:isPeak?est.peakHi:est.hi,peak:isPeak};
  }
  function monthOf(date){const m=/^\d{4}-(\d{2})-\d{2}$/.exec(String(date||''));return m?Number(m[1]):null;}
  /* Mois de haute saison sous forme lisible : « juillet et août », « de décembre à mars ». */
  function monthsLabel(months){
    const list=validMonths(months);if(!list)return '';
    const sorted=[...list].sort((a,b)=>a-b);
    // Cherche une suite continue, éventuellement à cheval sur l’année.
    const set=new Set(sorted);
    const start=sorted.find(m=>!set.has(m===1?12:m-1));
    if(start!==undefined){
      const run=[];let m=start;while(set.has(m)&&run.length<12){run.push(m);m=m===12?1:m+1;}
      if(run.length===sorted.length){
        if(run.length===1)return MONTHS[run[0]-1];
        if(run.length===2)return MONTHS[run[0]-1]+' et '+MONTHS[run[1]-1];
        return 'de '+MONTHS[run[0]-1]+' à '+MONTHS[run[run.length-1]-1];
      }
    }
    const names=sorted.map(m=>MONTHS[m-1]);
    return names.slice(0,-1).join(', ')+' et '+names[names.length-1];
  }
  /* Position d’un prix parmi tous les spots : part des spots plus chers (0-100). */
  function cheaperThan(value,all){
    const list=(all||[]).filter(Number.isFinite);if(!list.length||!Number.isFinite(value))return null;
    return Math.round(list.filter(v=>v>value).length/list.length*100);
  }
  function euros(r){return r.lo===r.hi?`${r.lo} €`:`${r.lo}–${r.hi} €`;}
  /* Liens de recherche publics, sans identifiant d’affiliation ni clé d’API. */
  function searchLinks(place,opts={}){
    const q=String(place||'').trim();const enc=encodeURIComponent(q);
    const dated=/^\d{4}-\d{2}-\d{2}$/.test(opts.checkin||'')&&/^\d{4}-\d{2}-\d{2}$/.test(opts.checkout||'')&&opts.checkout>opts.checkin;
    const booking=`https://www.booking.com/searchresults.html?ss=${enc}&group_adults=1&no_rooms=1&group_children=0`+(dated?`&checkin=${opts.checkin}&checkout=${opts.checkout}`:'');
    const airbnb=`https://www.airbnb.com/s/${encodeURIComponent(q.replace(/,\s*/g,'--').replace(/\s+/g,'-'))}/homes?adults=1`+(dated?`&checkin=${opts.checkin}&checkout=${opts.checkout}`:'');
    const hostelworld=`https://www.google.com/search?q=${encodeURIComponent('Hostelworld '+q)}`;
    const google=`https://www.google.com/travel/search?q=${encodeURIComponent('hôtels pas chers '+q)}`;
    const c=opts.coords&&Number.isFinite(+opts.coords.lat)&&Number.isFinite(+opts.coords.lon)?opts.coords:null;
    const camping=`https://www.google.com/maps/search/${encodeURIComponent('camping')}${c?`/@${(+c.lat).toFixed(4)},${(+c.lon).toFixed(4)},12z`:encodeURIComponent(' '+q)}`;
    return {booking,hostelworld,airbnb,google,camping};
  }
  return {EDITION,TYPES,LABELS,DETAILS,PEAK_FACTOR,COUNTRIES:C,REGIONS,WORLD,baseline,estimate,nightly,monthOf,monthsLabel,cheaperThan,euros,searchLinks,round};
});
