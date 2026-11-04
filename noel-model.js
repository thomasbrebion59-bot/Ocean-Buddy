/* Mode Noël : logique pure (sans DOM) des dates, de la sélection « Noël au soleil » et du calendrier de l’Avent.
   Période : du 15 novembre au 6 janvier inclus, date locale de l’appareil (l’Avent, lui, va du 1er au 24 décembre). Forçage pour les essais :
   ?saison=noel (simule la période ; ?saison=noel&jour=2026-12-12 choisit le jour) et ?saison=off (coupe le mode).
   Le réglage « Ambiance de Noël » (localStorage oceanbuddy_noel = "off") coupe le mode pendant la période.
   Utilisée par home-feed.js ; testée dans tests/noel-model.test.js. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NoelModel=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const STORE='oceanbuddy_noel',AVENT='oceanbuddy_avent',MIN_SEA=24;

  /* Du 15 novembre au 6 janvier inclus. */
  function inPeriod(date){
    if(!(date instanceof Date)||isNaN(date))return false;
    const m=date.getMonth(),d=date.getDate();
    return (m===10&&d>=15)||m===11||(m===0&&d<=6);
  }
  /* Jours entiers jusqu’au 25 décembre de l’année (calcul en dates civiles : insensible aux changements d’heure). */
  function daysToChristmas(date){
    const y=date.getFullYear();
    return Math.round((Date.UTC(y,11,25)-Date.UTC(y,date.getMonth(),date.getDate()))/86400000);
  }
  /* Paramètres d’essai : saison=noel|off, jour=AAAA-MM-JJ (date locale). */
  function parseQuery(search){
    let force=null,day=null;
    try{
      const p=new URLSearchParams(search||'');
      const s=String(p.get('saison')||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      force=s==='noel'?'noel':s==='off'?'off':null;
      const j=/^(\d{4})-(\d{2})-(\d{2})$/.exec(p.get('jour')||'');
      if(j){const d=new Date(+j[1],+j[2]-1,+j[3],12);if(d.getMonth()===+j[2]-1&&d.getDate()===+j[3])day=d;}
    }catch(_){}
    return {force,day};
  }
  /* Date de la saison : la vraie date, sauf forçage hors période (jour demandé, sinon le 1er décembre). */
  function seasonDate(now,q){
    if(q&&q.force==='noel'){
      if(q.day&&inPeriod(q.day))return q.day;
      if(!inPeriod(now))return new Date(now.getFullYear(),11,1,12);
    }
    return now;
  }
  /* État du mode : on (affiché), period (réglage proposé), forced, date utilisée, enabled (réglage). */
  function state({now=new Date(),search='',stored=null}={}){
    const q=parseQuery(search);
    if(q.force==='off')return {on:false,period:false,forced:'off',enabled:stored!=='off',date:now};
    const date=seasonDate(now,q),period=inPeriod(date),enabled=stored!=='off';
    return {on:period&&enabled,period,forced:q.force,enabled,date};
  }
  /* Titre de saison : compte à rebours du 15 novembre au 24 décembre, Noël le 25, belles fêtes jusqu’au 31,
     bonne année du 1er au 6 janvier. */
  function greeting(date){
    if(!inPeriod(date))return null;
    const m=date.getMonth(),d=date.getDate();
    if(m===10||(m===11&&d<25))return {kind:'countdown',n:daysToChristmas(date)};
    if(m===11&&d===25)return {kind:'noel'};
    if(m===11)return {kind:'fetes'};
    return {kind:'annee'};
  }
  /* Mois de la rangée « Noël au soleil » : décembre jusqu’au 25 (dès novembre, on prépare les fêtes), janvier ensuite. */
  function railMonth(date){const m=date.getMonth();return m===10||(m===11&&date.getDate()<=25)?11:0;}

  /* Spots au soleil pour les fêtes : bonne saison ce mois-là (data/seasons.json) ET eau ≥ 24 °C (normales NOAA).
     Tri : score photo décroissant, puis eau la plus chaude, puis identifiant (ordre stable). Aucune liste en dur :
     tout spot ajouté au catalogue y entre dès qu’il remplit les deux conditions. */
  function sunnySpots(spots,{seasons,sea,scores,month,min=MIN_SEA}={}){
    if(!seasons||typeof sea!=='function')return [];
    const score=id=>scores&&typeof scores[id]==='number'?scores[id]:55;
    return (spots||[]).filter(s=>s&&s.id&&Array.isArray(seasons[s.id])&&seasons[s.id].includes(month)&&(sea(s,month)??-99)>=min)
      .map(s=>({s,k:score(s.id),t:sea(s,month)}))
      .sort((a,b)=>b.k-a.k||b.t-a.t||(a.s.id<b.s.id?-1:a.s.id>b.s.id?1:0))
      .map(o=>o.s);
  }

  /* Calendrier de l’Avent : 24 cases du 1er au 24 décembre ; null en dehors (la case disparaît après le 24). */
  function adventDays(date){
    if(!(date instanceof Date)||date.getMonth()!==11||date.getDate()>24)return null;
    const t=date.getDate();
    return Array.from({length:24},(_,i)=>({day:i+1,state:i+1<t?'past':i+1===t?'today':'future'}));
  }
  /* Avant le 1er décembre (période déjà ouverte) : la carte « Le calendrier de l’Avent ouvre le 1er décembre » tient sa place. */
  function adventSoon(date){return inPeriod(date)&&date.getMonth()===10;}
  /* Ordre de l’année : mélange déterministe des identifiants (triés d’abord, donc indépendant de l’ordre reçu). */
  function adventOrder(ids,year){
    let seed=(Math.abs(Math.floor(year*7919+12345))%2147483647)||7;
    const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
    const a=[...new Set(ids||[])].sort();
    for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const x=a[i];a[i]=a[j];a[j]=x;}
    return a;
  }
  /* Spot d’une case : celui déjà tiré pour ce jour s’il est encore proposé, sinon le suivant de l’ordre de l’année
     qui n’a été tiré pour aucun autre jour (jamais deux fois le même tant qu’il y a assez de spots). */
  function adventPick(day,year,ids,opened){
    const list=[...new Set(ids||[])];if(!list.length||!(day>=1&&day<=24))return null;
    const mem=opened||{},own=mem[day];
    if(own&&list.includes(own))return own;
    const taken=new Set(Object.keys(mem).filter(d=>+d!==day).map(d=>mem[d]));
    const order=adventOrder(list,year);
    for(let k=0;k<order.length;k++){const id=order[(day-1+k)%order.length];if(!taken.has(id))return id;}
    return order[(day-1)%order.length];
  }
  /* Cases ouvertes (localStorage oceanbuddy_avent) : {"y":2026,"days":{"3":"spot"}} ; une autre année repart à vide. */
  function readOpened(raw,year){
    try{
      const o=JSON.parse(raw||'null');
      if(!o||o.y!==year||!o.days||typeof o.days!=='object')return {};
      const out={};
      for(const [d,id] of Object.entries(o.days))if(+d>=1&&+d<=24&&typeof id==='string'&&id)out[+d]=id;
      return out;
    }catch(_){return {};}
  }
  function writeOpened(opened,year){return JSON.stringify({y:year,days:opened||{}});}

  return {STORE,AVENT,MIN_SEA,inPeriod,daysToChristmas,parseQuery,seasonDate,state,greeting,railMonth,sunnySpots,adventDays,adventSoon,adventOrder,adventPick,readOpened,writeOpened};
});
