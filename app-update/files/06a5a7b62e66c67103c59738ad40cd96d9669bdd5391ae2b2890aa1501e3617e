/* Interface v2 : le Profil et ses écrans rattachés (maquette validée le 19 novembre 2026, styles dans ui-nav.css).
   - Profil court : mon niveau (le même réglage que les Réglages : chooseMyLevel), mes spots (favoris, visités), jouer
     (quiz, mini-jeu, défis), le passeport en résumé (carte au trait, pays, spots, trophées), réglages et aide.
   - « Voir tout » affiche le passeport complet à la place du Profil court, dans le même écran (#profile).
   - Jeu et Défis n’ont plus d’onglet : ils s’ouvrent depuis « Jouer ». Un bouton Retour, dans la barre du haut, ramène au
     Profil, qui reste l’onglet actif (go() d’app.js).
   Chargé après app.js, poulpy.js, passport.js, badges.js et app-shell.js ; n’écrit dans aucun autre écran.
   Passe du 23 novembre 2026 : tuiles Jouer illustrées, scène dessinée pour « Mes spots » vide, passeport plus parlant
   (terres teintées, halo et onde des spots visités, pays visités en tampons), deux colonnes sur ordinateur large.
   Mouvements : joués une fois, en transform et opacity (Web Animations), jamais en boucle ; rien ne bouge en mouvement
   réduit (réglage du système ou « Réduire les animations »). */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const body=document.body,root=document.documentElement,profile=$('#profile'),wrap=$('#screenWrap');
  if(!profile||!wrap||!$('#pvMain')||typeof SPOTS==='undefined')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SUB={surf:1,challenges:1};
  const reduced=()=>body.classList.contains('reduce-motion')||!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canAnimate=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';
  /* Sous le rideau de démarrage ou une scène de changement d’activité : aucun mouvement (comme motion.js). */
  const calm=()=>!canAnimate||reduced()||root.classList.contains('ob-booting')||!!window.OceanTransition?.covered;
  const ease=()=>window.OceanMotion?.easeOut||'cubic-bezier(.22,.8,.3,1)';

  /* ================= Données : celles du passeport (passport.js), rien d’inventé ================= */
  function model(){
    let d=null;try{d=window.OceanPassport?.data?.();}catch(_){}
    const byId=new Map(SPOTS.map(s=>[s.id,s]));
    const been=d?d.visited:[];
    /* Favoris : le plus récent d’abord (favs garde l’ordre d’ajout). */
    const fav=[...(typeof favs!=='undefined'?favs:[])].map(id=>byId.get(id)).filter(Boolean).reverse();
    let trophies=0;try{trophies=(window.OceanBadges?.list?.()||[]).filter(b=>b.unlocked).length;}catch(_){}
    /* Pays visités : ceux du passeport (data().countries), dans l’ordre des sessions, la plus récente d’abord. */
    return {fav,been,wished:d?d.wished:[],countries:d?d.countries.size:0,countryNames:d?[...d.countries]:[],trophies};
  }

  /* ================= Mon niveau ================= */
  function renderLevel(){
    const cur=typeof activeSport!=='undefined'&&activeSport&&SPORTMAP[activeSport]?activeSport:'all';
    const name=$('#pvSportName'),ic=$('#pvSportIc');
    if(name&&name.dataset.sp!==cur){name.dataset.sp=cur;name.textContent=cur==='all'?'Tous les sports':SPORTMAP[cur].label;}
    if(ic&&ic.dataset.sp!==cur&&window.PoulpyIcons){ic.dataset.sp=cur;ic.src=PoulpyIcons.src(cur);}
    const seg=$('#pvSeg');if(!seg)return;
    const lvl=typeof chosenLevel!=='undefined'&&chosenLevel?chosenLevel:'';
    if(seg.dataset.lvl===lvl&&seg.dataset.ready)return;
    seg.dataset.lvl=lvl;seg.dataset.ready='1';
    /* Un seul arrêt de tabulation dans le groupe : le niveau choisi, sinon le premier. */
    $$('[data-lvl]',seg).forEach((b,i)=>{const on=b.dataset.lvl===lvl;b.setAttribute('aria-checked',String(on));b.tabIndex=on||(!lvl&&!i)?0:-1;});
  }
  function pickLevel(id){if(typeof chooseMyLevel==='function')chooseMyLevel(id);renderLevel();}
  $('#pvSeg')?.addEventListener('click',e=>{const b=e.target.closest('[data-lvl]');if(b)pickLevel(b.dataset.lvl);});
  $('#pvSeg')?.addEventListener('keydown',e=>{
    const step=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!step)return;
    const list=$$('#pvSeg [data-lvl]'),i=list.indexOf(document.activeElement);if(i<0)return;
    e.preventDefault();const next=list[(i+step+list.length)%list.length];pickLevel(next.dataset.lvl);next.focus();
  });

  /* ================= Mes spots : favoris et visités ================= */
  let tab='fav',tabChosen=false,lastBeen=-1,spotsSig='';
  function spotCard(s){
    const src=(typeof spotPhotoUrl==='function'&&spotPhotoUrl(s.id,480))||(typeof spotIllustration==='function'?spotIllustration(s.id):'');
    const set=typeof spotPhotoSrcset==='function'?spotPhotoSrcset(s.id):'';
    const name=window.SpotName?SpotName.parts(s.name).main:String(s.name).split(' — ')[0];
    /* data-spot : la photo de la vignette fait le trajet vers la fiche (motion.js). */
    return `<button type="button" class="pv-spot" data-spot="${esc(s.id)}"><span class="pv-ph"><img src="${esc(src)}"${set} sizes="(min-width:960px) 190px, 31vw" alt="" width="640" height="640" loading="lazy" decoding="async"></span><span class="pv-spot-n" translate="no" data-no-i18n>${esc(name)}</span></button>`;
  }
  function renderSpots(m){
    const favN=$('#pvFavN'),beenN=$('#pvBeenN'),host=$('#pvSpots');if(!host)return;
    if(favN)favN.textContent=m.fav.length;if(beenN)beenN.textContent=m.been.length;
    /* Une session vient d’être notée : la liste des spots visités se montre d’elle-même. */
    if(lastBeen>=0&&m.been.length>lastBeen)tab='been';
    else if(!tabChosen&&lastBeen<0)tab=!m.fav.length&&m.been.length?'been':'fav';
    lastBeen=m.been.length;
    for(const b of $$('#pvTabs [data-pv-tab]')){const on=b.dataset.pvTab===tab;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on)host.setAttribute('aria-labelledby',b.id);}
    const list=tab==='been'?m.been:m.fav,sig=tab+'|'+list.map(s=>s.id).join(',')+'|'+(typeof activeSport!=='undefined'?activeSport:'');
    /* Rien n’a changé : les vignettes restent en place (la photo qui revient d’une fiche retrouve la sienne). */
    if(sig===spotsSig)return;
    spotsSig=sig;
    host.classList.toggle('is-empty',!list.length);
    if(list.length){host.innerHTML=list.map(spotCard).join('');host.scrollLeft=0;return;}
    /* Une scène dessinée pour cet état (des spots à découvrir), dans le style des illustrations de la fiche. */
    host.innerHTML=`<span class="pv-ph pv-empty-art"><img src="assets/ui/mes-spots-vide.webp" alt="" width="800" height="800" loading="lazy" decoding="async"></span>`
      +`<div class="pv-empty"><p class="ui-text">${tab==='been'?'Pas encore de spot visité':'Pas encore de favori'}</p><button type="button" class="ui-btn" data-pv-explore>Explorer</button></div>`;
  }
  $('#pvTabs')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-pv-tab]');if(!b||b.dataset.pvTab===tab)return;
    tab=b.dataset.pvTab;tabChosen=true;renderSpots(model());
    const host=$('#pvSpots');
    if(host&&!calm())host.animate([{opacity:0,transform:'translate3d(0,6px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:200,easing:ease()});
  });
  $('#pvTabs')?.addEventListener('keydown',e=>{
    if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
    const other=$$('#pvTabs [data-pv-tab]').find(b=>b.dataset.pvTab!==tab);if(!other)return;
    e.preventDefault();other.click();other.focus();
  });
  $('#pvSpots')?.addEventListener('click',e=>{
    const card=e.target.closest('[data-spot]');
    if(card){if(typeof openSpot==='function')openSpot(card.dataset.spot);return;}
    if(e.target.closest('[data-pv-explore]')&&typeof go==='function')go('spots');
  });

  /* ================= Jouer ================= */
  function renderPlay(){
    const el=$('#pvXp');if(!el)return;
    const n=typeof xp==='number'?xp:0;
    if(el.dataset.xp!==String(n)){el.dataset.xp=String(n);el.textContent=`${n} XP`;}
  }
  $('.pv-play',profile)?.addEventListener('click',e=>{
    const b=e.target.closest('[data-pv-play]');if(!b)return;
    const k=b.dataset.pvPlay;
    if(k==='quiz'){if(typeof openQuiz==='function')openQuiz();}
    else if(typeof go==='function')go(k);
  });

  /* ================= Passeport en résumé ================= */
  /* Même projection que la carte du passeport (passport.js) : 84° N à 58° S. */
  const pos=c=>({x:(c.lon+180)/360*100,y:(84-c.lat)/142*100});
  let played=false,target={countries:0,spots:0,trophies:0},dotsSig='';
  const NUM={countries:'#pvNCountries',spots:'#pvNSpots',trophies:'#pvNTrophies'};
  function setNums(v){for(const k in NUM){const el=$(NUM[k]);if(el&&el.textContent!==String(v[k]))el.textContent=v[k];}}
  function renderPass(m){
    target={countries:m.countries,spots:m.been.length,trophies:m.trophies};
    /* Libellés au singulier ou au pluriel. En français, zéro et un restent au singulier (« 0 spot ») et « pays » ne
       change pas ; en anglais et en espagnol, seul un est au singulier (« 0 spots », « 1 country ») : la clé
       « un seul pays », jamais affichée en français, porte ce singulier. */
    const fr=String(root.lang||'fr').slice(0,2)==='fr',many=n=>fr?n>1:n!==1;
    const tr=window.obT?{spot:obT('spot'),spots:obT('spots'),trophy:obT('trophée'),trophies:obT('trophées'),countries:obT('pays'),country:fr?'pays':obT('un seul pays')}
      :{spot:'spot',spots:'spots',trophy:'trophée',trophies:'trophées',countries:'pays',country:'pays'};
    const lab=(sel,text)=>{const el=$(sel);if(el&&el.dataset.k!==text){el.dataset.k=text;el.textContent=text;}};
    lab('#pvLCountries',many(target.countries)?tr.countries:tr.country);
    lab('#pvLSpots',many(target.spots)?tr.spots:tr.spot);lab('#pvLTrophies',many(target.trophies)?tr.trophies:tr.trophy);
    /* Avant leur première apparition à l’écran, les chiffres attendent à zéro (ils montent une fois, voir play). */
    if(played||!canAnimate||reduced())setNums(target);
    const dot=(s,cls)=>{const c=typeof COORDS!=='undefined'&&COORDS[s.id];if(!c)return '';const p=pos(c);return p.y<0||p.y>100?'':`<i class="pv-dot ${cls}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%"></i>`;};
    const html=m.wished.map(s=>dot(s,'wish')).join('')+m.been.map(s=>dot(s,'been')).join('');
    const host=$('#pvDots');if(host&&html!==dotsSig){dotsSig=html;host.innerHTML=html;}
    renderStamps(m);
  }
  /* Les pays visités, en tampons : trois au plus, puis le nombre de ceux qui restent. Les noms sont ceux des spots
     visités (traduits comme partout ailleurs). Sans pays visité, une case en pointillé dit comment gagner le premier. */
  const STAMPS=3;
  let stampsSig=null;
  function renderStamps(m){
    const host=$('#pvStamps');if(!host)return;
    const names=m.countryNames,sig=names.join('|');
    if(sig===stampsSig)return;
    stampsSig=sig;
    const more=names.length-STAMPS;
    host.innerHTML=names.length
      ?names.slice(0,STAMPS).map(n=>`<span class="pv-stamp">${esc(n)}</span>`).join('')+(more>0?`<span class="pv-stamp is-more" translate="no" data-no-i18n>+${more}</span>`:'')
      :`<span class="pv-stamp is-todo">Note ta première session</span>`;
  }
  /* Une fois, quand la carte du passeport entre à l’écran : les chiffres montent et les points se posent. */
  function play(){
    if(played)return;played=true;
    if(!canAnimate||reduced()){setNums(target);return;}
    const end={...target},t0=performance.now(),DUR=720;
    const tick=now=>{
      const k=Math.min(1,(now-t0)/DUR),e=1-Math.pow(1-k,3),v={};
      for(const key in end)v[key]=Math.round(end[key]*e);
      /* Une valeur changée pendant la montée (trophée gagné) : la fin affiche la valeur du moment. */
      setNums(k<1?v:target);
      if(k<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    $$('#pvDots .pv-dot').forEach((d,i)=>d.animate([{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1)'}],{duration:340,delay:160+Math.min(i,12)*45,easing:ease(),fill:'backwards'}));
    /* Une onde part de chaque spot visité (six au plus), une seule fois, puis son élément est retiré. */
    $$('#pvDots .pv-dot.been').slice(0,6).forEach((d,i)=>{
      const ring=document.createElement('i');ring.className='pv-ring';ring.style.left=d.style.left;ring.style.top=d.style.top;
      d.before(ring);
      const wave=ring.animate([{opacity:.7,transform:'scale(1)'},{opacity:0,transform:'scale(4.2)'}],{duration:900,delay:420+i*90,easing:ease(),fill:'backwards'});
      wave.onfinish=wave.oncancel=()=>ring.remove();
    });
    /* Les tampons se posent l’un après l’autre, comme un coup de tampon. */
    $$('#pvStamps .pv-stamp').forEach((el,i)=>el.animate([{opacity:0,transform:'scale(1.35)'},{opacity:1,transform:'scale(1)'}],{duration:260,delay:380+i*110,easing:ease(),fill:'backwards'}));
  }
  let passSeen=false;
  function tryPlay(){
    if(played||!passSeen||body.dataset.screen!=='profile'||fullOpen||root.classList.contains('ob-booting'))return;
    play();
  }
  if('IntersectionObserver' in window&&$('#pvPass')){
    /* Marge basse : la partie de l’écran cachée par la barre d’onglets ne compte pas. */
    new IntersectionObserver(es=>{passSeen=es[es.length-1].isIntersecting;tryPlay();},{root:wrap,rootMargin:[0,0,-84,0].map(v=>v+'px').join(' '),threshold:.6}).observe($('#pvPass'));
  }else played=true;

  /* ================= Rendu ================= */
  function render(){
    const m=model();
    renderLevel();renderSpots(m);renderPlay();renderPass(m);
  }
  /* go('profile') et les autres modules appellent renderProfile : le Profil court se met à jour avec eux. */
  const original=window.renderProfile;
  window.renderProfile=function(...a){const r=typeof original==='function'?original.apply(this,a):undefined;try{render();}catch(e){console.warn(e);}return r;};
  document.addEventListener('ocean:sport',()=>{try{render();}catch(e){console.warn(e);}});
  document.addEventListener('ocean:level',()=>renderLevel());

  /* ================= Passeport complet (« Voir tout ») ================= */
  let fullOpen=false,mainScroll=0;
  function swap(dir){
    if(calm())return;
    profile.animate([{opacity:0,transform:`translate3d(${dir*10}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:200,easing:ease()});
  }
  function openFull(opts){
    if(fullOpen)return;
    fullOpen=true;mainScroll=wrap.scrollTop;
    profile.classList.add('pv-full-open');
    wrap.scrollTop=0;
    syncChrome();
    if(!(opts&&opts.quiet)){swap(1);$('#pvFullHead h1')?.focus({preventScroll:true});}
  }
  function closeFull(opts){
    if(!fullOpen)return;
    fullOpen=false;
    profile.classList.remove('pv-full-open');
    syncChrome();
    if(opts&&opts.quiet)return;
    wrap.scrollTop=mainScroll;
    swap(-1);$('#pvPassAll')?.focus({preventScroll:true});
  }
  $('#pvPassAll')?.addEventListener('click',()=>openFull());
  $('#pvPass')?.addEventListener('click',()=>openFull());
  $('#pvAvatar')?.addEventListener('click',()=>window.OceanPoulpy?.openWardrobe?.());

  /* ================= Retour dans la barre du haut : passeport complet, Jeu, Défis ================= */
  const chrome=$('.app-chrome');
  const back=document.createElement('button');
  back.type='button';back.id='pvBack';back.className='app-back';back.hidden=true;
  back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg><span>Retour</span>';
  back.setAttribute('aria-label','Retour');
  /* Titre de la barre au défilement : celui de l’en-tête de l’écran (déjà dans la langue choisie). */
  const title=document.createElement('span');title.className='pv-chrome-title';title.setAttribute('translate','no');title.setAttribute('data-no-i18n','');title.setAttribute('aria-hidden','true');
  if(chrome){chrome.prepend(back);($('.chrome-title',chrome)||chrome).append(title);}
  /* Jeu ou Défis ouvert depuis le Profil : le Retour remonte l’historique (le Profil retrouve sa position). Ouvert
     d’ailleurs (accueil, Poulpy, réouverture de l’app) : il mène quand même au Profil, leur écran parent. */
  let last=body.dataset.screen||'home',fromProfile=false;
  function goBack(){
    const scr=body.dataset.screen;
    if(scr==='profile'){closeFull();return;}
    if(!SUB[scr])return;
    if(fromProfile&&window.OceanNavigation?.index?.()>0)window.OceanNavigation.back();
    else if(typeof go==='function')go('profile');
  }
  back.addEventListener('click',goBack);
  function syncChrome(){
    const scr=body.dataset.screen,sub=!!SUB[scr]||(scr==='profile'&&fullOpen);
    back.hidden=!sub;body.classList.toggle('pv-sub',sub);
    const h=sub?(scr==='profile'?$('#pvFullHead h1'):$('#'+scr+' .pv-sub-head h1')):null,text=h?h.textContent:'';
    if(title.textContent!==text)title.textContent=text;
  }
  /* Première arrivée sur le Profil, une seule fois : les blocs déjà à l’écran entrent l’un après l’autre (40 ms
     d’écart) ; ceux du bas attendent, invisibles (.pv-wait), d’arriver à l’écran quand on fait défiler. Les photos et
     les illustrations d’un bloc se posent alors en douceur, dans leur cadre. */
  let entered=false;
  function reveal(el,i){
    el.classList.remove('pv-wait');
    if(calm())return;
    const delay=40+i*40;
    el.animate([{opacity:0,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:320,delay,easing:ease(),fill:'backwards'});
    $$('.pv-tile-art>img,.pv-ph>img',el).forEach((img,j)=>img.animate([{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:620,delay:delay+j*70,easing:ease(),fill:'backwards'}));
  }
  function enter(){
    if(entered||fullOpen||calm())return;entered=true;
    const blocks=$$('#pvMain>.pv-top,#pvMain>.pv-col>*');
    if(!('IntersectionObserver' in window)){blocks.forEach(reveal);return;}
    blocks.forEach(el=>el.classList.add('pv-wait'));
    /* Marge basse : la bande cachée par la barre d’onglets ne compte pas. */
    const seen=new IntersectionObserver(es=>{
      let n=0;
      for(const e of es)if(e.isIntersecting){seen.unobserve(e.target);reveal(e.target,n++);}
    },{root:wrap,rootMargin:[0,0,-64,0].map(v=>v+'px').join(' '),threshold:.08});
    blocks.forEach(el=>seen.observe(el));
  }
  window.addEventListener('ocean:navigate',e=>{
    const to=e.detail;
    if(SUB[to]&&to!==last)fromProfile=last==='profile';
    /* Quitter le Profil referme le passeport complet : on retrouve toujours le Profil court. */
    if(to!=='profile'&&fullOpen)closeFull({quiet:true});
    last=to;
    syncChrome();
    if(to==='profile'){enter();tryPlay();}
  });
  /* Rideau de démarrage levé : titres dans la langue choisie, et chiffres si le Profil est l’écran de départ. */
  window.OceanBoot?.after?.(()=>{syncChrome();tryPlay();});
  /* Toucher l’onglet Profil quand le passeport complet est ouvert ramène au Profil court. */
  $('.nav')?.addEventListener('click',e=>{
    const b=e.target.closest('button[data-s="profile"]');
    if(b&&body.dataset.screen==='profile'&&fullOpen){closeFull();mainScroll=0;wrap.scrollTop=0;}
  },true);

  window.OceanProfile={render,openFull,closeFull,isFullOpen:()=>fullOpen,back:goBack};
  try{render();}catch(e){console.warn(e);}
  syncChrome();
})();
