/* Ouverture par lien : ?spot=<id> ouvre la fiche du spot dans l'app.
   Branché sur « accueil prêt » (OceanBoot.after) : ne touche pas à l'accueil avant la levée du rideau. */
(function(root){
  'use strict';
  function parseSpotId(search){
    try{
      var v=new URLSearchParams(search||'').get('spot');
      if(!v)return null;
      v=String(v).trim();
      return /^[A-Za-z0-9_-]{1,80}$/.test(v)?v:null;
    }catch(e){return null;}
  }
  if(typeof module==='object'&&module.exports)module.exports={parseSpotId:parseSpotId};
  if(!root||!root.document||!root.location)return;
  var id=parseSpotId(root.location.search);
  if(!id)return;
  function onbVisible(){
    var o=root.document.getElementById('onb');
    return !!o&&o.style.display!=='none'&&!o.classList.contains('hide');
  }
  function doOpen(){
    try{
      if(typeof root.openSpot!=='function'||!Array.isArray(root.OCEAN_CATALOG)||!root.OCEAN_CATALOG.some(function(s){return s.id===id;}))return;
      root.openSpot(id);
      if(typeof root.go==='function')root.go('detail');
      if(root.history&&root.history.replaceState){
        var u=new URL(root.location.href);u.searchParams.delete('spot');
        root.history.replaceState(null,'',u.pathname+u.search+u.hash);
      }
    }catch(e){}
  }
  /* Première visite : l'écran d'accueil de l'app (#onb) est ouvert. On garde l'id en attente et on
     ouvre la fiche une fois l'onboarding terminé, sinon l'écran serait écrasé par la suite de l'onboarding. */
  function open(){
    if(!onbVisible())return doOpen();
    var o=root.document.getElementById('onb');
    if(typeof root.MutationObserver!=='function')return;
    var mo=new root.MutationObserver(function(){
      if(onbVisible())return;
      mo.disconnect();
      setTimeout(doOpen,300);
    });
    mo.observe(o,{attributes:true,attributeFilter:['class','style']});
  }
  if(root.OceanBoot&&root.OceanBoot.after)root.OceanBoot.after(open);
  else root.addEventListener('ocean:home-ready',open,{once:true});
})(typeof window!=='undefined'?window:null);
