/* Motion d’Ocean Buddy (motion.css pour les courbes et les durées). Chargé après tous les écrans : enveloppe
   window.openSpot, window.go et quelques fermetures sans les réécrire, et n’ajoute aucune boucle permanente.
   - la photo de la carte touchée grandit vers le héros de la fiche, et revient à sa carte au retour ;
   - l’indicateur de la barre d’onglets et celui des onglets de la fiche coulissent ;
   - quand un repli s’ouvre ou se ferme, ce qui suit glisse à sa nouvelle place au lieu de sauter ;
   - réglages, quiz et fenêtres sortent en douceur ;
   - l’icône de l’onglet choisi saute ; à la première arrivée sur Défis, Jeu ou Communauté, les blocs entrent l’un
     après l’autre (une fois par session ; l’accueil, Explorer, Voyages, le Profil et la fiche ont déjà leur entrée,
     dans leur propre module).
   Passe du 23 novembre 2026 (« la motion des interactions manque ») :
   - retour au toucher joué ici : enfoncement franc (0,96 ; 0,975 pour une grande surface) et relâché en ressort, même
     pour un toucher très bref ; rien quand le doigt fait défiler ; onde depuis le point de contact sur les cartes,
     les lignes de spots et les tuiles ;
   - changement d’état visible : la pastille ou la puce qui change rebondit ; le cœur éclate en particules ; un défi
     validé aussi ;
   - une vue ouverte dans le même écran (passeport complet, voyage ouvert) arrive par le côté (OceanMotion.enter).
   Tout est en transform, opacity ou scale (Web Animations, présentes depuis iOS 13.1) : pas de View Transitions, pas
   de linear() obligatoire. Aucune mesure de mise en page au toucher : la place d’une surface est donnée par un
   IntersectionObserver, à l’image suivante, sans forcer de mise en page. En mouvement réduit, rien de tout cela ne
   bouge (les fondus courts viennent de design.css). Rien ici ne touche à l’accueil ni à la barre d’onglets avant la
   levée du rideau, et aucune transition ne retient un toucher : les calques animés laissent passer les pointeurs. */
