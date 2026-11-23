/* Compte et sauvegarde : modèle PUR de la synchronisation (aucun accès au réseau ni au DOM).
   Partagé par l'app (account-sync.js, chargé après la levée du rideau) et le serveur ob-api (server/ob-api).
   - collect(storage) : lit les clés locales d'activité (lecture seule) et les découpe en éléments « genre:id ».
   - apply(storage, items) : réécrit ces clés AUX FORMATS EXISTANTS (rien d'autre n'est touché).
   - scan / merge : détection des changements par empreinte et règles de fusion du plan (§8) :
     1. le plus récent gagne, élément par élément (voyage perdant gardé en copie dans la Corbeille) ;
     2. supprimer est une modification ;
     3. les progressions ne reculent jamais (maximum ou union) ;
     4. les réglages d'appareil (langue, son, Street View…) ne sont jamais lus ni envoyés.
   Compatibilité : un serveur refuse TOUT un envoi qui contient un seul id inconnu (400 invalid_item_data, Worker du 5 nov.).
   Un id de progression ajouté après la première mise en ligne (ex. « cultures ») ne part donc que si le serveur l'annonce
   dans sa réponse à pull (accept.progress) : voir forServer. Un client plus ancien ignore un élément qu'il ne connaît pas. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanAccountModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const KEYS={main:'oceanbuddy_v1',trips:'oceanbuddy_trips_v1',notebook:'oceanbuddy_spot_notebook_v1',progress:'oceanbuddy_progress_v1',
    quiz:'oceanbuddy_quiz_v1',badgeDates:'oceanbuddy_badge_dates',daily:'oceanbuddy_daily',surf:'oceanbuddy_surf',checklist:'oceanbuddy_visit_checklist_v1',
    cultures:'oceanbuddy_cultures_v1'};
  /* Genres acceptés par le serveur (liste fermée) ; « progress » = fusion monotone, jamais de recul. */
  const KINDS=['profile','fav','session','trip','note','progress','misc'];
  const PROGRESS_IDS=['main','xp','eco','quiz','badge_dates','surf','checklist','cultures'];
  /* Ids que TOUS les serveurs acceptent (Worker mis en ligne le 5 nov.) ; les autres attendent l'annonce du serveur. */
  const PROGRESS_BASE=['main','xp','eco','quiz','badge_dates','surf','checklist'];
  const ID_RE=/^[A-Za-z0-9_.:-]{1,80}$/;
  const LIMITS={itemBytes:32768,itemsPerPush:100,itemsPerAccount:2000,accountBytes:5*1024*1024,requestBytes:262144};
  const NOTE_MAX=1800,COPY_SUFFIX=' (copie de l’autre appareil)';
  /* Tampons des cultures : 118 pays au catalogue (noms français de 31 caractères au plus), mots de 19 caractères au plus. */
  const CULT={stamps:300,name:60,word:40,count:100000,bytes:24000};

  /* ---------- outils ---------- */
  const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  function stable(v){
    if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
    if(isObj(v))return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
    return JSON.stringify(v===undefined?null:v);
  }
  /* Empreinte rapide (cyrb53) de la forme canonique : sert seulement à repérer un changement. */
  function hash(v){
    if(v==null)return null;
    const s=stable(v);let h1=0xdeadbeef,h2=0x41c6ce57;
    for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
    h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
    return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
  }
  const keyOf=(kind,id)=>kind+':'+id;
  function splitKey(key){const i=key.indexOf(':');return {kind:key.slice(0,i),id:key.slice(i+1)};}
  const safeId=s=>String(s??'').replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,80);
  function readJSON(storage,key){try{const raw=storage.getItem(key);return raw==null?null:JSON.parse(raw);}catch(_){return null;}}
  const byteLength=s=>typeof TextEncoder!=='undefined'?new TextEncoder().encode(s).length:Buffer.byteLength(s);

  /* Un élément reçu (du serveur ou d'un client) : forme minimale exigée avant de l'écrire. */
  function validItem(kind,id,data){
    if(!KINDS.includes(kind)||!ID_RE.test(String(id))||!isObj(data))return false;
    if(kind==='progress'&&!PROGRESS_IDS.includes(id))return false;
    if(kind==='progress'&&id==='cultures')return validCultures(data);
    if(kind==='trip')return typeof data.id==='string'&&data.id===id&&Array.isArray(data.steps)&&Array.isArray(data.checklist);
    if(kind==='note')return typeof data.text==='string'&&data.text.length<=NOTE_MAX;
    if(kind==='session')return typeof data.ts==='number'||typeof data.id==='string';
    if(kind==='misc')return id==='daily'&&typeof data.v==='string'&&data.v.length<=40;
    if(kind==='profile')return id==='me';
    return true;
  }

  /* ---------- tampons des cultures (format de cultures-model.js : {v, stamps, quiz, run, best, last}) ---------- */
  const DAY_RE=/^(\d{4})-(\d\d)-(\d\d)$/;
  /* Jour AAAA-MM-JJ réel (2020 à 2099) : les dates se comparent alors comme des chaînes. */
  function isDay(v){
    const m=typeof v==='string'&&DAY_RE.exec(v);if(!m)return false;
    const y=+m[1],mo=+m[2],d=+m[3];
    return y>=2020&&y<=2099&&mo>=1&&mo<=12&&d>=1&&d<=new Date(Date.UTC(y,mo,0)).getUTCDate();
  }
  const isName=k=>typeof k==='string'&&k.length>0&&k.length<=CULT.name&&!/[\u0000-\u001f\u007f]/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
  const isCount=n=>Number.isInteger(n)&&n>=0&&n<=CULT.count;
  function quizOk(q){
    return isObj(q)&&isDay(q.d)&&isName(q.c)&&typeof q.a==='string'&&q.a.length<=CULT.name&&typeof q.w==='string'&&q.w.length<=CULT.word&&
      (q.k==='hello'||q.k==='thanks')&&typeof q.ok==='boolean';
  }
  /* Élément reçu ou envoyé : forme exacte exigée, sinon refusé en entier (un client à jour n'envoie que la forme nettoyée). */
  function validCultures(d){
    if(!isObj(d)||(d.stamps!==undefined&&!isObj(d.stamps)))return false;
    const st=Object.entries(d.stamps||{});
    if(st.length>CULT.stamps||!st.every(([k,v])=>isName(k)&&isDay(v)))return false;
    if(d.quiz!=null&&!quizOk(d.quiz))return false;
    if((d.run!==undefined&&!isCount(d.run))||(d.best!==undefined&&!isCount(d.best)))return false;
    return d.last==null||isDay(d.last);
  }
  /* Forme nettoyée et bornée (lecture locale, résultat d'une fusion) : entrées anormales retirées, 300 tampons au plus
     (les plus anciens d'abord), 24 Ko au plus ; aucun champ inconnu. */
  function cleanCultures(d){
    const out={v:1,stamps:{},quiz:null,run:0,best:0,last:null};if(!isObj(d))return out;
    const st=(isObj(d.stamps)?Object.entries(d.stamps):[]).filter(([k,v])=>isName(k)&&isDay(v))
      .sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:a[0]<b[0]?-1:a[0]>b[0]?1:0);
    let bytes=0;
    for(const [k,v] of st.slice(0,CULT.stamps)){bytes+=byteLength(JSON.stringify(k))+16;if(bytes>CULT.bytes)break;out.stamps[k]=v;}
    if(quizOk(d.quiz))out.quiz={d:d.quiz.d,c:d.quiz.c,a:d.quiz.a,w:d.quiz.w,k:d.quiz.k,ok:d.quiz.ok};
    out.run=isCount(d.run)?d.run:0;out.best=Math.max(out.run,isCount(d.best)?d.best:0);
    out.last=isDay(d.last)?d.last:null;
    return out;
  }
  const hasCultures=c=>Object.keys(c.stamps).length>0||!!c.quiz||c.best>0;
  /* Fusion de deux appareils, sans perte et dans n'importe quel ordre :
     - tampons : union des pays, la date la plus ancienne est gardée (un appareil en retard n'efface jamais un tampon) ;
     - mot du jour : le résultat du jour le plus récent (le jeu du jour ne se rejoue pas sur un autre appareil) ;
       même jour sur les deux appareils : la bonne réponse est gardée (son tampon l'est de toute façon) ;
     - série : celle de la dernière bonne réponse ; remise à zéro si le mot du jour gardé, plus récent, est raté. */
  function mergeCultures(a,b){
    const A=cleanCultures(a),B=cleanCultures(b),stamps={...A.stamps};
    for(const [k,v] of Object.entries(B.stamps))if(!stamps[k]||v<stamps[k])stamps[k]=v;
    let quiz=A.quiz||B.quiz;
    if(A.quiz&&B.quiz)quiz=A.quiz.d!==B.quiz.d?(A.quiz.d>B.quiz.d?A.quiz:B.quiz):A.quiz.ok!==B.quiz.ok?(A.quiz.ok?A.quiz:B.quiz):(stable(A.quiz)>=stable(B.quiz)?A.quiz:B.quiz);
    const last=A.last&&B.last?(A.last>=B.last?A.last:B.last):(A.last||B.last);
    let run=A.last===B.last?Math.max(A.run,B.run):last===A.last?A.run:B.run;
    if(quiz&&!quiz.ok&&(!last||quiz.d>last))run=0;
    return cleanCultures({stamps,quiz,run,best:Math.max(A.best,B.best,run),last});
  }

  /* ---------- lecture des clés locales ---------- */
  function sessionKey(s){return safeId((Number(s.ts)||0)+'-'+(s.id||s.spot||''));}
  function collect(storage){
    const out={};
    const main=readJSON(storage,KEYS.main);
    if(isObj(main)){
      const p={};for(const k of ['name','level','sport','onboarded'])if(main[k]!==undefined&&main[k]!==null&&main[k]!=='')p[k]=main[k];
      if(Object.keys(p).length)out['profile:me']=p;
      if(Array.isArray(main.favs))for(const f of main.favs)if(typeof f==='string'&&ID_RE.test(f))out['fav:'+f]={};
      if(Array.isArray(main.sessions))for(const s of main.sessions)if(isObj(s))out['session:'+sessionKey(s)]=s;
      if(typeof main.xp==='number'&&main.xp>0)out['progress:xp']={xp:main.xp};
      if(Array.isArray(main.eco)&&main.eco.length)out['progress:eco']={list:main.eco};
    }
    const trips=readJSON(storage,KEYS.trips);
    if(isObj(trips)&&Array.isArray(trips.trips))for(const t of trips.trips)if(isObj(t)&&typeof t.id==='string'&&ID_RE.test(t.id))out['trip:'+t.id]=t;
    const nb=readJSON(storage,KEYS.notebook);
    if(isObj(nb)&&isObj(nb.notes))for(const [id,text] of Object.entries(nb.notes))if(typeof text==='string'&&text.trim()&&ID_RE.test(id))out['note:'+id]={text:text.slice(0,NOTE_MAX)};
    const blobs=[['main',KEYS.progress],['quiz',KEYS.quiz],['badge_dates',KEYS.badgeDates],['surf',KEYS.surf],['checklist',KEYS.checklist]];
    for(const [id,key] of blobs){const v=readJSON(storage,key);if(isObj(v)&&Object.keys(v).length)out['progress:'+id]=v;}
    try{const d=storage.getItem(KEYS.daily);if(d)out['misc:daily']={v:String(d).slice(0,40)};}catch(_){}
    const cult=cleanCultures(readJSON(storage,KEYS.cultures));if(hasCultures(cult))out['progress:cultures']=cult;
    return out;
  }

  /* ---------- écriture aux formats existants ---------- */
  /* Renvoie la liste des clés réellement modifiées. Les champs inconnus de oceanbuddy_v1 et la
     sélection « comparer » du carnet sont conservés ; l'ordre existant des listes est respecté. */
  function apply(storage,items){
    const changed=[];
    const put=(key,value)=>{const next=typeof value==='string'?value:JSON.stringify(value);let cur=null;try{cur=storage.getItem(key);}catch(_){}
      if(cur!==next){storage.setItem(key,next);changed.push(key);}};
    const drop=key=>{let cur=null;try{cur=storage.getItem(key);}catch(_){}if(cur!=null){storage.removeItem(key);changed.push(key);}};
    const of=kind=>Object.keys(items).filter(k=>k.startsWith(kind+':')).map(k=>[splitKey(k).id,items[k]]);
    /* oceanbuddy_v1 */
    const main=readJSON(storage,KEYS.main),base=isObj(main)?{...main}:null;
    const favIds=of('fav').map(([id])=>id),sessions=of('session').map(([,s])=>s),prof=items['profile:me'];
    const hasMain=base||prof||favIds.length||sessions.length||items['progress:xp']||items['progress:eco'];
    if(hasMain){
      const next=base||{xp:0,favs:[],sessions:[],level:null,sport:null,name:'',eco:[],onboarded:false};
      const known=Array.isArray(next.favs)?next.favs.filter(f=>favIds.includes(f)):[];
      next.favs=[...known,...favIds.filter(f=>!known.includes(f))];
      const oldOrder=Array.isArray(next.sessions)?next.sessions.map(sessionKey):[];
      next.sessions=sessions.slice().sort((a,b)=>{const ia=oldOrder.indexOf(sessionKey(a)),ib=oldOrder.indexOf(sessionKey(b));
        if(ia>=0&&ib>=0)return ia-ib;return (Number(b.ts)||0)-(Number(a.ts)||0);});
      for(const k of ['name','level','sport','onboarded'])if(prof&&prof[k]!==undefined)next[k]=prof[k];
      next.xp=items['progress:xp']?Number(items['progress:xp'].xp)||0:(base?next.xp:0);
      next.eco=items['progress:eco']&&Array.isArray(items['progress:eco'].list)?items['progress:eco'].list:(Array.isArray(next.eco)?next.eco:[]);
      if(base&&!items['progress:eco'])next.eco=[];
      put(KEYS.main,next);
    }
    /* voyages */
    const tripItems=of('trip').map(([,t])=>t),tripsNow=readJSON(storage,KEYS.trips);
    if(tripItems.length||isObj(tripsNow)){
      const order=isObj(tripsNow)&&Array.isArray(tripsNow.trips)?tripsNow.trips.map(t=>t&&t.id):[];
      const list=tripItems.slice().sort((a,b)=>{const ia=order.indexOf(a.id),ib=order.indexOf(b.id);if(ia>=0&&ib>=0)return ia-ib;if(ia>=0)return -1;if(ib>=0)return 1;return 0;});
      put(KEYS.trips,{...(isObj(tripsNow)?tripsNow:{}),version:1,trips:list});
    }
    /* notes du carnet (la sélection « comparer » reste propre à l'appareil) */
    const nb=readJSON(storage,KEYS.notebook),notes={};for(const [id,n] of of('note'))notes[id]=n.text;
    if(Object.keys(notes).length||isObj(nb))put(KEYS.notebook,{compare:isObj(nb)&&Array.isArray(nb.compare)?nb.compare:[],notes});
    const blobs=[['main',KEYS.progress],['quiz',KEYS.quiz],['badge_dates',KEYS.badgeDates],['surf',KEYS.surf],['checklist',KEYS.checklist]];
    for(const [id,key] of blobs){const v=items['progress:'+id];if(v)put(key,v);}
    if(items['misc:daily'])put(KEYS.daily,items['misc:daily'].v);
    /* Tampons : toujours fusionnés avec ceux de l'appareil (jamais remplacés) ; rien n'est écrit si rien ne change.
       Un tampon local hors des bornes de la sauvegarde (date d'une horloge déréglée…) reste sur l'appareil. */
    if(items['progress:cultures']){
      const cur=readJSON(storage,KEYS.cultures),next=mergeCultures(cur,items['progress:cultures']);
      if(hash(next)!==hash(cleanCultures(cur))){
        const extra={};if(isObj(cur)&&isObj(cur.stamps))for(const [k,v] of Object.entries(cur.stamps))if(typeof k==='string'&&k&&typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&!next.stamps[k])extra[k]=v;
        put(KEYS.cultures,{...next,stamps:{...extra,...next.stamps}});
      }
    }
    return changed;
  }

  /* ---------- fusion monotone des progressions ---------- */
  function monotone(a,b,path){
    if(a===undefined||a===null)return b;if(b===undefined||b===null)return a;
    if(typeof a==='number'&&typeof b==='number')return Math.max(a,b);
    if(typeof a==='boolean'&&typeof b==='boolean')return a||b;
    if(Array.isArray(a)&&Array.isArray(b)){
      const seen=new Set(),out=[];for(const v of [...a,...b]){const k=stable(v);if(!seen.has(k)){seen.add(k);out.push(v);}}
      return out.every(v=>typeof v==='string')&&path==='days'?out.sort().slice(-120):out;
    }
    if(isObj(a)&&isObj(b)){const out={};for(const k of new Set([...Object.keys(a),...Object.keys(b)]))out[k]=monotone(a[k],b[k],k);return out;}
    /* Chaînes (personnage choisi, défi du jour…) : la plus « grande » reste stable des deux côtés ; dates AAAA-MM-JJ comparables. */
    if(typeof a==='string'&&typeof b==='string')return a>=b?a:b;
    return b;
  }
  function mergeProgress(id,a,b){
    if(id==='cultures')return mergeCultures(a,b);
    if(!isObj(a))return isObj(b)?b:{};if(!isObj(b))return a;
    if(id==='badge_dates'){const out={...a};for(const [k,v] of Object.entries(b))out[k]=out[k]&&out[k]<=v?out[k]:v;return out;}
    if(id==='quiz'){const out=monotone(a,b,'');/* défi du jour : « AAAA-M-J » n'est pas triable, le plus récent l'emporte ailleurs */return out;}
    return monotone(a,b,'');
  }

  /* ---------- détection des changements locaux ---------- */
  /* state.shadow[key] = {h, u} : empreinte et date de la dernière version commune avec le serveur.
     state.pend[key] = {h, u} : changement local pas encore envoyé, daté au moment où il est repéré. */
  function freshState(){return {v:1,lastRev:0,shadow:{},pend:{}};}
  function scan(local,state,now){
    const s={...freshState(),...state,shadow:{...(state&&state.shadow)},pend:{...(state&&state.pend)}};
    for(const key of new Set([...Object.keys(local),...Object.keys(s.shadow)])){
      const h=hash(local[key]),base=s.shadow[key]?s.shadow[key].h:null;
      /* Une progression absente de l'appareil (ou que ce serveur ne connaît pas) n'est pas une suppression :
         le serveur refuse de supprimer une progression, et refuserait alors tout l'envoi. */
      if(h===base||(h===null&&key.startsWith('progress:'))){delete s.pend[key];continue;}
      if(!s.pend[key]||s.pend[key].h!==h)s.pend[key]={h,u:now};
    }
    /* Attente d'une progression qui n'est plus sur l'appareil ni dans la base commune (notée quand le serveur l'annonçait,
       ou données locales effacées) : abandonnée, sinon elle partirait « supprimée » et bloquerait tout l'envoi. */
    for(const key of Object.keys(s.pend))if(key.startsWith('progress:')&&local[key]===undefined)delete s.pend[key];
    return s;
  }

  /* ---------- fusion avec les éléments reçus du serveur ---------- */
  /* remote : [{kind,id,data,u,deleted,rev}] ; first : première connexion de cet appareil (l'ombre est vide :
     en cas de conflit la version du compte gagne et la version locale est gardée, voyage en Corbeille, note ajoutée).
     Renvoie {local, state, push:[…], summary}. */
  function merge(local,remote,state,{now,first=false}={}){
    const out={...local},s={...state,shadow:{...state.shadow},pend:{...state.pend}};
    const summary={fromAccount:{trips:0,favs:0,sessions:0,notes:0},keptLocal:{trips:0},copies:0,progress:false};
    let maxRev=s.lastRev||0;
    for(let r of remote){
      maxRev=Math.max(maxRev,Number(r.rev)||0);
      const key=keyOf(r.kind,r.id);
      if(!r.deleted&&!validItem(r.kind,r.id,r.data))continue;
      const L=out[key],P=s.pend[key],ru=Number(r.u)||0;
      if(r.kind==='progress'){
        const m=mergeProgress(r.id,L,r.deleted?null:r.data);
        out[key]=m;s.shadow[key]={h:hash(r.deleted?null:r.data),u:ru};
        if(hash(m)!==hash(r.data))s.pend[key]={h:hash(m),u:Math.max(now,ru+1)};else delete s.pend[key];
        if(hash(m)!==hash(L))summary.progress=true;
        continue;
      }
      const remoteWins=!P||first||ru>=P.u,serverHash=r.deleted?null:hash(r.data);let keepPend=false;
      if(remoteWins){
        if(P&&L&&!r.deleted&&hash(L)!==hash(r.data)){
          if(r.kind==='trip'){
            const copyId=safeId(r.id+'-copie-'+hash(L).slice(0,6));
            if(!out['trip:'+copyId]){out['trip:'+copyId]={...L,id:copyId,name:String(L.name||'Mon voyage').slice(0,70-COPY_SUFFIX.length)+COPY_SUFFIX,deleted:true};summary.copies++;}
          }else if(r.kind==='note'&&!String(r.data.text).includes(L.text)){
            r={...r,data:{text:(r.data.text+'\n\n— '+L.text).slice(0,NOTE_MAX)}};
            keepPend=true;
          }
        }
        if(!L&&!r.deleted){if(r.kind==='trip')summary.fromAccount.trips++;else if(r.kind==='fav')summary.fromAccount.favs++;else if(r.kind==='session')summary.fromAccount.sessions++;else if(r.kind==='note')summary.fromAccount.notes++;}
        if(r.deleted)delete out[key];else out[key]=r.data;
        s.shadow[key]={h:serverHash,u:ru};
        if(keepPend)s.pend[key]={h:hash(r.data),u:Math.max(now,ru+1)};else delete s.pend[key];
      }else{
        /* La version locale est plus récente : elle reste en attente d'envoi ; on retient la base serveur. */
        s.shadow[key]={h:r.deleted?null:hash(r.data),u:ru};
      }
    }
    /* Une note fusionnée garde son attente ; les copies de voyage créées sont des ajouts locaux. */
    for(const key of Object.keys(out))if(!s.shadow[key]&&!s.pend[key])s.pend[key]={h:hash(out[key]),u:now};
    for(const key of Object.keys(s.pend)){const h=hash(out[key]);if(h!==s.pend[key].h)s.pend[key]={h,u:s.pend[key].u};
      if(s.shadow[key]&&s.shadow[key].h===h)delete s.pend[key];}
    for(const key of Object.keys(s.pend))if(key.startsWith('trip:')&&out[key]&&!out[key].deleted)summary.keptLocal.trips++;
    s.lastRev=maxRev;
    const push=Object.keys(s.pend).filter(key=>out[key]||!key.startsWith('progress:')).map(key=>{const {kind,id}=splitKey(key);return out[key]?{kind,id,data:out[key],u:s.pend[key].u,deleted:false}:{kind,id,data:{},u:s.pend[key].u,deleted:true};});
    return {local:out,state:s,push,summary};
  }

  /* Après l'envoi : les éléments acceptés deviennent la nouvelle base commune. */
  function acknowledge(state,results){
    const s={...state,shadow:{...state.shadow},pend:{...state.pend}};
    for(const r of results||[]){const key=keyOf(r.kind,r.id),p=s.pend[key];if(!p)continue;
      if(r.status==='ok'){s.shadow[key]={h:p.h,u:Number(r.u)||p.u};delete s.pend[key];}}
    return s;
  }

  /* Ids de progression annoncés par le serveur dans sa réponse à pull ({accept:{progress:[…]}}) ; [] pour un serveur ancien. */
  function serverAccepts(res){
    const p=isObj(res)&&isObj(res.accept)&&Array.isArray(res.accept.progress)?res.accept.progress:[];
    return p.filter(id=>typeof id==='string'&&PROGRESS_IDS.includes(id));
  }
  /* Ne garde que ce que le serveur sait recevoir : les ids d'origine, plus ceux qu'il annonce. Le reste n'existe pas pour
     la synchronisation (ni envoyé, ni compté comme supprimé) et reste intact sur l'appareil. */
  function forServer(items,accepted){
    const ok=new Set([...PROGRESS_BASE,...(Array.isArray(accepted)?accepted:[])]),out={};
    for(const [key,v] of Object.entries(items||{})){const {kind,id}=splitKey(key);if(kind!=='progress'||ok.has(id))out[key]=v;}
    return out;
  }

  /* Contrôle d'un élément envoyé au serveur (même règles des deux côtés). */
  function checkPushItem(it){
    if(!isObj(it))return 'item';
    if(!KINDS.includes(it.kind))return 'kind';
    if(typeof it.id!=='string'||!ID_RE.test(it.id))return 'id';
    if(!Number.isFinite(it.u)||it.u<0)return 'u';
    if(typeof it.deleted!=='boolean')return 'deleted';
    if(it.deleted)return it.kind==='progress'?'kind':null;
    if(!validItem(it.kind,it.id,it.data))return 'data';
    if(byteLength(JSON.stringify(it.data))>LIMITS.itemBytes)return 'size';
    return null;
  }

  /* Copie de sécurité de toutes les clés synchronisées, avant la première fusion. */
  function snapshot(storage){const raw={};for(const key of Object.values(KEYS)){try{const v=storage.getItem(key);if(v!=null)raw[key]=v;}catch(_){}}return raw;}
  function restoreSnapshot(storage,raw){for(const key of Object.values(KEYS)){if(raw&&typeof raw[key]==='string')storage.setItem(key,raw[key]);else storage.removeItem(key);}}

  return {KEYS,KINDS,PROGRESS_IDS,PROGRESS_BASE,ID_RE,LIMITS,CULT,stable,hash,collect,apply,scan,merge,acknowledge,mergeProgress,validItem,checkPushItem,
    freshState,snapshot,restoreSnapshot,keyOf,splitKey,cleanCultures,mergeCultures,serverAccepts,forServer};
});
