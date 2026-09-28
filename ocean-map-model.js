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
  /* ---------- Globe 3D ---------- */
  const RAD=Math.PI/180,EARTH_KM=6371,EQUATOR_KM=40075.016686;
  /* Point de la sphère unité : longitude 0 face à +z, nord vers +y (convention du globe). */
  function vec(lat,lon){const a=lat*RAD,b=lon*RAD,c=Math.cos(a);return [c*Math.sin(b),Math.sin(a),c*Math.cos(b)];}
  function latLon(v){const l=Math.hypot(v[0],v[1],v[2])||1;return {lat:Math.asin(Math.max(-1,Math.min(1,v[1]/l)))/RAD,lon:Math.atan2(v[0],v[2])/RAD};}
  /* Angle au centre de la Terre entre deux points, en radians. */
  function arc(a,b){const p=vec(a.lat,a.lon),q=vec(b.lat,b.lon);return Math.acos(Math.max(-1,Math.min(1,p[0]*q[0]+p[1]*q[1]+p[2]*q[2])));}
  const wrapLon=lon=>((lon%360)+540)%360-180;
  /* Échelle MapLibre (Web Mercator, tuiles de 512 px) ↔ kilomètres par pixel à une latitude. */
  function mapZoom(kmPerPx,lat){return Math.log2(EQUATOR_KM*Math.cos(lat*RAD)/(512*kmPerPx));}
  function kmPerPx(zoom,lat){return EQUATOR_KM*Math.cos(lat*RAD)/(512*2**zoom);}
  /* Rayon de regroupement (px) : plus large quand on voit toute la planète. */
  const clusterPx=kpp=>kpp>10?42:kpp>1.9?34:26;
  /* Échelles de regroupement, de la plus fine à la plus large (km par pixel). */
  const LEVELS=Array.from({length:26},(_,i)=>0.3*1.25**i);
  /* Regroupement hiérarchique et stable : chaque échelle regroupe les groupes de l’échelle plus fine,
     sur la sphère (indépendant de la rotation). points : [{id,lat,lon,...}] ; renvoie, pour chaque
     échelle de LEVELS, des groupes {ids,lat,lon,n}. Les groupes ne se chevauchent jamais d’une échelle à l’autre. */
  function clusterLevels(points,levels=LEVELS){
    let items=points.map(p=>({ids:[p.id],v:vec(p.lat,p.lon),n:1,key:String(p.id)}));
    const out=[];
    for(const kpp of levels){
      const r=clusterPx(kpp)*kpp/EARTH_KM,cos=Math.cos(r);
      /* Les plus gros groupes attirent d’abord ; à égalité, ordre stable par clé. */
      const order=items.slice().sort((a,b)=>b.n-a.n||(a.key<b.key?-1:a.key>b.key?1:0));
      const byLat=order.map((it,i)=>({i,lat:Math.asin(Math.max(-1,Math.min(1,it.v[1])))})).sort((a,b)=>a.lat-b.lat);
      const pos=new Array(order.length);byLat.forEach((x,k)=>{pos[x.i]=k;});
      const used=new Uint8Array(order.length),next=[];
      for(let i=0;i<order.length;i++){
        if(used[i])continue;used[i]=1;
        const lead=order[i],members=[lead],lat=byLat[pos[i]].lat;
        for(const dir of [-1,1])for(let k=pos[i]+dir;k>=0&&k<byLat.length&&Math.abs(byLat[k].lat-lat)<=r;k+=dir){
          const j=byLat[k].i;if(used[j])continue;const o=order[j];
          if(lead.v[0]*o.v[0]+lead.v[1]*o.v[1]+lead.v[2]*o.v[2]>=cos){used[j]=1;members.push(o);}
        }
        if(members.length===1){next.push(lead);continue;}
        const v=[0,0,0];let n=0;const ids=[];
        for(const m of members){v[0]+=m.v[0]*m.n;v[1]+=m.v[1]*m.n;v[2]+=m.v[2]*m.n;n+=m.n;ids.push(...m.ids);}
        const l=Math.hypot(...v)||1;
        next.push({ids,v:[v[0]/l,v[1]/l,v[2]/l],n,key:members.map(m=>m.key).sort()[0]});
      }
      items=next;
      out.push(items.map(it=>({ids:it.ids,n:it.n,key:it.key,...latLon(it.v)})));
    }
    return out;
  }
  /* Échelle la plus proche (en progression géométrique) du km/px courant. */
  function levelFor(kpp,levels=LEVELS){let best=0,d=Infinity;levels.forEach((k,i)=>{const e=Math.abs(Math.log(k/kpp));if(e<d){d=e;best=i;}});return best;}
  /* Centre et rayon angulaire (radians) d’un ensemble de points, pour cadrer une région sur le globe. */
  function cap(points){
    const valid=points.filter(p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon));if(!valid.length)return null;
    const s=[0,0,0];for(const p of valid){const v=vec(p.lat,p.lon);s[0]+=v[0];s[1]+=v[1];s[2]+=v[2];}
    const c=Math.hypot(...s)<1e-9?valid[0]:latLon(s);
    return {...c,radius:Math.max(0,...valid.map(p=>arc(c,p)))};
  }
  return {group,bounds,inView,distance,top,vec,latLon,arc,wrapLon,mapZoom,kmPerPx,clusterPx,LEVELS,clusterLevels,levelFor,cap,EARTH_KM};
});
