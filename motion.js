/* Motion d’Ocean Buddy (motion.css pour les courbes et les durées). Chargé après tous les écrans : enveloppe
   window.openSpot, window.go et quelques fermetures sans les réécrire, et n’ajoute aucune boucle permanente.
   - la photo de la carte touchée grandit vers le héros de la fiche, et revient à sa carte au retour ;
   - l’indicateur de la barre d’onglets et celui des onglets de la fiche coulissent ;
   - quand un repli s’ouvre ou se ferme, ce qui suit glisse à sa nouvelle place au lieu de sauter ;
   - réglages et quiz sortent en douceur ; le cœur des favoris bat à l’ajout.
   Tout est en transform et opacity (Web Animations, présentes depuis iOS 13.1) : pas de View Transitions, pas de
   linear() obligatoire. En mouvement réduit, rien de tout cela ne bouge (les fondus courts viennent de design.css).
   Rien ici ne touche à l’accueil ni à la barre d’onglets avant la levée du rideau, et aucune transition ne retient
   un toucher : les calques animés laissent passer les pointeurs. */
(function(){
  'use strict';
  const root=document.documentElement;
  const M=window.OceanMotion=window.OceanMotion||{};
  M.instant=false;M.zoom=false;
  /* Courbes partagées (mêmes valeurs que --ob-spring / --ob-snap / --ob-ease-out de motion.css), lues par go(). */
  const LINEAR='linear(0.000,0.019,0.068,0.137,0.219,0.306,0.394,0.480,0.561,0.636,0.703,0.763,0.814,0.859,0.896,0.926,0.951,0.971,0.987,0.998,1.007,1.013,1)';
  let linearOK=false;try{linearOK=!!(window.CSS&&CSS.supports&&CSS.supports('transition-timing-function',LINEAR));}catch(_){}
  M.spring=linearOK?LINEAR:'cubic-bezier(.22,.9,.3,1.02)';
  /* Ressort amorti, départ vif (--ob-snap) : 21 points régulièrement espacés. */
  const SNAP=[0,.076,.228,.391,.538,.658,.752,.823,.875,.913,.940,.959,.972,.981,.988,.992,.995,.997,.998,.999,1];
  M.snap=linearOK?'linear('+SNAP.join(',')+')':'cubic-bezier(.2,.9,.25,1)';
  M.easeOut='cubic-bezier(.22,.8,.3,1)';
  const ZOOM_MS=380,TAB_MS=300,FOLD_MS=340,SP=String.fromCharCode(32);
  const canAnimate=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';

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
    return {el:g,img:im,scrim:sc,anims,main:anims[0],home};
  }

  function heroInfo(){
    const hero=document.getElementById('detailHero'),photo=document.getElementById('dHeroPhoto');
    if(!hero||!photo)return null;
    let scrim='';try{const bg=getComputedStyle(hero,'::after').backgroundImage;if(bg&&bg!=='none')scrim=bg;}catch(_){}
    return {hero,photo,scrim};
  }

  function wrapOpenSpot(){
    const original=window.openSpot;
    if(typeof original!=='function'||original.__motion)return;
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
        /* Départ après la première image de la fiche. Sur iPhone (essai dans WKWebView, 18 nov. 2026), l’ouverture de la
           fiche puis sa première mise en page occupent le fil principal 250 à 300 ms : parti dès sa création, le vol
           (dont le ressort fait l’essentiel du trajet dans sa première moitié) se jouait pendant ces images bloquées
           et ne se voyait qu’à sa toute fin. Le calque attend donc sur la carte, à sa place exacte, puis part quand
           la fiche est affichée : tout le trajet se voit. Filet : si aucune image ne vient (page cachée),
           l’atterrissage a lieu quand même. */
        f.anims.forEach(a=>{try{a.pause();}catch(_){}});
        f.main.finished.then(land,()=>{});
        f.timer=setTimeout(land,ZOOM_MS+1200);
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          if(flight!==f||!f.anims.length)return;
          f.anims.forEach(a=>{try{a.play();}catch(_){}});
          clearTimeout(f.timer);f.timer=setTimeout(land,ZOOM_MS+160);
        }));
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

  function wrapGo(){
    const original=window.go;
    if(typeof original!=='function'||original.__motion)return;
    const wrapped=function(s){
      const fromScreen=document.body.dataset.screen;
      const calm=!canAnimate||reduced()||blocked();
      /* Pastille : positions lues avant le changement d’écran (mise en page à jour, lecture sans coût). */
      let nav=null,r0=null,r1=null,nr=null,nb=0,mid=null;
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
      if(!nested)endFlight();
      let res;
      if(back)M.zoom=true;
      try{res=original.apply(this,arguments);}finally{if(!nested)M.zoom=false;}
      try{
        if(r0&&r1&&document.body.dataset.screen===s)slideTab(nav,r0,r1,nr,nb,mid);
        if(back&&document.body.dataset.screen===s){
          const card=findCard(document.getElementById(s),back.id);
          if(card){
            const posSmall=objPos(card.img),rSmall=radii(card.img),holder=card.img.parentElement;
            const f=fly({dir:'close',img:card.img,big:back.big,small:box(card.rect),posBig:back.posBig,posSmall,rBig:back.rBig,rSmall,scrim:back.scrim});
            flight=f;
            /* À l’arrivée, l’image retrouve sa carte ; le nom et le cœur de la carte se reposent en fondu. */
            const land=()=>{if(flight!==f)return;endFlight();if(holder&&holder.isConnected){holder.classList.add('ob-zoom-landed');setTimeout(()=>holder.classList.remove('ob-zoom-landed'),320);}};
            f.main.finished.then(land,()=>{});f.timer=setTimeout(land,ZOOM_MS+160);
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
    if(typeof original!=='function'||original.__motion)return;
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
    if(typeof original!=='function'||original.__motion)return;
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

  /* ================= Cœur des favoris : petit battement à l’ajout ================= */
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('.hf-fav,.fav,[data-fav]'):null;
    if(!b||reduced())return;
    requestAnimationFrame(()=>{
      if(!b.isConnected||!(b.classList.contains('on')||b.getAttribute('aria-pressed')==='true'))return;
      b.classList.remove('ob-heart');void b.offsetWidth;b.classList.add('ob-heart');
      setTimeout(()=>b.classList.remove('ob-heart'),460);
    });
  },true); /* phase de capture : certains cœurs arrêtent la propagation de leur clic */

  function wrapAll(){wrapOpenSpot();wrapGo();wrapDetailTabs();softClose('closeSettings','settingsModal');softClose('closeQuiz','quizModal');softClose('closeEcoLog','ecoInfo');}
  wrapAll();
  window.addEventListener('load',wrapAll);
  setTimeout(wrapAll,0);
})();
