/* Code injecté dans la page avant tout script (Page.addScriptToEvaluateOnNewDocument).
 * Injected into the page before any script. Collects samples + events in window.__bc. */
module.exports = function instrument({ native }) {
  return `(()=>{
if(window.__bc)return;
const B=window.__bc={s:[],ev:[],liftEvent:null};
const now=()=>performance.now();
const desc=n=>{if(!n)return'?';if(n.nodeType===3)return'#text';return (n.tagName||'?').toLowerCase()+(n.id?'#'+n.id:'')+(typeof n.className==='string'&&n.className?'.'+n.className.trim().split(/\\s+/).slice(0,3).join('.'):'');};
const ev=(type,d)=>B.ev.push(Object.assign({type,t:Math.round(now())},d));
const stack=()=>String(new Error().stack).split('\\n').slice(3,8).map(s=>s.trim().replace(/^at /,'').replace(location.origin+'/','')).join(' < ');
${native ? `try{const mk=()=>document.documentElement&&document.documentElement.classList.add('native-app');mk();document.addEventListener('readystatechange',mk);}catch(_){}` : ''}
/* ---- page scroller + vertical scroll writes ---- */
const isPage=el=>el===window||el===document.documentElement||el===document.body||(el&&el.id==='screenWrap')||el===document.scrollingElement;
const getTop=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop');
const pos=()=>{const w=document.getElementById('screenWrap');return (w?getTop.get.call(w):0)+(document.scrollingElement?getTop.get.call(document.scrollingElement):0);};
const vert=a=>{const o=a[0];return o&&typeof o==='object'?o.top!==undefined:a.length>=2&&a[1]!==undefined;};
const topOf=a=>{const o=a[0];return o&&typeof o==='object'?o.top:a[1];};
const wrap=(obj,name,label)=>{const o=obj[name];if(typeof o!=='function')return;obj[name]=function(...a){
  try{const tgt=this;
    if(name==='scrollIntoView'||name==='scrollIntoViewIfNeeded'){const b=pos();const r=o.apply(this,a);if(Math.abs(pos()-b)>0.5)ev('scroll-write',{api:label,target:desc(this),args:JSON.stringify(a).slice(0,80),stack:stack()});return r;}
    if(isPage(tgt)&&vert(a)){const cur=tgt===window||tgt===document.documentElement||tgt===document.body?pos():getTop.get.call(tgt);
      const want=name==='scrollBy'?cur+(+topOf(a)||0):+topOf(a);
      const smooth=a[0]&&typeof a[0]==='object'&&a[0].behavior==='smooth';
      if(Math.abs(want-cur)>0.5||smooth)ev('scroll-write',{api:label,target:desc(tgt===window?document.documentElement:tgt),args:JSON.stringify(a).slice(0,80),stack:stack()});}
  }catch(_){}
  return o.apply(this,a);};};
for(const n of['scrollTo','scroll','scrollBy'])wrap(window,n,'window.'+n);
for(const n of['scrollTo','scrollBy','scroll','scrollIntoView','scrollIntoViewIfNeeded'])wrap(Element.prototype,n,'Element.'+n);
if(getTop&&getTop.set)Object.defineProperty(Element.prototype,'scrollTop',{get:getTop.get,set(v){try{if(isPage(this)&&Math.abs(getTop.get.call(this)-v)>0.5)ev('scroll-write',{api:'scrollTop=',target:desc(this),args:String(v)+' (was '+Math.round(getTop.get.call(this))+')',stack:stack()});}catch(_){}return getTop.set.call(this,v);},configurable:true});
{let last=0;addEventListener('scroll',e=>{const t=e.target===document?document.scrollingElement:e.target;if(!isPage(t))return;const y=pos();if(Math.abs(y-last)>0.5){ev('scroll-moved',{target:desc(t),from:Math.round(last),y:Math.round(y)});last=y;}},true);}
/* ---- layout shifts ---- */
try{new PerformanceObserver(l=>{for(const e of l.getEntries())B.ev.push({type:'cls',t:Math.round(e.startTime),value:e.value,input:e.hadRecentInput,sources:(e.sources||[]).map(s=>desc(s.node)+' y'+Math.round(s.previousRect.y)+'->'+Math.round(s.currentRect.y)+' x'+Math.round(s.previousRect.x)+'->'+Math.round(s.currentRect.x)).slice(0,4)});}).observe({type:'layout-shift',buffered:true});}catch(_){}
/* ---- home feed container (.hf-feed, home-feed.js) rebuilds ---- */
new MutationObserver(ms=>{const t=Math.round(now());for(const m of ms){const tg=m.target;
  if(tg.nodeType===1&&tg.classList&&tg.classList.contains('hf-feed')&&m.removedNodes.length)B.ev.push({type:'feed-rebuild',t,removed:m.removedNodes.length,added:m.addedNodes.length});
  for(const n of m.removedNodes)if(n.nodeType===1&&n.classList&&n.classList.contains('hf-feed'))B.ev.push({type:'feed-rebuild',t,removed:1,added:0,note:'.hf-feed element removed'});}}).observe(document,{childList:true,subtree:true});
/* ---- sampler ---- */
const vis=el=>{if(!el)return false;try{if(el.checkVisibility&&!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true,opacityProperty:true,visibilityProperty:true}))return false;}catch(_){}
  const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;
  const r=el.getBoundingClientRect();return r.width>1&&r.height>1&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;};
const norm=s=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
function sample(tag){
  const d=document,h=d.documentElement,ob=window.OceanBoot,cur=d.getElementById('obBoot');
  let covered=false,curOp=null;
  if(cur&&vis(cur)){const r=cur.getBoundingClientRect();curOp=+getComputedStyle(cur).opacity;covered=r.left<=1&&r.top<=1&&r.right>=innerWidth-1&&r.bottom>=innerHeight-1&&curOp>0.9;}
  const home=d.getElementById('home');
  let intro=false,heroText=!!B.lastHero;
  if(home){intro=[...home.querySelectorAll('.home-intro')].some(vis);
    if((B.n=(B.n||0)+1)%4===1)B.lastHero=heroText=[...home.querySelectorAll('h1,h2')].some(e=>/prends\\s*le\\s*large/.test(norm(e.innerText))&&vis(e));}
  const nav=d.querySelector('.nav'),btns=nav?[...nav.querySelectorAll('button')].filter(vis):[];
  const labelled=btns.filter(b=>norm((b.querySelector('.tab-label')||b).innerText||b.textContent).length>0);
  const toast=d.getElementById('toast');
  const nr=nav?nav.getBoundingClientRect():null;
  const fp=performance.getEntriesByName('first-paint')[0];
  B.s.push({t:Math.round(now()),tag:tag||null,fp:fp?Math.round(fp.startTime):null,
    boot:{has:!!ob,lifted:ob?!!ob.lifted:null,liftedAt:ob&&ob.liftedAt!=null?ob.liftedAt:null,reason:ob?ob.reason:null,t0:ob?ob.t0:null,booting:h.classList.contains('ob-booting'),curtain:!!cur,curtainVisible:!!cur&&vis(cur),covered},
    onb:vis(d.getElementById('onb')),intro,heroText,centerBtn:[...d.querySelectorAll('.nav .center')].some(vis),
    nav:{present:!!nav,visible:!!nav&&vis(nav),btns:btns.length,labelled:labelled.length,pillVisible:vis(d.getElementById('navPill')),left:nr?Math.round(nr.left):null,right:nr?Math.round(nr.right):null},
    hero:vis(d.querySelector('#home .hf-top'))||vis(d.querySelector('#home .hf-hero')),
    toast:!!toast&&/(^|\\s)show(\\s|$)/.test(toast.className)&&/bon retour/i.test(toast.textContent),
    hOverflow:Math.max(0,h.scrollWidth-innerWidth)});
}
window.addEventListener('ocean:home-ready',e=>{B.liftEvent={t:Math.round(now()),reason:e.detail&&e.detail.reason};sample('home-ready');});
setInterval(sample,100);
})();`;
};
