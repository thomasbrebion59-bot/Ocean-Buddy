/* One photograph order for the map, visit sheet and full-screen gallery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanPhotos=api(root.SPOT_PHOTOS||{},root.SPOT_GALLERIES||{});})(typeof window!=='undefined'?window:globalThis,()=>function(main,galleries){
  function list(id,activity){
    const seen=new Set(),all=[main[id],...(galleries[id]||[])].filter(p=>p&&p.src&&!seen.has(p.src)&&seen.add(p.src));
    if(activity==='plongee'||activity==='snorkeling')return all.filter(p=>p.view==='underwater').sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)).concat(all.filter(p=>p.view!=='underwater'));
    return all;
  }
  return {list,lead:(id,activity)=>list(id,activity)[0]};
});
