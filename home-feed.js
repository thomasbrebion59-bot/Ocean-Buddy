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
    return {src:p.src,thumb:p.thumb||p.src};
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

  let seasons=null,built=false;
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

  function hero(){
    const n=SPOTS.length;
    return `<section class="hf-hero" aria-label="La planète Ocean Buddy">
      <img class="hf-hero-earth" src="assets/globe/earth-hero.webp" alt="La Terre vue de l’espace, avec l’Atlantique, l’Afrique et l’Europe" decoding="async" fetchpriority="high">
      <div class="hf-hero-tx">
        <span class="hf-kicker">${n} spots · 6 continents · 9 activités</span>
        <h2>Prends<br><em>le large.</em></h2>
        <p>La vraie Terre, vue de l’espace. Fais-la tourner, choisis ton spot, pars.</p>
      </div>
      <div class="hf-hero-acts">
        <button type="button" class="hf-go" data-hf-go="spots"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.3 9.5h17.4M3.3 14.5h17.4"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>Explorer la planète</button>
        <button type="button" class="hf-trip" data-hf-go="trips" aria-label="Préparer un voyage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6"/><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6v14M16 6v14"/></svg><span>Préparer un voyage</span></button>
      </div>
      <span class="hf-credit">Image : Ocean Buddy d’après NASA Blue Marble</span>
    </section>`;
  }

  function render(){
    const used=new Set();
    const pool=daily(SPOTS.filter(s=>photo(s)),'pool');
    const m=new Date().getMonth();
    let html='';
    if(seasons){
      /* Saison qui commence ce mois-ci d’abord, puis saison en cours ; les saisons courtes passent devant « toute l’année ». */
      const inSeason=pool.filter(s=>seasons[s.id]?.includes(m));
      const score=s=>{const ms=seasons[s.id];return (ms.length===12?2:0)+(ms.includes((m+11)%12)?1:0)+ms.length/24;};
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
    const large=$('.as-large',home),heroEl=$('.hf-hero',home),hub=$('#oceanHub',home),feed=$('.hf-feed',home);
    if(!heroEl||!feed)return;
    if(large&&large.nextElementSibling!==heroEl)large.after(heroEl);
    let at=heroEl;
    if(hub){if(at.nextElementSibling!==hub)at.after(hub);at=hub;}
    if(at.nextElementSibling!==feed)at.after(feed);
    const acts=$('.poulpy-activities',home),intro=$('.home-intro',home),dive=$('#obDive',home);
    let tail=feed.querySelector('.hf-sec+.hf-sec')||feed.lastElementChild;
    const after=(el)=>{if(!el)return;if(tail&&tail.nextElementSibling!==el)tail.after(el);tail=el;};
    if(tail&&tail.parentElement===feed){const rest=[...feed.children].slice([...feed.children].indexOf(tail)+1);after(acts);after(intro);after(dive);rest.forEach(after);}
  }
  function mount(){
    if(!$('.hf-hero',home)){
      const tmp=document.createElement('div');tmp.innerHTML=hero();
      ($('.as-large',home)||home.firstElementChild)?.after(tmp.firstElementChild);
      home.classList.add('hf-on');
    }
    let feed=$('.hf-feed',home);
    if(!feed){feed=document.createElement('div');feed.className='hf-feed';$('.hf-hero',home).after(feed);}
    /* Les sections placées entre les rails (activités, immersion) sortent du fil avant le nouveau rendu. */
    for(const el of [$('#oceanHub',home),$('#obDive',home),$('.home-intro',home),$('.poulpy-activities',home)])if(el&&feed.contains(el))feed.after(el);
    feed.innerHTML=render();
    order();built=true;
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
    const go2=e.target.closest('[data-hf-go]');
    if(go2){if(go2.dataset.hfGo==='trips'){go('trips');}else{go('spots');}return;}
    const card=e.target.closest('.hf-card[data-spot]');
    if(card&&typeof openSpot==='function'){openSpot(card.dataset.spot);}
  });
  home.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.hf-card')){e.preventDefault();e.target.click();}});

  fetch('data/seasons.json').then(r=>r.ok?r.json():null).then(d=>{seasons=d;window.OCEAN_SEASONS=d;mount();}).catch(()=>mount());
  mount();
  /* Langue changée : on reconstruit (noms des mois). */
  window.addEventListener('ocean:lang',()=>{if(built)mount();});
  window.OceanHomeFeed={refresh:mount,seasonLabel};
})();
