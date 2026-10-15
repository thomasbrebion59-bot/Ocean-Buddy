/* Ocean Buddy 1.3 — accueil « envies de départ ».
   La vraie Terre en ouverture, puis des rails de photos : les spots dont c’est la meilleure saison
   ce mois-ci (data/seasons.json, tiré des carnets de destination) et des collections construites
   à partir du catalogue (activités, niveau, latitude, description). Les rails changent chaque jour ;
   un spot n’apparaît qu’une fois sur la page. Seules les vraies photos servent de couverture. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const home=$('#home');if(!home||typeof SPOTS==='undefined')return;
  const Boot=window.OceanBoot,wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>document.documentElement.lang||'fr';
  /* Formats mémorisés : un Intl.*Format par langue et par style (et non un par carte). */
  const fmts=new Map(),fmt=(k,make)=>{k=lang()+k;let f=fmts.get(k);if(!f){f=make();fmts.set(k,f);}return f;};
  const monthName=(m,style='long')=>fmt('m'+style,()=>new Intl.DateTimeFormat(lang(),{month:style})).format(new Date(2026,m,15));

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

  let seasons=null,scores=null,built=false,lite=null;
  /* Normales climatiques légères (eau, soleil, houle, vent) : repères chiffrés sur les cartes et rails de données. */
  const LI={sea:0,tx:1,sun:2,wet:3,kite:4,hs:5,calm:6};
  const val=(s,k,m)=>{const r=lite?.[s.id];const a=r&&r[LI[k]];return a?a[m]:null;};
  const DI={sea:'<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',wave:'<path d="M2 15c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2"/><path d="M6 10c1-3 4-5 7-5 2 0 3.6 1 4.6 2.4"/>',wind:'<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>'};
  const num=(v,d=0)=>fmt('n'+d,()=>new Intl.NumberFormat(lang(),{maximumFractionDigits:d,minimumFractionDigits:d})).format(v);
  function dataChip(s,kind){
    const m=new Date().getMonth();let v=null,t='';
    if(kind==='sea'){v=val(s,'sea',m);t=v==null?'':`${num(v)} °C`;}
    else if(kind==='wave'){v=val(s,'hs',m);t=v==null?'':`${num(v/10,1)} m`;}
    else if(kind==='wind'){v=val(s,'kite',m);t=v==null?'':`${num(v)} %`;}
    if(!t)return '';
    return `<span class="hf-data" title="${kind==='sea'?'Eau ce mois-ci':kind==='wave'?'Houle moyenne au large ce mois-ci':'Jours de vent fort ce mois-ci'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${DI[kind]}</svg>${esc(t)}</span>`;
  }
  /* Éclat de la photo (data/photo-scores.json) : les rails commencent par les images les plus lumineuses et colorées. */
  const vib=id=>scores?.[id]??55;
  const bright=list=>list.map((x,i)=>({x,i,k:Math.round(vib(x.id)/20)})).sort((a,b)=>b.k-a.k||a.i-b.i).map(o=>o.x);
  /* Pastilles d’une carte (donnée du mois, saison, activités) : aussi refaites sur place quand les données arrivent tard. */
  function chips(s,data,season){
    const acts=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');
    return `${data?dataChip(s,data):''}${season?`<span class="hf-season">${esc(season)}</span>`:''}${acts?`<span>${esc(acts)}</span>`:''}`;
  }
  function card(s,{big=false,season=null,data=null,wantSeason=false}={}){
    const p=photo(s);if(!p)return '';
    const fav=typeof favs!=='undefined'&&favs.has(s.id);
    return `<article class="hf-card${big?' big':''}" data-spot="${esc(s.id)}"${data?` data-hf-data="${data}"`:''}${wantSeason?' data-hf-season':''} role="listitem" tabindex="0" aria-label="${esc(s.name)}, ${esc(s.country||'')}">
      <img src="${esc(big?p.src:p.thumb)}" alt="" loading="lazy" decoding="async">
      <button type="button" class="hf-fav${fav?' on':''}" data-fav="${esc(s.id)}" aria-label="${fav?'Retirer des favoris':'Ajouter aux favoris'} : ${esc(s.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg></button>
      <div class="hf-card-tx">
        <small>${esc(s.country||s.loc||'')}</small>
        <h3>${esc(String(s.name).split(' — ')[0])}</h3>
        <p>${chips(s,data,season)}</p>
      </div>
    </article>`;
  }
  function rail(id,title,sub,items,opts={}){
    const cards=items.map(s=>card(s,{big:opts.big,season:opts.season?seasonLabel(seasons?.[s.id]):null,data:opts.data||null,wantSeason:!!opts.season})).filter(Boolean);
    if(cards.length<3)return '';
    return `<section class="hf-sec" data-hf="${id}" aria-label="${esc(title)}">
      <div class="as-sec"><h2>${esc(title)}<small>${esc(sub)}</small></h2>${opts.more?`<button type="button" data-hf-more="${id}">Tout voir</button>`:''}</div>
      <div class="hf-rail${opts.big?' big':''}" role="list">${cards.join('')}</div>
    </section>`;
  }

  /* Ouverture : des spots de rêve en grand (vraies photos) et une recherche. Le changement d’activité reste en haut de l’écran. */
  const HERO_IDS=['rajaampat','borabora','noronha','navagio','whitehaven','macarella','tikehau','myrtos','nusapenida','trunkbay','pelosa','losroques'];
  function surfCard(){
    return `<section class="hf-sec hf-plan-sec hf-surf-sec" aria-label="Mini-jeu de surf"><button type="button" class="hf-plan hf-surf" data-surf-game>
      <span class="hf-surf-ic" aria-hidden="true"><svg viewBox="0 0 64 25"><path d="M2 21C12 21 14 6 26 6c9 0 10 8 6 11-3 2-7 0-6-3 1-3 6-3 8 0 2 3 1 7 10 7h20" fill="none" stroke="#e0ff91" stroke-width="3" stroke-linecap="round"/><path d="M2 24h60" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/></svg></span>
      <span class="hf-plan-tx"><small>Nouveau · mini-jeu</small><b>Surfe la vague, même sans réseau</b><span>Choisis ton surfeur ou ta surfeuse, glisse sur la face, entre dans le tube et enchaîne les figures.</span></span>
      <span class="hf-plan-go" aria-hidden="true">→</span></button></section>`;
  }
  function planCard(m){
    return `<section class="hf-sec hf-plan-sec" aria-label="Planifier par mois"><button type="button" class="hf-plan" data-map-plan>
      <span class="hf-plan-cal" aria-hidden="true">${Array.from({length:12},(_,k)=>`<i class="${k===m?'on':''}">${esc(monthName(k,'narrow'))}</i>`).join('')}</span>
      <span class="hf-plan-tx"><small>Nouveau · planificateur</small><b>Choisis ton mois, Poulpy trouve le spot</b><span>Eau chaude, plein soleil, belles vagues ou vent : la planète s’allume là où c’est le bon moment.</span></span>
      <span class="hf-plan-go" aria-hidden="true">→</span></button></section>`;
  }
  function heroSpots(){
    const list=HERO_IDS.map(id=>SPOTS.find(s=>s.id===id)).filter(s=>s&&photo(s));
    const start=new Date().getDate()%Math.max(1,list.length);
    return list.slice(start).concat(list.slice(0,start)).slice(0,8);
  }
  function hero(){
    const n=SPOTS.length,slides=heroSpots();
    return `<section class="hf-top" aria-label="Trouve ton spot">
      <button type="button" class="hf-search" data-hf-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span><b>Où veux-tu aller ?</b><small>${n} spots · plages, lagons, vagues, récifs</small></span></button>
      <div class="hf-hero" data-hf-hero>
        <div class="hf-slides" role="list">${slides.map((s,i)=>{const p=photo(s),a=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');return `<article class="hf-slide" role="listitem" data-spot="${esc(s.id)}" aria-label="${esc(String(s.name).split(' — ')[0])}, ${esc(s.country||'')}">
          <img src="${esc(p.src)}" alt="" ${i?'loading="lazy"':'fetchpriority="high" data-fade="off"'} decoding="async">
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
  /* Planète : la vraie Terre en 3D (même globe que l’explorateur, sans points). La sphère CSS reste en repli
     tant que le globe n’est pas prêt. Le globe se charge quand la carte arrive à l’écran et se met en veille
     dès qu’elle sort. Glisser fait tourner la Terre ; le bouton ouvre l’explorateur. */
  function worldCard(){
    return `<section class="hf-world" aria-label="La planète des spots">
      <div class="hf-world-map"><div class="hf-planet" aria-hidden="true"><div class="hf-planet-tex"></div><i class="hf-planet-shade"></i></div><div class="hf-globe" data-hf-globe></div></div>
      <div class="hf-world-tx"><span class="hf-kicker">La planète des spots</span><h2>${SPOTS.length} spots, 6 continents.</h2><p>Fais tourner la planète et pose ton doigt sur ton prochain voyage.</p>
      <button type="button" class="hf-world-go" data-hf-go="spots">Explorer la planète<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h13"/><path d="M12.5 6 19 12l-6.5 6"/></svg></button></div>
    </section>`;
  }
  /* Globe de l’accueil : une seule instance, créée à l’approche de la carte (jamais avant la levée du rideau),
     mise en veille hors écran. La sphère CSS reste affichée jusqu’à la première image éclairée du globe. */
  let planet=null,planetIO=null,planetBusy=false,planetOn=false;
  function stopPlanet(){
    planetIO?.disconnect();planetIO=null;planetBusy=false;planetOn=false;
    planet?.destroy?.();planet=null;
  }
  function loadPlanet(host){
    if(planetBusy||planet||!window.OceanGlobe?.supported?.())return;
    planetBusy=true;
    window.OceanGlobe.create(host,{lighting:'studio',clouds:false,reveal:false,hd:false,onFirstFrame:()=>{if(host.isConnected)host.closest('.hf-world-map')?.classList.add('is-live');}}).then(api=>{
      planetBusy=false;
      /* Le rendu a été refait entre-temps (langue) : on libère ce globe. */
      if(!host.isConnected){api.destroy();return;}
      planet=api;api.setActive(planetOn&&!document.hidden);
    }).catch(()=>{planetBusy=false;});
  }
  function watchPlanet(){
    if(Boot&&!Boot.lifted)return;
    planetIO?.disconnect();
    const host=home.querySelector('[data-hf-globe]');if(!host||!window.IntersectionObserver)return;
    planetIO=new IntersectionObserver(([e])=>{
      planetOn=!!e?.isIntersecting;
      if(planet)planet.setActive(planetOn&&!document.hidden);
      else if(planetOn)loadPlanet(host);
    },{rootMargin:'240px 0px'});
    planetIO.observe(host);
  }
  document.addEventListener('visibilitychange',()=>{planet?.setActive(planetOn&&!document.hidden);});

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
      if(document.hidden||(Boot&&!Boot.lifted)||body().dataset.screen!=='home'||Date.now()-lastTouch<9000||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion'))return;
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
      html+=rail('mois',`Où partir en ${monthName(m)} ?`,'C’est la meilleure saison pour ces spots.',pick(ordered,{n:10,perCountry:1,used}),{big:true,season:true,more:true,data:'sea'});
    }
    if(lite){
      html+=planCard(m);
      html+=surfCard();
      /* Rails de données : la mer chaude, la houle et le vent du mois, d’après les normales de plusieurs années. */
      const warm=pool.filter(s=>(val(s,'sea',m)??0)>=26).sort((a,b)=>Math.round(vib(b.id)/25)-Math.round(vib(a.id)/25)||val(b,'sea',m)-val(a,'sea',m));
      html+=rail('chaud',`La mer la plus chaude en ${monthName(m)}`,'26 °C et plus d’après les normales NOAA : on y entre sans frissonner.',pick(warm,{n:10,perCountry:1,used}),{data:'sea'});
      const swell=pool.filter(s=>has(s,'surf','bodyboard')&&(val(s,'hs',m)??0)>=14&&(val(s,'hs',m)??0)<=32).sort((a,b)=>val(b,'hs',m)-val(a,'hs',m));
      html+=rail('houle',`Belle houle en ${monthName(m)}`,'Les spots de surf qui reçoivent le plus de vagues ce mois-ci, au large.',pick(swell,{n:10,perCountry:2,used}),{data:'wave',season:true});
      const wind=pool.filter(s=>has(s,'kitesurf','windsurf')&&(val(s,'kite',m)??0)>=60).sort((a,b)=>val(b,'kite',m)-val(a,'kite',m));
      html+=rail('vent',`Du vent en ${monthName(m)}`,'Kite et windsurf : vent soutenu plus d’un jour sur deux.',pick(wind,{n:10,perCountry:2,used}),{data:'wind'});
    }
    for(const c of COLLECTIONS){
      const items=pick(pool.filter(c.test),{n:10,perCountry:2,used});
      html+=rail(c.id,c.title,c.sub,items,{season:true});
    }
    return html;
  }

  /* Ordre : titre, Terre, cockpit (série, favoris), rails ; les activités et l’immersion après deux rails.
     home-feed.js est le seul à ordonner l’accueil, une fois, au montage (sous le rideau de démarrage). */
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
  /* Ouverture (recherche, spots de rêve) : posée dès l’exécution du script pour que sa photo se charge pendant l’attente des données. */
  function mountHero(){
    if($('.hf-top',home))return;
    const tmp=document.createElement('div');tmp.innerHTML=hero();
    ($('.as-large',home)||home.firstElementChild)?.after(tmp.firstElementChild);
    home.classList.add('hf-on');
  }
  function mount(){
    mountHero();
    let feed=$('.hf-feed',home);
    if(!feed){feed=document.createElement('div');feed.className='hf-feed';$('.hf-top',home).after(feed);}
    /* Les sections placées entre les rails (activités, immersion) sortent du fil avant le nouveau rendu. */
    for(const el of [$('#oceanHub',home),$('#obDive',home),$('.home-intro',home),$('.poulpy-activities',home)])if(el&&feed.contains(el))feed.after(el);
    stopPlanet();
    feed.innerHTML=render();
    /* Envies du moment juste après le premier rail, la carte du monde après le deuxième. */
    const firstRail=feed.querySelector('.hf-sec');const mm=document.createElement('div');mm.innerHTML=moods(feed);if(mm.firstElementChild)(firstRail||feed.firstElementChild)?.after(mm.firstElementChild);
    /* La carte du monde vient après les deux premiers rails. */
    const second=feed.querySelectorAll('.hf-sec')[1];const wc=document.createElement('div');wc.innerHTML=worldCard();(second||feed.lastElementChild)?.after(wc.firstElementChild);
    order();bindHero();watchPlanet();built=true;
  }
  /* Données arrivées après le montage : sous le rideau, le fil est remonté (invisible) ; après la levée, seules les
     pastilles des cartes déjà affichées changent, sur place (aucune section ajoutée, retirée ni déplacée). */
  function late(){
    if(!Boot||!Boot.lifted){mount();ready();return;}
    const byId=new Map(SPOTS.map(s=>[s.id,s]));
    home.querySelectorAll('.hf-feed .hf-card[data-spot]').forEach(c=>{
      const s=byId.get(c.dataset.spot),p=c.querySelector('.hf-card-tx p');if(!s||!p)return;
      p.innerHTML=chips(s,c.dataset.hfData||null,c.hasAttribute('data-hf-season')?seasonLabel(seasons?.[s.id]):null);
    });
  }
  /* Accueil prêt : la photo d’ouverture est décodée et les polices des titres chargées (avec un plafond). */
  function settle(){
    const img=home.querySelector('.hf-slide img'),jobs=[img?.decode?img.decode().catch(()=>{}):null];
    if(document.fonts?.load){for(const f of ['900 48px "Barlow Condensed"','800 24px "Barlow Condensed"','700 16px "DM Sans"'])jobs.push(document.fonts.load(f).catch(()=>{}));
      jobs.push(Promise.all(jobs).then(()=>document.fonts.ready));}
    return Promise.race([Promise.all(jobs),wait(1500)]);
  }
  /* Étape « feed » du rideau : terminée seulement quand le dernier montage (remontage sous le rideau compris) est prêt. */
  let gen=0;
  function ready(){const g=++gen;Boot?.wait('feed');return settle().then(()=>{if(g===gen)Boot?.done('feed');});}

  /* Interactions : ouvrir un spot, favoris, boutons du héros. */
  home.addEventListener('click',e=>{
    const fav=e.target.closest('[data-fav]');
    if(fav){e.stopPropagation();const id=fav.dataset.fav;if(typeof toggleFav==='function'){toggleFav(id,e);}const on=typeof favs!=='undefined'&&favs.has(id);fav.classList.toggle('on',on);if(typeof vibrate==='function')vibrate(8);return;}
    const surf=e.target.closest('[data-surf-game]');
    if(surf){go('surf');return;}
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
    const open=e.target.closest('[data-hf-open]')||e.target.closest('.hf-slide[data-spot]');
    if(open&&typeof openSpot==='function'){openSpot(open.dataset.hfOpen||open.dataset.spot);return;}
    const go2=e.target.closest('[data-hf-go]');
    if(go2){if(go2.dataset.hfGo==='trips'){go('trips');}else{go('spots');}return;}
    const card=e.target.closest('.hf-card[data-spot]');
    if(card&&typeof openSpot==='function'){openSpot(card.dataset.spot);}
  });
  home.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.hf-card')){e.preventDefault();e.target.click();}});

  /* Démarrage : un seul montage visible. Saisons, éclat des photos et normales légères sont attendus ensemble
     (au plus jusqu’à 3 s après le début du démarrage), puis le fil est monté une fois et le rideau peut se lever. */
  const data=Promise.all([
    Promise.all(['data/seasons.json','data/photo-scores.json'].map(u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null))).then(([d,sc])=>{seasons=d;scores=sc;window.OCEAN_SEASONS=d;}),
    (window.OceanSpotData?window.OceanSpotData.load('lite'):Promise.reject(Error('lite'))).then(d=>{lite=d;},()=>{})
  ]);
  const have=()=>[!!seasons,!!scores,!!lite].join();
  mountHero();
  Promise.race([data,wait(Boot?Math.max(250,3000-(performance.now()-Boot.t0)):1500)]).then(()=>{
    const got=have();mount();
    data.then(()=>{if(have()!==got)late();});
    return ready();
  }).catch(e=>{setTimeout(()=>{throw e;});Boot?.done('feed');});
  /* Globe et premier défilement automatique : seulement après la levée du rideau. */
  Boot?.after(()=>{lastTouch=Date.now();watchPlanet();});
  /* Langue changée : on reconstruit (noms des mois). */
  window.addEventListener('ocean:lang',()=>{if(built)mount();});
  window.OceanHomeFeed={refresh:mount,seasonLabel};
})();
