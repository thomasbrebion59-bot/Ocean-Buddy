/* A public trip is an explicit, detached copy of selected notebook fields. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanTripSharing=api})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const text=(value,max)=>String(value??'').trim().slice(0,max);
  function buildSnapshot(trip,choices={},knownSpotIds){
    if(!trip||!Array.isArray(trip.steps)||!text(trip.name,70))throw Error('Ce voyage ne peut pas être partagé.');
    if(trip.steps.length<1||trip.steps.length>30)throw Error('Choisis entre 1 et 30 étapes pour le voyage public.');
    const known=knownSpotIds?new Set(knownSpotIds):null;
    const snapshot={name:text(trip.name,70),destination:text(trip.destination,100),steps:[]};
    for(const step of trip.steps){
      const spotId=text(step?.spotId,80);
      if(!spotId||known&&!known.has(spotId))throw Error('Une étape ne figure plus dans le catalogue vérifié. Remplace-la avant de publier.');
      const shared={spotId};
      const selected=choices.steps?.[step.id]||{};
      if(selected.date===true&&step.date)shared.date=text(step.date,10);
      if(selected.notes===true&&step.notes)shared.notes=text(step.notes,1000);
      if(selected.accommodation===true&&step.accommodation)shared.accommodation=text(step.accommodation,1000);
      if(selected.transport===true&&step.transport)shared.transport=text(step.transport,1000);
      if(selected.budget===true&&step.budget)shared.budget=text(step.budget,40);
      snapshot.steps.push(shared);
    }
    for(const [field,max] of Object.entries({start:10,end:10,notes:2000,accommodation:2000,transport:2000,budget:40})){
      if(choices[field]===true&&trip[field])snapshot[field]=text(trip[field],max);
    }
    return snapshot;
  }
  return {buildSnapshot};
});
