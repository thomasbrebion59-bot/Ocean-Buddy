/* Carnet de destination : l’esprit du lieu, les incontournables autour du spot et la nuit la moins chère.
   Les données détaillées (assets/data/spot-guides.js) ne se chargent qu’à l’ouverture d’une fiche,
   du comparateur ou d’un voyage. Sans elles, les repères par pays prennent le relais. */
(() => {
  'use strict';
  const M=window.SpotGuideModel;if(!M)return;
  const DATA_URL='assets/data/spot-guides.js?v=2480384a9576';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=(body,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const P={
    nature:'<path d="M3 20h18M6 20l5-9 3 5 2-3 4 7"/><circle cx="17" cy="6" r="2"/>',
    plage:'<path d="M4 20c2.5-1.5 5.5-1.5 8 0s5.5 1.5 8 0M12 4c-4 0-7 3-7 6h14c0-3-3-6-7-6ZM12 10l3 8"/>',
    village:'<path d="M3 20V11l5-4 5 4v9M13 20v-6l4-3 4 3v6M3 20h18M7 20v-4h2v4"/>',
    ville:'<path d="M4 20V8h6v12M10 20V4h6v16M16 20v-9h4v9M3 20h18M7 11h0M7 14h0M13 8h0M13 11h0M13 14h0"/>',
    marche:'<path d="M4 9h16l-2 11H6L4 9ZM8 9l4-5 4 5M9 13v3M15 13v3"/>',
    musee:'<path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/>',
    patrimoine:'<path d="M4 20V9l2-2 2 2v3h8V9l2-2 2 2v11M4 20h16M10 20v-4a2 2 0 0 1 4 0v4M6 4v3M18 4v3"/>',
    panorama:'<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M5 10.5 7 5h2l1 5M19 10.5 17 5h-2l-1 5"/>',
    rando:'<path d="M13 4a1.5 1.5 0 1 0 0 .01M10 21l2-6 3 3v3M9 12l2-3 3 2 2 3M11 9l-2 5"/><path d="M5 21h14" stroke-dasharray="2 3"/>',
    ile:'<path d="M3 19c3-2 6-2 9 0s6 2 9 0M8 17c1-4 3-6 3-10M11 7c-2-1-4-1-6 1M11 7c1-2 3-3 6-2M11 7c2 0 4 1 5 3"/>',
    lac:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9 15c1 1 2 1.5 3 1.5"/>',
    food:'<path d="M4 11h16a8 8 0 0 1-16 0ZM8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3M3 20h18"/>',
    respect:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M9 11.5l2 2 4-4"/>',
    season:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    speech:'<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    camping:'<path d="M3 20 12 5l9 15H3ZM12 5v15M9 20l3-5 3 5M2 20h20"/>',
    hostel:'<path d="M4 20V6M20 20v-8M4 12h16M4 16h16M7 12V9h4v3"/>',
    surfcamp:'<path d="M17 3c-6 3-10 9-11 17 5-2 11-8 13-15l-2-2ZM9 14l3 3"/>',
    guest:'<path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5"/>',
    hotel:'<path d="M4 21V4h16v17M8 8h2M14 8h2M8 12h2M14 12h2M10 21v-4h4v4"/>',
    map:'<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14"/>',
    ext:'<path d="M7 17 17 7M8 7h9v9"/>',
    book:'<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1V5ZM12 6v14"/>',
    calendar:'<path d="M4 6h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    bed:'<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 11.5a1.5 1.5 0 1 0 0-.01"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>'
  };
  const icon=(k,cls)=>svg(P[k]||P.nature,cls);
  const KIND_LABEL={nature:'Nature',plage:'Plage',village:'Village',ville:'Ville',marche:'Marché',musee:'Musée',patrimoine:'Patrimoine',panorama:'Point de vue',rando:'Randonnée',ile:'Île',lac:'Lac'};
  const DIRS=['au nord','au nord-est','à l’est','au sud-est','au sud','au sud-ouest','à l’ouest','au nord-ouest'];
  let data=null,loading=null,current=null,section=null;

  /* ---------- Données ---------- */
  function load(){
    if(data)return Promise.resolve(data);
    if(window.OCEAN_SPOT_GUIDES){data=window.OCEAN_SPOT_GUIDES;return Promise.resolve(data);}
    if(!loading)loading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=DATA_URL;script.async=true;
      script.onload=()=>{data=window.OCEAN_SPOT_GUIDES||{spots:{},countries:{}};resolve(data);};
      script.onerror=()=>{loading=null;script.remove();reject(Error('Guide indisponible'));};
      document.head.append(script);
    });
    return loading;
  }
  const ready=()=>!!data;
  const allSpots=()=>typeof SPOTS!=="undefined"?SPOTS:[];
  const coordsOf=id=>(typeof COORDS!=="undefined"&&COORDS[id])||allSpots().find(s=>s.id===id)?.coords||null;
  const spotById=id=>allSpots().find(s=>s.id===id);
  /* Une fiche de carnet peut corriger un pays mal renseigné dans le catalogue (champ c). */
  const country=s=>data?.spots?.[s?.id]?.c||s?.country||(typeof countryOf==='function'?countryOf(s):'');
  const world=s=>s?.world||(typeof SPOT_WORLD!=="undefined"?SPOT_WORLD:{})[s?.id]||'eu';
  const entry=id=>data?.spots?.[id]||null;
  function culture(s){
    const c=data?.countries?.[country(s)]||null,g=entry(s.id)||{};
    return {lang:g.l||c?.lang||'',hello:g.h||c?.hello||null,food:g.f||c?.food||null,respect:g.r||c?.respect||'',vibe:g.v||'',season:g.s||(s.editorialStatus==='reviewed'?s.visit?.bestPeriod:'')||'',grounded:!!g.v};
  }
  function estimate(s){if(!s)return null;return M.estimate({country:country(s),loc:s.loc,world:world(s)},entry(s.id)?.z);}
  function priceFor(id,month){const s=spotById(id);if(!s||s.custom)return null;const e=estimate(s);return e?M.nightly(e,month):null;}
  function place(s,e){
    const town=e?.town||String(s.loc||'').split(',')[0]||s.name.split(' — ')[0];
    const ctry=country(s);
    return town&&ctry&&!town.includes(ctry)?town+', '+ctry:(town||s.name);
  }
  let allLows=null;
  function lows(){if(!allLows&&data)allLows=allSpots().filter(s=>!s.custom).map(s=>({id:s.id,lo:estimate(s).lo,country:country(s)}));return allLows||[];}

  /* ---------- Outils ---------- */
  function distance(a,b){const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r,x=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function bearing(a,b){const r=Math.PI/180,y=Math.sin((b.lon-a.lon)*r)*Math.cos(b.lat*r),x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lon-a.lon)*r);return (Math.atan2(y,x)/r+360)%360;}
  function whereText(km,deg){
    if(km<1)return 'À moins d’un kilomètre du spot';
    return `À ${Math.round(km)} km ${DIRS[Math.round(deg/45)%8]}`;
  }
  const mapsUrl=(name,s)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+(s.loc||country(s)));
  const wikiUrl=(lang,title)=>`https://${lang==='fr'?'fr':'en'}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g,'_'))}`;
  const monthNow=()=>new Date().getMonth()+1;
  const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  /* ---------- L’esprit du lieu ---------- */
  function spiritHTML(s){
    const c=culture(s),photo=typeof spotPhotoUrl==='function'?spotPhotoUrl(s.id,1280):'';
    const hello=c.hello?.[0]||'',gloss=c.hello?.[1]||'';
    const tiles=[
      c.food&&['food','À goûter sur place',c.food[0],c.food[1]],
      c.respect&&['respect','Le bon geste',null,c.respect],
      c.season&&['season','La bonne saison',null,c.season]
    ].filter(Boolean);
    return `<div class="guide-chapter"><span class="guide-chapter-number">01</span><span class="guide-chapter-label">L’esprit du lieu</span></div>
      <div class="guide-spirit-cover${photo?'':' no-photo'}">${photo?`<img src="${esc(photo)}" alt="" loading="lazy" decoding="async">`:''}
        <div class="guide-spirit-words">
          <span class="guide-eyebrow">${esc(country(s)||'Carnet de voyage')}${c.lang?` · ${esc(c.lang)}`:''}</span>
          ${hello?`<p class="guide-hello" lang="und"><span aria-hidden="true">«&nbsp;</span>${esc(hello)}<span aria-hidden="true">&nbsp;»</span></p><p class="guide-gloss"><img src="assets/poulpy/scenes/travel-v2.webp" alt="" width="40" height="40" loading="lazy" decoding="async"><span>Poulpy te souffle le mot du coin : ${esc(gloss)}.</span></p>`:`<h3 class="guide-hello">Le temps d’une escale</h3>`}
        </div>
      </div>
      ${c.vibe?`<blockquote class="guide-vibe"><svg class="guide-quote" viewBox="0 0 48 40" aria-hidden="true"><path d="M0 40V24C0 10 7 2 20 0l2 6c-7 2-11 7-11 14h9v20H0Zm26 0V24C26 10 33 2 46 0l2 6c-7 2-11 7-11 14h9v20H26Z" fill="currentColor"/></svg><p>${esc(c.vibe)}</p></blockquote>`:''}
      ${tiles.length?`<div class="guide-tiles">${tiles.map(([k,label,title,text])=>`<article class="guide-tile tile-${k}"><span class="guide-tile-icon">${icon(k)}</span><small>${label}</small>${title?`<b>${esc(title)}</b>`:''}<p>${esc(text)}</p></article>`).join('')}</div>`:''}
      ${c.grounded?'':'<p class="guide-note">Repères culturels généraux du pays. La fiche détaillée de ce spot arrive bientôt.</p>'}`;
  }

  /* ---------- À découvrir autour ---------- */
  function aroundItems(s){
    const c=coordsOf(s.id)||s.coords,g=entry(s.id);
    if(!c||!g?.a)return [];
    return g.a.map(([n,d,k,lat,lon,wiki],i)=>{const title=wiki===1?n.replace(/’/g,"'"):wiki;const km=distance(c,{lat,lon}),deg=bearing(c,{lat,lon});return {i:i+1,n,d,k,lat,lon,title,km,deg};});
  }
  function radar(items){
    const far=Math.max(...items.map(x=>x.km)),nice=[2,5,10,15,20,30,40];
    const max=nice.find(v=>v>=far)||Math.ceil(far/10)*10,R=118,C=150;
    // Échelle en racine carrée : les lieux proches ne se chevauchent pas au centre.
    const radius=km=>Math.max(32,Math.sqrt(km/max)*R);
    const rings=[max/4,max/2,max].map(v=>({r:radius(v),label:Number.isInteger(v)?v:v.toFixed(1).replace('.',',')}));
    // Les lieux très proches l’un de l’autre s’écartent un peu (rotation puis éloignement) pour rester lisibles.
    const pos=[];
    items.forEach(x=>{
      let r=radius(x.km),deg=x.deg,p;
      for(let t=0;t<14;t++){
        const a=(deg-90)*Math.PI/180;p={...x,x:C+r*Math.cos(a),y:C+r*Math.sin(a)};
        if(pos.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=26))break;
        deg=x.deg+(t%2?-1:1)*Math.ceil((t+1)/2)*22;if(t===7)r=Math.min(R,r+18);
      }
      pos.push(p);
    });
    return `<svg class="guide-radar" viewBox="0 0 300 300" role="img" aria-label="Schéma des lieux à découvrir autour du spot, distances à vol d’oiseau">
      <defs><radialGradient id="guideRadarBg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe6ff"/></radialGradient></defs>
      <circle cx="${C}" cy="${C}" r="${R+14}" fill="url(#guideRadarBg)"/>
      ${rings.map(g=>`<circle cx="${C}" cy="${C}" r="${g.r}" fill="none" stroke="#9fb7f0" stroke-width="1" stroke-dasharray="3 5"/><text x="${C+4}" y="${C-g.r+12}" class="guide-radar-ring">${g.label} km</text>`).join('')}
      <path d="M${C} ${C-R-14}V${C+R+14}M${C-R-14} ${C}H${C+R+14}" stroke="#c4d4f7" stroke-width="1"/>
      <path d="M${C} 8l6 14h-12z" fill="#1f55e0"/><text x="${C}" y="36" text-anchor="middle" class="guide-radar-n">N</text>
      ${pos.map(p=>`<line x1="${C}" y1="${C}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#ff7a55" stroke-width="1.2" stroke-dasharray="2 4" opacity=".7"/>`).join('')}
      <circle cx="${C}" cy="${C}" r="17" fill="#1f55e0"/><clipPath id="guideRadarClip"><circle cx="${C}" cy="${C}" r="15"/></clipPath><circle cx="${C}" cy="${C}" r="15" fill="#fff"/><image href="assets/poulpy/scenes/travel-v2.webp" x="${C-15}" y="${C-15}" width="30" height="30" clip-path="url(#guideRadarClip)" preserveAspectRatio="xMidYMid slice"/>
      ${pos.map(p=>`<g class="guide-radar-point" data-around-point="${p.i}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="12" fill="#ff7a55" stroke="#fff" stroke-width="3"/><text x="${p.x.toFixed(1)}" y="${(p.y+4).toFixed(1)}" text-anchor="middle">${p.i}</text></g>`).join('')}
    </svg>`;
  }
  function aroundTitle(s){
    const sports=typeof spotSports==='function'?spotSports(s):(s.sports||[]);
    if(typeof isInland==='function'?isInland(s):s.waterType!=='sea')return 'Au-delà du rivage.';
    if(['plongee','snorkeling'].includes(sports[0]))return 'Après la plongée.';
    if(['kitesurf','windsurf'].includes(sports[0]))return 'Quand le vent tombe.';
    return 'Au-delà de la vague.';
  }
  function aroundHTML(s){
    const items=aroundItems(s),lang=entry(s.id)?.w||'en',c=coordsOf(s.id);
    const head=`<div class="guide-chapter"><span class="guide-chapter-number">02</span><span class="guide-chapter-label">À découvrir autour</span></div><div class="guide-heading"><div><h3>${esc(aroundTitle(s))}</h3><p>Des lieux réels, à moins de 30 km, pour une demi-journée hors de l’eau.</p></div></div>`;
    if(!items.length){
      const q=k=>'https://www.google.com/maps/search/'+encodeURIComponent(k)+(c?`/@${c.lat},${c.lon},12z`:encodeURIComponent(' '+s.loc));
      return head+`<div class="guide-around-fallback"><p>Poulpy n’a pas encore sélectionné les incontournables de ce secteur. Explore les environs sur la carte :</p><div class="guide-chips">${[['panorama','Points de vue','point de vue'],['marche','Marchés','marché'],['rando','Randonnées','randonnée'],['musee','Musées','musée']].map(([k,label,query])=>`<a href="${esc(q(query))}" target="_blank" rel="noopener">${icon(k)}<span>${label}</span></a>`).join('')}</div></div>`;
    }
    return head+`<div class="guide-around-layout"><figure class="guide-radar-wrap">${radar(items)}<figcaption>Distances à vol d’oiseau depuis le secteur du spot. Le trajet réel peut être plus long.</figcaption></figure>
      <ol class="guide-around-list">${items.map(x=>`<li class="guide-place" data-around-item="${x.i}"><span class="guide-place-number">${x.i}</span><div class="guide-place-body"><span class="guide-place-kind">${icon(x.k)}${esc(KIND_LABEL[x.k]||'À voir')}</span><b>${esc(x.n)}</b><p>${esc(x.d)}</p><span class="guide-place-where">${esc(whereText(x.km,x.deg))}</span><span class="guide-place-links"><a href="${esc(mapsUrl(x.n,s))}" target="_blank" rel="noopener">${icon('map')}<span>Voir sur la carte</span></a>${x.title?`<a href="${esc(wikiUrl(lang,x.title))}" target="_blank" rel="noopener">${icon('book')}<span>En savoir plus</span></a>`:''}</span></div></li>`).join('')}</ol></div>
      <p class="guide-source">Lieux sélectionnés par Ocean Buddy et situés grâce aux coordonnées de Wikipédia. Vérifie horaires et accès avant de partir.</p>`;
  }

  /* ---------- Dormir pas cher ---------- */
  function tripDates(s){
    const trips=window.OceanTrips?.list?.()||[];
    for(const t of trips){
      const i=t.steps.findIndex(x=>x.spotId===s.id&&x.date);if(i<0)continue;
      const next=t.steps.slice(i+1).find(x=>x.date&&x.date>t.steps[i].date);
      const out=next?.date||(t.end&&t.end>t.steps[i].date?t.end:'');
      if(out)return {checkin:t.steps[i].date,checkout:out,name:t.name};
    }
    return null;
  }
  const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  function gauge(s,e){
    const list=lows();if(list.length<10)return '';
    const values=list.map(x=>x.lo),min=Math.min(...values),max=Math.max(...values);
    const scale=v=>Math.log(v/min)/Math.log(max/min)*100;
    const more=values.filter(v=>v>e.lo).length,less=values.filter(v=>v<e.lo).length;
    const rank=more>=less?`Moins cher que ${Math.round(more/values.length*100)} % des spots Ocean Buddy`:`Plus cher que ${Math.round(less/values.length*100)} % des spots Ocean Buddy`;
    const same=list.filter(x=>x.country===country(s)&&x.id!==s.id);
    const cheapest=same.length?same.reduce((a,b)=>b.lo<a.lo?b:a):null;
    const cheapSpot=cheapest&&cheapest.lo<e.lo?spotById(cheapest.id):null;
    return `<div class="guide-gauge"><div class="guide-gauge-head"><b>${rank}</b><span>Nuit la moins chère, basse saison</span></div>
      <div class="guide-gauge-track" aria-hidden="true">${values.map(v=>`<i style="left:${scale(v).toFixed(1)}%"></i>`).join('')}<em style="left:${scale(e.lo).toFixed(1)}%"><span>${e.lo} €</span></em></div>
      <div class="guide-gauge-scale" aria-hidden="true"><span>${min} €</span><span>${max} €</span></div>
      ${cheapSpot?`<button type="button" class="guide-cheaper" data-guide-spot="${esc(cheapSpot.id)}">Plus doux dans le même pays : ${esc(cheapSpot.name.split(' — ')[0])}, dès ${cheapest.lo} € la nuit ${svg('<path d="M5 12h14m-6-6 6 6-6 6"/>')}</button>`:''}</div>`;
  }
  function sleepHTML(s){
    const e=estimate(s),now=monthNow(),dates=tripDates(s),pl=place(s,e);
    const links=M.searchLinks(pl,{checkin:dates?.checkin,checkout:dates?.checkout,coords:coordsOf(s.id)});
    const inPeak=e.peak.includes(now),hasPeak=e.peak.length>0;
    const seasons=`<div class="guide-seasons"><div class="guide-season${!inPeak?' is-now':''}"><small>Hors haute saison</small><b>${M.euros({lo:e.lo,hi:e.hi})}</b>${!inPeak?`<span>En ce moment · ${MONTHS[now-1]}</span>`:''}</div>${hasPeak?`<div class="guide-season peak${inPeak?' is-now':''}"><small>Haute saison · ${esc(M.monthsLabel(e.peak))}</small><b>${M.euros({lo:e.peakLo,hi:e.peakHi})}</b>${inPeak?`<span>En ce moment · ${MONTHS[now-1]}</span>`:''}</div>`:''}</div>`;
    const buttons=[['booking','Booking.com'],['hostelworld','Hostelworld'],['airbnb','Airbnb'],['google','Google Hôtels']];
    if(e.type==='camping')buttons.unshift(['camping','Campings sur la carte']);
    return `<div class="guide-chapter"><span class="guide-chapter-number">03</span><span class="guide-chapter-label">Dormir pas cher</span></div>
      <div class="guide-sleep-grid">
        <div class="guide-ticket">
          <div class="guide-ticket-top"><span class="guide-ticket-icon">${icon(e.type)}</span><div><small>La nuit la moins chère</small><b>${esc(e.label)}</b></div></div>
          <p class="guide-price"><strong>${M.euros({lo:e.lo,hi:e.hi})}</strong><span>par nuit, pour une personne</span></p>
          <p class="guide-ticket-detail">${esc(e.detail)}</p>
          ${seasons}
          ${e.alt?`<p class="guide-alt">${icon(e.alt.type)}<span>Sans tente : ${esc(e.alt.label.toLowerCase())}, ${M.euros(e.alt)} la nuit.</span></p>`:''}
          <p class="guide-disclaimer">Estimation indicative Ocean Buddy · ${M.EDITION} · les prix varient selon la saison.</p>
        </div>
        <div class="guide-sleep-side">
          ${gauge(s,e)}
          <div class="guide-search"><small>Chercher un lit près du spot</small><b class="guide-search-place">${icon('compass')}<span>${esc(pl)}</span></b>${dates?`<p class="guide-search-dates">${icon('calendar')}<span>Dates de ton voyage « ${esc(dates.name)} » : du ${esc(fmtDate(dates.checkin))} au ${esc(fmtDate(dates.checkout))}.</span></p>`:''}<div class="guide-search-links">${buttons.map(([k,label])=>`<a href="${esc(links[k])}" target="_blank" rel="noopener"><span>${label}</span>${icon('ext')}</a>`).join('')}</div><p>Recherches publiques, sans lien sponsorisé. Compare les avis et les conditions d’annulation.</p></div>
          <div class="guide-compare-slot">${window.OceanNotebook?.button(s.id)||''}<span>Ajoute ce spot au comparateur pour mettre les budgets côte à côte.</span></div>
        </div>
      </div>`;
  }

  /* ---------- Aperçu en tête de fiche ---------- */
  function glanceHTML(s){
    const c=culture(s),e=estimate(s);
    const chips=[
      c.hello&&['speech','guideSpirit',`Dis « ${c.hello[0]} »`],
      c.food&&['food','guideSpirit',`Goûte : ${c.food[0]}`],
      ['bed','guideSleep',`Dès ${e.lo} € la nuit`]
    ].filter(Boolean);
    return chips.map(([k,target,label])=>`<button type="button" class="guide-glance-chip" data-guide-jump="${target}">${icon(k)}<span>${esc(label)}</span></button>`).join('');
  }

  /* ---------- Montage sur la fiche ---------- */
  function mount(){
    if(section)return true;
    const infos=$('#detail .dcat[data-cat="infos"]'),story=infos?.querySelector('.field-story');if(!infos||!story)return false;
    const spirit=document.createElement('section');spirit.id='guideSpirit';spirit.className='guide-section guide-spirit';spirit.setAttribute('aria-label','L’esprit du lieu');
    story.after(spirit);
    const around=document.createElement('section');around.id='guideAround';around.className='guide-section guide-around';around.setAttribute('aria-label','À découvrir autour');
    const sleep=document.createElement('section');sleep.id='guideSleep';sleep.className='guide-section guide-sleep';sleep.setAttribute('aria-label','Dormir pas cher');
    const anchor=$('#spotImmersion')||$('#fieldOverview')?.nextSibling||null;
    infos.insertBefore(around,anchor);infos.insertBefore(sleep,anchor);
    const glance=document.createElement('div');glance.id='guideGlance';glance.className='guide-glance';glance.setAttribute('aria-label','L’essentiel du voyage');
    ($('#fieldAtAGlance')||story.lastElementChild)?.after(glance);
    section={spirit,around,sleep,glance};
    return true;
  }
  function paint(s){
    if(!section||!s||current!==s.id)return;
    const custom=!!s.custom;
    section.spirit.hidden=custom;section.around.hidden=custom;section.sleep.hidden=custom;section.glance.hidden=custom;
    if(custom)return;
    section.spirit.innerHTML=spiritHTML(s);
    section.around.innerHTML=aroundHTML(s);
    section.sleep.innerHTML=sleepHTML(s);
    section.glance.innerHTML=glanceHTML(s);
    badgeNearby();
    window.OceanNotebook?.sync();
  }
  function update(s){
    if(!s||!mount())return;
    current=s.id;
    if(data){paint(s);return;}
    section.spirit.innerHTML='<div class="guide-loading"><i></i><span>Poulpy ouvre son carnet de voyage…</span></div>';
    section.around.innerHTML='';section.sleep.innerHTML='';section.glance.innerHTML='';
    load().then(()=>paint(spotById(current))).catch(()=>{section.spirit.innerHTML='<p class="guide-note">Le carnet de voyage n’a pas pu se charger. Vérifie ta connexion puis rouvre la fiche.</p>';});
  }
  /* Prix « dès » sur les spots voisins, pour comparer d’un coup d’œil. */
  function badgeNearby(){
    if(!data)return;
    document.querySelectorAll('#fieldNearby [data-field-spot]').forEach(card=>{
      if(card.querySelector('.guide-from'))return;const s=spotById(card.dataset.fieldSpot);if(!s)return;
      const tag=document.createElement('span');tag.className='guide-from';tag.textContent=`Dès ${estimate(s).lo} € la nuit`;
      (card.querySelector('span')||card).append(tag);
    });
  }
  const nearby=$('#fieldNearby');if(nearby)new MutationObserver(()=>badgeNearby()).observe(nearby,{childList:true});
  /* Même repère dans le sélecteur d’étapes d’un voyage. */
  function badgePicker(){
    const buttons=document.querySelectorAll('#tripSpotResults [data-pick]');if(!buttons.length)return;
    if(!data){load().then(badgePicker).catch(()=>{});return;}
    buttons.forEach(button=>{
      if(button.querySelector('.guide-from'))return;const s=spotById(button.dataset.pick);if(!s)return;
      const tag=document.createElement('small');tag.className='guide-from';tag.textContent=`Dès ${estimate(s).lo} € la nuit`;
      (button.querySelector('span')||button).append(tag);
    });
  }
  const tripDialog=$('#tripDialog');if(tripDialog)new MutationObserver(badgePicker).observe(tripDialog,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const jump=e.target.closest('[data-guide-jump]');
    if(jump){const target=document.getElementById(jump.dataset.guideJump);if(target){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}return;}
    const go=e.target.closest('[data-guide-spot]');if(go){openSpot(go.dataset.guideSpot);return;}
    const point=e.target.closest('[data-around-point]');
    if(point){const item=document.querySelector(`[data-around-item="${point.dataset.aroundPoint}"]`);if(item){item.classList.remove('is-flash');void item.offsetWidth;item.classList.add('is-flash');item.scrollIntoView({behavior:'smooth',block:'nearest'});}}
  });

  /* ---------- Comparateur ---------- */
  function compareCell(s){
    if(!s||s.custom)return 'Estimation indisponible pour un spot privé.';
    if(!data){load().then(()=>window.OceanNotebook?.refresh?.()).catch(()=>{});return '<span class="guide-compare-wait">Estimation en cours…</span>';}
    const e=estimate(s);
    return `<span class="guide-compare-price"><b>${M.euros({lo:e.lo,hi:e.hi})}</b><small>${esc(e.label)} · hors haute saison</small>${e.peak.length?`<small>Haute saison (${esc(M.monthsLabel(e.peak))}) : ${M.euros({lo:e.peakLo,hi:e.peakHi})}</small>`:''}</span>`;
  }
  function compareCheapest(ids){
    if(!data||ids.length<2)return null;
    const list=ids.map(spotById).filter(s=>s&&!s.custom).map(s=>({id:s.id,e:estimate(s)}));
    if(list.length<2)return null;
    const best=list.reduce((a,b)=>b.e.lo+b.e.hi<a.e.lo+a.e.hi?b:a);
    return list.filter(x=>x.e.lo+x.e.hi===best.e.lo+best.e.hi).length===1?best.id:null;
  }
  function compareSpirit(s){
    if(!s||s.custom)return '—';
    if(!data)return '<span class="guide-compare-wait">Chargement…</span>';
    const c=culture(s);
    return `<span class="guide-compare-spirit">${c.hello?`<b>« ${esc(c.hello[0])} »</b>`:''}${c.food?`<small>À goûter : ${esc(c.food[0])}</small>`:''}</span>`;
  }

  /* ---------- Voyages ---------- */
  const trips=()=>window.OceanTrips?.list?.()||[];
  function fillTrip(t){
    if(!t||!window.TripModel?.lodging)return;
    const panel=$('#tripLodging');
    if(!data){if(panel)panel.innerHTML='<div class="guide-loading"><i></i><span>Estimation des nuits en cours…</span></div>';load().then(()=>{const fresh=trips().find(x=>x.id===t.id);if(fresh)fillTrip(fresh);}).catch(()=>{if(panel)panel.innerHTML='<p class="guide-note">Estimation indisponible hors connexion.</p>';});return;}
    const est=TripModel.lodging(t,priceFor);
    est.steps.forEach(step=>{
      const host=document.querySelector(`[data-lodging-step="${CSS.escape(step.stepId)}"]`);if(!host)return;
      const s=spotById(step.spotId);
      if(!step.perNight||!s){host.innerHTML='';return;}
      const e=estimate(s);
      const nightsText=step.nights===null?'Ajoute la date de l’étape pour estimer le total.':step.nights===0?'Pas de nuit prévue ici : une étape à la journée.':`${step.nights===1?'1 nuit':step.nights+' nuits'}${step.basis==='split'?' (réparties à parts égales)':''} : ${M.euros(step.total)} au total.`;
      host.innerHTML=`<span class="trip-lodging-icon">${icon(e.type)}</span><span><b>${esc(e.label)} · ${M.euros(step.perNight)} la nuit${step.perNight.peak?' (haute saison)':''}</b><small>${esc(nightsText)}</small></span>${est.cheapest&&est.cheapest.stepId===step.stepId?'<em>Le moins cher</em>':''}`;
      host.classList.toggle('is-cheapest',!!est.cheapest&&est.cheapest.stepId===step.stepId);
    });
    if(!panel)return;
    if(!est.steps.length){panel.innerHTML='';panel.hidden=true;return;}
    panel.hidden=false;
    const cheap=est.cheapest?spotById(est.cheapest.spotId):null;
    const budget=Number(String(t.budget||'').replace(',','.'));
    panel.innerHTML=`<div class="trip-panel-title">${icon('bed')}<h3>Nuits à petit prix</h3></div>
      ${est.total?`<p class="trip-lodging-total"><strong>${M.euros(est.total)}</strong><span>pour ${est.nights===1?'1 nuit':est.nights+' nuits'} en solo${est.complete?'':', sur les étapes datées'}</span></p>`:'<p class="trip-lodging-empty">Ajoute des dates au voyage ou à chaque étape pour estimer le total de tes nuits.</p>'}
      ${est.total&&budget>0?`<p class="trip-lodging-budget">${est.total.hi<=budget?'Cette estimation tient dans ton budget prévu.':est.total.lo>budget?'Cette estimation dépasse ton budget prévu.':'Cette estimation frôle ton budget prévu.'}</p>`:''}
      ${cheap?`<button type="button" class="trip-lodging-cheapest" data-guide-spot="${esc(cheap.id)}"><small>Le spot le moins cher de ton voyage</small><b>${esc(cheap.name.split(' — ')[0])}</b><span>${M.euros(est.cheapest.perNight)} la nuit</span></button>`:''}
      <p class="trip-lodging-note">Estimation indicative Ocean Buddy · ${M.EDITION} · les prix varient selon la saison. Nuit la moins chère de chaque étape, pour une personne.</p>`;
  }
  document.addEventListener('change',e=>{
    if(!e.target.closest?.('#tripContent')||!(e.target.dataset.stepDate!==undefined))return;
    const id=window.OceanTrips?.route?.().selected;const t=trips().find(x=>x.id===id);if(t)fillTrip(t);
  });

  window.OceanSpotGuide={load,ready,update,around:s=>load().then(()=>aroundItems(s)),estimate,priceFor,culture,compareCell,compareCheapest,compareSpirit,fillTrip};
})();
