/* Verre natif iOS 26 : logique pure (sans DOM) du pont entre la barre d’onglets web et le plugin
   Swift OceanGlass. Testée dans tests/native-glass-model.test.js. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NativeGlassModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  /* SF Symbols : contour au repos, plein quand l’onglet est actif (comme les icônes web). */
  const SYMBOLS={
    home:['house','house.fill'],
    spots:['globe.europe.africa','globe.europe.africa.fill'],
    surf:['figure.surfing','figure.surfing'],
    trips:['suitcase','suitcase.fill'],
    challenges:['trophy','trophy.fill'],
    profile:['person.crop.circle','person.crop.circle.fill']
  };
  const round=v=>Math.round((Number(v)||0)*2)/2;
  function rect(r){return r?{x:round(r.left??r.x),y:round(r.top??r.y),w:round(r.width??r.w),h:round(r.height??r.h)}:null;}
  /* Un rectangle utilisable : non vide et au moins en partie dans la fenêtre. */
  function onScreen(r,vw,vh){return !!r&&r.w>8&&r.h>8&&r.x<vw&&r.y<vh&&r.x+r.w>0&&r.y+r.h>0;}
  /* Onglets envoyés au natif : seulement ceux que la barre web montre, dans son ordre. */
  function items(tabs){
    return (tabs||[]).filter(t=>t&&SYMBOLS[t.id]&&t.shown!==false).map(t=>({
      id:t.id,label:String(t.label||'').trim()||t.id,a11y:String(t.a11y||t.label||'').trim(),
      symbol:SYMBOLS[t.id][0],symbolOn:SYMBOLS[t.id][1],badge:t.badge?String(t.badge).slice(0,3):''
    }));
  }
  /* État complet de la barre native. visible = la barre web serait visible et rien ne la recouvre. */
  function state(input){
    const vw=input.vw||0,vh=input.vh||0,bar=rect(input.navRect),poulpy=rect(input.poulpyRect);
    const list=items(input.tabs);
    const barOk=!!input.phone&&!!input.navShown&&!!input.navOnTop&&onScreen(bar,vw,vh)&&list.length>0;
    const selected=list.some(t=>t.id===input.selected)?input.selected:'';
    return {
      visible:barOk,
      bar,items:list,selected,
      poulpy:{visible:barOk&&!!input.poulpyShown&&onScreen(poulpy,vw,vh),rect:poulpy,a11y:String(input.poulpyLabel||'')},
      tucked:!!input.tucked,
      accent:input.accent||''
    };
  }
  /* Le plugin ne reçoit un message que si quelque chose a changé. */
  const key=s=>JSON.stringify(s);
  /* Lecture d’une couleur CSS calculée (rgb/rgba/#hex) en [r,g,b,a] 0–255 / 0–1 ; null si illisible. */
  function color(css){
    const s=String(css||'').trim();
    let m=s.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
    if(m){let a=m[4]==null?1:m[4].endsWith('%')?parseFloat(m[4])/100:parseFloat(m[4]);return [+m[1],+m[2],+m[3],a];}
    m=s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){const h=m[1].length===3?m[1].replace(/./g,c=>c+c):m[1];return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(1);}
    return null;
  }
  /* Le verre natif est désactivable (repli CSS) : ?glass=off ou localStorage oceanbuddy_glass="off". */
  function forcedOff(search,stored){return /(?:^|[?&])glass=off(?:&|$)/.test(search||'')||stored==='off'||stored==='"off"';}
  return {SYMBOLS,rect,onScreen,items,state,key,color,forcedOff};
});
