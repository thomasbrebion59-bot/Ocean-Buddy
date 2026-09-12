/* Trips are independent of XP and existing profile storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TripModel=api})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const KEY='oceanbuddy_trips_v1';
  const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const text=(v,max=200)=>String(v??'').trim().slice(0,max);
  const validDate=v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
  function dates(start,end){if(!validDate(start)||!validDate(end))throw Error('Choisis des dates valides.');if(start&&end&&end<start)throw Error('La date de retour doit suivre la date de départ.');}
  function stepDate(date,trip){if(!validDate(date))throw Error('Choisis une date valide pour cette étape.');if(date&&((trip.start&&date<trip.start)||(trip.end&&date>trip.end)))throw Error('Cette étape doit être comprise dans les dates du voyage.');}
  const defaultChecklist=['Vérifier les conditions et l’accès aux spots','Préparer planche, leash et combinaison','Prévoir les transports','Choisir les hébergements','Préparer documents et assurance','Emporter gourde et protection solaire'];
  function create(fields={},spotIds=[]){
    const trip={id:uid(),name:text(fields.name,70)||'Mon surf trip',destination:text(fields.destination,100),start:text(fields.start,10),end:text(fields.end,10),notes:'',accommodation:'',transport:'',budget:'',steps:[],checklist:defaultChecklist.map(label=>({id:uid(),label,done:false})),archived:false};
    dates(trip.start,trip.end);spotIds.forEach(id=>trip.steps.push({id:uid(),spotId:id,date:'',notes:''}));return trip;
  }
  function edit(trip,fields){
    const out={...trip};for(const k of ['name','destination','start','end','notes','accommodation','transport','budget'])if(k in fields)out[k]=text(fields[k],k==='name'?70:k==='destination'?100:2000);
    if(!out.name)throw Error('Donne un nom à ton voyage.');dates(out.start,out.end);
    if(out.budget&&(!/^\d+(?:[.,]\d{1,2})?$/.test(out.budget)||Number(out.budget.replace(',','.'))>10000000))throw Error('Le budget doit être un montant positif.');
    out.steps.forEach(s=>stepDate(s.date,out));return out;
  }
  function addStep(trip,spotId,knownIds){if(!knownIds.includes(spotId))throw Error('Ce spot ne figure pas dans le catalogue.');return {...trip,steps:[...trip.steps,{id:uid(),spotId,date:'',notes:''}]};}
  function editStep(trip,id,fields){const date=text(fields.date,10);stepDate(date,trip);return {...trip,steps:trip.steps.map(s=>s.id===id?{...s,date,notes:text(fields.notes,1000)}:s)};}
  function moveStep(trip,id,delta){const steps=trip.steps.slice(),i=steps.findIndex(s=>s.id===id),j=i+delta;if(i<0||j<0||j>=steps.length)return trip;[steps[i],steps[j]]=[steps[j],steps[i]];return {...trip,steps};}
  function save(storage,trips){storage.setItem(KEY,JSON.stringify({version:1,trips}));}
  function load(storage,knownIds){
    const raw=storage.getItem(KEY);if(!raw)return[];const data=JSON.parse(raw);
    if(data.version!==1||!Array.isArray(data.trips))throw Error('Le carnet de voyages ne peut pas être lu.');
    return data.trips.map(t=>{
      if(!t||typeof t.id!=='string'||!Array.isArray(t.steps)||!Array.isArray(t.checklist))throw Error('Le carnet de voyages est incomplet.');
      const base={...t,steps:t.steps.filter(s=>s&&knownIds.includes(s.spotId)).map(s=>({id:text(s.id),spotId:s.spotId,date:text(s.date,10),notes:text(s.notes,1000)})),checklist:t.checklist.filter(c=>c&&typeof c.id==='string').map(c=>({id:text(c.id),label:text(c.label,160),done:!!c.done})),archived:!!t.archived};
      return edit(base,base);
    });
  }
  function duration(t){return t.start&&t.end?Math.round((Date.parse(t.end+'T12:00:00Z')-Date.parse(t.start+'T12:00:00Z'))/86400000)+1:null;}
  return {KEY,uid,create,edit,addStep,editStep,moveStep,load,save,duration,defaultChecklist};
});
