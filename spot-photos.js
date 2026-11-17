/* One photograph order for the map, visit sheet and full-screen gallery. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanPhotos=api(root.SPOT_PHOTOS||{},root.SPOT_GALLERIES||{});})(typeof window!=='undefined'?window:globalThis,()=>function(main,galleries){
  function list(id,activity){
    const seen=new Set(),all=[main[id],...(galleries[id]||[])].filter(p=>p&&p.src&&!seen.has(p.src)&&seen.add(p.src));
    if(activity==='plongee'||activity==='snorkeling')return all.filter(p=>p.view==='underwater').sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)).concat(all.filter(p=>p.view!=='underwater'));
    return all;
  }
  /* Netteté des cartes : attribut srcset/sizes (précédé d’une espace) à poser sur une image dont src est la vignette.
     La vignette (640 px) reste l’image par défaut ; l’écran prend la photo entière quand la carte en a besoin
     (iPhone à 3 px par point : une carte de 230 pt demande 690 px). « sizes » = largeur utile, recadrage compris
     (une carte portrait rogne une photo paysage : c’est sa hauteur qui commande). Toujours avec loading=lazy.
     Photo sans vignette distincte : chaîne vide. */
  function sharp(p,sizes){
    if(!p||!p.thumb||!p.src||p.thumb===p.src)return '';
    const q=v=>String(v).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';'),sp=String.fromCharCode(32);
    return sp+'srcset="'+q(p.thumb)+sp+'640w,'+q(p.src)+sp+Math.max(641,Number(p.width||p.w)||1280)+'w"'+sp+'sizes="'+q(sizes)+'"';
  }
  return {list,lead:(id,activity)=>list(id,activity)[0],sharp};
});
