/* Découverte des cultures : modèle PUR (aucun accès au DOM, au réseau ni au stockage).
   Partagé par cultures.js (chargé après la levée du rideau), scripts/build-cultures.cjs et les tests.
   - Schéma des fiches culturelles (validateEntry) : faits sourcés écrits dans data/cultures-src/*.json.
   - Tampons du passeport (readState, stamp) : un tampon par pays découvert (page ouverte ou mot du jour réussi).
   - Le mot du jour (quiz, answer) : un mot local, trois pays, un seul juste ; même mot pour tout le monde ce jour-là.
   - Recherche (matchCountry) et prochaine escale (nextCountry). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CulturesModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const LANGS=['fr','en','es'];
  const STORE='oceanbuddy_cultures_v1';
  /* Longueurs maximales (caractères) : au-delà, la carte déborde sur un téléphone. */
  const LIMITS={seaTitle:40,seaText:170,feteTitle:44,feteText:150,when:60,word:40,thanksLang:40,label:90,
    baseLang:160,gloss:90,foodName:48,foodText:170,respect:180};

  /* ---------- outils ---------- */
  const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const str=v=>typeof v==='string'&&v.trim().length>0;
  const pad=n=>(n<10?'0':'')+n;
  function dayKey(d){d=d instanceof Date?d:new Date(d);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  /* Numéro du jour local (heure de l’appareil), stable de minuit à minuit. */
  function dayNumber(d){d=d instanceof Date?d:new Date(d);return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);}
  function prevKey(key){const [y,m,dd]=String(key).split('-').map(Number);return dayKey(new Date(y,m-1,dd-1,12));}
  /* Tirage déterministe (Park-Miller) : même ordre pour une même graine. */
  function rng(seed){let s=Math.abs(Math.floor(seed))%2147483647||7;return ()=>{s=s*16807%2147483647;return s/2147483647;};}
  function shuffle(list,seed){const r=rng(seed);return list.map(x=>({x,k:r()})).sort((a,b)=>a.k-b.k).map(o=>o.x);}
  /* Comparaison souple : accents, casse, ponctuation et apostrophes ignorés. */
  const norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’'ʻʼ`´]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  /* ---------- schéma d’une fiche (data/cultures-src) ---------- */
  const HTTPS=u=>{if(typeof u!=='string'||!/^https:\/\//.test(u))return false;try{const x=new URL(u);return x.protocol==='https:'&&!!x.hostname&&x.hostname.includes('.');}catch(_){return false;}};
  /* Écriture latine seulement (lettres latines avec accents, apostrophes, espaces, tirets, ponctuation simple). */
  const LATIN=/^[\p{Script=Latin}\p{M}\s’'ʻʼ`´.,!?¡¿\-/()]+$/u;
  /* Règle du fondateur : pas de tiret cadratin ni de flèche décorative dans les textes. */
  const FORBIDDEN=/[—→←↗↘⟶➜➔]/;
  const DATE=/^\d{4}-\d\d-\d\d$/;
  function checkText(errs,where,v,max){
    if(!str(v)){errs.push(`${where} : texte manquant`);return;}
    if(v!==v.trim())errs.push(`${where} : espaces au début ou à la fin`);
    if(v.length>max)errs.push(`${where} : ${v.length} caractères (maximum ${max})`);
    if(FORBIDDEN.test(v))errs.push(`${where} : tiret cadratin ou flèche interdits`);
    if(/<[a-z/]/i.test(v))errs.push(`${where} : balise HTML interdite`);
  }
  function checkI18n(errs,where,v,max){
    if(!isObj(v)){errs.push(`${where} : objet {fr, en, es} attendu`);return;}
    for(const k of Object.keys(v))if(!LANGS.includes(k))errs.push(`${where} : langue inconnue « ${k} »`);
    for(const l of LANGS)checkText(errs,`${where}.${l}`,v[l],max);
  }
  function checkSource(errs,where,v){
    if(!isObj(v)){errs.push(`${where} : source manquante ({label, url})`);return;}
    for(const k of Object.keys(v))if(!['label','url'].includes(k))errs.push(`${where} : champ inconnu « ${k} »`);
    checkText(errs,where+'.label',v.label,LIMITS.label);
    if(!HTTPS(v.url))errs.push(`${where}.url : adresse https:// valide attendue (reçu ${JSON.stringify(v.url)})`);
  }
  function only(errs,where,v,keys){for(const k of Object.keys(v))if(!keys.includes(k))errs.push(`${where} : champ inconnu « ${k} »`);}
  /* Renvoie la liste des erreurs (vide si la fiche est valide). */
  function validateEntry(name,e){
    const errs=[],at=k=>`${name} › ${k}`;
    if(!isObj(e))return [`${name} : objet attendu`];
    only(errs,name,e,['sea','fete','thanks','base','reviewed','manques']);
    if(!e.sea&&!e.fete&&!e.thanks&&!e.base)errs.push(`${name} : aucun champ (sea, fete, thanks ou base)`);
    if(e.sea!==undefined){
      if(!isObj(e.sea))errs.push(at('sea')+' : objet attendu');
      else{only(errs,at('sea'),e.sea,['title','text','source']);checkI18n(errs,at('sea.title'),e.sea.title,LIMITS.seaTitle);checkI18n(errs,at('sea.text'),e.sea.text,LIMITS.seaText);checkSource(errs,at('sea.source'),e.sea.source);}
    }
    if(e.fete!==undefined){
      if(!isObj(e.fete))errs.push(at('fete')+' : objet attendu');
      else{only(errs,at('fete'),e.fete,['title','when','text','source']);checkI18n(errs,at('fete.title'),e.fete.title,LIMITS.feteTitle);checkI18n(errs,at('fete.when'),e.fete.when,LIMITS.when);checkI18n(errs,at('fete.text'),e.fete.text,LIMITS.feteText);checkSource(errs,at('fete.source'),e.fete.source);}
    }
    if(e.thanks!==undefined){
      if(!isObj(e.thanks))errs.push(at('thanks')+' : objet attendu');
      else{
        only(errs,at('thanks'),e.thanks,['word','lang','source']);
        checkText(errs,at('thanks.word'),e.thanks.word,LIMITS.word);
        if(str(e.thanks.word)&&!LATIN.test(e.thanks.word))errs.push(`${at('thanks.word')} : écriture latine attendue (translittération), reçu « ${e.thanks.word} »`);
        checkI18n(errs,at('thanks.lang'),e.thanks.lang,LIMITS.thanksLang);checkSource(errs,at('thanks.source'),e.thanks.source);
      }
    }
    if(e.base!==undefined){
      const b=e.base;
      if(!isObj(b))errs.push(at('base')+' : objet attendu');
      else{
        only(errs,at('base'),b,['lang','hello','food','respect','source']);
        if(!b.lang&&!b.hello&&!b.food&&!b.respect)errs.push(at('base')+' : vide');
        if(b.lang!==undefined)checkI18n(errs,at('base.lang'),b.lang,LIMITS.baseLang);
        if(b.hello!==undefined){
          if(!isObj(b.hello))errs.push(at('base.hello')+' : objet {word, gloss} attendu');
          else{only(errs,at('base.hello'),b.hello,['word','gloss']);checkText(errs,at('base.hello.word'),b.hello.word,LIMITS.word);
            if(str(b.hello.word)&&!LATIN.test(b.hello.word))errs.push(`${at('base.hello.word')} : écriture latine attendue, reçu « ${b.hello.word} »`);
            checkI18n(errs,at('base.hello.gloss'),b.hello.gloss,LIMITS.gloss);}
        }
        if(b.food!==undefined){
          if(!isObj(b.food))errs.push(at('base.food')+' : objet {name, text} attendu');
          else{only(errs,at('base.food'),b.food,['name','text']);checkI18n(errs,at('base.food.name'),b.food.name,LIMITS.foodName);checkI18n(errs,at('base.food.text'),b.food.text,LIMITS.foodText);}
        }
        if(b.respect!==undefined)checkI18n(errs,at('base.respect'),b.respect,LIMITS.respect);
        checkSource(errs,at('base.source'),b.source);
      }
    }
    if(!DATE.test(String(e.reviewed||''))||isNaN(new Date(e.reviewed+'T12:00:00')))errs.push(`${at('reviewed')} : date AAAA-MM-JJ attendue (reçu ${JSON.stringify(e.reviewed)})`);
    if(e.manques!==undefined&&!Array.isArray(e.manques)&&!isObj(e.manques)&&typeof e.manques!=='string')errs.push(at('manques')+' : liste attendue');
    return errs;
  }

  /* ---------- tampons du passeport (localStorage oceanbuddy_cultures_v1) ---------- */
  function emptyState(){return {v:1,stamps:{},quiz:null,run:0,best:0,last:null};}
  function readState(raw){
    const s=emptyState();let d=null;
    try{d=typeof raw==='string'?JSON.parse(raw):raw;}catch(_){return s;}
    if(!isObj(d))return s;
    if(isObj(d.stamps))for(const [k,v] of Object.entries(d.stamps))if(str(k)&&typeof v==='string'&&DATE.test(v))s.stamps[k]=v;
    if(isObj(d.quiz)&&DATE.test(String(d.quiz.d))&&str(d.quiz.c)&&str(d.quiz.a))s.quiz={d:d.quiz.d,c:d.quiz.c,a:d.quiz.a,w:typeof d.quiz.w==='string'?d.quiz.w:'',k:d.quiz.k==='thanks'?'thanks':'hello',ok:!!d.quiz.ok};
    s.run=Math.max(0,Math.floor(+d.run||0));s.best=Math.max(s.run,Math.floor(+d.best||0));
    s.last=DATE.test(String(d.last))?d.last:null;
    return s;
  }
  const writeState=s=>JSON.stringify(s);
  /* Tampon (première découverte seulement : la date ne change plus ensuite). */
  function stamp(state,country,day){
    const s=readState(state);if(!str(country))return {state:s,isNew:false};
    if(s.stamps[country])return {state:s,isNew:false};
    s.stamps={...s.stamps,[country]:dayKey(day)};
    return {state:s,isNew:true};
  }
  const stamped=(state,country)=>!!(state&&state.stamps&&state.stamps[country]);
  function count(state,names){const set=state&&state.stamps||{};return (names||Object.keys(set)).filter(n=>set[n]).length;}
  /* Tampons du plus récent au plus ancien (puis par nom). */
  function recent(state,n){return Object.entries(state&&state.stamps||{}).sort((a,b)=>b[1].localeCompare(a[1])||a[0].localeCompare(b[0],'fr')).slice(0,n??Infinity).map(([c,d])=>({country:c,date:d}));}

  /* ---------- le mot du jour ---------- */
  /* Mots que tout le monde connaît déjà : jamais proposés comme mot du jour. */
  const EASY=new Set(['bonjour','salut','merci','hello','hi','hey','thank you','thanks','hola','gracias']);
  /* Mots vides des noms de langues (fr, en, es) : seuls les noms de langues comparent deux pays. */
  const STOP=new Set('langue langues regionale regionales locale locales officielle officielles dialectal dialecte dialectes et autres beaucoup aussi tres sont les des du de la le ses language languages regional local official dialect dialects and other others also the lengua lenguas oficial oficiales y otras otros el los las del'.split(' '));
  const langTokens=s=>new Set(norm(s).split(' ').filter(w=>w.length>2&&!STOP.has(w)));
  /* Mots jouables : « bonjour » du carnet et « merci » des fiches culturelles, un seul pays par mot. */
  function quizItems(countries){
    const names=Object.keys(countries||{}).sort((a,b)=>a.localeCompare(b,'fr')),seen=new Set(),out=[];
    for(const name of names){
      const c=countries[name]||{};
      const add=(kind,word)=>{const w=norm(word);if(!w||EASY.has(w)||seen.has(kind+':'+w))return;seen.add(kind+':'+w);out.push({country:name,kind,word});};
      if(Array.isArray(c.hello)&&str(c.hello[0]))add('hello',c.hello[0]);
      if(c.thanks&&str(c.thanks.word))add('thanks',c.thanks.word);
    }
    return out;
  }
  function wordsOf(c){const w=[];if(Array.isArray(c?.hello)&&c.hello[0])w.push(norm(c.hello[0]));if(c?.thanks?.word)w.push(norm(c.thanks.word));return w;}
  function tokensOf(c){const t=langTokens(c?.langs||'');for(const x of langTokens(c?.thanks?.lang||''))t.add(x);return t;}
  /* Deux pays « se ressemblent » s’ils partagent une langue ou un mot : jamais ensemble dans les choix. */
  function close(a,b,word){
    const wb=wordsOf(b),w=norm(word);
    if(w&&wb.includes(w))return true;
    if(wordsOf(a).some(x=>wb.includes(x)))return true;
    const ta=tokensOf(a),tb=tokensOf(b);for(const x of ta)if(tb.has(x))return true;
    return false;
  }
  /* Question du jour : chaque mot revient une fois par cycle, dans un ordre fixe ; les deux autres choix sont des pays
     dont on connaît les langues et qui ne parlent pas celle du mot. Renvoie null s’il n’y a pas assez de pays. */
  function quiz(countries,day){
    const items=quizItems(countries);if(!items.length)return null;
    const order=shuffle(items,982451653),n=dayNumber(day);
    const it=order[((n%order.length)+order.length)%order.length],answer=countries[it.country];
    const known=name=>str(countries[name]?.langs)||str(countries[name]?.thanks?.lang);
    const pool=shuffle(Object.keys(countries).filter(name=>name!==it.country&&known(name)&&!close(answer,countries[name],it.word)).sort((a,b)=>a.localeCompare(b,'fr')),n*7+3);
    const others=[];
    for(const name of pool){if(others.length===2)break;if(others.every(o=>!close(countries[o],countries[name],'')))others.push(name);}
    if(others.length<2)return null;
    return {day:dayKey(day),country:it.country,kind:it.kind,word:it.word,choices:shuffle([it.country,...others],n*13+5)};
  }
  /* Réponse : une seule par jour ; un bon choix donne le tampon du pays et prolonge la série de bonnes réponses. */
  function answer(state,q,choice,day){
    const s=readState(state),today=dayKey(day);
    if(!q||s.quiz&&s.quiz.d===today)return {state:s,ok:s.quiz?s.quiz.ok:false,isNew:false,already:true};
    const ok=choice===q.country;
    s.quiz={d:today,c:q.country,a:String(choice||''),w:q.word,k:q.kind,ok};
    let isNew=false;
    if(ok){
      s.run=s.last===prevKey(today)?s.run+1:1;s.best=Math.max(s.best,s.run);s.last=today;
      const r=stamp(s,q.country,day);s.stamps=r.state.stamps;isNew=r.isNew;
    }else s.run=0;
    return {state:s,ok,isNew,already:false};
  }
  /* Réponse déjà donnée aujourd’hui (pour réafficher le résultat). */
  const answered=(state,day)=>state&&state.quiz&&state.quiz.d===dayKey(day)?state.quiz:null;
  /* Série en cours : remise à zéro si la dernière bonne réponse date d’avant-hier. */
  function streak(state,day){const t=dayKey(day);return state&&(state.last===t||state.last===prevKey(t))?state.run:0;}

  /* ---------- recherche et prochaine escale ---------- */
  /* labels : {pays: [nom fr, nom en, nom es]} ; renvoie le pays si la recherche le nomme (ou en est le début, 4 lettres au moins). */
  function matchCountry(query,labels){
    const q=norm(query);if(q.length<3)return null;
    const exact=[],start=[];
    for(const [key,list] of Object.entries(labels||{})){
      const ns=[key,...(list||[])].map(norm).filter(Boolean);
      if(ns.includes(q))exact.push(key);
      else if(q.length>=4&&ns.some(x=>x.startsWith(q)))start.push(key);
    }
    if(exact.length===1)return exact[0];
    if(!exact.length&&start.length===1)return start[0];
    return null;
  }
  /* Prochaine escale : un pays pas encore tamponné, tiré au sort pour la journée (sinon un autre pays). */
  function nextCountry(names,state,current,day){
    const list=(names||[]).filter(n=>n!==current).sort((a,b)=>a.localeCompare(b,'fr'));if(!list.length)return null;
    const order=shuffle(list,dayNumber(day)*31+norm(current).length);
    return order.find(n=>!stamped(state,n))||order[0];
  }

  return {LANGS,LIMITS,STORE,norm,dayKey,dayNumber,shuffle,validateEntry,emptyState,readState,writeState,stamp,stamped,count,recent,
    quizItems,quiz,answer,answered,streak,matchCountry,nextCountry};
});
