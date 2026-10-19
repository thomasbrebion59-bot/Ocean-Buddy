/* Verre natif iOS 26 (Liquid Glass d’Apple) pour la barre d’onglets et le bouton Poulpy.
   Dans l’app iOS 26 et plus, le plugin Swift OceanGlass pose une vraie barre en verre au-dessus de la
   page, calée sur la barre web (même place, mêmes onglets, même sélection). La barre web reste dans la
   page, transparente, et sert de source : ce fichier recopie son état vers le natif et renvoie les
   touchers natifs vers ses boutons. Ailleurs (site web, Android, iOS < 26, ?glass=off), rien ne change :
   la barre CSS reste affichée. Chargé après app-shell.js. */
(() => {
  'use strict';
  const M=window.NativeGlassModel,cap=window.Capacitor;
  if(!M||!cap||typeof cap.isNativePlatform!=='function'||!cap.isNativePlatform()||cap.getPlatform?.()!=='ios')return;
  let stored=null;try{stored=localStorage.getItem('oceanbuddy_glass');}catch(_){}
  if(M.forcedOff(location.search,stored))return;
  const plugin=cap.Plugins?.OceanGlass||cap.registerPlugin?.('OceanGlass');
  if(!plugin)return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const html=document.documentElement,body=document.body;
  const phone=matchMedia('(max-width:959px)');
  const shown=el=>!!el&&(typeof el.checkVisibility==='function'?el.checkVisibility({visibilityProperty:true}):el.getClientRects().length>0);
  /* Rien ne recouvre l’élément (fiche, rideau de démarrage, discussion, onboarding…). */
  function onTop(el,r){
    if(!r||r.width<8||r.height<8)return false;
    const y=Math.min(innerHeight-2,r.top+r.height/2);
    return [r.left+r.width*.2,r.left+r.width*.8].every(x=>{const hit=document.elementFromPoint(x,y);return !!hit&&(hit===el||el.contains(hit));});
  }

  function read(){
    const nav=$('.nav'),poulpy=$('.tab-poulpy');
    if(!nav)return null;
    const navRect=nav.getBoundingClientRect(),poulpyRect=poulpy?.getBoundingClientRect();
    const buttons=$$('button[data-s]',nav);
    const active=buttons.find(b=>b.getAttribute('aria-current')==='page')||buttons.find(b=>b.classList.contains('active'));
    const navShown=shown(nav);
    return M.state({
      vw:innerWidth,vh:innerHeight,phone:phone.matches,
      navShown,navOnTop:navShown&&onTop(nav,navRect),navRect,
      poulpyShown:shown(poulpy)&&onTop(poulpy,poulpyRect),poulpyRect,poulpyLabel:poulpy?.getAttribute('aria-label'),
      tabs:buttons.map(b=>{const badge=$('.tab-badge',b);return {id:b.dataset.s,shown:shown(b),
        label:$('.tab-label',b)?.textContent,a11y:b.getAttribute('aria-label'),
        badge:badge&&!badge.hidden?badge.textContent.trim():''};}),
      selected:active?.dataset.s||'',
      tucked:body.classList.contains('tabs-tucked'),
      accent:active?getComputedStyle(active).color:''
    });
  }

  let last='',queued=0,ready=false;
  /* La barre web cachée sous le verre ne doit pas être lue une seconde fois par VoiceOver. */
  function hideWeb(on){
    for(const el of [$('.nav'),$('.tab-poulpy')])if(el){if(on)el.setAttribute('aria-hidden','true');else el.removeAttribute('aria-hidden');}
  }
  function push(){
    queued=0;
    const s=read();if(!s)return;
    const k=M.key(s);if(k===last)return;last=k;
    hideWeb(s.visible);
    plugin.update({...s,accent:M.color(s.accent)}).catch(fail);
  }
  const schedule=()=>{if(ready&&!queued)queued=requestAnimationFrame(push);};
  /* Une erreur du plugin rend la main à la barre CSS. */
  function fail(err){
    ready=false;html.classList.remove('native-glass');hideWeb(false);
    try{plugin.update({visible:false});}catch(_){}
    console.warn('[OceanGlass] repli CSS',err);
  }

  plugin.available().then(r=>{
    if(!r||!r.available)return;
    ready=true;html.classList.add('native-glass');
    plugin.addListener('tab',e=>{const b=$(`.nav button[data-s="${CSS.escape(e?.id||'')}"]`);if(b)b.click();});
    plugin.addListener('poulpy',()=>$('.tab-poulpy')?.click());
    /* Voiles et fiches ajoutés à body (transition d’activité, discussion…) : vérifiés dès leur arrivée. */
    new MutationObserver(schedule).observe(body,{childList:true,attributes:true,attributeFilter:['class','data-screen','style']});
    new MutationObserver(schedule).observe(html,{attributes:true,attributeFilter:['class','data-act','lang','style']});
    const nav=$('.nav');
    if(nav)new MutationObserver(schedule).observe(nav,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','aria-current','hidden','style']});
    addEventListener('resize',schedule);
    addEventListener('ocean:navigate',schedule);
    document.addEventListener('ocean:transition',schedule);
    phone.addEventListener?.('change',schedule);
    /* Fiches et fenêtres qui passent par-dessus la barre : vérification légère, page visible seulement. */
    setInterval(()=>{if(!document.hidden)schedule();},500);
    document.addEventListener('visibilitychange',()=>{last='';schedule();});
    schedule();
  }).catch(()=>{});
})();
