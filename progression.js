/* Progression réelle : niveaux, série de jours, défis hebdomadaires et badges.
   Tout est calculé à partir de ce que la personne a vraiment fait sur cet
   appareil ; aucun chiffre n'est écrit en dur. Chargé avant app.js. */
(function(){
  'use strict';
  var KEY='oceanbuddy_progress_v1';

  var LEVELS=[
    {min:0,t:'Moussaillon'},{min:100,t:'Explorateur'},{min:250,t:'Rider'},
    {min:450,t:'Navigateur'},{min:700,t:'Surfeur'},{min:1000,t:'Capitaine'},
    {min:1400,t:'Gardien du récif'},{min:1900,t:'Maître des marées'},
    {min:2500,t:'Ambassadeur de l’océan'},{min:3200,t:'Légende du large'}
  ];

  function level(xp){
    xp=Math.max(0,+xp||0);
    var i=0;while(i+1<LEVELS.length&&xp>=LEVELS[i+1].min)i++;
    var cur=LEVELS[i],next=LEVELS[i+1]||null;
    var span=next?next.min-cur.min:1;
    return {n:i+1,title:cur.t,min:cur.min,next:next?{n:i+2,title:next.t,min:next.min}:null,
      pct:next?Math.round((xp-cur.min)/span*100):100,remain:next?next.min-xp:0,max:!next};
  }

  function pad(n){return (n<10?'0':'')+n;}
  function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function weekKey(d){
    d=new Date((d||new Date()).getTime());d.setHours(12,0,0,0);
    var day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+3);
    var jan4=new Date(d.getFullYear(),0,4,12);
    var w=1+Math.round(((d-jan4)/864e5-3+((jan4.getDay()+6)%7))/7);
    return d.getFullYear()+'-W'+pad(w);
  }
  function monthKey(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1);}

  function empty(){return {days:[],seen:{},chal:{},badges:[],best:0};}
  var state=empty();
  function load(){
    try{
      var d=JSON.parse(localStorage.getItem(KEY)||'null');
      if(d&&typeof d==='object'){
        state.days=Array.isArray(d.days)?d.days.filter(function(x){return /^\d{4}-\d\d-\d\d$/.test(x);}):[];
        state.seen=d.seen&&typeof d.seen==='object'?d.seen:{};
        state.chal=d.chal&&typeof d.chal==='object'?d.chal:{};
        state.badges=Array.isArray(d.badges)?d.badges:[];
        state.best=+d.best||0;
      }
    }catch(e){}
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}

  function streak(){
    var set={};state.days.forEach(function(k){set[k]=1;});
    var d=new Date();d.setHours(12,0,0,0);
    if(!set[dayKey(d)])d.setDate(d.getDate()-1);
    var n=0;while(set[dayKey(d)]){n++;d.setDate(d.getDate()-1);}
    return n;
  }
  function markToday(){
    var k=dayKey();
    if(state.days.indexOf(k)<0){state.days.push(k);state.days.sort();if(state.days.length>120)state.days=state.days.slice(-120);}
    state.best=Math.max(state.best,streak());save();
  }
  /* Les 7 jours de la semaine en cours, du lundi au dimanche. */
  function week(){
    var set={};state.days.forEach(function(k){set[k]=1;});
    var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));
    var today=dayKey(),out=[];
    for(var i=0;i<7;i++){var k=dayKey(d);out.push({k:k,l:'LMMJVSD'[i],on:!!set[k],today:k===today,future:k>today});d.setDate(d.getDate()+1);}
    return out;
  }

  function seeSpot(id){if(!id)return;if(!state.seen[id]){state.seen[id]=dayKey();save();}}
  function seenCount(month){
    var m=month?monthKey():null,n=0;
    Object.keys(state.seen).forEach(function(id){if(!m||String(state.seen[id]).slice(0,7)===m)n++;});
    return n;
  }

  /* Défis : remis à zéro chaque semaine (lundi). On garde la trace des
     défis déjà réussis une fois pour les badges. */
  function chalDone(id){var c=state.chal[id];return !!(c&&c.w===weekKey());}
  function chalEver(id){var c=state.chal[id];return !!(c&&c.n>0);}
  function chalTotal(){var n=0;Object.keys(state.chal).forEach(function(id){n+=+state.chal[id].n||0;});return n;}
  function completeChal(id){
    if(chalDone(id))return false;
    var c=state.chal[id]||{n:0};c.w=weekKey();c.n=(+c.n||0)+1;state.chal[id]=c;save();return true;
  }

  function sessionsThisWeek(list){
    var w=weekKey(),n=0;(list||[]).forEach(function(s){if(s&&s.ts&&weekKey(new Date(s.ts))===w)n++;});return n;
  }

  /* Objectifs mesurables des défis : sans eux, le bouton « Valider » suffit. */
  function goal(id,ctx){
    if(id==='explorateur')return {cur:seenCount(true),max:3,unit:'spots découverts ce mois-ci'};
    if(id==='regularite')return {cur:sessionsThisWeek(ctx.sessions),max:5,unit:'sessions cette semaine'};
    return null;
  }

  var BADGES=[
    {id:'first',e:'wave',n:'Première vague',how:'Enregistre ta première session.',ok:function(c){return c.sessions.length>=1;}},
    {id:'eco',e:'balai',n:'Éco-héros',how:'Note 5 gestes pour l’océan.',ok:function(c){return c.eco>=5;}},
    {id:'explorer',e:'carte',n:'Explorateur',how:'Découvre 10 fiches de spots.',ok:function(){return seenCount(false)>=10;}},
    {id:'dawn',e:'sunrise',n:'Dawn Patrol',how:'Réussis le défi Dawn Patrol.',ok:function(){return chalEver('dawn-patrol');}},
    {id:'streak7',e:'flamme',n:'7 jours',how:'Reviens 7 jours d’affilée.',ok:function(){return state.best>=7;}},
    {id:'quiz',e:'trophee',n:'Compétiteur',how:'Deviens expert d’un thème du quiz.',ok:function(c){return c.quiz>=1;}},
    {id:'dolphin',e:'dauphin',n:'Ami dauphin',how:'Réussis 10 défis.',ok:function(){return chalTotal()>=10;}},
    {id:'legend',e:'couronne',n:'Légende',how:'Atteins le niveau 10.',ok:function(c){return level(c.xp).max;}}
  ];
  function badges(ctx){return BADGES.map(function(b){return {id:b.id,e:b.e,n:b.n,how:b.how,locked:!b.ok(ctx)};});}
  /* Renvoie les badges nouvellement obtenus depuis le dernier appel. */
  function newBadges(ctx){
    var got=[];badges(ctx).forEach(function(b){if(!b.locked&&state.badges.indexOf(b.id)<0){state.badges.push(b.id);got.push(b);}});
    if(got.length)save();return got;
  }

  function reset(){state=empty();save();}

  load();markToday();
  window.OceanProgress={LEVELS:LEVELS,level:level,streak:streak,best:function(){return state.best;},week:week,
    markToday:markToday,seeSpot:seeSpot,seenCount:seenCount,chalDone:chalDone,completeChal:completeChal,
    goal:goal,badges:badges,newBadges:newBadges,reset:reset,weekKey:weekKey,dayKey:dayKey};
})();
