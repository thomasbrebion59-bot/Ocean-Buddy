/* Globe 3D des spots — la vraie Terre, vue de l’espace.
   Images de la NASA (domaine public) : Blue Marble pour la surface, relief GEBCO, nuages Blue Marble,
   lumières des villes Black Marble 2016, et le vrai ciel (NASA SVS Deep Star Maps 2020) placé selon
   l’heure sidérale du moment. Le shader calcule l’éclairage du soleil, la diffusion de l’atmosphère
   (bleu au limbe, rougeoiement au terminateur), le reflet du soleil sur l’océan et les ombres des nuages.
   Deux éclairages : « studio » (le soleil suit la caméra, la face visible reste éclairée) et « réel »
   (jour et nuit en direct, position réelle du soleil). three.js n’est chargé qu’à l’ouverture de la carte.
   Au-delà du zoom « région », la carte détaillée prend le relais (ocean-map.js). */
(() => {
  'use strict';
  const M=window.OceanMapModel;
  const KM=M.EARTH_KM,RAD=Math.PI/180,FOV=30;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Couleurs des activités, éclaircies pour le fond sombre. */
  const GLOW={surf:'#5C88FF',bodyboard:'#81B2FF',baignade:'#39CDE8',paddle:'#36CDAF',kayak:'#A1D763',snorkeling:'#FFC34D',plongee:'#6889D6',kitesurf:'#FF8068',windsurf:'#BD8AFF'};
  const glow=id=>GLOW[id]||'#5C88FF';

  /* Version des fichiers du globe (moteur, textures, données), recalculée par scripts/version-assets.py. */
  const ASSET_V='fdf7fbfd7291';
  const asset=path=>new URL(path+'?v='+ASSET_V,document.baseURI).href;
  const NEEDED=['WebGLRenderer','ShaderMaterial','InstancedBufferGeometry','Line','OrthographicCamera','CanvasTexture'];
  let threeLoading=null;
  function loadThree(){
    /* Adresse versionnée (scripts/version-assets.py) ; si un vieux moteur resté en cache n’a pas toutes
       les classes attendues, on le recharge directement depuis le réseau au lieu d’abandonner le globe. */
    if(!threeLoading)threeLoading=(async()=>{
      const url=asset('vendor/three/three.globe.min.js');
      let T=await import(url);
      if(!NEEDED.every(k=>k in T))T=await import(url+'&r='+Date.now());
      if(!NEEDED.every(k=>k in T))throw Error('three incomplet');
      return T;
    })().catch(e=>{threeLoading=null;throw e;});
    return threeLoading;
  }
  function supported(){try{const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch(_){return false;}}

  /* ---------- Soleil et ciel réels ----------
     Formules de l’Astronomical Almanac (précision ≈ 0,01°), largement suffisantes pour l’éclairage. */
  function sky(date=new Date()){
    const d=(date.getTime()-Date.UTC(2000,0,1,12))/864e5;
    const g=(357.529+.98560028*d)*RAD,q=280.459+.98564736*d;
    const L=(q+1.915*Math.sin(g)+.02*Math.sin(2*g))*RAD,e=(23.439-3.6e-7*d)*RAD;
    const ra=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L))/RAD,dec=Math.asin(Math.sin(e)*Math.sin(L))/RAD;
    const gmst=((280.46061837+360.98564736629*d)%360+360)%360;
    return {gmst,sun:{lat:dec,lon:M.wrapLon(ra-gmst)}};
  }

  /* Repère local et coordonnées équirectangulaires, communs aux shaders de la Terre et des nuages. */
  const GEO=`
    const float PI=3.141592653589793;
    const vec3 BR=vec3(.175,.41,1.);
    /* Lumière du soleil après la traversée de l’atmosphère : elle rougit près du terminateur. */
    vec3 sunTint(float mu){return exp(-BR*.09*min(1./(max(mu,0.)+.025),40.));}
    /* Coordonnées de texture et dérivées sans couture à ±180° (méthode de Tarini). */
    void geo(vec3 n,out vec2 uv,out vec2 dx,out vec2 dy){
      float u=atan(n.x,n.z)/(2.*PI)+.5,v=asin(clamp(n.y,-1.,1.))/PI+.5,u2=fract(u+.5);
      dx=vec2(dFdx(u),dFdx(v));dy=vec2(dFdy(u),dFdy(v));
      float dx2=dFdx(u2),dy2=dFdy(u2);
      if(abs(dx2)+abs(dy2)<abs(dx.x)+abs(dy.x)){dx.x=dx2;dy.x=dy2;}
      uv=vec2(u,v);
    }`;
  const EARTH_V=`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const EARTH_F=`
    uniform sampler2D uDay,uNorm,uSky;uniform vec3 uSun,uCam;
    uniform float uCloudOff,uCloudA,uRelief,uNight,uExpo,uSpec,uReveal,uStudio;
    uniform sampler2D uSst;uniform float uSstA,uSstM;
    varying vec3 vPos;
    ${GEO}
    /* Température de l’eau : échelle « chaleur » graduée, du bleu froid au rouge corail. */
    vec3 heat(float t){
      vec3 c=vec3(.141,.188,.431);
      c=mix(c,vec3(.165,.373,.769),smoothstep(-2.,8.,t));
      c=mix(c,vec3(.118,.643,.784),smoothstep(8.,15.,t));
      c=mix(c,vec3(.31,.812,.624),smoothstep(15.,20.,t));
      c=mix(c,vec3(.914,.839,.29),smoothstep(20.,24.,t));
      c=mix(c,vec3(.953,.604,.239),smoothstep(24.,27.,t));
      c=mix(c,vec3(.847,.275,.227),smoothstep(27.,30.,t));
      c=mix(c,vec3(.639,.141,.227),smoothstep(30.,32.,t));
      return c;
    }
    vec2 sstUV(float m,vec2 uv){return vec2((mod(m,4.)+uv.x)/4.,(2.-floor(m/4.)+uv.y)/3.);}
    void main(){
      vec3 n=normalize(vPos);vec2 uv,dx,dy;geo(n,uv,dx,dy);
      vec3 albedo=textureGrad(uDay,uv,dx,dy).rgb;
      vec3 nm=textureGrad(uNorm,uv,dx,dy).rgb;
      vec3 sk=textureGrad(uSky,uv,dx,dy).rgb;
      float water=smoothstep(.25,.75,nm.b);
      /* Relief : pente est / nord de la texture, dans le repère local du point. */
      float lon=(uv.x-.5)*2.*PI,lat=(uv.y-.5)*PI;
      vec3 east=vec3(cos(lon),0.,-sin(lon)),north=vec3(-sin(lat)*sin(lon),cos(lat),-sin(lat)*cos(lon));
      vec2 s=(nm.rg-.5)*2.*uRelief*(1.-water);
      vec3 N=normalize(n*sqrt(max(1.-dot(s,s),.05))+east*s.x+north*s.y);
      vec3 V=normalize(uCam-vPos),L=uSun;
      float mu=dot(n,L),ndv=max(dot(n,V),0.);
      /* Lumière « studio » : soleil blanc venant de la caméra et lumière d’ambiance, aucune face de nuit. */
      vec3 sunC=mix(sunTint(mu),vec3(1.),uStudio);
      /* Ombre des nuages, décalée vers le soleil. */
      vec3 tl=L-n*mu;
      vec2 off=vec2(dot(tl,east)/max(cos(lat),.15)/(2.*PI),dot(tl,north)/PI)*.006;
      float cs=textureGrad(uSky,uv+vec2(uCloudOff,0.)+off,dx,dy).g*uCloudA;
      float diff=mix(max(dot(N,L),0.)*smoothstep(-.03,.06,mu),.45+.62*max(dot(N,L),0.),uStudio);
      vec3 col=albedo*sunC*diff*(1.-.5*cs)*uExpo;
      /* Océan : reflet du soleil (GGX) et du ciel (Fresnel). */
      vec3 H=normalize(L+V);
      float nh=max(dot(n,H),0.),vh=max(dot(V,H),0.);
      float F=.02+.98*pow(1.-vh,5.),a2=.07,dd=nh*nh*(a2-1.)+1.;
      float glint=a2/(PI*dd*dd)*F*max(mu,0.)/max(4.*ndv,.25);
      col+=water*uSpec*glint*sunC*(1.-.85*cs);
      col+=water*(.02+.98*pow(1.-ndv,5.))*vec3(.3,.5,.95)*.3*smoothstep(-.05,.3,mu);
      /* Nuit : lumières des villes, voilées par les nuages. */
      col+=vec3(1.,.64,.33)*sk.r*sk.r*(1.-smoothstep(-.16,.05,mu))*(1.-.7*cs)*uNight*(1.-uStudio);
      if(uSstA>.001){
        float mm=mod(uSstM,12.),m0=floor(mm),f=mm-m0,m1=mod(m0+1.,12.);
        vec2 tuv=vec2(clamp(uv.x,.0008,.9992),clamp(uv.y,.0015,.9985));
        float s0=texture2D(uSst,sstUV(m0,tuv)).r,s1=texture2D(uSst,sstUV(m1,tuv)).r;
        float ok=step(s0,.99)*step(s1,.99)*smoothstep(.3,.7,water);
        float t=mix(s0,s1,f)*255./254.*34.-2.;
        vec3 hc=heat(t);
        /* Isothermes tous les 2 °C, plus marquée à 24 °C (eau « chaude »). */
        float d=abs(fract(t*.5+.5)-.5)*2.,w=max(fwidth(t)*.9,.02);
        hc*=1.-.32*(1.-smoothstep(0.,w,d));
        hc=mix(hc,vec3(1.),.75*(1.-smoothstep(0.,w*1.4,abs(t-24.))));
        float lit=mix(max(dot(n,L),0.)*smoothstep(-.03,.06,mu),.7+.38*max(dot(n,L),0.),uStudio);
        col=mix(col,hc*lit*1.05,uSstA*ok*.94);
      }
      /* Atmosphère vue du dessus : extinction et diffusion (bleu, surtout vers le limbe). */
      vec3 ext=exp(-BR*mix(.1,.055,uStudio)/(ndv+.06));
      col=col*ext+(1.-ext)*vec3(.3,.55,1.)*sunC*mix(smoothstep(-.25,.35,mu),1.,uStudio)*mix(1.05,.8,uStudio);
      /* Continents plus francs en lumière studio : un peu plus de saturation et de contraste. */
      float lum=dot(col,vec3(.2126,.7152,.0722));
      col=mix(col,max(mix(vec3(lum),col,1.22)*1.06-.006,0.),uStudio);
      col=mix(vec3(.004,.012,.035),col,uReveal);
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
    }`;
  const CLOUD_F=`
    uniform sampler2D uSky;uniform vec3 uSun,uCam;uniform float uCloudOff,uCloudA,uExpo;
    varying vec3 vPos;
    ${GEO}
    void main(){
      vec3 n=normalize(vPos);vec2 uv,dx,dy;geo(n,uv,dx,dy);
      float c=textureGrad(uSky,uv+vec2(uCloudOff,0.),dx,dy).g*uCloudA;
      if(c<.004)discard;
      vec3 V=normalize(uCam-vPos);
      float mu=dot(n,uSun),ndv=max(dot(n,V),0.);
      vec3 sunC=sunTint(mu);
      float lit=smoothstep(-.1,.25,mu);
      vec3 col=sunC*(.18+.82*max(mu,0.))*lit*uExpo*1.02+vec3(.012,.016,.03)*(1.-lit);
      vec3 ext=exp(-BR*.05/(ndv+.06));
      col=col*ext+(1.-ext)*vec3(.3,.55,1.)*sunC*lit;
      gl_FragColor=vec4(col*c,c);
      #include <colorspace_fragment>
    }`;
  const ATMO_V=`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
  const ATMO_F=`
    uniform vec3 uCam,uSun;uniform float uTop,uI;varying vec3 vW;
    const vec3 BR=vec3(.175,.41,1.);
    vec3 sunTint(float mu){return exp(-BR*.09*min(1./(max(mu,0.)+.025),40.));}
    void main(){
      vec3 d=normalize(vW-uCam);
      vec3 pc=uCam+d*max(-dot(uCam,d),0.);
      float b=length(pc);
      if(b<1.)discard;
      /* Densité au point le plus bas du rayon : décroissance exponentielle avec l’altitude. */
      float h=clamp((b-1.)/(uTop-1.),0.,1.);
      float dens=exp(-h*3.4)*(1.-smoothstep(.75,1.,h));
      float mu=dot(pc/b,uSun),ct=dot(d,uSun);
      float lit=smoothstep(-.32,.22,mu);
      float phase=.75*(1.+ct*ct)+.5*pow(max(ct,0.),10.);
      vec3 c=mix(vec3(.55,.78,1.),vec3(.2,.45,1.),smoothstep(0.,.45,h))*dens*lit*sunTint(mu+.08)*phase*uI;
      gl_FragColor=vec4(c,0.);
      #include <colorspace_fragment>
    }`;
  const SKY_V=`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const SKY_F=`
    uniform sampler2D uMw;uniform float uI;varying vec3 vD;
    void main(){
      vec3 d=normalize(vD);
      float ra=atan(d.x,d.z),dec=asin(clamp(d.y,-1.,1.));
      vec3 c=texture2D(uMw,vec2(fract(.5-ra/6.2831853),.5+dec/3.1415927)).rgb;
      gl_FragColor=vec4(c*uI,0.);
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
  /* Étoiles réelles : taille et éclat selon la magnitude, couleur selon la température. */
  const STAR_V=`attribute float size,glow;attribute vec3 color;varying vec3 vC;varying float vG;uniform float uDpr;
    void main(){vC=color;vG=glow;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*uDpr;}`;
  const STAR_F=`varying vec3 vC;varying float vG;uniform float uI;
    void main(){float r=length(gl_PointCoord*2.-1.);float a=exp(-r*r*4.5)+vG*exp(-r*r*2.2)*.18;if(a<.01)discard;gl_FragColor=vec4(vC*a*uI,0.);
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
    /* Écrans haute densité : l’anticrénelage matériel n’apporte rien de visible et coûte cher sur téléphone. */
    const renderer=new T.WebGLRenderer({canvas,antialias:!(mobile&&(devicePixelRatio||1)>=2),alpha:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x000000,0);renderer.autoClear=false;
    renderer.outputColorSpace=T.SRGBColorSpace;
    const maxTex=renderer.capabilities.maxTextureSize;
    /* Pleine définition de l’écran (jusqu’à ×3). Pendant un mouvement continu seulement, si les images
       ralentissent, la définition baisse par paliers (jamais sous 60 %) ; elle revient au repos. */
    const dprFull=Math.min(devicePixelRatio||1,3);let dprNow=dprFull,lastFrame=0,slow=0,prevAgain=false,sharpTimer=0;
    const scene=new T.Scene();
    const camera=new T.PerspectiveCamera(FOV,1,.01,200);
    const col=h=>new T.Color(h);
    /* Éclairage : « studio » (le soleil suit la caméra, en haut à gauche) ou « réel » (soleil du moment). */
    /* Nuages masqués par défaut : les continents restent bien visibles (réglage dans les commandes du globe). */
    let lighting=opts.lighting==='live'?'live':'studio',cloudsOn=opts.clouds===true;
    const sunDir=new T.Vector3(),studioSun=new T.Vector3(-.38,.36,.85).normalize();
    const uniEarth={
      uDay:{value:null},uNorm:{value:null},uSky:{value:null},uSun:{value:sunDir},uCam:{value:new T.Vector3()},
      uCloudOff:{value:0},uCloudA:{value:cloudsOn?.9:0},uRelief:{value:1},uNight:{value:1.25},uExpo:{value:1.32},uSpec:{value:3.2},uReveal:{value:0},uStudio:{value:lighting==='studio'?1:0},
      uSst:{value:null},uSstA:{value:0},uSstM:{value:new Date().getMonth()}
    };
    const seg=mobile?128:192;
    const earth=new T.Mesh(new T.SphereGeometry(1,seg,seg/2),new T.ShaderMaterial({uniforms:uniEarth,vertexShader:EARTH_V,fragmentShader:EARTH_F}));
    earth.visible=false;scene.add(earth);
    /* Nuages : une sphère à peine plus haute (léger relief quand la Terre tourne), qui dérive lentement. */
    const cloudU={uSky:{value:null},uSun:{value:sunDir},uCam:uniEarth.uCam,uCloudOff:uniEarth.uCloudOff,uCloudA:uniEarth.uCloudA,uExpo:uniEarth.uExpo};
    const clouds=new T.Mesh(new T.SphereGeometry(1.0045,seg,seg/2),new T.ShaderMaterial({uniforms:cloudU,vertexShader:EARTH_V,fragmentShader:CLOUD_F,transparent:true,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor}));
    clouds.visible=false;clouds.renderOrder=1;scene.add(clouds);
    const atmoU={uCam:uniEarth.uCam,uSun:{value:sunDir},uTop:{value:1.03},uI:{value:.95}};
    const atmo=new T.Mesh(new T.SphereGeometry(1,96,48),new T.ShaderMaterial({uniforms:atmoU,vertexShader:ATMO_V,fragmentShader:ATMO_F,side:T.BackSide,transparent:true,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor}));
    atmo.renderOrder=2;scene.add(atmo);
    /* Ciel : voie lactée et étoiles réelles, tournant avec l’heure sidérale (repère équatorial). */
    const heavens=new T.Scene(),skyCam=new T.PerspectiveCamera(FOV,1,.5,200);
    const skyU={uMw:{value:null},uI:{value:0}};
    const skyMesh=new T.Mesh(new T.SphereGeometry(90,48,24),new T.ShaderMaterial({uniforms:skyU,vertexShader:SKY_V,fragmentShader:SKY_F,side:T.BackSide,transparent:true,depthWrite:false,depthTest:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneFactor}));
    const starU={uDpr:{value:1},uI:{value:0}};
    const starMat=new T.ShaderMaterial({uniforms:starU,vertexShader:STAR_V,fragmentShader:STAR_F,transparent:true,depthWrite:false,depthTest:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneFactor});
    heavens.add(skyMesh);
    fetch(asset('assets/globe/stars.bin')).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(buf=>{
      const v=new DataView(buf),n=Math.min(buf.byteLength/6|0,mobile?6000:9000);
      const pos=new Float32Array(n*3),size=new Float32Array(n),glow=new Float32Array(n),c=new Float32Array(n*3);
      const cold=col('#A9C4FF'),warm=col('#FFD2A1'),k=new T.Color();
      for(let i=0;i<n;i++){
        const ra=v.getUint16(i*6,true)/65535*360,dec=v.getUint16(i*6+2,true)/65535*180-90,b=v.getUint8(i*6+4)/255,t=v.getUint8(i*6+5)/255;
        const p=M.vec(dec,ra);pos.set([p[0]*85,p[1]*85,p[2]*85],i*3);
        size[i]=1.1+2.6*b*b*b;glow[i]=b>.8?(b-.8)/.2*.6:0;
        k.copy(cold).lerp(warm,t).lerp(col('#ffffff'),.35).multiplyScalar(.22+.95*Math.pow(b,1.5));c.set([k.r,k.g,k.b],i*3);
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('size',new T.BufferAttribute(size,1));g.setAttribute('glow',new T.BufferAttribute(glow,1));g.setAttribute('color',new T.BufferAttribute(c,3));
      const stars=new T.Points(g,starMat);stars.frustumCulled=false;heavens.add(stars);invalidate();
    }).catch(()=>{});
    /* Frontières : très discrètes, visibles à l’échelle d’un continent. */
    const borderMat=new T.LineBasicMaterial({color:col('#E8F1FF'),transparent:true,opacity:0,depthWrite:false});
    let borders=null;
    fetch(asset('assets/globe/borders.json')).then(r=>r.ok?r.json():[]).then(lines=>{
      const out=[];const push=(lat,lon)=>{const v=M.vec(lat,lon);out.push(v[0]*1.0007,v[1]*1.0007,v[2]*1.0007);};
      for(const l of lines)for(let i=2;i<l.length;i+=2){
        const a={lon:l[i-2],lat:l[i-1]},b={lon:l[i],lat:l[i+1]},steps=Math.max(1,Math.ceil(Math.hypot(b.lon-a.lon,b.lat-a.lat)/.8));
        for(let s=0;s<steps;s++){const f0=s/steps,f1=(s+1)/steps;push(a.lat+(b.lat-a.lat)*f0,a.lon+(b.lon-a.lon)*f0);push(a.lat+(b.lat-a.lat)*f1,a.lon+(b.lon-a.lon)*f1);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));
      borders=new T.LineSegments(g,borderMat);borders.renderOrder=1;scene.add(borders);invalidate();
    }).catch(()=>{});

    /* Vol : un fin arc citron suit le grand cercle parcouru, puis s’efface en 300 ms. */
    const ARC_N=96,arcPos=new Float32Array(ARC_N*3),arcGeo=new T.BufferGeometry();arcGeo.setAttribute('position',new T.BufferAttribute(arcPos,3));
    const arcMat=new T.LineBasicMaterial({color:col('#D7F75B'),transparent:true,opacity:0,depthTest:true,depthWrite:false});
    const arcLine=new T.Line(arcGeo,arcMat);arcLine.renderOrder=2;arcLine.frustumCulled=false;arcLine.visible=false;scene.add(arcLine);
    let arcFade=0;
    function setArc(a,b,ang){
      const p=M.vec(a.lat,a.lon),q=M.vec(b.lat,b.lon),sn=Math.sin(ang);
      for(let i=0;i<ARC_N;i++){const t=i/(ARC_N-1),x=Math.sin((1-t)*ang)/sn,y=Math.sin(t*ang)/sn,h=1.004+Math.sin(Math.PI*t)*Math.min(.08,ang*.05);
        arcPos.set([(p[0]*x+q[0]*y)*h,(p[1]*x+q[1]*y)*h,(p[2]*x+q[2]*y)*h],i*3);}
      arcGeo.attributes.position.needsUpdate=true;arcGeo.setDrawRange(0,0);arcLine.visible=true;arcMat.opacity=.85;arcFade=0;
    }

    /* ---------- Spots ---------- */
    const dotU={uCam:{value:new T.Vector3()},uHalo:{value:12},uCore:{value:4},uRing:{value:0},uHaloA:{value:.18},uDpr:{value:1},uWhite:{value:col('#ffffff')}};
    const dotMat=new T.ShaderMaterial({uniforms:dotU,vertexShader:DOT_V,fragmentShader:DOT_F,transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor});
    let dots=null,spots=[],byId=new Map(),levels=[],level=-1,hideAttr=null;

    function setSpots(list){
      spots=list.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)).map(s=>({...s,v:M.vec(s.lat,s.lon)}));
      byId=new Map(spots.map((s,i)=>[s.id,{...s,i}]));
      if(dots){scene.remove(dots);dots.geometry.dispose();}
      const n=spots.length,pos=new Float32Array(n*3),c=new Float32Array(n*3);hideAttr=new Float32Array(n);
      spots.forEach((s,i)=>{pos.set([s.v[0]*1.001,s.v[1]*1.001,s.v[2]*1.001],i*3);const k=col(glow(s.act));c.set([k.r,k.g,k.b],i*3);});
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(c,3));g.setAttribute('hide',new T.BufferAttribute(hideAttr,1));
      dots=new T.Points(g,dotMat);dots.renderOrder=3;dots.frustumCulled=false;scene.add(dots);
      levels=M.clusterLevels(spots);level=-1;refreshCountries();
      badges=[];shownBadges=[];labels=[];hotBadge=null;
      if(selected&&!byId.has(selected))setSelected(null);
      if(hovered&&!byId.has(hovered))setHover(null);
      invalidate(true);
    }

    /* ---------- Caméra : centre (lat, lon) + distance au centre de la Terre (rayons) ---------- */
    const view={lat:30,lon:-8,dist:4.2};let overviewOn=false,keepKpp=0,touched=false,spin=0;
    let W=1,H=1,pad={top:0,bottom:0,left:0,right:0},anim=null,inertia=null,dirty=true,raf=0,active=true,lastMove=0,restTimer=0,revealStart=0,approach=1,lastTick=0,ambTimer=0,lastTouch=performance.now();
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
      /* Arrivée depuis l’espace : la caméra part de plus loin (approach > 1) et rejoint la vue. */
      const v=M.vec(view.lat,view.lon+spin),d=1+(view.dist-1)*approach;
      camera.position.set(v[0]*d,v[1]*d,v[2]*d);
      camera.up.set(0,1,0);camera.lookAt(0,0,0);
      camera.near=Math.max(.002,(d-1)*.25);camera.far=d+95;
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
    /* Retour sur l’écran ou dans l’app : la vie reprend. */
    function wake(){lastTouch=performance.now();invalidate();}
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
    const easeInOut=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
    function frame(now){
      raf=0;if(!active)return;
      /* Résolution adaptative : si les images s’enchaînent sous ~45 i/s, on baisse d’un cran (jamais sous 1). */
      if(prevAgain&&lastFrame){slow=slow*.9+(now-lastFrame>21?.1:0);const floor=Math.max(1,dprFull*.6);if(slow>.6&&dprNow>floor){dprNow=Math.max(floor,dprNow-.25);slow=0;resize();}}
      lastFrame=now;
      let again=false;
      if(anim){
        const t=Math.min(1,(now-anim.t0)/anim.ms),e=easeInOut(t);
        const q=slerp(anim.a,anim.b,e);view.lat=q.lat;view.lon=q.lon;
        view.dist=Math.exp(Math.log(anim.d0)+(Math.log(anim.d1)-Math.log(anim.d0))*e)+anim.bump*Math.sin(Math.PI*e);
        if(anim.arc)arcGeo.setDrawRange(0,Math.max(2,Math.round(ARC_N*Math.min(1,e*1.15))));
        if(t>=1){const done=anim.done,arc=anim.arc;anim=null;if(arc)arcFade=now;moved('fly');done?.();}else again=true;
        dirty=true;
      }else if(inertia){
        const dt=Math.min(40,now-inertia.t);inertia.t=now;
        view.lat+=inertia.vLat*dt;view.lon+=inertia.vLon*dt;
        const k=Math.pow(.99,dt);inertia.vLat*=k;inertia.vLon*=k;
        if(Math.hypot(inertia.vLat,inertia.vLon)<.02*kpp()/KM/RAD){inertia=null;moved('inertia');}else again=true;
        dirty=true;
      }
      if(arcFade){const t=(now-arcFade)/300;arcMat.opacity=.85*Math.max(0,1-t);if(t>=1){arcFade=0;arcLine.visible=false;}else again=true;dirty=true;}
      if(ripStart){if(now-ripStart<1800){again=true;dirty=true;}else{ripStart=0;dirty=true;}}
      /* Ouverture : la Terre arrive de l’espace en tournant, le ciel s’allume. */
      if(revealStart){const t=touched?1:Math.min(1,(now-revealStart)/2600),e=1-Math.pow(1-t,3.2);
        uniEarth.uReveal.value=Math.min(1,t*2.4);approach=1+2.6*(1-e);spin=touched?0:48*(1-e);
        skyU.uI.value=0;starU.uI.value=.6*Math.min(1,t*1.4);
        if(t<1)again=true;else{revealStart=0;spin=0;approach=1;}dirty=true;}
      /* Vie au repos : les nuages dérivent ; tant qu’on n’a pas touché le globe, il tourne doucement. */
      const dt=lastTick?Math.min(120,now-lastTick):16;lastTick=now;let ambient=false;
      /* Pas d’animation de fond si le globe est caché (autre écran) ou au repos depuis une minute : batterie préservée. */
      const shown=canvas.clientWidth>0&&!document.hidden,awake=now-lastTouch<60000;
      if(active&&shown&&awake&&!reduced()){
        if(cloudsOn){uniEarth.uCloudOff.value=(uniEarth.uCloudOff.value+dt*4.5e-7)%1;ambient=true;}
        if(!touched&&!anim&&!inertia&&!revealStart&&widthKm()>9000){view.lon+=dt*.0016;ambient=true;}
        if(ambient)dirty=true;
      }
      if(dirty){dirty=false;draw();}
      prevAgain=again||emblemAnim;
      if(!prevAgain&&dprNow<dprFull){clearTimeout(sharpTimer);sharpTimer=setTimeout(()=>{if(!raf){dprNow=dprFull;slow=0;resize();}},350);}
      if(emblemAnim){dirty=true;again=true;}
      if(again)raf=requestAnimationFrame(frame);
      /* Animation de fond : environ 30 images par seconde suffisent pour des mouvements aussi lents. */
      else if(ambient){clearTimeout(ambTimer);ambTimer=setTimeout(()=>{if(!raf&&active)raf=requestAnimationFrame(frame);},33);}
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
      uniEarth.uCam.value.copy(cp);dotU.uCam.value.copy(cp);
      /* Soleil : réel (position du moment) ou « studio » (en haut à gauche de la caméra). */
      const now=sky();
      if(lighting==='live'){const v=M.vec(now.sun.lat,now.sun.lon);sunDir.set(v[0],v[1],v[2]);}
      else sunDir.copy(studioSun).applyQuaternion(camera.quaternion);
      heavens.rotation.y=-now.gmst*RAD;
      skyCam.quaternion.copy(camera.quaternion);skyCam.projectionMatrix.copy(camera.projectionMatrix);skyCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);skyCam.updateMatrixWorld();
      const k=kpp(),w=widthKm();
      /* Échelle espace → continent → région : points, liserés et halo s’adaptent en continu. */
      const s=Math.max(0,Math.min(1,(Math.log(8000)-Math.log(Math.max(w,1)))/(Math.log(8000)-Math.log(1500))));
      const far=Math.max(0,Math.min(1,(Math.log(Math.max(w,1))-Math.log(8000))/Math.log(2)));
      dotU.uCore.value=4+2*(1-far)+2*s;dotU.uHalo.value=12+4*(1-far)+4*s+2;dotU.uRing.value=s>.6?1:0;dotU.uHaloA.value=mobile?.07:.16;
      /* Nuages : pleins vus de l’espace, ils s’effacent en approchant des côtes pour laisser voir les spots. */
      uniEarth.uCloudA.value=cloudsOn?.88*Math.max(0,Math.min(1,(Math.log(w)-Math.log(1900))/Math.log(3.2))):0;
      /* Atmosphère : environ 3 % du rayon, jamais moins d’une dizaine de pixels à l’écran. */
      const top=1+Math.max(.028,(mobile?11:15)*k*approach/KM);atmoU.uTop.value=top;atmo.scale.setScalar(top);
      /* Relief un peu plus marqué en approchant (montagnes, falaises). */
      uniEarth.uRelief.value=.85+.5*s;
      borderMat.opacity=.16*Math.max(0,Math.min(1,(Math.log(9000)-Math.log(w))/Math.log(2)));
      /* Regroupements : échelle la plus proche du zoom courant ; repères placés pour cette image. */
      if(levels.length){const lv=M.levelFor(k);if(lv!==level)applyLevel(lv);}
      layoutOverlay();
      const rip=ripStart?(performance.now()-ripStart)/900:-1;pinU.uRip.value=rip>=0&&rip<2?rip%1:-1;
      renderer.clear();renderer.render(heavens,skyCam);renderer.render(scene,camera);renderer.render(overlay,ortho);
    }

    /* ---------- Repères (groupes, étiquettes, spot choisi, position) ----------
       Dessinés en WebGL dans la même image que la Terre, avec des positions calculées à chaque
       image : ils restent collés à la planète pendant les gestes, sans le moindre décalage. */
    const overlay=new T.Scene(),ortho=new T.OrthographicCamera(0,1,0,1,-1,1);
    const quad=()=>{const g=new T.InstancedBufferGeometry();g.setIndex([0,1,2,0,2,3]);g.setAttribute('position',new T.BufferAttribute(new Float32Array([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0]),3));return g;};
    const inst=(g,name,size,count)=>{const a=new T.InstancedBufferAttribute(new Float32Array(count*size),size);a.setUsage(T.DynamicDrawUsage);g.setAttribute(name,a);return a.array;};
    const premult={side:T.DoubleSide,transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor};
    const bodyFont=(getComputedStyle(document.body).fontFamily||'system-ui');
    try{await Promise.race([document.fonts?.load(`700 12px ${bodyFont}`),new Promise(r=>setTimeout(r,800))]);}catch(_){}
    const TS=Math.min(3,Math.ceil(devicePixelRatio||1));
    /* Chiffres : un atlas de 10 glyphes, les nombres sont composés dans le shader. */
    const digitAdv=(()=>{const c=document.createElement('canvas').getContext('2d');c.font=`700 ${12*TS}px ${bodyFont}`;return [...'0123456789'].map(d=>c.measureText(d).width/TS);})();
    const digitW=Math.ceil(Math.max(...digitAdv))+2;
    const digitTex=(()=>{
      const c=document.createElement('canvas');c.width=10*digitW*TS;c.height=16*TS;const x=c.getContext('2d');
      x.font=`700 ${12*TS}px ${bodyFont}`;x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';
      for(let d=0;d<10;d++)x.fillText(String(d),(d+.5)*digitW*TS,8.6*TS);
      const t=new T.CanvasTexture(c);t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;t.minFilter=T.LinearFilter;return t;
    })();
    /* Emblèmes des pays : médaillons culturels (atlas 16 × 8 de 128 px), sous les groupes de spots. */
    const MAXE=128,emblemGeo=quad();emblemGeo.instanceCount=0;
    const E={at:inst(emblemGeo,'aAt',2,MAXE),size:inst(emblemGeo,'aSize',1,MAXE),alpha:inst(emblemGeo,'aAlpha',1,MAXE),uv:inst(emblemGeo,'aCell',1,MAXE)};
    const emblemU={uTex:{value:null}};
    const emblemMesh=new T.Mesh(emblemGeo,new T.ShaderMaterial({...premult,uniforms:emblemU,
      vertexShader:`attribute vec2 aAt;attribute float aSize,aAlpha,aCell;varying vec2 vUv,vP;varying float vA,vS;
        void main(){float s=aSize*1.3;vP=position.xy*s;vS=aSize;vA=aAlpha;
          vec2 cell=vec2(mod(aCell,16.),floor(aCell/16.));vec2 q=vP/aSize+.5;
          vUv=vec2((cell.x+q.x)/16.,1.-(cell.y+q.y)/8.);
          gl_Position=projectionMatrix*vec4(aAt+vP,0.,1.);if(aAlpha<.01)gl_Position=vec4(2.,2.,2.,1.);}`,
      fragmentShader:`uniform sampler2D uTex;varying vec2 vUv,vP;varying float vA,vS;
        void main(){
          vec2 q=vP/vS+.5;vec4 c=vec4(0.);
          float rq=length(q-.5);if(rq<.5){c=texture2D(uTex,vUv);c*=1.-smoothstep(.46,.49,rq);}
          float r=length(vP+vec2(0.,-vS*.06))/(vS*.5);
          float sh=(1.-smoothstep(.8,1.25,r))*.35*(1.-c.a);
          gl_FragColor=vec4(c.rgb*c.a,c.a+sh)*vA;
          #include <colorspace_fragment>
        }`}));
    emblemMesh.frustumCulled=false;emblemMesh.renderOrder=0;overlay.add(emblemMesh);
    let countries=[],emblemsOn=[],emblemAnim=false;
    const eState=new Map();
    /* Emblèmes des pays : désactivés sur la Terre réaliste (opts.emblems pour les réactiver). */
    if(opts.emblems)new T.TextureLoader().load(asset('assets/globe/emblems.webp'),tex=>{tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.anisotropy=4;emblemU.uTex.value=tex;invalidate();});
    if(opts.emblems)fetch(asset('assets/globe/countries.json')).then(r=>r.ok?r.json():{}).then(d=>{countryData=d;refreshCountries();invalidate();}).catch(()=>{});
    let countryData={};
    function refreshCountries(){
      const n=new Map();for(const s of spots)if(s.country)n.set(s.country,(n.get(s.country)||0)+1);
      countries=[...n.entries()].filter(([k])=>countryData[k]?.e!=null).map(([k,c])=>{const d=countryData[k];return {name:k,n:c,e:d.e,v:M.vec(d.lat,d.lon)};}).sort((a,b)=>b.n-a.n);
    }
    const MAXB=320;
    const badgeGeo=quad();badgeGeo.instanceCount=0;
    const B={at:inst(badgeGeo,'aAt',2,MAXB),size:inst(badgeGeo,'aSize',1,MAXB),alpha:inst(badgeGeo,'aAlpha',1,MAXB),hot:inst(badgeGeo,'aHot',1,MAXB),
      c1:inst(badgeGeo,'aC1',3,MAXB),c2:inst(badgeGeo,'aC2',3,MAXB),c3:inst(badgeGeo,'aC3',3,MAXB),f:inst(badgeGeo,'aF',3,MAXB),num:inst(badgeGeo,'aNum',4,MAXB)};
    const badgeMat=new T.ShaderMaterial({...premult,uniforms:{uDigits:{value:digitTex},uDigitW:{value:digitW},uAdv:{value:digitAdv},uDisk:{value:col('#0B2D7A')},uHot:{value:col('#1F55E0')}},
      vertexShader:`attribute vec2 aAt;attribute float aSize,aAlpha,aHot;attribute vec3 aC1,aC2,aC3,aF;attribute vec4 aNum;
        varying vec2 vP;varying float vSize,vAlpha,vHot;varying vec3 vC1,vC2,vC3,vF;varying vec4 vNum;
        void main(){float s=aSize+12.;vP=position.xy*s;vSize=aSize;vAlpha=aAlpha;vHot=aHot;vC1=aC1;vC2=aC2;vC3=aC3;vF=aF;vNum=aNum;
          gl_Position=projectionMatrix*vec4(aAt+vP,0.,1.);if(aAlpha<.01)gl_Position=vec4(2.,2.,2.,1.);}`,
      fragmentShader:`uniform sampler2D uDigits;uniform float uDigitW,uAdv[10];uniform vec3 uDisk,uHot;
        varying vec2 vP;varying float vSize,vAlpha,vHot;varying vec3 vC1,vC2,vC3,vF;varying vec4 vNum;
        void main(){
          float R=vSize*.5,r=length(vP),aa=max(fwidth(r),.35);
          float disk=1.-smoothstep(R-aa,R,r),core=1.-smoothstep(R-2.-aa,R-2.,r);
          float shadow=(1.-smoothstep(R-1.,R+6.,r))*.35*(1.-disk);
          float a=fract(atan(vP.x,-vP.y)/6.2831853);
          vec3 ring=vec3(1.);float ra=.28;
          if(a<vF.x){ring=vC1;ra=1.;}else if(a<vF.y){ring=vC2;ra=1.;}else if(a<vF.z){ring=vC3;ra=1.;}
          float gap=.0045;
          if((vF.x<1.&&abs(a-vF.x)<gap)||(vF.y>vF.x&&vF.y<1.&&abs(a-vF.y)<gap)||(vF.z>vF.y&&vF.z<1.&&abs(a-vF.z)<gap)||a<gap)ra=0.;
          vec3 c=mix(uDisk,uHot,vHot);
          float edge=(1.-smoothstep(R-3.,R-2.,r))-(1.-smoothstep(R-3.-aa,R-3.,r));
          c=mix(c,vec3(1.),max(edge,0.)*.65);
          /* Nombre centré, chaque chiffre avec sa chasse réelle. */
          float a0=uAdv[int(vNum.y)],a1=vNum.x>1.5?uAdv[int(vNum.z)]:0.,a2=vNum.x>2.5?uAdv[int(vNum.w)]:0.;
          float x=vP.x+(a0+a1+a2)*.5,d=-1.,lx=0.;
          if(x>=0.&&x<a0){d=vNum.y;lx=x-a0*.5;}else if(x>=a0&&x<a0+a1){d=vNum.z;lx=x-a0-a1*.5;}else if(x>=a0+a1&&x<a0+a1+a2){d=vNum.w;lx=x-a0-a1-a2*.5;}
          if(d>=0.&&abs(vP.y)<8.){
            float t=texture2D(uDigits,vec2((d+.5+lx/uDigitW)/10.,.5-vP.y/16.)).a;
            c=mix(c,vec3(1.),t);
          }
          float alpha=core+(disk-core)*ra;
          vec3 rgb=c*core+ring*(disk-core)*ra;
          gl_FragColor=vec4(rgb*vAlpha,(alpha+shadow)*vAlpha);
          #include <colorspace_fragment>
        }`});
    const badgeMesh=new T.Mesh(badgeGeo,badgeMat);badgeMesh.frustumCulled=false;badgeMesh.renderOrder=1;overlay.add(badgeMesh);
    /* Étiquettes : un atlas de texte refait au repos (six au plus). */
    const MAXL=12,labelCanvas=document.createElement('canvas');labelCanvas.width=512*TS;labelCanvas.height=32*MAXL*TS;
    const labelTex=new T.CanvasTexture(labelCanvas);labelTex.colorSpace=T.SRGBColorSpace;labelTex.premultiplyAlpha=true;labelTex.generateMipmaps=false;labelTex.minFilter=T.LinearFilter;
    const labelGeo=quad();labelGeo.instanceCount=0;
    const L={at:inst(labelGeo,'aAt',2,MAXL),off:inst(labelGeo,'aOff',2,MAXL),sz:inst(labelGeo,'aSz',2,MAXL),uv:inst(labelGeo,'aUV',4,MAXL),alpha:inst(labelGeo,'aAlpha',1,MAXL)};
    const labelMesh=new T.Mesh(labelGeo,new T.ShaderMaterial({...premult,uniforms:{uTex:{value:labelTex}},
      vertexShader:`attribute vec2 aAt,aOff,aSz;attribute vec4 aUV;attribute float aAlpha;varying vec2 vUv;varying float vA;
        void main(){vUv=vec2(mix(aUV.x,aUV.z,position.x+.5),mix(aUV.w,aUV.y,position.y+.5));vA=aAlpha;gl_Position=projectionMatrix*vec4(aAt+aOff+position.xy*aSz,0.,1.);if(aAlpha<.01)gl_Position=vec4(2.,2.,2.,1.);}`,
      fragmentShader:`uniform sampler2D uTex;varying vec2 vUv;varying float vA;void main(){gl_FragColor=texture2D(uTex,vUv)*vA;
        #include <colorspace_fragment>
      }`}));
    labelMesh.frustumCulled=false;labelMesh.renderOrder=2;overlay.add(labelMesh);
    /* Spot choisi (cœur à sa couleur, anneau citron, onde à la sélection) et position de l’utilisateur. */
    const pinGeo=quad();pinGeo.instanceCount=2;
    const PN={at:inst(pinGeo,'aAt',2,2),type:inst(pinGeo,'aType',1,2),c:inst(pinGeo,'aC',3,2),alpha:inst(pinGeo,'aAlpha',1,2)};
    PN.type[1]=1;
    const pinU={uRip:{value:-1},uLime:{value:col('#D7F75B')},uUser:{value:col('#2F6BFF')}};
    const pinMesh=new T.Mesh(pinGeo,new T.ShaderMaterial({...premult,uniforms:pinU,
      vertexShader:`attribute vec2 aAt;attribute float aType,aAlpha;attribute vec3 aC;varying vec2 vP;varying float vT,vA;varying vec3 vC;
        void main(){vP=position.xy*64.;vT=aType;vA=aAlpha;vC=aC;gl_Position=projectionMatrix*vec4(aAt+vP,0.,1.);if(aAlpha<.01)gl_Position=vec4(2.,2.,2.,1.);}`,
      fragmentShader:`uniform float uRip;uniform vec3 uLime,uUser;varying vec2 vP;varying float vT,vA;varying vec3 vC;
        float ring(float r,float a,float b,float aa){return (1.-smoothstep(b-aa,b,r))*smoothstep(a-aa,a,r);}
        void main(){
          float r=length(vP),aa=max(fwidth(r),.35);vec3 c;float a;
          if(vT<.5){
            float core=1.-smoothstep(9.-aa,9.,r),lime=ring(r,9.,11.,aa),dark=ring(r,11.,12.,aa);
            float halo=(1.-smoothstep(11.,18.,r))*.16*(1.-core-lime-dark);
            c=vC*core+uLime*lime+uLime*halo;a=core+lime+dark*.5+halo;
            if(uRip>=0.){float rr=6.+16.*uRip;float w=ring(r,rr-.75,rr+.75,aa)*(1.-uRip)*.8;c+=uLime*w;a+=w;}
          }else{
            float white=1.-smoothstep(8.-aa,8.,r),blue=1.-smoothstep(5.-aa,5.,r),halo=(1.-smoothstep(8.,17.,r))*.3*(1.-white);
            c=vec3(1.)*(white-blue)+uUser*blue+uUser*halo;a=white+halo;
          }
          gl_FragColor=vec4(c*vA,min(a,1.)*vA);
          #include <colorspace_fragment>
        }`}));
    pinMesh.frustumCulled=false;pinMesh.renderOrder=3;overlay.add(pinMesh);

    let badges=[],labels=[],selected=null,hovered=null,hotBadge=null,user=null,ripStart=0;
    const hovEl=document.createElement('div');hovEl.className='og-hover';hovEl.hidden=true;hovEl.innerHTML='<i></i><b></b>';
    const tipEl=document.createElement('div');tipEl.className='og-country';tipEl.hidden=true;
    layer.append(hovEl,tipEl);
    function countryTip(em,p){
      tipEl.hidden=!em;if(!em)return;
      tipEl.textContent=`${em.c.name} · ${em.c.n>1?em.c.n+' spots':'1 spot'}`;
      tipEl.style.transform=`translate(${em.x.toFixed(1)}px,${(em.y-em.r-8).toFixed(1)}px)`;
    }

    function applyLevel(lv){
      level=lv;const groups=levels[lv]||[];hideAttr.fill(0);
      const prev=new Map(badges.map(b=>[b.key,b]));
      badges=[];
      for(const g of groups){
        if(g.n<3)continue;
        for(const id of g.ids){const s=byId.get(id);if(s)hideAttr[s.i]=1;}
        const acts=new Map();for(const id of g.ids){const a=byId.get(id)?.act;if(a)acts.set(a,(acts.get(a)||0)+1);}
        const top=[...acts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);
        const colors=top.map(([a])=>col(glow(a)));let f=0;const fr=top.map(([,n])=>(f+=n/g.n));
        while(fr.length<3){fr.push(fr[fr.length-1]??0);colors.push(colors[colors.length-1]??col('#ffffff'));}
        const key=g.key+':'+g.n;
        badges.push({key,g,n:g.n,v:M.vec(g.lat,g.lon),colors,fr,host:prev.get(key)?.host||null});
      }
      badges.sort((a,b)=>b.n-a.n||(a.key<b.key?-1:1));
      dots.geometry.attributes.hide.needsUpdate=true;
      scheduleLabels();
    }
    const sizeFor=n=>Math.round(Math.min(38,28+Math.log2(n/3+1)*3.4));
    /* Chaque image : projection, fusion des badges qui se touchent (avec un léger effet de seuil
       pour éviter le clignotement), écart autour du spot choisi, puis écriture des attributs. */
    function layoutOverlay(){
      const gap=mobile?10:6,sp=selected&&byId.has(selected)?project(byId.get(selected).v):null;
      const shown=[];
      for(const b of badges){
        const p=project(b.v);b.p=p;b.total=b.n;b.members=null;b.absorbed=false;
        b.on=p.front&&p.facing>=.12&&p.x>-40&&p.x<W+40&&p.y>-40&&p.y<H+40;
      }
      for(const b of badges){
        if(!b.on)continue;
        let host=null;
        for(const o of shown){const lim=(sizeFor(o.total)+sizeFor(b.n))/2+gap+(b.host===o.key?6:0);if(Math.hypot(o.p.x-b.p.x,o.p.y-b.p.y)<lim){host=o;break;}}
        b.host=host?.key||null;
        if(host){b.absorbed=true;host.total+=b.n;(host.members||(host.members=[host])).push(b);}else shown.push(b);
      }
      let i=0;
      for(const b of shown){
        if(i>=MAXB)break;
        const sz=sizeFor(b.total);let x=b.p.x,y=b.p.y;
        /* 8 px libres autour du spot choisi : c’est le badge qui s’écarte, jamais le spot. */
        if(sp&&sp.front){const dx=x-sp.x,dy=y-sp.y,d=Math.hypot(dx,dy),min=sz/2+12+8;if(d<min){if(d>.5){x=sp.x+dx*min/d;y=sp.y+dy*min/d;}else y=sp.y-min;}}
        b.sx=x;b.sy=y;b.sz=sz;
        B.at[i*2]=x;B.at[i*2+1]=y;B.size[i]=sz;B.alpha[i]=1;B.hot[i]=hotBadge===b.key?1:0;
        b.colors.forEach((c,k)=>{const arr=[B.c1,B.c2,B.c3][k];arr[i*3]=c.r;arr[i*3+1]=c.g;arr[i*3+2]=c.b;});
        B.f[i*3]=b.fr[0];B.f[i*3+1]=b.fr[1];B.f[i*3+2]=b.fr[2];
        const digits=String(Math.min(999,b.total));B.num[i*4]=digits.length;for(let k=0;k<3;k++)B.num[i*4+1+k]=+(digits[k]||0);
        i++;
      }
      badgeGeo.instanceCount=i;
      for(const k in B)badgeGeo.attributes['a'+{at:'At',size:'Size',alpha:'Alpha',hot:'Hot',c1:'C1',c2:'C2',c3:'C3',f:'F',num:'Num'}[k]].needsUpdate=true;
      shownBadges=shown.slice(0,i);
      /* Emblèmes : 18 px vus de l’espace (les 8 pays les plus riches en spots), 26 px par continent, 40 px en région ;
         jamais sur un groupe, une étiquette ou le spot choisi. Apparition et disparition en fondu. */
      {
        const w=widthKm(),size=w>8000?22:w>1500?28:40,cap=!opts.emblems||w>8500?0:MAXE,taken=shownBadges.map(b=>[b.sx,b.sy,b.sz/2+4]);
        if(sp)taken.push([sp.x,sp.y,20]);
        const now=performance.now(),dt=Math.min(64,now-(layoutT||now));layoutT=now;let j=0,busy=false;emblemsOn=[];
        for(const c of countries){
          const p=project(c.v);let on=j<cap&&p.front&&p.facing>.3&&p.x>pad.left-20&&p.x<W-pad.right+20&&p.y>pad.top-20&&p.y<H-pad.bottom+20;
          if(on&&taken.some(([x,y,r])=>Math.hypot(x-p.x,y-p.y)<r+size/2))on=false;
          if(on&&labels.some((l,k)=>{if(!L.alpha[k]||!l.box)return false;const ax=L.at[k*2],ay=L.at[k*2+1],h=size/2+3;return p.x>ax+l.box[0]-h&&p.x<ax+l.box[2]+h&&p.y>ay+l.box[1]-h&&p.y<ay+l.box[3]+h;}))on=false;
          const st=eState.get(c.name)||{a:0,pop:0};eState.set(c.name,st);
          const target=on?1:0;st.a+=(target-st.a)*Math.min(1,dt/110);if(Math.abs(st.a-target)<.02)st.a=target;else busy=true;
          if(st.pop){const t=(now-st.pop)/550;if(t>=1)st.pop=0;else busy=true;}
          if(on){taken.push([p.x,p.y,size/2+6]);j++;}
          if(st.a<=0||j>MAXE)continue;
          const k=emblemsOn.length;if(k>=MAXE)continue;
          const pop=st.pop?1+.12*Math.sin(Math.PI*Math.min(1,(now-st.pop)/550)):1;
          E.at[k*2]=p.x;E.at[k*2+1]=p.y;E.size[k]=size*(.85+.15*st.a)*pop;E.alpha[k]=st.a;E.uv[k]=c.e;
          emblemsOn.push({c,x:p.x,y:p.y,r:size/2});
        }
        emblemGeo.instanceCount=emblemsOn.length;['aAt','aSize','aAlpha','aCell'].forEach(n=>emblemGeo.attributes[n].needsUpdate=true);
        emblemAnim=busy;
      }
      /* Étiquettes : suivent leur spot à chaque image. */
      labels.forEach((l,k)=>{const s=byId.get(l.id);const p=s&&project(s.v);const on=p&&p.front&&p.facing>=.12&&!hideAttr[s.i]&&l.id!==hovered;
        L.at[k*2]=p?p.x:0;L.at[k*2+1]=p?p.y:0;L.alpha[k]=on?1:0;});
      labelGeo.instanceCount=labels.length;['aAt','aAlpha','aOff','aSz','aUV'].forEach(n=>labelGeo.attributes[n].needsUpdate=true);
      /* Spot choisi et position. */
      if(sp){PN.at[0]=sp.x;PN.at[1]=sp.y;PN.alpha[0]=sp.front&&sp.facing>=.05?1:0;const c=col(glow(byId.get(selected).act));PN.c[0]=c.r;PN.c[1]=c.g;PN.c[2]=c.b;}else PN.alpha[0]=0;
      if(user){const p=project(user.v);PN.at[2]=p.x;PN.at[3]=p.y;PN.alpha[1]=p.front&&p.facing>=.05?1:0;}else PN.alpha[1]=0;
      ['aAt','aAlpha','aC','aType'].forEach(n=>pinGeo.attributes[n].needsUpdate=true);
      if(hovered&&byId.has(hovered)){const p=project(byId.get(hovered).v);hovEl.style.visibility=p.front&&!anim&&!inertia&&!drag?'':'hidden';hovEl.style.transform=`translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;}
    }
    let shownBadges=[],layoutT=0;
    const emblemAt=(x,y)=>emblemsOn.find(e=>e.c&&Math.hypot(e.x-x,e.y-y)<Math.max(e.r,mobile?20:0)&&eState.get(e.c.name)?.a>.5);
    function openCluster(g){
      const pts=g.ids.map(id=>byId.get(id)).filter(Boolean);
      const c=M.cap(pts);if(!c)return;
      const cur=widthKm(),fit=Math.max(c.radius*KM*2.9,1);
      /* On zoome au moins assez pour que le groupe s’ouvre. */
      const target=Math.min(cur/2.4,fit);
      if(target<(opts.minWidthKm||600)){flyTo({lat:c.lat,lon:c.lon,widthKm:opts.minWidthKm||600},{done:()=>opts.onDive?.({lat:c.lat,lon:c.lon,kmPerPx:Math.max(target,40)/minSide(),reason:'cluster'})});return;}
      flyTo({lat:c.lat,lon:c.lon,widthKm:target});
    }
    const badgeAt=(x,y)=>shownBadges.find(b=>Math.hypot(b.sx-x,b.sy-y)<b.sz/2+(mobile?8:3));
    const unionOf=b=>({ids:(b.members||[b]).flatMap(m=>m.g.ids)});

    /* ---------- Étiquettes, sélection, survol ---------- */
    function scheduleLabels(){clearTimeout(restTimer);restTimer=setTimeout(()=>{computeLabels();invalidate();},120);}
    function computeLabels(){
      applyCamera();layoutOverlay();
      const w=widthKm(),max=w<1500?6:w<2600?3:0;
      const chosen=[];
      if(max&&levels.length){
        const cx=pad.left+(W-pad.left-pad.right)/2,cy=pad.top+(H-pad.top-pad.bottom)/2;
        const boxes=shownBadges.map(b=>{const r=b.sz/2+2;return [b.sx-r,b.sy-r,b.sx+r,b.sy+r];});
        if(selected&&byId.has(selected)){const p=project(byId.get(selected).v);boxes.push([p.x-14,p.y-14,p.x+14,p.y+14]);}
        const cands=[];
        for(const s of spots){if(hideAttr[byId.get(s.id).i]||s.id===selected)continue;const p=project(s.v);if(!p.front||p.facing<.2||p.x<pad.left+8||p.x>W-pad.right-8||p.y<pad.top+8||p.y>H-pad.bottom-8)continue;cands.push({s,p,d:Math.hypot(p.x-cx,p.y-cy)});}
        cands.sort((a,b)=>a.d-b.d);
        /* Une étiquette ne cache jamais le point d’un autre spot. */
        for(const {p} of cands)boxes.push([p.x-6,p.y-6,p.x+6,p.y+6]);
        const ctx=labelCanvas.getContext('2d');ctx.font=`600 ${12*TS}px ${bodyFont}`;
        for(const {s,p} of cands){
          if(chosen.length>=max)break;
          const tw=Math.min(170,Math.ceil(ctx.measureText(s.name).width/TS)+16);
          const opts2=[[p.x+9,p.y-12,p.x+9+tw,p.y+12,1],[p.x-9-tw,p.y-12,p.x-9,p.y+12,-1]];
          const box=opts2.find(b=>b[0]>pad.left&&b[2]<W-pad.right&&!boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]));
          if(!box)continue;boxes.push(box);chosen.push({id:s.id,side:box[4],w:tw});
        }
      }
      drawLabels(chosen);
    }
    function drawLabels(chosen){
      const ctx=labelCanvas.getContext('2d'),cw=labelCanvas.width,ch=labelCanvas.height;
      ctx.clearRect(0,0,cw,ch);ctx.font=`600 ${12*TS}px ${bodyFont}`;ctx.textBaseline='middle';
      labels=chosen.slice(0,MAXL);
      labels.forEach((l,k)=>{
        const y=k*32*TS,w=l.w*TS,h=24*TS;
        ctx.fillStyle='rgba(7,27,50,.94)';ctx.beginPath();ctx.roundRect?ctx.roundRect(0,y,w,h,8*TS):ctx.rect(0,y,w,h);ctx.fill();
        ctx.fillStyle='#fff';ctx.save();ctx.beginPath();ctx.rect(8*TS,y,w-16*TS,h);ctx.clip();
        let text=byId.get(l.id).name;
        while(text.length>1&&ctx.measureText(text).width>w-16*TS)text=text.slice(0,-2)+'…';
        ctx.fillText(text,8*TS,y+h/2+TS);ctx.restore();
        L.off[k*2]=l.side*(9+l.w/2);L.off[k*2+1]=0;L.sz[k*2]=l.w;L.sz[k*2+1]=24;
        L.uv[k*4]=0;L.uv[k*4+1]=1-(y+h)/ch;L.uv[k*4+2]=w/cw;L.uv[k*4+3]=1-y/ch;
        l.box=[l.side>0?9:-9-l.w,-12,l.side>0?9+l.w:-9,12];
      });
      labelTex.needsUpdate=true;
    }
    function setSelected(id){
      selected=id&&byId.has(id)?id:null;
      if(selected){if(hovered===selected)setHover(null);if(!reduced()){ripStart=performance.now();}}
      invalidate();scheduleLabels();
    }
    function setHover(id){
      if(id===hovered)return;hovered=id&&id!==selected?id:null;hovEl.hidden=!hovered;
      if(hovered){const s=byId.get(hovered);hovEl.style.setProperty('--c',glow(s.act));hovEl.querySelector('b').textContent=s.name;}
      invalidate();
    }
    /* Spot visible le plus proche d’un pixel (zone tactile de 44 px). */
    function hit(x,y,r){
      let best=null,bd=r;
      for(const s of spots){if(hideAttr[byId.get(s.id).i])continue;const p=project(s.v);if(!p.front)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=s.id;}}
      return best;
    }
    const labelAt=(x,y)=>labels.find((l,k)=>{if(!L.alpha[k])return false;const ax=L.at[k*2],ay=L.at[k*2+1],b=l.box;return x>=ax+b[0]&&x<=ax+b[2]&&y>=ay+b[1]&&y<=ay+b[3];});

    /* ---------- Mouvements ---------- */
    function moved(reason){lastMove=performance.now();keepKpp=kpp();if(reason!=='overview')overviewOn=false;scheduleLabels();opts.onView?.(getView(),reason);}
    function getView(){return {lat:view.lat,lon:view.lon,widthKm:widthKm(),kmPerPx:kpp(),dist:view.dist};}
    function stop(){anim=null;inertia=null;}
    function flyTo(target,{duration,done}={}){
      stop();lastTouch=performance.now();
      const d1=clampDist(target.dist||distForWidth(target.widthKm||widthKm()));
      const a={lat:view.lat,lon:view.lon},b={lat:target.lat??view.lat,lon:target.lon??view.lon};
      const ang=M.arc(a,b),ms=reduced()?0:duration??Math.min(1600,600+ang/RAD*9+Math.abs(Math.log(d1/view.dist))*260);
      if(!ms){view.lat=b.lat;view.lon=b.lon;view.dist=d1;invalidate();moved('fly');done?.();return;}
      /* Long trajet : la caméra prend de la hauteur au milieu du vol. */
      const bump=Math.max(0,Math.min(1.5,ang*.9)-(Math.max(view.dist,d1)-1)*.6);
      const arc=ang>6*RAD&&!reduced();if(arc)setArc(a,b,ang);
      anim={a,b,d0:view.dist,d1,t0:performance.now(),ms,bump,done,arc};invalidate();
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
      lastTouch=performance.now();
      if(e.button>0)return;
      touched=true;spin=0;
      try{canvas.setPointerCapture(e.pointerId);}catch(_){}stop();
      const p=local(e);ptrs.set(e.pointerId,p);
      if(ptrs.size===1){drag={g:pick(p.x,p.y),last:p,t:performance.now(),v:[],moved:false};tapStart={...p,t:performance.now()};}
      else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};pinch.g=pick(pinch.mid.x,pinch.mid.y);drag=null;tapStart=null;overshoot=0;}
    });
    canvas.addEventListener('pointermove',e=>{
      const p=local(e);
      if(!ptrs.has(e.pointerId)){
        if(e.pointerType==='mouse'){
          const b=badgeAt(p.x,p.y),hot=b?.key||null;if(hot!==hotBadge){hotBadge=hot;invalidate();}
          const id=b?null:hit(p.x,p.y,12),em=!b&&!id?emblemAt(p.x,p.y):null;setHover(id);countryTip(em,p);
          canvas.style.cursor=b||hovered||em||labelAt(p.x,p.y)?'pointer':'';
        }
        return;
      }
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
    canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!ptrs.size){setHover(null);tipEl.hidden=true;if(hotBadge){hotBadge=null;invalidate();}}});
    let lastTap=null;
    function tap(p,type){
      const b=badgeAt(p.x,p.y);if(b){lastTap=null;openCluster(unionOf(b));return;}
      const l=labelAt(p.x,p.y);if(l){opts.onSelect?.(l.id);return;}
      const em=emblemAt(p.x,p.y);if(em){lastTap=null;const st=eState.get(em.c.name);if(st&&!reduced())st.pop=performance.now();invalidate();opts.onCountry?.(em.c.name);return;}
      const id=hit(p.x,p.y,type==='mouse'?12:22);
      const now=performance.now();
      if(!id&&lastTap&&now-lastTap.t<320&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){lastTap=null;if(zoomAt(2.2,p.x,p.y,true))dive('dbl');return;}
      lastTap={...p,t:now};
      if(id){opts.onSelect?.(id);return;}
      if(!pick(p.x,p.y)&&!selected)return;
      opts.onEmpty?.();
    }
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();stop();touched=true;spin=0;lastTouch=performance.now();
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
      const dpr=Math.min(devicePixelRatio||1,dprNow);
      renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);
      ortho.right=W;ortho.bottom=H;ortho.updateProjectionMatrix();
      dotU.uDpr.value=dpr;starU.uDpr.value=dpr;
      /* Le cadre change (tiroir, rotation, plein écran) : on garde l’échelle à l’écran, ou la vue d’ensemble. */
      view.dist=clampDist(overviewOn?maxDist():keepKpp?distForKpp(keepKpp):view.dist);keepKpp=kpp();invalidate();scheduleLabels();
    }
    const ro=new ResizeObserver(()=>{lastTouch=performance.now();resize();});ro.observe(host);
    function loadTexture(url,srgb){
      return new Promise((resolve,reject)=>new T.TextureLoader().load(url,resolve,undefined,reject)).then(tex=>{
        tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;tex.wrapS=T.RepeatWrapping;tex.wrapT=T.ClampToEdgeWrapping;
        tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
        return tex;
      });
    }
    /* Surface (Blue Marble) et relief ; nuages et lumières de la nuit seulement quand on les affiche. */
    const conn=navigator.connection;let dead=false;
    const [day,norm]=await Promise.all([
      loadTexture(asset('assets/globe/earth-day-4k.webp'),true),
      loadTexture(asset('assets/globe/earth-normal-4k.webp'))
    ]);
    uniEarth.uDay.value=day;uniEarth.uNorm.value=norm;
    [day,norm].forEach(t=>renderer.initTexture?.(t));
    let skyLoading=null;
    function needSky(){
      if(skyLoading||!(cloudsOn||lighting==='live'))return;
      skyLoading=loadTexture(asset('assets/globe/earth-sky-4k.webp')).then(t=>{if(dead)return;uniEarth.uSky.value=t;cloudU.uSky.value=t;invalidate();}).catch(()=>{skyLoading=null;});
    }
    needSky();
    earth.visible=true;clouds.visible=cloudsOn;
    /* Ordinateur : la surface en 8K arrive ensuite, pour des côtes plus fines au zoom. */
    /* Surface 8K pour un zoom net (téléphones récents compris : textures 16K prises en charge). */
    if((!mobile&&maxTex>=8192||maxTex>=16384)&&!conn?.saveData)setTimeout(()=>loadTexture(asset('assets/globe/earth-day-8k.webp'),true).then(tex=>{if(dead)return;const old=uniEarth.uDay.value;uniEarth.uDay.value=tex;old?.dispose();invalidate();}).catch(()=>{}),1200);
    resize();applyCamera();
    revealStart=reduced()?0:performance.now();if(!revealStart){uniEarth.uReveal.value=1;starU.uI.value=.6;}
    invalidate();

    let sstOn=false;const sstAnim={};
    function sstTween(k,to){
      const from=uniEarth[k].value;if(reduced()||Math.abs(to-from)<.001){uniEarth[k].value=to;invalidate();return;}
      const t0=performance.now(),dur=k==='uSstA'?650:520;cancelAnimationFrame(sstAnim[k]);
      const step=now=>{const p=Math.min(1,(now-t0)/dur),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;uniEarth[k].value=from+(to-from)*e;invalidate();if(p<1)sstAnim[k]=requestAnimationFrame(step);};
      sstAnim[k]=requestAnimationFrame(step);
    }
    const api={
      setSpots,setSelected,
      setUser(pos){user=pos?{v:M.vec(pos.lat,pos.lon)}:null;invalidate();},
      setPadding(p){pad={...pad,...p};view.dist=clampDist(view.dist);invalidate();scheduleLabels();},
      view:getView,flyTo,zoomIn,zoomOut,resize,
      /* Éclairage « studio » ou « live » (jour et nuit réels) ; nuages visibles ou non. */
      setLighting(m){lighting=m==='live'?'live':'studio';uniEarth.uStudio.value=lighting==='studio'?1:0;needSky();invalidate();return lighting;},
      get lighting(){return lighting;},
      setClouds(on){cloudsOn=!!on;clouds.visible=cloudsOn;needSky();invalidate();return cloudsOn;},
      /* Couche « température de l’eau » (normales mensuelles NOAA) : apparition en fondu, mois interpolés. */
      setSst(on,month){
        if(on&&!uniEarth.uSst.value){
          new T.TextureLoader().load(asset('assets/globe/sst-atlas.webp?v=1'),tex=>{tex.generateMipmaps=false;tex.minFilter=T.LinearFilter;tex.magFilter=T.LinearFilter;tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;uniEarth.uSst.value=tex;sstTween('uSstA',sstOn?1:0);invalidate();});
        }
        sstOn=!!on;if(month!=null)api.setSstMonth(month);
        if(uniEarth.uSst.value)sstTween('uSstA',sstOn?1:0);
        return sstOn;
      },
      setSstMonth(m){let cur=uniEarth.uSstM.value%12,to=((m%12)+12)%12;if(to-cur>6)cur+=12;else if(cur-to>6)cur-=12;uniEarth.uSstM.value=cur;sstTween('uSstM',to);},
      get sst(){return sstOn;},
      get clouds(){return cloudsOn;},
      /* Point de la Terre où le soleil est au zénith en ce moment. */
      sun(){return sky().sun;},
      wake,
      jumpTo(t){stop();lastTouch=performance.now();if(t.lat!=null)view.lat=t.lat;if(t.lon!=null)view.lon=t.lon;view.dist=clampDist(t.dist||distForWidth(t.widthKm||widthKm()));invalidate();moved('jump');},
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
      /* Badges et étiquettes affichés, avec leur position à l’écran. */
      markers(){return {emblems:emblemsOn.map(e=>({name:e.c.name,x:e.x,y:e.y,r:e.r})),badges:shownBadges.map(b=>({n:b.total,x:b.sx,y:b.sy,size:b.sz})),labels:labels.map((l,k)=>({id:l.id,x:L.at[k*2]+L.off[k*2],y:L.at[k*2+1],visible:!!L.alpha[k]}))};},
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
