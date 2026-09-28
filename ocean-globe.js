/* Globe 3D des spots — direction artistique « Abysses vivantes » (conçue avec GPT-6 Astra).
   Une Terre bleu profond dont la bathymétrie réelle (Natural Earth) dessine le paysage ; les spots
   brillent comme du plancton. three.js n’est chargé qu’à l’ouverture de la carte.
   La texture porte des mesures (distance à la côte, profondeur, glaces) et le shader applique la
   palette : les côtes restent nettes même très zoomées. Au-delà du zoom « région », la carte
   détaillée prend le relais (ocean-map.js). */
(() => {
  'use strict';
  const M=window.OceanMapModel;
  const KM=M.EARTH_KM,RAD=Math.PI/180,FOV=30;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---------- Palette « Abysses vivantes » ---------- */
  const P={
    ramp:['#5BC3CD','#34AAC6','#218FBC','#1971AE','#14599C','#104486','#0B346F','#0A2858','#081E42','#06152F'],
    land:'#173D54',ice:'#2B566B',lake:'#247EAA',coast:'#A3E7DF',fres:'#79E3EF',spec:'#B8EEFF',
    atmoIn:'#398CF5',atmoOut:'#79E3EF',border:'#84A6B6',stars:['#BCD4EA','#FFFFFF']
  };
  /* Couleurs des activités, éclaircies pour le fond sombre. */
  const GLOW={surf:'#5C88FF',bodyboard:'#81B2FF',baignade:'#39CDE8',paddle:'#36CDAF',kayak:'#A1D763',snorkeling:'#FFC34D',plongee:'#6889D6',kitesurf:'#FF8068',windsurf:'#BD8AFF'};
  const glow=id=>GLOW[id]||'#5C88FF';

  let threeLoading=null;
  function loadThree(){
    if(!threeLoading)threeLoading=import(new URL('vendor/three/three.module.min.js',document.baseURI).href).catch(e=>{threeLoading=null;throw e;});
    return threeLoading;
  }
  function supported(){try{const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch(_){return false;}}

  const EARTH_V=`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const EARTH_F=`
    uniform sampler2D uMap;uniform vec2 uTex;uniform vec3 uLight,uCam;
    uniform vec3 uRamp[10];uniform vec3 uLand,uIce,uLake,uCoast,uFres,uSpec,uHaze;
    uniform float uCoastA,uCoastW,uReveal;
    varying vec3 vPos;
    const float PI=3.141592653589793;
    vec3 ramp(float d){d=clamp(d,1.,10.);int i=int(floor(d));float f=d-float(i);return mix(uRamp[max(i-1,0)],uRamp[min(i,9)],f);}
    void main(){
      vec3 n=normalize(vPos);
      float u=atan(n.x,n.z)/(2.*PI)+.5,v=asin(clamp(n.y,-1.,1.))/PI+.5;
      /* Couture à ±180° : on prend les dérivées de la coordonnée continue (méthode de Tarini). */
      float u2=fract(u+.5);
      vec2 dx=vec2(dFdx(u),dFdx(v)),dy=vec2(dFdy(u),dFdy(v));
      float dx2=dFdx(u2),dy2=dFdy(u2);
      if(abs(dx2)+abs(dy2)<abs(dx.x)+abs(dy.x)){dx.x=dx2;dy.x=dy2;}
      vec3 t=textureGrad(uMap,vec2(u,v),dx,dy).rgb;
      float tpp=max(length(dx*uTex),length(dy*uTex));
      float sdf=(t.r*255.-128.)/16.;
      float w=clamp(max(fwidth(sdf),tpp),1e-3,8.);
      float land=smoothstep(-.5*w,.5*w,sdf);
      float depth=t.g*255./25.;
      vec3 water=ramp(depth);
      water=mix(uRamp[4],water,uReveal);
      water=mix(water,uLake,1.-smoothstep(.25,.8,depth));
      vec3 col=mix(water,mix(uLand,uIce,t.b*.85),land);
      float hw=.5*uCoastW*w;
      float line=(1.-smoothstep(hw-.5*w,hw+.5*w,abs(sdf)))*(1.-smoothstep(4.,8.,tpp)*.5);
      col=mix(col,uCoast,line*uCoastA);
      vec3 V=normalize(uCam-vPos);
      float ndv=max(dot(n,V),0.);
      col*=.62+.38*max(dot(n,uLight),0.);
      float F=pow(1.-ndv,3.5);
      col=mix(col,uHaze,F*.3);
      col+=uFres*.16*F;
      vec3 H=normalize(uLight+V);
      col+=uSpec*pow(max(dot(n,H),0.),96.)*.18*(1.-land);
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
    }`;
  const ATMO_V=`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
  const ATMO_F=`
    uniform vec3 uCam,uIn,uOut;uniform float uThick,uAlpha;varying vec3 vW;
    void main(){
      vec3 d=normalize(vW-uCam);
      float b=length(cross(d,-uCam));
      float t=clamp((b-1.)/uThick,0.,1.);
      float a=pow(1.-t,2.6)*uAlpha*step(1.,b+.002);
      gl_FragColor=vec4(mix(uIn,uOut,smoothstep(0.,.7,t))*a,0.);
      #include <colorspace_fragment>
    }`;
  const DOT_V=`
    attribute vec3 color;attribute float hide;
    uniform vec3 uCam;uniform float uHalo,uDpr;
    varying vec3 vColor;varying float vA,vHide;
    void main(){
      vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      float facing=dot(normalize(position),normalize(uCam-position));
      vA=smoothstep(.0,.16,facing);vHide=hide;
      gl_PointSize=uHalo*uDpr;vColor=color;
    }`;
  const DOT_F=`
    uniform vec3 uWhite;uniform float uCore,uHalo,uRing,uHaloA;
    varying vec3 vColor;varying float vA,vHide;
    void main(){
      /* Spot absorbé par un groupe : il disparaît, halo compris (le badge le représente). */
      if(vA<.01||vHide>.5)discard;
      float r=length(gl_PointCoord*2.-1.)*uHalo*.5;
      float c=uCore*.5;
      float core=(1.-smoothstep(c-.7,c+.7,r))*(1.-vHide);
      float disk=uRing>0.?(1.-smoothstep(c+uRing-.7,c+uRing+.7,r))*(1.-vHide):core;
      float ring=disk-core;
      float halo=pow(max(1.-r/(uHalo*.5),0.),2.)*uHaloA*(1.-disk)*(1.-.65*vHide);
      vec3 rgb=(vColor*core+uWhite*ring)+vColor*halo;
      /* Halo opaque partiel (et non additif) : là où les spots s’empilent, la lueur tend vers
         la couleur de l’activité au lieu de saturer en blanc. */
      gl_FragColor=vec4(rgb*vA,(disk+halo)*vA);
      #include <colorspace_fragment>
    }`;
  const STAR_V=`attribute float size;attribute vec3 color;varying vec3 vC;uniform float uDpr;void main(){vC=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*uDpr;}`;
  const STAR_F=`varying vec3 vC;void main(){float r=length(gl_PointCoord*2.-1.);float a=1.-smoothstep(.35,1.,r);if(a<.01)discard;gl_FragColor=vec4(vC*a,0.);
    #include <colorspace_fragment>
  }`;

  async function create(host,opts={}){
    if(!supported())throw Error('webgl2');
    const T=await loadThree();
    const mobile=matchMedia('(max-width:759px), (pointer:coarse)').matches;
    const canvas=document.createElement('canvas');canvas.className='og-canvas';
    canvas.tabIndex=0;canvas.setAttribute('role','application');
    canvas.setAttribute('aria-label','Globe interactif des spots. Glisse pour tourner la Terre, pince ou utilise plus et moins pour zoomer. Au clavier : flèches pour tourner, plus et moins pour zoomer.');
    const layer=document.createElement('div');layer.className='og-layer';
    host.append(canvas,layer);
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=T.SRGBColorSpace;
    const maxTex=renderer.capabilities.maxTextureSize;
    const dprCap=2;
    const scene=new T.Scene();
    const camera=new T.PerspectiveCamera(FOV,1,.01,200);
    const col=h=>new T.Color(h);
    const uniEarth={
      uMap:{value:null},uTex:{value:new T.Vector2(4096,2048)},uLight:{value:new T.Vector3()},uCam:{value:new T.Vector3()},
      uRamp:{value:P.ramp.map(col)},uLand:{value:col(P.land)},uIce:{value:col(P.ice)},uLake:{value:col(P.lake)},uCoast:{value:col(P.coast)},
      uFres:{value:col(P.fres)},uSpec:{value:col(P.spec)},uHaze:{value:col(P.atmoIn)},uCoastA:{value:.35},uCoastW:{value:.7},uReveal:{value:0}
    };
    const seg=mobile?128:192;
    const earth=new T.Mesh(new T.SphereGeometry(1,seg,seg/2),new T.ShaderMaterial({uniforms:uniEarth,vertexShader:EARTH_V,fragmentShader:EARTH_F}));
    earth.visible=false;scene.add(earth);
    const atmoU={uCam:{value:new T.Vector3()},uIn:{value:col(P.atmoIn)},uOut:{value:col(P.atmoOut)},uThick:{value:.13},uAlpha:{value:.5}};
    const atmo=new T.Mesh(new T.SphereGeometry(1.14,96,48),new T.ShaderMaterial({uniforms:atmoU,vertexShader:ATMO_V,fragmentShader:ATMO_F,side:T.BackSide,transparent:true,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor}));
    atmo.renderOrder=2;scene.add(atmo);
    /* Étoiles : peu nombreuses, fixes par rapport à la Terre (légère parallaxe quand elle tourne). */
    {
      const n=150,pos=new Float32Array(n*3),size=new Float32Array(n),c=new Float32Array(n*3);let seed=7;
      const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      for(let i=0;i<n;i++){const z=rnd()*2-1,a=rnd()*Math.PI*2,r=Math.sqrt(1-z*z);pos.set([r*Math.cos(a)*80,z*80,r*Math.sin(a)*80],i*3);size[i]=.8+rnd()*rnd()*1.8;const k=col(rnd()<.85?P.stars[0]:P.stars[1]).multiplyScalar(.35+rnd()*.55);c.set([k.r,k.g,k.b],i*3);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('size',new T.BufferAttribute(size,1));g.setAttribute('color',new T.BufferAttribute(c,3));
      const stars=new T.Points(g,new T.ShaderMaterial({uniforms:{uDpr:{value:1}},vertexShader:STAR_V,fragmentShader:STAR_F,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
      stars.renderOrder=-1;scene.add(stars);var starMat=stars.material;
    }
    /* Frontières : très discrètes, visibles à l’échelle d’un continent. */
    const borderMat=new T.LineBasicMaterial({color:col(P.border),transparent:true,opacity:0,depthWrite:false});
    let borders=null;
    fetch(new URL('assets/globe/borders.json',document.baseURI)).then(r=>r.ok?r.json():[]).then(lines=>{
      const out=[];const push=(lat,lon)=>{const v=M.vec(lat,lon);out.push(v[0]*1.0007,v[1]*1.0007,v[2]*1.0007);};
      for(const l of lines)for(let i=2;i<l.length;i+=2){
        const a={lon:l[i-2],lat:l[i-1]},b={lon:l[i],lat:l[i+1]},steps=Math.max(1,Math.ceil(Math.hypot(b.lon-a.lon,b.lat-a.lat)/.8));
        for(let s=0;s<steps;s++){const f0=s/steps,f1=(s+1)/steps;push(a.lat+(b.lat-a.lat)*f0,a.lon+(b.lon-a.lon)*f0);push(a.lat+(b.lat-a.lat)*f1,a.lon+(b.lon-a.lon)*f1);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));
      borders=new T.LineSegments(g,borderMat);borders.renderOrder=1;scene.add(borders);invalidate();
    }).catch(()=>{});

    /* ---------- Spots ---------- */
    const dotU={uCam:{value:new T.Vector3()},uHalo:{value:12},uCore:{value:4},uRing:{value:0},uHaloA:{value:.18},uDpr:{value:1},uWhite:{value:col('#ffffff')}};
    const dotMat=new T.ShaderMaterial({uniforms:dotU,vertexShader:DOT_V,fragmentShader:DOT_F,transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor});
    let dots=null,spots=[],byId=new Map(),levels=[],level=-1,hideAttr=null;
    let clusterEls=new Map(),labelEls=new Map(),selected=null,hovered=null,user=null;
    const selEl=document.createElement('div');selEl.className='og-sel';selEl.hidden=true;selEl.innerHTML='<i></i><b></b>';
    const hovEl=document.createElement('div');hovEl.className='og-hover';hovEl.hidden=true;hovEl.innerHTML='<i></i><b></b>';
    const userEl=document.createElement('div');userEl.className='og-user';userEl.hidden=true;
    layer.append(userEl,hovEl,selEl);

    function setSpots(list){
      spots=list.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)).map(s=>({...s,v:M.vec(s.lat,s.lon)}));
      byId=new Map(spots.map((s,i)=>[s.id,{...s,i}]));
      if(dots){scene.remove(dots);dots.geometry.dispose();}
      const n=spots.length,pos=new Float32Array(n*3),c=new Float32Array(n*3);hideAttr=new Float32Array(n);
      spots.forEach((s,i)=>{pos.set([s.v[0]*1.001,s.v[1]*1.001,s.v[2]*1.001],i*3);const k=col(glow(s.act));c.set([k.r,k.g,k.b],i*3);});
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(c,3));g.setAttribute('hide',new T.BufferAttribute(hideAttr,1));
      dots=new T.Points(g,dotMat);dots.renderOrder=3;dots.frustumCulled=false;scene.add(dots);
      levels=M.clusterLevels(spots);level=-1;
      clusterEls.forEach(el=>el.remove());clusterEls.clear();
      if(selected&&!byId.has(selected))setSelected(null);
      if(hovered&&!byId.has(hovered))setHover(null);
      invalidate(true);
    }

    /* ---------- Caméra : centre (lat, lon) + distance au centre de la Terre (rayons) ---------- */
    const view={lat:30,lon:-8,dist:4.2};let overviewOn=false,keepKpp=0;
    let W=1,H=1,pad={top:0,bottom:0,left:0,right:0},anim=null,inertia=null,dirty=true,raf=0,active=true,lastMove=0,restTimer=0,revealStart=0;
    const minSide=()=>Math.max(1,Math.min(W-pad.left-pad.right,H-pad.top-pad.bottom));
    const tanHalf=Math.tan(FOV*RAD/2);
    const kpp=(dist=view.dist)=>2*(dist-1)*tanHalf/H*KM;
    const widthKm=(dist=view.dist)=>kpp(dist)*minSide();
    const distForWidth=km=>1+km/minSide()/KM*H/(2*tanHalf);
    const distForKpp=k=>1+k/KM*H/(2*tanHalf);
    /* Globe entier : diamètre à 82 % du petit côté ; zoom max : environ 600 km de large. */
    const maxDist=()=>{const f=mobile?.92:.82;return Math.sqrt(1+(H/(f*minSide()*tanHalf))**2);};
    const minDist=()=>distForWidth(opts.minWidthKm||600);
    const clampDist=d=>Math.max(minDist(),Math.min(maxDist()*1.35,d));
    function applyCamera(){
      view.lat=Math.max(-78,Math.min(78,view.lat));view.lon=M.wrapLon(view.lon);
      const v=M.vec(view.lat,view.lon);
      camera.position.set(v[0]*view.dist,v[1]*view.dist,v[2]*view.dist);
      camera.up.set(0,1,0);camera.lookAt(0,0,0);
      camera.near=Math.max(.002,(view.dist-1)*.25);camera.far=view.dist+90;
      camera.aspect=W/H;
      /* Décalage optique : le centre visé tombe au milieu de la zone libre (panneaux, fiche). */
      camera.setViewOffset(W,H,-(pad.left-pad.right)/2,-(pad.top-pad.bottom)/2,W,H);
      camera.updateProjectionMatrix();camera.updateMatrixWorld();
    }
    const ndc=new T.Vector3(),ray=new T.Raycaster();
    /* Point de la Terre sous un pixel de l’écran, ou null (espace). */
    function pick(x,y){
      ray.setFromCamera({x:x/W*2-1,y:-(y/H)*2+1},camera);
      const o=ray.ray.origin,d=ray.ray.direction,b=o.dot(d),c=o.lengthSq()-1,disc=b*b-c;
      if(disc<0)return null;
      const t=-b-Math.sqrt(disc);if(t<0)return null;
      return M.latLon([o.x+d.x*t,o.y+d.y*t,o.z+d.z*t]);
    }
    function project(v){
      ndc.set(v[0],v[1],v[2]).project(camera);
      const cp=camera.position,l=Math.hypot(cp.x,cp.y,cp.z);
      const facing=(v[0]*(cp.x-v[0])+v[1]*(cp.y-v[1])+v[2]*(cp.z-v[2]))/Math.max(1e-6,Math.hypot(cp.x-v[0],cp.y-v[1],cp.z-v[2]));
      return {x:(ndc.x+1)/2*W,y:(1-ndc.y)/2*H,facing,front:facing>.02&&l>1};
    }
    /* Ramène le point géographique `g` sous le pixel (x, y) : base du glisser et du zoom vers le curseur. */
    function anchor(g,x,y){
      for(let k=0;k<3;k++){
        applyCamera();const now=pick(x,y);if(!now)return false;
        const dLat=g.lat-now.lat,dLon=M.wrapLon(g.lon-now.lon);
        if(Math.abs(dLat)+Math.abs(dLon)<1e-5)break;
        view.lat+=dLat;view.lon+=dLon;
      }
      applyCamera();return true;
    }

    /* ---------- Rendu à la demande ---------- */
    function invalidate(){dirty=true;if(active&&!raf)raf=requestAnimationFrame(frame);}
    const easeInOut=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
    function frame(now){
      raf=0;if(!active)return;
      let again=false;
      if(anim){
        const t=Math.min(1,(now-anim.t0)/anim.ms),e=easeInOut(t);
        const q=slerp(anim.a,anim.b,e);view.lat=q.lat;view.lon=q.lon;
        view.dist=Math.exp(Math.log(anim.d0)+(Math.log(anim.d1)-Math.log(anim.d0))*e)+anim.bump*Math.sin(Math.PI*e);
        if(t>=1){const done=anim.done;anim=null;moved('fly');done?.();}else again=true;
        dirty=true;
      }else if(inertia){
        const dt=Math.min(40,now-inertia.t);inertia.t=now;
        view.lat+=inertia.vLat*dt;view.lon+=inertia.vLon*dt;
        const k=Math.pow(.99,dt);inertia.vLat*=k;inertia.vLon*=k;
        if(Math.hypot(inertia.vLat,inertia.vLon)<.02*kpp()/KM/RAD){inertia=null;moved('inertia');}else again=true;
        dirty=true;
      }
      if(revealStart){const t=Math.min(1,(now-revealStart)/900);uniEarth.uReveal.value=easeInOut(t);if(t<1)again=true;else revealStart=0;dirty=true;}
      if(dirty){dirty=false;draw();}
      if(again)raf=requestAnimationFrame(frame);
    }
    function slerp(a,b,t){
      const p=M.vec(a.lat,a.lon),q=M.vec(b.lat,b.lon),d=Math.acos(Math.max(-1,Math.min(1,p[0]*q[0]+p[1]*q[1]+p[2]*q[2])));
      if(d<1e-6)return {lat:b.lat,lon:b.lon};
      const s=Math.sin(d),x=Math.sin((1-t)*d)/s,y=Math.sin(t*d)/s;
      return M.latLon([p[0]*x+q[0]*y,p[1]*x+q[1]*y,p[2]*x+q[2]*y]);
    }
    function draw(){
      applyCamera();
      const cp=camera.position;
      uniEarth.uCam.value.copy(cp);atmoU.uCam.value.copy(cp);dotU.uCam.value.copy(cp);
      uniEarth.uLight.value.set(-.6,.7,1).normalize().applyQuaternion(camera.quaternion);
      const k=kpp(),w=widthKm();
      /* Échelle espace → continent → région : points, liserés et halo s’adaptent en continu. */
      const s=Math.max(0,Math.min(1,(Math.log(8000)-Math.log(Math.max(w,1)))/(Math.log(8000)-Math.log(1500))));
      const far=Math.max(0,Math.min(1,(Math.log(Math.max(w,1))-Math.log(8000))/Math.log(2)));
      dotU.uCore.value=4+2*(1-far)+2*s;dotU.uHalo.value=12+4*(1-far)+4*s+2;dotU.uRing.value=s>.6?1:0;dotU.uHaloA.value=.2;
      uniEarth.uCoastA.value=.35+.15*s;uniEarth.uCoastW.value=.7+.3*s;
      /* Frange atmosphérique fine : environ 9 px sur ordinateur, 6 px sur mobile. */
      atmoU.uThick.value=(mobile?6:9)*k/KM;atmoU.uAlpha.value=.6-.45*s;
      borderMat.opacity=.2*Math.max(0,Math.min(1,(Math.log(14000)-Math.log(w))/Math.log(2)));
      renderer.render(scene,camera);
      /* Regroupements : échelle la plus proche du zoom courant. */
      if(levels.length){const lv=M.levelFor(k);if(lv!==level)applyLevel(lv);}
      placeOverlay();
    }

    /* ---------- Regroupements (DOM) ---------- */
    function applyLevel(lv){
      level=lv;const groups=levels[lv]||[];const keep=new Set();
      hideAttr.fill(0);
      for(const g of groups){
        if(g.n<3)continue;
        for(const id of g.ids){const s=byId.get(id);if(s)hideAttr[s.i]=1;}
        const key=g.key+':'+g.n;keep.add(key);
        let el=clusterEls.get(key);
        if(!el){
          el=document.createElement('button');el.type='button';el.className='og-cluster';
          const acts=new Map();for(const id of g.ids){const a=byId.get(id)?.act;if(a)acts.set(a,(acts.get(a)||0)+1);}
          const top=[...acts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);
          let at=0;const stops=[];
          for(const [a,n] of top){const e=at+n/g.n*360;stops.push(`${glow(a)} ${at.toFixed(1)}deg ${(e-1.5).toFixed(1)}deg`,`transparent ${(e-1.5).toFixed(1)}deg ${e.toFixed(1)}deg`);at=e;}
          if(at<359.5)stops.push(`rgba(255,255,255,.28) ${at.toFixed(1)}deg 360deg`);
          el.style.setProperty('--ring',`conic-gradient(${stops.join(',')})`);
          el._sz=Math.round(Math.min(38,28+Math.log2(g.n/3+1)*3.4));
          el.style.setProperty('--sz',el._sz+'px');
          el.innerHTML=`<span>${g.n}</span>`;
          el.setAttribute('aria-label',`${g.n} spots regroupés ici. Zoomer pour les voir.`);
          el.addEventListener('click',e=>{e.stopPropagation();openCluster(el._union||el._g);});
          layer.append(el);clusterEls.set(key,el);
        }
        el._g=g;el._v=M.vec(g.lat,g.lon);
      }
      clusterEls.forEach((el,key)=>{if(!keep.has(key)){el.remove();clusterEls.delete(key);}});
      dots.geometry.attributes.hide.needsUpdate=true;
      scheduleLabels();
    }
    function openCluster(g){
      const pts=g.ids.map(id=>byId.get(id)).filter(Boolean);
      const c=M.cap(pts);if(!c)return;
      const cur=widthKm(),fit=Math.max(c.radius*KM*2.9,1);
      /* On zoome au moins assez pour que le groupe s’ouvre. */
      const target=Math.min(cur/2.4,fit);
      if(target<(opts.minWidthKm||600)){flyTo({lat:c.lat,lon:c.lon,widthKm:opts.minWidthKm||600},{done:()=>opts.onDive?.({lat:c.lat,lon:c.lon,kmPerPx:Math.max(target,40)/minSide(),reason:'cluster'})});return;}
      flyTo({lat:c.lat,lon:c.lon,widthKm:target});
    }

    /* ---------- Étiquettes, sélection, survol ---------- */
    let labelIds=[];
    function scheduleLabels(){clearTimeout(restTimer);restTimer=setTimeout(()=>{computeLabels();placeOverlay();},120);}
    /* Au repos, deux badges qui se touchent à l’écran (bord du globe, perspective) fusionnent :
       le plus gros affiche le total et ouvre l’ensemble. */
    function mergeClusters(){
      const gap=mobile?10:6,shown=[];
      const all=[...clusterEls.values()];
      for(const el of all){el._absorbed=false;el._union=null;const p=project(el._v);el._p=p;}
      all.filter(el=>el._p.front&&el._p.facing>=.12).sort((a,b)=>b._g.n-a._g.n).forEach(el=>{
        const host=shown.find(o=>Math.hypot(o._p.x-el._p.x,o._p.y-el._p.y)<(o._sz+el._sz)/2+gap);
        if(!host){shown.push(el);return;}
        el._absorbed=true;host._union=host._union||{...host._g,ids:[...host._g.ids]};
        host._union.ids.push(...el._g.ids);host._union.n+=el._g.n;
      });
      for(const el of all){
        const n=(el._union||el._g).n,label=el.firstChild;
        if(label.textContent!==String(n)){label.textContent=n;el.setAttribute('aria-label',`${n} spots regroupés ici. Zoomer pour les voir.`);}
      }
    }
    function computeLabels(){
      mergeClusters();
      const w=widthKm(),max=w<1500?6:w<2600?3:0;
      labelIds=[];if(!max||!levels.length){syncLabels();return;}
      const cx=pad.left+(W-pad.left-pad.right)/2,cy=pad.top+(H-pad.top-pad.bottom)/2;
      const boxes=[];
      clusterEls.forEach(el=>{const p=el._p;if(p&&p.front&&!el._absorbed){const r=el._sz/2+2;boxes.push([p.x-r,p.y-r,p.x+r,p.y+r]);}});
      if(selected&&byId.has(selected)){const p=project(byId.get(selected).v);boxes.push([p.x-8,p.y-8,p.x+160,p.y+14]);}
      const cands=[];
      for(const s of spots){if(hideAttr[byId.get(s.id).i]||s.id===selected)continue;const p=project(s.v);if(!p.front||p.x<pad.left+8||p.x>W-pad.right-8||p.y<pad.top+8||p.y>H-pad.bottom-8)continue;cands.push({s,p,d:Math.hypot(p.x-cx,p.y-cy)});}
      cands.sort((a,b)=>a.d-b.d);
      /* Une étiquette ne cache jamais le point d’un autre spot. */
      for(const {p} of cands)boxes.push([p.x-6,p.y-6,p.x+6,p.y+6]);
      for(const {s,p} of cands){
        if(labelIds.length>=max)break;
        const tw=Math.min(150,s.name.length*6.6+18);
        const opts2=[[p.x+9,p.y-11,p.x+9+tw,p.y+11],[p.x-9-tw,p.y-11,p.x-9,p.y+11]];
        const box=opts2.find(b=>b[0]>pad.left&&b[2]<W-pad.right&&!boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]));
        if(!box)continue;boxes.push(box);labelIds.push({id:s.id,left:box===opts2[1]});
      }
      syncLabels();
    }
    function syncLabels(){
      const keep=new Set(labelIds.map(l=>l.id));
      labelEls.forEach((el,id)=>{if(!keep.has(id)){el.remove();labelEls.delete(id);}});
      for(const l of labelIds){
        let el=labelEls.get(l.id);
        if(!el){
          el=document.createElement('div');el.className='og-label';
          const b=document.createElement('button');b.type='button';b.tabIndex=-1;b.textContent=byId.get(l.id).name;
          b.addEventListener('click',e=>{e.stopPropagation();opts.onSelect?.(l.id);});
          el.append(b);layer.append(el);labelEls.set(l.id,el);
        }
        el.classList.toggle('is-left',l.left);
      }
    }
    /* Au bord du globe, les repères s’effacent avant de passer derrière la Terre. */
    /* Les repères derrière la Terre (ou rasant le bord) sont masqués ; les autres restent pleinement opaques. */
    const put=(el,p,show=true)=>{if(!show||!p.front||p.facing<.12){el.style.visibility='hidden';return;}el.style.visibility='';el.style.transform=`translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;};
    function placeOverlay(){
      const sp=selected&&byId.has(selected)?project(byId.get(selected).v):null;
      clusterEls.forEach(el=>{
        const p=project(el._v);el._p=p;
        /* 8 px libres autour du spot choisi : c’est le badge qui s’écarte, jamais le spot. */
        if(sp&&sp.front){const dx=p.x-sp.x,dy=p.y-sp.y,d=Math.hypot(dx,dy),min=el._sz/2+11+8;if(d<min){const k=d>.5?min/d:0;p.x=d>.5?sp.x+dx*k:sp.x;p.y=d>.5?sp.y+dy*k:sp.y-min;}}
        put(el,p,!el._absorbed&&p.x>-40&&p.x<W+40&&p.y>-40&&p.y<H+40);
      });
      labelEls.forEach((el,id)=>{const s=byId.get(id);s?put(el,project(s.v)):el.remove();});
      if(selected&&byId.has(selected))put(selEl,project(byId.get(selected).v));
      if(hovered&&byId.has(hovered))put(hovEl,project(byId.get(hovered).v));
      if(user)put(userEl,project(user.v));
    }
    function setSelected(id){
      selected=id&&byId.has(id)?id:null;selEl.hidden=!selected;
      if(selected){
        const s=byId.get(selected);selEl.style.setProperty('--c',glow(s.act));selEl.querySelector('b').textContent=s.name;
        selEl.classList.remove('is-new');void selEl.offsetWidth;if(!reduced())selEl.classList.add('is-new');
        if(hovered===selected)setHover(null);
      }
      invalidate();scheduleLabels();
    }
    function setHover(id){
      if(id===hovered)return;hovered=id&&id!==selected?id:null;hovEl.hidden=!hovered;
      if(hovered){const s=byId.get(hovered);hovEl.style.setProperty('--c',glow(s.act));hovEl.querySelector('b').textContent=s.name;labelEls.get(hovered)?.style.setProperty('visibility','hidden');}
      canvas.style.cursor=hovered?'pointer':'';
      invalidate();
    }
    /* Spot visible le plus proche d’un pixel (zone tactile de 44 px). */
    function hit(x,y,r){
      let best=null,bd=r;
      for(const s of spots){if(hideAttr[byId.get(s.id).i])continue;const p=project(s.v);if(!p.front)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=s.id;}}
      return best;
    }

    /* ---------- Mouvements ---------- */
    function moved(reason){lastMove=performance.now();keepKpp=kpp();if(reason!=='overview')overviewOn=false;scheduleLabels();opts.onView?.(getView(),reason);}
    function getView(){return {lat:view.lat,lon:view.lon,widthKm:widthKm(),kmPerPx:kpp(),dist:view.dist};}
    function stop(){anim=null;inertia=null;}
    function flyTo(target,{duration,done}={}){
      stop();
      const d1=clampDist(target.dist||distForWidth(target.widthKm||widthKm()));
      const a={lat:view.lat,lon:view.lon},b={lat:target.lat??view.lat,lon:target.lon??view.lon};
      const ang=M.arc(a,b),ms=reduced()?0:duration??Math.min(1600,600+ang/RAD*9+Math.abs(Math.log(d1/view.dist))*260);
      if(!ms){view.lat=b.lat;view.lon=b.lon;view.dist=d1;invalidate();moved('fly');done?.();return;}
      /* Long trajet : la caméra prend de la hauteur au milieu du vol. */
      const bump=Math.max(0,Math.min(1.5,ang*.9)-(Math.max(view.dist,d1)-1)*.6);
      anim={a,b,d0:view.dist,d1,t0:performance.now(),ms,bump,done};invalidate();
    }
    function zoomAt(f,x,y,animate){
      const target=1+(view.dist-1)/f;
      const clamped=clampDist(target);
      const g=x==null?null:pick(x,y);
      if(animate&&!reduced()){
        const c=g&&x!=null?(()=>{const keep={...view};view.dist=clamped;anchor(g,x,y);const r={lat:view.lat,lon:view.lon};Object.assign(view,keep);applyCamera();return r;})():{lat:view.lat,lon:view.lon};
        flyTo({...c,dist:clamped},{duration:380});
      }else{stop();view.dist=clamped;if(g)anchor(g,x,y);invalidate();moved('zoom');}
      return target<minDist()-1e-6;
    }

    /* ---------- Gestes ---------- */
    const ptrs=new Map();let drag=null,pinch=null,overshoot=0,wheelTimer=0,tapStart=null;
    const local=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
    canvas.addEventListener('pointerdown',e=>{
      if(e.button>0)return;
      try{canvas.setPointerCapture(e.pointerId);}catch(_){}stop();
      const p=local(e);ptrs.set(e.pointerId,p);
      if(ptrs.size===1){drag={g:pick(p.x,p.y),last:p,t:performance.now(),v:[],moved:false};tapStart={...p,t:performance.now()};}
      else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};pinch.g=pick(pinch.mid.x,pinch.mid.y);drag=null;tapStart=null;overshoot=0;}
    });
    canvas.addEventListener('pointermove',e=>{
      const p=local(e);
      if(!ptrs.has(e.pointerId)){if(e.pointerType==='mouse')setHover(hit(p.x,p.y,12));return;}
      ptrs.set(e.pointerId,p);
      if(pinch&&ptrs.size>=2){
        const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const want=1+(view.dist-1)*pinch.d/Math.max(1,d),min=minDist();
        if(want<min&&d>pinch.d)overshoot+=Math.log(d/pinch.d);
        view.dist=clampDist(want);pinch.d=d;
        if(pinch.g)anchor(pinch.g,mid.x,mid.y);else{applyCamera();pinch.g=pick(mid.x,mid.y);}
        pinch.mid=mid;invalidate();return;
      }
      if(!drag)return;
      if(!drag.moved&&Math.hypot(p.x-tapStart.x,p.y-tapStart.y)<5)return;
      drag.moved=true;setHover(null);canvas.classList.add('is-grabbing');
      const before={lat:view.lat,lon:view.lon},now=performance.now();
      if(drag.g&&anchor(drag.g,p.x,p.y)){/* le point saisi reste sous le doigt */}
      else{const k=kpp()/KM/RAD;view.lon-=(p.x-drag.last.x)*k/Math.max(.2,Math.cos(view.lat*RAD));view.lat+=(p.y-drag.last.y)*k;applyCamera();drag.g=pick(p.x,p.y);}
      const dt=Math.max(1,now-drag.t);drag.v.push({t:now,lat:(view.lat-before.lat)/dt,lon:M.wrapLon(view.lon-before.lon)/dt});drag.v=drag.v.filter(x=>now-x.t<90);
      drag.last=p;drag.t=now;invalidate();
    });
    const end=e=>{
      if(!ptrs.has(e.pointerId))return;
      const p=local(e);ptrs.delete(e.pointerId);
      canvas.classList.remove('is-grabbing');
      if(pinch){if(ptrs.size<2){pinch=null;moved('zoom');if(overshoot>.35)dive('pinch');overshoot=0;
        if(ptrs.size===1){const q=[...ptrs.values()][0];drag={g:pick(q.x,q.y),last:q,t:performance.now(),v:[],moved:true};}}return;}
      if(!drag)return;
      const d=drag;drag=null;
      if(!d.moved&&tapStart&&e.type==='pointerup'&&performance.now()-tapStart.t<600){tap(p,e.pointerType);return;}
      const recent=d.v.filter(x=>performance.now()-x.t<80);
      if(recent.length&&!reduced()&&performance.now()-d.t<60){
        let vLat=recent.reduce((s,x)=>s+x.lat,0)/recent.length,vLon=recent.reduce((s,x)=>s+x.lon,0)/recent.length;
        /* Lancer plafonné à ~2,5 px/ms : un geste vif fait glisser la Terre sans la faire tourner de moitié. */
        const cap=2.5*kpp()/KM/RAD,sp=Math.hypot(vLat,vLon*Math.cos(view.lat*RAD));
        if(sp>cap){vLat*=cap/sp;vLon*=cap/sp;}
        if(sp>cap*.08){inertia={vLat,vLon,t:performance.now()};invalidate();return;}
      }
      moved('drag');
    };
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!ptrs.size)setHover(null);});
    let lastTap=null;
    function tap(p,type){
      const id=hit(p.x,p.y,type==='mouse'?12:22);
      const now=performance.now();
      if(!id&&lastTap&&now-lastTap.t<320&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){lastTap=null;if(zoomAt(2.2,p.x,p.y,true))dive('dbl');return;}
      lastTap={...p,t:now};
      if(id){opts.onSelect?.(id);return;}
      if(!pick(p.x,p.y)&&!selected)return;
      opts.onEmpty?.();
    }
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();stop();
      const p=local(e),unit=e.deltaMode===1?16:e.deltaMode===2?H:1;
      const dy=e.deltaY*unit*(e.ctrlKey?.012:.0022);
      const f=Math.exp(-Math.max(-1.2,Math.min(1.2,dy)));
      const past=zoomAt(f,p.x,p.y,false);
      if(past&&f>1)overshoot+=Math.log(f);
      clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{if(overshoot>.3)dive('wheel');overshoot=0;},140);
    },{passive:false});
    canvas.addEventListener('keydown',e=>{
      const step=kpp()*Math.min(W,H)*.18/KM/RAD;let used=true;
      if(e.key==='ArrowLeft')flyTo({lon:view.lon-step/Math.max(.2,Math.cos(view.lat*RAD)),lat:view.lat},{duration:220});
      else if(e.key==='ArrowRight')flyTo({lon:view.lon+step/Math.max(.2,Math.cos(view.lat*RAD)),lat:view.lat},{duration:220});
      else if(e.key==='ArrowUp')flyTo({lat:view.lat+step,lon:view.lon},{duration:220});
      else if(e.key==='ArrowDown')flyTo({lat:view.lat-step,lon:view.lon},{duration:220});
      else if(e.key==='+'||e.key==='=')zoomIn();
      else if(e.key==='-'||e.key==='_')zoomOut();
      else used=false;
      if(used){e.preventDefault();e.stopPropagation();}
    });
    function zoomIn(){if(view.dist<=minDist()+1e-4){dive('button');return;}zoomAt(1.8,null,null,true);}
    function zoomOut(){zoomAt(1/1.8,null,null,true);}
    function dive(reason){opts.onDive?.({...getView(),reason});}

    /* ---------- Taille, textures, cycle de vie ---------- */
    function resize(){
      const r=host.getBoundingClientRect();W=Math.max(1,Math.round(r.width));H=Math.max(1,Math.round(r.height));
      const dpr=Math.min(devicePixelRatio||1,dprCap);
      renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);
      dotU.uDpr.value=dpr;starMat.uniforms.uDpr.value=dpr;
      /* Le cadre change (tiroir, rotation, plein écran) : on garde l’échelle à l’écran, ou la vue d’ensemble. */
      view.dist=clampDist(overviewOn?maxDist():keepKpp?distForKpp(keepKpp):view.dist);keepKpp=kpp();invalidate();scheduleLabels();
    }
    const ro=new ResizeObserver(()=>resize());ro.observe(host);
    function loadTexture(url){
      return new Promise((resolve,reject)=>new T.TextureLoader().load(url,resolve,undefined,reject)).then(tex=>{
        tex.colorSpace=T.NoColorSpace;tex.wrapS=T.RepeatWrapping;tex.wrapT=T.ClampToEdgeWrapping;
        tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
        return tex;
      });
    }
    const base=new URL('assets/globe/',document.baseURI).href;
    const first=await loadTexture(base+'earth-4k.webp');
    uniEarth.uMap.value=first;uniEarth.uTex.value.set(first.image.width,first.image.height);
    renderer.initTexture?.(first);
    earth.visible=true;
    /* Ordinateur : la texture 8K arrive ensuite, pour des côtes plus fines au zoom. */
    const conn=navigator.connection;let dead=false;
    if(!mobile&&maxTex>=8192&&!conn?.saveData)setTimeout(()=>loadTexture(base+'earth-8k.webp').then(tex=>{if(dead)return;const old=uniEarth.uMap.value;uniEarth.uMap.value=tex;uniEarth.uTex.value.set(tex.image.width,tex.image.height);old?.dispose();invalidate();}).catch(()=>{}),1200);
    resize();applyCamera();
    revealStart=reduced()?0:performance.now();if(!revealStart)uniEarth.uReveal.value=1;
    invalidate();

    const api={
      setSpots,setSelected,
      setUser(pos){user=pos?{v:M.vec(pos.lat,pos.lon)}:null;userEl.hidden=!user;invalidate();},
      setPadding(p){pad={...pad,...p};view.dist=clampDist(view.dist);invalidate();scheduleLabels();},
      view:getView,flyTo,zoomIn,zoomOut,resize,
      jumpTo(t){stop();if(t.lat!=null)view.lat=t.lat;if(t.lon!=null)view.lon=t.lon;view.dist=clampDist(t.dist||distForWidth(t.widthKm||widthKm()));invalidate();moved('jump');},
      /* Cadre un ensemble de points (km de marge compris) ; renvoie la largeur visée. */
      fit(points,{animate=true,minWidthKm=0,maxWidthKm=Infinity,done}={}){
        const c=M.cap(points);if(!c)return null;
        const km=Math.max(minWidthKm,Math.min(maxWidthKm,c.radius*KM*2.5+300));
        if(animate)flyTo({lat:c.lat,lon:c.lon,widthKm:km},{done});else{api.jumpTo({lat:c.lat,lon:c.lon,widthKm:km});done?.();}
        return km;
      },
      overview(center,animate){const t={lat:center?.lat??30,lon:center?.lon??-8,dist:maxDist()};const done=()=>{overviewOn=true;};if(animate)flyTo(t,{done});else{api.jumpTo(t);done();}},
      widthForDist:widthKm,get minWidthKm(){return widthKm(minDist());},get maxWidthKm(){return widthKm(maxDist());},
      /* Spots de la zone visible : face à la caméra et dans le cadre libre. */
      visibleIds(){
        applyCamera();const out=[];
        for(const s of spots){const p=project(s.v);if(p.front&&p.facing>.08&&p.x>=pad.left&&p.x<=W-pad.right&&p.y>=pad.top&&p.y<=H-pad.bottom)out.push(s.id);}
        return out;
      },
      project(lat,lon){applyCamera();return project(M.vec(lat,lon));},
      /* Spots affichés seuls (hors groupes), avec leur position à l’écran. */
      singles(){applyCamera();return spots.filter(s=>!hideAttr[byId.get(s.id).i]).map(s=>({id:s.id,...project(s.v)})).filter(p=>p.front&&p.facing>.12);},
      setActive(on){active=!!on;canvas.style.visibility=on?'':'hidden';layer.style.visibility=on?'':'hidden';if(on){resize();invalidate();}else{stop();cancelAnimationFrame(raf);raf=0;}},
      focus(){canvas.focus({preventScroll:true});},
      canvas,layer,
      destroy(){dead=true;active=false;cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();canvas.remove();layer.remove();}
    };
    return api;
  }
  window.OceanGlobe={create,supported,glow,GLOW,load:loadThree};
})();
