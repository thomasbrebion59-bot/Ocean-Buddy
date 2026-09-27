/* Trips are independent of XP and existing profile storage. */
(function(root,factory){const legacy=typeof module==='object'&&module.exports?require('./legacy-spots.js'):root.OceanLegacySpots;const api=factory(legacy);if(typeof module==='object'&&module.exports)module.exports=api;else root.TripModel=api})(typeof window!=='undefined'?window:this,function(legacy){
  'use strict';
  const KEY='oceanbuddy_trips_v1';
  const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const text=(v,max=200)=>String(v??'').trim().slice(0,max);
  const newStep=spotId=>({id:uid(),spotId,date:'',notes:'',budget:'',accommodation:'',transport:''});
  const validBudget=v=>!v||(/^\d+(?:[.,]\d{1,2})?$/.test(v)&&Number(v.replace(',','.'))<=10000000);
  const validDate=v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
  function dates(start,end){if(!validDate(start)||!validDate(end))throw Error('Choisis des dates valides.');if(start&&end&&end<start)throw Error('La date de retour doit suivre la date de départ.');}
  function stepDate(date,trip){if(!validDate(date))throw Error('Choisis une date valide pour cette étape.');if(date&&((trip.start&&date<trip.start)||(trip.end&&date>trip.end)))throw Error('Cette étape doit être comprise dans les dates du voyage.');}
  const defaultChecklist=['Vérifier les conditions et l’accès aux spots','Préparer planche, leash et combinaison','Prévoir les transports','Choisir les hébergements','Préparer documents et assurance','Emporter gourde et protection solaire'];
  function create(fields={},spotIds=[]){
    const trip={id:uid(),name:text(fields.name,70)||'Mon voyage',destination:text(fields.destination,100),start:text(fields.start,10),end:text(fields.end,10),notes:'',accommodation:'',transport:'',budget:'',steps:[],checklist:defaultChecklist.map(label=>({id:uid(),label,done:false})),archived:false,deleted:false};
    dates(trip.start,trip.end);spotIds.forEach(id=>trip.steps.push(newStep(id)));return trip;
  }
  function edit(trip,fields){
    const out={...trip};for(const k of ['name','destination','start','end','notes','accommodation','transport','budget'])if(k in fields)out[k]=text(fields[k],k==='name'?70:k==='destination'?100:2000);
    if(!out.name)throw Error('Donne un nom à ton voyage.');dates(out.start,out.end);
    if(!validBudget(out.budget))throw Error('Le budget doit être un montant positif.');
    out.steps.forEach(s=>stepDate(s.date,out));return out;
  }
  function addStep(trip,spotId,knownIds){if(!knownIds.includes(spotId))throw Error('Ce spot ne figure pas dans le catalogue.');return {...trip,steps:[...trip.steps,newStep(spotId)]};}
  function replaceStep(trip,id,spotId,knownIds){
    if(!knownIds.includes(spotId))throw Error('Ce spot ne figure pas dans le catalogue.');
    if(!trip.steps.some(s=>s.id===id))throw Error('Cette étape est introuvable.');
    return {...trip,steps:trip.steps.map(s=>s.id===id?{id:s.id,spotId,date:s.date,notes:s.notes,budget:s.budget||'',accommodation:s.accommodation||'',transport:s.transport||''}:s)};
  }
  function editStep(trip,id,fields){
    const current=trip.steps.find(s=>s.id===id);if(!current)return trip;
    const date='date' in fields?text(fields.date,10):current.date;stepDate(date,trip);
    const budget='budget' in fields?text(fields.budget,40):current.budget||'';
    if(!validBudget(budget))throw Error('Le budget de cette étape doit être un montant positif.');
    return {...trip,steps:trip.steps.map(s=>s.id===id?{...s,date,
      notes:'notes' in fields?text(fields.notes,1000):s.notes,
      budget,accommodation:'accommodation' in fields?text(fields.accommodation,1000):s.accommodation||'',
      transport:'transport' in fields?text(fields.transport,1000):s.transport||''}:s)};
  }
  function moveStep(trip,id,delta){const steps=trip.steps.slice(),i=steps.findIndex(s=>s.id===id),j=i+delta;if(i<0||j<0||j>=steps.length)return trip;[steps[i],steps[j]]=[steps[j],steps[i]];return {...trip,steps};}
  function removeTrip(trips,id){
    const target=trips.find(t=>t.id===id&&!t.deleted);
    if(!target)throw Error('Ce voyage est introuvable ou déjà dans la corbeille.');
    return trips.map(t=>t.id===id?{...t,deleted:true}:t);
  }
  function restoreTrip(trips,id){
    const target=trips.find(t=>t.id===id&&t.deleted);
    if(!target)throw Error('Ce voyage ne figure pas dans la corbeille.');
    return trips.map(t=>t.id===id?{...t,deleted:false}:t);
  }
  function save(storage,trips){storage.setItem(KEY,JSON.stringify({version:1,trips}));}
  function load(storage,knownIds){
    const raw=storage.getItem(KEY);if(!raw)return[];const data=JSON.parse(raw);
    if(data.version!==1||!Array.isArray(data.trips))throw Error('Le carnet de voyages ne peut pas être lu.');
    return data.trips.map(t=>{
      if(!t||typeof t.id!=='string'||!Array.isArray(t.steps)||!Array.isArray(t.checklist))throw Error('Le carnet de voyages est incomplet.');
      const steps=t.steps.filter(s=>s&&typeof s.spotId==='string'&&typeof s.id==='string').map(s=>{
        const original=s.spotId,canonical=legacy?.canonicalId(original),spotId=canonical&&knownIds.includes(canonical)?canonical:original;
        const step={id:text(s.id),spotId,date:text(s.date,10),notes:text(s.notes,1000),
          budget:text(s.budget,40),accommodation:text(s.accommodation,1000),transport:text(s.transport,1000)};
        if(!knownIds.includes(spotId)){
          const archive=legacy?.archive(original)||s.legacy;
          step.legacy={name:text(archive?.name||'Spot indisponible',100),loc:text(archive?.loc||'',100),world:text(archive?.world||'',10)};
        }
        return step;
      });
      const base={...t,steps,checklist:t.checklist.filter(c=>c&&typeof c.id==='string').map(c=>({id:text(c.id),label:text(c.label,160),done:!!c.done})),archived:!!t.archived,deleted:!!t.deleted};
      return edit(base,base);
    });
  }
  function duration(t){return t.start&&t.end?Math.round((Date.parse(t.end+'T12:00:00Z')-Date.parse(t.start+'T12:00:00Z'))/86400000)+1:null;}
  /* Où en est un voyage par rapport à aujourd’hui (date locale AAAA-MM-JJ). */
  function countdown(t,today){
    if(!t.start)return {state:'undated',days:null};
    const days=Math.round((Date.parse(t.start+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);
    if(days>0)return {state:'upcoming',days};
    const last=t.end||t.start;
    if(today<=last)return {state:'ongoing',days:Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(t.start+'T12:00:00Z'))/86400000)+1};
    return {state:'past',days:null};
  }
  /* Le voyage à mettre en avant : en cours, puis le prochain départ, puis un voyage sans dates. */
  function nextTrip(trips,today){
    const live=trips.filter(t=>!t.archived&&!t.deleted).map(t=>({trip:t,when:countdown(t,today)}));
    const rank={ongoing:0,upcoming:1,undated:2};
    return live.filter(x=>x.when.state in rank).sort((a,b)=>rank[a.when.state]-rank[b.when.state]||(a.when.days??0)-(b.when.days??0))[0]||null;
  }
  function progress(t){const total=t.checklist.length,done=t.checklist.filter(c=>c.done).length;return {done,total,pct:total?Math.round(done/total*100):0};}
  return {KEY,uid,create,edit,addStep,replaceStep,editStep,moveStep,removeTrip,restoreTrip,load,save,duration,countdown,nextTrip,progress,defaultChecklist};
});
