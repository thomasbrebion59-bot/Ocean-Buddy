/* Découverte des cultures : amorce chargée avec l’app (aucune donnée, quelques fonctions).
   - homeHTML() : la rangée « Tour du monde des cultures » et la carte « Le mot du jour », demandées par home-feed.js
     (culturesSection) quand il monte le fil, sous le rideau. Hauteurs fixes (cultures.css) : les mots et le jeu sont
     posés plus tard, sur place, par cultures.js, sans rien décaler ni réordonner.
   - discover(pays) : « Découvrir l’Indonésie », « Discover the Philippines », « Descubre Japón ».
   - cultures-model.js et cultures.js se chargent après la levée du rideau (OceanBoot.after, puis au repos),
     ou tout de suite au premier toucher d’un élément « culture » (data-cult-open, data-cult-index, data-cult-choice).
   - Lien partagé #culture=<pays> : la page du pays s’ouvre après la levée du rideau et, chez un nouveau visiteur, après
     l’onboarding ; app déjà ouverte, le même lien suivi dans l’onglet (hashchange) l’ouvre aussi.
   - Hors connexion : « Le mot du jour » l’indique et se remplit au retour du réseau (événement online, un seul essai). */
(() => {
  'use strict';
  /* Empreinte des fichiers chargés à la demande : écrite par scripts/build-cultures.cjs. */
  const V='eebe09419411';
  const api=window.OceanCultures={};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>(window.OB_I18N&&OB_I18N.lang)||document.documentElement.lang||'fr';

  /* ---------- « Découvrir <pays> » avec le bon article ---------- */
  /* Article devant le nom du pays (les autres pays s’écrivent sans article : Madagascar, Cuba, Malte…). */
  const FR_ART=[
    ['le ',['Japon','Maroc','Mexique','Brésil','Portugal','Royaume-Uni','Chili','Pérou','Costa Rica','Sri Lanka','Canada','Vietnam','Kenya','Mozambique','Cap-Vert','Panama','Salvador','Nicaragua','Danemark','Sénégal','Belize','Honduras','Ghana','Liberia','Venezuela','Guatemala','Cambodge','Malawi','Monténégro','Vanuatu']],
    ['la ',['France','Grèce','Croatie','Thaïlande','Colombie','Nouvelle-Zélande','Nouvelle-Calédonie','Polynésie française','Guadeloupe','Martinique','Malaisie','Tanzanie','Namibie','Norvège','Suède','Turquie','Chine','Jordanie','Finlande','Pologne','Suisse','Hongrie','Macédoine du Nord','Sierra Leone','Corée du Sud','Micronésie','Jamaïque','Slovénie','République dominicaine','Papouasie-Nouvelle-Guinée','Gambie','Dominique','Grenade','Barbade','Tunisie']],
    ['l’',['Indonésie','Australie','Espagne','Italie','Afrique du Sud','Égypte','Équateur','Inde','Irlande','Argentine','Uruguay','Allemagne','Islande','Angola','Autriche']],
    ['les ',['Philippines','États-Unis','Maldives','Seychelles','Bahamas','Pays-Bas','Îles Caïmans','Îles Cook','Îles Vierges britanniques','Îles Vierges des États-Unis','Îles Salomon','Îles Turques-et-Caïques','Émirats arabes unis','Fidji','Palaos','Samoa']]
  ];
  const ART=new Map();for(const [a,list] of FR_ART)for(const n of list)ART.set(n,a);
  const EN_THE=new Set(['États-Unis','Philippines','Maldives','Seychelles','Bahamas','Pays-Bas','Royaume-Uni','République dominicaine','Îles Caïmans','Îles Cook','Îles Vierges britanniques','Îles Vierges des États-Unis','Îles Salomon','Îles Turques-et-Caïques','Émirats arabes unis','Gambie']);
  const ES_ART={'Pays-Bas':'los ','Royaume-Uni':'el ','Émirats arabes unis':'los ','République dominicaine':'la ','Bahamas':'las ','Maldives':'las ','Seychelles':'las ','Îles Caïmans':'las ','Îles Cook':'las ','Îles Vierges britanniques':'las ','Îles Vierges des États-Unis':'las ','Îles Salomon':'las ','Îles Turques-et-Caïques':'las '};
  /* local : nom du pays dans la langue de l’interface (données chargées, sinon dictionnaire de l’interface). */
  function discover(name,lg=lang(),local){
    const nm=local||(lg==='fr'?name:(window.obT?obT(name):name));
    if(lg==='en')return 'Discover '+(EN_THE.has(name)?'the ':'')+nm;
    if(lg==='es')return 'Descubre '+(ES_ART[name]||'')+nm;
    return 'Découvrir '+(ART.get(name)||'')+nm;
  }

  /* ---------- Rangée de l’accueil : le mot de chaque carte entier, jamais coupé au milieu ni par « … » ----------
     Corps choisi selon la longueur du mot (data-fit, comme les tampons) : sa largeur est estimée avec les avances réelles
     des lettres de Barlow Condensed 800 (police du mot, en millièmes de corps ; lettres en points de code, pour que
     l’extraction des textes à traduire ne les prenne pas pour une phrase). La ligne la plus large, guillemets de la
     langue collés au mot, deux lignes au plus, doit tenir dans 73 px : la place du texte sur la carte la plus étroite
     (téléphone de 375 px). Mot très long (« Annyeonghaseyo ») : sans guillemets. Rien n’est mesuré dans la page :
     la carte garde sa hauteur et l’accueil ne bouge pas. */
  const BCC=[32,33,45,63,65,66,67,68,69,71,72,73,74,75,77,78,79,80,81,83,84,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,121,122,160,161,171,187,191,224,225,232,233,240,243,252,257,263,289,333,347,381,462,464,699,8217,8220,8221];
  const BCW=[200,289,337,462,508,477,470,480,441,473,483,235,462,505,558,522,479,474,467,454,485,707,490,492,419,457,453,445,453,446,305,451,455,223,223,465,219,685,455,452,456,456,336,426,299,455,456,635,442,377,200,289,454,454,462,457,457,446,446,456,452,455,500,444,500,500,389,667,500,278,211,211,389,389];
  const BC=new Map(BCC.map((c,i)=>[String.fromCodePoint(c),BCW[i]/1000]));
  const FIT_W=73,WORD_K=[1,.9,.8,.72,.64,.6];
  const QUOTE={fr:['«\u00a0','\u00a0»'],en:['“','”'],es:['«','»']};
  function wordFit(w,lg=lang()){
    const t=String(w||'').trim().split(/\s+/).filter(Boolean);if(!t.length)return 0;
    const [o,c]=QUOTE[lg]||QUOTE.en;
    const widest=k=>{
      const px=x=>{let n=0,m=0;for(const ch of x){n+=BC.get(ch)??.46;m++;}return 19*k*n-.2*m;};
      let best=px(o+t.join(' ')+c);
      for(let i=1;i<t.length;i++)best=Math.min(best,Math.max(px(o+t.slice(0,i).join(' ')),px(t.slice(i).join(' ')+c)));
      return Math.max(best,...t.map((x,i)=>px((i?'':o)+x+(i<t.length-1?'':c))));
    };
    for(let i=0;i<5;i++)if(widest(WORD_K[i])<=FIT_W)return i;
    return 5;
  }

  /* Nom du pays sous le mot (capitales, Figtree 700 ; table DMC/DMW : avances mesurées dans Chrome le 18 nov. 2026, pour
     mille unités de corps) : entier lui aussi, jamais « … ». Une ligne si elle tient en réduisant
     un peu le corps et l’interlettrage (data-fit 0 à 2), sinon deux lignes ou plus, coupées aux espaces et après les traits
     d’union (« SAINT-VINCENT-ET-LES-GRENADINES »), au plus grand corps qui tient. Même place de 73 px que le mot. */
  const DMC=[32,45,46,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,193,199,200,201,203,205,206,207,209,211,218];
  const DMW=[238,408,248,714,612,725,700,589,554,743,750,289,552,666,537,857,773,787,603,789,645,607,584,704,722,985,679,647,632,714,725,589,589,589,289,289,304,773,787,704];
  const DM=new Map(DMC.map((c,i)=>[String.fromCodePoint(c),DMW[i]/1000]));
  const NAME_F=[[11.5,.9],[11,.4],[10.5,.2],[10,0]];
  function nameLines(n,[size,ls]){
    const s=String(n||'').toUpperCase().trim(),px=x=>{let e=0,m=0;for(const ch of x){e+=DM.get(ch)??.62;m++;}return size*e+ls*m;};
    const units=s.split(/(?<=-)|\s+/).filter(Boolean);let lines=1,cur='',widest=0;
    for(const u of units){widest=Math.max(widest,px(u));const cand=cur?cur+(cur.endsWith('-')?'':' ')+u:u;if(!cur||px(cand)<=FIT_W)cur=cand;else{lines++;cur=u;}}
    return {lines,fits:widest<=FIT_W};
  }
  function nameFit(n){
    for(let i=0;i<3;i++){const r=nameLines(n,NAME_F[i]);if(r.fits&&r.lines===1)return i;}
    for(let max=2;max<=5;max++)for(let i=0;i<4;i++){const r=nameLines(n,NAME_F[i]);if(r.fits&&r.lines<=max)return i;}
    return 3;
  }

  /* ---------- Accueil : rangée des pays et mot du jour (hauteurs fixes) ---------- */
  /* Tirage du jour (Park-Miller) : stable dans la journée, différent le lendemain. */
  function dayShuffle(list,day,salt){
    let s=((day.getFullYear()*372+day.getMonth()*31+day.getDate())*97+salt)%2147483647||7;
    const r=()=>{s=s*16807%2147483647;return s/2147483647;};
    return list.map(x=>({x,k:r()})).sort((a,b)=>a.k-b.k).map(o=>o.x);
  }
  /* Un pays par carte : le spot à la plus belle photo réelle (éclat, puis haute définition) ; pas plus de deux pays
     par continent dans les premières cartes ; la France est laissée de côté en français (on y dit déjà bonjour). */
  function homePicks({spots,photo,score,day=new Date(),lg=lang(),n=8}){
    const best=new Map();
    for(const s of spots||[]){
      if(!s||!s.country||s.custom)continue;if(lg==='fr'&&s.country==='France')continue;
      const p=photo(s);if(!p)continue;
      const k=(score?score(s.id):55)+((p.w||0)>=1200?6:0),b=best.get(s.country);
      if(!b||k>b.k||(k===b.k&&s.id<b.s.id))best.set(s.country,{country:s.country,s,p,k});
    }
    const all=dayShuffle([...best.values()].sort((a,b)=>a.country.localeCompare(b.country,'fr')),day,17);
    const out=[],per=new Map();
    for(const c of all){if(out.length>=n)break;const w=c.s.world||'eu';if((per.get(w)||0)>=2)continue;per.set(w,(per.get(w)||0)+1);out.push(c);}
    for(const c of all){if(out.length>=n)break;if(!out.includes(c))out.push(c);}
    return out;
  }
  const STAMP_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  function cardHTML(c,view){
    const w=view?.word?.(c.country)||'',stamped=!!view?.stamped?.(c.country);
    return `<button type="button" class="cult-card${stamped?' is-stamped':''}" data-cult-open="${esc(c.country)}" data-cult-from="home" aria-label="${esc(c.country)}">
      <img src="${esc(c.p.thumb||c.p.src)}"${window.OceanPhotos?.sharp?.(c.p,'335px')||''} alt="" loading="lazy" decoding="async">
      <span class="cult-card-stamp" aria-hidden="true">${STAMP_SVG}</span>
      <span class="cult-card-tx"><span class="cult-card-word${w?'':' is-wait'}" data-cult-word="${esc(c.country)}"${w?` data-fit="${wordFit(w)}"`:''} translate="no" data-no-i18n>${esc(w)}</span><span class="cult-card-name" data-fit="${nameFit(c.country)}">${esc(c.country)}</span></span>
    </button>`;
  }
  function quizShell(){
    return `<div class="cult-quiz-body is-wait" data-cult-quiz-body aria-busy="true">
      <p class="cult-quiz-word"><i class="cult-skel"></i></p>
      <p class="cult-quiz-q">Un mot du bout du monde : devine d’où il vient.</p>
      <div class="cult-quiz-choices"><i class="cult-skel-btn"></i><i class="cult-skel-btn"></i><i class="cult-skel-btn"></i></div>
    </div>`;
  }
  /* opts : {spots, photo(s) → {src, thumb, w} | null (photos réelles seulement), score(id), day, lang}. */
  function homeHTML(opts={}){
    try{
      const view=api._view||null,picks=homePicks({...opts,lg:opts.lang||lang()});
      if(picks.length<4)return '';
      /* Le fil peut être remonté (sport, langue) : la vue, déjà chargée, remplit tout de suite. */
      if(view)setTimeout(()=>view.fillHome?.(),0);
      return `<section class="cult-home" data-cult-home aria-label="Tour du monde des cultures">
        <div class="as-sec"><h2>Tour du monde des cultures<small>Dis bonjour au monde, un pays à la fois.</small></h2><button type="button" data-cult-index>Mes tampons</button></div>
        <div class="cult-rail">${picks.map(c=>cardHTML(c,view)).join('')}</div>
        <section class="cult-quiz" data-cult-quiz aria-label="Le mot du jour">
          <div class="cult-quiz-head"><span class="cult-quiz-kicker"><img src="assets/pictos/guide/g-speech.webp" alt="" width="28" height="28" decoding="async">Le mot du jour</span><span class="cult-quiz-meta" data-cult-quiz-meta></span></div>
          ${view?.quizHTML?.()||quizShell()}
        </section>
      </section>`;
    }catch(e){setTimeout(()=>{throw e;});return '';}
  }

  /* ---------- Chargement à la demande ---------- */
  let loading=null;
  function inject(src){
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src+'?v='+V;s.async=false;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('cultures'));};document.body.append(s);});
  }
  function ensure(){
    if(api._view)return Promise.resolve(api._view);
    if(!loading)loading=(window.CulturesModel?Promise.resolve():inject('cultures-model.js')).then(()=>api._view||inject('cultures.js')).then(()=>{if(!api._view)throw Error('cultures');return api._view;})
      .catch(e=>{loading=null;throw e;});
    return loading;
  }
  const fail=()=>{try{toast('La page du pays n’a pas pu s’ouvrir. Vérifie ta connexion puis réessaie.');}catch(_){}};

  /* ---------- Touchers ---------- */
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('[data-cult-open],[data-cult-index],[data-cult-choice]');if(!t)return;
    e.preventDefault();e.stopPropagation();
    if(t.hasAttribute('data-cult-choice')){
      if(t.disabled||t.getAttribute('aria-disabled')==='true')return;
      ensure().then(v=>v.choose(t)).catch(fail);return;
    }
    if(t.hasAttribute('data-cult-index')){ensure().then(v=>v.openIndex(t)).catch(fail);return;}
    ensure().then(v=>v.open(t.dataset.cultOpen,{from:t.dataset.cultFrom||'',opener:t})).catch(fail);
  });

  /* ---------- Hors connexion : « Le mot du jour » le dit, même hauteur ; la carte reste à remplir (is-wait) ---------- */
  function offline(){
    try{
      const body=document.querySelector('[data-cult-quiz-body].is-wait');if(!body)return;
      body.removeAttribute('aria-busy');const q=body.querySelector('.cult-quiz-q');if(q)q.textContent='Le mot du jour arrive dès que tu es en ligne.';
    }catch(_){}
  }
  /* Retour du réseau : un seul nouvel essai par coupure (une seule écoute, jamais de boucle de requêtes). */
  let waitNet=false;
  function whenOnline(fn){if(waitNet)return;waitNet=true;addEventListener('online',()=>{waitNet=false;fn();},{once:true});}

  /* ---------- Lien #culture=<pays> ---------- */
  /* Première visite : l’onboarding (#onb) passe d’abord ; la page du pays s’ouvre quand il se ferme (comme deep-link.js). */
  const onbVisible=()=>{const o=document.getElementById('onb');return !!o&&o.style.display!=='none'&&!o.classList.contains('hide');};
  /* replaceState ne déclenche pas hashchange : aucune boucle. */
  const cleanHash=()=>{if(/^#culture=/.test(location.hash||''))try{history.replaceState(history.state,'',location.pathname+location.search);}catch(_){}};
  let pending=null,onbWatch=null;
  function openLink(name){
    pending=name;if(onbWatch)return;
    const fire=()=>{onbWatch=null;const c=pending;pending=null;if(c==null)return;cleanHash();ensure().then(v=>v.open(c,{from:'link'})).catch(fail);};
    if(!onbVisible())return fire();
    if(typeof MutationObserver!=='function')return;
    onbWatch=new MutationObserver(()=>{if(onbVisible())return;onbWatch.disconnect();setTimeout(fire,300);});
    onbWatch.observe(document.getElementById('onb'),{attributes:true,attributeFilter:['class','style']});
  }
  /* Seuls les pays des données ouvrent une page (v.open) ; un lien mal encodé est simplement retiré de l’adresse. */
  function fromHash(){
    const m=/^#culture=(.+)$/.exec(location.hash||'');if(!m)return false;
    let c=null;try{c=decodeURIComponent(m[1]);}catch(_){}
    if(c)openLink(c);else cleanHash();
    return true;
  }

  /* ---------- Après la levée du rideau : mots de l’accueil, recherche, passeport ; lien #culture= ---------- */
  let hashOn=false;
  const later=()=>{
    const go=()=>ensure().then(v=>v.start?.()).catch(()=>{offline();whenOnline(go);});
    if(/^#culture=/.test(location.hash||''))setTimeout(()=>{go();fromHash();},300);else setTimeout(()=>{(window.requestIdleCallback||setTimeout)(go,{timeout:2500});},900);
    /* App déjà ouverte : un lien #culture=<pays> suivi dans le même onglet ouvre aussi la page du pays. */
    if(!hashOn){hashOn=true;addEventListener('hashchange',fromHash);}
  };
  if(window.OceanBoot&&OceanBoot.after)OceanBoot.after(later);else if(document.readyState==='complete')setTimeout(later,0);else addEventListener('load',later,{once:true});

  Object.assign(api,{V,discover,wordFit,nameFit,homeHTML,homePicks,ensure,offline,whenOnline,
    open:(name,o)=>ensure().then(v=>v.open(name,o||{})),
    openIndex:()=>ensure().then(v=>v.openIndex())});
})();
