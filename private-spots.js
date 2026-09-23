/* Restore local spots before trips and the notebook load their saved references. */
(() => {
  'use strict';
  const KEY='oceanbuddy_custom_spots_v1';
  function register(){
    let saved=[];
    try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(value))saved=value}catch(_){}
    const sports=new Set(SPORTS.map(item=>item.id));
    const worlds=new Set(WORLDS.map(item=>item.id));
    for(const raw of saved){
      if(!raw||typeof raw.id!=='string'||!/^custom-[a-z0-9-]{3,80}$/.test(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>80||typeof raw.loc!=='string'||!raw.loc.trim()||raw.loc.length>100)continue;
      const lat=raw.coords?.lat,lon=raw.coords?.lon;
      if(typeof lat!=='number'||!Number.isFinite(lat)||lat<-90||lat>90||typeof lon!=='number'||!Number.isFinite(lon)||lon<-180||lon>180||SPOTS.some(spot=>spot.id===raw.id))continue;
      const sport=Array.isArray(raw.sports)?raw.sports.find(id=>sports.has(id)):null;
      if(!worlds.has(raw.world)||!sport)continue;
      const spot={id:raw.id,name:raw.name.trim(),loc:raw.loc.trim(),world:raw.world,coords:{lat,lon},sports:[sport],level:'variable',desc:typeof raw.desc==='string'?raw.desc.slice(0,400):'Spot personnel non vérifié.',dangers:[],tip:'Vérifie les règles locales et les conditions avant toute sortie.',sky:'#c9dfed',sky2:'#8bbbd7',sea:'#2c789b',sea2:'#17486e',wind:'—',swell:'—',temp:'—',tide:'—',danger:0,custom:true};
      SPOTS.push(spot);COORDS[spot.id]=spot.coords;SPOT_WORLD[spot.id]=spot.world;
    }
  }
  window.OceanPrivateSpots={register};
  register();
})();
