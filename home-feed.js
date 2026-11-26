/* Ocean Buddy 1.3 — accueil « envies de départ ».
   La vraie Terre en ouverture, puis des rails de photos : les spots où nos carnets de destination et les
   moyennes climatiques s’accordent ce mois-ci (data/seasons.json, repère indicatif) et des collections construites
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
  /* Netteté : vignette par défaut, photo entière si l’écran la demande (OceanPhotos.sharp, spot-photos.js). */
  const sharp=(p,sizes)=>window.OceanPhotos&&OceanPhotos.sharp?OceanPhotos.sharp(p,sizes):'';
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
    return runs.map(r=>r.length===1?monthName(r[0],'short'):`${monthName(r[0],'short')} – ${monthName(r[r.length-1],'short')}`).join(' · ');
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
      /* Jauge de danger calculée (app.js) : un spot à 3 ou 4 points ne se recommande pas pour débuter. Sans la jauge, le rail reste tel quel. */
      test:s=>s.level==='debutant'&&has(s,'surf','paddle','baignade','snorkeling','kayak')&&!(window.dangerGauge?.(s)?.n>=3)},
    {id:'iles',title:'Îles du bout du monde',sub:'Loin, très loin… et tellement beau.',
      test:s=>['oc','as','af','sa'].includes(s.world)&&/\b[îi]le|atoll|archipel/.test(text(s))}
  ];

  /* seasons = mois prudents (carnet ∩ modèle climatique − mois à risque sourcés) : un repère indicatif, jamais une prévision. */
  let seasons=null,scores=null,built=false,lite=null;
  /* Normales climatiques légères (eau, soleil, houle, vent) : repères chiffrés sur les cartes et rails de données. */
  const LI={sea:0,tx:1,sun:2,wet:3,kite:4,hs:5,calm:6};
  const val=(s,k,m)=>{const r=lite?.[s.id];const a=r&&r[LI[k]];return a?a[m]:null;};
  const DI={sea:'<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',wave:'<path d="M2 15c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2"/><path d="M6 10c1-3 4-5 7-5 2 0 3.6 1 4.6 2.4"/>',wind:'<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>'};
  const num=(v,d=0)=>fmt('n'+d,()=>new Intl.NumberFormat(lang(),{maximumFractionDigits:d,minimumFractionDigits:d})).format(v);
  function dataChip(s,kind,month){
    const m=month??new Date().getMonth();let v=null,t='';
    /* Unités choisies (OceanUnits : °F, pieds) ; sans le module, le métrique d'avant. */
    const U=window.OceanUnits;
    if(kind==='sea'){v=val(s,'sea',m);t=v==null?'':U?U.show('temp',v):`${num(v)} °C`;}
    else if(kind==='wave'){v=val(s,'hs',m);t=v==null?'':U?U.show('length',v/10):`${num(v/10,1)} m`;}
    else if(kind==='wind'){v=val(s,'kite',m);t=v==null?'':`${num(v)} %`;}
    if(!t)return '';
    return `<span class="hf-data" title="${kind==='sea'?(m===new Date().getMonth()?'Eau ce mois-ci':m===0?'Eau en janvier':'Eau en décembre'):kind==='wave'?'Houle moyenne au large ce mois-ci':'Jours de vent fort ce mois-ci'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${DI[kind]}</svg>${esc(t)}</span>`;
  }
  /* Éclat de la photo (data/photo-scores.json) : les rails commencent par les images les plus lumineuses et colorées. */
  const vib=id=>scores?.[id]??55;
  const bright=list=>list.map((x,i)=>({x,i,k:Math.round(vib(x.id)/20)})).sort((a,b)=>b.k-a.k||a.i-b.i).map(o=>o.x);
  /* Pastilles d’une carte (donnée du mois, saison, activités) : aussi refaites sur place quand les données arrivent tard. */
  function chips(s,data,season,month){
    const acts=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');
    return `${data?dataChip(s,data,month):''}${season?`<span class="hf-season">${esc(season)}</span>`:''}${acts?`<span>${esc(acts)}</span>`:''}`;
  }
  function card(s,{big=false,season=null,data=null,wantSeason=false,month=null}={}){
    const p=photo(s);if(!p)return '';
    const fav=typeof favs!=='undefined'&&favs.has(s.id);
    return `<article class="hf-card${big?' big':''}" data-spot="${esc(s.id)}"${data?` data-hf-data="${data}"`:''}${month!=null?` data-hf-m="${month}"`:''}${wantSeason?' data-hf-season':''} role="listitem" tabindex="0" aria-label="${esc(s.name)}, ${esc(s.country||'')}">
      <img src="${esc(big?p.src:p.thumb)}"${big?'':sharp(p,'432px')} alt="" loading="lazy" decoding="async">
      <button type="button" class="hf-fav${fav?' on':''}" data-fav="${esc(s.id)}" aria-label="${fav?'Retirer des favoris':'Ajouter aux favoris'} : ${esc(s.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg></button>
      <div class="hf-card-tx">
        <small>${esc(s.country||s.loc||'')}</small>
        <h3>${esc(String(s.name).split(' — ')[0])}</h3>
        <p>${chips(s,data,season,month)}</p>
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

  /* Ouverture : une recherche, le choix d’activité, puis des spots de rêve en grand (vraies photos). */
  const HERO_IDS=['rajaampat','borabora','noronha','navagio','whitehaven','macarella','tikehau','myrtos','nusapenida','trunkbay','pelosa','losroques'];
  function surfCard(){
    return `<section class="hf-sec hf-plan-sec hf-surf-sec" aria-label="Mini-jeu de surf"><button type="button" class="hf-plan hf-surf" data-surf-game>
      <span class="hf-surf-ic" aria-hidden="true"><svg viewBox="0 0 64 25"><path d="M2 21C12 21 14 6 26 6c9 0 10 8 6 11-3 2-7 0-6-3 1-3 6-3 8 0 2 3 1 7 10 7h20" fill="none" stroke="#e0ff91" stroke-width="3" stroke-linecap="round"/><path d="M2 24h60" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/></svg></span>
      <span class="hf-plan-tx"><small>Nouveau · mini-jeu</small><b>Surfe la vague, même sans réseau</b><span>Choisis ton surfeur ou ta surfeuse, glisse sur la face, entre dans le tube et enchaîne les figures.</span></span></button></section>`;
  }
  function planCard(m){
    return `<section class="hf-sec hf-plan-sec" aria-label="Planifier par mois"><button type="button" class="hf-plan" data-map-plan>
      <span class="hf-plan-cal" aria-hidden="true">${Array.from({length:12},(_,k)=>`<i class="${k===m?'on':''}">${esc(monthName(k,'narrow'))}</i>`).join('')}</span>
      <span class="hf-plan-tx"><small>Nouveau · planificateur</small><b>Choisis ton mois, Poulpy trouve le spot</b><span>Eau chaude, plein soleil, belles vagues ou vent : la planète s’allume là où c’est le bon moment.</span></span></button></section>`;
  }
  /* Spots de rêve : la sélection du jour (HERO_IDS) pour « Tous » ; pour un sport choisi, des spots de ce sport (la
     sélection d’abord, puis le reste du catalogue, les photos HD devant, tirage du jour, 2 par pays au plus). Moins de
     HERO_MIN spots avec photo pour ce sport : on garde la sélection générale. Le choix est fait à la construction de
     l’accueil, sous le rideau, et ne dépend d’aucune donnée asynchrone (saisons, éclat) : aucun remplacement visible. */
  const HERO_MIN=4;
  function heroSpots(){
    const day=new Date().getDate(),rot=l=>{const k=day%Math.max(1,l.length);return l.slice(k).concat(l.slice(0,k));};
    const base=HERO_IDS.map(id=>SPOTS.find(s=>s.id===id)).filter(s=>s&&photo(s));
    const sp=curSport();
    if(sp!=='all'){
      const mine=base.filter(s=>has(s,sp)),seen=new Set(mine.map(s=>s.id));
      const rest=daily(SPOTS.filter(s=>!seen.has(s.id)&&photo(s)&&has(s,sp)),'hero'+sp);
      const hd=rest.filter(s=>photo(s).w>=1200).concat(rest.filter(s=>photo(s).w<1200));
      const out=[],per=new Map();
      for(const s of rot(mine).concat(hd)){
        if(out.length>=8)break;
        const c=s.country||'';if((per.get(c)||0)>=2)continue;per.set(c,(per.get(c)||0)+1);out.push(s);
      }
      if(out.length>=HERO_MIN)return out;
    }
    return rot(base).slice(0,8);
  }
  /* Choix d’activité : une pastille par activité de SPORTS (plus « Tous »), pictogrammes plats monochromes
     (silhouettes assets/pictos/sports/*-mono.webp en masque, sans mascotte). Rendue avec l’ouverture, sous le rideau : sa hauteur est fixe (CSS)
     et elle n’est jamais insérée après coup. La source de vérité reste activeSport (app.js) ; acts() ne fait que
     relire cet état, syncActs() met à jour les attributs sur place. */
  const curSport=()=>(typeof activeSport!=='undefined'&&activeSport)||'all';
  function actButton(id,label,on){
    const ic=id==='all'?'all':id;
    return `<button type="button" class="hf-act" role="radio" aria-checked="${on}" tabindex="${on?0:-1}" data-hf-act="${esc(id)}"><span class="hf-act-ic" style="--ic:url('assets/pictos/sports/${esc(ic)}-mono.webp')" aria-hidden="true"></span><span class="hf-act-tx">${esc(label)}</span><svg class="hf-act-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>`;
  }
  function acts(){
    const list=typeof SPORTS!=='undefined'?SPORTS:[],cur=curSport();
    return `<div class="hf-acts" role="radiogroup" aria-label="Ton activité">${actButton('all','Tous',cur==='all')}${list.map(a=>actButton(a.id,String(a.label).replace(/\s*\(.*\)/,''),cur===a.id)).join('')}</div>`;
  }
  function syncActs(want){
    const cur=typeof want==='string'?want:curSport();let on=null;
    home.querySelectorAll('.hf-act[data-hf-act]').forEach(b=>{const v=b.dataset.hfAct===cur;if(v)on=b;b.setAttribute('aria-checked',v);b.tabIndex=v?0:-1;});
    /* La pastille choisie reste visible dans la rangée (défilement horizontal seulement, jamais la page). */
    const row=on?.parentElement;
    if(row&&on){const a=on.offsetLeft,w=on.offsetWidth;if(a<row.scrollLeft||a+w>row.scrollLeft+row.clientWidth)row.scrollLeft=Math.max(0,a-16);}
  }
  let heroSport=null;
  function heroBox(){
    const slides=heroSpots();heroSport=curSport();
    return `<div class="hf-hero" data-hf-hero>
        <div class="hf-slides" role="list">${slides.map((s,i)=>{const p=photo(s),a=(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');return `<article class="hf-slide" role="listitem" data-spot="${esc(s.id)}" aria-label="${esc(String(s.name).split(' — ')[0])}, ${esc(s.country||'')}">
          <img src="${esc(p.src)}" alt="" ${i?'loading="lazy"':'fetchpriority="high" data-fade="off"'} decoding="async">
          <div class="hf-slide-tx"><span class="hf-kicker">Spot de rêve · ${i+1}/${slides.length}</span><h2>${esc(String(s.name).split(' — ')[0])}</h2><p>${esc(s.country||s.loc||'')}${a?` · ${esc(a)}`:''}</p>
          <button type="button" class="hf-go" data-hf-open="${esc(s.id)}">Découvrir ce spot</button></div>
        </article>`;}).join('')}</div>
        <div class="hf-dots" aria-hidden="true">${slides.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</div>
      </div>`;
  }
  /* ---------- Raccourcis en un geste (home-layout-model.js) ----------
     Juste sous la recherche : « Mes favoris » (toujours), le dernier spot ouvert et le prochain voyage. La rangée est
     posée avec l’ouverture, sous le rideau, à hauteur fixe (organisation.css) ; ensuite seul son contenu change, sur
     place (retour à l’accueil, cœur touché) : rien ne se décale. */
  const Layout=window.HomeLayout;
  let knownIds=null;
  const known=id=>{if(!knownIds)knownIds=new Set(SPOTS.map(s=>s.id));return knownIds.has(id);};
  const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const QI={
    fav:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg>',
    trip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14l7-2 4-8 2 1-2 7 6 2 1 3-8-1-3 5-2-1 1-5-5 1z"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg>'
  };
  function quickItems(){
    if(!Layout)return [];
    let next=null;try{next=typeof TripModel!=='undefined'&&window.OceanTrips?TripModel.nextTrip(window.OceanTrips.list(),dayKey()):null;}catch(_){}
    return Layout.quick({favs:typeof favs!=='undefined'?favs:[],recent:window.OceanHub?.recent?.()||[],known,next});
  }
  function quickTile(q){
    if(q.kind==='favs'){
      const sub=!q.count?'Aucun pour l’instant':q.count>1?`${q.count} spots`:'1 spot';
      return `<button type="button" class="hf-q" data-hf-q="favs"><span class="hf-q-ic is-fav">${QI.fav}</span><span class="hf-q-tx"><b>Mes favoris</b><small>${esc(sub)}</small></span></button>`;
    }
    if(q.kind==='recent'){
      const s=SPOTS.find(x=>x.id===q.id),p=s&&photo(s);if(!s)return '';
      return `<button type="button" class="hf-q" data-hf-open="${esc(s.id)}" aria-label="Reprendre : ${esc(shortName(s))}"><span class="hf-q-ic${p?' is-photo':''}">${p?`<img src="${esc(p.thumb)}" alt="" decoding="async">`:QI.clock}</span><span class="hf-q-tx"><b>Reprendre</b><small translate="no">${esc(shortName(s))}</small></span></button>`;
    }
    if(q.kind==='trip'){
      const when=q.state==='upcoming'?(q.days===1?'Départ demain':`J-${q.days}`):q.state==='ongoing'?'En voyage':'';
      return `<button type="button" class="hf-q" data-hf-trip="${esc(q.id)}"><span class="hf-q-ic">${QI.trip}</span><span class="hf-q-tx"><b>Mon voyage</b><small>${when?`${esc(when)} · `:''}<span translate="no">${esc(q.name)}</span></small></span></button>`;
    }
    return '';
  }
  const quickHtml=()=>quickItems().map(quickTile).join('');
  function quickRow(){return Layout?`<div class="hf-quick" data-hf-quick role="group" aria-label="Accès rapide">${quickHtml()}</div>`:'';}
  /* Mise à jour sur place, seulement si le contenu a changé (même hauteur, aucune section ajoutée ni retirée). */
  function syncQuick(){
    const row=home.querySelector('[data-hf-quick]');if(!row)return;
    const h=quickHtml();if(row._obHtml!==h){row.innerHTML=h;row._obHtml=h;}
  }
  /* ---------- Fin des raccourcis ---------- */

  function hero(){
    if(V2)return topV2();
    const n=SPOTS.length;
    return `<section class="hf-top" aria-label="Trouve ton spot">
      <button type="button" class="hf-search" data-hf-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span><b>Où veux-tu aller ?</b><small>${n} spots · plages, lagons, vagues, récifs</small></span></button>
      ${quickRow()}
      ${acts()}
      ${heroBox()}
    </section>`;
  }
  /* Changement de sport (sous la scène de transition) : le carrousel est reconstruit à la même place et à la même
     hauteur (CSS), puis relié. Même sport : rien ne bouge. */
  function syncHero(){
    const box=home.querySelector('[data-hf-hero]');if(!box||heroSport===curSport())return;
    const tmp=document.createElement('div');tmp.innerHTML=heroBox();box.replaceWith(tmp.firstElementChild);bindHero();
  }
  /* Envies du moment : quatre grandes tuiles photo qui mènent aux collections. */
  const MOOD_COVER={lagons:'whitehaven',legendes:'teahupoo',plongees:'ermitage',iles:'tikehau',nord:'lofoten',debut:'macarella'};
  function moods(feed){
    const tiles=[];
    for(const id of ['lagons','legendes','plongees','iles','nord','debut']){
      const sec=feed.querySelector(`[data-hf="${id}"]`);if(!sec)continue;
      const first=sec.querySelector('.hf-card img'),title=sec.querySelector('.as-sec h2')?.firstChild?.textContent||'',n=sec.querySelectorAll('.hf-card').length;
      /* Couverture choisie à la main (la plus belle photo de l’ambiance), sinon la première carte. */
      const pick=MOOD_COVER[id]&&SPOTS.find(x=>x.id===MOOD_COVER[id]),pp=pick&&photo(pick),cover=(pp&&pp.thumb)||first?.getAttribute('src');
      /* (l’image est préparée à part : le gabarit de la tuile garde ses quatre expressions, donc « {3} spots » sa clé de traduction) */
      const pic=cover?`<img src="${esc(cover)}"${pp?sharp(pp,'300px'):''} alt="" loading="lazy" decoding="async">`:'';
      if(cover)tiles.push(`<button type="button" class="hf-mood" data-hf-jump="${id}">${pic}<b>${esc(title)}</b><small>${n} spots</small></button>`);
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
      <button type="button" class="hf-world-go" data-hf-go="spots">Explorer la planète</button></div>
    </section>`;
  }
  /* Globe de l’accueil : une seule instance, créée à l’approche de la carte (jamais avant la levée du rideau),
     mise en veille hors écran. La sphère CSS reste affichée jusqu’à la première image éclairée du globe. */
  let planet=null,planetIO=null,planetBusy=false,planetOn=false,planetLosses=[],planetTimer=0,planetFrozen=false;
  const homeShown=()=>body().dataset.screen==='home';
  const planetLive=()=>planetOn&&!document.hidden&&homeShown();
  /* Libère le globe (mémoire GPU, textures 4K) ; la sphère CSS reprend la place tant qu'il n'est pas recréé. */
  function dropPlanet(){
    clearTimeout(planetTimer);
    const p=planet;planet=null;
    home.querySelector('.hf-world-map')?.classList.remove('is-live');
    try{p?.destroy?.();}catch(_){}
  }
  function stopPlanet(){
    planetIO?.disconnect();planetIO=null;planetBusy=false;planetOn=false;planetLosses=[];
    dropPlanet();
  }
  function loadPlanet(host){
    if(planetBusy||planet||!planetLive()||!window.OceanGlobe?.supported?.())return;
    planetBusy=true;let made=null;
    window.OceanGlobe.create(host,{lighting:'studio',clouds:false,reveal:false,hd:false,
      onFirstFrame:()=>{if(host.isConnected&&made&&made===planet)host.closest('.hf-world-map')?.classList.add('is-live');},
      onContextLost:()=>{if(made&&made===planet)onPlanetLost();}
    }).then(api=>{
      planetBusy=false;made=api;
      /* Le rendu a été refait entre-temps (langue) ou l'accueil n'est plus affiché : on libère ce globe. */
      if(!host.isConnected||!planetIO||!planetLive()){api.destroy();return;}
      planet=api;api.setActive(!planetFrozen);
    }).catch(()=>{planetBusy=false;});
  }
  /* Contexte WebGL retiré par le système : le globe est libéré (la sphère CSS reste visible, pas de cadre vide),
     puis recréé s'il est encore à l'écran. Plus de 3 pertes en une minute : on garde la sphère CSS. */
  function onPlanetLost(){
    const now=Date.now();planetLosses=[...planetLosses.filter(t=>now-t<60000),now];
    dropPlanet();
    if(planetLosses.length>3)return;
    planetTimer=setTimeout(syncPlanet,700);
  }
  /* Accueil non affiché (Explorer, fiche…) ou page cachée : le globe est libéré ; il revient avec l'accueil. */
  function syncPlanet(){
    if(!planetIO)return;
    const host=home.querySelector('[data-hf-globe]');if(!host)return;
    if(!homeShown()||document.hidden){if(planet&&!homeShown())dropPlanet();else planet?.setActive(false);return;}
    if(planet)planet.setActive(planetOn&&!planetFrozen);
    else if(planetOn&&!planetFrozen)loadPlanet(host);
  }
  function watchPlanet(){
    if(Boot&&!Boot.lifted)return;
    planetIO?.disconnect();
    const host=home.querySelector('[data-hf-globe]');if(!host||!window.IntersectionObserver)return;
    planetIO=new IntersectionObserver(([e])=>{
      planetOn=!!e?.isIntersecting;
      syncPlanet();
    },{rootMargin:'240px 0px'});
    planetIO.observe(host);
  }
  document.addEventListener('visibilitychange',syncPlanet);
  window.addEventListener('ocean:navigate',()=>setTimeout(syncPlanet,0));
  /* Page d’un pays ou scène d’activité par-dessus (ocean:transition) : le globe se fige dessous, comme celui d’Explorer,
     puis reprend ; « transition-ready » le rend avant le fondu de sortie de la scène. */
  document.addEventListener('ocean:transition',e=>{planetFrozen=!!e.detail;syncPlanet();});
  document.addEventListener('ocean:transition-ready',()=>{if(planetFrozen){planetFrozen=false;syncPlanet();}});

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
    /* La première photo est déjà posée par le démarrage (index.html, élément LCP) : on la garde telle quelle. */
    const ambient=i=>{if(i===shown)return;shown=i;const img=track.children[i]?.querySelector('img');if(!img)return;const els=amb.querySelectorAll('img');if(els[layer].classList.contains('on')&&els[layer].src===img.src)return;layer=1-layer;els[layer].src=img.currentSrc||img.src;els[layer].classList.add('on');els[1-layer].classList.remove('on');};
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

  /* ---------- Mode Noël (noel-model.js) ----------
     Du 15 novembre au 6 janvier (date de l’appareil) : un titre de saison sous une fine guirlande, des paillettes dorées
     posées une fois sur le haut de l’accueil (dessin fixe, sous le contenu), la rangée « Noël au soleil » et le calendrier
     de l’Avent (du 1er au 24 décembre ; avant, une carte annonce son ouverture). html.ob-noel donne au reste de
     l’interface ses touches dorées et ses illustrations (noel.css). Le décor est FIXE : rien ne bouge, rien ne tombe,
     rien ne clignote, aucune boucle d’animation (décision du fondateur : le décor ne doit jamais gêner l’utilisation).
     Bandeau et calque posés avec l’ouverture, rangée et Avent avec le fil : tout est en place sous le rideau, à hauteur
     fixe (home-feed.css). Hors mode, rien n’est créé ni écouté. Réglage « Ambiance de Noël » : localStorage oceanbuddy_noel. */
  const NM=window.NoelModel;
  const noelStored=()=>{try{return localStorage.getItem(NM.STORE);}catch(_){return null;}};
  const noelState=()=>NM?NM.state({now:new Date(),search:location.search,stored:noelStored()}):{on:false,period:false,forced:null};
  let noel=noelState(),noelIds=[];
  /* Essai avec une date forcée (?saison=noel&jour=…) : l’en-tête de l’accueil (app-shell.js, chargé après) affiche la même date. */
  if(noel.forced==='noel'&&noel.period)window.OB_NOEL_TODAY=noel.date;
  function noelTitle(){
    const g=NM.greeting(noel.date);if(!g)return '';
    if(g.kind==='countdown')return g.n===1?'Plus qu’un jour avant Noël':`Plus que ${g.n} jours avant Noël`;
    return g.kind==='noel'?'Joyeux Noël':g.kind==='fetes'?'Belles fêtes':'Bonne année';
  }
  /* Guirlande : une bande vide, l’illustration est posée par noel.css (sous html.ob-noel), fixe. */
  function noelTop(){
    return `<div class="hf-noel-top"><span class="hf-noel-garland" aria-hidden="true"></span><p class="hf-noel-title">${esc(noelTitle())}</p></div>`;
  }
  /* Bandeau et calque des paillettes : ajoutés ou retirés selon le mode (au montage, ou quand le réglage change). */
  function syncNoel(){
    document.documentElement.classList.toggle('ob-noel',!!noel.on);
    const top=$('.hf-top',home);if(!top)return;
    const band=$('.hf-noel-top',top);
    /* Interface v2 : le compte à rebours est une ligne discrète sous le salut (ui-accueil.css), plus un bandeau en tête. */
    if(noel.on&&!band){const t=document.createElement('div');t.innerHTML=noelTop();const head=V2&&$('.ac-head',top);if(head)head.after(t.firstElementChild);else top.prepend(t.firstElementChild);}
    else if(!noel.on&&band)band.remove();
    if(noel.on&&!sky){
      sky=document.createElement('canvas');sky.className='hf-noel-sky';sky.setAttribute('aria-hidden','true');
      (home.querySelector(':scope>.hf-ambient')||home.firstElementChild)?.after(sky);
      watchSky();
    }else if(!noel.on&&sky){stopSky();sky.remove();sky=null;}
  }
  /* Rangée « Noël au soleil » : bonne saison ET eau ≥ 24 °C (normales NOAA), triée par score photo. */
  function noelSection(pool,used){
    noelIds=[];
    if(!noel.on||!NM||!seasons||!lite)return '';
    const m=NM.railMonth(noel.date);
    const list=NM.sunnySpots(pool,{seasons,sea:(s,mm)=>val(s,'sea',mm),scores,month:m});
    noelIds=list.map(s=>s.id);
    const cards=pick(list,{n:10,perCountry:1,used}).map(s=>card(s,{data:'sea',month:m})).filter(Boolean);
    if(cards.length<3){noelIds=[];return '';}
    /* Deux blocs distincts : le calendrier de l’Avent (sa propre section, hors .hf-sec pour que les « Envies du moment »
       viennent après la rangée), puis la rangée « Noël au soleil » (titre, sous-titre, cartes). */
    return `${advent()}<section class="hf-sec hf-noel" data-hf="noel" aria-label="Noël au soleil">
      <div class="as-sec"><h2>Noël au soleil<small>${m===11?'Eau à 24 °C ou plus en décembre (normales NOAA, valeur indicative) et bonne saison selon nos carnets.':'Eau à 24 °C ou plus en janvier (normales NOAA, valeur indicative) et bonne saison selon nos carnets.'}</small></h2></div>
      <div class="hf-rail" role="list">${cards.join('')}</div>
    </section>`;
  }
  /* Calendrier de l’Avent : 24 cases ; les jours passés et la case du jour s’ouvrent, les jours futurs restent fermés. */
  const aventYear=()=>noel.date.getFullYear();
  const aventOpened=()=>{try{return NM.readOpened(localStorage.getItem(NM.AVENT),aventYear());}catch(_){return {};}};
  const shortName=s=>String(s.name).split(' — ')[0];
  function aventCase(c,opened){
    if(c.state==='future')return `<button type="button" class="hf-avent-day is-future" disabled aria-label="Case du ${c.day} décembre, pas encore ouverte"><b>${c.day}</b></button>`;
    const s=opened[c.day]&&SPOTS.find(x=>x.id===opened[c.day]),p=s&&photo(s),today=c.state==='today'?' is-today':'';
    if(p)return `<button type="button" class="hf-avent-day is-open${today}" data-hf-avent="${c.day}" aria-label="Case du ${c.day} décembre, déjà ouverte : ${esc(shortName(s))}"><img src="${esc(p.thumb)}" alt="" loading="lazy" decoding="async"><b>${c.day}</b></button>`;
    return `<button type="button" class="hf-avent-day${today}" data-hf-avent="${c.day}" aria-label="${today?`Case du jour, ${c.day} décembre : ouvrir le spot surprise`:`Case du ${c.day} décembre : ouvrir le spot surprise`}"><b>${c.day}</b></button>`;
  }
  function advent(){
    if(noelIds.length<3)return '';
    /* Avant le 1er décembre : même en-tête, et une carte à la place de la rangée (même hauteur). */
    if(NM.adventSoon(noel.date))return `<section class="hf-avent" data-hf-avent-sec aria-label="Calendrier de l’Avent"><div class="as-sec"><h2>Calendrier de l’Avent<small>Une case par jour du 1er au 24 décembre : un spot au soleil à découvrir.</small></h2></div>
      <div class="hf-avent-row"><p class="hf-avent-soon">Le calendrier de l’Avent ouvre le 1er décembre</p></div></section>`;
    const days=NM.adventDays(noel.date);if(!days)return '';
    const opened=aventOpened();
    return `<section class="hf-avent" data-hf-avent-sec aria-label="Calendrier de l’Avent"><div class="as-sec"><h2>Calendrier de l’Avent<small>Une case par jour jusqu’au 24 décembre : un spot au soleil à découvrir.</small></h2></div>
      <div class="hf-avent-row" role="group" aria-label="Calendrier de l’Avent">${days.map(c=>aventCase(c,opened)).join('')}</div></section>`;
  }
  /* La case du jour reste visible dans la rangée (défilement horizontal de la rangée seulement, jamais la page). */
  function aventToday(){
    const row=home.querySelector('.hf-avent-row'),on=row?.querySelector('.is-today');
    if(row&&on)row.scrollLeft=Math.max(0,on.offsetLeft-row.clientWidth/2+on.offsetWidth/2);
  }
  /* Ouvrir une case : tirage déterministe du jour (jamais deux fois le même spot), mémorisé, puis la fiche du spot. */
  function openAvent(btn){
    if(!NM||!noel.on)return;
    const day=+btn.dataset.hfAvent,y=aventYear(),days=NM.adventDays(noel.date);
    if(!days||!days[day-1]||days[day-1].state==='future')return;
    const opened=aventOpened(),id=NM.adventPick(day,y,noelIds,opened);if(!id)return;
    if(opened[day]!==id){opened[day]=id;try{localStorage.setItem(NM.AVENT,NM.writeOpened(opened,y));}catch(_){}}
    const s=SPOTS.find(x=>x.id===id),p=s&&photo(s);
    if(p&&!btn.classList.contains('is-open')){
      const img=document.createElement('img');img.alt='';img.decoding='async';img.src=p.thumb;
      btn.prepend(img);btn.classList.add('is-open');btn.setAttribute('aria-label',`Case du ${day} décembre, déjà ouverte : ${shortName(s)}`);
    }
    if(typeof vibrate==='function')vibrate(8);
    if(typeof openSpot==='function')openSpot(id);
  }
  /* Paillettes : un dessin FIXE (une trentaine de points posés une fois, positions tirées d’une graine : les mêmes à chaque
     ouverture), seulement sur le haut de l’accueil, SOUS le contenu (z-index -1, home-feed.css). Aucune boucle
     d’animation, aucun requestAnimationFrame : le calque n’est redessiné que si sa taille change (rotation, retour sur
     l’accueil, fenêtre) ou si la couleur du sport change (après la transition du thème). */
  let sky=null,skyCtx=null,skyW=0,skyH=0,skyRO=null,skyBound=false,skyTimers=[];
  function skyRand(seed){let x=seed>>>0||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
  function skyDraw(){
    if(!sky)return;
    const w=sky.clientWidth,h=sky.clientHeight;if(!w||!h)return;
    const r=Math.min(2,window.devicePixelRatio||1);
    if(w!==skyW||h!==skyH||!skyCtx){skyW=w;skyH=h;sky.width=Math.round(w*r);sky.height=Math.round(h*r);skyCtx=sky.getContext('2d');}
    const c=skyCtx;if(!c)return;
    c.setTransform(r,0,0,r,0,0);c.clearRect(0,0,w,h);
    const cs=getComputedStyle(document.documentElement),cols=[cs.getPropertyValue('--t-sun').trim()||'gold',cs.getPropertyValue('--t-on-main').trim()||'white'];
    const R=skyRand(2611),n=Math.max(16,Math.min(40,Math.round(w/14)));
    for(let i=0;i<n;i++){
      const x=R()*w,y=R()*h,rad=.8+R()*1.5,k=.4+.6*R(),a=.45+R()*.45,gold=R()<.72;
      c.globalAlpha=a;c.fillStyle=cols[gold?0:1];
      c.beginPath();c.ellipse(x,y,rad*k,rad,0,0,6.2832);c.fill();
    }
    c.globalAlpha=1;
  }
  function stopSky(){skyRO?.disconnect();skyRO=null;skyTimers.forEach(clearTimeout);skyTimers=[];skyCtx=null;skyW=skyH=0;}
  function watchSky(){
    if(!sky)return;
    skyRO?.disconnect();
    if(window.ResizeObserver){skyRO=new ResizeObserver(skyDraw);skyRO.observe(sky);}else skyDraw();
    if(skyBound)return;skyBound=true;
    /* Le thème d’un sport change par transition CSS : on relit les couleurs après, une fois. */
    document.addEventListener('ocean:sport',()=>{skyTimers.forEach(clearTimeout);skyTimers=[700,1800].map(ms=>setTimeout(skyDraw,ms));});
  }
  /* Réglage « Ambiance de Noël » : proposé seulement pendant la période (ou en essai), activé par défaut. */
  const noelRow=document.getElementById('setNoelRow'),noelBox=document.getElementById('setNoel');
  if(NM&&noelRow&&noelBox&&noel.period){
    noelRow.hidden=false;noelBox.checked=noel.on;
    noelBox.addEventListener('change',()=>{
      try{localStorage.setItem(NM.STORE,noelBox.checked?'on':'off');}catch(_){}
      noel=noelState();if(built)mount();else syncNoel();
    });
  }
  /* ---------- Fin du mode Noël ---------- */

  /* ---------- « Pour toi aujourd’hui » (spot-rank-model.js) ----------
     Trois spots pour le sport et le niveau enregistrés : à ton niveau d’abord (jamais un spot déconseillé par la jauge de
     danger), puis en saison ce mois-ci, puis les plus proches si la position est déjà connue (elle n’est jamais demandée
     ici), puis l’éclat de la photo ; un tirage du jour fait tourner les spots équivalents. Aucun appel réseau : seuls les
     repères déjà chargés (saisons, normales légères) sont lus. La section est posée avec le fil, sous le rideau, à hauteur
     fixe (home-feed.css) ; un changement de niveau remplace ses trois lignes sur place, à la même hauteur. */
  const Rank=window.SpotRank,CM=window.ConditionsModel;
  const curLevel=()=>(typeof chosenLevel!=='undefined'&&chosenLevel)||null;
  const LEVEL_TX={debutant:'Débutant',intermediaire:'Intermédiaire',expert:'Expert',variable:'Niveau à évaluer'};
  const today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/86400000);};
  /* Position réelle (jamais demandée ici), sinon la région des favoris (lot 1) : le favori le plus central, ou à défaut les
     derniers spots vus (ConditionsModel.regionAnchor). Sans position, « Pour toi » ne propose plus le monde entier à
     quelqu'un dont les favoris sont tous dans les Landes. Sans favori ni spot vu : aucune région, le classement d'avant. */
  const realPos=()=>typeof userPos!=='undefined'&&userPos&&Number.isFinite(userPos.lat)?{lat:userPos.lat,lon:userPos.lon}:null;
  function regionPos(){
    if(!CM)return null;
    let ids=typeof favs!=='undefined'?[...favs]:[];
    if(!ids.length)ids=(window.OceanHub?.recent?.()||[]).map(x=>x&&typeof x==='object'?x.id:x);
    const pts=ids.filter(id=>typeof id==='string'&&known(id)).map(id=>COORDS[id]||spotOf(id)?.coords).filter(Boolean);
    return CM.regionAnchor(pts);
  }
  function rankCtx(){
    const pos=realPos()||regionPos();
    return {sport:curSport(),level:curLevel(),month:new Date().getMonth(),seasons,photo:scores,pos,
      favs:typeof favs!=='undefined'?favs:null,coords:s=>COORDS[s.id]||s.coords,gauge:s=>window.dangerGauge?.(s)?.n??null,
      hasPhoto:s=>!!photo(s),day:today(),jitter:30};
  }
  function forYouSub(){
    const sp=curSport(),lv=curLevel();
    return `${sp==='all'?'Toutes les activités':sportLabel(sp)||'Toutes les activités'} · ${lv?LEVEL_TX[lv]:'Tous niveaux'}`;
  }
  /* Repères d’une ligne : niveau du spot, saison du mois, eau du mois, distance (si connue). Une seule ligne, sans retour. */
  function fyChips(s,why){
    const m=new Date().getMonth(),lv=LEVEL_TX[s.level]||LEVEL_TX.variable,out=[`<span class="hf-fy-lv">${esc(lv)}</span>`];
    /* « En saison » (le mois est celui du jour, comme dans l’Explorer) : « En saison en novembre » était coupé en « En saison en novem… ». */
    if(why.inSeason)out.push('<span class="hf-season">En saison</span>');
    else if(why.seasonKnown){const t=seasonLabel(seasons?.[s.id]);if(t)out.push(`<span>${esc(t)}</span>`);}
    const sea=dataChip(s,'sea',m);if(sea)out.push(sea);
    if(why.dist!=null)out.push(`<span>${esc(why.dist<20?num(why.dist,1):num(Math.round(why.dist)))} km</span>`);
    return out.join('');
  }
  function fyRow({spot:s,why}){
    const p=photo(s),fav=typeof favs!=='undefined'&&favs.has(s.id),name=shortName(s);
    const act=curSport()!=='all'?sportLabel(curSport()):(s.sports||[]).slice(0,2).map(sportLabel).filter(Boolean).join(' · ');
    return `<article class="hf-fy" data-spot="${esc(s.id)}" role="listitem" tabindex="0" aria-label="${esc(name)}, ${esc(s.country||'')}">
      <img src="${esc(p.thumb)}" alt="" loading="lazy" decoding="async">
      <div class="hf-fy-tx"><b>${esc(name)}</b><small>${esc(s.country||s.loc||'')}${act?` · ${esc(act)}`:''}</small><p class="hf-fy-why">${fyChips(s,why)}</p></div>
      <button type="button" class="hf-fav${fav?' on':''}" data-fav="${esc(s.id)}" aria-label="${fav?'Retirer des favoris':'Ajouter aux favoris'} : ${esc(name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S3.8 14.9 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.5-8.2 11-8.2 11z"/></svg></button>
    </article>`;
  }
  function fyList(picks){
    if(picks.length)return picks.map(fyRow).join('');
    return `<p class="hf-fy-empty">Pas encore de spot pour ce choix. <button type="button" data-hf-profile>Change ton sport ou ton niveau</button></p>`;
  }
  /* used : spots déjà montrés plus haut (Noël) ; les trois spots choisis ne reviennent pas dans les rangées suivantes. */
  function forYouSection(used){
    if(!Rank)return '';
    const picks=Rank.forYou(SPOTS,rankCtx(),{n:3,perCountry:1,used});
    picks.forEach(p=>used.add(p.spot.id));
    return `<section class="hf-sec hf-foryou" data-hf="pourtoi" aria-label="Pour toi aujourd’hui">
      <div class="as-sec"><h2>Pour toi aujourd’hui<small data-hf-fy-sub>${esc(forYouSub())}</small></h2><button type="button" data-hf-profile aria-label="Modifier mon sport et mon niveau">Modifier</button></div>
      <div class="hf-fy-list" role="list">${fyList(picks)}</div>
    </section>`;
  }
  /* Niveau changé (Réglages) : les trois lignes sont remplacées sur place, la section garde sa hauteur. */
  function updateForYou(){
    const sec=home.querySelector('[data-hf="pourtoi"]');if(!sec||!Rank)return;
    const others=new Set([...home.querySelectorAll('.hf-feed [data-spot]')].filter(el=>!sec.contains(el)).map(el=>el.dataset.spot));
    const list=sec.querySelector('.hf-fy-list'),sub=sec.querySelector('[data-hf-fy-sub]');
    if(list)list.innerHTML=fyList(Rank.forYou(SPOTS,rankCtx(),{n:3,perCountry:1,used:others}));
    if(sub)sub.textContent=forYouSub();
  }
  /* Données arrivées après la levée : seuls les repères des lignes changent (saison, eau), sur place. */
  function lateForYou(){
    if(!Rank)return;const ctx=rankCtx(),byId=new Map(SPOTS.map(s=>[s.id,s]));
    home.querySelectorAll('.hf-fy[data-spot]').forEach(r=>{const s=byId.get(r.dataset.spot),p=r.querySelector('.hf-fy-why');if(s&&p)p.innerHTML=fyChips(s,Rank.explain(s,ctx));});
  }
  /* Profil pour lequel le fil a été construit : un changement de sport le reconstruit (action volontaire, sous la scène
     de transition d’activité ou hors de l’accueil), un changement de niveau ne refait que « Pour toi ». */
  let builtSport=null,builtLevel=null;
  function profileChanged(){
    if(!built)return;
    if(curSport()!==builtSport){mount();if(Boot&&!Boot.lifted)ready();return;}
    if((curLevel()||'')!==builtLevel){builtLevel=curLevel()||'';if(V2)relevelV2();else updateForYou();}
  }
  /* ---------- Fin de « Pour toi aujourd’hui » ---------- */

  /* Tour du monde des cultures (cultures-boot.js) : rangée de pays et « Le mot du jour », à hauteur fixe (cultures.css) ;
     cultures.js, chargé après la levée du rideau, y pose les mots et le jeu sur place. */
  function culturesSection(){
    return window.OceanCultures?.homeHTML?.({spots:SPOTS,photo,score:vib,day:new Date(),lang:lang()})||'';
  }

  /* « Plus d’idées de départ » : tout ce qui n’est pas dans les six premières sections (HomeLayout.FOLDED), replié sous
     un seul bouton. Déplier est un geste volontaire (le contenu s’ouvre sous le bouton, rien au-dessus ne bouge). */
  function plusSection(parts){
    if(!parts.length)return '';
    return `<section class="hf-plus" data-hf="plus" aria-label="Plus d’idées de départ">
      <button type="button" class="hf-plus-btn" data-hf-fold aria-expanded="false" aria-controls="hfPlusBody"><span class="hf-plus-tx"><b>Plus d’idées de départ</b><small>La planète, l’immersion, les envies du moment, le mini-jeu et Poulpy</small></span><span class="hf-plus-n" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button>
      <div class="hf-plus-body" id="hfPlusBody" hidden>${parts.join('')}</div>
    </section>`;
  }
  /* Ouvre (ou referme) le repli ; open=true seulement pour atteindre une rangée repliée (tuiles « Envies du moment »). */
  function fold(open){
    const box=home.querySelector('[data-hf="plus"]'),body=box?.querySelector('.hf-plus-body'),btn=box?.querySelector('[data-hf-fold]');if(!body||!btn)return;
    const next=open==null?body.hidden:!!open;
    body.hidden=!next;btn.setAttribute('aria-expanded',String(next));
  }
  /* Blocs posés par d’autres scripts (cockpit, immersion, nouveaux spots, Poulpy) : une place réservée dans le fil,
     remplacée par l’élément lui-même au montage (order). */
  const slot=k=>`<i data-hf-slot="${k}" hidden></i>`;
  const OWNED={espace:'#oceanHub',immersion:'#obDive',nouveautes:'.field-arrivals',poulpy:'#poulpySpotlight'};

  /* ================= Accueil v2 (interface v2, 20 novembre 2026) =================
     Maquettes validées par le fondateur le 19 novembre : ~/Projects/Ocean-Buddy-orga-docs/interface-v2/.
     En haut : la date, le salut, la pastille « sport, niveau » et la recherche. Puis quatre rubriques :
       - « Mes spots » : tes favoris, sinon les derniers spots vus, avec les conditions du moment et le verdict pour toi ;
       - « Bon aujourd’hui » : trois spots en saison pour ton sport et ton niveau, ceux qui ont un créneau d’abord ;
       - « En <mois> » : une rangée de photos (eau du mois, activité) ;
       - « Cultures » : le mot du jour et l’entrée vers le tour du monde.
     Le calendrier de l’Avent s’y glisse du 1er au 24 décembre. Tout le reste (spot de rêve, « Pour toi aujourd’hui »,
     Noël au soleil, Ton espace, « Plus d’idées », planète, immersion, mini-jeu, Poulpy) n’est plus affiché ici : le code
     plus haut reste, pour les écrans qui les reprendront.
     Montage : le haut dès l’exécution du script, les rubriques une fois (mount), sous le rideau. Ensuite seul le CONTENU de
     places réservées change, sur place et à hauteur fixe : conditions et verdicts (OceanVerdict, spot-verdict.js), lignes de
     « Bon aujourd’hui », photo du mot du jour. Rien n’est ajouté, retiré ni déplacé dans le fil après la levée.
     Vie : entrée des blocs en fondu et glissé décalés, une seule fois (classe ac-go, posée à la levée du rideau) ; chiffres
     qui montent à l’arrivée des conditions ; pastilles en fondu. Rien de tout cela en mouvement réduit. */
  const V2=document.body.classList.contains('ocean-v2');
  const Verdict=window.OceanVerdict;
  const tr=s=>(typeof window.obT==='function'?window.obT(s):s);
  const spotOf=id=>SPOTS.find(s=>s.id===id);
  /* Délai d’entrée d’un bloc : rang du bloc dans sa rubrique (CSS : --i, 35 ms par rang). */
  const rise=i=>` style="--i:${i}"`;
  /* Mouvement réduit : le réglage du téléphone ou celui de l’app. */
  const calmV2=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||body().classList.contains('reduce-motion');

  /* ---------- Haut : date, salut, pastille sport et niveau ---------- */
  function dateText(){
    const t=fmt('dlong',()=>new Intl.DateTimeFormat(lang(),{weekday:'long',day:'numeric',month:'long'})).format(window.OB_NOEL_TODAY||new Date());
    return t.charAt(0).toUpperCase()+t.slice(1);
  }
  function helloText(){
    const name=typeof userName==='string'&&userName&&userName!=='Explorateur'?userName:'';
    const hello=tr(Layout?.hello?Layout.hello(new Date().getHours(),lang()):'Bonjour');
    return name?`${hello}, ${name}`:hello;
  }
  /* « Surf, intermédiaire » : écrit dans la langue ici (un assemblage n’est pas une clé du dictionnaire). Deux parties,
     le sport puis le niveau : quand la place manque, la pastille les empile ou ne garde que le sport (fitTop). */
  function meText(){
    const sp=curSport(),lv=curLevel();
    const s=sp!=='all'?tr(String(sportLabel(sp)).replace(/\s*\(.*\)/,'')):'',l=lv&&LEVEL_TX[lv]&&lv!=='variable'?tr(LEVEL_TX[lv]):'';
    if(s&&l)return [s,l.toLowerCase()];
    return [s||l||tr('Mon sport')];
  }
  const meHTML=()=>{const [a,b]=meText();return `<span class="ac-me-a">${esc(a)}</span>${b?`<span class="ac-me-sep">, </span><span class="ac-me-b">${esc(b)}</span>`:''}`;};
  const meIcon=()=>`url('assets/pictos/sports/${curSport()==='all'?'all':curSport()}-mono.webp')`;
  /* Hors connexion : seulement quand l'appareil le dit (navigator.onLine). Posé avec le haut, sous le rideau ; ensuite il
     apparaît ou part quand la connexion change. Un service météo qui répond mal ne le fait pas apparaître : il ne déplacerait
     l'accueil qu'après la levée du rideau. Le point de fraîcheur du titre dit alors l'heure du relevé affiché. */
  const offlineNow=()=>{try{return navigator.onLine===false;}catch(_){return false;}};
  function topV2(){
    return `<section class="hf-top ac-top" aria-label="Trouve ton spot">
      <header class="ac-head ac-in"${rise(0)}>
        <p class="ac-date" data-ac-date data-no-i18n>${esc(dateText())}</p>
        <div class="ac-hello" data-ac-hello><h1 class="ac-hi" data-ac-hi data-no-i18n>${esc(helloText())}</h1>
          <button type="button" class="ui-pill ac-me" data-ac-me title="Modifier mon sport et mon niveau"><span class="ac-me-ic" data-ac-me-ic style="--ic:${esc(meIcon())}" aria-hidden="true"></span><span class="ac-me-tx" data-ac-me-tx data-no-i18n>${meHTML()}</span></button></div>
      </header>
      <p class="ac-offline ac-in"${rise(1)} data-ac-offline role="status"${offlineNow()?'':' hidden'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 19H17a4 4 0 0 0 1.2-7.8 6 6 0 0 0-10.9-1.6A4.6 4.6 0 0 0 7.5 19z"/><path d="m3.5 3.5 17 17"/></svg><span>Hors connexion. Derniers relevés gardés.</span></p>
      <button type="button" class="hf-search ac-search ac-in"${rise(1)} data-hf-search><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span><b>Où veux-tu aller ?</b></span></button>
    </section>`;
  }
  /* Date, salut et pastille : remis à jour sur place (retour à l’accueil, sport ou niveau changé), jamais reconstruits. */
  function syncTop(){
    const top=$('.ac-top',home);if(!top)return;
    const put=(sel,t)=>{const el=$(sel,top);if(el&&el.textContent!==t)el.textContent=t;};
    put('[data-ac-date]',dateText());put('[data-ac-hi]',helloText());
    const me=$('[data-ac-me-tx]',top),h=meHTML();if(me&&me._acHtml!==h){me.innerHTML=h;me._acHtml=h;}
    const ic=$('[data-ac-me-ic]',top),v=meIcon();if(ic&&ic.style.getPropertyValue('--ic')!==v)ic.style.setProperty('--ic',v);
    fitTop();
  }
  /* Le salut et la pastille tiennent sur UNE ligne, dans toutes les langues (« Buenas noches » à 375 px) : tant que la
     pastille passe dessous, on essaie, dans l’ordre, la pastille sur deux lignes (sport, puis niveau), le salut un peu
     plus petit, le sport seul, puis le pictogramme seul (data-ac-fit, 1 à 5 ; ui-accueil.css). Mesuré sous le rideau,
     puis quand les polices sont là et quand la largeur change. Rien ne tient (long prénom) : la pastille reste dessous. */
  const FITS=5;
  let fitW=-1;
  function fitTop(){
    const row=$('[data-ac-hello]',home),hi=row&&$('[data-ac-hi]',row),me=row&&$('[data-ac-me]',row);if(!row||!hi||!me)return;
    /* Accueil caché (autre écran) : rien à mesurer, l’ajustement en place est gardé ; il est refait au retour. */
    if(!hi.offsetHeight)return;
    fitW=row.clientWidth;
    const under=()=>me.offsetTop-hi.offsetTop>20||hi.offsetHeight>60;
    let fit=0;row.removeAttribute('data-ac-fit');
    while(fit<FITS&&under())row.setAttribute('data-ac-fit',String(++fit));
    if(under())row.removeAttribute('data-ac-fit');
  }

  /* ---------- Lignes de spot : photo, nom, points de danger, conditions, verdict ---------- */
  function dotsHTML(n){
    if(!(n>=1))return '';
    let h='';for(let i=0;i<4;i++)h+=`<i${i<n?' class="on"':''}></i>`;
    return `<span class="ui-dots" role="img" aria-label="Danger ${Math.min(4,n)} sur 4">${h}</span>`;
  }
  /* Conditions et verdict d’une ligne : la place réservée (mêmes lignes, mêmes hauteurs). loadLive() les écrit juste
     après, avant la première image quand elles sont déjà en cache. */
  function liveHTML(id){
    if(!Verdict)return '';
    return `<div class="ui-live${Verdict.hasVerdict(id)?'':' is-solo'}" data-ac-live="${esc(id)}">${Verdict.pending(id)}</div>`;
  }
  /* Nom d’une ligne : « Hossegor La Gravière », le nom puis la précision, sans le tiret (SpotName, déjà dans la langue). */
  function rowName(s){
    const p=window.SpotName?.parts?window.SpotName.parts(s.name):{main:shortName(s),sub:''};
    return `<span translate="no" data-no-i18n>${esc(p.main)}${p.sub?` <small>${esc(p.sub)}</small>`:''}</span>`;
  }
  /* Spot sans vraie photo : l’illustration de son activité (assets/ui/sports/, neuf dessins faits pour ce cadre, dans le
     style des illustrations de la fiche). C’est un dessin de l’activité, jamais une fausse photo du spot ; il est posé en
     fond du cadre, pas en image : le vol vers la fiche (motion.js) ne l’emprunte pas. Activité sans dessin : son pictogramme. */
  const ILLUS=new Set(['surf','bodyboard','baignade','paddle','kayak','snorkeling','plongee','kitesurf','windsurf']);
  function noPhoto(s){
    const sp=curSport(),a=sp!=='all'&&has(s,sp)?sp:(s.sports||[]).find(x=>sportLabel(x))||'all';
    if(ILLUS.has(a))return `<span class="ui-ph is-illus" style="--il:url('assets/ui/sports/${a}.webp')"></span>`;
    return `<span class="ui-ph is-none" style="--ic:url('assets/pictos/sports/${esc(a)}-mono.webp')"></span>`;
  }
  function spotRow(s,i,{eager=false,cls='ac-in',country=false}={}){
    const p=photo(s),g=window.dangerGauge?.(s)?.n??null;
    return `<div class="ui-spot ${cls}"${rise(i)} data-spot="${esc(s.id)}" role="button" tabindex="0">
      ${p?`<span class="ui-ph"><img src="${esc(p.thumb)}"${sharp(p,'114px')} alt="" decoding="async"${eager?'':' loading="lazy"'}></span>`:noPhoto(s)}
      <div><p class="ui-spot-name">${rowName(s)}${dotsHTML(g)}</p>${country&&s.country?`<p class="ui-spot-sub">${esc(s.country)}</p>`:''}${liveHTML(s.id)}</div>
    </div>`;
  }
  /* Ligne en attente (« Bon aujourd’hui » avant l’arrivée des conditions) : même hauteur qu’une ligne. */
  const waitRow=()=>`<div class="ui-spot is-wait" aria-hidden="true"><span class="ui-ph"></span><div><p class="ui-spot-name"><i class="ui-skel"></i></p><p class="ui-spot-sub">&nbsp;</p><div class="ui-live">${Verdict?Verdict.pending(null):''}</div></div></div>`;
  /* Le verdict tient sur une ligne : s’il déborde (heures longues en anglais, téléphone étroit), corps réduit, puis les
     heures sur deux lignes à côté de la pastille. La hauteur réservée ne change jamais. */
  function fitLive(el){
    const v=el.querySelector('.ui-verdict');if(!v)return;
    v.removeAttribute('data-fit');
    for(let i=1;i<=2&&v.scrollWidth>v.clientWidth+1;i++)v.dataset.fit=String(i);
  }
  /* Conditions arrivées : écrites à la place réservée ; chiffres qui montent et pastille en fondu si l’accueil est à l’écran. */
  function paintLive(el,e,anim){
    const h=Verdict.html(e);
    if(el._acHtml!==h){
      /* Conditions rafraîchies (retour après 30 min) : chaque chiffre repart de sa valeur d’avant, 20 puis 22, au lieu
         de 0 (data-ui-from, lu par OceanVerdict.animate). Seulement quand les mêmes relevés sont là des deux côtés. */
      const was=el.hasAttribute('data-ac-ok')?[...el.querySelectorAll('.ui-n[data-ui-n]')].map(n=>n.dataset.uiN):null;
      el.innerHTML=h;el._acHtml=h;el.removeAttribute('data-ac-shown');
      const now=el.querySelectorAll('.ui-n[data-ui-n]');
      if(was&&was.length===now.length&&!el.querySelector('.ui-cond .is-none'))now.forEach((n,i)=>{n.dataset.uiFrom=was[i];});
    }
    el.setAttribute('data-ac-ok','');fitLive(el);
    if(anim)showLive(el);
  }
  function showLive(el){
    if(el.hasAttribute('data-ac-shown'))return;
    el.setAttribute('data-ac-shown','');el.classList.remove('ui-arrive');void el.offsetWidth;el.classList.add('ui-arrive');
    Verdict.animate(el);
    /* La classe part une fois l’arrivée jouée : elle ne se rejoue pas toute seule quand l’accueil réapparaît (wakeV2 s’en charge). */
    setTimeout(()=>el.classList.remove('ui-arrive'),900);
  }
  const onScreen=()=>(!Boot||Boot.lifted)&&body().dataset.screen==='home'&&!document.hidden;

  /* ---------- « Mes spots » ---------- */
  let mineIds=[],mineKey='';
  function mineData(){
    const m=Layout?.mine?Layout.mine({favs:typeof favs!=='undefined'?favs:[],recent:window.OceanHub?.recent?.()||[],known,n:3}):{kind:'none',ids:[]};
    return {kind:m.kind,spots:m.ids.map(spotOf).filter(Boolean)};
  }
  function mineBody(m){
    if(m.spots.length)return `<div class="ui-spots" data-ac-mine>${m.spots.map((s,i)=>spotRow(s,i+1,{eager:true})).join('')}</div>`;
    /* Ni favori ni spot vu : une carte courte, le nombre de spots du catalogue en grand (il monte jusqu’à sa valeur à
       l’entrée, OceanVerdict.animate) et un bouton vers Explorer. L’illustration est faite pour cette carte : une côte
       et ses repères de spots (assets/ui/accueil-spots.webp, style des illustrations de la fiche). */
    return `<div class="ui-card ac-empty ac-in"${rise(1)} data-ac-empty><img src="assets/ui/accueil-spots.webp" alt="" width="720" height="720" decoding="async">
      <div class="ac-empty-tx"><p class="ac-empty-n"><span class="ui-num ui-n" data-ui-n="${SPOTS.length}" data-ui-d="0">${SPOTS.length}</span><span class="ui-unit">spots à explorer</span></p><button type="button" class="ui-btn" data-ac-find>Trouver un spot</button></div></div>`;
  }
  function mineSection(){
    const m=mineData();mineIds=m.spots.map(s=>s.id);mineKey=m.kind+':'+mineIds.join();
    return `<section class="ac-sec ac-mine" data-hf="mesSpots" aria-labelledby="acMineT">
      <div class="as-sec ui-head ac-in"${rise(0)}><h2 class="ui-title" id="acMineT">Mes spots</h2><span class="ac-fresh" data-ac-fresh role="button" tabindex="0" aria-label="Rafraîchir les conditions" hidden><i aria-hidden="true"></i><span data-ac-fresh-tx data-no-i18n></span></span><button type="button" class="ui-link" data-ac-edit${m.spots.length?'':' hidden'}>Modifier</button></div>
      <div data-ac-mine-box>${mineBody(m)}</div>
    </section>`;
  }
  /* Retour à l’accueil : un cœur touché ou une fiche ouverte ailleurs change la liste. Elle est remplacée sur place,
     au moment où l’accueil revient à l’écran. */
  function syncMine(){
    const box=$('[data-ac-mine-box]',home);if(!box)return false;
    const m=mineData(),ids=m.spots.map(s=>s.id),key=m.kind+':'+ids.join();
    if(key===mineKey)return false;
    mineIds=ids;mineKey=key;box.innerHTML=mineBody(m);
    const edit=$('[data-ac-edit]',home);if(edit)edit.hidden=!m.spots.length;
    if(!ids.length){syncFresh(null);if(onScreen())Verdict?.animate($('[data-ac-empty]',box));}
    return true;
  }
  /* Heure du relevé des conditions de « Mes spots », à côté du titre : un point et « 14 h 05 » (le plus ancien des relevés
     affichés, celui d’Open-Meteo gardé par le cache). Le point bat une fois quand un relevé plus récent arrive. Sans
     relevé (hors ligne, carte sans favori), rien n’est affiché : aucune heure inventée. */
  let freshAt=0;
  function freshText(at){
    const d=new Date(at);
    if(/^fr/.test(lang()))return `${d.getHours()} h ${String(d.getMinutes()).padStart(2,'0')}`;
    return fmt('hm',()=>new Intl.DateTimeFormat(lang(),{hour:'numeric',minute:'2-digit'})).format(d);
  }
  /* Relevé d'un autre jour que celui d'aujourd'hui (conditions gardées sur l'appareil) : la date devant l'heure, jamais
     l'heure seule (« 7 h 50 » hier lirait comme ce matin). */
  const freshLabel=at=>{
    const now=Date.now(),t=freshText(at);
    return CM&&CM.daysAgo(at,now)>0?`${CM.dateText(at,lang(),window.OB_I18N?.locale)} ${t}`:t;
  };
  function syncFresh(map){
    const el=$('[data-ac-fresh]',home);if(!el)return;
    const ents=map?mineIds.map(id=>map.get(id)).filter(e=>e&&e.now&&e.at>0):[];
    const ats=ents.map(e=>e.at);
    if(!ats.length){el.hidden=true;freshAt=0;return;}
    const at=Math.min(...ats),t=freshLabel(at),tx=$('[data-ac-fresh-tx]',el);
    if(tx&&tx.textContent!==t)tx.textContent=t;
    /* Relevé gardé de plus de 3 h : le point n'est plus vert (rien de « frais »). */
    el.toggleAttribute('data-old',ents.some(e=>e.stale));
    el.title=tr('Relevé à {0}').replace('{0}',t);el.hidden=false;
    if(at>freshAt&&freshAt&&onScreen())beat(el);
    freshAt=at;
  }
  /* Un battement : la classe est posée puis retirée (aucune boucle, rien en mouvement réduit). */
  function beat(el){
    if(!el||calmV2())return;
    el.classList.remove('is-beat');void el.offsetWidth;el.classList.add('is-beat');
    setTimeout(()=>el.classList.remove('is-beat'),1200);
  }

  /* ---------- « Bon aujourd’hui » ----------
     Candidats : les mêmes données que « Pour toi aujourd’hui » (SpotRank.forYou : sport, niveau, jauge de danger, saison
     du mois, proximité si elle est connue), en saison quand il y en a assez, jamais au-dessus de ton niveau. Leur créneau
     est calculé en une demande groupée ; on garde trois spots, ceux qui ont un créneau d’abord (HomeLayout.good). Les
     trois lignes sont réservées au montage : les spots y arrivent avec leurs conditions, sans rien décaler. */
  let goodIds=[],goodN=0;
  function goodCands(used){
    if(!Rank)return [];
    const fit=s=>window.SpotFitModel?window.SpotFitModel.fit(s.level,window.dangerGauge?.(s)?.n??null,curLevel()).kind!=='above':true;
    const list=Rank.forYou(SPOTS,rankCtx(),{n:10,perCountry:2,used}).filter(p=>fit(p.spot));
    const season=list.filter(p=>p.why.inSeason);
    return (season.length>=3?season:list).map(p=>p.spot);
  }
  const goodEntries=()=>new Map(goodIds.map(id=>[id,Verdict?Verdict.cached(id):null]));
  function goodPicks(map){
    const c=goodIds.map(spotOf).filter(Boolean).map(s=>({id:s.id,country:s.country||'',e:map.get(s.id)||null}));
    const ids=Layout?.good?Layout.good(c,{n:goodN,perCountry:1}):c.slice(0,goodN).map(x=>x.id);
    return ids.map(spotOf).filter(Boolean);
  }
  /* Un seul titre, quelles que soient les données (il changeait entre « Bon aujourd’hui », « En saison » et « Pour toi
     aujourd’hui » selon l’arrivée des conditions) : ce que la liste est vraiment. La pastille de chaque ligne dit le reste
     (créneau, saison, pas aujourd’hui). */
  const GOOD_TITLE='Pour toi aujourd’hui';
  function goodTitle(){return GOOD_TITLE;}
  function goodInner(used){
    const cands=goodCands(used);goodIds=cands.map(s=>s.id);goodN=Math.min(3,cands.length);
    if(!goodN)return '';
    /* Conditions déjà en cache (retour sur l’accueil dans la demi-heure) : les lignes sont écrites tout de suite. */
    const map=goodEntries(),ready=!Verdict||goodIds.every(id=>map.get(id)),picks=ready?goodPicks(map):[];
    return `<div class="as-sec ui-head ac-in"${rise(0)}><h2 class="ui-title" id="acGoodT" data-ac-good-title>${goodTitle(picks,map,!ready)}</h2><button type="button" class="ui-link" data-hf-more="bon">Tout voir</button></div>
      <div class="ui-spots" data-ac-good data-ac-key="${ready?esc(picks.map(s=>s.id).join()):''}">${ready?picks.map((s,i)=>spotRow(s,i+1,{country:true})).join(''):Array.from({length:goodN},waitRow).join('')}</div>`;
  }
  /* La rubrique garde sa place dans le fil même sans candidat (cachée) : un changement de niveau la remplit sur place. */
  function goodSection(used){
    const inner=goodInner(used);
    return `<section class="ac-sec ac-good hf-foryou" data-hf="bon" aria-labelledby="acGoodT"${inner?'':' hidden'}>${inner}</section>`;
  }
  function fillGood(map,anim){
    const box=$('[data-ac-good]',home);if(!box||!goodN)return;
    const picks=goodPicks(map),key=picks.map(s=>s.id).join();
    if(box.dataset.acKey!==key){
      box.dataset.acKey=key;
      /* À l’écran : les lignes entrent une à une. Sous le rideau : elles entreront avec le reste (ac-in). */
      box.innerHTML=picks.map((s,i)=>spotRow(s,anim?i:i+1,{cls:anim?'ac-row-in':'ac-in',country:true})).join('');
      /* L’entrée jouée, sa classe part : elle ne se rejoue pas quand l’accueil réapparaît. */
      if(anim)setTimeout(()=>box.querySelectorAll('.ac-row-in').forEach(r=>r.classList.remove('ac-row-in')),900);
    }
    const t=$('[data-ac-good-title]',home),title=goodTitle(picks,map,false);
    if(t&&t.dataset.acT!==title){t.dataset.acT=title;t.textContent=title;}
  }

  /* ---------- Conditions et verdicts : une demande groupée pour les lignes de l’accueil ---------- */
  let liveGen=0;
  /* force : tirer pour rafraîchir redemande le service (OceanVerdict.forSpots, { force }) ; renvoie la table des entrées. */
  function loadLive(force){
    if(!Verdict)return Promise.resolve(null);
    const g=++liveGen,ids=[...new Set(mineIds.concat(goodIds))];
    if(!ids.length)return Promise.resolve(null);
    return Verdict.forSpots(ids,force?{force:true}:undefined).then(map=>{
      if(g!==liveGen)return null;
      const anim=onScreen();
      fillGood(map,anim);
      home.querySelectorAll('.hf-feed [data-ac-live]').forEach(el=>{const e=map.get(el.dataset.acLive);if(e)paintLive(el,e,anim);});
      syncFresh(map);
      return map;
    }).catch(e=>{setTimeout(()=>{throw e;});return null;});
  }


  /* Niveau changé dans Réglages : la pastille du haut, les verdicts de « Mes spots » et les spots de « Bon aujourd’hui »
     (candidats de ce niveau) suivent, sur place ; le reste du fil ne bouge pas. */
  function relevelV2(){
    syncTop();
    const sec=$('.hf-feed [data-hf="bon"]',home);
    if(sec){const inner=goodInner(new Set(mineIds));sec.innerHTML=inner;sec.hidden=!inner;}
    home.querySelectorAll('.hf-feed [data-ac-mine] [data-ac-live]').forEach(el=>{el._acHtml=null;el.classList.toggle('is-solo',!Verdict||!Verdict.hasVerdict(el.dataset.acLive));});
    loadLive();
  }

  /* ---------- « En <mois> » : une rangée de photos (eau du mois, activité) ---------- */
  const actOfCard=s=>{const sp=curSport(),id=sp!=='all'&&has(s,sp)?sp:(s.sports||[])[0];return String(sportLabel(id)||'').replace(/\s*\(.*\)/,'');};
  const monthChips=(s,m)=>{const a=actOfCard(s);return `${dataChip(s,'sea',m)}${a?`<span>${esc(a)}</span>`:''}`;};
  function monthCard(s,i,m){
    const p=photo(s);if(!p)return '';
    return `<button type="button" class="ac-card ac-in"${rise(i+1)} data-spot="${esc(s.id)}" data-hf-m="${m}" aria-label="${esc(shortName(s))}, ${esc(s.country||'')}">
      <img src="${esc(p.thumb)}"${sharp(p,'300px')} alt="" loading="lazy" decoding="async">
      <span class="ac-card-tx"><b>${esc(shortName(s))}</b><span class="ac-card-chips" data-ac-chips>${monthChips(s,m)}</span></span>
    </button>`;
  }
  function monthSection(pool,used){
    if(!seasons)return '';
    const m=new Date().getMonth();
    /* Même choix que « Où partir en <mois> ? » : saison qui commence d’abord, saisons courtes, photos en haute définition. */
    const score=s=>{const ms=seasons[s.id];return (ms.length===12?2:0)+(ms.includes((m+11)%12)?1:0)+ms.length/24+((photo(s)?.w||0)>=1200?0:1.5)+(100-vib(s.id))/25;};
    const ordered=pool.filter(s=>seasons[s.id]?.includes(m)).map(s=>({s,k:score(s)})).sort((a,b)=>a.k-b.k).map(o=>o.s);
    const cards=pick(ordered,{n:8,perCountry:1,used}).map((s,i)=>monthCard(s,i,m)).filter(Boolean);
    if(cards.length<3)return '';
    /* Titre écrit à part : la clé de traduction reste « En {0} ». */
    const title=`En ${monthName(m)}`;
    return `<section class="ac-sec ac-month" data-hf="mois" aria-labelledby="acMonthT">
      <div class="as-sec ui-head ac-in"${rise(0)}><h2 class="ui-title" id="acMonthT">${esc(title)}</h2><button type="button" class="ui-link" data-hf-more="mois">Tout voir</button></div>
      <div class="ui-row ac-row">${cards.join('')}</div>
    </section>`;
  }

  /* ---------- « Cultures » : le mot du jour (cultures.js) et l’entrée vers le tour du monde ----------
     Une seule carte, à hauteur fixe. Le jeu est celui de cultures.js (quizHTML, choose, fitDone) : fermé, il montre le mot,
     une photo du pays à deviner et « Deviner le pays » ; un toucher affiche les trois réponses à la même place ; le
     résultat (tampon) prend ensuite cette place. « Tour du monde » ouvre le carnet de tampons.
     Illustrations (style de la fiche) : le cadre du jeu porte le globe et sa bulle (assets/ui/tour-du-monde.webp) tant
     que la réponse n’est pas donnée ; la vraie photo du pays arrive par-dessus avec le résultat, comme une récompense
     (avant, elle soufflait un peu la réponse). La ligne « Tour du monde » a son tampon à la vague (tampon-vague.webp).
     Vie : le mot se pose, les trois réponses arrivent l’une après l’autre, le tampon du résultat s’imprime et la photo
     se pose (ui-accueil.css, selon data-ac-quiz et data-ac-move) ; rien en mouvement réduit. */
  const CHEVRON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  function culturesV2(){
    const C=window.OceanCultures;if(!C)return '';
    const view=C._view||null;
    /* Fil remonté (sport, langue) alors que la vue est déjà chargée : elle remplit tout de suite. */
    if(view)setTimeout(()=>{try{view.fillHome?.();}catch(_){}},0);
    const quiz=view?.quizHTML?.()||'<div class="cult-quiz-body is-wait" data-cult-quiz-body aria-busy="true"><p class="cult-quiz-word"><i class="cult-skel"></i></p><p class="cult-quiz-q"></p></div>';
    return `<section class="ac-sec cult-home" data-hf="cultures" aria-labelledby="acCultT">
      <div class="as-sec ui-head ac-in"${rise(0)}><h2 class="ui-title" id="acCultT">Cultures</h2></div>
      <div class="ui-card ac-cult ac-in"${rise(1)}>
        <section class="cult-quiz ac-quiz" data-cult-quiz data-ac-quiz="wait" aria-label="Mot du jour">
          <span class="ac-quiz-pic" aria-hidden="true"><img class="ac-quiz-art" src="assets/ui/tour-du-monde.webp" alt="" width="600" height="600" loading="lazy" decoding="async"><img data-ac-quiz-img alt="" decoding="async"></span>
          <div class="ac-quiz-main" data-ac-quiz-main><div class="cult-quiz-head"><span class="ui-label">Mot du jour</span><span class="cult-quiz-meta" data-cult-quiz-meta></span></div>${quiz}<button type="button" class="ui-btn ac-guess" data-ac-guess>Deviner le pays</button></div>
        </section>
        <button type="button" class="ac-tour" data-cult-index><img class="ac-tour-pic" src="assets/ui/tampon-vague.webp" alt="" width="230" height="230" loading="lazy" decoding="async"><span>Tour du monde</span>${CHEVRON}</button>
      </div>
    </section>`;
  }
  /* État de la carte, lu sur le jeu posé par cultures.js : en attente, fermé, ouvert (trois réponses), résultat. */
  let quizMO=null,quizPic='';
  function syncQuiz(){
    const box=$('[data-ac-quiz]',home),b=box?.querySelector('[data-cult-quiz-body]');if(!box||!b)return;
    const now=box.dataset.acQuiz,next=b.classList.contains('is-wait')?'wait':b.classList.contains('is-done')?'done':now==='open'||b.classList.contains('is-busy')?'open':'closed';
    if(now!==next){box.dataset.acQuiz=next;moveQuiz(box,next,now);}
    syncQuizPic(box,next);
  }
  /* L’état vient de changer : sa petite animation (ui-accueil.css, data-ac-move, et data-ac-from pour l’état d’avant)
     se joue une fois, puis la marque part. Rien sous le rideau ni en mouvement réduit. */
  let moveT=0;
  function moveQuiz(box,state,from){
    clearTimeout(moveT);
    if(calmV2()||!onScreen()){box.removeAttribute('data-ac-move');return;}
    box.dataset.acFrom=from||'';box.dataset.acMove=state;moveT=setTimeout(()=>box.removeAttribute('data-ac-move'),1000);
  }
  /* Photo du pays du jour : une vraie photo d’un de ses spots, la plus lumineuse. Elle n’est montrée qu’avec le résultat
     (jusque-là le cadre garde son illustration : la photo ne souffle pas la réponse). Chargée dès que les réponses sont
     ouvertes, elle arrive en fondu sur l’illustration, à la même place. Pays sans photo : l’illustration reste. */
  function syncQuizPic(box,state){
    const view=window.OceanCultures?._view,M=window.CulturesModel,img=box.querySelector('[data-ac-quiz-img]');
    if(!view?.load||!M?.quiz||!img)return;
    if(state!=='open'&&state!=='done'){img.classList.remove('is-on');return;}
    view.load().then(data=>{
      const q=M.quiz(data,new Date()),c=q&&q.country;if(!c||!img.isConnected)return;
      if(quizPic!==c+lang()){
        const best=SPOTS.filter(s=>s.country===c&&!s.custom).map(s=>({s,p:photo(s)})).filter(x=>x.p).sort((a,b)=>vib(b.s.id)-vib(a.s.id)||(a.s.id<b.s.id?-1:1))[0];
        quizPic=c+lang();img.classList.remove('is-on');
        if(!best){img.removeAttribute('src');return;}
        img.src=best.p.thumb;
      }
      if(!img.getAttribute('src'))return;
      const show=()=>{if(box.dataset.acQuiz==='done')img.classList.add('is-on');};
      /* Déjà chargée : posée un instant après le retour du cadre, pour que le fondu se voie. */
      if(img.complete&&img.naturalWidth)setTimeout(show,90);else img.onload=show;
    }).catch(()=>{});
  }
  function watchQuiz(){
    quizMO?.disconnect();quizMO=null;quizPic='';
    const main=$('[data-ac-quiz-main]',home);if(!main)return;
    if(window.MutationObserver){quizMO=new MutationObserver(syncQuiz);quizMO.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
    syncQuiz();
  }
  /* « Deviner le pays » : les trois réponses prennent la place du bouton (même hauteur) ; le jeu se charge s’il ne l’est pas. */
  function openQuiz(){
    const box=$('[data-ac-quiz]',home);if(!box)return;
    if(box.dataset.acQuiz==='closed'){box.dataset.acQuiz='open';moveQuiz(box,'open','closed');}
    window.OceanCultures?.ensure?.().then(()=>{syncQuiz();box.querySelector('[data-cult-choice]')?.focus({preventScroll:true});}).catch(()=>{window.OceanCultures?.offline?.();});
  }

  /* ---------- Calendrier de l’Avent : une carte compacte, du 1er au 24 décembre seulement ---------- */
  function adventV2(all){
    noelIds=[];
    if(!noel.on||!NM||!seasons||!lite)return '';
    const days=NM.adventDays(noel.date);if(!days)return '';
    noelIds=NM.sunnySpots(all,{seasons,sea:(s,mm)=>val(s,'sea',mm),scores,month:NM.railMonth(noel.date)}).map(s=>s.id);
    if(noelIds.length<3){noelIds=[];return '';}
    const opened=aventOpened();
    return `<section class="ac-sec hf-avent" data-hf="avent" data-hf-avent-sec aria-labelledby="acAventT">
      <div class="as-sec ui-head ac-in"${rise(0)}><h2 class="ui-title" id="acAventT">Calendrier de l’Avent</h2></div>
      <div class="ui-card ac-avent ac-in"${rise(1)}><div class="hf-avent-row" role="group" aria-label="Calendrier de l’Avent">${days.map(c=>aventCase(c,opened)).join('')}</div></div>
    </section>`;
  }

  /* ---------- Rendu et vie ---------- */
  function renderV2(){
    const used=new Set();
    const all=bright(daily(SPOTS.filter(s=>photo(s)),'pool'));
    const sp=curSport(),pool=sp==='all'?all:all.filter(s=>has(s,sp));
    const B={};
    B.mesSpots=mineSection();mineIds.forEach(id=>used.add(id));
    B.bon=goodSection(used);goodIds.forEach(id=>used.add(id));
    B.avent=adventV2(all);
    B.mois=monthSection(pool,used);
    B.cultures=culturesV2();
    const cols=Layout?.V2||[['mesSpots','bon'],['avent','mois','cultures']];
    /* Blocs posés par d’autres scripts (Ton espace, immersion, nouveautés, Poulpy) : rangés hors de l’écran, à des places
       réservées cachées (order). Ils ne sont plus affichés sur l’accueil et aucun ne pousse le fil en arrivant tard. */
    return cols.map(c=>`<div class="ac-col">${c.map(k=>B[k]||'').join('')}</div>`).join('')+`<div class="ac-off" hidden>${Object.keys(OWNED).map(slot).join('')}</div>`;
  }
  /* Rangée du mois arrivée au bout : son fondu de droite part (tablette et ordinateur, ui-accueil.css). */
  function watchRow(){
    const row=$('.hf-feed .ac-row',home);if(!row)return;
    const end=()=>row.classList.toggle('is-end',row.scrollLeft+row.clientWidth>=row.scrollWidth-8);
    row.addEventListener('scroll',end,{passive:true});end();
  }
  /* Après le montage : jeu du jour suivi, rangée suivie, conditions demandées. */
  function bindV2(){watchQuiz();watchRow();bindPull();loadLive();}
  /* Entrée des blocs, une seule fois, quand le rideau se lève (jamais avant : elle se jouerait sans être vue), et chiffres
     qui montent pour les conditions déjà écrites. La classe est retirée ensuite : un fil remonté plus tard n’entre pas. */
  let entered=false;
  function enterV2(){
    if(entered)return;entered=true;
    const calm=matchMedia('(prefers-reduced-motion: reduce)').matches||body().classList.contains('reduce-motion');
    if(!calm){home.classList.add('ac-go');setTimeout(()=>home.classList.remove('ac-go'),1400);}
    home.querySelectorAll('.hf-feed [data-ac-live][data-ac-ok]').forEach(showLive);
    /* Le grand chiffre de la carte sans favori monte jusqu’à sa valeur (rien en mouvement réduit). */
    Verdict?.animate($('.hf-feed [data-ac-empty]',home));
    if(!calm)watchSee();
  }
  /* Blocs sous le premier écran : ils entrent quand ils arrivent à l’écran, une fois, au lieu de jouer leur entrée sans
     être vus à la levée du rideau. Ils attendent sans opacité (ac-wait), puis glissent en place (ac-see, retirée ensuite
     pour ne pas se rejouer). Les cartes du mois encore hors de la rangée entrent de la même façon au défilement de côté.
     Sans IntersectionObserver ou en mouvement réduit : rien n’attend, tout est déjà là. Aucune hauteur ne change. */
  let seeIO=null;
  /* Marge basse de 8 % : un bloc entre quand il a dépassé la barre d’onglets. Écrite par morceaux, pour ne pas ajouter
     un faux texte à traduire (i18n-extract.cjs relève les chaînes entre guillemets qui contiennent une espace). */
  const SEE_MARGIN=['0px','0px','-8%','0px'].join(' ');
  function watchSee(){
    seeIO?.disconnect();seeIO=null;
    const wrap=home.closest('.screen-wrap');
    if(!wrap||typeof IntersectionObserver!=='function')return;
    const low=wrap.getBoundingClientRect().bottom,wide=wrap.getBoundingClientRect().right;
    const far=[...home.querySelectorAll('.hf-feed .ac-in')].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&(r.top>=low||r.left>=wide);});
    if(!far.length)return;
    seeIO=new IntersectionObserver(list=>{
      /* Les blocs arrivés ensemble entrent l’un après l’autre (--k, 45 ms par rang) ; une carte arrivée seule, tout de suite. */
      let k=0;
      for(const en of list){
        if(!en.isIntersecting)continue;
        const el=en.target;seeIO.unobserve(el);
        el.style.setProperty('--k',String(Math.min(k++,5)));
        el.classList.remove('ac-wait');el.classList.add('ac-see');
        setTimeout(()=>el.classList.remove('ac-see'),1200);
        if(el.hasAttribute('data-ac-empty'))Verdict?.animate(el);
      }
    },{root:wrap,rootMargin:SEE_MARGIN});
    for(const el of far){el.classList.add('ac-wait');seeIO.observe(el);}
  }
  /* Retour sur l’accueil (fiche refermée, autre onglet, app rouverte) : un signe de vie, une fois par retour. Les pastilles
     de verdict battent une fois l’une après l’autre (elles restent lisibles) et le point du relevé bat ; les chiffres ne
     bougent que s’ils ont changé (paintLive). Classes posées puis retirées : aucune boucle, rien en mouvement réduit, aucune hauteur ne change. */
  let wokeAt=0;
  function wakeV2(){
    if(!entered||calmV2()||!onScreen())return;
    const t=Date.now();if(t-wokeAt<1500)return;wokeAt=t;
    const rows=[...home.querySelectorAll('.hf-feed [data-ac-live][data-ac-ok]')];
    rows.forEach((el,i)=>{el.style.setProperty('--w',String(i));el.classList.remove('ac-wake');});
    void home.offsetWidth;
    rows.forEach(el=>el.classList.add('ac-wake'));
    setTimeout(()=>rows.forEach(el=>el.classList.remove('ac-wake')),1400);
    beat($('[data-ac-fresh]:not([hidden])',home));
  }
  /* Données arrivées après la levée : seules les pastilles des cartes du mois changent, sur place. */
  function lateV2(){
    home.querySelectorAll('.hf-feed .ac-card[data-spot]').forEach(c=>{const s=spotOf(c.dataset.spot),p=c.querySelector('[data-ac-chips]');if(s&&p)p.innerHTML=monthChips(s,+c.dataset.hfM);});
  }
  /* ================= Fin de l’accueil v2 ================= */

  /* ---------- Tirer pour rafraîchir (lot 1) ----------
     Tiré depuis le haut de l'accueil (défilement à zéro), au-delà de 72 px : les conditions de « Mes spots » et de « Pour toi »
     sont redemandées au service sans reprendre la mesure gardée 30 min. Pas plus d'un rafraîchissement toutes les 20 s
     (quota d'Open-Meteo). Le geste n'est jamais seul : toucher l'heure du relevé, à côté du titre, fait la même chose.
     L'indication est une pastille fixe au-dessus de l'écran : elle ne déplace rien. Après : l'heure du relevé, ou « Pas de
     réseau. Derniers relevés gardés. » quand rien de plus récent n'est arrivé. */
  let pullEl=null,pullHideT=0,lastPull=0,pullBound=false;
  function pullPill(){
    /* La pastille est posée dans index.html (fixe, cachée) : rien n'est inséré dans la page ici. */
    if(!pullEl)pullEl=document.getElementById('acPull')||document.createElement('div');
    return pullEl;
  }
  function pullShow(text,dy){
    clearTimeout(pullHideT);const el=pullPill();
    if(el.textContent!==text)el.textContent=text;
    el.style.setProperty('--py',Math.min(dy||0,90)+'px');el.hidden=false;void el.offsetWidth;el.classList.add('on');
  }
  function pullHide(after){
    clearTimeout(pullHideT);
    pullHideT=setTimeout(()=>{if(!pullEl)return;pullEl.classList.remove('on');setTimeout(()=>{if(pullEl&&!pullEl.classList.contains('on'))pullEl.hidden=true;},260);},after||0);
  }
  function refreshNow(){
    if(!V2||!built||!Verdict||!CM)return Promise.resolve(null);
    const t=Date.now();
    if(!CM.canRefresh(lastPull,t)){pullShow(freshAt?tr('Relevé à {0}').replace('{0}',freshLabel(freshAt)):tr('Mise à jour…'),40);pullHide(1400);return Promise.resolve(null);}
    lastPull=t;pullShow(tr('Mise à jour…'),40);
    return loadLive(true).then(map=>{
      const ents=map?[...map.values()].filter(e=>e&&e.now):[];
      const noNew=offlineNow()||!ents.length||ents.every(e=>e.kept);
      pullShow(noNew?tr('Pas de réseau. Derniers relevés gardés.'):tr('Relevé à {0}').replace('{0}',freshLabel(freshAt||Date.now())),40);
      pullHide(1800);return map;
    });
  }
  function bindPull(){
    if(pullBound||!V2)return;
    const wrap=home.closest('.screen-wrap');if(!wrap)return;
    pullBound=true;
    let y0=0,dy=0,on=false;
    wrap.addEventListener('touchstart',e=>{on=wrap.scrollTop<=0&&onScreen()&&e.touches.length===1;dy=0;if(on)y0=e.touches[0].clientY;},{passive:true});
    wrap.addEventListener('touchmove',e=>{
      if(!on)return;
      if(wrap.scrollTop>0){on=false;pullHide();return;}
      dy=e.touches[0].clientY-y0;
      const st=CM.pullState(dy);
      if(st==='idle'){pullHide();return;}
      pullShow(st==='ready'?tr('Relâche pour rafraîchir'):tr('Tire pour rafraîchir'),dy*.6);
    },{passive:true});
    const end=()=>{if(!on)return;on=false;const st=CM.pullState(dy);dy=0;if(st==='ready')refreshNow();else pullHide();};
    wrap.addEventListener('touchend',end,{passive:true});
    wrap.addEventListener('touchcancel',()=>{on=false;dy=0;pullHide();},{passive:true});
  }
  /* Connexion perdue ou revenue : le bandeau du haut suit ; au retour, les conditions sont redemandées (sans forcer). */
  function syncOffline(){
    const el=$('[data-ac-offline]',home);if(!el)return;
    const off=offlineNow();if(el.hidden===off)el.hidden=!off;
  }
  window.addEventListener('offline',syncOffline);
  window.addEventListener('online',()=>{syncOffline();if(built&&onScreen())loadLive();});
  /* Unités changées (Réglages : nœuds, pieds, °F) : les lignes de conditions et les repères du mois sont réécrits sur place. */
  document.addEventListener('ocean:units',()=>{
    if(!V2||!built)return;
    home.querySelectorAll('.hf-feed [data-ac-live]').forEach(el=>{el._acHtml=null;el.removeAttribute('data-ac-ok');});
    loadLive();lateV2();
  });


  function render(){
    if(V2)return renderV2();
    const used=new Set();
    const all=bright(daily(SPOTS.filter(s=>photo(s)),'pool'));
    /* Rangées filtrées par le sport choisi (« Tous » : tout le catalogue) ; une rangée de moins de 3 cartes disparaît
       (pas de « Belle houle » pour un plongeur). Le mode Noël garde tout le catalogue : les cases de l’Avent ne
       changent pas avec le sport. */
    const sp=curSport(),pool=sp==='all'?all:all.filter(s=>has(s,sp));
    const m=new Date().getMonth();
    /* Les blocs sont calculés dans l’ordre historique (Noël, « Pour toi », le mois, les données, les collections) pour
       garder les mêmes spots (un spot n’apparaît qu’une fois sur la page), puis posés dans l’ordre de HomeLayout.ORDER. */
    const B={},plus=[];
    B.noel=noelSection(all,used);
    B.pourtoi=forYouSection(used);
    if(seasons){
      /* Saison qui commence ce mois-ci d’abord, puis saison en cours ; les saisons courtes passent devant « toute l’année ». */
      const inSeason=pool.filter(s=>seasons[s.id]?.includes(m));
      /* Les photos en haute définition passent devant (plus belles en grand format). */
      const score=s=>{const ms=seasons[s.id];return (ms.length===12?2:0)+(ms.includes((m+11)%12)?1:0)+ms.length/24+((photo(s)?.w||0)>=1200?0:1.5)+(100-vib(s.id))/25;};
      const ordered=inSeason.map(s=>({s,k:score(s)})).sort((a,b)=>a.k-b.k).map(o=>o.s);
      B.mois=rail('mois',`Où partir en ${monthName(m)} ?`,'Repère indicatif d’après nos carnets et les moyennes climatiques, à confirmer sur place.',pick(ordered,{n:10,perCountry:1,used}),{big:true,season:true,more:true,data:'sea'});
    }
    if(lite){
      B.plan=planCard(m);
      B.jeu=surfCard();
      /* Rails de données : la mer chaude, la houle et le vent du mois, d’après les normales de plusieurs années.
         Seules celles qui concernent ton sport restent dépliées (HomeLayout.railShown). */
      const data=[];
      const warm=pool.filter(s=>(val(s,'sea',m)??0)>=26).sort((a,b)=>Math.round(vib(b.id)/25)-Math.round(vib(a.id)/25)||val(b,'sea',m)-val(a,'sea',m));
      data.push(['chaud',`La mer la plus chaude en ${monthName(m)}`,rail('chaud',`La mer la plus chaude en ${monthName(m)}`,'26 °C et plus d’après les normales NOAA : on y entre sans frissonner.',pick(warm,{n:10,perCountry:1,used}),{data:'sea'})]);
      const swell=pool.filter(s=>has(s,'surf','bodyboard')&&(val(s,'hs',m)??0)>=14&&(val(s,'hs',m)??0)<=32).sort((a,b)=>val(b,'hs',m)-val(a,'hs',m));
      data.push(['houle',`Belle houle en ${monthName(m)}`,rail('houle',`Belle houle en ${monthName(m)}`,'Les spots de surf qui reçoivent le plus de vagues ce mois-ci, au large.',pick(swell,{n:10,perCountry:2,used}),{data:'wave',season:true})]);
      const wind=pool.filter(s=>has(s,'kitesurf','windsurf')&&(val(s,'kite',m)??0)>=60).sort((a,b)=>val(b,'kite',m)-val(a,'kite',m));
      data.push(['vent',`Du vent en ${monthName(m)}`,rail('vent',`Du vent en ${monthName(m)}`,'Kite et windsurf : vent soutenu plus d’un jour sur deux.',pick(wind,{n:10,perCountry:2,used}),{data:'wind'})]);
      const shown=Layout?.railShown||(()=>true);
      B.donnees=data.filter(([id,,h])=>h&&shown(id,sp)).map(([,,h])=>h).join('');
      for(const [id,title,h] of data)if(h&&!shown(id,sp))plus.push({title,html:h});
    }
    for(const c of COLLECTIONS){
      const h=rail(c.id,c.title,c.sub,pick(pool.filter(c.test),{n:10,perCountry:2,used}),{season:true});
      if(h)plus.push({title:c.title,html:h});
    }
    B.collections=plus.map(x=>x.html).join('');
    B.planete=worldCard();
    B.envies=slot('envies');
    /* « Tour du monde des cultures » et « Le mot du jour » (cultures-boot.js), à hauteur fixe ; place dans HomeLayout.ORDER. */
    B.cultures=culturesSection();
    for(const k of Object.keys(OWNED))B[k]=slot(k);
    /* Moins d’informations d’un coup : ORDER = sections visibles, FOLDED = blocs repliés sous « Plus d’idées de départ »
       (les places réservées des autres scripts y sont aussi : ils s’y posent sans rien décaler, la section est fermée). */
    const ORDER=Layout?.ORDER||['pourtoi','noel','mois','cultures','espace','plus'];
    const FOLDED=Layout?.FOLDED||['plan','planete','envies','immersion','donnees','collections','nouveautes','jeu','poulpy'];
    B.plus=plusSection(FOLDED.map(k=>B[k]||'').filter(Boolean));
    return ORDER.map(k=>B[k]||'').join('');
  }

  /* Ordre (HomeLayout.ORDER) : ouverture (recherche, raccourcis, activités, spots de rêve), « Pour toi », Noël, le mois,
     « Quand ? », ton espace, la planète, les envies, l’immersion, les données, le repli, les nouveautés, le jeu, Poulpy.
     home-feed.js est le seul à ordonner l’accueil, une fois, au montage (sous le rideau de démarrage). */
  function order(){
    const large=$('.as-large',home),heroEl=$('.hf-top',home),feed=$('.hf-feed',home);
    if(!heroEl||!feed)return;
    if(large&&large.nextElementSibling!==heroEl)large.after(heroEl);
    if(heroEl.nextElementSibling!==feed)heroEl.after(feed);
    for(const [k,sel] of Object.entries(OWNED)){
      /* Élément pas encore créé (l’immersion peut arriver après le montage sur un appareil lent) : la marque cachée
         reste, et le module se pose devant elle à sa création (ocean-home.js), sans rien retirer du fil. */
      const mark=feed.querySelector(`[data-hf-slot="${k}"]`),el=$(sel,home);
      if(mark&&el)mark.replaceWith(el);
    }
  }
  /* Ouverture (recherche, spots de rêve) : posée dès l’exécution du script pour que sa photo se charge pendant l’attente des données. */
  function mountHero(){
    if($('.hf-top',home))return;
    const tmp=document.createElement('div');tmp.innerHTML=hero();
    const q=$('[data-hf-quick]',tmp);if(q)q._obHtml=quickHtml();
    ($('.as-large',home)||home.firstElementChild)?.after(tmp.firstElementChild);
    home.classList.add('hf-on');syncActs();syncNoel();
  }
  function mount(){
    mountHero();syncHero();syncNoel();
    let feed=$('.hf-feed',home);
    if(!feed){feed=document.createElement('div');feed.className='hf-feed';$('.hf-top',home).after(feed);}
    /* Les sections posées par d’autres scripts (cockpit, immersion, nouveautés, Poulpy ; anciennes sections masquées)
       sortent du fil avant le nouveau rendu, puis reprennent leur place réservée (order). */
    for(const el of [...Object.values(OWNED).map(s=>$(s,home)),$('.home-intro',home),$('.poulpy-activities',home)])if(el&&feed.contains(el))feed.after(el);
    stopPlanet();
    feed.innerHTML=render();
    /* Envies du moment : quatre tuiles vers les collections (repliées plus bas), à leur place réservée. */
    const mark=feed.querySelector('[data-hf-slot="envies"]');
    if(mark){const mm=moods(feed);if(mm)mark.insertAdjacentHTML('afterend',mm);mark.remove();}
    order();bindHero();watchPlanet();aventToday();syncQuick();built=true;builtSport=curSport();builtLevel=curLevel()||'';
    if(V2){syncTop();bindV2();if(!Boot||Boot.lifted)enterV2();}
  }
  /* Données arrivées après le montage : sous le rideau, le fil est remonté (invisible) ; après la levée, seules les
     pastilles des cartes déjà affichées changent, sur place (aucune section ajoutée, retirée ni déplacée). */
  function late(){
    if(!Boot||!Boot.lifted){mount();ready();return;}
    if(V2){
      lateV2();
      /* Normales arrivées après les lignes (eau et saison du mois d'un spot sans relevé) : elles sont réécrites sur place. */
      home.querySelectorAll('.hf-feed [data-ac-live]').forEach(el=>{el._acHtml=null;});loadLive();
      return;
    }
    const byId=new Map(SPOTS.map(s=>[s.id,s]));
    home.querySelectorAll('.hf-feed .hf-card[data-spot]').forEach(c=>{
      const s=byId.get(c.dataset.spot),p=c.querySelector('.hf-card-tx p');if(!s||!p)return;
      p.innerHTML=chips(s,c.dataset.hfData||null,c.hasAttribute('data-hf-season')?seasonLabel(seasons?.[s.id]):null,c.dataset.hfM!=null?+c.dataset.hfM:null);
    });
    lateForYou();
  }
  /* Accueil prêt : la photo d’ouverture est décodée et les polices des titres chargées (avec un plafond). */
  function settle(){
    /* Interface v2 : plus de grande photo ; les photos des premières lignes (« Mes spots »), ou l’illustration de la carte
       sans favori (le premier écran d’un nouveau venu), et les polices des titres. */
    const imgs=V2?[...home.querySelectorAll('.hf-feed [data-ac-mine] img,.hf-feed [data-ac-empty]>img')].slice(0,3):[home.querySelector('.hf-slide img')];
    const jobs=imgs.map(img=>img?.decode?img.decode().catch(()=>{}):null);
    /* Graisses de Figtree de la v2 (800, 700, 500) : écrites à partir de la même chaîne, pour ne pas ajouter de faux
       textes à traduire (i18n-extract.cjs relève les chaînes entre guillemets). */
    const FIG='700 16px "Figtree"',fonts=V2?[FIG.replace('700','800'),FIG,FIG.replace('700','500'),'800 24px "Barlow Condensed"']:['900 48px "Barlow Condensed"','800 24px "Barlow Condensed"',FIG];
    if(document.fonts?.load){for(const f of fonts)jobs.push(document.fonts.load(f).catch(()=>{}));
      jobs.push(Promise.all(jobs).then(()=>document.fonts.ready));}
    return Promise.race([Promise.all(jobs),wait(1500)]);
  }
  /* Étape « feed » du rideau : terminée seulement quand le dernier montage (remontage sous le rideau compris) est prêt. */
  let gen=0;
  function ready(){const g=++gen;Boot?.wait('feed');return settle().then(()=>{if(g===gen)Boot?.done('feed');});}

  /* Interactions : ouvrir un spot, favoris, boutons du héros. */
  home.addEventListener('click',e=>{
    const av=e.target.closest('[data-hf-avent]');
    if(av){openAvent(av);return;}
    /* Interface v2 : pastille « sport, niveau », « Modifier » (tes favoris), « Trouver un spot », « Deviner le pays ». */
    if(e.target.closest('[data-ac-fresh]')){refreshNow();return;}
    if(e.target.closest('[data-ac-me]')){if(typeof openSettings==='function')openSettings('sport');return;}
    if(e.target.closest('[data-ac-edit]')){if(typeof openFavorites==='function')openFavorites();return;}
    if(e.target.closest('[data-ac-find]')){go('spots');return;}
    if(e.target.closest('[data-ac-guess]')){openQuiz();return;}
    const fav=e.target.closest('[data-fav]');
    if(fav){e.stopPropagation();const id=fav.dataset.fav;if(typeof toggleFav==='function'){toggleFav(id,e);}const on=typeof favs!=='undefined'&&favs.has(id);fav.classList.toggle('on',on);if(typeof vibrate==='function')vibrate(8);syncQuick();return;}
    /* Raccourcis : « Mes favoris » ouvre la liste filtrée sur tes favoris ; « Mon voyage » ouvre le voyage. */
    const quick=e.target.closest('[data-hf-q]');
    if(quick){if(quick.dataset.hfQ==='favs'&&typeof openFavorites==='function')openFavorites();return;}
    const trip=e.target.closest('[data-hf-trip]');
    if(trip){window.OceanTrips?.openTrip?.(trip.dataset.hfTrip);return;}
    const fd=e.target.closest('[data-hf-fold]');
    if(fd){fold();return;}
    const prof=e.target.closest('[data-hf-profile]');
    if(prof){if(typeof openSettings==='function')openSettings('sport');return;}
    const surf=e.target.closest('[data-surf-game]');
    if(surf){go('surf');return;}
    const more=e.target.closest('[data-hf-more]');
    if(more){
      /* « Tout voir » : la planète n’allume que les spots en saison ce mois-ci. */
      currentFilter='season';if(typeof syncFilterChips==='function')syncFilterChips();else document.querySelectorAll('#filters [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f==='season'));
      go('spots');try{renderSpots();window.OceanMap?.render?.(true);}catch(_){}
      if(typeof toast==='function')toast(`${SPOTS.filter(s=>inSeason(s.id)).length} spots où nos carnets et les moyennes climatiques s’accordent ce mois-ci`);
      return;
    }
    const jump=e.target.closest('[data-hf-jump]');
    if(jump){const sec=home.querySelector(`[data-hf="${jump.dataset.hfJump}"]`);if(sec?.closest('.hf-plus-body'))fold(true);sec?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
    const act=e.target.closest('[data-hf-act]');
    if(act){
      /* Depuis l’accueil, on reste sur l’accueil : seule l’interface prend les couleurs de l’activité. */
      const id=act.dataset.hfAct==='all'?null:act.dataset.hfAct;
      /* Retour immédiat sur la pastille touchée ; l’état réel revient par « ocean:sport » quand l’activité est appliquée. */
      if((id||'all')!==curSport()&&typeof setSport==='function'){syncActs(id||'all');setSport(id,{stay:true});}
      return;
    }
    const search=e.target.closest('[data-hf-search]');
    if(search){document.querySelector('.mobile-search')?.click();return;}
    const open=e.target.closest('[data-hf-open]')||e.target.closest('.hf-slide[data-spot]');
    if(open&&typeof openSpot==='function'){openSpot(open.dataset.hfOpen||open.dataset.spot);return;}
    const go2=e.target.closest('[data-hf-go]');
    if(go2){if(go2.dataset.hfGo==='trips'){go('trips');}else{go('spots');}return;}
    const card=e.target.closest('.hf-card[data-spot],.hf-fy[data-spot],.ui-spot[data-spot],.ac-card[data-spot]');
    if(card&&typeof openSpot==='function'){openSpot(card.dataset.spot);}
  });
  home.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches('.hf-card,.hf-fy,.ui-spot[data-spot]')){e.preventDefault();e.target.click();return;}
    if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-ac-fresh]')){e.preventDefault();refreshNow();return;}
    /* Groupe radio : les flèches déplacent le focus, Espace ou Entrée choisit (motif ARIA « radio group »). */
    if(e.target.matches('.hf-act')&&['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){
      const all=[...home.querySelectorAll('.hf-act')],i=all.indexOf(e.target),rtl=getComputedStyle(e.target).direction==='rtl';
      const step=(e.key==='ArrowRight'||e.key==='ArrowDown')!==rtl?1:-1;
      const j=e.key==='Home'?0:e.key==='End'?all.length-1:(i+step+all.length)%all.length;
      e.preventDefault();all[j]?.focus();
    }
  });
  /* L’activité a changé ailleurs (barre des sports, Explorer, carte, navigation) : la rangée suit, sans rendu. */
  document.addEventListener('ocean:sport',()=>{syncActs();profileChanged();});
  /* Niveau changé dans Réglages : seul « Pour toi aujourd’hui » change, sur place. */
  document.addEventListener('ocean:level',profileChanged);
  /* Retour à l’accueil : les raccourcis reprennent le dernier spot ouvert, tes favoris et ton voyage, sur place. */
  window.addEventListener('ocean:navigate',e=>{if(e.detail==='home')syncQuick();});
  /* Interface v2 : au retour sur l’accueil (ou dans l’app), la date, le salut, « Mes spots » et les conditions sont
     remis à jour sur place ; les conditions de moins de 30 min viennent du cache, sans demande. */
  function refreshV2(){if(!V2||!built)return;syncTop();syncMine();loadLive();wakeV2();}
  window.addEventListener('ocean:navigate',e=>{if(e.detail==='home')refreshV2();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&homeShown())refreshV2();});
  document.addEventListener('ocean:sport',()=>{if(V2)syncTop();});
  /* Le salut et la pastille sont remesurés quand les polices sont là et quand la largeur change (rotation, fenêtre) ;
     un changement de hauteur seule (barre du navigateur qui se replie au défilement) ne remesure rien. */
  if(V2){try{document.fonts?.ready?.then(fitTop);document.fonts?.addEventListener?.('loadingdone',fitTop);}catch(_){}window.addEventListener('resize',()=>{const row=$('[data-ac-hello]',home);if(row&&row.clientWidth!==fitW)fitTop();},{passive:true});}
  /* Scène interrompue ou annulée avant le changement : la pastille revient à l’activité réellement appliquée. */
  document.addEventListener('ocean:transition',e=>{if(!e.detail)syncActs();});

  /* Démarrage : un seul montage visible. Saisons, éclat des photos et normales légères sont attendus ensemble
     (au plus jusqu’à 3 s après le début du démarrage), puis le fil est monté une fois et le rideau peut se lever. */
  const data=Promise.all([
    Promise.all(['data/seasons.json','data/photo-scores.json'].map(u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null))).then(([d,sc])=>{seasons=d;scores=sc;window.OCEAN_SEASONS=d;window.OCEAN_PHOTO_SCORES=sc;}),
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
  Boot?.after(()=>{lastTouch=Date.now();watchPlanet();if(V2&&built)enterV2();});
  /* Langue changée : on reconstruit (noms des mois). */
  window.addEventListener('ocean:lang',()=>{if(built)mount();});
  window.OceanHomeFeed={refresh:mount,seasonLabel,syncActs};
})();
