/* Pure map helpers: grouping, antimeridian-safe bounds and visible-area queries. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanMapModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  /* Screen-space grouping kept for callers that draw their own markers. */
  function group(points,width=116,height=68){
    const groups=[];
    for(const point of points){
      const group=groups.find(g=>Math.abs(g.x-point.x)<width&&Math.abs(g.y-point.y)<height);
      if(group){group.items.push(point);const n=group.items.length;group.x+=(point.x-group.x)/n;group.y+=(point.y-group.y)/n;}
      else groups.push({x:point.x,y:point.y,items:[point]});
    }
    return groups;
  }
  /* [[west,south],[east,north]] around points {lon,lat}. When the points sit on both
     sides of the date line (Tahiti and Australia), the shorter span crossing 180° wins:
     east may then exceed 180, which MapLibre accepts. */
  function bounds(points){
    const valid=points.filter(p=>p&&Number.isFinite(p.lon)&&Number.isFinite(p.lat));
    if(!valid.length)return null;
    let s=90,n=-90;for(const p of valid){s=Math.min(s,p.lat);n=Math.max(n,p.lat);}
    const lons=valid.map(p=>((p.lon+540)%360)-180).sort((a,b)=>a-b);
    let gap=0,at=-1;
    for(let i=0;i<lons.length;i++){const next=i===lons.length-1?lons[0]+360:lons[i+1],g=next-lons[i];if(g>gap){gap=g;at=i;}}
    let w=lons[0],e=lons[lons.length-1];
    if(at!==lons.length-1&&lons.length>1){w=lons[at+1];e=lons[at]+360;}
    return [[w,s],[e,n]];
  }
  /* True when a point lies in a view that may extend past ±180 (world copies). */
  function inView(lon,lat,view){
    if(lat<view.south||lat>view.north)return false;
    if(view.east-view.west>=360)return true;
    for(const shift of [0,360,-360]){const x=lon+shift;if(x>=view.west&&x<=view.east)return true;}
    return false;
  }
  /* Rough on-screen distance, good enough to sort a list around the map centre. */
  function distance(a,b){
    let d=Math.abs(a.lon-b.lon)%360;if(d>180)d=360-d;
    const k=Math.cos(((a.lat+b.lat)/2)*Math.PI/180);
    return Math.hypot(d*k,a.lat-b.lat);
  }
  /* Most frequent labels first, ties kept in first-seen order. */
  function top(values,limit=3){
    const counts=new Map();for(const v of values)if(v)counts.set(v,(counts.get(v)||0)+1);
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
  }
  return {group,bounds,inView,distance,top};
});
