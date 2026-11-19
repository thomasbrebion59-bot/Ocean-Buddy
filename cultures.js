/* Découverte des cultures : la vue, chargée à la demande par cultures-boot.js (après la levée du rideau).
   - Page pays (feuille plein écran, <dialog>) : photo du plus beau spot, « bonjour » et « merci » dans la langue, plat à
     goûter, bon geste, tradition de la mer, fête, spots du pays, prochaine escale. Chaque fait des fiches culturelles
     affiche sa source (lien discret). Ouvrir la page donne le tampon du pays.
   - Accueil : remplit sur place, sans changer leur hauteur, les mots des cartes et le jeu « Le mot du jour ».
   - Profil : bloc « Cultures découvertes X / N » (tampons, localStorage oceanbuddy_cultures_v1 ; copiés sur le compte
     si la sauvegarde est activée, voir account-sync-model.js).
   - Explorer : un bandeau « Découvrir <pays> » quand la recherche ou la destination nomme un pays.
   Données : assets/data/cultures.<langue>.json (scripts/build-cultures.cjs), demandées une seule fois. */
(() => {
  'use strict';
  const api=window.OceanCultures,M=window.CulturesModel;if(!api||!M||api._view)return;
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const NT=' translate="no" data-no-i18n';
  const LG=()=>{const l=(window.OB_I18N&&OB_I18N.lang)||document.documentElement.lang||'fr';return ['fr','en','es'].includes(l)?l:'en';};
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion');
  const buzz=p=>{try{if(typeof vibrate==='function')vibrate(p);}catch(_){}};
  const say=m=>{try{if(typeof toast==='function')toast(m);}catch(_){}};
  const SPOT_LIST=()=>typeof SPOTS!=='undefined'?SPOTS:[];

  /* ---------- Données ---------- */
  let data=null,loading=null;
  function load(){
    if(data)return Promise.resolve(data);
    if(!loading)loading=fetch(`assets/data/cultures.${LG()}.json?v=${api.V}`).then(r=>{if(!r.ok)throw Error('cultures '+r.status);return r.json();})
      .then(d=>{data=d&&d.countries||{};api.reviewed=d&&d.reviewed||null;return data;}).catch(e=>{loading=null;throw e;});
    return loading;
  }
  const names=()=>data?Object.keys(data):[...new Set(SPOT_LIST().filter(s=>s.country&&!s.custom).map(s=>s.country))];
  const local=c=>data?.[c]?.name||(window.obT?obT(c):c);
  const word=c=>data?.[c]?.hello?.[0]||data?.[c]?.thanks?.word||'';
  /* Guillemets de la langue : « mot » (fr), «mot» (es), “mot” (en) ; qw() échappe le mot (HTML), qt() non (texte partagé). */
  const QT={fr:['«\u00a0','\u00a0»'],es:['«','»'],en:['“','”']};
  const qw=w=>{const [o,c]=QT[LG()];return esc(o)+esc(w)+esc(c);};
  const qt=w=>{const [o,c]=QT[LG()];return o+w+c;};

  /* ---------- Tampons ---------- */
  const read=()=>{try{return M.readState(localStorage.getItem(M.STORE));}catch(_){return M.emptyState();}};
  const save=s=>{try{localStorage.setItem(M.STORE,M.writeState(s));}catch(_){}};
  const stamped=c=>M.stamped(read(),c);
  function addStamp(c){const r=M.stamp(read(),c,new Date());if(r.isNew){save(r.state);syncStamps();}return r.isNew;}

  /* ---------- Photos : seulement de vraies photos de spots (jamais d’illustration) ---------- */
  function photo(s){
    const p=window.OceanPhotos?.lead?.(s.id,null)||window.SPOT_PHOTOS?.[s.id]||s.photo;
    if(!p||p.ai||!p.src)return null;
    return {src:p.src,thumb:p.thumb||p.src,w:p.width||0};
  }
  const score=id=>window.OCEAN_PHOTO_SCORES?.[id]??55;
  /* Spots du pays : photos réelles d’abord, les plus lumineuses et en haute définition devant (même règle que l’accueil). */
  function spotsOf(c){
    return SPOT_LIST().filter(s=>s.country===c&&!s.custom).map(s=>{const p=photo(s);return {s,p,k:p?score(s.id)+((p.w||0)>=1200?6:0):-1};})
      .sort((a,b)=>b.k-a.k||(a.s.id<b.s.id?-1:1));
  }
  const cover=c=>spotsOf(c).find(x=>x.p)||null;
  const shortName=s=>String(s.name).split(' — ')[0];

  /* ---------- Accueil : mots des cartes et mot du jour (sur place, hauteur inchangée) ---------- */
  function fillHome(){
    if(!data)return;
    document.querySelectorAll('[data-cult-word]').forEach(el=>{
      const c=el.dataset.cultWord,w=word(c),card=el.closest('.cult-card');
      if(el.textContent!==w)el.textContent=w;el.classList.remove('is-wait');
      /* Corps selon la longueur du mot (cultures-boot.js, wordFit) : entier, jamais coupé ni « … ». */
      const fit=String(api.wordFit?api.wordFit(w,LG()):0);if(el.dataset.fit!==fit)el.dataset.fit=fit;
      if(card){
        card.classList.toggle('no-word',!w);card.classList.toggle('is-stamped',stamped(c));
        const nm=card.querySelector('.cult-card-name');if(nm&&!nm.hasAttribute('translate')){nm.textContent=local(c);nm.setAttribute('translate','no');nm.setAttribute('data-no-i18n','');}
        /* Nom entier lui aussi : corps, interlettrage ou lignes selon sa longueur (cultures-boot.js, nameFit). */
        if(nm){const nf=String(api.nameFit?api.nameFit(nm.textContent):0);if(nm.dataset.fit!==nf)nm.dataset.fit=nf;}
        card.setAttribute('translate','no');card.setAttribute('aria-label',w?`${local(c)} : ${w}`:local(c));
      }
    });
    const body=$('[data-cult-quiz-body]');
    if(body&&body.classList.contains('is-wait')){const t=document.createElement('div');t.innerHTML=quizHTML();if(t.firstElementChild){body.replaceWith(t.firstElementChild);fitDone();}}
    /* Jeu posé directement par homeHTML (fil remonté, vue déjà chargée) : mesuré aussi. */
    else if(body)fitDone();
    syncMeta();
  }
  function syncStamps(){
    document.querySelectorAll('.cult-card[data-cult-open]').forEach(card=>card.classList.toggle('is-stamped',stamped(card.dataset.cultOpen)));
    syncQuizStamp();syncMeta();renderPassport();syncBanner();
  }
  /* Mauvaise réponse au mot du jour, puis tampon gagné en ouvrant la page du pays : le résultat montrait encore le rond « ? »
     et « Ouvre sa page pour gagner son tampon. ». Seul le bloc du tampon est remplacé, sur place (même hauteur ; le bouton
     « Découvrir… » et son focus restent). */
  function syncQuizStamp(){
    try{
      const done=$('[data-cult-quiz-body].is-done'),res=done&&done.querySelector('.cult-quiz-res');
      if(!res||!res.querySelector('.cult-stamp.is-empty'))return;
      const q=today(),ans=q&&M.answered(read(),new Date());
      if(!q||!ans||ans.c!==q.country||!stamped(q.country))return;
      const t=document.createElement('div');t.innerHTML=doneHTML(q,ans);
      const next=t.querySelector('.cult-quiz-res');if(next){res.replaceWith(next);fitDone();}
    }catch(e){}
  }
  function syncMeta(){
    const meta=$('[data-cult-quiz-meta]');if(!meta)return;
    const s=read(),run=M.streak(s,new Date()),n=M.count(s,names());
    meta.textContent=run>=2?`Série de ${run} bonnes réponses`:n===1?'1 tampon':n>1?`${n} tampons`:'';
  }

  /* ---------- Le mot du jour ---------- */
  let quizCache=null;
  function today(){const d=M.dayKey(new Date());if(!quizCache||quizCache.d!==d)quizCache={d,q:data?M.quiz(data,new Date()):null};return quizCache.q;}
  const QUESTION={hello:'Dans quel pays dit-on ce mot pour saluer ?',thanks:'Dans quel pays dit-on ce mot pour dire merci ?'};
  function choiceHTML(c){
    const cv=cover(c);
    return `<button type="button" class="cult-choice" data-cult-choice="${esc(c)}"${NT}>${cv?`<img src="${esc(cv.p.thumb)}" alt="" loading="lazy" decoding="async">`:'<i></i>'}<span>${esc(local(c))}</span></button>`;
  }
  /* Taille du nom dans le tampon selon sa longueur (longueur totale, mot le plus long) : il tient en entier dans le cercle,
     jamais de « … » (cultures.css, data-fit). */
  const stampFit=n=>{const t=n.length,w=Math.max(0,...n.split(/[\s-]+/).map(x=>x.length));return t>24||w>11?3:t>15||w>9?2:t>9||w>7?1:0;};
  function stampHTML(c,date,{big=false,fresh=false}={}){
    const d=date?new Date(date+'T12:00:00').toLocaleDateString(LG(),{day:'numeric',month:'short'}):'';
    return `<span class="cult-stamp${big?' is-big':''}${fresh?' is-fresh':''}" data-fit="${stampFit(String(local(c)))}" aria-hidden="true"${NT}><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38" class="in"/></svg><b>${esc(local(c))}</b>${d?`<small>${esc(d)}</small>`:''}</span>`;
  }
  function doneHTML(q,ans,{fresh=false}={}){
    const s=read(),ok=ans.ok,c=q.country,n=M.count(s,names());
    const msg=ok?(fresh&&ans.isNew?'Bonne réponse ! Tampon gagné.':'Bonne réponse !'):'Raté, ce mot vient de :';
    const sub=ok?(n===1?'1 pays découvert':`${n} pays découverts`):stamped(c)?'Ce pays est déjà dans ton passeport.':'Ouvre sa page pour gagner son tampon.';
    return `<p class="cult-quiz-q" role="status">${esc(msg)}</p>
      <div class="cult-quiz-done${ok?' is-ok':' is-ko'}">
        <div class="cult-quiz-res">${ok||stamped(c)?stampHTML(c,s.stamps[c],{fresh:fresh&&ok}):`<span class="cult-stamp is-empty" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/></svg><b>?</b></span>`}
          <div><b${NT}>${esc(local(c))}</b><small>${esc(sub)}</small></div></div>
        <button type="button" class="cult-quiz-go" data-cult-open="${esc(c)}" data-cult-from="quiz"${NT}>${esc(api.discover(c,LG(),local(c)))}</button>
        <p class="cult-quiz-next">Un nouveau mot demain.</p>
      </div>`;
  }
  /* Résultat du mot du jour : le nom du pays n’est jamais coupé par « … ». Mesuré une fois posé (texte déjà dans la langue
     affichée, polices chargées) : si « Découvrir <pays> » ou le nom déborde, le bloc passe en .is-long (cultures.css,
     fiches-organisation.css) : le tampon reste seul à gauche (il porte le nom en entier) et le bouton prend la place,
     sur deux lignes centrées en corps plus petit ; hauteurs inchangées. Même chose quand le nom et la phrase qui le suit
     (« Abre su página para conseguir su sello. » sur trois lignes, espagnol à 375 px) dépassent la hauteur du bloc. */
  function fitDone(){
    const over=el=>!!el&&el.scrollWidth>el.clientWidth+1;
    /* Seul le texte compte : le tampon, tourné de 10°, dépasse toujours un peu du bloc (scrollHeight). */
    const tall=res=>{const t=res&&res.querySelector(':scope>div');return !!t&&t.getBoundingClientRect().height>res.clientHeight+1;};
    /* Réponses du jeu (téléphone : trois boutons côte à côte) : le nom du pays se lit en entier, jamais « … » ni coupé au
       milieu d’un mot. Deux lignes ; sinon trois lignes, puis un corps plus petit (data-fit 1 à 3, fiches-organisation.css).
       Les boutons gardent leur hauteur commune. */
    const cut=el=>!!el&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1);
    const fitChoices=()=>document.querySelectorAll('.cult-choice').forEach(b=>{const sp=b.querySelector('span');if(!sp)return;b.removeAttribute('data-fit');for(let i=1;i<=3&&cut(sp);i++)b.dataset.fit=String(i);});
    const run=()=>{try{document.querySelectorAll('.cult-quiz-done').forEach(d=>{d.classList.remove('is-long');if(over(d.querySelector('.cult-quiz-go'))||over(d.querySelector('.cult-quiz-res>div>b'))||tall(d.querySelector('.cult-quiz-res')))d.classList.add('is-long');});fitChoices();}catch(e){}};
    /* Jamais d’erreur vers l’appelant (remplissage de l’accueil, retour du réseau) : mesure à l’image suivante quand elle existe. */
    const next=f=>typeof requestAnimationFrame==='function'?requestAnimationFrame(f):setTimeout(f,0);
    next(run);
    try{document.fonts&&document.fonts.ready.then(()=>next(run));}catch(e){}
  }
  function quizHTML(){
    if(!data)return '';
    const q=today();
    if(!q)return `<div class="cult-quiz-body" data-cult-quiz-body><p class="cult-quiz-q">Le mot du jour revient bientôt.</p></div>`;
    const ans=M.answered(read(),new Date());
    const head=`<p class="cult-quiz-word${q.word.length>14?' is-long':''}"${NT}><span aria-hidden="true">${esc(QT[LG()][0])}</span>${esc(q.word)}<span aria-hidden="true">${esc(QT[LG()][1])}</span></p>`;
    if(ans&&ans.c===q.country)return `<div class="cult-quiz-body is-done" data-cult-quiz-body>${head}${doneHTML(q,ans)}</div>`;
    return `<div class="cult-quiz-body" data-cult-quiz-body>${head}<p class="cult-quiz-q">${esc(QUESTION[q.kind])}</p>
      <div class="cult-quiz-choices" role="group" aria-label="Trois pays au choix">${q.choices.map(choiceHTML).join('')}</div></div>`;
  }
  /* Réponse : retour immédiat sur les boutons, puis le résultat (tampon) à la place des choix, même hauteur. */
  function choose(btn){
    if(!data)return;
    const q=today(),body=btn.closest('[data-cult-quiz-body]');if(!q||!body||body.classList.contains('is-busy'))return;
    const r=M.answer(read(),q,btn.dataset.cultChoice,new Date());
    if(r.already){const t=document.createElement('div');t.innerHTML=quizHTML();body.replaceWith(t.firstElementChild);fitDone();return;}
    save(r.state);body.classList.add('is-busy');
    body.querySelectorAll('[data-cult-choice]').forEach(b=>{b.setAttribute('aria-disabled','true');if(b.dataset.cultChoice===q.country)b.classList.add('is-right');else if(b===btn)b.classList.add('is-wrong');});
    buzz(r.ok?[10,40,18]:14);
    setTimeout(()=>{
      const box=body.querySelector('.cult-quiz-q'),choices=body.querySelector('.cult-quiz-choices');if(!choices)return;
      const t=document.createElement('div');t.innerHTML=doneHTML(q,{ok:r.ok,isNew:r.isNew},{fresh:true});
      box?.replaceWith(t.children[0]);choices.replaceWith(t.children[0]);body.classList.remove('is-busy');body.classList.add('is-done');
      fitDone();body.querySelector('.cult-quiz-go')?.focus({preventScroll:true});
      syncStamps();
    },reduced()?120:r.ok?520:900);
  }

  /* ---------- Feuille plein écran (page pays, carnet de tampons) ---------- */
  let dlg=null,opener=null,current=null;
  const ICON={
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5"/></svg>'
  };
  /* Explorer : le globe 3D se fige sous la feuille et reprend à sa fermeture. Même signal que la scène d’activité
     (ocean-map.js : pause seulement en mode globe, reprise seulement s’il a été figé ; la carte détaillée garde sa pause
     longue). Pause après l’entrée de la feuille, qui laisse voir l’écran dessous pendant son fondu. */
  let frozen=false,freezeT=0;
  function freeze(on){
    clearTimeout(freezeT);if(!!on===frozen)return;frozen=!!on;
    try{document.dispatchEvent(new CustomEvent('ocean:transition',{detail:frozen}));}catch(_){}
    /* Retour : la vie au repos du globe repart (sans effet si la carte détaillée est affichée). */
    if(!frozen)try{window.OceanMap?.globe?.wake?.();}catch(_){}
  }
  /* Barre Fermer / Partager, collée en haut de la feuille : sombre sur la photo, claire et pleine une fois la photo passée. */
  let barRaf=0;
  function syncBar(){
    barRaf=0;const box=dlg&&$('[data-cult-scroll]',dlg),hero=box&&$('.cult-hero',box),btn=box&&$('.cult-bar>.cult-icon',box);if(!hero||!btn)return;
    btn.parentNode.classList.toggle('is-solid',hero.getBoundingClientRect().bottom<btn.getBoundingClientRect().bottom+6);
  }
  function sheet(){
    if(dlg)return dlg;
    dlg=document.createElement('dialog');dlg.className='cult-sheet';dlg.setAttribute('aria-labelledby','cultTitle');
    dlg.innerHTML='<div class="cult-scroll" data-cult-scroll></div>';
    document.body.append(dlg);
    $('[data-cult-scroll]',dlg).addEventListener('scroll',()=>{if(!barRaf)barRaf=requestAnimationFrame(syncBar);},{passive:true});
    dlg.addEventListener('close',()=>{freeze(false);document.documentElement.classList.remove('cult-open');current=null;const o=opener;opener=null;if(o?.isConnected)try{o.focus({preventScroll:true});}catch(_){}});
    dlg.addEventListener('click',e=>{
      if(e.target.closest('[data-cult-close]')){dlg.close();return;}
      if(e.target.closest('[data-cult-share]')){share(current);return;}
      const sp=e.target.closest('[data-cult-spot]');if(sp){const id=sp.dataset.cultSpot;dlg.close();if(typeof openSpot==='function')openSpot(id);return;}
      const all=e.target.closest('[data-cult-all]');if(all){const c=all.dataset.cultAll;dlg.close();explore(c);return;}
    });
    return dlg;
  }
  function show(html,label){
    const d=sheet(),box=$('[data-cult-scroll]',d);
    box.innerHTML=html;
    if(label)d.setAttribute('aria-label',label);else d.removeAttribute('aria-label');
    if(!d.open){try{d.showModal();}catch(_){d.setAttribute('open','');}freezeT=setTimeout(()=>{if(d.open)freeze(true);},reduced()?0:380);}
    /* Chaque page s’ouvre en haut (la feuille garde sinon la position de la page précédente). */
    box.scrollTop=0;requestAnimationFrame(()=>{box.scrollTop=0;syncBar();});
    document.documentElement.classList.add('cult-open');
    d.classList.remove('is-in');void d.offsetWidth;d.classList.add('is-in');
    $('.cult-close',d)?.focus({preventScroll:true});
  }
  /* Explorer : la liste des spots du pays (même parcours qu’en touchant le pays dans Explorer). */
  function explore(c){
    try{
      if(typeof go==='function')go('spots');
      /* Même parcours qu’à la main : le continent du pays, puis le pays (la France a son propre monde). */
      const w=c==='France'?'fr':data?.[c]?.w||'all';
      if(typeof openWorld==='function')openWorld(w);
      if(w==='fr')return;
      if(typeof openCountry==='function')openCountry(c);
    }catch(_){}
  }
  function srcLink(src){
    if(!Array.isArray(src)||!src[1])return '';
    return `<a class="cult-src" href="${esc(src[1])}" target="_blank" rel="noopener"><span>Source :</span> <span${NT}>${esc(src[0])}</span></a>`;
  }
  function spotCard(x){
    const s=x.s,sports=(s.sports||[]).slice(0,2).map(id=>(typeof SPORTMAP!=='undefined'&&SPORTMAP[id]?.label)||'').filter(Boolean).join(' · ');
    return `<button type="button" class="cult-spot" data-cult-spot="${esc(s.id)}">${x.p?`<img src="${esc(x.p.thumb)}"${window.OceanPhotos?.sharp?.(x.p,'344px')||''} alt="" loading="lazy" decoding="async">`:''}<span><b${NT}>${esc(shortName(s))}</b>${sports?`<small>${esc(sports)}</small>`:''}</span></button>`;
  }
  function pageHTML(c,{fresh=false}={}){
    const e=data?.[c]||{},cv=cover(c),s=read(),list=spotsOf(c),name=local(c);
    const words=[];
    if(e.hello)words.push(`<article class="cult-word"><small>Pour saluer</small><b${NT}>${qw(e.hello[0])}</b>${e.hello[1]?`<p${NT}>${esc(e.hello[1])}</p>`:''}</article>`);
    if(e.thanks)words.push(`<article class="cult-word is-thanks"><small>Pour dire merci</small><b${NT}>${qw(e.thanks.word)}</b><p${NT}>${esc(e.thanks.lang)}</p>${srcLink(e.thanks.src)}</article>`);
    const pic=(f,cls='')=>`<img class="cult-pic${cls}" src="assets/pictos/${f}.webp" alt="" width="44" height="44" loading="lazy" decoding="async">`;
    const next=M.nextCountry(names(),s,c,new Date()),nv=next&&cover(next);
    return `<div class="cult-bar"><button type="button" class="cult-icon cult-close" data-cult-close aria-label="Fermer">${ICON.close}</button>${navigator.share||navigator.clipboard?`<button type="button" class="cult-icon" data-cult-share aria-label="Partager ce pays">${ICON.share}</button>`:''}</div>
      <header class="cult-hero${cv?'':' no-photo'}">
        ${cv?`<img class="cult-hero-img" src="${esc(cv.p.src)}" alt="" decoding="async" fetchpriority="high">`:''}
        <div class="cult-hero-tx">
          <span class="cult-kicker">Tour du monde des cultures</span>
          <h1 id="cultTitle"${NT}>${esc(name)}</h1>
          ${e.langs?`<p class="cult-langs"${NT}>${esc(e.langs)}</p>`:''}
          ${cv?`<button type="button" class="cult-photo-of" data-cult-spot="${esc(cv.s.id)}"><span>Photo :</span> <span${NT}>${esc(shortName(cv.s))}</span></button>`:''}
        </div>
        ${s.stamps[c]?stampHTML(c,s.stamps[c],{big:true,fresh}):''}
      </header>
      <div class="cult-body">
        ${words.length?`<section class="cult-words${words.length===1?' is-one':''}" aria-label="Les mots pour commencer">${words.join('')}</section>`:''}
        ${e.baseSrc&&(e.hello||e.langs)?`<p class="cult-base-src">${srcLink(e.baseSrc)}</p>`:''}
        ${e.sea?`<section class="cult-block cult-sea">${pic('pictos/bateau')}<div><small class="cult-label">La mer et ses traditions</small><h2${NT}>${esc(e.sea.title)}</h2><p${NT}>${esc(e.sea.text)}</p>${srcLink(e.sea.src)}</div></section>`:''}
        ${e.fete?`<section class="cult-block cult-fete"><div class="cult-when">${pic('guide/g-calendar')}<b${NT}>${esc(e.fete.when)}</b></div><div><small class="cult-label">Une fête à vivre</small><h2${NT}>${esc(e.fete.title)}</h2><p${NT}>${esc(e.fete.text)}</p>${srcLink(e.fete.src)}</div></section>`:''}
        ${e.food||e.respect?`<section class="cult-pair">
          ${e.food?`<article class="cult-tile">${pic('guide/g-food')}<div><small class="cult-label">À goûter sur place</small><b${NT}>${esc(e.food[0])}</b>${e.food[1]?`<p${NT}>${esc(e.food[1])}</p>`:''}</div></article>`:''}
          ${e.respect?`<article class="cult-tile">${pic('guide/g-respect')}<div><small class="cult-label">Le bon geste</small><p${NT}>${esc(e.respect)}</p></div></article>`:''}
        </section>`:''}
        ${list.length?`<section class="cult-spots" aria-label="Les spots du pays"><div class="cult-spots-head"><h2>Les spots du pays</h2>${list.length>1?`<button type="button" data-cult-all="${esc(c)}">${list.length} spots</button>`:''}</div>
          <div class="cult-spots-rail">${list.slice(0,10).map(spotCard).join('')}</div></section>`:''}
        ${next?`<button type="button" class="cult-next" data-cult-open="${esc(next)}" data-cult-from="next">${nv?`<img src="${esc(nv.p.thumb)}" alt="" loading="lazy" decoding="async">`:''}<span><small>Prochaine escale</small><b${NT}>${esc(local(next))}</b>${word(next)?`<em${NT}>${qw(word(next))}</em>`:''}</span></button>`:''}
        ${api.reviewed&&(e.sea||e.fete||e.thanks||e.baseSrc)?`<p class="cult-foot">Faits culturels relus le <span${NT}>${esc(new Date(api.reviewed+'T12:00:00').toLocaleDateString(LG(),{day:'numeric',month:'long',year:'numeric'}))}</span> sur les pages citées. Le bonjour, le plat et le bon geste viennent du carnet de voyage Ocean Buddy.</p>`:''}
      </div>`;
  }
  function open(c,{from='',opener:o=null}={}){
    return load().then(()=>{
      /* Pays connu seulement (propriété propre) : un lien #culture=constructor ouvrait une page « Object ». */
      if(typeof c!=='string'||!Object.prototype.hasOwnProperty.call(data,c))return;
      const isNew=addStamp(c);
      if(o&&!(dlg&&dlg.contains(o)))opener=o;else if(!dlg?.open)opener=document.activeElement;
      current=c;show(pageHTML(c,{fresh:isNew}));
      if(isNew){buzz([10,40,18]);const n=M.count(read(),names());say(`Nouveau tampon : ${local(c)} (${n}/${names().length})`);}
      void from;
    });
  }
  /* Carnet de tampons : tous les pays, par continent ; les pays tamponnés portent leur tampon et sa date. */
  const WORLDS=[['eu','Europe'],['af','Afrique'],['as','Asie'],['oc','Océanie'],['na','Amérique du Nord'],['sa','Amérique du Sud']];
  function indexHTML(){
    const s=read(),all=names(),n=M.count(s,all),pct=all.length?Math.round(n/all.length*100):0;
    const by=new Map(WORLDS.map(([k])=>[k,[]]));
    /* Dans chaque continent, les pays tamponnés d’abord (du plus récent au plus ancien), puis les autres par nom. */
    for(const c of all.sort((a,b)=>(s.stamps[b]||'').localeCompare(s.stamps[a]||'')||local(a).localeCompare(local(b),LG()))){const w=data?.[c]?.w==='fr'?'eu':data?.[c]?.w||'eu';(by.get(w)||by.get('eu')).push(c);}
    const item=c=>{const cv=cover(c),on=!!s.stamps[c];return `<button type="button" class="cult-ix${on?' is-on':''}" data-cult-open="${esc(c)}" data-cult-from="index"${NT}>${cv?`<img src="${esc(cv.p.thumb)}" alt="" loading="lazy" decoding="async">`:'<i></i>'}<span><b>${esc(local(c))}</b>${word(c)?`<em>${qw(word(c))}</em>`:''}</span>${on?stampHTML(c,s.stamps[c]):''}</button>`;};
    return `<div class="cult-bar is-solid is-ix"><button type="button" class="cult-icon cult-close" data-cult-close aria-label="Fermer">${ICON.close}</button></div>
      <header class="cult-ixhead">
        <span class="cult-kicker">Tour du monde des cultures</span>
        <h1 id="cultTitle">Mes tampons</h1>
        <p class="cult-ixcount"><b>${n}</b><span>/${all.length}</span> <span>pays découverts</span></p>
        <div class="cult-bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${n}" aria-label="Pays découverts"><i style="width:${pct}%"></i></div>
        <p class="cult-ixhint">Un tampon par pays : ouvre sa page ou trouve le mot du jour.</p>
      </header>
      <div class="cult-body cult-ixbody">${WORLDS.map(([k,label])=>{const l=by.get(k);if(!l?.length)return '';const m=l.filter(c=>s.stamps[c]).length;return `<section class="cult-ixsec"><h2>${esc(label)} <small${NT}>${m}/${l.length}</small></h2><div class="cult-ixgrid">${l.map(item).join('')}</div></section>`;}).join('')}</div>`;
  }
  function openIndex(o){
    return load().then(()=>{if(o)opener=o;current=null;show(indexHTML());fitIndex();});
  }
  /* Carnet : le nom du pays se lit en entier, jamais « … » (« SAINT VINCENT AND THE GRENADINES », « ISLAS VÍRGENES DE LOS
     ESTADOS UNIDOS »). Mesuré une fois posé (texte dans la langue affichée, polices chargées) : corps réduit sur une ligne
     (data-fit 1, 2 : la carte garde sa hauteur), sinon deux lignes (3, 4). cultures.css, .cult-ix b[data-fit]. */
  function fitIndex(){
    /* Dépassement d’une fraction de pixel compris (« UNITED ARAB EMIRAT… » : scrollWidth arrondi égal à clientWidth) : largeur
       réelle du texte comparée à celle de la boîte. */
    const over=el=>{if(el.scrollWidth>el.clientWidth)return true;try{const r=document.createRange();r.selectNodeContents(el);return r.getBoundingClientRect().width>el.getBoundingClientRect().width+.05;}catch(e){return false;}};
    const run=()=>{try{document.querySelectorAll('.cult-ix>span:not(.cult-stamp)>b').forEach(b=>{b.removeAttribute('data-fit');for(let i=1;i<=4&&over(b);i++)b.dataset.fit=String(i);});}catch(e){}};
    const next=f=>typeof requestAnimationFrame==='function'?requestAnimationFrame(f):setTimeout(f,0);
    next(run);
    try{document.fonts&&document.fonts.ready.then(()=>next(run));}catch(e){}
  }
  async function share(c){
    if(!c||!data?.[c])return;
    const e=data[c],PUBLIC='https://oceanbuddy.app/';
    const base=/^https?:$/.test(location.protocol)&&!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?location.origin+location.pathname:PUBLIC;
    const url=base+'#culture='+encodeURIComponent(c);
    const text=[e.name,e.hello?qt(e.hello[0]):'',e.thanks?qt(e.thanks.word):''].filter(Boolean).join(' · ');
    try{
      if(navigator.share){await navigator.share({title:e.name,text,url});return;}
      await navigator.clipboard.writeText(text+' '+url);say('Lien du pays copié !');
    }catch(err){if(err?.name!=='AbortError')say('Partage impossible sur cet appareil.');}
  }

  /* ---------- Profil : « Cultures découvertes » ---------- */
  function renderPassport(){
    const profile=$('#profile');if(!profile)return;
    let card=$('#cultPassport');
    if(!card){
      const pp=$('#oceanPassport');if(!pp)return;
      card=document.createElement('section');card.id='cultPassport';card.className='cult-pp';card.setAttribute('aria-label','Cultures découvertes');
      pp.after(card);
    }
    const s=read(),all=names(),n=M.count(s,all),last=M.recent(s,6),pct=all.length?Math.max(n?3:0,Math.round(n/all.length*100)):0;
    card.innerHTML=`<div class="cult-pp-head"><div><small>Tour du monde des cultures</small><h2>Cultures découvertes</h2></div><p class="cult-pp-count"><b>${n}</b><span>/${all.length}</span></p></div>
      <div class="cult-bar-track" aria-hidden="true"><i style="width:${pct}%"></i></div>
      ${last.length?`<div class="cult-pp-stamps">${last.map(x=>`<button type="button" class="cult-pp-stamp" data-cult-open="${esc(x.country)}" data-cult-from="passport" aria-label="${esc(local(x.country))}"${NT}>${stampHTML(x.country,x.date)}</button>`).join('')}</div>`
        :`<p class="cult-pp-empty">Ouvre la page d’un pays ou trouve le mot du jour : ton premier tampon t’attend.</p>`}
      <button type="button" class="cult-pp-go" data-cult-index>Voir mon carnet de tampons</button>`;
  }
  const origProfile=window.renderProfile;
  if(typeof origProfile==='function'&&!origProfile._cult){const w=function(...a){const r=origProfile.apply(this,a);try{renderPassport();}catch(e){console.warn(e);}return r;};w._cult=true;window.renderProfile=w;}

  /* ---------- Explorer : bandeau « Découvrir <pays> » (destination ou recherche) ---------- */
  let labels=null;
  function countryLabels(){
    if(labels||!data)return labels;
    labels={};for(const [k,c] of Object.entries(data))labels[k]=[c.name];
    return labels;
  }
  function wanted(){
    const country=typeof spotCountry!=='undefined'&&spotCountry?spotCountry:null;
    if(country&&data?.[country])return country;
    const q=typeof currentSearch==='string'?currentSearch:'';
    return q&&data?M.matchCountry(q,countryLabels()):null;
  }
  function syncBanner(){
    const list=$('#spotList');if(!list||!data)return;
    const c=wanted();let el=$('#cultExplore');
    if(!c){if(el)el.hidden=true;return;}
    if(!el){el=document.createElement('button');el.type='button';el.id='cultExplore';el.className='cult-ex';el.dataset.cultFrom='search';list.before(el);}
    if(el.dataset.cultOpen!==c||el.hidden){
      const cv=cover(c),e=data[c],w=[e.hello?.[0],e.thanks?.word].filter(Boolean);
      el.dataset.cultOpen=c;
      el.innerHTML=`${cv?`<img src="${esc(cv.p.thumb)}" alt="" loading="lazy" decoding="async">`:''}<span><small>Tour du monde des cultures</small><b${NT}>${esc(api.discover(c,LG(),local(c)))}</b>${w.length?`<em${NT}>${w.map(qw).join(' · ')}</em>`:''}</span>${stamped(c)?'<i class="cult-ex-ok" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></i>':''}`;
      el.hidden=false;
    }
  }

  /* ---------- Démarrage (après la levée du rideau) ---------- */
  let started=false;
  function start(){
    if(started)return;started=true;
    load().then(()=>{
      fillHome();renderPassport();syncBanner();
      const list=$('#spotList');if(list)new MutationObserver(()=>syncBanner()).observe(list,{childList:true});
      $('#spotSearch')?.addEventListener('input',()=>setTimeout(syncBanner,0));
    }).catch(()=>{
      /* Hors connexion sur le site : le jeu l’indique, sans changer la hauteur de la carte (qui reste à remplir) ;
         au retour du réseau, un seul nouvel essai remplit les mots et le jeu sur place (fillHome). */
      started=false;api.offline?.();api.whenOnline?.(start);
    });
  }
  /* Changement de jour pendant que l’app reste ouverte : le jeu de la veille laisse place au nouveau mot. */
  document.addEventListener('visibilitychange',()=>{if(document.hidden||!data)return;const d=M.dayKey(new Date());if(quizCache&&quizCache.d!==d){const body=$('[data-cult-quiz-body]');if(body){const t=document.createElement('div');t.innerHTML=quizHTML();body.replaceWith(t.firstElementChild);fitDone();syncMeta();}}});

  window.addEventListener('resize',()=>{if(document.querySelector('.cult-quiz-go,.cult-choice'))fitDone();});
  window.addEventListener('resize',()=>{if(document.querySelector('dialog.cult-sheet[open] .cult-ix'))fitIndex();});
  api._view={word,stamped,fillHome,quizHTML,choose,open,openIndex,start,load,renderPassport,fitDone};
  start();
})();