(function(){
  'use strict';
  const root=document.documentElement;
  const M=window.OceanMotion=window.OceanMotion||{};
  M.instant=false;M.zoom=false;
  /* Courbes partagées (mêmes valeurs que --ob-spring / --ob-pop / --ob-snap / --ob-ease-out de motion.css), lues par
     go() et par les autres modules. spring : ressort léger (dépasse de 2,5 %) ; pop : ressort vif (10 %). */
  const LINEAR='linear(0,.046,.154,.291,.434,.569,.687,.785,.862,.921,.963,.992,1.01,1.02,1.025,1.025,1.023,1.02,1.017,1.013,1.01,1.007,1.005,1.003,1.002,1.001,1)';
  const POP='linear(0,.06,.204,.387,.574,.743,.881,.984,1.053,1.091,1.106,1.104,1.091,1.072,1.052,1.033,1.017,1.005,.996,.991,.989,.989,.99,.992,.994,.996,.998,.999,1,1.001,1)';
  let linearOK=false;try{linearOK=!!(window.CSS&&CSS.supports&&CSS.supports('transition-timing-function',LINEAR));}catch(_){}
  M.spring=linearOK?LINEAR:'cubic-bezier(.34,1.2,.64,1)';
  M.pop=linearOK?POP:'cubic-bezier(.34,1.56,.64,1)';
  /* Ressort amorti, départ vif (--ob-snap) : 21 points régulièrement espacés. */
  const SNAP=[0,.076,.228,.391,.538,.658,.752,.823,.875,.913,.940,.959,.972,.981,.988,.992,.995,.997,.998,.999,1];
  M.snap=linearOK?'linear('+SNAP.join(',')+')':'cubic-bezier(.2,.9,.25,1)';
  M.easeOut='cubic-bezier(.22,.8,.3,1)';
  const ZOOM_MS=380,TAB_MS=300,FOLD_MS=340,SP=String.fromCharCode(32);
  /* Durées des interactions (ms), toutes entre 120 et 380 : appui, relâché, onde, récompense, page poussée. */
  const PRESS_MS=120,RELEASE_MS=320,INK_MS=380,POP_MS=360,PAGE_MS=340;
  const canAnimate=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';
  /* Hauteur de l’écran, lue une fois puis à chaque redimensionnement : go() s’en sert pour faire reculer un écran
     autour du milieu de ce qu’on regarde, sans rien mesurer pendant la transition. */
  M.vh=window.innerHeight||800;
  window.addEventListener('resize',()=>{M.vh=window.innerHeight||M.vh;},{passive:true});

  function reduced(){
    return document.body.classList.contains('reduce-motion')||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  M.reduced=reduced;
  function blocked(){
    return root.classList.contains('ob-booting')||!!window.OceanTransition?.covered||!!document.querySelector('.act-tr');
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  const px=v=>parseFloat(v)||0;
  function inView(r,min){
    const w=Math.min(r.right,innerWidth)-Math.max(r.left,0),h=Math.min(r.bottom,innerHeight)-Math.max(r.top,0);
    return r.width>8&&r.height>8&&w>0&&h>0&&w*h>=(min||.25)*r.width*r.height;
  }
  const box=r=>({l:r.left,t:r.top,w:r.width,h:r.height});
  function objPos(el){
    const p=getComputedStyle(el).objectPosition.split(' ').map(v=>v.endsWith('%')?parseFloat(v)/100:.5);
    return [isFinite(p[0])?p[0]:.5,isFinite(p[1])?p[1]:.5];
  }
  /* Rayons visibles d’une image : les siens, sinon ceux du premier parent qui la rogne. */
  function radii(el){
    for(let n=el,i=0;n&&n.nodeType===1&&i<4;n=n.parentElement,i++){
      const cs=getComputedStyle(n),r=[px(cs.borderTopLeftRadius),px(cs.borderTopRightRadius),px(cs.borderBottomRightRadius),px(cs.borderBottomLeftRadius)];
      if(r.some(Boolean)&&(n===el||cs.overflow!=='visible'))return r;
    }
    return [0,0,0,0];
  }

  /* ================= Photo partagée : carte <-> héros de la fiche ================= */
  /* Dernière carte touchée (pointerdown), valable 1,5 s : son image et l’endroit où elle se trouvait. */
  let tap=null;
  const CARD='[data-spot],[data-spot-id],[data-cult-spot],.field-nearby-card';
  document.addEventListener('pointerdown',e=>{
    tap=null;
    const t=e.target;if(!t||!t.closest)return;
    const card=t.closest(CARD);if(!card)return;
    const img=card.querySelector('img')||card.closest('.hf-slide,.hf-card,.hf-fy')?.querySelector('img');
    if(!img||!img.naturalWidth)return;
    const d=card.dataset;
    tap={img,id:d.spot||d.spotId||d.cultSpot||null,rect:img.getBoundingClientRect(),at:performance.now()};
  },{capture:true,passive:true});

  let flight=null;
  function endFlight(){
    const f=flight;flight=null;
    root.classList.remove('ob-zoom-open','ob-zoom-land');
    if(!f)return;
    clearTimeout(f.timer);clearInterval(f.poll);
    f.anims.forEach(a=>{try{a.cancel();}catch(_){}});
    giveBack(f);
    f.el.remove();
  }
  /* L’image empruntée à la carte retourne à sa place (si la carte existe encore). */
  function giveBack(f){
    const h=f.home;f.home=null;if(!h)return;
    h.img.style.objectPosition=h.pos;
    if(h.parent.isConnected){try{h.parent.insertBefore(h.img,h.next&&h.next.parentNode===h.parent?h.next:null);}catch(_){}}
  }
  /* Calque posé à la grande taille (le héros) et réduit vers la carte : il n’est jamais agrandi au-delà de sa
     définition. La fenêtre change de proportions (transform non uniforme) et l’image reçoit l’échelle inverse à
     chaque point de la courbe : la photo ne se déforme pas. Les points de la courbe sont écrits en images clés,
     la courbe elle-même reste « linear » : même ressort sur iOS 16.4, sans linear().
     L’image du calque est celle de la carte elle-même, empruntée le temps du vol (déjà décodée : elle s’affiche à
     la première image, alors qu’une nouvelle balise attendrait son chargement), puis rendue à sa carte. */
  function fly(o){
    const big=o.big,small=o.small,open=o.dir==='open';
    const g=document.createElement('div');g.className='ob-zoom';g.setAttribute('aria-hidden','true');
    g.style.cssText='left:'+big.l+'px;top:'+big.t+'px;width:'+big.w+'px;height:'+big.h+'px';
    const im=o.img,home={img:im,parent:im.parentNode,next:im.nextSibling,pos:im.style.objectPosition};
    im.style.objectPosition=(o.posBig[0]*100)+'% '+(o.posBig[1]*100)+'%';
    const sc=document.createElement('i');if(o.scrim)sc.style.backgroundImage=o.scrim;
    g.append(im,sc);
    const sx=small.w/big.w,sy=small.h/big.h,dx=small.l-big.l,dy=small.t-big.t;
    const nw=im.naturalWidth||big.w,nh=im.naturalHeight||big.h;
    const c1=Math.max(big.w/nw,big.h/nh),c0=Math.max(small.w/nw,small.h/nh),k0=c0/c1;
    /* Décalage du centre de la photo par rapport au centre de sa fenêtre (cadrages object-position). */
    const offB=[(big.w-nw*c1)*(o.posBig[0]-.5),(big.h-nh*c1)*(o.posBig[1]-.5)];
    const offS=[(small.w-nw*c0)*(o.posSmall[0]-.5),(small.h-nh*c0)*(o.posSmall[1]-.5)];
    const outer=[],inner=[],round=[];
    for(let i=0;i<SNAP.length;i++){
      const e=open?SNAP[i]:1-SNAP[i];
      const sxe=lerp(sx,1,e),sye=lerp(sy,1,e),k=lerp(k0,1,e);
      const tx=(lerp(offS[0],offB[0],e)-offB[0]*k)/sxe,ty=(lerp(offS[1],offB[1],e)-offB[1]*k)/sye;
      outer.push({transform:'translate3d('+(dx*(1-e)).toFixed(2)+'px,'+(dy*(1-e)).toFixed(2)+'px,0)'+SP+'scale('+sxe.toFixed(5)+','+sye.toFixed(5)+')'});
      inner.push({transform:'translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px)'+SP+'scale('+(k/sxe).toFixed(5)+','+(k/sye).toFixed(5)+')'});
      const r=o.rSmall.map((v,c)=>lerp(v,o.rBig[c],e));
      round.push({borderRadius:r.map(v=>(v/sxe).toFixed(1)+'px').join(SP)+SP+'/'+SP+r.map(v=>(v/sye).toFixed(1)+'px').join(SP)});
    }
    document.body.append(g);
    const opt={duration:ZOOM_MS,easing:'linear',fill:'both'};
    /* Si le moteur refuse une de ces animations, la photo empruntée retourne tout de suite à sa carte : elle ne reste
       jamais dans un calque que personne ne suit. */
    let anims;
    try{
      anims=[g.animate(outer,opt),im.animate(inner,opt),g.animate(round,opt),
        sc.animate(open?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration:ZOOM_MS,easing:'ease-out',fill:'both'})];
    }catch(err){giveBack({home});g.remove();throw err;}
    return {el:g,img:im,scrim:sc,anims,main:anims[0],home,open,t:0};
  }

  /* Horloge du vol. Le vol n’avance pas à l’heure réelle mais d’image en image, de STEP_MAX ms au plus à chaque image.
     Sur iPhone (essai dans WKWebView, 18 nov. 2026), ouvrir une fiche occupe le fil principal 250 à 300 ms, en deux
     images lentes : à l’heure réelle, le vol (dont le ressort fait l’essentiel du trajet dans sa première moitié)
     se jouait pendant ces images et ne se voyait qu’à sa toute fin. Ici le calque attend à sa place de départ les
     `skip` premières images, le temps que l’écran d’arrivée se peigne, puis chaque image affichée montre l’étape
     suivante : rien n’est sauté. À 60 images par seconde, la durée est exactement celle prévue.
     Filet : si aucune image ne vient (page cachée), l’atterrissage a lieu quand même.
     `from` : instant de départ (un vol de retour lancé pendant le vol d’ouverture repart d’où la photo se trouve). */
  const STEP_MAX=34;
  function drive(f,land,skip,from){
    let t=f.t=Math.min(ZOOM_MS,Math.max(0,from||0)),last=0,n=0;
    f.anims.forEach(a=>{try{a.pause();if(t)a.currentTime=t;}catch(_){}});
    f.timer=setTimeout(land,ZOOM_MS+1200);
    const step=now=>{
      if(flight!==f||!f.anims.length)return;
      if(++n>skip){
        t=f.t=Math.min(ZOOM_MS,t+(last?Math.min(Math.max(now-last,0),STEP_MAX):16));
        f.anims.forEach(a=>{try{a.currentTime=t;}catch(_){}});
        if(t>=ZOOM_MS){land();return;}
      }
      last=now;requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  /* Avancement du ressort à l’instant t d’un vol (0 : carte, 1 : héros), lu entre les points de la courbe. */
  function snapAt(t){
    const x=Math.min(1,Math.max(0,t/ZOOM_MS))*(SNAP.length-1),i=Math.floor(x),j=Math.min(SNAP.length-1,i+1);
    return lerp(SNAP[i],SNAP[j],x-i);
  }
  /* Instant d’un vol de retour où la photo a la taille p (1 : héros, au départ ; 0 : carte, à l’arrivée). */
  function backTime(p){
    const want=1-Math.min(1,Math.max(0,p));
    for(let i=1;i<SNAP.length;i++)if(SNAP[i]>=want){const a=SNAP[i-1],b=SNAP[i];return (i-1+(b>a?(want-a)/(b-a):0))/(SNAP.length-1)*ZOOM_MS;}
    return ZOOM_MS;
  }
  /* Retour demandé pendant le vol d’ouverture : l’instant où le vol de retour doit commencer pour repartir de la
     taille que la photo a déjà (sinon elle sautait au héros plein cadre avant de redescendre). 0 : pas de vol en cours. */
  function resumeAt(){
    const f=flight;
    return f&&f.open&&f.anims.length?backTime(snapAt(f.t||0)):0;
  }

  function heroInfo(){
    const hero=document.getElementById('detailHero'),photo=document.getElementById('dHeroPhoto');
    if(!hero||!photo)return null;
    let scrim='';try{const bg=getComputedStyle(hero,'::after').backgroundImage;if(bg&&bg!=='none')scrim=bg;}catch(_){}
    return {hero,photo,scrim};
  }

  /* Chaque fonction n’est enveloppée qu’une fois, au chargement de ce fichier (avant DOMContentLoaded) : si un autre
     module l’enveloppe ensuite à son tour, les rappels de wrapAll ne la remplacent plus (pas de double enveloppe,
     pas de dépendance à l’ordre). La fonction précédente est toujours appelée. */
  const wrappedOnce={};
  function wrapOpenSpot(){
    const original=window.openSpot;
    if(typeof original!=='function'||original.__motion||wrappedOnce.openSpot)return;
    wrappedOnce.openSpot=true;
    const wrapped=function(id){
      const t=tap;tap=null;
      const h=heroInfo();
      /* Pas de vol si la fiche ouverte n’est pas celle de la carte touchée (lien direct, recherche, autre bouton). */
      if(!t||!h||!canAnimate||performance.now()-t.at>1500||(t.id&&t.id!==id)||reduced()||blocked())return original.apply(this,arguments);
      let from=t.rect;
      if(t.img.isConnected){const r=t.img.getBoundingClientRect();if(r.width>8&&r.height>8)from=r;}
      if(!inView(from,.3))return original.apply(this,arguments);
      const posSmall=objPos(t.img),rSmall=radii(t.img);
      endFlight();
      root.classList.add('ob-zoom-open');M.zoom=true;
      let res;
      try{res=original.apply(this,arguments);}catch(err){M.zoom=false;endFlight();throw err;}
      M.zoom=false;
      try{
        const to=h.hero.getBoundingClientRect();
        if(document.body.dataset.screen!=='detail'||to.width<60||to.height<60){endFlight();return res;}
        const f=fly({dir:'open',img:t.img,big:box(to),small:box(from),posBig:objPos(h.photo),posSmall,rBig:radii(h.hero),rSmall,scrim:h.scrim});
        flight=f;
        const land=()=>{
          if(flight!==f)return;
          clearTimeout(f.timer);
          /* Le calque devient la doublure de la photo, sous le voile et le titre du héros, jusqu’à ce que la vraie
             photo soit affichée : le titre n’attend jamais le réseau, et le calque défile avec la fiche. */
          f.anims.forEach(a=>{try{a.cancel();}catch(_){}});f.anims=[];
          f.scrim.remove();f.el.style.cssText='';f.el.classList.add('ob-zoom-rest');
          h.photo.after(f.el);
          root.classList.remove('ob-zoom-open');root.classList.add('ob-zoom-land');
          setTimeout(()=>root.classList.remove('ob-zoom-land'),300);
          let n=0;
          f.poll=setInterval(()=>{
            const ready=h.photo.classList.contains('on')&&h.photo.complete&&h.photo.naturalWidth>0;
            if(ready||++n>60){if(flight===f)endFlight();else{clearInterval(f.poll);giveBack(f);f.el.remove();}}
          },80);
        };
        /* Deux images laissées à la fiche pour se peindre, puis le vol avance d’image en image (voir drive). */
        drive(f,land,2);
      }catch(_){endFlight();}
      return res;
    };
    wrapped.__motion=true;
    window.openSpot=wrapped;
  }

  /* Carte du spot dans l’écran retrouvé : celle qui se voit le mieux. */
  function findCard(screen,id){
    if(!screen||!id)return null;
    let best=null,area=0;
    let list=[];try{const q=CSS.escape(id);list=screen.querySelectorAll('[data-spot="'+q+'"],[data-spot-id="'+q+'"]');}catch(_){}
    for(const card of list){
      const img=card.querySelector('img');
      if(!img||!img.naturalWidth)continue;
      const r=img.getBoundingClientRect();if(!inView(r,.6))continue;
      const a=r.width*r.height;if(a>area){area=a;best={img,rect:r};}
    }
    return best;
  }

  /* ================= Barre d’onglets : la pastille coulisse ================= */
  let tabAnim=null;
  function slideTab(nav,from,to,nr,b,mid){
    const pill=document.getElementById('navPill');
    if(!pill||!nav||!from||!to||!nr)return;
    const x1=to.left-nr.left-b;
    let x0=(mid!=null?mid:from.left)-nr.left-b;
    if(tabAnim){try{tabAnim.cancel();}catch(_){}}
    pill.style.width=to.width+'px';
    nav.classList.add('ob-tab-move');
    const a=tabAnim=pill.animate([{transform:'translate3d('+x0.toFixed(2)+'px,0,0)'},{transform:'translate3d('+x1.toFixed(2)+'px,0,0)'}],{duration:TAB_MS,easing:M.snap,fill:'both'});
    const done=()=>{if(tabAnim!==a)return;tabAnim=null;nav.classList.remove('ob-tab-move');try{a.cancel();}catch(_){}pill.style.width='';};
    a.finished.then(done,()=>{});setTimeout(done,TAB_MS+120);
  }

  /* ================= Petites touches à l’arrivée d’un écran =================
     Icône de l’onglet choisi : un saut franc, une fois, seulement quand l’onglet change (pas de lecture de mise en
     page ; sur ordinateur et sous la barre native de l’iPhone, l’icône n’est pas affichée et rien ne se passe). */
  const activeTab=()=>document.querySelector('.ocean-v2 .nav>button[data-s].active');
  function hopTab(before){
    const now=activeTab(),ic=now&&now!==before?now.querySelector('.tab-ic'):null;
    if(!ic||!canAnimate||reduced()||blocked())return;
    try{ic.animate([{transform:'translate3d(0,0,0)'+SP+'scale(1)'},{transform:'translate3d(0,-5px,0)'+SP+'scale(1.18)',offset:.36},{transform:'translate3d(0,1px,0)'+SP+'scale(.96)',offset:.72},{transform:'translate3d(0,0,0)'+SP+'scale(1)'}],{duration:POP_MS,easing:M.easeOut});}catch(_){}
  }
  /* Première arrivée sur un écran qui n’a pas d’entrée à lui : ses premiers blocs montent l’un après l’autre, 26 ms
     d’écart, dix au plus, une seule fois par session. Les blocs sont trouvés par la structure (children) : aucune
     mesure, aucune mise en page forcée. Rien n’attend la fin : le premier bloc est lisible tout de suite. */
  const ARRIVE={challenges:1,surf:1,community:1},arrived=new Set();
  const KEEP=/^(HEADER|BUTTON|A|P|UL|OL|DETAILS|SUMMARY|TABLE|SVG|svg|ASIDE|H1|H2|H3|LABEL|FORM)$/;
  function blocks(screen){
    let list=[...screen.children];
    for(let pass=0;pass<3&&list.length<4;pass++){
      const next=[];
      for(const el of list){if(el.children.length>=2&&!KEEP.test(el.tagName))next.push(...el.children);else next.push(el);}
      if(next.length===list.length)break;
      list=next;
    }
    return list.filter(el=>!el.hidden&&el.style.display!=='none'&&!/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName)).slice(0,10);
  }
  function arrive(s){
    if(!ARRIVE[s]||arrived.has(s))return;
    if(!canAnimate||reduced()||blocked())return; /* pas encore joué : la première arrivée animée reste à venir */
    arrived.add(s);
    const screen=document.getElementById(s);if(!screen)return;
    blocks(screen).forEach((el,i)=>{
      try{el.animate([{opacity:0,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:280,delay:i*26,easing:M.snap,fill:'backwards'});}catch(_){}
    });
  }
  M.arrive=arrive;

  function wrapGo(){
    const original=window.go;
    if(typeof original!=='function'||original.__motion||wrappedOnce.go)return;
    wrappedOnce.go=true;
    const wrapped=function(s){
      const fromScreen=document.body.dataset.screen;
      const calm=!canAnimate||reduced()||blocked();
      /* Pastille : positions lues avant le changement d’écran (mise en page à jour, lecture sans coût). */
      let nav=null,r0=null,r1=null,nr=null,nb=0,mid=null;
      const tab0=calm?null:activeTab();
      if(!calm&&fromScreen!==s&&!root.classList.contains('native-glass')&&innerWidth<960){
        nav=document.querySelector('.ocean-v2 .nav');
        const a=nav&&nav.querySelector('button[data-s].active'),b=nav&&nav.querySelector('button[data-s="'+s+'"]');
        if(a&&b&&a!==b&&a.getClientRects().length&&b.getClientRects().length){
          r0=a.getBoundingClientRect();r1=b.getBoundingClientRect();nr=nav.getBoundingClientRect();nb=px(getComputedStyle(nav).borderLeftWidth);
          /* Changement d’onglet pendant un trajet : la pastille repart d’où elle est. */
          if(tabAnim){const pill=document.getElementById('navPill');if(pill)mid=pill.getBoundingClientRect().left;}
        }
      }
      /* Retour d’une fiche : la photo du héros redescend vers la carte du spot, si elle est à l’écran. */
      let back=null;
      if(!calm&&fromScreen==='detail'&&s!=='detail'){
        const h=heroInfo();
        if(h&&h.photo.classList.contains('on')&&h.photo.naturalWidth){
          const r=h.hero.getBoundingClientRect();
          if(r.top>-90&&r.bottom>160){
            let id=null;try{id=typeof currentSpot!=='undefined'?currentSpot:null;}catch(_){}
            /* Seulement si l’écran retrouvé contient une carte de ce spot (sinon : glissement habituel). */
            let known=false;try{const q=CSS.escape(id||'');known=!!id&&!!document.getElementById(s)?.querySelector('[data-spot="'+q+'"],[data-spot-id="'+q+'"]');}catch(_){}
            if(known)back={id,big:box(r),posBig:objPos(h.photo),rBig:radii(h.hero),scrim:h.scrim};
          }
        }
      }
      /* Appel venu de l’ouverture d’une fiche en cours de vol (openSpot) : on ne touche à rien. */
      const nested=M.zoom;
      const at=back&&!nested?resumeAt():0;
      if(!nested)endFlight();
      let res;
      if(back)M.zoom=true;
      try{res=original.apply(this,arguments);}finally{if(!nested)M.zoom=false;}
      try{
        if(r0&&r1&&document.body.dataset.screen===s)slideTab(nav,r0,r1,nr,nb,mid);
        if(!calm&&!nested&&fromScreen!==s&&document.body.dataset.screen===s){hopTab(tab0);arrive(s);}
        if(back&&document.body.dataset.screen===s){
          const card=findCard(document.getElementById(s),back.id);
          if(card){
            const posSmall=objPos(card.img),rSmall=radii(card.img),holder=card.img.parentElement;
            const f=fly({dir:'close',img:card.img,big:back.big,small:box(card.rect),posBig:back.posBig,posSmall,rBig:back.rBig,rSmall,scrim:back.scrim});
            flight=f;
            /* À l’arrivée, l’image retrouve sa carte ; le nom et le cœur de la carte se reposent en fondu. */
            const land=()=>{if(flight!==f)return;endFlight();if(holder&&holder.isConnected){holder.classList.add('ob-zoom-landed');setTimeout(()=>holder.classList.remove('ob-zoom-landed'),320);}};
            drive(f,land,1,at);
          }
        }
      }catch(_){endFlight();}
      return res;
    };
    wrapped.__motion=true;
    window.go=wrapped;
  }

  /* ================= Onglets de la fiche : le trait glisse ================= */
  function wrapDetailTabs(){
    const original=window.showDetailCat;
    if(typeof original!=='function'||original.__motion||wrappedOnce.tabs)return;
    wrappedOnce.tabs=true;
    let ink=null,anim=null;
    const wrapped=function(cat){
      const bar=document.getElementById('dTabs');
      const a=bar&&bar.querySelector('.dtab.active');
      let x0=0,w0=0;
      const ok=canAnimate&&bar&&a&&!reduced()&&bar.getClientRects().length;
      if(ok){x0=a.offsetLeft;w0=a.offsetWidth;}
      const res=original.apply(this,arguments);
      try{
        const b=ok&&bar.querySelector('.dtab.active');
        if(b&&b!==a&&w0){
          if(!ink||!ink.isConnected){ink=document.createElement('i');ink.className='ob-tab-ink';ink.setAttribute('aria-hidden','true');ink.style.width='100px';bar.append(ink);}
          if(anim){try{anim.cancel();}catch(_){}}
          const x1=b.offsetLeft,w1=b.offsetWidth;
          bar.classList.add('ob-tab-move');
          const k=anim=ink.animate([{opacity:1,transform:'translate3d('+x0+'px,0,0)'+SP+'scaleX('+(w0/100)+')'},{opacity:1,transform:'translate3d('+x1+'px,0,0)'+SP+'scaleX('+(w1/100)+')'}],{duration:TAB_MS,easing:M.snap,fill:'both'});
          const done=()=>{if(anim!==k)return;anim=null;bar.classList.remove('ob-tab-move');try{k.cancel();}catch(_){}};
          k.finished.then(done,()=>{});setTimeout(done,TAB_MS+120);
        }
      }catch(_){if(bar)bar.classList.remove('ob-tab-move');}
      return res;
    };
    wrapped.__motion=true;
    window.showDetailCat=wrapped;
  }

  /* ================= Replis : ce qui suit glisse à sa nouvelle place =================
     Positions lues en phase de capture, avant que le module du repli n’ouvre ou ne ferme ; relues à l’image
     suivante, puis chaque voisin déplacé rattrape sa place en transform (aucune hauteur animée, aucun saut).
     Aucun module de contenu n’est modifié : replis.js, les « Voir plus » de l’accueil et les <details> y passent. */
  const FOLD='.obf-head,button[data-obf],.hf-plus-btn,details.chal-why>summary,.events-drawer>summary,.guide-around-toggle';
  function neighbours(el){
    const out=[],top=-innerHeight*.5,bottom=innerHeight*2;
    for(let n=el,depth=0;n&&n.parentElement&&depth<9;n=n.parentElement,depth++){
      if(n.classList&&(n.classList.contains('screen')||n.id==='screenWrap'||n.tagName==='DIALOG'))break;
      for(const sib of n.parentElement.children){
        if(sib===n||out.length>=70)continue;
        const r=sib.getBoundingClientRect();
        if(!r.height||r.bottom<top||r.top>bottom)continue;
        out.push({el:sib,top:r.top});
      }
    }
    return out;
  }
  document.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target.closest(FOLD):null;
    if(!t||!canAnimate||reduced())return;
    const list=neighbours(t);if(!list.length)return;
    requestAnimationFrame(()=>{
      const vh=innerHeight,edge=vh+24,y=v=>'translate3d(0,'+v.toFixed(1)+'px,0)';
      const moved=[];
      for(const it of list){
        if(!it.el.isConnected)continue;
        const r=it.el.getBoundingClientRect();if(!r.height)continue;
        const d=it.top-r.top;
        if(Math.abs(d)>=1.5)moved.push({el:it.el,d,from:it.top,to:r.top});
      }
      /* Seul le trajet visible est animé, et tout le bloc bouge d’une pièce : des voisins poussés sous l’écran
         glissent ensemble jusqu’au bord (puis s’y posent) ; ceux qui remontent de plus bas entrent ensemble par le
         bord. Jamais des milliers de pixels en 340 ms, jamais de cartes qui se chevauchent. */
      const leaving=moved.filter(m=>m.d<0&&m.to>vh),entering=moved.filter(m=>m.d>0&&m.from>vh);
      const out=leaving.length?edge-Math.min(...leaving.map(m=>m.from)):0;
      const inn=entering.length?edge-Math.min(...entering.map(m=>m.to)):0;
      for(const m of moved){
        let frames;
        if(m.d<0&&m.to>vh){if(out<1.5)continue;frames=[{transform:y(m.d)},{transform:y(m.d+out)}];}
        else if(m.d>0&&m.from>vh){const from=Math.min(m.d,inn);if(from<1.5)continue;frames=[{transform:y(from)},{transform:y(0)}];}
        else frames=[{transform:y(m.d)},{transform:y(0)}];
        try{m.el.animate(frames,{duration:FOLD_MS,easing:M.snap});}catch(_){}
      }
    });
  },true);

  /* ================= Feuilles du gabarit « quiz-modal » : sortie en douceur =================
     La fermeture réelle reste immédiate (l’état de l’app ne change pas d’ordre) ; c’est une copie inerte de la
     fenêtre qui redescend en 200 ms, sans retenir les touchers. */
  function softClose(name,id){
    const original=window[name];
    if(typeof original!=='function'||original.__motion||wrappedOnce[name])return;
    wrappedOnce[name]=true;
    const wrapped=function(){
      const el=document.getElementById(id);
      const ok=canAnimate&&el&&el.classList.contains('open')&&!root.classList.contains('ob-booting');
      let ghost=null;
      if(ok){try{ghost=el.cloneNode(true);}catch(_){ghost=null;}}
      const res=original.apply(this,arguments);
      if(ghost&&!el.classList.contains('open')){
        ghost.classList.add('ob-closing');ghost.setAttribute('aria-hidden','true');ghost.setAttribute('inert','');
        ghost.removeAttribute('onclick');
        document.body.append(ghost);
        setTimeout(()=>ghost.remove(),reduced()?180:230);
      }
      return res;
    };
    wrapped.__motion=true;
    window[name]=wrapped;
  }

  /* ================= Place d’un élément, sans mise en page forcée =================
     Un IntersectionObserver rend la place de l’élément à l’image suivante, calculée par le navigateur pendant sa
     propre mise en page : rien n’est mesuré dans le fil d’un toucher. */
  let rectIO=null;const rectWait=new Map();
  function rectOf(el,cb){
    if(typeof IntersectionObserver!=='function')return;
    if(!rectIO)rectIO=new IntersectionObserver(list=>{
      for(const e of list){
        const f=rectWait.get(e.target);if(!f)continue;
        rectWait.delete(e.target);rectIO.unobserve(e.target);
        try{f(e.boundingClientRect,e.target);}catch(_){}
      }
    });
    if(rectWait.has(el))rectIO.unobserve(el);
    rectWait.set(el,cb);rectIO.observe(el);
  }

  /* ================= Retour au toucher : appui franc, relâché en ressort, onde =================
     - L’appui est joué ici, en « scale » (il se compose avec le transform d’un composant) : 120 ms vers 0,96 (0,975
       pour une grande surface), puis un relâché de 320 ms qui dépasse d’un rien avant de se poser.
     - Un toucher très bref joue quand même tout l’aller et retour : l’app répond toujours.
     - Au doigt, l’appui attend 70 ms : si le doigt part en défilement entre-temps, rien ne bouge (comme une liste
       native). À la souris, il part tout de suite.
     - Grandes surfaces : une onde part du point de contact (calque fixe, rogné aux coins de la surface).
     Aucune lecture de mise en page : la place de la surface vient de rectOf, et son rayon est lu au même moment. */
  const PRESS='button,[role=button],summary,a[href],label.set-toggle,.ui-spot,.quiz-launch,[data-spot],[data-spot-id],[data-cult-open]';
  const NO_PRESS='[disabled],[aria-disabled=true],[class*=maplibregl],.omap-ctrls *,.sf-pad *,input,select,textarea,.ob-nopress,.ob-nopress *';
  const LARGE='.ui-spot,.ui-card,.ac-card,.ac-tour,.tv-card,.tv-idea,.pv-tile,.pv-pass,.pv-row,.pv-sport,.pv-spot,.sf-char,.quiz-launch,.cult-card,.hf-card,.hf-fy,.hf-slide,.hf-mood,.gl-tile,.gl-place,.field-nearby-card,.fx-alert,.fx-day,.exl-opt,.sport-card,.lvl-card,.omap-sheet-head,label.set-toggle,.obf-head,.trip-saved-card,.spot';
  const PHOTO='.ac-card,.tv-idea,.hf-card,.hf-slide,.gl-tile,.field-nearby-card,.cult-card';
  const TOP='.quiz-modal,.sd-sheet,dialog,.cult-sheet,.oba,.chat-sheet,.app-update';
  const PRESS_S=.96,PRESS_LG=.975,HOLD_MS=70,SLOP=10;
  let hold=null;const inks=new Set();
  function pressable(t){
    if(!t||!t.closest)return null;
    const el=t.closest(PRESS);
    return el&&!el.matches(NO_PRESS)?el:null;
  }
  function begin(h){
    if(h.on||!h.el.isConnected)return;
    clearTimeout(h.timer);h.on=true;h.at=performance.now();
    try{h.press=h.el.animate([{scale:'1'},{scale:String(h.k)}],{duration:PRESS_MS,easing:M.easeOut,fill:'both'});}catch(_){h.press=null;}
    h.wantInk=h.large;if(h.wantInk&&h.rect)ink(h);
  }
  /* Relâché : il attend la fin de l’appui (toucher bref), puis revient en dépassant un peu. calm : le doigt est parti
     en défilement, l’appui se défait simplement, sans ressort. */
  function release(h,calm){
    clearTimeout(h.timer);
    const p=h.press;h.press=null;if(!p)return;
    const free=a=>()=>{try{p.cancel();}catch(_){}if(a){try{a.cancel();}catch(_){}}};
    if(calm){const end=free(null);try{p.reverse();p.finished.then(end,end);}catch(_){end();}setTimeout(end,PRESS_MS+80);return;}
    const wait=Math.max(0,PRESS_MS-10-(performance.now()-h.at)),over=h.large?1.008:1.022;
    let a=null;
    try{a=h.el.animate([{scale:String(h.k),easing:'cubic-bezier(.3,.6,.4,1)'},{scale:String(over),offset:.5,easing:'ease-in-out'},{scale:'1'}],{duration:RELEASE_MS,delay:wait,fill:'forwards'});}catch(_){a=null;}
    const end=free(a);
    if(a)a.finished.then(end,end);
    setTimeout(end,RELEASE_MS+wait+120);
  }
  /* Onde : un disque de 120 px, agrandi en transform depuis le point de contact jusqu’au coin le plus loin. Le cadre
     est un peu plus petit que la surface (elle est enfoncée) : l’onde ne déborde jamais. */
  function ink(h){
    h.wantInk=false;
    const r=h.rect,el=h.el;if(!r||!el.isConnected)return;
    const dx=r.width*(1-h.k)/2,dy=r.height*(1-h.k)/2,w=r.width-2*dx,hh=r.height-2*dy,x=h.x-r.left-dx,y=h.y-r.top-dy;
    if(w<40||hh<28||x<-6||y<-6||x>w+6||y>hh+6)return;
    const box=document.createElement('span');
    box.className='ob-ink-box'+(el.matches(PHOTO)?' is-light':'')+(el.closest(TOP)?' is-top':'');box.setAttribute('aria-hidden','true');
    box.style.cssText='left:'+(r.left+dx).toFixed(1)+'px;top:'+(r.top+dy).toFixed(1)+'px;width:'+w.toFixed(1)+'px;height:'+hh.toFixed(1)+'px;border-radius:'+(h.round||'14px');
    const dot=document.createElement('i');dot.className='ob-ink';box.append(dot);document.body.append(box);
    const far=Math.hypot(Math.max(x,w-x),Math.max(y,hh-y)),big=Math.max(1.2,far/60*1.12),at='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+SP+'scale(';
    const done=()=>{inks.delete(box);box.remove();};
    inks.add(box);
    try{dot.animate([{opacity:0,transform:at+'.35)'},{opacity:1,offset:.2},{opacity:.8,offset:.55},{opacity:0,transform:at+big.toFixed(3)+')'}],{duration:INK_MS,easing:'cubic-bezier(.25,.6,.3,1)',fill:'both'}).finished.then(done,done);}catch(_){done();}
    setTimeout(done,INK_MS+200);
  }
  /* Changement d’écran ou défilement : les ondes en cours s’effacent avec l’écran qu’elles éclairaient. */
  function clearInks(){
    inks.forEach(box=>{const out=()=>box.remove();try{box.animate([{opacity:1},{opacity:0}],{duration:160,easing:'ease-out',fill:'forwards'}).finished.then(out,out);}catch(_){out();}});
    inks.clear();
  }
  window.addEventListener('ocean:navigate',clearInks);
  function pointerDown(e){
    if(e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
    if(hold){const old=hold;hold=null;release(old,true);}
    if(!canAnimate||reduced()||blocked())return;
    const el=pressable(e.target);if(!el)return;
    const large=el.matches(LARGE);
    const h=hold={el,large,k:large?PRESS_LG:PRESS_S,x:e.clientX,y:e.clientY,id:e.pointerId,timer:0,press:null,on:false,at:0,rect:null,round:'',wantInk:false};
    if(large)rectOf(el,(r,node)=>{h.rect=r;try{const cs=getComputedStyle(node).borderRadius;if(parseFloat(cs)>0)h.round=cs;}catch(_){}if(h.wantInk)ink(h);});
    if(e.pointerType==='mouse')begin(h);else h.timer=setTimeout(()=>begin(h),HOLD_MS);
  }
  function pointerUp(e){
    const h=hold;if(!h||e.pointerId!==h.id)return;
    hold=null;
    if(!h.on)begin(h);          /* toucher bref : l’aller et retour se joue quand même en entier */
    release(h,false);
  }
  function pointerOff(e){
    const h=hold;if(!h||(e&&e.pointerId!==h.id))return;
    hold=null;clearTimeout(h.timer);
    if(h.on){release(h,true);clearInks();}
  }
  function pointerMove(e){
    const h=hold;if(!h||e.pointerId!==h.id)return;
    if(Math.abs(e.clientX-h.x)>SLOP||Math.abs(e.clientY-h.y)>SLOP)pointerOff(e);
  }
  if(canAnimate){
    root.classList.add('ob-tactile');
    document.addEventListener('pointerdown',pointerDown,{capture:true,passive:true});
    document.addEventListener('pointerup',pointerUp,{capture:true,passive:true});
    document.addEventListener('pointercancel',pointerOff,{capture:true,passive:true});
    document.addEventListener('pointermove',pointerMove,{capture:true,passive:true});
  }

  /* ================= Changement d’état visible : la pastille qui change rebondit =================
     Pastilles de filtre, puces, onglets, choix d’une feuille : l’état est comparé avant et après le clic (attributs
     aria et classes d’état, aucune mesure). Les segments à curseur n’y passent pas : c’est leur curseur qui glisse. */
  const STATE='[aria-pressed],[aria-checked],[aria-selected],.exl-pill,.dtab,.htab,.chip,.gsw button,.pv-tabs>button,.fx-day,.sport-card,.lvl-card,.omap-toggle';
  const NO_STATE='.pv-seg>button,.exl-seg button';
  const HEART='.hf-fav,.fav,[data-fav],.spot-bar-fav';
  const ON=/(?:^|\s)(?:active|on|sel|is-on|is-sel|selected)(?:\s|$)/;
  const stateOf=el=>[el.getAttribute('aria-pressed'),el.getAttribute('aria-checked'),el.getAttribute('aria-selected'),ON.test(el.getAttribute('class')||'')].join('|');
  document.addEventListener('click',e=>{
    const el=e.target&&e.target.closest?e.target.closest(STATE):null;
    if(!el||!canAnimate||el.matches(NO_STATE)||el.matches(HEART)||reduced()||blocked())return;
    const before=stateOf(el);
    requestAnimationFrame(()=>{
      if(!el.isConnected||stateOf(el)===before)return;
      try{el.animate([{scale:'.93'},{scale:'1.045',offset:.55},{scale:'1'}],{duration:POP_MS,easing:M.easeOut});}catch(_){}
    });
  },true);

  /* ================= Petites récompenses : particules courtes =================
     Huit points et un anneau partent du centre de l’élément (place donnée par rectOf), 360 ms, une fois. */
  function burst(el,ok){
    if(!canAnimate||reduced()||blocked())return;
    rectOf(el,r=>{
      if(!el.isConnected||r.width<4)return;
      const g=document.createElement('span');g.className='ob-burst'+(ok?' is-ok':'');g.setAttribute('aria-hidden','true');
      g.style.transform='translate3d('+(r.left+r.width/2).toFixed(1)+'px,'+(r.top+r.height/2).toFixed(1)+'px,0)';
      const N=8,reach=Math.max(22,Math.min(34,r.width*.75));
      const ring=document.createElement('i');ring.className='ob-ring';g.append(ring);
      for(let i=0;i<N;i++){const dot=document.createElement('i');dot.className=i%3?'ob-dot':'ob-dot is-sun';g.append(dot);}
      document.body.append(g);
      try{
        ring.animate([{opacity:.75,transform:'scale(.5)'},{opacity:0,transform:'scale(1.75)'}],{duration:POP_MS,easing:M.easeOut,fill:'both'});
        for(let i=0;i<N;i++){
          const a=i/N*6.2832+(i%2?.22:-.16),d=reach*(i%2?1:.7),x=Math.cos(a)*d,y=Math.sin(a)*d;
          g.children[i+1].animate([{opacity:1,transform:'translate3d(0,0,0)'+SP+'scale(.4)'},{opacity:1,transform:'translate3d('+(x*.72).toFixed(1)+'px,'+(y*.72).toFixed(1)+'px,0)'+SP+'scale(1)',offset:.45},{opacity:0,transform:'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+SP+'scale(.3)'}],{duration:POP_MS,easing:M.easeOut,fill:'both'});
        }
      }catch(_){}
      setTimeout(()=>g.remove(),POP_MS+120);
    });
  }
  M.burst=burst;
  /* Cœur des favoris : il bat à l’ajout, puis éclate en particules (aucune mise en page forcée pour rejouer). */
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest(HEART):null;
    if(!b||reduced())return;
    requestAnimationFrame(()=>{
      if(!b.isConnected||!(b.classList.contains('on')||b.getAttribute('aria-pressed')==='true'))return;
      try{(b.querySelector('svg')||b).animate([{transform:'scale(.6)'},{transform:'scale(1.3)',offset:.52},{transform:'scale(1)'}],{duration:POP_MS,easing:M.easeOut});}catch(_){}
      burst(b,false);
    });
  },true); /* phase de capture : certains cœurs arrêtent la propagation de leur clic */
  /* Défi validé : le bouton « Fait » se pose en rebondissant, la carte respire une fois, des particules vertes. */
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('.chal-btn:not(.done)'):null;
    const host=b&&b.closest('#ecoChallenges,#surfChallenges'),card=b&&b.closest('.chal');
    if(!host||!card||!canAnimate||reduced()||blocked())return;
    const i=[...host.querySelectorAll('.chal')].indexOf(card);
    requestAnimationFrame(()=>{
      const now=host.querySelectorAll('.chal')[i],done=now&&now.classList.contains('is-done')?now.querySelector('.chal-btn.done'):null;
      if(!done)return;
      try{
        done.animate([{scale:'.7'},{scale:'1.14',offset:.55},{scale:'1'}],{duration:POP_MS,easing:M.easeOut});
        now.animate([{scale:'1'},{scale:'1.022',offset:.4},{scale:'1'}],{duration:POP_MS,easing:M.easeOut});
      }catch(_){}
      burst(done,true);
    });
  },true);

  /* ================= Vue ouverte dans le même écran : elle arrive par le côté =================
     Passeport complet (ui-nav.js) et voyage ouvert : le contenu change sur place, on le fait entrer par la droite en
     avançant, par la gauche en revenant. Rend false si rien n’a été joué (mouvement réduit, rideau).
     fade=false : glissé seul, pour une vue dont les blocs ont déjà leur propre entrée en fondu (voyage ouvert) ; un
     second fondu par-dessus laisserait l’écran vide un instant. */
  M.enter=function(el,dir,fade){
    if(!el||!canAnimate||reduced()||blocked())return false;
    const x=(dir<0?-1:1)*72;
    try{
      el.animate([{transform:'translate3d('+x+'px,0,0)'},{transform:'translate3d(0,0,0)'}],{duration:PAGE_MS,easing:M.snap});
      if(fade!==false)el.animate([{opacity:0},{opacity:1}],{duration:Math.round(PAGE_MS*.55),easing:M.easeOut});
    }catch(_){return false;}
    return true;
  };
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('#tripContent [data-action=select],#tripContent [data-action=overview]'):null;
    if(!b)return;
    const dir=b.dataset.action==='select'?1:-1;
    requestAnimationFrame(()=>M.enter(document.getElementById('tripContent'),dir,dir<0));
  },true);

  /* ================= Fenêtres <dialog> (formulaire de voyage) : sortie par le chemin inverse =================
     close() ferme tout de suite, comme avant ; une copie inerte de la fenêtre redescend en 200 ms pendant que le
     voile s’éclaircit. Les touchers passent déjà à l’écran du dessous. */
  (function(){
    const proto=typeof HTMLDialogElement!=='undefined'&&HTMLDialogElement.prototype;
    if(!proto||typeof proto.close!=='function'||proto.close.__motion)return;
    const original=proto.close;
    const wrapped=function(){
      let ghost=null,y=0;
      try{if(canAnimate&&this.open&&this.matches('.trip-dialog')&&!reduced()&&!blocked()){y=this.scrollTop;ghost=this.cloneNode(true);}}catch(_){ghost=null;}
      const res=original.apply(this,arguments);
      if(ghost&&!this.open){
        try{
          const back=document.createElement('span');back.className='ob-ghost-back';back.setAttribute('aria-hidden','true');
          ghost.removeAttribute('id');ghost.classList.add('ob-ghost');ghost.querySelectorAll('img').forEach(im=>{im.loading='eager';im.decoding='sync';});ghost.setAttribute('open','');ghost.setAttribute('aria-hidden','true');ghost.setAttribute('inert','');
          document.body.append(back,ghost);
          if(y)ghost.scrollTop=y;
          back.animate([{opacity:1},{opacity:0}],{duration:200,easing:'ease',fill:'forwards'});
          ghost.animate([{opacity:1,transform:'translate3d(0,0,0)'+SP+'scale(1)'},{opacity:0,transform:'translate3d(0,30px,0)'+SP+'scale(.97)'}],{duration:200,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'});
          setTimeout(()=>{back.remove();ghost.remove();},230);
        }catch(_){}
      }
      return res;
    };
    wrapped.__motion=true;proto.close=wrapped;
  })();

  /* ================= Anneau de focus : au clavier seulement ================= */
  /* Après un toucher, l’app déplace parfois le focus elle-même, pour le clavier et les lecteurs d’écran (bouton de
     fermeture d’une feuille, « Découvrir » du mot du jour). Le moteur de l’iPhone dessine alors l’anneau de focus
     comme au clavier (essai dans WKWebView, 18 nov. 2026) : un cercle coloré apparaissait autour d’un bouton que
     personne n’avait visé. La classe ob-touch est posée au premier toucher ou clic et retirée dès qu’une touche de
     déplacement sert (Tab, flèches) : l’anneau reste entier au clavier (motion.css). */
  /* Retour au toucher (motion.css) : le moteur de l’iPhone n’applique :active qu’aux pages qui écoutent les touchers.
     Écouteur vide et passif : il ne retarde ni le toucher ni le défilement. */
  document.addEventListener('touchstart',function(){},{passive:true});

  const FOCUS_KEYS=/^(Tab|Arrow(Up|Down|Left|Right))$/;
  function pointerMode(e){if(e&&e.isPrimary===false)return;root.classList.add('ob-touch');}
  function keyMode(e){if(e&&FOCUS_KEYS.test(e.key||''))root.classList.remove('ob-touch');}
  window.addEventListener('pointerdown',pointerMode,{capture:true,passive:true});
  window.addEventListener('keydown',keyMode,{capture:true,passive:true});

  function wrapAll(){wrapOpenSpot();wrapGo();wrapDetailTabs();softClose('closeSettings','settingsModal');softClose('closeQuiz','quizModal');softClose('closeEcoLog','ecoInfo');}
  wrapAll();
  window.addEventListener('load',wrapAll);
  setTimeout(wrapAll,0);
})();
