/* Onglet « Jeu » : choix du personnage, bouton Jouer, records et aide. Ne touche qu’à son propre écran (#surf). */
(()=>{
  const KEY='oceanbuddy_surf',root=document.getElementById('surf');
  if(!root)return;
  const $=(s,r=root)=>r.querySelector(s);
  let char='surfeur';
  function read(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'?o:{};}catch(_){return {};}}
  function saveChar(){
    /* On conserve les autres champs du stockage du jeu (record, parties…). */
    try{const o=read();o.char=char;localStorage.setItem(KEY,JSON.stringify(o));}catch(_){}
  }
  {const o=read();if(o.char==='surfeuse'||o.char==='surfeur')char=o.char;}

  /* Case 0 de l’atlas : bande horizontale (cases carrées) ou grille 4×4. */
  function drawFrame(canvas,img){
    const w=img.naturalWidth,h=img.naturalHeight;if(!w||!h)return;
    const cell=w/h>=2?h:w/4;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,cell,cell,0,0,canvas.width,canvas.height);
    canvas.classList.add('ready');
  }
  $$all('.sf-char').forEach(btn=>{
    const name=btn.dataset.sfChar,canvas=$('canvas',btn),im=new Image();
    im.onload=()=>drawFrame(canvas,im);im.src='assets/surf/'+name+'.webp?v=16';
  });
  function $$all(s){return [...root.querySelectorAll(s)];}

  function mark(){
    $$all('.sf-char').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sfChar===char)));
  }
  root.addEventListener('click',e=>{
    const c=e.target.closest('.sf-char');
    if(c){char=c.dataset.sfChar;saveChar();mark();return;}
    if(e.target.closest('#sfPlay')){
      saveChar();
      if(window.OceanSurf?.open)window.OceanSurf.open({character:char});
      else if(typeof toast==='function')toast('Le jeu se charge, réessaie dans un instant.');
    }
  });

  const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0;};
  const fmt=v=>new Intl.NumberFormat(document.documentElement.lang||'fr').format(v);
  function trickText(t){
    if(!t)return '';
    if(typeof t==='string')return t;
    const name=t.name||t.label||t.trick||'',pts=num(t.points??t.score??t.pts);
    return name&&pts?name+' · '+fmt(pts)+' pts':name||(pts?fmt(pts)+' pts':'');
  }
  function stats(){
    let s=null;
    try{if(window.OceanSurf&&typeof window.OceanSurf.stats==='function')s=window.OceanSurf.stats();}catch(_){}
    if(!s||typeof s!=='object')s=read();
    return {best:num(s.best),games:num(s.games),bestTrick:trickText(s.bestTrick),bestCombo:num(s.bestCombo)};
  }
  function refresh(){
    const s=stats(),empty=!s.best&&!s.games;
    $('#sfEmpty').hidden=!empty;
    $('#sfBest').textContent=s.best?fmt(s.best):'–';
    $('#sfGames').textContent=s.games?fmt(s.games):'–';
    $('#sfTrick').textContent=s.bestTrick||'–';
    $('#sfCombo').textContent=s.bestCombo?'×'+fmt(s.bestCombo):'–';
    root.classList.toggle('sf-no-games',empty);
  }
  window.addEventListener('ocean:surf-stats',refresh);
  window.addEventListener('ocean:navigate',e=>{if(e.detail==='surf'){const o=read();if(o.char==='surfeuse'||o.char==='surfeur'){char=o.char;mark();}refresh();}});
  window.addEventListener('storage',e=>{if(e.key===KEY)refresh();});
  mark();refresh();
})();
