/* Carnet de destination : l’esprit du lieu, les incontournables autour du spot et la nuit la moins chère.
   Les données détaillées (assets/data/spot-guides.js) ne se chargent qu’à l’ouverture d’une fiche,
   du comparateur ou d’un voyage. Sans elles, les repères par pays prennent le relais. */
(() => {
  'use strict';
  const M=window.SpotGuideModel;if(!M)return;
  const DATA_URL='assets/data/spot-guides.js?v=ad3a1ef5330b';
  const DATA_URL_EN='assets/data/spot-guides.en.js?v=09dc78f14a87';
  const DATA_URL_ES='assets/data/spot-guides.es.js?v=1738a29c9a1b';
  /* Culture locale sourcée, par zone (scripts/build-culture-zones.cjs) : chargée à l’ouverture d’une fiche, jamais au démarrage. */
  const ZONES_URL='assets/data/culture-zones.js?v=85a2b2a35343';
  /* Traductions des faits de culture locale (titre, texte, nom de zone) : une par langue, chargée avec la zone. */
  const ZONES_URL_I18N={en:'assets/data/culture-zones.en.js?v=f2068d31fa96',es:'assets/data/culture-zones.es.js?v=d84de3809433'};
  /* Lieux autour du spot (OpenStreetMap) et niveau des prix par pays (Banque mondiale) : scripts/build-spot-extras.cjs,
     chargés à l’ouverture d’une fiche, jamais au démarrage. */
  const EXTRAS_URL='assets/data/spot-extras.js?v=57b11b70ee03';
  /* Hors français, le contenu éditorial (esprit du lieu, lieux, libellés d’hébergement) s’affiche en anglais.
     Il est marqué translate="no" pour que i18n.js ne le retraduise pas par morceaux ; les libellés d’interface restent traduisibles. */
  const lang=()=>(window.OB_I18N&&OB_I18N.lang)||'fr';
  const english=()=>lang()!=='fr';
  const NT=' translate="no" data-no-i18n';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=(body,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const P={
    tent:'<path d="M3 20h18M12 5 4 20M12 5l8 15M12 12l-3 8M12 12l3 8"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
    school:'<path d="M3 9l9-4 9 4-9 4-9-4ZM7 11v4c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4M21 9v5"/>',
    board:'<path d="M12 2.5c3 3 4.5 6.5 4.5 10S15 19 12 21.5C9 19 7.5 16 7.5 12.5S9 5.5 12 2.5ZM12 6v12"/>',
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
    book:'<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1V5ZM12 6v14"/>',
    calendar:'<path d="M4 6h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    bed:'<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 11.5a1.5 1.5 0 1 0 0-.01"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>'
  };
  /* Pictos dessinés (assets/pictos/guide) : clé du guide -> fichier ; le tracé au trait reste en secours. */
  const PIC=k=>({map:'carte',season:'saison'})[k]||(k&&k!=='ext'?'g-'+k:'');
  const icon=(k,cls)=>{const f=PIC(P[k]?k:'nature');return window.PoulpyIcons?.has?.(f)?PoulpyIcons.svg(f,cls):svg(P[k]||P.nature,cls);};
  const lab=e=>e.labelCustom?`<span${NT}>${esc(e.label)}</span>`:esc(e.label);
  const KIND_LABEL={nature:'Nature',plage:'Plage',village:'Village',ville:'Ville',marche:'Marché',musee:'Musée',patrimoine:'Patrimoine',panorama:'Point de vue',rando:'Randonnée',ile:'Île',lac:'Lac'};
  const DIRS=['au nord','au nord-est','à l’est','au sud-est','au sud','au sud-ouest','à l’ouest','au nord-ouest'];
  let data=null,loading=null,current=null,section=null;

  /* ---------- Données ---------- */
  function inject(url){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=url;script.async=true;
      script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Guide indisponible'));};
      document.head.append(script);
    });
  }
  /* Superpose la version anglaise : textes, noms des lieux et libellés, sans toucher aux coordonnées ni aux prix. */
  function overlay(base,en){
    if(!en)return base;
    const out={...base,countries:{...base.countries},spots:{...base.spots}};
    for(const [name,c] of Object.entries(en.countries||{}))if(out.countries[name])out.countries[name]={...out.countries[name],...c};
    for(const [id,e] of Object.entries(en.spots||{})){
      const g=out.spots[id];if(!g)continue;
      const next={...g};
      for(const k of ['v','l','h','f','r','s'])if(e[k])next[k]=e[k];
      if(Array.isArray(e.a)&&Array.isArray(g.a)&&e.a.length===g.a.length)next.a=g.a.map((row,i)=>{const r=row.slice();if(r[5]===1)r[5]=r[0].replace(/’/g,"'");r[0]=e.a[i][0]||r[0];r[1]=e.a[i][1]||r[1];return r;});
      if(e.lbl&&g.z)next.z={...g.z,lbl:e.lbl};
      out.spots[id]=next;
    }
    return out;
  }
  function load(){
    if(data)return Promise.resolve(data);
    if(!loading)loading=(window.OCEAN_SPOT_GUIDES?Promise.resolve():inject(DATA_URL))
      .then(()=>lang()==='es'&&!window.OCEAN_SPOT_GUIDES_ES?inject(DATA_URL_ES).catch(()=>{}):null)
      .then(()=>english()&&!window.OCEAN_SPOT_GUIDES_EN&&!(lang()==='es'&&window.OCEAN_SPOT_GUIDES_ES)?inject(DATA_URL_EN).catch(()=>{}):null)
      .then(()=>{const base=window.OCEAN_SPOT_GUIDES||{spots:{},countries:{}};data=lang()==='es'&&window.OCEAN_SPOT_GUIDES_ES?overlay(base,window.OCEAN_SPOT_GUIDES_ES):english()?overlay(base,window.OCEAN_SPOT_GUIDES_EN):base;return data;})
      .catch(error=>{loading=null;throw error;});
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
  function culture(s,d=data){
    const c=d?.countries?.[country(s)]||null,g=d?.spots?.[s.id]||{};
    return {lang:g.l||c?.lang||'',hello:g.h||c?.hello||null,food:g.f||c?.food||null,respect:g.r||c?.respect||'',vibe:g.v||'',season:g.s||(s.editorialStatus==='reviewed'?s.visit?.bestPeriod:'')||'',grounded:!!g.v};
  }
  function estimate(s){if(!s)return null;return M.estimate({country:country(s),loc:s.loc,world:world(s)},entry(s.id)?.z);}
  function priceFor(id,month){const s=spotById(id);if(!s||s.custom)return null;const e=estimate(s);return e?M.nightly(e,month):null;}
  function place(s,e){
    const town=e?.town||String(s.loc||'').split(',')[0]||s.name.split(' — ')[0];
    const ctry=country(s);
    return town&&ctry&&!town.includes(ctry)?town+', '+ctry:(town||s.name);
  }

  /* ---------- Outils ---------- */
  function distance(a,b){const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r,x=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function bearing(a,b){const r=Math.PI/180,y=Math.sin((b.lon-a.lon)*r)*Math.cos(b.lat*r),x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lon-a.lon)*r);return (Math.atan2(y,x)/r+360)%360;}
  const DIRS_EN=['north','north-east','east','south-east','south','south-west','west','north-west'];
  const DIRS_ES=['norte','noreste','este','sureste','sur','suroeste','oeste','noroeste'];
  /* Distance et mois : fragments calculés depuis les données, en anglais hors français et marqués non traduisibles. */
  const LG=()=>lang()==='es'&&window.OCEAN_SPOT_GUIDES_ES?'es':english()?'en':'fr';
  const months=m=>`<span${NT}>${esc(M.monthsLabel(m,LG()))}</span>`;
  function whereText(km,deg){
    if(LG()==='es')return km<1?'A menos de 1 km del spot':`A ${Math.round(km)} km al ${DIRS_ES[Math.round(deg/45)%8]}`;
    if(english())return km<1?'Less than 1 km from the spot':`${Math.round(km)} km ${DIRS_EN[Math.round(deg/45)%8]}`;
    if(km<1)return 'À moins d’un kilomètre du spot';
    return `À ${Math.round(km)} km ${DIRS[Math.round(deg/45)%8]}`;
  }
  const mapsUrl=(name,s)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+(s.loc||country(s)));
  const wikiUrl=(lang,title)=>`https://${lang==='fr'?'fr':'en'}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g,'_'))}`;
  const monthNow=()=>new Date().getMonth()+1;
  const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  /* ---------- L’esprit du lieu (fiche v2 : onglet « Le spot ») ----------
     Demande du fondateur (18 nov.) : moins d’informations, rien en double. Restent « Le bon geste » (texte entier) et une
     seule ligne vers la page culture du pays, qui porte le mot du coin et le plat à goûter (les anciennes pastilles).
     Ne sont plus affichés ici : la photo du spot répétée (déjà en tête de fiche), la phrase d’ambiance, la tuile
     « La bonne saison » (onglet Saisons) et le numéro de chapitre. Les données restent dans le carnet (culture()).
     Pas de doublon avec « Le conseil de Poulpy » (dTip, app.js) : un bon geste identique au conseil n’est pas affiché ; un
     bon geste qui reprend le conseil du catalogue et le prolonge le remplace (data-in-geste masque le bloc du conseil,
     fiche.css). Un conseil du carnet, marqué « non vérifié », reste toujours affiché avec sa mention. */
  function spiritHTML(s){
    const same=v=>String(v||'').toLowerCase().replace(/[\s.,;:!?’'«»]+/g,' ').trim();
    const c=culture(s);
    const ownTip=typeof s.tip==='string'&&s.tip.trim()?s.tip:'',tip=ownTip||(typeof s.carnet?.tip==='string'?s.carnet.tip:'');
    /* Comparaison sur le texte français (le conseil du catalogue est en français ; en anglais ou en espagnol, le bon
       geste vient de la traduction du carnet, posée par-dessus window.OCEAN_SPOT_GUIDES). */
    const base=typeof window!=='undefined'?window.OCEAN_SPOT_GUIDES:null;
    const fr=base&&typeof data!=='undefined'&&data!==base?culture(s,base):c;
    const r=same(fr.respect),t=same(tip);
    const dup=!!(r&&t&&r===t),wider=!!(r&&ownTip&&!dup&&r.startsWith(t));
    if(typeof document!=='undefined'){const tb=document.getElementById('dTip')?.closest('.block');if(tb)tb.toggleAttribute('data-in-geste',wider);}
    const geste=c.respect&&!dup?`<div class="sg-geste"><h3 class="fx-title fx-title-s">Le bon geste</h3><p class="fx-text"${NT}>${esc(c.respect)}</p></div>`:'';
    /* 20 nov. : le mot du coin, le plat et la page du pays sont dans « Ici, on vit comme ça » (liveHTML), sans doublon ici. */
    return geste;
  }

  /* ---------- À découvrir autour ---------- */
  function aroundItems(s){
    const c=coordsOf(s.id)||s.coords,g=entry(s.id);
    if(!c||!g?.a)return [];
    return g.a.map(([n,d,k,lat,lon,wiki],i)=>{const title=wiki===1?n.replace(/’/g,"'"):wiki;const km=distance(c,{lat,lon}),deg=bearing(c,{lat,lon});return {i:i+1,n,d,k,lat,lon,title,km,deg};});
  }
  function aroundTitle(s){
    const sports=typeof spotSports==='function'?spotSports(s):(s.sports||[]);
    if(typeof isInland==='function'?isInland(s):s.waterType!=='sea')return 'Au-delà du rivage.';
    if(['plongee','snorkeling'].includes(sports[0]))return 'Après la plongée.';
    if(['kitesurf','windsurf'].includes(sports[0]))return 'Quand le vent tombe.';
    return 'Au-delà de la vague.';
  }
  /* Fiche v2 (onglet Préparer, « Autour ») : un titre simple et les lieux en cartes compactes qu’on fait glisser,
     sans schéma ni numéros. Chaque lieu garde son lien vers la carte et vers sa page Wikipédia ; la source reste dessous. */
  function aroundHTML(s){
    const items=aroundItems(s),lang=entry(s.id)?.w||'en',c=coordsOf(s.id);
    const head=`<h3 class="fx-title">Autour</h3><p class="fx-note px-lead">Des lieux réels, à moins de 30 km, pour une demi-journée hors de l’eau.</p>`;
    if(!items.length){
      const q=k=>'https://www.google.com/maps/search/'+encodeURIComponent(k)+(c?`/@${c.lat},${c.lon},12z`:encodeURIComponent(' '+s.loc));
      return head+`<div class="guide-around-fallback"><p class="fx-text">Poulpy n’a pas encore sélectionné les incontournables de ce secteur. Explore les environs sur la carte :</p><div class="px-pills">${[['panorama','Points de vue','point de vue'],['marche','Marchés','marché'],['rando','Randonnées','randonnée'],['musee','Musées','musée']].map(([k,label,query])=>`<a class="fx-pill" href="${esc(q(query))}" target="_blank" rel="noopener"><span>${label}</span></a>`).join('')}</div></div>`;
    }
    return head+`<ol class="px-rail px-places" aria-label="${esc(aroundTitle(s))}">${items.map(x=>`<li class="px-place fx-card" data-around-item="${x.i}"><span class="fx-label">${esc(KIND_LABEL[x.k]||'À voir')}</span><b${NT}>${esc(x.n)}</b><span class="fx-note"${english()?NT:''}>${esc(whereText(x.km,x.deg))}</span><p class="fx-note"${NT}>${esc(x.d)}</p><span class="px-place-links"><a href="${esc(mapsUrl(x.n,s))}" target="_blank" rel="noopener">Voir sur la carte</a>${x.title?`<a href="${esc(wikiUrl(lang,x.title))}" target="_blank" rel="noopener">En savoir plus</a>`:''}</span></li>`).join('')}</ol>
      <p class="fx-note px-src">Lieux sélectionnés par Ocean Buddy et situés grâce aux coordonnées de Wikipédia. Vérifie horaires et accès avant de partir.</p>`;
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


  /* ---------- Le spot, en vie (20 nov. 2026) ----------
     Le fondateur, devant la fiche allégée : « un peu trop vide… chiffres importants grands… belles illustrations… il faut
     que les spots vivent… même la culture… échelle de prix par rapport aux autres spots… raccourcis Booking, école, matériel,
     restaurants ». En tête de l’onglet « Le spot » : trois grands chiffres illustrés (normales du mois, prix de la nuit),
     « Ici, on vit comme ça » (ce que le carnet sait du lieu), « Budget sur place » (le prix de la nuit situé parmi tous
     les spots, puis nos estimations) et des raccourcis qui sont de vrais liens. Aucun chiffre sans donnée : une tuile ou
     une ligne sans valeur n’apparaît pas. Pas de prix d’hôtel ni de restaurant : nous n’en avons pas de sourcé. */
  const ILLU=k=>`<img class="gl-illu" src="assets/fiche/${k}.webp" alt="" width="210" height="210" loading="lazy" decoding="async" draggable="false">`;
  /* Grande image en tête d’une carte de culture (23 nov.) : l’illustration propre au fait, 1080 × 810 (4:3), assez nette
     pour la largeur de la carte sur un écran ×3. Les illustrations de genre (420 px) restent en vignette. */
  const HERO=k=>`<img class="gl-hero" src="assets/fiche/${k}.webp" alt="" width="1080" height="810" loading="lazy" decoding="async" draggable="false">`;
  const nf=(v,d=0)=>{try{return Number(v).toLocaleString(window.OB_LOCALE||'fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});}catch(_){return String(v);}};
  /* Niveau des prix du pays (Banque mondiale, WDI PA.NUS.PRVT.PLI, États-Unis = 100) et sa place parmi les pays du guide.
     Un pays sans valeur n’a ni échelle ni chiffre : jamais de valeur de remplacement. */
  function priceLevel(name){
    const d=window.OCEAN_SPOT_EXTRAS?.prix,v=d?.c?.[name];if(!Array.isArray(v)||!Number.isFinite(v[0]))return null;
    const all=Object.values(d.c).map(x=>x[0]).filter(Number.isFinite);
    const cheaper=Math.round(all.filter(x=>x<v[0]).length/all.length*100),pricier=Math.round(all.filter(x=>x>v[0]).length/all.length*100);
    return {index:v[0],year:v[1],cheaper,pricier,meta:d.meta};
  }
  /* Lieux OpenStreetMap autour du spot : [nom, distance en m, étiquette brute, référence OSM] par catégorie (R, E, L). */
  const CUISINE={regional:'Cuisine du coin',local:'Cuisine du coin',pizza:'Pizzas',burger:'Burgers',coffee_shop:'Café',sandwich:'Sandwichs',french:'Cuisine française',italian:'Cuisine italienne',seafood:'Poisson et fruits de mer',fish:'Poisson',fish_and_chips:'Fish and chips',international:'Cuisine du monde',asian:'Cuisine asiatique',ice_cream:'Glaces',chinese:'Cuisine chinoise',crepe:'Crêpes',greek:'Cuisine grecque',indonesian:'Cuisine indonésienne',caribbean:'Cuisine des Caraïbes',tapas:'Tapas',mediterranean:'Cuisine méditerranéenne',breakfast:'Petit-déjeuner',brazilian:'Cuisine brésilienne',sushi:'Sushis',kebab:'Kebab',thai:'Cuisine thaïe',portuguese:'Cuisine portugaise',mexican:'Cuisine mexicaine',hawaiian:'Cuisine hawaïenne',american:'Cuisine américaine',barbecue:'Grillades',meat:'Viandes',pasta:'Pâtes',noodles:'Nouilles',chicken:'Poulet',cake:'Gâteaux',donut:'Beignets'};
  const SPORT_TAG={surfing:'Surf',windsurfing:'Planche à voile',planche_a_voile:'Planche à voile',kitesurfing:'Kitesurf',scuba_diving:'Plongée','plongée':'Plongée','apnée':'Apnée',swimming:'Natation'};
  const KIND_TAG={location:'Location',boutique:'Boutique'};
  const tagOf=(cat,raw)=>{const map=cat==='R'?CUISINE:cat==='E'?SPORT_TAG:KIND_TAG;for(const t of String(raw||'').split(';')){const k=t.trim();if(map[k])return map[k];}return '';};
  /* Les coordonnées du catalogue sont au centième de degré : une distance « à environ », arrondie. */
  const distParts=m=>m<950?{km:false,v:Math.max(100,Math.round(m/100)*100)}:{km:true,v:nf(Math.round(m/500)/2,Math.round(m/500)%2?1:0)};
  const around=m=>{const d=distParts(m);return d.km?`à environ ${d.v} km`:`à environ ${d.v} m`;};
  const SPORT_ILLU=['baignade','bodyboard','kayak','kitesurf','paddle','plongee','snorkeling','surf','windsurf'];
  /* Une photo de tuile : une illustration de l’app, jamais générée ici. Une seule image par tuile, 1:1 rognée en 16:10. */
  const TILE_IMG=src=>`<img class="gl-pimg" src="${src}" alt="" width="384" height="384" loading="lazy" decoding="async" draggable="false">`;
  const ILLU_P=k=>`<img class="gl-pimg" src="assets/fiche/${k}.webp" alt="" width="420" height="420" loading="lazy" decoding="async" draggable="false">`;
  const plain=s=>`<span class="gl-psub">${s}</span>`;
  /* Au plus 5 lieux par catégorie sont gardés : au-delà, on dit « les plus proches », pas un total. */
  function countText(k,list){
    const n=list.length;
    if(k==='R'){
      /* Même arrondi que les lignes de la liste (« à environ 1 km » pour 986 m) : jamais « moins de » à côté de « environ ». */
      const d=distParts(Math.max(...list.map(x=>x[1])));
      return d.km?(n>=5?`Les ${n} plus proches, à environ ${d.v} km`:n===1?`1 adresse à environ ${d.v} km`:`${n} adresses à environ ${d.v} km`)
        :(n>=5?`Les ${n} plus proches, à environ ${d.v} m`:n===1?`1 adresse à environ ${d.v} m`:`${n} adresses à environ ${d.v} m`);
    }
    if(k==='E')return n===1?'1 école ou club':`${n} écoles ou clubs`;
    return n===1?'1 location ou boutique':`${n} locations ou boutiques`;
  }
  /* Carte « Autour du spot » : un petit plan dessiné (mer, terre, route, trois repères), pas une carte réelle. */
  const MINIMAP='<svg class="gl-minimap" viewBox="0 0 160 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><rect width="160" height="110" class="mm-land"/><path class="mm-sea" d="M0 0h58c-12 22 8 34-4 56S44 96 52 110H0Z"/><path class="mm-water" d="M96 42c12-8 34-6 42 6s-4 26-22 28-32-8-30-20c0-6 4-10 10-14Z"/><path class="mm-road" d="M52 18c26 6 44 4 70 26s26 40 28 66M18 86c34-6 58-14 88-30"/><circle class="mm-pin a" cx="74" cy="28" r="6"/><circle class="mm-pin b" cx="112" cy="84" r="6"/><circle class="mm-pin c" cx="46" cy="76" r="6"/></svg>';
  function placesHTML(s,more=''){
    const d=window.OCEAN_SPOT_EXTRAS,p=s&&!s.custom&&d?.places?.[s.id];if(!p)return '';
    const CATS=[['R','Pour manger',P.food],['E','Écoles et clubs',P.school],['L','Location et boutiques',P.board]];
    const rows=CATS.filter(([k])=>Array.isArray(p[k])&&p[k].length).map(([k,title,ic])=>`<h4 class="fx-label gl-around-h">${title}</h4><ul class="gl-places">${p[k].map((x,i)=>{
      const tag=tagOf(k,x[2]);
      return `<li style="--i:${i}"><a class="gl-place" href="https://www.openstreetmap.org/${esc(x[3])}" target="_blank" rel="noopener noreferrer"><span class="gl-place-ic">${svg(ic)}</span><span class="gl-place-tx"><b${NT}>${esc(x[0])}</b>${tag?`<small>${tag}</small>`:''}<small class="gl-place-d">${around(x[1])}</small></span></a></li>`;}).join('')}</ul>`);
    const head=`<div class="gl-aroundcard">${MINIMAP}<span class="gl-aroundcard-tx"><b>Autour du spot</b><a href="${esc(d.osm?.source||'https://www.openstreetmap.org/copyright')}" target="_blank" rel="noopener noreferrer">Données OpenStreetMap</a></span></div>`;
    if(!rows.length)return `<div class="gl-around" id="glAround">${head}<p class="fx-note gl-around-empty">Aucune adresse trouvée sur OpenStreetMap autour de ce spot.</p>${more}</div>`;
    const km=nf(Math.round((p.r||3000)/1000)),radius=`Dans un rayon de ${km} km`;
    const date=frDate(d.osm?.extracted);
    return `<div class="gl-around" id="glAround">${head}<p class="fx-note gl-around-sub">${radius}</p>${rows.join('')}${more}<p class="fx-note gl-osm-src"><span>Lieux : © les contributeurs d’OpenStreetMap, sous licence ODbL, extraction du</span> <span${NT}>${esc(date)}</span>. <span>Les distances sont approximatives.</span></p></div>`;
  }
  /* « Dormir, manger, louer » : tout le pratique au même endroit. */
  function practicalHTML(s,e,ctry){
    const lg=LG(),pl=place(s,e),dates=tripDates(s),links=M.searchLinks(pl,{checkin:dates?.checkin,checkout:dates?.checkout,coords:coordsOf(s.id),lang:lg});
    const act=(typeof detailAct==='function'?detailAct(s):null)||(typeof spotSports==='function'?spotSports(s)[0]:(s.sports||[])[0])||'',sportName=(typeof SPORTMAP!=='undefined'&&SPORTMAP[act]?.label)||'';
    const qs=M.searchQueries(LG(),lg==='fr'||typeof window.obT!=='function'?sportName:window.obT(sportName));
    const ex=window.OCEAN_SPOT_EXTRAS,p=!s.custom&&ex?.places?.[s.id]||null,has=k=>!!p&&Array.isArray(p[k])&&p[k].length>0;
    /* Niveau des prix du pays (Banque mondiale) : le grand chiffre, puis la jauge dont le curseur est au rang du pays, comme la
       phrase qui la suit (« plus cher que 72 % des pays du guide » : curseur à 72 %). */
    let level='';
    const pl0=priceLevel(ctry);
    if(pl0){
      const pos=Math.max(3,Math.min(97,pl0.pricier>=50?100-pl0.pricier:pl0.cheaper));
      const rank=pl0.pricier>=50?`<p class="gl-rank"><span>Moins cher que</span> <b${NT}>${pl0.pricier}&nbsp;%</b> <span>des pays du guide</span></p>`:`<p class="gl-rank"><span>Plus cher que</span> <b${NT}>${pl0.cheaper}&nbsp;%</b> <span>des pays du guide</span></p>`;
      level=`<div class="gl-pli"><b class="fx-num"${NT}>${nf(Math.round(pl0.index))}&nbsp;%</b><span class="gl-pli-tx"><span>du coût de la vie aux États-Unis</span><small><span>${esc(ctry)}</span>, <span>Banque mondiale</span> <span${NT}>${pl0.year}</span></small></span></div>
      <div class="gl-scale" aria-hidden="true"><span>moins cher</span><i class="gl-track"><i class="gl-pin" style="--p:${pos.toFixed(1)}%"></i></i><span>plus cher</span></div>${rank}
      <p class="fx-note gl-pli-src"><span>Niveau des prix de la consommation des ménages, États-Unis = 100 :</span> <a href="${esc(pl0.meta.url)}" target="_blank" rel="noopener noreferrer"${NT}>${esc(pl0.meta.name)}</a>, <span>licence CC BY 4.0, consultée le</span> <span${NT}>${esc(frDate(pl0.meta.consulted))}</span>.</p>`;
    }
    const linkTile=(h,img,title,sub)=>`<a class="gl-ptile" href="${esc(h)}" target="_blank" rel="noopener">${img}<b>${title}</b><span class="gl-psub gl-psub-link">${sub}</span></a>`;
    const goTile=(img,title,sub)=>`<button type="button" class="gl-ptile" data-gl-around>${img}<b>${title}</b>${plain(sub)}</button>`;
    const sportImg=TILE_IMG('assets/ui/sports/'+(SPORT_ILLU.includes(act)?act:'baignade')+'.webp');
    const eat=has('R')?goTile(ILLU_P('table'),'Manger',countText('R',p.R)):linkTile(mapsNear(s,qs.restaurants),ILLU_P('table'),'Manger','Trouver un restaurant');
    const learnParts=[has('E')?countText('E',p.E):'',has('L')?countText('L',p.L):''].filter(Boolean);
    const learn=learnParts.length?goTile(sportImg,'Apprendre et louer',learnParts.map(t=>`<span>${t}</span>`).join(', ')):linkTile(mapsNear(s,qs.school),sportImg,'Apprendre et louer','Trouver une école');
    /* Tuile Camping seulement là où le camping a du sens (estimation du spot de type camping, comme le lien « Campings » d’avant
       le lot 4) ; ailleurs, trois tuiles (Hôtel, Manger, Apprendre et louer), la dernière sur toute la largeur. */
    const camp=e&&e.type==='camping'?linkTile(links.camping,ILLU_P('sac'),'Camping','Trouver un camping'):'';
    const tiles=`<div class="gl-ptiles${camp?'':' gl-p3'}">${camp}${linkTile(links.google,ILLU_P('cabane'),'Hôtel','Trouver un hôtel')}${eat}${learn}</div>`;
    const pill=(h,label)=>`<a class="fx-pill" href="${esc(h)}" target="_blank" rel="noopener"><span${NT}>${label}</span></a>`;
    /* Les listes OpenStreetMap s’arrêtent à 5 lieux et manquent souvent d’écoles : la carte autour du spot reste à un geste
       (restaurants, école et location du sport, comme les anciens raccourcis du Coin et « Matériel et cours » de Préparer). */
    const mapPill=(h,label)=>`<a class="fx-pill" href="${esc(h)}" target="_blank" rel="noopener"><span>${label}</span></a>`;
    /* Une tuile qui ouvre déjà la carte (aucune adresse dans sa catégorie) n’est pas répétée ici. */
    const more=`<h4 class="fx-label gl-around-h">Sur la carte</h4><div class="px-pills gl-around-more">${has('R')?mapPill(mapsNear(s,qs.restaurants),'Restaurants'):''}${learnParts.length?mapPill(mapsNear(s,qs.school),'École'):''}${mapPill(mapsNear(s,qs.rental),'Location')}</div>`;
    const search=`<div class="gl-psearch px-search">${dates?`<p class="fx-note">Dates de ton voyage « ${esc(dates.name)} » : du ${esc(fmtDate(dates.checkin))} au ${esc(fmtDate(dates.checkout))}.</p>`:''}<div class="px-pills">${pill(links.booking,'Booking.com')}${pill(links.hostelworld,'Hostelworld')}${pill(links.airbnb,'Airbnb')}${mapPill(mapOpen(s),'Carte du spot')}${window.OceanNotebook?.button(s.id)||''}</div><p class="fx-note gl-links-src">Recherches publiques, sans lien sponsorisé.</p></div>`;
    return `<div class="gl-block gl-pratique" id="glPratique"><h3 class="fx-title">Dormir, manger, louer</h3>${level}${tiles}${placesHTML(s,more)||`<div class="gl-around">${more}</div>`}${search}</div>`;
  }
  /* Normales du mois en cours : fichier léger déjà utilisé par l’accueil ([eau, …, houle ×10, …], spot-data.js). */
  function monthNormals(s){
    const row=window.OCEAN_CLIMATE_LITE?.[s.id],m=new Date().getMonth();if(!Array.isArray(row))return null;
    const sea=Number(row[0]?.[m]),hs=Number(row[5]?.[m])/10,inland=typeof isInland==='function'?isInland(s):['lake','inland'].includes(s.waterType);
    return {sea:Number.isFinite(sea)&&row[0]?.[m]!=null?sea:null,hs:!inland&&Number.isFinite(hs)&&row[5]?.[m]!=null&&hs>0?hs:null};
  }
  /* La carte du spot elle-même (épingle sur ses coordonnées), pas une recherche d’hôtels : la tuile Hôtel s’en charge. */
  function mapOpen(s){
    const c=coordsOf(s.id)||s.coords,ok=c&&Number.isFinite(+c.lat)&&Number.isFinite(+c.lon);
    return `https://www.google.com/maps/search/?api=1&query=${ok?(+c.lat).toFixed(4)+','+(+c.lon).toFixed(4):encodeURIComponent(place(s,estimate(s)))}`;
  }
  function mapsNear(s,what){
    const c=coordsOf(s.id)||s.coords,ok=c&&Number.isFinite(+c.lat)&&Number.isFinite(+c.lon);
    return `https://www.google.com/maps/search/${encodeURIComponent(what)}${ok?`/@${(+c.lat).toFixed(4)},${(+c.lon).toFixed(4)},13z`:encodeURIComponent(' '+place(s,estimate(s)))}`;
  }
  /* Zone de culture locale du spot (window.OCEAN_CULTURE_ZONES : {zones:{id:{n,r,c,f}}, spots:{spot:id}}), ou null. */
  const ZONE_LABEL={gout:'À goûter',fete:'La fête',mot:'Le mot du coin',coutume:'La coutume',lieu:'À voir'};
  /* Un fait sans illustration propre n'a jamais de scène peinte : une image qui montrerait autre chose que le fait serait
     pire qu'aucune image. Il reçoit une vignette sobre (crème, pétrole, soleil) avec le pictogramme de son genre. */
  const PICTO_SVG={
    gout:'<path d="M18 10v12a4 4 0 0 0 8 0V10M22 10v30M38 10c-4 3-5 9-5 14 0 4 2 5 5 5V10M38 29v11"/>',
    fete:'<path d="M12 18h40"/><path d="M14 18l6 12 6-12M26 18l6 12 6-12M38 18l6 12 6-12"/><circle cx="32" cy="44" r="3" class="s"/>',
    mot:'<path d="M12 16h40a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H30l-10 9v-9h-8a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z"/>',
    coutume:'<circle cx="32" cy="22" r="7"/><circle cx="16" cy="28" r="5"/><circle cx="48" cy="28" r="5"/><path d="M20 50c0-9 5-14 12-14s12 5 12 14M6 48c0-6 4-10 10-10M58 48c0-6-4-10-10-10"/>',
    lieu:'<path d="M32 54s-14-14-14-25a14 14 0 0 1 28 0c0 11-14 25-14 25z"/><circle cx="32" cy="29" r="5" class="s"/>'
  };
  const PICTO=k=>`<span class="gl-illu gl-picto" data-picto="${PICTO_SVG[k]?k:'lieu'}" aria-hidden="true"><svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle class="sun" cx="52" cy="12" r="7"/>${PICTO_SVG[k]||PICTO_SVG.lieu}</svg></span>`;
  const frDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||''));return m?`${m[3]}/${m[2]}/${m[1]}`:String(d||'');};
  /* La zone dans la langue de l’app : titre et texte traduits quand la traduction existe (sinon le français), nom de zone
     traduit. Genre, mois, source et illustration viennent toujours de la donnée française : une source ne change jamais. */
  const zoneLang=()=>(lang()==='es'?'es':english()?'en':'fr');
  const zoneCache=new Map();
  function zoneOf(s){
    const d=window.OCEAN_CULTURE_ZONES,id=s&&!s.custom&&d?.spots?.[s.id],z=id&&d.zones?.[id];
    if(!z||!Array.isArray(z.f)||!z.f.length)return null;
    const lg=zoneLang(),t=lg==='fr'?null:window['OCEAN_CULTURE_ZONES_'+lg.toUpperCase()]?.zones?.[id];
    if(!t)return z;
    const key=lg+':'+id;
    if(!zoneCache.has(key))zoneCache.set(key,{...z,n:t.n||z.n,f:z.f.map((f,i)=>{const x=Array.isArray(t.f)&&t.f[i];return Array.isArray(x)&&x[0]&&x[1]?[f[0],x[0],x[1],...f.slice(3)]:f;})});
    return zoneCache.get(key);
  }
  let zonesLoading=null;
  function loadZones(){
    const lg=zoneLang(),need=()=>lg!=='fr'&&!window['OCEAN_CULTURE_ZONES_'+lg.toUpperCase()];
    if(window.OCEAN_CULTURE_ZONES&&!need())return Promise.resolve();
    /* La traduction qui n’arrive pas (réseau) ne bloque rien : les faits s’affichent alors en français. */
    return zonesLoading||(zonesLoading=(window.OCEAN_CULTURE_ZONES?Promise.resolve():inject(ZONES_URL)).then(()=>need()?inject(ZONES_URL_I18N[lg]).catch(()=>{}):null).then(()=>{zonesLoading=null;}).catch(()=>{zonesLoading=null;}));
  }
  let extrasLoading=null;
  function loadExtras(){
    if(window.OCEAN_SPOT_EXTRAS)return Promise.resolve();
    return extrasLoading||(extrasLoading=inject(EXTRAS_URL).catch(()=>{extrasLoading=null;}));
  }
  function liveHTML(s){
    const e=estimate(s),c=culture(s),n=monthNormals(s),ctry=country(s),month=esc(M.monthName(new Date().getMonth()+1,LG()));
    /* 1. Grands chiffres. Le mois s’écrit déjà dans la langue de l’app, hors traduction. */
    const tile=(go,label,value,dec,unit,illu,i)=>`<button type="button" class="gl-tile" data-gl-go="${go}" style="--i:${i}"><span class="gl-tile-tx"><span class="fx-label"><span>${label}</span> <span${NT}>${month}</span></span><span class="gl-big"><b class="fx-num" data-gl-count="${value}" data-gl-dec="${dec}"${NT}>${nf(value,dec)}</b><span class="fx-unit"${NT}>${unit}</span></span></span>${ILLU(illu)}</button>`;
    const tiles=[];
    /* Unités choisies (Réglages : °F, pieds ; units-model.js) : la normale reste métrique, seul l’affichage convertit. */
    const mt=(kind,v,dec,unit)=>{const c=window.OceanUnits&&OceanUnits.showConvert(kind,v);return c?[c.v,c.d,c.unit]:[v,dec,unit];};
    if(n&&n.sea!=null)tiles.push(tile('saisons','Eau en',...mt('temp',n.sea,0,'°C'),'eau',tiles.length));
    /* La houle du mois ne parle qu’à ceux qui cherchent la vague ou le vent : pas de tuile sur un spot de plongée ou un lac. */
    const sportsOf=typeof spotSports==='function'?spotSports(s):(s.sports||[]),swellSport=sportsOf.some(a=>['surf','bodyboard','kitesurf','windsurf','wingfoil','foil'].includes(a));
    if(n&&n.hs!=null&&swellSport)tiles.push(tile('saisons','Houle en',...mt('length',n.hs,1,'m'),'houle',tiles.length));
    /* Pas de grand chiffre « La nuit, dès » : une fourchette de nuit sans source ne s’affiche pas en grand (lot 4). */
    /* 2. Ici, on vit comme ça : seulement ce que le carnet contient (mot du coin, à goûter), puis la page du pays. */
    const cards=[];
    /* Les mois d’une fête sont ceux d’une édition constatée, pas une date garantie : « Souvent en mai », jamais de jour.
       Culture locale de la zone : des faits sourcés, un par carte, chacun avec sa source d’un toucher. Les repères du
       carnet (mot du coin, à goûter), sans source par fait, ne s’affichent plus quand la zone donne le même genre. */
    const zone=zoneOf(s),has=k=>!!zone&&zone.f.some(f=>f[0]===k);
    if(zone)for(const f of zone.f){
      /* Mois : seulement pour une fête (le mois d’une édition constatée, jamais une date). Illustration propre au fait
         (assets/fiche/faits/) quand elle existe, sinon celle du genre. */
      const [kind,title,text,months,url,publisher,,own]=f,when=kind==='fete'&&Array.isArray(months)&&months.length?M.monthsLabel(months,LG()):'';
      const big=!!own&&/^[a-z0-9-]+$/.test(own),srcL=M.sourceLabel(publisher,url,window.OB_I18N?.lang);
      cards.push(`<li class="gl-card gl-fact${big?' gl-big-card':''}" data-kind="${esc(kind)}" style="--i:${cards.length}">${big?HERO('faits/'+own):PICTO(kind)}<span class="fx-label">${ZONE_LABEL[kind]||''}</span><b${NT}>${esc(title)}</b><small${NT}>${esc(text)}</small>${when?`<small class="gl-when"><span>Souvent en</span> <span${NT}>${esc(when)}</span></small>`:''}<a class="gl-fact-src" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>Source :</span> <span${srcL.fixed?NT:''}>${esc(srcL.text)}</span></a></li>`);
    }
    const hello=has('mot')?'':c.hello?.[0]||'',helloMore=typeof c.hello?.[1]==='string'?c.hello[1]:'',food=has('gout')?'':c.food?.[0]||'',foodMore=typeof c.food?.[1]==='string'?c.food[1]:'';
    if(hello)cards.push(`<li class="gl-card" style="--i:${cards.length}">${ILLU('panneau')}<span class="fx-label">Le mot du coin</span><b${NT}>«&nbsp;${esc(hello)}&nbsp;»</b>${helloMore?`<small${NT}>${esc(helloMore)}</small>`:''}</li>`);
    if(food)cards.push(`<li class="gl-card" style="--i:${cards.length}">${ILLU('table')}<span class="fx-label">À goûter</span><b${NT}>${esc(food)}</b>${foodMore?`<small${NT}>${esc(foodMore)}</small>`:''}</li>`);
    if(typeof OceanCultures!=='undefined'&&ctry)cards.push(`<li class="gl-card gl-card-go" style="--i:${cards.length}"><button type="button" data-cult-open="${esc(ctry)}" data-cult-from="spot">${ILLU('accueil')}<span class="fx-label">Culture du pays</span><b${NT}>${esc(OceanCultures.discover(ctry))}</b><small>Mots, fêtes et usages</small></button></li>`);
    const vibe=c.vibe?`<p class="fx-text gl-vibe"${NT}>${esc(c.vibe)}</p>`:'';
    /* Le nom de la zone dit d’où viennent ces faits ; la liste des sources (adresse et date) part dans « Sources et précisions ». */
    const zoneName=zone?`<p class="fx-label gl-zone"${NT}>${esc(zone.n)}</p>`:'';
    const zoneSrc=zone?`<ul class="fx-note gl-zone-src">${zone.f.map(f=>`<li><span${NT}>${esc(f[1])}</span> : <a href="${esc(f[4])}" target="_blank" rel="noopener noreferrer"${NT}>${esc(f[5])}</a>, <span>consultée le</span> <span${NT}>${esc(frDate(f[6]))}</span></li>`).join('')}</ul>`:'';
    const life=cards.length||vibe?`<div class="gl-block gl-life"><h3 class="fx-title">Ici, on vit comme ça</h3>${zoneName}${vibe}${cards.length?`<ul class="gl-rail">${cards.join('')}</ul>`:''}${zoneSrc}${c.grounded||zone?'':'<p class="fx-note guide-note">Repères culturels généraux du pays. La fiche détaillée de ce spot arrive bientôt.</p>'}</div>`:'';
    /* 3. Un seul bloc « Dormir, manger, louer » (lot 4, maquette M3) : l’indice de la Banque mondiale en grand avec sa
       jauge, quatre tuiles, « Autour du spot » et les recherches publiques. Aucune fourchette de nuit sans source. */
    return `${tiles.length?`<div class="gl-tiles gl-n${tiles.length}">${tiles.join('')}</div>`:''}${life}${practicalHTML(s,e,ctry)}`;
  }
  /* Les chiffres comptent jusqu’à leur valeur, une fois, à l’ouverture ; jamais en mouvement réduit. */
  function countUp(root){
    const still=document.body.classList.contains('reduce-motion')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)||typeof requestAnimationFrame!=='function';
    if(still)return;
    root.querySelectorAll('[data-gl-count]').forEach(b=>{
      const to=Number(b.dataset.glCount),dec=Number(b.dataset.glDec)||0;if(!Number.isFinite(to))return;
      const t0=performance.now(),dur=700;
      const step=t=>{const k=Math.min(1,(t-t0)/dur),v=to*(1-Math.pow(1-k,3));b.textContent=nf(k<1?v:to,dec);if(k<1&&b.isConnected)requestAnimationFrame(step);};
      b.textContent=nf(0,dec);requestAnimationFrame(step);
    });
  }
  function paintLive(s,animate){
    if(!section?.live)return;
    section.live.innerHTML=liveHTML(s);
    window.OceanNotebook?.sync?.();
    if(animate){section.live.classList.remove('gl-in');void section.live.offsetWidth;section.live.classList.add('gl-in');countUp(section.live);}
  }
  /* Réglage « Unités » changé : les tuiles du Coin sont repeintes sur place, sans rejouer l’entrée en scène. */
  document.addEventListener('ocean:units',()=>{try{const sp=current&&typeof spotById==='function'?spotById(current):null;if(sp)paintLive(sp,false);}catch(_){}});

  /* ---------- Aperçu en tête de fiche ---------- */
  function glanceHTML(s){
    const c=culture(s);
    const chips=[
      c.hello&&['speech','guideSpirit','Le mot du coin',c.hello[0]],
      c.food&&['food','guideSpirit','À goûter',c.food[0]]
    ].filter(Boolean);
    return chips.map(([k,target,label,value])=>`<button type="button" class="guide-glance-chip" data-guide-jump="${target}">${icon(k)}<span>${esc(label)}</span>${value?`<b${NT}>${esc(value)}</b>`:''}</button>`).join('');
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
    const live=document.createElement('section');live.id='guideLive';live.className='guide-section';live.classList.add('guide-live');live.setAttribute('aria-label','Le spot en un coup d’œil');
    story.before(live);
    section={spirit,around,sleep,glance,live};
    return true;
  }
  let lastLive=null;
  function paint(s){
    if(!section||!s||current!==s.id)return;
    const custom=!!s.custom;
    section.spirit.hidden=custom;section.around.hidden=custom;section.sleep.hidden=custom;section.glance.hidden=custom;section.live.hidden=custom;
    if(custom)return;
    section.spirit.innerHTML=spiritHTML(s);
    section.around.innerHTML=aroundHTML(s);
    /* « Dormir » de Préparer est fondu dans « Dormir, manger, louer » (Le coin) : plus de doublon. */
    section.sleep.innerHTML='';section.sleep.hidden=true;
    section.glance.innerHTML=glanceHTML(s);
    /* L’entrée en scène ne joue qu’à l’ouverture d’un autre spot ; les normales arrivent sans rejouer l’animation. */
    paintLive(s,lastLive!==s.id);lastLive=s.id;
    if(!window.OCEAN_CLIMATE_LITE)window.OceanSpotData?.load?.('lite').then(()=>{if(current===s.id)paintLive(s,false);}).catch(()=>{});
    /* La culture locale de la zone arrive à son tour, sans rejouer l’entrée en scène. */
    if(!window.OCEAN_CULTURE_ZONES||(zoneLang()!=='fr'&&!window['OCEAN_CULTURE_ZONES_'+zoneLang().toUpperCase()]))loadZones().then(()=>{if(current===s.id&&zoneOf(s))paintLive(s,false);});
    /* Lieux et niveau des prix : chargés à la première fiche ouverte, repeints sans rejouer l’entrée en scène. */
    if(!window.OCEAN_SPOT_EXTRAS)loadExtras().then(()=>{if(current===s.id)paintLive(s,false);});
    badgeNearby();
    window.OceanNotebook?.sync();
  }
  function update(s){
    if(!s||!mount())return;
    current=s.id;
    /* Le conseil de Poulpy redevient visible à chaque fiche : seul spiritHTML (spot du catalogue) peut le masquer à
       nouveau. Sans cela, un spot personnel ouvert après un spot où le bon geste l’a remplacé n’aurait ni l’un ni l’autre. */
    document.getElementById('dTip')?.closest('.block')?.removeAttribute('data-in-geste');
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
    const toAround=e.target.closest('#guideLive [data-gl-around]');
    if(toAround){document.getElementById('glAround')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
    const tile=e.target.closest('#guideLive [data-gl-go]');
    if(tile&&typeof showDetailCat==='function'){
      showDetailCat(tile.dataset.glGo);
      return;
    }
    const jump=e.target.closest('[data-guide-jump]');
    if(jump){const target=document.getElementById(jump.dataset.guideJump);if(target){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}return;}
    const go=e.target.closest('[data-guide-spot]');if(go){openSpot(go.dataset.guideSpot);return;}
  });

  /* ---------- Comparateur ---------- */
  function compareCell(s){
    if(!s||s.custom)return 'Estimation indisponible pour un spot privé.';
    if(!data){load().then(()=>window.OceanNotebook?.refresh?.()).catch(()=>{});return '<span class="guide-compare-wait">Estimation en cours…</span>';}
    const e=estimate(s);
    return `<span class="guide-compare-price"><b>${M.euros({lo:e.lo,hi:e.hi})}</b><small>${lab(e)}, hors haute saison</small>${e.peak.length?`<small>Haute saison (${months(e.peak)}) : ${M.euros({lo:e.peakLo,hi:e.peakHi})}</small>`:''}</span>`;
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
    return `<span class="guide-compare-spirit">${c.hello?`<b${NT}>« ${esc(c.hello[0])} »</b>`:''}${c.food?`<small><span>À goûter</span> <span${NT}>${esc(c.food[0])}</span></small>`:''}</span>`;
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
      const nightsText=step.nights===null?'Ajoute la date de l’étape pour estimer le total.':step.nights===0?'Pas de nuit prévue ici : une étape à la journée.':(step.nights===1?`1 nuit : ${M.euros(step.total)} au total.`:step.basis==='split'?`${step.nights} nuits (réparties à parts égales) : ${M.euros(step.total)} au total.`:`${step.nights} nuits : ${M.euros(step.total)} au total.`);
      host.innerHTML=`<span class="trip-lodging-icon">${icon(e.type)}</span><span><b>${lab(e)}, ${M.euros(step.perNight)} la nuit${step.perNight.peak?' (haute saison)':''}</b><small>${esc(nightsText)}</small></span>${est.cheapest&&est.cheapest.stepId===step.stepId?'<em>Le moins cher</em>':''}`;
      host.classList.toggle('is-cheapest',!!est.cheapest&&est.cheapest.stepId===step.stepId);
    });
    if(!panel)return;
    if(!est.steps.length){panel.innerHTML='';panel.hidden=true;return;}
    panel.hidden=false;
    const cheap=est.cheapest?spotById(est.cheapest.spotId):null;
    const budget=Number(String(t.budget||'').replace(',','.'));
    panel.innerHTML=`<div class="trip-panel-title">${icon('bed')}<h3>Nuits à petit prix</h3></div>
      ${est.total?`<p class="trip-lodging-total"><strong>${M.euros(est.total)}</strong><span>${est.nights===1?(est.complete?'pour 1 nuit en solo':'pour 1 nuit en solo, sur les étapes datées'):(est.complete?`pour ${est.nights} nuits en solo`:`pour ${est.nights} nuits en solo, sur les étapes datées`)}</span></p>`:'<p class="trip-lodging-empty">Ajoute des dates au voyage ou à chaque étape pour estimer le total de tes nuits.</p>'}
      ${est.total&&budget>0?`<p class="trip-lodging-budget">${est.total.hi<=budget?'Cette estimation tient dans ton budget prévu.':est.total.lo>budget?'Cette estimation dépasse ton budget prévu.':'Cette estimation frôle ton budget prévu.'}</p>`:''}
      ${cheap?`<button type="button" class="trip-lodging-cheapest" data-guide-spot="${esc(cheap.id)}"><small>Le spot le moins cher de ton voyage</small><b>${esc(cheap.name.split(' — ')[0])}</b><span>${M.euros(est.cheapest.perNight)} la nuit</span></button>`:''}
      <p class="trip-lodging-note">Estimation indicative Ocean Buddy, ${M.EDITION}. Les prix varient selon la saison. Nuit la moins chère de chaque étape, pour une personne.</p>`;
  }
  document.addEventListener('change',e=>{
    if(!e.target.closest?.('#tripContent')||!(e.target.dataset.stepDate!==undefined))return;
    const id=window.OceanTrips?.route?.().selected;const t=trips().find(x=>x.id===id);if(t)fillTrip(t);
  });

  window.OceanSpotGuide={load,ready,update,around:s=>load().then(()=>aroundItems(s)),estimate,priceFor,culture,compareCell,compareCheapest,compareSpirit,fillTrip};
})();
