/* Transitions Apple : zoom partagé carte -> fiche (View Transitions) et entrée des grands titres.
   Chargé en dernier : enveloppe window.openSpot sans le réécrire. N'ajoute aucune boucle permanente. */
(function(){
  'use strict';
  const root=document.documentElement;
  const M=window.OceanMotion=window.OceanMotion||{};
  M.instant=false;

  function reduced(){
    return document.body.classList.contains('reduce-motion')||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function blocked(){
    return root.classList.contains('ob-booting')||!!window.OceanTransition?.covered||!!document.querySelector('.act-tr');
  }

  /* Dernière photo de carte touchée (pointerdown), valable 1,5 s. */
  let lastImg=null,lastAt=0;
  document.addEventListener('pointerdown',e=>{
    const card=e.target.closest&&e.target.closest('.hf-card[data-spot],.hf-slide[data-spot]');
    lastImg=card?card.querySelector('img'):null;lastAt=performance.now();
  },{capture:true,passive:true});

  /* Mesure brève (rAF) de la fluidité, uniquement le temps de démarrer une transition. */
  let sampleTok=0;
  function smooth(cb){
    let n=0,prev=0,worst=0;const tok=++sampleTok;
    function tick(t){
      if(tok!==sampleTok)return; /* annulé : l'ouverture elle-même fausserait la mesure */
      if(prev)worst=Math.max(worst,t-prev);
      prev=t;
      if(++n<4)requestAnimationFrame(tick);else cb(worst<=50);
    }
    requestAnimationFrame(tick);
  }

  function onScreen(el){
    if(!el||!el.isConnected)return false;
    const r=el.getBoundingClientRect();
    return r.width>8&&r.height>8&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
  }

  let busy=false,pending=null;
  function wrap(){
    const original=window.openSpot;
    if(typeof original!=='function'||original.__motion)return;
    const wrapped=function(id){
      /* Zoom déjà lancé mais pas encore appliqué : le dernier tap gagne, on ne rouvre pas deux fois. */
      if(pending){pending.args=arguments;lastImg=null;return;}
      const img=lastImg,fresh=performance.now()-lastAt<1500;
      lastImg=null;sampleTok++;
      if(busy||!fresh||!img||typeof document.startViewTransition!=='function'||reduced()||blocked()||!onScreen(img)||!document.getElementById('detailHero'))
        return original.apply(this,arguments);
      const self=this;
      /* Appareil jugé lent : pas de zoom ce coup-ci. On repart de zéro ensuite : la mesure
         (échantillon de pointerdown ou latence de la transition) dira si c'est toujours le cas. */
      if(M.slow){M.slow=false;return original.apply(self,arguments);}
      busy=true;
      pending={args:arguments};
      const t0=performance.now();
      let finished=false;
      const hero=document.getElementById('detailHero');
      const clear=()=>{
        if(finished)return;finished=true;busy=false;pending=null;M.instant=false;
        img.style.viewTransitionName='';hero.style.viewTransitionName='';root.classList.remove('ob-vt-active');
      };
      try{
        img.style.viewTransitionName='ob-spot';
        root.classList.add('ob-vt-active');
        const vt=document.startViewTransition(()=>{
          /* Latence image de capture : si elle dépasse ~90 ms, les prochains taps sautent le zoom. */
          if(performance.now()-t0>90)M.slow=true;
          const args=pending?pending.args:arguments;pending=null;
          img.style.viewTransitionName='';
          M.instant=true;
          try{original.apply(self,args);}finally{M.instant=false;}
          hero.style.viewTransitionName='ob-spot';
        });
        vt.finished.then(clear,clear);
        setTimeout(clear,900);
      }catch(_){
        const a=pending?pending.args:arguments;
        const was=pending;clear();
        if(was&&!document.getElementById('detail')?.classList.contains('active'))original.apply(self,a);
      }
    };
    wrapped.__motion=true;
    window.openSpot=wrapped;
  }
  /* Échantillon de lenteur : sur chaque tap de carte, mesure 4 images puis s'arrête. */
  document.addEventListener('pointerdown',e=>{
    if(!(e.target.closest&&e.target.closest('.hf-card[data-spot],.hf-slide[data-spot]')))return;
    smooth(ok=>{M.slow=!ok;});
  },{capture:true,passive:true});
  /* Le tap suit le pointerdown de ~80 ms : on mesure aussi au survol précédent via M.slow (valeur du tap d'avant). */

  wrap();
  window.addEventListener('load',wrap);
  setTimeout(wrap,0);

  /* Entrée des grands titres retirée : go() applique 'animation:none!important' (sw-live) pendant le
     glissement, qui porte déjà la transition ; l'ajouter ferait un décalage de contenu au démarrage. */
})();
