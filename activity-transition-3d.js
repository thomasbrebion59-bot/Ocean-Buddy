/* Transitions d’activité en 3D (three.js, WebGL) — plans de tournage de GPT-6 Astra.
   Une vraie caméra perspective traverse un diorama : décor peint courbé (loin), calque intermédiaire
   (vague, arche, récif…), Poulpy détouré, particules 3D animées sur la carte graphique (bulles, écume,
   embruns, plancton, vent). Une passe plein écran ajoute distorsion liquide, aberration chromatique,
   caustiques, rayons de lumière, traversée de surface, exposition, grain et vignette ; l’entrée et la
   sortie sont des masques liquides à bord réfractif (le canvas est transparent : l’app est dessous).
   activity-transition.js délègue ici quand le moteur est prêt, sinon il garde la version 2D. */
(() => {
  'use strict';
  const V='?v=4';
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(t,a=0,b=1)=>Math.max(a,Math.min(b,t)),lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t),easeOut=t=>1-(1-t)**3;
  const D=Math.PI/180;

  /* ---------- Plans de tournage (docs/transitions-plan-3d-astra.json, adaptés au téléphone portrait) ----------
     cam : [ms, position, cible, roulis°, focale°] ; calques placés en fractions de l’écran au repos
     (fx, fy : centre, 0 = milieu ; fw : largeur) à la profondeur z ; mouvements [ms, dx, dy, rot°, échelle].
     fx : [ms, valeur] pour distorsion (px), aberration (px), rayons, caustiques, exposition, surface. */
  const P={
    plongee:{ms:3300,tint:[.03,.1,.28],rim:[.55,1,.95],
      cam:[[0,[-.2,1.1,1.3],[0,-.7,-8],-3,53],[700,[-.45,.2,.25],[.1,-1.2,-6.8],-6,57],[1450,[.4,-.9,-.35],[0,-1.3,-6.5],4,60],[1950,[0,.05,.8],[0,-.4,-8],0,53],[3300,[.1,-.2,.3],[0,-.5,-8],1,55]],
      bgMove:[[0,0,0],[3300,0,.35]],
      mid:{z:-4.2,k:1.42,mv:[[0,0,-.02],[600,.02,-.05],[1550,-.05,.08],[3300,-.06,.1]]},
      fg:{z:-6.5,fx:0,fy:.2,fw:.8,mv:[[0,.02,-.12,-3,.96],[450,.02,-.1,-3,.97],[1000,0,-.03,3,1],[1550,0,.02,0,1],[3300,0,.03,1,1.02]]},
      parts:[{kind:'rise',n:220,sprite:0,box:[0,-1.2,-6.2,1.4,6,1.2],spd:[1.1,2],size:[.03,.12],col:[1,1,1],a:.8,emit:'fg'},
             {kind:'drift',n:290,sprite:1,box:[0,-.5,-5.5,6,10,7],spd:[.05,.15],size:[.015,.04],col:[.5,.95,1],a:.2},
             {kind:'rise',n:50,sprite:0,box:[0,-1,0,2.6,6,1.4],spd:[1.4,2.6],size:[.08,.22],col:[1,1,1],a:.55,t:[1100,2100]}],
      fx:{dist:[[0,1.8],[1300,2],[1420,6],[1700,1.8]],rays:[[0,.16],[1450,.42],[2100,.25]],src:[.18,1.05],caust:[[0,.1]],vig:.17,grain:.02,expo:[[0,1]]},
      entry:{kind:'circle',ms:480},exit:{kind:'hole',at:[.5,.42],from:2710},title:[1950,2700],haptics:[420,1450],gauge:18,ticks:1},
    surf:{ms:3300,tint:[.05,.18,.5],rim:[1,.98,.9],
      cam:[[0,[-.55,.25,1.3],[0,-.55,-7.5],-5,53],[550,[-.35,-.6,.3],[.15,-1.1,-6.8],-11,59],[1250,[.55,-.9,-.6],[.35,-1.1,-6.2],8,62],[1850,[.15,.15,.6],[0,-.25,-8],0,53],[3300,[.3,.35,.15],[0,-.1,-8],2,55]],
      bgMove:[[0,0,0],[3300,-.15,0]],
      mid:{z:-4.8,k:1.55,mv:[[0,.12,.1,-8,1],[400,.12,.1,-8,1],[1350,-.1,.12,6,1],[3300,-.12,.13,4,1]]},
      fg:{z:-6.2,fx:0,fy:.24,fw:.78,mv:[[0,-.1,.06,-9,.96],[550,-.08,.05,-9,.97],[1000,0,.02,7,1],[1450,.06,-.02,2,1],[1850,0,0,0,1],[3300,.02,-.01,0,1]]},
      parts:[{kind:'stream',n:250,sprite:1,box:[-.8,1.6,-5,3.5,3,4],dir:[1,-.6,.6],spd:[1.8,4],size:[.02,.06],col:[1,.97,.9],a:.7},
             {kind:'burst',n:130,sprite:2,at:1180,life:900,org:[.2,-1.4,-5.8],dir:[.2,1,.5],spread:1.2,spd:[1.5,3.5],g:-4,size:[.015,.07],col:[1,1,1],a:.9},
             {kind:'stream',n:40,sprite:1,box:[0,-.2,-.2,3,5,1.6],dir:[.3,-1,0],spd:[2,4],size:[.12,.3],col:[.95,.98,1],a:.35,t:[500,2300]}],
      fx:{dist:[[0,4],[1100,4],[1230,12],[1500,4],[1950,1]],ab:[[0,0],[1200,0],[1250,1.2],[1350,0]],rays:[[0,.18],[1450,.42],[2200,.24]],src:[.78,.82],caust:[[0,.12],[1600,.12],[1900,0]],vig:.12,grain:.018,expo:[[0,1]]},
      entry:{kind:'line',dir:[-1,-1],ms:430},exit:{kind:'line',dir:[-1,-1],from:2720},title:[1900,2700],haptics:[430,1250],line:1},
    bodyboard:{ms:3300,tint:[.05,.3,.6],rim:[.6,1,.95],
      cam:[[0,[.35,.1,1.2],[0,-1.2,-7],4,53],[650,[.15,-1.2,0],[0,-1.55,-6],-3,59],[1220,[-.3,-.55,-.45],[.1,-.85,-5.8],-7,62],[1660,[.12,-.85,.15],[0,-1.45,-6.2],3,56],[2050,[0,.1,.8],[0,-.35,-8],0,53],[3300,[0,-.1,.3],[0,-.4,-8],0,55]],
      bgMove:[[0,0,0],[1200,0,.2],[3300,0,.2]],
      mid:{z:-4.7,k:1.2,mv:[[0,0,.08],[950,0,.08],[1300,0,.01],[1750,0,.1],[3300,0,.09]]},
      fg:{z:-6,fx:0,fy:.2,fw:.8,mv:[[0,0,0,4,.97],[850,0,0,4,1],[1250,0,-.1,-6,1],[1580,0,0,2,1],[3300,0,-.01,0,1]]},
      parts:[{kind:'stream',n:300,sprite:1,box:[0,-2.4,-3.5,4,1.6,5],dir:[0,-.4,1],spd:[2.5,3.5],size:[.02,.07],col:[1,.97,.9],a:.7},
             {kind:'burst',n:140,sprite:2,at:1580,life:950,org:[0,-2.1,-5.8],dir:[0,1,.3],spread:1.6,spd:[1.4,2.8],g:-5,size:[.02,.08],col:[1,1,1],a:.9},
             {kind:'burst',n:40,sprite:1,at:1560,life:380,org:[0,-.6,-.4],dir:[0,.2,1],spread:2.2,spd:[.8,1.6],g:-1,size:[.2,.4],col:[.95,.98,1],a:.4}],
      fx:{dist:[[0,2],[1560,2],[1580,15],[1800,2]],ab:[[0,0],[1570,0],[1580,.8],[1660,0]],rays:[[0,.12]],src:[.7,1.05],caust:[[0,.04]],vig:.08,grain:.015,expo:[[0,1]]},
      entry:{kind:'line',dir:[0,1],ms:380},exit:{kind:'hole',at:[.5,.1],from:2730},title:[2050,2720],haptics:[380,1580]},
    baignade:{ms:3300,tint:[.1,.55,.6],rim:[1,1,1],
      cam:[[0,[.1,-1.1,1.1],[0,-.3,-8],-3,57],[850,[-.25,-.65,.25],[0,-.65,-6.4],-2,59],[1420,[.1,.6,.05],[0,-1.3,-6.4],2,57],[1950,[0,.35,.9],[0,-.45,-8],0,53],[3300,[0,.45,.65],[0,-.3,-8],0,53]],
      bgMove:[[0,0,0]],
      fg:{z:-6.4,fx:0,fy:.22,fw:.72,mv:[[0,0,.04,-2,.97],[1450,0,0,2,1],[3300,0,0,0,1]],bob:.012},
      parts:[{kind:'rise',n:90,sprite:0,box:[0,-2,-5,3,5,4],spd:[.6,1],size:[.025,.16],col:[1,1,1],a:.75,t:[0,1500]},
             {kind:'burst',n:50,sprite:2,at:1320,life:500,org:[0,-1.2,-6],dir:[0,1,.4],spread:1.4,spd:[1.2,2.4],g:-5,size:[.02,.06],col:[1,1,1],a:.9},
             {kind:'sparkle',n:80,sprite:1,box:[0,-1.8,-6,5,1.6,4],spd:[.03,.08],size:[.02,.05],col:[1,.95,.75],a:.8,t:[1400,3300]}],
      fx:{dist:[[0,4],[1450,1]],rays:[[0,.2],[1450,.06]],src:[.3,.95],caust:[[0,.26],[1450,.1]],vig:.04,grain:.012,expo:[[0,1]],surf:[[0,1.2],[1080,1.05],[1450,-.1]]},
      entry:{kind:'circle',ms:460},exit:{kind:'hole',at:[.5,.3],from:2740},title:[1950,2740],haptics:[460,1350]},
    paddle:{ms:3300,tint:[.06,.22,.45],rim:[1,.82,.55],
      cam:[[0,[-.7,.7,1.1],[0,-1.1,-7],-4,53],[800,[-.4,-.35,.25],[.1,-1.7,-6.4],-2,56],[1400,[.5,-.05,.05],[0,-1.25,-6.4],3,58],[1950,[.1,.25,.8],[0,-.45,-8],0,53],[3300,[.2,.35,.45],[0,-.3,-8],0,54]],
      bgMove:[[0,0,0]],
      fg:{z:-6.4,fx:0,fy:.16,fw:.62,mv:[[0,-.05,.02,3,.97],[600,-.03,.01,3,.98],[1100,.01,0,-3,1],[1550,.02,0,0,1],[3300,.03,0,0,1]]},
      parts:[{kind:'burst',n:70,sprite:2,at:1120,life:900,org:[-.45,-2,-6.2],dir:[-.3,1,.2],spread:.9,spd:[.8,1.6],g:-3,size:[.02,.05],col:[1,1,1],a:.9},
             {kind:'sparkle',n:150,sprite:1,box:[0,-2.6,-5,4,1.4,4],spd:[.03,.08],size:[.02,.08],col:[1,.85,.55],a:.8,t:[900,3300]},
             {kind:'drift',n:40,sprite:1,box:[0,0,-5,5,8,5],spd:[.05,.12],size:[.02,.05],col:[1,.85,.5],a:.18}],
      fx:{dist:[[0,2],[1100,2],[1160,9],[1400,2]],rays:[[0,.14]],src:[.28,.7],caust:[[0,0]],vig:.08,grain:.015,expo:[[0,1]]},
      entry:{kind:'slit',ms:440},exit:{kind:'v',from:2720},title:[1950,2720],haptics:[440,1160],line:1},
    kayak:{ms:3300,tint:[.03,.08,.22],rim:[.35,.55,1],
      cam:[[0,[-.45,.15,1.6],[.1,-.7,-8],-4,51],[750,[-.25,-.3,.45],[.2,-1.2,-6.7],-2,55],[1350,[.55,-.05,-.45],[.15,-1.2,-6.7],4,60],[1950,[.15,.3,.7],[0,-.35,-8],0,53],[3300,[.2,.25,.2],[0,-.35,-8],0,55]],
      bgMove:[[0,0,0]],
      mid:{z:-3.4,k:1.25,mv:[[0,0,0,0,1],[450,0,0,0,1],[1500,-.12,.06,0,1.45],[3300,-.16,.08,0,1.6]]},
      fg:{z:-6.7,fx:0,fy:.22,fw:.78,mv:[[0,-.05,.02,-3,.97],[700,-.03,.01,-3,.98],[1500,.03,0,2,1],[3300,.04,0,0,1]],bob:.008},
      parts:[{kind:'stream',n:65,sprite:2,box:[0,1,-2.6,3,4,1.2],dir:[0,-1,0],spd:[1.5,2.5],size:[.02,.05],col:[.85,.95,1],a:.8,t:[0,1600]},
             {kind:'stream',n:170,sprite:1,box:[0,-2.5,-5.5,3,.8,3],dir:[0,-.1,1],spd:[1.3,1.9],size:[.02,.06],col:[1,.97,.9],a:.7},
             {kind:'drift',n:45,sprite:1,box:[.8,.5,-6,3,5,3],spd:[.04,.1],size:[.02,.05],col:[1,.9,.6],a:.5,t:[1100,3300]}],
      fx:{dist:[[0,2],[1300,6],[1500,2]],rays:[[0,.08],[1350,.38],[2000,.15]],src:[.65,.72],caust:[[0,.16]],vig:.12,grain:.02,expo:[[0,.72],[1150,.74],[1450,1.08],[1750,1]]},
      entry:{kind:'edges',ms:410},exit:{kind:'line',dir:[0,1],from:2730},title:[1950,2730],haptics:[410,1350]},
    snorkeling:{ms:3300,tint:[.05,.4,.55],rim:[.8,1,1],
      cam:[[0,[.2,1,1.2],[0,-.8,-8],3,53],[650,[-.3,.1,.1],[0,-1.3,-6.5],-5,59],[1370,[.5,-.7,-.35],[.1,-1.45,-6.4],4,60],[1950,[0,.15,.8],[0,-.45,-8],0,53],[3300,[.1,.25,.45],[0,-.3,-8],0,54]],
      bgMove:[[0,0,0]],
      mid:{z:-4.4,k:1.5,mv:[[0,.04,.14],[500,.04,.14],[1500,-.07,.13],[3300,-.08,.13]]},
      fg:{z:-6.4,fx:0,fy:.14,fw:.8,mv:[[0,-.07,.04,-4,.97],[550,-.07,.04,-4,.97],[1600,.05,-.01,2,1],[3300,.06,-.01,0,1]],bob:.01},
      parts:[{kind:'rise',n:170,sprite:0,box:[.9,-1,-5,2,7,4],spd:[.8,1.7],size:[.025,.14],col:[1,1,1],a:.8},
             {kind:'drift',n:240,sprite:1,box:[0,-.5,-5,6,10,7],spd:[.04,.12],size:[.012,.035],col:[.8,1,1],a:.24},
             {kind:'rise',n:30,sprite:0,box:[.9,-1,-.3,1.4,5,1],spd:[1.5,2.4],size:[.16,.32],col:[1,1,1],a:.5,t:[1250,2300]}],
      fx:{dist:[[0,2.5],[1300,2.5],[1370,7],[1600,2.5]],rays:[[0,.28]],src:[.2,1.02],caust:[[0,.24]],vig:.09,grain:.014,expo:[[0,1]],surf:[[0,-.2],[1,-.2]]},
      entry:{kind:'line',dir:[0,1],ms:520},exit:{kind:'hole',at:[.64,.55],from:2720},title:[1950,2720],haptics:[520,1370],gauge:3},
    kitesurf:{ms:3300,tint:[.45,.2,.2],rim:[1,.9,.7],
      cam:[[0,[-.45,-.45,1.3],[0,-.3,-8],-5,55],[750,[-.3,-.7,.2],[0,-.6,-6.8],-10,60],[1320,[.45,.65,-.25],[.15,-.1,-7],11,63],[1730,[.2,-.15,.25],[0,-.7,-7],2,57],[2050,[0,.2,.9],[0,-.2,-8],0,53],[3300,[.2,.3,.5],[0,-.2,-8],1,54]],
      bgMove:[[0,0,0]],
      kite:{z:-7.5,fx:0,fy:-.3,fw:.84,mv:[[0,-.04,0,-7,1],[450,-.04,0,-7,1],[1100,.06,-.02,7,1],[1730,.03,0,0,1],[3300,.04,0,0,1]]},
      fg:{z:-6.5,fx:0,fy:.26,fw:.62,mv:[[0,0,0,-8,.97],[750,0,0,-8,1],[1320,0,-.12,9,1],[1730,0,0,0,1],[3300,0,-.01,0,1]]},
      parts:[{kind:'stream',n:280,sprite:1,box:[0,-1.5,-4.5,5,4,4],dir:[1,.7,.4],spd:[2,5],size:[.015,.05],col:[1,.97,.92],a:.6},
             {kind:'wind',n:80,sprite:3,box:[0,0,-4,6,9,3],dir:[1,.35,0],spd:[4,7],size:[.12,.2],col:[1,1,1],a:.16,t:[550,1500]},
             {kind:'burst',n:140,sprite:2,at:1730,life:620,org:[0,-2.3,-6.3],dir:[0,.6,.3],spread:2,spd:[1.2,2.6],g:-6,size:[.02,.07],col:[1,1,1],a:.9}],
      fx:{dist:[[0,0],[1200,7],[1320,0],[1700,0],[1730,10],[1950,1]],ab:[[0,0],[740,0],[750,.9],[840,0]],rays:[[0,.22],[1320,.3],[1450,.22]],src:[.8,.85],caust:[[0,0]],vig:.1,grain:.018,expo:[[0,1],[1300,1.05],[1440,1]]},
      entry:{kind:'line',dir:[1,1],ms:380},exit:{kind:'line',dir:[1,1],from:2710},title:[2050,2710],haptics:[380,1320,1730],lines:1},
    windsurf:{ms:3300,tint:[.25,.18,.45],rim:[1,.9,.6],
      cam:[[0,[.55,.1,1.25],[0,-.65,-8],5,53],[720,[.35,-.75,.2],[0,-1.1,-6.7],9,58],[1370,[-.55,-.25,-.35],[.15,-.65,-6.6],-9,61],[1950,[0,.2,.8],[0,-.35,-8],0,53],[3300,[-.2,.15,.3],[0,-.3,-8],-1,55]],
      bgMove:[[0,0,0]],
      mid:{z:-4.6,k:1.1,mv:[[0,-.32,.3,-10,.5],[950,-.32,.3,-10,.5],[1500,.06,.28,8,.56],[3300,.28,.3,8,.56]]},
      fg:{z:-6.6,fx:0,fy:.1,fw:.74,mv:[[0,-.04,.02,7,.97],[650,-.03,.01,7,.98],[1300,.03,0,-7,1],[1750,0,0,0,1],[3300,.02,0,0,1]]},
      parts:[{kind:'burst',n:260,sprite:1,at:950,life:750,org:[.2,-2,-6],dir:[.6,.8,.3],spread:1.3,spd:[2,4],g:-4,size:[.015,.06],col:[1,.97,.92],a:.8},
             {kind:'stream',n:140,sprite:1,box:[0,-2.6,-5,4,.8,3],dir:[-1,-.1,.4],spd:[1.5,2.5],size:[.02,.06],col:[1,.97,.9],a:.6},
             {kind:'wind',n:60,sprite:3,box:[0,.4,-4,6,8,3],dir:[1,.2,0],spd:[4,7],size:[.12,.2],col:[1,1,1],a:.14}],
      fx:{dist:[[0,2],[1350,2],[1420,11],[1650,2]],ab:[[0,0],[1360,0],[1370,.7],[1470,0]],rays:[[0,.2],[1260,.2],[1370,.36],[1500,.2]],src:[.64,.72],caust:[[0,0]],vig:.12,grain:.018,expo:[[0,1]]},
      entry:{kind:'line',dir:[-.6,1],ms:420},exit:{kind:'line',dir:[-1,0],from:2720},title:[1950,2720],haptics:[420,1370],segments:1}
  };

  /* ---------- Chargement ---------- */
  let T=null,LAYERS=null,ok=false,loading=null;
  function supported(){try{return !!document.createElement('canvas').getContext('webgl2');}catch(_){return false;}}
  function init(){
    if(!loading)loading=(async()=>{
      if(!supported()||!window.OceanGlobe?.load)throw Error('webgl');
      const [three,layers]=await Promise.all([window.OceanGlobe.load(),fetch('assets/transitions/layers.json'+V).then(r=>r.json())]);
      if(!['PlaneGeometry','WebGLRenderTarget','Texture','Points'].every(k=>k in three))throw Error('three');
      T=three;LAYERS=layers;warm();ok=true;
    })().catch(e=>{loading=null;console.warn('Transitions 3D indisponibles',e);});
    return loading;
  }
  const imgs=new Map();
  function img(src){
    if(!imgs.has(src)){const i=new Image();i.decoding='async';i.src=src;imgs.set(src,(i.decode?i.decode():new Promise((r,j)=>{i.onload=r;i.onerror=j;})).then(()=>i).catch(()=>null));}
    return imgs.get(src);
  }
  const files=id=>[`${id}.webp`,`${id}-fg.webp`,LAYERS&&LAYERS[id+'#mid']?`${id}-mid.webp`:null,P[id]?.lines?`${id}-fg2.webp`:null];
  function preload(id){return Promise.all(files(id).map(f=>f?img('assets/transitions/'+f+V).then(i=>{if(i&&T&&R)texFor(i);return i;}):null));}
  /* Le moteur se prépare quand l’app est au calme, puis les calques un par un. */
  (window.requestIdleCallback||setTimeout)(()=>init().then(()=>{if(ok)Object.keys(P).forEach((id,i)=>setTimeout(()=>preload(id),400+i*350));}),{timeout:4000});

  /* ---------- Interpolations ---------- */
  function track(keys,ms){ // [[ms,v]] → v, lissé
    if(keys.length===1)return keys[0][1];
    if(ms<=keys[0][0])return keys[0][1];
    for(let i=1;i<keys.length;i++)if(ms<=keys[i][0]){const a=keys[i-1],b=keys[i],t=smooth((ms-a[0])/(b[0]-a[0]||1));return lerp(a[1],b[1],t);}
    return keys[keys.length-1][1];
  }
  function trackN(keys,ms){ // [[ms,a,b,c…]] → [a,b,c…]
    const n=keys[0].length-1,out=[];for(let k=0;k<n;k++)out.push(track(keys.map(r=>[r[0],r[k+1]??(k===3?1:0)]),ms));return out;
  }
  function cr(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
  function camAt(keys,ms){ // Catmull-Rom sur les clés de caméra
    let i=1;while(i<keys.length-1&&ms>keys[i][0])i++;
    const a=keys[i-1],b=keys[i],t=clamp((ms-a[0])/(b[0]-a[0]||1)),k0=keys[Math.max(0,i-2)],k3=keys[Math.min(keys.length-1,i+1)];
    const s=smooth(t)*.35+t*.65;
    const v=j=>[0,1,2].map(c=>cr(k0[j][c],a[j][c],b[j][c],k3[j][c],s));
    return {pos:v(1),tgt:v(2),roll:cr(k0[3],a[3],b[3],k3[3],s),fov:cr(k0[4],a[4],b[4],k3[4],s)};
  }

  /* ---------- Shaders ---------- */
  const LAYER_V=`uniform float uBend;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float b=1.-uv.y;p.z+=uBend*b*b;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
  const LAYER_F=`uniform sampler2D uMap;uniform float uAlpha;uniform vec3 uGrade;uniform float uHaze;varying vec2 vUv;
    void main(){vec4 c=texture2D(uMap,vUv);if(c.a<.01)discard;c.rgb=mix(c.rgb,uGrade,uHaze);gl_FragColor=vec4(c.rgb,c.a*uAlpha);}`;
  const PART_V=`attribute vec4 aSeed;uniform float uT,uKind,uPx,uFocus,uLife,uAt,uG,uSpread;uniform vec3 uC,uS,uDir;uniform vec2 uSpd,uSize;
    varying float vA,vBlur,vRot;
    vec3 wrap(vec3 p){return mod(p+uS*.5,uS)-uS*.5;}
    void main(){
      float t=uT/1000.,spd=mix(uSpd.x,uSpd.y,aSeed.w);vec3 r=aSeed.xyz-.5;vec3 p;vA=1.;
      if(uKind<.5){ // montée (bulles) : colonnes qui ondulent
        p=uC+r*uS;p.y=uC.y-uS.y*.5+mod((aSeed.y*uS.y)+t*spd,uS.y);p.x+=sin(t*2.3+aSeed.w*30.)*.05*(1.+p.y-uC.y);
        vA=smoothstep(uC.y-uS.y*.5,uC.y-uS.y*.4,p.y)*(1.-smoothstep(uC.y+uS.y*.38,uC.y+uS.y*.5,p.y));
      }else if(uKind<1.5){ // dérive lente
        p=uC+r*uS+vec3(sin(t*spd*6.+aSeed.w*40.),cos(t*spd*5.+aSeed.x*40.),sin(t*spd*4.+aSeed.y*40.))*.25;
      }else if(uKind<2.5){ // flux continu dans une direction
        p=uC+wrap(r*uS+normalize(uDir)*spd*t);
        vec3 q=(p-uC)/uS;vA=(1.-smoothstep(.36,.5,abs(q.x)))*(1.-smoothstep(.36,.5,abs(q.y)))*(1.-smoothstep(.36,.5,abs(q.z)));
      }else if(uKind<3.5){ // gerbe : départ à uAt, gravité
        float tb=(uT-uAt)/1000.,life=uLife/1000.*(.6+.4*aSeed.w);
        vec3 d=normalize(normalize(uDir)+r*uSpread);p=uC+d*spd*tb+vec3(0.,.5*uG*tb*tb,0.);
        vA=step(0.,tb)*(1.-smoothstep(life*.6,life,tb));
      }else if(uKind<4.5){ // scintillement sur la surface
        p=uC+r*uS+vec3(sin(t*spd*5.+aSeed.w*40.)*.1,0.,0.);vA=pow(.5+.5*sin(t*(2.+aSeed.w*3.)+aSeed.x*50.),3.);
      }else{ // traits de vent, en périphérie
        p=uC+wrap(r*uS+normalize(uDir)*spd*t);vA=smoothstep(.12,.3,abs(r.x))*(1.-smoothstep(.35,.5,abs((p.x-uC.x)/uS.x)));
      }
      vec4 mv=modelViewMatrix*vec4(p,1.);float z=-mv.z;
      float size=mix(uSize.x,uSize.y,fract(aSeed.w*7.13));
      vBlur=clamp(abs(z-uFocus)/5.,0.,1.);
      gl_PointSize=clamp(size*uPx/max(z,.1)*(1.+vBlur*.6),1.,180.);
      vA*=smoothstep(.15,.9,z);
      vRot=atan(uDir.y,uDir.x);
      gl_Position=projectionMatrix*mv;
    }`;
  const PART_F=`uniform float uSprite,uAlpha,uFade;uniform vec3 uCol;varying float vA,vBlur,vRot;
    void main(){
      vec2 q=gl_PointCoord*2.-1.;q.y=-q.y;float d=length(q),a=0.;float soft=.12+vBlur*.5;
      if(uSprite<.5){ // bulle : anneau réfractif + reflet
        a=smoothstep(1.,1.-soft,d)*(.16+.84*smoothstep(.55-soft,.95,d));
        a+=smoothstep(.34,.1,length(q-vec2(-.35,.38)))*.9;a*=1.-vBlur*.35;
      }else if(uSprite<1.5){a=smoothstep(1.,0.,d);a*=a;} // point doux
      else if(uSprite<2.5){a=smoothstep(1.,1.-soft-.1,d);a+=smoothstep(.4,.1,length(q-vec2(-.3,.3)))*.5;} // goutte
      else{vec2 r=vec2(cos(vRot)*q.x+sin(vRot)*q.y,-sin(vRot)*q.x+cos(vRot)*q.y);a=smoothstep(.12,0.,abs(r.y))*smoothstep(1.,.2,abs(r.x));} // trait
      a*=vA*uAlpha*uFade;if(a<.004)discard;
      gl_FragColor=vec4(uCol*a,a);
    }`;
  const POST_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
  const POST_F=`uniform sampler2D tScene;uniform vec2 uRes;uniform float uTime,uDist,uAb,uRays,uCaust,uVig,uGrain,uExpo,uSurf,uEnK,uEnP,uExK,uExP;
    uniform vec2 uSrc,uEnO,uEnD,uExO,uExD;uniform vec3 uTint,uRim;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){return n(p)*.55+n(p*2.1+3.1)*.3+n(p*4.3+7.7)*.15;}
    /* Distance signée du masque (négatif = scène visible). k : 1 cercle, 2 front, 3 bords→centre, 4 fente, 5 V */
    float mask(float k,float p,vec2 o,vec2 dir,vec2 uv,float asp,bool ex){
      vec2 a=vec2(asp,1.);float w=(fbm(uv*vec2(asp,1.)*5.+uTime*.6)-.5)*.07;
      if(k<1.5){float d=length((uv-o)*a),r=p*1.35;return ex?(r-d)+w:(d-r)+w;}
      if(k<2.5){vec2 dd=normalize(dir);float s=dot(uv-.5,dd)/(abs(dd.x)*.5+abs(dd.y)*.5)*.5+.5;float f=p*1.25-.12;return ex?(f-s)+w:(s-f)+w;}
      if(k<3.5){float d=length((uv-.5)*a),r=(1.-p)*.95;return (r-d)+w;}
      if(k<4.5){float d=abs(uv.x-o.x)*asp,r=p*.75;return (d-r)+w;}
      float v=uv.y-p*1.7+abs(uv.x-.5)*1.3;return -v+w; // V depuis le bas-centre (sortie)
    }
    void main(){
      vec2 uv=vUv,px=1./uRes;float asp=uRes.x/uRes.y;
      /* Masques d’entrée et de sortie, bord réfractif lumineux. */
      float me=uEnK>0.?mask(uEnK,uEnP,uEnO,uEnD,uv,asp,false):-1.;
      float mx=uExK>0.?mask(uExK,uExP,uExO,uExD,uv,asp,true):-1.;
      float sd=max(me,mx);
      float rim=1.-smoothstep(0.,.035,abs(sd));
      vec2 off=(vec2(fbm(uv*4.+uTime*.5),fbm(uv*4.+9.+uTime*.5))-.5);
      /* Surface de l’eau traversée (baignade) : sous la ligne, eau ; sur la ligne, ménisque. */
      float under=uSurf>-.5?step(uv.y,uSurf+sin(uv.x*14.+uTime*3.)*.008):0.;
      float men=uSurf>-.5?1.-smoothstep(0.,.012,abs(uv.y-uSurf-sin(uv.x*14.+uTime*3.)*.008)):0.;
      vec2 duv=uv+off*px*(uDist+under*4.+rim*26.+men*16.);
      float ab=(uAb+rim*1.5)*px.x;
      vec3 col;float al=texture2D(tScene,duv).a;
      col.r=texture2D(tScene,duv+vec2(ab,0.)).r;col.g=texture2D(tScene,duv).g;col.b=texture2D(tScene,duv-vec2(ab,0.)).b;
      /* Caustiques : réseau de lumière ondulant (plus fort sous la surface). */
      vec2 cp=uv*vec2(asp,1.)*7.+vec2(uTime*.25,uTime*.12);float c=0.;
      for(int i=0;i<3;i++){cp+=vec2(sin(cp.y*1.3+uTime*.9),cos(cp.x*1.1-uTime*.7))*.55;c+=.35/(.2+abs(sin(cp.x)*cos(cp.y)));}
      col+=vec3(.75,.95,1.)*pow(c*.15,2.2)*(uCaust+under*.18)*(.4+.6*uv.y);
      /* Rayons de lumière depuis la source. */
      vec2 d=(uv-uSrc)*vec2(asp,1.);float ang=atan(d.x,-d.y),L=length(d);
      float ray=pow(fbm(vec2(ang*9.,uTime*.12)),3.)*2.2*exp(-L*1.1)*smoothstep(0.,.25,L);
      col+=vec3(1.,.95,.82)*ray*uRays;
      col=mix(col,col*vec3(.75,.95,1.05)+uTint*.12,under*.5);
      col+=vec3(1.)*men*.55;
      col*=uExpo;
      col*=1.-uVig*smoothstep(.35,.95,length((uv-.5)*vec2(asp*1.25,1.)));
      col+=(h(uv*uRes+uTime*61.)-.5)*uGrain;
      col+=uRim*rim*.9;
      float m=1.-smoothstep(-.004,.004,sd);
      gl_FragColor=vec4(col*m*al,m*al);
    }`;

  /* ---------- Moteur persistant ----------
     Un seul contexte WebGL, réutilisé d’une transition à l’autre ; les programmes sont compilés et les
     images envoyées à la carte graphique à l’avance (sinon la première transition saccade). */
  let R=null;const texCache=new Map();
  function engine(){
    if(R)return R;
    const canvas=document.createElement('canvas');canvas.className='act-tr-gl';
    const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x000000,0);
    const rt=new T.WebGLRenderTarget(4,4,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
    const pu={tScene:{value:rt.texture},uRes:{value:new T.Vector2(4,4)},uTime:{value:0},uDist:{value:0},uAb:{value:0},uRays:{value:0},uCaust:{value:0},uVig:{value:0},uGrain:{value:0},uExpo:{value:1},uSurf:{value:-1},
      uEnK:{value:0},uEnP:{value:0},uExK:{value:0},uExP:{value:0},uSrc:{value:new T.Vector2(.5,1)},uEnO:{value:new T.Vector2(.5,.5)},uEnD:{value:new T.Vector2(0,1)},uExO:{value:new T.Vector2(.5,.5)},uExD:{value:new T.Vector2(0,1)},
      uTint:{value:new T.Color()},uRim:{value:new T.Color()}};
    const post=new T.Scene(),ocam=new T.OrthographicCamera(-1,1,1,-1,0,1);
    post.add(new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms:pu,vertexShader:POST_V,fragmentShader:POST_F,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false})));
    return R={canvas,renderer,rt,pu,post,ocam};
  }
  function texFor(i){
    if(!texCache.has(i)){const t=new T.Texture(i);t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;texCache.set(i,t);if(R)R.renderer.initTexture(t);}
    return texCache.get(i);
  }
  function warm(){
    try{
      const {renderer,rt,post,ocam}=engine();renderer.setSize(4,4,false);
      const sc=new T.Scene(),cam=new T.PerspectiveCamera(50,1,.1,10);
      const g=new T.PlaneGeometry(1,1),lm=new T.ShaderMaterial({uniforms:{uMap:{value:null},uAlpha:{value:1},uBend:{value:0},uGrade:{value:new T.Color()},uHaze:{value:0}},vertexShader:LAYER_V,fragmentShader:LAYER_F,transparent:true,depthTest:false,depthWrite:false});
      const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(new Float32Array(3),3));pg.setAttribute('aSeed',new T.BufferAttribute(new Float32Array(4),4));
      const pmU={uT:{value:0},uKind:{value:0},uPx:{value:1},uFocus:{value:1},uLife:{value:1},uAt:{value:0},uG:{value:0},uSpread:{value:0},uC:{value:new T.Vector3()},uS:{value:new T.Vector3(1,1,1)},uDir:{value:new T.Vector3(0,1,0)},uSpd:{value:new T.Vector2()},uSize:{value:new T.Vector2()},uSprite:{value:0},uAlpha:{value:1},uFade:{value:1},uCol:{value:new T.Color()}};
      const pm=new T.ShaderMaterial({uniforms:pmU,vertexShader:PART_V,fragmentShader:PART_F,transparent:true,depthTest:false,depthWrite:false,blending:T.NormalBlending,premultipliedAlpha:true});
      sc.add(new T.Mesh(g,lm),new T.Points(pg,pm));
      renderer.setRenderTarget(rt);renderer.render(sc,cam);renderer.setRenderTarget(null);renderer.render(post,ocam);
      g.dispose();lm.dispose();pg.dispose();pm.dispose();
    }catch(e){console.warn(e);}
  }

  /* ---------- Titre (mêmes styles que la version 2D) ---------- */
  function count(id){try{return SPOTS.filter(s=>spotSports(s).includes(id)).length;}catch(_){return 0;}}
  function titleEl(id,cfg){
    const sport=(typeof SPORTMAP!=='undefined'&&SPORTMAP[id])||{label:id},n=count(id);
    const t=document.createElement('div');t.className='act-tr-title';
    t.innerHTML=`<img class="act-tr-badge" src="assets/poulpy/icons/${id}.jpg" alt=""><b>${sport.label}</b>${cfg.line?'<i class="act-tr-line"></i>':''}${n?`<small>${n} spots t’attendent</small>`:''}${cfg.gauge?`<span class="act-tr-gauge">${cfg.ticks?'<em></em><em></em><em></em>':''}<span>0</span> m</span>`:''}${cfg.segments?'<span class="act-tr-seg"><em></em><em></em><em></em></span>':''}`;
    const live=document.getElementById('a11yLive');if(live)live.textContent=`${sport.label} : ${n} spots`;
    return t;
  }

  let busy=false,lastTap=null;
  document.addEventListener('pointerdown',e=>{lastTap=[e.clientX/innerWidth,1-e.clientY/innerHeight];},{capture:true,passive:true});

  async function play(id,swap){
    const cfg=P[id];if(!cfg||!ok||busy)return false;
    const texs=await Promise.race([preload(id),new Promise(r=>setTimeout(()=>r(null),350))]);
    if(!texs||!texs[0]||!texs[1])return false;
    busy=true;
    const W=innerWidth,H=innerHeight,asp=W/H,dpr=Math.min(1.5,devicePixelRatio||1);
    const wrap=document.createElement('div');wrap.className='act-tr act-tr-3d';wrap.dataset.act=id;wrap.setAttribute('aria-hidden','true');
    wrap.style.background='transparent';
    const E=engine(),canvas=E.canvas;wrap.append(canvas);
    const over=document.createElement('canvas');over.className='act-tr-fx';wrap.append(over);
    const title=titleEl(id,cfg);wrap.append(title);
    const renderer=E.renderer,rt=E.rt;
    renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);rt.setSize(Math.round(W*dpr),Math.round(H*dpr));
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(53,asp,.05,60);
    const disposables=[];
    const tex=texFor;
    /* Taille visible à la profondeur z, caméra au repos (0, 0, .8). */
    const vis=z=>{const h=2*(.8-z)*Math.tan(26.5*D);return [h*asp,h];};
    const tilt=z=>-.4*(.8-z)/8.8;
    function plane(t,w,h,z,opts={}){
      const g=new T.PlaneGeometry(w,h,opts.seg||1,opts.seg||1);
      const m=new T.ShaderMaterial({uniforms:{uMap:{value:t},uAlpha:{value:1},uBend:{value:opts.bend||0},uGrade:{value:new T.Color(...cfg.tint)},uHaze:{value:opts.haze||0}},vertexShader:LAYER_V,fragmentShader:LAYER_F,transparent:true,depthTest:false,depthWrite:false});
      const mesh=new T.Mesh(g,m);mesh.position.z=z;mesh.renderOrder=Math.round(z*100);scene.add(mesh);disposables.push(g,m);return mesh;
    }
    /* Décor : plan courbé (le bas se rapproche), assez grand pour couvrir tous les mouvements. */
    const [vw,vh]=vis(-10),bgH=vh*1.34,bgW=Math.max(bgH*900/1350,vw*1.3);
    const bg=plane(tex(texs[0]),bgW,bgW*1350/900,-10,{seg:24,bend:2.6,haze:.04});bg.position.y=tilt(-10);
    const L=LAYERS;
    /* Calque intermédiaire : cadre 900×1350 couvrant l’écran à sa profondeur, objet à sa place dans le cadre. */
    let mid=null,midBase=null;
    if(cfg.mid&&texs[2]&&L[id+'#mid']){
      const b=L[id+'#mid'],[mw,mh]=vis(cfg.mid.z),fw=Math.max(mw*cfg.mid.k,mh*cfg.mid.k*900/1350),fh=fw*1350/900;
      mid=plane(tex(texs[2]),b.w*fw,b.h*fh,cfg.mid.z);
      midBase=[(b.x+b.w/2-.5)*fw,-(b.y+b.h/2-.5)*fh+tilt(cfg.mid.z),mw,mh];
    }
    function sprite(t,box,spec){ // calque détouré placé en fractions d’écran
      const [lw,lh]=vis(spec.z),w=spec.fw*lw,h=w*box.h/box.w*1350/900;
      const m=plane(t,w,h,spec.z);return {m,base:[spec.fx*lw,-spec.fy*lh+tilt(spec.z),lw,lh],w,h};
    }
    const fg=sprite(tex(texs[1]),L[id],cfg.kite||cfg.fg);
    const kiteS=cfg.kite?fg:null;
    const poulpy=cfg.kite?(texs[3]&&L[id+'#2']?sprite(tex(texs[3]),L[id+'#2'],cfg.fg):null):fg;
    /* Particules (GPU) */
    const parts=cfg.parts.map(s=>{
      const g=new T.BufferGeometry(),seed=new Float32Array(s.n*4),pos=new Float32Array(s.n*3);
      for(let i=0;i<seed.length;i++)seed[i]=Math.random();
      g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aSeed',new T.BufferAttribute(seed,4));
      let c=s.box?s.box.slice(0,3):s.org.slice();
      if(s.emit==='fg'&&poulpy){c=[poulpy.base[0]+poulpy.w*.18,poulpy.base[1]+s.box[4]*.5,s.box[2]];}
      const kind={rise:0,drift:1,stream:2,burst:3,sparkle:4,wind:5}[s.kind];
      const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uKind:{value:kind},uPx:{value:H*dpr*.55},uFocus:{value:7},uLife:{value:s.life||1000},uAt:{value:s.at||0},uG:{value:s.g||0},uSpread:{value:s.spread||.5},
        uC:{value:new T.Vector3(...c)},uS:{value:new T.Vector3(...(s.box?s.box.slice(3):[1,1,1]))},uDir:{value:new T.Vector3(...(s.dir||[0,1,0]))},uSpd:{value:new T.Vector2(...s.spd)},uSize:{value:new T.Vector2(...s.size)},
        uSprite:{value:s.sprite},uAlpha:{value:s.a},uFade:{value:1},uCol:{value:new T.Color(...s.col)}},
        vertexShader:PART_V,fragmentShader:PART_F,transparent:true,depthTest:false,depthWrite:false,blending:T.NormalBlending,premultipliedAlpha:true});
      const p=new T.Points(g,m);p.frustumCulled=false;p.renderOrder=Math.round(c[2]*100)+1;scene.add(p);disposables.push(g,m);
      return {p,m,s};
    });
    /* Passe finale plein écran (partagée) */
    const post=E.post,ocam=E.ocam,pu=E.pu;
    pu.uRes.value.set(Math.round(W*dpr),Math.round(H*dpr));pu.uVig.value=cfg.fx.vig;pu.uGrain.value=cfg.fx.grain;pu.uSrc.value.set(...cfg.fx.src);
    pu.uTint.value.setRGB(...cfg.tint);pu.uRim.value.setRGB(...cfg.rim);pu.uEnK.value=0;pu.uExK.value=0;pu.uExP.value=0;
    const KIND={circle:1,line:2,edges:3,slit:4,v:5,hole:1};
    const tap=lastTap&&performance.now()-(lastTap.t||0)<2e3?lastTap:[.5,.5];
    pu.uEnK.value=KIND[cfg.entry.kind];pu.uEnO.value.set(tap[0],tap[1]);if(cfg.entry.dir)pu.uEnD.value.set(...cfg.entry.dir);
    pu.uExK.value=0;const exK=KIND[cfg.exit.kind];if(cfg.exit.at)pu.uExO.value.set(...cfg.exit.at);else pu.uExO.value.set(.5,.5);if(cfg.exit.dir)pu.uExD.value.set(...cfg.exit.dir);
    if(cfg.exit.kind==='v')pu.uExO.value.set(.5,0);

    /* Lignes du kite (2D, projetées depuis la 3D). */
    const octx=over.getContext('2d');over.width=W*dpr;over.height=H*dpr;octx.scale(dpr,dpr);
    const v3=new T.Vector3();
    const proj=(x,y,z)=>{v3.set(x,y,z).project(cam);return [(v3.x*.5+.5)*W,(-v3.y*.5+.5)*H];};

    document.body.append(wrap);
    const gauge=title.querySelector('.act-tr-gauge>span'),ticks=[...title.querySelectorAll('.act-tr-gauge em,.act-tr-seg em')],line=title.querySelector('.act-tr-line');
    let swapped=false,skip=0,buzzed=new Set(),frames=0,slow=0,last=performance.now();
    wrap.addEventListener('pointerdown',()=>{if(swapped&&!skip)skip=performance.now();});
    const t0=performance.now(),total=cfg.ms,exFrom=cfg.exit.from;
    const place=(o,mv,ms,extra=[0,0])=>{
      const [dx,dy,r,s]=trackN(mv,ms);o.m.position.set(o.base[0]+dx*o.base[2]+extra[0],o.base[1]-dy*o.base[3]+extra[1],o.m.position.z);o.m.rotation.z=-(r||0)*D;o.m.scale.setScalar(s||1);
    };
    await new Promise(done=>{
      const step=now=>{
        let ms=now-t0;if(skip)ms+=Math.max(0,exFrom-(skip-t0));
        ms=Math.min(ms,total);
        /* Qualité adaptative : si le téléphone peine, on réduit la définition. */
        const dt=now-last;last=now;frames++;if(frames>4&&dt>26)slow++;
        if(slow===6){renderer.setPixelRatio(1);renderer.setSize(W,H,false);rt.setSize(W,H);pu.uRes.value.set(W,H);slow++;}
        /* Caméra */
        const c=camAt(cfg.cam,ms),wob=Math.sin(ms/2200*6.28)*.02;
        cam.position.set(c.pos[0]+wob,c.pos[1]+Math.cos(ms/2800*6.28)*.02,c.pos[2]);cam.fov=c.fov;cam.updateProjectionMatrix();
        cam.up.set(Math.sin(c.roll*D),Math.cos(c.roll*D),0);cam.lookAt(c.tgt[0],c.tgt[1],c.tgt[2]);
        /* Calques */
        const [bx,by]=trackN(cfg.bgMove.map(k=>[k[0],k[1],k[2]]),ms);bg.position.x=bx;bg.position.y=tilt(-10)+by;
        if(mid){const [dx,dy,r,s]=trackN(cfg.mid.mv,ms);mid.position.set(midBase[0]+dx*midBase[2],midBase[1]-dy*midBase[3],cfg.mid.z);mid.rotation.z=-(r||0)*D;mid.scale.setScalar(s||1);}
        if(kiteS)place(kiteS,cfg.kite.mv,ms);
        if(poulpy){const bob=(cfg.fg.bob||0)*Math.sin(ms/700*6.28)*poulpy.base[3];place(poulpy,cfg.fg.mv,ms,[0,bob]);}
        /* Particules */
        for(const q of parts){q.m.uniforms.uT.value=ms;const w=q.s.t;q.m.uniforms.uFade.value=w?clamp((ms-w[0])/200)*(1-clamp((ms-w[1]+250)/250)):1;}
        /* Effets */
        const f=cfg.fx;pu.uTime.value=ms/1000;pu.uDist.value=track(f.dist,ms);pu.uAb.value=f.ab?track(f.ab,ms):0;pu.uRays.value=track(f.rays,ms);pu.uCaust.value=track(f.caust,ms);pu.uExpo.value=track(f.expo,ms);
        pu.uSurf.value=f.surf?track(f.surf,ms):-1;
        pu.uEnP.value=easeOut(clamp(ms/cfg.entry.ms));if(ms>cfg.entry.ms+30)pu.uEnK.value=0;
        if(ms>=exFrom){pu.uExK.value=exK;pu.uExP.value=smooth(clamp((ms-exFrom)/(total-exFrom)));}
        renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,cam);
        renderer.setRenderTarget(null);renderer.clear();renderer.render(post,ocam);
        /* Changement d’écran dessous, une fois l’écran couvert. */
        if(!swapped&&ms>=cfg.entry.ms){swapped=true;wrap.style.pointerEvents='auto';try{swap?.();}catch(e){console.error(e);}}
        for(const h of cfg.haptics)if(ms>=h&&!buzzed.has(h)){buzzed.add(h);try{navigator.vibrate?.(12);}catch(_){}}
        /* Lignes du kite, de l’aile à la barre tenue par Poulpy. */
        octx.clearRect(0,0,W,H);
        if(cfg.lines&&kiteS&&poulpy){
          const k=kiteS.m,pp=poulpy.m,kw=kiteS.w*k.scale.x,kh=kiteS.h*k.scale.y;
          const a1=proj(k.position.x-kw*.28,k.position.y-kh*.3,k.position.z),a2=proj(k.position.x+kw*.2,k.position.y-kh*.4,k.position.z);
          const bar=proj(pp.position.x+(.28-.5)*poulpy.w,pp.position.y+(.5-.12)*poulpy.h,pp.position.z);
          const exA=ms>=exFrom?1-smooth(clamp((ms-exFrom)/300)):1;
          octx.strokeStyle=`rgba(8,37,91,${.6*exA})`;octx.lineWidth=1.3;
          for(const a of [a1,a2]){octx.beginPath();octx.moveTo(a[0],a[1]);octx.quadraticCurveTo((a[0]+bar[0])/2+10,(a[1]+bar[1])/2,bar[0],bar[1]);octx.stroke();}
        }
        /* Titre */
        const [ti0,ti1]=cfg.title,ti=clamp((ms-ti0)/320),to=clamp((ms-ti1)/260);
        title.style.opacity=(ti*(1-to)).toFixed(3);
        title.style.transform=`translate3d(-50%,${(16*(1-easeOut(ti))-12*to).toFixed(1)}px,0) scale(${(.94+.06*easeOut(ti)).toFixed(3)})`;
        if(line)line.style.transform=`scaleX(${easeOut(clamp((ms-ti0)/500)).toFixed(3)})`;
        if(gauge)gauge.textContent=Math.round(cfg.gauge*easeOut(clamp((ms-cfg.entry.ms)/(ti0-cfg.entry.ms))));
        ticks.forEach((e,i)=>e.classList.toggle('on',ms>ti0+120+i*170));
        if(ms<total)requestAnimationFrame(step);else done();
      };
      requestAnimationFrame(step);
    });
    renderer.setRenderTarget(null);renderer.clear();
    wrap.remove();disposables.forEach(d=>d.dispose?.());
    busy=false;return true;
  }
  document.addEventListener('pointerdown',e=>{if(lastTap)lastTap.t=performance.now();},{capture:true,passive:true});
  window.OceanTransition3D={play,init,preload,ready:()=>ok&&!reduced(),P};
})();
