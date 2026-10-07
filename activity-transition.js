/* Transitions d'activité : un rideau aux couleurs de l'activité monte, l'affiche (assets/scenes/{id}.svg,
   groupes bg / mid / fg en parallaxe) s'affiche avec le nom et le nombre de spots, puis le rideau repart vers le haut
   sur l'app déjà changée. 1,3 s, transform / opacity uniquement. Un toucher saute à la sortie. Mouvement réduit : fondu. */
(() => {
  'use strict';
  const FX={surf:{c:'#0B1F4D',a:'#1F5BFF'},bodyboard:{c:'#1F5BFF',a:'#D8F24A'},baignade:{c:'#1F5BFF',a:'#FF5A44'},paddle:{c:'#1F5BFF',a:'#F2E8D5'},kayak:{c:'#1F5BFF',a:'#FF5A44'},snorkeling:{c:'#0B1F4D',a:'#D8F24A'},plongee:{c:'#0B1F4D',a:'#F2E8D5'},kitesurf:{c:'#1F5BFF',a:'#FF5A44'},windsurf:{c:'#1F5BFF',a:'#D8F24A'}};
  const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cache=new Map();
  const scene=id=>{if(!cache.has(id))cache.set(id,fetch(`assets/scenes/${id}.svg?v=5`).then(r=>r.ok?r.text():'').catch(()=>''));return cache.get(id);};
  (window.requestIdleCallback||setTimeout)(()=>Object.keys(FX).forEach((id,i)=>setTimeout(()=>scene(id),i*300)),{timeout:6000});
  function count(id){try{return SPOTS.filter(s=>spotSports(s).includes(id)).length;}catch(_){return 0;}}
  let busy=false;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function play(id,swap){
    const fx=FX[id];
    if(!fx||busy){swap?.();return;}
    busy=true;
    const sport=(typeof SPORTMAP!=='undefined'&&SPORTMAP[id])||{label:id},n=count(id);
    const svg=await Promise.race([scene(id),wait(400).then(()=>'')]);
    const el=document.createElement('div');el.className='act-tr';el.dataset.act=id;el.setAttribute('aria-hidden','true');
    el.style.setProperty('--c',fx.c);el.style.setProperty('--a',fx.a);
    el.innerHTML=`<div class="act-tr-art">${svg}</div><div class="act-tr-title"><b>${sport.label}</b>${n?`<small>${n} spots</small>`:''}</div>`;
    const live=document.getElementById('a11yLive');if(live)live.textContent=`${sport.label} : ${n} spots`;
    document.body.append(el);
    let skip=false;el.addEventListener('pointerdown',()=>{skip=true;});
    const art=el.querySelector('.act-tr-art'),svgEl=art.querySelector('svg');
    if(svgEl){svgEl.setAttribute('preserveAspectRatio','xMidYMid slice');svgEl.removeAttribute('width');svgEl.removeAttribute('height');}
    if(reduced()){
      el.classList.add('is-fade');await new Promise(r=>requestAnimationFrame(r));el.classList.add('is-on');await wait(250);
      try{swap?.();}finally{el.classList.remove('is-on');await wait(250);el.remove();busy=false;}
      return;
    }
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    el.classList.add('in');await wait(430);
    try{swap?.();}catch(e){console.error(e);}
    try{navigator.vibrate?.(8);}catch(_){}
    el.classList.add('hold');
    for(let t=0;t<620&&!skip;t+=40)await wait(40);
    el.classList.add('out');await wait(480);
    el.remove();busy=false;
  }
  /* Retour à « toutes les activités » : fondu enchaîné natif (View Transitions) quand le navigateur le permet. */
  function neutral(swap){
    if(reduced()||!document.startViewTransition||busy){swap?.();return;}
    try{document.startViewTransition(()=>swap?.());}catch(_){swap?.();}
  }
  window.OceanTransition={play,neutral,preload:scene,FX};
})();
