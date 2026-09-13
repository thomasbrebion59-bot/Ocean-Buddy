/* Group nearby map points without dropping any destination. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanMapModel=api;})(typeof window!=='undefined'?window:globalThis,()=>({
  group(points,width=116,height=68){
    const groups=[];
    for(const point of points){
      const group=groups.find(g=>Math.abs(g.x-point.x)<width&&Math.abs(g.y-point.y)<height);
      if(group){group.items.push(point);const n=group.items.length;group.x+=(point.x-group.x)/n;group.y+=(point.y-group.y)/n;}
      else groups.push({x:point.x,y:point.y,items:[point]});
    }
    return groups;
  }
}));
