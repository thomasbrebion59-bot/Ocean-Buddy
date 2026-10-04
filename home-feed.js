/* Ocean Buddy 1.3 — accueil « envies de départ ».
   La vraie Terre en ouverture, puis des rails de photos : les spots dont c’est la meilleure saison
   ce mois-ci (data/seasons.json, tiré des carnets de destination) et des collections construites
   à partir du catalogue (activités, niveau, latitude, description). Les rails changent chaque jour ;
   un spot n’apparaît qu’une fois sur la page. Seules les vraies photos servent de couverture. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const home=$('#home');if(!home||typeof SPOTS==='undefined')return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.documentElement.lang||'fr';
  const monthName=(m,style='long')=>new Intl.DateTimeFormat(lang(),{month:style}).format(new Date(2026,m,15));

  /* Photo réelle de couverture (les illustrations restent sur la fiche, où elles sont signalées). */
  function photo(s){
    const p=window.OceanPhotos?.lead?.(s.id,null)||window.SPOT_PHOTOS?.[s.id]||s.photo;
    if(!p||p.ai||!p.src)return null;
    return {src:p.src,thumb:p.thumb||p.src,w:p.width||0};
  }
  /* Saison : mois consécutifs regroupés, « Toute l’année » si les 12 mois. */
  function seasonLabel(ms){
    if(!ms?.length)return '';
    if(ms.length===12)return 'Toute l’année';
    const set=new Set(ms),runs=[];
    let start=ms.find(m=>!set.has((m+11)%12));
    if(start==null)return 'Toute l’année';
    const seen=new Set();
    for(const m0 of ms){
      if(seen.has(m0)||set.has((m0+11)%12))continue;
      let m=m0;const run=[m];seen.add(m);
      while(set.has((m+1)%12)&&!seen.has((m+1)%12)){m=(m+1)%12;run.push(m);seen.add(m);}
      runs.push(run);
    }
    return runs.map(r=>r.length===1?monthName(r[0],'short'):`${monthName(r[0],'short')} → ${monthName(r[r.length-1],'short')}`).join(' · ');
  }
  /* Tirage du jour : stable dans la journée, différent le lendemain. */
  function daily(list,salt){
    const d=new Date(),seed0=(d.getFullYear()*372+d.getMonth()*31+d.getDate())*97+salt.length*131+salt.charCodeAt(0);
    let seed=seed0%2147483647||7;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
    return list.map(x=>({x,k:rnd()})).sort((a,b)=>a.k-b.k).map(o=>o.x);
  }
  function pick(list,{n=10,perCountry=2,used}){
    const out=[],per=new Map();
    for(const s of list){
      if(out.length>=n)break;if(used.has(s.id))continue;
      const c=s.country||'';if((per.get(c)||0)>=perCountry)continue;
      per.set(c,(per.get(c)||0)+1);out.push(s);
    }
    out.forEach(s=>used.add(s.id));return out;
  }
  const text=s=>`${s.name} ${s.desc||''} ${s.anecdote||''}`.toLowerCase();
  const has=(s,...ids)=>(s.sports||[]).some(a=>ids.includes(a));
  const lat=s=>(COORDS[s.id]||s.coords||{}).lat??0;
  const sportLabel=id=>(typeof SPORTMAP!=='undefined'&&SPORTMAP[id]?.label)||'';

  const COLLECTIONS=[
    {id:'lagons',title:'Lagons et eaux turquoise',sub:'Masque, tuba et une eau d’une clarté folle.',
      test:s=>has(s,'snorkeling','baignade','plongee')&&/lagon|turquoise|cristal|transparen|atoll|translucide/.test(text(s))},
    {id:'legendes',title:'Vagues de légende',sub:'Les spots qui ont écrit l’histoire du surf.',
      test:s=>has(s,'surf')&&(s.level==='expert'||/mythique|l[ée]gend|championnat|wsl|classe mondiale|c[ée]l[èe]bre|tube/.test(text(s)))},
    {id:'plongees',title:'Plongées inoubliables',sub:'Épaves, raies manta, tortues et tombants.',
      test:s=>has(s,'plongee')&&/[ée]pave|manta|requin|tortue|tombant|baleine|dauphin|m[ée]rou|raie/.test(text(s))},
    {id:'nord',title:'L’été au frais',sub:'Fjords, falaises et eau vive : la tendance des « coolcations ».',
      test:s=>lat(s)>=51||lat(s)<=-44},
    {id:'debut',title:'Pour débuter en douceur',sub:'Des conditions accueillantes pour te lancer.',
      test:s=>s.level==='debutant'&&has(s,'surf','paddle','baignade','snorkeling','kayak')},
    {id:'iles',title:'Îles du bout du monde',sub:'Loin, très loin… et tellement beau.',
      test:s=>['oc','as','af','sa'].includes(s.world)&&/\b[îi]le|atoll|archipel/.test(text(s))}
  ];

  let seasons=null,scores=null,built=false;
  /* Éclat de la photo (data/photo-scores.json) : les rails commencent par les images les plus lumineuses et colorées. */
  const vib=id=>scores?.[id]??55;
  const bright=list=>list.map((x,i)=>({x,i,k:Math.round(vib(x.id)/20)})).sort((a,b)=>b.k-a.k||a.i-b.i).map(o=>o.x);
  function card(s,{big=false,season=null}={}){
    const p=photo(s);if(!p)return '';
    const acts=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');
    const fav=typeof favs!=='undefined'&&favs.has(s.id);
    return `<article class="hf-card${big?' big':''}" data-spot="${esc(s.id)}" role="listitem" tabindex="0" aria-label="${esc(s.name)}, ${esc(s.country||'')}">
      <img src="${esc(big?p.src:p.thumb)}" alt="" loading="lazy" decoding="async">
      <button type="button" class="hf-fav${fav?' on':''}" data-fav="${esc(s.id)}" aria-label="${fav?'Retirer des favoris':'Ajouter aux favoris'} : ${esc(s.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg></button>
      <div class="hf-card-tx">
        <small>${esc(s.country||s.loc||'')}</small>
        <h3>${esc(String(s.name).split(' — ')[0])}</h3>
        <p>${season?`<span class="hf-season">${esc(season)}</span>`:''}${acts?`<span>${esc(acts)}</span>`:''}</p>
      </div>
    </article>`;
  }
  function rail(id,title,sub,items,opts={}){
    const cards=items.map(s=>card(s,{big:opts.big,season:opts.season?seasonLabel(seasons?.[s.id]):null})).filter(Boolean);
    if(cards.length<3)return '';
    return `<section class="hf-sec" data-hf="${id}" aria-label="${esc(title)}">
      <div class="as-sec"><h2>${esc(title)}<small>${esc(sub)}</small></h2>${opts.more?`<button type="button" data-hf-more="${id}">Tout voir</button>`:''}</div>
      <div class="hf-rail${opts.big?' big':''}" role="list">${cards.join('')}</div>
    </section>`;
  }

  /* Ouverture : des spots de rêve en grand (vraies photos), une recherche et les activités en pastilles. */
  const HERO_IDS=['rajaampat','borabora','noronha','navagio','whitehaven','macarella','tikehau','myrtos','nusapenida','trunkbay','pelosa','losroques'];
  function heroSpots(){
    const list=HERO_IDS.map(id=>SPOTS.find(s=>s.id===id)).filter(s=>s&&photo(s));
    const start=new Date().getDate()%Math.max(1,list.length);
    return list.slice(start).concat(list.slice(0,start)).slice(0,8);
  }
  function hero(){
    const n=SPOTS.length,slides=heroSpots();
    const acts=(typeof SPORTS!=='undefined'?SPORTS:[]).map(a=>`<button type="button" class="hf-act" data-hf-act="${esc(a.id)}">${window.PoulpyIcons?.html?window.PoulpyIcons.html(a.id,'hf-act-ic'):''}<span>${esc(a.label)}</span></button>`).join('');
    return `<section class="hf-top" aria-label="Trouve ton spot">
      <button type="button" class="hf-search" data-hf-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span><b>Où veux-tu aller ?</b><small>${n} spots · plages, lagons, vagues, récifs</small></span></button>
      <div class="hf-acts" role="list" aria-label="Activités">${acts}</div>
      <div class="hf-hero" data-hf-hero>
        <div class="hf-slides" role="list">${slides.map((s,i)=>{const p=photo(s),a=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');return `<article class="hf-slide" role="listitem" data-spot="${esc(s.id)}" aria-label="${esc(String(s.name).split(' — ')[0])}, ${esc(s.country||'')}">
          <img src="${esc(p.src)}" alt="" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async">
          <div class="hf-slide-tx"><span class="hf-kicker">Spot de rêve · ${i+1}/${slides.length}</span><h2>${esc(String(s.name).split(' — ')[0])}</h2><p>${esc(s.country||s.loc||'')}${a?` · ${esc(a)}`:''}</p>
          <button type="button" class="hf-go" data-hf-open="${esc(s.id)}">Découvrir ce spot<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h13"/><path d="M12.5 6 19 12l-6.5 6"/></svg></button></div>
        </article>`;}).join('')}</div>
        <div class="hf-dots" aria-hidden="true">${slides.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</div>
      </div>
    </section>`;
  }
  /* Envies du moment : quatre grandes tuiles photo qui mènent aux collections. */
  const MOOD_COVER={lagons:'whitehaven',legendes:'teahupoo',plongees:'ermitage',iles:'tikehau',nord:'lofoten',debut:'macarella'};
  function moods(feed){
    const tiles=[];
    for(const id of ['lagons','legendes','plongees','iles','nord','debut']){
      const sec=feed.querySelector(`[data-hf="${id}"]`);if(!sec)continue;
      const first=sec.querySelector('.hf-card img'),title=sec.querySelector('.as-sec h2')?.firstChild?.textContent||'',n=sec.querySelectorAll('.hf-card').length;
      /* Couverture choisie à la main (la plus belle photo de l’ambiance), sinon la première carte. */
      const pick=MOOD_COVER[id]&&SPOTS.find(x=>x.id===MOOD_COVER[id]),cover=(pick&&photo(pick)?.thumb)||first?.getAttribute('src');
      if(cover)tiles.push(`<button type="button" class="hf-mood" data-hf-jump="${id}"><img src="${esc(cover)}" alt="" loading="lazy" decoding="async"><b>${esc(title)}</b><small>${n} spots</small></button>`);
      if(tiles.length===4)break;
    }
    if(tiles.length<4)return '';
    return `<section class="hf-moods" aria-label="Envies du moment"><div class="as-sec"><h2>Envies du moment<small>Choisis une ambiance, on te montre où aller.</small></h2></div><div class="hf-mood-grid">${tiles.join('')}</div></section>`;
  }
  /* Carte du monde : chaque spot est un point lumineux sur la vraie carte (NASA), une invitation à explorer. */
  function worldCard(){
    return `<section class="hf-world" aria-label="La carte du monde des spots">
      <div class="hf-world-map"><img src="assets/globe/earth-map.webp" alt="" loading="lazy" decoding="async"><canvas aria-hidden="true"></canvas></div>
      <div class="hf-world-tx"><span class="hf-kicker">La carte du monde</span><h2>${SPOTS.length} spots, 6 continents.</h2><p>Fais tourner la planète et pose ton doigt sur ton prochain voyage.</p>
      <button type="button" class="hf-world-go" data-hf-go="spots">Explorer la carte<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h13"/><path d="M12.5 6 19 12l-6.5 6"/></svg></button></div>
    </section>`;
  }
  function drawWorld(){
    const c=home.querySelector('.hf-world canvas');if(!c)return;
    const r=c.getBoundingClientRect();if(!r.width)return;
    const d=Math.min(3,devicePixelRatio||1);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);
    const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
    for(const s of SPOTS){const k=COORDS[s.id];if(!k)continue;const x=(k.lon+180)/360*c.width,y=(84-k.lat)/142*c.height;if(y<0||y>c.height)continue;
      g.fillStyle='rgba(224,255,145,.22)';g.beginPath();g.arc(x,y,4.2*d,0,7);g.fill();
      g.fillStyle='#e0ff91';g.beginPath();g.arc(x,y,1.5*d,0,7);g.fill();}
  }
  /* Carrousel : glisser, ou défilement automatique toutes les 6 s (sauf mouvement réduit ou après un geste). */
  let heroTimer=0,lastTouch=0;
  function bindHero(){
    const box=home.querySelector('[data-hf-hero]'),track=box?.querySelector('.hf-slides');if(!track||track.dataset.bound)return;
    track.dataset.bound='1';
    const dots=[...box.querySelectorAll('.hf-dots i')];
    const index=()=>Math.round(track.scrollLeft/Math.max(1,track.clientWidth));
    /* Fond d’ambiance : la photo du spot affiché, très floutée, colore le haut de l’accueil. */
    let amb=home.querySelector('.hf-ambient');
    if(!amb){amb=document.createElement('div');amb.className='hf-ambient';amb.setAttribute('aria-hidden','true');amb.innerHTML='<img alt=""><img alt="">';home.prepend(amb);}
    let shown=-1,layer=0;
    const ambient=i=>{if(i===shown)return;shown=i;const img=track.children[i]?.querySelector('img');if(!img)return;const els=amb.querySelectorAll('img');layer=1-layer;els[layer].src=img.currentSrc||img.src;els[layer].classList.add('on');els[1-layer].classList.remove('on');};
    ambient(0);
    track.addEventListener('scroll',()=>{const i=index();dots.forEach((d,k)=>d.classList.toggle('on',k===i));clearTimeout(ambient.t);ambient.t=setTimeout(()=>ambient(index()),120);},{passive:true});
    ['pointerdown','touchstart','wheel'].forEach(t=>track.addEventListener(t,()=>{lastTouch=Date.now();},{passive:true}));
    clearInterval(heroTimer);
    heroTimer=setInterval(()=>{
      if(document.hidden||body().dataset.screen!=='home'||Date.now()-lastTouch<9000||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion'))return;
      const i=(index()+1)%dots.length;track.scrollTo({left:i*track.clientWidth,behavior:'smooth'});
    },6000);
  }
  const body=()=>document.body;

  function render(){
    const used=new Set();
    const pool=bright(daily(SPOTS.filter(s=>photo(s)),'pool'));
    const m=new Date().getMonth();
    let html='';
    if(seasons){
      /* Saison qui commence ce mois-ci d’abord, puis saison en cours ; les saisons courtes passent devant « toute l’année ». */
      const inSeason=pool.filter(s=>seasons[s.id]?.includes(m));
      /* Les photos en haute définition passent devant (plus belles en grand format). */
      const score=s=>{const ms=seasons[s.id];return (ms.length===12?2:0)+(ms.includes((m+11)%12)?1:0)+ms.length/24+((photo(s)?.w||0)>=1200?0:1.5)+(100-vib(s.id))/25;};
      const ordered=inSeason.map(s=>({s,k:score(s)})).sort((a,b)=>a.k-b.k).map(o=>o.s);
      html+=rail('mois',`Où partir en ${monthName(m)} ?`,'C’est la meilleure saison pour ces spots.',pick(ordered,{n:10,perCountry:1,used}),{big:true,season:true,more:true});
    }
    for(const c of COLLECTIONS){
      const items=pick(pool.filter(c.test),{n:10,perCountry:2,used});
      html+=rail(c.id,c.title,c.sub,items,{season:!!seasons});
    }
    return html;
  }

  /* Ordre : titre, Terre, cockpit (série, favoris), rails ; les activités et l’immersion après deux rails.
     ocean-home.js range aussi l’accueil (au chargement et 1,5 s après) : on repasse derrière lui. */
  function order(){
    const large=$('.as-large',home),heroEl=$('.hf-top',home),hub=$('#oceanHub',home),feed=$('.hf-feed',home);
    if(!heroEl||!feed)return;
    if(large&&large.nextElementSibling!==heroEl)large.after(heroEl);
    if(heroEl.nextElementSibling!==feed)heroEl.after(feed);
    /* Le cockpit (série, favoris, reprendre) vient après les envies du moment. */
    const anchor=feed.querySelector('.hf-moods')||feed.querySelector('.hf-sec');
    if(hub&&anchor&&anchor.nextElementSibling!==hub)anchor.after(hub);
    const acts=$('.poulpy-activities',home),intro=$('.home-intro',home),dive=$('#obDive',home);
    let tail=feed.querySelector('.hf-world')||feed.querySelectorAll('.hf-sec')[1]||feed.lastElementChild;
    const after=(el)=>{if(!el)return;if(tail&&tail.nextElementSibling!==el)tail.after(el);tail=el;};
    if(tail&&tail.parentElement===feed){const rest=[...feed.children].slice([...feed.children].indexOf(tail)+1).filter(el=>el!==hub);after(acts);after(intro);after(dive);rest.forEach(after);}
  }
  function mount(){
    if(!$('.hf-top',home)){
      const tmp=document.createElement('div');tmp.innerHTML=hero();
      ($('.as-large',home)||home.firstElementChild)?.after(tmp.firstElementChild);
      home.classList.add('hf-on');
    }
    let feed=$('.hf-feed',home);
    if(!feed){feed=document.createElement('div');feed.className='hf-feed';$('.hf-top',home).after(feed);}
    /* Les sections placées entre les rails (activités, immersion) sortent du fil avant le nouveau rendu. */
    for(const el of [$('#oceanHub',home),$('#obDive',home),$('.home-intro',home),$('.poulpy-activities',home)])if(el&&feed.contains(el))feed.after(el);
    feed.innerHTML=render();
    /* Envies du moment juste après le premier rail, la carte du monde après le deuxième. */
    const firstRail=feed.querySelector('.hf-sec');const mm=document.createElement('div');mm.innerHTML=moods(feed);if(mm.firstElementChild)(firstRail||feed.firstElementChild)?.after(mm.firstElementChild);
    /* La carte du monde vient après les deux premiers rails. */
    const second=feed.querySelectorAll('.hf-sec')[1];const wc=document.createElement('div');wc.innerHTML=worldCard();(second||feed.lastElementChild)?.after(wc.firstElementChild);
    order();bindHero();requestAnimationFrame(drawWorld);built=true;
  }
  addEventListener('load',()=>setTimeout(order,0),{once:true});
  setTimeout(order,1700);

  /* Interactions : ouvrir un spot, favoris, boutons du héros. */
  home.addEventListener('click',e=>{
    const fav=e.target.closest('[data-fav]');
    if(fav){e.stopPropagation();const id=fav.dataset.fav;if(typeof toggleFav==='function'){toggleFav(id,e);}const on=typeof favs!=='undefined'&&favs.has(id);fav.classList.toggle('on',on);if(typeof vibrate==='function')vibrate(8);return;}
    const more=e.target.closest('[data-hf-more]');
    if(more){
      /* « Tout voir » : la planète n’allume que les spots en saison ce mois-ci. */
      currentFilter='season';document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f==='season'));
      go('spots');try{renderSpots();window.OceanMap?.render?.(true);}catch(_){}
      if(typeof toast==='function')toast(`${SPOTS.filter(s=>inSeason(s.id)).length} spots en saison ce mois-ci`);
      return;
    }
    const jump=e.target.closest('[data-hf-jump]');
    if(jump){const sec=home.querySelector(`[data-hf="${jump.dataset.hfJump}"]`);sec?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
    const search=e.target.closest('[data-hf-search]');
    if(search){document.querySelector('.mobile-search')?.click();return;}
    const act=e.target.closest('[data-hf-act]');
    if(act){if(typeof setSport==='function')setSport(act.dataset.hfAct);return;}
    const open=e.target.closest('[data-hf-open]')||e.target.closest('.hf-slide[data-spot]');
    if(open&&typeof openSpot==='function'){openSpot(open.dataset.hfOpen||open.dataset.spot);return;}
    const go2=e.target.closest('[data-hf-go]');
    if(go2){if(go2.dataset.hfGo==='trips'){go('trips');}else{go('spots');}return;}
    const card=e.target.closest('.hf-card[data-spot]');
    if(card&&typeof openSpot==='function'){openSpot(card.dataset.spot);}
  });
  home.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.hf-card')){e.preventDefault();e.target.click();}});

  Promise.all(['data/seasons.json','data/photo-scores.json'].map(u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null)))
    .then(([d,sc])=>{seasons=d;scores=sc;window.OCEAN_SEASONS=d;mount();});
  mount();
  /* Langue changée : on reconstruit (noms des mois). */
  window.addEventListener('ocean:lang',()=>{if(built)mount();});
  addEventListener('resize',()=>{clearTimeout(drawWorld.t);drawWorld.t=setTimeout(drawWorld,200);});
  window.addEventListener('ocean:navigate',e=>{if(e.detail==='home')requestAnimationFrame(drawWorld);});
  window.OceanHomeFeed={refresh:mount,seasonLabel};
})();
